'use client';

import { useState } from 'react';
import { ExternalLink, FileText, Folder, X } from 'lucide-react';

export type DriveDosyasiOzeti = { ad: string; url: string; klasorMu: boolean };

/**
 * Drive dosyasının sayfa içi önizleme adresi. Drive'ın "Öğeyi yerleştir" (embed) kodundaki /preview
 * biçimi; klasöre "bağlantıya sahip herkes" erişimi verildiği için içindeki dosyalarda da çalışır.
 * Tanınmayan adreslerde null döner, dosya yeni sekmede açılır.
 */
export function onizlemeAdresi(url: string): string | null {
  const eslesme = url.match(
    /^https:\/\/(drive|docs)\.google\.com\/(file|document|presentation|spreadsheets)\/d\/([A-Za-z0-9_-]+)/,
  );
  if (eslesme) return `https://${eslesme[1]}.google.com/${eslesme[2]}/d/${eslesme[3]}/preview`;
  const kimlik = url.match(/^https:\/\/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/)?.[1];
  return kimlik ? `https://drive.google.com/file/d/${kimlik}/preview` : null;
}

/** Drive klasöründeki dosyalar (veri sunucuda driveKlasorDosyalari ile okunur). Dosyaya tıklayınca altta açılır. */
export function DriveDosyaListesi({ dosyalar }: { dosyalar: DriveDosyasiOzeti[] | null }) {
  const [secili, setSecili] = useState<DriveDosyasiOzeti | null>(null);

  if (dosyalar === null) {
    return <p className="text-sm text-ink-3">Dosya listesi şu an okunamadı. Klasörü açıp bakabilirsin.</p>;
  }
  if (!dosyalar.length) {
    return <p className="text-sm text-ink-3">Henüz dosya yok.</p>;
  }

  const onizleme = secili ? onizlemeAdresi(secili.url) : null;
  const satirSinifi = 'flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-sm text-ink hover:bg-sunken';

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line rounded-lg border border-line">
        {dosyalar.map((d) => {
          const Simge = d.klasorMu ? Folder : FileText;
          const icerik = (
            <>
              <Simge className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
              <span className="min-w-0 break-words">{d.ad}</span>
            </>
          );
          return (
            <li key={d.url}>
              {!d.klasorMu && onizlemeAdresi(d.url) ? (
                <button
                  type="button"
                  onClick={() => setSecili(secili?.url === d.url ? null : d)}
                  aria-pressed={secili?.url === d.url}
                  className={satirSinifi + (secili?.url === d.url ? ' bg-sunken font-semibold' : '')}
                >
                  {icerik}
                </button>
              ) : (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className={satirSinifi}>
                  {icerik}
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {secili && onizleme && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 break-words text-sm font-semibold text-ink">{secili.ad}</p>
            <div className="flex items-center gap-1">
              <a
                href={secili.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-2 hover:bg-sunken hover:text-ink"
              >
                Yeni sekmede aç <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => setSecili(null)}
                aria-label="Önizlemeyi kapat"
                className="inline-flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-sunken hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <iframe
            key={onizleme}
            src={onizleme}
            title={secili.ad}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="aspect-[4/3] w-full rounded-lg border border-line bg-white sm:aspect-video"
          />
        </div>
      )}
    </div>
  );
}
