// Prueft die Plausibilitaet beim Zugeintragen: was gemeldet wird, und
// vor allem, was nicht gemeldet wird.
//
// Eine Warnung, die zu oft kommt, wird weggeklickt, ohne gelesen zu
// werden — dann ist sie schlimmer als keine. Deshalb steht hier bei
// jedem Fall auch der Gegenfall: der Fehlschlag ohne Schaden, der
// Zauber, der nur festhaelt, der Gegner mit blosser Zahl.
const fs = require('fs');
const kampf = fs.readFileSync('js/src/2c-kampf.jsx', 'utf8');
const von = kampf.indexOf('const zugMaengel');
const bis = kampf.indexOf('// ══ Ende der Plausibilitaet');
if (von < 0 || bis < 0) { console.log('  FEHLER: zugMaengel nicht gefunden'); process.exit(1); }
eval(kampf.slice(von, bis) + ';globalThis.zugMaengel = zugMaengel;');
// Die Zustaende stehen in js/data.js — sie gehoeren zum Kampf wie das
// Zugfenster, und „Fliegend" ist der, den jeder Tisch fuehrt.
const daten = fs.readFileSync('js/data.js', 'utf8');
eval(daten.slice(daten.indexOf('const CONDITIONS'), daten.indexOf('// Reiter des Abenteuerlogs'))
  + ';globalThis.CONDITIONS = CONDITIONS;');

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};
const keine = (n, z) => ist(n, zugMaengel(z), []);
const meldet = (n, z, muster) => {
  const raus = zugMaengel(z);
  const treffer = raus.filter(x => muster.test(x));
  if (treffer.length === 1) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + JSON.stringify(raus) + '\n     soll genau eine Zeile auf ' + muster);
};

const LISTE = [{id: 'g1', name: 'Goblin 1'}, {id: 'g2', name: 'Goblin 2'}, {id: 'h1', name: 'Brunhilde'}];
const schwert = {name: 'Langschwert', damage: '1W8', damageType: 'Hieb'};
const angriff = (ziele) => ({
  art: 'angriff', gegenstand: schwert, liste: LISTE, ziele, richtung: 'schaden',
  mitSchalter: true, erwartetWert: true, grad: 0, grundGrad: 0, platzFrei: 0,
});

// ── Der gewoehnliche Fall: nichts zu melden ──────────────────────
keine('ein Treffer mit Schaden ist in Ordnung', angriff({g1: {treffer: true, wert: 7}}));
keine('ein Fehlschlag braucht keinen Schaden', angriff({g1: {treffer: false, wert: 0}}));
keine('Zusatzschaden mit Art ist in Ordnung',
  angriff({g1: {treffer: true, wert: 5, zusatz: [{wert: 3, art: 'Feuer'}]}}));
keine('nur Zusatzschaden genügt auch',
  angriff({g1: {treffer: true, wert: 0, zusatz: [{wert: 4, art: 'Gift'}]}}));

// ── Was fehlt ────────────────────────────────────────────────────
meldet('Treffer ohne Schaden faellt auf', angriff({g1: {treffer: true, wert: 0}}), /Goblin 1.*kein Schaden/);
ist('  … und nennt jedes Ziel einzeln',
  zugMaengel(angriff({g1: {treffer: true, wert: 0}, g2: {treffer: true, wert: 0}})).length, 2);
meldet('Angriff ohne Ziel faellt auf', angriff({}), /Kein Ziel/);
keine('ein Merkmal ohne Ziel ist in Ordnung — Zweiter Atem trifft niemanden',
  {art: 'merkmal', gegenstand: {name: 'Aktionsschub'}, liste: LISTE, ziele: {}, richtung: 'schaden', mitSchalter: true});
meldet('… eines, das heilt, will aber wissen, wen',
  {art: 'merkmal', gegenstand: {name: 'Zweiter Atem'}, liste: LISTE, ziele: {},
   richtung: 'heilung', erwartetWert: true}, /Kein Ziel/);
meldet('Zusatzschaden ohne Art faellt auf',
  angriff({g1: {treffer: true, wert: 5, zusatz: [{wert: 3, art: ' '}]}}), /Schadensart/);
// Blosser Schaden ohne Waffe ist am Tisch der schnellste Weg — die
// Zeile im Protokoll heisst dann nur „Goblin: 7 Schaden“, und das
// genuegt. Deshalb wird die fehlende Wahl nicht gemeldet.
keine('Schaden ohne gewaehlte Waffe ist in Ordnung',
  {art: 'angriff', gegenstand: null, liste: LISTE, ziele: {g1: {wert: 7}}, richtung: 'schaden'});
keine('… beim Gegner gibt es nichts zu waehlen',
  {art: 'frei', nurWerte: true, gegenstand: null, liste: LISTE, ziele: {g1: {wert: 4}}, richtung: 'schaden', erwartetWert: true});
meldet('… ein angekreuztes Ziel ohne alles faellt auf',
  {art: 'frei', nurWerte: true, gegenstand: null, liste: LISTE, ziele: {g1: {wert: 0}}, richtung: 'schaden'},
  /Goblin 1.*geschieht nichts/);
keine('… mit angehaengter Wirkung geschieht etwas',
  {art: 'frei', nurWerte: true, gegenstand: null, liste: LISTE, ziele: {g1: {wert: 0}},
   richtung: 'schaden', laufend: true});

// ── Heilung sagt Heilung ─────────────────────────────────────────
meldet('bei Heilung heisst es nicht Schaden',
  {art: 'zauber', gegenstand: {name: 'Wunden heilen'}, liste: LISTE, ziele: {h1: {wert: 0}},
   richtung: 'heilung', erwartetWert: true, grundGrad: 1, grad: 1, platzFrei: 2},
  /Brunhilde.*keine Heilung/);

// ── Rettungswurf ─────────────────────────────────────────────────
const feuerball = (ziele, gemeinsam) => ({
  art: 'zauber', gegenstand: {name: 'Feuerball'}, liste: LISTE, ziele, richtung: 'schaden',
  mitRettung: true, flaeche: true, gemeinsam, erwartetWert: true,
  grundGrad: 3, grad: 3, platzFrei: 1,
});
keine('ein Flaechenzauber mit gemeinsamem Schaden ist in Ordnung',
  feuerball({g1: {bestanden: false}, g2: {bestanden: true}}, 24));
meldet('… ohne Zahl faellt er auf', feuerball({g1: {bestanden: false}}, 0), /zusammen.*kein Schaden/);
keine('wer den Rettungswurf bestanden hat, braucht keine Zahl',
  {art: 'zauber', gegenstand: {name: 'Blitz'}, liste: LISTE, ziele: {g1: {bestanden: true, wert: 0}},
   richtung: 'schaden', mitRettung: true, erwartetWert: true, grundGrad: 3, grad: 3, platzFrei: 1});

// ── Zauberplatz und Ressource ────────────────────────────────────
meldet('ein leerer Zauberplatz faellt auf',
  {art: 'zauber', gegenstand: {name: 'Magisches Geschoss'}, liste: LISTE, ziele: {g1: {wert: 3}},
   richtung: 'schaden', erwartetWert: true, grundGrad: 1, grad: 2, platzFrei: 0},
  /Zauberplatz vom 2\. Grad/);
keine('ein Zaubertrick kostet keinen Platz',
  {art: 'zauber', gegenstand: {name: 'Feuerpfeil'}, liste: LISTE, ziele: {g1: {wert: 5}},
   richtung: 'schaden', erwartetWert: true, grundGrad: 0, grad: 0, platzFrei: 0});
meldet('eine leere Ressource faellt auf',
  {art: 'merkmal', gegenstand: {name: 'Zweiter Atem'}, liste: LISTE, ziele: {},
   ressourceLeer: true, ressourceName: 'Zweiter Atem'},
  /Zweiter Atem.*aufgebraucht/);

// ── Konzentration ────────────────────────────────────────────────
meldet('der gehaltene Zauber faellt, und das steht da',
  {art: 'zauber', gegenstand: {name: 'Person festhalten'}, liste: LISTE, ziele: {g1: {}},
   grundGrad: 2, grad: 2, platzFrei: 1, konzGehalten: 'Segen', konzNeu: 'Person festhalten'},
  /Segen.*fallen/);
keine('derselbe Zauber noch einmal laesst nichts fallen',
  {art: 'zauber', gegenstand: {name: 'Segen'}, liste: LISTE, ziele: {g1: {zustand: ['Gesegnet']}},
   grundGrad: 1, grad: 1, platzFrei: 1, konzGehalten: 'Segen', konzNeu: 'Segen'});

// ── Ein Ziel, an dem nichts geschieht ────────────────────────────
meldet('angekreuzt, aber es passiert nichts',
  {art: 'zauber', gegenstand: {name: 'Licht'}, liste: LISTE, ziele: {g1: {}},
   grundGrad: 0, grad: 0, platzFrei: 0},
  /Goblin 1.*geschieht nichts/);
keine('… mit Zustand geschieht etwas',
  {art: 'zauber', gegenstand: {name: 'Person festhalten'}, liste: LISTE,
   ziele: {g1: {zustand: ['Gelähmt']}}, grundGrad: 2, grad: 2, platzFrei: 1});
keine('… und ein Zustand aus der Wirkung zaehlt auch',
  {art: 'zauber', gegenstand: {name: 'Person festhalten'}, liste: LISTE, ziele: {g1: {}},
   autoZustaende: () => ['Gelähmt'], grundGrad: 2, grad: 2, platzFrei: 1});

// ── Nichts eingetragen, nichts zu meckern ────────────────────────
keine('ein leeres Fenster meldet nichts', {art: 'frei', liste: LISTE, ziele: {}});
keine('freier Text ohne Ziel ist in Ordnung', {art: 'frei', liste: LISTE, ziele: {}, text: 'Er weicht zurück.'});
ist('Ziele, die nicht mehr im Kampf stehen, zaehlen nicht',
  zugMaengel(angriff({weg: {treffer: true, wert: 0}})), ['Kein Ziel angekreuzt.']);

// ── Zustaende ────────────────────────────────────────────────────
ist('„Fliegend" steht bei den Zuständen', CONDITIONS.includes('Fliegend'), true);
ist('  … und die alten sind alle noch da',
  ['Geblendet', 'Betäubt', 'Bezaubert', 'Erschöpft', 'Verängstigt', 'Gepackt', 'Handlungsunfähig',
   'Unsichtbar', 'Gelähmt', 'Versteinert', 'Vergiftet', 'Liegend', 'Festgesetzt', 'Bewusstlos', 'Taub']
    .filter(z => !CONDITIONS.includes(z)), []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
