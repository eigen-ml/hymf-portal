import React from 'react';
import { ChevronRight } from 'lucide-react';

// Kapanıp açılan bölüm. Başlığa tıklayınca açılır, tarayıcının <details> öğesi: JavaScript gerekmez, sayfa içi
// aramada (Cmd+F) kapalıyken de bulunur. Uzun ayrıntıyı varsayılan kapalı tutup sayfayı sade göstermek için.
export function AcilirBolum({
  baslik,
  ozet,
  id,
  acik,
  kucuk,
  children,
}: {
  baslik: React.ReactNode;
  /** Başlığın altında, kapalıyken de görünen bir satır. */
  ozet?: React.ReactNode;
  id?: string;
  /** Sayfa açılınca açık gelsin. */
  acik?: boolean;
  /** Bir bölümün içindeki küçük açılır (ör. "Ayrıntı: ..."). */
  kucuk?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={acik}
      className={`group scroll-mt-24 border border-line ${kucuk ? 'rounded-md' : 'rounded-lg bg-surface'}`}
    >
      <summary
        className={`flex cursor-pointer list-none items-start gap-2 marker:hidden [&::-webkit-details-marker]:hidden ${
          kucuk ? 'px-4 py-2.5' : 'px-4 py-4 sm:px-6'
        }`}
      >
        <ChevronRight
          className={`shrink-0 text-ink-3 transition group-open:rotate-90 ${kucuk ? 'mt-0.5 size-4' : 'mt-1 size-5'}`}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className={kucuk ? 'font-medium text-ink' : 'text-lg font-semibold text-ink'}>{baslik}</span>
          {ozet && <span className="mt-0.5 block text-sm text-ink-2">{ozet}</span>}
        </span>
      </summary>
      <div
        className={`space-y-4 border-t border-line text-sm leading-relaxed text-ink-2 ${
          kucuk ? 'px-4 py-3' : 'px-4 py-5 sm:px-6'
        }`}
      >
        {children}
      </div>
    </details>
  );
}
