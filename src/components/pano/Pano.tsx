import { SayfaBasligi } from '@/components/ui';
import { bekliyorMu } from '@/components/gorevler/yardimci';
import { gorevleriGetir, takvimOgeleri } from '@/lib/data/takvim';
import { getDanismanPanosu } from '@/lib/data/workspaces';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { bugunISO } from '@/lib/zaman';
import type { Profile } from '@/types/database';
import { BuHafta } from './BuHafta';
import { CalismaAlanimBaglantisi, OgrencilerOzeti } from './CalismaOzeti';
import { GorevDagilimi, GorevlerimPaneli, OnayBekleyenler } from './GorevPanolari';
import { HizliEylemler } from './HizliEylemler';
import { SonDuyurular, type PanoDuyurusu } from './SonDuyurular';
import { bugunMetni, ilkAd } from './yardimci';

const GUN = 86_400_000;
/** Pano'da "Bu hafta": bugünden başlayarak 7 gün. */
const HAFTA_GUN = 7;

/** Bir bölüm yüklenemese bile pano açılsın: hata yerine null döner, bölüm kendi mesajını gösterir. */
async function dene<T>(is: () => Promise<T>): Promise<T | null> {
  try {
    return await is();
  } catch {
    return null;
  }
}

async function sonDuyurular(): Promise<PanoDuyurusu[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from('announcements')
    .select('id, title, priority, created_at, author:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(3);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PanoDuyurusu[];
}

/** Üyenin ana sayfası: bu haftanın takvimi, bekleyen görevler, son duyurular. */
export async function Pano({ ben }: { ben: Profile }) {
  const hocaMi = isHoca(ben);
  const yonetebilir = hocaMi || isAdmin(ben);
  const bugun = bugunISO();

  // İstanbul'da bugünün başlangıcı; böylece bugünkü tüm gün etkinlikleri de listeye girer.
  const baslangic = new Date(`${bugun}T00:00:00+03:00`);
  const bitis = new Date(baslangic.getTime() + HAFTA_GUN * GUN);

  const [gorevler, hafta, duyurular, ogrenciler] = await Promise.all([
    dene(() => gorevleriGetir()),
    dene(() => takvimOgeleri(ben, { baslangic: baslangic.toISOString(), bitis: bitis.toISOString() })),
    dene(() => sonDuyurular()),
    hocaMi
      ? dene(async () => {
          const sb = await createClient();
          const sonuc = await getDanismanPanosu(sb, ben.id);
          if (sonuc.error) throw new Error(sonuc.error);
          return sonuc.data;
        })
      : Promise.resolve(null),
  ]);

  // Hoca olmayan herkes kendi görevlerini görür; hoca yalnız kendine görev verilmişse.
  const benimGorevimVar = (gorevler ?? []).some((g) => g.assignee_id === ben.id && bekliyorMu(g));
  const gorevlerimGoster = !hocaMi || benimGorevimVar;

  return (
    <div className="space-y-8">
      <SayfaBasligi baslik={`Merhaba, ${ilkAd(ben.full_name)}`} aciklama={bugunMetni()} />

      <HizliEylemler yonetebilir={yonetebilir} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {yonetebilir && <OnayBekleyenler gorevler={gorevler} benId={ben.id} bugun={bugun} />}
          {gorevlerimGoster && <GorevlerimPaneli gorevler={gorevler} benId={ben.id} yonetebilir={yonetebilir} bugun={bugun} />}
          <BuHafta ogeler={hafta} benId={ben.id} bugun={bugun} />
        </div>

        <div className="space-y-8">
          <SonDuyurular duyurular={duyurular} />
          {yonetebilir && <GorevDagilimi gorevler={gorevler} bugun={bugun} />}
          {hocaMi ? <OgrencilerOzeti satirlar={ogrenciler} /> : <CalismaAlanimBaglantisi />}
        </div>
      </div>
    </div>
  );
}
