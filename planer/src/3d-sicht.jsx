// ── Spielersicht: Handouts und der Tisch ─────────────────────────
// Rechnung in 1e-sicht.jsx. Hier: die Tafel eines Handouts fuer die
// Spielleitung, das Lesefenster fuer Spieler, die Liste, und das
// Tischfenster fuer Beamer oder zweiten Bildschirm.

const PlanerHandoutListe = ({ handouts, wahl, dm, gesehen, onWahl, onNeu }) => {
  if (!dm && !handouts.length) return null;
  return (
    <nav className="pl-liste" aria-label="Handouts">
      <div className="pl-liste-kopf">
        <span>Handouts · {handouts.length}</span>
        {dm && <button className="pl-knopf pl-klein" onClick={onNeu}>＋ Handout</button>}
      </div>
      <ul>
        {handouts.map(h => (
          <li key={h.id} className={'pl-eintrag' + (h.id === wahl ? ' aktiv' : '')}>
            <button className="pl-eintrag-name" onClick={() => onWahl(h.id)}>
              <span aria-hidden="true">📜</span>
              <span className={'pl-eintrag-text' + (dm && !h.sichtbar ? ' pl-verborgen-text' : '')}>{h.titel || 'Ohne Titel'}</span>
              {dm && h.sichtbar && <span className="pl-leise">{(h.an || []).length ? 'an ' + h.an.length : 'an alle'}</span>}
              {!dm && gesehen && !gesehen.includes(handoutFassung(h)) && <span className="pl-neu-punkt" title="Neu">neu</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Das Lesefenster: fuer Spieler, wenn etwas Neues kommt, und aus der Liste.
const HandoutLeser = ({ handout, onZu }) => (
  <div className="pl-schleier" onClick={onZu}>
    <article className="pl-dialog pl-handout-leser" role="dialog" aria-modal="true" aria-label={'Handout: ' + handout.titel} onClick={e => e.stopPropagation()}>
      <div className="pl-etikett">📜 Handout</div>
      <h2>{handout.titel || 'Ohne Titel'}</h2>
      {handout.bild && handout.ablage && <img className="pl-handout-bild" src={planerDateiUrl(handout.ablage, handout.bild)} alt="" />}
      {handout.text && <p className="pl-ort-text">{handout.text}</p>}
      <div className="pl-dialog-knoepfe">
        <button className="pl-knopf pl-haupt" onClick={onZu}>Gelesen</button>
      </div>
    </article>
  </div>
);

const HandoutTafel = ({ handout, mitglieder, arbeitet, onSpeichern, onVerteilen, onLoeschen, onSchliessen, onBild, onTisch }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(handout);
  const bildEingabe = useRef(null);
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const an = entwurf.an || [];
  const um = (id) => setze('an', an.includes(id) ? an.filter(x => x !== id) : [...an, id]);
  return (
    <aside className="pl-tafel" aria-label={'Handout: ' + handout.titel}>
      <TafelKopf symbol="📜" titel={entwurf.titel || 'Ohne Titel'} onSchliessen={onSchliessen} />
      <p className={'pl-sicht ' + (handout.sichtbar ? 'an' : 'aus')}>{handout.sichtbar
        ? 'Verteilt ' + ((handout.an || []).length ? 'an ' + handout.an.length + (handout.an.length === 1 ? ' Spieler' : ' Spieler') : 'an alle')
        : 'Noch nicht verteilt'}</p>
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Titel
          <input className="pl-feld" value={entwurf.titel || ''} maxLength={120} onChange={e => setze('titel', e.target.value)} />
        </label>
        <label>Text
          <textarea className="pl-feld" rows={5} value={entwurf.text || ''} maxLength={20000} onChange={e => setze('text', e.target.value)} />
        </label>
        {entwurf.bild && handout.ablage && (
          <div className="pl-handout-vorschau">
            <img src={planerDateiUrl(handout.ablage, entwurf.bild)} alt="" />
            <button type="button" className="pl-knopf pl-klein" onClick={() => setze('bild', '')}>Bild entfernen</button>
          </div>
        )}
        <div className="pl-zeile">
          <button type="button" className="pl-knopf pl-klein" disabled={arbeitet || geaendert} title={geaendert ? 'Erst speichern' : ''}
            onClick={() => bildEingabe.current && bildEingabe.current.click()}>🖼 {entwurf.bild ? 'Anderes Bild' : 'Bild'}</button>
          <input ref={bildEingabe} type="file" accept="image/*" hidden
            onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) onBild(entwurf, f); }} />
        </div>
        <fieldset className="pl-empfaenger">
          <legend>Für wen</legend>
          <label className="pl-schalter">
            <input type="radio" name={'an-' + handout.id} checked={!an.length} onChange={() => setze('an', [])} />
            <span>Alle in der Gruppe</span>
          </label>
          {(mitglieder || []).map(m => (
            <label key={m.id} className="pl-schalter">
              <input type="checkbox" checked={an.includes(+m.id)} onChange={() => um(+m.id)} />
              <span>{m.name}{m.rolle === 'dm' ? ' (Spielleitung)' : ''}</span>
            </label>
          ))}
          {mitglieder === null && <p className="pl-leise pl-klein-text">Die Mitglieder der Gruppe werden geladen …</p>}
        </fieldset>
        <label>Notiz der Spielleitung <span className="pl-leise">— sehen Spieler nie</span>
          <textarea className="pl-feld pl-dm-feld" rows={2} value={(entwurf.dm && entwurf.dm.notiz) || ''} maxLength={20000}
            onChange={e => setEntwurf(v => ({ ...v, dm: { ...(v.dm || {}), notiz: e.target.value } }))} />
        </label>
        <div className="pl-zeile">
          <button type="button" className="pl-knopf pl-klein pl-haupt" disabled={geaendert || arbeitet} title={geaendert ? 'Erst speichern' : ''}
            onClick={() => onVerteilen(handout, !handout.sichtbar)}>{handout.sichtbar ? '↶ Zurücknehmen' : '📜 An die Spieler geben'}</button>
          <button type="button" className="pl-knopf pl-klein" onClick={() => onTisch(entwurf)}>📺 Auf dem Tisch zeigen</button>
        </div>
        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(handout)}>Löschen</button>
          <button type="button" className="pl-knopf pl-klein" disabled={!geaendert} onClick={() => setEntwurf(handout)}>Verwerfen</button>
          <button type="submit" className="pl-knopf pl-haupt pl-klein" disabled={!geaendert}>Speichern</button>
        </div>
      </form>
    </aside>
  );
};

// ── Das Tischfenster ─────────────────────────────────────────────
// Oeffnet die Spielleitung mit 📺 Tisch. Es laedt mit ihrer Anmeldung,
// zeigt aber nur, was die Runde sehen darf (spielerSicht), mit deckendem
// Nebel und ohne jedes Werkzeug. Welche Karte, welcher Ausschnitt und ob
// ein Handout gross zu sehen ist, sagt die Seite der Spielleitung ueber
// den gemeinsamen Kanal.
const TischApp = ({ adv }) => {
  const zugang = planerZugang();
  const angemeldet = !!(zugang.token && zugang.code);
  const advId = adv || (() => { try { return new URLSearchParams(location.search).get('adv') || ''; } catch (e) { return ''; } })();
  const [daten, setDaten] = useState(null);
  const [karteId, setKarteId] = useState('');
  const [vorgabe, setVorgabe] = useState(null);
  const [zeigen, setZeigen] = useState(null);
  const [fehlerText, setFehlerText] = useState('');
  const gedaechtnis = useRef({});
  const standRef = useRef(-1);

  const laden = useCallback(async () => {
    const d = await planerApi('planer_laden', { adv_id: advId });
    standRef.current = d.stand;
    setDaten(spielerSicht(d));
  }, []);
  useEffect(() => {
    if (!angemeldet || !advId) return;
    laden().catch(e => setFehlerText(e.message));
    const t = setInterval(() => {
      planerApi('planer_stand', { adv_id: advId }).then(s => { if (s.stand !== standRef.current) return laden(); }).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const k = new BroadcastChannel(TISCH_KANAL);
    k.onmessage = (ev) => {
      const n = ev.data || {};
      if (n.advId && n.advId !== advId) return;
      // Ein anderer Ausschnitt laesst ein gezeigtes Handout liegen; erst eine
      // andere Karte oder „Karte zeigen“ nimmt es weg.
      if (n.art === 'karte') setZeigen(null);
      if (n.art === 'karte' || n.art === 'ansicht') { setKarteId(n.karteId); if (n.ansicht) setVorgabe({ ...n.ansicht, karteId: n.karteId, n: n.zeit }); }
      if (n.art === 'handout') setZeigen({ art: 'handout', id: n.id, handout: n.handout });
      if (n.art === 'leer') setZeigen(null);
      if (n.art === 'neu') laden().catch(() => {});
    };
    k.postMessage(tischNachricht('hallo', { advId }));
    return () => k.close();
  }, []);

  if (!angemeldet) return <PlanerNichtAngemeldet />;
  if (fehlerText) return <div className="pl-tisch-leer"><p>{fehlerText}</p></div>;
  if (!daten) return <div className="pl-tisch-leer"><p>🗺 Der Tisch lädt …</p></div>;
  const karte = daten.karten.find(k => k.id === karteId) || daten.karten[0] || null;
  const aufKarte = (art) => karte ? daten.objekte.filter(o => o.art === art && o.karteId === karte.id) : [];
  const routen = aufKarte('route');
  const gruppen = karte ? aufKarte('reise').filter(j => !j.gruppeId).map(j => {
    const r = routen.find(x => x.id === j.routeId);
    if (!r || !karte.massstab) return null;
    return { id: j.id, name: j.name, sichtbar: true, punkt: punktAufRoute(routeInRichtung(r, j.richtung), karte.massstab, j.pos || 0) };
  }).filter(Boolean) : [];
  // Ein Handout, das an einzelne geht, schickt die Spielleitung trotzdem
  // mit; auf dem Tisch zeigt es, wer es zeigt.
  const handout = zeigen && zeigen.art === 'handout' ? (zeigen.handout || daten.objekte.find(o => o.id === zeigen.id)) : null;

  return (
    <div className="pl-tisch">
      {karte ? (
        <KartenLeinwand karte={karte} orte={aufKarte('ort')} dm={false} werkzeug="ansehen" ortWahl=""
          linie={null} fokus={null} gedaechtnis={gedaechtnis}
          routen={routen} gruppen={gruppen} regionen={aufKarte('region')} heldengruppen={aufKarte('gruppe')}
          nebel={nebelVon(karte)} nebelDeckend={true} vorgabeAnsicht={vorgabe}
          onKlick={() => {}} onOrtWahl={() => {}} onRouteWahl={() => {}} onReiseWahl={() => {}} onRegionWahl={() => {}} />
      ) : <div className="pl-tisch-leer"><p>Noch keine Karte für die Runde.</p></div>}
      {handout && (
        <div className="pl-tisch-handout">
          <div className="pl-etikett">📜 {handout.titel}</div>
          {handout.bild && handout.ablage && <img src={planerDateiUrl(handout.ablage, handout.bild)} alt="" />}
          {handout.text && <p>{handout.text}</p>}
        </div>
      )}
      <button className="pl-tisch-voll pl-symbol" aria-label="Vollbild" title="Vollbild"
        onClick={() => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); }}>⛶</button>
    </div>
  );
};
