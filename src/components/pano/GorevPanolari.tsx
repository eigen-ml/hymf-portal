import Link from 'next/link';
import { GorevSatiri } from '@/components/gorevler/GorevSatiri';
import { bekliyorMu, kisiSayilari, siralaGorevler } from '@/components/gorevler/yardimci';
import { Panel } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { GroupTask } from '@/types/database';

const EN_COK = 6;

function TumGorevler({ etiket = 'Tüm görevler' }: { etiket?: string }) {
  return (
    <Link href="/gorevler" className="text-sm text-link underline">
      {etiket}
    </Link>
  );
}

/** Bana yazılmış görevler. */
export function GorevlerimPaneli({
  gorevler,
  benId,
  yonetebilir,
  bugun,
}: {
  gorevler: GroupTask[] | null;
  benId: string;
  yonetebilir: boolean;
  bugun: string;
}) {
  const benim = siralaGorevler((gorevler ?? []).filter((g) => g.assignee_id === benId && bekliyorMu(g)));
  const gosterilen = benim.slice(0, EN_COK);
  const kalan = benim.length - gosterilen.length;

  return (
    <Panel baslik="Görevlerim" aciklama={benim.length > 0 ? `${benim.length} bekleyen görev` : undefined} eylemler={<TumGorevler />}>
      {gorevler === null ? (
        <p className="text-sm text-ink-2">Görevler yüklenemedi. Sayfayı yenileyin.</p>
      ) : gosterilen.length === 0 ? (
        <p className="text-sm text-ink-2">Size verilmiş açık görev yok.</p>
      ) : (
        <>
          <ul className="-my-3 divide-y divide-line">
            {gosterilen.map((g) => (
              <GorevSatiri key={g.id} gorev={g} benId={benId} yonetebilir={yonetebilir} bugun={bugun} kompakt kisiGoster={false} />
            ))}
          </ul>
          {kalan > 0 && (
            <p className="mt-4 text-sm text-ink-2">
              {kalan} görev daha var. <TumGorevler etiket="Hepsini görün" />
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

/** Hoca ve yönetici için: teslim edilmiş, onay bekleyen görevler ve "Tamamlandı ✓" düğmesi. */
export function OnayBekleyenler({ gorevler, benId, bugun }: { gorevler: GroupTask[] | null; benId: string; bugun: string }) {
  const bekleyen = siralaGorevler((gorevler ?? []).filter((g) => g.status === 'teslim_edildi'));
  const gosterilen = bekleyen.slice(0, EN_COK);
  const kalan = bekleyen.length - gosterilen.length;

  return (
    <Panel
      baslik="Onay bekleyenler"
      aciklama={bekleyen.length > 0 ? `${bekleyen.length} görev teslim edildi` : undefined}
      eylemler={<TumGorevler />}
    >
      {gorevler === null ? (
        <p className="text-sm text-ink-2">Görevler yüklenemedi. Sayfayı yenileyin.</p>
      ) : gosterilen.length === 0 ? (
        <p className="text-sm text-ink-2">Teslim edilip onay bekleyen görev yok.</p>
      ) : (
        <>
          <ul className="-my-3 divide-y divide-line">
            {gosterilen.map((g) => (
              <GorevSatiri key={g.id} gorev={g} benId={benId} yonetebilir bugun={bugun} kompakt />
            ))}
          </ul>
          {kalan > 0 && (
            <p className="mt-4 text-sm text-ink-2">
              {kalan} görev daha onay bekliyor. <TumGorevler etiket="Hepsini görün" />
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

/** Kimde kaç tamamlanmamış görev var; küçük tablo. */
export function GorevDagilimi({ gorevler, bugun }: { gorevler: GroupTask[] | null; bugun: string }) {
  if (!gorevler) return null;

  const sayilar = kisiSayilari(gorevler, bugun);
  const adlar = new Map(gorevler.map((g) => [g.assignee_id, g.assignee?.full_name ?? 'Silinmiş üye']));
  const satirlar = [...sayilar.entries()]
    .filter(([, s]) => s.bekleyen > 0)
    .map(([id, s]) => ({ id, ad: adlar.get(id) ?? '', ...s }))
    .sort((a, b) => b.gecikmis - a.gecikmis || b.bekleyen - a.bekleyen || a.ad.localeCompare(b.ad, 'tr'));

  return (
    <Panel baslik="Kimde kaç görev var" eylemler={<TumGorevler />}>
      {satirlar.length === 0 ? (
        <p className="text-sm text-ink-2">Bekleyen görev yok.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Kişi başına bekleyen ve geciken görev sayısı</caption>
            <thead>
              <tr className="bg-sunken text-left font-medium text-ink-2">
                <th scope="col" className="px-4 py-2 font-medium">
                  Kişi
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Bekleyen
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  Geciken
                </th>
              </tr>
            </thead>
            <tbody>
              {satirlar.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <th scope="row" className="px-4 py-2.5 text-left font-normal text-ink">
                    {s.ad}
                  </th>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink">{s.bekleyen}</td>
                  <td className={cn('px-4 py-2.5 text-right tabular-nums', s.gecikmis > 0 ? 'font-medium text-warn' : 'text-ink-3')}>
                    {s.gecikmis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {satirlar.length > 10 && (
        <p className="mt-3 text-sm text-ink-2">
          {satirlar.length - 10} kişi daha var. <TumGorevler etiket="Hepsini görün" />
        </p>
      )}
    </Panel>
  );
}
