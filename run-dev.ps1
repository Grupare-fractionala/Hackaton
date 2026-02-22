param(
  [int]$Port = 5173,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command wsl -ErrorAction SilentlyContinue)) {
  Write-Error "WSL nu este disponibil. Activeaza WSL2 si Ubuntu."
  exit 1
}

$projectWindowsPath = (Get-Location).Path

if ($projectWindowsPath -notmatch "^([A-Za-z]):\\(.*)$") {
  Write-Error "Calea proiectului nu este pe un volum Windows standard."
  exit 1
}

$drive = $Matches[1].ToLower()
$tail = $Matches[2] -replace "\\", "/"
$projectWslPath = "/mnt/$drive/$tail"

$escapedProjectPath = $projectWslPath.Replace("'", "'\\''")

Get-ChildItem -Path $projectWindowsPath -Filter ".run-dev.wsl*.sh" -File -ErrorAction SilentlyContinue |
  ForEach-Object { Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue }

$runnerFileName = ".run-dev.wsl.$([Guid]::NewGuid().ToString('N')).sh"
$runnerWindowsPath = Join-Path $projectWindowsPath $runnerFileName
$runnerWslPath = "$projectWslPath/$runnerFileName"

$installStep = if ($SkipInstall) { "echo Skipping npm install" } else { "npm install" }

$runnerTemplate = @'
set -e
export NVM_DIR=$HOME/.nvm
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node lipseste in WSL. Ruleaza: nvm install 20" >&2
  exit 1
fi
cd '__PROJECT_PATH__'
__INSTALL_STEP__
npm run dev -- --host 0.0.0.0 --port __PORT__
'@

$runnerContent = $runnerTemplate.
  Replace("__PROJECT_PATH__", $escapedProjectPath).
  Replace("__INSTALL_STEP__", $installStep).
  Replace("__PORT__", [string]$Port)

try {
  Set-Content -Path $runnerWindowsPath -Value $runnerContent -Encoding Ascii -NoNewline
  Write-Host "Pornesc Vite in WSL pe portul $Port..."
  wsl bash "$runnerWslPath"
}
finally {
  Remove-Item -Path $runnerWindowsPath -Force -ErrorAction SilentlyContinue
}
