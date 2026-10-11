import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kılavuz PDF'leri public/ dışında durur (yalnız üyeler indirir); sunucu fonksiyonuna eklenmeleri gerekir.
  outputFileTracingIncludes: {
    '/kilavuzlar/dosya/*': ['./icerik/kilavuzlar/*.pdf', './icerik/kilavuzlar/*.vasp'],
  },
};

export default nextConfig;
