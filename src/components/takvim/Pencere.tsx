'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Basit diyalog. Yerel <dialog> kullanır: odak pencerenin içinde kalır, Escape kapatır,
 * kapanınca odak açan düğmeye döner. Yalnız açıkken çizilir (kapatmak = çizmemek).
 * İlk odak: içerikte `data-ilk-odak` işaretli öğe varsa o, yoksa Kapat düğmesi.
 */
export function Pencere({
  baslik,
  onKapat,
  className,
  children,
}: {
  baslik: React.ReactNode;
  onKapat: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const baslikId = useId();
  const kapatRef = useRef(onKapat);

  useEffect(() => {
    kapatRef.current = onKapat;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onceki = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oncekiKaydirma = document.body.style.overflow;
    const kapandi = () => kapatRef.current();

    el.addEventListener('close', kapandi);
    if (!el.open) el.showModal();
    el.querySelector<HTMLElement>('[data-ilk-odak]')?.focus();
    document.body.style.overflow = 'hidden';

    return () => {
      el.removeEventListener('close', kapandi);
      if (el.open) el.close();
      document.body.style.overflow = oncekiKaydirma;
      if (onceki?.isConnected) onceki.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={baslikId}
      // Arka plana (::backdrop) tıklamak hedefi dialog'un kendisi yapar.
      onClick={(e) => {
        if (e.target === e.currentTarget) onKapat();
      }}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-paper/80',
        className,
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={baslikId} className="font-serif text-2xl text-ink">
            {baslik}
          </h2>
          <button
            type="button"
            onClick={onKapat}
            aria-label="Kapat"
            className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
