import React from 'react';
import { cn } from '@/lib/cn';

type Ton = 'bilgi' | 'uyari' | 'basari' | 'tehlike';

const tonlar: Record<Ton, string> = {
  bilgi: 'bg-info-soft text-info border-info/20',
  uyari: 'bg-warn-soft text-warn border-warn/20',
  basari: 'bg-ok-soft text-ok border-ok/20',
  tehlike: 'bg-danger-soft text-danger border-danger/20',
};

export function Uyari({
  tone = 'bilgi',
  baslik,
  className,
  children,
}: {
  tone?: Ton;
  baslik?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role={tone === 'tehlike' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm leading-6', tonlar[tone], className)}
    >
      {baslik && <p className="font-semibold">{baslik}</p>}
      {children && <div className={baslik ? 'mt-1' : undefined}>{children}</div>}
    </div>
  );
}
