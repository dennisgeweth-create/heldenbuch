// Prueft, dass das Kopieren die Wahrheit sagt.
//
// Bis v5.3 stand in `inZwischenablage` ein Fehler, der sich als Erfolg
// ausgab: der alte Weg — `document.execCommand('copy')` — gibt zurueck,
// ob er etwas ausgerichtet hat, und genau das wurde nicht angesehen.
// Scheiterte der neue Weg (ohne HTTPS, oder weil das Fenster den Fokus
// verloren hatte), fiel die Funktion auf den alten zurueck und meldete
// „kopiert", auch wenn nichts in der Zwischenablage lag. Wer einfuegte,
// bekam, was vorher darin stand — und hielt den Knopf fuer kaputt.
//
// Deshalb wird hier vor allem das Scheitern geprueft. Der Erfolgsfall
// faellt auf; der falsch gemeldete Erfolg fiel gerade nicht auf.
const fs = require('fs');

// ── Die nachgestellte Umgebung ───────────────────────────────────
// So viel Browser, wie die Funktion anfasst, und keinen Schritt mehr.
let lage = {};
const umgebungSetzen = (w) => {
  lage = {
    geschrieben: null,     // was ueber die neue Schnittstelle ankam
    angehaengt: [],        // Felder, die sie selbst gebaut hat
    entfernt: [],
    markiert: [],          // worauf select() gerufen wurde
    ...w,
  };
  // Nicht `globalThis.navigator = …`: seit Node 21 ist `navigator` ein
  // eingebauter Nur-Lese-Zugriff, und eine gewoehnliche Zuweisung geht
  // still ins Leere. Die Pruefung liefe dann immer gegen den alten Weg.
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true, writable: true,
    value: {
      clipboard: lage.neuGeht === false ? undefined : {
        writeText: (t) => lage.neuGeht
          ? (lage.geschrieben = t, Promise.resolve())
          : Promise.reject(new Error('Document is not focused.')),
      },
    },
  });
  globalThis.document = {
    body: {
      appendChild: (el) => lage.angehaengt.push(el),
      removeChild: (el) => lage.entfernt.push(el),
    },
    createElement: () => ({
      style: {}, value: '',
      focus() {}, select() { lage.markiert.push(this); },
      setSelectionRange() {},
    }),
    execCommand: () => lage.altGeht,
  };
};

// Ein sichtbares Feld, wie es im Fenster steht.
const bauFeld = (wert) => ({
  value: wert, style: {},
  fokus: 0, markiert: 0,
  focus() { this.fokus++; },
  select() { this.markiert++; },
  setSelectionRange(a, b) { this.bereich = [a, b]; },
});

const quelle = fs.readFileSync('js/src/2c-kampf.jsx', 'utf8');
const anfang = quelle.indexOf('const inZwischenablage');
const ende   = quelle.indexOf('\n// ──', anfang);
eval(quelle.slice(anfang, ende) + ';globalThis.inZwischenablage = inZwischenablage;');

let gut = 0, schlecht = 0;
const ist = (n, a, b) => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A === B) { gut++; return; }
  schlecht++;
  console.log('  FEHLER ' + n + '\n     ist  ' + A + '\n     soll ' + B);
};
const wahr   = (n, a) => ist(n, !!a, true);
const falsch = (n, a) => ist(n, !!a, false);

(async () => {

// ── Der gewoehnliche Fall ────────────────────────────────────────
umgebungSetzen({neuGeht: true, altGeht: true});
ist('der neue Weg klappt und meldet es', await inZwischenablage('hallo'), true);
ist('  … und der Text kommt an', lage.geschrieben, 'hallo');
ist('  … ohne dass ein Hilfsfeld gebaut wird', lage.angehaengt.length, 0);

// ── Der neue Weg fehlt oder wird abgewiesen ──────────────────────
// Ohne HTTPS gibt es navigator.clipboard gar nicht.
umgebungSetzen({neuGeht: false, altGeht: true});
ist('ohne die neue Schnittstelle hilft die alte', await inZwischenablage('hallo'), true);
ist('  … und dafuer wird ein Feld gebaut', lage.angehaengt.length, 1);
ist('  … das hinterher wieder verschwindet', lage.entfernt.length, 1);

// Der Fall des Spielleiters: die Schnittstelle ist da, weist aber ab.
umgebungSetzen({neuGeht: null, altGeht: true});
ist('wird der neue Weg abgewiesen, springt der alte ein',
  await inZwischenablage('hallo'), true);
ist('  … und nichts ging ueber den neuen', lage.geschrieben, null);

// ── Und jetzt der Fehler, der sich als Erfolg ausgab ─────────────
// Beide Wege scheitern. Vorher kam hier „true" zurueck.
umgebungSetzen({neuGeht: null, altGeht: false});
ist('scheitern beide Wege, wird das gemeldet', await inZwischenablage('hallo'), false);
ist('  … und das Hilfsfeld bleibt trotzdem nicht liegen', lage.entfernt.length, 1);

umgebungSetzen({neuGeht: false, altGeht: false});
ist('dasselbe ohne die neue Schnittstelle', await inZwischenablage('hallo'), false);

// execCommand gibt manches zurueck, was kein sauberes false ist.
umgebungSetzen({neuGeht: null, altGeht: undefined});
ist('undefined ist kein Erfolg', await inZwischenablage('hallo'), false);
umgebungSetzen({neuGeht: null, altGeht: 1});
ist('und eine Eins ist einer', await inZwischenablage('hallo'), true);

// ── Mit einem sichtbaren Feld ────────────────────────────────────
// Steht der Text ohnehin da, wird daraus kopiert: aus einem
// unsichtbaren Feld mag nicht jeder Browser.
umgebungSetzen({neuGeht: null, altGeht: true});
let f = bauFeld('der ganze Bogen');
ist('mit Feld klappt es', await inZwischenablage('der ganze Bogen', f), true);
ist('  … und es wird kein zweites gebaut', lage.angehaengt.length, 0);
ist('  … das vorhandene bekommt den Fokus', f.fokus, 1);
ist('  … und wird markiert', f.markiert, 1);
ist('  … ganz, von vorn bis hinten', f.bereich, [0, 'der ganze Bogen'.length]);

// Scheitert es auch damit, bleibt der Text markiert stehen — dann tut
// es die Tastatur. Genau deshalb wird das Feld uebergeben.
umgebungSetzen({neuGeht: null, altGeht: false});
f = bauFeld('der ganze Bogen');
ist('scheitert es mit Feld, wird auch das gemeldet',
  await inZwischenablage('der ganze Bogen', f), false);
wahr('  … der Text bleibt aber markiert', f.markiert === 1 && f.fokus === 1);
ist('  … und das fremde Feld wird nicht entfernt', lage.entfernt.length, 0);

// Klappt der neue Weg, wird das Feld gar nicht angefasst: niemand soll
// den Zeiger verlieren, wenn es auch ohne geht.
umgebungSetzen({neuGeht: true, altGeht: true});
f = bauFeld('hallo');
ist('klappt der neue Weg, bleibt das Feld in Ruhe',
  [await inZwischenablage('hallo', f), f.fokus, f.markiert], [true, 0, 0]);

// ── Nichts bringt die Funktion zum Absturz ───────────────────────
umgebungSetzen({neuGeht: null, altGeht: true});
globalThis.document.createElement = () => { throw new Error('kein DOM'); };
ist('ein kaputtes DOM gibt false, keinen Absturz',
  await inZwischenablage('hallo'), false);

console.log('\n' + gut + ' Pruefungen gut, ' + schlecht + ' schlecht.');
process.exit(schlecht ? 1 : 0);

})();
