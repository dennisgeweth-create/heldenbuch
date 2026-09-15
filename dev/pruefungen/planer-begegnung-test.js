// Prueft Regionen und Zufallsbegegnungen des Abenteuerplaners: Punkt in
// der Flaeche, die innerste Region, den Wurf auf die Tabelle, die Wachen
// eines Reisetags und das Reisetagebuch als Text.
const fs = require('fs');
const stueck = (datei) => { const t = fs.readFileSync(datei, 'utf8'); return t.slice(0, t.indexOf('// ══ Ende der reinen Rechnung')); };
const quelle = ['1-paket', '1b-kacheln', '1c-reise', '1d-begegnung'].map(n => stueck('planer/src/' + n + '.jsx')).join('\n');
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
// Ein Zufall, der der Reihe nach vorgegebene Zahlen liefert.
const folge = (...z) => { let i = 0; return () => z[i++ % z.length]; };

// ── Flaechen ─────────────────────────────────────────────────────
const tal = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }];
const wald = [{ x: 400, y: -100 }, { x: 700, y: -100 }, { x: 700, y: 300 }, { x: 400, y: 300 }];
const dreieck = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }];
ist('Fläche des Quadrats', polygonFlaeche(tal), 1000000);
ist('Fläche des Dreiecks, auch andersherum', [polygonFlaeche(dreieck), polygonFlaeche([...dreieck].reverse())], [50, 50]);
ist('Punkt drin und draußen', [punktInPolygon({ x: 500, y: 500 }, tal), punktInPolygon({ x: 1500, y: 500 }, tal), punktInPolygon({ x: 6, y: 6 }, dreieck)], [true, false, false]);
ist('der Schwerpunkt des Quadrats', polygonMitte(tal), { x: 500, y: 500 });
const regionen = [
  { id: 'r_tal', name: 'Tal', punkte: tal, dm: { tabelle: { jeStunden: 8, wuerfel: 20, ab: 18, abNacht: 15, eintraege: [
    { id: 'e1', gewicht: 3, zeit: 'immer', art: 'kampf', begegnungId: 'enc_woelfe', text: '' },
    { id: 'e2', gewicht: 1, zeit: 'nacht', art: 'ereignis', text: 'Nebel steigt auf' },
  ] } } },
  { id: 'r_wald', name: 'Svalich-Wald', punkte: wald, dm: { tabelle: { jeStunden: 4, wuerfel: 20, ab: 2, abNacht: 2, eintraege: [
    { id: 'e3', gewicht: 1, zeit: 'tag', art: 'ereignis', text: 'Ein Rabe folgt der Gruppe' },
  ] } } },
  { id: 'r_leer', name: 'Ohne Tabelle', punkte: [{ x: 2000, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 1000 }] },
];
ist('im Wald gilt der Wald, nicht das Tal', regionAn({ x: 500, y: 100 }, regionen).id, 'r_wald');
ist('daneben das Tal', regionAn({ x: 200, y: 800 }, regionen).id, 'r_tal');
ist('außerhalb nichts', regionAn({ x: 5000, y: 5000 }, regionen), null);
const km = massstabAus({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 'km');
ist('die Fläche in km²', flaecheText(tal, km), '10000 km²');

// ── Der Wurf ─────────────────────────────────────────────────────
const tTal = regionen[0].dm.tabelle;
ist('Nacht ist 20 bis 6 Uhr', [istNacht(20), istNacht(5), istNacht(6), istNacht(19), istNacht(26)], [true, true, false, false, true]);
ist('17 am Tag: nichts', begegnungPruefen(tTal, false, folge(0.8)), { wurf: 17, ab: 18, treffer: false, eintrag: null });
ist('17 in der Nacht: etwas', begegnungPruefen(tTal, true, folge(0.8, 0.1)).treffer, true);
ist('  … am Tag nur, was tags geschieht', begegnungPruefen(tTal, false, folge(0.95, 0.99)).eintrag.id, 'e1');
ist('  … nachts nach Gewicht (3 : 1)', [begegnungPruefen(tTal, true, folge(0.95, 0.1)).eintrag.id, begegnungPruefen(tTal, true, folge(0.95, 0.9)).eintrag.id], ['e1', 'e2']);
ist('eine leere Tabelle meldet trotzdem den Treffer', begegnungPruefen({ ab: 1, eintraege: [] }, false, folge(0.5)), { wurf: 11, ab: 1, treffer: true, eintrag: null });
ist('ohne Tabelle gilt die Vorgabe (W20 ab 18)', [begegnungPruefen(null, false, folge(0.84)).treffer, begegnungPruefen(null, false, folge(0.86)).treffer], [false, true]);

// ── Die Wachen eines Reisetags ───────────────────────────────────
// Route von links nach rechts durch das Tal, mitten durch den Wald.
const route = { punkte: [{ x: 0, y: 100 }, { x: 1000, y: 100 }], gelaende: ['strasse'] };
const plan = reisePlan({ route, massstab: km, optionen: {} });
ist('der Tag geht 36 km weit, bis in die Mitte des Waldes und darüber hinaus', [Math.round(plan.tage[0].strecke), plan.tage.length], [36, 3]);
ist('Position nach 4 Stunden: 18 km', Math.round(posNachStunden(plan.tage[0], 4)), 18);
const p1 = tagesPruefungen({ tag: plan.tage[0], route, massstab: km, regionen, startStunde: 8, zufall: folge(0.99, 0) });
ist('geprüft wird zu jeder Stunde, zu der eine Tabelle fällig ist, dort wo die Gruppe steht',
  p1.map(p => [p.nachStunden, p.uhr, p.regionName, p.unterwegs]),
  [[4, 12, 'Tal', true], [8, 16, 'Tal', true], [16, 0, 'Tal', false], [24, 8, 'Tal', false]].filter(x => x[0] % 8 === 0 || x[2] !== 'Tal'));
const p2 = tagesPruefungen({ tag: plan.tage[1], route, massstab: km, regionen, startStunde: 8, zufall: folge(0.99, 0) });
ist('am zweiten Tag: im Wald alle vier Stunden, im Lager dahinter wieder das Tal',
  p2.map(p => [p.nachStunden, p.regionName]), [[4, 'Svalich-Wald'], [8, 'Tal'], [16, 'Tal'], [24, 'Tal']]);
ist('  … der Rabe im Wald', p2[0].eintrag.text, 'Ein Rabe folgt der Gruppe');
ist('  … nachts um Mitternacht gilt die Nachtschwelle', [p2[2].uhr, p2[2].nacht, p2[2].ab], [0, true, 15]);
ist('ohne Regionen keine Prüfung', tagesPruefungen({ tag: plan.tage[0], route, massstab: km, regionen: [], zufall: folge(0.99) }), []);
ist('derselbe Samen gibt dieselben Würfe',
  JSON.stringify(tagesPruefungen({ tag: plan.tage[1], route, massstab: km, regionen, zufall: samenZufall(wuerfelSamen(42, 2)) }))
  === JSON.stringify(tagesPruefungen({ tag: plan.tage[1], route, massstab: km, regionen, zufall: samenZufall(wuerfelSamen(42, 2)) })), true);
ist('neu würfeln gibt einen anderen Samen', wuerfelSamen(42, 2) !== wuerfelSamen(42, 2, 1), true);

// ── Tagebuch ─────────────────────────────────────────────────────
const kurz = pruefungKurz(p2[0]);
ist('im Tagebuch bleibt nur das Nötige', Object.keys(kurz), ['uhr', 'nacht', 'unterwegs', 'region', 'wurf', 'ab', 'treffer', 'art', 'begegnungId', 'text']);
const begegnungen = [{ id: 'enc_woelfe', name: 'Wolfsrudel' }];
const eintrag = { nr: 2, strecke: 36, stunden: 8, wetter: { niederschlag: 'regen', temperatur: 'kuehl', wind: 'flaute' },
  gewaltmarsch: [], pruefungen: [kurz, { uhr: 0, region: 'Tal', treffer: true, art: 'kampf', begegnungId: 'enc_woelfe', text: 'hungrig' }, { uhr: 16, treffer: false }] };
ist('der Reisetag als eine Zeile',
  reisetagText(eintrag, 'Svalich-Straße', 'km', begegnungen),
  'Reisetag 2 · Svalich-Straße: 36 km in 8 Std. · Regen, Hagel, Schnee · Kühl · Flaute · 12 Uhr (Svalich-Wald): Ein Rabe folgt der Gruppe · 00 Uhr (Tal): Wolfsrudel — hungrig');
ist('eine unbekannte Begegnung heißt schlicht Kampf', begegnungName({ treffer: true, art: 'kampf', begegnungId: 'weg' }, begegnungen), 'Kampf');
ist('das ganze Tagebuch, Tag für Tag', tagebuchText({ tagebuch: [eintrag, { nr: 3, strecke: 20, stunden: 4.5 }] }, 'km', begegnungen).split('\n').length, 2);
ist('der Auftrag an den Kampftracker', auftragKampf('strahd', 'enc_woelfe', 'Wolfsrudel'), { art: 'kampf', advId: 'strahd', begegnungId: 'enc_woelfe', name: 'Wolfsrudel' });
ist('Begegnungen im Heldenbuch haben die Felder, auf die der Planer schaut',
  /id:\s*'enc_'/.test(fs.readFileSync('js/src/2b-gegner.jsx', 'utf8')) && /name:''.*difficulty/.test(fs.readFileSync('js/src/2b-gegner.jsx', 'utf8')), true);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
