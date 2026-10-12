-- ==============================================================================
-- Takvim senkronu: toplantının bitişi, yeri ve düzenlenmesi; aboneliğin çekim kaydı
-- ==============================================================================
-- 20261012000000_toplanti_yetki.sql'den sonra SQL Editor'de çalıştırın; tekrar çalıştırmak güvenlidir.
--
-- Yalnız ekleme yapar: yeni kolonların varsayılanı var, hiçbir kolon silinmez veya adı değişmez,
-- takvim_akisi() JSON'una yalnız yeni alan eklenir. Canlıdaki eski kod (1827a93) bu migration
-- çalıştıktan sonra da bozulmadan çalışır.
--
-- 1. meetings: ends_at (boşsa toplantı 1 saat sayılır), location, updated_at, sequence. Trigger
--    updated_at'i ve sequence'ı kendisi yönetir; creator_id değiştirilemez. Düzenleme kuralı silme
--    kuralıyla aynı: ekleyen, hoca veya yönetici (ekleyen için ayrıca üyelik şartı).
-- 2. calendar_feed_tokens: son_cekim, son_istemci. Akış her çekildiğinde takvim_akisi_cekildi()
--    yazar (aynı anahtar için dakikada en çok bir kez). Kişi bu iki alanı kendisi değiştiremez;
--    anahtar yenilenince ikisi de sıfırlanır.
-- 3. takvim_baglantilari(): yönetim panelindeki "Takvim" bilgisi. Yalnız yöneticiye sonuç verir,
--    anahtarı hiçbir zaman döndürmez.
-- 4. takvim_akisi(): toplantılara ends_at, location, updated_at, sequence eklenir.
--
-- 20261009000000_calisma_alani.sql'i yeniden çalıştırırsanız (toplantı policy'lerini sıfırlar)
-- 20261010000000, 20261012000000 ve bu dosyayı da ardından sırayla yeniden çalıştırın.

-- ------------------------------------------------------------------------------
-- 0. Önceki migration'lar çalışmış mı
-- ------------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.calendar_feed_tokens') is null then
    raise exception 'Önce supabase/migrations/20261011000000_gorev_takvim.sql dosyasını çalıştırın.';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meetings' and policyname = 'toplanti_sil'
  ) then
    raise exception 'Önce supabase/migrations/20261010000000_icerik.sql dosyasını çalıştırın.';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meetings' and policyname = 'toplanti_ekle'
      and with_check like '%is_hoca()%' and with_check like '%is_admin()%'
  ) then
    raise exception 'Önce supabase/migrations/20261012000000_toplanti_yetki.sql dosyasını çalıştırın.';
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 1. Toplantı: bitiş, yer, düzenleme
-- ------------------------------------------------------------------------------

alter table public.meetings add column if not exists ends_at timestamptz;
alter table public.meetings add column if not exists location text;
alter table public.meetings add column if not exists updated_at timestamptz not null default now();
alter table public.meetings add column if not exists sequence integer not null default 0;

alter table public.meetings drop constraint if exists meetings_bitis_sonra;
alter table public.meetings add constraint meetings_bitis_sonra
  check (ends_at is null or ends_at > meeting_date);

alter table public.meetings drop constraint if exists meetings_location_uzunluk;
alter table public.meetings add constraint meetings_location_uzunluk
  check (location is null or char_length(location) <= 300);

-- updated_at ve sequence'ı istemci yazamaz. sequence, takvim uygulamalarının bir toplantının yeni
-- sürümünü tanıdığı sayaçtır (ICS SEQUENCE): başlık, saat, yer veya not değişince bir artar.
create or replace function public.meetings_koru()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := now();
    new.sequence := 0;
    return new;
  end if;

  new.creator_id := old.creator_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.title is distinct from old.title
    or new.meeting_date is distinct from old.meeting_date
    or new.ends_at is distinct from old.ends_at
    or new.location is distinct from old.location
    or new.notes is distinct from old.notes then
    new.sequence := old.sequence + 1;
  else
    new.sequence := old.sequence;
  end if;
  return new;
end
$$ language plpgsql set search_path = '';

drop trigger if exists meetings_koru on public.meetings;
create trigger meetings_koru before insert or update on public.meetings
  for each row execute function public.meetings_koru();

drop policy if exists "toplanti_guncelle" on public.meetings;
create policy "toplanti_guncelle" on public.meetings for update
  to authenticated
  using ((public.is_member() and creator_id = (select auth.uid())) or public.is_hoca() or public.is_admin())
  with check ((public.is_member() and creator_id = (select auth.uid())) or public.is_hoca() or public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. Abonelik çekim kaydı
-- ------------------------------------------------------------------------------

alter table public.calendar_feed_tokens add column if not exists son_cekim timestamptz;
alter table public.calendar_feed_tokens add column if not exists son_istemci text;

alter table public.calendar_feed_tokens drop constraint if exists calendar_feed_tokens_son_istemci;
alter table public.calendar_feed_tokens add constraint calendar_feed_tokens_son_istemci
  check (son_istemci is null or son_istemci in ('apple', 'google', 'outlook', 'tarayici', 'diger'));

-- Çekim kaydını yalnız takvim_akisi_cekildi() yazar (oturumsuz çağrı = sistem bağlamı). Kişi kendi
-- satırını güncelleyebildiği için bu alanlara elle "bağlı" yazamasın.
create or replace function public.calendar_feed_tokens_koru()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if not public.sistem_baglami() then
      new.son_cekim := null;
      new.son_istemci := null;
    end if;
  elsif new.token is distinct from old.token then
    -- Anahtar yenilendi: eski abonelik artık çalışmıyor, kişi takvimi yeniden eklemeli.
    new.son_cekim := null;
    new.son_istemci := null;
  elsif not public.sistem_baglami() then
    new.son_cekim := old.son_cekim;
    new.son_istemci := old.son_istemci;
  end if;
  return new;
end
$$ language plpgsql set search_path = '';

drop trigger if exists calendar_feed_tokens_koru on public.calendar_feed_tokens;
create trigger calendar_feed_tokens_koru before insert or update on public.calendar_feed_tokens
  for each row execute function public.calendar_feed_tokens_koru();

-- Anahtar tablosu oturumsuz okunmaz. RLS zaten boş döndürüyordu; tablo iznini de kaldırıyoruz.
-- Akış security definer fonksiyonlardan geldiği için bu izne ihtiyacı yok.
revoke all on public.calendar_feed_tokens from anon;

-- takvim_akisi() STABLE olduğu için yazamaz; çekim kaydı bu ayrı fonksiyonda. İstemci, User-Agent'tan
-- sunucuda kabaca bulunur (ham User-Agent saklanmaz). Tarayıcıdan indirmek abonelik değildir: bir
-- uygulamanın kaydını ezmez.
create or replace function public.takvim_akisi_cekildi(p_token text, p_istemci text)
returns void as $$
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{32,128}$'
    or p_istemci is null or p_istemci not in ('apple', 'google', 'outlook', 'tarayici', 'diger') then
    return;
  end if;

  update public.calendar_feed_tokens t
  set son_cekim = now(), son_istemci = p_istemci
  where t.token = p_token
    and (t.son_cekim is null or t.son_cekim < now() - interval '1 minute')
    and not (p_istemci = 'tarayici' and t.son_istemci is not null and t.son_istemci <> 'tarayici');
end
$$ language plpgsql volatile security definer set search_path = '';

revoke all on function public.takvim_akisi_cekildi(text, text) from public;
grant execute on function public.takvim_akisi_cekildi(text, text) to anon;

-- ------------------------------------------------------------------------------
-- 3. Yönetim: kim takvimini bağladı
-- ------------------------------------------------------------------------------

create or replace function public.takvim_baglantilari()
returns table (user_id uuid, son_cekim timestamptz, son_istemci text) as $$
  select t.user_id, t.son_cekim, t.son_istemci
  from public.calendar_feed_tokens t
  where public.is_admin()
$$ language sql stable security definer set search_path = '';

revoke all on function public.takvim_baglantilari() from public;
grant execute on function public.takvim_baglantilari() to authenticated;

-- ------------------------------------------------------------------------------
-- 4. Takvim akışı: toplantının bitişi, yeri ve sürümü
-- ------------------------------------------------------------------------------
-- 20261011000000_gorev_takvim.sql'deki tanımın aynısı; toplantılara yalnız yeni alanlar eklendi.

create or replace function public.takvim_akisi(p_token text)
returns jsonb as $$
declare
  kisi uuid;
  baslangic timestamptz := now() - interval '90 days';
  bitis timestamptz := now() + interval '366 days';
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{32,128}$' then
    return null;
  end if;

  select t.user_id into kisi
  from public.calendar_feed_tokens t
  join public.profiles p on p.id = t.user_id
  where t.token = p_token and p.is_approved and p.is_active;

  if kisi is null then
    return null;
  end if;

  return jsonb_build_object(
    'toplantilar', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'meeting_date', m.meeting_date, 'notes', m.notes,
        'presentation_url', m.presentation_url, 'ends_at', m.ends_at, 'location', m.location,
        'updated_at', m.updated_at, 'sequence', m.sequence
      ) order by m.meeting_date)
      from public.meetings m
      where m.meeting_date between baslangic and bitis
    ), '[]'::jsonb),
    'etkinlikler', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
        'all_day', e.all_day, 'location', e.location, 'notes', e.notes
      ) order by e.starts_at)
      from public.calendar_events e
      where e.starts_at between baslangic and bitis
    ), '[]'::jsonb),
    'gorevler', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'title', g.title, 'description', g.description, 'due_date', g.due_date,
        'status', g.status, 'assignee', a.full_name, 'assigned_by', v.full_name,
        'benim', g.assignee_id = kisi
      ) order by g.due_date)
      from public.group_tasks g
      join public.profiles a on a.id = g.assignee_id
      join public.profiles v on v.id = g.assigned_by
      where g.due_date is not null
        and g.due_date between baslangic::date and bitis::date
        and (g.assignee_id = kisi or g.assigned_by = kisi)
    ), '[]'::jsonb)
  );
end
$$ language plpgsql stable security definer set search_path = '';

revoke all on function public.takvim_akisi(text) from public;
grant execute on function public.takvim_akisi(text) to anon, authenticated;

select 'Takvim senkron migration tamam' as sonuc;
