import Link from 'next/link';
import { Panel, Rozet } from '@/components/ui';
import type { RozetTonu } from '@/components/ui';
import type { TakvimOgesi, TakvimOgesiTuru } from '@/types/database';
import { gunBasligi, saatMetni } from './yardimci';

const TUR_ETIKETI: Record<TakvimOgesiTuru, string> = {
  toplanti: 'Toplantı',
  etkinlik: 'Etkinlik',
  gorev: 'Görev',
};

const TUR_TONU: Record<TakvimOgesiTuru, RozetTonu> = {
  toplanti: 'bilgi',
  etkinlik: 'notr',
  gorev: 'inceleme',
};

const EN_COK = 10;

function zamanMetni(o: TakvimOgesi): string {
  if (o.tur === 'gorev') return 'Son gün';
  if (o.tumGun) return 'Tüm gün';
  return saatMetni(o.baslangic);
}

function ayrinti(o: TakvimOgesi, benId: string): string | null {
  if (o.tur === 'gorev') return o.sorumluId === benId ? 'Sizin göreviniz' : (o.sorumluAd ?? null);
  return o.yer;
}

/** Önümüzdeki günlerin toplantı, etkinlik ve görev son tarihleri; güne göre gruplu kısa liste. */
export function BuHafta({ ogeler, benId, bugun }: { ogeler: TakvimOgesi[] | null; benId: string; bugun: string }) {
  // Tamamlanmış görevlerin son günü haftayı doldurmasın.
  const liste = (ogeler ?? []).filter((o) => !(o.tur === 'gorev' && o.gorevDurum === 'tamamlandi'));
  const gosterilen = liste.slice(0, EN_COK);
  const kalan = liste.length - gosterilen.length;

  const gunler: { gun: string; ogeler: TakvimOgesi[] }[] = [];
  for (const o of gosterilen) {
    const son = gunler[gunler.length - 1];
    if (son && son.gun === o.gun) son.ogeler.push(o);
    else gunler.push({ gun: o.gun, ogeler: [o] });
  }

  return (
    <Panel
      baslik="Bu hafta"
      eylemler={
        <Link href="/takvim" className="text-sm text-link underline">
          Takvimin tamamı
        </Link>
      }
    >
      {ogeler === null ? (
        <p className="text-sm text-ink-2">Takvim yüklenemedi. Sayfayı yenileyin.</p>
      ) : gunler.length === 0 ? (
        <p className="text-sm text-ink-2">Önümüzdeki 7 günde toplantı, etkinlik veya görev son tarihi yok.</p>
      ) : (
        <div className="space-y-5">
          {gunler.map((g) => (
            <section key={g.gun} aria-label={gunBasligi(g.gun, bugun)}>
              <h3 className="text-sm font-semibold text-ink">{gunBasligi(g.gun, bugun)}</h3>
              <ul className="mt-1 divide-y divide-line border-t border-line">
                {g.ogeler.map((o) => {
                  const detay = ayrinti(o, benId);
                  return (
                    <li key={o.anahtar} className="grid grid-cols-[4.5rem_1fr] gap-x-3 py-2.5">
                      <span className="pt-0.5 text-sm tabular-nums text-ink-3">{zamanMetni(o)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{o.baslik}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
                          <Rozet tone={TUR_TONU[o.tur]}>{TUR_ETIKETI[o.tur]}</Rozet>
                          {detay && <span>{detay}</span>}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {kalan > 0 && (
            <p className="text-sm text-ink-2">
              {kalan} kayıt daha var.{' '}
              <Link href="/takvim" className="text-link underline">
                Takvimin tamamına bakın
              </Link>
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
