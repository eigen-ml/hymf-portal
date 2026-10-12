import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireMember } from '@/lib/auth/dal';
import { KILAVUZLAR } from '@/lib/kilavuz/liste';
import { BosDurum, Panel, SayfaBasligi, buttonClass } from '@/components/ui';
import { GenelNotlar } from './GenelNotlar';

export default async function Page() {
  await requireMember();

  const pdfler = KILAVUZLAR.filter((k) => k.tur === 'pdf');
  const veriler = KILAVUZLAR.filter((k) => k.tur === 'veri');

  return (
    <div className="space-y-10">
      <SayfaBasligi
        baslik="Kılavuzlar"
        aciklama="Grubun VASP hesap kılavuzları. Açmak için başlığa basın."
      />

      <Panel baslik="Hesap kılavuzları" govdeSinifi="p-0">
        {pdfler.length === 0 ? (
          <div className="p-5 sm:p-6">
            <BosDurum baslik="Henüz kılavuz yok" aciklama="Kılavuzlar eklenince burada görünür." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {pdfler.map((k) => (
              <li key={k.dosya} className="px-5 py-4 sm:px-6">
                <Link
                  href={`/kilavuzlar/${encodeURIComponent(k.dosya)}`}
                  className="text-lg font-semibold text-ink hover:text-link"
                >
                  {k.baslik}
                </Link>
                <p className="mt-1 text-sm text-ink-2">{k.aciklama}</p>
                <p className="mt-1 text-sm text-ink-3">PDF, {k.bilgi}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {veriler.length > 0 && (
        <Panel baslik="Örnek dosyalar" govdeSinifi="p-0">
          <ul className="divide-y divide-line">
            {veriler.map((k) => (
              <li key={k.dosya} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-ink">{k.dosya}</p>
                  <p className="mt-1 text-sm text-ink-2">{k.aciklama}</p>
                </div>
                <a href={`/kilavuzlar/dosya/${k.dosya}?indir=1`} className={buttonClass({ variant: 'secondary' })}>
                  <Download className="size-4" aria-hidden="true" />
                  İndir
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <GenelNotlar />
    </div>
  );
}
