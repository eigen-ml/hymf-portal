import React from 'react';
import { cn } from '@/lib/cn';

// 16 px ve üstü: iOS Safari alana odaklanınca sayfayı yakınlaştırmaz.
export const inputSinifi =
  'block w-full rounded-lg border border-control bg-surface px-3.5 py-2.5 text-base leading-6 text-ink shadow-panel placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:bg-sunken disabled:text-ink-3 disabled:shadow-none';

export const textareaSinifi = cn(inputSinifi, 'min-h-28');

export const selectSinifi = cn(inputSinifi, 'pr-10');

/** Etiket + alan + yardım/hata metni. `htmlFor`, içerideki alanın id'si olmalı. */
export function Alan({
  etiket,
  htmlFor,
  yardim,
  hata,
  className,
  children,
}: {
  etiket: React.ReactNode;
  htmlFor: string;
  yardim?: React.ReactNode;
  hata?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {etiket}
      </label>
      {children}
      {hata ? (
        <p className="text-sm text-danger" role="alert">
          {hata}
        </p>
      ) : (
        yardim && <p className="text-sm text-ink-3">{yardim}</p>
      )}
    </div>
  );
}
