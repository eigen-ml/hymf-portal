'use client';

import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
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

// Adım 7: tek seferde yapıştırılır, yalnız dosya oluşturur. $USER TRUBA'da kendiliğinden kullanıcı adı olur.
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
  { komut: 'scp', ne: 'Dosya gönder (Adım 3) ya da çek (Adım 10); klasör için -r', nerede: 'Bilgisayarınız' },
];

function Dis({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link underline">
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function Adimlar({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-2 marker:text-ink-3">{children}</ol>;
}

function Kart({ baslik, id, children }: { baslik: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 space-y-4 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{baslik}</h2>
      {children}
    </div>
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
    <p>
      <strong className="text-ink">Görmen gereken:</strong> {children}
    </p>
  );
}

function AdimBasligi({ no, baslik, truba }: { no: number; baslik: string; truba?: boolean }) {
  return (
    <h3 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-ink">
      <span>
        Adım {no}: {baslik}
      </span>
      <Pencere truba={truba} />
    </h3>
  );
}

function SistemSekmeleri({ sistem, sec }: { sistem: Sistem; sec: (s: Sistem) => void }) {
  return (
    <div className="mb-4 flex gap-1 rounded-md border border-line bg-sunken p-1 sm:inline-flex" role="tablist">
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

export function TrubaBaglanti({ vaspPaketUrl }: { vaspPaketUrl?: string }) {
  const [sistem, setSistem] = useState<Sistem>('mac');
  const secili = SISTEMLER.find((s) => s.id === sistem)!;
  const windows = sistem === 'windows';
  const kabuk = windows ? 'PowerShell' : 'Terminal';

  return (
    <div className="space-y-6">
      <KullaniciAdiKutusu />

      <Kart baslik="TRUBA'ya bağlanma" id="truba-baglanti">
        <div className="space-y-3 text-sm leading-relaxed text-ink-2">
          <p>
            Bağlantı iki adımdır: önce <strong className="text-ink">OpenVPN</strong> ile TRUBA ağına girersiniz, sonra{' '}
            <strong className="text-ink">SSH</strong> ile kullanıcı arayüzü sunucusuna bağlanırsınız. İkisinde de aynı TRUBA
            kullanıcı adı ve şifresi kullanılır. TRUBA&apos;ya göre OpenVPN, ULAKNET (okul ağı) içinde olsanız da gereklidir.
          </p>
          <p>
            Hesabınız yoksa başvuru{' '}
            <Dis href={`${TRUBA_DOCS}/0-truba/kullanici_basvurulari.html`}>TRUBA kullanıcı başvurusu</Dis> sayfasından
            yapılır. TRUBA hesabı kişiye özeldir, başkasıyla paylaşılırsa erişim kapatılır.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">1. OpenVPN yapılandırma dosyaları</h3>
          <ul className="divide-y divide-line rounded-md border border-line">
            {TRUBA_DOSYALARI.map((d) => (
              <li key={d.dosya} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-ink">{d.dosya}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{d.aciklama}</p>
                </div>
                <a href={`/kilavuzlar/dosya/${d.dosya}`} download={d.dosya} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                  <Download className="size-4" aria-hidden="true" />
                  İndir
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-3">
            Kaydedilen dosyanın adı <Kod>.ovpn</Kod> ile bitmeli; bazı tarayıcılar sonuna <Kod>.txt</Kod> ekler, eklediyse
            silin. Dosyalar TRUBA&apos;nın{' '}
            <Dis href={`${TRUBA_DOCS}/2-temel_bilgiler/openvpn_installation/openvpn_info.html`}>OpenVPN sayfasından</Dis>{' '}
            alındı; bağlanamazsanız güncel hâlini oradan indirin.
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">2. Kurulum ve bağlantı</h3>
          <SistemSekmeleri sistem={sistem} sec={setSistem} />

          {sistem === 'mac' && (
            <Adimlar>
              <li>
                <Dis href="https://openvpn.net/">openvpn.net</Dis> sayfasında <em>Apps</em> sekmesinden{' '}
                <strong className="text-ink">OpenVPN Connect</strong>&apos;e girin, <em>Download OpenVPN Connect for Mac</em> ile
                indirin ve <Kod>.dmg</Kod> dosyasını açıp kurun. Daha önce kurulu bir OpenVPN varsa sürümü 2.4.0&apos;dan yeni
                olmalı; eski sürümler bağlanamaz.
              </li>
              <li>
                Yukarıdan <Kod>TRUBA-ios.ovpn</Kod> dosyasını indirin. TRUBA&apos;ya göre bu dosya bazı sürümlerde sorun
                çıkarabilir; öyle olursa <Kod>TRUBA-genel.ovpn</Kod>&apos;u kullanın.
              </li>
              <li>Dosyayı OpenVPN Connect uygulamasının içine sürükleyin.</li>
              <li>Açılan menüde TRUBA kullanıcı adınızı ve şifrenizi girip bağlanın.</li>
              <li>
                Bağlantı kurulunca <strong className="text-ink">Terminal</strong>&apos;i açın ve bağlanın. İlk bağlantıda
                sunucuyu onaylamanız istenir, <Kod>yes</Kod> yazın. Şifre yazılırken ekranda görünmez, bu normaldir.
                <CodeBlock title="SSH bağlantısı" language="bash" code="ssh kullanici_adiniz@172.16.6.12" />
              </li>
            </Adimlar>
          )}

          {sistem === 'windows' && (
            <Adimlar>
              <li>
                <Dis href="https://openvpn.net/">openvpn.net</Dis> sayfasında sağ üstten <em>Community → Downloads</em>&apos;a
                girin ve Windows sürümünüze uygun installer&apos;ı (ör. <em>Windows 64-bit MSI installer</em>) indirin. Dosyayı
                çalıştırıp <em>Install Now</em>&apos;a basın, izin sorusuna <em>Evet</em> deyin. Kurulum bitince{' '}
                <em>Close</em>&apos;a basın; masaüstünde <em>OpenVPN GUI</em> simgesi çıkar. Daha önce kurulu bir OpenVPN varsa
                sürümü 2.4.0&apos;dan yeni olmalı.
              </li>
              <li>
                Yukarıdan <Kod>TRUBA-genel.ovpn</Kod> dosyasını indirin. Adı <Kod>.txt</Kod> ile bittiyse uzantıyı{' '}
                <Kod>.ovpn</Kod> yapın.
              </li>
              <li>
                <em>OpenVPN GUI</em>&apos;yi çift tıklayarak açın; sağ altta saatin yanında OpenVPN simgesi belirir. Simgeye sağ
                tıklayıp <em>Import file</em>&apos;ı seçin ve indirdiğiniz <Kod>TRUBA-genel.ovpn</Kod>&apos;u gösterin.{' '}
                <em>File imported successfully</em> yazısı çıkmalı.
              </li>
              <li>Simgeye sağ tıklayıp bağlanın; TRUBA kullanıcı adınızı ve şifrenizi girin.</li>
              <li>
                Bağlantı kurulunca <strong className="text-ink">PowerShell</strong>&apos;i açın ve bağlanın. İlk bağlantıda{' '}
                <Kod>yes</Kod> yazın; şifre yazılırken görünmez.
                <CodeBlock title="SSH bağlantısı (PowerShell)" language="powershell" code="ssh kullanici_adiniz@172.16.6.12" />
                Windows 10 (1803 ve sonrası) <Kod>ssh</Kod> komutuyla gelir; <Kod>ssh -V</Kod> ile kontrol edin. Yoksa{' '}
                <em>Ayarlar → Uygulamalar → İsteğe Bağlı Özellikler</em>&apos;de <em>OpenSSH Client</em>&apos;ı{' '}
                <em>Özellik ekle</em> ile yükleyin. PuTTY ve MobaXterm de kullanılabilir.
              </li>
            </Adimlar>
          )}

          {sistem === 'linux' && (
            <Adimlar>
              <li>
                OpenVPN&apos;i kurun:
                <CodeBlock title="OpenVPN kurulumu" language="bash" code="sudo apt-get install openvpn" />
              </li>
              <li>
                Yukarıdan <Kod>TRUBA-genel.ovpn</Kod> dosyasını indirin, dosyanın bulunduğu klasörde terminal açıp çalıştırın.
                Kullanıcı adı ve şifre sorulur.
                <CodeBlock title="VPN bağlantısı" language="bash" code="sudo openvpn TRUBA-genel.ovpn" />
                Bu terminali kapatmayın; kapatırsanız VPN bağlantısı kesilir.
              </li>
              <li>
                Yeni bir terminal açıp bağlanın:
                <CodeBlock title="SSH bağlantısı" language="bash" code="ssh kullanici_adiniz@172.16.6.12" />
              </li>
            </Adimlar>
          )}

          <p className="mt-3 text-sm text-ink-3">
            Kaynak: TRUBA <Dis href={`${TRUBA_DOCS}/${secili.kaynak}`}>{secili.ad} kılavuzu</Dis> ve{' '}
            <Dis href={`${TRUBA_DOCS}/2-temel_bilgiler/ssh_baglanti/index.html`}>SSH bağlantısı</Dis>.
          </p>
        </div>
      </Kart>

      <div className="space-y-4">
        <Uyari tone="uyari" baslik="Kurallar">
          <ol className="mt-1 list-decimal space-y-2 pl-5">
            <li>
              <strong>Hesap kişiye özel.</strong> Kendi kullanıcı adınla gir, şifreni kimseyle paylaşma, başkasının hesabıyla
              girme. TRUBA başkasının hesabını kullananın hesabını kapatır (
              <Dis href={KURALLAR}>Kullanım Kuralları</Dis>).
            </li>
            <li>
              <strong>Her şey scratch&apos;te çalışır, home&apos;da hiçbir şey çalıştırılmaz.</strong> Çalışma klasörün{' '}
              <Kod>/arf/scratch/kullanici_adiniz</Kod>. Home (<Kod>/arf/home/kullanici_adiniz</Kod>) yalnız saklamak içindir.
              Sonuçları scratch&apos;ten bilgisayarına ya da home&apos;a çek; TRUBA scratch&apos;teki dosyaları en fazla 30 gün
              tutar ve kendiliğinden siler, yedek de almaz (<Dis href={DEPOLAMA}>Dosya Sistemleri ve Depolama</Dis>).
            </li>
            <li>
              <strong>Arayüz sunucusunda (girdiğin <Kod>arf-ui2</Kod>) hesap yapılmaz.</strong> Her hesap <Kod>sbatch</Kod> ile
              kuyruğa gönderilir; arayüzde uzun ya da ağır çalışan işleri TRUBA sonlandırır, ısrar edenin hesabını askıya alır (
              <Dis href={SSS}>Sıkça Sorulan Sorular</Dis>). Başkasının iş betiğini kopyalarsan <Kod>#SBATCH -A</Kod> (hesap
              adı), <Kod>-p</Kod> (kuyruk) ve program yolunu mutlaka kendine göre değiştir.
            </li>
          </ol>
        </Uyari>

        <div className="space-y-2 rounded-md border border-line bg-sunken p-4 text-sm leading-relaxed text-ink-2">
          <p className="font-semibold text-ink">Hangi penceredeyim?</p>
          <p>
            Satırın başı <Kod>[kullanici_adiniz@arf-ui2 ~]$</Kod> ise TRUBA&apos;dasın; <Kod>...MacBook... %</Kod>,{' '}
            <Kod>{'PS C:\\Users\\...>'}</Kod> gibi bir şey ise kendi bilgisayarındasın.
          </p>
          <p>
            <Kod>command not found: sinfo</Kod> ya da <Kod>no such file or directory: /arf/...</Kod> görüyorsan komutu kendi
            bilgisayarına yazmışsın demektir.
          </p>
        </div>
      </div>

      <Kart baslik="Sunucular ve dosya aktarımı">
        <p className="text-sm leading-relaxed text-ink-2">
          ARF hesaplama kümesinin kullanıcı arayüzü sunucuları. Hepsine VPN açıkken{' '}
          <Kod>ssh kullanici_adiniz@&lt;adres&gt;</Kod> ile bağlanılır.
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
      </Kart>

      <Kart baslik="VASP kurulumu" id="vasp-kurulum">
        <div className="space-y-3 text-sm leading-relaxed text-ink-2">
          <Denendi />
          <p>
            VASP 6.6.0 kurulumu ve Si test hesabı (<Kod>debug</Kod> kuyruğu, 4 çekirdek). Komutları sırayla, değiştirmeden
            çalıştır.
          </p>
          <p>İşletim sistemi:</p>
          <SistemSekmeleri sistem={sistem} sec={setSistem} />
          {sistem === 'linux' && <p className="text-ink-3">Linux&apos;ta komutlar macOS ile aynıdır.</p>}
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-ink-2">
          <section className="space-y-3">
            <AdimBasligi no={1} baslik="Paketi indir" />
            <p>
              Bağlantı bir Google Drive klasörüne gider. İçindeki <Kod>vasp-6.6.0-hymf.tar.gz</Kod> (yaklaşık 300 MB) dosyasını{' '}
              <em>İndir</em> ile İndirilenler klasörüne kaydet. &quot;Virüs taraması yapılamadı&quot; uyarısı çıkarsa{' '}
              <em>Yine de indir</em>&apos;e bas.
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
          </section>

          <section className="space-y-3">
            <AdimBasligi no={2} baslik="VPN'e bağlan" />
            <p>
              Yukarıdaki <a href="#truba-baglanti" className="text-link underline">TRUBA&apos;ya bağlanma</a> bölümündeki gibi
              OpenVPN&apos;i aç. Yeşil &quot;Connected&quot; görünmeden devam etme.
            </p>
          </section>

          <section className="space-y-3">
            <AdimBasligi no={3} baslik="Paketi TRUBA'ya gönder" />
            <p>Yeni bir {kabuk} penceresi aç ve yapıştır:</p>
            {windows ? (
              <CodeBlock
                title="Paketi gönder (PowerShell)"
                language="powershell"
                code={'scp $HOME\\Downloads\\vasp-6.6.0-hymf.tar.gz kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/'}
              />
            ) : (
              <CodeBlock
                title="Paketi gönder (Terminal)"
                language="bash"
                code="scp ~/Downloads/vasp-6.6.0-hymf.tar.gz kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/"
              />
            )}
            <Gormeli>
              şifre sorulur (yazarken görünmez), sonra <Kod>100%</Kod> ile biten bir satır.
            </Gormeli>
          </section>

          <section className="space-y-3">
            <AdimBasligi no={4} baslik="TRUBA'ya bağlan" />
            <p>Aynı {kabuk} penceresinde bağlan:</p>
            <CodeBlock
              title={`SSH bağlantısı (${kabuk})`}
              language={windows ? 'powershell' : 'bash'}
              code="ssh kullanici_adiniz@172.16.6.12"
            />
            <p>
              Satırın başı <Kod>[kullanici_adiniz@arf-ui2 ~]$</Kod> olunca artık TRUBA&apos;dasın <Pencere truba />:
            </p>
            <CodeBlock title="Scratch'e geç (TRUBA)" language="bash" code="cd /arf/scratch/$USER && pwd && ls -lh" />
            <Gormeli>
              <Kod>/arf/scratch/kullanici_adiniz</Kod> ve listede <Kod>vasp-6.6.0-hymf.tar.gz</Kod>.
            </Gormeli>
          </section>

          <section className="space-y-3">
            <AdimBasligi no={5} baslik="Paketi aç" truba />
            <CodeBlock
              title="Paketi aç (TRUBA)"
              language="bash"
              code="cd /arf/scratch/$USER && tar xzf vasp-6.6.0-hymf.tar.gz && ls && ls vasp.6.6.0/bin_cpu"
            />
            <Gormeli>
              <Kod>pseudoPOT  vasp.6.6.0  vaspkit.1.5.1.linux.x64.tar.gz ...</Kod> ve <Kod>vasp_gam  vasp_ncl  vasp_std</Kod>.
            </Gormeli>
            <p>Sonra arşivi silebilirsin (TRUBA&apos;da çöp kutusu yok, <Kod>rm</Kod> geri alınmaz):</p>
            <CodeBlock title="Arşivi sil (TRUBA, isteğe bağlı)" language="bash" code="rm vasp-6.6.0-hymf.tar.gz" />
          </section>

          <section className="space-y-3">
            <AdimBasligi no={6} baslik="Modül kontrolü" truba />
            <CodeBlock
              title="Modül kontrolü (TRUBA)"
              language="bash"
              code="module avail comp/oneapi/2024 lib/hdf5/1.14.3-oneapi-2024 2>&1 | tail -15"
            />
            <Gormeli>
              listenin sonunda <Kod>lib/hdf5/1.14.3-oneapi-2024</Kod>.
            </Gormeli>
          </section>

          <section className="space-y-3">
            <AdimBasligi no={7} baslik="Test dosyaları" truba />
            <p>
              Bloğun tamamını tek seferde TRUBA penceresine yapıştır. Hiçbir şey çalıştırmaz, yalnız dosya oluşturur. Bu blokta
              yer tutucu yok, <Kod>$USER</Kod> kendiliğinden kullanıcı adın olur.
            </p>
            <CodeBlock title="test_si klasörü (TRUBA)" language="bash" code={TEST_HAZIRLA} />
            <Gormeli>
              son satırda <Kod>INCAR  job.sh  KPOINTS  POSCAR  POTCAR</Kod>. Ekranda bir satır bozuk görünebilir (ör.{' '}
              <Kod>lsF</Kod>), dosyalar yine de doğrudur; şu kontrol emin olmanı sağlar:
            </Gormeli>
            <CodeBlock title="Kontrol (TRUBA)" language="bash" code={TEST_KONTROL} />
            <Gormeli>
              <Kod>#SBATCH -A kullanici_adiniz</Kod>, son satır <Kod>mpirun ...vasp_std</Kod>, <Kod>PAW_PBE Si 05Jan2001</Kod>,
              satır sayıları 10, 7, 5.
            </Gormeli>

            <div>
              <p className="mb-2 font-semibold text-ink">
                <Kod>job.sh</Kod> satır satır
              </p>
              {/* Telefonda alt alta, geniş ekranda iki sütun: yatay kaydırma olmasın. */}
              <dl className="divide-y divide-line border-y border-line">
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
          </section>

          <section className="space-y-3">
            <AdimBasligi no={8} baslik="İşi gönder" truba />
            <CodeBlock title="İşi gönder (TRUBA)" language="bash" code="sbatch job.sh" />
            <Gormeli>
              <Kod>Submitted batch job 1234567 on cluster arf</Kod> (numara seninkinde farklı olur).
            </Gormeli>
            <CodeBlock title="İşlerim (TRUBA)" language="bash" code="squeue -M arf -u $USER" />
            <p>
              <Kod>ST</Kod> sütunu: <Kod>PD</Kod> sırada bekliyor, <Kod>R</Kod> çalışıyor; satır yoksa iş bitmiştir. Bu test bir
              dakikadan kısa sürer.
            </p>
          </section>

          <section className="space-y-3">
            <AdimBasligi no={9} baslik="Sonucu oku" truba />
            <CodeBlock title="Sonuç (TRUBA)" language="bash" code={SONUC_OKU} />
            <Gormeli>
              <Kod>free  energy   TOTEN  =       -10.81434575 eV</Kod> (son basamaklarda küçük fark normal) ve{' '}
              <Kod>General timing</Kod> satırı. <Kod>err</Kod> dosyasında uzun bir <Kod>comp/oneapi/2024-modules/...</Kod>{' '}
              listesi görünür: hata değil, yüklenen modüllerin listesidir.
            </Gormeli>
            <Uyari tone="basari">
              Bu sayıyı gördüysen kurulum tamam. Kendi hesabın için <Kod>test_si</Kod> klasörünü kopyala (
              <Kod>cp -r test_si yeni_hesap</Kod>), INCAR, POSCAR, KPOINTS ve POTCAR&apos;ı değiştir, <Kod>--time</Kod>&apos;ı ve
              kuyruğu işine göre ayarla.
            </Uyari>
          </section>

          <section className="space-y-3">
            <AdimBasligi no={10} baslik="Sonuçları indir" />
            <p>
              TRUBA&apos;dan <Kod>exit</Kod> ile çık ya da yeni bir {kabuk} penceresi aç:
            </p>
            {windows ? (
              <CodeBlock
                title="Sonuçları çek (PowerShell)"
                language="powershell"
                code={'scp -r kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/test_si $HOME\\Downloads\\'}
              />
            ) : (
              <CodeBlock
                title="Sonuçları çek (Terminal)"
                language="bash"
                code="scp -r kullanici_adiniz@172.16.6.12:/arf/scratch/kullanici_adiniz/test_si ~/Downloads/"
              />
            )}
            <p>
              TRUBA scratch&apos;teki dosyaları en fazla 30 gün tutar ve kendiliğinden siler (
              <Dis href={DEPOLAMA}>Dosya Sistemleri ve Depolama</Dis>); önemli sonucu bekletmeden çek.
            </p>
          </section>
        </div>
      </Kart>

      <Kart baslik="Komutlar">
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
          <Denendi /> Bağlanınca TRUBA bir <strong className="text-ink">USAGE</strong> kutusu gösterir: hesabınızın şimdiye
          kadar harcadığı çekirdek-saati ve home ile scratch&apos;teki disk ve dosya sayısı kotanızın ne kadarının dolu olduğunu
          özetler. Kota sınırları <Dis href={DEPOLAMA}>Dosya Sistemleri ve Depolama</Dis> sayfasında.
        </p>
      </Kart>

      <Kart baslik="Sorun giderme">
        <ul className="space-y-3 text-sm leading-relaxed text-ink-2">
          <li>
            <strong className="text-ink">ssh zaman aşımı veriyor:</strong> VPN bağlı değildir. TRUBA sunucularına VPN olmadan
            ulaşılamaz; önce OpenVPN bağlantısını kurun.
          </li>
          <li>
            <strong className="text-ink">VPN bağlanmıyor, zaman aşımı veriyor:</strong> yapılandırma dosyası TRUBA&apos;nın VPN
            sunucusuna UDP 1195 portundan bağlanır. Bulunduğunuz ağ bu portu engelliyor olabilir. Telefonunuzdan hotspot açıp
            deneyin; orada bağlanıyorsa sorun ağdadır.
          </li>
          <li>
            <strong className="text-ink">Kafe, yurt, okul Wi-Fi&apos;ında bağlanmıyor:</strong> yukarıdaki UDP 1195 maddesi.
            Grubun denediği: kafe Wi-Fi&apos;ında bağlanmadı, telefon hotspot&apos;unda bağlandı.
          </li>
          <li>
            <strong className="text-ink">VPN &quot;trying to connect&quot;te kalıyor, ağ değiştirdim:</strong> (grubun
            denediği) OpenVPN Connect eski ağın rotasını tutuyor olabilir (günlükte <Kod>Can&apos;t assign requested address</Kod>
            ). Uygulamayı tamamen kapatıp (Mac&apos;te Cmd+Q) yeniden açın. Mac&apos;te düzelmezse Terminal&apos;de şunu
            çalıştırın; Mac şifresini ister, &quot;not in table&quot; derse rota zaten temizdir:
            <CodeBlock title="Eski VPN rotasını sil (Mac)" language="bash" code="sudo route -n delete 193.140.99.241" />
          </li>
          <li>
            <strong className="text-ink">
              SSH: <Kod>Exceeded MaxStartups</Kod> / <Kod>Connection closed by ... port 22</Kod>:
            </strong>{' '}
            (grubun denediği) sunucuya aynı anda çok kişi bağlanıyor; birkaç saniye bekleyip tekrar deneyin ya da{' '}
            <Kod>172.16.6.12</Kod>&apos;yi kullanın.
          </li>
          <li>
            <strong className="text-ink">
              <Kod>command not found: sinfo</Kod> / <Kod>no such file or directory: /arf/...</Kod>:
            </strong>{' '}
            komut kendi bilgisayarınıza yazıldı, TRUBA penceresine yazın.
          </li>
          <li>
            <strong className="text-ink">
              <Kod>sbatch: error: ... account</Kod> / <Kod>Invalid account</Kod>:
            </strong>{' '}
            <Kod>job.sh</Kod> içindeki <Kod>-A</Kod> satırı kendi kullanıcı adınız değil; Adım 7&apos;deki kontrol komutunu
            çalıştırın.
          </li>
          <li>
            <strong className="text-ink">
              <Kod>sbatch</Kod> <Kod>-C weka</Kod> satırı yüzünden reddederse:
            </strong>{' '}
            o satırı silip tekrar gönderin.
          </li>
          <li>
            <strong className="text-ink">İş hemen bitti ama OUTCAR yok:</strong> <Kod>cat err</Kod> ile hatayı okuyun; genelde
            POTCAR eksik ya da yol yanlış.
          </li>
          <li>
            <strong className="text-ink">Mac&apos;te iOS dosyasıyla bağlanamıyorum:</strong> profili silin,{' '}
            <Kod>TRUBA-genel.ovpn</Kod> ile yeniden ekleyin.
          </li>
          <li>
            <strong className="text-ink">Eski OpenVPN kurulu:</strong> 2.4.0&apos;dan eski sürümler kullanıcı adı-şifre ile
            bağlanamaz, güncelleyin.
          </li>
          <li>
            <strong className="text-ink">Hâlâ olmuyor:</strong>{' '}
            <Dis href={`${TRUBA_DOCS}/0-truba/truba_iletisim.html`}>TRUBA teknik destek</Dis> sayfasından yazın.
          </li>
        </ul>
      </Kart>

      <Uyari tone="bilgi">
        Bu bölüm TRUBA&apos;nın kendi belgelerine göre yazıldı (13 Ekim 2026). &quot;Grubun denediği&quot; diye işaretli yerler
        grubun 13 Ekim 2026&apos;daki denemesinden. Güncel bilgi için <Dis href={TRUBA_DOCS}>docs.truba.gov.tr</Dis>.
      </Uyari>
    </div>
  );
}
