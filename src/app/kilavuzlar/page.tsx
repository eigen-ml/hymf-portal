import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireMember } from '@/lib/auth/dal';
import { KILAVUZLAR } from '@/lib/kilavuz/liste';
import { BosDurum, Panel, SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { GenelNotlar } from './GenelNotlar';

export default async function Page() {
  await requireMember();

  // Lisanslı VASP paketinin Drive bağlantısı repoda durmaz; Vercel'de VASP_PAKET_URL. Sayfa yalnız üyelere açık.
  const vaspPaketUrl = process.env.VASP_PAKET_URL?.trim();

  const pdfler = KILAVUZLAR.filter((k) => k.tur === 'pdf');
  const veriler = KILAVUZLAR.filter((k) => k.tur === 'veri');

  return (
    <div className="space-y-10">
      <SayfaBasligi
        baslik="VASP"
        aciklama="TRUBA'da VASP kurulumu, grubun hesap kılavuzları ve örnek dosyalar. Açmak için başlığa basın."
      />

      <Uyari tone="bilgi" baslik="Yeni misin?">
        Önce{' '}
        <a href="#kurulum" className="underline">
          TRUBA ve VASP kurulumunu
        </a>{' '}
        adım adım yap (sayfanın altında), sonra aşağıdaki hesap kılavuzlarına geç.
      </Uyari>

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

      <GenelNotlar vaspPaketUrl={vaspPaketUrl?.startsWith('https://') ? vaspPaketUrl : undefined} />
    </div>
  );
}
