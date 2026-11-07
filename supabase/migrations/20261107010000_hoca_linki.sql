-- ==============================================================================
-- Sunumlar: hocaya giriş gerektirmeyen link ve kişi başı hoca notları
-- ==============================================================================
-- 20261107000000_sunum_klasoru.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Hoca siteye giriş yapmıyor. /hoca/<anahtar> adresi oturum istemez; anahtar burada, tek satırlık
-- hoca_linki tablosunda durur (repoda yok). Sayfa verisini ve not yazmayı yalnız anahtarla çağrılan
-- fonksiyonlar verir (takvim_akisi() ile aynı yol). Notları üyeler okur, yalnız yönetici siler.
-- Anahtarı değiştirmek (eski link çalışmaz olur):
--   update public.hoca_linki set anahtar = replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

create table if not exists public.hoca_linki (
  id int primary key default 1 check (id = 1),
  anahtar text not null unique check (anahtar ~ '^[A-Za-z0-9_-]{32,128}$'),
  created_at timestamptz not null default now()
);

alter table public.hoca_linki enable row level security;
revoke all on public.hoca_linki from anon, authenticated;

insert into public.hoca_linki (id, anahtar)
values (1, replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;

create table if not exists public.sunum_notlari (
  id uuid primary key default gen_random_uuid(),
  uye_id uuid not null references public.profiles(id) on delete cascade,
  govde text not null check (char_length(btrim(govde)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists sunum_notlari_uye on public.sunum_notlari (uye_id, created_at desc);

alter table public.sunum_notlari enable row level security;

drop policy if exists "sunum_notu_goru" on public.sunum_notlari;
create policy "sunum_notu_goru" on public.sunum_notlari for select
  to authenticated using (public.is_member());

drop policy if exists "sunum_notu_sil" on public.sunum_notlari;
create policy "sunum_notu_sil" on public.sunum_notlari for delete
  to authenticated using (public.is_admin());

-- Not yalnız hoca linkinden (aşağıdaki fonksiyonlarla) yazılır.
revoke all on public.sunum_notlari from anon;
revoke insert, update on public.sunum_notlari from authenticated;

-- ------------------------------------------------------------------------------
-- Fonksiyonlar
-- ------------------------------------------------------------------------------

create or replace function public.hoca_anahtari_dogru(p_anahtar text)
returns boolean as $$
  select p_anahtar is not null
    and p_anahtar ~ '^[A-Za-z0-9_-]{32,128}$'
    and exists (select 1 from public.hoca_linki where anahtar = p_anahtar)
$$ language sql stable security definer set search_path = '';

revoke execute on function public.hoca_anahtari_dogru(text) from public, anon, authenticated;

-- Klasörü olan üyeler (hoca ve klasörü kaldırılanlar listede yok) ve her birine bırakılan notlar.
-- Anahtar yanlışsa null.
create or replace function public.hoca_sunumlari(p_anahtar text)
returns jsonb as $$
begin
  if not public.hoca_anahtari_dogru(p_anahtar) then
    return null;
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id,
      'ad', p.full_name,
      'klasor', p.sunum_klasoru,
      'notlar', coalesce((
        select jsonb_agg(jsonb_build_object('id', n.id, 'govde', n.govde, 'tarih', n.created_at)
                         order by n.created_at desc)
        from public.sunum_notlari n
        where n.uye_id = p.id
      ), '[]'::jsonb)
    ) order by p.full_name)
    from public.profiles p
    where p.is_approved and p.is_active and p.sunum_klasoru is not null
  ), '[]'::jsonb);
end;
$$ language plpgsql stable security definer set search_path = '';

-- Yeni notun kimliği; anahtar, kişi ya da metin geçersizse null.
create or replace function public.hoca_notu_ekle(p_anahtar text, p_uye uuid, p_govde text)
returns uuid as $$
declare
  yeni uuid;
begin
  if not public.hoca_anahtari_dogru(p_anahtar) then
    return null;
  end if;
  if p_govde is null or char_length(btrim(p_govde)) not between 1 and 2000 then
    return null;
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_uye and is_approved and is_active and sunum_klasoru is not null
  ) then
    return null;
  end if;

  insert into public.sunum_notlari (uye_id, govde) values (p_uye, btrim(p_govde))
  returning id into yeni;
  return yeni;
end;
$$ language plpgsql volatile security definer set search_path = '';

create or replace function public.hoca_notu_sil(p_anahtar text, p_not uuid)
returns boolean as $$
begin
  if not public.hoca_anahtari_dogru(p_anahtar) then
    return false;
  end if;
  delete from public.sunum_notlari where id = p_not;
  return found;
end;
$$ language plpgsql volatile security definer set search_path = '';

-- Yönetici Sunumlar sayfasında linki kopyalayabilsin; başkasına null.
create or replace function public.hoca_linki_anahtari()
returns text as $$
  select case when public.is_admin() then (select anahtar from public.hoca_linki where id = 1) end
$$ language sql stable security definer set search_path = '';

revoke execute on function public.hoca_sunumlari(text) from public;
revoke execute on function public.hoca_notu_ekle(text, uuid, text) from public;
revoke execute on function public.hoca_notu_sil(text, uuid) from public;
revoke execute on function public.hoca_linki_anahtari() from public, anon;
grant execute on function public.hoca_sunumlari(text) to anon, authenticated;
grant execute on function public.hoca_notu_ekle(text, uuid, text) to anon, authenticated;
grant execute on function public.hoca_notu_sil(text, uuid) to anon, authenticated;
grant execute on function public.hoca_linki_anahtari() to authenticated;

select 'Hoca linki migration tamam' as sonuc;
