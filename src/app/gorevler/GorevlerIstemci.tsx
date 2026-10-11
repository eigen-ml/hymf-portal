'use client';

import React, { useMemo, useState } from 'react';
import { BasHarfAvatar, BosDurum, Button, Panel, Rozet, SayfaBasligi, Uyari } from '@/components/ui';
import { GorevFormu, type KisiSecenegi, type ToplantiSecenegi } from '@/components/gorevler/GorevFormu';
import { GorevSatiri } from '@/components/gorevler/GorevSatiri';
import {
  FILTRELER,
  filtreyeUyuyor,
  kisiSayilari,
  kisiyeGoreGrupla,
  siralaGorevler,
  type GorevFiltresi,
} from '@/components/gorevler/yardimci';
import { cn } from '@/lib/cn';
import { KADRO_ETIKETI } from '@/lib/etiketler';
import type { GroupTask } from '@/types/database';

type Gorunum = 'kisi' | 'liste';

export interface GorevlerIstemciProps {
  gorevler: GroupTask[];
  /** Görev verilebilecek kişiler; yalnız hoca ve yönetici için dolu. */
  kisiler: KisiSecenegi[];
  toplantilar: ToplantiSecenegi[];
  varsayilanToplantiId: string;
  benId: string;
  hocaMi: boolean;
  yonetebilir: boolean;
  bugun: string;
  /** `?yeni=1` ile gelindiyse görev formu açık başlar. */
  formAcikBaslasin: boolean;
}

export function GorevlerIstemci({
  gorevler,
  kisiler,
  toplantilar,
  varsayilanToplantiId,
  benId,
  hocaMi,
  yonetebilir,
  bugun,
  formAcikBaslasin,
}: GorevlerIstemciProps) {
  const [filtre, setFiltre] = useState<GorevFiltresi>('guncel');
  const [gorunum, setGorunum] = useState<Gorunum>(hocaMi ? 'kisi' : 'liste');
  const [formAcik, setFormAcik] = useState(formAcikBaslasin);
  const [mesaj, setMesaj] = useState<string | null>(null);

  // Görevi olmayan hoca dışındakiler önce kendi görevlerini görür.
  const benimBolumu = !hocaMi;

  const veri = useMemo(() => {
    const sayilar = Object.fromEntries(
      FILTRELER.map((f) => [f.id, gorevler.filter((g) => filtreyeUyuyor(g, f.id, bugun)).length])
    ) as Record<GorevFiltresi, number>;
    const filtreli = gorevler.filter((g) => filtreyeUyuyor(g, filtre, bugun));
    const benim = benimBolumu ? siralaGorevler(filtreli.filter((g) => g.assignee_id === benId)) : [];
    const digerleri = benimBolumu ? filtreli.filter((g) => g.assignee_id !== benId) : filtreli;
    return {
      sayilar,
      benim,
      digerleri: siralaGorevler(digerleri),
      kisiGruplari: kisiyeGoreGrupla(digerleri),
      kisiBasina: kisiSayilari(gorevler, bugun),
      teslimSayisi: gorevler.filter((g) => g.status === 'teslim_edildi').length,
    };
  }, [gorevler, filtre, bugun, benimBolumu, benId]);

  const satir = (g: GroupTask, kisiGoster: boolean) => (
    <GorevSatiri key={g.id} gorev={g} benId={benId} yonetebilir={yonetebilir} bugun={bugun} kisiGoster={kisiGoster} />
  );

  const bolumBasligi = hocaMi ? 'Tüm görevler' : 'Grubun görevleri';

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Görevler"
        aciklama="Haftalık toplantıda verilen görevler. Herkes görebilir."
        eylemler={
          yonetebilir && !formAcik ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setMesaj(null);
                setFormAcik(true);
              }}
            >
              Görev ver
            </Button>
          ) : undefined
        }
      />

      {mesaj && <Uyari tone="basari">{mesaj}</Uyari>}

      {yonetebilir && formAcik && (
        <GorevFormu
          kisiler={kisiler}
          toplantilar={toplantilar}
          varsayilanToplantiId={varsayilanToplantiId}
          bugun={bugun}
          onBitti={(m) => {
            setMesaj(m);
            setFormAcik(false);
          }}
          onVazgec={() => setFormAcik(false)}
        />
      )}

      {gorevler.length === 0 ? (
        <BosDurum
          baslik="Henüz görev verilmedi"
          aciklama={
            yonetebilir
              ? 'Haftalık toplantıdan sonra “Görev ver” ile ilk görevi ekleyin.'
              : 'Size görev verildiğinde burada görünür.'
          }
        />
      ) : (
        <>
          {yonetebilir && veri.teslimSayisi > 0 && filtre !== 'teslim_edildi' && (
            <Uyari tone="bilgi">
              <div className="flex flex-wrap items-center gap-3">
                <p className="mr-auto font-medium">{veri.teslimSayisi} görev teslim edildi, onayınızı bekliyor.</p>
                <Button variant="secondary" onClick={() => setFiltre('teslim_edildi')}>
                  Göster
                </Button>
              </div>
            </Uyari>
          )}

          <div role="group" aria-label="Duruma göre göster" className="flex flex-wrap gap-2">
            {FILTRELER.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtre === f.id}
                onClick={() => setFiltre(f.id)}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold',
                  filtre === f.id
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : 'border-line-strong bg-surface text-ink-2 hover:bg-sunken hover:text-ink'
                )}
              >
                {f.etiket}
                <span className="tabular-nums">{veri.sayilar[f.id]}</span>
              </button>
            ))}
          </div>

          {benimBolumu && (
            <Panel
              baslik="Benim görevlerim"
              aciklama={veri.benim.length === 0 ? undefined : `${veri.benim.length} görev`}
              govdeSinifi="px-5 py-0 sm:px-6 sm:py-0"
            >
              {veri.benim.length === 0 ? (
                <p className="py-5 text-sm text-ink-2">
                  {filtre === 'guncel' ? 'Size verilmiş açık görev yok.' : 'Bu seçimde size ait görev yok.'}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line border-t border-line">{veri.benim.map((g) => satir(g, false))}</ul>
              )}
            </Panel>
          )}

          <section className="space-y-4" aria-label={bolumBasligi}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">{bolumBasligi}</h2>
              <div role="group" aria-label="Görünüm" className="inline-flex rounded-lg bg-sunken p-1">
                {(
                  [
                    { id: 'kisi', etiket: 'Kişiye göre' },
                    { id: 'liste', etiket: 'Liste' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={gorunum === g.id}
                    onClick={() => setGorunum(g.id)}
                    className={cn(
                      'min-h-9 rounded-lg px-3.5 text-sm font-semibold',
                      gorunum === g.id ? 'bg-surface text-ink shadow-panel' : 'text-ink-2 hover:text-ink'
                    )}
                  >
                    {g.etiket}
                  </button>
                ))}
              </div>
            </div>

            {veri.digerleri.length === 0 ? (
              <p className="text-sm text-ink-2">{filtre === 'guncel' ? 'Şu an bekleyen görev yok.' : 'Bu seçimde görev yok.'}</p>
            ) : gorunum === 'liste' ? (
              <Panel govdeSinifi="px-5 py-0 sm:px-6 sm:py-0">
                <ul className="divide-y divide-line">{veri.digerleri.map((g) => satir(g, true))}</ul>
              </Panel>
            ) : (
              <div className="space-y-4">
                {veri.kisiGruplari.map((grup) => {
                  const sayi = veri.kisiBasina.get(grup.kisiId) ?? { bekleyen: 0, teslim: 0, gecikmis: 0 };
                  const kadro = grup.kadro ? KADRO_ETIKETI[grup.kadro] : null;
                  const bekleyenMetni = sayi.bekleyen === 0 ? 'bekleyen görev yok' : `${sayi.bekleyen} bekleyen görev`;
                  return (
                    <Panel
                      key={grup.kisiId}
                      baslik={
                        <span className="flex items-center gap-3">
                          <BasHarfAvatar ad={grup.ad} size="sm" />
                          <span>{grup.ad}</span>
                        </span>
                      }
                      aciklama={kadro ? `${kadro}, ${bekleyenMetni}` : bekleyenMetni.charAt(0).toLocaleUpperCase('tr-TR') + bekleyenMetni.slice(1)}
                      eylemler={sayi.teslim > 0 ? <Rozet tone="inceleme">{sayi.teslim} teslim edildi</Rozet> : undefined}
                      govdeSinifi="px-5 py-0 sm:px-6 sm:py-0"
                    >
                      <ul className="mt-3 divide-y divide-line border-t border-line">{grup.gorevler.map((g) => satir(g, false))}</ul>
                    </Panel>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
