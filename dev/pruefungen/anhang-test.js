// Prueft die Rechnung des PDF-Lesers: welche Seiten offen liegen und
// wohin ein Blaettern fuehrt — einzeln und aufgeschlagen wie ein Buch.
const fs = require('fs');
const quelle = fs.readFileSync('js/src/2p-anhang.jsx', 'utf8');
const stueck = quelle.slice(quelle.indexOf('const pdfOffen'), quelle.indexOf('const PdfLeser'));
eval(stueck + ';globalThis.M = {pdfOffen, pdfBlaettern};');
const {pdfOffen, pdfBlaettern} = M;

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

// ── Einzeln ──────────────────────────────────────────────────────
ist('einzeln liegt eine Seite offen', pdfOffen(3, 9, false), [3]);
ist('  … nie hinter der letzten', pdfOffen(12, 9, false), [9]);
ist('  … nie vor der ersten', pdfOffen(0, 9, false), [1]);
ist('vor blaettert eine Seite', pdfBlaettern(3, 9, false, 1), 4);
ist('  … zurueck eine Seite', pdfBlaettern(3, 9, false, -1), 2);
ist('  … am Ende bleibt es stehen', pdfBlaettern(9, 9, false, 1), 9);
ist('  … am Anfang auch', pdfBlaettern(1, 9, false, -1), 1);

// ── Als Buch ─────────────────────────────────────────────────────
// Seite 1 ist der Einband und steht allein; dann gerade links,
// ungerade rechts — wie gedruckt.
ist('der Einband steht allein', pdfOffen(1, 9, true), [1]);
ist('dann 2|3', pdfOffen(2, 9, true), [2, 3]);
ist('  … auch wer auf 3 springt, sieht 2|3', pdfOffen(3, 9, true), [2, 3]);
ist('bei neun Seiten endet es mit 8|9', pdfOffen(9, 9, true), [8, 9]);
ist('bei acht Seiten steht die letzte allein links', pdfOffen(8, 8, true), [8]);
ist('vom Einband geht es auf 2|3', pdfBlaettern(1, 9, true, 1), 2);
ist('von 2|3 auf 4|5', pdfBlaettern(2, 9, true, 1), 4);
ist('  … auch von der rechten Seite aus', pdfBlaettern(3, 9, true, 1), 4);
ist('zurueck von 4|5 auf 2|3', pdfBlaettern(5, 9, true, -1), 2);
ist('zurueck von 2|3 auf den Einband', pdfBlaettern(2, 9, true, -1), 1);
ist('am letzten Aufschlag bleibt es stehen', pdfBlaettern(8, 9, true, 1), 8);
ist('ein Blatt allein ist kein Buch', pdfOffen(1, 1, true), [1]);
ist('  … und blaettert nirgends hin', pdfBlaettern(1, 1, true, 1), 1);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
