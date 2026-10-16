import { requireMember } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { Uyari } from '@/components/ui';
import { ToplantilarIstemci, type ToplantiKaydi } from './ToplantilarIstemci';

export default async function Page({ searchParams }: { searchParams: Promise<{ yeni?: string }> }) {
  const ben = await requireMember();
  const { yeni } = await searchParams;

  const sb = await createClient();
  const { data, error } = await sb
    .from('meetings')
    .select('*, creator:profiles(id, full_name, academic_title, kadro, yetki)')
    .order('meeting_date', { ascending: true });

  // "Hocayla görüşme" önerileri: hesabı olan hocalar ve daha önce yazılmış hoca adları.
  const { data: hocaProfilleri } = await sb.from('profiles').select('full_name').eq('kadro', 'hoca').eq('is_active', true);
  const kayitlar = (data ?? []) as ToplantiKaydi[];
  const hocalar = [
    ...new Set([
      ...(hocaProfilleri ?? []).map((p) => p.full_name as string),
      ...kayitlar.map((m) => m.hoca_adi).filter((a): a is string => !!a),
    ]),
  ].sort((a, b) => a.localeCompare(b, 'tr'));

  if (error) {
    return <Uyari tone="tehlike">Toplantılar yüklenemedi. Sayfayı yenileyin.</Uyari>;
  }

  const yonetebilir = isHoca(ben) || isAdmin(ben);

  return (
    <ToplantilarIstemci
      kayitlar={kayitlar}
      simdi={new Date().toISOString()}
      benId={ben.id}
      yonetebilir={yonetebilir}
      hocalar={hocalar}
      formAcik={yeni === '1'}
    />
  );
}
