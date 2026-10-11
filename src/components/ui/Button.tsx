import React from 'react';
import { cn } from '@/lib/cn';

type Varyant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Boyut = 'sm' | 'md' | 'lg';

const temel =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-[background-color,box-shadow,color] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50';

const varyantlar: Record<Varyant, string> = {
  primary: 'bg-accent text-on-accent shadow-panel hover:bg-accent-strong',
  secondary: 'border border-line-strong bg-surface text-ink shadow-panel hover:bg-sunken',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink',
  danger: 'bg-danger text-on-primary shadow-panel hover:bg-danger/90',
};

const boyutlar: Record<Boyut, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonStili {
  variant?: Varyant;
  size?: Boyut;
  className?: string;
}

/** Buton görünümlü bağlantılar için sınıf. */
export function buttonClass({ variant = 'secondary', size = 'md', className }: ButtonStili = {}) {
  return cn(temel, varyantlar[variant], boyutlar[size], className);
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStili;

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
