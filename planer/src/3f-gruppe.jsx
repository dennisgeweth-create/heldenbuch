// ── Heldengruppen: die Tafel ─────────────────────────────────────
// Rechnung in 1g-gruppe.jsx. Nur die Spielleitung setzt, zieht, teilt und
// vereint; Spieler sehen die Gruppe und — wenn freigegeben — ihre Spur.

const SPUR_WORTE = { start: 'Aufbruch', zug: 'gezogen', reise: 'Reise', teilung: 'geteilt', vereint: 'vereint' };

const PlanerGruppenListe = ({ gruppen, wahl, dm, onWahl }) => {
  if (!gruppen.length) return null;
  return (
    <nav className="pl-liste" aria-label="Heldengruppen">
      <div className="pl-liste-kopf"><span>Heldengruppen · {gruppen.length}</span></div>
      <ul>
        {gruppen.map(g => (
          <li key={g.id} className={'pl-eintrag' + (g.id === wahl ? ' aktiv' : '')}>
            <button className="pl-eintrag-name" onClick={() => onWahl(g)}>
              <span aria-hidden="true">{g.symbol || '🛡'}</span>
              <span className={'pl-eintrag-text' + (dm && !g.sichtbar ? ' pl-verborgen-text' : '')}>{g.name}</span>
              <span className="pl-leise">{(g.helden || []).length}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const GruppeTafel = ({ gruppe, dm, karte, helden, gruppen, zieht, onSpeichern, onLoeschen, onSchliessen,
                       onZiehenWaehlen, onZuruecknehmen, onTeilen, onVereinen }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(gruppe);
  const [teilen, setTeilen] = useState(null);         // ausgewaehlte Helden fuer eine neue Gruppe
  const [mit, setMit] = useState('');
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const m = karte.massstab;
  const einh = m ? einheit(m.einheit).kurz : '';
  const spur = gruppe.spur || [];
  const namen = entwurf.heldenNamen || {};
  const laenge = spurLaenge(gruppe, m);

  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={'Heldengruppe: ' + gruppe.name}>
        <TafelKopf symbol={gruppe.symbol || '🛡'} titel={gruppe.name} onSchliessen={onSchliessen} />
        <p>{(gruppe.helden || []).map(h => (gruppe.heldenNamen || {})[h] || '?').join(', ') || 'Niemand'}</p>
        {spur.length > 1 && m && <p className="pl-leise">Bisher {laengeText(laenge, m.einheit)} unterwegs, seit {zeitText(spur[0].zeit)}.</p>}
      </aside>
    );
  }
  const andere = (gruppen || []).filter(g => g.id !== gruppe.id);
  const umHeld = (h) => setEntwurf(e => {
    const drin = (e.helden || []).includes(h.id);
    const liste = drin ? e.helden.filter(x => x !== h.id) : [...(e.helden || []), h.id];
    return { ...e, helden: liste, heldenNamen: { ...(e.heldenNamen || {}), [h.id]: h.name } };
  });
  const vergeben = (h) => andere.find(g => (g.helden || []).includes(h.id));

  return (
    <aside className="pl-tafel" aria-label={'Heldengruppe bearbeiten: ' + gruppe.name}>
      <TafelKopf symbol={entwurf.symbol || '🛡'} titel={entwurf.name || 'Heldengruppe'} onSchliessen={onSchliessen} />
      <div className="pl-zeile">
        <button type="button" className={'pl-knopf pl-klein pl-haupt' + (zieht ? ' an' : '')} disabled={geaendert} title={geaendert ? 'Erst speichern' : 'Oder die Marke auf der Karte ziehen'}
          onClick={onZiehenWaehlen}>📍 Hierhin ziehen …</button>
        <button type="button" className="pl-knopf pl-klein" disabled={spur.length < 2 || geaendert} onClick={onZuruecknehmen}
          title="Der Nebel bleibt, wo er schon gewichen ist">↶ Letzten Zug zurück</button>
      </div>
      {!nebelVon(karte).an ? <p className="pl-leise pl-klein-text">Auf dieser Karte liegt kein Nebel — die Gruppe hinterlässt nur ihre Spur.</p>
        : !m ? <p className="pl-warnung">Ohne Maßstab weicht der Nebel nicht; die Sichtweite braucht eine Einheit.</p>
        : nebelFolgt(nebelVon(karte)) ? <p className="pl-leise pl-klein-text">Der Nebel folgt der Gruppe: klar ist, was sie gerade sieht{nebelVon(karte).modus === 'daemmrig' ? ', wo sie war, bleibt es dämmrig' : ''}.{!gruppe.sichtbar ? ' Solange sie verborgen ist, sieht sie für die Spieler nichts.' : ''}</p> : null}
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Name
          <input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={e => setze('name', e.target.value)} />
        </label>
        <div className="pl-symbole" role="radiogroup" aria-label="Zeichen">
          {GRUPPE_SYMBOLE.map(s => (
            <button type="button" key={s} role="radio" aria-checked={entwurf.symbol === s} className={'pl-symbolwahl' + (entwurf.symbol === s ? ' an' : '')} onClick={() => setze('symbol', s)}>{s}</button>
          ))}
        </div>
        <fieldset className="pl-empfaenger">
          <legend>Wer dabei ist</legend>
          {(helden || []).map(h => {
            const woanders = vergeben(h);
            return (
              <label key={h.id} className="pl-schalter">
                <input type="checkbox" checked={(entwurf.helden || []).includes(h.id)} disabled={!!woanders} onChange={() => umHeld(h)} />
                <span>{h.name}{h.nurDm ? ' (NSC)' : ''}{woanders ? ' — in „' + woanders.name + '“' : ''}</span>
              </label>
            );
          })}
          {helden === null && <p className="pl-leise pl-klein-text">Die Bögen werden geladen …</p>}
          {helden && !helden.length && <p className="pl-leise pl-klein-text">In diesem Abenteuer gibt es noch keinen Bogen.</p>}
        </fieldset>
        <label>Sichtweite{einh ? ' (' + einh + ')' : ''}
          <input className="pl-feld" type="number" min={0} step="any" value={entwurf.sichtweite ?? 0}
            title="So weit weicht der Nebel um die Gruppe; 0 heißt gar nicht" onChange={e => setze('sichtweite', Math.max(0, +e.target.value || 0))} />
        </label>
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.sichtbar} onChange={e => setze('sichtbar', e.target.checked)} />
          <span>Spieler sehen die Gruppe</span>
        </label>
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.spurFuerSpieler} onChange={e => setze('spurFuerSpieler', e.target.checked)} />
          <span>Spieler sehen die Spur</span>
        </label>
        <label>Notiz der Spielleitung <span className="pl-leise">— sehen Spieler nie</span>
          <textarea className="pl-feld pl-dm-feld" rows={2} value={(entwurf.dm && entwurf.dm.notiz) || ''} maxLength={20000}
            onChange={e => setEntwurf(v => ({ ...v, dm: { ...(v.dm || {}), notiz: e.target.value } }))} />
        </label>
        {geaendert && (
          <div className="pl-dialog-knoepfe">
            <button type="button" className="pl-knopf pl-klein" onClick={() => setEntwurf(gruppe)}>Verwerfen</button>
            <button type="submit" className="pl-knopf pl-haupt pl-klein">Speichern</button>
          </div>
        )}
      </form>

      <h3 className="pl-unterkopf">Spur</h3>
      <p className="pl-leise pl-klein-text">{spur.length} {spur.length === 1 ? 'Punkt' : 'Punkte'}{m && spur.length > 1 ? ' · ' + laengeText(laenge, m.einheit) : ''}</p>
      <ol className="pl-spur-liste">
        {spur.slice(-6).reverse().map((p, i) => (
          <li key={i}><span>{zeitText(p.zeit)}</span><span className="pl-leise">{SPUR_WORTE[p.art] || p.art || ''}</span></li>
        ))}
      </ol>

      {(gruppe.helden || []).length > 1 && (
        teilen === null ? (
          <button type="button" className="pl-knopf pl-klein" disabled={geaendert} onClick={() => setTeilen([])}>✂ Gruppe aufteilen …</button>
        ) : (
          <div className="pl-teilen">
            <p className="pl-klein-text">Wer zieht als eigene Gruppe los?</p>
            {(gruppe.helden || []).map(h => (
              <label key={h} className="pl-schalter">
                <input type="checkbox" checked={teilen.includes(h)} onChange={() => setTeilen(t => t.includes(h) ? t.filter(x => x !== h) : [...t, h])} />
                <span>{namen[h] || h}</span>
              </label>
            ))}
            <div className="pl-zeile">
              <button type="button" className="pl-knopf pl-klein" onClick={() => setTeilen(null)}>Abbrechen</button>
              <button type="button" className="pl-knopf pl-klein pl-haupt" disabled={!teilen.length || teilen.length === gruppe.helden.length}
                onClick={() => { onTeilen(gruppe, teilen); setTeilen(null); }}>Abteilen</button>
            </div>
          </div>
        )
      )}
      {andere.length > 0 && (
        <div className="pl-zeile">
          <select className="pl-feld" value={mit} onChange={e => setMit(e.target.value)} aria-label="Vereinen mit">
            <option value="">— vereinen mit —</option>
            {andere.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button type="button" className="pl-knopf pl-klein" disabled={!mit || geaendert}
            onClick={() => { const q = andere.find(g => g.id === mit); if (q) onVereinen(gruppe, q); setMit(''); }}>⤵ Vereinen</button>
        </div>
      )}
      <div className="pl-dialog-knoepfe">
        <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(gruppe)}>Gruppe löschen</button>
      </div>
    </aside>
  );
};
