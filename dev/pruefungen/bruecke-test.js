// Prueft die Planer-Bruecke (planer/bruecke/planer-bruecke.ps1), ohne sie
// einzurichten: sie laeuft mit -NurPruefen gegen einen Wegwerfordner und
// eine eigene Einstellungsdatei, oeffnet nichts und fasst die Registry
// nicht an. Nur unter Windows; anderswo steht eine Null da.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

if (process.platform !== 'win32') {
  console.log('  (übersprungen: keine Windows-PowerShell)');
  console.log('\n0 Pruefungen gut, 0 schlecht.');
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hb-bruecke-'));
const bib = path.join(tmp, 'Kampagne');
fs.mkdirSync(path.join(bib, 'Musik'), { recursive: true });
fs.writeFileSync(path.join(bib, 'Musik', 'Taverne & Tanz.mp3'), 'x');
fs.writeFileSync(path.join(bib, 'boese.exe'), 'x');
fs.writeFileSync(path.join(tmp, 'geheim.txt'), 'x');
fs.mkdirSync(path.join(tmp, 'Kampagne2'));
fs.writeFileSync(path.join(tmp, 'Kampagne2', 'nachbar.txt'), 'x');
const einst = path.join(tmp, 'bibliotheken.json');
fs.writeFileSync(einst, JSON.stringify({ Kampagne: bib, _vlc: 'C:\\gibtsnicht\\vlc.exe' }));

const ps1 = path.resolve('planer/bruecke/planer-bruecke.ps1');
const lauf = (adresse) => {
  const r = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, adresse, '-Einstellungen', einst, '-NurPruefen'],
    { encoding: 'utf8' });
  return { code: r.status, aus: (r.stdout || '').trim(), fehler: (r.stderr || '').trim() };
};
const adr = (b, p) => 'heldenbuch-planer://oeffnen?bibliothek=' + encodeURIComponent(b) + '&pfad=' + encodeURIComponent(p);

const gutLauf = lauf(adr('Kampagne', 'Musik/Taverne & Tanz.mp3'));
ist('eine erlaubte Datei in der Bibliothek wird gefunden', [gutLauf.code, gutLauf.aus.toLowerCase()], [0, path.join(bib, 'Musik', 'Taverne & Tanz.mp3').toLowerCase()]);
const abgewiesen = (n, adresse, muster) => {
  const r = lauf(adresse);
  ist(n, r.code === 1 && muster.test(r.fehler), true);
  if (!(r.code === 1 && muster.test(r.fehler))) console.log('     ' + r.code + ' ' + r.fehler + ' ' + r.aus);
};
abgewiesen('.. verlässt den Ordner nicht', adr('Kampagne', '../geheim.txt'), /verlässt den Ordner/);
abgewiesen('  … auch nicht mit Backslashes', adr('Kampagne', 'Musik\\..\\..\\geheim.txt'), /verlässt den Ordner/);
abgewiesen('  … auch nicht in den Nachbarordner mit ähnlichem Namen', adr('Kampagne', '..\\Kampagne2\\nachbar.txt'), /verlässt den Ordner/);
abgewiesen('absolute Pfade nicht', adr('Kampagne', 'C:\\Windows\\win.ini'), /Absolute Pfade/);
abgewiesen('  … auch nicht als Netzwerkpfad', adr('Kampagne', '\\\\server\\freigabe\\x.mp3'), /Absolute Pfade|verlässt/);
abgewiesen('Programme nicht', adr('Kampagne', 'boese.exe'), /Typ \.exe/);
abgewiesen('eine unbekannte Bibliothek nicht', adr('Fremd', 'Musik/Taverne & Tanz.mp3'), /nicht eingerichtet/);
abgewiesen('die Einstellung für VLC ist keine Bibliothek', adr('_vlc', 'x.mp3'), /Keine Bibliothek/);
abgewiesen('ein fehlende Datei wird genannt', adr('Kampagne', 'Musik/fehlt.mp3'), /Nicht gefunden/);
abgewiesen('ein fremdes Schema nicht', 'http://oeffnen?bibliothek=Kampagne&pfad=x.mp3', /Schema/);
abgewiesen('ein anderer Auftrag nicht', 'heldenbuch-planer://loeschen?bibliothek=Kampagne&pfad=x.mp3', /Auftrag/);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
