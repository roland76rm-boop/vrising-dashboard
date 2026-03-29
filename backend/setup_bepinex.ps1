#Requires -RunAsAdministrator
<#
.SYNOPSIS
    V Rising BepInEx + VRisingDiscordBotCompanion Setup
.DESCRIPTION
    Installiert automatisch:
      1. BepInExPack V Rising (Thunderstore)
      2. VRisingDiscordBotCompanion Plugin (DarkAtra/GitHub)
      3. Python + Poller-Script fuer automatisches Dashboard-Update

    Ausfuehren als Administrator:
      Right-Click → "Als Administrator ausfuehren"
      oder: powershell -ExecutionPolicy Bypass -File setup_bepinex.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Farben-Helfer ───────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n[>>>] $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg"  -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  [!!] $msg"  -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  [XX] $msg"  -ForegroundColor Red }

# ─── Konfiguration ───────────────────────────────────────────────────────────
$VRisingPath   = "D:\SteamLibrary\steamapps\common\VRising"
$PollerScript  = "$PSScriptRoot\poller.py"
$TempDir       = "$env:TEMP\vrising_setup"
$BepInExPort   = 9876   # Port des VRisingDiscordBotCompanion

# V Rising Pfad pruefen / automatisch suchen
Write-Step "V Rising Installation suchen..."
if (-not (Test-Path "$VRisingPath\VRising.exe")) {
    Write-Warn "Nicht gefunden unter $VRisingPath — suche automatisch..."

    $steamPaths = @(
        "C:\Program Files (x86)\Steam\steamapps\common\VRising",
        "C:\Program Files\Steam\steamapps\common\VRising",
        "D:\Steam\steamapps\common\VRising",
        "E:\Steam\steamapps\common\VRising",
        "E:\SteamLibrary\steamapps\common\VRising",
    )
    # Steam Registry
    try {
        $steamReg = Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Valve\Steam" -ErrorAction SilentlyContinue
        if ($steamReg) { $steamPaths += "$($steamReg.InstallPath)\steamapps\common\VRising" }
    } catch {}

    $VRisingPath = $steamPaths | Where-Object { Test-Path "$_\VRising.exe" } | Select-Object -First 1

    if (-not $VRisingPath) {
        Write-Fail "V Rising nicht gefunden! Bitte Pfad in setup_bepinex.ps1 manuell setzen."
        exit 1
    }
}
Write-Ok "V Rising gefunden: $VRisingPath"

# Temp-Verzeichnis
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

# ─── 1. BepInExPack V Rising ─────────────────────────────────────────────────
Write-Step "BepInExPack V Rising herunterladen (Thunderstore)..."

# Aktuelle Version ueber Thunderstore API ermitteln
$tsApi = Invoke-RestMethod "https://thunderstore.io/api/v1/package/BepInEx-BepInExPack_V_Rising/" -UseBasicParsing
$latestVersion = $tsApi.latest.version_number
$bepinexUrl = "https://thunderstore.io/package/download/BepInEx/BepInExPack_V_Rising/$latestVersion/"
Write-Ok "Version: $latestVersion"

$bepinexZip = "$TempDir\BepInExPack_VRising.zip"
Write-Host "  Lade herunter: $bepinexUrl" -ForegroundColor DarkGray
Invoke-WebRequest -Uri $bepinexUrl -OutFile $bepinexZip -UseBasicParsing
Write-Ok "Download abgeschlossen ($([math]::Round((Get-Item $bepinexZip).Length / 1MB, 1)) MB)"

# Entpacken — nur Inhalt, nicht den uebergeordneten Ordner
Write-Step "BepInEx entpacken nach $VRisingPath ..."
$bepinexExtract = "$TempDir\BepInExPack"
Expand-Archive -Path $bepinexZip -DestinationPath $bepinexExtract -Force

# Thunderstore Packs haben meist einen Unterordner
$innerDir = Get-ChildItem $bepinexExtract -Directory | Select-Object -First 1
$sourceDir = if ($innerDir) { $innerDir.FullName } else { $bepinexExtract }

# Dateien kopieren
Copy-Item "$sourceDir\*" -Destination $VRisingPath -Recurse -Force
Write-Ok "BepInEx installiert"

# ─── 2. VRisingDiscordBotCompanion Plugin ────────────────────────────────────
Write-Step "VRisingDiscordBotCompanion Plugin herunterladen (DarkAtra/Thunderstore)..."

$pluginApi = Invoke-RestMethod "https://thunderstore.io/api/v1/package/DarkAtra-VRisingDiscordBotCompanion/" -UseBasicParsing
$pluginVersion = $pluginApi.latest.version_number
$pluginUrl = "https://thunderstore.io/package/download/DarkAtra/VRisingDiscordBotCompanion/$pluginVersion/"
Write-Ok "Plugin Version: $pluginVersion"

$pluginZip = "$TempDir\VRisingDiscordBotCompanion.zip"
Invoke-WebRequest -Uri $pluginUrl -OutFile $pluginZip -UseBasicParsing
Write-Ok "Download abgeschlossen"

# Plugin in BepInEx/plugins entpacken
$pluginsDir = "$VRisingPath\BepInEx\plugins"
New-Item -ItemType Directory -Force -Path $pluginsDir | Out-Null
$pluginExtract = "$TempDir\VRisingPlugin"
Expand-Archive -Path $pluginZip -DestinationPath $pluginExtract -Force

# DLLs in plugins kopieren
Get-ChildItem $pluginExtract -Recurse -Filter "*.dll" | ForEach-Object {
    Copy-Item $_.FullName -Destination $pluginsDir -Force
    Write-Ok "Plugin kopiert: $($_.Name)"
}

# ─── 3. Plugin-Konfiguration erstellen ───────────────────────────────────────
Write-Step "Plugin-Konfiguration erstellen..."
$configDir = "$VRisingPath\BepInEx\config"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

$configContent = @"
[Bot Companion]
# HTTP API Port
ApiPort = $BepInExPort

# Endpoints aktivieren
EnableCharactersEndpoint = true
EnableVBloodKillsEndpoint = true
EnablePlayerActivitiesEndpoint = true
"@

$configFile = "$configDir\DarkAtra.VRisingDiscordBotCompanion.cfg"
Set-Content -Path $configFile -Value $configContent -Encoding UTF8
Write-Ok "Konfiguration: $configFile (Port $BepInExPort)"

# ─── 4. Python + Poller einrichten ───────────────────────────────────────────
Write-Step "Python pruefen..."
$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3") { $python = $cmd; break }
    } catch {}
}

if (-not $python) {
    Write-Warn "Python nicht gefunden — bitte Python 3 von https://python.org installieren"
    Write-Warn "Danach: pip install requests schedule"
} else {
    Write-Ok "Python gefunden: $(&$python --version)"

    # Abhaengigkeiten installieren
    Write-Host "  Installiere requests + schedule..." -ForegroundColor DarkGray
    & $python -m pip install requests schedule --quiet
    Write-Ok "Python-Pakete installiert"

    # poller.py ins VRising-Verzeichnis kopieren
    if (Test-Path $PollerScript) {
        $pollerDest = "$VRisingPath\vrising_poller.py"
        Copy-Item $PollerScript $pollerDest -Force
        Write-Ok "Poller kopiert: $pollerDest"

        # Batch-Datei zum einfachen Starten erstellen
        $batchContent = "@echo off`n$python `"$pollerDest`"`npause"
        Set-Content "$VRisingPath\START_POLLER.bat" $batchContent
        Write-Ok "Starter erstellt: $VRisingPath\START_POLLER.bat"
    } else {
        Write-Warn "poller.py nicht gefunden — nach dem ersten Spielstart manuell starten"
    }
}

# ─── 5. Firewall-Regel (optional) ────────────────────────────────────────────
Write-Step "Windows Firewall Regel fuer Port $BepInExPort..."
try {
    $existing = Get-NetFirewallRule -DisplayName "VRising BepInEx API" -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName "VRising BepInEx API" `
            -Direction Inbound -Protocol TCP -LocalPort $BepInExPort `
            -Action Allow -Profile Any | Out-Null
        Write-Ok "Firewall-Regel erstellt (Port $BepInExPort eingehend)"
    } else {
        Write-Ok "Firewall-Regel bereits vorhanden"
    }
} catch {
    Write-Warn "Firewall-Regel konnte nicht erstellt werden: $_"
}

# ─── Fertig ──────────────────────────────────────────────────────────────────
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "  INSTALLATION ABGESCHLOSSEN!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Cyan
Write-Host @"

Naechste Schritte:
  1. V Rising EINMAL starten (BepInEx initialisiert sich)
  2. Spiel wieder schliessen
  3. Pruefen ob BepInEx\LogOutput.log existiert
  4. V Rising erneut starten → Plugin laeuft auf Port $BepInExPort
  5. Testen: http://localhost:$BepInExPort/v-rising-discord-bot/characters
  6. Poller starten: $VRisingPath\START_POLLER.bat

Plugin API-Endpunkte (wenn Spiel laeuft):
  GET http://localhost:$BepInExPort/v-rising-discord-bot/characters
  GET http://localhost:$BepInExPort/v-rising-discord-bot/vblood-kills
  GET http://localhost:$BepInExPort/v-rising-discord-bot/player-activities

Dashboard: https://v-rising.vercel.app
"@ -ForegroundColor White

# Temp aufraumen
Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
