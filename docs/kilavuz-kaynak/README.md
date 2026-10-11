# Kılavuz PDF kaynakları

`icerik/kilavuzlar/*.pdf` bu HTML dosyalarından üretilir. Kaynak belgeler grubun Drive'ındaki
"HESAP KILAVUZLARI" klasörüdür (Ekim 2026'da düzenlendi).

Bir kılavuzu düzeltmek için HTML'i düzenleyin, sonra PDF'i yeniden üretin:

    bash docs/kilavuz-kaynak/pdf_yap.sh "$PWD/docs/kilavuz-kaynak/bader.html" "$PWD/icerik/kilavuzlar/bader.pdf"

Betik Playwright'ın Chromium headless kabuğunu kullanır (`npx playwright install chromium-headless-shell`).
Yeni kılavuz eklenince `src/lib/kilavuz/liste.ts` listesine de eklenir.
