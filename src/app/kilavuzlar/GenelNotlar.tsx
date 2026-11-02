'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Cpu, FileCode, FolderDown, Layers, Network, Send } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';
import { GirisDosyalari } from './GirisDosyalari';
import { KullaniciAdiSaglayici } from './KullaniciAdi';
import { TrubaBaglanti } from './TrubaBaglanti';

const SEKMELER = [
  { id: 'kurulum', ad: 'Kurulum', Ikon: Cpu },
  { id: 'giris', ad: 'Giriş dosyaları', Ikon: FileCode },
  { id: 'kilavuzlar', ad: 'Hesap kılavuzları', Ikon: BookOpen },
  { id: 'dosyalar', ad: 'Dosyalar', Ikon: FolderDown },
  { id: 'lammps', ad: 'LAMMPS', Ikon: Layers },
  { id: 'erisim', ad: 'Kampüs dışı erişim', Ikon: Network },
] as const;

type SekmeId = (typeof SEKMELER)[number]['id'];

// Yeni gelenin sırası. hedef bir sekme ya da Kurulum'daki bir başlık (#walk-std).
const YOL: { ad: string; ne: string; hedef: string; Ikon: typeof Cpu }[] = [
  { ad: 'Kurulum', ne: "TRUBA hesabı, VPN, VASP ve Si testi", hedef: 'kurulum', Ikon: Cpu },
  { ad: 'Giriş dosyaları', ne: 'POSCAR, POTCAR, KPOINTS, INCAR: elle', hedef: 'giris', Ikon: FileCode },
  { ad: 'İlk hesap', ne: 'walk_std ile gönder, sonucu izle', hedef: 'walk-std', Ikon: Send },
  { ad: 'Hesap kılavuzları', ne: 'Bant, DOS, fonon, optik, Bader', hedef: 'kilavuzlar', Ikon: BookOpen },
];

// Açık sekme adresteki #'den okunur: /kilavuzlar#dosyalar doğru sekmeyi açar. Başka sekmedeyken kurulumdaki bir
// başlığa (#adim-gonder, #walk-std) giden bağlantı önce Kurulum sekmesine geçer, sonra o başlığa kayar.
export function GenelNotlar({
  vaspPaketUrl,
  kilavuzlar,
  dosyalar,
}: {
  vaspPaketUrl?: string;
  kilavuzlar: React.ReactNode;
  dosyalar: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<SekmeId>('kurulum');
  const hedef = useRef<string | null>(null);

  useEffect(() => {
    const adrestenAc = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      const sekme = SEKMELER.find((s) => s.id === (h === 'vasp' ? 'giris' : h));
      if (sekme) setActiveTab(sekme.id);
      else if (!document.getElementById(h)) {
        hedef.current = h;
        setActiveTab('kurulum');
      }
    };
    adrestenAc();
    window.addEventListener('hashchange', adrestenAc);
    return () => window.removeEventListener('hashchange', adrestenAc);
  }, []);

  // Kurulum içeriği bir kare sonra çizilebilir; başlık görünene kadar birkaç kare dene.
  useEffect(() => {
    const id = hedef.current;
    if (!id) return;
    hedef.current = null;
    let kare = 0;
    let istek = 0;
    const kaydir = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView();
      else if (++kare < 30) istek = requestAnimationFrame(kaydir);
    };
    kaydir();
    return () => cancelAnimationFrame(istek);
  }, [activeTab]);

  const sekmeAc = (id: SekmeId) => {
    setActiveTab(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="space-y-8">
      <nav aria-label="Nereden başlamalı" className="space-y-3">
        <p className="text-sm font-semibold text-ink">Yeni geldiysen bu sırayla git</p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {YOL.map(({ ad, ne, hedef, Ikon }, i) => (
            <li key={hedef}>
              <a
                href={`#${hedef}`}
                className="flex h-full items-start gap-3 rounded-lg border border-line bg-surface p-4 transition hover:border-primary"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-semibold text-ink">
                    <Ikon className="size-4 text-ink-3" aria-hidden="true" />
                    {ad}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-2">{ne}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div role="tablist" aria-label="Bölümler" className="flex flex-wrap gap-2 border-b border-line pb-2">
        {SEKMELER.map(({ id, ad, Ikon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => sekmeAc(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
              activeTab === id
                ? 'bg-primary text-on-primary'
                : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
            }`}
          >
            <Ikon className="w-4 h-4" />
            <span>{ad}</span>
          </button>
        ))}
      </div>

      {activeTab === 'kurulum' && (
        <KullaniciAdiSaglayici>
          <TrubaBaglanti vaspPaketUrl={vaspPaketUrl} />
        </KullaniciAdiSaglayici>
      )}

      {activeTab === 'kilavuzlar' && kilavuzlar}

      {activeTab === 'dosyalar' && dosyalar}

      {activeTab === 'giris' && (
        <div className="space-y-6">
          <GirisDosyalari />

          {/* Sıra Rabia Hoca'nın grup için önerdiği yöntem (Ekim 2026). ISIF anlamları ve Pulay stresi notu VASP Wiki'nin
              ISIF ve Pulay stress sayfalarından (30 Eki 2026). */}
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">Relax sırası</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Hocanın önerdiği sıra: önce <strong>ISIF = 3</strong> ile relax, sonra onun <strong>CONTCAR</strong>&apos;ıyla{' '}
              <strong>ISIF = 2</strong> ile ikinci bir relax. İki adımı da elle, ayrı klasörlerde gönder.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-2 leading-relaxed marker:text-ink-3">
              <li>
                <strong className="text-ink">ISIF = 3:</strong> atom konumları, hücre şekli ve hücre hacmi birlikte gevşer.
                Aşağıdaki örnek INCAR bu adım için.
              </li>
              <li>
                <strong className="text-ink">ISIF = 2:</strong> hücre sabit kalır, yalnız atom konumları gevşer. Başlangıç
                yapısı birinci adımın <strong>CONTCAR</strong>&apos;ı; INCAR, KPOINTS ve POTCAR aynı, yalnız ISIF satırı
                değişir.
              </li>
            </ol>
            <CodeBlock
              title="Örnek INCAR, ISIF = 3 (genel örnek, grubun standardı değil)"
              language="text"
              code={`# Örnek geometri optimizasyonu INCAR'ı
SYSTEM = MoS2_relax

# Elektronik Rahatlama
ENCUT  = 520       # Düzlem dalga kesme enerjisi (eV)
PREC   = Accurate  # Hassasiyet derecesi
EDIFF  = 1E-6      # SCF yakınsama toleransı
NELM   = 100       # Maksimum SCF adım sayısı
ISMEAR = 0         # Gaussian smearing (yarıiletken ve yalıtkanlar için)
SIGMA  = 0.05

# İyonik Rahatlama
IBRION = 2         # Eşlenik gradyan algoritması
ISIF   = 3         # Hücre hacmi ve iyonik pozisyonlar birlikte gevşetilir
NSW    = 200       # Maksimum iyonik adım sayısı
EDIFFG = -0.01     # İyonik kuvvet yakınsama kriteri (-0.01 eV/Angstrom)

# Performans ve Paralelleştirme
NCORE  = 4         # Bir bandı paylaşan çekirdek sayısı; performansa göre ayarlayın
LREAL  = Auto      # Gerçek uzay projeksiyonu
LWAVE  = .FALSE.   # WAVECAR çıktısını disk tasarrufu için kapat
LCHARG = .TRUE.    # CHGCAR çıktısını al`}
            />
            <p className="text-sm text-ink-2 leading-relaxed">
              Birinci adım bittikten sonra, onun klasöründe (örnekte <code className="font-mono">yeni_hesap</code>):
            </p>
            <CodeBlock
              title="İkinci adımı hazırla (TRUBA)"
              language="bash"
              code={`mkdir ../yeni_hesap_isif2
cp INCAR KPOINTS POTCAR walk_std ../yeni_hesap_isif2/
cp CONTCAR ../yeni_hesap_isif2/POSCAR
cd ../yeni_hesap_isif2
sed -i 's/^\\( *ISIF *= *\\)3/\\12/' INCAR && grep ISIF INCAR`}
            />
            <p className="text-sm text-ink-2 leading-relaxed">
              Son satır <code className="font-mono">ISIF   = 2</code> göstermeli. Sonra aynı klasörde{' '}
              <code className="font-mono">sbatch walk_std</code>.
            </p>
            <p className="text-sm text-ink-3 leading-relaxed">
              Hücre değişince VASP&apos;ın düzlem dalga tabanı hesap boyunca ilk hücreye göre kalır (Pulay stresi); hesabı yeni
              hücreyle baştan başlatmak tabanı yeniler. Kaynak:{' '}
              <a href="https://www.vasp.at/wiki/index.php/ISIF" target="_blank" rel="noopener noreferrer" className="text-link underline">VASP Wiki ISIF</a>,{' '}
              <a href="https://www.vasp.at/wiki/index.php/Pulay_stress" target="_blank" rel="noopener noreferrer" className="text-link underline">Pulay stress</a>.
            </p>
          </div>
        </div>
      )}

      {/* LAMMPS */}
      {activeTab === 'lammps' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              LAMMPS: genel NVT örneği
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Genel bir LAMMPS giriş dosyası örneği (Tersoff potansiyeliyle SiC, 300 K NVT), grubun standardı değildir. TRUBA&apos;da LAMMPS hazır modül olarak var; güncel modül adını <code className="font-mono">module avail</code> ile görün.
            </p>

            <CodeBlock
              title="in.nvt (örnek NVT dengeleme)"
              language="text"
              code={`# Örnek LAMMPS NVT dengeleme
units          metal
atom_style     atomic
boundary       p p p

read_data      structure.data

pair_style     tersoff
pair_coeff     * * SiC.tersoff C Si

velocity       all create 300.0 4928459 rot yes dist gaussian

timestep       0.001   # 1 fs

thermo         1000
thermo_style   custom step temp pe etotal press

fix            1 all nvt temp 300.0 300.0 0.1

dump           1 all custom 2000 traj.lammpstrj id type x y z vx vy vz

run            50000   # 50 ps`}
            />
          </div>
        </div>
      )}

      {/* Kampüs dışı erişim. Kaynak: kutuphane.ankara.edu.tr/kampus-disi-erisim ve bid.ankara.edu.tr/proxy (13 Eki 2026). */}
      {activeTab === 'erisim' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              Kampüs dışından makale ve veri tabanı erişimi
            </h2>
            <div className="text-sm text-ink-2 space-y-3 leading-relaxed">
              <p>
                Üniversitenin abone olduğu veri tabanlarına lisans gereği yalnız Ankara Üniversitesi IP adreslerinden
                girilebilir. Kampüs dışından iki yol var:
              </p>
              <ul className="space-y-3 pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">KDS ile kurumsal giriş:</strong> yayıncının sitesinde &quot;Kurumsal Giriş&quot;
                    seçeneğinden Ankara Üniversitesi&apos;ni seçip KDS bilgilerinizle girin; proxy ayarı gerekmez. Listede
                    ScienceDirect, AIP, ACS, IOP, Nature, SpringerLink, Wiley, Web of Science ve Scopus da var.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">Proxy sunucusu:</strong> tarayıcının proxy ayarlarını yapın. Kullanıcı adı{' '}
                    <code className="font-mono">TC-kimlik-no@ankara.edu.tr</code>, şifre KDS şifreniz. Sunucu adresi ve ayarlar{' '}
                    <a href="https://bid.ankara.edu.tr/proxy/" target="_blank" rel="noopener noreferrer" className="text-link underline">Bilgi İşlem proxy sayfasındaki</a>{' '}
                    Firefox kılavuzunda. İşiniz bitince proxy&apos;yi kapatmanız önerilir.
                  </div>
                </li>
              </ul>
              <p className="text-ink-3">
                Kaynak ve veri tabanlarının tam listesi:{' '}
                <a href="https://kutuphane.ankara.edu.tr/kampus-disi-erisim/" target="_blank" rel="noopener noreferrer" className="text-link underline">Kütüphane kampüs dışı erişim</a>.
                KDS şifresi <a href="https://kds.ankara.edu.tr/" target="_blank" rel="noopener noreferrer" className="text-link underline">kds.ankara.edu.tr</a>{' '}
                adresinden alınır ya da değiştirilir.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
