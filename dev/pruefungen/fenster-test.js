// Prueft, dass ein Fenster sich Stelle und Groesse merkt.
//
// Der Haken lebt sonst im Browser. Hier steht das Noetige nachgestellt
// daneben: ein Speicher, ein Beobachter der Groesse, ein Element mit
// einem Kasten — mehr braucht `useSchiebefenster` nicht. Der Grund fuer
// den Umweg: ein ResizeObserver liefert nur, wenn das Fenster wirklich
// gezeichnet wird, und in einer verborgenen Vorschau tut es das nicht.
const fs = require('fs');

// ── Die nachgestellte Umgebung ───────────────────────────────────
const speicher = {};
globalThis.localStorage = {
  getItem: (k) => (k in speicher ? speicher[k] : null),
  setItem: (k, v) => { speicher[k] = String(v); },
  removeItem: (k) => { delete speicher[k]; },
};
globalThis.window = {innerWidth: 1400, innerHeight: 900};

// Der Beobachter meldet, wenn jemand ihn dazu auffordert.
const beobachter = [];
globalThis.ResizeObserver = class {
  constructor(fn) { this.fn = fn; beobachter.push(this); }
  observe(el) { this.el = el; }
  disconnect() {}
};
const groesseAendern = (el, w, h) => {
  el.kasten = {width: w, height: h};
  beobachter.forEach(b => { if (b.el === el) b.fn(); });
};

// Ein Element, so viel davon wie gebraucht wird.
const bauElement = () => ({
  style: {},
  kasten: {width: 460, height: 400},
  getBoundingClientRect() { return this.kasten; },
});

// Von React braucht der Haken drei Sachen, und keine davon muss echt
// sein: gerendert wird hier nichts.
const zustaende = [];
globalThis.React = {
  useState: (anfang) => {
    const wert = typeof anfang === 'function' ? anfang() : anfang;
    zustaende.push(wert);
    return [wert, () => {}];
  },
  useRef: (wert) => ({current: wert}),
  useEffect: () => {},
};

const quelle = fs.readFileSync('js/src/0-basis.jsx', 'utf8');
const anfang = quelle.indexOf('const schiebeKlemmen');
const ende   = quelle.indexOf('const useEingeklappt');
eval(quelle.slice(anfang, ende) + ';globalThis.M = {schiebeKlemmen, useSchiebefenster};');
Object.assign(globalThis, M);

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};
const wahr = (n, a) => ist(n, !!a, true);
// Der Haken schreibt erst, wenn die Hand einen Moment still war.
const warten = () => new Promise(r => setTimeout(r, 550));

(async () => {

// ── Ohne Gemerktes faengt es beim Standard an ────────────────────
let f = useSchiebefenster('wb', {x: 100, y: 60}, 460);
ist('ohne Gemerktes gilt der Standard', f.pos, {x: 100, y: 60});
ist('  … und es steht noch nichts im Speicher', speicher.wb, undefined);

// ── Die Groesse wird gemerkt ─────────────────────────────────────
let el = bauElement();
f.masz.ref(el);
ist('ohne Gemerktes wird nichts eingestellt', el.style.width, undefined);
groesseAendern(el, 620, 480);
await warten();
ist('die gezogene Groesse steht im Speicher',
  JSON.parse(speicher.wb), {x: 100, y: 60, w: 620, h: 480});

// Zwischenschritte beim Ziehen schreiben nicht jeder fuer sich.
const vorher = speicher.wb;
groesseAendern(el, 621, 480);
groesseAendern(el, 640, 490);
groesseAendern(el, 660, 500);
ist('waehrend der Bewegung wird nicht geschrieben', speicher.wb, vorher);
await warten();
ist('  … erst danach, und dann der letzte Stand',
  JSON.parse(speicher.wb).w, 660);

// ── Und beim naechsten Mal wieder eingestellt ────────────────────
zustaende.length = 0;
beobachter.length = 0;
f = useSchiebefenster('wb', {x: 100, y: 60}, 460);
ist('die Stelle kommt zurueck', f.pos, {x: 100, y: 60});
el = bauElement();
f.masz.ref(el);
ist('die Groesse wird wieder eingestellt', [el.style.width, el.style.height],
  ['660px', '500px']);

// ── Schieben aendert die Groesse nicht, und umgekehrt ────────────
// Beides liegt in einem Eintrag; wer nur eins anfasst, darf das andere
// nicht mitnehmen.
speicher.wb = JSON.stringify({x: 5, y: 7, w: 300, h: 200});
zustaende.length = 0; beobachter.length = 0;
f = useSchiebefenster('wb', {x: 0, y: 0}, 460);
el = bauElement();
f.masz.ref(el);
groesseAendern(el, 800, 600);
await warten();
ist('die Stelle bleibt beim Aendern der Groesse stehen',
  JSON.parse(speicher.wb), {x: 5, y: 7, w: 800, h: 600});

// ── Was nicht gemerkt werden darf ────────────────────────────────
// Ein Kasten ohne Ausdehnung heisst: das Fenster ist gerade nicht da.
// Den zu merken hiesse, es beim naechsten Mal unsichtbar aufzumachen.
speicher.wb = JSON.stringify({x: 5, y: 7, w: 800, h: 600});
groesseAendern(el, 0, 0);
await warten();
ist('eine Groesse von null wird nicht gemerkt',
  JSON.parse(speicher.wb), {x: 5, y: 7, w: 800, h: 600});

// ── Die Stelle wird geklemmt ─────────────────────────────────────
// Ein Fenster, das auf einem breiteren Schirm stand, muss wieder zu
// fassen sein.
speicher.eng = JSON.stringify({x: 3000, y: 2000, w: 400, h: 300});
zustaende.length = 0; beobachter.length = 0;
f = useSchiebefenster('eng', {x: 0, y: 0}, 460);
wahr('eine Stelle weit rechts kommt zurueck ins Bild', f.pos.x <= 1400 - 140);
wahr('  … und von unten auch', f.pos.y <= 900 - 60);

// Und ein Fenster, das links hinausragt, bleibt greifbar.
ist('am linken Rand bleibt ein Griff stehen',
  schiebeKlemmen({x: -9999, y: 10}, 460).x, -460 + 140);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);

})();
