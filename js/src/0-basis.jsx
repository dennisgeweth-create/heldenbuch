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
const HB_VERSION = 'v4.6';

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

// ── Ein Bearbeiten-Fenster ist ein Fenster ────────────────────
// Bisher war jeder Dialog ein Vorhang: er lag in der Mitte, nahm den
// ganzen Schirm, und wer nachsehen wollte, was dahinter steht — der
// eigene Bogen, die Liste, der Kampf —, musste ihn schliessen und die
// Eingaben aufgeben.
//
// Jetzt hat jeder Dialog eine Titelzeile, an der man ihn beiseite
// schiebt, und einen Knopf, der ihn auf genau diese Zeile zusammen-
// klappt. Zugeklappt faellt der Vorhang weg: das Heldenbuch dahinter
// ist wieder zu bedienen, und der Dialog wartet als schmaler Balken,
// bis man ihn wieder aufklappt. Auf dem Telefon liegt dieser Balken am
// unteren Rand — dort, wo der Dialog ohnehin aufgeht.
//
// Damit dafuer nicht dreissig Dialoge einzeln umgeschrieben werden
// mussten, arbeitet das Fenster am fertigen Baum: es nimmt den Dialog,
// den es umschliesst, markiert dessen erstes Kind als Kopf — die
// Titelzeile, die jeder ohnehin hat — und haengt die beiden Knoepfe
// daneben. Wer <Fenster> statt <div className="form-overlay"> schreibt,
// bekommt alles Weitere geschenkt.
const FENSTER_LUFT = 120;   // so viel bleibt immer greifbar am Rand

// Nicht jeder Dialog kennt einen Weg hinaus, den wir kennen: manche
// schliessen per Klick auf den Hintergrund, andere nur ueber ihren
// eigenen Abbrechen-Knopf. Das Kreuz nimmt, was da ist.
const fensterAusgang = (el) => el && [...el.querySelectorAll('button')].find(b =>
  !b.classList.contains('fenster-knopf')
  && /^(abbrechen|schlie(ss|ß)en|fertig|verstanden|✕|✕ .*)$/i.test((b.textContent || '').trim()));

const Fenster = ({ onClick, children, ...rest }) => {
  const [pos, setPos] = useState(null);    // null = mittig, wie bisher
  const [zu, setZu]   = useState(false);
  const [ausgang, setAusgang] = useState(false);
  const haus = useRef(null);
  const zug  = useRef(null);

  useEffect(() => { setAusgang(!!onClick || !!fensterAusgang(haus.current)); }, [onClick]);

  const schliessen = () => {
    if (onClick) { onClick({stopPropagation: () => {}}); return; }
    const k = fensterAusgang(haus.current);
    if (k) k.click();
  };

  // Geschoben wird am Kopf — und nur dort, damit ein Griff daneben nicht
  // aus Versehen das ganze Fenster mitnimmt.
  const zugStart = (e) => {
    const el = haus.current;
    if (!el || !e.target.closest) return;
    if ((window.innerWidth || 0) <= 640) return;   // am Telefon liegt es unten fest
    if (!e.target.closest('.fenster-kopf')) return;
    if (e.target.closest('button, a, input, select, textarea, [contenteditable]')) return;
    const r = el.getBoundingClientRect();
    zug.current = {dx: e.clientX - r.left, dy: e.clientY - r.top};
    setPos({x: r.left, y: r.top, w: r.width});
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const zugBewegen = (e) => {
    if (!zug.current) return;
    const b = window.innerWidth || 1200, h = window.innerHeight || 800;
    setPos(p => p && ({...p,
      x: Math.max(-p.w + FENSTER_LUFT, Math.min(e.clientX - zug.current.dx, b - FENSTER_LUFT)),
      y: Math.max(0, Math.min(e.clientY - zug.current.dy, h - 44))}));
  };
  const zugEnde = () => { zug.current = null; };

  const kind = React.Children.toArray(children).find(k => React.isValidElement(k));
  if (!kind) return null;

  const innen = React.Children.toArray(kind.props.children);
  const kopfI = innen.findIndex(k => React.isValidElement(k) && typeof k.type === 'string');
  if (kopfI >= 0) {
    innen[kopfI] = React.cloneElement(innen[kopfI], {
      className: ((innen[kopfI].props.className || '') + ' fenster-kopf').trim(),
    });
    innen.splice(kopfI, 0, (
      <div className="fenster-knoepfe" key="hb-fenster-knoepfe">
        <button type="button" className="fenster-knopf" onClick={()=>setZu(z=>!z)}
          aria-expanded={!zu} title={zu ? 'Wieder aufklappen' : 'Zuklappen — an das Heldenbuch dahinter'}
          aria-label={zu ? 'Fenster aufklappen' : 'Fenster zuklappen'}>{zu ? '▴' : '▾'}</button>
        {ausgang && (
          <button type="button" className="fenster-knopf" onClick={schliessen}
            title="Schließen" aria-label="Fenster schließen">✕</button>
        )}
      </div>
    ));
  }

  const gehaeuse = React.cloneElement(kind, {
    ref: haus,
    className: ((kind.props.className || '') + ' fenster'
                + (zu ? ' zu' : '') + (pos ? ' los' : '')).trim(),
    style: {...(kind.props.style || {}),
            ...(pos ? {position: 'fixed', left: pos.x, top: pos.y, width: pos.w,
                       maxWidth: 'none', margin: 0,
                       maxHeight: 'calc(100vh - ' + Math.round(pos.y) + 'px - 14px)'} : null)},
    onPointerDown: zugStart,
    onPointerMove: zugBewegen,
    onPointerUp: zugEnde,
    onPointerCancel: zugEnde,
    children: innen,
  });

  // Wer ein Fenster beiseite schiebt, will sehen, was daneben steht.
  // Der Vorhang verschwindet deshalb, sobald das Fenster verschoben ist
  // - genau wie beim Zuklappen.
  return (
    <div className={'form-overlay' + (zu ? ' zu' : '') + (pos ? ' los' : '')}
      onClick={onClick} {...rest}>
      {gehaeuse}
    </div>
  );
};
