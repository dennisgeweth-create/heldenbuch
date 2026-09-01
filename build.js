#!/usr/bin/env node
/**
 * Setzt die Quelldateien aus js/src/ zusammen und uebersetzt sie nach
 * js/app.js.
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
 *     node build.js --check    prueft nur, ob js/app.js aktuell ist (Exit 1 wenn nicht)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const wurzel = __dirname;
const quellordner = path.join(wurzel, 'js', 'src');
const ziel = path.join(wurzel, 'js', 'app.js');
const babelDatei = path.join(wurzel, 'vendor', 'babel.min.js');

// Die Reihenfolge ergibt sich aus dem Dateinamen (1-, 2-, …) und zaehlt:
// Sheet muss vor App stehen, beide nach den Bausteinen.
function quelldateien() {
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

function uebersetze() {
  const dateien = quelldateien();
  if (!dateien.length) throw new Error('Keine .jsx-Dateien in ' + quellordner);
  // Trennzeile je Datei, damit im Ergebnis erkennbar bleibt, woher ein
  // Abschnitt stammt.
  const jsx = dateien
    .map((n) => '\n// ==== js/src/' + n + ' ====\n' + fs.readFileSync(path.join(quellordner, n), 'utf8'))
    .join('\n');
  const { code } = ladeBabel().transform(jsx, {
    presets: [['react', { runtime: 'classic' }]],
    filename: 'app.jsx',
    compact: false,
    sourceMaps: false,
  });
  const kopf =
    '// ACHTUNG: erzeugt von build.js aus js/src/*.jsx — Aenderungen hier gehen\n' +
    '// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.\n' +
    '// Zusammengesetzt aus: ' + dateien.join(', ') + '\n';
  return kopf + code + '\n';
}

const neu = uebersetze();

if (process.argv.includes('--check')) {
  // Zeilenenden vor dem Vergleich angleichen: git wandelt sie unter Windows
  // beim Auschecken in CRLF, waehrend build.js mit LF schreibt. Ohne das
  // meldete --check nach einem frischen Clone faelschlich "veraltet".
  const lf = (s) => s.replace(/\r\n/g, '\n');
  const alt = fs.existsSync(ziel) ? fs.readFileSync(ziel, 'utf8') : '';
  if (lf(alt) !== lf(neu)) {
    console.error('js/app.js ist nicht auf dem Stand von js/src/. `node build.js` ausfuehren.');
    process.exit(1);
  }
  console.log('js/app.js ist aktuell.');
} else {
  fs.writeFileSync(ziel, neu);
  const kb = (n) => Math.round(n / 1024) + ' KB';
  quelldateien().forEach((n) => {
    console.log('  ' + n.padEnd(20) + kb(fs.statSync(path.join(quellordner, n)).size));
  });
  console.log('  ' + '-'.repeat(30));
  console.log('  ' + 'js/app.js'.padEnd(20) + kb(fs.statSync(ziel).size));
}
