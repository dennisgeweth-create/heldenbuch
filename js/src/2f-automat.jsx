// Heldenbuch — „Dreifaches Glück", der Automat in der Taverne des Glücks.
//
// Im Ablauf nach dem Vorbild klassischer Dreiwalzer gebaut: 3×3 Felder,
// fünf feste Linien (die drei Reihen und die beiden Diagonalen), Gewinn
// ist immer drei gleiche Symbole auf einer Linie. Name, Symbole und
// Aussehen sind eigene — nachgebaut wird der Ablauf, nicht die Aufmachung.
//
// Die Marken liegen im Geraet, nicht am Server und nicht am Charakter:
// das hier ist Zeitvertreib, kein Teil der Kampagnenwirtschaft. Kein
// fremder Bogen wird angefasst, keine Anfrage geht nach draussen. Der
// Umbau auf echtes Gold spaeter ist trotzdem vorbereitet — der Automat
// kennt nur "lesen" und "schreiben", nicht das Feld dahinter.

const AUTOMAT_SPEICHER = 'hb_automat';
const MARKEN_START = 200;

// Gewicht steuert, wie oft ein Symbol faellt; zahlt ist das Vielfache des
// Einsatzes bei drei gleichen auf einer Linie. Beides zusammen ergibt die
// Quote, und die rechnet automatQuote() aus — geraten wird hier nichts.
const AUTOMAT_SYMBOLE = [
  {k:'ratte',  z:'🐀', name:'Ratte',        gewicht:40, zahlt:2},
  {k:'krug',   z:'🍺', name:'Krug',         gewicht:30, zahlt:4,   speise:true},
  {k:'kaese',  z:'🧀', name:'Käse',         gewicht:22, zahlt:7,   speise:true},
  {k:'keule',  z:'🍗', name:'Keule',        gewicht:14, zahlt:14,  speise:true},
  {k:'apfel',  z:'🍎', name:'Apfel',        gewicht:9,  zahlt:30,  speise:true},
  {k:'muenze', z:'🪙', name:'Glücksmünze',  gewicht:6,  zahlt:40,  freidreh:true},
  {k:'kelch',  z:'🏺', name:'Kelch',        gewicht:4,  zahlt:80},
  {k:'rubin',  z:'💠', name:'Rubin',        gewicht:3,  zahlt:150},
  {k:'drache', z:'🐉', name:'Drachenauge',  gewicht:2,  zahlt:400},
];

// Die fuenf Linien auf dem Feld 0..8 (oben links nach unten rechts).
const AUTOMAT_LINIEN = [
  {name:'Oben',     felder:[0,1,2]},
  {name:'Mitte',    felder:[3,4,5]},
  {name:'Unten',    felder:[6,7,8]},
  {name:'Fallend',  felder:[0,4,8]},
  {name:'Steigend', felder:[6,4,2]},
];

const AUTOMAT_EINSAETZE = [5, 10, 20, 50];

const symbolVon = (k) => AUTOMAT_SYMBOLE.find(s => s.k === k) || AUTOMAT_SYMBOLE[0];

// ── Die Quote, ausgerechnet statt geschaetzt ─────────────────────
// Bei fuenf festen Linien und neun unabhaengig gezogenen Symbolen ist der
// Erwartungswert eine geschlossene Formel: je Symbol die Wahrscheinlichkeit
// hoch drei mal seine Auszahlung, mal fuenf Linien.
//
// Der Freidreh macht sie rekursiv — er ist selbst wieder eine ganze Quote
// wert. Also steht die Quote auf beiden Seiten und loest sich zu einer
// Division auf.
const automatQuote = (symbole) => {
  const liste = symbole || AUTOMAT_SYMBOLE;
  const summe = liste.reduce((s, x) => s + (+x.gewicht || 0), 0);
  if (!summe) return 0;
  let linien = 0, freidrehP = 0;
  liste.forEach(x => {
    const p = (+x.gewicht || 0) / summe;
    const p3 = p * p * p;
    linien += p3 * (+x.zahlt || 0);
    if (x.freidreh) freidrehP += p3;
  });
  linien *= AUTOMAT_LINIEN.length;
  // Ein Vollbild zahlt alle fuenf Linien und danach das Rad — drei Felder
  // von vier sind gruen, hoechstens dreimal. Kommt erst mit Stufe 4, steht
  // aber schon in der Rechnung, damit die Zahl spaeter nicht springt.
  const rad = 0.75 + 0.5625 + 0.421875;
  let vollbild = 0;
  liste.filter(x => x.speise).forEach(x => {
    const p = (+x.gewicht || 0) / summe;
    vollbild += Math.pow(p, 9) * 5 * (+x.zahlt || 0) * rad;
  });
  // Wahrscheinlichkeit, dass irgendeine Linie einen Freidreh bringt.
  const pFrei = Math.min(0.5, AUTOMAT_LINIEN.length * freidrehP);
  return (linien + vollbild) / (1 - pFrei);
};

// ── Ein Dreh ─────────────────────────────────────────────────────
const ziehSymbol = (liste, summe) => {
  let w = Math.random() * summe;
  for (const s of liste) { w -= (+s.gewicht || 0); if (w <= 0) return s.k; }
  return liste[liste.length - 1].k;
};
const zieheWalzen = (symbole) => {
  const liste = symbole || AUTOMAT_SYMBOLE;
  const summe = liste.reduce((s, x) => s + (+x.gewicht || 0), 0);
  return Array.from({length: 9}, () => ziehSymbol(liste, summe));
};

const werteAus = (feld, einsatz) => {
  const treffer = [];
  let gewinn = 0, freidreh = false;
  AUTOMAT_LINIEN.forEach((linie, i) => {
    const [a, b, c] = linie.felder;
    if (feld[a] !== feld[b] || feld[b] !== feld[c]) return;
    const sym = symbolVon(feld[a]);
    const betrag = Math.round(sym.zahlt * einsatz);
    gewinn += betrag;
    if (sym.freidreh) freidreh = true;
    treffer.push({nr: i, name: linie.name, felder: linie.felder, sym, betrag});
  });
  // Ein Vollbild aus Speisen — das Rad dazu kommt in Stufe 4.
  const erstes = feld[0];
  const vollbild = feld.every(x => x === erstes) && !!symbolVon(erstes).speise;
  return {gewinn, treffer, freidreh, vollbild};
};

// ── Marken ───────────────────────────────────────────────────────
// Nur im Geraet. Kein Server, kein Charakterbogen — und trotzdem schon
// hinter einer Abstraktion, damit "spaeter mit echtem Gold" eine
// Zeilenaenderung bleibt und kein Umbau.
const WAEHRUNGEN = {
  marken: {
    name: 'Spielmarken', kurz: '⛃',
    lesen: () => {
      try {
        const d = JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || 'null');
        return d && Number.isFinite(+d.marken) ? +d.marken : MARKEN_START;
      } catch { return MARKEN_START; }
    },
    schreiben: (n) => {
      try {
        const d = JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || '{}') || {};
        localStorage.setItem(AUTOMAT_SPEICHER, JSON.stringify({...d, marken: Math.max(0, Math.round(n))}));
      } catch {}
    },
  },
};

// ── Der Lauf der Walzen ──────────────────────────────────────────
// Jede Walze ist ein Band aus Zufallssymbolen, an dessen Ende die drei
// Symbole stehen, die stehenbleiben sollen. Das Band faehrt von oben nach
// unten durch und haelt auf den letzten dreien — mit unterschiedlichen
// Laufzeiten je Spalte, damit sie nacheinander stehen, wie es sich gehoert.
const WALZEN_BAND  = 16;                  // Zellen je Band
const WALZEN_DAUER = [900, 1150, 1400];   // Millisekunden je Spalte

const bandBauen = (feld, spalte) => {
  const vorlauf = Array.from({length: WALZEN_BAND - 3},
    () => AUTOMAT_SYMBOLE[Math.floor(Math.random() * AUTOMAT_SYMBOLE.length)].k);
  return [...vorlauf, feld[spalte], feld[3 + spalte], feld[6 + spalte]];
};

// ── Der Schirm ───────────────────────────────────────────────────
const AutomatSchirm = ({ onSchliessen }) => {
  const waehrung = WAEHRUNGEN.marken;
  const [marken, setMarkenRoh] = React.useState(() => waehrung.lesen());
  const [einsatz, setEinsatz] = React.useState(10);
  const [feld, setFeld] = React.useState(() => Array(9).fill('ratte'));
  const [ergebnis, setErgebnis] = React.useState(null);   // {gewinn, treffer, …}
  const [freidrehe, setFreidrehe] = React.useState(0);
  const [tafelOffen, setTafelOffen] = React.useState(false);
  const [baender, setBaender] = React.useState(() => [0,1,2].map(() => Array(WALZEN_BAND).fill('ratte')));
  const [dreh, setDreh] = React.useState(0);        // erzwingt den Neustart der Animation
  const [laeuft, setLaeuft] = React.useState(false);
  const [zeigeLinie, setZeigeLinie] = React.useState(-1);  // -1 = alle
  const [zaehler, setZaehler] = React.useState(0);
  const laufRef = React.useRef(null);

  const setMarken = (n) => { const m = Math.max(0, Math.round(n)); waehrung.schreiben(m); setMarkenRoh(m); };
  const quote = React.useMemo(() => automatQuote(AUTOMAT_SYMBOLE), []);

  // Wer Bewegung im Betriebssystem abgeschaltet hat, bekommt das Ergebnis
  // sofort. Ein Automat ist kein Grund, sich darueber hinwegzusetzen.
  const reduziert = React.useMemo(() => {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch { return false; }
  }, []);

  // Der Lauf ist Anzeige, nicht Buchhaltung. Gebucht wird sofort — sonst
  // haenge der Ausgang eines Spiels an einem Zeitgeber, den der Browser
  // im Hintergrund beliebig lange aufschieben darf. Hier stand der
  // Automat dann auf "Läuft…" und die Taste blieb gesperrt.
  //
  // Deshalb loest jeder Weg das Ergebnis auf: der Zeitgeber, das
  // Zurueckkommen zum Fenster, und das Verlassen der Seite.
  const schwebendRef = React.useRef(null);   // {e, faellig}
  const aufloesen = React.useCallback(() => {
    const sch = schwebendRef.current;
    if (!sch) return;
    schwebendRef.current = null;
    if (laufRef.current) { clearTimeout(laufRef.current); laufRef.current = null; }
    setLaeuft(false);
    setErgebnis(sch.e);
  }, []);

  React.useEffect(() => {
    const wach = () => {
      // Im Hintergrund gibt es nichts zu sehen; sichtbar werden heisst,
      // dass der Lauf laengst haette enden sollen.
      if (schwebendRef.current && (document.hidden || Date.now() >= schwebendRef.current.faellig)) aufloesen();
    };
    document.addEventListener('visibilitychange', wach);
    return () => {
      document.removeEventListener('visibilitychange', wach);
      if (laufRef.current) clearTimeout(laufRef.current);
    };
  }, [aufloesen]);

  const frei = freidrehe > 0;
  const kannDrehen = !laeuft && (frei || marken >= einsatz);

  const drehen = () => {
    if (!kannDrehen) return;
    const zahlt = frei ? 0 : einsatz;
    const neuesFeld = zieheWalzen(AUTOMAT_SYMBOLE);
    const e = werteAus(neuesFeld, einsatz);

    setFeld(neuesFeld);
    setBaender([0,1,2].map(sp => bandBauen(neuesFeld, sp)));
    setErgebnis(null); setZeigeLinie(-1); setZaehler(0);
    setDreh(d => d + 1);

    // Einsatz und Gewinn in einem Schritt und sofort: das Ergebnis steht
    // in dem Augenblick fest, in dem gezogen wird. Der Lauf zeigt es
    // nur noch.
    setMarken(marken - zahlt + e.gewinn);
    setFreidrehe(f => Math.max(0, f - (frei ? 1 : 0)) + (e.freidreh ? 1 : 0));

    if (reduziert) { setErgebnis(e); return; }
    const dauer = Math.max(...WALZEN_DAUER) + 60;
    schwebendRef.current = {e, faellig: Date.now() + dauer};
    setLaeuft(true);
    laufRef.current = setTimeout(aufloesen, dauer);
  };

  // Der Gewinn zaehlt hoch, statt dazustehen. Kurz genug, dass niemand
  // wartet, lang genug, dass man es merkt.
  React.useEffect(() => {
    if (!ergebnis || ergebnis.gewinn <= 0) { setZaehler(0); return; }
    const ziel = ergebnis.gewinn, start = Date.now(), dauer = 520;
    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dauer);
      setZaehler(Math.round(ziel * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) clearInterval(tick);
    }, 40);
    return () => clearInterval(tick);
  }, [ergebnis]);

  // Mehrere Gewinnlinien werden nacheinander gezeigt, sonst leuchtet das
  // halbe Feld und man sieht nicht, woran es lag.
  React.useEffect(() => {
    if (!ergebnis || ergebnis.treffer.length < 2) { setZeigeLinie(-1); return; }
    let i = 0;
    setZeigeLinie(0);
    const tick = setInterval(() => { i = (i + 1) % ergebnis.treffer.length; setZeigeLinie(i); }, 900);
    return () => clearInterval(tick);
  }, [ergebnis]);

  // Welche Felder gerade leuchten. Ohne Ergebnis keins, bei einer Linie
  // deren drei, bei mehreren die gerade gezeigte.
  const leuchtet = new Set();
  if (ergebnis && !laeuft) {
    const gezeigt = ergebnis.treffer.length > 1 && zeigeLinie >= 0
      ? [ergebnis.treffer[zeigeLinie]] : ergebnis.treffer;
    gezeigt.forEach(t => t.felder.forEach(f => leuchtet.add(f)));
  }

  return (
    <div className="automat-schirm">
      <div className="automat-kopf">
        <div className="automat-titel">🎰 Dreifaches Glück</div>
        <div className="automat-ort">Taverne des Glücks</div>
        <div className="automat-kasse">
          <span>{waehrung.kurz}</span><b>{marken}</b>
          <i>{waehrung.name}</i>
        </div>
        <button className="automat-x" onClick={onSchliessen} aria-label="Schließen">✕</button>
      </div>

      <div className="automat-mitte">
        <div className="automat-kasten">
          <div className={'automat-feld' + (laeuft ? ' laeuft' : '')} role="group" aria-label="Walzen">
            {[0,1,2].map(spalte => (
              <div className="automat-walze" key={spalte}>
                {/* Der Schluessel enthaelt die Nummer des Drehs: React baut
                    das Band dadurch neu auf, und die Animation faengt von
                    vorn an, statt beim zweiten Mal stehenzubleiben. */}
                <div className="automat-band" key={dreh}
                  style={laeuft ? {animationDuration: WALZEN_DAUER[spalte] + 'ms'} : {transform:'translateY(-81.25%)'}}>
                  {baender[spalte].map((k, i) => {
                    // Nur die letzten drei Zellen sind das Ergebnis; sie
                    // tragen die Hervorhebung, sobald die Walze steht.
                    const reihe = i - (WALZEN_BAND - 3);
                    const feldNr = reihe >= 0 ? reihe * 3 + spalte : -1;
                    return (
                      <div className={'automat-zelle' + (leuchtet.has(feldNr) ? ' treffer' : '')} key={i}>
                        <span>{symbolVon(k).z}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="automat-meldung" aria-live="polite">
            {laeuft ? (
              <span className="leise">…</span>
            ) : !ergebnis ? (
              <span className="leise">Einsatz wählen und drehen.</span>
            ) : ergebnis.gewinn > 0 ? (
              <>
                <b className="gewinn">+{zaehler}</b>
                <span className="leise">
                  {ergebnis.treffer.length > 1 && zeigeLinie >= 0
                    ? ergebnis.treffer[zeigeLinie].name + ' · ' + ergebnis.treffer[zeigeLinie].sym.name
                      + '  ·  +' + ergebnis.treffer[zeigeLinie].betrag
                      + '   (' + (zeigeLinie + 1) + ' von ' + ergebnis.treffer.length + ')'
                    : ergebnis.treffer.map(t => t.name + ' · ' + t.sym.name).join('   ')}
                </span>
              </>
            ) : (
              <span className="leise">Nichts. Nochmal.</span>
            )}
            {ergebnis && ergebnis.vollbild && <span className="vollbild">Vollbild!</span>}
            {freidrehe > 0 && <span className="freidreh">🪙 {freidrehe} Freidreh{freidrehe > 1 ? 'e' : ''}</span>}
          </div>

          <div className="automat-einsatz">
            <span className="automat-label">Einsatz</span>
            {AUTOMAT_EINSAETZE.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                disabled={frei} onClick={()=>setEinsatz(n)}>{n}</button>
            ))}
          </div>

          <button className={'automat-hebel' + (frei ? ' frei' : '')}
            disabled={!kannDrehen} onClick={drehen}>
            {laeuft ? 'Läuft…' : frei ? '🪙 Freidreh'
              : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig Marken'}
          </button>

          {marken < AUTOMAT_EINSAETZE[0] && !frei && !laeuft && (
            <button className="automat-nachschub" onClick={()=>setMarken(MARKEN_START)}>
              Der Wirt legt {MARKEN_START} Marken nach
            </button>
          )}
        </div>

        <div className="automat-tafel">
          <button className="automat-tafel-kopf" onClick={()=>setTafelOffen(o=>!o)}
            aria-expanded={tafelOffen}>
            <span>{tafelOffen ? '▾' : '▸'} Auszahlungen</span>
            <i>Quote {(quote * 100).toFixed(1).replace('.', ',')} %</i>
          </button>
          {tafelOffen && (
            <>
              <table className="automat-tabelle">
                <tbody>
                  {[...AUTOMAT_SYMBOLE].reverse().map(s => (
                    <tr key={s.k}>
                      <td className="sym">{s.z}{s.z}{s.z}</td>
                      <td className="nam">
                        {s.name}
                        {s.freidreh && <i>bringt einen Freidreh</i>}
                        {s.speise && <i>Vollbild möglich</i>}
                      </td>
                      <td className="zahl">{s.zahlt} ×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="automat-fussnote">
                Fünf Linien: die drei Reihen und die beiden Diagonalen. Drei
                gleiche Symbole auf einer Linie zahlen das Vielfache des
                Einsatzes. Die Quote ist aus Häufigkeit und Auszahlung
                gerechnet, nicht geschätzt.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
