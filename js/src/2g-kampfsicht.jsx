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

const KampfSichtZeile = ({ t, dran, helden, setDefs, tpOffen, eigenerHeld }) => {
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
    <div className={'ks-zeile' + (dran ? ' dran' : '') + (held ? ' held' : ' gegner')
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

const KampfSicht = ({ kampf, helden, eigeneIds, setDefs, tpOffen, onSchliessen }) => {
  if (!kampf) return null;
  const liste = kampf.teilnehmer || [];
  const dranIdx = Math.max(0, Math.min(liste.length - 1, +kampf.zug || 0));
  const dran = liste[dranIdx] || null;
  const dranName = dran
    ? (dran.art === 'held'
        ? ((helden || []).find(h => h.id === dran.charId) || {}).name || 'Held'
        : (dran.name || 'Gegner'))
    : '';

  return (
    <div className="form-overlay" onClick={onSchliessen}>
      <div className="ks-fenster" onClick={e=>e.stopPropagation()}>
        <div className="ks-kopf">
          <span className="ks-titel">⚔ {kampf.name || 'Kampf'}</span>
          <span className="ks-runde"><span>Runde</span><b>{kampf.runde || 1}</b></span>
          <span className="ks-dran-kopf">{dranName ? <>Am Zug: <b>{dranName}</b></> : 'Niemand am Zug'}</span>
          <button className="kampf-kopf-x" onClick={onSchliessen}
            title="Schließen — der Kampf läuft weiter" aria-label="Schließen">✕</button>
        </div>

        <div className="ks-liste">
          {liste.length === 0
            ? <div className="ks-leer">Noch steht niemand in der Reihe.</div>
            : liste.map((t, i) => (
                <KampfSichtZeile key={t.id || i} t={t} dran={i === dranIdx}
                  helden={helden} setDefs={setDefs} tpOffen={tpOffen}
                  eigenerHeld={t.art === 'held' && (eigeneIds || []).includes(t.charId)} />
              ))}
        </div>

        <div className="ks-fuss">
          Was die Spielleitung notiert, steht hier nicht — und die Trefferpunkte der Gegner
          bleiben ihre Sache. Was du hier siehst, siehst du auch am Tisch.
        </div>
      </div>
    </div>
  );
};
