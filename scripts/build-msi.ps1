$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

function Find-CommandPath([string] $Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    return $null
}

$python = Join-Path $ProjectRoot "venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = Find-CommandPath "python.exe"
}
if (-not $python) {
    throw "Python blev ikke fundet. Installer Python, eller kør python scripts/setup_iracing_env.py."
}

$npm = Find-CommandPath "npm.cmd"
if (-not $npm) {
    $wingetNode = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_*\node-*\npm.cmd" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($wingetNode) { $npm = $wingetNode.FullName }
}
if (-not $npm) {
    throw "Node.js/npm blev ikke fundet. Installer Node.js LTS fra https://nodejs.org/."
}
$nodeDirectory = Split-Path $npm
$env:PATH = "$nodeDirectory;$env:PATH"

$localWix = Join-Path $ProjectRoot ".build-tools\wix"
$installedWix = "${env:ProgramFiles(x86)}\WiX Toolset v3.14\bin"
if ((Test-Path (Join-Path $localWix "candle.exe")) -and (Test-Path (Join-Path $localWix "light.exe"))) {
    $env:PATH = "$localWix;$env:PATH"
} elseif ((Test-Path (Join-Path $installedWix "candle.exe")) -and (Test-Path (Join-Path $installedWix "light.exe"))) {
    $env:PATH = "$installedWix;$env:PATH"
} elseif (-not (Find-CommandPath "candle.exe")) {
    throw "WiX Toolset 3 blev ikke fundet. Installer WiX Toolset 3.14 før MSI-build."
}

Write-Host "[1/4] Installerer Python build-afhaengigheder..."
& $python -m pip install --disable-pip-version-check -r requirements/build.txt
if ($LASTEXITCODE -ne 0) { throw "Installation af Python build-afhaengigheder fejlede." }

Write-Host "[2/4] Pakker Python-runtime..."
& $python -m PyInstaller `
    --noconfirm `
    --clean `
    --onedir `
    --name RaceEngineerRuntime `
    --distpath dist-python `
    --workpath build\pyinstaller `
    --specpath build\pyinstaller `
    race_engineer/runtime.py
if ($LASTEXITCODE -ne 0) { throw "Pakning af Python-runtime fejlede." }

Write-Host "[3/4] Installerer Node build-afhaengigheder..."
& $npm install
if ($LASTEXITCODE -ne 0) { throw "npm install fejlede." }

Write-Host "[4/4] Bygger Race-Engineer MSI..."
& $npm run make
if ($LASTEXITCODE -ne 0) { throw "MSI-build fejlede." }

$msi = Get-ChildItem (Join-Path $ProjectRoot "out\make") -Recurse -Filter "*.msi" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $msi) { throw "Build blev faerdig, men ingen MSI-fil blev fundet." }
Write-Host "MSI klar: $($msi.FullName)"
