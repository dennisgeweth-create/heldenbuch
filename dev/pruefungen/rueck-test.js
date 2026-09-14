// Prueft die Rechnung hinter dem Zugfenster und dem Rueckgaengig im
// Tracker: welche Zustaende umgelegt werden, was ein Schritt vom Helden
// behaelt, wann nachgefragt wird und wie der Kampf danach aussieht.
// Das Stueck steht in 2c-kampf.jsx zwischen „Im Zugfenster steht je Ziel"
// und der AktionsWahl — reines JavaScript ohne React.
const fs = require('fs');
const kampf = fs.readFileSync('js/src/2c-kampf.jsx', 'utf8');
const stueck = (von, bis) => {
  const a = kampf.indexOf(von), b = kampf.indexOf(bis, a);
  if (a < 0 || b < 0) throw new Error('Stueck nicht gefunden: ' + von);
  return kampf.slice(a, b);
};
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + fs.readFileSync('js/src/2c2-karte.jsx', 'utf8')
                 .split('// ══ Ende der reinen Rechnung')[0] + '\n'
             + stueck('const inVorbereitung', 'const sortiereNachIni') + '\n'
             + stueck('const AKTION_WORT', '// Haengt eine Kartenaufnahme') + '\n'
             + stueck('// Im Zugfenster steht je Ziel', 'const AktionsWahl');
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

// ── Zustaende im Zugfenster ──────────────────────────────────────
const LISTE = [
  {id: 'h', name: 'Brunhilde', zustaende: []},
  {id: 'g', name: 'Goblin', zustaende: ['Liegend']},
];
ist('ohne Ziele nichts', zustandsWechsel({}, LISTE), []);
ist('ein neuer Zustand geht an',
  zustandsWechsel({h: {zustand: ['Vergiftet']}}, LISTE),
  [{id: 'h', art: 'zustand', wer: 'Brunhilde', was: 'Vergiftet', an: true}]);
ist('ein bestehender geht aus',
  zustandsWechsel({g: {zustand: ['Liegend']}}, LISTE).map(x => x.an), [false]);
ist('doppelt angetippt steht er trotzdem nur einmal da',
  zustandsWechsel({h: {zustand: ['Taub', 'Taub']}}, LISTE).length, 1);
ist('ein Ziel, das nicht mehr im Kampf ist, faellt weg',
  zustandsWechsel({weg: {zustand: ['Taub']}}, LISTE), []);
ist('die Zeile liest sich', protokollZeile(zustandsWechsel({g: {zustand: ['Vergiftet']}}, LISTE)[0]),
  '   Goblin ist Vergiftet');

// ── Ein Schritt merkt sich den Helden ────────────────────────────
const held = {id: 'h', name: 'Brunhilde', hp: 31, tempHp: 0,
              spellSlots: {1: {max: 2, used: 0}}};
const schritt = {was: 'Zug', ganz: false, helden: {}, kampf: null};
rueckHeldMerken(schritt, held, {hp: 26, tempHp: 0});
rueckHeldMerken(schritt, {...held, hp: 26}, {hp: 20});
ist('der alte Wert ist der vor dem ersten Schreiben', schritt.helden.h.alt.hp, 31);
ist('  … der neue der nach dem letzten', schritt.helden.h.neu.hp, 20);
rueckHeldMerken(schritt, held, {konzentration: {name: 'Segen'}});
ist('ein Feld, das es noch nicht gab, ist vorher leer', schritt.helden.h.alt.konzentration, null);
rueckHeldMerken(null, held, {hp: 1});
ist('ohne offenen Schritt passiert nichts', schritt.helden.h.neu.hp, 20);

// ── Wann gefragt wird ────────────────────────────────────────────
const nachher = {...held, hp: 20, konzentration: {name: 'Segen'}, tempHp: 0};
ist('steht im Bogen, was der Tracker schrieb: keine Frage',
  rueckKonflikte(schritt, [nachher]), []);
ist('hat jemand die TP gedreht: die Frage nennt sie',
  rueckKonflikte(schritt, [{...nachher, hp: 24}]), ['Brunhilde · Trefferpunkte']);
ist('die Reihenfolge der Schluessel zaehlt nicht',
  rueckKonflikte({helden: {h: {name: 'B', alt: {}, neu: {spellSlots: {1: {used: 1, max: 2}}}}}},
                 [{id: 'h', spellSlots: {1: {max: 2, used: 1}}}]), []);
ist('ein Held, den es nicht mehr gibt, ist kein Widerspruch',
  rueckKonflikte(schritt, []), []);

// ── Der Kampf nach dem Zuruecknehmen ─────────────────────────────
const vor = {aktiv: true, phase: 'kampf', runde: 2, zug: 0, zwischen: null,
  teilnehmer: [
    {id: 'held-h', art: 'held', charId: 'h', ini: 15, zustaende: []},
    {id: 'g', art: 'gegner', name: 'Goblin', ini: 10, hp: 7, hpMax: 7, zustaende: []},
  ],
  log: [{art: 'start', r: 1, wer: 'K'}, {art: 'zug', r: 2, id: 'held-h', wer: 'Brunhilde'}]};
const jetzt = {...vor,
  teilnehmer: [
    {...vor.teilnehmer[0], ini: 17},                       // von Hand getippt
    {...vor.teilnehmer[1], hp: 2, zustaende: ['Liegend']},
  ],
  log: [...vor.log,
    {art: 'aktion', r: 2, wer: 'Brunhilde', was: 'Kriegshammer', modus: 'angriff'},
    {art: 'schaden', r: 2, wer: 'Goblin', wert: 5},
    {art: 'bewegung', r: 2, wer: 'Goblin', von: 'A1', auf: 'A2', felder: 1},
    {art: 'zustand', r: 2, wer: 'Goblin', was: 'Liegend', an: true}]};
const zurueck = rueckKampf(jetzt, {was: 'Zug', ganz: false, kampf: vor, helden: {}});
ist('der Goblin hat seine TP wieder', zurueck.teilnehmer[1].hp, 7);
ist('  … und liegt nicht mehr', zurueck.teilnehmer[1].zustaende, []);
ist('die getippte Initiative bleibt', zurueck.teilnehmer[0].ini, 17);
ist('das Protokoll: davor, der Zug auf der Karte, dann die Zeile',
  zurueck.log.map(e => e.art), ['start', 'zug', 'bewegung', 'rueck']);
ist('die Zeile nennt, was zurueckgenommen wurde', protokollZeile(zurueck.log[3]),
  '   ↶ Zurückgenommen: Angriff: Kriegshammer · Goblin nimmt 5 Schaden · Goblin ist Liegend');

// Ein Zugwechsel: Runde und Zug kommen zurueck.
const weiter = {...vor, runde: 3, zug: 0,
  log: [...vor.log, {art: 'zug', r: 3, id: 'held-h', wer: 'Brunhilde'}]};
const zw = rueckKampf(weiter, {was: 'Zugwechsel', kampf: {...vor, zug: 1}, helden: {}});
ist('ein Zugwechsel geht zurueck', [zw.runde, zw.zug], [2, 1]);
ist('  … ohne leere Zeile, er nennt sich selbst', zw.log[zw.log.length - 1].was, 'Zugwechsel');

// Jemand kam dazu: die ganze Aufstellung kommt zurueck.
const mehr = {...vor, teilnehmer: [...vor.teilnehmer, {id: 'o', art: 'gegner', name: 'Ork'}],
  log: [...vor.log, {art: 'dazu', r: 2, wer: 'Ork', hp: 15, ac: 13}]};
const ohne = rueckKampf(mehr, {was: 'Dazu', ganz: true, kampf: vor, helden: {}});
ist('wer dazukam, ist wieder weg', ohne.teilnehmer.map(t => t.id), ['held-h', 'g']);

// Wer inzwischen dazukam, ohne dass es der Schritt war, bleibt.
const spaeter = {...jetzt, teilnehmer: [...jetzt.teilnehmer, {id: 'o', art: 'gegner', hp: 9}]};
ist('ein spaeter Dazugekommener bleibt beim einfachen Schritt',
  rueckKampf(spaeter, {kampf: vor, helden: {}}).teilnehmer.length, 3);
ist('wer am Zug war, bleibt am Zug, auch wenn die Reihe sich verschob',
  rueckKampf({...jetzt, teilnehmer: [jetzt.teilnehmer[1], jetzt.teilnehmer[0]]},
             {kampf: vor, helden: {}}).zug, 1);

// In der Vorbereitung wird nichts ins Protokoll geschrieben.
const vb = {...vor, phase: 'vorbereitung', log: []};
ist('in der Vorbereitung bleibt das Protokoll leer',
  rueckKampf({...vb, teilnehmer: []}, {kampf: vb, ganz: true, helden: {}}).log, []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
