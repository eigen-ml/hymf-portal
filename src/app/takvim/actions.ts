'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';
import { takvimAnahtariniGetir, yeniTakvimAnahtari } from '@/lib/data/takvim';

export type ActionSonucu = { ok: true } | { ok: false; error: string };
export type AnahtarSonucu = { ok: true; token: string } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUN_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const BASLIK_MAX = 200;
const YER_MAX = 300;
const NOT_MAX = 5000;

function yenile() {
  revalidatePath('/takvim');
  revalidatePath('/');
}

export interface EtkinlikGirdisi {
  title: string;
  /** Tüm gün ise YYYY-MM-DD, değilse istemcinin ISO'ya çevirdiği zaman. */
  starts_at: string;
  /** Boş olabilir. */
  ends_at: string;
  all_day: boolean;
  location: string;
  notes: string;
}

function zamanCoz(deger: string, tumGun: boolean): string | null {
  if (tumGun) {
    // Tüm gün etkinlik İstanbul'da o günün öğlesine yazılır; gün hiçbir saat diliminde kaymaz.
    if (!GUN_REGEX.test(deger) || Number.isNaN(Date.parse(deger))) return null;
    return `${deger}T09:00:00Z`;
  }
  const t = Date.parse(deger);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

type EtkinlikAlanlari = {
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location: string | null;
  notes: string | null;
};

/** Girdiyi denetler; hata varsa mesajı döner. */
function etkinlikDenetle(input: EtkinlikGirdisi): EtkinlikAlanlari | string {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) return 'Etkinlik adı zorunludur.';
  if (title.length > BASLIK_MAX) return `Ad ${BASLIK_MAX} karakteri aşamaz.`;

  const tumGun = input.all_day === true;
  const baslangic = typeof input.starts_at === 'string' ? zamanCoz(input.starts_at.trim(), tumGun) : null;
  if (!baslangic) return 'Geçerli bir tarih girin.';

  let bitis: string | null = null;
  if (typeof input.ends_at === 'string' && input.ends_at.trim()) {
    bitis = zamanCoz(input.ends_at.trim(), tumGun);
    if (!bitis) return 'Geçerli bir bitiş tarihi girin.';
    if (bitis < baslangic) return 'Bitiş, başlangıçtan önce olamaz.';
  }

  const location = typeof input.location === 'string' ? input.location.trim() : '';
  if (location.length > YER_MAX) return `Yer ${YER_MAX} karakteri aşamaz.`;
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (notes.length > NOT_MAX) return `Not ${NOT_MAX} karakteri aşamaz.`;

  return { title, starts_at: baslangic, ends_at: bitis, all_day: tumGun, location: location || null, notes: notes || null };
}

export async function etkinlikEkle(input: EtkinlikGirdisi): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();

    const alanlar = etkinlikDenetle(input);
    if (typeof alanlar === 'string') return { ok: false, error: alanlar };

    const sb = await createClient();
    const { error } = await sb.from('calendar_events').insert({ ...alanlar, creator_id: ben.id });
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/** Ekleyen kişi (veya yönetici) düzenler; RLS zorlar, ekleyen değişmez (trigger). */
export async function etkinlikDuzenle(id: string, input: EtkinlikGirdisi): Promise<ActionSonucu> {
  try {
    await requireMemberAction();
    if (typeof id !== 'string' || !UUID_REGEX.test(id)) return { ok: false, error: 'Geçersiz kayıt.' };

    const alanlar = etkinlikDenetle(input);
    if (typeof alanlar === 'string') return { ok: false, error: alanlar };

    const sb = await createClient();
    const { data, error } = await sb.from('calendar_events').update(alanlar).eq('id', id).select('id');
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Yalnız kendi eklediğiniz etkinliği düzenleyebilirsiniz.' };

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/** Yalnız ekleyen kişi (veya yönetici) siler; RLS zorlar. */
export async function etkinlikSil(id: string): Promise<ActionSonucu> {
  try {
    await requireMemberAction();
    if (typeof id !== 'string' || !UUID_REGEX.test(id)) return { ok: false, error: 'Geçersiz kayıt.' };

    const sb = await createClient();
    const { data, error } = await sb.from('calendar_events').delete().eq('id', id).select('id');
    if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Yalnız kendi eklediğiniz etkinliği silebilirsiniz.' };

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/**
 * Kişinin takvim abonelik anahtarı; yoksa oluşturur. Sayfalar anahtarı sunucuda hazırlar; bu
 * action yalnız o adım hata verdiyse paneldeki "Bağlantıyı oluştur" düğmesiyle çağrılır.
 */
export async function takvimAnahtarim(): Promise<AnahtarSonucu> {
  try {
    const ben = await requireMemberAction();
    return { ok: true, token: await takvimAnahtariniGetir(ben.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/** Eski bağlantıyı geçersiz kılar, yenisini verir (bağlantı başkasının eline geçtiyse). */
export async function takvimAnahtariniYenile(): Promise<AnahtarSonucu> {
  try {
    const ben = await requireMemberAction();
    const sb = await createClient();
    const token = yeniTakvimAnahtari();
    const { error } = await sb
      .from('calendar_feed_tokens')
      .upsert({ user_id: ben.id, token, created_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) return { ok: false, error: 'Bağlantı yenilenemedi: ' + error.message };
    return { ok: true, token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
