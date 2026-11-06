/**
 * HYMF Sunumlar: kişi başı Drive klasörü açar (Google Apps Script).
 *
 * Nerede çalışır: HYMF Google hesabında, bir Google E-Tablo'nun Uzantılar → Apps Script menüsünde.
 *
 * E-Tablo'nun ilk sayfası (başlık satırı 1. satırda):
 *   A: No (01, 02 … katılma sırası; yeni gelen 09, 10 …)   B: Ad Soyad
 *   C: Portal e-postası (sitedeki)   D: Gmail (varsa; düzenleyici yapılır)
 * Çalışınca doldurur:
 *   E: Klasör bağlantısı   F: Siteye yazmak için SQL (Supabase SQL Editor'a yapıştırılır)   G: Durum
 *
 * Ne yapar:
 *   - "HYMF Sunumlar" üst klasörünü bulur ya da açar; "bağlantıya sahip herkes görüntüleyebilir" yapar.
 *   - Her satır için "No Ad Soyad" adlı alt klasörü bulur ya da açar; Gmail varsa o kişiyi düzenleyici
 *     yapar (Google kişiye "seninle paylaşıldı" e-postası atar).
 *   - Tekrar çalıştırmak güvenlidir: var olan klasörü yeniden açmaz, yeni satırları ekler.
 *
 * F'deki SQL, C'deki portal e-postasıyla eşleşir.
 */

const UST_KLASOR_ADI = 'HYMF Sunumlar';

function sunumKlasorleriniAc() {
  const ust = ustKlasoruBul_();
  ust.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const sayfa = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const satirlar = sayfa.getDataRange().getValues();
  sayfa.getRange(1, 5, 1, 3).setValues([['Klasör bağlantısı', 'Site SQL', 'Durum']]);

  for (let i = 1; i < satirlar.length; i++) {
    const no = String(satirlar[i][0]).trim().padStart(2, '0');
    const ad = String(satirlar[i][1]).trim();
    const eposta = String(satirlar[i][2]).trim().toLowerCase();
    if (!ad || !eposta) continue;

    const adi = no + ' ' + ad;
    const mevcut = ust.getFoldersByName(adi);
    const klasor = mevcut.hasNext() ? mevcut.next() : ust.createFolder(adi);

    // C'de Gmail yoksa (ör. @ankara.edu.tr Google hesabı değil) paylaşma atlanır; kişi klasörü açıp
    // "Erişim iste" der, HYMF hesabı onaylar.
    const gmail = String(satirlar[i][3] || '').trim().toLowerCase();
    let durum = 'Gmail yok: kişi erişim isteyecek';
    if (gmail) {
      try {
        const editorler = klasor.getEditors().map((k) => k.getEmail().toLowerCase());
        if (editorler.indexOf(gmail) === -1) klasor.addEditor(gmail);
        durum = 'Düzenleyici: ' + gmail;
      } catch (e) {
        durum = 'Paylaşılamadı: ' + e.message;
      }
    }

    const url = klasor.getUrl();
    const sql =
      "update public.profiles set sunum_klasoru = '" + url + "' where lower(email) = '" +
      eposta.replace(/'/g, "''") + "';";
    sayfa.getRange(i + 1, 5, 1, 3).setValues([[url, sql, durum]]);
  }

  Logger.log('Üst klasör: ' + ust.getUrl() + '  (Vercel → SUNUM_KLASORU_URL)');
}

function ustKlasoruBul_() {
  const bulunan = DriveApp.getRootFolder().getFoldersByName(UST_KLASOR_ADI);
  return bulunan.hasNext() ? bulunan.next() : DriveApp.getRootFolder().createFolder(UST_KLASOR_ADI);
}
