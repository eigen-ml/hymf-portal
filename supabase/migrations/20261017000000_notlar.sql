-- ==============================================================================
-- Çalışma alanı: kişisel notlar ve ortak fikirler
-- ==============================================================================
-- 20261016000000_toplanti_hoca.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Hocalı plan/defter yerine sade bir sayfa: herkesin kendi kısmında kısa notları ("ne yapacaktık"),
-- bir de herkesin yazdığı Fikirler bölümü. Her üye hepsini okur; herkes yalnız kendi yazdığını
-- işaretler ve siler (yönetici her notu silebilir). Eski çalışma alanı tablolarına dokunulmaz.

create table if not exists public.notlar (
  id uuid primary key default gen_random_uuid(),
  yazar_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  tur text not null check (tur in ('not', 'fikir')),
  govde text not null check (char_length(btrim(govde)) between 1 and 2000),
  yapildi boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notlar_tur_tarih on public.notlar (tur, created_at desc);
create index if not exists notlar_yazar on public.notlar (yazar_id);

alter table public.notlar enable row level security;

drop policy if exists "not_goru" on public.notlar;
create policy "not_goru" on public.notlar for select
  to authenticated using (public.is_member());

drop policy if exists "not_ekle" on public.notlar;
create policy "not_ekle" on public.notlar for insert
  to authenticated with check (public.is_member() and yazar_id = (select auth.uid()));

drop policy if exists "not_guncelle" on public.notlar;
create policy "not_guncelle" on public.notlar for update
  to authenticated using (public.is_member() and yazar_id = (select auth.uid()))
  with check (yazar_id = (select auth.uid()));

drop policy if exists "not_sil" on public.notlar;
create policy "not_sil" on public.notlar for delete
  to authenticated using (yazar_id = (select auth.uid()) or public.is_admin());

-- Güncellemede yalnız "yapıldı" değişebilir; metin, tür ve yazar sabit.
revoke update on public.notlar from anon, authenticated;
grant update (yapildi) on public.notlar to authenticated;
revoke all on public.notlar from anon;

select 'Notlar migration tamam' as sonuc;
