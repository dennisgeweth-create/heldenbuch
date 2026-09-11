// Prueft den Bogen als Text — den, den man einer KI hinlegt.
//
// Zwei Sorten Fehler sind hier moeglich, und nur eine faellt beim Lesen
// auf. Dass eine Ueberschrift schief steht, sieht man. Dass ein Angriff
// um eins danebenliegt oder ein Zauber fehlt, sieht man nicht — und die
// KI, die den Text bekommt, merkt es erst recht nicht. Deshalb wird hier
// vor allem geprueft, ob die Zahlen dieselben sind wie im Bogen und ob
// wirklich alles mitkommt.
const fs = require('fs');
// Alles bis zum Schnitt: dahinter steht React, und das gibt es hier nicht.
const heldtext = fs.readFileSync('js/src/2k-heldtext.jsx', 'utf8');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + heldtext.slice(0, heldtext.indexOf('// ══ Ende der reinen Rechnung'));
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
const wahr   = (n, a) => ist(n, !!a, true);
const falsch = (n, a) => ist(n, !!a, false);
// Die Zeile, in der ein Wort steht — so steht im Fehlerfall da, was
// wirklich dort stand, und nicht nur „false".
const zeileMit = (text, wort) =>
  (text.split('\n').find(z => z.includes(wort)) || '').replace(/\s+/g, ' ').trim();

// ── Eine Heldin mit allem, was der Bogen kann ────────────────────
const heldin = () => ({
  ...newChar(),
  id: 'h1', name: 'Dämmerlicht', race: 'Waldelf',
  charClass: 'Waldläufer', subclass: 'Jägerin', level: 5,
  multiclasses: [{charClass: 'Schurke', level: 2, subclass: 'Meuchlerin'}],
  background: 'Außenseiterin',
  str: 10, dex: 18, con: 14, int: 11, wis: 15, cha: 9,
  hp: 38, maxHp: 52, tempHp: 6, speed: 10.5, profBonus: 3, initiative: 0,
  inspiration: 1, inspirationMax: 1,
  savingThrowProfs: ['str', 'dex'],
  skillProfs: ['heimlichkeit', 'ueberleben', 'aufmerksamkeit'],
  expertiseProfs: ['heimlichkeit'],
  languages: ['Gemeinsprache', 'Elfisch'],
  toolProfs: ['Diebeswerkzeug'],
  weaponProfs: ['Einfache Waffen'],
  armorProfs: ['Leicht'],
  weapons: [
    {id: 'w1', name: 'Langbogen', attrKey: 'dex', proficient: true, range: '45 m',
     attackBonus: 0, damage: '1W8', damageType: 'Stich',
     properties: ['Zweihändig'], description: 'Aus Mondholz.', effects: []},
    {id: 'w2', name: 'Kurzschwert', attrKey: 'fin', proficient: true, range: '1,5 m',
     attackBonus: 0, damage: '1W6', damageType: 'Stich',
     properties: ['Finesse'], description: '', effects: []},
    {id: 'w3', name: 'Keule', attrKey: 'str', proficient: false, range: '1,5 m',
     attackBonus: 0, damage: '1W4', damageType: 'Wucht', properties: [], effects: []},
  ],
  inventory: [
    {id: 'i1', name: 'Lederrüstung', qty: 1, weight: '5', rarity: 'gewöhnlich',
     gearKind: 'ruestung', armorType: 'light', baseAC: 11, acBonus: 0,
     effects: [], effectsActive: false},
    {id: 'i2', name: 'Heiltrank', qty: 3, weight: '0,25', rarity: 'gewöhnlich',
     description: 'Heilt 2W4+2.', effects: []},
    {id: 'i3', name: 'Umhang der Elfen', qty: 1, weight: '0,5', rarity: 'selten',
     gearKind: 'umhang', effects: [{id: 'e1', target: 'adv_stealth', mode: 'bonus', value: 0}],
     effectsActive: false},
  ],
  gear: {ruestung: {k: 'i', id: 'i1'}, haupthand: {k: 'w', id: 'w1'}, umhang: {k: 'i', id: 'i3'}},
  gearMigrated: 3,
  currency: {pp: 0, gp: 24, ep: 0, sp: 7, cp: 3},
  features: [
    {id: 'f1', name: 'Erzfeind: Untote', source: 'Waldläufer 1',
     description: 'Vorteil, ihre Spuren zu lesen.', effects: [], effectsActive: true},
    {id: 'f2', name: 'Kampfstil: Verteidigung', source: 'Waldläufer 2',
     description: 'Solange sie Rüstung trägt.',
     effects: [{id: 'e2', target: 'ac', mode: 'bonus', value: 1}], effectsActive: true},
    {id: 'f3', name: 'Zäher Schlaf', source: 'Volk',
     description: '', effects: [{id: 'e3', target: 'speed', mode: 'bonus', value: 3}],
     effectsActive: false},
  ],
  spells: [
    {id: 's1', name: 'Jagdzeichen', level: 1, school: 'Weissagung',
     castingTime: '1 Bonusaktion', range: '27 m', components: 'V',
     duration: 'Konzentration, bis zu 1 Stunde',
     description: 'Ein Ziel bekommt 1W6 Extraschaden.', prepared: true},
    {id: 's2', name: 'Ranken', level: 1, school: 'Beschwörung', castingTime: '1 Aktion',
     range: '9 m', components: 'V, S', duration: '10 Minuten', description: '', prepared: false},
    {id: 's3', name: 'Lichtfunke', level: 0, school: 'Hervorrufung', castingTime: '1 Aktion',
     range: 'Berührung', components: 'V, S', duration: '1 Stunde', description: 'Leuchtet.'},
  ],
  spellSlots: {1: {max: 4, used: 1}, 2: {max: 2, used: 0}, 3: {max: 0, used: 0},
               4: {max: 0, used: 0}, 5: {max: 0, used: 0}, 6: {max: 0, used: 0},
               7: {max: 0, used: 0}, 8: {max: 0, used: 0}, 9: {max: 0, used: 0}},
  resources: [{id: 'r1', name: 'Verstohlener Angriff', max: 1, used: 0, restType: 'kurz'}],
  notes: 'Sucht die Mörder ihrer Sippe.',
  notesList: [{id: 'n1', title: 'Der Ring', content: 'Im Grab gefunden.', tags: ['Rätsel']}],
});

const kl = KLASSEN_STANDARD;
const c = heldin();
const text = heldText(c, {klassen: kl, setDefs: []});

// ── Der Kopf ─────────────────────────────────────────────────────
wahr('der Name steht oben', /^═+\n  DÄMMERLICHT\n═+/.test(text));
wahr('das Volk steht da', text.includes('Waldelf'));
wahr('beide Klassen mit Unterklasse', text.includes('Waldläufer 5 (Jägerin) / Schurke 2 (Meuchlerin)'));
wahr('der Hintergrund auch', text.includes('Außenseiterin'));
ist('die Gesamtstufe wird gezählt', zeileMit(text, 'Gesamtstufe'),
  'Gesamtstufe 7 · Übungsbonus +3');

// ── Die Werte, gegen die Rechnung des Bogens ─────────────────────
// Nicht gegen von Hand ausgerechnete Zahlen: dann pruefte die Pruefung
// ihre eigene Rechnung. charWerte ist es, was der Bogen anzeigt.
const w = charWerte(c, []);
ist('die Rüstungsklasse ist die des Bogens',
  zeileMit(text, 'Rüstungsklasse'), 'Rüstungsklasse ' + w.ac);
ist('  … und sie hat den Kampfstil drin', w.ac, 16);
ist('die Trefferpunkte samt temporären',
  zeileMit(text, 'Trefferpunkte'), 'Trefferpunkte 38 von 52 (+6 temporär)');
ist('die Initiative', zeileMit(text, 'Initiative'), 'Initiative ' + fnum(w.initiative));
ist('die Bewegung steht deutsch da', zeileMit(text, 'Bewegung'), 'Bewegung 10,5 m');
ist('die passive Wahrnehmung', zeileMit(text, 'Passive Wahrnehmung'),
  'Passive Wahrnehmung ' + w.passive);
ist('der Zauber-SG', zeileMit(text, 'Zauber-SG'), 'Zauber-SG 13');
ist('der Zauberangriff mit seinem Attribut',
  zeileMit(text, 'Zauberangriff'), 'Zauberangriff +5 (Weisheit)');

// ── Attribute und Rettungswürfe ──────────────────────────────────
ist('ein geübter Rettungswurf trägt den Stern',
  zeileMit(text, 'Geschicklichkeit'), 'Geschicklichkeit 18 (+4) Rettungswurf +7 ★');
ist('ein ungeübter nicht',
  zeileMit(text, 'Konstitution'), 'Konstitution 14 (+2) Rettungswurf +2');
ist('und ein negativer steht mit Vorzeichen da',
  zeileMit(text, 'Charisma '), 'Charisma 9 (-1) Rettungswurf -1');

// ── Fertigkeiten ─────────────────────────────────────────────────
// Alle achtzehn, auch die ungeuebten: sonst bekommt die KI auf „wie gut
// schleicht sie?" bei siebzehn von achtzehn Fertigkeiten keine Antwort.
// Nur der Block: „Wahrnehmung" steht auch oben bei den Kampfwerten, und
// die passive ist keine Fertigkeitszeile.
const block = (t, wort) => t.split(/\n(?=[A-ZÄÖÜ])/).find(a => a.startsWith(wort)) || '';
const fertigBlock  = block(text, 'FERTIGKEITEN');
const fertigZeilen = fertigBlock.split('\n').slice(1).filter(z => z.trim());
ist('alle achtzehn Fertigkeiten stehen da', fertigZeilen.length, SKILLS.length);
ist('Expertise verdoppelt und wird markiert',
  zeileMit(fertigBlock, 'Heimlichkeit'), '★★ Heimlichkeit (Ges) +10');
ist('geübt bekommt einen Stern',
  zeileMit(fertigBlock, 'Überlebenskunst'), '★ Überlebenskunst (Wei) +5');
ist('ungeübt bekommt keinen', zeileMit(fertigBlock, 'Akrobatik'), 'Akrobatik (Ges) +4');
SKILLS.forEach(sk => {
  const z = zeileMit(fertigBlock, sk.label + ' ');
  if (!z.endsWith(fnum(w.skills[sk.key]))) {
    schlecht++;
    console.log('  FEHLER ' + sk.label + ' steht falsch\n     ist  ' + z
      + '\n     soll enden auf ' + fnum(w.skills[sk.key]));
  } else gut++;
});

// Der Alleskoenner: halber Uebungsbonus, wo nichts geuebt ist.
const barde = heldText({...c, jackOfAllTrades: true}, {klassen: kl, setDefs: []});
ist('der Alleskönner wird als solcher markiert',
  zeileMit(block(barde, 'FERTIGKEITEN'), 'Akrobatik'), '½ Akrobatik (Ges) +5');
ist('  … und rührt das Geübte nicht an',
  zeileMit(block(barde, 'FERTIGKEITEN'), 'Überlebenskunst'), '★ Überlebenskunst (Wei) +5');

// ── Übungen ──────────────────────────────────────────────────────
ist('die Sprachen', zeileMit(text, 'Sprachen'), 'Sprachen Gemeinsprache, Elfisch');
ist('die Werkzeuge', zeileMit(text, 'Werkzeuge'), 'Werkzeuge Diebeswerkzeug');
ist('die Rüstungen', zeileMit(text, 'Rüstungen'), 'Rüstungen Leicht');

// ── Waffen ───────────────────────────────────────────────────────
wahr('jede Waffe steht da',
  ['Langbogen', 'Kurzschwert', 'Keule'].every(n => text.includes('  ' + n)));
ist('Angriff und Schaden einer geübten Waffe',
  zeileMit(text, 'Reichweite 45 m'),
  'Angriff +7 · Schaden 1W8 + 4 (Stich) · Reichweite 45 m [Ges, geübt]');
// Finesse nimmt das bessere von Staerke und Geschick — hier Geschick,
// und im Text steht, welches es geworden ist.
ist('Finesse wählt das bessere Attribut und sagt es',
  zeileMit(text, 'Reichweite 1,5 m'),
  'Angriff +7 · Schaden 1W6 + 4 (Stich) · Reichweite 1,5 m [Ges, geübt]');
ist('ungeübt heisst ohne Übungsbonus',
  zeileMit(text, '1W4'), 'Angriff +0 · Schaden 1W4 (Wucht) · Reichweite 1,5 m [Stä, ungeübt]');
ist('was in der Hand liegt, steht dabei', zeileMit(text, 'Geführt'), 'Geführt: Haupthand');
ist('die Eigenschaften auch', zeileMit(text, 'Eigenschaften: Finesse'), 'Eigenschaften: Finesse');

// ── Getragenes und Inventar ──────────────────────────────────────
ist('die Rüstung mit ihrem Grundwert',
  zeileMit(text, 'Lederrüstung  (Grundwert'), 'Rüstung Lederrüstung (Grundwert RK 11)');
ist('was ein getragenes Stück bewirkt',
  zeileMit(text, 'Wirkt: Vorteil'), 'Wirkt: Vorteil: Heimlichkeit');
ist('die Anzahl im Inventar', zeileMit(text, '× Heiltrank'), '3× Heiltrank (0,25 kg)');
ist('  … und die Seltenheit, wo es eine gibt',
  zeileMit(text, '× Umhang'), '1× Umhang der Elfen (selten · 0,5 kg)');
ist('der Beutel', zeileMit(text, 'Beutel'), 'Beutel 24 GM · 7 SM · 3 KM');
falsch('leere Münzsorten stehen nicht da', /0 PM|0 EM/.test(text));

// ── Was sich verbraucht ──────────────────────────────────────────
ist('die Zauberplätze nach Grad',
  zeileMit(text, 'Zauberplätze'), 'Zauberplätze Grad 1: 3 von 4 frei · Grad 2: 2 von 2 frei');
ist('eine Ressource mit ihrer Rast',
  zeileMit(text, 'Verstohlener'), 'Verstohlener Angriff 1 von 1 frei (kurze Rast)');

// ── Merkmale ─────────────────────────────────────────────────────
wahr('jedes Merkmal steht da',
  c.features.every(f => text.includes(f.name)));
ist('ein wirkendes Merkmal sagt, was es tut',
  zeileMit(text, 'Wirkt: Rüstungsklasse'), 'Wirkt: Rüstungsklasse +1');
// Ein ausgeschaltetes Merkmal wird nicht verschwiegen — aber es steht
// dabei, dass es gerade nicht zaehlt.
ist('ein ruhendes Merkmal steht als ruhend da',
  zeileMit(text, 'Ruht:'), 'Ruht: ' + EFFECT_LABELS.speed + ' +3');
ist('  … und seine Zahl steckt nicht in der Bewegung', w.eff.speed, 10.5);

// ── Zauber ───────────────────────────────────────────────────────
wahr('jeder Zauber steht da', c.spells.every(s => text.includes(s.name)));
wahr('Zaubertricks stehen unter ihrer eigenen Überschrift', text.includes('  Zaubertricks'));
wahr('die Grade unter ihrer', text.includes('  Grad 1   (3 von 4 Plätzen frei)'));
ist('ein Zauber trägt seine Angaben',
  zeileMit(text, 'Weissagung'),
  'Weissagung · 1 Bonusaktion · 27 m · V · Konzentration, bis zu 1 Stunde');
wahr('nicht Vorbereitetes ist als solches erkennbar',
  text.includes('Ranken   [nicht vorbereitet]'));
falsch('Vorbereitetes trägt keinen Vermerk', /Jagdzeichen\s+\[/.test(text));
// Zaubertricks haben keine Plaetze — „0 von 0 frei" waere Unsinn.
falsch('Zaubertricks bekommen keine Platzzahl', /Zaubertricks\s+\(/.test(text));

// ── Vorteile ohne Zahl ───────────────────────────────────────────
// Sie stecken in keinem der Werte oben: ein Vorteil ist kein Bonus.
// Stuenden sie nicht eigens da, fehlten sie ganz.
ist('ein Vorteil steht mit seiner Quelle da',
  zeileMit(text, 'Vorteil: Heimlichkeit   ('), 'Vorteil: Heimlichkeit (Umhang der Elfen)');

// ── Notizen ──────────────────────────────────────────────────────
wahr('die freie Notiz kommt mit', text.includes('Sucht die Mörder ihrer Sippe.'));
wahr('eine Notiz mit Titel auch', text.includes('Der Ring   [Rätsel]'));
wahr('  … samt Inhalt', text.includes('Im Grab gefunden.'));

// ── Die kurze Fassung ────────────────────────────────────────────
// Sie laesst die Beschreibungen weg — und sonst nichts. Was eine Zahl
// ist, bleibt drin.
const kurz = heldText(c, {klassen: kl, setDefs: [], lang: false});
falsch('kurz: keine Zauberbeschreibung', kurz.includes('Ein Ziel bekommt 1W6'));
falsch('kurz: keine Merkmalsbeschreibung', kurz.includes('Solange sie Rüstung trägt.'));
falsch('kurz: keine Gegenstandsbeschreibung', kurz.includes('Heilt 2W4+2.'));
falsch('kurz: keine Notizen', kurz.includes('Sucht die Mörder'));
wahr('kurz: die Zauber stehen trotzdem da', kurz.includes('Jagdzeichen'));
wahr('kurz: die Merkmale auch', kurz.includes('Kampfstil: Verteidigung'));
wahr('kurz: und jede Fertigkeit', kurz.includes('★★ Heimlichkeit'));
wahr('kurz ist kürzer', kurz.length < text.length);

// ── Ein Held, der fast nichts hat ────────────────────────────────
// Der haeufigste Fall am ersten Abend: angelegt, benannt, sonst nichts.
// Leere Abschnitte duerfen dann nicht als leere Ueberschriften dastehen.
const frisch = heldText({...newChar(), name: 'Neuling'}, {klassen: kl, setDefs: []});
wahr('ein frischer Held bekommt trotzdem einen Text', frisch.includes('NEULING'));
wahr('  … mit seinen Attributen', frisch.includes('ATTRIBUTE'));
wahr('  … und allen Fertigkeiten', frisch.includes('Athletik'));
falsch('  … aber ohne leeren Waffenblock', frisch.includes('WAFFEN'));
falsch('  … ohne leeres Inventar', frisch.includes('INVENTAR'));
falsch('  … ohne leere Zauberliste', frisch.includes('ZAUBER'));
falsch('  … ohne leere Merkmale', frisch.includes('MERKMALE'));
falsch('  … ohne leere Notizen', frisch.includes('NOTIZEN'));
falsch('  … und ohne doppelte Leerzeilen', /\n\n\n/.test(frisch));
falsch('auch der volle Text hat keine doppelten Leerzeilen', /\n\n\n/.test(text));

// Und gar kein Held ist kein Absturz.
ist('ohne Held kommt nichts zurück', heldText(null, {}), '');

// ── Der Umbruch ──────────────────────────────────────────────────
// Eine Zauberbeschreibung ist oft ein halber Absatz. Sie muss umbrechen,
// und zwar mit Einzug — sonst laeuft sie unter die Ueberschriften.
const lang = 'Wort '.repeat(60).trim();
const gebrochen = htUmbruch(lang, '      ');
wahr('lange Beschreibungen brechen um', gebrochen.length > 1);
wahr('  … und bleiben in der Breite',
  gebrochen.every(z => z.length <= 78));
wahr('  … jede Zeile mit Einzug', gebrochen.every(z => z.startsWith('      ')));
ist('Absätze bleiben Absätze', htUmbruch('eins\n\nzwei', '  '), ['  eins', '', '  zwei']);
ist('ein Wort, das allein nicht passt, steht trotzdem da',
  htUmbruch('x'.repeat(120), '  ').length, 1);
ist('nichts gibt nichts', htUmbruch('', '  '), []);
ist('und undefined auch nichts', htUmbruch(undefined, '  '), []);

// Im ganzen Text: keine Zeile laeuft aus dem Rahmen, ausser denen, die
// aus dem Bogen kommen — eine Zauberdauer laesst sich nicht umbrechen.
const zuLang = text.split('\n').filter(z => z.length > 100);
ist('keine Zeile laeuft weit aus dem Rahmen', zuLang, []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
