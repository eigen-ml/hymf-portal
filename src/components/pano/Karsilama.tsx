import Link from 'next/link';
import { buttonClass } from '@/components/ui';
import type { Profile } from '@/types/database';

/** Üye olmayanın (girişsiz veya onay bekleyen) gördüğü açılış metni. */
export function Karsilama({ ben }: { ben: Profile | null }) {
  return (
    <section className="max-w-3xl pt-4">
      <p className="text-base text-ink-2">Ankara Üniversitesi</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight text-ink sm:text-5xl">Hesaplamalı Yoğun Madde Fiziği Grubu</h1>
      <p className="mt-5 max-w-prose text-lg leading-8 text-ink-2">
        Yoğunluk fonksiyoneli teorisi, moleküler dinamik ve elektronik yapı hesapları üzerine çalışan grubun iç
        portalı. Tez planları, kılavuzlar ve ortak kaynaklar burada.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {ben ? (
          <Link href="/onay-bekleniyor" className={buttonClass({ variant: 'primary' })}>
            Hesap durumunu gör
          </Link>
        ) : (
          <Link href="/giris" className={buttonClass({ variant: 'primary' })}>
            Giriş yap
          </Link>
        )}
      </div>
      {!ben && (
        <p className="mt-4 text-sm text-ink-3">
          Portal grup üyelerine açıktır. Hesaplar grup yöneticileri tarafından açılır.
        </p>
      )}
    </section>
  );
}
