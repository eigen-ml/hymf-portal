import 'server-only';

// Grup toplantısı eklenince, saati veya yeri değişince ya da silinince Telegram grubuna tek mesaj.
// Mesaj sesli gider. Gönderim hatası toplantı kaydını etkilemez, yalnız sunucu loguna düşer.
// .ics bağlantısı konmaz: Telegram'ın tarayıcısında oturum olmadığı için giriş sayfasına düşer.

import { CANLI_ADRES } from '@/lib/site';
import { htmlKacis, telegramGonder } from '@/lib/telegram';
import { toplantiBasligi, toplantiBitisi } from '@/lib/toplanti';
import type { Meeting } from '@/types/database';

export type BildirimToplantisi = Pick<Meeting, 'title' | 'meeting_date' | 'ends_at' | 'location' | 'notes'>;

const TZ = 'Europe/Istanbul';
const gunBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const haftaGunuBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long' });
const kisaGunBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'short' });
const saatBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const gunAnahtari = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

const NOT_SINIRI = 300;
const PORTAL = `${CANLI_ADRES}/toplantilar`;

/** "Cuma 16 Ekim" */
function gun(iso: string): string {
  const p = Object.fromEntries(gunBicimi.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.day} ${p.month}`;
}

function saat(iso: string): string {
  return saatBicimi.format(new Date(iso));
}

function ayniGun(a: string, b: string): boolean {
  return gunAnahtari.format(new Date(a)) === gunAnahtari.format(new Date(b));
}

/** "Cuma 16 Ekim, 10:00–11:00" */
function zamanMetni(t: BildirimToplantisi): string {
  const bitis = toplantiBitisi(t);
  return ayniGun(t.meeting_date, bitis)
    ? `${gun(t.meeting_date)}, ${saat(t.meeting_date)}–${saat(bitis)}`
    : `${gun(t.meeting_date)} ${saat(t.meeting_date)} – ${gun(bitis)} ${saat(bitis)}`;
}

function yerEki(t: BildirimToplantisi): string {
  return t.location ? ` · ${htmlKacis(t.location)}` : '';
}

function notSatiri(t: BildirimToplantisi): string | null {
  const not = t.notes?.trim();
  if (!not) return null;
  const kisa = not.length > NOT_SINIRI ? `${not.slice(0, NOT_SINIRI).trimEnd()}…` : not;
  return `Not: ${htmlKacis(kisa)}`;
}

function utcDamga(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Giriş istemeyen "Google Takvim'e ekle" bağlantısı. Haftalık seride tek bağlantı tüm haftaları ekler. */
function googleBaglantisi(t: BildirimToplantisi, hafta = 1): string {
  const not = t.notes?.trim();
  const parametreler: [string, string][] = [
    ['action', 'TEMPLATE'],
    ['text', toplantiBasligi(t.title)],
    ['dates', `${utcDamga(t.meeting_date)}/${utcDamga(toplantiBitisi(t))}`],
    ['details', [not && not.length > 1000 ? `${not.slice(0, 1000)}…` : not, `Portalda: ${PORTAL}`].filter(Boolean).join('\n\n')],
  ];
  if (t.location) parametreler.push(['location', t.location]);
  if (hafta > 1) parametreler.push(['recur', `RRULE:FREQ=WEEKLY;COUNT=${hafta}`]);
  const sorgu = parametreler.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `https://calendar.google.com/calendar/render?${sorgu}`;
}

function mesaj(satirlar: (string | null)[]): string {
  return satirlar.filter((s): s is string => s !== null).join('\n');
}

function googleSatiri(t: BildirimToplantisi, hafta = 1): string {
  return `<a href="${htmlKacis(googleBaglantisi(t, hafta))}">Google Takvim'e ekle</a>`;
}

/** Bitmiş toplantı için bildirim gönderilmez (ör. geçmiş toplantıya not eklemek). */
function gecmisMi(t: BildirimToplantisi): boolean {
  return Date.parse(toplantiBitisi(t)) < Date.now();
}

async function gonder(html: string, olay: string) {
  const sonuc = await telegramGonder(html, { sessiz: false });
  if (!sonuc.ok && !sonuc.atlandi) console.error(`[Toplantı bildirimi] ${olay} gönderilemedi: ${sonuc.hata}`);
}

/** Yeni toplantı; `hafta` > 1 ise aynı gün ve saatte haftalık seri (her hafta ayrı kayıt). */
export async function toplantiEklendiBildir(ilk: BildirimToplantisi, hafta: number) {
  if (gecmisMi(ilk)) return;
  let zaman = zamanMetni(ilk);
  if (hafta > 1) {
    const sonBaslangic = new Date(Date.parse(ilk.meeting_date) + (hafta - 1) * 7 * 86_400_000).toISOString();
    const gunAdi = haftaGunuBicimi.format(new Date(ilk.meeting_date));
    zaman =
      `Her ${gunAdi} ${saat(ilk.meeting_date)}–${saat(toplantiBitisi(ilk))}, ${hafta} hafta ` +
      `(${kisaGunBicimi.format(new Date(ilk.meeting_date))} – ${kisaGunBicimi.format(new Date(sonBaslangic))})`;
  }
  await gonder(
    mesaj([
      `<b>Grup toplantısı:</b> ${htmlKacis(ilk.title)}`,
      `${zaman}${yerEki(ilk)}`,
      notSatiri(ilk),
      googleSatiri(ilk, hafta),
      `Portalda: ${PORTAL}`,
    ]),
    'ekleme',
  );
}

/** Saat veya yer değiştiyse mesaj gider; yalnız başlık, not veya sunum değiştiyse gitmez. */
export async function toplantiDegistiBildir(eski: BildirimToplantisi, yeni: BildirimToplantisi) {
  const eskiBitis = toplantiBitisi(eski);
  const yeniBitis = toplantiBitisi(yeni);
  const baslangicDegisti = Date.parse(eski.meeting_date) !== Date.parse(yeni.meeting_date);
  const bitisDegisti = Date.parse(eskiBitis) !== Date.parse(yeniBitis);
  const yerDegisti = (eski.location ?? '') !== (yeni.location ?? '');
  if (!baslangicDegisti && !bitisDegisti && !yerDegisti) return;
  if (gecmisMi(eski) && gecmisMi(yeni)) return;

  let saatSatiri: string | null = null;
  if (baslangicDegisti) {
    const yeniBas = ayniGun(eski.meeting_date, yeni.meeting_date) ? saat(yeni.meeting_date) : `${gun(yeni.meeting_date)} ${saat(yeni.meeting_date)}`;
    saatSatiri = `Saat değişti: ${gun(eski.meeting_date)} ${saat(eski.meeting_date)} → ${yeniBas}`;
  } else if (bitisDegisti) {
    saatSatiri = `Bitiş değişti: ${saat(eskiBitis)} → ${saat(yeniBitis)}`;
  }

  let yerSatiri: string | null = null;
  if (yerDegisti) {
    yerSatiri = yeni.location
      ? `Yer değişti: ${eski.location ? `${htmlKacis(eski.location)} → ` : ''}${htmlKacis(yeni.location)}`
      : 'Yer bilgisi kaldırıldı.';
  }

  await gonder(
    mesaj([
      `<b>Grup toplantısı değişti:</b> ${htmlKacis(yeni.title)}`,
      saatSatiri,
      yerSatiri,
      `${zamanMetni(yeni)}${yerEki(yeni)}`,
      googleSatiri(yeni),
      `Portalda: ${PORTAL}`,
    ]),
    'değişiklik',
  );
}

export async function toplantiSilindiBildir(t: BildirimToplantisi) {
  if (gecmisMi(t)) return;
  await gonder(
    mesaj([`<b>İptal:</b> Grup toplantısı: ${htmlKacis(t.title)}`, `${zamanMetni(t)}${yerEki(t)}`, `Portalda: ${PORTAL}`]),
    'iptal',
  );
}
