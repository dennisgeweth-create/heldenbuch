// Heldenbuch — reine Hilfsfunktionen ohne React und ohne JSX.
// Modifikatoren, Bildverkleinerung, Vorlagen fuer neue Objekte, unscharfe
// Suche und der Rechenkern des Effektsystems. Setzt js/data.js voraus
// (EFFECT_LABELS).

const newEffect = () => ({id:Date.now().toString()+Math.random().toString(36).slice(2,6), target:"str", mode:"bonus", value:1});

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
  // Die alte Ausruestungsliste zaehlt nur, solange der Held nicht umgestellt
  // ist — danach steckt dasselbe Stueck als Inventargegenstand in einem Platz
  // und wuerde sonst doppelt wirken.
  if (!c.gearMigrated) (c.equipment||[]).forEach(q => { if (q.equipped) add('e:'+q.id, q.name||"Ausrüstung", "🛡", q.effects); });
  (c.inventory||[]).forEach(i => { if (i.effectsActive) add('i:'+i.id, i.name||"Gegenstand", "🎒", i.effects); });
  return out;
};

// Einmalige Umstellung auf Ausruestungsplaetze. Legt die Stuecke aus
// c.equipment als Inventargegenstaende an und setzt die angelegten in ihren
// Platz. c.equipment und c.acBonuses bleiben dabei unberuehrt liegen — der
// Rueckweg bleibt offen, aufgeraeumt wird erst, wenn sich die Umstellung
// bewaehrt hat. Mehrfach ausfuehrbar: bereits uebernommene Stuecke erkennt
// sie an der Kennung wieder.
const GEAR_MIGRATION = 2;
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
  return {inventory: inv, gear, gearMigrated: GEAR_MIGRATION};
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
const effectText = e => (e.mode === "set" ? "= " : ((+e.value||0) >= 0 ? "+" : "")) + (+e.value || 0);

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
  background:"", notes:"", notesList:[], features:[], weapons:[], spells:[], skillProfs:[], expertiseProfs:[], jackOfAllTrades:false, languages:[], toolProfs:[], weaponProfs:[],
  savingThrowProfs:[],
  sorceryPoints:{max:0, used:0},
  resources:[],
  wsFavorites:[],
  // Neue Helden starten bereits auf Ausruestungsplaetzen — fuer sie gibt es
  // nichts umzustellen.
  inventory:[], currency:{pp:0,gp:0,ep:0,sp:0,cp:0}, equipment:[], acBonuses:[],
  gear:{}, gearMigrated:GEAR_MIGRATION,
  spellSlots:{1:{max:0,used:0},2:{max:0,used:0},3:{max:0,used:0},4:{max:0,used:0},5:{max:0,used:0},6:{max:0,used:0},7:{max:0,used:0},8:{max:0,used:0},9:{max:0,used:0}},
});
const newWeapon = () => ({id:Date.now().toString(),name:"",attrKey:"str",proficient:true,range:"1,5m",attackBonus:0,damage:"1W6",damageType:"Hieb",description:"",properties:[],equipped:false,imageData:"",effects:[]});
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
