import { requireMember } from '@/lib/auth/dal';
import { gorevVerilebilecekler, gorevleriGetir } from '@/lib/data/takvim';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { bugunISO, gunISO } from '@/lib/zaman';
import { Uyari } from '@/components/ui';
import type { ToplantiSecenegi } from '@/components/gorevler/GorevFormu';
import type { GroupTask } from '@/types/database';
import { GorevlerIstemci } from './GorevlerIstemci';

const GUN = 86_400_000;

type Props = {
  searchParams: Promise<{ [anahtar: string]: string | string[] | undefined }>;
};

/** Görev formundaki toplantı listesi: son 60 gün ve gelecek 14 gün. */
async function sonToplantilar(): Promise<ToplantiSecenegi[]> {
  try {
    const sb = await createClient();
    const simdi = Date.now();
    const { data, error } = await sb
      .from('meetings')
      .select('id, title, meeting_date')
      .gte('meeting_date', new Date(simdi - 60 * GUN).toISOString())
      .lte('meeting_date', new Date(simdi + 14 * GUN).toISOString())
      .order('meeting_date', { ascending: false });
    if (error) return [];
    return (data ?? []) as ToplantiSecenegi[];
  } catch {
    return [];
  }
}

export default async function GorevlerPage({ searchParams }: Props) {
  const ben = await requireMember();
  const yonetebilir = isHoca(ben) || isAdmin(ben);
  const sp = await searchParams;
  const bugun = bugunISO();

  let gorevler: GroupTask[];
  try {
    gorevler = await gorevleriGetir();
  } catch {
    return <Uyari tone="tehlike">Görevler yüklenemedi. Sayfayı yenileyin.</Uyari>;
  }

  const [kisiler, toplantilar] = yonetebilir
    ? await Promise.all([gorevVerilebilecekler().catch(() => []), sonToplantilar()])
    : [[], []];

  // Varsayılan: bugün veya daha önce yapılan en yakın toplantı (liste yeniden eskiye sıralı).
  const varsayilanToplanti = toplantilar.find((m) => gunISO(m.meeting_date) <= bugun);

  const yeni = yonetebilir && sp.yeni === '1';

  return (
    <GorevlerIstemci
      // Anasayfadaki "Görev ver" bağlantısı aynı sayfaya gelince form açılsın diye anahtar değişir.
      key={yeni ? 'yeni' : 'liste'}
      gorevler={gorevler}
      kisiler={kisiler}
      toplantilar={toplantilar}
      varsayilanToplantiId={varsayilanToplanti?.id ?? ''}
      benId={ben.id}
      hocaMi={isHoca(ben)}
      yonetebilir={yonetebilir}
      bugun={bugun}
      formAcikBaslasin={yeni}
    />
  );
}
