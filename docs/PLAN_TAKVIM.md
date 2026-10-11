# Takvim, görevler ve yeni görünüm: sözleşme

Ajanlar arası sözleşme. Tablo, tip, fonksiyon ve dosya adları burada yazdığı gibidir. Farklı bir
şeye ihtiyaç duyan ajan değiştirmez, raporunda yazar. UI kuralları `docs/DESIGN.md`.

## Hedef kullanıcı

Öğretim üyeleri (Y. Moğulkoç, A. Moğulkoç) haftada birkaç dakika bakar. Her ekran tek bakışta
anlaşılır, en sık iş tek tıkla yapılır: "Görev ver", "Tamamlandı ✓", "Toplantı ekle". Gizli menü,
sürükle-bırak, çok adımlı sihirbaz yok. Dokunma hedefleri ≥ 40 px.

## Veri (hazır, değiştirme)

Migration: `supabase/migrations/20261011000000_gorev_takvim.sql`. Tipler: `src/types/database.ts`
sonundaki `GorevDurum`, `GroupTask`, `CalendarEvent`, `TakvimOgesi`.

| Tablo | Kim görür | Kim yazar |
| --- | --- | --- |
| `group_tasks` | Onaylı her üye (görevler herkese açık) | Hoca/yönetici verir, düzenler, siler, "tamamlandı" yapar. Görevi alan kişi yalnız `acik` ↔ `teslim_edildi` ve kendi notunu (`assignee_note`) değiştirir. |
| `calendar_events` | Onaylı her üye | Her üye ekler; yalnız ekleyen (veya admin) siler. |
| `meetings` | Onaylı her üye | Her üye ekler; ekleyen, hoca veya admin siler. |
| `calendar_feed_tokens` | Yalnız kendisi | Yalnız kendisi |

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

`src/app/toplantilar/actions.ts`: `toplantiEkle` artık opsiyonel `tekrar_hafta` (0–20) alır.

Yetki: `isHoca(profil) || isAdmin(profil)` = görev verebilir (`src/lib/yetki.ts`).
Tarih: `src/lib/zaman.ts` (İstanbul saati sabit). Türkçe ay/gün adları için `Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul' })`.

## Sayfalar ve dosya sahipliği

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
