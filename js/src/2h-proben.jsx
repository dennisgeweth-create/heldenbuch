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

const ProbenAnsage = ({ helden, onAbbrechen, onAnsagen }) => {
  const [art, setArt] = React.useState('fert');
  const [wert, setWert] = React.useState('aufmerksamkeit');
  const [sg, setSg] = React.useState(15);
  const [verdeckt, setVerdeckt] = React.useState(false);
  const [text, setText] = React.useState('');
  // Wen es angeht. Leer heisst alle — so war es bisher, und so bleibt es,
  // solange niemand jemanden anklickt.
  const [fuer, setFuer] = React.useState([]);
  const [geheim, setGeheim] = React.useState(false);
  const alle = helden || [];
  const um = (id) => setFuer(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  // Geheim geht nur an Genannte: ein Geheimnis vor allen ist keines.
  const geheimGeht = fuer.length > 0;

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

        {alle.length > 0 && (
          <div className="form-group form-full">
            <div className="form-label">
              Wer würfelt {fuer.length === 0 ? '— niemand angetippt heißt: alle' : ''}
            </div>
            <div className="ass-tasten">
              <button type="button" className={'bj-taste' + (fuer.length === 0 ? ' haupt' : '')}
                onClick={()=>{setFuer([]); setGeheim(false);}}>Alle</button>
              {alle.map(h => (
                <button type="button" key={h.id}
                  className={'bj-taste' + (fuer.includes(h.id) ? ' haupt' : '')}
                  onClick={()=>um(h.id)}>{h.name}</button>
              ))}
            </div>
          </div>
        )}

        <label className="pk-trips" style={{marginTop:4}}>
          <input type="checkbox" checked={verdeckt} onChange={e=>setVerdeckt(e.target.checked)} />
          <span>
            <b>Verdeckt</b> — der Schwierigkeitsgrad steht nicht dabei, und niemand
            erfährt, ob er bestanden hat.
            <i>Für alles, wo schon das Ergebnis etwas verrät.</i>
          </span>
        </label>

        {/* Verdeckt heisst: du weisst nicht, ob du bestanden hast.
            Geheim heisst: die anderen wissen nicht einmal, dass du
            gewuerfelt hast. Das ist ein Unterschied, und deshalb sind es
            zwei Haken. */}
        <label className={'pk-trips' + (geheimGeht ? '' : ' aus')} style={{marginTop:4}}>
          <input type="checkbox" checked={geheim && geheimGeht} disabled={!geheimGeht}
            onChange={e=>setGeheim(e.target.checked)} />
          <span>
            <b>Geheim</b> — nur die Genannten sehen die Probe überhaupt.
            <i>{geheimGeht
              ? 'Der Rest des Tisches merkt nicht, dass gewürfelt wurde — '
                + 'geworfen wird deshalb im Gerät, mit einem Knopf statt eines Würfels.'
              : 'Dafür muss oben jemand angetippt sein — ein Geheimnis vor allen ist keines.'}</i>
          </span>
        </label>

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save"
            onClick={()=>onAnsagen({art, wert, sg, verdeckt, text, fuer,
                                    geheim: geheim && geheimGeht})}>
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

const ProbenBalken = ({ probe, meine, isDmMode, setDefs, onAntwort, onAbraeumen,
                       onNachricht }) => {
  const [wuerfe, setWuerfe] = React.useState({});
  const [zu, setZu] = React.useState(false);
  // Was die Spielleitung hinterher an einzelne schicken will.
  const [post, setPost] = React.useState(null);   // {an:[], text, bild}
  const [sendet, setSendet] = React.useState(false);
  React.useEffect(() => { setWuerfe({}); setZu(false); setPost(null); }, [probe && probe.id]);
  if (!probe) return null;

  // Wer gefragt ist. Leer heisst alle — dann gilt die Zeile fuer jeden
  // eigenen Bogen wie bisher.
  const gefragt = (probe.fuer || []).length
    ? meine.filter(c => probe.fuer.includes(c.id)) : meine;

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

      {/* Die eigenen Helden: einer je Zeile, mit dem Bonus aus dem Bogen.
          Sind einzelne genannt, stehen auch nur die da — wer nicht
          gefragt ist, soll nicht mitwürfeln. */}
      {gefragt.map(c => {
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
            ) : probe.geheim ? (
              // Ein geheimer Wurf wird hier geworfen, nicht auf dem
              // Tisch. Genau das ist der Sinn: wer den Würfel nimmt,
              // fällt auf — und dann weiss der ganze Tisch, dass etwas
              // gefragt wurde. Deshalb steht hier ein Knopf und kein
              // Feld; einzutragen gibt es nichts.
              <button className="btn-save probe-melden"
                onClick={()=>onAntwort(c, w20(), b)}>🎲 Würfeln</button>
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

      {/* Was die Spielleitung hinterher geschickt hat — und zwar nur an
          die, die es angeht. Wer nicht dabeisteht, bekommt es gar nicht
          erst zugestellt; das entscheidet der Server. */}
      {!isDmMode && (probe.nachrichten || []).map(n => (
        <div className="probe-post" key={n.id}>
          {n.text && <div className="probe-post-text">{n.text}</div>}
          {n.bild && <img className="probe-post-bild" src={n.bild} alt="" />}
        </div>
      ))}

      {/* Die Spielleitung sieht, wer geantwortet hat und wer nicht. */}
      {isDmMode && (() => {
        const antworten = probe.antworten || [];
        const bestanden = antworten.filter(a => (a.wurf + a.bonus) >= probe.sg);
        return (
          <div className="probe-liste">
            {antworten.length === 0
              ? <div className="probe-leer">Noch hat niemand gewürfelt.</div>
              : antworten.map((a, i) => {
                  const g = a.wurf + a.bonus;
                  const drin = post && post.an.includes(a.charId);
                  return (
                    <div className={'probe-erg-zeile' + (g >= probe.sg ? ' gut' : ' schlecht')
                        + (drin ? ' gewaehlt' : '')} key={i}
                      onClick={post ? ()=>setPost(p => ({...p,
                        an: p.an.includes(a.charId) ? p.an.filter(x => x !== a.charId)
                                                    : [...p.an, a.charId]})) : undefined}
                      style={post ? {cursor:'pointer'} : undefined}>
                      <span>{post ? (drin ? '☑ ' : '☐ ') : ''}{a.name || '—'}</span>
                      <b>{g}{g >= probe.sg ? ' ✓' : ' ✗'}</b>
                    </div>
                  );
                })}

            {/* Was nur die sehen, die es geschafft haben. */}
            {onNachricht && !post && antworten.length > 0 && (
              <button className="bj-taste" style={{marginTop:6}}
                onClick={()=>setPost({an: bestanden.map(a => a.charId), text: '', bild: ''})}>
                ✉ Etwas an einzelne schicken
              </button>
            )}
            {post && (
              <div className="probe-postform">
                <div className="probe-postform-kopf">
                  {post.an.length === 0 ? 'Niemand gewählt'
                    : post.an.length + (post.an.length === 1 ? ' Empfänger' : ' Empfänger')
                      + ' — oben antippen ändert das'}
                </div>
                <textarea className="form-input" rows={3} maxLength={1200}
                  placeholder="Was nur die sehen, die es geschafft haben."
                  value={post.text} onChange={e=>setPost(p=>({...p, text:e.target.value}))} />
                <BildAblage bild={post.bild} maxPx={900} hoehe={post.bild ? 150 : 62}
                  aufschrift={post.bild ? '🖼 Anderes Bild' : '🖼 Bild dazu'}
                  onBild={(d)=>setPost(p=>p && ({...p, bild: d || ''}))}
                  onWeg={()=>setPost(p=>({...p, bild:''}))} />
                <div className="probe-postform-tasten">
                  <button className="bj-taste" onClick={()=>setPost(null)}>Abbrechen</button>
                  <button className="btn-save"
                    disabled={sendet || !post.an.length || (!post.text.trim() && !post.bild)}
                    onClick={async ()=>{
                      setSendet(true);
                      const ok = await onNachricht(post.an, post.text.trim(), post.bild);
                      setSendet(false);
                      if (ok) setPost(null);
                    }}>{sendet ? 'Sendet…' : 'Senden'}</button>
                </div>
              </div>
            )}

            <button className="bj-taste" style={{marginTop:6}} onClick={onAbraeumen}>Abräumen</button>
          </div>
        );
      })()}
    </div>
  );
};
