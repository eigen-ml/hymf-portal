-- ==============================================================================
-- Görev ve takvim RLS/trigger kontrolleri
-- ==============================================================================
-- 20261012000000_toplanti_yetki.sql'den sonra SQL Editor'de çalıştırın. Tek transaction, sonunda geri
-- alınır; gerçek veriye dokunmaz. Başarısız kontrol "KALDI: ..." hatasıyla durur. Hepsi geçerse son
-- satırda "Görev/takvim kontrolleri geçti" yazar.
--
-- Kişiler: H1 hoca/uye, AD yuksek_lisans/admin, A yuksek_lisans/uye, B doktora/uye, N onaysız.

begin;

select set_config('request.jwt.claims', '', true);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, aud, role) values
  ('11111111-0000-4000-8000-0000000000a1', 'gt-h1@hymf-test.invalid', now(), '{"full_name":"GT H1"}', 'authenticated', 'authenticated'),
  ('33333333-0000-4000-8000-0000000000a1', 'gt-ad@hymf-test.invalid', now(), '{"full_name":"GT AD"}', 'authenticated', 'authenticated'),
  ('44444444-0000-4000-8000-0000000000a1', 'gt-a@hymf-test.invalid', now(), '{"full_name":"GT A"}', 'authenticated', 'authenticated'),
  ('55555555-0000-4000-8000-0000000000a1', 'gt-b@hymf-test.invalid', now(), '{"full_name":"GT B"}', 'authenticated', 'authenticated'),
  ('66666666-0000-4000-8000-0000000000a1', 'gt-n@hymf-test.invalid', now(), '{"full_name":"GT N"}', 'authenticated', 'authenticated');

update public.profiles set kadro = 'hoca', yetki = 'uye', is_approved = true where id = '11111111-0000-4000-8000-0000000000a1';
update public.profiles set kadro = 'yuksek_lisans', yetki = 'admin', is_approved = true where id = '33333333-0000-4000-8000-0000000000a1';
update public.profiles set kadro = 'yuksek_lisans', yetki = 'uye', is_approved = true where id = '44444444-0000-4000-8000-0000000000a1';
update public.profiles set kadro = 'doktora', yetki = 'uye', is_approved = true where id = '55555555-0000-4000-8000-0000000000a1';

-- ---------- 1. Öğrenci görev veremez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare engellendi boolean := false; begin
  begin
    insert into public.group_tasks (title, assignee_id, assigned_by)
    values ('x', '55555555-0000-4000-8000-0000000000a1', '44444444-0000-4000-8000-0000000000a1');
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 1. Öğrenci görev verebildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 2. Hoca görev verir; durum zorla "acik" başlar; başkası adına veremez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public.group_tasks (id, title, assignee_id, assigned_by, due_date, status)
values ('99999999-0000-4000-8000-0000000000a1', 'Bant yapısı', '44444444-0000-4000-8000-0000000000a1',
        '11111111-0000-4000-8000-0000000000a1', current_date + 7, 'tamamlandi');
do $$ declare engellendi boolean := false; begin
  if (select status from public.group_tasks where id = '99999999-0000-4000-8000-0000000000a1') <> 'acik' then
    raise exception 'KALDI: 2. Yeni görev "acik" dışında bir durumla başladı';
  end if;
  begin
    insert into public.group_tasks (title, assignee_id, assigned_by)
    values ('x', '44444444-0000-4000-8000-0000000000a1', '33333333-0000-4000-8000-0000000000a1');
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 2. Hoca başkası adına görev verebildi'; end if;
  engellendi := false;
  begin
    insert into public.group_tasks (title, assignee_id, assigned_by)
    values ('x', '66666666-0000-4000-8000-0000000000a1', '11111111-0000-4000-8000-0000000000a1');
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 2. Onaysız kişiye görev verilebildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 3. Başka öğrenci görevi değiştiremez ama görür; onaysız göremez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare n int; begin
  if (select count(*) from public.group_tasks where id = '99999999-0000-4000-8000-0000000000a1') <> 1 then
    raise exception 'KALDI: 3. Grup üyesi görevi göremiyor';
  end if;
  update public.group_tasks set status = 'teslim_edildi' where id = '99999999-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'KALDI: 3. Başka öğrenci görevin durumunu değiştirdi'; end if;
  delete from public.group_tasks where id = '99999999-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'KALDI: 3. Öğrenci görevi silebildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.group_tasks) <> 0 then raise exception 'KALDI: 3. Onaysız kişi görevleri gördü'; end if;
  if (select count(*) from public.calendar_events) <> 0 then raise exception 'KALDI: 3. Onaysız kişi etkinlikleri gördü'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 4. Görevi alan: teslim eder, not yazar; tamamlayamaz, başlığı değiştiremez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare engellendi boolean := false; n int; begin
  update public.group_tasks set status = 'teslim_edildi', assignee_note = 'TRUBA iş no 123'
  where id = '99999999-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'KALDI: 4. Görevi alan kişi teslim edemedi'; end if;

  begin
    update public.group_tasks set status = 'tamamlandi' where id = '99999999-0000-4000-8000-0000000000a1';
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 4. Öğrenci kendi görevini tamamlandı yaptı'; end if;

  engellendi := false;
  begin
    update public.group_tasks set title = 'değişti' where id = '99999999-0000-4000-8000-0000000000a1';
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 4. Öğrenci görev başlığını değiştirdi'; end if;

  engellendi := false;
  begin
    update public.group_tasks set due_date = current_date + 60 where id = '99999999-0000-4000-8000-0000000000a1';
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 4. Öğrenci son tarihi değiştirdi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 5. Hoca tamamlar; notu değiştiremez; öğrenci geri açamaz ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare engellendi boolean := false; begin
  update public.group_tasks set status = 'tamamlandi' where id = '99999999-0000-4000-8000-0000000000a1';
  if (select completed_by from public.group_tasks where id = '99999999-0000-4000-8000-0000000000a1')
     is distinct from '11111111-0000-4000-8000-0000000000a1'::uuid then
    raise exception 'KALDI: 5. completed_by hocayı göstermiyor';
  end if;
  begin
    update public.group_tasks set assignee_note = 'hoca yazdı' where id = '99999999-0000-4000-8000-0000000000a1';
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 5. Hoca öğrencinin notunu değiştirdi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare engellendi boolean := false; begin
  begin
    update public.group_tasks set status = 'acik' where id = '99999999-0000-4000-8000-0000000000a1';
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 5. Öğrenci tamamlanan görevi geri açtı'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 6. Etkinlik: herkes ekler, yalnız ekleyen veya admin siler ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public.calendar_events (id, title, starts_at, creator_id) values
  ('88888888-0000-4000-8000-0000000000a1', 'Seminer', now() + interval '3 days', '44444444-0000-4000-8000-0000000000a1'),
  ('88888888-0000-4000-8000-0000000000a2', 'Konferans', now() + interval '9 days', '44444444-0000-4000-8000-0000000000a1');
do $$ declare engellendi boolean := false; begin
  begin
    insert into public.calendar_events (title, starts_at, creator_id)
    values ('x', now(), '55555555-0000-4000-8000-0000000000a1');
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 6. Başkası adına etkinlik eklendi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare n int; begin
  delete from public.calendar_events where id = '88888888-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'KALDI: 6. Başkasının etkinliği silindi'; end if;
  update public.calendar_events set title = 'ele geçirildi' where id = '88888888-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'KALDI: 6. Başkasının etkinliği değiştirildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare n int; begin
  delete from public.calendar_events where id = '88888888-0000-4000-8000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'KALDI: 6. Ekleyen kendi etkinliğini silemedi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare n int; begin
  delete from public.calendar_events where id = '88888888-0000-4000-8000-0000000000a2';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'KALDI: 6. Yönetici etkinliği silemedi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 7. Takvim anahtarı: yalnız kendisi görür; akış anahtarla çalışır ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public.calendar_feed_tokens (user_id, token) values
  ('44444444-0000-4000-8000-0000000000a1', 'testanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
do $$ declare engellendi boolean := false; begin
  begin
    insert into public.calendar_feed_tokens (user_id, token)
    values ('55555555-0000-4000-8000-0000000000a1', 'testanahtari_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 7. Başkası adına takvim anahtarı oluşturuldu'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.calendar_feed_tokens) <> 0 then
    raise exception 'KALDI: 7. Başkasının takvim anahtarı göründü';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role anon;
do $$ declare akis jsonb; begin
  if public.takvim_akisi('yanlis_anahtar_cccccccccccccccccccccccccccccc') is not null then
    raise exception 'KALDI: 7. Yanlış anahtar akış döndürdü';
  end if;
  akis := public.takvim_akisi('testanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  if akis is null or jsonb_array_length(akis->'gorevler') <> 1 then
    raise exception 'KALDI: 7. Doğru anahtarla kişinin görevi akışta yok';
  end if;
  begin
    if (select count(*) from public.calendar_feed_tokens) <> 0 then
      raise exception 'KALDI: 7. Anonim kullanıcı anahtar tablosunu okudu';
    end if;
  exception when insufficient_privilege then null; -- tablo izni hiç yoksa da doğru
  end;
end $$;
reset role;

update public.profiles set is_active = false where id = '44444444-0000-4000-8000-0000000000a1';
set local role anon;
do $$ begin
  if public.takvim_akisi('testanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') is not null then
    raise exception 'KALDI: 7. Pasif hesabın akışı çalışmaya devam etti';
  end if;
end $$;
reset role;

-- ---------- 8. Grup toplantısını yalnız hoca ve yönetici ekler (20261012000000) ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ declare engellendi boolean := false; begin
  begin
    insert into public.meetings (title, meeting_date, creator_id)
    values ('x', now() + interval '1 day', '55555555-0000-4000-8000-0000000000a1');
  exception when others then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 8. Öğrenci grup toplantısı ekleyebildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public.meetings (title, meeting_date, creator_id)
values ('Hoca toplantısı', now() + interval '1 day', '11111111-0000-4000-8000-0000000000a1');
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into public.meetings (title, meeting_date, creator_id)
values ('Yönetici toplantısı', now() + interval '1 day', '33333333-0000-4000-8000-0000000000a1');
reset role;
select set_config('request.jwt.claims', '', true);

rollback;

select 'Görev/takvim kontrolleri geçti' as sonuc;
