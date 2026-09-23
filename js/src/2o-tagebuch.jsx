// Heldenbuch — das Sitzungstagebuch.
//
// Was am Abend geschehen ist, weiß am nächsten Morgen niemand mehr
// genau. Der Kampftracker führt Protokoll, das Abenteuerlog führt Buch
// über Zahlen — aber „wir haben den Wirt bestochen und sind durch den
// Keller raus" steht nirgends.
//
// Ein Abend ist eine **Sitzung**: Datum, Titel, wahlweise der Tag im
// Spiel. Darin schreibt **jeder seinen eigenen Eintrag** — die
// Spielleitung ihren, jeder Spieler seinen, gern aus Sicht der Figur.
// **Bilder und Videos hängen an der Sitzung**, nicht am Eintrag: das
// Foto vom Tisch gehört allen, die dabei waren.
//
// Das Fenster ist zum Lesen gebaut — ein Tagebuch schlägt man öfter auf,
// als man hineinschreibt. Wer etwas ändern will, drückt **✎ Bearbeiten**;
// erst dann erscheinen Textfeld, Hochladen und die Knöpfe zum Löschen.
//
// Gelesen wird alles von allen. Nur was die Spielleitung als „nur für
// mich" kennzeichnet, schickt der Server den Spielern gar nicht erst
// (api.php, tagebuch_liste).
//
// Alles bis zur Markierung ist reine Rechnung
// (dev/pruefungen/tagebuch-test.js).

const TB_BILD_KANTE    = 2400;      // längere Kante vor dem Hochladen
const TB_WOCHENTAGE    = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

// Das heutige Datum als JJJJ-MM-TT, in der Zeit des Geräts — nicht in
// UTC: wer um 23 Uhr den Abend einträgt, meint heute und nicht morgen.
const tbHeute = (jetzt) => {
  const d = jetzt ? new Date(jetzt) : new Date();
  const zwei = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate());
};
const tbDatumText = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return TB_WOCHENTAGE[d.getDay()] + '., ' + m[3] + '.' + m[2] + '.' + m[1];
};
const tbSitzungTitel = (s) => String((s && s.titel) || '').trim() || tbDatumText(s && s.datum);
// Neueste zuerst — das Tagebuch liest man von hinten.
const tbSortiert = (liste) => [...(liste || [])].sort((a, b) =>
  String(b.datum || '').localeCompare(String(a.datum || '')) || String(b.id || '').localeCompare(String(a.id || '')));
const tbEintragVon = (sitzung, userId) => ((sitzung && sitzung.eintraege) || []).find(e => e.userId === userId) || null;
// Die Einträge der anderen: der eigene steht oben und wird getrennt
// angezeigt, weil er das Feld zum Schreiben ist.
const tbAndere = (sitzung, userId) => ((sitzung && sitzung.eintraege) || []).filter(e => e.userId !== userId);

// ── Vorschläge aus dem Abenteuerlog ──────────────────────────────
// Was an diesem Kalendertag im Log stand. Es wird nichts geschrieben —
// es steht daneben, und ein Klick nimmt eine Zeile in den eigenen Text.
const tbLogDatum = (l) => String((l && l.created_at) || '').slice(0, 10);
const tbZeile = (l) => {
  const wer = String((l && l.char_name) || '').trim();
  const was = String((l && l.action) || '').trim();
  return (wer ? wer + ': ' : '') + was;
};
const tbVorschlaege = (logs, datum, hoechstens) => {
  const gesehen = new Set();
  const raus = [];
  for (const l of (logs || [])) {
    if (tbLogDatum(l) !== datum) continue;
    const text = tbZeile(l);
    if (!text || gesehen.has(text)) continue;
    gesehen.add(text);
    raus.push({id: l.id, text, tab: l.tab || ''});
    if (raus.length >= (hoechstens || 40)) break;
  }
  return raus;
};
// Eine Zeile in den eigenen Text: als Aufzählungspunkt, und nie zweimal.
const tbAnhaengen = (text, zeile) => {
  const t = String(text == null ? '' : text);
  const z = '• ' + String(zeile || '').trim();
  if (t.split('\n').some(x => x.trim() === z)) return t;
  return t.trim() ? t.replace(/\s*$/, '') + '\n' + z : z;
};

// ── Bilder ───────────────────────────────────────────────────────
// Sie liegen in derselben Ablage wie die Kartenbilder des Planers: ein
// Ordner mit zufälligem Namen, vom Webserver direkt ausgeliefert.
const tbBildUrl = (server, ablage, datei) =>
  String(server || '').replace(/\/+$/, '') + '/planer-dateien/' + ablage + '/' + datei;
const tbGroesse = (n) => {
  const b = +n || 0;
  if (b >= 1048576) return (b / 1048576).toFixed(1).replace('.', ',') + ' MB';
  if (b >= 1024) return Math.round(b / 1024) + ' kB';
  return b + ' B';
};
// Was hineindarf: Bilder, die jeder Browser zeigt, und Videos, die jeder
// Browser abspielt. MOV und MKV bleiben draußen — sie laden hoch und
// laufen dann bei der Hälfte der Runde nicht.
const TB_ARTEN = {png: 'bild', jpg: 'bild', jpeg: 'bild', webp: 'bild',
                  mp4: 'video', m4v: 'video', webm: 'video', ogv: 'video'};
const TB_TYPEN = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
                  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv'};
// Bilder werden ohnehin kleiner gerechnet; Videos gehen stueckweise und
// duerfen deshalb gross sein (api.php, TB_MAX_VIDEO).
const TB_GRENZE = {bild: 12000000, video: 1073741824};
const TB_GRENZE_TEXT = {bild: '12 MB', video: '1 GB'};
const tbEndung = (datei) => TB_TYPEN[(datei && datei.type) || '']
  || (/\.(png|jpe?g|webp|mp4|m4v|webm|ogv)$/i.exec((datei && datei.name) || '') || [])[1] || '';
const tbArt = (was) => TB_ARTEN[String(was || '').toLowerCase()] || '';
// Bei einer abgelegten Datei steht die Endung im Namen.
const tbArtVonDatei = (name) => tbArt((/\.([a-z0-9]+)$/i.exec(String(name || '')) || [])[1]);
// Was nicht hineindarf, sagt es hier — und nicht erst der Server.
const tbTadel = (datei) => {
  const art = tbArt(tbEndung(datei));
  const name = (datei && datei.name) || 'Die Datei';
  if (!art) return '„' + name + '": nur PNG, JPEG, WebP — oder MP4, WebM, OGV.';
  if ((datei.size || 0) > TB_GRENZE[art]) {
    // Die Grenze in denselben Worten, die auch der Server benutzt —
    // „11,4 MB" wäre dieselbe Zahl und läse sich wie eine andere.
    return '„' + name + '" ist ' + tbGroesse(datei.size) + ' groß — erlaubt sind '
      + TB_GRENZE_TEXT[art] + (art === 'video' ? ' je Video.' : ' je Bild.');
  }
  if (!(datei.size > 0)) return '„' + name + '" ist leer.';
  return '';
};
// ── Stückweise ───────────────────────────────────────────────────
// Eine Datei geht in Stücken von 4 MB zum Server, eines nach dem anderen
// (api.php, tagebuch_stueck). So hängt nichts mehr an der Größe einer
// einzelnen Anfrage, und ein Video von 300 MB liegt nie ganz im Speicher:
// gelesen wird immer nur das Stück, das gerade geht.
const TB_STUECK = 4194304;
const tbTeile = (groesse, stueck) => {
  const s = stueck || TB_STUECK;
  const raus = [];
  for (let von = 0, nr = 0; von < (+groesse || 0); von += s, nr++) {
    raus.push({nr, von, bis: Math.min(+groesse, von + s)});
  }
  return raus;
};
// Wie weit es ist, in ganzen Prozent — und nie 100, bevor das letzte
// Stück wirklich angekommen ist.
const tbProzent = (fertig, groesse) => {
  if (!(groesse > 0)) return 0;
  const p = Math.floor(100 * Math.max(0, Math.min(fertig, groesse)) / groesse);
  return fertig >= groesse ? 100 : Math.min(99, p);
};
// Was nach einem Fehler geschieht: der Server sagt, ab welchem Stück er
// weitermachen will (409), oder es war das Netz (nochmal, ein paar Mal),
// oder es geht grundsätzlich nicht (aufgeben).
const tbNachFehler = (fehler, nr, versuche) => {
  const status = fehler && fehler.status;
  const erwartet = fehler && fehler.daten && fehler.daten.erwartet;
  if (status === 409 && Number.isInteger(erwartet) && erwartet >= 0) return {tun: 'springen', nr: erwartet};
  if (status && status < 500) return {tun: 'aufgeben'};
  return versuche < 3 ? {tun: 'nochmal', nr, warten: 1500 * (versuche + 1)} : {tun: 'aufgeben'};
};
// ══ Ende der reinen Rechnung

// Ein Bild wird vor dem Hochladen kleiner gerechnet: ein Handyfoto hat
// zwölf Megapixel, und keiner davon hilft beim Erinnern. Geht es nicht
// (alter Browser, seltsames Format), wandert die Datei, wie sie ist.
const tbVerkleinern = async (datei) => {
  const endung = tbEndung(datei);
  const tadel = tbTadel(datei);
  if (tadel) throw new Error(tadel);
  // Ein Video geht, wie es ist, und wird hier gar nicht gelesen: neu zu
  // rechnen dauerte länger als der Abend, den es zeigt, und ganz in den
  // Speicher passt es nicht immer. Gelesen wird Stück für Stück beim Senden.
  if (tbArt(endung) === 'video') return {endung, datei, groesse: datei.size, name: datei.name};
  const bytes = await datei.arrayBuffer();
  const roh = {endung, bytes: new Uint8Array(bytes), groesse: bytes.byteLength, name: datei.name};
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas !== 'function') return roh;
  if (datei.size < 800000 && endung !== 'png') return roh;
  try {
    const bild = await createImageBitmap(datei);
    const gross = Math.max(bild.width, bild.height);
    const faktor = gross > TB_BILD_KANTE ? TB_BILD_KANTE / gross : 1;
    if (faktor === 1 && datei.size < 2000000 && endung !== 'png') { bild.close(); return roh; }
    const leinwand = new OffscreenCanvas(Math.round(bild.width * faktor), Math.round(bild.height * faktor));
    const stift = leinwand.getContext('2d');
    stift.drawImage(bild, 0, 0, leinwand.width, leinwand.height);
    bild.close();
    const blob = await leinwand.convertToBlob({type: 'image/jpeg', quality: 0.85});
    if (!blob || blob.size >= roh.bytes.length) return roh;
    const klein = new Uint8Array(await blob.arrayBuffer());
    return {endung: 'jpg', bytes: klein, groesse: klein.length, name: datei.name};
  } catch (e) {
    return roh;
  }
};
// Ein Stück der Quelle: aus dem Speicher (ein Bild, schon verkleinert)
// oder frisch von der Platte (ein Video).
const tbStueckLesen = async (quelle, von, bis) => quelle.bytes
  ? quelle.bytes.subarray(von, bis)
  : new Uint8Array(await quelle.datei.slice(von, bis).arrayBuffer());
const tbKennung = () => {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
};
const tbBase64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

// ── Das Fenster ──────────────────────────────────────────────────
const TagebuchFenster = ({ sitzungen, ich, dm, server, chars, logs, chronikZeit, laedt, fehler,
                           onNeu, onSitzung, onSitzungWeg, onEintrag, onStueck, onFertig, onBildWeg, onLogs, onZu }) => {
  const liste = tbSortiert(sitzungen);
  const [wahlId, setWahlId] = React.useState('');
  const sitzung = liste.find(s => s.id === wahlId) || liste[0] || null;
  const [entwurf, setEntwurf] = React.useState('');
  const [nurDm, setNurDm] = React.useState(false);
  const [charId, setCharId] = React.useState('');
  const [kopf, setKopf] = React.useState(null);      // {datum, titel, spielzeit} beim Bearbeiten
  const [gross, setGross] = React.useState(null);    // Bild im Großen
  const [arbeitet, setArbeitet] = React.useState('');
  const [vorschlaegeAuf, setVorschlaegeAuf] = React.useState(false);
  // Gelesen wird öfter als geschrieben: das Fenster geht zum Anschauen
  // auf, und erst „✎ Bearbeiten" holt Textfeld und Knöpfe hervor.
  const [bearbeiten, setBearbeiten] = React.useState(false);
  const eingabe = React.useRef(null);

  const meiner = sitzung ? tbEintragVon(sitzung, ich) : null;
  // Was im Feld steht, kommt aus dem Eintrag — auch nach dem Speichern,
  // damit „geaendert“ danach wieder falsch ist.
  React.useEffect(() => {
    setEntwurf(meiner ? meiner.text : '');
    setNurDm(!!(meiner && meiner.nurDm));
    setCharId((meiner && meiner.charId) || '');
  }, [sitzung && sitzung.id, meiner && meiner.geaendert]);
  // Der Modus haengt am Abend, nicht am Eintrag: wer speichert, bleibt im
  // Bearbeiten stehen; wer den Abend wechselt, liest zuerst.
  React.useEffect(() => {
    setKopf(null); setGross(null); setVorschlaegeAuf(false); setBearbeiten(false);
  }, [sitzung && sitzung.id]);

  const geaendert = !!sitzung && (entwurf !== (meiner ? meiner.text : '')
    || nurDm !== !!(meiner && meiner.nurDm) || charId !== ((meiner && meiner.charId) || ''));
  const vorschlaege = sitzung ? tbVorschlaege(logs, sitzung.datum) : [];

  const speichern = async () => {
    if (!sitzung) return;
    setArbeitet('Wird gespeichert …');
    const c = (chars || []).find(x => x.id === charId);
    await onEintrag(sitzung.id, entwurf, nurDm, charId, c ? c.name : '');
    setArbeitet('');
  };

  const [tadel, setTadel] = React.useState('');
  const medienWaehlen = async (dateien) => {
    if (!sitzung || !dateien || !dateien.length) return;
    setTadel('');
    // Erst nachsehen, was gar nicht geht: ein Video von 2 GB soll
    // nicht erst hochgeladen und dann abgewiesen werden.
    const schlecht = [...dateien].map(tbTadel).filter(Boolean);
    const gut = [...dateien].filter(d => !tbTadel(d));
    if (schlecht.length) setTadel(schlecht.join(' '));
    if (!gut.length) return;
    // Eine Datei nach der anderen, jede in Stücken. Was schiefgeht, wird
    // wiederholt oder fortgesetzt (tbNachFehler); was grundsätzlich nicht
    // geht, steht am Ende da — die übrigen Dateien gehen trotzdem.
    const fehlschlaege = [];
    for (let i = 0; i < gut.length; i++) {
      const d = gut[i];
      const wer = (gut.length > 1 ? (i + 1) + ' von ' + gut.length + ': ' : '') + '„' + d.name + '"';
      try {
        setArbeitet(wer + ' wird vorbereitet …');
        const quelle = await tbVerkleinern(d);
        const teile = tbTeile(quelle.groesse);
        const upload = tbKennung();
        const titel = d.name.replace(/\.[^.]+$/, '').slice(0, 160);
        let nr = 0, versuche = 0, schritte = 0;
        while (nr < teile.length) {
          if (++schritte > teile.length * 4 + 8) throw new Error('Das Hochladen kommt nicht voran.');
          const t = teile[nr];
          setArbeitet(wer + ' — ' + tbProzent(t.von, quelle.groesse) + ' %');
          try {
            const bytes = await tbStueckLesen(quelle, t.von, t.bis);
            await onStueck(sitzung.id, {upload, nr, gesamt: teile.length, groesse: quelle.groesse,
                                         endung: quelle.endung, titel, daten: tbBase64(bytes)});
            nr++; versuche = 0;
          } catch (e) {
            const weiter = tbNachFehler(e, nr, versuche);
            if (weiter.tun === 'aufgeben') throw e;
            if (weiter.tun === 'nochmal') { versuche++; await new Promise(r => setTimeout(r, weiter.warten)); }
            nr = weiter.nr;
          }
        }
      } catch (e) {
        fehlschlaege.push('„' + d.name + '": ' + (e.message || 'ging nicht.'));
      }
    }
    setArbeitet('');
    if (fehlschlaege.length) setTadel([...schlecht, ...fehlschlaege].join(' '));
    if (onFertig) await onFertig();
  };

  return (
    <Fenster onZu={onZu} leiste={{id: 'tagebuch', titel: 'Tagebuch', symbol: '📔',
                                  zaehler: liste.length ? String(liste.length) : ''}}>
      <div className="form-modal breit tb-fenster" style={{maxWidth: 1000}}>
        <div className="form-title">📔 Sitzungstagebuch</div>

        <div className="tb-leib">
          <nav className="tb-abende">
            <button className="btn-save tb-neu" onClick={() => onNeu(chronikZeit)}>＋ Neuer Abend</button>
            {laedt && <div className="tb-leise">Wird geladen …</div>}
            {!laedt && !liste.length && <div className="tb-leise">Noch kein Abend eingetragen.</div>}
            <ul>
              {liste.map(s => (
                <li key={s.id}>
                  <button className={'tb-abend' + (sitzung && s.id === sitzung.id ? ' an' : '')}
                    onClick={() => setWahlId(s.id)}>
                    <b>{tbSitzungTitel(s)}</b>
                    <i>{tbDatumText(s.datum)}{s.spielzeit ? ' · ' + s.spielzeit : ''}</i>
                    <span className="tb-zahlen">
                      {(s.eintraege || []).length > 0 && <span title="Einträge">✍ {(s.eintraege || []).length}</span>}
                      {(s.bilder || []).length > 0 && <span title="Bilder">🖼 {(s.bilder || []).length}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="tb-abend-leib">
            {fehler && <div className="tb-fehler">{fehler}</div>}
            {!sitzung && !laedt && (
              <div className="tb-leer">
                <div className="tb-leer-zeichen">📔</div>
                <p>Ein Abend, ein Eintrag je Person — und die Bilder gehören allen.</p>
                <p className="tb-leise">Leg den ersten Abend an; das Datum von heute steht schon drin.</p>
              </div>
            )}

            {sitzung && (
              <>
                <header className="tb-kopf">
                  {kopf ? (
                    <div className="tb-kopf-form">
                      <input className="form-input" type="date" value={kopf.datum} aria-label="Datum"
                        onChange={e => setKopf(k => ({...k, datum: e.target.value}))} />
                      <input className="form-input" value={kopf.titel} maxLength={160} placeholder="Titel des Abends"
                        aria-label="Titel" onChange={e => setKopf(k => ({...k, titel: e.target.value}))} />
                      <input className="form-input" value={kopf.spielzeit} maxLength={80} placeholder="Tag im Spiel"
                        aria-label="Tag im Spiel" onChange={e => setKopf(k => ({...k, spielzeit: e.target.value}))} />
                      <button className="btn-cancel" onClick={() => setKopf(null)}>Abbrechen</button>
                      <button className="btn-save" onClick={async () => { await onSitzung({...kopf, id: sitzung.id}); setKopf(null); }}>Speichern</button>
                    </div>
                  ) : (
                    <>
                      <h3>{tbSitzungTitel(sitzung)}</h3>
                      {/* Ohne Titel steht das Datum schon in der Überschrift —
                          zweimal dasselbe liest niemand. */}
                      <span className="tb-leise">
                        {[sitzung.titel ? tbDatumText(sitzung.datum) : '', sitzung.spielzeit].filter(Boolean).join(' · ')}
                      </span>
                      <span className="tb-kopf-knoepfe">
                        {bearbeiten ? (
                          <>
                            <button className="btn-icon tb-klein"
                              onClick={() => setKopf({datum: sitzung.datum, titel: sitzung.titel || '', spielzeit: sitzung.spielzeit || ''})}>✎ Abend</button>
                            {(dm || sitzung.von === ich) && (
                              <button className="btn-cancel tb-klein" onClick={() => onSitzungWeg(sitzung)}>🗑 Abend löschen</button>
                            )}
                            <button className="btn-save tb-klein"
                              onClick={async () => { if (geaendert) await speichern(); setBearbeiten(false); }}>
                              {geaendert ? '✓ Speichern und fertig' : '✓ Fertig'}
                            </button>
                          </>
                        ) : (
                          <button className="btn-icon tb-klein" onClick={() => setBearbeiten(true)}>✎ Bearbeiten</button>
                        )}
                      </span>
                    </>
                  )}
                </header>

                <div className="tb-bilder">
                  {(sitzung.bilder || []).map(b => (
                    <figure key={b.id} className={'tb-bild' + (tbArtVonDatei(b.datei) === 'video' ? ' video' : '')}>
                      {tbArtVonDatei(b.datei) === 'video' ? (
                        <button className="tb-video-marke" onClick={() => setGross(b)}
                          aria-label={'Video abspielen: ' + (b.titel || '')}>
                          <span aria-hidden="true">▶</span>
                        </button>
                      ) : (
                        <img src={tbBildUrl(server, sitzung.ablage, b.datei)} alt={b.titel || 'Bild vom Abend'}
                          loading="lazy" onClick={() => setGross(b)} />
                      )}
                      <figcaption>
                        <span title={b.titel}>{b.titel || 'ohne Titel'}</span>
                        {bearbeiten && (dm || b.meins) && (
                          <button className="tb-bild-weg" title="Löschen"
                            aria-label={'Löschen: ' + (b.titel || '')} onClick={() => onBildWeg(b)}>✕</button>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                  {bearbeiten && (
                    <>
                      <button className="tb-bild-neu" onClick={() => eingabe.current && eingabe.current.click()}>
                        <span>＋</span><span className="tb-leise">Bilder, Videos</span>
                      </button>
                      <input ref={eingabe} type="file" multiple hidden
                        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/ogg"
                        onChange={e => {
                          // Erst abschreiben, dann leeren: das Feld zurueckzusetzen
                          // raeumt die Liste, und die Arbeit daran laeuft nebenher.
                          const d = [...e.target.files];
                          e.target.value = '';
                          medienWaehlen(d);
                        }} />
                    </>
                  )}
                  {!bearbeiten && !(sitzung.bilder || []).length && (
                    <span className="tb-leise">Keine Bilder und keine Videos an diesem Abend.</span>
                  )}
                </div>
                {arbeitet && <div className="tb-leise tb-arbeit">{arbeitet}</div>}
                {tadel && <div className="tb-fehler">{tadel}</div>}

                <div className="tb-eintrag">
                  <div className="tb-eintrag-kopf">
                    <span>✍ Mein Eintrag</span>
                    {!bearbeiten && meiner && meiner.nurDm && <span className="tb-marke">🔮 nur Spielleitung</span>}
                    {bearbeiten && (chars || []).length > 0 && (
                      <select className="form-input tb-charwahl" value={charId} aria-label="Als wen"
                        onChange={e => setCharId(e.target.value)}>
                        <option value="">— als ich selbst —</option>
                        {(chars || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                    {!bearbeiten && meiner && meiner.charName && <span className="tb-leise">als {meiner.charName}</span>}
                    {bearbeiten && dm && (
                      <label className="tb-schalter" title="Die Spieler bekommen diesen Eintrag gar nicht erst">
                        <input type="checkbox" checked={nurDm} onChange={e => setNurDm(e.target.checked)} />
                        <span>🔮 nur für mich</span>
                      </label>
                    )}
                  </div>
                  {bearbeiten ? (
                    <textarea className="form-textarea tb-feld" rows={8} value={entwurf}
                      placeholder="Was ist an diesem Abend geschehen?"
                      onChange={e => setEntwurf(e.target.value)} />
                  ) : meiner && meiner.text.trim() ? (
                    <p className="tb-gelesen">{meiner.text}</p>
                  ) : (
                    <p className="tb-leise">Noch nichts geschrieben — „✎ Bearbeiten" macht das Feld auf.</p>
                  )}
                  {bearbeiten && <div className="tb-eintrag-fuss">
                    <button className="btn-icon tb-klein" onClick={() => { setVorschlaegeAuf(v => !v); if (onLogs) onLogs(); }}>
                      {vorschlaegeAuf ? '▾' : '▸'} Aus dem Abenteuerlog{vorschlaege.length ? ' (' + vorschlaege.length + ')' : ''}
                    </button>
                    <span className="tb-leise">
                      {meiner ? 'Zuletzt geändert: ' + new Date(meiner.geaendert).toLocaleString('de-DE') : 'Noch nichts geschrieben.'}
                    </span>
                    <button className="btn-save" disabled={!geaendert} onClick={speichern}>✶ Eintrag speichern</button>
                  </div>}
                  {bearbeiten && vorschlaegeAuf && (
                    <div className="tb-vorschlaege">
                      {vorschlaege.length === 0 && <span className="tb-leise">Für diesen Tag steht nichts im Log.</span>}
                      {vorschlaege.map(v => (
                        <button key={v.id} className="tb-vorschlag" title="In meinen Eintrag übernehmen"
                          onClick={() => setEntwurf(t => tbAnhaengen(t, v.text))}>+ {v.text}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="tb-andere">
                  {tbAndere(sitzung, ich).length === 0 && (
                    <span className="tb-leise">Sonst hat noch niemand etwas geschrieben.</span>
                  )}
                  {tbAndere(sitzung, ich).map(e => (
                    <article className="tb-fremd" key={e.id}>
                      <header>
                        <b>{e.charName || e.user}</b>
                        {e.charName && <span className="tb-leise"> · {e.user}</span>}
                        {e.nurDm && <span className="tb-marke">🔮 nur Spielleitung</span>}
                      </header>
                      <p>{e.text}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {gross && (
          <div className="tb-gross" onClick={() => setGross(null)} role="dialog" aria-label={gross.titel || 'Bild'}>
            {tbArtVonDatei(gross.datei) === 'video' ? (
              <video src={tbBildUrl(server, sitzung.ablage, gross.datei)} controls autoPlay
                onClick={e => e.stopPropagation()} />
            ) : (
              <img src={tbBildUrl(server, sitzung.ablage, gross.datei)} alt={gross.titel || ''} />
            )}
            <div className="tb-gross-fuss">
              <span>{gross.titel || 'ohne Titel'} · {tbGroesse(gross.bytes)} · {gross.user}</span>
              <button className="btn-cancel" onClick={() => setGross(null)}>Schließen</button>
            </div>
          </div>
        )}

        <div className="form-actions">
          <span className="tb-leise" style={{marginRight: 'auto'}}>
            {bearbeiten
              ? 'Bilder bis ' + TB_GRENZE_TEXT.bild + ', Videos bis ' + TB_GRENZE_TEXT.video + ' (MP4, WebM, OGV).'
              : 'Bilder und Videos gehören dem Abend, die Texte den Schreibenden.'}
          </span>
          <button className="btn-cancel" onClick={onZu}>Schließen</button>
        </div>
      </div>
    </Fenster>
  );
};
