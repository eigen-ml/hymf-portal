'use client';

import React, { useId, useState, useTransition } from 'react';
import { Alan, Button, Uyari, inputSinifi, textareaSinifi } from '@/components/ui';
import { cn } from '@/lib/cn';
import { gunISO } from '@/lib/zaman';
import { toplantiDuzenle, toplantiEkle } from '@/app/toplantilar/actions';
import { Pencere } from './Pencere';
import { birSaatSonra, saatMetni } from './takvimYardim';

const BASLIK_MAX = 200;
const YER_MAX = 300;
const NOT_MAX = 5000;
const TEKRAR_MAX = 20;

const alanSinifi = cn(inputSinifi, 'h-10');

type AlanAdi = 'ad' | 'tarih' | 'saat' | 'bitis' | 'sunum' | 'tekrar';

/** Düzenlenen toplantının bugünkü hali. */
export interface DuzenlenenToplanti {
  id: string;
  title: string;
  meeting_date: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  presentation_url: string | null;
}

export interface KayitSonucu {
  /** Kaydın (ilk) günü, YYYY-MM-DD. */
  gun: string;
  mesaj: string;
}

/**
 * Grup toplantısı ekleme veya düzenleme penceresi. Saatler İstanbul saatidir; bitiş varsayılan
 * olarak başlangıçtan 1 saat sonradır. Haftalık tekrar yalnız eklerken seçilir.
 */
export function ToplantiFormu({
  mevcut,
  varsayilanGun,
  onKapat,
  onKaydedildi,
}: {
  /** Varsa düzenleme, yoksa yeni toplantı. */
  mevcut?: DuzenlenenToplanti;
  varsayilanGun?: string;
  onKapat: () => void;
  onKaydedildi: (sonuc: KayitSonucu) => void;
}) {
  const kimlik = useId();
  const id = (ad: string) => `${kimlik}-${ad}`;

  const ilkSaat = mevcut ? saatMetni(mevcut.meeting_date) : '';
  const [ad, setAd] = useState(mevcut?.title ?? '');
  const [tarih, setTarih] = useState(mevcut ? gunISO(mevcut.meeting_date) : (varsayilanGun ?? ''));
  const [baslangicSaat, setBaslangicSaat] = useState(ilkSaat);
  const [bitisSaat, setBitisSaat] = useState(mevcut ? (mevcut.ends_at ? saatMetni(mevcut.ends_at) : birSaatSonra(ilkSaat)) : '');
  // Kişi bitişi kendisi seçmediyse başlangıç değişince bitiş 1 saat sonrasına kayar.
  const [bitisElle, setBitisElle] = useState(!!mevcut?.ends_at);
  const [yer, setYer] = useState(mevcut?.location ?? '');
  const [notlar, setNotlar] = useState(mevcut?.notes ?? '');
  const [sunum, setSunum] = useState(mevcut?.presentation_url ?? '');
  const [tekrar, setTekrar] = useState('0');
  const [alanHatasi, setAlanHatasi] = useState<{ alan: AlanAdi; mesaj: string } | null>(null);
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [bekliyor, basla] = useTransition();

  const tekrarSayisi = Number(tekrar === '' ? '0' : tekrar);
  const tekrarGecerli = Number.isInteger(tekrarSayisi) && tekrarSayisi >= 0 && tekrarSayisi <= TEKRAR_MAX;

  function hata(alan: AlanAdi, mesaj: string) {
    setAlanHatasi({ alan, mesaj });
    document.getElementById(id(alan))?.focus();
  }

  function baslangicDegisti(deger: string) {
    setBaslangicSaat(deger);
    if (!bitisElle && /^\d{2}:\d{2}$/.test(deger)) setBitisSaat(birSaatSonra(deger));
  }

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAlanHatasi(null);
    setSunucuHatasi(null);

    const baslik = ad.trim();
    if (!baslik) return hata('ad', 'Toplantı adını yazın.');
    if (baslik.length > BASLIK_MAX) return hata('ad', `Ad ${BASLIK_MAX} karakteri aşamaz.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih) || Number.isNaN(Date.parse(`${tarih}T12:00:00Z`))) {
      return hata('tarih', 'Tarihi seçin.');
    }
    if (!/^\d{2}:\d{2}$/.test(baslangicSaat)) return hata('saat', 'Başlangıç saatini seçin.');
    if (bitisSaat) {
      if (!/^\d{2}:\d{2}$/.test(bitisSaat)) return hata('bitis', 'Bitiş saatini kontrol edin.');
      if (bitisSaat <= baslangicSaat) return hata('bitis', 'Bitiş saati başlangıçtan sonra olmalı.');
    }
    const url = sunum.trim();
    if (url && !/^https?:\/\//i.test(url)) return hata('sunum', 'Bağlantı http:// veya https:// ile başlamalı.');
    if (!mevcut && !tekrarGecerli) return hata('tekrar', `Tekrar sayısı 0 ile ${TEKRAR_MAX} arasında bir tam sayı olmalı.`);

    const girdi = {
      title: baslik,
      meeting_date: `${tarih}T${baslangicSaat}:00+03:00`,
      ends_at: bitisSaat ? `${tarih}T${bitisSaat}:00+03:00` : '',
      location: yer.trim(),
      notes: notlar.trim(),
      presentation_url: url,
    };

    basla(async () => {
      const sonuc = mevcut
        ? await toplantiDuzenle(mevcut.id, girdi)
        : await toplantiEkle({ ...girdi, tekrar_hafta: tekrarSayisi });
      if (!sonuc.ok) {
        setSunucuHatasi(sonuc.error);
        return;
      }
      const mesaj = mevcut
        ? 'Toplantı güncellendi.'
        : tekrarSayisi > 0
          ? `${tekrarSayisi + 1} toplantı eklendi.`
          : 'Toplantı eklendi.';
      onKaydedildi({ gun: tarih, mesaj });
    });
  }

  const hataMesaji = (alan: AlanAdi) => (alanHatasi?.alan === alan ? alanHatasi.mesaj : undefined);
  const gecersiz = (alan: AlanAdi) => alanHatasi?.alan === alan || undefined;

  return (
    <Pencere baslik={mevcut ? 'Toplantıyı düzenle' : 'Grup toplantısı ekle'} onKapat={onKapat}>
      <form onSubmit={gonder} noValidate className="space-y-4">
        <Alan etiket="Toplantı adı" htmlFor={id('ad')} hata={hataMesaji('ad')}>
          <input
            id={id('ad')}
            type="text"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            maxLength={BASLIK_MAX}
            placeholder="Örn. Haftalık grup toplantısı"
            data-ilk-odak
            aria-invalid={gecersiz('ad')}
            className={alanSinifi}
          />
        </Alan>

        <Alan etiket="Tarih" htmlFor={id('tarih')} hata={hataMesaji('tarih')}>
          <input
            id={id('tarih')}
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            aria-invalid={gecersiz('tarih')}
            className={alanSinifi}
          />
        </Alan>

        <div className="grid gap-4 sm:grid-cols-2">
          <Alan etiket="Başlangıç saati" htmlFor={id('saat')} hata={hataMesaji('saat')}>
            <input
              id={id('saat')}
              type="time"
              value={baslangicSaat}
              onChange={(e) => baslangicDegisti(e.target.value)}
              aria-invalid={gecersiz('saat')}
              className={alanSinifi}
            />
          </Alan>
          <Alan etiket="Bitiş" htmlFor={id('bitis')} hata={hataMesaji('bitis')}>
            <input
              id={id('bitis')}
              type="time"
              value={bitisSaat}
              onChange={(e) => {
                setBitisSaat(e.target.value);
                setBitisElle(true);
              }}
              aria-invalid={gecersiz('bitis')}
              className={alanSinifi}
            />
          </Alan>
        </div>

        <Alan etiket="Yer (isteğe bağlı)" htmlFor={id('yer')}>
          <input
            id={id('yer')}
            type="text"
            value={yer}
            onChange={(e) => setYer(e.target.value)}
            maxLength={YER_MAX}
            placeholder="Örn. Seminer odası"
            className={alanSinifi}
          />
        </Alan>

        <Alan etiket="Not (isteğe bağlı)" htmlFor={id('not')} yardim="Gündem, sunum yapacaklar veya alınan kararlar.">
          <textarea
            id={id('not')}
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            maxLength={NOT_MAX}
            rows={3}
            className={textareaSinifi}
          />
        </Alan>

        <Alan etiket="Sunum bağlantısı (isteğe bağlı)" htmlFor={id('sunum')} hata={hataMesaji('sunum')}>
          <input
            id={id('sunum')}
            type="url"
            value={sunum}
            onChange={(e) => setSunum(e.target.value)}
            placeholder="https://..."
            aria-invalid={gecersiz('sunum')}
            className={alanSinifi}
          />
        </Alan>

        {!mevcut && (
          <Alan
            etiket="Her hafta tekrarla"
            htmlFor={id('tekrar')}
            hata={hataMesaji('tekrar')}
            yardim={
              tekrarGecerli && tekrarSayisi > 0
                ? `Aynı gün ve saatte ${tekrarSayisi} hafta daha eklenir, toplam ${tekrarSayisi + 1} toplantı.`
                : '0 = tek toplantı'
            }
          >
            <div className="flex items-center gap-2">
              <input
                id={id('tekrar')}
                type="number"
                inputMode="numeric"
                min={0}
                max={TEKRAR_MAX}
                step={1}
                value={tekrar}
                onChange={(e) => setTekrar(e.target.value)}
                aria-invalid={gecersiz('tekrar')}
                className={cn(alanSinifi, 'w-24')}
              />
              <span className="text-sm text-ink-2">hafta</span>
            </div>
          </Alan>
        )}

        {mevcut && (
          <p className="text-sm text-ink-3">
            Yalnız bu toplantı değişir. Saat veya yer değişirse grubun Telegram kanalına bildirim gider.
          </p>
        )}

        {sunucuHatasi && <Uyari tone="tehlike">{sunucuHatasi}</Uyari>}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button type="submit" variant="primary" size="md" disabled={bekliyor}>
            {bekliyor ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={onKapat} disabled={bekliyor}>
            İptal
          </Button>
        </div>
      </form>
    </Pencere>
  );
}
