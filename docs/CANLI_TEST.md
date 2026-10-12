# Canlı test listesi (https://hymf-portal.vercel.app)

1. **Girişsiz** (gizli pencere): yalnız ana sayfa ve "Giriş yap" görünmeli; /duyurular gibi bir adres girişe atmalı.
2. **Giriş**: kendi hesabınla gir, menüde "Yönetim" olmalı.
3. **Beni hatırla**: işaretsiz gir → tarayıcıyı tamamen kapat-aç → çıkış yapılmış olmalı. İşaretliyle açık kalmalı.
   (Chrome "kaldığın yerden devam et" açıksa işaretsizde de açık kalabilir; bu tarayıcı ayarı.)
4. **Üye ekle** (/yonetim → Davetler): "Üret" ile şifre al, çıkan e-posta/şifreyi not et.
   - Yeşim Moğulkoç — mogulkoc@eng.ankara.edu.tr — hoca, yönetici
   - Aybey Moğulkoç — mogulkoc@science.ankara.edu.tr — hoca, yönetici
   - Mehmet Kabak — mkabak@eng.ankara.edu.tr — hoca, üye
   Sonra: /uyeler'de görünmeliler; senin çalışma alanında danışman "Y. Moğulkoç" olmalı.
5. **Şifre sıfırla** (/yonetim → Üyeler → Düzenle): yeni şifreyle gizli pencerede giriş yapılabilmeli.
   İşlem geçmişinde "şifre sıfırlandı" satırı olmalı.
6. **İçerik**: duyuru ekle (Telegram grubuna düştü mü?), kaynak, toplantı ekle ve sil;
   ders ekle (öğretim üyesi listesinde hocalar olmalı) ve derse materyal ekle.
7. **Profil → Şifremi değiştir** çalışmalı.

## Son kontrol: takvim, görevler, toplantılar (12 Eki)

Gruba "deneyin, hata görürseniz yazın" demeden önce:

8. **Simge**: tarayıcı sekmesinde mavi Ψ görünmeli (Next.js üçgeni değil). Eski simge kalırsa sayfayı
   Cmd+Shift+R ile yenile.
9. **Grup toplantısı** (hoca veya yönetici hesabıyla): Takvim → "Etkinlik ekle" → "Bu bir grup
   toplantısı" işaretli → kaydet. Takvimde ve Toplantılar sayfasında görünmeli.
10. **Öğrenci hesabıyla**: Takvim → "Etkinlik ekle" penceresinde "grup toplantısı" kutusu olmamalı;
    Toplantılar sayfasında "Toplantı notu ekle" düğmesi olmamalı. Etkinlik ekleyip silebilmeli.
11. **Görevler**: hoca görev verir → öğrenci "Teslim ettim" der → hoca "Tamamlandı ✓".
12. **Apple Takvim**: Takvim sayfasının altındaki abonelik bağlantısı iPhone'da açılmalı.

## Takvim senkronu ve logo (13 Eki)

13. **Logo**: giriş sayfasında (formun üstünde), girişsiz ana sayfanın üstünde ve sayfa altındaki footer'da grubun yuvarlak logosu görünmeli. Üst çubukta ve tarayıcı sekmesinde mavi Ψ kalır.
   Açık ve koyu temada, telefonda yana taşma olmamalı.
14. **Takvim düğmeleri** (Takvim sayfasının altı): bağlantı hazır gelir, "Bağlantıyı göster" adımı yok. "Apple Takvim" ve "Google Takvim" düğmeleri, altında kopyalanabilir adres.
   Outlook için düğme yok (denenmedi), elle ekleme adımları yazıyor.
15. **Apple**: Mac'te Takvim'deki eski "HYMF Portal" aboneliğini sil (sağ tık, Aboneliği Kaldır). Takvim sayfasında "Apple Takvim"e bas, "Her 15 dakikada" seç.
   Toplantılar 15 dakika içinde görünmeli. Mümkünse iPhone'da da aynı düğmeyle dene.
16. **Google**: gmail hesabıyla "Google Takvim" düğmesine bas, "Ekle" de. Kayıtların görünmesi birkaç saat sürebilir, bu normal.
17. **Bağlantı durumu**: abone olduktan sonra Takvim sayfasında "Takviminiz bağlı: Apple, son eşitleme … önce" satırı, /yonetim → Üyeler'de kendi satırında "Takvim: Apple · … önce" görünmeli.
   (Kayıt yalnız canlı adresteki yeni kodla düşer; canlıya almadan önce görünmez.)
18. **Toplantı düzenleme** (hoca veya yönetici): Toplantılar → bir toplantıda "Düzenle" → saati değiştir → kaydet. Takvim sayfasında gün detayında da "Düzenle" var.
   Bitiş varsayılan 1 saat sonra, "Yer" alanı var. Apple takviminde değişiklik 15 dk–1 saat içinde görünmeli.
19. **Takvime ekle**: Toplantılar'da bir toplantının "Takvime ekle" düğmesi tek toplantılık .ics dosyası indirir; iPhone'da Safari takvime eklemeyi önerir.
20. **Telegram**: canlıda toplantı ekle, saatini değiştir, sil. Her biri için gruba tek mesaj gitmeli ("Grup toplantısı: …", "Saat değişti: …", "İptal: …"); 8 haftalık seri tek mesaj.
   Mesajdaki "Google Takvim'e ekle" bağlantısı giriş istemeden açılmalı. Preview'da mesaj gitmez (Preview ortamına kendi sohbet kimliğini koymadıysan).
21. **Pano kutusu**: takvimini bağlamamış bir hesapla girince panonun en üstünde "Grup toplantıları telefonunuzun takvimine kendiliğinden düşsün" kutusu çıkmalı.
   "Daha sonra" kutuyu tarayıcı kapanana kadar gizler. Abone olup sekmeye dönünce kutu kalkar.
22. **Hoca hesabı**: Yeşim Hoca ve Aybey Hoca hesapları açılınca ilk girişte panodaki kutudan takvimi eklemelerine yardım et; /yonetim'de satırlarında "Takvim: Apple · …" ya da "Google · …" görünmeli.

Hata bildiren kişiden üç şey iste: hangi sayfa, ne yaptı, ekranda ne yazdı (ekran görüntüsü).

## Sorun çıkarsa
- Site kırıldıysa geri al: `npx vercel rollback https://hymf-portal-jdg3aa3zw-ataberkozs-projects.vercel.app`
- Hata mesajını / ekran görüntüsünü al, yeni sohbette "docs/CANLI_TEST.md N. adımda şu oldu" diye yapıştır.

## Kalan işler
- Supabase erişim token'ı olası düzeltmeler için 17 Ekim'e kadar duruyor; o gün sil
  (Account → Access Tokens).
- Diğer 7 kişinin e-postaları gelince /yonetim → Üye ekle (liste: `supabase/seed_uyeler.sql` TODO satırları).
- Canlıya çıkarmadan önce yeni migration'ı çalıştır (docs/KURULUM.md 3. adım): fork'un `main`'i
  otomatik canlıya çıkar.
- Takvimini kimin eklemediğini görmek için: /yonetim → Üyeler, "Takvim: Bağlı değil" yazanlar.
