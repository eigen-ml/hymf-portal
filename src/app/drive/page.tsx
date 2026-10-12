import { SayfaBasligi, BosDurum, Uyari } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth/dal';
import { getCalismaAlaniVerisi } from '@/lib/data/workspaces';
import { Dosyalar } from '@/components/calisma/Dosyalar';

export default async function DrivePage() {
  const ben = await requireMember();
  const sb = await createClient();

  const sonuc = await getCalismaAlaniVerisi(sb, ben.id);

  if (sonuc.error) {
    return (
      <div className="space-y-8">
        <SayfaBasligi baslik="Drive'ım" />
        <Uyari tone="tehlike">{sonuc.error}</Uyari>
      </div>
    );
  }

  const veri = sonuc.data;

  if (!veri) {
    return (
      <div className="space-y-8">
        <SayfaBasligi baslik="Drive'ım" />
        <BosDurum baslik="Drive yalnız çalışma alanı olan üyelerde var." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Drive'ım"
        aciklama="Kendi dosyaların. PDF'ler sitede açılır; danışmanın da görebilir."
      />
      <Dosyalar
        workspaceId={veri.workspace.id}
        files={veri.files}
        planItems={veri.planItems}
        izleyici={{
          viewerId: ben.id,
          studentId: ben.id,
          isStudent: true,
          isAdvisor: false,
        }}
      />
    </div>
  );
}
