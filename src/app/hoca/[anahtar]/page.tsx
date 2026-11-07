import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { SayfaBasligi, buttonClass } from '@/components/ui';
import { driveKlasorDosyalari } from '@/lib/data/driveKlasor';
import { hocaSunumlari } from '@/lib/data/hocaLinki';
import { HocaSunumListesi } from './HocaSunumListesi';

// Hocanın giriş yapmadan açtığı Sunumlar sayfası (proxy bu yolu ACIK_YOLLAR'da dışarıda bırakır).
// Anahtar adreste durduğu için arama motoruna kapalı ve dışarı giden bağlantılarda adres gönderilmez.
export const metadata: Metadata = {
  title: 'Sunumlar | HYMF Portal',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function HocaSunumlarPage({ params }: { params: Promise<{ anahtar: string }> }) {
  const { anahtar } = await params;
  const uyeler = await hocaSunumlari(anahtar);
  if (!uyeler) notFound();

  const dosyalar = await Promise.all(uyeler.map((u) => driveKlasorDosyalari(u.klasor)));
  const arsiv = process.env.SUNUM_KLASORU_URL?.trim();

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Sunumlar"
        aciklama="Grubun sunum klasörleri. Dosyaya tıklayınca burada açılır; her kişinin sağına not bırakabilirsiniz."
        eylemler={
          arsiv ? (
            <a href={arsiv} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary' })}>
              Drive&apos;da aç <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : undefined
        }
      />
      <HocaSunumListesi anahtar={anahtar} uyeler={uyeler.map((u, i) => ({ ...u, dosyalar: dosyalar[i] }))} />
    </div>
  );
}
