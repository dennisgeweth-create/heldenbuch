// Prueft die Höhe auf der Kampfkarte: der Drache, der Vampir, die
// Spinne an der Wand.
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

// ── Die Entfernung bekommt eine dritte Achse ─────────────────────
ist('ohne Höhe bleibt alles, wie es war',
  karteWeit({x:0, y:0}, {x:3, y:2}), 3);
// Senkrecht darueber: zwoelf Meter sind acht Felder.
ist('senkrecht darüber zählt die Höhe',
  karteWeit({x:4, y:4, h:12}, {x:4, y:4}), 8);
ist('  … und andersherum genauso',
  karteWeit({x:4, y:4}, {x:4, y:4, h:12}), 8);
// Schraeg und hoch: die groesste der drei Achsen gewinnt.
ist('die größte der drei Achsen gewinnt',
  karteWeit({x:0, y:0, h:12}, {x:3, y:2}), 8);
ist('  … auch wenn die Waagerechte größer ist',
  karteWeit({x:0, y:0, h:3}, {x:9, y:0}), 9);
// Beide oben, gleich hoch: kein Unterschied.
ist('zwei auf gleicher Höhe messen wie am Boden',
  karteWeit({x:0, y:0, h:12}, {x:3, y:0, h:12}), 3);
ist('zwei übereinander in der Luft',
  karteWeit({x:2, y:2, h:15}, {x:2, y:2, h:3}), 8);
// Ein eigenes Feldmass rechnet anders.
ist('ein eigenes Feldmaß zählt', karteWeit({x:0, y:0, h:12}, {x:0, y:0}, 3), 4);
// Gerundet wird auf ganze Felder.
ist('zwei Meter sind ein Feld', karteWeit({x:0, y:0, h:2}, {x:0, y:0}), 1);
ist('ein halbes Feld rundet auf', karteWeit({x:0, y:0, h:0.8}, {x:0, y:0}), 1);
ist('ein Viertelfeld rundet ab', karteWeit({x:0, y:0, h:0.3}, {x:0, y:0}), 0);

// ── Setzen, lesen, wegnehmen ─────────────────────────────────────
const bau = () => ({breite: 5, hoehe: 3, feldMeter: 1.5,
  gelaende: '.....' + '..#..' + '.....',
  figuren: {h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'Dr'}}, verborgen: []});

ist('ohne Eintrag ist die Höhe null', karteHoehe(bau(), 'g1'), 0);
const oben = karteHoeheSetzen(bau(), 'g1', 12);
ist('gesetzt steht sie da', karteHoehe(oben, 'g1'), 12);
wahr('  … und die Figur schwebt', karteSchwebt(oben.figuren.g1));
falsch('  … die andere nicht', karteSchwebt(oben.figuren.h1));
ist('auf null gesetzt verschwindet das Feld wieder',
  'h' in karteHoeheSetzen(oben, 'g1', 0).figuren.g1, false);
ist('negativ wird zu null', karteHoehe(karteHoeheSetzen(oben, 'g1', -5), 'g1'), 0);
ist('eine unbekannte Figur ändert nichts',
  karteHoeheSetzen(bau(), 'gibtsnicht', 9).figuren, bau().figuren);
ist('die Höhe wird auf eine Nachkommastelle gerundet',
  karteHoehe(karteHoeheSetzen(bau(), 'g1', 4.26), 'g1'), 4.3);
ist('und liest sich mit Komma', karteHoeheText(4.5), '4,5 m');
ist('  … ganze Meter ohne Komma', karteHoeheText(12), '12 m');

// ── Wer fliegt, landet beim Ziehen nicht ─────────────────────────
const gezogen = karteFigurSetzen(oben, 'g1', 2, 2, 'Dr');
ist('die Höhe bleibt beim Ziehen', karteHoehe(gezogen, 'g1'), 12);
ist('  … und das Feld stimmt', karteName(gezogen.figuren.g1.x, gezogen.figuren.g1.y), 'C3');
// Beim Tausch behaelt jeder seine eigene.
const getauscht = karteFigurSetzen(oben, 'h1', 4, 1, 'Br');
ist('beim Tausch behält der Drache seine Höhe',
  karteHoehe(getauscht, 'g1'), 12);
ist('  … und der Held seine (keine)', 'h' in getauscht.figuren.h1, false);

// ── Im Textblock ─────────────────────────────────────────────────
const RUNDE = [
  {id: 'h1', name: 'Armin',             art: 'held',   hp: 32, hpMax: 38},
  {id: 'g1', name: 'Adult Blue Dragon', art: 'gegner', hp: 124, hpMax: 244},
];
const text = karteText(oben, RUNDE, {mitZahlen: true});
wahr('der Drache trägt seine Höhe in der Figurentafel',
  /Dr\s+Adult Blue Dragon\s+Gegner\s+E2\s+124\/244 TP · Höhe 12 m/.test(text));
falsch('wer am Boden steht, trägt keine Null mit sich herum',
  /Armin.*Höhe/.test(text));
wahr('die Entfernungstafel sagt, dass die Höhe mitzählt',
  text.includes('ENTFERNUNGEN (Felder, diagonal zählt eins, Höhe zählt mit)'));
// Br auf A2, Dr auf E2 (4 Felder) in 12 m Hoehe (8 Felder) → 8.
wahr('  … und rechnet sie mit', /Br → Dr\s+8/.test(text));
// Ohne jemanden in der Luft steht der Zusatz nicht da.
wahr('am Boden bleibt die Überschrift kurz',
  karteText(bau(), RUNDE, {}).includes('ENTFERNUNGEN (Felder, diagonal zählt eins)'));

// ── Sicht: die Wand bleibt eine Wand, aber die Frage wird gestellt ─
const sicht = text.split('SICHT')[1];
wahr('die Wand steht weiter im Weg', /Br → Dr\s+Wand auf C2/.test(sicht));
wahr('  … aber der Block sagt, dass der Drache oben ist',
  /Dr 12 m hoch/.test(sicht));
wahr('  … und wer darüber entscheidet',
  /darüber hinweg entscheidet die Spielleitung/.test(sicht));
// Am Boden steht der Zusatz nicht da.
falsch('am Boden ohne diesen Zusatz',
  /darüber hinweg/.test(karteText(bau(), RUNDE, {})));

// ── Der Kreis: ausgeben und wieder einlesen ──────────────────────
const zurueck = karteUebernehmen(text, RUNDE);
ist('die Höhe kommt beim Einlesen zurück', karteHoehe(zurueck.karte, 'g1'), 12);
ist('  … und der Held bleibt am Boden', 'h' in zurueck.karte.figuren.h1, false);
ist('  … auf denselben Feldern',
  [karteName(zurueck.karte.figuren.h1.x, zurueck.karte.figuren.h1.y),
   karteName(zurueck.karte.figuren.g1.x, zurueck.karte.figuren.g1.y)], ['A2', 'E2']);
// Auch mit Komma geschrieben.
const komma = karteUebernehmen(
  ['  A  B  C', '1 .  Dr #', '2 .  #  .', '', 'FIGUREN',
   '  Dr  Adult Blue Dragon   Gegner   B1   Höhe 4,5 m'].join('\n'), RUNDE);
ist('eine Höhe mit Komma wird gelesen', karteHoehe(komma.karte, 'g1'), 4.5);
// Und ohne Hoehe bleibt sie weg.
const ohne = karteUebernehmen(
  ['  A  B  C', '1 .  Dr #', '2 .  #  .', '', 'FIGUREN',
   '  Dr  Adult Blue Dragon'].join('\n'), RUNDE);
ist('ohne Angabe steht keine Höhe da', 'h' in ohne.karte.figuren.g1, false);

// ── Die Runde sieht die Höhe ─────────────────────────────────────
const fuer = karteFuerSpieler({...oben, zeigen: true});
ist('die Höhe geht an die Runde', fuer.figuren.g1.h, 12);
// Verborgen bleibt verborgen — auch der fliegende Drache.
const versteckt = karteFuerSpieler({...karteVerbergen(oben, 'g1'), zeigen: true});
ist('ein verborgener Drache fehlt ganz', Object.keys(versteckt.figuren), ['h1']);

// ── Die Aufnahme im Verlauf merkt den Höhenunterschied ───────────
const a = karteAufnahme(oben, RUNDE);
const b = karteAufnahme(karteHoeheSetzen(oben, 'g1', 18), RUNDE);
falsch('steigen ist eine Änderung', karteAufnahmeGleich(a, b));
wahr('gleiche Höhe ist keine',
  karteAufnahmeGleich(a, karteAufnahme(karteHoeheSetzen(oben, 'g1', 12), RUNDE)));

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
