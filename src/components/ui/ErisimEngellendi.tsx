import React from 'react';
import Link from 'next/link';
import { buttonClass } from './Button';

export function ErisimEngellendi({
  baslik = 'Bu sayfayı görüntüleyemezsiniz',
  aciklama = 'Bir çalışma alanını yalnız öğrencinin kendisi ve danışmanları görür.',
  donusHref = '/calisma-alani',
  donusEtiketi = 'Kendi çalışma alanıma dön',
}: {
  baslik?: string;
  aciklama?: string;
  donusHref?: string;
  donusEtiketi?: string;
}) {
  return (
    <div className="max-w-prose py-12">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">{baslik}</h1>
      <p className="mt-3 text-lg text-ink-2">{aciklama}</p>
      <Link href={donusHref} className={buttonClass({ variant: 'secondary', className: 'mt-6' })}>
        {donusEtiketi}
      </Link>
    </div>
  );
}
