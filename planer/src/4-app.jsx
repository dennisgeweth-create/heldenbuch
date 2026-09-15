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

const WERKZEUG_HINWEIS = {
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
  const [chronikZeit, setChronikZeit] = useState(null);
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
      setStart(s);
      setAdvId(planerAdvAnfang(s.abenteuer || []));
    }).catch(fehler);
  }, []);

  const laden = useCallback(async (id) => {
    if (!id) return;
    const d = await planerApi('planer_laden', { adv_id: id });
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
  useEffect(() => {
    if (!advId) return;
    const t = setInterval(() => {
      if (document.hidden || arbeitRef.current) return;
      planerApi('planer_stand', { adv_id: advId })
        .then(s => { if (s.stand !== standRef.current) return laden(advId); })
        .catch(() => {});
    }, PLANER_ABGLEICH_MS);
    return () => clearInterval(t);
  }, [advId]);

  const dm = !!(daten && daten.dm);
  const karten = daten ? daten.karten : [];
  const karte = karten.find(k => k.id === auswahl) || null;
  const orte = daten && karte ? daten.objekte.filter(o => o.art === 'ort' && o.karteId === karte.id) : [];
  const ort = orte.find(o => o.id === ortWahl) || null;
  const routen = daten && karte ? daten.objekte.filter(o => o.art === 'route' && o.karteId === karte.id) : [];
  const reisen = daten && karte ? daten.objekte.filter(o => o.art === 'reise' && o.karteId === karte.id) : [];
  const route = routen.find(r => r.id === routeWahl) || null;
  const reise = reisen.find(r => r.id === reiseWahl) || null;
  const reiseRoute = reise ? routen.find(r => r.id === reise.routeId) || null : null;
  // Wo jede Gruppe gerade steht.
  const gruppen = karte ? reisen.map(j => {
    const r = routen.find(x => x.id === j.routeId);
    if (!r) return null;
    const rr = routeInRichtung(r, j.richtung);
    return { id: j.id, name: j.name, sichtbar: j.sichtbar,
             punkt: karte.massstab ? punktAufRoute(rr, karte.massstab, j.pos || 0) : (rr.punkte || [])[0] };
  }).filter(Boolean) : [];
  // Nur eine Tafel zugleich.
  const waehleOrt = (id) => { setOrtWahl(id); if (id) { setRouteWahl(''); setReiseWahl(''); } };
  const waehleRoute = (id) => { setRouteWahl(id); if (id) { setOrtWahl(''); setReiseWahl(''); } };
  const waehleReise = (id) => { setReiseWahl(id); if (id) { setOrtWahl(''); setRouteWahl(''); } };

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
  useEffect(() => { setWerkzeug('ansehen'); setPunkte([]); setOrtWahl(''); setRouteWahl(''); setReiseWahl(''); }, [auswahl]);
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
  const aufKarteGeklickt = async (p) => {
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
    if (werkzeug === 'lineal' || werkzeug === 'route') { setPunkte(v => [...v, p]); return; }
    waehleOrt('');
    setRouteWahl('');
    setReiseWahl('');
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
          dateienListe: async (k) => (await planerApi('planer_dateien_liste', { adv_id: advId, karte_id: k.id })).dateien,
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
        dateienHoch: (karteId, liste) => planerApi('planer_dateien_hoch', { adv_id: advId, karte_id: karteId, dateien: liste }),
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

  const linie = werkzeug === 'lineal' || werkzeug === 'massstab' || werkzeug === 'route' ? { punkte, art: werkzeug } : null;
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
            </>
          )}
          {start && <span className="pl-nutzer">{start.nutzer.name}</span>}
          <a className="pl-knopf pl-zurueck" href="../">⚔ Heldenbuch</a>
        </div>
      </header>

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
        <main className={'pl-haupt-flaeche' + (ort || route || (reise && reiseRoute) ? ' mit-tafel' : '')}>
          <div className="pl-spalte">
            <PlanerKartenListe karten={karten} auswahl={auswahl} dm={dm}
              onWahl={(id) => { setAuswahl(id); setVerlauf([]); }} onNeu={neueKarte}
              onUmbenennen={(id, name) => karteAendern(karten.find(k => k.id === id), { name })}
              onSichtbar={(k) => karteAendern(k, { sichtbar: !k.sichtbar })}
              onLoeschen={karteLoeschen} />
            {karte && <PlanerOrtListe orte={orte} auswahl={ortWahl} dm={dm}
              onWahl={(o) => { waehleOrt(o.id); setFokus({ x: o.x, y: o.y, n: Date.now() }); }} />}
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
                <div className="pl-werkzeuge" role="toolbar" aria-label="Werkzeuge">
                  {dm && <button className="pl-knopf pl-klein" onClick={() => bildEingabe.current && bildEingabe.current.click()}>🖼 {karte.bild ? 'Bild ersetzen' : 'Kartenbild'}</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'ort' ? ' an' : '')} aria-pressed={werkzeug === 'ort'} onClick={() => werkzeugWaehlen('ort')}>📍 Ort setzen</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'massstab' ? ' an' : '')} aria-pressed={werkzeug === 'massstab'} onClick={() => werkzeugWaehlen('massstab')}>📏 Maßstab</button>}
                  {dm && karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'route' ? ' an' : '')} aria-pressed={werkzeug === 'route'} onClick={() => werkzeugWaehlen('route')}>🛤 Route</button>}
                  {karte.bild && <button className={'pl-knopf pl-klein' + (werkzeug === 'lineal' ? ' an' : '')} aria-pressed={werkzeug === 'lineal'} onClick={() => werkzeugWaehlen('lineal')}>📐 Messen</button>}
                  <input ref={bildEingabe} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" hidden onChange={bildGewaehlt} />
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
                  {(werkzeug === 'lineal' || werkzeug === 'route') && punkte.length > 0 && <button className="pl-knopf pl-klein" onClick={() => setPunkte(v => v.slice(0, -1))}>↶ Punkt</button>}
                  {werkzeug === 'lineal' && punkte.length > 0 && <button className="pl-knopf pl-klein" onClick={() => setPunkte([])}>Neu</button>}
                  {werkzeug === 'lineal' && dm && punkte.length > 1 && <button className="pl-knopf pl-klein" onClick={() => routeAnlegen(punkte)}>🛤 Als Route speichern</button>}
                  {werkzeug === 'route' && <button className="pl-knopf pl-klein pl-haupt" disabled={punkte.length < 2} onClick={() => routeAnlegen(punkte)}>Route anlegen</button>}
                  <button className="pl-knopf pl-klein" onClick={() => { setWerkzeug('ansehen'); setPunkte([]); }}>Fertig</button>
                </div>
              )}
              <KartenLeinwand karte={karte} orte={orte} dm={dm} werkzeug={werkzeug} ortWahl={ortWahl}
                linie={linie} fokus={fokus} gedaechtnis={gedaechtnis}
                routen={routen} gruppen={gruppen} routeWahl={routeWahl} reiseWahl={reiseWahl}
                onRouteWahl={waehleRoute} onReiseWahl={waehleReise}
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
              onSpeichern={ortSpeichern} onLoeschen={ortLoeschen} onSchliessen={() => setOrtWahl('')}
              onUnterkarte={zurUnterkarte} onBilderHoch={ortBilderHoch} onBildWeg={ortBildWeg} />
          )}
          {route && karte && (
            <RouteTafel key={route.id} route={route} dm={dm} karte={karte} reisen={reisen}
              onSpeichern={(r) => objAendern({ ...r, name: String(r.name || '').trim() || 'Ohne Namen' })}
              onLoeschen={routeLoeschen} onSchliessen={() => setRouteWahl('')}
              onReiseNeu={reiseAnlegen} onReiseWahl={waehleReise} />
          )}
          {reise && reiseRoute && karte && (
            <ReiseTafel key={reise.id} reise={reise} route={reiseRoute} dm={dm} karte={karte} advId={advId} chronikZeit={chronikZeit}
              onSpeichern={(j) => objAendern({ ...j, name: String(j.name || '').trim() || 'Reise' })}
              onLoeschen={(j) => objWeg(j, 'Reise löschen?', '„' + j.name + '“ wird gelöscht. Die Route bleibt.', async () => setReiseWahl(''))}
              onSchliessen={() => setReiseWahl('')} onMeldung={setMeldung} />
          )}
        </main>
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
let planerWurzel = null;
const planerStarten = (el) => {
  if (planerWurzel) planerWurzel.unmount();
  planerWurzel = ReactDOM.createRoot(el);
  planerWurzel.render(<PlanerApp />);
};
