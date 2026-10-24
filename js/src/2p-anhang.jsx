// Heldenbuch — PDFs an Gegenstaenden, und ihr Leser.
//
// Ein Buch im Inventar soll sich aufschlagen lassen, ein Brief lesen. Die
// Datei gehoert dafuer nicht in den Gegenstand: der wandert bei jedem
// Abgleich, in jede Beute, in jeden Textbogen. Sie liegt auf dem Server
// (api.php, anhang_stueck), und der Gegenstand traegt nur den Verweis:
//
//     item.anhaenge = [{id, ablage, datei, name, bytes}]
//
// Hochgeladen wird stueckweise wie die Videos des Tagebuchs — mit
// denselben Helfern (tbTeile, tbNachFehler, …, in 2o-tagebuch.jsx).
//
// Der Leser zeichnet die Seiten selbst, mit pdf.js (vendor/pdfjs/, erst
// beim ersten Oeffnen geladen). Fehlt pdf.js oder kann es die Datei nicht
// lesen, zeigt er sie im Leser des Browsers — und ein Knopf oeffnet sie
// immer auch dort, in einem eigenen Tab.

const ANHANG_GRENZE = 52428800;          // wie ANHANG_MAX in api.php
const anhangUrl = (server, a) => tbBildUrl(server, a.ablage, a.datei);
const anhangPruefen = (datei) => {
  if (!datei) return 'Keine Datei.';
  const name = datei.name || 'Datei';
  if (!/\.pdf$/i.test(name) && datei.type !== 'application/pdf') return '„' + name + '" ist kein PDF.';
  if (!(datei.size > 0)) return '„' + name + '" ist leer.';
  if (datei.size > ANHANG_GRENZE) return '„' + name + '" ist ' + tbGroesse(datei.size) + ' groß — erlaubt sind 50 MB.';
  return '';
};

// Eine Datei hinauf, Stueck fuer Stueck. onStand(prozent) meldet den
// Fortschritt. Zurueck kommt der Verweis, den der Gegenstand traegt.
const anhangHochladen = async (datei, onStand) => {
  const fehler = anhangPruefen(datei);
  if (fehler) throw new Error(fehler);
  const creds = serverCreds();
  // Dieselbe Pruefung wie verbunden() in der App: Adresse, Gruppe, Konto.
  if (!creds.url || !creds.code || !creds.token) throw new Error('Ohne Server lässt sich nichts anhängen.');
  const name = /\.pdf$/i.test(datei.name || '') ? datei.name : (datei.name || 'Dokument') + '.pdf';
  const quelle = {datei, groesse: datei.size};
  const teile = tbTeile(datei.size);
  const upload = tbKennung();
  let nr = 0, versuche = 0, schritte = 0, antwort = null;
  while (nr < teile.length) {
    if (++schritte > teile.length * 4 + 8) throw new Error('Das Hochladen kommt nicht voran.');
    const t = teile[nr];
    if (onStand) onStand(tbProzent(t.von, datei.size));
    try {
      const bytes = await tbStueckLesen(quelle, t.von, t.bis);
      antwort = await apiAnhangStueck(creds.url, creds.code, {
        upload, nr, gesamt: teile.length, groesse: datei.size, name, daten: tbBase64(bytes)});
      nr++; versuche = 0;
    } catch (e) {
      const weiter = tbNachFehler(e, nr, versuche);
      if (weiter.tun === 'aufgeben') throw e;
      if (weiter.tun === 'nochmal') { versuche++; await new Promise(r => setTimeout(r, weiter.warten)); }
      nr = weiter.nr;
    }
  }
  if (onStand) onStand(100);
  if (!antwort || !antwort.anhang) throw new Error('Der Server hat den Anhang nicht bestätigt.');
  return antwort.anhang;
};

// ══ Ende der reinen Rechnung ═══════════════════════════════════════

// ── Im Gegenstand: die Anhaenge bearbeiten ──────────────────────
const AnhangFeld = ({ anhaenge, onAendern, onLesen }) => {
  const [stand, setStand] = useState(null);     // null | {name, prozent}
  const [tadel, setTadel] = useState('');
  const liste = anhaenge || [];
  const waehlen = async (e) => {
    const dateien = [...(e.target.files || [])];
    e.target.value = '';
    setTadel('');
    let neu = liste;
    for (const d of dateien) {
      try {
        setStand({name: d.name, prozent: 0});
        const a = await anhangHochladen(d, (p) => setStand({name: d.name, prozent: p}));
        neu = [...neu, a];
        onAendern(neu);
      } catch (err) {
        setTadel(err.message || 'Das Hochladen ging nicht.');
      }
    }
    setStand(null);
  };
  return (
    <div className="anhang-feld">
      {liste.map((a, i) => (
        <div className="anhang-zeile" key={a.id || i}>
          <button type="button" className="anhang-name" onClick={() => onLesen && onLesen(a)}
            title="Lesen">📖 {a.name}</button>
          <span className="anhang-groesse">{tbGroesse(a.bytes)}</span>
          <button type="button" className="anhang-weg" aria-label={'Vom Gegenstand nehmen: ' + a.name}
            title="Vom Gegenstand nehmen" onClick={() => onAendern(liste.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {stand ? (
        <div className="anhang-stand">„{stand.name}" — {stand.prozent} %</div>
      ) : (
        <label className="btn-icon anhang-knopf">
          📎 PDF anhängen
          <input type="file" accept="application/pdf,.pdf" multiple onChange={waehlen} style={{display:'none'}} />
        </label>
      )}
      {tadel && <div className="anhang-tadel">{tadel}</div>}
      <div className="anhang-hinweis">Ein Buch, ein Brief, eine Karte als PDF — bis 50 MB. Die Datei liegt
        auf dem Server; wer den Gegenstand hat, kann sie lesen.</div>
    </div>
  );
};

// ── pdf.js, erst wenn es gebraucht wird ─────────────────────────
// 1,4 MB Bibliothek, die beim Start niemand braucht. Geladen wird sie
// beim ersten Aufschlagen; fehlt sie (oder geht es schief), liest der
// Browser selbst.
const PDFJS_PFAD = 'vendor/pdfjs/';
let pdfjsVersprechen = null;
const pdfjsLaden = () => {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsVersprechen) return pdfjsVersprechen;
  pdfjsVersprechen = new Promise((fertig, schief) => {
    const s = document.createElement('script');
    s.src = W_BILD_BASIS + PDFJS_PFAD + 'pdf.min.js' + W_BILD_V;
    s.onload = () => {
      const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
      if (!lib || !lib.getDocument) { pdfjsVersprechen = null; schief(new Error('pdf.js fehlt')); return; }
      lib.GlobalWorkerOptions.workerSrc = W_BILD_BASIS + PDFJS_PFAD + 'pdf.worker.min.js' + W_BILD_V;
      window.pdfjsLib = lib;
      fertig(lib);
    };
    s.onerror = () => { pdfjsVersprechen = null; schief(new Error('pdf.js fehlt')); };
    document.head.appendChild(s);
  });
  return pdfjsVersprechen;
};

// ── Der Leser ───────────────────────────────────────────────────
// Eine Seite auf einmal, oder aufgeschlagen wie ein Buch: blaettern mit
// den Knoepfen, den Pfeiltasten oder einem Wisch. Die Seite passt sich in
// die Breite ein oder ganz ins Fenster, und laesst sich groesser ziehen.
const PDF_ZOOM = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
// Welche Seiten gerade offen liegen. Als Buch steht Seite 1 allein —
// der Einband —, danach immer eine gerade links, eine ungerade rechts,
// wie beim Gedruckten: 1 · 2|3 · 4|5 …
const pdfOffen = (seite, seiten, doppel) => {
  const n = Math.max(1, seiten || 1);
  const s = Math.max(1, Math.min(n, seite || 1));
  if (!doppel || s === 1) return [s];
  const links = s % 2 === 0 ? s : s - 1;
  return links + 1 <= n ? [links, links + 1] : [links];
};
// Wohin ein Blaettern fuehrt: auf die erste Seite des naechsten (oder
// vorigen) Aufschlags.
const pdfBlaettern = (seite, seiten, doppel, d) => {
  const offen = pdfOffen(seite, seiten, doppel);
  const ziel = d > 0 ? offen[offen.length - 1] + 1 : offen[0] - 1;
  if (ziel < 1 || ziel > Math.max(1, seiten || 1)) return offen[0];
  return pdfOffen(ziel, seiten, doppel)[0];
};
const PdfLeser = ({ anhang, server, onZu }) => {
  const url = anhangUrl(server, anhang);
  const [art, setArt] = useState('laedt');        // laedt | eigen | browser
  const [doc, setDoc] = useState(null);
  const [seite, setSeite] = useState(1);
  const [passen, setPassen] = useState('breite'); // breite | seite | frei
  const [zoom, setZoom] = useState(1);
  const [doppel, setDoppel] = useState(false);    // aufgeschlagen wie ein Buch
  const buehne = useRef(null);
  const leinwaende = useRef([]);
  const auftraege = useRef([]);
  const wisch = useRef(null);
  const [mass, setMass] = useState(0);            // erzwingt Neuzeichnen bei neuer Fenstergroesse

  // Laden: erst pdf.js, dann die Datei. Was schiefgeht, faellt auf den
  // Browser zurueck.
  useEffect(() => {
    let weg = false, geladen = null;
    setArt('laedt'); setDoc(null); setSeite(1);
    pdfjsLaden()
      // isEvalSupported aus: pdf.js 3.x baut Schriften sonst als Funktion
      // aus dem Text des PDFs, und ein boeses PDF fuehrt so eigenen Code
      // aus (CVE-2024-4367). Ohne ist es kaum langsamer.
      .then(lib => lib.getDocument({url, withCredentials: false, isEvalSupported: false}).promise)
      .then(d => { geladen = d; if (weg) { d.destroy(); return; } setDoc(d); setArt('eigen'); })
      .catch(() => { if (!weg) setArt('browser'); });
    return () => { weg = true; if (geladen) geladen.destroy(); };
  }, [url]);

  // Eine neue Fenstergroesse heisst: neu einpassen.
  useEffect(() => {
    const el = buehne.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const beo = new ResizeObserver(() => setMass(m => m + 1));
    beo.observe(el);
    return () => beo.disconnect();
  }, [art]);

  const seiten = doc ? doc.numPages : 0;
  // Am Telefon waeren zwei Seiten nebeneinander Briefmarken: dort gilt
  // das Buch nicht, auch wenn es eingeschaltet ist. (Wer das Fenster
  // schmaler zieht, loest ueber den ResizeObserver ohnehin neu aus.)
  const schmal = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 700px)').matches;
  const alsBuch = doppel && !schmal;
  const offen = pdfOffen(seite, seiten, alsBuch);
  const offenText = offen.join(',');

  // Zeichnen.
  useEffect(() => {
    if (art !== 'eigen' || !doc || !buehne.current) return undefined;
    let weg = false;
    const el = buehne.current;
    delete el.dataset.gezeichnet;
    // Zeichnet noch der vorige Aufschlag, wird er abgebrochen — und erst
    // wenn er wirklich steht, faengt der neue an: pdf.js nimmt keine zwei
    // Auftraege auf einer Leinwand.
    const vorher = auftraege.current;
    vorher.forEach(a => { try { a.cancel(); } catch (e) {} });
    Promise.all([Promise.all(offen.map(n => doc.getPage(n))),
                 ...vorher.map(a => a.promise.catch(() => {}))]).then(([blaetter]) => {
      if (weg || !buehne.current) return;
      // Alle offenen Seiten im selben Massstab, eingepasst an der groessten.
      const grund = blaetter.map(p => p.getViewport({scale: 1}));
      const breitest = Math.max(...grund.map(g => g.width));
      const hoechst = Math.max(...grund.map(g => g.height));
      const platzB = Math.max(100, (el.clientWidth - 24) / blaetter.length);
      const platzH = Math.max(100, el.clientHeight - 24);
      const massstab = passen === 'breite' ? platzB / breitest
        : passen === 'seite' ? Math.min(platzB / breitest, platzH / hoechst)
        : zoom;
      const dpr = window.devicePixelRatio || 1;
      const neu = blaetter.map((p, i) => {
        const c = leinwaende.current[i];
        if (!c) return null;
        const vp = p.getViewport({scale: massstab});
        c.width = Math.floor(vp.width * dpr);
        c.height = Math.floor(vp.height * dpr);
        c.style.width = Math.floor(vp.width) + 'px';
        c.style.height = Math.floor(vp.height) + 'px';
        return p.render({canvasContext: c.getContext('2d'), viewport: vp,
                         transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null});
      }).filter(Boolean);
      auftraege.current = neu;
      el.scrollTop = 0;
      Promise.all(neu.map(a => a.promise)).then(() => {
        if (weg) return;
        el.dataset.gezeichnet = offenText;
        // Ein leises Umschlagen, wenn das Blatt fertig ist.
        leinwaende.current.forEach(c => { if (!c) return;
          c.classList.remove('wende'); void c.offsetWidth; c.classList.add('wende'); });
      }, () => {});
    });
    return () => { weg = true; };
  }, [art, doc, offenText, passen, zoom, mass]);

  const blaettern = (d) => setSeite(s => pdfBlaettern(s, seiten, alsBuch, d));
  const zoomen = (d) => {
    const i = PDF_ZOOM.findIndex(z => z >= zoom - 0.001);
    const j = Math.max(0, Math.min(PDF_ZOOM.length - 1, (i < 0 ? 2 : i) + d));
    setPassen('frei'); setZoom(PDF_ZOOM[j]);
  };

  // Pfeiltasten — nur, solange der Leser den Fokus hat, sonst blaetterte
  // ein Pfeil im Textfeld nebenan mit.
  const taste = (e) => {
    if (art !== 'eigen') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); blaettern(1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); blaettern(-1); }
    if (e.key === 'Home') { e.preventDefault(); setSeite(1); }
    if (e.key === 'End') { e.preventDefault(); setSeite(pdfOffen(seiten, seiten, alsBuch)[0]); }
  };
  // Wischen am Telefon: waagerecht genug, und nicht beim Herumschieben
  // einer vergroesserten Seite.
  const wischStart = (e) => { const t = e.touches && e.touches[0]; if (t) wisch.current = {x: t.clientX, y: t.clientY}; };
  const wischEnde = (e) => {
    const s = wisch.current; wisch.current = null;
    const t = e.changedTouches && e.changedTouches[0];
    if (!s || !t || passen === 'frei') return;
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) blaettern(dx < 0 ? 1 : -1);
  };

  return (
    <Fenster leiste={{id: 'pdf-leser', titel: anhang.name, symbol: '📖'}} onZu={onZu}>
      <div className="form-modal pdf-leser" onKeyDown={taste} tabIndex={-1}>
        <div className="form-title">📖 {anhang.name}</div>
        <div className="pdf-leiste">
          {art === 'eigen' && (
            <>
              <button type="button" className="btn-icon" onClick={() => blaettern(-1)} disabled={offen[0] <= 1}
                aria-label="Vorige Seite">◀</button>
              <span className="pdf-seite">
                <input type="number" min={1} max={seiten} value={seite} aria-label="Seite"
                  onChange={e => { const n = +e.target.value; if (n >= 1 && n <= seiten) setSeite(n); }} />
                <i>{offen.length > 1 ? '–' + offen[1] + ' ' : ''}von {seiten}</i>
              </span>
              <button type="button" className="btn-icon" onClick={() => blaettern(1)}
                disabled={offen[offen.length - 1] >= seiten} aria-label="Nächste Seite">▶</button>
              <span className="pdf-trenner" />
              <button type="button" className={'btn-icon' + (passen === 'breite' ? ' an' : '')}
                onClick={() => setPassen('breite')} title="In die Breite einpassen">↔</button>
              <button type="button" className={'btn-icon' + (passen === 'seite' ? ' an' : '')}
                onClick={() => setPassen('seite')} title="Ganze Seite">⤢</button>
              {seiten > 2 && (
                <button type="button" className={'btn-icon pdf-doppel' + (doppel ? ' an' : '')}
                  aria-pressed={doppel} onClick={() => setDoppel(v => !v)}
                  title="Aufgeschlagen wie ein Buch: zwei Seiten nebeneinander">📖 Buch</button>
              )}
              <button type="button" className="btn-icon" onClick={() => zoomen(-1)} aria-label="Kleiner">−</button>
              <button type="button" className="btn-icon" onClick={() => zoomen(1)} aria-label="Größer">+</button>
            </>
          )}
          <a className="btn-icon pdf-extern" href={url} target="_blank" rel="noopener noreferrer"
            title="Im Leser des Browsers öffnen — dort auch drucken und speichern">↗ Im Browser</a>
        </div>
        {art === 'laedt' && <div className="pdf-hinweis">Das Buch wird aufgeschlagen …</div>}
        {art === 'eigen' && (
          <div className="pdf-buehne" ref={buehne} onTouchStart={wischStart} onTouchEnd={wischEnde}>
            <div className={'pdf-aufschlag' + (offen.length > 1 ? ' doppel' : '')}>
              {offen.map((n, i) => (
                <canvas key={i} ref={c => { leinwaende.current[i] = c; }}
                  className={'pdf-blatt' + (offen.length > 1 ? (i === 0 ? ' links' : ' rechts') : '')} />
              ))}
            </div>
          </div>
        )}
        {art === 'browser' && (
          <>
            {/* Der Leser des Browsers. Am Telefon zeigen manche Browser
                eingebettete PDFs gar nicht — dafuer steht der Knopf oben
                und hier noch einmal. */}
            <iframe className="pdf-rahmen" src={url} title={anhang.name} />
            <div className="pdf-hinweis">Wird hier nichts angezeigt?
              <a href={url} target="_blank" rel="noopener noreferrer"> Im Browser öffnen ↗</a></div>
          </>
        )}
      </div>
    </Fenster>
  );
};
