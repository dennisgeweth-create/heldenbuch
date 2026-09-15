// ── Reisen: Gelände, Tempo, Tage, Wetter ─────────────────────────
// Eine Route ist ein Linienzug auf der Karte, jeder Abschnitt mit einem
// Gelände. Eine Reise faehrt sie ab — Tag fuer Tag, mit Tempo,
// Fortbewegung und Stunden am Tag — und sagt, wo die Gruppe am Abend
// steht, wie weit sie kam, wann ein Gewaltmarsch Rettungswuerfe kostet
// und wie das Wetter war.
//
// Zahlen der Grundregeln (SRD 5.1), in Kilometer so umgerechnet wie im
// deutschen Spielerhandbuch (1 Meile = 1,5 km):
//   Tempo   langsam 3 km/h (2 mph), normal 4,5 km/h (3 mph), schnell 6 km/h (4 mph)
//   Gewaltmarsch  jede Stunde ueber 8: KO-Rettungswurf SG 10 + Stunden ueber 8
//   Schwieriges Gelaende halbiert die Strecke.
//   Boote und Schiffe: die Geschwindigkeiten aus der Tabelle der Wasserfahrzeuge.
// Was dazwischen liegt — Huegel und Wueste zu drei Vierteln, Wagen
// abseits der Strasse, Sturm halbiert —, sind Vorgaben des Planers.
//
// Das Wetter nimmt dieselben Schluessel wie die Rast im Heldenbuch
// (RAST_NIEDERSCHLAG, RAST_TEMPERATUR, RAST_WIND in js/src/2m-rast.jsx).
// Nur so kann „Lager aufschlagen" die Rastbedingung gleich mitgeben;
// planer-reise-test.js prueft, dass beide Listen gleich bleiben.
//
// Alles bis zur Markierung ist reine Rechnung.

const GELAENDE = [
  { k: 'strasse', l: 'Straße oder Weg',  farbe: '#e8d9a8', fuss: 1,    wagen: 1 },
  { k: 'offen',   l: 'Offenes Land',     farbe: '#9fd27a', fuss: 1,    wagen: 0.75 },
  { k: 'huegel',  l: 'Hügel',            farbe: '#d6a35c', fuss: 0.75, wagen: 0.5 },
  { k: 'wald',    l: 'Wald',             farbe: '#4fa36a', fuss: 0.5,  wagen: 0.25 },
  { k: 'wueste',  l: 'Wüste',            farbe: '#f0c060', fuss: 0.75, wagen: 0.5 },
  { k: 'sumpf',   l: 'Sumpf',            farbe: '#7d8f5a', fuss: 0.5,  wagen: 0 },
  { k: 'gebirge', l: 'Gebirge',          farbe: '#b0a8a0', fuss: 0.5,  wagen: 0 },
  { k: 'schnee',  l: 'Schnee und Eis',   farbe: '#dfeefa', fuss: 0.5,  wagen: 0.25 },
  { k: 'wasser',  l: 'Fluss, See, Meer', farbe: '#5fb0e8', fuss: 0,    wagen: 0 },
];
const gelaende = (k) => GELAENDE.find(g => g.k === k) || GELAENDE[1];

const TEMPO = [
  { k: 'langsam', l: 'Langsam', kmh: 3,   mph: 2, folge: 'Heimlichkeit möglich' },
  { k: 'normal',  l: 'Normal',  kmh: 4.5, mph: 3, folge: '' },
  { k: 'schnell', l: 'Schnell', kmh: 6,   mph: 4, folge: '−5 auf passive Wahrnehmung' },
];
const tempo = (k) => TEMPO.find(t => t.k === k) || TEMPO[1];

// art: land — Tempo zaehlt; wagen — dazu die Wagenspalte des Gelaendes;
// wasser — nur auf Wasser, feste Geschwindigkeit, mit Mannschaft rund um die Uhr.
const FORTBEWEGUNG = [
  { k: 'fuss',        l: 'Zu Fuß',            art: 'land' },
  { k: 'reittier',    l: 'Reittier',          art: 'land' },
  { k: 'wagen',       l: 'Wagen oder Kutsche', art: 'wagen' },
  { k: 'ruderboot',   l: 'Ruderboot',         art: 'wasser', mph: 1.5, stunden: 8 },
  { k: 'kielboot',    l: 'Kielboot',          art: 'wasser', mph: 1,   stunden: 24 },
  { k: 'segelschiff', l: 'Segelschiff',       art: 'wasser', mph: 2,   stunden: 24 },
  { k: 'kriegsschiff', l: 'Kriegsschiff',     art: 'wasser', mph: 2.5, stunden: 24 },
  { k: 'langschiff',  l: 'Langschiff',        art: 'wasser', mph: 3,   stunden: 24 },
  { k: 'galeere',     l: 'Galeere',           art: 'wasser', mph: 4,   stunden: 24 },
];
const fortbewegung = (k) => FORTBEWEGUNG.find(f => f.k === k) || FORTBEWEGUNG[0];

const KM_JE_MEILE = 1.5;
const GEWALTMARSCH_AB = 8;

// Wie weit in einer Stunde, in der Einheit der Karte.
const JE_EINHEIT = { km: { km: 1, mi: 1 / KM_JE_MEILE }, mi: { km: KM_JE_MEILE, mi: 1 }, m: { km: 1000, mi: 1000 * KM_JE_MEILE }, ft: { km: 3280.84, mi: 5280 } };
const grundTempo = (optionen, einh) => {
  const f = fortbewegung(optionen.fortbewegung);
  const u = JE_EINHEIT[einh] || JE_EINHEIT.km;
  if (f.art === 'wasser') return (einh === 'km' || einh === 'm') ? f.mph * KM_JE_MEILE * u.km : f.mph * u.mi;
  const t = tempo(optionen.tempo);
  return (einh === 'km' || einh === 'm') ? t.kmh * u.km : t.mph * u.mi;
};
// Wie schnell auf diesem Gelaende — 0 heisst: geht nicht.
const tempoAuf = (gel, optionen, einh, wetter) => {
  const f = fortbewegung(optionen.fortbewegung);
  const g = gelaende(gel);
  let faktor;
  if (f.art === 'wasser') faktor = g.k === 'wasser' ? 1 : 0;
  else if (f.art === 'wagen') faktor = g.wagen;
  else faktor = g.fuss;
  if (faktor && wetter && f.art !== 'wasser' && (wetter.niederschlag === 'sturm' || wetter.wind === 'orkan')) faktor *= 0.5;
  if (faktor && wetter && f.art === 'wasser' && wetter.wind === 'orkan') faktor = 0;
  return grundTempo(optionen, einh) * faktor;
};
const warumNicht = (gel, optionen, wetter) => {
  const f = fortbewegung(optionen.fortbewegung);
  const g = gelaende(gel);
  if (f.art === 'wasser') return g.k === 'wasser' ? 'Bei Sturm läuft kein Schiff aus.' : f.l + ' fährt nicht über ' + g.l + '.';
  if (g.k === 'wasser') return 'Über ' + g.l + ' geht es nur mit Boot oder Schiff.';
  return f.l + ' kommt durch ' + g.l + ' nicht durch.';
};

// ── Die Route ────────────────────────────────────────────────────
const routeAbschnitte = (route, m) => {
  const p = route.punkte || [];
  const aus = [];
  const jePx = m ? pxJeEinheit(m) : 0;
  for (let i = 1; i < p.length; i++) {
    const px = abstandPx(p[i - 1], p[i]);
    aus.push({ i: i - 1, von: p[i - 1], bis: p[i], px, laenge: jePx ? px / jePx : 0,
               gelaende: (route.gelaende || [])[i - 1] || route.standard || 'offen' });
  }
  return aus;
};
const routeLaenge = (route, m) => routeAbschnitte(route, m).reduce((s, a) => s + a.laenge, 0);
// Rueckwaerts ist dieselbe Route mit umgedrehten Punkten und Abschnitten.
const routeInRichtung = (route, richtung) => richtung !== 'zurueck' ? route
  : { ...route, punkte: [...(route.punkte || [])].reverse(), gelaende: [...(route.gelaende || [])].slice(0, Math.max(0, (route.punkte || []).length - 1)).reverse() };
// Der Punkt, der pos Einheiten vom Start entfernt liegt.
const punktAufRoute = (route, m, pos) => {
  const ab = routeAbschnitte(route, m);
  if (!ab.length) return (route.punkte || [])[0] || null;
  let rest = Math.max(0, pos);
  for (const a of ab) {
    if (rest <= a.laenge || a === ab[ab.length - 1]) {
      const t = a.laenge ? Math.min(1, rest / a.laenge) : 1;
      return { x: Math.round(a.von.x + (a.bis.x - a.von.x) * t), y: Math.round(a.von.y + (a.bis.y - a.von.y) * t) };
    }
    rest -= a.laenge;
  }
  return null;
};

// ── Der Plan: Tag fuer Tag ───────────────────────────────────────
// Ohne Angabe: acht Stunden an Land, bei Schiffen mit Mannschaft rund um die Uhr.
const reiseStunden = (o) => {
  const f = fortbewegung(o && o.fortbewegung);
  return Math.max(1, Math.min(24, +(o && o.stunden) || f.stunden || 8));
};
// start: bereits zurueckgelegte Strecke. wetter: je Tag (Index ab 0 vom
// Start aus) — fehlt es, wird ohne Wetter gerechnet.
const REISE_HOECHSTENS_TAGE = 400;
const reisePlan = ({ route, massstab, optionen, start, wetter }) => {
  const einh = massstab ? massstab.einheit : 'km';
  const o = { tempo: 'normal', fortbewegung: 'fuss', ...(optionen || {}) };
  const f = fortbewegung(o.fortbewegung);
  const stundenJeTag = reiseStunden(o);
  const ab = routeAbschnitte(route, massstab);
  const gesamt = ab.reduce((s, a) => s + a.laenge, 0);
  const tage = [];
  const warnungen = [];
  if (!massstab) warnungen.push('Die Karte hat noch keinen Maßstab.');
  if (ab.length === 0) warnungen.push('Die Route hat keine Strecke.');
  if (!massstab || !ab.length) return { tage, gesamt, einheit: einh, warnungen, angekommen: false, stundenJeTag };

  let pos = Math.max(0, Math.min(gesamt, +start || 0));
  let blockiert = null;
  const abschnittBei = (p) => {
    let s = 0;
    for (const a of ab) { if (p < s + a.laenge - 1e-9) return { a, rest: s + a.laenge - p }; s += a.laenge; }
    return null;
  };
  while (pos < gesamt - 1e-9 && tage.length < REISE_HOECHSTENS_TAGE && !blockiert) {
    const nr = tage.length;
    const w = wetter && wetter[nr] ? wetter[nr] : null;
    let stunden = 0;
    const von = pos;
    const teile = [];
    while (stunden < stundenJeTag - 1e-9 && pos < gesamt - 1e-9) {
      const hier = abschnittBei(pos);
      if (!hier) break;
      const v = tempoAuf(hier.a.gelaende, o, einh, w);
      if (!(v > 0)) { blockiert = { tag: nr, abschnitt: hier.a.i, text: warumNicht(hier.a.gelaende, o, w) }; break; }
      const brauche = hier.rest / v;
      const habe = stundenJeTag - stunden;
      const h = Math.min(brauche, habe);
      const strecke = h === brauche ? hier.rest : h * v;
      pos = h === brauche ? pos + hier.rest : pos + strecke;
      stunden += h;
      const letzter = teile[teile.length - 1];
      if (letzter && letzter.gelaende === hier.a.gelaende) { letzter.strecke += strecke; letzter.stunden += h; }
      else teile.push({ gelaende: hier.a.gelaende, strecke, stunden: h });
    }
    if (stunden <= 1e-9) break;
    // Gewaltmarsch: jede angefangene Stunde ueber acht, am Ende der Stunde.
    const gewaltmarsch = [];
    if (f.art !== 'wasser') {
      for (let h = GEWALTMARSCH_AB + 1; h <= Math.ceil(stunden - 1e-9); h++) gewaltmarsch.push({ stunde: h, sg: 10 + (h - GEWALTMARSCH_AB) });
    }
    tage.push({ nr: nr + 1, von, bis: pos, strecke: pos - von, stunden, teile, gewaltmarsch,
                wetter: w, angekommen: pos >= gesamt - 1e-9 });
  }
  if (blockiert) warnungen.push('Tag ' + (blockiert.tag + 1) + ', Abschnitt ' + (blockiert.abschnitt + 1) + ': ' + blockiert.text);
  if (tage.length >= REISE_HOECHSTENS_TAGE) warnungen.push('Mehr als ' + REISE_HOECHSTENS_TAGE + ' Tage — die Rechnung hört hier auf.');
  if (f.art !== 'wasser' && stundenJeTag > GEWALTMARSCH_AB) warnungen.push('Mehr als acht Stunden am Tag: Gewaltmarsch.');
  return { tage, gesamt, einheit: einh, warnungen, blockiert, stundenJeTag,
           angekommen: !blockiert && pos >= gesamt - 1e-9 };
};

const stundenText = (h) => {
  const ganz = Math.floor(h + 1e-9), min = Math.round((h - ganz) * 60);
  if (min === 60) return (ganz + 1) + ' Std.';
  return ganz + (min ? ':' + String(min).padStart(2, '0') : '') + ' Std.';
};
// Verpflegung nach den Grundregeln: eine Tagesration und gut vier Liter
// Wasser je Person und Tag.
const verpflegung = (tage, personen) => ({ rationen: tage * Math.max(0, personen || 0), wasserLiter: tage * Math.max(0, personen || 0) * 4 });

// ── Wetter ───────────────────────────────────────────────────────
const WETTER_NIEDERSCHLAG = ['klar', 'leicht', 'wolken', 'regen', 'sturm'];
const WETTER_TEMPERATUR = ['glut', 'heiss', 'warm', 'mild', 'kuehl', 'kalt', 'arktis'];
const WETTER_WIND = ['flaute', 'maessig', 'stark', 'boeen', 'orkan'];
const WETTER_WORTE = {
  klar: 'Wolkenlos', leicht: 'Leicht bewölkt', wolken: 'Bewölkt oder Nebel', regen: 'Regen, Hagel, Schnee', sturm: 'Starkregen, Sturm',
  glut: 'Unerträglich heiß', heiss: 'Heiß', warm: 'Warm', mild: 'Moderat', kuehl: 'Kühl', kalt: 'Kalt', arktis: 'Arktisch kalt',
  flaute: 'Flaute', maessig: 'Mäßiger Wind', stark: 'Starker Wind', boeen: 'Starke Böen', orkan: 'Sturm',
};
const WETTER_ZEICHEN = { klar: '☀', leicht: '🌤', wolken: '☁', regen: '🌧', sturm: '⛈' };

const KLIMA = [
  { k: 'gemaessigt', l: 'Gemäßigt' },
  { k: 'kalt',       l: 'Kalt, nordisch' },
  { k: 'arktisch',   l: 'Arktisch' },
  { k: 'heiss',      l: 'Heiß, trocken' },
  { k: 'tropisch',   l: 'Tropisch, feucht' },
  { k: 'kueste',     l: 'Küste, See' },
];
const JAHRESZEITEN = [
  { k: 'fruehling', l: 'Frühling' }, { k: 'sommer', l: 'Sommer' },
  { k: 'herbst', l: 'Herbst' }, { k: 'winter', l: 'Winter' },
];
// Gewichte je Stufe, in der Reihenfolge der Listen oben. Eigene Vorgaben
// des Planers, keine Regeltabelle: sie sollen plausibles Wetter geben,
// das die Spielleitung jederzeit umstellt.
const WETTER_TAFEL = {
  gemaessigt: {
    temperatur: { fruehling: [0, 0, 2, 5, 3, 1, 0], sommer: [0, 2, 5, 3, 1, 0, 0], herbst: [0, 0, 1, 4, 4, 2, 0], winter: [0, 0, 0, 1, 3, 5, 1] },
    niederschlag: { fruehling: [2, 3, 3, 3, 1], sommer: [4, 3, 2, 2, 1], herbst: [1, 2, 4, 3, 1], winter: [2, 2, 3, 3, 1] },
    wind: [4, 4, 2, 1, 0.3],
  },
  kalt: {
    temperatur: { fruehling: [0, 0, 0, 2, 4, 4, 1], sommer: [0, 0, 2, 5, 3, 1, 0], herbst: [0, 0, 0, 1, 4, 4, 2], winter: [0, 0, 0, 0, 1, 5, 4] },
    niederschlag: { fruehling: [2, 2, 3, 3, 1], sommer: [2, 3, 3, 3, 1], herbst: [1, 2, 4, 3, 2], winter: [2, 2, 3, 3, 2] },
    wind: [3, 4, 3, 2, 0.6],
  },
  arktisch: {
    temperatur: { fruehling: [0, 0, 0, 0, 1, 4, 5], sommer: [0, 0, 0, 1, 4, 4, 1], herbst: [0, 0, 0, 0, 1, 4, 5], winter: [0, 0, 0, 0, 0, 2, 8] },
    niederschlag: { fruehling: [3, 2, 3, 2, 2], sommer: [3, 3, 3, 2, 1], herbst: [2, 2, 3, 3, 2], winter: [3, 2, 2, 2, 3] },
    wind: [2, 3, 3, 3, 1],
  },
  heiss: {
    temperatur: { fruehling: [1, 4, 4, 2, 0, 0, 0], sommer: [4, 5, 2, 0, 0, 0, 0], herbst: [1, 3, 4, 2, 0, 0, 0], winter: [0, 1, 3, 4, 2, 0, 0] },
    niederschlag: { fruehling: [7, 3, 1, 0.3, 0.3], sommer: [9, 2, 0.5, 0.2, 0.3], herbst: [7, 3, 1, 0.3, 0.3], winter: [5, 3, 2, 1, 0.3] },
    wind: [4, 3, 2, 1, 0.5],
  },
  tropisch: {
    temperatur: { fruehling: [0, 4, 5, 1, 0, 0, 0], sommer: [1, 5, 4, 0, 0, 0, 0], herbst: [0, 4, 5, 1, 0, 0, 0], winter: [0, 2, 5, 3, 0, 0, 0] },
    niederschlag: { fruehling: [1, 2, 3, 4, 2], sommer: [1, 2, 2, 4, 3], herbst: [1, 2, 3, 4, 2], winter: [2, 3, 3, 2, 1] },
    wind: [4, 3, 2, 1, 0.4],
  },
  kueste: {
    temperatur: { fruehling: [0, 0, 1, 5, 4, 1, 0], sommer: [0, 1, 5, 4, 1, 0, 0], herbst: [0, 0, 1, 4, 5, 1, 0], winter: [0, 0, 0, 2, 5, 3, 0] },
    niederschlag: { fruehling: [2, 3, 3, 3, 1], sommer: [3, 3, 3, 2, 1], herbst: [1, 2, 3, 4, 2], winter: [1, 2, 3, 4, 2] },
    wind: [1, 3, 4, 2, 1],
  },
};
const gewichtetWaehlen = (gewichte, zufall) => {
  const summe = gewichte.reduce((s, g) => s + g, 0);
  let r = zufall() * summe;
  for (let i = 0; i < gewichte.length; i++) { r -= gewichte[i]; if (r < 0) return i; }
  return gewichte.length - 1;
};
// Wetter haelt sich: mit einer von zwei Chancen bleibt jeder Teil wie am
// Vortag oder rueckt nur eine Stufe weiter.
const wetterWuerfeln = (klima, jahreszeit, vortag, zufall) => {
  const z = zufall || Math.random;
  const t = WETTER_TAFEL[klima] || WETTER_TAFEL.gemaessigt;
  const js = JAHRESZEITEN.some(j => j.k === jahreszeit) ? jahreszeit : 'sommer';
  const teil = (liste, gewichte, alt) => {
    if (alt && liste.includes(alt) && z() < 0.5) {
      const i = liste.indexOf(alt);
      const schritt = z();
      const j = schritt < 0.6 ? i : schritt < 0.8 ? i - 1 : i + 1;
      const k = Math.max(0, Math.min(liste.length - 1, j));
      return gewichte[k] > 0 ? liste[k] : alt;
    }
    return liste[gewichtetWaehlen(gewichte, z)];
  };
  return {
    temperatur: teil(WETTER_TEMPERATUR, t.temperatur[js], vortag && vortag.temperatur),
    niederschlag: teil(WETTER_NIEDERSCHLAG, t.niederschlag[js], vortag && vortag.niederschlag),
    wind: teil(WETTER_WIND, t.wind, vortag && vortag.wind),
  };
};
const wetterText = (w) => w ? [WETTER_WORTE[w.niederschlag], WETTER_WORTE[w.temperatur], WETTER_WORTE[w.wind]].filter(Boolean).join(' · ') : '';
// Ein Zufall mit Samen, damit dieselbe Reise dasselbe Wetter behaelt,
// bis jemand neu wuerfelt (mulberry32).
const samenZufall = (samen) => {
  let a = (samen >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const wetterFuerTage = (anzahl, klima, jahreszeit, samen, vorgaben) => {
  const z = samenZufall(samen);
  const aus = [];
  for (let i = 0; i < anzahl; i++) {
    const gewuerfelt = wetterWuerfeln(klima, jahreszeit, aus[i - 1], z);
    aus.push(vorgaben && vorgaben[i] ? vorgaben[i] : gewuerfelt);
  }
  return aus;
};

// ── Uebergabe an das Heldenbuch ──────────────────────────────────
// Der Planer schreibt nie selbst in Boegen oder in die Chronik. Er legt
// einen Auftrag in den gemeinsamen Speicher; das Heldenbuch — im DM-Modus,
// im selben Abenteuer — oeffnet daraus seinen eigenen Dialog, vorbelegt.
// Alles, was dort an Boegen haengt, laeuft dann den gewohnten Weg.
const PLANER_AUFTRAG = 'hb_planer_auftrag';
const PLANER_QUITTUNG = 'hb_planer_quittung';
const AUFTRAG_FRIST_MS = 30 * 60 * 1000;
const auftragZeit = (advId, stunden) => ({ art: 'zeit', advId, stunden: Math.max(0, Math.round(stunden)) });
const auftragRast = (advId, wetter, text) => ({ art: 'rast', advId, rastArt: 'lang', basis: 2,
  niederschlag: (wetter && wetter.niederschlag) || 'leicht', temperatur: (wetter && wetter.temperatur) || 'mild',
  wind: (wetter && wetter.wind) || 'flaute', massnahmen: [], text: String(text || '').slice(0, 160) });
const auftragGewaltmarsch = (advId, sg, text) => ({ art: 'probe', advId, probeArt: 'rw', wert: 'con', sg: Math.max(1, Math.min(40, sg)), text: String(text || '').slice(0, 160) });
// ══ Ende der reinen Rechnung
