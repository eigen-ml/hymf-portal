import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

// public/hymf-logo.png: hymf.ankara.edu.tr'deki özgün dosya (499×488, şeffaf zemin, kendi beyaz halkası var).
const EN = 499;
const BOY = 488;

/**
 * Grubun yuvarlak logosu. Küçük boyda okunmadığı için Navbar ve sekme simgesinde kullanılmaz,
 * orada `MarkaIsareti` (Ψ) kalır. Arkasına kutu veya gölge konmaz.
 */
export function GrupLogosu({
  genislik,
  className,
  ustte = false,
}: {
  /** Piksel; yükseklik orandan hesaplanır. */
  genislik: number;
  className?: string;
  /** Sayfanın ilk ekranındaysa hemen yüklensin. */
  ustte?: boolean;
}) {
  return (
    <Image
      src="/hymf-logo.png"
      alt="HYMF araştırma grubu logosu"
      width={genislik}
      height={Math.round((genislik * BOY) / EN)}
      loading={ustte ? 'eager' : undefined}
      className={cn('shrink-0', className)}
    />
  );
}
