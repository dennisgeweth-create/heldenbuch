// ── Abenteuerplaner: die Seite ───────────────────────────────────
// Stufe 0 ist das Geruest: wer bin ich, welches Abenteuer, welche
// Karten gibt es — und das Paket hinaus und wieder hinein. Das
// Kartenbild selbst, Orte und Reisen kommen in den naechsten Stufen.
//
// Die Wege nach draussen stehen in planer/index.html (planerApi,
// planerDateiHolen, planerSpeichern, planerZugang), damit dev/planer-echt.html
// dieselbe Seite gegen ein Gedaechtnis fahren kann.

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

const PlanerArbeit = ({ arbeit }) => (
  <div className="pl-schleier">
    <div className="pl-dialog" role="status" aria-live="polite">
      <h2>{arbeit.titel}</h2>
      <p className="pl-arbeit-text">{arbeit.text || '…'}</p>
      <div className="pl-balken"><div style={{ width: Math.round((arbeit.anteil || 0) * 100) + '%' }} /></div>
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
                <span>{k.name}</span>
                {dm && !k.sichtbar && <span className="pl-marke-verborgen" title="Für Spieler verborgen">verborgen</span>}
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

const PlanerKarteAnsicht = ({ karte, dm, objekte, dateien }) => {
  if (!karte) {
    return (
      <div className="pl-buehne-leer">
        <p>Wähle links eine Karte.</p>
      </div>
    );
  }
  const n = objekte.filter(o => o.karteId === karte.id).length;
  return (
    <section className="pl-buehne">
      <header className="pl-buehne-kopf">
        <h1>{karte.name}</h1>
        {dm && <span className={'pl-sicht ' + (karte.sichtbar ? 'an' : 'aus')}>{karte.sichtbar ? 'für Spieler sichtbar' : 'für Spieler verborgen'}</span>}
      </header>
      <div className="pl-leinwand" aria-label="Kartenfläche">
        <div className="pl-leinwand-raster" aria-hidden="true" />
        <div className="pl-leinwand-text">
          <strong>Hier liegt bald die Karte.</strong>
          <span>Kartenbild, Zoom, Maßstab und Orte kommen mit Stufe 1.</span>
        </div>
      </div>
      <dl className="pl-fakten pl-fakten-quer">
        <dt>Einträge</dt><dd>{n}</dd>
        {dm && <><dt>Dateien</dt><dd>{dateien ? dateien.anzahl + ' · ' + planGroesse(dateien.bytes) : '…'}</dd></>}
      </dl>
    </section>
  );
};

const PlanerApp = () => {
  const zugang = planerZugang();
  const angemeldet = !!(zugang.token && zugang.code);
  const [start, setStart] = useState(null);
  const [advId, setAdvId] = useState('');
  const [daten, setDaten] = useState(null);
  const [auswahl, setAuswahl] = useState('');
  const [dateien, setDateien] = useState(null);
  const [meldung, setMeldung] = useState(null);
  const [frage, setFrage] = useState(null);
  const [arbeit, setArbeit] = useState(null);
  const [vorschau, setVorschau] = useState(null);
  const standRef = useRef(0);
  const arbeitRef = useRef(false);
  const dateiEingabe = useRef(null);

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

  useEffect(() => {
    setDateien(null);
    if (!dm || !karte) return;
    let aktuell = true;
    planerApi('planer_dateien_liste', { adv_id: advId, karte_id: karte.id })
      .then(l => { if (aktuell) setDateien({ anzahl: l.dateien.length, bytes: l.bytes }); })
      .catch(() => {});
    return () => { aktuell = false; };
  }, [auswahl, dm, daten && daten.stand]);

  const ausfuehren = async (titel, f) => {
    arbeitRef.current = true;
    setArbeit({ titel, text: '', anteil: 0 });
    try {
      return await f((text, anteil) => setArbeit(a => ({ ...a, text, anteil: anteil === undefined ? a.anteil : anteil })));
    } finally {
      arbeitRef.current = false;
      setArbeit(null);
    }
  };

  const karteSpeichern = async (k) => {
    const r = await planerApi('planer_karte_speichern', { adv_id: advId, karte: k });
    return r.karte;
  };
  const neueKarte = async (name) => {
    try {
      const k = await karteSpeichern({ id: planNeueId('k'), name, sichtbar: false });
      await laden(advId);
      setAuswahl(k.id);
    } catch (e) { fehler(e); }
  };
  const karteAendern = async (k, aenderung) => {
    try {
      const { ablage, ...ohne } = k;
      await karteSpeichern({ ...ohne, ...aenderung });
      await laden(advId);
    } catch (e) { fehler(e); }
  };
  const karteLoeschen = (k) => setFrage({
    titel: 'Karte löschen?',
    text: '„' + k.name + '“ wird mit allen Einträgen und Dateien gelöscht. Das lässt sich nicht rückgängig machen — wer sichergehen will, exportiert vorher.',
    ja: 'Löschen', gefahr: true,
    onJa: async () => {
      try {
        await planerApi('planer_karte_loeschen', { adv_id: advId, karte_id: k.id });
        await laden(advId);
        setMeldung({ art: 'gut', text: '„' + k.name + '“ ist gelöscht.' });
      } catch (e) { fehler(e); }
    },
  });

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
        objSpeichern: (o) => planerApi('planer_obj_speichern', { adv_id: advId, obj: o }),
        dateienHoch: (karteId, liste) => planerApi('planer_dateien_hoch', { adv_id: advId, karte_id: karteId, dateien: liste }),
        karteLoeschen: (id) => planerApi('planer_karte_loeschen', { adv_id: advId, karte_id: id }),
        namenZusatz: (name) => vorhanden.has(name) ? ' (importiert)' : '',
        melde,
      }));
      await laden(advId);
      const ersteKarte = erg.karten ? erg.zuordnung.get(v.paket.manifest.karten[0].id) : '';
      if (ersteKarte) setAuswahl(ersteKarte);
      setMeldung({ art: 'gut', text: 'Eingespielt: ' + erg.karten + ' Karten, ' + erg.objekte + ' Einträge, ' + erg.dateien + ' Dateien.' });
    } catch (e) {
      fehler(new Error('Einspielen abgebrochen, nichts wurde übernommen: ' + e.message));
      laden(advId).catch(() => {});
    }
  };

  if (!angemeldet) return <PlanerNichtAngemeldet />;

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
        <main className="pl-haupt-flaeche">
          <PlanerKartenListe karten={karten} auswahl={auswahl} dm={dm}
            onWahl={setAuswahl} onNeu={neueKarte}
            onUmbenennen={(id, name) => karteAendern(karten.find(k => k.id === id), { name })}
            onSichtbar={(k) => karteAendern(k, { sichtbar: !k.sichtbar })}
            onLoeschen={karteLoeschen} />
          <PlanerKarteAnsicht karte={karte} dm={dm} objekte={daten.objekte} dateien={dateien} />
        </main>
      )}

      {vorschau && <PlanerImportVorschau vorschau={vorschau} onEinspielen={einspielen} onZu={() => setVorschau(null)} />}
      {frage && <PlanerFrage frage={frage} onZu={() => setFrage(null)} />}
      {arbeit && <PlanerArbeit arbeit={arbeit} />}
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
