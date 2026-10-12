import { CANLI_ADRES } from '@/lib/site';
import { AnnouncementPriority } from '@/types/database';

export interface TelegramSonucu {
  ok: boolean;
  /** Bot ayarlı değil (yerel veya preview): hata sayılmaz, yalnız loglanır. */
  atlandi?: boolean;
  mesajId?: string;
  hata?: string;
}

/**
 * Grubun Telegram sohbetine HTML mesaj gönderir. TELEGRAM_BOT_TOKEN ve TELEGRAM_CHAT_ID yalnız
 * Vercel Production'da tanımlı; başka yerde gönderim atlanır. Preview'da denemek için o ortama
 * kendi sohbet kimliğinizi koyun, gruba gitmesin. Hata fırlatmaz, sonucu döner.
 */
export async function telegramGonder(
  html: string,
  { sessiz = false, onizleme = false }: { sessiz?: boolean; onizleme?: boolean } = {},
): Promise<TelegramSonucu> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === 'your_telegram_bot_token') {
    console.info('[Telegram] Bot ayarlı değil, gönderim atlandı.');
    return { ok: false, atlandi: true, hata: 'Telegram bot bilgileri ayarlanmamış' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: !onizleme },
        disable_notification: sessiz,
      }),
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('[Telegram] Mesaj gönderilemedi:', data?.description ?? response.status);
      return { ok: false, hata: data?.description || 'Telegram API hatası' };
    }
    return { ok: true, mesajId: String(data.result?.message_id) };
  } catch (err: unknown) {
    const hata = err instanceof Error ? err.message : 'Bilinmeyen bağlantı hatası';
    console.error('[Telegram] İstek hatası:', hata);
    return { ok: false, hata };
  }
}

/** Telegram HTML kipi için kaçış: metin ve öznitelik değerleri. */
export function htmlKacis(metin: string): string {
  return metin.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface SendTelegramNotificationParams {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  authorName: string;
  authorTitle?: string;
  linkUrl?: string;
}

export async function sendTelegramNotification({
  title,
  content,
  priority,
  authorName,
  authorTitle = 'Araştırmacı',
  linkUrl,
}: SendTelegramNotificationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Yalnızca Acil ve Toplantı için bildirimli gönderim (PDF kuralı: diğerleri sessiz veya portalda kalır)
  const isUrgentOrMeeting = priority === 'acil' || priority === 'toplanti';
  const disableNotification = !isUrgentOrMeeting;

  // Başlık emojileri ve formatlama
  const badgeMap: Record<AnnouncementPriority, string> = {
    acil: '🚨 <b>[HYMF ACİL DUYURU]</b>',
    toplanti: '📅 <b>[HYMF TOPLANTI BİLDİRİMİ]</b>',
    soru_yardim: '💬 <b>[HYMF SORU / YARDIM]</b>',
    kaynak_paylasimi: '📚 <b>[HYMF YENİ KAYNAK]</b>',
  };

  const badge = badgeMap[priority] || '📢 <b>[HYMF DUYURU]</b>';
  const destinationUrl = linkUrl || `${CANLI_ADRES}/duyurular`;

  const htmlMessage = `
${badge}

<b>${htmlKacis(title)}</b>

${htmlKacis(content)}

━━━━━━━━━━━━━━━━━━━━
👤 <b>Ekleyen:</b> ${htmlKacis(authorName)} (${htmlKacis(authorTitle)})
🔗 <a href="${htmlKacis(destinationUrl)}">HYMF Portalında Görüntüle</a>
`.trim();

  const sonuc = await telegramGonder(htmlMessage, { sessiz: disableNotification, onizleme: true });
  return { success: sonuc.ok, messageId: sonuc.mesajId, error: sonuc.hata };
}
