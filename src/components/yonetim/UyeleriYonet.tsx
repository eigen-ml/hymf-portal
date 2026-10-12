'use client';

import React, { useState } from 'react';
import { Panel, Button, Rozet, BasHarfAvatar, Uyari, Alan, inputSinifi, selectSinifi } from '@/components/ui';
import { YetkiRozeti } from '@/components/ui/YetkiRozeti';
import type { Profile, AdvisorAssignment, Kadro } from '@/types/database';
import { KADROLAR } from '@/types/database';
import { KADRO_ETIKETI, kisaAd } from '@/lib/etiketler';
import { kisaTarih } from '@/lib/zaman';
import { uyeyiOnayla, uyeyiGuncelle, aktiflikDegistir, danismanEkle, danismanCikar, birincilDanismanYap, sifreSifirla } from '@/app/yonetim/actions';

/** Kişinin takvim aboneliği: metin sunucuda hazırlanır ("Apple · 2 saat önce", "Bağlı değil"). */
export interface TakvimDurumu {
  metin: string;
  bagli: boolean;
}

interface UyeleriYonetProps {
  profiles: Profile[];
  advisorAssignments: AdvisorAssignment[];
  hocaKadrosuKisitli: boolean;
  /** Kişi id → takvim durumu. null: bilgi yüklenemedi, satır gösterilmez. */
  takvimDurumlari: Record<string, TakvimDurumu> | null;
}

interface EditFormData {
  full_name?: string;
  academic_title?: string | null;
  kadro?: Kadro | null;
}

export function UyeleriYonet({ profiles, advisorAssignments, hocaKadrosuKisitli, takvimDurumlari }: UyeleriYonetProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, EditFormData>>({});
  const [approvalKadro, setApprovalKadro] = useState<Record<string, string>>({});
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const onayBekleyenler = profiles.filter((p) => !p.is_approved && p.is_active);
  const uyeler = profiles.filter((p) => p.is_approved && p.is_active);

  // Danışman atanmamış öğrenciler (danışmanlı kadrolardan)
  const danismanliKadrolar = ['doktora', 'yuksek_lisans', 'lisans', 'gelistirici'];
  const danismanAtanmamisOgrenciler = uyeler.filter((p) => {
    if (!danismanliKadrolar.includes(p.kadro ?? '')) return false;
    return !advisorAssignments.some((a) => a.student_id === p.id);
  });

  const handleApprove = async (id: string, kadro: string) => {
    if (!kadro) {
      setMessage({ type: 'error', text: 'Kadro seçiniz.' });
      return;
    }
    setLoading(true);
    try {
      const result = await uyeyiOnayla(id, kadro as Kadro);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Onaylandı' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    try {
      const data = editFormData[id] || {};
      const result = await uyeyiGuncelle(id, data as Record<string, unknown>);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Kaydedildi' });
        setEditingId(null);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, aktif: boolean) => {
    if (!aktif) {
      const onay = confirm('Bu üyeyi pasifleştirirseniz portala giremez. Devam edilsin mi?');
      if (!onay) return;
    }
    setLoading(true);
    try {
      const result = await aktiflikDegistir(id, aktif);
      if (result.ok) {
        setMessage({ type: 'success', text: aktif ? 'Yeniden etkinleştirildi' : 'Pasifleştirildi' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (p: Profile) => {
    const onay = confirm(`${p.full_name} için yeni geçici şifre oluşturulsun mu? Eski şifresi geçersiz olur.`);
    if (!onay) return;
    setLoading(true);
    try {
      const result = await sifreSifirla(p.id);
      if (result.ok) {
        setMessage({ type: 'success', text: `Yeni giriş bilgilerini kişiye iletin: ${p.email} / ${result.sifre}` });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdvisor = async (studentId: string, advisorId: string, isPrimary: boolean): Promise<void> => {
    setAdvisorLoading(true);
    try {
      const result = await danismanEkle(studentId, advisorId, isPrimary);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Danışman eklendi' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleRemoveAdvisor = async (studentId: string, advisorId: string) => {
    const onay = confirm('Danışmanı çıkarmak istediğinize emin misiniz?');
    if (!onay) return;
    setAdvisorLoading(true);
    try {
      const result = await danismanCikar(studentId, advisorId);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Danışman çıkarıldı' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleSetPrimaryAdvisor = async (studentId: string, advisorId: string) => {
    setAdvisorLoading(true);
    try {
      const result = await birincilDanismanYap(studentId, advisorId);
      if (result.ok) {
        setMessage({ type: 'success', text: 'Birincil danışman değişti' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } finally {
      setAdvisorLoading(false);
    }
  };

  const getStudentAdvisors = (studentId: string) => {
    return advisorAssignments.filter((a) => a.student_id === studentId);
  };

  const getProfileAdvisors = (studentId: string) => {
    return profiles.filter((p) => p.kadro === 'hoca' && p.is_approved && p.is_active).filter((p) => {
      const advisor = getStudentAdvisors(studentId);
      return !advisor.some((a) => a.advisor_id === p.id);
    });
  };

  return (
    <div className="space-y-6">
      {message && (
        <Uyari
          tone={message.type === 'success' ? 'basari' : 'tehlike'}
        >
          {message.text}
        </Uyari>
      )}

      {onayBekleyenler.length > 0 && (
        <Panel baslik="Onay bekleyenler">
          <div className="space-y-3">
            {onayBekleyenler.map((p) => {
              const selectedKadro = approvalKadro[p.id] || '';
              return (
                <div key={p.id} className="flex gap-3 items-center border-t border-line py-3 first:border-t-0 first:pt-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{p.full_name}</div>
                    <div className="text-sm text-ink-3">{p.email}</div>
                    <div className="text-sm text-ink-3">{kisaTarih(p.created_at)}</div>
                  </div>
                  <select
                    value={selectedKadro}
                    onChange={(e) => setApprovalKadro({ ...approvalKadro, [p.id]: e.target.value })}
                    className={`${selectSinifi} sm:w-56`}
                  >
                    <option value="">Kadro seçin</option>
                    {KADROLAR.filter((k) => !hocaKadrosuKisitli || k !== 'hoca').map((k) => (
                      <option key={k} value={k}>{KADRO_ETIKETI[k]}</option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={loading || !selectedKadro}
                    onClick={() => handleApprove(p.id, selectedKadro)}
                  >
                    Onayla
                  </Button>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {danismanAtanmamisOgrenciler.length > 0 && (
        <Uyari tone="uyari">
          <div className="text-sm">
            <strong>Danışmanı atanmamış öğrenciler:</strong>
            <div className="mt-1">{danismanAtanmamisOgrenciler.map((p) => p.full_name).join(', ')}</div>
          </div>
        </Uyari>
      )}

      <Panel baslik="Üyeler">
        <div className="divide-y divide-line">
          {uyeler.map((p) => {
            const advisors = getStudentAdvisors(p.id);
            const isEditing = editingId === p.id;

            return (
              <div key={p.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex gap-3 items-start">
                  <BasHarfAvatar ad={p.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-medium text-ink truncate">
                        {p.academic_title ? `${p.academic_title} ${p.full_name}` : p.full_name}
                      </div>
                      <YetkiRozeti yetki={p.yetki} />
                      {!p.is_active && <Rozet tone="notr">Pasif</Rozet>}
                    </div>
                    <div className="text-sm text-ink-3">{p.email}</div>
                    <div className="text-sm text-ink-3 mt-1">
                      {p.kadro ? KADRO_ETIKETI[p.kadro] : <span className="text-ink-3">Belirlenmedi</span>}
                    </div>
                    {takvimDurumlari && (() => {
                      const takvim = takvimDurumlari[p.id];
                      const metin = takvim?.metin ?? 'Bağlı değil';
                      const bagli = takvim?.bagli ?? false;
                      return (
                        <div className="text-sm text-ink-3 mt-1">
                          Takvim: <span className={bagli ? 'text-ink-2' : 'text-ink-3'}>{metin}</span>
                        </div>
                      );
                    })()}
                    {advisors.length > 0 && (
                      <div className="text-sm text-ink-3 mt-1">
                        Danışmanlar: {advisors.map((a) => (
                          <span key={a.advisor_id}>
                            {a.advisor?.full_name ? kisaAd(a.advisor.full_name) : 'Silinmiş üye'}
                            {a.is_primary && <span className="font-medium"> (birincil)</span>}
                          </span>
                        )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, ', ', el], [] as React.ReactNode[])}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isEditing ? setEditingId(null) : setEditingId(p.id)}
                  >
                    {isEditing ? 'Kapat' : 'Düzenle'}
                  </Button>
                </div>

                {isEditing && (
                  <div className="mt-4 ml-10 pt-3 border-t border-line space-y-3">
                    <Alan
                      etiket="Ad Soyad"
                      htmlFor={`name-${p.id}`}
                      yardim="Tam ad"
                    >
                      <input
                        id={`name-${p.id}`}
                        type="text"
                        className={inputSinifi}
                        defaultValue={p.full_name}
                        onChange={(e) => {
                          const current = editFormData[p.id] ?? {};
                          setEditFormData({ ...editFormData, [p.id]: { ...current, full_name: e.target.value } });
                        }}
                      />
                    </Alan>

                    <Alan
                      etiket="Unvan"
                      htmlFor={`title-${p.id}`}
                      yardim="Örn. Prof. Dr."
                    >
                      <input
                        id={`title-${p.id}`}
                        type="text"
                        className={inputSinifi}
                        defaultValue={p.academic_title ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, [p.id]: { ...(editFormData[p.id] ?? {}), academic_title: e.target.value || null } })}
                      />
                    </Alan>

                    {!hocaKadrosuKisitli && (
                      <Alan
                        etiket="Kadro"
                        htmlFor={`kadro-${p.id}`}
                      >
                        <select
                          id={`kadro-${p.id}`}
                          className={selectSinifi}
                          defaultValue={p.kadro ?? ''}
                          onChange={(e) => {
                            const current = editFormData[p.id] || {};
                            setEditFormData({ ...editFormData, [p.id]: { ...current, kadro: (e.target.value as Kadro) || null } });
                          }}
                        >
                          <option value="">Kadro seçin</option>
                          {KADROLAR.filter((k) => !hocaKadrosuKisitli || k !== 'hoca').map((k) => (
                            <option key={k} value={k}>{KADRO_ETIKETI[k]}</option>
                          ))}
                        </select>
                      </Alan>
                    )}

                    {danismanliKadrolar.includes(p.kadro ?? '') && (
                      <div className="border-t border-line pt-3 mt-3">
                        <div className="text-sm font-medium text-ink mb-3">Danışmanlar</div>
                        {advisors.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {advisors.map((a) => (
                              <div key={a.advisor_id} className="flex items-center gap-2 text-sm text-ink">
                                <span>{a.advisor?.full_name ? kisaAd(a.advisor.full_name) : 'Silinmiş üye'}</span>
                                {!a.is_primary && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={advisorLoading}
                                    onClick={() => handleSetPrimaryAdvisor(p.id, a.advisor_id)}
                                  >
                                    Birincil yap
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={advisorLoading}
                                  onClick={() => handleRemoveAdvisor(p.id, a.advisor_id)}
                                >
                                  Çıkar
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 items-end">
                          <select
                            className={selectSinifi}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddAdvisor(p.id, e.target.value, advisors.length === 0);
                                e.target.value = '';
                              }
                            }}
                            disabled={advisorLoading}
                          >
                            <option value="">Danışman ekle</option>
                            {getProfileAdvisors(p.id).map((prof) => (
                              <option key={prof.id} value={prof.id}>{prof.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={loading}
                        onClick={() => handleSave(p.id)}
                      >
                        Kaydet
                      </Button>
                      {!hocaKadrosuKisitli && (
                        <Button
                          variant={p.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={loading}
                          onClick={() => handleToggleActive(p.id, !p.is_active)}
                        >
                          {p.is_active ? 'Pasifleştir' : 'Yeniden etkinleştir'}
                        </Button>
                      )}
                      {(!hocaKadrosuKisitli || (p.yetki === 'uye' && p.kadro !== 'hoca')) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={loading}
                          onClick={() => handleResetPassword(p)}
                        >
                          Şifre sıfırla
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
