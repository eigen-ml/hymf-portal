import { requireMember } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { getDanismanPanosu } from '@/lib/data/workspaces';
import { DanismanPanosu } from '@/components/calisma/DanismanPanosu';
import { SayfaBasligi, Uyari } from '@/components/ui';
import { NotlarIstemci, type NotKaydi } from './NotlarIstemci';

// Çalışma alanı artık sade: herkesin kendi kısa notları ve ortak Fikirler. Eski hocalı plan/defter
// ekranı /calisma-alani/[ogrenciId] adresinde duruyor; hoca hesabı eskisi gibi öğrenci panosunu görür.
export default async function CalismaAlaniPage() {
  const ben = await requireMember();
  const sb = await createClient();

  if (isHoca(ben)) {
    const sonuc = await getDanismanPanosu(sb, ben.id);
    return (
      <div className="space-y-8">
        <SayfaBasligi baslik="Öğrencilerim" aciklama="Danışmanı olduğunuz öğrencilerin plan durumu." />
        {sonuc.error ? <Uyari tone="tehlike">{sonuc.error}</Uyari> : <DanismanPanosu satirlar={sonuc.data ?? []} />}
      </div>
    );
  }

  const { data, error } = await sb
    .from('notlar')
    .select('id, yazar_id, tur, govde, yapildi, created_at, yazar:profiles(id, full_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <SayfaBasligi
        baslik="Çalışma alanı"
        aciklama="Kısa notlar: ne yapacaktık, nerede kaldık. Herkes okuyabilir; notu yalnız yazan işaretler ve siler."
      />
      {error ? (
        <Uyari tone="tehlike">Notlar yüklenemedi. Sayfayı yenileyin.</Uyari>
      ) : (
        <NotlarIstemci kayitlar={(data ?? []) as unknown as NotKaydi[]} benId={ben.id} yonetici={isAdmin(ben)} />
      )}
    </div>
  );
}
