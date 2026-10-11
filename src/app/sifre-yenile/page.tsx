import { redirect } from 'next/navigation';
import { getOturumKullanicisi } from '@/lib/auth/dal';
import { Uyari } from '@/components/ui';
import { CikisButonu } from '@/app/onay-bekleniyor/CikisButonu';
import { SifreYenileFormu } from './SifreYenileFormu';

export default async function SifreYenilePage() {
  const kullanici = await getOturumKullanicisi();

  if (!kullanici) {
    redirect('/giris');
  }

  const zorunlu = kullanici.sifreDegistirmeli;

  return (
    <div className="mx-auto max-w-sm py-4 sm:py-10">
      <h1 className="font-serif text-2xl text-ink sm:text-4xl">
        {zorunlu ? 'Şifrenizi değiştirin' : 'Yeni şifre belirleyin'}
      </h1>
      {zorunlu ? (
        <div className="mt-4">
          <Uyari tone="bilgi">
            Yöneticinin verdiği geçici şifreyle girdiniz. Devam etmek için kendi şifrenizi belirleyin.
          </Uyari>
        </div>
      ) : (
        <p className="mt-2 text-base text-ink-2">En az 8 karakter.</p>
      )}
      <div className="mt-8">
        <SifreYenileFormu zorunlu={zorunlu} />
      </div>
      {zorunlu && (
        <div className="mt-6">
          <CikisButonu />
        </div>
      )}
    </div>
  );
}
