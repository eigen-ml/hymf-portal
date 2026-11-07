'use client';

import { ExternalLink } from 'lucide-react';
import { Panel, BosDurum, buttonClass } from '@/components/ui';
import { DriveDosyaListesi, type DriveDosyasiOzeti } from '@/components/DriveDosyaListesi';
import { SunumNotlari, type SunumNotu } from '@/components/SunumNotlari';
import { hocaNotuEkle, hocaNotuSil } from './actions';

type Uye = { id: string; ad: string; klasor: string; notlar: SunumNotu[]; dosyalar: DriveDosyasiOzeti[] | null };

/** Hoca görünümü: her kişinin dosyaları solda açık, notları sağda. */
export function HocaSunumListesi({ anahtar, uyeler }: { anahtar: string; uyeler: Uye[] }) {
  if (!uyeler.length) return <BosDurum baslik="Henüz sunum klasörü yok." />;

  return (
    <Panel govdeSinifi="p-0">
      <ul className="divide-y divide-line">
        {uyeler.map((u) => (
          <li key={u.id} className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="truncate text-base font-semibold text-ink">{u.ad}</p>
                <a
                  href={u.klasor}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  Klasörü aç <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <DriveDosyaListesi dosyalar={u.dosyalar} />
            </div>
            <SunumNotlari
              kisi={u.ad}
              notlar={u.notlar}
              ekle={(govde) => hocaNotuEkle(anahtar, u.id, govde)}
              sil={(notId) => hocaNotuSil(anahtar, notId)}
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
