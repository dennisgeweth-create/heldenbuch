// Prueft jede Behauptung, die KAMPFTRACKER.md ueber den Import
// aufstellt. Das Blatt wird einer KI vorgelegt — was darin steht, muss
// stimmen, sonst schreibt sie Bloecke, die niemand einliest.
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

const RUNDE = [
  {id: 'h1', name: 'Brunhilde', art: 'held'},
  {id: 'h2', name: 'Thalia',    art: 'held'},
  {id: 'g1', name: 'Goblin 1',  art: 'gegner'},
];

// ── „Das Mindeste: nur das Raster" ───────────────────────────────
const mindest = [
  '    A  B  C  D  E  F  G  H',
  ' 1  .  .  #  #  #  .  .  .',
  ' 2  .  .  #  .  /  .  .  .',
  ' 3  .  .  #  #  #  .  ~  ~',
].join('\n');
const m = karteAusText(mindest);
ist('das Beispiel aus dem Blatt ergibt 8 x 3',
  [m.karte.breite, m.karte.hoehe], [8, 3]);
ist('  … mit dem gezeigten Gelaende', m.karte.gelaende,
  '..###...' + '..#./...' + '..###.~~');
ist('  … ohne Warnung', m.warnung, []);

// „Die Kopfzeile und die Zeilennummern sind freiwillig."
const nackt = ['. . # # # . . .', '. . # . / . . .', '. . # # # . ~ ~'].join('\n');
const n = karteAusText(nackt);
ist('ganz ohne Kopfzeile und Nummern dasselbe',
  [n.karte.breite, n.karte.hoehe, n.karte.gelaende],
  [8, 3, m.karte.gelaende]);

// „Wie viele Leerzeichen, ist gleich."
const wild = ['A   B  C', ' 1   .    .   #', ' 2  .  #     .'].join('\n');
const w = karteAusText(wild);
ist('unterschiedlich viele Leerzeichen stoeren nicht',
  [w.karte.breite, w.karte.hoehe, w.karte.gelaende], [3, 2, '..#' + '.#.']);

// Zeilennummern mit Punkt oder Klammer.
['1. . . #', '2) . # .'].forEach(() => {});
const nr = karteAusText(['1. . . #', '2) . # .'].join('\n'));
ist('Nummern mit Punkt und Klammer werden abgeschnitten',
  [nr.karte.breite, nr.karte.hoehe, nr.karte.gelaende], [3, 2, '..#' + '.#.']);

// ── „Was der Leser überspringt" ──────────────────────────────────
const mitKopf = ['🗺 KARTE  8 × 3  ·  1 Feld = 1,5 m', '', '    A  B  C',
                 '  1 .  .  #', '  2 .  #  .'].join('\n');
const k = karteAusText(mitKopf);
ist('die Zeile mit 🗺 KARTE wird uebersprungen',
  [k.karte.breite, k.karte.hoehe], [3, 2]);

// Fliesstext ist keine Rasterzeile.
const geschwaetz = ['Hier ist deine Karte:', '', '  A  B  C',
                    '1 .  .  #', '2 .  #  .', '', 'Die Tuer ist zu.'].join('\n');
const g = karteAusText(geschwaetz);
ist('Vor- und Nachwort werden nicht fuer Raster gehalten',
  [g.karte.breite, g.karte.hoehe, g.karte.gelaende], [3, 2, '..#' + '.#.']);
// Die Regel selbst, wie sie im Blatt steht.
falsch('ein Wort laenger als zwei Zeichen macht keine Reihe',
  kIstReihe(['Die', '.', '#']));
falsch('ohne bekanntes Zeichen auch nicht', kIstReihe(['Br', 'g1']));
falsch('ein einzelnes Feld ist keine Reihe', kIstReihe(['.']));
wahr('zwei Felder mit einem Bodenzeichen genuegen', kIstReihe(['.', 'Br']));

// Ab einem Absatz wird kein Raster mehr gesucht.
const nachAbsatz = ['  A  B  C', '1 .  .  #', '', 'GELÄNDE',
                    '  #  Wand', '  .  .  .'].join('\n');
ist('nach GELÄNDE kommt kein Raster mehr dazu',
  karteAusText(nachAbsatz).karte.hoehe, 1);

// ── „Zeilen dürfen unterschiedlich lang sein" ────────────────────
const kurz = ['. . # .', '. #', '. . . .'].join('\n');
const ku = karteAusText(kurz);
ist('kuerzere Zeilen werden mit Boden aufgefuellt',
  [ku.karte.breite, ku.karte.gelaende], [4, '..#.' + '.#..' + '....']);
wahr('  … und es steht als Warnung da',
  ku.warnung.some(x => /aufgef/i.test(x)));

// ── „Höchstens 40 Spalten und 30 Zeilen" ─────────────────────────
const breit = Array.from({length: 45}, () => '.').join(' ');
const b = karteAusText([breit, breit].join('\n'));
ist('breiter als vierzig wird abgeschnitten', b.karte.breite, 40);
wahr('  … und gemeldet', b.warnung.some(x => /40 Spalten/.test(x)));
const hoch = Array.from({length: 35}, () => '. . .').join('\n');
const h = karteAusText(hoch);
ist('hoeher als dreissig wird abgeschnitten', h.karte.hoehe, 30);
wahr('  … und gemeldet', h.warnung.some(x => /30 Zeilen/.test(x)));

// ── „Ein fremdes Sonderzeichen wird zu Boden" ────────────────────
const fremd = karteAusText(['. . §', '. # .'].join('\n'));
ist('ein unbekanntes Zeichen wird Boden', fremd.karte.gelaende, '...' + '.#.');
wahr('  … und der Tracker sagt welches',
  fremd.warnung.some(x => /Unbekannte Zeichen/.test(x) && /§/.test(x)));

// ── „Kommt gar kein Raster vor, passiert nichts" ─────────────────
const leer = karteAusText('Ich habe leider kein Bild bekommen.');
ist('ohne Raster gibt es keine Karte', leer.karte, null);
ist('  … und die Meldung sagt es', leer.meldung, 'Kein Raster gefunden.');

// ── Figuren ──────────────────────────────────────────────────────
const mitFiguren = [
  '    A  B  C  D  E  F  G  H',
  ' 1  .  .  #  #  #  .  .  .',
  ' 2  .  Br #  .  .  .  g1 .',
  ' 3  .  .  #  .  .  T  T  .',
  '',
  'FIGUREN',
  '  Br  Brunhilde',
  '  g1  Goblin 1',
].join('\n');
const f = karteAusText(mitFiguren);
ist('die Marken werden gelesen', f.marken.map(x => x.k).sort(), ['Br', 'g1']);
ist('  … auf ihren Feldern',
  f.marken.map(x => karteName(x.x, x.y)).sort(), ['B2', 'G2']);
ist('  … und die Namen dazu', f.namen, {Br: 'Brunhilde', g1: 'Goblin 1'});
// „Der Boden darunter bleibt Boden."
ist('unter einer Figur liegt Boden', karteFeld(f.karte, 1, 1), '.');

const u = karteUebernehmen(mitFiguren, RUNDE);
ist('die Figuren werden der Reihe zugeordnet',
  Object.keys(u.karte.figuren).sort(), ['g1', 'h1']);
ist('  … auf die richtigen Felder',
  [karteName(u.karte.figuren.h1.x, u.karte.figuren.h1.y),
   karteName(u.karte.figuren.g1.x, u.karte.figuren.g1.y)], ['B2', 'G2']);
ist('die Meldung nennt Maße und Figuren', u.meldung, '8 × 3 Felder gelesen, 2 Figuren gesetzt');
ist('  … und nichts blieb offen', u.warnung, []);

// „Groß- und Kleinschreibung egal, Namensanfang genügt."
const unscharf = karteUebernehmen(
  ['  A  B  C', '1 .  Br #', '2 .  #  g1', '', 'FIGUREN',
   '  Br  brunhilde', '  g1  Goblin'].join('\n'), RUNDE);
ist('Kleinschreibung stoert die Zuordnung nicht',
  Object.keys(unscharf.karte.figuren).sort(), ['g1', 'h1']);

// „Der Import legt niemanden an."
const fremdeFigur = karteUebernehmen(
  ['  A  B  C', '1 .  Xx #', '2 .  #  .', '', 'FIGUREN',
   '  Xx  Der Hauptmann'].join('\n'), RUNDE);
ist('wer nicht in der Reihe steht, wird nicht gesetzt',
  Object.keys(fremdeFigur.karte.figuren), []);
wahr('  … und es steht als Warnung da',
  fremdeFigur.warnung.some(x => /Nicht zugeordnet/.test(x) && /Hauptmann/.test(x)));

// ── Was das Blatt ueber die Hoehe sagt ──────────────────────────
const mitHoehe = (zeile) => karteUebernehmen(
  ['  A  B  C', '1 .  Dr #', '2 .  #  .', '', 'FIGUREN', zeile].join('\n'),
  [{id: 'g1', name: 'Blauer Drache', art: 'gegner'}]);
const hVon = (u) => (u.karte.figuren.g1 || {}).h;

ist('„Höhe 12 m" wird uebernommen',
  hVon(mitHoehe('  Dr  Blauer Drache  Gegner  B1  124/244 TP · Höhe 12 m')), 12);
ist('  … auch mit Komma', hVon(mitHoehe('  Dr  Blauer Drache   Höhe 4,5 m')), 4.5);
ist('  … und mit Punkt', hVon(mitHoehe('  Dr  Blauer Drache   Höhe 4.5 m')), 4.5);
ist('  … egal wo in der Zeile',
  hVon(mitHoehe('  Dr  Blauer Drache   Höhe 9 m · Gegner · 12/40 TP')), 9);
ist('  … und ohne Umlaut geschrieben',
  hVon(mitHoehe('  Dr  Blauer Drache   Hoehe 6 m')), 6);
ist('ohne Angabe steht die Figur am Boden',
  'h' in mitHoehe('  Dr  Blauer Drache  Gegner  B1').karte.figuren.g1, false);
// „Meter, nicht Fuss": eine Fussangabe darf nicht als Meter durchgehen.
ist('eine Fussangabe wird nicht als Meter gelesen',
  'h' in mitHoehe('  Dr  Blauer Drache   Höhe 40 ft').karte.figuren.g1, false);

// „Die Hoehe zaehlt in der Entfernung mit … zwoelf Meter sind acht Felder."
ist('zwölf Meter sind acht Felder',
  karteWeit({x: 0, y: 0, h: 12}, {x: 0, y: 0}), 8);

// ── Der Kreis: was ausgegeben wird, geht wieder hinein ───────────
const raus = karteText(u.karte, RUNDE, {mitZahlen: true});
const rein = karteUebernehmen(raus, RUNDE);
ist('die eigene Ausgabe liest sich zurueck',
  [rein.karte.breite, rein.karte.hoehe], [8, 3]);
ist('  … mit demselben Gelaende', rein.karte.gelaende, u.karte.gelaende);
ist('  … und denselben Figuren auf denselben Feldern',
  Object.keys(rein.karte.figuren).sort().map(id =>
    id + '@' + karteName(rein.karte.figuren[id].x, rein.karte.figuren[id].y)),
  ['g1@G2', 'h1@B2']);

// ── Die Anweisung im Blatt ist die aus dem Programm ──────────────
const blatt = fs.readFileSync('KAMPFTRACKER.md', 'utf8');
KARTE_KI_ANWEISUNG.split('\n').forEach((z, i) => {
  if (!z.trim()) return;
  if (!blatt.includes(z)) {
    schlecht++;
    console.log('  FEHLER Anweisungszeile ' + i + ' fehlt im Blatt:\n     ' + JSON.stringify(z));
  } else gut++;
});

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
