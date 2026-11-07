import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { SunumNotu } from '@/components/SunumNotlari';

// Hocanın giriş yapmadan açtığı /hoca/<anahtar> sayfasının verisi. Oturum yok; anahtar veritabanında
// hoca_sunumlari() / hoca_notu_ekle() / hoca_notu_sil() içinde doğrulanır
// (bkz. supabase/migrations/20261107010000_hoca_linki.sql).

export type HocaUyesi = { id: string; ad: string; klasor: string; notlar: SunumNotu[] };

export const ANAHTAR_BICIMI = /^[A-Za-z0-9_-]{32,128}$/;

export function anonIstemci() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Anahtar yanlışsa ya da okunamazsa null. */
export async function hocaSunumlari(anahtar: string): Promise<HocaUyesi[] | null> {
  if (!ANAHTAR_BICIMI.test(anahtar)) return null;
  const sb = anonIstemci();
  if (!sb) return null;
  const { data, error } = await sb.rpc('hoca_sunumlari', { p_anahtar: anahtar });
  if (error || !Array.isArray(data)) return null;
  return data as HocaUyesi[];
}
