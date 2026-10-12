import { Download } from 'lucide-react';
import { requireMember } from '@/lib/auth/dal';
import { FORM_GRUPLARI, FORM_KAYNAK_URL } from '@/lib/formlar';
import { Panel, SayfaBasligi } from '@/components/ui';

export default async function Page() {
  await requireMember();

  return (
    <div className="space-y-10">
      <SayfaBasligi
        baslik="Resmi formlar ve belgeler"
        aciklama="Ankara Üniversitesi Fen Bilimleri Enstitüsü formları. Ada tıklayınca dosya iner."
      />

      {FORM_GRUPLARI.map((grup) => (
        <Panel key={grup.baslik} baslik={grup.baslik} govdeSinifi="p-0">
          <ul className="divide-y divide-line">
            {grup.formlar.map((form) => (
              <li key={form.url}>
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener"
                  download
                  className="group flex items-center gap-4 px-5 py-3.5 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-base font-medium text-ink group-hover:text-link">
                      {form.ad}
                    </span>
                    {form.kod && (
                      <span className="ml-2 font-mono text-xs text-ink-3">{form.kod}</span>
                    )}
                  </div>
                  <span className="shrink-0 rounded bg-sunken px-2 py-0.5 font-mono text-xs text-ink-2">
                    {form.tur}
                  </span>
                  <Download className="size-4 shrink-0 text-link" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      <p className="text-sm text-ink-3">
        Kaynak:{' '}
        <a href={FORM_KAYNAK_URL} target="_blank" rel="noopener" className="text-link hover:opacity-80">
          fenbilimleri.ankara.edu.tr/formlar
        </a>
      </p>
    </div>
  );
}
