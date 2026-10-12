'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button, Panel, Uyari, buttonClass } from '@/components/ui';
import { telegramBaginiKaldir } from './telegram';

export function TelegramKutusu({ bagli, kullaniciAdi, baglanti }: { bagli: boolean; kullaniciAdi: string | null; baglanti: string | null }) {
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, baslat] = useTransition();
  const router = useRouter();

  return (
    <Panel baslik="Telegram bildirimleri">
      <div className="space-y-3 text-sm text-ink-2">
        {bagli ? (
          <>
            <p>
              Bağlı{kullaniciAdi ? <> (<span className="font-medium text-ink">@{kullaniciAdi}</span>)</> : null}. Toplantı, duyuru
              ve sana verilen görevler bot üzerinden özelden gelir.
            </p>
            <Button
              disabled={islemde}
              onClick={() =>
                baslat(async () => {
                  const s = await telegramBaginiKaldir();
                  if (!s.ok) setHata(s.error ?? 'Kaldırılamadı.');
                  else router.refresh();
                })
              }
            >
              Bağlantıyı kaldır
            </Button>
          </>
        ) : baglanti ? (
          <>
            <p>Toplantı, duyuru ve görev bildirimlerini Telegram&apos;dan özelden almak için bağla. Açılan sohbette Başlat&apos;a bas.</p>
            <a href={baglanti} target="_blank" rel="noopener" className={buttonClass({ variant: 'primary' })}>
              <Send className="size-4" aria-hidden="true" />
              Telegram&apos;ı bağla
            </a>
            <p className="text-ink-3">Bağladıktan sonra bu sayfayı yenile.</p>
          </>
        ) : (
          <p>Telegram botu henüz ayarlanmadı.</p>
        )}
        {hata && <Uyari tone="tehlike">{hata}</Uyari>}
      </div>
    </Panel>
  );
}
