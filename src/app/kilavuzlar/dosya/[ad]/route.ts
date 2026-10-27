import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getMevcutProfil } from '@/lib/auth/dal';
import { isMember } from '@/lib/yetki';
import { KILAVUZLAR, TRUBA_DOSYALARI } from '@/lib/kilavuz/liste';

// Kılavuz dosyalarını yalnız onaylı üyelere verir. public/ kullanılmıyor, çünkü oradaki dosyalar
// oturum kontrolüne uğramadan herkese açık sunulur.

export async function GET(request: Request, { params }: { params: Promise<{ ad: string }> }) {
  const { ad } = await params;
  const kayit = [...KILAVUZLAR, ...TRUBA_DOSYALARI].find((k) => k.dosya === ad);
  if (!kayit) return new Response('Bulunamadı', { status: 404 });

  const profil = await getMevcutProfil();
  if (!isMember(profil)) {
    const url = new URL('/giris', request.url);
    url.searchParams.set('next', '/kilavuzlar');
    return Response.redirect(url, 303);
  }

  const icerik = await readFile(path.join(process.cwd(), 'icerik', 'kilavuzlar', kayit.dosya));
  const indir = kayit.tur === 'ovpn' || kayit.tur === 'sunum' || new URL(request.url).searchParams.has('indir');
  const tip =
    kayit.tur === 'pdf'
      ? 'application/pdf'
      : kayit.tur === 'ovpn'
        ? 'application/x-openvpn-profile'
        : kayit.tur === 'sunum'
          ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          : 'text/plain; charset=utf-8';

  return new Response(new Uint8Array(icerik), {
    headers: {
      'Content-Type': tip,
      'Content-Disposition': `${indir ? 'attachment' : 'inline'}; filename="${kayit.dosya}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
