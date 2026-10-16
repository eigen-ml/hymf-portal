import { cookies } from 'next/headers';
import { SayfaBasligi } from '@/components/ui';
import { bekliyorMu } from '@/components/gorevler/yardimci';
import { TAKVIM_KUTUSU_CEREZI, takvimBagliMi } from '@/lib/abonelik';
import { gorevleriGetir, takvimAboneligiGetir, takvimOgeleri } from '@/lib/data/takvim';
import { getDanismanPanosu } from '@/lib/data/workspaces';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { bugunISO } from '@/lib/zaman';
import type { Profile } from '@/types/database';
import { BuHafta } from './BuHafta';
import { CalismaAlanimBaglantisi, OgrencilerOzeti } from './CalismaOzeti';
import { GorevDagilimi, GorevlerimPaneli, OnayBekleyenler } from './GorevPanolari';
import { SonDuyurular, type PanoDuyurusu } from './SonDuyurular';
import { TakvimEkleKutusu } from './TakvimEkleKutusu';
import { YaklasanToplantilar, type PanoToplantisi } from './YaklasanToplantilar';
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

async function yaklasanToplantilar(bugun: string): Promise<PanoToplantisi[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from('meetings')
    .select('id, title, meeting_date, location, hoca_adi, creator:profiles(full_name)')
    .gte('meeting_date', new Date(`${bugun}T00:00:00+03:00`).toISOString())
    .order('meeting_date', { ascending: true })
    .limit(5);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PanoToplantisi[];
}

/** Üyenin ana sayfası: önce yaklaşan toplantılar, sonra bu hafta ve son duyurular. */
export async function Pano({ ben }: { ben: Profile }) {
  const hocaMi = isHoca(ben);
  const yonetebilir = hocaMi || isAdmin(ben);
  const bugun = bugunISO();

  // İstanbul'da bugünün başlangıcı; böylece bugünkü tüm gün etkinlikleri de listeye girer.
  const baslangic = new Date(`${bugun}T00:00:00+03:00`);
  const bitis = new Date(baslangic.getTime() + HAFTA_GUN * GUN);

  const [toplantilar, gorevler, hafta, duyurular, ogrenciler, abonelik] = await Promise.all([
    dene(() => yaklasanToplantilar(bugun)),
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
    dene(() => takvimAboneligiGetir(ben.id)),
  ]);

  // Takvimini bağlamamış (veya adresi yalnız tarayıcıda açmış) kişiye en üstte hatırlatma.
  const kutuErtelendi = (await cookies()).get(TAKVIM_KUTUSU_CEREZI)?.value === 'gizli';
  const takvimKutusu = abonelik && !takvimBagliMi(abonelik.baglanti) && !kutuErtelendi ? abonelik : null;

  // Görevler artık "Diğer" altında; panoda yalnız bekleyen görevi olana çıkar.
  const benimGorevimVar = (gorevler ?? []).some((g) => g.assignee_id === ben.id && bekliyorMu(g));
  const gorevlerimGoster = benimGorevimVar;

  return (
    <div className="space-y-8">
      <SayfaBasligi baslik={`Merhaba, ${ilkAd(ben.full_name)}`} aciklama={bugunMetni()} />

      {takvimKutusu && (
        <TakvimEkleKutusu token={takvimKutusu.token} yalnizIndirdi={takvimKutusu.baglanti.sonIstemci === 'tarayici'} />
      )}

      <YaklasanToplantilar toplantilar={toplantilar} bugun={bugun} />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {hocaMi && <OnayBekleyenler gorevler={gorevler} benId={ben.id} bugun={bugun} />}
          {gorevlerimGoster && <GorevlerimPaneli gorevler={gorevler} benId={ben.id} yonetebilir={yonetebilir} bugun={bugun} />}
          <BuHafta ogeler={hafta} benId={ben.id} bugun={bugun} />
        </div>

        <div className="space-y-8">
          <SonDuyurular duyurular={duyurular} />
          {hocaMi && <GorevDagilimi gorevler={gorevler} bugun={bugun} />}
          {hocaMi ? <OgrencilerOzeti satirlar={ogrenciler} /> : <CalismaAlanimBaglantisi />}
        </div>
      </div>
    </div>
  );
}
