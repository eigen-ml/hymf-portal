'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function Sekmeler({ sekmeler }: { sekmeler: { href: string; etiket: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Bölümler" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max min-w-0 gap-1 rounded-xl bg-sunken p-1">
        {sekmeler.map((s) => {
          const aktif = pathname === s.href;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={aktif ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center rounded-lg px-4 text-sm transition-colors',
                  aktif ? 'bg-surface font-semibold text-ink shadow-panel' : 'font-medium text-ink-2 hover:bg-surface/60 hover:text-ink'
                )}
              >
                {s.etiket}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
