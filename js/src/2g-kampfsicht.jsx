// Heldenbuch — der Kampf, wie ihn die Runde sieht.
//
// Der Kampftracker gehoert der Spielleitung. Was hier steht, ist die
// andere Seite desselben Kampfes: die Reihenfolge, wer dran ist, wie es
// den Figuren geht. Keine Zahlen der Gegner, keine Notizen, kein
// Protokoll — und das nicht, weil diese Ansicht sie weglaesst, sondern
// weil der Server sie gar nicht erst mitschickt (api.php,
// kampfFuerSpieler). Was hier ankommt, darf hier stehen.
//
// Bei den Helden gilt weiter die Regel des Bogens: zeigt das Abenteuer
// die Trefferpunkte offen, stehen die Zahlen da; sonst der Zustand.

// Die Farbe zum Zustand — dieselbe Leiter wie im Bogen, hier ueber den
// Namen gefunden, weil vom Server nur er und ein grober Balken kommen.
const zustandFarbe = (label) =>
  (TP_ZUSTAENDE.find(z => z.label === label) || TP_ZUSTAENDE[TP_ZUSTAENDE.length - 1]).color;

const KampfSichtZeile = ({ t, dran, wartet, helden, setDefs, tpOffen, eigenerHeld, wirkungen }) => {
  const held = t.art === 'held';
  // Der Verbuendete kommt wie ein Gegner an — ohne Zahlen, mit grobem
  // Stand. Dass er auf der Seite der Gruppe steht, sagt der Server dazu.
  const verbuendet = t.lager === 'verbuendet';
  const c    = held ? (helden || []).find(h => h.id === t.charId) : null;
  const w    = c ? charWerte(c, setDefs) : null;

  // Beim Gegner kommt der Zustand fertig vom Server. Beim Helden steht er
  // im Bogen, und ob die Zahl dazu sichtbar ist, entscheidet das
  // Abenteuer — genau wie in der Heldenliste.
  // In einer Gestalt gelten ihre Trefferpunkte (beim Gegner rechnet der
  // Server sie in den groben Stand).
  const g = held && t.gestalt && t.gestalt.hpMax ? t.gestalt : null;
  const zustand = held
    ? (g ? tpZustand(g.hp, g.hpMax) : w ? tpZustand(w.hp, w.maxHp) : null)
    : {label: t.zustand || '—', balken: +t.balken || 0, color: zustandFarbe(t.zustand)};
  const anteil = held
    ? (g ? Math.max(0, Math.min(1, g.hp / Math.max(1, g.hpMax)))
         : w ? Math.max(0, Math.min(1, w.hp / Math.max(1, w.maxHp))) : 0)
    : (+t.balken || 0);
  const farbe = held && tpOffen && w
    ? (anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a')
    : (zustand ? zustand.color : 'var(--text-muted)');

  return (
    <div className={'ks-zeile' + (dran ? ' dran' : '') + (wartet ? ' wartet' : '')
                    + (held ? ' held' : verbuendet ? ' verbuendet' : ' gegner')
                    + (eigenerHeld ? ' eigen' : '')}>
      <div className="ks-ini">{t.ini === null || t.ini === undefined ? '—' : t.ini}</div>
      <div className="ks-name">
        <b>{held ? (c ? c.name : 'Held') : (t.name || 'Gegner')}</b>
        {held && c && <i>{(c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level}</i>}
        <div className="ks-marken">
          {dran && <span className="ks-dran">am Zug</span>}
          {eigenerHeld && <span className="ks-eigen">dein Held</span>}
          {verbuendet && <span className="ks-marke gut">🤝 Verbündeter</span>}
          {t.gestalt && t.gestalt.name && <span className="ks-marke gestalt">🐺 {t.gestalt.name}</span>}
          {t.vorteil  && <span className="ks-marke gut">👍 Vorteil</span>}
          {t.nachteil && <span className="ks-marke schlecht">👎 Nachteil</span>}
          {/* Beim Helden aus dem Bogen, beim Gegner aus dem Kampf. */}
          {(() => { const e = held ? (+((c || {}).erschoepfung) || 0) : (+t.erschoepfung || 0);
                    return e > 0 ? <span className="ks-marke ersch">Erschöpfung {e}</span> : null; })()}
          {(t.zustaende || []).map(z => <span className="ks-marke" key={z}>{z}</span>)}
          {/* Was die Helden halten und was auf wem liegt. Wirkungen der
              Gegner kommen gar nicht erst an — das filtert der Server. */}
          {(wirkungen || []).map(w => (
            <span key={w.id + w.rolle} className={'ks-marke wirkung' + (w.konz ? ' konz' : '')}
              title={w.rolle === 'auf' ? 'Von ' + w.von : 'Gewirkt'}>
              {w.rolle === 'von' ? (w.konz ? '◎ ' : '⏳ ') : '◉ '}{w.name}
              {w.rest != null ? ' · ' + wirkungRest(w.rest) : ''}
            </span>
          ))}
        </div>
      </div>
      <div className="ks-tp">
        {held && tpOffen && g ? (
          <span className="ks-zahl" style={{color:farbe}}>{g.hp} <i>/ {g.hpMax}</i></span>
        ) : held && tpOffen && w ? (
          <span className="ks-zahl" style={{color:farbe}}>{w.hp} <i>/ {w.maxHp}</i></span>
        ) : (
          <span className="ks-zustand" style={{color:farbe}}>{zustand ? zustand.label : '—'}</span>
        )}
        <span className="ks-balken">
          <i style={{width:((held && tpOffen ? anteil : (zustand ? zustand.balken : 0)) * 100) + '%',
                     background:farbe}} />
        </span>
      </div>
    </div>
  );
};


// ── Der Spieler sagt an ─────────────────────────────────────────
// Er waehlt aus seinem eigenen Bogen — dieselbe Auswahl, die auch die
// Spielleitung benutzt (AktionsWahl) — und tippt die Ziele an. Was
// dabei nicht vorkommt, ist eine Zahl: wie viel ankommt, weiss er
// nicht, und die Trefferpunkte der Gegner gehen ihn nichts an. Er sagt
// an, die Spielleitung traegt ein.
//
// Seit v6.5 in Schritten statt auf einer langen Seite: erst die Art der
// Handlung, dann was, dann welches, dann auf wen, dann abschicken. Jeder
// Schritt erscheint oben in der Leiste, sobald man bei ihm ankommt, und
// traegt dort, was gewaehlt ist — ein Klick darauf fuehrt zurueck.
const ANSAGE_SCHRITTE = [
  {k: 'typ',    titel: 'Handlung'},
  {k: 'art',    titel: 'Was'},
  {k: 'wahl',   titel: 'Auswahl'},
  {k: 'ziel',   titel: 'Ziel'},
  {k: 'senden', titel: 'Abschicken'},
];
const ANSAGE_TYP_TEXT = {
  aktion:   'Das Hauptding deines Zuges — Angriff, Zauber, Trank, Spurt.',
  bonus:    'Das Kleine nebenher — Zweitwaffe, Heilendes Wort, Gerissene Aktion.',
  reaktion: 'Außerhalb deines Zuges — Gelegenheitsangriff, Schild, Gegenzauber.',
};
const ANSAGE_ARTEN = [
  {k: 'angriff',    sym: '⚔',  l: 'Angriff',    wort: (n) => n + (n === 1 ? ' Waffe' : ' Waffen')},
  {k: 'zauber',     sym: '✨', l: 'Zauber',     wort: (n) => n + ' Zauber'},
  {k: 'gegenstand', sym: '🧪', l: 'Gegenstand', wort: (n) => n + ' zur Hand'},
  {k: 'merkmal',    sym: '⭐', l: 'Merkmal',    wort: (n) => n + (n === 1 ? ' Merkmal' : ' Merkmale')},
  {k: 'frei',       sym: '✍',  l: 'Nur beschreiben', wort: () => 'in eigenen Worten'},
];

// ── Der Vorrat ───────────────────────────────────────────────
// Ansagen, die man vorbereitet, solange die anderen dran sind — und mit
// einem Griff abschickt, wenn man selbst dran ist. Oder angefangen und
// liegen gelassen: dann geht es dort weiter, wo man aufgehoert hat.
// Sie liegen auf diesem Geraet, je Held, und gehen niemanden etwas an,
// bis sie abgeschickt sind.
// Gemerkt wird das Gewaehlte ueber den Namen und nicht die Stelle in der
// Liste: ein Trank weniger, und die Stelle zeigt auf etwas anderes.
const ANSAGE_VORRAT = 'hb_ansage_vorrat';
const ansageVorratLesen = () => {
  try {
    const d = JSON.parse(localStorage.getItem(ANSAGE_VORRAT) || '{}');
    return (d && typeof d === 'object' && !Array.isArray(d)) ? d : {};
  } catch { return {}; }
};
const ansageVorratSchreiben = (v) => {
  try { localStorage.setItem(ANSAGE_VORRAT, JSON.stringify(v)); } catch {}
};

const ansageZielName = (t, helden) => !t ? '' : t.art === 'held'
  ? (((helden || []).find(h => h.id === t.charId) || {}).name || 'Held')
  : (t.name || 'Gegner');

// Aus dem Entwurf wieder eine Wahl — auf dem Bogen, wie er jetzt ist.
const entwurfWahl = (held, e) => {
  const q = aktionsQuelle(held, e.art);
  const i = e.was ? q.findIndex(g => (g.name || '') === e.was) : -1;
  return {art: e.art || 'frei', i: i >= 0 ? i : null, grad: +e.grad || 0, suche: '',
          waffe: e.waffe || ''};
};

// Was hinausgeht. Aus dem Fenster und aus dem Vorrat dieselbe Rechnung;
// Ziele, die nicht mehr im Kampf stehen, fallen weg.
const ansageBauen = (held, {typ, wahl, zielIds, text, geheim}, liste, helden) => {
  const {gegenstand, grundGrad, grad, waffe} = aktionsStand(held, wahl);
  const ids = (zielIds || []).filter(id => (liste || []).some(t => t.id === id));
  return {
    typ: typ || 'aktion',
    art: wahl.art,
    was: gegenstand ? (gegenstand.name || '') : '',
    grad: (wahl.art === 'zauber' && grad > grundGrad) ? grad : 0,
    waffe: waffe ? (waffe.name || '') : '',
    // Beides: die Namen zum Lesen und die Kennungen zum Weitergeben —
    // damit im Zugfenster der Spielleitung schon angekreuzt ist, worauf
    // der Spieler zielt.
    ziele: ids.map(id => ansageZielName(liste.find(t => t.id === id), helden)),
    zielIds: ids,
    text: (text || '').trim(),
    // Auf welchem Grad wirklich gezaubert wird — daran haengt der Platz.
    stufe: (wahl.art === 'zauber' && gegenstand) ? grad : 0,
    geheim: !!geheim,
  };
};

// Ob ein Entwurf so abgehen kann: bis zum Abschicken gekommen, und was
// gewaehlt war, steht noch im Bogen.
const entwurfStand = (held, e, liste) => {
  const wahl = entwurfWahl(held, e);
  const {gegenstand, mitWaffe, waffe} = aktionsStand(held, wahl);
  const fehlt = (e.art !== 'frei' && e.was && !gegenstand) ? e.was + ' steht nicht mehr im Bogen'
    : (mitWaffe && !waffe) ? 'die Waffe dazu fehlt' : '';
  const ids = e.zielIds || [];
  const weg = ids.filter(id => !(liste || []).some(t => t.id === id)).length;
  const etwas = !!gegenstand || !!(e.text || '').trim() || ids.length - weg > 0;
  return {wahl, fehlt, weg, fertig: (+e.weit || 0) >= 4 && !fehlt && etwas};
};

// Die Liste des Vorrats: im Kampffenster mit „Abschicken“, oben im
// ersten Schritt der Ansage nur zum Weitermachen.
const AnsageVorrat = ({ held, vorrat, liste, onSenden, onWeiter, onWeg }) => (
  <div className="an-liste av-liste">
    {(vorrat || []).map(e => {
      const st = entwurfStand(held, e, liste);
      const artL = (ANSAGE_ARTEN.find(x => x.k === e.art) || {}).l || '';
      const stand = st.fehlt ? '⚠ ' + st.fehlt
        : st.fertig ? 'bereit' + (st.weg ? ' · ' + st.weg + (st.weg === 1 ? ' Ziel ist' : ' Ziele sind') + ' nicht mehr im Kampf' : '')
        : 'angefangen — weiter bei „' + ((ANSAGE_SCHRITTE[+e.schritt || 0] || {}).titel || 'Handlung') + '“';
      return (
        <div className={'an-zeile av-zeile' + (st.fertig ? ' bereit' : '') + (st.fehlt ? ' fehlt' : '')} key={e.id}>
          <span className={'an-typ ' + (e.typ || 'aktion')}>{ansageTyp(e).kurz}</span>
          <span className="an-was">
            {e.geheim ? <span title="Nur für die Spielleitung">🔒 </span> : null}
            {e.was ? <b>{(AKTION_WORT[e.art] || artL) + ': '}{e.was}
                {e.waffe ? ' mit ' + e.waffe : ''}
                {(e.art === 'zauber' && +e.grad > 0) ? ' · ' + e.grad + '. Grad' : ''}</b>
              : <b>{artL || 'Ansage'}</b>}
            {(e.zielNamen || []).length ? <span> → {e.zielNamen.join(', ')}</span> : null}
            {e.text ? <i>„{e.text}“</i> : null}
            <em className="av-stand">{stand}</em>
          </span>
          <span className="av-knoepfe">
            {onSenden && st.fertig && (
              <button type="button" className="av-senden" onClick={() => onSenden(e)}
                title="So, wie es vorbereitet ist, an die Spielleitung">📣 Abschicken</button>
            )}
            <button type="button" className="btn-icon" onClick={() => onWeiter(e)}
              title="Im Ansagefenster öffnen — dort, wo du aufgehört hast">
              {st.fertig && onSenden ? '✎' : '✎ Weiter'}</button>
            {onWeg && (
              <button type="button" className="fx-del" title="Wegwerfen"
                onClick={() => onWeg(e.id)}>✕</button>
            )}
          </span>
        </div>
      );
    })}
  </div>
);

const AnsageFenster = ({ held, kampf, helden, runde, setDefs, onAbbrechen, onSenden, onPlatz,
                         entwurf, vorrat, onParken, onLaden, onEntwurfWeg }) => {
  const waffen   = (held && held.weapons) || [];
  const sprueche = sortierteSprueche(held);
  const liste = (kampf && kampf.teilnehmer) || [];
  // Kommt das Fenster aus dem Vorrat, steht alles wieder so da, wie es
  // liegen gelassen wurde — auch der Schritt.
  const [wahl, setWahl] = React.useState(() => entwurf ? entwurfWahl(held, entwurf) : {
    art: waffen.length ? 'angriff' : (sprueche.length ? 'zauber' : 'frei'),
    i: null, grad: 0, suche: '',
  });
  const [ziele, setZiele] = React.useState(() => {
    const z = {};
    ((entwurf && entwurf.zielIds) || []).forEach(id => { if (liste.some(t => t.id === id)) z[id] = true; });
    return z;
  });
  const [text, setText]   = React.useState(entwurf ? (entwurf.text || '') : '');
  const [laeuft, setLaeuft] = React.useState(false);
  // Aktion, Bonusaktion oder Reaktion. Ein Zug ist selten eine Sache:
  // Angriff und Bonusaktion, Zauber und Trank, und dazwischen eine
  // Reaktion — also so viele Ansagen, wie man will.
  const [typ, setTyp] = React.useState(entwurf ? (entwurf.typ || 'aktion') : 'aktion');
  // Heimlich: nur die Spielleitung sieht die Ansage. Die Mitspieler
  // bekommen sie vom Server gar nicht erst.
  const [geheim, setGeheim] = React.useState(!!(entwurf && entwurf.geheim));
  // Welcher Entwurf hier gerade steht — er ist erledigt, sobald er
  // abgeschickt ist, und wird ersetzt, wenn er wieder geparkt wird.
  const [entwurfId, setEntwurfId] = React.useState(entwurf ? entwurf.id : null);
  // Was dieses Fenster schon abgeschickt hat. Der Abgleich braucht ein
  // paar Sekunden; solange steht es hier, damit die Zusammenfassung
  // sofort stimmt.
  const [eigene, setEigene] = React.useState([]);
  // Was der letzte abgeschickte Zauber den Vorrat gekostet hat.
  const [platz, setPlatz] = React.useState(null);
  // Wo man steht und wie weit man schon war. Ein Schritt, der noch nicht
  // erreicht ist, steht nicht in der Leiste — er ploppt auf, wenn man
  // ankommt.
  // Ein Entwurf, dessen Auswahl es nicht mehr gibt, faengt bei der
  // Auswahl wieder an und nicht hinter ihr.
  const startSchritt = (() => {
    if (!entwurf) return 0;
    let s = Math.max(0, Math.min(4, +entwurf.schritt || 0));
    const st = aktionsStand(held, entwurfWahl(held, entwurf));
    if (entwurf.art !== 'frei' && s > 2 && (!st.gegenstand || (st.mitWaffe && !st.waffe))) s = 2;
    if (entwurf.art === 'frei' && s === 2) s = 3;
    return s;
  })();
  const [schritt, setSchritt] = React.useState(startSchritt);
  const [weit, setWeit] = React.useState(entwurf ? Math.max(startSchritt, Math.min(4, +entwurf.weit || 0)) : 0);
  const [gesendet, setGesendet] = React.useState(false);
  const gehe = (n) => { setSchritt(n); setWeit(w => Math.max(w, n)); };

  const {gegenstand, grundGrad, grad, wurf, mitWaffe, waffe} = aktionsStand(held, wahl);
  const zielUm = (id) => setZiele(z => {
    if (z[id]) { const k = {...z}; delete k[id]; return k; }
    return {...z, [id]: true};
  });

  const zielName = (t) => ansageZielName(t, helden);

  // Angesagt ist, was der Server schon hat, plus was gerade hinausging.
  const angesagt = (() => {
    const vomServer = ((kampf && kampf.ansagen) || [])
      .filter(a => held && a.charId === held.id);
    const drin = new Set(vomServer.map(a => a.id));
    return [...vomServer, ...eigene.filter(a => !drin.has(a.id))];
  })();

  const anzahl = {angriff: waffen.length, zauber: sprueche.length,
                  gegenstand: kampfGegenstaende(held).length, merkmal: kampfMerkmale(held).length, frei: 1};
  const etwasDa = !!gegenstand || !!text.trim() || Object.keys(ziele).length > 0;
  const zielZahl = Object.keys(ziele).length;

  const senden = async () => {
    setLaeuft(true);
    const raus = await onSenden(ansageBauen(held,
      {typ, wahl, zielIds: Object.keys(ziele), text, geheim}, liste, helden));
    if (raus) setEigene(e => [...e, raus]);
    // Abgeschickt ist abgeschickt: aus dem Vorrat damit.
    if (raus && entwurfId) { if (onEntwurfWeg) onEntwurfWeg(entwurfId); setEntwurfId(null); }
    // Der Platz geht erst ab, wenn die Ansage durch ist. Wer sie nicht
    // losbekommt, soll nicht trotzdem bezahlt haben.
    if (raus && onPlatz && wahl.art === 'zauber' && gegenstand && grad > 0) {
      // Bei einer Reaktion springt der naechsthoehere Platz ein, wenn der
      // gewaehlte leer ist.
      setPlatz(onPlatz(grad, typ === 'reaktion'));
    } else if (raus) {
      setPlatz(null);
    }
    if (raus) setGesendet(true);
    setLaeuft(false);
  };
  // Die naechste Ansage: von vorn, mit leerer Auswahl. Was gewaehlt war,
  // bleibt als Art stehen — der zweite Hieb ist meistens derselbe.
  const nochEine = () => {
    setZiele({}); setText(''); setGeheim(false); setGesendet(false);
    setWahl(w => ({...w, i: null, grad: 0, suche: '', waffe: ''}));
    setSchritt(0); setWeit(0);
  };
  // Fuer spaeter: so, wie es gerade steht, in den Vorrat — und zu. Im
  // Kampffenster steht es dann zum Abschicken oder Weitermachen.
  const parken = () => {
    if (!onParken) return;
    const ids = Object.keys(ziele);
    onParken({
      id: entwurfId || ('e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      typ, art: wahl.art, was: gegenstand ? (gegenstand.name || '') : '',
      grad: (wahl.art === 'zauber' && gegenstand) ? (wahl.grad || 0) : 0,
      waffe: waffe ? (waffe.name || '') : '',
      zielIds: ids, zielNamen: ids.map(id => zielName(liste.find(x => x.id === id))),
      text, geheim, schritt, weit, runde, zeit: Date.now(),
    });
    onAbbrechen();
  };
  const andereEntwuerfe = (vorrat || []).filter(e => e.id !== entwurfId);

  // Was jeder Schritt in der Leiste traegt.
  const wertVon = (k) => k === 'typ' ? (ANSAGE_TYPEN.find(x => x.k === typ) || {}).l
    : k === 'art' ? (ANSAGE_ARTEN.find(x => x.k === wahl.art) || {}).l
    : k === 'wahl' ? (gegenstand ? gegenstand.name + (waffe ? ' mit ' + waffe.name : '')
                       + (wahl.art === 'zauber' && grad > grundGrad ? ' · ' + grad + '. Grad' : '') : '—')
    : k === 'ziel' ? (zielZahl ? Object.keys(ziele).map(id => zielName(liste.find(x => x.id === id) || {})).join(', ') : 'kein Ziel')
    : (gesendet ? 'gesendet' : '');
  // „Nur beschreiben“ braucht keine Auswahl — der Schritt faellt weg.
  const ohneWahl = wahl.art === 'frei';
  const sichtbar = ANSAGE_SCHRITTE.map((s, n) => ({...s, n}))
    .filter(s => s.n <= weit && !(ohneWahl && s.k === 'wahl'));
  const weiter = () => gehe(schritt === 1 && ohneWahl ? 3 : schritt + 1);
  const zurueck = () => setSchritt(s => (s === 3 && ohneWahl) ? 1 : Math.max(0, s - 1));

  return (
    <Fenster onClick={onAbbrechen}>
      <div className="zug-fenster ansage-schritte" onClick={e=>e.stopPropagation()}>
        <div className="zug-kopf">
          <span className="zug-titel">✍ {held ? held.name : 'Ansage'}</span>
          <span className="zug-wer">Runde {runde} · was hast du vor?</span>
        </div>
        <div className="schritt-leiste" role="tablist" aria-label="Schritte der Ansage">
          {sichtbar.map((s, idx) => (
            <button type="button" key={s.k} role="tab" data-schritt={s.k}
              aria-selected={s.n === schritt}
              className={'schritt' + (s.n === schritt ? ' an' : '') + (s.n < schritt || gesendet ? ' fertig' : '')}
              onClick={() => !gesendet && setSchritt(s.n)} disabled={gesendet && s.k !== 'senden'}>
              <span className="schritt-zahl">{idx + 1}</span>
              <span className="schritt-text">
                <b>{s.titel}</b>
                {s.n !== schritt || s.k === 'senden' ? <i>{wertVon(s.k)}</i> : null}
              </span>
            </button>
          ))}
        </div>

        <div className="zug-leib" key={schritt}>
          {/* 1 — welche Handlung. Oben, was schon draußen ist: sonst sagt
              man dieselbe Sache zweimal an oder vergisst die Bonusaktion. */}
          {schritt === 0 && (<>
            {andereEntwuerfe.length > 0 && onLaden && (
              <div className="zug-block">
                <div className="zug-label">📥 Vorbereitet — antippen, um weiterzumachen</div>
                <AnsageVorrat held={held} vorrat={andereEntwuerfe} liste={liste}
                  onWeiter={onLaden} onWeg={onEntwurfWeg} />
              </div>
            )}
            {angesagt.length > 0 && (
              <div className="zug-block">
                <div className="zug-label">Schon angesagt</div>
                <AnsageListe angesagt={angesagt} />
              </div>
            )}
            <div className="zug-block">
              <div className="zug-label">Welche Handlung</div>
              <div className="schritt-kacheln drei">
                {ANSAGE_TYPEN.map(x => (
                  <button type="button" key={x.k}
                    className={'schritt-kachel typ-' + x.k + (typ === x.k ? ' an' : '')}
                    onClick={() => { setTyp(x.k); gehe(1); }}>
                    <span className={'an-typ ' + x.k}>{x.kurz}</span>
                    <b>{x.l}</b>
                    <i>{ANSAGE_TYP_TEXT[x.k]}</i>
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {/* 2 — was: Angriff, Zauber, Gegenstand, Merkmal, frei. */}
          {schritt === 1 && (
            <div className="zug-block">
              <div className="zug-label">Was tust du — als {(ANSAGE_TYPEN.find(x => x.k === typ) || {}).l}</div>
              <div className="schritt-kacheln">
                {ANSAGE_ARTEN.map(x => (
                  <button type="button" key={x.k} disabled={!anzahl[x.k]}
                    className={'schritt-kachel' + (x.k === 'frei' ? ' schmal' : '') + (wahl.art === x.k ? ' an' : '')}
                    onClick={() => {
                      if (wahl.art !== x.k) setWahl({...wahl, art: x.k, i: null, grad: 0, suche: ''});
                      gehe(x.k === 'frei' ? 3 : 2);
                    }}>
                    <span className="schritt-sym">{x.sym}</span>
                    <b>{x.l}</b>
                    <i>{anzahl[x.k] ? x.wort(anzahl[x.k])
                        : x.k === 'gegenstand' ? 'nichts für den Kampf markiert' : 'nichts im Bogen'}</i>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3 — welches: die Karten wie im Bogen. */}
          {schritt === 2 && (
            <AktionsWahl held={held} wahl={wahl} setWahl={setWahl} wer="du"
              setDefs={setDefs} teil="liste" typ={typ} />
          )}

          {/* 4 — auf wen. */}
          {schritt === 3 && (() => {
            const w = (aktionsStand(held, wahl).wirkung) || {};
            const heilt = w.art === 'heilung' || w.art === 'temp'
              || /heil|segn|schutz|schild/i.test((gegenstand && gegenstand.name) || '');
            const gruppen = [
              {k: 'feind', titel: 'Gegner', leute: liste.filter(t => t.art !== 'held')},
              {k: 'freund', titel: 'Verbündete', leute: liste.filter(t => t.art === 'held')},
            ].filter(g => g.leute.length);
            if (heilt) gruppen.reverse();
            return (
              <div className="zug-block">
                <div className="zug-label">Auf wen — antippen, mehrere gehen</div>
                {gruppen.map(g => (
                  <div className="ziel-gruppe" key={g.k}>
                    <div className="ziel-gruppe-titel">{g.titel}</div>
                    <div className="zug-ziele frei">
                      {g.leute.map(t => (
                        <button type="button" key={t.id}
                          className={'zug-ziel' + (ziele[t.id] ? ' an' : '') + (t.art === 'held' ? ' held' : '')}
                          onClick={()=>zielUm(t.id)}>
                          <span className="zug-ziel-kopf"><b>{zielName(t)}</b></span>
                          <span className="zug-ziel-tp">
                            {t.art === 'held' ? (t.charId === (held || {}).id ? 'du' : 'Held') : (t.zustand || '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* 5 — abschicken. */}
          {schritt === 4 && !gesendet && (<>
            <div className="zug-block">
              <div className="zug-label">Beschreibung — was du tust (freiwillig)</div>
              <textarea className="zug-frei" value={text} onChange={e=>setText(e.target.value)}
                maxLength={500} aria-label="Beschreibung deiner Aktion" autoFocus={ohneWahl}
                placeholder="Ich springe hinter den Karren und schleudere Feuer über die Lichtung." />
            </div>
            <label className="zug-lauf-an an-geheim">
              <input type="checkbox" checked={geheim} onChange={e=>setGeheim(e.target.checked)} />
              <span>🔒 Nur für die Spielleitung — die anderen sehen diese Ansage nicht</span>
            </label>
            <div className="zug-block">
              <div className="zug-label">Das geht so an die Spielleitung</div>
              <div className="zug-vorschau">
                <div className="pr-zeile zug">▸ {held ? held.name : 'Du'} sagt an · {(ANSAGE_TYPEN.find(x => x.k === typ) || {}).l}</div>
                {gegenstand && (
                  <div className="pr-zeile">   {AKTION_WORT[wahl.art] || 'Angriff'}: {gegenstand.name}
                    {waffe ? ' mit ' + waffe.name : ''}
                    {wahl.art === 'zauber' && grad > grundGrad ? ' · ' + grad + '. Grad' : ''}
                    {wurf ? ' (' + wurf + ')' : ''}</div>
                )}
                {zielZahl > 0 && (
                  <div className="pr-zeile">   auf {Object.keys(ziele)
                    .map(id => zielName(liste.find(x => x.id === id) || {})).join(', ')}</div>
                )}
                {text.trim() && <div className="pr-zeile frei">   „{text.trim()}“</div>}
                {!etwasDa && <i>Wähle etwas aus oder schreib einen Satz.</i>}
              </div>
            </div>
          </>)}

          {schritt === 4 && gesendet && (<>
            <div className="ansage-gesendet">
              <span className="ansage-haken">✓</span>
              <span>An die Spielleitung gegangen. Noch eine — eine Bonusaktion, eine Reaktion?</span>
            </div>
            <div className="zug-block">
              <div className="zug-label">Schon angesagt</div>
              <AnsageListe angesagt={angesagt} />
            </div>
            {/* Was der Vorrat dazu gesagt hat. */}
            {platz && (
              <div className={'zug-platz' + (platz.gestrichen ? '' : ' leer')}>
                {platz.gestrichen
                  ? (platz.statt ? '◈ Der ' + platz.statt + '. Grad war leer — Platz vom '
                      + platz.grad + '. Grad gestrichen, noch ' + platz.frei + '.'
                    : '◈ Zauberplatz gestrichen — noch ' + platz.frei
                      + ' vom ' + platz.grad + '. Grad.')
                  : platz.hat
                    ? '◈ Kein Platz vom ' + platz.grad + '. Grad mehr frei — nichts gestrichen.'
                    : '◈ Für den ' + platz.grad + '. Grad steht im Bogen kein Platz.'}
              </div>
            )}
          </>)}
        </div>

        <div className="zug-fuss">
          {schritt > 0 && !gesendet && (
            <button className="btn-icon" onClick={zurueck}>← Zurück</button>
          )}
          <span className="zug-hinweis">
            {gesendet ? (angesagt.length + (angesagt.length === 1 ? ' Ansage steht' : ' Ansagen stehen'))
              : schritt === 2 && !gegenstand ? 'Tipp an, was du nimmst.'
              : schritt === 2 && mitWaffe && !waffe ? 'Wähle die Waffe dazu.'
              : schritt === 3 ? (zielZahl ? zielZahl + (zielZahl === 1 ? ' Ziel' : ' Ziele') : 'Ohne Ziel geht auch.')
              : schritt === 4 ? 'Wie viel ankommt, trägt die Spielleitung ein.'
              : 'Schritt ' + (sichtbar.findIndex(s => s.n === schritt) + 1) + ' von ' + (ohneWahl ? 4 : 5)}
          </span>
          {onParken && !gesendet && weit > 0 && (
            <button className="btn-icon an-parken" onClick={parken}
              title="In den Vorrat legen — im Kampffenster abschicken, wenn du dran bist, oder hier weitermachen">
              📥 Für später</button>
          )}
          <button className="btn-cancel" onClick={onAbbrechen}>
            {angesagt.length > 0 ? 'Fertig' : 'Abbrechen'}
          </button>
          {gesendet ? (
            <button className="btn-save" onClick={nochEine}>📣 Noch eine Ansage</button>
          ) : schritt === 4 ? (
            <button className="btn-save" disabled={!etwasDa || laeuft} onClick={senden}>
              {laeuft ? 'Wird gesendet…' : '📣 An die Spielleitung'}
            </button>
          ) : (schritt === 2 || schritt === 3) ? (
            <button className="btn-save" disabled={schritt === 2 && (!gegenstand || (mitWaffe && !waffe))} onClick={weiter}>
              {schritt === 3 && !zielZahl ? 'Ohne Ziel weiter →' : 'Weiter →'}
            </button>
          ) : null}
        </div>
      </div>
    </Fenster>
  );
};

// Was schon angesagt ist — oben im ersten Schritt und nach dem Senden.
const AnsageListe = ({ angesagt }) => (
  <div className="an-liste">
    {angesagt.map(a => (
      <div className="an-zeile" key={a.id}>
        <span className={'an-typ ' + ((a.typ) || 'aktion')}>{ansageTyp(a).kurz}</span>
        <span className="an-was">
          {a.geheim ? <span title="Nur für die Spielleitung">🔒 </span> : null}
          {a.was ? <b>{a.was}{a.waffe ? ' mit ' + a.waffe : ''}{a.grad ? ' · ' + a.grad + '. Grad' : ''}</b> : null}
          {(a.ziele || []).length ? <span> → {(a.ziele || []).join(', ')}</span> : null}
          {a.text ? <i>„{a.text}“</i> : null}
        </span>
      </div>
    ))}
  </div>
);

// Wie die Taverne: ein Fenster, das ueber der Anwendung liegt, aber
// keine Klicks wegnimmt. Wer waehrend des Kampfes in seinem Bogen
// nachsehen will, tippt einfach dorthin — der Kampf bleibt offen und
// bleibt stehen, wo man ihn hingeschoben hat.
const KS_SPEICHER = 'hb_kampfsicht_fenster';
const KS_BREITE = 460;
// Das Schieben selbst steht in 0-basis.jsx: drei Fenster im Kampf
// wollen dasselbe, und dreimal dasselbe waere dreimal zu pflegen.

// ── Reaktionen ───────────────────────────────────────────────
// Eine Reaktion kommt zwischendurch: der Gegner zaubert, und irgendwer
// wirft einen Gegenzauber dagegen. Bis hierher hiess das: Fenster
// aufmachen, auf „Reaktion" stellen, den Zauber suchen, abschicken —
// vier Griffe fuer etwas, das in einer Sekunde entschieden wird.
//
// Was eine Reaktion ist, steht im Zauber selbst: die Wirkzeit sagt es.
// Damit taucht jeder Gegenzauber und jedes Silberdornen von allein hier
// auf, sobald es im Buch steht, und niemand muss eine Liste pflegen.
const IST_REAKTION = /reaktion/i;
const reaktionsSprueche = (held) => ((held && held.spells) || [])
  .filter(s => IST_REAKTION.test(s.castingTime || '') && s.prepared !== false);

const KampfSicht = ({ kampf, helden, eigeneIds, setDefs, tpOffen, onAnsage,
                      eigenerHeld, onReaktion, onSchliessen,
                      vorrat, onVorratSenden, onVorratWeiter, onVorratWeg }) => {
  const {pos, griff, masz} = useSchiebefenster(KS_SPEICHER,
    {x: Math.max(16, (window.innerWidth || 1200) - KS_BREITE - 32), y: 76}, KS_BREITE);
  // Die Karte steht in einem eigenen Fenster daneben. Sie ist beim
  // Ansagen die erste Frage, aber nicht immer — und ein Raster, das die
  // Reihe aus dem Fenster schiebt, hilft niemandem.
  const [karteAuf, setKarteAuf] = useEingeklappt('hb_kampfsicht_karte_auf', false);

  if (!kampf) return null;
  const liste = kampf.teilnehmer || [];
  // Solange nur aufgestellt wird, ist niemand am Zug — und wer dazwischen
  // handelt, steht hier genauso wie am Tisch: er ist der, der gerade
  // handelt, und der unterbrochene wartet.
  const vorb = kampf.phase === 'vorbereitung';
  const dranIdx = vorb ? -1 : Math.max(0, Math.min(liste.length - 1, +kampf.zug || 0));
  const zwIdx = (!vorb && kampf.zwischen)
    ? liste.findIndex(t => t.id === kampf.zwischen) : -1;
  const aktivIdx = zwIdx >= 0 ? zwIdx : dranIdx;
  const namensZug = (t) => !t ? ''
    : (t.art === 'held'
        ? ((helden || []).find(h => h.id === t.charId) || {}).name || 'Held'
        : (t.name || 'Gegner'));
  const dranName = namensZug(liste[dranIdx]);
  const zwName = zwIdx >= 0 ? namensZug(liste[zwIdx]) : '';

  return (
   <>
    {/* Die Breite steht nicht mehr fest: der Leib laesst sich ziehen,
        und das Fenster folgt ihm. */}
    <div className="ks-fenster" style={{left: pos.x, top: pos.y}} {...masz}>
        <div className="ks-kopf" {...griff} title="Zum Verschieben ziehen">
          <span className="ks-titel">⚔ {kampf.name || 'Kampf'}</span>
          <span className="ks-runde"><span>Runde</span><b>{kampf.runde || 1}</b></span>
          <span className="ks-dran-kopf">
            {zwName ? <>⚡ Dazwischen: <b>{zwName}</b></>
              : dranName ? <>Am Zug: <b>{dranName}</b></> : 'Niemand am Zug'}
          </span>
          {kampf.karte && (
            <button className={'ks-kartenknopf' + (karteAuf ? ' an' : '')}
              onClick={()=>setKarteAuf(a => !a)}
              title={karteAuf ? 'Die Karte zuklappen'
                              : 'Wer wo steht — in einem eigenen Fenster'}>
              🗺 Karte
            </button>
          )}
          <MiniKnopf className="kampf-kopf-mini" />
          <button className="kampf-kopf-x" onClick={onSchliessen}
            title="Schließen — der Kampf läuft weiter" aria-label="Schließen">✕</button>
        </div>

        {/* Reihe, Reaktionen und Ansagen rollen zusammen. Kopf und Fuss
            bleiben stehen: am Kopf wird geschoben, und im Fuss steht der
            Knopf zum Ansagen. Wer das Fenster klein zieht, soll rollen
            muessen — nicht raten, ob unten noch etwas steht. */}
        <div className="ks-mitte">
        <div className="ks-liste">
          {liste.length === 0
            ? <div className="ks-leer">Noch steht niemand in der Reihe.</div>
            : liste.map((t, i) => (
                <KampfSichtZeile key={t.id || i} t={t} dran={i === aktivIdx}
                  wartet={zwIdx >= 0 && i === dranIdx}
                  helden={helden} setDefs={setDefs} tpOffen={tpOffen}
                  eigenerHeld={t.art === 'held' && (eigeneIds || []).includes(t.charId)}
                  wirkungen={laufendAn(kampf.laufend, t.id, kampf.runde)} />
              ))}
        </div>

        {/* Der schnelle Weg dazwischen. Steht immer da, nicht nur wenn
            man am Zug ist — genau das ist der Sinn einer Reaktion. */}
        {onReaktion && reaktionsSprueche(eigenerHeld).length > 0 && (
          <div className="ks-reaktion">
            <div className="ks-reaktion-titel">⚡ Reaktion</div>
            <div className="ks-reaktion-tasten">
              {reaktionsSprueche(eigenerHeld).map(s => (
                <button className="ks-reaktion-knopf" key={s.id}
                  title={s.name + (s.level ? ' · ' + s.level + '. Grad' : ' · Zaubertrick')}
                  onClick={()=>onReaktion(s)}>
                  {s.name}
                  {s.level ? <i>{s.level}</i> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        {(kampf.ansagen || []).length > 0 && (
          <div className="ks-ansagen">
            <div className="ks-ansagen-titel">📣 Angesagt</div>
            {(kampf.ansagen || []).slice(-6).map(a => (
              <div className="ks-ansage" key={a.id}>
                <span className={'an-typ ' + ((a.typ) || 'aktion')}>{ansageTyp(a).kurz}</span>
                <b>{a.geheim ? '🔒 ' : ''}{((helden || []).find(h => h.id === a.charId) || {}).name || 'Jemand'}</b>
                {a.was ? <span>{' · ' + (AKTION_WORT[a.art] || 'Angriff') + ': '}{a.was}
                  {a.waffe ? ' mit ' + a.waffe : ''}
                  {a.grad ? ' · ' + a.grad + '. Grad' : ''}</span> : null}
                {(a.ziele || []).length ? <span> → {(a.ziele || []).join(', ')}</span> : null}
                {a.text ? <i>„{a.text}“</i> : null}
              </div>
            ))}
          </div>
        )}

          {/* Der Satz steht im rollenden Teil und nicht im Fuss: er wird
              einmal gelesen und danach nie wieder, und in einem schmalen
              Fenster bricht er auf vier Zeilen um — die haetten der Reihe
              den Platz genommen. */}
          <div className="ks-erklaerung">
            Was die Spielleitung notiert, steht hier nicht — und die Trefferpunkte der
            Gegner bleiben ihre Sache. Was du hier siehst, siehst du auch am Tisch.
          </div>
        </div>

        {onAnsage ? (
          <div className="ks-fuss">
            {/* Der Vorrat steht im Fuss, nicht im rollenden Teil: wer dran
                ist, soll nicht erst suchen muessen, was er vorbereitet hat. */}
            {(vorrat || []).length > 0 && (() => {
              const a = liste[aktivIdx];
              const duDran = !!(a && a.art === 'held' && eigenerHeld && a.charId === eigenerHeld.id);
              return (
                <div className={'ks-vorrat' + (duDran ? ' dran' : '')}>
                  <div className="ks-ansagen-titel">📥 Vorbereitet{duDran ? ' — du bist dran' : ''}</div>
                  <AnsageVorrat held={eigenerHeld} vorrat={vorrat} liste={liste}
                    onSenden={onVorratSenden} onWeiter={onVorratWeiter} onWeg={onVorratWeg} />
                </div>
              );
            })()}
            <button className="ks-ansage-knopf" onClick={onAnsage}>
              {(vorrat || []).length ? '✍ Neue Ansage' : '✍ Ansagen, was du tust'}</button>
          </div>
        ) : null}

    </div>

    {/* Die Karte in einem eigenen Fenster: schiebbar, einklappbar, und
        mit einer Ansicht, die sich groesser stellen laesst. Am Tisch
        schaut man abwechselnd auf die Reihe und auf das Feld — beides
        soll nebeneinander stehen koennen. Sie steht neben dem Fenster
        der Reihe und nicht darin: das schneidet ab, was ueber seinen
        Rand hinausragt. */}
    {karteAuf && kampf.karte && (
      <Schiebefenster schluessel="hb_kampfsicht_karte"
        standard={{x: 24, y: 120}}
        titel="🗺 Die Karte"
        onSchliessen={()=>setKarteAuf(false)}>
        <KarteSchau karte={kampf.karte} wer={Object.fromEntries(liste.map(t =>
          [t.id, {name: namensZug(t), art: t.art}]))} />
      </Schiebefenster>
    )}
   </>
  );
};
