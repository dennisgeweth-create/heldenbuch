// Prueft, aus welchem Platz gezaubert wird.
//
// Der Anlass ist die Reaktion: sie kommt mit einem Griff und ohne
// Fenster, dort waehlt niemand einen Grad. War der erste Grad leer,
// scheiterte der Schutzschild bisher stillschweigend, obwohl der zweite
// noch voll war.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n' + fs.readFileSync('js/util.js', 'utf8');
const namen = [...quelle.matchAll(/^const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1]);
eval(quelle + ';globalThis.M = {' + namen.join(', ') + '};');
Object.assign(globalThis, M);

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

const plaetze = (angabe) => {
  const raus = {};
  for (let g = 1; g <= 9; g++) raus[g] = {max: 0, used: 0};
  Object.keys(angabe).forEach(g => { raus[g] = angabe[g]; });
  return raus;
};

const voll = plaetze({1: {max: 4, used: 0}, 2: {max: 3, used: 0}, 3: {max: 2, used: 0}});
const ersterLeer = plaetze({1: {max: 4, used: 4}, 2: {max: 3, used: 1}, 3: {max: 2, used: 0}});
const zweiLeer = plaetze({1: {max: 4, used: 4}, 2: {max: 3, used: 3}, 3: {max: 2, used: 0}});
const allesLeer = plaetze({1: {max: 4, used: 4}, 2: {max: 3, used: 3}});

ist('frei zaehlt, was uebrig ist', [zauberplatzFrei(voll, 1), zauberplatzFrei(ersterLeer, 1), zauberplatzFrei(voll, 9)], [4, 0, 0]);
ist('Zeichenketten als Schluessel gelten auch', zauberplatzFrei({'2': {max: 1, used: 0}}, 2), 1);

ist('ist der Platz da, wird er genommen', zauberplatzWahl(voll, 1, true), 1);
ist('ist er leer, kommt der naechste — aber nur, wenn es erlaubt ist',
    [zauberplatzWahl(ersterLeer, 1, true), zauberplatzWahl(ersterLeer, 1, false)], [2, 0]);
ist('  … und wenn der auch leer ist, der übernächste', zauberplatzWahl(zweiLeer, 1, true), 3);
ist('  … ist gar keiner mehr da, bleibt es bei null', zauberplatzWahl(allesLeer, 1, true), 0);
ist('nach oben wird gesucht, nie nach unten', zauberplatzWahl(voll, 3, true), 3);
ist('  … der dritte leer, der vierte auch nicht da', zauberplatzWahl(plaetze({1: {max: 4, used: 0}, 3: {max: 1, used: 1}}), 3, true), 0);
ist('ein Zaubertrick kostet keinen Platz', [zauberplatzWahl(voll, 0, true), zauberplatzWahl(voll, 10, true)], [0, 0]);
ist('ohne Plaetze im Bogen geht nichts', [zauberplatzWahl(null, 1, true), zauberplatzWahl({}, 1, true)], [0, 0]);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
