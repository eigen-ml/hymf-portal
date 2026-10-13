'use client';

import React, { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateWorkspaceInfo } from '@/lib/data/workspaces';
import { Panel, Alan, Button, Uyari, inputSinifi } from '@/components/ui';

/** Kişinin kendi Google Drive klasörü. Bağlantı çalışma alanının drive_url alanına yazılır; danışman da görür. */
export function DriveBaglantisi({ workspaceId, driveUrl }: { workspaceId: string; driveUrl: string | null }) {
  const [duzenle, setDuzenle] = useState(!driveUrl);
  const [deger, setDeger] = useState(driveUrl ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const router = useRouter();
  const inputId = useId();

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata(null);
    const url = deger.trim();
    if (url && !url.startsWith('https://')) {
      setHata('Bağlantı https:// ile başlamalı.');
      return;
    }
    setKaydediliyor(true);
    const sonuc = await updateWorkspaceInfo(createClient(), workspaceId, { drive_url: url || null });
    setKaydediliyor(false);
    if (sonuc.error) {
      setHata(sonuc.error);
      return;
    }
    setDuzenle(false);
    router.refresh();
  };

  return (
    <Panel
      baslik="Kendi Drive klasörüm"
      aciklama="Büyük dosyalar, ham çıktılar ve arşiv buraya. Google Drive'da bir klasör aç, danışmanınla paylaş, bağlantısını yapıştır."
    >
      {hata && <Uyari tone="tehlike">{hata}</Uyari>}
      {duzenle ? (
        <form onSubmit={kaydet} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Alan etiket="Klasör bağlantısı" htmlFor={inputId} className="flex-1">
            <input
              id={inputId}
              type="url"
              inputMode="url"
              placeholder="https://drive.google.com/drive/folders/…"
              value={deger}
              onChange={(e) => setDeger(e.target.value)}
              className={inputSinifi}
            />
          </Alan>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={kaydediliyor}>
              {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            {driveUrl && (
              <Button type="button" variant="secondary" onClick={() => setDuzenle(false)}>
                Vazgeç
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={driveUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-link underline hover:text-link/90"
          >
            Drive klasörünü aç
            <ExternalLink size={14} />
          </a>
          <Button variant="ghost" size="sm" onClick={() => setDuzenle(true)}>
            Değiştir
          </Button>
        </div>
      )}
    </Panel>
  );
}
