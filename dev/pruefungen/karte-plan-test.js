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
kampfSchreiben(kampf);
const roh = JSON.parse(localStorage.getItem('hb_kampf'));
falsch('im Kampffach steht kein Bild', String(localStorage.getItem('hb_kampf')).includes('base64'));
ist('  … und das Feld steht ausdruecklich leer', roh.karte.bild, null);
ist('der Plan liegt im eigenen Fach', localStorage.getItem('hb_kampf_bild'), BILD);
ist('die Einstellung bleibt beim Kampf',
  [roh.karte.bildZoom, roh.karte.bildX, roh.karte.bildY], [118, -3, 2]);

const zurueck = kampfLesen();
ist('beim Lesen ist der Plan wieder da', zurueck.karte.bild, BILD);
ist('  … und alles andere auch', zurueck.karte.gelaende, '.....' + '..#..' + '.....');
ist('  … mit der Ausrichtung', zurueck.karte.bildZoom, 118);

// Plan entfernen raeumt das Fach.
kampfSchreiben({...kampf, karte: {...karte(), bild: null}});
ist('ohne Plan ist das Fach leer', localStorage.getItem('hb_kampf_bild'), null);
ist('  … und der gelesene Kampf hat keinen', kampfLesen().karte.bild, null);

// Kampf abraeumen nimmt beides mit.
kampfSchreiben(kampf);
kampfSchreiben(null);
ist('das Ende raeumt den Kampf', localStorage.getItem('hb_kampf'), null);
ist('  … und den Plan', localStorage.getItem('hb_kampf_bild'), null);

// ── Ist der Speicher voll, faellt das Bild aus, nicht der Kampf ──
globalThis.localStorage = bauSpeicher(300);
kampfSchreiben(kampf);
wahr('der Kampf steht auch bei vollem Speicher',
  String(localStorage.getItem('hb_kampf') || '').includes('Am Tor'));
ist('  … der Plan aber nicht', localStorage.getItem('hb_kampf_bild'), null);
const knapp = kampfLesen();
ist('  … und der gelesene Kampf ist heil', knapp.runde, 2);
ist('  … nur ohne Bild', knapp.karte.bild, null);

// ── Ein Kampf ohne Karte ─────────────────────────────────────────
globalThis.localStorage = bauSpeicher(0);
kampfSchreiben({name: 'Ohne Feld', runde: 1, teilnehmer: []});
ist('ein Kampf ohne Karte geht durch', kampfLesen().name, 'Ohne Feld');
ist('  … und legt kein Bildfach an', localStorage.getItem('hb_kampf_bild'), null);
ist('gar kein Kampf bleibt gar kein Kampf',
  (localStorage.removeItem('hb_kampf'), kampfLesen()), null);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
