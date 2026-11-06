import 'server-only';

// Herkese açık ("bağlantıya sahip herkes") bir Drive klasöründeki dosyaların adları. API anahtarı
// istemez: Google'ın klasör gömme sayfası (drive.google.com/embeddedfolderview) okunur. Bu sayfa
// resmî bir API değildir; biçimi değişirse liste boş gelir, site kırılmaz (null → "okunamadı").
// Saatler Google sunucusunun saat diliminde döndüğü için gösterilmez.

export type DriveDosyasi = { ad: string; url: string; klasorMu: boolean };

export function driveKlasorKimligi(url: string | null | undefined): string | null {
  const eslesme = url?.match(/\/folders\/([A-Za-z0-9_-]+)/);
  return eslesme ? eslesme[1] : null;
}

function cozumle(metin: string): string {
  return metin
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Klasördeki öğeler; okunamazsa null. Sonuç 60 sn önbellekte kalır. */
export async function driveKlasorDosyalari(klasorUrl: string | null | undefined): Promise<DriveDosyasi[] | null> {
  const kimlik = driveKlasorKimligi(klasorUrl);
  if (!kimlik) return null;
  try {
    const yanit = await fetch(`https://drive.google.com/embeddedfolderview?id=${kimlik}&hl=tr`, {
      next: { revalidate: 60 },
    });
    if (!yanit.ok) return null;
    const html = await yanit.text();
    if (!html.includes('flip-entries')) return null;

    return html
      .split('<div class="flip-entry" id="entry-')
      .slice(1)
      .flatMap((parca) => {
        const href = parca.match(/<a href="([^"]+)"/)?.[1];
        const ad = parca.match(/<div class="flip-entry-title">([^<]*)<\/div>/)?.[1];
        if (!href || !ad) return [];
        const url = cozumle(href);
        if (!url.startsWith('https://')) return [];
        return [{ ad: cozumle(ad), url, klasorMu: url.includes('/folders/') }];
      });
  } catch {
    return null;
  }
}
