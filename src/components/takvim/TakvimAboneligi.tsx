'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Button, Panel, Uyari, buttonClass, inputSinifi } from '@/components/ui';
import { TAKVIM_ISTEMCI_ETIKETI, abonelikAdresleri, takvimBagliMi, type AbonelikAdresleri } from '@/lib/abonelik';
import { cn } from '@/lib/cn';
import { goreliZaman } from '@/lib/zaman';
import type { TakvimBaglantisi } from '@/types/database';
import { takvimAnahtarim, takvimAnahtariniYenile } from '@/app/takvim/actions';
import { AbonelikAdimlari, GuncellemeSuresi } from './AbonelikAdimlari';

const DUGME_SINIFI = buttonClass({
  variant: 'secondary',
  size: 'lg',
  className: 'h-auto min-h-16 w-full flex-col gap-0.5 whitespace-normal py-2.5 text-center',
});

/** Tek tıkla abonelik: Apple Takvim (webcal) ve Google Takvim. Outlook için elle ekleme adımı var. */
export function AbonelikDugmeleri({ adresler }: { adresler: AbonelikAdresleri }) {
  return (
    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
      <a href={adresler.webcal} className={DUGME_SINIFI}>
        <span>Apple Takvim</span>
        <span className="text-sm font-normal text-ink-3">iPhone, iPad, Mac</span>
      </a>
      <a href={adresler.google} target="_blank" rel="noopener noreferrer" className={DUGME_SINIFI}>
        <span className="inline-flex items-center gap-1.5">
          Google Takvim
          <ExternalLink className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-normal text-ink-3">Google hesabınızla</span>
        <span className="sr-only">(yeni sekmede açılır)</span>
      </a>
    </div>
  );
}

/** "Takviminiz bağlı: Apple, son eşitleme 12 dakika önce." Bağlı değilse veya yalnız indirdiyse not. */
function BaglantiDurumu({ baglanti }: { baglanti: TakvimBaglantisi | null }) {
  if (takvimBagliMi(baglanti)) {
    return (
      <p className="text-base text-ink-2">
        <span className="font-semibold text-ok">Takviminiz bağlı:</span> {TAKVIM_ISTEMCI_ETIKETI[baglanti!.sonIstemci!]}, son
        eşitleme <span suppressHydrationWarning>{goreliZaman(baglanti!.sonCekim!)}</span>.
      </p>
    );
  }
  if (baglanti?.sonIstemci === 'tarayici') {
    return (
      <p className="text-base text-warn">
        Adres tarayıcıda açılmış, takvim tek seferlik dosya olarak inmiş. Güncel kalması için aşağıdaki düğmelerden
        biriyle abone olun.
      </p>
    );
  }
  return null;
}

/**
 * Takvimi kişinin kendi takvim uygulamasına abone etme paneli. Bağlantı kişiye özeldir; anahtar
 * sayfa açılırken sunucuda hazırlanır (yoksa oluşturulur), yalnız oturum sahibine gelir.
 */
export function TakvimAboneligi({
  token: ilkToken,
  baglanti = null,
}: {
  token: string | null;
  /** Aboneliği en son hangi uygulama çekti; yenilenen anahtarda sıfırlanır. */
  baglanti?: TakvimBaglantisi | null;
}) {
  const [token, setToken] = useState(ilkToken);
  const [yenilendi, setYenilendi] = useState(false);
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

  const adresler = token ? abonelikAdresleri(token) : null;

  // Sunucu anahtarı hazırlayamadıysa (geçici hata) kişi elle yeniden dener.
  function olustur() {
    setHata(null);
    basla(async () => {
      const sonuc = await takvimAnahtarim();
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      setToken(sonuc.token);
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
      setToken(sonuc.token);
      setYenilendi(true);
    });
  }

  async function kopyala() {
    if (!adresler) return;
    let basarili = false;
    try {
      await navigator.clipboard.writeText(adresler.https);
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
    <Panel id="abonelik" baslik="Takvim uygulamanıza ekleyin">
      <div className="space-y-6">
        <p className="max-w-prose text-base leading-7 text-ink-2">
          Bir kez ekleyin, grup toplantıları ve etkinlikler telefonunuzun takvimine kendiliğinden düşsün. Yalnız
          portaldaki kayıtlar ve sizin görevleriniz görünür; kendi takviminizdeki hiçbir şey değişmez veya silinmez.
        </p>

        {!yenilendi && <BaglantiDurumu baglanti={baglanti} />}

        {hata && <Uyari tone="tehlike">{hata}</Uyari>}

        {!adresler ? (
          <Button variant="secondary" size="md" onClick={olustur} disabled={bekliyor}>
            {bekliyor ? 'Hazırlanıyor...' : 'Bağlantıyı oluştur'}
          </Button>
        ) : (
          <>
            <AbonelikDugmeleri adresler={adresler} />

            <div className="max-w-xl">
              <label htmlFor="takvim-baglantisi" className="block text-sm font-medium text-ink">
                Takvim adresi
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="takvim-baglantisi"
                  ref={girdiRef}
                  type="text"
                  readOnly
                  value={adresler.https}
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
                  : 'Bu adresi tarayıcıda açmayın. Açarsanız tek seferlik bir dosya iner ve güncellenmez. Takvim uygulamasına yapıştırın.'}
              </p>
              <p className="mt-1 text-sm text-ink-3">Bu adres size özeldir. Başkasıyla paylaşmayın.</p>
            </div>

            <GuncellemeSuresi />

            <AbonelikAdimlari />

            <div className="border-t border-line pt-4">
              <Button variant="ghost" size="sm" onClick={yenile} disabled={bekliyor}>
                Bağlantıyı yenile
              </Button>
              <p className="mt-1 text-sm text-ink-3">Bağlantı başkasının eline geçtiyse yenileyin. Eskisi çalışmayı durdurur.</p>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}
