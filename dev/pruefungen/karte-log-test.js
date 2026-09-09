// Prueft die Aufnahme der Karte im Verlauf — Stufe 4. Nimmt die reine
// Rechnung der Karte und das Stueck Protokoll aus dem Tracker, das
// daraus Text macht. Beides ist JavaScript ohne React.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + fs.readFileSync('js/src/2c2-karte.jsx', 'utf8')
                 .split('// ══ Ende der reinen Rechnung')[0] + '\n'
             + fs.readFileSync('js/src/2c-kampf.jsx', 'utf8')
                 .split('// ── Das Protokoll ─')[1]
                 .split('// Derselbe Verlauf auf dem Schirm')[0]
                 .replace(/^[^\n]*\n/, '');
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

// Ein kleines Feld mit einer Wand in der Mitte.
const bau = (figuren) => ({breite: 5, hoehe: 3, feldMeter: 1.5,
  gelaende: '.....' + '..#..' + '.....', figuren: figuren || {}});
const LISTE = [
  {id: 'h1', name: 'Brunhilde', art: 'held',   hp: 22, hpMax: 30, zustaende: []},
  {id: 'g1', name: 'Goblin 1',  art: 'gegner', hp: 7,  hpMax: 7,  zustaende: ['liegend']},
  {id: 'g2', name: 'Goblin 2',  art: 'gegner', hp: 7,  hpMax: 7},
];

// ── Die Aufnahme ─────────────────────────────────────────────────
ist('ohne Karte gibt es keine Aufnahme', karteAufnahme(null, LISTE), null);

const a1 = karteAufnahme(bau({h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}}), LISTE);
ist('die Aufnahme traegt das Gelaende', a1.karte.gelaende, '.....' + '..#..' + '.....');
ist('  … und die Masze', [a1.karte.breite, a1.karte.hoehe], [5, 3]);
// Sie nimmt nur mit, wer auch draufsteht — der Verlauf wandert ins
// Archiv, wo es die Teilnehmerliste nicht mehr gibt.
ist('sie nennt nur die Figuren auf der Karte', a1.liste.map(x => x.id), ['h1', 'g1']);
ist('  … mit Namen und Seite',
  [a1.liste[0].name, a1.liste[0].art], ['Brunhilde', 'held']);
ist('  … mit Trefferpunkten', [a1.liste[0].hp, a1.liste[0].hpMax], [22, 30]);
ist('  … und Zustaenden, wenn es welche gibt', a1.liste[1].zustaende, ['liegend']);
falsch('leere Zustaende stehen nicht dabei', 'zustaende' in a1.liste[0]);

// ── Wann eine zweite Aufnahme faellig ist ────────────────────────
const gleich = karteAufnahme(bau({h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}}), LISTE);
wahr('dieselbe Stellung ist gleich', karteAufnahmeGleich(a1, gleich));

const gerueckt = karteAufnahme(bau({h1: {x:1, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}}), LISTE);
falsch('ein Feld weiter ist nicht mehr gleich', karteAufnahmeGleich(a1, gerueckt));

const dazu = karteAufnahme(bau({h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'},
                                g2: {x:4, y:2, k:'g2'}}), LISTE);
falsch('eine Figur mehr ist nicht gleich', karteAufnahmeGleich(a1, dazu));

const weniger = karteAufnahme(bau({h1: {x:0, y:1, k:'Br'}}), LISTE);
falsch('eine Figur weniger ist nicht gleich', karteAufnahmeGleich(a1, weniger));

const gemalt = {...bau({h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}}),
                gelaende: '.....' + '..##.' + '.....'};
falsch('neues Gelaende ist nicht gleich', karteAufnahmeGleich(a1, karteAufnahme(gemalt, LISTE)));

// Trefferpunkte sind kein Grund fuer eine zweite Karte — sie stehen
// schon Zeile fuer Zeile im Verlauf.
const wund = karteAufnahme(bau({h1: {x:0, y:1, k:'Br'}, g1: {x:4, y:1, k:'g1'}}),
  LISTE.map(x => x.id === 'h1' ? {...x, hp: 3} : x));
wahr('Schaden allein macht keine neue Aufnahme', karteAufnahmeGleich(a1, wund));

// ── Der Verlauf sammelt sie ein ──────────────────────────────────
ist('ohne Karte bleibt der Verlauf, wie er ist',
  logMitAufnahme([{art:'zug', r:1}], null, 1), [{art:'zug', r:1}]);

const l1 = logMitAufnahme([{art:'zug', r:1, wer:'Brunhilde'}], a1, 1);
ist('die erste Aufnahme kommt dazu', l1.length, 2);
ist('  … und traegt ihre Runde', [l1[1].art, l1[1].r], ['karte', 1]);

const l2 = logMitAufnahme(l1, gleich, 2);
ist('dieselbe Stellung kommt nicht zweimal', l2.length, 2);

const l3 = logMitAufnahme(l2, gerueckt, 2);
ist('eine geaenderte schon', l3.length, 3);
ist('  … in der neuen Runde', l3[2].r, 2);

// Und zurueck: wer sich wieder hinstellt, wo er stand, bekommt wieder
// eine Aufnahme — verglichen wird nur mit der letzten, nicht mit allen.
ist('zurueck an denselben Platz ist wieder eine Aenderung',
  logMitAufnahme(l3, a1, 3).length, 4);

// ── Und daraus wird Text ─────────────────────────────────────────
const kampf = {name: 'Am Tor', karte: null, log: [
  {art:'zug', r:1, wer:'Brunhilde'},
  {art:'bewegung', r:1, wer:'Brunhilde', von:'A2', auf:'B2', felder:1},
  {art:'karte', r:1, ...a1},
  {art:'zug', r:2, wer:'Goblin 1'},
]};

const mit = protokollText(kampf, true, 0, true);
wahr('mit Karte steht das Raster im Text', /A\s+B\s+C\s+D\s+E/.test(mit));
wahr('  … die Kopfzeile der Karte', mit.includes('🗺 KARTE  5 × 3'));
wahr('  … die Figurentafel', /Brunhilde/.test(mit) && /Goblin 1/.test(mit));
wahr('  … und die Entfernungen', mit.includes('ENTFERNUNGEN'));
wahr('die Zeilen des Verlaufs stehen weiter da',
  mit.includes('Brunhilde zieht A2 → B2 · 1 Feld'));
wahr('die Runden bleiben getrennt',
  mit.includes('── Runde 1') && mit.includes('── Runde 2'));

const ohne = protokollText(kampf, true, 0, false);
falsch('ohne Haekchen steht keine Karte da', ohne.includes('🗺 KARTE'));
wahr('  … der Verlauf aber schon',
  ohne.includes('Brunhilde zieht A2 → B2 · 1 Feld'));
// Die Aufnahme darf keine leere Runde aufmachen, wenn sie wegbleibt.
falsch('  … und keine Runde doppelt', /── Runde 1[\s\S]*── Runde 1/.test(ohne));

// Ohne Trefferpunkte steht in der Figurentafel auch keiner.
falsch('ohne Trefferpunkte bleiben sie auch aus der Karte weg',
  protokollText(kampf, false, 0, true).includes('22/30 TP'));
wahr('mit Trefferpunkten stehen sie darin',
  protokollText(kampf, true, 0, true).includes('22/30 TP'));

// ── Wie es jetzt aussieht ────────────────────────────────────────
// Der laufende Kampf steht mitten in einer Runde; die letzte Aufnahme
// ist aelter. Deshalb kommt die Stellung zum Schluss noch einmal.
const jetzt = protokollText(kampf, true, 0, true, gerueckt);
wahr('die laufende Stellung steht am Ende', jetzt.includes('── Jetzt ─'));
ist('  … und zwar genau einmal', jetzt.split('── Jetzt ─').length - 1, 1);
falsch('ohne Haekchen bleibt auch sie weg',
  protokollText(kampf, true, 0, false, gerueckt).includes('── Jetzt ─'));
falsch('und ohne laufende Karte steht sie nicht da',
  protokollText(kampf, true, 0, true, null).includes('── Jetzt ─'));
// Hat sich seit der letzten Aufnahme nichts gerueht, stuende dieselbe
// Karte zweimal untereinander.
falsch('unveraendert steht sie nicht noch einmal da',
  protokollText(kampf, true, 0, true, a1).includes('── Jetzt ─'));

// Jede Aufnahme sagt selbst, wohin sie gehoert — im Text steht sie
// hinter den Zeilen ihrer Runde, und das muss man lesen koennen.
wahr('die Aufnahme nennt ihre Runde', mit.includes('── Ende der Runde 1 ─'));

// ── Der Kreis schliesst sich ─────────────────────────────────────
// Was der Verlauf ausgibt, muss der Leser wieder aufnehmen koennen —
// sonst waere die Aufnahme eine Sackgasse.
const zurueck = karteAusText(karteText(a1.karte, a1.liste, {mitZahlen: true}));
ist('die Karte aus dem Verlauf liest sich zurueck',
  [zurueck.karte.breite, zurueck.karte.hoehe], [5, 3]);
ist('  … mit demselben Gelaende', zurueck.karte.gelaende, '.....' + '..#..' + '.....');
ist('  … und beiden Marken wieder da',
  zurueck.marken.map(m => m.k).sort(), ['Br', 'g1']);
ist('  … auf denselben Feldern',
  zurueck.marken.map(m => karteName(m.x, m.y)).sort(), ['A2', 'E2']);
// Die Namen aus der Figurentafel kommen mit — sonst wuesste der
// Zuordner nicht, welche Marke zu wem gehoert.
ist('  … und mit ihren Namen', zurueck.namen, {Br: 'Brunhilde', g1: 'Goblin 1'});

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
