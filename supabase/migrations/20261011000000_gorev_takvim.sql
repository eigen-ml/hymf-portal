-- ==============================================================================
-- Görevler, takvim etkinlikleri ve Apple Takvim aboneliği
-- ==============================================================================
-- 20261010000000_icerik.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
--
-- 1. group_tasks: haftalık toplantıda hocanın kişilere verdiği görevler. Onaylı her üye görür.
--    Hoca veya yönetici verir ve "tamamlandı" diye işaretler. Görevi alan kişi yalnız
--    "teslim ettim" diyebilir ve kısa not yazabilir (trigger zorlar).
-- 2. calendar_events: takvime eklenen genel etkinlikler (seminer, son başvuru, konferans).
--    Her üye ekler, yalnız ekleyen (veya yönetici) siler.
-- 3. calendar_feed_tokens: kişinin takvim abonelik bağlantısındaki gizli anahtar. Apple Takvim
--    oturum açamadığı için akış, anahtarla çağrılan takvim_akisi() fonksiyonundan gelir. Akış
--    salt okunurdur: kişinin kendi takvimine hiçbir şey yazmaz, hiçbir şey silmez.

do $$ begin
  create type public.gorev_durum as enum ('acik','teslim_edildi','tamamlandi');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------------------
-- Tablolar
-- ------------------------------------------------------------------------------

create table if not exists public.group_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  assignee_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  due_date date,
  status public.gorev_durum not null default 'acik',
  assignee_note text check (assignee_note is null or char_length(assignee_note) <= 2000),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists group_tasks_assignee_idx on public.group_tasks (assignee_id);
create index if not exists group_tasks_due_idx on public.group_tasks (due_date);
create index if not exists group_tasks_meeting_idx on public.group_tasks (meeting_id);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text check (location is null or char_length(location) <= 300),
  notes text check (notes is null or char_length(notes) <= 5000),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint calendar_events_sira check (ends_at is null or ends_at >= starts_at)
);

create index if not exists calendar_events_starts_idx on public.calendar_events (starts_at);

create table if not exists public.calendar_feed_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- En az 32 karakterlik rastgele base64url anahtar (sunucu üretir).
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{32,128}$'),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- Görev koruması: kim hangi alanı değiştirebilir
-- ------------------------------------------------------------------------------

create or replace function public.group_tasks_koru()
returns trigger as $$
declare
  yonetici boolean := public.is_hoca() or public.is_admin();
  sistem boolean := public.sistem_baglami();
begin
  if tg_op = 'INSERT' then
    if not sistem and not exists (
      select 1 from public.profiles where id = new.assignee_id and is_approved and is_active
    ) then
      raise exception 'Görev yalnız aktif bir üyeye verilebilir.';
    end if;
    new.status := 'acik';
    new.assignee_note := null;
    new.completed_at := null;
    new.completed_by := null;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- UPDATE
  if not sistem then
    if not yonetici then
      -- Görevi alan kişi: yalnız durum (açık ↔ teslim edildi) ve kendi notu.
      if new.title is distinct from old.title
        or new.description is distinct from old.description
        or new.assignee_id is distinct from old.assignee_id
        or new.meeting_id is distinct from old.meeting_id
        or new.due_date is distinct from old.due_date then
        raise exception 'Görevin bu alanını yalnız hoca veya yönetici değiştirebilir.';
      end if;
      if old.status = 'tamamlandi' and new.status is distinct from old.status then
        raise exception 'Tamamlanan görevi yalnız hoca veya yönetici yeniden açabilir.';
      end if;
      if new.status = 'tamamlandi' and old.status <> 'tamamlandi' then
        raise exception 'Görevi tamamlandı olarak yalnız hoca veya yönetici işaretler.';
      end if;
      if old.status = 'tamamlandi' and new.assignee_note is distinct from old.assignee_note then
        raise exception 'Tamamlanan görevin notu değiştirilemez.';
      end if;
    else
      if new.assignee_id is distinct from old.assignee_id and not exists (
        select 1 from public.profiles where id = new.assignee_id and is_approved and is_active
      ) then
        raise exception 'Görev yalnız aktif bir üyeye verilebilir.';
      end if;
      -- Notu yalnız görevi alan kişi yazar.
      if new.assignee_note is distinct from old.assignee_note and old.assignee_id <> (select auth.uid()) then
        raise exception 'Görev notunu yalnız görevi alan kişi yazar.';
      end if;
    end if;
  end if;

  -- Değişmeyen ve trigger'ın yönettiği alanlar
  new.assigned_by := old.assigned_by;
  new.created_at := old.created_at;
  new.updated_at := now();

  if new.status = 'tamamlandi' and old.status <> 'tamamlandi' then
    new.completed_at := now();
    new.completed_by := (select auth.uid());
  elsif new.status = 'tamamlandi' then
    new.completed_at := old.completed_at;
    new.completed_by := old.completed_by;
  else
    new.completed_at := null;
    new.completed_by := null;
  end if;

  return new;
end
$$ language plpgsql security definer set search_path = '';

drop trigger if exists group_tasks_koru on public.group_tasks;
create trigger group_tasks_koru before insert or update on public.group_tasks
  for each row execute function public.group_tasks_koru();

-- Etkinliği ekleyen kişi değiştirilemez.
create or replace function public.calendar_events_koru()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.creator_id := old.creator_id;
    new.created_at := old.created_at;
  end if;
  return new;
end
$$ language plpgsql security definer set search_path = '';

drop trigger if exists calendar_events_koru on public.calendar_events;
create trigger calendar_events_koru before insert or update on public.calendar_events
  for each row execute function public.calendar_events_koru();

-- ------------------------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------------------------

alter table public.group_tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.calendar_feed_tokens enable row level security;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('group_tasks','calendar_events','calendar_feed_tokens')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "gorev_gor" on public.group_tasks for select
  to authenticated using (public.is_member());

create policy "gorev_ver" on public.group_tasks for insert
  to authenticated with check ((public.is_hoca() or public.is_admin()) and assigned_by = (select auth.uid()));

create policy "gorev_guncelle" on public.group_tasks for update
  to authenticated
  using (public.is_hoca() or public.is_admin() or (public.is_member() and assignee_id = (select auth.uid())))
  with check (public.is_hoca() or public.is_admin() or (public.is_member() and assignee_id = (select auth.uid())));

create policy "gorev_sil" on public.group_tasks for delete
  to authenticated using (public.is_hoca() or public.is_admin());

create policy "etkinlik_gor" on public.calendar_events for select
  to authenticated using (public.is_member());

create policy "etkinlik_ekle" on public.calendar_events for insert
  to authenticated with check (public.is_member() and creator_id = (select auth.uid()));

create policy "etkinlik_guncelle" on public.calendar_events for update
  to authenticated using (public.is_member() and creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

create policy "etkinlik_sil" on public.calendar_events for delete
  to authenticated using ((public.is_member() and creator_id = (select auth.uid())) or public.is_admin());

create policy "akis_anahtari_gor" on public.calendar_feed_tokens for select
  to authenticated using (user_id = (select auth.uid()));

create policy "akis_anahtari_ekle" on public.calendar_feed_tokens for insert
  to authenticated with check (public.is_member() and user_id = (select auth.uid()));

create policy "akis_anahtari_guncelle" on public.calendar_feed_tokens for update
  to authenticated using (user_id = (select auth.uid()))
  with check (public.is_member() and user_id = (select auth.uid()));

create policy "akis_anahtari_sil" on public.calendar_feed_tokens for delete
  to authenticated using (user_id = (select auth.uid()));

-- ------------------------------------------------------------------------------
-- Takvim akışı (Apple Takvim aboneliği)
-- ------------------------------------------------------------------------------
-- Anahtarla çağrılır, oturum gerekmez. Anahtar yanlışsa veya hesap pasifse boş döner.
-- Döndürdüğü: son 90 gün ve gelecek 1 yılın toplantıları ve etkinlikleri, ayrıca kişinin aldığı
-- veya verdiği görevler (son tarihi olanlar).

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
        'presentation_url', m.presentation_url
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

select 'Görev/takvim migration tamam' as sonuc;
