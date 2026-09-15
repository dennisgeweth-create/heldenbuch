// ── Regionen und Begegnungen: die Tafeln ─────────────────────────
// Rechnung in 1d-begegnung.jsx. Hier die Tafel einer Region mit ihrer
// Begegnungstabelle, ein Wurf von Hand, und die Liste der Wachen, die
// ReiseTafel fuer den naechsten Reisetag zeigt.

const BegegnungErgebnis = ({ p, begegnungen, advId, onMeldung }) => {
  const [schickt, setSchickt] = useState(false);
  const art = p.eintrag ? p.eintrag.art : p.art;
  const id = p.eintrag ? p.eintrag.begegnungId : p.begegnungId;
  const b = (begegnungen || []).find(x => x.id === id);
  const schicken = async () => {
    setSchickt(true);
    const genommen = await anHeldenbuch(auftragKampf(advId, id, b ? b.name : ''));
    setSchickt(false);
    onMeldung(genommen
      ? { art: 'gut', text: '⚔ Das Heldenbuch fragt jetzt, ob es „' + (b ? b.name : 'die Begegnung') + '“ in den Kampftracker laden soll.' }
      : { art: 'gut', text: '⚔ Der Auftrag wartet eine halbe Stunde. Öffne das Heldenbuch im DM-Modus, dann fragt der Kampftracker nach.' });
  };
  return (
    <span className={'pl-wurf' + (p.treffer ? ' treffer' : '')}>
      <span className="pl-wurf-zahl" title={'Wurf ' + p.wurf + ', etwas geschieht ab ' + p.ab}>{p.wurf}</span>
      <span>{begegnungName(p, begegnungen)}</span>
      {p.treffer && art === 'kampf' && id && (
        <button type="button" className="pl-knopf pl-klein" disabled={schickt || !b}
          title={b ? 'In den Kampftracker des Heldenbuchs laden' : 'Diese Begegnung gibt es im Heldenbuch nicht'}
          onClick={schicken}>⚔ Kampftracker</button>
      )}
    </span>
  );
};

const WachenListe = ({ pruefungen, begegnungen, advId, onMeldung }) => {
  if (!pruefungen.length) return <p className="pl-leise">Keine Region mit Begegnungstabelle auf dem Weg.</p>;
  return (
    <ul className="pl-wachen">
      {pruefungen.map((p, i) => (
        <li key={i}>
          <span className="pl-wache-zeit">{p.nacht ? '🌙' : '☀'} {String(p.uhr).padStart(2, '0')} Uhr</span>
          <span className="pl-wache-ort">{p.unterwegs ? 'unterwegs' : 'im Lager'} · {p.regionName || p.region}</span>
          <BegegnungErgebnis p={p} begegnungen={begegnungen} advId={advId} onMeldung={onMeldung} />
        </li>
      ))}
    </ul>
  );
};

const TabellenEditor = ({ tabelle, begegnungen, onTabelle }) => {
  const t = { ...neueTabelle(), ...(tabelle || {}) };
  const setze = (feld, wert) => onTabelle({ ...t, [feld]: wert });
  const eintrag = (id, feld, wert) => setze('eintraege', t.eintraege.map(e => e.id === id ? { ...e, [feld]: wert } : e));
  const summe = t.eintraege.reduce((s, e) => s + (+e.gewicht || 0), 0);
  const prozent = (ab) => Math.max(0, Math.min(100, Math.round((t.wuerfel - ab + 1) / t.wuerfel * 100)));
  return (
    <div className="pl-tabelle">
      <div className="pl-raster3">
        <label>Prüfen alle
          <select className="pl-feld" value={t.jeStunden} onChange={e => setze('jeStunden', +e.target.value)}>
            {WACHE_STUNDEN.map(h => <option key={h} value={h}>{h} Std.</option>)}
          </select>
        </label>
        <label>Tags ab W20
          <input className="pl-feld" type="number" min={1} max={21} value={t.ab} onChange={e => setze('ab', Math.max(1, Math.min(21, +e.target.value || 1)))} />
        </label>
        <label>Nachts ab
          <input className="pl-feld" type="number" min={1} max={21} value={t.abNacht} onChange={e => setze('abNacht', Math.max(1, Math.min(21, +e.target.value || 1)))} />
        </label>
      </div>
      <p className="pl-leise pl-klein-text">Je Prüfung tags {prozent(t.ab)} %, nachts {prozent(t.abNacht)} % · {Math.floor(24 / t.jeStunden)} Prüfungen am Tag</p>
      <ul className="pl-tabelle-zeilen">
        {t.eintraege.map((e, i) => (
          <li key={e.id}>
            <input className="pl-feld pl-gewicht" type="number" min={0} max={99} value={e.gewicht} aria-label={'Gewicht Zeile ' + (i + 1)}
              title={summe ? Math.round((+e.gewicht || 0) / summe * 100) + ' % der Treffer' : ''}
              onChange={ev => eintrag(e.id, 'gewicht', Math.max(0, +ev.target.value || 0))} />
            <select className="pl-feld" value={e.art} aria-label={'Art Zeile ' + (i + 1)} onChange={ev => eintrag(e.id, 'art', ev.target.value)}>
              {BEGEGNUNG_ART.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
            </select>
            <select className="pl-feld" value={e.zeit} aria-label={'Zeit Zeile ' + (i + 1)} onChange={ev => eintrag(e.id, 'zeit', ev.target.value)}>
              {BEGEGNUNG_ZEIT.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
            </select>
            <button type="button" className="pl-symbol pl-symbol-weg" aria-label={'Zeile ' + (i + 1) + ' entfernen'}
              onClick={() => setze('eintraege', t.eintraege.filter(x => x.id !== e.id))}>✕</button>
            {e.art === 'kampf' && (
              <select className="pl-feld pl-breit" value={e.begegnungId || ''} aria-label={'Begegnung Zeile ' + (i + 1)} onChange={ev => eintrag(e.id, 'begegnungId', ev.target.value)}>
                <option value="">— Begegnung aus dem Heldenbuch —</option>
                {(begegnungen || []).map(b => <option key={b.id} value={b.id}>{b.name} · {b.difficulty} · {(b.enemies || []).reduce((s, x) => s + (+x.count || 1), 0)} Gegner</option>)}
              </select>
            )}
            <input className="pl-feld pl-breit" value={e.text || ''} maxLength={300} aria-label={'Text Zeile ' + (i + 1)}
              placeholder={e.art === 'kampf' ? 'Zusatz, z. B. „aus dem Hinterhalt“' : 'Was geschieht'}
              onChange={ev => eintrag(e.id, 'text', ev.target.value)} />
          </li>
        ))}
      </ul>
      <button type="button" className="pl-knopf pl-klein" onClick={() => setze('eintraege', [...t.eintraege, neuerTabellenEintrag(planNeueId('t'))])}>＋ Zeile</button>
      {begegnungen && !begegnungen.length && <p className="pl-leise pl-klein-text">Im Heldenbuch gibt es für dieses Abenteuer noch keine Begegnung (📚 Datenbank › Begegnungen).</p>}
    </div>
  );
};

const RegionTafel = ({ region, dm, karte, begegnungen, advId, onSpeichern, onLoeschen, onSchliessen, onMeldung }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(region);
  const [wurf, setWurf] = useState(null);
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const setzeDm = (feld, wert) => setEntwurf(e => ({ ...e, dm: { ...(e.dm || {}), [feld]: wert } }));
  const flaeche = flaecheText(entwurf.punkte || [], karte.massstab);

  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={'Region: ' + region.name}>
        <TafelKopf symbol="⬡" titel={region.name} onSchliessen={onSchliessen} />
        {flaeche && <p className="pl-leise">{flaeche}</p>}
        {region.text ? <p className="pl-ort-text">{region.text}</p> : <p className="pl-leise">Über diese Gegend ist noch nichts bekannt.</p>}
      </aside>
    );
  }
  const tabelle = (entwurf.dm && entwurf.dm.tabelle) || null;
  return (
    <aside className="pl-tafel" aria-label={'Region bearbeiten: ' + region.name}>
      <TafelKopf symbol="⬡" titel={entwurf.name || 'Ohne Namen'} onSchliessen={onSchliessen} />
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Name
          <input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={e => setze('name', e.target.value)} />
        </label>
        <div className="pl-zeile" role="radiogroup" aria-label="Farbe">
          {REGION_FARBEN.map(f => (
            <button type="button" key={f} role="radio" aria-checked={entwurf.farbe === f} aria-label={'Farbe ' + f}
              className={'pl-farbwahl' + (entwurf.farbe === f ? ' an' : '')} style={{ background: f }} onClick={() => setze('farbe', f)} />
          ))}
          {flaeche && <span className="pl-leise">{flaeche}</span>}
        </div>
        <label>Was die Spieler lesen
          <textarea className="pl-feld" rows={2} value={entwurf.text || ''} maxLength={20000} onChange={e => setze('text', e.target.value)} />
        </label>
        <label>Notiz der Spielleitung <span className="pl-leise">— sehen Spieler nie</span>
          <textarea className="pl-feld pl-dm-feld" rows={2} value={(entwurf.dm && entwurf.dm.notiz) || ''} maxLength={20000} onChange={e => setzeDm('notiz', e.target.value)} />
        </label>
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.sichtbar} onChange={e => setze('sichtbar', e.target.checked)} />
          <span>Für Spieler sichtbar</span>
        </label>

        <h3 className="pl-unterkopf">Zufallsbegegnungen <span className="pl-leise">— nur Spielleitung</span></h3>
        {tabelle ? (
          <TabellenEditor tabelle={tabelle} begegnungen={begegnungen} onTabelle={(t) => setzeDm('tabelle', t)} />
        ) : (
          <button type="button" className="pl-knopf pl-klein" onClick={() => setzeDm('tabelle', neueTabelle())}>＋ Begegnungstabelle anlegen</button>
        )}
        {tabelle && (
          <div className="pl-zeile">
            <button type="button" className="pl-knopf pl-klein" onClick={() => setWurf(begegnungPruefen(tabelle, false, Math.random))}>🎲 Tags würfeln</button>
            <button type="button" className="pl-knopf pl-klein" onClick={() => setWurf(begegnungPruefen(tabelle, true, Math.random))}>🎲 Nachts würfeln</button>
          </div>
        )}
        {wurf && <div className="pl-wurf-zeile"><BegegnungErgebnis p={wurf} begegnungen={begegnungen} advId={advId} onMeldung={onMeldung} /></div>}

        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(region)}>Löschen</button>
          <button type="button" className="pl-knopf pl-klein" disabled={!geaendert} onClick={() => setEntwurf(region)}>Verwerfen</button>
          <button type="submit" className="pl-knopf pl-haupt pl-klein" disabled={!geaendert}>Speichern</button>
        </div>
      </form>
    </aside>
  );
};
