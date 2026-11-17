// Prueft, wie der Browser die Pfade uebernimmt, die der Server beim
// Auslagern der Bilder meldet (bilderEinsetzen in js/util.js; die
// Gegenseite steht in api.php, bilderAuslagern).
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
const wahr = (n, x) => ist(n, !!x, true);

const bild = 'data:image/png;base64,' + 'A'.repeat(300) + 'ENDE';
const melde = (pfad, url, daten) => ({pfad, url, laenge: (daten || bild).length, ende: (daten || bild).slice(-32)});
const pfad = 'planer-dateien/0123456789abcdef0123456789abcdef/bild-abc.png';

const held = {id: 'h1', name: 'Armin', portrait: bild,
  weapons: [{id: 'w1', name: 'Axt', imageData: bild}, {id: 'w2', name: 'Dolch', imageData: ''}],
  features: [{id: 'f1', name: 'Zaeh'}]};

const neu = bilderEinsetzen(held, [melde(['portrait'], pfad)]);
ist('das Portraet wird zum Pfad', neu.portrait, pfad);
ist('  … der Rest bleibt', neu.name, 'Armin');
wahr('  … unveraenderte Teile sind dieselben Objekte', neu.weapons === held.weapons && neu.features === held.features);
ist('  … und der alte Stand bleibt unberuehrt', held.portrait, bild);

const neu2 = bilderEinsetzen(held, [melde(['weapons', 0, 'imageData'], pfad)]);
ist('in einer Liste: das Bild an der Waffe', neu2.weapons[0].imageData, pfad);
wahr('  … die andere Waffe bleibt dasselbe Objekt', neu2.weapons[1] === held.weapons[1]);
wahr('  … die Liste bleibt eine Liste', Array.isArray(neu2.weapons));

const anderes = 'data:image/png;base64,' + 'B'.repeat(300) + 'NEUE';
const getauscht = {...held, portrait: anderes};
wahr('wer das Bild inzwischen getauscht hat, behaelt seins',
  bilderEinsetzen(getauscht, [melde(['portrait'], pfad)]) === getauscht);
const schonPfad = {...held, portrait: pfad};
wahr('steht schon ein Pfad da, bleibt alles', bilderEinsetzen(schonPfad, [melde(['portrait'], pfad)]) === schonPfad);
wahr('ein Pfad, den es nicht gibt, aendert nichts', bilderEinsetzen(held, [melde(['gibtsnicht', 'x'], pfad)]) === held);
wahr('nichts gemeldet, nichts geaendert', bilderEinsetzen(held, []) === held && bilderEinsetzen(held, null) === held);

const lib = {item: [{name: 'Krone'}, {name: 'Spiegel', imageData: bild}], _laeden: {a: {name: 'L'}}};
const lib2 = bilderEinsetzen(lib, [melde(['item', 1, 'imageData'], pfad)]);
ist('in der Bibliothek', lib2.item[1].imageData, pfad);
wahr('  … die Laeden bleiben dasselbe Objekt', lib2._laeden === lib._laeden);
ist('mehrere auf einmal', bilderEinsetzen(held, [melde(['portrait'], pfad), melde(['weapons', 0, 'imageData'], pfad)])
  .weapons[0].imageData, pfad);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
