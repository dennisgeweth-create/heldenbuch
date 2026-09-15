// ── Spielersicht: Nebel, Handouts, der Tisch ─────────────────────
// Nebel liegt an der Karte (karte.nebel) und nicht unter dm: die Spieler
// brauchen ihn, um ihn zu zeichnen. Er ist eine Liste aufgedeckter
// Flaechen — Kreise, Vielecke, oder alles.
//
//     { an: true, flaechen: [ {art:'kreis', x, y, r}, {art:'vieleck', punkte:[…]}, {art:'alles'} ] }
//
// Er verdeckt die Anzeige, nicht die Kacheln selbst: wer die Adresse
// einer Kachel einer sichtbaren Karte kennt, bekommt sie. Wirklich geheim
// bleibt nur, was an einer verborgenen Karte haengt.
//
// Alles bis zur Markierung ist reine Rechnung.

const NEBEL_RADIEN = [{ k: 'klein', l: 'Klein', px: 45 }, { k: 'mittel', l: 'Mittel', px: 110 }, { k: 'gross', l: 'Groß', px: 240 }];
const nebelVon = (karte) => {
  const n = (karte && karte.nebel) || {};
  return { an: !!n.an, flaechen: Array.isArray(n.flaechen) ? n.flaechen : [] };
};
const flaecheAufgedeckt = (p, f) => {
  if (!f) return false;
  if (f.art === 'alles') return true;
  if (f.art === 'kreis') return Math.hypot(p.x - f.x, p.y - f.y) <= f.r;
  if (f.art === 'vieleck') return (f.punkte || []).length >= 3 && punktInPolygon(p, f.punkte);
  return false;
};
const punktAufgedeckt = (p, nebel) => !nebel || !nebel.an || (nebel.flaechen || []).some(f => flaecheAufgedeckt(p, f));
const nebelKreis = (p, r) => ({ art: 'kreis', x: Math.round(p.x), y: Math.round(p.y), r: Math.max(1, Math.round(r)) });

// Kreise entlang eines Stuecks Route: so dicht, dass sie sich ueberlappen
// und kein Streifen Nebel zwischen ihnen stehen bleibt.
const kreiseEntlang = (route, massstab, von, bis, sichtweite) => {
  if (!massstab || !(sichtweite > 0) || !(bis >= von)) return [];
  const rPx = sichtweite * pxJeEinheit(massstab);
  const schritt = sichtweite;
  const aus = [];
  for (let pos = von; pos < bis; pos += schritt) {
    const p = punktAufRoute(route, massstab, pos);
    if (p) aus.push(nebelKreis(p, rPx));
  }
  const ende = punktAufRoute(route, massstab, bis);
  if (ende) aus.push(nebelKreis(ende, rPx));
  return aus;
};

// Orte, die aufgehen, sobald der Nebel ueber ihnen weicht.
const orteImAufgedeckten = (orte, nebel) => (orte || []).filter(o => o.art === 'ort' && o.mitNebel && !o.sichtbar
  && typeof o.x === 'number' && (nebel.flaechen || []).some(f => flaecheAufgedeckt(o, f)));

// Wird der Nebel zu gross, fasst ein Kreis, der ganz in einem anderen
// liegt, nichts zusammen — er faellt weg.
const nebelAufraeumen = (flaechen) => {
  if (flaechen.some(f => f.art === 'alles')) return [{ art: 'alles' }];
  return flaechen.filter((f, i) => !(f.art === 'kreis' && flaechen.some((g, j) => j !== i && g.art === 'kreis'
    && Math.hypot(f.x - g.x, f.y - g.y) + f.r <= g.r && (g.r > f.r || j < i))));
};

// ── Was ein Spieler sieht ────────────────────────────────────────
// Dieselbe Regel wie planer_laden auf dem Server — hier fuer das
// Tischfenster, das mit der Anmeldung der Spielleitung laedt und doch nur
// zeigen darf, was die Runde sehen soll. Handouts an einzelne gehoeren
// nicht auf den Tisch.
const ohneDmFeld = (o) => { const { dm, ...rest } = o; return rest; };
const spielerSicht = (daten) => {
  const karten = (daten.karten || []).filter(k => k.sichtbar).map(ohneDmFeld);
  const offen = new Set(karten.map(k => k.id));
  const objekte = (daten.objekte || []).filter(o => o.sichtbar && (o.art === 'handout'
    ? !(o.an || []).length : offen.has(o.karteId))).map(ohneDmFeld);
  return { ...daten, dm: false, karten, objekte };
};

// ── Handouts ─────────────────────────────────────────────────────
const neuesHandout = () => ({ id: planNeueId('h'), karteId: '', art: 'handout', titel: 'Neues Handout', text: '', bild: '', an: [], sichtbar: false, dm: { notiz: '' } });
// Welche verteilten Handouts dieser Spieler noch nicht gesehen hat.
// Gesehen heisst: in dieser Fassung — ein geaenderter Brief kommt wieder.
const handoutFassung = (h) => h.id + ':' + String(h.geaendert || '');
const ungeseheneHandouts = (objekte, gesehen) => (objekte || [])
  .filter(o => o.art === 'handout' && o.sichtbar && !(gesehen || []).includes(handoutFassung(o)));

// ── Nachrichten an den Tisch ─────────────────────────────────────
// Das Tischfenster laeuft im selben Browser wie die Seite der
// Spielleitung; beide hoeren auf denselben Kanal.
const TISCH_KANAL = 'hb-planer-tisch';
const tischNachricht = (art, inhalt) => ({ art, ...inhalt, zeit: Date.now() });
// ══ Ende der reinen Rechnung
