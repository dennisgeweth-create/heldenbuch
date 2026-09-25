// Prueft den Plan des Charakterassistenten — vor allem das, was er
// NICHT sagen darf, solange die Attribute noch nicht stehen.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8');
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
const zeile = (p, was) => (p.zeilen.find(z => z.was === was) || {}).neu;

// ── Ein Volk allein macht noch keinen Wert ───────────────────────
// Der Fall aus dem Bericht: Waldgnom gewaehlt, sonst nichts. Der
// Waldgnom gibt Geschicklichkeit +1 — daraus wurde eine Geschicklichkeit
// von 1, und aus der ein Modifikator von minus fuenf.
const waldgnom = assistentPlan({volk: 'Gnom', untervolk: 'Waldgnom'});
ist('ohne Attribute keine Initiative', zeile(waldgnom, 'Initiative'), undefined);
ist('  … und keine Ruestungsklasse', zeile(waldgnom, 'Rüstungsklasse'), undefined);
falsch('  … auch nicht im Entwurf', 'ac' in waldgnom.neu || 'initiative' in waldgnom.neu);
// Was das Volk wirklich hergibt, steht weiter da.
ist('die Bewegung steht da', zeile(waldgnom, 'Bewegung'), '7.5 m');
wahr('die Sprachen auch', /Gnomisch/.test(zeile(waldgnom, 'Sprachen') || ''));
wahr('und die Merkmale', /Dunkelsicht/.test(zeile(waldgnom, 'Merkmale') || ''));
wahr('der Plan sagt, dass die Attribute fehlen',
  (waldgnom.fehlt || []).includes('die Attribute'));

// Dasselbe fuer jedes Volk mit einem Geschicklichkeitsbonus.
['Elf', 'Halbling'].forEach(v => {
  const p = assistentPlan({volk: v});
  ist(v + ' zeigt ohne Attribute keine RK', zeile(p, 'Rüstungsklasse'), undefined);
});

// ── Und fuer die Trefferpunkte gilt dasselbe ─────────────────────
// Vorher: Konstitution 0 + 2 vom Zwerg = 2, Modifikator minus vier,
// also W8 minus vier Trefferpunkte auf der ersten Stufe.
const zwerg = assistentPlan({volk: 'Zwerg', klasse: 'Kämpfer'});
ist('ohne Konstitution keine Trefferpunkte', zeile(zwerg, 'Trefferpunkte'), undefined);
falsch('  … auch nicht im Entwurf', 'maxHp' in zwerg.neu);
// Was die Klasse allein hergibt, steht weiter da.
wahr('die Rettungswürfe stehen da', !!zeile(zwerg, 'Rettungswürfe'));

// ── Stehen die Attribute, stimmt die Rechnung ────────────────────
const fertig = {
  name: 'Brunhilde', volk: 'Gnom', untervolk: 'Waldgnom', klasse: 'Kämpfer',
  hintergrund: HINTERGRUENDE[0].name,
  attribute: {str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8},
  fertigkeiten: [], ausruestung: 'gold', gold: 0,
};
const p = assistentPlan(fertig);
// Geschicklichkeit 14 + 1 (Waldgnom) = 15, Modifikator +2.
ist('die Geschicklichkeit zaehlt den Bonus dazu', p.neu.dex, 15);
// Die Initiative folgt aus der Geschicklichkeit und steht als Zeile da —
// gespeichert wird aber kein Wert, sondern nur ein Bonus von null. Bis
// v5.31 stand hier der Modifikator, und der zaehlte doppelt (im Bogen
// wurde aus +3 sogar −4).
ist('die Initiative steht als Zeile da', zeile(p, 'Initiative'), '+2');
ist('  … gespeichert wird kein Bonus', p.neu.initiative, 0);
ist('die Ruestungsklasse ist zehn plus Modifikator', p.neu.ac, 12);
// Intelligenz 12 + 2 (Gnom) = 14; Konstitution 13, Modifikator +1.
ist('die Intelligenz auch', p.neu.int, 14);
ist('die Trefferpunkte sind Trefferwuerfel plus Konstitution', p.neu.maxHp, 11);
ist('  … und hp faengt voll an', p.neu.hp, 11);

// Ein Attribut, das genau zehn ist, gilt als gesetzt — der Modifikator
// null ist ein Wert und kein fehlender Eintrag.
const zehn = assistentPlan({...fertig, attribute: {...fertig.attribute, dex: 10}});
ist('Geschicklichkeit zehn ist gesetzt', zehn.neu.ac, 10 + mod(11));
wahr('  … und die Zeile steht da', !!zeile(zehn, 'Initiative'));

// ── Der Plan bleibt sonst, wie er war ────────────────────────────
ist('der Name geht mit', p.neu.name, 'Brunhilde');
ist('das Volk steht ausgeschrieben da', p.neu.race, 'Gnom (Waldgnom)');
ist('die Stufe ist eins', p.neu.level, 1);
ist('nichts fehlt mehr', (p.fehlt || []).filter(x => x !== 'die Attribute').length > 0, true);

// ── Die Herkunft frei verteilen ──────────────────────────────────
// +2 und +1, oder dreimal +1 — auf beliebige Attribute, fuer jedes Volk.
ist('+2 und +1 ist gueltig', freiBoniGueltig({int: 2, dex: 1}), true);
ist('dreimal +1 auch', freiBoniGueltig({int: 1, dex: 1, con: 1}), true);
ist('+2 allein reicht nicht', freiBoniGueltig({int: 2}), false);
ist('zweimal +2 geht nicht', freiBoniGueltig({int: 2, dex: 2}), false);
ist('ein Klick gibt +1, der zweite +2, der dritte nichts',
  [freiBoniSchritt({}, 'int'), freiBoniSchritt({int: 1}, 'int'), freiBoniSchritt({int: 2}, 'int')],
  [{int: 1}, {int: 2}, {}]);
ist('mehr als drei Punkte gibt es nicht', freiBoniSchritt({int: 2, dex: 1}, 'con'), {int: 2, dex: 1});
ist('  … und kein zweites +2', freiBoniSchritt({int: 2, dex: 1}, 'dex'), {int: 2});
const zwergMagier = assistentPlan({
  name: 'Thorin', volk: 'Zwerg', untervolk: 'Hügelzwerg', klasse: 'Magier',
  hintergrund: HINTERGRUENDE[0].name,
  attribute: {str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10},
  bonusArt: 'frei', freiBoni: {int: 2, dex: 1},
  fertigkeiten: [], ausruestung: 'gold', gold: 0,
});
ist('der Zwerg-Magier legt +2 auf Intelligenz', zwergMagier.neu.int, 17);
ist('  … +1 auf Geschicklichkeit', zwergMagier.neu.dex, 15);
ist('  … und die Konstitution des Volkes gilt dann nicht', zwergMagier.neu.con, 13);
ist('  … das Tempo des Volkes aber schon', zwergMagier.neu.speed, 7.5);
const halbFrei = assistentPlan({volk: 'Zwerg', untervolk: 'Hügelzwerg', bonusArt: 'frei', freiBoni: {int: 2}});
ist('unvollstaendig verteilt fehlt noch etwas',
  halbFrei.fehlt.some(f => /freien Attributsboni/.test(f)), true);
const nachVolk = assistentPlan({volk: 'Zwerg', untervolk: 'Hügelzwerg', bonusArt: 'volk',
  attribute: {str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10}});
ist('nach Volk bekommt der Zwerg seine Konstitution', nachVolk.neu.con, 15);

// ── Das Abenteurerpaket, ausgepackt ─────────────────────────────
const kaempfer = (wahl) => assistentPlan({klasse: 'Kämpfer', ausruestung: 'paket', abenteuerpaket: wahl});
const inv = kaempfer('').neu.inventory;
const stueck = (liste, n) => liste.find(i => i.name === n);
ist('ohne Wahl das Paket der Klasse, ausgepackt', !!stueck(inv, 'Schlafsack') && !stueck(inv, 'Entdeckerpaket'), true);
ist('  … zehn Fackeln als ein Stueck mit Anzahl', stueck(inv, 'Fackel').qty, 10);
ist('  … mit Gewicht je Stueck', stueck(inv, 'Rucksack').weight, '2.5');
ist('  … und dem Paket als Schlagwort', stueck(inv, 'Rucksack').tags, ['Entdeckerpaket']);
ist('  … die Waffen der Klasse bleiben', !!stueck(inv, 'Langschwert'), true);
const gew = kaempfer('Gewölbeforscherpaket').neu.inventory;
ist('das Gewoelbeforscherpaket bringt die Brechstange', !!stueck(gew, 'Brechstange') && !stueck(gew, 'Schlafsack'), true);
ist('ein Paket, das die Klasse nicht anbietet, gilt nicht',
  !!stueck(kaempfer('Priesterpaket').neu.inventory, 'Schlafsack'), true);
ist('jede Klasse bietet nur Pakete an, die es gibt',
  Object.values(PAKET_WAHL).every(l => l.every(n => ABENTEURERPAKETE[n])), true);
ist('  … und ihr Paket steht unter ihren Wahlen',
  Object.keys(KLASSEN_REGELN).every(k => (KLASSEN_REGELN[k].paket || []).filter(n => ABENTEURERPAKETE[n])
    .every(n => (PAKET_WAHL[k] || []).includes(n))), true);
ist('keine Klasse hat mehr ein Paket, das es nicht gibt',
  Object.values(KLASSEN_REGELN).every(kl => !(kl.paket || []).some(n => /paket|ausrüstung$/i.test(n) && !ABENTEURERPAKETE[n])), true);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
