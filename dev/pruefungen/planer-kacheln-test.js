// Prueft die Kartenrechnung des Abenteuerplaners: Bildmasse aus dem
// Dateikopf, die Kachelpyramide, die Ansicht (Zoom um den Mauszeiger,
// sichtbare Kacheln), Maßstab und Lineal, und die Reihenfolge beim
// Erzeugen und Hochladen der Kacheln.
const fs = require('fs');
const stueck = (datei) => { const t = fs.readFileSync(datei, 'utf8'); return t.slice(0, t.indexOf('// ══ Ende der reinen Rechnung')); };
const quelle = stueck('planer/src/1-paket.jsx') + '\n' + stueck('planer/src/1b-kacheln.jsx');
const namen = [...quelle.matchAll(/^const ([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1]);
eval(quelle + ';globalThis.M = {' + namen.join(', ') + '};');
Object.assign(globalThis, M);

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};
const nah = (a, b) => Math.abs(a - b) < 1e-6;

(async () => {
  // ── Bildmasse ──────────────────────────────────────────────────
  const bytes = (...teile) => Uint8Array.from(teile.flat());
  const be32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const le16 = (n) => [n & 255, (n >> 8) & 255];
  const le24 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255];
  const le32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  const ascii = (s) => [...s].map(c => c.charCodeAt(0));

  ist('PNG', bildMasse(bytes([0x89], ascii('PNG\r\n\x1a\n'), be32(13), ascii('IHDR'), be32(20000), be32(15000), [8, 6, 0, 0, 0])),
    { art: 'png', breite: 20000, hoehe: 15000 });
  ist('GIF', bildMasse(bytes(ascii('GIF89a'), le16(640), le16(480), [0, 0])), { art: 'gif', breite: 640, hoehe: 480 });
  ist('JPEG hinter APP0 und DQT (progressiv, SOF2)', bildMasse(bytes(
    [0xFF, 0xD8], [0xFF, 0xE0], [0, 16], Array(14).fill(1), [0xFF, 0xDB], [0, 4], [0, 0],
    [0xFF, 0xC2], [0, 17], [8], [0x3A, 0x98], [0x4E, 0x20], [3], Array(9).fill(0))),
    { art: 'jpeg', breite: 20000, hoehe: 15000 });
  ist('JPEG ohne Bildkopf gibt nichts', bildMasse(bytes([0xFF, 0xD8, 0xFF, 0xDA, 0, 4, 0, 0, 0, 0, 0, 0])), null);
  const riff = (teil, rest) => bytes(ascii('RIFF'), le32(100), ascii('WEBP'), ascii(teil), le32(80), rest, Array(20).fill(0));
  ist('WebP erweitert (VP8X)', bildMasse(riff('VP8X', [0x10, 0, 0, 0, ...le24(4095), ...le24(2999)])), { art: 'webp', breite: 4096, hoehe: 3000 });
  const vp8l = ((999) | (699 << 14)) >>> 0;
  ist('WebP verlustfrei (VP8L)', bildMasse(riff('VP8L', [0x2F, ...le32(vp8l)])), { art: 'webp', breite: 1000, hoehe: 700 });
  ist('WebP verlustbehaftet (VP8)', bildMasse(riff('VP8 ', [0, 0, 0, 0x9D, 0x01, 0x2A, ...le16(1920), ...le16(1080)])), { art: 'webp', breite: 1920, hoehe: 1080 });
  ist('Unbekanntes gibt nichts', bildMasse(bytes(ascii('%PDF-1.7'), Array(30).fill(0))), null);

  // ── Die Pyramide ───────────────────────────────────────────────
  const p = kachelPlan(1000, 700);
  ist('1000 × 700 braucht drei Stufen', p.maxZ, 2);
  ist('  … Stufe 0 passt in eine Kachel', [p.stufen[0].breite, p.stufen[0].hoehe, p.stufen[0].spalten, p.stufen[0].zeilen], [250, 175, 1, 1]);
  ist('  … die oberste ist 1:1', [p.stufen[2].faktor, p.stufen[2].spalten, p.stufen[2].zeilen], [1, 4, 3]);
  ist('  … zusammen 17 Kacheln', p.anzahl, 17);
  const flaecheGleich = p.stufen.every(s => {
    let f = 0;
    kachelnDerStufe(p, s.z).forEach(t => { const k = kachelZiel(p, t.z, t.x, t.y); f += k.breite * k.hoehe; });
    return f === s.breite * s.hoehe;
  });
  ist('die Kacheln jeder Stufe decken genau das Bild', flaecheGleich, true);
  ist('eine Randkachel ist kleiner', kachelZiel(p, 2, 3, 2), { lx: 768, ly: 512, breite: 232, hoehe: 188 });
  ist('eine grosse Weltkarte (16 384²)', [kachelPlan(16384, 16384).maxZ, kachelPlan(16384, 16384).anzahl], [6, 5461]);
  ist('ein winziges Bild hat eine Stufe', [kachelPlan(100, 40).maxZ, kachelPlan(100, 40).anzahl], [0, 1]);
  ist('der Kachelpfad passt zur Regel des Servers', PLAN_PFAD_RE.test(kachelPfad('b3', 6, 62, 17, 'webp')), true);

  // ── Die Ansicht ────────────────────────────────────────────────
  const g = { breite: 800, hoehe: 600 };
  const w = kachelPlan(8000, 6000);   // maxZ 5
  const a = { zoom: 3, x: 4000, y: 3000 };
  const bp = { x: 5123, y: 1234 };
  const zurueck = schirmZuBild(bildZuSchirm(bp, a, g, w), a, g, w);
  ist('Bild → Schirm → Bild kommt zurueck', nah(zurueck.x, bp.x) && nah(zurueck.y, bp.y), true);
  ist('die Mitte der Ansicht liegt in der Mitte des Fensters', bildZuSchirm({ x: 4000, y: 3000 }, a, g, w), { x: 400, y: 300 });
  const maus = { x: 130, y: 470 };
  const vorher = schirmZuBild(maus, a, g, w);
  const z2 = zoomUm(a, maus, 4.25, g, w);
  const nachher = schirmZuBild(maus, z2, g, w);
  ist('beim Zoomen bleibt der Punkt unter der Maus stehen', nah(vorher.x, nachher.x) && nah(vorher.y, nachher.y), true);
  const ein = ansichtEinpassen(w, g);
  const ecke = bildZuSchirm({ x: 8000, y: 6000 }, ein, g, w);
  ist('Einpassen zeigt das ganze Bild', ecke.x <= 800 && ecke.y <= 600 && ecke.x > 700, true);
  ist('Zoom ist nach oben begrenzt', ansichtBegrenzen({ zoom: 99, x: 0, y: 0 }, w, g).zoom, 7);
  ist('die Mitte bleibt auf dem Bild', ansichtBegrenzen({ zoom: 3, x: -50, y: 9000 }, w, g), { zoom: 3, x: 0, y: 6000 });
  ist('Verschieben um 100 Schirmpixel bei Stufe 3 (1:4)', verschieben(a, 100, -50, w, g), { zoom: 3, x: 3600, y: 3200 });
  ist('welche Stufe geladen wird', [stufeFuer(-2, w), stufeFuer(3, w), stufeFuer(3.2, w), stufeFuer(3.5, w), stufeFuer(9, w)], [0, 3, 3, 4, 5]);
  const sicht = sichtbareKacheln(a, g, w, 3);
  ist('bei Stufe 3 (1:4) sind 4 × 4 Kacheln zu sehen', sicht.length, 16);
  ist('  … jede liegt dort, wo ihr Bildausschnitt hingehoert',
    sicht.every(t => { const o = bildZuSchirm({ x: t.x * 256 * 4, y: t.y * 256 * 4 }, a, g, w); return nah(o.x, t.links) && nah(o.y, t.oben); }), true);
  ist('  … und die Kacheln ueberdecken das Fenster',
    Math.min(...sicht.map(t => t.links)) <= 0 && Math.max(...sicht.map(t => t.links + t.breite)) >= 800
    && Math.min(...sicht.map(t => t.oben)) <= 0 && Math.max(...sicht.map(t => t.oben + t.hoehe)) >= 600, true);
  ist('eine viel zu scharfe Stufe fuer die Ansicht laedt nichts', sichtbareKacheln({ zoom: -1, x: 4000, y: 3000 }, { breite: 4000, hoehe: 4000 }, kachelPlan(64000, 64000), 8).length, 0);
  ist('ausserhalb des Bilds keine Kacheln', sichtbareKacheln({ zoom: 5, x: 8000, y: 6000 }, { breite: 10, hoehe: 10 }, w, 5).length, 1);

  // ── Maßstab und Lineal ─────────────────────────────────────────
  const m = massstabAus({ x: 0, y: 0 }, { x: 300, y: 400 }, 100, 'km');
  ist('500 Pixel sind 100 km: 5 Pixel je km', pxJeEinheit(m), 5);
  ist('ein Maßstab ohne Laenge gibt es nicht', massstabAus({ x: 0, y: 0 }, { x: 3, y: 4 }, 0, 'km'), null);
  ist('ein Maßstab auf einen Punkt auch nicht', massstabAus({ x: 5, y: 5 }, { x: 5, y: 5 }, 10, 'km'), null);
  ist('das Lineal addiert die Strecken', wegLaenge([{ x: 0, y: 0 }, { x: 300, y: 400 }, { x: 300, y: 900 }], m), 200);
  ist('ohne Maßstab misst es nichts', wegLaenge([{ x: 0, y: 0 }, { x: 1, y: 1 }], null), 0);
  ist('Laengen lesbar', [laengeText(200, 'km'), laengeText(12.345, 'km'), laengeText(0.5, 'mi')], ['200 km', '12,3 km', '0,5 mi']);
  ist('zu Fuss: 200 km', fussZeitText(200, 'km'), '≈ 5 Tage 4 Std. zu Fuß');
  ist('zu Fuss: 3 km', fussZeitText(3, 'km'), '≈ 40 Min. zu Fuß');
  ist('zu Fuss: 18 km', fussZeitText(18, 'km'), '≈ 4 Std. zu Fuß');
  ist('zu Fuss: 24 Meilen sind ein Tag', fussZeitText(24, 'mi'), '≈ 1 Tag zu Fuß');
  const leiste = massstabLeiste(m, { zoom: w.maxZ, x: 0, y: 0 }, w, 110);
  ist('die Maßstabsleiste nimmt eine runde Laenge', [leiste.laenge, leiste.px, leiste.text], [20, 100, '20 km']);
  ist('Orte wandern mit, wenn das Bild groesser wird', punktSkalieren({ x: 100, y: 50 }, { breite: 1000, hoehe: 700 }, { breite: 2000, hoehe: 1400 }), { x: 200, y: 100 });

  // ── Kacheln erzeugen ───────────────────────────────────────────
  const gezeichnet = [], hoch = [], stufen = [];
  const zeichne = async (z, x, y) => { gezeichnet.push(z + '/' + x + '/' + y); return { pfad: kachelPfad('b1', z, x, y), bytes: new Uint8Array(100000) }; };
  zeichne.stufe = async (z) => { stufen.push(z); };
  const meldungen = [];
  let gleichzeitig = 0, hoechstens = 0;
  const erg = await kachelnErzeugen({
    plan: p, zeichne, buendelBytes: 250000, parallel: 2, melde: (t) => meldungen.push(t),
    hochladen: async (b) => { gleichzeitig++; hoechstens = Math.max(hoechstens, gleichzeitig); await new Promise(r => setTimeout(r, 5)); hoch.push(b.map(d => d.pfad)); gleichzeitig--; },
  });
  ist('alle 17 Kacheln gezeichnet', [erg.anzahl, gezeichnet.length], [17, 17]);
  ist('  … jede Stufe wird vorbereitet, von grob nach fein', stufen, [0, 1, 2]);
  const allePfade = hoch.flat();
  ist('  … jede genau einmal hochgeladen', [allePfade.length, new Set(allePfade).size], [17, 17]);
  ist('  … in Buendeln unter der Grenze', hoch.map(b => b.length), [3, 3, 3, 3, 3, 2]);
  ist('  … nie mehr als zwei Buendel zugleich', hoechstens <= 2, true);
  ist('  … mit Meldung am Ende', /17 von 17/.test(meldungen[meldungen.length - 1]), true);

  let wurf = '';
  try {
    await kachelnErzeugen({ plan: p, zeichne: async (z, x, y) => ({ pfad: 'x.webp', bytes: new Uint8Array(10) }), hochladen: async () => {}, abgebrochen: () => true });
  } catch (e) { wurf = e.message; }
  ist('Abbrechen haelt an', wurf, 'Abgebrochen.');
  wurf = '';
  let weiterGezeichnet = 0;
  try {
    await kachelnErzeugen({ plan: kachelPlan(16384, 16384), buendelBytes: 1,
      zeichne: async () => { weiterGezeichnet++; return { pfad: 'x.webp', bytes: new Uint8Array(10) }; },
      hochladen: async () => { throw new Error('Speicher voll'); } });
  } catch (e) { wurf = e.message; }
  ist('ein Fehler beim Hochladen bricht ab', wurf, 'Speicher voll');
  ist('  … und es wird nicht die ganze Weltkarte weitergezeichnet', weiterGezeichnet < 10, true);

  console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.log('  FEHLER Abbruch: ' + e.stack); console.log('\n0 Pruefungen gut, 1 schlecht.'); process.exit(1); });
