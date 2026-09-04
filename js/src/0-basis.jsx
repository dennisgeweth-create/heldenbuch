// Heldenbuch — gemeinsame Grundlagen für alle folgenden Quelldateien.
//
// build.js setzt js/src/*.jsx in Dateinamen-Reihenfolge zu einem Skript
// zusammen; alle Dateien teilen sich deshalb einen Geltungsbereich. Was hier
// steht, gilt überall.
//
// Vorausgesetzt aus dem <head> von index.html: React, ReactDOM, js/data.js,
// js/util.js und der API-Client aus dem einfachen <script>-Block.

const { useState, useEffect, useRef } = React;
const apiLoad = apiLoadChars;
const apiSave = apiSaveChars;

// ── Ein Zahlenfeld, das man leeren darf ──────────────────────────
// Die Felder im Heldenbuch schrieben ihren Wert bei jedem Tastendruck
// zurueck: Number('') ist 0, und mit Math.max(1, …) wurde daraus eine 1.
// Wer eine 12 eintragen wollte, musste sie ueber die stehengebliebene
// Ziffer schreiben — loeschen ging nicht, das Feld fuellte sich sofort
// wieder. Genau das machte das Eintragen von Mengen umstaendlich.
//
// Hier gilt, solange jemand im Feld steht, was er getippt hat — auch
// nichts. Erst beim Verlassen wird daraus eine Zahl: Enter uebernimmt,
// Escape verwirft, ein leeres Feld faellt auf leerWert zurueck oder,
// wenn es keinen gibt, auf den alten Wert.
//
// Nebenbei spart es Schreibvorgaenge: aus "123" wurden bisher drei
// Speicherlaeufe, jetzt ist es einer.
//
// Mit "sofort" wandert die Zahl schon beim Tippen nach aussen, waehrend
// im Feld weiter der Rohtext steht. Das brauchen Fenster, die noch etwas
// anderes an der Zahl haengen haben — die Schaltflaeche "Anwenden" im
// Schadensfenster war ausgegraut, solange die getippte Zahl nur im Feld
// stand, und eine ausgegraute Schaltflaeche nimmt keinen Klick an: sie
// loeste nicht einmal das Verlassen des Feldes aus. Wer 7 eintippte und
// klickte, sah gar nichts geschehen.
const ZahlFeld = ({ wert, onWert, min, max, leerWert, sofort, onKeyDown, ...rest }) => {
  const [roh, setRoh] = useState(null);          // null = zeig, was von aussen kommt
  const zeigen = roh !== null ? roh
    : (wert === undefined || wert === null || wert === '' ? '' : String(wert));

  // Aus dem, was im Feld steht, eine Zahl machen — oder undefined, wenn
  // daraus (noch) keine wird, etwa bei "-" oder "1e".
  const alsZahl = (t) => {
    t = String(t).trim();
    if (t === '') return (leerWert !== undefined ? leerWert : wert);
    let n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n)) return undefined;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    return n;
  };

  const festhalten = () => {
    if (roh === null) return;
    let n = alsZahl(roh);
    if (n === undefined) n = wert;
    setRoh(null);
    if (n !== wert) onWert(n);
  };

  return (
    <input type="number" {...rest}
      min={min} max={max}
      value={zeigen}
      onChange={e => {
        setRoh(e.target.value);
        if (!sofort) return;
        const n = alsZahl(e.target.value);
        if (n !== undefined && n !== wert) onWert(n);
      }}
      onBlur={festhalten}
      onKeyDown={e => {
        if (e.key === 'Enter')  { festhalten(); }
        if (e.key === 'Escape') { setRoh(null); e.currentTarget.blur(); }
        if (onKeyDown) onKeyDown(e);
      }} />
  );
};
