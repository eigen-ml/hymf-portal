-- ==============================================================================
-- Takvim etkinliği, kaynak, ders, ders materyali ve not düzenleme
-- ==============================================================================
-- 20261019000000_duyuru_duzenle.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Kim düzenler (silme kurallarına yakın):
--   etkinlik  : ekleyen veya yönetici (ekleyen değişmez, calendar_events_koru trigger'ı)
--   kaynak    : ekleyen veya yönetici
--   ders      : hoca veya yönetici
--   materyal  : yükleyen, hoca veya yönetici
--   not       : yalnız yazan (metin ve "yapıldı")
-- Kaynak, ders, materyal ve notta yalnız aşağıda sayılan sütunlar güncellenebilir.

-- 1. Takvim etkinliği: yönetici de düzenleyebilsin (önceden yalnız ekleyen).
drop policy if exists "etkinlik_guncelle" on public.calendar_events;
create policy "etkinlik_guncelle" on public.calendar_events for update
  to authenticated
  using ((public.is_member() and creator_id = (select auth.uid())) or public.is_admin())
  with check ((public.is_member() and creator_id = (select auth.uid())) or public.is_admin());

-- 2. Kaynak
drop policy if exists "kaynak_guncelle" on public.resources;
create policy "kaynak_guncelle" on public.resources for update
  to authenticated
  using (public.is_member() and (uploader_id = (select auth.uid()) or public.is_admin()))
  with check (public.is_member() and (uploader_id = (select auth.uid()) or public.is_admin()));

revoke update on public.resources from anon, authenticated;
grant update (title, description, category, language, code_snippet, external_url, tags)
  on public.resources to authenticated;

-- 3. Ders
drop policy if exists "ders_guncelle" on public.courses;
create policy "ders_guncelle" on public.courses for update
  to authenticated
  using (public.is_hoca() or public.is_admin())
  with check (public.is_hoca() or public.is_admin());

revoke update on public.courses from anon, authenticated;
grant update (code, name, instructor_id, semester, syllabus) on public.courses to authenticated;

-- 4. Ders materyali (ders ve yükleyen değişmez)
drop policy if exists "ders_materyali_guncelle" on public.course_materials;
create policy "ders_materyali_guncelle" on public.course_materials for update
  to authenticated
  using (public.is_member() and (uploader_id = (select auth.uid()) or public.is_hoca() or public.is_admin()))
  with check (public.is_member() and (uploader_id = (select auth.uid()) or public.is_hoca() or public.is_admin()));

revoke update on public.course_materials from anon, authenticated;
grant update (week_number, title, description, file_url) on public.course_materials to authenticated;

-- 5. Not: yazan metni de düzeltebilir (kural "not_guncelle" aynı kalır: yalnız yazan).
revoke update on public.notlar from anon, authenticated;
grant update (yapildi, govde) on public.notlar to authenticated;

select 'İçerik düzenleme migration tamam' as sonuc;
