import React from 'react';
import { cn } from '@/lib/cn';

/** HYMF işareti: marka renginde yuvarlak kare içinde Ψ. Gilroy'da Ψ olmadığı için çizgi olarak çizilir. */
export function MarkaIsareti({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-[0.65rem] bg-accent text-on-accent shadow-panel', className)}
    >
      <svg viewBox="0 0 24 24" className="size-[1.35rem]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3.5v17" />
        <path d="M5.5 5v4.5a6.5 6.5 0 0 0 13 0V5" />
      </svg>
    </span>
  );
}
