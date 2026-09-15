// ── Bilder, Orte, Maßstab ────────────────────────────────────────

// ── Bilder im Browser ────────────────────────────────────────────
// Kacheln werden hier geschnitten, nicht auf dem Server: ein Webhosting
// bricht bei einem Bild von 20 000 Pixeln an seiner Speichergrenze ab,
// der Browser auf dem Rechner der Spielleitung nicht.
const neueLeinwand = (b, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(b, h);
  const c = document.createElement('canvas');
  c.width = b; c.height = h;
  return c;
};
const leinwandBytes = async (c, typ, qualitaet) => {
  const blob = c.convertToBlob
    ? await c.convertToBlob({ type: typ, quality: qualitaet })
    : await new Promise((ok, nein) => c.toBlob(b => b ? ok(b) : nein(new Error('Das Bild ließ sich nicht umwandeln.')), typ, qualitaet));
  return { typ: blob.type, bytes: new Uint8Array(await blob.arrayBuffer()) };
};
// WebP, wo der Browser es schreiben kann; sonst JPEG.
let bildFormatGemerkt = null;
const bildFormat = async () => {
  if (bildFormatGemerkt) return bildFormatGemerkt;
  // Eine Leinwand ohne Zeichenflaeche laesst sich nicht umwandeln — die
  // Probe braucht also einen Pinselstrich.
  const c = neueLeinwand(2, 2);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 2, 2);
  const probe = await leinwandBytes(c, 'image/webp', 0.8).catch(() => ({ typ: '' }));
  bildFormatGemerkt = probe.typ === 'image/webp' ? { typ: 'image/webp', endung: 'webp' } : { typ: 'image/jpeg', endung: 'jpg' };
  return bildFormatGemerkt;
};

// Gelingt das Bild nicht am Stueck, dann verkleinert: lieber eine Karte
// mit halber Aufloesung als gar keine.
const bildOeffnen = async (datei, masse) => {
  try { return { bitmap: await createImageBitmap(datei), faktor: 1 }; } catch (e) { /* weiter unten kleiner */ }
  if (masse) {
    for (const f of [0.5, 0.25]) {
      try {
        const bitmap = await createImageBitmap(datei, { resizeWidth: Math.round(masse.breite * f), resizeHeight: Math.round(masse.hoehe * f), resizeQuality: 'high' });
        return { bitmap, faktor: f };
      } catch (e) { /* noch kleiner */ }
    }
  }
  throw new Error('Der Browser kann dieses Bild nicht öffnen' + (masse ? ' (' + masse.breite + ' × ' + masse.hoehe + ' Pixel)' : '')
    + '. Bitte in PNG, JPEG oder WebP speichern, oder in zwei Teilkarten zerlegen.');
};

const kachelZeichner = (quelle, plan, ordner, format) => {
  let stufe = null;
  const zeichne = async (z, x, y) => {
    const t = kachelZiel(plan, z, x, y);
    const c = neueLeinwand(t.breite, t.hoehe);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(stufe, t.lx, t.ly, t.breite, t.hoehe, 0, 0, t.breite, t.hoehe);
    const { bytes } = await leinwandBytes(c, format.typ, 0.86);
    return { pfad: kachelPfad(ordner, z, x, y, format.endung), bytes };
  };
  zeichne.stufe = async (z) => {
    if (stufe && stufe !== quelle && stufe.close) stufe.close();
    const s = plan.stufen[z];
    stufe = z === plan.maxZ ? quelle
      : await createImageBitmap(quelle, { resizeWidth: s.breite, resizeHeight: s.hoehe, resizeQuality: 'high' });
  };
  zeichne.ende = () => { if (stufe && stufe !== quelle && stufe.close) stufe.close(); };
  return zeichne;
};

const bildVerkleinert = async (quelle, hoechstens, format) => {
  const f = Math.min(1, hoechstens / Math.max(quelle.width, quelle.height));
  const b = Math.max(1, Math.round(quelle.width * f)), h = Math.max(1, Math.round(quelle.height * f));
  const klein = f < 1 ? await createImageBitmap(quelle, { resizeWidth: b, resizeHeight: h, resizeQuality: 'high' }) : quelle;
  const c = neueLeinwand(b, h);
  c.getContext('2d').drawImage(klein, 0, 0);
  if (klein !== quelle && klein.close) klein.close();
  return (await leinwandBytes(c, format.typ, 0.86)).bytes;
};

const dateiKopf = async (datei) => new Uint8Array(await datei.slice(0, 1024 * 1024).arrayBuffer());

// ── Maßstab festlegen ────────────────────────────────────────────
const MassstabDialog = ({ punkte, alt, onSpeichern, onZu }) => {
  const [laenge, setLaenge] = useState(alt ? String(alt.laenge).replace('.', ',') : '');
  const [einh, setEinh] = useState(alt ? alt.einheit : 'km');
  const zahl = parseFloat(laenge.replace(',', '.'));
  const m = massstabAus(punkte[0], punkte[1], zahl, einh);
  return (
    <div className="pl-schleier" onClick={onZu}>
      <form className="pl-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
        onSubmit={e => { e.preventDefault(); if (m) onSpeichern(m); }}>
        <h2>Maßstab festlegen</h2>
        <p>Wie weit liegen die beiden Punkte auf der Karte auseinander?</p>
        <div className="pl-zeile">
          <input autoFocus className="pl-feld pl-zahl" inputMode="decimal" value={laenge} onChange={e => setLaenge(e.target.value)} aria-label="Entfernung" />
          <select className="pl-feld" value={einh} onChange={e => setEinh(e.target.value)} aria-label="Einheit">
            {EINHEITEN.map(x => <option key={x.k} value={x.k}>{x.l}</option>)}
          </select>
        </div>
        <p className="pl-hinweis">{Math.round(abstandPx(punkte[0], punkte[1]))} Pixel im Bild{m ? ' · ' + zahlText(pxJeEinheit(m)) + ' Pixel je ' + einheit(einh).kurz : ''}</p>
        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf" onClick={onZu}>Abbrechen</button>
          <button type="submit" className="pl-knopf pl-haupt" disabled={!m}>Übernehmen</button>
        </div>
      </form>
    </div>
  );
};

// ── Die Tafel eines Orts ─────────────────────────────────────────
// Die Spielleitung bearbeitet, alle anderen lesen. Was unter dm steht,
// kommt bei Spielern gar nicht erst an.
const OrtTafel = ({ ort, dm, karte, karten, arbeitet, onSpeichern, onLoeschen, onSchliessen, onUnterkarte, onBilderHoch, onBildWeg }) => {
  const [entwurf, setEntwurf] = useState(ort);
  const [gross, setGross] = useState(null);
  const bildEingabe = useRef(null);
  // Kommt eine neue Fassung vom Server — ein Bild ist dazugekommen, der
  // Ort wurde verschoben —, gilt sie fuer alles, was hier nicht gerade
  // bearbeitet wird. Was hier geaendert ist, bleibt.
  const [basis, setBasis] = useState(ort);
  const gleich = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  useEffect(() => {
    if (gleich(ort, basis)) return;
    setEntwurf(e => {
      const aus = { ...ort };
      new Set([...Object.keys(e), ...Object.keys(basis)]).forEach(k => { if (!gleich(e[k], basis[k])) aus[k] = e[k]; });
      return aus;
    });
    setBasis(ort);
  }, [JSON.stringify(ort)]);
  const geaendert = !gleich(entwurf, ort);

  const setze = (feld, wert) => setEntwurf(e => ({ ...e, [feld]: wert }));
  const setzeDm = (feld, wert) => setEntwurf(e => ({ ...e, dm: { ...(e.dm || {}), [feld]: wert } }));
  const unter = karten.find(k => k.id === (dm ? entwurf.unterkarte : ort.unterkarte));
  const bilder = (dm ? entwurf.bilder : ort.bilder) || [];

  const bildLeiste = bilder.length > 0 && (
    <div className="pl-ort-bilder">
      {bilder.map(p => (
        <figure key={p}>
          <button className="pl-ort-bild" onClick={() => setGross(p)} aria-label="Bild groß ansehen">
            <img src={planerDateiUrl(karte.ablage, p)} alt="" loading="lazy" />
          </button>
          {dm && <button className="pl-symbol pl-symbol-weg" aria-label="Bild entfernen" title="Bild entfernen"
            onClick={() => onBildWeg(entwurf, p)} disabled={arbeitet}>✕</button>}
        </figure>
      ))}
    </div>
  );
  const lupe = gross && (
    <div className="pl-schleier pl-lupe" onClick={() => setGross(null)} role="dialog" aria-label="Bild">
      <img src={planerDateiUrl(karte.ablage, gross)} alt="" />
    </div>
  );

  if (!dm) {
    return (
      <aside className="pl-tafel" aria-label={'Ort: ' + ort.name}>
        <header className="pl-tafel-kopf">
          <span className="pl-tafel-symbol" aria-hidden="true">{ort.symbol || '📍'}</span>
          <h2>{ort.name}</h2>
          <button className="pl-symbol" aria-label="Schließen" onClick={onSchliessen}>✕</button>
        </header>
        {ort.text ? <p className="pl-ort-text">{ort.text}</p> : <p className="pl-leise">Über diesen Ort ist noch nichts bekannt.</p>}
        {bildLeiste}
        {unter && <button className="pl-knopf pl-haupt" onClick={() => onUnterkarte(unter.id)}>🗺 {unter.name} öffnen</button>}
        {lupe}
      </aside>
    );
  }

  return (
    <aside className="pl-tafel" aria-label={'Ort bearbeiten: ' + ort.name}>
      <header className="pl-tafel-kopf">
        <span className="pl-tafel-symbol" aria-hidden="true">{entwurf.symbol || '📍'}</span>
        <h2>{entwurf.name || 'Ohne Namen'}</h2>
        <button className="pl-symbol" aria-label="Schließen" onClick={onSchliessen}>✕</button>
      </header>
      <form className="pl-formular" onSubmit={e => { e.preventDefault(); if (geaendert) onSpeichern(entwurf); }}>
        <label>Name
          <input className="pl-feld" value={entwurf.name || ''} maxLength={120} onChange={e => setze('name', e.target.value)} />
        </label>
        <div className="pl-symbole" role="radiogroup" aria-label="Zeichen">
          {ORT_SYMBOLE.map(s => (
            <button type="button" key={s} role="radio" aria-checked={(entwurf.symbol || '📍') === s}
              className={'pl-symbolwahl' + ((entwurf.symbol || '📍') === s ? ' an' : '')} onClick={() => setze('symbol', s)}>{s}</button>
          ))}
        </div>
        <label>Was die Spieler lesen
          <textarea className="pl-feld" rows={4} value={entwurf.text || ''} maxLength={20000} onChange={e => setze('text', e.target.value)} />
        </label>
        <label>Notiz der Spielleitung <span className="pl-leise">— sehen Spieler nie</span>
          <textarea className="pl-feld pl-dm-feld" rows={3} value={(entwurf.dm && entwurf.dm.notiz) || ''} maxLength={20000} onChange={e => setzeDm('notiz', e.target.value)} />
        </label>
        <label>Führt zu Karte
          <select className="pl-feld" value={entwurf.unterkarte || ''} onChange={e => setze('unterkarte', e.target.value || undefined)}>
            <option value="">— keine —</option>
            {karten.filter(k => k.id !== entwurf.karteId).map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </label>
        <label className="pl-schalter">
          <input type="checkbox" checked={!!entwurf.sichtbar} onChange={e => setze('sichtbar', e.target.checked)} />
          <span>Für Spieler sichtbar</span>
        </label>
        {bildLeiste}
        <div className="pl-zeile">
          <button type="button" className="pl-knopf pl-klein" disabled={arbeitet} onClick={() => bildEingabe.current && bildEingabe.current.click()}>＋ Bild</button>
          <input ref={bildEingabe} type="file" accept="image/*" multiple hidden
            onChange={e => { const f = [...(e.target.files || [])]; e.target.value = ''; if (f.length) onBilderHoch(entwurf, f); }} />
          {unter && <button type="button" className="pl-knopf pl-klein" onClick={() => onUnterkarte(unter.id)}>🗺 {unter.name}</button>}
        </div>
        <div className="pl-dialog-knoepfe">
          <button type="button" className="pl-knopf pl-gefahr pl-klein" onClick={() => onLoeschen(ort)}>Löschen</button>
          <button type="button" className="pl-knopf pl-klein" disabled={!geaendert} onClick={() => setEntwurf(ort)}>Verwerfen</button>
          <button type="submit" className="pl-knopf pl-haupt pl-klein" disabled={!geaendert || !String(entwurf.name || '').trim()}>Speichern</button>
        </div>
      </form>
      {lupe}
    </aside>
  );
};
