import { requireMember } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { Uyari } from '@/components/ui';
import { KaynaklarIstemci } from './KaynaklarIstemci';

export default async function KaynaklarSayfasi() {
  const ben = await requireMember();
  const sb = await createClient();

  const { data, error } = await sb
    .from('resources')
    .select('*, uploader:profiles(id, full_name, academic_title, kadro, yetki)')
    .order('created_at', { ascending: false });

  if (error) {
    return <Uyari tone="tehlike">Kaynaklar yüklenemedi. Sayfayı yenileyin.</Uyari>;
  }

  const yonetebilir = isHoca(ben) || isAdmin(ben);

  return <KaynaklarIstemci kayitlar={data ?? []} benId={ben.id} yonetebilir={yonetebilir} admin={isAdmin(ben)} />;
}
