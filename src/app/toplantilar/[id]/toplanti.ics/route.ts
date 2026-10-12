import { getMevcutProfil, getOturumKullanicisi } from '@/lib/auth/dal';
import { icsOlustur } from '@/lib/ics';
import { createClient } from '@/lib/supabase/server';
import { toplantiOlayi } from '@/lib/toplanti';
import { gunISO } from '@/lib/zaman';
import { isMember } from '@/lib/yetki';

// Toplantılar sayfasındaki "Takvime ekle": tek toplantılık .ics dosyası. Abonelik değildir, kişi
// kendi takvimine bir kez ekler (iPhone'da Safari "Tümünü ekle" der). Yalnız giriş yapmış üyeye;
// girişsiz istek proxy'de giriş sayfasına yönlenir.

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bulunamadi() {
  return new Response('Bulunamadı', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) return bulunamadi();

  const ben = await getMevcutProfil();
  if (!isMember(ben) || (await getOturumKullanicisi())?.sifreDegistirmeli) return bulunamadi();

  const sb = await createClient();
  const { data: m } = await sb
    .from('meetings')
    .select('id, title, meeting_date, ends_at, location, notes, presentation_url, updated_at, sequence')
    .eq('id', id)
    .maybeSingle();
  if (!m) return bulunamadi();

  return new Response(icsOlustur({}, [toplantiOlayi(m)]), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="grup-toplantisi-${gunISO(m.meeting_date)}.ics"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
