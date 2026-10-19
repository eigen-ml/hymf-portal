'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';

export type ActionSonucu = { ok: true } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GOVDE_MAX = 2000;

async function calistir(is: () => Promise<string | null>): Promise<ActionSonucu> {
  try {
    const hata = await is();
    if (hata) return { ok: false, error: hata };
    revalidatePath('/calisma-alani');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function notEkle(tur: 'not' | 'fikir', govde: string): Promise<ActionSonucu> {
  return calistir(async () => {
    const ben = await requireMemberAction();
    if (tur !== 'not' && tur !== 'fikir') return 'Geçersiz tür.';
    const metin = typeof govde === 'string' ? govde.trim() : '';
    if (!metin) return 'Boş not eklenemez.';
    if (metin.length > GOVDE_MAX) return `Not ${GOVDE_MAX} karakteri aşamaz.`;

    const sb = await createClient();
    const { error } = await sb.from('notlar').insert({ tur, govde: metin, yazar_id: ben.id });
    return error ? 'Kaydedilemedi: ' + error.message : null;
  });
}

// Yetkiyi RLS denetler: herkes yalnız kendi notunu işaretler ve siler (yönetici her notu siler).
export async function notIsaretle(id: string, yapildi: boolean): Promise<ActionSonucu> {
  return calistir(async () => {
    await requireMemberAction();
    if (!UUID_REGEX.test(id)) return 'Geçersiz not.';
    const sb = await createClient();
    const { data, error } = await sb.from('notlar').update({ yapildi: !!yapildi }).eq('id', id).select('id');
    if (error) return 'Kaydedilemedi: ' + error.message;
    return data?.length ? null : 'Bu notu yalnız yazan işaretleyebilir.';
  });
}

/** Yalnız yazan, kendi notunun metnini düzeltir; RLS zorlar. */
export async function notDuzenle(id: string, govde: string): Promise<ActionSonucu> {
  return calistir(async () => {
    await requireMemberAction();
    if (!UUID_REGEX.test(id)) return 'Geçersiz not.';
    const metin = typeof govde === 'string' ? govde.trim() : '';
    if (!metin) return 'Not boş olamaz.';
    if (metin.length > GOVDE_MAX) return `Not ${GOVDE_MAX} karakteri aşamaz.`;
    const sb = await createClient();
    const { data, error } = await sb.from('notlar').update({ govde: metin }).eq('id', id).select('id');
    if (error) return 'Kaydedilemedi: ' + error.message;
    return data?.length ? null : 'Bu notu yalnız yazan düzenleyebilir.';
  });
}

export async function notSil(id: string): Promise<ActionSonucu> {
  return calistir(async () => {
    await requireMemberAction();
    if (!UUID_REGEX.test(id)) return 'Geçersiz not.';
    const sb = await createClient();
    const { data, error } = await sb.from('notlar').delete().eq('id', id).select('id');
    if (error) return 'Silinemedi: ' + error.message;
    return data?.length ? null : 'Bu notu yalnız yazan silebilir.';
  });
}
