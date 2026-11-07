import { ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth/dal';
import { listMembers } from '@/lib/data/profiles';
import { isAdmin } from '@/lib/yetki';
import { CANLI_ADRES } from '@/lib/site';
import { SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { driveKlasorDosyalari } from '@/lib/data/driveKlasor';
import type { SunumNotu } from '@/components/SunumNotlari';
import { SunumListesi } from './SunumListesi';
import { HocaLinkiKopyala } from './HocaLinkiKopyala';

export default async function SunumlarPage() {
  const ben = await requireMember();
  const sb = await createClient();
  const yonetici = isAdmin(ben);

  const [uyeler, notSonucu, anahtarSonucu] = await Promise.all([
    listMembers(sb),
    // 20261107010000_hoca_linki.sql çalışmadıysa tablo yok; liste notsuz açılır.
    sb.from('sunum_notlari').select('id, uye_id, govde, created_at').order('created_at', { ascending: false }),
    yonetici ? sb.rpc('hoca_linki_anahtari') : Promise.resolve({ data: null }),
  ]);

  // Yalnız klasörü olanlar (hocanın ve klasörü kaldırılanların satırı çıkmaz).
  const liste = (uyeler.data ?? []).filter((u) => u.sunum_klasoru);
  // Her klasörün dosya adları (60 sn önbellekli); hoca herkesin ne yüklediğini buradan görür.
  const dosyalar = await Promise.all(liste.map((u) => driveKlasorDosyalari(u.sunum_klasoru)));

  const notlar = new Map<string, SunumNotu[]>();
  for (const n of (notSonucu.data ?? []) as { id: string; uye_id: string; govde: string; created_at: string }[]) {
    const dizi = notlar.get(n.uye_id) ?? [];
    dizi.push({ id: n.id, govde: n.govde, tarih: n.created_at });
    notlar.set(n.uye_id, dizi);
  }

  // Bütün kişi klasörlerinin bulunduğu üst klasör (HYMF Google hesabında). Repoda durmaz; Vercel'de SUNUM_KLASORU_URL.
  const ustKlasor = process.env.SUNUM_KLASORU_URL?.trim();
  const anahtar = typeof anahtarSonucu.data === 'string' ? anahtarSonucu.data : null;

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Sunumlar"
        aciklama="Herkesin sunum klasörü. Sunumunu kendi klasörüne yükle; başkalarınınkine de bakabilirsin."
        eylemler={
          <>
            {anahtar && <HocaLinkiKopyala adres={`${CANLI_ADRES}/hoca/${anahtar}`} />}
            {ustKlasor && (
              <a href={ustKlasor} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary' })}>
                Sunum arşivi <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
          </>
        }
      />
      {uyeler.error ? (
        <Uyari tone="tehlike">{uyeler.error}</Uyari>
      ) : (
        <SunumListesi
          uyeler={liste.map((u, i) => ({
            id: u.id,
            ad: u.full_name,
            klasor: u.sunum_klasoru ?? null,
            dosyalar: dosyalar[i],
            notlar: notlar.get(u.id) ?? [],
          }))}
          benId={ben.id}
          yonetici={yonetici}
        />
      )}
    </div>
  );
}
