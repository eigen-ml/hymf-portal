// Enum değerlerinin ekranda görünen Türkçe karşılıkları ve işlem geçmişi cümleleri.

import type {
  GuncellemeTuru,
  Kadro,
  Oncelik,
  PlanDurum,
  UyelikLog,
  WorkspaceLog,
  Yetki,
} from '@/types/database';

export const KADRO_ETIKETI: Record<Kadro, string> = {
  hoca: 'Öğretim üyesi',
  doktora: 'Doktora',
  yuksek_lisans: 'Yüksek lisans',
  lisans: 'Lisans',
  gelistirici: 'Geliştirici',
};

/** Tablo ve filtrelerde kullanılan kısa biçim. */
export const KADRO_KISA: Record<Kadro, string> = {
  hoca: 'Öğretim üyesi',
  doktora: 'DR',
  yuksek_lisans: 'YL',
  lisans: 'Lisans',
  gelistirici: 'Geliştirici',
};

export const YETKI_ETIKETI: Record<Yetki, string> = {
  superadmin: 'Sistem yöneticisi',
  admin: 'Yönetici',
  uye: 'Üye',
};

export const DURUM_ETIKETI: Record<PlanDurum, string> = {
  planlandi: 'Planlandı',
  devam_ediyor: 'Devam ediyor',
  takildi: 'Takıldı',
  incelemede: 'İncelemede',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
};

export const ONCELIK_ETIKETI: Record<Oncelik, string> = {
  1: 'Yüksek',
  2: 'Normal',
  3: 'Düşük',
};

export const GUNCELLEME_TURU_ETIKETI: Record<GuncellemeTuru, string> = {
  ilerleme: 'İlerleme notu',
  geri_bildirim: 'Geri bildirim',
};

/** Kolon adlarının yalın Türkçe karşılığı (işlem geçmişinde listelenir). */
export const ALAN_ETIKETI: Record<string, string> = {
  thesis_title: 'tez başlığı',
  summary: 'özet',
  drive_url: 'Drive bağlantısı',
  simulation_notes: 'simülasyon notları',
  title: 'başlık',
  description: 'açıklama',
  due_date: 'son tarih',
  priority: 'öncelik',
  truba_ref: 'TRUBA bilgisi',
  status: 'durum',
};

function alanlar(liste?: string[]): string {
  return (liste ?? []).map((a) => ALAN_ETIKETI[a] ?? a).join(', ');
}

function durum(deger?: string): string {
  return deger && deger in DURUM_ETIKETI ? DURUM_ETIKETI[deger as PlanDurum] : (deger ?? '');
}

/** Çalışma alanı işlem geçmişi cümlesi. Yapan kişinin adı ayrıca gösterilir, cümleye girmez. */
export function workspaceLogMetni(log: Pick<WorkspaceLog, 'action' | 'details'>): string {
  const d = log.details ?? {};
  const baslik = d.baslik ? `“${d.baslik}”` : 'bir';
  switch (log.action) {
    case 'plan_eklendi':
      return `${baslik} maddesini ekledi`;
    case 'plan_guncellendi':
      return d.alanlar?.length ? `${baslik} maddesini düzenledi: ${alanlar(d.alanlar)}` : `${baslik} maddesini düzenledi`;
    case 'plan_durum':
      return `${baslik} maddesini “${durum(d.yeni)}” olarak işaretledi`;
    case 'plan_silindi':
      return `${baslik} maddesini sildi`;
    case 'ilerleme_eklendi':
      return 'ilerleme notu yazdı';
    case 'geri_bildirim_eklendi':
      return 'geri bildirim yazdı';
    case 'not_guncellendi':
      return 'bir notu düzenledi';
    case 'not_silindi':
      return 'bir notu sildi';
    case 'dosya_yuklendi':
      return d.dosya ? `“${d.dosya}” dosyasını yükledi` : 'dosya yükledi';
    case 'dosya_silindi':
      return d.dosya ? `“${d.dosya}” dosyasını sildi` : 'dosya sildi';
    case 'alan_guncellendi':
      return d.alanlar?.length ? `tez bilgilerini güncelledi: ${alanlar(d.alanlar)}` : 'tez bilgilerini güncelledi';
    default:
      return 'bir işlem yaptı';
  }
}

function kadroAdi(deger: unknown): string {
  return typeof deger === 'string' && deger in KADRO_ETIKETI ? KADRO_ETIKETI[deger as Kadro] : 'belirsiz';
}

function yetkiAdi(deger: unknown): string {
  return typeof deger === 'string' && deger in YETKI_ETIKETI ? YETKI_ETIKETI[deger as Yetki] : 'belirsiz';
}

/** Üyelik işlem geçmişi cümlesi. */
export function uyelikLogMetni(log: Pick<UyelikLog, 'action' | 'details' | 'target_email'>): string {
  const d = log.details ?? {};
  const hedef = d.hedef_ad ?? log.target_email ?? 'Silinmiş üye';
  switch (log.action) {
    case 'kayit':
      return `${hedef} kayıt oldu`;
    case 'onay':
      return `${hedef} onaylandı`;
    case 'onay_kaldirildi':
      return `${hedef} hesabının onayı kaldırıldı`;
    case 'kadro':
      return `${hedef}: kadro ${kadroAdi(d.eski)} → ${kadroAdi(d.yeni)}`;
    case 'yetki':
      return `${hedef}: yetki ${yetkiAdi(d.eski)} → ${yetkiAdi(d.yeni)}`;
    case 'aktiflik':
      return d.yeni ? `${hedef} yeniden etkinleştirildi` : `${hedef} pasifleştirildi`;
    case 'danisman_eklendi':
      return `${hedef} için danışman eklendi: ${d.danisman_ad ?? 'silinmiş üye'}`;
    case 'danisman_kaldirildi':
      return `${hedef} için danışman çıkarıldı: ${d.danisman_ad ?? 'silinmiş üye'}`;
    case 'danisman_birincil':
      return `${hedef} için birincil danışman değişti: ${d.danisman_ad ?? 'silinmiş üye'}`;
    case 'davet_eklendi':
      return `${log.target_email} davet listesine eklendi: ${kadroAdi(d.kadro)}, ${yetkiAdi(d.yetki)}`;
    case 'davet_guncellendi':
      return `${log.target_email} daveti güncellendi: ${kadroAdi(d.kadro)}, ${yetkiAdi(d.yetki)}`;
    case 'davet_silindi':
      return `${log.target_email} davet listesinden çıkarıldı`;
    case 'sifre_sifirlandi':
      return `${hedef} için şifre sıfırlandı`;
    default:
      return 'Üyelik işlemi';
  }
}

/** "Prof. Dr. Yeşim Moğulkoç" → "Y. Moğulkoç" (unvanlar ve noktalı kısaltmalar atlanır) */
export function kisaAd(fullName: string): string {
  const parcalar = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !p.endsWith('.') && p.toLocaleLowerCase('tr') !== 'üyesi');
  if (parcalar.length < 2) return parcalar[0] ?? fullName.trim();
  const soyad = parcalar[parcalar.length - 1];
  return `${parcalar[0].charAt(0)}. ${soyad}`;
}

/** "Ata Berk Öztürk" → "AÖ" (unvanlar ve noktalı kısaltmalar atlanır) */
export function basHarfler(fullName: string): string {
  const parcalar = fullName
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !p.endsWith('.'));
  if (parcalar.length === 0) return '?';
  const ilk = parcalar[0].charAt(0);
  const son = parcalar.length > 1 ? parcalar[parcalar.length - 1].charAt(0) : '';
  return (ilk + son).toLocaleUpperCase('tr-TR');
}
