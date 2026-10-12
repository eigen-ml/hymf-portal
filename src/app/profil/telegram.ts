'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireMemberAction } from '@/lib/auth/dal';

export async function telegramBaginiKaldir(): Promise<{ ok: boolean; error?: string }> {
  try {
    const ben = await requireMemberAction();
    const sb = await createClient();
    const { error } = await sb.from('telegram_baglantilari').delete().eq('user_id', ben.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/profil');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' };
  }
}
