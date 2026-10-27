import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireMember } from '@/lib/auth/dal';
import { KILAVUZLAR, type KilavuzDosyasi } from '@/lib/kilavuz/liste';
import { CodeBlock } from '@/components/CodeBlock';
import { BosDurum, Panel, SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { GenelNotlar } from './GenelNotlar';

function DosyaSatiri({ k }: { k: KilavuzDosyasi }) {
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className={k.tur === 'sunum' ? 'font-semibold text-ink' : 'font-mono text-sm font-semibold text-ink'}>{k.baslik}</p>
        <p className="mt-1 text-sm text-ink-2">{k.aciklama}</p>
        {k.tur !== 'veri' && <p className="mt-1 text-sm text-ink-3">{k.bilgi}</p>}
      </div>
      <a href={`/kilavuzlar/dosya/${k.dosya}?indir=1`} className={buttonClass({ variant: 'secondary' })}>
        <Download className="size-4" aria-hidden="true" />
        İndir
      </a>
    </li>
  );
}

function Kod({ children }: { children: React.ReactNode }) {
  return <code className="font-mono break-words">{children}</code>;
}

export default async function Page() {
  await requireMember();

  // Lisanslı VASP paketinin Drive bağlantısı repoda durmaz; Vercel'de VASP_PAKET_URL. Sayfa yalnız üyelere açık.
  const vaspPaketUrl = process.env.VASP_PAKET_URL?.trim();

  const pdfler = KILAVUZLAR.filter((k) => k.tur === 'pdf');
  const paketler = KILAVUZLAR.filter((k) => k.tur === 'paket');
  const ornekler = KILAVUZLAR.filter((k) => k.tur === 'veri' || k.tur === 'sunum');

  const kilavuzlar = (
    <Panel baslik="Hesap kılavuzları" govdeSinifi="p-0">
      {pdfler.length === 0 ? (
        <div className="p-5 sm:p-6">
          <BosDurum baslik="Henüz kılavuz yok" aciklama="Kılavuzlar eklenince burada görünür." />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {pdfler.map((k) => (
            <li key={k.dosya} className="px-5 py-4 sm:px-6">
              <Link href={`/kilavuzlar/${encodeURIComponent(k.dosya)}`} className="text-lg font-semibold text-ink hover:text-link">
                {k.baslik}
              </Link>
              <p className="mt-1 text-sm text-ink-2">{k.aciklama}</p>
              <p className="mt-1 text-sm text-ink-3">PDF, {k.bilgi}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  // Betikler grubun TRUBA betikleri; paketteki -A satırı ve VASP yolu bu sayfadaki kuruluma göre ayarlandı.
  const dosyalar = (
    <div className="space-y-8">
      <Panel baslik="Hesap betikleri" govdeSinifi="p-0">
        <ul className="divide-y divide-line">
          {paketler.map((k) => (
            <DosyaSatiri key={k.dosya} k={k} />
          ))}
        </ul>
        <div className="space-y-3 border-t border-line px-5 py-4 text-sm leading-relaxed text-ink-2 sm:px-6">
          <p>
            Dosya adı kuyruğu ve programı söyler: <Kod>hamsi_std</Kod> hamsi kuyruğunda <Kod>vasp_std</Kod> çalıştırır.{' '}
            <Kod>vasp_std</Kod> olağan hesap, <Kod>vasp_gam</Kod> yalnız Γ noktalı hesap, <Kod>vasp_ncl</Kod> spin-yörünge
            (kolinear olmayan) hesap içindir. Çıktı <Kod>vasp_sonuc.out</Kod>, hatalar <Kod>vasp_hata.err</Kod> dosyasına
            yazılır.
          </p>
          <p>
            Her betikte iki satır kendine göre olmalı: <Kod>#SBATCH -A</Kod> satırındaki kullanıcı adı ve son satırdaki VASP
            yolu. Yol bu sayfadaki kurulumla gelen <Kod>/arf/scratch/$USER/vasp.6.6.0/bin_cpu</Kod>; VASP&apos;ı başka yere
            kurduysan son satırı kendi yoluna göre değiştir.
          </p>
          <p className="font-semibold text-ink">1. Paketi TRUBA&apos;ya gönder</p>
          <p>
            Mac ve Linux&apos;ta Terminal&apos;de aşağıdaki komut; Windows&apos;ta WinSCP ile sürükle (
            <a href="#adim-gonder" className="text-link underline">
              Kurulum, adım 6
            </a>
            ).
          </p>
          <CodeBlock code="scp ~/Downloads/hesap-betikleri.tar.gz kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/" />
          <p className="font-semibold text-ink">2. TRUBA&apos;da paketi aç, kullanıcı adını betiklere yaz</p>
          <CodeBlock
            code={
              'cd /arf/scratch/$USER && tar xzf hesap-betikleri.tar.gz\n' +
              'sed -i "s/KULLANICI_ADINIZ/$USER/" hesap_betikleri/*_std hesap_betikleri/*_gam hesap_betikleri/*_ncl\n' +
              'grep -- "-A " hesap_betikleri/hamsi_std'
            }
          />
          <p>Son satır kendi kullanıcı adını göstermeli.</p>
          <p className="font-semibold text-ink">3. Hesap klasöründe betiği kopyala ve gönder</p>
          <CodeBlock code={'cp /arf/scratch/$USER/hesap_betikleri/hamsi_std .\nsbatch hamsi_std'} />
          <p>
            Bader hesabında <Kod>chgsum.pl</Kod> ve <Kod>bader</Kod>&apos;ı da aynı yerden hesap klasörüne kopyala:{' '}
            <Kod>cp /arf/scratch/$USER/hesap_betikleri/{'{chgsum.pl,bader}'} .</Kod>
          </p>
        </div>
      </Panel>

      <Panel baslik="Örnek dosyalar" govdeSinifi="p-0">
        <ul className="divide-y divide-line">
          {ornekler.map((k) => (
            <DosyaSatiri key={k.dosya} k={k} />
          ))}
        </ul>
      </Panel>

      <Uyari tone="bilgi" baslik="POTCAR">
        POTCAR dosyaları VASP paketindeki <Kod>pseudoPOT</Kod> klasöründe (ör. <Kod>pseudoPOT/PP_GGA/Si/POTCAR</Kod>). VASP
        lisansı gereği burada ayrıca paylaşılmıyor.
      </Uyari>
    </div>
  );

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Kurulum ve Kılavuzlar"
        aciklama="TRUBA'da VASP kurulumu, grubun hesap kılavuzları, betikler ve örnek dosyalar. Yeni başlıyorsan Kurulum sekmesindeki adımları sırayla yap."
      />

      <GenelNotlar
        vaspPaketUrl={vaspPaketUrl?.startsWith('https://') ? vaspPaketUrl : undefined}
        kilavuzlar={kilavuzlar}
        dosyalar={dosyalar}
      />
    </div>
  );
}
