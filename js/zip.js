// Heldenbuch — ZIP schreiben und lesen, im Browser, ohne Bibliothek.
//
// Beide Seiten brauchen es: der Planer fuer sein .hbplan (Karten mit
// Tausenden Kacheln) und das Heldenbuch fuer ein Buendel Boegen als
// Textdateien. Deshalb steht es hier und nicht in einem der beiden
// Buendel — geladen von index.html und planer/index.html.
//
// Schon gepackte Dateien (Bilder) gehen ungepackt hinein (Methode 0),
// Text wird mit dem eingebauten CompressionStream gepackt (Methode 8).
// Mehr als 65 535 Dateien oder mehr als 4 GB schreiben das
// ZIP64-Verzeichnis dazu.
//
// Reine Rechnung: geprueft von dev/pruefungen/planer-paket-test.js.

// ── CRC-32 ───────────────────────────────────────────────────────
const CRC_TAFEL = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (bytes, vorher) => {
  let c = (vorher === undefined ? 0 : vorher) ^ 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TAFEL[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

// ── Kleinkram ────────────────────────────────────────────────────
const alsBytes = async (x) => {
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
const packen   = (bytes) => durchStrom(bytes, new CompressionStream('deflate-raw'));
const entpacken = (bytes) => durchStrom(bytes, new DecompressionStream('deflate-raw'));

// Zeit im Format von MS-DOS: zwei Sekunden genau, ab 1980.
const dosZeit = (d) => {
  const jahr = Math.max(1980, d.getFullYear());
  return {
    zeit: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    datum: ((jahr - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
};
// 64-Bit-Zahlen als zwei Haelften: DataView kann BigInt, aber Zahlen bis
// 2^53 genuegen fuer jede Datei, die ein Browser anfassen mag.
const setU64 = (dv, pos, n) => { dv.setUint32(pos, n % 0x100000000, true); dv.setUint32(pos + 4, Math.floor(n / 0x100000000), true); };
const getU64 = (dv, pos) => dv.getUint32(pos, true) + dv.getUint32(pos + 4, true) * 0x100000000;

// ── Schreiben ────────────────────────────────────────────────────
// eintraege: [{name, daten, packen}] — daten als Uint8Array, Blob oder
// Text. grenzen nur fuer die Pruefungen: damit ZIP64 ohne 4 GB Testdaten
// geprueft werden kann.
const ZIP_GRENZEN = { anzahl: 0xFFFF, bytes: 0xFFFFFFFF };
const zipSchreiben = async (eintraege, opt) => {
  const o = opt || {};
  const grenzen = o.grenzen || ZIP_GRENZEN;
  const { zeit, datum } = dosZeit(o.jetzt || new Date());
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
    let daten = roh, methode = 0;
    if (e.packen) {
      const gepackt = await packen(roh);
      // Was sich nicht verkleinert, bleibt, wie es ist.
      if (gepackt.length < roh.length) { daten = gepackt; methode = 8; }
    }
    const name = new TextEncoder().encode(e.name);
    const kopf = new DataView(new ArrayBuffer(30));
    kopf.setUint32(0, 0x04034b50, true);
    kopf.setUint16(4, 20, true);
    kopf.setUint16(6, 0x0800, true);            // Namen in UTF-8
    kopf.setUint16(8, methode, true);
    kopf.setUint16(10, zeit, true);
    kopf.setUint16(12, datum, true);
    kopf.setUint32(14, crc, true);
    kopf.setUint32(18, daten.length, true);
    kopf.setUint32(22, roh.length, true);
    kopf.setUint16(26, name.length, true);
    kopf.setUint16(28, 0, true);
    teile.push(new Uint8Array(kopf.buffer), name, daten);
    zentral.push({ name, methode, crc, gepackt: daten.length, roh: roh.length, pos });
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
  return new Blob(teile, { type: 'application/zip' });
};

// ── Lesen ────────────────────────────────────────────────────────
// Liest nur das Verzeichnis am Ende; jede Datei wird erst geholt, wenn
// sie gebraucht wird. Eine Datei von mehreren Hundert MB muss so nie
// ganz in den Speicher.
const ZIP_MAX_DATEI = 200 * 1024 * 1024;     // gegen Entpackbomben
const zipLesen = async (blob) => {
  const groesse = blob.size;
  if (groesse < 22) throw new Error('Das ist keine Paketdatei (zu kurz).');
  const hinten = Math.min(groesse, 22 + 65535 + 20);
  const schwanz = new Uint8Array(await blob.slice(groesse - hinten).arrayBuffer());
  const sdv = new DataView(schwanz.buffer);
  let e = -1;
  for (let i = schwanz.length - 22; i >= 0; i--) {
    if (sdv.getUint32(i, true) === 0x06054b50) { e = i; break; }
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
      const art = dv.getUint16(x, true), len = dv.getUint16(x + 2, true);
      if (art === 0x0001) {
        let q = x + 4;
        if (roh === 0xFFFFFFFF)     { roh = getU64(dv, q); q += 8; }
        if (gepackt === 0xFFFFFFFF) { gepackt = getU64(dv, q); q += 8; }
        if (pos === 0xFFFFFFFF)     { pos = getU64(dv, q); q += 8; }
      }
      x += 4 + len;
    }
    eintraege.push({ name, methode, crc, gepackt, roh, pos });
    p = xEnde + kommLen;
  }
  const lesen = async (eintrag) => {
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
  return { eintraege, lesen, finden: (name) => nachName.get(name) || null };
};
