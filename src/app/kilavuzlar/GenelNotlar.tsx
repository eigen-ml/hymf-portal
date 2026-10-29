'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Cpu, FileCode, FolderDown, Layers, Network } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';
import { KullaniciAdiSaglayici } from './KullaniciAdi';
import { TrubaBaglanti } from './TrubaBaglanti';

const SEKMELER = [
  { id: 'kurulum', ad: 'Kurulum', Ikon: Cpu },
  { id: 'kilavuzlar', ad: 'Hesap kılavuzları', Ikon: BookOpen },
  { id: 'dosyalar', ad: 'Dosyalar', Ikon: FolderDown },
  { id: 'vasp', ad: 'VASP örnekleri', Ikon: FileCode },
  { id: 'lammps', ad: 'LAMMPS', Ikon: Layers },
  { id: 'erisim', ad: 'Kampüs dışı erişim', Ikon: Network },
] as const;

type SekmeId = (typeof SEKMELER)[number]['id'];

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
      const sekme = SEKMELER.find((s) => s.id === h);
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

  useEffect(() => {
    if (!hedef.current) return;
    document.getElementById(hedef.current)?.scrollIntoView();
    hedef.current = null;
  }, [activeTab]);

  const sekmeAc = (id: SekmeId) => {
    setActiveTab(id);
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="space-y-8">
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

      {/* VASP örnekleri */}
      {activeTab === 'vasp' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              VASP giriş dosyaları: genel örnek
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              VASP çalıştırmak için çalışma dizininde 4 dosya bulunmalıdır: <strong>INCAR</strong> (hesaplama parametreleri), <strong>POSCAR</strong> (atomik koordinatlar), <strong>KPOINTS</strong> (Brillouin bölgesi örneklemesi) ve <strong>POTCAR</strong> (pseudopotansiyeller).
            </p>
            <p className="text-sm text-ink-2 leading-relaxed">
              Aşağıdaki değerler genel bir başlangıç örneğidir, grubun standardı değildir. ENCUT ve k-noktası ağını kendi
              sisteminiz için yakınsama testiyle seçin. Grubun kullandığı adımlar yukarıdaki hesap kılavuzlarındadır.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-md bg-sunken border border-line space-y-2">
                <span className="text-sm font-semibold text-ink">KPOINTS (Monkhorst-Pack şablonu)</span>
                <CodeBlock
                  title="KPOINTS Dosyası"
                  language="text"
                  code={`Automatic mesh
0
Monkhorst-Pack
 12  12   1
 0   0   0`}
                />
              </div>

              <div className="p-4 rounded-md bg-sunken border border-line space-y-2">
                <span className="text-sm font-semibold text-ink">POTCAR birleştirme komutu</span>
                <CodeBlock
                  title="POTCAR hazırlama (Mo ve S örneği)"
                  language="bash"
                  code={`# Klasör yolunu kendi POTCAR kütüphanenize göre değiştirin; sıra POSCAR'daki element sırasıyla aynı olmalı
cat [potcar_klasoru]/Mo_pv/POTCAR [potcar_klasoru]/S/POTCAR > POTCAR`}
                />
              </div>
            </div>

            <div className="pt-3">
              <h3 className="text-sm font-semibold text-ink mb-2">
                Örnek geometri optimizasyonu INCAR&apos;ı
              </h3>
              <CodeBlock
                title="INCAR (geometri optimizasyonu, örnek)"
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
            </div>
          </div>

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
                Yukarıdaki örnek INCAR bu adım için.
              </li>
              <li>
                <strong className="text-ink">ISIF = 2:</strong> hücre sabit kalır, yalnız atom konumları gevşer. Başlangıç
                yapısı birinci adımın <strong>CONTCAR</strong>&apos;ı; INCAR, KPOINTS ve POTCAR aynı, yalnız ISIF satırı
                değişir.
              </li>
            </ol>
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
