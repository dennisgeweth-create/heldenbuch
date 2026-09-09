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
ist('die Initiative folgt daraus', p.neu.initiative, 2);
ist('  … und steht als Zeile da', zeile(p, 'Initiative'), '+2');
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

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
