'use client';

import React, { useSyncExternalStore } from 'react';
import { KodDegiskenleri } from '@/components/KodDegiskenleri';
import { Alan, inputSinifi } from '@/components/ui';

// TRUBA kullanıcı adı yalnız bu tarayıcıda tutulur; sunucuya gitmez.
const ANAHTAR = 'hymf-truba-kullanici';
const IZINLI = /[^A-Za-z0-9_-]/g;

// localStorage okunamıyor ya da yazılamıyorsa (gizli pencere vb.) değer oturum boyunca bellekte kalır.
let bellek = '';
const dinleyiciler = new Set<() => void>();

function oku(): string {
  try {
    const v = localStorage.getItem(ANAHTAR);
    return v === null ? bellek : v.replace(IZINLI, '');
  } catch {
    return bellek;
  }
}

function yaz(deger: string) {
  bellek = deger;
  try {
    if (deger) localStorage.setItem(ANAHTAR, deger);
    else localStorage.removeItem(ANAHTAR);
  } catch {
    // Kayıt yoksa değer yalnız bu oturumda geçerli olur.
  }
  dinleyiciler.forEach((f) => f());
}

function abone(degisti: () => void) {
  dinleyiciler.add(degisti);
  return () => {
    dinleyiciler.delete(degisti);
  };
}

function useKullaniciAdi(): string {
  return useSyncExternalStore(abone, oku, () => '');
}

/** İçindeki bütün kod bloklarında `kullanici_adiniz` girilen adla dolar. */
export function KullaniciAdiSaglayici({ children }: { children: React.ReactNode }) {
  const ad = useKullaniciAdi();
  return <KodDegiskenleri.Provider value={{ kullanici_adiniz: ad }}>{children}</KodDegiskenleri.Provider>;
}

export function KullaniciAdiKutusu() {
  const ad = useKullaniciAdi();

  return (
    <div className="rounded-lg border border-line bg-surface p-6">
      <Alan
        etiket="TRUBA kullanıcı adınız"
        htmlFor="truba-kullanici"
        yardim={
          ad
            ? 'Sayfadaki komutlar bu adla doldu; Kopyala düğmesi de doldurulmuş hâlini kopyalar. Ad yalnız bu tarayıcıda saklanır.'
            : 'Kendi kullanıcı adınızı yazın, komutlar ona göre dolsun.'
        }
      >
        <input
          id="truba-kullanici"
          type="text"
          value={ad}
          onChange={(e) => yaz(e.target.value.replace(IZINLI, '').slice(0, 32))}
          placeholder="kullanici_adiniz"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${inputSinifi} font-mono sm:max-w-sm`}
        />
      </Alan>
    </div>
  );
}
