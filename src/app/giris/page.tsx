import { GirisFormu } from './GirisFormu';
import { guvenliIcYol } from '@/lib/yonlendirme';
import { GrupLogosu } from '@/components/ui';

interface GirisPageProps {
  searchParams: Promise<{ next?: string; hata?: string }>;
}

export default async function GirisPage(props: GirisPageProps) {
  const params = await props.searchParams;
  const validNext = guvenliIcYol(params.next);
  const hata = params.hata;

  const hataMetni = hata === 'baglanti' ? 'Bağlantı bu tarayıcıda tamamlanamadı. E-postanızı doğruladıysanız giriş yapabilirsiniz; şifre sıfırlıyorsanız yeni bir bağlantı isteyin.' : null;

  return (
    <div className="mx-auto max-w-sm py-4 sm:py-10">
      <GrupLogosu genislik={112} ustte className="mb-6" />
      <h1 className="font-serif text-2xl text-ink sm:text-4xl">Giriş yap</h1>
      <p className="mt-2 text-base text-ink-2">Grup e-posta adresiniz ve şifrenizle.</p>
      <div className="mt-8">
        <GirisFormu next={validNext} hataParam={hataMetni} />
      </div>
    </div>
  );
}
