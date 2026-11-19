#!/bin/bash
# kuyruk_sec.sh — TRUBA'da işin en erken başlayacağı kuyruğu bulur, istenirse oraya gönderir.
#
# Kullanım (TRUBA'da, iş betiğinin olduğu klasörde):
#   bash kuyruk_sec.sh job.slurm        # yalnız bakar, hiçbir şey göndermez
#   bash kuyruk_sec.sh job.slurm -g     # en erken kuyruğa gönderir
#
# Nasıl çalışır: her kuyruk için "sbatch --test-only" çalıştırır. Bu iş göndermez, Slurm'a
# "bu iş şu kuyruğa girse ne zaman başlar" diye sorar (bekleyen işleri ve önceliği hesaba katar).
# sinfo yalnız boş düğümü gösterir, kuyrukta bekleyen işleri göstermez. TRUBA'da squeue yalnız
# kendi işlerini gösteriyor (19 Kas), o yüzden bekleyen iş sayısı betikte yok.
# Uyarı: tahmin kesin değil, kuyrukları kıyaslamak için kullan.
#
# Düğüm sayısı betikteki -N / --nodes satırından alınır (yoksa 1). Her kuyrukta düğüm başına
# çekirdek o kuyruğun düğümüne göre ayarlanır (barbun 40, hamsi 56, orfoz 112). Betikteki
# --ntasks, -n ve -c satırlarını bu yüzden geçersiz kılar (-c 1: her MPI süreci bir çekirdek;
# walk6_std'deki "-n 1 -c 110" VASP'ı tek süreçte koşturabilir). INCAR'daki NCORE/KPAR çekirdek sayısına bölünmeli.
# Kuyruk listesini değiştirmek için: KUYRUKLAR="barbun:40 hamsi:56" bash kuyruk_sec.sh job.slurm

KUYRUKLAR=${KUYRUKLAR:-"barbun:40 hamsi:56 orfoz:112"}
BETIK=$1
GONDER=0; [ "$2" = "-g" ] && GONDER=1

if [ -z "$BETIK" ] || [ ! -f "$BETIK" ]; then
  echo "Kullanım: bash kuyruk_sec.sh <iş_betiği.slurm> [-g]"; exit 1
fi

N=$(grep -E '^#SBATCH[[:space:]]+(-N|--nodes)' "$BETIK" | head -1 | grep -oE '[0-9]+' | head -1)
N=${N:-1}

printf "%-8s %-6s %-20s\n" KUYRUK BOS "TAHMINI BASLAMA"
EN_IYI=""; EN_IYI_ZAMAN=""; EN_IYI_CEKIRDEK=""
for x in $KUYRUKLAR; do
  p=${x%:*}; c=${x#*:}
  bos=$(sinfo -h -p "$p" -t idle -o "%D" 2>/dev/null | awk '{s+=$1} END {print s+0}')
  cikti=$(sbatch --test-only -p "$p" -N "$N" -c 1 --ntasks-per-node="$c" --ntasks=$((N*c)) "$BETIK" 2>&1)
  zaman=$(echo "$cikti" | grep -oE 'start at [0-9T:-]+' | awk '{print $3}')
  if [ -n "$zaman" ]; then
    printf "%-8s %-6s %-20s\n" "$p" "$bos" "$zaman"
    if [ -z "$EN_IYI_ZAMAN" ] || [ "$(date -d "$zaman" +%s)" -lt "$(date -d "$EN_IYI_ZAMAN" +%s)" ]; then
      EN_IYI=$p; EN_IYI_ZAMAN=$zaman; EN_IYI_CEKIRDEK=$c
    fi
  else
    printf "%-8s %-6s %s\n" "$p" "$bos" "olmaz: $(echo "$cikti" | tail -1)"
  fi
done

[ -z "$EN_IYI" ] && { echo "Hiçbir kuyruk kabul etmedi (süre, hesap ya da çekirdek sınırına bak)."; exit 1; }
echo
echo "En erken: $EN_IYI ($EN_IYI_ZAMAN), $N düğüm x $EN_IYI_CEKIRDEK çekirdek"

if [ $GONDER -eq 1 ]; then
  sbatch -p "$EN_IYI" -N "$N" -c 1 --ntasks-per-node="$EN_IYI_CEKIRDEK" --ntasks=$((N*EN_IYI_CEKIRDEK)) "$BETIK"
else
  echo "Göndermek için: bash kuyruk_sec.sh $BETIK -g"
fi
