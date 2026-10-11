import React from 'react';

/** Henüz Supabase'e bağlanmamış, örnek veriyle çalışan sayfaların üstünde durur. */
export function OrnekVeriNotu() {
  return (
    <p className="rounded-lg border border-line bg-sunken px-3 py-2 text-sm text-ink-2">
      Bu sayfadaki içerik örnek veridir. Gerçek kayıtlar henüz bağlanmadı.
    </p>
  );
}
