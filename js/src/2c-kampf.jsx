// Heldenbuch — der Kampf.
//
// Die Initiativliste aus Gegnern einer Begegnung und den Helden des
// offenen Abenteuers. Anders als im alten Kampftracker uebersteht sie ein
// Neuladen: der Stand liegt im Geraet, nicht nur im Arbeitsspeicher.
//
// Aufbau und Bedienung folgen dem alten Tracker, weil er sich am Tisch
// bewaehrt hat: Helden und Gegnersammlung links, Initiativkarten rechts,
// je Karte ein Notizfeld und ein Tastenblock mit den kleinen Schritten
// direkt und den grossen im Fenster.
//
// Der wichtige Unterschied zum alten: die Trefferpunkte der Helden liegen
// nicht im Kampf, sondern im Bogen. Was hier eingetragen wird, steht dort
// sofort — es gibt kein Uebertragen am Ende und damit auch keinen Kampf,
// der mit einem Klick daneben verlorengeht.

const w20 = () => Math.floor(Math.random()*20) + 1;

// "11d8+33" auswuerfeln. Ohne brauchbare Angabe bleibt es beim Mittelwert
// aus der Vorlage — besser eine Zahl als keine.
const wuerfelTP = (vorlage) => {
  const m = String(vorlage.hpDice||'').match(/(\d+)\s*[dw]\s*(\d+)\s*(?:\+\s*(\d+))?/i);
  if (!m) return +vorlage.hpMax || 1;
  const [, anzahl, seiten, bonus] = m.map(Number);
  let summe = bonus || 0;
  for (let i = 0; i < anzahl; i++) summe += Math.floor(Math.random()*seiten) + 1;
  return Math.max(1, summe);
};

// Ein Gegner aus seiner Vorlage. Steht hier einzeln, weil ihn auch die
// Gegnerliste in der Seitenspalte braucht — dort kommt einer nach dem
// anderen dazu, mitten im laufenden Kampf.
const gegnerAusVorlage = (vorlage, name) => {
  const tp = wuerfelTP(vorlage);
  return {
    id: vorlage.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6),
    art: 'gegner', vorlageId: vorlage.id,
    name: name || vorlage.name,
    ac: +vorlage.ac || 10, hpMax: tp, hp: tp, tempHp: 0,
    ini: w20() + mod(+vorlage.dex || 10), dex: +vorlage.dex || 10,
    zustaende: [], erschoepfung: 0, notiz: '', bild: vorlage.image || null,
  };
};

// Ein Nothelfer: der Waechter, der im Abenteuerbuch mit einem Satz
// abgehandelt ist, oder der Wolf, den sich jemand gerade ausgedacht hat.
// Drei Angaben genuegen — alles Weitere steht im Kopf der Spielleitung
// und braucht keinen Eintrag in der Sammlung.
const nothelferAnlegen = (name, tp, ac) => {
  const hp = Math.max(1, Math.round(+tp || 1));
  return {
    id: 'not-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6),
    art: 'gegner', vorlageId: null, nothelfer: true,
    name: (name || '').trim() || 'Gegner',
    ac: Math.max(1, Math.round(+ac || 10)),
    hpMax: hp, hp, tempHp: 0,
    ini: w20(), dex: 10,
    zustaende: [], erschoepfung: 0, notiz: '', bild: null,
  };
};

// Die Gegner einer Begegnung, ausgewuerfelt und durchnummeriert. Steht
// einzeln, weil eine Begegnung auch in einen schon laufenden Kampf
// nachgeladen werden kann.
const gegnerAusBegegnung = (begegnung, enemies) => {
  const teilnehmer = [];
  ((begegnung && begegnung.enemies) || []).forEach(({enemyId, count, name}) => {
    const vorlage = enemies.find(e => e.id === enemyId);
    if (!vorlage) return;                       // geloescht — still ueberspringen
    const anzahl = Math.max(1, +count || 1);
    for (let i = 0; i < anzahl; i++) {
      teilnehmer.push(gegnerAusVorlage(vorlage,
        anzahl > 1 ? (name || vorlage.name) + ' ' + (i+1) : (name || vorlage.name)));
    }
  });
  return teilnehmer;
};

// ── Kampf aufstellen ─────────────────────────────────────────────
const kampfAufstellen = (begegnung, enemies, helden, setDefs) => {
  const teilnehmer = gegnerAusBegegnung(begegnung, enemies);

  // Vom Helden bleibt im Kampf nur, was zum Kampf gehoert: Initiative,
  // Zustaende, Erschoepfung. Trefferpunkte und Notiz stehen ausserhalb —
  // die einen im Bogen, die andere in der DM-Bibliothek.
  helden.forEach(h => {
    teilnehmer.push({
      id: 'held-' + h.id, art: 'held', charId: h.id,
      // Die Initiative der Helden wuerfeln die Spieler selbst — hier bleibt
      // das Feld leer, bis jemand die Zahl ansagt.
      ini: null, zustaende: [], erschoepfung: 0,
      vorteil: false, nachteil: false,
    });
  });

  return {
    aktiv: true, name: begegnung.name || 'Kampf', runde: 1, zug: 0,
    teilnehmer: sortiereNachIni(teilnehmer),
    log: [{art: 'start', r: 1, wer: begegnung.name || 'Kampf'}],
  };
};

// Ohne Initiative ganz nach unten: solange die Spieler ihre Zahl nicht
// angesagt haben, steht die Reihenfolge noch nicht fest.
const sortiereNachIni = (liste) => [...liste].sort((a,b) => {
  const av = a.ini === null ? -999 : a.ini, bv = b.ini === null ? -999 : b.ini;
  return bv - av || mod(b.dex||10) - mod(a.dex||10) || (a.name||'').localeCompare(b.name||'','de');
});

// ── Das Protokoll ────────────────────────────────────────────────
// Es liegt im Kampf selbst und endet mit ihm — wie die Initiative. Kein
// Server, keine Tabelle: was hier steht, ist die Mitschrift dieses einen
// Abends und gehoert niemand anderem.
//
// Gespeichert wird, was passiert ist, nicht der fertige Satz. Erst beim
// Anzeigen wird daraus Text — und nur so laesst sich derselbe Verlauf
// einmal mit und einmal ohne Trefferpunktstaende ausgeben.
//
// Was die Anwendung nicht weiss, steht auch nicht drin: wer den Schaden
// ausgeteilt hat. Sie kennt nur, wer ihn bekommt und wer gerade am Zug
// ist. Die Verbindung stellt der Leser her, so wie am Tisch auch.
const protokollZeile = (e, mitZahlen) => {
  const stand = (mitZahlen && e.von !== undefined && e.auf !== undefined)
    ? ' · ' + e.von + ' → ' + e.auf : '';
  switch (e.art) {
    case 'start':    return '⚔ ' + e.wer + ' beginnt';
    case 'runde':    return '';                       // wird als Ueberschrift gesetzt
    case 'zug':      return '▸ ' + e.wer + ' ist am Zug';
    case 'schaden':  return '   ' + e.wer + ' nimmt ' + e.wert + ' Schaden' + stand;
    case 'heilung':  return '   ' + e.wer + ' wird um ' + e.wert + ' geheilt' + stand;
    case 'temp':     return '   ' + e.wer + ': ' + (e.wert >= 0 ? '+' : '') + e.wert + ' temporäre Trefferpunkte';
    case 'maxtemp':  return '   ' + e.wer + ': ' + (e.wert >= 0 ? '+' : '') + e.wert + ' temporäres Maximum';
    case 'maxhp':    return '   ' + e.wer + ': Maximum ' + (e.wert >= 0 ? '+' : '') + e.wert;
    case 'nieder':   return '   ' + e.wer + ' ist kampfunfähig';
    case 'auf':      return '   ' + e.wer + ' ist wieder auf den Beinen' + (mitZahlen ? ' · ' + e.auf : '');
    case 'zustand':  return '   ' + e.wer + (e.an ? ' ist ' : ' ist nicht mehr ') + e.was;
    case 'marke':    return '   ' + e.wer + (e.an ? ' hat ' + e.was
                                                    : ' hat keinen ' + e.was + ' mehr');
    case 'ersch':    return '   ' + e.wer + ': Erschöpfung ' + e.wert;
    case 'todes':    return '   ' + e.wer + ': Todesrettungswürfe ' + e.erfolge + '✓ ' + e.fehler + '✗'
                            + (e.lage === 'stabil' ? ' — stabilisiert' : e.lage === 'tot' ? ' — tot' : '');
    case 'dazu':     return '   + ' + e.wer + (mitZahlen && e.hp !== undefined ? ' (' + e.hp + ' TP, RK ' + e.ac + ')' : '');
    case 'weg':      return '   − ' + e.wer + ' verlässt den Kampf';
    default:         return '   ' + (e.wer || '');
  }
};

// Der ganze Verlauf als Text, wie er in die Zwischenablage geht.
const protokollText = (kampf, mitZahlen) => {
  const zeilen = [];
  zeilen.push('⚔ ' + (kampf.name || 'Kampf'));
  zeilen.push(new Date().toLocaleString('de-DE'));
  zeilen.push('');
  let runde = null;
  (kampf.log || []).forEach(e => {
    if (e.r !== runde) {
      runde = e.r;
      if (zeilen.length > 3) zeilen.push('');
      zeilen.push('── Runde ' + runde + ' ──────────────────────');
    }
    const z = protokollZeile(e, mitZahlen);
    if (z) zeilen.push(z);
  });
  if ((kampf.log || []).length === 0) zeilen.push('(noch nichts geschehen)');
  return zeilen.join('\n');
};

// ── Todesrettungswuerfe ──────────────────────────────────────────
// Bei 0 Trefferpunkten wird gewuerfelt: drei Erfolge stabilisieren, drei
// Fehlschlaege toeten. Die Punkte stehen im Bogen, nicht im Kampf — wer
// draussen vor der Tuer verblutet, tut das auch nach einem Neuladen.
const TODES_LEER = {erfolge: 0, fehler: 0};
const todesStand = (d) => {
  const s = d || TODES_LEER;
  if ((s.erfolge||0) >= 3) return 'stabil';
  if ((s.fehler||0)  >= 3) return 'tot';
  return 'offen';
};

const TodesWuerfe = ({ stand, onSetzen }) => {
  const s = stand || TODES_LEER;
  const lage = todesStand(s);
  const Reihe = ({ feld, wert, label, klasse }) => (
    <div className="td-reihe">
      <span className="td-label">{label}</span>
      {[1,2,3].map(i => (
        <button key={i} type="button"
          className={'td-pip ' + klasse + (wert >= i ? ' an' : '')}
          aria-label={label + ' ' + i} aria-pressed={wert >= i}
          onClick={()=>onSetzen({...s, [feld]: wert === i ? i-1 : i})}>
          {wert >= i ? (klasse === 'gut' ? '✓' : '✕') : '○'}
        </button>
      ))}
    </div>
  );
  return (
    <div className={'kampf-todes' + (lage !== 'offen' ? ' ' + lage : '')}>
      <div className="td-titel">
        {lage === 'stabil' ? '☘ Stabilisiert' : lage === 'tot' ? '☠ Tot' : '☠ Todesrettungswürfe'}
      </div>
      <Reihe feld="erfolge" wert={s.erfolge||0} label="Erfolg"  klasse="gut" />
      <Reihe feld="fehler"  wert={s.fehler ||0} label="Fehler"  klasse="schlecht" />
      <button type="button" className="td-reset" onClick={()=>onSetzen({erfolge:0, fehler:0})}>↺ Zurücksetzen</button>
    </div>
  );
};

// ── Zahlenfenster ────────────────────────────────────────────────
// Die kleinen Schritte liegen auf der Karte, alles Groessere hier: sechs
// Sprungtasten in beide Richtungen und ein Feld fuer die krumme Zahl.
// Zwei Richtungen auch beim Schaden — man vertippt sich, und dann will man
// zurueck, ohne den Kopf zu verdrehen.
const WERT_MODI = {
  schaden:  {titel: 'Schaden',  vorzeichen: -1, farbe: 'dmg',  beides: true},
  heilung:  {titel: 'Heilung',  vorzeichen: +1, farbe: 'heal', beides: true},
  temp:     {titel: 'Temp HP',  vorzeichen: +1, farbe: 'temp', beides: false},
  maxtemp:  {titel: 'Temp. max. TP', vorzeichen: +1, farbe: 'max', beides: false},
  maxhp:    {titel: 'Max. TP',  vorzeichen: +1, farbe: 'max', beides: false},
};
const SPRUENGE = [1, 2, 5, 10, 20, 50];

const WertDialog = ({ modus, name, start, onAnwenden, onAbbrechen }) => {
  const cfg = WERT_MODI[modus] || WERT_MODI.schaden;
  const [wert, setWert] = React.useState(+start || 0);
  const stufe = (n) => setWert(w => w + n);

  return (
    <div className="form-overlay" onClick={onAbbrechen}>
      <div className={'wert-fenster ' + cfg.farbe} onClick={e=>e.stopPropagation()}>
        <div className="wert-titel">{cfg.titel} — {name}</div>
        <div className="wert-strich" />

        <div className="wert-label">{cfg.titel} {cfg.vorzeichen < 0 ? '−' : '+'}</div>
        <div className="wert-reihe">
          {SPRUENGE.map(n => (
            <button key={n} type="button"
              className={'wert-sprung ' + (cfg.vorzeichen < 0 ? 'minus' : 'plus')}
              onClick={()=>stufe(n)}>{(cfg.vorzeichen < 0 ? '−' : '+') + n}</button>
          ))}
        </div>

        {cfg.beides && (
          <>
            <div className="wert-label mitte">{cfg.vorzeichen < 0 ? '+' : '−'}</div>
            <div className="wert-reihe">
              {SPRUENGE.map(n => (
                <button key={n} type="button"
                  className={'wert-sprung ' + (cfg.vorzeichen < 0 ? 'plus' : 'minus')}
                  onClick={()=>stufe(-n)}>{(cfg.vorzeichen < 0 ? '+' : '−') + n}</button>
              ))}
            </div>
          </>
        )}

        <div className="wert-stepper">
          <button type="button" onClick={()=>stufe(-1)} aria-label="Eins weniger">−</button>
          <input type="number" value={wert} aria-label={cfg.titel}
            onChange={e=>setWert(e.target.value === '' ? 0 : +e.target.value)}
            onKeyDown={e=>{ if (e.key === 'Enter' && wert) onAnwenden(Math.abs(wert) * (wert < 0 ? -1 : 1)); }} />
          <button type="button" onClick={()=>stufe(1)} aria-label="Eins mehr">+</button>
          <button type="button" className="wert-reset" onClick={()=>setWert(0)} aria-label="Zurücksetzen">↺</button>
        </div>

        <div className="wert-aktionen">
          <button className="wert-ok" disabled={!wert} onClick={()=>onAnwenden(wert)}>Anwenden</button>
          <button className="wert-ab" onClick={onAbbrechen}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
};

// ── Zustandsfenster ──────────────────────────────────────────────
const ZustandWahl = ({ t, onZustand, onErschoepfung, onMarke, onSchliessen }) => (
  <div className="kampf-zust-panel" onClick={e=>e.stopPropagation()}>
    <div className="kampf-zust-titel">Zustände — {t.name}</div>
    <div className="kampf-zust-marken">
      <button type="button" className={'zust-marke gut' + (t.vorteil ? ' an' : '')}
        onClick={()=>onMarke('vorteil')}>👍 Vorteil</button>
      <button type="button" className={'zust-marke schlecht' + (t.nachteil ? ' an' : '')}
        onClick={()=>onMarke('nachteil')}>👎 Nachteil</button>
    </div>
    <div className="kampf-zust-chips">
      {CONDITIONS.map(z => (
        <button key={z} type="button"
          className={'zust-chip' + ((t.zustaende||[]).includes(z) ? ' an' : '')}
          onClick={()=>onZustand(z)}>{z}</button>
      ))}
    </div>
    <div className="kampf-zust-ersch">
      <div className="kampf-zust-untertitel">Erschöpfung (Stufe {t.erschoepfung||0}/6)</div>
      <div className="kampf-ersch-pips">
        {[1,2,3,4,5,6].map(i => (
          <button key={i} type="button"
            className={'ersch-pip' + ((t.erschoepfung||0) >= i ? ' an' : '')}
            aria-label={'Erschöpfung ' + i} aria-pressed={(t.erschoepfung||0) >= i}
            onClick={()=>onErschoepfung((t.erschoepfung||0) === i ? i-1 : i)}>{i}</button>
        ))}
      </div>
    </div>
    <button type="button" className="kampf-zust-zu" onClick={onSchliessen}>Schließen ✕</button>
  </div>
);

// ── Eine Karte ───────────────────────────────────────────────────
const KampfZeile = ({ t, dran, onWert, onFenster, onIni, onNotiz, onNotizFertig, onZustand, onMarke,
                      onErschoepfung, onEntfernen, onBlatt, onTodes,
                      zustandOffen, setZustandOffen, detailOffen, setDetailOffen }) => {
  const gesamtMax = Math.max(1, t.hpMax || 1);
  const anteil = Math.max(0, Math.min(1, (t.hp || 0) / gesamtMax));
  const tot = (t.hp || 0) <= 0;
  const farbe = anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a';
  const lage = t.art === 'held' ? todesStand(t.deathSaves) : 'offen';

  return (
    <div className={'kampf-zeile' + (dran ? ' dran' : '') + (tot ? ' tot' : '')
                    + (t.art === 'held' ? ' held' : ' gegner')}>

      <div className="kampf-ini-feld">
        <input className="kampf-ini" type="number" value={t.ini === null ? '' : t.ini}
          placeholder="—" aria-label={'Initiative ' + t.name} title="Initiative eintragen"
          onChange={e=>onIni(e.target.value)} />
        <span className="kampf-ini-label">init.</span>
      </div>

      <div className="kampf-figur">
        {t.bild ? <img src={t.bild} alt="" /> : <span>{t.art === 'held' ? '🛡' : '💀'}</span>}
      </div>

      <div className="kampf-namensblock">
        {t.art === 'gegner' && t.vorlageId ? (
          <button className="kampf-name kampf-name-knopf" onClick={()=>onBlatt(t.vorlageId)}
            title="Werte nachschlagen">{t.name}</button>
        ) : t.art === 'held' ? (
          <button className="kampf-name kampf-name-knopf"
            onClick={()=>setDetailOffen(detailOffen === t.id ? null : t.id)}
            title="Werte aus dem Bogen" aria-expanded={detailOffen === t.id}>{t.name}</button>
        ) : (
          <span className="kampf-name">{t.name}</span>
        )}
        {t.unterzeile && <div className="kampf-unter">{t.unterzeile}</div>}
        <div className="kampf-marken">
          {t.ini === null && <span className="kampf-warte">Initiative fehlt</span>}
          {t.fehlt && <span className="kampf-warte">nicht mehr im Abenteuer</span>}
          {t.passive != null && <span className="kampf-passiv" title="Passive Wahrnehmung">👁 {t.passive}</span>}
          {t.vorteil  && <span className="kampf-marke gut">👍 Vorteil</span>}
          {t.nachteil && <span className="kampf-marke schlecht">👎 Nachteil</span>}
          {(t.erschoepfung||0) > 0 && <span className="kampf-marke ersch">Erschöpfung {t.erschoepfung}</span>}
          {(t.zustaende||[]).map(z => (
            <button key={z} className="kampf-zustand" onClick={()=>onZustand(z)} title="Entfernen">{z} ✕</button>
          ))}
          {(t.flags||[]).map(f => <span key={f} className="kampf-flag">{f}</span>)}
        </div>
      </div>

      {/* Die Notiz der Spielleitung, nicht die des Spielers zu seinem Helden.
          Bei einem Helden bleibt sie ueber den Kampf hinaus stehen (sie liegt
          in der DM-Bibliothek); bei einem Gegner endet sie mit ihm — eine
          Notiz an Goblin 3 hat nach dem Kampf niemanden mehr, zu dem sie
          gehoert. Gesichert wird kurz nach dem Tippen und beim Verlassen des
          Feldes. */}
      <textarea className="kampf-notiz" value={t.notiz || ''} placeholder="Notiz…"
        aria-label={'Notiz zu ' + t.name} onChange={e=>onNotiz(e.target.value)}
        onBlur={()=>onNotizFertig && onNotizFertig()} />

      <div className="kampf-ac">AC {t.ac}</div>

      <div className="kampf-hp">
        <div className="kampf-hp-zahl">
          <b style={{color:farbe}}>{(t.hp||0) + (t.tempHp||0)}</b>
          <span>/ {t.hpMax}</span>
          {(t.tempHp||0) > 0 && <i className="kampf-temp">🛡+{t.tempHp}</i>}
        </div>
        <div className="kampf-balken">
          <div className="kampf-balken-fuell" style={{width:(anteil*100)+'%', background:farbe}} />
        </div>
        <div className="kampf-hp-unter">
          {(t.tempHp||0) > 0 && <span className="kampf-temp">+{t.tempHp} Temp HP</span>}
          {(t.tempMaxHp||0) > 0 && <span className="kampf-maxtemp">+{t.tempMaxHp} Temp. Max</span>}
        </div>
      </div>

      <div className="kampf-tasten">
        <div className="kampf-tasten-grid">
          <button className="kt dmg"  title="1 Schaden"   onClick={()=>onWert('schaden', 1)}>-1</button>
          <button className="kt dmg"  title="5 Schaden"   onClick={()=>onWert('schaden', 5)}>-5</button>
          <button className="kt dmg breit" onClick={()=>onFenster('schaden')}>Schaden…</button>
          <button className="kt heal" title="1 heilen"    onClick={()=>onWert('heilung', 1)}>+1</button>
          <button className="kt heal" title="5 heilen"    onClick={()=>onWert('heilung', 5)}>+5</button>
          <button className="kt heal breit" onClick={()=>onFenster('heilung')}>Heilen…</button>
          <button className="kt temp weit" onClick={()=>onFenster('temp')}>+Temp HP</button>
          {t.art === 'held' ? (
            <button className="kt max breit" onClick={()=>onFenster('maxtemp')}
              title="Temporäre maximale Trefferpunkte — Heldenmahl, Aid, ein Segen für diesen Abend">+Temp Max</button>
          ) : (
            <button className="kt max breit" onClick={()=>onFenster('maxhp')}
              title="Maximale Trefferpunkte setzen">Max TP</button>
          )}
        </div>
        <button className={'kt zust' + (zustandOffen === t.id ? ' offen' : '')}
          aria-expanded={zustandOffen === t.id}
          onClick={()=>setZustandOffen(zustandOffen === t.id ? null : t.id)}>Zustände</button>
        {zustandOffen === t.id && (
          <>
            <div className="kampf-zust-schirm" onClick={()=>setZustandOffen(null)} />
            <ZustandWahl t={t} onZustand={onZustand} onErschoepfung={onErschoepfung}
              onMarke={onMarke} onSchliessen={()=>setZustandOffen(null)} />
          </>
        )}
      </div>

      {/* Bei 0 Trefferpunkten wird gewuerfelt. Steht ausgeklappt da, sobald
          es soweit ist — danach zu suchen waere genau im falschen Moment. */}
      {t.art === 'held' && (tot || lage !== 'offen') && (
        <TodesWuerfe stand={t.deathSaves} onSetzen={onTodes} />
      )}

      {detailOffen === t.id && t.art === 'held' && (
        <div className="kampf-detail">
          {t.saves && (
            <div className="kampf-detail-block">
              <div className="kampf-detail-titel">Rettungswürfe</div>
              <div className="kampf-saves">
                {Object.keys(t.saves).map(k => (
                  <div className="kampf-save" key={k}>
                    <span>{AL[k]}</span><b>{fnum(t.saves[k])}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(t.effekte||[]).length > 0 && (
            <div className="kampf-detail-block">
              <div className="kampf-detail-titel">Wirkt gerade</div>
              <div className="kampf-effekte">
                {(t.effekte||[]).map((e,i) => (
                  <span className="kampf-effekt" key={i}>
                    {e.source}: {EFFECT_LABELS[e.target] || e.target} {effectText(e)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(t.effekte||[]).length === 0 && !t.saves && (
            <div className="kampf-detail-leer">Keine besonderen Werte.</div>
          )}
        </div>
      )}

      <button className="kampf-raus" onClick={onEntfernen}
        title="Aus dem Kampf nehmen" aria-label={t.name + ' aus dem Kampf nehmen'}>✕</button>
    </div>
  );
};

// ── Spontan zusammenstellen ──────────────────────────────────────
// Nicht jeder Kampf ist vorbereitet. Hier werden Gegner direkt gewaehlt,
// ohne den Umweg ueber eine gespeicherte Begegnung.
// Eine gespeicherte Begegnung in den laufenden Kampf holen. Frueher war
// das die Startseite des Trackers; sie stand jedem Kampf im Weg, der ohne
// Begegnung anfangen sollte — und das ist der Normalfall am Tisch.
const BegegnungWahl = ({ encounters, enemies, advId, onLaden, onAbbrechen }) => {
  const waehlbar = encounters.filter(e => !e.adventure || e.adventure === advId);
  return (
    <div className="form-overlay" onClick={onAbbrechen}>
      <div className="form-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <div className="form-title">📋 Begegnung laden</div>
        {waehlbar.length === 0 ? (
          <p className="kampf-leer">
            Keine Begegnung in diesem Abenteuer. Lege eine unter 📚 Datenbank › Begegnungen an.
          </p>
        ) : (
          <div className="kampf-start-liste">
            {waehlbar.map(b => {
              const anzahl  = (b.enemies||[]).reduce((s,t)=>s+(+t.count||1), 0);
              const fehlend = (b.enemies||[]).filter(t => !enemies.some(g=>g.id===t.enemyId)).length;
              return (
                <button key={b.id} className="kampf-start-eintrag"
                  disabled={anzahl === 0 || fehlend === anzahl}
                  onClick={()=>onLaden(b)}>
                  <span className="kampf-start-name">{b.name}</span>
                  <span className="kampf-start-sub">
                    {b.difficulty} · {anzahl} Gegner
                    {fehlend ? ' · ' + fehlend + ' Gegner fehlt in der Sammlung' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
};

const NothelferFenster = ({ onAnlegen, onAbbrechen }) => {
  const [name, setName] = React.useState('');
  const [tp, setTp]     = React.useState('');
  const [ac, setAc]     = React.useState('');
  const [anzahl, setAnzahl] = React.useState(1);
  const fertig = () => {
    const n = Math.max(1, Math.min(20, +anzahl || 1));
    onAnlegen(name, tp, ac, n);
  };
  const taste = (e) => { if (e.key === 'Enter') fertig(); };

  return (
    <div className="form-overlay" onClick={onAbbrechen}>
      <div className="form-modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">✚ Nothelfer</div>
        <div className="einst-hinweis" style={{marginTop:0,marginBottom:14}}>
          Für den Wächter, der im Abenteuerbuch mit einem Satz abgehandelt ist.
          Er kommt sofort in die Initiative und wandert nicht in die Gegnersammlung.
        </div>
        <div className="form-grid" style={{gridTemplateColumns:"1fr"}}>
          <div className="form-group">
            <div className="form-label">Name</div>
            <input className="form-input" autoFocus placeholder="z.B. Wächter am Tor"
              value={name} onChange={e=>setName(e.target.value)} onKeyDown={taste} />
          </div>
          <div className="not-zeile">
            <div className="form-group">
              <div className="form-label">Trefferpunkte</div>
              <input className="form-input" type="number" min={1} max={9999} placeholder="11"
                value={tp} onChange={e=>setTp(e.target.value)} onKeyDown={taste} />
            </div>
            <div className="form-group">
              <div className="form-label">Rüstungsklasse</div>
              <input className="form-input" type="number" min={1} max={40} placeholder="13"
                value={ac} onChange={e=>setAc(e.target.value)} onKeyDown={taste} />
            </div>
            <div className="form-group">
              <div className="form-label">Anzahl</div>
              <input className="form-input" type="number" min={1} max={20}
                value={anzahl} onChange={e=>setAnzahl(e.target.value)} onKeyDown={taste} />
            </div>
          </div>
        </div>
        <div className="einst-hinweis" style={{marginTop:0}}>
          Die Initiative wird gewürfelt. Leere Felder bedeuten 1 Trefferpunkt und
          Rüstungsklasse 10.
        </div>
        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={fertig}>In den Kampf</button>
        </div>
      </div>
    </div>
  );
};

const SpontanWahl = ({ enemies, laufend, onStarten, onAbbrechen }) => {
  const [suche, setSuche] = React.useState('');
  const [gewaehlt, setGewaehlt] = React.useState([]);

  const q = suche.trim();
  const treffer = enemies
    .filter(e => !q || containsFold(e.name||'', q) || containsFold((e.tags||[]).join(' '), q)
                 || containsFold(e.type||'', q))
    .sort((a,b) => crRang(a.cr)-crRang(b.cr) || (a.name||'').localeCompare(b.name||'','de'))
    .slice(0, q ? 25 : 15);

  const hinzu = (e) => setGewaehlt(g => {
    const drin = g.find(x => x.enemyId === e.id);
    return drin ? g.map(x => x.enemyId===e.id ? {...x, count:x.count+1} : x)
                : [...g, {enemyId:e.id, count:1, name:e.name}];
  });
  const anzahlSetzen = (id, n) => setGewaehlt(g => g.map(x => x.enemyId===id ? {...x, count:Math.max(1,n)} : x));
  const entfernen = (id) => setGewaehlt(g => g.filter(x => x.enemyId !== id));

  const gesamt = gewaehlt.reduce((s,x) => s + x.count, 0);

  return (
    <div className="form-overlay" onClick={onAbbrechen}>
      <div className="form-modal spontan" onClick={e=>e.stopPropagation()}>
        <div className="form-title">
          {laufend ? '⚡ Gegner in den Kampf holen' : '⚡ Spontaner Kampf'}
        </div>

        {gewaehlt.length > 0 && (
          <div className="spontan-gewaehlt">
            {gewaehlt.map(x => {
              const g = enemies.find(e => e.id === x.enemyId);
              return (
                <div className="spontan-teil" key={x.enemyId}>
                  <span className="spontan-teil-name">
                    {x.name}
                    {g && <i>HG {g.cr} · RK {g.ac} · {g.hpMax} TP</i>}
                  </span>
                  <input className="form-input spontan-zahl" type="number" min={1} max={30}
                    value={x.count} aria-label={'Anzahl ' + x.name}
                    onChange={e=>anzahlSetzen(x.enemyId, +e.target.value)} />
                  <button type="button" className="fx-del" title="Entfernen"
                    onClick={()=>entfernen(x.enemyId)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        <input className="form-input spontan-suche" value={suche} autoFocus
          placeholder={enemies.length + ' Gegner durchsuchen…'} aria-label="Gegner suchen"
          onChange={e=>setSuche(e.target.value)} />

        <div className="spontan-treffer">
          {treffer.length === 0 ? (
            <div className="spontan-leer">Kein Gegner gefunden.</div>
          ) : treffer.map(e => (
            <button type="button" key={e.id} className="spontan-zeile" onClick={()=>hinzu(e)}>
              <span className="spontan-bild">
                {e.image ? <img src={e.image} alt="" /> : <span>💀</span>}
              </span>
              <span className="spontan-text">
                <b>{e.name}</b>
                <i>{e.size} · {e.type}</i>
              </span>
              <span className="spontan-werte">
                <span className="gegner-hg">HG {e.cr}</span>
                RK {e.ac} · {e.hpMax} TP
              </span>
            </button>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={gesamt === 0}
            onClick={()=>onStarten(gewaehlt)}>
            {gesamt === 0 ? 'Noch nichts gewählt'
              : laufend ? gesamt + ' Gegner dazunehmen'
                        : 'Kampf mit ' + gesamt + (gesamt===1?' Gegner':' Gegnern') + ' starten'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Die Seitenspalte ─────────────────────────────────────────────
// Oben die Helden des Abenteuers mit ihrem Stand, unten die ganze
// Gegnersammlung mit einem Pluszeichen je Zeile. So kommt der Nachzuegler
// mit einem Klick in den Kampf, ohne Umweg ueber ein Fenster.
const KampfSeite = ({ helden, setDefs, enemies, imKampf, ueberlagert, onZu,
                      onGegnerDazu, onHeldDazu }) => {
  const [suche, setSuche] = React.useState('');
  const q = suche.trim();
  const treffer = enemies
    .filter(e => !q || containsFold(e.name||'', q) || containsFold((e.tags||[]).join(' '), q)
                 || containsFold(e.type||'', q))
    .sort((a,b) => (a.name||'').localeCompare(b.name||'','de'))
    .slice(0, 200);

  return (
    <aside className="kampf-seite">
      <div className="kampf-seite-kopf">
        <span>⚔ Helden</span>
        {ueberlagert
          ? <button className="kampf-seite-zu" onClick={onZu} aria-label="Spalte schließen">✕</button>
          : <span className="kampf-seite-rechts">im Kampf</span>}
      </div>
      <div className="kampf-seite-helden">
        {helden.length === 0 && <div className="kampf-seite-leer">Kein Held im Abenteuer.</div>}
        {helden.map(h => {
          const w = charWerte(h, setDefs);
          const gesamt = Math.max(1, w.maxHp || 1);
          const anteil = Math.max(0, Math.min(1, (w.hp||0) / gesamt));
          const farbe = anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a';
          const drin = imKampf.has(h.id);
          return (
            <div className={'kampf-seite-held' + (drin ? '' : ' draussen')} key={h.id}>
              <div className="kampf-seite-figur">{h.portrait ? <img src={h.portrait} alt="" /> : <span>🛡</span>}</div>
              <div className="kampf-seite-text">
                <b>{h.name}</b>
                <i>{h.charClass} {h.level} · AC {w.ac}</i>
                <div className="kampf-balken klein">
                  <div className="kampf-balken-fuell" style={{width:(anteil*100)+'%', background:farbe}} />
                </div>
                {(w.tempHp||0) > 0 && <span className="kampf-temp">+{w.tempHp} Temp HP</span>}
              </div>
              <div className="kampf-seite-zahl">
                <b style={{color:farbe}}>{(w.hp||0) + (w.tempHp||0)}</b>/{w.maxHp}
                {!drin && (
                  <button className="kampf-seite-plus" title="In den Kampf holen"
                    onClick={()=>onHeldDazu(h)}>+</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="kampf-seite-kopf gegner">
        <span>💀 Gegner</span>
        <span className="kampf-seite-rechts">{enemies.length}</span>
      </div>
      <input className="kampf-seite-suche" value={suche} placeholder="🔍 Suchen…"
        aria-label="Gegner suchen" onChange={e=>setSuche(e.target.value)} />
      <div className="kampf-seite-gegner">
        {enemies.length === 0 ? (
          <div className="kampf-seite-leer">
            Noch keine Gegner. Unter 📚 Datenbank › 💀 Gegner eine Sammlung einlesen.
          </div>
        ) : treffer.length === 0 ? (
          <div className="kampf-seite-leer">Kein Gegner gefunden.</div>
        ) : treffer.map(e => (
          <div className="kampf-seite-gzeile" key={e.id}>
            <span className="kampf-seite-gtext">
              <b>{e.name}</b>
              <i>HP {e.hpMax} · AC {e.ac}</i>
            </span>
            <button className="kampf-seite-plus" title={e.name + ' dazunehmen'}
              aria-label={e.name + ' dazunehmen'} onClick={()=>onGegnerDazu(e)}>+</button>
          </div>
        ))}
      </div>
    </aside>
  );
};

// ── Der Kampf ────────────────────────────────────────────────────
const KampfAnsicht = ({ kampf, setKampf, enemies, encounters, helden, setDefs,
                        abenteuer, advId, onSchliessen, onGegnerBlatt, onBeenden,
                        onHeldAendern, heldNotizen, onHeldNotiz, onHeldNotizSichern }) => {
  const [zustandOffen, setZustandOffen] = React.useState(null);
  const [detailOffen, setDetailOffen] = React.useState(null);
  const [spontan, setSpontan] = React.useState(false);
  const [begegnungOffen, setBegegnungOffen] = React.useState(false);
  const [nothelferOffen, setNothelferOffen] = React.useState(false);
  const [protokollOffen, setProtokollOffen] = React.useState(false);
  const [mitZahlen, setMitZahlen] = React.useState(true);
  const [kopiert, setKopiert] = React.useState(false);
  const [wertDlg, setWertDlg] = React.useState(null);   // {id, modus}
  // Am schmalen Schirm liegt die Seitenspalte uebereinander statt daneben.
  const [seiteOffen, setSeiteOffen] = React.useState(false);

  // Der Tracker faengt sofort an. Frueher stand hier eine Startseite mit
  // der Begegnungsliste — die war im Weg, weil der haeufigste Fall keiner
  // Begegnung entspricht: die Gruppe laeuft in etwas hinein, und die Gegner
  // kommen einzeln dazu. Wer eine vorbereitete Begegnung will, laedt sie
  // oben nach; der Kampf steht dann schon.
  React.useEffect(() => {
    if (!kampf || !kampf.aktiv) {
      setKampf(kampfAufstellen({name: 'Kampf', enemies: []}, enemies, helden, setDefs));
    }
  }, []);

  // Bis v4.1 lag die Heldennotiz im Kampf und war mit ihm weg. Ein Kampf,
  // der jetzt noch offen ist, traegt seine Notizen also im alten Feld —
  // die werden einmalig herausgehoben, damit sie nicht doch noch
  // verlorengehen. Danach ist die Bibliothek die einzige Quelle.
  React.useEffect(() => {
    if (!kampf || !kampf.aktiv) return;
    const alt = kampf.teilnehmer.filter(t => t.art === 'held' && t.notiz
                                             && !((heldNotizen || {})[t.charId]));
    if (!alt.length) return;
    alt.forEach(t => onHeldNotiz(t.charId, t.notiz));
    setKampf(k => k && ({...k, teilnehmer: k.teilnehmer.map(t =>
      t.art === 'held' ? {...t, notiz: ''} : t)}));
  }, []);

  // Wer am Zug ist, gehoert ins Protokoll — und zwar gleich, wodurch er
  // es wurde. Am Knopf "Naechster Zug" zu haengen liess genau die Faelle
  // aus, in denen niemand ihn drueckt: die allererste Runde, das
  // Wuerfeln der Initiative, ein Nachzuegler, der sich davorschiebt, eine
  // Figur, die aus der Reihe genommen wird. Deshalb haengt der Eintrag am
  // Zustand.
  //
  // Der Schluessel ist Runde und Figur zusammen: dieselbe Figur in der
  // naechsten Runde ist ein neuer Zug, dieselbe Figur nach dem dritten
  // Neuzeichnen nicht.
  const dranRoh = (kampf && kampf.aktiv) ? kampf.teilnehmer[kampf.zug] : null;
  const zugSchluessel = dranRoh ? kampf.runde + ':' + dranRoh.id : null;
  const zuletztAmZug = React.useRef(undefined);
  if (zuletztAmZug.current === undefined) {
    // Beim Oeffnen eines laufenden Kampfes steht schon im Protokoll, wer
    // dran ist. Ohne diese Zeile stuende es nach jedem Aufklappen erneut da.
    const frueher = [...((kampf && kampf.log) || [])].reverse().find(e => e.art === 'zug');
    zuletztAmZug.current = frueher ? frueher.r + ':' + frueher.id : null;
  }
  React.useEffect(() => {
    if (!zugSchluessel || zuletztAmZug.current === zugSchluessel) return;
    zuletztAmZug.current = zugSchluessel;
    const c = dranRoh.art === 'held' ? helden.find(h => h.id === dranRoh.charId) : null;
    const name  = c ? c.name : (dranRoh.name || '');
    const unter = c ? ((c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level) : '';
    protokollieren({art: 'zug', id: dranRoh.id,
      wer: name + (unter ? ' (' + unter + ')' : '')});
  }, [zugSchluessel]);

  // Ein Bild lang gibt es noch keinen Kampf — der Effekt oben stellt ihn
  // auf. Etwas anzuzeigen, das sofort wieder verschwindet, waere Flackern.
  if (!kampf || !kampf.aktiv) return null;

  // Alles, was aus dem Bogen kommt, wird bei jedem Rendern neu gelesen:
  // Ruestungsklasse, Trefferpunkte, Immunitaeten, Rettungswuerfe. Legt ein
  // Held mitten im Kampf einen Schild an, steht seine RK hier sofort
  // richtig — und was hier eingetragen wird, steht dort sofort.
  const liste = kampf.teilnehmer.map(t => {
    if (t.art !== 'held') return t;
    const c = helden.find(h => h.id === t.charId);
    if (!c) return {...t, fehlt: true, name: t.name || 'Fehlt', hp: 0, hpMax: 1, ac: 10};
    const w = charWerte(c, setDefs);
    return {...t,
      name: c.name,
      unterzeile: (c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level,
      ac: w.ac, hpMax: w.maxHp, hp: w.hp, tempHp: w.tempHp, dex: w.dex,
      tempMaxHp: +c.tempMaxHp || 0,
      deathSaves: c.deathSaves || TODES_LEER,
      notiz: (heldNotizen || {})[c.id] || '',
      bild: c.portrait || null,
      passive: w.passive, saves: w.saves, effekte: w.effekte,
      flags: w.flags.map(f => f.label),
    };
  });
  const amZug = liste[kampf.zug] || null;
  const imKampf = new Set(kampf.teilnehmer.filter(t => t.art === 'held').map(t => t.charId));

  // Was zum Kampf gehoert, bleibt im Kampf.
  const aendernKampf = (id, fn) =>
    setKampf(k => ({...k, teilnehmer: k.teilnehmer.map(t => t.id===id ? fn(t) : t)}));

  // Eine Zeile ins Protokoll. Die Runde kommt aus dem Kampf selbst, nicht
  // aus dem Aufrufer — sonst stuende ein Eintrag in der falschen Runde,
  // wenn er im selben Atemzug mit dem Zugwechsel kommt.
  const protokollieren = (eintrag) => setKampf(k => k && ({...k,
    log: [...(k.log || []), {...eintrag, r: k.runde}]}));

  // Was zum Helden gehoert, geht in den Bogen — sofort, nicht am Ende.
  const aendernWerte = (id, fn, eintrag) => {
    const t = liste.find(x => x.id === id);
    if (!t || t.fehlt) return;
    const neu = fn(t);

    // Erst notieren, was geschehen ist — mit dem Stand davor und danach.
    if (eintrag) {
      if (eintrag.art === 'todes') {
        const d = neu.deathSaves || TODES_LEER;
        protokollieren({art: 'todes', wer: t.name, erfolge: d.erfolge || 0, fehler: d.fehler || 0,
               lage: todesStand(d)});
      } else {
        protokollieren({...eintrag, wer: t.name, von: (t.hp || 0), auf: (neu.hp || 0)});
      }
    }
    // Und die beiden Augenblicke, die man spaeter nachliest.
    if ((t.hp || 0) > 0 && (neu.hp || 0) <= 0) protokollieren({art: 'nieder', wer: t.name});
    if ((t.hp || 0) <= 0 && (neu.hp || 0) > 0) protokollieren({art: 'auf', wer: t.name, auf: neu.hp});

    if (t.art === 'held') {
      const p = {hp: neu.hp, tempHp: neu.tempHp};
      if (neu.tempMaxHp  !== undefined) p.tempMaxHp  = neu.tempMaxHp;
      if (neu.deathSaves !== undefined) p.deathSaves = neu.deathSaves;
      // Wer wieder ueber null steht, wuerfelt nicht mehr ums Ueberleben.
      if (neu.hp > 0) p.deathSaves = TODES_LEER;
      onHeldAendern(t.charId, p, t.name);
    } else {
      aendernKampf(id, fn);
    }
  };

  const schaden = (t, n) => {
    // Temporäre Punkte fangen zuerst — so steht es im Regelwerk.
    const vomTemp = Math.min(t.tempHp || 0, n);
    return {...t, tempHp: (t.tempHp||0) - vomTemp, hp: Math.max(0, (t.hp||0) - (n - vomTemp))};
  };
  const heilen = (t, n) => ({...t, hp: Math.min(t.hpMax, Math.max(0, (t.hp||0) + n))});
  const temp   = (t, n) => ({...t, tempHp: Math.max(0, n < 0 ? (t.tempHp||0) + n : Math.max(t.tempHp||0, n))});

  // Auf der Karte: die kleinen Schritte ohne Fenster.
  const wertDirekt = (id, modus, n) => {
    if (modus === 'schaden') aendernWerte(id, t => schaden(t, n), {art:'schaden', wert:n});
    if (modus === 'heilung') aendernWerte(id, t => heilen(t, n),  {art:'heilung', wert:n});
  };

  const fensterAnwenden = (n) => {
    const {id, modus} = wertDlg;
    setWertDlg(null);
    if (!n) return;
    if (modus === 'schaden') aendernWerte(id, t => n > 0 ? schaden(t, n) : heilen(t, -n),
                                          n > 0 ? {art:'schaden', wert:n} : {art:'heilung', wert:-n});
    if (modus === 'heilung') aendernWerte(id, t => n > 0 ? heilen(t, n) : schaden(t, -n),
                                          n > 0 ? {art:'heilung', wert:n} : {art:'schaden', wert:-n});
    if (modus === 'temp')    aendernWerte(id, t => temp(t, n), {art:'temp', wert:n});
    if (modus === 'maxtemp') aendernWerte(id, t => ({...t, tempMaxHp: Math.max(0, (t.tempMaxHp||0) + n)}),
                                          {art:'maxtemp', wert:n});
    // Sinkt die Obergrenze unter den aktuellen Stand, sinkt der Stand mit.
    if (modus === 'maxhp') {
      const ziel = liste.find(x => x.id === id);
      if (ziel) protokollieren({art:'maxhp', wer: ziel.name, wert: n});
      aendernKampf(id, t => {
        const m = Math.max(1, (t.hpMax||1) + n);
        return {...t, hpMax: m, hp: Math.min(t.hp, m)};
      });
    }
  };

  const zustand = (id, z) => {
    const t = liste.find(x => x.id === id);
    if (t) protokollieren({art:'zustand', wer: t.name, was: z, an: !(t.zustaende||[]).includes(z)});
    aendernKampf(id, t2 => ({...t2,
      zustaende: (t2.zustaende||[]).includes(z) ? (t2.zustaende||[]).filter(x=>x!==z) : [...(t2.zustaende||[]), z]}));
  };
  const marke = (id, k) => {
    const t = liste.find(x => x.id === id);
    if (t) protokollieren({art:'marke', wer: t.name, was: k === 'vorteil' ? 'Vorteil' : 'Nachteil', an: !t[k]});
    aendernKampf(id, t2 => ({...t2, [k]: !t2[k]}));
  };
  const erschoepfung = (id, stufe) => {
    const t = liste.find(x => x.id === id);
    const neu = Math.max(0, Math.min(6, stufe));
    if (t && (t.erschoepfung||0) !== neu) protokollieren({art:'ersch', wer: t.name, wert: neu});
    aendernKampf(id, t2 => ({...t2, erschoepfung: neu}));
  };
  // Die Notiz zu einem Helden gehoert zu ihm, nicht zu diesem Kampf —
  // deshalb denselben Weg wie die Trefferpunkte: hinaus aus dem Kampf.
  const notiz = (id, v) => {
    const t = liste.find(x => x.id === id);
    if (t && t.art === 'held' && !t.fehlt) onHeldNotiz(t.charId, v);
    else aendernKampf(id, alt => ({...alt, notiz: v}));
  };

  // Der Kampf speichert von Helden nur, was zum Kampf gehoert — zum
  // Sortieren fehlt dort die Geschicklichkeit. Sie kommt fuer den
  // Vergleich aus dem Bogen und wird nicht mitgespeichert.
  const heldDex = (t) => {
    if (t.art !== 'held') return t.dex || 10;
    const c = helden.find(h => h.id === t.charId);
    return c ? charWerte(c, setDefs).dex : 10;
  };
  const heldName = (t) => {
    if (t.art !== 'held') return t.name || '';
    const c = helden.find(h => h.id === t.charId);
    return c ? c.name : (t.name || '');
  };
  // Sortiert die rohen Eintraege und behaelt sie roh: sortiert wird auf
  // einer angereicherten Kopie, zurueck kommen die Originale.
  const sortiereRoh = (teilnehmer) => {
    const reihe = sortiereNachIni(teilnehmer.map(t => ({...t, dex: heldDex(t), name: heldName(t)})));
    return reihe.map(x => teilnehmer.find(t => t.id === x.id));
  };
  const neuOrdnen = (k, teilnehmer) => {
    const dranId = k.teilnehmer[k.zug] && k.teilnehmer[k.zug].id;
    const reihe = sortiereRoh(teilnehmer);
    return {...k, teilnehmer: reihe, zug: Math.max(0, reihe.findIndex(t => t.id === dranId))};
  };

  const ini = (id, v) => setKampf(k => {
    const n = v === '' ? null : parseInt(v, 10);
    return neuOrdnen(k, k.teilnehmer.map(t => t.id===id ? {...t, ini: Number.isFinite(n) ? n : null} : t));
  });

  const entfernen = (id) => setKampf(k => {
    const raus = k.teilnehmer.find(t => t.id === id);
    const idx = k.teilnehmer.findIndex(t => t.id === id);
    const teilnehmer = k.teilnehmer.filter(t => t.id !== id);
    const zug = idx < k.zug ? Math.max(0, k.zug-1) : Math.min(k.zug, Math.max(0, teilnehmer.length-1));
    return {...k, teilnehmer, zug,
      log: [...(k.log||[]), {art:'weg', r: k.runde,
                             wer: (raus && (heldName(raus) || raus.name)) || 'Jemand'}]};
  });

  const dazu = (neue) => setKampf(k => {
    const nk = neuOrdnen(k, [...k.teilnehmer, ...neue]);
    return {...nk, log: [...(k.log||[]), ...neue.map(t => ({
      art:'dazu', r: k.runde, wer: heldName(t) || t.name, hp: t.hpMax, ac: t.ac}))]};
  });

  // Eine vorbereitete Begegnung in den laufenden Kampf. Steht noch kein
  // Gegner drin und heisst der Kampf noch wie der leere, uebernimmt er den
  // Namen der Begegnung — das ist der Fall, in dem der Tracker gerade erst
  // aufgegangen ist.
  const begegnungLaden = (b) => {
    setBegegnungOffen(false);
    const neue = gegnerAusBegegnung(b, enemies);
    if (!neue.length) return;
    setKampf(k => {
      const leer = !k.teilnehmer.some(t => t.art === 'gegner');
      return neuOrdnen({...k, name: (leer && b.name) ? b.name : k.name},
                       [...k.teilnehmer, ...neue]);
    });
  };

  const naechster = () => setKampf(k => {
    if (!k.teilnehmer.length) return k;
    const naechsterZug = k.zug + 1;
    return naechsterZug >= k.teilnehmer.length
      ? {...k, zug: 0, runde: k.runde + 1}
      : {...k, zug: naechsterZug};
  });

  // Wuerfelt nur fuer die, bei denen noch nichts steht — eine angesagte
  // Zahl wird nicht ueberschrieben.
  const alleIni = () => setKampf(k => neuOrdnen(k, k.teilnehmer.map(t =>
    t.ini !== null ? t : {...t, ini: w20() + mod(heldDex(t))})));

  // In die Zwischenablage. Wo die neue Schnittstelle fehlt — altes
  // Android, unsichere Verbindung —, hilft der Umweg ueber ein Feld,
  // das kurz da ist und gleich wieder verschwindet.
  const protokollKopieren = async () => {
    const text = protokollText(kampf, mitZahlen);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const f = document.createElement('textarea');
        f.value = text;
        f.style.position = 'fixed'; f.style.opacity = '0';
        document.body.appendChild(f); f.select();
        document.execCommand('copy');
        document.body.removeChild(f);
      } catch { return; }
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  const ohneIni = liste.filter(t => t.ini === null).length;
  const dlgZiel = wertDlg && liste.find(t => t.id === wertDlg.id);

  return (
    <div className={'kampf-schirm' + (seiteOffen ? ' seite-offen' : '')}>
      <KampfSeite helden={helden} setDefs={setDefs} enemies={enemies} imKampf={imKampf}
        ueberlagert={seiteOffen} onZu={()=>setSeiteOffen(false)}
        onGegnerDazu={(e)=>{ dazu([gegnerAusVorlage(e)]); setSeiteOffen(false); }}
        onHeldDazu={(h)=>{ dazu([{id:'held-'+h.id, art:'held', charId:h.id, ini:null,
                                zustaende:[], erschoepfung:0, notiz:'', vorteil:false, nachteil:false}]);
                           setSeiteOffen(false); }} />

      <div className="kampf-haupt">
        <div className="kampf-kopf">
          <button className="kampf-seite-knopf" onClick={()=>setSeiteOffen(true)}
            title="Helden und Gegner" aria-label="Helden und Gegner">☰</button>
          <div className="kampf-titel">⚔ {kampf.name}</div>
          <div className="kampf-runde"><span>Runde</span><b>{kampf.runde}</b></div>
          <div className="kampf-dran">
            {amZug ? <>Am Zug: <b>{amZug.name}</b></> : 'Niemand am Zug'}
          </div>
          <button className="kampf-kopf-btn" onClick={alleIni}
            title="Für alle ohne Zahl würfeln">🎲 Alle Init.</button>
          <button className="kampf-kopf-btn zusatz" onClick={()=>setSpontan(true)}
            title="Gegner nachträglich dazunehmen">⚡ Gegner</button>
          <button className="kampf-kopf-btn zusatz" onClick={()=>setBegegnungOffen(true)}
            title="Eine vorbereitete Begegnung dazuladen">📋 Begegnung</button>
          <button className="kampf-kopf-btn zusatz" onClick={()=>setNothelferOffen(true)}
            title="Gegner aus dem Stegreif: Name, Trefferpunkte, Rüstungsklasse">✚ Nothelfer</button>
          <button className={"kampf-kopf-btn zusatz" + (protokollOffen ? " an" : "")}
            onClick={()=>setProtokollOffen(o=>!o)}
            title="Was in diesem Kampf geschehen ist">
            📜 Protokoll{(kampf.log||[]).length > 1 ? ' · ' + (kampf.log||[]).length : ''}
          </button>
          <button className="kampf-weiter" onClick={naechster}>Nächster Zug ▶</button>
          <button className="kampf-kopf-btn ende" onClick={onBeenden}>⏹ Kampf beenden</button>
          <button className="kampf-kopf-x" onClick={onSchliessen}
            title="Nur schließen, der Kampf läuft weiter" aria-label="Kampftracker schließen">✕</button>
        </div>

        {protokollOffen && (
          <div className="kampf-protokoll">
            <div className="kampf-protokoll-kopf">
              <span>📜 Protokoll dieses Kampfes</span>
              <label className="kampf-protokoll-schalter" title="Ohne Häkchen stehen nur die Beträge da, nicht die Trefferpunktstände">
                <input type="checkbox" checked={mitZahlen}
                  onChange={e=>setMitZahlen(e.target.checked)} />
                Trefferpunkte
              </label>
              <button className="btn-icon" onClick={protokollKopieren}>
                {kopiert ? '✓ Kopiert' : '📋 Kopieren'}
              </button>
            </div>
            <div className="kampf-protokoll-text">
              {(kampf.log || []).length <= 1 ? (
                <i>Noch nichts geschehen. Was du einträgst, steht hier.</i>
              ) : (
                (() => {
                  const zeilen = [];
                  let runde = null;
                  (kampf.log || []).forEach((e, i) => {
                    if (e.r !== runde) {
                      runde = e.r;
                      zeilen.push(<div className="pr-runde" key={'r'+i}>── Runde {runde} ──</div>);
                    }
                    const z = protokollZeile(e, mitZahlen);
                    if (z) zeilen.push(
                      <div className={'pr-zeile' + (e.art === 'zug' ? ' zug' : '')
                                      + (e.art === 'nieder' || (e.art === 'todes' && e.lage === 'tot') ? ' schwer' : '')}
                        key={i}>{z}</div>);
                  });
                  return zeilen;
                })()
              )}
            </div>
          </div>
        )}

        {ohneIni > 0 && (
          <div className="kampf-hinweis">
            {ohneIni === 1 ? 'Bei einer Figur fehlt die Initiative' : 'Bei ' + ohneIni + ' Figuren fehlt die Initiative'} —
            sie stehen unten, bis die Zahl eingetragen ist. Links auf die Zahl tippen oder oben würfeln lassen.
          </div>
        )}

        {nothelferOffen && (
          <NothelferFenster
            onAbbrechen={()=>setNothelferOffen(false)}
            onAnlegen={(name, tp, ac, anzahl)=>{
              setNothelferOffen(false);
              const neue = [];
              for (let i = 0; i < anzahl; i++) {
                neue.push(nothelferAnlegen(
                  anzahl > 1 ? ((name || '').trim() || 'Gegner') + ' ' + (i+1) : name, tp, ac));
              }
              dazu(neue);
            }} />
        )}

        {begegnungOffen && (
          <BegegnungWahl encounters={encounters} enemies={enemies} advId={advId}
            onAbbrechen={()=>setBegegnungOffen(false)} onLaden={begegnungLaden} />
        )}

        {spontan && (
          <SpontanWahl enemies={enemies} laufend={true}
            onAbbrechen={()=>setSpontan(false)}
            onStarten={(auswahl)=>{
              setSpontan(false);
              const frisch = [];
              auswahl.forEach(({enemyId, count}) => {
                const v = enemies.find(e => e.id === enemyId);
                if (!v) return;
                const n = Math.max(1, +count || 1);
                for (let i = 0; i < n; i++) frisch.push(gegnerAusVorlage(v, n > 1 ? v.name + ' ' + (i+1) : v.name));
              });
              dazu(frisch);
            }} />
        )}

        {wertDlg && dlgZiel && (
          <WertDialog modus={wertDlg.modus} name={dlgZiel.name} start={0}
            onAbbrechen={()=>setWertDlg(null)} onAnwenden={fensterAnwenden} />
        )}

        <div className="kampf-liste">
          {liste.map(t => (
            <KampfZeile key={t.id} t={t} dran={amZug && amZug.id === t.id}
              zustandOffen={zustandOffen} setZustandOffen={setZustandOffen}
              detailOffen={detailOffen} setDetailOffen={setDetailOffen}
              onWert={(modus,n)=>wertDirekt(t.id, modus, n)}
              onFenster={(modus)=>setWertDlg({id:t.id, modus})}
              onIni={v=>ini(t.id,v)} onNotiz={v=>notiz(t.id,v)}
              onNotizFertig={t.art === 'held' ? onHeldNotizSichern : undefined}
              onZustand={z=>zustand(t.id,z)} onMarke={k=>marke(t.id,k)}
              onErschoepfung={st=>erschoepfung(t.id,st)}
              onTodes={(d)=>aendernWerte(t.id, alt => ({...alt, deathSaves:d}), {art:'todes'})}
              onEntfernen={()=>entfernen(t.id)} onBlatt={onGegnerBlatt} />
          ))}
        </div>
      </div>
    </div>
  );
};
