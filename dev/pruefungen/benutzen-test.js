// Prueft „Benutzen“ am Bogen: was ein Zauber, ein Gegenstand, ein
// Merkmal und eine Ressource verbrauchen, was ins Log geschrieben wird,
// und wie die Rast Ladungen wieder auffuellt (js/util.js, 2m-rast.jsx).
const fs = require('fs');
const rast = fs.readFileSync('js/src/2m-rast.jsx', 'utf8');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + rast.slice(0, rast.indexOf('// ══ Ende der reinen Rechnung'));
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
const immer = (wert) => () => wert;     // ein Zufall, der immer dasselbe zeigt

// ── Was ein Gegenstand verbraucht ────────────────────────────────
ist('ohne Angabe verbraucht nichts', gegenstandNutzung({name: 'Seil'}), '');
ist('der alte Kampf-Haken gilt als Verbrauchsgut', gegenstandNutzung({kampf: true}), 'stueck');
ist('eine ausdrückliche Wahl schlägt den Haken', gegenstandNutzung({kampf: true, nutzung: ''}), '');
ist('Ladung bleibt Ladung', gegenstandNutzung({nutzung: 'ladung'}), 'ladung');
ist('Unsinn zählt nicht', gegenstandNutzung({nutzung: 'quatsch'}), '');
ist('Ladungen werden begrenzt', ladungenStand({ladungen: {max: 3, used: 9}}),
  {max: 3, used: 3, frei: 0, auffuellen: '', wurf: ''});
ist('Vorrat eines Tranks ist die Menge', gegenstandVorrat({nutzung: 'stueck', qty: 2}), 2);
ist('Vorrat eines Stabs sind die freien Ladungen',
  gegenstandVorrat({nutzung: 'ladung', ladungen: {max: 7, used: 2}}), 5);
ist('ein Seil geht immer', gegenstandVorrat({name: 'Seil'}), Infinity);
ist('verbraucht: ein Stück weniger', gegenstandVerbraucht({nutzung: 'stueck', qty: 2}).qty, 1);
ist('verbraucht: nie unter null', gegenstandVerbraucht({nutzung: 'stueck', qty: 0}).qty, 0);
ist('verbraucht: eine Ladung mehr verbraucht',
  gegenstandVerbraucht({nutzung: 'ladung', ladungen: {max: 7, used: 2, wurf: '1W6+1'}}).ladungen,
  {max: 7, used: 3, wurf: '1W6+1'});

// ── Gegenstand benutzen ──────────────────────────────────────────
const held = {
  id: 'h1', name: 'Brunhilde',
  inventory: [
    {id: 'i1', name: 'Trank der Heilung', qty: 2, kampf: true},
    {id: 'i2', name: 'Zauberstab', nutzung: 'ladung', ladungen: {max: 7, used: 6, auffuellen: 'lang', wurf: '1W6+1'}},
    {id: 'i3', name: 'Seil', qty: 1},
    {id: 'i4', name: 'Leere Flasche', nutzung: 'stueck', qty: 0},
  ],
  spellSlots: {1: {max: 4, used: 3}, 2: {max: 2, used: 2}, 3: {max: 1, used: 0}},
  spells: [
    {id: 's0', name: 'Feuerpfeil', level: 0},
    {id: 's1', name: 'Segnen', level: 1, duration: 'Konzentration, bis zu 1 Minute'},
    {id: 's2', name: 'Magie entdecken', level: 1, ritual: true, duration: 'Konzentration, bis zu 10 Minuten'},
    {id: 's3', name: 'Feuerball', level: 3, duration: 'Sofort'},
    {id: 's4', name: 'Alarm', level: 1, castingTime: '1 Minute oder Ritual'},
  ],
  resources: [
    {id: 'r1', name: 'Zweiter Wind', max: 1, used: 0},
    {id: 'r2', name: 'Ki', max: 4, used: 3},
  ],
  features: [
    {id: 'f1', name: 'Zweiter Wind', ressource: 'r1'},
    {id: 'f2', name: 'Schlag der Geduld', ressource: 'r2', ressourceKosten: 2},
    {id: 'f3', name: 'Kampfstil'},
    {id: 'f4', name: 'Odem', ressource: 'r1', zauber: 'Feuerball'},
  ],
  konzentration: {id: 's9', name: 'Schild des Glaubens'},
};

let r = gegenstandBenutzen(held, 'i1');
ist('Trank: Menge sinkt', r.patch.inventory.find(i => i.id === 'i1').qty, 1);
ist('Trank: der Rest bleibt unberührt', r.patch.inventory.find(i => i.id === 'i3'), held.inventory[2]);
ist('Trank: Log-Zeile', r.text, 'Benutzt: Trank der Heilung — 1 übrig');
ist('Trank: Einzelheiten fürs Log', r.details, {verbraucht: '1 Stück', uebrig: 1});
r = gegenstandBenutzen(held, 'i2');
ist('Stab: Ladung geht ab', r.patch.inventory.find(i => i.id === 'i2').ladungen.used, 7);
ist('Stab: Log-Zeile', r.text, 'Benutzt: Zauberstab — 0/7 Ladungen');
r = gegenstandBenutzen({...held, inventory: r.patch.inventory}, 'i2');
ist('Stab leer: verweigert', r.fehler, 'Zauberstab hat keine Ladung mehr.');
ist('Seil: verbraucht nichts', gegenstandBenutzen(held, 'i3').fehler, 'Seil verbraucht beim Benutzen nichts.');
ist('leere Flasche: verweigert', gegenstandBenutzen(held, 'i4').fehler, 'Von Leere Flasche ist nichts mehr da.');
ist('weg: verweigert', !!gegenstandBenutzen(held, 'gibtsnicht').fehler, true);

// ── Zauber wirken ────────────────────────────────────────────────
const z = (id) => held.spells.find(s => s.id === id);
ist('Grade für Segnen: alle mit Plätzen ab 1',
  zauberGradWahl(held, z('s1')), [{grad: 1, max: 4, frei: 1}, {grad: 2, max: 2, frei: 0}, {grad: 3, max: 1, frei: 1}]);
ist('Vorschlag: der kleinste freie', zauberGradVorschlag(held, z('s1')), 1);
ist('Vorschlag ohne freien Platz', zauberGradVorschlag({...held, spellSlots: {1: {max: 1, used: 1}}}, z('s1')), null);
ist('Zaubertrick: keine Grade', zauberGradWahl(held, z('s0')), []);

r = zauberWirken(held, z('s0'));
ist('Zaubertrick kostet nichts', r.patch, {});
ist('Zaubertrick im Log', r.text, 'Gewirkt: Feuerpfeil (Zaubertrick)');
r = zauberWirken(held, z('s1'), {grad: 1});
ist('Segnen: Platz 1 geht ab', r.patch.spellSlots[1], {max: 4, used: 4});
ist('Segnen: andere Grade bleiben', r.patch.spellSlots[3], {max: 1, used: 0});
ist('Segnen: hält Konzentration', r.patch.konzentration, {id: 's1', name: 'Segnen'});
ist('Segnen: Log nennt, was endet', r.text,
  'Gewirkt: Segnen (Grad 1, noch 0/4 Plätze) · Konzentration, Schild des Glaubens endet');
ist('Segnen: Einzelheiten', r.details, {grad: 1, platzUebrig: 0, konzentration: 'Segnen'});
ist('Segnen hochgestuft auf Grad 3', zauberWirken(held, z('s1'), {grad: 3}).patch.spellSlots[3].used, 1);
ist('kein freier Platz: verweigert', zauberWirken(held, z('s1'), {grad: 2}).fehler,
  'Kein Zauberplatz des 2. Grades mehr frei.');
ist('Feuerball unter seinem Grad: verweigert', !!zauberWirken(held, z('s3'), {grad: 1}).fehler, true);
ist('Feuerball: ohne Konzentration', zauberWirken(held, z('s3'), {grad: 3}).patch.konzentration, undefined);
ist('ohne Grad nimmt er den eigenen', zauberWirken(held, z('s3')).details.grad, 3);
r = zauberWirken(held, z('s2'), {ritual: true});
ist('Ritual: kein Platz', r.patch.spellSlots, undefined);
ist('Ritual: im Log', r.text.startsWith('Gewirkt: Magie entdecken (als Ritual, ohne Zauberplatz)'), true);
ist('Ritual aus der Wirkzeit gelesen', zauberIstRitual(z('s4')), true);
ist('Feuerball ist kein Ritual', zauberWirken(held, z('s3'), {ritual: true}).fehler, 'Feuerball ist kein Ritual.');
r = zauberWirken(held, z('s3'), {frei: true});
ist('ohne Platz: nichts geht ab', r.patch, {});
ist('ohne Platz: im Log', r.text, 'Gewirkt: Feuerball (ohne Zauberplatz)');
ist('dieselbe Konzentration: nichts endet',
  zauberWirken({...held, konzentration: {id: 's1', name: 'Segnen'}}, z('s1'), {grad: 1}).text,
  'Gewirkt: Segnen (Grad 1, noch 0/4 Plätze) · Konzentration');

// ── Merkmale und Ressourcen ──────────────────────────────────────
r = merkmalEinsetzen(held, 'f1');
ist('Zweiter Wind: Ressource geht ab', r.patch.resources[0].used, 1);
ist('Zweiter Wind: Ki bleibt', r.patch.resources[1], held.resources[1]);
ist('Zweiter Wind: Log', r.text, 'Eingesetzt: Zweiter Wind — Zweiter Wind −1, noch 0/1');
ist('Schlag der Geduld: kostet 2, nur 1 übrig', merkmalEinsetzen(held, 'f2').fehler,
  'Von Ki ist nicht genug übrig (1, gebraucht 2).');
ist('Kampfstil: nichts verknüpft', merkmalEinsetzen(held, 'f3').fehler,
  'Kampfstil ist mit keiner Ressource verknüpft.');
ist('Odem nennt den Zauber', merkmalEinsetzen(held, 'f4').text,
  'Eingesetzt: Odem — Zweiter Wind −1, noch 0/1 · wirkt Feuerball');
ist('merkmalRessource rechnet den Rest', merkmalRessource(held, held.features[1]).rest, 1);
r = ressourceEinsetzen(held, 'r2');
ist('Ki unmittelbar: −1', r.patch.resources[1].used, 4);
ist('Ki unmittelbar: Log', r.text, 'Eingesetzt: Ki — noch 0/4');
ist('Ki leer: verweigert', !!ressourceEinsetzen({...held, resources: r.patch.resources}, 'r2').fehler, true);

// ── Würfel und Rast ──────────────────────────────────────────────
ist('1W6+1 mit der Mitte', formelWerfen('1W6+1', immer(0.5)), 5);
ist('2d4 klein geschrieben', formelWerfen('2d4', immer(0)), 2);
ist('eine blosse Zahl', formelWerfen('3'), 3);
ist('Unsinn', formelWerfen('viel'), null);
ist('dieselbe Saat, dieselben Zahlen',
  [saatZufall(42)(), saatZufall(42)()][0] === saatZufall(42)(), true);

const inv = [
  {id: 'a', name: 'Zauberstab', nutzung: 'ladung', ladungen: {max: 7, used: 6, auffuellen: 'lang', wurf: '1W6+1'}},
  {id: 'b', name: 'Ring', nutzung: 'ladung', ladungen: {max: 3, used: 3, auffuellen: 'kurz'}},
  {id: 'c', name: 'Stecken', nutzung: 'ladung', ladungen: {max: 5, used: 2, auffuellen: ''}},
  {id: 'd', name: 'Trank', nutzung: 'stueck', qty: 1},
];
let l = ladungenAuffuellen(inv, 'kurz', immer(0.5));
ist('kurze Rast: nur was bei jeder Rast lädt', l.inventar.map(g => g.ladungen && g.ladungen.used), [6, 0, 2, undefined]);
ist('kurze Rast: die Zeile', l.saetze, ['Ring +3 Ladungen']);
l = ladungenAuffuellen(inv, 'lang', immer(0.5));
ist('lange Rast: Würfel gibt 5 zurück', l.inventar[0].ladungen.used, 1);
ist('lange Rast: beide Zeilen', l.saetze, ['Zauberstab +5 Ladungen', 'Ring +3 Ladungen']);
ist('lange Rast: von Hand bleibt', l.inventar[2], inv[2]);
ist('nichts zu tun: dieselbe Liste', ladungenAuffuellen([inv[3]], 'lang').inventar === undefined, false);
ist('nichts zu tun: kein Satz', ladungenAuffuellen([inv[2], inv[3]], 'lang').saetze, []);
ist('mehr gewürfelt als verbraucht: voll, nicht drüber',
  ladungenAuffuellen([{name: 'S', nutzung: 'ladung', ladungen: {max: 7, used: 1, auffuellen: 'lang', wurf: '1W6+1'}}],
                     'lang', immer(0.99)).inventar[0].ladungen.used, 0);

// Die Rast selbst: im Patch steht das Inventar, in den Sätzen die Ladung.
const rastHeld = {name: 'R', charClass: 'Kämpfer', level: 3, hp: 10, inventory: inv,
                  resources: [], spellSlots: {}};
const werte = {maxHp: 30, eff: {con: 10}};
let a = rastAnwenden(rastHeld, werte, {art: 'kurz'}, {saat: 7});
ist('kurze Rast: Ring wieder voll', a.patch.inventory.find(g => g.id === 'b').ladungen.used, 0);
ist('kurze Rast: im Ergebnis genannt', a.saetze.includes('Ring +3 Ladungen'), true);
const b1 = rastAnwenden(rastHeld, werte, {art: 'lang'}, {saat: 7});
const b2 = rastAnwenden(rastHeld, werte, {art: 'lang'}, {saat: 7});
ist('lange Rast: Vorschau und Übernehmen gleich', b1.patch.inventory, b2.patch.inventory);
ist('lange Rast: Zauberstab lädt', b1.patch.inventory[0].ladungen.used < 6, true);
ist('ohne Ladungen: kein Inventar im Patch',
  rastAnwenden({...rastHeld, inventory: [inv[3]]}, werte, {art: 'lang'}, {}).patch.inventory, undefined);

// ── Was die Karten im Zugfenster zeigen ──────────────────────────
const werteH = {eff: {str: 16, dex: 12, profBonus: 3}, effekte: []};
ist('Langschwert: Angriff mit Übung', waffeWerte({attrKey: 'str', proficient: true, damage: '1W8'}, werteH).bonus, 6);
ist('  … der Schaden mit Stärke', waffeWerte({attrKey: 'str', proficient: true, damage: '1W8'}, werteH).dmgStr, '1W8 + 3');
ist('Finesse nimmt das Bessere', waffeWerte({attrKey: 'fin', damage: '1W6'}, {eff: {str: 8, dex: 16, profBonus: 2}}).aKey, 'dex');
ist('angelegt über die Haupthand', waffeAngelegt({gear: {haupthand: {k: 'w', id: 'w1'}}}, {id: 'w1'}), true);
ist('nicht angelegt', waffeAngelegt({gear: {haupthand: {k: 'w', id: 'w2'}}}, {id: 'w1'}), false);
ist('Wirkzeit Bonusaktion', aktionsZeit({castingTime: '1 Bonusaktion'}, 'zauber'), 'bonus');
ist('Wirkzeit Reaktion', aktionsZeit({castingTime: '1 Reaktion, wenn …'}, 'zauber'), 'reaktion');
ist('Ritual von zehn Minuten', aktionsZeit({castingTime: '10 Minuten'}, 'zauber'), 'lang');
ist('Merkmal mit Bonusaktion im Text', aktionsZeit({description: 'Als <b>Bonusaktion</b> heilst du …'}, 'merkmal'), 'bonus');
ist('Merkmal mit Reaktion', aktionsZeit({description: 'Du kannst deine Reaktion nutzen, um …'}, 'merkmal'), 'reaktion');
ist('Merkmal ohne Angabe', aktionsZeit({description: 'Dunkelsicht 18 m.'}, 'merkmal'), '');
ist('bei Waffen wird nicht geraten', aktionsZeit({name: 'Dolch'}, 'angriff'), '');
ist('einsetzbar: mit Ressource', merkmalEinsetzbar({ressource: 'r1'}), true);
ist('einsetzbar: Aktionsschub nach dem Text', merkmalEinsetzbar({description: 'Einmal je Rast eine <b>zusätzliche Aktion</b>.'}), true);
ist('einsetzbar: nicht der Kampfstil', merkmalEinsetzbar({name: 'Kampfstil', description: '+1 RK.'}), false);
ist('Auszug ohne Auszeichnung', textAuszug('<p>Ein <b>kurzer</b> Satz.</p>'), 'Ein kurzer Satz.');
ist('Auszug kürzt am Wort', textAuszug('eins zwei drei vier fünf sechs', 16), 'eins zwei drei …');

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
