'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';
import { useDoldur } from '@/components/KodDegiskenleri';
import { Rozet, Uyari, buttonClass } from '@/components/ui';
import { TRUBA_DOSYALARI } from '@/lib/kilavuz/liste';
import { KullaniciAdiKutusu } from './KullaniciAdi';

// Her adım docs.truba.gov.tr'deki şu sayfalardan alındı (13 Eki 2026): OpenVPN Bağlantısı, Mac OS, Linux,
// Windows'da OpenVPN Kurulumu, SSH Bağlantısı, ARF Bağlantı, Dosya Transferi, Open OnDemand, Kullanım Kuralları,
// ARF Kuyruk Bilgisi, ARF Dosya Sistemleri ve Depolama, SLURM Betik Özellikleri, Sıkça Sorulan Sorular.
// Kaynağı olmayan bilgi eklemeyin; TRUBA değiştirirse bu sayfaları yeniden okuyun.
// Grubun kendi denemesinden gelen bilgi <Denendi /> ya da "grubun denediği" diye işaretlidir (13 Ekim 2026'da
// uçtan uca çalıştırıldı: VASP 6.6.0, debug kuyruğu, 4 çekirdek, Si testi). Komutları değiştirmeyin; denenen hâlleri bunlar.
const TRUBA_DOCS = 'https://docs.truba.gov.tr';
const KURALLAR = `${TRUBA_DOCS}/0-truba/kullanim_kurallari.html`;
const DEPOLAMA = `${TRUBA_DOCS}/1-kaynaklar/arf/arf_depolama_kaynaklari.html`;
const KUYRUK = `${TRUBA_DOCS}/1-kaynaklar/arf/arf_kuyruk_bilgisi.html`;
const BETIK = `${TRUBA_DOCS}/2-temel_bilgiler/slurm-betik-ozellik.html`;
const SSS = `${TRUBA_DOCS}/5-sikca_sorulan_sorular/index.html`;

type Sistem = 'mac' | 'windows' | 'linux';

const SISTEMLER: { id: Sistem; ad: string; kaynak: string }[] = [
  { id: 'mac', ad: 'macOS', kaynak: '2-temel_bilgiler/openvpn_installation/mac_openvpn.html' },
  { id: 'windows', ad: 'Windows', kaynak: '2-temel_bilgiler/openvpn_installation/windows_openvpn.html' },
  { id: 'linux', ad: 'Linux', kaynak: '2-temel_bilgiler/openvpn_installation/linux_openvpn.html' },
];

const SUNUCULAR: { ad: string; ip: string; not: React.ReactNode }[] = [
  { ad: 'arf-ui1', ip: '172.16.6.11', not: '' },
  {
    ad: 'arf-ui2',
    ip: '172.16.6.12',
    not: (
      <>
        Giriş için önerilen (grubun denediği: ui1 sık sık <code className="font-mono">Exceeded MaxStartups</code> verip
        bağlantıyı kesiyor)
      </>
    ),
  },
  { ad: 'arf-ui3', ip: '172.16.6.13', not: '' },
  { ad: 'arf-ui4', ip: '172.16.6.14', not: 'dosya aktarımı için önerilir' },
  { ad: 'arf-ui5', ip: '172.16.6.15', not: 'dosya aktarımı için önerilir' },
];

// Adım 9 (test dosyaları): tek seferde yapıştırılır, yalnız dosya oluşturur. $USER TRUBA'da kendiliğinden kullanıcı adı olur.
const TEST_HAZIRLA = `cd /arf/scratch/$USER && mkdir -p test_si && cd test_si && pwd
cp ../pseudoPOT/PP_GGA/Si/POTCAR .
cat > POSCAR <<'EOF'
Si bulk
5.43
0.0 0.5 0.5
0.5 0.0 0.5
0.5 0.5 0.0
Si
2
Direct
0.00 0.00 0.00
0.25 0.25 0.25
EOF
cat > INCAR <<'EOF'
SYSTEM = Si test
ENCUT  = 300
ISMEAR = 0
SIGMA  = 0.05
EDIFF  = 1E-6
LWAVE  = .FALSE.
LCHARG = .FALSE.
EOF
cat > KPOINTS <<'EOF'
Gamma
0
Gamma
6 6 6
0 0 0
EOF
cat > job.sh <<'EOF'
#!/bin/bash
#SBATCH -M arf
#SBATCH -p debug
#SBATCH -A KULLANICI
#SBATCH -J si-test
#SBATCH -N 1
#SBATCH -n 4
#SBATCH -c 1
#SBATCH --time=00:10:00
#SBATCH --output=out
#SBATCH --error=err
#SBATCH -C weka

. /usr/share/Modules/init/bash
module load comp/oneapi/2024
module load lib/hdf5/1.14.3-oneapi-2024

ulimit -s unlimited
export OMP_NUM_THREADS=1
cd $SLURM_SUBMIT_DIR
mpirun -np $SLURM_NTASKS /arf/scratch/$USER/vasp.6.6.0/bin_cpu/vasp_std
EOF
sed -i "s/^#SBATCH -A KULLANICI$/#SBATCH -A $USER/" job.sh
ls`;

// Gerçek hesap betiği: icerik/kilavuzlar/walk_std ile aynı içerik. Kuyruk değerleri TRUBA ARF Kuyruk Bilgisi'nden
// (orfoz en az 56 çekirdek, en fazla 3 gün; 17 Eki 2026). Modül ve vasp_std yolu Si testinde denenen betikten.
const WALK_KUR = `cd /arf/scratch/$USER && cat > walk_std <<'EOF'
#!/bin/bash
# HYMF örnek walk_std: gerçek hesap için iş betiği (Si testindeki job.sh değil).
# Her hesap klasörüne kopyala, değerleri işine göre ayarla, klasörün içinde "sbatch walk_std" ile gönder.
# Kuyruk değerleri TRUBA ARF Kuyruk Bilgisi sayfasından: orfoz en az 56 çekirdek, en fazla 3 gün.
#SBATCH -M arf
#SBATCH -p orfoz
#SBATCH -A KULLANICI_ADINIZ
#SBATCH -J hesap
#SBATCH -N 1
#SBATCH -n 56
#SBATCH -c 1
#SBATCH --time=1-00:00:00
#SBATCH --output=out
#SBATCH --error=err
#SBATCH -C weka

. /usr/share/Modules/init/bash
module load comp/oneapi/2024
module load lib/hdf5/1.14.3-oneapi-2024

ulimit -s unlimited
export OMP_NUM_THREADS=1
cd $SLURM_SUBMIT_DIR
mpirun -np $SLURM_NTASKS /arf/scratch/$USER/vasp.6.6.0/bin_cpu/vasp_std
EOF
sed -i "s/^#SBATCH -A KULLANICI_ADINIZ$/#SBATCH -A $USER/" walk_std
grep -E "^#SBATCH -(A|p) " walk_std`;

const WALK_DOSYA = 'walk_std';

const WALK_KULLAN = `cd /arf/scratch/$USER && mkdir -p yeni_hesap && cd yeni_hesap
cp ../walk_std .
# INCAR, POSCAR, KPOINTS ve POTCAR'ı bu klasöre koy, sonra:
sbatch walk_std`;

const TEST_KONTROL = `grep -- "-A" job.sh; tail -1 job.sh; head -1 POTCAR; wc -l POSCAR INCAR KPOINTS`;

const SONUC_OKU = `ls; echo '--- err'; tail -20 err; echo '--- out'; tail -15 out; echo '--- OUTCAR'; grep -E "free  energy|General timing|Total CPU" OUTCAR 2>/dev/null | tail -3`;

const BETIK_SATIRLARI: { satir: string; anlam: React.ReactNode }[] = [
  { satir: '#SBATCH -M arf', anlam: 'İşin gideceği küme: ARF.' },
  { satir: '#SBATCH -p debug', anlam: 'Kuyruk: debug, kısa deneme işleri için, en fazla 4 saat.' },
  {
    satir: '#SBATCH -A ...',
    anlam: 'İşin yazılacağı TRUBA hesabı. Genelde kullanıcı adındır; bloğun son satırı bunu kendi adınla doldurur.',
  },
  { satir: '#SBATCH -J si-test', anlam: 'İşin kuyrukta görünen adı.' },
  { satir: '#SBATCH -N 1 / -n 4 / -c 1', anlam: '1 sunucu, 4 görev (mpirun VASP’ı 4 kopya çalıştırır), görev başına 1 çekirdek: toplam 4 çekirdek.' },
  {
    satir: '#SBATCH --time=00:10:00',
    anlam: 'Süre sınırı (10 dakika). Zorunlu: değer verilmeyen iş başladıktan bir dakika sonra sonlandırılır; süre dolunca iş de sonlanır.',
  },
  { satir: '#SBATCH --output / --error', anlam: 'Ekran çıktısının (out) ve hata mesajlarının (err) yazılacağı dosyalar.' },
  {
    satir: '#SBATCH -C weka',
    anlam: (
      <>
        İşi yalnız <Kod>weka</Kod> özelliği olan sunuculara yollar (Slurm <Kod>--constraint</Kod>). TRUBA belgelerinde
        açıklaması yok; grubun denediği betikte var ve çalıştı.
      </>
    ),
  },
  { satir: 'module load ...', anlam: 'VASP’ın derlendiği Intel oneAPI 2024 derleyicisini ve HDF5 kütüphanesini yükler.' },
  { satir: 'mpirun ... vasp_std', anlam: 'VASP’ı istenen görev sayısı kadar paralel çalıştırır.' },
];

const KOMUTLAR: { komut: string; ne: string; nerede: 'TRUBA' | 'Bilgisayarınız' }[] = [
  { komut: 'pwd', ne: 'Hangi klasördeyim?', nerede: 'TRUBA' },
  { komut: 'cd /arf/scratch/$USER', ne: 'Çalışma klasörüne git', nerede: 'TRUBA' },
  { komut: 'ls -lh', ne: 'Dosyaları boyutlarıyla listele', nerede: 'TRUBA' },
  { komut: 'du -sh *', ne: 'Klasörlerin boyutu', nerede: 'TRUBA' },
  { komut: 'cp -r test_si yeni_hesap', ne: 'Klasörü kopyala', nerede: 'TRUBA' },
  { komut: 'sbatch job.sh', ne: 'İşi kuyruğa gönder', nerede: 'TRUBA' },
  { komut: 'squeue -M arf -u $USER', ne: 'Bekleyen ve çalışan işlerim', nerede: 'TRUBA' },
  { komut: 'scancel -M arf İŞ_NO', ne: 'İşi durdur (İŞ_NO: sbatch’in verdiği numara)', nerede: 'TRUBA' },
  {
    komut: 'sacct -M arf -u $USER --starttime today -o JobID,JobName,State,Elapsed',
    ne: 'Bugünkü işlerin sonucu ve süresi',
    nerede: 'TRUBA',
  },
  { komut: 'sinfo -s', ne: 'Kuyruklar ve boş sunucular', nerede: 'TRUBA' },
  { komut: 'tail -f out', ne: 'Çıktıyı canlı izle (çıkmak için Ctrl+C)', nerede: 'TRUBA' },
  { komut: 'tail -5 OSZICAR', ne: 'Adım adım enerji', nerede: 'TRUBA' },
  { komut: 'grep "free  energy" OUTCAR | tail -1', ne: 'Son enerji', nerede: 'TRUBA' },
  { komut: 'module list', ne: 'Yüklü modüller', nerede: 'TRUBA' },
  { komut: 'exit', ne: 'TRUBA’dan çık (VPN açık kalır)', nerede: 'TRUBA' },
  { komut: 'ssh kullanici_adiniz@172.16.6.12', ne: 'TRUBA’ya bağlan', nerede: 'Bilgisayarınız' },
  { komut: 'scp', ne: 'Dosya gönder (adım 6) ya da çek (adım 12); klasör için -r', nerede: 'Bilgisayarınız' },
];

function Dis({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link underline">
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function Kart({ baslik, id, children }: { baslik: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 space-y-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{baslik}</h2>
      {children}
    </div>
  );
}

// Varsayılan kapalı ek bilgi: kurulumu yapan kişinin önünü kesmesin.
function Ek({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-line bg-surface">
      <summary className="cursor-pointer list-none px-6 py-4 text-base font-semibold text-ink marker:hidden">
        <span className="mr-2 inline-block text-ink-3 transition group-open:rotate-90">›</span>
        {baslik}
      </summary>
      <div className="space-y-4 border-t border-line px-6 py-5">{children}</div>
    </details>
  );
}

// Düz metin içindeki kullanici_adiniz da girilen adla dolar.
function Kod({ children }: { children: React.ReactNode }) {
  const doldur = useDoldur();
  return <code className="font-mono break-words">{typeof children === 'string' ? doldur(children) : children}</code>;
}

const Denendi = () => <Rozet tone="inceleme">Grubun denediği (13 Ekim 2026)</Rozet>;

function Pencere({ truba }: { truba?: boolean }) {
  return <Rozet tone={truba ? 'bilgi' : 'notr'}>{truba ? 'TRUBA penceresinde' : 'Kendi bilgisayarında'}</Rozet>;
}

function Gormeli({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md bg-sunken px-3 py-2">
      <strong className="text-ink">Görmen gereken:</strong> {children}
    </p>
  );
}

// Kurulumun sırası. Başlıklar kısa; yol haritası ve adım başlıkları buradan gelir.
const ADIMLAR = [
  { id: 'hesap', baslik: 'TRUBA hesabı al' },
  { id: 'openvpn', baslik: "OpenVPN'i kur" },
  { id: 'vpn', baslik: "VPN'e bağlan" },
  { id: 'paket', baslik: 'VASP paketini indir' },
  { id: 'terminal', baslik: 'Terminali aç' },
  { id: 'gonder', baslik: "Paketi TRUBA'ya gönder" },
  { id: 'gir', baslik: "TRUBA'ya gir" },
  { id: 'ac', baslik: 'Paketi aç' },
  { id: 'test', baslik: 'Test dosyalarını oluştur' },
  { id: 'calistir', baslik: 'Testi çalıştır' },
  { id: 'sonuc', baslik: 'Sonuca bak' },
  { id: 'indir', baslik: 'Sonucu bilgisayarına al' },
] as const;

type AdimId = (typeof ADIMLAR)[number]['id'];

function Adim({ id, truba, children }: { id: AdimId; truba?: boolean; children: React.ReactNode }) {
  const no = ADIMLAR.findIndex((a) => a.id === id) + 1;
  const { baslik } = ADIMLAR[no - 1];
  return (
    <li id={`adim-${id}`} className="scroll-mt-24 border-t border-line pt-6 first:border-0 first:pt-0">
      <h3 className="flex items-start gap-3 text-base font-semibold text-ink">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
          aria-hidden="true"
        >
          {no}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pt-1">
          <span>
            <span className="sr-only">Adım {no}: </span>
            {baslik}
          </span>
          <Pencere truba={truba} />
        </span>
      </h3>
      {/* Telefonda gövde tam genişlikte; geniş ekranda numaranın hizasından başlar. */}
      <div className="mt-3 min-w-0 space-y-3 text-sm leading-relaxed text-ink-2 sm:pl-11">{children}</div>
    </li>
  );
}

function Liste({ children }: { children: React.ReactNode }) {
  return <ol className="list-[lower-alpha] space-y-2 pl-5 marker:text-ink-3">{children}</ol>;
}

function SistemSekmeleri({ sistem, sec }: { sistem: Sistem; sec: (s: Sistem) => void }) {
  return (
    <div className="flex gap-1 rounded-md border border-line bg-sunken p-1 sm:inline-flex" role="tablist">
      {SISTEMLER.map((s) => (
        <button
          key={s.id}
          role="tab"
          aria-selected={sistem === s.id}
          onClick={() => sec(s.id)}
          className={`min-w-0 flex-1 cursor-pointer rounded px-2 py-1.5 text-sm font-medium transition sm:flex-none sm:px-4 ${
            sistem === s.id ? 'bg-surface text-ink shadow-panel' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {s.ad}
        </button>
      ))}
    </div>
  );
}

function OvpnIndir({ dosya }: { dosya: string }) {
  const d = TRUBA_DOSYALARI.find((x) => x.dosya === dosya)!;
  return (
    <a href={`/kilavuzlar/dosya/${d.dosya}`} download={d.dosya} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
      <Download className="size-4" aria-hidden="true" />
      {d.dosya} indir
    </a>
  );
}

export function TrubaBaglanti({ vaspPaketUrl }: { vaspPaketUrl?: string }) {
  const [sistem, setSistem] = useState<Sistem>('mac');
  const secili = SISTEMLER.find((s) => s.id === sistem)!;
  const windows = sistem === 'windows';
  const kabuk = windows ? 'PowerShell' : 'Terminal';

  return (
    <div className="space-y-6">
      <Kart baslik="Başlamadan önce">
        <p className="text-sm leading-relaxed text-ink-2">
          Aşağıdaki adımları yukarıdan aşağıya, sırayla yap. Linux bilmen gerekmiyor: gri kutulardaki komutu{' '}
          <strong className="text-ink">Kopyala</strong> ile al, söylenen pencereye yapıştır, <strong className="text-ink">Enter</strong>
          &apos;a bas. Her adımın sonunda ne görmen gerektiği yazıyor; görmezsen sonraki adıma geçme, aşağıdaki{' '}
          <a href="#sorun-giderme" className="text-link underline">Sorun giderme</a>&apos;ye bak.
        </p>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Bilgisayarın</p>
          <SistemSekmeleri sistem={sistem} sec={setSistem} />
        </div>
        <KullaniciAdiKutusu />
        <nav aria-label="Kurulum adımları" className="rounded-md border border-line bg-sunken p-4">
          <ol className="grid list-decimal gap-x-8 gap-y-1 pl-5 text-sm text-ink-2 marker:text-ink-3 sm:grid-cols-2">
            {ADIMLAR.map((a) => (
              <li key={a.id}>
                <a href={`#adim-${a.id}`} className="hover:text-link hover:underline">
                  {a.baslik}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Kart>

      <Kart baslik="TRUBA ve VASP kurulumu" id="vasp-kurulum">
        <Denendi />
        <ol className="space-y-6">
          <Adim id="hesap">
            <p>
              Hesabın varsa bu adımı geç. Yoksa <Dis href={`${TRUBA_DOCS}/0-truba/kullanici_basvurulari.html`}>TRUBA kullanıcı
              başvurusu</Dis> sayfasından başvur. Hesap kişiye özeldir; şifreni kimseyle paylaşma, başkasının hesabıyla girme.
            </p>
            <p>
              Kayıttan sonra hesabın açılması için TRUBA&apos;ya mail atman gerekiyor: kime, CC&apos;ye kim, ne yazılacağı ve hazır
              mail metni bu PDF&apos;te.
            </p>
            <Link href="/kilavuzlar/truba-hesap-aktivasyonu.pdf" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              <FileText className="size-4" aria-hidden="true" />
              <span className="whitespace-normal">Hesap aktivasyonu ve mail örneği (PDF)</span>
            </Link>
            <p>Hesap açılınca kullanıcı adını yukarıdaki kutuya yaz; sayfadaki komutlar ona göre dolar.</p>
          </Adim>

          <Adim id="openvpn">
            <p>
              TRUBA&apos;ya yalnız OpenVPN açıkken ulaşılır, okul ağındayken de. Bu bir kez kurulur.
            </p>
            {sistem === 'mac' && (
              <Liste>
                <li>
                  <Dis href="https://openvpn.net/">openvpn.net</Dis> sayfasında <em>Apps</em> sekmesinden{' '}
                  <strong className="text-ink">OpenVPN Connect</strong>&apos;e gir, <em>Download OpenVPN Connect for Mac</em> ile
                  indir, <Kod>.dmg</Kod> dosyasını açıp kur.
                </li>
                <li>
                  TRUBA dosyasını indir: <OvpnIndir dosya="TRUBA-ios.ovpn" />
                </li>
                <li>İndirdiğin dosyayı OpenVPN Connect penceresinin içine sürükle.</li>
              </Liste>
            )}
            {sistem === 'windows' && (
              <Liste>
                <li>
                  <Dis href="https://openvpn.net/">openvpn.net</Dis> sayfasında sağ üstten <em>Community → Downloads</em>&apos;a gir,{' '}
                  <em>Windows 64-bit MSI installer</em>&apos;ı indir. Çalıştırıp <em>Install Now</em>&apos;a bas, izin sorusuna{' '}
                  <em>Evet</em> de, bitince <em>Close</em>. Masaüstünde <em>OpenVPN GUI</em> simgesi çıkar.
                </li>
                <li>
                  TRUBA dosyasını indir: <OvpnIndir dosya="TRUBA-genel.ovpn" />
                </li>
                <li>
                  <em>OpenVPN GUI</em>&apos;yi çift tıklayıp aç; sağ altta saatin yanında simgesi belirir. Simgeye sağ tıkla,{' '}
                  <em>Import file</em>&apos;ı seç ve indirdiğin dosyayı göster.
                </li>
              </Liste>
            )}
            {sistem === 'linux' && (
              <Liste>
                <li>
                  Terminal&apos;de OpenVPN&apos;i kur:
                  <CodeBlock title="OpenVPN kurulumu" language="bash" code="sudo apt-get install openvpn" />
                </li>
                <li>
                  TRUBA dosyasını indir: <OvpnIndir dosya="TRUBA-genel.ovpn" />
                </li>
              </Liste>
            )}
            <p className="text-ink-3">
              Dosyanın adı <Kod>.ovpn</Kod> ile bitmeli; tarayıcı sonuna <Kod>.txt</Kod> eklediyse sil. Daha önce kurulu eski bir
              OpenVPN varsa sürümü 2.4.0&apos;dan yeni olmalı. Kaynak: TRUBA{' '}
              <Dis href={`${TRUBA_DOCS}/${secili.kaynak}`}>{secili.ad} kılavuzu</Dis>.
            </p>
          </Adim>

          <Adim id="vpn">
            {sistem === 'mac' && <p>OpenVPN Connect&apos;te TRUBA profilini aç, TRUBA kullanıcı adını ve şifreni girip bağlan.</p>}
            {sistem === 'windows' && (
              <p>Saatin yanındaki OpenVPN simgesine sağ tıkla, bağlan; TRUBA kullanıcı adını ve şifreni gir.</p>
            )}
            {sistem === 'linux' && (
              <>
                <p>İndirdiğin dosyanın olduğu klasörde terminal aç ve çalıştır; kullanıcı adı ve şifre sorulur:</p>
                <CodeBlock title="VPN bağlantısı" language="bash" code="sudo openvpn TRUBA-genel.ovpn" />
                <p>Bu terminali kapatma, kapatırsan VPN kesilir.</p>
              </>
            )}
            <Gormeli>
              &quot;Connected&quot; (bağlandı). Kafe, yurt ya da okul Wi-Fi&apos;ında bağlanmazsa telefonundan hotspot açıp dene.
            </Gormeli>
            <p>Sonraki her TRUBA kullanımında önce bu adımla VPN&apos;i açarsın.</p>
          </Adim>

          <Adim id="paket">
            <p>
              Bağlantı bir Google Drive klasörüne gider. İçindeki <Kod>vasp-6.6.0-hymf.tar.gz</Kod> dosyasını (yaklaşık 300 MB){' '}
              <em>İndir</em> ile İndirilenler klasörüne kaydet. &quot;Virüs taraması yapılamadı&quot; derse <em>Yine de indir</em>
              &apos;e bas. Dosyayı açmaya çalışma, olduğu gibi kalsın.
            </p>
            <Uyari tone="tehlike">
              Bu paket grubumuzun VASP lisansı kapsamındadır. Bağlantıyı ve dosyayı grup dışında hiç kimseyle paylaşmayın, başka
              bir yere yüklemeyin. Paylaşım nedeniyle doğacak lisans ihlalinin sorumluluğu paylaşan kişiye aittir; HYMF ve portal
              yöneticileri sorumlu tutulamaz.
            </Uyari>
            {vaspPaketUrl ? (
              <a href={vaspPaketUrl} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'primary' })}>
                <Download className="size-4" aria-hidden="true" />
                <span className="whitespace-normal">VASP paketini indir (yalnız lisanslı grup üyeleri)</span>
              </a>
            ) : (
              <Uyari tone="uyari">Paket bağlantısı henüz eklenmedi, Ata&apos;ya yazın.</Uyari>
            )}
          </Adim>

          <Adim id="terminal">
            {sistem === 'mac' && (
              <p>
                <strong className="text-ink">Cmd + Boşluk</strong>&apos;a bas, <Kod>Terminal</Kod> yaz, Enter. Yapıştırmak için{' '}
                <strong className="text-ink">Cmd + V</strong>.
              </p>
            )}
            {sistem === 'windows' && (
              <p>
                Başlat&apos;a <Kod>PowerShell</Kod> yaz, <em>Windows PowerShell</em>&apos;i aç. Yapıştırmak için{' '}
                <strong className="text-ink">Ctrl + V</strong> ya da sağ tık.
              </p>
            )}
            {sistem === 'linux' && (
              <p>
                Terminal&apos;i aç (çoğu dağıtımda <strong className="text-ink">Ctrl + Alt + T</strong>). Yapıştırmak için{' '}
                <strong className="text-ink">Ctrl + Shift + V</strong>.
              </p>
            )}
            <p>
              Bu pencere adım 12&apos;ye kadar açık kalsın. Komutlar bu pencereye yazılır; adım 7&apos;de pencere TRUBA&apos;ya
              bağlanır.
            </p>
          </Adim>

          <Adim id="gonder">
            {windows ? (
              <>
                {/* WinSCP adımları TRUBA'nın WinSCP sayfasından (docs.truba.gov.tr/2-temel_bilgiler/dosya_transferi/winscp.html).
                    PowerShell'deki $HOME\Downloads yolu herkeste yok (OneDrive'a taşınmış ya da başka yere inmiş olabiliyor). */}
                <p>
                  <strong className="text-ink">Kolay yol: WinSCP.</strong> Dosyayı fareyle sürükleyip bırakırsın, klasör yolu
                  yazmazsın.
                </p>
                <Liste>
                  <li>
                    <Dis href="https://winscp.net/eng/index.php">winscp.net</Dis>&apos;ten <em>Download Now</em> ile indir ve
                    kur (Tipik Kurulum, arayüz olarak <em>Commander</em>).
                  </li>
                  <li>
                    WinSCP&apos;yi aç. Oturum Aç penceresinde Sunucu adı <Kod>172.16.6.12</Kod>, Kullanıcı adı{' '}
                    <Kod>kullanici_adiniz</Kod>, Parola TRUBA şifren. <em>Oturum Aç</em>&apos;a bas. İlk seferde sunucu
                    anahtarıyla ilgili bir uyarı çıkarsa onayla. VPN açık olmalı (adım 3).
                  </li>
                  <li>
                    Pencere ikiye ayrılır: <strong className="text-ink">sol taraf senin bilgisayarın, sağ taraf TRUBA</strong>.
                    Sağ tarafa bir kez tıkla, <strong className="text-ink">Ctrl + O</strong>&apos;ya bas, açılan kutuya{' '}
                    <Kod>/arf/scratch/kullanici_adiniz</Kod> yaz ve Tamam.
                  </li>
                  <li>
                    <Kod>vasp-6.6.0-hymf.tar.gz</Kod> dosyasını bulunduğu yerden (sol taraf ya da Dosya Gezgini&apos;ndeki
                    İndirilenler) sağ tarafa sürükleyip bırak. Çıkan pencerede Tamam.
                  </li>
                </Liste>
                <Gormeli>
                  aktarım bitince sağ tarafta <Kod>vasp-6.6.0-hymf.tar.gz</Kod> (yaklaşık 300 MB). WinSCP&apos;yi kapatabilirsin;
                  adım 7&apos;den sonrası PowerShell&apos;de.
                </Gormeli>
                <details className="rounded-md border border-line">
                  <summary className="cursor-pointer px-4 py-2 font-medium text-ink">WinSCP kurmadan, PowerShell ile</summary>
                  <div className="space-y-3 border-t border-line px-4 py-3">
                    <p>
                      PowerShell&apos;e <Kod>scp</Kod> yaz ve bir boşluk bırak (henüz Enter&apos;a basma). Dosya Gezgini&apos;nde{' '}
                      <Kod>vasp-6.6.0-hymf.tar.gz</Kod>&apos;yi bul ve PowerShell penceresinin üstüne sürükleyip bırak; dosyanın
                      tam yolu kendiliğinden yazılır. Sonra bir boşluk bırakıp şunu yapıştır ve Enter:
                    </p>
                    <CodeBlock
                      title="Satırın sonu (PowerShell)"
                      language="powershell"
                      code="kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/"
                    />
                    <p>
                      İlk seferde &quot;Are you sure you want to continue connecting&quot; diye sorarsa <Kod>yes</Kod> yaz,
                      Enter. Sonra TRUBA şifreni yaz, Enter.{' '}
                      <strong className="text-ink">Şifre yazarken ekranda hiçbir şey görünmez</strong>, bu normaldir.
                    </p>
                    <Gormeli>
                      <Kod>100%</Kod> ile biten bir satır.
                    </Gormeli>
                  </div>
                </details>
              </>
            ) : (
              <>
                <p>Yapıştır ve Enter:</p>
                <CodeBlock
                  title="Paketi gönder (Terminal)"
                  language="bash"
                  code="scp ~/Downloads/vasp-6.6.0-hymf.tar.gz kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/"
                />
                <p>
                  İlk seferde &quot;Are you sure you want to continue connecting&quot; diye sorarsa <Kod>yes</Kod> yaz, Enter.
                  Sonra TRUBA şifreni yaz, Enter. <strong className="text-ink">Şifre yazarken ekranda hiçbir şey görünmez</strong>,
                  bu normaldir.
                </p>
                <Gormeli>
                  <Kod>100%</Kod> ile biten bir satır.
                </Gormeli>
                <p>
                  &quot;No such file or directory&quot; derse dosya İndirilenler&apos;de değildir. <Kod>scp</Kod> yaz, bir boşluk
                  bırak, dosyayı Finder&apos;dan (Linux&apos;ta dosya yöneticisinden) terminal penceresine sürükleyip bırak; yolu
                  kendiliğinden yazılır. Sonra bir boşluk bırakıp{' '}
                  <Kod>kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/</Kod> ekle ve Enter.
                </p>
              </>
            )}
          </Adim>

          <Adim id="gir">
            <p>Aynı pencerede:</p>
            <CodeBlock
              title={`TRUBA'ya gir (${kabuk})`}
              language={windows ? 'powershell' : 'bash'}
              code="ssh kullanici_adiniz@172.16.6.12"
            />
            <p>Şifreni yaz (yine görünmez), Enter. Satırın başı değişir:</p>
            <Gormeli>
              <Kod>[kullanici_adiniz@arf-ui2 ~]$</Kod>. Artık bu pencere TRUBA&apos;da; buradan sonraki komutlar TRUBA&apos;da
              çalışır.
            </Gormeli>
            <p>Çalışma klasörüne geç:</p>
            <CodeBlock title="Scratch'e geç (TRUBA)" language="bash" code="cd /arf/scratch/$USER && pwd && ls -lh" />
            <Gormeli>
              <Kod>/arf/scratch/kullanici_adiniz</Kod> ve listede <Kod>vasp-6.6.0-hymf.tar.gz</Kod>.
            </Gormeli>
          </Adim>

          <Adim id="ac" truba>
            <CodeBlock
              title="Paketi aç (TRUBA)"
              language="bash"
              code="cd /arf/scratch/$USER && tar xzf vasp-6.6.0-hymf.tar.gz && ls && ls vasp.6.6.0/bin_cpu"
            />
            <Gormeli>
              <Kod>pseudoPOT  vasp.6.6.0  vaspkit.1.5.1.linux.x64.tar.gz ...</Kod> ve <Kod>vasp_gam  vasp_ncl  vasp_std</Kod>.
            </Gormeli>
            <p>
              Bu kurulumun kendisiydi; VASP artık TRUBA&apos;da. İstersen arşivi silebilirsin:{' '}
              <Kod>rm vasp-6.6.0-hymf.tar.gz</Kod> (TRUBA&apos;da çöp kutusu yok, <Kod>rm</Kod> geri alınmaz).
            </p>
          </Adim>

          <Adim id="test" truba>
            <p>
              Şimdi VASP&apos;ın çalıştığını küçük bir Si hesabıyla deneyeceğiz. Bloğun tamamını tek seferde kopyala ve yapıştır.
              Hiçbir şey çalıştırmaz, yalnız dosya oluşturur; değiştirmen gereken bir şey yok.
            </p>
            <CodeBlock title="Test dosyaları (TRUBA)" language="bash" code={TEST_HAZIRLA} />
            <Gormeli>
              son satırda <Kod>INCAR  job.sh  KPOINTS  POSCAR  POTCAR</Kod>. Ekranda bir satır bozuk görünebilir (ör.{' '}
              <Kod>lsF</Kod>), sorun değil.
            </Gormeli>
            <p>Emin olmak için:</p>
            <CodeBlock title="Kontrol (TRUBA)" language="bash" code={TEST_KONTROL} />
            <Gormeli>
              <Kod>#SBATCH -A kullanici_adiniz</Kod>, son satır <Kod>mpirun ...vasp_std</Kod>, <Kod>PAW_PBE Si 05Jan2001</Kod>,
              satır sayıları 10, 7, 5.
            </Gormeli>
            <details className="rounded-md border border-line">
              <summary className="cursor-pointer px-4 py-2 font-medium text-ink">
                <Kod>job.sh</Kod> ne yapıyor? (merak edersen)
              </summary>
              <div className="border-t border-line px-4 py-3">
                {/* Telefonda alt alta, geniş ekranda iki sütun: yatay kaydırma olmasın. */}
                <dl className="divide-y divide-line">
                  {BETIK_SATIRLARI.map((s) => (
                    <div key={s.satir} className="py-2 sm:grid sm:grid-cols-[16rem_1fr] sm:gap-6">
                      <dt className="font-mono text-ink">{s.satir}</dt>
                      <dd className="mt-0.5 text-ink-2 sm:mt-0">{s.anlam}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-ink-3">
                  Kaynak: TRUBA <Dis href={BETIK}>SLURM Betik Özellikleri</Dis> ve <Dis href={KUYRUK}>ARF Kuyruk Bilgisi</Dis>.{' '}
                  <Kod>-C weka</Kod> ve modül adları grubun denediği betikten.
                </p>
              </div>
            </details>
          </Adim>

          <Adim id="calistir" truba>
            <CodeBlock title="İşi gönder (TRUBA)" language="bash" code="sbatch job.sh" />
            <Gormeli>
              <Kod>Submitted batch job 1234567 on cluster arf</Kod> (numara sende farklı olur).
            </Gormeli>
            <p>İş kuyrukta bekler, sonra çalışır. Durumuna bak:</p>
            <CodeBlock title="İşlerim (TRUBA)" language="bash" code="squeue -M arf -u $USER" />
            <p>
              <Kod>ST</Kod> sütununda <Kod>PD</Kod> sırada bekliyor, <Kod>R</Kod> çalışıyor demek. Satır kalmadıysa iş bitmiştir.
              Bu test bir dakikadan kısa sürer; birkaç kez tekrar bak.
            </p>
          </Adim>

          <Adim id="sonuc" truba>
            <CodeBlock title="Sonuç (TRUBA)" language="bash" code={SONUC_OKU} />
            <Gormeli>
              <Kod>free  energy   TOTEN  =       -10.81434575 eV</Kod> (son basamaklarda küçük fark normal) ve{' '}
              <Kod>General timing</Kod> satırı. <Kod>err</Kod> kısmındaki uzun <Kod>comp/oneapi/2024-modules/...</Kod> listesi
              hata değil.
            </Gormeli>
            <Uyari tone="basari">Bu sayıyı gördüysen kurulum tamam, VASP çalışıyor.</Uyari>
          </Adim>

          <Adim id="indir">
            <p>
              <Kod>exit</Kod> yazıp TRUBA&apos;dan çık (pencere yeniden kendi bilgisayarına döner), sonra:
            </p>
            {windows ? (
              <>
                <p>
                  <strong className="text-ink">WinSCP ile:</strong> adım 6&apos;daki gibi oturum aç, sağ tarafta{' '}
                  <Kod>/arf/scratch/kullanici_adiniz</Kod>&apos;e geç (Ctrl + O) ve <Kod>test_si</Kod> klasörünü sol tarafa,
                  istediğin klasöre sürükle.
                </p>
                <p>
                  <strong className="text-ink">PowerShell ile:</strong> aşağıdaki komut klasörü PowerShell&apos;in açıldığı yere
                  (kullanıcı klasörün) indirir, <Kod>explorer .</Kod> o klasörü açar.
                </p>
                <CodeBlock
                  title="Sonucu çek (PowerShell)"
                  language="powershell"
                  code={'scp -r kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/test_si .\nexplorer .'}
                />
              </>
            ) : (
              <CodeBlock
                title="Sonucu çek (Terminal)"
                language="bash"
                code="scp -r kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/test_si ~/Downloads/"
              />
            )}
            <Gormeli>
              {windows ? 'bilgisayarında' : <>İndirilenler&apos;de</>} <Kod>test_si</Kod> klasörü.
            </Gormeli>
            <p>
              TRUBA scratch&apos;teki dosyaları en fazla 30 gün tutar ve kendiliğinden siler (
              <Dis href={DEPOLAMA}>Dosya Sistemleri ve Depolama</Dis>); önemli sonucu bekletmeden çek.
            </p>
          </Adim>
        </ol>
      </Kart>

      <Kart baslik="Sonra: kendi hesabın (walk_std)" id="walk-std">
        <Uyari tone="uyari" baslik="Testle karıştırma">
          Si testindeki <Kod>job.sh</Kod> yalnız deneme içindir: <Kod>debug</Kod> kuyruğu, 4 çekirdek, 10 dakika. Gerçek
          hesapları <Kod>walk_std</Kod> ile gönder; kılavuzlardaki <Kod>sbatch walk_std</Kod> bu dosya.
        </Uyari>
        <p className="text-sm leading-relaxed text-ink-2">
          <strong className="text-ink">Bir kez:</strong> VPN&apos;i aç (adım 3), TRUBA&apos;ya gir (adım 7) ve{' '}
          <Kod>walk_std</Kod>&apos;yi scratch&apos;e kur. Bloğun tamamını yapıştır; <Kod>-A</Kod> satırı kendi adınla dolar.
        </p>
        <CodeBlock title="walk_std'yi kur (TRUBA)" language="bash" code={WALK_KUR} />
        <Gormeli>
          <Kod>#SBATCH -p orfoz</Kod> ve <Kod>#SBATCH -A kullanici_adiniz</Kod>.
        </Gormeli>
        <p className="text-sm leading-relaxed text-ink-2">
          <strong className="text-ink">Her hesapta:</strong> yeni bir klasör aç, <Kod>walk_std</Kod>&apos;yi scratch&apos;ten
          oraya kopyala, giriş dosyalarını koy ve klasörün içinden gönder. Klasör adını hesabına göre değiştir.
        </p>
        <CodeBlock title="Yeni hesap (TRUBA)" language="bash" code={WALK_KULLAN} />
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2 marker:text-ink-3">
          <li>
            <Kod>--time=1-00:00:00</Kod> bir gün demek; orfoz&apos;da en fazla <Kod>3-00:00:00</Kod>. Süre dolunca iş
            kesilir, işine yetecek kadar ver.
          </li>
          <li>
            <Kod>-n 56</Kod>: orfoz en az 56 çekirdek ister, bir sunucuda 112 çekirdek var (
            <Dis href={KUYRUK}>ARF Kuyruk Bilgisi</Dis>). Kuyruk ve çekirdek sayısı TRUBA belgesinden, grup henüz
            denemedi; sorun çıkarsa gruba yaz.
          </li>
          <li>İşi izlemek ve sonucu çekmek Si testindeki gibi (adım 10–12); yalnız klasör adı farklı.</li>
        </ul>
        <a href={`/kilavuzlar/dosya/${WALK_DOSYA}?indir=1`} download={WALK_DOSYA} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          <Download className="size-4" aria-hidden="true" />
          walk_std indir
        </a>
      </Kart>

      <Uyari tone="uyari" baslik="Kurallar">
        <ol className="mt-1 list-decimal space-y-2 pl-5">
          <li>
            <strong>Hesap kişiye özel.</strong> Kendi kullanıcı adınla gir, şifreni kimseyle paylaşma. TRUBA başkasının hesabını
            kullananın hesabını kapatır (<Dis href={KURALLAR}>Kullanım Kuralları</Dis>).
          </li>
          <li>
            <strong>Her şey scratch&apos;te çalışır.</strong> Çalışma klasörün <Kod>/arf/scratch/kullanici_adiniz</Kod>. Home (
            <Kod>/arf/home/kullanici_adiniz</Kod>) yalnız saklamak içindir. Scratch 30 gün sonra silinir, yedeklenmez (
            <Dis href={DEPOLAMA}>Dosya Sistemleri ve Depolama</Dis>).
          </li>
          <li>
            <strong>Hesap her zaman <Kod>sbatch</Kod> ile gönderilir.</strong> Girdiğin sunucuda (<Kod>arf-ui2</Kod>) doğrudan
            ağır iş çalıştırırsan TRUBA sonlandırır, ısrar edenin hesabını askıya alır (<Dis href={SSS}>Sıkça Sorulan Sorular</Dis>
            ). Başkasının <Kod>job.sh</Kod>&apos;ını kopyalarsan <Kod>#SBATCH -A</Kod>, <Kod>-p</Kod> ve program yolunu kendine
            göre değiştir.
          </li>
        </ol>
      </Uyari>

      <Kart baslik="Sorun giderme" id="sorun-giderme">
        <ul className="space-y-3 text-sm leading-relaxed text-ink-2">
          <li>
            <strong className="text-ink">Hangi penceredeyim?</strong> Satırın başı <Kod>[kullanici_adiniz@arf-ui2 ~]$</Kod> ise
            TRUBA&apos;dasın; <Kod>...MacBook... %</Kod> ya da <Kod>{'PS C:\\Users\\...>'}</Kod> gibiyse kendi bilgisayarındasın.
          </li>
          <li>
            <strong className="text-ink">
              <Kod>command not found: sinfo</Kod> / <Kod>no such file or directory: /arf/...</Kod>:
            </strong>{' '}
            komutu kendi bilgisayarına yazdın; önce adım 7 ile TRUBA&apos;ya gir.
          </li>
          <li>
            <strong className="text-ink">ssh ya da scp zaman aşımı veriyor:</strong> VPN bağlı değil. Adım 3&apos;e dön.
          </li>
          <li>
            <strong className="text-ink">VPN bağlanmıyor, zaman aşımı veriyor:</strong> VPN, TRUBA sunucusuna UDP 1195 portundan
            bağlanır; bulunduğun ağ bunu engelliyor olabilir. Telefondan hotspot açıp dene; orada bağlanıyorsa sorun ağdadır.
            Grubun denediği: kafe Wi-Fi&apos;ında bağlanmadı, hotspot&apos;ta bağlandı.
          </li>
          <li>
            <strong className="text-ink">VPN &quot;trying to connect&quot;te kalıyor, ağ değiştirdim:</strong> (grubun denediği)
            OpenVPN Connect eski ağın rotasını tutuyor olabilir (günlükte <Kod>Can&apos;t assign requested address</Kod>).
            Uygulamayı tamamen kapatıp (Mac&apos;te Cmd+Q) yeniden aç. Mac&apos;te düzelmezse Terminal&apos;de şunu çalıştır; Mac
            şifreni ister, &quot;not in table&quot; derse rota zaten temizdir:
            <CodeBlock title="Eski VPN rotasını sil (Mac)" language="bash" code="sudo route -n delete 193.140.99.241" />
          </li>
          <li>
            <strong className="text-ink">Mac&apos;te TRUBA-ios.ovpn ile bağlanamıyorum:</strong> profili sil,{' '}
            <Kod>TRUBA-genel.ovpn</Kod> ile yeniden ekle: <OvpnIndir dosya="TRUBA-genel.ovpn" />
          </li>
          <li>
            <strong className="text-ink">Eski OpenVPN kurulu:</strong> 2.4.0&apos;dan eski sürümler kullanıcı adı-şifre ile
            bağlanamaz, güncelle.
          </li>
          <li>
            <strong className="text-ink">
              Windows&apos;ta <Kod>ssh</Kod> ya da <Kod>scp</Kod> bulunamadı:
            </strong>{' '}
            Windows 10 (1803 ve sonrası) bunlarla gelir; <Kod>ssh -V</Kod> ile kontrol et. Yoksa{' '}
            <em>Ayarlar → Uygulamalar → İsteğe Bağlı Özellikler</em>&apos;de <em>OpenSSH Client</em>&apos;ı{' '}
            <em>Özellik ekle</em> ile yükle.
          </li>
          <li>
            <strong className="text-ink">
              SSH: <Kod>Exceeded MaxStartups</Kod> / <Kod>Connection closed by ... port 22</Kod>:
            </strong>{' '}
            (grubun denediği) sunucuya aynı anda çok kişi bağlanıyor; birkaç saniye bekleyip tekrar dene.
          </li>
          <li>
            <strong className="text-ink">
              <Kod>sbatch: error: ... account</Kod> / <Kod>Invalid account</Kod>:
            </strong>{' '}
            <Kod>job.sh</Kod> içindeki <Kod>-A</Kod> satırı kendi kullanıcı adın değil; adım 9&apos;daki kontrol komutunu çalıştır.
          </li>
          <li>
            <strong className="text-ink">
              <Kod>sbatch</Kod> <Kod>-C weka</Kod> satırı yüzünden reddederse:
            </strong>{' '}
            o satırı silip tekrar gönder.
          </li>
          <li>
            <strong className="text-ink">İş hemen bitti ama OUTCAR yok:</strong> <Kod>cat err</Kod> ile hatayı oku; modül
            hatasıysa <Kod>module avail comp/oneapi/2024 lib/hdf5/1.14.3-oneapi-2024</Kod> ile modüllerin durduğuna bak, değilse
            genelde POTCAR eksik ya da yol yanlıştır.
          </li>
          <li>
            <strong className="text-ink">Hâlâ olmuyor:</strong> gruba yaz ya da{' '}
            <Dis href={`${TRUBA_DOCS}/0-truba/truba_iletisim.html`}>TRUBA teknik destek</Dis>.
          </li>
        </ul>
      </Kart>

      <Ek baslik="Sık kullanılan komutlar">
        {/* Telefonda alt alta, geniş ekranda üç sütun: yatay kaydırma olmasın. */}
        <div className="text-sm">
          <div className="hidden border-b border-line py-2 text-ink-3 sm:grid sm:grid-cols-[minmax(0,1fr)_14rem_8rem] sm:gap-6">
            <span className="font-medium">Komut</span>
            <span className="font-medium">Ne yapar</span>
            <span className="font-medium">Nerede</span>
          </div>
          <ul className="divide-y divide-line">
            {KOMUTLAR.map((k) => (
              <li key={k.komut} className="py-2 sm:grid sm:grid-cols-[minmax(0,1fr)_14rem_8rem] sm:gap-6">
                <span className="block text-ink">
                  <Kod>{k.komut}</Kod>
                </span>
                <span className="mt-0.5 block text-ink-2 sm:mt-0">{k.ne}</span>
                <span className="block text-ink-3 sm:text-ink-2">
                  <span className="sm:hidden">Nerede: </span>
                  {k.nerede}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Uyari tone="tehlike">
          <Kod>rm -r</Kod> geri alınmaz, TRUBA&apos;da çöp kutusu yok.
        </Uyari>
        <p className="text-sm leading-relaxed text-ink-2">
          <Denendi /> Bağlanınca TRUBA bir <strong className="text-ink">USAGE</strong> kutusu gösterir: harcadığın çekirdek-saati
          ve home ile scratch kotanın ne kadarının dolu olduğu. Kota sınırları{' '}
          <Dis href={DEPOLAMA}>Dosya Sistemleri ve Depolama</Dis> sayfasında.
        </p>
      </Ek>

      <Ek baslik="Sunucular ve dosya aktarımı">
        <p className="text-sm leading-relaxed text-ink-2">
          ARF kümesinin kullanıcı arayüzü sunucuları. Hepsine VPN açıkken <Kod>ssh kullanici_adiniz@&lt;adres&gt;</Kod> ile
          bağlanılır.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-3">
              <tr className="border-b border-line">
                <th className="py-2 pr-6 font-medium">Sunucu</th>
                <th className="py-2 pr-6 font-medium">Adres</th>
                <th className="py-2 font-medium">Not</th>
              </tr>
            </thead>
            <tbody>
              {SUNUCULAR.map((s) => (
                <tr key={s.ip} className="border-b border-line last:border-0">
                  <td className="py-2 pr-6 font-mono text-ink">{s.ad}</td>
                  <td className="py-2 pr-6 font-mono text-ink">{s.ip}</td>
                  <td className="py-2 text-ink-2">{s.not}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed text-ink-2">
          Web tabanlı arayüz <Dis href={`${TRUBA_DOCS}/2-temel_bilgiler/open_ondemand.html`}>Open OnDemand</Dis> da yalnız VPN
          açıkken çalışır: <Kod>https://openondemand.yonetim</Kod> (172.16.6.20).
        </p>
        <p className="text-sm leading-relaxed text-ink-2">
          Dosya aktarımında TRUBA daha hızlı olduğu için arf-ui4 ve arf-ui5&apos;i önerir. Windows&apos;ta WinSCP ya da
          MobaXterm de kullanılabilir. Ayrıntı:{' '}
          <Dis href={`${TRUBA_DOCS}/2-temel_bilgiler/dosya_transferi/index.html`}>TRUBA dosya transferi</Dis>.
        </p>
        <CodeBlock
          title="Dosya aktarımı (scp)"
          language="bash"
          code={`# Bilgisayardan TRUBA'ya
scp POSCAR kullanici_adiniz@172.16.6.14:/hedef/dizin/

# TRUBA'dan bilgisayara (klasör için -r)
scp -r kullanici_adiniz@172.16.6.14:/uzak/dizin/ ./`}
        />
      </Ek>

      <Uyari tone="bilgi">
        Bu bölüm TRUBA&apos;nın kendi belgelerine göre yazıldı (13 Ekim 2026). &quot;Grubun denediği&quot; diye işaretli yerler
        grubun 13 Ekim 2026&apos;daki denemesinden. Güncel bilgi için <Dis href={TRUBA_DOCS}>docs.truba.gov.tr</Dis>.
      </Uyari>
    </div>
  );
}
