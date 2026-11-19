import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

// public/hymf-logo.png: grubun yeniden çizdiği vektör logodan (logo_tam_renk_6000px.png) 1000×1000'e küçültüldü.
// Şeffaf zemin, kendi beyaz halkası var. Eski dosya hymf.ankara.edu.tr'deki 499×488 sürümdü.
const EN = 1000;
const BOY = 1000;

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
