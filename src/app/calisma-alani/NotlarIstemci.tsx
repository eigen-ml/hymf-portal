'use client';

import React, { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { kisaAd } from '@/lib/etiketler';
import { kisaTarih } from '@/lib/zaman';
import { cn } from '@/lib/cn';
import { BasHarfAvatar, Button, Panel, Uyari, textareaSinifi } from '@/components/ui';
import { notEkle, notIsaretle, notSil, type ActionSonucu } from './actions';

export interface NotKaydi {
  id: string;
  yazar_id: string;
  tur: 'not' | 'fikir';
  govde: string;
  yapildi: boolean;
  created_at: string;
  yazar: { id: string; full_name: string } | null;
}

type Calistir = (is: () => Promise<ActionSonucu>) => Promise<boolean>;

function useEylem() {
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, basla] = useTransition();
  const calistir: Calistir = (is) =>
    new Promise((coz) =>
      basla(async () => {
        setHata(null);
        const sonuc = await is();
        if (!sonuc.ok) setHata(sonuc.error);
        coz(sonuc.ok);
      })
    );
  return { hata, bekliyor, calistir };
}

function YeniNot({ tur, yerTutucu, calistir, bekliyor }: { tur: 'not' | 'fikir'; yerTutucu: string; calistir: Calistir; bekliyor: boolean }) {
  const [metin, setMetin] = useState('');
  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!metin.trim()) return;
    if (await calistir(() => notEkle(tur, metin))) setMetin('');
  }
  return (
    <form onSubmit={gonder} className="space-y-2">
      <label className="sr-only" htmlFor={`yeni-${tur}`}>
        {yerTutucu}
      </label>
      <textarea
        id={`yeni-${tur}`}
        rows={2}
        maxLength={2000}
        value={metin}
        onChange={(e) => setMetin(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) gonder(e);
        }}
        placeholder={yerTutucu}
        className={cn(textareaSinifi, 'min-h-16')}
      />
      <Button type="submit" variant="primary" size="sm" disabled={bekliyor || !metin.trim()}>
        Ekle
      </Button>
    </form>
  );
}

function NotSatiri({
  kayit,
  isaretlenebilir,
  silinebilir,
  yazarGoster,
  calistir,
  bekliyor,
}: {
  kayit: NotKaydi;
  isaretlenebilir?: boolean;
  silinebilir?: boolean;
  yazarGoster?: boolean;
  calistir: Calistir;
  bekliyor: boolean;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      {isaretlenebilir ? (
        <input
          type="checkbox"
          checked={kayit.yapildi}
          disabled={bekliyor}
          onChange={(e) => calistir(() => notIsaretle(kayit.id, e.target.checked))}
          aria-label={kayit.yapildi ? 'Yapılmadı olarak işaretle' : 'Yapıldı olarak işaretle'}
          className="mt-1 size-4 shrink-0 cursor-pointer accent-accent"
        />
      ) : (
        kayit.tur === 'not' && (
          <span
            aria-label={kayit.yapildi ? 'Yapıldı' : 'Yapılacak'}
            className={cn('mt-1.5 size-3 shrink-0 rounded-full border', kayit.yapildi ? 'border-ok bg-ok' : 'border-line-strong')}
          />
        )
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('whitespace-pre-wrap break-words text-sm text-ink', kayit.yapildi && 'text-ink-3 line-through')}>
          {kayit.govde}
        </p>
        <p className="mt-0.5 text-xs text-ink-3">
          {yazarGoster && kayit.yazar && <>{kisaAd(kayit.yazar.full_name)} · </>}
          {kisaTarih(kayit.created_at)}
        </p>
      </div>
      {silinebilir && (
        <button
          type="button"
          disabled={bekliyor}
          onClick={() => {
            if (window.confirm('Bu not silinsin mi?')) calistir(() => notSil(kayit.id));
          }}
          className="shrink-0 cursor-pointer rounded p-1 text-ink-3 hover:bg-sunken hover:text-danger"
          aria-label="Notu sil"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

export function NotlarIstemci({ kayitlar, benId, yonetici }: { kayitlar: NotKaydi[]; benId: string; yonetici: boolean }) {
  const { hata, bekliyor, calistir } = useEylem();

  // Yapılacaklar üstte, yapılanlar altta; ikisi de yeniden eskiye.
  const notlar = kayitlar.filter((k) => k.tur === 'not').sort((a, b) => Number(a.yapildi) - Number(b.yapildi));
  const benimkiler = notlar.filter((k) => k.yazar_id === benId);
  const fikirler = kayitlar.filter((k) => k.tur === 'fikir');

  const kisiler = new Map<string, { ad: string; notlar: NotKaydi[] }>();
  for (const n of notlar) {
    if (n.yazar_id === benId) continue;
    const kisi = kisiler.get(n.yazar_id) ?? { ad: n.yazar?.full_name ?? 'Üye', notlar: [] };
    kisi.notlar.push(n);
    kisiler.set(n.yazar_id, kisi);
  }
  const digerleri = [...kisiler.entries()].sort((a, b) => a[1].ad.localeCompare(b[1].ad, 'tr'));

  const ortak = { calistir, bekliyor };

  return (
    <div className="space-y-8">
      {hata && <Uyari tone="tehlike">{hata}</Uyari>}

      <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
        <Panel baslik="Notlarım" aciklama="Ne yapacaktın, nerede kaldın. Bitince kutuyu işaretle.">
          <YeniNot tur="not" yerTutucu="Örn: Fonon hesabını 4×4×1 ile tekrar at" {...ortak} />
          {benimkiler.length > 0 ? (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {benimkiler.map((k) => (
                <NotSatiri key={k.id} kayit={k} isaretlenebilir silinebilir {...ortak} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-3">Henüz notun yok.</p>
          )}
        </Panel>

        <Panel baslik="Fikirler" aciklama="Aklındaki her şey: hesap fikri, okunacak makale, site önerisi.">
          <YeniNot tur="fikir" yerTutucu="Bir fikir yaz" {...ortak} />
          {fikirler.length > 0 ? (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {fikirler.map((k) => (
                <NotSatiri
                  key={k.id}
                  kayit={k}
                  yazarGoster
                  silinebilir={k.yazar_id === benId || yonetici}
                  {...ortak}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-3">Henüz fikir yok, ilk sen yaz.</p>
          )}
        </Panel>
      </div>

      {digerleri.length > 0 && (
        <Panel baslik="Herkesin notları" aciklama="Diğerleri ne üzerinde çalışıyor. Açmak için isme bas.">
          <div className="space-y-2">
            {digerleri.map(([id, kisi]) => {
              const acik = kisi.notlar.filter((n) => !n.yapildi).length;
              return (
                <details key={id} className="group rounded-lg border border-line">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden">
                    <span className="inline-block text-ink-3 transition group-open:rotate-90">›</span>
                    <BasHarfAvatar ad={kisi.ad} size="sm" />
                    <span className="min-w-0 flex-1 font-medium text-ink">{kisi.ad}</span>
                    <span className="text-sm text-ink-3">{acik} yapılacak</span>
                  </summary>
                  <ul className="divide-y divide-line border-t border-line px-4">
                    {kisi.notlar.map((k) => (
                      <NotSatiri key={k.id} kayit={k} silinebilir={yonetici} {...ortak} />
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
