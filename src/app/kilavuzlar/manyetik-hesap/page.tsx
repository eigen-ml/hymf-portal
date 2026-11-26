import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { requireMember } from '@/lib/auth/dal';
import { CodeBlock } from '@/components/CodeBlock';
import { AcilirBolum, SayfaBasligi, Uyari } from '@/components/ui';

// Tek kaynak: 5_kilavuzlar/Hesap-Kilavuzu-Genel.md (Kasım 2026). Yeni bilgi eklenmez, kod blokları birebir aynı.
// Yayımlanmamış sonuç (aday adı, J, Tc, MAE değeri) ve kişisel yol yok, örnekler yer tutucuyla. Kaynakçadaki DOI'ler
// Crossref'le doğrulandı (26 Kas 2026). Fonon, bant, DOS ve TRUBA ayrıntısı portaldaki kılavuzlara bağlanır.

function Kod({ children }: { children: React.ReactNode }) {
  return <code className="font-mono break-words">{children}</code>;
}

function Bak({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-sunken px-3 py-2">
      <strong className="text-ink">Bak:</strong> {children}
    </div>
  );
}

function Ic({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-link underline">
      {children}
    </Link>
  );
}

const ADIMLAR = [
  { no: 1, ad: 'Relaxation', program: 'VASP', verir: 'Gevşemiş yapı', yer: 'küme' },
  { no: 2, ad: 'Manyetik düzen', program: 'VASP', verir: 'Temel durum (FM mi AFM mi)', yer: 'küme' },
  { no: 3, ad: 'Fonon', program: 'VASP + phonopy', verir: 'Dinamik kararlılık', yer: 'küme' },
  { no: 4, ad: 'Bant ve DOS', program: 'VASP + vaspkit', verir: 'Metal, yarı iletken, yarı metal', yer: 'küme' },
  { no: 5, ad: 'Manyetik anizotropi', program: 'VASP (spin-yörünge)', verir: 'Kolay eksen', yer: 'küme' },
  { no: 6, ad: 'Wannier fonksiyonları', program: 'VASP + Wannier90', verir: 'Sıkı bağ Hamiltonyeni', yer: 'küme' },
  { no: 7, ad: 'Değiş tokuş sabitleri', program: 'TB2J', verir: 'J (ve spin-yörüngeyle DMI)', yer: 'kişisel bilgisayar' },
  { no: 8, ad: 'Magnon bandı', program: 'TB2J', verir: 'Manyetik düzenin kararlılığı', yer: 'kişisel bilgisayar' },
  { no: 9, ad: 'Curie sıcaklığı', program: 'Vampire', verir: 'Mıknatıslanma–sıcaklık eğrisi', yer: 'kişisel bilgisayar' },
] as const;

const KAYNAKLAR = [
  ['G. Kresse, J. Furthmüller, Phys. Rev. B 54, 11169 (1996).', '10.1103/PhysRevB.54.11169'],
  ['G. Kresse, D. Joubert, Phys. Rev. B 59, 1758 (1999).', '10.1103/PhysRevB.59.1758'],
  ['J. P. Perdew, K. Burke, M. Ernzerhof, Phys. Rev. Lett. 77, 3865 (1996).', '10.1103/PhysRevLett.77.3865'],
  ['S. L. Dudarev ve ark., Phys. Rev. B 57, 1505 (1998).', '10.1103/PhysRevB.57.1505'],
  ['S. Grimme ve ark., J. Chem. Phys. 132, 154104 (2010).', '10.1063/1.3382344'],
  ['A. Togo ve ark., J. Phys. Soc. Jpn. 92, 012001 (2023).', '10.7566/JPSJ.92.012001'],
  ['V. Wang ve ark., Comput. Phys. Commun. 267, 108033 (2021).', '10.1016/j.cpc.2021.108033'],
  ['G. Pizzi ve ark., J. Phys.: Condens. Matter 32, 165902 (2020).', '10.1088/1361-648X/ab51ff'],
  ['A. I. Liechtenstein ve ark., J. Magn. Magn. Mater. 67, 65 (1987).', '10.1016/0304-8853(87)90721-9'],
  ['X. He ve ark., Comput. Phys. Commun. 264, 107938 (2021).', '10.1016/j.cpc.2021.107938'],
  ['T. Moriya, Phys. Rev. 120, 91 (1960).', '10.1103/PhysRev.120.91'],
  ['R. F. L. Evans ve ark., J. Phys.: Condens. Matter 26, 103202 (2014).', '10.1088/0953-8984/26/10/103202'],
  ['D. Torelli, T. Olsen, 2D Mater. 6, 015028 (2019).', '10.1088/2053-1583/aaf06d'],
] as const;

const ORTAK_INCAR = String.raw`ENCUT  = 520            # en büyük ENMAX'ın ~1,3 katı, yakınsama testiyle
ISPIN  = 2              # spin polarize
ISMEAR = 0
SIGMA  = 0.05
LDAU     = .TRUE.
LDAUTYPE = 2          # Dudarev +U, yalnız 3d metallerde (ör. 4 eV)
IVDW   = 11             # D3 van der Waals düzeltmesi
LMAXMIX = 4             # d elektronlu sistemlerde şart
EDIFF  = 1E-08`;

const FONON = String.raw`phonopy -d --dim 4 4 1 -c POSCAR --tolerance 1e-3   # POSCAR-001, POSCAR-002 ...
# her POSCAR-XXX için ayrı VASP: PREC = Accurate, IBRION = -1, NSW = 0, ISYM = 0
phonopy -f disp-*/vasprun.xml                        # FORCE_SETS
phonopy -c POSCAR band.conf`;

const BANT = String.raw`cd 03_bant
EF=$(grep E-fermi ../02_dos/OUTCAR | tail -1 | awk '{print $3}')
printf "# 02_dos E-fermi\n %s\n" "$EF" > FERMI_ENERGY.in
printf "211\n" | vaspkit > vaspkit.log
cat BAND_GAP`;

const WANNIER_INCAR = String.raw`ICHARG = 11
ISYM   = -1
NCORE  = 1
LWANNIER90     = .TRUE.
LWRITE_MMN_AMN = .TRUE.
NUM_WANN = <metal sayısı × 5 + anyon sayısı × 3>`;

const TB2J = String.raw`wann2J.py --posfile POSCAR --prefix_up wannier90.1 --prefix_down wannier90.2 \
    --efermi=<EF> --kmesh 60 60 1 --elements <metal1> <metal2> --rcut 30 --np 8 \
    --output_path TB2J_results`;

const MAGNON = String.raw`TB2J_magnon.py --bands --dos -p TB2J_results --kpath GMKG --kmesh 60 60 1 --window 0 300`;

const TRUBA = String.raw`. /usr/share/Modules/init/bash
module load comp/oneapi/2024 lib/hdf5/1.14.3-oneapi-2024
ulimit -s unlimited
export OMP_NUM_THREADS=1`;

const th = 'px-3 py-2 text-left font-semibold text-ink';
const td = 'px-3 py-2 align-top';

export default async function Page() {
  await requireMember();

  return (
    <div className="space-y-8">
      <Link href="/kilavuzlar#kilavuzlar" className="text-sm font-medium text-link hover:underline">
        ← Kurulum ve Kılavuzlar
      </Link>

      <SayfaBasligi
        baslik="2B manyetik malzemede hesap"
        aciklama="Relaxation'dan Curie sıcaklığına dokuz adım: VASP, phonopy, vaspkit, Wannier90, TB2J ve Vampire."
      />

      <div className="space-y-3 text-sm leading-relaxed text-ink-2">
        <p>
          Bu sayfa, iki boyutlu (2B) manyetik bir tek katmanın kararlılığını, elektronik yapısını, değiş tokuş sabitlerini ve
          Curie sıcaklığını elle hesaplamak isteyenler için. Hazır betik yok, her adımda ne yapıldığı, hangi ayarın neden
          seçildiği ve sonuçta neye bakılacağı var. Komutlarda <Kod>&lt;M&gt;</Kod> malzeme adı, <Kod>&lt;kullanıcı&gt;</Kod>{' '}
          TRUBA kullanıcı adı, <Kod>&lt;EF&gt;</Kod> Fermi seviyesi (eV).
        </p>
        <p className="text-ink-3">Başlığa tıklayınca bölüm açılır. Sırayla git, bir adımın çıktısı sonrakinin girdisi.</p>
      </div>

      <div className="space-y-3">
        <AcilirBolum baslik="Büyük resim" ozet="Dokuz adım, hangi program, ne verir" id="buyuk-resim" acik>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-sunken">
                <tr>
                  <th className={th}>Adım</th>
                  <th className={th}>Program</th>
                  <th className={th}>Ne verir</th>
                  <th className={th}>Nerede</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ADIMLAR.map((a) => (
                  <tr key={a.no}>
                    <td className={`${td} font-semibold text-ink`}>
                      {a.no}. {a.ad}
                    </td>
                    <td className={td}>{a.program}</td>
                    <td className={td}>{a.verir}</td>
                    <td className={td}>{a.yer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-ink-3">
            DOS: durum yoğunluğu. FM: ferromanyetik, AFM: antiferromanyetik. DMI: Dzyaloshinskii–Moriya etkileşimi.
          </p>
          <p className="rounded-md bg-sunken px-3 py-2">
            <strong className="text-ink">Akılda tutulacak tek cümle:</strong> VASP elektronları bulur, Wannier90 onları atom
            orbitallerine çevirir, TB2J atomlar arası manyetik bağı ölçer, Vampire bu bağlarla malzemeyi ısıtıp mıknatıslığın
            nerede kaybolduğuna bakar.
          </p>
        </AcilirBolum>

        <AcilirBolum baslik="Bütün VASP hesaplarında ortak ayarlar" ozet="INCAR, vakum, k ağı, POTCAR sırası" id="ortak">
          <CodeBlock title="INCAR (ortak satırlar)" language="text" code={ORTAK_INCAR} />
          <p>
            Vakum en az 20 Å, biz 30 Å kullandık ve relaxation boyunca c eksenini sabit tuttuk. k ağı Γ merkezli: relaxation
            16×16×1, statik hesaplar 8×8×1.
          </p>
          <Uyari tone="uyari" baslik="En sık yapılan hata">
            POTCAR&apos;daki element sırası POSCAR&apos;ın 6. satırıyla aynı olmalı.
          </Uyari>
          <p className="text-ink-3">
            c eksenini sabit tutma ve vakum için: <Ic href="/kilavuzlar#giris">Giriş dosyaları, 2B yapıda vakum</Ic>.
          </p>
        </AcilirBolum>

        <AcilirBolum baslik="1. Relaxation" ozet="Önce ISIF = 3, sonra ISIF = 2" id="relaxation">
          <p>
            İki aşama: önce atomlar ve düzlem içi örgü (<Kod>ISIF = 3</Kod>, c sabit), sonra yalnız atomlar (<Kod>ISIF = 2</Kod>
            ). <Kod>IBRION = 2</Kod>, <Kod>EDIFFG = -0.01</Kod>, <Kod>NSW = 200</Kod>. Birinin CONTCAR&apos;ı ötekinin
            POSCAR&apos;ı.
          </p>
          <Bak>
            OUTCAR&apos;da &quot;reached required accuracy&quot;. Tabaka bozuldu mu: ilk yapıdaki metal–anyon bağlarından biri
            %25&apos;ten fazla uzadıysa tabaka kopmuştur, daha kısa vakumla tekrar dene.
          </Bak>
          <p className="text-ink-3">
            İki adımı hazırlayan komutlar: <Ic href="/kilavuzlar#giris">Giriş dosyaları, Relax sırası</Ic>.
          </p>
        </AcilirBolum>

        <AcilirBolum baslik="2. Manyetik düzen" ozet="NM, FM ve AFM enerjilerini kıyasla" id="manyetik-duzen">
          <p>
            Aynı yapıda NM, FM ve birim hücrede kurulabilen AFM düzenlerini ayrı ayrı hesapla (<Kod>MAGMOM</Kod> ile,{' '}
            <Kod>ISYM = 0</Kod> ki spin simetriyi bozabilsin). Birim hücreyle yetinme: 2×1, c2×2, √3×√3 süper hücrelerde düzlem
            içi zıt spin düzenlerini de dene.
          </p>
          <Bak>
            <Kod>grep E0 OSZICAR | tail -1</Kod>. En düşük enerji temel durum, farkı metal atomu başına meV yaz.
          </Bak>
        </AcilirBolum>

        <AcilirBolum baslik="3. Fonon (phonopy)" ozet="Dinamik kararlılık: sanal dal var mı" id="fonon">
          <p>Sonlu yer değiştirme: phonopy atomları 0,01 Å kaydırır, VASP kuvvetleri hesaplar.</p>
          <CodeBlock title="phonopy (TRUBA)" code={FONON} />
          <p>
            band.conf&apos;ta <Kod>FC_SYMMETRY = .TRUE.</Kod> yaz. Bu akustik toplam kuralını uygular, Γ yakınındaki −0,01 THz
            gibi sayısal sapmaları siler. Süper hücre her yönde en az ~12 Å olmalı.
          </p>
          <Bak>band.yaml&apos;daki en küçük frekans. Sanal (negatif) dal varsa yapı dinamik olarak kararsız.</Bak>
          <p className="text-ink-3">
            Adım adım anlatım: <Ic href="/kilavuzlar/fonon.pdf">Fonon hesabı (phonopy)</Ic>. Fonon işinde bellek hatası alırsan:{' '}
            <Ic href="/kilavuzlar/truba-kuyruk">TRUBA&apos;da iş gönderme</Ic>.
          </p>
        </AcilirBolum>

        <AcilirBolum baslik="4. Bant ve durum yoğunluğu (vaspkit)" ozet="Metal mi, yarı iletken mi, yarı metal mi" id="bant-dos">
          <p>
            Üç klasör: <Kod>01_scf</Kod> (yük yoğunluğu, <Kod>LCHARG = .TRUE.</Kod>), <Kod>02_dos</Kod> (<Kod>ICHARG = 11</Kod>,{' '}
            <Kod>ISMEAR = -5</Kod>, <Kod>NEDOS = 3001</Kod>), <Kod>03_bant</Kod> (<Kod>ICHARG = 11</Kod>, Line-mode, parça başına
            120 nokta, 60&apos;ta pürüz görülebiliyor). Son işlem vaspkit ile:
          </p>
          <CodeBlock title="vaspkit ile bant aralığı (TRUBA)" code={BANT} />
          <p>
            <Kod>FERMI_ENERGY.in</Kod> şart: vaspkit yoksa Fermi seviyesini bant klasörünün DOSCAR&apos;ından okur, o da
            güvenilmez.
          </p>
          <Bak>
            metalde BAND_GAP&apos;teki küçük &quot;aralık&quot; anlamsız, Fermi seviyesini kesen bant sayısına bak. Bir spin
            kanalı metal, öbürü yalıtkansa malzeme yarı metal.
          </Bak>
          <p className="text-ink-3">
            Adım adım anlatım: <Ic href="/kilavuzlar/bant-yapisi.pdf">Bant yapısı hesabı</Ic>,{' '}
            <Ic href="/kilavuzlar/dos.pdf">Durum yoğunluğu (DOS) hesabı</Ic>.
          </p>
        </AcilirBolum>

        <AcilirBolum
          baslik="5. Manyetik anizotropi (MAE)"
          ozet="Manyetik anizotropi enerjisi: kolay eksen düzlemde mi, dik mi"
          id="mae"
        >
          <p>
            <Kod>01_scf</Kod> kolineer hesaptan CHGCAR al, iki spin-yörüngeli hesap koş (<Kod>vasp_ncl</Kod>,{' '}
            <Kod>LSORBIT = .TRUE.</Kod>, <Kod>ICHARG = 11</Kod>, <Kod>ISYM = -1</Kod>): <Kod>SAXIS = 1 0 0</Kod> ve{' '}
            <Kod>SAXIS = 0 0 1</Kod>, <Kod>MAGMOM</Kod> atom başına <Kod>0 0 m</Kod>.
          </p>
          <p>
            MAE = E(100) − E(001). Negatif çıkarsa kolay eksen düzlem içinde.
          </p>
          <Bak>k ağını 12&apos;den 30&apos;a büyüt, fark değişmiyorsa yakınsamış.</Bak>
        </AcilirBolum>

        <AcilirBolum baslik="6. Wannier90" ozet="VASP bantlarını metal d ve anyon p orbitallerine çevir" id="wannier90">
          <p>Amaç VASP&apos;ın elektronik yapısını metal d ve anyon p orbitallerine çevirmek. INCAR&apos;a ekle:</p>
          <CodeBlock title="INCAR (Wannier90 için eklenen satırlar)" language="text" code={WANNIER_INCAR} />
          <p>
            wannier90.win&apos;de <Kod>projections</Kod> (ör. <Kod>Mn:d</Kod>, <Kod>S:p</Kod>), <Kod>num_iter = 0</Kod> (her
            fonksiyon orbital kimliğini korur, TB2J için önerilen), dış pencerenin ve donuk pencerenin alt sınırı aynı (dolu
            bantların hepsi içeride), donuk pencerenin üstü Fermi seviyesinin ~1 eV üstü.
          </p>
          <Uyari tone="uyari" baslik="İki tuzak">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <Kod>NPAR</Kod> yazarsan VASP &quot;PEAD routines do not work&quot; diye 30 saniyede düşer, <Kod>NCORE = 1</Kod>{' '}
                şart.
              </li>
              <li>
                VASP 6 kolineer dosyaları <Kod>wannier90.1</Kod> (↑) ve <Kod>wannier90.2</Kod> (↓) diye yazar.
              </li>
            </ul>
          </Uyari>
          <Bak>
            <Kod>.wout</Kod>&apos;ta &quot;Disentanglement convergence criteria satisfied&quot;, yayılım d için ~1, p için ~2 Å².
            Asıl sınama: Wannier bandını VASP bandının aynı k noktalarında çöz, donuk pencerede fark birkaç meV olmalı. Orbital
            karakteri de kıyasla, anyon p&apos;nin Wannier&apos;de biraz fazla çıkması normal (VASP yalnız atom küresinin içini
            sayar).
          </Bak>
        </AcilirBolum>

        <AcilirBolum baslik="7. TB2J: değiş tokuş sabitleri" ozet="Önce kolineer J, sonra spin-yörüngeyle DMI" id="tb2j">
          <CodeBlock title="TB2J (kişisel bilgisayar)" code={TB2J} />
          <p>
            TB2J&apos;nin kuralı E = −Σ J e<sub>i</sub>·e<sub>j</sub>, J &gt; 0 ferromanyetik. Negatif <Kod>&lt;EF&gt;</Kod> için{' '}
            <Kod>=</Kod> şart. k ağını 30, 60, 90 diye büyüt, J&apos;ler değişmiyorsa yakınsamış. <Kod>exchange.out</Kod> okunacak
            dosya: başta atom momentleri, sonra her çift için J.
          </p>
          <Bak>
            J&apos;lerden 2. adımdaki zıt spin düzenlerinin enerjisini hesapla, VASP toplam enerji farkıyla kıyasla. İşaret
            (hangi düzen kazanıyor) tutmalı, büyüklük farkı yorumlanmalı.
          </Bak>
          <AcilirBolum baslik="Spin-yörüngeyle DMI" kucuk>
            <p>
              Üç ayrı hesap: <Kod>SAXIS = 1 0 0</Kod>, <Kod>0 1 0</Kod>, <Kod>0 0 1</Kod> (<Kod>vasp_ncl</Kod>,{' '}
              <Kod>LSORBIT</Kod>, spinor Wannier, fonksiyon sayısı iki katı). Her yönde{' '}
              <Kod>wann2J.py --spinor --prefix_spinor wannier90 --groupby orbital ...</Kod>.
            </p>
            <Uyari tone="uyari">
              <Kod>--groupby orbital</Kod> yazmazsan VASP&apos;ın ↑↓↑↓ sırası yanlış okunur ve hata vermeden yanlış J çıkar.
            </Uyari>
            <p>
              Fermi seviyesini kolineer DOS hesabından al. Üç sonucu birleştir (<Kod>TB2J_merge.py</Kod>). VASP SAXIS&apos;li
              hesapta momenti yerel z&apos;de yazdığından birleştirmeden önce x ve y sonuçlarının örgüsünü SAXIS dönüşüyle
              çevirmek gerekebilir.
            </p>
            <Bak>terslik merkeziyle bağlı çiftlerde D sıfır olmalı (Moriya kuralı).</Bak>
          </AcilirBolum>
        </AcilirBolum>

        <AcilirBolum baslik="8. Magnon bandı" ozet="Manyetik düzen kararlı mı" id="magnon">
          <CodeBlock title="TB2J magnon (kişisel bilgisayar)" code={MAGNON} />
          <p>
            <Kod>--kpath GMKG</Kod> 2B altıgen yol, otomatik seçim 3B yol kurar.
          </p>
          <Bak>
            bütün dallar pozitifse varsayılan manyetik düzen kararlı. Momenti çok küçük atomun dalı yapay olarak çok yüksek çıkar
            (frekans momente ters orantılı).
          </Bak>
        </AcilirBolum>

        <AcilirBolum baslik="9. Vampire: Curie sıcaklığı" ozet="Monte Carlo ile mıknatıslanma–sıcaklık eğrisi" id="vampire">
          <p>
            TB2J <Kod>TB2J_results/Vampire/</Kod> altına girdi yazar. Üç şeyi değiştir:
          </p>
          <ol className="list-decimal space-y-1 pl-5 marker:text-ink-3">
            <li>Tek tabaka: yalnız x ve y periyodik, z&apos;de tek katman.</li>
            <li>
              Anizotropi ekle: k = MAE / manyetik atom sayısı (J/atom). İzotrop 2B modelde sonlu sıcaklıkta düzen olmaz.
            </li>
            <li>Etkileşim kesmesini J&apos;lerin bittiği mesafeye çek.</li>
          </ol>
          <p>
            Monte Carlo, her sıcaklıkta birkaç bin dengeleme ve ölçüm adımı, en az iki sistem boyu (ör. 6 ve 10 nm). Vampire 0,1
            μB&apos;den küçük momenti kabul etmez.
          </p>
          <Bak>
            mıknatıslanmanın en hızlı düştüğü sıcaklık ve M = (1 − T/Tc)<sup>β</sup> uydurması. İki sistem boyu aynı sonucu
            veriyorsa sonlu boyut etkisi küçük. Kolay eksen düzlem içindeyse geçiş Berezinskii–Kosterlitz–Thouless türünde
            olabilir, adlandırmaya dikkat.
          </Bak>
        </AcilirBolum>

        <AcilirBolum baslik="TRUBA'da ortam ve phonopy kurulumu" ozet="Modüller, phonopy, 3 gün sınırı" id="truba">
          <CodeBlock title="Ortam (TRUBA)" code={TRUBA} />
          <p>
            phonopy kendi hesabına: <Kod>python3 -m venv /arf/home/&lt;kullanıcı&gt;/phonopy-env</Kod>, sonra{' '}
            <Kod>pip install --only-binary=:all: phonopy</Kod>. İş başına en çok 3 gün: uzun hesapları süre dolmadan durdurup
            kendini yeniden gönderen betiklerle koş.
          </p>
          <p className="text-ink-3">
            VASP kurulumu, iş betiği ve kuyruk seçimi: <Ic href="/kilavuzlar#kurulum">Kurulum</Ic>,{' '}
            <Ic href="/kilavuzlar/truba-kuyruk">TRUBA&apos;da iş gönderme</Ic>.
          </p>
        </AcilirBolum>

        <AcilirBolum baslik="Kaynakça" ozet="13 hakemli kaynak" id="kaynakca">
          <ol className="list-decimal space-y-1.5 pl-5 marker:text-ink-3">
            {KAYNAKLAR.map(([ad, doi]) => (
              <li key={doi}>
                {ad}{' '}
                <a
                  href={`https://doi.org/${doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-link underline"
                >
                  doi:{doi}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </AcilirBolum>
      </div>
    </div>
  );
}
