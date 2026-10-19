import { requireMember } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { Uyari } from '@/components/ui';
import { DuyurularIstemci, type DuyuruKaydi } from './DuyurularIstemci';

export default async function DuyurularPage() {
  const ben = await requireMember();

  const sb = await createClient();
  const { data, error } = await sb
    .from('announcements')
    .select('*, author:profiles(id, full_name, academic_title, kadro, yetki)')
    .order('created_at', { ascending: false });

  if (error) {
    return <Uyari tone="tehlike">Duyurular yüklenemedi. Sayfayı yenileyin.</Uyari>;
  }

  const yonetebilir = isHoca(ben) || isAdmin(ben);

  return (
    <DuyurularIstemci
      kayitlar={(data ?? []) as DuyuruKaydi[]}
      benId={ben.id}
      yonetebilir={yonetebilir}
      admin={isAdmin(ben)}
    />
  );
}
