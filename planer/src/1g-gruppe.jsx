// ── Heldengruppen: Stand, Spur, Sicht ────────────────────────────
// Eine Heldengruppe (Art gruppe, an einer Karte) ist die Runde auf der
// Karte: welche Boegen dazugehoeren, wie weit sie sieht, und ihre Spur —
// jeder Punkt, an dem sie stand, mit der Zeit der Chronik. Der letzte
// Punkt der Spur ist, wo sie jetzt ist.
//
//     { helden: ['charId', …], heldenNamen: {charId: 'Armin'}, sichtweite: 5,
//       spur: [{zeit, x, y, art: 'start'|'zug'|'reise'|'teilung'|'vereint'}],
//       spurFuerSpieler: false, aus: 'g_…' }
//
// Zieht die Spielleitung die Gruppe, weicht der Nebel entlang des Wegs —
// so weit, wie die Gruppe sieht. Ob Spieler die ganze Spur bekommen oder
// nur den letzten Punkt, entscheidet der Server (planObjAntwort).
//
// Alles bis zur Markierung ist reine Rechnung.

const GRUPPE_SYMBOLE = ['🛡', '⚔', '🏹', '🔥', '🧭', '⭐'];
const SPUR_HOECHSTENS = 2000;

const gruppePosition = (g) => {
  const s = (g && g.spur) || [];
  return s.length ? s[s.length - 1] : null;
};

const neueGruppe = (karteId, p, zeit, helden, namen) => ({
  id: planNeueId('g'), karteId, art: 'gruppe', name: 'Heldengruppe', symbol: '🛡', sichtbar: true,
  helden: [...(helden || [])], heldenNamen: { ...(namen || {}) }, sichtweite: 5, spurFuerSpieler: false,
  spur: [{ zeit: Math.round(+zeit || 0), x: Math.round(p.x), y: Math.round(p.y), art: 'start' }], dm: { notiz: '' },
});

// Die Spur waechst nicht ohne Ende: bei sehr langen Kampagnen fallen die
// aeltesten Zwischenpunkte weg, der erste bleibt.
const spurAnhaengen = (spur, punkte) => {
  const neu = [...(spur || []), ...punkte];
  return neu.length > SPUR_HOECHSTENS ? [neu[0], ...neu.slice(neu.length - SPUR_HOECHSTENS + 1)] : neu;
};

// Die Gruppe zieht an einen Punkt. Zurueck: die Gruppe mit neuer Spur und
// die Kreise, die der Nebel dabei aufgibt (entlang der geraden Linie).
const gruppeZiehen = (g, ziel, zeit, massstab, art) => {
  const von = gruppePosition(g);
  const punkt = { zeit: Math.round(+zeit || 0), x: Math.round(ziel.x), y: Math.round(ziel.y), art: art || 'zug' };
  const gruppe = { ...g, spur: spurAnhaengen(g.spur, [punkt]) };
  let kreise = [];
  if (massstab && (+g.sichtweite || 0) > 0) {
    const linie = { punkte: von ? [von, punkt] : [punkt, punkt], gelaende: ['offen'] };
    kreise = kreiseEntlang(linie, massstab, 0, routeLaenge(linie, massstab), +g.sichtweite);
    if (!kreise.length) kreise = [nebelKreis(punkt, +g.sichtweite * pxJeEinheit(massstab))];
  }
  return { gruppe, kreise };
};

// Die Punkte einer Route zwischen zwei Positionen, samt der Ecken dazwischen
// — damit die Spur einer Reise der Route folgt und nicht quer uebers Land.
const routenPunkteZwischen = (route, m, von, bis) => {
  if (!m || !(bis > von)) return [];
  const aus = [punktAufRoute(route, m, von)];
  let s = 0;
  for (const a of routeAbschnitte(route, m)) {
    s += a.laenge;
    if (s > von + 1e-9 && s < bis - 1e-9) aus.push({ x: Math.round(a.bis.x), y: Math.round(a.bis.y) });
  }
  aus.push(punktAufRoute(route, m, bis));
  return aus.filter(Boolean);
};
// Eine Reise zieht die Gruppe mit: Punkte der Route mit Zeiten, verteilt
// ueber die Stunden des Tags.
const gruppeReist = (g, punkte, zeitVon, stunden, massstab) => {
  if (!punkte.length) return { gruppe: g, kreise: [] };
  const linie = { punkte, gelaende: punkte.slice(1).map(() => 'offen') };
  const gesamt = routeLaenge(linie, massstab) || 1;
  let s = 0;
  const neu = punkte.map((p, i) => {
    if (i > 0) s += abstandPx(punkte[i - 1], p) / (massstab ? pxJeEinheit(massstab) : 1);
    return { zeit: Math.round((+zeitVon || 0) + stunden * (s / gesamt)), x: p.x, y: p.y, art: 'reise' };
  });
  const letzte = gruppePosition(g);
  const ohneDoppel = letzte && neu.length && neu[0].x === letzte.x && neu[0].y === letzte.y ? neu.slice(1) : neu;
  const kreise = massstab && (+g.sichtweite || 0) > 0 ? kreiseEntlang(linie, massstab, 0, gesamt, +g.sichtweite) : [];
  return { gruppe: { ...g, spur: spurAnhaengen(g.spur, ohneDoppel) }, kreise };
};

const spurLaenge = (g, m) => {
  const s = (g && g.spur) || [];
  if (!m || s.length < 2) return 0;
  let px = 0;
  for (let i = 1; i < s.length; i++) px += abstandPx(s[i - 1], s[i]);
  return px / pxJeEinheit(m);
};

// Aufteilen: wer ausgewaehlt ist, zieht als neue Gruppe los — vom selben
// Punkt aus. Die alte behaelt ihre Spur, die neue beginnt am Teilungspunkt.
const gruppeTeilen = (g, heldenIds, neueId, zeit) => {
  const weg = (g.helden || []).filter(h => heldenIds.includes(h));
  if (!weg.length || weg.length === (g.helden || []).length) return null;
  const hier = gruppePosition(g) || { x: 0, y: 0 };
  const namen = g.heldenNamen || {};
  const neue = {
    ...g, id: neueId, name: weg.map(h => namen[h] || h).join(', '),
    helden: weg, heldenNamen: Object.fromEntries(weg.map(h => [h, namen[h] || h])),
    spur: [{ zeit: Math.round(+zeit || 0), x: hier.x, y: hier.y, art: 'teilung' }], aus: g.id, dm: { notiz: '' },
  };
  const bleibt = (g.helden || []).filter(h => !heldenIds.includes(h));
  return { alte: { ...g, helden: bleibt, heldenNamen: Object.fromEntries(bleibt.map(h => [h, namen[h] || h])) }, neue };
};

// Vereinen: die zweite Gruppe geht in der ersten auf. Steht sie woanders,
// zieht die erste nicht — die Spielleitung setzt die Gruppe danach selbst.
const gruppenVereinen = (ziel, quelle, zeit) => {
  const helden = [...new Set([...(ziel.helden || []), ...(quelle.helden || [])])];
  const namen = { ...(quelle.heldenNamen || {}), ...(ziel.heldenNamen || {}) };
  const hier = gruppePosition(ziel);
  const spur = hier ? spurAnhaengen(ziel.spur, [{ zeit: Math.round(+zeit || 0), x: hier.x, y: hier.y, art: 'vereint' }]) : ziel.spur;
  // Der Name der groesseren Gruppe bleibt: wer die abgeteilte „Bea“ mit der
  // Heldengruppe vereint, will wieder die Heldengruppe haben.
  const name = (quelle.helden || []).length > (ziel.helden || []).length ? quelle.name : ziel.name;
  return { ...ziel, name, symbol: name === quelle.name ? quelle.symbol : ziel.symbol, helden, heldenNamen: namen, spur };
};

// Welche Boegen noch keiner Gruppe auf dieser Karte angehoeren.
const heldenOhneGruppe = (helden, gruppen, ausser) => {
  const vergeben = new Set((gruppen || []).filter(g => g.id !== ausser).flatMap(g => g.helden || []));
  return (helden || []).filter(h => !vergeben.has(h.id));
};
// ══ Ende der reinen Rechnung
