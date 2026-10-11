import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';
import { isMember } from '@/lib/yetki';

export interface OturumKullanicisi {
  id: string;
  email: string | null;
  /** Yönetici şifre verdi veya sıfırladı; kişi kendi şifresini belirleyene kadar portalı kullanamaz. */
  sifreDegistirmeli: boolean;
}

/** app_metadata yalnız servis anahtarıyla yazılır; kullanıcı kendisi değiştiremez. */
export function sifreDegistirmeliMi(claims: { app_metadata?: unknown } | null | undefined): boolean {
  const meta = claims?.app_metadata as Record<string, unknown> | undefined;
  return meta?.sifre_degistir === true;
}

export const getOturumKullanicisi = cache(async (): Promise<OturumKullanicisi | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // getClaims JWT imzasını doğrular; ayrıca getUser ile auth sunucusuna gitmeye gerek yok.
  const claims = data?.claims;
  if (!claims?.sub) {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === 'string' ? claims.email : null,
    sifreDegistirmeli: sifreDegistirmeliMi(claims),
  };
});

export const getMevcutProfil = cache(async (): Promise<Profile | null> => {
  const kullanici = await getOturumKullanicisi();
  if (!kullanici) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', kullanici.id)
    .maybeSingle();

  return (data as Profile) || null;
});

export async function requireMember(): Promise<Profile> {
  const profil = await getMevcutProfil();

  if (!profil) {
    redirect('/giris');
  }

  if ((await getOturumKullanicisi())?.sifreDegistirmeli) {
    redirect('/sifre-yenile');
  }

  if (!isMember(profil)) {
    redirect('/onay-bekleniyor');
  }

  return profil;
}

/** Server action'lar için: yönlendirmek yerine hata fırlatır (action'lar try/catch içinde çağırır). */
export async function requireMemberAction(): Promise<Profile> {
  const profil = await getMevcutProfil();

  if (!profil) {
    throw new Error('Bu işlem için oturum açmanız gerekir.');
  }

  if ((await getOturumKullanicisi())?.sifreDegistirmeli) {
    throw new Error('Önce kendi şifrenizi belirleyin.');
  }

  if (!isMember(profil)) {
    throw new Error('Bu işlem için yetkiniz yok.');
  }

  return profil;
}

export async function requireAdminAction(): Promise<Profile> {
  const profil = await getMevcutProfil();

  if (!profil) {
    throw new Error('Bu işlem için oturum açmanız gerekir.');
  }

  if ((await getOturumKullanicisi())?.sifreDegistirmeli) {
    throw new Error('Önce kendi şifrenizi belirleyin.');
  }

  if (!isMember(profil) || (profil.yetki !== 'admin' && profil.yetki !== 'superadmin')) {
    throw new Error('Bu işlem için yetkiniz yok.');
  }

  return profil;
}
