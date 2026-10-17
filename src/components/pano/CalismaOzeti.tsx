import Link from 'next/link';
import { Panel } from '@/components/ui';
import { cn } from '@/lib/cn';
import { gecenGun } from '@/lib/zaman';
import type { PanoSatiri } from '@/types/database';

function ozet(satirlar: PanoSatiri[]) {
  const gecikmeli = satirlar.filter((s) => s.gecikmis > 0).length;
  const sessiz = satirlar.filter((s) => {
    const gun = gecenGun(s.son_guncelleme);
    return gun === null || gun > 7;
  }).length;
  return { toplam: satirlar.length, gecikmeli, sessiz };
}

/** Hoca için: öğrencilerin plan durumu özeti (eski ana sayfadaki "Öğrencileriniz" bölümü). */
export function OgrencilerOzeti({ satirlar }: { satirlar: PanoSatiri[] | null }) {
  if (!satirlar || satirlar.length === 0) return null;
  const o = ozet(satirlar);

  const veriler = [
    { etiket: 'Öğrenci', deger: o.toplam, uyari: false },
    { etiket: 'Gecikmiş maddesi olan', deger: o.gecikmeli, uyari: o.gecikmeli > 0 },
    { etiket: 'Bir haftadır yazmayan', deger: o.sessiz, uyari: o.sessiz > 0 },
  ];

  return (
    <Panel
      baslik="Öğrencileriniz"
      eylemler={
        <Link href="/calisma-alani" className="text-sm text-link underline">
          Plan durumuna git
        </Link>
      }
    >
      <dl className="grid grid-cols-3 gap-4">
        {veriler.map((v) => (
          <div key={v.etiket}>
            <dt className="text-sm text-ink-2">{v.etiket}</dt>
            <dd className={cn('mt-1 font-serif text-3xl tabular-nums', v.uyari ? 'text-warn' : 'text-ink')}>{v.deger}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** Hoca olmayan üye için: çalışma alanına kısayol. */
export function CalismaAlanimBaglantisi() {
  return (
    <Panel baslik="Çalışma alanı" aciklama="Kısa notların ve grubun fikirleri.">
      <Link href="/calisma-alani" className="text-sm text-link underline">
        Çalışma alanına git
      </Link>
    </Panel>
  );
}
