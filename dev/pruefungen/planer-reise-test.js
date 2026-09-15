// Prueft die Reiserechnung des Abenteuerplaners: Tempo und Gelaende,
// die Tage einer Reise, Gewaltmarsch, Wagen und Schiffe, Rueckweg, den
// Punkt auf der Route, das Wetter — und dass seine Schluessel dieselben
// sind wie die der Rast im Heldenbuch.
const fs = require('fs');
const stueck = (datei) => { const t = fs.readFileSync(datei, 'utf8'); return t.slice(0, t.indexOf('// ══ Ende der reinen Rechnung')); };
const quelle = ['planer/src/1-paket.jsx', 'planer/src/1b-kacheln.jsx', 'planer/src/1c-reise.jsx'].map(stueck).join('\n');
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
const r1 = (x) => Math.round(x * 10) / 10;

// Maßstab: 10 Pixel je Kilometer.
const km = massstabAus({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 'km');
const mi = massstabAus({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 'mi');
// Eine gerade Route: 100 km Strasse, dann 50 km Wald.
const route = { punkte: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1500, y: 0 }], gelaende: ['strasse', 'wald'] };

// ── Route ────────────────────────────────────────────────────────
ist('die Route ist 150 km lang', r1(routeLaenge(route, km)), 150);
ist('  … in zwei Abschnitten', routeAbschnitte(route, km).map(a => [r1(a.laenge), a.gelaende]), [[100, 'strasse'], [50, 'wald']]);
ist('ohne Maßstab hat sie keine Länge', routeLaenge(route, null), 0);
ist('der Punkt nach 120 km liegt im Wald', punktAufRoute(route, km, 120), { x: 1200, y: 0 });
ist('  … über das Ende hinaus bleibt er am Ziel', punktAufRoute(route, km, 999), { x: 1500, y: 0 });
const zurueck = routeInRichtung(route, 'zurueck');
ist('rückwärts: Punkte und Gelände umgedreht', [zurueck.punkte[0], zurueck.gelaende], [{ x: 1500, y: 0 }, ['wald', 'strasse']]);
ist('  … die Vorlage bleibt', route.gelaende, ['strasse', 'wald']);

// ── Tempo ────────────────────────────────────────────────────────
ist('normal zu Fuß: 4,5 km/h', tempoAuf('strasse', { tempo: 'normal', fortbewegung: 'fuss' }, 'km'), 4.5);
ist('  … in Meilen: 3 mph', tempoAuf('strasse', { tempo: 'normal', fortbewegung: 'fuss' }, 'mi'), 3);
ist('schnell 6, langsam 3 km/h', [tempoAuf('offen', { tempo: 'schnell' }, 'km'), tempoAuf('offen', { tempo: 'langsam' }, 'km')], [6, 3]);
ist('Wald halbiert', tempoAuf('wald', { tempo: 'normal', fortbewegung: 'fuss' }, 'km'), 2.25);
ist('Wagen kommen nicht durchs Gebirge', tempoAuf('gebirge', { fortbewegung: 'wagen' }, 'km'), 0);
ist('zu Fuß nicht übers Wasser', tempoAuf('wasser', { fortbewegung: 'fuss' }, 'km'), 0);
ist('ein Segelschiff: 2 mph = 3 km/h, nur auf Wasser', [tempoAuf('wasser', { fortbewegung: 'segelschiff' }, 'km'), tempoAuf('strasse', { fortbewegung: 'segelschiff' }, 'km')], [3, 0]);
ist('Sturm halbiert an Land', tempoAuf('strasse', { fortbewegung: 'fuss' }, 'km', { niederschlag: 'sturm', wind: 'flaute' }), 2.25);
ist('bei Orkan läuft kein Schiff aus', tempoAuf('wasser', { fortbewegung: 'galeere' }, 'km', { niederschlag: 'klar', wind: 'orkan' }), 0);
ist('Meter: 4500 m je Stunde', tempoAuf('strasse', { fortbewegung: 'fuss' }, 'm'), 4500);

// ── Tag für Tag ──────────────────────────────────────────────────
const p = reisePlan({ route, massstab: km, optionen: { tempo: 'normal', fortbewegung: 'fuss' } });
ist('100 km Straße und 50 km Wald brauchen sechs Tage', p.tage.length, 6);
ist('  … Tag 1 schafft 36 km in 8 Stunden', [r1(p.tage[0].strecke), r1(p.tage[0].stunden)], [36, 8]);
ist('  … Tag 3 wechselt von der Straße in den Wald', p.tage[2].teile.map(t => [t.gelaende, r1(t.strecke), r1(t.stunden)]), [['strasse', 28, 6.2], ['wald', 4, 1.8]]);
ist('  … im Wald nur noch 18 km am Tag', r1(p.tage[3].strecke), 18);
ist('  … und am sechsten Tag ist die Gruppe da', [p.angekommen, p.tage[5].angekommen, r1(p.tage[5].bis)], [true, true, 150]);
ist('  … ohne Gewaltmarsch', p.tage.every(t => t.gewaltmarsch.length === 0), true);
ist('ohne Maßstab kein Plan, aber ein Hinweis', reisePlan({ route, massstab: null, optionen: {} }).warnungen, ['Die Karte hat noch keinen Maßstab.']);

const gm = reisePlan({ route, massstab: km, optionen: { tempo: 'normal', fortbewegung: 'fuss', stunden: 11 } });
ist('elf Stunden am Tag: drei Rettungswürfe, SG 11, 12, 13', gm.tage[0].gewaltmarsch, [{ stunde: 9, sg: 11 }, { stunde: 10, sg: 12 }, { stunde: 11, sg: 13 }]);
ist('  … und eine Warnung', gm.warnungen.includes('Mehr als acht Stunden am Tag: Gewaltmarsch.'), true);
ist('  … 49,5 km am ersten Tag', r1(gm.tage[0].strecke), 49.5);

const mitte = reisePlan({ route, massstab: km, optionen: {}, start: 90 });
ist('von unterwegs aus: noch 60 km, davon 10 auf der Straße', [mitte.tage.length, r1(mitte.tage[0].von), r1(mitte.tage[0].strecke)], [4, 90, 23]);

const wagen = reisePlan({ route: { punkte: route.punkte, gelaende: ['strasse', 'gebirge'] }, massstab: km, optionen: { fortbewegung: 'wagen' } });
ist('mit dem Wagen ins Gebirge: blockiert, und es steht da, wo', [wagen.angekommen, wagen.warnungen[0]], [false, 'Tag 3, Abschnitt 2: Wagen oder Kutsche kommt durch Gebirge nicht durch.']);
ist('  … bis dahin kommt er', r1(wagen.tage[wagen.tage.length - 1].bis), 100);

const see = { punkte: [{ x: 0, y: 0 }, { x: 1440, y: 0 }], gelaende: ['wasser'] };
const schiff = reisePlan({ route: see, massstab: km, optionen: { fortbewegung: 'segelschiff' } });
ist('ein Segelschiff fährt rund um die Uhr: 72 km am Tag, zwei Tage für 144 km', [schiff.stundenJeTag, r1(schiff.tage[0].strecke), schiff.tage.length], [24, 72, 2]);
ist('  … ohne Gewaltmarsch', schiff.tage[0].gewaltmarsch.length, 0);

const sturm = reisePlan({ route, massstab: km, optionen: {}, wetter: [{ niederschlag: 'sturm', wind: 'stark', temperatur: 'kalt' }] });
ist('Sturm am ersten Tag: nur 18 km, danach wieder 36', [r1(sturm.tage[0].strecke), r1(sturm.tage[1].strecke)], [18, 36]);
ist('in Meilen: 24 Meilen am Tag', r1(reisePlan({ route: { punkte: [{ x: 0, y: 0 }, { x: 1000, y: 0 }], gelaende: ['strasse'] }, massstab: mi, optionen: {} }).tage[0].strecke), 24);

ist('Stunden lesbar', [stundenText(8), stundenText(6.2222), stundenText(2.999)], ['8 Std.', '6:13 Std.', '3 Std.']);
ist('Verpflegung für 4 Personen, 6 Tage', verpflegung(6, 4), { rationen: 24, wasserLiter: 96 });
ist('ohne Angabe: acht Stunden an Land, 24 auf dem Kielboot', [reiseStunden({ fortbewegung: 'fuss' }), reiseStunden({ fortbewegung: 'kielboot' }), reiseStunden({ fortbewegung: 'ruderboot' })], [8, 24, 8]);

// ── Wetter ───────────────────────────────────────────────────────
const rast = fs.readFileSync('js/src/2m-rast.jsx', 'utf8');
const schluessel = (name) => {
  const block = rast.slice(rast.indexOf('const ' + name + ' = ['), rast.indexOf('];', rast.indexOf('const ' + name + ' = [')));
  return [...block.matchAll(/k:\s*'([a-z]+)'/g)].map(m => m[1]);
};
ist('Niederschlag: dieselben Schlüssel wie die Rast', WETTER_NIEDERSCHLAG, schluessel('RAST_NIEDERSCHLAG'));
ist('Temperatur: dieselben Schlüssel wie die Rast', WETTER_TEMPERATUR, schluessel('RAST_TEMPERATUR'));
ist('Wind: dieselben Schlüssel wie die Rast', WETTER_WIND, schluessel('RAST_WIND'));
ist('jedes Wort ist beschrieben', [...WETTER_NIEDERSCHLAG, ...WETTER_TEMPERATUR, ...WETTER_WIND].every(k => WETTER_WORTE[k]), true);
ist('jede Tafel passt zu den Listen', Object.values(WETTER_TAFEL).every(t => t.wind.length === 5
  && JAHRESZEITEN.every(j => t.temperatur[j.k].length === 7 && t.niederschlag[j.k].length === 5)), true);

const a = wetterFuerTage(30, 'gemaessigt', 'sommer', 42);
const b = wetterFuerTage(30, 'gemaessigt', 'sommer', 42);
ist('derselbe Samen gibt dasselbe Wetter', JSON.stringify(a) === JSON.stringify(b), true);
ist('ein anderer Samen anderes', JSON.stringify(a) !== JSON.stringify(wetterFuerTage(30, 'gemaessigt', 'sommer', 43)), true);
ist('gültige Schlüssel', a.every(w => WETTER_NIEDERSCHLAG.includes(w.niederschlag) && WETTER_TEMPERATUR.includes(w.temperatur) && WETTER_WIND.includes(w.wind)), true);
const vorgabe = wetterFuerTage(3, 'gemaessigt', 'sommer', 42, [null, { niederschlag: 'sturm', temperatur: 'kalt', wind: 'orkan' }]);
ist('eine Vorgabe der Spielleitung gilt', vorgabe[1].wind, 'orkan');
const zaehle = (klima, js, feld, wert) => wetterFuerTage(400, klima, js, 7).filter(w => w[feld] === wert).length;
ist('in der Wüste regnet es im Sommer kaum', zaehle('heiss', 'sommer', 'niederschlag', 'regen') + zaehle('heiss', 'sommer', 'niederschlag', 'sturm') < 40, true);
ist('arktisch ist es im Winter nie warm', zaehle('arktisch', 'winter', 'temperatur', 'warm') + zaehle('arktisch', 'winter', 'temperatur', 'heiss'), 0);
ist('gemäßigt im Winter meist kühl oder kalt', zaehle('gemaessigt', 'winter', 'temperatur', 'kalt') + zaehle('gemaessigt', 'winter', 'temperatur', 'kuehl') > 250, true);
let wechsel = 0;
for (let i = 1; i < a.length; i++) if (a[i].temperatur !== a[i - 1].temperatur) wechsel++;
ist('das Wetter hält sich eine Weile', wechsel < 25, true);
ist('Wetter lesbar', wetterText({ niederschlag: 'regen', temperatur: 'kuehl', wind: 'maessig' }), 'Regen, Hagel, Schnee · Kühl · Mäßiger Wind');

// ── Aufträge an das Heldenbuch ───────────────────────────────────
ist('Zeit: ganze Stunden', auftragZeit('strahd', 23.6), { art: 'zeit', advId: 'strahd', stunden: 24 });
const ar = auftragRast('strahd', { niederschlag: 'regen', temperatur: 'kalt', wind: 'stark' }, 'Lager am Waldrand');
ist('Rast: lange Rast in der Wildnis, mit dem Wetter des Tages', [ar.rastArt, ar.basis, ar.niederschlag, ar.temperatur, ar.wind, ar.text], ['lang', 2, 'regen', 'kalt', 'stark', 'Lager am Waldrand']);
ist('  … die Rast im Heldenbuch kennt diese Werte', schluessel('RAST_NIEDERSCHLAG').includes(ar.niederschlag) && schluessel('RAST_TEMPERATUR').includes(ar.temperatur) && schluessel('RAST_WIND').includes(ar.wind), true);
ist('Gewaltmarsch: KO-Rettungswurf', auftragGewaltmarsch('strahd', 13, 'Stunde 11'), { art: 'probe', advId: 'strahd', probeArt: 'rw', wert: 'con', sg: 13, text: 'Stunde 11' });
ist('  … „con“ steht im Heldenbuch als Rettungswurf zur Wahl', /k:\s*'con'/.test(fs.readFileSync('js/util.js', 'utf8') + fs.readFileSync('js/data.js', 'utf8') + fs.readFileSync('js/src/2h-proben.jsx', 'utf8')), true);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
