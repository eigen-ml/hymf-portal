-- ==============================================================================
-- Seed: YL öğrenci takibi (hocanın 12 Ekim 2026 notu) → görevler
-- ==============================================================================
-- SQL Editor'de çalıştırın; tekrar çalıştırmak güvenlidir (aynı kişide aynı başlık varsa atlar).
-- Kişi henüz hesap açmadıysa onun görevleri atlanır ve NOTICE ile yazılır; hesap açınca yeniden
-- çalıştırın. Görevi veren: aşağıdaki VEREN adı. Kişi notunu yazar, "teslim ettim" der; hoca tik atar.

do $$
declare
  veren_adi constant text := '%Yeşim%';
  veren uuid;
  r record;
  kisi uuid;
begin
  select id into veren from public.profiles
  where full_name ilike veren_adi and is_approved and is_active limit 1;
  if veren is null then
    raise exception 'Görevi verecek hoca bulunamadı (%). veren_adi''nı düzeltin.', veren_adi;
  end if;

  for r in
    select * from (values
      ('%Cengizhan%', 'MoS2/WSe2: optik özellikler ve strain', 'Öncelikli.'),
      ('%Cengizhan%', '2209-A: 7 farklı malzemede manyetik özellikler', 'FGT, VSe2, GdTe2, CrI3'),
      ('%Cengizhan%', 'MoS2 çalışması', 'Birlikte: Yasin, Tanveer H.'),
      ('%Cengizhan%', 'CrXSBr çalışması', 'Birlikte: Rabia, Aybey Hoca'),
      ('%Sibel%', 'TÜBİTAK 1002 sonuç raporu', 'Öncelikli. Teşekkür kısmında adlar geçecek.'),
      ('%Sibel%', 'F-β-borofen: Li depolama', 'Birlikte: Yasin'),
      ('%Sibel%', 'F-β-borofen: H depolama', null),
      ('%Sibel%', 'Li2N, Na2H: hidrojen depolama', 'Birlikte: Tanveer H., Yasin'),
      ('%Sibel%', 'WC4: Li-S batarya', 'Birlikte: Tanveer H.'),
      ('%Sibel%', 'Twisted bilayer graphene', 'Birlikte: Nicolas'),
      ('%Sudem%', 'Ga2SSe2: uniaxial strain', null),
      ('%Sudem%', 'Ga2SSe2 + Li, Na, K ekleme: elektronik ve optik özellikler', null),
      ('%Ata Berk%', 'Evren ofisi (SCB)', null),
      ('%Ata Berk%', 'HYMF Portal', null),
      ('%Ata Berk%', 'Makine öğrenmesi + 2D problem', 'Birlikte: Ali Korkmaz'),
      ('%Sena%', 'Barcelona Erasmus+', null),
      ('%Sena%', 'Makine öğrenmesi + DFT problemi', null),
      ('%Mustafa%', 'DFT: moleküler adsorpsiyon', null),
      ('%Mert%', 'DFT: mıknatıs ve manyetizma', null)
    ) as t(ad, baslik, aciklama)
  loop
    kisi := null;
    select id into kisi from public.profiles
    where full_name ilike r.ad and is_approved and is_active and kadro is distinct from 'hoca' limit 1;
    if kisi is null then
      raise notice 'Hesap yok, atlandı: % → %', r.ad, r.baslik;
      continue;
    end if;
    if not exists (select 1 from public.group_tasks where assignee_id = kisi and title = r.baslik) then
      insert into public.group_tasks (title, description, assignee_id, assigned_by)
      values (r.baslik, r.aciklama, kisi, veren);
    end if;
  end loop;
end $$;

select p.full_name, count(*) as gorev
from public.group_tasks g join public.profiles p on p.id = g.assignee_id
group by p.full_name order by p.full_name;
