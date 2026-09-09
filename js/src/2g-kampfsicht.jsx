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

const KampfSichtZeile = ({ t, dran, wartet, helden, setDefs, tpOffen, eigenerHeld }) => {
  const held = t.art === 'held';
  const c    = held ? (helden || []).find(h => h.id === t.charId) : null;
  const w    = c ? charWerte(c, setDefs) : null;

  // Beim Gegner kommt der Zustand fertig vom Server. Beim Helden steht er
  // im Bogen, und ob die Zahl dazu sichtbar ist, entscheidet das
  // Abenteuer — genau wie in der Heldenliste.
  const zustand = held
    ? (w ? tpZustand(w.hp, w.maxHp) : null)
    : {label: t.zustand || '—', balken: +t.balken || 0, color: zustandFarbe(t.zustand)};
  const anteil = held
    ? (w ? Math.max(0, Math.min(1, w.hp / Math.max(1, w.maxHp))) : 0)
    : (+t.balken || 0);
  const farbe = held && tpOffen && w
    ? (anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a')
    : (zustand ? zustand.color : 'var(--text-muted)');

  return (
    <div className={'ks-zeile' + (dran ? ' dran' : '') + (wartet ? ' wartet' : '')
                    + (held ? ' held' : ' gegner')
                    + (eigenerHeld ? ' eigen' : '')}>
      <div className="ks-ini">{t.ini === null || t.ini === undefined ? '—' : t.ini}</div>
      <div className="ks-name">
        <b>{held ? (c ? c.name : 'Held') : (t.name || 'Gegner')}</b>
        {held && c && <i>{(c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level}</i>}
        <div className="ks-marken">
          {dran && <span className="ks-dran">am Zug</span>}
          {eigenerHeld && <span className="ks-eigen">dein Held</span>}
          {t.vorteil  && <span className="ks-marke gut">👍 Vorteil</span>}
          {t.nachteil && <span className="ks-marke schlecht">👎 Nachteil</span>}
          {(t.erschoepfung || 0) > 0 && <span className="ks-marke ersch">Erschöpfung {t.erschoepfung}</span>}
          {(t.zustaende || []).map(z => <span className="ks-marke" key={z}>{z}</span>)}
        </div>
      </div>
      <div className="ks-tp">
        {held && tpOffen && w ? (
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
const AnsageFenster = ({ held, kampf, helden, runde, onAbbrechen, onSenden, onPlatz }) => {
  const waffen   = (held && held.weapons) || [];
  const sprueche = sortierteSprueche(held);
  const [wahl, setWahl] = React.useState({
    art: waffen.length ? 'angriff' : (sprueche.length ? 'zauber' : 'frei'),
    i: null, grad: 0, suche: '',
  });
  const [ziele, setZiele] = React.useState({});
  const [text, setText]   = React.useState('');
  const [laeuft, setLaeuft] = React.useState(false);
  // Aktion, Bonusaktion oder Reaktion. Ein Zug ist selten eine Sache:
  // Angriff und Bonusaktion, Zauber und Trank, und dazwischen eine
  // Reaktion. Wer alles in einen Satz schreibt, macht der Spielleitung
  // Arbeit — also drei Knöpfe und so viele Ansagen, wie man will.
  const [typ, setTyp] = React.useState('aktion');
  // Was dieses Fenster schon abgeschickt hat. Der Abgleich braucht ein
  // paar Sekunden; solange steht es hier, damit die Zusammenfassung
  // sofort stimmt.
  const [eigene, setEigene] = React.useState([]);
  // Was der letzte abgeschickte Zauber den Vorrat gekostet hat. Steht
  // einen Augenblick da, damit man es merkt — und damit man es merkt,
  // wenn nichts mehr da war.
  const [platz, setPlatz] = React.useState(null);

  const {gegenstand, grundGrad, grad, wurf} = aktionsStand(held, wahl);
  const liste = (kampf && kampf.teilnehmer) || [];
  const zielUm = (id) => setZiele(z => {
    if (z[id]) { const k = {...z}; delete k[id]; return k; }
    return {...z, [id]: true};
  });

  const zielName = (t) => t.art === 'held'
    ? (((helden || []).find(h => h.id === t.charId) || {}).name || 'Held')
    : (t.name || 'Gegner');

  // Angesagt ist, was der Server schon hat, plus was gerade hinausging.
  const angesagt = (() => {
    const vomServer = ((kampf && kampf.ansagen) || [])
      .filter(a => held && a.charId === held.id);
    const drin = new Set(vomServer.map(a => a.id));
    return [...vomServer, ...eigene.filter(a => !drin.has(a.id))];
  })();

  const etwasDa = !!gegenstand || !!text.trim() || Object.keys(ziele).length > 0;
  const senden = async () => {
    setLaeuft(true);
    const raus = await onSenden({
      typ,
      art: wahl.art,
      was: gegenstand ? (gegenstand.name || '') : '',
      grad: (wahl.art === 'zauber' && grad > grundGrad) ? grad : 0,
      // Beides: die Namen zum Lesen und die Kennungen zum Weitergeben —
      // damit im Zugfenster der Spielleitung schon angekreuzt ist, worauf
      // der Spieler zielt.
      ziele: Object.keys(ziele).map(id => zielName(liste.find(x => x.id === id) || {})),
      zielIds: Object.keys(ziele),
      text: text.trim(),
      // Auf welchem Grad wirklich gezaubert wird. „grad" oben steht nur
      // beim Hochzaubern da; hier steht er immer, denn daran haengt der
      // Platz.
      stufe: (wahl.art === 'zauber' && gegenstand) ? grad : 0,
    });
    // Das Fenster bleibt offen: die nächste Ansage kommt meistens
    // gleich hinterher. Was gewählt war, bleibt stehen — der zweite
    // Hieb ist derselbe —, Ziele und Beschreibung werden frei.
    if (raus) setEigene(e => [...e, raus]);
    // Der Platz geht erst ab, wenn die Ansage durch ist. Wer sie nicht
    // losbekommt, soll nicht trotzdem bezahlt haben.
    if (raus && onPlatz && wahl.art === 'zauber' && gegenstand && grad > 0) {
      setPlatz(onPlatz(grad));
    } else if (raus) {
      setPlatz(null);
    }
    setZiele({}); setText('');
    setLaeuft(false);
  };

  return (
    <Fenster onClick={onAbbrechen}>
      <div className="zug-fenster" onClick={e=>e.stopPropagation()}>
        <div className="zug-kopf">
          <span className="zug-titel">✍ {held ? held.name : 'Ansage'}</span>
          <span className="zug-wer">Runde {runde} · was hast du vor?</span>
        </div>

        <div className="zug-leib">
          {/* Oben steht, was schon draußen ist — sonst sagt man dieselbe
              Sache zweimal an oder vergisst die Bonusaktion. */}
          {angesagt.length > 0 && (
            <div className="zug-block">
              <div className="zug-label">Schon angesagt</div>
              <div className="an-liste">
                {angesagt.map(a => (
                  <div className="an-zeile" key={a.id}>
                    <span className={'an-typ ' + ((a.typ) || 'aktion')}>{ansageTyp(a).kurz}</span>
                    <span className="an-was">
                      {a.was ? <b>{a.was}{a.grad ? ' · ' + a.grad + '. Grad' : ''}</b> : null}
                      {(a.ziele || []).length ? <span> → {(a.ziele || []).join(', ')}</span> : null}
                      {a.text ? <i>„{a.text}“</i> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="zug-block">
            <div className="zug-label">Was davon</div>
            <div className="an-typen">
              {ANSAGE_TYPEN.map(x => (
                <button type="button" key={x.k}
                  className={'bj-taste' + (typ === x.k ? ' haupt' : '')}
                  onClick={()=>setTyp(x.k)}>{x.l}</button>
              ))}
            </div>
          </div>

          <AktionsWahl held={held} wahl={wahl} setWahl={setWahl} wer="du" />

          <div className="zug-block">
            <div className="zug-label">Auf wen</div>
            <div className="zug-ziele">
              {liste.map(t => (
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

          <div className="zug-block">
            <div className="zug-label">Beschreibung — was du tust</div>
            <textarea className="zug-frei" value={text} onChange={e=>setText(e.target.value)}
              maxLength={500} aria-label="Beschreibung deiner Aktion"
              placeholder="Ich springe hinter den Karren und schleudere Feuer über die Lichtung." />
          </div>

          <div className="zug-block">
            <div className="zug-label">Das geht so an die Spielleitung</div>
            <div className="zug-vorschau">
              <div className="pr-zeile zug">▸ {held ? held.name : 'Du'} sagt an</div>
              {gegenstand && (
                <div className="pr-zeile">   {wahl.art === 'zauber' ? 'Zauber' : 'Angriff'}: {gegenstand.name}
                  {wahl.art === 'zauber' && grad > grundGrad ? ' · ' + grad + '. Grad' : ''}
                  {wurf ? ' (' + wurf + ')' : ''}</div>
              )}
              {Object.keys(ziele).length > 0 && (
                <div className="pr-zeile">   auf {Object.keys(ziele)
                  .map(id => zielName(liste.find(x => x.id === id) || {})).join(', ')}</div>
              )}
              {text.trim() && <div className="pr-zeile frei">   „{text.trim()}“</div>}
              {!etwasDa && <i>Wähle etwas aus oder schreib einen Satz.</i>}
            </div>
          </div>

          {/* Was der Vorrat dazu gesagt hat. */}
          {platz && (
            <div className={'zug-platz' + (platz.gestrichen ? '' : ' leer')}>
              {platz.gestrichen
                ? '◈ Zauberplatz gestrichen — noch ' + platz.frei
                  + ' vom ' + platz.grad + '. Grad.'
                : platz.hat
                  ? '◈ Kein Platz vom ' + platz.grad + '. Grad mehr frei — nichts gestrichen.'
                  : '◈ Für den ' + platz.grad + '. Grad steht im Bogen kein Platz.'}
            </div>
          )}
        </div>

        <div className="zug-fuss">
          <span className="zug-hinweis">
            {angesagt.length > 0
              ? angesagt.length + (angesagt.length === 1 ? ' Ansage steht' : ' Ansagen stehen')
                + ' — noch eine geht.'
              : 'Wie viel ankommt, trägt die Spielleitung ein.'}
          </span>
          <button className="btn-cancel" onClick={onAbbrechen}>
            {angesagt.length > 0 ? 'Fertig' : 'Abbrechen'}
          </button>
          <button className="btn-save" disabled={!etwasDa || laeuft} onClick={senden}>
            {laeuft ? 'Wird gesendet…'
              : angesagt.length > 0 ? '📣 Noch eine' : '📣 An die Spielleitung'}
          </button>
        </div>
      </div>
    </Fenster>
  );
};

// Wie die Taverne: ein Fenster, das ueber der Anwendung liegt, aber
// keine Klicks wegnimmt. Wer waehrend des Kampfes in seinem Bogen
// nachsehen will, tippt einfach dorthin — der Kampf bleibt offen und
// bleibt stehen, wo man ihn hingeschoben hat.
const KS_SPEICHER = 'hb_kampfsicht_fenster';
const KS_BREITE = 460;
const ksLesen = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KS_SPEICHER) || 'null');
    if (d && Number.isFinite(+d.x)) return {x: +d.x, y: +d.y};
  } catch {}
  return null;
};
const ksSchreiben = (pos) => {
  try { localStorage.setItem(KS_SPEICHER, JSON.stringify(pos)); } catch {}
};
// Immer so viel stehen lassen, dass man den Kopf noch zu fassen bekommt.
const ksKlemmen = (pos) => ({
  x: Math.max(-KS_BREITE + 140, Math.min(pos.x, (window.innerWidth || 1200) - 140)),
  y: Math.max(0, Math.min(pos.y, (window.innerHeight || 800) - 60)),
});

const KampfSicht = ({ kampf, helden, eigeneIds, setDefs, tpOffen, onAnsage, onSchliessen }) => {
  const [pos, setPos] = React.useState(() => ksLesen()
    || ksKlemmen({x: Math.max(16, (window.innerWidth || 1200) - KS_BREITE - 32), y: 76}));
  const zug = React.useRef(null);
  const zugStart = (e) => {
    if (e.target.closest('button')) return;       // der Schliessknopf schiebt nicht
    zug.current = {dx: e.clientX - pos.x, dy: e.clientY - pos.y};
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const zugBewegen = (e) => {
    if (!zug.current) return;
    setPos(ksKlemmen({x: e.clientX - zug.current.dx, y: e.clientY - zug.current.dy}));
  };
  const zugEnde = () => { if (zug.current) { zug.current = null; ksSchreiben(pos); } };

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
    <div className="ks-fenster" style={{left: pos.x, top: pos.y, width: KS_BREITE}}>
        <div className="ks-kopf" onPointerDown={zugStart} onPointerMove={zugBewegen}
          onPointerUp={zugEnde} onPointerCancel={zugEnde} title="Zum Verschieben ziehen">
          <span className="ks-titel">⚔ {kampf.name || 'Kampf'}</span>
          <span className="ks-runde"><span>Runde</span><b>{kampf.runde || 1}</b></span>
          <span className="ks-dran-kopf">
            {zwName ? <>⚡ Dazwischen: <b>{zwName}</b></>
              : dranName ? <>Am Zug: <b>{dranName}</b></> : 'Niemand am Zug'}
          </span>
          <button className="kampf-kopf-x" onClick={onSchliessen}
            title="Schließen — der Kampf läuft weiter" aria-label="Schließen">✕</button>
        </div>

        <div className="ks-liste">
          {liste.length === 0
            ? <div className="ks-leer">Noch steht niemand in der Reihe.</div>
            : liste.map((t, i) => (
                <KampfSichtZeile key={t.id || i} t={t} dran={i === aktivIdx}
                  wartet={zwIdx >= 0 && i === dranIdx}
                  helden={helden} setDefs={setDefs} tpOffen={tpOffen}
                  eigenerHeld={t.art === 'held' && (eigeneIds || []).includes(t.charId)} />
              ))}
        </div>

        {(kampf.ansagen || []).length > 0 && (
          <div className="ks-ansagen">
            <div className="ks-ansagen-titel">📣 Angesagt</div>
            {(kampf.ansagen || []).slice(-6).map(a => (
              <div className="ks-ansage" key={a.id}>
                <span className={'an-typ ' + ((a.typ) || 'aktion')}>{ansageTyp(a).kurz}</span>
                <b>{((helden || []).find(h => h.id === a.charId) || {}).name || 'Jemand'}</b>
                {a.was ? <span>{a.art === 'zauber' ? ' zaubert ' : ' greift an mit '}{a.was}
                  {a.grad ? ' · ' + a.grad + '. Grad' : ''}</span> : null}
                {(a.ziele || []).length ? <span> → {(a.ziele || []).join(', ')}</span> : null}
                {a.text ? <i>„{a.text}“</i> : null}
              </div>
            ))}
          </div>
        )}

        <div className="ks-fuss">
          {onAnsage ? (
            <button className="ks-ansage-knopf" onClick={onAnsage}>✍ Ansagen, was du tust</button>
          ) : null}
          <span>Was die Spielleitung notiert, steht hier nicht — und die Trefferpunkte der
            Gegner bleiben ihre Sache. Was du hier siehst, siehst du auch am Tisch.</span>
        </div>
    </div>
  );
};
