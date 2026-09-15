# ================================================================
#  Die oertliche Serverseite starten
# ================================================================
# Startet MariaDB aus XAMPP und den eingebauten PHP-Server, der api.php
# ausliefert - mit HB_CONFIG auf die Testdatenbank, damit nichts die
# Datenbank der Gruppe zu sehen bekommt.
#
#   .\dev\start.ps1          startet beides
#   .\dev\start.ps1 -Stop    beendet beides wieder
#   .\dev\start.ps1 -Neu     legt die Testdatenbank vorher neu an
#
# Danach steht die Schnittstelle unter http://127.0.0.1:8123/api.php.

param([switch]$Stop, [switch]$Neu)

$ErrorActionPreference = 'Stop'
$wurzel  = Split-Path -Parent $PSScriptRoot
$xampp   = 'C:\xampp'
$php     = Join-Path $xampp 'php\php.exe'
$mysqld  = Join-Path $xampp 'mysql\bin\mysqld.exe'
$myIni   = Join-Path $xampp 'mysql\bin\my.ini'
$port    = 8123

function Laeuft($p) {
  try { return [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop) }
  catch { return $false }
}

if ($Stop) {
  # MariaDB ordentlich herunterfahren. Frueher stand hier nur
  # Stop-Process -Force: das reisst InnoDB mitten im Schreiben ab, und am
  # 14.09.2026 war danach das ganze Datenverzeichnis unlesbar
  # ("unsupported undo header type"). Erzwungen wird erst, wenn der
  # Server nach zwanzig Sekunden immer noch laeuft.
  if (Get-Process mysqld -ErrorAction SilentlyContinue) {
    $admin = Join-Path $xampp 'mysql\bin\mysqladmin.exe'
    try { & $admin -u root shutdown 2>$null } catch {}
    $warte = 0
    while ((Get-Process mysqld -ErrorAction SilentlyContinue) -and $warte -lt 40) {
      Start-Sleep -Milliseconds 500; $warte++
    }
    Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
  }
  Get-CimInstance Win32_Process -Filter "Name='php.exe'" |
    Where-Object { $_.CommandLine -match "127.0.0.1:$port" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  Write-Output "Gestoppt."
  exit 0
}

if (-not (Test-Path $php))    { throw "PHP nicht gefunden: $php - XAMPP installiert?" }
if (-not (Test-Path $mysqld)) { throw "MariaDB nicht gefunden: $mysqld" }

# -- MariaDB --
if (Laeuft 3306) {
  Write-Output "MariaDB laeuft schon."
} else {
  # Ausgabe und Fehlerausgabe in eigene Dateien. Ohne das erbte mysqld die
  # Kanaele des aufrufenden Werkzeugs, und am 15.09.2026 landeten seine
  # Protokollzeilen in data\multi-master.info: danach brach jeder Start mit
  # "Failed to initialize multi master structures" ab.
  $mylog = Join-Path $env:TEMP 'heldenbuch-mysqld'
  Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=`"$myIni`"" -WindowStyle Hidden `
    -RedirectStandardOutput "$mylog.out" -RedirectStandardError "$mylog.err"
  $wartezeit = 0
  while (-not (Laeuft 3306) -and $wartezeit -lt 30) { Start-Sleep -Milliseconds 500; $wartezeit++ }
  if (Laeuft 3306) { Write-Output "MariaDB gestartet." } else { throw "MariaDB kam nicht hoch." }
}

if ($Neu) { & $php (Join-Path $PSScriptRoot 'db-neu.php'); if (-not $?) { throw "Datenbank-Neuanlage fehlgeschlagen." } }

# -- PHP --
# HB_CONFIG gilt nur fuer diesen Prozess. Auf dem Server wird die Variable
# ohnehin nicht gelesen, siehe api.php.
if (Laeuft $port) {
  Write-Output "PHP-Server laeuft schon auf $port."
} else {
  $env:HB_CONFIG = Join-Path $PSScriptRoot 'config.dev.php'
  Start-Process -FilePath $php `
    -ArgumentList "-S", "127.0.0.1:$port", "-t", "`"$wurzel`"" `
    -WindowStyle Hidden
  $wartezeit = 0
  while (-not (Laeuft $port) -and $wartezeit -lt 20) { Start-Sleep -Milliseconds 300; $wartezeit++ }
  if (Laeuft $port) { Write-Output "PHP-Server auf http://127.0.0.1:$port/api.php" }
  else { throw "PHP-Server kam nicht hoch." }
}
