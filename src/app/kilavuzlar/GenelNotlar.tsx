'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  FileCode,
  Layers,
  Network,
} from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';

export function GenelNotlar() {
  const [activeTab, setActiveTab] = useState<'truba' | 'vasp' | 'lammps' | 'vpn'>('truba');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-ink">Genel notlar</h2>
        <p className="text-base text-ink-2 mt-2 max-w-prose">
          TRUBA bağlantısı, örnek VASP ve LAMMPS dosyaları, yerleşke dışı VPN.
        </p>
      </div>

      {/* Sekmeler (Tabs) */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab('truba')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
            activeTab === 'truba'
              ? 'bg-primary text-on-primary'
              : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>TRUBA aktivasyonu</span>
        </button>

        <button
          onClick={() => setActiveTab('vasp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
            activeTab === 'vasp'
              ? 'bg-primary text-on-primary'
              : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>VASP kılavuzu</span>
        </button>

        <button
          onClick={() => setActiveTab('lammps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
            activeTab === 'lammps'
              ? 'bg-primary text-on-primary'
              : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>LAMMPS moleküler dinamik</span>
        </button>

        <button
          onClick={() => setActiveTab('vpn')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
            activeTab === 'vpn'
              ? 'bg-primary text-on-primary'
              : 'bg-sunken text-ink-2 hover:bg-sunken border border-line'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Okul VPN ve veri tabanları</span>
        </button>
      </div>

      {/* SEKME 1: TRUBA */}
      {activeTab === 'truba' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              TRUBA hesap aktivasyonu ve SSH bağlantısı
            </h2>
            <div className="text-sm text-ink-2 space-y-3 leading-relaxed">
              <p>
                TRUBA hesapları grup liderimiz Prof. Dr. danışmanlığındaki araştırma projesi kapsamında tanımlanır. Hesabınız açıldıktan sonra aşağıdaki adımları izleyiniz:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                  <strong className="text-ink">SSH anahtarı oluşturma:</strong> Terminalinizde (Linux / macOS / PowerShell) SSH anahtar çifti oluşturun:
                </li>
              </ol>
            </div>

            <CodeBlock
              title="SSH Anahtarı Oluşturma Komutu"
              language="bash"
              code={`# 4096 bit RSA veya Ed25519 anahtarı oluşturun
ssh-keygen -t ed25519 -C "ad.soyad@ankara.edu.tr"

# Oluşturulan genel anahtarı görüntüleyin ve TRUBA portalına yükleyin:
cat ~/.ssh/id_ed25519.pub`}
            />

            <div className="text-sm text-ink-2 space-y-2">
              <p>
                Genel anahtarınızı (public key) <a href="https://portal.truba.gov.tr" target="_blank" rel="noopener noreferrer" className="text-link underline">portal.truba.gov.tr</a> adresine giriş yaparak profilinizdeki SSH anahtarları bölümüne ekleyiniz.
              </p>
              <p>Anahtar onaylandıktan sonra bağlantı komutu:</p>
            </div>

            <CodeBlock
              title="TRUBA Kullanıcı Arayüzüne Bağlantı (172.16.7.1)"
              language="bash"
              code={`ssh -i ~/.ssh/id_ed25519 kullanici_adiniz@172.16.7.1`}
            />
          </div>

          {/* Standart Barbun VASP Slurm Betiği */}
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              Standart TRUBA Barbun VASP Slurm iş betiği
            </h2>
            <p className="text-sm text-ink-2">
              Aşağıdaki Slurm betiğini hesaplama klasörünüzde <code className="font-mono">run_vasp.sh</code> adıyla kaydedip <code className="font-mono">sbatch run_vasp.sh</code> komutu ile sıraya gönderebilirsiniz:
            </p>

            <CodeBlock
              title="run_vasp.sh (Standart HYMF Barbun Slurm Betiği)"
              language="bash"
              code={`#!/bin/bash
# ==============================================================================
# HYMF - TRUBA Barbun Kümesi VASP Hesaplama Betiği
# ==============================================================================
#SBATCH -p barbun
#SBATCH -A your_hymf_group_code
#SBATCH -J vasp_geometry_opt
#SBATCH -N 2
#SBATCH -n 80
#SBATCH --time=72:00:00
#SBATCH --output=slurm-%j.out
#SBATCH --error=slurm-%j.err

echo "[HYMF] Baslama Zamani: $(date)"
echo "[HYMF] Calisan Dugumler: $SLURM_JOB_NODELIST"

# Modülleri temizle ve VASP modülünü yükle
module purge
module load centos7.9/comp/intel/compilers-2021.4.0
module load centos7.9/app/vasp/6.3.2-int-mkl-mpi

# Bellek ve iş parçacığı ayarları
ulimit -s unlimited
export OMP_NUM_THREADS=1

# VASP Standart çalıştırıcı
srun vasp_std > vasp.out

echo "[HYMF] Bitis Zamani: $(date)"`}
            />
          </div>
        </div>
      )}

      {/* SEKME 2: VASP */}
      {activeTab === 'vasp' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              VASP 4 temel giriş dosyası ve INCAR şablonu
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              VASP çalıştırmak için çalışma dizininde 4 dosya bulunmalıdır: <strong>INCAR</strong> (hesaplama parametreleri), <strong>POSCAR</strong> (atomik koordinatlar), <strong>KPOINTS</strong> (Brillouin bölgesi örneklemesi) ve <strong>POTCAR</strong> (pseudopotansiyeller).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-md bg-sunken border border-line space-y-2">
                <span className="text-sm font-semibold text-ink">KPOINTS (Monkhorst-Pack şablonu)</span>
                <CodeBlock
                  title="KPOINTS Dosyası"
                  language="text"
                  code={`Automatic mesh
0
Monkhorst-Pack
 12  12   1
 0   0   0`}
                />
              </div>

              <div className="p-4 rounded-md bg-sunken border border-line space-y-2">
                <span className="text-sm font-semibold text-ink">POTCAR birleştirme komutu</span>
                <CodeBlock
                  title="POTCAR Hazırlama (Örn: Mo ve S için)"
                  language="bash"
                  code={`cat ~/potcar_PBE/Mo_pv/POTCAR ~/potcar_PBE/S/POTCAR > POTCAR`}
                />
              </div>
            </div>

            <div className="pt-3">
              <h3 className="text-sm font-semibold text-ink mb-2">
                Önerilen geometri optimizasyonu INCAR parametreleri
              </h3>
              <CodeBlock
                title="INCAR (Geometri Relaksasyonu)"
                language="text"
                code={`# HYMF Standart Geometri Optimizasyonu INCAR
SYSTEM = HYMF_MoS2_Optimization

# Elektronik Rahatlama
ENCUT  = 520       # Düzlem dalga kesme enerjisi (eV)
PREC   = Accurate  # Hassasiyet derecesi
EDIFF  = 1E-6      # SCF yakınsama toleransı
NELM   = 100       # Maksimum SCF adım sayısı
ISMEAR = 0         # Gaussian smearing (yarıiletken ve yalıtkanlar için)
SIGMA  = 0.05

# İyonik Rahatlama
IBRION = 2         # Eşlenik gradyan algoritması
ISIF   = 3         # Hücre hacmi ve iyonik pozisyonlar birlikte gevşetilir
NSW    = 200       # Maksimum iyonik adım sayısı
EDIFFG = -0.01     # İyonik kuvvet yakınsama kriteri (-0.01 eV/Angstrom)

# Performans ve Paralelleştirme
NCORE  = 4         # Düğüm başına çekirdek dağılımı (Barbun için NCORE=4 veya 8)
LREAL  = Auto      # Gerçek uzay projeksiyonu
LWAVE  = .FALSE.   # WAVECAR çıktısını disk tasarrufu için kapat
LCHARG = .TRUE.    # CHGCAR çıktısını al`}
              />
            </div>
          </div>
        </div>
      )}

      {/* SEKME 3: LAMMPS */}
      {activeTab === 'lammps' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              LAMMPS moleküler dinamik ve simülasyon kılavuzu
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Büyük atomik sistemlerin termal iletkenlik, difüzyon ve faz dönüşümü analizleri için LAMMPS yazılımı kullanılır.
            </p>

            <CodeBlock
              title="in.nvt (Standart NVT Termal Dengeleme Giriş Betiği)"
              language="text"
              code={`# HYMF - LAMMPS NVT Equilibration
units          metal
atom_style     atomic
boundary       p p p

read_data      structure.data

pair_style     tersoff
pair_coeff     * * SiC.tersoff C Si

velocity       all create 300.0 4928459 rot yes dist gaussian

timestep       0.001   # 1 fs

thermo         1000
thermo_style   custom step temp pe etotal press

fix            1 all nvt temp 300.0 300.0 0.1

dump           1 all custom 2000 traj.lammpstrj id type x y z vx vy vz

run            50000   # 50 ps`}
            />
          </div>
        </div>
      )}

      {/* SEKME 4: VPN */}
      {activeTab === 'vpn' && (
        <div className="space-y-6">
          <div className="bg-surface border border-line rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-ink">
              Ankara Üniversitesi kampüs dışı erişim
            </h2>
            <div className="text-sm text-ink-2 space-y-3 leading-relaxed">
              <p>
                Kampüs dışından makale indirirken (ScienceDirect, APS Physical Review, AIP, Nature, IEEE) okul IP adresinden görünmek için FortiClient VPN veya Vetis portalı kullanılır:
              </p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">FortiClient SSL-VPN:</strong> Ankara Üniversitesi Bilgi İşlem Daire Başkanlığı sayfasından FortiClient yazılımını indirin. Sunucu adresi: <code className="font-mono">vpn.ankara.edu.tr</code>, bağlantı noktası: <code className="font-mono">10443</code>. Kullanıcı adı ve şifre olarak kurumsal e-posta bilgilerinizi giriniz.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-ok shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-ink">VETİS (Uzaktan kütüphane portalı):</strong> Herhangi bir yazılım kurmadan <a href="https://kutuphane.ankara.edu.tr" target="_blank" rel="noopener noreferrer" className="text-link underline">kutuphane.ankara.edu.tr</a> üzerinden VETİS sistemine giriş yaparak akademik veri tabanlarına doğrudan erişebilirsiniz.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
