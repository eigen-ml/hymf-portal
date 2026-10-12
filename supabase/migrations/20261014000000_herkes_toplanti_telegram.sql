-- ==============================================================================
-- Her üye toplantı ekler ve düzenler; kişisel Telegram bağlantısı
-- ==============================================================================
-- 20261013000000_takvim_senkron.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Not: 20261013000000'ı bundan sonra yeniden çalıştırmayın; başındaki kontrol hoca/admin kuralını
-- arar ve hata verir. Gerekirse önce 20261012000000'ı, sonra 20261013000000'ı, sonra bunu çalıştırın.

-- ------------------------------------------------------------------------------
-- 1. Toplantı: her üye ekler ve düzenler (not dahil). Silme değişmedi: ekleyen, hoca, yönetici.
-- ------------------------------------------------------------------------------

drop policy if exists "toplanti_ekle" on public.meetings;
create policy "toplanti_ekle" on public.meetings for insert
  to authenticated with check (public.is_member() and creator_id = (select auth.uid()));

drop policy if exists "toplanti_guncelle" on public.meetings;
create policy "toplanti_guncelle" on public.meetings for update
  to authenticated using (public.is_member()) with check (public.is_member());

-- ------------------------------------------------------------------------------
-- 2. Telegram: kişi botla özel sohbet açınca sohbet kimliği buraya yazılır.
-- Kaydı yalnız sunucu (servis anahtarıyla, bot webhook'u) ekler; kişi kendi kaydını görür ve siler.
-- ------------------------------------------------------------------------------

create table if not exists public.telegram_baglantilari (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  chat_id bigint not null unique,
  kullanici_adi text check (kullanici_adi is null or char_length(kullanici_adi) <= 64),
  created_at timestamptz not null default now()
);

alter table public.telegram_baglantilari enable row level security;

drop policy if exists "telegram_kendi_gor" on public.telegram_baglantilari;
create policy "telegram_kendi_gor" on public.telegram_baglantilari for select
  to authenticated using (user_id = (select auth.uid()));

drop policy if exists "telegram_kendi_sil" on public.telegram_baglantilari;
create policy "telegram_kendi_sil" on public.telegram_baglantilari for delete
  to authenticated using (user_id = (select auth.uid()));

revoke insert, update on public.telegram_baglantilari from anon, authenticated;

select 'Herkes toplantı + Telegram migration tamam' as sonuc;
