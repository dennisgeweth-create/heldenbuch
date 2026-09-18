// ── Das Paket: Im- und Export als .hbplan ────────────────────────
// Ein Abenteuer im Planer besteht aus Text (Karten, Orte, Routen) und
// aus Bildern — bei grossen Karten Tausenden Kacheln. Reines JSON mit
// Base64 waere ein Drittel groesser und muesste als Ganzes in den
// Speicher. Deshalb ist eine .hbplan-Datei ein gewoehnliches ZIP:
//
//     hbplan.json                  was es ist, und alles ausser Bildern
//     karten/<karte>/<pfad>        die Dateien jeder Karte, wie abgelegt
//
// Jedes Entpackprogramm kann hineinsehen. Geschrieben und gelesen wird
// das ZIP selbst in js/zip.js (zipSchreiben, zipLesen) — dieselbe Datei
// benutzt das Heldenbuch fuer sein Buendel Boegen. Hier steht nur, was
// ein .hbplan ausmacht.
//
// Alles bis zur Markierung unten ist reine Rechnung und wird von
// dev/pruefungen/planer-paket-test.js ohne Browser geprueft.

// ── Das Format ───────────────────────────────────────────────────
const HBPLAN_FORMAT = 'heldenbuch-planer';
const HBPLAN_VERSION = 1;
const HBPLAN_MANIFEST = 'hbplan.json';
// Dieselbe Regel wie PLAN_PFAD in api.php: was der Server nicht
// annimmt, soll schon beim Lesen auffallen und nicht nach der Haelfte.
const PLAN_PFAD_RE = /^(?:[a-z0-9][a-z0-9_-]{0,40}\/){0,6}[a-z0-9][a-z0-9_-]{0,60}\.(webp|png|jpg|jpeg|json)$/;
const PLAN_ID_RE = /^[A-Za-z0-9_-]{3,50}$/;
const PLAN_ARTEN = ['ort', 'route', 'reise', 'figur', 'region', 'notiz', 'tabelle', 'handout', 'quest', 'hinweis', 'fraktion', 'gruppe'];
// Dieselbe Liste wie PLAN_OHNE_KARTE in api.php.
const PLAN_OHNE_KARTE = ['handout', 'quest', 'hinweis', 'fraktion'];

const planNeueId = (vorsilbe) => {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return vorsilbe + '_' + Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
};

// Was die Datenbank in eigenen Spalten fuehrt oder nur der Server
// vergibt, gehoert nicht ins Paket.
const planKarteFuerPaket = (k) => { const { ablage, ...rest } = k; return rest; };

const planManifest = ({ abenteuer, karten, objekte, dateien, programm, jetzt }) => ({
  format: HBPLAN_FORMAT,
  version: HBPLAN_VERSION,
  erstellt: (jetzt || new Date()).toISOString(),
  programm: programm || '',
  abenteuer: abenteuer ? { id: abenteuer.id, name: abenteuer.name } : null,
  karten: karten.map(planKarteFuerPaket),
  // Auch der Ordner eines Handouts ist Sache des Servers.
  objekte: objekte.map(planKarteFuerPaket),
  dateien,
});

// Leer heisst gut; sonst steht da, was nicht stimmt — so, dass die
// Spielleitung weiss, ob die Datei kaputt oder nur zu neu ist.
const planManifestPruefen = (m) => {
  if (!m || typeof m !== 'object') return 'Die Paketdatei enthält keine lesbare Beschreibung.';
  if (m.format !== HBPLAN_FORMAT) return 'Das ist keine Datei des Abenteuerplaners.';
  if (!Number.isInteger(m.version) || m.version < 1) return 'Die Paketdatei hat keine gültige Formatversion.';
  if (m.version > HBPLAN_VERSION) return 'Die Paketdatei stammt aus einer neueren Ausgabe des Planers (Format ' + m.version + '). Bitte zuerst das Heldenbuch aktualisieren.';
  if (!Array.isArray(m.karten) || !Array.isArray(m.objekte) || !Array.isArray(m.dateien)) return 'Die Beschreibung im Paket ist unvollständig.';
  const karten = new Set();
  for (const k of m.karten) {
    if (!k || !PLAN_ID_RE.test(String(k.id || ''))) return 'Eine Karte im Paket hat keine gültige Kennung.';
    if (karten.has(k.id)) return 'Die Karte ' + k.id + ' steht doppelt im Paket.';
    if (!String(k.name || '').trim()) return 'Eine Karte im Paket hat keinen Namen.';
    karten.add(k.id);
  }
  const objekte = new Set();
  for (const o of m.objekte) {
    if (!o || !PLAN_ID_RE.test(String(o.id || ''))) return 'Ein Eintrag im Paket hat keine gültige Kennung.';
    if (objekte.has(o.id) || karten.has(o.id)) return 'Die Kennung ' + o.id + ' steht doppelt im Paket.';
    if (!PLAN_ARTEN.includes(o.art)) return 'Unbekannte Art im Paket: ' + String(o.art).slice(0, 20);
    // Ein Handout gehoert zum Abenteuer, nicht zu einer Karte.
    if (!(PLAN_OHNE_KARTE.includes(o.art) && !o.karteId) && !karten.has(o.karteId)) return 'Der Eintrag ' + o.id + ' gehört zu keiner Karte im Paket.';
    objekte.add(o.id);
  }
  for (const d of m.dateien) {
    if (!d || (d.objekt ? !objekte.has(d.objekt) : !karten.has(d.karte))) return 'Eine Datei im Paket gehört zu keiner Karte und keinem Eintrag.';
    if (!PLAN_PFAD_RE.test(String(d.pfad || ''))) return 'Ungültiger Dateiname im Paket: ' + String(d.pfad).slice(0, 80);
  }
  return '';
};

const planPaketName = (karte, pfad) => 'karten/' + karte + '/' + pfad;
// Dateien mit eigenem Ordner (Handouts) liegen unter objekte/.
const planPaketDatei = (d) => d.objekt ? 'objekte/' + d.objekt + '/' + d.pfad : planPaketName(d.karte, d.pfad);

// Beim Einspielen bekommt alles neue Kennungen, damit ein Paket in
// dasselbe Abenteuer zweimal passt und nie etwas Vorhandenes
// ueberschreibt. Verweise zwischen Eintraegen sind Kennungen; die sind
// zufaellig und lang genug, dass jeder Text, der genau so lautet, ein
// Verweis ist. Deshalb wird der ganze Baum durchgesehen und nicht nur
// die Felder, die es heute gibt — ein Feld aus Stufe 3 wird so gleich
// mit umgeschrieben.
const planUmschreiben = (wert, zuordnung) => {
  if (typeof wert === 'string') return zuordnung.has(wert) ? zuordnung.get(wert) : wert;
  if (Array.isArray(wert)) return wert.map(w => planUmschreiben(w, zuordnung));
  if (wert && typeof wert === 'object') {
    const neu = {};
    for (const [k, v] of Object.entries(wert)) neu[k] = planUmschreiben(v, zuordnung);
    return neu;
  }
  return wert;
};
const planNeueKennungen = (m, neueId) => {
  const zuordnung = new Map();
  m.karten.forEach(k => zuordnung.set(k.id, neueId('k')));
  m.objekte.forEach(o => zuordnung.set(o.id, neueId('o')));
  return {
    zuordnung,
    karten: m.karten.map(k => planUmschreiben(k, zuordnung)),
    objekte: m.objekte.map(o => planUmschreiben(o, zuordnung)),
  };
};

// Buendel fuer das Hochladen: jedes bleibt unter der Grenze, eine
// einzelne groessere Datei geht allein.
const planBuendel = (dateien, grenze, maxAnzahl) => {
  const aus = [];
  let jetzt = [], summe = 0;
  for (const d of dateien) {
    if (jetzt.length && (summe + d.bytes > grenze || jetzt.length >= (maxAnzahl || 400))) {
      aus.push(jetzt); jetzt = []; summe = 0;
    }
    jetzt.push(d); summe += d.bytes;
  }
  if (jetzt.length) aus.push(jetzt);
  return aus;
};

const base64AusBytes = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

const planDateiname = (name, jetzt) => {
  const d = jetzt || new Date();
  const tag = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const sauber = String(name || 'Abenteuer').normalize('NFC')
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Abenteuer';
  return sauber + ' ' + tag + '.hbplan';
};

const planGroesse = (n) => n >= 1073741824 ? (n / 1073741824).toFixed(1).replace('.', ',') + ' GB'
  : n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB'
  : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';

// Mehrere Versprechen auf einmal, aber nicht Tausende: der Server soll
// eine Kachelwand nicht als Angriff verstehen.
const nebenher = async (liste, breite, arbeit) => {
  let i = 0;
  const laeufer = Array.from({ length: Math.min(breite, liste.length) }, async () => {
    while (i < liste.length) { const j = i++; await arbeit(liste[j], j); }
  });
  await Promise.all(laeufer);
};

// ── Exportieren ──────────────────────────────────────────────────
// Die Wege zum Server kommen von aussen: so laeuft dieselbe Rechnung im
// Browser gegen api.php und in der Pruefung gegen ein Gedaechtnis.
const planExportieren = async ({ daten, abenteuer, dateienListe, dateiHolen, programm, jetzt, melde }) => {
  const m = melde || (() => {});
  const dateien = [];
  for (const k of daten.karten) {
    m('Dateien von ' + k.name + ' suchen …');
    const liste = await dateienListe(k, 'karte');
    liste.forEach(d => dateien.push({ karte: k.id, ablage: k.ablage, pfad: d.pfad, bytes: d.bytes }));
  }
  for (const o of daten.objekte.filter(x => x.ablage)) {
    const liste = await dateienListe(o, 'objekt');
    liste.forEach(d => dateien.push({ objekt: o.id, ablage: o.ablage, pfad: d.pfad, bytes: d.bytes }));
  }
  const inhalte = new Array(dateien.length);
  let fertig = 0;
  await nebenher(dateien, 6, async (d, j) => {
    inhalte[j] = await dateiHolen(d.ablage, d.pfad);
    fertig++;
    if (fertig % 10 === 0 || fertig === dateien.length) m('Dateien holen: ' + fertig + ' von ' + dateien.length, fertig / Math.max(1, dateien.length));
  });
  const manifest = planManifest({
    abenteuer, programm, jetzt,
    karten: daten.karten, objekte: daten.objekte,
    dateien: dateien.map((d, j) => ({ ...(d.objekt ? { objekt: d.objekt } : { karte: d.karte }), pfad: d.pfad, bytes: inhalte[j].length })),
  });
  m('Paket schnüren …');
  const eintraege = [{ name: HBPLAN_MANIFEST, daten: JSON.stringify(manifest, null, 1), packen: true }]
    .concat(dateien.map((d, j) => ({ name: planPaketDatei(d), daten: inhalte[j], packen: /\.json$/.test(d.pfad) })));
  const blob = await zipSchreiben(eintraege, { jetzt });
  const bytes = inhalte.reduce((s, x) => s + x.length, 0);
  return { blob, manifest, dateien: dateien.length, bytes };
};

// ── Einspielen ───────────────────────────────────────────────────
const planPaketOeffnen = async (blob) => {
  const zip = await zipLesen(blob);
  const e = zip.finden(HBPLAN_MANIFEST);
  if (!e) throw new Error('Das ZIP enthält keine hbplan.json — ist es wirklich eine Datei des Abenteuerplaners?');
  let manifest;
  try { manifest = JSON.parse(new TextDecoder().decode(await zip.lesen(e))); }
  catch (err) { throw new Error(/beschädigt/.test(err.message) ? err.message : 'Die Beschreibung im Paket ist kein gültiges JSON.'); }
  const fehler = planManifestPruefen(manifest);
  if (fehler) throw new Error(fehler);
  const fehlt = manifest.dateien.filter(d => !zip.finden(planPaketDatei(d)));
  if (fehlt.length) throw new Error(fehlt.length + ' Datei(en) fehlen im Paket, z. B. ' + planPaketDatei(fehlt[0]) + '.');
  const bytes = manifest.dateien.reduce((s, d) => s + (+d.bytes || 0), 0);
  return { zip, manifest, bytes };
};

// dateienHoch(ziel, liste): ziel ist die neue Kennung einer Karte, oder
// {objId} fuer einen Eintrag mit eigenem Ordner.
const planEinspielen = async ({ paket, karteSpeichern, objSpeichern, dateienHoch, karteLoeschen, objLoeschen,
                                neueId, namenZusatz, buendelBytes, melde }) => {
  const m = melde || (() => {});
  const { zip, manifest } = paket;
  const { zuordnung, karten, objekte } = planNeueKennungen(manifest, neueId || planNeueId);
  const angelegt = [];
  const angelegteObjekte = [];
  try {
    for (const k of karten) {
      const { ablage, ...ohne } = k;
      await karteSpeichern({ ...ohne, name: String(k.name) + (namenZusatz ? namenZusatz(k.name) : '') });
      angelegt.push(k.id);
    }
    const gesamt = manifest.dateien.length;
    let fertig = 0;
    const hochladen = async (gruppen, ziel) => {
      for (const [schluessel, liste] of gruppen) {
        liste.forEach(d => { d.bytes = d.eintrag.roh; });
        for (const buendel of planBuendel(liste, buendelBytes || 2500000)) {
          const teil = [];
          for (const d of buendel) teil.push({ pfad: d.pfad, daten: base64AusBytes(await zip.lesen(d.eintrag)) });
          await dateienHoch(ziel(schluessel), teil);
          fertig += buendel.length;
          m('Dateien hochladen: ' + fertig + ' von ' + gesamt, fertig / Math.max(1, gesamt));
        }
      }
    };
    const gruppieren = (liste, feld) => {
      const g = new Map();
      liste.forEach(d => {
        const neu = zuordnung.get(d[feld]);
        if (!g.has(neu)) g.set(neu, []);
        g.get(neu).push({ ...d, eintrag: zip.finden(planPaketDatei(d)), bytes: 0 });
      });
      return g;
    };
    await hochladen(gruppieren(manifest.dateien.filter(d => !d.objekt), 'karte'), (id) => id);
    let n = 0;
    for (const o of objekte) {
      const { ablage, ...ohne } = o;
      await objSpeichern(ohne);
      angelegteObjekte.push(o.id);
      n++;
      if (n % 20 === 0) m('Einträge anlegen: ' + n + ' von ' + objekte.length);
    }
    // Erst jetzt gibt es die Eintraege — und mit ihnen ihre Ordner.
    await hochladen(gruppieren(manifest.dateien.filter(d => d.objekt), 'objekt'), (id) => ({ objId: id }));
    return { karten: karten.length, objekte: objekte.length, dateien: gesamt, zuordnung };
  } catch (err) {
    // Halb eingespielt ist schlechter als gar nicht: was schon angelegt
    // ist, geht wieder weg — samt seinen Dateien.
    for (const id of angelegt) { try { await karteLoeschen(id); } catch (e) { /* weiter aufraeumen */ } }
    if (objLoeschen) for (const id of angelegteObjekte) { try { await objLoeschen(id); } catch (e) { /* weiter aufraeumen */ } }
    throw err;
  }
};
// ══ Ende der reinen Rechnung
