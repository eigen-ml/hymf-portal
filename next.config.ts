import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kılavuz dosyaları public/ dışında durur (yalnız üyeler indirir); sunucu fonksiyonuna eklenmeleri gerekir.
  outputFileTracingIncludes: {
    '/kilavuzlar/dosya/*': ['./icerik/kilavuzlar/*'],
  },
};

export default nextConfig;
