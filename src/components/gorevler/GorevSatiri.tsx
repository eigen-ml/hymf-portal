'use client';

import React, { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { gorevDurumu, gorevDuzenle, gorevNotu, gorevSil, type ActionSonucu } from '@/app/gorevler/actions';
import { Alan, Button, Uyari, inputSinifi, textareaSinifi } from '@/components/ui';
import { cn } from '@/lib/cn';
import { kisaAd } from '@/lib/etiketler';
import { bugunISO, kisaTarih, sonTarihMetni, tarih } from '@/lib/zaman';
import type { GroupTask } from '@/types/database';
import { gecikmisMi } from './yardimci';

type Mod = 'goster' | 'duzenle' | 'not' | 'sil';

export interface GorevSatiriProps {
  gorev: GroupTask;
  benId: string;
  /** Hoca veya yönetici: tamamlandı tikler, düzenler, siler. */
  yonetebilir: boolean;
  /** Sunucunun hesapladığı bugün (YYYY-MM-DD); sunucu ve tarayıcı aynı günü görsün. */
  bugun?: string;
  /** Pano için: yalnız başlık, kişi ve son tarih. */
  kompakt?: boolean;
  /** Görevi alan kişinin adını göster; kişiye göre listede gerekmez. */
  kisiGoster?: boolean;
}


export function GorevSatiri({ gorev, benId, yonetebilir, bugun: bugunProp, kompakt = false, kisiGoster = true }: GorevSatiriProps) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [mod, setMod] = useState<Mod>('goster');
  const [hata, setHata] = useState<string | null>(null);
  const [aciklamaAcik, setAciklamaAcik] = useState(false);

  const bugun = bugunProp ?? bugunISO();
  const benimki = gorev.assignee_id === benId;
  const tamam = gorev.status === 'tamamlandi';
  // Tamamlandı işaretini veritabanı da yalnız hocaya ve yöneticiye bırakır.
  const isaretlenebilir = yonetebilir;
  const gecikti = gecikmisMi(gorev, bugun);
  const uzunAciklama =
    !!gorev.description && (gorev.description.length > 120 || (gorev.description.match(/\n/g)?.length ?? 0) >= 2);

  function calistir(is: () => Promise<ActionSonucu>, bitince?: () => void) {
    setHata(null);
    basla(async () => {
      const sonuc = await is();
      if (!sonuc.ok) {
        setHata(sonuc.error);
        return;
      }
      bitince?.();
      router.refresh();
    });
  }

  if (mod === 'duzenle') {
    return (
      <li className="py-4">
        <GorevDuzenleFormu
          gorev={gorev}
          onBitti={() => setMod('goster')}
          onVazgec={() => setMod('goster')}
        />
      </li>
    );
  }

  // Başlığın altındaki gri satır: kim verdi, hangi toplantı, ne zaman bitmeli.
  const ayrintilar: React.ReactNode[] = [];
  if (!kompakt && gorev.assigner) {
    ayrintilar.push(<span key="veren">Veren: {kisaAd(gorev.assigner.full_name)}</span>);
  }
  if (!kompakt && gorev.meeting) {
    ayrintilar.push(
      <span key="toplanti" title={gorev.meeting.title}>
        Toplantı: {kisaTarih(gorev.meeting.meeting_date)}
      </span>
    );
  }
  if (gorev.due_date) {
    ayrintilar.push(
      <span key="tarih" className={cn(gecikti && 'font-medium text-warn')} title={tarih(gorev.due_date)}>
        {gecikti ? sonTarihMetni(gorev.due_date, bugun) : `Son tarih: ${sonTarihMetni(gorev.due_date, bugun)}`}
      </span>
    );
  }

  const notYazabilir = benimki;
  const ikincilVar = !kompakt && (notYazabilir || yonetebilir);

  return (
    <li className={cn(kompakt ? 'py-3' : 'py-4')} aria-busy={bekliyor}>
      <div className="flex items-start gap-3">
        {isaretlenebilir && (
          <input
            type="checkbox"
            checked={tamam}
            disabled={bekliyor}
            onChange={(e) => calistir(() => gorevDurumu(gorev.id, e.target.checked ? 'tamamlandi' : 'acik'))}
            aria-label={`${tamam ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}: ${gorev.title}`}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-accent"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className={cn(tamam && 'opacity-60')}>
            <p className={cn('text-base font-medium text-ink', tamam && 'line-through')}>
              {tamam && !isaretlenebilir && <span className="sr-only">Tamamlandı: </span>}
              {gorev.title}
            </p>
            {kisiGoster && gorev.assignee && (
              <p className="mt-1 text-sm font-medium text-ink-2">{benimki ? `${gorev.assignee.full_name} (siz)` : gorev.assignee.full_name}</p>
            )}

            {!kompakt && gorev.description && (
              <div className="mt-1">
                <p className={cn('whitespace-pre-line text-sm text-ink-2', !aciklamaAcik && 'line-clamp-2')}>{gorev.description}</p>
                {uzunAciklama && (
                  <button
                    type="button"
                    onClick={() => setAciklamaAcik((a) => !a)}
                    aria-expanded={aciklamaAcik}
                    className="mt-1 rounded text-sm text-link underline"
                  >
                    {aciklamaAcik ? 'Daha az göster' : 'Tamamını göster'}
                  </button>
                )}
              </div>
            )}

            {ayrintilar.length > 0 && (
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-3">{ayrintilar}</p>
            )}

            {!kompakt && gorev.assignee_note && mod !== 'not' && (
              <blockquote className="mt-2 border-l-2 border-line-strong pl-3 text-sm text-ink-2">
                <p className="whitespace-pre-line">
                  <span className="font-medium text-ink">Not:</span> {gorev.assignee_note}
                </p>
              </blockquote>
            )}
          </div>

          {ikincilVar && mod === 'goster' && (
            <div className="mt-2 flex flex-wrap gap-1 sm:-ml-3">
              {notYazabilir && (
                <Button variant="ghost" disabled={bekliyor} onClick={() => setMod('not')} aria-label={`${gorev.assignee_note ? 'Notu düzenle' : 'Not yaz'}: ${gorev.title}`}>
                  {gorev.assignee_note ? 'Notu düzenle' : 'Not yaz'}
                </Button>
              )}
              {yonetebilir && (
                <>
                  <Button variant="ghost" disabled={bekliyor} onClick={() => setMod('duzenle')} aria-label={`Düzenle: ${gorev.title}`}>
                    Düzenle
                  </Button>
                  <Button variant="ghost" disabled={bekliyor} onClick={() => setMod('sil')} aria-label={`Sil: ${gorev.title}`}>
                    Sil
                  </Button>
                </>
              )}
            </div>
          )}

          {mod === 'not' && (
            <GorevNotFormu
              baslangic={gorev.assignee_note ?? ''}
              bekliyor={bekliyor}
              onKaydet={(metin) => calistir(() => gorevNotu(gorev.id, metin), () => setMod('goster'))}
              onVazgec={() => {
                setHata(null);
                setMod('goster');
              }}
            />
          )}

          {mod === 'sil' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              <p className="mr-auto">“{gorev.title}” silinsin mi? Bu işlem geri alınamaz.</p>
              <Button variant="danger" disabled={bekliyor} onClick={() => calistir(() => gorevSil(gorev.id))}>
                Evet, sil
              </Button>
              <Button
                variant="secondary"
                disabled={bekliyor}
                onClick={() => {
                  setHata(null);
                  setMod('goster');
                }}
              >
                Vazgeç
              </Button>
            </div>
          )}

          {hata && (
            <Uyari tone="tehlike" className="mt-3">
              {hata}
            </Uyari>
          )}
        </div>
      </div>
    </li>
  );
}

function GorevNotFormu({
  baslangic,
  bekliyor,
  onKaydet,
  onVazgec,
}: {
  baslangic: string;
  bekliyor: boolean;
  onKaydet: (metin: string) => void;
  onVazgec: () => void;
}) {
  const [metin, setMetin] = useState(baslangic);
  const id = useId();

  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onKaydet(metin);
      }}
    >
      <Alan etiket="Notunuz" htmlFor={id} yardim="Örneğin: hesap TRUBA’da bitti, iş no 12345.">
        <textarea
          id={id}
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          maxLength={2000}
          rows={3}
          autoFocus
          className={textareaSinifi}
        />
      </Alan>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={bekliyor}>
          {bekliyor ? 'Kaydediliyor...' : 'Notu kaydet'}
        </Button>
        <Button variant="ghost" disabled={bekliyor} onClick={onVazgec}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}

function GorevDuzenleFormu({
  gorev,
  onBitti,
  onVazgec,
}: {
  gorev: GroupTask;
  onBitti: () => void;
  onVazgec: () => void;
}) {
  const router = useRouter();
  const [bekliyor, basla] = useTransition();
  const [baslik, setBaslik] = useState(gorev.title);
  const [aciklama, setAciklama] = useState(gorev.description ?? '');
  const [sonTarih, setSonTarih] = useState(gorev.due_date ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const baslikId = useId();
  const aciklamaId = useId();
  const tarihId = useId();

  return (
    <form
      className="space-y-4 rounded-xl border border-line bg-paper p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!baslik.trim()) {
          setHata('Görevin adını yazın.');
          return;
        }
        setHata(null);
        basla(async () => {
          const sonuc = await gorevDuzenle(gorev.id, { title: baslik, description: aciklama, due_date: sonTarih });
          if (!sonuc.ok) {
            setHata(sonuc.error);
            return;
          }
          onBitti();
          router.refresh();
        });
      }}
    >
      {hata && <Uyari tone="tehlike">{hata}</Uyari>}

      <Alan etiket="Görev" htmlFor={baslikId}>
        <input id={baslikId} type="text" required maxLength={200} value={baslik} onChange={(e) => setBaslik(e.target.value)} className={inputSinifi} />
      </Alan>

      <Alan etiket="Açıklama" htmlFor={aciklamaId}>
        <textarea id={aciklamaId} rows={3} maxLength={5000} value={aciklama} onChange={(e) => setAciklama(e.target.value)} className={textareaSinifi} />
      </Alan>

      <Alan etiket="Son tarih" htmlFor={tarihId} yardim="Boş bırakırsanız son tarih olmaz.">
        <input id={tarihId} type="date" value={sonTarih} onChange={(e) => setSonTarih(e.target.value)} className={cn(inputSinifi, 'sm:max-w-56')} />
      </Alan>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={bekliyor}>
          {bekliyor ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        <Button variant="ghost" disabled={bekliyor} onClick={onVazgec}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
