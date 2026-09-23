// Prueft „Klinge und Hoerner" — die klebenden Klingen und der Ausloeser,
// der nur auf Walze 1, 3 und 5 zaehlt.
const fs = require('fs');
const lade = (d, m) => { const r = fs.readFileSync(d, 'utf8'); return m ? r.split(m)[0] : r; };
const teile = [
  lade('js/src/2f7-walzen.jsx', '// ══ Ende der reinen Rechnung'),
  lade('js/src/2f9-arena.jsx', '// ── Der Tisch'),
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

const S = ARENA_SYMBOLE;
// K Torero (klinge), F Senorita, R Rose, T Gitarre, S Hut, H Stier (hoerner).
// Der Punkt ist Fuellung: je Walze ein anderes Zeichen, damit keine
// Kette entsteht, die niemand gemeint hat.
const KURZ = {K:'klinge', F:'senorita', R:'rose', T:'gitarre', S:'hut',
              A:'a', X:'k', Q:'q', J:'j', Z:'zehn', H:'hoerner'};
const FUELL = ['a', 'k', 'q', 'j', 'gitarre'];
const F = (s) => s.split('').map((c, i) => c === '.' ? FUELL[i % 5] : KURZ[c]);
const EIN = 10;      // Gesamteinsatz; der Linieneinsatz ist 1

// ── Die Baender ──────────────────────────────────────────────────
ist('fuenf Baender', ARENA_BAENDER.length, 5);
wahr('jedes sechzig lang', ARENA_BAENDER.every(b => b.length === ARENA_BANDLAENGE));
ist('die Hoerner liegen nur auf Walze 1, 3 und 5',
  ARENA_BAENDER.map(b => b.includes('hoerner')), [true, false, true, false, true]);
ist('und dort viermal',
  [0, 2, 4].map(w => ARENA_BAENDER[w].filter(k => k === 'hoerner').length), [4, 4, 4]);
wahr('jedes Zeichen hat sein Bild, und das liegt da',
  S.every(s => s.bild && fs.existsSync(s.bild)));
wahr('die Klinge liegt auf jeder Walze',
  ARENA_BAENDER.every(b => b.filter(k => k === 'klinge').length === 3));
wahr('zwei Hoerner liegen nie nebeneinander',
  ARENA_BAENDER.every(b => b.every((k, i) => k !== 'hoerner' || b[(i+1) % b.length] !== 'hoerner')));

// ── Der Ausloeser ────────────────────────────────────────────────
ist('drei Hoerner auf 1, 3 und 5', arenaZahl(F('H.H.H' + '.....' + '.....'), S), 3);
ist('auf Walze 2 und 4 zaehlen sie nicht', arenaZahl(F('.H.H.' + '.....' + '.....'), S), 0);
ist('je Walze zaehlt eines, nicht drei',
  arenaZahl(F('H.H.H' + 'H.H.H' + 'H.H.H'), S), 3);
ist('zwei sind zu wenig', arenaZahl(F('H.H..' + '.....' + '.....'), S), 2);
wahr('drei loesen aus', arenaZahl(F('H.H.H' + '.....' + '.....'), S) >= ARENA_AUSLOESER);
// Ein einzelnes Horn wird gar nicht erst vermerkt — es zahlt nichts und
// oeffnet nichts, und wuerde sonst aufleuchten, als waere etwas passiert.
ist('ein einzelnes Horn ist kein Ereignis',
  arenaDreh(F('H....' + '.....' + '.....'), S, EIN, null).streu.length, 0);
ist('zwei auch nicht',
  arenaDreh(F('H.H..' + '.....' + '.....'), S, EIN, null).streu.length, 0);
const dreiHoerner = arenaDreh(F('H.H.H' + '.....' + '.....'), S, EIN, null);
ist('drei schon', dreiHoerner.streu.length, 1);
ist('  … und zahlen dabei selbst nichts', dreiHoerner.streu[0].betrag, 0);

// ── Das Wild ─────────────────────────────────────────────────────
const dreh = (s, klebt) => arenaDreh(F(s), S, EIN, klebt);
ist('drei Klingen zahlen selbst',
  dreh('.....' + 'KKK..' + '.....').treffer.find(t => t.nr === 0).sym.k, 'klinge');
ist('  … den Dreier', dreh('.....' + 'KKK..' + '.....').treffer.find(t => t.nr === 0).betrag, 47);
// Der Torero vertritt, was mehr bringt: zwei Toreros und drei
// Senoritas zahlen als Senorita (Fuenfer 235), nicht als Torero
// (Zweier: nichts).
ist('zwei Klingen und drei Fechterinnen zahlen als Fechterin',
  dreh('.....' + 'KKFFF' + '.....').treffer.find(t => t.nr === 0).sym.k, 'senorita');
ist('  … den Fuenfer',
  dreh('.....' + 'KKFFF' + '.....').treffer.find(t => t.nr === 0).betrag, 235);
// Und auch vier Toreros mit einer Senorita dahinter zahlen als
// Senorita: fuenf davon (235) bringen mehr als vier Toreros (140). Wer
// hier das erste Feld befragte statt zu rechnen, zahlte zu wenig.
ist('vier Klingen und eine Fechterin zahlen als Fechterin',
  dreh('.....' + 'KKKKF' + '.....').treffer.find(t => t.nr === 0).sym.k, 'senorita');
ist('  … naemlich 235 statt der 140 des Toreros',
  dreh('.....' + 'KKKKF' + '.....').treffer.find(t => t.nr === 0).betrag, 235);
// Erst wenn nichts Besseres dahintersteht, zahlt die Klinge selbst.
ist('fuenf Klingen zahlen als Klinge',
  dreh('.....' + 'KKKKK' + '.....').treffer.find(t => t.nr === 0).sym.k, 'klinge');
ist('  … den Fuenfer der Klinge',
  dreh('.....' + 'KKKKK' + '.....').treffer.find(t => t.nr === 0).betrag, 470);
// Steht es unentschieden, gewinnt die laengere Kette: drei Toreros
// zahlen 47, drei Toreros plus eine Rose als Rose-Vierer ebenfalls 47 —
// gezeigt wird der Vierer, denn er beschreibt, was dasteht.
const gleich = dreh('.....' + 'KKKR.' + '.....').treffer.find(t => t.nr === 0);
ist('bei gleichem Betrag gewinnt die laengere Kette',
  [gleich.sym.k, gleich.laenge, gleich.betrag], ['rose', 4, 47]);
// Die Hoerner ersetzt sie nicht.
wahr('die Klinge ersetzt die Hoerner nicht',
  arenaZahl(F('K.H.H' + '.....' + '.....'), S) === 2);

// ── Die klebenden Klingen ────────────────────────────────────────
ist('nichts klebt, nichts aendert sich',
  arenaKleben(F('.....' + '.....' + '.....'), []), F('.....' + '.....' + '.....'));
const geklebt = arenaKleben(F('.....' + '.....' + '.....'), [0, 7]);
ist('geklebte Felder werden zur Klinge', [geklebt[0], geklebt[7]], ['klinge', 'klinge']);
ist('  … und sonst bleibt alles', geklebt[1], FUELL[1]);
ist('die Klingen eines Feldes', arenaKlingen(F('K...K' + '..K..' + '.....')), [0, 4, 7]);

// Eine gerade gefallene Klinge zaehlt schon in diesem Dreh mit …
const neu = dreh('.....' + 'K....' + '.....', []);
ist('  … und steht danach in der Liste', neu.klebt, [5]);
// … und im naechsten kommt sie zurueck, auch wenn nichts faellt.
const spaeter = dreh('.....' + '.....' + '.....', [5]);
ist('was klebt, liegt im naechsten Dreh wieder da', spaeter.feld[5], 'klinge');
ist('  … und bleibt in der Liste', spaeter.klebt, [5]);

// Zwei Runden hintereinander: die Klingen sammeln sich.
let klebt = [];
klebt = dreh('.....' + 'K....' + '.....', klebt).klebt;
klebt = dreh('.....' + '..K..' + '.....', klebt).klebt;
klebt = dreh('.....' + '....K' + '.....', klebt).klebt;
ist('drei Freidrehe, drei Klingen im Sand', klebt, [5, 7, 9]);
// Und die zahlen dann zusammen.
const dritter = dreh('.....' + '.K.K.' + '.....', [5, 7, 9]);
ist('fuenf klebende und gefallene Klingen in der Mitte',
  dritter.treffer.find(t => t.nr === 0).betrag, 470);

// ── Die Rechnung ─────────────────────────────────────────────────
ist('die Haeufigkeitstafel ist auf eine Drehung normiert', ARENA_HAEUFIGKEIT.drehungen, 1);
const q = wQuote(ARENA_HAEUFIGKEIT, S);
wahr('die Quote liegt bei 94 % (± 1 Punkt), gerechnet ' + Math.round(q * 1000) / 10 + ' %',
  Math.abs(q - 0.94) < 0.01);
wahr('die Hoerner tragen nichts zur Quote bei',
  !ARENA_HAEUFIGKEIT.linie.hoerner);
const kurz = arenaMessen(S, ARENA_BAENDER, 150000, Math.random);
const qk = wQuote(kurz, S);
wahr('eine kurze Gegenmessung bestaetigt sie grob (' + Math.round(qk * 1000) / 10 + ' %)',
  Math.abs(qk - q) < 0.12);
// Ohne die Bonusrunde faellt die Quote deutlich — sonst waere sie keine.
const ohne = wMessen({symbole: S, baender: ARENA_BAENDER}, 150000, Math.random);
wahr('die Freispielrunde traegt einen sichtbaren Teil (' +
  Math.round((qk - wQuote(ohne, S)) * 1000) / 10 + ' Punkte)',
  qk - wQuote(ohne, S) > 0.05);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
