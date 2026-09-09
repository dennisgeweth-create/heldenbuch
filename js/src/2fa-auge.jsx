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
//   fuer den Rest der Runde. Nach drei Waechtern ist die Feder das
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
const AUGE_SYMBOLE = [
  {k:'falke',      z:'🦅', name:'Der Falke',      zahlt:{3:40, 4:330, 5:1500}},
  {k:'natter',     z:'🐍', name:'Die Natter',     zahlt:{3:30, 4:180, 5:750}},
  {k:'schluessel', z:'🗝️', name:'Der Schlüssel',  zahlt:{3:20, 4:105, 5:380}},
  {k:'urne',       z:'⚱️', name:'Die Urne',       zahlt:{3:20, 4:75, 5:230}},
  {k:'feder',      z:'🪶', name:'Die Feder',      zahlt:{3:7, 4:30, 5:100}},
  {k:'halm',       z:'🌾', name:'Der Halm',       zahlt:{3:6, 4:23, 5:80}},
  {k:'tropfen',    z:'💧', name:'Der Tropfen',    zahlt:{3:5, 4:18, 5:62}},
  {k:'kiesel',     z:'🪨', name:'Der Kiesel',     zahlt:{3:5, 4:15, 5:50}},
  {k:'waechter',   z:'👁️', name:'Der Wächter', wild:true},
  {k:'tor',        z:'🚪', name:'Das Tor', streu:{3:0}},
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
const AUGE_LEITER = ['kiesel', 'tropfen', 'halm', 'feder'];
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
  falke: 3, natter: 4, schluessel: 5, urne: 6,
  feder: 8, halm: 9, tropfen: 10, kiesel: 13, tor: 2,
};
const AUGE_MITTE = {
  waechter: 2, falke: 3, natter: 4, schluessel: 5, urne: 5,
  feder: 8, halm: 8, tropfen: 10, kiesel: 14, tor: 1,
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
// Eine Zahl darin verdient einen zweiten Blick: der Fuenfer der Feder
// faellt oefter als ihr Dreier. Das ist kein Fehler, sondern die Runde —
// wenn die Leiter oben ist, liegen auf den Walzen fast nur noch Federn,
// und dann trifft jede Linie einen Fuenfer.
//
// Gemessen mit 8.000.000 stillen Drehungen; die Zahlen sind Treffer je
// Drehung. Die Runde faellt etwa jede 350. Drehung.
const AUGE_HAEUFIGKEIT = {
  drehungen: 1,
  linie: {
    falke: {3:0.003599, 4:0.0003462, 5:0.00001913},
    feder: {3:0.05313, 4:0.02396, 5:0.03733},
    halm: {3:0.0416, 4:0.01013, 5:0.005573},
    kiesel: {3:0.1146, 4:0.0327, 5:0.009071},
    natter: {3:0.006718, 4:0.0007466, 5:0.00005338},
    schluessel: {3:0.01105, 4:0.001405, 5:0.0001215},
    tropfen: {3:0.05805, 4:0.01346, 5:0.003593},
    urne: {3:0.0131, 4:0.001647, 5:0.0001839},
  },
  streu: {
    tor: {1:0.2641, 2:0.03862, 3:0.002741, 4:0.0000915, 5:8.75e-7},
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

    zahlen((imFrei ? 0 : -einsatz) + gewinn);

    setFeld(e.feld);
    setBaender([0,1,2,3,4].map(w => wBandBauen(e.feld, w, symbole, Math.random)));
    setErgebnis(null); setRiskierbar(0); setRisiko(null);
    setDreh(d => d + 1);

    starten(() => {
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
          onSchliessen={()=>setRisiko(null)} />
      )}

      <div className="automat-mitte aut-mitte">
        <div className="automat-kasten walzen-kasten">
          {frei && (
            <>
              <div className="frei-leiste">
                <span className="frei-zeichen">👁️</span>
                <span className="frei-text">
                  <b>{frei.stufe === 0 ? 'Noch nichts veredelt'
                      : (frei.stufe >= AUGE_HOECHSTE ? 'Die Leiter ist oben: '
                         : 'Unterstes Zeichen: ') + (unten ? unten.name : '')}</b>
                  <i>jeder Wächter nimmt die unterste Sprosse</i>
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
                      {s ? s.z : ''}
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
              <span className="vollbild">🚪 Die Tore!</span>
            )}
            {ergebnis && !laeuft && !imFrei && ergebnis.wilds > 0 && !frei && (
              <span className="freidreh">👁️ {ergebnis.wilds === 1 ? 'Der Wächter'
                : ergebnis.wilds + ' Wächter'}</span>
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
              <span>Der Wächter schließt die Augen{frei.gespielt >= AUGE_HOECHSTSPIELE
                ? ' nach ' + AUGE_HOECHSTSPIELE + ' Drehungen' : ''}.
                Zusammen <b>{frei.gesamt}</b>.</span>
              <button className="risiko-knopf" onClick={()=>setFrei(null)}>Verstanden</button>
            </div>
          )}

          <div className="automat-einsatz">
            <span className="automat-label">Einsatz</span>
            {einsaetze.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                disabled={imFrei} onClick={()=>setEinsatz(n)}>{n}</button>
            ))}
          </div>

          <button className={'automat-hebel' + (imFrei ? ' frei' : '')}
            disabled={!kannDrehen} onClick={drehen}>
            {laeuft ? 'Läuft…'
              : imFrei ? '👁️ Freidreh · noch ' + frei.uebrig
              : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig im Beutel'}
          </button>

          {riskierbar > 0 && !laeuft && !risiko && !imFrei && (
            <div className="risiko-angebot">
              <span className="risiko-angebot-text">{riskierbar} setzen?</span>
              <button className="risiko-knopf" onClick={()=>risikoStarten('leiter')}>🪜 Leiter</button>
              <button className="risiko-knopf" onClick={()=>risikoStarten('karte')}>🂠 Rabe oder Rose</button>
            </div>
          )}
        </div>

        <WalzenTafel symbole={symbole} quote={quote} kinder={
          <p className="automat-fussnote">
            <b>Der Blick</b> — der Wächter liegt nur auf Walze 2, 3 und 4 und füllt
            die ganze Walze, auf der er fällt. Er zahlt selbst nichts, ersetzt aber
            jedes Zeichen außer dem Tor. {AUGE_AUSLOESER} Tore öffnen
            {' '}{AUGE_FREISPIELE} Freispiele, und darin nimmt jeder Wächter das
            unterste Zeichen der Tafel von den Walzen — alles rückt eine Stufe hoch,
            für den Rest der Runde. Dazu ein Freidreh je Wächter, drei bei zweien,
            fünf bei dreien.
          </p>
        } />
      </div>
    </>
  );
};
