// Prueft die Rechnung der Post: welche Zettel zu welcher Unterhaltung
// gehoeren, was ungelesen ist, und als welcher Held man antwortet.
const fs = require('fs');
const quelle = fs.readFileSync('js/src/2l-post.jsx', 'utf8');
const stueck = quelle.slice(quelle.indexOf('// Was als ungelesen zaehlt'), quelle.indexOf('const postZeichen'));
eval(stueck + ';globalThis.M = {postUngelesenFuer, postGegenueber, postSchluessel, postGespraeche, postMeinHeld};');
const {postUngelesenFuer, postGespraeche, postMeinHeld} = M;

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

const SL = {charId: '', name: 'Spielleitung'};
const armin = {charId: 'h1', name: 'Armin'}, ilvara = {charId: 'p2', name: 'Ilvara'}, bo = {charId: 'h3', name: 'Bo'};

// ── Aus der Sicht eines Spielers (Armin und Bo gehoeren ihm) ─────
const spieler = [
  {id: 1, von: armin, an: SL, text: 'Ich stecke den Schlüssel ein.', zeit: 100, eigen: true, eingang: false, gelesen: true},
  {id: 2, von: SL, an: armin, text: 'Du erkennst das Wappen.', zeit: 200, eigen: false, eingang: true, gelesen: false},
  {id: 3, von: armin, an: ilvara, text: 'Lenk du die Wache ab.', zeit: 150, eigen: true, eingang: false, gelesen: false},
  {id: 4, von: ilvara, an: bo, text: 'Bo, hilf mir.', zeit: 300, eigen: false, eingang: true, gelesen: false},
];
const g = postGespraeche(spieler);
ist('je Gegenüber eine Unterhaltung, die neueste oben', g.map(u => u.schluessel), ['p2', 'sl']);
ist('die Spielleitung ist eine Unterhaltung', g[1].name, 'Spielleitung');
ist('  … mit Hin und Zurück, der Zeit nach', g[1].zettel.map(p => p.id), [1, 2]);
ist('  … und einem Ungelesenen', g[1].ungelesen, 1);
ist('mit Ilvara: was Armin schrieb und was an Bo kam', g[0].zettel.map(p => p.id), [3, 4]);
ist('das Eigene zählt nie als ungelesen', g[0].ungelesen, 1);
ist('insgesamt zwei ungelesen', postUngelesenFuer(spieler), 2);
const meine = [{id: 'h1', name: 'Armin'}, {id: 'h3', name: 'Bo'}];
ist('mit Ilvara antwortet, wer zuletzt angesprochen wurde: Bo', postMeinHeld(g[0], meine), 'h3');
ist('der Spielleitung antwortet Armin', postMeinHeld(g[1], meine), 'h1');
ist('eine neue Unterhaltung beginnt der erste Held', postMeinHeld(null, meine), 'h1');
ist('ohne eigenen Helden niemand', postMeinHeld(g[1], []), '');

// ── Aus der Sicht der Spielleitung ───────────────────────────────
const dm = [
  {id: 1, von: armin, an: SL, text: 'Ich stecke den Schlüssel ein.', zeit: 100, eigen: false, eingang: true, gelesen: false},
  {id: 2, von: SL, an: armin, text: 'Du erkennst das Wappen.', zeit: 200, eigen: true, eingang: false, gelesen: true},
  {id: 5, von: ilvara, an: SL, text: 'Ich lüge.', zeit: 50, eigen: false, eingang: true, gelesen: true},
];
const d = postGespraeche(dm);
ist('bei der Spielleitung je Held eine Unterhaltung', d.map(u => u.schluessel), ['h1', 'p2']);
ist('  … Armins Zettel und ihre Antwort darin', d[0].zettel.map(p => p.id), [1, 2]);
ist('  … ungelesen nur, was von Armin kam', postUngelesenFuer(dm), 1);
ist('nichts da, keine Unterhaltung', postGespraeche([]), []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
