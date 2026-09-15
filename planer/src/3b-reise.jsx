// ── Routen und Reisen: die Tafeln ────────────────────────────────
// Die Rechnung steht in 1c-reise.jsx. Hier: die Tafel einer Route
// (Gelaende je Abschnitt) und die einer Reise (Einstellungen, Plan Tag
// fuer Tag, Wetter, der naechste Reisetag, Uebergaben ans Heldenbuch).

// Ein Auftrag an das Heldenbuch: in den gemeinsamen Speicher legen und
// kurz auf die Quittung warten. Kommt keine, ist kein Heldenbuch im
// DM-Modus offen — dann wartet der Auftrag dort eine halbe Stunde.
const anHeldenbuch = (auftrag) => new Promise((ok) => {
  const id = planNeueId('a');
  try { localStorage.setItem(PLANER_AUFTRAG, JSON.stringify({ ...auftrag, id, zeit: Date.now() })); }
  catch (e) { ok(false); return; }
  const bis = Date.now() + 2500;
  const t = setInterval(() => {
    let q = null;
    try { q = JSON.parse(localStorage.getItem(PLANER_QUITTUNG) || 'null'); } catch (e) { q = null; }
    if (q && q.id === id) { clearInterval(t); ok(true); }
    else if (Date.now() > bis) { clearInterval(t); ok(false); }
  }, 120);
});

// Wie OrtTafel: der Entwurf nimmt neue Fassungen vom Server, wo hier
// nichts geaendert ist.
const useEntwurf = (wert) => {
  const [entwurf, setEntwurf] = useState(wert);
  const [basis, setBasis] = useState(wert);
  const gleich = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  useEffect(() => {
    if (gleich(wert, basis)) return;
    setEntwurf(e => {
      const aus = { ...wert };
      new Set([...Object.keys(e), ...Object.keys(basis)]).forEach(k => { if (!gleich(e[k], basis[k])) aus[k] = e[k]; });
      return aus;
    });
    setBasis(wert);
  }, [JSON.stringify(wert)]);
  return [entwurf, setEntwurf, !gleich(entwurf, wert)];
};

const TafelKopf = ({ symbol, titel, onSchliessen }) => (
  <header className="pl-tafel-kopf">
    <span className="pl-tafel-symbol" aria-hidden="true">{symbol}</span>
    <h2>{titel}</h2>
    <button className="pl-symbol" aria-label="Schließen" onClick={onSchliessen}>✕</button>
  </header>
);

// ── Route ────────────────────────────────────────────────────────
const RouteTafel = ({ route, dm, karte, reisen, onSpeichern, onLoeschen, onSchliessen, onReiseNeu, onReiseWahl }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(route);
  const m = karte.massstab;
  const ab = routeAbschnitte(entwurf, m);
  const laenge = ab.reduce((s, a) => s + a.laenge, 0);
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const setzeGelaende = (i, g) => setEntwurf(e => {
    const liste = routeAbschnitte(e, m).map(a => a.gelaende);
    liste[i] = g;
    return { ...e, gelaende: liste };
  });
  const eigeneReisen = reisen.filter(r => r.routeId === route.id);
  const laengeZeile = m ? laengeText(laenge, m.einheit) : 'ohne Maßstab';

  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={'Route: ' + route.name}>
        <TafelKopf symbol="🛤" titel={route.name} onSchliessen={onSchliessen} />
        <p className="pl-leise">{laengeZeile} · {ab.length} Abschnitte</p>
        {route.text ? <p className="pl-ort-text">{route.text}</p> : null}
        {eigeneReisen.map(r => <button key={r.id} className="pl-knopf pl-klein" onClick={() => onReiseWahl(r.id)}>🧭 {r.name}</button>)}
      </aside>
    );
  }
  return (
    <aside className="pl-tafel" aria-label={'Route bearbeiten: ' + route.name}>
      <TafelKopf symbol="🛤" titel={entwurf.name || 'Ohne Namen'} onSchliessen={onSchliessen} />
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Name
          <input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={e => setze('name', e.target.value)} />
        </label>
        <p className="pl-leise">{laengeZeile} · {ab.length} Abschnitte</p>
        <label>Alle Abschnitte
          <select className="pl-feld pl-alle-gelaende" value="" onChange={e => { const g = e.target.value; if (g) setze('gelaende', ab.map(() => g)); }}>
            <option value="">— Gelände für alle setzen —</option>
            {GELAENDE.map(g => <option key={g.k} value={g.k}>{g.l}</option>)}
          </select>
        </label>
        <ol className="pl-abschnitte">
          {ab.map(a => (
            <li key={a.i}>
              <span className="pl-farbpunkt" style={{ background: gelaende(a.gelaende).farbe }} aria-hidden="true" />
              <span className="pl-abschnitt-laenge">{m ? laengeText(a.laenge, m.einheit) : Math.round(a.px) + ' px'}</span>
              <select className="pl-feld" value={a.gelaende} aria-label={'Gelände Abschnitt ' + (a.i + 1)} onChange={e => setzeGelaende(a.i, e.target.value)}>
                {GELAENDE.map(g => <option key={g.k} value={g.k}>{g.l}</option>)}
              </select>
            </li>
          ))}
        </ol>
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
        <div className="pl-zeile">
          <button type="button" className="pl-knopf pl-klein pl-haupt" disabled={geaendert || !m} onClick={() => onReiseNeu(route)}
            title={!m ? 'Die Karte braucht zuerst einen Maßstab' : geaendert ? 'Erst speichern' : ''}>🧭 Reise planen</button>
          {eigeneReisen.map(r => <button type="button" key={r.id} className="pl-knopf pl-klein" onClick={() => onReiseWahl(r.id)}>🧭 {r.name}</button>)}
        </div>
        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(route)}>Löschen</button>
          <button type="button" className="pl-knopf pl-klein" disabled={!geaendert} onClick={() => setEntwurf(route)}>Verwerfen</button>
          <button type="submit" className="pl-knopf pl-haupt pl-klein" disabled={!geaendert}>Speichern</button>
        </div>
      </form>
    </aside>
  );
};

// ── Reise ────────────────────────────────────────────────────────
const neueReise = (route) => ({
  id: planNeueId('j'), karteId: route.karteId, art: 'reise', name: 'Reise: ' + route.name, routeId: route.id,
  richtung: 'hin', optionen: { tempo: 'normal', fortbewegung: 'fuss' }, personen: 4,
  klima: 'gemaessigt', jahreszeit: 'sommer', samen: Math.floor(Math.random() * 2147483647) + 1,
  wetterVorgaben: {}, pos: 0, tagebuch: [], sichtbar: false, dm: { notiz: '' },
});

// Das Wetter der Tage ab dem Start: gewuerfelt aus dem Samen, und wo
// die Spielleitung etwas festgelegt hat, das.
const reiseWetter = (reise, anzahl) => {
  const vorgaben = [];
  Object.entries(reise.wetterVorgaben || {}).forEach(([i, w]) => { vorgaben[+i] = w; });
  return wetterFuerTage(anzahl, reise.klima, reise.jahreszeit, reise.samen || 1, vorgaben);
};
const reiseStand = (reise, route, massstab) => {
  const r = routeInRichtung(route, reise.richtung);
  const tag = (reise.tagebuch || []).length;
  const wetter = reiseWetter(reise, tag + REISE_HOECHSTENS_TAGE);
  const plan = reisePlan({ route: r, massstab, optionen: reise.optionen, start: reise.pos, wetter: wetter.slice(tag) });
  const punkt = massstab ? punktAufRoute(r, massstab, reise.pos || 0) : (r.punkte || [])[0];
  return { r, tag, plan, punkt, heute: wetter[tag], gesamt: plan.gesamt };
};

const WetterWahl = ({ wetter, onWetter }) => {
  const feld = (name, liste) => (
    <select className="pl-feld" value={wetter[name]} aria-label={name} onChange={e => onWetter({ ...wetter, [name]: e.target.value })}>
      {liste.map(k => <option key={k} value={k}>{WETTER_WORTE[k]}</option>)}
    </select>
  );
  return (
    <div className="pl-wetter-wahl">
      {feld('niederschlag', WETTER_NIEDERSCHLAG)}
      {feld('temperatur', WETTER_TEMPERATUR)}
      {feld('wind', WETTER_WIND)}
    </div>
  );
};

const ReiseTafel = ({ reise, route, dm, karte, advId, chronikZeit, onSpeichern, onLoeschen, onSchliessen, onMeldung }) => {
  const [entwurf, setEntwurf, geaendert] = useEntwurf(reise);
  const [uebergabe, setUebergabe] = useState('');
  const m = karte.massstab;
  const st = reiseStand(entwurf, route, m);
  const einh = m ? m.einheit : 'km';
  const heute = st.plan.tage[0];
  const angekommen = m && st.gesamt > 0 && (entwurf.pos || 0) >= st.gesamt - 1e-9;
  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const setzeOpt = (feld, wert) => setEntwurf(e => ({ ...e, optionen: { ...(e.optionen || {}), [feld]: wert } }));
  const f = fortbewegung(entwurf.optionen && entwurf.optionen.fortbewegung);
  const verpf = verpflegung(st.plan.tage.length, entwurf.personen);
  const ankunft = chronikZeit != null && st.plan.angekommen
    ? 'Tag ' + (Math.floor((chronikZeit + st.plan.tage.length * 24) / 24) + 1) : '';

  const tagAbschliessen = () => {
    if (!heute) return;
    const eintrag = { nr: st.tag + 1, strecke: heute.strecke, stunden: heute.stunden, wetter: st.heute,
                      gewaltmarsch: heute.gewaltmarsch, teile: heute.teile.map(t => ({ gelaende: t.gelaende, strecke: t.strecke })) };
    onSpeichern({ ...entwurf, pos: heute.bis, tagebuch: [...(entwurf.tagebuch || []), eintrag] });
  };
  const tagZuruecknehmen = () => {
    const liste = [...(entwurf.tagebuch || [])];
    const letzter = liste.pop();
    if (!letzter) return;
    onSpeichern({ ...entwurf, pos: Math.max(0, (entwurf.pos || 0) - letzter.strecke), tagebuch: liste });
  };
  const uebergeben = async (auftrag, was) => {
    setUebergabe(was + ' …');
    const genommen = await anHeldenbuch(auftrag);
    setUebergabe('');
    onMeldung(genommen
      ? { art: 'gut', text: was + ': Das Heldenbuch hat den Dialog geöffnet. Bestätige ihn dort.' }
      : { art: 'gut', text: was + ': Der Auftrag wartet eine halbe Stunde. Öffne das Heldenbuch im DM-Modus, dann geht der Dialog dort auf.' });
  };
  const letzter = (entwurf.tagebuch || [])[(entwurf.tagebuch || []).length - 1];

  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={'Reise: ' + reise.name}>
        <TafelKopf symbol="🧭" titel={reise.name} onSchliessen={onSchliessen} />
        {m && <p>{st.tag ? 'Tag ' + st.tag + ' · ' : ''}{laengeText(reise.pos || 0, einh)} von {laengeText(st.gesamt, einh)}{angekommen ? ' · angekommen' : ''}</p>}
        {letzter && letzter.wetter && <p className="pl-leise">Zuletzt: {WETTER_ZEICHEN[letzter.wetter.niederschlag]} {wetterText(letzter.wetter)}</p>}
      </aside>
    );
  }

  return (
    <aside className="pl-tafel pl-reise" aria-label={'Reise: ' + reise.name}>
      <TafelKopf symbol="🧭" titel={entwurf.name || 'Reise'} onSchliessen={onSchliessen} />
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Name
          <input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={e => setze('name', e.target.value)} />
        </label>
        <div className="pl-raster2">
          <label>Richtung
            <select className="pl-feld" value={entwurf.richtung} onChange={e => setze('richtung', e.target.value)} disabled={(entwurf.tagebuch || []).length > 0}>
              <option value="hin">Vom Anfang zum Ende</option>
              <option value="zurueck">Vom Ende zum Anfang</option>
            </select>
          </label>
          <label>Fortbewegung
            <select className="pl-feld" value={f.k} onChange={e => setzeOpt('fortbewegung', e.target.value)}>
              {FORTBEWEGUNG.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
            </select>
          </label>
          {f.art !== 'wasser' && (
            <label>Tempo
              <select className="pl-feld" value={tempo(entwurf.optionen && entwurf.optionen.tempo).k} onChange={e => setzeOpt('tempo', e.target.value)}>
                {TEMPO.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
              </select>
            </label>
          )}
          <label>Stunden am Tag
            <input className="pl-feld" type="number" min={1} max={24} value={reiseStunden(entwurf.optionen)}
              onChange={e => setzeOpt('stunden', Math.max(1, Math.min(24, +e.target.value || 1)))} />
          </label>
          <label>Personen
            <input className="pl-feld" type="number" min={0} max={999} value={entwurf.personen ?? 4} onChange={e => setze('personen', Math.max(0, +e.target.value || 0))} />
          </label>
          <label>Klima
            <select className="pl-feld" value={entwurf.klima} onChange={e => setze('klima', e.target.value)}>
              {KLIMA.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
            </select>
          </label>
          <label>Jahreszeit
            <select className="pl-feld" value={entwurf.jahreszeit} onChange={e => setze('jahreszeit', e.target.value)}>
              {JAHRESZEITEN.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
            </select>
          </label>
        </div>
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.sichtbar} onChange={e => setze('sichtbar', e.target.checked)} />
          <span>Spieler sehen die Gruppe auf der Karte</span>
        </label>
        {geaendert && (
          <div className="pl-dialog-knoepfe">
            <button type="button" className="pl-knopf pl-klein" onClick={() => setEntwurf(reise)}>Verwerfen</button>
            <button type="submit" className="pl-knopf pl-haupt pl-klein">Speichern</button>
          </div>
        )}
      </form>

      {!m ? <p className="pl-warnung">Die Karte braucht einen Maßstab, sonst lässt sich nichts rechnen.</p> : (
        <>
          <dl className="pl-fakten pl-reise-fakten">
            <dt>Strecke</dt><dd>{laengeText(entwurf.pos || 0, einh)} von {laengeText(st.gesamt, einh)}</dd>
            <dt>Noch</dt><dd>{angekommen ? 'angekommen' : st.plan.tage.length + (st.plan.tage.length === 1 ? ' Tag' : ' Tage') + (st.plan.angekommen ? '' : ' bis zum Hindernis')}</dd>
            {ankunft && <><dt>Ankunft</dt><dd>{ankunft} der Chronik</dd></>}
            {entwurf.personen > 0 && st.plan.tage.length > 0 && <><dt>Verpflegung</dt><dd>{verpf.rationen} Rationen, {verpf.wasserLiter} l Wasser</dd></>}
            {f.art !== 'wasser' && tempo(entwurf.optionen && entwurf.optionen.tempo).folge && <><dt>Tempo</dt><dd>{tempo(entwurf.optionen.tempo).folge}</dd></>}
          </dl>
          {st.plan.warnungen.map(w => <p key={w} className="pl-warnung">{w}</p>)}

          {heute && !angekommen && (
            <section className="pl-heute" aria-label="Der nächste Reisetag">
              <h3>Tag {st.tag + 1}</h3>
              <p className="pl-heute-zeile">
                <strong>{laengeText(heute.strecke, einh)}</strong> in {stundenText(heute.stunden)}
                {' · '}{heute.teile.map(t => gelaende(t.gelaende).l).join(', ')}
                {heute.angekommen ? ' · Ankunft' : ''}
              </p>
              <div className="pl-zeile pl-wetter-kopf">
                <span>{WETTER_ZEICHEN[st.heute.niederschlag]} Wetter</span>
                <button type="button" className="pl-knopf pl-klein" title="Neu würfeln"
                  onClick={() => { const v = { ...(entwurf.wetterVorgaben || {}) }; delete v[st.tag]; onSpeichern({ ...entwurf, samen: Math.floor(Math.random() * 2147483647) + 1, wetterVorgaben: v }); }}>🎲</button>
              </div>
              <WetterWahl wetter={st.heute} onWetter={(w) => onSpeichern({ ...entwurf, wetterVorgaben: { ...(entwurf.wetterVorgaben || {}), [st.tag]: w } })} />
              {heute.gewaltmarsch.length > 0 && (
                <p className="pl-warnung">Gewaltmarsch: KO-Rettungswürfe SG {heute.gewaltmarsch.map(g => g.sg).join(', ')} — bei Misserfolg eine Stufe Erschöpfung.</p>
              )}
              <button type="button" className="pl-knopf pl-haupt" onClick={tagAbschliessen}>✓ Tag {st.tag + 1} abschließen</button>
            </section>
          )}

          {letzter && (
            <section className="pl-heute" aria-label="Der letzte Reisetag">
              <h3>Nach Tag {letzter.nr}</h3>
              <p className="pl-leise">{laengeText(letzter.strecke, einh)} · {letzter.wetter ? wetterText(letzter.wetter) : ''}</p>
              <div className="pl-zeile">
                <button type="button" className="pl-knopf pl-klein" disabled={!!uebergabe}
                  onClick={() => uebergeben(auftragZeit(advId, 24), '⏩ Einen Tag weiter')}>⏩ Chronik: +1 Tag</button>
                <button type="button" className="pl-knopf pl-klein" disabled={!!uebergabe}
                  onClick={() => uebergeben(auftragRast(advId, letzter.wetter, 'Lager nach Reisetag ' + letzter.nr + ' (' + entwurf.name + ')'), '☾ Lager')}>☾ Lager aufschlagen</button>
                {(letzter.gewaltmarsch || []).map(g => (
                  <button type="button" key={g.stunde} className="pl-knopf pl-klein" disabled={!!uebergabe}
                    onClick={() => uebergeben(auftragGewaltmarsch(advId, g.sg, 'Gewaltmarsch, Stunde ' + g.stunde), '🎲 Gewaltmarsch')}>🎲 KO SG {g.sg}</button>
                ))}
              </div>
              {uebergabe && <p className="pl-leise">{uebergabe}</p>}
              <button type="button" className="pl-knopf pl-klein" onClick={tagZuruecknehmen}>↶ Tag {letzter.nr} zurücknehmen</button>
            </section>
          )}

          {st.plan.tage.length > 1 && (
            <details className="pl-plan">
              <summary>Plan: {st.plan.tage.length} Tage</summary>
              <div className="pl-plan-rolle">
                <table>
                  <thead><tr><th>Tag</th><th>Strecke</th><th>Zeit</th><th>Wetter</th><th>KO</th></tr></thead>
                  <tbody>
                    {st.plan.tage.slice(0, 60).map((t, i) => (
                      <tr key={i}>
                        <td>{st.tag + t.nr}</td>
                        <td>{laengeText(t.strecke, einh)}</td>
                        <td>{stundenText(t.stunden)}</td>
                        <td title={wetterText(t.wetter)}>{t.wetter ? WETTER_ZEICHEN[t.wetter.niederschlag] + ' ' + WETTER_WORTE[t.wetter.temperatur] : ''}</td>
                        <td>{t.gewaltmarsch.map(g => g.sg).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
      <div className="pl-dialog-knoepfe">
        <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(reise)}>Reise löschen</button>
      </div>
    </aside>
  );
};
