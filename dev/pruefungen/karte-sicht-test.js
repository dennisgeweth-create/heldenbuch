// Prueft Sicht und Reichweite der Kampfkarte — Stufe 5.
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

// Eine Karte aus Zeilen bauen, damit die Pruefungen lesbar bleiben.
const bau = (zeilen) => ({breite: zeilen[0].length, hoehe: zeilen.length,
  feldMeter: 1.5, gelaende: zeilen.join(''), figuren: {}});
const p = (n) => karteAusName(n);

// ── Die Linie ────────────────────────────────────────────────────
// Start und Ziel gehoeren nicht dazu: wer selbst im Baum sitzt, ist
// dadurch nicht blind.
ist('die Linie laesst Start und Ziel weg',
  kLinie(p('A1'), p('D1')).map(f => karteName(f.x, f.y)), ['B1', 'C1']);
ist('nebeneinander liegt nichts dazwischen', kLinie(p('A1'), p('B1')), []);
ist('dasselbe Feld ergibt nichts', kLinie(p('C3'), p('C3')), []);
ist('sie geht auch rueckwaerts',
  kLinie(p('D1'), p('A1')).map(f => karteName(f.x, f.y)), ['C1', 'B1']);
ist('senkrecht',
  kLinie(p('B1'), p('B4')).map(f => karteName(f.x, f.y)), ['B2', 'B3']);
ist('und diagonal',
  kLinie(p('A1'), p('D4')).map(f => karteName(f.x, f.y)), ['B2', 'C3']);

// ── Sicht ────────────────────────────────────────────────────────
const raum = bau([
  '.....',
  '..#..',
  '.....',
  '..~..',
  '.....',
]);
wahr('freie Bahn ist frei', karteSicht(raum, p('A3'), p('E3')).frei);
falsch('eine Wand dazwischen nicht', karteSicht(raum, p('A2'), p('E2')).frei);
ist('  … und sie wird benannt', (() => {
  const s = karteSicht(raum, p('A2'), p('E2'));
  return [s.art.name, karteName(s.x, s.y)];
})(), ['Wand', 'C2']);
// Wasser sieht man hindurch — die Geländetafel sagt es, nicht die Linie.
wahr('durch Wasser sieht man', karteSicht(raum, p('A4'), p('E4')).frei);
wahr('neben der Wand vorbei geht', karteSicht(raum, p('A1'), p('E1')).frei);
// Wer selbst auf dem blockierenden Feld steht, ist nicht blind.
wahr('von der Wand aus sieht man', karteSicht(raum, p('C2'), p('E2')).frei);
wahr('und auf die Wand zu auch', karteSicht(raum, p('A2'), p('C2')).frei);

const baeume = bau([
  '.....',
  '.T...',
  '..T..',
  '...T.',
  '.....',
]);
falsch('eine Baumreihe sperrt die Diagonale', karteSicht(baeume, p('A1'), p('E5')).frei);
wahr('daneben ist frei', karteSicht(baeume, p('A5'), p('E5')).frei);

// Tueren: zu sperrt, offen nicht. Das ist der Fall, wegen dem es zwei
// Zeichen gibt.
const tuer = (z) => bau(['.....', '..' + z + '..', '.....']);
falsch('eine geschlossene Tuer sperrt', karteSicht(tuer('+'), p('A2'), p('E2')).frei);
wahr('eine offene nicht', karteSicht(tuer('/'), p('A2'), p('E2')).frei);
wahr('Gefahr sperrt die Sicht nicht', karteSicht(tuer('x'), p('A2'), p('E2')).frei);

// ── Der Weg ──────────────────────────────────────────────────────
wahr('geradeaus ist der Weg frei', karteWeg(raum, p('A3'), p('E3')).frei);
falsch('durch die Wand nicht', karteWeg(raum, p('A2'), p('E2')).frei);
ist('Wasser haelt auf, sperrt aber nicht', (() => {
  const w = karteWeg(raum, p('A4'), p('E4'));
  return [w.frei, w.schwierig];
})(), [true, 1]);
// Das Zielfeld zaehlt mit — darauf steht man am Ende.
ist('das Zielfeld zaehlt mit', (() => {
  const w = karteWeg(raum, p('A4'), p('C4'));
  return [w.frei, w.schwierig];
})(), [true, 1]);
falsch('auf eine Wand kann man nicht ziehen', karteWeg(raum, p('A2'), p('C2')).frei);
wahr('Gefahr ist begehbar', karteWeg(tuer('x'), p('A2'), p('E2')).frei);
ist('  … und nicht schwierig', karteWeg(tuer('x'), p('A2'), p('E2')).schwierig, 0);

// ── Entfernung in Metern ─────────────────────────────────────────
ist('drei Felder sind viereinhalb Meter', karteMeterText(3, raum), '4,5 m');
ist('ein Feld ist eineinhalb', karteMeterText(1, raum), '1,5 m');
ist('vier Felder sind sechs', karteMeterText(4, raum), '6 m');
// Ohne krumme Nachkommastellen: 7 × 1,5 = 10,5 und nicht 10,500000001.
ist('sieben Felder sind zehneinhalb', karteMeterText(7, raum), '10,5 m');
ist('ein eigenes Feldmass zaehlt',
  karteMeterText(3, {...raum, feldMeter: 3}), '9 m');

// ── Und im Textblock ─────────────────────────────────────────────
// Br steht links, g1 hinter der Wand, g2 direkt neben Br.
const mitWand = {...bau(['.....', '..#..', '.....']),
  figuren: {h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}, g2: {x:0, y:0, k:'g2'}}};
const wer = [
  {id:'h1', name:'Brunhilde', art:'held'},
  {id:'g1', name:'Goblin 1',  art:'gegner'},
  {id:'g2', name:'Goblin 2',  art:'gegner'},
];
const text = karteText(mitWand, wer, {});
wahr('der Block nennt die Sicht', text.includes('SICHT'));
wahr('  … und sagt, dass es eine Naeherung ist', /Näherung/.test(text));
wahr('  … und wer entscheidet', /Spielleitung/.test(text));
// Geprueft wird im Sichtabsatz selbst — in der Entfernungstafel steht
// jedes Paar, dort waere „Br → g2" kein Beweis.
const sichtTeil = text.split('SICHT')[1];
wahr('das verstellte Paar steht da', sichtTeil.includes('Br → g1  Wand auf C2'));
falsch('das freie Paar steht nicht da', sichtTeil.includes('Br → g2'));

// Steht nichts im Weg, sagt der Block auch das — sonst waere unklar,
// ob geprueft wurde.
const offen = {...bau(['.....', '.....', '.....']),
  figuren: {h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}}};
wahr('bei freier Bahn steht es ausdruecklich da',
  karteText(offen, wer, {}).includes('Zwischen keinem Paar steht etwas.'));
// Ohne Gegner gibt es nichts zu vergleichen.
falsch('ohne Gegenseite kein Sichtabsatz',
  karteText({...offen, figuren: {h1: {x:0, y:1, k:'Br'}}}, wer, {}).includes('SICHT'));

// ── Der Kreis bleibt geschlossen ─────────────────────────────────
// Der Leser darf am neuen Absatz nicht hängenbleiben.
const zurueck = karteAusText(text);
ist('der Block mit Sicht liest sich zurueck',
  [zurueck.karte.breite, zurueck.karte.hoehe], [5, 3]);
ist('  … mit demselben Gelaende', zurueck.karte.gelaende, '.....' + '..#..' + '.....');
ist('  … und allen drei Marken', zurueck.marken.map(m => m.k).sort(), ['Br', 'g1', 'g2']);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
