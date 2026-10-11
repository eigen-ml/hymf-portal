// Hesap kılavuzları: icerik/kilavuzlar/ altındaki dosyalar. Dosya adları burada sabit; yalnız bu listedeki
// dosyalar indirilebilir (bkz. src/app/kilavuzlar/dosya/[ad]/route.ts).

export interface KilavuzDosyasi {
  /** icerik/kilavuzlar/ altındaki dosya adı. */
  dosya: string;
  baslik: string;
  aciklama: string;
  /** Sayfa sayısı (PDF) veya kısa tür bilgisi. */
  bilgi: string;
  tur: 'pdf' | 'veri';
}

export const KILAVUZLAR: readonly KilavuzDosyasi[] = [];
