// ACHTUNG: erzeugt von build.js aus planer/src/*.jsx — Aenderungen hier gehen
// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.
// Zusammengesetzt aus: 0-basis.jsx, 1-paket.jsx, 1b-kacheln.jsx, 1c-reise.jsx, 2-leinwand.jsx, 3-ort.jsx, 3b-reise.jsx, 4-app.jsx
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
const PLANER_VERSION = 'Stufe 2';

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
// es hier, im Browser, ohne Bibliothek: Bilder sind schon gepackt und
// gehen ungepackt hinein (Methode 0), das JSON wird mit dem eingebauten
// CompressionStream gepackt (Methode 8). Mehr als 65 535 Dateien oder
// mehr als 4 GB schreiben das ZIP64-Verzeichnis dazu — eine Weltkarte in
// Kacheln kommt schneller dorthin, als man denkt.
//
// Alles bis zur Markierung unten ist reine Rechnung und wird von
// dev/pruefungen/planer-paket-test.js ohne Browser geprueft.

// ── CRC-32 ───────────────────────────────────────────────────────
const CRC_TAFEL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (bytes, vorher) => {
  let c = (vorher === undefined ? 0 : vorher) ^ 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TAFEL[(c ^ bytes[i]) & 0xFF] ^ c >>> 8;
  return (c ^ 0xFFFFFFFF) >>> 0;
};

// ── Kleinkram ────────────────────────────────────────────────────
const alsBytes = async x => {
  if (x instanceof Uint8Array) return x;
  if (typeof x === 'string') return new TextEncoder().encode(x);
  if (x && typeof x.arrayBuffer === 'function') return new Uint8Array(await x.arrayBuffer());
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  throw new Error('Unbekannte Daten für das Paket.');
};
const durchStrom = async (bytes, strom) => {
  const antwort = new Response(new Blob([bytes]).stream().pipeThrough(strom));
  return new Uint8Array(await antwort.arrayBuffer());
};
const packen = bytes => durchStrom(bytes, new CompressionStream('deflate-raw'));
const entpacken = bytes => durchStrom(bytes, new DecompressionStream('deflate-raw'));

// Zeit im Format von MS-DOS: zwei Sekunden genau, ab 1980.
const dosZeit = d => {
  const jahr = Math.max(1980, d.getFullYear());
  return {
    zeit: d.getHours() << 11 | d.getMinutes() << 5 | Math.floor(d.getSeconds() / 2),
    datum: jahr - 1980 << 9 | d.getMonth() + 1 << 5 | d.getDate()
  };
};
// 64-Bit-Zahlen als zwei Haelften: DataView kann BigInt, aber Zahlen bis
// 2^53 genuegen fuer jede Datei, die ein Browser anfassen mag.
const setU64 = (dv, pos, n) => {
  dv.setUint32(pos, n % 0x100000000, true);
  dv.setUint32(pos + 4, Math.floor(n / 0x100000000), true);
};
const getU64 = (dv, pos) => dv.getUint32(pos, true) + dv.getUint32(pos + 4, true) * 0x100000000;

// ── Schreiben ────────────────────────────────────────────────────
// eintraege: [{name, daten, packen}] — daten als Uint8Array, Blob oder
// Text. grenzen nur fuer die Pruefungen: damit ZIP64 ohne 4 GB Testdaten
// geprueft werden kann.
const ZIP_GRENZEN = {
  anzahl: 0xFFFF,
  bytes: 0xFFFFFFFF
};
const zipSchreiben = async (eintraege, opt) => {
  const o = opt || {};
  const grenzen = o.grenzen || ZIP_GRENZEN;
  const {
    zeit,
    datum
  } = dosZeit(o.jetzt || new Date());
  const teile = [];
  const zentral = [];
  let pos = 0;
  const namen = new Set();
  let nr = 0;
  for (const e of eintraege) {
    if (namen.has(e.name)) throw new Error('Doppelter Name im Paket: ' + e.name);
    namen.add(e.name);
    const roh = await alsBytes(e.daten);
    if (roh.length >= 0xFFFFFFFF) throw new Error('Eine Datei über 4 GB passt nicht ins Paket: ' + e.name);
    const crc = crc32(roh);
    let daten = roh,
      methode = 0;
    if (e.packen) {
      const gepackt = await packen(roh);
      // Was sich nicht verkleinert, bleibt, wie es ist.
      if (gepackt.length < roh.length) {
        daten = gepackt;
        methode = 8;
      }
    }
    const name = new TextEncoder().encode(e.name);
    const kopf = new DataView(new ArrayBuffer(30));
    kopf.setUint32(0, 0x04034b50, true);
    kopf.setUint16(4, 20, true);
    kopf.setUint16(6, 0x0800, true); // Namen in UTF-8
    kopf.setUint16(8, methode, true);
    kopf.setUint16(10, zeit, true);
    kopf.setUint16(12, datum, true);
    kopf.setUint32(14, crc, true);
    kopf.setUint32(18, daten.length, true);
    kopf.setUint32(22, roh.length, true);
    kopf.setUint16(26, name.length, true);
    kopf.setUint16(28, 0, true);
    teile.push(new Uint8Array(kopf.buffer), name, daten);
    zentral.push({
      name,
      methode,
      crc,
      gepackt: daten.length,
      roh: roh.length,
      pos
    });
    pos += 30 + name.length + daten.length;
    nr++;
    if (o.melde && nr % 50 === 0) o.melde(nr, eintraege.length);
  }
  const cdStart = pos;
  for (const z of zentral) {
    const weit = z.pos >= grenzen.bytes;
    const extra = weit ? 12 : 0;
    const dv = new DataView(new ArrayBuffer(46 + extra));
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, weit ? 45 : 20, true);
    dv.setUint16(6, weit ? 45 : 20, true);
    dv.setUint16(8, 0x0800, true);
    dv.setUint16(10, z.methode, true);
    dv.setUint16(12, zeit, true);
    dv.setUint16(14, datum, true);
    dv.setUint32(16, z.crc, true);
    dv.setUint32(20, z.gepackt, true);
    dv.setUint32(24, z.roh, true);
    dv.setUint16(28, z.name.length, true);
    dv.setUint16(30, extra, true);
    dv.setUint32(42, weit ? 0xFFFFFFFF : z.pos, true);
    const kopf = new Uint8Array(dv.buffer, 0, 46);
    teile.push(kopf, z.name);
    if (weit) {
      const ex = new DataView(dv.buffer, 46, 12);
      ex.setUint16(0, 0x0001, true);
      ex.setUint16(2, 8, true);
      setU64(ex, 4, z.pos);
      teile.push(new Uint8Array(dv.buffer, 46, 12));
    }
    pos += 46 + z.name.length + extra;
  }
  const cdGroesse = pos - cdStart;
  const anzahl = zentral.length;
  const zip64 = anzahl >= grenzen.anzahl || cdStart >= grenzen.bytes || cdGroesse >= grenzen.bytes;
  if (zip64) {
    const dv = new DataView(new ArrayBuffer(56 + 20));
    dv.setUint32(0, 0x06064b50, true);
    setU64(dv, 4, 44);
    dv.setUint16(12, 45, true);
    dv.setUint16(14, 45, true);
    setU64(dv, 24, anzahl);
    setU64(dv, 32, anzahl);
    setU64(dv, 40, cdGroesse);
    setU64(dv, 48, cdStart);
    dv.setUint32(56, 0x07064b50, true);
    setU64(dv, 64, pos);
    dv.setUint32(72, 1, true);
    teile.push(new Uint8Array(dv.buffer));
  }
  const ende = new DataView(new ArrayBuffer(22));
  ende.setUint32(0, 0x06054b50, true);
  ende.setUint16(8, zip64 ? 0xFFFF : anzahl, true);
  ende.setUint16(10, zip64 ? 0xFFFF : anzahl, true);
  ende.setUint32(12, zip64 ? 0xFFFFFFFF : cdGroesse, true);
  ende.setUint32(16, zip64 ? 0xFFFFFFFF : cdStart, true);
  teile.push(new Uint8Array(ende.buffer));
  return new Blob(teile, {
    type: 'application/zip'
  });
};

// ── Lesen ────────────────────────────────────────────────────────
// Liest nur das Verzeichnis am Ende; jede Datei wird erst geholt, wenn
// sie gebraucht wird. Eine Datei von mehreren Hundert MB muss so nie
// ganz in den Speicher.
const ZIP_MAX_DATEI = 200 * 1024 * 1024; // gegen Entpackbomben
const zipLesen = async blob => {
  const groesse = blob.size;
  if (groesse < 22) throw new Error('Das ist keine Paketdatei (zu kurz).');
  const hinten = Math.min(groesse, 22 + 65535 + 20);
  const schwanz = new Uint8Array(await blob.slice(groesse - hinten).arrayBuffer());
  const sdv = new DataView(schwanz.buffer);
  let e = -1;
  for (let i = schwanz.length - 22; i >= 0; i--) {
    if (sdv.getUint32(i, true) === 0x06054b50) {
      e = i;
      break;
    }
  }
  if (e < 0) throw new Error('Das ist keine Paketdatei (kein ZIP-Verzeichnis gefunden).');
  let anzahl = sdv.getUint16(e + 10, true);
  let cdGroesse = sdv.getUint32(e + 12, true);
  let cdStart = sdv.getUint32(e + 16, true);
  if (e >= 20 && sdv.getUint32(e - 20, true) === 0x07064b50) {
    const z64pos = getU64(sdv, e - 20 + 8);
    const z = new DataView(await blob.slice(z64pos, z64pos + 56).arrayBuffer());
    if (z.getUint32(0, true) !== 0x06064b50) throw new Error('Das ZIP64-Verzeichnis ist beschädigt.');
    anzahl = getU64(z, 32);
    cdGroesse = getU64(z, 40);
    cdStart = getU64(z, 48);
  }
  if (cdStart + cdGroesse > groesse) throw new Error('Die Paketdatei ist unvollständig — vielleicht nicht fertig heruntergeladen?');
  const cd = new Uint8Array(await blob.slice(cdStart, cdStart + cdGroesse).arrayBuffer());
  const dv = new DataView(cd.buffer);
  const dekoder = new TextDecoder();
  const eintraege = [];
  let p = 0;
  for (let i = 0; i < anzahl; i++) {
    if (p + 46 > cd.length || dv.getUint32(p, true) !== 0x02014b50) throw new Error('Das Verzeichnis der Paketdatei ist beschädigt.');
    const methode = dv.getUint16(p + 10, true);
    const crc = dv.getUint32(p + 16, true);
    let gepackt = dv.getUint32(p + 20, true);
    let roh = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const kommLen = dv.getUint16(p + 32, true);
    let pos = dv.getUint32(p + 42, true);
    const name = dekoder.decode(cd.subarray(p + 46, p + 46 + nameLen));
    // ZIP64-Zusatz: nur die Felder, die im Kopf auf 0xFFFFFFFF stehen,
    // und in dieser Reihenfolge.
    let x = p + 46 + nameLen;
    const xEnde = x + extraLen;
    while (x + 4 <= xEnde) {
      const art = dv.getUint16(x, true),
        len = dv.getUint16(x + 2, true);
      if (art === 0x0001) {
        let q = x + 4;
        if (roh === 0xFFFFFFFF) {
          roh = getU64(dv, q);
          q += 8;
        }
        if (gepackt === 0xFFFFFFFF) {
          gepackt = getU64(dv, q);
          q += 8;
        }
        if (pos === 0xFFFFFFFF) {
          pos = getU64(dv, q);
          q += 8;
        }
      }
      x += 4 + len;
    }
    eintraege.push({
      name,
      methode,
      crc,
      gepackt,
      roh,
      pos
    });
    p = xEnde + kommLen;
  }
  const lesen = async eintrag => {
    if (eintrag.methode !== 0 && eintrag.methode !== 8) throw new Error('Unbekannte Packart in ' + eintrag.name);
    if (eintrag.roh > ZIP_MAX_DATEI) throw new Error('Die Datei ' + eintrag.name + ' ist zu groß.');
    const k = new DataView(await blob.slice(eintrag.pos, eintrag.pos + 30).arrayBuffer());
    if (k.getUint32(0, true) !== 0x04034b50) throw new Error('Die Datei ' + eintrag.name + ' ist beschädigt.');
    const start = eintrag.pos + 30 + k.getUint16(26, true) + k.getUint16(28, true);
    const daten = new Uint8Array(await blob.slice(start, start + eintrag.gepackt).arrayBuffer());
    const roh = eintrag.methode === 8 ? await entpacken(daten) : daten;
    if (roh.length !== eintrag.roh || crc32(roh) !== eintrag.crc) {
      throw new Error('Die Datei ' + eintrag.name + ' ist beschädigt (Prüfsumme stimmt nicht).');
    }
    return roh;
  };
  const nachName = new Map(eintraege.map(x => [x.name, x]));
  return {
    eintraege,
    lesen,
    finden: name => nachName.get(name) || null
  };
};

// ── Das Format ───────────────────────────────────────────────────
const HBPLAN_FORMAT = 'heldenbuch-planer';
const HBPLAN_VERSION = 1;
const HBPLAN_MANIFEST = 'hbplan.json';
// Dieselbe Regel wie PLAN_PFAD in api.php: was der Server nicht
// annimmt, soll schon beim Lesen auffallen und nicht nach der Haelfte.
const PLAN_PFAD_RE = /^(?:[a-z0-9][a-z0-9_-]{0,40}\/){0,6}[a-z0-9][a-z0-9_-]{0,60}\.(webp|png|jpg|jpeg|json)$/;
const PLAN_ID_RE = /^[A-Za-z0-9_-]{3,50}$/;
const PLAN_ARTEN = ['ort', 'route', 'reise', 'figur', 'region', 'notiz', 'tabelle'];
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
  objekte,
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
    if (!karten.has(o.karteId)) return 'Der Eintrag ' + o.id + ' gehört zu keiner Karte im Paket.';
    objekte.add(o.id);
  }
  for (const d of m.dateien) {
    if (!d || !karten.has(d.karte)) return 'Eine Datei im Paket gehört zu keiner Karte.';
    if (!PLAN_PFAD_RE.test(String(d.pfad || ''))) return 'Ungültiger Dateiname im Paket: ' + String(d.pfad).slice(0, 80);
  }
  return '';
};
const planPaketName = (karte, pfad) => 'karten/' + karte + '/' + pfad;

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
  const sauber = String(name || 'Abenteuer').normalize('NFC').replace(/[\\/:*?"<>| -]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Abenteuer';
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
    const liste = await dateienListe(k);
    liste.forEach(d => dateien.push({
      karte: k.id,
      ablage: k.ablage,
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
      karte: d.karte,
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
    name: planPaketName(d.karte, d.pfad),
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
  const fehlt = manifest.dateien.filter(d => !zip.finden(planPaketName(d.karte, d.pfad)));
  if (fehlt.length) throw new Error(fehlt.length + ' Datei(en) fehlen im Paket, z. B. ' + planPaketName(fehlt[0].karte, fehlt[0].pfad) + '.');
  const bytes = manifest.dateien.reduce((s, d) => s + (+d.bytes || 0), 0);
  return {
    zip,
    manifest,
    bytes
  };
};
const planEinspielen = async ({
  paket,
  karteSpeichern,
  objSpeichern,
  dateienHoch,
  karteLoeschen,
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
    const nachKarte = new Map();
    manifest.dateien.forEach(d => {
      const neu = zuordnung.get(d.karte);
      if (!nachKarte.has(neu)) nachKarte.set(neu, []);
      nachKarte.get(neu).push({
        ...d,
        eintrag: zip.finden(planPaketName(d.karte, d.pfad)),
        bytes: 0
      });
    });
    const gesamt = manifest.dateien.length;
    let fertig = 0;
    for (const [karteId, liste] of nachKarte) {
      liste.forEach(d => {
        d.bytes = d.eintrag.roh;
      });
      for (const buendel of planBuendel(liste, buendelBytes || 2500000)) {
        const teil = [];
        for (const d of buendel) teil.push({
          pfad: d.pfad,
          daten: base64AusBytes(await zip.lesen(d.eintrag))
        });
        await dateienHoch(karteId, teil);
        fertig += buendel.length;
        m('Dateien hochladen: ' + fertig + ' von ' + gesamt, fertig / Math.max(1, gesamt));
      }
    }
    let n = 0;
    for (const o of objekte) {
      await objSpeichern(o);
      n++;
      if (n % 20 === 0) m('Einträge anlegen: ' + n + ' von ' + objekte.length);
    }
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
      });
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
    }))), /*#__PURE__*/React.createElement("svg", {
      className: "pl-ueberlage",
      width: g.breite,
      height: g.hoehe
    }, (routen || []).map(r => {
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
    }))), (gruppen || []).filter(gr => gr.punkt).map(gr => {
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
      }, o.name));
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
  onBildWeg
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
    }, "\xDCber diesen Ort ist noch nichts bekannt."), bildLeiste, unter && /*#__PURE__*/React.createElement("button", {
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
  }), /*#__PURE__*/React.createElement("span", null, "F\xFCr Spieler sichtbar")), bildLeiste, /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83D\uDDFA ", unter.name)), /*#__PURE__*/React.createElement("div", {
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
  onSpeichern,
  onLoeschen,
  onSchliessen,
  onMeldung
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
  const tagAbschliessen = () => {
    if (!heute) return;
    const eintrag = {
      nr: st.tag + 1,
      strecke: heute.strecke,
      stunden: heute.stunden,
      wetter: st.heute,
      gewaltmarsch: heute.gewaltmarsch,
      teile: heute.teile.map(t => ({
        gelaende: t.gelaende,
        strecke: t.strecke
      }))
    };
    onSpeichern({
      ...entwurf,
      pos: heute.bis,
      tagebuch: [...(entwurf.tagebuch || []), eintrag]
    });
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
  }, "Gewaltmarsch: KO-Rettungsw\xFCrfe SG ", heute.gewaltmarsch.map(g => g.sg).join(', '), " \u2014 bei Misserfolg eine Stufe Ersch\xF6pfung."), /*#__PURE__*/React.createElement("button", {
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
  }, uebergabe), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pl-knopf pl-klein",
    onClick: tagZuruecknehmen
  }, "\u21B6 Tag ", letzter.nr, " zur\xFCcknehmen")), st.plan.tage.length > 1 && /*#__PURE__*/React.createElement("details", {
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
const WERKZEUG_HINWEIS = {
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
  const [chronikZeit, setChronikZeit] = useState(null);
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
      setStart(s);
      setAdvId(planerAdvAnfang(s.abenteuer || []));
    }).catch(fehler);
  }, []);
  const laden = useCallback(async id => {
    if (!id) return;
    const d = await planerApi('planer_laden', {
      adv_id: id
    });
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
  useEffect(() => {
    if (!advId) return;
    const t = setInterval(() => {
      if (document.hidden || arbeitRef.current) return;
      planerApi('planer_stand', {
        adv_id: advId
      }).then(s => {
        if (s.stand !== standRef.current) return laden(advId);
      }).catch(() => {});
    }, PLANER_ABGLEICH_MS);
    return () => clearInterval(t);
  }, [advId]);
  const dm = !!(daten && daten.dm);
  const karten = daten ? daten.karten : [];
  const karte = karten.find(k => k.id === auswahl) || null;
  const orte = daten && karte ? daten.objekte.filter(o => o.art === 'ort' && o.karteId === karte.id) : [];
  const ort = orte.find(o => o.id === ortWahl) || null;
  const routen = daten && karte ? daten.objekte.filter(o => o.art === 'route' && o.karteId === karte.id) : [];
  const reisen = daten && karte ? daten.objekte.filter(o => o.art === 'reise' && o.karteId === karte.id) : [];
  const route = routen.find(r => r.id === routeWahl) || null;
  const reise = reisen.find(r => r.id === reiseWahl) || null;
  const reiseRoute = reise ? routen.find(r => r.id === reise.routeId) || null : null;
  // Wo jede Gruppe gerade steht.
  const gruppen = karte ? reisen.map(j => {
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
  const waehleOrt = id => {
    setOrtWahl(id);
    if (id) {
      setRouteWahl('');
      setReiseWahl('');
    }
  };
  const waehleRoute = id => {
    setRouteWahl(id);
    if (id) {
      setOrtWahl('');
      setReiseWahl('');
    }
  };
  const waehleReise = id => {
    setReiseWahl(id);
    if (id) {
      setOrtWahl('');
      setRouteWahl('');
    }
  };

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
  const aufKarteGeklickt = async p => {
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
    if (werkzeug === 'lineal' || werkzeug === 'route') {
      setPunkte(v => [...v, p]);
      return;
    }
    waehleOrt('');
    setRouteWahl('');
    setReiseWahl('');
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
          dateienListe: async k => (await planerApi('planer_dateien_liste', {
            adv_id: advId,
            karte_id: k.id
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
        dateienHoch: (karteId, liste) => planerApi('planer_dateien_hoch', {
          adv_id: advId,
          karte_id: karteId,
          dateien: liste
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
  const linie = werkzeug === 'lineal' || werkzeug === 'massstab' || werkzeug === 'route' ? {
    punkte,
    art: werkzeug
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
  })), start && /*#__PURE__*/React.createElement("span", {
    className: "pl-nutzer"
  }, start.nutzer.name), /*#__PURE__*/React.createElement("a", {
    className: "pl-knopf pl-zurueck",
    href: "../"
  }, "\u2694 Heldenbuch"))), meldung && /*#__PURE__*/React.createElement("div", {
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
    className: 'pl-haupt-flaeche' + (ort || route || reise && reiseRoute ? ' mit-tafel' : '')
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
  }, karte.sichtbar ? 'für Spieler sichtbar' : 'für Spieler verborgen'), /*#__PURE__*/React.createElement("div", {
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
  }))), werkzeug !== 'ansehen' && /*#__PURE__*/React.createElement("div", {
    className: "pl-werkzeug-hinweis",
    role: "status"
  }, /*#__PURE__*/React.createElement("span", null, WERKZEUG_HINWEIS[werkzeug]), werkzeug === 'lineal' && /*#__PURE__*/React.createElement("strong", {
    className: "pl-strecke"
  }, !karte.massstab ? 'Ohne Maßstab lässt sich nicht messen' + (dm ? ' — leg ihn mit 📏 fest.' : '.') : punkte.length > 1 ? laengeText(strecke, karte.massstab.einheit) + ' · ' + fussZeitText(strecke, karte.massstab.einheit) : ''), werkzeug === 'route' && /*#__PURE__*/React.createElement("strong", {
    className: "pl-strecke"
  }, punkte.length > 1 && karte.massstab ? laengeText(wegLaenge(punkte, karte.massstab), karte.massstab.einheit) : punkte.length + ' Punkte'), (werkzeug === 'lineal' || werkzeug === 'route') && punkte.length > 0 && /*#__PURE__*/React.createElement("button", {
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
  }, "Route anlegen"), /*#__PURE__*/React.createElement("button", {
    className: "pl-knopf pl-klein",
    onClick: () => {
      setWerkzeug('ansehen');
      setPunkte([]);
    }
  }, "Fertig")), /*#__PURE__*/React.createElement(KartenLeinwand, {
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
    onSpeichern: ortSpeichern,
    onLoeschen: ortLoeschen,
    onSchliessen: () => setOrtWahl(''),
    onUnterkarte: zurUnterkarte,
    onBilderHoch: ortBilderHoch,
    onBildWeg: ortBildWeg
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
    onSpeichern: j => objAendern({
      ...j,
      name: String(j.name || '').trim() || 'Reise'
    }),
    onLoeschen: j => objWeg(j, 'Reise löschen?', '„' + j.name + '“ wird gelöscht. Die Route bleibt.', async () => setReiseWahl('')),
    onSchliessen: () => setReiseWahl(''),
    onMeldung: setMeldung
  })), massstabFrage && /*#__PURE__*/React.createElement(MassstabDialog, {
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
let planerWurzel = null;
const planerStarten = el => {
  if (planerWurzel) planerWurzel.unmount();
  planerWurzel = ReactDOM.createRoot(el);
  planerWurzel.render( /*#__PURE__*/React.createElement(PlanerApp, null));
};
