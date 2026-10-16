'use client';

import React, { useMemo, useState } from 'react';
import { BasHarfAvatar, BosDurum, Button, Panel, SayfaBasligi, Uyari } from '@/components/ui';
import { GorevFormu, type KisiSecenegi, type ToplantiSecenegi } from '@/components/gorevler/GorevFormu';
import { GorevSatiri } from '@/components/gorevler/GorevSatiri';
import { kisiyeGoreGrupla, siralaGorevler } from '@/components/gorevler/yardimci';
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
  const [gorunum, setGorunum] = useState<Gorunum>(hocaMi ? 'kisi' : 'liste');
  const [formAcik, setFormAcik] = useState(formAcikBaslasin);
  const [mesaj, setMesaj] = useState<string | null>(null);

  // Görevi olmayan hoca dışındakiler önce kendi görevlerini görür.
  const benimBolumu = !hocaMi;

  // Görevler yalnız yazılı liste: teslim/onay adımı ve durum filtresi yok.
  const veri = useMemo(() => {
    const benim = benimBolumu ? siralaGorevler(gorevler.filter((g) => g.assignee_id === benId)) : [];
    const digerleri = benimBolumu ? gorevler.filter((g) => g.assignee_id !== benId) : gorevler;
    return {
      benim,
      digerleri: siralaGorevler(digerleri),
      kisiGruplari: kisiyeGoreGrupla(digerleri),
    };
  }, [gorevler, benimBolumu, benId]);

  const satir = (g: GroupTask, kisiGoster: boolean) => (
    <GorevSatiri key={g.id} gorev={g} benId={benId} yonetebilir={yonetebilir} bugun={bugun} kisiGoster={kisiGoster} />
  );

  const bolumBasligi = hocaMi ? 'Tüm görevler' : 'Grubun görevleri';

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Görevler"
        aciklama="Toplantıda konuşulan görevler, kim ne yapacak. Herkes görebilir."
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
          {benimBolumu && (
            <Panel
              baslik="Benim görevlerim"
              aciklama={veri.benim.length === 0 ? undefined : `${veri.benim.length} görev`}
              govdeSinifi="px-5 py-0 sm:px-6 sm:py-0"
            >
              {veri.benim.length === 0 ? (
                <p className="py-5 text-sm text-ink-2">
                  Size yazılmış görev yok.
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
              <p className="text-sm text-ink-2">Başka görev yok.</p>
            ) : gorunum === 'liste' ? (
              <Panel govdeSinifi="px-5 py-0 sm:px-6 sm:py-0">
                <ul className="divide-y divide-line">{veri.digerleri.map((g) => satir(g, true))}</ul>
              </Panel>
            ) : (
              <div className="space-y-4">
                {veri.kisiGruplari.map((grup) => {
                  const kadro = grup.kadro ? KADRO_ETIKETI[grup.kadro] : null;
                  const sayiMetni = `${grup.gorevler.length} görev`;
                  return (
                    <Panel
                      key={grup.kisiId}
                      baslik={
                        <span className="flex items-center gap-3">
                          <BasHarfAvatar ad={grup.ad} size="sm" />
                          <span>{grup.ad}</span>
                        </span>
                      }
                      aciklama={kadro ? `${kadro}, ${sayiMetni}` : sayiMetni}
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
