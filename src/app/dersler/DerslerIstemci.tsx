'use client';

import React, { useState, useTransition } from 'react';
import { BookOpen, Download, Pencil, Plus, ShieldAlert, Trash2, User } from 'lucide-react';
import {
  Alan,
  BosDurum,
  Button,
  Panel,
  SayfaBasligi,
  Uyari,
  inputSinifi,
  selectSinifi,
  textareaSinifi,
} from '@/components/ui';
import type { CourseMaterial, Profile } from '@/types/database';
import { tarih } from '@/lib/zaman';
import { dersDuzenle, dersEkle, dersSil, materyalDuzenle, materyalEkle, materyalSil } from './actions';

const VARSAYILAN_DONEM = '2026-2027 Güz';

export interface DersKaydi {
  id: string;
  code: string;
  name: string;
  instructor_id: string;
  semester: string;
  syllabus: string | null;
  created_at: string;
  instructor: Pick<Profile, 'id' | 'full_name' | 'academic_title' | 'kadro' | 'yetki'> | null;
  materials: CourseMaterial[];
}

export type HocaSecenek = Pick<Profile, 'id' | 'full_name' | 'academic_title'>;

interface Props {
  kayitlar: DersKaydi[];
  hocalar: HocaSecenek[];
  benId: string;
  yonetebilir: boolean;
}

function unvanliAd(p: { full_name: string; academic_title?: string | null }): string {
  return [p.academic_title, p.full_name].filter(Boolean).join(' ');
}

export function DerslerIstemci({ kayitlar, hocalar, benId, yonetebilir }: Props) {
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [dersModalAcik, setDersModalAcik] = useState(false);
  const [duzenlenenDers, setDuzenlenenDers] = useState<DersKaydi | null>(null);
  const [materyalModalAcik, setMateryalModalAcik] = useState(false);
  const [duzenlenenMateryal, setDuzenlenenMateryal] = useState<CourseMaterial | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();

  // Seçili ders silinirse ya da yoksa ilk ders gösterilir.
  const secili = kayitlar.find((k) => k.id === seciliId) ?? kayitlar[0] ?? null;

  const materyalleri = secili
    ? [...secili.materials].sort(
        (a, b) => a.week_number - b.week_number || a.created_at.localeCompare(b.created_at),
      )
    : [];

  function dersiSil(ders: DersKaydi) {
    if (!confirm(`"${ders.code} ${ders.name}" dersi ve tüm materyalleri silinsin mi?`)) return;
    setHata(null);
    baslat(async () => {
      const sonuc = await dersSil(ders.id);
      if (!sonuc.ok) setHata(sonuc.error);
      else setSeciliId(null);
    });
  }

  function materyaliSil(mat: CourseMaterial) {
    if (!confirm(`"${mat.title}" materyali silinsin mi?`)) return;
    setHata(null);
    baslat(async () => {
      const sonuc = await materyalSil(mat.id);
      if (!sonuc.ok) setHata(sonuc.error);
    });
  }

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Lisansüstü dersler"
        aciklama="Yüksek lisans ve doktora derslerinin haftalık slaytları, syllabus belgeleri ve ek kaynakları."
        eylemler={
          yonetebilir ? (
            <Button variant="primary" size="sm" onClick={() => { setHata(null); setDersModalAcik(true); }}>
              <Plus className="w-4 h-4" />
              <span>Ders ekle</span>
            </Button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sunken border border-line text-sm text-ink-3">
              <ShieldAlert className="w-4 h-4" />
              <span>Ders ve materyal ekleme yetkisi yalnızca hoca ve yöneticilerdedir.</span>
            </div>
          )
        }
      />

      {hata && <Uyari tone="tehlike">{hata}</Uyari>}

      {kayitlar.length === 0 || !secili ? (
        <BosDurum baslik="Henüz ders yok." aciklama={yonetebilir ? 'Yukarıdan ilk dersi ekleyebilirsiniz.' : undefined} />
      ) : (
        <>
          {/* Ders Seçim Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {kayitlar.map((ders) => (
              <button
                key={ders.id}
                type="button"
                onClick={() => setSeciliId(ders.id)}
                className={`p-5 rounded-lg border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  secili.id === ders.id
                    ? 'bg-surface border-primary'
                    : 'bg-surface border-line hover:border-line-strong'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-mono px-2 py-0.5 rounded bg-sunken text-ink font-semibold">
                      {ders.code}
                    </span>
                    <span className="text-ink-3 font-mono text-xs">{ders.semester}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-ink">{ders.name}</h2>
                  <div className="text-sm text-ink-3 mt-2 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>Dersi veren: {ders.instructor ? unvanliAd(ders.instructor) : 'Belirtilmemiş'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-sm text-ink-3">
                  <span>{ders.materials.length} materyal</span>
                  <span className="text-primary font-medium text-sm">
                    {secili.id === ders.id ? 'Seçili' : 'Görüntüle'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Seçilen Ders Detayı ve Haftalık Materyaller */}
          <Panel className="space-y-6">
            <div className="border-b border-line pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-mono text-sm text-ink-3">{secili.code}</span>
                  <h2 className="text-2xl font-semibold text-ink mt-1">{secili.name}</h2>
                  <p className="text-sm text-ink-2 mt-1">
                    Dersi veren: {secili.instructor ? unvanliAd(secili.instructor) : 'Belirtilmemiş'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md bg-sunken text-xs font-mono text-ink-3">
                    {secili.semester}
                  </span>
                  {yonetebilir && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={bekliyor}
                      onClick={() => { setHata(null); setDuzenlenenDers(secili); }}
                      aria-label="Dersi düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Düzenle</span>
                    </Button>
                  )}
                  {yonetebilir && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={bekliyor}
                      onClick={() => dersiSil(secili)}
                      aria-label="Dersi sil"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Dersi sil</span>
                    </Button>
                  )}
                </div>
              </div>

              {secili.syllabus && (
                <div className="mt-4 p-4 rounded-md bg-sunken border border-line text-sm text-ink space-y-2">
                  <strong className="text-ink font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Ders izlencesi (syllabus)
                  </strong>
                  <p className="text-ink-2 leading-relaxed whitespace-pre-line">{secili.syllabus}</p>
                </div>
              )}
            </div>

            {/* Hafta Hafta Materyaller Listesi */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">Haftalık ders notları ve slaytlar</h3>
                {yonetebilir && (
                  <Button variant="secondary" size="sm" onClick={() => { setHata(null); setMateryalModalAcik(true); }}>
                    <Plus className="w-4 h-4" />
                    <span>Materyal ekle</span>
                  </Button>
                )}
              </div>

              {materyalleri.length > 0 ? (
                <div className="space-y-2 border-t border-line pt-3">
                  {materyalleri.map((mat) => (
                    <div
                      key={mat.id}
                      className="p-4 rounded-md bg-sunken border border-line hover:border-line-strong transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-xs font-medium font-mono bg-warn-soft text-warn">
                            Hafta {mat.week_number}
                          </span>
                          <h4 className="text-sm font-semibold text-ink">{mat.title}</h4>
                        </div>
                        {mat.description && (
                          <p className="text-sm text-ink-2 leading-snug whitespace-pre-line">{mat.description}</p>
                        )}
                        <div className="text-xs text-ink-3">{tarih(mat.created_at)}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <a
                          href={mat.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-on-primary text-sm font-medium transition hover:opacity-90"
                        >
                          <Download className="w-4 h-4" />
                          <span>Slayt / not indir</span>
                        </a>
                        {(mat.uploader_id === benId || yonetebilir) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={bekliyor}
                            onClick={() => { setHata(null); setDuzenlenenMateryal(mat); }}
                            aria-label={`${mat.title} materyalini düzenle`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {(mat.uploader_id === benId || yonetebilir) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={bekliyor}
                            onClick={() => materyaliSil(mat)}
                            aria-label={`${mat.title} materyalini sil`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-ink-3 bg-sunken rounded-md border border-dashed border-line">
                  Bu ders için henüz haftalık materyal yüklenmemiştir.
                </div>
              )}
            </div>
          </Panel>
        </>
      )}

      {dersModalAcik && (
        <DersEkleModal
          hocalar={hocalar}
          benId={benId}
          onKapat={() => setDersModalAcik(false)}
        />
      )}

      {duzenlenenDers && (
        <DersEkleModal
          mevcut={duzenlenenDers}
          hocalar={hocalar}
          benId={benId}
          onKapat={() => setDuzenlenenDers(null)}
        />
      )}

      {duzenlenenMateryal && secili && (
        <MateryalEkleModal
          mevcut={duzenlenenMateryal}
          dersId={secili.id}
          dersKodu={secili.code}
          onKapat={() => setDuzenlenenMateryal(null)}
        />
      )}

      {materyalModalAcik && secili && (
        <MateryalEkleModal
          dersId={secili.id}
          dersKodu={secili.code}
          onKapat={() => setMateryalModalAcik(false)}
        />
      )}
    </div>
  );
}

function ModalKabuk({
  baslik,
  aciklama,
  children,
}: {
  baslik: string;
  aciklama?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/80">
      <div className="bg-surface border border-line rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-lg font-semibold text-ink">{baslik}</h2>
          {aciklama && <p className="text-sm text-ink-3 mt-1">{aciklama}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Yeni ders; `mevcut` verilirse o dersi düzenler. */
function DersEkleModal({
  mevcut,
  hocalar,
  benId,
  onKapat,
}: {
  mevcut?: DersKaydi;
  hocalar: HocaSecenek[];
  benId: string;
  onKapat: () => void;
}) {
  const [kod, setKod] = useState(mevcut?.code ?? '');
  const [ad, setAd] = useState(mevcut?.name ?? '');
  const [hocaId, setHocaId] = useState(
    () => mevcut?.instructor_id ?? hocalar.find((h) => h.id === benId)?.id ?? hocalar[0]?.id ?? '',
  );
  const [donem, setDonem] = useState(mevcut?.semester ?? VARSAYILAN_DONEM);
  const [syllabus, setSyllabus] = useState(mevcut?.syllabus ?? '');
  const [hataMetni, setHataMetni] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();

  const hocaYok = hocalar.length === 0;
  // Dersin hocası artık listede değilse (pasif hesap) seçenek kaybolmasın.
  const eskiHoca =
    mevcut?.instructor && !hocalar.some((h) => h.id === mevcut.instructor_id) ? mevcut.instructor : null;

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHataMetni(null);
    baslat(async () => {
      const girdi = { code: kod, name: ad, instructor_id: hocaId, semester: donem, syllabus };
      const sonuc = mevcut ? await dersDuzenle(mevcut.id, girdi) : await dersEkle(girdi);
      if (sonuc.ok) onKapat();
      else setHataMetni(sonuc.error);
    });
  }

  return (
    <ModalKabuk
      baslik={mevcut ? 'Dersi düzenle' : 'Yeni ders ekle'}
      aciklama={mevcut ? undefined : 'Ders, öğretim üyesine bağlı olarak oluşturulur.'}
    >
      {hocaYok && !eskiHoca ? (
        <Uyari tone="uyari" baslik="Önce bir hoca hesabı eklenmeli">
          Onaylı ve aktif bir hoca hesabı olmadan ders oluşturulamaz.
        </Uyari>
      ) : null}

      {hataMetni && <Uyari tone="tehlike">{hataMetni}</Uyari>}

      <form onSubmit={gonder} className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <Alan etiket="Ders kodu *" htmlFor="ders-kod" className="col-span-1">
            <input
              id="ders-kod"
              type="text"
              required
              maxLength={20}
              placeholder="FIZ601"
              value={kod}
              onChange={(e) => setKod(e.target.value)}
              className={inputSinifi}
            />
          </Alan>
          <Alan etiket="Ders adı *" htmlFor="ders-ad" className="col-span-2">
            <input
              id="ders-ad"
              type="text"
              required
              minLength={2}
              maxLength={200}
              placeholder="Örn: Katıhal fiziği"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              className={inputSinifi}
            />
          </Alan>
        </div>

        <Alan etiket="Öğretim üyesi *" htmlFor="ders-hoca">
          <select
            id="ders-hoca"
            required
            disabled={hocaYok && !eskiHoca}
            value={hocaId}
            onChange={(e) => setHocaId(e.target.value)}
            className={selectSinifi}
          >
            {eskiHoca && <option value={eskiHoca.id}>{unvanliAd(eskiHoca)}</option>}
            {hocalar.map((h) => (
              <option key={h.id} value={h.id}>
                {unvanliAd(h)}
              </option>
            ))}
          </select>
        </Alan>

        <Alan etiket="Dönem" htmlFor="ders-donem" yardim="Boş bırakılırsa 2026-2027 Güz kullanılır.">
          <input
            id="ders-donem"
            type="text"
            maxLength={40}
            value={donem}
            onChange={(e) => setDonem(e.target.value)}
            className={inputSinifi}
          />
        </Alan>

        <Alan etiket="Syllabus" htmlFor="ders-syllabus" yardim="İsteğe bağlı, en fazla 5000 karakter.">
          <textarea
            id="ders-syllabus"
            rows={4}
            maxLength={5000}
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            className={textareaSinifi}
          />
        </Alan>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button variant="ghost" size="sm" onClick={onKapat} disabled={bekliyor}>
            İptal
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={bekliyor || (hocaYok && !eskiHoca)}>
            {bekliyor ? 'Kaydediliyor...' : 'Dersi kaydet'}
          </Button>
        </div>
      </form>
    </ModalKabuk>
  );
}

/** Yeni materyal; `mevcut` verilirse o materyali düzenler. */
function MateryalEkleModal({
  mevcut,
  dersId,
  dersKodu,
  onKapat,
}: {
  mevcut?: CourseMaterial;
  dersId: string;
  dersKodu: string;
  onKapat: () => void;
}) {
  const [hafta, setHafta] = useState(mevcut ? String(mevcut.week_number) : '1');
  const [baslik, setBaslik] = useState(mevcut?.title ?? '');
  const [aciklama, setAciklama] = useState(mevcut?.description ?? '');
  const [dosyaUrl, setDosyaUrl] = useState(mevcut?.file_url ?? '');
  const [hataMetni, setHataMetni] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHataMetni(null);
    baslat(async () => {
      const girdi = { week_number: Number(hafta), title: baslik, description: aciklama, file_url: dosyaUrl };
      const sonuc = mevcut
        ? await materyalDuzenle(mevcut.id, girdi)
        : await materyalEkle({ ...girdi, course_id: dersId });
      if (sonuc.ok) onKapat();
      else setHataMetni(sonuc.error);
    });
  }

  return (
    <ModalKabuk
      baslik={mevcut ? `Materyali düzenle (${dersKodu})` : `Ders materyali ekle (${dersKodu})`}
      aciklama={mevcut ? undefined : 'Materyal, sizin adınızla kaydedilir.'}
    >
      {hataMetni && <Uyari tone="tehlike">{hataMetni}</Uyari>}

      <form onSubmit={gonder} className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <Alan etiket="Hafta *" htmlFor="mat-hafta">
            <input
              id="mat-hafta"
              type="number"
              min={1}
              max={20}
              step={1}
              required
              value={hafta}
              onChange={(e) => setHafta(e.target.value)}
              className={inputSinifi}
            />
          </Alan>
          <Alan etiket="Ders konusu / başlık *" htmlFor="mat-baslik" className="col-span-2">
            <input
              id="mat-baslik"
              type="text"
              required
              maxLength={200}
              placeholder="Örn: Bloch teoremi ve bant yapısı"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className={inputSinifi}
            />
          </Alan>
        </div>

        <Alan etiket="Açıklama / kapsam" htmlFor="mat-aciklama">
          <textarea
            id="mat-aciklama"
            rows={2}
            maxLength={5000}
            placeholder="Bu haftanın slayt içeriği veya okuma önerisi..."
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            className={textareaSinifi}
          />
        </Alan>

        <Alan
          etiket="Dosya bağlantısı *"
          htmlFor="mat-url"
          yardim="http:// veya https:// ile başlayan bir adres girin (ör. Drive bağlantısı)."
        >
          <input
            id="mat-url"
            type="url"
            required
            placeholder="https://..."
            value={dosyaUrl}
            onChange={(e) => setDosyaUrl(e.target.value)}
            className={inputSinifi}
          />
        </Alan>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button variant="ghost" size="sm" onClick={onKapat} disabled={bekliyor}>
            İptal
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={bekliyor}>
            {bekliyor ? 'Kaydediliyor...' : 'Materyali kaydet'}
          </Button>
        </div>
      </form>
    </ModalKabuk>
  );
}
