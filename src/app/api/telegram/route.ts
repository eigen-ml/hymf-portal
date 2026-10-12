import { timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { baglantiKodunuCoz } from '@/lib/telegramBaglanti';
import { htmlKacis, telegramGonder } from '@/lib/telegram';
import { CANLI_ADRES } from '@/lib/site';

// Telegram bot webhook'u. Telegram her istekte setWebhook'taki secret_token'ı başlıkta yollar;
// eşleşmeyen istek reddedilir. Yalnız özel sohbetteki /start <kod> ve /durdur işlenir.

function yetkili(request: Request): boolean {
  const gizli = process.env.TELEGRAM_WEBHOOK_SECRET;
  const gelen = request.headers.get('x-telegram-bot-api-secret-token');
  if (!gizli || !gelen) return false;
  const a = Buffer.from(gizli);
  const b = Buffer.from(gelen);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!yetkili(request)) return new Response('Yetkisiz', { status: 401 });

  const guncelleme = await request.json().catch(() => null);
  const mesaj = guncelleme?.message;
  const sohbet = mesaj?.chat;
  const metin: string = typeof mesaj?.text === 'string' ? mesaj.text.trim() : '';
  // Telegram'a hep 200 dön; yoksa aynı güncellemeyi tekrar tekrar yollar.
  if (!sohbet || sohbet.type !== 'private' || !metin) return new Response('ok');

  const chatId = String(sohbet.id);
  const yanit = (html: string) => telegramGonder(html, { chatId });
  const sb = createAdminClient();
  if (!sb) return new Response('ok');

  if (metin === '/durdur' || metin === '/stop') {
    await sb.from('telegram_baglantilari').delete().eq('chat_id', sohbet.id);
    await yanit('Bildirimler kapatıldı. Yeniden açmak için portaldaki Profilim sayfasından bağlanın.');
    return new Response('ok');
  }

  const kod = metin.startsWith('/start ') ? metin.slice(7).trim() : '';
  const userId = kod ? baglantiKodunuCoz(kod) : null;
  if (!userId) {
    await yanit(`Merhaba! Bildirim almak için <a href="${CANLI_ADRES}/profil">portalda Profilim</a> sayfasındaki "Telegram'ı bağla" düğmesine basın.`);
    return new Response('ok');
  }

  const { data: profil } = await sb
    .from('profiles')
    .select('full_name, is_approved, is_active')
    .eq('id', userId)
    .maybeSingle();
  if (!profil?.is_approved || !profil.is_active) {
    await yanit('Bu hesap portalda aktif değil.');
    return new Response('ok');
  }

  // Aynı Telegram hesabı başka bir üyeye bağlıysa o bağ kalkar (chat_id tekil).
  await sb.from('telegram_baglantilari').delete().eq('chat_id', sohbet.id).neq('user_id', userId);
  const { error } = await sb.from('telegram_baglantilari').upsert({
    user_id: userId,
    chat_id: sohbet.id,
    kullanici_adi: typeof sohbet.username === 'string' ? sohbet.username.slice(0, 64) : null,
  });
  if (error) {
    console.error('[Telegram] Bağlantı kaydedilemedi:', error.message);
    await yanit('Bağlanamadı, biraz sonra tekrar deneyin.');
    return new Response('ok');
  }

  await yanit(`✅ Bağlandı, ${htmlKacis(profil.full_name)}. Toplantı, duyuru ve görev bildirimleri artık buraya gelecek. Kapatmak için /durdur yazın.`);
  return new Response('ok');
}
