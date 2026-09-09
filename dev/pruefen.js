// Heldenbuch — alle Rechnungspruefungen auf einmal.
//
//     node dev/pruefen.js
//
// Jede Datei unter dev/pruefungen/ prueft ein Stueck reine Rechnung: die
// Mathematik der Automaten, die Kampfkarte, den Charakterassistenten.
// Sie laufen ohne Browser, ohne Server und ohne Datenbank — sie lesen
// die Quelldateien, schneiden den Teil ohne React heraus und rechnen.
//
// Die Schnittstelle wird getrennt geprueft, mit echten HTTP-Anfragen:
//
//     C:/xampp/php/php.exe dev/test-api.php --neu
//
// Und die Oberflaeche in den Werkbankseiten daneben (tisch.html,
// karte-schau.html, assistent-schau.html) — die brauchen ein Auge.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ordner = path.join(__dirname, 'pruefungen');
const wurzel = path.join(__dirname, '..');
const dateien = fs.readdirSync(ordner).filter(f => f.endsWith('-test.js')).sort();

let gut = 0, schlecht = 0, kaputt = 0;
const breite = Math.max(...dateien.map(f => f.length)) + 2;

for (const datei of dateien) {
  let ausgabe = '';
  let heil = true;
  try {
    // Die Pruefungen lesen ihre Quellen ueber Pfade ab der Wurzel.
    ausgabe = execFileSync(process.execPath, [path.join(ordner, datei)],
      {cwd: wurzel, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  } catch (e) {
    heil = false;
    ausgabe = (e.stdout || '') + (e.stderr || '');
  }
  const zahl = /(\d+) Pruefungen gut, (\d+) schlecht/.exec(ausgabe);
  if (zahl) {
    gut += +zahl[1];
    schlecht += +zahl[2];
    const zeile = datei.padEnd(breite) + zahl[1].padStart(4) + ' gut'
      + (+zahl[2] ? ', ' + zahl[2] + ' SCHLECHT' : '');
    console.log(zeile);
    // Was schiefging, steht darunter — sonst muesste man die Datei
    // einzeln noch einmal laufen lassen, um es zu sehen.
    if (+zahl[2]) console.log(ausgabe.split('\n')
      .filter(z => /FEHLER|ist |soll /.test(z)).map(z => '   ' + z.trim()).join('\n'));
  } else {
    kaputt++;
    console.log(datei.padEnd(breite) + '  LIEF NICHT DURCH');
    console.log(ausgabe.split('\n').slice(0, 6).map(z => '   ' + z).join('\n'));
  }
  if (!heil && zahl && !+zahl[2]) kaputt++;   // Abbruch trotz gruener Zahl
}

console.log('\n' + '─'.repeat(breite + 20));
console.log(dateien.length + ' Dateien · ' + gut + ' Pruefungen gut, '
  + schlecht + ' schlecht'
  + (kaputt ? ', ' + kaputt + ' Datei(en) liefen nicht durch' : ''));
process.exit(schlecht || kaputt ? 1 : 0);
