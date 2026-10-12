'use client';

import React from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { BosDurum, Button, Rozet, Uyari, buttonClass } from '@/components/ui';
import type { RozetTonu } from '@/components/ui';
import { sonTarihMetni } from '@/lib/zaman';
import type { GorevDurum, TakvimOgesi } from '@/types/database';
import { Pencere } from './Pencere';
import { GOREV_DURUM_ETIKETI, TUR_ETIKETI, gecikmisMi, gunBasligi, ogeTonu, ogeZamani } from './takvimYardim';

const GOREV_DURUM_TONU: Record<GorevDurum, RozetTonu> = {
  acik: 'notr',
  teslim_edildi: 'inceleme',
  tamamlandi: 'basari',
};

function Ayrinti({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <p className="text-sm text-ink-2">
      <span className="text-ink-3">{etiket}: </span>
      {children}
    </p>
  );
}

function Oge({
  o,
  bugun,
  yonetebilir,
  islemde,
  onSil,
  onDuzenle,
}: {
  o: TakvimOgesi;
  bugun: string;
  yonetebilir: boolean;
  islemde: boolean;
  onSil: (o: TakvimOgesi) => void;
  onDuzenle: (o: TakvimOgesi) => void;
}) {
  const gorev = o.tur === 'gorev';
  const gecikti = gecikmisMi(o, bugun);

  return (
    <li className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <Rozet tone={ogeTonu(o, bugun)}>{TUR_ETIKETI[o.tur]}</Rozet>
        {gorev && o.gorevDurum && <Rozet tone={GOREV_DURUM_TONU[o.gorevDurum]}>{GOREV_DURUM_ETIKETI[o.gorevDurum]}</Rozet>}
        {gecikti && <Rozet tone="uyari">{sonTarihMetni(o.gun, bugun)}</Rozet>}
        <span className="text-sm tabular-nums text-ink-3">{ogeZamani(o)}</span>
      </div>

      <h3 className="text-lg font-semibold text-ink">{o.baslik}</h3>

      {o.aciklama && <p className="whitespace-pre-line text-base leading-7 text-ink">{o.aciklama}</p>}

      <div className="space-y-0.5">
        {o.yer && <Ayrinti etiket="Yer">{o.yer}</Ayrinti>}
        {gorev ? (
          <>
            {o.sorumluAd && <Ayrinti etiket="Görevi alan">{o.sorumluAd}</Ayrinti>}
            {o.ekleyenAd && <Ayrinti etiket="Görevi veren">{o.ekleyenAd}</Ayrinti>}
          </>
        ) : (
          o.ekleyenAd && <Ayrinti etiket="Ekleyen">{o.ekleyenAd}</Ayrinti>
        )}
      </div>

      {gorev ? (
        <div className="pt-1">
          <Link href="/gorevler" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
            {yonetebilir ? 'Görevler sayfasında düzenle' : 'Görevler sayfasında aç'}
          </Link>
        </div>
      ) : (
        (o.silebilir || o.tur === 'toplanti') && (
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Toplantıyı her üye düzenler; silme ekleyende, hocada, yöneticide. Etkinlikte düzenleme yok. */}
            {o.tur === 'toplanti' && (
              <Button variant="secondary" size="sm" onClick={() => onDuzenle(o)} disabled={islemde}>
                <Pencil className="size-4" />
                Düzenle
              </Button>
            )}
            {o.silebilir && (
              <Button variant="secondary" size="sm" onClick={() => onSil(o)} disabled={islemde}>
                <Trash2 className="size-4" />
                Sil
              </Button>
            )}
          </div>
        )
      )}
    </li>
  );
}

/** Bir günün kayıtları: saat, ad, tür, açıklama, yer, ekleyen. */
export function GunDetayi({
  gun,
  ogeler,
  bugun,
  yonetebilir,
  islemde,
  hata,
  onSil,
  onDuzenle,
  onEkle,
  onKapat,
}: {
  gun: string;
  ogeler: TakvimOgesi[];
  bugun: string;
  yonetebilir: boolean;
  islemde: boolean;
  hata: string | null;
  onSil: (o: TakvimOgesi) => void;
  onDuzenle: (o: TakvimOgesi) => void;
  onEkle: (gun: string) => void;
  onKapat: () => void;
}) {
  return (
    <Pencere baslik={gunBasligi(gun)} onKapat={onKapat}>
      <div className="space-y-4">
        {hata && <Uyari tone="tehlike">{hata}</Uyari>}

        {ogeler.length === 0 ? (
          <BosDurum baslik="Bu günde kayıt yok." aciklama="Etkinlik veya toplantı eklemek için aşağıdaki düğmeyi kullanın." />
        ) : (
          <ul className="divide-y divide-line">
            {ogeler.map((o) => (
              <Oge key={o.anahtar} o={o} bugun={bugun} yonetebilir={yonetebilir} islemde={islemde} onSil={onSil} onDuzenle={onDuzenle} />
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variant="secondary" size="md" onClick={() => onEkle(gun)}>
            <Plus className="size-4" />
            Bu güne ekle
          </Button>
          <Button variant="ghost" size="md" onClick={onKapat}>
            Kapat
          </Button>
        </div>
      </div>
    </Pencere>
  );
}
