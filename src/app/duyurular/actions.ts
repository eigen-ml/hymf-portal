'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';
import { sendTelegramNotification } from '@/lib/telegram';
import type { AnnouncementPriority } from '@/types/database';

export type ActionSonucu = { ok: true } | { ok: false; error: string };
export type DuyuruEkleSonucu = { ok: true; telegramGonderildi: boolean } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ONCELIKLER: readonly AnnouncementPriority[] = ['acil', 'toplanti', 'soru_yardim', 'kaynak_paylasimi'];

function validateUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function validateOncelik(value: unknown): value is AnnouncementPriority {
  return typeof value === 'string' && ONCELIKLER.includes(value as AnnouncementPriority);
}

export async function duyuruEkle(input: {
  title: string;
  content: string;
  priority: AnnouncementPriority;
}): Promise<DuyuruEkleSonucu> {
  try {
    const ben = await requireMemberAction();

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const content = typeof input.content === 'string' ? input.content.trim() : '';

    if (!title) return { ok: false, error: 'Duyuru başlığı zorunludur.' };
    if (title.length > 200) return { ok: false, error: 'Başlık en fazla 200 karakter olabilir.' };
    if (!content) return { ok: false, error: 'Duyuru içeriği zorunludur.' };
    if (content.length > 5000) return { ok: false, error: 'İçerik en fazla 5000 karakter olabilir.' };
    if (!validateOncelik(input.priority)) return { ok: false, error: 'Geçersiz öncelik.' };

    // Telegram kaydın önünde gönderilir; başarısızlık duyuruyu engellemez.
    const telegram = await sendTelegramNotification({
      title,
      content,
      priority: input.priority,
      authorName: ben.full_name || 'HYMF Araştırmacısı',
      authorTitle: ben.academic_title || 'Araştırmacı',
    });

    const sb = await createClient();
    const { error } = await sb.from('announcements').insert({
      title,
      content,
      priority: input.priority,
      author_id: ben.id,
      telegram_sent: telegram.success,
      telegram_message_id: telegram.messageId ?? null,
    });

    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };

    revalidatePath('/duyurular');
    return { ok: true, telegramGonderildi: telegram.success };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/** Yazan veya yönetici düzenler; RLS zorlar. Telegram'a yeniden gönderilmez. */
export async function duyuruDuzenle(
  id: string,
  input: { title: string; content: string; priority: AnnouncementPriority }
): Promise<ActionSonucu> {
  try {
    await requireMemberAction();

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz duyuru ID.' };

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    const content = typeof input.content === 'string' ? input.content.trim() : '';

    if (!title) return { ok: false, error: 'Duyuru başlığı zorunludur.' };
    if (title.length > 200) return { ok: false, error: 'Başlık en fazla 200 karakter olabilir.' };
    if (!content) return { ok: false, error: 'Duyuru içeriği zorunludur.' };
    if (content.length > 5000) return { ok: false, error: 'İçerik en fazla 5000 karakter olabilir.' };
    if (!validateOncelik(input.priority)) return { ok: false, error: 'Geçersiz öncelik.' };

    const sb = await createClient();
    const { data, error } = await sb
      .from('announcements')
      .update({ title, content, priority: input.priority, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id');

    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Bu duyuruyu düzenleme yetkiniz yok.' };

    revalidatePath('/duyurular');
    revalidatePath('/');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function duyuruSil(id: string): Promise<ActionSonucu> {
  try {
    await requireMemberAction();

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz duyuru ID.' };

    const sb = await createClient();
    const { data, error } = await sb.from('announcements').delete().eq('id', id).select('id');

    if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
    // Yetkiyi veritabanı (RLS) uygular; satır dönmediyse silme yetkisi yoktur.
    if ((data ?? []).length === 0) return { ok: false, error: 'Bu duyuruyu silme yetkiniz yok.' };

    revalidatePath('/duyurular');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
