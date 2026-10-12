'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { BosDurum, Button, Rozet, SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { TakvimAboneligi } from '@/components/takvim/TakvimAboneligi';
import { EtkinlikFormu, type EklemeSonucu } from '@/components/takvim/EtkinlikFormu';
import { GunDetayi } from '@/components/takvim/GunDetayi';
import {
  ETIKET_SINIFI,
  GOREV_DURUM_ETIKETI,
  HAFTA_GUNLERI,
  TUR_ETIKETI,
  ayAdi,
  ayEkle,
  ayHaftalari,
  gecikmisMi,
  gunBasligi,
  kisaAyAdi,
  ogeTonu,
  ogeZamani,
  saatMetni,
} from '@/components/takvim/takvimYardim';
import { cn } from '@/lib/cn';
import { kisaAd } from '@/lib/etiketler';
import { sonTarihMetni } from '@/lib/zaman';
import type { TakvimOgesi } from '@/types/database';
import { toplantiSil } from '@/app/toplantilar/actions';
import { etkinlikSil } from './actions';

const HUCRE_ETIKET_SAYISI = 3;

interface TakvimIstemciProps {
  ogeler: TakvimOgesi[];
  /** Gösterilen ay, YYYY-MM. */
  ay: string;
  /** Sunucudaki bugün (İstanbul), YYYY-MM-DD. Hydration uyumu için tarayıcı saati kullanılmaz. */
  bugun: string;
  /** Hoca veya yönetici: görevleri düzenler, grup toplantısı ekler. */
  yonetebilir: boolean;
  /** Kişinin abonelik anahtarı; sunucu hazırlayamadıysa null. */
  takvimAnahtari: string | null;
}

/** Izgaradaki tek etiket: "14:00 Ad", görevde "✓ A. Yılmaz: Ad". */
function EtiketMetni({ o }: { o: TakvimOgesi }) {
  if (o.tur === 'gorev') {
    const kisi = o.sorumluAd ? `${kisaAd(o.sorumluAd)}: ` : '';
    return (
      <>
        {o.gorevDurum === 'tamamlandi' && <span aria-hidden>✓ </span>}
        {kisi}
        {o.baslik}
      </>
    );
  }
  return (
    <>
      {!o.tumGun && <span className="tabular-nums">{saatMetni(o.baslangic)} </span>}
      {o.baslik}
    </>
  );
}

/** Fare üstüne gelince çıkan tam metin. Renge ek olarak durumu metinle de söyler. */
function etiketBasligi(o: TakvimOgesi, bugun: string): string {
  if (o.tur !== 'gorev') return `${TUR_ETIKETI[o.tur]}: ${o.baslik} (${ogeZamani(o)})`;
  const kisi = o.sorumluAd ? `, ${o.sorumluAd}` : '';
  const durum = o.gorevDurum ? `, ${GOREV_DURUM_ETIKETI[o.gorevDurum].toLowerCase()}` : '';
  const gecikme = gecikmisMi(o, bugun) ? `, ${sonTarihMetni(o.gun, bugun)}` : '';
  return `Görev: ${o.baslik}${kisi}${durum}${gecikme}`;
}

/** Telefon listesinde görevin altına yazılan durum metni; açık ve zamanında ise boş. */
function gorevDurumMetni(o: TakvimOgesi, bugun: string): { metin: string; uyari: boolean } | null {
  if (o.tur !== 'gorev') return null;
  if (gecikmisMi(o, bugun)) return { metin: sonTarihMetni(o.gun, bugun), uyari: true };
  if (o.gorevDurum && o.gorevDurum !== 'acik') return { metin: GOREV_DURUM_ETIKETI[o.gorevDurum], uyari: false };
  return null;
}

/** Telefondaki gün listesinin tek satırı. */
function TelefonSatiri({ o, bugun, onAc }: { o: TakvimOgesi; bugun: string; onAc: () => void }) {
  const durum = gorevDurumMetni(o, bugun);
  return (
    <button type="button" onClick={onAc} className="flex min-h-12 w-full items-start gap-3 py-3 text-left hover:bg-sunken/60">
      <span className="w-20 shrink-0 text-sm tabular-nums text-ink-3">{ogeZamani(o)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base text-ink">{o.baslik}</span>
        {o.tur === 'gorev' && o.sorumluAd && <span className="block text-sm text-ink-3">{o.sorumluAd}</span>}
        {o.yer && <span className="block text-sm text-ink-3">{o.yer}</span>}
        {durum && <span className={cn('block text-sm', durum.uyari ? 'text-warn' : 'text-ink-3')}>{durum.metin}</span>}
      </span>
      <Rozet tone={ogeTonu(o, bugun)}>{TUR_ETIKETI[o.tur]}</Rozet>
    </button>
  );
}

export function TakvimIstemci({ ogeler, ay, bugun, yonetebilir, takvimAnahtari }: TakvimIstemciProps) {
  const router = useRouter();
  const [acikGun, setAcikGun] = useState<string | null>(null);
  const [formGunu, setFormGunu] = useState<string | null>(null);
  const [bildirim, setBildirim] = useState<{ mesaj: string; ay: string } | null>(null);
  const [silHatasi, setSilHatasi] = useState<string | null>(null);
  const [silmede, silBasla] = useTransition();

  const haftalar = useMemo(() => ayHaftalari(ay), [ay]);

  const gunlereGore = useMemo(() => {
    const harita = new Map<string, TakvimOgesi[]>();
    for (const o of ogeler) {
      const liste = harita.get(o.gun);
      if (liste) liste.push(o);
      else harita.set(o.gun, [o]);
    }
    return harita;
  }, [ogeler]);

  // Telefonda yalnız kaydı olan günler listelenir, tarih sırasıyla.
  const kayitliGunler = useMemo(() => [...gunlereGore.keys()].filter((g) => g.startsWith(ay)).sort(), [gunlereGore, ay]);

  const varsayilanGun = bugun.startsWith(ay) ? bugun : `${ay}-01`;

  function gunAc(gun: string) {
    setSilHatasi(null);
    setAcikGun(gun);
  }

  function detaydanEkle(gun: string) {
    setAcikGun(null);
    setFormGunu(gun);
  }

  function eklendi(sonuc: EklemeSonucu) {
    const hedefAy = sonuc.gun.slice(0, 7);
    setFormGunu(null);
    setBildirim({ mesaj: sonuc.mesaj, ay: hedefAy });
    // Başka bir aya eklendiyse o aya geçilir ki kayıt görünsün.
    if (hedefAy !== ay) router.push(`/takvim?ay=${hedefAy}`);
    else router.refresh();
  }

  function sil(o: TakvimOgesi) {
    const soru = o.tur === 'toplanti' ? 'Bu toplantıyı silmek istiyor musunuz?' : 'Bu etkinliği silmek istiyor musunuz?';
    if (!window.confirm(`${soru}\n\n${o.baslik}`)) return;
    setSilHatasi(null);
    setBildirim(null);
    silBasla(async () => {
      const sonuc = o.tur === 'toplanti' ? await toplantiSil(o.kayitId) : await etkinlikSil(o.kayitId);
      if (!sonuc.ok) {
        setSilHatasi(sonuc.error);
        return;
      }
      setBildirim({ mesaj: o.tur === 'toplanti' ? 'Toplantı silindi.' : 'Etkinlik silindi.', ay });
      router.refresh();
    });
  }

  const acikGunOgeleri = acikGun ? (gunlereGore.get(acikGun) ?? []) : [];

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Takvim"
        aciklama="Toplantılar, etkinlikler ve görev son tarihleri tek yerde."
        eylemler={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setBildirim(null);
              setFormGunu(varsayilanGun);
            }}
          >
            <Plus className="size-4" />
            Etkinlik ekle
          </Button>
        }
      />

      {bildirim?.ay === ay && <Uyari tone="basari">{bildirim.mesaj}</Uyari>}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink" aria-live="polite">
            {ayAdi(ay)}
          </h2>
          <nav aria-label="Ay seçimi" className="flex items-center gap-2">
            <Link
              href={`/takvim?ay=${ayEkle(ay, -1)}`}
              aria-label="Önceki ay"
              className={buttonClass({ variant: 'secondary', size: 'md' })}
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Önceki</span>
            </Link>
            <Link href="/takvim" className={buttonClass({ variant: 'secondary', size: 'md' })}>
              Bugün
            </Link>
            <Link
              href={`/takvim?ay=${ayEkle(ay, 1)}`}
              aria-label="Sonraki ay"
              className={buttonClass({ variant: 'secondary', size: 'md' })}
            >
              <span className="hidden sm:inline">Sonraki</span>
              <ChevronRight className="size-4" />
            </Link>
          </nav>
        </div>

        {/* Ay ızgarası: md ve üstü */}
        <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
          <table className="w-full table-fixed border-collapse">
            <caption className="sr-only">{ayAdi(ay)} takvimi. Bir güne basarak o günün kayıtlarını açın.</caption>
            <thead>
              <tr>
                {HAFTA_GUNLERI.map((g, i) => (
                  <th
                    key={g}
                    scope="col"
                    className={cn(
                      'bg-sunken px-3 py-2 text-left text-sm font-medium text-ink-2',
                      i > 0 && 'border-l border-line',
                    )}
                  >
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {haftalar.map((hafta) => (
                <tr key={hafta[0]}>
                  {hafta.map((gun, i) => {
                    const buAyda = gun.startsWith(ay);
                    const bugunMu = gun === bugun;
                    const liste = gunlereGore.get(gun) ?? [];
                    const gorunen = liste.slice(0, HUCRE_ETIKET_SAYISI);
                    const fazla = liste.length - gorunen.length;
                    const gunNo = Number(gun.slice(8));

                    return (
                      <td
                        key={gun}
                        // Boş yere basmak da günü açar; klavye ve ekran okuyucu için aşağıdaki düğmeler var.
                        onClick={() => gunAc(gun)}
                        className={cn(
                          'h-32 cursor-pointer align-top border-t border-line p-1.5 hover:bg-sunken/60',
                          i > 0 && 'border-l',
                          !buAyda && 'bg-sunken/50',
                        )}
                      >
                        <div className="flex flex-col items-stretch gap-1">
                          <button
                            type="button"
                            onClick={() => gunAc(gun)}
                            aria-label={`${gunBasligi(gun)}${liste.length ? `, ${liste.length} kayıt` : ''}`}
                            aria-current={bugunMu ? 'date' : undefined}
                            className={cn(
                              'inline-flex h-8 min-w-8 items-center justify-center self-start rounded-full px-2 text-sm tabular-nums',
                              bugunMu
                                ? 'bg-primary font-semibold text-on-primary'
                                : buAyda
                                  ? 'text-ink hover:bg-sunken'
                                  : 'text-ink-3 hover:bg-sunken',
                            )}
                          >
                            {gunNo === 1 ? `1 ${kisaAyAdi(gun)}` : gunNo}
                          </button>

                          {gorunen.map((o) => (
                            <button
                              key={o.anahtar}
                              type="button"
                              onClick={() => gunAc(gun)}
                              title={etiketBasligi(o, bugun)}
                              className={cn(
                                'block w-full truncate rounded px-1.5 py-1 text-left text-xs leading-4 hover:ring-1 hover:ring-current lg:text-sm',
                                ETIKET_SINIFI[ogeTonu(o, bugun)],
                              )}
                            >
                              <span className="sr-only">
                                {TUR_ETIKETI[o.tur]}
                                {gecikmisMi(o, bugun) ? ', gecikmiş' : ''}:{' '}
                              </span>
                              <EtiketMetni o={o} />
                            </button>
                          ))}

                          {fazla > 0 && (
                            <button
                              type="button"
                              onClick={() => gunAc(gun)}
                              className="self-start rounded px-1.5 py-0.5 text-sm text-ink-2 hover:text-ink hover:underline"
                            >
                              +{fazla} daha
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gün gün liste: telefon */}
        <div className="space-y-6 md:hidden">
          {kayitliGunler.length === 0 ? (
            <BosDurum
              baslik="Bu ayda kayıt yok."
              aciklama="Etkinlik veya toplantı eklemek için sayfanın üstündeki düğmeyi kullanın."
            />
          ) : (
            kayitliGunler.map((gun) => (
              <section key={gun} aria-label={gunBasligi(gun)}>
                <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-ink">
                  {gunBasligi(gun)}
                  {gun === bugun && <Rozet tone="bilgi">Bugün</Rozet>}
                </h3>
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {(gunlereGore.get(gun) ?? []).map((o) => (
                    <li key={o.anahtar}>
                      <TelefonSatiri o={o} bugun={bugun} onAc={() => gunAc(gun)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>

      <TakvimAboneligi token={takvimAnahtari} />

      {acikGun && (
        <GunDetayi
          gun={acikGun}
          ogeler={acikGunOgeleri}
          bugun={bugun}
          yonetebilir={yonetebilir}
          islemde={silmede}
          hata={silHatasi}
          onSil={sil}
          onEkle={detaydanEkle}
          onKapat={() => setAcikGun(null)}
        />
      )}

      {formGunu && (
        <EtkinlikFormu
          varsayilanGun={formGunu}
          toplantiEkleyebilir={yonetebilir}
          onKapat={() => setFormGunu(null)}
          onEklendi={eklendi}
        />
      )}
    </div>
  );
}
