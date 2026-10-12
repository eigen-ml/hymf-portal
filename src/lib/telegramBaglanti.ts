import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

// Profil'deki "Telegram'ı bağla" bağlantısı: t.me/<bot>?start=<kod>. Kod, kullanıcı kimliği + zaman +
// imzadır (Telegram start parametresi en çok 64 karakter, [A-Za-z0-9_-]). Bot webhook'u kodu çözer
// ve o kişinin sohbet kimliğini kaydeder. Tablo gerekmez; kod 1 gün geçerli.

const GECERLILIK_SN = 24 * 60 * 60;
const IMZA_UZUNLUK = 20;

function anahtar(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET || null;
}

function imza(veri: string, gizli: string): string {
  return createHmac('sha256', gizli).update(veri).digest('base64url').slice(0, IMZA_UZUNLUK);
}

export function baglantiKodu(userId: string): string | null {
  const gizli = anahtar();
  if (!gizli) return null;
  const veri = userId.replace(/-/g, '') + Math.floor(Date.now() / 1000).toString(36);
  return veri + imza(veri, gizli);
}

/** Geçerliyse kullanıcı kimliğini (uuid) döner. */
export function baglantiKodunuCoz(kod: string): string | null {
  const gizli = anahtar();
  if (!gizli || !/^[0-9a-f]{32}[0-9a-z]{1,8}[A-Za-z0-9_-]{20}$/.test(kod)) return null;
  const veri = kod.slice(0, -IMZA_UZUNLUK);
  const beklenen = Buffer.from(imza(veri, gizli));
  const gelen = Buffer.from(kod.slice(-IMZA_UZUNLUK));
  if (beklenen.length !== gelen.length || !timingSafeEqual(beklenen, gelen)) return null;

  const zaman = parseInt(veri.slice(32), 36);
  if (!Number.isFinite(zaman) || Date.now() / 1000 - zaman > GECERLILIK_SN) return null;

  const h = veri.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function botBaglantisi(kod: string): string | null {
  const bot = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '');
  return bot ? `https://t.me/${bot}?start=${kod}` : null;
}
