// Heldenbuch — Post.
//
// Am Tisch schiebt man einen Zettel hin: der Spielleitung „Ich stecke den
// Ring ein, bevor die anderen hinsehen", einem Mitspieler „Lenk du die
// Wache ab", und die Spielleitung einem Helden „Du erkennst das Wappen.
// Es ist das deiner Mutter." Hier geht das jederzeit, auch zwischen zwei
// Sitzungen — und es sieht aus wie ein Messenger: je Gegenüber eine
// Unterhaltung, die eigenen Zettel rechts, die anderen links.
//
// Was geschrieben ist, liegt auf dem Server (hb_post), nicht in der
// Bibliothek. Der Server entscheidet, wer was liest: jeder, was an ihn
// ging und was er schrieb; die Spielleitung dazu alles an die
// Spielleitung. Was zwei Spieler einander schreiben, liest sie nicht.
//
// Ein Zettel kommt so an: {id, von: {charId, name}, an: {charId, name},
// text, gelesen, zeit, eingang, eigen}. charId leer heisst: die
// Spielleitung.

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
const postUhr = (sek) => sek
  ? new Date(sek * 1000).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : '';
const postTag = (sek) => {
  if (!sek) return '';
  const d = new Date(sek * 1000), h = new Date();
  const gestern = new Date(h); gestern.setDate(h.getDate() - 1);
  if (d.toDateString() === h.toDateString()) return 'Heute';
  if (d.toDateString() === gestern.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', {weekday: 'long', day: 'numeric', month: 'long'});
};

// Was als ungelesen zaehlt: was bei einem ankam, nie das Eigene.
const postUngelesenFuer = (post) => (post || []).filter(p => p.eingang && !p.gelesen).length;

// Mit wem ein Zettel gewechselt wurde — von der eigenen Seite aus.
const postGegenueber = (p) => (p.eigen ? p.an : p.von) || {charId: '', name: 'Spielleitung'};
const postSchluessel = (g) => (g && g.charId) || 'sl';

// Die Zettel als Unterhaltungen: je Gegenüber eine, die neueste oben,
// darin die Zettel der Zeit nach.
const postGespraeche = (post) => {
  const je = {};
  (post || []).forEach(p => {
    const g = postGegenueber(p);
    const k = postSchluessel(g);
    const u = je[k] || (je[k] = {schluessel: k, charId: g.charId || '', name: g.name || (k === 'sl' ? 'Spielleitung' : 'Held'),
                                 zettel: [], ungelesen: 0, zuletzt: 0});
    u.zettel.push(p);
    if (p.eingang && !p.gelesen) u.ungelesen++;
    if ((p.zeit || 0) >= u.zuletzt) { u.zuletzt = p.zeit || 0; if (g.name) u.name = g.name; }
  });
  return Object.values(je)
    .map(u => ({...u, zettel: u.zettel.slice().sort((a, b) => (a.zeit - b.zeit) || (a.id - b.id))}))
    .sort((a, b) => b.zuletzt - a.zuletzt);
};

// Mit welchem eigenen Helden man in einer Unterhaltung schreibt: mit dem,
// der zuletzt darin vorkam — sonst mit dem ersten.
const postMeinHeld = (gespraech, meine) => {
  const ids = (meine || []).map(h => h.id);
  const zettel = ((gespraech && gespraech.zettel) || []).slice().reverse();
  for (const p of zettel) {
    const mein = p.eigen ? p.von : p.an;
    if (mein && ids.includes(mein.charId)) return mein.charId;
  }
  return ids[0] || '';
};

const postZeichen = (name, sl) => sl ? '🔮' : ((name || '?').trim()[0] || '?').toUpperCase();

// ── Das Fenster ─────────────────────────────────────────────────
//   dm       ob hier die Spielleitung sitzt (sie schreibt als Spielleitung)
//   meine    die eigenen Helden — als einer von ihnen schreibt ein Spieler
//   partner  an wen man schreiben kann: [{charId, name}], charId '' = Spielleitung
const PostFenster = ({ post, dm, meine, partner, onSchreiben, onGelesen, onLoeschen, onSchliessen }) => {
  const gespraeche = postGespraeche(post);
  const [offen, setOffen] = React.useState(null);           // Schluessel der offenen Unterhaltung
  const [waehlen, setWaehlen] = React.useState(false);      // „Neue Unterhaltung"
  const [text, setText] = React.useState('');
  const [als, setAls] = React.useState('');
  const [laeuft, setLaeuft] = React.useState(false);
  const [fehler, setFehler] = React.useState(null);
  const verlauf = React.useRef(null);

  // Am breiten Schirm ist gleich die neueste Unterhaltung offen.
  React.useEffect(() => {
    if (offen || !gespraeche.length) return;
    if (!window.matchMedia || !window.matchMedia('(max-width: 700px)').matches) setOffen(gespraeche[0].schluessel);
  }, [gespraeche.length]);

  const g = gespraeche.find(x => x.schluessel === offen)
    || (offen ? (() => { const p = partner.find(x => postSchluessel(x) === offen);
                         return p ? {schluessel: offen, charId: p.charId, name: p.name, zettel: [], ungelesen: 0} : null; })()
              : null);
  const meinHeld = als || postMeinHeld(g, meine);

  // Was offen vor einem liegt, ist gelesen — der Absender sieht seine
  // zwei Häkchen. Auch, was kommt, während die Unterhaltung offen ist.
  const ungelesen = g ? g.zettel.filter(p => p.eingang && !p.gelesen).map(p => p.id).join(',') : '';
  React.useEffect(() => {
    if (ungelesen && onGelesen) ungelesen.split(',').forEach(id => onGelesen(+id, true));
  }, [ungelesen]);
  // Immer unten, wie in jedem Messenger.
  const anzahl = g ? g.zettel.length : 0;
  React.useEffect(() => {
    const el = verlauf.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [offen, anzahl]);
  React.useEffect(() => { setText(''); setFehler(null); setAls(''); }, [offen]);

  const senden = async () => {
    const t = text.trim();
    if (!t || !g || laeuft) return;
    setLaeuft(true); setFehler(null);
    const teil = g.charId ? {an: [g.charId], char_id: dm ? '' : meinHeld, text: t}
                          : {an_sl: true, char_id: meinHeld, text: t};
    const f = await onSchreiben(teil);
    setLaeuft(false);
    if (f) { setFehler(f); return; }
    setText('');
  };
  const taste = (e) => {
    // Eingabe schickt ab, Umschalt+Eingabe macht eine neue Zeile.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); senden(); }
  };
  const kannSchreiben = !!g && (dm || !!meinHeld);
  const neuWahl = partner.filter(p => !gespraeche.some(x => x.schluessel === postSchluessel(p)));

  return (
    <Fenster onClick={onSchliessen}
      leiste={{id: 'post', titel: 'Post', symbol: '✉', zaehler: postUngelesenFuer(post) || ''}}>
      <div className="form-modal post-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">✉ Post</div>
        <div className={'chat' + (g || waehlen ? ' offen' : '')}>

          {/* Die Unterhaltungen */}
          <div className="chat-liste">
            <button type="button" className="chat-neu" onClick={()=>{ setWaehlen(true); setOffen(null); }}>
              ✎ Neue Unterhaltung</button>
            {gespraeche.length === 0 && !waehlen && (
              <div className="chat-leer">Noch keine Post. Schreib jemandem — die anderen sehen davon nichts.</div>
            )}
            {gespraeche.map(u => {
              const letzte = u.zettel[u.zettel.length - 1];
              return (
                <button type="button" key={u.schluessel}
                  className={'chat-eintrag' + (u.schluessel === offen ? ' an' : '') + (u.ungelesen ? ' neu' : '')}
                  onClick={()=>{ setOffen(u.schluessel); setWaehlen(false); }}>
                  <span className={'chat-bild' + (u.charId ? '' : ' sl')}>{postZeichen(u.name, !u.charId)}</span>
                  <span className="chat-mitte">
                    <b>{u.name}</b>
                    <i>{letzte ? (letzte.eigen ? 'Du: ' : '') + letzte.text : ''}</i>
                  </span>
                  <span className="chat-rechts">
                    <small>{letzte ? postZeit(letzte.zeit).replace('heute ', '') : ''}</small>
                    {u.ungelesen > 0 && <em>{u.ungelesen}</em>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Neue Unterhaltung: an wen */}
          {waehlen && !g && (
            <div className="chat-verlauf">
              <div className="chat-kopf">
                <button type="button" className="chat-zurueck" aria-label="Zurück" onClick={()=>setWaehlen(false)}>←</button>
                <b>An wen?</b>
              </div>
              <div className="chat-wahl">
                {partner.length === 0 && <div className="chat-leer">Niemand da, dem man schreiben könnte — ein Held muss einem Konto gehören.</div>}
                {[...neuWahl, ...partner.filter(p => !neuWahl.includes(p))].map(p => (
                  <button type="button" key={postSchluessel(p)} className="chat-eintrag"
                    onClick={()=>{ setOffen(postSchluessel(p)); setWaehlen(false); }}>
                    <span className={'chat-bild' + (p.charId ? '' : ' sl')}>{postZeichen(p.name, !p.charId)}</span>
                    <span className="chat-mitte"><b>{p.name}</b>
                      <i>{p.charId ? '' : 'Nur die Spielleitung liest es'}</i></span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Der Verlauf */}
          {g && (
            <div className="chat-verlauf">
              <div className="chat-kopf">
                <button type="button" className="chat-zurueck" aria-label="Zurück" onClick={()=>setOffen(null)}>←</button>
                <span className={'chat-bild' + (g.charId ? '' : ' sl')}>{postZeichen(g.name, !g.charId)}</span>
                <b>{g.name}</b>
                {!dm && meine.length > 1 && (
                  <label className="chat-als">als
                    <select className="form-select" value={meinHeld} onChange={e=>setAls(e.target.value)}>
                      {meine.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <div className="chat-blasen" ref={verlauf}>
                {g.zettel.length === 0 && (
                  <div className="chat-hinweis">{g.charId ? 'Nur ' + g.name + ' liest, was du hier schreibst.'
                                                          : 'Nur die Spielleitung liest, was du hier schreibst.'}</div>
                )}
                {g.zettel.map((p, i) => {
                  const tag = postTag(p.zeit);
                  const neuerTag = i === 0 || postTag(g.zettel[i - 1].zeit) !== tag;
                  // Ein Spieler mit mehreren Helden sieht, welcher gemeint war.
                  const fuer = !dm && meine.length > 1 ? (p.eigen ? p.von : p.an) : null;
                  const wegDarf = p.eingang || (p.eigen && (!p.gelesen || dm)) || (dm && !p.an.charId);
                  return (
                    <React.Fragment key={p.id}>
                      {neuerTag && tag && <div className="chat-tag"><span>{tag}</span></div>}
                      <div className={'chat-blase' + (p.eigen ? ' eigen' : '')}>
                        {fuer && fuer.name && <div className="chat-fuer">{p.eigen ? 'als ' : 'an '}{fuer.name}</div>}
                        <div className="chat-text">{p.text}</div>
                        <div className="chat-meta">
                          {wegDarf && onLoeschen && (
                            <button type="button" className="chat-weg"
                              title={p.eigen ? 'Zurücknehmen' : 'Wegwerfen'} onClick={()=>onLoeschen(p.id)}>✕</button>
                          )}
                          <span>{postUhr(p.zeit)}</span>
                          {p.eigen && <span className={'chat-haken' + (p.gelesen ? ' gelesen' : '')}
                            title={p.gelesen ? 'Gelesen' : 'Zugestellt, noch nicht gelesen'}>{p.gelesen ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              {fehler && <div className="post-meldung weg">{fehler}</div>}
              {kannSchreiben ? (
                <div className="chat-eingabe">
                  <textarea className="form-input" rows={1} value={text} maxLength={2000}
                    aria-label={'Nachricht an ' + g.name} placeholder="Nachricht"
                    onChange={e=>{ setText(e.target.value); setFehler(null); }} onKeyDown={taste} />
                  <button type="button" className="chat-senden" aria-label="Senden"
                    disabled={!text.trim() || laeuft} onClick={senden}>{laeuft ? '…' : '➤'}</button>
                </div>
              ) : (
                <div className="chat-hinweis">Schreiben kann, wem ein Held in diesem Abenteuer gehört.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Fenster>
  );
};
