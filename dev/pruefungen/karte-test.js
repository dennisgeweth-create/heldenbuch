// Prueft die Rechnung der Kampfkarte. Alles bis zur Marke laeuft ohne
// React und ohne Browser.
const fs = require('fs');
const lade = (d, m) => { const r = fs.readFileSync(d, 'utf8'); return m ? r.split(m)[0] : r; };
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + lade('js/src/2c2-karte.jsx', '// ══ Ende der reinen Rechnung');
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

// ── Spalten und Feldnamen ────────────────────────────────────────
ist('Spalte 0 heisst A', kSpalte(0), 'A');
ist('Spalte 25 heisst Z', kSpalte(25), 'Z');
ist('danach geht es zweistellig weiter', kSpalte(26), 'AA');
ist('und bis zur Grenze', kSpalte(39), 'AN');
wahr('hin und zurueck stimmt ueberall',
  Array.from({length: 40}, (_, i) => i).every(i => kSpalteNr(kSpalte(i)) === i));
ist('Feldname', karteName(5, 2), 'F3');
ist('Feldname zweistellig', karteName(27, 11), 'AB12');
ist('Feldname zurueck', karteAusName('F3'), {x:5, y:2});
ist('  … auch zweistellig', karteAusName('AB12'), {x:27, y:11});
ist('  … und klein geschrieben', karteAusName('f3'), {x:5, y:2});
ist('Unsinn gibt nichts', karteAusName('??'), null);

// ── Ein leeres Raster ────────────────────────────────────────────
const leer = karteNeu(16, 12);
ist('Voreinstellung 16 x 12', [leer.breite, leer.hoehe], [16, 12]);
ist('und ueberall Boden', leer.gelaende.length, 16 * 12);
wahr('wirklich ueberall', [...leer.gelaende].every(z => z === '.'));
ist('ein Feld ist 1,5 m', leer.feldMeter, 1.5);
ist('zu breit wird gekappt', karteNeu(999, 5).breite, 40);
ist('zu hoch auch', karteNeu(5, 999).hoehe, 30);
ist('zu klein wird angehoben', karteNeu(1, 1).breite, 4);

// ── Gelände ──────────────────────────────────────────────────────
let k = karteSetzen(leer, 3, 1, '#');
ist('gesetzt ist gesetzt', karteFeld(k, 3, 1), '#');
ist('daneben bleibt Boden', karteFeld(k, 4, 1), '.');
ist('ein unbekanntes Zeichen wird Boden', karteFeld(karteSetzen(k, 5, 5, 'Q'), 5, 5), '.');
ist('ausserhalb aendert nichts', karteSetzen(k, 99, 99, '#').gelaende, k.gelaende);
ist('ausserhalb lesen gibt Boden', karteFeld(k, -1, 0), '.');
wahr('die Vorlage bleibt unangetastet', leer.gelaende.indexOf('#') === -1);
ist('sieben Geländearten', K_ARTEN.length, 7);
ist('die Wand blockiert beides',
  [kArt('#').bewegung, kArt('#').sicht], ['blockiert', 'blockiert']);
ist('Wasser kostet nur Bewegung',
  [kArt('~').bewegung, kArt('~').sicht], ['schwierig', 'frei']);

// ── Figuren ──────────────────────────────────────────────────────
const HELDEN = [{id:'h1', name:'Brunhilde', art:'held'}, {id:'h2', name:'Halgrim', art:'held'}];
const GEGNER = [{id:'g1', name:'Goblin 1', art:'gegner'}, {id:'g2', name:'Goblin 2', art:'gegner'}];
const ALLE = [...HELDEN, ...GEGNER];

ist('Helden gross', karteKuerzel('Brunhilde', 'held', []), 'Br');
ist('Gegner klein und gezaehlt', karteKuerzel('Goblin 1', 'gegner', []), 'g1');
ist('der zweite Goblin bekommt die zwei',
  karteKuerzel('Goblin 2', 'gegner', ['g1']), 'g2');
ist('zwei Helden mit gleichem Anfang', karteKuerzel('Bruno', 'held', ['Br']), 'B1');
wahr('nie zweimal dasselbe', (() => {
  const schon = [];
  for (let i = 0; i < 12; i++) schon.push(karteKuerzel('Goblin', 'gegner', schon));
  return new Set(schon).size === schon.length;
})());
wahr('immer zwei Zeichen', karteKuerzel('X', 'gegner', []).length === 2);

k = karteFigurSetzen(leer, 'h1', 5, 2, 'Br');
ist('die Figur steht', k.figuren.h1, {x:5, y:2, k:'Br'});
ist('und wird gefunden', karteFigurAuf(k, 5, 2), 'h1');
ist('woanders steht niemand', karteFigurAuf(k, 0, 0), null);
k = karteFigurSetzen(k, 'h1', 7, 3);
ist('bewegt behaelt sein Kuerzel', k.figuren.h1, {x:7, y:3, k:'Br'});
ist('und der alte Platz ist frei', karteFigurAuf(k, 5, 2), null);

// Ein Feld traegt eine Figur. Wer auf ein besetztes zieht, tauscht.
k = karteFigurSetzen(k, 'g1', 8, 3, 'g1');
k = karteFigurSetzen(k, 'h1', 8, 3);
ist('der Zieher steht auf dem Feld', k.figuren.h1, {x:8, y:3, k:'Br'});
ist('und der andere auf dessen altem', k.figuren.g1, {x:7, y:3, k:'g1'});
ist('zwei stehen nie auf einem Feld',
  Object.values(k.figuren).filter(f => f.x === 8 && f.y === 3).length, 1);
// Wer noch nirgends stand, wird verdraengt statt getauscht.
let k2 = karteFigurSetzen(leer, 'g1', 2, 2, 'g1');
k2 = karteFigurSetzen(k2, 'h1', 2, 2, 'Br');
ist('ein Platzloser wird verdraengt', Object.keys(k2.figuren), ['h1']);

k = karteFigurWeg(k, 'g1');
ist('entfernt ist entfernt', k.figuren.g1, undefined);

// Wer nicht mehr im Kampf steht, steht nicht mehr auf der Karte.
let k3 = karteFigurSetzen(leer, 'h1', 1, 1, 'Br');
k3 = karteFigurSetzen(k3, 'g9', 2, 2, 'g9');
k3 = {...k3, verborgen: ['g9', 'h1']};
const auf = karteAufraeumen(k3, HELDEN);
ist('der Ausgeschiedene faellt weg', Object.keys(auf.figuren), ['h1']);
ist('und aus dem Verborgenen auch', auf.verborgen, ['h1']);

// ── Die Größe ändern ─────────────────────────────────────────────
let gross = karteNeu(16, 12);
gross = karteSetzen(gross, 14, 10, '#');
gross = karteSetzen(gross, 2, 2, '~');
gross = karteFigurSetzen(gross, 'h1', 3, 3, 'Br');
gross = karteFigurSetzen(gross, 'g1', 15, 11, 'g1');

const weg = karteVerloren(gross, 10, 8);
ist('was beim Verkleinern faellt: das Feld', weg.felder, ['O11']);
ist('  … und die Figur', weg.marken.map(m => m.k), ['g1']);
ist('beim Vergroessern faellt nichts',
  karteVerloren(gross, 30, 20), {felder: [], marken: []});

const klein = karteGroesse(gross, 10, 8);
ist('die neue Groesse', [klein.breite, klein.hoehe], [10, 8]);
ist('das Wasser blieb liegen', karteFeld(klein, 2, 2), '~');
ist('die Figur drinnen blieb', klein.figuren.h1, {x:3, y:3, k:'Br'});
ist('die draussen ist weg', klein.figuren.g1, undefined);
ist('die Laenge stimmt wieder', klein.gelaende.length, 80);

const wieder = karteGroesse(klein, 16, 12);
ist('vergroessert legt Boden nach', wieder.gelaende.length, 192);
ist('und das Wasser liegt noch da', karteFeld(wieder, 2, 2), '~');
ist('das Verlorene kommt nicht zurueck', karteFeld(wieder, 14, 10), '.');

// ── Entfernung ───────────────────────────────────────────────────
ist('gerade', karteWeit({x:1,y:1}, {x:5,y:1}), 4);
ist('diagonal zaehlt eins', karteWeit({x:1,y:1}, {x:5,y:5}), 4);
ist('und schraeg das laengere Stueck', karteWeit({x:1,y:1}, {x:8,y:3}), 7);
ist('auf sich selbst null', karteWeit({x:2,y:2}, {x:2,y:2}), 0);
ist('rueckwaerts dasselbe', karteWeit({x:8,y:3}, {x:1,y:1}), 7);
ist('in Metern', karteMeter(7, leer), 10.5);

// ── Der Textblock ────────────────────────────────────────────────
let karte = karteNeu(8, 5);
[[2,1],[3,1],[4,1],[2,2],[2,3]].forEach(([x,y]) => { karte = karteSetzen(karte, x, y, '#'); });
karte = karteSetzen(karte, 6, 3, '~');
karte = karteFigurSetzen(karte, 'h1', 1, 1, 'Br');
karte = karteFigurSetzen(karte, 'g1', 5, 2, 'g1');

const stand = [
  {id:'h1', name:'Brunhilde', art:'held',   hp:38, hpMax:44, zustaende:[]},
  {id:'g1', name:'Goblin 1',  art:'gegner', hp:3,  hpMax:12, zustaende:['Liegend']},
];
const block = karteText(karte, stand, {mitZahlen: true});
const zeilen = block.split('\n');

wahr('der Kopf nennt die Groesse', zeilen[0].includes('8 × 5'));
wahr('  … und das Feldmass', zeilen[0].includes('1,5 m'));
ist('die Spaltenzeile', zeilen[2].trim(), 'A  B  C  D  E  F  G  H');
ist('Zeile 2 mit Wand und Figur', zeilen[4].replace(/\s+$/, ''),
  '  2 .  Br #  #  #  .  .  .');
wahr('der Gegner steht drin', block.includes('g1'));
wahr('die Figurentafel nennt den Namen', block.includes('Brunhilde'));
wahr('  … mit Feld', block.includes(' B2'));
wahr('  … mit Trefferpunkten', block.includes('38/44 TP'));
wahr('  … und dem Zustand', block.includes('Liegend'));
wahr('die Legende nennt die Wand', /#\s+Wand/.test(block));
wahr('  … und das Wasser', /~\s+Wasser/.test(block));
wahr('aber nicht den Baum, der nicht daliegt', !/T\s+Baum/.test(block));
wahr('die Entfernung steht da', /Br → g1\s+4/.test(block));
wahr('ohne Zahlen keine Trefferpunkte',
  !karteText(karte, stand, {}).includes('38/44'));
// Wer nicht gezeigt werden soll, taucht nirgends auf — nicht im Raster
// und nicht in der Tafel.
const ohneGegner = karteText(karte, stand, {mitZahlen: true, wer: (id) => id !== 'g1'});
wahr('eine verborgene Figur fehlt im Raster', !ohneGegner.includes('g1'));
wahr('  … und in der Tafel', !ohneGegner.includes('Goblin 1'));
wahr('  … und in den Entfernungen', !ohneGegner.includes('ENTFERNUNGEN'));

// ── Die Rundreise ────────────────────────────────────────────────
// Was der Schreiber ausgibt, muss der Leser wieder einlesen — sonst ist
// das eine Format zwei Formate.
const zurueck = karteUebernehmen(block, stand);
ist('gelesen: die Breite', zurueck.karte.breite, 8);
ist('gelesen: die Hoehe', zurueck.karte.hoehe, 5);
ist('das Gelaende ist dasselbe', zurueck.karte.gelaende, karte.gelaende);
ist('die Figuren stehen wieder', zurueck.karte.figuren, karte.figuren);
ist('und es gab nichts zu meckern', zurueck.warnung, []);

// ── Der Leser ist großzügig ──────────────────────────────────────
const vonHand = [
  '  A B C D',
  '1 . . # .',
  '2 . # # .',
  '3 . . . ~',
].join('\n');
const g1 = karteAusText(vonHand);
ist('ein Zeichen Abstand reicht', [g1.karte.breite, g1.karte.hoehe], [4, 3]);
ist('das Gelaende stimmt', g1.karte.gelaende, '..#..##....~');

const ohneKopf = ['. . #', '. # #'].join('\n');
ist('die Spaltenzeile darf fehlen',
  [karteAusText(ohneKopf).karte.breite, karteAusText(ohneKopf).karte.hoehe], [3, 2]);

const schief = ['. . # ~', '. #', '. . . .'].join('\n');
const g2 = karteAusText(schief);
ist('kurze Zeilen werden aufgefuellt', g2.karte.gelaende, '..#~' + '.#..' + '....');
wahr('und das wird gesagt', g2.warnung.some(w => /aufgefüllt/.test(w)));

const fremd = ['. . § .', '. . . .'].join('\n');
const g3 = karteAusText(fremd);
ist('ein fremdes Zeichen wird Boden', g3.karte.gelaende, '........');
wahr('mit Meldung', g3.warnung.some(w => /Unbekannte Zeichen/.test(w)));

ist('ohne Raster kommt nichts', karteAusText('nur Gerede').karte, null);
ist('  … und ein Grund', karteAusText('').meldung, 'Kein Raster gefunden.');

// Zu grosse Blöcke werden gekappt und das steht dabei.
const riesig = Array.from({length: 40}, () =>
  Array.from({length: 50}, () => '.').join(' ')).join('\n');
const g4 = karteAusText(riesig);
ist('zu breit wird gekappt', g4.karte.breite, 40);
ist('zu hoch auch', g4.karte.hoehe, 30);
ist('und beides gemeldet', g4.warnung.length, 2);

// ── Zuordnen über den Namen ──────────────────────────────────────
const mitNamen = [
  '  A  B  C  D',
  '1 .  Br .  .',
  '2 .  .  g1 .',
  '',
  'FIGUREN',
  '  Br   Brunhilde   Held     B1',
  '  g1   Goblin 1    Gegner   C2',
].join('\n');
const zu = karteUebernehmen(mitNamen, stand);
ist('Brunhilde wurde erkannt', zu.karte.figuren.h1, {x:1, y:0, k:'Br'});
ist('der Goblin auch', zu.karte.figuren.g1, {x:2, y:1, k:'g1'});
ist('nichts offen', zu.warnung, []);

// Ein Name, den es im Kampf nicht gibt, wird gemeldet und nicht erfunden.
const fremdeFigur = [
  '  A  B',
  '1 .  Xx',
  '',
  'FIGUREN',
  '  Xx   Drache   Gegner   B1',
].join('\n');
const zf = karteUebernehmen(fremdeFigur, stand);
ist('ein Fremder wird nicht gesetzt', Object.keys(zf.karte.figuren).length, 0);
wahr('sondern gemeldet', zf.warnung.some(w => /Nicht zugeordnet/.test(w)));
wahr('  … mit Namen', zf.warnung.some(w => /Drache/.test(w)));

// Unscharf: „Goblin" findet „Goblin 1".
const unscharf = ['  A  B', '1 .  g1', '', 'FIGUREN', '  g1  Goblin  Gegner  B1'].join('\n');
ist('unscharf gefunden',
  Object.keys(karteUebernehmen(unscharf, stand).karte.figuren), ['g1']);

// Zwei Marken, ein Name — der zweite bleibt offen statt denselben
// Teilnehmer zweimal zu setzen.
const doppelt = ['  A  B  C', '1 g1 .  g1', '', 'FIGUREN', '  g1  Goblin 1  Gegner  A1'].join('\n');
const dz = karteUebernehmen(doppelt, stand);
ist('derselbe Teilnehmer nur einmal', Object.keys(dz.karte.figuren).length, 1);
wahr('der Rest wird gemeldet', dz.warnung.some(w => /Nicht zugeordnet/.test(w)));

// ── Die Anweisung ────────────────────────────────────────────────
wahr('die Anweisung nennt alle Zeichen',
  K_ZEICHEN.every(z => KARTE_KI_ANWEISUNG.includes(z)));
wahr('  … die Grenzen', KARTE_KI_ANWEISUNG.includes('40') && KARTE_KI_ANWEISUNG.includes('30'));
wahr('  … und verbietet Figuren', /keine Figuren/.test(KARTE_KI_ANWEISUNG));
// Das Beispiel in der Anweisung muss selbst lesbar sein — sonst lernt
// die KI ein Format, das der Leser nicht kennt.
const ausBeispiel = karteAusText(KARTE_KI_ANWEISUNG.split('Regeln:')[0]);
ist('das Beispiel der Anweisung liest sich',
  [ausBeispiel.karte.breite, ausBeispiel.karte.hoehe], [8, 3]);
ist('  … und ergibt das gezeigte Gelaende',
  ausBeispiel.karte.gelaende, '..###...' + '..#./...' + '..###.~~');

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
