'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAction } from '@/lib/auth/dal';
import { isSuperadmin } from '@/lib/yetki';
import type { Kadro, Yetki } from '@/types/database';
import { KADROLAR, YETKILER, DANISMANLI_KADROLAR } from '@/types/database';
import {
  approveMember,
  updateMember,
  setYetki,
  addAdvisor,
  removeAdvisor,
  setPrimaryAdvisor,
  upsertAllowlist,
  deleteAllowlist,
  addPendingAdvisor,
  removePendingAdvisor,
} from '@/lib/data/admin';

export type ActionSonucu = { ok: true } | { ok: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function validateEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
}

function validateKadro(value: unknown): value is Kadro {
  return typeof value === 'string' && KADROLAR.includes(value as Kadro);
}

function validateYetki(value: unknown): value is Yetki {
  return typeof value === 'string' && YETKILER.includes(value as Yetki);
}

function validateName(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 2 && value.length <= 120;
}

function validateTitle(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 60;
}

export async function uyeyiOnayla(id: string, kadro: Kadro): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz kullanıcı ID.' };
    if (!validateKadro(kadro)) return { ok: false, error: 'Geçersiz kadro.' };

    const sb = await createClient();
    const result = await approveMember(sb, id, kadro);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function uyeyiGuncelle(
  id: string,
  patch: {
    full_name?: string;
    academic_title?: string | null;
    kadro?: Kadro | null;
  },
): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz kullanıcı ID.' };

    if (patch.full_name !== undefined && !validateName(patch.full_name)) {
      return { ok: false, error: 'Ad 2-120 karakter arası olmalıdır.' };
    }

    if (patch.academic_title !== undefined && patch.academic_title !== null && !validateTitle(patch.academic_title)) {
      return { ok: false, error: 'Unvan 60 karakterden uzun olamaz.' };
    }

    if (patch.kadro !== undefined && patch.kadro !== null && !validateKadro(patch.kadro)) {
      return { ok: false, error: 'Geçersiz kadro.' };
    }

    // İstemciden gelen nesne olduğu gibi geçirilmez; yalnız bu üç alan.
    const temiz: { full_name?: string; academic_title?: string | null; kadro?: Kadro } = {};
    if (patch.full_name !== undefined) temiz.full_name = patch.full_name.trim();
    if (patch.academic_title !== undefined) temiz.academic_title = patch.academic_title?.trim() || null;
    if (patch.kadro) temiz.kadro = patch.kadro;

    const sb = await createClient();
    const result = await updateMember(sb, id, temiz);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function aktiflikDegistir(id: string, aktif: boolean): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz kullanıcı ID.' };
    if (typeof aktif !== 'boolean') return { ok: false, error: 'Geçersiz değer.' };

    const sb = await createClient();
    const result = await updateMember(sb, id, { is_active: aktif });

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function danismanEkle(
  studentId: string,
  advisorId: string,
  birincil: boolean,
): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateUUID(studentId)) return { ok: false, error: 'Geçersiz öğrenci ID.' };
    if (!validateUUID(advisorId)) return { ok: false, error: 'Geçersiz danışman ID.' };

    if (typeof birincil !== 'boolean') return { ok: false, error: 'Geçersiz değer.' };

    // Öğrencinin zaten birincil danışmanı varsa doğrudan birincil eklemek tekillik kuralına takılır;
    // önce normal eklenir, sonra birincil yapılır (diğerleri otomatik ikincil olur).
    const sb = await createClient();
    const result = await addAdvisor(sb, studentId, advisorId, false);
    if (result.error) return { ok: false, error: result.error };

    if (birincil) {
      const birincilSonuc = await setPrimaryAdvisor(sb, studentId, advisorId);
      if (birincilSonuc.error) return { ok: false, error: birincilSonuc.error };
    }

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function danismanCikar(studentId: string, advisorId: string): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateUUID(studentId)) return { ok: false, error: 'Geçersiz öğrenci ID.' };
    if (!validateUUID(advisorId)) return { ok: false, error: 'Geçersiz danışman ID.' };

    const sb = await createClient();
    const result = await removeAdvisor(sb, studentId, advisorId);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function birincilDanismanYap(studentId: string, advisorId: string): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateUUID(studentId)) return { ok: false, error: 'Geçersiz öğrenci ID.' };
    if (!validateUUID(advisorId)) return { ok: false, error: 'Geçersiz danışman ID.' };

    const sb = await createClient();
    const result = await setPrimaryAdvisor(sb, studentId, advisorId);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function davetEkle(input: {
  email: string;
  full_name: string;
  kadro: Kadro;
  yetki: Yetki;
  danismanEmail?: string;
  /** Verilirse hesap hemen, e-postası doğrulanmış olarak açılır; kişi bu geçici şifreyle girer. */
  sifre?: string;
}): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateEmail(input.email)) return { ok: false, error: 'Geçersiz e-posta adresi.' };
    if (!validateName(input.full_name)) return { ok: false, error: 'Ad 2-120 karakter arası olmalıdır.' };
    if (!validateKadro(input.kadro)) return { ok: false, error: 'Geçersiz kadro.' };
    if (!validateYetki(input.yetki)) return { ok: false, error: 'Geçersiz yetki.' };

    if (input.danismanEmail !== undefined && input.danismanEmail && !validateEmail(input.danismanEmail)) {
      return { ok: false, error: 'Geçersiz danışman e-postası.' };
    }

    if (input.sifre !== undefined && (input.sifre.length < 8 || input.sifre.length > 72)) {
      return { ok: false, error: 'Geçici şifre 8-72 karakter olmalıdır.' };
    }

    // Önce davet satırı yöneticinin kendi oturumuyla yazılır: kimin hangi kadro/yetkiyi verebileceğini
    // RLS ve trigger denetler. Hesap ancak bu geçerse servis anahtarıyla açılır; yeni hesap kadro ve
    // yetkisini yine bu satırdan alır (handle_new_user → apply_allowlist).
    const sb = await createClient();
    const result = await upsertAllowlist(sb, {
      email: input.email,
      full_name: input.full_name.trim(),
      kadro: input.kadro,
      yetki: input.yetki,
    });

    if (result.error) return { ok: false, error: result.error };

    if (
      input.danismanEmail &&
      DANISMANLI_KADROLAR.includes(input.kadro)
    ) {
      const pendingResult = await addPendingAdvisor(sb, input.email, input.danismanEmail, true);
      if (pendingResult.error) return { ok: false, error: pendingResult.error };
    }

    revalidatePath('/yonetim', 'layout');

    if (input.sifre) {
      const admin = createAdminClient();
      if (!admin) {
        return { ok: false, error: 'Davet kaydedildi ama hesap açılamadı: sunucuda SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' };
      }
      const { error } = await admin.auth.admin.createUser({
        email: input.email.trim().toLowerCase(),
        password: input.sifre,
        email_confirm: true,
        user_metadata: { full_name: input.full_name.trim() },
        // İlk girişte kendi şifresini belirlemeden portalı kullanamaz (src/lib/supabase/proxy.ts).
        app_metadata: { sifre_degistir: true },
      });
      if (error) {
        if (error.code === 'email_exists' || /already been registered/i.test(error.message)) {
          return { ok: false, error: 'Bu e-postayla zaten bir hesap var; davet kaydı güncellendi, şifresi değiştirilmedi.' };
        }
        return { ok: false, error: 'Davet kaydedildi ama hesap açılamadı: ' + error.message };
      }
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function davetSil(email: string): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateEmail(email)) return { ok: false, error: 'Geçersiz e-posta adresi.' };

    const sb = await createClient();
    const result = await deleteAllowlist(sb, email);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function bekleyenDanismanSil(studentEmail: string, advisorEmail: string): Promise<ActionSonucu> {
  try {
    await requireAdminAction();

    if (!validateEmail(studentEmail)) return { ok: false, error: 'Geçersiz öğrenci e-postası.' };
    if (!validateEmail(advisorEmail)) return { ok: false, error: 'Geçersiz danışman e-postası.' };

    const sb = await createClient();
    const result = await removePendingAdvisor(sb, studentEmail, advisorEmail);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export async function yetkiVer(id: string, yetki: Yetki): Promise<ActionSonucu> {
  try {
    const ben = await requireAdminAction();

    if (!isSuperadmin(ben)) {
      return { ok: false, error: 'Bu işlem yalnız sistem yöneticisine açıktır.' };
    }

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz kullanıcı ID.' };
    if (!validateYetki(yetki)) return { ok: false, error: 'Geçersiz yetki.' };

    const sb = await createClient();
    const result = await setYetki(sb, id, yetki);

    if (result.error) return { ok: false, error: result.error };

    revalidatePath('/yonetim', 'layout');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}

export type SifreSifirlamaSonucu = { ok: true; sifre: string } | { ok: false; error: string };

function geciciSifre(): string {
  // Karışan karakterler (0/O, 1/l/I) yok; 12 karakter.
  const harfler = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rastgele = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(rastgele, (n) => harfler[n % harfler.length]).join('');
}

/** E-posta gönderilemediği için şifre unutan üyeye yönetici yeni geçici şifre verir. */
export async function sifreSifirla(id: string): Promise<SifreSifirlamaSonucu> {
  try {
    const ben = await requireAdminAction();

    if (!validateUUID(id)) return { ok: false, error: 'Geçersiz kullanıcı ID.' };

    const sb = await createClient();
    const { data: hedef, error } = await sb
      .from('profiles')
      .select('id, email, full_name, kadro, yetki')
      .eq('id', id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!hedef) return { ok: false, error: 'Üye bulunamadı.' };

    // Davet kuralıyla aynı: hoca ve yönetici hesaplarının şifresini yalnız sistem yöneticisi sıfırlar.
    // Aksi halde bir yönetici başka bir yöneticinin ya da hocanın hesabını ele geçirebilirdi.
    if (!isSuperadmin(ben) && (hedef.yetki !== 'uye' || hedef.kadro === 'hoca')) {
      return { ok: false, error: 'Hoca ve yönetici hesaplarının şifresini yalnız sistem yöneticisi sıfırlayabilir.' };
    }

    const admin = createAdminClient();
    if (!admin) return { ok: false, error: 'Sunucuda SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' };

    const sifre = geciciSifre();
    const { error: guncellemeHatasi } = await admin.auth.admin.updateUserById(id, {
      password: sifre,
      app_metadata: { sifre_degistir: true },
    });
    if (guncellemeHatasi) return { ok: false, error: 'Şifre sıfırlanamadı: ' + guncellemeHatasi.message };

    // Servis anahtarıyla yapılan değişiklik trigger'lardan geçmez; işlem geçmişine burada yazılır.
    await admin.from('uyelik_logs').insert({
      actor_id: ben.id,
      target_id: id,
      target_email: hedef.email,
      action: 'sifre_sifirlandi',
      details: { hedef_ad: hedef.full_name },
    });

    revalidatePath('/yonetim', 'layout');
    return { ok: true, sifre };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
