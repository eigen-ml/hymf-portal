import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { isAdmin, isHoca } from '@/lib/yetki';
import { gunISO } from '@/lib/zaman';
import type { CalendarEvent, GroupTask, Profile, TakvimOgesi } from '@/types/database';

const KISA_PROFIL = 'id, full_name, academic_title, kadro';

const GOREV_SECIMI = `*,
  assignee:profiles!group_tasks_assignee_id_fkey(${KISA_PROFIL}),
  assigner:profiles!group_tasks_assigned_by_fkey(${KISA_PROFIL}),
  meeting:meetings(id, title, meeting_date)`;

/** Tamamlanan görevler bu kadar gün listede kalır; daha eskiler yüklenmez. */
const TAMAMLANAN_SAKLAMA_GUN = 120;

/**
 * Görevler (onaylı her üye görür): tamamlanmamışların hepsi, tamamlananların son 120 günü.
 * Son tarihi olanlar önce, yakın tarih üstte.
 */
export async function gorevleriGetir(): Promise<GroupTask[]> {
  const sb = await createClient();
  const sinir = new Date(Date.now() - TAMAMLANAN_SAKLAMA_GUN * 86_400_000).toISOString();
  const { data, error } = await sb
    .from('group_tasks')
    .select(GOREV_SECIMI)
    .or(`status.neq.tamamlandi,completed_at.gte.${sinir}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error('Görevler yüklenemedi: ' + error.message);
  return (data ?? []) as GroupTask[];
}

/** Bir kişinin aldığı görevler. */
export async function kisininGorevleri(kisiId: string): Promise<GroupTask[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from('group_tasks')
    .select(GOREV_SECIMI)
    .eq('assignee_id', kisiId)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw new Error('Görevler yüklenemedi: ' + error.message);
  return (data ?? []) as GroupTask[];
}

/** Görev verilebilecek kişiler: onaylı ve aktif üyeler. */
export async function gorevVerilebilecekler(): Promise<Pick<Profile, 'id' | 'full_name' | 'academic_title' | 'kadro'>[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from('profiles')
    .select(KISA_PROFIL)
    .eq('is_approved', true)
    .eq('is_active', true)
    .order('full_name');
  if (error) throw new Error('Üyeler yüklenemedi: ' + error.message);
  return data ?? [];
}

export interface TakvimAraligi {
  /** ISO zaman damgası, dahil. */
  baslangic: string;
  /** ISO zaman damgası, hariç. */
  bitis: string;
}

/**
 * Takvim ekranının tüm öğeleri: toplantılar, etkinlikler ve son tarihi olan görevler.
 * `silebilir` yalnız arayüz içindir; asıl koruma RLS'dedir.
 */
export async function takvimOgeleri(ben: Profile, aralik: TakvimAraligi): Promise<TakvimOgesi[]> {
  const sb = await createClient();
  const yonetici = isHoca(ben) || isAdmin(ben);
  const admin = isAdmin(ben);

  const [toplantilar, etkinlikler, gorevler] = await Promise.all([
    sb
      .from('meetings')
      .select(`id, title, meeting_date, notes, creator_id, creator:profiles(${KISA_PROFIL})`)
      .gte('meeting_date', aralik.baslangic)
      .lt('meeting_date', aralik.bitis),
    sb
      .from('calendar_events')
      .select(`*, creator:profiles(${KISA_PROFIL})`)
      .gte('starts_at', aralik.baslangic)
      .lt('starts_at', aralik.bitis),
    sb
      .from('group_tasks')
      .select(GOREV_SECIMI)
      .not('due_date', 'is', null)
      .gte('due_date', gunISO(aralik.baslangic))
      .lt('due_date', gunISO(aralik.bitis)),
  ]);

  const hata = toplantilar.error || etkinlikler.error || gorevler.error;
  if (hata) throw new Error('Takvim yüklenemedi: ' + hata.message);

  type ToplantiSatiri = {
    id: string;
    title: string;
    meeting_date: string;
    notes: string | null;
    creator_id: string;
    creator: { full_name: string } | null;
  };

  const ogeler: TakvimOgesi[] = [];

  for (const m of (toplantilar.data ?? []) as unknown as ToplantiSatiri[]) {
    ogeler.push({
      anahtar: `toplanti:${m.id}`,
      tur: 'toplanti',
      kayitId: m.id,
      baslik: m.title,
      baslangic: m.meeting_date,
      bitis: null,
      tumGun: false,
      gun: gunISO(m.meeting_date),
      aciklama: m.notes,
      yer: null,
      ekleyenId: m.creator_id,
      ekleyenAd: m.creator?.full_name ?? null,
      silebilir: m.creator_id === ben.id || yonetici,
    });
  }

  for (const e of (etkinlikler.data ?? []) as CalendarEvent[]) {
    ogeler.push({
      anahtar: `etkinlik:${e.id}`,
      tur: 'etkinlik',
      kayitId: e.id,
      baslik: e.title,
      baslangic: e.all_day ? gunISO(e.starts_at) : e.starts_at,
      bitis: e.ends_at,
      tumGun: e.all_day,
      gun: gunISO(e.starts_at),
      aciklama: e.notes,
      yer: e.location,
      ekleyenId: e.creator_id,
      ekleyenAd: e.creator?.full_name ?? null,
      silebilir: e.creator_id === ben.id || admin,
    });
  }

  for (const g of (gorevler.data ?? []) as GroupTask[]) {
    ogeler.push({
      anahtar: `gorev:${g.id}`,
      tur: 'gorev',
      kayitId: g.id,
      baslik: g.title,
      baslangic: g.due_date!,
      bitis: null,
      tumGun: true,
      gun: g.due_date!,
      aciklama: g.description,
      yer: null,
      ekleyenId: g.assigned_by,
      ekleyenAd: g.assigner?.full_name ?? null,
      sorumluId: g.assignee_id,
      sorumluAd: g.assignee?.full_name ?? null,
      gorevDurum: g.status,
      silebilir: yonetici,
    });
  }

  // Gün içinde: tüm gün öğeleri önce, sonra saate göre.
  ogeler.sort((a, b) => {
    if (a.gun !== b.gun) return a.gun < b.gun ? -1 : 1;
    if (a.tumGun !== b.tumGun) return a.tumGun ? -1 : 1;
    return a.baslangic < b.baslangic ? -1 : a.baslangic > b.baslangic ? 1 : 0;
  });

  return ogeler;
}
