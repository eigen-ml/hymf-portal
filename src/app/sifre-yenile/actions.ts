'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOturumKullanicisi } from '@/lib/auth/dal';

export type SifreSonucu = { ok: true } | { ok: false; error: string };

const EN_AZ = 8;
const EN_FAZLA = 72; // bcrypt sınırı

/**
 * Oturumdaki kişinin şifresini değiştirir. Yöneticinin verdiği geçici şifreyle girilmişse
 * "şifre değiştirmeli" bayrağı yalnız şifre gerçekten değiştikten sonra kaldırılır.
 */
export async function sifreyiDegistir(yeniSifre: string): Promise<SifreSonucu> {
  try {
    const kullanici = await getOturumKullanicisi();
    if (!kullanici) return { ok: false, error: 'Oturumunuz kapanmış. Yeniden giriş yapın.' };

    if (typeof yeniSifre !== 'string' || yeniSifre.length < EN_AZ) {
      return { ok: false, error: `Şifre en az ${EN_AZ} karakter olmalı.` };
    }
    if (yeniSifre.length > EN_FAZLA) return { ok: false, error: `Şifre en fazla ${EN_FAZLA} karakter olabilir.` };

    const sb = await createClient();
    const { error } = await sb.auth.updateUser({ password: yeniSifre });
    if (error) {
      if (error.code === 'same_password') {
        return { ok: false, error: 'Yeni şifre, yöneticinin verdiği şifreyle aynı olamaz.' };
      }
      if (error.code === 'weak_password') {
        return { ok: false, error: 'Bu şifre çok zayıf. Harf ve rakam karışık, daha uzun bir şifre seçin.' };
      }
      return { ok: false, error: 'Şifre güncellenemedi: ' + error.message };
    }

    if (kullanici.sifreDegistirmeli) {
      const admin = createAdminClient();
      if (!admin) return { ok: false, error: 'Şifre değişti ama sunucu ayarı eksik (SUPABASE_SERVICE_ROLE_KEY). Yöneticiye yazın.' };
      const { error: bayrakHatasi } = await admin.auth.admin.updateUserById(kullanici.id, {
        app_metadata: { sifre_degistir: false },
      });
      if (bayrakHatasi) return { ok: false, error: 'Şifre değişti ama hesap güncellenemedi: ' + bayrakHatasi.message };
      // Yeni bayrağın oturum anahtarına (JWT) geçmesi için oturumu tazele.
      await sb.auth.refreshSession();
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
