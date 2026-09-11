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

// ── Eine Liste als Text einfügen ─────────────────────────────────
// Beute und Gegner entstehen am Tisch als Aufzählung: auf einem Zettel,
// in einer Nachricht, in der Antwort einer KI. Sie danach Zeile für
// Zeile in Felder zu übertragen, scheut jeder — und dann steht es
// nirgends.
//
// Der Baustein bringt das Feld mit, die Anweisung zum Kopieren und die
// Rückmeldung. Was der Text bedeutet, weiss nur das Fenster, das ihn
// liest: `onText` bekommt ihn roh und antwortet mit {gut, meldung}.
// Zugeklappt steht hier nur ein Knopf — wer von Hand tippt, soll ihn
// nicht jedes Mal wegschieben.
const ListeEinfuegen = ({ anweisung, platzhalter, aufschrift, onText }) => {
  const [offen, setOffen] = useState(false);
  const [roh, setRoh] = useState('');
  const [meldung, setMeldung] = useState('');
  const [zeigAnweisung, setZeigAnweisung] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const anweisungFeld = useRef(null);

  const uebernehmen = () => {
    const a = onText(roh) || {};
    setMeldung(a.meldung || '');
    if (a.gut) { setRoh(''); setOffen(false); }
  };

  // Kopieren geht auf zwei Wegen, und einer davon fehlt ohne HTTPS.
  // Deshalb liegt die Anweisung in einem Feld: markiert ist sie in
  // jedem Fall, und wer mag, nimmt sie mit der Tastatur.
  const kopieren = () => {
    const f = anweisungFeld.current;
    if (f) { f.focus(); f.select(); }
    const fertig = () => { setKopiert(true); setTimeout(() => setKopiert(false), 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(anweisung).then(fertig, () => {});
    } else {
      try { if (document.execCommand('copy')) fertig(); } catch (e) {}
    }
  };

  return (
    <div className="liste-einfuegen">
      <button className="bj-taste liste-einfuegen-auf"
        onClick={()=>{ setOffen(o => !o); setMeldung(''); }}>
        📋 {offen ? 'Liste zuklappen' : (aufschrift || 'Liste einfügen')}
      </button>
      {offen && (
        <>
          <textarea className="form-input liste-roh" value={roh} rows={7}
            placeholder={platzhalter}
            onChange={e=>{ setRoh(e.target.value); setMeldung(''); }} />
          <div className="liste-einfuegen-fuss">
            <button className="bj-taste" onClick={()=>setZeigAnweisung(a => !a)}>
              {zeigAnweisung ? 'Anweisung zu' : 'Anweisung für eine KI'}
            </button>
            <button className="btn-save" disabled={!roh.trim()} onClick={uebernehmen}>
              Übernehmen
            </button>
          </div>
          {zeigAnweisung && (
            <div className="liste-anweisung">
              <div className="ass-warum">Diesen Text der KI vorlegen und unten anhängen,
                was gebraucht wird. Was zurückkommt, kommt hier oben hinein.</div>
              <textarea className="form-input liste-roh" readOnly rows={8}
                ref={anweisungFeld} value={anweisung} />
              <button className="bj-taste" onClick={kopieren}>
                {kopiert ? '✓ Kopiert' : 'Anweisung kopieren'}
              </button>
            </div>
          )}
        </>
      )}
      {meldung && <div className="liste-meldung">{meldung}</div>}
    </div>
  );
};

// ── Die Ausgabe ─────────────────────────────────────────────────
// Steht an einer Stelle und wird an zweien gezeigt: im Logo der
// Heldenleiste und in der schmalen Ansicht.
const HB_VERSION = 'v5.3.5';

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
const FENSTER_RAND = 12;    // so viel Abstand bleibt, wenn es hereingeholt wird

// Nicht jeder Dialog kennt einen Weg hinaus, den wir kennen: manche
// schliessen per Klick auf den Hintergrund, andere nur ueber ihren
// eigenen Abbrechen-Knopf. Das Kreuz nimmt, was da ist.
//
// **Nur was ein Wort dransteht.** Ein blosses ✕ galt frueher auch als
// Ausgang — und in einer Liste ist das erste ✕ der Loeschknopf der
// ersten Zeile. Wer das Fenster zumachen wollte, wurde stattdessen
// gefragt, ob die Adamantruestung aus der Datenbank soll. Gesucht wird
// zuerst im Fuss, denn dort steht der Weg hinaus, wenn es einen gibt.
const FENSTER_AUSGANG = /^(abbrechen|schlie(ss|ß)en|fertig|verstanden)$/i;
const fensterAusgang = (el) => {
  if (!el) return null;
  const passt = (b) => !b.classList.contains('fenster-knopf')
    && FENSTER_AUSGANG.test((b.textContent || '').trim());
  return [...el.querySelectorAll('.form-actions button')].find(passt)
      || [...el.querySelectorAll('button')].find(passt)
      || null;
};

// onZu sagt dem Rahmen, wie dieses Fenster zugeht — für die Fälle, in
// denen Suchen die falsche Antwort gibt: das Datenbankfenster hat im
// Fuss mal "Schließen" und mal "Abbrechen", je nachdem, ob gerade ein
// Eintrag bearbeitet wird, und das Kreuz soll beide Male dasselbe tun.
// onClick bleibt, was es war: der Klick auf den Hintergrund.
const Fenster = ({ onClick, onZu, children, ...rest }) => {
  const [pos, setPos] = useState(null);    // null = mittig, wie bisher
  const [zu, setZu]   = useState(false);
  const [ausgang, setAusgang] = useState(false);
  const haus = useRef(null);
  const zug  = useRef(null);

  useEffect(() => { setAusgang(!!onZu || !!onClick || !!fensterAusgang(haus.current)); },
            [onClick, onZu]);

  const schliessen = () => {
    if (onZu)    { onZu(); return; }
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
    // w ist die Breite, die gerade gilt; w0 die, die das Fenster haben
    // will. Auf einem schmalen Schirm sind sie verschieden, und wird er
    // wieder breit, soll das Fenster seine alte Breite zurueckbekommen.
    setPos({x: r.left, y: r.top, w: r.width, w0: r.width});
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

  // Ein verschobenes Fenster traegt seine Breite als style-Attribut. Wer
  // es am Zipfel zieht, aendert dieselbe Eigenschaft — und das naechste
  // Neuzeichnen wuerde sie zuruecksetzen. Deshalb wird die gezogene
  // Breite in den Zustand uebernommen, sobald sie sich geaendert hat.
  useEffect(() => {
    const el = haus.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const beo = new ResizeObserver(() => setPos(p => {
      if (!p) return p;                    // mittig: da mischt sich niemand ein
      const w = Math.round(el.getBoundingClientRect().width);
      return (!w || Math.abs(w - p.w) < 2) ? p : {...p, w, w0: w};
    }));
    beo.observe(el);
    return () => beo.disconnect();
  }, [pos !== null]);

  // Ein verschobenes Fenster steht in Bildpunkten vom linken oberen Eck.
  // Wird das Browserfenster kleiner, bliebe es liegen, wo es lag — also
  // draussen, mitsamt seinem Abbrechen-Knopf. Es kommt deshalb mit,
  // sobald sich die Groesse aendert, und wird schmaler, wenn es sonst
  // nicht mehr hineinpasst.
  useEffect(() => {
    const anpassen = () => setPos(p => {
      if (!p) return p;
      const b = window.innerWidth || 1200, h = window.innerHeight || 800;
      const w = Math.max(280, Math.min(p.w0 || p.w, b - 2 * FENSTER_RAND));
      const x = Math.max(FENSTER_RAND, Math.min(p.x, Math.max(FENSTER_RAND, b - w - FENSTER_RAND)));
      const y = Math.max(0, Math.min(p.y, Math.max(0, h - 44)));
      return (w === p.w && x === p.x && y === p.y) ? p : {...p, w, x, y};
    });
    window.addEventListener('resize', anpassen);
    return () => window.removeEventListener('resize', anpassen);
  }, []);

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
    // Ein Klick im Fenster ist kein Klick auf den Hintergrund. Das
    // stand bisher in jedem Dialog einzeln; wer es vergass, dessen
    // Fenster schloss sich beim ersten Knopfdruck darin. Es gehoert
    // hierher, weil es fuer jedes Fenster gilt.
    onClick: (e) => {
      if (kind.props.onClick) kind.props.onClick(e);
      e.stopPropagation();
    },
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

// ── Was sich geändert hat ───────────────────────────────────────
// Die Ausgabe-Nummer war bisher eine Aufschrift. Sie ist der Ort, an
// dem man nachsieht, was neu ist — also führt sie jetzt dorthin.
//
// Gelesen wird die PATCHNOTES.md selbst, und zwar erst beim Öffnen:
// tausend Zeilen bei jedem Start zu laden, um sie einmal im Monat zu
// zeigen, wäre verkehrt. Eine zweite Fassung der Notizen im Programm
// gäbe es nicht — die wäre nach der ersten Auslieferung veraltet.
const PatchnotesStuecke = ({ text }) => (
  <>{patchnotesInline(text).map((s, i) =>
    s.art === 'fett' ? <b key={i}>{s.text}</b>
    : s.art === 'code' ? <code key={i}>{s.text}</code>
    : <React.Fragment key={i}>{s.text}</React.Fragment>)}</>
);

const PatchnotesBlock = ({ b }) => {
  if (b.art === 'kopf')   return <h4 className="pn-kopf"><PatchnotesStuecke text={b.text} /></h4>;
  if (b.art === 'absatz') return <p className="pn-absatz"><PatchnotesStuecke text={b.text} /></p>;
  if (b.art === 'punkte') return (
    <ul className="pn-punkte">
      {b.zeilen.map((z, i) => <li key={i}><PatchnotesStuecke text={z} /></li>)}
    </ul>
  );
  if (b.art === 'code') return <pre className="pn-code">{b.zeilen.join('\n')}</pre>;
  if (b.art === 'tabelle') return (
    // Eine Tabelle rollt in ihrem eigenen Rahmen zur Seite; das Fenster
    // selbst soll dabei stehen bleiben.
    <div className="pn-tabelle-rahmen">
      <table className="pn-tabelle">
        <thead><tr>{b.kopf.map((z, i) => <th key={i}><PatchnotesStuecke text={z} /></th>)}</tr></thead>
        <tbody>
          {b.reihen.map((r, i) => (
            <tr key={i}>{r.map((z, j) => <td key={j}><PatchnotesStuecke text={z} /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return null;
};

const PatchnotesFenster = ({ onSchliessen }) => {
  const [text, setText] = useState(null);        // null = lädt, '' = ging nicht

  useEffect(() => {
    // Mit derselben Ausgabe-Nummer wie die übrigen Dateien: ohne sie käme
    // nach einer Auslieferung der Stand von gestern aus dem Zwischenspeicher.
    const s = document.querySelector('script[src*="app.js"]');
    const v = s ? ((s.getAttribute('src') || '').split('?')[1] || '') : '';
    let weg = false;
    fetch('PATCHNOTES.md' + (v ? '?' + v : ''))
      .then(r => r.ok ? r.text() : Promise.reject(new Error(r.status)))
      .then(t => { if (!weg) setText(t); }, () => { if (!weg) setText(''); });
    return () => { weg = true; };
  }, []);

  const ausgaben = text ? patchnotesAusgaben(text) : [];

  return (
    <Fenster onClick={onSchliessen}>
      <div className="form-modal pn-fenster">
        <div className="form-title">📜 Was sich geändert hat</div>
        <div className="pn-inhalt">
          {text === null && <div className="probe-leer">Wird geladen…</div>}
          {text === '' && (
            <div className="probe-leer">
              Die Patchnotes konnten nicht geladen werden — liegt die
              PATCHNOTES.md neben der index.html?
            </div>
          )}
          {/* Die neueste Ausgabe geht offen auf, die älteren stehen
              zugeklappt darunter: vierzehn Ausgaben am Stück liest
              niemand, aber nachschlagen will man sie können. */}
          {ausgaben.map((a, i) => (
            <EinstBlock key={a.name} titel={a.name} offenStart={i === 0}
              kurz={i === 0 ? 'diese Ausgabe' : ''}>
              {a.bloecke.map((b, j) => <PatchnotesBlock key={j} b={b} />)}
            </EinstBlock>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
      </div>
    </Fenster>
  );
};

// ── Bilder ablegen ───────────────────────────────────────────────
// Bis v5.1 gab es an sieben Stellen sieben verschiedene Bildfelder, und
// alle konnten dasselbe: klicken, Datei suchen, öffnen. Für eine
// Spielleitung, die mitten im Abend das Bild eines Gegners einsetzen
// will, sind das drei Griffe zu viel.
//
// Hier steht das einmal, und es nimmt drei Wege an:
//
//   * hineinziehen — aus dem Dateiverwalter, aus dem Bildbetrachter
//   * anklicken — der alte Weg, für alle, die ihn gewohnt sind
//   * einfügen — Strg+V, wenn irgendwo ein Bild kopiert wurde
//
// Was NICHT geht: ein Bild aus einer fremden Webseite direkt
// hereinziehen. Dabei kommt keine Datei an, sondern eine Adresse, und
// die dürfte der Browser aus Sicherheitsgründen gar nicht in eine
// Leinwand zeichnen. Kopieren und einfügen geht dafür.
const BILD_ART = /^image\//;

// Wer zuletzt aufgemacht hat, fängt das Eingefügte. Sonst schriebe ein
// Strg+V bei zwei offenen Formularen in beide.
let bildAblageZaehler = 0;

const BildAblage = ({ bild, maxPx, aufschrift, hinweis, hoehe, rund, onBild, onWeg }) => {
  const [ueber, setUeber] = React.useState(false);
  const [laeuft, setLaeuft] = React.useState(false);
  const eingabe = React.useRef(null);
  const nimmRef = React.useRef(null);
  const meins = React.useRef(0);

  const nimm = (datei) => {
    if (!datei) return;
    if (!BILD_ART.test(datei.type || '')) return;
    setLaeuft(true);
    compressImage(datei, maxPx || 800, (daten) => {
      setLaeuft(false);
      if (daten) onBild(daten);
    });
  };
  nimmRef.current = nimm;

  React.useEffect(() => {
    meins.current = ++bildAblageZaehler;
    const einfuegen = (e) => {
      // Nur die jüngste Ablage hört zu, und nie, während jemand in ein
      // Textfeld schreibt — dort ist Strg+V etwas anderes.
      if (meins.current !== bildAblageZaehler) return;
      const z = e.target;
      if (z && /^(INPUT|TEXTAREA|SELECT)$/.test(z.tagName || '')) return;
      if (z && z.isContentEditable) return;
      const sachen = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < sachen.length; i++) {
        if (sachen[i].kind === 'file' && BILD_ART.test(sachen[i].type || '')) {
          const d = sachen[i].getAsFile();
          if (d) { e.preventDefault(); nimmRef.current(d); return; }
        }
      }
    };
    document.addEventListener('paste', einfuegen);
    return () => document.removeEventListener('paste', einfuegen);
  }, []);

  const waehlen = () => { if (eingabe.current) eingabe.current.click(); };

  return (
    <div className={'bild-ablage' + (ueber ? ' ueber' : '') + (bild ? ' voll' : '')
        + (rund ? ' rund' : '')}
      style={hoehe ? {minHeight: hoehe} : undefined}
      role="button" tabIndex={0}
      title={bild ? 'Anderes Bild — ziehen, klicken oder Strg+V'
                  : 'Bild hineinziehen, anklicken oder Strg+V'}
      onClick={waehlen}
      onKeyDown={(e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehlen(); } }}
      // dragover MUSS abgefangen werden, sonst öffnet der Browser das
      // Bild in einem neuen Tab und das Formular ist weg.
      onDragOver={(e)=>{ e.preventDefault(); if (!ueber) setUeber(true); }}
      onDragEnter={(e)=>{ e.preventDefault(); setUeber(true); }}
      onDragLeave={(e)=>{ if (!e.currentTarget.contains(e.relatedTarget)) setUeber(false); }}
      onDrop={(e)=>{
        e.preventDefault(); setUeber(false);
        const d = e.dataTransfer;
        const datei = d && d.files && d.files[0];
        if (datei) nimm(datei);
      }}>

      {bild && <img className="bild-ablage-bild" src={bild} alt="" />}

      <div className="bild-ablage-text">
        {laeuft ? <b>Wird verkleinert…</b>
          : ueber ? <b>Loslassen</b>
          : <>
              <b>{aufschrift || (bild ? '🖼 Anderes Bild' : '📷 Bild')}</b>
              <i>{hinweis || 'ziehen · klicken · Strg+V'}</i>
            </>}
      </div>

      <input ref={eingabe} type="file" accept="image/*" style={{display:'none'}}
        onChange={(e)=>{
          const d = e.target.files && e.target.files[0];
          e.target.value = '';        // damit dieselbe Datei erneut geht
          nimm(d);
        }} />

      {bild && onWeg && (
        <button type="button" className="bild-ablage-weg" title="Bild entfernen"
          aria-label="Bild entfernen"
          onClick={(e)=>{ e.stopPropagation(); onWeg(); }}>✕</button>
      )}
    </div>
  );
};

// ── Ein Fenster, das stehen bleibt, wo man es hinschiebt ─────────
// Der Kampf braucht mehrere davon: die Reihenfolge fuer die Runde, die
// Karte fuer die Spielleitung, die Karte fuer die Runde. Alle drei
// sollen sich schieben lassen und sich merken, wo sie zuletzt standen —
// deshalb steht das Schieben hier und nicht dreimal nebenan.
//
// Gemerkt wird je Fenster unter einem eigenen Schluessel. Beim Laden
// wird die Stelle geklemmt: ein Fenster, das seit dem letzten Mal auf
// einem breiteren Schirm stand, waere sonst nicht mehr zu fassen.
//
// Das Fenster der Taverne (2f-automat.jsx) macht dasselbe noch selbst.
// Es umzustellen waere Arbeit ohne Gewinn fuer den Spieler — wer dort
// einmal etwas anfasst, kann es dann mit erledigen.
// Und dasselbe fuer die Groesse. Ein Fenster, das am Schreibtisch auf
// neunhundert Punkte gezogen wurde, darf auf dem iPad nicht neunhundert
// Punkte breit aufgehen — sonst haengt sein Fuss unter dem Schirmrand,
// und dort steht der Knopf, den man drueckt.
const schiebeMasz = (g) => {
  if (!g || !(+g.w > 0)) return null;
  const b = window.innerWidth  || 1200;
  const h = window.innerHeight || 800;
  return {w: Math.max(200, Math.min(+g.w, b - 24)),
          h: Math.max(120, Math.min(+g.h, h - 24))};
};

const schiebeKlemmen = (pos, breite) => ({
  x: Math.max(-(breite || 460) + 140, Math.min(pos.x, (window.innerWidth || 1200) - 140)),
  y: Math.max(0, Math.min(pos.y, (window.innerHeight || 800) - 60)),
});

const useSchiebefenster = (schluessel, standard, breite) => {
  const gemerkt = () => {
    try {
      const d = JSON.parse(localStorage.getItem(schluessel) || 'null');
      if (d && Number.isFinite(+d.x)) return d;
    } catch {}
    return null;
  };
  const [pos, setPos] = React.useState(() => {
    const d = gemerkt();
    return schiebeKlemmen(d ? {x: +d.x, y: +d.y} : standard, breite);
  });
  const zug = React.useRef(null);
  const leib = React.useRef(null);
  const uhr = React.useRef(null);
  // Die Stelle steht auch als Referenz da: der Beobachter der Groesse
  // laeuft ausserhalb des Renderns und saehe sonst die Stelle von
  // damals.
  const posRef = React.useRef(pos);
  posRef.current = pos;
  const merken = (p) => {
    // Was schon dasteht, bleibt stehen: wer schiebt, aendert die Groesse
    // nicht, und wer zieht, aendert die Stelle nicht.
    const alt = gemerkt() || {};
    try { localStorage.setItem(schluessel, JSON.stringify({...alt, ...p})); } catch {}
  };
  React.useEffect(() => () => clearTimeout(uhr.current), []);
  return {
    pos,
    // An den Leib des Fensters angebracht. Der Browser aendert die
    // Groesse selbst (CSS `resize`); hier wird nur gemerkt, was dabei
    // herauskam — und beim naechsten Mal wieder eingestellt.
    //
    // Die Mindestgroesse steht im Stylesheet, nicht hier: sie haengt am
    // Inhalt, und der weiss es besser als eine Zahl in einem Haken.
    masz: {
      ref: (el) => {
        if (!el || el === leib.current) return;
        leib.current = el;
        const g = schiebeMasz(gemerkt());
        if (g) { el.style.width = g.w + 'px'; el.style.height = g.h + 'px'; }
        if (typeof ResizeObserver === 'undefined') return;
        // Der Beobachter meldet jeden Zwischenschritt beim Ziehen —
        // geschrieben wird erst, wenn die Hand einen Moment still ist.
        const beo = new ResizeObserver(() => {
          clearTimeout(uhr.current);
          uhr.current = setTimeout(() => {
            const b = Math.round(el.getBoundingClientRect().width);
            const h = Math.round(el.getBoundingClientRect().height);
            if (b > 0 && h > 0) merken({...posRef.current, w: b, h});
          }, 400);
        });
        beo.observe(el);
      },
    },
    // Am Kopf des Fensters angebracht. Der Schliessknopf sitzt dort auch
    // und darf nicht mitschieben.
    griff: {
      onPointerDown: (e) => {
        if (e.target.closest('button')) return;
        zug.current = {dx: e.clientX - pos.x, dy: e.clientY - pos.y};
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      },
      onPointerMove: (e) => {
        if (!zug.current) return;
        setPos(schiebeKlemmen({x: e.clientX - zug.current.dx,
                               y: e.clientY - zug.current.dy}, breite));
      },
      onPointerUp:     () => { if (zug.current) { zug.current = null; merken(pos); } },
      onPointerCancel: () => { if (zug.current) { zug.current = null; merken(pos); } },
    },
  };
};

// Ob ein Fenster eingeklappt ist. Steht neben der Stelle, weil es
// dasselbe Wesen hat: eine Kleinigkeit, die das Geraet sich merkt.
const useEingeklappt = (schluessel, anfang) => {
  const [zu, setZu] = React.useState(() => {
    try {
      const d = localStorage.getItem(schluessel);
      if (d === '0' || d === '1') return d === '1';
    } catch {}
    return !!anfang;
  });
  return [zu, (wert) => setZu(v => {
    const neu = typeof wert === 'function' ? wert(v) : wert;
    try { localStorage.setItem(schluessel, neu ? '1' : '0'); } catch {}
    return neu;
  })];
};

// Und das Fenster selbst. Kopf zum Schieben, ein Dreieck zum Ein- und
// Ausklappen, ein Kreuz zum Schliessen — beides gemerkt, damit der
// Kampf nicht jedes Mal wieder aufgeraeumt werden muss.
const Schiebefenster = ({ schluessel, standard, breite, titel, kopfExtra,
                          zuAnfang, groessbar, onSchliessen, klasse, children }) => {
  const {pos, griff, masz} = useSchiebefenster(schluessel + '_pos', standard, breite);
  const [zu, setZu] = useEingeklappt(schluessel + '_zu', zuAnfang);
  return (
    <div className={'sf-fenster' + (zu ? ' zu' : '') + (groessbar ? ' weit' : '')
                    + (klasse ? ' ' + klasse : '')}
      style={breite ? {left: pos.x, top: pos.y, width: breite}
                    : {left: pos.x, top: pos.y}}
      {...masz}>
      <div className="sf-kopf" {...griff} title="Zum Verschieben ziehen">
        <button type="button" className="sf-klapp" aria-expanded={!zu}
          title={zu ? 'Ausklappen' : 'Einklappen'}
          onClick={()=>setZu(z => !z)}>{zu ? '▸' : '▾'}</button>
        <span className="sf-titel">{titel}</span>
        {kopfExtra}
        {onSchliessen && (
          <button type="button" className="sf-x" onClick={onSchliessen}
            title="Schließen" aria-label="Schließen">✕</button>
        )}
      </div>
      {/* Jedes Fenster laesst sich am Zipfel groesser und kleiner
          ziehen. Wie klein, steht im Stylesheet: unter seiner
          Mindestgroesse faengt ein Fenster an, Dinge zu verstecken,
          statt sie nur enger zu setzen. */}
      {!zu && <div className="sf-leib">{children}</div>}
    </div>
  );
};
