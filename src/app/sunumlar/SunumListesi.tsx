'use client';

import React, { useId, useState, useTransition } from 'react';
import { ExternalLink } from 'lucide-react';
import { Panel, Rozet, Button, Uyari, BosDurum, buttonClass, inputSinifi } from '@/components/ui';
import { sunumKlasoruKaydet } from './actions';

type Uye = { id: string; ad: string; klasor: string | null };

export function SunumListesi({ uyeler, benId, yonetici }: { uyeler: Uye[]; benId: string; yonetici: boolean }) {
  if (!uyeler.length) return <BosDurum baslik="Henüz üye yok." />;

  // Kendi satırın en üstte; gerisi ada göre (listMembers sıralı getirir).
  const sirali = [...uyeler.filter((u) => u.id === benId), ...uyeler.filter((u) => u.id !== benId)];

  return (
    <Panel govdeSinifi="p-0">
      <ul className="divide-y divide-line">
        {sirali.map((u) => (
          <SunumSatiri key={u.id} uye={u} ben={u.id === benId} duzenleyebilir={u.id === benId || yonetici} />
        ))}
      </ul>
    </Panel>
  );
}

function SunumSatiri({ uye, ben, duzenleyebilir }: { uye: Uye; ben: boolean; duzenleyebilir: boolean }) {
  const [duzenle, setDuzenle] = useState(false);
  const [deger, setDeger] = useState(uye.klasor ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();
  const inputId = useId();

  const kaydet = (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    baslat(async () => {
      const sonuc = await sunumKlasoruKaydet(uye.id, deger);
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      setDuzenle(false);
    });
  };

  return (
    <li className="space-y-3 px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-base font-semibold text-ink">
          <span className="truncate">{uye.ad}</span>
          {ben && <Rozet tone="notr">Sen</Rozet>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {uye.klasor ? (
            <a
              href={uye.klasor}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({ variant: ben ? 'primary' : 'secondary', size: 'sm' })}
            >
              {ben ? 'Klasörüme yükle' : 'Klasörü aç'} <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : (
            <span className="text-sm text-ink-3">Klasör henüz yok</span>
          )}
          {duzenleyebilir && !duzenle && (
            <Button variant="ghost" size="sm" onClick={() => setDuzenle(true)}>
              {uye.klasor ? 'Bağlantıyı değiştir' : 'Bağlantı ekle'}
            </Button>
          )}
        </div>
      </div>
      {hata && <Uyari tone="tehlike">{hata}</Uyari>}
      {duzenle && (
        <form onSubmit={kaydet} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor={inputId} className="sr-only">
            {uye.ad} sunum klasörü bağlantısı
          </label>
          <input
            id={inputId}
            type="url"
            inputMode="url"
            placeholder="https://drive.google.com/drive/folders/…"
            value={deger}
            onChange={(e) => setDeger(e.target.value)}
            className={inputSinifi + ' flex-1'}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={bekliyor}>
              {bekliyor ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDuzenle(false);
                setDeger(uye.klasor ?? '');
                setHata(null);
              }}
            >
              Vazgeç
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
