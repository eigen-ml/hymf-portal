// Hesap kılavuzları: icerik/kilavuzlar/ altındaki dosyalar. Dosya adları burada sabit; yalnız bu listedeki
// dosyalar indirilebilir (bkz. src/app/kilavuzlar/dosya/[ad]/route.ts). PDF kaynakları: docs/kilavuz-kaynak/.

export interface KilavuzDosyasi {
  /** icerik/kilavuzlar/ altındaki dosya adı. */
  dosya: string;
  baslik: string;
  aciklama: string;
  /** Sayfa sayısı (PDF) veya kısa tür bilgisi. */
  bilgi: string;
  tur: 'pdf' | 'veri';
}

export const KILAVUZLAR: readonly KilavuzDosyasi[] = [
  {
    dosya: 'komutlar.pdf',
    baslik: 'Sık kullanılan komutlar',
    aciklama: 'İş gönderme, dosya işlemleri, POTCAR, phonopy, vaspkit kodları ve Bader komutları tek sayfada.',
    bilgi: '2 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'bant-yapisi.pdf',
    baslik: 'Bant yapısı hesabı',
    aciklama: 'Öz-tutarlı (SC) hesap, yüksek simetri yolunda NSC hesap (VASPKIT 302) ve vaspkit ile bant grafiği.',
    bilgi: '9 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'dos.pdf',
    baslik: 'Durum yoğunluğu (DOS) hesabı',
    aciklama: 'İki adımlı hesap, VASPKIT 11 → 111 ile TDOS.dat ve Origin\'de yumuşatma.',
    bilgi: '6 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'fonon.pdf',
    baslik: 'Fonon hesabı (phonopy)',
    aciklama: 'phonopy VASP-DFPT adımları, süper hücre ve band.conf, grubun kullandığı komut sırası.',
    bilgi: '5 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'optik.pdf',
    baslik: 'Optik hesapları',
    aciklama: 'İki klasörlü hesap, VASPKIT 71 → 710 ile IMAG.in ve ε2(ω) grafiği.',
    bilgi: '4 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'bader.pdf',
    baslik: 'Bader yük analizi',
    aciklama: 'CHGCAR_sum oluşturma, bader programı, ZVAL ile net yükün hesabı.',
    bilgi: '4 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'yuk-yogunlugu-farki.pdf',
    baslik: 'Yük yoğunluğu farkı hesabı',
    aciklama: 'Aynı ızgarada üç CHGCAR ve VESTA\'da çıkarma ile yük yoğunluğu farkı haritası.',
    bilgi: '5 sayfa',
    tur: 'pdf',
  },
  {
    dosya: 'POSCAR_SnSSe.vasp',
    baslik: 'POSCAR_SnSSe.vasp',
    aciklama: 'Örnek SnSSe 4×4 hücresi (48 atom), Bader kılavuzunda kullanılıyor.',
    bilgi: 'VASP yapı dosyası',
    tur: 'veri',
  },
];
