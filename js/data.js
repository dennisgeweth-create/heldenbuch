// Heldenbuch — Nachschlagetabellen des Regelwerks.
// Reine Daten ohne Logik: Klassen, Zauberschulen, Fertigkeiten, Seltenheiten,
// Waffeneigenschaften, Schadensarten und die Ziele des Effektsystems.
// Wird vor js/util.js und vor dem Anwendungscode geladen.

const CC = {
  Barbar:       {bg:"#4a1010",border:"#8b2020",text:"#e87070"},
  Barde:        {bg:"#1a3a4a",border:"#2080a0",text:"#70c0e8"},
  Kleriker:     {bg:"#4a3a10",border:"#b8860b",text:"#e8c96a"},
  Druide:       {bg:"#1a3a20",border:"#2d6a4f",text:"#52b788"},
  Kämpfer:      {bg:"#2a2a2a",border:"#606060",text:"#c0c0c0"},
  Mönch:        {bg:"#3a1a10",border:"#8b4020",text:"#e8a070"},
  Paladin:      {bg:"#3a2a10",border:"#b8920b",text:"#e8d070"},
  Waldläufer:   {bg:"#1a2a10",border:"#4a7a30",text:"#88c060"},
  Schurke:      {bg:"#1a1a2a",border:"#404080",text:"#8080c0"},
  Zauberer:     {bg:"#2a1a3a",border:"#6a3fa0",text:"#b080e0"},
  Hexenmeister: {bg:"#3a1030",border:"#902060",text:"#d060a0"},
  Magier:       {bg:"#1a1a3a",border:"#2040a0",text:"#6080d0"},
};
const SC = {
  Beschwörung:  {bg:"#1a2a3a",border:"#2060a0",text:"#60a0e0"},
  Verwandlung:  {bg:"#1a3a20",border:"#205a30",text:"#52b788"},
  Illusion:     {bg:"#2a1a3a",border:"#6040a0",text:"#a080d0"},
  Hervorrufung: {bg:"#3a1a10",border:"#c04020",text:"#e87050"},
  Nekromantie:  {bg:"#1a1a1a",border:"#505050",text:"#909090"},
  Bann:   {bg:"#3a3010",border:"#a08020",text:"#d0c060"},
  Erkenntnis:  {bg:"#1a3a3a",border:"#208080",text:"#60c0c0"},
  Verzauberung: {bg:"#3a1030",border:"#902060",text:"#d060a0"},
};
const RARITIES = [
  {key:"gewöhnlich",  label:"Gewöhnlich",  color:"#a0a0a0"},
  {key:"ungewöhnlich",label:"Ungewöhnlich",color:"#52b788"},
  {key:"selten",      label:"Selten",      color:"#4a9edd"},
  {key:"sehrSelten",  label:"Sehr Selten", color:"#9b59b6"},
  {key:"legendär",    label:"Legendär",    color:"#e8a030"},
  {key:"artefakt",    label:"Artefakt",    color:"#c0392b"},
];
const AC = {str:"#c06060",dex:"#60a060",con:"#c09040",int:"#6080c0",wis:"#80c0a0",cha:"#c080b0"};
const AL = {str:"STR",dex:"GES",con:"KON",int:"INT",wis:"WEI",cha:"CHA"};
const AF = {str:"Stärke",dex:"Geschicklichkeit",int:"Intelligenz",wis:"Weisheit",cha:"Charisma"};
const SKILLS = [
  {key:"athletik",      label:"Athletik",              attr:"str"},
  {key:"akrobatik",     label:"Akrobatik",              attr:"dex"},
  {key:"fingerfert",    label:"Fingerfertigkeit",       attr:"dex"},
  {key:"heimlichkeit",  label:"Heimlichkeit",           attr:"dex"},
  {key:"arkaneKunde",   label:"Arkane Kunde",           attr:"int"},
  {key:"geschichte",    label:"Geschichte",             attr:"int"},
  {key:"nachforschung", label:"Nachforschungen",        attr:"int"},
  {key:"natur",         label:"Naturkunde",             attr:"int"},
  {key:"religion",      label:"Religion",               attr:"int"},
  {key:"medizin",       label:"Heilkunde",              attr:"wis"},
  {key:"tierfuehrung",  label:"Mit Tieren umgehen",     attr:"wis"},
  {key:"einblick",      label:"Motiv erkennen",         attr:"wis"},
  {key:"ueberleben",    label:"Überlebenskunst",        attr:"wis"},
  {key:"aufmerksamkeit",label:"Wahrnehmung",            attr:"wis"},
  {key:"auftreten",     label:"Auftreten",              attr:"cha"},
  {key:"einschuechtern",label:"Einschüchtern",          attr:"cha"},
  {key:"taueschen",     label:"Täuschen",               attr:"cha"},
  {key:"ueberreden",    label:"Überzeugen",             attr:"cha"},
];
// Schadensfarben der Zaubermarken. Deckt mehr Arten ab als DTYPE_COLORS,
// das nur die Waffenschadensarten kennt.
const DMG_COLORS = {Feuer:'#e07030',Kälte:'#70b8d8',Blitz:'#c0d850',Säure:'#90c040',Gift:'#80b030',Nekrotisch:'#9060c0',Gleißend:'#f0e060',Psychisch:'#c070d0',Energie:'#80a0f0',Schall:'#c0a0e0',Hieb:'#a07050',Stich:'#b08060',Wucht:'#c09070'};

// ── Effekte von Waffen, Rüstung und Gegenständen ────────────────────
// Ein Effekt veraendert einen Wert des Helden, solange sein Traeger aktiv
// ist (Waffe/Ruestung angelegt, Gegenstand eingeschaltet).
//   mode 'bonus' addiert und stapelt mit anderen Boni.
//   mode 'set'   setzt einen festen Wert. Treffen mehrere Setzungen auf
//                denselben Wert, gewinnt die hoechste; Boni kommen danach
//                obendrauf. Das haelt das Ergebnis unabhaengig davon, in
//                welcher Reihenfolge Gegenstaende eingetragen wurden.
const EFFECT_GROUPS = [
  {group:"Attribute", items:[
    {key:"str", label:"Stärke"},        {key:"dex", label:"Geschicklichkeit"},
    {key:"con", label:"Konstitution"},  {key:"int", label:"Intelligenz"},
    {key:"wis", label:"Weisheit"},      {key:"cha", label:"Charisma"},
  ]},
  {group:"Kampf", items:[
    {key:"ac",        label:"Rüstungsklasse"},   {key:"maxHp",   label:"Max. Trefferpunkte"},
    {key:"speed",     label:"Bewegung (m)"},     {key:"initiative", label:"Initiative"},
    {key:"profBonus", label:"Übungsbonus"},
    {key:"attack",    label:"Angriffswürfe"},    {key:"damage",  label:"Schaden"},
  ]},
  {group:"Zauber", items:[
    {key:"spellDc",     label:"Zauber-SG"},
    {key:"spellAttack", label:"Zauber-Angriffsbonus"},
  ]},
  {group:"Rettungswürfe", items:[
    {key:"saveAll", label:"Alle Rettungswürfe"},
    ...["str","dex","con","int","wis","cha"].map(a=>({key:"save_"+a, label:"RW "+AL[a]})),
  ]},
  {group:"Fertigkeiten", items:[
    {key:"skillAll", label:"Alle Fertigkeiten"},
    ...SKILLS.map(s=>({key:"skill_"+s.key, label:s.label})),
  ]},
  {group:"Sinne & Bewegung", items:[
    {key:"passivePerception", label:"Passive Wahrnehmung"},
    {key:"darkvision", label:"Dunkelsicht (m)"},
    {key:"swimSpeed",  label:"Schwimmbewegung (m)"},
    {key:"climbSpeed", label:"Kletterbewegung (m)"},
    {key:"flySpeed",   label:"Flugbewegung (m)"},
  ]},
  // ── Schalter statt Zahlen ─────────────────────────────────────
  // flag:true heisst: der Effekt gilt oder gilt nicht, eine Hoehe gibt
  // es nicht. Der Editor blendet Rechenart und Wert dafuer aus, und die
  // Anzeige zeigt nur den Namen. Sie fliessen in keine Rechnung ein —
  // das Heldenbuch fuehrt sie auf, gewuerfelt wird am Tisch.
  {group:"Immunitäten", items:[
    {key:"imm_crit",      label:"Immun gegen kritische Treffer", flag:true},
    {key:"imm_charm",     label:"Immun gegen Bezaubern",         flag:true},
    {key:"imm_fear",      label:"Immun gegen Furcht",            flag:true},
    {key:"imm_poison",    label:"Immun gegen Gift",              flag:true},
    {key:"imm_disease",   label:"Immun gegen Krankheit",         flag:true},
    {key:"imm_sleep",     label:"Immun gegen magischen Schlaf",  flag:true},
    {key:"imm_paralysis", label:"Immun gegen Gelähmt",           flag:true},
    {key:"imm_blind",     label:"Immun gegen Blind",             flag:true},
  ]},
  {group:"Vorteil & Nachteil", items:[
    {key:"adv_initiative", label:"Vorteil auf Initiative",              flag:true},
    {key:"dis_initiative", label:"Nachteil auf Initiative",             flag:true},
    {key:"adv_saveSpell",  label:"Vorteil auf RW gegen Zauber",         flag:true},
    {key:"adv_savePoison", label:"Vorteil auf RW gegen Gift",           flag:true},
    {key:"adv_death",      label:"Vorteil auf Rettungswürfe gegen Tod", flag:true},
    {key:"dis_death",      label:"Nachteil auf Rettungswürfe gegen Tod",flag:true},
  ]},
  // Je Fertigkeit ein Paar. Ein gebrochener Arm gibt keinen Abzug in
  // Zahlen, er gibt Nachteil — dafuer gab es bisher kein Ziel, und "-2 auf
  // Athletik" war eine Notluege im Bogen.
  {group:"Vorteil auf Fertigkeiten", items:[
    {key:"adv_skillAll", label:"Vorteil auf alle Fertigkeiten", flag:true},
    ...SKILLS.map(s=>({key:"adv_skill_"+s.key, label:"Vorteil: "+s.label, flag:true})),
  ]},
  {group:"Nachteil auf Fertigkeiten", items:[
    {key:"dis_skillAll", label:"Nachteil auf alle Fertigkeiten", flag:true},
    ...SKILLS.map(s=>({key:"dis_skill_"+s.key, label:"Nachteil: "+s.label, flag:true})),
  ]},
  {group:"Besonderes", items:[
    {key:"spc_surprise",   label:"Kann nicht überrascht werden", flag:true},
    {key:"spc_water",      label:"Wasseratmung",                 flag:true},
    {key:"spc_noSleep",    label:"Braucht keinen Schlaf",        flag:true},
    {key:"spc_speakAll",   label:"Versteht alle Sprachen",       flag:true},
  ]},
  // Aus denselben Schadensarten gebaut, die auch die Zaubermarken
  // faerben — so heisst die Resistenz genau wie der Schaden, gegen den
  // sie schuetzt.
  {group:"Resistenzen", items:
    Object.keys(DMG_COLORS).map(t=>({key:"res_"+t, label:"Resistenz: "+t, flag:true})),
  },
];
const EFFECT_LABELS = {};
const EFFECT_FLAGS  = new Set();
EFFECT_GROUPS.forEach(g=>g.items.forEach(i=>{
  EFFECT_LABELS[i.key] = i.label;
  if (i.flag) EFFECT_FLAGS.add(i.key);
}));
// Frueher gab es genau ein Paar fuer Heimlichkeit. Seit es jede Fertigkeit
// gibt, waere es zweimal in der Auswahl gestanden. Die alten Schluessel
// bleiben lesbar, damit bereits eingetragene Effekte nicht namenlos werden.
[['adv_stealth','Vorteil: Heimlichkeit'],['dis_stealth','Nachteil: Heimlichkeit']]
  .forEach(([k,l]) => { EFFECT_LABELS[k] = l; EFFECT_FLAGS.add(k); });
const isFlagEffect = (t) => EFFECT_FLAGS.has(t);

const RACES   = ["Mensch","Elf","Zwerg","Halbling","Halbork","Tiefling","Drachengeborener","Gnom","Halbelf","Anderes"];
// ── Was eine Klasse je Stufe mitbringt ──────────────────────────
// Nur Tabellen, kein Text: Trefferwürfel, welche Stufen eine
// Attributssteigerung geben, auf welcher die Unterklasse gewählt wird,
// welche zwei Rettungswürfe geübt sind, und ob und wie die Klasse
// zaubert. Aus diesen fünf Zahlen folgt alles, was ein Aufstieg am
// Bogen ändert.
//
// Wer eine eigene Klasse einträgt, steht hier nicht — der Aufstieg
// sagt das dann und rechnet nur, was er ohne die Tabelle kann.
const KLASSEN_REGELN = {
  Barbar:       {tw:12, zauber:null,   asi:[4,8,12,16,19],          unter:3, rw:['str','con']},
  Barde:        {tw:8,  zauber:'voll', asi:[4,8,12,16,19],          unter:3, rw:['dex','cha']},
  Kleriker:     {tw:8,  zauber:'voll', asi:[4,8,12,16,19],          unter:1, rw:['wis','cha']},
  Druide:       {tw:8,  zauber:'voll', asi:[4,8,12,16,19],          unter:2, rw:['int','wis']},
  'Kämpfer':    {tw:10, zauber:null,   asi:[4,6,8,12,14,16,19],     unter:3, rw:['str','con']},
  'Mönch':      {tw:8,  zauber:null,   asi:[4,8,12,16,19],          unter:3, rw:['str','dex']},
  Paladin:      {tw:10, zauber:'halb', asi:[4,8,12,16,19],          unter:3, rw:['wis','cha']},
  'Waldläufer': {tw:10, zauber:'halb', asi:[4,8,12,16,19],          unter:3, rw:['str','dex']},
  Schurke:      {tw:8,  zauber:null,   asi:[4,8,10,12,16,19],       unter:3, rw:['dex','int']},
  Zauberer:     {tw:6,  zauber:'voll', asi:[4,8,12,16,19],          unter:1, rw:['con','cha']},
  Hexenmeister: {tw:8,  zauber:'pakt', asi:[4,8,12,16,19],          unter:1, rw:['wis','cha']},
  Magier:       {tw:6,  zauber:'voll', asi:[4,8,12,16,19],          unter:2, rw:['int','wis']},
};

// Die Zauberplätze, Stufe 1 bis 20. Je Zeile die Plätze vom 1. bis zum
// 9. Grad; was fehlt, ist null. Voll zaubern Barde, Kleriker, Druide,
// Zauberer und Magier; halb Paladin und Waldläufer (und die fangen erst
// auf Stufe 2 an).
const ZAUBER_VOLL = [
  [2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],
  [4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],
  [4,3,3,3,3,2,2,1,1],
];
const ZAUBER_HALB = [
  [],[2],[3],[3],[4,2],[4,2],[4,3],[4,3],[4,3,2],[4,3,2],
  [4,3,3],[4,3,3],[4,3,3,1],[4,3,3,1],[4,3,3,2],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,1],
  [4,3,3,3,2],[4,3,3,3,2],
];
// Der Hexenmeister zählt anders: wenige Plätze, aber alle auf demselben
// Grad, und sie kommen schon nach einer kurzen Rast zurück.
const PAKT_PLAETZE = [
  {n:1,g:1},{n:2,g:1},{n:2,g:2},{n:2,g:2},{n:2,g:3},{n:2,g:3},{n:2,g:4},{n:2,g:4},
  {n:2,g:5},{n:2,g:5},{n:3,g:5},{n:3,g:5},{n:3,g:5},{n:3,g:5},{n:3,g:5},{n:3,g:5},
  {n:4,g:5},{n:4,g:5},{n:4,g:5},{n:4,g:5},
];

const CLASSES = Object.keys(CC);
const SCHOOLS = Object.keys(SC);
const SPELL_ATTR = {Barde:"cha",Kleriker:"wis",Druide:"wis",Paladin:"cha",Waldläufer:"wis",Zauberer:"int",Hexenmeister:"cha",Magier:"int",Schurke:"int"};
const WPROPS  = ["Finesse","Leicht","Schwer","Reichweite","Wurfwaffe","Zweihändig","Vielseitig","Ladezeit","Munition","Spezial"];
const DTYPES  = ["Hieb","Stich","Wucht","Feuer","Kälte","Schockgriff","Säure","Gift","Nekrotisch","Gleißend","Psychisch","Energie"];
// Nur als Flaechentoenung im Kopfbalken der Waffen-Detailansicht verwendet —
// nie als alleiniger Traeger einer Information, die Schadensart steht daneben.
const DTYPE_COLORS = {Hieb:"#a07050",Stich:"#b08060",Wucht:"#c09070",Feuer:"#e07030","Kälte":"#70b8d8",Schockgriff:"#c0d850","Säure":"#90c040",Gift:"#80b030",Nekrotisch:"#9060c0","Gleißend":"#f0e060",Psychisch:"#c070d0",Energie:"#80a0f0"};
const COINS   = [
  {key:"pp",label:"Platin",  color:"#c0c0d0"},
  {key:"gp",label:"Gold",    color:"#e8c96a"},
  {key:"ep",label:"Elektrum",color:"#88c0b0"},
  {key:"sp",label:"Silber",  color:"#c0c0c0"},
  {key:"cp",label:"Kupfer",  color:"#c8844a"},
];
const WATTRS = [{key:"str",label:"Stä"},{key:"dex",label:"Ges"},{key:"fin",label:"Fin"},{key:"int",label:"Int"},{key:"wis",label:"Wei"},{key:"cha",label:"Cha"}];

// Auswahl fuer den Emoji-Knopf im Rich-Text-Editor.
const EMOJI_LIST = [
  '😀','😂','😅','😊','🙂','😎','🤔','😮','😱','😭','😡','🥳',
  '👍','👎','✅','❌','⚠️','💡','🔥','⭐','💎','🪙','🗡','🛡',
  '🐲','🦄','💀','👁','🧙','⚔','🏹','🔮','📜','📖','🎲','🎯',
  '🌟','✨','💥','❄','🌊','🔥','⚡','🌪','☀','🌙','🌈','🍀',
  '❤','🧡','💛','💚','💙','💜','🖤','🤍','❤‍🔥','💔','💘','💝',
  '→','←','↑','↓','►','◄','•','◆','✦','✧','⚜','🔰',
];

// Klassenfarben fuer die Marken auf den Zauberkarten. Lagen bis Stufe 1 im
// Rendercode der Karte und wurden bei jedem Zauber neu angelegt.
const CC_COLORS = {'Artifizient':'#70b8c8','Barbar':'#c84040','Barde':'#4090c0','Druide':'#52b788','Hexenmeister':'#9060c0','Kämpfer':'#c08040','Kleriker':'#e0c040','Magier':'#6080d0','Mönch':'#d09040','Paladin':'#e0a030','Schurke':'#808080','Waldläufer':'#70a050','Zauberer':'#c060a0'};

// ── Ausruestungsplaetze ─────────────────────────────────────────
// spalte: wo der Platz in der Puppe steht. nimmt: welche Traegerart ein
// Gegenstand angeben muss, um hier hineinzupassen ('waffe' meint einen
// Eintrag aus cur.weapons). rk: rechnet unmittelbar an der Ruestungsklasse
// mit — alle uebrigen Plaetze wirken ueber das Effektsystem.
const GEAR_SLOTS = [
  {key:'kopf',       label:'Kopf',        kurz:'Kopf',   icon:'🪖', spalte:'links',  nimmt:['kopf']},
  {key:'hals',       label:'Hals',        kurz:'Hals',   icon:'📿', spalte:'links',  nimmt:['hals']},
  {key:'umhang',     label:'Umhang',      kurz:'Umhang', icon:'🧥', spalte:'links',  nimmt:['umhang']},
  {key:'ruestung',   label:'Rüstung',     kurz:'Rüst.',  icon:'🛡️', spalte:'links',  nimmt:['ruestung'], rk:true},
  {key:'arme',       label:'Armschienen', kurz:'Arme',   icon:'💪', spalte:'links',  nimmt:['arme']},
  {key:'haende',     label:'Handschuhe',  kurz:'Hände',  icon:'🧤', spalte:'links',  nimmt:['haende']},
  {key:'guertel',    label:'Gürtel',      kurz:'Gürtel', icon:'🎗️', spalte:'rechts', nimmt:['guertel']},
  {key:'stiefel',    label:'Stiefel',     kurz:'Füße',   icon:'🥾', spalte:'rechts', nimmt:['stiefel']},
  {key:'ring1',      label:'Ring I',      kurz:'Ring I', icon:'💍', spalte:'rechts', nimmt:['ring']},
  {key:'ring2',      label:'Ring II',     kurz:'Ring II',icon:'💍', spalte:'rechts', nimmt:['ring']},
  {key:'wunderding', label:'Wunderding',  kurz:'Wunder', icon:'🔮', spalte:'rechts', nimmt:['wunderding']},
  {key:'sonstiges',  label:'Sonstiges',   kurz:'Sonst.', icon:'🎭', spalte:'rechts', nimmt:['sonstiges']},
  {key:'haupthand',  label:'Haupthand',   kurz:'Haupt',  icon:'⚔️', spalte:'hand',   nimmt:['waffe']},
  {key:'nebenhand',  label:'Nebenhand',   kurz:'Neben',  icon:'🛡️', spalte:'hand',   nimmt:['waffe','schild'], rk:true},
  {key:'fernkampf',  label:'Fernkampf',   kurz:'Fern',   icon:'🏹', spalte:'hand',   nimmt:['waffe']},
];
// Traegerart, die ein Gegenstand angeben kann. 'ring' passt in beide
// Ringplaetze, 'schild' nur in die Nebenhand.
const GEAR_KINDS = [
  {key:'',           label:'— kein Platz —'},
  {key:'kopf',       label:'Kopf'},
  {key:'hals',       label:'Hals / Amulett'},
  {key:'umhang',     label:'Umhang'},
  {key:'ruestung',   label:'Rüstung'},
  {key:'schild',     label:'Schild'},
  {key:'arme',       label:'Armschienen'},
  {key:'haende',     label:'Handschuhe'},
  {key:'guertel',    label:'Gürtel'},
  {key:'stiefel',    label:'Stiefel'},
  {key:'ring',       label:'Ring'},
  {key:'wunderding', label:'Wunderding'},
  {key:'sonstiges',  label:'Sonstiges'},
];
// Ruestungsarten und wie die Geschicklichkeit einfliesst.
const ARMOR_KINDS = [
  {key:'',       label:'Keine Rüstung', basis:0},
  {key:'light',  label:'Leichte Rüstung', basis:11, hinweis:'Basis + GES-Mod'},
  {key:'medium', label:'Mittlere Rüstung', basis:13, hinweis:'Basis + GES-Mod (max. +2)'},
  {key:'heavy',  label:'Schwere Rüstung',  basis:16, hinweis:'Basis (kein GES)'},
  {key:'shield', label:'Schild',           basis:2,  hinweis:'Bonus zur RK'},
];

// Gaengige Ruestungen als Vorlage. Standen bis zur Umstellung als Chips
// unter der Ausruestungsliste; in der Puppe legen sie das Stueck an und
// stecken es gleich in seinen Platz.
const ARMOR_TEMPLATES = [
  {name:'Lederrüstung',          art:'ruestung', armorType:'light',  baseAC:11},
  {name:'Verstärkte Lederrüstung',art:'ruestung', armorType:'light',  baseAC:12},
  {name:'Lederlamellenrüstung',  art:'ruestung', armorType:'light',  baseAC:13},
  {name:'Schuppenpanzer',        art:'ruestung', armorType:'medium', baseAC:13},
  {name:'Kettenhemd',            art:'ruestung', armorType:'medium', baseAC:13},
  {name:'Brustpanzer',           art:'ruestung', armorType:'medium', baseAC:14},
  {name:'Schienenpanzer',        art:'ruestung', armorType:'medium', baseAC:15},
  {name:'Halbplatte',            art:'ruestung', armorType:'medium', baseAC:15},
  {name:'Ringpanzerhemd',        art:'ruestung', armorType:'heavy',  baseAC:14},
  {name:'Kettenpanzer',          art:'ruestung', armorType:'heavy',  baseAC:16},
  {name:'Bänderpanzer',          art:'ruestung', armorType:'heavy',  baseAC:17},
  {name:'Plattenpanzer',         art:'ruestung', armorType:'heavy',  baseAC:18},
  {name:'Schild',                art:'schild',   armorType:'shield', baseAC:2, icon:'🛡'},
];

// Zustaende im Kampf. Feste Liste statt freier Eingabe — so heisst
// "Liegend" bei allen gleich und laesst sich zaehlen.
const CONDITIONS = ['Geblendet','Betäubt','Bezaubert','Erschöpft','Verängstigt','Gepackt',
  'Handlungsunfähig','Unsichtbar','Gelähmt','Versteinert','Vergiftet','Liegend',
  'Festgesetzt','Bewusstlos','Taub'];

// Reiter des Abenteuerlogs.
const LOG_TABS = ['charakter','zauber','inventar','waffen','attribute','rüst','notizen'];
const LOG_TAB_ICONS = {'charakter':'👤','zauber':'✨','inventar':'🎒','waffen':'⚔','attribute':'📊','rüst':'🛡','notizen':'📜'};
