'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';
import { toplantiDegistiBildir, toplantiEklendiBildir, toplantiSilindiBildir } from '@/lib/toplantiBildirimi';
import { isAdmin, isHoca } from '@/lib/yetki';

export type ActionSonucu = { ok: true } | { ok: false; error: string };

export interface ToplantiGirdisi {
  title: string;
  /** İstemci İstanbul saatini ISO'ya çevirip gönderir. */
  meeting_date: string;
  /** Boşsa toplantı 1 saat sayılır. */
  ends_at?: string;
  location?: string;
  notes: string;
  presentation_url: string;
  /** 0: tek toplantı. 1–20: aynı gün ve saatte bu kadar hafta daha eklenir. */
  tekrar_hafta?: number;
}

export type ToplantiDuzenlemesi = Omit<ToplantiGirdisi, 'tekrar_hafta'>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\//i;
const BASLIK_MAX = 200;
const YER_MAX = 300;
const NOT_MAX = 5000;
const URL_MAX = 2000;
const TEKRAR_MAX = 20;
const SURE_MAX_MS = 12 * 60 * 60 * 1000;
const HAFTA_MS = 7 * 24 * 60 * 60 * 1000;

/** Bildirim ve karşılaştırma için okunan alanlar. */
const BILDIRIM_ALANLARI = 'title, meeting_date, ends_at, location, notes';

type TemizGirdi = {
  title: string;
  meeting_date: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  presentation_url: string | null;
};

function temizle(input: ToplantiDuzenlemesi): TemizGirdi | string {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) return 'Toplantı başlığı zorunludur.';
  if (title.length > BASLIK_MAX) return `Başlık ${BASLIK_MAX} karakteri aşamaz.`;

  const baslangic = typeof input.meeting_date === 'string' ? Date.parse(input.meeting_date) : NaN;
  if (Number.isNaN(baslangic)) return 'Geçerli bir tarih ve saat girin.';

  let ends_at: string | null = null;
  if (typeof input.ends_at === 'string' && input.ends_at.trim()) {
    const bitis = Date.parse(input.ends_at);
    if (Number.isNaN(bitis)) return 'Geçerli bir bitiş saati girin.';
    if (bitis <= baslangic) return 'Bitiş saati başlangıçtan sonra olmalı.';
    if (bitis - baslangic > SURE_MAX_MS) return 'Toplantı en çok 12 saat sürebilir.';
    ends_at = new Date(bitis).toISOString();
  }

  const location = typeof input.location === 'string' ? input.location.trim() : '';
  if (location.length > YER_MAX) return `Yer ${YER_MAX} karakteri aşamaz.`;

  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (notes.length > NOT_MAX) return `Notlar ${NOT_MAX} karakteri aşamaz.`;

  const presentationUrl = typeof input.presentation_url === 'string' ? input.presentation_url.trim() : '';
  if (presentationUrl) {
    if (presentationUrl.length > URL_MAX) return 'Bağlantı çok uzun.';
    if (!URL_REGEX.test(presentationUrl)) return 'Sunum bağlantısı http:// veya https:// ile başlamalıdır.';
  }

  return {
    title,
    meeting_date: new Date(baslangic).toISOString(),
    ends_at,
    location: location || null,
    notes: notes || null,
    presentation_url: presentationUrl || null,
  };
}

function yenile() {
  revalidatePath('/toplantilar');
  revalidatePath('/takvim');
  revalidatePath('/');
}

export async function toplantiEkle(input: ToplantiGirdisi): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!isHoca(ben) && !isAdmin(ben)) {
      return { ok: false, error: 'Grup toplantısını hocalar ve yöneticiler ekler.' };
    }

    const girdi = temizle(input);
    if (typeof girdi === 'string') return { ok: false, error: girdi };

    const tekrar = input.tekrar_hafta ?? 0;
    if (!Number.isInteger(tekrar) || tekrar < 0 || tekrar > TEKRAR_MAX) {
      return { ok: false, error: `Tekrar en fazla ${TEKRAR_MAX} hafta olabilir.` };
    }

    // Haftalık tekrar: her hafta ayrı kayıt, böylece her toplantının notu ayrı tutulur ve tek
    // tek düzenlenip silinebilir. Saat UTC'de 7 gün eklenerek korunur (Türkiye'de yaz saati yok).
    const ilk = Date.parse(girdi.meeting_date);
    const sure = girdi.ends_at ? Date.parse(girdi.ends_at) - ilk : null;
    const satirlar = Array.from({ length: tekrar + 1 }, (_, i) => ({
      ...girdi,
      meeting_date: new Date(ilk + i * HAFTA_MS).toISOString(),
      ends_at: sure === null ? null : new Date(ilk + i * HAFTA_MS + sure).toISOString(),
      creator_id: ben.id,
    }));

    const sb = await createClient();
    const { error } = await sb.from('meetings').insert(satirlar);
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };

    // Tek mesaj, seri olsa da. Yanıttan sonra gider; Telegram hatası kaydı etkilemez.
    after(() => toplantiEklendiBildir(satirlar[0], satirlar.length));

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/** Ekleyen, hoca veya yönetici düzenler; RLS zorlar. Seri toplantıda yalnız bu hafta değişir. */
export async function toplantiDuzenle(id: string, input: ToplantiDuzenlemesi): Promise<ActionSonucu> {
  try {
    await requireMemberAction();
    if (typeof id !== 'string' || !UUID_REGEX.test(id)) return { ok: false, error: 'Geçersiz kayıt.' };

    const girdi = temizle(input);
    if (typeof girdi === 'string') return { ok: false, error: girdi };

    const sb = await createClient();
    const { data: eski, error: okumaHatasi } = await sb.from('meetings').select(BILDIRIM_ALANLARI).eq('id', id).maybeSingle();
    if (okumaHatasi) return { ok: false, error: 'Toplantı okunamadı: ' + okumaHatasi.message };
    if (!eski) return { ok: false, error: 'Toplantı bulunamadı.' };

    const { data, error } = await sb.from('meetings').update(girdi).eq('id', id).select(BILDIRIM_ALANLARI);
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    const yeni = data?.[0];
    if (!yeni) return { ok: false, error: 'Bu toplantıyı düzenleme yetkiniz yok.' };

    after(() => toplantiDegistiBildir(eski, yeni));

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function toplantiSil(id: string): Promise<ActionSonucu> {
  try {
    await requireMemberAction();

    if (typeof id !== 'string' || !UUID_REGEX.test(id)) return { ok: false, error: 'Geçersiz kayıt.' };

    const sb = await createClient();
    const { data, error } = await sb.from('meetings').delete().eq('id', id).select(BILDIRIM_ALANLARI);

    if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
    const silinen = data?.[0];
    if (!silinen) return { ok: false, error: 'Bu kaydı silme yetkiniz yok.' };

    after(() => toplantiSilindiBildir(silinen));

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
