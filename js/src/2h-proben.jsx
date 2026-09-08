// Heldenbuch — Proben auf Ansage.
//
// „Alle einen Wurf auf Wahrnehmung." Bis hierher hiess das: reihum
// fragen, Zahlen sammeln, im Kopf vergleichen. Dabei lag die Maschinerie
// schon da — der Kampf sagt seit v4.8 in zwei Sekunden „du bist dran".
//
// Es gibt immer nur **eine** Ansage je Abenteuer; die nächste löst die
// vorige ab. Und sie verfällt nach einer Viertelstunde von selbst: eine
// offene Probe, die niemand mehr beantwortet, darf den Tisch nicht
// blockieren.
//
// Gewürfelt wird nicht hier. Wer am Tisch sitzt, würfelt mit der Hand;
// das Feld nimmt die Zahl. Was das Heldenbuch beiträgt, ist der
// Modifikator — und zwar der aus dem Bogen, mit Übung, Expertise und
// allem, was daran hängt.

const ProbenAnsage = ({ onAbbrechen, onAnsagen }) => {
  const [art, setArt] = React.useState('fert');
  const [wert, setWert] = React.useState('aufmerksamkeit');
  const [sg, setSg] = React.useState(15);
  const [verdeckt, setVerdeckt] = React.useState(false);
  const [text, setText] = React.useState('');

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">🎲 Probe ansagen</div>

        <div className="ass-tasten">
          <button type="button" className={'bj-taste' + (art === 'fert' ? ' haupt' : '')}
            onClick={()=>{setArt('fert'); setWert('aufmerksamkeit');}}>Fertigkeit</button>
          <button type="button" className={'bj-taste' + (art === 'rw' ? ' haupt' : '')}
            onClick={()=>{setArt('rw'); setWert('dex');}}>Rettungswurf</button>
        </div>

        <div className="form-group form-full">
          <div className="form-label">{art === 'fert' ? 'Worauf' : 'Welcher Rettungswurf'}</div>
          <select className="form-select" value={wert} onChange={e=>setWert(e.target.value)}>
            {art === 'fert'
              ? SKILLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)
              : ATTR_WAHL.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
          </select>
        </div>

        <div className="form-group form-full">
          <div className="form-label">Schwierigkeitsgrad</div>
          <div className="ass-tasten">
            {[5,10,15,20,25].map(n => (
              <button type="button" key={n} className={'bj-taste' + (sg === n ? ' haupt' : '')}
                onClick={()=>setSg(n)}>{n}</button>
            ))}
            <label className="auf-zahl">
              <span>SG</span>
              <ZahlFeld className="form-input" wert={sg} onWert={v=>setSg(v)} />
            </label>
          </div>
        </div>

        <div className="form-group form-full">
          <div className="form-label">Wozu (steht bei den Spielern dabei)</div>
          <input className="form-input" value={text} maxLength={160}
            placeholder="z.B. Ist hier jemand vor uns durchgegangen?"
            onChange={e=>setText(e.target.value)} />
        </div>

        <label className="pk-trips" style={{marginTop:4}}>
          <input type="checkbox" checked={verdeckt} onChange={e=>setVerdeckt(e.target.checked)} />
          <span>
            <b>Verdeckt</b> — der Schwierigkeitsgrad steht nicht dabei, und niemand
            erfährt, ob er bestanden hat.
            <i>Für alles, wo schon das Ergebnis etwas verrät.</i>
          </span>
        </label>

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={()=>onAnsagen({art, wert, sg, verdeckt, text})}>
            Ansagen
          </button>
        </div>
      </div>
    </Fenster>
  );
};

// Was in der Ansage steht, in Worten.
const probeWort = (p) => {
  if (!p) return '';
  return p.art === 'rw'
    ? ((ATTR_WAHL.find(a => a.k === p.wert) || {}).l || p.wert) + '-Rettungswurf'
    : ((SKILLS.find(s => s.key === p.wert) || {}).label || p.wert);
};

const ProbenBalken = ({ probe, meine, isDmMode, setDefs, onAntwort, onAbraeumen }) => {
  const [wuerfe, setWuerfe] = React.useState({});
  const [zu, setZu] = React.useState(false);
  React.useEffect(() => { setWuerfe({}); setZu(false); }, [probe && probe.id]);
  if (!probe) return null;

  const bonusVon = (c) => {
    const w = charWerte(c, setDefs);
    if (!w) return 0;
    return probe.art === 'rw' ? (w.saves[probe.wert] || 0) : (w.skills[probe.wert] || 0);
  };
  const antwortVon = (id) => (probe.antworten || []).find(a => a.charId === id) || null;

  if (zu) {
    return (
      <button className="probe-knopf" onClick={()=>setZu(false)}>
        🎲 {probeWort(probe)}
      </button>
    );
  }

  return (
    <div className="probe-balken">
      <div className="probe-kopf">
        <span className="probe-titel">🎲 {probeWort(probe)}</span>
        {(!probe.verdeckt || isDmMode) && <span className="probe-sg">SG {probe.sg}</span>}
        {probe.verdeckt && <span className="probe-sg verdeckt">verdeckt</span>}
        <button className="automat-x" onClick={()=>setZu(true)} title="Einklappen">▾</button>
      </div>
      {probe.text && <div className="probe-text">{probe.text}</div>}

      {/* Die eigenen Helden: einer je Zeile, mit dem Bonus aus dem Bogen. */}
      {meine.map(c => {
        const a = antwortVon(c.id);
        const b = bonusVon(c);
        const gesamt = a ? a.wurf + a.bonus : null;
        const gut = a && !probe.verdeckt ? gesamt >= probe.sg : null;
        return (
          <div className="probe-zeile" key={c.id}>
            <span className="probe-name">{c.name}</span>
            <span className="probe-bonus">{b >= 0 ? '+' + b : b}</span>
            {a ? (
              <span className={'probe-erg' + (gut === null ? '' : gut ? ' gut' : ' schlecht')}>
                {a.wurf} {a.bonus >= 0 ? '+' : '−'} {Math.abs(a.bonus)} = <b>{gesamt}</b>
                {gut === null ? '' : gut ? ' ✓' : ' ✗'}
              </span>
            ) : (
              <>
                {/* sofort: sonst meldet das Feld erst beim Verlassen, und
                    der erste Klick auf „Melden“ träfe einen Knopf, der
                    in diesem Augenblick noch gesperrt ist. */}
                <ZahlFeld className="form-input probe-feld" sofort
                  wert={wuerfe[c.id] || ''} min={-20} max={99}
                  onWert={v=>setWuerfe(w => ({...w, [c.id]: v}))} />
                <button className="btn-save probe-melden"
                  disabled={!wuerfe[c.id]}
                  onClick={()=>onAntwort(c, wuerfe[c.id], b)}>Melden</button>
              </>
            )}
          </div>
        );
      })}

      {/* Die Spielleitung sieht, wer geantwortet hat und wer nicht. */}
      {isDmMode && (
        <div className="probe-liste">
          {(probe.antworten || []).length === 0
            ? <div className="probe-leer">Noch hat niemand gewürfelt.</div>
            : (probe.antworten || []).map((a, i) => {
                const g = a.wurf + a.bonus;
                return (
                  <div className={'probe-erg-zeile' + (g >= probe.sg ? ' gut' : ' schlecht')} key={i}>
                    <span>{a.name || '—'}</span>
                    <b>{g}{g >= probe.sg ? ' ✓' : ' ✗'}</b>
                  </div>
                );
              })}
          <button className="bj-taste" style={{marginTop:6}} onClick={onAbraeumen}>Abräumen</button>
        </div>
      )}
    </div>
  );
};
