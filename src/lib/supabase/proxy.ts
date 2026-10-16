import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { GECICI_OTURUM_CEREZI, oturumSecenekleri } from './hatirla';
import { CANLI_ADRES } from '@/lib/site';

// Girişsiz ziyaretçi yalnız ana sayfayı, giriş sayfasını ve e-posta bağlantısı dönüşünü görür;
// geri kalan her yol girişe yönlendirilir. Takvim akışı oturumsuz çağrılır, kendi anahtarını
// veritabanında doğrular. Telegram webhook'u kendi gizli başlığını doğrular.
const ACIK_YOLLAR = ['/giris', '/auth', '/takvim-akisi', '/api/telegram'];
// Şifre değiştirmesi gereken kişinin girebildiği yollar (ana sayfa dahil geri kalan her şey kapalı).
const SIFRE_SAYFASI_YOLLARI = ['/sifre-yenile', '/auth', '/takvim-akisi'];

// Aynı site iki adresten açılıyor; tarayıcı oturum çerezini adrese göre ayrı tuttuğu için kısa
// adresten gelen kişi "Beni hatırla"ya rağmen yeniden giriş görüyordu. Tek adrese toplanır.
const IKINCI_ADRES = 'hymf.vercel.app';

export async function updateSession(request: NextRequest) {
  const yontem = request.method;
  if (request.headers.get('host') === IKINCI_ADRES && (yontem === 'GET' || yontem === 'HEAD')) {
    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, CANLI_ADRES);
    return NextResponse.redirect(url, 308);
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Eğer Supabase yapılandırılmamışsa, hiçbir şey yapma
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        const gecici = request.cookies.has(GECICI_OTURUM_CEREZI);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, oturumSecenekleri(options, gecici))
        );
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // createServerClient ile getClaims arasında başka kod yok
  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const korumali = path !== '/' && !ACIK_YOLLAR.some((p) => path === p || path.startsWith(p + '/'));

  // Yöneticinin verdiği geçici şifreyle giren kişi, kendi şifresini belirleyene kadar yalnız şifre
  // sayfasını görür (bayrak app_metadata'da, kullanıcı değiştiremez; bkz. src/lib/auth/dal.ts).
  const meta = data?.claims?.app_metadata as Record<string, unknown> | undefined;
  const sifreSayfasinda = SIFRE_SAYFASI_YOLLARI.some((p) => path === p || path.startsWith(p + '/'));
  if (data?.claims?.sub && meta?.sifre_degistir === true && !sifreSayfasinda) {
    const url = request.nextUrl.clone();
    url.pathname = '/sifre-yenile';
    url.search = '';
    const yonlendir = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => yonlendir.cookies.set(c));
    return yonlendir;
  }

  if (!data?.claims?.sub && korumali) {
    const url = request.nextUrl.clone();
    url.pathname = '/giris';
    url.search = '';
    url.searchParams.set('next', path);
    const yonlendir = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => yonlendir.cookies.set(c));
    return yonlendir;
  }

  return response;
}
