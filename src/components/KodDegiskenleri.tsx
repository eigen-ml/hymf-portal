'use client';

import { createContext, useContext } from 'react';

/**
 * Kod bloklarındaki yer tutucuların dolduğu değerler, ör. { kullanici_adiniz: 'ayse' }.
 * Değeri boş olan anahtar olduğu gibi kalır. Sıra önemlidir: uzun anahtar (ör. '[kullanici_adiniz]') önce yazılmalı.
 */
export const KodDegiskenleri = createContext<Record<string, string>>({});

export function doldur(metin: string, degiskenler: Record<string, string>): string {
  let sonuc = metin;
  for (const [anahtar, deger] of Object.entries(degiskenler)) {
    if (deger) sonuc = sonuc.split(anahtar).join(deger);
  }
  return sonuc;
}

export function useDoldur(): (metin: string) => string {
  const degiskenler = useContext(KodDegiskenleri);
  return (metin) => doldur(metin, degiskenler);
}
