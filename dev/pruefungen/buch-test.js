// Prueft „Das Verschollene Kapitel" — die eine Regel, an der alles haengt.
const fs = require('fs');
const lade = (d, m) => { const r = fs.readFileSync(d, 'utf8'); return m ? r.split(m)[0] : r; };
const teile = [
  lade('js/src/2f7-walzen.jsx', '// ══ Ende der reinen Rechnung'),
  lade('js/src/2f8-buch.jsx', '// ── Der Tisch'),
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

const S = BUCH_SYMBOLE;
// Ein Feld aus Kuerzeln, fuenf je Reihe. Der Punkt ist Fuellung: je
// Walze ein anderes Zeichen, damit keine Kette entsteht, die niemand
// gemeint hat — ein Feld, in dem ueberall dasselbe Fuellzeichen steht,
// trifft die halbe Tafel von allein.
const KURZ = {G:'graeber', K:'krone', W:'waechter', C:'kaefer',
              F:'feuer', L:'luft', E:'erde', A:'wasser', B:'buch'};
const FUELL = ['feuer', 'luft', 'erde', 'wasser', 'kaefer'];
const F = (s) => s.split('').map((c, i) => c === '.' ? FUELL[i % 5] : KURZ[c]);
const EIN = 10;          // Gesamteinsatz; der Linieneinsatz ist 1

// ── Die Baender ──────────────────────────────────────────────────
ist('fuenf Baender', BUCH_BAENDER.length, 5);
wahr('jedes sechzig lang', BUCH_BAENDER.every(b => b.length === BUCH_BANDLAENGE));
wahr('die Anzahlen stimmen', BUCH_BAENDER.every(b => {
  const zaehl = {};
  b.forEach(k => { zaehl[k] = (zaehl[k] || 0) + 1; });
  return Object.keys(BUCH_ANZAHLEN).every(k => zaehl[k] === BUCH_ANZAHLEN[k]);
}));
wahr('jedes Zeichen der Tafel liegt auf jedem Band',
  BUCH_BAENDER.every(b => S.every(s => b.includes(s.k))));
// Ein Band, auf dem zwei Buecher nebeneinanderliegen, zeigte beide im
// selben Fenster — das soll die gleichmaessige Verteilung verhindern.
wahr('kein Zeichen liegt zweimal hintereinander, das seltener als zehnmal vorkommt',
  BUCH_BAENDER.every(b => b.every((k, i) =>
    BUCH_ANZAHLEN[k] >= 10 || b[(i + 1) % b.length] !== k)));
wahr('die fuenf Baender sind nicht dasselbe Band',
  new Set(BUCH_BAENDER.map(b => b.join(','))).size === 5);

// ── Grundspiel ───────────────────────────────────────────────────
const grund = (s) => buchDreh(F(s), S, EIN, null);
// Drei Erde in der oberen Reihe treffen zwei Linien auf einmal: „Oben"
// und „Wanne oben", die auf Walze 3 durch die Mitte geht — und dort
// steht die Fuellung ebenfalls auf Erde. Genau dafuer gibt es zehn
// Linien, und genau das soll ein Dreh auch zweimal zahlen.
const dreiErde = grund('EEE..' + '.....' + '.....');
ist('drei Erde oben treffen zwei Linien', dreiErde.treffer.length, 2);
ist('  … und zahlen zusammen vier', dreiErde.gewinn, 4);
wahr('die Fuellung allein trifft nichts', grund('.....' + '.....' + '.....').gewinn === 0);
ist('das Buch ersetzt auch im Grundspiel — fuenf Kronen mit Buch in der Mitte',
  grund('.....' + 'KKBKK' + '.....').treffer[0].laenge, 5);
ist('  … und zahlt dafuer den Fuenfer', grund('.....' + 'KKBKK' + '.....').treffer[0].betrag, 800);
ist('zwei Buecher zahlen die Haelfte des Einsatzes',
  grund('B....' + '...B.' + '.....').streu[0].betrag, 5);

// ── Das Kapitel ──────────────────────────────────────────────────
// Der Kern: das Sonderzeichen zahlt, ohne nebeneinander zu liegen.
const frei = (s, sonder) => buchDreh(F(s), S, EIN, sonder);

const weit = frei('K.K.K' + '.....' + '.....', 'krone');
ist('Kronen auf 1, 3 und 5 dehnen sich aus', weit.walzen, [0, 2, 4]);
ist('  … und zahlen den Dreier ueber alle zehn Linien',
  weit.ausdehnung.betrag, 40 * 10);
wahr('  … obwohl auf Walze 2 und 4 keine liegt',
  F('K.K.K' + '.....' + '.....')[1] !== 'krone');
ist('  … und die Walzen sind wirklich gefuellt',
  weit.feld.filter(k => k === 'krone').length, 9);

const zwei = frei('K.K..' + '.....' + '.....', 'krone');
ist('zwei Kronen dehnen sich nicht aus', zwei.walzen, []);
wahr('  … und die Ausdehnung entfaellt', zwei.ausdehnung === null);

const vier = frei('K.K.K' + '...K.' + '.....', 'krone');
ist('vier Walzen zahlen den Vierer', vier.ausdehnung.betrag, 300 * 10);

// Doppelt zaehlen waere der naheliegende Fehler: einmal als Kette,
// einmal als gefuellte Walze.
const dreiAnDrei = frei('KKK..' + '.....' + '.....', 'krone');
ist('drei nebeneinander zahlen genau einmal', dreiAnDrei.gewinn, 40 * 10);

// Das Buch als Sonderzeichen: es fuellt und ersetzt zugleich.
const buchZwei = frei('B...B' + '.....' + '.....', 'buch');
ist('zwei Buecher dehnen sich nicht aus', buchZwei.walzen, []);
const buchDrei = frei('B.B.B' + '.....' + '.....', 'buch');
ist('drei Buecher dehnen sich aus', buchDrei.walzen, [0, 2, 4]);
wahr('  … und die gefuellten Walzen ersetzen alles',
  buchDrei.treffer.length > 0);
ist('  … die Buecher zaehlen dabei auf dem gezogenen Feld, nicht auf dem gefuellten',
  buchDrei.streu[0].anzahl, 3);

// ── Ausloeser und Nachladen ──────────────────────────────────────
ist('drei Buecher irgendwo', buchZahl(F('B....' + '.B...' + '....B'), S), 3);
ist('zwei sind zu wenig', buchZahl(F('B....' + '.B...' + '.....'), S), 2);
wahr('drei loesen aus', buchZahl(F('B.B.B' + '.....' + '.....'), S) >= BUCH_AUSLOESER);
ist('das Buch ist nicht an Walzen gebunden — fuenfzehn zaehlen als fuenfzehn',
  buchZahl(F('BBBBB' + 'BBBBB' + 'BBBBB'), S), 15);

// ── Die Rechnung ─────────────────────────────────────────────────
ist('die Haeufigkeitstafel ist auf eine Drehung normiert', BUCH_HAEUFIGKEIT.drehungen, 1);
const q = wQuote(BUCH_HAEUFIGKEIT, S);
wahr('die Quote liegt bei 95 % (± 1 Punkt), gerechnet ' + Math.round(q * 1000) / 10 + ' %',
  Math.abs(q - 0.95) < 0.01);
wahr('jedes Zeichen der Tafel taucht in der Haeufigkeit auf',
  S.filter(s => s.zahlt).every(s => BUCH_HAEUFIGKEIT.linie[s.k]));
// Die Linearitaet ist der ganze Grund, warum die Tafel gemessen und
// nicht gerechnet wird. Also muss sie geprueft sein.
const doppelt = S.map(s => ({...s,
  zahlt: s.zahlt && Object.fromEntries(Object.keys(s.zahlt).map(n => [n, s.zahlt[n] * 2])),
  streu: s.streu && Object.fromEntries(Object.keys(s.streu).map(n => [n, s.streu[n] * 2]))}));
wahr('doppelte Tafel, doppelte Quote',
  Math.abs(wQuote(BUCH_HAEUFIGKEIT, doppelt) - 2 * q) < 1e-9);

// Und die gemessene Tafel muss zu den Baendern passen: eine kurze
// Gegenmessung darf nicht weit daneben liegen.
const kurz = buchMessen(S, BUCH_BAENDER, 120000, Math.random);
const qk = wQuote(kurz, S);
wahr('eine kurze Gegenmessung bestaetigt sie grob (' + Math.round(qk * 1000) / 10 + ' %)',
  Math.abs(qk - q) < 0.15);

// ── Einstellungen ────────────────────────────────────────────────
const halb = wSymboleAus(S, [{k:'graeber', zahlt:{2:1, 3:20, 4:200, 5:1000}}]);
ist('die Spielleitung darf die Zahlen setzen', halb[0].zahlt, {2:1, 3:20, 4:200, 5:1000});
wahr('und die Quote folgt sofort', wQuote(BUCH_HAEUFIGKEIT, halb) < q);
ist('die Reihenfolge bleibt', halb.map(s => s.k), S.map(s => s.k));

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
