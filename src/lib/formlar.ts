// Ankara Üniversitesi Fen Bilimleri Enstitüsü formları. Kaynak: https://fenbilimleri.ankara.edu.tr/formlar/
// Bu liste sayfadaki tablodan alındı; dosya bağlantıları sayfada bulunan doğrudan indirme linkleridir.
// Kaynak sayfa değişirse bu dosyayı güncelleyin.

export type FormTuru = 'DOC' | 'DOCX' | 'PDF' | 'XLSX';

export interface Form {
  ad: string;
  /** Sayfadaki form numarası, ör. TYL-YL-D/03. Yoksa alan atlanır. */
  kod?: string;
  url: string;
  tur: FormTuru;
}

export interface FormGrubu {
  baslik: string;
  formlar: Form[];
}

export const FORM_KAYNAK_URL = 'https://fenbilimleri.ankara.edu.tr/formlar/';

export const FORM_GRUPLARI: readonly FormGrubu[] = [
  {
    baslik: 'Danışman Tercih Formu',
    formlar: [
      {
        ad: 'Danışman Tercih Formu',
        kod: 'TYL-YL-D/03',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD03.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Bilimsel Hazırlık Programı İle İlgili Formlar',
    formlar: [
      {
        ad: 'Bilimsel Hazırlık Programı (BHP) Ders Kayıt Formu',
        kod: 'TYL-YL-D/04',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD04.doc',
        tur: 'DOC',
      },
      {
        ad: 'Bilimsel Hazırlık Programı (BHP) Değerlendirme Tutanağı',
        kod: 'TYL-YL-D/08',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD08.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Dersler İle İlgili Formlar',
    formlar: [
      {
        ad: 'Lisansüstü Ders Öneri Formu',
        kod: 'TYL-YL-D/09',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD09.doc',
        tur: 'DOC',
      },
      {
        ad: 'Ders Bilgi Formu Kontrol Listesi',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2026/02/Bologna-Ders-Bilgi-Formu-Kontrol.pdf',
        tur: 'PDF',
      },
      {
        ad: 'Doktora Programı Ders Kayıt Formu',
        kod: 'D/02',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D02.doc',
        tur: 'DOC',
      },
      {
        ad: 'Tezli Yüksek Lisans Programı Ders Kayıt Formu',
        kod: 'YL/02',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YL02.doc',
        tur: 'DOC',
      },
      {
        ad: 'Tezsiz Yüksek Lisans Programı Ders Kayıt Formu',
        kod: 'TYL/02',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYL02.doc',
        tur: 'DOC',
      },
      {
        ad: 'Farklı Üniversite/Enstitü Öğrencileri İçin Ders Kayıt Formu',
        kod: 'TYL-YL-D/02',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD02.doc',
        tur: 'DOC',
      },
      {
        ad: 'Ders Değişikliği Formu',
        kod: 'TYL-YL-D/07',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD07.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Seminer İle İlgili Formlar',
    formlar: [
      {
        ad: 'Seminer Sunumu Duyuru Formu',
        kod: 'YL-D/02',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YLD02.doc',
        tur: 'DOC',
      },
      {
        ad: 'Seminer Değerlendirme Tutanağı',
        kod: 'YL-D/03',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YLD03.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Dönem Projesi İle İlgili Formlar',
    formlar: [
      {
        ad: 'Dönem Projesi Sunumu Duyuru Formu',
        kod: 'TYL/03',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYL03.doc',
        tur: 'DOC',
      },
      {
        ad: 'Dönem Projesi Değerlendirme Tutanağı',
        kod: 'TYL/04',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYL04.doc',
        tur: 'DOC',
      },
      {
        ad: 'Üretken Yapay Zeka (ÜYZ) Kullanım Beyan Formu',
        kod: 'TYL/05',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2026/07/Form-TYL05.docx',
        tur: 'DOCX',
      },
    ],
  },
  {
    baslik: 'Tezler İle İlgili Formlar',
    formlar: [
      {
        ad: 'Yüksek Lisans Tez Önerisi Hazırlama Formu',
        kod: 'YL/03',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2024/01/Form-YL03.docx',
        tur: 'DOCX',
      },
      {
        ad: 'Doktora Tez Önerisi Hazırlama Formu',
        kod: 'D/01',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2024/01/Form-D01.docx',
        tur: 'DOCX',
      },
      {
        ad: 'Yüksek Lisans Tez Savunma Jüri Önerisi Formu',
        kod: 'YL/01',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YL01.doc',
        tur: 'DOC',
      },
      {
        ad: 'Doktora Tez Savunma Jüri Önerisi Formu',
        kod: 'D/10',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D10.doc',
        tur: 'DOC',
      },
      {
        ad: 'Lisansüstü Tez Savunması Duyuru Formu',
        kod: 'YL-D/04',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YLD04.doc',
        tur: 'DOC',
      },
      {
        ad: 'Lisansüstü Tez Değerlendirme Kişisel Rapor',
        kod: 'YL-D/05',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YLD05.doc',
        tur: 'DOC',
      },
      {
        ad: 'Lisansüstü Tez Savunma Tutanağı',
        kod: 'YL-D/06',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-YLD06.doc',
        tur: 'DOC',
      },
      {
        ad: 'Üretken Yapay Zeka (ÜYZ) Kullanım Beyan Formu',
        kod: 'YL-D/08',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2026/05/Form-YLD08.docx',
        tur: 'DOCX',
      },
    ],
  },
  {
    baslik: 'Web Sayfası Duyuru Formu',
    formlar: [
      {
        ad: 'Tez Bilgileri Web Duyurusu Onay Formu',
        kod: 'YL-D/07',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2026/01/Form-YLD07.docx',
        tur: 'DOCX',
      },
    ],
  },
  {
    baslik: 'Doktora Yeterlik Sınavı Tutanağı',
    formlar: [
      {
        ad: 'Doktora Yeterlik Komitesi Öneri Formu',
        kod: 'D/11',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D11.doc',
        tur: 'DOC',
      },
      {
        ad: 'Yeterlik Sınavı Tutanağı',
        kod: 'D/03',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D03.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Doktora Tez Önerisi Formları ve TİK Tutanağı',
    formlar: [
      {
        ad: 'Doktora Tez Önerisi Savunması Duyuru Formu',
        kod: 'D/04',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D04.doc',
        tur: 'DOC',
      },
      {
        ad: 'Tez İzleme Komitesi (TİK) Öneri Formu',
        kod: 'D/07',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D07.doc',
        tur: 'DOC',
      },
      {
        ad: 'Doktora Tez Önerisi Savunma Tutanağı',
        kod: 'D/05',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D05.doc',
        tur: 'DOC',
      },
      {
        ad: 'Tez İzleme Komitesi (TİK) Toplantı Tutanağı',
        kod: 'D/06',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-D06.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Doktora Yayın Formu',
    formlar: [
      {
        ad: 'Doktora Programı Yayın Formu',
        kod: 'D/12',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2026/05/Form-D12.docx',
        tur: 'DOCX',
      },
    ],
  },
  {
    baslik: 'Katılım Listesi Formu',
    formlar: [
      {
        ad: 'Toplantı Katılımcı Listesi',
        kod: 'TYL-YL-D/05',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD05.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Referans Mektubu Formu',
    formlar: [
      {
        ad: 'Referans Mektubu',
        kod: 'TYL-YL-D/06',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/07/Form-TYLYLD06.doc',
        tur: 'DOC',
      },
    ],
  },
  {
    baslik: 'Niyet Mektubu Formu',
    formlar: [
      {
        ad: 'Niyet Mektubu',
        kod: 'TYL-YL-D/10',
        url: 'https://fenbilimleri.ankara.edu.tr/wp-content/uploads/sites/79/2023/08/Form-TYLYLD10.doc',
        tur: 'DOC',
      },
    ],
  },
];
