// Prueft die Tafel des „Dreifachen Glücks" — die Fruechte, ihre Bilder
// und die Quote, die aus Haeufigkeit und Auszahlung gerechnet wird.
const fs = require('fs');
const quelle = fs.readFileSync('js/src/2f-automat.jsx', 'utf8');
const rein = quelle.split('// ── Ein Dreh')[0];
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

const S = AUTOMAT_STANDARD;
ist('acht Zeichen', S.map(s => s.k),
  ['kirsche', 'zitrone', 'orange', 'pflaume', 'glocke', 'sonne', 'diamant', 'sieben']);
wahr('jedes hat sein Bild, und das liegt da', S.every(s => s.bild && fs.existsSync(s.bild)));
wahr('  … freigestellt, als PNG', S.every(s => s.frei && /\.png$/.test(s.bild)));
ist('die vier Fruechte zaehlen fuers Vollbild', S.filter(s => s.speise).map(s => s.k),
  ['kirsche', 'zitrone', 'orange', 'pflaume']);
ist('die Sonne bringt den Freidreh, sonst keiner', S.filter(s => s.freidreh).map(s => s.k), ['sonne']);
wahr('je seltener, desto mehr', S.every((s, i) => i === 0
  || (s.gewicht <= S[i - 1].gewicht && s.zahlt >= S[i - 1].zahlt)));

const q = automatQuote(S, automatVollbildP(null));
wahr('die Quote liegt bei 89,5 % (± ein halber Punkt), gerechnet ' + (q * 100).toFixed(1) + ' %',
  Math.abs(q - 0.895) < 0.005);
// Wer vor v5.29 die Tafel verstellt hatte, stellte Ratte, Krug und Co.
// Die gibt es nicht mehr — die alte Einstellung greift ins Leere, und es
// gilt der Standard, statt dass ein halber Automat entsteht.
ist('eine Tafel mit den alten Zeichen gilt nicht',
  automatSymbole({symbole: [{k:'ratte', gewicht:99, zahlt:9}, {k:'drache', gewicht:1, zahlt:999}]}), S);
ist('eine mit den neuen schon',
  automatSymbole({symbole: [{k:'sieben', gewicht:2, zahlt:500}]}).find(s => s.k === 'sieben').zahlt, 500);

// ── Die Risikoleiter ─────────────────────────────────────────────
// Sie steht in derselben Datei und gilt fuer alle fuenf Automaten.
ist('zehn Sprossen, jede das Doppelte', leiterSprossen(5),
  [5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560]);
ist('auch bei krummen Gewinnen', leiterSprossen(7).slice(0, 3), [7, 14, 28]);
ist('ein Schritt hinauf', leiterWagen(3, () => 0.3), 4);
ist('  … oder auf die Null', leiterWagen(3, () => 0.7), -1);
let hoch = 0;
for (let i = 0; i < 20000; i++) if (leiterWagen(0) > 0) hoch++;
wahr('halb und halb (' + (hoch / 200).toFixed(1) + ' % hinauf)', Math.abs(hoch / 20000 - 0.5) < 0.02);
ist('auf der ersten Sprosse gibt es nichts zu teilen', leiterTeilen(5, 0), null);
ist('Teilen auf der vierten: die Haelfte eingesteckt, eine Sprosse tiefer',
  leiterTeilen(5, 3), {aus: 20, stufe: 2});
wahr('  … und nichts geht dabei verloren',
  [1, 2, 5, 9].every(k => leiterTeilen(7, k).aus + leiterBetrag(7, leiterTeilen(7, k).stufe) === leiterBetrag(7, k)));
ist('oben ist Schluss: die zehnte Sprosse ist das 512-Fache', leiterBetrag(1, LEITER_SPROSSEN - 1), 512);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
