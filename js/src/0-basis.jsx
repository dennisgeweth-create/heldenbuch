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
const ZahlFeld = ({ wert, onWert, min, max, leerWert, onKeyDown, ...rest }) => {
  const [roh, setRoh] = useState(null);          // null = zeig, was von aussen kommt
  const zeigen = roh !== null ? roh
    : (wert === undefined || wert === null || wert === '' ? '' : String(wert));

  const festhalten = () => {
    if (roh === null) return;
    const t = String(roh).trim();
    let n;
    if (t === '') n = (leerWert !== undefined ? leerWert : wert);
    else {
      n = Number(t.replace(',', '.'));
      if (!Number.isFinite(n)) n = wert;
    }
    if (typeof n === 'number') {
      if (min !== undefined) n = Math.max(min, n);
      if (max !== undefined) n = Math.min(max, n);
    }
    setRoh(null);
    if (n !== wert) onWert(n);
  };

  return (
    <input type="number" {...rest}
      min={min} max={max}
      value={zeigen}
      onChange={e => setRoh(e.target.value)}
      onBlur={festhalten}
      onKeyDown={e => {
        if (e.key === 'Enter')  { festhalten(); }
        if (e.key === 'Escape') { setRoh(null); e.currentTarget.blur(); }
        if (onKeyDown) onKeyDown(e);
      }} />
  );
};
