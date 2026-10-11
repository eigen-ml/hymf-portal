'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { CalendarDays, Download, FileText, Plus, Trash2, User } from 'lucide-react';
import { BosDurum, Button, Panel, Rozet, SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { kisaTarih, tarihSaat } from '@/lib/zaman';
import type { ProfileSummary } from '@/types/database';
import { toplantiEkle, toplantiSil } from './actions';

export interface ToplantiKaydi {
  id: string;
  title: string;
  meeting_date: string;
  notes: string | null;
  presentation_url: string | null;
  creator_id: string;
  created_at: string;
  creator?: ProfileSummary | null;
}

function KayitKarti({
  m,
  silebilir,
  islemde,
  onSil,
}: {
  m: ToplantiKaydi;
  silebilir: boolean;
  islemde: boolean;
  onSil: (id: string) => void;
}) {
  return (
    <Panel className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Rozet tone="bilgi">{tarihSaat(m.meeting_date)}</Rozet>

        <div className="flex items-center gap-2 text-sm text-ink-3">
          Kayıt: {kisaTarih(m.created_at)}
          {silebilir && (
            <button
              type="button"
              onClick={() => onSil(m.id)}
              disabled={islemde}
              className="text-ink-3 hover:text-danger transition p-1 disabled:opacity-50"
              title="Sil"
              aria-label="Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-ink">{m.title}</h3>
        {m.notes && <p className="text-sm text-ink-2 mt-2 leading-relaxed whitespace-pre-line">{m.notes}</p>}
      </div>

      {m.presentation_url && (
        <div className="pt-2">
          <a
            href={m.presentation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sunken hover:bg-sunken/80 text-ink text-sm font-medium transition"
          >
            <FileText className="w-4 h-4" />
            <span>Sunum dosyasını indir</span>
            <Download className="w-3.5 h-3.5 text-ink-3" />
          </a>
        </div>
      )}

      <div className="pt-3 border-t border-line flex items-center justify-between text-sm text-ink-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
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

const BASLIK_MAX = 200;
const NOT_MAX = 5000;
const TEKRAR_MAX = 20;
const inputSinifi =
  'w-full px-3 py-2 bg-sunken border border-control rounded-md text-ink placeholder-ink-3 focus:outline-none focus-visible:border-link focus-visible:ring-2 focus-visible:ring-link/30';

export function ToplantilarIstemci({ kayitlar, simdi, benId, yonetebilir }: ToplantilarIstemciProps) {
  const simdiMs = Date.parse(simdi);
  const yaklasan = kayitlar.filter((m) => Date.parse(m.meeting_date) >= simdiMs);
  const gecmis = kayitlar.filter((m) => Date.parse(m.meeting_date) < simdiMs).reverse();

  const [modalAcik, setModalAcik] = useState(false);
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [tekrarHafta, setTekrarHafta] = useState('0');
  const [formHata, setFormHata] = useState<string | null>(null);
  const [silHata, setSilHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  // Yardım metni için: geçerli ve 1'den büyükse kaç hafta ekleneceği, değilse 0.
  const tekrarSayisi = Number(tekrarHafta);
  const tekrarOnizleme = Number.isInteger(tekrarSayisi) && tekrarSayisi >= 1 && tekrarSayisi <= TEKRAR_MAX ? tekrarSayisi : 0;

  function formuSifirla() {
    setTitle('');
    setMeetingDate('');
    setNotes('');
    setPresentationUrl('');
    setTekrarHafta('0');
    setFormHata(null);
  }

  function modaliKapat() {
    setModalAcik(false);
    setFormHata(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormHata(null);

    const baslik = title.trim();
    if (!baslik) {
      setFormHata('Toplantı başlığı zorunludur.');
      return;
    }
    if (baslik.length > BASLIK_MAX) {
      setFormHata(`Başlık ${BASLIK_MAX} karakteri aşamaz.`);
      return;
    }
    if (!meetingDate || Number.isNaN(Date.parse(meetingDate))) {
      setFormHata('Geçerli bir tarih ve saat seçin.');
      return;
    }
    if (notes.trim().length > NOT_MAX) {
      setFormHata(`Notlar ${NOT_MAX} karakteri aşamaz.`);
      return;
    }
    const url = presentationUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      setFormHata('Sunum bağlantısı http:// veya https:// ile başlamalıdır.');
      return;
    }

    const tekrar = Number(tekrarHafta === '' ? '0' : tekrarHafta);
    if (!Number.isInteger(tekrar) || tekrar < 0 || tekrar > TEKRAR_MAX) {
      setFormHata(`Tekrar sayısı 0 ile ${TEKRAR_MAX} arasında bir tam sayı olmalıdır.`);
      return;
    }

    // Saat her zaman İstanbul saati olarak yorumlanır (yurt dışındaki tarayıcıda da kaymasın).
    const meeting_date = new Date(`${meetingDate.length === 16 ? meetingDate + ':00' : meetingDate}+03:00`).toISOString();

    startTransition(async () => {
      const sonuc = await toplantiEkle({
        title: baslik,
        meeting_date,
        notes: notes.trim(),
        presentation_url: url,
        tekrar_hafta: tekrar,
      });
      if (!sonuc.ok) {
        setFormHata(sonuc.error);
        return;
      }
      formuSifirla();
      setModalAcik(false);
    });
  }

  function handleSil(id: string) {
    if (!confirm('Bu toplantı kaydını silmek istediğinize emin misiniz?')) return;
    setSilHata(null);
    startTransition(async () => {
      const sonuc = await toplantiSil(id);
      if (!sonuc.ok) setSilHata(sonuc.error);
    });
  }

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Toplantılar"
        aciklama="Haftalık grup toplantısı notları, seminer sunumları, TRUBA değerlendirmeleri ve alınan kararlar."
        eylemler={
          <>
            <Link href="/takvim" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
              <CalendarDays className="w-4 h-4" />
              <span>Takvimde gör</span>
            </Link>
            {yonetebilir && (
              <Button variant="primary" size="sm" onClick={() => setModalAcik(true)}>
                <Plus className="w-4 h-4" />
                <span>Toplantı notu ekle</span>
              </Button>
            )}
          </>
        }
      />

      {silHata && <Uyari tone="tehlike">{silHata}</Uyari>}

      {kayitlar.length === 0 ? (
        <BosDurum
          baslik="Henüz toplantı yok."
          aciklama={yonetebilir ? 'İlk toplantı notunu ekleyerek başlayabilirsiniz.' : 'Grup toplantılarını hocalar ve yöneticiler ekler.'}
        />
      ) : (
        <>
          <section className="space-y-4" aria-labelledby="yaklasan-baslik">
            <h2 id="yaklasan-baslik" className="text-lg font-semibold text-ink">
              Yaklaşan toplantılar
            </h2>
            {yaklasan.length === 0 ? (
              <p className="text-sm text-ink-3">Yaklaşan toplantı yok.</p>
            ) : (
              yaklasan.map((m) => <KayitKarti key={m.id} m={m} silebilir={m.creator_id === benId || yonetebilir} islemde={islemde} onSil={handleSil} />)
            )}
          </section>

          <section className="space-y-4" aria-labelledby="gecmis-baslik">
            <h2 id="gecmis-baslik" className="text-lg font-semibold text-ink">
              Geçmiş toplantılar
            </h2>
            {gecmis.length === 0 ? (
              <p className="text-sm text-ink-3">Geçmiş toplantı yok.</p>
            ) : (
              gecmis.map((m) => <KayitKarti key={m.id} m={m} silebilir={m.creator_id === benId || yonetebilir} islemde={islemde} onSil={handleSil} />)
            )}
          </section>
        </>
      )}

      {/* YENİ TOPLANTI EKLEME MODALI */}
      {yonetebilir && modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/80">
          <div className="bg-surface border border-line rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="border-b border-line pb-3">
              <h2 className="text-lg font-semibold text-ink">Toplantı notu / sunumu ekle</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label htmlFor="toplanti-baslik" className="block text-ink font-semibold mb-1">
                  Toplantı başlığı *
                </label>
                <input
                  id="toplanti-baslik"
                  type="text"
                  required
                  maxLength={BASLIK_MAX}
                  placeholder="Örn: 2D manyetik malzemeler semineri"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              <div>
                <label htmlFor="toplanti-tarih" className="block text-ink font-semibold mb-1">
                  Toplantı tarihi ve saati *
                </label>
                <input
                  id="toplanti-tarih"
                  type="datetime-local"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              <div>
                <label htmlFor="toplanti-tekrar" className="block text-ink font-semibold mb-1">
                  Her hafta tekrarla
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="toplanti-tekrar"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={TEKRAR_MAX}
                    step={1}
                    value={tekrarHafta}
                    onChange={(e) => setTekrarHafta(e.target.value)}
                    className={`${inputSinifi} w-24`}
                  />
                  <span className="text-ink-2">hafta</span>
                </div>
                <p className="mt-1 text-ink-3">
                  {tekrarOnizleme >= 1
                    ? `Aynı gün ve saatte ${tekrarOnizleme} hafta daha eklenir, toplam ${tekrarOnizleme + 1} toplantı.`
                    : '0 = tek toplantı'}
                </p>
              </div>

              <div>
                <label htmlFor="toplanti-notlar" className="block text-ink font-semibold mb-1">
                  Toplantı notları / alınan kararlar
                </label>
                <textarea
                  id="toplanti-notlar"
                  rows={4}
                  maxLength={NOT_MAX}
                  placeholder="Gündem maddeleri, tartışılan konular veya alınan kararlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              <div>
                <label htmlFor="toplanti-sunum" className="block text-ink font-semibold mb-1">
                  Sunum bağlantısı (isteğe bağlı)
                </label>
                <input
                  id="toplanti-sunum"
                  type="url"
                  placeholder="https://..."
                  value={presentationUrl}
                  onChange={(e) => setPresentationUrl(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              {formHata && <Uyari tone="tehlike">{formHata}</Uyari>}

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button variant="ghost" size="sm" type="button" onClick={modaliKapat} disabled={islemde}>
                  İptal
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={islemde}>
                  {islemde ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
