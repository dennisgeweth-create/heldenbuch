// Prueft „Der Hut des Gauklers" — der Hut auf Walze 3, was er zieht,
// was er verwandelt, und die gemessene Quote.
const fs = require('fs');
const lade = (d, m) => { const r = fs.readFileSync(d, 'utf8'); return m ? r.split(m)[0] : r; };
const teile = [
  lade('js/src/2f7-walzen.jsx', '// ══ Ende der reinen Rechnung'),
  lade('js/src/2fb-hut.jsx', '// ── Der Tisch'),
].join('\n');
const namen = [...teile.matchAll(/^const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1]);
eval(teile + ';globalThis.M = {' + namen.join(', ') + '};');
Object.assign(globalThis, M);

let gut = 0, schlecht = 0;
const ist = (name, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + name + '\n     ist  ' + A + '\n     soll ' + B);
};
const wahr = (name, a) => ist(name, !!a, true);

const S = HUT_SYMBOLE;
// G Gaukler, K Koenig, P Prinzessin, F Falke, R Ross, E Jagdhund, H Hut.
// Der Punkt ist Fuellung: je Walze ein anderer Kartenbuchstabe, damit
// keine Kette entsteht, die niemand gemeint hat.
const KURZ = {G:'gaukler', K:'koenig', P:'prinzessin', F:'falke', R:'ross', E:'hund', H:'hut',
              a:'a', b:'k', c:'zehn', d:'j', e:'q'};
const FUELL = ['q', 'j', 'zehn', 'k', 'a'];
const F = (s) => s.split('').map((c, i) => c === '.' ? FUELL[i % 5] : KURZ[c]);
const EIN = 10;      // Gesamteinsatz; der Linieneinsatz ist 1
// Ein Zufall, der sagt, was er sagen soll.
const folge = (...z) => { let i = 0; return () => z[i++ % z.length]; };

// ── Die Baender ──────────────────────────────────────────────────
ist('fuenf Baender', HUT_BAENDER.length, 5);
wahr('jedes sechzig lang', HUT_BAENDER.every(b => b.length === HUT_BANDLAENGE));
ist('der Hut liegt nur auf Walze 3',
  HUT_BAENDER.map(b => b.includes('hut')), [false, false, true, false, false]);
ist('  … und dort dreimal', HUT_BAENDER[2].filter(k => k === 'hut').length, 3);
// Zwei Huete in einem Fenster von drei gaebe es im Vorbild nicht — und
// hutWo faende nur einen.
wahr('zwei Huete liegen nie im selben Fenster', HUT_BAENDER[2].every((k, i, b) =>
  k !== 'hut' || (b[(i + 1) % b.length] !== 'hut' && b[(i + 2) % b.length] !== 'hut')));
wahr('der Gaukler liegt auf jeder Walze',
  HUT_BAENDER.every(b => b.filter(k => k === 'gaukler').length === 3));
wahr('jedes gemalte Zeichen hat sein Bild',
  S.filter(s => !s.karte).every(s => s.bild && fs.existsSync(s.bild)));
wahr('  … und jeder Buchstabe seine Karte', S.filter(s => /^[a-z]$|^zehn$/.test(s.k)).every(s => s.karte));
wahr('jedes Zeichen der Tafel liegt irgendwo',
  S.every(s => HUT_BAENDER.some(b => b.includes(s.k))));

// ── Wo der Hut liegt ─────────────────────────────────────────────
ist('oben auf Walze 3', hutWo(F('..H..' + '.....' + '.....')), 2);
ist('in der Mitte', hutWo(F('.....' + '..H..' + '.....')), 7);
ist('unten', hutWo(F('.....' + '.....' + '..H..')), 12);
ist('kein Hut, keine Stelle', hutWo(F('.....' + '.....' + '.....')), -1);
ist('auf einer anderen Walze zaehlt er nicht', hutWo(F('H...H' + '.....' + '.....')), -1);

// ── Was er zieht ─────────────────────────────────────────────────
const feld1 = F('K.H..' + '.E...' + 'G....');
// Da liegen: Koenig, Jagdhund, und die Buchstaben der Fuellung. Der Gaukler und
// der Hut kommen nicht in Frage.
const alle = new Set();
let zwei = 0;
for (let i = 0; i < 3000; i++) {
  const g = hutWahl(feld1, S, Math.random);
  g.forEach(k => alle.add(k));
  if (g.length === 2) zwei++;
  if (g.length === 2 && g[0] === g[1]) alle.add('DOPPELT');
}
wahr('er zieht nur, was auf dem Feld liegt',
  [...alle].every(k => feld1.includes(k)));
wahr('  … nie den Gaukler und nie sich selbst', !alle.has('gaukler') && !alle.has('hut'));
wahr('  … und nie zweimal dasselbe Bild', !alle.has('DOPPELT'));
wahr('  … und jedes, das daliegt, kommt einmal dran',
  ['koenig', 'hund', 'q', 'j', 'zehn', 'k', 'a'].every(k => alle.has(k)));
wahr('zwei Bilder etwa jedes dritte Mal (' + Math.round(zwei / 30) + ' %)',
  Math.abs(zwei / 3000 - HUT_ZWEI) < 0.04);

// Mit einem festen Zufall: 0,9 heisst ein Bild, 0,1 heisst zwei. Die
// Bilder stehen in der Reihenfolge der Tafel zur Wahl: Koenig, Jagdhund,
// A, K, 10, J, Q.
ist('ein Bild — das erste der Tafel', hutWahl(feld1, S, folge(0.9, 0)), ['koenig']);
ist('ein Bild — das letzte', hutWahl(feld1, S, folge(0.9, 0.99)), ['q']);
ist('zwei Bilder, das zweite aus dem Rest', hutWahl(feld1, S, folge(0.1, 0, 0)), ['koenig', 'hund']);
// Die Wahl haengt nicht an den Auszahlungen — sonst stimmte die
// gemessene Tafel nicht mehr, sobald die Spielleitung eine Zahl aendert.
const anders = wSymboleAus(S, [{k:'koenig', zahlt:{3:1, 4:1, 5:1}}, {k:'q', zahlt:{3:99, 4:99, 5:999}}]);
ist('eine andere Tafel zieht dasselbe', hutWahl(feld1, anders, folge(0.1, 0.5, 0.5)),
  hutWahl(feld1, S, folge(0.1, 0.5, 0.5)));

// ── Was er verwandelt ────────────────────────────────────────────
const verzaubert = hutZaubern(F('K.H.K' + 'K....' + '..E..'), ['koenig']);
ist('jeder Koenig auf dem Feld wird zum Gaukler',
  [verzaubert[0], verzaubert[4], verzaubert[5]], ['gaukler', 'gaukler', 'gaukler']);
ist('  … der Hut bleibt ein Hut', verzaubert[2], 'hut');
ist('  … und der Jagdhund ein Jagdhund', verzaubert[12], 'hund');
ist('nichts gezogen, nichts verwandelt',
  hutZaubern(F('K.H..' + '.....' + '.....'), []), F('K.H..' + '.....' + '.....'));

// ── Ein Dreh ─────────────────────────────────────────────────────
// Koenige auf Walze 1, 2, 4, 5 in der Mitte, der Hut auf Walze 3 oben.
// Ohne Hut waeren das zwei Koenige und dann eine Luecke.
const ohne = hutDreh(F('.....' + 'KK.KK' + '.....'), S, EIN, Math.random);
ist('ohne Hut: nichts', [ohne.gewinn, ohne.hut, ohne.gezogen, ohne.verwandelt], [0, -1, [], []]);
// Mit dem Hut in der Mitte ersetzt er den fehlenden Koenig.
const mitte = hutDreh(F('.....' + 'KKHKK' + '.....'), S, EIN, folge(0.9, 0.99));
ist('der Hut ist selbst Wild: fuenf Koenige',
  mitte.treffer.find(t => t.nr === 0) && [mitte.treffer.find(t => t.nr === 0).sym.k, mitte.treffer.find(t => t.nr === 0).laenge],
  ['koenig', 5]);
// Zieht er die Koenige, werden sie Gaukler — und fuenf Gaukler zahlen
// das Doppelte der Koenige.
const koenige = hutDreh(F('.....' + 'KKHKK' + '.....'), S, EIN, folge(0.9, 0));
ist('er zieht die Koenige', koenige.gezogen, ['koenig']);
ist('  … vier Felder kippen um', koenige.verwandelt, [5, 6, 8, 9]);
ist('  … und die Mitte zahlt den Fuenfer des Gauklers',
  koenige.treffer.find(t => t.nr === 0).betrag, 400);
ist('  … das Feld vor dem Zauber kommt mit', koenige.roh[5], 'koenig');
// Der Gaukler zahlt selbst — drei auf einer Linie, ohne Hut.
ist('drei Gaukler zahlen selbst', hutDreh(F('.....' + 'GGG..' + '.....'), S, EIN).treffer
  .find(t => t.nr === 0).betrag, 45);
// Der Hut allein zahlt nichts: er ist der Anlass, nicht der Gewinn.
wahr('der Hut steht in keiner Zahlspalte', !wSymbol('hut', S).zahlt);
wahr('  … und ist trotzdem Wild', wSymbol('hut', S).wild);
// Ein Zauber, der ein Bild auf der letzten Walze trifft, verpufft: dort
// faengt keine Linie an.
const verpufft = hutDreh(F('....P' + '..H..' + '.....'), S, EIN, folge(0.9, 0));
ist('ein Zauber kann auch verpuffen', [verpufft.gezogen, verpufft.gewinn], [['prinzessin'], 0]);

// ── Der Takt ─────────────────────────────────────────────────────
const z1 = hutZeitplan(['koenig']), z2 = hutZeitplan(['koenig', 'hund']);
wahr('erst wackeln, dann ziehen, dann kippen', z1.wackeln < z1.bild && z1.bild < z1.wandel && z1.wandel < z1.ende);
wahr('  … und das Wackeln erst nach dem letzten Walzenhalt', z1.wackeln > 1600);
ist('zwei Bilder dauern ein Bild laenger', z2.ende - z1.ende, HUT_TAKT.bildAbstand);
wahr('  … und nie laenger als fuenf Sekunden', z2.ende < 5000);

// ── Die Rechnung ─────────────────────────────────────────────────
ist('die Haeufigkeitstafel ist auf eine Drehung normiert', HUT_HAEUFIGKEIT.drehungen, 1);
const q = wQuote(HUT_HAEUFIGKEIT, S);
wahr('die Quote liegt bei 96 % (± 1 Punkt), gerechnet ' + Math.round(q * 1000) / 10 + ' %',
  Math.abs(q - 0.96) < 0.01);
wahr('der Hut und der Gaukler stehen als Kette nur, wo sie zahlen',
  !HUT_HAEUFIGKEIT.linie.hut && !!HUT_HAEUFIGKEIT.linie.gaukler);
const kurz = hutMessen(S, HUT_BAENDER, 150000, Math.random);
const qk = wQuote(kurz, S);
wahr('eine kurze Gegenmessung bestaetigt sie grob (' + Math.round(qk * 1000) / 10 + ' %)',
  Math.abs(qk - q) < 0.08);
wahr('der Hut kommt etwa jede siebte Drehung (jede ' + (kurz.drehungen / kurz.hut).toFixed(1) + '.)',
  Math.abs(kurz.drehungen / kurz.hut - 60 / 9) < 0.4);
// Ohne den Zauber — dieselben Baender, der Hut nur Wild — faellt die
// Quote weit. Sonst waere er keiner.
const still = wMessen({symbole: S, baender: HUT_BAENDER}, 150000, Math.random);
wahr('der Zauber traegt den groessten Teil (' +
  Math.round((qk - wQuote(still, S)) * 1000) / 10 + ' Punkte)',
  qk - wQuote(still, S) > 0.5);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
