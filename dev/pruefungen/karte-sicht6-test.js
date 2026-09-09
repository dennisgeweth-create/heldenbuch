// Prueft, was die Runde von der Karte sieht — Stufe 6.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + fs.readFileSync('js/src/2c2-karte.jsx', 'utf8')
                 .split('// ══ Ende der reinen Rechnung')[0];
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
const wahr = (n, a) => ist(n, !!a, true);
const falsch = (n, a) => ist(n, !!a, false);

const bau = () => ({breite: 5, hoehe: 3, feldMeter: 1.5,
  gelaende: '.....' + '..#..' + '.....',
  figuren: {h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}, g2: {x:4, y:2, k:'g2'}},
  verborgen: []});

// ── Der Schalter fuer die ganze Karte ────────────────────────────
ist('ohne Karte gibt es nichts zu zeigen', karteFuerSpieler(null), null);
ist('eine Karte ohne Freigabe zeigt nichts', karteFuerSpieler(bau()), null);
ist('  … auch nicht ausdruecklich aus',
  karteFuerSpieler({...bau(), zeigen: false}), null);

const frei = karteFuerSpieler({...bau(), zeigen: true});
wahr('mit Freigabe kommt sie durch', !!frei);
ist('  … mit dem ganzen Gelaende', frei.gelaende, '.....' + '..#..' + '.....');
ist('  … mit den Maszen', [frei.breite, frei.hoehe, frei.feldMeter], [5, 3, 1.5]);
ist('  … und allen Figuren', Object.keys(frei.figuren).sort(), ['g1', 'g2', 'h1']);

// ── Einzelne verbergen ───────────────────────────────────────────
const k1 = karteVerbergen(bau(), 'g1');
wahr('verbergen merkt sich die Figur', karteIstVerborgen(k1, 'g1'));
falsch('  … und nur die', karteIstVerborgen(k1, 'g2'));
ist('  … die Figur bleibt auf der Karte der Spielleitung',
  Object.keys(k1.figuren).sort(), ['g1', 'g2', 'h1']);
falsch('noch einmal nimmt es zurueck',
  karteIstVerborgen(karteVerbergen(k1, 'g1'), 'g1'));
ist('ohne Kennung passiert nichts', karteVerbergen(bau(), '').verborgen, []);

const teil = karteFuerSpieler({...k1, zeigen: true});
ist('die verborgene Figur fehlt der Runde',
  Object.keys(teil.figuren).sort(), ['g2', 'h1']);
// Nicht ausgegraut, sondern weg: was nicht gesendet wird, kann auch
// nicht in einer Antwort auftauchen.
falsch('sie steht nirgends mehr im Ergebnis',
  JSON.stringify(teil).includes('g1'));
ist('das Gelaende bleibt vollstaendig', teil.gelaende, '.....' + '..#..' + '.....');
falsch('und die Liste der Verborgenen geht nicht mit', 'verborgen' in teil);

// Alles verborgen: die Karte bleibt, das Gelaende auch.
const alles = karteFuerSpieler({...bau(), zeigen: true, verborgen: ['h1','g1','g2']});
ist('sind alle verborgen, steht das leere Feld da', Object.keys(alles.figuren), []);
ist('  … mit dem Gelaende', alles.gelaende, '.....' + '..#..' + '.....');

// ── Aufraeumen nimmt Verborgene mit ──────────────────────────────
// Wer nicht mehr im Kampf steht, steht auch nicht mehr in der Liste —
// sonst waere eine spaeter gleichnamige Kennung ploetzlich verborgen.
const nachRaus = karteAufraeumen(karteVerbergen(bau(), 'g1'),
  [{id:'h1'}, {id:'g2'}]);
ist('ein ausgeschiedener Gegner faellt aus der Liste', nachRaus.verborgen, []);
ist('  … und von der Karte', Object.keys(nachRaus.figuren).sort(), ['g2', 'h1']);

// ── Und die Aufnahme im Verlauf bleibt vollstaendig ──────────────
// Das Protokoll gehoert der Spielleitung. Dort steht alles, auch was
// die Runde nicht sieht — sonst waere der Verlauf hinterher gelogen.
const auf = karteAufnahme(karteVerbergen(bau(), 'g1'),
  [{id:'h1', name:'Brunhilde', art:'held'},
   {id:'g1', name:'Goblin 1', art:'gegner'},
   {id:'g2', name:'Goblin 2', art:'gegner'}]);
ist('der Verlauf kennt auch die verborgene Figur',
  auf.liste.map(x => x.id).sort(), ['g1', 'g2', 'h1']);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
