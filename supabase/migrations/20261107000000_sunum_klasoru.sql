-- ==============================================================================
-- Sunumlar: üye başına sunum klasörü bağlantısı
-- ==============================================================================
-- 20261019010000_icerik_duzenle.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Sunum dosyaları Supabase'te durmaz (Free 1 GB, kişi başı 100 MB kotası var). Her üyenin
-- HYMF Google hesabındaki "HYMF Sunumlar" altında kendi klasörü olur; burada yalnız bağlantısı tutulur.
-- Yazma kuralları değişmedi: kişi kendi satırını, yönetici herkesinkini günceller
-- ("profil_guncelle" politikası ve profiles_guard).

alter table public.profiles
  add column if not exists sunum_klasoru text
  check (sunum_klasoru is null or (sunum_klasoru ~ '^https://' and char_length(sunum_klasoru) <= 500));

select 'Sunum klasörü migration tamam' as sonuc;
