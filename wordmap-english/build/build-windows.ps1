$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
New-Item -ItemType Directory -Force -Path "dist" | Out-Null
$files = @(
  "index.html", "styles.css", "world-theme.css", "data.js", "app.js", "world.js", "WordMap-Offline.html", "manifest.webmanifest", "sw.js", "icon.svg",
  "使用说明.txt", "README.md", "CHANGELOG-V3.1.md", "CHANGELOG-V3.3.md", "CHANGELOG-V4.0.md", "tests/V3.1验收记录.md", "tests/V3.3验收记录.md", "tests/V4.0验收记录.md"
)
New-Item -ItemType Directory -Force -Path "dist/vendor" | Out-Null
Copy-Item "vendor/three.min.js" -Destination "dist/vendor/three.min.js" -Force
Copy-Item "vendor/THREE-LICENSE.txt" -Destination "dist/vendor/THREE-LICENSE.txt" -Force
foreach ($file in $files) {
  if (!(Test-Path $file)) { throw "Missing release file: $file" }
  Copy-Item $file -Destination "dist" -Force
}
$env:CGO_ENABLED="0"; $env:GOOS="windows"; $env:GOARCH="amd64"
go build -trimpath -ldflags="-s -w" -o "dist\\WordMap.exe" ".\\launcher"
Write-Host "Build complete: dist\\WordMap.exe"
Write-Host "Copy the entire dist folder to the offline Windows PC and run WordMap.exe."
