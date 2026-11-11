#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v go >/dev/null 2>&1 || { echo "Go 1.22+ is required on the build machine." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip is required to package the release." >&2; exit 1; }
if command -v node >/dev/null 2>&1; then node tests/validate_v5_1.mjs; else echo "Node.js not found; skipping static tests (not required on target devices)."; fi
rm -rf dist WordMap-V5.1.1-linux-amd64.zip
mkdir -p dist/vendor dist/tests
for f in index.html styles.css world-theme.css data.js app.js world.js WordMap-Offline.html manifest.webmanifest sw.js icon.svg 使用说明.txt README.md CHANGELOG-V5.1.md CHANGELOG-V5.1.1.md; do
  test -f "$f" || { echo "Missing release file: $f" >&2; exit 1; }
  cp "$f" dist/
done
cp vendor/three.min.js vendor/THREE-LICENSE.txt dist/vendor/
cp -R tests/. dist/tests/
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o dist/WordMap-linux-amd64 ./launcher
cat > dist/BUILD-INFO.txt <<'EOF'
WordMap V5.1.1 Linux amd64
Go launcher: CGO_ENABLED=0
Target runtime: installed web browser only
Local bind: 127.0.0.1:18765
EOF
zip -qr dist/WordMap-V5.1.1-source.zip go.mod launcher build tests vendor index.html styles.css world-theme.css data.js app.js world.js WordMap-Offline.html manifest.webmanifest sw.js icon.svg 使用说明.txt README.md CHANGELOG-V5.1.md CHANGELOG-V5.1.1.md
(cd dist && zip -qr ../WordMap-V5.1.1-linux-amd64.zip .)
mv WordMap-V5.1.1-linux-amd64.zip dist/
echo "Build complete: dist/wordmap-linux-amd64, dist/WordMap-V5.1.1-linux-amd64.zip, dist/WordMap-V5.1.1-source.zip"
