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
     gearKind: 'umhang', description: 'Aus Elfenhand gewoben.',
     effects: [{id: 'e1', target: 'adv_stealth', mode: 'bonus', value: 0}],
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
// Die Ausgabe steht mit im Text: sieht sie jemand am Tisch, weiss er,
// welche Fassung diesen Text gemacht hat. Hier fehlt HB_VERSION — die
// Nummer steht in 0-basis.jsx, und die Rechnung laeuft ohne sie.
wahr('ohne HB_VERSION steht der Kopf trotzdem sauber da',
  text.includes('aus dem Heldenbuch (D&D 5e)'));
ist('  … und die Nummer kommt dazu, wenn es sie gibt',
  (globalThis.HB_VERSION = 'v9.9',
   heldText(c, {klassen: kl, setDefs: []}).includes('aus dem Heldenbuch v9.9 (D&D 5e)')),
  true);
delete globalThis.HB_VERSION;
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

// ── Getragenes ───────────────────────────────────────────────────
ist('die Rüstung mit ihrem Grundwert',
  zeileMit(text, 'Lederrüstung  (Grundwert'), 'Rüstung Lederrüstung (Grundwert RK 11)');
ist('was ein getragenes Stück bewirkt',
  zeileMit(text, 'Wirkt: Vorteil'), 'Wirkt: Vorteil: Heimlichkeit');
ist('ein magisches Stück nennt seine Seltenheit',
  zeileMit(text, 'Umhang der Elfen'), 'Umhang Umhang der Elfen (selten)');
// Was am Koerper haengt, steckt in den Werten und ist naeher an einem
// Merkmal als an einem Seil — deshalb mit seinem Text.
wahr('ein getragenes Stück bringt seinen Text mit',
  text.includes('Aus Elfenhand gewoben.'));
falsch('„gewöhnlich" steht nicht dabei — das ist keine Auskunft',
  /gew(ö|oe)hnlich/i.test(text));
// Die Waffe in der Hand steht oben schon vollstaendig da. Ihr Text
// gehoert nicht ein zweites Mal hierher.
ist('der Text der geführten Waffe steht nur einmal da',
  text.split('Aus Mondholz.').length - 1, 1);

// Das Inventar selbst steht nicht im Text: drei Fackeln und ein Seil
// sagen ueber den Helden nichts, und bei einem vollen Beutel waere es
// die laengste Liste im ganzen Bogen.
falsch('das Inventar steht nicht im Text', text.includes('INVENTAR'));
falsch('  … auch kein einzelner Gegenstand daraus', text.includes('Heiltrank'));
falsch('  … und kein Beutel', text.includes('Beutel'));
// Die Ruestung liegt im Inventar und wird getragen — sie muss trotzdem
// dastehen, denn ohne sie ergibt die Ruestungsklasse keinen Sinn.
wahr('was getragen wird, steht trotzdem da', text.includes('Lederrüstung'));

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

// Womit gezaubert wird, steht in der Klassenliste des Abenteuers. Steht
// die Klasse nicht darin — eine Hausklasse, ein Tippfehler —, gibt es
// keinen Zauber-SG. Der fiel oben stillschweigend weg: eine Zauberliste
// ohne die Zahl, nach der als erstes gefragt wird.
const fremd = heldText({...c, charClass: 'Wildhüterin'}, {klassen: kl, setDefs: []});
falsch('ohne Zauberattribut steht oben kein Zauber-SG',
  block(fremd, 'KAMPFWERTE').includes('Zauber-SG'));
wahr('  … aber es steht da, warum', fremd.includes('kein Zauberattribut'));
wahr('  … und welche Klasse gemeint ist', fremd.includes('„Wildhüterin"'));
wahr('  … die Zauber selbst stehen trotzdem da', fremd.includes('Jagdzeichen'));
falsch('  … ohne doppelte Leerzeilen', /\n\n\n/.test(fremd));
// Und wer ein Zauberattribut hat, bekommt den Hinweis nicht.
falsch('mit Zauberattribut steht kein Hinweis da', text.includes('kein Zauberattribut'));
// Eine Klasse ohne Zauber und ohne Zauberliste bekommt ihn auch nicht:
// der Hinweis haengt an den Zaubern, nicht an der Klasse.
falsch('ein Held ohne Zauber bekommt keinen Hinweis',
  heldText({...newChar(), name: 'Wache', charClass: 'Wildhüterin'},
    {klassen: kl, setDefs: []}).includes('kein Zauberattribut'));

// ── Vorteile ohne Zahl ───────────────────────────────────────────
// Sie stecken in keinem der Werte oben: ein Vorteil ist kein Bonus.
// Stuenden sie nicht eigens da, fehlten sie ganz.
ist('ein Vorteil steht mit seiner Quelle da',
  zeileMit(text, 'Vorteil: Heimlichkeit   ('), 'Vorteil: Heimlichkeit (Umhang der Elfen)');

// ── Notizen ──────────────────────────────────────────────────────
wahr('die freie Notiz kommt mit', text.includes('Sucht die Mörder ihrer Sippe.'));
wahr('eine Notiz mit Titel auch', text.includes('Der Ring   [Rätsel]'));
wahr('  … samt Inhalt', text.includes('Im Grab gefunden.'));

// ── Es kommt alles mit ───────────────────────────────────────────
// Der Text kennt keine kurze Fassung mehr: eine KI, der die Haelfte des
// Zaubertextes fehlt, raet sich den Rest zusammen — und das faellt am
// Tisch niemandem auf, bis es darauf ankommt. Jede Beschreibung, die im
// Bogen steht, steht deshalb auch hier.
wahr('jede Zauberbeschreibung kommt mit', text.includes('Ein Ziel bekommt 1W6'));
wahr('jede Merkmalsbeschreibung auch', text.includes('Solange sie Rüstung trägt.'));
wahr('  … und die des zweiten Merkmals', text.includes('Vorteil, ihre Spuren zu lesen.'));
wahr('jede Waffenbeschreibung auch', text.includes('Aus Mondholz.'));
wahr('und die Notizen', text.includes('Sucht die Mörder'));
// Ein zweites Auge darauf, dass wirklich keine fehlt: was im Bogen als
// Beschreibung steht, muss im Text wiederzufinden sein.
[...c.spells, ...c.features, ...c.weapons].forEach(x => {
  if (!x.description) return;
  const erste = x.description.split(' ').slice(0, 4).join(' ');
  if (text.includes(erste)) gut++;
  else { schlecht++; console.log('  FEHLER Beschreibung fehlt: ' + x.name); }
});

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
