'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, CalendarPlus, Download, FileText, Pencil, Plus, Trash2, User } from 'lucide-react';
import { BosDurum, Button, Panel, Rozet, SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { ToplantiFormu, type DuzenlenenToplanti, type KayitSonucu } from '@/components/takvim/ToplantiFormu';
import { saatMetni } from '@/components/takvim/takvimYardim';
import { toplantiBitisi } from '@/lib/toplanti';
import { gunISO, kisaTarih, tarih } from '@/lib/zaman';
import type { ProfileSummary } from '@/types/database';
import { toplantiSil } from './actions';

export interface ToplantiKaydi {
  id: string;
  title: string;
  meeting_date: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  presentation_url: string | null;
  creator_id: string;
  created_at: string;
  creator?: ProfileSummary | null;
}

/** "16 Ekim 2026, 10:00–11:00" */
function zamanMetni(m: ToplantiKaydi): string {
  return `${tarih(m.meeting_date)}, ${saatMetni(m.meeting_date)}–${saatMetni(toplantiBitisi(m))}`;
}

function KayitKarti({
  m,
  yonetebilir,
  islemde,
  onDuzenle,
  onSil,
}: {
  m: ToplantiKaydi;
  yonetebilir: boolean;
  islemde: boolean;
  onDuzenle: (m: ToplantiKaydi) => void;
  onSil: (id: string) => void;
}) {
  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Rozet tone="bilgi">{zamanMetni(m)}</Rozet>

        <div className="flex items-center gap-2 text-sm text-ink-3">
          Kayıt: {kisaTarih(m.created_at)}
          {yonetebilir && (
            <button
              type="button"
              onClick={() => onSil(m.id)}
              disabled={islemde}
              className="p-1 text-ink-3 transition hover:text-danger disabled:opacity-50"
              title="Sil"
              aria-label="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ink">{m.title}</h3>
        {m.location && <p className="mt-1 text-sm text-ink-2">Yer: {m.location}</p>}
        {m.notes && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2">{m.notes}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/toplantilar/${m.id}/toplanti.ics`}
          download
          className={buttonClass({ variant: 'secondary', size: 'sm' })}
          title="Bu toplantıyı kendi takviminize ekleyin (.ics dosyası)"
        >
          <CalendarPlus className="size-4" />
          Takvime ekle
        </a>
        {m.presentation_url && (
          <a
            href={m.presentation_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            <FileText className="size-4" />
            Sunum dosyası
            <Download className="size-3.5 text-ink-3" />
          </a>
        )}
        <Button variant="ghost" size="sm" onClick={() => onDuzenle(m)} disabled={islemde}>
          <Pencil className="size-4" />
          Düzenle
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3 text-sm text-ink-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{m.creator?.full_name || 'Grup üyesi'}</span>
        </div>
      </div>
    </Panel>
  );
}

interface ToplantilarIstemciProps {
  /** meeting_date'e göre artan sıralı. */
  kayitlar: ToplantiKaydi[];
  /** Sunucuda alınan an; yaklaşan/geçmiş ayrımı bu anla yapılır (hydration uyumu için). */
  simdi: string;
  benId: string;
  yonetebilir: boolean;
}

export function ToplantilarIstemci({ kayitlar, simdi, benId, yonetebilir }: ToplantilarIstemciProps) {
  const router = useRouter();
  const simdiMs = Date.parse(simdi);
  // Bitmemiş toplantı (şu an süren dahil) yaklaşanlarda kalır.
  const yaklasan = kayitlar.filter((m) => Date.parse(toplantiBitisi(m)) >= simdiMs);
  const gecmis = kayitlar.filter((m) => Date.parse(toplantiBitisi(m)) < simdiMs).reverse();

  const [form, setForm] = useState<{ mevcut?: DuzenlenenToplanti } | null>(null);
  const [bildirim, setBildirim] = useState<string | null>(null);
  const [silHata, setSilHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  // Herkes ekler ve düzenler; silme ekleyen, hoca veya yöneticide.
  const duzenleyebilir = (m: ToplantiKaydi) => m.creator_id === benId || yonetebilir;

  function kaydedildi(sonuc: KayitSonucu) {
    setForm(null);
    setBildirim(sonuc.mesaj);
    router.refresh();
  }

  function handleSil(id: string) {
    if (!confirm('Bu toplantıyı silmek istediğinize emin misiniz? Gelecekteki bir toplantıysa Telegram grubuna iptal mesajı gider.')) return;
    setSilHata(null);
    setBildirim(null);
    startTransition(async () => {
      const sonuc = await toplantiSil(id);
      if (!sonuc.ok) setSilHata(sonuc.error);
      else setBildirim('Toplantı silindi.');
    });
  }

  const kart = (m: ToplantiKaydi) => (
    <KayitKarti
      key={m.id}
      m={m}
      yonetebilir={duzenleyebilir(m)}
      islemde={islemde}
      onDuzenle={(k) => {
        setBildirim(null);
        setForm({ mevcut: k });
      }}
      onSil={handleSil}
    />
  );

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Toplantılar"
        aciklama="Haftalık grup toplantısı notları, seminer sunumları, TRUBA değerlendirmeleri ve alınan kararlar."
        eylemler={
          <>
            <Link href="/takvim" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              <CalendarDays className="h-4 w-4" />
              <span>Takvimde gör</span>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setBildirim(null);
                setForm({});
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Toplantı ekle</span>
            </Button>
          </>
        }
      />

      {bildirim && <Uyari tone="basari">{bildirim}</Uyari>}
      {silHata && <Uyari tone="tehlike">{silHata}</Uyari>}

      {kayitlar.length === 0 ? (
        <BosDurum
          baslik="Henüz toplantı yok."
          aciklama="İlk toplantıyı ekleyerek başlayabilirsiniz."
        />
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="yaklasan-baslik">
            <h2 id="yaklasan-baslik" className="text-lg font-semibold text-ink">
              Yaklaşan toplantılar
            </h2>
            {yaklasan.length === 0 ? <p className="text-sm text-ink-3">Yaklaşan toplantı yok.</p> : yaklasan.map(kart)}
          </section>

          <section className="space-y-4" aria-labelledby="gecmis-baslik">
            <h2 id="gecmis-baslik" className="text-lg font-semibold text-ink">
              Geçmiş toplantılar
            </h2>
            {gecmis.length === 0 ? <p className="text-sm text-ink-3">Geçmiş toplantı yok.</p> : gecmis.map(kart)}
          </section>
        </>
      )}

      {form && (
        <ToplantiFormu
          mevcut={form.mevcut}
          varsayilanGun={gunISO(simdi)}
          onKapat={() => setForm(null)}
          onKaydedildi={kaydedildi}
        />
      )}
    </div>
  );
}
