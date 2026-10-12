'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';
import { isAdmin, isHoca } from '@/lib/yetki';
import type { GorevDurum } from '@/types/database';
import { bildirimGonder, htmlKacis } from '@/lib/telegram';
import { CANLI_ADRES } from '@/lib/site';

/** Kişiye özelden kısa görev bildirimi; Telegram'ı bağlamamışsa sessizce atlanır. */
function gorevBildir(kisiler: string[], baslik: string, gorev: string) {
  const html = `${baslik}\n\n<b>${htmlKacis(gorev)}</b>\n\n<a href="${CANLI_ADRES}/gorevler">Görevlerde aç</a>`;
  after(() => bildirimGonder(html, { kisiler }));
}

export type ActionSonucu = { ok: true } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUN_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const BASLIK_MAX = 200;
const ACIKLAMA_MAX = 5000;
const NOT_MAX = 2000;
const KISI_MAX = 50;

function uuidMi(v: unknown): v is string {
  return typeof v === 'string' && UUID_REGEX.test(v);
}

function yenile() {
  revalidatePath('/gorevler');
  revalidatePath('/takvim');
  revalidatePath('/');
}

export interface GorevGirdisi {
  title: string;
  description: string;
  /** Aynı görev seçilen her kişiye ayrı satır olarak verilir. */
  assignee_ids: string[];
  /** YYYY-MM-DD veya boş. */
  due_date: string;
  /** Görevin çıktığı toplantı, opsiyonel. */
  meeting_id: string;
}

/** Hoca veya yönetici: bir veya birkaç kişiye görev verir. */
export async function gorevVer(input: GorevGirdisi): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!isHoca(ben) && !isAdmin(ben)) return { ok: false, error: 'Görevi yalnız hoca veya yönetici verebilir.' };

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) return { ok: false, error: 'Görev başlığı zorunludur.' };
    if (title.length > BASLIK_MAX) return { ok: false, error: `Başlık ${BASLIK_MAX} karakteri aşamaz.` };

    const description = typeof input.description === 'string' ? input.description.trim() : '';
    if (description.length > ACIKLAMA_MAX) return { ok: false, error: `Açıklama ${ACIKLAMA_MAX} karakteri aşamaz.` };

    const kisiler = Array.isArray(input.assignee_ids) ? [...new Set(input.assignee_ids)] : [];
    if (kisiler.length === 0) return { ok: false, error: 'En az bir kişi seçin.' };
    if (kisiler.length > KISI_MAX || !kisiler.every(uuidMi)) return { ok: false, error: 'Geçersiz kişi seçimi.' };

    const due = typeof input.due_date === 'string' ? input.due_date.trim() : '';
    if (due && (!GUN_REGEX.test(due) || Number.isNaN(Date.parse(due)))) {
      return { ok: false, error: 'Geçerli bir son tarih girin.' };
    }

    const meetingId = typeof input.meeting_id === 'string' ? input.meeting_id.trim() : '';
    if (meetingId && !uuidMi(meetingId)) return { ok: false, error: 'Geçersiz toplantı.' };

    const sb = await createClient();
    const { error } = await sb.from('group_tasks').insert(
      kisiler.map((assignee_id) => ({
        title,
        description: description || null,
        assignee_id,
        assigned_by: ben.id,
        due_date: due || null,
        meeting_id: meetingId || null,
      }))
    );
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };

    gorevBildir(kisiler, `📌 Sana yeni görev verildi (${htmlKacis(ben.full_name)})`, title);
    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export interface GorevDuzenleme {
  title: string;
  description: string;
  due_date: string;
}

/** Hoca veya yönetici: görevin başlığını, açıklamasını, son tarihini değiştirir. */
export async function gorevDuzenle(id: string, input: GorevDuzenleme): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!isHoca(ben) && !isAdmin(ben)) return { ok: false, error: 'Görevi yalnız hoca veya yönetici düzenler.' };
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz kayıt.' };

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) return { ok: false, error: 'Görev başlığı zorunludur.' };
    if (title.length > BASLIK_MAX) return { ok: false, error: `Başlık ${BASLIK_MAX} karakteri aşamaz.` };
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    if (description.length > ACIKLAMA_MAX) return { ok: false, error: `Açıklama ${ACIKLAMA_MAX} karakteri aşamaz.` };
    const due = typeof input.due_date === 'string' ? input.due_date.trim() : '';
    if (due && (!GUN_REGEX.test(due) || Number.isNaN(Date.parse(due)))) {
      return { ok: false, error: 'Geçerli bir son tarih girin.' };
    }

    const sb = await createClient();
    const { data, error } = await sb
      .from('group_tasks')
      .update({ title, description: description || null, due_date: due || null })
      .eq('id', id)
      .select('id');
    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Bu görevi düzenleme yetkiniz yok.' };

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/**
 * Durum değiştirir. Görevi alan kişi: açık ↔ teslim edildi. Hoca/yönetici: her durum
 * ("tamamlandı" tiki). Kural veritabanı trigger'ında da zorlanır.
 */
export async function gorevDurumu(id: string, status: GorevDurum): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz kayıt.' };
    if (status !== 'acik' && status !== 'teslim_edildi' && status !== 'tamamlandi') {
      return { ok: false, error: 'Geçersiz durum.' };
    }
    if (status === 'tamamlandi' && !isHoca(ben) && !isAdmin(ben)) {
      return { ok: false, error: 'Görevi tamamlandı olarak yalnız hoca veya yönetici işaretler.' };
    }

    const sb = await createClient();
    const { data, error } = await sb
      .from('group_tasks')
      .update({ status })
      .eq('id', id)
      .select('id, title, assignee_id, assigned_by');
    if (error) return { ok: false, error: error.message };
    const gorev = data?.[0];
    if (!gorev) return { ok: false, error: 'Bu görevi değiştirme yetkiniz yok.' };

    const ad = htmlKacis(ben.full_name);
    if (status === 'teslim_edildi') gorevBildir([gorev.assigned_by], `📥 ${ad} görevini teslim etti`, gorev.title);
    if (status === 'tamamlandi' && gorev.assignee_id !== ben.id) gorevBildir([gorev.assignee_id], '✅ Görevin onaylandı', gorev.title);

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

/** Görevi alan kişi kısa not yazar ("Hesap TRUBA'da, iş no 12345"). */
export async function gorevNotu(id: string, not: string): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz kayıt.' };
    const metin = typeof not === 'string' ? not.trim() : '';
    if (metin.length > NOT_MAX) return { ok: false, error: `Not ${NOT_MAX} karakteri aşamaz.` };

    const sb = await createClient();
    const { data, error } = await sb
      .from('group_tasks')
      .update({ assignee_note: metin || null })
      .eq('id', id)
      .eq('assignee_id', ben.id)
      .select('id');
    if (error) return { ok: false, error: error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Notu yalnız görevi alan kişi yazar.' };

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function gorevSil(id: string): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!isHoca(ben) && !isAdmin(ben)) return { ok: false, error: 'Görevi yalnız hoca veya yönetici siler.' };
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz kayıt.' };

    const sb = await createClient();
    const { data, error } = await sb.from('group_tasks').delete().eq('id', id).select('id');
    if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Bu görevi silme yetkiniz yok.' };

    yenile();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
