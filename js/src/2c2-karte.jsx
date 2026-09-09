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

// ── Entfernung ───────────────────────────────────────────────────
// Diagonal zaehlt wie gerade — die Regel des Grundregelwerks. Die
// Variante 5-10-5 waere eine Zeile mehr und steht bewusst nicht hier:
// sie gehoert als Hausregel dazu oder gar nicht.
const karteWeit = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const karteMeter = (felder, karte) =>
  felder * ((karte && +karte.feldMeter) || K_METER);

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
const K_ABSATZ = /^\s*(FIGUREN|GEL[ÄA]NDE|ENTFERNUNGEN)\b/i;

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
const KarteZelle = ({ x, y, zeichen, figur, dran, gewaehlt, onKlick }) => (
  <button type="button"
    className={'kk-feld'
      + (figur ? ' figur ' + (figur.art === 'held' ? 'held' : 'gegner')
               : ' g' + K_ZEICHEN.indexOf(zeichen))
      + (dran ? ' dran' : '') + (gewaehlt ? ' gewaehlt' : '')}
    title={karteName(x, y) + (figur ? ' · ' + figur.name : ' · ' + kArt(zeichen).name)}
    aria-label={karteName(x, y) + (figur ? ', ' + figur.name : ', ' + kArt(zeichen).name)}
    onClick={()=>onKlick(x, y)}>
    {figur ? figur.k : (zeichen === K_BODEN ? '' : zeichen)}
  </button>
);

const KarteFeld = ({ kampf, setKampf, liste, amZug, onFrage, onLog }) => {
  const karte = kampf.karte || null;
  // Das Werkzeug in der Hand: eine Figur, die gesetzt werden will, oder
  // ein Gelände, das gemalt wird. Nichts in der Hand heißt: ein Tipp auf
  // eine Figur nimmt sie auf.
  const [werkzeug, setWerkzeug] = React.useState(null);
  const [masze, setMasze] = React.useState(null);
  const [kopiert, setKopiert] = React.useState(false);

  const schreiben = (neu) =>
    setKampf(k => k && ({...k, karte: karteAufraeumen(neu, k.teilnehmer)}));

  const einfuegen = (roh) => {
    const e = karteUebernehmen(roh, (kampf && kampf.teilnehmer) || []);
    if (!e.karte) return {gut: false, meldung: e.meldung};
    schreiben(e.karte);
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
        onLog({art: 'bewegung', wer: t.name, von: karteName(alt.x, alt.y),
               auf: karteName(x, y), felder: karteWeit(alt, {x, y})});
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

  const kopieren = () => {
    const text = karteText(karte, liste || [], {mitZahlen: true});
    const fertig = () => { setKopiert(true); setTimeout(()=>setKopiert(false), 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(fertig, ()=>{});
    } else { try { if (document.execCommand('copy')) fertig(); } catch (e) {} }
  };

  const wz = masze || {b: karte.breite, h: karte.hoehe};
  const inHand = werkzeug && werkzeug.art === 'figur' ? nachId.get(werkzeug.id) : null;

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
        <span className="kk-hinweis">
          {werkzeug && werkzeug.art === 'gelaende'
            ? 'Felder antippen zum Malen — noch einmal auf den Pinsel legt ihn weg'
            : inHand ? inHand.name + ' — wohin?'
            : 'Eine Figur antippen nimmt sie auf'}
        </span>
        {/* Wer in der Hand ist, kann auch wieder herunter. Ohne das ginge
            eine einzelne Figur nur ueber „alle herunternehmen" weg. */}
        {inHand && (karte.figuren || {})[werkzeug.id] && (
          <button type="button" className="bj-taste"
            onClick={()=>{ schreiben(karteFigurWeg(karte, werkzeug.id)); setWerkzeug(null); }}>
            ↩ Herunternehmen
          </button>
        )}
        {inHand && (
          <button type="button" className="bj-taste" onClick={()=>setWerkzeug(null)}>
            Abbrechen
          </button>
        )}
        <button type="button" className="bj-taste kk-rechts" onClick={kopieren}>
          {kopiert ? '✓ Kopiert' : '🗺 Karte kopieren'}
        </button>
      </div>

      <div className="kk-mitte">
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
                  return (
                    <KarteZelle key={x + ':' + y} x={x} y={y}
                      zeichen={karteFeld(karte, x, y)} figur={f}
                      dran={!!(f && amZug && f.id === amZug.id)}
                      gewaehlt={!!(werkzeug && werkzeug.art === 'figur' && f && f.id === werkzeug.id)}
                      onKlick={klick} />
                  );
                })}
              </React.Fragment>
            ))}
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

      <ListeEinfuegen anweisung={KARTE_KI_ANWEISUNG}
        aufschrift="Andere Karte einfügen"
        platzhalter={K_PLATZHALTER} onText={einfuegen} />
    </div>
  );
};
