// Veritabanı tipleri. Kolon adları supabase/migrations/20261009000000_calisma_alani.sql ile aynıdır.
// Sözleşme dosyası: değişiklik docs/PLAN.md üzerinden yapılır.

export type Kadro = 'hoca' | 'doktora' | 'yuksek_lisans' | 'lisans' | 'gelistirici';
export type Yetki = 'superadmin' | 'admin' | 'uye';
export type PlanDurum = 'planlandi' | 'devam_ediyor' | 'takildi' | 'incelemede' | 'tamamlandi' | 'iptal';
export type GuncellemeTuru = 'ilerleme' | 'geri_bildirim';
export type Oncelik = 1 | 2 | 3;

export const KADROLAR: readonly Kadro[] = ['hoca', 'doktora', 'yuksek_lisans', 'lisans', 'gelistirici'];
export const YETKILER: readonly Yetki[] = ['superadmin', 'admin', 'uye'];
export const PLAN_DURUMLARI: readonly PlanDurum[] = [
  'planlandi',
  'devam_ediyor',
  'takildi',
  'incelemede',
  'tamamlandi',
  'iptal',
];
/** Danışman atanabilen kadrolar. */
export const DANISMANLI_KADROLAR: readonly Kadro[] = ['doktora', 'yuksek_lisans', 'lisans', 'gelistirici'];

/** @deprecated kadro ve yetki kullanın. Yalnız eski sayfalar için tutuluyor. */
export type UserRole = 'hoca' | 'yonetici' | 'arastirmaci';

export type AnnouncementPriority = 'acil' | 'toplanti' | 'soru_yardim' | 'kaynak_paylasimi';

export type ResourceCategory = 'kitap_makale' | 'faydali_link' | 'kod_script';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  /** @deprecated kadro ve yetki kullanın. */
  role: UserRole;
  kadro: Kadro | null;
  yetki: Yetki;
  is_active: boolean;
  is_approved: boolean;
  academic_title: string | null;
  department: string | null;
  avatar_url?: string | null;
  research_topics: string[];
  scholar_url?: string | null;
  orcid?: string | null;
  created_at: string;
}

/** Listelerde ve ilişkilerde kullanılan kısa profil. */
export type ProfileSummary = Pick<Profile, 'id' | 'full_name' | 'academic_title' | 'kadro'>;

/** Üyenin kendi profilinde değiştirebildiği alanlar. */
export type ProfileSelfUpdate = Partial<
  Pick<Profile, 'full_name' | 'academic_title' | 'department' | 'research_topics' | 'scholar_url' | 'orcid'>
>;

/** Adminin başka bir üyede değiştirebildiği alanlar (yetki hariç, o setYetki ile). */
export type AdminProfileUpdate = Partial<
  Pick<Profile, 'full_name' | 'academic_title' | 'department' | 'kadro' | 'is_active' | 'is_approved'>
>;

export interface MemberAllowlistEntry {
  email: string;
  full_name: string;
  kadro: Kadro;
  yetki: Yetki;
  created_at: string;
  created_by: string | null;
}

export type AllowlistInput = Pick<MemberAllowlistEntry, 'email' | 'full_name' | 'kadro' | 'yetki'>;

export interface AdvisorAssignment {
  student_id: string;
  advisor_id: string;
  is_primary: boolean;
  created_at: string;
  created_by: string | null;
  student?: ProfileSummary | null;
  advisor?: ProfileSummary | null;
}

export interface PendingAdvisorAssignment {
  student_email: string;
  advisor_email: string;
  is_primary: boolean;
  created_at: string;
  created_by: string | null;
}

export interface StudentWorkspace {
  id: string;
  student_id: string;
  thesis_title: string | null;
  /** @deprecated advisor_assignments kullanın. */
  advisor?: string | null;
  summary: string | null;
  simulation_notes?: string | null;
  drive_url: string | null;
  last_student_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkspaceInfoUpdate = Partial<Pick<StudentWorkspace, 'thesis_title' | 'summary' | 'drive_url'>>;

export interface PlanItem {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  /** YYYY-MM-DD */
  due_date: string | null;
  status: PlanDurum;
  priority: Oncelik;
  sort_order: number;
  truba_ref: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  creator?: ProfileSummary | null;
}

export interface PlanItemInput {
  workspace_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status?: PlanDurum;
  priority?: Oncelik;
  truba_ref?: string | null;
}

export type PlanItemPatch = Partial<
  Pick<PlanItem, 'title' | 'description' | 'due_date' | 'status' | 'priority' | 'truba_ref' | 'sort_order'>
>;

export interface ProgressUpdate {
  id: string;
  workspace_id: string;
  plan_item_id: string | null;
  author_id: string | null;
  tur: GuncellemeTuru;
  body: string;
  created_at: string;
  updated_at: string;
  author?: ProfileSummary | null;
}

/** tur sunucuda yazara göre belirlenir, istemci göndermez. */
export interface ProgressUpdateInput {
  workspace_id: string;
  body: string;
  plan_item_id?: string | null;
}

export interface WorkspaceFile {
  id: string;
  workspace_id: string;
  plan_item_id: string | null;
  file_name: string;
  storage_path: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  /** @deprecated signed URL kullanılır. */
  file_url?: string | null;
  /** @deprecated size_bytes kullanın. */
  file_size?: string | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
  uploader?: ProfileSummary | null;
}

export type WorkspaceLogAction =
  | 'plan_eklendi'
  | 'plan_guncellendi'
  | 'plan_durum'
  | 'plan_silindi'
  | 'ilerleme_eklendi'
  | 'geri_bildirim_eklendi'
  | 'not_guncellendi'
  | 'not_silindi'
  | 'dosya_yuklendi'
  | 'dosya_silindi'
  | 'alan_guncellendi';

export interface WorkspaceLogDetails {
  baslik?: string;
  alanlar?: string[];
  eski?: string;
  yeni?: string;
  ozet?: string;
  dosya?: string;
}

export interface WorkspaceLog {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: WorkspaceLogAction;
  entity_id: string | null;
  details: WorkspaceLogDetails;
  created_at: string;
  actor?: ProfileSummary | null;
}

export type UyelikLogAction =
  | 'kayit'
  | 'onay'
  | 'onay_kaldirildi'
  | 'kadro'
  | 'yetki'
  | 'aktiflik'
  | 'danisman_eklendi'
  | 'danisman_kaldirildi'
  | 'danisman_birincil'
  | 'davet_eklendi'
  | 'davet_guncellendi'
  | 'davet_silindi'
  | 'sifre_sifirlandi';

export interface UyelikLogDetails {
  hedef_ad?: string | null;
  yapan_ad?: string | null;
  eski?: string | boolean | null;
  yeni?: string | boolean | null;
  danisman_id?: string | null;
  danisman_ad?: string | null;
  kadro?: Kadro | null;
  yetki?: Yetki | null;
}

export interface UyelikLog {
  id: string;
  actor_id: string | null;
  target_id: string | null;
  target_email: string | null;
  action: UyelikLogAction;
  details: UyelikLogDetails;
  created_at: string;
}

/** Çalışma alanı sayfasının tek seferde yüklediği veri. */
export interface CalismaAlaniVerisi {
  workspace: StudentWorkspace;
  student: ProfileSummary;
  advisors: ProfileSummary[];
  planItems: PlanItem[];
  updates: ProgressUpdate[];
  files: WorkspaceFile[];
  logs: WorkspaceLog[];
}

/** Danışman panosundaki bir satır. */
export interface PanoSatiri {
  student: ProfileSummary;
  workspace_id: string | null;
  advisors: ProfileSummary[];
  /** Tamamlanmamış ve iptal edilmemiş maddeler (gecikmişler dahil). */
  acik: number;
  gecikmis: number;
  tamamlanan: number;
  /** İptaller hariç toplam. */
  toplam: number;
  /** 0-100, hiç madde yoksa null. */
  ilerleme: number | null;
  /** Öğrencinin kendi son hareketi. */
  son_guncelleme: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  author_id: string;
  telegram_sent: boolean;
  telegram_message_id?: string | null;
  created_at: string;
  author?: Profile;
}

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  category: ResourceCategory;
  file_url?: string | null;
  external_url?: string | null;
  code_snippet?: string | null;
  language: string;
  tags: string[];
  uploader_id: string;
  created_at: string;
  uploader?: Profile;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor_id: string;
  semester: string;
  syllabus?: string | null;
  created_at: string;
  instructor?: Profile;
  materials?: CourseMaterial[];
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  week_number: number;
  title: string;
  description?: string | null;
  file_url: string;
  uploader_id: string;
  created_at: string;
  uploader?: Profile;
}

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  /** Boşsa toplantı 1 saat sayılır (20261013000000_takvim_senkron.sql). */
  ends_at?: string | null;
  location?: string | null;
  notes?: string | null;
  presentation_url?: string | null;
  creator_id: string;
  created_at: string;
  updated_at?: string;
  /** Başlık, saat, yer veya not her değiştiğinde bir artar (ICS SEQUENCE). */
  sequence?: number;
  creator?: Profile;
}

/** Takvim aboneliğini en son çeken uygulama; User-Agent'tan kaba sınıflandırma. */
export type TakvimIstemcisi = 'apple' | 'google' | 'outlook' | 'tarayici' | 'diger';

export interface TakvimBaglantisi {
  sonCekim: string | null;
  sonIstemci: TakvimIstemcisi | null;
}

// Görevler ve takvim: supabase/migrations/20261011000000_gorev_takvim.sql, sözleşme docs/PLAN_TAKVIM.md.

export type GorevDurum = 'acik' | 'teslim_edildi' | 'tamamlandi';
export const GOREV_DURUMLARI: readonly GorevDurum[] = ['acik', 'teslim_edildi', 'tamamlandi'];

export interface GroupTask {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  assigned_by: string;
  meeting_id: string | null;
  /** YYYY-MM-DD */
  due_date: string | null;
  status: GorevDurum;
  assignee_note: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: ProfileSummary | null;
  assigner?: ProfileSummary | null;
  meeting?: Pick<Meeting, 'id' | 'title' | 'meeting_date'> | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location: string | null;
  notes: string | null;
  creator_id: string;
  created_at: string;
  creator?: ProfileSummary | null;
}

export type TakvimOgesiTuru = 'toplanti' | 'etkinlik' | 'gorev';

/** Takvim ekranında tek tip öğe: toplantı, etkinlik veya görevin son tarihi. */
export interface TakvimOgesi {
  /** `${tur}:${kayıt id}` */
  anahtar: string;
  tur: TakvimOgesiTuru;
  kayitId: string;
  baslik: string;
  /** ISO zaman damgası; tumGun ise YYYY-MM-DD. */
  baslangic: string;
  bitis: string | null;
  tumGun: boolean;
  /** İstanbul saatine göre YYYY-MM-DD (gruplama için). */
  gun: string;
  aciklama: string | null;
  yer: string | null;
  /** Yalnız toplantıda: sunum bağlantısı (düzenleme formu için). */
  sunumUrl?: string | null;
  /** Ekleyen (toplantı/etkinlik) veya görevi veren. */
  ekleyenId: string;
  ekleyenAd: string | null;
  /** Yalnız görevde: görevi alan kişi ve durum. */
  sorumluId?: string;
  sorumluAd?: string | null;
  gorevDurum?: GorevDurum;
  /** Görüntüleyen bu öğeyi silebilir mi (sunucu hesaplar, asıl koruma RLS). */
  silebilir: boolean;
}
