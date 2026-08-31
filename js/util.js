// Heldenbuch — reine Hilfsfunktionen ohne React und ohne JSX.
// Modifikatoren, Bildverkleinerung, Vorlagen fuer neue Objekte, unscharfe
// Suche und der Rechenkern des Effektsystems. Setzt js/data.js voraus
// (EFFECT_LABELS).

const newEffect = () => ({id:Date.now().toString()+Math.random().toString(36).slice(2,6), target:"str", mode:"bonus", value:1});

// Sammelt alle Effekte, die gerade wirken, samt Herkunft fuer die Anzeige.
const collectEffects = (c) => {
  if (!c) return [];
  const out = [];
  const add = (source, icon, list) => (list||[]).forEach(e => {
    if (e && e.target && EFFECT_LABELS[e.target]) out.push({...e, source, icon});
  });
  (c.weapons   ||[]).forEach(w => { if (w.equipped)      add(w.name||"Waffe",       "⚔", w.effects); });
  (c.equipment ||[]).forEach(q => { if (q.equipped)      add(q.name||"Ausrüstung",  "🛡", q.effects); });
  (c.inventory ||[]).forEach(i => { if (i.effectsActive) add(i.name||"Gegenstand",  "🎒", i.effects); });
  return out;
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
  str:10, dex:10, con:10, int:10, wis:10, cha:10,
  background:"", notes:"", notesList:[], features:[], weapons:[], spells:[], skillProfs:[], expertiseProfs:[], jackOfAllTrades:false, languages:[], toolProfs:[], weaponProfs:[],
  savingThrowProfs:[],
  sorceryPoints:{max:0, used:0},
  resources:[],
  wsFavorites:[],
  inventory:[], currency:{pp:0,gp:0,ep:0,sp:0,cp:0}, equipment:[], acBonuses:[],
  spellSlots:{1:{max:0,used:0},2:{max:0,used:0},3:{max:0,used:0},4:{max:0,used:0},5:{max:0,used:0},6:{max:0,used:0},7:{max:0,used:0},8:{max:0,used:0},9:{max:0,used:0}},
});
const newWeapon = () => ({id:Date.now().toString(),name:"",attrKey:"str",proficient:true,range:"1,5m",attackBonus:0,damage:"1W6",damageType:"Hieb",description:"",properties:[],equipped:false,imageData:"",effects:[]});
const newSpell  = () => ({id:Date.now().toString(),name:"",level:1,school:"Hervorrufung",castingTime:"1 Aktion",range:"9 m",duration:"Sofort",components:"V, S",description:"",prepared:true});
const newItem   = () => ({id:Date.now().toString(),name:"",qty:1,weight:"",rarity:"gewöhnlich",description:"",tags:[],source:"",effects:[],effectsActive:false});

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
