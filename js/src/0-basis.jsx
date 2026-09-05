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

// ── Die Ausgabe ─────────────────────────────────────────────────
// Steht an einer Stelle und wird an zweien gezeigt: im Logo der
// Heldenleiste und in der schmalen Ansicht.
const HB_VERSION = 'v4.3';

// ── Ein einklappbarer Abschnitt der Einstellungen ────────────────
// Die Einstellungsfenster sind lang geworden — Trefferpunkte, Automat,
// Spielleitung, Konten, Klassen, und in der Verwaltung noch einmal
// dasselbe. Zugeklappt sieht man auf einen Blick, was es gibt;
// aufgeklappt nur das, was man gerade sucht. Deshalb geht alles
// zugeklappt auf.
//
// "kurz" ist die Zeile, die zugeklappt rechts steht: was gerade gilt,
// ohne dass man aufklappen muss.
const EinstBlock = ({ titel, kurz, offenStart, children }) => {
  const [offen, setOffen] = useState(!!offenStart);
  return (
    <div className={'einst-block' + (offen ? ' offen' : '')}>
      <button type="button" className="einst-kopf" aria-expanded={offen}
        onClick={()=>setOffen(o => !o)}>
        <span className="einst-pfeil">{offen ? '▾' : '▸'}</span>
        <span className="einst-titel">{titel}</span>
        {kurz ? <i className="einst-kurz">{kurz}</i> : null}
      </button>
      {offen && <div className="einst-inhalt">{children}</div>}
    </div>
  );
};

// ── Das Zeichen des Heldenbuchs ─────────────────────────────────
// Ein aufgeschlagenes Buch, ein Schwert mit der Spitze im Bund, das
// Lesezeichen der Spielleitung. Es steht inline im Markup und nicht als
// Datei: so faerbt es mit, laedt nicht nach und ist auch dann da, wenn
// gerade nichts vom Server kommt. Dieselbe Zeichnung liegt als logo.svg
// daneben — daraus entstehen favicon.png und apple-touch-icon.png.
const HeldenbuchLogo = ({ size }) => (
  <svg className="hb-logo" width={size || 28} height={size || 28} viewBox="0 0 64 64"
    role="img" aria-label="Heldenbuch">
    <defs>
      <linearGradient id="hb-klinge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0"    stopColor="#8a6a1f" />
        <stop offset="0.42" stopColor="#f2d98a" />
        <stop offset="0.58" stopColor="#e8b84b" />
        <stop offset="1"    stopColor="#8a6a1f" />
      </linearGradient>
      <linearGradient id="hb-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2d98a" />
        <stop offset="1" stopColor="#b8860b" />
      </linearGradient>
      <linearGradient id="hb-seite-l" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#cbbd94" />
        <stop offset="1" stopColor="#eee3c6" />
      </linearGradient>
      <linearGradient id="hb-seite-r" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#eee3c6" />
        <stop offset="1" stopColor="#cbbd94" />
      </linearGradient>
    </defs>

    <path d="M6 42.5 C13.5 38.6 23.5 38.9 31 42.6 L31 55.4 C23.5 51.7 13.5 51.4 6 55.3 Z"
      fill="url(#hb-seite-l)" stroke="#8a6a1f" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M58 42.5 C50.5 38.6 40.5 38.9 33 42.6 L33 55.4 C40.5 51.7 50.5 51.4 58 55.3 Z"
      fill="url(#hb-seite-r)" stroke="#8a6a1f" strokeWidth="1.4" strokeLinejoin="round" />
    <g stroke="#a89670" strokeWidth="1" strokeLinecap="round" opacity="0.75">
      <path d="M11 45.4 C16.5 43.6 22 43.8 27 45.6" />
      <path d="M11 49.2 C16.5 47.4 22 47.6 27 49.4" />
      <path d="M53 45.4 C47.5 43.6 42 43.8 37 45.6" />
      <path d="M53 49.2 C47.5 47.4 42 47.6 37 49.4" />
    </g>
    <path d="M32 41.8 L32 55.6" stroke="#8a6a1f" strokeWidth="2.2" strokeLinecap="round" />

    <path d="M28.9 21 L35.1 21 L35.1 41 L32 48.5 L28.9 41 Z" fill="url(#hb-klinge)" />
    <path d="M32 21 L32 47" stroke="#fbf1cf" strokeWidth="0.9" opacity="0.65" />
    <rect x="20.5" y="16.8" width="23" height="4.4" rx="2.2" fill="url(#hb-gold)" />
    <rect x="30.1" y="9.6" width="3.8" height="7.6" rx="1.6" fill="#8a6a1f" />
    <circle cx="32" cy="7.6" r="3.4" fill="url(#hb-gold)" />

    <path d="M45.5 39.4 L45.5 51 L42.6 48.2 L39.7 51 L39.7 41.2 Z" fill="#c0392b" />
  </svg>
);
