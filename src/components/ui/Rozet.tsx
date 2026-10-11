import React from 'react';
import { cn } from '@/lib/cn';

export type RozetTonu = 'notr' | 'bilgi' | 'uyari' | 'basari' | 'inceleme' | 'tehlike';

const tonlar: Record<RozetTonu, string> = {
  notr: 'bg-sunken text-ink-2',
  bilgi: 'bg-info-soft text-info',
  uyari: 'bg-warn-soft text-warn',
  basari: 'bg-ok-soft text-ok',
  inceleme: 'bg-review-soft text-review',
  tehlike: 'bg-danger-soft text-danger',
};

export function Rozet({
  tone = 'notr',
  className,
  children,
}: {
  tone?: RozetTonu;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ring-current/15',
        tonlar[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
