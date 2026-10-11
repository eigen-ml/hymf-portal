import React from 'react';
import { cn } from '@/lib/cn';

export function SayfaBasligi({
  baslik,
  aciklama,
  eylemler,
  className,
}: {
  baslik: React.ReactNode;
  aciklama?: React.ReactNode;
  eylemler?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4 pb-2', className)}>
      <div className="max-w-prose">
        <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">{baslik}</h1>
        {aciklama && <p className="mt-2 text-lg text-ink-2">{aciklama}</p>}
      </div>
      {eylemler && <div className="flex flex-wrap items-center gap-2">{eylemler}</div>}
    </header>
  );
}
