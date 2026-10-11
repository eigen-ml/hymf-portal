'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Açılır menü durumu: dışarı tıklanınca veya Escape'e basılınca kapanır.
 * `kap` menünün (düğme + panel) kapsayıcısına verilir.
 */
export function useAcilir() {
  const [acik, setAcik] = useState(false);
  const kap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const disTik = (e: MouseEvent) => {
      if (kap.current && !kap.current.contains(e.target as Node)) setAcik(false);
    };
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAcik(false);
    };
    document.addEventListener('mousedown', disTik);
    document.addEventListener('keydown', tus);
    return () => {
      document.removeEventListener('mousedown', disTik);
      document.removeEventListener('keydown', tus);
    };
  }, [acik]);

  return { acik, setAcik, kap };
}
