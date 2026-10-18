import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getMevcutProfil } from '@/lib/auth/dal';
import { isMember } from '@/lib/yetki';
import { GrupLogosu } from '@/components/ui';

const grupBaglantilari = [
  { href: '/kilavuzlar', etiket: 'Kurulum ve Kılavuzlar' },
  { href: '/formlar', etiket: 'Enstitü formları' },
  { href: '/kaynaklar', etiket: 'Kaynaklar' },
  { href: '/dersler', etiket: 'Dersler' },
];

const disBaglantilar = [
  { href: 'https://hymf.ankara.edu.tr', etiket: 'HYMF web sitesi' },
  { href: 'https://fenbilimleri.ankara.edu.tr', etiket: 'Fen Bilimleri Enstitüsü' },
  { href: 'https://truba.gov.tr', etiket: 'TRUBA' },
  { href: 'https://vasp.at/wiki/Welcome', etiket: 'VASP Wiki' },
  { href: 'https://next-gen.materialsproject.org/', etiket: 'Materials Project' },
];

const programlar = [
  { href: 'https://jp-minerals.org/vesta/en/', etiket: 'VESTA' },
  { href: 'https://www.chemcraftprog.com/', etiket: 'Chemcraft' },
  { href: 'https://www.originlab.com/origin', etiket: 'Origin' },
  { href: 'https://winscp.net/eng/index.php', etiket: 'WinSCP' },
];

function DisBaglanti({ href, etiket }: { href: string; etiket: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent-ink hover:underline"
    >
      {etiket}
      <ExternalLink className="size-3.5" aria-hidden="true" />
      <span className="sr-only">(yeni sekmede açılır)</span>
    </a>
  );
}

export async function Footer() {
  // Grup sayfaları yalnız üyelere açık; girişsiz ziyaretçiye bağlantıları gösterilmez.
  const uye = isMember(await getMevcutProfil());

  return (
    <footer className="mt-16 border-t border-line bg-surface text-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2.5 font-serif text-lg text-ink">
            <GrupLogosu genislik={44} />
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
                <DisBaglanti {...b} />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-program">
          <h2 id="footer-program" className="font-bold text-ink">
            Programlar
          </h2>
          <ul className="mt-3 space-y-2">
            {programlar.map((b) => (
              <li key={b.href}>
                <DisBaglanti {...b} />
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
