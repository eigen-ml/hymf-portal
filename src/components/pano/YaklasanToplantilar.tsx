import Link from 'next/link';
import { Panel, Rozet, buttonClass } from '@/components/ui';
import { gunISO } from '@/lib/zaman';
import { gunBasligi, saatMetni } from './yardimci';

export interface PanoToplantisi {
  id: string;
  title: string;
  meeting_date: string;
  location: string | null;
  hoca_adi?: string | null;
  creator: { full_name: string } | null;
}

/** Panonun başı: sıradaki toplantılar (grup ve hocayla birebir), herkes görür. */
export function YaklasanToplantilar({ toplantilar, bugun }: { toplantilar: PanoToplantisi[] | null; bugun: string }) {
  return (
    <Panel
      baslik="Yaklaşan toplantılar"
      eylemler={
        <Link href="/toplantilar?yeni=1" className={buttonClass({ variant: 'primary', size: 'sm' })}>
          Toplantı ekle
        </Link>
      }
    >
      {toplantilar === null ? (
        <p className="text-sm text-ink-2">Toplantılar yüklenemedi. Sayfayı yenileyin.</p>
      ) : toplantilar.length === 0 ? (
        <p className="text-sm text-ink-2">
          Yaklaşan toplantı yok. Hocayla görüşmen varsa ekle, herkes görsün.
        </p>
      ) : (
        <ul className="-my-3 divide-y divide-line">
          {toplantilar.map((m) => (
            <li key={m.id}>
              <Link href="/toplantilar" className="grid grid-cols-[7rem_1fr] gap-x-3 py-3 hover:bg-sunken/60">
                <span className="text-sm tabular-nums text-ink-3">
                  {gunBasligi(gunISO(m.meeting_date), bugun)}
                  <br />
                  {saatMetni(m.meeting_date)}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-base font-medium text-ink">{m.title}</span>
                    {m.hoca_adi ? <Rozet tone="inceleme">Birebir</Rozet> : <Rozet tone="notr">Grup</Rozet>}
                  </span>
                  <span className="mt-1 block text-sm text-ink-3">
                    {[m.hoca_adi ? `${m.creator?.full_name ?? 'Grup üyesi'} · ${m.hoca_adi}` : m.creator?.full_name, m.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
