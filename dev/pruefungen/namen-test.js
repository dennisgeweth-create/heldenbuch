// Sucht Setzfunktionen, die aufgerufen werden und die es nicht gibt.
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
// Die Regel hier ist einfach und deshalb ohne Fehlalarm: eine
// Setzfunktion, die im ganzen Quellcode **nur** als Aufruf vorkommt und
// nirgends sonst, hat keine Herkunft. Jede echte steht mindestens
// einmal anders da — in `const [x, setX] = useState()`, in einer
// Entnahme aus dem Kontext, oder als durchgereichte Eigenschaft.
//
// Was sie nicht findet: einen Namen, den es gibt, der aber an dieser
// Stelle nicht sichtbar ist. Dafuer braeuchte es einen echten
// Geltungsbereich — und den hat diese Anwendung bewusst nicht: alle
// Dateien teilen sich einen.
const fs = require('fs');
const path = require('path');

// Was der Browser selbst mitbringt. Sie werden aufgerufen und stehen
// nirgends geschrieben — zu Recht.
const VOM_BROWSER = new Set([
  'setTimeout', 'setInterval', 'setImmediate',
]);

// Kommentare heraus: dort steht schon mal ein Aufruf als Beispiel, und
// ein Beispiel ist keine Verwendung. (Dieser Kopf hier ist der Beweis —
// ohne den Schnitt faende die Pruefung `setTextKopiert` in sich selbst.)
const ohneKommentare = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const quellen = [];
const sammeln = (ordner, filter) => {
  fs.readdirSync(ordner).filter(filter).sort().forEach(n =>
    quellen.push({name: path.join(ordner, n),
                  text: ohneKommentare(fs.readFileSync(path.join(ordner, n), 'utf8'))}));
};
sammeln(path.join('js', 'src'), n => n.endsWith('.jsx'));
sammeln('js', n => n === 'util.js' || n === 'data.js');

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

// Alle Vorkommen einer Setzfunktion, die kein Zugriff auf ein Feld sind
// (`el.setAttribute` faellt also heraus).
const NAME = /(^|[^.\w$])(set[A-Z][A-Za-z0-9_$]*)/g;

const nurAufruf = new Map();   // Name → wo er aufgerufen wird
const auchAnders = new Set();  // Name, der irgendwo eine Herkunft hat

quellen.forEach(({name, text}) => {
  let m;
  NAME.lastIndex = 0;
  while ((m = NAME.exec(text)) !== null) {
    const wort = m[2];
    if (VOM_BROWSER.has(wort)) continue;
    const danach = text.slice(m.index + m[0].length);
    if (/^\s*\(/.test(danach)) {
      const zeile = text.slice(0, m.index).split('\n').length;
      if (!nurAufruf.has(wort)) nurAufruf.set(wort, []);
      nurAufruf.get(wort).push(name + ':' + zeile);
    } else {
      auchAnders.add(wort);
    }
  }
});

const heimatlos = [...nurAufruf.keys()].filter(w => !auchAnders.has(w)).sort();
if (heimatlos.length) {
  heimatlos.forEach(w => console.log('  FEHLER ' + w
    + ' wird aufgerufen, steht aber nirgends geschrieben\n     '
    + nurAufruf.get(w).join('\n     ')));
  schlecht += heimatlos.length;
} else {
  gut++;
}

// Und die Probe auf die Probe: ein erfundener Name muss auffallen,
// sonst prueft sie nichts.
const probe = (text) => {
  const raus = [];
  let m; NAME.lastIndex = 0;
  const t = ohneKommentare(text);
  const aufruf = new Set(), sonst = new Set();
  while ((m = NAME.exec(t)) !== null) {
    if (VOM_BROWSER.has(m[2])) continue;
    (/^\s*\(/.test(t.slice(m.index + m[0].length)) ? aufruf : sonst).add(m[2]);
  }
  aufruf.forEach(w => { if (!sonst.has(w)) raus.push(w); });
  return raus.sort();
};
ist('ein Aufruf ohne Herkunft faellt auf',
  probe('onClick={()=>{ setTextKopiert(false); setTextOffen(true); }}'),
  ['setTextKopiert', 'setTextOffen']);
ist('mit Herkunft nicht mehr',
  probe('const [offen, setTextOffen] = useState(false);\n'
      + 'onClick={()=>setTextOffen(true)}'),
  []);
ist('eine Entnahme aus dem Kontext zaehlt als Herkunft',
  probe('const { setTab, setSf } = React.useContext(C);\nsetTab("log"); setSf(null);'),
  []);
ist('ein Feldzugriff ist kein Aufruf', probe('el.setAttribute("x", 1);'), []);
ist('und was der Browser mitbringt, zaehlt nicht',
  probe('setTimeout(()=>{}, 10); setInterval(f, 5);'), []);
ist('ein Aufruf im Kommentar zaehlt auch nicht',
  probe('// hier stand mal setAltesDing(1)\nconst [a, setA] = useState(); setA(1);'), []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
