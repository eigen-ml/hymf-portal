import { SayfaBasligi, BosDurum, Uyari, Panel, buttonClass } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth/dal';
import { getCalismaAlaniVerisi } from '@/lib/data/workspaces';
import { Dosyalar } from '@/components/calisma/Dosyalar';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { DriveDosyaListesi } from '@/components/DriveDosyaListesi';
import { driveKlasorDosyalari } from '@/lib/data/driveKlasor';

export default async function DrivePage() {
  const ben = await requireMember();
  const sb = await createClient();

  const [sonuc, driveDosyalari] = await Promise.all([
    getCalismaAlaniVerisi(sb, ben.id),
    driveKlasorDosyalari(ben.sunum_klasoru),
  ]);

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
        aciklama="Kendi dosyaların: HYMF Drive klasörün ve sitedeki küçük dosyaların."
        eylemler={
          <Link href="/sunumlar" className={buttonClass({ variant: 'secondary' })}>
            Herkesin sunumları
          </Link>
        }
      />
      <Panel
        baslik="HYMF Drive klasörüm"
        aciklama="Sunumlar ve büyük dosyalar buraya. Yüklediğin her şeyi hoca ve grup görür (Sunumlar sayfası)."
        eylemler={
          ben.sunum_klasoru ? (
            <a href={ben.sunum_klasoru} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'primary', size: 'sm' })}>
              Klasörüme yükle <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : undefined
        }
      >
        {ben.sunum_klasoru ? (
          <div className="space-y-2">
            <DriveDosyaListesi dosyalar={driveDosyalari} />
            <p className="text-sm text-ink-3">
              Yüklemek için klasörü aç, dosyayı sürükle bırak. Tarayıcıda bir Google hesabın açık olmalı.
            </p>
          </div>
        ) : (
          <p className="text-base text-ink-2">Klasörün henüz açılmadı. Grup yöneticisine yaz.</p>
        )}
      </Panel>
      <Uyari tone="uyari">
        <strong>Aşağıdaki site deposu küçük.</strong> Bütün grup için ortak: kişi başı 100 MB, dosya başına
        10 MB. Danışmanının sitede açması gereken küçük dosyalar için (tez taslağı PDF&apos;i, grafik).
        Sunum ve büyük dosyalar yukarıdaki Drive klasörüne.
      </Uyari>
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
