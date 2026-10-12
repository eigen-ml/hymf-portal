'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Panel, buttonClass } from '@/components/ui';
import { AbonelikDugmeleri } from '@/components/takvim/TakvimAboneligi';
import { TAKVIM_KUTUSU_CEREZI, abonelikAdresleri } from '@/lib/abonelik';

/**
 * Panonun en üstünde: takvimini henüz bağlamamış kişiye bir kez abone olmasını söyler. Abonelik ilk
 * kez çekilince kutu kalkar. "Daha sonra" bu tarayıcı oturumu boyunca gizler.
 */
export function TakvimEkleKutusu({ token, yalnizIndirdi }: { token: string; yalnizIndirdi: boolean }) {
  const router = useRouter();
  const [gizli, setGizli] = useState(false);

  // Kişi takvim uygulamasında abone olup sekmeye dönünce pano yenilenir. Apple ve Google aboneliği
  // eklerken akışı hemen çeker, kayıt düşmüşse kutu kendiliğinden kalkar.
  useEffect(() => {
    if (gizli) return;
    const donunce = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    document.addEventListener('visibilitychange', donunce);
    return () => document.removeEventListener('visibilitychange', donunce);
  }, [gizli, router]);

  if (gizli) return null;

  function sonra() {
    document.cookie = `${TAKVIM_KUTUSU_CEREZI}=gizli; path=/; SameSite=Lax`;
    setGizli(true);
  }

  return (
    <Panel
      baslik="Grup toplantıları telefonunuzun takvimine kendiliğinden düşsün"
      aciklama="Bir kez ekleyin. Yeni toplantılar ve saat değişiklikleri kendi takviminizde görünür."
    >
      <div className="space-y-4">
        {yalnizIndirdi && (
          <p className="text-sm text-warn">
            Takvim adresi tarayıcıda açılmış ve tek seferlik dosya olarak inmiş. Güncel kalması için aşağıdan abone olun.
          </p>
        )}
        <AbonelikDugmeleri adresler={abonelikAdresleri(token)} />
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/takvim#abonelik" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
            Outlook ve diğer yollar
          </Link>
          <Button variant="ghost" size="sm" onClick={sonra}>
            Daha sonra
          </Button>
        </div>
      </div>
    </Panel>
  );
}
