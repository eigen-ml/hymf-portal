// Sonuç türü ve hata eşlemesi. Tüm veri katmanı fonksiyonları bu tipte döner, throw etmez.

export type Sonuc<T> = { data: T; error: null } | { data: null; error: string };

export function ok<T>(data: T): Sonuc<T> {
  return { data, error: null };
}

/** Kullanıcıya gösterilecek hazır bir mesajla başarısız sonuç. */
export function basarisiz(mesaj: string): Sonuc<never> {
  return { data: null, error: mesaj };
}

/** Supabase / Storage / JS hatasını Türkçe mesaja çevirir, ayrıntıyı konsola yazar. */
export function hata(e: unknown): Sonuc<never> {
  console.error('Veri katmanı hatası:', e);
  return { data: null, error: hataMesaji(e) };
}

export const YETKI_YOK = 'Bu işlem için yetkiniz yok.';
export const BULUNAMADI_VEYA_YETKI_YOK = 'Kayıt bulunamadı ya da bu işlem için yetkiniz yok.';
export const BOYUT_HATASI = "Dosya 10 MB'tan büyük. Büyük dosyaları kendi Drive klasörüne koy, bağlantısını Drive'ım sayfasına yaz.";
export const TUR_HATASI = 'Bu dosya türü yüklenemiyor. PDF, PNG, JPEG, CSV, TXT, DOCX veya XLSX yükleyin.';
const GENEL = 'Beklenmeyen bir hata oluştu.';

function alan(e: object, ad: string): unknown {
  return (e as Record<string, unknown>)[ad];
}

function hataMesaji(e: unknown): string {
  if (typeof e !== 'object' || e === null) return GENEL;

  // PostgREST hataları sorgu sonucunda düz nesne olarak gelir: { message, code, details, hint }.
  const code = alan(e, 'code');
  const message = typeof alan(e, 'message') === 'string' ? (alan(e, 'message') as string) : '';
  const status = alan(e, 'statusCode') ?? alan(e, 'status');

  if (typeof code === 'string' && code.length > 0) {
    if (code === '42501' || message.includes('row-level security')) return YETKI_YOK;
    // Trigger'ların raise exception mesajları Türkçe ve kullanıcıya gösterilebilir.
    if (code === 'P0001') return message || GENEL;
    if (code === '23505') return 'Bu kayıt zaten var.';
    if (code === '23514') return 'Girilen değer kurallara uymuyor.';
    if (code === '23503') return 'İlgili kayıt bulunamadı.';
    // .single() hiç satır bulamadığında (RLS satırı gizlediğinde de).
    if (code === 'PGRST116') return BULUNAMADI_VEYA_YETKI_YOK;
  }

  // Storage hataları.
  if (String(status) === '413' || /payload too large|exceeded the maximum allowed size/i.test(message)) {
    return BOYUT_HATASI;
  }
  if (/mime/i.test(message)) return TUR_HATASI;
  if (message.includes('row-level security') || String(status) === '403') return YETKI_YOK;

  return GENEL;
}
