'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';
import type { Profile } from '@/types/database';
import { isAdmin, isHoca } from '@/lib/yetki';

export type ActionSonucu = { ok: true } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTTP_REGEX = /^https?:\/\//i;
const VARSAYILAN_DONEM = '2026-2027 Güz';

function uuidMi(deger: unknown): deger is string {
  return typeof deger === 'string' && UUID_REGEX.test(deger);
}

function metin(deger: unknown): string {
  return typeof deger === 'string' ? deger.trim() : '';
}

function gecerliHttpUrl(deger: string): boolean {
  if (!HTTP_REGEX.test(deger)) return false;
  try {
    new URL(deger);
    return true;
  } catch {
    return false;
  }
}

/** Ders ekleme/düzenleme/silme ve materyal ekleme yalnız hoca veya yönetici. */
function dersYetkisi(ben: Profile): boolean {
  return isHoca(ben) || isAdmin(ben);
}

function hataMesaji(e: unknown): string {
  return e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
}

interface DersGirdisi {
  code: string;
  name: string;
  instructor_id: string;
  semester: string;
  syllabus?: string;
}

type DersAlanlari = { code: string; name: string; instructor_id: string; semester: string; syllabus: string | null };

function dersDenetle(input: DersGirdisi): DersAlanlari | string {
  const code = metin(input.code);
  if (!code || code.length > 20) return 'Ders kodu 1-20 karakter olmalıdır.';

  const name = metin(input.name);
  if (name.length < 2 || name.length > 200) return 'Ders adı 2-200 karakter arası olmalıdır.';

  if (!uuidMi(input.instructor_id)) return 'Geçersiz öğretim üyesi seçimi.';

  const semester = metin(input.semester) || VARSAYILAN_DONEM;
  if (semester.length > 40) return 'Dönem 40 karakteri geçemez.';

  const syllabus = metin(input.syllabus) || null;
  if (syllabus && syllabus.length > 5000) return 'Syllabus 5000 karakteri geçemez.';

  return { code, name, instructor_id: input.instructor_id, semester, syllabus };
}

export async function dersEkle(input: DersGirdisi): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!dersYetkisi(ben)) return { ok: false, error: 'Ders eklemek için yetkiniz yok.' };

    const alanlar = dersDenetle(input);
    if (typeof alanlar === 'string') return { ok: false, error: alanlar };

    const sb = await createClient();
    const { error } = await sb.from('courses').insert(alanlar);

    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };

    revalidatePath('/dersler');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: hataMesaji(e) };
  }
}

export async function dersDuzenle(id: string, input: DersGirdisi): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!dersYetkisi(ben)) return { ok: false, error: 'Ders düzenlemek için yetkiniz yok.' };
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz ders ID.' };

    const alanlar = dersDenetle(input);
    if (typeof alanlar === 'string') return { ok: false, error: alanlar };

    const sb = await createClient();
    const { data, error } = await sb.from('courses').update(alanlar).eq('id', id).select('id');

    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Ders bulunamadı ya da düzenleme yetkiniz yok.' };

    revalidatePath('/dersler');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: hataMesaji(e) };
  }
}

export async function dersSil(id: string): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!dersYetkisi(ben)) return { ok: false, error: 'Ders silmek için yetkiniz yok.' };
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz ders ID.' };

    const sb = await createClient();
    const { data, error } = await sb.from('courses').delete().eq('id', id).select('id');

    if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Ders bulunamadı ya da silme yetkiniz yok.' };

    revalidatePath('/dersler');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: hataMesaji(e) };
  }
}

interface MateryalAlanlari {
  week_number: number;
  title: string;
  description?: string;
  file_url: string;
}

type TemizMateryal = { week_number: number; title: string; description: string | null; file_url: string };

function materyalDenetle(input: MateryalAlanlari): TemizMateryal | string {
  const week = input.week_number;
  if (!Number.isInteger(week) || week < 1 || week > 20) return 'Hafta numarası 1-20 arasında bir tam sayı olmalıdır.';

  const title = metin(input.title);
  if (!title || title.length > 200) return 'Başlık 1-200 karakter olmalıdır.';

  const description = metin(input.description) || null;
  if (description && description.length > 5000) return 'Açıklama 5000 karakteri geçemez.';

  const fileUrl = metin(input.file_url);
  if (!fileUrl || fileUrl.length > 2000 || !gecerliHttpUrl(fileUrl)) {
    return 'Dosya bağlantısı http:// veya https:// ile başlayan geçerli bir adres olmalıdır.';
  }

  return { week_number: week, title, description, file_url: fileUrl };
}

export async function materyalEkle(input: MateryalAlanlari & { course_id: string }): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!dersYetkisi(ben)) return { ok: false, error: 'Materyal eklemek için yetkiniz yok.' };

    if (!uuidMi(input.course_id)) return { ok: false, error: 'Geçersiz ders ID.' };

    const alanlar = materyalDenetle(input);
    if (typeof alanlar === 'string') return { ok: false, error: alanlar };

    const sb = await createClient();
    const { error } = await sb.from('course_materials').insert({
      ...alanlar,
      course_id: input.course_id,
      uploader_id: ben.id,
    });

    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };

    revalidatePath('/dersler');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: hataMesaji(e) };
  }
}

/** Yükleyen kendi materyalini, hoca/yönetici herhangi birini düzenler; RLS zorlar. Ders ve yükleyen değişmez. */
export async function materyalDuzenle(id: string, input: MateryalAlanlari): Promise<ActionSonucu> {
  try {
    await requireMemberAction();
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz materyal ID.' };

    const alanlar = materyalDenetle(input);
    if (typeof alanlar === 'string') return { ok: false, error: alanlar };

    const sb = await createClient();
    const { data, error } = await sb.from('course_materials').update(alanlar).eq('id', id).select('id');

    if (error) return { ok: false, error: 'Kaydedilemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Bu materyali düzenleme yetkiniz yok.' };

    revalidatePath('/dersler');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: hataMesaji(e) };
  }
}

export async function materyalSil(id: string): Promise<ActionSonucu> {
  try {
    const ben = await requireMemberAction();
    if (!uuidMi(id)) return { ok: false, error: 'Geçersiz materyal ID.' };

    const sb = await createClient();
    const { data: mevcut, error: okumaHatasi } = await sb
      .from('course_materials')
      .select('uploader_id')
      .eq('id', id)
      .maybeSingle();

    if (okumaHatasi) return { ok: false, error: 'Materyal okunamadı: ' + okumaHatasi.message };
    if (!mevcut) return { ok: false, error: 'Materyal bulunamadı.' };

    // Yükleyen kendi materyalini, hoca/yönetici ise herhangi birini silebilir.
    if (mevcut.uploader_id !== ben.id && !dersYetkisi(ben)) {
      return { ok: false, error: 'Bu materyali silme yetkiniz yok.' };
    }

    const { data, error } = await sb.from('course_materials').delete().eq('id', id).select('id');

    if (error) return { ok: false, error: 'Silinemedi: ' + error.message };
    if ((data ?? []).length === 0) return { ok: false, error: 'Bu materyali silme yetkiniz yok.' };

    revalidatePath('/dersler');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: hataMesaji(e) };
  }
}
