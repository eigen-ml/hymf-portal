// Grup toplantısı yardımcıları: takvim akışı, tek toplantılık .ics ve Telegram bildirimi aynı
// kuralları kullansın diye burada.

import type { IcsOlay } from '@/lib/ics';
import { CANLI_ADRES } from '@/lib/site';
import type { Meeting } from '@/types/database';

/** Bitişi girilmemiş toplantı bu kadar sürer. */
export const VARSAYILAN_SURE_MS = 60 * 60 * 1000;

export type ToplantiZamani = Pick<Meeting, 'meeting_date' | 'ends_at'>;

/** Toplantının bitişi (ISO); boşsa başlangıç + 1 saat. */
export function toplantiBitisi(t: ToplantiZamani): string {
  return t.ends_at ?? new Date(Date.parse(t.meeting_date) + VARSAYILAN_SURE_MS).toISOString();
}

/** Takvim uygulamasındaki başlık. */
export function toplantiBasligi(title: string): string {
  return `Grup toplantısı: ${title}`;
}

/** Akışta ve tek toplantılık dosyada aynı UID: kişi ikisini de eklerse takvim tek kayıt görür. */
export function toplantiOlayi(
  m: Pick<Meeting, 'id' | 'title' | 'meeting_date' | 'ends_at' | 'location' | 'notes' | 'presentation_url' | 'updated_at' | 'sequence'>,
): IcsOlay {
  return {
    uid: `toplanti-${m.id}@hymf-portal`,
    baslik: toplantiBasligi(m.title),
    baslangic: m.meeting_date,
    bitis: toplantiBitisi(m),
    tumGun: false,
    aciklama: [m.notes, m.presentation_url].filter(Boolean).join('\n\n') || null,
    yer: m.location ?? null,
    url: `${CANLI_ADRES}/toplantilar`,
    degisti: m.updated_at ?? null,
    sira: m.sequence ?? null,
  };
}
