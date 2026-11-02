import React from 'react';
import { ExternalLink } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';

// Hocanın isteği (Kasım 2026): giriş dosyaları hazır verilmez, yeni gelen her birini elle hazırlar. Biçim açıklamaları
// VASP Wiki'nin POSCAR, POTCAR, KPOINTS ve INCAR sayfalarından (2 Kas 2026). Örnekler grubun kılavuzlarından: silisen
// (bant yapısı kılavuzu, SC adımı) ve S-Ga-Se sırası (DOS kılavuzu, adım 1). POTCAR klasör adları VASP paketindeki
// pseudoPOT/PP_GGA'dan.

const WIKI = 'https://www.vasp.at/wiki/index.php';

function Dis({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link underline">
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function Kod({ children }: { children: React.ReactNode }) {
  return <code className="font-mono break-words">{children}</code>;
}

function Satirlar({ satirlar, kod }: { satirlar: [string, React.ReactNode][]; kod?: boolean }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-line">
        {satirlar.map(([satir, anlam]) => (
          <tr key={satir}>
            <td className={`w-2/5 py-1.5 pr-4 align-top text-ink ${kod ? 'font-mono' : 'font-medium'}`}>{satir}</td>
            <td className="py-1.5 align-top text-ink-2">{anlam}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Dosya({ no, ad, ozet, children }: { no: number; ad: string; ozet: string; children: React.ReactNode }) {
  return (
    <section id={ad.toLowerCase()} className="scroll-mt-24 space-y-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <h2 className="flex items-start gap-3 text-lg font-semibold text-ink">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
          aria-hidden="true"
        >
          {no}
        </span>
        <span className="pt-0.5">
          {ad}
          <span className="block text-sm font-normal text-ink-2">{ozet}</span>
        </span>
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

const POSCAR_ORNEK = `Silicene
   1.00000000000000
     3.8679843500000000    0.0000000000000000    0.0000000000000000
    -1.9339921750000000    3.3497727089999998    0.0000000000000000
     0.0000000000000000    0.0000000000000000   20.0000000000000000
   Si
     2
Direct
  0.3328312623913273  0.6661685526086847  0.4887690584204025
  0.6661687446086721  0.3328311993913185  0.5112309415795975`;

const POTCAR_KOMUT = `mkdir -p /arf/scratch/$USER/yeni_hesap
ls /arf/scratch/$USER/pseudoPOT/PP_GGA/
cd /arf/scratch/$USER/pseudoPOT/PP_GGA
cat S/POTCAR Ga/POTCAR Se/POTCAR > /arf/scratch/$USER/yeni_hesap/POTCAR
cd /arf/scratch/$USER/yeni_hesap
grep TITEL POTCAR`;

const KPOINTS_ORNEK = `k-points
 0
Gamma
 16   16    1
 0.0  0.0  0.0`;

const INCAR_ORNEK = `SYSTEM = Antimonene
#Electronic minimization
ENCUT = 600
ISMEAR = 0
SIGMA = 0.01
EDIFF = 1E-8
ISPIN = 1
IBRION = 2
ALGO = Normal
NBANDS = 96
GGA = PE`;

export function GirisDosyalari() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-ink-2">
        Her hesap klasöründe dört dosya olur. Hazır dosya kopyalama, her birini kendin hazırla; takılınca VASP Wiki&apos;ye ve
        hesap kılavuzlarındaki örneklere bak. Sırayla git: POTCAR, POSCAR&apos;daki element sırasına bağlı.
      </p>

      <Dosya no={1} ad="POSCAR" ozet="Yapı: hücre ve atomların yeri.">
        <p>
          Yapıyı <strong className="text-ink">VESTA</strong>&apos;da kur, <Kod>File → Export Data</Kod> ile VASP biçiminde
          kaydet, dosyanın adını <Kod>POSCAR</Kod> yap. 2B yapılarda üçüncü eksen boyunca boşluk (vakum) bırakılır;
          kılavuzlardaki örneklerde üçüncü vektör <Kod>20</Kod> Å. Vakumu kendin ayarla, sonra dosyayı metin olarak açıp
          satırları kontrol et.
        </p>
        <Satirlar
          satirlar={[
            ['1. satır', 'Açıklama, istediğini yaz.'],
            ['2. satır', 'Ölçek; genelde 1.'],
            ['3–5. satırlar', 'Hücrenin üç vektörü (Å).'],
            ['Element adları', <>Ör. <Kod>Si</Kod> ya da <Kod>S Ga Se</Kod>. POTCAR bu sırayla yapılır.</>],
            ['Atom sayıları', 'Her elementten kaç atom var, aynı sırayla.'],
            [
              'Direct / Cartesian',
              <>
                <Kod>Direct</Kod>: konumlar hücre vektörleri cinsinden (0 ile 1 arası). <Kod>Cartesian</Kod>: Å cinsinden.
              </>,
            ],
            ['Sonraki satırlar', 'Her atomun konumu; satır sayısı toplam atom sayısı kadar.'],
          ]}
        />
        <CodeBlock title="Örnek: silisen (bant yapısı kılavuzu)" language="text" code={POSCAR_ORNEK} />
        <p className="text-ink-3">
          Kaynak: <Dis href={`${WIKI}/POSCAR`}>VASP Wiki POSCAR</Dis>. Dosyalar sekmesinde 48 atomluk{' '}
          <Kod>POSCAR_SnSSe.vasp</Kod> da var; VESTA&apos;da açıp bakabilirsin.
        </p>
      </Dosya>

      <Dosya no={2} ad="POTCAR" ozet="Her element için pseudopotansiyel.">
        <p>
          POTCAR&apos;lar VASP paketiyle gelen <Kod>pseudoPOT/PP_GGA</Kod> klasöründe, her element ayrı klasörde. Birden çok
          element varsa dosyaları <Kod>cat</Kod> ile uç uca ekle. <strong className="text-ink">Sıra POSCAR&apos;daki element
          sırasıyla aynı olmalı.</strong> Aşağıdaki örnek <Kod>S Ga Se</Kod> sırası için (DOS kılavuzundaki POSCAR); kendi
          elementlerinle yaz, satırları tek tek çalıştır.
        </p>
        <CodeBlock title="POTCAR'ı birleştir (TRUBA)" language="bash" code={POTCAR_KOMUT} />
        <p>
          <Kod>ls</Kod> klasördekileri listeler, <Kod>cd</Kod> klasöre girer, <Kod>cat A B &gt; C</Kod> A ile B&apos;yi
          birleştirip C&apos;ye yazar. Son komut her elementin bir satırını gösterir; sıra POSCAR&apos;la aynı olmalı.
        </p>
        <p>
          Aynı element için birden çok klasör olabilir (ör. <Kod>Ga</Kod> ve <Kod>Ga_d</Kod>). Hangisini kullanacağını
          bilmiyorsan hocaya sor.
        </p>
        <p className="text-ink-3">
          Kaynak: <Dis href={`${WIKI}/POTCAR`}>VASP Wiki POTCAR</Dis>. POTCAR&apos;lar VASP lisansı gereği sitede paylaşılmıyor.
        </p>
      </Dosya>

      <Dosya no={3} ad="KPOINTS" ozet="k-noktası ızgarası. Beş satır, elle yaz.">
        <Satirlar
          kod
          satirlar={[
            ['k-points', 'Açıklama satırı.'],
            ['0', 'Izgarayı VASP kendisi kursun.'],
            [
              'Gamma',
              <>
                Izgara Γ merkezli. <Kod>Monkhorst-Pack</Kod> da yazılabilir; yalnız ilk harfe bakılır.
              </>,
            ],
            ['16 16 1', 'Üç yöndeki bölüm sayısı.'],
            ['0.0 0.0 0.0', 'Kayma; genelde sıfır.'],
          ]}
        />
        <CodeBlock title="Örnek (bant yapısı ve DOS kılavuzları)" language="text" code={KPOINTS_ORNEK} />
        <p>Kılavuzlardaki 2B örneklerde üçüncü sayı (vakum yönü) 1.</p>
        <p className="text-ink-3">
          Kaynak: <Dis href={`${WIKI}/KPOINTS`}>VASP Wiki KPOINTS</Dis>.
        </p>
      </Dosya>

      <Dosya no={4} ad="INCAR" ozet="Ne hesaplanacak, nasıl.">
        <p>
          Her satır <Kod>ETİKET = değer</Kod>. <Kod>#</Kod> ya da <Kod>!</Kod>&apos;ten sonrası yorumdur. Yazmadığın
          etiketler VASP&apos;ın varsayılan değerini alır. Bir etiketin ne yaptığını öğrenmek için Wiki&apos;de adını ara (ör.{' '}
          <Dis href={`${WIKI}/ENCUT`}>ENCUT</Dis>, <Dis href={`${WIKI}/ISMEAR`}>ISMEAR</Dis>,{' '}
          <Dis href={`${WIKI}/IBRION`}>IBRION</Dis>).
        </p>
        <p>
          Ezberden yazma: kılavuzlardaki INCAR&apos;lara bak, her satırın anlamını Wiki&apos;den bul, kendi hesabın için
          yaz. Aşağıdaki, bant yapısı kılavuzundaki SC hesabının INCAR&apos;ı; diğer kılavuzlarda her etiketin Türkçe
          açıklaması tabloda.
        </p>
        <CodeBlock title="Örnek: SC hesabı (bant yapısı kılavuzu)" language="text" code={INCAR_ORNEK} />
        <p className="text-ink-3">
          Kaynak: <Dis href={`${WIKI}/INCAR`}>VASP Wiki INCAR</Dis>. Relax için hocanın önerdiği sıra aşağıda.
        </p>
      </Dosya>

      <div className="rounded-lg border border-line bg-sunken p-4 text-sm leading-relaxed text-ink-2 sm:p-6">
        <strong className="text-ink">Dört dosya hazır mı?</strong> Klasörde <Kod>ls</Kod> yaz;{' '}
        <Kod>INCAR KPOINTS POSCAR POTCAR</Kod> görmelisin. Sonra{' '}
        <a href="#walk-std" className="text-link underline">
          İlk hesap
        </a>
        : <Kod>walk_std</Kod>&apos;yi kopyala ve <Kod>sbatch walk_std</Kod>.
      </div>
    </div>
  );
}
