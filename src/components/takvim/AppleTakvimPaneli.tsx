'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button, Panel, Uyari, buttonClass, inputSinifi } from '@/components/ui';
import { cn } from '@/lib/cn';
import { takvimAnahtarim, takvimAnahtariniYenile } from '@/app/takvim/actions';

type Baglanti = { https: string; webcal: string };

function baglantiKur(token: string): Baglanti {
  const yol = `/takvim-akisi/${token}.ics`;
  return { https: `${window.location.origin}${yol}`, webcal: `webcal://${window.location.host}${yol}` };
}

function Adimlar({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-ink">{baslik}</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-ink-2">{children}</ol>
    </div>
  );
}

/** Takvimi Apple Takvim'e (veya Google Takvim'e) abone etme paneli. Bağlantı kişiye özeldir. */
export function AppleTakvimPaneli() {
  const [baglanti, setBaglanti] = useState<Baglanti | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState<'evet' | 'olmadi' | null>(null);
  const [bekliyor, basla] = useTransition();
  const girdiRef = useRef<HTMLInputElement>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, []);

  function goster() {
    setHata(null);
    basla(async () => {
      const sonuc = await takvimAnahtarim();
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      setBaglanti(baglantiKur(sonuc.token));
    });
  }

  function yenile() {
    if (
      !window.confirm(
        'Eski bağlantı çalışmayı durdurur. Takvimi eklediğiniz her yerde yeni bağlantıyı yeniden eklemeniz gerekir. Devam edilsin mi?',
      )
    ) {
      return;
    }
    setHata(null);
    setKopyalandi(null);
    basla(async () => {
      const sonuc = await takvimAnahtariniYenile();
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      setBaglanti(baglantiKur(sonuc.token));
    });
  }

  async function kopyala() {
    if (!baglanti) return;
    let basarili = false;
    try {
      await navigator.clipboard.writeText(baglanti.https);
      basarili = true;
    } catch {
      // Güvenli olmayan bağlantıda veya izin yoksa: adresi seçili bırakırız.
      girdiRef.current?.select();
    }
    setKopyalandi(basarili ? 'evet' : 'olmadi');
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => setKopyalandi(null), 3000);
  }

  return (
    <Panel baslik="Takvim uygulamanıza ekleyin">
      <div className="space-y-5">
        <p className="max-w-prose text-base leading-7 text-ink-2">
          Bu takvimi telefonunuzdaki veya Mac&apos;inizdeki Takvim uygulamasına ekleyebilirsiniz. Yalnız portaldaki toplantılar,
          etkinlikler ve sizin görevleriniz görünür; kendi takviminizdeki hiçbir şey değişmez veya silinmez.
        </p>

        {hata && <Uyari tone="tehlike">{hata}</Uyari>}

        {!baglanti ? (
          <Button variant="secondary" size="md" onClick={goster} disabled={bekliyor}>
            {bekliyor ? 'Hazırlanıyor...' : 'Bağlantıyı göster'}
          </Button>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <a
                href={baglanti.webcal}
                className={buttonClass({ variant: 'secondary', size: 'md', className: 'h-12 px-6 text-base' })}
              >
                Apple Takvim&apos;e ekle
              </a>

              <div className="max-w-xl">
                <label htmlFor="takvim-baglantisi" className="block text-sm font-medium text-ink">
                  Takvim bağlantısı
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="takvim-baglantisi"
                    ref={girdiRef}
                    type="text"
                    readOnly
                    value={baglanti.https}
                    onFocus={(e) => e.currentTarget.select()}
                    className={cn(inputSinifi, 'h-10 min-w-0 flex-1 font-mono')}
                  />
                  <Button variant="secondary" size="md" onClick={kopyala}>
                    {kopyalandi === 'evet' ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {kopyalandi === 'evet' ? 'Kopyalandı' : 'Kopyala'}
                  </Button>
                </div>
                <p className="mt-1.5 text-sm text-ink-3" role="status">
                  {kopyalandi === 'olmadi'
                    ? 'Kopyalanamadı. Adres seçildi, Ctrl veya ⌘ ile C tuşlarına basarak kopyalayın.'
                    : 'Bu bağlantı size özeldir. Başkasıyla paylaşmayın.'}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Adimlar baslik="iPhone ve iPad">
                <li>Ayarlar&apos;a girmeniz gerekmez. Yukarıdaki &ldquo;Apple Takvim&apos;e ekle&rdquo; düğmesine dokunun.</li>
                <li>Çıkan pencerede &ldquo;Abone ol&rdquo; düğmesine dokunun.</li>
              </Adimlar>
              <Adimlar baslik="Mac">
                <li>Takvim uygulamasını açın, üst menüden Dosya, sonra Yeni Takvim Aboneliği seçeneğini seçin.</li>
                <li>Yukarıdaki adresi yapıştırıp &ldquo;Abone ol&rdquo; deyin.</li>
                <li>&ldquo;Otomatik yenile&rdquo; için &ldquo;Her 15 dakikada&rdquo; seçin.</li>
              </Adimlar>
              <Adimlar baslik="Google Takvim">
                <li>
                  Bilgisayarda Google Takvim&apos;i açın. Solda &ldquo;Diğer takvimler&rdquo; yanındaki artı işaretine tıklayın.
                </li>
                <li>&ldquo;URL ile&rdquo; seçeneğini seçip yukarıdaki adresi yapıştırın.</li>
                <li>Google yeni kayıtları birkaç saat gecikmeyle gösterebilir.</li>
              </Adimlar>
            </div>

            <div className="border-t border-line pt-4">
              <Button variant="ghost" size="sm" onClick={yenile} disabled={bekliyor}>
                Bağlantıyı yenile
              </Button>
              <p className="mt-1 text-sm text-ink-3">Bağlantı başkasının eline geçtiyse yenileyin. Eskisi çalışmayı durdurur.</p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
