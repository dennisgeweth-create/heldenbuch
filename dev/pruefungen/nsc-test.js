// Prueft die NSC: Kennzeichen, Haltung, Umstellung der alten DM-Helden,
// und was von einem NSC im Kampf zu den Spielern geht.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n' + fs.readFileSync('js/util.js', 'utf8');
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

// ── Was ein NSC ist ──
const held = newChar();
ist('ein neuer Bogen ist ein Held, kein NSC', [istNsc(held), held.npc, held.dmOnly], [false, false, undefined]);

const wirt = alsNsc({...held, name: 'Wirt Arik'}, 'freundlich');
ist('aus einem Bogen wird ein NSC', [istNsc(wirt), wirt.haltung, wirt.dmOnly], [true, 'freundlich', true]);
ist('  … und er bleibt verborgen: npc setzt dmOnly', wirt.dmOnly, true);
const graf = alsNsc(wirt, 'feindlich');
ist('die Haltung laesst sich umstellen', [nscHaltung(graf), nscArt(graf).imKampf], ['feindlich', 'Gegner']);
ist('unbekannte Haltung gilt als freundlich', [nscHaltung({npc: true}), nscHaltung({npc: true, haltung: 'wirr'})], ['freundlich', 'freundlich']);
ist('der Verbuendete ist gruen, der Widersacher rot', NSC_HALTUNGEN.map(h => h.farbe), ['#56b183', '#e05a5a']);

const zurueck = alsHeld(graf);
ist('zurueck zum Helden: kein npc, keine Haltung, nicht mehr verborgen',
  [istNsc(zurueck), 'haltung' in zurueck, zurueck.dmOnly], [false, false, false]);
ist('  … und der Bogen bleibt sonst derselbe', [zurueck.name, zurueck.maxHp], ['Wirt Arik', 10]);

// ── Die alten DM-Helden ──
ist('ohne DM-Helden ist nichts umzustellen', nscMigration([held, wirt]), null);
const alt = [{id: 'a', name: 'Strahd', dmOnly: true}, {id: 'b', name: 'Armin'}];
const neu = nscMigration(alt);
ist('ein DM-Held wird ein freundlicher NSC', neu.map(c => [c.id, !!c.npc, c.haltung || '']), [['a', true, 'freundlich'], ['b', false, '']]);
ist('  … die Vorlage bleibt', alt[0].npc, undefined);
ist('  … und ein zweites Mal aendert nichts', nscMigration(neu), null);
ist('eine vorhandene Haltung bleibt stehen', nscMigration([{id: 'c', dmOnly: true, haltung: 'feindlich'}])[0].haltung, 'feindlich');

// ── Die Initiative, einmal geradegezogen ──
// Das Feld ist ein Bonus zur Geschicklichkeit. Der Assistent schrieb bis
// v5.31 den fertigen Modifikator hinein (Pip: Geschicklichkeit 17, im
// Feld 3 — im Bogen −4, im Kampf +6).
ist('ein neuer Bogen ist schon umgestellt', initiativeMigration([newChar()]), null);
const pip = {id: 'pip', dex: 17, initiative: 3};
const umgestellt = initiativeMigration([pip])[0];
ist('der doppelte Modifikator wird null', umgestellt.initiative, 0);
ist('  … und charWerte() sagt dann +3', charWerte(umgestellt).initiative, 3);
ist('  … einmal: ein zweiter Lauf aendert nichts', initiativeMigration([umgestellt]), null);
ist('auch nach einem Aufstieg (Geschicklichkeit 18, im Feld noch 3)',
  initiativeMigration([{id: 'p', dex: 18, initiative: 3}])[0].initiative, 0);
ist('ein echter Bonus bleibt (Aufmerksam, +5 bei Geschicklichkeit 14)',
  initiativeMigration([{id: 'a', dex: 14, initiative: 5}])[0].initiative, 5);
ist('null bleibt null', initiativeMigration([{id: 'z', dex: 12, initiative: 0}])[0].initiative, 0);
ist('ein alter Bogen ohne Zeichen wird gezeichnet',
  initiativeMigration([{id: 'o', dex: 10}])[0].initMigrated, INIT_MIGRATION);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
