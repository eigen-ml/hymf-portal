// Takvim ekranının saf yardımcıları. Hem sunucuda (page.tsx) hem tarayıcıda çalışır.
// İstanbul saati yıl boyunca UTC+3'tür (yaz saati yok); günler YYYY-MM-DD metni olarak taşınır.

import type { GorevDurum, TakvimOgesi, TakvimOgesiTuru } from '@/types/database';
import type { RozetTonu } from '@/components/ui';

const TZ = 'Europe/Istanbul';

export const HAFTA_GUNLERI = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;

export const TUR_ETIKETI: Record<TakvimOgesiTuru, string> = {
  toplanti: 'Toplantı',
  etkinlik: 'Etkinlik',
  gorev: 'Görev',
};

export const GOREV_DURUM_ETIKETI: Record<GorevDurum, string> = {
  acik: 'Açık',
  teslim_edildi: 'Teslim edildi',
  tamamlandi: 'Tamamlandı',
};

const ayBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, month: 'long', year: 'numeric' });
const gunBasligiBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long', weekday: 'long' });
const kisaAyBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, month: 'short' });
const saatBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function gunTarihi(gun: string): Date {
  return new Date(`${gun}T12:00:00Z`);
}

function iki(n: number): string {
  return String(n).padStart(2, '0');
}

/** Gün (YYYY-MM-DD) üzerine n gün ekler. */
export function gunEkle(gun: string, n: number): string {
  const d = gunTarihi(gun);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Haftanın kaçıncı günü: 0 = Pazartesi … 6 = Pazar. */
function haftaGunu(gun: string): number {
  return (gunTarihi(gun).getUTCDay() + 6) % 7;
}

/** `?ay=` değerini doğrular; geçersizse bugünün ayı. Dönüş: YYYY-MM. */
export function ayiCoz(deger: string | string[] | undefined, bugun: string): string {
  const ham = Array.isArray(deger) ? deger[0] : deger;
  const eslesme = ham?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (eslesme) {
    const yil = Number(eslesme[1]);
    if (yil >= 2000 && yil <= 2100) return ham as string;
  }
  return bugun.slice(0, 7);
}

/** YYYY-MM üzerine n ay ekler. */
export function ayEkle(ay: string, n: number): string {
  const [y, m] = ay.split('-').map(Number);
  const toplam = y * 12 + (m - 1) + n;
  return `${Math.floor(toplam / 12)}-${iki((toplam % 12) + 1)}`;
}

/** Ayı kapsayan, pazartesi başlangıçlı haftalar; her hafta 7 gün (YYYY-MM-DD). */
export function ayHaftalari(ay: string): string[][] {
  const [y, m] = ay.split('-').map(Number);
  const ilk = `${ay}-01`;
  const son = `${ay}-${iki(new Date(Date.UTC(y, m, 0)).getUTCDate())}`;
  const baslangic = gunEkle(ilk, -haftaGunu(ilk));
  const bitis = gunEkle(son, 6 - haftaGunu(son));

  const haftalar: string[][] = [];
  for (let hafta = baslangic; hafta <= bitis; hafta = gunEkle(hafta, 7)) {
    haftalar.push(Array.from({ length: 7 }, (_, i) => gunEkle(hafta, i)));
  }
  return haftalar;
}

function gunBasi(gun: string): string {
  return new Date(`${gun}T00:00:00+03:00`).toISOString();
}

/** Izgaranın kapsadığı zaman aralığı: başlangıç dahil, bitiş hariç (ISO). */
export function ayAraligi(ay: string): { baslangic: string; bitis: string } {
  const haftalar = ayHaftalari(ay);
  const ilkGun = haftalar[0][0];
  const sonGun = haftalar[haftalar.length - 1][6];
  return { baslangic: gunBasi(ilkGun), bitis: gunBasi(gunEkle(sonGun, 1)) };
}

/** "Ekim 2026" */
export function ayAdi(ay: string): string {
  return ayBicimi.format(gunTarihi(`${ay}-15`));
}

/** "15 Ekim Perşembe" */
export function gunBasligi(gun: string): string {
  return gunBasligiBicimi.format(gunTarihi(gun));
}

/** Ayın ilk gününde "1 Eki" göstermek için kısa ay adı. */
export function kisaAyAdi(gun: string): string {
  return kisaAyBicimi.format(gunTarihi(gun));
}

/** ISO zaman damgasının İstanbul saati: "14:05" */
export function saatMetni(iso: string): string {
  return saatBicimi.format(new Date(iso));
}

/** Öğenin zaman metni: "Tüm gün", "14:00" veya "14:00–15:30". */
export function ogeZamani(o: TakvimOgesi): string {
  if (o.tumGun) return 'Tüm gün';
  const bas = saatMetni(o.baslangic);
  return o.bitis ? `${bas}–${saatMetni(o.bitis)}` : bas;
}

/** Son tarihi geçmiş ve tamamlanmamış görev mi? */
export function gecikmisMi(o: TakvimOgesi, bugun: string): boolean {
  return o.tur === 'gorev' && o.gorevDurum !== 'tamamlandi' && o.gun < bugun;
}

/** Öğenin rengi: toplantı bilgi, etkinlik inceleme, görev durumuna göre. */
export function ogeTonu(o: TakvimOgesi, bugun: string): RozetTonu {
  if (o.tur === 'toplanti') return 'bilgi';
  if (o.tur === 'etkinlik') return 'inceleme';
  if (o.gorevDurum === 'tamamlandi') return 'basari';
  return gecikmisMi(o, bugun) ? 'uyari' : 'notr';
}

/** Izgaradaki küçük etiketin renk sınıfları (Rozet ile aynı eşleme). */
export const ETIKET_SINIFI: Record<RozetTonu, string> = {
  notr: 'bg-sunken text-ink-2',
  bilgi: 'bg-info-soft text-info',
  uyari: 'bg-warn-soft text-warn',
  basari: 'bg-ok-soft text-ok',
  inceleme: 'bg-review-soft text-review',
  tehlike: 'bg-danger-soft text-danger',
};

/** "10:00" → "11:00": toplantı bitişinin varsayılanı. Gün aşmasın diye en geç 23:59. */
export function birSaatSonra(saat: string): string {
  const [s, d] = saat.split(':').map(Number);
  if (!Number.isInteger(s) || !Number.isInteger(d)) return '';
  if (s >= 23) return '23:59';
  return `${iki(s + 1)}:${iki(d)}`;
}

/** Başlangıç kayınca süre korunur: 10:00–11:30 iken başlangıç 14:00 olursa bitiş 15:30. En geç 23:59. */
export function sureyiKoruyarakBitis(eskiBaslangic: string, eskiBitis: string, yeniBaslangic: string): string {
  const dakika = (saat: string) => {
    const [s, d] = saat.split(':').map(Number);
    return s * 60 + d;
  };
  const sure = dakika(eskiBitis) - dakika(eskiBaslangic);
  if (!(sure > 0)) return birSaatSonra(yeniBaslangic);
  const bitis = Math.min(dakika(yeniBaslangic) + sure, 23 * 60 + 59);
  return `${iki(Math.floor(bitis / 60))}:${iki(bitis % 60)}`;
}
