import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

// Gilroy: gövde 400/500, başlıklar 700 (Bold), nadiren 800 (Heavy).
const gilroy = localFont({
  variable: '--font-gilroy',
  display: 'swap',
  src: [
    { path: './fonts/Gilroy-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Gilroy-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Gilroy-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Gilroy-Heavy.woff2', weight: '800', style: 'normal' },
  ],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: 'HYMF Portal | Ankara Üniversitesi Hesaplamalı Yoğun Madde Fiziği',
  description: 'Ankara Üniversitesi Hesaplamalı Yoğun Madde Fiziği araştırma grubunun iç portalı.',
};

// Tarayıcı çubuğu rengi işletim sistemi temasını izler (elle seçilen tema bunu değiştirmez).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f6fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e15' },
  ],
};

/**
 * Kayıtlı tema seçimini ilk boyamadan önce <html>'e yazar (parlama olmasın).
 * Anahtar ve değerler TemaSecici.tsx ile aynı: 'light' | 'dark'; kayıt yoksa Sistem.
 */
const TEMA_BETIGI = `(function(){try{var t=localStorage.getItem("hymf-tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${gilroy.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_BETIGI }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <a
          href="#icerik"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-on-accent focus:shadow-pop"
        >
          Ana içeriğe geç
        </a>
        <AuthProvider>
          <Navbar />
          <main id="icerik" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
