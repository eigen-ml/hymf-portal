'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { useDoldur } from './KodDegiskenleri';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code: hamKod, language = 'bash', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  // Yer tutucular (ör. kullanici_adiniz) sayfada girilen değerle dolar; kopyalanan da dolmuş hâlidir.
  const code = useDoldur()(hamKod);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border border-line bg-sunken text-ink overflow-hidden my-3 font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-sunken border-b border-line text-xs text-ink-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-ink-3" />
          <span className="font-semibold text-ink-2">{title || `${language.toUpperCase()} betiği`}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sunken hover:bg-sunken/80 text-ink-2 hover:text-ink transition-colors text-xs font-sans font-medium cursor-pointer border border-line"
          title="Kodu kopyala"
          aria-label="Kodu kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-ok" />
              <span className="text-ok">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm leading-relaxed text-ink selection:bg-sunken">
        <pre>{code}</pre>
      </div>
    </div>
  );
}
