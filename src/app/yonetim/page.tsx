import { requireMember } from '@/lib/auth/dal';
import { isAdmin, isSuperadmin } from '@/lib/yetki';
import { createClient } from '@/lib/supabase/server';
import { ErisimEngellendi, Uyari } from '@/components/ui';
import { listAllProfiles, listAdvisorAssignments } from '@/lib/data/admin';
import { UyeleriYonet, type TakvimDurumu } from '@/components/yonetim/UyeleriYonet';
import { takvimBagliMi, takvimDurumMetni } from '@/lib/abonelik';
import type { TakvimIstemcisi } from '@/types/database';

export default async function Page() {
  const ben = await requireMember();

  if (!isAdmin(ben)) {
    return (
      <ErisimEngellendi
        baslik="Bu sayfa yöneticilere açık"
        aciklama="Yönetim paneline yalnız yöneticiler girebilir."
        donusHref="/"
        donusEtiketi="Ana sayfaya dön"
      />
    );
  }

  const sb = await createClient();

  const [profilesResult, advisorsResult, baglantilar] = await Promise.all([
    listAllProfiles(sb),
    listAdvisorAssignments(sb),
    sb.rpc('takvim_baglantilari'),
  ]);

  const hata = profilesResult.error ?? advisorsResult.error;
  if (hata) {
    return <Uyari tone="tehlike">{hata}</Uyari>;
  }

  return (
    <UyeleriYonet
      profiles={profilesResult.data || []}
      advisorAssignments={advisorsResult.data || []}
      hocaKadrosuKisitli={!isSuperadmin(ben)}
      takvimDurumlari={baglantilar.error ? null : takvimDurumlari((baglantilar.data ?? []) as BaglantiSatiri[])}
    />
  );
}

type BaglantiSatiri = { user_id: string; son_cekim: string | null; son_istemci: TakvimIstemcisi | null };

/** Kişi başına "Apple · 2 saat önce" metni. Sunucuda hesaplanır, saat farkı hydration'ı bozmasın. */
function takvimDurumlari(satirlar: BaglantiSatiri[]): Record<string, TakvimDurumu> {
  const simdi = new Date();
  const sonuc: Record<string, TakvimDurumu> = {};
  for (const s of satirlar) {
    const b = { sonCekim: s.son_cekim, sonIstemci: s.son_istemci };
    sonuc[s.user_id] = { metin: takvimDurumMetni(b, simdi), bagli: takvimBagliMi(b) };
  }
  return sonuc;
}
