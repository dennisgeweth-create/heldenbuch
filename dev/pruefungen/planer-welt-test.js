// Prueft die Welt des Abenteuerplaners: Zeit und Figuren, Verweise auf
// lokale Dateien, Quests, Wissen, Fraktionen, Proviant und Navigation,
// Hexfelder und die Dateien fuer den Offline-Vorrat.
const fs = require('fs');
const stueck = (datei) => { const t = fs.readFileSync(datei, 'utf8'); return t.slice(0, t.indexOf('// ══ Ende der reinen Rechnung')); };
const quelle = ['1-paket', '1b-kacheln', '1c-reise', '1d-begegnung', '1e-sicht', '1f-welt'].map(n => stueck('planer/src/' + n + '.jsx')).join('\n');
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

// ── Zeit und Figuren ─────────────────────────────────────────────
ist('Zeit lesbar wie die Chronik', [zeitText(0), zeitText(37), zeitText(24 * 9 + 23)], ['Tag 1, 00 Uhr', 'Tag 2, 13 Uhr', 'Tag 10, 23 Uhr']);
ist('Tag und Stunde zurück in Stunden', [zeitAus(2, 13), zeitAus(1, 0), zeitAus(0, 99)], [37, 0, 23]);
const karawane = { id: 'f1', art: 'figur', wegpunkte: [{ zeit: 48, x: 1000, y: 0 }, { zeit: 24, x: 0, y: 0 }, { zeit: 72, x: 1000, y: 0 }] };
ist('Wegpunkte werden nach Zeit geordnet', wegpunkteSortiert(karawane).map(w => w.zeit), [24, 48, 72]);
ist('vor dem ersten Wegpunkt am ersten', figurPosition(karawane, 0), { x: 0, y: 0, unterwegs: false, von: { zeit: 24, x: 0, y: 0 }, bis: { zeit: 24, x: 0, y: 0 } });
const mitte = figurPosition(karawane, 36);
ist('dazwischen auf halbem Weg, unterwegs', [mitte.x, mitte.y, mitte.unterwegs], [500, 0, true]);
ist('zwischen zwei gleichen Punkten steht sie', figurPosition(karawane, 60).unterwegs, false);
ist('nach dem letzten am letzten', [figurPosition(karawane, 999).x, figurPosition(karawane, 999).unterwegs], [1000, false]);
ist('ohne Wegpunkte nirgends', figurPosition({ wegpunkte: [] }, 5), null);
const neu = wegpunktSetzen(karawane, 36, { x: 200.4, y: 50.6 }, 'Rast an der Brücke');
ist('ein Wegpunkt wird eingefügt und geordnet', neu.wegpunkte.map(w => [w.zeit, w.x, w.y]), [[24, 0, 0], [36, 200, 51], [48, 1000, 0], [72, 1000, 0]]);
ist('  … zur selben Zeit ersetzt, die Notiz bleibt', wegpunktSetzen(neu, 36, { x: 300, y: 0 }).wegpunkte.find(w => w.zeit === 36), { zeit: 36, x: 300, y: 0, notiz: 'Rast an der Brücke' });
ist('  … die Vorlage bleibt unberührt', karawane.wegpunkte.length, 3);
ist('der Zeitschieber reicht über alle Wegpunkte und die Chronik', zeitBereich([karawane], 100), { min: 0, max: 124 });
ist('  … ohne alles eine Woche', zeitBereich([], null), { min: 0, max: 168 });
ist('Spieler sehen die Figur zur freigegebenen Zeit', figurFuerSpieler(karawane, { zeit: 36 }).x, 500);
ist('  … ohne Freigabe am ersten Wegpunkt', figurFuerSpieler(karawane, {}).x, 0);

// ── Lokale Dateien ───────────────────────────────────────────────
ist('Dateiarten', ['a.MP3', 'karte.png', 'film.mkv', 'regel.pdf', 'x.exe', 'ohne'].map(dateiArt), ['ton', 'bild', 'video', 'dokument', 'sonst', 'sonst']);
ist('was der Browser selbst zeigt', ['a.mp3', 'film.mkv', 'regel.pdf', 'brief.docx'].map(imBrowserZeigbar), [true, false, true, false]);
ist('relative Pfade werden sauber', [relativerPfad('Musik\\Taverne.mp3'), relativerPfad('./Musik//a.mp3'), relativerPfad('a/b/c.png')], ['Musik/Taverne.mp3', 'Musik/a.mp3', 'a/b/c.png']);
ist('  … aber nie hinaus oder absolut', ['../x.mp3', 'a/../../x', 'C:\\Windows\\x.exe', '/etc/passwd', '\\\\server\\x', 'a/b:c', ''].map(relativerPfad), ['', '', '', '', '', '', '']);
ist('Bibliotheksnamen ohne Sonderzeichen', [bibliotheksName(' Kampagne '), bibliotheksName('Strahd/../'), bibliotheksName('Ümläut 2')], ['Kampagne', 'Strahd', 'Ümläut 2']);
ist('ein Verweis', dateiVerweis('Kampagne', 'Musik\\Taverne.mp3'), { bibliothek: 'Kampagne', pfad: 'Musik/Taverne.mp3', titel: 'Taverne.mp3' });
ist('  … ein ungültiger gibt keinen', [dateiVerweis('', 'a.mp3'), dateiVerweis('K', '../a.mp3')], [null, null]);
ist('die Adresse für die Brücke', brueckenAdresse({ bibliothek: 'Kampagne', pfad: 'Musik/Taverne & Tanz.mp3' }),
  'heldenbuch-planer://oeffnen?bibliothek=Kampagne&pfad=Musik%2FTaverne%20%26%20Tanz.mp3');
const bruecke = fs.readFileSync('planer/bruecke/planer-bruecke.ps1', 'utf8');
ist('die Brücke kennt dasselbe Schema', bruecke.includes("'" + BRUECKE_SCHEMA + "'"), true);
ist('  … und öffnet dieselben Endungen, keine mehr', (() => {
  const m = /\$Erlaubt\s*=\s*@\(([^)]*)\)/.exec(bruecke);
  const ps = m ? [...m[1].matchAll(/'([a-z0-9]+)'/g)].map(x => x[1]).sort() : [];
  return JSON.stringify(ps) === JSON.stringify(Object.values(DATEI_ARTEN).flat().sort());
})(), true);

// ── Quests, Wissen, Fraktionen ───────────────────────────────────
const q = { ...neueQuest(), schritte: [{ text: 'a', erledigt: true }, { text: 'b', erledigt: false }] };
ist('eine neue Quest gehört zu keiner Karte und ist verborgen', [q.karteId, q.sichtbar, q.art, /^q_/.test(q.id)], ['', false, 'quest', true]);
ist('Fortschritt', questFortschritt(q), { fertig: 1, alle: 2 });
ist('Quests: offene zuerst, dann nach Titel', questsSortiert([{ titel: 'Z', status: 'erledigt' }, { titel: 'B', status: 'aktiv' }, { titel: 'A', status: 'aktiv' }, { titel: 'C' }]).map(x => x.titel), ['C', 'A', 'B', 'Z']);
ist('Status mit Zeichen', [questStatus('aktiv').zeichen, questStatus('gibtsnicht').l], ['❗', 'Gehört']);
const wissen = [{ art: 'hinweis', sichtbar: true, ortId: 'o1' }, { art: 'hinweis', sichtbar: false, ortId: 'o1' }, { art: 'hinweis', sichtbar: true, ortId: 'o2' }];
ist('bekanntes Wissen an einem Ort', bekanntesWissen(wissen, 'o1').length, 1);
ist('  … und überhaupt', bekanntesWissen(wissen).length, 2);
ist('ob ein Gerücht wahr ist, steht unter dm', neuerHinweis().dm.wahr, 'wahr');
ist('Ruf in Worten, begrenzt', [rufText(-5), rufText(0), rufText(2), rufText(2.4)], ['Verfeindet', 'Neutral', 'Freundlich', 'Freundlich']);
ist('Fraktionen einer Region', fraktionenDerRegion([{ id: 'a', regionen: ['g1'] }, { id: 'b', regionen: [] }], 'g1').map(f => f.id), ['a']);
ist('ein Paket mit einer Quest ohne Karte ist gültig', planManifestPruefen(planManifest({ karten: [], objekte: [q], dateien: [] })), '');
ist('der Tisch zeigt eine sichtbare Quest ohne Karte', spielerSicht({ karten: [], objekte: [{ ...q, sichtbar: true }] }).objekte.length, 1);

// ── Proviant und Navigation ──────────────────────────────────────
ist('ein Tag für vier: 4 Rationen, 16 l', vorratNachTag({ rationen: 10, wasserLiter: 20 }, 4), { vorrat: { rationen: 6, wasserLiter: 4 }, fehlt: { rationen: 0, wasserLiter: 0 }, reichtTage: 1 });
ist('  … fehlt etwas, steht es da', vorratNachTag({ rationen: 2, wasserLiter: 0 }, 4).fehlt, { rationen: 2, wasserLiter: 16 });
ist('Navigation: Straße keine Probe, Wald SG 15', [navigationSg({ teile: [{ gelaende: 'strasse' }] }), navigationSg({ teile: [{ gelaende: 'strasse' }, { gelaende: 'wald' }] })], [0, 15]);
ist('  … als Auftrag an das Heldenbuch: Überlebenskunst', auftragNavigation('strahd', 15, 'Tag 3'), { art: 'probe', advId: 'strahd', probeArt: 'fert', wert: 'ueberleben', sg: 15, text: 'Tag 3' });
ist('  … „ueberleben“ ist die Fertigkeit im Heldenbuch', /key:"ueberleben"/.test(fs.readFileSync('js/data.js', 'utf8')), true);

// ── Hexfelder ────────────────────────────────────────────────────
const km = massstabAus({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 'km');
const r = hexRadiusPx(10, km);
ist('ein Feld von 10 km: Radius 100/√3 Pixel', nah(r, 100 / Math.sqrt(3)), true);
ist('Mitte → Feld → Mitte', [0, 1, 2, -3].every(qq => [0, 1, -2, 5].every(rr => { const m = hexMitte({ q: qq, r: rr }, r); const h = hexAchsial(m, r); return h.q === qq && h.r === rr; })), true);
ist('von Seite zu Seite 10 km', nah(hexMitte({ q: 1, r: 0 }, r).x - hexMitte({ q: 0, r: 0 }, r).x, 100), true);
ist('ein Punkt nahe der Mitte gehört zum Feld', hexAchsial({ x: hexMitte({ q: 3, r: 2 }, r).x + 10, y: hexMitte({ q: 3, r: 2 }, r).y - 10 }, r), { q: 3, r: 2 });
ist('sechs Ecken', hexEcken({ x: 0, y: 0 }, 10).length, 6);
ist('Adressen Spalte.Zeile', [hexAdresse({ q: 0, r: 0 }), hexAdresse({ q: 11, r: 6 }), hexAdresse({ q: 0, r: 1 })], ['01.01', '15.07', '01.02']);
ist('Felder im Ausschnitt, oder keine, wenn es zu viele sind', [hexeIm(0, 0, 500, 500, r).length > 20, hexeIm(0, 0, 50000, 50000, r).length], [true, 0]);
ist('  … sie decken den Ausschnitt', [[10, 10], [250, 250], [490, 480]].every(([x, y]) => { const h = hexAchsial({ x, y }, r); return hexeIm(0, 0, 500, 500, r).some(f => f.q === h.q && f.r === h.r); }), true);

// ── Offline ──────────────────────────────────────────────────────
const karte = { id: 'k1', ablage: 'a'.repeat(32), bild: { breite: 1000, hoehe: 700, kachel: 256, ordner: 'b2', endung: 'webp', vorschau: 'b2/vorschau.webp' } };
const pfade = offlinePfade(karte, [{ art: 'ort', karteId: 'k1', bilder: ['orte/o1/x.webp', 'orte/o1/x.webp'] }, { art: 'ort', karteId: 'k2', bilder: ['y.webp'] }, { art: 'handout', ablage: 'c'.repeat(32), bild: 'bild.webp' }]);
ist('offline: 17 Kacheln, Vorschau, das Ortsbild einmal, das Handout', pfade.length, 20);
ist('  … mit der richtigen Ablage', [pfade[0], pfade[pfade.length - 1]], [{ ablage: 'a'.repeat(32), pfad: 'b2/0/0/0.webp' }, { ablage: 'c'.repeat(32), pfad: 'bild.webp' }]);
ist('der gespeicherte Stand trägt seine Zeit', JSON.parse(offlineStand({ a: 1 }, { b: 2 }, new Date('2026-09-15T20:00:00Z'))).zeit, '2026-09-15T20:00:00.000Z');

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
