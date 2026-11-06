/**
 * HYMF Sunumlar: kişi başı Drive klasörü açar (Google Apps Script).
 *
 * Nerede çalışır: HYMF Google hesabında, bir Google E-Tablo'nun Uzantılar → Apps Script menüsünde.
 *
 * E-Tablo'nun ilk sayfası (başlık satırı 1. satırda):
 *   A: No (01, 02 … katılma sırası; yeni gelen 09, 10 …)   B: Ad Soyad   C: E-posta (kişinin Gmail'i)
 * Çalışınca doldurur:
 *   D: Klasör bağlantısı   E: Siteye yazmak için SQL (Supabase SQL Editor'a yapıştırılır)
 *
 * Ne yapar:
 *   - "HYMF Sunumlar" üst klasörünü bulur ya da açar; "bağlantıya sahip herkes görüntüleyebilir" yapar.
 *   - Her satır için "No Ad Soyad" adlı alt klasörü bulur ya da açar, o kişiyi düzenleyici yapar
 *     (Google kişiye "seninle paylaşıldı" e-postası atar).
 *   - Tekrar çalıştırmak güvenlidir: var olan klasörü yeniden açmaz, yeni satırları ekler.
 *
 * E sütunundaki SQL, sitedeki e-postayla eşleşir. Portal e-postası Gmail'den farklıysa
 * (ör. @ankara.edu.tr) E'deki e-postayı portal e-postasıyla değiştirin.
 */

const UST_KLASOR_ADI = 'HYMF Sunumlar';

function sunumKlasorleriniAc() {
  const ust = ustKlasoruBul_();
  ust.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const sayfa = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const satirlar = sayfa.getDataRange().getValues();
  sayfa.getRange(1, 4, 1, 2).setValues([['Klasör bağlantısı', 'Site SQL']]);

  for (let i = 1; i < satirlar.length; i++) {
    const no = String(satirlar[i][0]).trim().padStart(2, '0');
    const ad = String(satirlar[i][1]).trim();
    const eposta = String(satirlar[i][2]).trim().toLowerCase();
    if (!ad || !eposta) continue;

    const adi = no + ' ' + ad;
    const mevcut = ust.getFoldersByName(adi);
    const klasor = mevcut.hasNext() ? mevcut.next() : ust.createFolder(adi);

    const editorler = klasor.getEditors().map((k) => k.getEmail().toLowerCase());
    if (editorler.indexOf(eposta) === -1) klasor.addEditor(eposta);

    const url = klasor.getUrl();
    const sql =
      "update public.profiles set sunum_klasoru = '" + url + "' where lower(email) = '" +
      eposta.replace(/'/g, "''") + "';";
    sayfa.getRange(i + 1, 4, 1, 2).setValues([[url, sql]]);
  }

  Logger.log('Üst klasör: ' + ust.getUrl() + '  (Vercel → SUNUM_KLASORU_URL)');
}

function ustKlasoruBul_() {
  const bulunan = DriveApp.getRootFolder().getFoldersByName(UST_KLASOR_ADI);
  return bulunan.hasNext() ? bulunan.next() : DriveApp.getRootFolder().createFolder(UST_KLASOR_ADI);
}
