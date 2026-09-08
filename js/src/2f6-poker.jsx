// Heldenbuch — Ultimate Texas Hold'em, der sechste Tisch der Taverne.
//
// Poker gegen die Bank, nicht gegeneinander: am Heldenbuch sitzt selten
// die ganze Runde gleichzeitig vor demselben Gerät, und ein Pokerspiel,
// bei dem man aufeinander warten muss, wird nie gespielt.
//
// Von den Spielarten, die es in echten Häusern gibt, ist dies die mit
// dem kleinsten Hausanteil — 2,19 % je Ante, und weil man im Schnitt
// weit mehr als die Ante setzt, nur 0,53 % je gesetztem Stück. Bezahlt
// wird das mit Entscheidungen: der Einsatz wird nicht kleiner, je
// länger man wartet, sondern die Erhöhung. Wer vorm Flop erhöht, zahlt
// das Vierfache; wer bis zum River wartet, nur noch das Einfache. Das
// ist das ganze Spiel: früh setzen, wenn das Blatt es hergibt.
//
// Der Tisch bekommt marken und zahlen von der Taverne gereicht und
// weiß nichts davon, wo der Beutel liegt.

const PK_TAKT   = 380;   // zwischen zwei Karten
const PK_ZEIGEN = 800;   // bevor aufgedeckt und abgerechnet wird

const PK_RANG = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,
                 'B':11,'D':12,'K':13,'A':14};
const PK_BLATT = ['2','3','4','5','6','7','8','9','10','B','D','K','A'];

// Ein frisches Blatt je Hand — so wird es am Tisch auch gemacht, und
// ein Schlitten hätte hier nichts zu tun: es liegen nie mehr als elf
// Karten gleichzeitig auf dem Tuch.
const pkNeuesBlatt = () => {
  const k = [];
  for (const f of BJ_FARBEN)
    for (const w of PK_BLATT) k.push({w, f: f.z, rot: f.rot});
  for (let i = k.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = k[i]; k[i] = k[j]; k[j] = t;
  }
  return k;
};

// ── Was ein Blatt wert ist ──────────────────────────────────────
// Aus fünf bis sieben Karten die beste Hand, als Liste von Zahlen:
// erst die Kategorie, dann die Werte, die bei Gleichstand entscheiden.
// Zwei Blätter vergleicht man dann Stelle für Stelle — deshalb muss
// jede Kategorie immer gleich viele Stellen liefern.
const PK_NAMEN = ['Höchste Karte', 'Ein Paar', 'Zwei Paare', 'Drilling',
                  'Straße', 'Flush', 'Full House', 'Vierling',
                  'Straight Flush', 'Royal Flush'];

const pkWert = (karten) => {
  const w = karten.map(k => PK_RANG[k.w]);
  const nachFarbe = {};
  karten.forEach((k, i) => { (nachFarbe[k.f] = nachFarbe[k.f] || []).push(w[i]); });
  const anzahl = {};
  w.forEach(x => { anzahl[x] = (anzahl[x] || 0) + 1; });

  const runter = (xs) => [...new Set(xs)].sort((a, b) => b - a);
  // Die höchste Karte einer Straße, oder 0. Das Ass läuft auch unten:
  // A-2-3-4-5 ist eine Straße, und ihre höchste Karte ist die Fünf.
  const strasse = (xs) => {
    const u = runter(xs);
    if (u[0] === 14) u.push(1);
    let lauf = 1;
    for (let i = 1; i < u.length; i++) {
      if (u[i] === u[i - 1] - 1) { if (++lauf >= 5) return u[i] + 4; }
      else lauf = 1;
    }
    return 0;
  };

  const flushFarbe = Object.keys(nachFarbe).find(f => nachFarbe[f].length >= 5);
  if (flushFarbe) {
    const sf = strasse(nachFarbe[flushFarbe]);
    if (sf) return [sf === 14 ? 9 : 8, sf, 0, 0, 0, 0];
  }
  // Nach Häufigkeit, bei gleicher Häufigkeit nach Wert.
  const gruppen = Object.keys(anzahl).map(Number)
    .sort((a, b) => anzahl[b] - anzahl[a] || b - a);
  const n = (x) => anzahl[x];
  const ohne = (...weg) => runter(w.filter(x => !weg.includes(x)));

  if (n(gruppen[0]) === 4) return [7, gruppen[0], ohne(gruppen[0])[0], 0, 0, 0];
  if (n(gruppen[0]) === 3 && n(gruppen[1]) >= 2) return [6, gruppen[0], gruppen[1], 0, 0, 0];
  if (flushFarbe) return [5, ...runter(nachFarbe[flushFarbe]).slice(0, 5)];
  const st = strasse(w);
  if (st) return [4, st, 0, 0, 0, 0];
  if (n(gruppen[0]) === 3) return [3, gruppen[0], ...ohne(gruppen[0]).slice(0, 2), 0, 0];
  const paare = gruppen.filter(x => n(x) === 2);
  if (paare.length >= 2) return [2, paare[0], paare[1], ohne(paare[0], paare[1])[0], 0, 0];
  if (paare.length === 1) return [1, paare[0], ...ohne(paare[0]).slice(0, 3), 0];
  return [0, ...runter(w).slice(0, 5)];
};

// −1, 0, +1 — wie ein Vergleich sich gehört.
const pkVergleich = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
};

// ── Was das Haus zahlt ──────────────────────────────────────────
// Die Blindwette gewinnt nur mit dem Blatt, nicht gegen den Geber:
// wer eine Straße oder mehr hält und die Hand gewinnt, bekommt sie
// bezahlt; darunter bleibt sie liegen, wie sie liegt.
const PK_BLIND = {9: 500, 8: 50, 7: 10, 6: 3, 5: 1.5, 4: 1};
const PK_BLIND_ZEILEN = [
  ['Royal Flush', '500:1'], ['Straight Flush', '50:1'], ['Vierling', '10:1'],
  ['Full House', '3:1'], ['Flush', '3:2'], ['Straße', '1:1'],
];
// Die Trips zahlt nach dem eigenen Blatt allein — auch wenn man passt
// und auch, wenn der Geber gewinnt.
// Die Tabelle, die in den meisten Haeusern haengt. Sie ist die
// mildeste der gebraeuchlichen — was sie kostet, steht unten und wird
// ausgerechnet, nicht abgeschrieben.
const PK_TRIPS = {9: 50, 8: 40, 7: 30, 6: 9, 5: 7, 4: 4, 3: 3};
const PK_TRIPS_ZEILEN = [
  ['Royal Flush', '50:1'], ['Straight Flush', '40:1'], ['Vierling', '30:1'],
  ['Full House', '9:1'], ['Flush', '7:1'], ['Straße', '4:1'], ['Drilling', '3:1'],
];
// Wie oft jede Kategorie unter sieben Karten vorkommt — die Zahlen sind
// abzählbar und stehen deshalb als Zahlen da, nicht als Schätzung.
// Zusammen sind es die 133.784.560 Blätter aus 52 Karten.
const PK_HAEUFIG = {9: 4324, 8: 37260, 7: 224848, 6: 3473184,
                    5: 4047644, 4: 6180020, 3: 6461620};
const PK_ALLE_BLAETTER = 133784560;
// Der Hausanteil der Trips, ausgerechnet statt abgeschrieben: so kann
// er nicht von der Tafel abweichen, auf der er steht.
const pkTripsAnteil = () => {
  let zurueck = 0;
  for (const k of Object.keys(PK_TRIPS))
    zurueck += (PK_HAEUFIG[k] / PK_ALLE_BLAETTER) * (PK_TRIPS[k] + 1);
  return 1 - zurueck;
};

// ── Die Tafel ───────────────────────────────────────────────────
// Vor dem Flop nach der Tabelle, die überall gedruckt steht: jedes Paar
// ab Dreien, jedes Ass, König ab 5 (jeder König, wenn beide dieselbe
// Farbe haben), Dame ab 8 (ab 6 in einer Farbe), Bube-Zehn und
// Bube-8/9 in einer Farbe. Alles andere: schieben und abwarten.
const pkRat4 = (hand) => {
  const [a, b] = hand.map(k => PK_RANG[k.w]);
  const hoch = Math.max(a, b), tief = Math.min(a, b);
  const gleich = hand[0].f === hand[1].f;
  if (a === b) return a >= 3;
  if (hoch === 14) return true;
  if (hoch === 13) return gleich ? true : tief >= 5;
  if (hoch === 12) return gleich ? tief >= 6 : tief >= 8;
  if (hoch === 11) return gleich ? tief >= 8 : tief === 10;
  return false;
};

// Nach dem Flop: zwei Paare oder besser, ein verdecktes Paar (eines,
// das mindestens eine eigene Karte benutzt), oder vier zu einem Flush
// mit einer eigenen Zehn oder höher darin.
const pkRat2 = (hand, flop) => {
  const alle = [...hand, ...flop];
  const wert = pkWert(alle);
  if (wert[0] >= 2) return true;
  if (wert[0] === 1) {
    // Ein Paar zählt nur, wenn es nicht allein auf dem Tisch liegt.
    const paar = wert[1];
    if (hand.some(k => PK_RANG[k.w] === paar)) return true;
  }
  for (const f of BJ_FARBEN) {
    const eigene = hand.filter(k => k.f === f.z);
    const zahl = alle.filter(k => k.f === f.z).length;
    if (zahl === 4 && eigene.some(k => PK_RANG[k.w] >= 10)) return true;
  }
  return false;
};

// Am River wird nicht geschätzt, sondern gezählt. Es sind 45 Karten
// übrig und damit 990 Blätter, die der Geber haben kann — die rechnen
// wir alle durch und vergleichen, was das Erhöhen einbringt, mit dem,
// was das Passen kostet. Eine Faustregel wäre schneller; sie wäre auch
// falscher, und die Rechnung dauert keine zehn Millisekunden.
const pkRat1 = (hand, tisch) => {
  const gesehen = new Set([...hand, ...tisch].map(k => k.w + k.f));
  const rest = [];
  for (const f of BJ_FARBEN)
    for (const w of PK_BLATT)
      if (!gesehen.has(w + f.z)) rest.push({w, f: f.z, rot: f.rot});
  const meins = pkWert([...hand, ...tisch]);
  const blind = PK_BLIND[meins[0]] || 0;
  let summe = 0, faelle = 0;
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const seins = pkWert([rest[i], rest[j], ...tisch]);
      const v = pkVergleich(meins, seins);
      faelle++;
      if (v === 0) continue;                       // alles steht
      if (v < 0) { summe -= (seins[0] >= 1 ? 3 : 2); continue; }
      summe += 1 + blind + (seins[0] >= 1 ? 1 : 0);
    }
  }
  // Passen kostet Ante und Blind, ohne Wenn und Aber.
  return (summe / faelle) > -2;
};

const pkPasstNicht = (blatt) => blatt[0] < 4;   // unter einer Straße zahlt die Blind nicht

const PokerTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const [einsatz, setEinsatz] = React.useState(() => einsaetze[0] || 5);
  const [mitTrips, setMitTrips] = React.useState(false);
  const [phase, setPhase] = React.useState('wette');  // wette|vorflop|flop|river|aus
  const [blatt, setBlatt] = React.useState([]);       // der Rest des Decks
  const [hand, setHand] = React.useState([]);
  const [geber, setGeber] = React.useState([]);
  const [tisch, setTisch] = React.useState([]);       // die fünf in der Mitte
  const [offen, setOffen] = React.useState(0);        // wie viele davon liegen
  const [spiel, setSpiel] = React.useState(0);        // die Erhöhung, in Marken
  const [zeigt, setZeigt] = React.useState(false);    // liegen die Karten des Gebers?
  const [abrechnung, setAbrechnung] = React.useState(null);
  const [meldung, setMeldung] = React.useState('Ante und Blind kosten dasselbe.');
  const [wirtWort, wirtSagen] = useWirt('poker');
  const [tafel, setTafelRoh] = React.useState(tafelLesen);
  const setTafel = (an) => { setTafelRoh(an); tafelSchreiben(an); };
  const [gibt, setGibt] = React.useState(false);
  const lebt = React.useRef(true);
  React.useEffect(() => () => { lebt.current = false; }, []);
  const warte = (ms) => new Promise(r => setTimeout(r, ms));

  React.useEffect(() => { if (onLaeuft) onLaeuft(phase !== 'wette' || gibt); }, [phase, gibt]);
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  // Was schon auf dem Tuch liegt, gehört nicht mehr dem Beutel — auch
  // dann nicht, wenn die Einsatzleiter sich zwischendurch ändert.
  const tripsGesetzt = React.useRef(0);
  const anteGesetzt  = React.useRef(0);

  const trips = mitTrips ? einsatz : 0;
  const grund = einsatz * 2 + trips;             // Ante, Blind und die Trips
  const imSpiel = phase === 'wette' ? 0
    : anteGesetzt.current * 2 + tripsGesetzt.current + spiel;

  const geben = async () => {
    if (gibt || phase !== 'wette') return;
    if (grund > marken) { setMeldung('Ante, Blind und Trips zusammen liegen nicht im Beutel.'); return; }
    const d = pkNeuesBlatt();
    const meine = [d[0], d[1]], seine = [d[2], d[3]];
    const mitte = [d[4], d[5], d[6], d[7], d[8]];
    zahlen(-grund);
    anteGesetzt.current = einsatz;
    tripsGesetzt.current = trips;
    setBlatt(d); setHand([]); setGeber(seine); setTisch(mitte);
    setOffen(0); setSpiel(0); setZeigt(false); setAbrechnung(null);
    setGibt(true); setMeldung('');
    wirtSagen(null);

    setHand([meine[0]]);
    await warte(PK_TAKT); if (!lebt.current) return;
    setHand(meine);
    await warte(PK_TAKT); if (!lebt.current) return;
    setGibt(false);
    setPhase('vorflop');
  };

  // Erhöhen. Vor dem Flop das Drei- oder Vierfache, nach dem Flop das
  // Doppelte, am River das Einfache — und danach ist die Hand vorbei,
  // denn mehr gibt es nicht zu entscheiden.
  const erhoehen = async (faktor) => {
    if (gibt) return;
    const betrag = einsatz * faktor;
    if (betrag > marken) { setMeldung('So viel liegt nicht mehr im Beutel.'); return; }
    zahlen(-betrag);
    setSpiel(betrag);
    setMeldung('');
    await aufdecken(5, betrag);
  };

  const schieben = async () => {
    if (gibt) return;
    setGibt(true);
    if (phase === 'vorflop') {
      await zeigen(3); if (!lebt.current) return;
      setGibt(false); setPhase('flop');
    } else {
      await zeigen(5); if (!lebt.current) return;
      setGibt(false); setPhase('river');
    }
  };

  const passen = async () => {
    if (gibt) return;
    setGibt(true);
    await zeigen(5); if (!lebt.current) return;
    await warte(PK_ZEIGEN); if (!lebt.current) return;
    setZeigt(true);
    await warte(PK_ZEIGEN); if (!lebt.current) return;
    setGibt(false);
    abrechnen(0, true);
  };

  // Die Karten der Mitte kommen einzeln — sonst liegt der Flop da, bevor
  // man hingesehen hat.
  const zeigen = async (bis) => {
    for (let i = offen; i < bis; i++) {
      setOffen(i + 1);
      await warte(PK_TAKT);
      if (!lebt.current) return;
    }
  };

  const aufdecken = async (bis, betrag) => {
    setGibt(true);
    await zeigen(bis); if (!lebt.current) return;
    await warte(PK_ZEIGEN); if (!lebt.current) return;
    setZeigt(true);
    await warte(PK_ZEIGEN); if (!lebt.current) return;
    setGibt(false);
    abrechnen(betrag, false);
  };

  const abrechnen = (spielBetrag, gepasst) => {
    const ante = anteGesetzt.current, blindSatz = ante, tripsSatz = tripsGesetzt.current;
    const meins = pkWert([...hand, ...tisch]);
    const seins = pkWert([...geber, ...tisch]);
    const oeffnet = seins[0] >= 1;             // ein Paar reicht dem Geber zum Mitspielen
    const zeilen = [];
    let aus = 0;

    if (gepasst) {
      zeilen.push({text: 'Gepasst — Ante und Blind bleiben liegen', wert: -(ante + blindSatz)});
    } else {
      const v = pkVergleich(meins, seins);
      if (v > 0) {
        // Die Ante steht nur, wenn der Geber überhaupt mitspielt.
        if (oeffnet) { aus += ante * 2; zeilen.push({text: 'Ante gewinnt', wert: ante}); }
        else { aus += ante; zeilen.push({text: 'Der Geber öffnet nicht — Ante steht', wert: 0}); }
        aus += spielBetrag * 2;
        zeilen.push({text: 'Spiel gewinnt', wert: spielBetrag});
        const q = PK_BLIND[meins[0]] || 0;
        if (q) {
          aus += blindSatz + Math.round(blindSatz * q);
          zeilen.push({text: 'Blind zahlt ' + PK_NAMEN[meins[0]], wert: Math.round(blindSatz * q)});
        } else {
          aus += blindSatz;
          zeilen.push({text: 'Blind steht — unter einer Straße zahlt sie nicht', wert: 0});
        }
      } else if (v === 0) {
        aus += ante + blindSatz + spielBetrag;
        zeilen.push({text: 'Gleichstand — alles steht', wert: 0});
      } else {
        if (!oeffnet) { aus += ante; zeilen.push({text: 'Der Geber öffnet nicht — Ante steht', wert: 0}); }
        else zeilen.push({text: 'Ante verliert', wert: -ante});
        zeilen.push({text: 'Blind und Spiel verlieren', wert: -(blindSatz + spielBetrag)});
      }
    }

    if (tripsSatz > 0) {
      const q = PK_TRIPS[meins[0]] || 0;
      if (q) {
        aus += tripsSatz + Math.round(tripsSatz * q);
        zeilen.push({text: 'Trips: ' + PK_NAMEN[meins[0]], wert: Math.round(tripsSatz * q)});
      } else {
        zeilen.push({text: 'Trips verfällt', wert: -tripsSatz});
      }
    }

    if (aus > 0) zahlen(aus);
    const gesetzt = ante + blindSatz + spielBetrag + tripsSatz;
    setAbrechnung({zeilen, meins, seins, oeffnet, aus, gesetzt, gepasst});
    wirtSagen({
      fall: gepasst ? null
        : meins[0] >= 8 ? 'straightflush'
        : meins[0] >= 6 ? 'grossesBlatt'
        : (!gepasst && pkVergleich(meins, seins) === 0) ? 'stand'
        : !oeffnet ? 'oeffnetNicht' : null,
      aus, einsatz: gesetzt,
    });
    setPhase('aus');
  };

  const neueHand = () => {
    setPhase('wette'); setHand([]); setGeber([]); setTisch([]);
    setOffen(0); setSpiel(0); setZeigt(false); setAbrechnung(null);
    setMeldung('Ante und Blind kosten dasselbe.');
    wirtSagen(null);
  };

  // ── Was die Tafel rät ──────────────────────────────────────────
  const rat = !tafel || gibt ? null
    : phase === 'vorflop' ? (pkRat4(hand) ? 'vier' : 'schieben')
    : phase === 'flop'    ? (pkRat2(hand, tisch.slice(0, 3)) ? 'zwei' : 'schieben')
    : phase === 'river'   ? (pkRat1(hand, tisch) ? 'eins' : 'passen')
    : null;
  const RAT_WORT = {vier: 'das Vierfache setzen', zwei: 'das Doppelte setzen',
                    eins: 'das Einfache setzen', schieben: 'schieben', passen: 'passen'};

  const meinBlatt = hand.length === 2 && offen >= 3
    ? pkWert([...hand, ...tisch.slice(0, offen)]) : null;

  return (
    <div className="automat-mitte pk-mitte">

      <div className="filz pk-filz">
        <button type="button" className={'bj-tafel' + (tafel ? ' an' : '')}
          onClick={()=>setTafel(!tafel)} aria-pressed={tafel}
          title={tafel ? 'Die Tafel rät mit — abschalten' : 'Die Tafel schweigt — einschalten'}>
          🎓<i>{tafel ? 'Tafel an' : 'Tafel aus'}</i>
        </button>

        {/* Der Geber sitzt oben, wie am Tisch. */}
        <div className="pk-seite">
          <span className="pk-wer">Der Geber</span>
          <span className="pk-blatt">
            {geber.length === 0
              ? <><span className="bj-platz" /><span className="bj-platz" /></>
              : geber.map((k, i) => <BjKarte key={i} k={k} zu={!zeigt} />)}
          </span>
          <span className="pk-rang">
            {zeigt && geber.length
              ? (abrechnung && !abrechnung.oeffnet ? 'öffnet nicht'
                 : PK_NAMEN[pkWert([...geber, ...tisch])[0]])
              : ''}
          </span>
        </div>

        {/* Die Mitte. Fünf Plätze, die sich nacheinander füllen. */}
        <div className="pk-tuch">
          <span className="pk-mitte-karten">
            {[0,1,2,3,4].map(i => tisch[i] && i < offen
              ? <BjKarte key={i} k={tisch[i]} />
              : <span className="bj-platz" key={i} />)}
          </span>
          <div className="pk-druck">
            <span className="bj-druck gross">Blind zahlt bis 500 zu 1</span>
            <span className="bj-druck">Der Geber öffnet mit einem Paar</span>
            <span className="bj-druck klein">
              Vor dem Flop 4× oder 3× · nach dem Flop 2× · am River 1× oder passen
            </span>
            {/* Zwei Zahlen, weil es zwei sind: je Ante ist der Anteil
                gross, aber man setzt im Schnitt weit mehr als die Ante.
                Wer nur eine nennt, nennt die falsche. */}
            <span className="bj-druck klein">
              2,2 % ans Haus je Ante · 0,5 % je gesetztem Stück
            </span>
          </div>
        </div>

        <div className="pk-seite dran">
          <span className="pk-wer">Dein Blatt</span>
          <span className="pk-blatt">
            {hand.length === 0
              ? <><span className="bj-platz" /><span className="bj-platz" /></>
              : hand.map((k, i) => <BjKarte key={i} k={k} />)}
          </span>
          <span className="pk-rang hell">{meinBlatt ? PK_NAMEN[meinBlatt[0]] : ''}</span>
        </div>
      </div>

      {/* Was auf dem Tuch liegt, waehrend gespielt wird. In der
          Abrechnung steht es ohnehin noch einmal — dort waeren es zwei
          Listen fuer dieselbe Sache, und das Fenster wuerde laenger. */}
      {phase !== 'wette' && phase !== 'aus' && (
        <div className="pk-satz">
          <span><i>Ante</i><b>{anteGesetzt.current}</b></span>
          <span><i>Blind</i><b>{anteGesetzt.current}</b></span>
          <span className={spiel ? '' : 'leise'}><i>Spiel</i><b>{spiel || '—'}</b></span>
          {tripsGesetzt.current > 0 && (
            <span><i>Trips</i><b>{tripsGesetzt.current}</b></span>
          )}
          <span className="pk-satz-summe"><i>Im Spiel</i><b>{imSpiel}</b></span>
        </div>
      )}

      <WirtSagt spruch={wirtWort} />

      {phase === 'wette' && (
        <>
          <div className="automat-einsatz">
            <span className="automat-label">Ante</span>
            {einsaetze.map(n => (
              <button key={n} className={'automat-chip' + (einsatz === n ? ' aktiv' : '')}
                onClick={()=>setEinsatz(n)} disabled={n * 2 > marken}>{n}</button>
            ))}
          </div>
          <label className="pk-trips">
            <input type="checkbox" checked={mitTrips}
              onChange={e=>setMitTrips(e.target.checked)} />
            <span>
              <b>Trips mitsetzen</b> — zahlt nach deinem Blatt allein, auch wenn
              der Geber gewinnt. Drilling 3:1 bis Royal Flush 50:1.
              <i>{(pkTripsAnteil() * 100).toFixed(1).replace('.', ',')} % ans Haus —
                mehr als der Tisch selbst.</i>
            </span>
          </label>
          <div className="rlt-tasten">
            <button className="automat-hebel" onClick={geben} disabled={grund > marken}>
              Geben · {grund}
            </button>
          </div>
        </>
      )}

      {phase === 'vorflop' && !gibt && (
        <div className="bj-tasten">
          <button className={'bj-taste' + (rat === 'vier' ? ' haupt' : '')}
            onClick={()=>erhoehen(4)} disabled={einsatz * 4 > marken}>
            4× setzen · {einsatz * 4}
          </button>
          <button className="bj-taste" onClick={()=>erhoehen(3)}
            disabled={einsatz * 3 > marken} title="Nie besser als das Vierfache">
            3× setzen · {einsatz * 3}
          </button>
          <button className={'bj-taste' + (rat === 'schieben' ? ' haupt' : '')}
            onClick={schieben}>Schieben</button>
        </div>
      )}

      {phase === 'flop' && !gibt && (
        <div className="bj-tasten">
          <button className={'bj-taste' + (rat === 'zwei' ? ' haupt' : '')}
            onClick={()=>erhoehen(2)} disabled={einsatz * 2 > marken}>
            2× setzen · {einsatz * 2}
          </button>
          <button className={'bj-taste' + (rat === 'schieben' ? ' haupt' : '')}
            onClick={schieben}>Schieben</button>
        </div>
      )}

      {phase === 'river' && !gibt && (
        <div className="bj-tasten">
          <button className={'bj-taste' + (rat === 'eins' ? ' haupt' : '')}
            onClick={()=>erhoehen(1)} disabled={einsatz > marken}>
            1× setzen · {einsatz}
          </button>
          <button className={'bj-taste' + (rat === 'passen' ? ' haupt' : '')}
            onClick={passen}>Passen</button>
        </div>
      )}

      {phase === 'aus' && abrechnung && (
        <>
          <div className="bj-abrechnung">
            {abrechnung.zeilen.map((z, i) => (
              <div className={'bj-zeile' + (z.wert > 0 ? ' gut' : z.wert < 0 ? ' schlecht' : '')} key={i}>
                <span>{z.text}</span>
                <b>{z.wert > 0 ? '+' + z.wert : z.wert < 0 ? '−' + Math.abs(z.wert) : '±0'}</b>
              </div>
            ))}
            <div className="bj-zeile summe">
              <span>{abrechnung.aus >= abrechnung.gesetzt ? 'Gewonnen' : 'Verloren'}</span>
              <b>{abrechnung.aus - abrechnung.gesetzt >= 0 ? '+' : '−'}
                {Math.abs(abrechnung.aus - abrechnung.gesetzt)}</b>
            </div>
          </div>
          <div className="rlt-tasten">
            <button className="automat-hebel" onClick={neueHand}>Nächste Hand</button>
          </div>
        </>
      )}

      <div className={'rlt-hinweis' + (meldung ? ' wichtig' : '')}>
        {meldung || (gibt ? 'Es wird gegeben…'
          : phase === 'vorflop' ? 'Zwei Karten. Jetzt ist die Erhöhung am teuersten — und das Blatt am wenigsten bekannt.'
          : phase === 'flop' ? 'Drei liegen. Wer jetzt erhöht, zahlt das Doppelte.'
          : phase === 'river' ? 'Alle fünf liegen. Einfach setzen oder passen — mehr gibt es nicht.'
          : phase === 'aus' ? (rat ? '' : 'Der Geber deckt auf.')
          : '')}
        {rat ? ' Die Tafel rät: ' + RAT_WORT[rat] + '.' : ''}
      </div>
    </div>
  );
};
