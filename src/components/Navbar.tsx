'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_PROFILES } from '@/lib/mockData';
import { DEMO_MODU } from '@/lib/demo';
import { isMember } from '@/lib/yetki';
import { KADRO_ETIKETI } from '@/lib/etiketler';
import { cn } from '@/lib/cn';
import { BasHarfAvatar, MarkaIsareti, YetkiRozeti, buttonClass } from '@/components/ui';
import { useAcilir } from '@/components/ui/useAcilir';
import { TemaSecici } from '@/components/TemaSecici';

type Baglanti = { href: string; etiket: string };

// Günlük işler doğrudan çubukta; seyrek bakılanlar "Diğer" altında.
const anaBaglantilar: Baglanti[] = [
  { href: '/', etiket: 'Pano' },
  { href: '/takvim', etiket: 'Takvim' },
  { href: '/gorevler', etiket: 'Görevler' },
  { href: '/duyurular', etiket: 'Duyurular' },
  { href: '/toplantilar', etiket: 'Toplantılar' },
];

const digerBaglantilar: Baglanti[] = [
  { href: '/kilavuzlar', etiket: 'Kılavuzlar' },
  { href: '/formlar', etiket: 'Formlar' },
  { href: '/kaynaklar', etiket: 'Kaynaklar' },
  { href: '/dersler', etiket: 'Dersler' },
  { href: '/uyeler', etiket: 'Üyeler' },
];

// Hoca "çok uğraşamam" dedi: menüde yalnız bunlar. Diğer sayfalar adresle yine açılır.
const hocaBaglantilari: Baglanti[] = [
  { href: '/', etiket: 'Pano' },
  { href: '/takvim', etiket: 'Takvim' },
  { href: '/gorevler', etiket: 'Görevler' },
  { href: '/kilavuzlar', etiket: 'Kılavuzlar' },
];

function aktifMi(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

/** Üst çubuktaki bağlantı ve düğmelerin ortak görünümü. */
const cubukSinifi = (aktif: boolean) =>
  cn(
    'flex h-10 items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-sm transition-colors xl:px-3',
    aktif ? 'bg-accent-soft font-semibold text-accent-ink' : 'font-medium text-ink-2 hover:bg-sunken hover:text-ink'
  );

/** Mobil menüdeki büyük dokunma hedefleri. */
const satirSinifi = (aktif: boolean) =>
  cn(
    'flex min-h-12 items-center rounded-xl px-4 text-base transition-colors',
    aktif ? 'bg-accent-soft font-semibold text-accent-ink' : 'font-medium text-ink hover:bg-sunken'
  );

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, isAdmin, isHoca, loginAs, logout } = useAuth();
  const [mobilAcik, setMobilAcik] = useState(false);
  const { acik: kullaniciAcik, setAcik: setKullaniciAcik, kap: kullaniciKap } = useAcilir();
  const { acik: digerAcik, setAcik: setDigerAcik, kap: digerKap } = useAcilir();
  const { acik: demoAcik, setAcik: setDemoAcik, kap: demoKap } = useAcilir();

  // Sayfa değişince menüler kapanır (render sırasında, önceki yolla karşılaştırarak).
  const [oncekiYol, setOncekiYol] = useState(pathname);
  if (pathname !== oncekiYol) {
    setOncekiYol(pathname);
    setMobilAcik(false);
    setKullaniciAcik(false);
    setDigerAcik(false);
  }

  // Mobil menü Escape ile de kapanır.
  useEffect(() => {
    if (!mobilAcik) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobilAcik(false);
    };
    document.addEventListener('keydown', tus);
    return () => document.removeEventListener('keydown', tus);
  }, [mobilAcik]);

  const uye = isMember(profile);
  // Girişsiz ziyaretçi yalnız ana sayfayı (marka bağlantısı) ve giriş düğmesini görür.
  const ana = uye ? (isHoca ? hocaBaglantilari : anaBaglantilar) : [];
  const diger = uye && !isHoca ? digerBaglantilar : [];
  const ozel: Baglanti[] = uye
    ? [
        { href: '/calisma-alani', etiket: isHoca ? 'Öğrencilerim' : 'Çalışma alanım' },
        ...(isHoca ? [] : [{ href: '/drive', etiket: "Drive'ım" }]),
        ...(isAdmin ? [{ href: '/yonetim', etiket: 'Yönetim' }] : []),
      ]
    : [];
  const digerAktif = diger.some((b) => aktifMi(pathname, b.href));

  async function cikis() {
    setKullaniciAcik(false);
    setMobilAcik(false);
    await logout();
    router.replace('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface shadow-panel">
      {DEMO_MODU && (
        <div className="border-b border-warn/20 bg-warn-soft text-sm text-warn">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <span>Demo modu açık: bu oturumdaki kişiler ve veriler örnektir.</span>
            <div className="relative" ref={demoKap}>
              <button
                type="button"
                onClick={() => setDemoAcik(!demoAcik)}
                aria-expanded={demoAcik}
                className="font-semibold underline underline-offset-2"
              >
                Örnek kişi seç
              </button>
              {demoAcik && (
                <ul className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-pop">
                  {INITIAL_PROFILES.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          loginAs(p.id);
                          setDemoAcik(false);
                        }}
                        className={cn(
                          'flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-sunken',
                          profile?.id === p.id && 'bg-sunken'
                        )}
                      >
                        <span className="text-sm font-medium">{p.full_name}</span>
                        <span className="text-sm text-ink-3">{p.kadro ? KADRO_ETIKETI[p.kadro] : ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg text-ink" aria-label="HYMF Portal, ana sayfa">
          <MarkaIsareti />
          <span className="font-serif text-xl leading-none">
            HYMF <span className="font-medium text-ink-2">Portal</span>
          </span>
        </Link>

        <nav aria-label="Ana menü" className="hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
          {ana.map((b) => (
            <Link key={b.href} href={b.href} className={cubukSinifi(aktifMi(pathname, b.href))} aria-current={aktifMi(pathname, b.href) ? 'page' : undefined}>
              {b.etiket}
            </Link>
          ))}
          {diger.length > 0 && (
            <div className="relative" ref={digerKap}>
              <button
                type="button"
                onClick={() => setDigerAcik(!digerAcik)}
                aria-expanded={digerAcik}
                aria-haspopup="true"
                className={cubukSinifi(digerAktif || digerAcik)}
              >
                Diğer
                <ChevronDown className={cn('size-4 transition-transform', digerAcik && 'rotate-180')} aria-hidden="true" />
              </button>
              {digerAcik && (
                <ul className="absolute left-0 z-50 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
                  {diger.map((b) => (
                    <li key={b.href}>
                      <Link
                        href={b.href}
                        aria-current={aktifMi(pathname, b.href) ? 'page' : undefined}
                        className={cn(
                          'flex h-11 items-center rounded-lg px-3 text-sm transition-colors',
                          aktifMi(pathname, b.href) ? 'bg-accent-soft font-semibold text-accent-ink' : 'font-medium text-ink hover:bg-sunken'
                        )}
                      >
                        {b.etiket}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          {ozel.length > 0 && (
            <div className="mr-1 hidden items-center gap-0.5 lg:flex">
              {ozel.map((b) => (
                <Link key={b.href} href={b.href} className={cubukSinifi(aktifMi(pathname, b.href))} aria-current={aktifMi(pathname, b.href) ? 'page' : undefined}>
                  {b.etiket}
                </Link>
              ))}
            </div>
          )}

          <TemaSecici className="hidden lg:block" />

          {isLoading ? (
            <span className="size-10" aria-hidden="true" />
          ) : profile ? (
            <div className="relative ml-1" ref={kullaniciKap}>
              <button
                type="button"
                onClick={() => setKullaniciAcik(!kullaniciAcik)}
                aria-expanded={kullaniciAcik}
                aria-haspopup="true"
                aria-label="Hesap menüsü"
                className="block rounded-full transition-opacity hover:opacity-80"
              >
                <BasHarfAvatar ad={profile.full_name} size="md" />
              </button>
              {kullaniciAcik && (
                <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
                  <div className="space-y-1 px-3 py-2.5">
                    <p className="text-base font-bold text-ink">{profile.full_name}</p>
                    <p className="truncate text-sm text-ink-3">{profile.email}</p>
                    <YetkiRozeti yetki={profile.yetki} />
                  </div>
                  <div className="my-1 border-t border-line" />
                  <Link href="/profil" className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-ink hover:bg-sunken">
                    Profilim
                  </Link>
                  <button type="button" onClick={cikis} className="flex h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-ink hover:bg-sunken">
                    Çıkış yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/giris" className={buttonClass({ variant: 'primary', size: 'sm', className: 'ml-1' })}>
              Giriş yap
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobilAcik(!mobilAcik)}
            aria-expanded={mobilAcik}
            aria-controls="mobil-menu"
            aria-label={mobilAcik ? 'Menüyü kapat' : 'Menüyü aç'}
            className="ml-1 inline-flex size-11 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink lg:hidden"
          >
            {mobilAcik ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobilAcik && (
        <>
          <div aria-hidden="true" onClick={() => setMobilAcik(false)} className="absolute inset-x-0 top-full h-dvh bg-black/40 lg:hidden" />
          <nav
            id="mobil-menu"
            aria-label="Ana menü"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-surface shadow-pop lg:hidden"
          >
            <div className="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:px-5">
              {ana.length > 0 && (
                <ul className="space-y-1">
                  {ana.map((b) => (
                    <li key={b.href}>
                      <Link href={b.href} aria-current={aktifMi(pathname, b.href) ? 'page' : undefined} className={satirSinifi(aktifMi(pathname, b.href))}>
                        {b.etiket}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {diger.length > 0 && (
                <div>
                  <p className="px-4 pb-1 text-sm font-semibold text-ink-3">Diğer</p>
                  <ul className="grid grid-cols-2 gap-1">
                    {diger.map((b) => (
                      <li key={b.href}>
                        <Link href={b.href} aria-current={aktifMi(pathname, b.href) ? 'page' : undefined} className={satirSinifi(aktifMi(pathname, b.href))}>
                          {b.etiket}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ozel.length > 0 && (
                <ul className="grid grid-cols-2 gap-1 border-t border-line pt-4">
                  {ozel.map((b) => (
                    <li key={b.href}>
                      <Link href={b.href} aria-current={aktifMi(pathname, b.href) ? 'page' : undefined} className={satirSinifi(aktifMi(pathname, b.href))}>
                        {b.etiket}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-line px-1 pt-4">
                <p className="px-3 pb-2 text-sm font-semibold text-ink-3">Tema</p>
                <TemaSecici varyant="tam" />
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
