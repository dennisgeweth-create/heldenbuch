// Prueft die Rechnung des Sitzungstagebuchs: Datum, Reihenfolge, die
// Vorschlaege aus dem Abenteuerlog und der Weg zum Bild.
const fs = require('fs');
const quelle = fs.readFileSync('js/src/2o-tagebuch.jsx', 'utf8')
  .split('// ══ Ende der reinen Rechnung')[0];
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

// ── Datum ────────────────────────────────────────────────────────
// Die Zeit des Geraets, nicht UTC: wer um 23 Uhr eintraegt, meint heute.
ist('heute steht als JJJJ-MM-TT da', tbHeute(new Date(2026, 8, 18, 23, 30)), '2026-09-18');
ist('  … einstellige Tage mit Null', tbHeute(new Date(2026, 0, 5, 9, 0)), '2026-01-05');
ist('das Datum wird lesbar', tbDatumText('2026-09-18'), 'Fr., 18.09.2026');
ist('  … und was keines ist, bleibt, wie es ist', tbDatumText('irgendwann'), 'irgendwann');

// ── Die Abende ───────────────────────────────────────────────────
const abende = [
  {id: 's_a', datum: '2026-09-04', titel: 'Im Keller', eintraege: [], bilder: []},
  {id: 's_c', datum: '2026-09-18', titel: '', eintraege: [], bilder: []},
  {id: 's_b', datum: '2026-09-11', titel: 'Der Wirt lügt', eintraege: [], bilder: []},
];
ist('die neuesten stehen oben', tbSortiert(abende).map(s => s.id), ['s_c', 's_b', 's_a']);
ist('  … die Vorlage bleibt unberührt', abende.map(s => s.id), ['s_a', 's_c', 's_b']);
ist('ohne Titel steht das Datum da', tbSitzungTitel(abende[1]), 'Fr., 18.09.2026');
ist('  … sonst der Titel', tbSitzungTitel(abende[0]), 'Im Keller');
ist('  … Leerzeichen sind kein Titel', tbSitzungTitel({datum: '2026-09-18', titel: '   '}), 'Fr., 18.09.2026');

const abend = {id: 's_a', datum: '2026-09-04', eintraege: [
  {id: 1, userId: 7, user: 'Dennis', text: 'Wir sind rein.'},
  {id: 2, userId: 9, user: 'Bea', charName: 'Brunhilde', text: 'Ich habe gezögert.'},
]};
ist('der eigene Eintrag wird gefunden', (tbEintragVon(abend, 9) || {}).user, 'Bea');
ist('  … und ohne eigenen kommt nichts', tbEintragVon(abend, 99), null);
ist('die anderen sind alle ausser mir', tbAndere(abend, 9).map(e => e.user), ['Dennis']);
ist('  … und ohne Sitzung ist die Liste leer', [tbAndere(null, 9), tbEintragVon(null, 9)], [[], null]);

// ── Vorschläge aus dem Log ───────────────────────────────────────
const logs = [
  {id: 1, created_at: '2026-09-18 20:14:00', char_name: 'Brunhilde', action: 'Stufe 5 erreicht', tab: 'charakter'},
  {id: 2, created_at: '2026-09-18 21:02:00', char_name: 'Brunhilde', action: 'Stufe 5 erreicht', tab: 'charakter'},
  {id: 3, created_at: '2026-09-18 21:40:00', char_name: 'Fitz', action: 'Heiltrank genommen', tab: 'inventar'},
  {id: 4, created_at: '2026-09-11 19:00:00', char_name: 'Fitz', action: 'Alter Abend', tab: 'notizen'},
  {id: 5, created_at: '2026-09-18 22:00:00', char_name: '', action: 'Ohne Bogen geschehen', tab: 'notizen'},
];
const v = tbVorschlaege(logs, '2026-09-18');
ist('nur der Tag, um den es geht', v.map(x => x.id), [1, 3, 5]);
ist('  … doppelte Zeilen einmal', v[0].text, 'Brunhilde: Stufe 5 erreicht');
ist('  … ohne Bogen steht nur, was geschah', v[2].text, 'Ohne Bogen geschehen');
ist('  … und nie mehr als erlaubt', tbVorschlaege(logs, '2026-09-18', 2).length, 2);
ist('ein Tag ohne Log ergibt nichts', tbVorschlaege(logs, '2026-01-01'), []);
ist('ohne Log ueberhaupt auch nicht', tbVorschlaege(null, '2026-09-18'), []);

// ── Übernehmen ───────────────────────────────────────────────────
ist('die erste Zeile steht allein da', tbAnhaengen('', 'Brunhilde: Stufe 5'), '• Brunhilde: Stufe 5');
ist('  … die zweite darunter', tbAnhaengen('• Eins', 'Zwei'), '• Eins\n• Zwei');
ist('  … an eigenen Text angehängt', tbAnhaengen('Wir sind rein.', 'Zwei'), 'Wir sind rein.\n• Zwei');
ist('  … und nie zweimal dieselbe', tbAnhaengen('• Eins\n• Zwei', 'Eins'), '• Eins\n• Zwei');

// ── Bilder ───────────────────────────────────────────────────────
ist('der Weg zum Bild', tbBildUrl('https://beispiel.de/hb', 'abc123', 'bild.jpg'),
    'https://beispiel.de/hb/planer-dateien/abc123/bild.jpg');
ist('  … ein Schrägstrich am Ende stört nicht', tbBildUrl('https://beispiel.de/hb/', 'abc123', 'b.png'),
    'https://beispiel.de/hb/planer-dateien/abc123/b.png');
ist('Größen stehen deutsch da', [tbGroesse(512), tbGroesse(2048), tbGroesse(3670016)], ['512 B', '2 kB', '3,5 MB']);
ist('die Endung kommt aus dem Typ', tbEndung({type: 'image/jpeg', name: 'foto.bin'}), 'jpg');
ist('  … sonst aus dem Namen', tbEndung({type: '', name: 'Foto vom Tisch.PNG'}), 'PNG');
ist('  … und was keines ist, hat keine', tbEndung({type: 'application/pdf', name: 'brief.pdf'}), '');
ist('die Endung sagt, was es ist', [tbArt('png'), tbArt('MP4'), tbArt('mov'), tbArt('')], ['bild', 'video', '', '']);
ist('  … auch an einer abgelegten Datei', [tbArtVonDatei('a1b2.webm'), tbArtVonDatei('a1b2.jpg'), tbArtVonDatei('ohne')], ['video', 'bild', '']);
ist('ein Video kommt mit seiner Endung durch', tbEndung({type: 'video/mp4', name: 'abend.bin'}), 'mp4');
ist('  … und nach dem Namen, wenn der Typ fehlt', tbEndung({type: '', name: 'Abend.WEBM'}), 'WEBM');

// Was nicht hineindarf, sagt das Fenster — vor dem Hochladen.
ist('ein gutes Bild wird nicht getadelt', tbTadel({type: 'image/jpeg', name: 'a.jpg', size: 900000}), '');
ist('ein gutes Video auch nicht', tbTadel({type: 'video/mp4', name: 'a.mp4', size: 20000000}), '');
wahr('ein zu großes Bild schon', /12 MB je Bild/.test(tbTadel({type: 'image/png', name: 'a.png', size: 13000000})));
wahr('  … und ein zu großes Video', /32 MB je Video/.test(tbTadel({type: 'video/mp4', name: 'a.mp4', size: 40000000})));
wahr('  … MOV bleibt draußen', /nur PNG/.test(tbTadel({type: 'video/quicktime', name: 'a.mov', size: 100})));

// Pakete: nach Zahl und nach Größe, damit keine Anfrage platzt.
const stueck = (mb) => ({bytes: {length: mb * 1000000}});
ist('mehr als zwanzig gehen in Paketen',
    tbPakete(Array.from({length: 45}, () => stueck(0.1))).map(p => p.length), [20, 20, 5]);
ist('  … und zu viele Bytes ebenso',
    tbPakete([stueck(20), stueck(20), stueck(5)]).map(p => p.length), [1, 2]);
ist('  … ein einzelnes Großes steht allein', tbPakete([stueck(31)]).map(p => p.length), [1]);
ist('  … und nichts ergibt nichts', tbPakete([]), []);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
