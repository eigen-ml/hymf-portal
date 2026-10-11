#!/bin/bash
# Kullanım: pdf_yap.sh girdi.html cikti.pdf
CHROME="$HOME/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell"
[ -x "$CHROME" ] || CHROME=$(ls -d $HOME/Library/Caches/ms-playwright/chromium_headless_shell-1248/*/chrome-headless-shell | head -1)
"$CHROME" --headless --disable-gpu --allow-file-access-from-files --no-pdf-header-footer --run-all-compositor-stages-before-draw --virtual-time-budget=3000 --print-to-pdf="$2" "file://$1" 2>/dev/null
