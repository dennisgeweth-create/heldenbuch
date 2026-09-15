// Prueft die Heldengruppen des Abenteuerplaners: Stand, Ziehen mit Nebel,
// Reisen entlang der Route, Spur, Aufteilen und Vereinen.
const fs = require('fs');
const stueck = (datei) => { const t = fs.readFileSync(datei, 'utf8'); return t.slice(0, t.indexOf('// ══ Ende der reinen Rechnung')); };
const quelle = ['1-paket', '1b-kacheln', '1c-reise', '1d-begegnung', '1e-sicht', '1f-welt', '1g-gruppe'].map(n => stueck('planer/src/' + n + '.jsx')).join('\n');
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

const km = massstabAus({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 'km');     // 10 px je km
const g0 = neueGruppe('k1', { x: 100.4, y: 100 }, 50, ['h1', 'h2', 'h3'], { h1: 'Armin', h2: 'Bea', h3: 'Cem' });
ist('eine neue Gruppe steht am Startpunkt, zur Zeit der Chronik', [gruppePosition(g0), g0.art, /^g_/.test(g0.id)], [{ zeit: 50, x: 100, y: 100, art: 'start' }, 'gruppe', true]);
ist('  … sichtbar, aber ohne Spur für Spieler', [g0.sichtbar, g0.spurFuerSpieler], [true, false]);

const z1 = gruppeZiehen(g0, { x: 400, y: 100 }, 56, km);
ist('ziehen hängt einen Punkt an die Spur', z1.gruppe.spur.map(p => [p.x, p.art]), [[100, 'start'], [400, 'zug']]);
ist('  … die Vorlage bleibt', g0.spur.length, 1);
ist('  … der Nebel weicht entlang des Wegs: 30 km bei 5 km Sicht, sieben Kreise', z1.kreise.length, 7);
ist('  … lückenlos von Start bis Ziel', Array.from({ length: 31 }, (_, i) => ({ x: 100 + i * 10, y: 100 })).every(p => punktAufgedeckt(p, { an: true, flaechen: z1.kreise })), true);
ist('  … mit dem Radius der Sichtweite', z1.kreise[0].r, 50);
ist('ohne Maßstab: Spur ja, Nebel nein', [gruppeZiehen(g0, { x: 5, y: 5 }, 1, null).gruppe.spur.length, gruppeZiehen(g0, { x: 5, y: 5 }, 1, null).kreise.length], [2, 0]);
ist('ohne Sichtweite kein Nebel', gruppeZiehen({ ...g0, sichtweite: 0 }, { x: 400, y: 100 }, 1, km).kreise.length, 0);
ist('auf der Stelle: ein Kreis um die Gruppe', gruppeZiehen(g0, { x: 100, y: 100 }, 60, km).kreise.length, 1);
ist('die Spur ist 30 km lang', spurLaenge(z1.gruppe, km), 30);

// Reise entlang einer Route mit einer Ecke
const route = { punkte: [{ x: 400, y: 100 }, { x: 700, y: 100 }, { x: 700, y: 400 }], gelaende: ['strasse', 'wald'] };
const punkte = routenPunkteZwischen(route, km, 10, 45);
ist('die Punkte der Route zwischen km 10 und 45, mit der Ecke', punkte, [{ x: 500, y: 100 }, { x: 700, y: 100 }, { x: 700, y: 250 }]);
const r1 = gruppeReist(z1.gruppe, punkte, 72, 8, km);
ist('reisen hängt die Route an, mit Zeiten über den Tag verteilt', r1.gruppe.spur.slice(-3).map(p => [p.x, p.y, p.zeit, p.art]), [[500, 100, 72, 'reise'], [700, 100, 77, 'reise'], [700, 250, 80, 'reise']]);
ist('  … und lichtet den Nebel entlang der Route', r1.kreise.length > 5 && punktAufgedeckt({ x: 700, y: 180 }, { an: true, flaechen: r1.kreise }), true);
ist('ein doppelter Anfangspunkt wird nicht zweimal eingetragen',
  gruppeReist(gruppeZiehen(g0, { x: 500, y: 100 }, 60, km).gruppe, punkte, 72, 8, km).gruppe.spur.length, 4);
ist('ohne Strecke keine Punkte', routenPunkteZwischen(route, km, 20, 20), []);

// Aufteilen und Vereinen
const t = gruppeTeilen(z1.gruppe, ['h2'], 'g_neu', 60);
ist('aufteilen: Bea zieht allein los, vom selben Punkt', [t.neue.helden, t.neue.name, gruppePosition(t.neue)], [['h2'], 'Bea', { zeit: 60, x: 400, y: 100, art: 'teilung' }]);
ist('  … die alte Gruppe behält Spur und die anderen', [t.alte.helden, t.alte.spur.length, Object.keys(t.alte.heldenNamen)], [['h1', 'h3'], 2, ['h1', 'h3']]);
ist('  … die neue weiß, woher sie kommt', t.neue.aus, z1.gruppe.id);
ist('niemanden oder alle abzuteilen geht nicht', [gruppeTeilen(z1.gruppe, [], 'x', 1), gruppeTeilen(z1.gruppe, ['h1', 'h2', 'h3'], 'x', 1)], [null, null]);
const v = gruppenVereinen(t.alte, t.neue, 90);
ist('vereinen: alle wieder beisammen, am Ort der ersten Gruppe', [v.helden, gruppePosition(v)], [['h1', 'h3', 'h2'], { zeit: 90, x: 400, y: 100, art: 'vereint' }]);
ist('  … mit allen Namen', v.heldenNamen, { h2: 'Bea', h1: 'Armin', h3: 'Cem' });
ist('  … und dem Namen der größeren Gruppe, gleich von welcher Seite vereint wird', [gruppenVereinen(t.neue, t.alte, 90).name, gruppenVereinen(t.alte, t.neue, 90).name], ['Heldengruppe', 'Heldengruppe']);
ist('Helden ohne Gruppe', heldenOhneGruppe([{ id: 'h1' }, { id: 'h2' }, { id: 'h4' }], [t.alte, t.neue]).map(h => h.id), ['h4']);
ist('  … die eigene Gruppe zählt beim Bearbeiten nicht', heldenOhneGruppe([{ id: 'h1' }, { id: 'h4' }], [t.alte], t.alte.id).map(h => h.id), ['h1', 'h4']);

const lang = { ...g0, spur: Array.from({ length: SPUR_HOECHSTENS }, (_, i) => ({ zeit: i, x: i, y: 0 })) };
const gekappt = gruppeZiehen(lang, { x: 9999, y: 0 }, 99999, null).gruppe.spur;
ist('eine sehr lange Spur behält den Anfang und die neuesten Punkte', [gekappt.length, gekappt[0].zeit, gekappt[gekappt.length - 1].x], [SPUR_HOECHSTENS, 0, 9999]);

// Der Tisch zeigt die Spur nur, wo sie freigegeben ist
const sicht = spielerSicht({ karten: [{ id: 'k1', sichtbar: true }], objekte: [{ ...z1.gruppe, spurFuerSpieler: false }, { ...z1.gruppe, id: 'g2', spurFuerSpieler: true }] });
ist('der Tisch: ohne Freigabe nur der letzte Punkt, mit Freigabe die Spur', sicht.objekte.map(o => o.spur.length), [1, 2]);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
