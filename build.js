#!/usr/bin/env node
/**
 * Setzt die Quelldateien aus js/src/ zusammen und uebersetzt sie nach
 * js/app.js — und ebenso planer/src/ nach planer/planer.js. Zwei Buendel,
 * weil der Abenteuerplaner eine eigene Seite ist: das Heldenbuch soll
 * seine Kartenbibliothek nicht mitladen muessen.
 *
 * Zusammensetzen statt Importieren: die Dateien teilen sich einen
 * Geltungsbereich, genau wie frueher im einen grossen Script-Block. Damit
 * brauchte die Aufteilung keine einzige Zeile Anwendungscode zu aendern —
 * und es braucht keinen Bundler.
 *
 * Nutzt bewusst das bereits vorhandene vendor/babel.min.js statt eines
 * npm-Pakets: kein package.json, kein node_modules, kein Installationsschritt
 * — weder hier noch in der GitHub-Action. Node allein genuegt.
 *
 *     node build.js            baut einmal
 *     node build.js --check    prueft nur, ob beide Buendel aktuell sind (Exit 1 wenn nicht)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const wurzel = __dirname;
const babelDatei = path.join(wurzel, 'vendor', 'babel.min.js');

// Jedes Buendel: woher, wohin, und wie es im Kopf der Datei heisst.
const BUENDEL = [
  {quelle: path.join(wurzel, 'js', 'src'),     ziel: path.join(wurzel, 'js', 'app.js'),         name: 'js/app.js',        praefix: 'js/src/'},
  {quelle: path.join(wurzel, 'planer', 'src'), ziel: path.join(wurzel, 'planer', 'planer.js'),  name: 'planer/planer.js', praefix: 'planer/src/'},
];

// Die Reihenfolge ergibt sich aus dem Dateinamen (1-, 2-, …) und zaehlt:
// Sheet muss vor App stehen, beide nach den Bausteinen.
function quelldateien(quellordner) {
  return fs.readdirSync(quellordner).filter((n) => n.endsWith('.jsx')).sort();
}

function ladeBabel() {
  const sandbox = { window: {}, self: {}, navigator: { userAgent: 'node' }, console };
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(babelDatei, 'utf8'), sandbox, { filename: 'babel.min.js' });
  const Babel = sandbox.Babel || sandbox.window.Babel;
  if (!Babel || typeof Babel.transform !== 'function') {
    throw new Error('Babel liess sich aus ' + babelDatei + ' nicht laden.');
  }
  return Babel;
}

let babel = null;
function uebersetze(b) {
  const dateien = quelldateien(b.quelle);
  if (!dateien.length) throw new Error('Keine .jsx-Dateien in ' + b.quelle);
  // Trennzeile je Datei, damit im Ergebnis erkennbar bleibt, woher ein
  // Abschnitt stammt.
  const jsx = dateien
    .map((n) => '\n// ==== ' + b.praefix + n + ' ====\n' + fs.readFileSync(path.join(b.quelle, n), 'utf8'))
    .join('\n');
  babel = babel || ladeBabel();
  const { code } = babel.transform(jsx, {
    presets: [['react', { runtime: 'classic' }]],
    filename: 'app.jsx',
    compact: false,
    sourceMaps: false,
  });
  const kopf =
    '// ACHTUNG: erzeugt von build.js aus ' + b.praefix + '*.jsx — Aenderungen hier gehen\n' +
    '// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.\n' +
    '// Zusammengesetzt aus: ' + dateien.join(', ') + '\n';
  return kopf + code + '\n';
}

const pruefen = process.argv.includes('--check');
let veraltet = false;
for (const b of BUENDEL) {
  const neu = uebersetze(b);
  if (pruefen) {
    // Zeilenenden vor dem Vergleich angleichen: git wandelt sie unter Windows
    // beim Auschecken in CRLF, waehrend build.js mit LF schreibt. Ohne das
    // meldete --check nach einem frischen Clone faelschlich "veraltet".
    const lf = (s) => s.replace(/\r\n/g, '\n');
    const alt = fs.existsSync(b.ziel) ? fs.readFileSync(b.ziel, 'utf8') : '';
    if (lf(alt) !== lf(neu)) {
      console.error(b.name + ' ist nicht auf dem Stand von ' + b.praefix + '. `node build.js` ausfuehren.');
      veraltet = true;
    } else {
      console.log(b.name + ' ist aktuell.');
    }
  } else {
    fs.writeFileSync(b.ziel, neu);
    const kb = (n) => Math.round(n / 1024) + ' KB';
    quelldateien(b.quelle).forEach((n) => {
      console.log('  ' + n.padEnd(20) + kb(fs.statSync(path.join(b.quelle, n)).size));
    });
    console.log('  ' + '-'.repeat(30));
    console.log('  ' + b.name.padEnd(20) + kb(fs.statSync(b.ziel).size) + '\n');
  }
}
if (veraltet) process.exit(1);
