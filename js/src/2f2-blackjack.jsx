// Heldenbuch — Blackjack, der zweite Tisch der Taverne.
//
// Gebaut wie am Tisch, nicht wie im Lehrbuch: sechs Blätter im
// Schlitten, der Wirt zieht bis 16 und bleibt ab 17 — auch bei weichen
// 17 —, Blackjack zahlt 3:2, Versicherung 2:1. Alles davon steht auf
// dem Filz, damit niemand fragen muss.
//
// Der Tisch bekommt Marken und setMarken von der Taverne gereicht und
// weiß nichts davon, wo der Beutel liegt. Das ist derselbe Weg, den der
// Automat geht, und derselbe, den echtes Gold später gehen wird.

const BJ_BLAETTER = 6;          // Blätter im Schlitten
const BJ_NEU_AB   = 0.75;       // ab drei Vierteln wird neu gemischt
const BJ_HAENDE   = 3;          // so oft darf geteilt werden (Hände insgesamt)
// Verdoppelt wird nur auf neun, zehn und elf — die europäische Regel.
// Auf allem anderen wäre es ohnehin selten richtig, und der Tisch sagt
// es lieber, als es zuzulassen und danach zu bedauern.
const BJ_DOPPELT_AB = 9, BJ_DOPPELT_BIS = 11;

const BJ_FARBEN = [
  {z: '♠', rot: false}, {z: '♥', rot: true},
  {z: '♦', rot: true},  {z: '♣', rot: false},
];
const BJ_WERTE = ['A','2','3','4','5','6','7','8','9','10','B','D','K'];

const bjNeuerSchlitten = () => {
  const k = [];
  for (let b = 0; b < BJ_BLAETTER; b++)
    for (const f of BJ_FARBEN)
      for (const w of BJ_WERTE) k.push({w, f: f.z, rot: f.rot});
  // Fisher-Yates. Ein Schlitten, der nach dem Mischen noch die
  // Reihenfolge des Drucks trägt, wäre kein Schlitten.
  for (let i = k.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = k[i]; k[i] = k[j]; k[j] = t;
  }
  return k;
};

// Der Wert eines Blatts. Asse zählen elf, solange es passt; jedes
// weitere fällt auf eins. "weich" heißt: ein Ass zählt noch elf, das
// Blatt kann also nicht überkaufen.
const bjWert = (karten) => {
  let summe = 0, asse = 0;
  for (const k of (karten || [])) {
    if (k.w === 'A') { asse++; summe += 11; }
    else summe += (k.w === 'B' || k.w === 'D' || k.w === 'K') ? 10 : +k.w;
  }
  while (summe > 21 && asse > 0) { summe -= 10; asse--; }
  return {wert: summe, weich: asse > 0};
};
const bjBlackjack = (karten) => (karten || []).length === 2 && bjWert(karten).wert === 21;
const bjKarteWert = (k) => k.w === 'A' ? 11
  : (k.w === 'B' || k.w === 'D' || k.w === 'K') ? 10 : +k.w;

// ── Die Tafel ────────────────────────────────────────────────────
// Die Grundstrategie, wie sie an jedem Tisch als Karte ausliegt. Sie
// rät, sie entscheidet nicht — wer anders will, spielt anders.
const bjRat = (karten, wirtKarte, darfTeilen, darfVerdoppeln) => {
  const w = bjKarteWert(wirtKarte);              // 2..11
  const {wert, weich} = bjWert(karten);
  const paar = karten.length === 2 && bjKarteWert(karten[0]) === bjKarteWert(karten[1]);

  if (paar && darfTeilen) {
    const p = bjKarteWert(karten[0]);
    if (p === 11 || p === 8) return 'teilen';
    if (p === 10) return 'stehen';
    if (p === 9)  return (w === 7 || w >= 10) ? 'stehen' : 'teilen';
    if (p === 7)  return w <= 7 ? 'teilen' : 'karte';
    if (p === 6)  return w <= 6 ? 'teilen' : 'karte';
    if (p === 4)  return (w === 5 || w === 6) ? 'teilen' : 'karte';
    if (p === 3 || p === 2) return w <= 7 ? 'teilen' : 'karte';
    // Zwei Fünfer sind eine harte Zehn und werden nie geteilt.
  }
  if (weich && karten.length >= 2) {
    if (wert >= 19) return 'stehen';
    if (wert === 18) return (w >= 3 && w <= 6 && darfVerdoppeln) ? 'verdoppeln'
                          : (w <= 8 ? 'stehen' : 'karte');
    if (wert === 17) return (w >= 3 && w <= 6 && darfVerdoppeln) ? 'verdoppeln' : 'karte';
    if (wert >= 15)  return (w >= 4 && w <= 6 && darfVerdoppeln) ? 'verdoppeln' : 'karte';
    return (w >= 5 && w <= 6 && darfVerdoppeln) ? 'verdoppeln' : 'karte';
  }
  if (wert >= 17) return 'stehen';
  if (wert >= 13) return w <= 6 ? 'stehen' : 'karte';
  if (wert === 12) return (w >= 4 && w <= 6) ? 'stehen' : 'karte';
  if (wert === 11) return darfVerdoppeln ? 'verdoppeln' : 'karte';
  if (wert === 10) return (w <= 9 && darfVerdoppeln) ? 'verdoppeln' : 'karte';
  if (wert === 9)  return (w >= 3 && w <= 6 && darfVerdoppeln) ? 'verdoppeln' : 'karte';
  return 'karte';
};
// Der Takt des Tisches. Kein Schmuck: er ist der Unterschied zwischen
// einem Spiel und einer Ausgabe von Ergebnissen.
const BJ_TAKT   = 420;   // zwischen zwei Karten
const BJ_ZEIGEN = 700;   // bevor aufgedeckt oder abgerechnet wird
const BJ_RAT_WORT = {karte: 'ziehen', stehen: 'stehen',
                     verdoppeln: 'verdoppeln', teilen: 'teilen'};

const BjKarte = ({ k, zu }) => zu
  ? <span className="bj-karte zu" aria-label="verdeckte Karte" />
  : (
    <span className={'bj-karte' + (k.rot ? ' rot' : '')}
      aria-label={k.w + ' ' + k.f}>
      <b>{k.w}</b><span>{k.f}</span>
    </span>
  );

const BlackjackTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  // Zieht der Wirt auf einer weichen 17, gewinnt das Haus etwa zwei
  // Zehntelprozent mehr. Die Spielleitung stellt es ein, der Filz sagt es.
  const weich17 = !!(cfg && cfg.regeln && cfg.regeln.weich17);
  const schlitten = React.useRef(bjNeuerSchlitten());
  // Innerhalb eines Griffs werden mehrere Karten gezogen und mehrere
  // Betraege verrechnet. Zustand allein taugt dafuer nicht — er kommt
  // erst beim naechsten Bild an, und die zweite Karte waere dieselbe wie
  // die erste. Der Zeiger steht deshalb in einer Referenz; der Zustand
  // daneben dient nur der Anzeige.
  const zeiger = React.useRef(0);
  const [gezogen, setGezogen] = React.useState(0);
  const [einsatz, setEinsatz] = React.useState(() => einsaetze[0] || 5);
  const [phase, setPhase] = React.useState('wette');   // wette | spiel | aus
  const [haende, setHaende] = React.useState([]);      // [{karten, einsatz, fertig, doppelt, ass}]
  const [aktiv, setAktiv] = React.useState(0);
  const [wirt, setWirt] = React.useState([]);
  const [offen, setOffen] = React.useState(false);     // liegt die zweite Wirtskarte auf?
  const [vers, setVers] = React.useState(null);        // Einsatz der Versicherung, 0 = abgelehnt
  const [meldung, setMeldung] = React.useState('Setze und lass geben.');
  const [abrechnung, setAbrechnung] = React.useState(null);
  const [wirtWort, wirtSagen] = useWirt('blackjack');
  // Am Tisch legt niemand vier Karten auf einmal hin. Sie kamen bisher
  // alle im selben Augenblick, und wer hinsah, hatte nichts gesehen:
  // Blatt fertig, Wirt fertig, abgerechnet. Jetzt liegt zwischen zwei
  // Karten eine Pause, und der Wirt zieht seine im Takt — sonst ist es
  // kein Geben, sondern ein Ergebnis.
  const [gibt, setGibt] = React.useState(false);
  const lebt = React.useRef(true);
  React.useEffect(() => () => { lebt.current = false; }, []);
  const warte = (ms) => new Promise(r => setTimeout(r, ms));
  const [tafel, setTafelRoh] = React.useState(tafelLesen);
  const setTafel = (an) => { setTafelRoh(an); tafelSchreiben(an); };

  // Auch waehrend des Gebens sitzt man am Tisch: der Weg zurueck in die
  // Halle bleibt zu, bis die Karten liegen.
  React.useEffect(() => { if (onLaeuft) onLaeuft(phase === 'spiel' || gibt); }, [phase, gibt]);

  // Eine Karte vom Schlitten. Bei drei Vierteln kommt ein neuer — das
  // ist die Stelle, an der ein Kartenzähler aufhört zu zählen.
  const zieheN = (n) => {
    if (zeiger.current + n > schlitten.current.length * BJ_NEU_AB) {
      schlitten.current = bjNeuerSchlitten();
      zeiger.current = 0;
    }
    const k = schlitten.current.slice(zeiger.current, zeiger.current + n);
    zeiger.current += n;
    setGezogen(zeiger.current);
    return k;
  };
  const ziehen = () => zieheN(1)[0];

  const restBlaetter = Math.max(0,
    ((schlitten.current.length - gezogen) / 52)).toFixed(1).replace('.', ',');

  const geben = async () => {
    if (gibt) return;
    if (einsatz > marken) { setMeldung('So viel liegt nicht mehr im Beutel.'); return; }
    const k = zieheN(4);
    zahlen(-einsatz);
    const hand = {karten: [k[0], k[2]], einsatz, fertig: false, doppelt: false, ass: false};
    const w = [k[1], k[3]];
    setAktiv(0); setOffen(false); setVers(null); setAbrechnung(null);
    setGibt(true);
    setMeldung('');

    // Die Reihenfolge am Tisch: erst der Spieler, dann der Wirt, und die
    // zweite Karte des Wirts kommt verdeckt zuletzt.
    setHaende([{...hand, karten: [k[0]]}]); setWirt([]);
    await warte(BJ_TAKT);          if (!lebt.current) return;
    setWirt([w[0]]);
    await warte(BJ_TAKT);          if (!lebt.current) return;
    setHaende([hand]);
    await warte(BJ_TAKT);          if (!lebt.current) return;
    setWirt(w);
    await warte(BJ_TAKT);          if (!lebt.current) return;
    setGibt(false);

    if (bjKarteWert(w[0]) === 11) {
      setPhase('spiel');
      setMeldung('Ass beim Wirt — Versicherung?');
      return;
    }
    if (bjBlackjack(hand.karten) || bjBlackjack(w)) {
      // Ein Blackjack wird trotzdem gezeigt, bevor er verrechnet wird.
      setOffen(true);
      await warte(BJ_ZEIGEN);      if (!lebt.current) return;
      abrechnen([hand], w, 0);
      return;
    }
    setPhase('spiel');
    setMeldung('');
  };

  // ── Die Versicherung ───────────────────────────────────────────
  // Sie kostet die Hälfte und zahlt 2:1, wenn der Wirt Blackjack hat.
  // Auf lange Sicht ist sie ein Verlustgeschäft, und das steht dabei.
  const versichern = (ja) => {
    const preis = ja ? Math.floor(einsatz / 2) : 0;
    if (ja && preis > marken) { setMeldung('Für die Versicherung reicht es nicht.'); return; }
    if (ja) zahlen(-preis);
    setVers(preis);
    const zeigenUndRechnen = async () => {
      setGibt(true); setOffen(true);
      await warte(BJ_ZEIGEN);      if (!lebt.current) return;
      setGibt(false);
      abrechnen(haende, wirt, preis);
    };
    if (bjBlackjack(wirt) || bjBlackjack(haende[0].karten)) { zeigenUndRechnen(); return; }
    setMeldung(ja ? 'Versichert. Der Wirt hat keinen Blackjack.' : '');
  };

  const setzeHand = (i, p) => setHaende(hs => hs.map((h, j) => j === i ? {...h, ...p} : h));

  const weiter = (hs, i) => {
    // Die nächste Hand, die noch etwas zu entscheiden hat.
    let n = i;
    while (n < hs.length && hs[n].fertig) n++;
    if (n < hs.length) { setAktiv(n); return; }
    wirtZieht(hs);
  };

  const karte = () => {
    const h = haende[aktiv];
    const neu = [...h.karten, ziehen()];
    const {wert} = bjWert(neu);
    const hs = haende.map((x, j) => j === aktiv
      ? {...x, karten: neu, fertig: wert >= 21} : x);
    setHaende(hs);
    if (wert > 21) { setMeldung('Überkauft.'); weiter(hs, aktiv + 1); }
    else if (wert === 21) weiter(hs, aktiv + 1);
  };

  const stehen = () => {
    const hs = haende.map((x, j) => j === aktiv ? {...x, fertig: true} : x);
    setHaende(hs); weiter(hs, aktiv + 1);
  };

  const verdoppeln = () => {
    const h = haende[aktiv];
    if (h.einsatz > marken) { setMeldung('Zum Verdoppeln reicht der Beutel nicht.'); return; }
    zahlen(-h.einsatz);
    const neu = [...h.karten, ziehen()];
    const hs = haende.map((x, j) => j === aktiv
      ? {...x, karten: neu, einsatz: x.einsatz * 2, doppelt: true, fertig: true} : x);
    setHaende(hs);
    weiter(hs, aktiv + 1);
  };

  const teilen = () => {
    const h = haende[aktiv];
    if (h.einsatz > marken) { setMeldung('Zum Teilen reicht der Beutel nicht.'); return; }
    zahlen(-h.einsatz);
    const k = zieheN(2);
    // Geteilte Asse bekommen je eine Karte und stehen dann — so wird es
    // überall gespielt, und ohne die Regel wäre das Teilen zu stark.
    const ass = h.karten[0].w === 'A';
    const a = {karten: [h.karten[0], k[0]], einsatz: h.einsatz, fertig: ass, doppelt: false, ass};
    const b = {karten: [h.karten[1], k[1]], einsatz: h.einsatz, fertig: ass, doppelt: false, ass};
    const hs = [...haende.slice(0, aktiv), a, b, ...haende.slice(aktiv + 1)];
    setHaende(hs);
    if (ass) weiter(hs, aktiv);
    else setAktiv(aktiv);
  };

  const wirtZieht = async (hs) => {
    // Nur wenn überhaupt eine Hand steht, deckt der Wirt auf — sonst
    // hat er nichts zu schlagen.
    setGibt(true);
    setOffen(true);
    const steht = hs.some(h => bjWert(h.karten).wert <= 21);
    let w = [...wirt];
    if (steht) {
      await warte(BJ_ZEIGEN);      if (!lebt.current) return;
      // Bis 16 zieht er immer; die weiche 17 ist die Hausregel.
      const zieht = () => {
        const {wert, weich} = bjWert(w);
        return wert < 17 || (weich17 && wert === 17 && weich);
      };
      // Eine Karte, eine Pause. Wer zusieht, soll mitzählen können —
      // und wer auf die Sechzehn hofft, soll den Augenblick haben.
      while (zieht()) {
        w = [...w, ziehen()];
        setWirt(w);
        await warte(BJ_TAKT);      if (!lebt.current) return;
      }
      await warte(BJ_ZEIGEN);      if (!lebt.current) return;
    }
    setGibt(false);
    abrechnen(hs, w, vers || 0);
  };

  const abrechnen = (hs, w, versEinsatz) => {
    const wWert = bjWert(w).wert, wBj = bjBlackjack(w);
    let aus = 0;
    const zeilen = hs.map(h => {
      const {wert} = bjWert(h.karten);
      const bj = bjBlackjack(h.karten) && hs.length === 1;
      let g = 0, text;
      if (wert > 21)          { text = 'überkauft'; }
      else if (bj && wBj)     { g = h.einsatz; text = 'beide Blackjack — Stand'; }
      else if (bj)            { g = h.einsatz + Math.round(h.einsatz * 1.5); text = 'Blackjack! 3:2'; }
      else if (wBj)           { text = 'der Wirt hat Blackjack'; }
      else if (wWert > 21)    { g = h.einsatz * 2; text = 'der Wirt überkauft'; }
      else if (wert > wWert)  { g = h.einsatz * 2; text = wert + ' schlägt ' + wWert; }
      else if (wert === wWert){ g = h.einsatz; text = 'Stand — ' + wert + ' gegen ' + wWert; }
      else                    { text = wWert + ' schlägt ' + wert; }
      aus += g;
      return {wert, einsatz: h.einsatz, gewinn: g, text};
    });
    // Die Versicherung wird für sich abgerechnet: sie gewinnt genau
    // dann, wenn die Hand daneben meistens verliert.
    let versZeile = null;
    if (versEinsatz > 0) {
      const g = wBj ? versEinsatz * 3 : 0;
      aus += g;
      versZeile = {einsatz: versEinsatz, gewinn: g,
                   text: wBj ? 'Versicherung zahlt 2:1' : 'Versicherung verfällt'};
    }
    if (aus > 0) zahlen(aus);
    setAbrechnung({zeilen, vers: versZeile, aus});
    // Der Wirt sagt etwas dazu — und zwar zu dem, was gefallen ist.
    // Blackjack, ueberkauft, der Wirt selbst ueber: das sind die
    // Augenblicke, an denen an einem echten Tisch jemand etwas sagt.
    const einsatz = hs.reduce((x, h) => x + h.einsatz, 0) + versEinsatz;
    const eigen = zeilen.some(z => /Blackjack! 3:2/.test(z.text)) ? 'blackjack'
      : zeilen.every(z => z.wert > 21)                            ? 'ueberkauft'
      : wBj                                                       ? 'wirtBlackjack'
      : wWert > 21                                                ? 'wirtUeber'
      : (zeilen.length === 1 && zeilen[0].gewinn === zeilen[0].einsatz) ? 'stand'
      : null;
    wirtSagen({fall: eigen, aus, einsatz});
    setPhase('aus');
    setMeldung('');
  };

  const neueRunde = () => {
    setPhase('wette'); setHaende([]); setWirt([]); setOffen(false);
    setVers(null); setAbrechnung(null); setMeldung('Setze und lass geben.');
    wirtSagen(null);
  };

  // ── Was gerade erlaubt ist ─────────────────────────────────────
  const hand = haende[aktiv];
  const wartetVers = phase === 'spiel' && wirt.length === 2
    && bjKarteWert(wirt[0]) === 11 && vers === null;
  const darfHandeln = phase === 'spiel' && !gibt && !wartetVers && hand && !hand.fertig;
  const handWert = hand ? bjWert(hand.karten).wert : 0;
  const darfVerdoppeln = darfHandeln && hand.karten.length === 2 && hand.einsatz <= marken
    && handWert >= BJ_DOPPELT_AB && handWert <= BJ_DOPPELT_BIS;
  const darfTeilen = darfHandeln && hand.karten.length === 2
    && bjKarteWert(hand.karten[0]) === bjKarteWert(hand.karten[1])
    && haende.length < BJ_HAENDE && hand.einsatz <= marken;
  // Ohne Tafel wird nichts gerechnet und nichts hervorgehoben — dann
  // steht da nur, was auf dem Tisch liegt.
  const rat = (tafel && darfHandeln)
    ? bjRat(hand.karten, wirt[0], darfTeilen, darfVerdoppeln) : null;

  const wirtWert = bjWert(offen ? wirt : wirt.slice(0, 1));

  return (
    <div className="automat-mitte bj-mitte">
      <div className="filz bj-filz">
        {/* Die Tafel ist Geschmack, keine Hausregel — deshalb ein
            Schalter am Tisch und keine Einstellung im Abenteuer. */}
        <button type="button" className={'bj-tafel' + (tafel ? ' an' : '')}
          onClick={()=>setTafel(!tafel)} aria-pressed={tafel}
          title={tafel ? 'Die Tafel rät mit — abschalten'
                       : 'Die Tafel schweigt — einschalten'}>
          🎓<i>{tafel ? 'Tafel an' : 'Tafel aus'}</i>
        </button>
        {/* Der Wirt sitzt oben, wie am Tisch. Seine zweite Karte liegt
            verdeckt, bis er dran ist. */}
        <div className="bj-seite">
          <span className="bj-wer">Der Wirt</span>
          <span className="bj-blatt">
            {wirt.length === 0
              ? <span className="bj-platz" />
              : wirt.map((k, i) => <BjKarte key={i} k={k} zu={i === 1 && !offen} />)}
          </span>
          <span className="bj-punkte">
            {wirt.length === 0 ? '—' : (offen ? bjWert(wirt).wert : wirtWert.wert + ' + ?')}
          </span>
        </div>

        {/* Was auf einem Blackjacktisch aufgedruckt steht, steht auch
            hier: dann muss man den Wirt nicht fragen. */}
        <div className="bj-bogen">
          <span className="bj-druck gross">Blackjack zahlt 3 zu 2</span>
          <span className="bj-druck">
            {weich17 ? 'Der Wirt zieht bis 16 und auf weicher 17'
                     : 'Der Wirt zieht bis 16 und bleibt ab 17'}
          </span>
          <span className="bj-druck">Verdoppeln nur auf 9, 10 und 11</span>
          <span className="bj-druck klein">Versicherung zahlt 2 zu 1 · {restBlaetter} Blätter im Schlitten</span>
        </div>

        <div className="bj-haende">
          {haende.length === 0 ? (
            <div className="bj-seite">
              <span className="bj-blatt"><span className="bj-platz" /></span>
              <span className="bj-kreis"><i>{einsatz}</i></span>
            </div>
          ) : haende.map((h, i) => {
            const {wert} = bjWert(h.karten);
            return (
              <div className={'bj-seite' + (haende.length > 1 && i === aktiv && phase === 'spiel' ? ' dran' : '')} key={i}>
                <span className="bj-blatt">
                  {h.karten.map((k, j) => <BjKarte key={j} k={k} />)}
                </span>
                <span className="bj-kreis"><i>{h.einsatz}</i></span>
                <span className={'bj-punkte hell' + (wert > 21 ? ' weg' : '')}>
                  {wert}{bjBlackjack(h.karten) && haende.length === 1 ? ' ♦' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <WirtSagt spruch={wirtWort} />

      {/* ── Was man tun kann ───────────────────────────────────── */}
      {phase === 'wette' && (
        <>
          <div className="automat-einsatz">
            <span className="automat-einsatz-titel">Einsatz</span>
            {einsaetze.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                onClick={()=>setEinsatz(n)} disabled={n > marken}>{n}</button>
            ))}
          </div>
          <button className="automat-hebel" onClick={geben} disabled={einsatz > marken}>
            Geben · {einsatz}
          </button>
        </>
      )}

      {wartetVers && (
        <div className="bj-vers">
          <div className="bj-vers-text">
            Der Wirt zeigt ein Ass. Die Versicherung kostet {Math.floor(einsatz / 2)} und
            zahlt 2:1, wenn er Blackjack hat. Auf Dauer verliert sie — deshalb steht es hier.
          </div>
          <div className="bj-tasten">
            <button className="bj-taste" onClick={()=>versichern(true)}
              disabled={Math.floor(einsatz / 2) > marken}>Versichern</button>
            <button className="bj-taste haupt" onClick={()=>versichern(false)}>Nein, weiter</button>
          </div>
        </div>
      )}

      {darfHandeln && (
        <>
          <div className="bj-tasten">
            <button className={'bj-taste' + (rat === 'karte' ? ' haupt' : '')}
              onClick={karte}>Karte</button>
            <button className={'bj-taste' + (rat === 'stehen' ? ' haupt' : '')}
              onClick={stehen}>Stehen</button>
            <button className={'bj-taste' + (rat === 'verdoppeln' ? ' haupt' : '')}
              onClick={verdoppeln} disabled={!darfVerdoppeln}>Verdoppeln</button>
            <button className={'bj-taste' + (rat === 'teilen' ? ' haupt' : '')}
              onClick={teilen} disabled={!darfTeilen}>Teilen</button>
          </div>
          <div className="bj-melde">
            <b>{bjWert(hand.karten).wert} gegen {bjKarteWert(wirt[0])}.</b>
            {rat ? ' Die Tafel rät: ' + BJ_RAT_WORT[rat] + '.' : ''}
          </div>
        </>
      )}

      {phase === 'aus' && abrechnung && (
        <>
          <div className="bj-abrechnung">
            {abrechnung.zeilen.map((z, i) => (
              <div className={'bj-zeile' + (z.gewinn > z.einsatz ? ' gut'
                              : z.gewinn === 0 ? ' schlecht' : '')} key={i}>
                <span>{abrechnung.zeilen.length > 1 ? (i + 1) + '. Hand · ' : ''}{z.text}</span>
                <b>{z.gewinn > z.einsatz ? '+' + (z.gewinn - z.einsatz)
                    : z.gewinn === z.einsatz ? '±0' : '−' + z.einsatz}</b>
              </div>
            ))}
            {abrechnung.vers && (
              <div className={'bj-zeile' + (abrechnung.vers.gewinn ? ' gut' : ' schlecht')}>
                <span>{abrechnung.vers.text}</span>
                <b>{abrechnung.vers.gewinn
                    ? '+' + (abrechnung.vers.gewinn - abrechnung.vers.einsatz)
                    : '−' + abrechnung.vers.einsatz}</b>
              </div>
            )}
          </div>
          <button className="automat-hebel" onClick={neueRunde}>Nächste Runde</button>
        </>
      )}

      {meldung && phase !== 'aus' && <div className="bj-melde leise">{meldung}</div>}
    </div>
  );
};
