# HYMF Portal tasarım rehberi

Bir araştırma grubunun iç aracı. Kullanıcıların çoğu öğretim üyesi, ekrana haftada birkaç dakika
bakıyor ve tek bir soruya cevap arıyor: "Kim ne yapıyor, kim takıldı?" Okunabilirlik gösterişten
önce gelir. Hissi modern, sakin ve net bir uygulama: Gilroy yazı tipi, yumuşak köşeler, ince
gölge, tek bir marka vurgusu (cerulean mavi). Hem açık hem koyu tema var, kullanıcı seçer.

## 1. İlkeler

1. **Önce sadelik.** Büyük, açık etiketli butonlar (en az 40 px yükseklik), gizli menü yok,
   sürükle-bırak yok, çok adımlı sihirbaz yok. Seyrek bakılan sayfalar "Diğer" menüsünde, günlük işler
   üst çubukta.
2. **Tek marka rengi.** Vurgu `accent` (mavi): birincil buton, aktif gezinti, odak halkası. Sayfada
   birincil buton en çok bir tane. Gerisi nötr (`ink`, `surface`, `sunken`).
3. **İki mürekkep.** Öğrencinin yazdığı her şey mavi-siyah mürekkeple (`ink`), danışmanın geri
   bildirimi kırmızı kalemle (`pen`). Kırmızı kalem yalnız danışman geri bildirimi içindir; uyarı,
   hata veya marka rengi olarak kullanılmaz.
4. **Defter düzeni.** Zaman akışı (ilerleme notları ve geri bildirimler) sol kenar boşluğunda tarih,
   ince bir kenar çizgisi ve sağda metin olarak dizilir. Kart yığını değildir.
5. **Satır, kart değil.** Plan maddeleri, üyeler ve pano satırları çizgili satırlardır. Kart yalnız
   bir bölümü çevrelemek için (`Panel`) kullanılır, her öğeye kart verilmez.
6. **Sakin uyarı.** Gecikme ve hareketsizlik okra (`warn`) renginde, metinle söylenir ("12 gün
   önce"). Kırmızı alarm, yanıp sönen nokta, parlama yok.
7. **Az ve düz metin.** Kısa, Türkçe, cümle düzeninde. Bir eylem her yerde aynı adla geçer
   ("Kaydet" → "Kaydedildi").

## 2. Renk token'ları ve tema

`src/app/globals.css` içinde CSS değişkeni olarak tanımlı, Tailwind'e `@theme inline` ile
bağlıdır. Sınıf adı = token adı: `bg-paper`, `text-ink-2`, `border-line`, `bg-warn-soft` …

**Üç tema kipi:** Sistem (varsayılan, işletim sistemi tercihini izler), Açık, Koyu. Seçim
`localStorage['hymf-tema']` içinde `light` veya `dark` olarak durur (Sistem'de kayıt yok).
`layout.tsx` içindeki küçük satır içi betik, ilk boyamadan önce `<html data-theme="light|dark">`
yazar; öznitelik yokken `@media (prefers-color-scheme: dark)` geçerlidir. Seçici
`src/components/TemaSecici.tsx`: üst çubukta tek düğme (tıklayınca etiketli üç seçenek),
mobil menüde üç etiketli düğme (`varyant="tam"`).

Bileşende `dark:` sınıfı yazılmaz, renkler token'dan gelir. Koyu değerler `globals.css`'te iki yerde
durur (medya sorgusu ve `:root[data-theme="dark"]`); birini değiştirince ötekini de değiştirin.

| Token | Açık | Koyu | Kullanım |
| --- | --- | --- | --- |
| `paper` | `#F3F6FA` | `#0A0E15` | Sayfa zemini |
| `surface` | `#FFFFFF` | `#121823` | Panel, tablo, menü, üst çubuk zemini |
| `sunken` | `#E9EEF5` | `#1A2230` | Tablo başlığı, hover, seçili satır, sekme zemini, kod |
| `line` | `#DAE1EB` | `#262F3F` | Ayırıcı çizgiler, panel kenarı |
| `line-strong` | `#BCC6D5` | `#364258` | Defter kenar çizgisi, vurgulu ayırıcı |
| `control` | `#78849A` | `#66748C` | Form alanı kenarı (≥ 3:1) |
| `ink` | `#0E1628` | `#E8ECF4` | Ana metin, başlıklar |
| `ink-2` | `#384358` | `#B4BECF` | İkincil metin, etiketler |
| `ink-3` | `#546075` | `#8A96AB` | Yardımcı metin, tarih, sayaç |
| `accent` | `#0B65B0` | `#5AB0F5` | Marka vurgusu: birincil buton, odak, ilerleme çubuğu |
| `accent-strong` | `#09539A` | `#7DC0F8` | Birincil buton hover |
| `accent-soft` | `#E1EFFB` | `#112B45` | Aktif gezinti zemini, seçili öğe |
| `accent-ink` | `#0A5393` | `#86C5FA` | `accent-soft` üstünde ve zemin üstünde vurgulu metin |
| `on-accent` | `#FFFFFF` | `#06121F` | `accent` zemini üstünde metin |
| `link` | `#0A5393` | `#86C5FA` | Bağlantılar |
| `primary` / `on-primary` | `accent` ile aynı | `accent` ile aynı | Eski ad; `accent` ile aynı değer. Yeni kodda `accent` |
| `pen` / `pen-soft` | `#9A2232` / `#FBEEF0` | `#EE98A3` / `#33191F` | Yalnız danışman geri bildirimi |
| `info` / `info-soft` | `#1F4F8C` / `#E7EFFA` | `#9DBCEB` / `#1A2738` | "Devam ediyor" |
| `warn` / `warn-soft` | `#7F4A00` / `#FBF0DA` | `#E3B465` / `#33270F` | Gecikmiş, takıldı, 7 günden eski |
| `ok` / `ok-soft` | `#2C6639` / `#E5F2E8` | `#8FCB9C` / `#16291B` | Tamamlandı, kaydedildi |
| `review` / `review-soft` | `#5A3D93` / `#F0EBF9` | `#BFA8EA` / `#261F38` | "İncelemede" |
| `danger` / `danger-soft` | `#AE2318` / `#FCEBE9` | `#F19A90` / `#3A1A17` | Silme onayı, form hatası |

Gölge token'ları: `shadow-panel` (panel, buton, alan; çok ince) ve `shadow-pop` (açılır menü,
yüzen katman). Kendi gölgenizi yazmayın.

Tüm metin token'ları kendi zemininde (paper, surface, sunken, `*-soft`, `accent-soft`) WCAG AA
4.5:1'i her iki temada geçer (ölçüldü: en düşük 5.14, açıkta `primary`/`sunken`; koyuda 5.35,
`ink-3`/`sunken`). `on-accent`/`accent` açıkta 6.0, koyuda 8.1. Yeni renk eklerken iki temayı da
ölçün.

Plan durumu → renk: `planlandi` nötr (`sunken` + `ink-2`), `devam_ediyor` info, `takildi` warn,
`incelemede` review, `tamamlandi` ok, `iptal` `ink-3` + üstü çizili. Bu eşleme yalnız
`DurumRozeti` içinde yaşar.

## 3. Tipografi

Tek yazı tipi ailesi: **Gilroy** (`src/app/fonts/`, `next/font/local`, değişken `--font-gilroy`).
Kesimler: Regular 400, Medium 500, Bold 700, Heavy 800. İtalik kesim yok. Kod için JetBrains Mono.
Gilroy'da `₺`, `Ψ`, `✓`, `▸` yok; bu işaretler sistem yazı tipine düşer (Navbar'daki Ψ işareti bu
yüzden çizgi olarak çizilir: `MarkaIsareti`).

Gilroy'un x-yüksekliği Inter'den yaklaşık %8 küçük olduğu için kök yazı boyutu %106,25 (17 px)
yapıldı; `rem` tabanlı her ölçü birlikte büyür, tarayıcının yazı boyutu ayarına saygı gösterir.

| Rol | Kesim | Sınıf |
| --- | --- | --- |
| Sayfa başlığı (h1) | Gilroy Bold | `font-serif text-3xl sm:text-4xl` (`SayfaBasligi`) |
| Bölüm başlığı (h2), panel başlığı | Gilroy Bold | `text-xl font-bold` (`Panel`) |
| Alt başlık (h3) | Gilroy Bold | `text-lg font-bold` |
| Okuma metni (notlar, özet) | Gilroy Regular | `text-base leading-7` |
| Arayüz, tablo | Gilroy Regular/Medium | `text-sm` |
| Form alanı | Gilroy Regular | `text-base` (16 px altı iOS'ta yakınlaştırır) |
| Form etiketi, buton | Gilroy Bold | `text-sm font-semibold` |
| Rozet | Gilroy Bold | `text-xs font-semibold` (bu boyut yalnız rozette) |
| Tez başlığı | Gilroy Bold | `font-serif text-xl sm:text-2xl` (italik verilse de düz çıkar) |
| Yol, iş no, kod | JetBrains Mono | `font-mono text-sm` |

`font-serif` sınıfı eski adıyla kaldı: artık serif değil, **Gilroy Bold** (ağırlık 700, harf
aralığı -0,02em) verir. h1 ve h2 harf aralığı hafif sıkıdır, başlıklar `text-wrap: balance` ile
dengelenir. `font-semibold` ve üstü Bold kesimine, `font-medium` Medium'a düşer (600 için ayrı
kesim yok).

Ölçek 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36. Sayılar, tarihler ve sayaçlar `tabular-nums`. Okuma
sütunu en fazla `max-w-prose` (≈ 65 karakter).

## 4. Boşluk, yüzey, köşe

- Boşluk ölçeği 4 px tabanlı: `1, 2, 3, 4, 6, 8, 12, 16` (Tailwind birimi). Bölümler arası
  `space-y-8`, panel içi `p-5 sm:p-6`, satır içi `py-3`/`py-4`.
- Köşe yarıçapı hiyerarşisi: panel, menü, uyarı ve boş durum `rounded-xl` (12 px); buton, form alanı,
  gezinti bağlantısı ve sekme `rounded-lg` (8 px); rozet ve avatar `rounded-full`. Başka yarıçap yok.
- Panel ve butonlarda `shadow-panel` (çok ince), açılır menü ve yüzen katmanlarda `shadow-pop`.
  Kenar çizgisi gölgeyle birlikte durur. Renkli veya büyük gölge yok.
- Dokunma hedefi en az 40 px: buton `md` 44 px, `sm` 36 px (yalnız sıkışık satırlarda), `lg` 48 px,
  gezinti bağlantısı 40 px, mobil menü satırı 48 px.
- Sayfa genişliği `max-w-6xl`; tablo ağırlıklı sayfalar `max-w-7xl`.
- Sayfa zemininde tepede çok hafif bir marka ışıması var (`body` arka planı); başka gradient yok.
- Mobil: 390 px'te yatay kaydırma yok. Tablolar küçük ekranda satır kartına döner (bkz. §6 Tablo).
  Sayfa kenar boşluğu `px-4`.

## 5. Yerleşim taslakları

Navbar (tek satır, `surface` zemin, ince gölge; `lg` altında tam genişlik sayfa menüsü):

```
[Ψ] HYMF Portal  Pano Takvim Görevler Duyurular Toplantılar Diğer ▾      Öğrencilerim  Yönetim  [tema]  (AÖ)
```

"Diğer" altında: Kılavuzlar, Formlar, Kaynaklar, Dersler, Üyeler. Girişsiz veya onaysız ziyaretçi
yalnız marka bağlantısını (ana sayfa) ve "Giriş yap"ı görür. Mobilde menü düğmesi, çubuğun altında
tam genişlikte, büyük satırlı bir sayfa açar (Diğer ve kişisel bağlantılar iki sütun, en altta tema
seçici); arkası kararır, Escape ve dışarı tıklama kapatır.

Öğrenci çalışma alanı:

```
Tez başlığı (Gilroy Bold)                               [Düzenle]
Danışman: Y. Moğulkoç   Özet metni (en çok 3 satır)     Drive klasörü

┌ Plan ─────────────────────────────── [Madde ekle] ┐  ┌ Bu hafta ne yaptım ───────┐
│ Gecikmiş (2)                                       │  │ [metin alanı]             │
│  ○ Bant yapısı hesabı    3 gün gecikti  Devam ed.  │  │ Madde: [seç]   [Kaydet]   │
│ Açık (4)                                           │  └───────────────────────────┘
│  ○ ...                                             │  Defter
│ Tamamlanan (5)  ▸                                  │  9 Eki │ Ata: Fonon hesabı ...
└────────────────────────────────────────────────────┘  7 Eki ┃ Y. Moğulkoç: k-nokta ...  (kırmızı kalem)
Dosyalar (tablo)                     İşlem geçmişi (katlanır)
```

Danışman panosu (hocanın ana ekranı):

```
Öğrencilerim                                   [YL] [DR]
Öğrenci          Program  Danışman       Açık  Gecikmiş  İlerleme      Son güncelleme
Sibel Dumamak    YL       Y. Moğulkoç       4         1  ━━━━━━─── 60%  2 gün önce
Mert Tuna        YL       Y. Moğulkoç       3         0  ━━──────── 20%  12 gün önce   (okra)
```

Yönetim paneli: üstte sekmeler (Üyeler, Davet listesi, Yetkiler, İşlem geçmişi), altta tek tablo.
Onay bekleyenler tablonun üstünde ayrı, kısa bir bölüm.

## 6. Bileşenler (`src/components/ui/`)

Yeni sayfalar bu bileşenleri kullanır, aynı işi gören yeni bir stil yazmaz.

| Bileşen | Ne zaman |
| --- | --- |
| `SayfaBasligi` | Her sayfanın üstü: `baslik`, opsiyonel `aciklama` (tek cümle) ve `eylemler`. Üstte etiket yok. |
| `Panel` | Bir bölümü çevreler: `baslik`, `aciklama`, `eylemler`, `children`. İç içe panel yok. |
| `Button` / `buttonClass()` | `variant`: `primary` (sayfada en çok bir tane), `secondary`, `ghost`, `danger`. `size`: `sm` (36 px, sıkışık satır), `md` (44 px, varsayılan), `lg` (48 px, sayfanın ana eylemi). Link görünümlü buton için `buttonClass`. |
| `Rozet` | Kısa durum etiketi (hap biçimli). `tone`: `notr`, `bilgi`, `uyari`, `basari`, `inceleme`, `tehlike`. Nokta veya ikon yok. |
| `DurumRozeti` | Plan durumu. Rengi kendisi seçer. |
| `YetkiRozeti` | Yalnız `admin` ve `superadmin` için görünür; `uye` için hiçbir şey çizmez. |
| `BasHarfAvatar` | Kişi göstergesi, ada göre sabit yumuşak renk. Fotoğraf kullanılmaz. |
| `MarkaIsareti` | Mavi yuvarlak karede Ψ (çizgi olarak çizili). Navbar ve Footer'da; başka yerde kullanılmaz. |
| `TemaSecici` (`src/components/`) | Sistem / Açık / Koyu seçimi. Navbar'da bulunur, sayfaya ayrıca konmaz. |
| `BosDurum` | Boş liste: ne olduğunu söyleyen başlık, ne yapılacağını söyleyen tek cümle, opsiyonel eylem. |
| `Uyari` | Satır içi bilgi/hata kutusu. `tone`: `bilgi`, `uyari`, `basari`, `tehlike`. |
| `Alan` + `inputSinifi` / `textareaSinifi` / `selectSinifi` | Form alanı: etiket üstte, yardım metni altta `ink-3`, hata altta `danger`. |
| `Sekmeler` | Sayfa içi gezinme (Link tabanlı), `sunken` zeminde hap biçimli sekmeler, aktif sekme beyaz ve gölgeli. |
| `ErisimEngellendi` | 403 durumu. Kısa metin, "Kendi çalışma alanıma dön" veya "Ana sayfa" bağlantısı. |
| `OrnekVeriNotu` | Mock veriyle çalışan sayfaların üstünde tek satırlık not. |

Kurallar:

- **Tablo**: başlık satırı `bg-sunken text-ink-2 text-sm font-medium`, satırlar `border-t border-line`,
  hücre `px-4 py-3`, sayılar sağa yaslı `tabular-nums`. Satır hover `bg-sunken/60`. Tıklanabilir
  satırda tüm satır bir `Link`. `md` altında tablo gizlenir, aynı veri `divide-y` liste olarak
  gösterilir (ad üstte, sayılar altta tek satır).
- **Form**: etiket her zaman görünür ve kalın (placeholder etiket yerine geçmez). Alan metni
  16 px (`text-base`). Birincil buton formun sonunda solda. Kaydedince buton metni kısa süre "Kaydedildi" olur veya `Uyari tone="basari"`
  çıkar; toast yok.
- **Boş durum**: başlık ("Henüz plan maddesi yok"), tek cümle yönlendirme ("Danışmanınız madde
  ekleyince burada görünür. Kendi maddenizi de ekleyebilirsiniz."), varsa tek buton. İkon, çizim yok.
- **İkon**: lucide, yalnız eylem butonlarında ve anlam taşıdığı yerde (indir, sil, dış bağlantı,
  menü). Başlıkların önüne ikon konmaz. Boyut `size-4`, renk metinle aynı.
- **Tarih**: `src/lib/zaman.ts`. Akışta göreli ("3 gün önce"), `title` niteliğinde tam tarih. Son
  tarih "3 gün kaldı" / "2 gün gecikti". Zaman damgasını render eden öğeye
  `suppressHydrationWarning`.
- **Kişi adı**: listede tam ad; danışman sütununda `kisaAd()` ("Y. Moğulkoç"). Unvan varsa adın
  önüne, ayrı stil vermeden.
- **Odak**: tüm etkileşimli öğelerde görünür odak halkası (globals.css'te `:focus-visible`).
  `outline-none` yazılırsa yerine `focus-visible:ring-2 ring-accent` konur.
- **Açılır menü**: yalnız tıklayınca açılır (üzerine gelince değil), dışarı tıklama ve Escape kapatır
  (`useAcilir` kancası). İçerik gerçek bağlantı/düğmedir, Tab ile gezilir.
- **Hareket**: yalnız kullanıcı eylemine cevap (açılır panel, katlanır grup, buton basma). Sayfa
  açılışında animasyon yok. `prefers-reduced-motion` globals.css'te kapalı.

## 7. Metin

- Türkçe, cümle düzeni, kısa. "Notu kaydet", "Madde ekle", "Danışman ata", "Pasifleştir".
- İngilizce jargon yok: "Audit trail" değil **İşlem geçmişi**, "Dashboard" değil **Pano**, "Upload"
  değil **Yükle**, "RBAC" hiçbir yerde.
- Parantezli teknik açıklama yok: "Notu ilet (logla)" değil "Notu kaydet".
- Güvenliği öven metin yok ("şifrelenmiş özel alan", "RBAC aktif"). Erişim kısıtını gerektiği yerde
  bir kez, düz söyle: "Bu alanı yalnız siz ve danışmanınız görür."
- Hata mesajı ne olduğunu ve ne yapılacağını söyler, özür dilemez: "Dosya 25 MB'tan büyük. Büyük
  çıktılar için TRUBA yolunu plan maddesine yazın."
- Sayı + birim: "4 açık madde", "%60" (Türkçe yüzde işareti önde).

## 8. Yapma listesi

- Başlıkların önüne ikon koyma.
- BÜYÜK HARF etiket, `tracking-[0.14em] uppercase` başlık üstü etiketi, mono etiket yazma.
- `text-[10px]`, `text-[11px]`, `text-[13px]` gibi keyfi boyut kullanma. En küçük metin `text-xs`
  ve yalnız rozette.
- Gradient (tepedeki hafif ışıma dışında), blur leke, parlayan nokta, renkli gölge, `backdrop-blur`
  kullanma. Odak halkası ve rozet kenarı dışında parıltılı `ring-*` yok.
- Stok fotoğraf avatar (Unsplash) kullanma, `BasHarfAvatar` kullan.
- Uydurma kişi, sayı, istatistik gösterme. Veri yoksa boş durum göster.
- Kırmızıyı (`pen`) danışman geri bildirimi dışında kullanma. Hata için `danger`, gecikme için `warn`.
- Her kutuya kart verme. Gölge yalnız `shadow-panel` ve `shadow-pop`.
- Ortalanmış uzun metin yazma; içerik sola yaslı.
- Meta bilgiyi orta noktayla zincirleme ("A · B · C"); ayrı satır veya virgül kullan.
- Buton ve bağlantı metnine "→" ekleme.
- `dark:` sınıfı yazma; renkler token'dan gelir. Yeni token gerekirse `globals.css`'te açık ve
  koyu değeriyle ekle.
- `rounded-md` ve `rounded-lg` dışında yeni köşe değeri uydurma (§4).
- Metne ham `#hex` veya `text-white`/`text-black` yazma. Tek istisna: mobil menü arkasındaki
  `bg-black/40` perde.
- Tailwind'in ham renklerini (`slate-*`, `red-*`, `amber-*`, `emerald-*`, `sky-*`) yeni koda yazma.

## 9. Eski sınıfların eşleştirmesi (H8 için)

| Eski | Yeni |
| --- | --- |
| `bg-slate-950`, `bg-slate-950/xx` | `bg-paper` |
| `bg-slate-900`, `bg-slate-900/xx` | `bg-surface` |
| `bg-slate-800`, `bg-slate-800/xx`, `hover:bg-slate-800` | `bg-sunken`, `hover:bg-sunken` |
| `border-slate-800`, `border-slate-700`, `divide-slate-800` | `border-line`, `divide-line` |
| `text-white`, `text-slate-100`, `text-slate-200` | `text-ink` |
| `text-slate-300`, `text-slate-400` | `text-ink-2` |
| `text-slate-500`, `text-slate-600` | `text-ink-3` |
| `text-red-300/400`, `text-amber-300/400` (vurgu amaçlı) | kaldır, `text-ink` veya `text-ink-2` |
| `bg-red-700 hover:bg-red-600 text-white` (birincil buton) | `buttonClass({ variant: 'primary' })` |
| `bg-red-950/xx border-red-800 text-red-300` (hata kutusu) | `<Uyari tone="tehlike">` |
| `bg-emerald-950/xx … text-emerald-300` (başarı kutusu) | `<Uyari tone="basari">` |
| `text-[10px]`, `text-[11px]`, `text-xs` (gövde metni) | `text-sm` |
| `uppercase tracking-wider`, `tracking-[0.14em] uppercase` | kaldır |
| `font-mono` (kod/yol olmayan yerde) | kaldır |
| `rounded-2xl`, `rounded-3xl` | panel `rounded-xl`, buton/alan `rounded-lg` |
| `rounded-md` (buton/alan), `rounded-lg` (panel) | buton/alan `rounded-lg`, panel `rounded-xl` |
| `shadow-xl`, `shadow-lg shadow-*` (panel) | `shadow-panel`; açılır menü için `shadow-pop` |
| `bg-primary`, `text-primary` | `bg-accent`, `text-accent-ink` (`primary` aynı renk, eski ad) |
| `focus:border-red-600` | `focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30` |
| `<RoleBadge role=… />` | `<YetkiRozeti yetki=… />` veya kadro metni |
| Başlık önündeki `<Icon />` | kaldır |
