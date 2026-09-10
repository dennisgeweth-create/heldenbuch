// Heldenbuch — Craps, der vierte Tisch der Taverne.
//
// Zwei Würfel, ein Punkt. Der erste Wurf entscheidet sofort (7 und 11
// gewinnen die Passe, 2, 3 und 12 verlieren sie) oder setzt den Punkt;
// von da an gilt nur noch die eine Frage: kommt der Punkt vor der 7?
//
// Das Besondere sind die **Odds**. Steht der Punkt, darf man hinter die
// Passe nachlegen — und dieser Teil zahlt die wahre Quote, ohne
// Hausanteil. Es ist die einzige Wette im Haus, an der das Haus nichts
// verdient, und deshalb steht sie hier auch so da.
//
// Was jede Wette kostet, steht an ihr. Die "Jede 7" ist rot: sie ist
// mit 16,7 % die teuerste des Hauses. Am Tisch sagt das niemand.

const CR_PUNKTE = [4, 5, 6, 8, 9, 10];
// Wahre Quote hinter der Passe — kein Hausanteil, deshalb exakt.
const CR_ODDS  = {4:[2,1], 10:[2,1], 5:[3,2], 9:[3,2], 6:[6,5], 8:[6,5]};
// Place zahlt schlechter als die Wahrheit; genau darin liegt der Anteil.
const CR_PLACE = {4:[9,5], 10:[9,5], 5:[7,5], 9:[7,5], 6:[7,6], 8:[7,6]};

const crLeer = () => ({
  pass:0, odds:0, dont:0, come:0, dontCome:0,
  comePunkte:{}, dontComePunkte:{}, place:{},
  feld:0, hart:{6:0, 8:0}, craps:0, sieben:0,
});
const crSumme = (w) => w.pass + w.odds + w.dont + w.come + w.dontCome + w.feld
  + w.craps + w.sieben + w.hart[6] + w.hart[8]
  + Object.values(w.comePunkte).reduce((s,x)=>s+x,0)
  + Object.values(w.dontComePunkte).reduce((s,x)=>s+x,0)
  + Object.values(w.place).reduce((s,x)=>s+x,0);

// Auszahlung inklusive Einsatz. Krumme Betraege werden abgerundet — so
// macht es der Tisch auch, wenn der Einsatz nicht zur Quote passt.
const crZahlt = (betrag, [a, b]) => betrag + Math.floor(betrag * a / b);

const crWuerfeln = () => [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];

// ── Ein Wurf, ausgewertet ────────────────────────────────────────
// Gibt die neuen Wetten, den neuen Punkt, was ausgezahlt wird und die
// Zeilen fuer die Abrechnung. Reine Rechnung, kein Zustand — deshalb
// laesst sie sich einzeln pruefen.
const crAuswerten = (wetten, punkt, a, b) => {
  const w = JSON.parse(JSON.stringify(wetten));
  const s = a + b, hart = a === b;
  const zeilen = [];
  let aus = 0;
  const gut = (name, betrag, quote) => {
    const g = crZahlt(betrag, quote);
    aus += g; zeilen.push({name, betrag, gewinn: g});
  };
  const zurueck = (name, betrag) => { aus += betrag; zeilen.push({name, betrag, gewinn: betrag}); };
  const weg = (name, betrag) => { if (betrag > 0) zeilen.push({name, betrag, gewinn: 0}); };

  // 1. Was nur einen Wurf gilt.
  if (w.feld > 0) {
    if (s === 2)       gut('Feld · die 2 zahlt doppelt', w.feld, [2,1]);
    else if (s === 12) gut('Feld · die 12 zahlt dreifach', w.feld, [3,1]);
    else if ([3,4,9,10,11].includes(s)) gut('Feld', w.feld, [1,1]);
    else weg('Feld', w.feld);
    w.feld = 0;
  }
  if (w.craps > 0) {
    if ([2,3,12].includes(s)) gut('Alle Craps', w.craps, [7,1]); else weg('Alle Craps', w.craps);
    w.craps = 0;
  }
  if (w.sieben > 0) {
    if (s === 7) gut('Jede 7', w.sieben, [4,1]); else weg('Jede 7', w.sieben);
    w.sieben = 0;
  }

  // 2. Die Hartwege. Sie bleiben liegen, bis die Zahl weich faellt
  //    oder die 7 kommt.
  [6, 8].forEach(n => {
    if (w.hart[n] <= 0) return;
    if (s === n && hart)      { gut('Hart ' + n, w.hart[n], [9,1]); w.hart[n] = 0; }
    else if (s === n || s === 7) { weg('Hart ' + n, w.hart[n]); w.hart[n] = 0; }
  });

  // 3. Come und Don't Come mit Punkt — sie werden vor der Passe
  //    abgerechnet, weil eine 7 sie alle auf einmal traegt.
  Object.keys(w.comePunkte).forEach(k => {
    const n = +k, betrag = w.comePunkte[k];
    if (!betrag) return;
    if (s === n)      { gut('Come ' + n, betrag, [1,1]); delete w.comePunkte[k]; }
    else if (s === 7) { weg('Come ' + n, betrag); delete w.comePunkte[k]; }
  });
  Object.keys(w.dontComePunkte).forEach(k => {
    const n = +k, betrag = w.dontComePunkte[k];
    if (!betrag) return;
    if (s === 7)      { gut('Don’t Come ' + n, betrag, [1,1]); delete w.dontComePunkte[k]; }
    else if (s === n) { weg('Don’t Come ' + n, betrag); delete w.dontComePunkte[k]; }
  });

  // 4. Place — auf dem ersten Wurf ruhen sie, deshalb gibt es sie dort
  //    gar nicht erst zu setzen.
  if (punkt !== null) {
    Object.keys(w.place).forEach(k => {
      const n = +k, betrag = w.place[k];
      if (!betrag) return;
      if (s === n)      { gut('Place ' + n, betrag, CR_PLACE[n]); w.place[k] = 0; }
      else if (s === 7) { weg('Place ' + n, betrag); w.place[k] = 0; }
    });
  }

  // 5. Eine frische Come-Wette verhaelt sich wie eine Passe auf diesem
  //    einen Wurf.
  if (w.come > 0) {
    if (s === 7 || s === 11)        { gut('Come', w.come, [1,1]); w.come = 0; }
    else if ([2,3,12].includes(s))  { weg('Come', w.come); w.come = 0; }
    else { w.comePunkte[s] = (w.comePunkte[s] || 0) + w.come; w.come = 0;
           zeilen.push({name:'Come nimmt die ' + s, betrag:0, gewinn:0, still:true}); }
  }
  if (w.dontCome > 0) {
    if (s === 7 || s === 11)       { weg('Don’t Come', w.dontCome); w.dontCome = 0; }
    else if (s === 2 || s === 3)   { gut('Don’t Come', w.dontCome, [1,1]); w.dontCome = 0; }
    else if (s === 12)             { zurueck('Don’t Come · Bar 12', w.dontCome); w.dontCome = 0; }
    else { w.dontComePunkte[s] = (w.dontComePunkte[s] || 0) + w.dontCome; w.dontCome = 0;
           zeilen.push({name:'Don’t Come nimmt die ' + s, betrag:0, gewinn:0, still:true}); }
  }

  // 6. Die Linien.
  let neuerPunkt = punkt;
  if (punkt === null) {
    if (s === 7 || s === 11) {
      if (w.pass > 0) { gut('Pass-Linie', w.pass, [1,1]); w.pass = 0; }
      if (w.dont > 0) { weg('Don’t Pass', w.dont); w.dont = 0; }
    } else if ([2,3,12].includes(s)) {
      if (w.pass > 0) { weg('Pass-Linie', w.pass); w.pass = 0; }
      if (w.dont > 0) {
        if (s === 12) zurueck('Don’t Pass · Bar 12', w.dont);
        else gut('Don’t Pass', w.dont, [1,1]);
        w.dont = 0;
      }
    } else neuerPunkt = s;
  } else {
    if (s === punkt) {
      if (w.pass > 0) { gut('Pass-Linie', w.pass, [1,1]); w.pass = 0; }
      if (w.odds > 0) { gut('Odds hinter der ' + punkt, w.odds, CR_ODDS[punkt]); w.odds = 0; }
      if (w.dont > 0) { weg('Don’t Pass', w.dont); w.dont = 0; }
      neuerPunkt = null;
    } else if (s === 7) {
      if (w.pass > 0) { weg('Pass-Linie', w.pass); w.pass = 0; }
      if (w.odds > 0) { weg('Odds', w.odds); w.odds = 0; }
      if (w.dont > 0) { gut('Don’t Pass', w.dont, [1,1]); w.dont = 0; }
      neuerPunkt = null;
    }
  }
  return {wetten: w, punkt: neuerPunkt, aus, zeilen, summe: s, hart};
};

const CrWuerfel = ({ n }) => {
  const lagen = {1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9]};
  return (
    <span className="cr-wuerfel" aria-label={n + ' Augen'}>
      {(lagen[n] || []).map(p => <i className={'p' + p} key={p} />)}
    </span>
  );
};

const CrapsTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  // Die Mitte zahlt am besten und kostet am meisten. Eine Runde, die
  // das nicht am Tisch haben will, raeumt sie ab.
  const mitte = !(cfg && cfg.regeln && cfg.regeln.mitte === false);
  const [jeton, setJeton] = React.useState(() => einsaetze[0] || 5);
  const [wetten, setWetten] = React.useState(crLeer);
  const [punkt, setPunkt] = React.useState(null);
  const [augen, setAugen] = React.useState(null);      // [a, b]
  const [rollt, setRollt] = React.useState(false);
  const [zeilen, setZeilen] = React.useState([]);
  const [wirtWort, wirtSagen] = useWirt('craps');
  // Der Verlauf haelt nur zehn Wuerfe; die Serie kann laenger werden.
  const serie = React.useRef(0);
  const [ruf, setRuf] = React.useState('Der erste Wurf setzt den Punkt.');
  const [meldung, setMeldung] = React.useState('');
  // Was zuletzt auf dem Tuch lag. Bei der Sieben raeumt der Tisch alles
  // ab — wer dieselbe Lage wieder aufbauen will, legt sonst ein Dutzend
  // Jetons einzeln.
  const [zuletzt, setZuletzt] = React.useState(null);
  const [verlauf, setVerlauf] = React.useState([]);
  const uhr = React.useRef(null);

  React.useEffect(() => { if (onLaeuft) onLaeuft(rollt); }, [rollt]);
  React.useEffect(() => () => clearTimeout(uhr.current), []);

  const imSpiel = crSumme(wetten);
  const kommenAus = punkt === null;
  const seitSieben = serie.current;

  const setzen = (pfad, erlaubt, name) => {
    if (rollt) return;
    if (!erlaubt) { setMeldung(name); return; }
    if (jeton > marken) { setMeldung('So viel liegt nicht mehr im Beutel.'); return; }
    zahlen(-jeton);
    setWetten(w => {
      const n = JSON.parse(JSON.stringify(w));
      pfad(n);
      return n;
    });
    setMeldung('');
  };

  // Die Odds sind gedeckelt wie am Tisch: dreifach auf die Passe.
  const oddsMax = punkt !== null ? wetten.pass * 3 : 0;

  const werfen = () => {
    if (rollt) return;
    if (!imSpiel) { setMeldung('Erst setzen, dann werfen.'); return; }
    setZuletzt(JSON.parse(JSON.stringify(wetten)));
    setRollt(true); setZeilen([]); setMeldung('');
    const [a, b] = crWuerfeln();
    // Ein kurzer Lauf, damit man die Wuerfel fallen sieht.
    let i = 0;
    const takt = setInterval(() => {
      setAugen(crWuerfeln());
      if (++i >= 6) {
        clearInterval(takt);
        setAugen([a, b]);
        const e = crAuswerten(wetten, punkt, a, b);
        if (e.aus > 0) zahlen(e.aus);
        setWetten(e.wetten); setPunkt(e.punkt);
        setZeilen(e.zeilen.filter(z => !z.still || true));
        setVerlauf(v => [{s: a + b, a, b}, ...v].slice(0, 10));
        serie.current = (a + b === 7) ? 0 : serie.current + 1;
        setRuf(
          e.punkt === null
            ? (punkt === null
                ? (e.summe === 7 || e.summe === 11 ? 'Sofort gewonnen — ' + e.summe + '.'
                   : 'Craps, ' + e.summe + '. Neuer Wurf.')
                : (e.summe === 7 ? 'Sieben raus. Der Punkt ist weg.'
                   : 'Der Punkt ' + e.summe + ' ist gefallen!'))
            : (punkt === null ? 'Punkt steht auf der ' + e.punkt
               + ' — jetzt gilt: die ' + e.punkt + ' vor der 7.'
               : e.summe + ' — weiter.'));
        // Der Wirt am Crapstisch redet ueber den Wurf, nicht ueber das
        // Geld: die Sieben nach einem Punkt und der gefallene Punkt sind
        // die beiden Augenblicke, an denen der ganze Tisch aufsieht.
        //
        // Und er sagt nichts, wenn nichts gefallen ist. Ein Wurf mit
        // stehendem Punkt entscheidet oft gar nichts — die Passe bleibt
        // liegen. Ein "kleiner Verlust" waere dann schlicht falsch.
        const fall = e.punkt === null
          ? (punkt === null
              ? (e.summe === 7 || e.summe === 11 ? 'sofort' : 'craps')
              : (e.summe === 7 ? 'siebenRaus' : 'punktGefallen'))
          : (punkt === null ? 'punktSteht' : null);
        const satz = e.zeilen.reduce((x, z) => x + (z.betrag > 0 ? z.betrag : 0), 0);
        if (fall || satz > 0) wirtSagen({fall, aus: e.aus, einsatz: satz});
        setRollt(false);
      }
    }, 90);
  };

  const allesZurueck = () => {
    // Zurueck kommt nur, was noch nicht im Spiel ist: eine Passe mit
    // Punkt bleibt liegen, so ist die Regel.
    if (rollt) return;
    let frei = wetten.feld + wetten.craps + wetten.sieben + wetten.hart[6] + wetten.hart[8]
      + wetten.come + wetten.dontCome
      + Object.values(wetten.place).reduce((s,x)=>s+x,0)
      + (punkt === null ? wetten.pass + wetten.dont : wetten.odds);
    if (!frei) { setMeldung('Nichts, was jetzt noch zurückgenommen werden dürfte.'); return; }
    zahlen(frei);
    setWetten(w => {
      const n = JSON.parse(JSON.stringify(w));
      n.feld = 0; n.craps = 0; n.sieben = 0; n.hart = {6:0, 8:0};
      n.come = 0; n.dontCome = 0; n.place = {};
      if (punkt === null) { n.pass = 0; n.dont = 0; } else n.odds = 0;
      return n;
    });
    setMeldung('');
  };

  // Noch einmal dieselbe Lage. Gelegt wird nur, was gerade fehlt — was
  // noch liegt, bleibt liegen und wird nicht verdoppelt. Und nur, was
  // jetzt auch erlaubt waere: eine Passe mit gesetztem Punkt legt man
  // nicht neu, die steht schon.
  const zuletztWieder = () => {
    if (rollt || !zuletzt) return;
    const jetzt = wetten;
    const fehlt = JSON.parse(JSON.stringify(crLeer()));
    let summe = 0;
    const nimm = (wert, hab) => { const d = Math.max(0, (wert || 0) - (hab || 0));
                                  summe += d; return d; };
    fehlt.feld    = nimm(zuletzt.feld,    jetzt.feld);
    fehlt.craps   = nimm(zuletzt.craps,   jetzt.craps);
    fehlt.sieben  = nimm(zuletzt.sieben,  jetzt.sieben);
    fehlt.hart[6] = nimm(zuletzt.hart[6], jetzt.hart[6]);
    fehlt.hart[8] = nimm(zuletzt.hart[8], jetzt.hart[8]);
    fehlt.come    = nimm(zuletzt.come,    jetzt.come);
    fehlt.dontCome = nimm(zuletzt.dontCome, jetzt.dontCome);
    Object.keys(zuletzt.place || {}).forEach(k => {
      const d = nimm(zuletzt.place[k], (jetzt.place || {})[k]);
      if (d) fehlt.place[k] = d;
    });
    // Passe und Don't nur vor dem Punkt — danach nimmt der Tisch sie
    // nicht mehr an.
    if (punkt === null) {
      fehlt.pass = nimm(zuletzt.pass, jetzt.pass);
      fehlt.dont = nimm(zuletzt.dont, jetzt.dont);
    }
    if (!summe) { setMeldung('Es liegt schon alles, was zuletzt lag.'); return; }
    if (summe > marken) {
      setMeldung('Für dieselbe Lage reicht der Beutel nicht — es fehlen '
                 + (summe - marken) + '.');
      return;
    }
    zahlen(-summe);
    setWetten(w => {
      const n = JSON.parse(JSON.stringify(w));
      n.feld += fehlt.feld; n.craps += fehlt.craps; n.sieben += fehlt.sieben;
      n.hart[6] += fehlt.hart[6]; n.hart[8] += fehlt.hart[8];
      n.come += fehlt.come; n.dontCome += fehlt.dontCome;
      n.pass += fehlt.pass; n.dont += fehlt.dont;
      Object.keys(fehlt.place).forEach(k => n.place[k] = (n.place[k] || 0) + fehlt.place[k]);
      return n;
    });
    setMeldung('Wie zuletzt gelegt — ' + summe + ' dazu.');
  };

  const kasten = (n) => {
    const place = wetten.place[n] || 0;
    const come = wetten.comePunkte[n] || 0;
    const dont = wetten.dontComePunkte[n] || 0;
    return (
      <button type="button" key={n} className={'cr-kasten' + (punkt === n ? ' punkt' : '')}
        onClick={()=>setzen(w => { w.place[n] = (w.place[n] || 0) + jeton; },
          punkt !== null, 'Place-Wetten ruhen, solange kein Punkt steht.')}
        title={'Place ' + n + ' zahlt ' + CR_PLACE[n][0] + ':' + CR_PLACE[n][1]
}>
        <b>{n}</b><i>{CR_PLACE[n][0]} : {CR_PLACE[n][1]}</i>
        {punkt === n && <span className="cr-puck">ON</span>}
        {place > 0 && <i className="cr-jeton">{place}</i>}
        {come > 0 && <i className="cr-jeton come">C{come}</i>}
        {dont > 0 && <i className="cr-jeton dont">D{dont}</i>}
      </button>
    );
  };

  return (
    <div className="automat-mitte cr-mitte">

      {/* ── Der Wurf ────────────────────────────────────────── */}
      <div className="cr-wurf">
        <CrWuerfel n={augen ? augen[0] : 0} />
        <CrWuerfel n={augen ? augen[1] : 0} />
        <span className="cr-stand">
          <b>{augen ? augen[0] + augen[1] : '—'}</b>
          <i>{ruf}</i>
        </span>
        {/* Was am Crapstisch jeder mitzaehlt: wie lange der Schuetze
            schon haelt. Die Sieben beendet jede Serie — deshalb wird
            nicht nach Wuerfen gezaehlt, sondern nach der letzten Sieben.
            Der Balken hatte hier bisher nichts stehen. */}
        <span className="cr-serie">
          <b>{seitSieben}</b>
          <i>{seitSieben === 1 ? 'Wurf seit der 7' : 'Würfe seit der 7'}</i>
        </span>
        <span className="cr-verlauf">
          {verlauf.map((v, i) => (
            <em key={i} className={v.s === 7 ? 'sieben' : ''}>{v.s}</em>
          ))}
        </span>
      </div>

      {/* ── Der Tisch ───────────────────────────────────────── */}
      <div className="filz cr-filz">
        <div className="cr-zahlen">{CR_PUNKTE.map(kasten)}</div>

        <div className="cr-reihe">
          <button type="button" className="cr-band come"
            onClick={()=>setzen(w => { w.come += jeton; }, punkt !== null,
              'Come gibt es erst, wenn der Punkt steht.')}>
            Come <i>wie die Passe, einen Wurf später</i>
            {wetten.come > 0 && <i className="cr-jeton">{wetten.come}</i>}
          </button>
          <button type="button" className="cr-band dont schmal"
            onClick={()=>setzen(w => { w.dontCome += jeton; }, punkt !== null,
              'Don’t Come gibt es erst, wenn der Punkt steht.')}>
            Don’t Come <i>Bar 12</i>
            {wetten.dontCome > 0 && <i className="cr-jeton">{wetten.dontCome}</i>}
          </button>
        </div>

        <button type="button" className="cr-band feld"
          onClick={()=>setzen(w => { w.feld += jeton; }, true)}>
          <span className="cr-feld-titel">Feld · ein Wurf</span>
          <span className="cr-feld-zahlen"><em>2</em> 3 4 · 9 10 11 <em>12</em></span>
          <span className="cr-feld-hinweis">2 zahlt doppelt, 12 dreifach</span>
          {wetten.feld > 0 && <i className="cr-jeton">{wetten.feld}</i>}
        </button>

        {mitte && (
        <div className="cr-props">
          {[6, 8].map(n => (
            <button type="button" key={n} className="cr-prop"
              onClick={()=>setzen(w => { w.hart[n] += jeton; }, true)}>
              <b>Hart {n}</b><i>9 : 1</i>
              {wetten.hart[n] > 0 && <i className="cr-jeton">{wetten.hart[n]}</i>}
            </button>
          ))}
          <button type="button" className="cr-prop"
            onClick={()=>setzen(w => { w.craps += jeton; }, true)}>
            <b>Alle Craps</b><i>7 : 1</i>
            {wetten.craps > 0 && <i className="cr-jeton">{wetten.craps}</i>}
          </button>
          <button type="button" className="cr-prop mies"
            onClick={()=>setzen(w => { w.sieben += jeton; }, true)}
            title="Die teuerste Wette des Hauses">
            <b>Jede 7</b><i>4 : 1</i>
            {wetten.sieben > 0 && <i className="cr-jeton">{wetten.sieben}</i>}
          </button>
        </div>
        )}

        <button type="button" className="cr-band dont"
          onClick={()=>setzen(w => { w.dont += jeton; }, kommenAus,
            'Don’t Pass wird nur vor dem Punkt gesetzt.')}>
          Don’t Pass <i>gegen den Werfer · Bar 12</i>
          {wetten.dont > 0 && <i className="cr-jeton">{wetten.dont}</i>}
        </button>
        <button type="button" className="cr-band odds"
          onClick={()=>setzen(w => { w.odds += jeton; },
            punkt !== null && wetten.pass > 0 && wetten.odds + jeton <= oddsMax,
            punkt === null ? 'Odds gibt es erst hinter einem Punkt.'
              : wetten.pass <= 0 ? 'Odds liegen hinter der Passe — ohne sie geht es nicht.'
              : 'Höchstens das Dreifache der Passe.')}>
          Odds {punkt !== null && <i>hinter der {punkt} · zahlt {CR_ODDS[punkt][0]}:{CR_ODDS[punkt][1]}</i>}
          {punkt === null && <i>erst hinter einem Punkt</i>}
          {wetten.odds > 0 && <i className="cr-jeton">{wetten.odds}</i>}
        </button>
        <button type="button" className={'cr-band pass' + (punkt !== null ? ' an' : '')}
          onClick={()=>setzen(w => { w.pass += jeton; }, kommenAus,
            'Die Passe wird nur vor dem Punkt gesetzt — dafür gibt es Come.')}>
          Pass-Linie <i>mit dem Werfer</i>
          {wetten.pass > 0 && <i className="cr-jeton">{wetten.pass}</i>}
        </button>
      </div>

      {/* ── Jetons und Werfen ───────────────────────────────── */}
      <div className="automat-einsatz">
        <span className="automat-label">Jeton</span>
        {einsaetze.map(n => (
          <button key={n} className={'automat-chip' + (jeton === n ? ' aktiv' : '')}
            onClick={()=>setJeton(n)} disabled={n > marken || rollt}>{n}</button>
        ))}
        <span className="rlt-summe">Im Spiel <b>{imSpiel}</b></span>
      </div>

      {zeilen.length > 0 && (
        <div className="rlt-abrechnung">
          {zeilen.map((z, i) => (
            <div className={'rlt-zeile' + (z.gewinn > z.betrag ? ' gut' : '')} key={i}>
              <span>{z.name}</span>
              <b>{z.betrag === 0 ? '' : z.gewinn > z.betrag ? '+' + (z.gewinn - z.betrag)
                  : z.gewinn === z.betrag ? '±0' : '−' + z.betrag}</b>
            </div>
          ))}
        </div>
      )}

      <WirtSagt spruch={wirtWort} />

      <div className="rlt-tasten">
        <button className="automat-hebel" onClick={werfen} disabled={rollt || !imSpiel}>
          {rollt ? 'Sie rollen…' : 'Würfeln'}
        </button>
        {zuletzt && !rollt && (
          <button className="bj-taste" onClick={zuletztWieder}
            title="Dieselbe Lage noch einmal aufbauen">↻ Wie zuletzt</button>
        )}
        <button className="bj-taste" onClick={allesZurueck} disabled={rollt}>Zurück</button>
      </div>

      {meldung && <div className="bj-melde leise">{meldung}</div>}
    </div>
  );
};
