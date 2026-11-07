'use server';

import { revalidatePath } from 'next/cache';
import { ANAHTAR_BICIMI, anonIstemci } from '@/lib/data/hocaLinki';

export type ActionSonucu = { ok: true } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Oturum yok: yetki, anahtarı veritabanında doğrulayan fonksiyonlardan gelir.

export async function hocaNotuEkle(anahtar: string, uyeId: string, govde: string): Promise<ActionSonucu> {
  if (typeof anahtar !== 'string' || !ANAHTAR_BICIMI.test(anahtar)) return { ok: false, error: 'Link geçersiz.' };
  if (typeof uyeId !== 'string' || !UUID_REGEX.test(uyeId)) return { ok: false, error: 'Geçersiz kişi.' };
  const metin = typeof govde === 'string' ? govde.trim() : '';
  if (!metin) return { ok: false, error: 'Not boş olamaz.' };
  if (metin.length > 2000) return { ok: false, error: 'Not en çok 2000 karakter olabilir.' };

  const sb = anonIstemci();
  if (!sb) return { ok: false, error: 'Site yapılandırması eksik.' };
  const { data, error } = await sb.rpc('hoca_notu_ekle', { p_anahtar: anahtar, p_uye: uyeId, p_govde: metin });
  if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
  if (!data) return { ok: false, error: 'Kaydedilemedi (link geçersiz ya da kişi bulunamadı).' };

  revalidatePath(`/hoca/${anahtar}`);
  revalidatePath('/sunumlar');
  return { ok: true };
}

export async function hocaNotuSil(anahtar: string, notId: string): Promise<ActionSonucu> {
  if (typeof anahtar !== 'string' || !ANAHTAR_BICIMI.test(anahtar)) return { ok: false, error: 'Link geçersiz.' };
  if (typeof notId !== 'string' || !UUID_REGEX.test(notId)) return { ok: false, error: 'Geçersiz not.' };

  const sb = anonIstemci();
  if (!sb) return { ok: false, error: 'Site yapılandırması eksik.' };
  const { data, error } = await sb.rpc('hoca_notu_sil', { p_anahtar: anahtar, p_not: notId });
  if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
  if (!data) return { ok: false, error: 'Silinemedi (not bulunamadı).' };

  revalidatePath(`/hoca/${anahtar}`);
  revalidatePath('/sunumlar');
  return { ok: true };
}
