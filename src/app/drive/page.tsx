import { SayfaBasligi, BosDurum, Uyari } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth/dal';
import { getCalismaAlaniVerisi } from '@/lib/data/workspaces';
import { Dosyalar } from '@/components/calisma/Dosyalar';
import { DriveBaglantisi } from './DriveBaglantisi';

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
      <Uyari tone="uyari">
        <strong>Buraya her şeyi atma.</strong> Site depolaması bütün grup için ortak ve küçük: kişi başı
        100 MB, dosya başına 10 MB. Burası danışmanının görmesi gereken dosyalar için (tez taslağı, sunum
        PDF&apos;i, grafik). Hesap çıktısı ya da veri paylaşacaksan yalnız gereken kısmı .txt olarak yükle.
        Gerisi aşağıdaki kendi Drive klasörüne.
      </Uyari>
      <DriveBaglantisi workspaceId={veri.workspace.id} driveUrl={veri.workspace.drive_url} />
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
