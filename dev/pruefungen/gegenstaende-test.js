// Prueft die Bilder der Gegenstaende (js/gegenstaende.js): dass jedes
// Bild ein Strich-Icon fuer klein hat, die Auswahl nur Vorhandenes
// anbietet, alte Zeichen ein Bild finden und das Raten nach dem Namen
// trifft.
const fs = require('fs');
global.window = {};
eval(fs.readFileSync('js/icons.js', 'utf8'));
eval(fs.readFileSync('js/gegenstaende.js', 'utf8'));
const H = window.HB_IKONEN;

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};

ist('es gibt Bilder', H.bilder.length >= 60, true);
ist('jedes Bild hat ein Strich-Icon, das es gibt',
  H.bilder.filter(n => !H.namen.includes(H.linieVonBild('ib:' + n))), []);
ist('jedes Bild hat einen Namen', H.bilder.filter(n => !H.bildLabel('ib:' + n)), []);
const angeboten = [].concat(...H.bildWahl.map(k => k.icons));
ist('die Auswahl bietet nur Bilder an, die es gibt', angeboten.filter(z => !H.bildLabel(z)), []);
ist('  … jedes nur einmal', angeboten.length, new Set(angeboten).size);
ist('  … und jedes Bild steht darin', H.bilder.filter(n => !angeboten.includes('ib:' + n)), []);

// Alte Gegenstaende mit Emoji
ist('ein altes ⚔ ist ein Langschwert', H.bildLabel('⚔'), 'Langschwert');
ist('ein altes 🛡️ (mit Variationszeichen) ist ein Schild', H.bildLabel('🛡️'), 'Schild');
ist('🧪 ist ein Heiltrank', H.bildLabel('🧪'), 'Heiltrank');
ist('🎒 ist ein Rucksack', H.bildLabel('🎒'), 'Rucksack');
ist('dasselbe Bild, ob alt oder neu', H.gleichesBild('🛡', 'ib:wappenschild'), true);
ist('  … zwei Rüstungen sind nicht dasselbe', H.gleichesBild('ib:kettenhemd', 'ib:robe'), false);

// Im Fliesstext wird ein Kuerzel zum kleinen Strich-Icon — und in
// Attributen faellt es weg.
ist('ib:kettenhemd ist klein eine Rüstung', H.nameVon('ib:kettenhemd'), 'ruestung');
ist('  … und fällt in einem Titel weg', H.tilgen('ib:helm Helm'), 'Helm');
ist('ein unbekanntes Kürzel hat kein Icon', H.nameVon('ib:gibtsnicht'), null);

// Raten nach dem Namen
const r = (n) => H.bildLabel(H.raten(n) || '');
ist('Kettenhemd', r('Kettenhemd'), 'Kettenhemd');
ist('Kettenpanzer', r('Kettenpanzer'), 'Kettenhemd');
ist('Plattenpanzer', r('Plattenpanzer'), 'Plattenpanzer');
ist('Lederrüstung', r('Verstärkte Lederrüstung'), 'Lederrüstung');
ist('Trank der Heilung', r('Trank der Heilung'), 'Heiltrank');
ist('Gift', r('Gift des Assassinen'), 'Gift');
ist('Langschwert +1', r('Langschwert +1'), 'Langschwert');
ist('Krummschwert', r('Krummschwert'), 'Säbel');
ist('Zauberstab vor Stab', r('Zauberstab der Geschosse'), 'Zauberstab');
ist('Kampfstab', r('Kampfstab'), 'Kampfstab');
ist('Armbrust vor Bogen', r('Leichte Armbrust'), 'Armbrust');
ist('Panzerhandschuh vor Handschuh', r('Panzerhandschuhe'), 'Panzerhandschuh');
ist('Umhang des Schutzes', r('Umhang des Schutzes'), 'Umhang');
ist('Ring des Schutzes', r('Ring des Schutzes'), 'Ring');
ist('Seil aus Hanf', r('Seil aus Hanf (15 m)'), 'Seil');
ist('Diebeswerkzeug', r('Diebeswerkzeug'), 'Diebeswerkzeug');
ist('Mühlenbuch', r('Mühlenbuch, wasserfleckig'), 'Buch');
ist('was nicht passt, bleibt ohne', H.raten('Etwas Seltsames'), null);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);
