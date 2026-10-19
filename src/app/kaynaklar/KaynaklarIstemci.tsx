'use client';

import React, { useState, useTransition } from 'react';
import {
  ExternalLink,
  FileText,
  Globe,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import type { ProfileSummary, Resource, ResourceCategory } from '@/types/database';
import { CodeBlock } from '@/components/CodeBlock';
import { SayfaBasligi, Panel, Button, Rozet, Uyari } from '@/components/ui';
import { tarih } from '@/lib/zaman';
import { kaynakDuzenle, kaynakEkle, kaynakSil } from './actions';

export type KaynakKaydi = Omit<Resource, 'uploader'> & { uploader?: ProfileSummary | null };

interface KaynaklarIstemciProps {
  kayitlar: KaynakKaydi[];
  benId: string;
  yonetebilir: boolean;
  /** Yönetici her kaynağı düzenleyebilir; diğerleri yalnız kendininkini. */
  admin: boolean;
}

const KATEGORI_FILTRELERI: { id: string; label: string }[] = [
  { id: 'all', label: 'Tüm kaynaklar' },
  { id: 'kod_script', label: 'Kod ve scriptler' },
  { id: 'kitap_makale', label: 'Kitaplar ve makaleler' },
  { id: 'faydali_link', label: 'Linkler ve veri tabanları' },
];

const KATEGORI_SECENEKLERI: { id: ResourceCategory; label: string }[] = [
  { id: 'kod_script', label: 'Kod / script' },
  { id: 'kitap_makale', label: 'Kitap / makale' },
  { id: 'faydali_link', label: 'Link / veri tabanı' },
];

const DIL_SECENEKLERI: { id: string; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'bash', label: 'Bash / Slurm' },
  { id: 'fortran', label: 'Fortran' },
  { id: 'matlab', label: 'MATLAB' },
];

const inputSinifi =
  'w-full px-3 py-2 bg-sunken border border-control rounded-md text-ink placeholder-ink-3 focus:outline-none focus-visible:border-link focus-visible:ring-2 focus-visible:ring-link/30';

export function KaynaklarIstemci({ kayitlar, benId, yonetebilir, admin }: KaynaklarIstemciProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [modalAcik, setModalAcik] = useState(false);
  /** Düzenlenen kaynağın kimliği; boşsa pencere yeni kaynak içindir. */
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [formHata, setFormHata] = useState<string | null>(null);
  const [silmeHata, setSilmeHata] = useState<string | null>(null);
  const [bekliyor, startTransition] = useTransition();

  // Form durumu
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('kod_script');
  const [language, setLanguage] = useState('python');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const allTags = Array.from(new Set(kayitlar.flatMap((r) => r.tags)));

  const aramaMetni = searchQuery.toLowerCase();
  const filteredResources = kayitlar.filter((res) => {
    const matchesCategory =
      selectedCategory === 'all' || res.category === selectedCategory;

    const matchesTag = !selectedTag || res.tags.includes(selectedTag);

    const matchesSearch =
      res.title.toLowerCase().includes(aramaMetni) ||
      (!!res.description && res.description.toLowerCase().includes(aramaMetni)) ||
      res.tags.some((t) => t.toLowerCase().includes(aramaMetni));

    return matchesCategory && matchesTag && matchesSearch;
  });

  function formuSifirla() {
    setTitle('');
    setDescription('');
    setCategory('kod_script');
    setLanguage('python');
    setCodeSnippet('');
    setExternalUrl('');
    setTagsInput('');
    setDuzenlenenId(null);
  }

  function modalKapat() {
    // Yarım kalan yeni kaynak taslağı korunur; düzenleme taslağı atılır.
    if (duzenlenenId) formuSifirla();
    setModalAcik(false);
    setFormHata(null);
  }

  function yeniAc() {
    if (duzenlenenId) formuSifirla();
    setFormHata(null);
    setModalAcik(true);
  }

  function duzenleAc(res: KaynakKaydi) {
    setDuzenlenenId(res.id);
    setTitle(res.title);
    setDescription(res.description ?? '');
    setCategory(res.category);
    setLanguage(res.language || 'bash');
    setCodeSnippet(res.code_snippet ?? '');
    setExternalUrl(res.external_url ?? '');
    setTagsInput(res.tags.join(', '));
    setFormHata(null);
    setSilmeHata(null);
    setModalAcik(true);
  }

  function handleAddResource(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormHata(null);

    startTransition(async () => {
      const girdi = {
        title,
        description,
        category,
        language,
        codeSnippet,
        externalUrl,
        etiketler: tagsInput,
      };
      const sonuc = duzenlenenId ? await kaynakDuzenle(duzenlenenId, girdi) : await kaynakEkle(girdi);

      if (!sonuc.ok) {
        setFormHata(sonuc.error);
        return;
      }

      formuSifirla();
      setModalAcik(false);
    });
  }

  function handleDelete(id: string, uploaderId: string) {
    if (!(uploaderId === benId || yonetebilir)) return;
    if (!confirm('Bu kaynağı silmek istediğinize emin misiniz?')) return;

    setSilmeHata(null);
    startTransition(async () => {
      const sonuc = await kaynakSil(id);
      if (!sonuc.ok) setSilmeHata(sonuc.error);
    });
  }

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Kaynaklar ve scriptler"
        aciklama="Kitaplar, makale PDF arşivi, faydalı veritabanları ve DFT, VASP, Python hesaplama scriptleri."
        eylemler={
          <Button
            variant="primary"
            size="sm"
            onClick={yeniAc}
          >
            <Plus className="w-4 h-4" />
            <span>Yeni kaynak ekle</span>
          </Button>
        }
      />

      {/* Dosya İsimlendirme Kuralı */}
      <Uyari tone="uyari">
        <strong>Dosya isimlendirme standardı.</strong> Yüklenen PDF veya script dosyaları şu formata uymalıdır: <code className="font-mono text-xs">Yil_Ay_Kategori_Konu_Ekleyen.uzanti</code>. Örneğin: <code className="font-mono text-xs">2026_10_SCRIPT_VaspBandPlot_CanOzdemir.py</code> veya <code className="font-mono text-xs">2026_10_KITAP_MartinDFT_AliKemal.pdf</code>
      </Uyari>

      {silmeHata && <Uyari tone="tehlike">{silmeHata}</Uyari>}

      {/* Filtreler ve Arama */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        {/* Kategori Butonları */}
        <div className="flex flex-wrap gap-2">
          {KATEGORI_FILTRELERI.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Arama Kutusu */}
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-ink-3" />
          <input
            type="text"
            placeholder="Başlık, script veya tag ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-sunken border border-control rounded-md text-sm text-ink placeholder-ink-3 focus:outline-none focus-visible:border-link focus-visible:ring-2 focus-visible:ring-link/30"
          />
        </div>
      </div>

      {/* Etiketler (Tags) */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-ink-3 flex items-center gap-1">
            <Tag className="w-4 h-4" />
            Etiketler:
          </span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-2 py-1 rounded text-xs font-medium bg-sunken text-ink-2 border border-line cursor-pointer hover:bg-sunken/80"
            >
              Filtreyi kaldır ✕
            </button>
          )}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer border ${
                selectedTag === tag
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-sunken text-ink-2 hover:text-ink border-line'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Kaynak Kartları */}
      {kayitlar.length === 0 ? (
        <p className="text-sm text-ink-3">Henüz kaynak yok.</p>
      ) : filteredResources.length === 0 ? (
        <p className="text-sm text-ink-3">Aramanızla eşleşen kaynak yok.</p>
      ) : (
        <div className="space-y-6">
          {filteredResources.map((res) => (
            <Panel key={res.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Rozet
                    tone={
                      res.category === 'kod_script'
                        ? 'notr'
                        : res.category === 'kitap_makale'
                          ? 'bilgi'
                          : 'basari'
                    }
                  >
                    {res.category === 'kod_script'
                      ? `${res.language.toUpperCase()} script`
                      : res.category === 'kitap_makale'
                        ? 'Kitap / makale PDF'
                        : 'Veri tabanı & portal'}
                  </Rozet>
                </div>

                <div className="flex items-center gap-2 text-sm text-ink-3">
                  {tarih(res.created_at)}
                  {(res.uploader_id === benId || admin) && (
                    <button
                      onClick={() => duzenleAc(res)}
                      disabled={bekliyor}
                      className="text-ink-3 hover:text-link transition p-1 disabled:opacity-50"
                      title="Kaynağı düzenle"
                      aria-label="Kaynağı düzenle"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {(res.uploader_id === benId || yonetebilir) && (
                    <button
                      onClick={() => handleDelete(res.id, res.uploader_id)}
                      disabled={bekliyor}
                      className="text-ink-3 hover:text-danger transition p-1 disabled:opacity-50"
                      title="Kaynağı sil"
                      aria-label="Kaynağı sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {res.title}
                </h2>
                {res.description && (
                  <p className="text-sm text-ink-2 mt-2 leading-relaxed">
                    {res.description}
                  </p>
                )}
              </div>

              {/* Kod Bloğu İçeriği */}
              {res.code_snippet && (
                <CodeBlock
                  code={res.code_snippet}
                  language={res.language}
                  title={`${res.title} (${res.language})`}
                />
              )}

              {/* Dış Link veya Dosya */}
              {res.external_url && (
                <div className="pt-2">
                  <a
                    href={res.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sunken hover:bg-sunken/80 text-ink text-sm font-medium transition"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Bağlantıyı aç</span>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
                  </a>
                </div>
              )}

              {res.file_url && (
                <div className="pt-2">
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sunken hover:bg-sunken/80 text-ink text-sm font-medium transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF dokümanını indir</span>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-3" />
                  </a>
                </div>
              )}

              {/* Etiketler ve Yükleyen */}
              <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {res.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs font-medium bg-sunken text-ink-3 border border-line"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-ink-3 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>
                    {res.uploader?.full_name || 'Grup üyesi'}
                  </span>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* YENİ KAYNAK EKLEME MODALI */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/80">
          <div className="bg-surface border border-line rounded-lg max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-line pb-3">
              <h2 className="text-lg font-semibold text-ink">
                {duzenlenenId ? 'Kaynağı düzenle' : 'Ortak havuzuna kaynak veya script ekle'}
              </h2>
              <p className="text-sm text-ink-3 mt-1">
                Lütfen grup dosya isimlendirme kuralına (<code className="font-mono">Yil_Ay_Kategori_Konu_Ekleyen.uzanti</code>) dikkat ediniz.
              </p>
            </div>

            <form onSubmit={handleAddResource} className="space-y-4 text-sm">
              {formHata && <Uyari tone="tehlike">{formHata}</Uyari>}

              <div>
                <span className="block text-ink font-semibold mb-2">Kategori *</span>
                <div className="grid grid-cols-3 gap-2">
                  {KATEGORI_SECENEKLERI.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-2 rounded-md border font-semibold transition cursor-pointer text-center ${
                        category === c.id
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-sunken border-line text-ink-2'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="kaynak-baslik" className="block text-ink font-semibold mb-1">Başlık *</label>
                <input
                  id="kaynak-baslik"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Örn: VASP vasprun.xml DOS çizici"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              <div>
                <label htmlFor="kaynak-aciklama" className="block text-ink font-semibold mb-1">Açıklama</label>
                <textarea
                  id="kaynak-aciklama"
                  rows={2}
                  maxLength={5000}
                  placeholder="Kaynağın kullanım amacı veya açıklaması..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              {category === 'kod_script' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="kaynak-dil" className="block text-ink font-semibold mb-1">Yazılım dili</label>
                      <select
                        id="kaynak-dil"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={inputSinifi}
                      >
                        {DIL_SECENEKLERI.map((d) => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                        {/* Listede olmayan eski dil kaybolmasın. */}
                        {!DIL_SECENEKLERI.some((d) => d.id === language) && (
                          <option value={language}>{language}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="kaynak-kod" className="block text-ink font-semibold mb-1">
                      Kod / script içeriği *
                    </label>
                    <textarea
                      id="kaynak-kod"
                      rows={6}
                      required
                      maxLength={20000}
                      placeholder={'#!/usr/bin/env python3\n# Betik kodunuzu buraya yapıştırın...'}
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      className={`${inputSinifi} font-mono text-sm`}
                    />
                  </div>
                </>
              )}

              {category === 'faydali_link' && (
                <div>
                  <label htmlFor="kaynak-url" className="block text-ink font-semibold mb-1">Web bağlantısı (URL) *</label>
                  <input
                    id="kaynak-url"
                    type="url"
                    required
                    placeholder="https://next-gen.materialsproject.org"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className={inputSinifi}
                  />
                </div>
              )}

              <div>
                <label htmlFor="kaynak-etiket" className="block text-ink font-semibold mb-1">
                  Etiketler (virgülle ayırın)
                </label>
                <input
                  id="kaynak-etiket"
                  type="text"
                  placeholder="VASP, DFT, Pymatgen, Bant yapısı"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className={inputSinifi}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={modalKapat}
                  disabled={bekliyor}
                >
                  İptal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={bekliyor}
                >
                  {bekliyor ? 'Kaydediliyor...' : duzenlenenId ? 'Kaydet' : 'Kaydet ve ekle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
