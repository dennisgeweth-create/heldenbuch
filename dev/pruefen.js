// Heldenbuch — die Rechnungspruefungen.
//
//     node dev/pruefen.js                 alle, nebeneinander
//     node dev/pruefen.js kampf karte     nur, was im Namen passt
//     node dev/pruefen.js --geaendert     nur, was zu den geaenderten Dateien gehoert
//     node dev/pruefen.js --liste         welche Pruefung welche Quellen liest
//
// Jede Datei unter dev/pruefungen/ prueft ein Stueck reine Rechnung: die
// Mathematik der Automaten, die Kampfkarte, den Charakterassistenten.
// Sie laufen ohne Browser, ohne Server und ohne Datenbank — sie lesen
// die Quelldateien, schneiden den Teil ohne React heraus und rechnen.
//
// Die vierstellige Zahl am Ende zaehlt Behauptungen, nicht Dateien und
// nicht Sekunden: 1300 einzelne „das muss so sein". Das kostet zusammen
// ein paar Sekunden, weil alle Dateien nebeneinander laufen.
//
// Welche Pruefung wovon abhaengt, steht nirgends geschrieben — es wird
// aus ihr selbst gelesen: was sie mit readFileSync oeffnet, ist ihre
// Quelle. Wer eine Pruefung schreibt, pflegt damit keine zweite Liste.
// Eine Pruefung, die ihre Dateien erst zur Laufzeit zusammensucht (der
// Namenspruefer, die Walzen), haengt an allem und laeuft immer mit.
//
// Die Schnittstelle wird getrennt geprueft, mit echten HTTP-Anfragen:
//
//     C:/xampp/php/php.exe dev/test-api.php --neu
//
// Und die Oberflaeche in dev/echt.html. Die ist kein Schaustueck: sie
// faehrt die richtige Anwendung hoch — dieselbe app.js, derselbe
// Startweg wie in der index.html — und klickt sich hindurch. Das muss
// sein, weil hier nichts davon geprueft werden kann: ein Knopf, dessen
// onClick eine geloeschte Funktion ruft, uebersetzt sauber und faellt
// erst beim Klicken um. Genau so ging „Als Text" von v5.3.1 bis v5.3.4
// nicht auf, waehrend hier alles gruen war.
//
// Daneben die Schaustuecke, die ein Auge brauchen und keines ersetzen:
// tisch.html, karte-schau.html, assistent-schau.html, bogen-schau.html.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, execFileSync } = require('child_process');

const ordner = path.join(__dirname, 'pruefungen');
const wurzel = path.join(__dirname, '..');
const alle = fs.readdirSync(ordner).filter(f => f.endsWith('-test.js')).sort();

// ── Wozu eine Pruefung gehoert ───────────────────────────────────
// Nur fuer die Ausgabe: sie soll sich lesen lassen wie das Projekt
// aussieht, und nicht wie das Alphabet.
const BEREICHE = [
  {name: 'Abenteuerplaner', passt: (f) => /^planer-/.test(f) || f === 'bruecke-test.js'},
  {name: 'Kampf und Karte', passt: (f) => /^(karte|import|kopieren|gegner|rueck)/.test(f)},
  {name: 'Taverne',         passt: (f) => /^(arena|auge|buch|walzen)-/.test(f)},
  {name: 'Der Bogen',       passt: (f) => /^(assistent|bogentext|heldtext|laden|mensch|nsc|rast)-/.test(f)},
  {name: 'Das Gerüst',      passt: () => true},
];
const bereichNr = (f) => { const i = BEREICHE.findIndex(b => b.passt(f)); return i < 0 ? BEREICHE.length - 1 : i; };
const bereichVon = (f) => BEREICHE[bereichNr(f)].name;
// Nach Bereich sortiert, darin nach Namen: so steht jede Ueberschrift
// genau einmal da.
const nachBereich = (liste) => [...liste].sort((a, b) => bereichNr(a) - bereichNr(b) || a.localeCompare(b));

// ── Woran eine Pruefung haengt ───────────────────────────────────
// Gelesen wird die Pruefung selbst. Gesucht wird nicht nach readFileSync
// — die Pruefungen lesen durch eigene Huellen (stueck, lade) —, sondern
// nach dem, was in jedem Fall dasteht: Pfade als Zeichenkette.
//
//   'js/src/2c-kampf.jsx'            eine Datei
//   'planer/src/' + n + '.jsx'       ein Ordner: dann zaehlt alles darin
//
// Wer gar keinen Pfad nennt, sucht sich seine Dateien zur Laufzeit (der
// Namenspruefer). Der haengt an allem und laeuft immer mit.
// Ein Pfad zaehlt nur, wenn sein erstes Stueck im Projekt wirklich
// existiert. Sonst zaehlten auch Beispieldaten aus den Pruefungen mit —
// "Musik/Taverne.mp3", "/etc/passwd".
const WURZELN = new Set(fs.readdirSync(wurzel));
const ENDUNGEN = /\.(jsx?|php|md|ps1|json|html|css)$/;
const quellenVon = (datei) => {
  const text = fs.readFileSync(path.join(ordner, datei), 'utf8');
  const dateien = new Set(), ordnerliste = new Set();
  const nimm = (roh) => {
    const w = String(roh).replace(/\\/g, '/').replace(/^(?:\.\.\/)+/, '');
    if (!WURZELN.has(w.split('/')[0])) return;
    if (ENDUNGEN.test(w)) dateien.add(w);
    else ordnerliste.add(w.endsWith('/') ? w : w + '/');
  };
  for (const m of text.matchAll(/(['"])([\w./+-]{4,120})\1/g)) nimm(m[2]);
  // path.join('js', 'util.js') — dieselbe Angabe, nur zerlegt.
  for (const m of text.matchAll(/path\.join\(([^)]*)\)/g)) {
    const teile = [...m[1].matchAll(/(['"])([^'"]+)\1/g)].map(t => t[2]);
    if (teile.length) nimm(teile.join('/'));
  }
  return {dateien: [...dateien], ordner: [...ordnerliste],
          offen: !dateien.size && !ordnerliste.size};
};
const karte = new Map(alle.map(f => [f, quellenVon(f)]));
// Gehoert diese geaenderte Datei zu dieser Pruefung?
const betrifft = (pruefung, geaendert) => {
  const q = karte.get(pruefung);
  if (q.offen) return true;
  if (geaendert.includes('dev/pruefungen/' + pruefung)) return true;
  return geaendert.some(g => q.dateien.includes(g) || q.ordner.some(o => g.startsWith(o)));
};

// ── Was gerade geaendert ist ─────────────────────────────────────
const geaenderteDateien = () => {
  try {
    const aus = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'],
      {cwd: wurzel, encoding: 'utf8'});
    return aus.split('\n').map(z => z.slice(3).trim())
      .map(z => z.includes(' -> ') ? z.split(' -> ')[1] : z)
      .map(z => z.replace(/^"|"$/g, '')).filter(Boolean);
  } catch (e) {
    return null;                       // kein git: dann lieber alles
  }
};

// ── Die Auswahl ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const nurGeaendert = args.includes('--geaendert');
const nurListe = args.includes('--liste');
const muster = args.filter(a => !a.startsWith('--'));

if (nurListe) {
  const breiteL = Math.max(...alle.map(f => f.length)) + 2;
  for (const f of alle) {
    const q = karte.get(f);
    console.log(f.padEnd(breiteL) + (q.offen
      ? '(sucht seine Dateien selbst — laeuft immer mit)'
      : [...q.dateien, ...q.ordner.map(o => o + '*')].join(', ')));
  }
  process.exit(0);
}

let dateien = alle;
let grund = '';
if (muster.length) {
  dateien = alle.filter(f => muster.some(m => f.includes(m)));
  grund = 'Muster: ' + muster.join(', ');
}
if (nurGeaendert) {
  const geaendert = geaenderteDateien();
  if (geaendert === null) {
    grund = 'git antwortet nicht — es laufen alle';
  } else if (!geaendert.length) {
    dateien = [];
    grund = 'nichts geaendert';
  } else {
    dateien = dateien.filter(f => betrifft(f, geaendert));
    grund = geaendert.length + ' geaenderte Datei(en)';
  }
}

// ── Laufen lassen, nebeneinander ─────────────────────────────────
// Sechzehn Kerne stehen daneben und warten; vorher liefen die Dateien
// nacheinander, und die drei langsamen bestimmten die Wartezeit.
const gleichzeitig = Math.max(2, Math.min(8, os.cpus().length));
const einzeln = (datei) => new Promise((fertig) => {
  const start = Date.now();
  execFile(process.execPath, [path.join(ordner, datei)],
    {cwd: wurzel, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024},
    (fehler, aus, err) => fertig({datei, ms: Date.now() - start, heil: !fehler, ausgabe: (aus || '') + (err || '')}));
});
const nebenher = async (liste, breite, arbeit) => {
  const raus = new Array(liste.length);
  let naechste = 0;
  await Promise.all(Array.from({length: Math.min(breite, liste.length)}, async () => {
    while (naechste < liste.length) {
      const i = naechste++;
      raus[i] = await arbeit(liste[i]);
    }
  }));
  return raus;
};

(async () => {
  if (!dateien.length) {
    console.log('Keine Pruefung ausgewaehlt' + (grund ? ' (' + grund + ')' : '') + '.');
    process.exit(0);
  }
  const t0 = Date.now();
  const ergebnisse = await nebenher(nachBereich(dateien), gleichzeitig, einzeln);

  let gut = 0, schlecht = 0, kaputt = 0;
  const breite = Math.max(...dateien.map(f => f.length)) + 2;
  let letzterBereich = '', bereichGut = 0, bereichZahl = 0;
  const bereichSchluss = () => {
    if (letzterBereich) console.log('  ' + ''.padEnd(breite) + '────'
      + '  ' + bereichGut + ' in ' + bereichZahl + (bereichZahl === 1 ? ' Datei' : ' Dateien'));
    bereichGut = 0; bereichZahl = 0;
  };
  for (const e of ergebnisse) {
    const bereich = bereichVon(e.datei);
    if (bereich !== letzterBereich) {
      bereichSchluss();
      console.log((letzterBereich ? '\n' : '') + '── ' + bereich + ' ' + '─'.repeat(Math.max(0, breite + 8 - bereich.length)));
      letzterBereich = bereich;
    }
    const zahl = /(\d+) Pruefungen gut, (\d+) schlecht/.exec(e.ausgabe);
    if (zahl) {
      gut += +zahl[1];
      schlecht += +zahl[2];
      bereichGut += +zahl[1];
      bereichZahl++;
      console.log('  ' + e.datei.padEnd(breite) + zahl[1].padStart(4) + ' gut'
        + (+zahl[2] ? ', ' + zahl[2] + ' SCHLECHT' : ''));
      // Was schiefging, steht darunter — sonst muesste man die Datei
      // einzeln noch einmal laufen lassen, um es zu sehen.
      if (+zahl[2]) console.log(e.ausgabe.split('\n')
        .filter(z => /FEHLER|ist |soll /.test(z)).map(z => '   ' + z.trim()).join('\n'));
      if (!e.heil && !+zahl[2]) kaputt++;                // Abbruch trotz gruener Zahl
    } else {
      kaputt++;
      bereichZahl++;
      console.log('  ' + e.datei.padEnd(breite) + '  LIEF NICHT DURCH');
      console.log(e.ausgabe.split('\n').slice(0, 6).map(z => '   ' + z).join('\n'));
    }
  }
  bereichSchluss();

  const sekunden = ((Date.now() - t0) / 1000).toFixed(1).replace('.', ',');
  console.log('\n' + '─'.repeat(breite + 20));
  console.log(dateien.length + ' von ' + alle.length + ' Dateien'
    + (grund ? ' (' + grund + ')' : '') + ' · ' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht'
    + (kaputt ? ', ' + kaputt + ' Datei(en) liefen nicht durch' : '')
    + ' · ' + sekunden + ' s');
  // Hier endet, was ohne Browser zu pruefen ist. Dass der Rest daneben
  // steht, soll niemand vergessen — er hat schon einmal drei Ausgaben
  // lang gefehlt.
  if (!muster.length && !nurGeaendert && dateien.length === alle.length) {
    console.log('Nur das Geaenderte:  node dev/pruefen.js --geaendert'
      + '   ·   nur eines:  node dev/pruefen.js ' + alle[0].replace('-test.js', ''));
  }
  console.log('\nDie Oberflaeche prueft das hier nicht. Wer an der Anwendung war:');
  console.log('    python devserver.py   →   http://localhost:8777/dev/echt.html');
  console.log('                              http://localhost:8777/dev/planer-echt.html');
  process.exit(schlecht || kaputt ? 1 : 0);
})();
