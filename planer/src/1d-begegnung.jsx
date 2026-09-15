// ── Regionen und Zufallsbegegnungen ──────────────────────────────
// Eine Region ist eine Flaeche auf der Karte — ein Wald, ein Pass, das
// ganze Tal. Unter dm traegt sie eine Begegnungstabelle: wie oft geprueft
// wird, ab welchem Wurf etwas geschieht (tags und nachts getrennt), und
// was dann geschehen kann, gewichtet.
//
// Eine Reise prueft je Wache: am Ende jeder Wache steht die Gruppe
// irgendwo — unterwegs auf der Route oder schon im Lager —, und dort
// entscheidet die innerste Region, welche Tabelle gilt.
//
// Ein Kampf verweist auf eine Begegnung aus dem Heldenbuch (📚 Datenbank
// › Begegnungen). Der Planer legt keine Gegner an; er sagt dem
// Kampftracker nur, welche Begegnung er laden soll.
//
// Alles bis zur Markierung ist reine Rechnung.

const REGION_FARBEN = ['#e05a5a', '#e8b84b', '#5fbf85', '#5fb0e8', '#9b7fd0', '#d98ad0', '#c8c8c8'];
const WACHE_STUNDEN = [1, 2, 4, 6, 8, 12, 24];
const BEGEGNUNG_ZEIT = [{ k: 'immer', l: 'Tag und Nacht' }, { k: 'tag', l: 'Nur tags' }, { k: 'nacht', l: 'Nur nachts' }];
const BEGEGNUNG_ART = [{ k: 'kampf', l: '⚔ Kampf' }, { k: 'ereignis', l: '✦ Ereignis' }];

const neueTabelle = () => ({ jeStunden: 8, wuerfel: 20, ab: 18, abNacht: 18, eintraege: [] });
const neuerTabellenEintrag = (id) => ({ id, gewicht: 1, zeit: 'immer', art: 'kampf', begegnungId: '', text: '' });

// ── Flaechen ─────────────────────────────────────────────────────
const polygonFlaeche = (poly) => {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return Math.abs(s) / 2;
};
const punktInPolygon = (p, poly) => {
  let drin = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) drin = !drin;
  }
  return drin;
};
// Der Schwerpunkt — dort steht der Name. Bei entarteten Flaechen die Mitte der Punkte.
const polygonMitte = (poly) => {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j].x * poly[i].y - poly[i].x * poly[j].y;
    a += f; cx += (poly[j].x + poly[i].x) * f; cy += (poly[j].y + poly[i].y) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const n = Math.max(1, poly.length);
    return { x: poly.reduce((s, p) => s + p.x, 0) / n, y: poly.reduce((s, p) => s + p.y, 0) / n };
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
};
// Die innerste Region, in der der Punkt liegt: der Wald im Tal gilt vor dem Tal.
const regionAn = (p, regionen) => {
  if (!p) return null;
  const drin = (regionen || []).filter(r => (r.punkte || []).length >= 3 && punktInPolygon(p, r.punkte));
  drin.sort((a, b) => polygonFlaeche(a.punkte) - polygonFlaeche(b.punkte));
  return drin[0] || null;
};
const flaecheText = (poly, m) => {
  if (!m) return '';
  const e = pxJeEinheit(m);
  return zahlText(polygonFlaeche(poly) / (e * e)) + ' ' + einheit(m.einheit).kurz + '²';
};

// ── Der Wurf ─────────────────────────────────────────────────────
const istNacht = (uhr) => { const h = ((uhr % 24) + 24) % 24; return h >= 20 || h < 6; };
const tabelleVon = (region) => (region && region.dm && region.dm.tabelle) || null;

const begegnungPruefen = (tabelle, nacht, zufall) => {
  const t = { ...neueTabelle(), ...(tabelle || {}) };
  const w = Math.max(2, +t.wuerfel || 20);
  const ab = Math.max(1, +(nacht ? t.abNacht : t.ab) || w);
  const wurf = 1 + Math.floor(zufall() * w);
  if (wurf < ab) return { wurf, ab, treffer: false, eintrag: null };
  const passend = (t.eintraege || []).filter(e => (+e.gewicht || 0) > 0
    && (e.zeit === 'immer' || !e.zeit || (e.zeit === 'nacht') === nacht));
  if (!passend.length) return { wurf, ab, treffer: true, eintrag: null };
  return { wurf, ab, treffer: true, eintrag: passend[gewichtetWaehlen(passend.map(e => +e.gewicht), zufall)] };
};

// Wo die Gruppe nach t Stunden eines Reisetags steht.
const posNachStunden = (tag, t) => {
  let pos = tag.von, rest = Math.max(0, t);
  for (const teil of tag.teile || []) {
    if (rest <= teil.stunden) return pos + (teil.stunden ? teil.strecke * rest / teil.stunden : 0);
    pos += teil.strecke; rest -= teil.stunden;
  }
  return tag.bis;
};

const wuerfelSamen = (samen, tagNr, nochmal) => (((+samen || 1) * 31 + tagNr * 7919 + (nochmal || 0) * 104729) >>> 0) || 1;

// Die Wachen eines Reisetags: am Ende jeder Wache ein Wurf auf die
// Tabelle der Region, in der die Gruppe dann steht. 24 Stunden ab dem
// Aufbruch, unterwegs und im Lager.
const tagesPruefungen = ({ tag, route, massstab, regionen, startStunde, zufall }) => {
  const aus = [];
  const start = Number.isFinite(+startStunde) ? +startStunde : 8;
  const wachen = new Map();
  // Jede Region hat ihren eigenen Takt. Geprueft wird zu jeder Stunde, zu
  // der irgendeine Tabelle faellig ist, und dort zaehlt nur die Region,
  // in der die Gruppe dann steht.
  (regionen || []).forEach(r => { const t = tabelleVon(r); if (t) wachen.set(r.id, Math.max(1, +t.jeStunden || 8)); });
  const takte = [...new Set(wachen.values())].sort((a, b) => a - b);
  const stunden = new Set();
  takte.forEach(j => { for (let t = j; t <= 24; t += j) stunden.add(t); });
  [...stunden].sort((a, b) => a - b).forEach(t => {
    const unterwegs = t <= tag.stunden + 1e-9;
    const pos = unterwegs ? posNachStunden(tag, t) : tag.bis;
    const punkt = massstab ? punktAufRoute(route, massstab, pos) : null;
    const region = regionAn(punkt, regionen);
    const tabelle = tabelleVon(region);
    if (!region || !tabelle) return;
    const j = wachen.get(region.id);
    if (t % j !== 0) return;
    const uhr = (start + t) % 24;
    const nacht = istNacht(uhr);
    const w = begegnungPruefen(tabelle, nacht, zufall);
    aus.push({ nachStunden: t, uhr, nacht, unterwegs, pos, punkt, regionId: region.id, regionName: region.name, ...w });
  });
  return aus;
};

// Was im Tagebuch bleibt: klein, ohne Punkte und Tabellen.
const pruefungKurz = (p) => ({
  uhr: p.uhr, nacht: p.nacht, unterwegs: p.unterwegs, region: p.regionName, wurf: p.wurf, ab: p.ab, treffer: p.treffer,
  art: p.eintrag ? p.eintrag.art : '', begegnungId: p.eintrag ? p.eintrag.begegnungId || '' : '',
  text: p.eintrag ? String(p.eintrag.text || '') : '',
});

const begegnungName = (p, begegnungen) => {
  if (!p.treffer) return 'nichts';
  if (!p.art && !p.eintrag) return 'etwas geschieht (die Tabelle ist leer)';
  const art = p.eintrag ? p.eintrag.art : p.art;
  const id = p.eintrag ? p.eintrag.begegnungId : p.begegnungId;
  const text = p.eintrag ? p.eintrag.text : p.text;
  if (art === 'kampf') {
    const b = (begegnungen || []).find(x => x.id === id);
    return (b ? b.name : 'Kampf') + (text ? ' — ' + text : '');
  }
  return text || 'Ereignis';
};

// ── Das Reisetagebuch als Text ───────────────────────────────────
const reisetagText = (eintrag, reiseName, einh, begegnungen) => {
  const teile = ['Reisetag ' + eintrag.nr + (reiseName ? ' · ' + reiseName : '') + ': ' + laengeText(eintrag.strecke, einh) + ' in ' + stundenText(eintrag.stunden)];
  if (eintrag.wetter) teile.push(wetterText(eintrag.wetter));
  if ((eintrag.gewaltmarsch || []).length) teile.push('Gewaltmarsch, KO-Rettungswürfe SG ' + eintrag.gewaltmarsch.map(g => g.sg).join(', '));
  (eintrag.pruefungen || []).filter(p => p.treffer).forEach(p => {
    teile.push(String(p.uhr).padStart(2, '0') + ' Uhr' + (p.region ? ' (' + p.region + ')' : '') + ': ' + begegnungName(p, begegnungen));
  });
  return teile.join(' · ');
};
const tagebuchText = (reise, einh, begegnungen) => (reise.tagebuch || []).map(e => reisetagText(e, '', einh, begegnungen)).join('\n');

const auftragKampf = (advId, begegnungId, name) => ({ art: 'kampf', advId, begegnungId: String(begegnungId || ''), name: String(name || '').slice(0, 120) });
// ══ Ende der reinen Rechnung
