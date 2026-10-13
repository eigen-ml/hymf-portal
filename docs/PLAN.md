# Çalışma alanı ve yönetim paneli: uygulama planı

Bu dosya ajanlar arasındaki sözleşmedir. Tablo, kolon, tip, fonksiyon ve dosya adları burada
yazdığı gibidir. Bir ajan bunlardan farklı bir şeye ihtiyaç duyarsa kendisi değiştirmez, raporunda
yazar. UI kuralları `docs/DESIGN.md` dosyasındadır.

## 1. Kararlar

| Konu | Karar | Kaynak |
| --- | --- | --- |
| Görünürlük | Çalışma alanını yalnız öğrencinin kendisi ve `advisor_assignments`'taki danışman(lar)ı görür. Admin ve superadmin bu kurala dahil değil. | Görev §1 |
| Danışmanlar | Y. Moğulkoç: Sibel, Cengizhan, Ata, Samed, Mert, Mustafa, Sena. A. Moğulkoç: Ali Korkmaz. | Ata, 9 Ekim (Mustafa ve Sena resmî değil, panelden iş veriyor) |
| `gelistirici` | Danışman atanabilir. Çalışma alanı danışman atanınca açılır. Danışmansız geliştiricinin alanı yoktur. | Ata, 9 Ekim |
| M. Kabak | `mkabak@eng.ankara.edu.tr` allowlist'e `hoca` / `uye` olarak girer. | Ata, 9 Ekim (adres grup sitesinde açık) |
| Drive | Her çalışma alanında `drive_url` alanı olur (paylaşılan Google Drive klasör bağlantısı). Gerçek Drive API entegrasyonu yok. | Ata'nın "drive da olsun" isteği |
| Dosyalar | Supabase Storage, private bucket `workspace-files`, dosya ≤ 10 MB, kişi başı 100 MB (20261015000000_dosya_kotasi). Büyükler kişinin kendi Drive klasörüne (`drive_url`, Drive'ım sayfası). VASP büyük çıktıları yüklenmez, `truba_ref` alanına yol/iş no yazılır. | Görev §2a |
| `truba_ref` | Öğrenci, danışmanın eklediği maddede `status` dışında `truba_ref` alanını da değiştirebilir. Görevde yalnız `status` yazıyor, ama TRUBA yolunu işi koşan öğrenci girer. **Açık soru olarak PR'da.** | Orkestratör |
| Hoca kadrosu | `kadro`'yu `hoca`'ya çevirmek veya `hoca`'dan çıkarmak, `hoca` kadrolu birini onaylamak ve `hoca`/admin içeren davet eklemek **yalnız superadmin**. Aksi hâlde admin kendini (veya bir arkadaşını) hoca yapıp danışman atayarak plan görebilirdi. | Orkestratör (görünürlük kuralının gereği) |
| Kendi kadrosu | Superadmin dışında kimse kendi kadrosunu değiştiremez. | Orkestratör |
| Admin'i pasifleştirmek | Admin/superadmin bir hesabı pasifleştirmek veya onayını kaldırmak yalnız superadmin. | Orkestratör |
| Allowlist ne zaman uygulanır | Yalnız e-posta doğrulanınca (`auth.users.email_confirmed_at`). Supabase'de "Confirm email" açık olmalı (KURULUM.md). | Orkestratör (e-posta sahipliği kanıtı) |
| Eski hesaplar | Migration ilk çalıştığında allowlist'te olmayan mevcut profiller `is_approved = false` olur. Eski `handle_new_user` metadata'daki rolü kabul ettiği için bu hesapların rolleri güvenilir değil. Admin panelden yeniden onaylar. | Orkestratör |
| Üye vitrini | `/uyeler` giriş ister. Girişsiz ziyaretçi üye listesini görmez (en kısıtlayıcı varsayılan; liste zaten grubun açık sitesinde var). | Orkestratör |
| Demo modu | `NEXT_PUBLIC_DEMO_MODE=true` yalnız eski demo davranışlarını açar (rol değiştirici, hızlı hesaplar, mock fallback). `/calisma-alani` ve `/yonetim` her zaman gerçek oturum ve gerçek veri kullanır. | Orkestratör |
| Danışman ilişkisi görünürlüğü | `advisor_assignments` satırlarını onaylı her üye okuyabilir (kim kimin danışmanı bilgisi grubun açık sitesinde zaten var). Yazma yalnız admin. | Orkestratör |
| Son güncelleme | Panodaki "son güncelleme", öğrencinin kendi son hareketidir (`last_student_activity_at`). Hocanın madde eklemesi öğrenciyi aktif göstermez. `updated_at` her harekette yine güncellenir. | Orkestratör |
| Danışman bekleyen eşleşmeler | `pending_advisor_assignments(student_email, advisor_email)`. İki taraf da hesap açıp doğruladığında `advisor_assignments`'a taşınır. Ad yerine e-postayla eşleştiği için hesap açılış sırası fark etmez. | Görev §3 önerisi |

## 2. Veri modeli

Migration: `supabase/migrations/20261009000000_calisma_alani.sql`. SQL Editor'den tek seferde
çalışır, idempotenttir. Sıra:

0. Ön kontrol: `public.profiles` veya `public.student_workspaces` yoksa
   `raise exception 'Önce supabase/schema.sql dosyasını çalıştırın (public.profiles bulunamadı).'`
1. Enum'lar: `do $$ begin create type ...; exception when duplicate_object then null; end $$;`
2. `profiles` kolonları + **yalnız ilk çalıştırmada** eski `role`'den geçiş (kolonun daha önce
   olup olmadığına `information_schema.columns` ile bak).
3. Yeni tablolar (`create table if not exists`).
4. Mevcut tablolara kolon ekleme ve FK değişiklikleri (`add column if not exists`,
   `drop constraint if exists` + `add constraint`).
5. Yardımcı fonksiyonlar.
6. Trigger fonksiyonları ve trigger'lar (`drop trigger if exists` + `create trigger`).
7. RLS: aşağıdaki tablolardaki **tüm** mevcut policy'leri `pg_policies` üzerinden döngüyle sil,
   sonra yenilerini oluştur.
8. Storage bucket ve policy'leri.
9. Var olan öğrenci kadrolu, onaylı profiller için eksik `student_workspaces` satırlarını aç.

### 2.1 Enum'lar

```sql
create type public.kadro as enum ('hoca','doktora','yuksek_lisans','lisans','gelistirici');
create type public.yetki as enum ('superadmin','admin','uye');
create type public.plan_durum as enum ('planlandi','devam_ediyor','takildi','incelemede','tamamlandi','iptal');
create type public.guncelleme_turu as enum ('ilerleme','geri_bildirim');
```

"Danışmanlı kadrolar" (danışman atanabilen, çalışma alanı olabilen): `doktora`, `yuksek_lisans`,
`lisans`, `gelistirici`. Profil onayında çalışma alanı otomatik açılan kadrolar: `doktora`,
`yuksek_lisans`, `lisans` (geliştirici için danışman atanınca açılır).

### 2.2 Tablolar

`profiles` (mevcut tabloya eklenenler):

| Kolon | Tip | Not |
| --- | --- | --- |
| `kadro` | `public.kadro` null | Onaylanmamış ve allowlist dışı kullanıcıda null |
| `yetki` | `public.yetki` not null default `'uye'` | |
| `is_active` | boolean not null default true | Pasif hesap hiçbir yetki kullanamaz |
| `is_approved` | default **false** olarak değişir | |
| `academic_title` | default kaldırılır (null) | Unvan panelden girilir |
| `role` | dokunulmaz | `comment on column ... 'DEPRECATED: kadro ve yetki kullanın'` |
| `scholar_url` | `check (scholar_url is null or scholar_url ~* '^https?://') not valid` | `javascript:` bağlantısını engeller |

İlk çalıştırmada geçiş: `role = 'hoca'` → `kadro = 'hoca'`; `role = 'yonetici'` → `yetki = 'admin'`;
ardından allowlist'te olmayan tüm profiller → `is_approved = false`.

`member_allowlist`:

```sql
email text primary key check (email = lower(email) and position('@' in email) > 1),
full_name text not null check (char_length(full_name) between 2 and 120),
kadro public.kadro not null,
yetki public.yetki not null default 'uye',
created_at timestamptz not null default now(),
created_by uuid  -- auth.uid(), FK yok
```

`pending_advisor_assignments`:

```sql
student_email text not null check (student_email = lower(student_email)),
advisor_email text not null check (advisor_email = lower(advisor_email)),
is_primary boolean not null default false,
created_at timestamptz not null default now(),
created_by uuid,
primary key (student_email, advisor_email)
```

`advisor_assignments`:

```sql
student_id uuid not null references public.profiles(id) on delete cascade,
advisor_id uuid not null references public.profiles(id) on delete cascade,
is_primary boolean not null default false,
created_at timestamptz not null default now(),
created_by uuid,
primary key (student_id, advisor_id),
check (student_id <> advisor_id)
-- create unique index if not exists advisor_assignments_tek_birincil
--   on public.advisor_assignments (student_id) where is_primary;
```

`student_workspaces` (mevcut tabloya eklenenler / değişenler):

| Kolon | Değişiklik |
| --- | --- |
| `drive_url` | `text`, `check (drive_url is null or drive_url ~* '^https://')` |
| `last_student_activity_at` | `timestamptz` null |
| `thesis_title` | default kaldırılır (null = "henüz girilmedi") |
| `advisor` | dokunulmaz, `comment ... 'DEPRECATED: advisor_assignments kullanın'` |

`plan_items`:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references public.student_workspaces(id) on delete cascade,
title text not null check (char_length(title) between 1 and 300),
description text check (description is null or char_length(description) <= 5000),
due_date date,
status public.plan_durum not null default 'planlandi',
priority smallint not null default 2 check (priority between 1 and 3),  -- 1 yüksek, 2 normal, 3 düşük
sort_order integer not null default 0,
truba_ref text check (truba_ref is null or char_length(truba_ref) <= 500),
created_by uuid references public.profiles(id) on delete set null,
updated_by uuid references public.profiles(id) on delete set null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
completed_at timestamptz
-- index: (workspace_id, sort_order)
```

`progress_updates`:

```sql
id uuid primary key default gen_random_uuid(),
workspace_id uuid not null references public.student_workspaces(id) on delete cascade,
plan_item_id uuid references public.plan_items(id) on delete set null,
author_id uuid references public.profiles(id) on delete set null,
tur public.guncelleme_turu not null default 'ilerleme',
body text not null check (char_length(body) between 1 and 5000),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
-- index: (workspace_id, created_at desc)
```

`workspace_files` (mevcut tabloya eklenenler / değişenler):

| Kolon | Değişiklik |
| --- | --- |
| `plan_item_id` | `uuid references public.plan_items(id) on delete set null` |
| `storage_path` | `text` (yeni kayıtlarda trigger zorunlu tutar) |
| `size_bytes` | `bigint check (size_bytes is null or size_bytes between 0 and 26214400)` |
| `mime_type` | `text` |
| `file_url` | `drop not null` (artık signed URL kullanılıyor; deprecated) |
| `file_size` | dokunulmaz (deprecated, `size_bytes` kullanılır) |
| `uploaded_by` | `drop not null`, FK `on delete set null` olarak yeniden kurulur |

`workspace_logs` (mevcut tabloya eklenenler / değişenler):

| Kolon | Değişiklik |
| --- | --- |
| `actor_id` | `drop not null`, FK `on delete set null` olarak yeniden kurulur |
| `entity_id` | `uuid` (plan maddesi, not veya dosya id'si; FK yok) |
| `details` | `jsonb not null default '{}'` |
| `action` | text olarak kalır, değerleri aşağıda |

`action` değerleri ve `details`:

| action | details |
| --- | --- |
| `plan_eklendi` | `{baslik}` |
| `plan_guncellendi` | `{baslik, alanlar: text[]}` (yalnız `sort_order` değiştiyse log yazılmaz) |
| `plan_durum` | `{baslik, eski, yeni}` |
| `plan_silindi` | `{baslik}` |
| `ilerleme_eklendi` / `geri_bildirim_eklendi` | `{ozet: left(body, 120)}` |
| `not_guncellendi` / `not_silindi` | `{ozet}` |
| `dosya_yuklendi` / `dosya_silindi` | `{dosya}` |
| `alan_guncellendi` | `{alanlar: text[]}` (thesis_title, summary, drive_url, simulation_notes) |

`uyelik_logs`:

```sql
id uuid primary key default gen_random_uuid(),
actor_id uuid,        -- auth.uid(), sistemde null. FK YOK (geçmiş silinmesin, cascade sorun çıkarmasın)
target_id uuid,       -- etkilenen profil, FK YOK
target_email text,
action text not null,
details jsonb not null default '{}',
created_at timestamptz not null default now()
-- index: (created_at desc)
```

`action` değerleri: `kayit`, `onay`, `onay_kaldirildi`, `kadro`, `yetki`, `aktiflik`,
`danisman_eklendi`, `danisman_kaldirildi`, `danisman_birincil`, `davet_eklendi`, `davet_guncellendi`,
`davet_silindi`. `details` her zaman ad anlık görüntüsünü taşır: `hedef_ad`, `yapan_ad` (bulunursa),
değişiklikte `eski` / `yeni`, danışmanda `danisman_id` / `danisman_ad`, davette `kadro` / `yetki`.

### 2.3 Yardımcı fonksiyonlar

Hepsi `language sql stable security definer set search_path = ''` (try_uuid hariç). Gövdelerde her
nesne şemayla yazılır (`public.profiles`, `auth.uid()`, `'hoca'::public.kadro`). Policy'lerde
`profiles` tablosu **doğrudan sorgulanmaz**, bu fonksiyonlar kullanılır (recursion çözümü).
`auth.uid()` her yerde `(select auth.uid())` olarak yazılır (planlayıcı tek sefer hesaplar).

| Fonksiyon | Döner | Kural |
| --- | --- | --- |
| `public.is_member()` | boolean | Kendi profili `is_approved and is_active` |
| `public.is_admin()` | boolean | `is_member()` koşulu + `yetki in ('admin','superadmin')` |
| `public.is_superadmin()` | boolean | `is_member()` koşulu + `yetki = 'superadmin'` |
| `public.is_hoca()` | boolean | `is_member()` koşulu + `kadro = 'hoca'` |
| `public.is_advisor_of(student uuid)` | boolean | `advisor_assignments`'ta `(student, auth.uid())` satırı var **ve** çağıranın profili `kadro = 'hoca' and is_approved and is_active` |
| `public.workspace_student(ws uuid)` | uuid | `student_workspaces.student_id` |
| `public.can_view_workspace(ws uuid)` | boolean | `is_member()` **ve** (`w.student_id = auth.uid()` **veya** `is_advisor_of(w.student_id)`) |
| `public.try_uuid(t text)` | uuid | plpgsql, `immutable`, geçersiz metinde null (storage klasör adı için) |

İç işlevler (security definer, plpgsql, `set search_path = ''`):

- `public.apply_allowlist(p_user uuid, p_email text)`: allowlist satırı varsa profili
  `kadro/yetki/full_name` ile günceller ve onaylar, öğrenci kadrosundaysa çalışma alanını açar,
  `materialize_pending_advisors(lower(p_email))` çağırır. Güncellemeden önce
  `set_config('hymf.sistem','on',true)`, sonra `set_config('hymf.sistem','off',true)`.
- `public.materialize_pending_advisors(p_email text default null)`: e-postası verilen (veya
  null ise tüm) bekleyen eşleşmelerden **iki tarafı da hazır olanları** (`öğrenci onaylı ve
  danışmanlı kadroda`, `danışman onaylı, aktif, kadro hoca`) `advisor_assignments`'a
  `on conflict do nothing` ile ekler, taşınanları `pending`'den siler. Uygun olmayanları filtrelediği
  için doğrulama trigger'ı hata vermez (kayıt akışı asla kırılmaz). Çağıran `auth.uid()` null değilse
  `is_admin()` olmalı; değilse hata. `revoke execute ... from anon`.

`hymf.sistem` bayrağı yalnız bu iç fonksiyonlarda açılır. İstemci bu ayarı değiştiremez
(PostgREST `set_config` sunmaz).

### 2.4 Trigger'lar

Hata mesajları Türkçe, kullanıcıya gösterilebilir. Yetki hatalarında `errcode = '42501'`.
"Sistem bağlamı" = `(select auth.uid()) is null` (SQL Editor, auth trigger'ları) **veya**
`current_setting('hymf.sistem', true) = 'on'`.

**auth.users**
- `on_auth_user_created` AFTER INSERT → `handle_new_user()`: profil oluşturur
  (`email = lower(new.email)`, `full_name = left(coalesce(nullif(trim(meta.full_name),''), split_part(email,'@',1)), 120)`,
  `department = left(nullif(meta.department,''),120)`, `is_approved = false`, `yetki = 'uye'`, kadro null).
  Metadata'daki `role`, `kadro`, `yetki`, `academic_title`, `is_approved` alanları **okunmaz**.
  `email_confirmed_at` doluysa `apply_allowlist`. `uyelik_logs`'a `kayit`.
- `on_auth_user_confirmed` AFTER UPDATE OF email_confirmed_at, `when (old.email_confirmed_at is null and new.email_confirmed_at is not null)` → `apply_allowlist`.

**profiles**
- BEFORE UPDATE `profiles_guard()` (security definer):
  1. Son superadmin kuralı (sistem bağlamında da geçerli): eski satır aktif, onaylı superadmin ve
     yeni satır superadmin/aktif/onaylı değilse, başka aktif onaylı superadmin yoksa hata
     "Son sistem yöneticisi yetkisini bırakamaz."
  2. Sistem bağlamıysa `return new`.
  3. `id`, `email`, `created_at` değişemez.
  4. Admin değilse `kadro`, `is_approved`, `is_active`, `role` değişemez.
  5. Superadmin değilse: `yetki` değişemez; `kadro` değişiyor ve eski veya yeni değer `hoca` ise
     hata; kendi `kadro`'sunu değiştiremez; onay `false → true` iken satır `yetki <> 'uye'` veya
     `kadro = 'hoca'` ise hata; hedef `yetki in ('admin','superadmin')` ise ve hedef kendisi değilse
     `is_active`/`is_approved` değiştiremez.
- AFTER UPDATE `profiles_after_update()` (security definer): `kadro`, `yetki`, `is_approved`,
  `is_active` değişikliklerini `uyelik_logs`'a yazar. Yeni satır onaylı ve kadrosu
  `doktora/yuksek_lisans/lisans` ise çalışma alanını açar (`on conflict (student_id) do nothing`).
- Not: insert policy yok; profilleri yalnız `handle_new_user` oluşturur.

**member_allowlist**
- BEFORE INSERT OR UPDATE: `email = lower(trim(email))`; insert'te `created_by = auth.uid()`.
  Sistem bağlamı değilse ve superadmin değilse: yeni (veya güncellemede eski) satırda
  `yetki <> 'uye'` veya `kadro = 'hoca'` varsa hata "Yönetici ya da öğretim üyesi davetini yalnız
  sistem yöneticisi ekleyebilir."
- AFTER INSERT: aynı e-postayla **onaylanmamış** ve e-postası doğrulanmış (`auth.users`) bir profil
  varsa `apply_allowlist`. (Böylece önce kayıt olup bekleyen kişi davetle onaylanır.)
- AFTER INSERT/UPDATE/DELETE: `uyelik_logs` (`davet_*`).

**pending_advisor_assignments**
- BEFORE INSERT: e-postaları küçült, `created_by = auth.uid()`.
- AFTER INSERT: `materialize_pending_advisors(new.student_email)`.

**advisor_assignments**
- BEFORE INSERT OR UPDATE `advisor_assignments_guard()` (security definer, sistem bağlamında da
  çalışır, çünkü bu bir veri kuralıdır): danışman profili `kadro = 'hoca' and is_approved and
  is_active` değilse "Danışman yalnız öğretim üyesi olabilir."; öğrenci profili danışmanlı
  kadrolardan biri değilse "Danışman yalnız öğrenci kadrosundaki üyeye atanabilir."; update'te
  `student_id`/`advisor_id` değişemez; insert'te `created_by = auth.uid()`.
- AFTER INSERT: öğrencinin çalışma alanını aç (`on conflict do nothing`).
- AFTER INSERT/UPDATE/DELETE: `uyelik_logs` (`danisman_eklendi`, `danisman_birincil`,
  `danisman_kaldirildi`). Ad anlık görüntüleri profiles'tan okunur, profil yoksa null kalır.

**student_workspaces**
- BEFORE UPDATE: sistem bağlamı değilse `student_id` değişemez. `updated_at = now()`. İçerik
  kolonlarından biri (`thesis_title`, `summary`, `drive_url`, `simulation_notes`) değiştiyse ve
  `auth.uid() = student_id` ise `last_student_activity_at = now()`.
- AFTER UPDATE: içerik kolonları değiştiyse `workspace_logs` (`alan_guncellendi`).

**plan_items**
- BEFORE INSERT: `created_by = updated_by = coalesce(auth.uid(), new.created_by)`;
  `created_at = updated_at = now()`; `sort_order` 0 ise `coalesce(max(sort_order)+1, 1)` (aynı
  çalışma alanında); `completed_at = case when status = 'tamamlandi' then now() end`.
- BEFORE UPDATE `plan_items_guard()` (security definer):
  - `workspace_id`, `created_by`, `created_at` değişemez (sistem bağlamı hariç).
  - Sistem bağlamı değilse ve çağıran `is_advisor_of(workspace_student(old.workspace_id))`
    değilse (yani öğrenciyse) ve `old.created_by is distinct from auth.uid()` ise:
    `(title, description, due_date, priority, sort_order)` değişirse hata "Danışmanın eklediği
    maddede yalnız durum ve TRUBA bilgisi değiştirilebilir."
  - `updated_by = coalesce(auth.uid(), new.updated_by)`, `updated_at = now()`.
  - `status` `tamamlandi` olduysa ve önceden değilse `completed_at = now()`; `tamamlandi` değilse
    `completed_at = null`. İstemcinin gönderdiği `completed_at` yok sayılır.
- AFTER INSERT/UPDATE/DELETE `plan_items_log()` (security definer): `workspace_logs` yazar (bkz.
  action tablosu) ve `touch_workspace(workspace_id)` çağırır. **Çalışma alanı satırı yoksa (cascade
  silme) hiçbir şey yazmaz.**

**progress_updates**
- BEFORE INSERT (security definer): `author_id = coalesce(auth.uid(), new.author_id)`; sistem
  bağlamı değilse `tur = case when is_advisor_of(workspace_student(workspace_id)) then 'geri_bildirim' else 'ilerleme' end`
  (istemcinin gönderdiği tür yok sayılır); `plan_item_id` doluysa aynı çalışma alanına ait olmalı.
- BEFORE UPDATE: `workspace_id`, `author_id`, `tur`, `created_at` değişemez; `updated_at = now()`;
  `plan_item_id` kontrolü.
- AFTER INSERT/UPDATE/DELETE: log + `touch_workspace`.

**workspace_files**
- BEFORE INSERT: `uploaded_by = coalesce(auth.uid(), new.uploaded_by)`; `storage_path` null olamaz
  ve `workspace_id::text || '/'` ile başlamalı; `plan_item_id` aynı çalışma alanına ait olmalı.
- AFTER INSERT/DELETE: log + `touch_workspace`.

**`public.touch_workspace(ws uuid)`** (security definer, plpgsql): `updated_at = now()`; çağıran
o alanın öğrencisiyse `last_student_activity_at = now()` da. `revoke execute ... from anon, authenticated`
(yalnız trigger'lar çağırır).

### 2.5 RLS policy'leri

Hepsi `to authenticated`. `using` / `with check` içinde yalnız yardımcı fonksiyonlar ve satırın
kendi kolonları kullanılır.

| Tablo | select | insert | update | delete |
| --- | --- | --- | --- | --- |
| `profiles` | `id = auth.uid() or is_member()` | yok | `using/check (id = auth.uid() or is_admin())` (+ guard trigger) | yok |
| `member_allowlist` | `is_admin()` | `is_admin()` (+ trigger) | `is_admin()` | `is_admin()` |
| `pending_advisor_assignments` | `is_admin()` | `is_admin()` | yok | `is_admin()` |
| `advisor_assignments` | `is_member()` | `is_admin()` | `is_admin()` | `is_admin()` |
| `student_workspaces` | `can_view_workspace(id)` | yok | `can_view_workspace(id)` | yok |
| `plan_items` | `can_view_workspace(workspace_id)` | `can_view_workspace(workspace_id)` | `can_view_workspace(workspace_id)` (+ guard) | `is_advisor_of(workspace_student(workspace_id)) or (created_by = auth.uid() and workspace_student(workspace_id) = auth.uid())` |
| `progress_updates` | `can_view_workspace(workspace_id)` | `can_view_workspace(workspace_id)` | `author_id = auth.uid() and can_view_workspace(workspace_id)` | aynı |
| `workspace_files` | `can_view_workspace(workspace_id)` | `can_view_workspace(workspace_id)` | yok | `can_view_workspace(workspace_id) and (uploaded_by = auth.uid() or is_advisor_of(workspace_student(workspace_id)))` |
| `workspace_logs` | `can_view_workspace(workspace_id)` | **yok** (yalnız trigger) | yok | yok |
| `uyelik_logs` | `is_admin()` | yok | yok | yok |
| `announcements` | `is_member()` | `is_member() and author_id = auth.uid()` | yok | `author_id = auth.uid() or is_hoca() or is_admin()` |
| `resources` | `is_member()` | `is_member() and uploader_id = auth.uid()` | yok | `uploader_id = auth.uid() or is_hoca() or is_admin()` |
| `courses`, `course_materials` | `is_member()` | `is_hoca() or is_admin()` | yok | yok |
| `meetings` | `is_member()` | `is_member() and creator_id = auth.uid()` | yok | yok |

### 2.6 Storage

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workspace-files', 'workspace-files', false, 26214400, array[
  'application/pdf','image/png','image/jpeg','text/csv','text/plain','application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

Yol: `{workspace_id}/{uuid}-{güvenli_dosya_adı}`. `storage.objects` policy'leri (`drop policy if exists` ile):

- `"workspace-files okuma"` select: `bucket_id = 'workspace-files' and public.can_view_workspace(public.try_uuid((storage.foldername(name))[1]))`
- `"workspace-files yükleme"` insert: aynı koşul (with check).
- `"workspace-files silme"` delete: aynı koşul `and (owner_id = (select auth.uid())::text or public.is_advisor_of(public.workspace_student(public.try_uuid((storage.foldername(name))[1]))))`
- update policy yok (üzerine yazma yok).

### 2.7 Seed ve test

- `supabase/seed_uyeler.sql`: allowlist'e 4 kişi (Y. Moğulkoç `hoca/admin`, A. Moğulkoç
  `hoca/admin`, Ata `gelistirici/superadmin`, M. Kabak `hoca/uye`), `on conflict (email) do update`.
  Diğer 7 kişi `-- TODO e-posta` yorum satırı. Danışman bloğu: `pending_advisor_assignments`'a
  Ata → Y. Moğulkoç (birincil). Diğer eşleşmeler yorum satırı, öğrenci e-postası yerine `TODO`.
  Dosya sonunda `select public.materialize_pending_advisors();`
- `supabase/tests/rls_kontrol.sql`: `begin; ... rollback;`. Test kullanıcıları `auth.users`'a sabit
  UUID'lerle eklenir (`email_confirmed_at = now()`), profilleri postgres olarak ayarlanır. Her
  senaryo `set local role authenticated; select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);`
  ile başlar, `reset role;` ile biter. Başarısız senaryo `raise exception 'KALDI: ...'` ile durur;
  en sonda `select 'Tüm RLS kontrolleri geçti' as sonuc;`. Senaryolar §6 H1 brief'inde.

## 3. TypeScript

Sözleşme dosyaları (Dalga 0'da orkestratör yazdı, ajanlar **değiştirmez**):

- `src/types/database.ts`: tüm tablo tipleri.
- `src/lib/etiketler.ts`: enum → Türkçe etiket eşlemeleri.
- `src/lib/yetki.ts`: profil üzerinden saf yetki yardımcıları + çalışma alanı izin hesapları.
- `src/lib/zaman.ts`: tarih biçimleri ve göreli zaman (Europe/Istanbul).
- `src/lib/cn.ts`: `cn()` (clsx + tailwind-merge).
- `src/components/ui/*`: ortak UI bileşenleri (DESIGN.md §6).

### 3.1 Veri katmanı (`src/lib/data/`, H2)

Her fonksiyon ilk parametre olarak bir `SupabaseClient` alır; böylece hem sunucuda
(`@/lib/supabase/server`) hem istemcide (`@/lib/supabase/client`) çalışır. UI kodu yok.
Dönüş tipi her zaman `Promise<Sonuc<T>>`:

```ts
// src/lib/data/_sonuc.ts
export type Sonuc<T> = { data: T; error: null } | { data: null; error: string };
export function ok<T>(data: T): Sonuc<T>;
export function hata(e: unknown): Sonuc<never>; // PostgrestError / StorageError / Error → Türkçe mesaj
```

`hata()` eşlemesi: `42501` veya "row-level security" → "Bu işlem için yetkiniz yok.";
`P0001` (trigger `raise exception`) → mesajın kendisi; `23505` → "Bu kayıt zaten var.";
`23514` → "Girilen değer kurallara uymuyor."; diğerleri → "Beklenmeyen bir hata oluştu." + konsola
ayrıntı.

```ts
// profiles.ts
getProfile(sb, id: string): Promise<Sonuc<Profile | null>>
listMembers(sb): Promise<Sonuc<Profile[]>>                // onaylı + aktif, full_name sırasıyla
updateOwnProfile(sb, id: string, patch: ProfileSelfUpdate): Promise<Sonuc<Profile>>
listAdvisorsByStudent(sb): Promise<Sonuc<Record<string, ProfileSummary[]>>> // student_id → danışmanlar (birincil önce)

// workspaces.ts
getCalismaAlaniVerisi(sb, studentId: string): Promise<Sonuc<CalismaAlaniVerisi | null>> // görme yetkisi yoksa null
updateWorkspaceInfo(sb, workspaceId: string, patch: WorkspaceInfoUpdate): Promise<Sonuc<StudentWorkspace>>
getDanismanPanosu(sb, advisorId: string): Promise<Sonuc<PanoSatiri[]>>

// plan.ts
listPlanItems(sb, workspaceId: string): Promise<Sonuc<PlanItem[]>>  // sort_order, created_at sırası; creator özetli
createPlanItem(sb, input: PlanItemInput): Promise<Sonuc<PlanItem>>
createPlanItemsBulk(sb, workspaceId: string, titles: string[], ortak?: Pick<PlanItemInput, 'due_date' | 'priority'>): Promise<Sonuc<PlanItem[]>>
updatePlanItem(sb, id: string, patch: PlanItemPatch): Promise<Sonuc<PlanItem>>
updatePlanStatus(sb, id: string, status: PlanDurum): Promise<Sonuc<PlanItem>>
deletePlanItem(sb, id: string): Promise<Sonuc<null>>
reorderPlanItems(sb, orderedIds: string[]): Promise<Sonuc<null>>   // sort_order = index + 1

// progress.ts
listProgressUpdates(sb, workspaceId: string): Promise<Sonuc<ProgressUpdate[]>> // yeni → eski, yazar özetli
addProgressUpdate(sb, input: ProgressUpdateInput): Promise<Sonuc<ProgressUpdate>>
updateProgressUpdate(sb, id: string, body: string): Promise<Sonuc<ProgressUpdate>>
deleteProgressUpdate(sb, id: string): Promise<Sonuc<null>>

// files.ts
DOSYA_SINIRI_BAYT = 10_485_760; KOTA_BAYT = 104_857_600; IZINLI_MIME_TURLERI: readonly string[]
listFiles(sb, workspaceId: string): Promise<Sonuc<WorkspaceFile[]>>
uploadFile(sb, input: { workspaceId: string; file: File; planItemId?: string | null; notes?: string | null }): Promise<Sonuc<WorkspaceFile>>
getDownloadUrl(sb, storagePath: string): Promise<Sonuc<string>>   // 60 sn signed URL
deleteFile(sb, file: Pick<WorkspaceFile, 'id' | 'storage_path'>): Promise<Sonuc<null>>
listWorkspaceLogs(sb, workspaceId: string, limit = 50): Promise<Sonuc<WorkspaceLog[]>>

// admin.ts (yalnız server action'lardan çağrılır; yetkiyi RLS ve action ayrıca kontrol eder)
listAllProfiles(sb): Promise<Sonuc<Profile[]>>                       // bekleyen ve pasifler dahil
approveMember(sb, id: string, kadro: Kadro): Promise<Sonuc<Profile>>
updateMember(sb, id: string, patch: AdminProfileUpdate): Promise<Sonuc<Profile>>
setYetki(sb, id: string, yetki: Yetki): Promise<Sonuc<Profile>>
listAdvisorAssignments(sb): Promise<Sonuc<AdvisorAssignment[]>>      // advisor ve student özetli
addAdvisor(sb, studentId: string, advisorId: string, isPrimary: boolean): Promise<Sonuc<null>>
removeAdvisor(sb, studentId: string, advisorId: string): Promise<Sonuc<null>>
setPrimaryAdvisor(sb, studentId: string, advisorId: string): Promise<Sonuc<null>> // önce hepsini false, sonra biri true
listAllowlist(sb): Promise<Sonuc<MemberAllowlistEntry[]>>
upsertAllowlist(sb, entry: AllowlistInput): Promise<Sonuc<MemberAllowlistEntry>>
deleteAllowlist(sb, email: string): Promise<Sonuc<null>>
listPendingAdvisors(sb): Promise<Sonuc<PendingAdvisorAssignment[]>>
addPendingAdvisor(sb, studentEmail: string, advisorEmail: string, isPrimary: boolean): Promise<Sonuc<null>>
removePendingAdvisor(sb, studentEmail: string, advisorEmail: string): Promise<Sonuc<null>>
listUyelikLogs(sb, limit = 100): Promise<Sonuc<UyelikLog[]>>
```

Saf hesaplar (`src/lib/calisma/hesap.ts`, H2):

```ts
gecikmisMi(item: Pick<PlanItem, 'status' | 'due_date'>, bugun = bugunISO()): boolean
acikMi(item: Pick<PlanItem, 'status'>): boolean            // planlandi, devam_ediyor, takildi, incelemede
grupla(items: PlanItem[], bugun?): { gecikmis: PlanItem[]; acik: PlanItem[]; tamamlanan: PlanItem[]; iptal: PlanItem[] }
ilerlemeYuzdesi(items: Pick<PlanItem, 'status'>[]): number | null  // tamamlandi / (toplam - iptal); payda 0 ise null
panoSayilari(items: PlanItem[], bugun?): Pick<PanoSatiri, 'acik' | 'gecikmis' | 'tamamlanan' | 'toplam' | 'ilerleme'>
guvenliDosyaAdi(ad: string): string                        // Türkçe harfleri sadeleştir, [a-z0-9._-], ≤ 80 karakter
```

"Açık" sayısı gecikmişleri de içerir; "gecikmiş" açıkların alt kümesidir. Çalışma alanındaki
gruplamada ise gecikmiş maddeler "Açık" grubunda tekrar görünmez.

## 4. Kimlik doğrulama ve rota koruması (Next 16)

Kaynak: `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`,
`03-api-reference/03-file-conventions/proxy.md`, `02-guides/authentication.md`,
`02-guides/server-actions.md`, `03-api-reference/04-functions/cookies.md`.

Doğrulanan kurallar:

- Next 16'da `middleware.ts` **deprecated**, adı `proxy.ts`. Dosya `src/proxy.ts`, export `proxy`
  (veya default). Node runtime'da çalışır, `runtime` ayarı verilmez.
- Proxy yalnız **iyimser** kontrol içindir: cookie'den oturumu okur, DB sorgusu yapmaz. Asıl kontrol
  veriye yakın yapılır (DAL, RLS).
- Layout'ta yetki kontrolü yapma: layout gezinmede yeniden render olmaz ve alt segmentlerin
  çalışmasını engellemez. Kontrol her `page.tsx`'te ve her server action'da.
- `cookies()` async: `const store = await cookies()`. Server Component'te yalnız okunur, yazma
  Server Function veya Route Handler'da.
- Server action'lar herkese açık POST uç noktası gibidir: her action kendi içinde oturum ve yetki
  kontrolü yapar, girdiyi doğrular, istemciye yalnız UI'ın ihtiyacı olanı döner.
- `redirect()` hata fırlatarak çalışır, `try` bloğunun **dışında** çağrılır.
- `forbidden()` / `unauthorized()` hâlâ deneysel (`authInterrupts`), **kullanılmaz**. 403 için
  `<ErisimEngellendi />` bileşeni render edilir.
- Dinamik sayfa: `export default async function Page(props: PageProps<'/calisma-alani/[ogrenciId]'>) { const { ogrenciId } = await props.params; }`
  (`PageProps` global, import edilmez).
- İstemcide mutasyondan sonra `router.refresh()` sunucu bileşenlerini yeniden çalıştırır. Server
  action içinde `revalidatePath()` veya `refresh()` (`next/cache`).

### 4.1 Proxy (H3)

```ts
// src/proxy.ts
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
```

```ts
// src/lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const KORUMALI = ['/calisma-alani', '/yonetim', '/profil', '/uyeler', '/onay-bekleniyor', '/sifre-yenile'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(URL, KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();   // createServerClient ile getClaims arasında kod yok
  const path = request.nextUrl.pathname;
  const korumali = KORUMALI.some((p) => path === p || path.startsWith(p + '/'));
  if (!data?.claims?.sub && korumali) {
    const url = request.nextUrl.clone();
    url.pathname = '/giris';
    url.search = '';
    url.searchParams.set('next', path);
    const yonlendir = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => yonlendir.cookies.set(c));
    return yonlendir;
  }
  return response;
}
```

### 4.2 DAL (H3): `src/lib/auth/dal.ts`

```ts
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';

export const getOturumKullanicisi = cache(async (): Promise<{ id: string; email: string | null } | null> => { /* getClaims */ });
export const getMevcutProfil = cache(async (): Promise<Profile | null> => { /* profiles where id = sub */ });
export async function requireMember(): Promise<Profile>;      // oturum yok → redirect('/giris'); onaysız/pasif → redirect('/onay-bekleniyor')
export async function requireAdminAction(): Promise<Profile>; // server action için: üye değil veya admin değilse throw new Error('Bu işlem için yetkiniz yok.')
```

Sayfa kalıbı:

```tsx
export default async function Page() {
  const ben = await requireMember();
  if (!isAdmin(ben)) return <ErisimEngellendi />;
  const sb = await createClient();          // @/lib/supabase/server
  const sonuc = await listAllProfiles(sb);
  ...
}
```

Server action kalıbı (`src/app/yonetim/actions.ts`):

```ts
'use server';
export async function uyeyiOnayla(id: string, kadro: Kadro): Promise<ActionSonucu> {
  await requireAdminAction();
  if (!KADROLAR.includes(kadro)) return { ok: false, error: 'Geçersiz kadro.' };
  const sb = await createClient();
  const r = await approveMember(sb, id, kadro);
  if (r.error) return { ok: false, error: r.error };
  revalidatePath('/yonetim');
  return { ok: true };
}
// export type ActionSonucu = { ok: true } | { ok: false; error: string };
```

### 4.3 Diğer kimlik parçaları (H3)

- `src/app/auth/callback/route.ts` (GET): `code` → `exchangeCodeForSession`; `next` parametresi
  yalnız `/` ile başlayan iç yol olabilir (`//` ile başlayamaz), değilse `/`. Hata → `/giris?hata=baglanti`.
- Kayıt: `signUp({ email, password, options: { emailRedirectTo: origin + '/auth/callback', data: { full_name, department } } })`.
  Metadata'ya rol/kadro/yetki/unvan **gönderilmez**.
- Şifre sıfırlama: `resetPasswordForEmail(email, { redirectTo: origin + '/auth/callback?next=/sifre-yenile' })`;
  `/sifre-yenile` sayfası `updateUser({ password })`.
- `/onay-bekleniyor`: sunucu sayfası. Oturum yok → `/giris`; onaylı ve aktif → `/`. Onaysızsa
  "Hesabınız onay bekliyor", pasifse "Hesabınız pasif" metni, çıkış butonu.
- `src/lib/demo.ts`: `export const DEMO_MODU = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';`
- `AuthContext`:

```ts
interface AuthContextType {
  profile: Profile | null;          // varsayılan null
  isLoading: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isHoca: boolean;
  /** @deprecated kadro ve yetki kullanın. Eski sayfalar için: hoca → 'hoca', admin/superadmin → 'yonetici', diğer → 'arastirmaci' */
  role: UserRole;
  loginAs: (profileId: string) => void;   // yalnız demo modunda çalışır
  logout: () => Promise<void>;            // supabase.auth.signOut + demo kaydını sil + router.refresh()
  refreshProfile: () => Promise<void>;
  /** @deprecated yalnız yerel state günceller; kalıcı kayıt için updateOwnProfile */
  updateProfile: (updated: Partial<Profile>) => void;
}
```

## 5. Rotalar

| Rota | Erişim | Sahip |
| --- | --- | --- |
| `/` | Herkes. Üye özeti yalnız girişli üyeye. | Orkestratör |
| `/giris`, `/kayit` | Herkes | H3 |
| `/auth/callback` | Herkes (route handler) | H3 |
| `/sifre-yenile` | Oturum | H3 |
| `/onay-bekleniyor` | Oturum | H3 |
| `/calisma-alani` | Üye. Öğrencisi olan hoca → pano; çalışma alanı olan → kendi alanı; hoca ve öğrencisi yok → boş durum; diğer → "çalışma alanınız yok" | H5 |
| `/calisma-alani/[ogrenciId]` | Üye. Kendisi ise `/calisma-alani`'ya yönlendir. Danışman değilse `<ErisimEngellendi />` | H5 |
| `/yonetim` (Üyeler) | admin, superadmin | H6 |
| `/yonetim/davetler` | admin, superadmin | H6 |
| `/yonetim/yetkiler` | yalnız superadmin | H6 |
| `/yonetim/gecmis` (İşlem geçmişi) | admin, superadmin | H6 |
| `/profil` | Üye | H7 |
| `/uyeler` | Üye | H7 |
| `/duyurular`, `/kaynaklar`, `/dersler`, `/toplantilar` | Herkes, mock + "Örnek veri" notu | H8 |
| `/kilavuzlar`, `/formlar` | Herkes, statik | H8 |

## 6. Bileşen sözleşmeleri (Dalga 2)

Orkestratör, Dalga 2'den önce aşağıdaki iki bileşenin **imzalı iskeletini** yazar. Böylece H4 ve H5
birbirini beklemeden derlenir.

```ts
// src/components/calisma/CalismaAlani.tsx  ('use client', H4 doldurur)
export interface CalismaAlaniProps {
  veri: CalismaAlaniVerisi;
  izleyici: IzleyiciBaglami;          // src/lib/yetki.ts
  planAraclari?: React.ReactNode;     // H5'in "toplu ekle" aracı buraya gelir (yalnız danışmanda)
}
export function CalismaAlani(props: CalismaAlaniProps): React.JSX.Element;

// src/components/calisma/DanismanPanosu.tsx  ('use client', H5 doldurur)
export interface DanismanPanosuProps { satirlar: PanoSatiri[] }
export function DanismanPanosu(props: DanismanPanosuProps): React.JSX.Element;
```

Mutasyon kalıbı (H4, H5): istemci bileşeni `createClient()` (`@/lib/supabase/client`) ile veri
katmanı fonksiyonunu çağırır, hata varsa satır içinde gösterir, başarıda `router.refresh()`.
İzinler yalnız UX içindir, `src/lib/yetki.ts` içindeki `planIzinleri()` kullanılır; asıl koruma DB'de.

## 7. Dosya sahipliği

Bir ajan yalnız kendi satırındaki dosyalara yazar. "Okur" sütunu bağımlılıktır, değiştirilmez.

| Ajan | Yazar | Okur |
| --- | --- | --- |
| Orkestratör | `docs/**`, `src/types/database.ts`, `src/lib/{etiketler,yetki,zaman,cn}.ts`, `src/components/ui/**`, `src/app/globals.css`, `src/app/layout.tsx`, `src/components/{Navbar,Footer}.tsx` (H3'ün Navbar kısmı hariç; `RoleBadge` yerine `ui/YetkiRozeti`), `src/lib/mockData.ts` (tip uyumu), Dalga 2 iskeletleri, `src/app/page.tsx` (veri ve görsel; H7'den alındı, iki kez yazılmasın diye) | hepsi |
| H1 SQL | `supabase/schema.sql`, `supabase/migrations/20261009000000_calisma_alani.sql`, `supabase/seed_uyeler.sql`, `supabase/tests/rls_kontrol.sql` | PLAN.md |
| H2 veri | `src/lib/data/{_sonuc,profiles,workspaces,plan,progress,files,admin}.ts`, `src/lib/calisma/hesap.ts` | tipler, `src/lib/supabase/*` |
| H3 auth | `src/context/AuthContext.tsx`, `src/app/giris/page.tsx`, `src/app/kayit/page.tsx`, `src/app/onay-bekleniyor/page.tsx` (+ yalnız bu klasörde istemci bileşeni), `src/app/sifre-yenile/page.tsx`, `src/app/auth/callback/route.ts`, `src/proxy.ts`, `src/lib/supabase/proxy.ts`, `src/lib/auth/dal.ts`, `src/lib/demo.ts`, `.env.local.example`, `src/components/Navbar.tsx` (**yalnız** demo rol değiştirici bloğu ve onu besleyen import/state) | tipler, ui |
| H4 öğrenci görünümü | `src/components/calisma/{CalismaAlani,TezBilgisi,PlanListesi,PlanMaddesiFormu,IlerlemeKutusu,Defter,Dosyalar,IslemGecmisi}.tsx` | veri katmanı, ui |
| H5 pano | `src/app/calisma-alani/page.tsx`, `src/app/calisma-alani/[ogrenciId]/page.tsx`, `src/components/calisma/{DanismanPanosu,TopluEkle}.tsx` | `CalismaAlani` (import), veri katmanı, dal, ui |
| H6 yönetim | `src/app/yonetim/**`, `src/components/yonetim/**` | veri katmanı, dal, ui |
| H7 vitrin | `src/app/uyeler/**`, `src/app/profil/**` | veri katmanı, dal, ui |
| H8 cila (Dalga 2'ye alındı) | `src/app/{duyurular,kaynaklar,dersler,toplantilar,kilavuzlar,formlar}/page.tsx`, `src/components/CodeBlock.tsx` ("Örnek veri" notu dahil) | DESIGN.md §9 eşleştirme tablosu, ui |

## 8. Dalgalar ve commit'ler

| Dalga | İş | Commit |
| --- | --- | --- |
| 0 | Git, PLAN, DESIGN, sözleşme dosyaları, ui bileşenleri | `docs: çalışma alanı planı ve tasarım rehberi`, `feat(ui): tasarım token'ları ve ortak bileşenler` |
| 1 | H1, H2, H3 paralel | `feat(db): ...`, `feat(data): ...`, `fix(auth): ...` |
| 2 | H4, H5, H6, H7, H8 paralel | `feat(calisma-alani): ...`, `feat(yonetim): ...`, `feat(uyeler): ...` |
| 3 | Navbar, ana sayfa ve yeni sayfaların görsel geçişi (orkestratör) | `style: ...` |
| 4 | Doğrulama, KURULUM.md | `docs: kurulum adımları` |
| 5 | Push, PR | |

Her dalga sonunda: `npx tsc --noEmit`, `npm run lint`; Dalga 2 sonrası `npm run build`.

## 9. Açık sorular (PR'a taşınacak)

1. Öğrenci, danışmanın eklediği maddede `truba_ref` alanını da düzenleyebiliyor (görevde yalnız `status`).
2. Hoca kadrosu atamak ve hoca/admin davet etmek yalnız superadmin'de. Yeşim ve Aybey Hoca yeni bir
   öğretim üyesini kendileri ekleyemez, Ata ekler.
3. `/uyeler` giriş istiyor.
4. Migration ilk çalıştığında allowlist dışındaki eski hesapların onayı kalkıyor.
5. Mustafa ve Sena'nın danışmanlığı resmî değil ama sistemde danışman olarak görünüyor (eş danışman
   ayrımı yok).
6. Supabase'in yerleşik SMTP'si üyelere doğrulama e-postası göndermeyebilir (KURULUM.md §1).
7. `scholar_url` kısıtı `not valid`: eski satırlar denetlenmez, yalnız yeni yazımlar.
