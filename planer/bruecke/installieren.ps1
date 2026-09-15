# ================================================================
#  Planer-Bruecke einrichten (oder entfernen)
# ================================================================
# Einmal je Rechner, von Hand, als der eigene Benutzer — ohne
# Administratorrechte. Was es tut:
#
#  1. kopiert planer-bruecke.ps1 nach %APPDATA%\Heldenbuch-Planer
#  2. legt dort bibliotheken.json an bzw. traegt eine Bibliothek ein
#  3. meldet das Link-Schema heldenbuch-planer:// fuer diesen Benutzer an
#     (HKEY_CURRENT_USER\Software\Classes\heldenbuch-planer)
#
#   .\installieren.ps1 -Bibliothek Kampagne -Ordner "C:\Users\ich\OneDrive\Kampagne"
#   .\installieren.ps1 -Vlc "C:\Program Files\VideoLAN\VLC\vlc.exe"
#   .\installieren.ps1 -Entfernen
#
# Auf jedem Rechner kann dieselbe Bibliothek in einem anderen Ordner
# liegen; der Planer speichert nur Name und relativen Pfad.

param(
  [string]$Bibliothek = '',
  [string]$Ordner = '',
  [string]$Vlc = '',
  [switch]$Entfernen
)

$ErrorActionPreference = 'Stop'
$ziel = Join-Path $env:APPDATA 'Heldenbuch-Planer'
$schluessel = 'HKCU:\Software\Classes\heldenbuch-planer'

if ($Entfernen) {
  if (Test-Path $schluessel) { Remove-Item $schluessel -Recurse -Force }
  Write-Output "Das Link-Schema ist abgemeldet. Die Einstellungen in $ziel bleiben; sie lassen sich von Hand löschen."
  exit 0
}

New-Item -ItemType Directory -Force $ziel | Out-Null
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'planer-bruecke.ps1') -Destination (Join-Path $ziel 'planer-bruecke.ps1') -Force

$einst = Join-Path $ziel 'bibliotheken.json'
$bib = [ordered]@{}
if (Test-Path $einst) {
  (Get-Content $einst -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $bib[$_.Name] = $_.Value }
}
if ($Bibliothek) {
  if ($Bibliothek -notmatch '^[\p{L}\p{N} _-]{1,40}$') { throw 'Der Name darf nur Buchstaben, Ziffern, Leerzeichen, - und _ enthalten.' }
  if (-not (Test-Path -LiteralPath $Ordner -PathType Container)) { throw "Den Ordner gibt es nicht: $Ordner" }
  $bib[$Bibliothek] = [System.IO.Path]::GetFullPath($Ordner)
  Write-Output "Bibliothek „$Bibliothek“ → $($bib[$Bibliothek])"
}
if ($Vlc) {
  if (-not (Test-Path -LiteralPath $Vlc -PathType Leaf)) { throw "VLC nicht gefunden: $Vlc" }
  $bib['_vlc'] = $Vlc
}
($bib | ConvertTo-Json) | Set-Content -LiteralPath $einst -Encoding UTF8

New-Item -Path $schluessel -Force | Out-Null
Set-ItemProperty -Path $schluessel -Name '(default)' -Value 'URL:Heldenbuch-Planer'
Set-ItemProperty -Path $schluessel -Name 'URL Protocol' -Value ''
$befehl = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + (Join-Path $ziel 'planer-bruecke.ps1') + '" "%1"'
New-Item -Path "$schluessel\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "$schluessel\shell\open\command" -Name '(default)' -Value $befehl

Write-Output "Die Planer-Brücke ist eingerichtet. Bibliotheken: $(@($bib.Keys | Where-Object { -not $_.StartsWith('_') }) -join ', ')"
Write-Output 'Beim ersten Klick fragt der Browser, ob er „heldenbuch-planer“ öffnen darf.'
