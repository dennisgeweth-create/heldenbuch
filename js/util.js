// Heldenbuch — reine Hilfsfunktionen ohne React und ohne JSX.
// Modifikatoren, Bildverkleinerung, Vorlagen fuer neue Objekte, unscharfe
// Suche und der Rechenkern des Effektsystems. Setzt js/data.js voraus
// (EFFECT_LABELS).

// Die vier Werte, die sich im Kampf im Sekundentakt aendern. Sie werden
// getrennt behandelt: der Server fuehrt sie in einer eigenen Tabelle, und
// ein Geraet schickt sie nur mit, wenn es sie selbst geaendert hat.
const VITAL_FELDER = ['hp', 'tempHp', 'tempMaxHp', 'deathSaves'];

const newEffect = () => ({id:Date.now().toString()+Math.random().toString(36).slice(2,6), target:"str", mode:"bonus", value:1});

// ── Abenteuer ────────────────────────────────────────────────────
// Ein Held gehoert zu genau einem Abenteuer (c.adventure). Die Liste der
// Abenteuer liegt in der geteilten Datenbank unter _adventures und wird
// damit ueber denselben Weg synchronisiert wie Zauber und Gegenstaende —
// ohne neue Spalte auf dem Server. Die Gegenstandsdatenbank bleibt
// absichtlich abenteueruebergreifend: ein Heiltrank ist in jeder
// Kampagne derselbe.
// Wer den laufenden Kampf zu sehen bekommt. Steht neben der
// Abenteuerliste, weil der Server dieselbe Angabe liest — und dort
// entscheidet, ob er ueberhaupt etwas ausliefert.
const KAMPF_SICHT = [
  {k:'auto',   l:'Von allein',   kurz:'sieht mit',    t:'Sobald ein Kampf läuft, geht er bei den Spielern auf.'},
  {k:'ansage', l:'Auf Ansage',   kurz:'auf Ansage',   t:'Erst wenn du im Tracker auf „zeigen“ drückst.'},
  {k:'aus',    l:'Gar nicht',    kurz:'sieht nichts', t:'Der Kampf bleibt bei der Spielleitung, wie bisher.'},
];

const ADV_ERSTES = 'strahd';
const advListe = (lib) => {
  const l = (lib && lib._adventures) || [];
  return Array.isArray(l) ? l.filter(a => a && a.id) : [];
};
// ── Einstellungen eines Abenteuers ───────────────────────────────
// Sie haengen am Abenteuer selbst, nicht an einer eigenen Ablage: die
// Liste wird ohnehin schon mit allen geteilt, und ein zweiter Ort waere
// ein zweiter Ort, an dem etwas auseinanderlaufen kann.
//
// Eine Klasse ist ein Name, eine Farbe und das Attribut, mit dem sie
// zaubert. Mehr braucht sie nicht: der Trefferwuerfel steht im Bogen des
// Helden, eine Hausklasse soll ohne Regelarbeit eintragbar sein. Das
// Attribut steht hier, weil daran zwei Zahlen im Bogen haengen — der
// Zauber-SG und der Zauberangriff —, die einer Hausklasse sonst fuer
// immer fehlten.
const KLASSEN_STANDARD = Object.keys(CC).map(n =>
  ({name: n, color: CC[n].text, attr: SPELL_ATTR[n] || ''}));
const advKlassen = (adv) =>
  (adv && Array.isArray(adv.klassen) && adv.klassen.length) ? adv.klassen : KLASSEN_STANDARD;
// Womit diese Klasse zaubert. Was in der Liste des Abenteuers steht,
// gilt — auch ein leeres Feld, das heisst dann "zaubert nicht". Eine
// Klasse, die noch aus der Zeit vor dem Feld stammt, faellt auf die
// Tafel des Regelwerks zurueck.
// Die sechs Attribute mit ausgeschriebenem Namen — fuer Auswahlfelder.
const ATTR_WAHL = [
  {k:'str', l:'Stärke'},       {k:'dex', l:'Geschicklichkeit'},
  {k:'con', l:'Konstitution'}, {k:'int', l:'Intelligenz'},
  {k:'wis', l:'Weisheit'},     {k:'cha', l:'Charisma'},
];
const klassenAttr = (name, klassen) => {
  const k = (klassen || []).find(x => x.name === name);
  if (k && k.attr !== undefined) return k.attr || null;
  return SPELL_ATTR[name] || null;
};
// Farben einer Klasse: die zwoelf des Regelwerks behalten ihr eigenes
// Dreigespann, eine Hausklasse leitet ihres aus einer Farbe ab.
const klassenStil = (name, klassen) => {
  if (CC[name]) return CC[name];
  const k = (klassen || []).find(x => x.name === name);
  const c = (k && k.color) || '#8b9198';
  return {bg: c + '22', border: c + '80', text: c};
};
// Verdeckte Trefferpunkte: in manchen Runden kennt nur die Spielleitung
// die Zahl. Der Spieler sieht dann einen Zustand statt einer Ziffer.
// balken ist bewusst grob: ein auf den Punkt genauer Balken verriete die
// Zahl, die der Zustand gerade verbergen soll.
const TP_ZUSTAENDE = [
  {ab: 1.0,  balken: 1.0,  label: 'Unverletzt',       color: '#56b183'},
  {ab: 0.75, balken: 0.85, label: 'Leicht verletzt',  color: '#9cc45a'},
  {ab: 0.5,  balken: 0.62, label: 'Verwundet',        color: '#e8b84b'},
  {ab: 0.25, balken: 0.37, label: 'Schwer verwundet', color: '#e07a3a'},
  {ab: 0.01, balken: 0.12, label: 'Am Ende',          color: '#e05a5a'},
  {ab: 0,    balken: 0,    label: 'Kampfunfähig',     color: '#8b9198'},
];
const tpZustand = (hp, maxHp) => {
  const anteil = maxHp > 0 ? Math.max(0, hp) / maxHp : 0;
  return TP_ZUSTAENDE.find(z => anteil >= z.ab) || TP_ZUSTAENDE[TP_ZUSTAENDE.length - 1];
};
// Wahr, wenn dieser Bogen seine Trefferpunkte gerade als Zahl zeigen darf.
//
// bekannt sagt, ob die Einstellung ueberhaupt schon vorliegt. Ohne sie gilt
// verdeckt, nicht offen: die Bibliothek kommt Sekundenbruchteile nach den
// Charakteren, und in dieser Luecke standen die Zahlen sonst kurz offen da.
// Schlimmer noch, wenn sie fehlt — dann legt die Abenteuer-Umstellung ein
// Abenteuer ohne Einstellung an, und das las sich wie "nichts verdeckt".
// Andersherum ist der Fehler harmlos: eine Zahl, die einen Augenblick
// spaeter erscheint, verraet nichts.
const tpSichtbar = (adv, istDm, bekannt) => istDm || (!!bekannt && !!adv && !adv.hpVerdeckt);

// Sorgt dafuer, dass es mindestens ein Abenteuer gibt und jeder Held
// einem zugeordnet ist. Gibt {lib, chars} zurueck, wenn sich etwas
// geaendert hat, sonst null.
const advMigration = (lib, chars) => {
  const vorhanden = advListe(lib);
  let neueListe = vorhanden;
  if (!vorhanden.length) {
    // Der Bestand ist das, womit die Gruppe angefangen hat.
    neueListe = [{id: ADV_ERSTES, name: 'Strahd'}];
  }
  const ziel = neueListe[0].id;
  const gueltig = new Set(neueListe.map(a => a.id));
  let charsGeaendert = false;
  const neueChars = (chars || []).map(c => {
    // Auch ein Held mit unbekanntem Abenteuer landet wieder im ersten —
    // sonst waere er nirgends sichtbar.
    if (c.adventure && gueltig.has(c.adventure)) return c;
    charsGeaendert = true;
    return {...c, adventure: ziel};
  });
  const libGeaendert = neueListe !== vorhanden;
  if (!libGeaendert && !charsGeaendert) return null;
  return {
    lib: libGeaendert ? {...(lib||{}), _adventures: neueListe} : lib,
    chars: charsGeaendert ? neueChars : chars,
    libGeaendert, charsGeaendert,
  };
};

// ── Getragene Ausruestung ────────────────────────────────────────
// c.gear ordnet jedem Platz hoechstens einen Traeger zu:
//   {ruestung:{k:'i',id:'…'}, haupthand:{k:'w',id:'…'}}
// k unterscheidet Inventargegenstand ('i') von Waffe ('w'). Der Platz ist
// die einzige Wahrheit darueber, was getragen wird; die Puppe schreibt bei
// Waffen zusaetzlich equipped mit, damit die Waffenkarten im Aktionen-Reiter
// dieselbe Aussage treffen.
const gearRef = (c, slotKey) => ((c && c.gear) || {})[slotKey] || null;
const gearAt  = (c, slotKey) => {
  const g = gearRef(c, slotKey);
  if (!g) return null;
  const liste = g.k === 'w' ? (c.weapons || []) : (c.inventory || []);
  // Faellt still weg, wenn der Gegenstand geloescht oder weitergegeben wurde.
  return liste.find(x => x.id === g.id) || null;
};
const isZweihand = (w) => !!w && (w.properties || []).some(p => /zweih/i.test(p));
// Ein Zweihaender in der Haupthand belegt beide Haende.
const nebenhandGesperrt = (c) => isZweihand(gearAt(c, 'haupthand'));
// Alles, was gerade getragen wird — in der Reihenfolge der Plaetze.
const gearWorn = (c) => {
  if (!c) return [];
  const gesperrt = nebenhandGesperrt(c);
  return GEAR_SLOTS.map(s => {
    if (s.key === 'nebenhand' && gesperrt) return null;
    const o = gearAt(c, s.key);
    return o ? {slot: s, obj: o, k: gearRef(c, s.key).k} : null;
  }).filter(Boolean);
};

// ── Sets ─────────────────────────────────────────────────────────
// Ein Gegenstand traegt nur den Setnamen; was ein Set ab wie vielen Teilen
// gibt, steht im Set-Register der geteilten Datenbank. Gezaehlt werden
// getragene Stuecke: zwei Ringe desselben Sets in beiden Ringplaetzen sind
// zwei Teile. Ein Stueck kann nicht doppelt zaehlen, weil derselbe
// Gegenstand nie in zwei Plaetzen liegt.
const gearSets = (c, setDefs) => {
  if (!c) return [];
  const zaehler = {};
  gearWorn(c).forEach(({obj}) => {
    const n = (obj.setName || '').trim();
    if (n) zaehler[n] = (zaehler[n] || 0) + 1;
  });
  return Object.keys(zaehler).map(name => {
    const def = (setDefs || []).find(s => s.name === name) || null;
    const teile = zaehler[name];
    const stufen = (((def && def.stufen) || [])
      .slice()
      .sort((a,b) => (+a.teile||0) - (+b.teile||0))
      .map(st => ({...st, aktiv: teile >= (+st.teile || 0)})));
    return {name, teile, def, stufen, hoechste: stufen.reduce((m,st)=>st.aktiv?Math.max(m,+st.teile||0):m, 0)};
  }).sort((a,b) => a.name.localeCompare(b.name, 'de'));
};

// Sammelt alle Effekte, die gerade wirken, samt Herkunft fuer die Anzeige.
// Jede Quelle zaehlt hoechstens einmal: eine Waffe in der Haupthand traegt
// ihre Effekte ueber den Platz bei und darf nicht zusaetzlich ueber ihr
// equipped-Kennzeichen noch einmal gezaehlt werden.
const collectEffects = (c, setDefs) => {
  if (!c) return [];
  const out = [], gesehen = new Set();
  const add = (schluessel, source, icon, list) => {
    if (gesehen.has(schluessel)) return;
    gesehen.add(schluessel);
    (list||[]).forEach(e => {
      if (e && e.target && EFFECT_LABELS[e.target]) out.push({...e, source, icon});
    });
  };
  gearWorn(c).forEach(({slot, obj, k}) => add(k+':'+obj.id, obj.name||slot.label, slot.icon, obj.effects));
  // Setboni: jede erreichte Stufe steuert ihre Effekte bei. Sie stehen
  // gleichberechtigt neben denen der Stuecke — bei "setzt fest" gewinnt
  // weiterhin der hoechste Wert.
  gearSets(c, setDefs).forEach(s => s.stufen.forEach((st, i) => {
    if (st.aktiv) add('set:'+s.name+':'+i, s.name+' ('+(+st.teile||0)+' Teile)', '✦', st.effects);
  }));
  (c.weapons ||[]).forEach(w => { if (w.equipped) add('w:'+w.id, w.name||"Waffe", "⚔", w.effects); });
  // Merkmale und Talente. Sie sind keine Gegenstaende und haben keinen
  // Platz — ein Kampfstil wirkt, solange er nicht ausgeschaltet ist.
  (c.features||[]).forEach(f => { if (f.effectsActive !== false) add('f:'+f.id, f.name||"Merkmal", "⭐", f.effects); });
  // Die alte Ausruestungsliste zaehlt nur, solange der Held nicht umgestellt
  // ist — danach steckt dasselbe Stueck als Inventargegenstand in einem Platz
  // und wuerde sonst doppelt wirken.
  if (!c.gearMigrated) (c.equipment||[]).forEach(q => { if (q.equipped) add('e:'+q.id, q.name||"Ausrüstung", "🛡", q.effects); });
  (c.inventory||[]).forEach(i => { if (i.effectsActive) add('i:'+i.id, i.name||"Gegenstand", "🎒", i.effects); });
  return out;
};

// ── Kampfwerte eines beliebigen Helden ───────────────────────────
// Bis hierher wurden Ruestungsklasse und Effekte nur fuer den gerade
// geoeffneten Helden gerechnet, mitten in App. Der Kampf braucht sie fuer
// alle auf einmal — und zwar nach denselben Regeln, nicht nach
// nachgebauten. Deshalb steht die Rechnung jetzt hier, und App ruft sie
// ebenso auf wie die Initiativliste.
const charWerte = (c, setDefs) => {
  if (!c) return null;
  const effs = collectEffects(c, setDefs);
  const anw  = (t, basis) => applyEffect(effs, t, basis);

  const eff = {
    ...c,
    str: anw('str', c.str), dex: anw('dex', c.dex), con: anw('con', c.con),
    int: anw('int', c.int), wis: anw('wis', c.wis), cha: anw('cha', c.cha),
    // Temporaere maximale Trefferpunkte kommen obendrauf und gehoeren
    // nicht ins Effektsystem: sie sind eine Zahl fuer diesen Abend, kein
    // Merkmal des Helden. Ein Heldenmahl gibt sie, eine lange Rast nimmt
    // sie wieder.
    maxHp:     anw('maxHp',     c.maxHp) + (+c.tempMaxHp || 0),
    speed:     anw('speed',     c.speed),
    profBonus: anw('profBonus', c.profBonus),
  };

  // ── Ruestungsklasse ──
  // Dieselbe Reihenfolge wie im Bogen: Grundwert aus der Ruestung, Schild
  // dazu, dann magische Boni der getragenen Stuecke, dann Talente, und
  // ganz zuletzt die Effekte ueber fx('ac').
  const dexMod = mod(eff.dex);
  const getragen = gearWorn(c);
  const nhGesperrt = nebenhandGesperrt(c);
  const ruestung = (() => {
    const r = c.gearMigrated ? gearAt(c, 'ruestung') : null;
    return (r && r.armorType && r.armorType !== 'shield' && +r.baseAC > 0) ? r : null;
  })();
  const schild = (() => {
    if (!c.gearMigrated || nhGesperrt) return null;
    const nh = gearAt(c, 'nebenhand');
    return (nh && nh.armorType === 'shield') ? nh : null;
  })();
  // Talent-Boni zaehlen nur, solange sie nicht als Merkmal-Effekt laufen.
  const talentBoni = (c.gearMigrated || 0) >= 3 ? 0
    : (c.acBonuses || []).filter(b => b.active).reduce((s,b) => s + (+b.bonus||0), 0);

  const ac = (() => {
    if (c.gearMigrated) {
      const stueckBoni = getragen.reduce((s,{obj}) => s + (+obj.acBonus||0), 0);
      const schildBonus = schild ? (+schild.baseAC || 2) : 0;
      if (!ruestung) {
        const nichts = schildBonus === 0 && talentBoni === 0 && stueckBoni === 0
          && !effs.some(e => e.target === 'ac');
        if (nichts) return +c.ac || 10;
        return anw('ac', 10 + dexMod + schildBonus + talentBoni + stueckBoni);
      }
      const t = ruestung.armorType, basis = +ruestung.baseAC || 0;
      const roh = t === 'heavy' ? basis : t === 'medium' ? basis + Math.min(2, dexMod) : basis + dexMod;
      return anw('ac', roh + schildBonus + talentBoni + stueckBoni);
    }
    // Vor der Umstellung aus der alten Ausruestungsliste.
    const alt = c.equipment || [];
    const ruest  = alt.filter(e => e.equipped && e.type !== 'shield' && e.type !== 'other');
    const schilde= alt.filter(e => e.equipped && e.type === 'shield');
    const boni   = alt.filter(e => e.equipped && (e.acBonus||0) !== 0).reduce((s,e) => s + (+e.acBonus||0), 0);
    const shB    = schilde.reduce((s,sh) => s + (sh.baseAC||2), 0);
    if (!ruest.length) {
      if (shB === 0 && talentBoni === 0 && boni === 0 && !effs.some(e => e.target === 'ac')) return +c.ac || 10;
      return anw('ac', 10 + dexMod + shB + talentBoni + boni);
    }
    const a = ruest[0];
    const roh = a.type === 'heavy' ? a.baseAC
              : a.type === 'medium' ? a.baseAC + Math.min(2, dexMod)
              : a.baseAC + dexMod;
    return anw('ac', roh + shB + talentBoni + boni);
  })();

  // ── Passive Wahrnehmung ──
  const wahr = SKILLS.find(x => x.key === 'aufmerksamkeit');
  const passive = (() => {
    if (!wahr) return null;
    const isP = (c.skillProfs||[]).includes(wahr.key);
    const isE = (c.expertiseProfs||[]).includes(wahr.key);
    const joat = c.jackOfAllTrades && !isP && !isE;
    const b = isE ? eff.profBonus*2 : isP ? eff.profBonus : joat ? Math.floor(eff.profBonus/2) : 0;
    return anw('passivePerception', 10 + anw('skill_'+wahr.key, anw('skillAll', mod(eff[wahr.attr]) + b)));
  })();

  // ── Rettungswuerfe ──
  const saves = {};
  ['str','dex','con','int','wis','cha'].forEach(a => {
    const isP = (c.savingThrowProfs||[]).includes(a);
    saves[a] = anw('save_'+a, anw('saveAll', mod(eff[a]) + (isP ? eff.profBonus : 0)));
  });

  // ── Die Fertigkeiten, alle achtzehn ───────────────────
  // Bisher wurde nur die passive Wahrnehmung hier gerechnet und der Rest
  // im Bogen noch einmal. Eine Probe auf Ansage braucht sie fuer jeden
  // Helden — und zwar nach denselben Regeln, nicht nach nachgebauten.
  const skills = {};
  for (const sk of SKILLS) {
    const isP = (c.skillProfs||[]).includes(sk.key);
    const isE = (c.expertiseProfs||[]).includes(sk.key);
    const joat = c.jackOfAllTrades && !isP && !isE;
    const b = isE ? eff.profBonus*2 : isP ? eff.profBonus
            : joat ? Math.floor(eff.profBonus/2) : 0;
    skills[sk.key] = anw('skill_'+sk.key, anw('skillAll', mod(eff[sk.attr]) + b));
  }

  return {
    effekte: effs,
    eff,
    skills,
    ac,
    maxHp: eff.maxHp,
    hp: +c.hp || 0,
    tempHp: +c.tempHp || 0,
    dex: eff.dex,
    initiative: anw('initiative', mod(eff.dex) + (+c.initiative || 0)),
    passive,
    saves,
    flags: activeFlags(effs),
  };
};

// Einmalige Umstellung auf Ausruestungsplaetze. Legt die Stuecke aus
// c.equipment als Inventargegenstaende an und setzt die angelegten in ihren
// Platz. c.equipment und c.acBonuses bleiben dabei unberuehrt liegen — der
// Rueckweg bleibt offen, aufgeraeumt wird erst, wenn sich die Umstellung
// bewaehrt hat. Mehrfach ausfuehrbar: bereits uebernommene Stuecke erkennt
// sie an der Kennung wieder.
// 2: Ausruestung wurde zu Inventargegenstaenden in Plaetzen.
// 3: RK-Boni aus Talenten wurden zu Merkmalen mit Effekt.
const GEAR_MIGRATION = 3;
const migrateGear = (c) => {
  if (!c || (c.gearMigrated || 0) >= GEAR_MIGRATION) return null;
  const inv  = [...(c.inventory || [])];
  const gear = {...(c.gear || {})};
  const platzFuer = {light:'ruestung', medium:'ruestung', heavy:'ruestung', shield:'nebenhand', other:'sonstiges'};
  const artFuer   = {light:'ruestung', medium:'ruestung', heavy:'ruestung', shield:'schild',    other:'sonstiges'};
  (c.equipment || []).forEach(e => {
    const id = 'eq_' + e.id;
    if (inv.some(i => i.id === id)) return;
    inv.push({
      id, name: e.name || 'Ausrüstung', qty: 1, weight: '', rarity: 'gewöhnlich',
      description: e.notes || '', tags: [], source: 'Ausrüstung',
      effects: e.effects || [], effectsActive: false,
      gearKind: artFuer[e.type] || 'sonstiges',
      armorType: e.type === 'other' ? '' : (e.type || ''),
      baseAC: +e.baseAC || 0, acBonus: +e.acBonus || 0,
      icon: e.type === 'shield' ? '🛡' : e.type === 'other' ? '🎭' : '🛡️',
    });
    // Mehrere angelegte Ruestungen gab es bisher als Warnung — den Platz
    // bekommt die erste, der Rest liegt danach im Inventar.
    const platz = platzFuer[e.type] || 'sonstiges';
    if (e.equipped && !gear[platz]) gear[platz] = {k:'i', id};
  });
  const angelegt = (c.weapons || []).filter(w => w.equipped);
  if (angelegt.length > 0 && !gear.haupthand) gear.haupthand = {k:'w', id: angelegt[0].id};
  if (angelegt.length > 1 && !gear.nebenhand && !isZweihand(angelegt[0])) gear.nebenhand = {k:'w', id: angelegt[1].id};

  // Schritt 3: RK-Boni aus Talenten werden zu Merkmalen mit Effekt. Sie
  // waren nie Gegenstaende und haben keinen Platz; als Merkmal stehen sie
  // dort, wo der Kampfstil ohnehin steht — und koennen dann mehr als nur
  // die Ruestungsklasse. c.acBonuses bleibt daneben liegen.
  const features = [...(c.features || [])];
  (c.acBonuses || []).forEach(b => {
    const id = 'acb_' + b.id;
    if (features.some(f => f.id === id)) return;
    features.push({
      id, name: b.name || 'RK-Bonus', source: 'Talent', description: '',
      effectsActive: b.active !== false,
      effects: [{id: id+'_fx', target:'ac', mode:'bonus', value: +b.bonus || 0}],
    });
  });
  return {inventory: inv, gear, features, gearMigrated: GEAR_MIGRATION};
};
// Wendet alle Effekte eines Ziels auf einen Ausgangswert an.
const applyEffect = (effs, target, base) => {
  let fixed = null, bonus = 0;
  for (const e of effs) {
    if (e.target !== target) continue;
    const v = +e.value || 0;
    if (e.mode === "set") fixed = fixed === null ? v : Math.max(fixed, v);
    else bonus += v;
  }
  return (fixed === null ? base : fixed) + bonus;
};
const effectsFor = (effs, target) => effs.filter(e => e.target === target);
// Schalter tragen keine Zahl — dort waere ein "+0" nur irrefuehrend.
const effectText = e => isFlagEffect(e.target) ? ""
  : (e.mode === "set" ? "= " : ((+e.value||0) >= 0 ? "+" : "")) + (+e.value || 0);
// Alle gerade geltenden Schalter, je Ziel einmal, mit ihren Quellen.
const activeFlags = (effs) => {
  const nach = {};
  (effs||[]).forEach(e => {
    if (!isFlagEffect(e.target)) return;
    (nach[e.target] = nach[e.target] || []).push(e.source);
  });
  return Object.keys(nach).map(t => ({
    target: t, label: EFFECT_LABELS[t] || t,
    quellen: [...new Set(nach[t])],
  })).sort((a,b) => a.label.localeCompare(b.label,'de'));
};

// Bilder werden vor dem Speichern verkleinert. PNG und WebP koennen
// transparent sein — dort muss PNG erhalten bleiben, sonst fuellt JPEG die
// freien Flaechen schwarz. Fotos ohne Alphakanal gehen als JPEG, das ist
// deutlich kleiner. Ergebnis ist eine data-URL.
const compressImage = (file, maxPx, cb) => {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const longest = Math.max(img.width, img.height) || 1;
      const scale = longest > maxPx ? maxPx / longest : 1;
      const c = document.createElement('canvas');
      c.width  = Math.max(1, Math.round(img.width  * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      let hasAlpha = false;
      try {
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < d.length; i += 4) { if (d[i] < 250) { hasAlpha = true; break; } }
      } catch (e) {
        hasAlpha = /png|webp|gif/i.test(file.type || '');
      }
      cb(hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => cb(null);
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

const mod  = v => Math.floor((v-10)/2);
const fmod = v => { const m=mod(v); return (m>=0?"+":"")+m; };
// Formatiert einen bereits fertigen Modifikator (nicht den Attributswert).
const fnum = n => (n>=0?"+":"")+n;

// ── Der Charakterassistent ──────────────────────────────────────
// Aus sechs Entscheidungen einen Bogen. Auch das eine reine Rechnung:
// die Oberfläche sammelt nur den Entwurf ein, und was daraus wird,
// steht hier — prüfbar von aussen und identisch mit dem, was das
// Übernehmen schreibt.

// Die drei Wege zu den Attributen. Der Standardsatz ist der schnellste,
// der Punktekauf der gerechteste, die Würfel der aufregendste.
const STANDARD_SATZ = [15, 14, 13, 12, 10, 8];
const PUNKTE_KOSTEN = {8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9};
const PUNKTE_GESAMT = 27;
const punkteKosten = (werte) => ATTR_WAHL
  .reduce((s, a) => s + (PUNKTE_KOSTEN[werte[a.k]] === undefined ? 99 : PUNKTE_KOSTEN[werte[a.k]]), 0);
// Vier Würfel, der schlechteste fällt weg — sechsmal.
const attributeWuerfeln = () => ATTR_WAHL.reduce((raus, a) => {
  const w = [0,0,0,0].map(() => 1 + Math.floor(Math.random() * 6)).sort((x, y) => y - x);
  raus[a.k] = w[0] + w[1] + w[2];
  return raus;
}, {});

const volkFinden  = (name) => VOELKER.find(v => v.name === name) || null;
const unterFinden = (volk, name) => ((volk && volk.unter) || []).find(u => u.name === name) || null;

// Was aus dem Entwurf wird. Dieselbe Form wie beim Aufstieg:
//   neu       die Felder für den Bogen
//   zeilen    was drinsteht, für die Vorschau
//   hinweise  was der Assistent nicht kann
//   fehlt     was noch fehlt, damit „Fertig“ sagen kann, warum nicht
const assistentPlan = (e) => {
  const d = e || {};
  const volk  = volkFinden(d.volk);
  const unter = unterFinden(volk, d.untervolk);
  const kl    = KLASSEN_REGELN[d.klasse] || null;
  const hg    = HINTERGRUENDE.find(h => h.name === d.hintergrund) || null;
  const zeilen = [], hinweise = [], fehlt = [];
  const zeile = (was, wert) => zeilen.push({was, neu: wert});

  // ── Die Attribute: Grundwert, Volk, Wahl ──
  const grund = d.attribute || {};
  const boni = {};
  const dazu = (o) => { for (const k of Object.keys(o || {})) boni[k] = (boni[k] || 0) + o[k]; };
  dazu(volk && volk.boni);
  dazu(unter && unter.boni);
  dazu(d.wahlBoni);
  const werte = {};
  for (const a of ATTR_WAHL) werte[a.k] = Math.min(20, (+grund[a.k] || 0) + (boni[a.k] || 0));

  const neu = {};
  if (d.name) neu.name = d.name;
  if (volk)   neu.race = volk.name + (unter ? ' (' + unter.name + ')' : '');
  if (kl)     neu.charClass = d.klasse;
  if (hg)     neu.background = hg.name;
  neu.level = 1;
  neu.profBonus = 2;

  for (const a of ATTR_WAHL) {
    if (!grund[a.k]) continue;
    neu[a.k] = werte[a.k];
    zeile(a.l, werte[a.k] + (boni[a.k] ? '  (' + grund[a.k] + ' + ' + boni[a.k] + ')' : ''));
  }

  // ── Was daraus folgt ──
  if (volk) {
    neu.speed = (unter && unter.tempo) || volk.tempo;
    zeile('Bewegung', neu.speed + ' m');
    neu.languages = [...volk.sprachen];
    zeile('Sprachen', volk.sprachen.join(', '));
  }
  if (kl) {
    // Auf Stufe 1 gibt der Trefferwürfel sein Höchstes — gewürfelt wird
    // erst ab Stufe 2.
    const tp = Math.max(1, kl.tw + mod(werte.con || 10));
    neu.maxHp = tp; neu.hp = tp;
    zeile('Trefferpunkte', tp + '  (W' + kl.tw + ' + Konstitution)');
    neu.savingThrowProfs = [...kl.rw];
    zeile('Rettungswürfe', kl.rw.map(k => (ATTR_WAHL.find(a => a.k === k) || {}).l).join(', '));
    const plaetze = zauberPlaetze(d.klasse, 1);
    if (plaetze) {
      neu.spellSlots = {};
      for (let g = 1; g <= 9; g++) neu.spellSlots[g] = {max: plaetze[g] || 0, used: 0};
      if (plaetze[1]) zeile('Zauberplätze', plaetze[1] + ' vom 1. Grad');
    }
  }
  if (werte.dex) {
    neu.initiative = mod(werte.dex);
    neu.ac = 10 + mod(werte.dex);
    zeile('Initiative', (neu.initiative >= 0 ? '+' : '') + neu.initiative);
    zeile('Rüstungsklasse', neu.ac + '  (ohne Rüstung)');
  }

  // ── Fertigkeiten: die des Hintergrunds stehen fest ──
  const ausHg = hg ? [...hg.fert] : [];
  const gewaehlt = (d.fertigkeiten || []).filter(f => !ausHg.includes(f));
  if (ausHg.length || gewaehlt.length) {
    neu.skillProfs = [...new Set([...ausHg, ...gewaehlt])];
    const wort = (k) => (SKILLS.find(x => x.key === k) || {}).label || k;
    zeile('Geübte Fertigkeiten', neu.skillProfs.map(wort).join(', '));
  }

  // ── Merkmale: Namen und Quelle, kein Text ──
  const merkmale = [];
  if (volk) (volk.merkmale || []).forEach(m => merkmale.push({name: m, source: volk.name}));
  if (hg && hg.merkmal) merkmale.push({name: hg.merkmal, source: hg.name});
  if (merkmale.length) {
    neu.features = merkmale.map((m, i) => ({
      id: 'ass' + Date.now() + i, name: m.name, source: m.source,
      description: '', effects: [], effectsActive: true,
    }));
    zeile('Merkmale', merkmale.map(m => m.name).join(', '));
  }

  // ── Ausrüstung: Paket oder Gold ──
  if (d.ausruestung === 'paket' && kl) {
    neu.inventory = (kl.paket || []).map((n, i) => ({
      ...newItem(), id: 'assi' + Date.now() + i, name: n, qty: 1,
    }));
    zeile('Ausrüstung', (kl.paket || []).join(', '));
  } else if (d.ausruestung === 'gold') {
    const g = Math.max(0, Math.round(+d.gold || 0));
    neu.currency = {pp:0, gp:g, ep:0, sp:0, cp:0};
    zeile('Startgold', g + ' Goldmünzen  (' + (kl ? kl.gold : '—') + ')');
  }

  // ── Was noch fehlt ──
  if (!d.name)  fehlt.push('ein Name');
  if (!volk)    fehlt.push('ein Volk');
  if (volk && (volk.unter || []).length && !unter) fehlt.push('eine Untergruppe des Volkes');
  if (volk && volk.wahlBoni && Object.values(d.wahlBoni || {}).reduce((a, b) => a + b, 0) !== volk.wahlBoni)
    fehlt.push(volk.wahlBoni + ' Punkte auf frei gewählte Attribute');
  if (!kl)      fehlt.push('eine Klasse');
  if (!hg)      fehlt.push('ein Hintergrund');
  if (ATTR_WAHL.some(a => !grund[a.k])) fehlt.push('die Attribute');
  if (kl && gewaehlt.length !== kl.fertZahl)
    fehlt.push(kl.fertZahl + ' Fertigkeiten der Klasse (gewählt: ' + gewaehlt.length + ')');
  if (!d.ausruestung) fehlt.push('Ausrüstung oder Startgold');

  // ── Was er nicht kann ──
  if (!kl && d.klasse) hinweise.push('Die Klasse „' + d.klasse + '“ steht nicht in den Tabellen. '
    + 'Trefferpunkte, Rettungswürfe und Zauberplätze musst du selbst eintragen.');
  if (d.ausruestung === 'paket')
    hinweise.push('Das Paket kommt als Liste ins Inventar — Werte wie Schaden oder '
      + 'Rüstungsklasse trägst du an den Stücken selbst nach.');
  if (kl && kl.ruestung) hinweise.push('Geübt: ' + kl.ruestung + ' · ' + kl.waffen
    + '. Das steht auf dem Bogen nicht als Feld, aber es gilt.');
  return {neu, zeilen, hinweise, fehlt};
};

// ── Eine Liste als Text ─────────────────────────────────────────
// Beute entsteht am Tisch als Aufzählung — auf einem Zettel, in einer
// Nachricht, aus einer KI. Sie dann Zeile für Zeile in Felder zu
// tippen, ist die Art Arbeit, die man sich nicht antun sollte.
//
// Gelesen wird deshalb nachsichtig: Aufzählungszeichen dürfen davor
// stehen, die Menge vorn oder hinten, die Notiz hinter einem Strich,
// und Münzen erkennt die Zeile an ihren Wörtern. Was nicht aufgeht,
// wird trotzdem zu einem Stück mit Namen — lieber eine Zeile zu viel
// zum Nachbessern als eine verlorene.

// Wie eine Münze heissen darf. Die kurzen Formen zuerst, damit „GM"
// nicht als „Gold" mit Rest gelesen wird.
const BEUTE_MUENZWORTE = [
  {k: 'pp', w: ['platinmünzen', 'platinmünze', 'platin', 'pm', 'pp']},
  {k: 'gp', w: ['goldmünzen', 'goldmünze', 'gold', 'gm', 'gp']},
  {k: 'ep', w: ['elektrummünzen', 'elektrum', 'em', 'ep']},
  {k: 'sp', w: ['silbermünzen', 'silbermünze', 'silber', 'sm', 'sp']},
  {k: 'cp', w: ['kupfermünzen', 'kupfermünze', 'kupfer', 'km', 'cp']},
];
const beuteMuenzArt = (wort) => {
  const w = String(wort || '').toLowerCase().replace(/[.,;:]+$/, '');
  const t = BEUTE_MUENZWORTE.find(m => m.w.includes(w));
  return t ? t.k : null;
};

// Eine Zeile, die nur aus Münzen besteht: „340 GM, 22 Silber und 15 KM".
// Sie muss ganz aufgehen — sonst waere „12 Goldringe" eine Kasse.
const beuteMuenzZeile = (zeile) => {
  const teile = String(zeile || '')
    .replace(/\bund\b/gi, ' ').split(/[,;·]+|\s+/).filter(Boolean);
  const raus = {pp: 0, gp: 0, ep: 0, sp: 0, cp: 0};
  let treffer = 0;
  for (let i = 0; i < teile.length; i++) {
    // Entweder „340 GM" als zwei Stuecke oder „340GM" als eines.
    let zahl = null, wort = null;
    const zusammen = /^(\d+)\s*([A-Za-zÄÖÜäöüß]+)$/.exec(teile[i]);
    if (zusammen) { zahl = +zusammen[1]; wort = zusammen[2]; }
    else if (/^\d+$/.test(teile[i]) && i + 1 < teile.length) {
      zahl = +teile[i]; wort = teile[i + 1]; i++;
    } else return null;
    const art = beuteMuenzArt(wort);
    if (art === null) return null;
    raus[art] += zahl; treffer++;
  }
  return treffer ? raus : null;
};

const beuteAusText = (text) => {
  const muenzen = {pp: 0, gp: 0, ep: 0, sp: 0, cp: 0};
  const stuecke = [];
  let titel = '';

  String(text || '').split(/\r?\n/).forEach(roh => {
    let z = String(roh || '').trim();
    if (!z) return;
    // Aufzaehlungszeichen und Nummerierung fallen weg — eine KI setzt
    // sie gern davor.
    z = z.replace(/^[-–—*•·]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
    if (!z || z.startsWith('#')) return;

    const t = /^(?:titel|woher|fund)\s*[:：]\s*(.+)$/i.exec(z);
    if (t) { titel = t[1].trim(); return; }

    const geld = beuteMuenzZeile(z);
    if (geld) {
      for (const k of ['pp', 'gp', 'ep', 'sp', 'cp']) muenzen[k] += geld[k];
      return;
    }

    // Die Notiz steht hinter einem senkrechten Strich oder einem
    // Gedankenstrich mit Luft davor. Ein blosser Bindestrich zaehlt
    // nicht: „Zwei-Hand-Axt" ist ein Name.
    let notiz = '';
    const strich = /^(.*?)\s*(?:\||\s[–—]\s|\s--\s)\s*(.+)$/.exec(z);
    if (strich) { z = strich[1].trim(); notiz = strich[2].trim(); }

    // Die Menge darf vorn stehen („3× Fackel", „3 Fackeln") oder hinten
    // („Fackel ×3").
    let anzahl = 1;
    const vorn = /^(\d+)\s*[×xX*]\s*(.+)$/.exec(z) || /^(\d+)\s+(.+)$/.exec(z);
    const hinten = /^(.+?)\s*[×xX*]\s*(\d+)$/.exec(z);
    if (vorn)        { anzahl = +vorn[1];   z = vorn[2].trim(); }
    else if (hinten) { anzahl = +hinten[2]; z = hinten[1].trim(); }

    z = z.replace(/[.,;]+$/, '').trim();
    if (!z) return;
    stuecke.push({name: z.slice(0, 80), anzahl: Math.max(1, Math.min(999, anzahl)),
                  notiz: notiz.slice(0, 120)});
  });

  return {titel, muenzen, stuecke};
};

// ── Die Patchnotes lesen ────────────────────────────────────────
// Sie stehen als Markdown in der PATCHNOTES.md und werden dort auch
// geschrieben — eine zweite Fassung fürs Programm wäre nach der ersten
// Auslieferung veraltet. Gelesen wird deshalb die Datei selbst, und
// zwar nur so viel Markdown, wie darin wirklich vorkommt:
// Überschriften, Absätze, Aufzählungen, Tabellen, Codeblöcke, fett und
// `Code`. Was nicht erkannt wird, bleibt Text — eine Notiz mit einem
// Sternchen zu viel soll nicht als leere Seite enden.
const patchnotesInline = (text) => String(text === undefined || text === null ? '' : text)
  .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  .filter(s => s !== '')
  .map(s => (s.length > 4 && s.startsWith('**') && s.endsWith('**'))
              ? {art: 'fett', text: s.slice(2, -2)}
          : (s.length > 2 && s.startsWith('`') && s.endsWith('`'))
              ? {art: 'code', text: s.slice(1, -1)}
          : {art: 'text', text: s});

const patchnotesLesen = (text) => {
  const zeilen = String(text || '').replace(/\r/g, '').split('\n');
  const raus = [];
  let absatz = [];
  const absatzSchliessen = () => {
    if (absatz.length) { raus.push({art: 'absatz', text: absatz.join(' ')}); absatz = []; }
  };

  let i = 0;
  while (i < zeilen.length) {
    const roh = zeilen[i].trim();
    if (!roh) { absatzSchliessen(); i++; continue; }

    if (roh.startsWith('```')) {
      absatzSchliessen();
      const block = [];
      i++;
      while (i < zeilen.length && !zeilen[i].trim().startsWith('```')) { block.push(zeilen[i]); i++; }
      i++;                                          // die schliessende Zeile
      raus.push({art: 'code', zeilen: block});
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(roh);
    if (h) {
      absatzSchliessen();
      raus.push({art: h[1].length === 1 ? 'titel' : h[1].length === 2 ? 'version' : 'kopf',
                 text: h[2].trim()});
      i++; continue;
    }

    if (roh.startsWith('|')) {
      absatzSchliessen();
      const reihen = [];
      while (i < zeilen.length && zeilen[i].trim().startsWith('|')) {
        reihen.push(zeilen[i].trim().replace(/^\|/, '').replace(/\|$/, '')
                    .split('|').map(s => s.trim()));
        i++;
      }
      // Die Trennzeile aus Strichen gehoert zur Schreibweise, nicht zum Inhalt.
      const inhalt = reihen.filter(r => !r.every(s => /^:?-{2,}:?$/.test(s)));
      if (inhalt.length) raus.push({art: 'tabelle', kopf: inhalt[0], reihen: inhalt.slice(1)});
      continue;
    }

    if (/^[-*]\s+/.test(roh)) {
      absatzSchliessen();
      const punkte = [];
      while (i < zeilen.length) {
        const t = zeilen[i].trim();
        if (/^[-*]\s+/.test(t)) { punkte.push(t.replace(/^[-*]\s+/, '')); i++; continue; }
        // Eingerueckt und nicht leer: dieselbe Aufzaehlung, naechste Zeile.
        if (t && /^\s\s+/.test(zeilen[i]) && punkte.length) {
          punkte[punkte.length - 1] += ' ' + t; i++; continue;
        }
        break;
      }
      raus.push({art: 'punkte', zeilen: punkte});
      continue;
    }

    absatz.push(roh);
    i++;
  }
  absatzSchliessen();
  return raus;
};

// Nach Ausgaben getrennt: die neueste steht oben und geht offen auf, die
// aelteren stehen zugeklappt darunter. Alles auf einmal waeren tausend
// Zeilen, durch die niemand rollt.
const patchnotesAusgaben = (text) => {
  const raus = [];
  patchnotesLesen(text).forEach(b => {
    if (b.art === 'titel') return;                  // die Ueberschrift der Datei
    if (b.art === 'version') { raus.push({name: b.text, bloecke: []}); return; }
    if (raus.length) raus[raus.length - 1].bloecke.push(b);
  });
  return raus;
};

// ── Gegner als Text ─────────────────────────────────────────────
// Dasselbe für den Kampf. Was hier herauskommt, wandert nicht in die
// Gegnersammlung, sondern geradewegs in die Initiative — der Wächter am
// Tor, die vier Goblins, der Wolf, den sich jemand gerade ausgedacht
// hat. Drei Angaben genügen, und keine davon muss dastehen: ohne
// Trefferpunkte ist es einer, ohne Rüstungsklasse zehn.
//
// Die Trefferpunkte bleiben als Text stehen, auch „2W8+2" — gewürfelt
// wird erst im Kampf, und dann für jeden der vier Goblins einzeln.
const gegnerAusText = (text) => {
  const raus = [];

  String(text || '').split(/\r?\n/).forEach(roh => {
    let z = String(roh || '').trim();
    if (!z) return;
    z = z.replace(/^[-–—*•·]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
    if (!z || z.startsWith('#')) return;

    const felder = z.split(/\s*[|;,]\s*/).map(f => f.trim()).filter(Boolean);
    if (!felder.length) return;

    let name = felder.shift();
    let anzahl = 1, tp = '', ac = null;

    // Die Anzahl steht am Namen: „4x Goblin" oder „Goblin ×4".
    const vorn = /^(\d+)\s*[×xX*]\s*(.+)$/.exec(name) || /^(\d+)\s+(.+)$/.exec(name);
    const hinten = /^(.+?)\s*[×xX*]\s*(\d+)$/.exec(name);
    if (vorn)        { anzahl = +vorn[1];   name = vorn[2].trim(); }
    else if (hinten) { anzahl = +hinten[2]; name = hinten[1].trim(); }

    // Ganz ohne Trennzeichen: „Wächter am Tor 11 13". Zwei Zahlen am
    // Ende sind Trefferpunkte und Rüstungsklasse — eine einzelne nicht,
    // die gehört zum Namen („Wache 2").
    if (!felder.length) {
      const m = /^(.*[^\d\s])\s+(\d+)\s+(\d+)$/.exec(name);
      if (m) { name = m[1].trim(); felder.push(m[2], m[3]); }
    }

    // Was hinter dem Namen steht, ordnet sich über sein Wort zu. Zahlen
    // ohne Wort füllen der Reihe nach, was noch leer ist.
    const frei = [];
    felder.forEach(f => {
      const t = /\d+\s*[dwDW]\s*\d+(?:\s*\+\s*\d+)?|\d+/.exec(f);
      if (!t) return;
      const zahl = t[0];
      const wort = (f.slice(0, t.index) + ' ' + f.slice(t.index + zahl.length)).toLowerCase();
      if (/r(ü|ue)stung|\brk\b|\bac\b|panzer/.test(wort)) ac = Math.round(+zahl) || ac;
      else if (/treffer|leben|\btp\b|\bhp\b|\blp\b/.test(wort)) tp = zahl;
      // Die Anzahl braucht ihr Zeichen: „4x" ist eine Anzahl, die blosse
      // 4 in „Goblin | 4 | 15" sind Trefferpunkte.
      else if (/anzahl|st(ü|ue)ck/.test(wort) || /^\s*[×x*]\s*$/.test(wort)) anzahl = +zahl || anzahl;
      else frei.push(zahl);
    });
    frei.forEach(zahl => {
      if (!tp) tp = zahl;
      else if (ac === null) ac = Math.round(+zahl) || null;
    });

    name = name.replace(/[.,;:]+$/, '').trim();
    if (!name) return;
    raus.push({name: name.slice(0, 60), tp: String(tp || ''), ac: ac,
               anzahl: Math.max(1, Math.min(40, anzahl))});
  });

  return raus.slice(0, 60);
};

// ── Aus der Datenbank ───────────────────────────────────────────
// Beute und Laden fuellen sich aus der Sammlung der Gruppe. Gesucht
// wird nachsichtig: Grossschreibung und ein Leerzeichen zu viel sollen
// nicht dazu fuehren, dass ein Stueck ohne seine Werte im Bogen landet.
const dbSchluessel = (n) => String(n || '').toLowerCase()
  .replace(/[\s,.·–—_-]+/g, ' ').trim();
const dbEintrag = (liste, name) => {
  const k = dbSchluessel(name);
  if (!k) return null;
  return (liste || []).find(x => x && dbSchluessel(x.name) === k) || null;
};
// Dieselbe Suche, unter dem Namen, der am jeweiligen Ort passt: in der
// Beute und im Laden sind es Gegenstaende, im Kampf sind es Gegner.
const dbGegenstand = dbEintrag;
// Aus einem Datenbankeintrag ein Stueck fuers Inventar. Was jemand
// dazugeschrieben hat — „im Wert von 500 Gold" — sticht die
// Beschreibung aus der Datenbank: sie gilt fuer dieses eine Stueck.
const dbAlsGegenstand = (eintrag, name, anzahl, notiz) => ({
  ...newItem(),
  ...(eintrag || {}),
  id: 'db' + Date.now() + Math.floor(Math.random() * 1000),
  name: (eintrag && eintrag.name) || name,
  qty: Math.max(1, +anzahl || 1),
  description: (notiz && notiz.trim())
    ? notiz.trim()
    : ((eintrag && eintrag.description) || ''),
});
// Der lange Beschreibungstext der Datenbank taugt nicht als Notiz an
// einem Fundstueck: er traegt Auszeichnungen und ist zu lang.
const dbKurz = (eintrag, laenge) => {
  const roh = String((eintrag && eintrag.description) || '')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const max = laenge || 110;
  return roh.length > max ? roh.slice(0, max - 1).trimEnd() + '…' : roh;
};

// ── Traglast ────────────────────────────────────────────────────
// Die Gewichte stehen seit jeher an den Gegenständen; es fehlte die
// Summe und die Grenze. Beides ist Buchführung, und die meisten Runden
// wollen sie nicht — deshalb steht das hier bereit und wird nur
// gerechnet, wenn ein Abenteuer es einschaltet.
//
// Die Werte sind die Variante aus dem Regelwerk, in Kilo: belastet ab
// Stärke × 2,5, stark belastet ab × 5, und bei × 7,5 ist Schluss.
const TRAGLAST_STUFEN = [
  {ab: 0,   wort: '',               folge: ''},
  {ab: 2.5, wort: 'belastet',       folge: '3 m weniger Bewegung'},
  {ab: 5,   wort: 'stark belastet', folge: '6 m weniger · Nachteil auf Angriffe, Attributsproben und Rettungswürfe'},
  {ab: 7.5, wort: 'überladen',      folge: 'mehr geht nicht'},
];
const traglast = (c, staerke) => {
  const st = Math.max(1, +staerke || +((c || {}).str) || 10);
  const inv = ((c || {}).inventory) || [];
  const getragen = inv.reduce((s, i) => s + (parseFloat(i.weight) || 0) * (+i.qty || 1), 0);
  const grenzen = TRAGLAST_STUFEN.map(x => Math.round(x.ab * st * 10) / 10);
  let stufe = 0;
  for (let i = TRAGLAST_STUFEN.length - 1; i > 0; i--) {
    if (getragen >= grenzen[i]) { stufe = i; break; }
  }
  return {getragen: Math.round(getragen * 100) / 100, grenzen, stufe,
          wort: TRAGLAST_STUFEN[stufe].wort, folge: TRAGLAST_STUFEN[stufe].folge,
          hoechstens: grenzen[3]};
};

// ── Geld ────────────────────────────────────────────────────────
// Der Laden braucht, was am Tisch der Wirt macht: herausgeben. Alles
// in Kupfer gerechnet, gezahlt wird aus dem Kleingeld zuerst — wer mit
// Kupfer zahlen kann, behält sein Gold —, und was zu viel war, kommt
// als Wechselgeld zurück. Elektrum bleibt dabei liegen, wo es liegt:
// es wird angenommen, aber nie herausgegeben, so wie überall.
const MUENZ_WERT = {cp:1, sp:10, ep:50, gp:100, pp:1000};
const muenzenSumme = (w) => Object.keys(MUENZ_WERT)
  .reduce((s, k) => s + (+((w || {})[k]) || 0) * MUENZ_WERT[k], 0);

// Zahlt einen Betrag in Kupfer. Zurück kommt der neue Beutel — oder
// null, wenn es nicht reicht. Der Beutel wird dabei nicht umgerechnet:
// wer hundert Platin hat, hat sie hinterher noch.
const muenzenZahlen = (w, kupfer) => {
  const betrag = Math.max(0, Math.round(kupfer || 0));
  if (muenzenSumme(w) < betrag) return null;
  const neu = {pp:0, gp:0, ep:0, sp:0, cp:0, ...(w || {})};
  let offen = betrag;
  for (const k of ['cp', 'sp', 'ep', 'gp', 'pp']) {
    if (offen <= 0) break;
    const habe = +neu[k] || 0;
    const nehmen = Math.min(habe, Math.ceil(offen / MUENZ_WERT[k]));
    neu[k] = habe - nehmen;
    offen -= nehmen * MUENZ_WERT[k];
  }
  // Was zu viel hingelegt wurde, kommt in möglichst wenigen Münzen zurück.
  let rest = -offen;
  for (const k of ['pp', 'gp', 'sp', 'cp']) {
    const n = Math.floor(rest / MUENZ_WERT[k]);
    if (n > 0) { neu[k] = (+neu[k] || 0) + n; rest -= n * MUENZ_WERT[k]; }
  }
  return neu;
};
// Gutschreiben ist einfacher als zahlen: es kommt in Gold und Silber.
const muenzenDazu = (w, kupfer) => {
  const neu = {pp:0, gp:0, ep:0, sp:0, cp:0, ...(w || {})};
  let rest = Math.max(0, Math.round(kupfer || 0));
  for (const k of ['gp', 'sp', 'cp']) {
    const n = Math.floor(rest / MUENZ_WERT[k]);
    if (n > 0) { neu[k] = (+neu[k] || 0) + n; rest -= n * MUENZ_WERT[k]; }
  }
  return neu;
};
// Ein Preis, wie ihn ein Laden anschreibt: in Gold, mit Silber dahinter.
const preisText = (kupfer) => {
  const n = Math.max(0, Math.round(kupfer || 0));
  const g = Math.floor(n / 100), s = Math.floor((n % 100) / 10), c = n % 10;
  return [g ? g + ' GM' : '', s ? s + ' SM' : '', c ? c + ' KM' : '']
    .filter(Boolean).join(' ') || '0 GM';
};

// ── Konzentration ───────────────────────────────────────────────
// Kein Tisch denkt daran, und niemand gibt es gern zu: ein Zauber mit
// Konzentration endet, wenn man den Rettungswurf nach einem Treffer
// nicht schafft — und wenn man einen zweiten wirkt.
//
// Ob ein Zauber sie verlangt, muss niemand eintragen: es steht in
// seiner Wirkungsdauer. „Konzentration, bis zu 1 Minute“ — die Vorlagen
// der SRD tragen es alle, und wer selbst tippt, tippt es auch.
const brauchtKonzentration = (z) => !!(z && /konzentration/i.test(String(z.duration || '')));

// Der Schwierigkeitsgrad: die Hälfte des Schadens, mindestens 10. So
// steht es im Regelwerk, und es ist die Zahl, die am Tisch am
// häufigsten falsch geraten wird.
const konzentrationSG = (schaden) => Math.max(10, Math.floor((+schaden || 0) / 2));

// ── Der Stufenaufstieg ──────────────────────────────────────────
// Was eine Stufe am Bogen ändert, als Rechnung ohne Oberfläche: so
// lässt sie sich von aussen prüfen, und die Vorschau zeigt später
// genau das, was das Übernehmen schreibt — es ist dasselbe Ergebnis.

// 2 auf Stufe 1 bis 4, dann alle vier Stufen einer mehr.
const uebungsbonus = (stufe) => 2 + Math.floor((Math.max(1, Math.min(20, stufe)) - 1) / 4);

// Die Zauberplätze einer Klasse auf einer Stufe, als {1..9}. Null heisst
// nicht "keine Plätze", sondern "diese Klasse zaubert nicht" — der
// Unterschied entscheidet, ob der Aufstieg die Plätze anfasst.
const zauberPlaetze = (klasse, stufe) => {
  const r = KLASSEN_REGELN[klasse];
  if (!r || !r.zauber) return null;
  const i = Math.max(1, Math.min(20, stufe)) - 1;
  const leer = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
  if (r.zauber === 'pakt') {
    const p = PAKT_PLAETZE[i];
    return {...leer, [p.g]: p.n};
  }
  const zeile = (r.zauber === 'halb' ? ZAUBER_HALB : ZAUBER_VOLL)[i] || [];
  const raus = {...leer};
  zeile.forEach((n, g) => { raus[g + 1] = n; });
  return raus;
};

// ── Mehrere Klassen ─────────────────────────────────────────────
// Hauptklasse und Nebenklassen sind dieselbe Sache, nur an zwei Stellen
// gespeichert. Wer rechnen will, braucht sie als eine Liste.
const charKlassen = (c) => {
  const k = c || {};
  return [
    {charClass: k.charClass || '', level: Math.max(1, Math.min(20, +k.level || 1)), haupt: true},
    ...((k.multiclasses || []).filter(m => m && m.charClass).map(m => ({
      charClass: m.charClass, level: Math.max(1, Math.min(20, +m.level || 1)), haupt: false,
    }))),
  ];
};
const gesamtStufe = (c) => charKlassen(c).reduce((s, k) => s + k.level, 0);

// Die Zauberplätze über mehrere Klassen hinweg. Wer nur eine zaubernde
// Klasse hat, rechnet nach deren eigener Tabelle — so steht es im
// Regelwerk. Erst ab der zweiten wird eine Zaubererstufe gebildet: volle
// Klassen ganz, halbe zur Hälfte und abgerundet. Ein Paladin 1 bringt
// also nichts mit, ein Paladin 2 eine Stufe.
//
// Der Paktmagier zählt dabei nie mit; seine Plätze folgen einer eigenen
// Tabelle und kommen hier oben drauf. Das Heldenbuch führt eine Liste
// und nicht zwei — dass sie schon nach einer kurzen Rast zurückkommen,
// sagt der Aufstieg als Hinweis.
const ZAUBER_ART = (name) => (KLASSEN_REGELN[name] || {}).zauber || null;
const zauberStufe = (klassen) => (klassen || []).reduce((s, k) => {
  const art = ZAUBER_ART(k.charClass);
  const st = Math.max(0, +k.level || 0);
  return s + (art === 'voll' ? st : art === 'halb' ? Math.floor(st / 2) : 0);
}, 0);

const zauberPlaetzeGemischt = (klassen) => {
  const liste = (klassen || []).filter(k => k && k.charClass);
  const zauber = liste.filter(k => ['voll', 'halb'].includes(ZAUBER_ART(k.charClass)));
  const pakt   = liste.filter(k => ZAUBER_ART(k.charClass) === 'pakt');
  if (!zauber.length && !pakt.length) return null;

  const raus = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0};
  if (zauber.length === 1) {
    const eigen = zauberPlaetze(zauber[0].charClass, zauber[0].level) || {};
    for (let g = 1; g <= 9; g++) raus[g] = eigen[g] || 0;
  } else if (zauber.length > 1) {
    const stufe = zauberStufe(zauber);
    if (stufe >= 1) {
      (ZAUBER_VOLL[Math.min(20, stufe) - 1] || []).forEach((n, g) => { raus[g + 1] = n; });
    }
  }
  pakt.forEach(k => {
    const p = zauberPlaetze('Hexenmeister', k.level) || {};
    for (let g = 1; g <= 9; g++) raus[g] = (raus[g] || 0) + (p[g] || 0);
  });
  return raus;
};

// Ob die Attribute fürs Mischen reichen. Zurück kommt null, wenn sie es
// tun — sonst der Satz, der fehlt. Geprüft wird nicht verboten: eine
// Runde, die es anders hält, soll nicht am Programm scheitern.
const ATTR_NAME = {str:'Stärke', dex:'Geschicklichkeit', con:'Konstitution',
                   int:'Intelligenz', wis:'Weisheit', cha:'Charisma'};
const mischenGeht = (char, klasse) => {
  const r = KLASSEN_REGELN[klasse];
  if (!r || !r.mc) return null;
  const c = char || {};
  const reicht = (gruppe) => gruppe.every(a => (+c[a] || 0) >= 13);
  if (r.mc.some(reicht)) return null;
  const wege = r.mc.map(g => g.map(a => ATTR_NAME[a] + ' 13').join(' und ')).join(' oder ');
  const habe = [...new Set(r.mc.flat())]
    .map(a => ATTR_NAME[a] + ' ' + (+c[a] || 0)).join(', ');
  return 'Für ' + klasse + ' verlangt das Regelwerk ' + wege + ' — hier steht ' + habe + '.';
};

// Die Klassenmerkmale, die zwischen zwei Stufen dazukommen. Die Daten
// stehen in data-merkmale.json (SRD 5.1) und werden erst geladen, wenn
// der Aufstieg aufgeht — ein Aufstieg im Monat rechtfertigt keine Datei
// bei jedem Start.
//
// Was die Unterklasse gibt, steht als Erinnerung dabei ("unter") und
// wird nicht vorgewaehlt: welches Merkmal es ist, weiss nur der Bogen.
// Und was schon im Bogen steht, kommt nicht ein zweites Mal.
const merkmaleFuer = (daten, klasse, von, bis, schon) => {
  const liste = ((daten || {})[klasse] || []);
  const da = new Set((schon || []).map(f => dbSchluessel(f && f.name)));
  return liste
    .filter(m => m.stufe > von && m.stufe <= bis)
    .filter(m => !da.has(dbSchluessel(m.name + ' ' + m.stufe)) && !da.has(dbSchluessel(m.name)))
    .map(m => ({...m, klasse}));
};

// Was der Aufstieg vorhat. Er schreibt nichts — er sagt nur, was er
// schreiben würde, und genau das steht dann in der Vorschau.
//
//   char   der Bogen, wie er ist
//   wahl   {ziel, tpPlus, asi:{str:1,...}}
//
// Zurück kommt {neu, zeilen, hinweise}: neu sind die Felder für den
// Bogen, zeilen sind die Vorher/Nachher-Paare fuer die Vorschau, und
// die Hinweise sind das, was der Aufstieg nicht selbst erledigt.
const aufstiegPlan = (char, wahl) => {
  const c = char || {};
  const w = wahl || {};
  const alle = charKlassen(c);

  // Welche Klasse steigt auf? Ohne Angabe die Hauptklasse — so war es,
  // bevor es Nebenklassen gab, und so bleibt es fuer jeden Bogen mit nur
  // einer Klasse.
  const name = w.klasse || c.charClass;
  const dabei = alle.find(k => k.charClass === name) || null;
  const r = KLASSEN_REGELN[name];
  const von = dabei ? dabei.level : 0;
  const ziel = Math.max(1, Math.min(20, +(w.ziel) || von + 1));

  const zeilen = [], hinweise = [];
  const neu = {};
  const zeile = (was, alt2, jetzt) => {
    if (String(alt2) !== String(jetzt)) zeilen.push({was, alt: alt2, neu: jetzt});
  };

  // Die Klassenliste, wie sie nachher aussieht — daraus folgt alles
  // Weitere, und sie ist auch das, was geschrieben wird.
  const nachher = dabei
    ? alle.map(k => k.charClass === name ? {...k, level: ziel} : k)
    : [...alle, {charClass: name, level: ziel}];

  if (!dabei) {
    neu.multiclasses = [...((c.multiclasses) || []), {charClass: name, level: ziel}];
    zeilen.push({was: 'Neue Klasse', alt: '—', neu: name + ' ' + ziel});
  } else if (dabei.haupt) {
    neu.level = ziel;
    zeile(name, von, ziel);
  } else {
    neu.multiclasses = ((c.multiclasses) || []).map(m =>
      (m && m.charClass === name) ? {...m, level: ziel} : m);
    zeile(name, von, ziel);
  }

  // Die Gesamtstufe traegt den Uebungsbonus — nicht die Stufe einer
  // einzelnen Klasse. Ein Magier 5 / Kleriker 3 ist Stufe 8.
  const gesamtVor  = alle.reduce((s2, k) => s2 + k.level, 0);
  const gesamtNach = nachher.reduce((s2, k) => s2 + k.level, 0);
  if (nachher.length > 1) zeile('Gesamtstufe', gesamtVor, gesamtNach);

  // Trefferpunkte. Die Zahl steht in der Vorschau und ist dort
  // aenderbar — beim Wuerfeln stimmt kein Durchschnitt, und wer eine
  // Stufe zuruecknimmt, weiss selbst am besten, was damals fiel.
  const plus = Math.round(+(w.tpPlus) || 0);
  if (plus) {
    neu.maxHp = Math.max(1, (+c.maxHp || 0) + plus);
    neu.hp    = Math.max(0, (+c.hp || 0) + plus);
    zeile('Trefferpunkte', (+c.maxHp || 0), neu.maxHp);
  }

  const pb = uebungsbonus(gesamtNach);
  if (pb !== (+c.profBonus || 0)) { neu.profBonus = pb; zeile('Übungsbonus', '+' + (+c.profBonus || 0), '+' + pb); }

  // Attributssteigerung, wenn die Stufe eine gibt und eine gewählt wurde.
  const asi = w.asi || null;
  if (asi) {
    for (const k of Object.keys(asi)) {
      const alt2 = +c[k] || 10, jetzt = Math.min(20, alt2 + (+asi[k] || 0));
      const wort = (ATTR_WAHL.find(a => a.k === k) || {}).l || k;
      if (jetzt !== alt2) { neu[k] = jetzt; zeile(wort, alt2, jetzt); }
    }
  }

  // Zauberplätze — jetzt auch über mehrere Klassen. Die Regel dafür
  // steht in zauberPlaetzeGemischt; hier wird nur eingetragen, was sie
  // sagt, und verbrauchte Plätze bleiben verbraucht.
  const plaetze = zauberPlaetzeGemischt(nachher);
  if (plaetze) {
    const altSlots = c.spellSlots || {};
    const raus = {};
    let anders = false;
    for (let g = 1; g <= 9; g++) {
      const a = (altSlots[g] || altSlots[String(g)] || {});
      const max = plaetze[g] || 0;
      raus[g] = {max, used: Math.min(+a.used || 0, max)};
      if (max !== (+a.max || 0)) {
        anders = true;
        zeile((g === 1 ? '1.' : g + '.') + ' Grad', (+a.max || 0), max);
      }
    }
    if (anders) neu.spellSlots = raus;
  }

  // Die Merkmale, die dazukommen sollen. Sie stehen in der Vorschau und
  // werden genau so geschrieben — die Auswahl trifft das Fenster, das
  // Eintragen steht hier, damit beides nicht auseinanderlaufen kann.
  const merkmale = (w.merkmale || []).filter(m => m && m.name);
  if (merkmale.length) {
    const jetzt = Date.now().toString(36);
    neu.features = [...((c.features) || []), ...merkmale.map((m, i) => ({
      id: 'srd' + jetzt + i,
      name: m.name,
      source: 'SRD 5.1 · ' + (m.klasse || name) + ' ' + m.stufe,
      description: m.text || '',
      effects: [], effectsActive: true,
    }))];
    merkmale.forEach(m => zeilen.push({was: 'Merkmal', alt: '—',
      neu: m.name + ' (Stufe ' + m.stufe + ')'}));
  }

  // Ein Talent statt der Attributssteigerung. Es kommt als Merkmal in
  // den Bogen — samt seiner Effekte, damit es auch wirkt und nicht nur
  // dasteht. Steigert es nebenbei ein Attribut, steht das mit in der
  // Vorschau.
  const talent = w.talent || null;
  if (talent && talent.name) {
    neu.features = [...(neu.features || (c.features) || []), {
      id: 'tal' + Date.now().toString(36),
      name: talent.name,
      source: 'Talent · ' + name + ' ' + ziel,
      description: talent.description || '',
      effects: talent.effects || [], effectsActive: true,
    }];
    zeilen.push({was: 'Talent', alt: '—', neu: talent.name});
    if (talent.attr) {
      const alt2 = +c[talent.attr] || 10, jetzt = Math.min(20, alt2 + 1);
      const wort = (ATTR_WAHL.find(a => a.k === talent.attr) || {}).l || talent.attr;
      if (jetzt !== alt2) { neu[talent.attr] = jetzt; zeile(wort, alt2, jetzt); }
    }
  }

  // Was er nicht kann und was er nicht entscheidet, sagt er.
  if (!r) hinweise.push('Die Klasse „' + (name || '—') + '“ steht nicht in den Tabellen. '
    + 'Trefferwürfel, Zauberplätze und Attributssteigerung musst du selbst eintragen.');

  if (!dabei && r) {
    const fehlt = mischenGeht(c, name);
    if (fehlt) hinweise.push(fehlt);
    const eigen = mischenGeht(c, c.charClass);
    if (eigen) hinweise.push('Und zum Mischen muss auch die bisherige Klasse reichen: ' + eigen);
    hinweise.push('Eine neue Klasse bringt nur die Übung mit, die im Mischen erlaubt ist — '
      + 'nicht die volle Ausbildung. Rüstungen, Waffen und Fertigkeiten also nachsehen.');
  }

  const zauberKlassen = nachher.filter(k => ['voll', 'halb'].includes(ZAUBER_ART(k.charClass)));
  if (zauberKlassen.length > 1) {
    hinweise.push('Zauberplätze über ' + zauberKlassen.length + ' Klassen: gerechnet mit '
      + 'Zaubererstufe ' + zauberStufe(zauberKlassen) + ' (volle Klassen ganz, halbe zur Hälfte). '
      + 'Welche Zauber du kennst, richtet sich weiter nach jeder Klasse einzeln.');
  }
  if (nachher.some(k => ZAUBER_ART(k.charClass) === 'pakt')
      && (zauberKlassen.length > 0 || nachher.length > 1)) {
    hinweise.push('Die Plätze des Paktmagiers stehen mit in der Liste, kommen aber schon '
      + 'nach einer kurzen Rast zurück.');
  }

  if (r && ziel > von) {
    for (let st = von + 1; st <= ziel; st++) {
      if (r.asi.includes(st) && !asi) hinweise.push(name + ' Stufe ' + st + ' gibt eine '
        + 'Attributssteigerung (+2 auf eines oder +1 auf zwei) — oder ein Talent.');
      if (st === r.unter) hinweise.push('Auf ' + name + ' Stufe ' + st + ' wird die Unterklasse gewählt.');
    }
  }
  return {neu, zeilen, hinweise};
};

const newChar   = () => ({
  id:Date.now().toString(), name:"", race:"Mensch", charClass:"Kämpfer", level:1,
  multiclasses:[],
  hp:10, maxHp:10, tempHp:0, ac:10, speed:30, initiative:0, profBonus:2,
  // Regelkonform hat man Inspiration oder nicht; wer am Tisch mehrere
  // zulaesst, erhoeht das Maximum im Bogen.
  inspiration:0, inspirationMax:1,
  str:10, dex:10, con:10, int:10, wis:10, cha:10,
  // Bild des Helden, als data-URL. Liegt im Charakter-Datensatz und wird
  // deshalb vor dem Speichern verkleinert.
  portrait:"",
  background:"", notes:"", notesList:[], features:[], weapons:[], spells:[], skillProfs:[], expertiseProfs:[], jackOfAllTrades:false, languages:[], toolProfs:[], weaponProfs:[],
  savingThrowProfs:[],
  sorceryPoints:{max:0, used:0},
  resources:[],
  wsFavorites:[],
  // Neue Helden starten bereits auf Ausruestungsplaetzen — fuer sie gibt es
  // nichts umzustellen.
  inventory:[], currency:{pp:0,gp:0,ep:0,sp:0,cp:0}, equipment:[], acBonuses:[],
  gear:{}, gearMigrated:GEAR_MIGRATION,
  // Wird beim Anlegen auf das gerade offene Abenteuer gesetzt.
  adventure:"",
  spellSlots:{1:{max:0,used:0},2:{max:0,used:0},3:{max:0,used:0},4:{max:0,used:0},5:{max:0,used:0},6:{max:0,used:0},7:{max:0,used:0},8:{max:0,used:0},9:{max:0,used:0}},
});
// ── Die Einzelheiten einer Logzeile ────────────────────
// Unter jeder Zeile im Log stand bisher, was der Code sich gemerkt
// hatte: "grad: 3 · schule: Hervorrufung". Das sind Feldnamen, keine
// Woerter — sie waren nie zum Lesen gedacht. Hier bekommen sie welche.
//
// Was nicht in der Liste steht, wird gross geschrieben und
// durchgereicht: eine neue Angabe soll im Log auftauchen, auch wenn
// niemand daran gedacht hat, sie hier einzutragen.
const LOG_WORTE = {
  grad: 'Grad', schule: 'Schule', schaden: 'Schaden', seltenheit: 'Seltenheit',
  menge: 'Menge', quelle: 'Quelle', klasse: 'Klasse', stufe: 'Stufe',
  rasse: 'Volk', hintergrund: 'Hintergrund', kampf: 'Kampf', wirkt: 'Wirkt',
  ziel: 'Ziel', von: 'Von', an: 'An', gesetzt: 'Gesetzt', zurueck: 'Zurück',
  strich: 'Unterm Strich', spiel: 'Tisch', wer: 'Wer', grund: 'Grund',
};
// Ein Pfeil zwischen zwei Staenden bekommt Luft: "3→5" liest sich
// schlechter als "3 → 5", und im Log steht fast nur Vorher/Nachher.
const logWert = (v) => {
  const t = (v === true) ? 'ja' : (v === false) ? 'nein' : String(v);
  return t.includes('→') ? t.split('→').map(x => x.trim()).join(' → ') : t;
};
// Was sich zwischen zwei Staenden geaendert hat, als Einzelheiten fuer
// das Log. "Waffe bearbeitet" allein sagt nichts — die Frage am Tisch
// ist immer, was daran jetzt anders ist.
const logDiff = (alt, neu, felder) => {
  const raus = {};
  for (const [wort, lesen] of felder) {
    const a = lesen(alt || {}), b = lesen(neu || {});
    if (String(a === undefined || a === null ? '' : a)
        !== String(b === undefined || b === null ? '' : b))
      raus[wort] = (a === '' || a === undefined || a === null ? '—' : a)
                 + '→' + (b === '' || b === undefined || b === null ? '—' : b);
  }
  return raus;
};

const logEinzelheiten = (d) => Object.entries(d || {})
  .filter(([, v]) => v !== undefined && v !== null && v !== '')
  .map(([k, v]) => (LOG_WORTE[k] || (k.charAt(0).toUpperCase() + k.slice(1)))
                   + ': ' + logWert(v));

const newWeapon = () => ({id:Date.now().toString(),name:"",attrKey:"str",proficient:true,range:"1,5m",attackBonus:0,damage:"1W6",damageType:"Hieb",description:"",properties:[],equipped:false,imageData:"",effects:[]});
// ── Die Wirkung eines Zaubers ────────────────────────────────────
// Am Zauber steht sonst nur, was er ist — nicht, was er tut. Fuer das
// Zugfenster fehlte damit genau die Zahl, um die es im Kampf geht. Sie
// steht als Feld am Zauber:
//
//   wirkung: {art, wuerfel, attribut, rettung, halb, proGrad, zieleProGrad}
//
// Alles freiwillig. Ohne Wirkung bleibt der Zauber, was er war, und die
// Spielleitung tippt die Zahl wie bisher.
const RETTUNGEN = [
  {k:'str', l:'Stärke'},       {k:'dex', l:'Geschicklichkeit'},
  {k:'con', l:'Konstitution'}, {k:'int', l:'Intelligenz'},
  {k:'wis', l:'Weisheit'},     {k:'cha', l:'Charisma'},
];
// Die Schadensarten, die im Regelwerk vorkommen — fuer Vorschlagslisten.
const SCHADENSARTEN = ['Hieb','Stich','Wucht','Feuer','Kälte','Blitz','Säure','Gift',
                       'Nekrotisch','Gleißend','Psychisch','Energie','Schall'];
const RETTUNG_KURZ = {str:'STR', dex:'GES', con:'KON', int:'INT', wis:'WEI', cha:'CHA'};

// Der Wurf auf einem hoeheren Grad. Stimmen die Wuerfelseiten ueberein —
// 8W6 und "je Grad 1W6" —, wird zusammengezaehlt; sonst bleibt beides
// nebeneinander stehen, statt eine falsche Zahl zu erfinden.
const wuerfelAufGrad = (wirkung, grundGrad, grad) => {
  const w = wirkung || {};
  if (!w.wuerfel) return '';
  const drueber = Math.max(0, (+grad || +grundGrad || 0) - (+grundGrad || 0));
  if (!drueber || !w.proGrad) return w.wuerfel;
  const m = /^\s*(\d+)\s*[wWdD]\s*(\d+)\s*(.*)$/.exec(w.wuerfel);
  const p = /^\s*\+?\s*(\d+)\s*[wWdD]\s*(\d+)\s*$/.exec(w.proGrad);
  if (!m || !p || +p[2] !== +m[2]) {
    return w.wuerfel + ' + ' + drueber + '×' + w.proGrad;
  }
  return (+m[1] + (+p[1]) * drueber) + 'W' + m[2] + (m[3] ? ' ' + m[3].trim() : '');
};

// Aus der Beschreibung lesen, was im Text ohnehin steht. Die Vorlagen der
// SRD sind darin erstaunlich regelmaessig: "erleidet 8W6 Feuerschaden",
// "muss einen Geschicklichkeitsrettungswurf ausfuehren", "anderenfalls die
// Haelfte", "steigt der Schaden fuer jeden Grad darueber um 1W6". Was
// hier herauskommt, ist ein Vorschlag — korrigieren kostet einen Klick,
// alles von Hand einzutragen kostet einen Abend.
const wirkungAusText = (text, damageTags) => {
  const roh = String(text || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  const stelle = roh.search(/Auf h(ö|oe)heren Graden/i);
  const haupt   = stelle < 0 ? roh : roh.slice(0, stelle);
  const schwanz = stelle < 0 ? ''  : roh.slice(stelle);

  const w = {art:'', wuerfel:'', attribut:false, rettung:'', halb:false,
             proGrad:'', zieleProGrad:0, schadensart:'', flaeche:false};

  const wuerfel = /(\d+)\s*[wW]\s*(\d+)\s*(\+\s*(\d+))?/.exec(haupt);
  if (wuerfel) w.wuerfel = wuerfel[1] + 'W' + wuerfel[2] + (wuerfel[4] ? '+' + wuerfel[4] : '');

  const heilt = /(Trefferpunkte[^.]{0,80}zur(ü|ue)ck|gewinnt Trefferpunkte|wird geheilt)/i.test(haupt);
  const temp  = /tempor(ä|ae)re Trefferpunkte/i.test(haupt);
  w.art = temp ? 'temp' : heilt ? 'heilung' : (w.wuerfel ? 'schaden' : '');

  w.attribut = /Attributsmodifikator|Zauberwirken-Attribut/i.test(haupt);

  const rett = /(St(ä|ae)rke|Geschicklichkeit|Konstitution|Intelligenz|Weisheit|Charisma)s?rettungswurf/i.exec(haupt);
  if (rett) {
    const name = rett[1].toLowerCase().replace('ae','ä');
    w.rettung = {'stärke':'str','geschicklichkeit':'dex','konstitution':'con',
                 'intelligenz':'int','weisheit':'wis','charisma':'cha'}[name] || '';
  }
  w.halb = /anderenfalls die H(ä|ae)lfte|die H(ä|ae)lfte dieses Schadens|halben Schaden/i.test(haupt);

  // Flaeche: ein Wurf fuer alle. "Jede Kreatur in einer Sphaere ..." ist
  // die uebliche Formulierung; wo ein Rettungswurf und eine Form
  // zusammenkommen, ist es fast immer eine.
  const form = /(Radius|Kegel|Sph(ä|ae)re|Zylinder|W(ü|ue)rfel|Linie)/i.test(haupt);
  w.flaeche = /[Jj]ede Kreatur/.test(haupt) || (!!w.rettung && form);

  const steig = /um (\d+)\s*[wW]\s*(\d+)/.exec(schwanz);
  if (steig) w.proGrad = steig[1] + 'W' + steig[2];
  if (/ein weiterer? \w+|ein weiteres \w+|eine weitere \w+/i.test(schwanz)) w.zieleProGrad = 1;

  if (Array.isArray(damageTags) && damageTags.length) w.schadensart = damageTags[0];
  return w;
};

// Hat der Zauber ueberhaupt etwas eingetragen?
const hatWirkung = (w) => !!(w && (w.wuerfel || w.art || w.rettung));

const newSpell  = () => ({id:Date.now().toString(),name:"",level:1,school:"Hervorrufung",castingTime:"1 Aktion",range:"9 m",duration:"Sofort",components:"V, S",description:"",prepared:true});
// gearKind: in welchen Ausruestungsplatz das Stueck passt (leer = keiner).
// armorType/baseAC/acBonus nur bei Ruestungen und Schilden gefuellt.
const newItem   = () => ({id:Date.now().toString(),name:"",qty:1,weight:"",rarity:"gewöhnlich",description:"",tags:[],source:"",effects:[],effectsActive:false,kampf:false,gearKind:"",armorType:"",baseAC:0,acBonus:0});

// Lightweight fuzzy search: returns score > 0 if all query chars appear in order in str
const fuzzyMatch = (str, query) => {
  if (!query) return 1;
  str = str.toLowerCase(); query = query.toLowerCase();
  let si = 0, qi = 0, score = 0, consecutive = 0;
  while (si < str.length && qi < query.length) {
    if (str[si] === query[qi]) {
      consecutive++;
      score += consecutive * 2 + (si === qi ? 1 : 0);
      qi++;
    } else { consecutive = 0; }
    si++;
  }
  return qi === query.length ? score : 0;
};
const fuzzyFilter = (items, query, getStr) => {
  if (!query) return items;
  return items
    .map(item => ({ item, score: Math.max(...[].concat(getStr(item)).map(s => fuzzyMatch(s, query))) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);
};

// ── Suche ueber alle Angaben eines Gegenstands ───────────────────
// Text aus einer Beschreibung ziehen, ohne die Auszeichnung mitzusuchen —
// sonst faende "div" jeden formatierten Eintrag.
const htmlText = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};
// Umlaute fallen weg ("Übermantel" → "ubermantel"), damit die Suche auch
// ohne Umlauttaste trifft. Die zweite Fassung schreibt sie aus, sodass
// ebenso "uebermantel" gefunden wird.
const normSearch = (s) => String(s == null ? '' : s).toLowerCase()
  .replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const expandUmlauts = (s) => String(s == null ? '' : s).toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const containsFold = (hay, q) =>
  normSearch(hay).includes(normSearch(q)) || expandUmlauts(hay).includes(expandUmlauts(q));

// Rangfolge der Treffer; 0 heisst "passt nicht".
// Unscharf gesucht wird nur im Namen. Eine Teilfolgensuche ueber eine lange
// Beschreibung traefe fast jede Eingabe — die Buchstaben von "der" stehen in
// dieser Reihenfolge in nahezu jedem deutschen Satz. Die uebrigen Felder
// werden deshalb als zusammenhaengende Zeichenkette geprueft.
const itemSearchScore = (item, query, rarityLabel) => {
  const q = String(query == null ? '' : query).trim();
  if (!q) return 1;
  const name = item.name || '';
  let score = 0;
  if (normSearch(name).startsWith(normSearch(q)) || expandUmlauts(name).startsWith(expandUmlauts(q))) score = 1000;
  else if (containsFold(name, q)) score = 800;
  else {
    const f = fuzzyMatch(normSearch(name), normSearch(q));
    if (f > 0) score = 400 + Math.min(f, 200);
  }
  const felder = [
    [(item.tags || []).join(' '), 350],
    [item.setName || '', 340],
    [item.source || '', 300],
    [rarityLabel || item.rarity || '', 250],
    [(item.effects || []).map(e => (EFFECT_LABELS[e.target] || e.target || '') + ' ' + effectText(e)).join(' '), 220],
    [htmlText(item.description), 200],
  ];
  felder.forEach(([text, wert]) => { if (text && containsFold(text, q)) score = Math.max(score, wert); });
  return score;
};

// ── HTML aus Beschreibungen entschaerfen ─────────────────────────
// Beschreibungen liegen in der gemeinsamen Gruppendatenbank: was eine Person
// eintraegt, setzt der Browser der anderen ein. Der Rich-Text-Editor braucht
// echtes HTML, Escapen scheidet also aus — stattdessen eine Positivliste.
// Erlaubte Formatierungen bleiben, alles andere verliert sein Tag und behaelt
// nur seinen Text; ausfuehrbare oder einbettende Elemente fliegen ganz raus.
// Angewendet wird beim Anzeigen, nicht beim Speichern: so sind auch
// Eintraege abgedeckt, die schon in der Datenbank stehen.
const HTML_KEEP = new Set(['B','STRONG','I','EM','U','S','STRIKE','UL','OL','LI','BR','P','DIV','SPAN']);
const HTML_DROP = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META','FORM','INPUT','BUTTON','SVG','MATH']);
const sanitizeHtml = (html) => {
  if (!html) return '';
  let root;
  try {
    root = new DOMParser().parseFromString('<div id="r">' + html + '</div>', 'text/html').getElementById('r');
  } catch (e) {
    return String(html).replace(/</g, '&lt;');   // im Zweifel als Text zeigen
  }
  if (!root) return '';
  const clean = (node) => {
    Array.prototype.slice.call(node.childNodes).forEach(child => {
      if (child.nodeType === 3) return;                        // Text bleibt
      if (child.nodeType !== 1) { child.remove(); return; }    // Kommentare raus
      // tagName kommt bei HTML gross, bei Fremdinhalt (SVG, MathML) in
      // Originalschreibung — ohne Normalisierung greift die Sperrliste
      // dort nicht und der Text eines <script> im <svg> bliebe stehen.
      const tag = String(child.tagName || '').toUpperCase();
      if (HTML_DROP.has(tag)) { child.remove(); return; }
      clean(child);                                            // erst innen aufraeumen
      if (!HTML_KEEP.has(tag)) { child.replaceWith.apply(child, child.childNodes); return; }
      Array.prototype.slice.call(child.attributes).forEach(a => child.removeAttribute(a.name));
    });
  };
  clean(root);
  return root.innerHTML;
};

// ── Anklickbare Nicht-Buttons bedienbar machen ───────────────────
// Reiter, Karten und Punkte sind <div> mit onClick: per Maus bedienbar, per
// Tastatur unerreichbar, und Screenreader kuendigen sie nicht als Schaltflaeche
// an. Echte <button> waeren sauberer, wuerden hier aber das Layout umwerfen —
// deshalb Rolle, Fokus und Enter/Leertaste nachruesten.
// Verwendung:  <div className="tab" {...clickable(() => setTab(k), 'Attribute')}>
const clickable = (onClick, label) => ({
  role: 'button',
  tabIndex: 0,
  'aria-label': label,
  onClick,
  onKeyDown: e => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      onClick(e);
    }
  },
});
