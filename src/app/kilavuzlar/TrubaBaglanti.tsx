'use client';

import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';
import { Uyari, buttonClass } from '@/components/ui';
import { TRUBA_DOSYALARI } from '@/lib/kilavuz/liste';

// Her adım docs.truba.gov.tr'deki şu sayfalardan alındı (13 Eki 2026): OpenVPN Bağlantısı, Mac OS, Linux,
// Windows'da OpenVPN Kurulumu, SSH Bağlantısı, ARF Bağlantı, Dosya Transferi, Open OnDemand.
// Kaynağı olmayan bilgi eklemeyin; TRUBA değiştirirse bu sayfaları yeniden okuyun.
const TRUBA_DOCS = 'https://docs.truba.gov.tr';

type Sistem = 'mac' | 'windows' | 'linux';

const SISTEMLER: { id: Sistem; ad: string; kaynak: string }[] = [
  { id: 'mac', ad: 'macOS', kaynak: '2-temel_bilgiler/openvpn_installation/mac_openvpn.html' },
  { id: 'windows', ad: 'Windows', kaynak: '2-temel_bilgiler/openvpn_installation/windows_openvpn.html' },
  { id: 'linux', ad: 'Linux', kaynak: '2-temel_bilgiler/openvpn_installation/linux_openvpn.html' },
];

const SUNUCULAR = [
  { ad: 'arf-ui1', ip: '172.16.6.11', not: '' },
  { ad: 'arf-ui2', ip: '172.16.6.12', not: '' },
  { ad: 'arf-ui3', ip: '172.16.6.13', not: '' },
  { ad: 'arf-ui4', ip: '172.16.6.14', not: 'dosya aktarımı için önerilir' },
  { ad: 'arf-ui5', ip: '172.16.6.15', not: 'dosya aktarımı için önerilir' },
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

function Kart({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">{baslik}</h2>
      {children}
    </div>
  );
}

const Kod = ({ children }: { children: React.ReactNode }) => <code className="font-mono">{children}</code>;

export function TrubaBaglanti() {
  const [sistem, setSistem] = useState<Sistem>('mac');
  const secili = SISTEMLER.find((s) => s.id === sistem)!;

  return (
    <div className="space-y-6">
      <Kart baslik="TRUBA'ya bağlanma">
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
          <div className="mb-4 flex gap-1 rounded-md border border-line bg-sunken p-1 sm:inline-flex" role="tablist">
            {SISTEMLER.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={sistem === s.id}
                onClick={() => setSistem(s.id)}
                className={`flex-1 cursor-pointer rounded px-4 py-1.5 text-sm font-medium transition sm:flex-none ${
                  sistem === s.id ? 'bg-surface text-ink shadow-panel' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {s.ad}
              </button>
            ))}
          </div>

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
                <CodeBlock title="SSH bağlantısı" language="bash" code="ssh kullanici_adiniz@172.16.6.11" />
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
                <CodeBlock title="SSH bağlantısı (PowerShell)" language="powershell" code="ssh kullanici_adiniz@172.16.6.11" />
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
                <CodeBlock title="SSH bağlantısı" language="bash" code="ssh kullanici_adiniz@172.16.6.11" />
              </li>
            </Adimlar>
          )}

          <p className="mt-3 text-sm text-ink-3">
            Kaynak: TRUBA <Dis href={`${TRUBA_DOCS}/${secili.kaynak}`}>{secili.ad} kılavuzu</Dis> ve{' '}
            <Dis href={`${TRUBA_DOCS}/2-temel_bilgiler/ssh_baglanti/index.html`}>SSH bağlantısı</Dis>.
          </p>
        </div>
      </Kart>

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
        Bu bölüm TRUBA&apos;nın kendi belgelerine göre yazıldı (13 Ekim 2026). Güncel bilgi için{' '}
        <Dis href={TRUBA_DOCS}>docs.truba.gov.tr</Dis>.
      </Uyari>
    </div>
  );
}
