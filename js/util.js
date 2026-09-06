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

  return {
    effekte: effs,
    eff,
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
             proGrad:'', zieleProGrad:0, schadensart:''};

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
const newItem   = () => ({id:Date.now().toString(),name:"",qty:1,weight:"",rarity:"gewöhnlich",description:"",tags:[],source:"",effects:[],effectsActive:false,gearKind:"",armorType:"",baseAC:0,acBonus:0});

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
