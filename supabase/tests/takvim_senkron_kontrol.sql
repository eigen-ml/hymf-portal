-- ==============================================================================
-- Takvim senkronu kontrolleri (20261013000000_takvim_senkron.sql)
-- ==============================================================================
-- Migration'dan sonra SQL Editor'de çalıştırın. Tek transaction, sonunda geri alınır; gerçek veriye
-- dokunmaz. Başarısız kontrol "KALDI: ..." hatasıyla durur. Hepsi geçerse son satırda
-- "Takvim senkron kontrolleri geçti" yazar.
--
-- Kişiler: H1 hoca/uye, AD yuksek_lisans/admin, A yuksek_lisans/uye, B doktora/uye.

begin;

select set_config('request.jwt.claims', '', true);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, aud, role) values
  ('11111111-0000-4000-8000-0000000000b1', 'ts-h1@hymf-test.invalid', now(), '{"full_name":"TS H1"}', 'authenticated', 'authenticated'),
  ('33333333-0000-4000-8000-0000000000b1', 'ts-ad@hymf-test.invalid', now(), '{"full_name":"TS AD"}', 'authenticated', 'authenticated'),
  ('44444444-0000-4000-8000-0000000000b1', 'ts-a@hymf-test.invalid', now(), '{"full_name":"TS A"}', 'authenticated', 'authenticated'),
  ('55555555-0000-4000-8000-0000000000b1', 'ts-b@hymf-test.invalid', now(), '{"full_name":"TS B"}', 'authenticated', 'authenticated');

update public.profiles set kadro = 'hoca', yetki = 'uye', is_approved = true where id = '11111111-0000-4000-8000-0000000000b1';
update public.profiles set kadro = 'yuksek_lisans', yetki = 'admin', is_approved = true where id = '33333333-0000-4000-8000-0000000000b1';
update public.profiles set kadro = 'yuksek_lisans', yetki = 'uye', is_approved = true where id = '44444444-0000-4000-8000-0000000000b1';
update public.profiles set kadro = 'doktora', yetki = 'uye', is_approved = true where id = '55555555-0000-4000-8000-0000000000b1';

-- ---------- 1. Hoca toplantı ekler; sayaç 0'dan başlar; eski kodun eklemesi de çalışır ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
insert into public.meetings (id, title, meeting_date, ends_at, location, creator_id, sequence) values
  ('77777777-0000-4000-8000-0000000000b1', 'Sunumlar', now() + interval '4 days', now() + interval '4 days 1 hour',
   'Seminer odası', '11111111-0000-4000-8000-0000000000b1', 9);
-- 1827a93'teki kod yeni kolonları göndermez:
insert into public.meetings (id, title, meeting_date, creator_id) values
  ('77777777-0000-4000-8000-0000000000b2', 'Eski kodla', now() + interval '11 days', '11111111-0000-4000-8000-0000000000b1');
do $$ declare engellendi boolean := false; begin
  if (select sequence from public.meetings where id = '77777777-0000-4000-8000-0000000000b1') <> 0 then
    raise exception 'KALDI: 1. Yeni toplantının sayacı 0 değil';
  end if;
  if (select ends_at from public.meetings where id = '77777777-0000-4000-8000-0000000000b2') is not null then
    raise exception 'KALDI: 1. Bitişsiz eklenen toplantıya bitiş yazıldı';
  end if;
  begin
    insert into public.meetings (title, meeting_date, ends_at, creator_id)
    values ('x', now() + interval '1 day', now() + interval '1 day' - interval '1 minute', '11111111-0000-4000-8000-0000000000b1');
  exception when check_violation then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 1. Başlangıçtan önce biten toplantı eklendi'; end if;
  engellendi := false;
  begin
    insert into public.meetings (title, meeting_date, location, creator_id)
    values ('x', now() + interval '1 day', repeat('a', 301), '11111111-0000-4000-8000-0000000000b1');
  exception when check_violation then engellendi := true;
  end;
  if not engellendi then raise exception 'KALDI: 1. 300 karakterden uzun yer kabul edildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 2. Öğrenci toplantı düzenleyemez ve silemez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$ declare n int; begin
  if (select count(*) from public.meetings where id = '77777777-0000-4000-8000-0000000000b1') <> 1 then
    raise exception 'KALDI: 2. Üye toplantıyı göremiyor';
  end if;
  update public.meetings set title = 'ele geçirildi', meeting_date = meeting_date + interval '1 hour'
  where id = '77777777-0000-4000-8000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'KALDI: 2. Öğrenci toplantıyı düzenledi'; end if;
  delete from public.meetings where id = '77777777-0000-4000-8000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'KALDI: 2. Öğrenci toplantıyı sildi'; end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 3. Hoca düzenler, sayaç artar; ekleyen değiştirilemez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$ declare n int; begin
  update public.meetings
  set meeting_date = meeting_date + interval '1 hour', ends_at = ends_at + interval '1 hour', sequence = 50
  where id = '77777777-0000-4000-8000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'KALDI: 3. Hoca toplantıyı düzenleyemedi'; end if;
  if (select sequence from public.meetings where id = '77777777-0000-4000-8000-0000000000b1') <> 1 then
    raise exception 'KALDI: 3. Saat değişince sayaç 1 olmadı (istemcinin yazdığı değer geçti mi?)';
  end if;

  -- Yalnız sunum bağlantısı değişirse takvimdeki kayıt değişmez, sayaç da artmaz.
  update public.meetings set presentation_url = 'https://example.org/sunum.pdf'
  where id = '77777777-0000-4000-8000-0000000000b1';
  if (select sequence from public.meetings where id = '77777777-0000-4000-8000-0000000000b1') <> 1 then
    raise exception 'KALDI: 3. Sunum bağlantısı değişince sayaç arttı';
  end if;

  update public.meetings set creator_id = '44444444-0000-4000-8000-0000000000b1'
  where id = '77777777-0000-4000-8000-0000000000b1';
  if (select creator_id from public.meetings where id = '77777777-0000-4000-8000-0000000000b1')
     <> '11111111-0000-4000-8000-0000000000b1'::uuid then
    raise exception 'KALDI: 3. Toplantıyı ekleyen kişi değiştirildi';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$ declare n int; begin
  update public.meetings set location = 'Fizik Müh. 2. kat' where id = '77777777-0000-4000-8000-0000000000b1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'KALDI: 3. Yönetici toplantıyı düzenleyemedi'; end if;
  if (select sequence from public.meetings where id = '77777777-0000-4000-8000-0000000000b1') <> 2 then
    raise exception 'KALDI: 3. Yer değişince sayaç artmadı';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

-- ---------- 4. Çekim kaydını kişi kendisi yazamaz ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
insert into public.calendar_feed_tokens (user_id, token, son_cekim, son_istemci) values
  ('44444444-0000-4000-8000-0000000000b1', 'tsanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', now(), 'apple');
update public.calendar_feed_tokens set son_cekim = now(), son_istemci = 'google'
where user_id = '44444444-0000-4000-8000-0000000000b1';
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
insert into public.calendar_feed_tokens (user_id, token) values
  ('55555555-0000-4000-8000-0000000000b1', 'tsanahtari_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
reset role;
select set_config('request.jwt.claims', '', true);

do $$ begin
  if exists (
    select 1 from public.calendar_feed_tokens
    where user_id in ('44444444-0000-4000-8000-0000000000b1', '55555555-0000-4000-8000-0000000000b1')
      and (son_cekim is not null or son_istemci is not null)
  ) then
    raise exception 'KALDI: 4. Kişi kendi çekim kaydını yazabildi';
  end if;
end $$;

-- ---------- 5. Yanlış anahtarla takvim_akisi_cekildi hiçbir satırı değiştirmez ----------
create temporary table ts_once on commit drop as
  select user_id, son_cekim, son_istemci from public.calendar_feed_tokens;

set local role anon;
select public.takvim_akisi_cekildi('tsanahtari_yanlis_cccccccccccccccccccccccccccc', 'apple');
select public.takvim_akisi_cekildi('kisa', 'apple');
select public.takvim_akisi_cekildi('tsanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'bilinmeyen');
reset role;

do $$ begin
  if exists (
    select 1 from public.calendar_feed_tokens t join ts_once o using (user_id)
    where t.son_cekim is distinct from o.son_cekim or t.son_istemci is distinct from o.son_istemci
  ) then
    raise exception 'KALDI: 5. Yanlış anahtar veya geçersiz istemciyle bir satır değişti';
  end if;
end $$;

-- ---------- 6. Doğru anahtarla kayıt düşer; tarayıcı indirmesi aboneliği ezmez ----------
set local role anon;
select public.takvim_akisi_cekildi('tsanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'apple');
select public.takvim_akisi_cekildi('tsanahtari_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'tarayici');
reset role;

do $$ begin
  if (select son_istemci from public.calendar_feed_tokens where user_id = '44444444-0000-4000-8000-0000000000b1')
     is distinct from 'apple' then
    raise exception 'KALDI: 6. Doğru anahtarla çekim kaydı düşmedi';
  end if;
  if (select son_istemci from public.calendar_feed_tokens where user_id = '55555555-0000-4000-8000-0000000000b1')
     is distinct from 'tarayici' then
    raise exception 'KALDI: 6. Tarayıcı indirmesi kaydedilmedi';
  end if;
  -- Bir dakika geçmiş gibi yap: tarayıcı, Apple aboneliğinin yerine geçmemeli.
  update public.calendar_feed_tokens set son_cekim = now() - interval '5 minutes'
  where user_id = '44444444-0000-4000-8000-0000000000b1';
end $$;

set local role anon;
select public.takvim_akisi_cekildi('tsanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'tarayici');
reset role;

do $$ begin
  if (select son_istemci from public.calendar_feed_tokens where user_id = '44444444-0000-4000-8000-0000000000b1')
     is distinct from 'apple' then
    raise exception 'KALDI: 6. Tarayıcı indirmesi Apple aboneliğinin kaydını ezdi';
  end if;
end $$;

-- ---------- 7. Akışta toplantının bitişi, yeri ve sayacı var ----------
set local role anon;
do $$ declare m jsonb; begin
  select x into m
  from jsonb_array_elements(public.takvim_akisi('tsanahtari_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')->'toplantilar') x
  where x->>'id' = '77777777-0000-4000-8000-0000000000b1';
  if m is null then raise exception 'KALDI: 7. Toplantı akışta yok'; end if;
  if m->>'location' is distinct from 'Fizik Müh. 2. kat' or (m->>'sequence')::int <> 2
     or m->>'ends_at' is null or m->>'updated_at' is null then
    raise exception 'KALDI: 7. Akışta ends_at, location, updated_at veya sequence eksik: %', m;
  end if;
end $$;
reset role;

-- ---------- 8. takvim_baglantilari: admin olmayan boş sonuç alır, admin görür, anahtar dönmez ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.takvim_baglantilari()) <> 0 then
    raise exception 'KALDI: 8. Admin olmayan (hoca) bağlantı listesini gördü';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from public.takvim_baglantilari()) <> 0 then
    raise exception 'KALDI: 8. Öğrenci bağlantı listesini gördü';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
do $$ begin
  if (select son_istemci from public.takvim_baglantilari() where user_id = '44444444-0000-4000-8000-0000000000b1')
     is distinct from 'apple' then
    raise exception 'KALDI: 8. Yönetici bağlantı durumunu göremiyor';
  end if;
end $$;
reset role;
select set_config('request.jwt.claims', '', true);

do $$ begin
  if pg_get_function_result('public.takvim_baglantilari()'::regprocedure) ilike '%token%' then
    raise exception 'KALDI: 8. takvim_baglantilari anahtar kolonu döndürüyor';
  end if;
end $$;

-- ---------- 9. anon anahtar tablosunu okuyamaz ----------
set local role anon;
do $$ begin
  begin
    if (select count(*) from public.calendar_feed_tokens) <> 0 then
      raise exception 'KALDI: 9. Anonim kullanıcı anahtar tablosunu okudu';
    end if;
  exception when insufficient_privilege then null; -- tablo izni yok: beklenen
  end;
end $$;
reset role;

-- ---------- 10. Anahtar yenilenince çekim kaydı sıfırlanır ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
update public.calendar_feed_tokens set token = 'tsanahtari_dddddddddddddddddddddddddddddddddd'
where user_id = '44444444-0000-4000-8000-0000000000b1';
reset role;
select set_config('request.jwt.claims', '', true);

do $$ begin
  if (select son_cekim from public.calendar_feed_tokens where user_id = '44444444-0000-4000-8000-0000000000b1') is not null then
    raise exception 'KALDI: 10. Anahtar yenilenince eski aboneliğin kaydı kaldı';
  end if;
end $$;

rollback;

select 'Takvim senkron kontrolleri geçti' as sonuc;
