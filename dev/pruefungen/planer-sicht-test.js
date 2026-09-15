// Prueft die Spielersicht des Abenteuerplaners: Nebel (aufgedeckte
// Flaechen, Kreise entlang der Reise, Orte, die mit dem Nebel aufgehen),
// die Sicht fuer das Tischfenster und die ungesehenen Handouts.
const fs = require('fs');
const stueck = (datei) => { const t = fs.readFileSync(datei, 'utf8'); return t.slice(0, t.indexOf('// ══ Ende der reinen Rechnung')); };
const quelle = ['1-paket', '1b-kacheln', '1c-reise', '1d-begegnung', '1e-sicht'].map(n => stueck('planer/src/' + n + '.jsx')).join('\n');
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

// ── Nebel ────────────────────────────────────────────────────────
ist('ohne Angabe ist der Nebel aus', nebelVon({}), { an: false, modus: 'offen', flaechen: [] });
const nebel = { an: true, flaechen: [nebelKreis({ x: 100, y: 100 }, 50), { art: 'vieleck', punkte: [{ x: 500, y: 500 }, { x: 600, y: 500 }, { x: 600, y: 600 }] }] };
ist('im Kreis aufgedeckt, daneben nicht', [punktAufgedeckt({ x: 130, y: 130 }, nebel), punktAufgedeckt({ x: 150, y: 150 }, nebel)], [true, false]);
ist('im Vieleck aufgedeckt', punktAufgedeckt({ x: 590, y: 520 }, nebel), true);
ist('ohne Nebel ist alles zu sehen', punktAufgedeckt({ x: 9999, y: 9999 }, { an: false, flaechen: [] }), true);
ist('„alles“ deckt alles auf', punktAufgedeckt({ x: 9999, y: 9999 }, { an: true, flaechen: [{ art: 'alles' }] }), true);
ist('Kreise werden ganzzahlig gespeichert', nebelKreis({ x: 10.4, y: 20.6 }, 33.3), { art: 'kreis', x: 10, y: 21, r: 33 });

const km = massstabAus({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 'km');
const route = { punkte: [{ x: 0, y: 0 }, { x: 1000, y: 0 }], gelaende: ['strasse'] };
const kreise = kreiseEntlang(route, km, 10, 46, 5);
ist('Sichtweite 5 km auf 36 km: acht Kreise und einer am Ziel', kreise.length, 9);
ist('  … von Kilometer 10 bis 46, Radius 50 Pixel', [kreise[0], kreise[kreise.length - 1]], [{ art: 'kreis', x: 100, y: 0, r: 50 }, { art: 'kreis', x: 460, y: 0, r: 50 }]);
ist('  … lückenlos: jeder Punkt der Strecke liegt in einem Kreis',
  Array.from({ length: 37 }, (_, i) => ({ x: 100 + i * 10, y: 0 })).every(p => punktAufgedeckt(p, { an: true, flaechen: kreise })), true);
ist('ohne Sichtweite nichts', kreiseEntlang(route, km, 0, 36, 0), []);

const orte = [
  { id: 'o1', art: 'ort', x: 120, y: 90, mitNebel: true, sichtbar: false },
  { id: 'o2', art: 'ort', x: 800, y: 800, mitNebel: true, sichtbar: false },
  { id: 'o3', art: 'ort', x: 110, y: 110, mitNebel: false, sichtbar: false },
  { id: 'o4', art: 'ort', x: 100, y: 100, mitNebel: true, sichtbar: true },
];
ist('nur Orte mit „mitNebel“, verborgen, im Aufgedeckten gehen auf', orteImAufgedeckten(orte, nebel).map(o => o.id), ['o1']);
ist('Kreise in größeren Kreisen fallen beim Aufräumen weg',
  nebelAufraeumen([nebelKreis({ x: 0, y: 0 }, 100), nebelKreis({ x: 10, y: 0 }, 20), nebelKreis({ x: 300, y: 0 }, 20), nebelKreis({ x: 0, y: 0 }, 100)]).length, 2);
ist('  … „alles“ ersetzt alles', nebelAufraeumen([nebelKreis({ x: 0, y: 0 }, 5), { art: 'alles' }]), [{ art: 'alles' }]);

// ── Was der Tisch zeigt ──────────────────────────────────────────
const daten = { dm: true, stand: 7,
  karten: [{ id: 'k1', sichtbar: true, dm: { notiz: 'x' }, nebel }, { id: 'k2', sichtbar: false }],
  objekte: [
    { id: 'o1', art: 'ort', karteId: 'k1', sichtbar: true, dm: { notiz: 'geheim' } },
    { id: 'o2', art: 'ort', karteId: 'k1', sichtbar: false },
    { id: 'o3', art: 'ort', karteId: 'k2', sichtbar: true },
    { id: 'h1', art: 'handout', karteId: '', sichtbar: true, an: [] },
    { id: 'h2', art: 'handout', karteId: '', sichtbar: true, an: [7] },
    { id: 'h3', art: 'handout', karteId: '', sichtbar: false, an: [] },
  ] };
const s = spielerSicht(daten);
ist('der Tisch sieht nur sichtbare Karten', s.karten.map(k => k.id), ['k1']);
ist('  … ohne Notizen, aber mit Nebel', [('dm' in s.karten[0]), !!s.karten[0].nebel], [false, true]);
ist('  … sichtbare Einträge auf sichtbaren Karten und Handouts an alle', s.objekte.map(o => o.id), ['o1', 'h1']);
ist('  … und hält sich nicht für die Spielleitung', s.dm, false);
ist('  … die Vorlage bleibt unberührt', daten.objekte[0].dm, { notiz: 'geheim' });

// ── Handouts ─────────────────────────────────────────────────────
ist('ein neues Handout ist noch nicht verteilt', [neuesHandout().sichtbar, neuesHandout().karteId, /^h_/.test(neuesHandout().id)], [false, '', true]);
const hs = [{ id: 'h1', art: 'handout', sichtbar: true, geaendert: 5 }, { id: 'h2', art: 'handout', sichtbar: true }, { id: 'h3', art: 'handout', sichtbar: false }];
ist('ungesehen sind die verteilten, die noch nicht angesehen wurden', ungeseheneHandouts(hs, ['h2:']).map(h => h.id), ['h1']);
ist('  … ein geändertes Handout kommt wieder', ungeseheneHandouts(hs, ['h1:4', 'h2:']).map(h => h.id), ['h1']);
ist('Nachricht an den Tisch', Object.keys(tischNachricht('ansicht', { karteId: 'k1' })), ['art', 'karteId', 'zeit']);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
