// iCalendar (RFC 5545) üretimi: Apple Takvim, Google Takvim ve Outlook aboneliği için.
// Akış salt okunurdur; abone olan kişinin takviminde yalnız bu akışın öğeleri görünür.

export interface IcsOlay {
  uid: string;
  baslik: string;
  /** Tüm gün ise YYYY-MM-DD, değilse ISO zaman damgası. */
  baslangic: string;
  /** Tüm gün ise son gün (dahil) YYYY-MM-DD, değilse ISO. Boşsa: tüm gün 1 gün, saatli 1 saat. */
  bitis?: string | null;
  tumGun: boolean;
  aciklama?: string | null;
  yer?: string | null;
  url?: string | null;
  /** Kaydın son değiştiği an (LAST-MODIFIED). */
  degisti?: string | null;
  /** Değişiklik sayacı (SEQUENCE); takvim uygulaması güncel sürümü bununla tanır. */
  sira?: number | null;
}

export interface IcsTakvim {
  /** Abonelikte takvimin adı. Tek toplantılık dosyada verilmez, kişi kendi takvimine ekler. */
  ad?: string;
  aciklama?: string;
  /** Apple Takvim'de takvimin rengi, #RRGGBB. */
  renk?: string;
  /** Abonelikse istemciye kaç dakikada bir yenileyeceğini söyler. */
  yenilemeDakika?: number;
}

function kacis(metin: string): string {
  return metin.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Satırı 75 bayttan uzunsa katlar; UTF-8 karakterini bölmez. */
function katla(satir: string): string {
  const enc = new TextEncoder();
  if (enc.encode(satir).length <= 75) return satir;
  const parcalar: string[] = [];
  let mevcut = '';
  let bayt = 0;
  for (const ch of satir) {
    const b = enc.encode(ch).length;
    const sinir = parcalar.length === 0 ? 75 : 74; // devam satırı başındaki boşluk 1 bayt
    if (bayt + b > sinir) {
      parcalar.push(mevcut);
      mevcut = '';
      bayt = 0;
    }
    mevcut += ch;
    bayt += b;
  }
  parcalar.push(mevcut);
  return parcalar.join('\r\n ');
}

function utcDamga(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function gunDamga(gun: string): string {
  return gun.replace(/-/g, '');
}

function sonrakiGun(gun: string): string {
  const d = new Date(`${gun}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function icsOlustur(takvim: IcsTakvim, olaylar: IcsOlay[], simdi: Date = new Date()): string {
  const damga = utcDamga(simdi.toISOString());
  const satirlar: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HYMF Portal//Takvim//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  if (takvim.ad) satirlar.push(`X-WR-CALNAME:${kacis(takvim.ad)}`);
  if (takvim.aciklama) satirlar.push(`X-WR-CALDESC:${kacis(takvim.aciklama)}`);
  if (takvim.ad) satirlar.push('X-WR-TIMEZONE:Europe/Istanbul');
  if (takvim.renk) satirlar.push(`X-APPLE-CALENDAR-COLOR:${takvim.renk}`);
  if (takvim.yenilemeDakika) {
    satirlar.push(
      `REFRESH-INTERVAL;VALUE=DURATION:PT${takvim.yenilemeDakika}M`,
      `X-PUBLISHED-TTL:PT${takvim.yenilemeDakika}M`,
    );
  }

  for (const o of olaylar) {
    satirlar.push('BEGIN:VEVENT', `UID:${o.uid}`, `DTSTAMP:${damga}`);
    if (o.tumGun) {
      const son = o.bitis && o.bitis >= o.baslangic ? o.bitis : o.baslangic;
      satirlar.push(`DTSTART;VALUE=DATE:${gunDamga(o.baslangic)}`, `DTEND;VALUE=DATE:${gunDamga(sonrakiGun(son))}`);
    } else {
      const bitis = o.bitis ?? new Date(new Date(o.baslangic).getTime() + 60 * 60 * 1000).toISOString();
      satirlar.push(`DTSTART:${utcDamga(o.baslangic)}`, `DTEND:${utcDamga(bitis)}`);
    }
    satirlar.push(`SUMMARY:${kacis(o.baslik)}`);
    if (o.aciklama) satirlar.push(`DESCRIPTION:${kacis(o.aciklama)}`);
    if (o.yer) satirlar.push(`LOCATION:${kacis(o.yer)}`);
    if (o.url) satirlar.push(`URL:${o.url}`);
    if (o.degisti) satirlar.push(`LAST-MODIFIED:${utcDamga(o.degisti)}`);
    if (o.sira != null && o.sira > 0) satirlar.push(`SEQUENCE:${Math.floor(o.sira)}`);
    satirlar.push('TRANSP:' + (o.tumGun ? 'TRANSPARENT' : 'OPAQUE'), 'END:VEVENT');
  }

  satirlar.push('END:VCALENDAR');
  return satirlar.map(katla).join('\r\n') + '\r\n';
}
