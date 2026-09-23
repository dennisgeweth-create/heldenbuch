// Heldenbuch — „Klinge und Hörner", der zweite der drei
// Fuenfwalzenautomaten. Seit v5.30 in der Stierkampfarena: der Torero ist
// die Klinge, der Stier sind die Hoerner.
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
// Seit v5.30 mit gemalten Zeichen aus der Stierkampfarena: der Torero
// ist das klebende Wild, der Stier oeffnet die Runde. Die Kennungen
// `klinge` und `hoerner` sind geblieben — an ihnen haengen die Regeln
// (arenaKleben, arenaZahl) und die Pruefungen; gezeigt wird der Name.
const ARENA_BILD = 'bilder/arena/';
const ARENA_SYMBOLE = [
  {k:'klinge',    z:'🗡️', name:'Der Torero',    bild:ARENA_BILD + 'torero.jpg', wild:true, zahlt:{3:47, 4:140, 5:470}},
  {k:'senorita',  z:'💃', name:'Die Señorita',  bild:ARENA_BILD + 'senorita.jpg', zahlt:{3:23, 4:95, 5:235}},
  {k:'rose',      z:'🌹', name:'Die Rose',      bild:ARENA_BILD + 'rose.jpg',     zahlt:{3:14, 4:47, 5:120}},
  {k:'gitarre',   z:'🎸', name:'Die Gitarre',   bild:ARENA_BILD + 'gitarre.jpg',  zahlt:{3:14, 4:47, 5:120}},
  {k:'hut',       z:'🎩', name:'Der Hut',       bild:ARENA_BILD + 'hut.jpg',      zahlt:{3:14, 4:47, 5:120}},
  {k:'a',         z:'A',  name:'A',  bild:ARENA_BILD + 'a.jpg',    zahlt:{3:4.2, 4:9.5, 5:25}},
  {k:'k',         z:'K',  name:'K',  bild:ARENA_BILD + 'k.jpg',    zahlt:{3:4.2, 4:9.5, 5:25}},
  {k:'q',         z:'Q',  name:'Q',  bild:ARENA_BILD + 'q.jpg',    zahlt:{3:4.2, 4:9.5, 5:25}},
  {k:'j',         z:'J',  name:'J',  bild:ARENA_BILD + 'j.jpg',    zahlt:{3:4.2, 4:9.5, 5:25}},
  {k:'zehn',      z:'10', name:'10', bild:ARENA_BILD + 'zehn.jpg', zahlt:{3:4.2, 4:9.5, 5:25}},
  // Der Stier zahlt selbst nichts — er oeffnet nur. Die leere Tafel
  // steht trotzdem da, sonst waere er kein Streuzeichen und wuerde
  // nirgends gezaehlt.
  {k:'hoerner',   z:'🐂', name:'Der Stier', bild:ARENA_BILD + 'stier.jpg', streu:{3:0}, streuWalzen:[0, 2, 4]},
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
  klinge: 3, senorita: 5, rose: 6, gitarre: 6, hut: 6,
  a: 6, k: 6, q: 6, j: 6, zehn: 6, hoerner: 4,
};
const ARENA_OHNE_HOERNER = {
  klinge: 3, senorita: 5, rose: 6, gitarre: 6, hut: 6,
  a: 7, k: 7, q: 7, j: 7, zehn: 6,
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
// Gemessen mit 10.000.000 stillen Drehungen (v5.30, mit fuenf
// Kartenbuchstaben statt vier Kleinigkeiten); die Zahlen sind Treffer je
// Drehung. Die Runde faellt damit etwa jede 125. Drehung. Quote 94,4 %.
const ARENA_HAEUFIGKEIT = {
  drehungen: 1,
  linie: {
    a: {3:0.04034, 4:0.009026, 5:0.00339},
    gitarre: {3:0.03726, 4:0.008496, 5:0.003475},
    hut: {3:0.03738, 4:0.008543, 5:0.003459},
    j: {3:0.04041, 4:0.009008, 5:0.003391},
    k: {3:0.04055, 4:0.009047, 5:0.003366},
    klinge: {3:0.007658, 4:0.003686, 5:0.002129},
    q: {3:0.0404, 4:0.008989, 5:0.003347},
    rose: {3:0.03741, 4:0.008446, 5:0.003519},
    senorita: {3:0.02743, 4:0.006093, 5:0.002831},
    zehn: {3:0.03739, 4:0.0077, 5:0.002995},
  },
  streu: {
    hoerner: {1:0.384, 2:0.09595, 3:0.007984},
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

    // Der Einsatz geht sofort, der Gewinn beim Halt (useWalzenLauf) —
    // sonst verriete die Kasse den Ausgang, bevor die Walzen stehen.
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
        setFrei(f => f && {...f, uebrig: f.uebrig - 1, gesamt: f.gesamt + gewinn,
                           klebt: e.klebt});
      } else if (hoerner >= ARENA_AUSLOESER) {
        // Die Runde faengt mit leerem Sand an: was im Ausloeser lag,
        // klebt noch nicht.
        setFrei({uebrig: ARENA_FREISPIELE, gesamt: 0, klebt: []});
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
          onTeilen={(b)=>zahlen(b)}
          onSchliessen={()=>setRisiko(null)} />
      )}

      <div className="automat-mitte aut-mitte">
        <div className="automat-kasten walzen-kasten">
          {frei && (
            <div className="frei-leiste">
              <span className="frei-zeichen">{wZeichen(wSymbol('klinge', symbole))}</span>
              <span className="frei-text">
                <b>{frei.klebt.length} {frei.klebt.length === 1 ? 'Torero steht' : 'Toreros stehen'}</b>
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
              <span className="vollbild">🐂 Der Stier!</span>
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
                disabled={imFrei || !!lauf.auto} onClick={()=>setEinsatz(n)}>{n}</button>
            ))}
          </div>

          <button className={'automat-hebel' + (imFrei ? ' frei' : '')}
            disabled={!kannDrehen || !!lauf.auto} onClick={drehen}>
            {laeuft ? 'Läuft…'
              : imFrei ? '🐂 Freidreh · noch ' + frei.uebrig
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
            <b>Der Stier</b> — {ARENA_AUSLOESER} Stiere auf Walze 1, 3 und 5 öffnen
            {' '}{ARENA_FREISPIELE} Freispiele. Anderswo liegt der Stier nicht, und je
            Walze zählt einer. In den Freispielen bleibt jeder Torero, der fällt, bis
            zum letzten Dreh stehen und sammelt sich mit den anderen. Nachgelegt
            wird nicht: nach {ARENA_FREISPIELE} Drehungen ist die Runde zu Ende,
            gleich was fällt.
          </p>
        } />
      </div>
    </>
  );
};
