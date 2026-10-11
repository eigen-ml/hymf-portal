import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { GECICI_OTURUM_CEREZI, oturumSecenekleri } from './hatirla';

// Girişsiz ziyaretçi yalnız ana sayfayı, giriş sayfasını ve e-posta bağlantısı dönüşünü görür;
// geri kalan her yol girişe yönlendirilir. Takvim akışı oturumsuz çağrılır, kendi anahtarını
// veritabanında doğrular.
const ACIK_YOLLAR = ['/giris', '/auth', '/takvim-akisi'];

export async function updateSession(request: NextRequest) {
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
