// Prueft den Textbogen: schreiben, lesen, und beides hintereinander.
// Der Anspruch ist eng — was hinausgeht, muss unveraendert wieder
// hereinkommen, sonst ist der Export eine Sackgasse.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + fs.readFileSync('js/src/2n-bogentext.jsx', 'utf8')
                 .split('// ══ Ende der reinen Rechnung')[0];
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

// ── Ein Bogen mit allem, was das Schema kennt ────────────────────
const held = {
  ...newChar(), id: 'alt1', name: 'Brunhilde Eisenfaust', race: 'Zwergin',
  charClass: 'Kämpfer', level: 3, background: 'Soldatin', profBonus: 3,
  multiclasses: [{charClass: 'Waldläufer', level: 2, subclass: 'Jäger'}],
  str: 16, dex: 12, con: 15, int: 10, wis: 12, cha: 8,
  hp: 31, maxHp: 44, tempHp: 4, ac: 18, speed: 7.5, initiative: 1,
  inspiration: 1, inspirationMax: 2, erschoepfung: 2,
  sorceryPoints: {max: 5, used: 2},
  savingThrowProfs: ['str', 'con'],
  skillProfs: ['athletik', 'einschuechtern'],
  expertiseProfs: ['athletik'],
  jackOfAllTrades: true,
  languages: ['Gemeinsprache', 'Zwergisch'],
  toolProfs: ['Schmiedewerkzeug'],
  weaponProfs: ['Einfache Waffen', 'Kriegswaffen'],
  spellSlots: {...newChar().spellSlots, 1: {max: 4, used: 1}, 2: {max: 2, used: 0}},
  resources: [{id: 'r1', name: 'Kampfrausch', abbr: 'KR', max: 3, used: 1, color: '#e05a5a', restType: 'kurz'}],
  features: [
    {id: 'f1', name: 'Aktionsschub', source: 'Kämpfer 2',
     description: '<p>Einmal je Rast eine <b>zusätzliche Aktion</b>.</p><p>Danach eine kurze Rast.</p>',
     effects: [{id: 'x1', target: 'ac', mode: 'bonus', value: 1}], effectsActive: true,
     ressource: 'r1', ressourceKosten: 2, zauber: 'Person festhalten'},
  ],
  weapons: [{...newWeapon(), id: 'w1', name: 'Kriegshammer', attrKey: 'str', proficient: true,
    range: '1,5m', attackBonus: 2, damage: '1W8', damageType: 'Wucht',
    properties: ['Vielseitig'], description: '<p>Vom Vater.</p>',
    effects: [{id: 'x2', target: 'str', mode: 'set', value: 19}]}],
  spells: [{...newSpell(), id: 's1', name: 'Person festhalten', level: 2, school: 'Verzauberung',
    castingTime: '1 Aktion', range: '18 m', duration: '1 Minute', components: 'V, S, M',
    prepared: false, description: '<p>Hält jemanden fest.</p>'}],
  inventory: [
    {...newItem(), id: 'i1', name: 'Kettenhemd', qty: 1, rarity: 'gewöhnlich', weight: '25',
     wert: 75, source: 'Startausrüstung', tags: ['Rüstung'], gearKind: 'ruestung',
     armorType: 'medium', baseAC: 13, acBonus: 0, kampf: false,
     effects: [{id: 'x3', target: 'ac', mode: 'bonus', value: 1}], effectsActive: true,
     description: '<p>Schwer, aber gut.</p>'},
    {...newItem(), id: 'i2', name: 'Heiltrank', qty: 3, rarity: 'ungewöhnlich', kampf: true},
  ],
  gear: {ruestung: {k: 'i', id: 'i1'}, haupthand: {k: 'w', id: 'w1'}},
  gearMigrated: GEAR_MIGRATION,
  currency: {pp: 1, gp: 27, ep: 0, sp: 8, cp: 12},
  notes: '<p>Sucht den Hammer ihres Vaters.</p>',
  notesList: [{id: 'n1', title: 'Der Hammer', tags: ['Ziel', 'Familie'],
    content: '<p>Zuletzt in Barovia gesehen.</p>'}],
};

const text = bogenAlsText(held);
wahr('der Text beginnt mit der Marke', text.startsWith('# Heldenbuch-Bogen 1'));
wahr('  … und nennt den Namen im Abschnitt [Bogen]', /\[Bogen\]\nName: Brunhilde Eisenfaust/.test(text));
wahr('  … die Auszeichnung der Beschreibung ist Text geworden', /Text: Einmal je Rast eine zusätzliche Aktion\./.test(text));
wahr('  … ein zweiter Absatz steht eingerückt darunter', /\n {4}Danach eine kurze Rast\./.test(text));
wahr('  … Bewegung steht deutsch', /Bewegung: 7,5/.test(text));

const {bogen, warnungen, fehler} = bogenAusText(text);
ist('gelesen ohne Fehler und ohne Warnung', [fehler, warnungen], ['', []]);

// ── Was hin und zurück gleich bleiben muss ───────────────────────
const gleich = (feld) => ist('  ' + feld + ' bleibt', bogen[feld], held[feld]);
['name', 'race', 'charClass', 'level', 'background', 'profBonus',
 'str', 'dex', 'con', 'int', 'wis', 'cha',
 'hp', 'maxHp', 'tempHp', 'ac', 'speed', 'initiative', 'inspiration', 'inspirationMax',
 'erschoepfung', 'savingThrowProfs', 'skillProfs', 'expertiseProfs', 'jackOfAllTrades',
 'languages', 'toolProfs', 'weaponProfs', 'currency', 'sorceryPoints', 'multiclasses'].forEach(gleich);
ist('  Zauberplätze bleiben', [bogen.spellSlots[1], bogen.spellSlots[2], bogen.spellSlots[3]],
    [{max: 4, used: 1}, {max: 2, used: 0}, {max: 0, used: 0}]);
ist('  die Ressource bleibt, mit neuer Kennung',
    (({id, ...rest}) => rest)(bogen.resources[0]), (({id, ...rest}) => rest)(held.resources[0]));

const f = bogen.features[0];
ist('  das Merkmal bleibt', [f.name, f.source, f.zauber, f.effectsActive, f.ressourceKosten],
    ['Aktionsschub', 'Kämpfer 2', 'Person festhalten', true, 2]);
ist('  … seine Wirkung auch', f.effects.map(e => [e.target, e.mode, e.value]), [['ac', 'bonus', 1]]);
ist('  … der Verweis auf die Ressource zeigt auf die neue Kennung', f.ressource, bogen.resources[0].id);
wahr('  … und die Beschreibung ist wieder Auszeichnung', /<p>Einmal je Rast/.test(f.description) && /<p>Danach eine kurze Rast/.test(f.description));

const w = bogen.weapons[0];
ist('  die Waffe bleibt', [w.name, w.attrKey, w.proficient, w.range, w.attackBonus, w.damage, w.damageType, w.properties],
    ['Kriegshammer', 'str', true, '1,5m', 2, '1W8', 'Wucht', ['Vielseitig']]);
ist('  … „= 19" wird wieder ein gesetzter Wert', w.effects.map(e => [e.target, e.mode, e.value]), [['str', 'set', 19]]);

const s = bogen.spells[0];
ist('  der Zauber bleibt', [s.name, s.level, s.school, s.castingTime, s.range, s.duration, s.components, s.prepared],
    ['Person festhalten', 2, 'Verzauberung', '1 Aktion', '18 m', '1 Minute', 'V, S, M', false]);

const i1 = bogen.inventory[0], i2 = bogen.inventory[1];
ist('  der Gegenstand bleibt', [i1.name, i1.qty, i1.rarity, i1.weight, i1.wert, i1.source, i1.tags,
     i1.gearKind, i1.armorType, i1.baseAC, i1.effectsActive],
    ['Kettenhemd', 1, 'gewöhnlich', '25', 75, 'Startausrüstung', ['Rüstung'], 'ruestung', 'medium', 13, true]);
ist('  … die Menge kommt aus „×3"', [i2.name, i2.qty, i2.kampf], ['Heiltrank', 3, true]);
ist('  die Plätze bleiben besetzt', [bogen.gear.ruestung.k, bogen.gear.ruestung.id === i1.id,
     bogen.gear.haupthand.k, bogen.gear.haupthand.id === w.id], ['i', true, 'w', true]);
ist('  die Notiz bleibt', [bogen.notesList[0].title, bogen.notesList[0].tags], ['Der Hammer', ['Ziel', 'Familie']]);
wahr('  der Freitext bleibt', /Sucht den Hammer/.test(bogen.notes));
wahr('ein neuer Bogen bekommt eine neue Kennung', bogen.id !== held.id);

// Zweimal durch: was beim ersten Mal stimmt, darf beim zweiten nicht kippen.
const zweiter = bogenAusText(bogenAlsText(bogen)).bogen;
ist('zweimal hin und zurück ändert nichts mehr', bogenAlsText(zweiter), bogenAlsText(bogen));

// ── NSC ──
const nsc = alsNsc({...newChar(), name: 'Rahadin'}, 'feindlich');
const nscText = bogenAlsText(nsc);
wahr('beim NSC steht die Haltung in der Art', /Art: NSC feindlich/.test(nscText));
const nscZurueck = bogenAusText(nscText).bogen;
ist('  … und kommt als NSC zurück', [istNsc(nscZurueck), nscHaltung(nscZurueck), nscZurueck.dmOnly], [true, 'feindlich', true]);
ist('ein Held bleibt ein Held', istNsc(bogenAusText(bogenAlsText(newChar())).bogen), false);
ist('ein DM-Held bleibt einer', bogenAusText(bogenAlsText({...newChar(), name: 'X', dmOnly: true})).bogen.dmOnly, true);

// ── Von Hand geschrieben: das Mindeste ───────────────────────────
const knapp = bogenAusText(['# Heldenbuch-Bogen 1', '[Bogen]', 'Name: Der Wirt', 'Art: NSC freundlich',
  'Klasse: Kämpfer', 'Stufe: 2', '[Attribute]', 'Stärke: 12', 'CHA: 15',
  '[Werte]', 'Trefferpunkte: 16 von 16', 'Rüstungsklasse: 12'].join('\n'));
ist('ein knapper Bogen genügt', [knapp.fehler, knapp.bogen.name, knapp.bogen.level, knapp.bogen.str, knapp.bogen.cha, knapp.bogen.hp],
    ['', 'Der Wirt', 2, 12, 15, 16]);
ist('  … der Rest kommt vom neuen Bogen', [knapp.bogen.dex, knapp.bogen.speed], [10, 30]);
ist('  … Kurzschreibweisen wie „CHA" werden verstanden', knapp.bogen.cha, 15);

// Groß- und Kleinschreibung, Umlaute, Reihenfolge: alles egal.
const wirr = bogenAusText(['[bogen]', 'name: Umlautlos', '[uebungen]', 'fertigkeiten: athletik, EINSCHÜCHTERN',
  '[attribute]', 'staerke: 18'].join('\n'));
ist('Schreibweise und Reihenfolge sind gleichgültig',
    [wirr.fehler, wirr.bogen.str, wirr.bogen.skillProfs], ['', 18, ['athletik', 'einschuechtern']]);

// ── Was schiefgehen kann ─────────────────────────────────────────
const leer = bogenAusText('Hallo, ich bin kein Bogen.');
ist('was kein Bogen ist, wird abgewiesen', [leer.bogen, /nicht nach einem Heldenbuch-Bogen/.test(leer.fehler)], [null, true]);
const ohneName = bogenAusText('# Heldenbuch-Bogen 1\n[Bogen]\nKlasse: Magier');
ist('ohne Namen geht es auch nicht', [ohneName.bogen, /fehlt „Name"/.test(ohneName.fehler)], [null, true]);
const schief = bogenAusText(['# Heldenbuch-Bogen 1', '[Bogen]', 'Name: Schief',
  '[Übungen]', 'Fertigkeiten: Athletik, Bogenschießen',
  '[Merkmale]', '- Kraftvoll', '  Wirkung: Glückspunkte +2', '  Ressource: Gibtsnicht'].join('\n'));
ist('Unbekanntes wird übergangen und gemeldet',
    [schief.bogen.skillProfs, schief.bogen.features[0].effects.length, schief.warnungen.length], [['athletik'], 0, 3]);
wahr('  … die Meldung nennt, worum es ging', schief.warnungen.some(w => /Bogenschießen/.test(w))
  && schief.warnungen.some(w => /Glückspunkte/.test(w)) && schief.warnungen.some(w => /Gibtsnicht/.test(w)));

// ── Der Stapel: was die Vorschau zeigt ───────────────────────────
const bestand = [{id: 'c1', name: 'Der Wirt'}, {id: 'c2', name: 'Alte', archived: true}];
const stapel = bogenStapel([
  {name: 'a.txt', text: bogenAlsText({...newChar(), name: 'Der Wirt'})},
  {name: 'b.txt', text: bogenAlsText({...newChar(), name: 'Neuer'})},
  {name: 'c.txt', text: 'Müll'},
], bestand);
ist('der Stapel erkennt vorhanden, neu und kaputt',
    stapel.map(e => [e.wahl, e.vorhandenId]), [['ersetzen', 'c1'], ['neu', ''], ['aus', '']]);

// ── Das Blatt fuer die KI stimmt mit dem Programm ueberein ───────
// TEXTBOGEN.md zeigt ein ganzes Beispiel. Was dort steht, muss sich
// einlesen lassen — sonst legt jemand einer KI ein Blatt vor, nach dem
// sie Dateien schreibt, die hier durchfallen.
const blatt = fs.readFileSync('TEXTBOGEN.md', 'utf8');
const beispiel = (blatt.match(/```\n([\s\S]*?)```/) || [])[1] || '';
const ausBlatt = bogenAusText(beispiel);
ist('das Beispiel aus TEXTBOGEN.md liest sich ohne Fehler und ohne Warnung',
    [ausBlatt.fehler, ausBlatt.warnungen], ['', []]);
ist('  … und ergibt, was dort steht',
    ausBlatt.bogen ? [ausBlatt.bogen.name, istNsc(ausBlatt.bogen), nscHaltung(ausBlatt.bogen),
      ausBlatt.bogen.level, ausBlatt.bogen.subclass, ausBlatt.bogen.multiclasses.length,
      ausBlatt.bogen.cha, ausBlatt.bogen.ac, ausBlatt.bogen.spellSlots[1],
      ausBlatt.bogen.resources[0].restType, ausBlatt.bogen.inventory.length,
      ausBlatt.bogen.gear.haupthand.k, ausBlatt.bogen.currency.gp] : null,
    ['Wirt Arik', true, 'freundlich', 2, 'Champion', 2, 15, 12, {max: 4, used: 1}, 'kurz', 2, 'w', 12]);
wahr('  … eine Bemerkung hinter dem Wert gehört nicht dazu',
     ausBlatt.bogen && ausBlatt.bogen.inventory[1].armorType === 'medium', ausBlatt.bogen && ausBlatt.bogen.inventory[1].armorType);
wahr('  … eine Farbe bleibt eine Farbe', ausBlatt.bogen && ausBlatt.bogen.resources[0].color === '#e05a5a');

// ── Dateinamen ───────────────────────────────────────────────────
ist('der Dateiname kommt aus dem Namen', bogenDateiname({name: 'Brunhilde Eisenfaust'}), 'Brunhilde-Eisenfaust.txt');
ist('  … ohne Zeichen, die kein Dateisystem mag', bogenDateiname({name: 'Ku/nz: der "Dritte"'}), 'Kunz-der-Dritte.txt');
ist('  … und niemals leer', bogenDateiname({name: '///'}), 'bogen.txt');
ist('gleiche Namen im Bündel werden unterschieden',
    bogenNamenEindeutig(['Wirt.txt', 'Wirt.txt', 'Bea.txt', 'Wirt.txt']),
    ['Wirt.txt', 'Wirt-2.txt', 'Bea.txt', 'Wirt-3.txt']);
wahr('der Bündelname trägt das Datum', /^heldenbuch-strahd-2026-09-18\.zip$/.test(bogenBuendelName('Strahd', Date.UTC(2026, 8, 18, 12))));

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
