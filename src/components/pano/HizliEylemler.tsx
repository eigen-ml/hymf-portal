import Link from 'next/link';
import { buttonClass } from '@/components/ui';

const BUYUK = 'w-full sm:w-auto';

/** Üç büyük kısayol: hoca ve yöneticide görev ver / toplantı ekle / duyuru yaz. */
export function HizliEylemler({ yonetebilir }: { yonetebilir: boolean }) {
  const eylemler = yonetebilir
    ? [
        { href: '/gorevler?yeni=1', etiket: 'Görev ver' },
        { href: '/toplantilar', etiket: 'Toplantı ekle' },
        { href: '/duyurular', etiket: 'Duyuru yaz' },
      ]
    : [
        { href: '/gorevler', etiket: 'Görevlerim' },
        { href: '/takvim', etiket: 'Takvim' },
        { href: '/duyurular', etiket: 'Duyuru yaz' },
      ];

  return (
    <nav aria-label="Sık yapılan işler" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {eylemler.map((e, i) => (
        <Link key={e.href} href={e.href} className={buttonClass({ variant: i === 0 ? 'primary' : 'secondary', size: 'lg', className: BUYUK })}>
          {e.etiket}
        </Link>
      ))}
    </nav>
  );
}
