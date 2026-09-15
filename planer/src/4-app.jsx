// ── Abenteuerplaner: die Seite ───────────────────────────────────
// Wer bin ich, welches Abenteuer, welche Karten — und auf der Karte das
// Bild, die Orte, Lineal und Maßstab. Dazu das Paket hinaus und wieder
// hinein.
//
// Die Wege nach draussen stehen in planer/index.html (planerApi,
// planerDateiHolen, planerDateiUrl, planerSpeichern, planerZugang),
// damit dev/planer-echt.html dieselbe Seite gegen ein Gedaechtnis fahren
// kann.

const PLANER_ADV_SPEICHER = 'hb_planer_adv';
const PLANER_ABGLEICH_MS = 15000;
const PLANER_ABGLEICH_SPIELER_MS = 5000;
const PLANER_GESEHEN = 'hb_planer_gesehen_';

const planerAdvAnfang = (liste) => {
  const ids = liste.map(a => a.id);
  let ausAdresse = '';
  try { ausAdresse = new URLSearchParams(location.search).get('adv') || ''; } catch (e) { /* ohne Adresse */ }
  const gemerkt = (() => { try { return localStorage.getItem(PLANER_ADV_SPEICHER) || localStorage.getItem('hb_adventure') || ''; } catch (e) { return ''; } })();
  return [ausAdresse, gemerkt].find(id => id && ids.includes(id)) || ids[0] || '';
};

const PlanerNichtAngemeldet = () => (
  <div className="pl-leer-seite">
    <div className="pl-karte-leer">
      <div className="pl-marke">🗺 Abenteuerplaner</div>
      <h1>Bitte zuerst im Heldenbuch anmelden</h1>
      <p>Der Planer benutzt dieselbe Anmeldung und dieselbe Gruppe wie das Heldenbuch. Melde dich dort an und öffne den Planer dann wieder.</p>
      <a className="pl-knopf pl-haupt" href="../">⚔ Zum Heldenbuch</a>
    </div>
  </div>
);

const PlanerFrage = ({ frage, onZu }) => (
  <div className="pl-schleier" onClick={onZu}>
    <div className="pl-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <h2>{frage.titel}</h2>
      <p>{frage.text}</p>
      <div className="pl-dialog-knoepfe">
        <button className="pl-knopf" onClick={onZu}>Abbrechen</button>
        <button className={'pl-knopf ' + (frage.gefahr ? 'pl-gefahr' : 'pl-haupt')}
          onClick={() => { onZu(); frage.onJa(); }}>{frage.ja}</button>
      </div>
    </div>
  </div>
);

const PlanerArbeit = ({ arbeit, onAbbrechen }) => (
  <div className="pl-schleier">
    <div className="pl-dialog" role="status" aria-live="polite">
      <h2>{arbeit.titel}</h2>
      <p className="pl-arbeit-text">{arbeit.text || '…'}</p>
      <div className="pl-balken"><div style={{ width: Math.round((arbeit.anteil || 0) * 100) + '%' }} /></div>
      {arbeit.abbrechbar && (
        <div className="pl-dialog-knoepfe">
          <button className="pl-knopf" onClick={onAbbrechen} disabled={arbeit.abbruch}>{arbeit.abbruch ? 'Wird abgebrochen …' : 'Abbrechen'}</button>
        </div>
      )}
    </div>
  </div>
);

const PlanerImportVorschau = ({ vorschau, onEinspielen, onZu }) => {
  const m = vorschau.paket.manifest;
  const erstellt = (() => { const d = new Date(m.erstellt); return isNaN(d) ? '' : d.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }); })();
  return (
    <div className="pl-schleier" onClick={onZu}>
      <div className="pl-dialog pl-import" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>Paket einspielen</h2>
        <div className="pl-datei">{vorschau.dateiname}</div>
        <dl className="pl-fakten">
          {m.abenteuer && <><dt>Aus dem Abenteuer</dt><dd>{m.abenteuer.name}</dd></>}
          {erstellt && <><dt>Erstellt</dt><dd>{erstellt}</dd></>}
          <dt>Karten</dt><dd>{m.karten.length}</dd>
          <dt>Einträge</dt><dd>{m.objekte.length}</dd>
          <dt>Dateien</dt><dd>{m.dateien.length} · {planGroesse(vorschau.paket.bytes)}</dd>
        </dl>
        {m.karten.length > 0 && (
          <ul className="pl-import-karten">
            {m.karten.slice(0, 8).map(k => <li key={k.id}>{k.name}</li>)}
            {m.karten.length > 8 && <li className="pl-leise">… und {m.karten.length - 8} weitere</li>}
          </ul>
        )}
        <p className="pl-hinweis">Alles wird zusätzlich angelegt, nichts Vorhandenes wird überschrieben. Neue Karten sind für Spieler zunächst so sichtbar, wie sie im Paket stehen.</p>
        <div className="pl-dialog-knoepfe">
          <button className="pl-knopf" onClick={onZu}>Abbrechen</button>
          <button className="pl-knopf pl-haupt" onClick={onEinspielen}>Einspielen</button>
        </div>
      </div>
    </div>
  );
};

const PlanerKartenListe = ({ karten, auswahl, dm, onWahl, onNeu, onUmbenennen, onSichtbar, onLoeschen }) => {
  const [neuName, setNeuName] = useState(null);
  const [umName, setUmName] = useState(null);     // {id, name}
  const neuAbschicken = () => {
    const n = (neuName || '').trim();
    if (n) onNeu(n);
    setNeuName(null);
  };
  const umAbschicken = () => {
    if (umName && umName.name.trim()) onUmbenennen(umName.id, umName.name.trim());
    setUmName(null);
  };
  return (
    <nav className="pl-liste" aria-label="Karten">
      <div className="pl-liste-kopf">
        <span>Karten</span>
        {dm && neuName === null && <button className="pl-knopf pl-klein" onClick={() => setNeuName('')}>＋ Neue Karte</button>}
      </div>
      {neuName !== null && (
        <form className="pl-neu" onSubmit={e => { e.preventDefault(); neuAbschicken(); }}>
          <input autoFocus className="pl-feld" placeholder="Name der Karte" value={neuName} maxLength={120}
            onChange={e => setNeuName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setNeuName(null); }} />
          <button className="pl-knopf pl-klein pl-haupt" type="submit">Anlegen</button>
        </form>
      )}
      {karten.length === 0 && neuName === null && (
        <p className="pl-leise pl-liste-leer">{dm ? 'Noch keine Karte. Leg eine an oder spiel ein Paket ein.' : 'Die Spielleitung hat noch keine Karte freigegeben.'}</p>
      )}
      <ul>
        {karten.map(k => (
          <li key={k.id} className={'pl-eintrag' + (k.id === auswahl ? ' aktiv' : '')}>
            {umName && umName.id === k.id ? (
              <form className="pl-neu" onSubmit={e => { e.preventDefault(); umAbschicken(); }}>
                <input autoFocus className="pl-feld" value={umName.name} maxLength={120}
                  onChange={e => setUmName({ id: k.id, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Escape') setUmName(null); }} onBlur={umAbschicken} />
              </form>
            ) : (
              <button className="pl-eintrag-name" onClick={() => onWahl(k.id)} aria-current={k.id === auswahl}>
                {k.bild && k.bild.vorschau
                  ? <img className="pl-vorschau" src={planerDateiUrl(k.ablage, k.bild.vorschau)} alt="" loading="lazy" />
                  : <span className="pl-vorschau pl-vorschau-leer" aria-hidden="true">🗺</span>}
                {/* Verborgen zeigt hier das Auge daneben (◌); ein Schildchen
                    dazu nähme dem Namen den Platz. */}
                <span className={'pl-eintrag-text' + (dm && !k.sichtbar ? ' pl-verborgen-text' : '')}
                  title={dm && !k.sichtbar ? k.name + ' — für Spieler verborgen' : k.name}>{k.name}</span>
              </button>
            )}
            {dm && !(umName && umName.id === k.id) && (
              <span className="pl-eintrag-knoepfe">
                <button className="pl-symbol" title={k.sichtbar ? 'Für Spieler verbergen' : 'Für Spieler sichtbar machen'}
                  aria-label={k.sichtbar ? 'Verbergen' : 'Sichtbar machen'} aria-pressed={!!k.sichtbar}
                  onClick={() => onSichtbar(k)}>{k.sichtbar ? '👁' : '◌'}</button>
                <button className="pl-symbol" title="Umbenennen" aria-label="Umbenennen"
                  onClick={() => setUmName({ id: k.id, name: k.name })}>✎</button>
                <button className="pl-symbol pl-symbol-weg" title="Löschen" aria-label="Löschen"
                  onClick={() => onLoeschen(k)}>🗑</button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

const PlanerOrtListe = ({ orte, auswahl, dm, onWahl }) => {
  const [suche, setSuche] = useState('');
  if (!orte.length) return null;
  const s = suche.trim().toLowerCase();
  const liste = orte.filter(o => !s || String(o.name || '').toLowerCase().includes(s))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
  return (
    <nav className="pl-liste" aria-label="Orte auf dieser Karte">
      <div className="pl-liste-kopf"><span>Orte · {orte.length}</span></div>
      {orte.length > 6 && <input className="pl-feld pl-suche" placeholder="Ort suchen" value={suche} onChange={e => setSuche(e.target.value)} />}
      <ul>
        {liste.map(o => (
          <li key={o.id} className={'pl-eintrag' + (o.id === auswahl ? ' aktiv' : '')}>
            <button className="pl-eintrag-name" onClick={() => onWahl(o)}>
              <span aria-hidden="true">{o.symbol || '📍'}</span>
              <span className="pl-eintrag-text">{o.name}</span>
              {dm && !o.sichtbar && <span className="pl-marke-verborgen">verborgen</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const PlanerWegListe = ({ routen, reisen, routeWahl, reiseWahl, dm, onRouteWahl, onReiseWahl }) => {
  if (!routen.length) return null;
  return (
    <nav className="pl-liste" aria-label="Routen und Reisen">
      <div className="pl-liste-kopf"><span>Routen · {routen.length}</span></div>
      <ul>
        {routen.map(r => (
          <React.Fragment key={r.id}>
            <li className={'pl-eintrag' + (r.id === routeWahl ? ' aktiv' : '')}>
              <button className="pl-eintrag-name" onClick={() => onRouteWahl(r.id)}>
                <span aria-hidden="true">🛤</span>
                <span className={'pl-eintrag-text' + (dm && !r.sichtbar ? ' pl-verborgen-text' : '')}>{r.name}</span>
              </button>
            </li>
            {reisen.filter(j => j.routeId === r.id).map(j => (
              <li key={j.id} className={'pl-eintrag pl-eintrag-unter' + (j.id === reiseWahl ? ' aktiv' : '')}>
                <button className="pl-eintrag-name" onClick={() => onReiseWahl(j.id)}>
                  <span aria-hidden="true">🧭</span>
                  <span className={'pl-eintrag-text' + (dm && !j.sichtbar ? ' pl-verborgen-text' : '')}>{j.name}</span>
                  {(j.tagebuch || []).length > 0 && <span className="pl-leise">Tag {(j.tagebuch || []).length}</span>}
                </button>
              </li>
            ))}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
};

const PlanerRegionListe = ({ regionen, regionWahl, dm, onWahl }) => {
  if (!regionen.length) return null;
  return (
    <nav className="pl-liste" aria-label="Regionen">
      <div className="pl-liste-kopf"><span>Regionen · {regionen.length}</span></div>
      <ul>
        {regionen.map(r => (
          <li key={r.id} className={'pl-eintrag' + (r.id === regionWahl ? ' aktiv' : '')}>
            <button className="pl-eintrag-name" onClick={() => onWahl(r)}>
              <span className="pl-farbpunkt" style={{ background: r.farbe || REGION_FARBEN[0] }} aria-hidden="true" />
              <span className={'pl-eintrag-text' + (dm && !r.sichtbar ? ' pl-verborgen-text' : '')}>{r.name}</span>
              {dm && r.dm && r.dm.tabelle && <span className="pl-leise" title="Mit Begegnungstabelle">🎲</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Offline: der letzte Stand liegt im Browser. Ist der Server nicht zu
// erreichen, zeigt der Planer ihn — lesen geht, schreiben erst wieder mit Netz.
const offlineMerken = (schluessel, wert) => { try { localStorage.setItem(OFFLINE_SPEICHER + schluessel, offlineStand(null, wert)); } catch (e) { /* zu gross oder kein Speicher */ } };
const offlineHolen = (schluessel) => { try { return JSON.parse(localStorage.getItem(OFFLINE_SPEICHER + schluessel) || 'null'); } catch (e) { return null; } };
const istNetzFehler = (e) => /nicht erreichbar/.test(String((e && e.message) || ''));

const WERKZEUG_HINWEIS = {
  gruppe: 'Klicke, wo die Heldengruppe steht. Dabei sind alle Bögen des Abenteuers, die noch keiner Gruppe angehören.',
  gruppeZiehen: 'Klicke, wohin die Gruppe zieht. Der Nebel weicht entlang des Wegs.',
  figur: 'Klicke, wo die Figur zur eingestellten Zeit steht.',
  wegpunkt: 'Klicke, wo die Figur zur eingestellten Zeit sein soll.',
  nebel: 'Klicke, wo der Nebel weichen soll.',
  region: 'Klicke die Eckpunkte der Region. Die Fläche schließt sich von selbst.',
  route: 'Klicke Punkt für Punkt den Weg. Das Gelände je Abschnitt stellst du danach ein.',
  ort: 'Klicke auf die Karte, wo der neue Ort liegen soll.',
  massstab: 'Klicke zwei Punkte, deren Entfernung du kennst — zum Beispiel die Enden der Maßstabsleiste der Karte.',
  lineal: 'Klicke Punkt für Punkt eine Strecke.',
};

const PlanerApp = () => {
  const zugang = planerZugang();
  const angemeldet = !!(zugang.token && zugang.code);
  const [start, setStart] = useState(null);
  const [advId, setAdvId] = useState('');
  const [daten, setDaten] = useState(null);
  const [auswahl, setAuswahl] = useState('');
  const [verlauf, setVerlauf] = useState([]);
  const [dateien, setDateien] = useState(null);
  const [meldung, setMeldung] = useState(null);
  const [frage, setFrage] = useState(null);
  const [arbeit, setArbeit] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const [werkzeug, setWerkzeug] = useState('ansehen');
  const [punkte, setPunkte] = useState([]);
  const [massstabFrage, setMassstabFrage] = useState(null);
  const [ortWahl, setOrtWahl] = useState('');
  const [routeWahl, setRouteWahl] = useState('');
  const [reiseWahl, setReiseWahl] = useState('');
  const [regionWahl, setRegionWahl] = useState('');
  const [begegnungen, setBegegnungen] = useState(null);
  const [handoutWahl, setHandoutWahl] = useState('');
  const [lesen, setLesen] = useState(null);
  const [mitglieder, setMitglieder] = useState(null);
  const [nebelArt, setNebelArt] = useState('kreis');
  const [nebelRadius, setNebelRadius] = useState('mittel');
  const [nebelZeigen, setNebelZeigen] = useState(true);
  const [tischFolgt, setTischFolgt] = useState(false);
  const [gesehen, setGesehen] = useState([]);
  const kanal = useRef(null);
  const tischZeit = useRef(0);
  const [chronikZeit, setChronikZeit] = useState(null);
  const [figurWahl, setFigurWahl] = useState('');
  const [gruppeWahl, setGruppeWahl] = useState('');
  const [helden, setHelden] = useState(null);
  const [geschichteWahl, setGeschichteWahl] = useState('');
  const [zeitRegler, setZeitRegler] = useState(null);
  const [offline, setOffline] = useState(null);
  const ortNachWechsel = useRef('');
  const [fokus, setFokus] = useState(null);
  const standRef = useRef(0);
  const arbeitRef = useRef(false);
  const abbruchRef = useRef(false);
  const dateiEingabe = useRef(null);
  const bildEingabe = useRef(null);
  const gedaechtnis = useRef({});

  const fehler = (e) => setMeldung({ art: 'fehler', text: (e && e.message) || String(e) });

  useEffect(() => {
    if (!angemeldet) return;
    planerApi('planer_start', {}).then(s => {
      offlineMerken('start', s);
      setStart(s);
      setAdvId(planerAdvAnfang(s.abenteuer || []));
    }).catch(e => {
      const alt = istNetzFehler(e) && offlineHolen('start');
      if (!alt) { fehler(e); return; }
      setOffline({ zeit: alt.zeit });
      setStart(alt.daten);
      setAdvId(planerAdvAnfang(alt.daten.abenteuer || []));
    });
  }, []);

  const laden = useCallback(async (id) => {
    if (!id) return;
    let d;
    try {
      d = await planerApi('planer_laden', { adv_id: id });
      offlineMerken(id, d);
      setOffline(null);
    } catch (e) {
      const alt = istNetzFehler(e) && offlineHolen(id);
      if (!alt) throw e;
      d = alt.daten;
      setOffline({ zeit: alt.zeit });
    }
    standRef.current = d.stand;
    setDaten(d);
    setAuswahl(a => (d.karten.some(k => k.id === a) ? a : ((d.karten[0] || {}).id || '')));
  }, []);

  useEffect(() => {
    if (!advId) return;
    try { localStorage.setItem(PLANER_ADV_SPEICHER, advId); } catch (e) { /* ohne Speicher */ }
    setDaten(null);
    setVerlauf([]);
    laden(advId).catch(fehler);
  }, [advId]);

  // Der Abgleich: nur die Zahl fragen, und nur laden, wenn sie sich bewegt.
  // Spieler fragen oefter — sie warten auf das, was die Spielleitung tut.
  const dmFuerAbgleich = !!(daten && daten.dm);
  useEffect(() => {
    if (!advId) return;
    const t = setInterval(() => {
      if (document.hidden || arbeitRef.current) return;
      planerApi('planer_stand', { adv_id: advId })
        .then(s => { if (s.stand !== standRef.current) return laden(advId); })
        .catch(() => {});
    }, dmFuerAbgleich ? PLANER_ABGLEICH_MS : PLANER_ABGLEICH_SPIELER_MS);
    return () => clearInterval(t);
  }, [advId, dmFuerAbgleich]);

  const dm = !!(daten && daten.dm);
  const karten = daten ? daten.karten : [];
  const karte = karten.find(k => k.id === auswahl) || null;
  const orte = daten && karte ? daten.objekte.filter(o => o.art === 'ort' && o.karteId === karte.id) : [];
  const ort = orte.find(o => o.id === ortWahl) || null;
  const routen = daten && karte ? daten.objekte.filter(o => o.art === 'route' && o.karteId === karte.id) : [];
  const reisen = daten && karte ? daten.objekte.filter(o => o.art === 'reise' && o.karteId === karte.id) : [];
  const regionen = daten && karte ? daten.objekte.filter(o => o.art === 'region' && o.karteId === karte.id) : [];
  const region = regionen.find(r => r.id === regionWahl) || null;
  const route = routen.find(r => r.id === routeWahl) || null;
  const reise = reisen.find(r => r.id === reiseWahl) || null;
  const reiseRoute = reise ? routen.find(r => r.id === reise.routeId) || null : null;
  // Wo jede Gruppe gerade steht.
  const gruppen = karte ? reisen.filter(j => !j.gruppeId).map(j => {
    const r = routen.find(x => x.id === j.routeId);
    if (!r) return null;
    const rr = routeInRichtung(r, j.richtung);
    return { id: j.id, name: j.name, sichtbar: j.sichtbar,
             punkt: karte.massstab ? punktAufRoute(rr, karte.massstab, j.pos || 0) : (rr.punkte || [])[0] };
  }).filter(Boolean) : [];
  // Nur eine Tafel zugleich.
  const tafelZu = () => { setOrtWahl(''); setRouteWahl(''); setReiseWahl(''); setRegionWahl(''); setHandoutWahl(''); setFigurWahl(''); setGeschichteWahl(''); setGruppeWahl(''); };
  const heldengruppen = daten && karte ? daten.objekte.filter(o => o.art === 'gruppe' && o.karteId === karte.id) : [];
  const heldengruppe = heldengruppen.find(g => g.id === gruppeWahl) || null;
  const figurenRoh = daten && karte ? daten.objekte.filter(o => o.art === 'figur' && o.karteId === karte.id) : [];
  const zeitSpanne = zeitBereich(figurenRoh, chronikZeit);
  const zeit = zeitRegler != null ? zeitRegler : (chronikZeit != null ? chronikZeit : (karte && Number.isFinite(+karte.zeit) ? +karte.zeit : zeitSpanne.min));
  const figuren = figurenRoh.map(f => ({ ...f, punkt: dm ? figurPosition(f, zeit) : figurFuerSpieler(f, karte) }));
  const figur = figurenRoh.find(f => f.id === figurWahl) || null;
  const quests = daten ? daten.objekte.filter(o => o.art === 'quest') : [];
  const hinweise = daten ? daten.objekte.filter(o => o.art === 'hinweis') : [];
  const fraktionen = daten ? daten.objekte.filter(o => o.art === 'fraktion') : [];
  const geschichte = [...quests, ...hinweise, ...fraktionen].find(o => o.id === geschichteWahl) || null;
  const alleOrte = daten ? daten.objekte.filter(o => o.art === 'ort') : [];
  const alleRegionen = daten ? daten.objekte.filter(o => o.art === 'region') : [];
  const questOrte = new Set(quests.filter(q => q.zielOrt && q.status !== 'erledigt' && q.status !== 'gescheitert').map(q => q.zielOrt));
  const handouts = daten ? daten.objekte.filter(o => o.art === 'handout') : [];
  const handout = handouts.find(h => h.id === handoutWahl) || null;
  const nebel = nebelVon(karte);

  // Was dieser Spieler schon gelesen hat, merkt sich sein Browser.
  useEffect(() => {
    try { setGesehen(JSON.parse(localStorage.getItem(PLANER_GESEHEN + advId) || '[]')); } catch (e) { setGesehen([]); }
  }, [advId]);
  const gelesen = (h) => {
    const neu = [...gesehen.filter(x => !x.startsWith(h.id + ':')), handoutFassung(h)];
    setGesehen(neu);
    try { localStorage.setItem(PLANER_GESEHEN + advId, JSON.stringify(neu)); } catch (e) { /* ohne Speicher */ }
  };
  const ungelesen = daten && !daten.dm ? ungeseheneHandouts(handouts, gesehen) : [];

  // Der Kanal zum Tischfenster.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    kanal.current = new BroadcastChannel(TISCH_KANAL);
    return () => { kanal.current.close(); kanal.current = null; };
  }, []);
  const anTisch = (art, inhalt) => { if (kanal.current) kanal.current.postMessage(tischNachricht(art, { advId, ...inhalt })); };
  const ansichtRef = useRef(null);
  const ansichtGemeldet = (v) => {
    ansichtRef.current = v;
    if (!tischFolgt || !karte) return;
    const jetzt = Date.now();
    if (jetzt - tischZeit.current < 250) return;
    tischZeit.current = jetzt;
    anTisch('ansicht', { karteId: karte.id, ansicht: v });
  };
  useEffect(() => { if (tischFolgt && karte) anTisch('karte', { karteId: karte.id, ansicht: ansichtRef.current }); }, [tischFolgt, karte && karte.id]);
  useEffect(() => { if (dm) anTisch('neu', {}); }, [daten && daten.stand]);
  const tischOeffnen = () => {
    window.open('?tisch=1&adv=' + encodeURIComponent(advId), 'hb-planer-tisch');
    setTischFolgt(true);
  };
  const waehleOrt = (id) => { if (id) tafelZu(); setOrtWahl(id); };
  const waehleRoute = (id) => { if (id) tafelZu(); setRouteWahl(id); };
  const waehleReise = (id) => { if (id) tafelZu(); setReiseWahl(id); };
  const waehleRegion = (id) => { if (id) tafelZu(); setRegionWahl(id); };
  const waehleHandout = (id) => { if (id) tafelZu(); setHandoutWahl(id); };
  const waehleFigur = (id) => { if (id) tafelZu(); setFigurWahl(id); };
  const waehleGruppe = (id) => { if (id) tafelZu(); setGruppeWahl(id); };

  // Die Boegen des Abenteuers, fuer die Heldengruppen.
  useEffect(() => {
    setHelden(null);
    if (!dm || !advId) return;
    planerApi('planer_helden', { adv_id: advId }).then(r => setHelden(r.helden || [])).catch(() => setHelden([]));
  }, [dm, advId]);

  // Eine Gruppe zieht: Spur speichern, dann den Nebel entlang des Wegs lichten.
  const gruppeBewegt = async (ergebnis, meldung) => {
    try {
      await objSpeichern(ergebnis.gruppe);
      if (nebel.an && ergebnis.kreise.length) await nebelSetzen([...nebel.flaechen, ...ergebnis.kreise]);
      else await laden(advId);
      if (meldung) setMeldung(meldung);
    } catch (e) { fehler(e); }
  };
  const gruppeZiehenNach = (g, p) => {
    const { punkt, ...rest } = g;
    return gruppeBewegt(gruppeZiehen(rest, p, zeit, karte.massstab));
  };
  const gruppeReistMit = (g, punkte, stunden, startStunde) => {
    const letzte = gruppePosition(g);
    let von = zeit;
    if (letzte && letzte.art === 'reise') von = Math.max(zeit, (Math.floor(letzte.zeit / 24) + 1) * 24 + startStunde);
    else if (letzte) von = Math.max(zeit, letzte.zeit);
    return gruppeBewegt(gruppeReist(g, punkte, von, stunden, karte.massstab));
  };
  const waehleGeschichte = (id) => { if (id) tafelZu(); setGeschichteWahl(id); };
  // Von einer Quest zu ihrem Ort, auch auf einer anderen Karte.
  const zumOrt = (o) => {
    if (!o) return;
    if (o.karteId !== auswahl) { ortNachWechsel.current = o.id; setAuswahl(o.karteId); setVerlauf([]); return; }
    waehleOrt(o.id);
    setFokus({ x: o.x, y: o.y, n: Date.now() });
  };
  const offlineBereit = async () => {
    try {
      const erg = await ausfuehren('Für offline bereithalten', async (melde) => {
        const liste = karten.flatMap(k => offlinePfade(k, daten.objekte));
        let n = 0, fehlt = 0;
        await nebenher(liste, 6, async (d) => {
          try { const r = await fetch(planerDateiUrl(d.ablage, d.pfad)); if (!r.ok) fehlt++; } catch (e) { fehlt++; }
          n++;
          if (n % 20 === 0 || n === liste.length) melde(n + ' von ' + liste.length + ' Dateien', n / Math.max(1, liste.length));
        });
        return { anzahl: liste.length, fehlt };
      });
      const sw = typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller;
      setMeldung(sw
        ? { art: erg.fehlt ? 'fehler' : 'gut', text: '📥 ' + (erg.anzahl - erg.fehlt) + ' von ' + erg.anzahl + ' Dateien liegen jetzt auch ohne Netz bereit.' }
        : { art: 'fehler', text: '📥 ' + erg.anzahl + ' Dateien geladen — aber ohne Service Worker bleibt nichts liegen. Das geht nur auf der ausgelieferten Seite (https).' });
    } catch (e) { fehler(e); }
  };

  // Die Mitglieder der Gruppe, fuer die Empfaenger eines Handouts.
  useEffect(() => {
    if (!dm || !handoutWahl || mitglieder) return;
    planerApi('member_list', {}).then(r => setMitglieder(r.mitglieder || [])).catch(() => setMitglieder([]));
  }, [dm, handoutWahl]);

  // Die Begegnungen des Heldenbuchs, auf die Tabellen verweisen. Nur lesen.
  useEffect(() => {
    setBegegnungen(null);
    if (!dm || !advId) return;
    planerApi('dm_load_encounters', {}).then(r => {
      setBegegnungen((r.encounters || []).filter(e => e && e.id && (!e.adventure || e.adventure === advId))
        .map(e => ({ id: e.id, name: e.name || 'Ohne Namen', difficulty: e.difficulty || '', enemies: e.enemies || [] })));
    }).catch(() => setBegegnungen([]));
  }, [dm, advId]);

  // Die Uhr der Chronik, damit die Reise ihren Ankunftstag nennt. Nur
  // lesen: gedreht wird sie im Heldenbuch.
  useEffect(() => {
    setChronikZeit(null);
    if (!dm || !advId) return;
    planerApi('dm_load_chronik', {}).then(r => {
      const z = r.chronik && r.chronik.zeit ? r.chronik.zeit[advId] : 0;
      setChronikZeit(+z || 0);
    }).catch(() => {});
  }, [dm, advId, daten && daten.stand]);

  useEffect(() => {
    setDateien(null);
    if (!dm || !karte) return;
    let aktuell = true;
    planerApi('planer_dateien_liste', { adv_id: advId, karte_id: karte.id })
      .then(l => { if (aktuell) setDateien({ anzahl: l.dateien.length, bytes: l.bytes }); })
      .catch(() => {});
    return () => { aktuell = false; };
  }, [auswahl, dm, daten && daten.stand]);

  // Werkzeug und Auswahl gehoeren zur Karte.
  useEffect(() => {
    setWerkzeug('ansehen'); setPunkte([]); setOrtWahl(''); setRouteWahl(''); setReiseWahl(''); setRegionWahl(''); setFigurWahl('');
    if (ortNachWechsel.current && daten) {
      const o = daten.objekte.find(x => x.id === ortNachWechsel.current);
      ortNachWechsel.current = '';
      if (o) { setOrtWahl(o.id); setFokus({ x: o.x, y: o.y, n: Date.now() }); }
    }
  }, [auswahl]);
  useEffect(() => {
    const taste = (e) => { if (e.key === 'Escape' && !frage && !massstabFrage && !arbeit) { setWerkzeug('ansehen'); setPunkte([]); } };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [frage, massstabFrage, arbeit]);

  const ausfuehren = async (titel, f, abbrechbar) => {
    arbeitRef.current = true;
    abbruchRef.current = false;
    setArbeit({ titel, text: '', anteil: 0, abbrechbar: !!abbrechbar });
    try {
      return await f((text, anteil) => setArbeit(a => a && ({ ...a, text, anteil: anteil === undefined ? a.anteil : anteil })));
    } finally {
      arbeitRef.current = false;
      setArbeit(null);
    }
  };

  const karteSpeichern = async (k) => {
    const { ablage, ...ohne } = k;
    const r = await planerApi('planer_karte_speichern', { adv_id: advId, karte: ohne });
    return r.karte;
  };
  const objSpeichern = (o) => planerApi('planer_obj_speichern', { adv_id: advId, obj: o });
  const neueKarte = async (name) => {
    try {
      const k = await karteSpeichern({ id: planNeueId('k'), name, sichtbar: false });
      await laden(advId);
      setAuswahl(k.id);
      setVerlauf([]);
    } catch (e) { fehler(e); }
  };
  const karteAendern = async (k, aenderung) => {
    try {
      await karteSpeichern({ ...k, ...aenderung });
      await laden(advId);
    } catch (e) { fehler(e); }
  };
  const karteLoeschen = (k) => setFrage({
    titel: 'Karte löschen?',
    text: '„' + k.name + '“ wird mit allen Orten und Dateien gelöscht. Das lässt sich nicht rückgängig machen — wer sichergehen will, exportiert vorher.',
    ja: 'Löschen', gefahr: true,
    onJa: async () => {
      try {
        await planerApi('planer_karte_loeschen', { adv_id: advId, karte_id: k.id });
        await laden(advId);
        setMeldung({ art: 'gut', text: '„' + k.name + '“ ist gelöscht.' });
      } catch (e) { fehler(e); }
    },
  });

  // ── Das Kartenbild ──────────────────────────────────────────────
  // Die neuen Kacheln kommen in einen neuen Ordner (b1, b2, …). Erst
  // wenn alle oben sind, zeigt die Karte darauf, und erst dann geht der
  // alte weg. Wer gerade schaut, sieht nie eine halbe Karte.
  const kartenbildSetzen = async (k, datei) => {
    const alt = k.bild || null;
    const version = ((alt && alt.version) || 0) + 1;
    const ordner = 'b' + version;
    let angefangen = false;
    try {
      const erg = await ausfuehren('Kartenbild', async (melde) => {
        melde('Bild öffnen …', 0);
        const masse = bildMasse(await dateiKopf(datei));
        const { bitmap, faktor } = await bildOeffnen(datei, masse);
        const plan = kachelPlan(bitmap.width, bitmap.height);
        const format = await bildFormat();
        melde(bitmap.width + ' × ' + bitmap.height + ' Pixel · ' + plan.anzahl + ' Kacheln in ' + (plan.maxZ + 1) + ' Stufen', 0);
        angefangen = true;
        const vorschauPfad = ordner + '/vorschau.' + format.endung;
        await planerApi('planer_dateien_hoch', { adv_id: advId, karte_id: k.id,
          dateien: [{ pfad: vorschauPfad, daten: base64AusBytes(await bildVerkleinert(bitmap, 360, format)) }] });
        const zeichne = kachelZeichner(bitmap, plan, ordner, format);
        try {
          await kachelnErzeugen({
            plan, zeichne, melde, abgebrochen: () => abbruchRef.current,
            hochladen: (b) => planerApi('planer_dateien_hoch', { adv_id: advId, karte_id: k.id,
              dateien: b.map(d => ({ pfad: d.pfad, daten: base64AusBytes(d.bytes) })) }),
          });
        } finally {
          zeichne.ende();
          if (bitmap.close) bitmap.close();
        }
        const bild = { breite: plan.breite, hoehe: plan.hoehe, kachel: plan.kachel, stufen: plan.maxZ,
          ordner, endung: format.endung, vorschau: vorschauPfad, version,
          quelle: { name: String(datei.name || '').slice(0, 120), bytes: datei.size }, verkleinert: faktor < 1 ? faktor : undefined };
        melde('Karte umstellen …', 1);
        // Hatte die Karte schon ein Bild anderer Groesse, wandern Orte
        // und Maßstab mit.
        const anders = alt && (alt.breite !== bild.breite || alt.hoehe !== bild.hoehe);
        const massstab = anders && k.massstab
          ? { ...k.massstab, a: punktSkalieren(k.massstab.a, alt, bild), b: punktSkalieren(k.massstab.b, alt, bild) } : k.massstab;
        await karteSpeichern({ ...k, bild, massstab });
        // Ab hier zeigt die Karte auf den neuen Ordner: er darf bei einem
        // spaeteren Fehler nicht mehr weggeraeumt werden.
        angefangen = false;
        if (anders) {
          for (const o of daten.objekte.filter(o => o.karteId === k.id && typeof o.x === 'number')) {
            await objSpeichern({ ...o, ...punktSkalieren(o, alt, bild) });
          }
        }
        if (alt && alt.ordner && alt.ordner !== ordner) {
          await planerApi('planer_dateien_weg', { adv_id: advId, karte_id: k.id, praefix: alt.ordner }).catch(() => {});
        }
        return { plan, faktor };
      }, true);
      delete gedaechtnis.current[k.id + '|' + ordner];
      await laden(advId);
      setMeldung({ art: 'gut', text: 'Kartenbild übernommen: ' + erg.plan.breite + ' × ' + erg.plan.hoehe + ' Pixel, ' + erg.plan.anzahl + ' Kacheln.'
        + (erg.faktor < 1 ? ' Der Browser konnte das Bild nicht in voller Größe öffnen; es wurde auf ' + Math.round(erg.faktor * 100) + ' % verkleinert.' : '') });
    } catch (e) {
      if (angefangen) planerApi('planer_dateien_weg', { adv_id: advId, karte_id: k.id, praefix: ordner }).catch(() => {});
      fehler(new Error(e.message === 'Abgebrochen.' ? 'Das Kartenbild wurde nicht übernommen (abgebrochen).' : 'Das Kartenbild wurde nicht übernommen: ' + e.message));
    }
  };
  const bildGewaehlt = (ev) => {
    const datei = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!datei || !karte) return;
    const k = karte;
    if (k.bild) {
      setFrage({ titel: 'Kartenbild ersetzen?', ja: 'Ersetzen',
        text: 'Das neue Bild ersetzt das bisherige. Orte und Maßstab bleiben an ihrer Stelle auf der Karte — hat das neue Bild eine andere Größe, werden sie umgerechnet.',
        onJa: () => kartenbildSetzen(k, datei) });
    } else {
      kartenbildSetzen(k, datei);
    }
  };

  // ── Klicks auf die Karte ────────────────────────────────────────
  // ── Nebel ───────────────────────────────────────────────────────
  // Jede Aenderung wird gleich gespeichert; die Spieler sehen sie mit dem
  // naechsten Abgleich. Orte, die mit dem Nebel aufgehen sollen, werden
  // dabei sichtbar geschaltet.
  const nebelSetzen = async (flaechen, an) => {
    if (!karte) return;
    const neu = { an: an === undefined ? nebel.an : an, flaechen: nebelAufraeumen(flaechen) };
    try {
      await karteSpeichern({ ...karte, nebel: neu });
      const frei = orteImAufgedeckten(daten.objekte.filter(o => o.karteId === karte.id), neu);
      for (const o of frei) await objSpeichern({ ...o, sichtbar: true });
      await laden(advId);
      if (frei.length) setMeldung({ art: 'gut', text: '☁ Der Nebel gibt frei: ' + frei.map(o => o.name).join(', ') + '.' });
    } catch (e) { fehler(e); }
  };
  const nebelAufdecken = (kreise) => nebelSetzen([...nebel.flaechen, ...kreise]);

  const aufKarteGeklickt = async (p, mass) => {
    if (werkzeug === 'ort' && dm && karte) {
      const neu = { id: planNeueId('o'), karteId: karte.id, art: 'ort', name: 'Neuer Ort', symbol: '📍', x: p.x, y: p.y, sichtbar: false, text: '', dm: { notiz: '' } };
      setWerkzeug('ansehen');
      try {
        await objSpeichern(neu);
        await laden(advId);
        waehleOrt(neu.id);
      } catch (e) { fehler(e); }
      return;
    }
    if (werkzeug === 'massstab') {
      const neu = [...punkte, p].slice(-2);
      setPunkte(neu);
      if (neu.length === 2) setMassstabFrage(neu);
      return;
    }
    if (werkzeug === 'gruppe' && dm && karte) {
      const frei = heldenOhneGruppe((helden || []).filter(h => !h.nurDm), heldengruppen);
      const g = neueGruppe(karte.id, p, zeit, frei.map(h => h.id), Object.fromEntries(frei.map(h => [h.id, h.name])));
      setWerkzeug('ansehen');
      await gruppeBewegt(gruppeZiehen({ ...g, spur: [] }, p, zeit, karte.massstab, 'start'));
      waehleGruppe(g.id);
      return;
    }
    if (werkzeug === 'gruppeZiehen' && dm && heldengruppe) {
      setWerkzeug('ansehen');
      gruppeZiehenNach(heldengruppe, p);
      return;
    }
    if (werkzeug === 'figur' && dm && karte) {
      const f = neueFigur(karte.id, zeit, p);
      setWerkzeug('ansehen');
      try { await objSpeichern(f); await laden(advId); waehleFigur(f.id); } catch (e) { fehler(e); }
      return;
    }
    if (werkzeug === 'wegpunkt' && dm && figur) {
      setWerkzeug('ansehen');
      objAendern(wegpunktSetzen(figur, zeit, p));
      return;
    }
    if (werkzeug === 'nebel' && dm && karte) {
      if (nebelArt === 'vieleck') { setPunkte(v => [...v, p]); return; }
      const r = (NEBEL_RADIEN.find(x => x.k === nebelRadius) || NEBEL_RADIEN[1]).px / (mass || 1);
      nebelSetzen([...nebel.flaechen, nebelKreis(p, r)]);
      return;
    }
    if (werkzeug === 'lineal' || werkzeug === 'route' || werkzeug === 'region') { setPunkte(v => [...v, p]); return; }
    tafelZu();
  };
  const regionAnlegen = async (punkteListe) => {
    if (!karte || punkteListe.length < 3) return;
    const neu = { id: planNeueId('g'), karteId: karte.id, art: 'region', name: 'Neue Region', punkte: punkteListe,
                  farbe: REGION_FARBEN[regionen.length % REGION_FARBEN.length], sichtbar: false, text: '', dm: { notiz: '' } };
    setWerkzeug('ansehen');
    setPunkte([]);
    try { await objSpeichern(neu); await laden(advId); waehleRegion(neu.id); } catch (e) { fehler(e); }
  };
  // ── Routen und Reisen ───────────────────────────────────────────
  const routeAnlegen = async (punkteListe) => {
    if (!karte || punkteListe.length < 2) return;
    const neu = { id: planNeueId('r'), karteId: karte.id, art: 'route', name: 'Neue Route', punkte: punkteListe,
                  gelaende: punkteListe.slice(1).map(() => 'offen'), sichtbar: false, text: '', dm: { notiz: '' } };
    setWerkzeug('ansehen');
    setPunkte([]);
    try { await objSpeichern(neu); await laden(advId); waehleRoute(neu.id); } catch (e) { fehler(e); }
  };
  const objAendern = async (o) => {
    try { await objSpeichern(o); await laden(advId); } catch (e) { fehler(e); }
  };
  const objWeg = (o, titel, text, danach) => setFrage({
    titel, text, ja: 'Löschen', gefahr: true,
    onJa: async () => {
      try { await planerApi('planer_obj_loeschen', { adv_id: advId, obj_id: o.id }); if (danach) await danach(); await laden(advId); }
      catch (e) { fehler(e); }
    },
  });
  const routeLoeschen = (r) => {
    const abh = reisen.filter(j => j.routeId === r.id);
    objWeg(r, 'Route löschen?', '„' + r.name + '“ wird gelöscht' + (abh.length ? ', mit ' + abh.length + (abh.length === 1 ? ' Reise' : ' Reisen') + ' darauf.' : '.'),
      async () => { for (const j of abh) await planerApi('planer_obj_loeschen', { adv_id: advId, obj_id: j.id }).catch(() => {}); setRouteWahl(''); });
  };
  const reiseAnlegen = async (r) => {
    const neu = neueReise(r);
    try { await objSpeichern(neu); await laden(advId); waehleReise(neu.id); } catch (e) { fehler(e); }
  };
  const massstabSpeichern = async (m) => {
    setMassstabFrage(null);
    setPunkte([]);
    setWerkzeug('ansehen');
    await karteAendern(karte, { massstab: m });
    setMeldung({ art: 'gut', text: 'Maßstab: ' + laengeText(m.laenge, m.einheit) + ' auf ' + Math.round(abstandPx(m.a, m.b)) + ' Pixel.' });
  };
  const werkzeugWaehlen = (w) => { setPunkte([]); setWerkzeug(v => v === w ? 'ansehen' : w); };

  // ── Orte ────────────────────────────────────────────────────────
  const ortSpeichern = async (o) => {
    try { await objSpeichern({ ...o, name: String(o.name || '').trim() || 'Ohne Namen' }); await laden(advId); }
    catch (e) { fehler(e); }
  };
  const ortVerschieben = (o, p) => ortSpeichern({ ...o, x: p.x, y: p.y });
  const ortLoeschen = (o) => setFrage({
    titel: 'Ort löschen?', ja: 'Löschen', gefahr: true,
    text: '„' + o.name + '“ wird mit seinen Bildern gelöscht.',
    onJa: async () => {
      try {
        if ((o.bilder || []).length) await planerApi('planer_dateien_weg', { adv_id: advId, karte_id: o.karteId, pfade: o.bilder }).catch(() => {});
        await planerApi('planer_obj_loeschen', { adv_id: advId, obj_id: o.id });
        setOrtWahl('');
        await laden(advId);
      } catch (e) { fehler(e); }
    },
  });
  const ortBilderHoch = async (o, liste) => {
    try {
      const neu = await ausfuehren('Bilder', async (melde) => {
        const format = await bildFormat();
        const pfade = [];
        for (let i = 0; i < liste.length; i++) {
          melde('Bild ' + (i + 1) + ' von ' + liste.length, i / liste.length);
          const { bitmap } = await bildOeffnen(liste[i], bildMasse(await dateiKopf(liste[i])));
          const bytes = await bildVerkleinert(bitmap, 1600, format);
          if (bitmap.close) bitmap.close();
          const pfad = 'orte/' + o.id.toLowerCase() + '/' + planNeueId('b').slice(2) + '.' + format.endung;
          await planerApi('planer_dateien_hoch', { adv_id: advId, karte_id: o.karteId, dateien: [{ pfad, daten: base64AusBytes(bytes) }] });
          pfade.push(pfad);
        }
        return pfade;
      });
      await ortSpeichern({ ...o, bilder: [...(o.bilder || []), ...neu] });
    } catch (e) { fehler(e); }
  };
  const ortBildWeg = async (o, pfad) => {
    try {
      await planerApi('planer_dateien_weg', { adv_id: advId, karte_id: o.karteId, pfade: [pfad] });
      await ortSpeichern({ ...o, bilder: (o.bilder || []).filter(p => p !== pfad) });
    } catch (e) { fehler(e); }
  };
  const zurUnterkarte = (id) => {
    if (!karten.some(k => k.id === id)) return;
    setVerlauf(v => [...v, auswahl]);
    setAuswahl(id);
  };
  const zurueck = () => {
    const v = [...verlauf];
    const id = v.pop();
    setVerlauf(v);
    if (id && karten.some(k => k.id === id)) setAuswahl(id);
  };

  // ── Paket ───────────────────────────────────────────────────────
  const advName = ((start && start.abenteuer || []).find(a => a.id === advId) || {}).name || '';

  const exportieren = async () => {
    try {
      const erg = await ausfuehren('Exportieren', async (melde) => {
        const frisch = await planerApi('planer_laden', { adv_id: advId });
        return planExportieren({
          daten: frisch,
          abenteuer: { id: advId, name: advName },
          dateienListe: async (z, art) => (await planerApi('planer_dateien_liste', art === 'objekt'
            ? { adv_id: advId, obj_id: z.id } : { adv_id: advId, karte_id: z.id })).dateien,
          dateiHolen: (ablage, pfad) => planerDateiHolen(ablage, pfad),
          programm: 'Abenteuerplaner ' + PLANER_VERSION,
          melde,
        });
      });
      planerSpeichern(erg.blob, planDateiname(advName));
      setMeldung({ art: 'gut', text: 'Exportiert: ' + erg.manifest.karten.length + ' Karten, ' + erg.manifest.objekte.length + ' Einträge, '
        + erg.dateien + ' Dateien (' + planGroesse(erg.blob.size) + ').' });
    } catch (e) { fehler(e); }
  };

  const dateiGewaehlt = async (ev) => {
    const datei = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!datei) return;
    try {
      const paket = await ausfuehren('Paket prüfen', async (melde) => { melde('Inhalt lesen …'); return planPaketOeffnen(datei); });
      setVorschau({ paket, dateiname: datei.name });
    } catch (e) { fehler(e); }
  };

  const einspielen = async () => {
    const v = vorschau;
    setVorschau(null);
    const vorhanden = new Set(karten.map(k => k.name));
    try {
      const erg = await ausfuehren('Einspielen', (melde) => planEinspielen({
        paket: v.paket,
        karteSpeichern,
        objSpeichern,
        dateienHoch: (ziel, liste) => planerApi('planer_dateien_hoch', typeof ziel === 'string'
          ? { adv_id: advId, karte_id: ziel, dateien: liste } : { adv_id: advId, obj_id: ziel.objId, dateien: liste }),
        objLoeschen: (id) => planerApi('planer_obj_loeschen', { adv_id: advId, obj_id: id }),
        karteLoeschen: (id) => planerApi('planer_karte_loeschen', { adv_id: advId, karte_id: id }),
        namenZusatz: (name) => vorhanden.has(name) ? ' (importiert)' : '',
        melde,
      }));
      await laden(advId);
      const ersteKarte = erg.karten ? erg.zuordnung.get(v.paket.manifest.karten[0].id) : '';
      if (ersteKarte) { setAuswahl(ersteKarte); setVerlauf([]); }
      setMeldung({ art: 'gut', text: 'Eingespielt: ' + erg.karten + ' Karten, ' + erg.objekte + ' Einträge, ' + erg.dateien + ' Dateien.' });
    } catch (e) {
      fehler(new Error('Einspielen abgebrochen, nichts wurde übernommen: ' + e.message));
      laden(advId).catch(() => {});
    }
  };

  if (!angemeldet) return <PlanerNichtAngemeldet />;

  const linie = ['lineal', 'massstab', 'route', 'region', 'nebel'].includes(werkzeug)
    ? { punkte: (werkzeug === 'region' || werkzeug === 'nebel') && punkte.length > 2 ? [...punkte, punkte[0]] : punkte, art: werkzeug === 'nebel' ? 'region' : werkzeug } : null;
  const strecke = werkzeug === 'lineal' && karte && karte.massstab && punkte.length > 1 ? wegLaenge(punkte, karte.massstab) : 0;
  const vorige = verlauf.length ? karten.find(k => k.id === verlauf[verlauf.length - 1]) : null;

  return (
    <div className="pl-seite">
      <header className="pl-kopf">
        <div className="pl-marke">🗺 Abenteuerplaner <span className="pl-ausgabe">{PLANER_VERSION}</span></div>
        {start && start.abenteuer.length > 0 && (
          <label className="pl-adv">
            <span className="pl-leise">Abenteuer</span>
            <select className="pl-feld" value={advId} onChange={e => setAdvId(e.target.value)}>
              {start.abenteuer.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
        )}
        {daten && <span className={'pl-rolle ' + (dm ? 'dm' : 'spieler')}>{dm ? 'Spielleitung' : 'Spieler'}</span>}
        <div className="pl-kopf-rechts">
          {dm && (
            <>
              <button className="pl-knopf" onClick={exportieren} disabled={!karten.length}
                title={karten.length ? 'Alle Karten, Einträge und Dateien als .hbplan-Datei speichern' : 'Noch nichts zu exportieren'}>⇩ Exportieren</button>
              <button className="pl-knopf" onClick={() => dateiEingabe.current && dateiEingabe.current.click()}
                title="Eine .hbplan-Datei in dieses Abenteuer einspielen">⇧ Importieren</button>
              <input ref={dateiEingabe} type="file" accept=".hbplan,.zip,application/zip" hidden onChange={dateiGewaehlt} />
              <button className="pl-knopf" onClick={tischOeffnen} title="Ein Fenster für Beamer oder zweiten Bildschirm: zeigt, was die Runde sehen darf">📺 Tisch</button>
              <label className={'pl-schalter pl-tisch-folgt' + (tischFolgt ? ' an' : '')} title="Der Tisch zeigt deine Karte und deinen Ausschnitt">
                <input type="checkbox" checked={tischFolgt} onChange={e => setTischFolgt(e.target.checked)} /><span>folgt mir</span>
              </label>
              <button className="pl-knopf pl-klein" onClick={() => anTisch('leer', {})} title="Ein gezeigtes Handout vom Tisch nehmen">📺 Karte zeigen</button>
            </>
          )}
          {daten && karten.length > 0 && <button className="pl-knopf pl-klein" onClick={offlineBereit} disabled={!!offline}
            title="Alle Karten, Bilder und Handouts für den Fall ohne Netz in diesem Browser ablegen">📥 Offline</button>}
          {start && <span className="pl-nutzer">{start.nutzer.name}</span>}
          <a className="pl-knopf pl-zurueck" href="../">⚔ Heldenbuch</a>
        </div>
      </header>

      {offline && (
        <div className="pl-meldung fehler" role="status">
          <span>📴 Kein Netz — der Stand vom {new Date(offline.zeit).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}. Ansehen geht, Ändern erst wieder mit Netz.</span>
        </div>
      )}
      {meldung && (
        <div className={'pl-meldung ' + meldung.art} role={meldung.art === 'fehler' ? 'alert' : 'status'}>
          <span>{meldung.text}</span>
          <button className="pl-symbol" aria-label="Meldung schließen" onClick={() => setMeldung(null)}>✕</button>
        </div>
      )}

      {start && start.abenteuer.length === 0 ? (
        <div className="pl-buehne-leer"><p>In dieser Gruppe gibt es noch kein Abenteuer. Lege im Heldenbuch eines an.</p></div>
      ) : !daten ? (
        <div className="pl-buehne-leer"><p>Lädt …</p></div>
      ) : (
        <main className={'pl-haupt-flaeche' + (ort || route || region || handout || figur || geschichte || heldengruppe || (reise && reiseRoute) ? ' mit-tafel' : '')}>
          <div className="pl-spalte">
            <PlanerKartenListe karten={karten} auswahl={auswahl} dm={dm}
              onWahl={(id) => { setAuswahl(id); setVerlauf([]); }} onNeu={neueKarte}
              onUmbenennen={(id, name) => karteAendern(karten.find(k => k.id === id), { name })}
              onSichtbar={(k) => karteAendern(k, { sichtbar: !k.sichtbar })}
              onLoeschen={karteLoeschen} />
            {karte && <PlanerOrtListe orte={orte} auswahl={ortWahl} dm={dm}
              onWahl={(o) => { waehleOrt(o.id); setFokus({ x: o.x, y: o.y, n: Date.now() }); }} />}
            <PlanerHandoutListe handouts={handouts} wahl={handoutWahl} dm={dm} gesehen={gesehen}
              onWahl={(id) => { if (dm) waehleHandout(id); else { const h = handouts.find(x => x.id === id); if (h) { setLesen(h); gelesen(h); } } }}
              onNeu={async () => { const h = neuesHandout(); try { await objSpeichern(h); await laden(advId); waehleHandout(h.id); } catch (e) { fehler(e); } }} />
            <GeschichteListe dm={dm} quests={quests} hinweise={hinweise} fraktionen={fraktionen} wahl={geschichteWahl}
              onWahl={(o) => waehleGeschichte(o.id)}
              onNeu={async (art) => {
                const n = art === 'quest' ? neueQuest() : art === 'hinweis' ? neuerHinweis() : neueFraktion();
                try { await objSpeichern(n); await laden(advId); waehleGeschichte(n.id); } catch (e) { fehler(e); }
              }} />
            {karte && <PlanerGruppenListe gruppen={heldengruppen} wahl={gruppeWahl} dm={dm}
              onWahl={(g) => { waehleGruppe(g.id); const p = gruppePosition(g); if (p) setFokus({ x: p.x, y: p.y, n: Date.now() }); }} />}
            {karte && <PlanerRegionListe regionen={regionen} regionWahl={regionWahl} dm={dm}
              onWahl={(r) => { waehleRegion(r.id); setFokus({ ...polygonMitte(r.punkte), n: Date.now() }); }} />}
            {karte && <PlanerWegListe routen={routen} reisen={reisen} routeWahl={routeWahl} reiseWahl={reiseWahl} dm={dm}
              onRouteWahl={(id) => { waehleRoute(id); const r = routen.find(x => x.id === id); if (r && r.punkte && r.punkte[0]) setFokus({ ...r.punkte[0], n: Date.now() }); }}
              onReiseWahl={(id) => { waehleReise(id); const gr = gruppen.find(x => x.id === id); if (gr && gr.punkt) setFokus({ ...gr.punkt, n: Date.now() }); }} />}
          </div>
          {!karte ? (
            <div className="pl-buehne-leer"><p>{karten.length ? 'Wähle links eine Karte.' : ''}</p></div>
          ) : (
            <section className="pl-buehne">
              <header className="pl-buehne-kopf">
                {vorige && <button className="pl-knopf pl-klein" onClick={zurueck}>← {vorige.name}</button>}
                <h1>{karte.name}</h1>
                {dm && <span className={'pl-sicht ' + (karte.sichtbar ? 'an' : 'aus')}>{karte.sichtbar ? 'für Spieler sichtbar' : 'für Spieler verborgen'}</span>}
                {dm && nebel.an && (
                  <label className="pl-schalter pl-nebel-zeigen" title="Nur für dich: den Nebel halb durchsichtig darüberlegen">
                    <input type="checkbox" checked={nebelZeigen} onChange={e => setNebelZeigen(e.target.checked)} /><span>☁ Nebel zeigen</span>
                  </label>
                )}
                <div className="pl-werkzeuge" role="toolbar" aria-label="Werkzeuge">
                  {dm && <button className="pl-knopf pl-klein" onClick={() => bildEingabe.current && bildEingabe.current.click()}>🖼 {karte.bild ? 'Bild ersetzen' : 'Kartenbild'}</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'ort' ? ' an' : '')} aria-pressed={werkzeug === 'ort'} onClick={() => werkzeugWaehlen('ort')}>📍 Ort setzen</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'massstab' ? ' an' : '')} aria-pressed={werkzeug === 'massstab'} onClick={() => werkzeugWaehlen('massstab')}>📏 Maßstab</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'gruppe' ? ' an' : '')} aria-pressed={werkzeug === 'gruppe'} onClick={() => werkzeugWaehlen('gruppe')}>🛡 Gruppe</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'figur' ? ' an' : '')} aria-pressed={werkzeug === 'figur'} onClick={() => werkzeugWaehlen('figur')}>🧍 Figur</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'nebel' ? ' an' : '')} aria-pressed={werkzeug === 'nebel'} onClick={() => werkzeugWaehlen('nebel')}>☁ Nebel</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'region' ? ' an' : '')} aria-pressed={werkzeug === 'region'} onClick={() => werkzeugWaehlen('region')}>⬡ Region</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'route' ? ' an' : '')} aria-pressed={werkzeug === 'route'} onClick={() => werkzeugWaehlen('route')}>🛤 Route</button>}
                  {karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'lineal' ? ' an' : '')} aria-pressed={werkzeug === 'lineal'} onClick={() => werkzeugWaehlen('lineal')}>📐 Messen</button>}
                  <input ref={bildEingabe} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={bildGewaehlt} />
                  {dm && karte.bild && <HexEinstellung karte={karte} onSpeichern={(h) => karteAendern(karte, { hex: h })} />}
                </div>
              </header>
              {werkzeug !== 'ansehen' && (
                <div className="pl-werkzeug-hinweis" role="status">
                  <span>{WERKZEUG_HINWEIS[werkzeug]}</span>
                  {werkzeug === 'lineal' && (
                    <strong className="pl-strecke">
                      {!karte.massstab ? 'Ohne Maßstab lässt sich nicht messen' + (dm ? ' — leg ihn mit 📏 fest.' : '.')
                        : punkte.length > 1 ? laengeText(strecke, karte.massstab.einheit) + ' · ' + fussZeitText(strecke, karte.massstab.einheit) : ''}
                    </strong>
                  )}
                  {werkzeug === 'route' && (
                    <strong className="pl-strecke">
                      {punkte.length > 1 && karte.massstab ? laengeText(wegLaenge(punkte, karte.massstab), karte.massstab.einheit) : punkte.length + ' Punkte'}
                    </strong>
                  )}
                  {(werkzeug === 'lineal' || werkzeug === 'route' || werkzeug === 'region') && punkte.length > 0 && <button className="pl-knopf pl-klein" onClick={() => setPunkte(v => v.slice(0, -1))}>↶ Punkt</button>}
                  {werkzeug === 'lineal' && punkte.length > 0 && <button className="pl-knopf pl-klein" onClick={() => setPunkte([])}>Neu</button>}
                  {werkzeug === 'lineal' && dm && punkte.length > 1 && <button className="pl-knopf pl-klein" onClick={() => routeAnlegen(punkte)}>🛤 Als Route speichern</button>}
                  {werkzeug === 'route' && <button className="pl-knopf pl-klein pl-haupt" disabled={punkte.length < 2} onClick={() => routeAnlegen(punkte)}>Route anlegen</button>}
                  {werkzeug === 'nebel' && (
                    <span className="pl-nebel-steuer">
                      <label className="pl-schalter"><input type="checkbox" checked={nebel.an} onChange={e => nebelSetzen(nebel.flaechen, e.target.checked)} /><span>Nebel für Spieler</span></label>
                      <span className="pl-knopfgruppe" role="radiogroup" aria-label="Aufdecken">
                        {NEBEL_RADIEN.map(x => (
                          <button key={x.k} role="radio" aria-checked={nebelArt === 'kreis' && nebelRadius === x.k}
                            className={'pl-knopf pl-klein' + (nebelArt === 'kreis' && nebelRadius === x.k ? ' an' : '')}
                            onClick={() => { setNebelArt('kreis'); setNebelRadius(x.k); setPunkte([]); }}>◯ {x.l}</button>
                        ))}
                        <button role="radio" aria-checked={nebelArt === 'vieleck'} className={'pl-knopf pl-klein' + (nebelArt === 'vieleck' ? ' an' : '')}
                          onClick={() => { setNebelArt('vieleck'); setPunkte([]); }}>⬡ Fläche</button>
                      </span>
                      {nebelArt === 'vieleck' && <button className="pl-knopf pl-klein pl-haupt" disabled={punkte.length < 3}
                        onClick={() => { nebelSetzen([...nebel.flaechen, { art: 'vieleck', punkte }]); setPunkte([]); }}>Aufdecken</button>}
                      <button className="pl-knopf pl-klein" disabled={!nebel.flaechen.length} onClick={() => nebelSetzen(nebel.flaechen.slice(0, -1))}>↶ Zurück</button>
                      <button className="pl-knopf pl-klein" onClick={() => nebelSetzen([{ art: 'alles' }])}>Alles aufdecken</button>
                      <button className="pl-knopf pl-klein" onClick={() => nebelSetzen([])}>Alles zudecken</button>
                    </span>
                  )}
                  {werkzeug === 'region' && karte.bild && punkte.length === 0 && (
                    <button className="pl-knopf pl-klein" onClick={() => regionAnlegen([{ x: 0, y: 0 }, { x: karte.bild.breite, y: 0 }, { x: karte.bild.breite, y: karte.bild.hoehe }, { x: 0, y: karte.bild.hoehe }])}>▭ Ganze Karte</button>
                  )}
                  {werkzeug === 'region' && <button className="pl-knopf pl-klein pl-haupt" disabled={punkte.length < 3} onClick={() => regionAnlegen(punkte)}>Region anlegen</button>}
                  <button className="pl-knopf pl-klein" onClick={() => { setWerkzeug('ansehen'); setPunkte([]); }}>Fertig</button>
                </div>
              )}
              {figurenRoh.length > 0 && (
                <Zeitleiste dm={dm} zeit={zeit} bereich={zeitSpanne} chronikZeit={chronikZeit} freigegeben={karte.zeit}
                  onZeit={(z) => setZeitRegler(Math.max(0, z))} onFreigeben={(z) => karteAendern(karte, { zeit: z })} />
              )}
              <KartenLeinwand karte={karte} orte={orte} dm={dm} werkzeug={werkzeug} ortWahl={ortWahl}
                linie={linie} fokus={fokus} gedaechtnis={gedaechtnis}
                routen={routen} gruppen={gruppen} routeWahl={routeWahl} reiseWahl={reiseWahl}
                onRouteWahl={waehleRoute} onReiseWahl={waehleReise}
                regionen={regionen} regionWahl={regionWahl} onRegionWahl={waehleRegion}
                nebel={dm && !nebelZeigen && werkzeug !== 'nebel' ? null : nebel} nebelDeckend={!dm} onAnsicht={dm ? ansichtGemeldet : null}
                figuren={figuren} figurWahl={figurWahl} onFigurWahl={waehleFigur}
                onFigurVerschieben={(f, p) => { const { punkt, ...rest } = f; objAendern(wegpunktSetzen(rest, zeit, p)); }}
                hex={dm || (karte.hex && karte.hex.spieler) ? karte.hex : null} questOrte={questOrte}
                heldengruppen={heldengruppen} gruppeWahl={gruppeWahl} onGruppeWahl={waehleGruppe}
                onGruppeZiehen={(g, p) => gruppeZiehenNach(g, p)}
                onKlick={aufKarteGeklickt} onOrtWahl={waehleOrt} onOrtVerschieben={ortVerschieben}
                onBildWaehlen={() => bildEingabe.current && bildEingabe.current.click()} />
              <dl className="pl-fakten pl-fakten-quer">
                {karte.bild && <><dt>Bild</dt><dd>{karte.bild.breite} × {karte.bild.hoehe}</dd></>}
                {karte.massstab && <><dt>Maßstab</dt><dd>{laengeText(karte.massstab.laenge, karte.massstab.einheit)} = {Math.round(abstandPx(karte.massstab.a, karte.massstab.b))} px</dd></>}
                <dt>Orte</dt><dd>{orte.length}</dd>
                {dm && <><dt>Dateien</dt><dd>{dateien ? dateien.anzahl + ' · ' + planGroesse(dateien.bytes) : '…'}</dd></>}
              </dl>
            </section>
          )}
          {ort && karte && (
            <OrtTafel key={ort.id} ort={ort} dm={dm} karte={karte} karten={karten} arbeitet={!!arbeit}
              wissen={dm ? hinweise.filter(h => h.ortId === ort.id) : bekanntesWissen(hinweise, ort.id)}
              quests={quests.filter(q => q.zielOrt === ort.id)} onGeschichte={(o) => waehleGeschichte(o.id)} onMeldung={setMeldung}
              onSpeichern={ortSpeichern} onLoeschen={ortLoeschen} onSchliessen={() => setOrtWahl('')}
              onUnterkarte={zurUnterkarte} onBilderHoch={ortBilderHoch} onBildWeg={ortBildWeg} />
          )}
          {heldengruppe && karte && (
            <GruppeTafel key={heldengruppe.id} gruppe={heldengruppe} dm={dm} karte={karte} helden={helden} gruppen={heldengruppen}
              zieht={werkzeug === 'gruppeZiehen'}
              onSpeichern={(g) => objAendern({ ...g, name: String(g.name || '').trim() || 'Heldengruppe' })}
              onLoeschen={(g) => objWeg(g, 'Gruppe löschen?', '„' + g.name + '“ wird mit ihrer Spur gelöscht. Die Bögen bleiben, der gelichtete Nebel auch.', async () => setGruppeWahl(''))}
              onSchliessen={() => setGruppeWahl('')}
              onZiehenWaehlen={() => { setPunkte([]); setWerkzeug(v => v === 'gruppeZiehen' ? 'ansehen' : 'gruppeZiehen'); }}
              onZuruecknehmen={() => objAendern({ ...heldengruppe, spur: heldengruppe.spur.slice(0, -1) })}
              onTeilen={async (g, ids) => {
                const t = gruppeTeilen(g, ids, planNeueId('g'), zeit);
                if (!t) return;
                try { await objSpeichern(t.alte); await objSpeichern(t.neue); await laden(advId); waehleGruppe(t.neue.id);
                  setMeldung({ art: 'gut', text: '✂ „' + t.neue.name + '“ zieht als eigene Gruppe los.' }); } catch (e) { fehler(e); }
              }}
              onVereinen={async (a, b) => {
                // Die groessere Gruppe bleibt bestehen — mit ihrer ganzen Spur;
                // die kleinere geht in ihr auf.
                const [bleibt, geht] = (b.helden || []).length > (a.helden || []).length ? [b, a] : [a, b];
                try { await objSpeichern(gruppenVereinen(bleibt, geht, zeit)); await planerApi('planer_obj_loeschen', { adv_id: advId, obj_id: geht.id }); await laden(advId);
                  waehleGruppe(bleibt.id);
                  setMeldung({ art: 'gut', text: '⤵ „' + geht.name + '“ ist in „' + bleibt.name + '“ aufgegangen.' }); } catch (e) { fehler(e); }
              }} />
          )}
          {figur && karte && (
            <FigurTafel key={figur.id} figur={figur} dm={dm} zeit={zeit} wegpunktWartet={werkzeug === 'wegpunkt'}
              onSpeichern={(f) => objAendern({ ...f, name: String(f.name || '').trim() || 'Ohne Namen' })}
              onLoeschen={(f) => objWeg(f, 'Figur löschen?', '„' + f.name + '“ wird mit allen Wegpunkten gelöscht.', async () => setFigurWahl(''))}
              onSchliessen={() => setFigurWahl('')}
              onWegpunktHier={() => { setPunkte([]); setWerkzeug(v => v === 'wegpunkt' ? 'ansehen' : 'wegpunkt'); }} />
          )}
          {geschichte && (
            <GeschichteTafel key={geschichte.id} eintrag={geschichte} dm={dm} orte={alleOrte} quests={quests} regionen={alleRegionen}
              onSpeichern={(o) => objAendern(o)}
              onLoeschen={(o) => objWeg(o, 'Löschen?', '„' + (o.titel || o.name || String(o.text || '').slice(0, 40)) + '“ wird gelöscht.', async () => setGeschichteWahl(''))}
              onSchliessen={() => setGeschichteWahl('')}
              onOrt={zumOrt} />
          )}
          {handout && dm && (
            <HandoutTafel key={handout.id} handout={handout} mitglieder={mitglieder} arbeitet={!!arbeit}
              onSpeichern={(h) => objAendern({ ...h, titel: String(h.titel || '').trim() || 'Ohne Titel' })}
              onVerteilen={(h, an) => objAendern({ ...h, sichtbar: an, geaendert: an ? Date.now() : h.geaendert })}
              onLoeschen={(h) => objWeg(h, 'Handout löschen?', '„' + h.titel + '“ wird mit seinem Bild gelöscht — auch bei den Spielern.', async () => setHandoutWahl(''))}
              onSchliessen={() => setHandoutWahl('')}
              onTisch={(h) => { anTisch('handout', { id: h.id, handout: { titel: h.titel, text: h.text, bild: h.bild, ablage: handout.ablage } }); setMeldung({ art: 'gut', text: '📺 „' + h.titel + '“ ist an den Tisch geschickt.' }); }}
              onBild={async (h, datei) => {
                try {
                  // Speichern und Neuladen gehoeren mit in die Arbeit: sonst
                  // verteilt ein schneller Klick die alte Fassung ohne Bild.
                  await ausfuehren('Bild', async (melde) => {
                    melde('Bild verkleinern …');
                    const format = await bildFormat();
                    const { bitmap } = await bildOeffnen(datei, bildMasse(await dateiKopf(datei)));
                    const bytes = await bildVerkleinert(bitmap, 2000, format);
                    if (bitmap.close) bitmap.close();
                    const neuPfad = 'bild-' + planNeueId('b').slice(2) + '.' + format.endung;
                    await planerApi('planer_dateien_hoch', { adv_id: advId, obj_id: h.id, dateien: [{ pfad: neuPfad, daten: base64AusBytes(bytes) }] });
                    if (h.bild) await planerApi('planer_dateien_weg', { adv_id: advId, obj_id: h.id, pfade: [h.bild] }).catch(() => {});
                    melde('Speichern …');
                    await objSpeichern({ ...h, bild: neuPfad, geaendert: h.sichtbar ? Date.now() : h.geaendert });
                    await laden(advId);
                  });
                } catch (e) { fehler(e); }
              }} />
          )}
          {region && karte && (
            <RegionTafel key={region.id} region={region} dm={dm} karte={karte} begegnungen={begegnungen} advId={advId}
              onSpeichern={(r) => objAendern({ ...r, name: String(r.name || '').trim() || 'Ohne Namen' })}
              onLoeschen={(r) => objWeg(r, 'Region löschen?', '„' + r.name + '“ wird mit ihrer Begegnungstabelle gelöscht.', async () => setRegionWahl(''))}
              onSchliessen={() => setRegionWahl('')} onMeldung={setMeldung} />
          )}
          {route && karte && (
            <RouteTafel key={route.id} route={route} dm={dm} karte={karte} reisen={reisen}
              onSpeichern={(r) => objAendern({ ...r, name: String(r.name || '').trim() || 'Ohne Namen' })}
              onLoeschen={routeLoeschen} onSchliessen={() => setRouteWahl('')}
              onReiseNeu={reiseAnlegen} onReiseWahl={waehleReise} />
          )}
          {reise && reiseRoute && karte && (
            <ReiseTafel key={reise.id} reise={reise} route={reiseRoute} dm={dm} karte={karte} advId={advId} chronikZeit={chronikZeit}
              regionen={regionen} begegnungen={begegnungen || []} onNebelAufdecken={nebelAufdecken}
              heldengruppen={heldengruppen} onGruppeReist={gruppeReistMit}
              onSpeichern={(j) => objAendern({ ...j, name: String(j.name || '').trim() || 'Reise' })}
              onLoeschen={(j) => objWeg(j, 'Reise löschen?', '„' + j.name + '“ wird gelöscht. Die Route bleibt.', async () => setReiseWahl(''))}
              onSchliessen={() => setReiseWahl('')} onMeldung={setMeldung} />
          )}
        </main>
      )}

      {!dm && (lesen || ungelesen[0]) && (
        <HandoutLeser handout={lesen || ungelesen[0]} onZu={() => { gelesen(lesen || ungelesen[0]); setLesen(null); }} />
      )}
      {massstabFrage && <MassstabDialog punkte={massstabFrage} alt={karte && karte.massstab}
        onSpeichern={massstabSpeichern} onZu={() => { setMassstabFrage(null); setPunkte([]); }} />}
      {vorschau && <PlanerImportVorschau vorschau={vorschau} onEinspielen={einspielen} onZu={() => setVorschau(null)} />}
      {frage && <PlanerFrage frage={frage} onZu={() => setFrage(null)} />}
      {arbeit && <PlanerArbeit arbeit={arbeit} onAbbrechen={() => { abbruchRef.current = true; setArbeit(a => a && ({ ...a, abbruch: true })); }} />}
    </div>
  );
};

// Der Einstieg — aus planer/index.html und aus dev/planer-echt.html.
const planerWurzeln = new Map();
const planerStarten = (el, optionen) => {
  if (planerWurzeln.has(el)) planerWurzeln.get(el).unmount();
  const w = ReactDOM.createRoot(el);
  planerWurzeln.set(el, w);
  w.render(optionen && optionen.tisch ? <TischApp adv={optionen.adv} /> : <PlanerApp />);
};
