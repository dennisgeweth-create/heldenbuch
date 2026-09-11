// Sucht Namen, die benutzt werden und die es nicht gibt.
//
// Der Anlass: in v5.3.1 wanderte der Zustand des Textfensters aus dem
// Bogen in das Fenster selbst. Die drei useState-Zeilen verschwanden —
// aber im Knopf blieb ein Aufruf stehen:
//
//     onClick={()=>{ setTextKopiert(false); setTextOffen(true); }}
//
// Das uebersetzt sauber, es faellt beim Bauen nicht auf, und keine
// Rechnungspruefung kommt daran vorbei: der Fehler entsteht erst beim
// Klicken. Dann wirft er einen ReferenceError, und die zweite Haelfte
// der Zeile — die, auf die es ankam — laeuft nie. Fuer den Spielleiter
// sah es aus, als tue der Knopf nichts. Er tat auch nichts.
//
// Geprueft wird mit dem Babel, der ohnehin daneben liegt. Er baut den
// Baum und mit ihm die Geltungsbereiche; gefragt wird dann fuer jeden
// benutzten Namen, ob ihn irgendein umschliessender Bereich kennt. Das
// ist keine Naeherung, sondern dieselbe Frage, die der Browser beim
// Ausfuehren stellt — nur eben vorher.
//
// Zwei Sorten Fehler kommen dabei heraus:
//
//   1. Ein Name ohne Herkunft. `setTextKopiert` ist einer.
//   2. Ein `const`, das oberhalb seiner eigenen Zeile benutzt wird.
//      Das ist der Fehler, der in v5.1.1 „Neuer Charakter" grau machte:
//      `willTalent` stand zwanzig Zeilen vor seiner Deklaration. Auch
//      das ist ein ReferenceError, nur ein spaeter zuschlagender.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── Was es ohne Zutun gibt ───────────────────────────────────────
// Der Browser, die beiden Bibliotheken aus vendor/, und die Huellen um
// die Schnittstelle. Letztere stehen in der index.html und werden von
// dort gelesen statt abgeschrieben: eine neue api…-Funktion soll hier
// nicht als Fehler auftauchen, nur weil niemand die Liste nachfuehrt.
const BROWSER = `
  window document navigator location history screen console localStorage
  sessionStorage fetch XMLHttpRequest FormData Blob File FileReader URL
  Image Audio Event CustomEvent ResizeObserver MutationObserver
  IntersectionObserver requestAnimationFrame cancelAnimationFrame
  setTimeout clearTimeout setInterval clearInterval queueMicrotask
  alert confirm prompt crypto performance structuredClone
  Math JSON Date Promise Object Array String Number Boolean Symbol Map Set
  WeakMap WeakSet RegExp Error TypeError RangeError Proxy Reflect BigInt
  Intl Function isNaN isFinite parseInt parseFloat encodeURIComponent
  decodeURIComponent encodeURI decodeURI globalThis undefined NaN Infinity
  AbortController TextEncoder TextDecoder Notification DOMParser XPathResult
  React ReactDOM Babel
  arguments eval
`.trim().split(/\s+/);

const ausIndex = () => {
  const t = fs.readFileSync('index.html', 'utf8');
  const raus = new Set();
  const re = /^\s*(?:const|let|var|function|async function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
  let m;
  while ((m = re.exec(t)) !== null) raus.add(m[1]);
  return [...raus];
};

const BEKANNT = new Set([...BROWSER, ...ausIndex()]);

// ── Die Quellen, so wie build.js sie zusammensetzt ───────────────
// Dieselbe Reihenfolge und derselbe Geltungsbereich: die Anwendung hat
// keine Importe, alle Dateien teilen sich einen. Nur so stimmt die
// Frage „kennt irgendjemand diesen Namen?" mit der Wirklichkeit ueberein.
const ordner = path.join('js', 'src');
const dateien = fs.readdirSync(ordner).filter(n => n.endsWith('.jsx')).sort();
const stuecke = [
  {name: 'js/data.js', text: fs.readFileSync(path.join('js', 'data.js'), 'utf8')},
  {name: 'js/util.js', text: fs.readFileSync(path.join('js', 'util.js'), 'utf8')},
  ...dateien.map(n => ({name: 'js/src/' + n,
                        text: fs.readFileSync(path.join(ordner, n), 'utf8')})),
];

// Woher eine Zeile stammt: der Baum kennt nur eine Nummer im
// Gesamttext. Ohne diese Umrechnung stuende im Fehler „Zeile 24 117",
// und danach suchte niemand.
const grenzen = [];
let quelle = '', zeile = 1;
stuecke.forEach(s => {
  grenzen.push({name: s.name, ab: zeile});
  quelle += s.text + '\n';
  zeile += s.text.split('\n').length;
});
const woher = (nr) => {
  let treffer = grenzen[0];
  for (const g of grenzen) if (g.ab <= nr) treffer = g;
  return treffer.name + ':' + (nr - treffer.ab + 1);
};

// ── Babel, aus vendor/ ───────────────────────────────────────────
const ladeBabel = () => {
  const sandbox = {window: {}, self: {}, navigator: {userAgent: 'node'}, console};
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join('vendor', 'babel.min.js'), 'utf8'),
    sandbox, {filename: 'babel.min.js'});
  return sandbox.Babel || sandbox.window.Babel;
};
const Babel = ladeBabel();

const ohneHerkunft = [];
const zuFrueh = [];

// Ein Plugin sieht denselben Baum wie der Uebersetzer — samt der
// Geltungsbereiche, die er ohnehin berechnet.
const pruefer = () => ({
  visitor: {
    ReferencedIdentifier(pfad) {
      const name = pfad.node.name;
      if (BEKANNT.has(name)) return;
      // In `{a: 1}` ist `a` kein Name, den jemand kennen muesste, und
      // in `x.y` ist `y` keiner. Babel trennt das schon; die Abfrage
      // hier faengt nur, was als JSX-Attribut durchrutscht.
      if (pfad.parentPath.isJSXAttribute && pfad.parentPath.isJSXAttribute()) return;

      const bindung = pfad.scope.getBinding(name);
      if (!bindung) {
        if (!pfad.scope.hasBinding(name)) {
          ohneHerkunft.push({name, zeile: pfad.node.loc && pfad.node.loc.start.line});
        }
        return;
      }
      // ── Benutzt, bevor es dasteht ──
      // Nur innerhalb derselben Funktion: was in einem Rueckruf steht,
      // laeuft spaeter und darf nach oben greifen. Und nur `const` und
      // `let` — `var` und Funktionen werden hochgezogen.
      if (bindung.kind !== 'const' && bindung.kind !== 'let') return;
      if (pfad.getFunctionParent() !== bindung.path.getFunctionParent()) return;
      const hier = pfad.node.start, dort = bindung.path.node.start;
      if (typeof hier === 'number' && typeof dort === 'number' && hier < dort) {
        zuFrueh.push({name, zeile: pfad.node.loc && pfad.node.loc.start.line,
                      ab: bindung.path.node.loc && bindung.path.node.loc.start.line});
      }
    },
  },
});

Babel.registerPlugin('hb-namen', pruefer);
Babel.transform(quelle, {
  presets: [['react', {runtime: 'classic'}]],
  plugins: ['hb-namen'],
  filename: 'alles.jsx',
  compact: false,
  sourceMaps: false,
  code: false,
});

// ── Bericht ──────────────────────────────────────────────────────
// Babel geht mehrfach ueber denselben Baum, und jeder Durchgang meldet
// dieselbe Stelle. Einmal genuegt.
const einmalig = (liste) => {
  const gesehen = new Set();
  return liste.filter(f => {
    const k = f.name + ':' + f.zeile;
    if (gesehen.has(k)) return false;
    gesehen.add(k);
    return true;
  });
};
let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

const fehlend = einmalig(ohneHerkunft);
if (fehlend.length) {
  schlecht += fehlend.length;
  fehlend.forEach(f => console.log('  FEHLER ' + f.name
    + ' wird benutzt, steht aber nirgends geschrieben — ' + woher(f.zeile)));
} else gut++;

const frueh = einmalig(zuFrueh);
if (frueh.length) {
  schlecht += frueh.length;
  frueh.forEach(f => console.log('  FEHLER ' + f.name + ' wird in '
    + woher(f.zeile) + ' benutzt, steht aber erst in ' + woher(f.ab)));
} else gut++;

// ── Die Probe auf die Probe ──────────────────────────────────────
// Eine Pruefung, die nichts findet, sagt nur dann etwas aus, wenn sie
// beweisen kann, dass sie etwas faende.
// Einmal angemeldet, danach nur noch gefuellt: ein zweites
// registerPlugin unter demselben Namen warnt bei jedem Aufruf.
let probeErgebnis = null;
Babel.registerPlugin('hb-probe', () => ({
  visitor: {
    ReferencedIdentifier(pfad) {
      const name = pfad.node.name;
      if (BEKANNT.has(name)) return;
      const b = pfad.scope.getBinding(name);
      if (!b) { if (!pfad.scope.hasBinding(name)) probeErgebnis.fehlt.push(name); return; }
      if (b.kind !== 'const' && b.kind !== 'let') return;
      if (pfad.getFunctionParent() !== b.path.getFunctionParent()) return;
      if (pfad.node.start < b.path.node.start) probeErgebnis.frueh.push(name);
    },
  },
}));
const anStueck = (text) => {
  probeErgebnis = {fehlt: [], frueh: []};
  Babel.transform(text, {presets: [['react', {runtime: 'classic'}]],
    plugins: ['hb-probe'], filename: 'p.jsx', code: false});
  return probeErgebnis;
};

ist('ein Name ohne Herkunft faellt auf',
  anStueck('const f = () => { setTextKopiert(false); };').fehlt, ['setTextKopiert']);
ist('mit Herkunft nicht mehr',
  anStueck('const f = () => { const [a, setA] = [0, () => {}]; setA(1); return a; };').fehlt,
  []);
ist('ein Feldzugriff ist kein freier Name',
  anStueck('const f = (el) => el.setAttribute("x", 1);').fehlt, []);
ist('ein Schluessel in einem Objekt auch nicht',
  anStueck('const o = {gibtEsNicht: 1};').fehlt, []);
ist('und ein JSX-Attribut ebenso',
  anStueck('const f = () => <div gibtEsNicht="1" />;').fehlt, []);
ist('ein const, das zu frueh benutzt wird, faellt auf',
  anStueck('const f = () => { const a = willTalent; const willTalent = 1; return a; };').frueh,
  ['willTalent']);
ist('  … im Rueckruf dagegen nicht — der laeuft spaeter',
  anStueck('const f = () => { const g = () => spaeter; const spaeter = 1; return g; };').frueh,
  []);
ist('und von unten nach oben ist ohnehin in Ordnung',
  anStueck('const f = () => { const a = 1; return a; };').frueh, []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
