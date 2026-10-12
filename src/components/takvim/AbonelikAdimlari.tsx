import React from 'react';

function Adimlar({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-ink">{baslik}</h3>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-ink-2">{children}</ol>
    </div>
  );
}

/** Takvim aboneliğinin güncellenme sürelerini anlatan kısa metin. */
export function GuncellemeSuresi() {
  return (
    <p className="max-w-prose text-sm leading-6 text-ink-2">
      Apple Takvim değişiklikleri 15 dakika ile 1 saat arasında gösterir. Google Takvim birkaç saatte, bazen 8–24 saatte
      günceller ve bu süre kısaltılamaz. Son dakika değişiklikleri ayrıca grubun Telegram kanalına gider.
    </p>
  );
}

/** Takvimi cihaz ve uygulamalara elle ekleme adımları. */
export function AbonelikAdimlari() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Adimlar baslik="iPhone ve iPad">
        <li>Bu sayfayı telefonda açın ve yukarıdaki &ldquo;Apple Takvim&rdquo; düğmesine dokunun.</li>
        <li>Çıkan pencerede &ldquo;Abone Ol&rdquo;a, sonra sağ üstteki &ldquo;Ekle&rdquo;ye dokunun.</li>
      </Adimlar>

      <Adimlar baslik="Mac">
        <li>Yukarıdaki &ldquo;Apple Takvim&rdquo; düğmesine tıklayın. Takvim uygulaması açılır.</li>
        <li>
          &ldquo;Abone Ol&rdquo;a tıklayın, &ldquo;Otomatik yenile&rdquo; için &ldquo;Her 15 dakikada&rdquo; seçip
          &ldquo;Tamam&rdquo; deyin.
        </li>
        <li>
          Düğme çalışmazsa: Takvim&apos;de Dosya, sonra Yeni Takvim Aboneliği. Adresi yapıştırın.
        </li>
      </Adimlar>

      <Adimlar baslik="Google Takvim">
        <li>Yukarıdaki &ldquo;Google Takvim&rdquo; düğmesine tıklayın. Google hesabınızla açılır.</li>
        <li>&ldquo;Takvim eklensin mi?&rdquo; sorusuna &ldquo;Ekle&rdquo; deyin.</li>
        <li>
          Düğme çalışmazsa: Google Takvim&apos;de solda &ldquo;Diğer takvimler&rdquo; yanındaki artıya, sonra &ldquo;URL
          ile&rdquo; seçeneğine tıklayın. Adresi yapıştırın.
        </li>
      </Adimlar>

      <Adimlar baslik="Outlook">
        <li>Outlook&apos;ta Takvim&apos;i açın, &ldquo;Takvim ekle&rdquo;ye tıklayın.</li>
        <li>
          &ldquo;İnternetten abone ol&rdquo; seçeneğini seçin, adresi yapıştırın, ad olarak &ldquo;HYMF Portal&rdquo;
          yazın.
        </li>
        <li>Kurumsal hesapta (outlook.office.com) adımlar aynıdır.</li>
      </Adimlar>
    </div>
  );
}
