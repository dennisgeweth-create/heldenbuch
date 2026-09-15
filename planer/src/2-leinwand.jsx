// ── Die Kartenleinwand ───────────────────────────────────────────
// Zeigt die Kachelpyramide einer Karte: ziehen zum Verschieben, Mausrad
// oder zwei Finger zum Zoomen, dazu Orte, Lineal und Maßstabsleiste.
// Die Rechnung dahinter steht in 1b-kacheln.jsx.
//
// Ein Klick (ohne Ziehen) meldet den Bildpunkt nach oben — was er
// bedeutet, entscheidet das Werkzeug in der Seite.

const LEINWAND_KLICK_PX = 5;

const KartenLeinwand = ({ karte, orte, dm, werkzeug, ortWahl, linie, fokus, gedaechtnis,
                          routen, gruppen, routeWahl, reiseWahl, onRouteWahl, onReiseWahl,
                          regionen, regionWahl, onRegionWahl,
                          nebel, nebelDeckend, vorgabeAnsicht, onAnsicht,
                          figuren, figurWahl, onFigurWahl, onFigurVerschieben, hex, questOrte,
                          heldengruppen, gruppeWahl, onGruppeWahl, onGruppeZiehen,
                          onKlick, onOrtWahl, onOrtVerschieben, onBildWaehlen }) => {
  const box = useRef(null);
  const [g, setG] = useState({ breite: 0, hoehe: 0 });
  const [a, setA] = useState(null);
  const [zieh, setZieh] = useState(null);           // {id, x, y} beim Verschieben eines Orts
  const zeiger = useRef({ punkte: new Map(), weg: 0, start: null });
  const bild = karte.bild || null;
  const plan = useMemo(() => bild ? kachelPlan(bild.breite, bild.hoehe, bild.kachel) : null,
    [bild && bild.breite, bild && bild.hoehe, bild && bild.kachel]);
  const schluessel = karte.id + '|' + (bild ? bild.ordner : '');

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const messen = () => setG({ breite: el.clientWidth, hoehe: el.clientHeight });
    messen();
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Beim Wechsel der Karte: dort weiter, wo man zuletzt war, sonst
  // das ganze Bild.
  useEffect(() => {
    if (!plan || !g.breite) { setA(null); return; }
    const alt = gedaechtnis && gedaechtnis.current[schluessel];
    setA(alt ? ansichtBegrenzen(alt, plan, g) : ansichtEinpassen(plan, g));
  }, [schluessel, !!plan, g.breite > 0]);
  useEffect(() => { if (a && gedaechtnis) gedaechtnis.current[schluessel] = a; }, [a]);
  useEffect(() => { if (a && plan && g.breite) setA(v => v && ansichtBegrenzen(v, plan, g)); }, [g.breite, g.hoehe]);

  // Das Tischfenster bekommt den Ausschnitt der Spielleitung: dieselbe
  // Mitte und dieselbe Breite in Bildpixeln, gleich wie gross sein Schirm ist.
  useEffect(() => {
    const v = vorgabeAnsicht;
    if (!v || !plan || !g.breite || (v.karteId && v.karteId !== karte.id)) return;
    const zoom = plan.maxZ + Math.log2(Math.max(1e-6, g.breite / Math.max(1, v.breite || plan.breite)));
    setA(ansichtBegrenzen({ zoom, x: v.x, y: v.y }, plan, g));
  }, [vorgabeAnsicht && vorgabeAnsicht.n, !!plan, g.breite]);
  useEffect(() => {
    if (!onAnsicht || !a || !plan || !g.breite) return;
    onAnsicht({ x: Math.round(a.x), y: Math.round(a.y), breite: Math.round(g.breite / ansichtMass(a, plan)) });
  }, [a && a.x, a && a.y, a && a.zoom, g.breite]);

  // Ein Ort aus der Liste: dorthin, und nah genug heran.
  useEffect(() => {
    if (!fokus || !plan || !g.breite) return;
    setA(v => ansichtBegrenzen({ zoom: Math.max(v ? v.zoom : 0, plan.maxZ - 1), x: fokus.x, y: fokus.y }, plan, g));
  }, [fokus && fokus.n]);

  // Das Mausrad braucht einen Zuhoerer, der preventDefault darf.
  useEffect(() => {
    const el = box.current;
    if (!el || !plan) return;
    const rad = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
      const schritt = -e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022);
      setA(v => v && zoomUm(v, pt, v.zoom + Math.max(-1, Math.min(1, schritt)), g, plan));
    };
    el.addEventListener('wheel', rad, { passive: false });
    return () => el.removeEventListener('wheel', rad);
  }, [plan, g.breite, g.hoehe]);

  const punktAus = (e) => {
    const r = box.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const runter = (e) => {
    if (!plan || !a) return;
    if (e.button !== undefined && e.button > 0) return;
    // Knoepfe auf der Karte bekommen ihren Klick selbst.
    if (e.target.closest && e.target.closest('button, .pl-route-treffer')) return;
    try { box.current.setPointerCapture(e.pointerId); } catch (err) { /* ohne Fangen geht es auch */ }
    const pt = punktAus(e);
    zeiger.current.punkte.set(e.pointerId, pt);
    if (zeiger.current.punkte.size === 1) { zeiger.current.weg = 0; zeiger.current.start = pt; }
  };
  const bewegen = (e) => {
    const z = zeiger.current;
    if (!z.punkte.has(e.pointerId) || !plan) return;
    const pt = punktAus(e);
    const vorher = z.punkte.get(e.pointerId);
    if (z.punkte.size === 1) {
      z.weg += Math.hypot(pt.x - vorher.x, pt.y - vorher.y);
      z.punkte.set(e.pointerId, pt);
      if (z.weg > LEINWAND_KLICK_PX) setA(v => v && verschieben(v, pt.x - vorher.x, pt.y - vorher.y, plan, g));
      return;
    }
    // Zwei Finger: der Abstand zoomt, die Mitte verschiebt.
    const [idA, idB] = [...z.punkte.keys()];
    const altA = z.punkte.get(idA), altB = z.punkte.get(idB);
    z.punkte.set(e.pointerId, pt);
    const neuA = z.punkte.get(idA), neuB = z.punkte.get(idB);
    const dAlt = Math.hypot(altB.x - altA.x, altB.y - altA.y), dNeu = Math.hypot(neuB.x - neuA.x, neuB.y - neuA.y);
    const mAlt = { x: (altA.x + altB.x) / 2, y: (altA.y + altB.y) / 2 }, mNeu = { x: (neuA.x + neuB.x) / 2, y: (neuA.y + neuB.y) / 2 };
    z.weg = LEINWAND_KLICK_PX + 1;
    if (dAlt > 0 && dNeu > 0) {
      setA(v => {
        if (!v) return v;
        const gezoomt = zoomUm(v, mAlt, v.zoom + Math.log2(dNeu / dAlt), g, plan);
        return verschieben(gezoomt, mNeu.x - mAlt.x, mNeu.y - mAlt.y, plan, g);
      });
    }
  };
  const hoch = (e) => {
    const z = zeiger.current;
    if (!z.punkte.has(e.pointerId)) return;
    const einzeln = z.punkte.size === 1;
    z.punkte.delete(e.pointerId);
    if (einzeln && z.weg <= LEINWAND_KLICK_PX && e.type === 'pointerup' && a && plan) {
      const p = schirmZuBild(punktAus(e), a, g, plan);
      if (p.x >= 0 && p.y >= 0 && p.x <= plan.breite && p.y <= plan.hoehe) onKlick && onKlick({ x: Math.round(p.x), y: Math.round(p.y) }, ansichtMass(a, plan));
    }
  };

  // Orte ziehen: nur die Spielleitung, nur mit dem Werkzeug „Ansehen“.
  const ortRunter = (e, o) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button > 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ohne Fangen geht es auch */ }
    const pt = punktAus(e);
    setZieh({ id: o.id, start: pt, weg: 0, x: o.x, y: o.y, darf: dm && werkzeug === 'ansehen' });
  };
  const ortBewegen = (e) => {
    if (!zieh || !zieh.darf) return;
    const pt = punktAus(e);
    const p = schirmZuBild(pt, a, g, plan);
    setZieh(v => v && ({ ...v, weg: Math.max(v.weg, Math.hypot(pt.x - v.start.x, pt.y - v.start.y)),
      x: Math.round(Math.max(0, Math.min(plan.breite, p.x))), y: Math.round(Math.max(0, Math.min(plan.hoehe, p.y))) }));
  };
  const ortHoch = (e, o) => {
    e.stopPropagation();
    const z = zieh;
    setZieh(null);
    if (!z) return;
    if (o.art === 'gruppe') {
      if (z.darf && z.weg > LEINWAND_KLICK_PX) onGruppeZiehen && onGruppeZiehen(o, { x: z.x, y: z.y });
      else onGruppeWahl && onGruppeWahl(o.id);
      return;
    }
    if (o.art === 'figur') {
      if (z.darf && z.weg > LEINWAND_KLICK_PX) onFigurVerschieben && onFigurVerschieben(o, { x: z.x, y: z.y });
      else onFigurWahl && onFigurWahl(o.id);
      return;
    }
    if (z.darf && z.weg > LEINWAND_KLICK_PX) onOrtVerschieben && onOrtVerschieben(o, { x: z.x, y: z.y });
    else onOrtWahl && onOrtWahl(o.id);
  };

  const knopfZoom = (d) => setA(v => v && plan && zoomUm(v, { x: g.breite / 2, y: g.hoehe / 2 }, v.zoom + d, g, plan));

  let inhalt = null;
  if (!bild) {
    inhalt = (
      <div className="pl-leinwand-text">
        <strong>{dm ? 'Noch kein Kartenbild' : 'Diese Karte hat noch kein Bild'}</strong>
        {dm ? <>
          <span>PNG, JPEG oder WebP, auch sehr große Karten. Das Bild wird hier im Browser in Kacheln geschnitten.</span>
          <button className="pl-knopf pl-haupt" onClick={onBildWaehlen}>🖼 Kartenbild wählen</button>
        </> : <span>Die Spielleitung hat noch keins hinterlegt.</span>}
      </div>
    );
  } else if (a && plan && g.breite) {
    const z = stufeFuer(a.zoom, plan);
    const hinten = Math.max(0, z - 2);
    const url = (t) => planerDateiUrl(karte.ablage, kachelPfad(bild.ordner, t.z, t.x, t.y, bild.endung));
    const kacheln = (hinten < z ? sichtbareKacheln(a, g, plan, hinten) : []).concat(sichtbareKacheln(a, g, plan, z));
    const schirm = (p) => bildZuSchirm(p, a, g, plan);
    const leiste = massstabLeiste(karte.massstab, a, plan, 110);
    inhalt = (
      <>
        <div className="pl-kacheln" aria-hidden="true">
          {kacheln.map(t => (
            <img key={t.z + '/' + t.x + '/' + t.y} src={url(t)} alt="" draggable={false}
              className={t.z < z ? 'hinten' : ''}
              style={{ left: t.links, top: t.oben, width: t.breite + 0.6, height: t.hoehe + 0.6 }} />
          ))}
        </div>
        {nebel && nebel.an && (() => {
          const s = ansichtMass(a, plan);
          const maskeId = 'nebel-' + karte.id;
          return (
            <svg className={'pl-nebel' + (nebelDeckend ? ' deckend' : '')} width={g.breite} height={g.hoehe} aria-hidden="true">
              <defs>
                <filter id={maskeId + '-weich'} x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation={nebelDeckend ? 10 : 4} />
                </filter>
                <mask id={maskeId} maskUnits="userSpaceOnUse" x="0" y="0" width={g.breite} height={g.hoehe}>
                  <rect x="0" y="0" width={g.breite} height={g.hoehe} fill="white" />
                  <g filter={'url(#' + maskeId + '-weich)'}>
                    {nebel.flaechen.map((f, i) => {
                      if (f.art === 'alles') return <rect key={i} x="0" y="0" width={g.breite} height={g.hoehe} fill="black" />;
                      if (f.art === 'kreis') { const m = schirm(f); return <circle key={i} cx={m.x} cy={m.y} r={f.r * s} fill="black" />; }
                      if (f.art === 'vieleck') return <polygon key={i} points={(f.punkte || []).map(q => { const m = schirm(q); return m.x + ',' + m.y; }).join(' ')} fill="black" />;
                      return null;
                    })}
                  </g>
                </mask>
              </defs>
              <rect className="pl-nebel-flaeche" x="0" y="0" width={g.breite} height={g.hoehe} mask={'url(#' + maskeId + ')'} />
            </svg>
          );
        })()}
        {hex && hex.an && karte.massstab && (() => {
          const s = ansichtMass(a, plan);
          const r = hexRadiusPx(hex.groesse || 10, karte.massstab);
          if (r * s < 6) return null;
          const ol = schirmZuBild({ x: 0, y: 0 }, a, g, plan), ur = schirmZuBild({ x: g.breite, y: g.hoehe }, a, g, plan);
          const felder = hexeIm(ol.x, ol.y, ur.x, ur.y, r, 2500);
          const beschriften = r * s > 34;
          return (
            <svg className="pl-hex" width={g.breite} height={g.hoehe} aria-hidden="true">
              {felder.map(f => {
                const m = hexMitte(f, r);
                const pts = hexEcken(m, r).map(q => { const p2 = schirm(q); return p2.x + ',' + p2.y; }).join(' ');
                const sm = schirm(m);
                return (
                  <g key={f.q + ':' + f.r}>
                    <polygon points={pts} />
                    {beschriften && <text x={sm.x} y={sm.y - r * s * 0.55}>{hexAdresse(f)}</text>}
                  </g>
                );
              })}
            </svg>
          );
        })()}
        <svg className="pl-ueberlage" width={g.breite} height={g.hoehe}>
          {(regionen || []).map(r => {
            const ps = (r.punkte || []).map(schirm);
            if (ps.length < 3) return null;
            return (
              <polygon key={r.id} points={ps.map(s => s.x + ',' + s.y).join(' ')}
                className={'pl-region' + (r.id === regionWahl ? ' aktiv' : '') + (dm && !r.sichtbar ? ' verborgen' : '')}
                style={{ fill: r.farbe || REGION_FARBEN[0], stroke: r.farbe || REGION_FARBEN[0] }} />
            );
          })}
          {(routen || []).map(r => {
            const ps = (r.punkte || []).map(schirm);
            if (ps.length < 2) return null;
            const zug = ps.map(s => s.x + ',' + s.y).join(' ');
            return (
              <g key={r.id} className={'pl-route' + (r.id === routeWahl ? ' aktiv' : '') + (dm && !r.sichtbar ? ' verborgen' : '')}>
                <polyline points={zug} className="pl-route-grund" />
                {ps.slice(1).map((s, i) => (
                  <line key={i} x1={ps[i].x} y1={ps[i].y} x2={s.x} y2={s.y} className="pl-route-strich"
                    style={{ stroke: gelaende(((r.gelaende || [])[i]) || r.standard || 'offen').farbe }} />
                ))}
                <polyline points={zug} className="pl-route-treffer" onClick={() => onRouteWahl && onRouteWahl(r.id)}>
                  <title>{r.name}</title>
                </polyline>
              </g>
            );
          })}
          {(heldengruppen || []).filter(hg => (hg.spur || []).length > 1).map(hg => {
            const ps = hg.spur.map(schirm);
            return (
              <g key={'spur-' + hg.id} className={'pl-spur' + (hg.id === gruppeWahl ? ' aktiv' : '')}>
                <polyline points={ps.map(q => q.x + ',' + q.y).join(' ')} />
                {ps.map((q, i) => i > 0 && i < ps.length - 1 && hg.spur[i].art !== 'reise'
                  ? <circle key={i} cx={q.x} cy={q.y} r={3}><title>{zeitText(hg.spur[i].zeit)}</title></circle> : null)}
              </g>
            );
          })}
          {linie && linie.punkte.length > 0 && (
            <g aria-hidden="true">
              <polyline points={linie.punkte.map(p => { const s = schirm(p); return s.x + ',' + s.y; }).join(' ')}
                className={'pl-linie ' + (linie.art || '')} />
              {linie.punkte.map((p, i) => { const s = schirm(p); return <circle key={i} cx={s.x} cy={s.y} r={4.5} className={'pl-linie-punkt ' + (linie.art || '')} />; })}
            </g>
          )}
        </svg>
        {(regionen || []).filter(r => (r.punkte || []).length >= 3).map(r => {
          const s = schirm(polygonMitte(r.punkte));
          if (s.x < -80 || s.y < -40 || s.x > g.breite + 80 || s.y > g.hoehe + 40) return null;
          return (
            <button key={r.id} className={'pl-region-name' + (r.id === regionWahl ? ' aktiv' : '') + (dm && !r.sichtbar ? ' verborgen' : '')}
              style={{ left: s.x, top: s.y, borderColor: r.farbe || REGION_FARBEN[0] }} onClick={() => onRegionWahl && onRegionWahl(r.id)}>
              ⬡ {r.name}
            </button>
          );
        })}
        {(gruppen || []).filter(gr => gr.punkt).map(gr => {
          const s = schirm(gr.punkt);
          return (
            <button key={gr.id} className={'pl-gruppe' + (gr.id === reiseWahl ? ' aktiv' : '') + (dm && !gr.sichtbar ? ' verborgen' : '')}
              style={{ left: s.x, top: s.y }} title={gr.name} onClick={() => onReiseWahl && onReiseWahl(gr.id)}>
              <span aria-hidden="true">🧭</span><span className="pl-ort-name">{gr.name}</span>
            </button>
          );
        })}
        {orte.map(o => {
          const gezogen = zieh && zieh.id === o.id ? zieh : null;
          const s = schirm(gezogen ? gezogen : o);
          if (s.x < -60 || s.y < -60 || s.x > g.breite + 60 || s.y > g.hoehe + 60) return null;
          return (
            <button key={o.id}
              className={'pl-ort' + (o.id === ortWahl ? ' aktiv' : '') + (dm && !o.sichtbar ? ' verborgen' : '') + (gezogen ? ' gezogen' : '')}
              style={{ left: s.x, top: s.y }}
              title={o.name}
              onPointerDown={(e) => ortRunter(e, o)} onPointerMove={ortBewegen} onPointerUp={(e) => ortHoch(e, o)}
              onPointerCancel={() => setZieh(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOrtWahl && onOrtWahl(o.id); } }}>
              <span className="pl-ort-symbol" aria-hidden="true">{o.symbol || '📍'}</span>
              <span className="pl-ort-name">{o.name}</span>
              {questOrte && questOrte.has(o.id) && <span className="pl-quest-abzeichen" title="Hier gibt es eine Quest">❗</span>}
            </button>
          );
        })}
        {(heldengruppen || []).filter(hg => (hg.spur || []).length).map(hg => {
          const jetzt = hg.spur[hg.spur.length - 1];
          const gezogen = zieh && zieh.id === hg.id ? zieh : null;
          const s = schirm(gezogen ? gezogen : jetzt);
          if (s.x < -60 || s.y < -60 || s.x > g.breite + 60 || s.y > g.hoehe + 60) return null;
          return (
            <button key={hg.id}
              className={'pl-heldengruppe' + (hg.id === gruppeWahl ? ' aktiv' : '') + (dm && !hg.sichtbar ? ' verborgen' : '')}
              style={{ left: s.x, top: s.y }} title={hg.name + ' — ' + zeitText(jetzt.zeit)}
              onPointerDown={(e) => ortRunter(e, { ...hg, x: jetzt.x, y: jetzt.y })} onPointerMove={ortBewegen}
              onPointerUp={(e) => ortHoch(e, hg)} onPointerCancel={() => setZieh(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGruppeWahl && onGruppeWahl(hg.id); } }}>
              <span aria-hidden="true">{hg.symbol || '🛡'}</span><span className="pl-ort-name">{hg.name}</span>
              <span className="pl-gruppe-zahl">{(hg.helden || []).length}</span>
            </button>
          );
        })}
        {(figuren || []).filter(f => f.punkt).map(f => {
          const gezogen = zieh && zieh.id === f.id ? zieh : null;
          const s = schirm(gezogen ? gezogen : f.punkt);
          if (s.x < -60 || s.y < -60 || s.x > g.breite + 60 || s.y > g.hoehe + 60) return null;
          return (
            <button key={f.id}
              className={'pl-figur' + (f.id === figurWahl ? ' aktiv' : '') + (dm && !f.sichtbar ? ' verborgen' : '') + (f.punkt.unterwegs ? ' unterwegs' : '')}
              style={{ left: s.x, top: s.y }} title={f.name}
              onPointerDown={(e) => ortRunter(e, { ...f, x: f.punkt.x, y: f.punkt.y })} onPointerMove={ortBewegen}
              onPointerUp={(e) => ortHoch(e, f)} onPointerCancel={() => setZieh(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFigurWahl && onFigurWahl(f.id); } }}>
              <span aria-hidden="true">{f.symbol || '🧍'}</span><span className="pl-ort-name">{f.name}</span>
            </button>
          );
        })}
        {leiste && (
          <div className="pl-massstab-leiste" aria-label={'Maßstab: ' + leiste.text}>
            <div style={{ width: leiste.px }} />
            <span>{leiste.text}</span>
          </div>
        )}
        <div className="pl-zoom">
          <button className="pl-symbol" aria-label="Näher heran" title="Näher heran" onClick={() => knopfZoom(0.5)}>＋</button>
          <button className="pl-symbol" aria-label="Weiter weg" title="Weiter weg" onClick={() => knopfZoom(-0.5)}>−</button>
          <button className="pl-symbol" aria-label="Ganze Karte" title="Ganze Karte" onClick={() => setA(ansichtEinpassen(plan, g))}>⤢</button>
        </div>
      </>
    );
  }

  return (
    <div ref={box} className={'pl-leinwand-karte werkzeug-' + (werkzeug || 'ansehen') + (bild ? '' : ' leer')}
      data-stufe={a && plan ? stufeFuer(a.zoom, plan) : ''}
      onPointerDown={runter} onPointerMove={bewegen} onPointerUp={hoch} onPointerCancel={hoch}>
      {!bild && <div className="pl-leinwand-raster" aria-hidden="true" />}
      {inhalt}
    </div>
  );
};
