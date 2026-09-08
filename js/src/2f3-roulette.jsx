// Heldenbuch — Französisches Roulette, der dritte Tisch der Taverne.
//
// Französisch heißt: ein Zéro statt zwei, der Kessel in seiner echten
// Reihenfolge, und **La Partage** — fällt die Null, kommt bei den
// einfachen Chancen die Hälfte zurück. Das drückt den Vorteil des
// Hauses von 2,7 % auf 1,35 % und macht diesen Tisch zum mildesten im
// Haus. Es steht am Tisch, nicht im Kleingedruckten.
//
// Die Mehrfachwetten werden nicht über Ränder zwischen den Feldern
// gelegt — auf einem Berührschirm trifft das niemand. Stattdessen sagt
// man vorher, was man legen will (Cheval, Transversale, Carré, Sixain)
// und tippt dann die Zahlen an; die Rennbahn nimmt einem die Ansagen
// des Kessels ganz ab.

const RLT_KESSEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,
                    5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RLT_ROT = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const rltFarbe = (n) => n === 0 ? 'null' : (RLT_ROT.has(n) ? 'rot' : 'schwarz');

// Der Tapis: zwölf Spalten zu drei Zahlen. Spalte c trägt oben 3c+3,
// in der Mitte 3c+2, unten 3c+1 — so liegt jeder Roulettetisch.
const rltSpalte = (n) => Math.floor((n - 1) / 3);         // 0..11
const rltReihe  = (n) => 2 - ((n - 1) % 3);               // 0 oben … 2 unten

// ── Was eine Wette deckt und was sie zahlt ───────────────────────
const RLT_ZAHLT = {plein:35, cheval:17, transversale:11, carre:8, sixain:5,
                   douzaine:2, colonne:2, einfach:1};
const RLT_MODI = [
  {k:'plein',        name:'Plein',        zahl:1, zahlt:'35:1', hinweis:'Eine Zahl.'},
  {k:'cheval',       name:'Cheval',       zahl:2, zahlt:'17:1', hinweis:'Zwei Zahlen, die auf dem Tapis aneinanderstoßen.'},
  {k:'transversale', name:'Transversale', zahl:1, zahlt:'11:1', hinweis:'Eine Zahl antippen — die drei ihrer Spalte gelten.'},
  {k:'carre',        name:'Carré',        zahl:2, zahlt:'8:1',  hinweis:'Zwei Zahlen über Eck — das Viereck dazwischen gilt.'},
  {k:'sixain',       name:'Sixain',       zahl:1, zahlt:'5:1',  hinweis:'Eine Zahl antippen — ihre Spalte und die nächste.'},
];

// Aus den angetippten Zahlen die Wette bauen. Gibt null, wenn die
// Auswahl keine gültige Wette ergibt — dann sagt der Tisch das auch.
const rltBauen = (modus, wahl) => {
  const [a, b] = wahl;
  if (modus === 'plein') return {art:'plein', zahlen:[a], name:'Plein ' + a};
  if (modus === 'transversale') {
    if (a === 0) return null;
    const c = rltSpalte(a), z = [c*3+1, c*3+2, c*3+3];
    return {art:'transversale', zahlen:z, name:'Transversale ' + z[0] + '–' + z[2]};
  }
  if (modus === 'sixain') {
    if (a === 0) return null;
    let c = rltSpalte(a);
    if (c === 11) c = 10;                       // am Rand die vorige Spalte
    const z = [c*3+1, c*3+2, c*3+3, c*3+4, c*3+5, c*3+6];
    return {art:'sixain', zahlen:z, name:'Sixain ' + z[0] + '–' + z[5]};
  }
  if (modus === 'cheval') {
    if (b === undefined) return null;
    // Die Null stößt an 1, 2 und 3.
    if (a === 0 || b === 0) {
      const n = a === 0 ? b : a;
      return (n >= 1 && n <= 3)
        ? {art:'cheval', zahlen:[0, n], name:'Cheval 0/' + n} : null;
    }
    const dc = Math.abs(rltSpalte(a) - rltSpalte(b));
    const dr = Math.abs(rltReihe(a) - rltReihe(b));
    if ((dc === 1 && dr === 0) || (dc === 0 && dr === 1))
      return {art:'cheval', zahlen:[a, b].sort((x,y)=>x-y),
              name:'Cheval ' + Math.min(a,b) + '/' + Math.max(a,b)};
    return null;
  }
  if (modus === 'carre') {
    if (b === undefined || a === 0 || b === 0) return null;
    const dc = Math.abs(rltSpalte(a) - rltSpalte(b));
    const dr = Math.abs(rltReihe(a) - rltReihe(b));
    if (dc !== 1 || dr !== 1) return null;
    const c = Math.min(rltSpalte(a), rltSpalte(b));
    const r = Math.min(rltReihe(a), rltReihe(b));      // 0 oben
    // Reihe 0 = 3c+3, Reihe 1 = 3c+2, Reihe 2 = 3c+1
    const zahlAus = (sp, re) => sp*3 + (3 - re);
    const z = [zahlAus(c,r), zahlAus(c+1,r), zahlAus(c,r+1), zahlAus(c+1,r+1)].sort((x,y)=>x-y);
    return {art:'carre', zahlen:z, name:'Carré ' + z[0] + '/' + z[3]};
  }
  return null;
};

// ── Die Ansagen der Rennbahn ─────────────────────────────────────
// Sie legen nicht auf Zahlen, sondern auf die Felder, auf die sie am
// Tisch gelegt werden: Chevals, Transversalen, ein Carré. Deshalb
// stehen sie hier als Stücke und nicht als Zahlenlisten.
const RLT_ANSAGEN = [
  {k:'zero', name:'Zéro-Spiel', zahlen:7, jetons:4, stuecke:[
    {art:'cheval', zahlen:[0,3], n:1}, {art:'cheval', zahlen:[12,15], n:1},
    {art:'plein',  zahlen:[26],  n:1}, {art:'cheval', zahlen:[32,35], n:1}]},
  {k:'gross', name:'Große Serie', zahlen:17, jetons:9, stuecke:[
    {art:'transversale', zahlen:[0,2,3], n:2},
    {art:'cheval', zahlen:[4,7],   n:1}, {art:'cheval', zahlen:[12,15], n:1},
    {art:'cheval', zahlen:[18,21], n:1}, {art:'cheval', zahlen:[19,22], n:1},
    {art:'cheval', zahlen:[32,35], n:1},
    {art:'carre',  zahlen:[25,26,28,29], n:2}]},
  {k:'klein', name:'Kleine Serie', zahlen:12, jetons:6, stuecke:[
    {art:'cheval', zahlen:[5,8],   n:1}, {art:'cheval', zahlen:[10,11], n:1},
    {art:'cheval', zahlen:[13,16], n:1}, {art:'cheval', zahlen:[23,24], n:1},
    {art:'cheval', zahlen:[27,30], n:1}, {art:'cheval', zahlen:[33,36], n:1}]},
  {k:'waisen', name:'Waisen', zahlen:8, jetons:5, stuecke:[
    {art:'plein',  zahlen:[1],     n:1}, {art:'cheval', zahlen:[6,9],   n:1},
    {art:'cheval', zahlen:[14,17], n:1}, {art:'cheval', zahlen:[17,20], n:1},
    {art:'cheval', zahlen:[31,34], n:1}]},
];
const RLT_WEITEN = [0, 1, 2, 3, 4];

// Die Nachbarn einer Zahl im Kessel — nicht auf dem Tapis.
const rltNachbarn = (n, weite) => {
  const i = RLT_KESSEL.indexOf(n);
  if (i < 0) return [n];
  const raus = [];
  for (let d = -weite; d <= weite; d++)
    raus.push(RLT_KESSEL[(i + d + RLT_KESSEL.length * 2) % RLT_KESSEL.length]);
  return raus;
};

// Trifft eine Wette die gefallene Zahl?
const rltTrifft = (w, n) => {
  if (w.art === 'einfach') return w.pruef(n);
  return w.zahlen.includes(n);
};

const RLT_EINFACH = [
  {k:'manque', name:'Manque', kurz:'1–18',  pruef:(n)=>n >= 1 && n <= 18},
  {k:'pair',   name:'Pair',   kurz:'gerade',pruef:(n)=>n !== 0 && n % 2 === 0},
  {k:'rouge',  name:'Rouge',  kurz:'rot',   pruef:(n)=>RLT_ROT.has(n)},
  {k:'noir',   name:'Noir',   kurz:'schwarz',pruef:(n)=>n !== 0 && !RLT_ROT.has(n)},
  {k:'impair', name:'Impair', kurz:'ungerade',pruef:(n)=>n % 2 === 1},
  {k:'passe',  name:'Passe',  kurz:'19–36', pruef:(n)=>n >= 19},
];

const RouletteTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  // Ohne La Partage ist es kein franzoesischer Tisch mehr, sondern ein
  // gewoehnlicher mit einem Zero: 2,7 % statt 1,35 %. Die Spielleitung
  // darf das, aber es steht dann auch so am Tisch.
  const partage = !(cfg && cfg.regeln && cfg.regeln.partage === false);
  const [jeton, setJeton] = React.useState(() => einsaetze[0] || 5);
  const [modus, setModus] = React.useState('plein');
  const [wahl, setWahl] = React.useState([]);
  const [wetten, setWetten] = React.useState([]);
  const [phase, setPhase] = React.useState('setzen');   // setzen | dreht | aus
  const [winkel, setWinkel] = React.useState(0);
  const [gefallen, setGefallen] = React.useState(null);
  const [verlauf, setVerlauf] = React.useState([]);
  const [abrechnung, setAbrechnung] = React.useState(null);
  const [wirtWort, wirtSagen] = useWirt('roulette');
  const [meldung, setMeldung] = React.useState('');
  const [bahn, setBahn] = React.useState(false);
  const [weite, setWeite] = React.useState(2);
  const uhr = React.useRef(null);

  React.useEffect(() => { if (onLaeuft) onLaeuft(phase === 'dreht'); }, [phase]);
  React.useEffect(() => () => clearTimeout(uhr.current), []);

  const imSpiel = wetten.reduce((s, w) => s + w.betrag, 0);
  const modusInfo = RLT_MODI.find(m => m.k === modus) || RLT_MODI[0];

  const legen = (w, betrag) => {
    if (betrag > marken) { setMeldung('So viel liegt nicht mehr im Beutel.'); return false; }
    zahlen(-betrag);
    setWetten(l => {
      // Dasselbe Feld zweimal belegt wird ein höherer Turm, keine
      // zweite Zeile — so liegt es auch auf dem Tuch.
      const i = l.findIndex(x => x.name === w.name);
      if (i >= 0) return l.map((x, j) => j === i ? {...x, betrag: x.betrag + betrag} : x);
      return [...l, {...w, betrag}];
    });
    setMeldung('');
    return true;
  };

  const zahlTippen = (n) => {
    if (phase !== 'setzen') return;
    const neu = [...wahl, n];
    if (neu.length < modusInfo.zahl) { setWahl(neu); return; }
    const w = rltBauen(modus, neu);
    setWahl([]);
    if (!w) { setMeldung('Diese beiden Zahlen stoßen auf dem Tapis nicht aneinander.'); return; }
    legen(w, jeton);
  };

  const aussenTippen = (w) => { if (phase === 'setzen') legen(w, jeton); };

  const ansagen = (a) => {
    const gesamt = a.jetons * jeton;
    if (gesamt > marken) { setMeldung('Für die ganze Ansage reicht der Beutel nicht.'); return; }
    zahlen(-gesamt);
    setWetten(l => {
      let neu = [...l];
      a.stuecke.forEach(st => {
        const name = st.art === 'plein' ? 'Plein ' + st.zahlen[0]
          : st.art === 'cheval' ? 'Cheval ' + st.zahlen[0] + '/' + st.zahlen[1]
          : st.art === 'carre'  ? 'Carré ' + st.zahlen[0] + '/' + st.zahlen[3]
          : 'Transversale 0/2/3';
        const i = neu.findIndex(x => x.name === name);
        const betrag = st.n * jeton;
        if (i >= 0) neu[i] = {...neu[i], betrag: neu[i].betrag + betrag};
        else neu.push({art: st.art, zahlen: st.zahlen, name, betrag});
      });
      return neu;
    });
    setBahn(false);
    setMeldung(a.name + ' liegt: ' + a.jetons + ' Jetons à ' + jeton + '.');
  };

  const nachbarnLegen = (n) => {
    const z = rltNachbarn(n, weite);
    const gesamt = z.length * jeton;
    if (gesamt > marken) { setMeldung('Für so viele Nachbarn reicht der Beutel nicht.'); return; }
    zahlen(-gesamt);
    setWetten(l => {
      let neu = [...l];
      z.forEach(x => {
        const name = 'Plein ' + x;
        const i = neu.findIndex(y => y.name === name);
        if (i >= 0) neu[i] = {...neu[i], betrag: neu[i].betrag + jeton};
        else neu.push({art:'plein', zahlen:[x], name, betrag: jeton});
      });
      return neu;
    });
    setBahn(false);
    setMeldung(n + ' und ' + (weite ? 'je ' + weite + ' Nachbarn' : 'sonst nichts')
               + ': ' + z.length + ' Jetons à ' + jeton + '.');
  };

  const alleZurueck = () => {
    if (phase !== 'setzen' || !imSpiel) return;
    zahlen(imSpiel); setWetten([]); setWahl([]); setMeldung('');
  };

  // ── Werfen ─────────────────────────────────────────────────────
  const werfen = () => {
    if (!wetten.length) { setMeldung('Erst setzen, dann werfen.'); return; }
    const n = RLT_KESSEL[Math.floor(Math.random() * RLT_KESSEL.length)];
    const i = RLT_KESSEL.indexOf(n);
    setPhase('dreht'); setGefallen(null); setAbrechnung(null); setMeldung('');
    // Fünf ganze Umläufe, dann auf das Fach — die Kugel läuft im
    // Uhrzeigersinn, der Kessel steht.
    setWinkel(w => w + 360 * 5 + ((i * 360 / 37) - (w % 360) + 720) % 360);
    uhr.current = setTimeout(() => abrechnen(n), 3400);
  };

  const abrechnen = (n) => {
    setGefallen(n);
    setVerlauf(v => [n, ...v].slice(0, 12));
    let aus = 0;
    const zeilen = wetten.map(w => {
      const trifft = rltTrifft(w, n);
      let g = 0, text;
      if (trifft) {
        g = w.betrag + w.betrag * RLT_ZAHLT[w.art];
        text = 'trifft';
      } else if (partage && w.art === 'einfach' && n === 0) {
        // La Partage: bei der Null bleibt bei den einfachen Chancen die
        // Hälfte liegen. Das ist der ganze Unterschied zum Rest der Welt.
        g = Math.floor(w.betrag / 2);
        text = 'La Partage — die Hälfte zurück';
      } else text = 'verfällt';
      aus += g;
      return {name: w.name, betrag: w.betrag, gewinn: g, text, trifft, art: w.art};
    });
    if (aus > 0) zahlen(aus);
    const einsatz = wetten.reduce((s, w) => s + w.betrag, 0);
    setAbrechnung({zeilen, aus, einsatz});
    // Die Null und der Volltreffer sind die beiden Augenblicke, an denen
    // an einem Roulettetisch jemand etwas sagt.
    wirtSagen({
      fall: n === 0 ? (partage ? 'zero' : 'zeroHart')
        : zeilen.some(z => z.trifft && z.art === 'plein') ? 'plein' : null,
      aus, einsatz,
    });
    setPhase('aus');
  };

  const neueRunde = () => {
    setPhase('setzen'); setWetten([]); setWahl([]); setAbrechnung(null); setMeldung('');
    wirtSagen(null);
  };

  // Ein Jeton liegt auf einem Feld, nicht anteilig auf sechs. Der Turm
  // steht deshalb auf der kleinsten Zahl der Wette — so wie er auf dem
  // Tuch am Rand zwischen ihnen läge —, und jede Zahl, die davon
  // gedeckt ist, bekommt einen Saum.
  const aufZahl = {}, gedeckt = new Set(), namenAuf = {};
  const AUSSEN = ['einfach', 'douzaine', 'colonne'];
  wetten.forEach(w => {
    if (AUSSEN.includes(w.art)) return;
    const anker = Math.min(...w.zahlen);
    aufZahl[anker] = (aufZahl[anker] || 0) + w.betrag;
    namenAuf[anker] = (namenAuf[anker] ? namenAuf[anker] + ' · ' : '') + w.name + ' (' + w.betrag + ')';
    w.zahlen.forEach(n => gedeckt.add(n));
  });
  const aufAussen = {};
  wetten.forEach(w => { if (AUSSEN.includes(w.art))
    aufAussen[w.name] = (aufAussen[w.name] || 0) + w.betrag; });

  const zelle = (n) => (
    <button type="button" key={n} className={'rlt-feld ' + rltFarbe(n)
        + (wahl.includes(n) ? ' gewaehlt' : '') + (gedeckt.has(n) ? ' gedeckt' : '')
        + (gefallen === n ? ' trifft' : '')}
      title={namenAuf[n] || undefined}
      onClick={()=>zahlTippen(n)} disabled={phase !== 'setzen'}>
      {n}
      {aufZahl[n] ? <i className="rlt-turm">{Math.round(aufZahl[n])}</i> : null}
    </button>
  );

  const aussen = (name, art, zahlenListe, pruef, kl) => (
    <button type="button" className={'rlt-feld aussen' + (kl ? ' ' + kl : '')
        + (gefallen !== null && (pruef ? pruef(gefallen) : zahlenListe.includes(gefallen)) ? ' trifft' : '')}
      onClick={()=>aussenTippen(pruef
        ? {art:'einfach', zahlen:[], pruef, name}
        : {art, zahlen: zahlenListe, name})}
      disabled={phase !== 'setzen'}>
      {name}
      {aufAussen[name] ? <i className="rlt-turm">{aufAussen[name]}</i> : null}
    </button>
  );

  // Der Zettel steht ab Tabletbreite neben dem Kessel und am Telefon
  // unter dem Tapis — derselbe Inhalt, zwei Plaetze. Deshalb einmal
  // geschrieben und zweimal gerufen.
  const abrechnungZeigen = () => (
    <div className="rlt-abrechnung">
      {abrechnung.zeilen.filter(z => z.gewinn > 0).map((z, i) => {
        // La Partage steht auch hier — sie zahlt etwas zurück, ist
        // aber kein Gewinn und wird deshalb nicht grün.
        const d = z.gewinn - z.betrag;
        return (
          <div className={'rlt-zeile' + (d > 0 ? ' gut' : '')} key={i}>
            <span>{z.name} · {z.text}</span>
            <b>{d >= 0 ? '+' + d : '−' + Math.abs(d)}</b>
          </div>
        );
      })}
      <div className="rlt-zeile summe">
        <span>{abrechnung.aus >= abrechnung.einsatz ? 'Gewonnen' : 'Verloren'}</span>
        <b>{abrechnung.aus - abrechnung.einsatz >= 0 ? '+' : '−'}
          {Math.abs(abrechnung.aus - abrechnung.einsatz)}</b>
      </div>
    </div>
  );

  const spalten = [0,1,2,3,4,5,6,7,8,9,10,11];
  const colonne = (r) => spalten.map(c => c*3 + (3 - r));

  return (
    <div className="automat-mitte rlt-mitte">

      {/* ── Kessel und Verlauf ──────────────────────────────── */}
      <div className="rlt-oben">
        <div className="rlt-kessel">
          <div className="rlt-kugelbahn" style={{transform:'rotate(' + winkel + 'deg)',
            transition: phase === 'dreht' ? 'transform 3.2s cubic-bezier(.17,.67,.2,1)' : 'none'}}>
            <i className="rlt-kugel" />
          </div>
          <div className="rlt-nabe">
            {gefallen === null
              ? <b className="leise">—</b>
              : <><b>{gefallen}</b><i>{gefallen === 0 ? 'Zéro'
                  : rltFarbe(gefallen) === 'rot' ? 'Rouge' : 'Noir'}</i></>}
          </div>
        </div>
        <div className="rlt-lauf">
          <div className="rlt-lauf-titel">Die letzten Würfe</div>
          <div className="rlt-verlauf">
            {verlauf.length === 0
              ? <span className="leise">Noch nichts gefallen.</span>
              : verlauf.map((n, i) => (
                  <span className={'rlt-zahl ' + rltFarbe(n)} key={i}>{n}</span>))}
          </div>
          <div className="rlt-partage">
            {partage ? (
              <>Ein Zéro · <b>La Partage</b> — bei der Null die Hälfte zurück
                auf die einfachen Chancen. 1,35 % ans Haus.</>
            ) : (
              <>Ein Zéro · <b>ohne La Partage</b> — bei der Null bleibt alles
                liegen. 2,7 % ans Haus.</>
            )}
          </div>
        </div>

        {/* Der Zettel. Rechts vom Kessel standen 596 × 77 Punkte leer,
            waehrend die Abrechnung darunter das Fenster verlaengerte.
            Jetzt steht dort vor dem Wurf, was auf dem Tapis liegt, und
            danach, was es gebracht hat — so wie es der Croupier neben
            dem Kessel ansagt. Die Spalte ist immer da und immer gleich
            hoch: dadurch waechst das Fenster beim Wurf nicht mehr.
            Am Telefon gibt es sie nicht, dort ist kein Platz daneben. */}
        <div className="rlt-aus">
          {phase === 'aus' && abrechnung ? abrechnungZeigen() : (
            <>
              <div className="rlt-lauf-titel">Auf dem Tapis</div>
              {wetten.length === 0
                ? <div className="rlt-leer">Noch nichts gesetzt.</div>
                : (
                  <div className="rlt-liste">
                    {wetten.map((w, i) => (
                      <div className="rlt-zeile" key={i}>
                        <span>{w.name}</span><b>{w.betrag}</b>
                      </div>
                    ))}
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* ── Was ein Antippen bedeutet ───────────────────────── */}
      <div className="rlt-modi">
        {RLT_MODI.map(m => (
          <button type="button" key={m.k} disabled={phase !== 'setzen'}
            className={'rlt-modus' + (modus === m.k ? ' an' : '')}
            onClick={()=>{ setModus(m.k); setWahl([]); setMeldung(''); }}>
            {m.name}<i>{m.zahlt}</i>
          </button>
        ))}
        <button type="button" className="rlt-modus rlt-bahn" disabled={phase !== 'setzen'}
          onClick={()=>setBahn(true)}>🏁 Rennbahn<i>Ansagen</i></button>
      </div>
      <div className="rlt-hinweis">
        {wahl.length
          ? 'Gewählt: ' + wahl.join(', ') + ' — noch ' + (modusInfo.zahl - wahl.length) + '.'
          : modusInfo.hinweis}
      </div>

      {/* ── Der Tapis ───────────────────────────────────────── */}
      <div className="rlt-tuch">
        <div className="rlt-tapis">
          <button type="button" className={'rlt-feld null gross'
              + (wahl.includes(0) ? ' gewaehlt' : '') + (gedeckt.has(0) ? ' gedeckt' : '')
              + (gefallen === 0 ? ' trifft' : '')}
            title={namenAuf[0] || undefined}
            onClick={()=>zahlTippen(0)} disabled={phase !== 'setzen'}>
            0{aufZahl[0] ? <i className="rlt-turm">{Math.round(aufZahl[0])}</i> : null}
          </button>
          {[0,1,2].map(r => (
            <React.Fragment key={r}>
              {spalten.map(c => zelle(c*3 + (3 - r)))}
              {aussen('Colonne', 'colonne', colonne(r), null, 'senk k' + r)}
            </React.Fragment>
          ))}
        </div>
        <div className="rlt-aussen">
          <span className="luecke" />
          {aussen('P 12', 'douzaine', [1,2,3,4,5,6,7,8,9,10,11,12], null, 'vier')}
          {aussen('M 12', 'douzaine', [13,14,15,16,17,18,19,20,21,22,23,24], null, 'vier')}
          {aussen('D 12', 'douzaine', [25,26,27,28,29,30,31,32,33,34,35,36], null, 'vier')}
          <span className="luecke" />
        </div>
        <div className="rlt-aussen">
          <span className="luecke" />
          {RLT_EINFACH.map(e => (
            <React.Fragment key={e.k}>
              {aussen(e.name, 'einfach', null, e.pruef, 'zwei ' + e.k)}
            </React.Fragment>
          ))}
          <span className="luecke" />
        </div>
      </div>

      {/* ── Jetons und Werfen ───────────────────────────────── */}
      <div className="automat-einsatz">
        <span className="automat-label">Jeton</span>
        {einsaetze.map(n => (
          <button key={n} className={'automat-chip' + (jeton === n ? ' aktiv' : '')}
            onClick={()=>setJeton(n)} disabled={n > marken || phase !== 'setzen'}>{n}</button>
        ))}
        <span className="rlt-summe">Im Spiel <b>{imSpiel}</b></span>
      </div>

      {phase === 'aus' && abrechnung && (
        <div className="rlt-unten">{abrechnungZeigen()}</div>
      )}

      {/* Ein Fuss, nicht zwei: der Hauptknopf wechselt sein Wort. Zwei
          Reihen, die einander ersetzen, machten das Fenster bei jedem
          Wurf laenger und wieder kuerzer. */}
      <WirtSagt spruch={wirtWort} />

      <div className="rlt-tasten">
        <button className="automat-hebel"
          onClick={phase === 'aus' ? neueRunde : werfen}
          disabled={phase === 'dreht' || (phase === 'setzen' && !imSpiel)}>
          {phase === 'dreht' ? 'Rien ne va plus…'
            : phase === 'aus' ? 'Nächster Wurf' : 'Werfen'}
        </button>
        <button className="bj-taste" onClick={alleZurueck}
          disabled={phase !== 'setzen' || !imSpiel}>Zurück</button>
      </div>

      <div className="bj-melde leise rlt-melde">{meldung}</div>

      {/* ── Die Rennbahn ────────────────────────────────────── */}
      {bahn && (
        <div className="rad-huelle" onClick={()=>setBahn(false)}>
          <div className="rad-fenster bahn-fenster" onClick={e=>e.stopPropagation()}>
            <div className="rad-titel">🏁 Rennbahn</div>
            <div className="rad-unter">
              Der Kessel, ausgerollt: die Null an der Kehre, dann einmal herum
              und auf der unteren Spur zurück. Nachbarn liegen hier nebeneinander,
              auf dem Tapis nicht.
            </div>

            <div className="bahn">
              <button type="button" className={'bahn-null' + (gefallen === 0 ? ' hell' : '')}
                onClick={()=>nachbarnLegen(0)}>0</button>
              <div className="bahn-gleise">
                <div className="bahn-reihe">
                  {RLT_KESSEL.slice(1, 19).map(n => (
                    <button type="button" key={n} className={'bahn-zahl ' + rltFarbe(n)
                        + (gefallen === n ? ' hell' : '')}
                      onClick={()=>nachbarnLegen(n)}>{n}</button>
                  ))}
                </div>
                <div className="bahn-reihe">
                  {RLT_KESSEL.slice(19).reverse().map(n => (
                    <button type="button" key={n} className={'bahn-zahl ' + rltFarbe(n)
                        + (gefallen === n ? ' hell' : '')}
                      onClick={()=>nachbarnLegen(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <span className="bahn-kehre" aria-hidden="true" />
            </div>

            <div className="bahn-weiten">
              <span className="bahn-weiten-titel">Nachbarn</span>
              {RLT_WEITEN.map(w => (
                <button type="button" key={w}
                  className={'bahn-weite' + (weite === w ? ' an' : '')}
                  onClick={()=>setWeite(w)}>{w === 0 ? 'nur die Zahl' : w + '–' + w}</button>
              ))}
            </div>
            <div className="bahn-hinweis">
              Erst die Weite wählen, dann eine Zahl auf der Bahn antippen —
              {' '}{(weite * 2 + 1)} Jetons à {jeton} en plein.
            </div>

            <div className="bahn-ansagen">
              {RLT_ANSAGEN.map(a => (
                <button type="button" key={a.k} className="bahn-ansage"
                  onClick={()=>ansagen(a)}>
                  {a.name}<i>{a.zahlen} Zahlen · {a.jetons} Jetons</i>
                </button>
              ))}
            </div>

            <div className="bahn-fuss">
              <span className="bahn-summe">Jeton <b>{jeton}</b></span>
              <button className="bahn-weg" onClick={()=>setBahn(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
