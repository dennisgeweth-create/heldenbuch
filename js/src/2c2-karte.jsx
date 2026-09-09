// Heldenbuch — die Kampfkarte, Stufe 1: die Rechnung.
//
// Der Tracker fuehrt eine Reihenfolge, kein Feld. Hier kommt das Feld
// dazu: ein Raster, je Feld ein Gelaende und hoechstens eine Figur.
//
// Den Ausschlag fuer das Raster gab eine einzige Anforderung — die Karte
// soll jederzeit kopierbar sein. Kopierbar heisst Text, und ein Raster
// ist schon fast einer. Deshalb ist der Textblock hier nicht die
// Ausgabe am Ende, sondern der Zweck: `karteText` schreibt ihn,
// `karteAusText` liest ihn wieder, und beide werden gegeneinander
// geprueft.
//
// Alles bis zur Marke laeuft ohne React und ohne Browser.
//
// Zwei Regeln tragen den Bau:
//
//   * Die Karte fuehrt NUR Positionen. Wer im Kampf steht, steht in
//     `kampf.teilnehmer` und nur dort. Eine Karte mit eigener
//     Figurenliste ginge beim ersten geloeschten Gegner auseinander.
//   * Das Gelaende ist eine feste Liste, wie die Zustaende. Damit heisst
//     „Wand" bei allen dasselbe und bleibt im Text eindeutig.

const K_BODEN = '.';
const K_METER = 1.5;                    // ein Feld — fuenf Fuss
const K_MIN   = 4;
const K_MAX_B = 40;                     // darueber wird der Textblock breiter
const K_MAX_H = 30;                     // als jedes Fenster, in das er soll

const K_ARTEN = [
  {z: '.', name: 'Boden',     bewegung: 'frei',      sicht: 'frei'},
  {z: '#', name: 'Wand',      bewegung: 'blockiert', sicht: 'blockiert'},
  {z: 'T', name: 'Baum',      bewegung: 'blockiert', sicht: 'blockiert'},
  {z: '~', name: 'Wasser',    bewegung: 'schwierig', sicht: 'frei'},
  {z: '+', name: 'Tür zu',    bewegung: 'blockiert', sicht: 'blockiert'},
  {z: '/', name: 'Tür offen', bewegung: 'frei',      sicht: 'frei'},
  {z: 'x', name: 'Gefahr',    bewegung: 'frei',      sicht: 'frei'},
];
const K_ZEICHEN = K_ARTEN.map(a => a.z);
const kArt = (z) => K_ARTEN.find(a => a.z === z) || K_ARTEN[0];

// Was im Text nebeneinanderstehen darf: zwei Zeichen Inhalt und ein
// Leerzeichen. Drei waeren luftiger und bei vierzig Spalten hundertsechzig
// Zeichen breit; zwei ohne Trennung liessen sich nicht mehr zerlegen.
const K_ZELLE = 3;

// ── Ein leeres Raster ────────────────────────────────────────────
const kMasz = (n, hoch) => Math.max(K_MIN, Math.min(hoch ? K_MAX_H : K_MAX_B,
  Math.round(+n) || K_MIN));

const karteNeu = (breite, hoehe) => {
  const b = kMasz(breite || 16, false), h = kMasz(hoehe || 12, true);
  return {breite: b, hoehe: h, feldMeter: K_METER,
          gelaende: K_BODEN.repeat(b * h), figuren: {}, verborgen: []};
};

// ── Spalten heissen A…Z, dann AA…AN ──────────────────────────────
// Bis Z ein Zeichen, danach zwei. Kleinbuchstaben waeren kuerzer, wuerden
// sich aber mit den Kuerzeln der Gegner beissen — die sind klein.
const kSpalte = (x) => x < 26
  ? String.fromCharCode(65 + x)
  : String.fromCharCode(64 + Math.floor(x / 26)) + String.fromCharCode(65 + (x % 26));
const kSpalteNr = (s) => {
  const t = String(s || '').toUpperCase();
  if (!/^[A-Z]{1,2}$/.test(t)) return -1;
  return t.length === 1 ? t.charCodeAt(0) - 65
                        : (t.charCodeAt(0) - 64) * 26 + (t.charCodeAt(1) - 65);
};
const karteName = (x, y) => kSpalte(x) + (y + 1);
const karteAusName = (n) => {
  const m = /^([A-Za-z]{1,2})(\d{1,2})$/.exec(String(n || '').trim());
  if (!m) return null;
  const x = kSpalteNr(m[1]), y = (+m[2]) - 1;
  return (x < 0 || y < 0) ? null : {x, y};
};

// ── Gelände ──────────────────────────────────────────────────────
const kDrin = (karte, x, y) => x >= 0 && y >= 0 && x < karte.breite && y < karte.hoehe;
const karteFeld = (karte, x, y) =>
  kDrin(karte, x, y) ? (karte.gelaende[y * karte.breite + x] || K_BODEN) : K_BODEN;

const karteSetzen = (karte, x, y, zeichen) => {
  if (!kDrin(karte, x, y)) return karte;
  const z = K_ZEICHEN.includes(zeichen) ? zeichen : K_BODEN;
  const i = y * karte.breite + x;
  if (karte.gelaende[i] === z) return karte;
  return {...karte,
    gelaende: karte.gelaende.slice(0, i) + z + karte.gelaende.slice(i + 1)};
};

// ── Die Größe ändern ─────────────────────────────────────────────
// Gelaende und Figuren bleiben stehen, wo sie waren. Was herausfaellt,
// laesst sich vorher erfragen: eine Karte, die beim Verkleinern still
// zwei Gegner verliert, ist schlimmer als gar keine.
const karteVerloren = (karte, breite, hoehe) => {
  const b = kMasz(breite, false), h = kMasz(hoehe, true);
  const felder = [], marken = [];
  for (let y = 0; y < karte.hoehe; y++) {
    for (let x = 0; x < karte.breite; x++) {
      if (x < b && y < h) continue;
      if (karteFeld(karte, x, y) !== K_BODEN) felder.push(karteName(x, y));
    }
  }
  Object.keys(karte.figuren || {}).forEach(id => {
    const f = karte.figuren[id];
    if (f.x >= b || f.y >= h) marken.push({id, k: f.k, wo: karteName(f.x, f.y)});
  });
  return {felder, marken};
};

const karteGroesse = (karte, breite, hoehe) => {
  const b = kMasz(breite, false), h = kMasz(hoehe, true);
  if (b === karte.breite && h === karte.hoehe) return karte;
  let g = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < b; x++) g += karteFeld(karte, x, y);
  }
  const figuren = {};
  Object.keys(karte.figuren || {}).forEach(id => {
    const f = karte.figuren[id];
    if (f.x < b && f.y < h) figuren[id] = f;
  });
  return {...karte, breite: b, hoehe: h, gelaende: g, figuren};
};

// ── Figuren ──────────────────────────────────────────────────────
// Zwei Zeichen, einmal vergeben und dann fest: derselbe Gegner traegt in
// Runde 1 und Runde 9 dasselbe Kuerzel, sonst waere kein Protokoll
// lesbar. Helden gross, Gegner klein — die Form traegt die Auskunft,
// nicht erst die Farbe.
const karteKuerzel = (name, art, schon) => {
  const rein = String(name || '').replace(/[^A-Za-zÄÖÜäöüß]/g, '');
  const belegt = new Set(schon || []);
  const nimm = (k) => { if (k.length === 2 && !belegt.has(k)) return k; return null; };
  if (art === 'held') {
    const gross = (rein.slice(0, 2) || 'He');
    const k = gross.charAt(0).toUpperCase() + gross.slice(1).toLowerCase();
    if (nimm(k)) return k;
    for (let i = 1; i <= 9; i++) {
      const v = k.charAt(0) + i;
      if (nimm(v)) return v;
    }
  }
  const anfang = (rein.charAt(0) || 'g').toLowerCase();
  for (let i = 1; i <= 9; i++) {
    const v = anfang + i;
    if (nimm(v)) return v;
  }
  // Alles vergeben — dann eben durchgezaehlt, Hauptsache eindeutig.
  for (let i = 10; i < 100; i++) {
    const v = String(i);
    if (nimm(v)) return v;
  }
  return '??';
};

const karteFigurAuf = (karte, x, y) => {
  const ids = Object.keys(karte.figuren || {});
  for (const id of ids) {
    const f = karte.figuren[id];
    if (f.x === x && f.y === y) return id;
  }
  return null;
};

// Ein Feld traegt hoechstens eine Figur. Wer auf ein besetztes zieht,
// tauscht mit dem, der dort steht — das ist am Tisch das, was gemeint
// ist, und verliert niemanden.
const karteFigurSetzen = (karte, id, x, y, kuerzel) => {
  if (!id || !kDrin(karte, x, y)) return karte;
  const figuren = {...(karte.figuren || {})};
  const alt = figuren[id];
  const da = karteFigurAuf(karte, x, y);
  if (da && da !== id) {
    if (alt) figuren[da] = {...figuren[da], x: alt.x, y: alt.y};
    else delete figuren[da];
  }
  figuren[id] = {x, y, k: (alt && alt.k) || kuerzel || '??'};
  return {...karte, figuren};
};

const karteFigurWeg = (karte, id) => {
  if (!karte.figuren || !karte.figuren[id]) return karte;
  const figuren = {...karte.figuren};
  delete figuren[id];
  return {...karte, figuren};
};

// Wer nicht mehr im Kampf steht, steht auch nicht mehr auf der Karte.
// Das ist die eine Regel, die den ganzen Bau zusammenhaelt.
const karteAufraeumen = (karte, teilnehmer) => {
  if (!karte) return karte;
  const da = new Set((teilnehmer || []).map(t => t.id));
  const figuren = {};
  Object.keys(karte.figuren || {}).forEach(id => {
    if (da.has(id)) figuren[id] = karte.figuren[id];
  });
  const verborgen = (karte.verborgen || []).filter(id => da.has(id));
  return {...karte, figuren, verborgen};
};

// ── Was die Runde sieht ──────────────────────────────────────────
// Zwei Schalter, und beide muessen an sein. Der eine gilt der ganzen
// Karte: eine Aufstellung, die vor dem Kampf schon steht, gehoert
// niemandem ausser der Spielleitung. Der andere gilt einzelnen Figuren
// — der Hinterhalt, der Unsichtbare, der noch nicht gefundene Wolf.
//
// Verborgen heisst verborgen, nicht ausgegraut: die Figur wird
// herausgenommen, bevor irgendetwas das Geraet verlaesst. Eine Marke,
// die nur nicht gezeichnet wird, stuende trotzdem in der Antwort.
const karteIstVerborgen = (karte, id) =>
  (((karte || {}).verborgen) || []).includes(id);

const karteVerbergen = (karte, id) => {
  if (!karte || !id) return karte;
  const alt = karte.verborgen || [];
  return {...karte, verborgen: alt.includes(id)
    ? alt.filter(x => x !== id) : [...alt, id]};
};

const karteFuerSpieler = (karte) => {
  if (!karte || !karte.zeigen) return null;
  const figuren = {};
  Object.keys(karte.figuren || {}).forEach(id => {
    if (!karteIstVerborgen(karte, id)) figuren[id] = karte.figuren[id];
  });
  // Das Gelaende geht ganz mit. Wer die Wand sieht, sieht sie auch am
  // Tisch — und eine Karte mit Loechern waere keine.
  return {breite: karte.breite, hoehe: karte.hoehe, feldMeter: karte.feldMeter,
          gelaende: karte.gelaende, figuren, zeigen: true};
};

// ── Entfernung ───────────────────────────────────────────────────
// Diagonal zaehlt wie gerade — die Regel des Grundregelwerks. Die
// Variante 5-10-5 waere eine Zeile mehr und steht bewusst nicht hier:
// sie gehoert als Hausregel dazu oder gar nicht.
const karteWeit = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const karteMeter = (felder, karte) =>
  felder * ((karte && +karte.feldMeter) || K_METER);
// Eine Nachkommastelle reicht — 4,5 m, nicht 4,5000000000000004 m, und
// das Komma gehoert an die deutsche Stelle.
const karteMeterText = (felder, karte) =>
  String(Math.round(karteMeter(felder, karte) * 10) / 10).replace('.', ',') + ' m';

// ── Sicht ────────────────────────────────────────────────────────
// Eine Linie von Feldmitte zu Feldmitte (Bresenham) und die Frage, ob
// unterwegs etwas steht. Das ist eine **Naeherung**, keine Regel: das
// Grundregelwerk prueft von Ecke zu Ecke und kennt Deckung in Stufen —
// halb, drei viertel, ganz. Hier gibt es nur frei oder nicht.
//
// Sie steht trotzdem hier, weil die Frage am Tisch fast immer die
// einfache ist: steht die Wand dazwischen oder nicht. Wo es darauf
// ankommt, entscheidet die Spielleitung — und der Textblock sagt das
// ausdruecklich, damit es auch eine KI nicht fuer einen Regelentscheid
// haelt.
//
// Start- und Zielfeld zaehlen nicht mit. Wer selbst im Baum sitzt, ist
// dadurch nicht blind, und wer hinter der Wand steht, wird durch sie
// nicht unsichtbar — auf ihn zu zielen ist eine andere Frage.
const kLinie = (a, b) => {
  const felder = [];
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - x), dy = Math.abs(b.y - y);
  const sx = a.x < b.x ? 1 : -1, sy = a.y < b.y ? 1 : -1;
  let fehler = dx - dy;
  for (let schutz = 0; schutz < K_MAX_B + K_MAX_H + 2; schutz++) {
    if (x === b.x && y === b.y) break;
    const e2 = 2 * fehler;
    if (e2 > -dy) { fehler -= dy; x += sx; }
    if (e2 <  dx) { fehler += dx; y += sy; }
    if (x === b.x && y === b.y) break;
    felder.push({x, y});
  }
  return felder;
};

// Was zwischen zwei Feldern steht. Gibt das erste blockierende Feld
// zurueck oder null — der Name des Zeichens reicht fuer die Meldung
// („eine Wand auf D3"), und mehr als das erste braucht niemand.
const karteSicht = (karte, a, b) => {
  for (const f of kLinie(a, b)) {
    const art = kArt(karteFeld(karte, f.x, f.y));
    if (art.sicht === 'blockiert') return {frei: false, art, x: f.x, y: f.y};
  }
  return {frei: true, art: null};
};

// Und dasselbe fuer die Bewegung: wie viele der Felder unterwegs kosten
// mehr oder gehen gar nicht. Das ist keine Wegfindung — die Linie ist
// die gerade Strecke, und wer um die Wand herumlaeuft, geht weiter als
// hier steht. Es beantwortet nur „geht das ueberhaupt geradeaus".
const karteWeg = (karte, a, b) => {
  let schwierig = 0;
  for (const f of kLinie(a, b)) {
    const art = kArt(karteFeld(karte, f.x, f.y));
    if (art.bewegung === 'blockiert') return {frei: false, schwierig, art, x: f.x, y: f.y};
    if (art.bewegung === 'schwierig') schwierig++;
  }
  // Das Zielfeld selbst zaehlt mit: darauf steht man am Ende.
  const ziel = kArt(karteFeld(karte, b.x, b.y));
  if (ziel.bewegung === 'blockiert')
    return {frei: false, schwierig, art: ziel, x: b.x, y: b.y};
  if (ziel.bewegung === 'schwierig') schwierig++;
  return {frei: true, schwierig, art: null};
};

// ── Der Textblock ────────────────────────────────────────────────
// Das eigentliche Ergebnis. Drei Zeichen je Spalte: zwei fuer den
// Inhalt, eines als Trennung — damit sich der Block wieder zerlegen
// laesst, ohne Spaltenbreiten abzuzaehlen.
const kZelle = (t) => String(t).slice(0, 2).padEnd(K_ZELLE - 1) + ' ';
const kRand  = (n) => String(n).padStart(3) + ' ';

const karteZeilen = (karte, wer) => {
  const belegt = new Map();
  Object.keys(karte.figuren || {}).forEach(id => {
    const f = karte.figuren[id];
    if (!wer || wer(id)) belegt.set(f.y * karte.breite + f.x, f.k);
  });
  const zeilen = [];
  zeilen.push(kRand('') + Array.from({length: karte.breite},
    (_, x) => kZelle(kSpalte(x))).join('').replace(/\s+$/, ''));
  for (let y = 0; y < karte.hoehe; y++) {
    let z = kRand(y + 1);
    for (let x = 0; x < karte.breite; x++) {
      const k = belegt.get(y * karte.breite + x);
      z += kZelle(k || karteFeld(karte, x, y));
    }
    zeilen.push(z.replace(/\s+$/, ''));
  }
  return zeilen;
};

// Die Geländetafel nennt nur, was wirklich daliegt — eine Legende für
// Zeichen, die auf der Karte gar nicht vorkommen, ist Ballast.
const karteLegende = (karte) => {
  const drin = new Set(karte.gelaende.split(''));
  return K_ARTEN.filter(a => a.z !== K_BODEN && drin.has(a.z));
};

const karteText = (karte, teilnehmer, opts) => {
  const o = opts || {};
  const liste = teilnehmer || [];
  const wer = o.wer || null;
  const t = [];
  t.push('🗺 KARTE  ' + karte.breite + ' × ' + karte.hoehe
    + '  ·  1 Feld = ' + String(karte.feldMeter || K_METER).replace('.', ',') + ' m');
  t.push('');
  karteZeilen(karte, wer).forEach(z => t.push(z));

  const gesetzt = liste
    .filter(x => (karte.figuren || {})[x.id] && (!wer || wer(x.id)))
    .map(x => ({t: x, f: karte.figuren[x.id]}));
  if (gesetzt.length) {
    t.push('', 'FIGUREN');
    gesetzt.forEach(({t: x, f}) => {
      const teile = [
        '  ' + f.k.padEnd(4),
        String(x.name || '—').slice(0, 18).padEnd(19),
        (x.art === 'held' ? 'Held' : 'Gegner').padEnd(8),
        karteName(f.x, f.y).padStart(3),
      ];
      const rest = [];
      if (o.mitZahlen && x.hp !== undefined) rest.push(x.hp + '/' + x.hpMax + ' TP');
      if ((x.zustaende || []).length) rest.push(x.zustaende.join(', '));
      t.push(teile.join('') + (rest.length ? '  ' + rest.join(' · ') : ''));
    });
  }

  const legende = karteLegende(karte);
  if (legende.length) {
    t.push('', 'GELÄNDE');
    legende.forEach(a => t.push('  ' + a.z + '  ' + a.name.padEnd(11)
      + (a.bewegung === 'frei' ? '' : 'Bewegung ' + a.bewegung)
      + (a.bewegung !== 'frei' && a.sicht !== 'frei' ? ', ' : '')
      + (a.sicht === 'frei' ? '' : 'Sicht blockiert')));
  }

  // Entfernungen nur zwischen den Seiten — Held zu Held interessiert am
  // Tisch selten, und alle gegen alle waeren bei acht Figuren
  // achtundzwanzig Zeilen.
  const helden  = gesetzt.filter(g => g.t.art === 'held');
  const gegner  = gesetzt.filter(g => g.t.art !== 'held');
  if (helden.length && gegner.length) {
    t.push('', 'ENTFERNUNGEN (Felder, diagonal zählt eins)');
    helden.forEach(h => {
      t.push('  ' + gegner.map(g =>
        h.f.k + ' → ' + g.f.k + ' ' + String(karteWeit(h.f, g.f)).padStart(2)).join('   '));
    });

    // Nur die Paare, bei denen etwas dazwischensteht. Alle aufzulisten
    // waere bei acht Figuren eine Wand aus Zeilen, in der die drei
    // wichtigen untergehen — und „frei" ist der Normalfall.
    const verstellt = [];
    helden.forEach(h => gegner.forEach(g => {
      const s = karteSicht(karte, h.f, g.f);
      if (!s.frei) verstellt.push('  ' + h.f.k + ' → ' + g.f.k + '  '
        + s.art.name + ' auf ' + karteName(s.x, s.y));
    }));
    // Der Hinweis steht auch dann da, wenn nichts verstellt ist. Er
    // sagt, wie genau die Angabe ist, und das gilt in beide Richtungen.
    t.push('', 'SICHT (Näherung: Linie Mitte zu Mitte, keine Deckungsgrade —',
           '       im Zweifel entscheidet die Spielleitung)');
    if (verstellt.length) verstellt.forEach(z => t.push(z));
    else t.push('  Zwischen keinem Paar steht etwas.');
  }
  return t.join('\n');
};

// ── Und derselbe Block zurück ────────────────────────────────────
// Beim Lesen grosszuegig, beim Schreiben genau: ein Block, den eine KI
// aus einem Bild geschrieben hat, trifft das Format selten aufs Zeichen.
//
// Zerlegt wird an Leerraeumen, nicht nach Spaltenbreite — dann ist es
// gleich, ob zwischen den Feldern ein Leerzeichen steht oder drei.
const K_KOPF   = /^\s*(?:[A-Z]{1,2}\s+){3,}[A-Z]{1,2}\s*$/;
const K_ABSATZ = /^\s*(FIGUREN|GEL[ÄA]NDE|ENTFERNUNGEN|SICHT)\b/i;

// Ist das eine Rasterzeile? „nur Gerede" zerfaellt auch in zwei
// Wortgruppen und waere sonst eine Karte von zwei Feldern. Also zwei
// Bedingungen: kein Feld ist laenger als zwei Zeichen — Gelaende ist
// eines, ein Kuerzel zwei —, und mindestens die Haelfte sind Zeichen,
// die wir kennen. Eine Reihe ganz ohne Boden gibt es auf keiner Karte.
const kIstReihe = (felder) => {
  if (felder.length < 2) return false;
  if (felder.some(f => f.length > 2)) return false;
  // Mindestens ein bekanntes Zeichen. „Die Haelfte" waere strenger und
  // zu streng: eine Reihe, die fast nur aus Figuren besteht, gibt es —
  // eine ganz ohne Boden nicht.
  return felder.some(f => K_ZEICHEN.includes(f));
};

const karteAusText = (text) => {
  const roh = String(text || '').replace(/\r/g, '').split('\n');
  const warnung = [];
  const unbekannt = new Set();

  // Erst die Rasterzeilen einsammeln: alles vor dem ersten Absatz, was
  // sich in Felder zerlegen laesst und keine Spaltenzeile ist.
  const reihen = [];
  const namen = {};
  let abschnitt = 'raster';
  for (const zeile of roh) {
    const a = K_ABSATZ.exec(zeile);
    if (a) { abschnitt = a[1].toUpperCase().replace('A', 'Ä'); continue; }
    if (abschnitt === 'raster') {
      if (!zeile.trim()) continue;
      if (/^\s*🗺|^\s*KARTE\b/i.test(zeile)) continue;
      if (K_KOPF.test(zeile)) continue;                 // die Spaltenzeile
      const ohneNr = zeile.replace(/^\s*\d{1,2}[.)]?\s+/, '');
      const felder = ohneNr.trim().split(/\s+/).filter(Boolean);
      if (!kIstReihe(felder)) continue;
      reihen.push(felder);
    } else if (abschnitt === 'FIGUREN') {
      // „Br   Brunhilde   Held   F3   38/44 TP" — Kuerzel und Name.
      const m = /^\s*(\S{1,3})\s{2,}(\S[^\s].*?)(?:\s{2,}|$)/.exec(zeile);
      if (m) namen[m[1]] = m[2].trim();
    }
  }
  if (!reihen.length) return {karte: null, meldung: 'Kein Raster gefunden.', warnung};

  // Gekappt wird nur nach oben. Anzuheben waere hier falsch: ein Block
  // mit drei Spalten ist eine Karte mit drei Spalten, keine mit vier.
  const breite = Math.min(K_MAX_B, Math.max(...reihen.map(r => r.length)));
  const hoehe  = Math.min(K_MAX_H, reihen.length);
  if (reihen.length > hoehe) warnung.push('Nur die ersten ' + hoehe + ' Zeilen gelesen.');
  if (reihen.some(r => r.length > breite)) warnung.push('Nur die ersten ' + breite + ' Spalten gelesen.');
  const kurz = reihen.filter(r => r.length < breite).length;
  if (kurz) warnung.push(kurz + (kurz === 1 ? ' Zeile war' : ' Zeilen waren')
    + ' kürzer und wurden mit Boden aufgefüllt.');

  let karte = {breite, hoehe, feldMeter: K_METER,
               gelaende: K_BODEN.repeat(breite * hoehe), figuren: {}, verborgen: []};
  const marken = [];
  let g = '';
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      const feld = (reihen[y] || [])[x];
      if (feld === undefined) { g += K_BODEN; continue; }
      if (K_ZEICHEN.includes(feld)) { g += feld; continue; }
      if (feld.length === 1 && !/[A-Za-z0-9]/.test(feld)) {
        // Ein fremdes Sonderzeichen ist Gelaende, das wir nicht kennen.
        unbekannt.add(feld); g += K_BODEN; continue;
      }
      // Alles andere ist ein Kuerzel. Der Boden darunter bleibt Boden.
      marken.push({k: feld.slice(0, 2), x, y});
      g += K_BODEN;
    }
  }
  karte = {...karte, gelaende: g};
  if (unbekannt.size) warnung.push('Unbekannte Zeichen zu Boden gemacht: '
    + [...unbekannt].join(' '));

  return {karte, marken, namen, warnung,
          meldung: breite + ' × ' + hoehe + ' Felder gelesen'
            + (marken.length ? ', ' + marken.length
               + (marken.length === 1 ? ' Figur' : ' Figuren') : '')};
};

// Die Marken aus dem Text den Teilnehmern zuordnen. Gesucht wird ueber
// den Namen aus dem FIGUREN-Block, mit derselben unscharfen Suche, die
// Beute und Gegnerlisten benutzen — und der Import legt niemanden an:
// wer im Kampf stehen soll, steht in der Teilnehmerliste.
const karteMarkenZuordnen = (karte, marken, namen, teilnehmer) => {
  const frei = [...(teilnehmer || [])];
  const raus = {};
  const offen = [];
  (marken || []).forEach(m => {
    const gesucht = (namen || {})[m.k] || '';
    let i = -1;
    if (gesucht) i = frei.findIndex(t => dbSchluessel(t.name) === dbSchluessel(gesucht));
    if (i < 0 && gesucht) i = frei.findIndex(t =>
      dbSchluessel(t.name).startsWith(dbSchluessel(gesucht))
      || dbSchluessel(gesucht).startsWith(dbSchluessel(t.name)));
    if (i < 0) { offen.push(m.k + (gesucht ? ' (' + gesucht + ')' : '')); return; }
    const t = frei.splice(i, 1)[0];
    raus[t.id] = {x: m.x, y: m.y, k: m.k};
  });
  return {figuren: raus, offen};
};

// Beides zusammen — der Weg, den das Einfügefeld geht.
const karteUebernehmen = (text, teilnehmer) => {
  const g = karteAusText(text);
  if (!g.karte) return g;
  const z = karteMarkenZuordnen(g.karte, g.marken, g.namen, teilnehmer);
  const warnung = [...g.warnung];
  if (z.offen.length) warnung.push('Nicht zugeordnet: ' + z.offen.join(', ')
    + ' — wer im Kampf stehen soll, muss in der Reihe stehen.');
  const gesetzt = Object.keys(z.figuren).length;
  return {karte: {...g.karte, figuren: z.figuren}, warnung,
          meldung: g.meldung.replace(/, \d+ Figuren?$/, '')
            + (gesetzt ? ', ' + gesetzt + (gesetzt === 1 ? ' Figur gesetzt' : ' Figuren gesetzt') : '')};
};

// ── Die Anweisung zum Weitergeben ────────────────────────────────
// Wie bei Beute und Gegnerlisten: der Text, den die Spielleitung ihrer
// KI vorlegt — zusammen mit dem Bild der Karte.
const KARTE_KI_ANWEISUNG = [
  'Du bekommst das Bild einer Kampfkarte. Schreib daraus einen Textblock',
  'in genau diesem Format:',
  '',
  '      A  B  C  D  E  F  G  H',
  '  1   .  .  #  #  #  .  .  .',
  '  2   .  .  #  .  /  .  .  .',
  '  3   .  .  #  #  #  .  ~  ~',
  '',
  'Regeln:',
  '- Ein Zeichen je Feld, durch Leerzeichen getrennt.',
  '- Spalten von links: A, B, C … Z, dann AA, AB …',
  '- Zeilen von oben, ab 1.',
  '- Erlaubt sind genau diese Zeichen:',
  '    .  Boden          #  Wand oder Fels    T  Baum oder Säule',
  '    ~  Wasser         +  Tür zu            /  Tür offen',
  '    x  Gefahr (Feuer, Dornen)',
  '- Ein Feld ist 1,5 m (5 Fuß). Schätz die Größe danach ab.',
  '- Höchstens ' + K_MAX_B + ' Spalten und ' + K_MAX_H + ' Zeilen.',
  '- Zeichne keine Figuren ein — nur das Gelände.',
  '- Schreib nichts dazu, keine Erklärung, keinen Kommentar.',
].join('\n');

// ── Die Aufnahme je Runde ────────────────────────────────────────
// Der kopierte Verlauf soll die Karte tragen, wie sie sich entwickelt
// hat — dafuer legt jede Runde eine Aufnahme ab.
//
// Sie steht fuer sich: der Verlauf wandert am Ende ins Archiv, wo es
// den Kampf und seine Teilnehmerliste nicht mehr gibt. Also nimmt die
// Aufnahme mit, was der Textblock braucht, statt sich darauf zu
// verlassen, dass es spaeter noch jemanden gibt, den man fragen kann.
const karteAufnahme = (karte, teilnehmer) => {
  if (!karte) return null;
  const drauf = karte.figuren || {};
  return {
    karte: {breite: karte.breite, hoehe: karte.hoehe, feldMeter: karte.feldMeter,
            gelaende: karte.gelaende, figuren: drauf},
    liste: (teilnehmer || []).filter(t => drauf[t.id]).map(t => {
      const e = {id: t.id, name: t.name, art: t.art};
      if (t.hp !== undefined) { e.hp = t.hp; e.hpMax = t.hpMax; }
      if ((t.zustaende || []).length) e.zustaende = t.zustaende;
      return e;
    }),
  };
};

// Was sich seit der letzten Aufnahme nicht gerührt hat, wird nicht noch
// einmal abgelegt — zehnmal dieselbe Karte ist kein Verlauf.
//
// Gleich heisst: dasselbe Gelände, dieselben Figuren auf denselben
// Feldern. Trefferpunkte gehoeren nicht dazu. Die stehen schon Zeile
// fuer Zeile im Protokoll, und eine zweite Karte nur wegen drei Schaden
// waere Ballast.
const karteAufnahmeGleich = (a, b) => {
  if (!a || !b) return a === b;
  if (a.karte.breite !== b.karte.breite || a.karte.hoehe !== b.karte.hoehe
      || a.karte.gelaende !== b.karte.gelaende) return false;
  const fa = a.karte.figuren || {}, fb = b.karte.figuren || {};
  const ia = Object.keys(fa);
  if (ia.length !== Object.keys(fb).length) return false;
  return ia.every(id => fb[id] && fa[id].x === fb[id].x && fa[id].y === fb[id].y);
};

// ══ Ende der reinen Rechnung ═══════════════════════════════════════

// ── Das Feld im Tracker ──────────────────────────────────────────
// Bedient wird am Schreibtisch oder auf dem iPad, nie am Telefon —
// deshalb darf das Raster Platz nehmen. Und deshalb ist „erst wählen,
// dann tippen" der Hauptweg: er geht mit Maus und Finger gleich gut,
// während Ziehen auf einem Tablet erfahrungsgemäß hakt.

const K_VORLAGEN = [
  {name: 'Kammer',      b: 10, h: 8},
  {name: 'Raum',        b: 16, h: 12},
  {name: 'Halle',       b: 24, h: 18},
  {name: 'Freies Feld', b: 32, h: 24},
];

const K_PLATZHALTER = '    A  B  C  D\n 1  .  .  #  .\n 2  .  #  #  .';

// Ein Feld auf dem Schirm. Es zeigt entweder eine Figur oder sein
// Gelände; beides gleichzeitig gibt es nicht, und die Figur gewinnt.
const KarteZelle = ({ x, y, zeichen, figur, dran, gewaehlt, versteckt, mass, onKlick, onZeigen }) => {
  const was = karteName(x, y)
    + (figur ? ' · ' + figur.name : ' · ' + kArt(zeichen).name)
    + (versteckt ? ' · verborgen, die Runde sieht sie nicht' : '')
    // Am Tablet gibt es keinen Zeiger und damit keine Anzeige in der
    // Leiste — im Titel steht dasselbe, und langes Antippen zeigt ihn.
    + (mass ? ' · ' + mass.weite + ' · ' + mass.sicht + ' · ' + mass.weg : '');
  return (
    <button type="button"
      className={'kk-feld'
        + (figur ? ' figur ' + (figur.art === 'held' ? 'held' : 'gegner')
                 : ' g' + K_ZEICHEN.indexOf(zeichen))
        + (dran ? ' dran' : '') + (gewaehlt ? ' gewaehlt' : '')
        + (versteckt ? ' versteckt' : '')}
      title={was} aria-label={was.replace(/ · /g, ', ')}
      onMouseEnter={onZeigen ? ()=>onZeigen(x, y) : undefined}
      onFocus={onZeigen ? ()=>onZeigen(x, y) : undefined}
      onClick={()=>onKlick(x, y)}>
      {figur ? figur.k : (zeichen === K_BODEN ? '' : zeichen)}
    </button>
  );
};

const KarteFeld = ({ kampf, setKampf, liste, amZug, onFrage, onLog }) => {
  const karte = kampf.karte || null;
  // Das Werkzeug in der Hand: eine Figur, die gesetzt werden will, oder
  // ein Gelände, das gemalt wird. Nichts in der Hand heißt: ein Tipp auf
  // eine Figur nimmt sie auf.
  const [werkzeug, setWerkzeug] = React.useState(null);
  const [masze, setMasze] = React.useState(null);
  const [kopiert, setKopiert] = React.useState(false);
  // Wo der Zeiger gerade steht. Nur fuers Messen — am Tablet gibt es
  // ihn nicht, deshalb steht dasselbe auch im Titel jedes Feldes.
  const [zeiger, setZeiger] = React.useState(null);

  const schreiben = (neu) =>
    setKampf(k => k && ({...k, karte: karteAufraeumen(neu, k.teilnehmer)}));

  const einfuegen = (roh) => {
    const e = karteUebernehmen(roh, (kampf && kampf.teilnehmer) || []);
    if (!e.karte) return {gut: false, meldung: e.meldung};
    // Ein Bodenplan, der schon daliegt, bleibt liegen. Er passt zur
    // neuen Karte vielleicht nicht mehr — aber ihn stillschweigend
    // wegzuwerfen waere schlimmer als ein Knopf, der ihn entfernt.
    const alt = karte || {};
    schreiben(alt.bild ? {...e.karte, bild: alt.bild, bildZoom: alt.bildZoom,
                          bildX: alt.bildX, bildY: alt.bildY} : e.karte);
    return {gut: true, meldung: [e.meldung, ...(e.warnung || [])].join(' · ')};
  };

  if (!karte) {
    return (
      <div className="kk kk-leer">
        <div className="kk-leer-text">
          Noch keine Karte. Eine leere anlegen — oder eine als Text einfügen:
          die Anweisung unten legst du deiner KI zusammen mit dem Bild eines
          Bodenplans vor, und was zurückkommt, kommt hier hinein.
        </div>
        <div className="kk-leiste">
          {K_VORLAGEN.map(v => (
            <button type="button" className="bj-taste" key={v.name}
              onClick={()=>schreiben(karteNeu(v.b, v.h))}>
              {v.name} <i className="kk-masz-i">{v.b} × {v.h}</i>
            </button>
          ))}
        </div>
        <ListeEinfuegen anweisung={KARTE_KI_ANWEISUNG}
          aufschrift="Karte als Text einfügen"
          platzhalter={K_PLATZHALTER} onText={einfuegen} />
      </div>
    );
  }

  // Wer wo steht — einmal aufgelöst, damit jede Zelle nur nachschlägt.
  const nachId = new Map((liste || []).map(t => [t.id, t]));
  const belegt = new Map();
  Object.keys(karte.figuren || {}).forEach(id => {
    const t = nachId.get(id);
    const f = karte.figuren[id];
    if (t) belegt.set(f.y * karte.breite + f.x, {...f, name: t.name, art: t.art, id});
  });
  const ohnePlatz = (liste || []).filter(t => !(karte.figuren || {})[t.id]);

  const klick = (x, y) => {
    const wz = werkzeug;
    const drauf = belegt.get(y * karte.breite + x);
    if (wz && wz.art === 'gelaende') { schreiben(karteSetzen(karte, x, y, wz.z)); return; }
    if (wz && wz.art === 'figur') {
      const t = nachId.get(wz.id);
      if (!t) { setWerkzeug(null); return; }
      const schon = Object.values(karte.figuren || {}).map(f => f.k);
      const alt = (karte.figuren || {})[wz.id];
      const neu = karteFigurSetzen(karte, wz.id, x, y,
        (alt && alt.k) || karteKuerzel(t.name, t.art, schon));
      // Eine Bewegung gehört ins Protokoll — sie ist das, was im Zug
      // passiert ist, und ohne sie steht dort nur, wer angegriffen hat.
      if (alt && onLog && (alt.x !== x || alt.y !== y)) {
        const weit = karteWeit(alt, {x, y});
        // Die Meter stehen dabei, weil Reichweiten in Metern angegeben
        // sind — „3 Felder" muesste sonst jeder im Kopf umrechnen.
        onLog({art: 'bewegung', wer: t.name, von: karteName(alt.x, alt.y),
               auf: karteName(x, y), felder: weit,
               meter: karteMeterText(weit, karte)});
      }
      schreiben(neu);
      setWerkzeug(null);
      return;
    }
    if (drauf) setWerkzeug({art: 'figur', id: drauf.id});
  };

  const groesseSetzen = (b, h) => {
    const verlust = karteVerloren(karte, b, h);
    const tun = () => { schreiben(karteGroesse(karte, b, h)); setMasze(null); };
    if (!verlust.marken.length && !verlust.felder.length) { tun(); return; }
    // Eine Karte, die beim Verkleinern still zwei Gegner verliert, ist
    // schlimmer als gar keine. Also vorher fragen — und sagen, wen.
    const was = [];
    if (verlust.marken.length) was.push(verlust.marken.length
      + (verlust.marken.length === 1 ? ' Figur' : ' Figuren') + ' ('
      + verlust.marken.map(m => m.k + ' auf ' + m.wo).join(', ') + ')');
    if (verlust.felder.length) was.push(verlust.felder.length
      + (verlust.felder.length === 1 ? ' bemaltes Feld' : ' bemalte Felder'));
    if (onFrage) onFrage('Beim Verkleinern fällt weg: ' + was.join(' und ') + '.', tun, 'Trotzdem');
    else tun();
  };

  // Der Plan laesst sich nicht beliebig weit schieben oder schrumpfen —
  // ein Bild bei zwoelf Prozent irgendwo neben dem Raster waere nur noch
  // durch Zufall wiederzufinden.
  const planStellen = (was) => schreiben({...karte,
    bildZoom: Math.max(20, Math.min(400,
      was.bildZoom === undefined ? (karte.bildZoom || 100) : was.bildZoom)),
    bildX: Math.max(-100, Math.min(100,
      was.bildX === undefined ? (karte.bildX || 0) : was.bildX)),
    bildY: Math.max(-100, Math.min(100,
      was.bildY === undefined ? (karte.bildY || 0) : was.bildY)),
  });

  const kopieren = () => {
    const text = karteText(karte, liste || [], {mitZahlen: true});
    const fertig = () => { setKopiert(true); setTimeout(()=>setKopiert(false), 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(fertig, ()=>{});
    } else { try { if (document.execCommand('copy')) fertig(); } catch (e) {} }
  };

  const wz = masze || {b: karte.breite, h: karte.hoehe};
  const inHand = werkzeug && werkzeug.art === 'figur' ? nachId.get(werkzeug.id) : null;

  // ── Messen ─────────────────────────────────────────────────────
  // Gemessen wird von der Figur in der Hand aus. Eine, die noch nirgends
  // steht, hat kein Von — dann gibt es nichts zu messen.
  const vonFeld = inHand ? (karte.figuren || {})[werkzeug.id] : null;
  const messen = (x, y) => {
    if (!vonFeld || (vonFeld.x === x && vonFeld.y === y)) return null;
    const felder = karteWeit(vonFeld, {x, y});
    const sicht = karteSicht(karte, vonFeld, {x, y});
    const weg = karteWeg(karte, vonFeld, {x, y});
    return {
      felder,
      weite: felder + (felder === 1 ? ' Feld' : ' Felder')
             + ' · ' + karteMeterText(felder, karte),
      // Zwei getrennte Aussagen, weil sie es sind: Wasser laesst sehen
      // und haelt auf, eine Wand tut beides.
      sicht: sicht.frei ? 'Sicht frei'
        : sicht.art.name + ' auf ' + karteName(sicht.x, sicht.y) + ' im Blick',
      weg: !weg.frei
        ? 'Weg versperrt: ' + weg.art.name + ' auf ' + karteName(weg.x, weg.y)
        : weg.schwierig
          ? weg.schwierig + (weg.schwierig === 1 ? ' Feld' : ' Felder') + ' schwierig'
          : 'Weg frei',
      frei: sicht.frei, gehbar: weg.frei,
    };
  };
  const gemessen = zeiger ? messen(zeiger.x, zeiger.y) : null;
  const zeigen = (x, y) => setZeiger(z => (z && z.x === x && z.y === y) ? z : {x, y});
  // Nur die, die auch draufstehen — eine Figur, die vom Feld genommen
  // wurde, waere sonst weiter als „verborgen" gezaehlt.
  const versteckte = (karte.verborgen || [])
    .filter(id => (karte.figuren || {})[id]).length;

  return (
    <div className="kk">

      <div className="kk-leiste">
        <span className="kk-label">Gelände</span>
        {K_ARTEN.map(a => (
          <button type="button" key={a.z} title={a.name}
            className={'kk-pinsel g' + K_ZEICHEN.indexOf(a.z)
              + (werkzeug && werkzeug.art === 'gelaende' && werkzeug.z === a.z ? ' an' : '')}
            onClick={()=>setWerkzeug(w => (w && w.art === 'gelaende' && w.z === a.z)
              ? null : {art: 'gelaende', z: a.z})}>
            {a.z === K_BODEN ? '·' : a.z}
          </button>
        ))}
        {/* Wer in der Hand ist, kann auch wieder herunter. Ohne das ginge
            eine einzelne Figur nur ueber „alle herunternehmen" weg. */}
        {inHand && (karte.figuren || {})[werkzeug.id] && (
          <button type="button" className="bj-taste"
            onClick={()=>{ schreiben(karteFigurWeg(karte, werkzeug.id)); setWerkzeug(null); }}>
            ↩ Herunternehmen
          </button>
        )}
        {/* Einzelne verbergen: der Hinterhalt, der Unsichtbare, der
            Wolf, den noch keiner gesehen hat. Nur sinnvoll, solange die
            Karte ueberhaupt gezeigt wird. */}
        {inHand && (karte.figuren || {})[werkzeug.id] && karte.zeigen && (
          <button type="button" className="bj-taste"
            onClick={()=>schreiben(karteVerbergen(karte, werkzeug.id))}>
            {karteIstVerborgen(karte, werkzeug.id) ? '👁 Wieder zeigen' : '🚫 Verbergen'}
          </button>
        )}
        {inHand && (
          <button type="button" className="bj-taste" onClick={()=>setWerkzeug(null)}>
            Abbrechen
          </button>
        )}
        {/* Der Schalter fuer die ganze Karte. Er steht aus, bis jemand
            ihn umlegt: eine Aufstellung, die vor dem Kampf schon steht,
            gehoert niemandem ausser der Spielleitung. */}
        <button type="button"
          className={'bj-taste kk-zeigen kk-rechts' + (karte.zeigen ? ' an' : '')}
          title={karte.zeigen
            ? 'Die Runde sieht die Karte in ihrer Kampfsicht. Noch einmal drücken nimmt sie zurück.'
            : 'Nur du siehst die Karte. Drücken zeigt sie der Runde — verborgene Figuren bleiben draußen.'}
          onClick={()=>schreiben({...karte, zeigen: !karte.zeigen})}>
          {!karte.zeigen ? '🚫 Nur für dich'
            : versteckte === 0 ? '👁 Die Runde sieht mit'
            : '👁 Die Runde sieht mit · ' + versteckte + ' verborgen'}
        </button>
        <button type="button" className="bj-taste" onClick={kopieren}>
          {kopiert ? '✓ Kopiert' : '🗺 Karte kopieren'}
        </button>
      </div>

      {/* Die Zeile darunter misst beim Setzen mit: wie weit ist es bis
          dahin, steht etwas im Blick, kommt man geradeaus hin. Sie steht
          fuer sich, weil sie mit jedem Feld ihre Laenge aendert — in der
          Werkzeugleiste haette sie die Knoepfe vor sich hergeschoben. */}
      <div className={'kk-hinweis' + (gemessen ? ' kk-mass' : '')}>
        {werkzeug && werkzeug.art === 'gelaende'
          ? 'Felder antippen zum Malen — noch einmal auf den Pinsel legt ihn weg'
          : gemessen ? (
            <>
              {karteName(zeiger.x, zeiger.y)} · {gemessen.weite}
              <b className={gemessen.frei ? 'kk-frei' : 'kk-zu'}> · {gemessen.sicht}</b>
              <b className={gemessen.gehbar ? 'kk-frei' : 'kk-zu'}> · {gemessen.weg}</b>
            </>)
          : inHand ? inHand.name + ' — wohin? Ein Feld antippen setzt sie ab.'
          : 'Eine Figur antippen nimmt sie auf'}
      </div>

      <div className="kk-mitte">
        <div className="kk-raster-kasten"
          onMouseLeave={()=>setZeiger(null)}>
         <div className="kk-buehne">
          {/* Der Bodenplan liegt darunter, das Raster bleibt die
              Wahrheit. Ausgerichtet wird ueber Zoom und Versatz — beide
              in Prozent der Rasterbreite, damit die Einstellung stehen
              bleibt, wenn die Felder ihre Groesse aendern. */}
          {karte.bild && (
            <img className="kk-plan" src={karte.bild} alt="" aria-hidden="true"
              style={{left: (karte.bildX || 0) + '%', top: (karte.bildY || 0) + '%',
                      width: (karte.bildZoom || 100) + '%'}} />
          )}
          <div className={'kk-raster' + (karte.bild ? ' mit-bild' : '')}
            style={{gridTemplateColumns: 'auto repeat(' + karte.breite + ', var(--kk-feld))'}}>
            <span className="kk-ecke" />
            {Array.from({length: karte.breite}, (_, x) => (
              <span className="kk-spalte" key={'s' + x}>{kSpalte(x)}</span>
            ))}
            {Array.from({length: karte.hoehe}, (_, y) => (
              <React.Fragment key={'z' + y}>
                <span className="kk-zeile">{y + 1}</span>
                {Array.from({length: karte.breite}, (_, x) => {
                  const f = belegt.get(y * karte.breite + x);
                  return (
                    <KarteZelle key={x + ':' + y} x={x} y={y}
                      zeichen={karteFeld(karte, x, y)} figur={f}
                      dran={!!(f && amZug && f.id === amZug.id)}
                      gewaehlt={!!(werkzeug && werkzeug.art === 'figur' && f && f.id === werkzeug.id)}
                      versteckt={!!(f && karte.zeigen && karteIstVerborgen(karte, f.id))}
                      mass={vonFeld ? messen(x, y) : null}
                      onKlick={klick} onZeigen={vonFeld ? zeigen : null} />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
         </div>
        </div>

        <div className="kk-ablage">
          <div className="kk-label">Noch ohne Platz</div>
          {ohnePlatz.length === 0
            ? <div className="probe-leer">Alle stehen.</div>
            : ohnePlatz.map(t => (
                <button type="button" key={t.id}
                  className={'kk-marke ' + (t.art === 'held' ? 'held' : 'gegner')
                    + (werkzeug && werkzeug.art === 'figur' && werkzeug.id === t.id ? ' an' : '')}
                  onClick={()=>setWerkzeug(w => (w && w.id === t.id)
                    ? null : {art: 'figur', id: t.id})}>
                  {t.name}
                </button>
              ))}
          {Object.keys(karte.figuren || {}).length > 0 && (
            <button type="button" className="bj-taste kk-alle-weg"
              onClick={()=>schreiben({...karte, figuren: {}})}>
              Alle herunternehmen
            </button>
          )}
        </div>
      </div>

      <div className="kk-leiste">
        <span className="kk-label">Größe</span>
        {K_VORLAGEN.map(v => (
          <button type="button" key={v.name} className="bj-taste"
            title={v.b + ' × ' + v.h} onClick={()=>groesseSetzen(v.b, v.h)}>{v.name}</button>
        ))}
        <span className="kk-masz">
          <ZahlFeld className="form-input" min={K_MIN} max={K_MAX_B} wert={wz.b}
            aria-label="Spalten" onWert={v=>setMasze({b: v, h: wz.h})} />
          <span>×</span>
          <ZahlFeld className="form-input" min={K_MIN} max={K_MAX_H} wert={wz.h}
            aria-label="Zeilen" onWert={v=>setMasze({b: wz.b, h: v})} />
        </span>
        {masze && (masze.b !== karte.breite || masze.h !== karte.hoehe) && (
          <button type="button" className="btn-save"
            onClick={()=>groesseSetzen(masze.b, masze.h)}>Übernehmen</button>
        )}
        <button type="button" className="bj-taste" disabled={karte.breite >= K_MAX_B}
          onClick={()=>groesseSetzen(karte.breite + 1, karte.hoehe)}
          title="Eine Spalte anhängen, wenn der Kampf aus dem Raum läuft">+ Spalte</button>
        <button type="button" className="bj-taste" disabled={karte.hoehe >= K_MAX_H}
          onClick={()=>groesseSetzen(karte.breite, karte.hoehe + 1)}
          title="Eine Zeile anhängen">+ Zeile</button>
        <span className="kk-hinweis">höchstens {K_MAX_B} × {K_MAX_H}</span>
        <button type="button" className="bj-taste kk-rechts"
          onClick={()=>{
            const weg = ()=>setKampf(k => k && ({...k, karte: null}));
            if (onFrage) onFrage('Die Karte wegräumen? Gelände und Positionen sind dann weg.',
                                 weg, 'Wegräumen');
            else weg();
          }}>Karte wegräumen</button>
      </div>

      {/* Der Bodenplan. Er ist fuers Auge: das Raster bleibt die
          Wahrheit, und am Textblock aendert er nichts. Er bleibt auch
          auf diesem Geraet — durch die Spiegelung geht er nicht, denn
          der Kampf wird im Sekundentakt geschrieben und ein Bild
          gehoert da nicht hinein. */}
      <div className="kk-leiste kk-planzeile">
        <span className="kk-label">Bodenplan</span>
        {!karte.bild ? (
          <BildAblage bild={null} maxPx={1400} hoehe={0}
            aufschrift="🖼 Plan hierher ziehen"
            hinweis="oder Strg+V — er liegt unter dem Raster und bleibt auf diesem Gerät"
            onBild={(d)=>schreiben({...karte, bild: d,
              bildZoom: 100, bildX: 0, bildY: 0})} />
        ) : (
          <>
            <span className="kk-nudge">
              <button type="button" className="bj-taste" title="Kleiner"
                onClick={()=>planStellen({bildZoom: (karte.bildZoom || 100) - 2})}>−</button>
              <b>{Math.round(karte.bildZoom || 100)} %</b>
              <button type="button" className="bj-taste" title="Größer"
                onClick={()=>planStellen({bildZoom: (karte.bildZoom || 100) + 2})}>+</button>
            </span>
            <span className="kk-nudge">
              <button type="button" className="bj-taste" title="Nach links"
                onClick={()=>planStellen({bildX: (karte.bildX || 0) - 1})}>◀</button>
              <button type="button" className="bj-taste" title="Nach rechts"
                onClick={()=>planStellen({bildX: (karte.bildX || 0) + 1})}>▶</button>
              <button type="button" className="bj-taste" title="Nach oben"
                onClick={()=>planStellen({bildY: (karte.bildY || 0) - 1})}>▲</button>
              <button type="button" className="bj-taste" title="Nach unten"
                onClick={()=>planStellen({bildY: (karte.bildY || 0) + 1})}>▼</button>
            </span>
            <span className="kk-hinweis">
              Verschoben um {Math.round(karte.bildX || 0)} / {Math.round(karte.bildY || 0)} %
              — das Raster zählt, nicht das Bild
            </span>
            <button type="button" className="bj-taste"
              onClick={()=>planStellen({bildZoom: 100, bildX: 0, bildY: 0})}>
              Zurücksetzen
            </button>
            <button type="button" className="bj-taste kk-rechts"
              onClick={()=>schreiben({...karte, bild: null})}>Plan entfernen</button>
          </>
        )}
      </div>

      <ListeEinfuegen anweisung={KARTE_KI_ANWEISUNG}
        aufschrift="Andere Karte einfügen"
        platzhalter={K_PLATZHALTER} onText={einfuegen} />
    </div>
  );
};

// ── Dieselbe Karte, nur zum Ansehen ──────────────────────────────
// Was in der Kampfsicht der Runde steht. Keine Knoepfe, keine Pinsel,
// keine Ablage: hier wird nichts gesetzt, hier wird geschaut. Die
// Felder sind kleiner, weil das Fenster der Runde schmaler ist als der
// Tracker — laesst sich das Raster nicht unterbringen, rollt es in sich
// selbst, statt zu schrumpfen.
const KarteSchau = ({ karte, wer }) => {
  if (!karte || !karte.breite) return null;
  const belegt = new Map();
  Object.keys(karte.figuren || {}).forEach(id => {
    const f = karte.figuren[id];
    const t = (wer || {})[id] || {};
    belegt.set(f.y * karte.breite + f.x,
      {...f, name: t.name || f.k, art: t.art || 'gegner'});
  });
  return (
    <div className="kk-schau">
      <div className="kk-raster-kasten">
        <div className="kk-raster"
          style={{gridTemplateColumns: 'auto repeat(' + karte.breite + ', var(--kk-feld))'}}>
          <span className="kk-ecke" />
          {Array.from({length: karte.breite}, (_, x) => (
            <span className="kk-spalte" key={'s' + x}>{kSpalte(x)}</span>
          ))}
          {Array.from({length: karte.hoehe}, (_, y) => (
            <React.Fragment key={'z' + y}>
              <span className="kk-zeile">{y + 1}</span>
              {Array.from({length: karte.breite}, (_, x) => {
                const f = belegt.get(y * karte.breite + x);
                const z = karteFeld(karte, x, y);
                return (
                  <span key={x + ':' + y}
                    className={'kk-feld' + (f
                      ? ' figur ' + (f.art === 'held' ? 'held' : 'gegner')
                      : ' g' + K_ZEICHEN.indexOf(z))}
                    title={karteName(x, y) + ' · ' + (f ? f.name : kArt(z).name)}>
                    {f ? f.k : (z === K_BODEN ? '' : z)}
                  </span>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="kk-schau-fuss">
        1 Feld = {String(karte.feldMeter || K_METER).replace('.', ',')} m ·
        diagonal zählt eins. Was die Spielleitung nicht zeigt, steht hier nicht.
      </div>
    </div>
  );
};
