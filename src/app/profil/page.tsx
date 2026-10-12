import 'server-only';

import Link from 'next/link';
import { requireMember } from '@/lib/auth/dal';
import { SayfaBasligi } from '@/components/ui';
import { KADRO_ETIKETI, YETKI_ETIKETI } from '@/lib/etiketler';
import { createClient } from '@/lib/supabase/server';
import { baglantiKodu, botBaglantisi } from '@/lib/telegramBaglanti';
import ProfilFormu from './ProfilFormu';
import { TelegramKutusu } from './TelegramKutusu';

export default async function ProfilPage() {
  const ben = await requireMember();
  const sb = await createClient();
  const { data: tg } = await sb.from('telegram_baglantilari').select('kullanici_adi').eq('user_id', ben.id).maybeSingle();
  const kod = baglantiKodu(ben.id);

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Profilim"
        aciklama="Üyeler sayfasında görünen bilgileriniz."
      />

      {/* Özet bilgiler */}
      <dl className="grid gap-4 sm:grid-cols-2 rounded-lg border border-line bg-surface p-5 text-sm sm:p-6">
        <div>
          <dt className="font-medium text-ink-2">E-posta</dt>
          <dd className="mt-1 text-ink">{ben.email}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink-2">Kadro</dt>
          <dd className="mt-1 text-ink">
            {ben.kadro ? KADRO_ETIKETI[ben.kadro] : 'Belirlenmedi'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink-2">Yetki</dt>
          <dd className="mt-1 text-ink">{YETKI_ETIKETI[ben.yetki]}</dd>
        </div>
      </dl>

      <p className="text-sm text-ink-3">
        Kadro ve yetki değişiklikleri için grup yöneticisine yazın.{' '}
        <Link href="/sifre-yenile" className="text-link hover:underline">
          Şifremi değiştir
        </Link>
      </p>

      <TelegramKutusu bagli={!!tg} kullaniciAdi={tg?.kullanici_adi ?? null} baglanti={kod ? botBaglantisi(kod) : null} />

      <ProfilFormu profil={ben} />
    </div>
  );
}
