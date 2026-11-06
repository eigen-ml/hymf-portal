'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';
import { isAdmin } from '@/lib/yetki';

export type ActionSonucu = { ok: true } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Kişi kendi klasör bağlantısını, yönetici herkesinkini değiştirir. Asıl kural RLS'te (profil_guncelle). */
export async function sunumKlasoruKaydet(kisiId: string, baglanti: string): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (typeof kisiId !== 'string' || !UUID_REGEX.test(kisiId)) return { ok: false, error: 'Geçersiz kişi.' };
    if (kisiId !== ben.id && !isAdmin(ben)) return { ok: false, error: 'Yalnız kendi klasörünü değiştirebilirsin.' };

    const url = typeof baglanti === 'string' ? baglanti.trim() : '';
    if (url && !url.startsWith('https://')) return { ok: false, error: 'Bağlantı https:// ile başlamalı.' };
    if (url.length > 500) return { ok: false, error: 'Bağlantı çok uzun.' };

    const sb = await createClient();
    const { data, error } = await sb
      .from('profiles')
      .update({ sunum_klasoru: url || null })
      .eq('id', kisiId)
      .select('id');
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    if (!data?.length) return { ok: false, error: 'Kaydedilemedi (yetki yok ya da kişi bulunamadı).' };

    revalidatePath('/sunumlar');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
