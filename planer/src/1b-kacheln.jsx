// ── Kacheln, Ansicht, Maßstab ────────────────────────────────────
// Eine Karte ist eine Kachelpyramide wie bei Kartendiensten: Stufe 0
// zeigt das ganze Bild in einer Kachel von 256 Pixeln, jede Stufe
// darueber verdoppelt die Aufloesung, die oberste zeigt das Bild 1:1.
//
//     <ordner>/<z>/<x>/<y>.webp
//
// Alle Koordinaten in Karten und Orten sind Pixel des Originalbilds.
// Damit bleibt jeder Ort an seiner Stelle, gleich in welcher Stufe man
// gerade schaut.
//
// Die Ansicht ist {zoom, x, y}: x und y sind der Bildpunkt in der Mitte
// des Fensters, zoom ist stetig und in Stufen gemessen — zoom = z heisst
// „Stufe z in voller Groesse“.
//
// Alles bis zur Markierung ist reine Rechnung (dev/pruefungen/planer-kacheln-test.js).

const KACHEL = 256;

// ── Masse aus dem Dateikopf ──────────────────────────────────────
// Bevor der Browser ein Bild von 20 000 Pixeln zu entpacken versucht —
// und dabei womoeglich scheitert —, steht im Kopf schon, wie gross es ist.
const bildMasse = (b) => {
  const u16be = (i) => (b[i] << 8) | b[i + 1];
  const u32be = (i) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const u16le = (i) => b[i] | (b[i + 1] << 8);
  const u24le = (i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  const text = (i, n) => String.fromCharCode.apply(null, b.subarray(i, i + n));
  if (b.length >= 24 && b[0] === 0x89 && text(1, 3) === 'PNG') {
    return { art: 'png', breite: u32be(16), hoehe: u32be(20) };
  }
  if (b.length >= 10 && text(0, 3) === 'GIF') {
    return { art: 'gif', breite: u16le(6), hoehe: u16le(8) };
  }
  if (b.length >= 30 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    const teil = text(12, 4);
    if (teil === 'VP8X') return { art: 'webp', breite: u24le(24) + 1, hoehe: u24le(27) + 1 };
    if (teil === 'VP8L') {
      const b0 = b[21], b1 = b[22], b2 = b[23], b3 = b[24];
      return { art: 'webp', breite: 1 + (((b1 & 0x3F) << 8) | b0), hoehe: 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6)) };
    }
    if (teil === 'VP8 ') return { art: 'webp', breite: u16le(26) & 0x3FFF, hoehe: u16le(28) & 0x3FFF };
    return null;
  }
  if (b.length >= 4 && b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xFF) { i++; continue; }
      if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
      const len = u16be(i + 2);
      // SOF0 … SOF15, ohne DHT (C4), JPG (C8) und DAC (CC)
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return { art: 'jpeg', breite: u16be(i + 7), hoehe: u16be(i + 5) };
      }
      if (m === 0xD9 || m === 0xDA) return null;
      i += 2 + len;
    }
    return null;
  }
  return null;
};

// ── Die Pyramide ─────────────────────────────────────────────────
const kachelPlan = (breite, hoehe, kachel) => {
  const k = kachel || KACHEL;
  const maxZ = Math.max(0, Math.ceil(Math.log2(Math.max(breite, hoehe) / k)));
  const stufen = [];
  let anzahl = 0;
  for (let z = 0; z <= maxZ; z++) {
    const faktor = Math.pow(2, maxZ - z);
    const b = Math.ceil(breite / faktor), h = Math.ceil(hoehe / faktor);
    const s = { z, faktor, breite: b, hoehe: h, spalten: Math.ceil(b / k), zeilen: Math.ceil(h / k) };
    anzahl += s.spalten * s.zeilen;
    stufen.push(s);
  }
  return { breite, hoehe, kachel: k, maxZ, stufen, anzahl };
};

// Welcher Ausschnitt einer Stufe in eine Kachel gehoert. Randkacheln
// sind kleiner als 256 Pixel — nichts wird aufgefuellt.
const kachelZiel = (plan, z, x, y) => {
  const s = plan.stufen[z], k = plan.kachel;
  const lx = x * k, ly = y * k;
  return { lx, ly, breite: Math.min(k, s.breite - lx), hoehe: Math.min(k, s.hoehe - ly) };
};

const kachelPfad = (ordner, z, x, y, format) => ordner + '/' + z + '/' + x + '/' + y + '.' + (format || 'webp');

// Alle Kacheln einer Stufe, zeilenweise.
const kachelnDerStufe = (plan, z) => {
  const s = plan.stufen[z], aus = [];
  for (let y = 0; y < s.zeilen; y++) for (let x = 0; x < s.spalten; x++) aus.push({ z, x, y });
  return aus;
};

// ── Die Ansicht ──────────────────────────────────────────────────
const ansichtMass = (a, plan) => Math.pow(2, a.zoom - plan.maxZ);      // Schirmpixel je Bildpixel
const bildZuSchirm = (p, a, g, plan) => {
  const s = ansichtMass(a, plan);
  return { x: (p.x - a.x) * s + g.breite / 2, y: (p.y - a.y) * s + g.hoehe / 2 };
};
const schirmZuBild = (p, a, g, plan) => {
  const s = ansichtMass(a, plan);
  return { x: (p.x - g.breite / 2) / s + a.x, y: (p.y - g.hoehe / 2) / s + a.y };
};
const ansichtEinpassen = (plan, g) => {
  const s = Math.min(g.breite / plan.breite, g.hoehe / plan.hoehe) * 0.94;
  return { zoom: plan.maxZ + Math.log2(Math.max(s, 1e-6)), x: plan.breite / 2, y: plan.hoehe / 2 };
};
const zoomGrenzen = (plan, g) => ({
  min: Math.min(ansichtEinpassen(plan, g).zoom, 0) - 1,
  max: plan.maxZ + 2,
});
const ansichtBegrenzen = (a, plan, g) => {
  const gr = zoomGrenzen(plan, g);
  const zoom = Math.max(gr.min, Math.min(gr.max, a.zoom));
  return { zoom, x: Math.max(0, Math.min(plan.breite, a.x)), y: Math.max(0, Math.min(plan.hoehe, a.y)) };
};
// Zoomen um einen Punkt: was unter dem Mauszeiger liegt, bleibt dort.
const zoomUm = (a, punkt, neuZoom, g, plan) => {
  const bild = schirmZuBild(punkt, a, g, plan);
  const z = ansichtBegrenzen({ ...a, zoom: neuZoom }, plan, g).zoom;
  const s = Math.pow(2, z - plan.maxZ);
  return ansichtBegrenzen({ zoom: z, x: bild.x - (punkt.x - g.breite / 2) / s, y: bild.y - (punkt.y - g.hoehe / 2) / s }, plan, g);
};
const verschieben = (a, dx, dy, plan, g) => {
  const s = ansichtMass(a, plan);
  return ansichtBegrenzen({ ...a, x: a.x - dx / s, y: a.y - dy / s }, plan, g);
};
// Welche Stufe geladen wird: die naechst schaerfere, sobald die jetzige
// merklich vergroessert erschiene.
const stufeFuer = (zoom, plan) => Math.max(0, Math.min(plan.maxZ, Math.ceil(zoom - 0.3)));

const KACHEL_HOECHSTENS = 600;
const sichtbareKacheln = (a, g, plan, z) => {
  const st = plan.stufen[z], k = plan.kachel;
  const s = ansichtMass(a, plan);
  const f = st.faktor;
  const oben = schirmZuBild({ x: 0, y: 0 }, a, g, plan);
  const unten = schirmZuBild({ x: g.breite, y: g.hoehe }, a, g, plan);
  const x0 = Math.max(0, Math.floor(oben.x / (k * f)));
  const y0 = Math.max(0, Math.floor(oben.y / (k * f)));
  const x1 = Math.min(st.spalten - 1, Math.floor(unten.x / (k * f)));
  const y1 = Math.min(st.zeilen - 1, Math.floor(unten.y / (k * f)));
  if (x1 < x0 || y1 < y0) return [];
  if ((x1 - x0 + 1) * (y1 - y0 + 1) > KACHEL_HOECHSTENS) return [];
  const aus = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ziel = kachelZiel(plan, z, x, y);
      const lo = bildZuSchirm({ x: ziel.lx * f, y: ziel.ly * f }, a, g, plan);
      aus.push({ z, x, y, links: lo.x, oben: lo.y, breite: ziel.breite * f * s, hoehe: ziel.hoehe * f * s });
    }
  }
  return aus;
};

// ── Maßstab und Lineal ───────────────────────────────────────────
const EINHEITEN = [
  { k: 'km', l: 'Kilometer', kurz: 'km', kmh: 4.5 },
  { k: 'mi', l: 'Meilen', kurz: 'mi', kmh: 3 },
  { k: 'm', l: 'Meter', kurz: 'm', kmh: 4500 },
  { k: 'ft', l: 'Fuß', kurz: 'ft', kmh: 15840 },
];
const einheit = (k) => EINHEITEN.find(e => e.k === k) || EINHEITEN[0];
const abstandPx = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const massstabAus = (a, b, laenge, einh) => {
  const d = abstandPx(a, b);
  if (!(laenge > 0) || !(d > 0)) return null;
  return { a: { x: Math.round(a.x), y: Math.round(a.y) }, b: { x: Math.round(b.x), y: Math.round(b.y) }, laenge: +laenge, einheit: einheit(einh).k };
};
const pxJeEinheit = (m) => abstandPx(m.a, m.b) / m.laenge;
const wegLaenge = (punkte, m) => {
  if (!m) return 0;
  let px = 0;
  for (let i = 1; i < punkte.length; i++) px += abstandPx(punkte[i - 1], punkte[i]);
  return px / pxJeEinheit(m);
};
const zahlText = (n) => {
  const r = n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100;
  return String(r).replace('.', ',');
};
const laengeText = (n, einh) => zahlText(n) + ' ' + einheit(einh).kurz;
// Wie lange man zu Fuss braucht, im normalen Tempo der Grundregeln
// (4,5 km in der Stunde, acht Stunden am Tag). Genauer rechnet Stufe 2.
const fussZeitText = (n, einh) => {
  const std = n / einheit(einh).kmh;
  if (!(std > 0)) return '';
  if (std < 1) return '≈ ' + Math.max(1, Math.round(std * 60)) + ' Min. zu Fuß';
  if (std < 8) return '≈ ' + zahlText(Math.round(std * 2) / 2) + ' Std. zu Fuß';
  const tage = Math.floor(std / 8), rest = Math.round(std - tage * 8);
  return '≈ ' + tage + (tage === 1 ? ' Tag' : ' Tage') + (rest ? ' ' + rest + ' Std.' : '') + ' zu Fuß';
};
// Die Leiste unten links: eine runde Laenge, die ungefaehr so breit ist
// wie gewuenscht.
const massstabLeiste = (m, a, plan, zielPx) => {
  if (!m) return null;
  const s = ansichtMass(a, plan);
  const roh = (zielPx || 110) / s / pxJeEinheit(m);
  const zehner = Math.pow(10, Math.floor(Math.log10(roh)));
  const schoen = [1, 2, 5, 10].map(f => f * zehner).filter(v => v <= roh).pop() || zehner;
  return { laenge: schoen, px: schoen * pxJeEinheit(m) * s, text: laengeText(schoen, m.einheit) };
};

// ── Kacheln erzeugen ─────────────────────────────────────────────
// Die Arbeit selbst — zeichnen und hochladen — kommt von aussen. Hier
// steht nur die Reihenfolge: Stufe fuer Stufe, in Buendeln hochladen,
// waehrend weiter gezeichnet wird, hoechstens zwei Buendel zugleich.
const kachelnErzeugen = async ({ plan, zeichne, hochladen, buendelBytes, parallel, melde, abgebrochen }) => {
  const grenze = buendelBytes || 2500000;
  const breite = parallel || 2;
  const m = melde || (() => {});
  const laufend = new Set();
  let buendel = [], summe = 0, fertig = 0, bytes = 0, fehler = null;
  const abschicken = async () => {
    if (!buendel.length) return;
    const b = buendel;
    buendel = []; summe = 0;
    const p = hochladen(b).then(() => { laufend.delete(p); }, (e) => { laufend.delete(p); fehler = fehler || e; });
    laufend.add(p);
    if (laufend.size >= breite) await Promise.race(laufend);
    if (fehler) throw fehler;
  };
  for (let z = 0; z <= plan.maxZ; z++) {
    if (typeof zeichne.stufe === 'function') await zeichne.stufe(z);
    for (const t of kachelnDerStufe(plan, z)) {
      if (abgebrochen && abgebrochen()) throw new Error('Abgebrochen.');
      if (fehler) throw fehler;
      const d = await zeichne(t.z, t.x, t.y);
      buendel.push(d); summe += d.bytes.length; bytes += d.bytes.length; fertig++;
      if (summe >= grenze || buendel.length >= 400) await abschicken();
      if (fertig % 8 === 0 || fertig === plan.anzahl) m('Kacheln: ' + fertig + ' von ' + plan.anzahl + ' · ' + planGroesse(bytes), fertig / plan.anzahl);
    }
  }
  await abschicken();
  await Promise.all(laufend);
  if (fehler) throw fehler;
  return { anzahl: fertig, bytes };
};

// Beim Austausch des Bilds bleiben Orte, wo sie auf der Karte waren:
// ihre Pixel werden mit dem Groessenverhaeltnis umgerechnet.
const punktSkalieren = (p, alt, neu) => ({ x: Math.round(p.x * neu.breite / alt.breite), y: Math.round(p.y * neu.hoehe / alt.hoehe) });

const ORT_SYMBOLE = ['📍', '🏰', '🏘', '🏠', '⛪', '🏛', '🍺', '⚓', '🌲', '⛰', '🕳', '🗿', '💀', '⚔', '🔥', '💎', '❓', '⭐'];
// ══ Ende der reinen Rechnung
