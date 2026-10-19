-- ==============================================================================
-- Duyuru düzenleme
-- ==============================================================================
-- 20261017000000_notlar.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- Duyuruyu yazan (veya yönetici) başlığı, metni ve türü düzeltebilir. Yazar ve Telegram
-- alanları sabit kalır; düzenleme Telegram'a yeniden gönderilmez.

alter table public.announcements
  add column if not exists updated_at timestamptz;

drop policy if exists "duyuru_guncelle" on public.announcements;
create policy "duyuru_guncelle" on public.announcements for update
  to authenticated
  using (public.is_member() and (author_id = (select auth.uid()) or public.is_admin()))
  with check (public.is_member() and (author_id = (select auth.uid()) or public.is_admin()));

-- Güncellemede yalnız bu sütunlar değişebilir.
revoke update on public.announcements from anon, authenticated;
grant update (title, content, priority, updated_at) on public.announcements to authenticated;

select 'Duyuru düzenleme migration tamam' as sonuc;
