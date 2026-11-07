'use client';

import React, { useId, useState, useTransition } from 'react';
import { Button, Uyari, textareaSinifi } from '@/components/ui';
import { tarihSaat } from '@/lib/zaman';

export type SunumNotu = { id: string; govde: string; tarih: string };
type Sonuc = { ok: true } | { ok: false; error: string };

/**
 * Hocanın bir kişinin sunumuna bıraktığı notlar (kişinin satırında, sağda).
 * ekle/sil yalnız hoca linkinden açılan sayfada verilir; üyeler yalnız okur.
 */
export function SunumNotlari({
  kisi,
  notlar,
  ekle,
  sil,
}: {
  kisi: string;
  notlar: SunumNotu[];
  ekle?: (govde: string) => Promise<Sonuc>;
  sil?: (notId: string) => Promise<Sonuc>;
}) {
  const [metin, setMetin] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();
  const alanId = useId();

  const gonder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekle || !metin.trim()) return;
    setHata(null);
    baslat(async () => {
      const sonuc = await ekle(metin);
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      setMetin('');
    });
  };

  const notuSil = (id: string) => {
    if (!sil) return;
    setHata(null);
    baslat(async () => {
      const sonuc = await sil(id);
      if (!sonuc.ok) setHata(sonuc.error);
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink-2">Hocanın notları</p>
      {notlar.length ? (
        <ul className="space-y-2">
          {notlar.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-sunken px-3 py-2">
              <p className="whitespace-pre-wrap break-words text-sm text-ink">{n.govde}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-3">{tarihSaat(n.tarih)}</span>
                {sil && (
                  <button
                    type="button"
                    onClick={() => notuSil(n.id)}
                    disabled={bekliyor}
                    className="text-xs font-medium text-ink-3 underline-offset-2 hover:text-ink hover:underline"
                  >
                    Sil
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-3">Henüz not yok.</p>
      )}
      {hata && <Uyari tone="tehlike">{hata}</Uyari>}
      {ekle && (
        <form onSubmit={gonder} className="space-y-2">
          <label htmlFor={alanId} className="sr-only">
            {kisi} için not
          </label>
          <textarea
            id={alanId}
            rows={2}
            maxLength={2000}
            placeholder="Not bırakın…"
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            className={textareaSinifi}
          />
          <Button type="submit" variant="primary" size="sm" disabled={bekliyor || !metin.trim()}>
            {bekliyor ? 'Kaydediliyor…' : 'Not bırak'}
          </Button>
        </form>
      )}
    </div>
  );
}
