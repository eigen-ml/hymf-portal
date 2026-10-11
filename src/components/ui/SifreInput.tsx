'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { inputSinifi } from './form';

/** Şifre alanı; sağdaki butonla yazılan şifre gösterilir/gizlenir. */
export function SifreInput({ className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [goster, setGoster] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={goster ? 'text' : 'password'} className={cn(inputSinifi, 'pr-12', className)} />
      <button
        type="button"
        onClick={() => setGoster((g) => !g)}
        aria-label={goster ? 'Şifreyi gizle' : 'Şifreyi göster'}
        title={goster ? 'Şifreyi gizle' : 'Şifreyi göster'}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {goster ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
