import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceFile, WorkspaceLog } from '@/types/database';
import { ok, hata, basarisiz, BOYUT_HATASI, TUR_HATASI, BULUNAMADI_VEYA_YETKI_YOK } from './_sonuc';
import type { Sonuc } from './_sonuc';
import { guvenliDosyaAdi } from '@/lib/calisma/hesap';

export const DOSYA_SINIRI_BAYT = 10_485_760; // 10 MB (bucket file_size_limit ile aynı)
export const KOTA_BAYT = 104_857_600; // 100 MB, kişi başı (public.dosya_kotasi_bayt ile aynı)

export const IZINLI_MIME_TURLERI = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export async function listFiles(
  sb: SupabaseClient,
  workspaceId: string,
): Promise<Sonuc<WorkspaceFile[]>> {
  try {
    const { data, error } = await sb
      .from('workspace_files')
      .select('*, uploader:profiles!workspace_files_uploaded_by_fkey(id, full_name, academic_title, kadro)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) return hata(error);
    return ok((data ?? []) as WorkspaceFile[]);
  } catch (e) {
    return hata(e);
  }
}

export async function uploadFile(
  sb: SupabaseClient,
  input: {
    workspaceId: string;
    file: File;
    planItemId?: string | null;
    notes?: string | null;
  },
): Promise<Sonuc<WorkspaceFile>> {
  try {
    // Boyut kontrolü
    if (input.file.size > DOSYA_SINIRI_BAYT) {
      return basarisiz(BOYUT_HATASI);
    }

    // MIME türü belirle
    let mimeType: string = input.file.type;
    if (!mimeType) {
      const ext = input.file.name.toLowerCase().split('.').pop() || '';
      switch (ext) {
        case 'csv':
          mimeType = 'text/csv';
          break;
        case 'txt':
        case 'dat':
          mimeType = 'text/plain';
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          mimeType = 'application/octet-stream';
      }
    }

    // MIME türü kontrolü
    if (!IZINLI_MIME_TURLERI.includes(mimeType as typeof IZINLI_MIME_TURLERI[number])) {
      return basarisiz(TUR_HATASI);
    }

    // Yol: ${workspaceId}/${uuid}-${guvenliDosyaAdi}
    const uuid = crypto.randomUUID();
    const safeName = guvenliDosyaAdi(input.file.name);
    const storagePath = `${input.workspaceId}/${uuid}-${safeName}`;

    // Storage'a yükle
    const { error: uploadError } = await sb.storage
      .from('workspace-files')
      .upload(storagePath, input.file, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return hata(uploadError);
    }

    // DB'ye kaydı ekle
    const { data, error: insertError } = await sb
      .from('workspace_files')
      .insert([
        {
          workspace_id: input.workspaceId,
          plan_item_id: input.planItemId ?? null,
          file_name: input.file.name,
          storage_path: storagePath,
          size_bytes: input.file.size,
          mime_type: mimeType,
          notes: input.notes ?? null,
          // uploaded_by göndermez
        },
      ])
      .select('*, uploader:profiles!workspace_files_uploaded_by_fkey(id, full_name, academic_title, kadro)')
      .single();

    if (insertError) {
      // Yüklenen nesneyi sil
      await sb.storage.from('workspace-files').remove([storagePath]);
      return hata(insertError);
    }

    return ok(data as WorkspaceFile);
  } catch (e) {
    return hata(e);
  }
}

export async function getDownloadUrl(
  sb: SupabaseClient,
  storagePath: string,
): Promise<Sonuc<string>> {
  try {
    const { data, error } = await sb.storage
      .from('workspace-files')
      .createSignedUrl(storagePath, 60);

    if (error) return hata(error);
    return ok(data.signedUrl);
  } catch (e) {
    return hata(e);
  }
}

export async function deleteFile(
  sb: SupabaseClient,
  file: Pick<WorkspaceFile, 'id' | 'storage_path'>,
): Promise<Sonuc<null>> {
  try {
    // Önce DB satırını sil
    const { data: silinen, error: deleteError } = await sb
      .from('workspace_files')
      .delete()
      .eq('id', file.id)
      .select('id');

    if (deleteError) {
      return hata(deleteError);
    }
    // RLS silmeyi engellerse hata yerine 0 satır döner.
    if (!silinen || silinen.length === 0) return basarisiz(BULUNAMADI_VEYA_YETKI_YOK);

    // Storage'dan sil (hata olursa sessizce geç)
    if (file.storage_path) {
      const { error: storageError } = await sb.storage
        .from('workspace-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Storage silme hatası:', storageError);
      }
    }

    return ok(null);
  } catch (e) {
    return hata(e);
  }
}

export async function listWorkspaceLogs(
  sb: SupabaseClient,
  workspaceId: string,
  limit = 50,
): Promise<Sonuc<WorkspaceLog[]>> {
  try {
    const { data, error } = await sb
      .from('workspace_logs')
      .select('*, actor:profiles!workspace_logs_actor_id_fkey(id, full_name, academic_title, kadro)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return hata(error);
    return ok((data ?? []) as WorkspaceLog[]);
  } catch (e) {
    return hata(e);
  }
}
