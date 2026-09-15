// ACHTUNG: erzeugt von build.js aus planer/src/*.jsx — Aenderungen hier gehen
// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.
// Zusammengesetzt aus: 0-basis.jsx, 1-paket.jsx, 2-app.jsx
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
  useCallback
} = React;

// Die Ausgabe des Planers zaehlt eigenstaendig: er waechst in Stufen,
// die mit den Ausgaben des Heldenbuchs nichts zu tun haben.
const PLANER_VERSION = 'Stufe 0';

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
const PLAN_ARTEN = ['ort', 'route', 'figur', 'region', 'notiz', 'tabelle'];
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

// ==== planer/src/2-app.jsx ====
// ── Abenteuerplaner: die Seite ───────────────────────────────────
// Stufe 0 ist das Geruest: wer bin ich, welches Abenteuer, welche
// Karten gibt es — und das Paket hinaus und wieder hinein. Das
// Kartenbild selbst, Orte und Reisen kommen in den naechsten Stufen.
//
// Die Wege nach draussen stehen in planer/index.html (planerApi,
// planerDateiHolen, planerSpeichern, planerZugang), damit dev/planer-echt.html
// dieselbe Seite gegen ein Gedaechtnis fahren kann.

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
  arbeit
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
}))));
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
  }, /*#__PURE__*/React.createElement("span", null, k.name), dm && !k.sichtbar && /*#__PURE__*/React.createElement("span", {
    className: "pl-marke-verborgen",
    title: "F\xFCr Spieler verborgen"
  }, "verborgen")), dm && !(umName && umName.id === k.id) && /*#__PURE__*/React.createElement("span", {
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
const PlanerKarteAnsicht = ({
  karte,
  dm,
  objekte,
  dateien
}) => {
  if (!karte) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pl-buehne-leer"
    }, /*#__PURE__*/React.createElement("p", null, "W\xE4hle links eine Karte."));
  }
  const n = objekte.filter(o => o.karteId === karte.id).length;
  return /*#__PURE__*/React.createElement("section", {
    className: "pl-buehne"
  }, /*#__PURE__*/React.createElement("header", {
    className: "pl-buehne-kopf"
  }, /*#__PURE__*/React.createElement("h1", null, karte.name), dm && /*#__PURE__*/React.createElement("span", {
    className: 'pl-sicht ' + (karte.sichtbar ? 'an' : 'aus')
  }, karte.sichtbar ? 'für Spieler sichtbar' : 'für Spieler verborgen')), /*#__PURE__*/React.createElement("div", {
    className: "pl-leinwand",
    "aria-label": "Kartenfl\xE4che"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pl-leinwand-raster",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pl-leinwand-text"
  }, /*#__PURE__*/React.createElement("strong", null, "Hier liegt bald die Karte."), /*#__PURE__*/React.createElement("span", null, "Kartenbild, Zoom, Ma\xDFstab und Orte kommen mit Stufe 1."))), /*#__PURE__*/React.createElement("dl", {
    className: "pl-fakten pl-fakten-quer"
  }, /*#__PURE__*/React.createElement("dt", null, "Eintr\xE4ge"), /*#__PURE__*/React.createElement("dd", null, n), dm && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("dt", null, "Dateien"), /*#__PURE__*/React.createElement("dd", null, dateien ? dateien.anzahl + ' · ' + planGroesse(dateien.bytes) : '…'))));
};
const PlanerApp = () => {
  const zugang = planerZugang();
  const angemeldet = !!(zugang.token && zugang.code);
  const [start, setStart] = useState(null);
  const [advId, setAdvId] = useState('');
  const [daten, setDaten] = useState(null);
  const [auswahl, setAuswahl] = useState('');
  const [dateien, setDateien] = useState(null);
  const [meldung, setMeldung] = useState(null);
  const [frage, setFrage] = useState(null);
  const [arbeit, setArbeit] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const standRef = useRef(0);
  const arbeitRef = useRef(false);
  const dateiEingabe = useRef(null);
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
  const ausfuehren = async (titel, f) => {
    arbeitRef.current = true;
    setArbeit({
      titel,
      text: '',
      anteil: 0
    });
    try {
      return await f((text, anteil) => setArbeit(a => ({
        ...a,
        text,
        anteil: anteil === undefined ? a.anteil : anteil
      })));
    } finally {
      arbeitRef.current = false;
      setArbeit(null);
    }
  };
  const karteSpeichern = async k => {
    const r = await planerApi('planer_karte_speichern', {
      adv_id: advId,
      karte: k
    });
    return r.karte;
  };
  const neueKarte = async name => {
    try {
      const k = await karteSpeichern({
        id: planNeueId('k'),
        name,
        sichtbar: false
      });
      await laden(advId);
      setAuswahl(k.id);
    } catch (e) {
      fehler(e);
    }
  };
  const karteAendern = async (k, aenderung) => {
    try {
      const {
        ablage,
        ...ohne
      } = k;
      await karteSpeichern({
        ...ohne,
        ...aenderung
      });
      await laden(advId);
    } catch (e) {
      fehler(e);
    }
  };
  const karteLoeschen = k => setFrage({
    titel: 'Karte löschen?',
    text: '„' + k.name + '“ wird mit allen Einträgen und Dateien gelöscht. Das lässt sich nicht rückgängig machen — wer sichergehen will, exportiert vorher.',
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
        objSpeichern: o => planerApi('planer_obj_speichern', {
          adv_id: advId,
          obj: o
        }),
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
      if (ersteKarte) setAuswahl(ersteKarte);
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
    className: "pl-haupt-flaeche"
  }, /*#__PURE__*/React.createElement(PlanerKartenListe, {
    karten: karten,
    auswahl: auswahl,
    dm: dm,
    onWahl: setAuswahl,
    onNeu: neueKarte,
    onUmbenennen: (id, name) => karteAendern(karten.find(k => k.id === id), {
      name
    }),
    onSichtbar: k => karteAendern(k, {
      sichtbar: !k.sichtbar
    }),
    onLoeschen: karteLoeschen
  }), /*#__PURE__*/React.createElement(PlanerKarteAnsicht, {
    karte: karte,
    dm: dm,
    objekte: daten.objekte,
    dateien: dateien
  })), vorschau && /*#__PURE__*/React.createElement(PlanerImportVorschau, {
    vorschau: vorschau,
    onEinspielen: einspielen,
    onZu: () => setVorschau(null)
  }), frage && /*#__PURE__*/React.createElement(PlanerFrage, {
    frage: frage,
    onZu: () => setFrage(null)
  }), arbeit && /*#__PURE__*/React.createElement(PlanerArbeit, {
    arbeit: arbeit
  }));
};

// Der Einstieg — aus planer/index.html und aus dev/planer-echt.html.
let planerWurzel = null;
const planerStarten = el => {
  if (planerWurzel) planerWurzel.unmount();
  planerWurzel = ReactDOM.createRoot(el);
  planerWurzel.render( /*#__PURE__*/React.createElement(PlanerApp, null));
};
