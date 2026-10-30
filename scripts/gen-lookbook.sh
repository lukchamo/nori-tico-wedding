#!/usr/bin/env bash
# Genera las fotos del lookbook con FLUX.2 (Workers AI) y crea versiones optimizadas.
# Uso: scripts/gen-lookbook.sh [id ...]   (sin argumentos genera todas las que falten)
# Requiere CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/lookbook
RAW=${RAW_DIR:-.lookbook-raw}
mkdir -p "$OUT/thumb" "$RAW"
STYLE="Editorial fashion photograph for a daytime tropical wedding guest lookbook. Natural soft daylight, warm film tones, shallow depth of field, magazine quality, elegant and realistic. Color palette sage green, terracotta, sky blue, dusty rose and gold accents. Absolutely no white, ivory or cream clothing. No text, no logos, no watermark."
API="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev"

gen() {
  local id="$1" prompt="$2"
  [ -s "$RAW/$id.json" ] && return 0
  for attempt in 1 2 3; do
    if curl -sS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "$API" \
      -F "prompt=${prompt}. ${STYLE}" -F width=768 -F height=1024 -o "$RAW/$id.json" &&
      python3 -c "import json,sys; sys.exit(0 if json.load(open('$RAW/$id.json')).get('success') else 1)"; then
      echo "✓ $id"; return 0
    fi
    rm -f "$RAW/$id.json"; sleep $((attempt * 3))
  done
  echo "✗ $id" >&2
}
export -f gen; export RAW STYLE API

if [ $# -gt 0 ]; then FILTER="$*"; else FILTER=""; fi
while IFS=$'\t' read -r id prompt; do
  [ -z "$id" ] && continue
  if [ -n "$FILTER" ] && [[ " $FILTER " != *" $id "* ]]; then continue; fi
  if [ -z "$FILTER" ] && [ -s "$OUT/$id.jpg" ]; then continue; fi
  printf '%s\t%s\n' "$id" "$prompt"
done < scripts/lookbook-prompts.tsv | xargs -P 4 -d '\n' -I{} bash -c 'IFS=$'"'"'\t'"'"' read -r id prompt <<< "{}"; gen "$id" "$prompt"'

python3 -I - "$RAW" "$OUT" <<'PY'
import base64, io, json, os, sys
from PIL import Image
raw, out = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(raw)):
    if not f.endswith(".json"): continue
    id_ = f[:-5]
    d = json.load(open(os.path.join(raw, f)))
    im = Image.open(io.BytesIO(base64.b64decode(d["result"]["image"]))).convert("RGB")
    im.thumbnail((768, 1024)); im.save(f"{out}/{id_}.jpg", quality=80, optimize=True, progressive=True)
    t = im.copy(); t.thumbnail((360, 480)); t.save(f"{out}/thumb/{id_}.jpg", quality=74, optimize=True, progressive=True)
print("optimizadas:", len([x for x in os.listdir(out) if x.endswith('.jpg')]))
PY
