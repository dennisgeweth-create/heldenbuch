// Prueft das Paket des Abenteuerplaners: CRC-32, ZIP schreiben und lesen
// (auch ZIP64), die Beschreibung hbplan.json, das Umschreiben der
// Kennungen und den ganzen Weg Export → Einspielen gegen ein Gedaechtnis
// statt eines Servers.
const fs = require('fs');
const paket = fs.readFileSync('planer/src/1-paket.jsx', 'utf8');
const quelle = paket.slice(0, paket.indexOf('// ══ Ende der reinen Rechnung'));
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
const wirft = async (n, f, muster) => {
  try { await f(); schlecht++; console.log('  FEHLER ' + n + '\n     warf nicht'); }
  catch (e) {
    if (muster.test(e.message)) gut++;
    else { schlecht++; console.log('  FEHLER ' + n + '\n     ist  ' + e.message + '\n     soll ' + muster); }
  }
};
const text = (s) => new TextEncoder().encode(s);
const gleich = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

(async () => {
  // ── CRC-32 ─────────────────────────────────────────────────────
  ist('CRC-32 des Pruefworts 123456789', crc32(text('123456789')).toString(16), 'cbf43926');
  ist('CRC-32 von nichts ist 0', crc32(new Uint8Array(0)), 0);
  ist('in zwei Stuecken gerechnet dasselbe',
    crc32(text('56789'), crc32(text('1234'))), crc32(text('123456789')));

  // ── ZIP: schreiben und wieder lesen ────────────────────────────
  const bild = new Uint8Array(3000).map((_, i) => (i * 7919) % 251);
  const json = JSON.stringify({ worte: 'Barovia '.repeat(400) });
  const jetzt = new Date(2026, 8, 15, 20, 15, 42);
  const blob = await zipSchreiben([
    { name: 'hbplan.json', daten: json, packen: true },
    { name: 'karten/k_1/kacheln/0/0/0.webp', daten: bild },
    { name: 'karten/k_1/Übersicht.png', daten: new Blob([bild.subarray(0, 10)]) },
  ], { jetzt });
  const zip = await zipLesen(blob);
  ist('drei Eintraege im Verzeichnis', zip.eintraege.map(e => e.name),
    ['hbplan.json', 'karten/k_1/kacheln/0/0/0.webp', 'karten/k_1/Übersicht.png']);
  ist('das JSON ist gepackt (Methode 8)', zip.finden('hbplan.json').methode, 8);
  ist('  … und kleiner als vorher', zip.finden('hbplan.json').gepackt < json.length, true);
  ist('das Bild bleibt ungepackt (Methode 0)', zip.finden('karten/k_1/kacheln/0/0/0.webp').methode, 0);
  ist('das JSON kommt unversehrt zurueck',
    new TextDecoder().decode(await zip.lesen(zip.finden('hbplan.json'))), json);
  ist('das Bild ebenso', gleich(await zip.lesen(zip.finden('karten/k_1/kacheln/0/0/0.webp')), bild), true);
  ist('ein Name mit Umlaut und aus einem Blob', (await zip.lesen(zip.finden('karten/k_1/Übersicht.png'))).length, 10);
  ist('finden kennt Unbekanntes nicht', zip.finden('gibt/es/nicht'), null);

  // Die Bytes selbst: ein anderes Programm muss das lesen koennen.
  const roh = new Uint8Array(await blob.arrayBuffer());
  const dv = new DataView(roh.buffer);
  ist('beginnt mit dem Kopf einer lokalen Datei (PK\\3\\4)', dv.getUint32(0, true), 0x04034b50);
  ist('endet mit dem Verzeichnisende (PK\\5\\6)', dv.getUint32(roh.length - 22, true), 0x06054b50);
  ist('Namen sind als UTF-8 markiert', dv.getUint16(6, true) & 0x0800, 0x0800);
  ist('die Uhrzeit steht im DOS-Format', dv.getUint16(10, true), (20 << 11) | (15 << 5) | 21);
  ist('das Datum ebenso', dv.getUint16(12, true), ((2026 - 1980) << 9) | (9 << 5) | 15);

  // ── ZIP64 ──────────────────────────────────────────────────────
  // Mit abgesenkten Grenzen: dieselben Wege, ohne 4 GB Testdaten.
  const viele = Array.from({ length: 12 }, (_, i) => ({ name: 'k/' + i + '.png', daten: new Uint8Array([i, i, i]) }));
  const blob64 = await zipSchreiben(viele, { grenzen: { anzahl: 10, bytes: 100 } });
  const roh64 = new Uint8Array(await blob64.arrayBuffer());
  const dv64 = new DataView(roh64.buffer);
  ist('ueber der Grenze steht der ZIP64-Verweis vor dem Ende', dv64.getUint32(roh64.length - 42, true), 0x07064b50);
  ist('  … und das Ende nennt 0xFFFF Eintraege', dv64.getUint16(roh64.length - 12, true), 0xFFFF);
  const zip64 = await zipLesen(blob64);
  ist('gelesen werden trotzdem alle zwoelf', zip64.eintraege.length, 12);
  ist('  … auch hinter der Byte-Grenze an der richtigen Stelle', Array.from(await zip64.lesen(zip64.finden('k/11.png'))), [11, 11, 11]);
  ist('  … die spaeten Eintraege tragen den ZIP64-Zusatz', zip64.finden('k/11.png').pos > 100, true);

  // ── Kaputte Dateien ────────────────────────────────────────────
  await wirft('zu kurz ist keine Paketdatei', () => zipLesen(new Blob([text('PK')])), /keine Paketdatei/);
  await wirft('ohne Verzeichnis auch nicht', () => zipLesen(new Blob([new Uint8Array(200)])), /kein ZIP-Verzeichnis/);
  const verdorben = roh.slice();
  const bildPos = zip.finden('karten/k_1/kacheln/0/0/0.webp').pos + 30 + 'karten/k_1/kacheln/0/0/0.webp'.length;
  verdorben[bildPos + 100] ^= 0xFF;
  const zipV = await zipLesen(new Blob([verdorben]));
  await wirft('ein gekipptes Byte faellt an der Pruefsumme auf',
    () => zipV.lesen(zipV.finden('karten/k_1/kacheln/0/0/0.webp')), /Prüfsumme/);
  await wirft('abgeschnitten wird als unvollstaendig erkannt',
    () => zipLesen(new Blob([roh.slice(0, 200), roh.slice(roh.length - 22)])), /unvollständig/);
  await wirft('ein doppelter Name wird nicht geschrieben',
    () => zipSchreiben([{ name: 'a.png', daten: bild }, { name: 'a.png', daten: bild }]), /Doppelter Name/);

  // ── Die Beschreibung ───────────────────────────────────────────
  const karten = [{ id: 'k_aaaaaaaa', ablage: 'f'.repeat(32), name: 'Barovia', sichtbar: true, dm: { notiz: 'geheim' } },
                  { id: 'k_bbbbbbbb', ablage: 'e'.repeat(32), name: 'Tempel', sichtbar: false, elternKarte: 'k_aaaaaaaa' }];
  const objekte = [{ id: 'o_cccccccc', karteId: 'k_aaaaaaaa', art: 'ort', name: 'Dorf', sichtbar: true, fuehrtZu: 'k_bbbbbbbb' },
                   { id: 'o_dddddddd', karteId: 'k_bbbbbbbb', art: 'route', punkte: [[1, 2]], von: 'o_cccccccc' }];
  const man = planManifest({ abenteuer: { id: 'strahd', name: 'Fluch des Strahd' }, karten, objekte,
    dateien: [{ karte: 'k_aaaaaaaa', pfad: 'kacheln/0/0/0.webp', bytes: 5 }], programm: 'Test', jetzt });
  ist('die Beschreibung nennt Format und Version', [man.format, man.version], ['heldenbuch-planer', 1]);
  ist('  … die Ablage des Servers geht nicht mit', man.karten.some(k => 'ablage' in k), false);
  ist('  … die Notizen der Spielleitung schon', man.karten[0].dm, { notiz: 'geheim' });
  ist('eine gueltige Beschreibung ist in Ordnung', planManifestPruefen(man), '');
  ist('ein fremdes Format wird erkannt', planManifestPruefen({ ...man, format: 'etwas' }), 'Das ist keine Datei des Abenteuerplaners.');
  ist('eine neuere Version sagt, was zu tun ist', /neueren Ausgabe.*aktualisieren/.test(planManifestPruefen({ ...man, version: 2 })), true);
  ist('ein Eintrag ohne Karte faellt auf',
    /gehört zu keiner Karte/.test(planManifestPruefen({ ...man, objekte: [{ ...objekte[0], karteId: 'k_weg' }] })), true);
  ist('eine unbekannte Art faellt auf',
    /Unbekannte Art/.test(planManifestPruefen({ ...man, objekte: [{ ...objekte[0], art: 'drache' }] })), true);
  ist('ein Pfad mit .. faellt auf',
    /Ungültiger Dateiname/.test(planManifestPruefen({ ...man, dateien: [{ karte: 'k_aaaaaaaa', pfad: '../api.php' }] })), true);
  ist('eine doppelte Karte faellt auf',
    /doppelt/.test(planManifestPruefen({ ...man, karten: [karten[0], karten[0]] })), true);

  // ── Neue Kennungen ─────────────────────────────────────────────
  let zaehler = 0;
  const neu = planNeueKennungen(man, (v) => v + '_neu' + (++zaehler));
  ist('jede Karte bekommt eine neue Kennung', neu.karten.map(k => k.id), ['k_neu1', 'k_neu2']);
  ist('  … die Orte ebenso', neu.objekte.map(o => o.id), ['o_neu3', 'o_neu4']);
  ist('Verweise auf Karten werden umgeschrieben', [neu.objekte[0].karteId, neu.objekte[0].fuehrtZu, neu.karten[1].elternKarte], ['k_neu1', 'k_neu2', 'k_neu1']);
  ist('Verweise zwischen Orten auch', neu.objekte[1].von, 'o_neu3');
  ist('gewoehnlicher Text bleibt', [neu.karten[0].name, neu.objekte[1].punkte], ['Barovia', [[1, 2]]]);
  ist('die Vorlage selbst bleibt unberuehrt', man.karten[0].id, 'k_aaaaaaaa');
  ist('planNeueId ist lang und passt zur Regel', PLAN_ID_RE.test(planNeueId('k')) && planNeueId('k').length === 18, true);
  ist('zwei neue Kennungen sind verschieden', planNeueId('o') !== planNeueId('o'), true);

  // ── Buendel und Kleinkram ──────────────────────────────────────
  ist('Buendel bleiben unter der Grenze',
    planBuendel([{ bytes: 4 }, { bytes: 4 }, { bytes: 4 }, { bytes: 20 }, { bytes: 1 }], 10).map(b => b.map(d => d.bytes)),
    [[4, 4], [4], [20], [1]]);
  ist('  … und unter der Hoechstzahl', planBuendel(Array(5).fill({ bytes: 1 }), 100, 2).map(b => b.length), [2, 2, 1]);
  ist('Base64 wie btoa', base64AusBytes(text('Heldenbuch')), Buffer.from('Heldenbuch').toString('base64'));
  ist('Base64 auch ueber die Stueckgrenze', base64AusBytes(new Uint8Array(70000).fill(65)), Buffer.alloc(70000, 65).toString('base64'));
  ist('der Dateiname traegt Abenteuer und Tag', planDateiname('Fluch des Strahd', jetzt), 'Fluch des Strahd 2026-09-15.hbplan');
  ist('  … ohne Zeichen, die Windows verbietet', planDateiname('A/B: "C"?', jetzt), 'A B C 2026-09-15.hbplan');
  ist('Groessen lesbar', [planGroesse(512), planGroesse(2048), planGroesse(5 * 1048576 + 300000), planGroesse(3 * 1073741824)],
    ['512 B', '2 KB', '5,3 MB', '3,0 GB']);

  // ── Der ganze Weg: exportieren, einspielen ─────────────────────
  // Ein Server im Gedaechtnis: Karten, Orte, und Dateien je Ablage.
  const server = () => {
    const s = { karten: new Map(), objekte: new Map(), dateien: new Map(), aufrufe: [] };
    s.ablage = (id) => { if (!s.dateien.has(id)) s.dateien.set(id, new Map()); return s.dateien.get(id); };
    return s;
  };
  const alt = server();
  const ablageA = 'a'.repeat(32);
  alt.karten.set('k_aaaaaaaa', { ...karten[0], ablage: ablageA });
  alt.karten.set('k_bbbbbbbb', { ...karten[1] });
  alt.ablage(ablageA).set('kacheln/0/0/0.webp', bild);
  alt.ablage(ablageA).set('kacheln/1/0/0.webp', bild.subarray(0, 500));
  alt.ablage(ablageA).set('karte.json', text('{"stufen":2}'));
  objekte.forEach(o => alt.objekte.set(o.id, o));
  const ablageH = 'c'.repeat(32);
  alt.objekte.set('h_eeeeeeee', { id: 'h_eeeeeeee', karteId: '', art: 'handout', ablage: ablageH, titel: 'Brief', bild: 'brief.png', sichtbar: true });
  alt.ablage(ablageH).set('brief.png', bild.subarray(0, 77));
  const meldungen = [];
  const aus = await planExportieren({
    daten: { karten: [...alt.karten.values()], objekte: [...alt.objekte.values()] },
    abenteuer: { id: 'strahd', name: 'Fluch des Strahd' },
    dateienListe: async (k, art) => { if (art === 'objekt' && !k.id.startsWith('h_')) throw new Error('falsches Ziel'); return k.ablage ? [...alt.ablage(k.ablage)].map(([pfad, b]) => ({ pfad, bytes: b.length })) : []; },
    dateiHolen: async (ablage, pfad) => alt.ablage(ablage).get(pfad),
    programm: 'Pruefung', jetzt, melde: (t) => meldungen.push(t),
  });
  ist('der Export zaehlt vier Dateien — drei der Karte, eine des Handouts', aus.dateien, 4);
  ist('  … und ihre Bytes', aus.bytes, 3000 + 500 + 12 + 77);
  ist('  … die Datei des Handouts liegt unter objekte/', aus.manifest.dateien.some(d => d.objekt === 'h_eeeeeeee' && d.pfad === 'brief.png' && !('karte' in d)), true);
  ist('  … ohne den Ordner des Servers im Handout', aus.manifest.objekte.some(o => 'ablage' in o), false);
  ist('  … er meldet, was er tut', meldungen.some(t => /Paket schnüren/.test(t)), true);

  const offen = await planPaketOeffnen(aus.blob);
  ist('das Paket oeffnet sich wieder', [offen.manifest.karten.length, offen.manifest.objekte.length, offen.manifest.dateien.length], [2, 3, 4]);
  ist('  … mit Groesse fuer die Vorschau', offen.bytes, 3589);

  const neuS = server();
  let nr = 0;
  const wege = {
    karteSpeichern: async (k) => { neuS.aufrufe.push('karte'); neuS.karten.set(k.id, { ...k, ablage: 'b'.repeat(31) + (nr++) }); },
    objSpeichern: async (o) => {
      if (o.art !== 'handout' && !neuS.karten.has(o.karteId)) throw new Error('Karte fehlt');
      if ('ablage' in o) throw new Error('die Ablage vergibt der Server');
      neuS.objekte.set(o.id, o.art === 'handout' ? { ...o, ablage: 'd'.repeat(32) } : o);
    },
    dateienHoch: async (ziel, liste) => {
      neuS.aufrufe.push('hoch:' + liste.length);
      const abl = typeof ziel === 'string' ? neuS.karten.get(ziel).ablage : neuS.objekte.get(ziel.objId).ablage;
      const ab = neuS.ablage(abl);
      liste.forEach(d => ab.set(d.pfad, new Uint8Array(Buffer.from(d.daten, 'base64'))));
    },
    karteLoeschen: async (id) => { neuS.aufrufe.push('weg:' + id); neuS.karten.delete(id); },
  };
  const erg = await planEinspielen({ paket: offen, ...wege, namenZusatz: (n) => n === 'Barovia' ? ' (importiert)' : '',
                                     buendelBytes: 3100 });
  ist('eingespielt: zwei Karten, drei Eintraege, vier Dateien', [erg.karten, erg.objekte, erg.dateien], [2, 3, 4]);
  const neuH = [...neuS.objekte.values()].find(o => o.art === 'handout');
  ist('  … das Handout bekommt neue Kennung und seinen Brief in den eigenen Ordner', !!neuH && neuH.id !== 'h_eeeeeeee' && neuS.ablage('d'.repeat(32)).get('brief.png').length === 77, true);
  const nk = [...neuS.karten.values()];
  ist('  … mit neuen Kennungen', nk.every(k => !['k_aaaaaaaa', 'k_bbbbbbbb'].includes(k.id)), true);
  ist('  … der Namenszusatz steht nur, wo er gewuenscht ist', nk.map(k => k.name), ['Barovia (importiert)', 'Tempel']);
  ist('  … die Notizen der Spielleitung sind wieder da', nk[0].dm, { notiz: 'geheim' });
  const neuA = neuS.ablage(nk[0].ablage);
  ist('  … jede Datei liegt Byte fuer Byte gleich in der neuen Ablage',
    ['kacheln/0/0/0.webp', 'kacheln/1/0/0.webp', 'karte.json'].every(p => gleich(neuA.get(p), alt.ablage(ablageA).get(p))), true);
  ist('  … in Buendeln unter der Grenze hochgeladen', neuS.aufrufe.filter(a => /^hoch/.test(a)), ['hoch:1', 'hoch:2', 'hoch:1']);
  const no = [...neuS.objekte.values()];
  ist('  … die Orte zeigen auf die neuen Karten', no.filter(o => o.art !== 'handout').every(o => neuS.karten.has(o.karteId)), true);

  // Scheitert es in der Mitte, bleibt nichts halb liegen.
  const kaputtS = server();
  await wirft('ein Fehler beim Hochladen bricht das Einspielen ab', () => planEinspielen({
    paket: offen,
    karteSpeichern: async (k) => { kaputtS.karten.set(k.id, k); },
    objSpeichern: async () => {},
    dateienHoch: async () => { throw new Error('Speicher voll'); },
    karteLoeschen: async (id) => { kaputtS.karten.delete(id); },
    objLoeschen: async () => {},
  }), /Speicher voll/);
  ist('  … und raeumt die angelegten Karten wieder weg', kaputtS.karten.size, 0);

  // Ein Paket, dem eine Datei fehlt, faellt vor dem ersten Hochladen auf.
  const ohneDatei = await zipSchreiben([{ name: 'hbplan.json', daten: JSON.stringify(man) }]);
  await wirft('fehlt eine Datei, wird gar nicht erst angefangen', () => planPaketOeffnen(ohneDatei), /fehlen im Paket/);
  await wirft('ein ZIP ohne Beschreibung ist kein Planerpaket',
    async () => planPaketOeffnen(await zipSchreiben([{ name: 'bild.png', daten: bild }])), /keine hbplan.json/);

  // Fuer die Pruefung von Hand mit einem anderen Programm.
  if (process.env.HBPLAN_MUSTER) fs.writeFileSync(process.env.HBPLAN_MUSTER, Buffer.from(await aus.blob.arrayBuffer()));

  console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
  process.exit(schlecht ? 1 : 0);
})().catch(e => { console.log('  FEHLER Abbruch: ' + e.stack); console.log('\n' + gut + ' Pruefungen gut, ' + (schlecht + 1) + ' schlecht.'); process.exit(1); });
