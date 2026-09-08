// Heldenbuch — der Laden.
//
// Kaufen hiess bisher: im Inventar eine Zeile anlegen, im Beutel eine
// Zahl herunterrechnen, und beides von Hand in zwei Reitern. Verkaufen
// dasselbe rückwärts. Beides wird deshalb selten richtig gemacht.
//
// Die Spielleitung stellt zusammen, was ein Ort führt und zu welchem
// Teil er zurückkauft — der übliche halbe. Der Rest ist Rechnen, und
// das kann das Programm besser: bezahlt wird aus dem Kleingeld zuerst,
// und was zu viel hingelegt wurde, kommt als Wechselgeld zurück.

// Gold als Text, wie man es tippt: „2,5" sind 250 Kupfer.
const goldZuKupfer = (t) => {
  const n = Number(String(t).replace(',', '.'));
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
};
const kupferZuGold = (k) => String(Math.round((+k || 0)) / 100).replace('.', ',');

const LadenBearbeiten = ({ laden, onAbbrechen, onSpeichern }) => {
  const [name, setName] = React.useState((laden && laden.name) || 'Der Laden');
  const [kauf, setKauf] = React.useState(Math.round(((laden && laden.kauf) || 0.5) * 100));
  const [waren, setWaren] = React.useState(
    ((laden && laden.waren) || []).map(w => ({...w, gold: kupferZuGold(w.preis)}))
      .concat([{name:'', gold:'', notiz:''}]));

  const setZeile = (i, p) => setWaren(w => w.map((x, j) => j === i ? {...x, ...p} : x));
  const fertig = () => onSpeichern({
    name: name.trim() || 'Der Laden',
    kauf: Math.max(0, Math.min(100, kauf)) / 100,
    waren: waren.filter(w => (w.name || '').trim()).map((w, i) => ({
      id: w.id || ('w' + Date.now() + i),
      name: w.name.trim(), preis: goldZuKupfer(w.gold), notiz: (w.notiz || '').trim(),
    })),
  });

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">🏪 Was der Ort führt</div>
        <div className="beute-neu" style={{marginBottom:10}}>
          <input className="form-input" value={name} maxLength={60}
            placeholder="z.B. Bogens Krämerladen" onChange={e=>setName(e.target.value)} />
          <label className="auf-zahl">
            <span>kauft zu</span>
            <ZahlFeld className="form-input" min={0} max={100} wert={kauf} onWert={setKauf} />
            <span>%</span>
          </label>
        </div>

        <div className="ass-warum">Preise in Gold — „2,5" sind zwei Gold und fünf Silber.
          Eine Zeile ohne Namen fällt weg.</div>
        <div className="beute-zeilen laden-bearbeiten">
          {waren.map((w, i) => (
            <div className="beute-neu" key={i}>
              <input className="form-input" value={w.name} maxLength={80} placeholder="Ware"
                onChange={e=>setZeile(i, {name: e.target.value})} />
              <input className="form-input laden-preis" value={w.gold} placeholder="GM"
                onChange={e=>setZeile(i, {gold: e.target.value})} />
              <input className="form-input" value={w.notiz || ''} maxLength={120} placeholder="Notiz"
                onChange={e=>setZeile(i, {notiz: e.target.value})} />
              <button className="konz-weg" title="Zeile weg"
                onClick={()=>setWaren(x => x.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="bj-taste" onClick={()=>setWaren(w => [...w, {name:'', gold:'', notiz:''}])}>
            + Noch eine Zeile
          </button>
        </div>

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={fertig}>Speichern</button>
        </div>
      </div>
    </Fenster>
  );
};

const LadenFenster = ({ laden, helden, isDmMode, onKaufen, onVerkaufen,
                        onBearbeiten, onSchliessen }) => {
  const [wer, setWer] = React.useState((helden[0] || {}).id || '');
  const [preise, setPreise] = React.useState({});      // was für ein Stück geboten wird
  const held = helden.find(h => h.id === wer) || null;
  const beutel = (held && held.currency) || {pp:0,gp:0,ep:0,sp:0,cp:0};
  const habe = muenzenSumme(beutel);
  const waren = (laden && laden.waren) || [];
  const kauf = (laden && laden.kauf) || 0;

  // Was der Laden für ein Stück aus dem Inventar bietet: der Anteil vom
  // Ladenpreis, wenn er die Ware führt — sonst muss jemand eine Zahl
  // hinschreiben, und das ist die Spielleitung.
  const gebot = (i) => {
    if (preise[i.id] !== undefined) return goldZuKupfer(preise[i.id]);
    const w = waren.find(x => x.name.toLowerCase() === (i.name || '').toLowerCase());
    return w ? Math.round(w.preis * kauf) : 0;
  };

  return (
    <Fenster onClick={onSchliessen}>
      <div className="form-modal laden-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">🏪 {(laden && laden.name) || 'Der Laden'}</div>

        {helden.length > 1 && (
          <div className="form-group form-full">
            <div className="form-label">Wer kauft</div>
            <select className="form-select" value={wer} onChange={e=>setWer(e.target.value)}>
              {helden.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}

        {held && (
          <div className="laden-beutel">
            <span>{held.name} hat</span>
            <b>{preisText(habe)}</b>
          </div>
        )}

        <div className="form-label" style={{marginTop:10}}>Auslage</div>
        <div className="beute-liste">
          {waren.length === 0 && <div className="probe-leer">Der Ort führt noch nichts.</div>}
          {waren.map(w => {
            const reicht = habe >= w.preis;
            return (
              <div className="beute-stueck" key={w.id}>
                <div className="beute-was">
                  <b>{w.name}</b>
                  {w.notiz && <i>{w.notiz}</i>}
                </div>
                <span className="laden-schild">{preisText(w.preis)}</span>
                <button className="bj-taste" disabled={!held || !reicht}
                  title={reicht ? '' : 'Dafür reicht der Beutel nicht'}
                  onClick={()=>onKaufen(held, w)}>Kaufen</button>
              </div>
            );
          })}
        </div>

        {held && (held.inventory || []).length > 0 && kauf > 0 && (
          <>
            <div className="form-label" style={{marginTop:12}}>
              Verkaufen — der Ort zahlt {Math.round(kauf * 100)} %
            </div>
            <div className="beute-liste">
              {(held.inventory || []).map(i => {
                const g = gebot(i);
                return (
                  <div className="beute-stueck" key={i.id}>
                    <div className="beute-was">
                      <b>{i.name}{(+i.qty || 1) > 1 ? ' ×' + i.qty : ''}</b>
                    </div>
                    <input className="form-input laden-preis"
                      value={preise[i.id] !== undefined ? preise[i.id] : kupferZuGold(g)}
                      onChange={e=>setPreise(p => ({...p, [i.id]: e.target.value}))} />
                    <button className="bj-taste" disabled={g <= 0}
                      title={g > 0 ? '' : 'Wofür denn? Trag einen Preis ein.'}
                      onClick={()=>onVerkaufen(held, i, g)}>Verkaufen</button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="form-actions" style={{marginTop:14}}>
          {isDmMode && (
            <button className="btn-cancel" style={{marginRight:'auto'}}
              onClick={onBearbeiten}>Auslage ändern</button>
          )}
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
      </div>
    </Fenster>
  );
};
