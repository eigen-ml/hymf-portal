// Takvim aboneliği: bağlantı adresleri, aboneliği çeken uygulamanın adı ve bağlı mı sorusu.

import { CANLI_ADRES } from '@/lib/site';
import { goreliZaman } from '@/lib/zaman';
import type { TakvimBaglantisi, TakvimIstemcisi } from '@/types/database';

export interface AbonelikAdresleri {
  /** Kopyalanan ve takvim uygulamasına yapıştırılan adres. */
  https: string;
  /** Apple Takvim'i doğrudan abonelik penceresiyle açar. */
  webcal: string;
  /** Google Takvim'in "takvim ekle" sayfası. */
  google: string;
}

export function abonelikAdresleri(token: string): AbonelikAdresleri {
  const https = `${CANLI_ADRES}/takvim-akisi/${token}.ics`;
  const webcal = https.replace(/^https:/, 'webcal:');
  return {
    https,
    webcal,
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
  };
}

export const TAKVIM_ISTEMCI_ETIKETI: Record<TakvimIstemcisi, string> = {
  apple: 'Apple',
  google: 'Google',
  outlook: 'Outlook',
  tarayici: 'Tarayıcı',
  diger: 'Diğer',
};

/** Akışı çeken uygulamayı User-Agent'tan kabaca bulur. Ham User-Agent hiçbir yerde saklanmaz. */
export function istemciyiBul(userAgent: string | null): TakvimIstemcisi {
  const ua = userAgent ?? '';
  if (/Google-Calendar-Importer/i.test(ua)) return 'google';
  if (/CalendarAgent|dataaccessd|iOS\/|macOS\//i.test(ua)) return 'apple';
  if (/Microsoft|Outlook/i.test(ua)) return 'outlook';
  if (/Mozilla/i.test(ua)) return 'tarayici';
  return 'diger';
}

/** Takvim gerçekten bir uygulamaya bağlı mı. Tarayıcıdan indirilen dosya abonelik sayılmaz. */
export function takvimBagliMi(b: TakvimBaglantisi | null | undefined): boolean {
  return !!b?.sonCekim && !!b.sonIstemci && b.sonIstemci !== 'tarayici';
}

/** Yönetim listesindeki kısa metin: "Apple · 2 saat önce", "Google · dün", "Bağlı değil". */
export function takvimDurumMetni(b: TakvimBaglantisi | null | undefined, simdi: Date = new Date()): string {
  if (!takvimBagliMi(b)) return 'Bağlı değil';
  return `${TAKVIM_ISTEMCI_ETIKETI[b!.sonIstemci!]} · ${goreliZaman(b!.sonCekim!, simdi)}`;
}

/** Panodaki "takvimi ekle" kutusunda "Daha sonra" denince yazılan oturum çerezi (tarayıcı kapanınca silinir). */
export const TAKVIM_KUTUSU_CEREZI = 'hymf-takvim-kutusu';
