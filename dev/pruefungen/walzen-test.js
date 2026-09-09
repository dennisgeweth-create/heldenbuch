// Prueft den reinen Rechenteil von 2f7-walzen.jsx. Alles bis zur Marke
// laeuft ohne React und ohne Browser, also direkt mit node.
const fs = require('fs');
const quelle = fs.readFileSync('js/src/2f7-walzen.jsx', 'utf8');
const rein = quelle.split('// ══ Ende der reinen Rechnung')[0];
// const in einem eval bleibt im eval. Also die Namen einsammeln und am
// Ende desselben eval nach aussen reichen.
const namen = [...rein.matchAll(/^const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1]);
eval(rein + ';globalThis.M = {' + namen.join(', ') + '};');
Object.assign(globalThis, M);

let gut = 0, schlecht = 0;
const ist = (name, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + name + '\n     ist  ' + A + '\n     soll ' + B);
};
const wahr = (name, a) => ist(name, !!a, true);

// ── Ein Spielzeug-Automat, an dem sich alles zeigen laesst ───────
// A ist das hoechste Zeichen, B das mittlere, C das niedrige.
// * ist wild und zahlt selbst, S ist verstreut und zahlt nichts,
// T ist verstreut, zahlt, und ist zugleich wild (wie das Buch).
const SYM = [
  {k:'A', z:'🅰', name:'A', zahlt:{3:100, 4:500, 5:2000}},
  {k:'B', z:'🅱', name:'B', zahlt:{3:20, 4:80, 5:300}},
  {k:'C', z:'©',  name:'C', zahlt:{3:5, 4:15, 5:50}},
  {k:'*', z:'⭐', name:'Stern', wild:true, zahlt:{3:50, 4:200, 5:1000}},
  {k:'S', z:'🐂', name:'Stier', streu:{3:0}, streuWalzen:[0,2,4]},
  {k:'T', z:'📜', name:'Buch', wild:true, streu:{2:1, 3:2, 4:20, 5:200}},
];
// Ein Feld aus einer Zeichenkette: 15 Zeichen, zeilenweise.
const F = (s) => s.split('');

// ── Aufbau ───────────────────────────────────────────────────────
ist('fuenfzehn Felder', W_FELDER, 15);
ist('zehn Linien', W_LINIEN.length, 10);
wahr('jede Linie fuenf Felder', W_LINIEN.every(l => l.felder.length === 5));
wahr('jedes Linienfeld im Bereich', W_LINIEN.every(l => l.felder.every(f => f >= 0 && f < 15)));
wahr('keine Linie doppelt', new Set(W_LINIEN.map(l => l.felder.join(','))).size === 10);
// Eine Linie darf je Schritt hoechstens eine Reihe springen — sonst
// waere sie keine Linie, sondern ein Sprung ueber das halbe Feld.
wahr('Linien laufen zusammenhaengend', W_LINIEN.every(l => {
  for (let i = 1; i < 5; i++) {
    const a = Math.floor(l.felder[i-1] / 5), b = Math.floor(l.felder[i] / 5);
    if (Math.abs(a - b) > 1) return false;
    if (l.felder[i] % 5 !== i) return false;      // je Schritt eine Walze weiter
  }
  return l.felder[0] % 5 === 0;
}));
ist('Linieneinsatz ist ein Zehntel', wLinieneinsatz(50), 5);

// ── Linienwertung ────────────────────────────────────────────────
const mitte = W_LINIEN[0];
const linie = (s) => wLinieWerten(F(s), mitte, SYM, 1);

ist('drei A in der Mitte',
  (() => { const t = linie('.....AAACC.....'); return [t.sym.k, t.laenge, t.betrag]; })(),
  ['A', 3, 100]);
ist('fuenf A',           (() => { const t = linie('.....AAAAA.....'); return [t.sym.k, t.laenge, t.betrag]; })(), ['A', 5, 2000]);
wahr('zwei A zahlen nicht', linie('.....AABBB.....') === null);
wahr('zwei A ohne Treffer', linie('.....AABCC.....') === null);
// Vier A ab Walze 2 sind kein Treffer: die Kette muss auf Walze 1
// beginnen, und ein einzelnes C davor traegt sie nicht.
wahr('Kette muss auf Walze 1 beginnen', linie('.....CAAAA.....') === null);
wahr('auch mit B davor nicht', linie('.....BAAAA.....') === null);
ist('drei A ab Walze 1 dagegen schon', linie('.....AAABB.....').laenge, 3);

// Das Wild ersetzt — und die Wertung nimmt, was mehr bringt.
ist('Wild ersetzt A',
  (() => { const t = linie('.....A*AAA.....'); return [t.sym.k, t.laenge, t.betrag]; })(),
  ['A', 5, 2000]);
ist('drei Wilds zahlen als A, nicht als Stern',
  (() => { const t = linie('.....***CC.....'); return [t.sym.k, t.laenge, t.betrag]; })(),
  ['A', 3, 100]);
ist('vier Wilds und ein C: A-Vierer schlaegt C-Fuenfer',
  (() => { const t = linie('.....****C.....'); return [t.sym.k, t.laenge, t.betrag]; })(),
  ['A', 4, 500]);
ist('drei Sterne und zwei B: A-Dreier (100) schlaegt B-Fuenfer (300)? nein',
  (() => { const t = linie('.....***BB.....'); return [t.sym.k, t.laenge, t.betrag]; })(),
  ['B', 5, 300]);
ist('Streuzeichen unterbricht die Kette',
  (() => { const t = linie('.....AASAA.....'); return t; })(), null);
ist('das Buch ist wild und ersetzt auch',
  (() => { const t = linie('.....AATAA.....'); return [t.sym.k, t.laenge, t.betrag]; })(),
  ['A', 5, 2000]);
wahr('ein Streuzeichen zahlt nie auf einer Linie',
  SYM.filter(s => s.streu && !s.zahlt).every(s => linie('.....' + s.k.repeat(5) + '.....') === null
    || linie('.....' + s.k.repeat(5) + '.....').sym.k !== s.k));

// ── Streuzeichen ─────────────────────────────────────────────────
const stier = SYM.find(s => s.k === 'S');
const buch  = SYM.find(s => s.k === 'T');
ist('Buch dreimal, egal wo', wStreuWerten(F('T....' + '..T..' + '....T'), buch, 100).anzahl, 3);
ist('Buch zahlt ueber den Gesamteinsatz', wStreuWerten(F('T....' + '..T..' + '....T'), buch, 100).betrag, 200);
ist('zwei Buecher zahlen einfach', wStreuWerten(F('T...T' + '.....' + '.....'), buch, 100).betrag, 100);
ist('Stier nur auf 1, 3, 5', wStreuWerten(F('S.S.S' + '.....' + '.....'), stier, 0).anzahl, 3);
ist('Stier auf 2 und 4 zaehlt nicht', wStreuWerten(F('.S.S.' + '.....' + '.....'), stier, 0).anzahl, 0);
ist('Stier je Walze nur einmal', wStreuWerten(F('S.S.S' + 'S.S.S' + 'S.S.S'), stier, 0).anzahl, 3);
ist('Stier auf Walze 1 und 3 sind zwei', wStreuWerten(F('S.S..' + '.....' + '.....'), stier, 0).anzahl, 2);

// ── Ein ganzer Dreh ──────────────────────────────────────────────
// Oben drei A (Linie „Oben"), Mitte drei C, dazu drei Buecher.
const e = wWerten(F('AAABB' + 'CCCBB' + 'BBBBB'), SYM, 10);
wahr('mehrere Linien treffen zugleich', e.treffer.length >= 2);
wahr('Gewinn ist die Summe', Math.abs(e.gewinn - e.treffer.reduce((s,t)=>s+t.betrag,0)) < 1e-9);
ist('drei B unten zahlen', e.treffer.some(t => t.sym.k === 'B' && t.laenge === 5), true);

const e2 = wWerten(F('T.T.T' + '.....' + '.....'), SYM, 10);
ist('Streugewinn steht getrennt', e2.streu.length, 1);
ist('drei Buecher zahlen zweifach den Einsatz', e2.streu[0].betrag, 20);

// ── Baender ──────────────────────────────────────────────────────
// Ein fester Zufall macht die Ziehung nachpruefbar.
const festerZufall = (folge) => { let i = 0; return () => folge[i++ % folge.length]; };
const baender = [
  ['A','B','C','A','B'],
  ['B','C','A','B','C'],
  ['C','A','B','C','A'],
  ['A','A','B','B','C'],
  ['*','C','C','B','A'],
];
const f0 = wZiehen(baender, festerZufall([0, 0, 0, 0, 0]));
ist('Stelle 0 zeigt die ersten drei', [f0[0], f0[5], f0[10]], ['A','B','C']);
const fEnd = wZiehen(baender, festerZufall([0.99, 0.99, 0.99, 0.99, 0.99]));
ist('das Band laeuft um', [fEnd[0], fEnd[5], fEnd[10]], ['B','A','B']);
wahr('immer fuenfzehn Zeichen', wZiehen(baender, Math.random).length === 15);
wahr('nur Zeichen aus den Baendern', (() => {
  for (let i = 0; i < 200; i++) {
    const f = wZiehen(baender, Math.random);
    for (let w = 0; w < 5; w++) {
      for (let z = 0; z < 3; z++) if (!baender[w].includes(f[z * 5 + w])) return false;
    }
  }
  return true;
})());
wahr('ein Zeichen, das auf keinem Band liegt, faellt nie', (() => {
  for (let i = 0; i < 500; i++) if (wZiehen(baender, Math.random).includes('S')) return false;
  return true;
})());

// ── Walzenhilfen ─────────────────────────────────────────────────
ist('Walzen mit A', wWalzenMit(F('A...A' + '..A..' + '.....'), 'A'), [0, 2, 4]);
ist('Walze fuellen', wWalzeFuellen(F('..A..' + '.....' + '.....'), 2, 'A').filter(x => x === 'A').length, 3);

// ── Die Rechnung ─────────────────────────────────────────────────
// Ein Band, das nur A traegt, trifft jede der zehn Linien mit fuenf A.
const nurA = [['A'],['A'],['A'],['A'],['A']];
const zA = wMessen({symbole: SYM, baender: nurA}, 100, Math.random);
ist('immer zehn Fuenfer', zA.linie['A'][5], 1000);
// Zehn Linien mal 2000 mal ein Zehntel Einsatz = 2000-facher Einsatz.
ist('Quote eines Automaten, der immer alles trifft', wQuote(zA, SYM), 2000);

// Die Quote ist in den Auszahlungen linear — genau darauf beruht das
// Einregeln, also muss es geprueft sein.
const halb = SYM.map(s => ({...s,
  zahlt: s.zahlt && Object.fromEntries(Object.keys(s.zahlt).map(n => [n, s.zahlt[n] / 2])),
  streu: s.streu && Object.fromEntries(Object.keys(s.streu).map(n => [n, s.streu[n] / 2]))}));
ist('halbe Tafel, halbe Quote', wQuote(zA, halb), 1000);

const gemischt = [['A','B','C'],['A','B','C'],['A','B','C'],['A','B','C'],['A','B','C']];
const zG = wMessen({symbole: SYM, baender: gemischt}, 4000, Math.random);
const q = wQuote(zG, SYM);
wahr('gemischter Automat hat eine Quote ueber null', q > 0);
const geregelt = wEinregeln(SYM, zG, 0.96);
const qNeu = wQuote(zG, geregelt);
wahr('eingeregelt auf 96 % (± 1 Punkt), erreicht ' + (Math.round(qNeu*1000)/10) + ' %',
  Math.abs(qNeu - 0.96) < 0.01);
wahr('Einregeln laesst die Reihenfolge stehen',
  geregelt.map(s => s.k).join('') === SYM.map(s => s.k).join(''));

// Die Freispielrunde zaehlt mit, ohne dass das Geruest sie kennt.
let gerufen = 0;
wMessen({symbole: SYM, baender: gemischt, freiLauf: (feld, z) => {
  gerufen++;
  wZaehlen(z, F('AAAAA' + '.....' + '.....'), SYM, 1);
}}, 50, Math.random);
ist('die Runde wird bei jedem Dreh angeboten', gerufen, 50);

// ── Einstellungen der Spielleitung ───────────────────────────────
const eigen = wSymboleAus(SYM, [{k:'A', zahlt:{3:1, 4:2, 5:3}}]);
ist('eigene Zahlen werden uebernommen', eigen[0].zahlt, {3:1, 4:2, 5:3});
ist('der Rest bleibt Standard', eigen[1].zahlt, SYM[1].zahlt);
ist('Name und Zeichen bleiben', [eigen[0].name, eigen[0].z], ['A', '🅰']);
ist('eine leere Tafel wird abgelehnt',
  wSymboleAus(SYM, SYM.map(s => ({k: s.k, zahlt: {3:0, 4:0, 5:0}, streu: {2:0,3:0,4:0,5:0}}))), SYM);
ist('nichts eingetragen heisst Standard', wSymboleAus(SYM, null), SYM);

// ── Runden ───────────────────────────────────────────────────────
ist('fein bei kleinen Zahlen', wRunden(3.456), 3.46);
ist('grober in der Mitte', wRunden(34.56), 34.6);
ist('glatt bei grossen', wRunden(345.6), 346);
ist('nie ganz auf null', wRunden(0.001), 0.05);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
