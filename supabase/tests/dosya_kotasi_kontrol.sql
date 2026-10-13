-- ==============================================================================
-- Dosya kotası kontrolleri (20261015000000_dosya_kotasi.sql)
-- ==============================================================================
-- Migration'dan sonra SQL Editor'de çalıştırın. Tek transaction, sonunda geri alınır; gerçek veriye
-- dokunmaz. Başarısız kontrol "KALDI: ..." hatasıyla durur. Hepsi geçerse son satırda
-- "Dosya kotası kontrolleri geçti" yazar.

begin;

select set_config('request.jwt.claims', '', true);

do $$ begin
  if (select file_size_limit from storage.buckets where id = 'workspace-files') <> 10485760 then
    raise exception 'KALDI: 0. Bucket dosya sınırı 10 MB değil';
  end if;
end $$;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, aud, role) values
  ('44444444-0000-4000-8000-0000000000c1', 'dk-a@hymf-test.invalid', now(), '{"full_name":"DK A"}', 'authenticated', 'authenticated');
update public.profiles set kadro = 'yuksek_lisans', yetki = 'uye', is_approved = true where id = '44444444-0000-4000-8000-0000000000c1';

-- Storage nesnelerini doğrudan yaz (yükleme yerine): 9 × 10 MB = 90 MB, kota 100 MB.
insert into storage.objects (bucket_id, name, owner_id, metadata)
select 'workspace-files', w.id::text || '/a-' || n || '.pdf', '44444444-0000-4000-8000-0000000000c1', '{"size":10485760}'
from public.student_workspaces w, generate_series(1, 9) as n
where w.student_id = '44444444-0000-4000-8000-0000000000c1';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000c1","role":"authenticated"}', true);

-- ---------- 1. Gerçek boyut 10 MB, istemci 1 bayt diyor: gerçek boyut yazılmalı ----------
insert into public.workspace_files (workspace_id, file_name, storage_path, size_bytes)
select id, 'a-1.pdf', id::text || '/a-1.pdf', 1 from public.student_workspaces
where student_id = '44444444-0000-4000-8000-0000000000c1';

do $$ begin
  if (select size_bytes from public.workspace_files where file_name = 'a-1.pdf'
      and uploaded_by = '44444444-0000-4000-8000-0000000000c1') is distinct from 10485760 then
    raise exception 'KALDI: 1. size_bytes Storage''daki gerçek boyuttan alınmadı';
  end if;
end $$;

-- ---------- 2. Kota altı: 9 MB daha, toplam 99 MB, kabul edilir ----------
reset role;
insert into storage.objects (bucket_id, name, owner_id, metadata)
select 'workspace-files', id::text || '/b-9.pdf', '44444444-0000-4000-8000-0000000000c1', '{"size":9437184}'
from public.student_workspaces where student_id = '44444444-0000-4000-8000-0000000000c1';
set local role authenticated;

insert into public.workspace_files (workspace_id, file_name, storage_path)
select id, 'b-9.pdf', id::text || '/b-9.pdf' from public.student_workspaces
where student_id = '44444444-0000-4000-8000-0000000000c1';

-- ---------- 3. Kota üstü: 2 MB daha, toplam 101 MB, reddedilmeli ----------
reset role;
insert into storage.objects (bucket_id, name, owner_id, metadata)
select 'workspace-files', id::text || '/c-2.pdf', '44444444-0000-4000-8000-0000000000c1', '{"size":2097152}'
from public.student_workspaces where student_id = '44444444-0000-4000-8000-0000000000c1';
set local role authenticated;

do $$ declare engellendi boolean := false; begin
  begin
    insert into public.workspace_files (workspace_id, file_name, storage_path)
    select id, 'c-2.pdf', id::text || '/c-2.pdf' from public.student_workspaces
    where student_id = '44444444-0000-4000-8000-0000000000c1';
  exception when others then
    engellendi := sqlerrm like 'Site depolaman doldu%';
  end;
  if not engellendi then
    raise exception 'KALDI: 3. 101 MB''lık çalışma alanına dosya eklenebildi';
  end if;
end $$;

reset role;
select set_config('request.jwt.claims', '', true);

rollback;

select 'Dosya kotası kontrolleri geçti' as sonuc;
