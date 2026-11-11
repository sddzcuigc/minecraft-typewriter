$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
if (!(Get-Command go -ErrorAction SilentlyContinue)) { throw "Go 1.22+ is required on the build machine." }
if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
New-Item -ItemType Directory -Force -Path "dist/vendor", "dist/tests" | Out-Null

$files = @(
  "index.html", "styles.css", "world-theme.css", "data.js", "app.js", "world.js",
  "WordMap-Offline.html", "manifest.webmanifest", "sw.js", "icon.svg",
  "使用说明.txt", "README.md", "CHANGELOG-V5.1.md", "CHANGELOG-V5.1.1.md"
)
foreach ($file in $files) {
  if (!(Test-Path $file)) { throw "Missing release file: $file" }
  Copy-Item -LiteralPath $file -Destination "dist" -Force
}
Copy-Item "vendor/three.min.js" -Destination "dist/vendor/three.min.js" -Force
Copy-Item "vendor/THREE-LICENSE.txt" -Destination "dist/vendor/THREE-LICENSE.txt" -Force
Copy-Item "tests/*" -Destination "dist/tests" -Recurse -Force

if (Get-Command node -ErrorAction SilentlyContinue) {
  node tests/validate_v5_1.mjs
  if ($LASTEXITCODE -ne 0) { throw "WordMap static regression tests failed." }
} else {
  Write-Warning "Node.js not found on build machine; static regression test skipped. Node.js is not required on the target PC."
}

$env:CGO_ENABLED="0"; $env:GOOS="windows"; $env:GOARCH="amd64"
go build -trimpath -ldflags="-s -w" -o "dist/WordMap.exe" "./launcher"
if (!(Test-Path "dist/WordMap.exe")) { throw "Go launcher build did not produce WordMap.exe." }

@"
WordMap V5.1.1 Windows amd64
Go launcher: CGO_ENABLED=0
Target runtime: installed web browser only
Local bind: 127.0.0.1:18765
"@ | Set-Content -Encoding UTF8 "dist/BUILD-INFO.txt"

$sourcePaths = @(
  "go.mod", "launcher", "build", "tests", "vendor",
  "index.html", "styles.css", "world-theme.css", "data.js", "app.js", "world.js",
  "WordMap-Offline.html", "manifest.webmanifest", "sw.js", "icon.svg",
  "使用说明.txt", "README.md", "CHANGELOG-V5.1.md", "CHANGELOG-V5.1.1.md"
)
Compress-Archive -Path $sourcePaths -DestinationPath "dist/WordMap-V5.1.1-source.zip" -Force
$tempZip = "WordMap-V5.1.1-windows-amd64.zip"
if (Test-Path $tempZip) { Remove-Item $tempZip -Force }
Compress-Archive -Path "dist/*" -DestinationPath $tempZip -Force
Move-Item $tempZip "dist/WordMap-V5.1.1-windows-amd64.zip" -Force
Write-Host "Build complete:"
Write-Host "  dist/WordMap.exe"
Write-Host "  dist/WordMap-V5.1.1-windows-amd64.zip"
Write-Host "  dist/WordMap-V5.1.1-source.zip"
