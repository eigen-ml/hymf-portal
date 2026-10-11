'use client';

import React, { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { gorevVer } from '@/app/gorevler/actions';
import { Alan, Button, Panel, Uyari, inputSinifi, selectSinifi, textareaSinifi } from '@/components/ui';
import { cn } from '@/lib/cn';
import { KADRO_ETIKETI } from '@/lib/etiketler';
import { kisaTarih } from '@/lib/zaman';
import type { ProfileSummary } from '@/types/database';
import { gunEkle } from './yardimci';

export type KisiSecenegi = Pick<ProfileSummary, 'id' | 'full_name' | 'academic_title' | 'kadro'>;

export interface ToplantiSecenegi {
  id: string;
  title: string;
  meeting_date: string;
}

export function GorevFormu({
  kisiler,
  toplantilar,
  varsayilanToplantiId,
  bugun,
  onBitti,
  onVazgec,
}: {
  kisiler: KisiSecenegi[];
  toplantilar: ToplantiSecenegi[];
  varsayilanToplantiId: string;
  bugun: string;
  /** Görev verilince; ekranda gösterilecek kısa mesajı verir. */
  onBitti: (mesaj: string) => void;
  onVazgec: () => void;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [sonTarih, setSonTarih] = useState('');
  const [toplantiId, setToplantiId] = useState(varsayilanToplantiId);
  const [hata, setHata] = useState<string | null>(null);

  const baslikId = useId();
  const aciklamaId = useId();
  const tarihId = useId();
  const toplantiAlanId = useId();

  // Görev öğrenciye verilir; öğretim üyeleri listede yok.
  const adaylar = kisiler.filter((k) => k.kadro !== 'hoca');
  const hepsiSecili = adaylar.length > 0 && adaylar.every((k) => secili.has(k.id));
  const birHafta = gunEkle(bugun, 7);
  const ikiHafta = gunEkle(bugun, 14);

  function kisiDegistir(id: string) {
    setSecili((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  function hepsiniDegistir() {
    setSecili(hepsiSecili ? new Set() : new Set(adaylar.map((k) => k.id)));
  }

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!baslik.trim()) {
      setHata('Görevin adını yazın.');
      return;
    }
    if (secili.size === 0) {
      setHata('Görevi kime vereceğinizi seçin.');
      return;
    }
    setHata(null);
    const kisiSayisi = secili.size;
    basla(async () => {
      const sonuc = await gorevVer({
        title: baslik,
        description: aciklama,
        assignee_ids: [...secili],
        due_date: sonTarih,
        meeting_id: toplantiId,
      });
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      router.refresh();
      onBitti(kisiSayisi === 1 ? 'Görev verildi.' : `Görev ${kisiSayisi} kişiye verildi.`);
    });
  }

  return (
    <Panel baslik="Yeni görev" aciklama="Görevi haftalık toplantıdan sonra buradan verin. Herkes görebilir.">
      <form onSubmit={gonder} className="space-y-6">
        {hata && <Uyari tone="tehlike">{hata}</Uyari>}

        <Alan etiket="Görev" htmlFor={baslikId}>
          <input
            id={baslikId}
            type="text"
            required
            maxLength={200}
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            placeholder="Örneğin: Silisyum bant yapısını hesapla"
            autoFocus
            className={inputSinifi}
          />
        </Alan>

        <Alan etiket="Açıklama (isteğe bağlı)" htmlFor={aciklamaId}>
          <textarea
            id={aciklamaId}
            rows={3}
            maxLength={5000}
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            className={textareaSinifi}
          />
        </Alan>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">Kime</legend>
          {adaylar.length > 0 && (
            <Button variant="secondary" onClick={hepsiniDegistir}>
              {hepsiSecili ? 'Seçimi temizle' : 'Herkesi seç'}
            </Button>
          )}

          {adaylar.length === 0 ? (
            <p className="text-sm text-ink-3">Görev verilebilecek üye bulunamadı.</p>
          ) : (
            <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {adaylar.map((k) => {
                const isaretli = secili.has(k.id);
                return (
                  <li key={k.id}>
                    <label
                      className={cn(
                        'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2',
                        isaretli ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-sunken'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isaretli}
                        onChange={() => kisiDegistir(k.id)}
                        className="size-5 shrink-0 accent-accent"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{k.full_name}</span>
                        {k.kadro && <span className="block text-sm text-ink-3">{KADRO_ETIKETI[k.kadro]}</span>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {adaylar.length > 0 && (
            <p className="text-sm text-ink-3" aria-live="polite">
              {secili.size === 0 ? 'Kimse seçilmedi.' : `${secili.size} kişi seçildi.`}
            </p>
          )}
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <Alan etiket="Son tarih (isteğe bağlı)" htmlFor={tarihId}>
            <div className="space-y-2">
              <input id={tarihId} type="date" value={sonTarih} onChange={(e) => setSonTarih(e.target.value)} className={inputSinifi} />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  className={cn(sonTarih === birHafta && 'border-accent bg-accent-soft text-accent-ink')}
                  onClick={() => setSonTarih(birHafta)}
                  aria-pressed={sonTarih === birHafta}
                >
                  1 hafta sonra
                </Button>
                <Button
                  variant="secondary"
                  className={cn(sonTarih === ikiHafta && 'border-accent bg-accent-soft text-accent-ink')}
                  onClick={() => setSonTarih(ikiHafta)}
                  aria-pressed={sonTarih === ikiHafta}
                >
                  2 hafta sonra
                </Button>
                {sonTarih && (
                  <Button variant="ghost" onClick={() => setSonTarih('')}>
                    Temizle
                  </Button>
                )}
              </div>
            </div>
          </Alan>

          <Alan etiket="Hangi toplantıda verildi (isteğe bağlı)" htmlFor={toplantiAlanId}>
            <select id={toplantiAlanId} value={toplantiId} onChange={(e) => setToplantiId(e.target.value)} className={selectSinifi}>
              <option value="">Toplantıyla ilgisi yok</option>
              {toplantilar.map((m) => (
                <option key={m.id} value={m.id}>
                  {kisaTarih(m.meeting_date)}, {m.title}
                </option>
              ))}
            </select>
          </Alan>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" size="lg" disabled={bekliyor}>
            {bekliyor ? 'Veriliyor...' : 'Görevi ver'}
          </Button>
          <Button variant="ghost" size="lg" disabled={bekliyor} onClick={onVazgec}>
            Vazgeç
          </Button>
        </div>
      </form>
    </Panel>
  );
}
