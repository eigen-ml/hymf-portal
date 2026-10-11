-- ==============================================================================
-- Grup toplantılarını yalnız hoca ve yöneticiler ekler
-- ==============================================================================
-- 20261011000000_gorev_takvim.sql'den sonra çalıştırın; tekrar çalıştırmak güvenlidir.
-- 20261009000000_calisma_alani.sql'i yeniden çalıştırırsanız bu dosyayı da ardından çalıştırın
-- (o migration toplantı policy'lerini sıfırlar).
--
-- Toplantılar ortak takvimde herkese görünen grup toplantılarıdır; hoca veya yönetici (admin,
-- superadmin) ekler. Diğer üyeler takvime etkinlik ekler (calendar_events, değişmedi).
-- Silme kuralı aynı: ekleyen, hoca veya yönetici.

drop policy if exists "toplanti_ekle" on public.meetings;
create policy "toplanti_ekle" on public.meetings for insert
  to authenticated with check ((public.is_hoca() or public.is_admin()) and creator_id = (select auth.uid()));

select 'Toplantı yetkisi migration tamam' as sonuc;
