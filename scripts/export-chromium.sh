#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
OUT_FILE="$DIST_DIR/iliasHelperChromium.zip"

mkdir -p "$DIST_DIR"
rm -f "$OUT_FILE"

cd "$ROOT_DIR"
zip -r "$OUT_FILE" \
  manifest.json \
  background.js \
  content.js \
  popup.html \
  popup.js \
  popup.css \
  options.html \
  options.js \
  shared \
  logo_128.png \
  LICENSE \
  privacy-policy.md \
  Readme.md

echo "[export] created: $OUT_FILE"
