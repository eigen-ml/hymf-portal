import { unstable_rethrow } from 'next/navigation';
import { Uyari } from '@/components/ui';
import { ayAraligi, ayiCoz } from '@/components/takvim/takvimYardim';
import { requireMember } from '@/lib/auth/dal';
import { takvimOgeleri } from '@/lib/data/takvim';
import { isAdmin, isHoca } from '@/lib/yetki';
import { bugunISO } from '@/lib/zaman';
import type { TakvimOgesi } from '@/types/database';
import { TakvimIstemci } from './TakvimIstemci';

interface TakvimSayfasiProps {
  searchParams: Promise<{ ay?: string | string[] }>;
}

export default async function Page({ searchParams }: TakvimSayfasiProps) {
  const ben = await requireMember();
  const { ay: ayParametresi } = await searchParams;

  const bugun = bugunISO();
  const ay = ayiCoz(ayParametresi, bugun);

  let ogeler: TakvimOgesi[];
  try {
    ogeler = await takvimOgeleri(ben, ayAraligi(ay));
  } catch (e) {
    unstable_rethrow(e);
    return <Uyari tone="tehlike">Takvim yüklenemedi. Sayfayı yenileyin.</Uyari>;
  }

  return <TakvimIstemci ogeler={ogeler} ay={ay} bugun={bugun} yonetebilir={isHoca(ben) || isAdmin(ben)} />;
}
