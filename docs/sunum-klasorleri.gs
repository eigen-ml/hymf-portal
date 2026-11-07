/**
 * HYMF_Sunum_Arsivi: kişi başı Drive klasörü açar (Google Apps Script).
 *
 * Nerede çalışır: hymfhesabi@gmail.com'da script.google.com → "HYMF Sunum Klasörleri" projesi.
 * Yeni öğrenci gelince UYELER'in sonuna bir satır ekleyip tekrar çalıştırın.
 *
 * Ne yapar:
 *   - "HYMF_Sunum_Arsivi" üst klasörünü bulur ya da açar, her üye için "Ad_Soyad" alt klasörünü açar
 *     (Türkçe harfsiz, numarasız; 7 Kas 2026'da grup böyle istedi). Yalnız lisansüstü öğrenciler;
 *     hocanın klasörü yok.
 *   - Paylaşıma dokunmaz. Paylaşım Drive ekranından bir kez üst klasörde ayarlandı (7 Kas 2026):
 *     "Bağlantıya sahip olan herkes: Düzenleyen"; alt klasörler bunu devralır. (Betikle
 *     setSharing(ANYONE_WITH_LINK, EDIT) "Erişim reddedildi" verdi.) Gmail toplanmaz; yüklemek için
 *     tarayıcıda herhangi bir Google hesabıyla oturum açık olmak yeter.
 *   - Tekrar çalıştırmak güvenlidir: var olan klasörü yeniden açmaz.
 *   - Günlüğe (Yürütme günlüğü) üst klasör adresini ve siteye yazılacak SQL'i basar
 *     (Supabase SQL Editor'a yapıştırılır; e-posta portaldaki adres).
 */

const UST_KLASOR_ADI = 'HYMF_Sunum_Arsivi';

// [klasör adı, portal e-postası]
const UYELER = [
  ['Sibel_Dumamak', 'sibeldumamak@ankara.edu.tr'],
  ['Ata_Berk_Ozturk', 'ataberkozturk@ankara.edu.tr'],
  ['Mert_Tuna', 'huseyinmerttuna@ankara.edu.tr'],
  ['Cengizhan_Gulhan', 'cengizhangulhan@ankara.edu.tr'],
  ['Ecrin_Yildiz', 'ecrinyildiz@ankara.edu.tr'],
  ['Mustafa_Atasoy', 'mustafaatasoy@ankara.edu.tr'],
  ['Sena_Gulecoglu', 'senanurunsal@ankara.edu.tr'],
  ['Sudem_Ozcan', 'sudemozcan@ankara.edu.tr'],
];

function sunumKlasorleriniAc() {
  const kok = DriveApp.getRootFolder();
  const bulunan = kok.getFoldersByName(UST_KLASOR_ADI);
  const ust = bulunan.hasNext() ? bulunan.next() : kok.createFolder(UST_KLASOR_ADI);

  const sql = [];
  UYELER.forEach(([adi, eposta]) => {
    const mevcut = ust.getFoldersByName(adi);
    const klasor = mevcut.hasNext() ? mevcut.next() : ust.createFolder(adi);
    sql.push(
      "update public.profiles set sunum_klasoru = '" + klasor.getUrl() + "' where lower(email) = '" +
        eposta.toLowerCase().replace(/'/g, "''") + "';",
    );
  });

  Logger.log('UST_KLASOR ' + ust.getUrl());
  Logger.log('SQL\n' + sql.join('\n'));
}
