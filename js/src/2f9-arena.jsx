// Heldenbuch — „Klinge und Hörner", der zweite der drei
// Fuenfwalzenautomaten.
//
// Die Arena unter der Stadt: der Minotaurus, und was von den Klingen im
// Sand steckenbleibt. Drei Hoerner auf Walze 1, 3 und 5 oeffnen zehn
// Freispiele, und darin bleibt jede Klinge, die faellt, bis zum letzten
// Dreh stehen. Sie sammeln sich an — der siebte Freidreh wird auf einem
// Feld gespielt, auf dem schon vier Klingen kleben.
//
// Nachladen gibt es nicht. Die Runde ist nach zehn Drehungen zu Ende,
// egal was faellt. Das ist Absicht und nicht Sparsamkeit: eine Runde,
// die sich selbst verlaengert, muesste kleiner anfangen.
//
// Die Tafel ist flach, und auch das ist Absicht. Der hoechste Treffer
// zahlt 450, wo das Verschollene Kapitel 2000 zahlt — dafuer trifft
// dieser Automat oefter. Er verdient sein Geld nicht am einen grossen
// Dreh, sondern an vielen mittleren und an der Runde, in der die Klingen
// sich sammeln. Zwei Automaten mit derselben Quote koennen sich sehr
// verschieden anfuehlen, und genau das ist der Grund, drei zu bauen.

const ARENA_FREISPIELE = 10;
const ARENA_AUSLOESER  = 3;      // drei Hoerner, und die liegen nur auf 1, 3, 5

// ── Die Tafel ────────────────────────────────────────────────────
// Flach, mit dem Wild an der Spitze. Die Zahlen sind Vielfache des
// LINIENeinsatzes; der ist ein Zehntel dessen, was auf der Leiste steht.
const ARENA_SYMBOLE = [
  {k:'klinge',    z:'🗡️', name:'Die Klinge', wild:true, zahlt:{3:45, 4:135, 5:450}},
  {k:'fechterin', z:'💃', name:'Die Fechterin',        zahlt:{3:22, 4:90, 5:225}},
  {k:'rose',      z:'🌹', name:'Die Rose',             zahlt:{3:13, 4:45, 5:115}},
  {k:'trommel',   z:'🪘', name:'Die Trommel',          zahlt:{3:13, 4:45, 5:115}},
  {k:'schild',    z:'🛡️', name:'Der Schild',           zahlt:{3:13, 4:45, 5:115}},
  {k:'becher',    z:'🍷', name:'Der Becher',           zahlt:{3:4, 4:9, 5:24}},
  {k:'glocke',    z:'🔔', name:'Die Glocke',           zahlt:{3:4, 4:9, 5:24}},
  {k:'handschuh', z:'🧤', name:'Der Handschuh',        zahlt:{3:4, 4:9, 5:24}},
  {k:'kette',     z:'⛓️', name:'Die Kette',            zahlt:{3:4, 4:9, 5:24}},
  // Die Hoerner zahlen selbst nichts — sie oeffnen nur. Die leere Tafel
  // steht trotzdem da, sonst waeren sie kein Streuzeichen und wuerden
  // nirgends gezaehlt.
  {k:'hoerner',   z:'🐂', name:'Die Hörner', streu:{3:0}, streuWalzen:[0, 2, 4]},
];

// ── Die Baender ──────────────────────────────────────────────────
// Zwei verschiedene: die Hoerner liegen nur auf Walze 1, 3 und 5. Das
// steht damit zweimal fest — im Band, das sie sonst nirgends fuehrt, und
// in der Regel `streuWalzen`. Das ist keine Doppelung aus Versehen: das
// Band sagt, wo ein Zeichen liegt, die Regel sagt, wie es zaehlt, und
// wer eines von beiden aendert, soll nicht versehentlich das andere
// mitaendern.
//
// Vier Hoerner auf sechzig Plaetzen heisst 20 % je Walze; alle drei
// zusammen kommen damit etwa jede 125. Drehung.
const ARENA_BANDLAENGE = 60;
const ARENA_MIT_HOERNERN = {
  klinge: 3, fechterin: 5, rose: 6, trommel: 6, schild: 6,
  becher: 7, glocke: 7, handschuh: 8, kette: 8, hoerner: 4,
};
const ARENA_OHNE_HOERNER = {
  klinge: 3, fechterin: 5, rose: 6, trommel: 6, schild: 6,
  becher: 8, glocke: 8, handschuh: 9, kette: 9,
};
const ARENA_BAENDER = [0, 1, 2, 3, 4].map(w => wBandAusAnzahlen(
  w % 2 === 0 ? ARENA_MIT_HOERNERN : ARENA_OHNE_HOERNER,
  ARENA_BANDLAENGE, w * 0.2 + 0.05));

// ── Die klebenden Klingen ────────────────────────────────────────
// Eine Liste von Feldnummern, mehr ist die ganze Regel nicht. Vor dem
// Werten werden sie ins gezogene Feld gesetzt, danach kommen die neu
// gefallenen dazu.
//
// Die Reihenfolge ist wichtig: eine Klinge, die gerade erst gefallen
// ist, zaehlt schon in diesem Dreh mit und bleibt danach. Andersherum
// waere sie einen Dreh lang unsichtbar.
const arenaKleben = (feld, klebt) => {
  if (!klebt || !klebt.length) return feld;
  const neu = feld.slice();
  klebt.forEach(i => { neu[i] = 'klinge'; });
  return neu;
};
const arenaKlingen = (feld) => {
  const raus = [];
  for (let i = 0; i < W_FELDER; i++) if (feld[i] === 'klinge') raus.push(i);
  return raus;
};

// Wie viele Hoerner liegen — und die zaehlen je Walze nur einmal und nur
// auf 1, 3 und 5. Das macht den Ausloeser seltener, als er aussieht.
const arenaZahl = (feld, symbole) => wStreuZahl(feld, symbole, 'hoerner');

// ── Ein Dreh ─────────────────────────────────────────────────────
const arenaDreh = (feld, symbole, einsatz, klebt) => {
  const bild = arenaKleben(feld, klebt);
  const le = wLinieneinsatz(einsatz);
  const treffer = [];
  let gewinn = 0;
  W_LINIEN.forEach((linie, nr) => {
    const t = wLinieWerten(bild, linie, symbole, le);
    if (!t) return;
    gewinn += t.betrag;
    treffer.push({nr, name: linie.name, ...t});
  });
  // Nur, was oeffnet, wird vermerkt. Ein einzelnes Horn liegt fast jede
  // dritte Drehung irgendwo; es leuchtete dann auf, als waere etwas
  // passiert, und passiert ist nichts.
  const streu = [];
  symbole.filter(s => s.streu).forEach(s => {
    const e = wStreuWerten(bild, s, einsatz);
    if (e.betrag > 0 || e.anzahl >= ARENA_AUSLOESER) streu.push(e);
  });
  return {feld: bild, roh: feld, gewinn, treffer, streu,
          klebt: arenaKlingen(bild)};
};

// ── Die Rechnung ─────────────────────────────────────────────────
const arenaFreiLauf = (symbole, baender, zufall) => (feld, z) => {
  const r = zufall || Math.random;
  if (arenaZahl(feld, symbole) < ARENA_AUSLOESER) return;
  let klebt = [];
  for (let i = 0; i < ARENA_FREISPIELE; i++) {
    const bild = arenaKleben(wZiehen(baender, r), klebt);
    wZaehlenLinien(z, bild, symbole);
    klebt = arenaKlingen(bild);
  }
};

const arenaMessen = (symbole, baender, drehungen, zufall) =>
  wMessen({symbole, baender, freiLauf: arenaFreiLauf(symbole, baender, zufall)},
          drehungen, zufall);

// ── Die gemessene Tafel ──────────────────────────────────────────
// Einmal in der Werkbank gemessen, hier als Konstante; der Browser
// rechnet daraus nur noch das Skalarprodukt. Wer die Baender aendert,
// muss neu messen — wer die Auszahlungen aendert, nicht.
// Gemessen mit 12.000.000 stillen Drehungen; die Zahlen sind Treffer je
// Drehung. Die Runde faellt damit etwa jede 125. Drehung.
const ARENA_HAEUFIGKEIT = {
  drehungen: 1,
  linie: {
    becher: {3:0.05272, 4:0.01236, 5:0.004677},
    fechterin: {3:0.02738, 4:0.006087, 5:0.002893},
    glocke: {3:0.05281, 4:0.01234, 5:0.004662},
    handschuh: {3:0.0671, 4:0.01659, 5:0.006366},
    kette: {3:0.067, 4:0.01651, 5:0.006403},
    klinge: {3:0.007774, 4:0.003609, 5:0.002128},
    rose: {3:0.03731, 4:0.00858, 5:0.003512},
    schild: {3:0.0374, 4:0.008471, 5:0.003508},
    trommel: {3:0.03744, 4:0.008526, 5:0.003505},
  },
  streu: {
    hoerner: {1:0.384, 2:0.0961, 3:0.008011},
  },
};

// ── Der Tisch ────────────────────────────────────────────────────
const ArenaTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const symbole = React.useMemo(() => wSymboleAus(ARENA_SYMBOLE, cfg && cfg.arenaSymbole), [cfg]);
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const [einsatz, setEinsatz] = React.useState(() => einsaetze[Math.min(1, einsaetze.length - 1)]);
  const [feld, setFeld] = React.useState(() => wZiehen(ARENA_BAENDER, Math.random));
  const [baender, setBaender] = React.useState(
    () => [0,1,2,3,4].map(w => wBandBauen(feld, w, symbole, Math.random)));
  const [dreh, setDreh] = React.useState(0);
  const [ergebnis, setErgebnis] = React.useState(null);
  const [frei, setFrei] = React.useState(null);       // {uebrig, gesamt, klebt}
  const [riskierbar, setRiskierbar] = React.useState(0);
  const [risiko, setRisiko] = React.useState(null);

  const {laeuft, starten} = useWalzenLauf();
  const zeigeLinie = useLinienWechsel(ergebnis && ergebnis.treffer);
  const zaehler = useHochzaehler(ergebnis ? Math.round(ergebnis.gewinn) : 0);

  React.useEffect(() => { if (onLaeuft) onLaeuft(laeuft); }, [laeuft]);
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  const quote = React.useMemo(() => wQuote(ARENA_HAEUFIGKEIT, symbole), [symbole]);

  const imFrei = !!(frei && frei.uebrig > 0);
  const kannDrehen = !laeuft && !risiko && (imFrei || marken >= einsatz);

  const drehen = () => {
    if (!kannDrehen) return;
    const gezogen = wZiehen(ARENA_BAENDER, Math.random);
    const e = arenaDreh(gezogen, symbole, einsatz, imFrei ? frei.klebt : null);
    const hoerner = arenaZahl(gezogen, symbole);
    const gewinn = Math.round(e.gewinn);

    // Sofort buchen, danach zeigen — der Ausgang steht fest, sobald
    // gezogen wurde.
    zahlen((imFrei ? 0 : -einsatz) + gewinn);

    setFeld(e.feld);
    setBaender([0,1,2,3,4].map(w => wBandBauen(e.feld, w, symbole, Math.random)));
    setErgebnis(null); setRiskierbar(0); setRisiko(null);
    setDreh(d => d + 1);

    starten(() => {
      setErgebnis({...e, gewinn});
      setRiskierbar(imFrei ? 0 : gewinn);
      if (imFrei) {
        setFrei(f => f && {...f, uebrig: f.uebrig - 1, gesamt: f.gesamt + gewinn,
                           klebt: e.klebt});
      } else if (hoerner >= ARENA_AUSLOESER) {
        // Die Runde faengt mit leerem Sand an: was im Ausloeser lag,
        // klebt noch nicht.
        setFrei({uebrig: ARENA_FREISPIELE, gesamt: 0, klebt: []});
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
  // Gezeigt wird, was nach diesem Dreh steckt — auch die Klinge, die
  // gerade erst gefallen ist.
  const klebt = React.useMemo(
    () => new Set(!laeuft && imFrei && ergebnis ? ergebnis.klebt : []),
    [laeuft, imFrei, ergebnis]);

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
            <div className="frei-leiste">
              <span className="frei-zeichen">🗡️</span>
              <span className="frei-text">
                <b>{frei.klebt.length} {frei.klebt.length === 1 ? 'Klinge steckt' : 'Klingen stecken'}</b>
                <i>sie bleiben bis zum letzten Dreh</i>
              </span>
              <span className="frei-zahl">
                {frei.uebrig > 0 ? frei.uebrig : 0}
                <i>{frei.uebrig === 1 ? 'Freispiel' : 'Freispiele'}</i>
              </span>
            </div>
          )}

          <WalzenSchirm baender={baender} symbole={symbole} dreh={dreh}
            laeuft={laeuft} leuchtet={leuchtet} klebt={klebt} />

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
              <span className="vollbild">🐂 Die Hörner!</span>
            )}
          </div>

          {frei && frei.uebrig <= 0 && (
            <div className="frei-schluss">
              <span>Der Sand wird geharkt. Zusammen <b>{frei.gesamt}</b>.</span>
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
              : imFrei ? '🗡️ Freidreh · noch ' + frei.uebrig
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
            <b>Der Sand</b> — {ARENA_AUSLOESER} Hörner auf Walze 1, 3 und 5 öffnen
            {' '}{ARENA_FREISPIELE} Freispiele. Anderswo liegen die Hörner nicht, und
            je Walze zählt eines. In den Freispielen bleibt jede Klinge, die fällt,
            bis zum letzten Dreh stehen und sammelt sich mit den anderen. Nachgelegt
            wird nicht: nach {ARENA_FREISPIELE} Drehungen ist die Runde zu Ende,
            gleich was fällt.
          </p>
        } />
      </div>
    </>
  );
};
