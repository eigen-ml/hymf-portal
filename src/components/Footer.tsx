import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getMevcutProfil } from '@/lib/auth/dal';
import { isMember } from '@/lib/yetki';
import { MarkaIsareti } from '@/components/ui';

const grupBaglantilari = [
  { href: '/kilavuzlar', etiket: 'TRUBA ve VASP kılavuzları' },
  { href: '/formlar', etiket: 'Enstitü formları' },
  { href: '/kaynaklar', etiket: 'Kaynaklar' },
  { href: '/dersler', etiket: 'Dersler' },
];

const disBaglantilar = [
  { href: 'https://hymf.ankara.edu.tr', etiket: 'HYMF web sitesi' },
  { href: 'https://fenbilimleri.ankara.edu.tr', etiket: 'Fen Bilimleri Enstitüsü' },
  { href: 'https://truba.gov.tr', etiket: 'TRUBA' },
];

export async function Footer() {
  // Grup sayfaları yalnız üyelere açık; girişsiz ziyaretçiye bağlantıları gösterilmez.
  const uye = isMember(await getMevcutProfil());

  return (
    <footer className="mt-16 border-t border-line bg-surface text-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="flex items-center gap-2.5 font-serif text-lg text-ink">
            <MarkaIsareti className="size-8" />
            HYMF Portal
          </p>
          <p className="mt-3 max-w-xs leading-6 text-ink-2">
            Ankara Üniversitesi Hesaplamalı Yoğun Madde Fiziği araştırma grubunun iç portalı.
          </p>
        </div>

        {uye && (
          <nav aria-labelledby="footer-grup">
            <h2 id="footer-grup" className="font-bold text-ink">
              Grup
            </h2>
            <ul className="mt-3 space-y-2">
              {grupBaglantilari.map((b) => (
                <li key={b.href}>
                  <Link href={b.href} className="text-ink-2 hover:text-accent-ink hover:underline">
                    {b.etiket}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-labelledby="footer-dis">
          <h2 id="footer-dis" className="font-bold text-ink">
            Bağlantılar
          </h2>
          <ul className="mt-3 space-y-2">
            {disBaglantilar.map((b) => (
              <li key={b.href}>
                <a
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent-ink hover:underline"
                >
                  {b.etiket}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(yeni sekmede açılır)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-ink-3 sm:px-6">
          © {new Date().getFullYear()} HYMF Araştırma Grubu, Ankara Üniversitesi
        </p>
      </div>
    </footer>
  );
}
