import Link from 'next/link';
import { Panel, Rozet } from '@/components/ui';
import { goreliZaman, tarihSaat } from '@/lib/zaman';
import type { AnnouncementPriority } from '@/types/database';

export interface PanoDuyurusu {
  id: string;
  title: string;
  priority: AnnouncementPriority;
  created_at: string;
  author: { full_name: string } | null;
}

/** Son üç duyuru; her satır duyurular sayfasına gider. */
export function SonDuyurular({ duyurular }: { duyurular: PanoDuyurusu[] | null }) {
  return (
    <Panel
      baslik="Son duyurular"
      eylemler={
        <Link href="/duyurular" className="text-sm text-link underline">
          Tüm duyurular
        </Link>
      }
    >
      {duyurular === null ? (
        <p className="text-sm text-ink-2">Duyurular yüklenemedi. Sayfayı yenileyin.</p>
      ) : duyurular.length === 0 ? (
        <p className="text-sm text-ink-2">Henüz duyuru yok.</p>
      ) : (
        <ul className="-my-3 divide-y divide-line">
          {duyurular.map((d) => (
            <li key={d.id}>
              <Link href="/duyurular" className="block py-3 hover:bg-sunken/60">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-base font-medium text-ink">{d.title}</span>
                  {d.priority === 'acil' && <Rozet tone="uyari">Acil</Rozet>}
                </span>
                <span className="mt-1 block text-sm text-ink-3">
                  {d.author?.full_name ?? 'Grup üyesi'},{' '}
                  <time dateTime={d.created_at} title={tarihSaat(d.created_at)} suppressHydrationWarning>
                    {goreliZaman(d.created_at)}
                  </time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
