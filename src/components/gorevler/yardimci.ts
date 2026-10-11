// Görev ekranlarının ortak hesapları: filtre, sıralama, gruplama. Sunucuda ve istemcide çalışır.

import type { RozetTonu } from '@/components/ui';
import { gunFarki, gunISO } from '@/lib/zaman';
import type { GorevDurum, GroupTask, Kadro } from '@/types/database';

export const DURUM_METNI: Record<GorevDurum, string> = {
  acik: 'Açık',
  teslim_edildi: 'Teslim edildi',
  tamamlandi: 'Tamamlandı',
};

export const DURUM_TONU: Record<GorevDurum, RozetTonu> = {
  acik: 'notr',
  teslim_edildi: 'inceleme',
  tamamlandi: 'basari',
};

/** "Güncel": tamamlanmamışlar ve son 14 günde tamamlananlar. */
export type GorevFiltresi = 'guncel' | 'acik' | 'teslim_edildi' | 'tamamlandi' | 'hepsi';

export const FILTRELER: { id: GorevFiltresi; etiket: string }[] = [
  { id: 'guncel', etiket: 'Güncel' },
  { id: 'acik', etiket: 'Açık' },
  { id: 'teslim_edildi', etiket: 'Teslim edildi' },
  { id: 'tamamlandi', etiket: 'Tamamlandı' },
  { id: 'hepsi', etiket: 'Tümü' },
];

const SON_TAMAMLANAN_GUN = 14;

/** Görev tamamlanmamış mı (açık veya teslim edilmiş). */
export function bekliyorMu(g: Pick<GroupTask, 'status'>): boolean {
  return g.status !== 'tamamlandi';
}

/** Son tarihi geçmiş ve tamamlanmamış mı. */
export function gecikmisMi(g: Pick<GroupTask, 'status' | 'due_date'>, bugun: string): boolean {
  return !!g.due_date && bekliyorMu(g) && g.due_date < bugun;
}

export function filtreyeUyuyor(g: GroupTask, filtre: GorevFiltresi, bugun: string): boolean {
  switch (filtre) {
    case 'hepsi':
      return true;
    case 'acik':
      return g.status === 'acik';
    case 'teslim_edildi':
      return g.status === 'teslim_edildi';
    case 'tamamlandi':
      return g.status === 'tamamlandi';
    case 'guncel': {
      if (g.status !== 'tamamlandi') return true;
      const bitis = g.completed_at ?? g.updated_at;
      return gunFarki(gunISO(bitis), bugun) <= SON_TAMAMLANAN_GUN;
    }
  }
}

/**
 * Bekleyenler önce (son tarihi yakın olan üstte, tarihsizler sonda), tamamlananlar sonra
 * (en son tamamlanan üstte).
 */
export function siralaGorevler(liste: GroupTask[]): GroupTask[] {
  return [...liste].sort((a, b) => {
    const aBitti = a.status === 'tamamlandi';
    const bBitti = b.status === 'tamamlandi';
    if (aBitti !== bBitti) return aBitti ? 1 : -1;

    if (aBitti) {
      const aZ = a.completed_at ?? a.updated_at;
      const bZ = b.completed_at ?? b.updated_at;
      return aZ < bZ ? 1 : aZ > bZ ? -1 : 0;
    }

    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    }
    return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0;
  });
}

export interface KisiGrubu {
  kisiId: string;
  ad: string;
  kadro: Kadro | null;
  gorevler: GroupTask[];
}

/** Görevleri alan kişiye göre gruplar; kişiler ada göre (Türkçe sıralama) dizilir. */
export function kisiyeGoreGrupla(liste: GroupTask[]): KisiGrubu[] {
  const harita = new Map<string, KisiGrubu>();
  for (const g of liste) {
    let grup = harita.get(g.assignee_id);
    if (!grup) {
      grup = {
        kisiId: g.assignee_id,
        ad: g.assignee?.full_name ?? 'Silinmiş üye',
        kadro: g.assignee?.kadro ?? null,
        gorevler: [],
      };
      harita.set(g.assignee_id, grup);
    }
    grup.gorevler.push(g);
  }
  return [...harita.values()]
    .map((grup) => ({ ...grup, gorevler: siralaGorevler(grup.gorevler) }))
    .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

/** Her kişinin tamamlanmamış, teslim edilmiş ve gecikmiş görev sayısı. */
export function kisiSayilari(tum: GroupTask[], bugun: string) {
  const sayilar = new Map<string, { bekleyen: number; teslim: number; gecikmis: number }>();
  for (const g of tum) {
    const s = sayilar.get(g.assignee_id) ?? { bekleyen: 0, teslim: 0, gecikmis: 0 };
    if (bekliyorMu(g)) s.bekleyen += 1;
    if (g.status === 'teslim_edildi') s.teslim += 1;
    if (gecikmisMi(g, bugun)) s.gecikmis += 1;
    sayilar.set(g.assignee_id, s);
  }
  return sayilar;
}

/** YYYY-MM-DD gününe n gün ekler (saat dilimi kayması olmadan). */
export function gunEkle(gun: string, n: number): string {
  const d = new Date(`${gun}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
