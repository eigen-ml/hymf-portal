import { ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth/dal';
import { listMembers } from '@/lib/data/profiles';
import { isAdmin } from '@/lib/yetki';
import { SayfaBasligi, Uyari, buttonClass } from '@/components/ui';
import { driveKlasorDosyalari } from '@/lib/data/driveKlasor';
import { SunumListesi } from './SunumListesi';

export default async function SunumlarPage() {
  const ben = await requireMember();
  const sb = await createClient();
  const uyeler = await listMembers(sb);
  const liste = uyeler.data ?? [];
  // Her klasörün dosya adları (60 sn önbellekli); hoca herkesin ne yüklediğini buradan görür.
  const dosyalar = await Promise.all(liste.map((u) => driveKlasorDosyalari(u.sunum_klasoru)));

  // Bütün kişi klasörlerinin bulunduğu üst klasör (HYMF Google hesabında). Repoda durmaz; Vercel'de SUNUM_KLASORU_URL.
  const ustKlasor = process.env.SUNUM_KLASORU_URL?.trim();

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Sunumlar"
        aciklama="Herkesin sunum klasörü. Sunumunu kendi klasörüne yükle; başkalarınınkine de bakabilirsin."
        eylemler={
          ustKlasor ? (
            <a href={ustKlasor} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary' })}>
              Bütün klasörler <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          ) : undefined
        }
      />
      {uyeler.error ? (
        <Uyari tone="tehlike">{uyeler.error}</Uyari>
      ) : (
        <SunumListesi
          uyeler={liste.map((u, i) => ({ id: u.id, ad: u.full_name, klasor: u.sunum_klasoru ?? null, dosyalar: dosyalar[i] }))}
          benId={ben.id}
          yonetici={isAdmin(ben)}
        />
      )}
    </div>
  );
}
