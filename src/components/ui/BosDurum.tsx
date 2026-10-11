import React from 'react';
import { cn } from '@/lib/cn';

export function BosDurum({
  baslik,
  aciklama,
  eylem,
  className,
}: {
  baslik: React.ReactNode;
  aciklama?: React.ReactNode;
  eylem?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-dashed border-line-strong bg-surface/60 px-5 py-8 sm:px-6 sm:py-10', className)}>
      <p className="text-lg font-bold text-ink">{baslik}</p>
      {aciklama && <p className="mt-1 max-w-prose text-base text-ink-2">{aciklama}</p>}
      {eylem && <div className="mt-5">{eylem}</div>}
    </div>
  );
}
