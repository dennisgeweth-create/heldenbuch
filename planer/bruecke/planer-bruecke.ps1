# ================================================================
#  Planer-Bruecke: oeffnet lokale Dateien aus dem Abenteuerplaner
# ================================================================
# Eine Webseite darf keine Programme auf dem Rechner starten. Diese
# Bruecke tut es, aber nur so:
#
#   heldenbuch-planer://oeffnen?bibliothek=Kampagne&pfad=Musik%2FTaverne.mp3
#
#  - Eine Bibliothek ist ein Name, dem dieser Rechner einen Ordner
#    zuordnet (%APPDATA%\Heldenbuch-Planer\bibliotheken.json). Andere
#    Namen gibt es nicht.
#  - Der Pfad muss innerhalb dieses Ordners bleiben: kein .., kein
#    Laufwerk, kein absoluter Pfad.
#  - Geoeffnet werden nur Medien und Dokumente, nie Programme oder
#    Skripte (Liste $Erlaubt unten; planer-welt-test.js prueft, dass sie
#    zu DATEI_ARTEN im Planer passt).
#  - Die Datei oeffnet das Programm, das Windows dafuer eingestellt hat;
#    Videos auf Wunsch VLC (Eintrag "_vlc" in bibliotheken.json).
#
# Eingerichtet wird mit installieren.ps1. Mit -NurPruefen oeffnet die
# Bruecke nichts, sondern nennt nur den Pfad (fuer dev/bruecke-test.ps1).

param(
  [Parameter(Position = 0)][string]$Adresse = '',
  [string]$Einstellungen = (Join-Path $env:APPDATA 'Heldenbuch-Planer\bibliotheken.json'),
  [switch]$NurPruefen
)

$ErrorActionPreference = 'Stop'
# Fuer die Pruefung: Meldungen in UTF-8, sonst kommen Umlaute im Codepage der Konsole an.
if ($NurPruefen) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 }
$Schema = 'heldenbuch-planer'
$Erlaubt = @(
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'svg',
  'mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus',
  'mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'ogv',
  'pdf', 'txt', 'md', 'html', 'htm', 'docx', 'odt', 'xlsx', 'ods', 'pptx', 'epub', 'cbz'
)
$Videos = @('mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'ogv')

function Melde([string]$Text) {
  if ($NurPruefen) { [Console]::Error.WriteLine($Text); exit 1 }
  Add-Type -AssemblyName System.Windows.Forms
  [void][System.Windows.Forms.MessageBox]::Show($Text, 'Planer-Brücke', 'OK', 'Warning')
  exit 1
}

# -- Die Adresse lesen --
function Lies-Adresse([string]$Roh) {
  $uri = $null
  if (-not [System.Uri]::TryCreate($Roh, [System.UriKind]::Absolute, [ref]$uri)) { Melde 'Die Adresse ist unlesbar.' }
  if ($uri.Scheme -ne $Schema) { Melde ('Unbekanntes Schema: ' + $uri.Scheme) }
  if ($uri.Host -ne 'oeffnen') { Melde ('Unbekannter Auftrag: ' + $uri.Host) }
  $werte = @{}
  foreach ($teil in $uri.Query.TrimStart('?').Split('&')) {
    if (-not $teil) { continue }
    $kv = $teil.Split('=', 2)
    $werte[[System.Uri]::UnescapeDataString($kv[0])] = if ($kv.Length -gt 1) { [System.Uri]::UnescapeDataString($kv[1].Replace('+', ' ')) } else { '' }
  }
  return @{ Bibliothek = [string]$werte['bibliothek']; Pfad = [string]$werte['pfad'] }
}

# -- Die Datei finden, ohne den Ordner zu verlassen --
function Finde-Datei([string]$Bibliothek, [string]$Pfad) {
  if (-not (Test-Path -LiteralPath $Einstellungen)) { Melde ('Noch keine Bibliothek eingerichtet. Bitte installieren.ps1 ausführen.') }
  $bib = Get-Content -LiteralPath $Einstellungen -Raw -Encoding UTF8 | ConvertFrom-Json
  if (-not $Bibliothek -or $Bibliothek.StartsWith('_')) { Melde 'Keine Bibliothek genannt.' }
  $wurzel = $bib.PSObject.Properties | Where-Object { $_.Name -eq $Bibliothek } | Select-Object -First 1
  if (-not $wurzel) { Melde ('Die Bibliothek "' + $Bibliothek + '" ist auf diesem Rechner nicht eingerichtet.') }
  $wurzelPfad = [System.IO.Path]::GetFullPath([string]$wurzel.Value).TrimEnd('\')

  $rel = $Pfad.Replace('/', '\')
  if (-not $rel) { Melde 'Kein Pfad genannt.' }
  if ([System.IO.Path]::IsPathRooted($rel) -or $rel.Contains(':')) { Melde 'Absolute Pfade öffnet die Brücke nicht.' }
  foreach ($seg in $rel.Split('\')) { if ($seg -eq '..') { Melde 'Die Brücke verlässt den Ordner der Bibliothek nicht.' } }
  if ($rel.IndexOfAny([System.IO.Path]::GetInvalidPathChars()) -ge 0) { Melde 'Der Pfad enthält ungültige Zeichen.' }

  $voll = [System.IO.Path]::GetFullPath((Join-Path $wurzelPfad $rel))
  if (-not $voll.StartsWith($wurzelPfad + '\', [System.StringComparison]::OrdinalIgnoreCase)) { Melde 'Die Brücke verlässt den Ordner der Bibliothek nicht.' }

  $endung = [System.IO.Path]::GetExtension($voll).TrimStart('.').ToLowerInvariant()
  if ($Erlaubt -notcontains $endung) { Melde ('Dateien vom Typ .' + $endung + ' öffnet die Brücke nicht.') }
  if (-not (Test-Path -LiteralPath $voll -PathType Leaf)) { Melde ('Nicht gefunden auf diesem Rechner: ' + $rel) }
  return @{ Voll = $voll; Endung = $endung; Vlc = [string]($bib.PSObject.Properties | Where-Object { $_.Name -eq '_vlc' } | Select-Object -First 1 -ExpandProperty Value) }
}

$auftrag = Lies-Adresse $Adresse
$datei = Finde-Datei $auftrag.Bibliothek $auftrag.Pfad
if ($NurPruefen) { Write-Output $datei.Voll; exit 0 }

if ($Videos -contains $datei.Endung -and $datei.Vlc -and (Test-Path -LiteralPath $datei.Vlc)) {
  Start-Process -FilePath $datei.Vlc -ArgumentList ('"' + $datei.Voll + '"')
} else {
  Start-Process -FilePath $datei.Voll
}
