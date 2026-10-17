import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMember } from '@/lib/auth/dal';
import { KILAVUZLAR } from '@/lib/kilavuz/liste';
import { SayfaBasligi } from '@/components/ui';

export default async function KilavuzPage({ params }: { params: Promise<{ ad: string }> }) {
  await requireMember();

  const { ad } = await params;
  const kilavuz = KILAVUZLAR.find((k) => k.tur === 'pdf' && k.dosya === ad);
  if (!kilavuz) notFound();

  const adres = `/kilavuzlar/dosya/${encodeURIComponent(kilavuz.dosya)}`;

  return (
    <div className="space-y-8">
      <Link href="/kilavuzlar" className="text-sm font-medium text-link hover:underline">
        ← Kurulum ve Kılavuzlar
      </Link>

      <SayfaBasligi baslik={kilavuz.baslik} aciklama={kilavuz.aciklama} />

      <iframe
        src={adres}
        title={kilavuz.baslik}
        className="h-[80vh] w-full rounded-xl border border-line bg-white"
      />

      <a href={adres} target="_blank" rel="noopener" className="inline-block text-sm text-link hover:underline">
        Yeni sekmede aç
      </a>
    </div>
  );
}
