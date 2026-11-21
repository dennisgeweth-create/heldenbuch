// Prueft den Bodenplan unter der Karte — Stufe 7. Zwei Fragen: bleibt
// er auf dem Geraet, und ueberlebt der Kampf, wenn der Speicher voll
// ist.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8') + '\n'
             + fs.readFileSync('js/src/2c2-karte.jsx', 'utf8')
                 .split('// ══ Ende der reinen Rechnung')[0] + '\n'
             + fs.readFileSync('js/src/4-app.jsx', 'utf8')
                 .split('function App()')[0]
                 .split('// ── Der Kampf im Geraet ─')[1]
                 .replace(/^[^\n]*\n/, '');
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
const wahr = (n, a) => ist(n, !!a, true);
const falsch = (n, a) => ist(n, !!a, false);

const BILD = 'data:image/jpeg;base64,' + 'A'.repeat(400);
const karte = () => ({breite: 5, hoehe: 3, feldMeter: 1.5,
  gelaende: '.....' + '..#..' + '.....',
  figuren: {h1: {x:0, y:1, k:'Br'}}, verborgen: [],
  zeigen: true, bild: BILD, bildZoom: 118, bildX: -3, bildY: 2});

// ── Der Plan geht nicht hinaus ───────────────────────────────────
const fuer = karteFuerSpieler(karte());
wahr('die Karte geht an die Runde', !!fuer);
falsch('der Plan nicht', 'bild' in fuer);
falsch('  … auch nicht als Bruchstueck', JSON.stringify(fuer).includes('base64'));
falsch('und seine Einstellung ebenso wenig',
  'bildZoom' in fuer || 'bildX' in fuer || 'bildY' in fuer);

// ── Und nicht ins Protokoll ──────────────────────────────────────
// Die Aufnahmen im Verlauf wandern ins Archiv. Ein Bild darin waere
// nach zehn Kaempfen der ganze Speicher.
const auf = karteAufnahme(karte(), [{id:'h1', name:'Brunhilde', art:'held'}]);
falsch('die Aufnahme traegt kein Bild', 'bild' in auf.karte);
falsch('  … und nichts davon', JSON.stringify(auf).includes('base64'));
ist('  … aber das Gelaende', auf.karte.gelaende, '.....' + '..#..' + '.....');

// ── Und nicht in den Textblock ───────────────────────────────────
const text = karteText(karte(), [{id:'h1', name:'Brunhilde', art:'held'}], {});
falsch('der Textblock kennt ihn nicht', text.includes('base64'));
wahr('  … zeigt aber weiter das Raster', text.includes('🗺 KARTE  5 × 3'));

// ── Am Geraet: zwei Faecher ──────────────────────────────────────
// Ein einfacher Speicher zum Nachstellen. Der zweite wirft beim Bild,
// so wie ein voller Speicher es tut.
const bauSpeicher = (grenze) => {
  const fach = {};
  return {
    fach,
    getItem: (k) => (k in fach ? fach[k] : null),
    setItem: (k, v) => {
      if (grenze && String(v).length > grenze) { const e = new Error('voll'); e.name = 'QuotaExceededError'; throw e; }
      fach[k] = String(v);
    },
    removeItem: (k) => { delete fach[k]; },
  };
};

globalThis.localStorage = bauSpeicher(0);
const kampf = {name: 'Am Tor', runde: 2, teilnehmer: [{id: 'h1'}], karte: karte()};
kampfSchreiben('strahd', kampf);
const roh = JSON.parse(localStorage.getItem('hb_kampf:strahd'));
falsch('im Kampffach steht kein Bild', String(localStorage.getItem('hb_kampf:strahd')).includes('base64'));
ist('  … und das Feld steht ausdruecklich leer', roh.karte.bild, null);
ist('der Plan liegt im eigenen Fach', localStorage.getItem('hb_kampf_bild:strahd'), BILD);
ist('die Einstellung bleibt beim Kampf',
  [roh.karte.bildZoom, roh.karte.bildX, roh.karte.bildY], [118, -3, 2]);

const zurueck = kampfLesen('strahd');
ist('beim Lesen ist der Plan wieder da', zurueck.karte.bild, BILD);
ist('  … und alles andere auch', zurueck.karte.gelaende, '.....' + '..#..' + '.....');
ist('  … mit der Ausrichtung', zurueck.karte.bildZoom, 118);

// Plan entfernen raeumt das Fach.
kampfSchreiben('strahd', {...kampf, karte: {...karte(), bild: null}});
ist('ohne Plan ist das Fach leer', localStorage.getItem('hb_kampf_bild:strahd'), null);
ist('  … und der gelesene Kampf hat keinen', kampfLesen('strahd').karte.bild, null);

// Kampf abraeumen nimmt beides mit.
kampfSchreiben('strahd', kampf);
kampfSchreiben('strahd', null);
ist('das Ende raeumt den Kampf', localStorage.getItem('hb_kampf:strahd'), null);
ist('  … und den Plan', localStorage.getItem('hb_kampf_bild:strahd'), null);

// ── Ist der Speicher voll, faellt das Bild aus, nicht der Kampf ──
globalThis.localStorage = bauSpeicher(300);
kampfSchreiben('strahd', kampf);
wahr('der Kampf steht auch bei vollem Speicher',
  String(localStorage.getItem('hb_kampf:strahd') || '').includes('Am Tor'));
ist('  … der Plan aber nicht', localStorage.getItem('hb_kampf_bild:strahd'), null);
const knapp = kampfLesen('strahd');
ist('  … und der gelesene Kampf ist heil', knapp.runde, 2);
ist('  … nur ohne Bild', knapp.karte.bild, null);

// ── Ein Kampf ohne Karte ─────────────────────────────────────────
globalThis.localStorage = bauSpeicher(0);
kampfSchreiben('strahd', {name: 'Ohne Feld', runde: 1, teilnehmer: []});
ist('ein Kampf ohne Karte geht durch', kampfLesen('strahd').name, 'Ohne Feld');
ist('  … und legt kein Bildfach an', localStorage.getItem('hb_kampf_bild:strahd'), null);
ist('gar kein Kampf bleibt gar kein Kampf',
  (localStorage.removeItem('hb_kampf:strahd'), kampfLesen('strahd')), null);

// ── Zwei Abenteuer, zwei Kaempfe ─────────────────────────────────
// Bis v6.8 hatte das Geraet ein Fach; wer umschaltete, spiegelte den
// Kampf des einen Abenteuers auf den Server des anderen.
globalThis.localStorage = bauSpeicher(0);
kampfSchreiben('strahd', {name: 'Am Tor', runde: 3, teilnehmer: []});
kampfSchreiben('eberron', {name: 'Im Zug', runde: 1, teilnehmer: []});
ist('jedes Abenteuer hat seinen Kampf',
  [kampfLesen('strahd').name, kampfLesen('eberron').name], ['Am Tor', 'Im Zug']);
ist('  … und der Kampf weiss, wohin er gehoert', kampfLesen('eberron').advId, 'eberron');
kampfSchreiben('eberron', null);
ist('das Ende in Eberron laesst Strahd stehen',
  [kampfLesen('eberron'), kampfLesen('strahd').runde], [null, 3]);

// Der Kampf von vor den Faechern zieht in das Abenteuer, das zuerst fragt.
globalThis.localStorage = bauSpeicher(0);
localStorage.setItem('hb_kampf', JSON.stringify({name: 'Alt', runde: 5, karte: {...karte(), bild: null}}));
localStorage.setItem('hb_kampf_bild', BILD);
ist('bevor die Bibliothek da ist, zieht nichts um', kampfLesen('eberron'), null);
ist('  … das alte Fach steht noch', localStorage.getItem('hb_kampf') !== null, true);
const umgezogen = kampfLesen('strahd', true);
ist('der alte Kampf zieht um', [umgezogen.name, umgezogen.advId, umgezogen.karte.bild], ['Alt', 'strahd', BILD]);
ist('  … und das alte Fach ist leer', [localStorage.getItem('hb_kampf'), localStorage.getItem('hb_kampf_bild')], [null, null]);
ist('  … ein anderes Abenteuer bekommt ihn nicht noch einmal', kampfLesen('eberron', true), null);

// ── Den Kampf vom Server uebernehmen ─────────────────────────────
const spiegel = {name: 'Am Tor', phase: 'kampf', runde: 3, zug: 1, aktiv: true,
  teilnehmer: [{id: 'held-h1', art: 'held', charId: 'h1'},
               {id: 'g1', art: 'gegner', name: 'Ork', vorlageId: 'ork'},
               {id: 'n1', art: 'held', lager: 'feind', name: 'Strahd', hp: 90, hpMax: 90}],
  log: [{art: 'start'}], ansagen: [{id: 'a1'}]};
const geholt = kampfVomServer(spiegel, 'strahd', [{id: 'ork', image: 'planer-dateien/x/bild-ork.png'}],
  [{id: 'c-strahd', name: 'Strahd'}]);
ist('der geholte Kampf gehoert dem Abenteuer', [geholt.advId, geholt.phase, geholt.runde], ['strahd', 'kampf', 3]);
ist('  … der Gegner hat sein Bild wieder', geholt.teilnehmer[1].bild, 'planer-dateien/x/bild-ork.png');
ist('  … der NSC seine Kennung', geholt.teilnehmer[2].charId, 'c-strahd');
ist('  … die Ansagen bleiben beim Server', geholt.ansagen, undefined);
ist('nichts geholt, nichts uebernommen', kampfVomServer(null, 'strahd', [], []), null);
ist('die leere Vorbereitung', leereVorbereitung({phase: 'vorbereitung', teilnehmer: [{art: 'held', ini: null}]}), true);
ist('  … mit Gegner ist sie es nicht mehr',
  leereVorbereitung({phase: 'vorbereitung', teilnehmer: [{art: 'held', ini: null}, {art: 'gegner', ini: null}]}), false);
ist('  … mit Initiative auch nicht', leereVorbereitung({phase: 'vorbereitung', teilnehmer: [{art: 'held', ini: 12}]}), false);
ist('  … und ein laufender Kampf schon gar nicht', leereVorbereitung(spiegel), false);

// ── Die Bibliothek als Patch ─────────────────────────────────────
const lib0 = {spell: [{name: 'Feuerball'}], _adventures: [{id: 'a', name: 'A'}, {id: 'b', name: 'B'}],
              _laeden: {a: {name: 'Laden A'}}};
ist('nichts geaendert, nichts zu schicken', libPatchLeer(libPatch(lib0, lib0)), true);
const lib1 = {...lib0, _adventures: lib0._adventures.map(x => x.id === 'b' ? {...x, hpVerdeckt: true} : x)};
ist('ein Abenteuer geaendert: nur dieser Eintrag reist',
  libPatch(lib0, lib1), {setzen: {}, teil: {}, liste: {_adventures: {setzen: [{id: 'b', name: 'B', hpVerdeckt: true}],
    weg: [], reihe: ['a', 'b']}}, weg: []});
const lib2 = {...lib0, _laeden: {...lib0._laeden, b: {name: 'Laden B'}}};
ist('ein Laden dazu: nur sein Fach',
  libPatch(lib0, lib2).teil, {_laeden: {setzen: {b: {name: 'Laden B'}}, weg: []}});
const lib3 = {...lib0, spell: [...lib0.spell, {name: 'Blitz'}]};
ist('eine Sammlung geaendert: sie als Ganzes', Object.keys(libPatch(lib0, lib3).setzen), ['spell']);
const {spell, ...lib4} = lib0;
ist('ein Schluessel weg', libPatch(lib0, lib4).weg, ['spell']);
const lib5 = {...lib0, _adventures: [lib0._adventures[1]]};
ist('ein Abenteuer geloescht', libPatch(lib0, lib5).liste._adventures,
  {setzen: [], weg: ['a'], reihe: ['b']});

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
