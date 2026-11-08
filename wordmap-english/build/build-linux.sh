#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
for f in index.html styles.css data.js app.js WordMap-Offline.html manifest.webmanifest sw.js icon.svg 使用说明.txt README.md CHANGELOG-V3.md CHANGELOG-V3.1.md tests/V3.1验收记录.md; do
  test -f "$f" || { echo "Missing release file: $f" >&2; exit 1; }
  cp "$f" dist/
done
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o dist/wordmap ./launcher
