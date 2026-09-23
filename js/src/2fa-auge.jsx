// Heldenbuch — „Das Wachsame Auge", der dritte der drei
// Fuenfwalzenautomaten. Er steht zuletzt, weil er am meisten verlangt
// und am staerksten wirkt: waere er der erste gewesen, saehen die
// anderen beiden danach blass aus.
//
// Ein Waechter in einer Tempelruine. Er liegt nur auf den Walzen 2, 3
// und 4 — nie auf der ersten, nie auf der letzten —, und wo er faellt,
// dehnt er sich ueber die ganze Walze aus. Er ersetzt jedes Zeichen und
// zahlt selbst nichts.
//
// Drei Tore oeffnen zwoelf Freispiele, und darin tut jeder Waechter zwei
// Dinge auf einmal:
//
//   Er veredelt. Das unterste der vier billigen Zeichen verschwindet von
//   den Baendern, und alles, was darauf lag, rueckt eine Stufe hoch —
//   fuer den Rest der Runde. Nach drei Waechtern (Horus) ist das A das
//   Niedrigste, was noch faellt.
//
//   Er verlaengert. Ein Waechter gibt einen Freidreh dazu, zwei geben
//   zwei, drei geben drei.
//
// Beides zusammen ist eine Lawine: mehr Waechter heisst bessere Zeichen
// UND mehr Drehungen, um sie zu treffen. Eine Runde, die gut anfaengt,
// wird von selbst immer besser — und eine, die schlecht anfaengt, ist
// nach zwoelf Drehungen vorbei. Deshalb fuehlt sich dieser Automat ganz
// anders an als die anderen beiden, obwohl darunter dieselbe Maschine
// steht.
//
// Die Lawine braucht zwei Zaeune, und beide sind hier teuer erkauft:
// die Leiter endet bei den billigen Zeichen, und die Runde endet nach
// zwanzig Drehungen. Warum, steht bei den beiden Konstanten.

const AUGE_FREISPIELE = 12;
const AUGE_AUSLOESER  = 3;
// Wie viele Freidrehe ein Dreh nachlegt, nach der Zahl der Waechter.
const AUGE_DAZU = [0, 1, 2, 3];
// Und wie viele es hoechstens werden. Ohne die Grenze frisst sich diese
// Runde selbst auf: jeder Waechter legt Drehungen nach UND hebt die
// Zeichen, und beides zusammen laesst die Quote davonlaufen — der erste
// Versuch mass 2790 %. Eine Runde, die sich unbegrenzt verlaengert,
// waehrend sie zugleich immer besser zahlt, ist kein Bonus mehr,
// sondern ein Leck.
const AUGE_HOECHSTSPIELE = 20;

// ── Die Tafel ────────────────────────────────────────────────────
// Acht zahlende Zeichen in einer sauberen Staffel — die braucht dieser
// Automat, denn seine Bonusrunde schiebt die Zeichen darin nach oben.
// Eine Tafel mit zwei gleichwertigen Paaren, wie sie die anderen beiden
// haben, waere hier sinnlos: das Hochruecken brauchte dann zwei Stufen,
// um etwas zu aendern.
// Seit v5.30 gemalt und im Tempel des Horus: Horus ist das Wild, die
// Pyramide oeffnet die Runde. Die Kennungen `waechter` und `tor` sind
// geblieben — an ihnen haengen die Regeln und die Pruefungen. Aus acht
// zahlenden Zeichen wurden zehn: Anch und Lotus stehen zwischen den
// hohen und den vier Buchstaben, ueber die die Leiter laeuft.
const AUGE_BILD = 'bilder/auge/';
const AUGE_SYMBOLE = [
  {k:'auge',       z:'👁️', name:'Das Auge',       bild:AUGE_BILD + 'auge.jpg',       zahlt:{3:90, 4:720, 5:3250}},
  {k:'anubis',     z:'🐺', name:'Anubis',         bild:AUGE_BILD + 'anubis.jpg',     zahlt:{3:65, 4:400, 5:1600}},
  {k:'falke',      z:'🦅', name:'Der Falke',      bild:AUGE_BILD + 'falke.jpg',      zahlt:{3:45, 4:230, 5:830}},
  {k:'skarabaeus', z:'🪲', name:'Der Skarabäus',  bild:AUGE_BILD + 'skarabaeus.jpg', zahlt:{3:45, 4:165, 5:500}},
  {k:'ankh',       z:'☥',  name:'Das Anch',       bild:AUGE_BILD + 'ankh.jpg',       zahlt:{3:22, 4:90, 5:330}},
  {k:'lotus',      z:'🪷', name:'Der Lotus',      bild:AUGE_BILD + 'lotus.jpg',      zahlt:{3:20, 4:75, 5:260}},
  {k:'a',          z:'A',  name:'A',  bild:AUGE_BILD + 'a.jpg', zahlt:{3:14, 4:65, 5:220}},
  {k:'k',          z:'K',  name:'K',  bild:AUGE_BILD + 'k.jpg', zahlt:{3:13, 4:50, 5:175}},
  {k:'q',          z:'Q',  name:'Q',  bild:AUGE_BILD + 'q.jpg', zahlt:{3:11, 4:40, 5:135}},
  {k:'j',          z:'J',  name:'J',  bild:AUGE_BILD + 'j.jpg', zahlt:{3:10, 4:33, 5:110}},
  {k:'waechter',   z:'🦅', name:'Horus',          bild:AUGE_BILD + 'horus.jpg', wild:true},
  {k:'tor',        z:'🔺', name:'Die Pyramide',   bild:AUGE_BILD + 'pyramide.jpg', streu:{3:0}},
];

// ── Die Leiter ───────────────────────────────────────────────────
// Sie haengt an der REIHENFOLGE der Tafel und nicht an ihren Zahlen —
// wer die Auszahlungen je Abenteuer verstellt, verstellt die Leiter
// nicht mit und macht die gemessene Haeufigkeitstafel nicht ungueltig.
// Die Reihenfolge selbst ist deshalb nicht einstellbar.
//
// Sie reicht ueber die vier billigen Zeichen und hoert dort auf. Bis
// hinauf zum Falken zu fuehren war der zweite Fehler des ersten
// Versuchs: am Ende bestuenden die Walzen fast nur aus dem teuersten
// Zeichen, und dann zahlt jede der zehn Linien einen Fuenfer, jede
// Drehung, zwanzig Drehungen lang. Die hohen Zeichen sind teuer, WEIL
// sie selten sind — wer sie haeufig macht, hat keine hohen Zeichen
// mehr, sondern nur noch einen kaputten Automaten.
const AUGE_LEITER = ['j', 'q', 'k', 'a'];
const AUGE_HOECHSTE = AUGE_LEITER.length - 1;

// Auf Stufe n sind die untersten n Sprossen von den Baendern
// verschwunden, und alles, was darauf lag, ist bis zur Sprosse n
// hochgerueckt. Deshalb reicht eine Abbildung: was unterhalb von n lag,
// ist jetzt n.
const augeVeredeln = (feld, stufe) => {
  const n = Math.max(0, Math.min(AUGE_HOECHSTE, stufe || 0));
  if (!n) return feld;
  const ziel = AUGE_LEITER[n];
  return feld.map(k => {
    const i = AUGE_LEITER.indexOf(k);
    return (i >= 0 && i < n) ? ziel : k;
  });
};
// Welches Zeichen gerade das unterste ist — es steht in der Leiste.
const augeUnterstes = (stufe) => AUGE_LEITER[Math.max(0, Math.min(AUGE_HOECHSTE, stufe || 0))];

// ── Die Baender ──────────────────────────────────────────────────
// Zwei Sorten. Der Waechter liegt nur auf den Walzen 2, 3 und 4 — das
// steht im Band und nirgends sonst, denn anders als bei den Hoernern der
// Arena gibt es hier keine Zaehlregel, die es wiederholen muesste.
//
// Die Tore sind knapp gesaet: zwei auf den aeusseren Baendern, eines auf
// den inneren. Drei davon kommen damit etwa jede 200. Drehung — die
// Runde ist die staerkste im Haus und darf deshalb die seltenste sein.
const AUGE_BANDLAENGE = 60;
const AUGE_RAND = {
  auge: 3, anubis: 4, falke: 5, skarabaeus: 5, ankh: 6, lotus: 6,
  a: 7, k: 7, q: 7, j: 8, tor: 2,
};
const AUGE_MITTE = {
  waechter: 2, auge: 3, anubis: 4, falke: 4, skarabaeus: 5, ankh: 5, lotus: 6,
  a: 7, k: 7, q: 7, j: 9, tor: 1,
};
const AUGE_BAENDER = [0, 1, 2, 3, 4].map(w => wBandAusAnzahlen(
  (w === 0 || w === 4) ? AUGE_RAND : AUGE_MITTE, AUGE_BANDLAENGE, w * 0.2 + 0.05));

// ── Ein Dreh ─────────────────────────────────────────────────────
// Erst die Leiter auf das gezogene Feld, dann die Ausdehnung, dann die
// Wertung. Der Waechter zahlt selbst nichts; eine gefuellte Walze ist
// eine Walze aus Jokern, und was sie einbringt, entscheidet das, was
// daneben liegt.
const augeDreh = (feld, symbole, einsatz, stufe) => {
  const grund = augeVeredeln(feld, stufe);
  const walzen = wWalzenMit(grund, 'waechter');
  const bild = walzen.reduce((f, w) => wWalzeFuellen(f, w, 'waechter'), grund);

  const le = wLinieneinsatz(einsatz);
  const treffer = [];
  let gewinn = 0;
  W_LINIEN.forEach((linie, nr) => {
    const t = wLinieWerten(bild, linie, symbole, le);
    if (!t) return;
    gewinn += t.betrag;
    treffer.push({nr, name: linie.name, ...t});
  });
  // Die Tore zaehlen auf dem gezogenen Feld: eine mit Waechtern
  // gefuellte Walze haette sonst welche verschluckt.
  const streu = [];
  symbole.filter(s => s.streu).forEach(s => {
    const e = wStreuWerten(grund, s, einsatz);
    if (e.betrag > 0 || e.anzahl >= AUGE_AUSLOESER) streu.push(e);
  });
  return {feld: bild, roh: grund, gewinn, treffer, streu,
          walzen, wilds: walzen.length};
};

const augeZahl = (feld, symbole) => wStreuZahl(feld, symbole, 'tor');
const augeDazu = (wilds) => AUGE_DAZU[Math.min(wilds, AUGE_DAZU.length - 1)] || 0;

// ── Die Rechnung ─────────────────────────────────────────────────
// Die Runde muss ganz durchgerechnet werden, samt Lawine: die Stufe
// steigt mit jedem Waechter, und die Zahl der Drehungen auch. Eine
// Messung, die nur zwoelf Drehungen ansetzt, unterschaetzt diesen
// Automaten erheblich.
const augeFreiLauf = (symbole, baender, zufall) => (feld, z) => {
  const r = zufall || Math.random;
  if (augeZahl(feld, symbole) < AUGE_AUSLOESER) return;
  let uebrig = AUGE_FREISPIELE, stufe = 0, gespielt = 0;
  while (uebrig > 0 && gespielt < AUGE_HOECHSTSPIELE) {
    uebrig--; gespielt++;
    const grund = augeVeredeln(wZiehen(baender, r), stufe);
    const walzen = wWalzenMit(grund, 'waechter');
    const bild = walzen.reduce((f, w) => wWalzeFuellen(f, w, 'waechter'), grund);
    wZaehlenLinien(z, bild, symbole);
    uebrig += augeDazu(walzen.length);
    stufe = Math.min(AUGE_HOECHSTE, stufe + walzen.length);
  }
};

const augeMessen = (symbole, baender, drehungen, zufall) =>
  wMessen({symbole, baender, freiLauf: augeFreiLauf(symbole, baender, zufall)},
          drehungen, zufall);

// ── Die gemessene Tafel ──────────────────────────────────────────
// Einmal in der Werkbank gemessen, hier als Konstante; der Browser
// rechnet daraus nur noch das Skalarprodukt.
//
// Eine Zahl darin verdient einen zweiten Blick: der Fuenfer des A faellt
// ein Viertel so oft wie sein Dreier, bei den hohen Zeichen ist es ein
// Hundertstel. Das ist kein Fehler, sondern die Runde — wenn die Leiter
// oben ist, liegen auf den Walzen viele A, und dann treffen Linien
// Fuenfer. (Bis v5.29, mit acht Zeichen, fiel der Fuenfer der obersten
// Sprosse sogar oefter als ihr Dreier.)
//
// Gemessen mit 10.000.000 stillen Drehungen (v5.30, zehn zahlende
// Zeichen statt acht); die Zahlen sind Treffer je Drehung. Die Runde
// faellt etwa jede 350. Drehung. Quote 95,3 %.
//
// Zehn Zeichen statt acht verduennen jeden Treffer: dieselbe Tafel zahlte
// damit nur noch 44 %. Deshalb stehen die Zahlen gut doppelt so hoch wie
// bis v5.29 — die Form der Tafel ist dieselbe geblieben.
const AUGE_HAEUFIGKEIT = {
  drehungen: 1,
  linie: {
    a: {3:0.03803, 4:0.01298, 5:0.009143},
    ankh: {3:0.0133, 4:0.001677, 5:0.0001926},
    anubis: {3:0.006732, 4:0.0007658, 5:0.0000567},
    auge: {3:0.003628, 4:0.0003457, 5:0.0000197},
    falke: {3:0.008422, 4:0.0008972, 5:0.0000793},
    j: {3:0.03722, 4:0.007306, 5:0.001127},
    k: {3:0.02608, 4:0.00516, 5:0.001386},
    lotus: {3:0.01699, 4:0.002483, 5:0.0002803},
    q: {3:0.02436, 4:0.004198, 5:0.0006722},
    skarabaeus: {3:0.01112, 4:0.001447, 5:0.0001331},
  },
  streu: {
    tor: {1:0.2637, 2:0.03858, 3:0.00277, 4:0.0000906, 5:0.0000017},
  },
};

// ── Der Tisch ────────────────────────────────────────────────────
const AugeTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const symbole = React.useMemo(() => wSymboleAus(AUGE_SYMBOLE, cfg && cfg.augeSymbole), [cfg]);
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const [einsatz, setEinsatz] = React.useState(() => einsaetze[Math.min(1, einsaetze.length - 1)]);
  const [feld, setFeld] = React.useState(() => wZiehen(AUGE_BAENDER, Math.random));
  const [baender, setBaender] = React.useState(
    () => [0,1,2,3,4].map(w => wBandBauen(feld, w, symbole, Math.random)));
  const [dreh, setDreh] = React.useState(0);
  const [ergebnis, setErgebnis] = React.useState(null);
  const [frei, setFrei] = React.useState(null);     // {uebrig, gespielt, gesamt, stufe, neu, gerueckt}
  const [riskierbar, setRiskierbar] = React.useState(0);
  const [risiko, setRisiko] = React.useState(null);

  const {laeuft, starten} = useWalzenLauf();
  const zeigeLinie = useLinienWechsel(ergebnis && ergebnis.treffer);
  const zaehler = useHochzaehler(ergebnis ? Math.round(ergebnis.gewinn) : 0);

  React.useEffect(() => { if (onLaeuft) onLaeuft(laeuft); }, [laeuft]);
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  const quote = React.useMemo(() => wQuote(AUGE_HAEUFIGKEIT, symbole), [symbole]);

  const imFrei = !!(frei && frei.uebrig > 0);
  const kannDrehen = !laeuft && !risiko && (imFrei || marken >= einsatz);

  const drehen = () => {
    if (!kannDrehen) return;
    const gezogen = wZiehen(AUGE_BAENDER, Math.random);
    const stufe = imFrei ? frei.stufe : 0;
    const e = augeDreh(gezogen, symbole, einsatz, stufe);
    const tore = augeZahl(e.roh, symbole);
    const gewinn = Math.round(e.gewinn);

    if (!imFrei) zahlen(-einsatz);

    setFeld(e.feld);
    setBaender([0,1,2,3,4].map(w => wBandBauen(e.feld, w, symbole, Math.random)));
    setErgebnis(null); setRiskierbar(0); setRisiko(null);
    setDreh(d => d + 1);

    starten(() => {
      zahlen(gewinn);
      setErgebnis({...e, gewinn});
      setRiskierbar(imFrei ? 0 : gewinn);
      if (imFrei) {
        const dazu = augeDazu(e.wilds);
        setFrei(f => {
          if (!f) return f;
          // Die Obergrenze gilt hier genauso wie in der Messung. Sonst
          // liefe am Tisch eine laengere Runde als die, mit der die
          // Quote gemessen wurde — und die Zahl an der Tafel waere
          // schlicht falsch.
          const gespielt = f.gespielt + 1;
          const uebrig = Math.max(0, Math.min(f.uebrig - 1 + dazu,
                                              AUGE_HOECHSTSPIELE - gespielt));
          return {...f, gespielt, uebrig,
            gesamt: f.gesamt + gewinn,
            stufe: Math.min(AUGE_HOECHSTE, f.stufe + e.wilds),
            neu: dazu, gerueckt: e.wilds};
        });
      } else if (tore >= AUGE_AUSLOESER) {
        setFrei({uebrig: AUGE_FREISPIELE, gespielt: 0, gesamt: 0,
                 stufe: 0, neu: 0, gerueckt: 0});
      }
    });
  };

  // Was der Autolauf als Naechstes tut — und ob es etwas kostet.
  const weiter = (darfZahlen) => {
    if (frei && frei.uebrig <= 0) { setFrei(null); return 'frei'; }
    if (imFrei) { drehen(); return 'frei'; }
    if (!darfZahlen || !kannDrehen) return null;
    drehen();
    return 'bezahlt';
  };
  const lauf = useAutolauf(!laeuft && !risiko, weiter,
                           ergebnis && ergebnis.gewinn > 0 ? 1400 : 450);

  const risikoStarten = (art) => {
    const gesamt = riskierbar;
    if (gesamt <= 0 || risiko) return;
    zahlen(-gesamt);
    setRiskierbar(0);
    setRisiko({art, betrag: gesamt, stufe: 0, aus: false, letztes: null,
               laeuft: art === 'leiter', pos: 0,
               ziel: Math.floor(Math.random() * LEITER_FELDER), gezogen: null});
  };

  const leuchtet = laeuft ? new Set() : wLeuchtet(ergebnis, zeigeLinie);
  const gefuellt = (!laeuft && ergebnis && ergebnis.walzen) || [];
  const unten = frei ? wSymbol(augeUnterstes(frei.stufe), symbole) : null;

  return (
    <>
      {risiko && (
        <RisikoFenster risiko={risiko} setRisiko={setRisiko}
          onNehmen={(b)=>{ zahlen(b); setRisiko(null); }}
          onTeilen={(b)=>zahlen(b)}
          onSchliessen={()=>setRisiko(null)} />
      )}

      <div className="automat-mitte aut-mitte">
        <div className="automat-kasten walzen-kasten">
          {frei && (
            <>
              <div className="frei-leiste">
                <span className="frei-zeichen">{wZeichen(wSymbol('waechter', symbole))}</span>
                <span className="frei-text">
                  <b>{frei.stufe === 0 ? 'Noch nichts veredelt'
                      : (frei.stufe >= AUGE_HOECHSTE ? 'Die Leiter ist oben: '
                         : 'Unterstes Zeichen: ') + (unten ? unten.name : '')}</b>
                  <i>jeder Horus nimmt die unterste Sprosse</i>
                </span>
                <span className="frei-zahl">
                  {frei.uebrig > 0 ? frei.uebrig : 0}
                  <i>{frei.uebrig === 1 ? 'Freispiel' : 'Freispiele'}</i>
                </span>
              </div>
              {/* Die Leiter zum Ansehen: was weg ist, steht durchgestrichen
                  da. Ohne sie muesste man die Tafel im Kopf mitfuehren. */}
              <div className="auge-leiter" aria-label="Die Leiter">
                {AUGE_LEITER.map((k, i) => {
                  const s = wSymbol(k, symbole);
                  return (
                    <span key={k} className={'auge-sprosse'
                        + (i < frei.stufe ? ' weg' : '')
                        + (i === frei.stufe ? ' unten' : '')}>
                      {s ? wZeichen(s) : ''}
                    </span>
                  );
                })}
              </div>
            </>
          )}

          <WalzenSchirm baender={baender} symbole={symbole} dreh={dreh}
            laeuft={laeuft} leuchtet={leuchtet} gefuellt={gefuellt} />

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
                      + ' ×' + ergebnis.treffer[zeigeLinie].laenge
                      + '  (' + (zeigeLinie + 1) + ' von ' + ergebnis.treffer.length + ')'
                    : ergebnis.treffer.map(t => t.name + ' · ' + t.sym.name).join('   ')}
                </span>
              </>
            ) : (
              <span className="leise">Nichts. Nochmal.</span>
            )}
            {ergebnis && !laeuft && ergebnis.streu.length > 0 && (
              <span className="vollbild">🔺 Die Pyramiden!</span>
            )}
            {ergebnis && !laeuft && !imFrei && ergebnis.wilds > 0 && !frei && (
              <span className="freidreh">{ergebnis.wilds === 1 ? 'Horus'
                : ergebnis.wilds + '× Horus'}</span>
            )}
            {frei && frei.neu > 0 && !laeuft && (
              <span className="freidreh">
                +{frei.neu} Freidreh{frei.neu > 1 ? 'e' : ''}
                {frei.gerueckt > 0 && ' · ' + frei.gerueckt + ' Stufe'
                  + (frei.gerueckt > 1 ? 'n' : '') + ' hoch'}
              </span>
            )}
          </div>

          {frei && frei.uebrig <= 0 && (
            <div className="frei-schluss">
              <span>Horus schließt die Augen{frei.gespielt >= AUGE_HOECHSTSPIELE
                ? ' nach ' + AUGE_HOECHSTSPIELE + ' Drehungen' : ''}.
                Zusammen <b>{frei.gesamt}</b>.</span>
              <button className="risiko-knopf" onClick={()=>setFrei(null)}>Verstanden</button>
            </div>
          )}

          <div className="automat-einsatz">
            <span className="automat-label">Einsatz</span>
            {einsaetze.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                disabled={imFrei || !!lauf.auto} onClick={()=>setEinsatz(n)}>{n}</button>
            ))}
          </div>

          <button className={'automat-hebel' + (imFrei ? ' frei' : '')}
            disabled={!kannDrehen || !!lauf.auto} onClick={drehen}>
            {laeuft ? 'Läuft…'
              : imFrei ? '🔺 Freidreh · noch ' + frei.uebrig
              : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig im Beutel'}
          </button>

          <AutolaufLeiste lauf={lauf} gesperrt={!kannDrehen} />

          {riskierbar > 0 && !laeuft && !risiko && !lauf.auto && !imFrei && (
            <div className="risiko-angebot">
              <span className="risiko-angebot-text">{riskierbar} setzen?</span>
              <button className="risiko-knopf" onClick={()=>risikoStarten('leiter')}>🪜 Leiter</button>
              <button className="risiko-knopf" onClick={()=>risikoStarten('karte')}>🂠 Rabe oder Rose</button>
            </div>
          )}
        </div>

        <WalzenTafel symbole={symbole} quote={quote} kinder={
          <p className="automat-fussnote">
            <b>Horus</b> — er liegt nur auf Walze 2, 3 und 4 und füllt die ganze
            Walze, auf der er fällt. Er zahlt selbst nichts, ersetzt aber jedes
            Zeichen außer der Pyramide. {AUGE_AUSLOESER} Pyramiden öffnen
            {' '}{AUGE_FREISPIELE} Freispiele, und darin nimmt jeder Horus den untersten
            Buchstaben von den Walzen — J, dann Q, dann K —, und alles rückt eine Stufe
            hoch, für den Rest der Runde. Dazu ein Freidreh je Horus, zwei bei zweien,
            drei bei dreien, höchstens {AUGE_HOECHSTSPIELE} Drehungen.
          </p>
        } />
      </div>
    </>
  );
};
