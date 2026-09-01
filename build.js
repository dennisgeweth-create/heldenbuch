#!/usr/bin/env node
/**
 * Uebersetzt js/app.jsx nach js/app.js.
 *
 * Nutzt bewusst das bereits vorhandene vendor/babel.min.js statt eines
 * npm-Pakets: kein package.json, kein node_modules, kein Installationsschritt
 * — weder hier noch in der GitHub-Action. Node allein genuegt.
 *
 * Nach dem Bau wird babel im Browser nicht mehr gebraucht; die ausgelieferte
 * Seite laedt nur React, ReactDOM und das Ergebnis.
 *
 *     node build.js            baut einmal
 *     node build.js --check    prueft nur, ob js/app.js aktuell ist (Exit 1 wenn nicht)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const wurzel = __dirname;
const quelle = path.join(wurzel, 'js', 'app.jsx');
const ziel = path.join(wurzel, 'js', 'app.js');
const babelDatei = path.join(wurzel, 'vendor', 'babel.min.js');

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
  const jsx = fs.readFileSync(quelle, 'utf8');
  const { code } = ladeBabel().transform(jsx, {
    presets: [['react', { runtime: 'classic' }]],
    filename: 'app.jsx',
    compact: false,
sourceMaps: false,
  });
  const kopf =
    '// ACHTUNG: erzeugt von build.js aus js/app.jsx — Aenderungen hier gehen\n' +
    '// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.\n';
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
    console.error('js/app.js ist nicht auf dem Stand von js/app.jsx. `node build.js` ausfuehren.');
    process.exit(1);
  }
  console.log('js/app.js ist aktuell.');
} else {
  fs.writeFileSync(ziel, neu);
  const kb = (n) => Math.round(n / 1024) + ' KB';
  console.log(
    'js/app.jsx ' + kb(fs.statSync(quelle).size) +
    '  ->  js/app.js ' + kb(fs.statSync(ziel).size)
  );
}
