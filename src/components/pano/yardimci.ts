// Pano için tarih biçimleri. Saat dilimi sabit (İstanbul), böylece sunucu ve tarayıcı aynı metni üretir.

import { gunFarki } from '@/lib/zaman';

const TZ = 'Europe/Istanbul';

const bugunBicimi = new Intl.DateTimeFormat('tr-TR', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const gunBasligiBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const saatBicimi = new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

/** "11 Ekim 2026 Pazar" */
export function bugunMetni(simdi: Date = new Date()): string {
  return bugunBicimi.format(simdi);
}

/** "Bugün", "Yarın" veya "Cuma, 16 Ekim" (gun: YYYY-MM-DD). */
export function gunBasligi(gun: string, bugun: string): string {
  const fark = gunFarki(bugun, gun);
  if (fark === 0) return 'Bugün';
  if (fark === 1) return 'Yarın';
  return gunBasligiBicimi.format(new Date(`${gun}T12:00:00Z`));
}

/** "14:30" */
export function saatMetni(zaman: string): string {
  return saatBicimi.format(new Date(zaman));
}

/** "Ata Berk Öztürk" → "Ata"; başındaki unvanlar ("Prof." gibi) atlanır. */
export function ilkAd(tamAd: string): string {
  const parcalar = tamAd.trim().split(/\s+/).filter((p) => p.length > 0 && !p.endsWith('.'));
  return parcalar[0] ?? tamAd;
}
