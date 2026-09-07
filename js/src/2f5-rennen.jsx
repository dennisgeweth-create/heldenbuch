// Heldenbuch — Die Rennbahn vor dem Tor, der fünfte Tisch der Taverne.
//
// Kein Zufallsgenerator, der am Ende einen Sieger zieht und die
// Bewegung dazu erfindet: das Rennen wird gelaufen. Jedes Pferd hat
// Tempo, Ausdauer, Antritt und einen Laufstil, und alle halbe Sekunde
// entscheidet sich neu, wer vorn liegt. Der Verbrauch steigt mit der
// vierten Potenz des Tempos — wer vorn zu schnell geht, bezahlt es im
// Schlussbogen. Genau deshalb sieht man ein Führpferd führen und einen
// Steher kommen.
//
// Und weil das Rennen simuliert wird, kommen auch die Quoten daraus:
// vor jedem Lauf werden zweitausendfünfhundert Rennen im Stillen
// durchgerechnet. Wie oft ein Pferd darin gewinnt, ist seine
// Wahrscheinlichkeit; die Quote ist ihr Kehrwert, abzüglich des
// Anteils des Hauses. Geraten wird nichts — und niemand kann die Quote
// von der Wirklichkeit trennen, es ist dieselbe Rechnung.

const RN_ABZUG   = 0.12;    // Anteil des Hauses
const RN_PROBEN  = 2500;    // Läufe für die Quotenrechnung
const RN_DT      = 0.5;     // Sekunden je Schritt
const RN_TEMPO   = 15.6;    // Reisegeschwindigkeit in m/s
const RN_SCHAU   = 8;       // so viel schneller läuft es auf dem Schirm

// Tempo, Ausdauer und Antritt liegen dicht beieinander: ein echtes Feld
// läuft innerhalb weniger Prozent zusammen ein. Wer hier große
// Unterschiede einsetzt, bekommt kein Rennen, sondern eine Vorführung.
const RN_STALL = [
  {nr:1, name:'Rußhufe',     farbe:'#e05a5a', tempo:1.008, ausdauer:0.99, antritt:1.01, stil:0.80},
  {nr:2, name:'Abendwind',   farbe:'#4a90d9', tempo:0.999, ausdauer:1.04, antritt:1.05, stil:0.25},
  {nr:3, name:'Grauer Bote', farbe:'#8b9198', tempo:1.002, ausdauer:1.01, antritt:1.02, stil:0.50},
  {nr:4, name:'Distelkopf',  farbe:'#56b183', tempo:1.004, ausdauer:1.00, antritt:1.00, stil:0.62},
  {nr:5, name:'Nachtmähre',  farbe:'#9b59b6', tempo:0.996, ausdauer:1.05, antritt:1.06, stil:0.15},
  {nr:6, name:'Goldkelle',   farbe:'#e8b84b', tempo:1.010, ausdauer:0.98, antritt:0.99, stil:0.90},
];
const RN_BODEN   = [{name:'fest', streu:0.85}, {name:'gut', streu:1.00}, {name:'weich', streu:1.25}];
const RN_STRECKEN = [1400, 1600, 1800, 2000];

// Normalverteilte Zufallszahl (Box-Muller). Gleichverteiltes Rauschen
// ergäbe Rennen, in denen alles gleich wahrscheinlich ist.
const rnGauss = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// Ein Lauf. Dieselbe Rechnung für die Quoten wie für das Rennen, das
// man danach sieht — deshalb kann die Quote nicht davon abweichen.
const rnLauf = (strecke, streu, mitSpur) => {
  const n = RN_STALL.length;
  const pos = new Float64Array(n), kraft = new Float64Array(n),
        form = new Float64Array(n), zeit = new Float64Array(n);
  const spur = mitSpur ? RN_STALL.map(() => [0]) : null;

  // Kraft als Anteil von 1. Der Bezug ist nicht die Strecke selbst,
  // sondern eine Mischung aus ihr und der Meile — sonst wäre Ausdauer
  // über jede Distanz gleich viel wert. So bleibt über 1400 m etwas
  // übrig und der Antritt entscheidet, während über 2000 m alle leer
  // ins Ziel kommen und der Steher gewinnt.
  const tCruise = (0.55 * strecke + 0.45 * 1600) / RN_TEMPO;
  for (let i = 0; i < n; i++) { form[i] = 1 + rnGauss() * 0.012 * streu; kraft[i] = 1; }

  let t = 0, fertig = 0;
  while (fertig < n && t < 400) {
    t += RN_DT;
    for (let i = 0; i < n; i++) {
      if (pos[i] >= strecke) continue;
      const p = RN_STALL[i], anteil = pos[i] / strecke;
      // Laufstil: der Führende geht vorn schnell und wird hinten
      // langsamer, der Wartende umgekehrt.
      const stil = 1 + (p.stil - 0.5) * 0.09 * (1 - 2 * anteil);
      // Antritt auf den letzten dreißig Prozent — aber nur, wer noch
      // Kraft hat, kann ihn auch abrufen.
      let kick = 1;
      if (anteil > 0.7) kick = 1 + (p.antritt - 1) * ((anteil - 0.7) / 0.3)
                                * Math.min(1, kraft[i] / 0.15);
      const soll = RN_TEMPO * p.tempo * form[i] * stil * kick;
      // Vierte Potenz: ein Prozent schneller kostet vier Prozent mehr
      // Kraft. Deshalb bezahlt das Führpferd sein frühes Tempo später.
      kraft[i] -= (RN_DT / tCruise) * Math.pow(soll / RN_TEMPO, 4) / p.ausdauer;
      if (kraft[i] < 0) kraft[i] = 0;
      const rest = kraft[i] > 0.08 ? 1 : 0.88 + 0.12 * (kraft[i] / 0.08);
      const v = soll * rest * (1 + rnGauss() * 0.010 * streu);
      pos[i] += v * RN_DT;
      if (pos[i] >= strecke) {
        // Zwischen zwei Schritten liegt eine halbe Sekunde; die
        // Ziellinie wird darin linear getroffen, sonst wäre jedes
        // Kopf-an-Kopf-Rennen ein Gleichstand.
        zeit[i] = t - RN_DT * ((pos[i] - strecke) / (v * RN_DT));
        fertig++;
      }
      if (spur) spur[i].push(Math.min(pos[i], strecke));
    }
  }
  for (let i = 0; i < n; i++) if (!zeit[i]) zeit[i] = t + 1;
  const reihe = RN_STALL.map((p, i) => i).sort((a, b) => zeit[a] - zeit[b]);
  return {reihe, zeit, spur};
};

// Die Quoten: stille Läufe, gezählt wird, wie oft wer wo einläuft.
const rnQuoten = (strecke, streu) => {
  const n = RN_STALL.length;
  const sieg = new Array(n).fill(0), platz = new Array(n).fill(0);
  const paar = {}, einlauf = {};
  for (let k = 0; k < RN_PROBEN; k++) {
    const {reihe} = rnLauf(strecke, streu, false);
    sieg[reihe[0]]++;
    platz[reihe[0]]++; platz[reihe[1]]++; platz[reihe[2]]++;
    const a = reihe[0], b = reihe[1], s = Math.min(a,b) + '-' + Math.max(a,b);
    paar[s] = (paar[s] || 0) + 1;
    einlauf[a + '>' + b] = (einlauf[a + '>' + b] || 0) + 1;
  }
  const quote = (treffer) => treffer
    ? Math.max(1.05, Math.round((1 - RN_ABZUG) * RN_PROBEN / treffer * 10) / 10)
    : null;
  return {
    sieg: sieg.map(quote), platz: platz.map(quote),
    paar: Object.fromEntries(Object.entries(paar).map(([k,v]) => [k, quote(v)])),
    einlauf: Object.fromEntries(Object.entries(einlauf).map(([k,v]) => [k, quote(v)])),
    pSieg: sieg.map(v => v / RN_PROBEN),
  };
};

const RN_ARTEN = {
  sieg:     {titel:'Sieg',     zahl:1, hinweis:'Ein Pferd wählen — es gewinnt.'},
  platz:    {titel:'Platz',    zahl:1, hinweis:'Ein Pferd wählen — es läuft unter die ersten drei.'},
  zwilling: {titel:'Zwilling', zahl:2, hinweis:'Zwei Pferde — die ersten beiden, Reihenfolge egal.'},
  einlauf:  {titel:'Einlauf',  zahl:2, hinweis:'Zwei Pferde in der Reihenfolge, in der sie einlaufen.'},
};
const rnStil = (p) => p.stil > 0.6 ? 'geht vorn' : p.stil < 0.35 ? 'kommt von hinten' : 'läuft mit';

const RennenTisch = ({ cfg, marken, zahlen, onLaeuft }) => {
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const [satz, setSatz] = React.useState(() => einsaetze[0] || 5);
  const [lauf, setLauf] = React.useState(1);
  const [bahn, setBahn] = React.useState(() => ({
    strecke: RN_STRECKEN[Math.floor(Math.random() * RN_STRECKEN.length)],
    boden: RN_BODEN[Math.floor(Math.random() * RN_BODEN.length)],
  }));
  const quoten = React.useMemo(() => rnQuoten(bahn.strecke, bahn.boden.streu),
    [bahn.strecke, bahn.boden.streu, lauf]);
  const [art, setArt] = React.useState('sieg');
  const [wahl, setWahl] = React.useState([]);
  const [wetten, setWetten] = React.useState([]);
  const [phase, setPhase] = React.useState('setzen');   // setzen | laeuft | aus
  const [stand, setStand] = React.useState(() => RN_STALL.map(() => 0));
  const [uhrzeit, setUhrzeit] = React.useState(0);
  const [ruf, setRuf] = React.useState('Die Pferde gehen an den Start.');
  const [ergebnis, setErgebnis] = React.useState(null);
  const [meldung, setMeldung] = React.useState('');
  const bild = React.useRef(null);

  React.useEffect(() => { if (onLaeuft) onLaeuft(phase === 'laeuft'); }, [phase]);
  React.useEffect(() => () => cancelAnimationFrame(bild.current), []);

  const imSpiel = wetten.reduce((s, w) => s + w.satz, 0);
  const artInfo = RN_ARTEN[art];
  const nam = (i) => RN_STALL[i].name;

  const waehlen = (i) => {
    if (phase !== 'setzen') return;
    const drin = wahl.indexOf(i);
    if (drin >= 0) { setWahl(wahl.filter((_, j) => j !== drin)); return; }
    const neu = [...wahl, i];
    if (neu.length < artInfo.zahl) { setWahl(neu); setMeldung(''); return; }
    setWahl([]);

    let quote = null, text = '';
    if (art === 'sieg')     { quote = quoten.sieg[neu[0]];  text = nam(neu[0]); }
    if (art === 'platz')    { quote = quoten.platz[neu[0]]; text = nam(neu[0]); }
    if (art === 'zwilling') { quote = quoten.paar[Math.min(neu[0],neu[1]) + '-' + Math.max(neu[0],neu[1])];
                              text = nam(neu[0]) + ' & ' + nam(neu[1]); }
    if (art === 'einlauf')  { quote = quoten.einlauf[neu[0] + '>' + neu[1]];
                              text = nam(neu[0]) + ' vor ' + nam(neu[1]); }
    if (!quote) {
      // Was in 2500 Läufen nie vorkam, hat keine Quote — und ohne
      // Quote nimmt das Haus die Wette nicht an.
      setMeldung('Diese Reihenfolge kam in ' + RN_PROBEN + ' Läufen nie vor — das Haus nimmt sie nicht an.');
      return;
    }
    if (satz > marken) { setMeldung('So viel liegt nicht mehr im Beutel.'); return; }
    zahlen(-satz);
    setWetten(l => [...l, {art, titel: artInfo.titel, text, quote, satz, ziele: neu}]);
    setMeldung('');
  };

  const streichen = (i) => {
    if (phase !== 'setzen') return;
    zahlen(wetten[i].satz);
    setWetten(l => l.filter((_, j) => j !== i));
  };
  const alleWeg = () => {
    if (phase !== 'setzen' || !imSpiel) return;
    zahlen(imSpiel); setWetten([]); setWahl([]);
  };

  const starten = () => {
    if (phase !== 'setzen') return;
    setPhase('laeuft'); setWahl([]); setErgebnis(null); setMeldung('');
    const l = rnLauf(bahn.strecke, bahn.boden.streu, true);
    const schritte = l.spur[0].length;
    const dauer = (schritte - 1) * RN_DT * 1000 / RN_SCHAU;
    const marken4 = [0.25, 0.5, 0.75, 0.92];
    const wo = ['Nach dem ersten Bogen', 'Am Gegengeraden', 'In den Schlussbogen', 'Auf der Zielgeraden'];
    let naechste = 0;
    const t0 = performance.now();

    const schritt = (jetzt) => {
      const p = Math.min(1, (jetzt - t0) / dauer);
      const f = p * (schritte - 1);
      const i0 = Math.floor(f), i1 = Math.min(schritte - 1, i0 + 1), r = f - i0;
      const s = l.spur.map(x => x[i0] + (x[i1] - x[i0]) * r);
      setStand(s); setUhrzeit(f * RN_DT);
      while (naechste < marken4.length && p >= marken4[naechste]) {
        const o = s.map((x, i) => i).sort((a, b) => s[b] - s[a]);
        setRuf(wo[naechste] + ' führt ' + nam(o[0]) + ', dahinter ' + nam(o[1]) + ' und ' + nam(o[2]) + '.');
        naechste++;
      }
      if (p < 1) bild.current = requestAnimationFrame(schritt);
      else ziel(l);
    };
    bild.current = requestAnimationFrame(schritt);
  };

  const ziel = (l) => {
    const r = l.reihe;
    setRuf(nam(r[0]) + ' gewinnt vor ' + nam(r[1]) + ' und ' + nam(r[2]) + '.');
    setUhrzeit(l.zeit[r[0]]);
    let aus = 0;
    const zeilen = wetten.map(w => {
      let ok = false;
      if (w.art === 'sieg')     ok = r[0] === w.ziele[0];
      if (w.art === 'platz')    ok = r.slice(0, 3).includes(w.ziele[0]);
      if (w.art === 'zwilling') ok = w.ziele.every(z => r.slice(0, 2).includes(z));
      if (w.art === 'einlauf')  ok = r[0] === w.ziele[0] && r[1] === w.ziele[1];
      const g = ok ? Math.round(w.satz * w.quote) : 0;
      aus += g;
      return {...w, gewinn: g, ok};
    });
    if (aus > 0) zahlen(aus);
    // Eine Pferdelänge sind knapp zweieinhalb Meter, und ein Pferd legt
    // gut sechs davon in der Sekunde zurück.
    const laengen = (l.zeit[r[1]] - l.zeit[r[0]]) * RN_TEMPO / 2.4;
    setErgebnis({reihe: r, zeit: l.zeit, zeilen, aus, einsatz: imSpiel,
      abstand: laengen < 0.2 ? 'eine Nasenlänge'
             : laengen < 0.6 ? 'einen halben Hals'
             : laengen < 1.5 ? laengen.toFixed(1).replace('.', ',') + ' Längen'
             : Math.round(laengen) + ' Längen'});
    setPhase('aus');
  };

  const naechsterLauf = () => {
    setBahn({strecke: RN_STRECKEN[Math.floor(Math.random() * RN_STRECKEN.length)],
             boden: RN_BODEN[Math.floor(Math.random() * RN_BODEN.length)]});
    setLauf(l => l + 1);
    setWetten([]); setWahl([]); setErgebnis(null); setPhase('setzen');
    setStand(RN_STALL.map(() => 0)); setUhrzeit(0);
    setRuf('Die Pferde gehen an den Start.'); setMeldung('');
  };

  return (
    <div className="automat-mitte rn-mitte">

      {/* ── Die Bahn ────────────────────────────────────────── */}
      <div className="filz rn-bahn">
        <div className="rn-kopf">
          <span className="rn-strecke">{lauf}. Lauf · <b>{bahn.strecke}</b> m · Boden {bahn.boden.name}</span>
          <span className="rn-uhr">{uhrzeit ? uhrzeit.toFixed(1) + ' s' : '—'}</span>
        </div>
        <div className="rn-spuren">
          {RN_STALL.map((p, i) => (
            <div className="rn-spur" key={p.nr}>
              <span className="rn-spur-nr" style={{color: p.farbe}}>{p.nr}</span>
              <span className="rn-gleis">
                <i className="rn-laeufer" style={{
                  left: (Math.min(1, stand[i] / bahn.strecke) * 100).toFixed(2) + '%',
                  background: p.farbe}} />
              </span>
            </div>
          ))}
        </div>
        <div className="rn-ruf">{ruf}</div>
      </div>

      {/* ── Das Feld ────────────────────────────────────────── */}
      <div className="rn-feld">
        {RN_STALL.map((p, i) => (
          <button type="button" key={p.nr} disabled={phase !== 'setzen'}
            className={'rn-pferd' + (wahl.includes(i) ? ' an' : '')
                       + (ergebnis && ergebnis.reihe[0] === i ? ' sieger' : '')}
            onClick={()=>waehlen(i)}>
            <span className="rn-decke" style={{background: p.farbe}}>{p.nr}</span>
            <span className="rn-name">{p.name}<i>{rnStil(p)}</i></span>
            <span className="rn-quote"><b>{quoten.sieg[i] || '—'}</b><i>Sieg</i></span>
            <span className="rn-quote leise"><b>{quoten.platz[i] || '—'}</b><i>Platz</i></span>
          </button>
        ))}
      </div>

      {/* ── Der Wettschein ──────────────────────────────────── */}
      <div className="rn-arten">
        {Object.keys(RN_ARTEN).map(k => (
          <button type="button" key={k} disabled={phase !== 'setzen'}
            className={'rn-art' + (art === k ? ' an' : '')}
            onClick={()=>{ setArt(k); setWahl([]); setMeldung(''); }}>
            {RN_ARTEN[k].titel}
          </button>
        ))}
        <span className="rn-hinweis">
          {wahl.length
            ? 'Gewählt: ' + wahl.map(nam).join(', ') + ' — noch ' + (artInfo.zahl - wahl.length) + '.'
            : artInfo.hinweis}
        </span>
      </div>

      <div className="automat-einsatz">
        <span className="automat-label">Einsatz</span>
        {einsaetze.map(n => (
          <button key={n} className={'automat-chip' + (satz === n ? ' aktiv' : '')}
            onClick={()=>setSatz(n)} disabled={n > marken || phase !== 'setzen'}>{n}</button>
        ))}
        <span className="rlt-summe">Im Spiel <b>{imSpiel}</b></span>
      </div>

      {wetten.length > 0 && !ergebnis && (
        <div className="rn-zettel">
          {wetten.map((w, i) => (
            <div className="rn-wette" key={i}>
              <span className="rn-w-art">{w.titel}</span>
              <span className="rn-w-text">{w.text}</span>
              <span className="rn-w-quote">{w.quote.toFixed(1)}</span>
              <span className="rn-w-satz">{w.satz}</span>
              <button className="rn-w-weg" onClick={()=>streichen(i)}
                disabled={phase !== 'setzen'} aria-label="Wette streichen">✕</button>
            </div>
          ))}
        </div>
      )}

      {ergebnis ? (
        <>
          <div className="rn-ergebnis">
            <div className="rn-erg-kopf">
              Zieleinlauf · {bahn.strecke} m in {ergebnis.zeit[ergebnis.reihe[0]].toFixed(1)} s
              {' · '}{ergebnis.abstand} Vorsprung
            </div>
            <div className="rn-erg-reihe">
              {ergebnis.reihe.map((i, platz) => (
                <span className={'rn-erg-pferd' + (platz < 3 ? ' vorn' : '')} key={i}>
                  <i style={{background: RN_STALL[i].farbe}}>{RN_STALL[i].nr}</i>
                  {platz + 1}. {nam(i)}<u>{ergebnis.zeit[i].toFixed(1)} s</u>
                </span>
              ))}
            </div>
            {ergebnis.zeilen.length > 0 && (
              <div className="rn-abrechnung">
                {ergebnis.zeilen.map((z, i) => (
                  <div className={'rlt-zeile' + (z.ok ? ' gut' : '')} key={i}>
                    <span>{z.titel} · {z.text} · {z.satz} × {z.quote.toFixed(1)}</span>
                    <b>{z.ok ? '+' + (z.gewinn - z.satz) : '−' + z.satz}</b>
                  </div>
                ))}
                <div className="rlt-zeile summe">
                  <span>{ergebnis.aus >= ergebnis.einsatz ? 'Gewonnen' : 'Verloren'}</span>
                  <b>{ergebnis.aus - ergebnis.einsatz >= 0 ? '+' : '−'}
                    {Math.abs(ergebnis.aus - ergebnis.einsatz)}</b>
                </div>
              </div>
            )}
          </div>
          <button className="automat-hebel" onClick={naechsterLauf}>Nächster Lauf</button>
        </>
      ) : (
        <div className="rlt-tasten">
          <button className="automat-hebel" onClick={starten}
            disabled={phase !== 'setzen' || !imSpiel}>
            {phase === 'laeuft' ? 'Sie laufen…' : 'Rennen starten'}
          </button>
          <button className="bj-taste" onClick={alleWeg}
            disabled={phase !== 'setzen' || !imSpiel}>Schein leeren</button>
        </div>
      )}

      {meldung && <div className="bj-melde leise">{meldung}</div>}
    </div>
  );
};
