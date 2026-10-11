import { createClient } from '@supabase/supabase-js';
import { icsOlustur, type IcsOlay } from '@/lib/ics';
import { gunISO } from '@/lib/zaman';

// Apple Takvim'in abone olduğu adres: /takvim-akisi/<anahtar>.ics
// Oturum yok; anahtar takvim_akisi() fonksiyonunda doğrulanır (bkz. 20261011000000_gorev_takvim.sql).

export const dynamic = 'force-dynamic';

type Akis = {
  toplantilar: { id: string; title: string; meeting_date: string; notes: string | null; presentation_url: string | null }[];
  etkinlikler: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
    all_day: boolean;
    location: string | null;
    notes: string | null;
  }[];
  gorevler: {
    id: string;
    title: string;
    description: string | null;
    due_date: string;
    status: 'acik' | 'teslim_edildi' | 'tamamlandi';
    assignee: string;
    assigned_by: string;
    benim: boolean;
  }[];
};

const DURUM_ONEKI = { acik: '', teslim_edildi: '(teslim edildi) ', tamamlandi: '✓ ' } as const;

function bulunamadi() {
  return new Response('Bulunamadı', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: ham } = await params;
  const token = ham.replace(/\.ics$/i, '');
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) return bulunamadi();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return bulunamadi();

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await sb.rpc('takvim_akisi', { p_token: token });
  if (error || !data) return bulunamadi();

  const akis = data as Akis;
  const site = new URL(request.url).origin;
  const olaylar: IcsOlay[] = [];

  for (const m of akis.toplantilar) {
    olaylar.push({
      uid: `toplanti-${m.id}@hymf-portal`,
      baslik: `Toplantı: ${m.title}`,
      baslangic: m.meeting_date,
      tumGun: false,
      aciklama: [m.notes, m.presentation_url].filter(Boolean).join('\n\n') || null,
      url: `${site}/toplantilar`,
    });
  }

  for (const e of akis.etkinlikler) {
    olaylar.push({
      uid: `etkinlik-${e.id}@hymf-portal`,
      baslik: e.title,
      baslangic: e.all_day ? gunISO(e.starts_at) : e.starts_at,
      bitis: e.ends_at ? (e.all_day ? gunISO(e.ends_at) : e.ends_at) : null,
      tumGun: e.all_day,
      aciklama: e.notes,
      yer: e.location,
      url: `${site}/takvim`,
    });
  }

  for (const g of akis.gorevler) {
    const kim = g.benim ? '' : ` (${g.assignee})`;
    olaylar.push({
      uid: `gorev-${g.id}@hymf-portal`,
      baslik: `${DURUM_ONEKI[g.status] ?? ''}Görev: ${g.title}${kim}`,
      baslangic: g.due_date,
      tumGun: true,
      aciklama: [g.description, `Veren: ${g.assigned_by}`].filter(Boolean).join('\n\n'),
      url: `${site}/gorevler`,
    });
  }

  return new Response(icsOlustur('HYMF Portal', olaylar), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="hymf-portal.ics"',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
