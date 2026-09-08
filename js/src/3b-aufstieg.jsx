// Heldenbuch — der Stufenaufstieg.
//
// Ein Charakter wird einmal erstellt und fünfzehnmal aufgestiegen. Bis
// hierher war jeder Aufstieg Handarbeit: Trefferpunkte rechnen,
// Übungsbonus nachschlagen, Zauberplätze umstellen — zehn Minuten, in
// denen vier Leute warten, und regelmäßig wird etwas vergessen.
//
// Der Grundsatz des ganzen Fensters steht in der Vorschau: **erst
// zeigen, dann ändern.** Was nicht im Kasten steht, passiert nicht.
// Gerechnet wird dabei nicht hier, sondern in `aufstiegPlan` — dieselbe
// Funktion, die das Übernehmen benutzt. Die Vorschau kann deshalb nicht
// von dem abweichen, was danach im Bogen steht.

const AUFSTIEG_ASI = ['zwei', 'eins', 'talent'];

const StufenAufstieg = ({ char, onAbbrechen, onUebernehmen }) => {
  // Wer mehrere Klassen hat, steigt in einer davon auf — und welche das
  // ist, entscheidet alles Weitere: den Trefferwürfel, die Stufe, die
  // Attributssteigerung. Die Gesamtstufe ist die Summe und traegt den
  // Übungsbonus; das rechnet aufstiegPlan.
  const eigene = charKlassen(char);
  const [klasse, setKlasse] = React.useState(char.charClass);
  const dabei = eigene.find(k => k.charClass === klasse) || null;
  const regel = KLASSEN_REGELN[klasse] || null;
  const von   = dabei ? dabei.level : 0;
  const [ziel, setZiel] = React.useState(Math.min(20, von + 1));
  const stufen = Math.max(0, ziel - von);
  const weitere = Object.keys(KLASSEN_REGELN)
    .filter(n => !eigene.some(k => k.charClass === n));

  // Der Durchschnitt eines Trefferwürfels ist die Hälfte plus eins —
  // beim W10 also 6. So steht es im Regelwerk, und die meisten Runden
  // nehmen ihn, weil ein schlechter Wurf eine ganze Stufe lang wehtut.
  const kon = mod(+char.con || 10);
  const schnitt = regel ? Math.max(1, Math.floor(regel.tw / 2) + 1 + kon) : 0;
  const [art, setArt] = React.useState('schnitt');   // schnitt | wurf
  const [tpPlus, setTpPlus] = React.useState(schnitt * Math.max(1, stufen));
  const [gewuerfelt, setGewuerfelt] = React.useState(null);

  // Nichts ist vorgewählt. Eine vorgewählte Stärke landet sonst im
  // Bogen eines Magiers, weil jemand nur auf Übernehmen gedrückt hat —
  // der Assistent darf diese Wahl nicht für jemanden treffen.
  const [asiArt, setAsiArt] = React.useState(null);
  const [asiA, setAsiA] = React.useState('str');
  const [asiB, setAsiB] = React.useState('dex');

  // Ändert sich Klasse oder Ziel, stimmt der alte Betrag nicht mehr.
  React.useEffect(() => { setZiel(Math.min(20, von + 1)); }, [klasse]);
  React.useEffect(() => {
    setGewuerfelt(null); setArt('schnitt'); setAsiArt(null);
    setTpPlus(regel ? schnitt * stufen : 0);
  }, [klasse, ziel]);

  const wuerfeln = () => {
    let summe = 0; const einzeln = [];
    for (let i = 0; i < Math.max(1, stufen); i++) {
      const w = 1 + Math.floor(Math.random() * regel.tw);
      einzeln.push(w);
      summe += Math.max(1, w + kon);
    }
    setGewuerfelt(einzeln); setArt('wurf'); setTpPlus(summe);
  };

  // Gibt eine der gewonnenen Stufen eine Attributssteigerung?
  const asiStufen = [];
  if (regel) for (let s = von + 1; s <= ziel; s++) if (regel.asi.includes(s)) asiStufen.push(s);
  const asi = (!asiStufen.length || !asiArt || asiArt === 'talent') ? null
    : asiArt === 'zwei' ? {[asiA]: 2}
    : (asiA === asiB ? {[asiA]: 2} : {[asiA]: 1, [asiB]: 1});

  const plan = aufstiegPlan(char, {klasse, ziel, tpPlus, asi});
  const geht = ziel > von;

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">⇧ Stufenaufstieg — {char.name}</div>

        {/* Welche Klasse steigt auf? Bei einer einzigen steht sie nur
            da; ab der zweiten wird sie gewählt, und eine neue kommt aus
            der Liste daneben. */}
        {(eigene.length > 1 || weitere.length > 0) && (
          <div className="auf-klassen">
            {eigene.map(k => (
              <button type="button" key={k.charClass}
                className={'bj-taste' + (klasse === k.charClass ? ' haupt' : '')}
                onClick={()=>setKlasse(k.charClass)}>
                {k.charClass} {k.level}
              </button>
            ))}
            <select className="form-select auf-dazu" value={dabei ? '' : klasse}
              onChange={e=>{ if (e.target.value) setKlasse(e.target.value); }}>
              <option value="">+ Neue Klasse…</option>
              {weitere.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div className="auf-kopf">
          <span className="auf-klasse">{klasse}</span>
          <span className="auf-pfeil">{dabei ? 'Stufe ' + von + ' →' : 'neu, auf Stufe'}</span>
          <select className="form-select auf-ziel" value={ziel}
            onChange={e=>setZiel(+e.target.value)}>
            {Array.from({length:20}, (_, i) => i + 1)
              .filter(st => st > von)
              .map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          {eigene.length > 1 && (
            <span className="auf-gesamt">
              Gesamt {gesamtStufe(char)} → {gesamtStufe(char) + stufen}
            </span>
          )}
        </div>

        {/* ── Trefferpunkte ────────────────────────────────────── */}
        <div className="form-group form-full" style={{marginTop:14}}>
          <div className="form-label">Trefferpunkte</div>
          {regel ? (
            <>
              <div className="auf-tp">
                <button type="button" className={'bj-taste' + (art === 'schnitt' ? ' haupt' : '')}
                  onClick={()=>{setArt('schnitt'); setGewuerfelt(null); setTpPlus(schnitt * stufen);}}>
                  Durchschnitt
                </button>
                <button type="button" className={'bj-taste' + (art === 'wurf' ? ' haupt' : '')}
                  onClick={wuerfeln} disabled={stufen < 1}>
                  {gewuerfelt ? 'Nochmal würfeln' : 'Würfeln'} · W{regel.tw}
                </button>
                <label className="auf-zahl">
                  <span>{tpPlus >= 0 ? '+' : '−'}</span>
                  <ZahlFeld className="form-input" wert={Math.abs(tpPlus)}
                    onWert={v => setTpPlus(tpPlus < 0 ? -v : v)} />
                </label>
              </div>
              <div className="auf-hinweis">
                W{regel.tw} {kon >= 0 ? '+ ' + kon : '− ' + Math.abs(kon)} (Konstitution)
                {stufen > 1 ? ' · ' + stufen + ' Stufen' : ''}
                {gewuerfelt ? ' · gewürfelt: ' + gewuerfelt.join(', ') : ''}
                {' — die Zahl lässt sich ändern.'}
              </div>
            </>
          ) : (
            <div className="auf-hinweis">
              Ohne Trefferwürfel in den Tabellen rechnet hier niemand. Trag die
              Punkte ein, die dazukommen sollen.
              <div className="auf-tp" style={{marginTop:8}}>
                <label className="auf-zahl">
                  <span>+</span>
                  <ZahlFeld className="form-input" wert={Math.abs(tpPlus)}
                    onWert={v => setTpPlus(v)} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── Attributssteigerung ──────────────────────────────── */}
        {asiStufen.length > 0 && (
          <div className="form-group form-full">
            <div className="form-label">
              Attributssteigerung — {klasse} Stufe {asiStufen.join(' und ')}
            </div>
            <div className="auf-tp">
              {AUFSTIEG_ASI.map(k => (
                <button type="button" key={k} className={'bj-taste' + (asiArt === k ? ' haupt' : '')}
                  onClick={()=>setAsiArt(k)}>
                  {k === 'zwei' ? '+2 auf eines' : k === 'eins' ? '+1 auf zwei' : 'Talent'}
                </button>
              ))}
            </div>
            {asiArt && asiArt !== 'talent' && (
              <div className="auf-tp" style={{marginTop:6}}>
                <select className="form-select" value={asiA} onChange={e=>setAsiA(e.target.value)}>
                  {ATTR_WAHL.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
                </select>
                {asiArt === 'eins' && (
                  <select className="form-select" value={asiB} onChange={e=>setAsiB(e.target.value)}>
                    {ATTR_WAHL.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
                  </select>
                )}
              </div>
            )}
            {asiArt === 'talent' && (
              <div className="auf-hinweis">
                Talente stehen nicht in den Tabellen — trag es als Merkmal ein.
                Der Aufstieg lässt die Attribute dann in Ruhe.
              </div>
            )}
          </div>
        )}

        {/* ── Die Vorschau. Sie ist die ganze Sicherung. ───────── */}
        <div className="form-label" style={{marginTop:4}}>Das ändert sich</div>
        <div className="auf-vorschau">
          {plan.zeilen.length === 0
            ? <div className="auf-nichts">Nichts — die Stufe steht schon so da.</div>
            : plan.zeilen.map((z, i) => (
                <div className="auf-zeile" key={i}>
                  <span>{z.was}</span>
                  <b>{z.alt} <i>→</i> {z.neu}</b>
                </div>
              ))}
        </div>

        {plan.hinweise.length > 0 && (
          <div className="auf-warnung">
            {plan.hinweise.map((h, i) => <div key={i}>⚠ {h}</div>)}
          </div>
        )}

        <div className="form-actions" style={{marginTop:16}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={!geht || plan.zeilen.length === 0}
            onClick={()=>onUebernehmen(plan)}>
            Übernehmen
          </button>
        </div>
      </div>
    </Fenster>
  );
};
