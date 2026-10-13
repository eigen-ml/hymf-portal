-- ==============================================================================
-- Dosya kotası: dosya başına 10 MB, çalışma alanı (kişi) başına 100 MB
-- ==============================================================================
-- 20261014000000_herkes_toplanti_telegram.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Supabase Free'de toplam dosya alanı 1 GB. Büyük dosyalar kişinin kendi Google Drive klasörüne
-- gider (student_workspaces.drive_url, Drive'ım sayfasından girilir).
-- Önceden yüklenmiş 10 MB'tan büyük dosyalar silinmez; kotaya sayılır.

-- ------------------------------------------------------------------------------
-- 1. Bucket: dosya başına sınır 25 MB → 10 MB (Storage API'nin kendisi reddeder)
-- ------------------------------------------------------------------------------

update storage.buckets set file_size_limit = 10485760 where id = 'workspace-files';

-- ------------------------------------------------------------------------------
-- 2. Kişi başı kota. Boyut istemcinin söylediği size_bytes'tan değil, Storage'daki gerçek
-- nesneden okunur. Sayım klasördeki tüm nesneleri (yeni yüklenen dahil) kapsar.
-- ------------------------------------------------------------------------------

create or replace function public.dosya_kotasi_bayt()
returns bigint as $$
  select 104857600::bigint; -- 100 MB
$$ language sql immutable set search_path = '';

create or replace function public.workspace_files_before_insert()
returns trigger as $$
declare
  v_gercek bigint;
  v_toplam bigint;
begin
  new.uploaded_by := coalesce((select auth.uid()), new.uploaded_by);

  if new.storage_path is null then
    raise exception 'Dosya yolu zorunludur.' using errcode = '23514';
  end if;

  if left(new.storage_path, 37) <> new.workspace_id::text || '/' then
    raise exception 'Dosya yolu çalışma alanı klasörüyle başlamalı.' using errcode = '23514';
  end if;

  if new.plan_item_id is not null then
    if not exists (select 1 from public.plan_items where id = new.plan_item_id and workspace_id = new.workspace_id) then
      raise exception 'Plan maddesi bu çalışma alanına ait değil.' using errcode = '23514';
    end if;
  end if;

  select (o.metadata->>'size')::bigint into v_gercek
  from storage.objects o
  where o.bucket_id = 'workspace-files' and o.name = new.storage_path;
  new.size_bytes := coalesce(v_gercek, new.size_bytes);

  select coalesce(sum((o.metadata->>'size')::bigint), 0) into v_toplam
  from storage.objects o
  where o.bucket_id = 'workspace-files' and o.name like new.workspace_id::text || '/%';
  if v_gercek is null then
    v_toplam := v_toplam + coalesce(new.size_bytes, 0);
  end if;

  if v_toplam > public.dosya_kotasi_bayt() then
    raise exception 'Site depolaman doldu (kişi başı 100 MB). Eski dosyaları sil ya da büyük dosyaları kendi Drive klasörüne koy.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = '';
