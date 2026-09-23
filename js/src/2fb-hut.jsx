// Heldenbuch — „Der Hut des Gauklers", der vierte Fuenfwalzenautomat.
//
// Ein Fest am Hof. Der Gaukler jongliert, der Koenig schaut zu, und auf
// der mittleren Walze liegt manchmal sein Hut. Faellt er, wackelt er,
// und der Gaukler zieht ein Bild heraus — manchmal zwei. Jedes Zeichen
// dieses Bildes auf dem Feld wird im selben Augenblick zum Gaukler.
//
// Die anderen drei Automaten verdienen ihr Geld in einer Freispielrunde.
// Dieser hat keine, und das ist Absicht und nicht Sparsamkeit: sein
// Bonus faellt im Grundspiel, etwa jede siebte Drehung, und ist in
// derselben Sekunde vorbei. Kein Warten auf drei Streuzeichen, keine
// zehn Drehungen am Stueck — dafuer ein Automat, bei dem jeder Dreh die
// Aussicht auf den Hut hat.
//
// Der Gaukler ist Wild und zugleich das hoechste Zeichen. Das macht den
// Hut so stark: was er verwandelt, ersetzt nicht nur, es zahlt auch
// selbst, wenn es sich zu fuenft auf einer Linie trifft.
//
// Die Regel steht im Vorbild so: der Hut sitzt nur auf Walze 3, ist
// selbst Wild, und verwandelt ein oder zwei Bilder, die gerade auf dem
// Feld liegen. Nachgebaut ist der Ablauf, nicht die Aufmachung — Name,
// Zeichen und Bild sind eigene.

const HUT_WALZE = 2;                 // Walze 3, von null gezaehlt
// Wie oft der Gaukler zwei Bilder zieht statt einem. Ein Drittel: so
// bleibt das zweite eine Ueberraschung und nicht die Regel.
const HUT_ZWEI = 1 / 3;

// ── Die Tafel ────────────────────────────────────────────────────
// Vielfache des LINIENeinsatzes; der ist ein Zehntel dessen, was auf der
// Leiste steht. Die Form ist die des Vorbilds: der Gaukler oben mit dem
// Doppelten des Koenigs, darunter eine flache Staffel, und unten die
// Kartenbuchstaben — A und K ueber 10, J und Q.
//
// Die Zeichen sind gemalt (bilder/hut/), die Buchstaben gesetzt. Das
// Emoji bleibt als Ersatz, falls ein Bild nicht laedt.
const HUT_SYMBOLE = [
  {k:'gaukler',    z:'🤹', name:'Der Gaukler',    bild:'bilder/hut/gaukler.jpg', wild:true,
   zahlt:{3:45, 4:125, 5:400}},
  {k:'koenig',     z:'👑', name:'Der König',      bild:'bilder/hut/koenig.jpg',  zahlt:{3:20, 4:60, 5:200}},
  {k:'prinzessin', z:'👸', name:'Die Prinzessin', bild:'bilder/hut/prinzessin.jpg', zahlt:{3:12, 4:30, 5:100}},
  {k:'falke',      z:'🦅', name:'Der Falke',      bild:'bilder/hut/falke.jpg',   zahlt:{3:8, 4:20, 5:50}},
  {k:'ross',       z:'🐎', name:'Das Streitross', bild:'bilder/hut/ross.jpg',    zahlt:{3:8, 4:20, 5:50}},
  {k:'hund',       z:'🐕', name:'Der Jagdhund',   bild:'bilder/hut/hund.jpg',    zahlt:{3:8, 4:20, 5:50}},
  {k:'a',          z:'A',  name:'A',  karte:'A',  zahlt:{3:4, 4:10, 5:30}},
  {k:'k',          z:'K',  name:'K',  karte:'K',  zahlt:{3:4, 4:10, 5:30}},
  {k:'zehn',       z:'10', name:'10', karte:'10', zahlt:{3:2, 4:8, 5:25}},
  {k:'j',          z:'J',  name:'J',  karte:'J',  zahlt:{3:2, 4:8, 5:25}},
  {k:'q',          z:'Q',  name:'Q',  karte:'Q',  zahlt:{3:2, 4:8, 5:25}},
  // Der Hut ersetzt jedes Zeichen, zahlt aber selbst nichts — er ist der
  // Anlass, nicht der Gewinn.
  {k:'hut',        z:'🎩', name:'Der Hut', bild:'bilder/hut/hut.jpg', wild:true, nurWalze:HUT_WALZE},
];

// ── Die Baender ──────────────────────────────────────────────────
// Zwei Sorten: der Hut liegt nur auf Walze 3. Drei Huete auf sechzig
// Plaetzen, gleichmaessig verteilt — zwei liegen also nie im selben
// Fenster, und er zeigt sich etwa jede siebte Drehung (3 × 3 / 60).
const HUT_BANDLAENGE = 60;
const HUT_AUSSEN = {
  gaukler: 3, koenig: 2, prinzessin: 3, falke: 4, ross: 4, hund: 4,
  a: 6, k: 7, zehn: 9, j: 9, q: 9,
};
const HUT_MITTE = {
  gaukler: 3, koenig: 2, prinzessin: 3, falke: 4, ross: 4, hund: 4,
  a: 6, k: 7, zehn: 8, j: 8, q: 8, hut: 3,
};
const HUT_BAENDER = [0, 1, 2, 3, 4].map(w => wBandAusAnzahlen(
  w === HUT_WALZE ? HUT_MITTE : HUT_AUSSEN, HUT_BANDLAENGE, w * 0.2 + 0.05));

// ── Der Hut ──────────────────────────────────────────────────────
// Wo er liegt — und er liegt, wenn, dann einmal: die Baender lassen
// keine zwei in ein Fenster.
const hutWo = (feld) => {
  for (let z = 0; z < W_REIHEN; z++) {
    const i = z * W_WALZEN + HUT_WALZE;
    if (feld[i] === 'hut') return i;
  }
  return -1;
};

// Was der Gaukler aus dem Hut zieht: ein Bild, das gerade auf dem Feld
// liegt — eines, das nicht dort liegt, zu verwandeln, verwandelte
// nichts. Der Gaukler selbst und der Hut kommen nicht in Frage; die sind
// schon Wild.
//
// Die Wahl haengt nicht an den Auszahlungen, nur an dem, was daliegt.
// Das muss so sein: sonst stimmte die gemessene Haeufigkeitstafel
// nicht mehr, sobald die Spielleitung eine Zahl verstellt.
const hutWahl = (feld, symbole, zufall) => {
  const r = zufall || Math.random;
  // In der Reihenfolge der Tafel und nicht in der des Feldes: so zieht
  // derselbe Zufall bei demselben Feld dasselbe Bild, und das laesst
  // sich pruefen.
  const da = symbole.filter(s => s.zahlt && !s.wild && feld.includes(s.k)).map(s => s.k);
  const wieviele = Math.min(da.length, r() < HUT_ZWEI ? 2 : 1);
  const raus = [];
  while (raus.length < wieviele) {
    const rest = da.filter(k => !raus.includes(k));
    raus.push(rest[Math.floor(r() * rest.length)]);
  }
  return raus;
};

// Jedes Zeichen der gezogenen Bilder wird zum Gaukler — alle, nicht nur
// eines, und auf jeder Walze.
const hutZaubern = (feld, gezogen) => {
  if (!gezogen || !gezogen.length) return feld;
  return feld.map(k => gezogen.includes(k) ? 'gaukler' : k);
};

// ── Ein Dreh ─────────────────────────────────────────────────────
// Erst der Hut, dann die Wertung auf dem verwandelten Feld. Was sich
// verwandelt hat, kommt mit — der Tisch zeigt es als eigenen Schritt.
const hutDreh = (feld, symbole, einsatz, zufall) => {
  const hut = hutWo(feld);
  const gezogen = hut >= 0 ? hutWahl(feld, symbole, zufall) : [];
  const bild = hutZaubern(feld, gezogen);
  const verwandelt = [];
  for (let i = 0; i < W_FELDER; i++) if (bild[i] !== feld[i]) verwandelt.push(i);
  const e = wWerten(bild, symbole, einsatz);
  return {feld: bild, roh: feld, gewinn: e.gewinn, treffer: e.treffer, streu: e.streu,
          hut, gezogen, verwandelt};
};

// ── Die Rechnung ─────────────────────────────────────────────────
// Keine Freispiele, also kein freiLauf: gemessen wird das verwandelte
// Feld, so wie es gewertet wird. Dazu, fuer die Tafel, wie oft der Hut
// kam und wie oft er zwei Bilder zog.
const hutMessen = (symbole, baender, drehungen, zufall) => {
  const r = zufall || Math.random;
  const z = wZaehler();
  z.hut = 0; z.zwei = 0;
  for (let i = 0; i < drehungen; i++) {
    const feld = wZiehen(baender, r);
    const gezogen = hutWo(feld) >= 0 ? hutWahl(feld, symbole, r) : null;
    if (gezogen) { z.hut++; if (gezogen.length > 1) z.zwei++; }
    wZaehlen(z, hutZaubern(feld, gezogen), symbole);
    z.drehungen++;
  }
  return z;
};

// ── Die gemessene Tafel ──────────────────────────────────────────
// Einmal in der Werkbank gemessen, hier als Konstante; der Browser
// rechnet daraus nur noch das Skalarprodukt. Wer die Baender aendert,
// muss neu messen — wer die Auszahlungen aendert, nicht.
// Gemessen mit 10.000.000 stillen Drehungen; die Zahlen sind Treffer je
// Drehung. Der Hut kam jede 6,7. Drehung, und in einem Drittel davon zog
// er zwei Bilder. Ohne ihn zahlten dieselben Baender 26,6 % — der Hut
// traegt also gut zwei Drittel der Quote, so wie bei den anderen dreien
// die Freispielrunde fast die Haelfte.
const HUT_HAEUFIGKEIT = {
  drehungen: 1,
  linie: {
    a: {3:0.05037, 4:0.01198, 5:0.005263},
    falke: {3:0.02922, 4:0.006667, 5:0.003588},
    gaukler: {3:0.02556, 4:0.007115, 5:0.002973},
    hund: {3:0.02865, 4:0.006437, 5:0.003478},
    j: {3:0.09099, 4:0.02447, 5:0.01159},
    k: {3:0.06963, 4:0.01853, 5:0.00914},
    koenig: {3:0.01452, 4:0.00415, 5:0.002002},
    prinzessin: {3:0.01818, 4:0.003774, 5:0.001952},
    q: {3:0.09673, 4:0.02769, 5:0.01399},
    ross: {3:0.02683, 4:0.005757, 5:0.003063},
    zehn: {3:0.09316, 4:0.02559, 5:0.01236},
  },
  streu: {},
};

// ── Der Takt des Zaubers ─────────────────────────────────────────
// Was nach dem Halt der Walzen geschieht, in Millisekunden ab dem Hebel.
// Die Walzen stehen nach 1600 (W_DAUER); dann wackelt der Hut, ein Bild
// nach dem anderen steigt heraus, und zuletzt kippen die Felder um —
// Walze fuer Walze, von links. Alles davon ist Anzeige: gebucht ist
// laengst, und wer Bewegung abgeschaltet hat, sieht gleich das Ende.
const HUT_TAKT = {wackeln: 1650, bild: 2200, bildAbstand: 550, wandelPause: 200,
                  walzenVersatz: 70, kippen: 680};
const hutZeitplan = (gezogen) => {
  const n = (gezogen && gezogen.length) || 0;
  const wandel = HUT_TAKT.bild + n * HUT_TAKT.bildAbstand + HUT_TAKT.wandelPause;
  return {wackeln: HUT_TAKT.wackeln, bild: HUT_TAKT.bild, bildAbstand: HUT_TAKT.bildAbstand,
          wandel, walzenVersatz: HUT_TAKT.walzenVersatz,
          ende: wandel + (W_WALZEN - 1) * HUT_TAKT.walzenVersatz + HUT_TAKT.kippen + 120};
};

// ── Der Tisch ────────────────────────────────────────────────────
const HutTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const symbole = React.useMemo(() => wSymboleAus(HUT_SYMBOLE, cfg && cfg.hutSymbole), [cfg]);
  // Im Vorlauf der Baender soll der Hut nur dort vorbeiziehen, wo er
  // auch liegen kann — sonst saehe man ihn auf Walze 1 vorbeifliegen.
  const vorlauf = React.useMemo(() => [0,1,2,3,4].map(w =>
    symbole.filter(s => s.nurWalze === undefined || s.nurWalze === w)), [symbole]);
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const [einsatz, setEinsatz] = React.useState(() => einsaetze[Math.min(1, einsaetze.length - 1)]);
  const [baender, setBaender] = React.useState(() => {
    const feld = wZiehen(HUT_BAENDER, Math.random);
    return [0,1,2,3,4].map(w => wBandBauen(feld, w, vorlauf[w], Math.random));
  });
  const [dreh, setDreh] = React.useState(0);
  const [ergebnis, setErgebnis] = React.useState(null);
  // Was gerade laeuft, fuer die Anzeige des Zaubers — gebucht ist es schon.
  const [unterwegs, setUnterwegs] = React.useState(null);
  const [riskierbar, setRiskierbar] = React.useState(0);
  const [risiko, setRisiko] = React.useState(null);

  const {laeuft, starten} = useWalzenLauf();
  const zeigeLinie = useLinienWechsel(ergebnis && ergebnis.treffer);
  const zaehler = useHochzaehler(ergebnis ? Math.round(ergebnis.gewinn) : 0);

  React.useEffect(() => { if (onLaeuft) onLaeuft(laeuft); }, [laeuft]);
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  const quote = React.useMemo(() => wQuote(HUT_HAEUFIGKEIT, symbole), [symbole]);
  const kannDrehen = !laeuft && !risiko && marken >= einsatz;

  const drehen = () => {
    if (!kannDrehen) return;
    const e = hutDreh(wZiehen(HUT_BAENDER, Math.random), symbole, einsatz, Math.random);
    const gewinn = Math.round(e.gewinn);

    // Der Einsatz geht sofort, der Gewinn beim Halt (useWalzenLauf) —
    // sonst verriete die Kasse den Ausgang, bevor die Walzen stehen.
    zahlen(-einsatz);

    setBaender([0,1,2,3,4].map(w => wBandBauen(e.feld, w, vorlauf[w], Math.random)));
    setErgebnis(null); setRiskierbar(0); setRisiko(null);
    setUnterwegs(e);
    setDreh(d => d + 1);

    // Mit Hut dauert der Lauf, bis das letzte Feld umgekippt ist.
    starten(() => {
      zahlen(gewinn);
      setErgebnis({...e, gewinn});
      setRiskierbar(gewinn);
    }, e.hut >= 0 ? hutZeitplan(e.gezogen).ende : undefined);
  };

  // Was der Autolauf als Naechstes tut — und ob es etwas kostet.
  const weiter = (darfZahlen) => {
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

  // Welcher Zauber gezeigt wird: waehrend des Laufs der unterwegs,
  // danach der des Ergebnisses — dann ohne Zeitplan, nur als Markierung.
  const zauber = laeuft ? unterwegs : ergebnis;
  const wandel = React.useMemo(() => {
    if (!zauber || zauber.hut < 0) return null;
    const felder = {};
    zauber.verwandelt.forEach(i => { felder[i] = zauber.roh[i]; });
    return {felder, hut: zauber.hut, aus: zauber.gezogen, zeit: hutZeitplan(zauber.gezogen)};
  }, [zauber]);

  const leuchtet = laeuft ? new Set() : wLeuchtet(ergebnis, zeigeLinie);
  const bildName = (k) => { const s = wSymbol(k, symbole); return s ? s.name : k; };
  const gezogenText = (e) => e.gezogen.map(bildName).join(' und ');

  return (
    <>
      {risiko && (
        <RisikoFenster risiko={risiko} setRisiko={setRisiko}
          onNehmen={(b)=>{ zahlen(b); setRisiko(null); }}
          onSchliessen={()=>setRisiko(null)} />
      )}

      <div className="automat-mitte aut-mitte">
        <div className="automat-kasten walzen-kasten hut-kasten">
          <WalzenSchirm baender={baender} symbole={symbole} dreh={dreh}
            laeuft={laeuft} leuchtet={leuchtet} wandel={wandel}
            art={laeuft && wandel ? 'zaubert' : ''} />

          <div className="automat-meldung" aria-live="polite">
            {laeuft ? (
              wandel ? (
                // Die Ansage kommt, wenn der Hut zu wackeln beginnt — nicht
                // vorher, sonst verriete sie ihn, solange die Walzen laufen.
                <span className="hut-ansage" style={{animationDelay: wandel.zeit.wackeln + 'ms'}}>
                  🎩 Der Hut wackelt …
                  <b style={{animationDelay: wandel.zeit.bild + 'ms'}}> {gezogenText(unterwegs)}!</b>
                </span>
              ) : <span className="leise">…</span>
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
              <span className="leise">{ergebnis.hut >= 0 ? 'Der Zauber verpufft.' : 'Nichts. Nochmal.'}</span>
            )}
            {ergebnis && !laeuft && ergebnis.hut >= 0 && (
              <span className="freidreh">🎩 {gezogenText(ergebnis)} → Gaukler
                {' '}({ergebnis.verwandelt.length} {ergebnis.verwandelt.length === 1 ? 'Feld' : 'Felder'})</span>
            )}
          </div>

          <div className="automat-einsatz">
            <span className="automat-label">Einsatz</span>
            {einsaetze.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                disabled={!!lauf.auto} onClick={()=>setEinsatz(n)}>{n}</button>
            ))}
          </div>

          <button className="automat-hebel" disabled={!kannDrehen || !!lauf.auto} onClick={drehen}>
            {laeuft ? 'Läuft…' : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig im Beutel'}
          </button>

          <AutolaufLeiste lauf={lauf} gesperrt={!kannDrehen} />

          {riskierbar > 0 && !laeuft && !risiko && !lauf.auto && (
            <div className="risiko-angebot">
              <span className="risiko-angebot-text">{riskierbar} setzen?</span>
              <button className="risiko-knopf" onClick={()=>risikoStarten('leiter')}>🪜 Leiter</button>
              <button className="risiko-knopf" onClick={()=>risikoStarten('karte')}>🂠 Rabe oder Rose</button>
            </div>
          )}
        </div>

        <WalzenTafel symbole={symbole} quote={quote} kinder={
          <p className="automat-fussnote">
            <b>Der Hut</b> — er liegt nur auf der mittleren Walze und ersetzt dort
            jedes Zeichen. Fällt er, zieht der Gaukler ein Bild aus ihm heraus,
            manchmal zwei — eines, das gerade auf dem Feld liegt. Jedes Zeichen
            dieses Bildes wird zum Gaukler, auf allen Walzen, und der Gaukler
            ersetzt nicht nur, er zahlt auch selbst am meisten. Freispiele gibt
            es keine: der Zauber fällt im gewöhnlichen Dreh, etwa jedes siebte Mal.
          </p>
        } />
      </div>
    </>
  );
};

// ── Alle Walzenautomaten, fuer die Einstellungen ─────────────────
// Welche Tafel wohin gespeichert wird und woraus die Quote gerechnet
// wird. Name und Zeichen kommen aus TAVERNEN_TISCHE. Steht hier und nicht
// in 2f7, weil es die Tafeln aller vier braucht — und das ist die
// letzte der vier Dateien.
const WALZEN_AUTOMATEN = [
  {k:'buch',  feld:'buchSymbole',  symbole:BUCH_SYMBOLE,  haeufigkeit:BUCH_HAEUFIGKEIT},
  {k:'arena', feld:'arenaSymbole', symbole:ARENA_SYMBOLE, haeufigkeit:ARENA_HAEUFIGKEIT},
  {k:'auge',  feld:'augeSymbole',  symbole:AUGE_SYMBOLE,  haeufigkeit:AUGE_HAEUFIGKEIT},
  {k:'hut',   feld:'hutSymbole',   symbole:HUT_SYMBOLE,   haeufigkeit:HUT_HAEUFIGKEIT},
];
