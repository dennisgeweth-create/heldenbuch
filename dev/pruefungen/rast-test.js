// Prueft die Rast: den Rechner fuer die Rastbedingung, die Trefferwuerfel,
// die Zauberpunkte und was eine kurze oder lange Rast mit einem Bogen
// macht — nach Standard und nach der Variante „Gradueller Rauer
// Realismus". Die Beispiele sind die, mit denen das Heft selbst rechnet.
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

// ── Der Rechner ──────────────────────────────────────────────────
ist('Wildnis bei moderatem Wetter ist ärmlich',
  rastVorschlag({basis: 2, niederschlag: 'leicht', temperatur: 'mild', wind: 'flaute'}).stufe, 2);
// Das Beispiel aus dem Heft: kalt und Regen −3, Zelt und Schlafsack +2,
// dazu ein Lagerfeuer — und man bleibt auf ärmlich.
ist('kalt und Regen: drei Stufen schlechter, also erbärmlich',
  rastVorschlag({basis: 2, niederschlag: 'regen', temperatur: 'kalt', wind: 'flaute'}).stufe, 1);
ist('  … mit Zelt und Schlafsack eine Stufe schlechter',
  rastVorschlag({basis: 5, niederschlag: 'regen', temperatur: 'kalt', wind: 'flaute',
                 massnahmen: ['zelt', 'schlafsack']}).stufe, 4);
ist('  … mit Lagerfeuer dazu wieder die Grundlage',
  rastVorschlag({basis: 4, niederschlag: 'regen', temperatur: 'kalt', wind: 'flaute',
                 massnahmen: ['zelt', 'schlafsack', 'feuer']}).stufe, 4);
ist('warm verbessert, so steht es in der Tabelle',
  rastVorschlag({basis: 2, temperatur: 'warm'}).stufe, 3);
ist('mäßiger Wind hilft bei Hitze',
  rastVorschlag({basis: 4, temperatur: 'heiss', wind: 'maessig'}).stufe, 4);
ist('Starkregen und Sturm: vier schlechter, aber nie unter erbärmlich',
  rastVorschlag({basis: 2, niederschlag: 'sturm', wind: 'orkan'}).stufe, 1);
ist('die Winzige Hütte hält das Wetter draußen',
  rastVorschlag({basis: 2, niederschlag: 'sturm', temperatur: 'arktis', wind: 'orkan',
                 massnahmen: ['huette']}).stufe, 2);
ist('das Herrenhaus ist komfortabel', rastVorschlag({basis: 1, massnahmen: ['herrenhaus']}).stufe, 5);
ist('die Posten nennen, woher die Zahl kommt',
  rastVorschlag({basis: 2, niederschlag: 'regen', temperatur: 'kalt'}).teile.map(t => t.wert), [-1, -2]);

// ── Trefferwürfel ────────────────────────────────────────────────
const multi = {charClass: 'Paladin', level: 5, multiclasses: [{charClass: 'Kleriker', level: 5}],
               trefferwuerfel: {10: 2, 8: 3}};
ist('ein Paladin 5 / Kleriker 5 hat W10 und W8 getrennt',
  trefferwuerfelVorrat(multi), [{w: 10, gesamt: 5, verbraucht: 2}, {w: 8, gesamt: 5, verbraucht: 3}]);
ist('zurück kommen die großen zuerst', trefferwuerfelZurueck(multi, 3), {10: 0, 8: 2});

// ── Zauberpunkte ─────────────────────────────────────────────────
ist('ein Magier 5 hat fünf', zauberpunkteGrund({charClass: 'Magier', level: 5}).punkte, 5);
ist('ein Waldläufer 5 die Hälfte, aufgerundet', zauberpunkteGrund({charClass: 'Waldläufer', level: 5}).punkte, 3);
ist('ein Mystischer Ritter 7 ein Drittel, aufgerundet',
  zauberpunkteGrund({charClass: 'Kämpfer', subclass: 'Mystischer Ritter', level: 7}).punkte, 3);
ist('ein Kämpfer ohne Zauber keinen', zauberpunkteGrund({charClass: 'Kämpfer', level: 7}).zaubert, false);
ist('der Hexenmeister zählt über den Pakt', zauberpunkteGrund({charClass: 'Hexenmeister', level: 3}),
  {punkte: 0, pakt: true, zaubert: true});
const magier = {charClass: 'Magier', level: 5, con: 12, hp: 10, maxHp: 27,
  spellSlots: {1: {max: 4, used: 3}, 2: {max: 3, used: 2}, 3: {max: 2, used: 1}}};
ist('zwei Plätze 2. Grad sind vier Punkte', zauberAuswahlSumme({2: 2}), 4);
ist('mehr als verbraucht geht nicht', zauberAuswahlGeht(magier, {3: 2}, 9), false);
ist('mehr als das Budget auch nicht', zauberAuswahlGeht(magier, {2: 2, 1: 2}, 5), false);
ist('  … bis dahin schon', zauberAuswahlGeht(magier, {2: 1, 1: 3}, 5), true);

// ── Die lange Rast nach der Variante ─────────────────────────────
const w = (c) => charWerte(c, {});
const kaempfer = {charClass: 'Kämpfer', level: 5, con: 15, hp: 10, maxHp: 44, erschoepfung: 2,
  trefferwuerfel: {10: 3}, resources: [{id: 'r', restType: 'kurz', used: 1, max: 1}]};
const komf = rastAnwenden(kaempfer, w(kaempfer), {art: 'lang', regel: 'grr', stufe: 5, essen: true});
ist('komfortabel: (1 + KON 2 + 1) × Stufe 5 = 20 TP', komf.patch.hp, 30);
ist('  … ein Trefferwürfel zurück', komf.patch.trefferwuerfel, {10: 2});
ist('  … eine Erschöpfung weniger', komf.patch.erschoepfung, 1);
ist('  … Ressourcen zurück', komf.patch.resources[0].used, 0);
const aerml = rastAnwenden(kaempfer, w(kaempfer), {art: 'lang', regel: 'grr', stufe: 2, essen: true});
ist('ärmlich: (1 + 2 − 1) × 5 = 10 TP', aerml.patch.hp, 20);
ist('  … und die Erschöpfung bleibt', aerml.patch.erschoepfung, undefined);
const schwach = {...kaempfer, con: 10};
ist('erbärmlich mit KON 0 gibt nichts, aber nicht weniger',
  rastAnwenden(schwach, w(schwach), {art: 'lang', regel: 'grr', stufe: 1, essen: true}).patch.hp, 10);
ist('ärmlich gibt mindestens 1 TP',
  rastAnwenden(schwach, w(schwach), {art: 'lang', regel: 'grr', stufe: 2, essen: true}).patch.hp, 11);
ist('nie über das Maximum', rastAnwenden({...kaempfer, hp: 40}, w(kaempfer), {art: 'lang', regel: 'grr', stufe: 7}).patch.hp, 44);
ist('ohne Essen bringt die lange Rast nichts',
  rastAnwenden(kaempfer, w(kaempfer), {art: 'lang', regel: 'grr', stufe: 5, essen: false}).patch, {});

const mg = rastAnwenden(magier, w(magier), {art: 'lang', regel: 'grr', stufe: 4}, {plaetze: {2: 1, 1: 3}});
ist('der Magier holt, was er gewählt hat', [mg.patch.spellSlots[1].used, mg.patch.spellSlots[2].used, mg.patch.spellSlots[3].used], [0, 1, 1]);
ist('  … und das steht in der Antwort', mg.saetze.some(s => /5 von 5 Zauberpunkten/.test(s)), true);
const mgArm = rastAnwenden(magier, w(magier), {art: 'lang', regel: 'grr', stufe: 1}, {plaetze: {2: 1, 1: 3}});
ist('erbärmlich sind es zwei Punkte weniger — die Wahl passt nicht mehr und zählt nicht',
  mgArm.patch.spellSlots[1].used, 3);

// Komplikationen
const kompl = (rw, w6, w4) => rastAnwenden(kaempfer, w(kaempfer), {art: 'lang', regel: 'grr', stufe: 1}, {rw, w6, w4});
ist('Rettungswurf geschafft: nichts', kompl(12).patch.rastLeiden, undefined);
ist('W6 = 1: eine Erschöpfung mehr (keine fällt weg)', kompl(7, 1).patch.erschoepfung, 3);
ist('W6 = 2: 1W4 TP weg', kompl(7, 2, 3).patch.hp, Math.max(0, 10 + Math.max(0, (1 + 2 - 2) * 5) - 3));
ist('W6 = 3: vergiftet', kompl(7, 3).patch.rastLeiden, ['Vergiftet']);
ist('W6 = 5: Kanalpest', kompl(3, 5).patch.rastLeiden, ['Kanalpest']);

// ── Die lange Rast nach Standard ─────────────────────────────────
const std = rastAnwenden({...magier, trefferwuerfel: {6: 5}}, w(magier), {art: 'lang', regel: 'standard'});
ist('Standard: volle Trefferpunkte', std.patch.hp, 27);
ist('  … alle Plätze', Object.values(std.patch.spellSlots).map(s => s.used), [0, 0, 0]);
ist('  … die Hälfte der Trefferwürfel', std.patch.trefferwuerfel, {6: 3});

// ── Die kurze Rast ───────────────────────────────────────────────
const kurzGrr = rastAnwenden({...kaempfer, tempHp: 2}, w(kaempfer), {art: 'kurz', regel: 'grr'},
  {wuerfe: [{w: 10, wurf: 6}, {w: 10, wurf: 3}]});
ist('Variante: Trefferwürfel geben temporäre TP (6+2 + 3+2)', kurzGrr.patch.tempHp, 13);
ist('  … und keine echten', kurzGrr.patch.hp, undefined);
ist('  … verbraucht werden sie trotzdem', kurzGrr.patch.trefferwuerfel, {10: 5});
ist('  … Kurzrast-Ressourcen zurück', kurzGrr.patch.resources[0].used, 0);
const kurzStd = rastAnwenden(kaempfer, w(kaempfer), {art: 'kurz', regel: 'standard'}, {wuerfe: [{w: 10, wurf: 6}]});
ist('Standard: Trefferwürfel heilen', kurzStd.patch.hp, 18);
ist('der Hexenmeister holt nach Standard seinen Pakt schon kurz',
  rastAnwenden({charClass: 'Hexenmeister', level: 3, spellSlots: {2: {max: 2, used: 2}}}, null,
               {art: 'kurz', regel: 'standard'}).patch.spellSlots[2].used, 0);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
