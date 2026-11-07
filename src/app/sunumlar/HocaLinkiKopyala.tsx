'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui';

/** Yalnız yöneticide: hocanın giriş yapmadan açtığı Sunumlar linkini panoya kopyalar. */
export function HocaLinkiKopyala({ adres }: { adres: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(adres);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      window.prompt('Hoca linki', adres);
    }
  };

  return (
    <Button variant="ghost" onClick={kopyala}>
      {kopyalandi ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
      {kopyalandi ? 'Kopyalandı' : 'Hoca linki'}
    </Button>
  );
}
