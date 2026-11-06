import { FileText, Folder } from 'lucide-react';

export type DriveDosyasiOzeti = { ad: string; url: string; klasorMu: boolean };

/** Drive klasöründeki dosyaların adları (veri sunucuda driveKlasorDosyalari ile okunur). */
export function DriveDosyaListesi({ dosyalar }: { dosyalar: DriveDosyasiOzeti[] | null }) {
  if (dosyalar === null) {
    return <p className="text-sm text-ink-3">Dosya listesi şu an okunamadı. Klasörü açıp bakabilirsin.</p>;
  }
  if (!dosyalar.length) {
    return <p className="text-sm text-ink-3">Henüz dosya yok.</p>;
  }
  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {dosyalar.map((d) => (
        <li key={d.url}>
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-sunken"
          >
            {d.klasorMu ? (
              <Folder className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            )}
            <span className="min-w-0 break-words">{d.ad}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
