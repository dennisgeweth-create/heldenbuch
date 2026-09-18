// ACHTUNG: erzeugt von build.js aus planer/src/*.jsx — Aenderungen hier gehen
// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.
// Zusammengesetzt aus: 0-basis.jsx, 1-paket.jsx, 1b-kacheln.jsx, 1c-reise.jsx, 1d-begegnung.jsx, 1e-sicht.jsx, 1f-welt.jsx, 1g-gruppe.jsx, 2-leinwand.jsx, 3-ort.jsx, 3b-reise.jsx, 3c-begegnung.jsx, 3d-sicht.jsx, 3e-welt.jsx, 3f-gruppe.jsx, 4-app.jsx
// ==== planer/src/0-basis.jsx ====
// ── Abenteuerplaner: Grundlagen ──────────────────────────────────
// Der Planer ist eine eigene Seite neben dem Heldenbuch, mit eigenem
// Buendel (planer/planer.js) — aber derselben Anmeldung, derselben
// Gruppe und derselben api.php. Siehe PLANER.md.
//
// Die Dateien in planer/src/ werden wie im Heldenbuch in Namensreihenfolge
// aneinandergehaengt und teilen sich einen Geltungsbereich.
const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;

// Die Ausgabe des Planers zaehlt eigenstaendig: er waechst in Stufen,
// die mit den Ausgaben des Heldenbuchs nichts zu tun haben.
const PLANER_VERSION = 'Stufe 6';

// ==== planer/src/1-paket.jsx ====
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
const planNeueId = vorsilbe => {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return vorsilbe + '_' + Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
};

// Was die Datenbank in eigenen Spalten fuehrt oder nur der Server
// vergibt, gehoert nicht ins Paket.
const planKarteFuerPaket = k => {
  const {
    ablage,
    ...rest
  } = k;
  return rest;
};
const planManifest = ({
  abenteuer,
  karten,
  objekte,
  dateien,
  programm,
  jetzt
}) => ({
  format: HBPLAN_FORMAT,
  version: HBPLAN_VERSION,
  erstellt: (jetzt || new Date()).toISOString(),
  programm: programm || '',
  abenteuer: abenteuer ? {
    id: abenteuer.id,
    name: abenteuer.name
  } : null,
  karten: karten.map(planKarteFuerPaket),
  // Auch der Ordner eines Handouts ist Sache des Servers.
  objekte: objekte.map(planKarteFuerPaket),
  dateien
});

// Leer heisst gut; sonst steht da, was nicht stimmt — so, dass die
// Spielleitung weiss, ob die Datei kaputt oder nur zu neu ist.
const planManifestPruefen = m => {
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
const planPaketDatei = d => d.objekt ? 'objekte/' + d.objekt + '/' + d.pfad : planPaketName(d.karte, d.pfad);

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
    objekte: m.objekte.map(o => planUmschreiben(o, zuordnung))
  };
};

// Buendel fuer das Hochladen: jedes bleibt unter der Grenze, eine
// einzelne groessere Datei geht allein.
const planBuendel = (dateien, grenze, maxAnzahl) => {
  const aus = [];
  let jetzt = [],
    summe = 0;
  for (const d of dateien) {
    if (jetzt.length && (summe + d.bytes > grenze || jetzt.length >= (maxAnzahl || 400))) {
      aus.push(jetzt);
      jetzt = [];
      summe = 0;
    }
    jetzt.push(d);
    summe += d.bytes;
  }
  if (jetzt.length) aus.push(jetzt);
  return aus;
};
const base64AusBytes = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
};
const planDateiname = (name, jetzt) => {
  const d = jetzt || new Date();
  const tag = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const sauber = String(name || 'Abenteuer').normalize('NFC').replace(/[\\/:*?"<>|\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Abenteuer';
  return sauber + ' ' + tag + '.hbplan';
};
const planGroesse = n => n >= 1073741824 ? (n / 1073741824).toFixed(1).replace('.', ',') + ' GB' : n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';

// Mehrere Versprechen auf einmal, aber nicht Tausende: der Server soll
// eine Kachelwand nicht als Angriff verstehen.
const nebenher = async (liste, breite, arbeit) => {
  let i = 0;
  const laeufer = Array.from({
    length: Math.min(breite, liste.length)
  }, async () => {
    while (i < liste.length) {
      const j = i++;
      await arbeit(liste[j], j);
    }
  });
  await Promise.all(laeufer);
};

// ── Exportieren ──────────────────────────────────────────────────
// Die Wege zum Server kommen von aussen: so laeuft dieselbe Rechnung im
// Browser gegen api.php und in der Pruefung gegen ein Gedaechtnis.
const planExportieren = async ({
  daten,
  abenteuer,
  dateienListe,
  dateiHolen,
  programm,
  jetzt,
  melde
}) => {
  const m = melde || (() => {});
  const dateien = [];
  for (const k of daten.karten) {
    m('Dateien von ' + k.name + ' suchen …');
    const liste = await dateienListe(k, 'karte');
    liste.forEach(d => dateien.push({
      karte: k.id,
      ablage: k.ablage,
      pfad: d.pfad,
      bytes: d.bytes
    }));
  }
  for (const o of daten.objekte.filter(x => x.ablage)) {
    const liste = await dateienListe(o, 'objekt');
    liste.forEach(d => dateien.push({
      objekt: o.id,
      ablage: o.ablage,
      pfad: d.pfad,
      bytes: d.bytes
    }));
  }
  const inhalte = new Array(dateien.length);
  let fertig = 0;
  await nebenher(dateien, 6, async (d, j) => {
    inhalte[j] = await dateiHolen(d.ablage, d.pfad);
    fertig++;
    if (fertig % 10 === 0 || fertig === dateien.length) m('Dateien holen: ' + fertig + ' von ' + dateien.length, fertig / Math.max(1, dateien.length));
  });
  const manifest = planManifest({
    abenteuer,
    programm,
    jetzt,
    karten: daten.karten,
    objekte: daten.objekte,
    dateien: dateien.map((d, j) => ({
      ...(d.objekt ? {
        objekt: d.objekt
      } : {
        karte: d.karte
      }),
      pfad: d.pfad,
      bytes: inhalte[j].length
    }))
  });
  m('Paket schnüren …');
  const eintraege = [{
    name: HBPLAN_MANIFEST,
    daten: JSON.stringify(manifest, null, 1),
    packen: true
  }].concat(dateien.map((d, j) => ({
    name: planPaketDatei(d),
    daten: inhalte[j],
    packen: /\.json$/.test(d.pfad)
  })));
  const blob = await zipSchreiben(eintraege, {
    jetzt
  });
  const bytes = inhalte.reduce((s, x) => s + x.length, 0);
  return {
    blob,
    manifest,
    dateien: dateien.length,
    bytes
  };
};

// ── Einspielen ───────────────────────────────────────────────────
const planPaketOeffnen = async blob => {
  const zip = await zipLesen(blob);
  const e = zip.finden(HBPLAN_MANIFEST);
  if (!e) throw new Error('Das ZIP enthält keine hbplan.json — ist es wirklich eine Datei des Abenteuerplaners?');
  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder().decode(await zip.lesen(e)));
  } catch (err) {
    throw new Error(/beschädigt/.test(err.message) ? err.message : 'Die Beschreibung im Paket ist kein gültiges JSON.');
  }
  const fehler = planManifestPruefen(manifest);
  if (fehler) throw new Error(fehler);
  const fehlt = manifest.dateien.filter(d => !zip.finden(planPaketDatei(d)));
  if (fehlt.length) throw new Error(fehlt.length + ' Datei(en) fehlen im Paket, z. B. ' + planPaketDatei(fehlt[0]) + '.');
  const bytes = manifest.dateien.reduce((s, d) => s + (+d.bytes || 0), 0);
  return {
    zip,
    manifest,
    bytes
  };
};

// dateienHoch(ziel, liste): ziel ist die neue Kennung einer Karte, oder
// {objId} fuer einen Eintrag mit eigenem Ordner.
const planEinspielen = async ({
  paket,
  karteSpeichern,
  objSpeichern,
  dateienHoch,
  karteLoeschen,
  objLoeschen,
  neueId,
  namenZusatz,
  buendelBytes,
  melde
}) => {
  const m = melde || (() => {});
  const {
    zip,
    manifest
  } = paket;
  const {
    zuordnung,
    karten,
    objekte
  } = planNeueKennungen(manifest, neueId || planNeueId);
  const angelegt = [];
  const angelegteObjekte = [];
  try {
    for (const k of karten) {
      const {
        ablage,
        ...ohne
      } = k;
      await karteSpeichern({
        ...ohne,
        name: String(k.name) + (namenZusatz ? namenZusatz(k.name) : '')
      });
      angelegt.push(k.id);
    }
    const gesamt = manifest.dateien.length;
    let fertig = 0;
    const hochladen = async (gruppen, ziel) => {
      for (const [schluessel, liste] of gruppen) {
        liste.forEach(d => {
          d.bytes = d.eintrag.roh;
        });
        for (const buendel of planBuendel(liste, buendelBytes || 2500000)) {
          const teil = [];
          for (const d of buendel) teil.push({
            pfad: d.pfad,
            daten: base64AusBytes(await zip.lesen(d.eintrag))
          });
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
        g.get(neu).push({
          ...d,
          eintrag: zip.finden(planPaketDatei(d)),
          bytes: 0
        });
      });
      return g;
    };
    await hochladen(gruppieren(manifest.dateien.filter(d => !d.objekt), 'karte'), id => id);
    let n = 0;
    for (const o of objekte) {
      const {
        ablage,
        ...ohne
      } = o;
      await objSpeichern(ohne);
      angelegteObjekte.push(o.id);
      n++;
      if (n % 20 === 0) m('Einträge anlegen: ' + n + ' von ' + objekte.length);
    }
    // Erst jetzt gibt es die Eintraege — und mit ihnen ihre Ordner.
    await hochladen(gruppieren(manifest.dateien.filter(d => d.objekt), 'objekt'), id => ({
      objId: id
    }));
    return {
      karten: karten.length,
      objekte: objekte.length,
      dateien: gesamt,
      zuordnung
    };
  } catch (err) {
    // Halb eingespielt ist schlechter als gar nicht: was schon angelegt
    // ist, geht wieder weg — samt seinen Dateien.
    for (const id of angelegt) {
      try {
        await karteLoeschen(id);
      } catch (e) {/* weiter aufraeumen */}
    }
    if (objLoeschen) for (const id of angelegteObjekte) {
      try {
        await objLoeschen(id);
      } catch (e) {/* weiter aufraeumen */}
    }
    throw err;
  }
};
// ══ Ende der reinen Rechnung

// ==== planer/src/1b-kacheln.jsx ====
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
const bildMasse = b => {
  const u16be = i => b[i] << 8 | b[i + 1];
  const u32be = i => (b[i] << 24 >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const u16le = i => b[i] | b[i + 1] << 8;
  const u24le = i => b[i] | b[i + 1] << 8 | b[i + 2] << 16;
  const text = (i, n) => String.fromCharCode.apply(null, b.subarray(i, i + n));
  if (b.length >= 24 && b[0] === 0x89 && text(1, 3) === 'PNG') {
    return {
      art: 'png',
      breite: u32be(16),
      hoehe: u32be(20)
    };
  }
  if (b.length >= 10 && text(0, 3) === 'GIF') {
    return {
      art: 'gif',
      breite: u16le(6),
      hoehe: u16le(8)
    };
  }
  if (b.length >= 30 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    const teil = text(12, 4);
    if (teil === 'VP8X') return {
      art: 'webp',
      breite: u24le(24) + 1,
      hoehe: u24le(27) + 1
    };
    if (teil === 'VP8L') {
      const b0 = b[21],
        b1 = b[22],
        b2 = b[23],
        b3 = b[24];
      return {
        art: 'webp',
        breite: 1 + ((b1 & 0x3F) << 8 | b0),
        hoehe: 1 + ((b3 & 0x0F) << 10 | b2 << 2 | (b1 & 0xC0) >> 6)
      };
    }
    if (teil === 'VP8 ') return {
      art: 'webp',
      breite: u16le(26) & 0x3FFF,
      hoehe: u16le(28) & 0x3FFF
    };
    return null;
  }
  if (b.length >= 4 && b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xFF) {
        i++;
        continue;
      }
      const m = b[i + 1];
      if (m === 0xFF) {
        i++;
        continue;
      }
      if (m === 0xD8 || m === 0x01 || m >= 0xD0 && m <= 0xD7) {
        i += 2;
        continue;
      }
      const len = u16be(i + 2);
      // SOF0 … SOF15, ohne DHT (C4), JPG (C8) und DAC (CC)
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
        return {
          art: 'jpeg',
          breite: u16be(i + 7),
          hoehe: u16be(i + 5)
        };
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
    const b = Math.ceil(breite / faktor),
      h = Math.ceil(hoehe / faktor);
    const s = {
      z,
      faktor,
      breite: b,
      hoehe: h,
      spalten: Math.ceil(b / k),
      zeilen: Math.ceil(h / k)
    };
    anzahl += s.spalten * s.zeilen;
    stufen.push(s);
  }
  return {
    breite,
    hoehe,
    kachel: k,
    maxZ,
    stufen,
    anzahl
  };
};

// Welcher Ausschnitt einer Stufe in eine Kachel gehoert. Randkacheln
// sind kleiner als 256 Pixel — nichts wird aufgefuellt.
const kachelZiel = (plan, z, x, y) => {
  const s = plan.stufen[z],
    k = plan.kachel;
  const lx = x * k,
    ly = y * k;
  return {
    lx,
    ly,
    breite: Math.min(k, s.breite - lx),
    hoehe: Math.min(k, s.hoehe - ly)
  };
};
const kachelPfad = (ordner, z, x, y, format) => ordner + '/' + z + '/' + x + '/' + y + '.' + (format || 'webp');

// Alle Kacheln einer Stufe, zeilenweise.
const kachelnDerStufe = (plan, z) => {
  const s = plan.stufen[z],
    aus = [];
  for (let y = 0; y < s.zeilen; y++) for (let x = 0; x < s.spalten; x++) aus.push({
    z,
    x,
    y
  });
  return aus;
};

// ── Die Ansicht ──────────────────────────────────────────────────
const ansichtMass = (a, plan) => Math.pow(2, a.zoom - plan.maxZ); // Schirmpixel je Bildpixel
const bildZuSchirm = (p, a, g, plan) => {
  const s = ansichtMass(a, plan);
  return {
    x: (p.x - a.x) * s + g.breite / 2,
    y: (p.y - a.y) * s + g.hoehe / 2
  };
};
const schirmZuBild = (p, a, g, plan) => {
  const s = ansichtMass(a, plan);
  return {
    x: (p.x - g.breite / 2) / s + a.x,
    y: (p.y - g.hoehe / 2) / s + a.y
  };
};
const ansichtEinpassen = (plan, g) => {
  const s = Math.min(g.breite / plan.breite, g.hoehe / plan.hoehe) * 0.94;
  return {
    zoom: plan.maxZ + Math.log2(Math.max(s, 1e-6)),
    x: plan.breite / 2,
    y: plan.hoehe / 2
  };
};
const zoomGrenzen = (plan, g) => ({
  min: Math.min(ansichtEinpassen(plan, g).zoom, 0) - 1,
  max: plan.maxZ + 2
});
const ansichtBegrenzen = (a, plan, g) => {
  const gr = zoomGrenzen(plan, g);
  const zoom = Math.max(gr.min, Math.min(gr.max, a.zoom));
  return {
    zoom,
    x: Math.max(0, Math.min(plan.breite, a.x)),
    y: Math.max(0, Math.min(plan.hoehe, a.y))
  };
};
// Zoomen um einen Punkt: was unter dem Mauszeiger liegt, bleibt dort.
const zoomUm = (a, punkt, neuZoom, g, plan) => {
  const bild = schirmZuBild(punkt, a, g, plan);
  const z = ansichtBegrenzen({
    ...a,
    zoom: neuZoom
  }, plan, g).zoom;
  const s = Math.pow(2, z - plan.maxZ);
  return ansichtBegrenzen({
    zoom: z,
    x: bild.x - (punkt.x - g.breite / 2) / s,
    y: bild.y - (punkt.y - g.hoehe / 2) / s
  }, plan, g);
};
const verschieben = (a, dx, dy, plan, g) => {
  const s = ansichtMass(a, plan);
  return ansichtBegrenzen({
    ...a,
    x: a.x - dx / s,
    y: a.y - dy / s
  }, plan, g);
};
// Welche Stufe geladen wird: die naechst schaerfere, sobald die jetzige
// merklich vergroessert erschiene.
const stufeFuer = (zoom, plan) => Math.max(0, Math.min(plan.maxZ, Math.ceil(zoom - 0.3)));
const KACHEL_HOECHSTENS = 600;
const sichtbareKacheln = (a, g, plan, z) => {
  const st = plan.stufen[z],
    k = plan.kachel;
  const s = ansichtMass(a, plan);
  const f = st.faktor;
  const oben = schirmZuBild({
    x: 0,
    y: 0
  }, a, g, plan);
  const unten = schirmZuBild({
    x: g.breite,
    y: g.hoehe
  }, a, g, plan);
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
      const lo = bildZuSchirm({
        x: ziel.lx * f,
        y: ziel.ly * f
      }, a, g, plan);
      aus.push({
        z,
        x,
        y,
        links: lo.x,
        oben: lo.y,
        breite: ziel.breite * f * s,
        hoehe: ziel.hoehe * f * s
      });
    }
  }
  return aus;
};

// ── Maßstab und Lineal ───────────────────────────────────────────
const EINHEITEN = [{
  k: 'km',
  l: 'Kilometer',
  kurz: 'km',
  kmh: 4.5
}, {
  k: 'mi',
  l: 'Meilen',
  kurz: 'mi',
  kmh: 3
}, {
  k: 'm',
  l: 'Meter',
  kurz: 'm',
  kmh: 4500
}, {
  k: 'ft',
  l: 'Fuß',
  kurz: 'ft',
  kmh: 15840
}];
const einheit = k => EINHEITEN.find(e => e.k === k) || EINHEITEN[0];
const abstandPx = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const massstabAus = (a, b, laenge, einh) => {
  const d = abstandPx(a, b);
  if (!(laenge > 0) || !(d > 0)) return null;
  return {
    a: {
      x: Math.round(a.x),
      y: Math.round(a.y)
    },
    b: {
      x: Math.round(b.x),
      y: Math.round(b.y)
    },
    laenge: +laenge,
    einheit: einheit(einh).k
  };
};
const pxJeEinheit = m => abstandPx(m.a, m.b) / m.laenge;
const wegLaenge = (punkte, m) => {
  if (!m) return 0;
  let px = 0;
  for (let i = 1; i < punkte.length; i++) px += abstandPx(punkte[i - 1], punkte[i]);
  return px / pxJeEinheit(m);
};
const zahlText = n => {
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
  const tage = Math.floor(std / 8),
    rest = Math.round(std - tage * 8);
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
  return {
    laenge: schoen,
    px: schoen * pxJeEinheit(m) * s,
    text: laengeText(schoen, m.einheit)
  };
};

// ── Kacheln erzeugen ─────────────────────────────────────────────
// Die Arbeit selbst — zeichnen und hochladen — kommt von aussen. Hier
// steht nur die Reihenfolge: Stufe fuer Stufe, in Buendeln hochladen,
// waehrend weiter gezeichnet wird, hoechstens zwei Buendel zugleich.
const kachelnErzeugen = async ({
  plan,
  zeichne,
  hochladen,
  buendelBytes,
  parallel,
  melde,
  abgebrochen
}) => {
  const grenze = buendelBytes || 2500000;
  const breite = parallel || 2;
  const m = melde || (() => {});
  const laufend = new Set();
  let buendel = [],
    summe = 0,
    fertig = 0,
    bytes = 0,
    fehler = null;
  const abschicken = async () => {
    if (!buendel.length) return;
    const b = buendel;
    buendel = [];
    summe = 0;
    const p = hochladen(b).then(() => {
      laufend.delete(p);
    }, e => {
      laufend.delete(p);
      fehler = fehler || e;
    });
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
      buendel.push(d);
      summe += d.bytes.length;
      bytes += d.bytes.length;
      fertig++;
      if (summe >= grenze || buendel.length >= 400) await abschicken();
      if (fertig % 8 === 0 || fertig === plan.anzahl) m('Kacheln: ' + fertig + ' von ' + plan.anzahl + ' · ' + planGroesse(bytes), fertig / plan.anzahl);
    }
  }
  await abschicken();
  await Promise.all(laufend);
  if (fehler) throw fehler;
  return {
    anzahl: fertig,
    bytes
  };
};

// Beim Austausch des Bilds bleiben Orte, wo sie auf der Karte waren:
// ihre Pixel werden mit dem Groessenverhaeltnis umgerechnet.
const punktSkalieren = (p, alt, neu) => ({
  x: Math.round(p.x * neu.breite / alt.breite),
  y: Math.round(p.y * neu.hoehe / alt.hoehe)
});
const ORT_SYMBOLE = ['📍', '🏰', '🏘', '🏠', '⛪', '🏛', '🍺', '⚓', '🌲', '⛰', '🕳', '🗿', '💀', '⚔', '🔥', '💎', '❓', '⭐'];
// ══ Ende der reinen Rechnung

// ==== planer/src/1c-reise.jsx ====
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

const GELAENDE = [{
  k: 'strasse',
  l: 'Straße oder Weg',
  farbe: '#e8d9a8',
  fuss: 1,
  wagen: 1
}, {
  k: 'offen',
  l: 'Offenes Land',
  farbe: '#9fd27a',
  fuss: 1,
  wagen: 0.75
}, {
  k: 'huegel',
  l: 'Hügel',
  farbe: '#d6a35c',
  fuss: 0.75,
  wagen: 0.5
}, {
  k: 'wald',
  l: 'Wald',
  farbe: '#4fa36a',
  fuss: 0.5,
  wagen: 0.25
}, {
  k: 'wueste',
  l: 'Wüste',
  farbe: '#f0c060',
  fuss: 0.75,
  wagen: 0.5
}, {
  k: 'sumpf',
  l: 'Sumpf',
  farbe: '#7d8f5a',
  fuss: 0.5,
  wagen: 0
}, {
  k: 'gebirge',
  l: 'Gebirge',
  farbe: '#b0a8a0',
  fuss: 0.5,
  wagen: 0
}, {
  k: 'schnee',
  l: 'Schnee und Eis',
  farbe: '#dfeefa',
  fuss: 0.5,
  wagen: 0.25
}, {
  k: 'wasser',
  l: 'Fluss, See, Meer',
  farbe: '#5fb0e8',
  fuss: 0,
  wagen: 0
}];
const gelaende = k => GELAENDE.find(g => g.k === k) || GELAENDE[1];
const TEMPO = [{
  k: 'langsam',
  l: 'Langsam',
  kmh: 3,
  mph: 2,
  folge: 'Heimlichkeit möglich'
}, {
  k: 'normal',
  l: 'Normal',
  kmh: 4.5,
  mph: 3,
  folge: ''
}, {
  k: 'schnell',
  l: 'Schnell',
  kmh: 6,
  mph: 4,
  folge: '−5 auf passive Wahrnehmung'
}];
const tempo = k => TEMPO.find(t => t.k === k) || TEMPO[1];

// art: land — Tempo zaehlt; wagen — dazu die Wagenspalte des Gelaendes;
// wasser — nur auf Wasser, feste Geschwindigkeit, mit Mannschaft rund um die Uhr.
const FORTBEWEGUNG = [{
  k: 'fuss',
  l: 'Zu Fuß',
  art: 'land'
}, {
  k: 'reittier',
  l: 'Reittier',
  art: 'land'
}, {
  k: 'wagen',
  l: 'Wagen oder Kutsche',
  art: 'wagen'
}, {
  k: 'ruderboot',
  l: 'Ruderboot',
  art: 'wasser',
  mph: 1.5,
  stunden: 8
}, {
  k: 'kielboot',
  l: 'Kielboot',
  art: 'wasser',
  mph: 1,
  stunden: 24
}, {
  k: 'segelschiff',
  l: 'Segelschiff',
  art: 'wasser',
  mph: 2,
  stunden: 24
}, {
  k: 'kriegsschiff',
  l: 'Kriegsschiff',
  art: 'wasser',
  mph: 2.5,
  stunden: 24
}, {
  k: 'langschiff',
  l: 'Langschiff',
  art: 'wasser',
  mph: 3,
  stunden: 24
}, {
  k: 'galeere',
  l: 'Galeere',
  art: 'wasser',
  mph: 4,
  stunden: 24
}];
const fortbewegung = k => FORTBEWEGUNG.find(f => f.k === k) || FORTBEWEGUNG[0];
const KM_JE_MEILE = 1.5;
const GEWALTMARSCH_AB = 8;

// Wie weit in einer Stunde, in der Einheit der Karte.
const JE_EINHEIT = {
  km: {
    km: 1,
    mi: 1 / KM_JE_MEILE
  },
  mi: {
    km: KM_JE_MEILE,
    mi: 1
  },
  m: {
    km: 1000,
    mi: 1000 * KM_JE_MEILE
  },
  ft: {
    km: 3280.84,
    mi: 5280
  }
};
const grundTempo = (optionen, einh) => {
  const f = fortbewegung(optionen.fortbewegung);
  const u = JE_EINHEIT[einh] || JE_EINHEIT.km;
  if (f.art === 'wasser') return einh === 'km' || einh === 'm' ? f.mph * KM_JE_MEILE * u.km : f.mph * u.mi;
  const t = tempo(optionen.tempo);
  return einh === 'km' || einh === 'm' ? t.kmh * u.km : t.mph * u.mi;
};
// Wie schnell auf diesem Gelaende — 0 heisst: geht nicht.
const tempoAuf = (gel, optionen, einh, wetter) => {
  const f = fortbewegung(optionen.fortbewegung);
  const g = gelaende(gel);
  let faktor;
  if (f.art === 'wasser') faktor = g.k === 'wasser' ? 1 : 0;else if (f.art === 'wagen') faktor = g.wagen;else faktor = g.fuss;
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
    aus.push({
      i: i - 1,
      von: p[i - 1],
      bis: p[i],
      px,
      laenge: jePx ? px / jePx : 0,
      gelaende: (route.gelaende || [])[i - 1] || route.standard || 'offen'
    });
  }
  return aus;
};
const routeLaenge = (route, m) => routeAbschnitte(route, m).reduce((s, a) => s + a.laenge, 0);
// Rueckwaerts ist dieselbe Route mit umgedrehten Punkten und Abschnitten.
const routeInRichtung = (route, richtung) => richtung !== 'zurueck' ? route : {
  ...route,
  punkte: [...(route.punkte || [])].reverse(),
  gelaende: [...(route.gelaende || [])].slice(0, Math.max(0, (route.punkte || []).length - 1)).reverse()
};
// Der Punkt, der pos Einheiten vom Start entfernt liegt.
const punktAufRoute = (route, m, pos) => {
  const ab = routeAbschnitte(route, m);
  if (!ab.length) return (route.punkte || [])[0] || null;
  let rest = Math.max(0, pos);
  for (const a of ab) {
    if (rest <= a.laenge || a === ab[ab.length - 1]) {
      const t = a.laenge ? Math.min(1, rest / a.laenge) : 1;
      return {
        x: Math.round(a.von.x + (a.bis.x - a.von.x) * t),
        y: Math.round(a.von.y + (a.bis.y - a.von.y) * t)
      };
    }
    rest -= a.laenge;
  }
  return null;
};

// ── Der Plan: Tag fuer Tag ───────────────────────────────────────
// Ohne Angabe: acht Stunden an Land, bei Schiffen mit Mannschaft rund um die Uhr.
const reiseStunden = o => {
  const f = fortbewegung(o && o.fortbewegung);
  return Math.max(1, Math.min(24, +(o && o.stunden) || f.stunden || 8));
};
// start: bereits zurueckgelegte Strecke. wetter: je Tag (Index ab 0 vom
// Start aus) — fehlt es, wird ohne Wetter gerechnet.
const REISE_HOECHSTENS_TAGE = 400;
const reisePlan = ({
  route,
  massstab,
  optionen,
  start,
  wetter
}) => {
  const einh = massstab ? massstab.einheit : 'km';
  const o = {
    tempo: 'normal',
    fortbewegung: 'fuss',
    ...(optionen || {})
  };
  const f = fortbewegung(o.fortbewegung);
  const stundenJeTag = reiseStunden(o);
  const ab = routeAbschnitte(route, massstab);
  const gesamt = ab.reduce((s, a) => s + a.laenge, 0);
  const tage = [];
  const warnungen = [];
  if (!massstab) warnungen.push('Die Karte hat noch keinen Maßstab.');
  if (ab.length === 0) warnungen.push('Die Route hat keine Strecke.');
  if (!massstab || !ab.length) return {
    tage,
    gesamt,
    einheit: einh,
    warnungen,
    angekommen: false,
    stundenJeTag
  };
  let pos = Math.max(0, Math.min(gesamt, +start || 0));
  let blockiert = null;
  const abschnittBei = p => {
    let s = 0;
    for (const a of ab) {
      if (p < s + a.laenge - 1e-9) return {
        a,
        rest: s + a.laenge - p
      };
      s += a.laenge;
    }
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
      if (!(v > 0)) {
        blockiert = {
          tag: nr,
          abschnitt: hier.a.i,
          text: warumNicht(hier.a.gelaende, o, w)
        };
        break;
      }
      const brauche = hier.rest / v;
      const habe = stundenJeTag - stunden;
      const h = Math.min(brauche, habe);
      const strecke = h === brauche ? hier.rest : h * v;
      pos = h === brauche ? pos + hier.rest : pos + strecke;
      stunden += h;
      const letzter = teile[teile.length - 1];
      if (letzter && letzter.gelaende === hier.a.gelaende) {
        letzter.strecke += strecke;
        letzter.stunden += h;
      } else teile.push({
        gelaende: hier.a.gelaende,
        strecke,
        stunden: h
      });
    }
    if (stunden <= 1e-9) break;
    // Gewaltmarsch: jede angefangene Stunde ueber acht, am Ende der Stunde.
    const gewaltmarsch = [];
    if (f.art !== 'wasser') {
      for (let h = GEWALTMARSCH_AB + 1; h <= Math.ceil(stunden - 1e-9); h++) gewaltmarsch.push({
        stunde: h,
        sg: 10 + (h - GEWALTMARSCH_AB)
      });
    }
    tage.push({
      nr: nr + 1,
      von,
      bis: pos,
      strecke: pos - von,
      stunden,
      teile,
      gewaltmarsch,
      wetter: w,
      angekommen: pos >= gesamt - 1e-9
    });
  }
  if (blockiert) warnungen.push('Tag ' + (blockiert.tag + 1) + ', Abschnitt ' + (blockiert.abschnitt + 1) + ': ' + blockiert.text);
  if (tage.length >= REISE_HOECHSTENS_TAGE) warnungen.push('Mehr als ' + REISE_HOECHSTENS_TAGE + ' Tage — die Rechnung hört hier auf.');
  if (f.art !== 'wasser' && stundenJeTag > GEWALTMARSCH_AB) warnungen.push('Mehr als acht Stunden am Tag: Gewaltmarsch.');
  return {
    tage,
    gesamt,
    einheit: einh,
    warnungen,
    blockiert,
    stundenJeTag,
    angekommen: !blockiert && pos >= gesamt - 1e-9
  };
};
const stundenText = h => {
  const ganz = Math.floor(h + 1e-9),
    min = Math.round((h - ganz) * 60);
  if (min === 60) return ganz + 1 + ' Std.';
  return ganz + (min ? ':' + String(min).padStart(2, '0') : '') + ' Std.';
};
// Verpflegung nach den Grundregeln: eine Tagesration und gut vier Liter
// Wasser je Person und Tag.
const verpflegung = (tage, personen) => ({
  rationen: tage * Math.max(0, personen || 0),
  wasserLiter: tage * Math.max(0, personen || 0) * 4
});

// ── Wetter ───────────────────────────────────────────────────────
const WETTER_NIEDERSCHLAG = ['klar', 'leicht', 'wolken', 'regen', 'sturm'];
const WETTER_TEMPERATUR = ['glut', 'heiss', 'warm', 'mild', 'kuehl', 'kalt', 'arktis'];
const WETTER_WIND = ['flaute', 'maessig', 'stark', 'boeen', 'orkan'];
const WETTER_WORTE = {
  klar: 'Wolkenlos',
  leicht: 'Leicht bewölkt',
  wolken: 'Bewölkt oder Nebel',
  regen: 'Regen, Hagel, Schnee',
  sturm: 'Starkregen, Sturm',
  glut: 'Unerträglich heiß',
  heiss: 'Heiß',
  warm: 'Warm',
  mild: 'Moderat',
  kuehl: 'Kühl',
  kalt: 'Kalt',
  arktis: 'Arktisch kalt',
  flaute: 'Flaute',
  maessig: 'Mäßiger Wind',
  stark: 'Starker Wind',
  boeen: 'Starke Böen',
  orkan: 'Sturm'
};
const WETTER_ZEICHEN = {
  klar: '☀',
  leicht: '🌤',
  wolken: '☁',
  regen: '🌧',
  sturm: '⛈'
};
const KLIMA = [{
  k: 'gemaessigt',
  l: 'Gemäßigt'
}, {
  k: 'kalt',
  l: 'Kalt, nordisch'
}, {
  k: 'arktisch',
  l: 'Arktisch'
}, {
  k: 'heiss',
  l: 'Heiß, trocken'
}, {
  k: 'tropisch',
  l: 'Tropisch, feucht'
}, {
  k: 'kueste',
  l: 'Küste, See'
}];
const JAHRESZEITEN = [{
  k: 'fruehling',
  l: 'Frühling'
}, {
  k: 'sommer',
  l: 'Sommer'
}, {
  k: 'herbst',
  l: 'Herbst'
}, {
  k: 'winter',
  l: 'Winter'
}];
// Gewichte je Stufe, in der Reihenfolge der Listen oben. Eigene Vorgaben
// des Planers, keine Regeltabelle: sie sollen plausibles Wetter geben,
// das die Spielleitung jederzeit umstellt.
const WETTER_TAFEL = {
  gemaessigt: {
    temperatur: {
      fruehling: [0, 0, 2, 5, 3, 1, 0],
      sommer: [0, 2, 5, 3, 1, 0, 0],
      herbst: [0, 0, 1, 4, 4, 2, 0],
      winter: [0, 0, 0, 1, 3, 5, 1]
    },
    niederschlag: {
      fruehling: [2, 3, 3, 3, 1],
      sommer: [4, 3, 2, 2, 1],
      herbst: [1, 2, 4, 3, 1],
      winter: [2, 2, 3, 3, 1]
    },
    wind: [4, 4, 2, 1, 0.3]
  },
  kalt: {
    temperatur: {
      fruehling: [0, 0, 0, 2, 4, 4, 1],
      sommer: [0, 0, 2, 5, 3, 1, 0],
      herbst: [0, 0, 0, 1, 4, 4, 2],
      winter: [0, 0, 0, 0, 1, 5, 4]
    },
    niederschlag: {
      fruehling: [2, 2, 3, 3, 1],
      sommer: [2, 3, 3, 3, 1],
      herbst: [1, 2, 4, 3, 2],
      winter: [2, 2, 3, 3, 2]
    },
    wind: [3, 4, 3, 2, 0.6]
  },
  arktisch: {
    temperatur: {
      fruehling: [0, 0, 0, 0, 1, 4, 5],
      sommer: [0, 0, 0, 1, 4, 4, 1],
      herbst: [0, 0, 0, 0, 1, 4, 5],
      winter: [0, 0, 0, 0, 0, 2, 8]
    },
    niederschlag: {
      fruehling: [3, 2, 3, 2, 2],
      sommer: [3, 3, 3, 2, 1],
      herbst: [2, 2, 3, 3, 2],
      winter: [3, 2, 2, 2, 3]
    },
    wind: [2, 3, 3, 3, 1]
  },
  heiss: {
    temperatur: {
      fruehling: [1, 4, 4, 2, 0, 0, 0],
      sommer: [4, 5, 2, 0, 0, 0, 0],
      herbst: [1, 3, 4, 2, 0, 0, 0],
      winter: [0, 1, 3, 4, 2, 0, 0]
    },
    niederschlag: {
      fruehling: [7, 3, 1, 0.3, 0.3],
      sommer: [9, 2, 0.5, 0.2, 0.3],
      herbst: [7, 3, 1, 0.3, 0.3],
      winter: [5, 3, 2, 1, 0.3]
    },
    wind: [4, 3, 2, 1, 0.5]
  },
  tropisch: {
    temperatur: {
      fruehling: [0, 4, 5, 1, 0, 0, 0],
      sommer: [1, 5, 4, 0, 0, 0, 0],
      herbst: [0, 4, 5, 1, 0, 0, 0],
      winter: [0, 2, 5, 3, 0, 0, 0]
    },
    niederschlag: {
      fruehling: [1, 2, 3, 4, 2],
      sommer: [1, 2, 2, 4, 3],
      herbst: [1, 2, 3, 4, 2],
      winter: [2, 3, 3, 2, 1]
    },
    wind: [4, 3, 2, 1, 0.4]
  },
  kueste: {
    temperatur: {
      fruehling: [0, 0, 1, 5, 4, 1, 0],
      sommer: [0, 1, 5, 4, 1, 0, 0],
      herbst: [0, 0, 1, 4, 5, 1, 0],
      winter: [0, 0, 0, 2, 5, 3, 0]
    },
    niederschlag: {
      fruehling: [2, 3, 3, 3, 1],
      sommer: [3, 3, 3, 2, 1],
      herbst: [1, 2, 3, 4, 2],
      winter: [1, 2, 3, 4, 2]
    },
    wind: [1, 3, 4, 2, 1]
  }
};
const gewichtetWaehlen = (gewichte, zufall) => {
  const summe = gewichte.reduce((s, g) => s + g, 0);
  let r = zufall() * summe;
  for (let i = 0; i < gewichte.length; i++) {
    r -= gewichte[i];
    if (r < 0) return i;
  }
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
    wind: teil(WETTER_WIND, t.wind, vortag && vortag.wind)
  };
};
const wetterText = w => w ? [WETTER_WORTE[w.niederschlag], WETTER_WORTE[w.temperatur], WETTER_WORTE[w.wind]].filter(Boolean).join(' · ') : '';
// Ein Zufall mit Samen, damit dieselbe Reise dasselbe Wetter behaelt,
// bis jemand neu wuerfelt (mulberry32).
const samenZufall = samen => {
  let a = samen >>> 0 || 1;
  return () => {
    a = a + 0x6D2B79F5 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
const auftragZeit = (advId, stunden) => ({
  art: 'zeit',
  advId,
  stunden: Math.max(0, Math.round(stunden))
});
const auftragRast = (advId, wetter, text) => ({
  art: 'rast',
  advId,
  rastArt: 'lang',
  basis: 2,
  niederschlag: wetter && wetter.niederschlag || 'leicht',
  temperatur: wetter && wetter.temperatur || 'mild',
  wind: wetter && wetter.wind || 'flaute',
  massnahmen: [],
  text: String(text || '').slice(0, 160)
});
const auftragGewaltmarsch = (advId, sg, text) => ({
  art: 'probe',
  advId,
  probeArt: 'rw',
  wert: 'con',
  sg: Math.max(1, Math.min(40, sg)),
  text: String(text || '').slice(0, 160)
});
// ══ Ende der reinen Rechnung

// ==== planer/src/1d-begegnung.jsx ====
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
const BEGEGNUNG_ZEIT = [{
  k: 'immer',
  l: 'Tag und Nacht'
}, {
  k: 'tag',
  l: 'Nur tags'
}, {
  k: 'nacht',
  l: 'Nur nachts'
}];
const BEGEGNUNG_ART = [{
  k: 'kampf',
  l: '⚔ Kampf'
}, {
  k: 'ereignis',
  l: '✦ Ereignis'
}];
const neueTabelle = () => ({
  jeStunden: 8,
  wuerfel: 20,
  ab: 18,
  abNacht: 18,
  eintraege: []
});
const neuerTabellenEintrag = id => ({
  id,
  gewicht: 1,
  zeit: 'immer',
  art: 'kampf',
  begegnungId: '',
  text: ''
});

// ── Flaechen ─────────────────────────────────────────────────────
const polygonFlaeche = poly => {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  return Math.abs(s) / 2;
};
const punktInPolygon = (p, poly) => {
  let drin = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) drin = !drin;
  }
  return drin;
};
// Der Schwerpunkt — dort steht der Name. Bei entarteten Flaechen die Mitte der Punkte.
const polygonMitte = poly => {
  let a = 0,
    cx = 0,
    cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const f = poly[j].x * poly[i].y - poly[i].x * poly[j].y;
    a += f;
    cx += (poly[j].x + poly[i].x) * f;
    cy += (poly[j].y + poly[i].y) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const n = Math.max(1, poly.length);
    return {
      x: poly.reduce((s, p) => s + p.x, 0) / n,
      y: poly.reduce((s, p) => s + p.y, 0) / n
    };
  }
  return {
    x: cx / (3 * a),
    y: cy / (3 * a)
  };
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
const istNacht = uhr => {
  const h = (uhr % 24 + 24) % 24;
  return h >= 20 || h < 6;
};
const tabelleVon = region => region && region.dm && region.dm.tabelle || null;
const begegnungPruefen = (tabelle, nacht, zufall) => {
  const t = {
    ...neueTabelle(),
    ...(tabelle || {})
  };
  const w = Math.max(2, +t.wuerfel || 20);
  const ab = Math.max(1, +(nacht ? t.abNacht : t.ab) || w);
  const wurf = 1 + Math.floor(zufall() * w);
  if (wurf < ab) return {
    wurf,
    ab,
    treffer: false,
    eintrag: null
  };
  const passend = (t.eintraege || []).filter(e => (+e.gewicht || 0) > 0 && (e.zeit === 'immer' || !e.zeit || e.zeit === 'nacht' === nacht));
  if (!passend.length) return {
    wurf,
    ab,
    treffer: true,
    eintrag: null
  };
  return {
    wurf,
    ab,
    treffer: true,
    eintrag: passend[gewichtetWaehlen(passend.map(e => +e.gewicht), zufall)]
  };
};

// Wo die Gruppe nach t Stunden eines Reisetags steht.
const posNachStunden = (tag, t) => {
  let pos = tag.von,
    rest = Math.max(0, t);
  for (const teil of tag.teile || []) {
    if (rest <= teil.stunden) return pos + (teil.stunden ? teil.strecke * rest / teil.stunden : 0);
    pos += teil.strecke;
    rest -= teil.stunden;
  }
  return tag.bis;
};
const wuerfelSamen = (samen, tagNr, nochmal) => (+samen || 1) * 31 + tagNr * 7919 + (nochmal || 0) * 104729 >>> 0 || 1;

// Die Wachen eines Reisetags: am Ende jeder Wache ein Wurf auf die
// Tabelle der Region, in der die Gruppe dann steht. 24 Stunden ab dem
// Aufbruch, unterwegs und im Lager.
const tagesPruefungen = ({
  tag,
  route,
  massstab,
  regionen,
  startStunde,
  zufall
}) => {
  const aus = [];
  const start = Number.isFinite(+startStunde) ? +startStunde : 8;
  const wachen = new Map();
  // Jede Region hat ihren eigenen Takt. Geprueft wird zu jeder Stunde, zu
  // der irgendeine Tabelle faellig ist, und dort zaehlt nur die Region,
  // in der die Gruppe dann steht.
  (regionen || []).forEach(r => {
    const t = tabelleVon(r);
    if (t) wachen.set(r.id, Math.max(1, +t.jeStunden || 8));
  });
  const takte = [...new Set(wachen.values())].sort((a, b) => a - b);
  const stunden = new Set();
  takte.forEach(j => {
    for (let t = j; t <= 24; t += j) stunden.add(t);
  });
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
    aus.push({
      nachStunden: t,
      uhr,
      nacht,
      unterwegs,
      pos,
      punkt,
      regionId: region.id,
      regionName: region.name,
      ...w
    });
  });
  return aus;
};

// Was im Tagebuch bleibt: klein, ohne Punkte und Tabellen.
const pruefungKurz = p => ({
  uhr: p.uhr,
  nacht: p.nacht,
  unterwegs: p.unterwegs,
  region: p.regionName,
  wurf: p.wurf,
  ab: p.ab,
  treffer: p.treffer,
  art: p.eintrag ? p.eintrag.art : '',
  begegnungId: p.eintrag ? p.eintrag.begegnungId || '' : '',
  text: p.eintrag ? String(p.eintrag.text || '') : ''
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
const auftragKampf = (advId, begegnungId, name) => ({
  art: 'kampf',
  advId,
  begegnungId: String(begegnungId || ''),
  name: String(name || '').slice(0, 120)
});
// ══ Ende der reinen Rechnung

// ==== planer/src/1e-sicht.jsx ====
// ── Spielersicht: Nebel, Handouts, der Tisch ─────────────────────
// Nebel liegt an der Karte (karte.nebel) und nicht unter dm: die Spieler
// brauchen ihn, um ihn zu zeichnen. Er ist eine Liste aufgedeckter
// Flaechen — Kreise, Vielecke, oder alles.
//
//     { an: true, modus: 'offen'|'daemmrig'|'dunkel',
//       flaechen: [ {art:'kreis', x, y, r}, {art:'vieleck', punkte:[…]}, {art:'alles'} ] }
//
// Der Modus sagt, was mit Aufgedecktem geschieht, wenn die Heldengruppen
// weiterziehen: es bleibt offen, es wird daemmrig, oder wieder dunkel. In
// den beiden letzten ist nur klar, was eine Gruppe gerade sieht
// (sichtKreise in 1g-gruppe.jsx). „Alles aufdecken“ gilt immer ganz.
//
// Er verdeckt die Anzeige, nicht die Kacheln selbst: wer die Adresse
// einer Kachel einer sichtbaren Karte kennt, bekommt sie. Wirklich geheim
// bleibt nur, was an einer verborgenen Karte haengt.
//
// Alles bis zur Markierung ist reine Rechnung.

const NEBEL_RADIEN = [{
  k: 'klein',
  l: 'Klein',
  px: 45
}, {
  k: 'mittel',
  l: 'Mittel',
  px: 110
}, {
  k: 'gross',
  l: 'Groß',
  px: 240
}];
const NEBEL_MODI = [{
  k: 'offen',
  l: 'Bleibt offen',
  t: 'Was aufgedeckt ist, bleibt aufgedeckt'
}, {
  k: 'daemmrig',
  l: 'Folgt der Gruppe',
  t: 'Klar ist, was eine Heldengruppe gerade sieht; wo sie war, bleibt es dämmrig'
}, {
  k: 'dunkel',
  l: 'Folgt, alles andere dunkel',
  t: 'Nur, was eine Heldengruppe gerade sieht; wo sie war, wird es wieder dunkel'
}];
const nebelVon = karte => {
  const n = karte && karte.nebel || {};
  return {
    an: !!n.an,
    modus: NEBEL_MODI.some(x => x.k === n.modus) ? n.modus : 'offen',
    flaechen: Array.isArray(n.flaechen) ? n.flaechen : []
  };
};
const nebelFolgt = nebel => !!nebel && (nebel.modus === 'daemmrig' || nebel.modus === 'dunkel');
const flaecheAufgedeckt = (p, f) => {
  if (!f) return false;
  if (f.art === 'alles') return true;
  if (f.art === 'kreis') return Math.hypot(p.x - f.x, p.y - f.y) <= f.r;
  if (f.art === 'vieleck') return (f.punkte || []).length >= 3 && punktInPolygon(p, f.punkte);
  return false;
};
const punktAufgedeckt = (p, nebel) => !nebel || !nebel.an || (nebel.flaechen || []).some(f => flaecheAufgedeckt(p, f));
const nebelKreis = (p, r) => ({
  art: 'kreis',
  x: Math.round(p.x),
  y: Math.round(p.y),
  r: Math.max(1, Math.round(r))
});

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
const orteImAufgedeckten = (orte, nebel) => (orte || []).filter(o => o.art === 'ort' && o.mitNebel && !o.sichtbar && typeof o.x === 'number' && (nebel.flaechen || []).some(f => flaecheAufgedeckt(o, f)));

// Wird der Nebel zu gross, fasst ein Kreis, der ganz in einem anderen
// liegt, nichts zusammen — er faellt weg.
const nebelAufraeumen = flaechen => {
  if (flaechen.some(f => f.art === 'alles')) return [{
    art: 'alles'
  }];
  return flaechen.filter((f, i) => !(f.art === 'kreis' && flaechen.some((g, j) => j !== i && g.art === 'kreis' && Math.hypot(f.x - g.x, f.y - g.y) + f.r <= g.r && (g.r > f.r || j < i))));
};

// ── Was ein Spieler sieht ────────────────────────────────────────
// Dieselbe Regel wie planer_laden auf dem Server — hier fuer das
// Tischfenster, das mit der Anmeldung der Spielleitung laedt und doch nur
// zeigen darf, was die Runde sehen soll. Handouts an einzelne gehoeren
// nicht auf den Tisch.
const ohneDmFeld = o => {
  const {
    dm,
    ...rest
  } = o;
  return rest;
};
const spielerSicht = daten => {
  const karten = (daten.karten || []).filter(k => k.sichtbar).map(ohneDmFeld);
  const offen = new Set(karten.map(k => k.id));
  const objekte = (daten.objekte || []).filter(o => o.sichtbar && (o.art === 'handout' ? !(o.an || []).length : PLAN_OHNE_KARTE.includes(o.art) && !o.karteId ? true : offen.has(o.karteId))).map(ohneDmFeld)
  // Wie auf dem Server: die Spur einer Gruppe nur, wo sie freigegeben ist.
  .map(o => o.art === 'gruppe' && !o.spurFuerSpieler && (o.spur || []).length ? {
    ...o,
    spur: [o.spur[o.spur.length - 1]]
  } : o);
  return {
    ...daten,
    dm: false,
    karten,
    objekte
  };
};

// ── Handouts ─────────────────────────────────────────────────────
const neuesHandout = () => ({
  id: planNeueId('h'),
  karteId: '',
  art: 'handout',
  titel: 'Neues Handout',
  text: '',
  bild: '',
  an: [],
  sichtbar: false,
  dm: {
    notiz: ''
  }
});
// Welche verteilten Handouts dieser Spieler noch nicht gesehen hat.
// Gesehen heisst: in dieser Fassung — ein geaenderter Brief kommt wieder.
const handoutFassung = h => h.id + ':' + String(h.geaendert || '');
const ungeseheneHandouts = (objekte, gesehen) => (objekte || []).filter(o => o.art === 'handout' && o.sichtbar && !(gesehen || []).includes(handoutFassung(o)));

// ── Nachrichten an den Tisch ─────────────────────────────────────
// Das Tischfenster laeuft im selben Browser wie die Seite der
// Spielleitung; beide hoeren auf denselben Kanal.
const TISCH_KANAL = 'hb-planer-tisch';
const tischNachricht = (art, inhalt) => ({
  art,
  ...inhalt,
  zeit: Date.now()
});
// ══ Ende der reinen Rechnung

// ==== planer/src/1f-welt.jsx ====
// ── Die Welt drumherum: Figuren, Zeit, Dateien, Quests, Hexfelder, Offline ──
// Alles bis zur Markierung ist reine Rechnung
// (dev/pruefungen/planer-welt-test.js).

// ── Zeit ─────────────────────────────────────────────────────────
// Dieselbe Uhr wie die Chronik: Stunden seit Beginn des Abenteuers,
// Tag 1 beginnt bei 0.
const zeitText = std => {
  const s = Math.max(0, Math.round(+std || 0));
  return 'Tag ' + (Math.floor(s / 24) + 1) + ', ' + String(s % 24).padStart(2, '0') + ' Uhr';
};
const zeitAus = (tag, stunde) => Math.max(0, (Math.max(1, Math.round(+tag || 1)) - 1) * 24 + Math.max(0, Math.min(23, Math.round(+stunde || 0))));

// ── Figuren ──────────────────────────────────────────────────────
// Eine Figur (Art figur) ist ein NSC, ein Heer, eine Karawane: Wegpunkte
// mit Zeit. Dazwischen geht sie geradeaus; vor dem ersten steht sie am
// ersten, nach dem letzten am letzten.
const wegpunkteSortiert = f => [...(f && f.wegpunkte || [])].filter(w => Number.isFinite(+w.zeit)).sort((a, b) => a.zeit - b.zeit);
const figurPosition = (figur, zeit) => {
  const w = wegpunkteSortiert(figur);
  if (!w.length) return null;
  if (zeit <= w[0].zeit) return {
    x: w[0].x,
    y: w[0].y,
    unterwegs: false,
    von: w[0],
    bis: w[0]
  };
  for (let i = 1; i < w.length; i++) {
    if (zeit <= w[i].zeit) {
      const a = w[i - 1],
        b = w[i];
      const t = b.zeit === a.zeit ? 1 : (zeit - a.zeit) / (b.zeit - a.zeit);
      const steht = a.x === b.x && a.y === b.y;
      return {
        x: Math.round(a.x + (b.x - a.x) * t),
        y: Math.round(a.y + (b.y - a.y) * t),
        unterwegs: !steht && t > 0 && t < 1,
        von: a,
        bis: b
      };
    }
  }
  const l = w[w.length - 1];
  return {
    x: l.x,
    y: l.y,
    unterwegs: false,
    von: l,
    bis: l
  };
};
// Ein Wegpunkt zu dieser Zeit: vorhandenen ersetzen, sonst dazu.
const wegpunktSetzen = (figur, zeit, p, notiz) => {
  const liste = wegpunkteSortiert(figur).filter(w => w.zeit !== zeit);
  const alt = wegpunkteSortiert(figur).find(w => w.zeit === zeit);
  liste.push({
    zeit,
    x: Math.round(p.x),
    y: Math.round(p.y),
    notiz: notiz !== undefined ? notiz : alt ? alt.notiz || '' : ''
  });
  return {
    ...figur,
    wegpunkte: liste.sort((a, b) => a.zeit - b.zeit)
  };
};
// Der Bereich des Zeitschiebers: alle Wegpunkte, die Uhr der Chronik, und
// ein Tag Luft auf beiden Seiten.
const zeitBereich = (figuren, jetzt) => {
  const zeiten = figuren.flatMap(f => wegpunkteSortiert(f).map(w => w.zeit));
  if (jetzt != null && Number.isFinite(+jetzt)) zeiten.push(+jetzt);
  if (!zeiten.length) return {
    min: 0,
    max: 24 * 7
  };
  return {
    min: Math.max(0, Math.min(...zeiten) - 24),
    max: Math.max(...zeiten) + 24
  };
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
const NSC_ZEICHEN = {
  freundlich: '🤝',
  feindlich: '☠'
};
const istNscBogen = h => !!(h && h.npc);
const nscZeichen = h => NSC_ZEICHEN[(h && h.haltung) === 'feindlich' ? 'feindlich' : 'freundlich'];
const nscWerte = h => {
  if (!h) return '';
  const tp = (+h.tpMax || 0) > 0 ? (+h.tp || 0) + '/' + h.tpMax + ' TP' : '';
  return ['RK ' + (+h.rk || 10), tp].filter(Boolean).join(' · ');
};
const nscZuFigur = (figur, helden) => (helden || []).find(h => h.id === (figur && figur.charId)) || null;
// Die NSC eines Abenteuers, in der Reihenfolge der Tafel: erst die
// freundlichen, dann die feindlichen, je Gruppe nach Namen.
const nscListe = helden => (helden || []).filter(istNscBogen).sort((a, b) => a.haltung === b.haltung ? String(a.name).localeCompare(String(b.name), 'de') : a.haltung === 'feindlich' ? 1 : -1);

// ── Lokale Dateien ───────────────────────────────────────────────
// Eine Datei am Ort ist ein Verweis, nie ein Upload: eine Bibliothek (ein
// Name, den jeder Rechner selbst einem Ordner zuordnet) und ein Pfad darin.
// So findet der Laptop dieselbe Datei, auch wenn OneDrive dort woanders liegt.
const DATEI_ARTEN = {
  bild: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'svg'],
  ton: ['mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus'],
  video: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'ogv'],
  dokument: ['pdf', 'txt', 'md', 'html', 'htm', 'docx', 'odt', 'xlsx', 'ods', 'pptx', 'epub', 'cbz']
};
const DATEI_ZEICHEN = {
  bild: '🖼',
  ton: '🎵',
  video: '🎬',
  dokument: '📄',
  sonst: '📎'
};
const dateiEndung = pfad => {
  const m = /\.([A-Za-z0-9]{1,6})$/.exec(String(pfad || ''));
  return m ? m[1].toLowerCase() : '';
};
const dateiArt = pfad => {
  const e = dateiEndung(pfad);
  return Object.keys(DATEI_ARTEN).find(k => DATEI_ARTEN[k].includes(e)) || 'sonst';
};
// Was der Browser selbst zeigen kann. MKV, AVI und Office nicht — dafuer
// ist die Brücke da.
const IM_BROWSER = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus', 'mp4', 'webm', 'm4v', 'ogv', 'pdf', 'txt', 'md'];
const imBrowserZeigbar = pfad => IM_BROWSER.includes(dateiEndung(pfad));

// Ein relativer Pfad, wie ihn der Planer speichert: Schraegstriche, kein
// Laufwerk, kein .. — sonst gar keiner.
const relativerPfad = roh => {
  const teile = String(roh || '').replace(/\\/g, '/').split('/').filter(t => t !== '' && t !== '.');
  if (!teile.length || teile.some(t => t === '..' || /^[A-Za-z]:$/.test(t) || /[<>:"|?*\x00-\x1f]/.test(t))) return '';
  if (/^[\\/]/.test(String(roh || '')) || /^[A-Za-z]:/.test(String(roh || ''))) return '';
  return teile.join('/');
};
const bibliotheksName = roh => String(roh || '').trim().replace(/[^\p{L}\p{N} _-]+/gu, '').slice(0, 40);
const dateiVerweis = (bibliothek, pfad, titel) => {
  const b = bibliotheksName(bibliothek),
    p = relativerPfad(pfad);
  if (!b || !p) return null;
  return {
    bibliothek: b,
    pfad: p,
    titel: String(titel || p.split('/').pop()).slice(0, 120)
  };
};
// Die Adresse fuer die Planer-Brücke (planer/bruecke/). Der Browser fragt
// beim ersten Mal, ob er das Programm oeffnen darf.
const BRUECKE_SCHEMA = 'heldenbuch-planer';
const brueckenAdresse = v => BRUECKE_SCHEMA + '://oeffnen?bibliothek=' + encodeURIComponent(v.bibliothek) + '&pfad=' + encodeURIComponent(v.pfad);

// ── Quests, Wissen, Fraktionen ───────────────────────────────────
const QUEST_STATUS = [{
  k: 'offen',
  l: 'Gehört',
  zeichen: '❔'
}, {
  k: 'aktiv',
  l: 'Angenommen',
  zeichen: '❗'
}, {
  k: 'erledigt',
  l: 'Erledigt',
  zeichen: '✔'
}, {
  k: 'gescheitert',
  l: 'Gescheitert',
  zeichen: '✖'
}];
const questStatus = k => QUEST_STATUS.find(s => s.k === k) || QUEST_STATUS[0];
const neueQuest = () => ({
  id: planNeueId('q'),
  karteId: '',
  art: 'quest',
  titel: 'Neue Quest',
  status: 'offen',
  auftraggeber: '',
  zielOrt: '',
  belohnung: '',
  text: '',
  schritte: [],
  sichtbar: false,
  dm: {
    notiz: ''
  }
});
const questFortschritt = q => {
  const s = q.schritte || [];
  return {
    fertig: s.filter(x => x.erledigt).length,
    alle: s.length
  };
};
// Offene Faeden zuerst, Erledigtes nach hinten.
const questsSortiert = qs => [...qs].sort((a, b) => QUEST_STATUS.findIndex(s => s.k === (a.status || 'offen')) - QUEST_STATUS.findIndex(s => s.k === (b.status || 'offen')) || String(a.titel).localeCompare(String(b.titel), 'de'));
const HINWEIS_ARTEN = [{
  k: 'geruecht',
  l: 'Gerücht',
  zeichen: '🗣'
}, {
  k: 'hinweis',
  l: 'Hinweis',
  zeichen: '🔎'
}, {
  k: 'wissen',
  l: 'Wissen',
  zeichen: '📚'
}];
const neuerHinweis = () => ({
  id: planNeueId('n'),
  karteId: '',
  art: 'hinweis',
  artDesWissens: 'geruecht',
  text: '',
  ortId: '',
  questId: '',
  bekanntSeit: '',
  sichtbar: false,
  dm: {
    wahr: 'wahr',
    notiz: ''
  }
});
// „Was wissen die Spieler?" — sichtbar heisst bekannt.
const bekanntesWissen = (objekte, ortId) => (objekte || []).filter(o => o.art === 'hinweis' && o.sichtbar && (!ortId || o.ortId === ortId));
const neueFraktion = () => ({
  id: planNeueId('f'),
  karteId: '',
  art: 'fraktion',
  name: 'Neue Fraktion',
  farbe: '#9b7fd0',
  ruf: 0,
  text: '',
  regionen: [],
  sichtbar: false,
  dm: {
    ziele: '',
    notiz: ''
  }
});
const RUF_STUFEN = [{
  ab: -3,
  l: 'Verfeindet'
}, {
  ab: -2,
  l: 'Feindselig'
}, {
  ab: -1,
  l: 'Misstrauisch'
}, {
  ab: 0,
  l: 'Neutral'
}, {
  ab: 1,
  l: 'Wohlgesinnt'
}, {
  ab: 2,
  l: 'Freundlich'
}, {
  ab: 3,
  l: 'Verbündet'
}];
const rufText = ruf => {
  const r = Math.max(-3, Math.min(3, Math.round(+ruf || 0)));
  return RUF_STUFEN.find(s => s.ab === r).l;
};
const fraktionenDerRegion = (fraktionen, regionId) => (fraktionen || []).filter(f => (f.regionen || []).includes(regionId));

// ── Proviant und Navigation ──────────────────────────────────────
// Der Vorrat einer Reise sinkt mit jedem abgeschlossenen Tag um das, was
// die Gruppe braucht. Was fehlt, steht als Warnung da.
const vorratNachTag = (vorrat, personen) => {
  const v = {
    rationen: +(vorrat || {}).rationen || 0,
    wasserLiter: +(vorrat || {}).wasserLiter || 0
  };
  const b = verpflegung(1, personen);
  const neu = {
    rationen: Math.max(0, v.rationen - b.rationen),
    wasserLiter: Math.max(0, v.wasserLiter - b.wasserLiter)
  };
  const fehlt = {
    rationen: Math.max(0, b.rationen - v.rationen),
    wasserLiter: Math.max(0, b.wasserLiter - v.wasserLiter)
  };
  return {
    vorrat: neu,
    fehlt,
    reichtTage: b.rationen ? Math.floor(neu.rationen / b.rationen) : Infinity
  };
};
// Navigation abseits der Wege: eine Probe auf Überlebenskunst am Morgen.
// SG-Vorgaben des Planers; auf Straße und Wasser (mit Schiff) keine Probe.
const NAVIGATION_SG = {
  strasse: 0,
  offen: 10,
  huegel: 12,
  wueste: 13,
  wald: 15,
  sumpf: 15,
  gebirge: 15,
  schnee: 15,
  wasser: 0
};
const navigationSg = tag => {
  const sg = Math.max(0, ...(tag && tag.teile || []).map(t => NAVIGATION_SG[t.gelaende] || 0));
  return sg > 0 ? sg : 0;
};
const auftragNavigation = (advId, sg, text) => ({
  art: 'probe',
  advId,
  probeArt: 'fert',
  wert: 'ueberleben',
  sg,
  text: String(text || '').slice(0, 160)
});

// ── Hexfelder ────────────────────────────────────────────────────
// Spitze Hexfelder (pointy top), Groesse von Seite zu Seite gemessen, wie
// Hexkarten es angeben („6 Meilen je Feld"). Adressen als Spalte.Zeile.
const hexRadiusPx = (groesse, m) => m ? groesse * pxJeEinheit(m) / Math.sqrt(3) : 0;
const hexAchsial = (p, r, ursprung) => {
  const o = ursprung || {
    x: 0,
    y: 0
  };
  const x = (p.x - o.x) / r,
    y = (p.y - o.y) / r;
  let q = Math.sqrt(3) / 3 * x - y / 3,
    rr = 2 / 3 * y;
  let s = -q - rr;
  let rq = Math.round(q),
    rr2 = Math.round(rr),
    rs = Math.round(s);
  const dq = Math.abs(rq - q),
    dr = Math.abs(rr2 - rr),
    ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr2 - rs;else if (dr > ds) rr2 = -rq - rs;
  return {
    q: rq + 0,
    r: rr2 + 0
  };
};
const hexMitte = (h, r, ursprung) => {
  const o = ursprung || {
    x: 0,
    y: 0
  };
  return {
    x: o.x + r * Math.sqrt(3) * (h.q + h.r / 2),
    y: o.y + r * 1.5 * h.r
  };
};
const hexEcken = (m, r) => Array.from({
  length: 6
}, (_, i) => {
  const w = Math.PI / 180 * (60 * i - 30);
  return {
    x: m.x + r * Math.cos(w),
    y: m.y + r * Math.sin(w)
  };
});
// Versetzte Adresse (odd-r): Spalte.Zeile, zweistellig, ab 01.
const hexAdresse = h => {
  const zeile = h.r,
    spalte = h.q + (h.r - (h.r & 1)) / 2;
  return String(spalte + 1).padStart(2, '0') + '.' + String(zeile + 1).padStart(2, '0');
};
// Alle Felder in einem Bildausschnitt — oder keine, wenn es zu viele waeren.
const hexeIm = (links, oben, rechts, unten, r, hoechstens) => {
  if (!(r > 0)) return [];
  const zeilen = Math.ceil((unten - oben) / (1.5 * r)) + 2,
    spalten = Math.ceil((rechts - links) / (Math.sqrt(3) * r)) + 2;
  if (zeilen * spalten > (hoechstens || 2500)) return [];
  const aus = [];
  const r0 = Math.floor(oben / (1.5 * r)) - 1;
  for (let rr = r0; rr <= r0 + zeilen; rr++) {
    const q0 = Math.floor(links / (Math.sqrt(3) * r) - rr / 2) - 1;
    for (let q = q0; q <= q0 + spalten; q++) aus.push({
      q,
      r: rr
    });
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
    for (let z = 0; z <= plan.maxZ; z++) kachelnDerStufe(plan, z).forEach(t => aus.push({
      ablage: karte.ablage,
      pfad: kachelPfad(b.ordner, t.z, t.x, t.y, b.endung)
    }));
    if (b.vorschau) aus.push({
      ablage: karte.ablage,
      pfad: b.vorschau
    });
  }
  (objekte || []).forEach(o => {
    if (o.art === 'ort' && o.karteId === (karte && karte.id)) (o.bilder || []).forEach(p => aus.push({
      ablage: karte.ablage,
      pfad: p
    }));
    if (o.art === 'handout' && o.ablage && o.bild) aus.push({
      ablage: o.ablage,
      pfad: o.bild
    });
  });
  const gesehen = new Set();
  return aus.filter(d => {
    const k = d.ablage + '/' + d.pfad;
    if (gesehen.has(k)) return false;
    gesehen.add(k);
    return true;
  });
};
const OFFLINE_SPEICHER = 'hb_planer_offline_';
const offlineStand = (start, daten, jetzt) => JSON.stringify({
  zeit: (jetzt || new Date()).toISOString(),
  start,
  daten
});
// ══ Ende der reinen Rechnung

// ==== planer/src/1g-gruppe.jsx ====
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
const gruppePosition = g => {
  const s = g && g.spur || [];
  return s.length ? s[s.length - 1] : null;
};
const neueGruppe = (karteId, p, zeit, helden, namen) => ({
  id: planNeueId('g'),
  karteId,
  art: 'gruppe',
  name: 'Heldengruppe',
  symbol: '🛡',
  sichtbar: true,
  helden: [...(helden || [])],
  heldenNamen: {
    ...(namen || {})
  },
  sichtweite: 5,
  spurFuerSpieler: false,
  spur: [{
    zeit: Math.round(+zeit || 0),
    x: Math.round(p.x),
    y: Math.round(p.y),
    art: 'start'
  }],
  dm: {
    notiz: ''
  }
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
  const punkt = {
    zeit: Math.round(+zeit || 0),
    x: Math.round(ziel.x),
    y: Math.round(ziel.y),
    art: art || 'zug'
  };
  const gruppe = {
    ...g,
    spur: spurAnhaengen(g.spur, [punkt])
  };
  let kreise = [];
  if (massstab && (+g.sichtweite || 0) > 0) {
    const linie = {
      punkte: von ? [von, punkt] : [punkt, punkt],
      gelaende: ['offen']
    };
    kreise = kreiseEntlang(linie, massstab, 0, routeLaenge(linie, massstab), +g.sichtweite);
    if (!kreise.length) kreise = [nebelKreis(punkt, +g.sichtweite * pxJeEinheit(massstab))];
  }
  return {
    gruppe,
    kreise
  };
};

// Die Punkte einer Route zwischen zwei Positionen, samt der Ecken dazwischen
// — damit die Spur einer Reise der Route folgt und nicht quer uebers Land.
const routenPunkteZwischen = (route, m, von, bis) => {
  if (!m || !(bis > von)) return [];
  const aus = [punktAufRoute(route, m, von)];
  let s = 0;
  for (const a of routeAbschnitte(route, m)) {
    s += a.laenge;
    if (s > von + 1e-9 && s < bis - 1e-9) aus.push({
      x: Math.round(a.bis.x),
      y: Math.round(a.bis.y)
    });
  }
  aus.push(punktAufRoute(route, m, bis));
  return aus.filter(Boolean);
};
// Eine Reise zieht die Gruppe mit: Punkte der Route mit Zeiten, verteilt
// ueber die Stunden des Tags.
const gruppeReist = (g, punkte, zeitVon, stunden, massstab) => {
  if (!punkte.length) return {
    gruppe: g,
    kreise: []
  };
  const linie = {
    punkte,
    gelaende: punkte.slice(1).map(() => 'offen')
  };
  const gesamt = routeLaenge(linie, massstab) || 1;
  let s = 0;
  const neu = punkte.map((p, i) => {
    if (i > 0) s += abstandPx(punkte[i - 1], p) / (massstab ? pxJeEinheit(massstab) : 1);
    return {
      zeit: Math.round((+zeitVon || 0) + stunden * (s / gesamt)),
      x: p.x,
      y: p.y,
      art: 'reise'
    };
  });
  const letzte = gruppePosition(g);
  const ohneDoppel = letzte && neu.length && neu[0].x === letzte.x && neu[0].y === letzte.y ? neu.slice(1) : neu;
  const kreise = massstab && (+g.sichtweite || 0) > 0 ? kreiseEntlang(linie, massstab, 0, gesamt, +g.sichtweite) : [];
  return {
    gruppe: {
      ...g,
      spur: spurAnhaengen(g.spur, ohneDoppel)
    },
    kreise
  };
};
const spurLaenge = (g, m) => {
  const s = g && g.spur || [];
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
  const hier = gruppePosition(g) || {
    x: 0,
    y: 0
  };
  const namen = g.heldenNamen || {};
  const neue = {
    ...g,
    id: neueId,
    name: weg.map(h => namen[h] || h).join(', '),
    helden: weg,
    heldenNamen: Object.fromEntries(weg.map(h => [h, namen[h] || h])),
    spur: [{
      zeit: Math.round(+zeit || 0),
      x: hier.x,
      y: hier.y,
      art: 'teilung'
    }],
    aus: g.id,
    dm: {
      notiz: ''
    }
  };
  const bleibt = (g.helden || []).filter(h => !heldenIds.includes(h));
  return {
    alte: {
      ...g,
      helden: bleibt,
      heldenNamen: Object.fromEntries(bleibt.map(h => [h, namen[h] || h]))
    },
    neue
  };
};

// Vereinen: die zweite Gruppe geht in der ersten auf. Steht sie woanders,
// zieht die erste nicht — die Spielleitung setzt die Gruppe danach selbst.
const gruppenVereinen = (ziel, quelle, zeit) => {
  const helden = [...new Set([...(ziel.helden || []), ...(quelle.helden || [])])];
  const namen = {
    ...(quelle.heldenNamen || {}),
    ...(ziel.heldenNamen || {})
  };
  const hier = gruppePosition(ziel);
  const spur = hier ? spurAnhaengen(ziel.spur, [{
    zeit: Math.round(+zeit || 0),
    x: hier.x,
    y: hier.y,
    art: 'vereint'
  }]) : ziel.spur;
  // Der Name der groesseren Gruppe bleibt: wer die abgeteilte „Bea“ mit der
  // Heldengruppe vereint, will wieder die Heldengruppe haben.
  const name = (quelle.helden || []).length > (ziel.helden || []).length ? quelle.name : ziel.name;
  return {
    ...ziel,
    name,
    symbol: name === quelle.name ? quelle.symbol : ziel.symbol,
    helden,
    heldenNamen: namen,
    spur
  };
};

// Folgt der Nebel den Gruppen, ist klar, was sie gerade sehen: ein Kreis
// mit der Sichtweite um jede Gruppe, die Spieler sehen duerfen. Waehrend
// die Spielleitung eine Marke zieht, steht der Kreis dort, wo die Marke ist.
const sichtKreise = (gruppen, massstab, gezogen) => {
  if (!massstab) return [];
  return (gruppen || []).filter(g => g.sichtbar && (+g.sichtweite || 0) > 0).map(g => {
    const p = gezogen && gezogen.id === g.id ? gezogen : gruppePosition(g);
    return p ? nebelKreis(p, +g.sichtweite * pxJeEinheit(massstab)) : null;
  }).filter(Boolean);
};

// Welche Boegen noch keiner Gruppe auf dieser Karte angehoeren.
const heldenOhneGruppe = (helden, gruppen, ausser) => {
  const vergeben = new Set((gruppen || []).filter(g => g.id !== ausser).flatMap(g => g.helden || []));
  return (helden || []).filter(h => !vergeben.has(h.id));
};
// ══ Ende der reinen Rechnung

// ==== planer/src/2-leinwand.jsx ====
// ── Die Kartenleinwand ───────────────────────────────────────────
// Zeigt die Kachelpyramide einer Karte: ziehen zum Verschieben, Mausrad
// oder zwei Finger zum Zoomen, dazu Orte, Lineal und Maßstabsleiste.
// Die Rechnung dahinter steht in 1b-kacheln.jsx.
//
// Ein Klick (ohne Ziehen) meldet den Bildpunkt nach oben — was er
// bedeutet, entscheidet das Werkzeug in der Seite.

const LEINWAND_KLICK_PX = 5;
const KartenLeinwand = ({
  karte,
  orte,
  dm,
  werkzeug,
  ortWahl,
  linie,
  fokus,
  gedaechtnis,
  routen,
  gruppen,
  routeWahl,
  reiseWahl,
  onRouteWahl,
  onReiseWahl,
  regionen,
  regionWahl,
  onRegionWahl,
  nebel,
  nebelDeckend,
  vorgabeAnsicht,
  onAnsicht,
  figuren,
  figurWahl,
  onFigurWahl,
  onFigurVerschieben,
  hex,
  questOrte,
  heldengruppen,
  gruppeWahl,
  onGruppeWahl,
  onGruppeZiehen,
  onKlick,
  onOrtWahl,
  onOrtVerschieben,
  onBildWaehlen
}) => {
  const box = useRef(null);
  const [g, setG] = useState({
    breite: 0,
    hoehe: 0
  });
  const [a, setA] = useState(null);
  const [zieh, setZieh] = useState(null); // {id, x, y} beim Verschieben eines Orts
  const zeiger = useRef({
    punkte: new Map(),
    weg: 0,
    start: null
  });
  const bild = karte.bild || null;
  const plan = useMemo(() => bild ? kachelPlan(bild.breite, bild.hoehe, bild.kachel) : null, [bild && bild.breite, bild && bild.hoehe, bild && bild.kachel]);
  const schluessel = karte.id + '|' + (bild ? bild.ordner : '');
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const messen = () => setG({
      breite: el.clientWidth,
      hoehe: el.clientHeight
    });
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Beim Wechsel der Karte: dort weiter, wo man zuletzt war, sonst
  // das ganze Bild.
  useEffect(() => {
    if (!plan || !g.breite) {
      setA(null);
      return;
    }
    const alt = gedaechtnis && gedaechtnis.current[schluessel];
    setA(alt ? ansichtBegrenzen(alt, plan, g) : ansichtEinpassen(plan, g));
  }, [schluessel, !!plan, g.breite > 0]);
  useEffect(() => {
    if (a && gedaechtnis) gedaechtnis.current[schluessel] = a;
  }, [a]);
  useEffect(() => {
    if (a && plan && g.breite) setA(v => v && ansichtBegrenzen(v, plan, g));
  }, [g.breite, g.hoehe]);

  // Das Tischfenster bekommt den Ausschnitt der Spielleitung: dieselbe
  // Mitte und dieselbe Breite in Bildpixeln, gleich wie gross sein Schirm ist.
  useEffect(() => {
    const v = vorgabeAnsicht;
    if (!v || !plan || !g.breite || v.karteId && v.karteId !== karte.id) return;
    const zoom = plan.maxZ + Math.log2(Math.max(1e-6, g.breite / Math.max(1, v.breite || plan.breite)));
    setA(ansichtBegrenzen({
      zoom,
      x: v.x,
      y: v.y
    }, plan, g));
  }, [vorgabeAnsicht && vorgabeAnsicht.n, !!plan, g.breite]);
  useEffect(() => {
    if (!onAnsicht || !a || !plan || !g.breite) return;
    onAnsicht({
      x: Math.round(a.x),
      y: Math.round(a.y),
      breite: Math.round(g.breite / ansichtMass(a, plan))
    });
  }, [a && a.x, a && a.y, a && a.zoom, g.breite]);

  // Ein Ort aus der Liste: dorthin, und nah genug heran.
  useEffect(() => {
    if (!fokus || !plan || !g.breite) return;
    setA(v => ansichtBegrenzen({
      zoom: Math.max(v ? v.zoom : 0, plan.maxZ - 1),
      x: fokus.x,
      y: fokus.y
    }, plan, g));
  }, [fokus && fokus.n]);

  // Das Mausrad braucht einen Zuhoerer, der preventDefault darf.
  useEffect(() => {
    const el = box.current;
    if (!el || !plan) return;
    const rad = e => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const pt = {
        x: e.clientX - r.left,
        y: e.clientY - r.top
      };
      const schritt = -e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022);
      setA(v => v && zoomUm(v, pt, v.zoom + Math.max(-1, Math.min(1, schritt)), g, plan));
    };
    el.addEventListener('wheel', rad, {
      passive: false
    });
    return () => el.removeEventListener('wheel', rad);
  }, [plan, g.breite, g.hoehe]);
  const punktAus = e => {
    const r = box.current.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
  };
  const runter = e => {
    if (!plan || !a) return;
    if (e.button !== undefined && e.button > 0) return;
    // Knoepfe auf der Karte bekommen ihren Klick selbst.
    if (e.target.closest && e.target.closest('button, .pl-route-treffer')) return;
    try {
      box.current.setPointerCapture(e.pointerId);
    } catch (err) {/* ohne Fangen geht es auch */}
    const pt = punktAus(e);
    zeiger.current.punkte.set(e.pointerId, pt);
    if (zeiger.current.punkte.size === 1) {
      zeiger.current.weg = 0;
      zeiger.current.start = pt;
    }
  };
  const bewegen = e => {
    const z = zeiger.current;
    if (!z.punkte.has(e.pointerId) || !plan) return;
    const pt = punktAus(e);
    const vorher = z.punkte.get(e.pointerId);
    if (z.punkte.size === 1) {
      z.weg += Math.hypot(pt.x - vorher.x, pt.y - vorher.y);
      z.punkte.set(e.pointerId, pt);
      if (z.weg > LEINWAND_KLICK_PX) setA(v => v && verschieben(v, pt.x - vorher.x, pt.y - vorher.y, plan, g));
      return;
    }
    // Zwei Finger: der Abstand zoomt, die Mitte verschiebt.
    const [idA, idB] = [...z.punkte.keys()];
    const altA = z.punkte.get(idA),
      altB = z.punkte.get(idB);
    z.punkte.set(e.pointerId, pt);
    const neuA = z.punkte.get(idA),
      neuB = z.punkte.get(idB);
    const dAlt = Math.hypot(altB.x - altA.x, altB.y - altA.y),
      dNeu = Math.hypot(neuB.x - neuA.x, neuB.y - neuA.y);
    const mAlt = {
        x: (altA.x + altB.x) / 2,
        y: (altA.y + altB.y) / 2
      },
      mNeu = {
        x: (neuA.x + neuB.x) / 2,
        y: (neuA.y + neuB.y) / 2
      };
    z.weg = LEINWAND_KLICK_PX + 1;
    if (dAlt > 0 && dNeu > 0) {
      setA(v => {
        if (!v) return v;
        const gezoomt = zoomUm(v, mAlt, v.zoom + Math.log2(dNeu / dAlt), g, plan);
        return verschieben(gezoomt, mNeu.x - mAlt.x, mNeu.y - mAlt.y, plan, g);
      });
    }
  };
  const hoch = e => {
    const z = zeiger.current;
    if (!z.punkte.has(e.pointerId)) return;
    const einzeln = z.punkte.size === 1;
    z.punkte.delete(e.pointerId);
    if (einzeln && z.weg <= LEINWAND_KLICK_PX && e.type === 'pointerup' && a && plan) {
      const p = schirmZuBild(punktAus(e), a, g, plan);
      if (p.x >= 0 && p.y >= 0 && p.x <= plan.breite && p.y <= plan.hoehe) onKlick && onKlick({
        x: Math.round(p.x),
        y: Math.round(p.y)
      }, ansichtMass(a, plan));
    }
  };

  // Orte ziehen: nur die Spielleitung, nur mit dem Werkzeug „Ansehen“.
  const ortRunter = (e, o) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button > 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {/* ohne Fangen geht es auch */}
    const pt = punktAus(e);
    setZieh({
      id: o.id,
      start: pt,
      weg: 0,
      x: o.x,
      y: o.y,
      darf: dm && werkzeug === 'ansehen'
    });
  };
  const ortBewegen = e => {
    if (!zieh || !zieh.darf) return;
    const pt = punktAus(e);
    const p = schirmZuBild(pt, a, g, plan);
    setZieh(v => v && {
      ...v,
      weg: Math.max(v.weg, Math.hypot(pt.x - v.start.x, pt.y - v.start.y)),
      x: Math.round(Math.max(0, Math.min(plan.breite, p.x))),
      y: Math.round(Math.max(0, Math.min(plan.hoehe, p.y)))
    });
  };
  const ortHoch = (e, o) => {
    e.stopPropagation();
    const z = zieh;
    setZieh(null);
    if (!z) return;
    if (o.art === 'gruppe') {
      if (z.darf && z.weg > LEINWAND_KLICK_PX) onGruppeZiehen && onGruppeZiehen(o, {
        x: z.x,
        y: z.y
      });else onGruppeWahl && onGruppeWahl(o.id);
      return;
    }
    if (o.art === 'figur') {
      if (z.darf && z.weg > LEINWAND_KLICK_PX) onFigurVerschieben && onFigurVerschieben(o, {
        x: z.x,
        y: z.y
      });else onFigurWahl && onFigurWahl(o.id);
      return;
    }
    if (z.darf && z.weg > LEINWAND_KLICK_PX) onOrtVerschieben && onOrtVerschieben(o, {
      x: z.x,
      y: z.y
    });else onOrtWahl && onOrtWahl(o.id);
  };
  const knopfZoom = d => setA(v => v && plan && zoomUm(v, {
    x: g.breite / 2,
    y: g.hoehe / 2
  }, v.zoom + d, g, plan));
  let inhalt = null;
  if (!bild) {
    inhalt = /*#__PURE__*/React.createElement("div", {
      className: "pl-leinwand-text"
    }, /*#__PURE__*/React.createElement("strong", null, dm ? 'Noch kein Kartenbild' : 'Diese Karte hat noch kein Bild'), dm ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "PNG, JPEG oder WebP, auch sehr gro\xDFe Karten. Das Bild wird hier im Browser in Kacheln geschnitten."), /*#__PURE__*/React.createElement("button", {
      className: "pl-knopf pl-haupt",
      onClick: onBildWaehlen
    }, "\uD83D\uDDBC Kartenbild w\xE4hlen")) : /*#__PURE__*/React.createElement("span", null, "Die Spielleitung hat noch keins hinterlegt."));
  } else if (a && plan && g.breite) {
    const z = stufeFuer(a.zoom, plan);
    const hinten = Math.max(0, z - 2);
    const url = t => planerDateiUrl(karte.ablage, kachelPfad(bild.ordner, t.z, t.x, t.y, bild.endung));
    const kacheln = (hinten < z ? sichtbareKacheln(a, g, plan, hinten) : []).concat(sichtbareKacheln(a, g, plan, z));
    const schirm = p => bildZuSchirm(p, a, g, plan);
    const leiste = massstabLeiste(karte.massstab, a, plan, 110);
    inhalt = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "pl-kacheln",
      "aria-hidden": "true"
    }, kacheln.map(t => /*#__PURE__*/React.createElement("img", {
      key: t.z + '/' + t.x + '/' + t.y,
      src: url(t),
      alt: "",
      draggable: false,
      className: t.z < z ? 'hinten' : '',
      style: {
        left: t.links,
        top: t.oben,
        width: t.breite + 0.6,
        height: t.hoehe + 0.6
      }
    }))), nebel && nebel.an && (() => {
      const s = ansichtMass(a, plan);
      const maskeId = 'nebel-' + karte.id;
      // Folgt der Nebel den Gruppen: Aufgedecktes wird daemmrig (grau in
      // der Maske) oder bleibt dunkel, klar ist nur die Sicht der Gruppen.
      const folgt = nebelFolgt(nebel);
      const erkundet = !folgt ? 'black' : nebel.modus === 'daemmrig' ? '#8a8a8a' : null;
      const sicht = folgt ? sichtKreise(heldengruppen, karte.massstab, zieh) : [];
      return /*#__PURE__*/React.createElement("svg", {
        className: 'pl-nebel' + (nebelDeckend ? ' deckend' : ''),
        width: g.breite,
        height: g.hoehe,
        "aria-hidden": "true"
      }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("filter", {
        id: maskeId + '-weich',
        x: "-10%",
        y: "-10%",
        width: "120%",
        height: "120%"
      }, /*#__PURE__*/React.createElement("feGaussianBlur", {
        stdDeviation: nebelDeckend ? 10 : 4
      })), /*#__PURE__*/React.createElement("mask", {
        id: maskeId,
        maskUnits: "userSpaceOnUse",
        x: "0",
        y: "0",
        width: g.breite,
        height: g.hoehe
      }, /*#__PURE__*/React.createElement("rect", {
        x: "0",
        y: "0",
        width: g.breite,
        height: g.hoehe,
        fill: "white"
      }), /*#__PURE__*/React.createElement("g", {
        filter: 'url(#' + maskeId + '-weich)'
      }, nebel.flaechen.map((f, i) => {
        if (f.art === 'alles') return /*#__PURE__*/React.createElement("rect", {
          key: i,
          x: "0",
          y: "0",
          width: g.breite,
          height: g.hoehe,
          fill: "black"
        });
        if (!erkundet) return null;
        if (f.art === 'kreis') {
          const m = schirm(f);
          return /*#__PURE__*/React.createElement("circle", {
            key: i,
            className: "pl-nebel-erkundet",
            cx: m.x,
            cy: m.y,
            r: f.r * s,
            fill: erkundet
          });
        }
        if (f.art === 'vieleck') return /*#__PURE__*/React.createElement("polygon", {
          key: i,
          className: "pl-nebel-erkundet",
          points: (f.punkte || []).map(q => {
            const m = schirm(q);
            return m.x + ',' + m.y;
          }).join(' '),
          fill: erkundet
        });
        return null;
      }), sicht.map((f, i) => {
        const m = schirm(f);
        return /*#__PURE__*/React.createElement("circle", {
          key: 's' + i,
          className: "pl-nebel-sicht",
          cx: m.x,
          cy: m.y,
          r: f.r * s,
          fill: "black"
        });
      })))), /*#__PURE__*/React.createElement("rect", {
        className: "pl-nebel-flaeche",
        x: "0",
        y: "0",
        width: g.breite,
        height: g.hoehe,
        mask: 'url(#' + maskeId + ')'
      }));
    })(), hex && hex.an && karte.massstab && (() => {
      const s = ansichtMass(a, plan);
      const r = hexRadiusPx(hex.groesse || 10, karte.massstab);
      if (r * s < 6) return null;
      const ol = schirmZuBild({
          x: 0,
          y: 0
        }, a, g, plan),
        ur = schirmZuBild({
          x: g.breite,
          y: g.hoehe
        }, a, g, plan);
      const felder = hexeIm(ol.x, ol.y, ur.x, ur.y, r, 2500);
      const beschriften = r * s > 34;
      return /*#__PURE__*/React.createElement("svg", {
        className: "pl-hex",
        width: g.breite,
        height: g.hoehe,
        "aria-hidden": "true"
      }, felder.map(f => {
        const m = hexMitte(f, r);
        const pts = hexEcken(m, r).map(q => {
          const p2 = schirm(q);
          return p2.x + ',' + p2.y;
        }).join(' ');
        const sm = schirm(m);
        return /*#__PURE__*/React.createElement("g", {
          key: f.q + ':' + f.r
        }, /*#__PURE__*/React.createElement("polygon", {
          points: pts
        }), beschriften && /*#__PURE__*/React.createElement("text", {
          x: sm.x,
          y: sm.y - r * s * 0.55
        }, hexAdresse(f)));
      }));
    })(), /*#__PURE__*/React.createElement("svg", {
      className: "pl-ueberlage",
      width: g.breite,
      height: g.hoehe
    }, (regionen || []).map(r => {
      const ps = (r.punkte || []).map(schirm);
      if (ps.length < 3) return null;
      return /*#__PURE__*/React.createElement("polygon", {
        key: r.id,
        points: ps.map(s => s.x + ',' + s.y).join(' '),
        className: 'pl-region' + (r.id === regionWahl ? ' aktiv' : '') + (dm && !r.sichtbar ? ' verborgen' : ''),
        style: {
          fill: r.farbe || REGION_FARBEN[0],
          stroke: r.farbe || REGION_FARBEN[0]
        }
      });
    }), (routen || []).map(r => {
      const ps = (r.punkte || []).map(schirm);
      if (ps.length < 2) return null;
      const zug = ps.map(s => s.x + ',' + s.y).join(' ');
      return /*#__PURE__*/React.createElement("g", {
        key: r.id,
        className: 'pl-route' + (r.id === routeWahl ? ' aktiv' : '') + (dm && !r.sichtbar ? ' verborgen' : '')
      }, /*#__PURE__*/React.createElement("polyline", {
        points: zug,
        className: "pl-route-grund"
      }), ps.slice(1).map((s, i) => /*#__PURE__*/React.createElement("line", {
        key: i,
        x1: ps[i].x,
        y1: ps[i].y,
        x2: s.x,
        y2: s.y,
        className: "pl-route-strich",
        style: {
          stroke: gelaende((r.gelaende || [])[i] || r.standard || 'offen').farbe
        }
      })), /*#__PURE__*/React.createElement("polyline", {
        points: zug,
        className: "pl-route-treffer",
        onClick: () => onRouteWahl && onRouteWahl(r.id)
      }, /*#__PURE__*/React.createElement("title", null, r.name)));
    }), (heldengruppen || []).filter(hg => (hg.spur || []).length > 1).map(hg => {
      const ps = hg.spur.map(schirm);
      return /*#__PURE__*/React.createElement("g", {
        key: 'spur-' + hg.id,
        className: 'pl-spur' + (hg.id === gruppeWahl ? ' aktiv' : '')
      }, /*#__PURE__*/React.createElement("polyline", {
        points: ps.map(q => q.x + ',' + q.y).join(' ')
      }), ps.map((q, i) => i > 0 && i < ps.length - 1 && hg.spur[i].art !== 'reise' ? /*#__PURE__*/React.createElement("circle", {
        key: i,
        cx: q.x,
        cy: q.y,
        r: 3
      }, /*#__PURE__*/React.createElement("title", null, zeitText(hg.spur[i].zeit))) : null));
    }), linie && linie.punkte.length > 0 && /*#__PURE__*/React.createElement("g", {
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("polyline", {
      points: linie.punkte.map(p => {
        const s = schirm(p);
        return s.x + ',' + s.y;
      }).join(' '),
      className: 'pl-linie ' + (linie.art || '')
    }), linie.punkte.map((p, i) => {
      const s = schirm(p);
      return /*#__PURE__*/React.createElement("circle", {
        key: i,
        cx: s.x,
        cy: s.y,
        r: 4.5,
        className: 'pl-linie-punkt ' + (linie.art || '')
      });
    }))), (regionen || []).filter(r => (r.punkte || []).length >= 3).map(r => {
      const s = schirm(polygonMitte(r.punkte));
      if (s.x < -80 || s.y < -40 || s.x > g.breite + 80 || s.y > g.hoehe + 40) return null;
      return /*#__PURE__*/React.createElement("button", {
        key: r.id,
        className: 'pl-region-name' + (r.id === regionWahl ? ' aktiv' : '') + (dm && !r.sichtbar ? ' verborgen' : ''),
        style: {
          left: s.x,
          top: s.y,
          borderColor: r.farbe || REGION_FARBEN[0]
        },
        onClick: () => onRegionWahl && onRegionWahl(r.id)
      }, "\u2B21 ", r.name);
    }), (gruppen || []).filter(gr => gr.punkt).map(gr => {
      const s = schirm(gr.punkt);
      return /*#__PURE__*/React.createElement("button", {
        key: gr.id,
        className: 'pl-gruppe' + (gr.id === reiseWahl ? ' aktiv' : '') + (dm && !gr.sichtbar ? ' verborgen' : ''),
        style: {
          left: s.x,
          top: s.y
        },
        title: gr.name,
        onClick: () => onReiseWahl && onReiseWahl(gr.id)
      }, /*#__PURE__*/React.createElement("span", {
        "aria-hidden": "true"
      }, "\uD83E\uDDED"), /*#__PURE__*/React.createElement("span", {
        className: "pl-ort-name"
      }, gr.name));
    }), orte.map(o => {
      const gezogen = zieh && zieh.id === o.id ? zieh : null;
      const s = schirm(gezogen ? gezogen : o);
      if (s.x < -60 || s.y < -60 || s.x > g.breite + 60 || s.y > g.hoehe + 60) return null;
      return /*#__PURE__*/React.createElement("button", {
        key: o.id,
        className: 'pl-ort' + (o.id === ortWahl ? ' aktiv' : '') + (dm && !o.sichtbar ? ' verborgen' : '') + (gezogen ? ' gezogen' : ''),
        style: {
          left: s.x,
          top: s.y
        },
        title: o.name,
        onPointerDown: e => ortRunter(e, o),
        onPointerMove: ortBewegen,
        onPointerUp: e => ortHoch(e, o),
        onPointerCancel: () => setZieh(null),
        onKeyDown: e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOrtWahl && onOrtWahl(o.id);
          }
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "pl-ort-symbol",
        "aria-hidden": "true"
      }, o.symbol || '📍'), /*#__PURE__*/React.createElement("span", {
        className: "pl-ort-name"
      }, o.name), questOrte && questOrte.has(o.id) && /*#__PURE__*/React.createElement("span", {
        className: "pl-quest-abzeichen",
        title: "Hier gibt es eine Quest"
      }, "\u2757"));
    }), (heldengruppen || []).filter(hg => (hg.spur || []).length).map(hg => {
      const jetzt = hg.spur[hg.spur.length - 1];
      const gezogen = zieh && zieh.id === hg.id ? zieh : null;
      const s = schirm(gezogen ? gezogen : jetzt);
      if (s.x < -60 || s.y < -60 || s.x > g.breite + 60 || s.y > g.hoehe + 60) return null;
      return /*#__PURE__*/React.createElement("button", {
        key: hg.id,
        className: 'pl-heldengruppe' + (hg.id === gruppeWahl ? ' aktiv' : '') + (dm && !hg.sichtbar ? ' verborgen' : ''),
        style: {
          left: s.x,
          top: s.y
        },
        title: hg.name + ' — ' + zeitText(jetzt.zeit),
        onPointerDown: e => ortRunter(e, {
          ...hg,
          x: jetzt.x,
          y: jetzt.y
        }),
        onPointerMove: ortBewegen,
        onPointerUp: e => ortHoch(e, hg),
        onPointerCancel: () => setZieh(null),
        onKeyDown: e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onGruppeWahl && onGruppeWahl(hg.id);
          }
        }
      }, /*#__PURE__*/React.createElement("span", {
        "aria-hidden": "true"
      }, hg.symbol || '🛡'), /*#__PURE__*/React.createElement("span", {
        className: "pl-ort-name"
      }, hg.name), /*#__PURE__*/React.createElement("span", {
        className: "pl-gruppe-zahl"
      }, (hg.helden || []).length));
    }), (figuren || []).filter(f => f.punkt).map(f => {
      const gezogen = zieh && zieh.id === f.id ? zieh : null;
      const s = schirm(gezogen ? gezogen : f.punkt);
      if (s.x < -60 || s.y < -60 || s.x > g.breite + 60 || s.y > g.hoehe + 60) return null;
      return /*#__PURE__*/React.createElement("button", {
        key: f.id,
        className: 'pl-figur' + (f.id === figurWahl ? ' aktiv' : '') + (dm && !f.sichtbar ? ' verborgen' : '') + (f.punkt.unterwegs ? ' unterwegs' : ''),
        style: {
          left: s.x,
          top: s.y
        },
        title: f.name,
        onPointerDown: e => ortRunter(e, {
          ...f,
          x: f.punkt.x,
          y: f.punkt.y
        }),
        onPointerMove: ortBewegen,
        onPointerUp: e => ortHoch(e, f),
        onPointerCancel: () => setZieh(null),
        onKeyDown: e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFigurWahl && onFigurWahl(f.id);
          }
        }
      }, /*#__PURE__*/React.createElement("span", {
        "aria-hidden": "true"
      }, f.symbol || '🧍'), /*#__PURE__*/React.createElement("span", {
        className: "pl-ort-name"
      }, f.name));
    }), leiste && /*#__PURE__*/React.createElement("div", {
      className: "pl-massstab-leiste",
      "aria-label": 'Maßstab: ' + leiste.text
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: leiste.px
      }
    }), /*#__PURE__*/React.createElement("span", null, leiste.text)), /*#__PURE__*/React.createElement("div", {
      className: "pl-zoom"
    }, /*#__PURE__*/React.createElement("button", {
      className: "pl-symbol",
      "aria-label": "N\xE4her heran",
      title: "N\xE4her heran",
      onClick: () => knopfZoom(0.5)
    }, "\uFF0B"), /*#__PURE__*/React.createElement("button", {
      className: "pl-symbol",
      "aria-label": "Weiter weg",
      title: "Weiter weg",
      onClick: () => knopfZoom(-0.5)
    }, "\u2212"), /*#__PURE__*/React.createElement("button", {
      className: "pl-symbol",
      "aria-label": "Ganze Karte",
      title: "Ganze Karte",
      onClick: () => setA(ansichtEinpassen(plan, g))
    }, "\u2922")));
  }
  return /*#__PURE__*/React.createElement("div", {
    ref: box,
    className: 'pl-leinwand-karte werkzeug-' + (werkzeug || 'ansehen') + (bild ? '' : ' leer'),
    "data-stufe": a && plan ? stufeFuer(a.zoom, plan) : '',
    onPointerDown: runter,
    onPointerMove: bewegen,
    onPointerUp: hoch,
    onPointerCancel: hoch
  }, !bild && /*#__PURE__*/React.createElement("div", {
    className: "pl-leinwand-raster",
    "aria-hidden": "true"
  }), inhalt);
};

// ==== planer/src/3-ort.jsx ====
// ── Bilder, Orte, Maßstab ────────────────────────────────────────

// ── Bilder im Browser ────────────────────────────────────────────
// Kacheln werden hier geschnitten, nicht auf dem Server: ein Webhosting
// bricht bei einem Bild von 20 000 Pixeln an seiner Speichergrenze ab,
// der Browser auf dem Rechner der Spielleitung nicht.
const neueLeinwand = (b, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(b, h);
  const c = document.createElement('canvas');
  c.width = b;
  c.height = h;
  return c;
};
const leinwandBytes = async (c, typ, qualitaet) => {
  const blob = c.convertToBlob ? await c.convertToBlob({
    type: typ,
    quality: qualitaet
  }) : await new Promise((ok, nein) => c.toBlob(b => b ? ok(b) : nein(new Error('Das Bild ließ sich nicht umwandeln.')), typ, qualitaet));
  return {
    typ: blob.type,
    bytes: new Uint8Array(await blob.arrayBuffer())
  };
};
// WebP, wo der Browser es schreiben kann; sonst JPEG.
let bildFormatGemerkt = null;
const bildFormat = async () => {
  if (bildFormatGemerkt) return bildFormatGemerkt;
  // Eine Leinwand ohne Zeichenflaeche laesst sich nicht umwandeln — die
  // Probe braucht also einen Pinselstrich.
  const c = neueLeinwand(2, 2);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 2, 2);
  const probe = await leinwandBytes(c, 'image/webp', 0.8).catch(() => ({
    typ: ''
  }));
  bildFormatGemerkt = probe.typ === 'image/webp' ? {
    typ: 'image/webp',
    endung: 'webp'
  } : {
    typ: 'image/jpeg',
    endung: 'jpg'
  };
  return bildFormatGemerkt;
};

// Gelingt das Bild nicht am Stueck, dann verkleinert: lieber eine Karte
// mit halber Aufloesung als gar keine.
const bildOeffnen = async (datei, masse) => {
  try {
    return {
      bitmap: await createImageBitmap(datei),
      faktor: 1
    };
  } catch (e) {/* weiter unten kleiner */}
  if (masse) {
    for (const f of [0.5, 0.25]) {
      try {
        const bitmap = await createImageBitmap(datei, {
          resizeWidth: Math.round(masse.breite * f),
          resizeHeight: Math.round(masse.hoehe * f),
          resizeQuality: 'high'
        });
        return {
          bitmap,
          faktor: f
        };
      } catch (e) {/* noch kleiner */}
    }
  }
  throw new Error('Der Browser kann dieses Bild nicht öffnen' + (masse ? ' (' + masse.breite + ' × ' + masse.hoehe + ' Pixel)' : '') + '. Bitte in PNG, JPEG oder WebP speichern, oder in zwei Teilkarten zerlegen.');
};
const kachelZeichner = (quelle, plan, ordner, format) => {
  let stufe = null;
  const zeichne = async (z, x, y) => {
    const t = kachelZiel(plan, z, x, y);
    const c = neueLeinwand(t.breite, t.hoehe);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(stufe, t.lx, t.ly, t.breite, t.hoehe, 0, 0, t.breite, t.hoehe);
    const {
      bytes
    } = await leinwandBytes(c, format.typ, 0.86);
    return {
      pfad: kachelPfad(ordner, z, x, y, format.endung),
      bytes
    };
  };
  zeichne.stufe = async z => {
    if (stufe && stufe !== quelle && stufe.close) stufe.close();
    const s = plan.stufen[z];
    stufe = z === plan.maxZ ? quelle : await createImageBitmap(quelle, {
      resizeWidth: s.breite,
      resizeHeight: s.hoehe,
      resizeQuality: 'high'
    });
  };
  zeichne.ende = () => {
    if (stufe && stufe !== quelle && stufe.close) stufe.close();
  };
  return zeichne;
};
const bildVerkleinert = async (quelle, hoechstens, format) => {
  const f = Math.min(1, hoechstens / Math.max(quelle.width, quelle.height));
  const b = Math.max(1, Math.round(quelle.width * f)),
    h = Math.max(1, Math.round(quelle.height * f));
  const klein = f < 1 ? await createImageBitmap(quelle, {
    resizeWidth: b,
    resizeHeight: h,
    resizeQuality: 'high'
  }) : quelle;
  const c = neueLeinwand(b, h);
  c.getContext('2d').drawImage(klein, 0, 0);
  if (klein !== quelle && klein.close) klein.close();
  return (await leinwandBytes(c, format.typ, 0.86)).bytes;
};
const dateiKopf = async datei => new Uint8Array(await datei.slice(0, 1024 * 1024).arrayBuffer());

// ── Maßstab festlegen ────────────────────────────────────────────
const MassstabDialog = ({
  punkte,
  alt,
  onSpeichern,
  onZu
}) => {
  const [laenge, setLaenge] = useState(alt ? String(alt.laenge).replace('.', ',') : '');
  const [einh, setEinh] = useState(alt ? alt.einheit : 'km');
  const zahl = parseFloat(laenge.replace(',', '.'));
  const m = massstabAus(punkte[0], punkte[1], zahl, einh);
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-schleier",
    onClick: onZu
  }, /*#__PURE__*/React.createElement("form", {
    className: "pl-dialog",
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    onSubmit: e => {
      e.preventDefault();
      if (m) onSpeichern(m);
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Ma\xDFstab festlegen"), /*#__PURE__*/React.createElement("p", null, "Wie weit liegen die beiden Punkte auf der Karte auseinander?"), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    className: "pl-feld pl-zahl",
    inputMode: "decimal",
    value: laenge,
    onChange: e => setLaenge(e.target.value),
    "aria-label": "Entfernung"
  }), /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: einh,
    onChange: e => setEinh(e.target.value),
    "aria-label": "Einheit"
  }, EINHEITEN.map(x => /*#__PURE__*/React.createElement("option", {
    key: x.k,
    value: x.k
  }, x.l)))), /*#__PURE__*/React.createElement("p", {
    className: "pl-hinweis"
  }, Math.round(abstandPx(punkte[0], punkte[1])), " Pixel im Bild", m ? ' · ' + zahlText(pxJeEinheit(m)) + ' Pixel je ' + einheit(einh).kurz : ''), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf",
    onClick: onZu
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt",
    disabled: !m
  }, "\xDCbernehmen"))));
};

// ── Die Tafel eines Orts ─────────────────────────────────────────
// Die Spielleitung bearbeitet, alle anderen lesen. Was unter dm steht,
// kommt bei Spielern gar nicht erst an.
const OrtTafel = ({
  ort,
  dm,
  karte,
  karten,
  arbeitet,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onUnterkarte,
  onBilderHoch,
  onBildWeg,
  wissen,
  quests,
  onGeschichte,
  onMeldung
}) => {
  const [entwurf, setEntwurf] = useState(ort);
  const [gross, setGross] = useState(null);
  const bildEingabe = useRef(null);
  // Kommt eine neue Fassung vom Server — ein Bild ist dazugekommen, der
  // Ort wurde verschoben —, gilt sie fuer alles, was hier nicht gerade
  // bearbeitet wird. Was hier geaendert ist, bleibt.
  const [basis, setBasis] = useState(ort);
  const gleich = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  useEffect(() => {
    if (gleich(ort, basis)) return;
    setEntwurf(e => {
      const aus = {
        ...ort
      };
      new Set([...Object.keys(e), ...Object.keys(basis)]).forEach(k => {
        if (!gleich(e[k], basis[k])) aus[k] = e[k];
      });
      return aus;
    });
    setBasis(ort);
  }, [JSON.stringify(ort)]);
  const geaendert = !gleich(entwurf, ort);
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const setzeDm = (feld, wert) => setEntwurf(e => ({
    ...e,
    dm: {
      ...(e.dm || {}),
      [feld]: wert
    }
  }));
  const unter = karten.find(k => k.id === (dm ? entwurf.unterkarte : ort.unterkarte));
  const bilder = (dm ? entwurf.bilder : ort.bilder) || [];
  const bildLeiste = bilder.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pl-ort-bilder"
  }, bilder.map(p => /*#__PURE__*/React.createElement("figure", {
    key: p
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-ort-bild",
    onClick: () => setGross(p),
    "aria-label": "Bild gro\xDF ansehen"
  }, /*#__PURE__*/React.createElement("img", {
    src: planerDateiUrl(karte.ablage, p),
    alt: "",
    loading: "lazy"
  })), dm && /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol pl-symbol-weg",
    "aria-label": "Bild entfernen",
    title: "Bild entfernen",
    onClick: () => onBildWeg(entwurf, p),
    disabled: arbeitet
  }, "\u2715"))));
  const hexZeile = karte.hex && karte.hex.an && karte.massstab && typeof ort.x === 'number' ? /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "\u2B21 Feld ", hexAdresse(hexAchsial(ort, hexRadiusPx(karte.hex.groesse || 10, karte.massstab)))) : null;
  const geschichte = (wissen || []).length || (quests || []).length ? /*#__PURE__*/React.createElement("div", {
    className: "pl-ort-geschichte"
  }, (quests || []).map(q => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: q.id,
    className: "pl-knopf pl-klein",
    onClick: () => onGeschichte(q)
  }, questStatus(q.status).zeichen, " ", q.titel)), (wissen || []).map(w => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: w.id,
    className: "pl-knopf pl-klein pl-wissen-knopf",
    onClick: () => onGeschichte(w)
  }, (HINWEIS_ARTEN.find(h => h.k === w.artDesWissens) || HINWEIS_ARTEN[0]).zeichen, " ", String(w.text || '').slice(0, 60)))) : null;
  const lupe = gross && /*#__PURE__*/React.createElement("div", {
    className: "pl-schleier pl-lupe",
    onClick: () => setGross(null),
    role: "dialog",
    "aria-label": "Bild"
  }, /*#__PURE__*/React.createElement("img", {
    src: planerDateiUrl(karte.ablage, gross),
    alt: ""
  }));
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": 'Ort: ' + ort.name
    }, /*#__PURE__*/React.createElement("header", {
      className: "pl-tafel-kopf"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pl-tafel-symbol",
      "aria-hidden": "true"
    }, ort.symbol || '📍'), /*#__PURE__*/React.createElement("h2", null, ort.name), /*#__PURE__*/React.createElement("button", {
      className: "pl-symbol",
      "aria-label": "Schlie\xDFen",
      onClick: onSchliessen
    }, "\u2715")), ort.text ? /*#__PURE__*/React.createElement("p", {
      className: "pl-ort-text"
    }, ort.text) : /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "\xDCber diesen Ort ist noch nichts bekannt."), hexZeile, geschichte, bildLeiste, unter && /*#__PURE__*/React.createElement("button", {
      className: "pl-knopf pl-haupt",
      onClick: () => onUnterkarte(unter.id)
    }, "\uD83D\uDDFA ", unter.name, " \xF6ffnen"), lupe);
  }
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Ort bearbeiten: ' + ort.name
  }, /*#__PURE__*/React.createElement("header", {
    className: "pl-tafel-kopf"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-tafel-symbol",
    "aria-hidden": "true"
  }, entwurf.symbol || '📍'), /*#__PURE__*/React.createElement("h2", null, entwurf.name || 'Ohne Namen'), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    "aria-label": "Schlie\xDFen",
    onClick: onSchliessen
  }, "\u2715")), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: e => setze('name', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-symbole",
    role: "radiogroup",
    "aria-label": "Zeichen"
  }, ORT_SYMBOLE.map(s => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: s,
    role: "radio",
    "aria-checked": (entwurf.symbol || '📍') === s,
    className: 'pl-symbolwahl' + ((entwurf.symbol || '📍') === s ? ' an' : ''),
    onClick: () => setze('symbol', s)
  }, s))), /*#__PURE__*/React.createElement("label", null, "Was die Spieler lesen", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 4,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: e => setze('text', e.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 3,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: e => setzeDm('notiz', e.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "F\xFChrt zu Karte", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.unterkarte || '',
    onChange: e => setze('unterkarte', e.target.value || undefined)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keine \u2014"), karten.filter(k => k.id !== entwurf.karteId).map(k => /*#__PURE__*/React.createElement("option", {
    key: k.id,
    value: k.id
  }, k.name)))), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: e => setze('sichtbar', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "F\xFCr Spieler sichtbar")), !entwurf.sichtbar && /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.mitNebel,
    onChange: e => setze('mitNebel', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "Sichtbar, sobald der Nebel \xFCber ihm aufgeht")), hexZeile, geschichte, bildLeiste, /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: arbeitet,
    onClick: () => bildEingabe.current && bildEingabe.current.click()
  }, "\uFF0B Bild"), /*#__PURE__*/React.createElement("input", {
    ref: bildEingabe,
    type: "file",
    accept: "image/*",
    multiple: true,
    hidden: true,
    onChange: e => {
      const f = [...(e.target.files || [])];
      e.target.value = '';
      if (f.length) onBilderHoch(entwurf, f);
    }
  }), unter && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => onUnterkarte(unter.id)
  }, "\uD83D\uDDFA ", unter.name)), /*#__PURE__*/React.createElement(DateiListe, {
    dateien: entwurf.dm && entwurf.dm.dateien || [],
    onMeldung: onMeldung,
    onDateien: liste => setzeDm('dateien', liste)
  }), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(ort)
  }, "L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !geaendert,
    onClick: () => setEntwurf(ort)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein",
    disabled: !geaendert || !String(entwurf.name || '').trim()
  }, "Speichern"))), lupe);
};

// ==== planer/src/3b-reise.jsx ====
// ── Routen und Reisen: die Tafeln ────────────────────────────────
// Die Rechnung steht in 1c-reise.jsx. Hier: die Tafel einer Route
// (Gelaende je Abschnitt) und die einer Reise (Einstellungen, Plan Tag
// fuer Tag, Wetter, der naechste Reisetag, Uebergaben ans Heldenbuch).

// Ein Auftrag an das Heldenbuch: in den gemeinsamen Speicher legen und
// kurz auf die Quittung warten. Kommt keine, ist kein Heldenbuch im
// DM-Modus offen — dann wartet der Auftrag dort eine halbe Stunde.
const anHeldenbuch = auftrag => new Promise(ok => {
  const id = planNeueId('a');
  try {
    localStorage.setItem(PLANER_AUFTRAG, JSON.stringify({
      ...auftrag,
      id,
      zeit: Date.now()
    }));
  } catch (e) {
    ok(false);
    return;
  }
  const bis = Date.now() + 2500;
  const t = setInterval(() => {
    let q = null;
    try {
      q = JSON.parse(localStorage.getItem(PLANER_QUITTUNG) || 'null');
    } catch (e) {
      q = null;
    }
    if (q && q.id === id) {
      clearInterval(t);
      ok(true);
    } else if (Date.now() > bis) {
      clearInterval(t);
      ok(false);
    }
  }, 120);
});

// Wie OrtTafel: der Entwurf nimmt neue Fassungen vom Server, wo hier
// nichts geaendert ist.
const useEntwurf = wert => {
  const [entwurf, setEntwurf] = useState(wert);
  const [basis, setBasis] = useState(wert);
  const gleich = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  useEffect(() => {
    if (gleich(wert, basis)) return;
    setEntwurf(e => {
      const aus = {
        ...wert
      };
      new Set([...Object.keys(e), ...Object.keys(basis)]).forEach(k => {
        if (!gleich(e[k], basis[k])) aus[k] = e[k];
      });
      return aus;
    });
    setBasis(wert);
  }, [JSON.stringify(wert)]);
  return [entwurf, setEntwurf, !gleich(entwurf, wert)];
};
const TafelKopf = ({
  symbol,
  titel,
  onSchliessen
}) => /*#__PURE__*/React.createElement("header", {
  className: "pl-tafel-kopf"
}, /*#__PURE__*/React.createElement("span", {
  className: "pl-tafel-symbol",
  "aria-hidden": "true"
}, symbol), /*#__PURE__*/React.createElement("h2", null, titel), /*#__PURE__*/React.createElement("button", {
  className: "pl-symbol",
  "aria-label": "Schlie\xDFen",
  onClick: onSchliessen
}, "\u2715"));

// ── Route ────────────────────────────────────────────────────────
const RouteTafel = ({
  route,
  dm,
  karte,
  reisen,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onReiseNeu,
  onReiseWahl
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(route);
  const m = karte.massstab;
  const ab = routeAbschnitte(entwurf, m);
  const laenge = ab.reduce((s, a) => s + a.laenge, 0);
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const setzeGelaende = (i, g) => setEntwurf(e => {
    const liste = routeAbschnitte(e, m).map(a => a.gelaende);
    liste[i] = g;
    return {
      ...e,
      gelaende: liste
    };
  });
  const eigeneReisen = reisen.filter(r => r.routeId === route.id);
  const laengeZeile = m ? laengeText(laenge, m.einheit) : 'ohne Maßstab';
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": 'Route: ' + route.name
    }, /*#__PURE__*/React.createElement(TafelKopf, {
      symbol: "\uD83D\uDEE4",
      titel: route.name,
      onSchliessen: onSchliessen
    }), /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, laengeZeile, " \xB7 ", ab.length, " Abschnitte"), route.text ? /*#__PURE__*/React.createElement("p", {
      className: "pl-ort-text"
    }, route.text) : null, eigeneReisen.map(r => /*#__PURE__*/React.createElement("button", {
      key: r.id,
      className: "pl-knopf pl-klein",
      onClick: () => onReiseWahl(r.id)
    }, "\uD83E\uDDED ", r.name)));
  }
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Route bearbeiten: ' + route.name
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: "\uD83D\uDEE4",
    titel: entwurf.name || 'Ohne Namen',
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: e => setze('name', e.target.value)
  })), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise"
  }, laengeZeile, " \xB7 ", ab.length, " Abschnitte"), /*#__PURE__*/React.createElement("label", null, "Alle Abschnitte", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld pl-alle-gelaende",
    value: "",
    onChange: e => {
      const g = e.target.value;
      if (g) setze('gelaende', ab.map(() => g));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Gel\xE4nde f\xFCr alle setzen \u2014"), GELAENDE.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.k,
    value: g.k
  }, g.l)))), /*#__PURE__*/React.createElement("ol", {
    className: "pl-abschnitte"
  }, ab.map(a => /*#__PURE__*/React.createElement("li", {
    key: a.i
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-farbpunkt",
    style: {
      background: gelaende(a.gelaende).farbe
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pl-abschnitt-laenge"
  }, m ? laengeText(a.laenge, m.einheit) : Math.round(a.px) + ' px'), /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: a.gelaende,
    "aria-label": 'Gelände Abschnitt ' + (a.i + 1),
    onChange: e => setzeGelaende(a.i, e.target.value)
  }, GELAENDE.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.k,
    value: g.k
  }, g.l)))))), /*#__PURE__*/React.createElement("label", null, "Was die Spieler lesen", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 2,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: e => setze('text', e.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: e => setEntwurf(v => ({
      ...v,
      dm: {
        ...(v.dm || {}),
        notiz: e.target.value
      }
    }))
  })), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: e => setze('sichtbar', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "F\xFCr Spieler sichtbar")), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein pl-haupt",
    disabled: geaendert || !m,
    onClick: () => onReiseNeu(route),
    title: !m ? 'Die Karte braucht zuerst einen Maßstab' : geaendert ? 'Erst speichern' : ''
  }, "\uD83E\uDDED Reise planen"), eigeneReisen.map(r => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: r.id,
    className: "pl-knopf pl-klein",
    onClick: () => onReiseWahl(r.id)
  }, "\uD83E\uDDED ", r.name))), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(route)
  }, "L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !geaendert,
    onClick: () => setEntwurf(route)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein",
    disabled: !geaendert
  }, "Speichern"))));
};

// ── Reise ────────────────────────────────────────────────────────
const neueReise = route => ({
  id: planNeueId('j'),
  karteId: route.karteId,
  art: 'reise',
  name: 'Reise: ' + route.name,
  routeId: route.id,
  richtung: 'hin',
  optionen: {
    tempo: 'normal',
    fortbewegung: 'fuss'
  },
  personen: 4,
  klima: 'gemaessigt',
  jahreszeit: 'sommer',
  samen: Math.floor(Math.random() * 2147483647) + 1,
  wetterVorgaben: {},
  pos: 0,
  tagebuch: [],
  sichtbar: false,
  dm: {
    notiz: ''
  }
});

// Das Wetter der Tage ab dem Start: gewuerfelt aus dem Samen, und wo
// die Spielleitung etwas festgelegt hat, das.
const reiseWetter = (reise, anzahl) => {
  const vorgaben = [];
  Object.entries(reise.wetterVorgaben || {}).forEach(([i, w]) => {
    vorgaben[+i] = w;
  });
  return wetterFuerTage(anzahl, reise.klima, reise.jahreszeit, reise.samen || 1, vorgaben);
};
const reiseStand = (reise, route, massstab) => {
  const r = routeInRichtung(route, reise.richtung);
  const tag = (reise.tagebuch || []).length;
  const wetter = reiseWetter(reise, tag + REISE_HOECHSTENS_TAGE);
  const plan = reisePlan({
    route: r,
    massstab,
    optionen: reise.optionen,
    start: reise.pos,
    wetter: wetter.slice(tag)
  });
  const punkt = massstab ? punktAufRoute(r, massstab, reise.pos || 0) : (r.punkte || [])[0];
  return {
    r,
    tag,
    plan,
    punkt,
    heute: wetter[tag],
    gesamt: plan.gesamt
  };
};
const WetterWahl = ({
  wetter,
  onWetter
}) => {
  const feld = (name, liste) => /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: wetter[name],
    "aria-label": name,
    onChange: e => onWetter({
      ...wetter,
      [name]: e.target.value
    })
  }, liste.map(k => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, WETTER_WORTE[k])));
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-wetter-wahl"
  }, feld('niederschlag', WETTER_NIEDERSCHLAG), feld('temperatur', WETTER_TEMPERATUR), feld('wind', WETTER_WIND));
};
const ReiseTafel = ({
  reise,
  route,
  dm,
  karte,
  advId,
  chronikZeit,
  regionen,
  begegnungen,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onMeldung,
  onNebelAufdecken,
  heldengruppen,
  onGruppeReist,
  figuren,
  onFigurReist
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(reise);
  const [uebergabe, setUebergabe] = useState('');
  const m = karte.massstab;
  const st = reiseStand(entwurf, route, m);
  const einh = m ? m.einheit : 'km';
  const heute = st.plan.tage[0];
  const angekommen = m && st.gesamt > 0 && (entwurf.pos || 0) >= st.gesamt - 1e-9;
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const setzeOpt = (feld, wert) => setEntwurf(e => ({
    ...e,
    optionen: {
      ...(e.optionen || {}),
      [feld]: wert
    }
  }));
  const f = fortbewegung(entwurf.optionen && entwurf.optionen.fortbewegung);
  const verpf = verpflegung(st.plan.tage.length, entwurf.personen);
  const ankunft = chronikZeit != null && st.plan.angekommen ? 'Tag ' + (Math.floor((chronikZeit + st.plan.tage.length * 24) / 24) + 1) : '';
  // Die Wachen des naechsten Tags, mit einem Samen je Tag: dieselbe Reise
  // wuerfelt dasselbe, bis jemand ausdruecklich neu wuerfelt.
  const nochmal = (entwurf.nochmal || {})[st.tag] || 0;
  const pruefungen = heute && m ? tagesPruefungen({
    tag: heute,
    route: st.r,
    massstab: m,
    regionen,
    startStunde: entwurf.startStunde ?? 8,
    zufall: samenZufall(wuerfelSamen(entwurf.samen, st.tag + 1, nochmal))
  }) : [];
  const [loggt, setLoggt] = useState(false);
  const [verirrt, setVerirrt] = useState(false);
  const navSg = heute ? navigationSg(heute) : 0;
  const insLog = async e => {
    setLoggt(true);
    try {
      const text = reisetagText(e, entwurf.name, einh, begegnungen);
      await planerApi('save_log', {
        entry: {
          char_id: null,
          char_name: '',
          tab: 'Reise',
          action: text.slice(0, 255),
          details: {
            planer: true,
            reise: entwurf.name,
            tag: e.nr,
            text
          },
          adv_id: advId
        }
      });
      const liste = (entwurf.tagebuch || []).map(x => x.nr === e.nr ? {
        ...x,
        geloggt: true
      } : x);
      onSpeichern({
        ...entwurf,
        tagebuch: liste
      });
      onMeldung({
        art: 'gut',
        text: '📖 Reisetag ' + e.nr + ' steht im Abenteuerlog.'
      });
    } catch (err) {
      onMeldung({
        art: 'fehler',
        text: 'Ins Abenteuerlog ging es nicht: ' + err.message
      });
    } finally {
      setLoggt(false);
    }
  };
  const kopieren = async () => {
    const text = entwurf.name + '\n' + tagebuchText(entwurf, einh, begegnungen);
    try {
      await navigator.clipboard.writeText(text);
      onMeldung({
        art: 'gut',
        text: '📋 Das Reisetagebuch ist kopiert.'
      });
    } catch (e) {
      onMeldung({
        art: 'fehler',
        text: 'Kopieren ging nicht — der Browser hat es nicht erlaubt.'
      });
    }
  };
  const tagAbschliessen = () => {
    if (!heute) return;
    // Verirrt: die Stunden vergehen, die Strecke nicht.
    const eintrag = {
      nr: st.tag + 1,
      strecke: verirrt ? 0 : heute.strecke,
      stunden: heute.stunden,
      wetter: st.heute,
      gewaltmarsch: heute.gewaltmarsch,
      teile: verirrt ? [] : heute.teile.map(t => ({
        gelaende: t.gelaende,
        strecke: t.strecke
      })),
      pruefungen: pruefungen.map(pruefungKurz),
      verirrt: verirrt || undefined
    };
    let vorrat = entwurf.vorrat;
    if (vorrat && (vorrat.rationen > 0 || vorrat.wasserLiter > 0 || entwurf.vorratFuehren)) {
      const v = vorratNachTag(vorrat, entwurf.personen);
      vorrat = v.vorrat;
      if (v.fehlt.rationen || v.fehlt.wasserLiter) {
        eintrag.fehlt = v.fehlt;
        onMeldung({
          art: 'fehler',
          text: '🍞 Am Tag ' + eintrag.nr + ' fehlen ' + [v.fehlt.rationen ? v.fehlt.rationen + ' Rationen' : '', v.fehlt.wasserLiter ? v.fehlt.wasserLiter + ' l Wasser' : ''].filter(Boolean).join(' und ') + '.'
        });
      }
    }
    setVerirrt(false);
    onSpeichern({
      ...entwurf,
      vorrat,
      pos: verirrt ? entwurf.pos || 0 : heute.bis,
      tagebuch: [...(entwurf.tagebuch || []), eintrag]
    });
    if (verirrt) return;
    // Reist eine Figur mit — ein Bote, eine Karawane, ein NSC —, bekommt
    // sie fuer diesen Tag einen Wegpunkt am Ende der Tagesstrecke. Der
    // Nebel bleibt davon unberuehrt: sie gehoert nicht zur Gruppe.
    const fg = entwurf.figurId && (figuren || []).find(x => x.id === entwurf.figurId);
    if (fg && onFigurReist) {
      const ende = punktAufRoute(st.r, m, heute.bis);
      const letzte = wegpunkteSortiert(fg)[wegpunkteSortiert(fg).length - 1];
      const von = Math.max(chronikZeit || 0, letzte ? letzte.zeit : 0);
      if (ende) onFigurReist(fg, ende, Math.round(von + heute.stunden));
    }
    // Reist eine Heldengruppe mit, zieht sie die Route entlang und lichtet
    // den Nebel mit ihrer eigenen Sichtweite.
    const hg = entwurf.gruppeId && (heldengruppen || []).find(x => x.id === entwurf.gruppeId);
    if (hg && onGruppeReist) {
      onGruppeReist(hg, routenPunkteZwischen(st.r, m, heute.von, heute.bis), heute.stunden, entwurf.startStunde ?? 8);
      return;
    }
    // Wo die Gruppe hinkam, weicht der Nebel — so weit, wie sie sieht.
    if (nebelVon(karte).an && (+entwurf.sichtweite || 0) > 0 && onNebelAufdecken) {
      onNebelAufdecken(kreiseEntlang(st.r, m, heute.von, heute.bis, +entwurf.sichtweite));
    }
  };
  const tagZuruecknehmen = () => {
    const liste = [...(entwurf.tagebuch || [])];
    const letzter = liste.pop();
    if (!letzter) return;
    onSpeichern({
      ...entwurf,
      pos: Math.max(0, (entwurf.pos || 0) - letzter.strecke),
      tagebuch: liste
    });
  };
  const uebergeben = async (auftrag, was) => {
    setUebergabe(was + ' …');
    const genommen = await anHeldenbuch(auftrag);
    setUebergabe('');
    onMeldung(genommen ? {
      art: 'gut',
      text: was + ': Das Heldenbuch hat den Dialog geöffnet. Bestätige ihn dort.'
    } : {
      art: 'gut',
      text: was + ': Der Auftrag wartet eine halbe Stunde. Öffne das Heldenbuch im DM-Modus, dann geht der Dialog dort auf.'
    });
  };
  const letzter = (entwurf.tagebuch || [])[(entwurf.tagebuch || []).length - 1];
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": 'Reise: ' + reise.name
    }, /*#__PURE__*/React.createElement(TafelKopf, {
      symbol: "\uD83E\uDDED",
      titel: reise.name,
      onSchliessen: onSchliessen
    }), m && /*#__PURE__*/React.createElement("p", null, st.tag ? 'Tag ' + st.tag + ' · ' : '', laengeText(reise.pos || 0, einh), " von ", laengeText(st.gesamt, einh), angekommen ? ' · angekommen' : ''), letzter && letzter.wetter && /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "Zuletzt: ", WETTER_ZEICHEN[letzter.wetter.niederschlag], " ", wetterText(letzter.wetter)));
  }
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel pl-reise",
    "aria-label": 'Reise: ' + reise.name
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: "\uD83E\uDDED",
    titel: entwurf.name || 'Reise',
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: e => setze('name', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-raster2"
  }, /*#__PURE__*/React.createElement("label", null, "Richtung", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.richtung,
    onChange: e => setze('richtung', e.target.value),
    disabled: (entwurf.tagebuch || []).length > 0
  }, /*#__PURE__*/React.createElement("option", {
    value: "hin"
  }, "Vom Anfang zum Ende"), /*#__PURE__*/React.createElement("option", {
    value: "zurueck"
  }, "Vom Ende zum Anfang"))), /*#__PURE__*/React.createElement("label", null, "Fortbewegung", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: f.k,
    onChange: e => setzeOpt('fortbewegung', e.target.value)
  }, FORTBEWEGUNG.map(x => /*#__PURE__*/React.createElement("option", {
    key: x.k,
    value: x.k
  }, x.l)))), f.art !== 'wasser' && /*#__PURE__*/React.createElement("label", null, "Tempo", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: tempo(entwurf.optionen && entwurf.optionen.tempo).k,
    onChange: e => setzeOpt('tempo', e.target.value)
  }, TEMPO.map(x => /*#__PURE__*/React.createElement("option", {
    key: x.k,
    value: x.k
  }, x.l)))), /*#__PURE__*/React.createElement("label", null, "Stunden am Tag", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 1,
    max: 24,
    value: reiseStunden(entwurf.optionen),
    onChange: e => setzeOpt('stunden', Math.max(1, Math.min(24, +e.target.value || 1)))
  })), /*#__PURE__*/React.createElement("label", null, "Aufbruch um", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    max: 23,
    value: entwurf.startStunde ?? 8,
    onChange: e => setze('startStunde', Math.max(0, Math.min(23, Math.round(+e.target.value || 0))))
  })), /*#__PURE__*/React.createElement("label", null, "Heldengruppe", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.gruppeId || '',
    onChange: e => setze('gruppeId', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keine \u2014"), (heldengruppen || []).map(x => /*#__PURE__*/React.createElement("option", {
    key: x.id,
    value: x.id
  }, x.name)))), /*#__PURE__*/React.createElement("label", null, "Figur unterwegs", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.figurId || '',
    "aria-label": "Figur unterwegs",
    title: "Ein Bote, eine Karawane, ein NSC: jeder abgeschlossene Tag setzt ihr einen Wegpunkt",
    onChange: e => setze('figurId', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keine \u2014"), (figuren || []).map(x => /*#__PURE__*/React.createElement("option", {
    key: x.id,
    value: x.id
  }, (x.symbol || '🧍') + ' ' + x.name)))), /*#__PURE__*/React.createElement("label", null, "Sichtweite (", einh, ")", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    step: "any",
    value: entwurf.sichtweite ?? 0,
    title: "Wie weit der Nebel entlang des Wegs aufgeht; 0 hei\xDFt gar nicht",
    onChange: e => setze('sichtweite', Math.max(0, +e.target.value || 0))
  })), /*#__PURE__*/React.createElement("label", null, "Rationen im Gep\xE4ck", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    value: (entwurf.vorrat && entwurf.vorrat.rationen) ?? 0,
    onChange: e => setEntwurf(v => ({
      ...v,
      vorratFuehren: true,
      vorrat: {
        ...(v.vorrat || {}),
        rationen: Math.max(0, +e.target.value || 0)
      }
    }))
  })), /*#__PURE__*/React.createElement("label", null, "Wasser (l)", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    value: (entwurf.vorrat && entwurf.vorrat.wasserLiter) ?? 0,
    onChange: e => setEntwurf(v => ({
      ...v,
      vorratFuehren: true,
      vorrat: {
        ...(v.vorrat || {}),
        wasserLiter: Math.max(0, +e.target.value || 0)
      }
    }))
  })), /*#__PURE__*/React.createElement("label", null, "Personen", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    max: 999,
    value: entwurf.personen ?? 4,
    onChange: e => setze('personen', Math.max(0, +e.target.value || 0))
  })), /*#__PURE__*/React.createElement("label", null, "Klima", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.klima,
    onChange: e => setze('klima', e.target.value)
  }, KLIMA.map(x => /*#__PURE__*/React.createElement("option", {
    key: x.k,
    value: x.k
  }, x.l)))), /*#__PURE__*/React.createElement("label", null, "Jahreszeit", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.jahreszeit,
    onChange: e => setze('jahreszeit', e.target.value)
  }, JAHRESZEITEN.map(x => /*#__PURE__*/React.createElement("option", {
    key: x.k,
    value: x.k
  }, x.l))))), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: e => setze('sichtbar', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "Spieler sehen die Gruppe auf der Karte")), geaendert && /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setEntwurf(reise)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein"
  }, "Speichern"))), !m ? /*#__PURE__*/React.createElement("p", {
    className: "pl-warnung"
  }, "Die Karte braucht einen Ma\xDFstab, sonst l\xE4sst sich nichts rechnen.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dl", {
    className: "pl-fakten pl-reise-fakten"
  }, /*#__PURE__*/React.createElement("dt", null, "Strecke"), /*#__PURE__*/React.createElement("dd", null, laengeText(entwurf.pos || 0, einh), " von ", laengeText(st.gesamt, einh)), /*#__PURE__*/React.createElement("dt", null, "Noch"), /*#__PURE__*/React.createElement("dd", null, angekommen ? 'angekommen' : st.plan.tage.length + (st.plan.tage.length === 1 ? ' Tag' : ' Tage') + (st.plan.angekommen ? '' : ' bis zum Hindernis')), ankunft && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Ankunft"), /*#__PURE__*/React.createElement("dd", null, ankunft, " der Chronik")), entwurf.personen > 0 && st.plan.tage.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Verpflegung"), /*#__PURE__*/React.createElement("dd", null, verpf.rationen, " Rationen, ", verpf.wasserLiter, " l Wasser")), f.art !== 'wasser' && tempo(entwurf.optionen && entwurf.optionen.tempo).folge && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Tempo"), /*#__PURE__*/React.createElement("dd", null, tempo(entwurf.optionen.tempo).folge))), st.plan.warnungen.map(w => /*#__PURE__*/React.createElement("p", {
    key: w,
    className: "pl-warnung"
  }, w)), heute && !angekommen && /*#__PURE__*/React.createElement("section", {
    className: "pl-heute",
    "aria-label": "Der n\xE4chste Reisetag"
  }, /*#__PURE__*/React.createElement("h3", null, "Tag ", st.tag + 1), /*#__PURE__*/React.createElement("p", {
    className: "pl-heute-zeile"
  }, /*#__PURE__*/React.createElement("strong", null, laengeText(heute.strecke, einh)), " in ", stundenText(heute.stunden), ' · ', heute.teile.map(t => gelaende(t.gelaende).l).join(', '), heute.angekommen ? ' · Ankunft' : ''), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile pl-wetter-kopf"
  }, /*#__PURE__*/React.createElement("span", null, WETTER_ZEICHEN[st.heute.niederschlag], " Wetter"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    title: "Neu w\xFCrfeln",
    onClick: () => {
      const v = {
        ...(entwurf.wetterVorgaben || {})
      };
      delete v[st.tag];
      onSpeichern({
        ...entwurf,
        samen: Math.floor(Math.random() * 2147483647) + 1,
        wetterVorgaben: v
      });
    }
  }, "\uD83C\uDFB2")), /*#__PURE__*/React.createElement(WetterWahl, {
    wetter: st.heute,
    onWetter: w => onSpeichern({
      ...entwurf,
      wetterVorgaben: {
        ...(entwurf.wetterVorgaben || {}),
        [st.tag]: w
      }
    })
  }), heute.gewaltmarsch.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "pl-warnung"
  }, "Gewaltmarsch: KO-Rettungsw\xFCrfe SG ", heute.gewaltmarsch.map(g => g.sg).join(', '), " \u2014 bei Misserfolg eine Stufe Ersch\xF6pfung."), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile pl-wetter-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83C\uDFB2 Wachen"), pruefungen.length > 0 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    title: "Alle Wachen dieses Tags neu w\xFCrfeln",
    onClick: () => onSpeichern({
      ...entwurf,
      nochmal: {
        ...(entwurf.nochmal || {}),
        [st.tag]: nochmal + 1
      }
    })
  }, "\uD83C\uDFB2")), /*#__PURE__*/React.createElement(WachenListe, {
    pruefungen: pruefungen,
    begegnungen: begegnungen,
    advId: advId,
    onMeldung: onMeldung
  }), navSg > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pl-navigation"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDDED Abseits der Wege: \xDCberlebenskunst SG ", navSg), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !!uebergabe,
    onClick: () => uebergeben(auftragNavigation(advId, navSg, 'Navigation, Reisetag ' + (st.tag + 1)), '🧭 Navigation')
  }, "\uD83C\uDFB2 Probe ansagen"), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: verirrt,
    onChange: e => setVerirrt(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "Verirrt: heute kein Weiterkommen"))), entwurf.vorratFuehren && entwurf.vorrat && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "\uD83C\uDF5E Vorrat: ", entwurf.vorrat.rationen || 0, " Rationen, ", entwurf.vorrat.wasserLiter || 0, " l Wasser", entwurf.personen > 0 ? ' — reicht ' + Math.floor((entwurf.vorrat.rationen || 0) / entwurf.personen) + ' Tage' : ''), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-haupt",
    onClick: tagAbschliessen
  }, "\u2713 Tag ", st.tag + 1, " abschlie\xDFen")), letzter && /*#__PURE__*/React.createElement("section", {
    className: "pl-heute",
    "aria-label": "Der letzte Reisetag"
  }, /*#__PURE__*/React.createElement("h3", null, "Nach Tag ", letzter.nr), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise"
  }, laengeText(letzter.strecke, einh), " \xB7 ", letzter.wetter ? wetterText(letzter.wetter) : ''), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !!uebergabe,
    onClick: () => uebergeben(auftragZeit(advId, 24), '⏩ Einen Tag weiter')
  }, "\u23E9 Chronik: +1 Tag"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !!uebergabe,
    onClick: () => uebergeben(auftragRast(advId, letzter.wetter, 'Lager nach Reisetag ' + letzter.nr + ' (' + entwurf.name + ')'), '☾ Lager')
  }, "\u263E Lager aufschlagen"), (letzter.gewaltmarsch || []).map(g => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: g.stunde,
    className: "pl-knopf pl-klein",
    disabled: !!uebergabe,
    onClick: () => uebergeben(auftragGewaltmarsch(advId, g.sg, 'Gewaltmarsch, Stunde ' + g.stunde), '🎲 Gewaltmarsch')
  }, "\uD83C\uDFB2 KO SG ", g.sg))), uebergabe && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise"
  }, uebergabe), (letzter.pruefungen || []).some(p => p.treffer) && /*#__PURE__*/React.createElement(WachenListe, {
    pruefungen: letzter.pruefungen.filter(p => p.treffer),
    begegnungen: begegnungen,
    advId: advId,
    onMeldung: onMeldung
  }), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: loggt || letzter.geloggt,
    onClick: () => insLog(letzter)
  }, "\uD83D\uDCD6 ", letzter.geloggt ? 'Steht im Abenteuerlog' : 'Ins Abenteuerlog'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: kopieren
  }, "\uD83D\uDCCB Tagebuch kopieren"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: tagZuruecknehmen
  }, "\u21B6 Tag ", letzter.nr, " zur\xFCcknehmen"))), st.plan.tage.length > 1 && /*#__PURE__*/React.createElement("details", {
    className: "pl-plan"
  }, /*#__PURE__*/React.createElement("summary", null, "Plan: ", st.plan.tage.length, " Tage"), /*#__PURE__*/React.createElement("div", {
    className: "pl-plan-rolle"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Tag"), /*#__PURE__*/React.createElement("th", null, "Strecke"), /*#__PURE__*/React.createElement("th", null, "Zeit"), /*#__PURE__*/React.createElement("th", null, "Wetter"), /*#__PURE__*/React.createElement("th", null, "KO"))), /*#__PURE__*/React.createElement("tbody", null, st.plan.tage.slice(0, 60).map((t, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, st.tag + t.nr), /*#__PURE__*/React.createElement("td", null, laengeText(t.strecke, einh)), /*#__PURE__*/React.createElement("td", null, stundenText(t.stunden)), /*#__PURE__*/React.createElement("td", {
    title: wetterText(t.wetter)
  }, t.wetter ? WETTER_ZEICHEN[t.wetter.niederschlag] + ' ' + WETTER_WORTE[t.wetter.temperatur] : ''), /*#__PURE__*/React.createElement("td", null, t.gewaltmarsch.map(g => g.sg).join(', '))))))))), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(reise)
  }, "Reise l\xF6schen")));
};

// ==== planer/src/3c-begegnung.jsx ====
// ── Regionen und Begegnungen: die Tafeln ─────────────────────────
// Rechnung in 1d-begegnung.jsx. Hier die Tafel einer Region mit ihrer
// Begegnungstabelle, ein Wurf von Hand, und die Liste der Wachen, die
// ReiseTafel fuer den naechsten Reisetag zeigt.

const BegegnungErgebnis = ({
  p,
  begegnungen,
  advId,
  onMeldung
}) => {
  const [schickt, setSchickt] = useState(false);
  const art = p.eintrag ? p.eintrag.art : p.art;
  const id = p.eintrag ? p.eintrag.begegnungId : p.begegnungId;
  const b = (begegnungen || []).find(x => x.id === id);
  const schicken = async () => {
    setSchickt(true);
    const genommen = await anHeldenbuch(auftragKampf(advId, id, b ? b.name : ''));
    setSchickt(false);
    onMeldung(genommen ? {
      art: 'gut',
      text: '⚔ Das Heldenbuch fragt jetzt, ob es „' + (b ? b.name : 'die Begegnung') + '“ in den Kampftracker laden soll.'
    } : {
      art: 'gut',
      text: '⚔ Der Auftrag wartet eine halbe Stunde. Öffne das Heldenbuch im DM-Modus, dann fragt der Kampftracker nach.'
    });
  };
  return /*#__PURE__*/React.createElement("span", {
    className: 'pl-wurf' + (p.treffer ? ' treffer' : '')
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-wurf-zahl",
    title: 'Wurf ' + p.wurf + ', etwas geschieht ab ' + p.ab
  }, p.wurf), /*#__PURE__*/React.createElement("span", null, begegnungName(p, begegnungen)), p.treffer && art === 'kampf' && id && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: schickt || !b,
    title: b ? 'In den Kampftracker des Heldenbuchs laden' : 'Diese Begegnung gibt es im Heldenbuch nicht',
    onClick: schicken
  }, "\u2694 Kampftracker"));
};
const WachenListe = ({
  pruefungen,
  begegnungen,
  advId,
  onMeldung
}) => {
  if (!pruefungen.length) return /*#__PURE__*/React.createElement("p", {
    className: "pl-leise"
  }, "Keine Region mit Begegnungstabelle auf dem Weg.");
  return /*#__PURE__*/React.createElement("ul", {
    className: "pl-wachen"
  }, pruefungen.map((p, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-wache-zeit"
  }, p.nacht ? '🌙' : '☀', " ", String(p.uhr).padStart(2, '0'), " Uhr"), /*#__PURE__*/React.createElement("span", {
    className: "pl-wache-ort"
  }, p.unterwegs ? 'unterwegs' : 'im Lager', " \xB7 ", p.regionName || p.region), /*#__PURE__*/React.createElement(BegegnungErgebnis, {
    p: p,
    begegnungen: begegnungen,
    advId: advId,
    onMeldung: onMeldung
  }))));
};
const TabellenEditor = ({
  tabelle,
  begegnungen,
  onTabelle
}) => {
  const t = {
    ...neueTabelle(),
    ...(tabelle || {})
  };
  const setze = (feld, wert) => onTabelle({
    ...t,
    [feld]: wert
  });
  const eintrag = (id, feld, wert) => setze('eintraege', t.eintraege.map(e => e.id === id ? {
    ...e,
    [feld]: wert
  } : e));
  const summe = t.eintraege.reduce((s, e) => s + (+e.gewicht || 0), 0);
  const prozent = ab => Math.max(0, Math.min(100, Math.round((t.wuerfel - ab + 1) / t.wuerfel * 100)));
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-tabelle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-raster3"
  }, /*#__PURE__*/React.createElement("label", null, "Pr\xFCfen alle", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: t.jeStunden,
    onChange: e => setze('jeStunden', +e.target.value)
  }, WACHE_STUNDEN.map(h => /*#__PURE__*/React.createElement("option", {
    key: h,
    value: h
  }, h, " Std.")))), /*#__PURE__*/React.createElement("label", null, "Tags ab W20", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 1,
    max: 21,
    value: t.ab,
    onChange: e => setze('ab', Math.max(1, Math.min(21, +e.target.value || 1)))
  })), /*#__PURE__*/React.createElement("label", null, "Nachts ab", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 1,
    max: 21,
    value: t.abNacht,
    onChange: e => setze('abNacht', Math.max(1, Math.min(21, +e.target.value || 1)))
  }))), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Je Pr\xFCfung tags ", prozent(t.ab), " %, nachts ", prozent(t.abNacht), " % \xB7 ", Math.floor(24 / t.jeStunden), " Pr\xFCfungen am Tag"), /*#__PURE__*/React.createElement("ul", {
    className: "pl-tabelle-zeilen"
  }, t.eintraege.map((e, i) => /*#__PURE__*/React.createElement("li", {
    key: e.id
  }, /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-gewicht",
    type: "number",
    min: 0,
    max: 99,
    value: e.gewicht,
    "aria-label": 'Gewicht Zeile ' + (i + 1),
    title: summe ? Math.round((+e.gewicht || 0) / summe * 100) + ' % der Treffer' : '',
    onChange: ev => eintrag(e.id, 'gewicht', Math.max(0, +ev.target.value || 0))
  }), /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: e.art,
    "aria-label": 'Art Zeile ' + (i + 1),
    onChange: ev => eintrag(e.id, 'art', ev.target.value)
  }, BEGEGNUNG_ART.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.k,
    value: a.k
  }, a.l))), /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: e.zeit,
    "aria-label": 'Zeit Zeile ' + (i + 1),
    onChange: ev => eintrag(e.id, 'zeit', ev.target.value)
  }, BEGEGNUNG_ZEIT.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.k,
    value: a.k
  }, a.l))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-symbol pl-symbol-weg",
    "aria-label": 'Zeile ' + (i + 1) + ' entfernen',
    onClick: () => setze('eintraege', t.eintraege.filter(x => x.id !== e.id))
  }, "\u2715"), e.art === 'kampf' && /*#__PURE__*/React.createElement("select", {
    className: "pl-feld pl-breit",
    value: e.begegnungId || '',
    "aria-label": 'Begegnung Zeile ' + (i + 1),
    onChange: ev => eintrag(e.id, 'begegnungId', ev.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Begegnung aus dem Heldenbuch \u2014"), (begegnungen || []).map(b => /*#__PURE__*/React.createElement("option", {
    key: b.id,
    value: b.id
  }, b.name, " \xB7 ", b.difficulty, " \xB7 ", (b.enemies || []).reduce((s, x) => s + (+x.count || 1), 0), " Gegner"))), /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-breit",
    value: e.text || '',
    maxLength: 300,
    "aria-label": 'Text Zeile ' + (i + 1),
    placeholder: e.art === 'kampf' ? 'Zusatz, z. B. „aus dem Hinterhalt“' : 'Was geschieht',
    onChange: ev => eintrag(e.id, 'text', ev.target.value)
  })))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setze('eintraege', [...t.eintraege, neuerTabellenEintrag(planNeueId('t'))])
  }, "\uFF0B Zeile"), begegnungen && !begegnungen.length && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Im Heldenbuch gibt es f\xFCr dieses Abenteuer noch keine Begegnung (\uD83D\uDCDA Datenbank \u203A Begegnungen)."));
};
const RegionTafel = ({
  region,
  dm,
  karte,
  begegnungen,
  advId,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onMeldung
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(region);
  const [wurf, setWurf] = useState(null);
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const setzeDm = (feld, wert) => setEntwurf(e => ({
    ...e,
    dm: {
      ...(e.dm || {}),
      [feld]: wert
    }
  }));
  const flaeche = flaecheText(entwurf.punkte || [], karte.massstab);
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": 'Region: ' + region.name
    }, /*#__PURE__*/React.createElement(TafelKopf, {
      symbol: "\u2B21",
      titel: region.name,
      onSchliessen: onSchliessen
    }), flaeche && /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, flaeche), region.text ? /*#__PURE__*/React.createElement("p", {
      className: "pl-ort-text"
    }, region.text) : /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "\xDCber diese Gegend ist noch nichts bekannt."));
  }
  const tabelle = entwurf.dm && entwurf.dm.tabelle || null;
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Region bearbeiten: ' + region.name
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: "\u2B21",
    titel: entwurf.name || 'Ohne Namen',
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: e => setze('name', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile",
    role: "radiogroup",
    "aria-label": "Farbe"
  }, REGION_FARBEN.map(f => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: f,
    role: "radio",
    "aria-checked": entwurf.farbe === f,
    "aria-label": 'Farbe ' + f,
    className: 'pl-farbwahl' + (entwurf.farbe === f ? ' an' : ''),
    style: {
      background: f
    },
    onClick: () => setze('farbe', f)
  })), flaeche && /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, flaeche)), /*#__PURE__*/React.createElement("label", null, "Was die Spieler lesen", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 2,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: e => setze('text', e.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: e => setzeDm('notiz', e.target.value)
  })), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: e => setze('sichtbar', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "F\xFCr Spieler sichtbar")), /*#__PURE__*/React.createElement("h3", {
    className: "pl-unterkopf"
  }, "Zufallsbegegnungen ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 nur Spielleitung")), tabelle ? /*#__PURE__*/React.createElement(TabellenEditor, {
    tabelle: tabelle,
    begegnungen: begegnungen,
    onTabelle: t => setzeDm('tabelle', t)
  }) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setzeDm('tabelle', neueTabelle())
  }, "\uFF0B Begegnungstabelle anlegen"), tabelle && /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setWurf(begegnungPruefen(tabelle, false, Math.random))
  }, "\uD83C\uDFB2 Tags w\xFCrfeln"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setWurf(begegnungPruefen(tabelle, true, Math.random))
  }, "\uD83C\uDFB2 Nachts w\xFCrfeln")), wurf && /*#__PURE__*/React.createElement("div", {
    className: "pl-wurf-zeile"
  }, /*#__PURE__*/React.createElement(BegegnungErgebnis, {
    p: wurf,
    begegnungen: begegnungen,
    advId: advId,
    onMeldung: onMeldung
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(region)
  }, "L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !geaendert,
    onClick: () => setEntwurf(region)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein",
    disabled: !geaendert
  }, "Speichern"))));
};

// ==== planer/src/3d-sicht.jsx ====
// ── Spielersicht: Handouts und der Tisch ─────────────────────────
// Rechnung in 1e-sicht.jsx. Hier: die Tafel eines Handouts fuer die
// Spielleitung, das Lesefenster fuer Spieler, die Liste, und das
// Tischfenster fuer Beamer oder zweiten Bildschirm.

const PlanerHandoutListe = ({
  handouts,
  wahl,
  dm,
  gesehen,
  onWahl,
  onNeu
}) => {
  if (!dm && !handouts.length) return null;
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Handouts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-liste-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "Handouts \xB7 ", handouts.length), dm && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: onNeu
  }, "\uFF0B Handout")), /*#__PURE__*/React.createElement("ul", null, handouts.map(h => /*#__PURE__*/React.createElement("li", {
    key: h.id,
    className: 'pl-eintrag' + (h.id === wahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onWahl(h.id)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\uD83D\uDCDC"), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !h.sichtbar ? ' pl-verborgen-text' : '')
  }, h.titel || 'Ohne Titel'), dm && h.sichtbar && /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, (h.an || []).length ? 'an ' + h.an.length : 'an alle'), !dm && gesehen && !gesehen.includes(handoutFassung(h)) && /*#__PURE__*/React.createElement("span", {
    className: "pl-neu-punkt",
    title: "Neu"
  }, "neu"))))));
};

// Das Lesefenster: fuer Spieler, wenn etwas Neues kommt, und aus der Liste.
const HandoutLeser = ({
  handout,
  onZu
}) => /*#__PURE__*/React.createElement("div", {
  className: "pl-schleier",
  onClick: onZu
}, /*#__PURE__*/React.createElement("article", {
  className: "pl-dialog pl-handout-leser",
  role: "dialog",
  "aria-modal": "true",
  "aria-label": 'Handout: ' + handout.titel,
  onClick: e => e.stopPropagation()
}, /*#__PURE__*/React.createElement("div", {
  className: "pl-etikett"
}, "\uD83D\uDCDC Handout"), /*#__PURE__*/React.createElement("h2", null, handout.titel || 'Ohne Titel'), handout.bild && handout.ablage && /*#__PURE__*/React.createElement("img", {
  className: "pl-handout-bild",
  src: planerDateiUrl(handout.ablage, handout.bild),
  alt: ""
}), handout.text && /*#__PURE__*/React.createElement("p", {
  className: "pl-ort-text"
}, handout.text), /*#__PURE__*/React.createElement("div", {
  className: "pl-dialog-knoepfe"
}, /*#__PURE__*/React.createElement("button", {
  className: "pl-knopf pl-haupt",
  onClick: onZu
}, "Gelesen"))));
const HandoutTafel = ({
  handout,
  mitglieder,
  arbeitet,
  onSpeichern,
  onVerteilen,
  onLoeschen,
  onSchliessen,
  onBild,
  onTisch
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(handout);
  const bildEingabe = useRef(null);
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const an = entwurf.an || [];
  const um = id => setze('an', an.includes(id) ? an.filter(x => x !== id) : [...an, id]);
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Handout: ' + handout.titel
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: "\uD83D\uDCDC",
    titel: entwurf.titel || 'Ohne Titel',
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("p", {
    className: 'pl-sicht ' + (handout.sichtbar ? 'an' : 'aus')
  }, handout.sichtbar ? 'Verteilt ' + ((handout.an || []).length ? 'an ' + handout.an.length + (handout.an.length === 1 ? ' Spieler' : ' Spieler') : 'an alle') : 'Noch nicht verteilt'), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Titel", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.titel || '',
    maxLength: 120,
    onChange: e => setze('titel', e.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "Text", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 5,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: e => setze('text', e.target.value)
  })), entwurf.bild && handout.ablage && /*#__PURE__*/React.createElement("div", {
    className: "pl-handout-vorschau"
  }, /*#__PURE__*/React.createElement("img", {
    src: planerDateiUrl(handout.ablage, entwurf.bild),
    alt: ""
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setze('bild', '')
  }, "Bild entfernen")), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: arbeitet || geaendert,
    title: geaendert ? 'Erst speichern' : '',
    onClick: () => bildEingabe.current && bildEingabe.current.click()
  }, "\uD83D\uDDBC ", entwurf.bild ? 'Anderes Bild' : 'Bild'), /*#__PURE__*/React.createElement("input", {
    ref: bildEingabe,
    type: "file",
    accept: "image/*",
    hidden: true,
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (f) onBild(entwurf, f);
    }
  })), /*#__PURE__*/React.createElement("fieldset", {
    className: "pl-empfaenger"
  }, /*#__PURE__*/React.createElement("legend", null, "F\xFCr wen"), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: 'an-' + handout.id,
    checked: !an.length,
    onChange: () => setze('an', [])
  }), /*#__PURE__*/React.createElement("span", null, "Alle in der Gruppe")), (mitglieder || []).map(m => /*#__PURE__*/React.createElement("label", {
    key: m.id,
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: an.includes(+m.id),
    onChange: () => um(+m.id)
  }), /*#__PURE__*/React.createElement("span", null, m.name, m.rolle === 'dm' ? ' (Spielleitung)' : ''))), mitglieder === null && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Die Mitglieder der Gruppe werden geladen \u2026")), /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: e => setEntwurf(v => ({
      ...v,
      dm: {
        ...(v.dm || {}),
        notiz: e.target.value
      }
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein pl-haupt",
    disabled: geaendert || arbeitet,
    title: geaendert ? 'Erst speichern' : '',
    onClick: () => onVerteilen(handout, !handout.sichtbar)
  }, handout.sichtbar ? '↶ Zurücknehmen' : '📜 An die Spieler geben'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => onTisch(entwurf)
  }, "\uD83D\uDCFA Auf dem Tisch zeigen")), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(handout)
  }, "L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !geaendert,
    onClick: () => setEntwurf(handout)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein",
    disabled: !geaendert
  }, "Speichern"))));
};

// ── Das Tischfenster ─────────────────────────────────────────────
// Oeffnet die Spielleitung mit 📺 Tisch. Es laedt mit ihrer Anmeldung,
// zeigt aber nur, was die Runde sehen darf (spielerSicht), mit deckendem
// Nebel und ohne jedes Werkzeug. Welche Karte, welcher Ausschnitt und ob
// ein Handout gross zu sehen ist, sagt die Seite der Spielleitung ueber
// den gemeinsamen Kanal.
const TischApp = ({
  adv
}) => {
  const zugang = planerZugang();
  const angemeldet = !!(zugang.token && zugang.code);
  const advId = adv || (() => {
    try {
      return new URLSearchParams(location.search).get('adv') || '';
    } catch (e) {
      return '';
    }
  })();
  const [daten, setDaten] = useState(null);
  const [karteId, setKarteId] = useState('');
  const [vorgabe, setVorgabe] = useState(null);
  const [zeigen, setZeigen] = useState(null);
  const [fehlerText, setFehlerText] = useState('');
  const gedaechtnis = useRef({});
  const standRef = useRef(-1);
  const laden = useCallback(async () => {
    const d = await planerApi('planer_laden', {
      adv_id: advId
    });
    standRef.current = d.stand;
    setDaten(spielerSicht(d));
  }, []);
  useEffect(() => {
    if (!angemeldet || !advId) return;
    laden().catch(e => setFehlerText(e.message));
    const t = setInterval(() => {
      planerApi('planer_stand', {
        adv_id: advId
      }).then(s => {
        if (s.stand !== standRef.current) return laden();
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const k = new BroadcastChannel(TISCH_KANAL);
    k.onmessage = ev => {
      const n = ev.data || {};
      if (n.advId && n.advId !== advId) return;
      // Ein anderer Ausschnitt laesst ein gezeigtes Handout liegen; erst eine
      // andere Karte oder „Karte zeigen“ nimmt es weg.
      if (n.art === 'karte') setZeigen(null);
      if (n.art === 'karte' || n.art === 'ansicht') {
        setKarteId(n.karteId);
        if (n.ansicht) setVorgabe({
          ...n.ansicht,
          karteId: n.karteId,
          n: n.zeit
        });
      }
      if (n.art === 'handout') setZeigen({
        art: 'handout',
        id: n.id,
        handout: n.handout
      });
      if (n.art === 'leer') setZeigen(null);
      if (n.art === 'neu') laden().catch(() => {});
    };
    k.postMessage(tischNachricht('hallo', {
      advId
    }));
    return () => k.close();
  }, []);
  if (!angemeldet) return /*#__PURE__*/React.createElement(PlanerNichtAngemeldet, null);
  if (fehlerText) return /*#__PURE__*/React.createElement("div", {
    className: "pl-tisch-leer"
  }, /*#__PURE__*/React.createElement("p", null, fehlerText));
  if (!daten) return /*#__PURE__*/React.createElement("div", {
    className: "pl-tisch-leer"
  }, /*#__PURE__*/React.createElement("p", null, "\uD83D\uDDFA Der Tisch l\xE4dt \u2026"));
  const karte = daten.karten.find(k => k.id === karteId) || daten.karten[0] || null;
  const aufKarte = art => karte ? daten.objekte.filter(o => o.art === art && o.karteId === karte.id) : [];
  const routen = aufKarte('route');
  const gruppen = karte ? aufKarte('reise').filter(j => !j.gruppeId).map(j => {
    const r = routen.find(x => x.id === j.routeId);
    if (!r || !karte.massstab) return null;
    return {
      id: j.id,
      name: j.name,
      sichtbar: true,
      punkt: punktAufRoute(routeInRichtung(r, j.richtung), karte.massstab, j.pos || 0)
    };
  }).filter(Boolean) : [];
  // Ein Handout, das an einzelne geht, schickt die Spielleitung trotzdem
  // mit; auf dem Tisch zeigt es, wer es zeigt.
  const handout = zeigen && zeigen.art === 'handout' ? zeigen.handout || daten.objekte.find(o => o.id === zeigen.id) : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-tisch"
  }, karte ? /*#__PURE__*/React.createElement(KartenLeinwand, {
    karte: karte,
    orte: aufKarte('ort'),
    dm: false,
    werkzeug: "ansehen",
    ortWahl: "",
    linie: null,
    fokus: null,
    gedaechtnis: gedaechtnis,
    routen: routen,
    gruppen: gruppen,
    regionen: aufKarte('region'),
    heldengruppen: aufKarte('gruppe'),
    nebel: nebelVon(karte),
    nebelDeckend: true,
    vorgabeAnsicht: vorgabe,
    onKlick: () => {},
    onOrtWahl: () => {},
    onRouteWahl: () => {},
    onReiseWahl: () => {},
    onRegionWahl: () => {}
  }) : /*#__PURE__*/React.createElement("div", {
    className: "pl-tisch-leer"
  }, /*#__PURE__*/React.createElement("p", null, "Noch keine Karte f\xFCr die Runde.")), handout && /*#__PURE__*/React.createElement("div", {
    className: "pl-tisch-handout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-etikett"
  }, "\uD83D\uDCDC ", handout.titel), handout.bild && handout.ablage && /*#__PURE__*/React.createElement("img", {
    src: planerDateiUrl(handout.ablage, handout.bild),
    alt: ""
  }), handout.text && /*#__PURE__*/React.createElement("p", null, handout.text)), /*#__PURE__*/React.createElement("button", {
    className: "pl-tisch-voll pl-symbol",
    "aria-label": "Vollbild",
    title: "Vollbild",
    onClick: () => {
      const el = document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen();else if (el.requestFullscreen) el.requestFullscreen();
    }
  }, "\u26F6"));
};

// ==== planer/src/3e-welt.jsx ====
// ── Die Welt: Tafeln fuer Figuren, Zeit, Dateien, Quests, Wissen, Fraktionen, Hex ──
// Rechnung in 1f-welt.jsx.

// ── Zeitleiste ───────────────────────────────────────────────────
// Die Spielleitung schiebt die Zeit und sieht, wo die Figuren dann sind.
// Spieler sehen die Figuren zu der Zeit, die sie freigegeben hat.
const Zeitleiste = ({
  dm,
  zeit,
  bereich,
  chronikZeit,
  freigegeben,
  onZeit,
  onFreigeben
}) => {
  if (!dm) {
    return Number.isFinite(+freigegeben) ? /*#__PURE__*/React.createElement("div", {
      className: "pl-zeitleiste"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pl-leise"
    }, "\uD83D\uDD70 Stand: ", zeitText(freigegeben))) : null;
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-zeitleiste"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-zeit-text"
  }, "\uD83D\uDD70 ", zeitText(zeit)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: bereich.min,
    max: bereich.max,
    step: 1,
    value: zeit,
    "aria-label": "Zeit",
    onChange: e => onZeit(+e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    "aria-label": "Eine Stunde zur\xFCck",
    onClick: () => onZeit(Math.max(bereich.min, zeit - 1))
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    "aria-label": "Eine Stunde weiter",
    onClick: () => onZeit(zeit + 1)
  }, "\u203A"), chronikZeit != null && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => onZeit(chronikZeit),
    title: "Die Uhr der Chronik"
  }, "\u27F2 Chronik"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => onFreigeben(zeit),
    disabled: +freigegeben === zeit,
    title: "Spieler sehen die Figuren zu dieser Zeit"
  }, "\uD83D\uDC41 F\xFCr Spieler: ", Number.isFinite(+freigegeben) ? zeitText(freigegeben) : '—'));
};

// ── Figur ────────────────────────────────────────────────────────
const FIGUR_SYMBOLE = ['🧍', '🧙', '🧛', '🐺', '🐉', '🏇', '🛒', '⛵', '⚔', '👑', '💀', '🦅'];
const neueFigur = (karteId, zeit, p) => ({
  id: planNeueId('p'),
  karteId,
  art: 'figur',
  name: 'Neue Figur',
  symbol: '🧍',
  sichtbar: false,
  text: '',
  wegpunkte: [{
    zeit,
    x: Math.round(p.x),
    y: Math.round(p.y),
    notiz: ''
  }],
  dm: {
    notiz: ''
  }
});
const FigurTafel = ({
  figur,
  dm,
  zeit,
  wegpunktWartet,
  helden,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onWegpunktHier,
  onBogen
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(figur);
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const wp = wegpunkteSortiert(entwurf);
  const pos = figurPosition(entwurf, zeit);
  const setzeWp = (i, feld, wert) => setEntwurf(e => ({
    ...e,
    wegpunkte: wegpunkteSortiert(e).map((w, j) => j === i ? {
      ...w,
      [feld]: wert
    } : w)
  }));
  const nsc = nscZuFigur(entwurf, helden);
  // Einen NSC waehlen heisst: Name und Zeichen kommen mit. Beides bleibt
  // danach aenderbar — der Bote heisst auf der Karte vielleicht „Reiter“.
  const nscWaehlen = id => setEntwurf(e => {
    const h = (helden || []).find(x => x.id === id);
    if (!h) {
      const {
        charId,
        ...rest
      } = e;
      return rest;
    }
    return {
      ...e,
      charId: h.id,
      name: e.name === 'Neue Figur' || !e.name ? h.name : e.name,
      symbol: nscZeichen(h)
    };
  });
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": 'Figur: ' + figur.name
    }, /*#__PURE__*/React.createElement(TafelKopf, {
      symbol: figur.symbol || '🧍',
      titel: figur.name,
      onSchliessen: onSchliessen
    }), figur.text ? /*#__PURE__*/React.createElement("p", {
      className: "pl-ort-text"
    }, figur.text) : /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "Mehr ist nicht bekannt."));
  }
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Figur bearbeiten: ' + figur.name
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: entwurf.symbol || '🧍',
    titel: entwurf.name || 'Ohne Namen',
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise"
  }, zeitText(zeit), ": ", pos ? pos.unterwegs ? 'unterwegs' : 'steht' : 'noch nirgends'), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: e => setze('name', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-symbole",
    role: "radiogroup",
    "aria-label": "Zeichen"
  }, FIGUR_SYMBOLE.map(s => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: s,
    role: "radio",
    "aria-checked": entwurf.symbol === s,
    className: 'pl-symbolwahl' + (entwurf.symbol === s ? ' an' : ''),
    onClick: () => setze('symbol', s)
  }, s))), (helden === null || nscListe(helden).length > 0 || entwurf.charId) && /*#__PURE__*/React.createElement("label", null, "NSC aus dem Heldenbuch", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.charId || '',
    "aria-label": "NSC aus dem Heldenbuch",
    onChange: e => nscWaehlen(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keiner, nur eine Figur \u2014"), nscListe(helden).map(h => /*#__PURE__*/React.createElement("option", {
    key: h.id,
    value: h.id
  }, nscZeichen(h), " ", h.name)), entwurf.charId && !nscZuFigur(entwurf, helden) && /*#__PURE__*/React.createElement("option", {
    value: entwurf.charId
  }, "(nicht mehr im Abenteuer)"))), nsc && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, nscZeichen(nsc), " ", nsc.haltung === 'feindlich' ? 'feindlich' : 'freundlich', " \xB7 ", nscWerte(nsc), onBogen && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-verweis",
    onClick: () => onBogen(nsc)
  }, "Bogen \xF6ffnen"))), /*#__PURE__*/React.createElement("h3", {
    className: "pl-unterkopf"
  }, "Wegpunkte"), /*#__PURE__*/React.createElement("ol", {
    className: "pl-wegpunkte"
  }, wp.map((w, i) => /*#__PURE__*/React.createElement("li", {
    key: i + ':' + w.zeit
  }, /*#__PURE__*/React.createElement("label", null, "Tag ", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 1,
    value: Math.floor(w.zeit / 24) + 1,
    "aria-label": 'Tag Wegpunkt ' + (i + 1),
    onChange: e => setzeWp(i, 'zeit', zeitAus(e.target.value, w.zeit % 24))
  })), /*#__PURE__*/React.createElement("label", null, "Uhr ", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    max: 23,
    value: w.zeit % 24,
    "aria-label": 'Stunde Wegpunkt ' + (i + 1),
    onChange: e => setzeWp(i, 'zeit', zeitAus(Math.floor(w.zeit / 24) + 1, e.target.value))
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-symbol pl-symbol-weg",
    "aria-label": 'Wegpunkt ' + (i + 1) + ' entfernen',
    disabled: wp.length < 2,
    onClick: () => setEntwurf(e => ({
      ...e,
      wegpunkte: wegpunkteSortiert(e).filter((_, j) => j !== i)
    }))
  }, "\u2715"), /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-breit",
    value: w.notiz || '',
    placeholder: "Was dort geschieht",
    maxLength: 300,
    "aria-label": 'Notiz Wegpunkt ' + (i + 1),
    onChange: e => setzeWp(i, 'notiz', e.target.value)
  })))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'pl-knopf pl-klein' + (wegpunktWartet ? ' an' : ''),
    disabled: geaendert,
    title: geaendert ? 'Erst speichern' : '',
    onClick: onWegpunktHier
  }, "\uD83D\uDCCD Wegpunkt f\xFCr ", zeitText(zeit), " auf die Karte setzen"), /*#__PURE__*/React.createElement("label", null, "Was die Spieler lesen", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 2,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: e => setze('text', e.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: e => setEntwurf(v => ({
      ...v,
      dm: {
        ...(v.dm || {}),
        notiz: e.target.value
      }
    }))
  })), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: e => setze('sichtbar', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "F\xFCr Spieler sichtbar")), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(figur)
  }, "L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !geaendert,
    onClick: () => setEntwurf(figur)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein",
    disabled: !geaendert
  }, "Speichern"))));
};

// ── Lokale Dateien ───────────────────────────────────────────────
// Freigegebene Ordner leben in diesem Browser (IndexedDB), nie auf dem
// Server. Der Speicher ist austauschbar, damit dev/planer-echt.html ihn
// ohne Dateiauswahl pruefen kann.
const planerOrdner = {
  speicher: null,
  idb: () => new Promise((ok, nein) => {
    const r = indexedDB.open('hb-planer-ordner', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('ordner');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => nein(r.error);
  }),
  async alle() {
    if (this.speicher) return this.speicher.alle();
    const db = await this.idb();
    return new Promise((ok, nein) => {
      const aus = {};
      const t = db.transaction('ordner').objectStore('ordner').openCursor();
      t.onsuccess = () => {
        const c = t.result;
        if (c) {
          aus[c.key] = c.value;
          c.continue();
        } else ok(aus);
      };
      t.onerror = () => nein(t.error);
    });
  },
  async setzen(name, handle) {
    if (this.speicher) return this.speicher.setzen(name, handle);
    const db = await this.idb();
    return new Promise((ok, nein) => {
      const t = db.transaction('ordner', 'readwrite');
      t.objectStore('ordner').put(handle, name);
      t.oncomplete = ok;
      t.onerror = () => nein(t.error);
    });
  },
  async datei(verweis) {
    const alle = await this.alle();
    const wurzel = alle[verweis.bibliothek];
    if (!wurzel) throw new Error('Die Bibliothek „' + verweis.bibliothek + '“ ist in diesem Browser nicht freigegeben.');
    if (wurzel.queryPermission && (await wurzel.queryPermission({
      mode: 'read'
    })) !== 'granted') {
      if (!wurzel.requestPermission || (await wurzel.requestPermission({
        mode: 'read'
      })) !== 'granted') throw new Error('Der Browser hat den Zugriff auf den Ordner nicht erlaubt.');
    }
    const teile = relativerPfad(verweis.pfad).split('/');
    let ordner = wurzel;
    try {
      for (const t of teile.slice(0, -1)) ordner = await ordner.getDirectoryHandle(t);
      return await (await ordner.getFileHandle(teile[teile.length - 1])).getFile();
    } catch (e) {
      throw new Error('Nicht gefunden in „' + verweis.bibliothek + '“: ' + verweis.pfad);
    }
  }
};
const ordnerFreigabeGeht = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
const DateiBetrachter = ({
  datei,
  onZu
}) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(datei.file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [datei.file]);
  const art = dateiArt(datei.verweis.pfad);
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-schleier",
    onClick: onZu
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog pl-betrachter",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": datei.verweis.titel,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-tafel-kopf"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, DATEI_ZEICHEN[art]), /*#__PURE__*/React.createElement("h2", null, datei.verweis.titel), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    "aria-label": "Schlie\xDFen",
    onClick: onZu
  }, "\u2715")), url && art === 'bild' && /*#__PURE__*/React.createElement("img", {
    src: url,
    alt: ""
  }), url && art === 'ton' && /*#__PURE__*/React.createElement("audio", {
    src: url,
    controls: true,
    autoPlay: true
  }), url && art === 'video' && /*#__PURE__*/React.createElement("video", {
    src: url,
    controls: true,
    autoPlay: true
  }), url && (dateiEndung(datei.verweis.pfad) === 'pdf' || ['txt', 'md'].includes(dateiEndung(datei.verweis.pfad))) && /*#__PURE__*/React.createElement("iframe", {
    src: url,
    title: datei.verweis.titel
  }), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, datei.verweis.bibliothek, " / ", datei.verweis.pfad)));
};

// Die Dateien eines Orts. Nur fuer die Spielleitung: sie stehen unter dm.
const DateiListe = ({
  dateien,
  onDateien,
  onMeldung
}) => {
  const [bibliotheken, setBibliotheken] = useState([]);
  const [bib, setBib] = useState('');
  const [pfad, setPfad] = useState('');
  const [neuName, setNeuName] = useState('');
  const [zeigen, setZeigen] = useState(null);
  const neuLaden = () => planerOrdner.alle().then(a => {
    const n = Object.keys(a);
    setBibliotheken(n);
    setBib(b => b || n[0] || '');
  }).catch(() => setBibliotheken([]));
  useEffect(() => {
    neuLaden();
  }, []);
  const hinzu = v => {
    if (!v) {
      onMeldung({
        art: 'fehler',
        text: 'Ein Pfad muss innerhalb der Bibliothek liegen, ohne .. und ohne Laufwerk.'
      });
      return;
    }
    if ((dateien || []).some(d => d.bibliothek === v.bibliothek && d.pfad === v.pfad)) return;
    onDateien([...(dateien || []), v]);
    setPfad('');
  };
  const freigeben = async () => {
    try {
      const handle = await window.showDirectoryPicker({
        id: 'hb-planer',
        mode: 'read'
      });
      const name = bibliotheksName(neuName || handle.name);
      await planerOrdner.setzen(name, handle);
      setNeuName('');
      setBib(name);
      neuLaden();
      onMeldung({
        art: 'gut',
        text: '📁 „' + name + '“ ist in diesem Browser freigegeben. Für die Brücke: installieren.ps1 -Bibliothek "' + name + '" -Ordner "…"'
      });
    } catch (e) {
      if (e.name !== 'AbortError') onMeldung({
        art: 'fehler',
        text: 'Freigeben ging nicht: ' + e.message
      });
    }
  };
  const waehlen = async () => {
    try {
      const alle = await planerOrdner.alle();
      const wurzel = alle[bib];
      const [fh] = await window.showOpenFilePicker({
        startIn: wurzel,
        id: 'hb-planer'
      });
      const teile = wurzel && wurzel.resolve ? await wurzel.resolve(fh) : null;
      if (!teile) {
        onMeldung({
          art: 'fehler',
          text: 'Die Datei liegt nicht in „' + bib + '“.'
        });
        return;
      }
      hinzu(dateiVerweis(bib, teile.join('/')));
    } catch (e) {
      if (e.name !== 'AbortError') onMeldung({
        art: 'fehler',
        text: e.message
      });
    }
  };
  const ansehen = async v => {
    try {
      setZeigen({
        verweis: v,
        file: await planerOrdner.datei(v)
      });
    } catch (e) {
      onMeldung({
        art: 'fehler',
        text: e.message
      });
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-dateien"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "pl-unterkopf"
  }, "Dateien auf diesem Rechner ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 nur Spielleitung")), /*#__PURE__*/React.createElement("ul", {
    className: "pl-datei-liste"
  }, (dateien || []).map(v => /*#__PURE__*/React.createElement("li", {
    key: v.bibliothek + '/' + v.pfad
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, DATEI_ZEICHEN[dateiArt(v.pfad)]), /*#__PURE__*/React.createElement("span", {
    className: "pl-eintrag-text",
    title: v.bibliothek + ' / ' + v.pfad
  }, v.titel), imBrowserZeigbar(v.pfad) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-symbol",
    "aria-label": 'Ansehen: ' + v.titel,
    title: "Im Browser ansehen",
    onClick: () => ansehen(v)
  }, "\uD83D\uDC41"), /*#__PURE__*/React.createElement("a", {
    className: "pl-symbol",
    href: brueckenAdresse(v),
    "aria-label": 'Öffnen: ' + v.titel,
    title: "Im Programm \xF6ffnen (Planer-Br\xFCcke)"
  }, "\u25B6"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-symbol pl-symbol-weg",
    "aria-label": 'Entfernen: ' + v.titel,
    onClick: () => onDateien(dateien.filter(d => d !== v))
  }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: bib,
    onChange: e => setBib(e.target.value),
    "aria-label": "Bibliothek"
  }, !bibliotheken.length && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keine Bibliothek \u2014"), bibliotheken.map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n))), ordnerFreigabeGeht() && bib && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: waehlen
  }, "\uD83D\uDCC1 Datei w\xE4hlen")), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-breit-feld",
    value: pfad,
    placeholder: "oder Pfad in der Bibliothek, z. B. Musik/Taverne.mp3",
    "aria-label": "Pfad",
    onChange: e => setPfad(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !pfad.trim() || !bib,
    onClick: () => hinzu(dateiVerweis(bib, pfad))
  }, "\uFF0B")), ordnerFreigabeGeht() ? /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: neuName,
    placeholder: "Name der Bibliothek",
    maxLength: 40,
    "aria-label": "Name der neuen Bibliothek",
    onChange: e => setNeuName(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: freigeben
  }, "\uD83D\uDCC1 Ordner freigeben")) : /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Ordner freigeben geht nur in Chrome und Edge. \xD6ffnen \xFCber die Planer-Br\xFCcke geht \xFCberall."), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "\u25B6 braucht die Planer-Br\xFCcke, einmal je Rechner: ", /*#__PURE__*/React.createElement("a", {
    href: "bruecke/planer-bruecke.ps1",
    download: true
  }, "planer-bruecke.ps1"), " und ", /*#__PURE__*/React.createElement("a", {
    href: "bruecke/installieren.ps1",
    download: true
  }, "installieren.ps1"), " in einen Ordner laden, dann ", /*#__PURE__*/React.createElement("code", null, "installieren.ps1 -Bibliothek \"Name\" -Ordner \"Pfad\""), " ausf\xFChren."), zeigen && /*#__PURE__*/React.createElement(DateiBetrachter, {
    datei: zeigen,
    onZu: () => setZeigen(null)
  }));
};

// ── Quests, Wissen, Fraktionen ───────────────────────────────────
const GeschichteListe = ({
  dm,
  quests,
  hinweise,
  fraktionen,
  wahl,
  onWahl,
  onNeu
}) => {
  const [reiter, setReiter] = useState('quest');
  if (!dm && !quests.length && !hinweise.length && !fraktionen.length) return null;
  const reiterListe = [{
    k: 'quest',
    l: '❗ Quests',
    n: quests.length
  }, {
    k: 'hinweis',
    l: '🔎 Wissen',
    n: hinweise.length
  }, {
    k: 'fraktion',
    l: '⚑ Fraktionen',
    n: fraktionen.length
  }];
  const eintraege = reiter === 'quest' ? questsSortiert(quests) : reiter === 'hinweis' ? hinweise : fraktionen;
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Geschichte"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-reiter",
    role: "tablist"
  }, reiterListe.map(r => /*#__PURE__*/React.createElement("button", {
    key: r.k,
    role: "tab",
    "aria-selected": reiter === r.k,
    className: 'pl-reiter-knopf' + (reiter === r.k ? ' an' : ''),
    onClick: () => setReiter(r.k)
  }, r.l, " \xB7 ", r.n))), dm && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein pl-neu-zeile",
    onClick: () => onNeu(reiter)
  }, "\uFF0B ", reiter === 'quest' ? 'Quest' : reiter === 'hinweis' ? 'Gerücht oder Hinweis' : 'Fraktion'), /*#__PURE__*/React.createElement("ul", null, eintraege.map(o => /*#__PURE__*/React.createElement("li", {
    key: o.id,
    className: 'pl-eintrag' + (o.id === wahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onWahl(o)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, o.art === 'quest' ? questStatus(o.status).zeichen : o.art === 'hinweis' ? (HINWEIS_ARTEN.find(h => h.k === o.artDesWissens) || HINWEIS_ARTEN[0]).zeichen : /*#__PURE__*/React.createElement("span", {
    className: "pl-farbpunkt",
    style: {
      background: o.farbe
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !o.sichtbar ? ' pl-verborgen-text' : '') + (o.status === 'erledigt' || o.status === 'gescheitert' ? ' pl-durch' : '')
  }, o.art === 'hinweis' ? o.text || 'Ohne Text' : o.titel || o.name || 'Ohne Namen'), o.art === 'quest' && questFortschritt(o).alle > 0 && /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, questFortschritt(o).fertig, "/", questFortschritt(o).alle), o.art === 'fraktion' && /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, rufText(o.ruf)))))));
};
const OrtWahl = ({
  wert,
  orte,
  onWert,
  label
}) => /*#__PURE__*/React.createElement("label", null, label, /*#__PURE__*/React.createElement("select", {
  className: "pl-feld",
  value: wert || '',
  onChange: e => onWert(e.target.value)
}, /*#__PURE__*/React.createElement("option", {
  value: ""
}, "\u2014 keiner \u2014"), orte.map(o => /*#__PURE__*/React.createElement("option", {
  key: o.id,
  value: o.id
}, o.name))));
const GeschichteTafel = ({
  eintrag,
  dm,
  orte,
  quests,
  regionen,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onOrt
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(eintrag);
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const setzeDm = (feld, wert) => setEntwurf(e => ({
    ...e,
    dm: {
      ...(e.dm || {}),
      [feld]: wert
    }
  }));
  const e = dm ? entwurf : eintrag;
  const ort = orte.find(o => o.id === (e.zielOrt || e.ortId));
  const symbol = e.art === 'quest' ? '❗' : e.art === 'hinweis' ? '🔎' : '⚑';
  const titel = e.art === 'hinweis' ? (HINWEIS_ARTEN.find(h => h.k === e.artDesWissens) || HINWEIS_ARTEN[0]).l : e.titel || e.name || 'Ohne Namen';
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": titel
    }, /*#__PURE__*/React.createElement(TafelKopf, {
      symbol: symbol,
      titel: titel,
      onSchliessen: onSchliessen
    }), e.art === 'quest' && /*#__PURE__*/React.createElement("p", {
      className: "pl-sicht an"
    }, questStatus(e.status).zeichen, " ", questStatus(e.status).l), e.art === 'quest' && e.auftraggeber && /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "Auftraggeber: ", e.auftraggeber), e.art === 'fraktion' && /*#__PURE__*/React.createElement("p", {
      className: "pl-sicht an"
    }, "Ruf: ", rufText(e.ruf)), e.text && /*#__PURE__*/React.createElement("p", {
      className: "pl-ort-text"
    }, e.text), e.art === 'quest' && (e.schritte || []).length > 0 && /*#__PURE__*/React.createElement("ul", {
      className: "pl-schritte"
    }, e.schritte.map((s, i) => /*#__PURE__*/React.createElement("li", {
      key: i,
      className: s.erledigt ? 'pl-durch' : ''
    }, s.erledigt ? '☑' : '☐', " ", s.text))), e.art === 'quest' && e.belohnung && /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "Belohnung: ", e.belohnung), e.art === 'hinweis' && e.bekanntSeit && /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "Bekannt seit: ", e.bekanntSeit), ort && /*#__PURE__*/React.createElement("button", {
      className: "pl-knopf pl-klein",
      onClick: () => onOrt(ort)
    }, "\uD83D\uDCCD ", ort.name));
  }
  const notizFeld = /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: ev => setzeDm('notiz', ev.target.value)
  }));
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Bearbeiten: ' + titel
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: symbol,
    titel: titel,
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: ev => {
      ev.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, e.art === 'quest' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", null, "Titel", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.titel || '',
    maxLength: 120,
    onChange: ev => setze('titel', ev.target.value)
  })), /*#__PURE__*/React.createElement("label", null, "Stand", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.status || 'offen',
    onChange: ev => setze('status', ev.target.value)
  }, QUEST_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.k,
    value: s.k
  }, s.zeichen, " ", s.l)))), /*#__PURE__*/React.createElement("label", null, "Auftraggeber", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.auftraggeber || '',
    maxLength: 120,
    onChange: ev => setze('auftraggeber', ev.target.value)
  })), /*#__PURE__*/React.createElement(OrtWahl, {
    label: "Wohin",
    wert: entwurf.zielOrt,
    orte: orte,
    onWert: v => setze('zielOrt', v)
  }), /*#__PURE__*/React.createElement("label", null, "Was die Spieler wissen", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 3,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: ev => setze('text', ev.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-schritte-edit"
  }, (entwurf.schritte || []).map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!s.erledigt,
    "aria-label": 'Schritt ' + (i + 1) + ' erledigt',
    onChange: ev => setze('schritte', entwurf.schritte.map((x, j) => j === i ? {
      ...x,
      erledigt: ev.target.checked
    } : x))
  }), /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-breit-feld",
    value: s.text,
    maxLength: 200,
    "aria-label": 'Schritt ' + (i + 1),
    onChange: ev => setze('schritte', entwurf.schritte.map((x, j) => j === i ? {
      ...x,
      text: ev.target.value
    } : x))
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-symbol pl-symbol-weg",
    "aria-label": 'Schritt ' + (i + 1) + ' entfernen',
    onClick: () => setze('schritte', entwurf.schritte.filter((_, j) => j !== i))
  }, "\u2715"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setze('schritte', [...(entwurf.schritte || []), {
      text: '',
      erledigt: false
    }])
  }, "\uFF0B Schritt")), /*#__PURE__*/React.createElement("label", null, "Belohnung", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.belohnung || '',
    maxLength: 200,
    onChange: ev => setze('belohnung', ev.target.value)
  }))), e.art === 'hinweis' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", null, "Art", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.artDesWissens || 'geruecht',
    onChange: ev => setze('artDesWissens', ev.target.value)
  }, HINWEIS_ARTEN.map(h => /*#__PURE__*/React.createElement("option", {
    key: h.k,
    value: h.k
  }, h.zeichen, " ", h.l)))), /*#__PURE__*/React.createElement("label", null, "Was man h\xF6rt", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 3,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: ev => setze('text', ev.target.value)
  })), /*#__PURE__*/React.createElement(OrtWahl, {
    label: "Geh\xF6rt zu Ort",
    wert: entwurf.ortId,
    orte: orte,
    onWert: v => setze('ortId', v)
  }), /*#__PURE__*/React.createElement("label", null, "Geh\xF6rt zu Quest", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: entwurf.questId || '',
    onChange: ev => setze('questId', ev.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keiner \u2014"), quests.map(q => /*#__PURE__*/React.createElement("option", {
    key: q.id,
    value: q.id
  }, q.titel)))), /*#__PURE__*/React.createElement("label", null, "Stimmt es?", /*#__PURE__*/React.createElement("select", {
    className: "pl-feld pl-dm-feld",
    value: entwurf.dm && entwurf.dm.wahr || 'wahr',
    onChange: ev => setzeDm('wahr', ev.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "wahr"
  }, "Ja"), /*#__PURE__*/React.createElement("option", {
    value: "teils"
  }, "Zum Teil"), /*#__PURE__*/React.createElement("option", {
    value: "falsch"
  }, "Nein"))), /*#__PURE__*/React.createElement("label", null, "Bekannt seit", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.bekanntSeit || '',
    placeholder: "z. B. Sitzung 12",
    maxLength: 60,
    onChange: ev => setze('bekanntSeit', ev.target.value)
  }))), e.art === 'fraktion' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: ev => setze('name', ev.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile",
    role: "radiogroup",
    "aria-label": "Farbe"
  }, REGION_FARBEN.map(f => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: f,
    role: "radio",
    "aria-checked": entwurf.farbe === f,
    "aria-label": 'Farbe ' + f,
    className: 'pl-farbwahl' + (entwurf.farbe === f ? ' an' : ''),
    style: {
      background: f
    },
    onClick: () => setze('farbe', f)
  }))), /*#__PURE__*/React.createElement("label", null, "Ruf der Gruppe: ", /*#__PURE__*/React.createElement("strong", null, rufText(entwurf.ruf)), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -3,
    max: 3,
    step: 1,
    value: Math.round(+entwurf.ruf || 0),
    onChange: ev => setze('ruf', +ev.target.value),
    "aria-label": "Ruf"
  })), /*#__PURE__*/React.createElement("label", null, "Was die Spieler wissen", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld",
    rows: 3,
    value: entwurf.text || '',
    maxLength: 20000,
    onChange: ev => setze('text', ev.target.value)
  })), /*#__PURE__*/React.createElement("fieldset", {
    className: "pl-empfaenger"
  }, /*#__PURE__*/React.createElement("legend", null, "Einfluss in"), regionen.map(r => /*#__PURE__*/React.createElement("label", {
    key: r.id,
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: (entwurf.regionen || []).includes(r.id),
    onChange: () => setze('regionen', (entwurf.regionen || []).includes(r.id) ? entwurf.regionen.filter(x => x !== r.id) : [...(entwurf.regionen || []), r.id])
  }), /*#__PURE__*/React.createElement("span", null, r.name))), !regionen.length && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Noch keine Region gezeichnet.")), /*#__PURE__*/React.createElement("label", null, "Ziele", /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.ziele || '',
    maxLength: 20000,
    onChange: ev => setzeDm('ziele', ev.target.value)
  }))), notizFeld, /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: ev => setze('sichtbar', ev.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, e.art === 'hinweis' ? 'Die Spieler wissen es' : 'Für Spieler sichtbar')), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(eintrag)
  }, "L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !geaendert,
    onClick: () => setEntwurf(eintrag)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein",
    disabled: !geaendert
  }, "Speichern"))));
};

// ── Hexfelder ────────────────────────────────────────────────────
const HexEinstellung = ({
  karte,
  onSpeichern
}) => {
  const h = karte.hex || {};
  const einh = karte.massstab ? einheit(karte.massstab.einheit).kurz : '';
  if (!karte.massstab) return /*#__PURE__*/React.createElement("span", {
    className: "pl-leise pl-klein-text"
  }, "Hexfelder brauchen einen Ma\xDFstab.");
  return /*#__PURE__*/React.createElement("span", {
    className: "pl-hex-steuer"
  }, /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!h.an,
    onChange: e => onSpeichern({
      ...h,
      an: e.target.checked,
      groesse: h.groesse || 10
    })
  }), /*#__PURE__*/React.createElement("span", null, "\u2B21 Hexfelder")), h.an && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, "je Feld ", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-zahl-klein",
    type: "number",
    min: 0.1,
    step: "any",
    value: h.groesse || 10,
    onChange: e => onSpeichern({
      ...h,
      groesse: Math.max(0.1, +e.target.value || 10)
    })
  }), " ", einh), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!h.spieler,
    onChange: e => onSpeichern({
      ...h,
      spieler: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("span", null, "auch f\xFCr Spieler"))));
};

// ==== planer/src/3f-gruppe.jsx ====
// ── Heldengruppen: die Tafel ─────────────────────────────────────
// Rechnung in 1g-gruppe.jsx. Nur die Spielleitung setzt, zieht, teilt und
// vereint; Spieler sehen die Gruppe und — wenn freigegeben — ihre Spur.

const SPUR_WORTE = {
  start: 'Aufbruch',
  zug: 'gezogen',
  reise: 'Reise',
  teilung: 'geteilt',
  vereint: 'vereint'
};
const PlanerGruppenListe = ({
  gruppen,
  wahl,
  dm,
  onWahl
}) => {
  if (!gruppen.length) return null;
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Heldengruppen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-liste-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "Heldengruppen \xB7 ", gruppen.length)), /*#__PURE__*/React.createElement("ul", null, gruppen.map(g => /*#__PURE__*/React.createElement("li", {
    key: g.id,
    className: 'pl-eintrag' + (g.id === wahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onWahl(g)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, g.symbol || '🛡'), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !g.sichtbar ? ' pl-verborgen-text' : '')
  }, g.name), /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, (g.helden || []).length))))));
};
const GruppeTafel = ({
  gruppe,
  dm,
  karte,
  helden,
  gruppen,
  zieht,
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onZiehenWaehlen,
  onZuruecknehmen,
  onTeilen,
  onVereinen
}) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(gruppe);
  const [teilen, setTeilen] = useState(null); // ausgewaehlte Helden fuer eine neue Gruppe
  const [mit, setMit] = useState('');
  const setze = (feld, wert) => setEntwurf(e => ({
    ...e,
    [feld]: wert
  }));
  const m = karte.massstab;
  const einh = m ? einheit(m.einheit).kurz : '';
  const spur = gruppe.spur || [];
  const namen = entwurf.heldenNamen || {};
  const laenge = spurLaenge(gruppe, m);
  if (!dm) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "pl-tafel",
      "aria-label": 'Heldengruppe: ' + gruppe.name
    }, /*#__PURE__*/React.createElement(TafelKopf, {
      symbol: gruppe.symbol || '🛡',
      titel: gruppe.name,
      onSchliessen: onSchliessen
    }), /*#__PURE__*/React.createElement("p", null, (gruppe.helden || []).map(h => (gruppe.heldenNamen || {})[h] || '?').join(', ') || 'Niemand'), spur.length > 1 && m && /*#__PURE__*/React.createElement("p", {
      className: "pl-leise"
    }, "Bisher ", laengeText(laenge, m.einheit), " unterwegs, seit ", zeitText(spur[0].zeit), "."));
  }
  const andere = (gruppen || []).filter(g => g.id !== gruppe.id);
  const umHeld = h => setEntwurf(e => {
    const drin = (e.helden || []).includes(h.id);
    const liste = drin ? e.helden.filter(x => x !== h.id) : [...(e.helden || []), h.id];
    return {
      ...e,
      helden: liste,
      heldenNamen: {
        ...(e.heldenNamen || {}),
        [h.id]: h.name
      }
    };
  });
  const vergeben = h => andere.find(g => (g.helden || []).includes(h.id));
  return /*#__PURE__*/React.createElement("aside", {
    className: "pl-tafel",
    "aria-label": 'Heldengruppe bearbeiten: ' + gruppe.name
  }, /*#__PURE__*/React.createElement(TafelKopf, {
    symbol: entwurf.symbol || '🛡',
    titel: entwurf.name || 'Heldengruppe',
    onSchliessen: onSchliessen
  }), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'pl-knopf pl-klein pl-haupt' + (zieht ? ' an' : ''),
    disabled: geaendert,
    title: geaendert ? 'Erst speichern' : 'Oder die Marke auf der Karte ziehen',
    onClick: onZiehenWaehlen
  }, "\uD83D\uDCCD Hierhin ziehen \u2026"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: spur.length < 2 || geaendert,
    onClick: onZuruecknehmen,
    title: "Der Nebel bleibt, wo er schon gewichen ist"
  }, "\u21B6 Letzten Zug zur\xFCck")), !nebelVon(karte).an ? /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Auf dieser Karte liegt kein Nebel \u2014 die Gruppe hinterl\xE4sst nur ihre Spur.") : !m ? /*#__PURE__*/React.createElement("p", {
    className: "pl-warnung"
  }, "Ohne Ma\xDFstab weicht der Nebel nicht; die Sichtweite braucht eine Einheit.") : nebelFolgt(nebelVon(karte)) ? /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Der Nebel folgt der Gruppe: klar ist, was sie gerade sieht", nebelVon(karte).modus === 'daemmrig' ? ', wo sie war, bleibt es dämmrig' : '', ".", !gruppe.sichtbar ? ' Solange sie verborgen ist, sieht sie für die Spieler nichts.' : '') : null, /*#__PURE__*/React.createElement("form", {
    className: "pl-formular",
    onSubmit: e => {
      e.preventDefault();
      if (geaendert) onSpeichern(entwurf);
    }
  }, /*#__PURE__*/React.createElement("label", null, "Name", /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    value: entwurf.name || '',
    maxLength: 120,
    onChange: e => setze('name', e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "pl-symbole",
    role: "radiogroup",
    "aria-label": "Zeichen"
  }, GRUPPE_SYMBOLE.map(s => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: s,
    role: "radio",
    "aria-checked": entwurf.symbol === s,
    className: 'pl-symbolwahl' + (entwurf.symbol === s ? ' an' : ''),
    onClick: () => setze('symbol', s)
  }, s))), /*#__PURE__*/React.createElement("fieldset", {
    className: "pl-empfaenger"
  }, /*#__PURE__*/React.createElement("legend", null, "Wer dabei ist"), (helden || []).map(h => {
    const woanders = vergeben(h);
    return /*#__PURE__*/React.createElement("label", {
      key: h.id,
      className: "pl-schalter"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: (entwurf.helden || []).includes(h.id),
      disabled: !!woanders,
      onChange: () => umHeld(h)
    }), /*#__PURE__*/React.createElement("span", null, h.npc ? nscZeichen(h) + ' ' : '', h.name, h.npc ? ' · NSC, ' + (h.haltung === 'feindlich' ? 'feindlich' : 'freundlich') : h.nurDm ? ' (nur Spielleitung)' : '', woanders ? ' — in „' + woanders.name + '“' : ''));
  }), helden === null && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "Die B\xF6gen werden geladen \u2026"), helden && !helden.length && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, "In diesem Abenteuer gibt es noch keinen Bogen.")), /*#__PURE__*/React.createElement("label", null, "Sichtweite", einh ? ' (' + einh + ')' : '', /*#__PURE__*/React.createElement("input", {
    className: "pl-feld",
    type: "number",
    min: 0,
    step: "any",
    value: entwurf.sichtweite ?? 0,
    title: "So weit weicht der Nebel um die Gruppe; 0 hei\xDFt gar nicht",
    onChange: e => setze('sichtweite', Math.max(0, +e.target.value || 0))
  })), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.sichtbar,
    onChange: e => setze('sichtbar', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "Spieler sehen die Gruppe")), /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!entwurf.spurFuerSpieler,
    onChange: e => setze('spurFuerSpieler', e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "Spieler sehen die Spur")), /*#__PURE__*/React.createElement("label", null, "Notiz der Spielleitung ", /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "\u2014 sehen Spieler nie"), /*#__PURE__*/React.createElement("textarea", {
    className: "pl-feld pl-dm-feld",
    rows: 2,
    value: entwurf.dm && entwurf.dm.notiz || '',
    maxLength: 20000,
    onChange: e => setEntwurf(v => ({
      ...v,
      dm: {
        ...(v.dm || {}),
        notiz: e.target.value
      }
    }))
  })), geaendert && /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setEntwurf(gruppe)
  }, "Verwerfen"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "pl-knopf pl-haupt pl-klein"
  }, "Speichern"))), /*#__PURE__*/React.createElement("h3", {
    className: "pl-unterkopf"
  }, "Spur"), /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-klein-text"
  }, spur.length, " ", spur.length === 1 ? 'Punkt' : 'Punkte', m && spur.length > 1 ? ' · ' + laengeText(laenge, m.einheit) : ''), /*#__PURE__*/React.createElement("ol", {
    className: "pl-spur-liste"
  }, spur.slice(-6).reverse().map((p, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", null, zeitText(p.zeit)), /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, SPUR_WORTE[p.art] || p.art || '')))), (gruppe.helden || []).length > 1 && (teilen === null ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: geaendert,
    onClick: () => setTeilen([])
  }, "\u2702 Gruppe aufteilen \u2026") : /*#__PURE__*/React.createElement("div", {
    className: "pl-teilen"
  }, /*#__PURE__*/React.createElement("p", {
    className: "pl-klein-text"
  }, "Wer zieht als eigene Gruppe los?"), (gruppe.helden || []).map(h => /*#__PURE__*/React.createElement("label", {
    key: h,
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: teilen.includes(h),
    onChange: () => setTeilen(t => t.includes(h) ? t.filter(x => x !== h) : [...t, h])
  }), /*#__PURE__*/React.createElement("span", null, namen[h] || h))), /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: () => setTeilen(null)
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein pl-haupt",
    disabled: !teilen.length || teilen.length === gruppe.helden.length,
    onClick: () => {
      onTeilen(gruppe, teilen);
      setTeilen(null);
    }
  }, "Abteilen")))), andere.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pl-zeile"
  }, /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: mit,
    onChange: e => setMit(e.target.value),
    "aria-label": "Vereinen mit"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 vereinen mit \u2014"), andere.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.id,
    value: g.id
  }, g.name))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    disabled: !mit || geaendert,
    onClick: () => {
      const q = andere.find(g => g.id === mit);
      if (q) onVereinen(gruppe, q);
      setMit('');
    }
  }, "\u2935 Vereinen")), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-gefahr pl-klein",
    onClick: () => onLoeschen(gruppe)
  }, "Gruppe l\xF6schen")));
};

// ==== planer/src/4-app.jsx ====
// ── Abenteuerplaner: die Seite ───────────────────────────────────
// Wer bin ich, welches Abenteuer, welche Karten — und auf der Karte das
// Bild, die Orte, Lineal und Maßstab. Dazu das Paket hinaus und wieder
// hinein.
//
// Die Wege nach draussen stehen in planer/index.html (planerApi,
// planerDateiHolen, planerDateiUrl, planerSpeichern, planerZugang),
// damit dev/planer-echt.html dieselbe Seite gegen ein Gedaechtnis fahren
// kann.

const PLANER_ADV_SPEICHER = 'hb_planer_adv';
const PLANER_ABGLEICH_MS = 15000;
const PLANER_ABGLEICH_SPIELER_MS = 5000;
const PLANER_GESEHEN = 'hb_planer_gesehen_';
const planerAdvAnfang = liste => {
  const ids = liste.map(a => a.id);
  let ausAdresse = '';
  try {
    ausAdresse = new URLSearchParams(location.search).get('adv') || '';
  } catch (e) {/* ohne Adresse */}
  const gemerkt = (() => {
    try {
      return localStorage.getItem(PLANER_ADV_SPEICHER) || localStorage.getItem('hb_adventure') || '';
    } catch (e) {
      return '';
    }
  })();
  return [ausAdresse, gemerkt].find(id => id && ids.includes(id)) || ids[0] || '';
};
const PlanerNichtAngemeldet = () => /*#__PURE__*/React.createElement("div", {
  className: "pl-leer-seite"
}, /*#__PURE__*/React.createElement("div", {
  className: "pl-karte-leer"
}, /*#__PURE__*/React.createElement("div", {
  className: "pl-marke"
}, "\uD83D\uDDFA Abenteuerplaner"), /*#__PURE__*/React.createElement("h1", null, "Bitte zuerst im Heldenbuch anmelden"), /*#__PURE__*/React.createElement("p", null, "Der Planer benutzt dieselbe Anmeldung und dieselbe Gruppe wie das Heldenbuch. Melde dich dort an und \xF6ffne den Planer dann wieder."), /*#__PURE__*/React.createElement("a", {
  className: "pl-knopf pl-haupt",
  href: "../"
}, "\u2694 Zum Heldenbuch")));
const PlanerFrage = ({
  frage,
  onZu
}) => /*#__PURE__*/React.createElement("div", {
  className: "pl-schleier",
  onClick: onZu
}, /*#__PURE__*/React.createElement("div", {
  className: "pl-dialog",
  role: "dialog",
  "aria-modal": "true",
  onClick: e => e.stopPropagation()
}, /*#__PURE__*/React.createElement("h2", null, frage.titel), /*#__PURE__*/React.createElement("p", null, frage.text), /*#__PURE__*/React.createElement("div", {
  className: "pl-dialog-knoepfe"
}, /*#__PURE__*/React.createElement("button", {
  className: "pl-knopf",
  onClick: onZu
}, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
  className: 'pl-knopf ' + (frage.gefahr ? 'pl-gefahr' : 'pl-haupt'),
  onClick: () => {
    onZu();
    frage.onJa();
  }
}, frage.ja))));
const PlanerArbeit = ({
  arbeit,
  onAbbrechen
}) => /*#__PURE__*/React.createElement("div", {
  className: "pl-schleier"
}, /*#__PURE__*/React.createElement("div", {
  className: "pl-dialog",
  role: "status",
  "aria-live": "polite"
}, /*#__PURE__*/React.createElement("h2", null, arbeit.titel), /*#__PURE__*/React.createElement("p", {
  className: "pl-arbeit-text"
}, arbeit.text || '…'), /*#__PURE__*/React.createElement("div", {
  className: "pl-balken"
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: Math.round((arbeit.anteil || 0) * 100) + '%'
  }
})), arbeit.abbrechbar && /*#__PURE__*/React.createElement("div", {
  className: "pl-dialog-knoepfe"
}, /*#__PURE__*/React.createElement("button", {
  className: "pl-knopf",
  onClick: onAbbrechen,
  disabled: arbeit.abbruch
}, arbeit.abbruch ? 'Wird abgebrochen …' : 'Abbrechen'))));
const PlanerImportVorschau = ({
  vorschau,
  onEinspielen,
  onZu
}) => {
  const m = vorschau.paket.manifest;
  const erstellt = (() => {
    const d = new Date(m.erstellt);
    return isNaN(d) ? '' : d.toLocaleString('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  })();
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-schleier",
    onClick: onZu
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog pl-import",
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", null, "Paket einspielen"), /*#__PURE__*/React.createElement("div", {
    className: "pl-datei"
  }, vorschau.dateiname), /*#__PURE__*/React.createElement("dl", {
    className: "pl-fakten"
  }, m.abenteuer && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Aus dem Abenteuer"), /*#__PURE__*/React.createElement("dd", null, m.abenteuer.name)), erstellt && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Erstellt"), /*#__PURE__*/React.createElement("dd", null, erstellt)), /*#__PURE__*/React.createElement("dt", null, "Karten"), /*#__PURE__*/React.createElement("dd", null, m.karten.length), /*#__PURE__*/React.createElement("dt", null, "Eintr\xE4ge"), /*#__PURE__*/React.createElement("dd", null, m.objekte.length), /*#__PURE__*/React.createElement("dt", null, "Dateien"), /*#__PURE__*/React.createElement("dd", null, m.dateien.length, " \xB7 ", planGroesse(vorschau.paket.bytes))), m.karten.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "pl-import-karten"
  }, m.karten.slice(0, 8).map(k => /*#__PURE__*/React.createElement("li", {
    key: k.id
  }, k.name)), m.karten.length > 8 && /*#__PURE__*/React.createElement("li", {
    className: "pl-leise"
  }, "\u2026 und ", m.karten.length - 8, " weitere")), /*#__PURE__*/React.createElement("p", {
    className: "pl-hinweis"
  }, "Alles wird zus\xE4tzlich angelegt, nichts Vorhandenes wird \xFCberschrieben. Neue Karten sind f\xFCr Spieler zun\xE4chst so sichtbar, wie sie im Paket stehen."), /*#__PURE__*/React.createElement("div", {
    className: "pl-dialog-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf",
    onClick: onZu
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-haupt",
    onClick: onEinspielen
  }, "Einspielen"))));
};
const PlanerKartenListe = ({
  karten,
  auswahl,
  dm,
  onWahl,
  onNeu,
  onUmbenennen,
  onSichtbar,
  onLoeschen
}) => {
  const [neuName, setNeuName] = useState(null);
  const [umName, setUmName] = useState(null); // {id, name}
  const neuAbschicken = () => {
    const n = (neuName || '').trim();
    if (n) onNeu(n);
    setNeuName(null);
  };
  const umAbschicken = () => {
    if (umName && umName.name.trim()) onUmbenennen(umName.id, umName.name.trim());
    setUmName(null);
  };
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Karten"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-liste-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "Karten"), dm && neuName === null && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => setNeuName('')
  }, "\uFF0B Neue Karte")), neuName !== null && /*#__PURE__*/React.createElement("form", {
    className: "pl-neu",
    onSubmit: e => {
      e.preventDefault();
      neuAbschicken();
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    className: "pl-feld",
    placeholder: "Name der Karte",
    value: neuName,
    maxLength: 120,
    onChange: e => setNeuName(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Escape') setNeuName(null);
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein pl-haupt",
    type: "submit"
  }, "Anlegen")), karten.length === 0 && neuName === null && /*#__PURE__*/React.createElement("p", {
    className: "pl-leise pl-liste-leer"
  }, dm ? 'Noch keine Karte. Leg eine an oder spiel ein Paket ein.' : 'Die Spielleitung hat noch keine Karte freigegeben.'), /*#__PURE__*/React.createElement("ul", null, karten.map(k => /*#__PURE__*/React.createElement("li", {
    key: k.id,
    className: 'pl-eintrag' + (k.id === auswahl ? ' aktiv' : '')
  }, umName && umName.id === k.id ? /*#__PURE__*/React.createElement("form", {
    className: "pl-neu",
    onSubmit: e => {
      e.preventDefault();
      umAbschicken();
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    className: "pl-feld",
    value: umName.name,
    maxLength: 120,
    onChange: e => setUmName({
      id: k.id,
      name: e.target.value
    }),
    onKeyDown: e => {
      if (e.key === 'Escape') setUmName(null);
    },
    onBlur: umAbschicken
  })) : /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onWahl(k.id),
    "aria-current": k.id === auswahl
  }, k.bild && k.bild.vorschau ? /*#__PURE__*/React.createElement("img", {
    className: "pl-vorschau",
    src: planerDateiUrl(k.ablage, k.bild.vorschau),
    alt: "",
    loading: "lazy"
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pl-vorschau pl-vorschau-leer",
    "aria-hidden": "true"
  }, "\uD83D\uDDFA"), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !k.sichtbar ? ' pl-verborgen-text' : ''),
    title: dm && !k.sichtbar ? k.name + ' — für Spieler verborgen' : k.name
  }, k.name)), dm && !(umName && umName.id === k.id) && /*#__PURE__*/React.createElement("span", {
    className: "pl-eintrag-knoepfe"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    title: k.sichtbar ? 'Für Spieler verbergen' : 'Für Spieler sichtbar machen',
    "aria-label": k.sichtbar ? 'Verbergen' : 'Sichtbar machen',
    "aria-pressed": !!k.sichtbar,
    onClick: () => onSichtbar(k)
  }, k.sichtbar ? '👁' : '◌'), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    title: "Umbenennen",
    "aria-label": "Umbenennen",
    onClick: () => setUmName({
      id: k.id,
      name: k.name
    })
  }, "\u270E"), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol pl-symbol-weg",
    title: "L\xF6schen",
    "aria-label": "L\xF6schen",
    onClick: () => onLoeschen(k)
  }, "\uD83D\uDDD1"))))));
};
const PlanerOrtListe = ({
  orte,
  auswahl,
  dm,
  onWahl
}) => {
  const [suche, setSuche] = useState('');
  if (!orte.length) return null;
  const s = suche.trim().toLowerCase();
  const liste = orte.filter(o => !s || String(o.name || '').toLowerCase().includes(s)).sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Orte auf dieser Karte"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-liste-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "Orte \xB7 ", orte.length)), orte.length > 6 && /*#__PURE__*/React.createElement("input", {
    className: "pl-feld pl-suche",
    placeholder: "Ort suchen",
    value: suche,
    onChange: e => setSuche(e.target.value)
  }), /*#__PURE__*/React.createElement("ul", null, liste.map(o => /*#__PURE__*/React.createElement("li", {
    key: o.id,
    className: 'pl-eintrag' + (o.id === auswahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onWahl(o)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, o.symbol || '📍'), /*#__PURE__*/React.createElement("span", {
    className: "pl-eintrag-text"
  }, o.name), dm && !o.sichtbar && /*#__PURE__*/React.createElement("span", {
    className: "pl-marke-verborgen"
  }, "verborgen"))))));
};
const PlanerWegListe = ({
  routen,
  reisen,
  routeWahl,
  reiseWahl,
  dm,
  onRouteWahl,
  onReiseWahl
}) => {
  if (!routen.length) return null;
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Routen und Reisen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-liste-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "Routen \xB7 ", routen.length)), /*#__PURE__*/React.createElement("ul", null, routen.map(r => /*#__PURE__*/React.createElement(React.Fragment, {
    key: r.id
  }, /*#__PURE__*/React.createElement("li", {
    className: 'pl-eintrag' + (r.id === routeWahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onRouteWahl(r.id)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\uD83D\uDEE4"), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !r.sichtbar ? ' pl-verborgen-text' : '')
  }, r.name))), reisen.filter(j => j.routeId === r.id).map(j => /*#__PURE__*/React.createElement("li", {
    key: j.id,
    className: 'pl-eintrag pl-eintrag-unter' + (j.id === reiseWahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onReiseWahl(j.id)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\uD83E\uDDED"), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !j.sichtbar ? ' pl-verborgen-text' : '')
  }, j.name), (j.tagebuch || []).length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "Tag ", (j.tagebuch || []).length))))))));
};
const PlanerRegionListe = ({
  regionen,
  regionWahl,
  dm,
  onWahl
}) => {
  if (!regionen.length) return null;
  return /*#__PURE__*/React.createElement("nav", {
    className: "pl-liste",
    "aria-label": "Regionen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-liste-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "Regionen \xB7 ", regionen.length)), /*#__PURE__*/React.createElement("ul", null, regionen.map(r => /*#__PURE__*/React.createElement("li", {
    key: r.id,
    className: 'pl-eintrag' + (r.id === regionWahl ? ' aktiv' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "pl-eintrag-name",
    onClick: () => onWahl(r)
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-farbpunkt",
    style: {
      background: r.farbe || REGION_FARBEN[0]
    },
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: 'pl-eintrag-text' + (dm && !r.sichtbar ? ' pl-verborgen-text' : '')
  }, r.name), dm && r.dm && r.dm.tabelle && /*#__PURE__*/React.createElement("span", {
    className: "pl-leise",
    title: "Mit Begegnungstabelle"
  }, "\uD83C\uDFB2"))))));
};

// Offline: der letzte Stand liegt im Browser. Ist der Server nicht zu
// erreichen, zeigt der Planer ihn — lesen geht, schreiben erst wieder mit Netz.
const offlineMerken = (schluessel, wert) => {
  try {
    localStorage.setItem(OFFLINE_SPEICHER + schluessel, offlineStand(null, wert));
  } catch (e) {/* zu gross oder kein Speicher */}
};
const offlineHolen = schluessel => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_SPEICHER + schluessel) || 'null');
  } catch (e) {
    return null;
  }
};
const istNetzFehler = e => /nicht erreichbar/.test(String(e && e.message || ''));
const WERKZEUG_HINWEIS = {
  gruppe: 'Klicke, wo die Heldengruppe steht. Dabei sind alle Bögen des Abenteuers, die noch keiner Gruppe angehören.',
  gruppeZiehen: 'Klicke, wohin die Gruppe zieht. Der Nebel weicht entlang des Wegs.',
  figur: 'Klicke, wo die Figur zur eingestellten Zeit steht.',
  wegpunkt: 'Klicke, wo die Figur zur eingestellten Zeit sein soll.',
  nebel: 'Klicke, wo der Nebel weichen soll.',
  region: 'Klicke die Eckpunkte der Region. Die Fläche schließt sich von selbst.',
  route: 'Klicke Punkt für Punkt den Weg. Das Gelände je Abschnitt stellst du danach ein.',
  ort: 'Klicke auf die Karte, wo der neue Ort liegen soll.',
  massstab: 'Klicke zwei Punkte, deren Entfernung du kennst — zum Beispiel die Enden der Maßstabsleiste der Karte.',
  lineal: 'Klicke Punkt für Punkt eine Strecke.'
};
const PlanerApp = () => {
  const zugang = planerZugang();
  const angemeldet = !!(zugang.token && zugang.code);
  const [start, setStart] = useState(null);
  const [advId, setAdvId] = useState('');
  const [daten, setDaten] = useState(null);
  const [auswahl, setAuswahl] = useState('');
  const [verlauf, setVerlauf] = useState([]);
  const [dateien, setDateien] = useState(null);
  const [meldung, setMeldung] = useState(null);
  const [frage, setFrage] = useState(null);
  const [arbeit, setArbeit] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const [werkzeug, setWerkzeug] = useState('ansehen');
  const [punkte, setPunkte] = useState([]);
  const [massstabFrage, setMassstabFrage] = useState(null);
  const [ortWahl, setOrtWahl] = useState('');
  const [routeWahl, setRouteWahl] = useState('');
  const [reiseWahl, setReiseWahl] = useState('');
  const [regionWahl, setRegionWahl] = useState('');
  const [begegnungen, setBegegnungen] = useState(null);
  const [handoutWahl, setHandoutWahl] = useState('');
  const [lesen, setLesen] = useState(null);
  const [mitglieder, setMitglieder] = useState(null);
  const [nebelArt, setNebelArt] = useState('kreis');
  const [nebelRadius, setNebelRadius] = useState('mittel');
  const [nebelZeigen, setNebelZeigen] = useState(true);
  const [tischFolgt, setTischFolgt] = useState(false);
  const [gesehen, setGesehen] = useState([]);
  const kanal = useRef(null);
  const tischZeit = useRef(0);
  const [chronikZeit, setChronikZeit] = useState(null);
  const [figurWahl, setFigurWahl] = useState('');
  const [gruppeWahl, setGruppeWahl] = useState('');
  const [helden, setHelden] = useState(null);
  const [geschichteWahl, setGeschichteWahl] = useState('');
  const [zeitRegler, setZeitRegler] = useState(null);
  const [offline, setOffline] = useState(null);
  const ortNachWechsel = useRef('');
  const [fokus, setFokus] = useState(null);
  const standRef = useRef(0);
  const arbeitRef = useRef(false);
  const abbruchRef = useRef(false);
  const dateiEingabe = useRef(null);
  const bildEingabe = useRef(null);
  const gedaechtnis = useRef({});
  const fehler = e => setMeldung({
    art: 'fehler',
    text: e && e.message || String(e)
  });
  useEffect(() => {
    if (!angemeldet) return;
    planerApi('planer_start', {}).then(s => {
      offlineMerken('start', s);
      setStart(s);
      setAdvId(planerAdvAnfang(s.abenteuer || []));
    }).catch(e => {
      const alt = istNetzFehler(e) && offlineHolen('start');
      if (!alt) {
        fehler(e);
        return;
      }
      setOffline({
        zeit: alt.zeit
      });
      setStart(alt.daten);
      setAdvId(planerAdvAnfang(alt.daten.abenteuer || []));
    });
  }, []);
  const laden = useCallback(async id => {
    if (!id) return;
    let d;
    try {
      d = await planerApi('planer_laden', {
        adv_id: id
      });
      offlineMerken(id, d);
      setOffline(null);
    } catch (e) {
      const alt = istNetzFehler(e) && offlineHolen(id);
      if (!alt) throw e;
      d = alt.daten;
      setOffline({
        zeit: alt.zeit
      });
    }
    standRef.current = d.stand;
    setDaten(d);
    setAuswahl(a => d.karten.some(k => k.id === a) ? a : (d.karten[0] || {}).id || '');
  }, []);
  useEffect(() => {
    if (!advId) return;
    try {
      localStorage.setItem(PLANER_ADV_SPEICHER, advId);
    } catch (e) {/* ohne Speicher */}
    setDaten(null);
    setVerlauf([]);
    laden(advId).catch(fehler);
  }, [advId]);

  // Der Abgleich: nur die Zahl fragen, und nur laden, wenn sie sich bewegt.
  // Spieler fragen oefter — sie warten auf das, was die Spielleitung tut.
  const dmFuerAbgleich = !!(daten && daten.dm);
  useEffect(() => {
    if (!advId) return;
    const t = setInterval(() => {
      if (document.hidden || arbeitRef.current) return;
      planerApi('planer_stand', {
        adv_id: advId
      }).then(s => {
        if (s.stand !== standRef.current) return laden(advId);
      }).catch(() => {});
    }, dmFuerAbgleich ? PLANER_ABGLEICH_MS : PLANER_ABGLEICH_SPIELER_MS);
    return () => clearInterval(t);
  }, [advId, dmFuerAbgleich]);
  const dm = !!(daten && daten.dm);
  const karten = daten ? daten.karten : [];
  const karte = karten.find(k => k.id === auswahl) || null;
  const orte = daten && karte ? daten.objekte.filter(o => o.art === 'ort' && o.karteId === karte.id) : [];
  const ort = orte.find(o => o.id === ortWahl) || null;
  const routen = daten && karte ? daten.objekte.filter(o => o.art === 'route' && o.karteId === karte.id) : [];
  const reisen = daten && karte ? daten.objekte.filter(o => o.art === 'reise' && o.karteId === karte.id) : [];
  const regionen = daten && karte ? daten.objekte.filter(o => o.art === 'region' && o.karteId === karte.id) : [];
  const region = regionen.find(r => r.id === regionWahl) || null;
  const route = routen.find(r => r.id === routeWahl) || null;
  const reise = reisen.find(r => r.id === reiseWahl) || null;
  const reiseRoute = reise ? routen.find(r => r.id === reise.routeId) || null : null;
  // Wo jede Gruppe gerade steht.
  const gruppen = karte ? reisen.filter(j => !j.gruppeId).map(j => {
    const r = routen.find(x => x.id === j.routeId);
    if (!r) return null;
    const rr = routeInRichtung(r, j.richtung);
    return {
      id: j.id,
      name: j.name,
      sichtbar: j.sichtbar,
      punkt: karte.massstab ? punktAufRoute(rr, karte.massstab, j.pos || 0) : (rr.punkte || [])[0]
    };
  }).filter(Boolean) : [];
  // Nur eine Tafel zugleich.
  const tafelZu = () => {
    setOrtWahl('');
    setRouteWahl('');
    setReiseWahl('');
    setRegionWahl('');
    setHandoutWahl('');
    setFigurWahl('');
    setGeschichteWahl('');
    setGruppeWahl('');
  };
  const heldengruppen = daten && karte ? daten.objekte.filter(o => o.art === 'gruppe' && o.karteId === karte.id) : [];
  const heldengruppe = heldengruppen.find(g => g.id === gruppeWahl) || null;
  const figurenRoh = daten && karte ? daten.objekte.filter(o => o.art === 'figur' && o.karteId === karte.id) : [];
  const zeitSpanne = zeitBereich(figurenRoh, chronikZeit);
  const zeit = zeitRegler != null ? zeitRegler : chronikZeit != null ? chronikZeit : karte && Number.isFinite(+karte.zeit) ? +karte.zeit : zeitSpanne.min;
  const figuren = figurenRoh.map(f => ({
    ...f,
    punkt: dm ? figurPosition(f, zeit) : figurFuerSpieler(f, karte)
  }));
  const figur = figurenRoh.find(f => f.id === figurWahl) || null;
  const quests = daten ? daten.objekte.filter(o => o.art === 'quest') : [];
  const hinweise = daten ? daten.objekte.filter(o => o.art === 'hinweis') : [];
  const fraktionen = daten ? daten.objekte.filter(o => o.art === 'fraktion') : [];
  const geschichte = [...quests, ...hinweise, ...fraktionen].find(o => o.id === geschichteWahl) || null;
  const alleOrte = daten ? daten.objekte.filter(o => o.art === 'ort') : [];
  const alleRegionen = daten ? daten.objekte.filter(o => o.art === 'region') : [];
  const questOrte = new Set(quests.filter(q => q.zielOrt && q.status !== 'erledigt' && q.status !== 'gescheitert').map(q => q.zielOrt));
  const handouts = daten ? daten.objekte.filter(o => o.art === 'handout') : [];
  const handout = handouts.find(h => h.id === handoutWahl) || null;
  const nebel = nebelVon(karte);

  // Was dieser Spieler schon gelesen hat, merkt sich sein Browser.
  useEffect(() => {
    try {
      setGesehen(JSON.parse(localStorage.getItem(PLANER_GESEHEN + advId) || '[]'));
    } catch (e) {
      setGesehen([]);
    }
  }, [advId]);
  const gelesen = h => {
    const neu = [...gesehen.filter(x => !x.startsWith(h.id + ':')), handoutFassung(h)];
    setGesehen(neu);
    try {
      localStorage.setItem(PLANER_GESEHEN + advId, JSON.stringify(neu));
    } catch (e) {/* ohne Speicher */}
  };
  const ungelesen = daten && !daten.dm ? ungeseheneHandouts(handouts, gesehen) : [];

  // Der Kanal zum Tischfenster.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    kanal.current = new BroadcastChannel(TISCH_KANAL);
    return () => {
      kanal.current.close();
      kanal.current = null;
    };
  }, []);
  const anTisch = (art, inhalt) => {
    if (kanal.current) kanal.current.postMessage(tischNachricht(art, {
      advId,
      ...inhalt
    }));
  };
  const ansichtRef = useRef(null);
  const ansichtGemeldet = v => {
    ansichtRef.current = v;
    if (!tischFolgt || !karte) return;
    const jetzt = Date.now();
    if (jetzt - tischZeit.current < 250) return;
    tischZeit.current = jetzt;
    anTisch('ansicht', {
      karteId: karte.id,
      ansicht: v
    });
  };
  useEffect(() => {
    if (tischFolgt && karte) anTisch('karte', {
      karteId: karte.id,
      ansicht: ansichtRef.current
    });
  }, [tischFolgt, karte && karte.id]);
  useEffect(() => {
    if (dm) anTisch('neu', {});
  }, [daten && daten.stand]);
  const tischOeffnen = () => {
    window.open('?tisch=1&adv=' + encodeURIComponent(advId), 'hb-planer-tisch');
    setTischFolgt(true);
  };
  const waehleOrt = id => {
    if (id) tafelZu();
    setOrtWahl(id);
  };
  const waehleRoute = id => {
    if (id) tafelZu();
    setRouteWahl(id);
  };
  const waehleReise = id => {
    if (id) tafelZu();
    setReiseWahl(id);
  };
  const waehleRegion = id => {
    if (id) tafelZu();
    setRegionWahl(id);
  };
  const waehleHandout = id => {
    if (id) tafelZu();
    setHandoutWahl(id);
  };
  const waehleFigur = id => {
    if (id) tafelZu();
    setFigurWahl(id);
  };
  const waehleGruppe = id => {
    if (id) tafelZu();
    setGruppeWahl(id);
  };

  // Die Boegen des Abenteuers, fuer die Heldengruppen.
  useEffect(() => {
    setHelden(null);
    if (!dm || !advId) return;
    planerApi('planer_helden', {
      adv_id: advId
    }).then(r => setHelden(r.helden || [])).catch(() => setHelden([]));
  }, [dm, advId]);

  // Der Bogen eines NSC steht im Heldenbuch, nicht hier. Der Auftrag
  // oeffnet ihn dort — wie die Zeit, die Rast und der Kampf.
  const nscBogenOeffnen = async h => {
    const genommen = await anHeldenbuch({
      art: 'nsc',
      advId,
      charId: h.id,
      name: h.name
    });
    setMeldung(genommen ? {
      art: 'gut',
      text: '🎭 Das Heldenbuch zeigt den Bogen von ' + h.name + '.'
    } : {
      art: 'gut',
      text: '🎭 Der Auftrag wartet eine halbe Stunde. Öffne das Heldenbuch im DM-Modus.'
    });
  };

  // Eine Gruppe zieht: Spur speichern, dann den Nebel entlang des Wegs lichten.
  const gruppeBewegt = async (ergebnis, meldung) => {
    try {
      await objSpeichern(ergebnis.gruppe);
      if (nebel.an && ergebnis.kreise.length) await nebelSetzen([...nebel.flaechen, ...ergebnis.kreise]);else await laden(advId);
      if (meldung) setMeldung(meldung);
    } catch (e) {
      fehler(e);
    }
  };
  const gruppeZiehenNach = (g, p) => {
    const {
      punkt,
      ...rest
    } = g;
    return gruppeBewegt(gruppeZiehen(rest, p, zeit, karte.massstab));
  };
  const gruppeReistMit = (g, punkte, stunden, startStunde) => {
    const letzte = gruppePosition(g);
    let von = zeit;
    if (letzte && letzte.art === 'reise') von = Math.max(zeit, (Math.floor(letzte.zeit / 24) + 1) * 24 + startStunde);else if (letzte) von = Math.max(zeit, letzte.zeit);
    return gruppeBewegt(gruppeReist(g, punkte, von, stunden, karte.massstab));
  };
  const waehleGeschichte = id => {
    if (id) tafelZu();
    setGeschichteWahl(id);
  };
  // Von einer Quest zu ihrem Ort, auch auf einer anderen Karte.
  const zumOrt = o => {
    if (!o) return;
    if (o.karteId !== auswahl) {
      ortNachWechsel.current = o.id;
      setAuswahl(o.karteId);
      setVerlauf([]);
      return;
    }
    waehleOrt(o.id);
    setFokus({
      x: o.x,
      y: o.y,
      n: Date.now()
    });
  };
  const offlineBereit = async () => {
    try {
      const erg = await ausfuehren('Für offline bereithalten', async melde => {
        const liste = karten.flatMap(k => offlinePfade(k, daten.objekte));
        let n = 0,
          fehlt = 0;
        await nebenher(liste, 6, async d => {
          try {
            const r = await fetch(planerDateiUrl(d.ablage, d.pfad));
            if (!r.ok) fehlt++;
          } catch (e) {
            fehlt++;
          }
          n++;
          if (n % 20 === 0 || n === liste.length) melde(n + ' von ' + liste.length + ' Dateien', n / Math.max(1, liste.length));
        });
        return {
          anzahl: liste.length,
          fehlt
        };
      });
      const sw = typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller;
      setMeldung(sw ? {
        art: erg.fehlt ? 'fehler' : 'gut',
        text: '📥 ' + (erg.anzahl - erg.fehlt) + ' von ' + erg.anzahl + ' Dateien liegen jetzt auch ohne Netz bereit.'
      } : {
        art: 'fehler',
        text: '📥 ' + erg.anzahl + ' Dateien geladen — aber ohne Service Worker bleibt nichts liegen. Das geht nur auf der ausgelieferten Seite (https).'
      });
    } catch (e) {
      fehler(e);
    }
  };

  // Die Mitglieder der Gruppe, fuer die Empfaenger eines Handouts.
  useEffect(() => {
    if (!dm || !handoutWahl || mitglieder) return;
    planerApi('member_list', {}).then(r => setMitglieder(r.mitglieder || [])).catch(() => setMitglieder([]));
  }, [dm, handoutWahl]);

  // Die Begegnungen des Heldenbuchs, auf die Tabellen verweisen. Nur lesen.
  useEffect(() => {
    setBegegnungen(null);
    if (!dm || !advId) return;
    planerApi('dm_load_encounters', {}).then(r => {
      setBegegnungen((r.encounters || []).filter(e => e && e.id && (!e.adventure || e.adventure === advId)).map(e => ({
        id: e.id,
        name: e.name || 'Ohne Namen',
        difficulty: e.difficulty || '',
        enemies: e.enemies || []
      })));
    }).catch(() => setBegegnungen([]));
  }, [dm, advId]);

  // Die Uhr der Chronik, damit die Reise ihren Ankunftstag nennt. Nur
  // lesen: gedreht wird sie im Heldenbuch.
  useEffect(() => {
    setChronikZeit(null);
    if (!dm || !advId) return;
    planerApi('dm_load_chronik', {}).then(r => {
      const z = r.chronik && r.chronik.zeit ? r.chronik.zeit[advId] : 0;
      setChronikZeit(+z || 0);
    }).catch(() => {});
  }, [dm, advId, daten && daten.stand]);
  useEffect(() => {
    setDateien(null);
    if (!dm || !karte) return;
    let aktuell = true;
    planerApi('planer_dateien_liste', {
      adv_id: advId,
      karte_id: karte.id
    }).then(l => {
      if (aktuell) setDateien({
        anzahl: l.dateien.length,
        bytes: l.bytes
      });
    }).catch(() => {});
    return () => {
      aktuell = false;
    };
  }, [auswahl, dm, daten && daten.stand]);

  // Werkzeug und Auswahl gehoeren zur Karte.
  useEffect(() => {
    setWerkzeug('ansehen');
    setPunkte([]);
    setOrtWahl('');
    setRouteWahl('');
    setReiseWahl('');
    setRegionWahl('');
    setFigurWahl('');
    if (ortNachWechsel.current && daten) {
      const o = daten.objekte.find(x => x.id === ortNachWechsel.current);
      ortNachWechsel.current = '';
      if (o) {
        setOrtWahl(o.id);
        setFokus({
          x: o.x,
          y: o.y,
          n: Date.now()
        });
      }
    }
  }, [auswahl]);
  useEffect(() => {
    const taste = e => {
      if (e.key === 'Escape' && !frage && !massstabFrage && !arbeit) {
        setWerkzeug('ansehen');
        setPunkte([]);
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [frage, massstabFrage, arbeit]);
  const ausfuehren = async (titel, f, abbrechbar) => {
    arbeitRef.current = true;
    abbruchRef.current = false;
    setArbeit({
      titel,
      text: '',
      anteil: 0,
      abbrechbar: !!abbrechbar
    });
    try {
      return await f((text, anteil) => setArbeit(a => a && {
        ...a,
        text,
        anteil: anteil === undefined ? a.anteil : anteil
      }));
    } finally {
      arbeitRef.current = false;
      setArbeit(null);
    }
  };
  const karteSpeichern = async k => {
    const {
      ablage,
      ...ohne
    } = k;
    const r = await planerApi('planer_karte_speichern', {
      adv_id: advId,
      karte: ohne
    });
    return r.karte;
  };
  const objSpeichern = o => planerApi('planer_obj_speichern', {
    adv_id: advId,
    obj: o
  });
  const neueKarte = async name => {
    try {
      const k = await karteSpeichern({
        id: planNeueId('k'),
        name,
        sichtbar: false
      });
      await laden(advId);
      setAuswahl(k.id);
      setVerlauf([]);
    } catch (e) {
      fehler(e);
    }
  };
  const karteAendern = async (k, aenderung) => {
    try {
      await karteSpeichern({
        ...k,
        ...aenderung
      });
      await laden(advId);
    } catch (e) {
      fehler(e);
    }
  };
  const karteLoeschen = k => setFrage({
    titel: 'Karte löschen?',
    text: '„' + k.name + '“ wird mit allen Orten und Dateien gelöscht. Das lässt sich nicht rückgängig machen — wer sichergehen will, exportiert vorher.',
    ja: 'Löschen',
    gefahr: true,
    onJa: async () => {
      try {
        await planerApi('planer_karte_loeschen', {
          adv_id: advId,
          karte_id: k.id
        });
        await laden(advId);
        setMeldung({
          art: 'gut',
          text: '„' + k.name + '“ ist gelöscht.'
        });
      } catch (e) {
        fehler(e);
      }
    }
  });

  // ── Das Kartenbild ──────────────────────────────────────────────
  // Die neuen Kacheln kommen in einen neuen Ordner (b1, b2, …). Erst
  // wenn alle oben sind, zeigt die Karte darauf, und erst dann geht der
  // alte weg. Wer gerade schaut, sieht nie eine halbe Karte.
  const kartenbildSetzen = async (k, datei) => {
    const alt = k.bild || null;
    const version = (alt && alt.version || 0) + 1;
    const ordner = 'b' + version;
    let angefangen = false;
    try {
      const erg = await ausfuehren('Kartenbild', async melde => {
        melde('Bild öffnen …', 0);
        const masse = bildMasse(await dateiKopf(datei));
        const {
          bitmap,
          faktor
        } = await bildOeffnen(datei, masse);
        const plan = kachelPlan(bitmap.width, bitmap.height);
        const format = await bildFormat();
        melde(bitmap.width + ' × ' + bitmap.height + ' Pixel · ' + plan.anzahl + ' Kacheln in ' + (plan.maxZ + 1) + ' Stufen', 0);
        angefangen = true;
        const vorschauPfad = ordner + '/vorschau.' + format.endung;
        await planerApi('planer_dateien_hoch', {
          adv_id: advId,
          karte_id: k.id,
          dateien: [{
            pfad: vorschauPfad,
            daten: base64AusBytes(await bildVerkleinert(bitmap, 360, format))
          }]
        });
        const zeichne = kachelZeichner(bitmap, plan, ordner, format);
        try {
          await kachelnErzeugen({
            plan,
            zeichne,
            melde,
            abgebrochen: () => abbruchRef.current,
            hochladen: b => planerApi('planer_dateien_hoch', {
              adv_id: advId,
              karte_id: k.id,
              dateien: b.map(d => ({
                pfad: d.pfad,
                daten: base64AusBytes(d.bytes)
              }))
            })
          });
        } finally {
          zeichne.ende();
          if (bitmap.close) bitmap.close();
        }
        const bild = {
          breite: plan.breite,
          hoehe: plan.hoehe,
          kachel: plan.kachel,
          stufen: plan.maxZ,
          ordner,
          endung: format.endung,
          vorschau: vorschauPfad,
          version,
          quelle: {
            name: String(datei.name || '').slice(0, 120),
            bytes: datei.size
          },
          verkleinert: faktor < 1 ? faktor : undefined
        };
        melde('Karte umstellen …', 1);
        // Hatte die Karte schon ein Bild anderer Groesse, wandern Orte
        // und Maßstab mit.
        const anders = alt && (alt.breite !== bild.breite || alt.hoehe !== bild.hoehe);
        const massstab = anders && k.massstab ? {
          ...k.massstab,
          a: punktSkalieren(k.massstab.a, alt, bild),
          b: punktSkalieren(k.massstab.b, alt, bild)
        } : k.massstab;
        await karteSpeichern({
          ...k,
          bild,
          massstab
        });
        // Ab hier zeigt die Karte auf den neuen Ordner: er darf bei einem
        // spaeteren Fehler nicht mehr weggeraeumt werden.
        angefangen = false;
        if (anders) {
          for (const o of daten.objekte.filter(o => o.karteId === k.id && typeof o.x === 'number')) {
            await objSpeichern({
              ...o,
              ...punktSkalieren(o, alt, bild)
            });
          }
        }
        if (alt && alt.ordner && alt.ordner !== ordner) {
          await planerApi('planer_dateien_weg', {
            adv_id: advId,
            karte_id: k.id,
            praefix: alt.ordner
          }).catch(() => {});
        }
        return {
          plan,
          faktor
        };
      }, true);
      delete gedaechtnis.current[k.id + '|' + ordner];
      await laden(advId);
      setMeldung({
        art: 'gut',
        text: 'Kartenbild übernommen: ' + erg.plan.breite + ' × ' + erg.plan.hoehe + ' Pixel, ' + erg.plan.anzahl + ' Kacheln.' + (erg.faktor < 1 ? ' Der Browser konnte das Bild nicht in voller Größe öffnen; es wurde auf ' + Math.round(erg.faktor * 100) + ' % verkleinert.' : '')
      });
    } catch (e) {
      if (angefangen) planerApi('planer_dateien_weg', {
        adv_id: advId,
        karte_id: k.id,
        praefix: ordner
      }).catch(() => {});
      fehler(new Error(e.message === 'Abgebrochen.' ? 'Das Kartenbild wurde nicht übernommen (abgebrochen).' : 'Das Kartenbild wurde nicht übernommen: ' + e.message));
    }
  };
  const bildGewaehlt = ev => {
    const datei = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!datei || !karte) return;
    const k = karte;
    if (k.bild) {
      setFrage({
        titel: 'Kartenbild ersetzen?',
        ja: 'Ersetzen',
        text: 'Das neue Bild ersetzt das bisherige. Orte und Maßstab bleiben an ihrer Stelle auf der Karte — hat das neue Bild eine andere Größe, werden sie umgerechnet.',
        onJa: () => kartenbildSetzen(k, datei)
      });
    } else {
      kartenbildSetzen(k, datei);
    }
  };

  // ── Klicks auf die Karte ────────────────────────────────────────
  // ── Nebel ───────────────────────────────────────────────────────
  // Jede Aenderung wird gleich gespeichert; die Spieler sehen sie mit dem
  // naechsten Abgleich. Orte, die mit dem Nebel aufgehen sollen, werden
  // dabei sichtbar geschaltet.
  const nebelSetzen = async (flaechen, an) => {
    if (!karte) return;
    const neu = {
      ...(karte.nebel || {}),
      an: an === undefined ? nebel.an : an,
      flaechen: nebelAufraeumen(flaechen)
    };
    try {
      await karteSpeichern({
        ...karte,
        nebel: neu
      });
      const frei = orteImAufgedeckten(daten.objekte.filter(o => o.karteId === karte.id), neu);
      for (const o of frei) await objSpeichern({
        ...o,
        sichtbar: true
      });
      await laden(advId);
      if (frei.length) setMeldung({
        art: 'gut',
        text: '☁ Der Nebel gibt frei: ' + frei.map(o => o.name).join(', ') + '.'
      });
    } catch (e) {
      fehler(e);
    }
  };
  const nebelAufdecken = kreise => nebelSetzen([...nebel.flaechen, ...kreise]);
  const aufKarteGeklickt = async (p, mass) => {
    if (werkzeug === 'ort' && dm && karte) {
      const neu = {
        id: planNeueId('o'),
        karteId: karte.id,
        art: 'ort',
        name: 'Neuer Ort',
        symbol: '📍',
        x: p.x,
        y: p.y,
        sichtbar: false,
        text: '',
        dm: {
          notiz: ''
        }
      };
      setWerkzeug('ansehen');
      try {
        await objSpeichern(neu);
        await laden(advId);
        waehleOrt(neu.id);
      } catch (e) {
        fehler(e);
      }
      return;
    }
    if (werkzeug === 'massstab') {
      const neu = [...punkte, p].slice(-2);
      setPunkte(neu);
      if (neu.length === 2) setMassstabFrage(neu);
      return;
    }
    if (werkzeug === 'gruppe' && dm && karte) {
      const frei = heldenOhneGruppe((helden || []).filter(h => !h.nurDm), heldengruppen);
      const g = neueGruppe(karte.id, p, zeit, frei.map(h => h.id), Object.fromEntries(frei.map(h => [h.id, h.name])));
      setWerkzeug('ansehen');
      await gruppeBewegt(gruppeZiehen({
        ...g,
        spur: []
      }, p, zeit, karte.massstab, 'start'));
      waehleGruppe(g.id);
      return;
    }
    if (werkzeug === 'gruppeZiehen' && dm && heldengruppe) {
      setWerkzeug('ansehen');
      gruppeZiehenNach(heldengruppe, p);
      return;
    }
    if (werkzeug === 'figur' && dm && karte) {
      const f = neueFigur(karte.id, zeit, p);
      setWerkzeug('ansehen');
      try {
        await objSpeichern(f);
        await laden(advId);
        waehleFigur(f.id);
      } catch (e) {
        fehler(e);
      }
      return;
    }
    if (werkzeug === 'wegpunkt' && dm && figur) {
      setWerkzeug('ansehen');
      objAendern(wegpunktSetzen(figur, zeit, p));
      return;
    }
    if (werkzeug === 'nebel' && dm && karte) {
      if (nebelArt === 'vieleck') {
        setPunkte(v => [...v, p]);
        return;
      }
      const r = (NEBEL_RADIEN.find(x => x.k === nebelRadius) || NEBEL_RADIEN[1]).px / (mass || 1);
      nebelSetzen([...nebel.flaechen, nebelKreis(p, r)]);
      return;
    }
    if (werkzeug === 'lineal' || werkzeug === 'route' || werkzeug === 'region') {
      setPunkte(v => [...v, p]);
      return;
    }
    tafelZu();
  };
  const regionAnlegen = async punkteListe => {
    if (!karte || punkteListe.length < 3) return;
    const neu = {
      id: planNeueId('g'),
      karteId: karte.id,
      art: 'region',
      name: 'Neue Region',
      punkte: punkteListe,
      farbe: REGION_FARBEN[regionen.length % REGION_FARBEN.length],
      sichtbar: false,
      text: '',
      dm: {
        notiz: ''
      }
    };
    setWerkzeug('ansehen');
    setPunkte([]);
    try {
      await objSpeichern(neu);
      await laden(advId);
      waehleRegion(neu.id);
    } catch (e) {
      fehler(e);
    }
  };
  // ── Routen und Reisen ───────────────────────────────────────────
  const routeAnlegen = async punkteListe => {
    if (!karte || punkteListe.length < 2) return;
    const neu = {
      id: planNeueId('r'),
      karteId: karte.id,
      art: 'route',
      name: 'Neue Route',
      punkte: punkteListe,
      gelaende: punkteListe.slice(1).map(() => 'offen'),
      sichtbar: false,
      text: '',
      dm: {
        notiz: ''
      }
    };
    setWerkzeug('ansehen');
    setPunkte([]);
    try {
      await objSpeichern(neu);
      await laden(advId);
      waehleRoute(neu.id);
    } catch (e) {
      fehler(e);
    }
  };
  const objAendern = async o => {
    try {
      await objSpeichern(o);
      await laden(advId);
    } catch (e) {
      fehler(e);
    }
  };
  const objWeg = (o, titel, text, danach) => setFrage({
    titel,
    text,
    ja: 'Löschen',
    gefahr: true,
    onJa: async () => {
      try {
        await planerApi('planer_obj_loeschen', {
          adv_id: advId,
          obj_id: o.id
        });
        if (danach) await danach();
        await laden(advId);
      } catch (e) {
        fehler(e);
      }
    }
  });
  const routeLoeschen = r => {
    const abh = reisen.filter(j => j.routeId === r.id);
    objWeg(r, 'Route löschen?', '„' + r.name + '“ wird gelöscht' + (abh.length ? ', mit ' + abh.length + (abh.length === 1 ? ' Reise' : ' Reisen') + ' darauf.' : '.'), async () => {
      for (const j of abh) await planerApi('planer_obj_loeschen', {
        adv_id: advId,
        obj_id: j.id
      }).catch(() => {});
      setRouteWahl('');
    });
  };
  const reiseAnlegen = async r => {
    const neu = neueReise(r);
    try {
      await objSpeichern(neu);
      await laden(advId);
      waehleReise(neu.id);
    } catch (e) {
      fehler(e);
    }
  };
  const massstabSpeichern = async m => {
    setMassstabFrage(null);
    setPunkte([]);
    setWerkzeug('ansehen');
    await karteAendern(karte, {
      massstab: m
    });
    setMeldung({
      art: 'gut',
      text: 'Maßstab: ' + laengeText(m.laenge, m.einheit) + ' auf ' + Math.round(abstandPx(m.a, m.b)) + ' Pixel.'
    });
  };
  const werkzeugWaehlen = w => {
    setPunkte([]);
    setWerkzeug(v => v === w ? 'ansehen' : w);
  };

  // ── Orte ────────────────────────────────────────────────────────
  const ortSpeichern = async o => {
    try {
      await objSpeichern({
        ...o,
        name: String(o.name || '').trim() || 'Ohne Namen'
      });
      await laden(advId);
    } catch (e) {
      fehler(e);
    }
  };
  const ortVerschieben = (o, p) => ortSpeichern({
    ...o,
    x: p.x,
    y: p.y
  });
  const ortLoeschen = o => setFrage({
    titel: 'Ort löschen?',
    ja: 'Löschen',
    gefahr: true,
    text: '„' + o.name + '“ wird mit seinen Bildern gelöscht.',
    onJa: async () => {
      try {
        if ((o.bilder || []).length) await planerApi('planer_dateien_weg', {
          adv_id: advId,
          karte_id: o.karteId,
          pfade: o.bilder
        }).catch(() => {});
        await planerApi('planer_obj_loeschen', {
          adv_id: advId,
          obj_id: o.id
        });
        setOrtWahl('');
        await laden(advId);
      } catch (e) {
        fehler(e);
      }
    }
  });
  const ortBilderHoch = async (o, liste) => {
    try {
      const neu = await ausfuehren('Bilder', async melde => {
        const format = await bildFormat();
        const pfade = [];
        for (let i = 0; i < liste.length; i++) {
          melde('Bild ' + (i + 1) + ' von ' + liste.length, i / liste.length);
          const {
            bitmap
          } = await bildOeffnen(liste[i], bildMasse(await dateiKopf(liste[i])));
          const bytes = await bildVerkleinert(bitmap, 1600, format);
          if (bitmap.close) bitmap.close();
          const pfad = 'orte/' + o.id.toLowerCase() + '/' + planNeueId('b').slice(2) + '.' + format.endung;
          await planerApi('planer_dateien_hoch', {
            adv_id: advId,
            karte_id: o.karteId,
            dateien: [{
              pfad,
              daten: base64AusBytes(bytes)
            }]
          });
          pfade.push(pfad);
        }
        return pfade;
      });
      await ortSpeichern({
        ...o,
        bilder: [...(o.bilder || []), ...neu]
      });
    } catch (e) {
      fehler(e);
    }
  };
  const ortBildWeg = async (o, pfad) => {
    try {
      await planerApi('planer_dateien_weg', {
        adv_id: advId,
        karte_id: o.karteId,
        pfade: [pfad]
      });
      await ortSpeichern({
        ...o,
        bilder: (o.bilder || []).filter(p => p !== pfad)
      });
    } catch (e) {
      fehler(e);
    }
  };
  const zurUnterkarte = id => {
    if (!karten.some(k => k.id === id)) return;
    setVerlauf(v => [...v, auswahl]);
    setAuswahl(id);
  };
  const zurueck = () => {
    const v = [...verlauf];
    const id = v.pop();
    setVerlauf(v);
    if (id && karten.some(k => k.id === id)) setAuswahl(id);
  };

  // ── Paket ───────────────────────────────────────────────────────
  const advName = ((start && start.abenteuer || []).find(a => a.id === advId) || {}).name || '';
  const exportieren = async () => {
    try {
      const erg = await ausfuehren('Exportieren', async melde => {
        const frisch = await planerApi('planer_laden', {
          adv_id: advId
        });
        return planExportieren({
          daten: frisch,
          abenteuer: {
            id: advId,
            name: advName
          },
          dateienListe: async (z, art) => (await planerApi('planer_dateien_liste', art === 'objekt' ? {
            adv_id: advId,
            obj_id: z.id
          } : {
            adv_id: advId,
            karte_id: z.id
          })).dateien,
          dateiHolen: (ablage, pfad) => planerDateiHolen(ablage, pfad),
          programm: 'Abenteuerplaner ' + PLANER_VERSION,
          melde
        });
      });
      planerSpeichern(erg.blob, planDateiname(advName));
      setMeldung({
        art: 'gut',
        text: 'Exportiert: ' + erg.manifest.karten.length + ' Karten, ' + erg.manifest.objekte.length + ' Einträge, ' + erg.dateien + ' Dateien (' + planGroesse(erg.blob.size) + ').'
      });
    } catch (e) {
      fehler(e);
    }
  };
  const dateiGewaehlt = async ev => {
    const datei = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!datei) return;
    try {
      const paket = await ausfuehren('Paket prüfen', async melde => {
        melde('Inhalt lesen …');
        return planPaketOeffnen(datei);
      });
      setVorschau({
        paket,
        dateiname: datei.name
      });
    } catch (e) {
      fehler(e);
    }
  };
  const einspielen = async () => {
    const v = vorschau;
    setVorschau(null);
    const vorhanden = new Set(karten.map(k => k.name));
    try {
      const erg = await ausfuehren('Einspielen', melde => planEinspielen({
        paket: v.paket,
        karteSpeichern,
        objSpeichern,
        dateienHoch: (ziel, liste) => planerApi('planer_dateien_hoch', typeof ziel === 'string' ? {
          adv_id: advId,
          karte_id: ziel,
          dateien: liste
        } : {
          adv_id: advId,
          obj_id: ziel.objId,
          dateien: liste
        }),
        objLoeschen: id => planerApi('planer_obj_loeschen', {
          adv_id: advId,
          obj_id: id
        }),
        karteLoeschen: id => planerApi('planer_karte_loeschen', {
          adv_id: advId,
          karte_id: id
        }),
        namenZusatz: name => vorhanden.has(name) ? ' (importiert)' : '',
        melde
      }));
      await laden(advId);
      const ersteKarte = erg.karten ? erg.zuordnung.get(v.paket.manifest.karten[0].id) : '';
      if (ersteKarte) {
        setAuswahl(ersteKarte);
        setVerlauf([]);
      }
      setMeldung({
        art: 'gut',
        text: 'Eingespielt: ' + erg.karten + ' Karten, ' + erg.objekte + ' Einträge, ' + erg.dateien + ' Dateien.'
      });
    } catch (e) {
      fehler(new Error('Einspielen abgebrochen, nichts wurde übernommen: ' + e.message));
      laden(advId).catch(() => {});
    }
  };
  if (!angemeldet) return /*#__PURE__*/React.createElement(PlanerNichtAngemeldet, null);
  const linie = ['lineal', 'massstab', 'route', 'region', 'nebel'].includes(werkzeug) ? {
    punkte: (werkzeug === 'region' || werkzeug === 'nebel') && punkte.length > 2 ? [...punkte, punkte[0]] : punkte,
    art: werkzeug === 'nebel' ? 'region' : werkzeug
  } : null;
  const strecke = werkzeug === 'lineal' && karte && karte.massstab && punkte.length > 1 ? wegLaenge(punkte, karte.massstab) : 0;
  const vorige = verlauf.length ? karten.find(k => k.id === verlauf[verlauf.length - 1]) : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "pl-seite"
  }, /*#__PURE__*/React.createElement("header", {
    className: "pl-kopf"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-marke"
  }, "\uD83D\uDDFA Abenteuerplaner ", /*#__PURE__*/React.createElement("span", {
    className: "pl-ausgabe"
  }, PLANER_VERSION)), start && start.abenteuer.length > 0 && /*#__PURE__*/React.createElement("label", {
    className: "pl-adv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pl-leise"
  }, "Abenteuer"), /*#__PURE__*/React.createElement("select", {
    className: "pl-feld",
    value: advId,
    onChange: e => setAdvId(e.target.value)
  }, start.abenteuer.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), daten && /*#__PURE__*/React.createElement("span", {
    className: 'pl-rolle ' + (dm ? 'dm' : 'spieler')
  }, dm ? 'Spielleitung' : 'Spieler'), /*#__PURE__*/React.createElement("div", {
    className: "pl-kopf-rechts"
  }, dm && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf",
    onClick: exportieren,
    disabled: !karten.length,
    title: karten.length ? 'Alle Karten, Einträge und Dateien als .hbplan-Datei speichern' : 'Noch nichts zu exportieren'
  }, "\u21E9 Exportieren"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf",
    onClick: () => dateiEingabe.current && dateiEingabe.current.click(),
    title: "Eine .hbplan-Datei in dieses Abenteuer einspielen"
  }, "\u21E7 Importieren"), /*#__PURE__*/React.createElement("input", {
    ref: dateiEingabe,
    type: "file",
    accept: ".hbplan,.zip,application/zip",
    hidden: true,
    onChange: dateiGewaehlt
  }), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf",
    onClick: tischOeffnen,
    title: "Ein Fenster f\xFCr Beamer oder zweiten Bildschirm: zeigt, was die Runde sehen darf"
  }, "\uD83D\uDCFA Tisch"), /*#__PURE__*/React.createElement("label", {
    className: 'pl-schalter pl-tisch-folgt' + (tischFolgt ? ' an' : ''),
    title: "Der Tisch zeigt deine Karte und deinen Ausschnitt"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: tischFolgt,
    onChange: e => setTischFolgt(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "folgt mir")), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => anTisch('leer', {}),
    title: "Ein gezeigtes Handout vom Tisch nehmen"
  }, "\uD83D\uDCFA Karte zeigen")), daten && karten.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: offlineBereit,
    disabled: !!offline,
    title: "Alle Karten, Bilder und Handouts f\xFCr den Fall ohne Netz in diesem Browser ablegen"
  }, "\uD83D\uDCE5 Offline"), start && /*#__PURE__*/React.createElement("span", {
    className: "pl-nutzer"
  }, start.nutzer.name), /*#__PURE__*/React.createElement("a", {
    className: "pl-knopf pl-zurueck",
    href: "../"
  }, "\u2694 Heldenbuch"))), offline && /*#__PURE__*/React.createElement("div", {
    className: "pl-meldung fehler",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCF4 Kein Netz \u2014 der Stand vom ", new Date(offline.zeit).toLocaleString('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short'
  }), ". Ansehen geht, \xC4ndern erst wieder mit Netz.")), meldung && /*#__PURE__*/React.createElement("div", {
    className: 'pl-meldung ' + meldung.art,
    role: meldung.art === 'fehler' ? 'alert' : 'status'
  }, /*#__PURE__*/React.createElement("span", null, meldung.text), /*#__PURE__*/React.createElement("button", {
    className: "pl-symbol",
    "aria-label": "Meldung schlie\xDFen",
    onClick: () => setMeldung(null)
  }, "\u2715")), start && start.abenteuer.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "pl-buehne-leer"
  }, /*#__PURE__*/React.createElement("p", null, "In dieser Gruppe gibt es noch kein Abenteuer. Lege im Heldenbuch eines an.")) : !daten ? /*#__PURE__*/React.createElement("div", {
    className: "pl-buehne-leer"
  }, /*#__PURE__*/React.createElement("p", null, "L\xE4dt \u2026")) : /*#__PURE__*/React.createElement("main", {
    className: 'pl-haupt-flaeche' + (ort || route || region || handout || figur || geschichte || heldengruppe || reise && reiseRoute ? ' mit-tafel' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-spalte"
  }, /*#__PURE__*/React.createElement(PlanerKartenListe, {
    karten: karten,
    auswahl: auswahl,
    dm: dm,
    onWahl: id => {
      setAuswahl(id);
      setVerlauf([]);
    },
    onNeu: neueKarte,
    onUmbenennen: (id, name) => karteAendern(karten.find(k => k.id === id), {
      name
    }),
    onSichtbar: k => karteAendern(k, {
      sichtbar: !k.sichtbar
    }),
    onLoeschen: karteLoeschen
  }), karte && /*#__PURE__*/React.createElement(PlanerOrtListe, {
    orte: orte,
    auswahl: ortWahl,
    dm: dm,
    onWahl: o => {
      waehleOrt(o.id);
      setFokus({
        x: o.x,
        y: o.y,
        n: Date.now()
      });
    }
  }), /*#__PURE__*/React.createElement(PlanerHandoutListe, {
    handouts: handouts,
    wahl: handoutWahl,
    dm: dm,
    gesehen: gesehen,
    onWahl: id => {
      if (dm) waehleHandout(id);else {
        const h = handouts.find(x => x.id === id);
        if (h) {
          setLesen(h);
          gelesen(h);
        }
      }
    },
    onNeu: async () => {
      const h = neuesHandout();
      try {
        await objSpeichern(h);
        await laden(advId);
        waehleHandout(h.id);
      } catch (e) {
        fehler(e);
      }
    }
  }), /*#__PURE__*/React.createElement(GeschichteListe, {
    dm: dm,
    quests: quests,
    hinweise: hinweise,
    fraktionen: fraktionen,
    wahl: geschichteWahl,
    onWahl: o => waehleGeschichte(o.id),
    onNeu: async art => {
      const n = art === 'quest' ? neueQuest() : art === 'hinweis' ? neuerHinweis() : neueFraktion();
      try {
        await objSpeichern(n);
        await laden(advId);
        waehleGeschichte(n.id);
      } catch (e) {
        fehler(e);
      }
    }
  }), karte && /*#__PURE__*/React.createElement(PlanerGruppenListe, {
    gruppen: heldengruppen,
    wahl: gruppeWahl,
    dm: dm,
    onWahl: g => {
      waehleGruppe(g.id);
      const p = gruppePosition(g);
      if (p) setFokus({
        x: p.x,
        y: p.y,
        n: Date.now()
      });
    }
  }), karte && /*#__PURE__*/React.createElement(PlanerRegionListe, {
    regionen: regionen,
    regionWahl: regionWahl,
    dm: dm,
    onWahl: r => {
      waehleRegion(r.id);
      setFokus({
        ...polygonMitte(r.punkte),
        n: Date.now()
      });
    }
  }), karte && /*#__PURE__*/React.createElement(PlanerWegListe, {
    routen: routen,
    reisen: reisen,
    routeWahl: routeWahl,
    reiseWahl: reiseWahl,
    dm: dm,
    onRouteWahl: id => {
      waehleRoute(id);
      const r = routen.find(x => x.id === id);
      if (r && r.punkte && r.punkte[0]) setFokus({
        ...r.punkte[0],
        n: Date.now()
      });
    },
    onReiseWahl: id => {
      waehleReise(id);
      const gr = gruppen.find(x => x.id === id);
      if (gr && gr.punkt) setFokus({
        ...gr.punkt,
        n: Date.now()
      });
    }
  })), !karte ? /*#__PURE__*/React.createElement("div", {
    className: "pl-buehne-leer"
  }, /*#__PURE__*/React.createElement("p", null, karten.length ? 'Wähle links eine Karte.' : '')) : /*#__PURE__*/React.createElement("section", {
    className: "pl-buehne"
  }, /*#__PURE__*/React.createElement("header", {
    className: "pl-buehne-kopf"
  }, vorige && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: zurueck
  }, "\u2190 ", vorige.name), /*#__PURE__*/React.createElement("h1", null, karte.name), dm && /*#__PURE__*/React.createElement("span", {
    className: 'pl-sicht ' + (karte.sichtbar ? 'an' : 'aus')
  }, karte.sichtbar ? 'für Spieler sichtbar' : 'für Spieler verborgen'), dm && nebel.an && /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter pl-nebel-zeigen",
    title: "Nur f\xFCr dich: den Nebel halb durchsichtig dar\xFCberlegen"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: nebelZeigen,
    onChange: e => setNebelZeigen(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "\u2601 Nebel zeigen")), /*#__PURE__*/React.createElement("div", {
    className: "pl-werkzeuge",
    role: "toolbar",
    "aria-label": "Werkzeuge"
  }, dm && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => bildEingabe.current && bildEingabe.current.click()
  }, "\uD83D\uDDBC ", karte.bild ? 'Bild ersetzen' : 'Kartenbild'), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'ort' ? ' an' : ''),
    "aria-pressed": werkzeug === 'ort',
    onClick: () => werkzeugWaehlen('ort')
  }, "\uD83D\uDCCD Ort setzen"), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'massstab' ? ' an' : ''),
    "aria-pressed": werkzeug === 'massstab',
    onClick: () => werkzeugWaehlen('massstab')
  }, "\uD83D\uDCCF Ma\xDFstab"), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'gruppe' ? ' an' : ''),
    "aria-pressed": werkzeug === 'gruppe',
    onClick: () => werkzeugWaehlen('gruppe')
  }, "\uD83D\uDEE1 Gruppe"), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'figur' ? ' an' : ''),
    "aria-pressed": werkzeug === 'figur',
    onClick: () => werkzeugWaehlen('figur')
  }, "\uD83E\uDDCD Figur"), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'nebel' ? ' an' : ''),
    "aria-pressed": werkzeug === 'nebel',
    onClick: () => werkzeugWaehlen('nebel')
  }, "\u2601 Nebel"), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'region' ? ' an' : ''),
    "aria-pressed": werkzeug === 'region',
    onClick: () => werkzeugWaehlen('region')
  }, "\u2B21 Region"), dm && karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'route' ? ' an' : ''),
    "aria-pressed": werkzeug === 'route',
    onClick: () => werkzeugWaehlen('route')
  }, "\uD83D\uDEE4 Route"), karte.bild && /*#__PURE__*/React.createElement("button", {
    className: 'pl-knopf pl-klein' + (werkzeug === 'lineal' ? ' an' : ''),
    "aria-pressed": werkzeug === 'lineal',
    onClick: () => werkzeugWaehlen('lineal')
  }, "\uD83D\uDCD0 Messen"), /*#__PURE__*/React.createElement("input", {
    ref: bildEingabe,
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif,image/avif",
    hidden: true,
    onChange: bildGewaehlt
  }), dm && karte.bild && /*#__PURE__*/React.createElement(HexEinstellung, {
    karte: karte,
    onSpeichern: h => karteAendern(karte, {
      hex: h
    })
  }))), werkzeug !== 'ansehen' && /*#__PURE__*/React.createElement("div", {
    className: "pl-werkzeug-hinweis",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, WERKZEUG_HINWEIS[werkzeug]), werkzeug === 'lineal' && /*#__PURE__*/React.createElement("strong", {
    className: "pl-strecke"
  }, !karte.massstab ? 'Ohne Maßstab lässt sich nicht messen' + (dm ? ' — leg ihn mit 📏 fest.' : '.') : punkte.length > 1 ? laengeText(strecke, karte.massstab.einheit) + ' · ' + fussZeitText(strecke, karte.massstab.einheit) : ''), werkzeug === 'route' && /*#__PURE__*/React.createElement("strong", {
    className: "pl-strecke"
  }, punkte.length > 1 && karte.massstab ? laengeText(wegLaenge(punkte, karte.massstab), karte.massstab.einheit) : punkte.length + ' Punkte'), (werkzeug === 'lineal' || werkzeug === 'route' || werkzeug === 'region') && punkte.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => setPunkte(v => v.slice(0, -1))
  }, "\u21B6 Punkt"), werkzeug === 'lineal' && punkte.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => setPunkte([])
  }, "Neu"), werkzeug === 'lineal' && dm && punkte.length > 1 && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => routeAnlegen(punkte)
  }, "\uD83D\uDEE4 Als Route speichern"), werkzeug === 'route' && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein pl-haupt",
    disabled: punkte.length < 2,
    onClick: () => routeAnlegen(punkte)
  }, "Route anlegen"), werkzeug === 'nebel' && /*#__PURE__*/React.createElement("span", {
    className: "pl-nebel-steuer"
  }, /*#__PURE__*/React.createElement("label", {
    className: "pl-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: nebel.an,
    onChange: e => nebelSetzen(nebel.flaechen, e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, "Nebel f\xFCr Spieler")), /*#__PURE__*/React.createElement("select", {
    className: "pl-feld pl-klein",
    value: nebel.modus,
    "aria-label": "Wenn die Gruppe weiterzieht",
    title: (NEBEL_MODI.find(x => x.k === nebel.modus) || NEBEL_MODI[0]).t,
    onChange: e => karteAendern(karte, {
      nebel: {
        ...(karte.nebel || {}),
        an: nebel.an,
        flaechen: nebel.flaechen,
        modus: e.target.value
      }
    })
  }, NEBEL_MODI.map(x => /*#__PURE__*/React.createElement("option", {
    key: x.k,
    value: x.k,
    title: x.t
  }, x.l))), /*#__PURE__*/React.createElement("span", {
    className: "pl-knopfgruppe",
    role: "radiogroup",
    "aria-label": "Aufdecken"
  }, NEBEL_RADIEN.map(x => /*#__PURE__*/React.createElement("button", {
    key: x.k,
    role: "radio",
    "aria-checked": nebelArt === 'kreis' && nebelRadius === x.k,
    className: 'pl-knopf pl-klein' + (nebelArt === 'kreis' && nebelRadius === x.k ? ' an' : ''),
    onClick: () => {
      setNebelArt('kreis');
      setNebelRadius(x.k);
      setPunkte([]);
    }
  }, "\u25EF ", x.l)), /*#__PURE__*/React.createElement("button", {
    role: "radio",
    "aria-checked": nebelArt === 'vieleck',
    className: 'pl-knopf pl-klein' + (nebelArt === 'vieleck' ? ' an' : ''),
    onClick: () => {
      setNebelArt('vieleck');
      setPunkte([]);
    }
  }, "\u2B21 Fl\xE4che")), nebelArt === 'vieleck' && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein pl-haupt",
    disabled: punkte.length < 3,
    onClick: () => {
      nebelSetzen([...nebel.flaechen, {
        art: 'vieleck',
        punkte
      }]);
      setPunkte([]);
    }
  }, "Aufdecken"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    disabled: !nebel.flaechen.length,
    onClick: () => nebelSetzen(nebel.flaechen.slice(0, -1))
  }, "\u21B6 Zur\xFCck"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => nebelSetzen([{
      art: 'alles'
    }])
  }, "Alles aufdecken"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => nebelSetzen([])
  }, "Alles zudecken")), werkzeug === 'region' && karte.bild && punkte.length === 0 && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => regionAnlegen([{
      x: 0,
      y: 0
    }, {
      x: karte.bild.breite,
      y: 0
    }, {
      x: karte.bild.breite,
      y: karte.bild.hoehe
    }, {
      x: 0,
      y: karte.bild.hoehe
    }])
  }, "\u25AD Ganze Karte"), werkzeug === 'region' && /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein pl-haupt",
    disabled: punkte.length < 3,
    onClick: () => regionAnlegen(punkte)
  }, "Region anlegen"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => {
      setWerkzeug('ansehen');
      setPunkte([]);
    }
  }, "Fertig")), figurenRoh.length > 0 && /*#__PURE__*/React.createElement(Zeitleiste, {
    dm: dm,
    zeit: zeit,
    bereich: zeitSpanne,
    chronikZeit: chronikZeit,
    freigegeben: karte.zeit,
    onZeit: z => setZeitRegler(Math.max(0, z)),
    onFreigeben: z => karteAendern(karte, {
      zeit: z
    })
  }), /*#__PURE__*/React.createElement(KartenLeinwand, {
    karte: karte,
    orte: orte,
    dm: dm,
    werkzeug: werkzeug,
    ortWahl: ortWahl,
    linie: linie,
    fokus: fokus,
    gedaechtnis: gedaechtnis,
    routen: routen,
    gruppen: gruppen,
    routeWahl: routeWahl,
    reiseWahl: reiseWahl,
    onRouteWahl: waehleRoute,
    onReiseWahl: waehleReise,
    regionen: regionen,
    regionWahl: regionWahl,
    onRegionWahl: waehleRegion,
    nebel: dm && !nebelZeigen && werkzeug !== 'nebel' ? null : nebel,
    nebelDeckend: !dm,
    onAnsicht: dm ? ansichtGemeldet : null,
    figuren: figuren,
    figurWahl: figurWahl,
    onFigurWahl: waehleFigur,
    onFigurVerschieben: (f, p) => {
      const {
        punkt,
        ...rest
      } = f;
      objAendern(wegpunktSetzen(rest, zeit, p));
    },
    hex: dm || karte.hex && karte.hex.spieler ? karte.hex : null,
    questOrte: questOrte,
    heldengruppen: heldengruppen,
    gruppeWahl: gruppeWahl,
    onGruppeWahl: waehleGruppe,
    onGruppeZiehen: (g, p) => gruppeZiehenNach(g, p),
    onKlick: aufKarteGeklickt,
    onOrtWahl: waehleOrt,
    onOrtVerschieben: ortVerschieben,
    onBildWaehlen: () => bildEingabe.current && bildEingabe.current.click()
  }), /*#__PURE__*/React.createElement("dl", {
    className: "pl-fakten pl-fakten-quer"
  }, karte.bild && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Bild"), /*#__PURE__*/React.createElement("dd", null, karte.bild.breite, " \xD7 ", karte.bild.hoehe)), karte.massstab && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Ma\xDFstab"), /*#__PURE__*/React.createElement("dd", null, laengeText(karte.massstab.laenge, karte.massstab.einheit), " = ", Math.round(abstandPx(karte.massstab.a, karte.massstab.b)), " px")), /*#__PURE__*/React.createElement("dt", null, "Orte"), /*#__PURE__*/React.createElement("dd", null, orte.length), dm && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Dateien"), /*#__PURE__*/React.createElement("dd", null, dateien ? dateien.anzahl + ' · ' + planGroesse(dateien.bytes) : '…')))), ort && karte && /*#__PURE__*/React.createElement(OrtTafel, {
    key: ort.id,
    ort: ort,
    dm: dm,
    karte: karte,
    karten: karten,
    arbeitet: !!arbeit,
    wissen: dm ? hinweise.filter(h => h.ortId === ort.id) : bekanntesWissen(hinweise, ort.id),
    quests: quests.filter(q => q.zielOrt === ort.id),
    onGeschichte: o => waehleGeschichte(o.id),
    onMeldung: setMeldung,
    onSpeichern: ortSpeichern,
    onLoeschen: ortLoeschen,
    onSchliessen: () => setOrtWahl(''),
    onUnterkarte: zurUnterkarte,
    onBilderHoch: ortBilderHoch,
    onBildWeg: ortBildWeg
  }), heldengruppe && karte && /*#__PURE__*/React.createElement(GruppeTafel, {
    key: heldengruppe.id,
    gruppe: heldengruppe,
    dm: dm,
    karte: karte,
    helden: helden,
    gruppen: heldengruppen,
    zieht: werkzeug === 'gruppeZiehen',
    onSpeichern: g => objAendern({
      ...g,
      name: String(g.name || '').trim() || 'Heldengruppe'
    }),
    onLoeschen: g => objWeg(g, 'Gruppe löschen?', '„' + g.name + '“ wird mit ihrer Spur gelöscht. Die Bögen bleiben, der gelichtete Nebel auch.', async () => setGruppeWahl('')),
    onSchliessen: () => setGruppeWahl(''),
    onZiehenWaehlen: () => {
      setPunkte([]);
      setWerkzeug(v => v === 'gruppeZiehen' ? 'ansehen' : 'gruppeZiehen');
    },
    onZuruecknehmen: () => objAendern({
      ...heldengruppe,
      spur: heldengruppe.spur.slice(0, -1)
    }),
    onTeilen: async (g, ids) => {
      const t = gruppeTeilen(g, ids, planNeueId('g'), zeit);
      if (!t) return;
      try {
        await objSpeichern(t.alte);
        await objSpeichern(t.neue);
        await laden(advId);
        waehleGruppe(t.neue.id);
        setMeldung({
          art: 'gut',
          text: '✂ „' + t.neue.name + '“ zieht als eigene Gruppe los.'
        });
      } catch (e) {
        fehler(e);
      }
    },
    onVereinen: async (a, b) => {
      // Die groessere Gruppe bleibt bestehen — mit ihrer ganzen Spur;
      // die kleinere geht in ihr auf.
      const [bleibt, geht] = (b.helden || []).length > (a.helden || []).length ? [b, a] : [a, b];
      try {
        await objSpeichern(gruppenVereinen(bleibt, geht, zeit));
        await planerApi('planer_obj_loeschen', {
          adv_id: advId,
          obj_id: geht.id
        });
        await laden(advId);
        waehleGruppe(bleibt.id);
        setMeldung({
          art: 'gut',
          text: '⤵ „' + geht.name + '“ ist in „' + bleibt.name + '“ aufgegangen.'
        });
      } catch (e) {
        fehler(e);
      }
    }
  }), figur && karte && /*#__PURE__*/React.createElement(FigurTafel, {
    key: figur.id,
    figur: figur,
    dm: dm,
    zeit: zeit,
    wegpunktWartet: werkzeug === 'wegpunkt',
    helden: helden,
    onBogen: nscBogenOeffnen,
    onSpeichern: f => objAendern({
      ...f,
      name: String(f.name || '').trim() || 'Ohne Namen'
    }),
    onLoeschen: f => objWeg(f, 'Figur löschen?', '„' + f.name + '“ wird mit allen Wegpunkten gelöscht.', async () => setFigurWahl('')),
    onSchliessen: () => setFigurWahl(''),
    onWegpunktHier: () => {
      setPunkte([]);
      setWerkzeug(v => v === 'wegpunkt' ? 'ansehen' : 'wegpunkt');
    }
  }), geschichte && /*#__PURE__*/React.createElement(GeschichteTafel, {
    key: geschichte.id,
    eintrag: geschichte,
    dm: dm,
    orte: alleOrte,
    quests: quests,
    regionen: alleRegionen,
    onSpeichern: o => objAendern(o),
    onLoeschen: o => objWeg(o, 'Löschen?', '„' + (o.titel || o.name || String(o.text || '').slice(0, 40)) + '“ wird gelöscht.', async () => setGeschichteWahl('')),
    onSchliessen: () => setGeschichteWahl(''),
    onOrt: zumOrt
  }), handout && dm && /*#__PURE__*/React.createElement(HandoutTafel, {
    key: handout.id,
    handout: handout,
    mitglieder: mitglieder,
    arbeitet: !!arbeit,
    onSpeichern: h => objAendern({
      ...h,
      titel: String(h.titel || '').trim() || 'Ohne Titel'
    }),
    onVerteilen: (h, an) => objAendern({
      ...h,
      sichtbar: an,
      geaendert: an ? Date.now() : h.geaendert
    }),
    onLoeschen: h => objWeg(h, 'Handout löschen?', '„' + h.titel + '“ wird mit seinem Bild gelöscht — auch bei den Spielern.', async () => setHandoutWahl('')),
    onSchliessen: () => setHandoutWahl(''),
    onTisch: h => {
      anTisch('handout', {
        id: h.id,
        handout: {
          titel: h.titel,
          text: h.text,
          bild: h.bild,
          ablage: handout.ablage
        }
      });
      setMeldung({
        art: 'gut',
        text: '📺 „' + h.titel + '“ ist an den Tisch geschickt.'
      });
    },
    onBild: async (h, datei) => {
      try {
        // Speichern und Neuladen gehoeren mit in die Arbeit: sonst
        // verteilt ein schneller Klick die alte Fassung ohne Bild.
        await ausfuehren('Bild', async melde => {
          melde('Bild verkleinern …');
          const format = await bildFormat();
          const {
            bitmap
          } = await bildOeffnen(datei, bildMasse(await dateiKopf(datei)));
          const bytes = await bildVerkleinert(bitmap, 2000, format);
          if (bitmap.close) bitmap.close();
          const neuPfad = 'bild-' + planNeueId('b').slice(2) + '.' + format.endung;
          await planerApi('planer_dateien_hoch', {
            adv_id: advId,
            obj_id: h.id,
            dateien: [{
              pfad: neuPfad,
              daten: base64AusBytes(bytes)
            }]
          });
          if (h.bild) await planerApi('planer_dateien_weg', {
            adv_id: advId,
            obj_id: h.id,
            pfade: [h.bild]
          }).catch(() => {});
          melde('Speichern …');
          await objSpeichern({
            ...h,
            bild: neuPfad,
            geaendert: h.sichtbar ? Date.now() : h.geaendert
          });
          await laden(advId);
        });
      } catch (e) {
        fehler(e);
      }
    }
  }), region && karte && /*#__PURE__*/React.createElement(RegionTafel, {
    key: region.id,
    region: region,
    dm: dm,
    karte: karte,
    begegnungen: begegnungen,
    advId: advId,
    onSpeichern: r => objAendern({
      ...r,
      name: String(r.name || '').trim() || 'Ohne Namen'
    }),
    onLoeschen: r => objWeg(r, 'Region löschen?', '„' + r.name + '“ wird mit ihrer Begegnungstabelle gelöscht.', async () => setRegionWahl('')),
    onSchliessen: () => setRegionWahl(''),
    onMeldung: setMeldung
  }), route && karte && /*#__PURE__*/React.createElement(RouteTafel, {
    key: route.id,
    route: route,
    dm: dm,
    karte: karte,
    reisen: reisen,
    onSpeichern: r => objAendern({
      ...r,
      name: String(r.name || '').trim() || 'Ohne Namen'
    }),
    onLoeschen: routeLoeschen,
    onSchliessen: () => setRouteWahl(''),
    onReiseNeu: reiseAnlegen,
    onReiseWahl: waehleReise
  }), reise && reiseRoute && karte && /*#__PURE__*/React.createElement(ReiseTafel, {
    key: reise.id,
    reise: reise,
    route: reiseRoute,
    dm: dm,
    karte: karte,
    advId: advId,
    chronikZeit: chronikZeit,
    figuren: figurenRoh,
    onFigurReist: (f, p, z) => objAendern(wegpunktSetzen(f, z, p)),
    regionen: regionen,
    begegnungen: begegnungen || [],
    onNebelAufdecken: nebelAufdecken,
    heldengruppen: heldengruppen,
    onGruppeReist: gruppeReistMit,
    onSpeichern: j => objAendern({
      ...j,
      name: String(j.name || '').trim() || 'Reise'
    }),
    onLoeschen: j => objWeg(j, 'Reise löschen?', '„' + j.name + '“ wird gelöscht. Die Route bleibt.', async () => setReiseWahl('')),
    onSchliessen: () => setReiseWahl(''),
    onMeldung: setMeldung
  })), !dm && (lesen || ungelesen[0]) && /*#__PURE__*/React.createElement(HandoutLeser, {
    handout: lesen || ungelesen[0],
    onZu: () => {
      gelesen(lesen || ungelesen[0]);
      setLesen(null);
    }
  }), massstabFrage && /*#__PURE__*/React.createElement(MassstabDialog, {
    punkte: massstabFrage,
    alt: karte && karte.massstab,
    onSpeichern: massstabSpeichern,
    onZu: () => {
      setMassstabFrage(null);
      setPunkte([]);
    }
  }), vorschau && /*#__PURE__*/React.createElement(PlanerImportVorschau, {
    vorschau: vorschau,
    onEinspielen: einspielen,
    onZu: () => setVorschau(null)
  }), frage && /*#__PURE__*/React.createElement(PlanerFrage, {
    frage: frage,
    onZu: () => setFrage(null)
  }), arbeit && /*#__PURE__*/React.createElement(PlanerArbeit, {
    arbeit: arbeit,
    onAbbrechen: () => {
      abbruchRef.current = true;
      setArbeit(a => a && {
        ...a,
        abbruch: true
      });
    }
  }));
};

// Der Einstieg — aus planer/index.html und aus dev/planer-echt.html.
const planerWurzeln = new Map();
const planerStarten = (el, optionen) => {
  if (planerWurzeln.has(el)) planerWurzeln.get(el).unmount();
  const w = ReactDOM.createRoot(el);
  planerWurzeln.set(el, w);
  w.render(optionen && optionen.tisch ? /*#__PURE__*/React.createElement(TischApp, {
    adv: optionen.adv
  }) : /*#__PURE__*/React.createElement(PlanerApp, null));
};
