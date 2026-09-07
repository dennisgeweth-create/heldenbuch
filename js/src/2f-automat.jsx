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
const AUTOMAT_STANDARD = [
  {k:'ratte',  z:'🐀', name:'Ratte',        gewicht:40, zahlt:1},
  {k:'krug',   z:'🍺', name:'Krug',         gewicht:30, zahlt:2.5, speise:true},
  {k:'kaese',  z:'🧀', name:'Käse',         gewicht:22, zahlt:4,   speise:true},
  {k:'keule',  z:'🍗', name:'Keule',        gewicht:14, zahlt:8,   speise:true},
  {k:'apfel',  z:'🍎', name:'Apfel',        gewicht:9,  zahlt:17,  speise:true},
  {k:'muenze', z:'🪙', name:'Glücksmünze',  gewicht:6,  zahlt:22,  freidreh:true},
  {k:'kelch',  z:'🏺', name:'Kelch',        gewicht:4,  zahlt:45},
  {k:'rubin',  z:'💠', name:'Rubin',        gewicht:3,  zahlt:85},
  {k:'drache', z:'🐉', name:'Drachenauge',  gewicht:2,  zahlt:225},
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

// Name und Zeichen stehen fest, Haeufigkeit und Auszahlung nicht: die
// Spielleitung stellt sie je Abenteuer. Was sie nicht angefasst hat,
// bleibt beim Standard.
const automatSymbole = (cfg) => {
  const eig = cfg && Array.isArray(cfg.symbole) ? cfg.symbole : null;
  if (!eig) return AUTOMAT_STANDARD;
  const liste = AUTOMAT_STANDARD.map(s => {
    const o = eig.find(x => x && x.k === s.k);
    return o ? {...s, gewicht: Math.max(0, +o.gewicht || 0), zahlt: Math.max(0, +o.zahlt || 0)} : s;
  });
  // Eine Walze, auf der nichts liegen kann, waere kein Automat mehr.
  return liste.some(x => x.gewicht > 0) ? liste : AUTOMAT_STANDARD;
};
const automatEinsaetze = (cfg) => {
  // Mit Gold gilt eine kleinere Leiter; sie steht dann in der
  // Einstellung, die der Tisch bekommt.
  const leiter = (cfg && Array.isArray(cfg.einsaetze)) ? cfg.einsaetze : AUTOMAT_EINSAETZE;
  const max = cfg && +cfg.maxEinsatz;
  const gefiltert = max ? leiter.filter(n => n <= max) : leiter;
  return gefiltert.length ? gefiltert : [leiter[0]];
};
// ── Das Vollbild ─────────────────────────────────────────────────
// Neun gleiche Speisen — das Bonusspiel des Automaten. Von allein faellt
// das so gut wie nie (die Wahrscheinlichkeit hoch neun: beim Krug einmal
// in zweihundertfuenfzigtausend Drehungen), und ein Bonus, den niemand je
// zu sehen bekommt, ist keiner. Deshalb wird es gezogen: mit einer
// eingestellten Haeufigkeit legt der Automat statt neun einzelner Symbole
// ein volles Bild. Welche Speise, entscheidet ihre Haeufigkeit — der Krug
// oft, der Apfel selten.
//
// Was das kostet, steht in der Quote und wird dort auch verrechnet: ein
// haeufigeres Vollbild heisst kleinere Linien.
const VOLLBILD_STANDARD = 200;                 // eine von zweihundert Drehungen
const VOLLBILD_STUFEN = [50, 100, 150, 200, 300, 500, 1000];

const automatVollbildEins = (cfg) => {
  const roh = cfg && cfg.vollbild;
  if (roh === undefined || roh === null || roh === '') return VOLLBILD_STANDARD;
  const n = Math.round(+roh || 0);
  return n > 0 ? Math.max(20, Math.min(5000, n)) : 0;
};
const automatVollbildP = (cfg) => { const n = automatVollbildEins(cfg); return n ? 1 / n : 0; };

const symbolVon = (k, liste) => (liste || AUTOMAT_STANDARD).find(s => s.k === k)
  || AUTOMAT_STANDARD.find(s => s.k === k) || AUTOMAT_STANDARD[0];

// ── Die Quote, ausgerechnet statt geschaetzt ─────────────────
// Bei fuenf festen Linien und neun unabhaengig gezogenen Symbolen ist der
// Erwartungswert eine geschlossene Formel: je Symbol die Wahrscheinlichkeit
// hoch drei mal seine Auszahlung, mal fuenf Linien.
//
// Zwei Dinge machen sie rekursiv: der Freidreh und das gezogene Vollbild
// sind selbst wieder eine ganze Quote wert. Also steht die Quote auf
// beiden Seiten der Gleichung und loest sich zu einer Division auf.
//
// Was das Rad im Mittel nachlegt: drei von vier Feldern sind gruen,
// hoechstens dreimal hintereinander.
const RAD_ERWARTUNG = 0.75 + 0.5625 + 0.421875;

const automatRechnung = (symbole, vollbildP) => {
  const liste = symbole || AUTOMAT_STANDARD;
  const summe = liste.reduce((s, x) => s + (+x.gewicht || 0), 0);
  if (!summe) return {quote: 0, bonus: 0};

  let linien = 0, freidrehP = 0, natur = 0;
  liste.forEach(x => {
    const p = (+x.gewicht || 0) / summe;
    const p3 = p * p * p;
    linien += p3 * (+x.zahlt || 0);
    if (x.freidreh) freidrehP += p3;
    // Das Vollbild, das von allein faellt — verschwindend, aber nicht null.
    if (x.speise) natur += Math.pow(p, 9) * 5 * (+x.zahlt || 0) * RAD_ERWARTUNG;
  });
  linien *= AUTOMAT_LINIEN.length;

  // Das gezogene Vollbild: fuenf Linien und danach das Rad.
  const speisen = liste.filter(x => x.speise && (+x.gewicht || 0) > 0);
  const gs = speisen.reduce((s, x) => s + (+x.gewicht || 0), 0);
  let voll = 0, vollFrei = 0;
  speisen.forEach(x => {
    const q = (+x.gewicht || 0) / gs;
    voll += q * 5 * (+x.zahlt || 0) * (1 + RAD_ERWARTUNG);
    if (x.freidreh) vollFrei += q;
  });
  // Ohne Speisen auf den Walzen gibt es nichts zu ziehen.
  const v = gs ? Math.max(0, Math.min(1, +vollbildP || 0)) : 0;

  const pFrei = Math.min(0.5, AUTOMAT_LINIEN.length * freidrehP);
  const nenner = 1 - (v * vollFrei + (1 - v) * pFrei);
  const quote = (v * voll + (1 - v) * (linien + natur)) / (nenner > 0 ? nenner : 1);
  return {quote, bonus: quote > 0 ? (v * voll) / quote : 0};
};
const automatQuote = (symbole, vollbildP) => automatRechnung(symbole, vollbildP).quote;

// Die Quote ist in den Auszahlungen linear — alle mit demselben Faktor
// zu strecken trifft das Ziel also genau. Nur das Runden auf ganze Zahlen
// verschiebt es wieder ein wenig, und deshalb steht danach die erreichte
// Zahl da und nicht die gewuenschte.
// Fein genug runden, damit die Zahl am Ende stimmt. Ganze Zahlen waren zu
// grob: die Ratte faellt so oft, dass ihre Auszahlung ein Drittel der
// ganzen Quote traegt — eine halbe Stelle mehr oder weniger verschob das
// Ziel um mehrere Prozentpunkte. Deshalb feiner, wo es haeufig ist, und
// glatt, wo die Zahlen ohnehin gross sind.
const zahlRunden = (x) => x < 10 ? Math.max(0.05, Math.round(x * 100) / 100)
                        : x < 50 ? Math.round(x * 10) / 10
                        : Math.round(x);
// Auszahlungen als Text: ohne unnoetige Nullen und mit Komma.
const zahlText = (z) => {
  const n = +z || 0;
  return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''))
    .replace('.', ',');
};

const automatEinregeln = (symbole, ziel, vollbildP) => {
  const jetzt = automatQuote(symbole, vollbildP);
  if (!jetzt || !ziel) return symbole;
  const f = ziel / jetzt;
  return symbole.map(s => ({...s, zahlt: zahlRunden((+s.zahlt || 0) * f)}));
};

// ── Ein Dreh ─────────────────────────────────────────────────────
const ziehSymbol = (liste, summe) => {
  let w = Math.random() * summe;
  for (const s of liste) { w -= (+s.gewicht || 0); if (w <= 0) return s.k; }
  return liste[liste.length - 1].k;
};
const zieheWalzen = (symbole, vollbildP) => {
  const liste = symbole || AUTOMAT_STANDARD;
  const summe = liste.reduce((s, x) => s + (+x.gewicht || 0), 0);
  // Erst die Frage, ob es ein Vollbild wird — danach neun einzelne Symbole.
  // Andersherum (neun ziehen und bei Bedarf ueberschreiben) waere dasselbe,
  // sagte aber nicht, dass hier zwei verschiedene Ziehungen stattfinden.
  const speisen = liste.filter(x => x.speise && (+x.gewicht || 0) > 0);
  const gs = speisen.reduce((s, x) => s + (+x.gewicht || 0), 0);
  if (gs && Math.random() < (+vollbildP || 0)) {
    return Array(9).fill(ziehSymbol(speisen, gs));
  }
  return Array.from({length: 9}, () => ziehSymbol(liste, summe));
};

const werteAus = (feld, einsatz, liste) => {
  const treffer = [];
  let gewinn = 0, freidreh = false;
  AUTOMAT_LINIEN.forEach((linie, i) => {
    const [a, b, c] = linie.felder;
    if (feld[a] !== feld[b] || feld[b] !== feld[c]) return;
    const sym = symbolVon(feld[a], liste);
    const betrag = Math.round(sym.zahlt * einsatz);
    gewinn += betrag;
    if (sym.freidreh) freidreh = true;
    treffer.push({nr: i, name: linie.name, felder: linie.felder, sym, betrag});
  });
  // Ein Vollbild aus Speisen — das Rad dazu kommt in Stufe 4.
  const erstes = feld[0];
  const vollbild = feld.every(x => x === erstes) && !!symbolVon(erstes, liste).speise;
  return {gewinn, treffer, freidreh, vollbild};
};

// ── Marken ───────────────────────────────────────────────────────
// Nur im Geraet. Kein Server, kein Charakterbogen — und trotzdem schon
// hinter einer Abstraktion, damit "spaeter mit echtem Gold" eine
// Zeilenaenderung bleibt und kein Umbau.
// ── Der Beutel haengt am Helden ────────────────────────────
// Bis hierher lagen die Marken im Geraet: ein Beutel, gleichgueltig wer
// spielte. Sie haengen jetzt am Helden — nicht, weil das Spiel es heute
// verlangte, sondern weil es der Umbau auf echtes Gold tut. Gold liegt im
// Bogen; wer die Marken schon dort fuehrt, muss spaeter nur das Feld
// tauschen und nicht die halbe Taverne.
//
// Und weil jemand zwei Charaktere gleichzeitig spielen kann, gibt es
// zwei Beutel. Welcher auf dem Tisch liegt, sagt der offene Bogen; im
// Kopf des Fensters steht es und laesst sich umstellen.
const beutelLesen = () => {
  try { return JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || '{}') || {}; }
  catch { return {}; }
};
const beutelSchreiben = (d) => {
  try { localStorage.setItem(AUTOMAT_SPEICHER, JSON.stringify(d)); } catch {}
};
const OHNE_HELD = '_ohne';   // ohne Bogen spielt man trotzdem

// ── Echtes Gold ────────────────────────────────────────
// Genau dafuer haengt der Beutel seit v4.7 am Helden. Die Tische kennen
// nur "lesen" und "schreiben", nicht das Feld dahinter — also reicht
// es, hier ein zweites Feld einzusetzen. Marken liegen im Geraet und
// gehen niemanden etwas an; Gold liegt im Bogen, geht ueber den Server
// und ist Teil der Kampagne. Was gilt, entscheidet die Spielleitung je
// Abenteuer.
const WAEHRUNG_GOLD = (lesen, schreiben) => ({
  name: 'Goldmünzen', kurz: '◉', gold: true,
  // Die Einsaetze sind andere: fuenfzig Goldmuenzen sind kein
  // Zeitvertreib mehr, sondern eine Ruestung.
  leiter: [1, 2, 5, 10],
  lesen, schreiben, zuletzt: () => null,
});

const WAEHRUNGEN = {
  marken: {
    name: 'Spielmarken', kurz: '⛃',
    lesen: (heldId) => {
      const d = beutelLesen();
      const b = d.beutel || {};
      const k = heldId || OHNE_HELD;
      if (Number.isFinite(+b[k])) return +b[k];
      // Was frueher im Geraet lag, bekommt der erste Held, der die
      // Taverne betritt. Beim ersten Einsatz ist es umgezogen und steht
      // dort nicht mehr — sonst erbte es jeder noch einmal.
      if (Number.isFinite(+d.marken)) return +d.marken;
      return MARKEN_START;
    },
    schreiben: (heldId, n) => {
      const d = beutelLesen();
      const {marken, ...rest} = d;
      beutelSchreiben({...rest,
        beutel: {...(d.beutel || {}), [heldId || OHNE_HELD]: Math.max(0, Math.round(n))},
        zuletzt: heldId || OHNE_HELD});
    },
    // Wer zuletzt gespielt hat — gebraucht, wenn gerade kein Bogen offen ist.
    zuletzt: () => beutelLesen().zuletzt || null,
  },
};

// ── Der Lauf der Walzen ──────────────────────────────────────────
// Jede Walze ist ein Band aus Zufallssymbolen, an dessen Ende die drei
// Symbole stehen, die stehenbleiben sollen. Das Band faehrt von oben nach
// unten durch und haelt auf den letzten dreien — mit unterschiedlichen
// Laufzeiten je Spalte, damit sie nacheinander stehen, wie es sich gehoert.
const WALZEN_BAND  = 16;                  // Zellen je Band
const WALZEN_DAUER = [900, 1150, 1400];   // Millisekunden je Spalte

const bandBauen = (feld, spalte, liste) => {
  const l = liste || AUTOMAT_STANDARD;
  const vorlauf = Array.from({length: WALZEN_BAND - 3},
    () => l[Math.floor(Math.random() * l.length)].k);
  return [...vorlauf, feld[spalte], feld[3 + spalte], feld[6 + spalte]];
};

// ── Das Rad der Fortuna ──────────────────────────────────────────
// Ein Vollbild aus Speisen oeffnet das Rad: vier Felder, drei gruene und
// ein rotes. Jedes gruene zahlt den Vollbildgewinn noch einmal, das rote
// beendet es, hoechstens dreimal. Daher der Name des Automaten.
//
// Feld 0 ist rot und liegt oben, 1 bis 3 sind gruen im Uhrzeigersinn.
const RAD_FELDER = 4;
const RAD_GRUEN  = 3;
const RAD_DAUER  = 2200;

// Wohin muss sich das Rad drehen, damit Feld k unter dem Zeiger steht?
// Immer vorwaerts und ueber mehrere volle Umdrehungen — ein Rad, das den
// kuerzesten Weg nimmt, sieht aus wie ein Zeiger, nicht wie ein Rad.
const radZiel = (k, aktuell) => {
  const soll = (360 - (k * (360 / RAD_FELDER) + 45)) % 360;
  const rest = ((aktuell % 360) + 360) % 360;
  let plus = soll - rest;
  if (plus < 0) plus += 360;
  return aktuell + 360 * 4 + plus;
};

// ── Die Risikospiele ─────────────────────────────────────────────
// Nach einem Gewinn kann man ihn setzen statt einzustecken. Zwei Wege,
// beide verdoppeln und beide koennen alles kosten:
//
//   Die Leiter des Wagemuts — ein Licht laeuft ueber acht Felder, eines
//   ist gruen. Wer im richtigen Augenblick haelt, steigt eine Sprosse.
//   Mit jeder Sprosse laeuft das Licht schneller.
//
//   Rabe oder Rose — schwarz oder rot raten, mehr nicht.
//
// Hoechstens fuenf Sprossen; danach wird ausgezahlt. Ein Spiel, das
// endlos weiterlaufen kann, hat keinen Reiz mehr, sondern nur noch Zeit.
const LEITER_FELDER = 8;
const RISIKO_STUFEN = 5;
const leiterTempo = (stufe) => Math.max(70, 170 - stufe * 22);

const RisikoFenster = ({ risiko, setRisiko, onNehmen, onSchliessen }) => {
  const {art, betrag, stufe, aus, letztes} = risiko;
  const takt = React.useRef(null);

  // Das Licht laeuft, solange die Leiter offen und nicht entschieden ist.
  React.useEffect(() => {
    if (art !== 'leiter' || aus || !risiko.laeuft) return;
    const t = setInterval(() => {
      setRisiko(r => r && r.laeuft ? {...r, pos: (r.pos + 1) % LEITER_FELDER} : r);
    }, leiterTempo(stufe));
    takt.current = t;
    return () => clearInterval(t);
  }, [art, aus, risiko.laeuft, stufe, setRisiko]);

  const weiter = (gewonnen) => setRisiko(r => ({
    ...r, laeuft: false,
    letztes: gewonnen ? 'gut' : 'schlecht',
    betrag: gewonnen ? r.betrag * 2 : 0,
    stufe: gewonnen ? r.stufe + 1 : r.stufe,
    aus: !gewonnen || r.stufe + 1 >= RISIKO_STUFEN,
  }));

  const halt = () => { if (risiko.laeuft) weiter(risiko.pos === risiko.ziel); };
  const raten = (farbe) => {
    if (risiko.laeuft || aus) return;
    const gezogen = Math.random() < 0.5 ? 'rabe' : 'rose';
    setRisiko(r => ({...r, gezogen}));
    weiter(gezogen === farbe);
  };
  const nochmal = () => setRisiko(r => ({...r, laeuft: art === 'leiter',
    pos: 0, ziel: Math.floor(Math.random() * LEITER_FELDER), letztes: null, gezogen: null}));

  return (
    <div className="rad-huelle">
      <div className="rad-fenster risiko">
        <div className="rad-titel">{art === 'leiter' ? 'Leiter des Wagemuts' : 'Rabe oder Rose'}</div>
        <div className="rad-unter">
          {art === 'leiter'
            ? 'Halt im richtigen Augenblick — das grüne Feld verdoppelt, jedes andere kostet alles.'
            : 'Schwarz oder rot. Richtig geraten verdoppelt, falsch kostet alles.'}
        </div>

        <div className="risiko-betrag">
          <span>Im Spiel</span>
          <b className={betrag > 0 ? '' : 'weg'}>{betrag}</b>
          <i>Sprosse {stufe} von {RISIKO_STUFEN}</i>
        </div>

        {art === 'leiter' ? (
          <div className="leiter-felder" role="group" aria-label="Leiter">
            {Array.from({length: LEITER_FELDER}, (_, i) => (
              // Das Ziel ist immer zu sehen — auf ein Feld zielen, das man
              // nicht kennt, waere kein Wagemut, sondern Raten.
              <span key={i} className={'leiter-feld'
                + (risiko.pos === i ? ' licht' : '')
                + (risiko.ziel === i ? ' ziel' : '')} />
            ))}
          </div>
        ) : (
          <div className="karte-wahl">
            <button type="button" className="karte-knopf rabe" disabled={aus || !!letztes}
              onClick={()=>raten('rabe')}>🐦‍⬛<span>Rabe</span></button>
            <button type="button" className="karte-knopf rose" disabled={aus || !!letztes}
              onClick={()=>raten('rose')}>🌹<span>Rose</span></button>
          </div>
        )}

        <div className="rad-stand">
          {letztes === 'gut' ? <b className="rad-gut">Getroffen — verdoppelt!</b>
            : letztes === 'schlecht' ? <b className="rad-schlecht">Daneben. Alles weg.</b>
            : art === 'leiter' ? <b className="leise">Halt drücken, wenn das Licht grün steht.</b>
            : <b className="leise">Wähle.</b>}
        </div>

        <div className="rad-tasten risiko-tasten">
          {art === 'leiter' && risiko.laeuft && (
            <button className="automat-hebel" onClick={halt}>Halt!</button>
          )}
          {!risiko.laeuft && !aus && letztes === 'gut' && (
            <button className="automat-hebel" onClick={nochmal}>Nochmal wagen</button>
          )}
          {!risiko.laeuft && betrag > 0 && (
            <button className="automat-nachschub nehmen" onClick={()=>onNehmen(betrag)}>
              {betrag} nehmen
            </button>
          )}
          {betrag <= 0 && (
            <button className="automat-hebel" onClick={onSchliessen}>Weiter</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Das Fenster ──────────────────────────────────────────────────
// Der Automat ist Zeitvertreib und darf deshalb niemanden aufhalten: er
// liegt als Fenster ueber der Anwendung, nimmt keine Klicks weg und
// laesst sich am Kopf verschieben. Wer nebenbei seinen Bogen ansehen
// will, klickt einfach dorthin.
const FENSTER_BREITE = 430;

const fensterLesen = () => {
  try {
    const d = JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || 'null');
    if (d && d.fenster && Number.isFinite(+d.fenster.x)) return {x: +d.fenster.x, y: +d.fenster.y};
  } catch {}
  return null;
};
const fensterSchreiben = (pos) => {
  try {
    const d = JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || '{}') || {};
    localStorage.setItem(AUTOMAT_SPEICHER, JSON.stringify({...d, fenster: pos}));
  } catch {}
};
// Immer so viel stehen lassen, dass man den Kopf noch zu fassen bekommt.
const fensterKlemmen = (pos) => ({
  x: Math.max(-FENSTER_BREITE + 140, Math.min(pos.x, (window.innerWidth || 1200) - 140)),
  y: Math.max(0, Math.min(pos.y, (window.innerHeight || 800) - 60)),
});

// ── Der Schirm ───────────────────────────────────────────────────
// ── Der Automat, jetzt ein Tisch unter mehreren ───────────────
// Rahmen, Kopf, Beutel und das Schieben liegen seit der Halle eine
// Ebene hoeher: sie gehoeren der Taverne und nicht dem Automaten. Hier
// steht nur noch, was auf dem Tisch passiert.
const AutomatTisch = ({ cfg, marken, setMarken, onLaeuft }) => {
  const waehrung = WAEHRUNGEN.marken;
  // Was die Spielleitung fuer dieses Abenteuer eingestellt hat.
  const symbole   = React.useMemo(() => automatSymbole(cfg), [cfg]);
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const vollbildP    = React.useMemo(() => automatVollbildP(cfg), [cfg]);
  const vollbildEins = React.useMemo(() => automatVollbildEins(cfg), [cfg]);
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
  const [rad, setRad] = React.useState(null);   // {basis, runde, gewonnen, winkel, dreht, aus, letztes}
  // Was gerade auf dem Tisch liegt und gesetzt werden darf: der Gewinn
  // dieses Drehs samt allem, was das Rad nachgelegt hat.
  const [riskierbar, setRiskierbar] = React.useState(0);
  const [risiko, setRisiko] = React.useState(null);
  const laufRef = React.useRef(null);
  const radRef  = React.useRef(null);

  // Solange die Walzen laufen, darf der Beutel oben nicht gewechselt
  // werden — die Taverne muss davon wissen.
  React.useEffect(() => { if (onLaeuft) onLaeuft(laeuft); }, [laeuft]);
  const quote = React.useMemo(() => automatQuote(symbole, vollbildP), [symbole, vollbildP]);

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

  // Senkt die Spielleitung den Hoechsteinsatz, darf kein Betrag stehen
  // bleiben, den es nicht mehr gibt.
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  // Wird das Browserfenster kleiner, darf die Taverne nicht draussen
  // liegenbleiben — sie waere sonst nur noch ueber das Zuruecksetzen des
  // Speichers zu erreichen.
  React.useEffect(() => {
    const anpassen = () => setPos(p => {
      const k = fensterKlemmen(p);
      return (k.x === p.x && k.y === p.y) ? p : k;
    });
    window.addEventListener('resize', anpassen);
    return () => window.removeEventListener('resize', anpassen);
  }, []);

  const frei = freidrehe > 0;
  const kannDrehen = !laeuft && !rad && !risiko && (frei || marken >= einsatz);

  const drehen = () => {
    if (!kannDrehen) return;
    const zahlt = frei ? 0 : einsatz;
    const neuesFeld = zieheWalzen(symbole, vollbildP);
    const e = werteAus(neuesFeld, einsatz, symbole);

    setFeld(neuesFeld);
    setBaender([0,1,2].map(sp => bandBauen(neuesFeld, sp, symbole)));
    setErgebnis(null); setZeigeLinie(-1); setZaehler(0);
    setRiskierbar(0); setRisiko(null);
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

  // Was dieser Dreh eingebracht hat, darf gesetzt werden.
  React.useEffect(() => {
    setRiskierbar(ergebnis ? ergebnis.gewinn : 0);
  }, [ergebnis]);

  // Ein Vollbild oeffnet das Rad, sobald die Walzen stehen.
  React.useEffect(() => {
    if (ergebnis && ergebnis.vollbild && ergebnis.gewinn > 0) {
      setRad({basis: ergebnis.gewinn, runde: 0, gewonnen: 0, winkel: 0,
              dreht: false, aus: false, letztes: null});
    }
  }, [ergebnis]);

  // Auch hier: erst zahlen, dann drehen. Der Ausgang steht fest, sobald
  // gezogen wurde — die Drehung zeigt ihn nur.
  const radAufloesen = React.useCallback(() => {
    if (!radRef.current) return;
    radRef.current = null;
    setRad(r => r && {...r, dreht: false});
  }, []);

  React.useEffect(() => {
    const wach = () => { if (radRef.current) radAufloesen(); };
    document.addEventListener('visibilitychange', wach);
    return () => document.removeEventListener('visibilitychange', wach);
  }, [radAufloesen]);

  const radDrehen = () => {
    if (!rad || rad.dreht || rad.aus) return;
    const gruen = Math.random() < RAD_GRUEN / RAD_FELDER;
    const feld = gruen ? 1 + Math.floor(Math.random() * RAD_GRUEN) : 0;
    const runde = rad.runde + 1;
    if (gruen) { setMarken(marken + rad.basis); setRiskierbar(w => w + rad.basis); }
    setRad({...rad,
      winkel: radZiel(feld, rad.winkel),
      runde, dreht: true, letztes: gruen ? 'gruen' : 'rot',
      gewonnen: rad.gewonnen + (gruen ? rad.basis : 0),
      aus: !gruen || runde >= RAD_GRUEN,
    });
    radRef.current = true;
    setTimeout(radAufloesen, RAD_DAUER + 40);
  };

  // Setzen heisst: der Gewinn geht von der Kasse zurueck auf den Tisch.
  // Danach entscheidet das Spiel, ob er verdoppelt zurueckkommt oder gar
  // nicht — so steht in der Kasse nie ein Betrag, ueber den noch
  // gewuerfelt wird.
  const risikoStarten = (art, halb) => {
    const gesamt = riskierbar;
    if (gesamt <= 0 || risiko) return;
    const einsatzRisiko = halb ? Math.floor(gesamt / 2) : gesamt;
    if (einsatzRisiko <= 0) return;
    setMarken(marken - einsatzRisiko);
    setRiskierbar(0);
    setRisiko({art, betrag: einsatzRisiko, stufe: 0, aus: false, letztes: null,
               laeuft: art === 'leiter', pos: 0,
               ziel: Math.floor(Math.random() * LEITER_FELDER), gezogen: null});
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
    <>
      {risiko && (
        <RisikoFenster risiko={risiko} setRisiko={setRisiko}
          onNehmen={(b)=>{ setMarken(marken + b); setRisiko(null); }}
          onSchliessen={()=>setRisiko(null)} />
      )}

      {rad && (
        <div className="rad-huelle">
          <div className="rad-fenster">
            <div className="rad-titel">Rad der Fortuna</div>
            <div className="rad-unter">
              Drei grüne Felder, eines rot. Jedes grüne zahlt die
              <b> {rad.basis} </b> noch einmal — höchstens dreimal.
            </div>

            <div className="rad-buehne">
              <div className="rad-zeiger" aria-hidden="true">▼</div>
              <div className="rad-scheibe" style={{
                transform: 'rotate(' + rad.winkel + 'deg)',
                transition: rad.dreht ? 'transform ' + RAD_DAUER + 'ms cubic-bezier(.16,.78,.24,1)' : 'none',
              }} />
            </div>

            <div className="rad-stand">
              <span className="rad-runden">
                {[1,2,3].map(i => (
                  <i key={i} className={'rad-punkt' + (rad.runde >= i ? ' voll' : '')} />
                ))}
              </span>
              {rad.dreht ? <b className="leise">…</b>
                : rad.letztes === 'gruen' ? <b className="rad-gut">Noch einmal! +{rad.basis}</b>
                : rad.letztes === 'rot'   ? <b className="rad-schlecht">Rot. Vorbei.</b>
                : <b className="leise">Dreh am Rad.</b>}
            </div>
            {rad.gewonnen > 0 && (
              <div className="rad-summe">Zusätzlich gewonnen: <b>{rad.gewonnen}</b></div>
            )}

            <div className="rad-tasten">
              {!rad.aus ? (
                <button className="automat-hebel" disabled={rad.dreht} onClick={radDrehen}>
                  {rad.dreht ? 'Dreht…' : rad.runde === 0 ? 'Rad drehen' : 'Nochmal'}
                </button>
              ) : (
                <button className="automat-hebel" disabled={rad.dreht}
                  onClick={()=>setRad(null)}>Weiter</button>
              )}
            </div>
          </div>
        </div>
      )}

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
                        <span>{symbolVon(k, symbole).z}</span>
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
            {einsaetze.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                disabled={frei} onClick={()=>setEinsatz(n)}>{n}</button>
            ))}
          </div>

          <button className={'automat-hebel' + (frei ? ' frei' : '')}
            disabled={!kannDrehen} onClick={drehen}>
            {laeuft ? 'Läuft…' : rad ? 'Das Rad läuft' : frei ? '🪙 Freidreh'
              : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig Marken'}
          </button>

          {/* Setzen statt einstecken. Steht nur da, wenn etwas dasteht. */}
          {riskierbar > 0 && !laeuft && !rad && !risiko && (
            <div className="risiko-angebot">
              <span className="risiko-angebot-text">{riskierbar} setzen?</span>
              <button className="risiko-knopf" onClick={()=>risikoStarten('leiter', false)}>🪜 Leiter</button>
              <button className="risiko-knopf" onClick={()=>risikoStarten('karte', false)}>🂠 Rabe oder Rose</button>
              {riskierbar >= 2 && (
                <button className="risiko-knopf halb" title="Nur die Hälfte setzen, den Rest behalten"
                  onClick={()=>risikoStarten('leiter', true)}>½ Leiter</button>
              )}
            </div>
          )}

          {marken < einsaetze[0] && !frei && !laeuft && (
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
                  {[...symbole].reverse().map(s => (
                    <tr key={s.k}>
                      <td className="sym">{s.z}{s.z}{s.z}</td>
                      <td className="nam">
                        {s.name}
                        {s.freidreh && <i>bringt einen Freidreh</i>}
                        {s.speise && <i>zählt fürs Vollbild</i>}
                      </td>
                      <td className="zahl">{zahlText(s.zahlt)} ×</td>
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
              <p className="automat-fussnote">
                <b>Vollbild</b> — alle neun Felder dieselbe Speise: fünf Linien
                auf einmal und danach das Rad der Fortuna.{' '}
                {vollbildEins
                  ? 'Etwa jede ' + vollbildEins + '. Drehung.'
                  : 'Nur, wenn es von allein fällt — und das tut es so gut wie nie.'}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ══ Die Spielhalle ══════════════════════════════════════════
// Aus der Taverne wird ein Eingang mit mehreren Tischen. Der Automat
// ist einer davon; die anderen stehen schon in der Liste, damit man
// sieht, was das Haus vorhat — aufgebaut sind sie noch nicht, und das
// steht auch dabei. Ein Tisch, den es nicht gibt, wird nicht angeboten,
// als gaebe es ihn.
//
// Was hier oben liegt und alle Tische benutzen: das Fenster, der Kopf
// mit Beutel und Beutelwechsler, das Schieben, das Schliessen. Ein
// zweiter Tisch braucht davon nichts noch einmal zu bauen.
const TAVERNEN_TISCHE = [
  {k:'automat',   z:'🎰', name:'Dreifaches Glück',
   unter:'Drei Walzen, fünf Linien, Rad der Fortuna', rand:'Einsatz 5–50',
   da:true, breit:430, weit:520},
  {k:'blackjack', z:'🃏', name:'Blackjack',
   unter:'Gegen den Wirt. Blackjack zahlt anderthalbfach', rand:'Bank ≈ 0,5 %',
   da:true, breit:470, weit:620},
  {k:'roulette',  z:'🎡', name:'Französisches Roulette',
   unter:'Ein Zéro, La Partage — die mildeste Bank im Haus', rand:'Bank 1,35 %',
   da:true, breit:600, weit:780},
  {k:'craps',     z:'🎲', name:'Craps',
   unter:'Zwei Würfel, ein Punkt — und die Odds ohne Hausanteil', rand:'Bank 1,4 %',
   da:true, breit:560, weit:720},
  {k:'rennen',    z:'🐎', name:'Die Rennbahn vor dem Tor',
   unter:'Sechs Pferde, echt gelaufen — die Quoten kommen aus dem Lauf', rand:'Bank 12 %',
   da:true, breit:560, weit:700},
];

// Wie breit ein Tisch stehen darf. Auf dem Telefon so schmal wie
// bisher, ab Tabletbreite so breit, wie der Tisch es braucht — der
// Roulettetapis hat zwoelf Spalten, und die will man sehen. Nie breiter,
// als der Schirm hergibt.
const TABLET_AB = 768;
const tischBreite = (tisch, schirm) => {
  const eng = (tisch && tisch.breit) || FENSTER_BREITE;
  if (!schirm || schirm < TABLET_AB) return eng;
  const weit = (tisch && tisch.weit) || eng;
  return Math.max(eng, Math.min(weit, schirm - 56));
};

// Welche Tische die Spielleitung fuer dieses Abenteuer geschlossen hat.
// Nichts eingetragen heisst: alle offen — wie ueberall im Heldenbuch.
const tavernenZu = (cfg) => {
  const l = cfg && Array.isArray(cfg.zu) ? cfg.zu : [];
  return TAVERNEN_TISCHE.filter(t => !l.includes(t.k));
};

const TavernenHalle = ({ tische, onWahl }) => (
  <div className="halle">
    {tische.length === 0 ? (
      <div className="halle-leer">Heute ist geschlossen — die Spielleitung hat
        alle Tische abgeraeumt.</div>
    ) : tische.map(t => (
      <button type="button" key={t.k}
        className={'halle-tisch' + (t.da ? '' : ' spaeter')}
        disabled={!t.da} onClick={()=>t.da && onWahl(t.k)}
        title={t.da ? t.name : 'Dieser Tisch wird noch gebaut'}>
        <span className="halle-zeichen">{t.z}</span>
        <span className="halle-text">
          <span className="halle-name">{t.name}</span>
          <span className="halle-unter">{t.unter}</span>
        </span>
        <span className="halle-rand">{t.da ? t.rand : 'im Bau'}</span>
      </button>
    ))}
  </div>
);

const TaverneSchirm = ({ cfg, helden, heldStart, gold, onSchliessen, onAbend }) => {
  // Marken oder Gold — die Tische merken davon nichts.
  const waehrung = gold ? gold : WAEHRUNGEN.marken;
  // Wessen Beutel auf dem Tisch liegt: der offene Bogen, sonst der
  // zuletzt bespielte, sonst der erste. Ohne Bogen geht es auch.
  const stall = (helden && helden.length) ? helden : [];
  const [heldId, setHeldId] = React.useState(() => {
    if (heldStart && stall.some(h => h.id === heldStart)) return heldStart;
    const z = waehrung.zuletzt();
    if (z && stall.some(h => h.id === z)) return z;
    return stall.length ? stall[0].id : null;
  });
  const [marken, setMarkenRoh] = React.useState(() => waehrung.lesen(heldId));
  const [tisch, setTisch] = React.useState(null);      // null = die Halle
  const [laeuft, setLaeuft] = React.useState(false);   // sperrt Beutel und Rueckweg
  const [pos, setPos] = React.useState(() => fensterLesen()
    || fensterKlemmen({x: Math.max(20, (window.innerWidth || 1200) - FENSTER_BREITE - 40), y: 70}));
  const zug = React.useRef(null);   // {dx, dy} waehrend des Schiebens
  // Die Breite haengt am Schirm, also muss sie ihm folgen.
  const [schirm, setSchirm] = React.useState(() => window.innerWidth || 1200);
  React.useEffect(() => {
    const messen = () => setSchirm(window.innerWidth || 1200);
    window.addEventListener('resize', messen);
    return () => window.removeEventListener('resize', messen);
  }, []);

  // Der Stand steht doppelt: als Zustand fuer die Anzeige und als
  // Referenz fuer die Rechnung. Ein Tisch verrechnet in einem Griff
  // mehrere Betraege — Einsatz, Verdopplung, Auszahlung —, und der
  // Zustand kaeme dafuer jedes Mal zu spaet.
  const markenRef = React.useRef(marken);
  const stellen = (m) => {
    const n = Math.max(0, Math.round(m));
    buchen(n - markenRef.current);
    markenRef.current = n;
    waehrung.schreiben(heldId, n);
    setMarkenRoh(n);
  };
  const setMarken = (n) => stellen(n);
  const zahlen = (delta) => stellen(markenRef.current + delta);
  // Wechselt der Beutel, kommt der Stand des anderen Helden auf den Tisch.
  React.useEffect(() => {
    // Wer den Beutel wechselt, schliesst den Abend des vorigen Helden ab
    // — sonst stuende seine Zeile nie im Abenteuerlog.
    const a = abend.current;
    if (a.heldId && a.heldId !== heldId && a.gesetzt > 0 && onAbend)
      onAbend(a.heldId, a.gesetzt, a.zurueck);
    abend.current = {heldId, gesetzt: 0, zurueck: 0};
    const n = waehrung.lesen(heldId);
    markenRef.current = n;
    setMarkenRoh(n);
  }, [heldId]);

  // Was ein Tisch als Einsatz anbietet: bei Marken die Leiter des
  // Abenteuers, bei Gold die kleine.
  const cfgTisch = React.useMemo(
    () => waehrung.leiter ? {...(cfg || {}), einsaetze: waehrung.leiter} : cfg,
    [cfg, waehrung]);
  const offen = React.useMemo(() => tavernenZu(cfg), [cfg]);

  // Was an diesem Abend durch die Taverne gegangen ist — fuer die eine
  // Zeile im Abenteuerlog, wenn man wieder hinausgeht.
  const abend = React.useRef({heldId: null, gesetzt: 0, zurueck: 0});
  const buchen = (delta) => {
    if (abend.current.heldId !== heldId) abend.current = {heldId, gesetzt: 0, zurueck: 0};
    if (delta < 0) abend.current.gesetzt += -delta; else abend.current.zurueck += delta;
  };
  const hinaus = () => {
    const a = abend.current;
    if (onAbend && a.heldId && a.gesetzt > 0) onAbend(a.heldId, a.gesetzt, a.zurueck);
    onSchliessen();
  };
  const jetzt = tisch ? TAVERNEN_TISCHE.find(t => t.k === tisch) : null;
  // Ein Tisch, den die Spielleitung zwischendurch schliesst, laesst
  // einen nicht darin sitzen.
  React.useEffect(() => {
    if (tisch && !offen.some(t => t.k === tisch)) setTisch(null);
  }, [offen, tisch]);

  // Schieben am Kopf. Zeigerereignisse statt Maus: dasselbe fuer Finger
  // und Stift, und der Zeiger bleibt beim Fenster, auch wenn er darueber
  // hinausrutscht.
  const zugStart = (e) => {
    if (e.target.closest('button, select')) return;   // Knoepfe schieben nicht
    zug.current = {dx: e.clientX - pos.x, dy: e.clientY - pos.y};
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const zugBewegen = (e) => {
    if (!zug.current) return;
    setPos(fensterKlemmen({x: e.clientX - zug.current.dx, y: e.clientY - zug.current.dy}));
  };
  const zugEnde = () => { if (zug.current) { zug.current = null; fensterSchreiben(pos); } };

  return (
    <div className="automat-schirm"
      style={{left: pos.x, top: pos.y, width: tischBreite(jetzt, schirm)}}>
      <div className="automat-kopf" onPointerDown={zugStart}
        onPointerMove={zugBewegen} onPointerUp={zugEnde} onPointerCancel={zugEnde}
        title="Zum Verschieben ziehen">
        {/* Der Weg zurueck in die Halle steht links vom Namen — nicht,
            solange die Walzen laufen: ein Einsatz, der unterwegs ist,
            gehoert zu Ende gespielt. */}
        {jetzt && (
          <button className="automat-x zurueck" onClick={()=>setTisch(null)} disabled={laeuft}
            aria-label="Zurück in die Halle" title="Zurück in die Halle">‹</button>
        )}
        <div className="automat-kopf-text">
          <div className="automat-titel">
            {jetzt ? jetzt.z + ' ' + jetzt.name : '🍺 Taverne des Glücks'}
          </div>
          {/* Wessen Marken gerade auf dem Tisch liegen. Bei einem Bogen
              steht der Name da, bei mehreren laesst er sich wechseln —
              nicht mitten im Lauf, sonst faenden die Marken den falschen
              Beutel. */}
          <div className="automat-ort">
            {stall.length > 1 ? (
              <select className="automat-beutel" value={heldId || ''} disabled={laeuft}
                onPointerDown={e=>e.stopPropagation()}
                onChange={e=>setHeldId(e.target.value)}
                aria-label="Wessen Beutel auf dem Tisch liegt"
                title="Wessen Beutel auf dem Tisch liegt">
                {stall.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            ) : (stall.length === 1 ? stall[0].name
                 : (offen.length + (offen.length === 1 ? ' Tisch' : ' Tische')))}
          </div>
        </div>
        <div className="automat-kasse">
          <span>{waehrung.kurz}</span><b>{marken}</b>
          <i>{waehrung.name}</i>
        </div>
        <button className="automat-x" onClick={hinaus} aria-label="Schließen">✕</button>
      </div>

      {jetzt && jetzt.k === 'automat' ? (
        <AutomatTisch cfg={cfgTisch} marken={marken} setMarken={setMarken} onLaeuft={setLaeuft} />
      ) : jetzt && jetzt.k === 'blackjack' ? (
        <BlackjackTisch cfg={cfgTisch} marken={marken} zahlen={zahlen} onLaeuft={setLaeuft} />
      ) : jetzt && jetzt.k === 'roulette' ? (
        <RouletteTisch cfg={cfgTisch} marken={marken} zahlen={zahlen} onLaeuft={setLaeuft} />
      ) : jetzt && jetzt.k === 'craps' ? (
        <CrapsTisch cfg={cfgTisch} marken={marken} zahlen={zahlen} onLaeuft={setLaeuft} />
      ) : jetzt && jetzt.k === 'rennen' ? (
        <RennenTisch cfg={cfgTisch} marken={marken} zahlen={zahlen} onLaeuft={setLaeuft} />
      ) : (
        <div className="automat-mitte halle-mitte">
          <TavernenHalle tische={offen} onWahl={setTisch} />
          <div className="halle-fuss">
            Gespielt wird mit Spielmarken, und die liegen im Beutel des Helden —
            nichts davon berührt einen Bogen. Was das Haus an einem Tisch
            verdient, steht am Tisch.
          </div>
        </div>
      )}
    </div>
  );
};
