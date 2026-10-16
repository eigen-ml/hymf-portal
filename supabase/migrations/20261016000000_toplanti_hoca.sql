-- ==============================================================================
-- Toplantı: hocayla birebir görüşme
-- ==============================================================================
-- 20261015000000_dosya_kotasi.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Hocayla kişisel toplantısı olan üye kaydı kendisi ekler; grup toplantıları gibi herkes görür.
-- Hocaların çoğunun portal hesabı olmadığı için ad metin olarak tutulur. Boşsa grup toplantısıdır.
-- Ekleme/düzenleme kuralları değişmedi (her üye, bkz. 20261014000000).

alter table public.meetings
  add column if not exists hoca_adi text
  check (hoca_adi is null or char_length(hoca_adi) between 1 and 120);

select 'Toplantı hoca migration tamam' as sonuc;
