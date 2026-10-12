# Kurulum ve canlıya alma (Ata için)

Sıra önemli: **önce veritabanı, sonra test, en son `main`'e push (otomatik canlıya çıkar).** Yeni kod, migration
çalışmadan canlıya çıkarsa site kırılır.

## 1. Supabase Auth ayarları (fkjjpjvozrexaxpvevum)

- Authentication → Sign In / Providers: **"Allow new users to sign up" kapalı** olmalı. Portalda açık
  kayıt yok; hesapları yöneticiler /yonetim → Davetler → "Üye ekle" ile açar (geçici şifreyle, e-posta
  gerekmez). Açık kalırsa kayıt sayfası olmasa da API'den hesap açılabilir (onaysız kalır, yine de kapatın).
- Şifre unutan üye: e-posta ile sıfırlama yok (yerleşik SMTP üyelere göndermez). Yönetici /yonetim →
  Üyeler → Düzenle → "Şifre sıfırla" ile yeni geçici şifre verir. Hoca ve yönetici hesaplarınınkini
  yalnız superadmin sıfırlar; işlem üyelik geçmişine yazılır.
- Authentication → Providers → Email: **Confirm email açık** olmalı. Davet listesi yalnız e-posta
  doğrulanınca uygulanır; kapalıysa başkası Ata'nın adresiyle kayıt olup superadmin olabilir.
- Authentication → URL Configuration: Site URL `https://hymf-portal.vercel.app`; Redirect URLs'e
  `https://hymf-portal.vercel.app/auth/callback` ve `http://localhost:3000/auth/callback` ekleyin.
- SMTP: Supabase'in yerleşik e-posta servisi yalnız proje ekibindeki adreslere gönderebilir ve saatlik
  sınırı düşüktür. Doğrulama e-postaları üyelere gitmezse ya özel SMTP tanımlayın (Settings → Auth →
  SMTP) ya da kullanıcıyı Authentication → Users → Add user → "Auto Confirm User" ile oluşturun
  (doğrulanmış sayılır, davet listesi hemen uygulanır).

## 2. Veritabanı (SQL Editor)

Önce yedek alın: `npx supabase db dump --project-ref fkjjpjvozrexaxpvevum -f yedek.sql` (veya
Dashboard → Database → Backups).

1. Durumu kontrol edin: `select to_regclass('public.profiles');` Sonuç boşsa önce
   `supabase/schema.sql` dosyasını çalıştırın.
2. `supabase/migrations/20261009000000_calisma_alani.sql` dosyasının tamamını yapıştırıp çalıştırın.
   Tekrar çalıştırmak güvenlidir. Not: ilk çalıştırmada mevcut tüm hesaplar onaysız olur (eski kayıt
   akışı rolü metadata'dan aldığı için güvenilmez); davet listesindekiler 3. adımda yeniden onaylanır,
   diğerlerini /yonetim'den onaylayın.
3. `supabase/migrations/20261010000000_icerik.sql` dosyasını çalıştırın (duyuru, kaynak, ders,
   toplantı için silme kuralları ve bağlantı kısıtları). 2. adımı yeniden çalıştırırsanız bunu da
   ardından yeniden çalıştırın; 2. adım bu tabloların kurallarını silip yeniden kurar.
   Ardından sırayla `supabase/migrations/20261011000000_gorev_takvim.sql` (görevler, takvim,
   Apple Takvim aboneliği) ve `supabase/migrations/20261012000000_toplanti_yetki.sql` (grup
   toplantısını yalnız hoca ve yöneticiler ekler). Ardından `supabase/migrations/20261013000000_takvim_senkron.sql`
   (toplantının bitişi, yeri ve düzenlenmesi; takvim aboneliğinin çekim kaydı; yalnız ekleme yapar, eski kod bozulmaz).
4. `supabase/seed_uyeler.sql` dosyasını çalıştırın.
5. `supabase/tests/rls_kontrol.sql` → son satır **"Tüm RLS kontrolleri geçti"** olmalı. Ardından
   `supabase/tests/kayit_akisi.sql` → **"Kayıt akışı kontrolleri geçti"**. İkisi de her şeyi geri
   alır, gerçek veriye dokunmaz. Son olarak `supabase/tests/gorev_takvim_kontrol.sql` →
   **"Görev/takvim kontrolleri geçti"**, en son `supabase/tests/takvim_senkron_kontrol.sql` →
   **"Takvim senkron kontrolleri geçti"**.
6. Storage kontrolü:
   `select id, public, file_size_limit from storage.buckets where id = 'workspace-files';`
   → `public = false`, `file_size_limit = 26214400`.

CLI ile (`npx supabase link --project-ref fkjjpjvozrexaxpvevum` + `npx supabase db push`) de
uygulanabilir, ancak `schema.sql` bir migration olmadığı için boş bir veritabanında önce 1. adımı
SQL Editor'de yapın.

## 3. Vercel ortam değişkenleri

- `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlı olmalı.
- `NEXT_PUBLIC_DEMO_MODE=false` ekleyin (`npx vercel env add NEXT_PUBLIC_DEMO_MODE production`).
  Tanımsız olması da kapalı demektir.
- `SUPABASE_SERVICE_ROLE_KEY` (Sensitive, production + preview): "Üye ekle" hesabı bununla açar.
  Yalnız sunucuda, `src/lib/supabase/admin.ts` içinde ve davet satırı yöneticinin kendi oturumuyla
  yazıldıktan sonra kullanılır. Değeri Supabase → Settings → API Keys → `service_role`.
  `NEXT_PUBLIC_` önekiyle ASLA eklemeyin.
- `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID` yalnız **Production**'da. Duyurular ve grup toplantısı
  bildirimleri (ekleme, saat/yer değişikliği, iptal) bununla gider. Tanımlı olmayan ortamda (yerel,
  preview) gönderim atlanır ve yalnız loglanır.
- Preview'da denemek için Preview ortamına aynı `TELEGRAM_BOT_TOKEN`'ı ve **kendi** sohbet kimliğini
  koy, gruba gitmesin. Kendi kimliğin: önce bota özelden "Start" de, sonra Telegram'da @userinfobot'a
  yaz, verdiği sayı (Id) sohbet kimliğindir.
- Takvim abonelik bağlantıları ve Telegram mesajlarındaki portal bağlantısı her ortamda
  `https://hymf-portal.vercel.app`'e gider (`src/lib/site.ts`). Alan adı değişirse orayı güncelle.

## 4. Canlıya alma

Vercel, `eigen-ml/hymf-portal` fork'una bağlı; `main`'e giren her commit otomatik canlıya çıkar,
diğer dallar preview adresi alır. Sıra: migration (SQL Editor) → test SQL → dal pushlanır, preview
denenir → Ata `git push origin <dal>:main` çalıştırır. Ardından girişsiz olarak `/calisma-alani`
açın: `/giris`'e yönlenmeli.

## 5. Ata'nın hesabı

`ataberkozturk@ankara.edu.tr` ile kayıt olup e-postayı doğrulayın, sonra:

```sql
select email, kadro, yetki, is_approved from public.profiles
where email = 'ataberkozturk@ankara.edu.tr';
-- beklenen: gelistirici | superadmin | true

select a.is_primary, p.full_name as danisman
from public.advisor_assignments a join public.profiles p on p.id = a.advisor_id
where a.student_id = (select id from public.profiles where email = 'ataberkozturk@ankara.edu.tr');
-- Yeşim Hoca hesap açtıktan sonra: true | Yeşim Moğulkoç
```

## 6. Diğer üyeler

E-postalar gelince ya `seed_uyeler.sql` içindeki `TODO_...` satırlarını gerçek adreslerle açıp
yeniden çalıştırın ya da /yonetim → Davet listesi'nden ekleyin. Hoca ve yönetici davetlerini yalnız
superadmin ekleyebilir. Danışman eşleşmesi iki taraf da hesap açınca otomatik kurulur.

## Sorun giderme

- "Önce supabase/schema.sql dosyasını çalıştırın": 2.1 adımı atlanmış.
- Kayıt sonrası "Hesabınız onay bekliyor": e-posta davet listesinde mi, e-posta doğrulandı mı?
- Hoca öğrencisini görmüyor: `advisor_assignments` satırı var mı, hocanın kadrosu `hoca` mı?
