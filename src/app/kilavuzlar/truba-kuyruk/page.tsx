import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import { Download, ExternalLink } from 'lucide-react';
import { requireMember } from '@/lib/auth/dal';
import { CodeBlock } from '@/components/CodeBlock';
import { AcilirBolum, SayfaBasligi, Uyari, buttonClass } from '@/components/ui';

// Kuyruk tablosu TRUBA ARF Kuyruk Bilgisi sayfasından (son güncelleme 24 Ara 2025, 19 Kas 2026'da bakıldı).
// --mem açıklaması TRUBA SLURM Betik Özellikleri sayfasından; DefMemPerCore'un sayısı orada yazmıyor, o yüzden
// sayfada sayı yok, scontrol komutu var. Betikler public/truba/ altında; sayfa onları dosyadan okur, tek kaynak.

const KUYRUK = 'https://docs.truba.gov.tr/1-kaynaklar/arf/arf_kuyruk_bilgisi.html';
const BETIK = 'https://docs.truba.gov.tr/2-temel_bilgiler/slurm-betik-ozellik.html';

const KUYRUKLAR = [
  { ad: 'barbun', cekirdek: 40, islemci: 'Xeon Gold 6248R', bellek: 384, enAz: 20, sunucu: 119 },
  { ad: 'hamsi', cekirdek: 56, islemci: 'Xeon Gold 6338', bellek: 192, enAz: 28, sunucu: 144 },
  { ad: 'orfoz', cekirdek: 112, islemci: 'Xeon Platinum 8480+', bellek: 256, enAz: 56, sunucu: 504 },
] as const;

function Kod({ children }: { children: React.ReactNode }) {
  return <code className="font-mono break-words">{children}</code>;
}

function Dis({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link underline">
      {children}
      <ExternalLink className="size-3.5" aria-hidden="true" />
    </a>
  );
}

function Bolum({ baslik, id, children }: { baslik: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 rounded-lg border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{baslik}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

function Acilir({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <AcilirBolum baslik={baslik} kucuk>
      {children}
    </AcilirBolum>
  );
}

const th = 'px-3 py-2 text-left font-semibold text-ink';
const td = 'px-3 py-2 align-top';

export default async function Page() {
  await requireMember();

  const oku = (ad: string) => readFile(path.join(process.cwd(), 'public', 'truba', ad), 'utf8');
  const [kuyrukSec, walk] = await Promise.all([oku('kuyruk_sec.sh'), oku('walk_std')]);
  const yapistir = (ad: string, icerik: string) => `cat > ${ad} <<'EOF'\n${icerik.trimEnd()}\nEOF`;

  return (
    <div className="space-y-8">
      <Link href="/kilavuzlar#kilavuzlar" className="text-sm font-medium text-link hover:underline">
        ← Kurulum ve Kılavuzlar
      </Link>

      <SayfaBasligi
        baslik="TRUBA'da iş gönderme"
        aciklama="İşin en erken başlayacağı kuyruğu bulan betik, temiz walk_std şablonu ve bellek hatası notu."
      />

      <Bolum baslik="Kuyruklar" id="kuyruklar">
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-sunken">
              <tr>
                <th className={th}>Kuyruk</th>
                <th className={th}>Bir sunucuda çekirdek</th>
                <th className={th}>kuyruk_sec.sh betiğe yazar</th>
                <th className={th}>Bellek / sunucu</th>
                <th className={th}>En uzun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {KUYRUKLAR.map((k) => (
                <tr key={k.ad}>
                  <td className={`${td} font-mono font-semibold text-ink`}>{k.ad}</td>
                  <td className={td}>
                    {k.cekirdek} <span className="text-ink-3">({k.islemci})</span>
                  </td>
                  <td className={`${td} font-mono`}>-n {k.cekirdek} -c 1</td>
                  <td className={td}>{k.bellek} GB</td>
                  <td className={td}>3 gün</td>
                </tr>
              ))}
              <tr>
                <td className={`${td} font-mono font-semibold text-ink`}>debug</td>
                <td className={td}>karışık</td>
                <td className={`${td} text-ink-3`}>bakmaz</td>
                <td className={td}>karışık</td>
                <td className={td}>4 saat</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Betikte <Kod>-N 2</Kod> yazarsan çekirdek iki katına çıkar (barbun 80, hamsi 112, orfoz 224). Kaynak: TRUBA{' '}
          <Dis href={KUYRUK}>ARF Kuyruk Bilgisi</Dis>.
        </p>
        <Acilir baslik="Ayrıntı: en az çekirdek, çekirdek başına bellek, NCORE">
          <ul className="list-disc space-y-2 pl-5 marker:text-ink-3">
            <li>
              En az istek: barbun 20, hamsi 28, orfoz 56 çekirdek. Sunucu sayısı: barbun 119, hamsi 144, orfoz 504.
            </li>
            <li>
              Sunucunun tamamı alınırsa çekirdek başına düşen bellek (bellek ÷ çekirdek): barbun yaklaşık 9,6 GB, hamsi 3,4 GB,
              orfoz 2,3 GB. Belleği en bol olan barbun.
            </li>
            <li>
              <Kod>--mem</Kod> yazmazsan her çekirdeğe TRUBA&apos;nın varsayılan belleği (DefMemPerCore) ayrılır,{' '}
              <Kod>--mem</Kod> ile en fazla çekirdek × MaxMemPerCore kadar artırılır (<Dis href={BETIK}>SLURM Betik Özellikleri</Dis>
              ). Belgede sayı yok; kuyruğun güncel değerini TRUBA&apos;da şu komut gösterir:
              <div className="mt-2">
                <CodeBlock title="Çekirdek başına bellek (TRUBA)" code={'scontrol show partition=orfoz | grep -o "[A-Za-z]*MemPer[A-Za-z]*=[^ ]*"'} />
              </div>
            </li>
            <li>
              Orfoz&apos;da <Kod>#SBATCH --mem=240000MB</Kod> grupta bir arkadaşın kullandığı değer; TRUBA belgesinde yok,
              orfoz sunucusunun 256 GB&apos;ının altında.
            </li>
            <li>
              INCAR&apos;daki <Kod>KPAR</Kod> çekirdek sayısını, <Kod>NCORE</Kod> de (çekirdek ÷ KPAR) sayısını tam bölmeli.
              Kuyruk değişince çekirdek sayısı değişir: 40, 56, 112. <Kod>NCORE = 4</Kod> ya da <Kod>8</Kod> (KPAR 1 iken) üçünü de
              tam böler; <Kod>NCORE = 4</Kod> KPAR 2 iken de böler.
            </li>
          </ul>
        </Acilir>
      </Bolum>

      <Bolum baslik="Hangi kuyruk daha erken başlatır?" id="kuyruk-sec">
        <p>
          <Kod>kuyruk_sec.sh</Kod> her kuyruğa <Kod>sbatch --test-only</Kod> ile &quot;bu iş sende ne zaman başlar&quot; diye sorar.
          İş gönderilmez, yalnız tahmini başlama zamanı yazılır. <Kod>-g</Kod> eklersen işi en erken kuyruğa gönderir. Betikteki{' '}
          <Kod>-p</Kod>, <Kod>-n</Kod>, <Kod>--ntasks</Kod> ve <Kod>-c</Kod> satırları yerine yukarıdaki tablodaki değerleri koyar;
          dosyanı değiştirmez, komut satırından verir.
        </p>
        <p>
          Neden <Kod>sinfo</Kod> yetmiyor: <Kod>sinfo</Kod> boş sunucuyu gösterir ama kuyrukta bekleyen işleri göstermez.
          TRUBA&apos;da <Kod>squeue</Kod> da yalnız kendi işlerini gösteriyor. <Kod>--test-only</Kod> ise bekleyen işleri ve önceliği
          hesaba katar. Tahmin kesin değil, kuyrukları kıyaslamak için.
        </p>
        <p>
          19 Kasım 2026&apos;daki denemede 1 saatlik bir iş için tahminler: barbun 24 Kas, orfoz 30 Kas, hamsi 1 Ara. Üç kuyrukta da
          boş sunucu 0 görünüyordu.
        </p>

        <p className="font-semibold text-ink">1. Betiği TRUBA&apos;ya koy (bir kez)</p>
        <p>
          TRUBA penceresinde aşağıdaki bloğu kopyala, yapıştır, Enter. Betik <Kod>/arf/scratch/$USER/kuyruk_sec.sh</Kod> olarak
          kaydolur. İstersen dosyayı indirip <Kod>scp</Kod> ile de gönderebilirsin.
        </p>
        <CodeBlock title="kuyruk_sec.sh kaydet (TRUBA)" code={`cd /arf/scratch/$USER\n${yapistir('kuyruk_sec.sh', kuyrukSec)}\nls -l kuyruk_sec.sh`} />
        <a href="/truba/kuyruk_sec.sh" download="kuyruk_sec.sh" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          <Download className="size-4" aria-hidden="true" />
          kuyruk_sec.sh indir
        </a>

        <p className="font-semibold text-ink">2. Hesap klasöründe önce bak, sonra gönder</p>
        <p>
          Hesap klasörüne gir (POSCAR, INCAR, KPOINTS, POTCAR ve <Kod>walk_std</Kod> orada), betiği kopyala ve çalıştır. İlk
          satır yalnız tabloyu yazar; ikincisi işi gönderir.
        </p>
        <CodeBlock
          title="Kuyruk seç ve gönder (TRUBA)"
          code={'cp /arf/scratch/$USER/kuyruk_sec.sh .\nbash kuyruk_sec.sh walk_std\nbash kuyruk_sec.sh walk_std -g'}
        />
        <p>
          Çıktıda her kuyruk için boş sunucu sayısı ve tahmini başlama zamanı olur. Bir kuyruk işi kabul etmezse (süre, hesap,
          çekirdek ya da <Kod>--mem</Kod> sınırı) o satırda <Kod>olmaz:</Kod> ve Slurm&apos;un nedeni yazar; diğerleri yine
          kıyaslanır. Gönderdikten sonra işi her zamanki gibi <Kod>squeue -u $USER</Kod> ile izle.
        </p>
      </Bolum>

      <Bolum baslik="walk_std şablonu" id="walk-sablon">
        <p>
          Sitedeki kurulumu yaptıysan <Kod>/arf/scratch/$USER/walk_std</Kod> zaten var; <Kod>kuyruk_sec.sh</Kod> onunla da
          çalışır, bu bölümü atlayabilirsin. Hocanın <Kod>walk6_std</Kod> betiğini kullanıyorsan onu olduğu gibi kopyalama: içinde
          hocanın hesabı (<Kod>-A</Kod>) ve hocanın VASP yolu var. Bu şablon aynı modüllerle, yer tutucuları açık yazılı.
        </p>
        <p className="font-semibold text-ink">1. Şablonu hesap klasörüne kaydet</p>
        <CodeBlock title="walk_std kaydet (TRUBA, hesap klasöründe)" code={yapistir('walk_std', walk)} />
        <a href="/truba/walk_std" download="walk_std" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          <Download className="size-4" aria-hidden="true" />
          walk_std şablonunu indir
        </a>
        <p className="font-semibold text-ink">2. Kullanıcı adını ve VASP yolunu yaz</p>
        <p>Önce VASP&apos;ın nerede olduğuna bak. Çıkan satırdaki klasör (sondaki <Kod>/vasp_std</Kod> olmadan) senin VASP yolun:</p>
        <CodeBlock
          title="vasp_std nerede? (TRUBA)"
          code={'ls /arf/scratch/$USER/vasp*/bin*/vasp_std /arf/home/$USER/vasp*/bin*/vasp_std 2>/dev/null'}
        />
        <p>
          Aşağıdaki ikinci satırda yolu kendi çıktına göre değiştir (örnekteki sitedeki kurulumun yolu), sonra yapıştır. Son komut
          iki satırı gösterir; <Kod>KULLANICI_ADINIZ</Kod> ya da <Kod>VASP_YOLU</Kod> kalmamalı.
        </p>
        <CodeBlock
          title="Şablonu doldur (TRUBA)"
          code={
            'sed -i "s/KULLANICI_ADINIZ/$USER/g" walk_std\n' +
            'sed -i "s|VASP_YOLU|/arf/scratch/$USER/vasp.6.6.0/bin_cpu|" walk_std\n' +
            'grep -E "^#SBATCH -A|^mpirun" walk_std'
          }
        />
        <p>
          Modül satırı hocanın betiğindeki gibi <Kod>comp/oneapi/2023</Kod>. VASP&apos;ı bu sitedeki kurulumla (vasp.6.6.0) kurduysan
          şablondaki nota göre <Kod>comp/oneapi/2024</Kod> ve <Kod>hdf5</Kod> satırlarını aç. Spin-yörünge hesabı için{' '}
          <Kod>walk_ncl</Kod> yap:
        </p>
        <CodeBlock title="walk_ncl (TRUBA)" code={"sed 's|/vasp_std$|/vasp_ncl|' walk_std > walk_ncl"} />
        <p className="font-semibold text-ink">3. Gönder</p>
        <CodeBlock title="Gönder (TRUBA)" code="bash kuyruk_sec.sh walk_std -g" />

        <Uyari tone="uyari" baslik="VASP kaç çekirdekte koşuyor? İlk işte bak">
          <p>
            Hocanın <Kod>walk6_std</Kod> betiği <Kod>-n 1 -c 110</Kod> kullanıyor (TRUBA&apos;nın örnek betiği de{' '}
            <Kod>-n 1 -c 112</Kod>). <Kod>-n</Kod> MPI süreç sayısıdır; VASP MPI ile çalıştığı için bu, VASP&apos;ı tek süreçte
            koşturabilir. Emin değiliz, o yüzden şablonda <Kod>-n</Kod> çekirdek sayısı kadar, <Kod>-c 1</Kod>. İş başladıktan
            sonra hesap klasöründe şuna bak:
          </p>
          <div className="my-2">
            <CodeBlock title="Çekirdek kontrolü (TRUBA)" code={'grep -m1 "running" OUTCAR'} />
          </div>
          <p>
            Satırdaki sayı (<Kod>running on N total cores</Kod> ya da VASP 6&apos;da <Kod>running N mpi-ranks</Kod>) istediğin
            çekirdek sayısına eşit olmalı: barbun 40, hamsi 56, orfoz 112. 1 yazıyorsa VASP tek çekirdekte koşuyor, işi durdur (
            <Kod>scancel İŞ_NO</Kod>) ve betiğe bak.
          </p>
        </Uyari>
      </Bolum>

      <Uyari tone="bilgi" baslik="Fonon hesabında bellek hatası">
        <p>
          Büyük süper hücrede iş bellek yetmediği için düşebilir: <Kod>err</Kod> dosyasında <Kod>oom-kill</Kod> ya da{' '}
          <Kod>Out Of Memory</Kod>, <Kod>sacct -j İŞ_NO</Kod> çıktısında <Kod>OUT_OF_MEMORY</Kod> görürsün. Sırayla dene:
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Betiğe <Kod>#SBATCH --mem=...</Kod> ekle (sunucu belleğinin altında: barbun 384, hamsi 192, orfoz 256 GB; orfoz için
            grupta kullanılan <Kod>--mem=240000MB</Kod>). Çekirdek başına belleği en bol kuyruk barbun.
          </li>
          <li>
            INCAR&apos;da <Kod>KPAR</Kod>&apos;ı düşür (KPAR büyüdükçe bellek artar), <Kod>NCORE</Kod>&apos;u 4 ya da 8 yap. İkisi de çekirdek sayısını tam bölmeli.
          </li>
          <li>
            İşi iki sunucuya yay: betikte <Kod>#SBATCH -N 2</Kod>. <Kod>kuyruk_sec.sh</Kod> çekirdeği kendisi iki katına çıkarır,
            bellek de iki katı olur.
          </li>
        </ol>
      </Uyari>
    </div>
  );
}
