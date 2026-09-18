// ── Die Welt drumherum: Figuren, Zeit, Dateien, Quests, Hexfelder, Offline ──
// Alles bis zur Markierung ist reine Rechnung
// (dev/pruefungen/planer-welt-test.js).

// ── Zeit ─────────────────────────────────────────────────────────
// Dieselbe Uhr wie die Chronik: Stunden seit Beginn des Abenteuers,
// Tag 1 beginnt bei 0.
const zeitText = (std) => {
  const s = Math.max(0, Math.round(+std || 0));
  return 'Tag ' + (Math.floor(s / 24) + 1) + ', ' + String(s % 24).padStart(2, '0') + ' Uhr';
};
const zeitAus = (tag, stunde) => Math.max(0, (Math.max(1, Math.round(+tag || 1)) - 1) * 24 + Math.max(0, Math.min(23, Math.round(+stunde || 0))));

// ── Figuren ──────────────────────────────────────────────────────
// Eine Figur (Art figur) ist ein NSC, ein Heer, eine Karawane: Wegpunkte
// mit Zeit. Dazwischen geht sie geradeaus; vor dem ersten steht sie am
// ersten, nach dem letzten am letzten.
const wegpunkteSortiert = (f) => [...((f && f.wegpunkte) || [])].filter(w => Number.isFinite(+w.zeit)).sort((a, b) => a.zeit - b.zeit);
const figurPosition = (figur, zeit) => {
  const w = wegpunkteSortiert(figur);
  if (!w.length) return null;
  if (zeit <= w[0].zeit) return { x: w[0].x, y: w[0].y, unterwegs: false, von: w[0], bis: w[0] };
  for (let i = 1; i < w.length; i++) {
    if (zeit <= w[i].zeit) {
      const a = w[i - 1], b = w[i];
      const t = b.zeit === a.zeit ? 1 : (zeit - a.zeit) / (b.zeit - a.zeit);
      const steht = a.x === b.x && a.y === b.y;
      return { x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t), unterwegs: !steht && t > 0 && t < 1, von: a, bis: b };
    }
  }
  const l = w[w.length - 1];
  return { x: l.x, y: l.y, unterwegs: false, von: l, bis: l };
};
// Ein Wegpunkt zu dieser Zeit: vorhandenen ersetzen, sonst dazu.
const wegpunktSetzen = (figur, zeit, p, notiz) => {
  const liste = wegpunkteSortiert(figur).filter(w => w.zeit !== zeit);
  const alt = wegpunkteSortiert(figur).find(w => w.zeit === zeit);
  liste.push({ zeit, x: Math.round(p.x), y: Math.round(p.y), notiz: notiz !== undefined ? notiz : (alt ? alt.notiz || '' : '') });
  return { ...figur, wegpunkte: liste.sort((a, b) => a.zeit - b.zeit) };
};
// Der Bereich des Zeitschiebers: alle Wegpunkte, die Uhr der Chronik, und
// ein Tag Luft auf beiden Seiten.
const zeitBereich = (figuren, jetzt) => {
  const zeiten = figuren.flatMap(f => wegpunkteSortiert(f).map(w => w.zeit));
  if (jetzt != null && Number.isFinite(+jetzt)) zeiten.push(+jetzt);
  if (!zeiten.length) return { min: 0, max: 24 * 7 };
  return { min: Math.max(0, Math.min(...zeiten) - 24), max: Math.max(...zeiten) + 24 };
};
// Was Spieler sehen: nur sichtbare Figuren, und nur zur Zeit, die die
// Spielleitung freigegeben hat (karte.zeit). Ohne freigegebene Zeit gilt
// der erste Wegpunkt.
const figurFuerSpieler = (figur, karte) => {
  const z = karte && Number.isFinite(+karte.zeit) ? +karte.zeit : -Infinity;
  const w = wegpunkteSortiert(figur).filter(x => x.zeit <= z);
  const zeit = w.length ? Math.max(...w.map(x => x.zeit)) : (wegpunkteSortiert(figur)[0] || {}).zeit;
  return figurPosition(figur, Number.isFinite(z) ? z : zeit);
};

// ── NSC aus dem Heldenbuch ───────────────────────────────────────
// Der Planer fuehrt keine Boegen. Was er von einem NSC hat, kommt aus
// planer_helden: Name, Haltung und die eingetragenen Kampfwerte. Eine
// Figur auf der Karte kann darauf verweisen (figur.charId) — dann steht
// auf ihrer Tafel, wer da steht, und ein Knopf fuehrt zum Bogen.
const NSC_ZEICHEN = { freundlich: '🤝', feindlich: '☠' };
const istNscBogen = (h) => !!(h && h.npc);
const nscZeichen  = (h) => NSC_ZEICHEN[(h && h.haltung) === 'feindlich' ? 'feindlich' : 'freundlich'];
const nscWerte    = (h) => {
  if (!h) return '';
  const tp = (+h.tpMax || 0) > 0 ? (+h.tp || 0) + '/' + h.tpMax + ' TP' : '';
  return ['RK ' + (+h.rk || 10), tp].filter(Boolean).join(' · ');
};
const nscZuFigur  = (figur, helden) => (helden || []).find(h => h.id === (figur && figur.charId)) || null;
// Die NSC eines Abenteuers, in der Reihenfolge der Tafel: erst die
// freundlichen, dann die feindlichen, je Gruppe nach Namen.
const nscListe = (helden) => (helden || []).filter(istNscBogen)
  .sort((a, b) => (a.haltung === b.haltung ? String(a.name).localeCompare(String(b.name), 'de')
    : a.haltung === 'feindlich' ? 1 : -1));

// ── Lokale Dateien ───────────────────────────────────────────────
// Eine Datei am Ort ist ein Verweis, nie ein Upload: eine Bibliothek (ein
// Name, den jeder Rechner selbst einem Ordner zuordnet) und ein Pfad darin.
// So findet der Laptop dieselbe Datei, auch wenn OneDrive dort woanders liegt.
const DATEI_ARTEN = {
  bild: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'svg'],
  ton: ['mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus'],
  video: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'ogv'],
  dokument: ['pdf', 'txt', 'md', 'html', 'htm', 'docx', 'odt', 'xlsx', 'ods', 'pptx', 'epub', 'cbz'],
};
const DATEI_ZEICHEN = { bild: '🖼', ton: '🎵', video: '🎬', dokument: '📄', sonst: '📎' };
const dateiEndung = (pfad) => { const m = /\.([A-Za-z0-9]{1,6})$/.exec(String(pfad || '')); return m ? m[1].toLowerCase() : ''; };
const dateiArt = (pfad) => {
  const e = dateiEndung(pfad);
  return Object.keys(DATEI_ARTEN).find(k => DATEI_ARTEN[k].includes(e)) || 'sonst';
};
// Was der Browser selbst zeigen kann. MKV, AVI und Office nicht — dafuer
// ist die Brücke da.
const IM_BROWSER = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus', 'mp4', 'webm', 'm4v', 'ogv', 'pdf', 'txt', 'md'];
const imBrowserZeigbar = (pfad) => IM_BROWSER.includes(dateiEndung(pfad));

// Ein relativer Pfad, wie ihn der Planer speichert: Schraegstriche, kein
// Laufwerk, kein .. — sonst gar keiner.
const relativerPfad = (roh) => {
  const teile = String(roh || '').replace(/\\/g, '/').split('/').filter(t => t !== '' && t !== '.');
  if (!teile.length || teile.some(t => t === '..' || /^[A-Za-z]:$/.test(t) || /[<>:"|?*\x00-\x1f]/.test(t))) return '';
  if (/^[\\/]/.test(String(roh || '')) || /^[A-Za-z]:/.test(String(roh || ''))) return '';
  return teile.join('/');
};
const bibliotheksName = (roh) => String(roh || '').trim().replace(/[^\p{L}\p{N} _-]+/gu, '').slice(0, 40);
const dateiVerweis = (bibliothek, pfad, titel) => {
  const b = bibliotheksName(bibliothek), p = relativerPfad(pfad);
  if (!b || !p) return null;
  return { bibliothek: b, pfad: p, titel: String(titel || p.split('/').pop()).slice(0, 120) };
};
// Die Adresse fuer die Planer-Brücke (planer/bruecke/). Der Browser fragt
// beim ersten Mal, ob er das Programm oeffnen darf.
const BRUECKE_SCHEMA = 'heldenbuch-planer';
const brueckenAdresse = (v) => BRUECKE_SCHEMA + '://oeffnen?bibliothek=' + encodeURIComponent(v.bibliothek) + '&pfad=' + encodeURIComponent(v.pfad);

// ── Quests, Wissen, Fraktionen ───────────────────────────────────
const QUEST_STATUS = [
  { k: 'offen', l: 'Gehört', zeichen: '❔' }, { k: 'aktiv', l: 'Angenommen', zeichen: '❗' },
  { k: 'erledigt', l: 'Erledigt', zeichen: '✔' }, { k: 'gescheitert', l: 'Gescheitert', zeichen: '✖' },
];
const questStatus = (k) => QUEST_STATUS.find(s => s.k === k) || QUEST_STATUS[0];
const neueQuest = () => ({ id: planNeueId('q'), karteId: '', art: 'quest', titel: 'Neue Quest', status: 'offen', auftraggeber: '', zielOrt: '', belohnung: '', text: '', schritte: [], sichtbar: false, dm: { notiz: '' } });
const questFortschritt = (q) => { const s = q.schritte || []; return { fertig: s.filter(x => x.erledigt).length, alle: s.length }; };
// Offene Faeden zuerst, Erledigtes nach hinten.
const questsSortiert = (qs) => [...qs].sort((a, b) => QUEST_STATUS.findIndex(s => s.k === (a.status || 'offen')) - QUEST_STATUS.findIndex(s => s.k === (b.status || 'offen'))
  || String(a.titel).localeCompare(String(b.titel), 'de'));

const HINWEIS_ARTEN = [{ k: 'geruecht', l: 'Gerücht', zeichen: '🗣' }, { k: 'hinweis', l: 'Hinweis', zeichen: '🔎' }, { k: 'wissen', l: 'Wissen', zeichen: '📚' }];
const neuerHinweis = () => ({ id: planNeueId('n'), karteId: '', art: 'hinweis', artDesWissens: 'geruecht', text: '', ortId: '', questId: '', bekanntSeit: '', sichtbar: false, dm: { wahr: 'wahr', notiz: '' } });
// „Was wissen die Spieler?" — sichtbar heisst bekannt.
const bekanntesWissen = (objekte, ortId) => (objekte || []).filter(o => o.art === 'hinweis' && o.sichtbar && (!ortId || o.ortId === ortId));

const neueFraktion = () => ({ id: planNeueId('f'), karteId: '', art: 'fraktion', name: 'Neue Fraktion', farbe: '#9b7fd0', ruf: 0, text: '', regionen: [], sichtbar: false, dm: { ziele: '', notiz: '' } });
const RUF_STUFEN = [
  { ab: -3, l: 'Verfeindet' }, { ab: -2, l: 'Feindselig' }, { ab: -1, l: 'Misstrauisch' }, { ab: 0, l: 'Neutral' },
  { ab: 1, l: 'Wohlgesinnt' }, { ab: 2, l: 'Freundlich' }, { ab: 3, l: 'Verbündet' },
];
const rufText = (ruf) => { const r = Math.max(-3, Math.min(3, Math.round(+ruf || 0))); return RUF_STUFEN.find(s => s.ab === r).l; };
const fraktionenDerRegion = (fraktionen, regionId) => (fraktionen || []).filter(f => (f.regionen || []).includes(regionId));

// ── Proviant und Navigation ──────────────────────────────────────
// Der Vorrat einer Reise sinkt mit jedem abgeschlossenen Tag um das, was
// die Gruppe braucht. Was fehlt, steht als Warnung da.
const vorratNachTag = (vorrat, personen) => {
  const v = { rationen: +((vorrat || {}).rationen) || 0, wasserLiter: +((vorrat || {}).wasserLiter) || 0 };
  const b = verpflegung(1, personen);
  const neu = { rationen: Math.max(0, v.rationen - b.rationen), wasserLiter: Math.max(0, v.wasserLiter - b.wasserLiter) };
  const fehlt = { rationen: Math.max(0, b.rationen - v.rationen), wasserLiter: Math.max(0, b.wasserLiter - v.wasserLiter) };
  return { vorrat: neu, fehlt, reichtTage: b.rationen ? Math.floor(neu.rationen / b.rationen) : Infinity };
};
// Navigation abseits der Wege: eine Probe auf Überlebenskunst am Morgen.
// SG-Vorgaben des Planers; auf Straße und Wasser (mit Schiff) keine Probe.
const NAVIGATION_SG = { strasse: 0, offen: 10, huegel: 12, wueste: 13, wald: 15, sumpf: 15, gebirge: 15, schnee: 15, wasser: 0 };
const navigationSg = (tag) => {
  const sg = Math.max(0, ...((tag && tag.teile) || []).map(t => NAVIGATION_SG[t.gelaende] || 0));
  return sg > 0 ? sg : 0;
};
const auftragNavigation = (advId, sg, text) => ({ art: 'probe', advId, probeArt: 'fert', wert: 'ueberleben', sg, text: String(text || '').slice(0, 160) });

// ── Hexfelder ────────────────────────────────────────────────────
// Spitze Hexfelder (pointy top), Groesse von Seite zu Seite gemessen, wie
// Hexkarten es angeben („6 Meilen je Feld"). Adressen als Spalte.Zeile.
const hexRadiusPx = (groesse, m) => m ? (groesse * pxJeEinheit(m)) / Math.sqrt(3) : 0;
const hexAchsial = (p, r, ursprung) => {
  const o = ursprung || { x: 0, y: 0 };
  const x = (p.x - o.x) / r, y = (p.y - o.y) / r;
  let q = (Math.sqrt(3) / 3) * x - y / 3, rr = (2 / 3) * y;
  let s = -q - rr;
  let rq = Math.round(q), rr2 = Math.round(rr), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr2 - rr), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr2 - rs; else if (dr > ds) rr2 = -rq - rs;
  return { q: rq + 0, r: rr2 + 0 };
};
const hexMitte = (h, r, ursprung) => {
  const o = ursprung || { x: 0, y: 0 };
  return { x: o.x + r * Math.sqrt(3) * (h.q + h.r / 2), y: o.y + r * 1.5 * h.r };
};
const hexEcken = (m, r) => Array.from({ length: 6 }, (_, i) => {
  const w = Math.PI / 180 * (60 * i - 30);
  return { x: m.x + r * Math.cos(w), y: m.y + r * Math.sin(w) };
});
// Versetzte Adresse (odd-r): Spalte.Zeile, zweistellig, ab 01.
const hexAdresse = (h) => {
  const zeile = h.r, spalte = h.q + (h.r - (h.r & 1)) / 2;
  return String(spalte + 1).padStart(2, '0') + '.' + String(zeile + 1).padStart(2, '0');
};
// Alle Felder in einem Bildausschnitt — oder keine, wenn es zu viele waeren.
const hexeIm = (links, oben, rechts, unten, r, hoechstens) => {
  if (!(r > 0)) return [];
  const zeilen = Math.ceil((unten - oben) / (1.5 * r)) + 2, spalten = Math.ceil((rechts - links) / (Math.sqrt(3) * r)) + 2;
  if (zeilen * spalten > (hoechstens || 2500)) return [];
  const aus = [];
  const r0 = Math.floor(oben / (1.5 * r)) - 1;
  for (let rr = r0; rr <= r0 + zeilen; rr++) {
    const q0 = Math.floor(links / (Math.sqrt(3) * r) - rr / 2) - 1;
    for (let q = q0; q <= q0 + spalten; q++) aus.push({ q, r: rr });
  }
  return aus;
};

// ── Offline ──────────────────────────────────────────────────────
// Welche Dateien eine Karte braucht, damit sie ohne Netz aufgeht: alle
// Kacheln, die Vorschau, die Bilder ihrer Orte. Handouts dazu.
const offlinePfade = (karte, objekte) => {
  const aus = [];
  const b = karte && karte.bild;
  if (b) {
    const plan = kachelPlan(b.breite, b.hoehe, b.kachel);
    for (let z = 0; z <= plan.maxZ; z++) kachelnDerStufe(plan, z).forEach(t => aus.push({ ablage: karte.ablage, pfad: kachelPfad(b.ordner, t.z, t.x, t.y, b.endung) }));
    if (b.vorschau) aus.push({ ablage: karte.ablage, pfad: b.vorschau });
  }
  (objekte || []).forEach(o => {
    if (o.art === 'ort' && o.karteId === (karte && karte.id)) (o.bilder || []).forEach(p => aus.push({ ablage: karte.ablage, pfad: p }));
    if (o.art === 'handout' && o.ablage && o.bild) aus.push({ ablage: o.ablage, pfad: o.bild });
  });
  const gesehen = new Set();
  return aus.filter(d => { const k = d.ablage + '/' + d.pfad; if (gesehen.has(k)) return false; gesehen.add(k); return true; });
};
const OFFLINE_SPEICHER = 'hb_planer_offline_';
const offlineStand = (start, daten, jetzt) => JSON.stringify({ zeit: (jetzt || new Date()).toISOString(), start, daten });
// ══ Ende der reinen Rechnung
