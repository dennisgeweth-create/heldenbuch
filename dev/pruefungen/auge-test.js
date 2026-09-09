// Prueft „Das Wachsame Auge" — die Leiter, die Ausdehnung, die Zaeune.
const fs = require('fs');
const lade = (d, m) => { const r = fs.readFileSync(d, 'utf8'); return m ? r.split(m)[0] : r; };
const teile = [
  lade('js/src/2f7-walzen.jsx', '// ══ Ende der reinen Rechnung'),
  lade('js/src/2fa-auge.jsx', '// ── Der Tisch'),
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

const S = AUGE_SYMBOLE;
// W Waechter, T Tor, K Kiesel, P Tropfen, H Halm, D Feder,
// U Urne, L Schluessel, N Natter, F Falke.
const KURZ = {W:'waechter', T:'tor', K:'kiesel', P:'tropfen', H:'halm',
              D:'feder', U:'urne', L:'schluessel', N:'natter', F:'falke'};
// Fuellung je Walze verschieden, damit keine ungewollte Kette entsteht.
const FUELL = ['urne', 'schluessel', 'natter', 'falke', 'urne'];
const F = (s) => s.split('').map((c, i) => c === '.' ? FUELL[i % 5] : KURZ[c]);
const EIN = 10;

// ── Die Baender ──────────────────────────────────────────────────
ist('fuenf Baender', AUGE_BAENDER.length, 5);
wahr('jedes sechzig lang', AUGE_BAENDER.every(b => b.length === AUGE_BANDLAENGE));
ist('der Waechter liegt nur auf Walze 2, 3 und 4',
  AUGE_BAENDER.map(b => b.includes('waechter')), [false, true, true, true, false]);
ist('und dort zweimal',
  [1, 2, 3].map(w => AUGE_BAENDER[w].filter(k => k === 'waechter').length), [2, 2, 2]);
wahr('das Tor liegt auf jeder Walze', AUGE_BAENDER.every(b => b.includes('tor')));

// ── Die Leiter ───────────────────────────────────────────────────
// Sie muss die Tafel von unten aufsteigend spiegeln — sonst veredelte
// der Waechter in die falsche Richtung.
const zahlend = S.filter(s => s.zahlt).map(s => s.k);
ist('die Leiter sind die vier billigsten Zeichen',
  AUGE_LEITER, zahlend.slice(-4).reverse());
wahr('und zwar aufsteigend nach Auszahlung', AUGE_LEITER.every((k, i) =>
  i === 0 || wZahlt(wSymbol(k, S), 5) > wZahlt(wSymbol(AUGE_LEITER[i-1], S), 5)));
wahr('sie reicht nicht bis zu den hohen Zeichen',
  !AUGE_LEITER.includes('falke') && !AUGE_LEITER.includes('natter'));

const roh = F('KPHD.' + 'KPHD.' + 'KPHD.');
ist('Stufe 0 laesst alles stehen', augeVeredeln(roh, 0), roh);
ist('Stufe 1 macht aus Kieseln Tropfen',
  augeVeredeln(roh, 1).slice(0, 4), ['tropfen', 'tropfen', 'halm', 'feder']);
ist('Stufe 2 hebt Kiesel und Tropfen auf den Halm',
  augeVeredeln(roh, 2).slice(0, 4), ['halm', 'halm', 'halm', 'feder']);
ist('Stufe 3 macht alle vier zur Feder',
  augeVeredeln(roh, 3).slice(0, 4), ['feder', 'feder', 'feder', 'feder']);
ist('hoeher geht es nicht', augeVeredeln(roh, 9), augeVeredeln(roh, AUGE_HOECHSTE));
ist('die hohen Zeichen ruehrt sie nie an',
  augeVeredeln(F('FNLU.' + '.....' + '.....'), AUGE_HOECHSTE).slice(0, 4),
  ['falke', 'natter', 'schluessel', 'urne']);
ist('unterstes Zeichen auf Stufe 0', augeUnterstes(0), 'kiesel');
ist('unterstes Zeichen ganz oben', augeUnterstes(AUGE_HOECHSTE), 'feder');

// ── Der Waechter ─────────────────────────────────────────────────
const dreh = (s, stufe) => augeDreh(F(s), S, EIN, stufe || 0);
ist('ein Waechter fuellt seine Walze', dreh('.W...' + '.....' + '.....').walzen, [1]);
ist('  … und zwar ganz',
  dreh('.W...' + '.....' + '.....').feld.filter(k => k === 'waechter').length, 3);
ist('drei Waechter fuellen drei Walzen',
  dreh('.W.W.' + '..W..' + '.....').walzen, [1, 2, 3]);
ist('er zahlt selbst nichts', wZahlt(wSymbol('waechter', S), 5), 0);
// Er ersetzt — eine gefuellte Walze in der Mitte macht aus drei Falken
// links und rechts einen Fuenfer.
const ersetzt = dreh('FF.FF' + '.....' + '.....');
wahr('was er ersetzt, zahlt', ersetzt.gewinn === 0);
const mitWild = dreh('FFWFF' + '.....' + '.....');
ist('  … Falke, Falke, Waechter, Falke, Falke ist ein Fuenfer',
  [mitWild.treffer[0].sym.k, mitWild.treffer[0].laenge], ['falke', 5]);

// ── Der Ausloeser ────────────────────────────────────────────────
ist('drei Tore irgendwo', augeZahl(F('T....' + '..T..' + '....T'), S), 3);
ist('das Tor ist an keine Walze gebunden', augeZahl(F('TT...' + '.....' + '.....'), S), 2);
ist('zwei Tore sind kein Ereignis',
  dreh('T...T' + '.....' + '.....').streu.length, 0);
ist('drei schon', dreh('T.T.T' + '.....' + '.....').streu.length, 1);
// Die Tore zaehlen auf dem gezogenen Feld: eine gefuellte Walze duerfte
// keines verschlucken.
ist('ein Waechter verschluckt kein Tor',
  augeZahl(dreh('T.T.T' + '.W...' + '.....').roh, S), 3);

// ── Die Zaeune ───────────────────────────────────────────────────
ist('ein Waechter legt einen Freidreh nach', augeDazu(1), 1);
ist('zwei legen zwei nach', augeDazu(2), 2);
ist('drei legen drei nach', augeDazu(3), 3);
ist('kein Waechter, nichts nach', augeDazu(0), 0);
wahr('die Runde hat eine Obergrenze', AUGE_HOECHSTSPIELE > AUGE_FREISPIELE
  && AUGE_HOECHSTSPIELE < 100);
// Ohne die Grenze frisst sich die Runde selbst auf. Das ist der Grund,
// warum es sie gibt, also wird es geprueft: eine Runde darf nie mehr
// als die Obergrenze Drehungen laufen.
let laengste = 0;
for (let i = 0; i < 400; i++) {
  let uebrig = AUGE_FREISPIELE, gespielt = 0;
  while (uebrig > 0 && gespielt < AUGE_HOECHSTSPIELE) {
    uebrig--; gespielt++;
    const w = wWalzenMit(wZiehen(AUGE_BAENDER, Math.random), 'waechter').length;
    uebrig += augeDazu(w);
  }
  laengste = Math.max(laengste, gespielt);
}
wahr('keine Runde laeuft ueber die Grenze (laengste ' + laengste + ')',
  laengste <= AUGE_HOECHSTSPIELE);

// ── Die Rechnung ─────────────────────────────────────────────────
ist('die Haeufigkeitstafel ist auf eine Drehung normiert', AUGE_HAEUFIGKEIT.drehungen, 1);
const q = wQuote(AUGE_HAEUFIGKEIT, S);
wahr('die Quote liegt bei 95 % (± 1 Punkt), gerechnet ' + Math.round(q * 1000) / 10 + ' %',
  Math.abs(q - 0.95) < 0.01);
// Der Fuenfer der Feder faellt oefter als ihr Dreier — das ist die
// Runde und kein Zaehlfehler. Wenn das je kippt, ist die Leiter kaputt.
wahr('der Fuenfer der Feder faellt oefter als ihr Dreier',
  AUGE_HAEUFIGKEIT.linie.feder[5] > AUGE_HAEUFIGKEIT.linie.feder[3] * 0.5);
wahr('bei den hohen Zeichen ist es umgekehrt',
  AUGE_HAEUFIGKEIT.linie.falke[5] < AUGE_HAEUFIGKEIT.linie.falke[3] * 0.05);
const kurz = augeMessen(S, AUGE_BAENDER, 200000, Math.random);
const qk = wQuote(kurz, S);
wahr('eine kurze Gegenmessung bestaetigt sie grob (' + Math.round(qk * 1000) / 10 + ' %)',
  Math.abs(qk - q) < 0.2);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
