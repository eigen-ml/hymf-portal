'use client';

import React, { useSyncExternalStore } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAcilir } from '@/components/ui/useAcilir';

/*
 * Üç kip: Sistem (varsayılan), Açık, Koyu. Seçim localStorage['hymf-tema'] içinde 'light' veya
 * 'dark' olarak tutulur, Sistem'de kayıt silinir. <html data-theme> öz niteliğini ilk boyamadan
 * önce layout.tsx'teki betik ayarlar; burada yalnız kullanıcı değiştirince güncellenir.
 */

type Tema = 'system' | 'light' | 'dark';

const ANAHTAR = 'hymf-tema';

const secenekler: { deger: Tema; etiket: string; ipucu: string; Ikon: typeof Sun }[] = [
  { deger: 'system', etiket: 'Sistem', ipucu: 'Cihazınızın ayarını izler', Ikon: Monitor },
  { deger: 'light', etiket: 'Açık', ipucu: 'Her zaman açık renkler', Ikon: Sun },
  { deger: 'dark', etiket: 'Koyu', ipucu: 'Her zaman koyu renkler', Ikon: Moon },
];

// localStorage yazılamıyorsa (gizli pencere vb.) seçim oturum boyunca bellekte tutulur.
let bellek: Tema | null = null;
const dinleyiciler = new Set<() => void>();

function oku(): Tema {
  try {
    const v = localStorage.getItem(ANAHTAR);
    if (v === 'light' || v === 'dark') return v;
    return bellek ?? 'system';
  } catch {
    return bellek ?? 'system';
  }
}

function uygula(tema: Tema) {
  const kok = document.documentElement;
  if (tema === 'system') kok.removeAttribute('data-theme');
  else kok.setAttribute('data-theme', tema);
}

function sec(tema: Tema) {
  bellek = tema;
  try {
    if (tema === 'system') localStorage.removeItem(ANAHTAR);
    else localStorage.setItem(ANAHTAR, tema);
  } catch {
    // Kayıt yoksa seçim yalnız bu oturumda geçerli olur.
  }
  uygula(tema);
  dinleyiciler.forEach((f) => f());
}

function abone(degisti: () => void) {
  dinleyiciler.add(degisti);
  // Başka sekmede tema değişince bu sekme de uyar.
  const depo = (e: StorageEvent) => {
    if (e.key === ANAHTAR || e.key === null) {
      bellek = null;
      uygula(oku());
      degisti();
    }
  };
  window.addEventListener('storage', depo);
  return () => {
    dinleyiciler.delete(degisti);
    window.removeEventListener('storage', depo);
  };
}

function useTema(): Tema {
  return useSyncExternalStore(abone, oku, () => 'system');
}

/**
 * Tema seçici.
 * `kompakt` (varsayılan): tek düğme, tıklayınca etiketli üç seçenek açılır (üst çubuk için).
 * `tam`: üç etiketli düğme yan yana, hep açık (mobil menü için).
 */
export function TemaSecici({
  varyant = 'kompakt',
  className,
}: {
  varyant?: 'kompakt' | 'tam';
  className?: string;
}) {
  const tema = useTema();
  const { acik, setAcik, kap } = useAcilir();
  const gecerli = secenekler.find((s) => s.deger === tema) ?? secenekler[0];

  if (varyant === 'tam') {
    return (
      <div role="group" aria-label="Tema" className={cn('grid grid-cols-3 gap-1 rounded-xl bg-sunken p-1', className)}>
        {secenekler.map(({ deger, etiket, Ikon }) => {
          const secili = tema === deger;
          return (
            <button
              key={deger}
              type="button"
              aria-pressed={secili}
              onClick={() => sec(deger)}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors',
                secili ? 'bg-surface text-ink shadow-panel' : 'text-ink-2 hover:text-ink'
              )}
            >
              <Ikon className={cn('size-4', secili && 'text-accent-ink')} aria-hidden="true" />
              {etiket}
            </button>
          );
        })}
      </div>
    );
  }

  const GecerliIkon = gecerli.Ikon;
  return (
    <div className={cn('relative', className)} ref={kap}>
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        aria-haspopup="true"
        aria-label={`Tema: ${gecerli.etiket}. Değiştirmek için açın`}
        title="Tema"
        className="inline-flex size-10 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
      >
        <GecerliIkon className="size-5" aria-hidden="true" />
      </button>
      {acik && (
        <div role="group" aria-label="Tema" className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          <p className="px-3 pb-1 pt-1.5 text-sm font-semibold text-ink-3">Tema</p>
          {secenekler.map(({ deger, etiket, ipucu, Ikon }) => {
            const secili = tema === deger;
            return (
              <button
                key={deger}
                type="button"
                aria-pressed={secili}
                onClick={() => {
                  sec(deger);
                  setAcik(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  secili ? 'bg-accent-soft text-accent-ink' : 'text-ink hover:bg-sunken'
                )}
              >
                <Ikon className="size-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm', secili ? 'font-semibold' : 'font-medium')}>{etiket}</span>
                  <span className={cn('block text-sm', secili ? 'text-accent-ink' : 'text-ink-3')}>{ipucu}</span>
                </span>
                {secili && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
