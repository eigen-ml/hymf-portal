/**
 * HYMF Sunumlar: kişi başı Drive klasörü açar (Google Apps Script).
 *
 * Nerede çalışır: hymfhesabi@gmail.com'da script.google.com → "HYMF Sunum Klasörleri" projesi.
 * Yeni öğrenci gelince UYELER'in sonuna bir satır ekleyip (sıradaki numarayla) tekrar çalıştırın.
 *
 * Ne yapar:
 *   - "HYMF Sunumlar" üst klasörünü bulur ya da açar, her üye için "No Ad Soyad" alt klasörünü açar.
 *   - Paylaşıma dokunmaz. Paylaşım Drive ekranından bir kez üst klasörde ayarlandı (7 Kas 2026):
 *     "Bağlantıya sahip olan herkes: Düzenleyen"; alt klasörler bunu devralır. (Betikle
 *     setSharing(ANYONE_WITH_LINK, EDIT) "Erişim reddedildi" verdi.) Gmail toplanmaz; yüklemek için
 *     tarayıcıda herhangi bir Google hesabıyla oturum açık olmak yeter.
 *   - Tekrar çalıştırmak güvenlidir: var olan klasörü yeniden açmaz.
 *   - Günlüğe (Yürütme günlüğü) üst klasör adresini ve siteye yazılacak SQL'i basar
 *     (Supabase SQL Editor'a yapıştırılır; e-posta portaldaki adres).
 */

const UST_KLASOR_ADI = 'HYMF Sunumlar';

// [No, klasör adı, portal e-postası]
const UYELER = [
  ['01', 'Yeşim Moğulkoç', 'mogulkoc@eng.ankara.edu.tr'],
  ['02', 'Ata Berk Öztürk', 'ataberkozturk@ankara.edu.tr'],
  ['03', 'Sibel Dumamak', 'sibeldumamak@ankara.edu.tr'],
  ['04', 'Sudem Özcan', 'sudemozcan@ankara.edu.tr'],
  ['05', 'Mert Tuna', 'huseyinmerttuna@ankara.edu.tr'],
  ['06', 'Cengizhan Gülhan', 'cengizhangulhan@ankara.edu.tr'],
  ['07', 'Mustafa Atasoy', 'mustafaatasoy@ankara.edu.tr'],
  ['08', 'Sena Güleçoğlu', 'senanurunsal@ankara.edu.tr'],
  ['09', 'Ecrin Yıldız', 'ecrinyildiz@ankara.edu.tr'],
  ['10', 'Nisa Melis Atıcı', '23291352@ogrenci.ankara.edu.tr'],
];

function sunumKlasorleriniAc() {
  const kok = DriveApp.getRootFolder();
  const bulunan = kok.getFoldersByName(UST_KLASOR_ADI);
  const ust = bulunan.hasNext() ? bulunan.next() : kok.createFolder(UST_KLASOR_ADI);

  const sql = [];
  UYELER.forEach(([no, ad, eposta]) => {
    const adi = no + ' ' + ad;
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
