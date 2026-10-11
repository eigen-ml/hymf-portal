import React from 'react';
import { cn } from '@/lib/cn';
import { basHarfler } from '@/lib/etiketler';

const boyutlar = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
};

// Kişiye göre sabit, yumuşak bir renk (kırmızı kalem yalnız danışman geri bildirimine ayrıldığı için yok).
const renkler = [
  'bg-accent-soft text-accent-ink',
  'bg-info-soft text-info',
  'bg-review-soft text-review',
  'bg-ok-soft text-ok',
  'bg-warn-soft text-warn',
];

function renkSec(ad: string) {
  let h = 0;
  for (let i = 0; i < ad.length; i++) h = (h * 31 + ad.charCodeAt(i)) >>> 0;
  return renkler[h % renkler.length];
}

export function BasHarfAvatar({
  ad,
  size = 'md',
  className,
}: {
  ad: string;
  size?: keyof typeof boyutlar;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold ring-1 ring-inset ring-current/15',
        renkSec(ad),
        boyutlar[size],
        className
      )}
    >
      {basHarfler(ad)}
    </span>
  );
}
