'use client';

import React, { useId, useState, useTransition } from 'react';
import { Alan, Button, Uyari, inputSinifi, textareaSinifi } from '@/components/ui';
import { cn } from '@/lib/cn';
import { etkinlikEkle } from '@/app/takvim/actions';
import { toplantiEkle } from '@/app/toplantilar/actions';
import { Pencere } from './Pencere';

const BASLIK_MAX = 200;
const YER_MAX = 300;
const NOT_MAX = 5000;
const TEKRAR_MAX = 20;

const alanSinifi = cn(inputSinifi, 'h-10');

type AlanAdi = 'ad' | 'tarih' | 'saat' | 'bitis' | 'tekrar';

export interface EklemeSonucu {
  /** Eklenen kaydın (ilk) günü, YYYY-MM-DD. */
  gun: string;
  mesaj: string;
}

/**
 * Etkinlik veya (işaretlenirse) grup toplantısı ekleme penceresi. Saatler İstanbul saatidir.
 * Grup toplantısı seçeneğini yalnız hoca ve yöneticiler görür.
 */
export function EtkinlikFormu({
  varsayilanGun,
  toplantiEkleyebilir,
  onKapat,
  onEklendi,
}: {
  varsayilanGun: string;
  toplantiEkleyebilir: boolean;
  onKapat: () => void;
  onEklendi: (sonuc: EklemeSonucu) => void;
}) {
  const kimlik = useId();
  const id = (ad: string) => `${kimlik}-${ad}`;

  const [toplanti, setToplanti] = useState(false);
  const [ad, setAd] = useState('');
  const [tarih, setTarih] = useState(varsayilanGun);
  const [tumGun, setTumGun] = useState(false);
  const [baslangicSaat, setBaslangicSaat] = useState('');
  const [bitisSaat, setBitisSaat] = useState('');
  const [yer, setYer] = useState('');
  const [notlar, setNotlar] = useState('');
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

  function gonder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAlanHatasi(null);
    setSunucuHatasi(null);

    const baslik = ad.trim();
    if (!baslik) return hata('ad', toplanti ? 'Toplantı adını yazın.' : 'Etkinlik adını yazın.');
    if (baslik.length > BASLIK_MAX) return hata('ad', `Ad ${BASLIK_MAX} karakteri aşamaz.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih) || Number.isNaN(Date.parse(`${tarih}T12:00:00Z`))) {
      return hata('tarih', 'Tarihi seçin.');
    }

    const saatli = toplanti || !tumGun;
    if (saatli && !/^\d{2}:\d{2}$/.test(baslangicSaat)) {
      return hata('saat', toplanti ? 'Saati seçin.' : 'Başlangıç saatini seçin.');
    }
    if (!toplanti && !tumGun && bitisSaat) {
      if (!/^\d{2}:\d{2}$/.test(bitisSaat)) return hata('bitis', 'Bitiş saatini kontrol edin.');
      if (bitisSaat < baslangicSaat) return hata('bitis', 'Bitiş saati başlangıçtan önce olamaz.');
    }
    if (toplanti && !tekrarGecerli) {
      return hata('tekrar', `Tekrar sayısı 0 ile ${TEKRAR_MAX} arasında bir tam sayı olmalı.`);
    }

    const notMetni = notlar.trim();

    basla(async () => {
      if (toplanti) {
        const sonuc = await toplantiEkle({
          title: baslik,
          meeting_date: `${tarih}T${baslangicSaat}:00+03:00`,
          notes: notMetni,
          presentation_url: '',
          tekrar_hafta: tekrarSayisi,
        });
        if (!sonuc.ok) {
          setSunucuHatasi(sonuc.error);
          return;
        }
        onEklendi({ gun: tarih, mesaj: tekrarSayisi > 0 ? `${tekrarSayisi + 1} toplantı eklendi.` : 'Toplantı eklendi.' });
        return;
      }

      const sonuc = await etkinlikEkle({
        title: baslik,
        starts_at: tumGun ? tarih : `${tarih}T${baslangicSaat}:00+03:00`,
        ends_at: !tumGun && bitisSaat ? `${tarih}T${bitisSaat}:00+03:00` : '',
        all_day: tumGun,
        location: yer.trim(),
        notes: notMetni,
      });
      if (!sonuc.ok) {
        setSunucuHatasi(sonuc.error);
        return;
      }
      onEklendi({ gun: tarih, mesaj: 'Etkinlik eklendi.' });
    });
  }

  const hataMesaji = (alan: AlanAdi) => (alanHatasi?.alan === alan ? alanHatasi.mesaj : undefined);

  return (
    <Pencere baslik={toplanti ? 'Toplantı ekle' : 'Etkinlik ekle'} onKapat={onKapat}>
      <form onSubmit={gonder} noValidate className="space-y-4">
        {toplantiEkleyebilir && (
          <label className="flex min-h-10 cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={toplanti}
              onChange={(e) => {
                setToplanti(e.target.checked);
                setAlanHatasi(null);
              }}
              className="mt-0.5 size-5 shrink-0 accent-primary"
            />
            <span>
              <span className="font-medium">Bu bir grup toplantısı</span>
              <span className="block text-ink-3">İşaretlerseniz Toplantılar sayfasında da görünür.</span>
            </span>
          </label>
        )}

        <Alan etiket={toplanti ? 'Toplantı adı' : 'Etkinlik adı'} htmlFor={id('ad')} hata={hataMesaji('ad')}>
          <input
            id={id('ad')}
            type="text"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            maxLength={BASLIK_MAX}
            data-ilk-odak
            aria-invalid={alanHatasi?.alan === 'ad' || undefined}
            className={alanSinifi}
          />
        </Alan>

        <Alan etiket="Tarih" htmlFor={id('tarih')} hata={hataMesaji('tarih')}>
          <input
            id={id('tarih')}
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            aria-invalid={alanHatasi?.alan === 'tarih' || undefined}
            className={alanSinifi}
          />
        </Alan>

        {!toplanti && (
          <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={tumGun}
              onChange={(e) => setTumGun(e.target.checked)}
              className="size-5 shrink-0 accent-primary"
            />
            Tüm gün
          </label>
        )}

        {(toplanti || !tumGun) && (
          <div className={cn('grid gap-4', !toplanti && 'sm:grid-cols-2')}>
            <Alan etiket={toplanti ? 'Saat' : 'Başlangıç saati'} htmlFor={id('saat')} hata={hataMesaji('saat')}>
              <input
                id={id('saat')}
                type="time"
                value={baslangicSaat}
                onChange={(e) => setBaslangicSaat(e.target.value)}
                aria-invalid={alanHatasi?.alan === 'saat' || undefined}
                className={alanSinifi}
              />
            </Alan>
            {!toplanti && (
              <Alan etiket="Bitiş saati (isteğe bağlı)" htmlFor={id('bitis')} hata={hataMesaji('bitis')}>
                <input
                  id={id('bitis')}
                  type="time"
                  value={bitisSaat}
                  onChange={(e) => setBitisSaat(e.target.value)}
                  aria-invalid={alanHatasi?.alan === 'bitis' || undefined}
                  className={alanSinifi}
                />
              </Alan>
            )}
          </div>
        )}

        {!toplanti && (
          <Alan etiket="Yer (isteğe bağlı)" htmlFor={id('yer')}>
            <input
              id={id('yer')}
              type="text"
              value={yer}
              onChange={(e) => setYer(e.target.value)}
              maxLength={YER_MAX}
              className={alanSinifi}
            />
          </Alan>
        )}

        <Alan etiket="Not (isteğe bağlı)" htmlFor={id('not')}>
          <textarea
            id={id('not')}
            value={notlar}
            onChange={(e) => setNotlar(e.target.value)}
            maxLength={NOT_MAX}
            rows={3}
            className={textareaSinifi}
          />
        </Alan>

        {toplanti && (
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
                aria-invalid={alanHatasi?.alan === 'tekrar' || undefined}
                className={cn(alanSinifi, 'w-24')}
              />
              <span className="text-sm text-ink-2">hafta</span>
            </div>
          </Alan>
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
