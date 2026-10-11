import { getMevcutProfil } from '@/lib/auth/dal';
import { isMember } from '@/lib/yetki';
import { Karsilama } from '@/components/pano/Karsilama';
import { Pano } from '@/components/pano/Pano';

export default async function HomePage() {
  const ben = await getMevcutProfil();

  // Girişsiz ziyaretçi ve onay bekleyen hesap yalnız açılış metnini görür.
  if (!ben || !isMember(ben)) return <Karsilama ben={ben} />;

  return <Pano ben={ben} />;
}
