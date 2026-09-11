// Prueft den Leser der Ladenauslage.
//
// Er hat eine Aufgabe mehr als der der Beute: den Preis. Der darf in
// einem eigenen Feld stehen, am Namen kleben, oder ganz fehlen — und
// genau da liegt die Gefahr. „Seil, 15 m" darf nicht als Ware fuer
// fuenfzehn Gold durchgehen, und die Laenge des Seils darf nicht
// verschwinden.
const fs = require('fs');
const quelle = fs.readFileSync('js/data.js', 'utf8') + '\n'
             + fs.readFileSync('js/util.js', 'utf8');
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
const wahr   = (n, a) => ist(n, !!a, true);
const falsch = (n, a) => ist(n, !!a, false);

// ── Der Preis allein ─────────────────────────────────────────────
ist('Gold mit Muenzwort', ladenPreisKupfer('50 GM'), 5000);
ist('Silber', ladenPreisKupfer('1 SM'), 10);
ist('Kupfer', ladenPreisKupfer('1 KM'), 1);
ist('Platin', ladenPreisKupfer('2 PM'), 2000);
ist('ausgeschrieben geht auch', ladenPreisKupfer('3 Goldmünzen'), 300);
ist('mit Komma', ladenPreisKupfer('2,5 GM'), 250);
ist('  … und mit Punkt', ladenPreisKupfer('2.5 GM'), 250);
ist('ohne Luft dazwischen', ladenPreisKupfer('50GM'), 5000);
ist('mehrere Muenzarten', ladenPreisKupfer('1 GM 5 SM'), 150);
// Im Fenster daneben steht „GM" am Feld — eine blosse Zahl ist Gold.
ist('eine blosse Zahl ist Gold', ladenPreisKupfer('50'), 5000);
ist('  … auch mit Komma', ladenPreisKupfer('0,5'), 50);
// Und was kein Preis ist, ist keiner.
ist('Text ist kein Preis', ladenPreisKupfer('letztes Stück'), null);
ist('eine Laenge ist kein Preis', ladenPreisKupfer('15 m'), null);
ist('nichts ist kein Preis', ladenPreisKupfer(''), null);
ist('und undefined auch nicht', ladenPreisKupfer(undefined), null);

// ── Der Kopf ─────────────────────────────────────────────────────
const kopf = ladenAusText('Laden: Bogens Krämerladen\nKauft zu 40 %\nFackel | 1 KM');
ist('der Name des Ortes', kopf.name, 'Bogens Krämerladen');
ist('der Ankauf in Prozent', kopf.kauf, 40);
ist('  … und die Ware steht trotzdem da', kopf.waren.length, 1);
ist('ohne Kopf bleibt der Name leer', ladenAusText('Fackel | 1 KM').name, '');
ist('  … und der Ankauf ungenannt', ladenAusText('Fackel | 1 KM').kauf, null);
['Ort: Zum Krummen Nagel', 'Händler: Bogen', 'Geschäft: Die Waage',
 'Krämer: Bogen'].forEach(z => {
  wahr('„' + z.split(':')[0] + ":\" nennt auch den Ort", !!ladenAusText(z).name);
});
['Kauft zu 40 %', 'Kauft 40%', 'Ankauf: 40', 'Rückkauf 40 %'].forEach(z => {
  ist('„' + z + '" ergibt 40', ladenAusText(z).kauf, 40);
});
ist('über hundert wird geklemmt', ladenAusText('Kauft zu 900 %').kauf, 100);

// ── Die Ware ─────────────────────────────────────────────────────
const auslage = ladenAusText([
  'Laden: Bogens Krämerladen',
  'Kauft zu 40 %',
  '',
  'Waren:',
  '- Fackel | 1 KM | brennt eine Stunde',
  '* Seil aus Hanf (15 m) | 1 GM',
  '1. Trank der Heilung | 50 GM | letztes Stück',
  'Wanderstab — 5 KM',
  'Ring des Schutzes | schimmert blau',
  'Winterumhang',
  '# eine Bemerkung, die nicht mitzaehlt',
].join('\n'));

ist('alle Waren, und nur die', auslage.waren.map(w => w.name), [
  'Fackel', 'Seil aus Hanf (15 m)', 'Trank der Heilung', 'Wanderstab',
  'Ring des Schutzes', 'Winterumhang']);
ist('Preis und Notiz in eigenen Feldern', auslage.waren[0],
  {name: 'Fackel', preis: 1, notiz: 'brennt eine Stunde'});
ist('zwei Felder: Name und Preis', auslage.waren[1],
  {name: 'Seil aus Hanf (15 m)', preis: 100, notiz: ''});
ist('drei Felder mit grossem Preis', auslage.waren[2],
  {name: 'Trank der Heilung', preis: 5000, notiz: 'letztes Stück'});
ist('der Gedankenstrich trennt auch', auslage.waren[3],
  {name: 'Wanderstab', preis: 5, notiz: ''});
ist('ohne Preis bleibt er null', auslage.waren[4],
  {name: 'Ring des Schutzes', preis: 0, notiz: 'schimmert blau'});
ist('und der blosse Name geht auch', auslage.waren[5],
  {name: 'Winterumhang', preis: 0, notiz: ''});
falsch('eine Ueberschrift ist keine Ware',
  auslage.waren.some(w => /^Waren/i.test(w.name)));
falsch('eine Bemerkung mit Raute auch nicht',
  auslage.waren.some(w => /Bemerkung/.test(w.name)));

// ── Der Preis am Namen ───────────────────────────────────────────
// Er darf kleben — aber nur mit Muenzwort. Sonst waere jede Zahl im
// Namen ein Preis.
ist('der Preis darf am Namen kleben',
  ladenAusText('Trank der Heilung 50 GM').waren[0],
  {name: 'Trank der Heilung', preis: 5000, notiz: ''});
// Der Fall, an dem sich alles entscheidet.
ist('eine Laenge im Namen bleibt im Namen',
  ladenAusText('Seil, 15 m').waren[0], {name: 'Seil, 15 m', preis: 0, notiz: ''});
ist('  … auch mit Preis dahinter',
  ladenAusText('Seil, 15 m | 1 GM').waren[0],
  {name: 'Seil, 15 m', preis: 100, notiz: ''});
ist('eine Zahl im Namen ohne Muenzwort bleibt drin',
  ladenAusText('Wurfmesser 3').waren[0], {name: 'Wurfmesser 3', preis: 0, notiz: ''});
ist('ein Bindestrich im Namen trennt nicht',
  ladenAusText('Zwei-Hand-Axt | 30 GM').waren[0],
  {name: 'Zwei-Hand-Axt', preis: 3000, notiz: ''});

// ── Die Reihenfolge der Felder ist egal ──────────────────────────
// Welches Feld der Preis ist, sagt das Feld selbst.
ist('Preis hinten', ladenAusText('Fackel | brennt eine Stunde | 1 SM').waren[0],
  {name: 'Fackel', preis: 10, notiz: 'brennt eine Stunde'});
ist('zwei Notizen werden verbunden',
  ladenAusText('Fackel | 1 SM | brennt | qualmt').waren[0],
  {name: 'Fackel', preis: 10, notiz: 'brennt · qualmt'});
// Zwei Preise: der erste gilt, der zweite wird Notiz. Raten waere hier
// schlimmer als stehenlassen — die Spielleitung sieht die Zeile ohnehin.
ist('beim zweiten Preis gilt der erste',
  ladenAusText('Fackel | 1 SM | 2 GM').waren[0],
  {name: 'Fackel', preis: 10, notiz: '2 GM'});

// ── Was nichts hergibt ───────────────────────────────────────────
ist('nichts gibt nichts', ladenAusText('').waren, []);
ist('  … und keinen Namen', ladenAusText('').name, '');
ist('nur Leerzeilen ebenso', ladenAusText('\n\n   \n').waren, []);
ist('und undefined stuerzt nicht ab', ladenAusText(undefined).waren, []);

// ── Die Grenzen ──────────────────────────────────────────────────
const lang = ladenAusText('W'.repeat(200) + ' | 1 GM | ' + 'N'.repeat(300)).waren[0];
ist('ein sehr langer Name wird gekuerzt', lang.name.length, 80);
ist('  … und eine sehr lange Notiz auch', lang.notiz.length, 120);

// ── Was die Anweisung fuer die KI verspricht ─────────────────────
// Das Blatt wird einer KI vorgelegt. Steht darin ein Beispiel, das der
// Leser nicht liest, schreibt sie Zeilen, die niemand einfuegen kann.
const anweisung = fs.readFileSync('js/src/2j-laden.jsx', 'utf8')
  .split('const LADEN_KI_ANWEISUNG = [')[1].split('].join(')[0];
const beispiel = [...anweisung.matchAll(/^\s*'(.*)',$/gm)].map(m => m[1])
  .join('\n').replace(/\\'/g, "'");
// Nur der Block zwischen „Beispiel:" und der Frage am Schluss.
const ausBeispiel = ladenAusText(
  (beispiel.split('Beispiel:')[1] || '').split('Und das soll')[0]);
ist('das Beispiel der Anweisung nennt den Ort',
  ausBeispiel.name, 'Bogens Krämerladen');
ist('  … den Ankauf', ausBeispiel.kauf, 40);
ist('  … und vier Waren mit Preis', ausBeispiel.waren.map(w => [w.name, w.preis]), [
  ['Fackel', 1], ['Seil aus Hanf (15 m)', 100],
  ['Trank der Heilung', 5000], ['Wanderstab', 5]]);
wahr('  … samt der Notiz, die dabeisteht',
  ausBeispiel.waren[0].notiz === 'brennt eine Stunde');

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
