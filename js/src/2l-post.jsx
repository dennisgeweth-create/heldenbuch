// Heldenbuch — Post an die Spielleitung.
//
// Am Tisch schiebt man der Spielleitung einen Zettel hin: „Ich stecke den
// Ring ein, bevor die anderen hinsehen." Im Kampf geht das über die Ansage
// mit dem Schloss; hier geht es jederzeit — auch zwischen zwei Sitzungen.
//
// Was geschrieben ist, liegt auf dem Server (hb_post) und nicht in der
// Bibliothek: die sieht jede Spielleitung der Gruppe und wird als ein Stück
// gespeichert. Der Server entscheidet auch, wer was liest — die Runde sieht
// nur ihre eigenen Zettel, die Spielleitung alle aus ihrem Abenteuer.

// Wann ein Zettel kam, so, wie man es am Tisch sagt.
const postZeit = (sek) => {
  if (!sek) return '';
  const d = new Date(sek * 1000);
  const heute = new Date();
  const gleicherTag = d.toDateString() === heute.toDateString();
  return gleicherTag
    ? 'heute ' + d.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})
    : d.toLocaleDateString('de-DE', {weekday: 'short', day: 'numeric', month: 'numeric'})
      + ' ' + d.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
};

// Die Seite des Spielers: schreiben, und sehen, was aus den eigenen
// Zetteln geworden ist.
const PostFenster = ({ helden, post, onSenden, onZuruecknehmen, onSchliessen }) => {
  const [wer, setWer] = React.useState((helden[0] || {}).id || '');
  const [text, setText] = React.useState('');
  const [laeuft, setLaeuft] = React.useState(false);
  const [meldung, setMeldung] = React.useState(null);

  const senden = async () => {
    if (!text.trim() || !wer) return;
    setLaeuft(true);
    const fehler = await onSenden(wer, text.trim());
    setLaeuft(false);
    if (fehler) { setMeldung({gut: false, text: fehler}); return; }
    setText('');
    setMeldung({gut: true, text: 'Liegt bei der Spielleitung. Die Runde sieht davon nichts.'});
  };

  return (
    <Fenster onClick={onSchliessen} leiste={{id: 'post', titel: 'An die Spielleitung', symbol: '✉'}}>
      <div className="form-modal post-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">✉ An die Spielleitung</div>
        <div className="post-wink">
          Nur die Spielleitung liest das — für heimliche Handgriffe, Fragen unter vier Augen,
          einen Plan, den die anderen noch nicht kennen sollen.
        </div>

        {helden.length > 1 && (
          <div className="form-group form-full">
            <div className="form-label">Wer schreibt</div>
            <select className="form-select" value={wer} onChange={e=>setWer(e.target.value)}>
              {helden.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        <textarea className="form-input post-text" value={text} maxLength={1000} rows={5}
          aria-label="Nachricht an die Spielleitung"
          placeholder="Während die anderen streiten, stecke ich den Schlüssel vom Tisch ein."
          onChange={e=>{ setText(e.target.value); setMeldung(null); }} />
        {meldung && <div className={'post-meldung' + (meldung.gut ? ' gut' : ' weg')}>{meldung.text}</div>}

        {post.length > 0 && (
          <>
            <div className="form-label" style={{marginTop:12}}>Deine Zettel</div>
            <div className="post-liste">
              {post.map(p => (
                <div className={'post-zettel' + (p.gelesen ? ' gelesen' : '')} key={p.id}>
                  <div className="post-kopf">
                    <b>{p.name || 'Held'}</b>
                    <span>{postZeit(p.zeit)}</span>
                    <span className="post-stand">{p.gelesen ? '✓ gelesen' : 'noch ungelesen'}</span>
                    {!p.gelesen && (
                      <button className="konz-weg" title="Zurücknehmen"
                        onClick={()=>onZuruecknehmen(p.id)}>✕</button>
                    )}
                  </div>
                  <div className="post-inhalt">{p.text}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
          <button className="btn-save" disabled={!text.trim() || !wer || laeuft} onClick={senden}>
            {laeuft ? 'Wird gesendet…' : '✉ Senden'}
          </button>
        </div>
      </div>
    </Fenster>
  );
};

// Die Seite der Spielleitung: was gekommen ist, das Ungelesene oben.
const PostfachFenster = ({ post, onGelesen, onLoeschen, onSchliessen }) => {
  const sortiert = [...post].sort((a, b) => (a.gelesen - b.gelesen) || (b.zeit - a.zeit));
  return (
    <Fenster onClick={onSchliessen}
      leiste={{id: 'post', titel: 'Post', symbol: '✉', zaehler: post.filter(p => !p.gelesen).length || ''}}>
      <div className="form-modal post-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">✉ Post von der Runde</div>
        <div className="post-liste">
          {sortiert.length === 0 && <div className="probe-leer">Noch kein Zettel gekommen.</div>}
          {sortiert.map(p => (
            <div className={'post-zettel' + (p.gelesen ? ' gelesen' : ' neu')} key={p.id}>
              <div className="post-kopf">
                <b>{p.name || 'Held'}</b>
                <span>{postZeit(p.zeit)}</span>
                <button className="bj-taste" onClick={()=>onGelesen(p.id, !p.gelesen)}>
                  {p.gelesen ? 'Wieder ungelesen' : '✓ Gelesen'}</button>
                <button className="konz-weg" title="Wegwerfen" onClick={()=>onLoeschen(p.id)}>✕</button>
              </div>
              <div className="post-inhalt">{p.text}</div>
            </div>
          ))}
        </div>
        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
      </div>
    </Fenster>
  );
};
