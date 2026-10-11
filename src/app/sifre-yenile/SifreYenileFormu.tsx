'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sifreyiDegistir } from './actions';
import { Button } from '@/components/ui/Button';
import { Uyari } from '@/components/ui/Uyari';
import { Alan, SifreInput } from '@/components/ui';

export function SifreYenileFormu({ zorunlu = false }: { zorunlu?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 8) {
      setErrorMessage('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Şifreler birbiriyle uyuşmamaktadır.');
      return;
    }

    setIsLoading(true);
    const sonuc = await sifreyiDegistir(password);
    setIsLoading(false);

    if (!sonuc.ok) {
      setErrorMessage(sonuc.error);
      return;
    }

    setPassword('');
    setConfirmPassword('');
    if (zorunlu) {
      // Geçici şifre engeli kalktı; ana sayfaya geç (sunucu bileşenleri yeni oturumla yüklensin).
      router.replace('/');
      router.refresh();
      return;
    }
    setSuccessMessage('Şifreniz güncellendi.');
  };

  return (
    <div className="space-y-6">
      {errorMessage && <Uyari tone="tehlike">{errorMessage}</Uyari>}
      {successMessage && (
        <div className="space-y-4">
          <Uyari tone="basari">{successMessage}</Uyari>
          <Link href="/" className="block text-sm font-medium text-link hover:underline">
            Ana sayfaya dön
          </Link>
        </div>
      )}

      {!successMessage && (
        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <Alan etiket="Yeni şifre (en az 8 karakter)" htmlFor="password">
            <SifreInput
              id="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Alan>

          <Alan etiket="Yeni şifre (tekrar)" htmlFor="confirmPassword">
            <SifreInput
              id="confirmPassword"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Alan>

          <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
            {isLoading ? 'Kaydediliyor…' : 'Şifreyi kaydet'}
          </Button>
        </form>
      )}
    </div>
  );
}
