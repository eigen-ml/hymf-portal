'use client';

import React, { useState, useTransition } from 'react';
import { CheckCircle2, Pencil, Plus, Send, Trash2, User } from 'lucide-react';
import type { Announcement, AnnouncementPriority, Profile } from '@/types/database';
import { SayfaBasligi, Panel, Button, Rozet, YetkiRozeti, Uyari } from '@/components/ui';
import type { RozetTonu } from '@/components/ui';
import { tarih } from '@/lib/zaman';
import { duyuruDuzenle, duyuruEkle, duyuruSil } from './actions';

export type DuyuruKaydi = Omit<Announcement, 'author'> & {
  author?: Pick<Profile, 'id' | 'full_name' | 'academic_title' | 'kadro' | 'yetki'> | null;
};

interface DuyurularIstemciProps {
  kayitlar: DuyuruKaydi[];
  benId: string;
  yonetebilir: boolean;
  /** Yönetici her duyuruyu düzenleyebilir; diğerleri yalnız kendininkini. */
  admin: boolean;
}

const FILTRELER: { id: 'all' | AnnouncementPriority; label: string }[] = [
  { id: 'all', label: 'Tüm duyurular' },
  { id: 'acil', label: 'Acil' },
  { id: 'toplanti', label: 'Toplantılar' },
  { id: 'soru_yardim', label: 'Soru ve yardım' },
  { id: 'kaynak_paylasimi', label: 'Kaynak paylaşımı' },
];

const ONCELIK_ETIKETI: Record<AnnouncementPriority, string> = {
  acil: 'Acil',
  toplanti: 'Toplantı',
  soru_yardim: 'Soru ve yardım',
  kaynak_paylasimi: 'Kaynak paylaşımı',
};

const ONCELIK_TONU: Record<AnnouncementPriority, RozetTonu> = {
  acil: 'uyari',
  toplanti: 'bilgi',
  soru_yardim: 'notr',
  kaynak_paylasimi: 'basari',
};

const FORM_SECENEKLERI: { value: AnnouncementPriority; label: string; desc: string }[] = [
  { value: 'toplanti', label: 'Toplantı', desc: 'Telegram gruba bildirilir' },
  { value: 'acil', label: 'Acil duyuru', desc: 'Telegram gruba anında' },
  { value: 'soru_yardim', label: 'Soru / yardım', desc: 'Portal içi akış' },
  { value: 'kaynak_paylasimi', label: 'Kaynak paylaşımı', desc: 'Portal içi akış' },
];

export function DuyurularIstemci({ kayitlar, benId, yonetebilir, admin }: DuyurularIstemciProps) {
  const [filterPriority, setFilterPriority] = useState<'all' | AnnouncementPriority>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** Düzenlenen duyurunun kimliği; boşsa pencere yeni duyuru içindir. */
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('toplanti');
  const [formHatasi, setFormHatasi] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [islemHatasi, setIslemHatasi] = useState<string | null>(null);
  const [gonderiliyor, startGonderim] = useTransition();
  const [siliniyor, startSilme] = useTransition();

  const filtered = kayitlar.filter((kayit) => filterPriority === 'all' || kayit.priority === filterPriority);

  const formuSifirla = () => {
    setTitle('');
    setContent('');
    setPriority('toplanti');
    setDuzenlenenId(null);
  };

  const closeModal = () => {
    // Yarım kalan yeni duyuru taslağı korunur; düzenleme taslağı atılır.
    if (duzenlenenId) formuSifirla();
    setIsModalOpen(false);
    setFormHatasi(null);
  };

  const yeniAc = () => {
    if (duzenlenenId) formuSifirla();
    setFormHatasi(null);
    setIsModalOpen(true);
  };

  const duzenleAc = (kayit: DuyuruKaydi) => {
    setDuzenlenenId(kayit.id);
    setTitle(kayit.title);
    setContent(kayit.content);
    setPriority(kayit.priority);
    setFormHatasi(null);
    setIslemHatasi(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setFormHatasi(null);
    setFeedbackMessage(null);

    startGonderim(async () => {
      if (duzenlenenId) {
        const sonuc = await duyuruDuzenle(duzenlenenId, { title, content, priority });
        if (!sonuc.ok) {
          setFormHatasi(sonuc.error);
          return;
        }
        setFeedbackMessage('Duyuru güncellendi.');
        formuSifirla();
        setIsModalOpen(false);
        setTimeout(() => setFeedbackMessage(null), 5000);
        return;
      }

      const sonuc = await duyuruEkle({ title, content, priority });
      if (!sonuc.ok) {
        setFormHatasi(sonuc.error);
        return;
      }

      setFeedbackMessage(
        sonuc.telegramGonderildi
          ? 'Duyuru başarıyla yayınlandı ve Telegram grubuna iletildi!'
          : 'Duyuru portalda yayınlandı, ancak Telegram grubuna iletilemedi.'
      );
      formuSifirla();
      setIsModalOpen(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    setIslemHatasi(null);
    startSilme(async () => {
      const sonuc = await duyuruSil(id);
      if (!sonuc.ok) setIslemHatasi(sonuc.error);
    });
  };

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Duyurular"
        aciklama="Tüm grup üyelerinin ortak akışı. Acil ve toplantı duyuruları doğrudan Telegram grubuna iletilir."
        eylemler={
          <Button variant="primary" size="sm" onClick={yeniAc}>
            <Plus className="w-4 h-4" />
            <span>Duyuru ekle</span>
          </Button>
        }
      />

      {feedbackMessage && (
        <div className="p-4 rounded-lg bg-ok-soft border border-ok text-ok text-sm flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {islemHatasi && <Uyari tone="tehlike">{islemHatasi}</Uyari>}

      {/* Öncelik Filtreleme Butonları */}
      <div className="flex flex-wrap gap-2">
        {FILTRELER.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterPriority(tab.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
              filterPriority === tab.id
                ? 'bg-primary text-on-primary'
                : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Duyuru Kartları */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-sm text-ink-3">Henüz duyuru yok.</p>
        )}

        {filtered.map((kayit) => {
          const silebilir = kayit.author_id === benId || yonetebilir;
          const duzenleyebilir = kayit.author_id === benId || admin;

          return (
            <Panel key={kayit.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Rozet tone={ONCELIK_TONU[kayit.priority]}>{ONCELIK_ETIKETI[kayit.priority]}</Rozet>

                  {kayit.telegram_sent && (
                    <span className="text-sm text-ok flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      Telegram&apos;a iletildi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-ink-3">
                  {tarih(kayit.created_at)}
                  {kayit.updated_at && <span title={tarih(kayit.updated_at)}>(düzenlendi)</span>}
                  {duzenleyebilir && (
                    <button
                      onClick={() => duzenleAc(kayit)}
                      disabled={siliniyor}
                      className="text-ink-3 hover:text-link transition p-1 disabled:opacity-50"
                      title="Duyuruyu düzenle"
                      aria-label="Duyuruyu düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {silebilir && (
                    <button
                      onClick={() => handleDelete(kayit.id)}
                      disabled={siliniyor}
                      className="text-ink-3 hover:text-danger transition p-1 disabled:opacity-50"
                      title="Duyuruyu sil"
                      aria-label="Duyuruyu sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink">{kayit.title}</h2>
                <p className="text-sm text-ink-2 mt-2 leading-relaxed whitespace-pre-line">{kayit.content}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-ink-3 border-t border-line pt-3">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>{kayit.author?.full_name || 'Grup üyesi'}</span>
                  {kayit.author && <YetkiRozeti yetki={kayit.author.yetki} />}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* YENİ DUYURU / DÜZENLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/80">
          <div className="bg-surface border border-line rounded-lg max-w-lg w-full p-6 space-y-5">
            <div className="border-b border-line pb-3">
              <h2 className="text-lg font-semibold text-ink">
                {duzenlenenId ? 'Duyuruyu düzenle' : 'Yeni duyuru paylaşımı'}
              </h2>
              <p className="text-sm text-ink-3 mt-1">
                {duzenlenenId
                  ? 'Değişiklik yalnız portalda görünür; Telegram\'a yeniden gönderilmez.'
                  : 'Öncelik seçiminiz Telegram bildirim davranışını belirler.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-ink font-semibold mb-2">Öncelik ve kategori *</label>
                <div className="grid grid-cols-2 gap-2">
                  {FORM_SECENEKLERI.map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-3 rounded-md border cursor-pointer flex flex-col justify-between ${
                        priority === opt.value
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-sunken text-ink-2 border-line'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={opt.value}
                        checked={priority === opt.value}
                        onChange={() => setPriority(opt.value)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-xs mt-1 text-ink-3">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1">Duyuru başlığı *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Örn: 2026 Güz dönemi VASP kota paylaşımı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-sunken border border-control rounded-md text-ink placeholder-ink-3 focus:outline-none focus-visible:border-link focus-visible:ring-2 focus-visible:ring-link/30"
                />
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1">Duyuru içeriği *</label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  placeholder="Detaylı bilgi, tarih veya talimatlar..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-sunken border border-control rounded-md text-ink placeholder-ink-3 focus:outline-none focus-visible:border-link focus-visible:ring-2 focus-visible:ring-link/30"
                />
              </div>

              {formHatasi && <Uyari tone="tehlike">{formHatasi}</Uyari>}

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button variant="ghost" size="sm" onClick={closeModal} disabled={gonderiliyor}>
                  İptal
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={gonderiliyor}>
                  {gonderiliyor
                    ? duzenlenenId ? 'Kaydediliyor...' : 'Gönderiliyor...'
                    : duzenlenenId ? 'Kaydet' : 'Yayınla ve bildir'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
