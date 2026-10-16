'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { epostaHatirla, hatirlamaTercihiniYaz, hatirlananEposta } from '@/lib/supabase/hatirla';
import { DEMO_MODU } from '@/lib/demo';
import { INITIAL_PROFILES } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Uyari } from '@/components/ui/Uyari';
import { Alan, inputSinifi, SifreInput } from '@/components/ui';

interface GirisFormuProps {
  next: string;
  hataParam: string | null;
}

// Kayıtlı e-posta sayfa açıkken değişmez; abonelik gerekmez.
const aboneOlma = () => () => {};

export function GirisFormu({ next, hataParam }: GirisFormuProps) {
  const router = useRouter();
  const { loginAs } = useAuth();

  // Kişi yazana kadar kutuda "Beni hatırla" ile kaydedilmiş son e-posta durur (yalnız tarayıcıda okunur).
  const [yazilanEposta, setEmail] = useState<string | null>(null);
  const kayitliEposta = useSyncExternalStore(aboneOlma, hatirlananEposta, () => '');
  const email = yazilanEposta ?? kayitliEposta;
  const [password, setPassword] = useState('');
  const [beniHatirla, setBeniHatirla] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(hataParam);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasValidSupabase = supabaseUrl && !supabaseUrl.includes('placeholder') && !supabaseUrl.includes('your-project');

    if (hasValidSupabase) {
      try {
        hatirlamaTercihiniYaz(beniHatirla);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            setErrorMessage('E-posta veya şifre hatalı.');
          } else if (error.message === 'Email not confirmed') {
            setErrorMessage('E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzdaki bağlantıyı açın.');
          } else {
            setErrorMessage('Giriş yapılamadı. Biraz sonra tekrar deneyin.');
          }
          setIsLoading(false);
          return;
        }

        epostaHatirla(beniHatirla ? email.trim() : null);
        router.replace(next);
        router.refresh();
        return;
      } catch (err) {
        console.error('Login error:', err);
        setErrorMessage('Giriş yapılamadı. Biraz sonra tekrar deneyin.');
        setIsLoading(false);
        return;
      }
    }

    // Demo modu: mock e-posta eşleşmesi
    if (DEMO_MODU) {
      const matched = INITIAL_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        loginAs(matched.id);
        router.replace(next);
        router.refresh();
        setIsLoading(false);
        return;
      }
    }

    setErrorMessage('E-posta veya şifre hatalı.');
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {errorMessage && <Uyari tone="tehlike">{errorMessage}</Uyari>}

      <form onSubmit={handleLogin} className="space-y-5">
        <Alan etiket="E-posta adresi" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="ad.soyad@ankara.edu.tr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputSinifi}
          />
        </Alan>

        <Alan etiket="Şifre" htmlFor="password">
          <SifreInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Alan>

        <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={beniHatirla}
            onChange={(e) => setBeniHatirla(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-primary"
          />
          Beni hatırla
        </label>

        <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
          {isLoading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
      </form>

      <div className="text-sm text-ink-2">
        Hesabınız yok ya da şifrenizi mi unuttunuz? Grup yöneticisine yazın: hesapları yöneticiler açar,
        şifreyi de onlar sıfırlar.
      </div>

      {DEMO_MODU && (
        <div className="mt-8 pt-6 border-t border-line space-y-3">
          <p className="text-sm font-medium text-ink-2">Örnek hesaplar (demo)</p>
          <div className="grid grid-cols-1 gap-2">
            {INITIAL_PROFILES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  loginAs(p.id);
                  router.replace(next);
                  router.refresh();
                }}
                className="p-3 rounded-md bg-sunken hover:bg-sunken/80 text-left text-sm transition border border-line"
              >
                <div className="font-medium text-ink">{p.full_name}</div>
                <div className="text-ink-3">{p.email}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
