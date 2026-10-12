# Takvim, görevler ve yeni görünüm: sözleşme

Ajanlar arası sözleşme. Tablo, tip, fonksiyon ve dosya adları burada yazdığı gibidir. Farklı bir
şeye ihtiyaç duyan ajan değiştirmez, raporunda yazar. UI kuralları `docs/DESIGN.md`.

## Hedef kullanıcı

Öğretim üyeleri (Y. Moğulkoç, A. Moğulkoç) haftada birkaç dakika bakar. Her ekran tek bakışta
anlaşılır, en sık iş tek tıkla yapılır: "Görev ver", "Tamamlandı ✓", "Toplantı ekle". Gizli menü,
sürükle-bırak, çok adımlı sihirbaz yok. Dokunma hedefleri ≥ 40 px.

## Veri (hazır, değiştirme)

Migration: `supabase/migrations/20261011000000_gorev_takvim.sql`, toplantının bitişi/yeri/düzenlenmesi
ve abonelik kaydı için `20261013000000_takvim_senkron.sql`. Tipler: `src/types/database.ts`
sonundaki `GorevDurum`, `GroupTask`, `CalendarEvent`, `TakvimOgesi`, ayrıca `Meeting`,
`TakvimIstemcisi`, `TakvimBaglantisi`.

| Tablo | Kim görür | Kim yazar |
| --- | --- | --- |
| `group_tasks` | Onaylı her üye (görevler herkese açık) | Hoca/yönetici verir, düzenler, siler, "tamamlandı" yapar. Görevi alan kişi yalnız `acik` ↔ `teslim_edildi` ve kendi notunu (`assignee_note`) değiştirir. |
| `calendar_events` | Onaylı her üye | Her üye ekler; yalnız ekleyen (veya admin) siler. |
| `meetings` | Onaylı her üye | Hoca veya yönetici ekler (grup toplantısı, `20261012000000_toplanti_yetki.sql`); ekleyen, hoca veya admin düzenler ve siler (`20261013000000`). `updated_at` ve `sequence`'ı trigger yazar, `creator_id` değişmez. |
| `calendar_feed_tokens` | Yalnız kendisi; `anon` hiç okuyamaz | Anahtarı yalnız kendisi. `son_cekim`/`son_istemci`'yi yalnız `takvim_akisi_cekildi()` yazar; anahtar yenilenince sıfırlanır. Yönetici `takvim_baglantilari()` ile görür (anahtar dönmez). |

Görev durumu → metin ve ton: `acik` "Açık" (notr), `teslim_edildi` "Teslim edildi" (inceleme),
`tamamlandi` "Tamamlandı" (basari). Son tarih geçmiş ve tamamlanmamışsa `warn` metniyle
"2 gün gecikti" (`sonTarihMetni`).

## Sunucu fonksiyonları (hazır)

`src/lib/data/takvim.ts` (server-only):
- `gorevleriGetir(): GroupTask[]` (assignee, assigner, meeting ilişkileriyle)
- `kisininGorevleri(kisiId)`
- `gorevVerilebilecekler()`: onaylı, aktif üyeler (görev formundaki kişi listesi)
- `takvimOgeleri(ben, { baslangic, bitis })`: toplantı + etkinlik + son tarihli görev, `TakvimOgesi[]`, güne ve saate göre sıralı, `silebilir` hesaplanmış.

`src/app/gorevler/actions.ts`: `gorevVer({title, description, assignee_ids[], due_date, meeting_id})`,
`gorevDuzenle(id, {title, description, due_date})`, `gorevDurumu(id, status)`, `gorevNotu(id, not)`,
`gorevSil(id)`. Hepsi `{ ok: true } | { ok: false; error }` döner.

`src/app/takvim/actions.ts`: `etkinlikEkle({title, starts_at, ends_at, all_day, location, notes})`,
`etkinlikSil(id)`, `takvimAnahtarim()`, `takvimAnahtariniYenile()` → `{ ok, token }`.
Abonelik adresi istemcide: `${location.origin}/takvim-akisi/${token}.ics`; Apple için
`webcal://` + host + yol.

`src/app/toplantilar/actions.ts`: `toplantiEkle({title, meeting_date, ends_at?, location?, notes,
presentation_url, tekrar_hafta?})` (tekrar 0–20, her hafta ayrı satır), `toplantiDuzenle(id, {title,
meeting_date, ends_at, location, notes, presentation_url})`, `toplantiSil(id)`. Üçü de Telegram
bildirimini `after()` ile yanıttan sonra gönderir.

`src/lib/data/takvim.ts`: `takvimAboneligiGetir(kisiId)` → `{ token, baglanti }` (anahtar yoksa
oluşturur; sayfa açılınca panel hazır gelsin diye sunucuda çağrılır), `takvimAnahtariniGetir(kisiId)`.

Yetki: `isHoca(profil) || isAdmin(profil)` = görev verebilir (`src/lib/yetki.ts`).
Tarih: `src/lib/zaman.ts` (İstanbul saati sabit). Türkçe ay/gün adları için `Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' })`.

## Takvim senkronu (13 Eki)

**Abonelik adresi.** Her ortamda `https://hymf-portal.vercel.app/takvim-akisi/<anahtar>.ics`
(`src/lib/site.ts` → `CANLI_ADRES`, adresler `src/lib/abonelik.ts`). Preview adresleri Vercel girişi
istediği için Apple'ın ve Google'ın sunucusu açamaz; veritabanı tek olduğu için preview'da alınan
anahtar canlıda da geçerlidir. Kopyalanan adres `https`, Apple düğmesi `webcal://`.

- **Apple:** `webcal://…`. Mac ve iPhone abonelik penceresini açar.
- **Google:** `https://calendar.google.com/calendar/render?cid=<encodeURIComponent(webcal adresi)>`,
  yeni sekmede. Preview'da Ata'nın Google hesabıyla denenecek; `webcal://` ile olmazsa `https://`
  ile denenip çalışan burada yazılacak. **Sonuç: henüz denenmedi.**
- **Outlook:** `addfromweb` düğmesi konmadı (denenemedi); panelde elle ekleme adımı var.
- Güncelleme: Apple 15 dk–1 saat, Google birkaç saat (8–24 saat, hızlandırılamaz). Son dakika
  değişikliği Telegram'dan gider.

**ICS** (`src/lib/ics.ts`, `src/lib/toplanti.ts`). Toplantı başlığı "Grup toplantısı: <başlık>".
Takvimde `X-WR-CALDESC`, `X-APPLE-CALENDAR-COLOR:#2C2A64` (logodaki lacivert), yenileme ipucu 15 dk.
Saatler UTC (`Z`), VTIMEZONE yok. Toplantıda gerçek `DTEND` (boşsa +1 saat), `LOCATION`,
`LAST-MODIFIED` (`updated_at`), `SEQUENCE`. Akış her zaman 200 `text/calendar` veya 404 döner,
yönlendirme yok (`proxy.ts` yolu `ACIK_YOLLAR`'da dışarıda bırakır; Google girişe yönlenen adrese
abone olmaz). Tek toplantılık dosya: `/toplantilar/<id>/toplanti.ics` (giriş ister), aynı UID.

**Çekim kaydı.** Akış her çekildiğinde istemci User-Agent'tan kabaca bulunur (`istemciyiBul`), ham
User-Agent saklanmaz: `Google-Calendar-Importer` → `google`; `CalendarAgent`, `dataaccessd`, `iOS/`,
`macOS/` → `apple`; `Microsoft`, `Outlook` → `outlook`; diğer `Mozilla` → `tarayici`; geri kalan
`diger`. Aynı anahtar için dakikada en çok bir yazma. `tarayici` abonelik değil, indirmedir: bağlı
sayılmaz ve bir uygulamanın kaydını ezmez. Pano kutusu `son_cekim` boşsa veya yalnız `tarayici` ise
çıkar; "Daha sonra" `hymf-takvim-kutusu` oturum çerezini yazar.

**Telegram** (`src/lib/telegram.ts` → `telegramGonder(html, { sessiz })`,
`src/lib/toplantiBildirimi.ts`). Toplantı eklenince, saati/bitişi veya yeri değişince ya da silinince
gruba tek, sesli mesaj; haftalık seri tek mesaj ("Her Cuma 10:00–11:00, 8 hafta (16 Eki – 4 Ara)").
Yalnız başlık/not/sunum değişirse ve bitmiş toplantıda mesaj gitmez. Mesajda giriş istemeyen
"Google Takvim'e ekle" bağlantısı var (seride `recur=RRULE:FREQ=WEEKLY;COUNT=n`), `.ics` bağlantısı yok
(Telegram'ın tarayıcısında oturum olmadığı için giriş sayfasına düşer). Env yalnız Production'da;
başka ortamda gönderim atlanır ve loglanır. Telegram hatası kaydı etkilemez.

### Dosya sahipliği (takvim senkronu)

| Sahip | Dosyalar |
| --- | --- |
| Haiku: logo yerleşimi | `src/components/Footer.tsx`, `src/app/giris/page.tsx`, `src/components/pano/Karsilama.tsx` |
| Haiku: panel metinleri | `src/components/takvim/AbonelikAdimlari.tsx` |
| Haiku: yönetim satırı | `src/components/yonetim/UyeleriYonet.tsx` |
| Haiku: dokümanlar | `docs/CANLI_TEST.md`, `docs/KURULUM.md` |
| Orkestratör | Geri kalan her şey: migration ve test SQL, `src/lib/{ics,abonelik,site,toplanti,toplantiBildirimi,telegram}.ts`, `src/app/takvim-akisi/`, `src/app/toplantilar/`, `src/app/takvim/`, `src/app/yonetim/page.tsx`, `src/lib/data/takvim.ts`, `src/components/takvim/*` (yukarıdaki hariç), `src/components/pano/{Pano,TakvimEkleKutusu}.tsx`, `src/components/ui/GrupLogosu.tsx`, `docs/PLAN_TAKVIM.md`, `docs/DESIGN.md` |

## Sayfalar ve dosya sahipliği (ilk sürüm)

| Ajan | Dosyalar (yalnız bunlara yazar) |
| --- | --- |
| Tasarım | `src/app/globals.css`, `src/app/layout.tsx`, `src/app/fonts/*`, `src/components/ui/*`, `src/components/Navbar.tsx`, `src/components/Footer.tsx`, `src/components/TemaSecici.tsx`, `docs/DESIGN.md` |
| Takvim | `src/app/takvim/page.tsx`, `src/app/takvim/TakvimIstemci.tsx` (+ gerekirse `src/components/takvim/*`), `src/app/toplantilar/ToplantilarIstemci.tsx` |
| Görevler | `src/app/gorevler/page.tsx`, `src/app/gorevler/GorevlerIstemci.tsx`, `src/components/gorevler/*`, `src/app/page.tsx`, `src/components/pano/*` |

`src/components/ui/*` bileşenlerinin mevcut prop'ları korunur (yalnız opsiyonel prop eklenebilir),
çünkü diğer ajanlar onları aynı anda kullanıyor.

Navbar sırası (Tasarım ajanı): Pano (ana sayfa), Takvim, Görevler, Duyurular, Toplantılar, sonra
"Diğer" altında Kılavuzlar, Formlar, Kaynaklar, Dersler, Üyeler; sağda Çalışma alanı, Yönetim, tema
seçici, kullanıcı menüsü.

## Ortak kurallar

- `next build` ve `next dev` çalıştırma (aynı anda birden çok ajan var). Doğrulama:
  `npx tsc --noEmit` ve `npx eslint <dosyaların>`.
- Yeni npm paketi ekleme.
- Supabase'e bağlanma, SQL çalıştırma.
- Git commit atma; orkestratör atar.
