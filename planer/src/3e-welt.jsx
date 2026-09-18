// ── Die Welt: Tafeln fuer Figuren, Zeit, Dateien, Quests, Wissen, Fraktionen, Hex ──
// Rechnung in 1f-welt.jsx.

// ── Zeitleiste ───────────────────────────────────────────────────
// Die Spielleitung schiebt die Zeit und sieht, wo die Figuren dann sind.
// Spieler sehen die Figuren zu der Zeit, die sie freigegeben hat.
const Zeitleiste = ({ dm, zeit, bereich, chronikZeit, freigegeben, onZeit, onFreigeben }) => {
  if (!dm) {
    return Number.isFinite(+freigegeben) ? <div className="pl-zeitleiste"><span className="pl-leise">🕰 Stand: {zeitText(freigegeben)}</span></div> : null;
  }
  return (
    <div className="pl-zeitleiste">
      <span className="pl-zeit-text">🕰 {zeitText(zeit)}</span>
      <input type="range" min={bereich.min} max={bereich.max} step={1} value={zeit} aria-label="Zeit"
        onChange={e => onZeit(+e.target.value)} />
      <button className="pl-symbol" aria-label="Eine Stunde zurück" onClick={() => onZeit(Math.max(bereich.min, zeit - 1))}>‹</button>
      <button className="pl-symbol" aria-label="Eine Stunde weiter" onClick={() => onZeit(zeit + 1)}>›</button>
      {chronikZeit != null && <button className="pl-knopf pl-klein" onClick={() => onZeit(chronikZeit)} title="Die Uhr der Chronik">⟲ Chronik</button>}
      <button className="pl-knopf pl-klein" onClick={() => onFreigeben(zeit)} disabled={+freigegeben === zeit}
        title="Spieler sehen die Figuren zu dieser Zeit">👁 Für Spieler: {Number.isFinite(+freigegeben) ? zeitText(freigegeben) : '—'}</button>
    </div>
  );
};

// ── Figur ────────────────────────────────────────────────────────
const FIGUR_SYMBOLE = ['🧍', '🧙', '🧛', '🐺', '🐉', '🏇', '🛒', '⛵', '⚔', '👑', '💀', '🦅'];
const neueFigur = (karteId, zeit, p) => ({ id: planNeueId('p'), karteId, art: 'figur', name: 'Neue Figur', symbol: '🧍', sichtbar: false, text: '',
  wegpunkte: [{ zeit, x: Math.round(p.x), y: Math.round(p.y), notiz: '' }], dm: { notiz: '' } });

const FigurTafel = ({ figur, dm, zeit, wegpunktWartet, helden, onSpeichern, onLoeschen, onSchliessen, onWegpunktHier, onBogen }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(figur);
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const wp = wegpunkteSortiert(entwurf);
  const pos = figurPosition(entwurf, zeit);
  const setzeWp = (i, feld, wert) => setEntwurf(e => ({ ...e, wegpunkte: wegpunkteSortiert(e).map((w, j) => j === i ? { ...w, [feld]: wert } : w) }));
  const nsc = nscZuFigur(entwurf, helden);
  // Einen NSC waehlen heisst: Name und Zeichen kommen mit. Beides bleibt
  // danach aenderbar — der Bote heisst auf der Karte vielleicht „Reiter“.
  const nscWaehlen = (id) => setEntwurf(e => {
    const h = (helden || []).find(x => x.id === id);
    if (!h) { const { charId, ...rest } = e; return rest; }
    return { ...e, charId: h.id, name: (e.name === 'Neue Figur' || !e.name) ? h.name : e.name,
      symbol: nscZeichen(h) };
  });
  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={'Figur: ' + figur.name}>
        <TafelKopf symbol={figur.symbol || '🧍'} titel={figur.name} onSchliessen={onSchliessen} />
        {figur.text ? <p className="pl-ort-text">{figur.text}</p> : <p className="pl-leise">Mehr ist nicht bekannt.</p>}
      </aside>
    );
  }
  return (
    <aside className="pl-tafel" aria-label={'Figur bearbeiten: ' + figur.name}>
      <TafelKopf symbol={entwurf.symbol || '🧍'} titel={entwurf.name || 'Ohne Namen'} onSchliessen={onSchliessen} />
      <p className="pl-leise">{zeitText(zeit)}: {pos ? (pos.unterwegs ? 'unterwegs' : 'steht') : 'noch nirgends'}</p>
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Name
          <input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={e => setze('name', e.target.value)} />
        </label>
        <div className="pl-symbole" role="radiogroup" aria-label="Zeichen">
          {FIGUR_SYMBOLE.map(s => (
            <button type="button" key={s} role="radio" aria-checked={entwurf.symbol === s} className={'pl-symbolwahl' + (entwurf.symbol === s ? ' an' : '')} onClick={() => setze('symbol', s)}>{s}</button>
          ))}
        </div>
        {(helden === null || nscListe(helden).length > 0 || entwurf.charId) && (
          <label>NSC aus dem Heldenbuch
            <select className="pl-feld" value={entwurf.charId || ''} aria-label="NSC aus dem Heldenbuch"
              onChange={e => nscWaehlen(e.target.value)}>
              <option value="">— keiner, nur eine Figur —</option>
              {nscListe(helden).map(h => <option key={h.id} value={h.id}>{nscZeichen(h)} {h.name}</option>)}
              {entwurf.charId && !nscZuFigur(entwurf, helden) && <option value={entwurf.charId}>(nicht mehr im Abenteuer)</option>}
            </select>
          </label>
        )}
        {nsc && (
          <p className="pl-leise pl-klein-text">
            {nscZeichen(nsc)} {nsc.haltung === 'feindlich' ? 'feindlich' : 'freundlich'} · {nscWerte(nsc)}
            {onBogen && <> · <button type="button" className="pl-verweis" onClick={() => onBogen(nsc)}>Bogen öffnen</button></>}
          </p>
        )}
        <h3 className="pl-unterkopf">Wegpunkte</h3>
        <ol className="pl-wegpunkte">
          {wp.map((w, i) => (
            <li key={i + ':' + w.zeit}>
              <label>Tag <input className="pl-feld" type="number" min={1} value={Math.floor(w.zeit / 24) + 1} aria-label={'Tag Wegpunkt ' + (i + 1)}
                onChange={e => setzeWp(i, 'zeit', zeitAus(e.target.value, w.zeit % 24))} /></label>
              <label>Uhr <input className="pl-feld" type="number" min={0} max={23} value={w.zeit % 24} aria-label={'Stunde Wegpunkt ' + (i + 1)}
                onChange={e => setzeWp(i, 'zeit', zeitAus(Math.floor(w.zeit / 24) + 1, e.target.value))} /></label>
              <button type="button" className="pl-symbol pl-symbol-weg" aria-label={'Wegpunkt ' + (i + 1) + ' entfernen'} disabled={wp.length < 2}
                onClick={() => setEntwurf(e => ({ ...e, wegpunkte: wegpunkteSortiert(e).filter((_, j) => j !== i) }))}>✕</button>
              <input className="pl-feld pl-breit" value={w.notiz || ''} placeholder="Was dort geschieht" maxLength={300} aria-label={'Notiz Wegpunkt ' + (i + 1)}
                onChange={e => setzeWp(i, 'notiz', e.target.value)} />
            </li>
          ))}
        </ol>
        <button type="button" className={'pl-knopf pl-klein' + (wegpunktWartet ? ' an' : '')} disabled={geaendert}
          title={geaendert ? 'Erst speichern' : ''} onClick={onWegpunktHier}>📍 Wegpunkt für {zeitText(zeit)} auf die Karte setzen</button>
        <label>Was die Spieler lesen
          <textarea className="pl-feld" rows={2} value={entwurf.text || ''} maxLength={20000} onChange={e => setze('text', e.target.value)} />
        </label>
        <label>Notiz der Spielleitung <span className="pl-leise">— sehen Spieler nie</span>
          <textarea className="pl-feld pl-dm-feld" rows={2} value={(entwurf.dm && entwurf.dm.notiz) || ''} maxLength={20000}
            onChange={e => setEntwurf(v => ({ ...v, dm: { ...(v.dm || {}), notiz: e.target.value } }))} />
        </label>
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.sichtbar} onChange={e => setze('sichtbar', e.target.checked)} />
          <span>Für Spieler sichtbar</span>
        </label>
        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(figur)}>Löschen</button>
          <button type="button" className="pl-knopf pl-klein" disabled={!geaendert} onClick={() => setEntwurf(figur)}>Verwerfen</button>
          <button type="submit" className="pl-knopf pl-haupt pl-klein" disabled={!geaendert}>Speichern</button>
        </div>
      </form>
    </aside>
  );
};

// ── Lokale Dateien ───────────────────────────────────────────────
// Freigegebene Ordner leben in diesem Browser (IndexedDB), nie auf dem
// Server. Der Speicher ist austauschbar, damit dev/planer-echt.html ihn
// ohne Dateiauswahl pruefen kann.
const planerOrdner = {
  speicher: null,
  idb: () => new Promise((ok, nein) => {
    const r = indexedDB.open('hb-planer-ordner', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('ordner');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => nein(r.error);
  }),
  async alle() {
    if (this.speicher) return this.speicher.alle();
    const db = await this.idb();
    return new Promise((ok, nein) => {
      const aus = {};
      const t = db.transaction('ordner').objectStore('ordner').openCursor();
      t.onsuccess = () => { const c = t.result; if (c) { aus[c.key] = c.value; c.continue(); } else ok(aus); };
      t.onerror = () => nein(t.error);
    });
  },
  async setzen(name, handle) {
    if (this.speicher) return this.speicher.setzen(name, handle);
    const db = await this.idb();
    return new Promise((ok, nein) => { const t = db.transaction('ordner', 'readwrite'); t.objectStore('ordner').put(handle, name); t.oncomplete = ok; t.onerror = () => nein(t.error); });
  },
  async datei(verweis) {
    const alle = await this.alle();
    const wurzel = alle[verweis.bibliothek];
    if (!wurzel) throw new Error('Die Bibliothek „' + verweis.bibliothek + '“ ist in diesem Browser nicht freigegeben.');
    if (wurzel.queryPermission && (await wurzel.queryPermission({ mode: 'read' })) !== 'granted') {
      if (!wurzel.requestPermission || (await wurzel.requestPermission({ mode: 'read' })) !== 'granted') throw new Error('Der Browser hat den Zugriff auf den Ordner nicht erlaubt.');
    }
    const teile = relativerPfad(verweis.pfad).split('/');
    let ordner = wurzel;
    try {
      for (const t of teile.slice(0, -1)) ordner = await ordner.getDirectoryHandle(t);
      return await (await ordner.getFileHandle(teile[teile.length - 1])).getFile();
    } catch (e) {
      throw new Error('Nicht gefunden in „' + verweis.bibliothek + '“: ' + verweis.pfad);
    }
  },
};
const ordnerFreigabeGeht = () => typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

const DateiBetrachter = ({ datei, onZu }) => {
  const [url, setUrl] = useState('');
  useEffect(() => { const u = URL.createObjectURL(datei.file); setUrl(u); return () => URL.revokeObjectURL(u); }, [datei.file]);
  const art = dateiArt(datei.verweis.pfad);
  return (
    <div className="pl-schleier" onClick={onZu}>
      <div className="pl-dialog pl-betrachter" role="dialog" aria-modal="true" aria-label={datei.verweis.titel} onClick={e => e.stopPropagation()}>
        <div className="pl-tafel-kopf"><span aria-hidden="true">{DATEI_ZEICHEN[art]}</span><h2>{datei.verweis.titel}</h2>
          <button className="pl-symbol" aria-label="Schließen" onClick={onZu}>✕</button></div>
        {url && art === 'bild' && <img src={url} alt="" />}
        {url && art === 'ton' && <audio src={url} controls autoPlay />}
        {url && art === 'video' && <video src={url} controls autoPlay />}
        {url && (dateiEndung(datei.verweis.pfad) === 'pdf' || ['txt', 'md'].includes(dateiEndung(datei.verweis.pfad))) && <iframe src={url} title={datei.verweis.titel} />}
        <p className="pl-leise pl-klein-text">{datei.verweis.bibliothek} / {datei.verweis.pfad}</p>
      </div>
    </div>
  );
};

// Die Dateien eines Orts. Nur fuer die Spielleitung: sie stehen unter dm.
const DateiListe = ({ dateien, onDateien, onMeldung }) => {
  const [bibliotheken, setBibliotheken] = useState([]);
  const [bib, setBib] = useState('');
  const [pfad, setPfad] = useState('');
  const [neuName, setNeuName] = useState('');
  const [zeigen, setZeigen] = useState(null);
  const neuLaden = () => planerOrdner.alle().then(a => { const n = Object.keys(a); setBibliotheken(n); setBib(b => b || n[0] || ''); }).catch(() => setBibliotheken([]));
  useEffect(() => { neuLaden(); }, []);
  const hinzu = (v) => {
    if (!v) { onMeldung({ art: 'fehler', text: 'Ein Pfad muss innerhalb der Bibliothek liegen, ohne .. und ohne Laufwerk.' }); return; }
    if ((dateien || []).some(d => d.bibliothek === v.bibliothek && d.pfad === v.pfad)) return;
    onDateien([...(dateien || []), v]);
    setPfad('');
  };
  const freigeben = async () => {
    try {
      const handle = await window.showDirectoryPicker({ id: 'hb-planer', mode: 'read' });
      const name = bibliotheksName(neuName || handle.name);
      await planerOrdner.setzen(name, handle);
      setNeuName(''); setBib(name); neuLaden();
      onMeldung({ art: 'gut', text: '📁 „' + name + '“ ist in diesem Browser freigegeben. Für die Brücke: installieren.ps1 -Bibliothek "' + name + '" -Ordner "…"' });
    } catch (e) { if (e.name !== 'AbortError') onMeldung({ art: 'fehler', text: 'Freigeben ging nicht: ' + e.message }); }
  };
  const waehlen = async () => {
    try {
      const alle = await planerOrdner.alle();
      const wurzel = alle[bib];
      const [fh] = await window.showOpenFilePicker({ startIn: wurzel, id: 'hb-planer' });
      const teile = wurzel && wurzel.resolve ? await wurzel.resolve(fh) : null;
      if (!teile) { onMeldung({ art: 'fehler', text: 'Die Datei liegt nicht in „' + bib + '“.' }); return; }
      hinzu(dateiVerweis(bib, teile.join('/')));
    } catch (e) { if (e.name !== 'AbortError') onMeldung({ art: 'fehler', text: e.message }); }
  };
  const ansehen = async (v) => {
    try { setZeigen({ verweis: v, file: await planerOrdner.datei(v) }); }
    catch (e) { onMeldung({ art: 'fehler', text: e.message }); }
  };
  return (
    <div className="pl-dateien">
      <h3 className="pl-unterkopf">Dateien auf diesem Rechner <span className="pl-leise">— nur Spielleitung</span></h3>
      <ul className="pl-datei-liste">
        {(dateien || []).map(v => (
          <li key={v.bibliothek + '/' + v.pfad}>
            <span aria-hidden="true">{DATEI_ZEICHEN[dateiArt(v.pfad)]}</span>
            <span className="pl-eintrag-text" title={v.bibliothek + ' / ' + v.pfad}>{v.titel}</span>
            {imBrowserZeigbar(v.pfad) && <button type="button" className="pl-symbol" aria-label={'Ansehen: ' + v.titel} title="Im Browser ansehen" onClick={() => ansehen(v)}>👁</button>}
            <a className="pl-symbol" href={brueckenAdresse(v)} aria-label={'Öffnen: ' + v.titel} title="Im Programm öffnen (Planer-Brücke)">▶</a>
            <button type="button" className="pl-symbol pl-symbol-weg" aria-label={'Entfernen: ' + v.titel} onClick={() => onDateien(dateien.filter(d => d !== v))}>✕</button>
          </li>
        ))}
      </ul>
      <div className="pl-zeile">
        <select className="pl-feld" value={bib} onChange={e => setBib(e.target.value)} aria-label="Bibliothek">
          {!bibliotheken.length && <option value="">— keine Bibliothek —</option>}
          {bibliotheken.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {ordnerFreigabeGeht() && bib && <button type="button" className="pl-knopf pl-klein" onClick={waehlen}>📁 Datei wählen</button>}
      </div>
      <div className="pl-zeile">
        <input className="pl-feld pl-breit-feld" value={pfad} placeholder="oder Pfad in der Bibliothek, z. B. Musik/Taverne.mp3" aria-label="Pfad"
          onChange={e => setPfad(e.target.value)} />
        <button type="button" className="pl-knopf pl-klein" disabled={!pfad.trim() || !bib}
          onClick={() => hinzu(dateiVerweis(bib, pfad))}>＋</button>
      </div>
      {ordnerFreigabeGeht() ? (
        <div className="pl-zeile">
          <input className="pl-feld" value={neuName} placeholder="Name der Bibliothek" maxLength={40} aria-label="Name der neuen Bibliothek" onChange={e => setNeuName(e.target.value)} />
          <button type="button" className="pl-knopf pl-klein" onClick={freigeben}>📁 Ordner freigeben</button>
        </div>
      ) : <p className="pl-leise pl-klein-text">Ordner freigeben geht nur in Chrome und Edge. Öffnen über die Planer-Brücke geht überall.</p>}
      <p className="pl-leise pl-klein-text">▶ braucht die Planer-Brücke, einmal je Rechner: <a href="bruecke/planer-bruecke.ps1" download>planer-bruecke.ps1</a> und <a href="bruecke/installieren.ps1" download>installieren.ps1</a> in einen Ordner laden, dann <code>installieren.ps1 -Bibliothek "Name" -Ordner "Pfad"</code> ausführen.</p>
      {zeigen && <DateiBetrachter datei={zeigen} onZu={() => setZeigen(null)} />}
    </div>
  );
};

// ── Quests, Wissen, Fraktionen ───────────────────────────────────
const GeschichteListe = ({ dm, quests, hinweise, fraktionen, wahl, onWahl, onNeu }) => {
  const [reiter, setReiter] = useState('quest');
  if (!dm && !quests.length && !hinweise.length && !fraktionen.length) return null;
  const reiterListe = [
    { k: 'quest', l: '❗ Quests', n: quests.length },
    { k: 'hinweis', l: '🔎 Wissen', n: hinweise.length },
    { k: 'fraktion', l: '⚑ Fraktionen', n: fraktionen.length },
  ];
  const eintraege = reiter === 'quest' ? questsSortiert(quests) : reiter === 'hinweis' ? hinweise : fraktionen;
  return (
    <nav className="pl-liste" aria-label="Geschichte">
      <div className="pl-reiter" role="tablist">
        {reiterListe.map(r => (
          <button key={r.k} role="tab" aria-selected={reiter === r.k} className={'pl-reiter-knopf' + (reiter === r.k ? ' an' : '')} onClick={() => setReiter(r.k)}>{r.l} · {r.n}</button>
        ))}
      </div>
      {dm && <button className="pl-knopf pl-klein pl-neu-zeile" onClick={() => onNeu(reiter)}>＋ {reiter === 'quest' ? 'Quest' : reiter === 'hinweis' ? 'Gerücht oder Hinweis' : 'Fraktion'}</button>}
      <ul>
        {eintraege.map(o => (
          <li key={o.id} className={'pl-eintrag' + (o.id === wahl ? ' aktiv' : '')}>
            <button className="pl-eintrag-name" onClick={() => onWahl(o)}>
              <span aria-hidden="true">{o.art === 'quest' ? questStatus(o.status).zeichen : o.art === 'hinweis' ? (HINWEIS_ARTEN.find(h => h.k === o.artDesWissens) || HINWEIS_ARTEN[0]).zeichen : <span className="pl-farbpunkt" style={{ background: o.farbe }} />}</span>
              <span className={'pl-eintrag-text' + (dm && !o.sichtbar ? ' pl-verborgen-text' : '') + (o.status === 'erledigt' || o.status === 'gescheitert' ? ' pl-durch' : '')}>
                {o.art === 'hinweis' ? (o.text || 'Ohne Text') : (o.titel || o.name || 'Ohne Namen')}
              </span>
              {o.art === 'quest' && questFortschritt(o).alle > 0 && <span className="pl-leise">{questFortschritt(o).fertig}/{questFortschritt(o).alle}</span>}
              {o.art === 'fraktion' && <span className="pl-leise">{rufText(o.ruf)}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const OrtWahl = ({ wert, orte, onWert, label }) => (
  <label>{label}
    <select className="pl-feld" value={wert || ''} onChange={e => onWert(e.target.value)}>
      <option value="">— keiner —</option>
      {orte.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  </label>
);

const GeschichteTafel = ({ eintrag, dm, orte, quests, regionen, onSpeichern, onLoeschen, onSchliessen, onOrt }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(eintrag);
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const setzeDm = (feld, wert) => setEntwurf(e => ({ ...e, dm: { ...(e.dm || {}), [feld]: wert } }));
  const e = dm ? entwurf : eintrag;
  const ort = orte.find(o => o.id === (e.zielOrt || e.ortId));
  const symbol = e.art === 'quest' ? '❗' : e.art === 'hinweis' ? '🔎' : '⚑';
  const titel = e.art === 'hinweis' ? (HINWEIS_ARTEN.find(h => h.k === e.artDesWissens) || HINWEIS_ARTEN[0]).l : (e.titel || e.name || 'Ohne Namen');

  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={titel}>
        <TafelKopf symbol={symbol} titel={titel} onSchliessen={onSchliessen} />
        {e.art === 'quest' && <p className="pl-sicht an">{questStatus(e.status).zeichen} {questStatus(e.status).l}</p>}
        {e.art === 'quest' && e.auftraggeber && <p className="pl-leise">Auftraggeber: {e.auftraggeber}</p>}
        {e.art === 'fraktion' && <p className="pl-sicht an">Ruf: {rufText(e.ruf)}</p>}
        {e.text && <p className="pl-ort-text">{e.text}</p>}
        {e.art === 'quest' && (e.schritte || []).length > 0 && (
          <ul className="pl-schritte">{e.schritte.map((s, i) => <li key={i} className={s.erledigt ? 'pl-durch' : ''}>{s.erledigt ? '☑' : '☐'} {s.text}</li>)}</ul>
        )}
        {e.art === 'quest' && e.belohnung && <p className="pl-leise">Belohnung: {e.belohnung}</p>}
        {e.art === 'hinweis' && e.bekanntSeit && <p className="pl-leise">Bekannt seit: {e.bekanntSeit}</p>}
        {ort && <button className="pl-knopf pl-klein" onClick={() => onOrt(ort)}>📍 {ort.name}</button>}
      </aside>
    );
  }
  const notizFeld = (
    <label>Notiz der Spielleitung <span className="pl-leise">— sehen Spieler nie</span>
      <textarea className="pl-feld pl-dm-feld" rows={2} value={(entwurf.dm && entwurf.dm.notiz) || ''} maxLength={20000} onChange={ev => setzeDm('notiz', ev.target.value)} />
    </label>
  );
  return (
    <aside className="pl-tafel" aria-label={'Bearbeiten: ' + titel}>
      <TafelKopf symbol={symbol} titel={titel} onSchliessen={onSchliessen} />
      <form className="pl-formular" onSubmit={ev => { ev.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        {e.art === 'quest' && <>
          <label>Titel<input className="pl-feld" value={entwurf.titel || ''} maxLength={120} onChange={ev => setze('titel', ev.target.value)} /></label>
          <label>Stand
            <select className="pl-feld" value={entwurf.status || 'offen'} onChange={ev => setze('status', ev.target.value)}>
              {QUEST_STATUS.map(s => <option key={s.k} value={s.k}>{s.zeichen} {s.l}</option>)}
            </select>
          </label>
          <label>Auftraggeber<input className="pl-feld" value={entwurf.auftraggeber || ''} maxLength={120} onChange={ev => setze('auftraggeber', ev.target.value)} /></label>
          <OrtWahl label="Wohin" wert={entwurf.zielOrt} orte={orte} onWert={v => setze('zielOrt', v)} />
          <label>Was die Spieler wissen<textarea className="pl-feld" rows={3} value={entwurf.text || ''} maxLength={20000} onChange={ev => setze('text', ev.target.value)} /></label>
          <div className="pl-schritte-edit">
            {(entwurf.schritte || []).map((s, i) => (
              <div key={i} className="pl-zeile">
                <input type="checkbox" checked={!!s.erledigt} aria-label={'Schritt ' + (i + 1) + ' erledigt'}
                  onChange={ev => setze('schritte', entwurf.schritte.map((x, j) => j === i ? { ...x, erledigt: ev.target.checked } : x))} />
                <input className="pl-feld pl-breit-feld" value={s.text} maxLength={200} aria-label={'Schritt ' + (i + 1)}
                  onChange={ev => setze('schritte', entwurf.schritte.map((x, j) => j === i ? { ...x, text: ev.target.value } : x))} />
                <button type="button" className="pl-symbol pl-symbol-weg" aria-label={'Schritt ' + (i + 1) + ' entfernen'}
                  onClick={() => setze('schritte', entwurf.schritte.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="pl-knopf pl-klein" onClick={() => setze('schritte', [...(entwurf.schritte || []), { text: '', erledigt: false }])}>＋ Schritt</button>
          </div>
          <label>Belohnung<input className="pl-feld" value={entwurf.belohnung || ''} maxLength={200} onChange={ev => setze('belohnung', ev.target.value)} /></label>
        </>}
        {e.art === 'hinweis' && <>
          <label>Art
            <select className="pl-feld" value={entwurf.artDesWissens || 'geruecht'} onChange={ev => setze('artDesWissens', ev.target.value)}>
              {HINWEIS_ARTEN.map(h => <option key={h.k} value={h.k}>{h.zeichen} {h.l}</option>)}
            </select>
          </label>
          <label>Was man hört<textarea className="pl-feld" rows={3} value={entwurf.text || ''} maxLength={20000} onChange={ev => setze('text', ev.target.value)} /></label>
          <OrtWahl label="Gehört zu Ort" wert={entwurf.ortId} orte={orte} onWert={v => setze('ortId', v)} />
          <label>Gehört zu Quest
            <select className="pl-feld" value={entwurf.questId || ''} onChange={ev => setze('questId', ev.target.value)}>
              <option value="">— keiner —</option>
              {quests.map(q => <option key={q.id} value={q.id}>{q.titel}</option>)}
            </select>
          </label>
          <label>Stimmt es?
            <select className="pl-feld pl-dm-feld" value={(entwurf.dm && entwurf.dm.wahr) || 'wahr'} onChange={ev => setzeDm('wahr', ev.target.value)}>
              <option value="wahr">Ja</option><option value="teils">Zum Teil</option><option value="falsch">Nein</option>
            </select>
          </label>
          <label>Bekannt seit<input className="pl-feld" value={entwurf.bekanntSeit || ''} placeholder="z. B. Sitzung 12" maxLength={60} onChange={ev => setze('bekanntSeit', ev.target.value)} /></label>
        </>}
        {e.art === 'fraktion' && <>
          <label>Name<input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={ev => setze('name', ev.target.value)} /></label>
          <div className="pl-zeile" role="radiogroup" aria-label="Farbe">
            {REGION_FARBEN.map(f => <button type="button" key={f} role="radio" aria-checked={entwurf.farbe === f} aria-label={'Farbe ' + f}
              className={'pl-farbwahl' + (entwurf.farbe === f ? ' an' : '')} style={{ background: f }} onClick={() => setze('farbe', f)} />)}
          </div>
          <label>Ruf der Gruppe: <strong>{rufText(entwurf.ruf)}</strong>
            <input type="range" min={-3} max={3} step={1} value={Math.round(+entwurf.ruf || 0)} onChange={ev => setze('ruf', +ev.target.value)} aria-label="Ruf" />
          </label>
          <label>Was die Spieler wissen<textarea className="pl-feld" rows={3} value={entwurf.text || ''} maxLength={20000} onChange={ev => setze('text', ev.target.value)} /></label>
          <fieldset className="pl-empfaenger">
            <legend>Einfluss in</legend>
            {regionen.map(r => (
              <label key={r.id} className="pl-schalter">
                <input type="checkbox" checked={(entwurf.regionen || []).includes(r.id)}
                  onChange={() => setze('regionen', (entwurf.regionen || []).includes(r.id) ? entwurf.regionen.filter(x => x !== r.id) : [...(entwurf.regionen || []), r.id])} />
                <span>{r.name}</span>
              </label>
            ))}
            {!regionen.length && <p className="pl-leise pl-klein-text">Noch keine Region gezeichnet.</p>}
          </fieldset>
          <label>Ziele<textarea className="pl-feld pl-dm-feld" rows={2} value={(entwurf.dm && entwurf.dm.ziele) || ''} maxLength={20000} onChange={ev => setzeDm('ziele', ev.target.value)} /></label>
        </>}
        {notizFeld}
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.sichtbar} onChange={ev => setze('sichtbar', ev.target.checked)} />
          <span>{e.art === 'hinweis' ? 'Die Spieler wissen es' : 'Für Spieler sichtbar'}</span>
        </label>
        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(eintrag)}>Löschen</button>
          <button type="button" className="pl-knopf pl-klein" disabled={!geaendert} onClick={() => setEntwurf(eintrag)}>Verwerfen</button>
          <button type="submit" className="pl-knopf pl-haupt pl-klein" disabled={!geaendert}>Speichern</button>
        </div>
      </form>
    </aside>
  );
};

// ── Hexfelder ────────────────────────────────────────────────────
const HexEinstellung = ({ karte, onSpeichern }) => {
  const h = karte.hex || {};
  const einh = karte.massstab ? einheit(karte.massstab.einheit).kurz : '';
  if (!karte.massstab) return <span className="pl-leise pl-klein-text">Hexfelder brauchen einen Maßstab.</span>;
  return (
    <span className="pl-hex-steuer">
      <label className="pl-schalter"><input type="checkbox" checked={!!h.an} onChange={e => onSpeichern({ ...h, an: e.target.checked, groesse: h.groesse || 10 })} /><span>⬡ Hexfelder</span></label>
      {h.an && <>
        <label className="pl-schalter">je Feld <input className="pl-feld pl-zahl-klein" type="number" min={0.1} step="any" value={h.groesse || 10}
          onChange={e => onSpeichern({ ...h, groesse: Math.max(0.1, +e.target.value || 10) })} /> {einh}</label>
        <label className="pl-schalter"><input type="checkbox" checked={!!h.spieler} onChange={e => onSpeichern({ ...h, spieler: e.target.checked })} /><span>auch für Spieler</span></label>
      </>}
    </span>
  );
};
