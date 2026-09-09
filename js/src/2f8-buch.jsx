// Heldenbuch — „Das Verschollene Kapitel", der erste der drei
// Fuenfwalzenautomaten.
//
// Ein Zauberbuch in einer versunkenen Bibliothek. Drei Buecher oeffnen
// zehn Freispiele; vorher blaettert das Buch und bleibt bei einem Zeichen
// stehen. Faellt dieses Zeichen im Freispiel mindestens dreimal, fuellt
// es die Walzen, auf denen es liegt, und zahlt ueber alle zehn Linien —
// und zwar, ohne nebeneinander liegen zu muessen. Ein Sonderzeichen auf
// Walze 1, 3 und 5 zahlt wie drei nebeneinander. Das ist die ganze Regel,
// und sie traegt den Automaten.
//
// Das Buch ist dabei Wild und Streuzeichen zugleich: es ersetzt jedes
// Zeichen auf einer Linie und zaehlt gleichzeitig verstreut. Wird es
// selbst zum Sonderzeichen gelost, ist das der beste Fall — dann fuellen
// sich Walzen mit einem Zeichen, das alles ersetzt.

const BUCH_FREISPIELE = 10;
const BUCH_AUSLOESER  = 3;     // so viele Buecher oeffnen die Runde
const BUCH_MINDEST    = 3;     // so oft muss das Sonderzeichen liegen

// ── Die Tafel ────────────────────────────────────────────────────
// Die Form ist die des Vorbilds: ein Zeichen, das schon zu zweit zahlt,
// darunter drei hohe, dann vier billige in zwei Stufen — und ein steiler
// Sprung vom Vierer zum Fuenfer, der die Schwankung macht.
//
// Die Zahlen sind Vielfache des LINIENeinsatzes, und der ist ein Zehntel
// dessen, was auf der Leiste steht. Mit ihnen zahlt der Automat 95,2 %
// aus, davon 45 % aus der Freispielrunde; die faellt etwa jede 117.
// Drehung. Gemessen, nicht geschaetzt — die Tafel dazu steht unten.
//
// Wer sie verstellt, verstellt die Quote. Sie steht am Tisch, und zwar
// die erreichte und nicht die gewuenschte.
const BUCH_SYMBOLE = [
  {k:'graeber',  z:'🧭', name:'Der Gräber',            zahlt:{2:2, 3:40, 4:400, 5:2000}},
  {k:'krone',    z:'👑', name:'Die Drachenkrone',      zahlt:{3:40, 4:300, 5:800}},
  {k:'waechter', z:'🗿', name:'Der steinerne Wächter', zahlt:{3:16, 4:160, 5:400}},
  {k:'kaefer',   z:'🪲', name:'Der Grabkäfer',         zahlt:{3:16, 4:160, 5:400}},
  {k:'feuer',    z:'🔥', name:'Feuer',                 zahlt:{3:2, 4:16, 5:55}},
  {k:'luft',     z:'🌬️', name:'Luft',                  zahlt:{3:2, 4:16, 5:55}},
  {k:'erde',     z:'⛰️', name:'Erde',                  zahlt:{3:2, 4:10, 5:35}},
  {k:'wasser',   z:'💧', name:'Wasser',                zahlt:{3:2, 4:10, 5:35}},
  {k:'buch',     z:'📜', name:'Das Buch der Tiefe',
   wild:true, streu:{2:0.5, 3:1, 4:10, 5:100}},
];

// ── Die Baender ──────────────────────────────────────────────────
// Zwei Buecher auf sechzig Plaetzen heisst: jede Walze zeigt mit
// Wahrscheinlichkeit 1/10 eines. Drei auf fuenf Walzen kommen damit etwa
// jede hundertzwanzigste Drehung — nah an dem, was das Vorbild tut. Ein
// Buch mehr je Band, und die Runde faellt achtmal so oft; eins weniger,
// und niemand bekommt sie je zu sehen.
const BUCH_BANDLAENGE = 60;
const BUCH_ANZAHLEN = {
  graeber: 3, krone: 4, waechter: 6, kaefer: 6,
  feuer: 8, luft: 8, erde: 11, wasser: 12, buch: 2,
};
const BUCH_BAENDER = wBaenderAus(BUCH_ANZAHLEN, BUCH_BANDLAENGE);

// ── Ein Dreh ─────────────────────────────────────────────────────
// Im Grundspiel ist es der gewoehnliche: Linien, dann die Buecher.
//
// Im Freispiel kommt die eine Regel dazu. Das Sonderzeichen zahlt dann
// NICHT ueber die Linien, sondern ueber seine Ausdehnung — sonst zaehlte
// derselbe Treffer zweimal, einmal als Kette und einmal als gefuellte
// Walze. Deshalb wird ihm fuer die Linienwertung die Auszahlung
// weggenommen; wild und verstreut bleibt es, falls es das Buch ist.
const buchOhne = (symbole, k) => symbole.map(s => s.k === k ? {...s, zahlt: null} : s);

const buchDreh = (feld, symbole, einsatz, sonderK) => {
  const le = wLinieneinsatz(einsatz);
  const streu = [];
  // Zwei Regeln fuer die Buecher, beide erfahren:
  //
  // Sie zaehlen immer auf dem gezogenen Feld, nie auf dem ausgefuellten —
  // sonst zaehlte eine mit Buechern gefuellte Walze neun davon, und
  // dafuer steht in der Tafel nichts.
  //
  // Und vermerkt wird nur, was zahlt oder oeffnet. Ein einzelnes Buch
  // liegt fast jede dritte Drehung irgendwo; es leuchtete dann auf, als
  // haette es etwas eingebracht, und in der Meldung stuende „1 Bücher".
  symbole.filter(s => s.streu).forEach(s => {
    const e = wStreuWerten(feld, s, einsatz);
    if (e.betrag > 0 || e.anzahl >= BUCH_AUSLOESER) streu.push(e);
  });

  const walzen = sonderK ? wWalzenMit(feld, sonderK) : [];
  const dehnt = walzen.length >= BUCH_MINDEST;
  const bild = dehnt ? walzen.reduce((f, w) => wWalzeFuellen(f, w, sonderK), feld) : feld;
  const tafel = dehnt ? buchOhne(symbole, sonderK) : symbole;

  const treffer = [];
  let gewinn = streu.reduce((s, e) => s + e.betrag, 0);
  W_LINIEN.forEach((linie, nr) => {
    const t = wLinieWerten(bild, linie, tafel, le);
    if (!t) return;
    gewinn += t.betrag;
    treffer.push({nr, name: linie.name, ...t});
  });

  let ausdehnung = null;
  if (dehnt) {
    const sonder = wSymbol(sonderK, symbole);
    const betrag = wZahlt(sonder, walzen.length) * le * W_LINIEN.length;
    gewinn += betrag;
    ausdehnung = {sym: sonder, walzen, betrag};
  }
  return {feld: bild, roh: feld, gewinn, treffer, streu, ausdehnung,
          walzen: dehnt ? walzen : []};
};

// Wie viele Buecher liegen — daran haengt das Oeffnen und das Nachladen.
const buchZahl = (feld, symbole) => wStreuZahl(feld, symbole, 'buch');

// ── Die Rechnung ─────────────────────────────────────────────────
// Gemessen wird die Haeufigkeit, nicht die Quote: die ist in den
// Auszahlungen linear und danach ein Skalarprodukt. Die Freispielrunde
// zaehlt mit, und ihre Ausdehnung zaehlt als das, was sie ist — zehn
// Ketten der Laenge n auf einmal.
const buchZaehlenDreh = (z, feld, symbole, sonderK) => {
  wZaehlenStreu(z, feld, symbole);
  const walzen = sonderK ? wWalzenMit(feld, sonderK) : [];
  if (walzen.length >= BUCH_MINDEST) {
    const bild = walzen.reduce((f, w) => wWalzeFuellen(f, w, sonderK), feld);
    wZaehlenLinien(z, bild, buchOhne(symbole, sonderK));
    wZaehlenFrei(z, sonderK, walzen.length, W_LINIEN.length);
  } else {
    wZaehlenLinien(z, feld, symbole);
  }
};

// Die ganze Freispielrunde, still. Nachladen eingeschlossen — sonst
// faehlte der Quote genau der Teil, der sie interessant macht.
const buchFreiLauf = (symbole, baender, zufall) => (feld, z) => {
  const r = zufall || Math.random;
  if (buchZahl(feld, symbole) < BUCH_AUSLOESER) return;
  const sonderK = symbole[Math.floor(r() * symbole.length)].k;
  let uebrig = BUCH_FREISPIELE;
  let schutz = 0;
  while (uebrig > 0 && schutz++ < 500) {
    uebrig--;
    const f = wZiehen(baender, r);
    buchZaehlenDreh(z, f, symbole, sonderK);
    if (buchZahl(f, symbole) >= BUCH_AUSLOESER) uebrig += BUCH_FREISPIELE;
  }
};

const buchMessen = (symbole, baender, drehungen, zufall) =>
  wMessen({symbole, baender, freiLauf: buchFreiLauf(symbole, baender, zufall)},
          drehungen, zufall);

// ── Die gemessene Tafel ──────────────────────────────────────────
// Sie steht hier als Konstante und wird nicht im Browser gemessen.
// Der Versuch, das dort zu tun, ging schief: die Freispielrunde faellt
// jede 117. Drehung und traegt fast die Haelfte der Auszahlung, und die
// grossen Betraege darin kommen einmal in Zehntausenden. Zwanzigtausend
// Drehungen — mehr sind im Browser nicht zumutbar — schwankten damit um
// sechs Prozentpunkte, und der Tisch schrieb jedes Mal eine andere Quote
// hin. Eine Zahl, die bei jedem Oeffnen anders dasteht, ist keine.
//
// Also einmal gemessen, in der Werkbank, mit fuenfzehn Millionen. Der
// Browser rechnet daraus nur noch das Skalarprodukt — sofort, und bei
// jeder Aenderung der Spielleitung neu. Wer die Baender aendert, muss
// neu messen; wer die Auszahlungen aendert, nicht.
//
// Gemessen mit 15.000.000 stillen Drehungen; die Zahlen sind Treffer je
// Drehung. Erreichte Quote mit der Tafel oben: 95,2 %.
const BUCH_HAEUFIGKEIT = {
  drehungen: 1,
  linie: {
    buch:     {3:0.00084, 4:0.00003533},
    erde:     {3:0.1205, 4:0.04, 5:0.01038},
    feuer:    {3:0.06511, 4:0.01495, 5:0.00245},
    graeber:  {2:0.05763, 3:0.008117, 4:0.0007053, 5:0.0000564},
    kaefer:   {3:0.03563, 4:0.005932, 5:0.0007368},
    krone:    {3:0.01461, 4:0.001633, 5:0.0001375},
    luft:     {3:0.0652, 4:0.01492, 5:0.002407},
    waechter: {3:0.03547, 4:0.005834, 5:0.0007257},
    wasser:   {3:0.1399, 4:0.05132, 5:0.01549},
  },
  streu: {
    buch: {1:0.3588, 2:0.07974, 3:0.008905, 4:0.000487, 5:0.000009667},
  },
};

// ── Der Tisch ────────────────────────────────────────────────────
const BUCH_BLAETTER_TAKT = 130;
const BUCH_BLAETTER_ZUEGE = 11;

const BuchTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const symbole = React.useMemo(() => wSymboleAus(BUCH_SYMBOLE, cfg && cfg.buchSymbole), [cfg]);
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const [einsatz, setEinsatz] = React.useState(() => einsaetze[Math.min(1, einsaetze.length - 1)]);
  const [feld, setFeld] = React.useState(() => wZiehen(BUCH_BAENDER, Math.random));
  const [baender, setBaender] = React.useState(
    () => [0,1,2,3,4].map(w => wBandBauen(feld, w, symbole, Math.random)));
  const [dreh, setDreh] = React.useState(0);
  const [ergebnis, setErgebnis] = React.useState(null);
  const [frei, setFrei] = React.useState(null);      // {uebrig, sonderK, gesamt, neu}
  const [blaettert, setBlaettert] = React.useState(null);   // {zeigt, fertig}
  const [riskierbar, setRiskierbar] = React.useState(0);
  const [risiko, setRisiko] = React.useState(null);

  const {laeuft, starten, reduziert} = useWalzenLauf();
  const zeigeLinie = useLinienWechsel(ergebnis && ergebnis.treffer);
  const zaehler = useHochzaehler(ergebnis ? Math.round(ergebnis.gewinn) : 0);

  React.useEffect(() => { if (onLaeuft) onLaeuft(laeuft || !!blaettert); }, [laeuft, blaettert]);
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  // Gemessen wurde in der Werkbank, gerechnet wird hier — ein
  // Skalarprodukt aus der Haeufigkeitstafel und der Tafel, die gerade
  // gilt. Stellt die Spielleitung eine Auszahlung um, stimmt die Zahl
  // sofort wieder.
  const quote = React.useMemo(() => wQuote(BUCH_HAEUFIGKEIT, symbole), [symbole]);

  const imFrei = !!(frei && frei.uebrig > 0);
  const kannDrehen = !laeuft && !blaettert && !risiko && (imFrei || marken >= einsatz);

  const drehen = () => {
    if (!kannDrehen) return;
    const neuesFeld = wZiehen(BUCH_BAENDER, Math.random);
    const sonderK = imFrei ? frei.sonderK : null;
    const e = buchDreh(neuesFeld, symbole, einsatz, sonderK);
    const buecher = buchZahl(neuesFeld, symbole);

    // Gebucht wird sofort: der Ausgang steht fest, sobald gezogen wurde.
    // Der Lauf zeigt ihn nur — und ein Zeitgeber, den der Browser im
    // Hintergrund aufschiebt, darf niemandem das Ergebnis vorenthalten.
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
        // Nachladen: drei Buecher im Freispiel legen zehn drauf.
        const dazu = buecher >= BUCH_AUSLOESER ? BUCH_FREISPIELE : 0;
        setFrei(f => f && {...f, uebrig: f.uebrig - 1 + dazu,
                           gesamt: f.gesamt + gewinn, neu: dazu});
      } else if (buecher >= BUCH_AUSLOESER) {
        blaettern();
      }
    });
  };

  // Das Blaettern: das Buch laeuft durch die Tafel und bleibt stehen.
  // Gelost wird vorher — was durchlaeuft, ist Anzeige.
  const blaettern = () => {
    const sonderK = symbole[Math.floor(Math.random() * symbole.length)].k;
    if (reduziert) { setFrei({uebrig: BUCH_FREISPIELE, sonderK, gesamt: 0, neu: 0}); return; }
    let i = 0;
    setBlaettert({zeigt: symbole[0].k, sonderK, steht: false});
    const takt = setInterval(() => {
      i++;
      if (i >= BUCH_BLAETTER_ZUEGE) {
        clearInterval(takt);
        setBlaettert({zeigt: sonderK, sonderK, steht: true});
        return;
      }
      setBlaettert({zeigt: symbole[i % symbole.length].k, sonderK, steht: false});
    }, BUCH_BLAETTER_TAKT);
  };
  const rundeStarten = () => {
    const sonderK = blaettert.sonderK;
    setBlaettert(null);
    setFrei({uebrig: BUCH_FREISPIELE, sonderK, gesamt: 0, neu: 0});
  };

  // Setzen statt einstecken — dieselben zwei Spiele wie am dreiwalzigen
  // Automaten. Waehrend der Freispiele nicht: dort gehoert der Gewinn der
  // Runde und nicht dem einzelnen Dreh.
  const risikoStarten = (art, halb) => {
    const gesamt = riskierbar;
    if (gesamt <= 0 || risiko) return;
    const setzen = halb ? Math.floor(gesamt / 2) : gesamt;
    if (setzen <= 0) return;
    zahlen(-setzen);
    setRiskierbar(0);
    setRisiko({art, betrag: setzen, stufe: 0, aus: false, letztes: null,
               laeuft: art === 'leiter', pos: 0,
               ziel: Math.floor(Math.random() * LEITER_FELDER), gezogen: null});
  };

  const leuchtet = laeuft ? new Set() : wLeuchtet(ergebnis, zeigeLinie);
  const gefuellt = (!laeuft && ergebnis && ergebnis.walzen) || [];
  const sonder = frei ? wSymbol(frei.sonderK, symbole) : null;

  return (
    <>
      {risiko && (
        <RisikoFenster risiko={risiko} setRisiko={setRisiko}
          onNehmen={(b)=>{ zahlen(b); setRisiko(null); }}
          onSchliessen={()=>setRisiko(null)} />
      )}

      {blaettert && (
        <div className="rad-huelle">
          <div className="rad-fenster">
            <div className="rad-titel">Das Kapitel schlägt sich auf</div>
            <div className="rad-unter">
              Ein Zeichen regiert die nächsten {BUCH_FREISPIELE} Freispiele. Liegt es
              dreimal, füllt es seine Walzen — nebeneinander oder nicht.
            </div>
            <div className={'buch-blatt' + (blaettert.steht ? ' steht' : '')}>
              <span>{wSymbol(blaettert.zeigt, symbole).z}</span>
            </div>
            <div className="rad-stand">
              {blaettert.steht
                ? <b className="rad-gut">{wSymbol(blaettert.sonderK, symbole).name}</b>
                : <b className="leise">…</b>}
            </div>
            <div className="rad-tasten">
              <button className="automat-hebel" disabled={!blaettert.steht} onClick={rundeStarten}>
                {blaettert.steht ? BUCH_FREISPIELE + ' Freispiele' : 'Das Buch blättert…'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="automat-mitte aut-mitte">
        <div className="automat-kasten walzen-kasten">
          {frei && (
            <div className="frei-leiste">
              <span className="frei-zeichen">{sonder ? sonder.z : ''}</span>
              <span className="frei-text">
                <b>{sonder ? sonder.name : ''}</b>
                <i>Sonderzeichen dieser Runde</i>
              </span>
              <span className="frei-zahl">
                {frei.uebrig > 0 ? frei.uebrig : 0}
                <i>{frei.uebrig === 1 ? 'Freispiel' : 'Freispiele'}</i>
              </span>
            </div>
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
                  {ergebnis.ausdehnung
                    ? ergebnis.ausdehnung.sym.name + ' auf ' + ergebnis.ausdehnung.walzen.length
                      + ' Walzen · alle zehn Linien'
                    : ergebnis.treffer.length > 1 && zeigeLinie >= 0
                    ? ergebnis.treffer[zeigeLinie].name + ' · ' + ergebnis.treffer[zeigeLinie].sym.name
                      + ' ×' + ergebnis.treffer[zeigeLinie].laenge
                      + '  (' + (zeigeLinie + 1) + ' von ' + ergebnis.treffer.length + ')'
                    : ergebnis.treffer.map(t => t.name + ' · ' + t.sym.name).join('   ')}
                </span>
              </>
            ) : (
              <span className="leise">Nichts. Nochmal.</span>
            )}
            {ergebnis && ergebnis.streu.length > 0 && !laeuft && (
              <span className="vollbild">
                📜 {ergebnis.streu[0].anzahl === 2 ? 'Zwei Bücher'
                    : ergebnis.streu[0].anzahl + ' Bücher!'}
              </span>
            )}
            {frei && frei.neu > 0 && !laeuft && (
              <span className="freidreh">+{frei.neu} nachgelegt</span>
            )}
          </div>

          {frei && frei.uebrig <= 0 && (
            <div className="frei-schluss">
              <span>Die Runde ist zu Ende. Zusammen <b>{frei.gesamt}</b>.</span>
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
              : imFrei ? '📜 Freidreh · noch ' + frei.uebrig
              : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig ' + (marken >= 0 ? 'im Beutel' : '')}
          </button>

          {riskierbar > 0 && !laeuft && !risiko && !imFrei && (
            <div className="risiko-angebot">
              <span className="risiko-angebot-text">{riskierbar} setzen?</span>
              <button className="risiko-knopf" onClick={()=>risikoStarten('leiter', false)}>🪜 Leiter</button>
              <button className="risiko-knopf" onClick={()=>risikoStarten('karte', false)}>🂠 Rabe oder Rose</button>
            </div>
          )}
        </div>

        <WalzenTafel symbole={symbole} quote={quote} kinder={
          <p className="automat-fussnote">
            <b>Das Kapitel</b> — {BUCH_AUSLOESER} Bücher irgendwo auf dem Feld öffnen
            {' '}{BUCH_FREISPIELE} Freispiele. Vorher blättert das Buch und bleibt bei
            einem Zeichen stehen. Liegt dieses Zeichen im Freispiel auf {BUCH_MINDEST}
            {' '}Walzen oder mehr, füllt es sie ganz aus und zahlt über alle zehn
            Linien — auch dann, wenn die Walzen nicht nebeneinander liegen. Drei
            Bücher im Freispiel legen {BUCH_FREISPIELE} nach.
          </p>
        } />
      </div>
    </>
  );
};
