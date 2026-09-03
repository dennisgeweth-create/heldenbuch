// ── Einstellungen eines Abenteuers ───────────────────────────────
// Was hier steht, gilt fuer alle in der Gruppe — es liegt in derselben
// geteilten Datenbank wie die Abenteuerliste selbst. Deshalb sind es
// bewusst wenige, klar benannte Schalter und keine Sammelkiste.
const AbenteuerEinstellungen = ({ adv, helden, onAendern, onSpeichern, onAbbrechen }) => {
  const klassen = advKlassen(adv);
  const eigene  = Array.isArray(adv.klassen) && adv.klassen.length > 0;
  const setzen  = (p) => onAendern({...adv, ...p});

  // Welche Klassen im Abenteuer tatsaechlich gespielt werden. Eine davon
  // zu entfernen nimmt einem Helden seine Klasse — das sagt die Zeile.
  const inBenutzung = {};
  (helden || []).forEach(c => {
    [c.charClass, ...((c.multiclasses||[]).map(m => m.charClass))]
      .filter(Boolean).forEach(k => { inBenutzung[k] = (inBenutzung[k]||0) + 1; });
  });

  const klassenSetzen = (liste) => setzen({klassen: liste});
  const aendern = (i, p) => klassenSetzen(klassen.map((k,j) => j===i ? {...k, ...p} : k));
  const entfernen = (i) => klassenSetzen(klassen.filter((_,j) => j!==i));
  const hinzu = () => klassenSetzen([...klassen, {name:'', color:'#8b9198'}]);

  return (
    <div className="form-overlay">
      <div className="form-modal" style={{maxWidth:560}}>
        <div className="form-title">⚙ Einstellungen · {adv.name || 'Abenteuer'}</div>

        <div style={{maxHeight:'64vh',overflowY:'auto',paddingRight:4}}>
          <div className="form-group form-full" style={{marginBottom:18}}>
            <label className="form-label">Name des Abenteuers</label>
            <input className="form-input" value={adv.name||''}
              onChange={e=>setzen({name:e.target.value})} placeholder="z.B. Strahd" />
          </div>

          {/* ── Trefferpunkte ── */}
          <div className="einst-block">
            <div className="einst-titel">❤ Trefferpunkte</div>
            <div className="einst-wahl">
              <button type="button" className={'einst-option' + (!adv.hpVerdeckt ? ' aktiv' : '')}
                onClick={()=>setzen({hpVerdeckt:false})}>
                <b>Offen</b>
                <i>Jeder sieht seine Zahlen und kann sie ändern.</i>
              </button>
              <button type="button" className={'einst-option' + (adv.hpVerdeckt ? ' aktiv' : '')}
                onClick={()=>setzen({hpVerdeckt:true})}>
                <b>Verdeckt</b>
                <i>Spieler sehen nur ihren Zustand — „Verwundet“ statt „14 / 38“.
                   Zahlen und Eingabefelder bleiben der Spielleitung.</i>
              </button>
            </div>
            {adv.hpVerdeckt && (
              <div className="einst-hinweis">
                Die Trefferpunkte werden dann im DM-Modus gepflegt — im Bogen oder
                über den Kampftracker. Maximum und temporäre Trefferpunkte sind
                mit verdeckt, sonst ließe sich die Zahl zurückrechnen.
              </div>
            )}
          </div>

          {/* ── Klassen ── */}
          <div className="einst-block">
            <div className="einst-titel">🎓 Klassen</div>
            <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
              Was hier steht, steht im Charakterbogen zur Wahl. Eine Hausklasse
              braucht nur Namen und Farbe — Trefferwürfel und Zauberattribut
              stehen ohnehin im Bogen des Helden.
            </div>

            {klassen.map((k,i) => {
              const genutzt = inBenutzung[k.name] || 0;
              return (
                <div className="einst-klasse" key={i}>
                  <input type="color" className="einst-farbe" value={k.color || '#8b9198'}
                    aria-label={'Farbe für ' + (k.name || 'Klasse')}
                    onChange={e=>aendern(i, {color:e.target.value})} />
                  <input className="form-input" value={k.name}
                    aria-label="Klassenname" placeholder="Name der Klasse"
                    onChange={e=>aendern(i, {name:e.target.value})} />
                  <span className="einst-genutzt">
                    {genutzt ? genutzt + (genutzt===1 ? ' Held' : ' Helden') : ''}
                  </span>
                  <button type="button" className="fx-del"
                    title={genutzt ? 'Wird noch gespielt — entfernen lässt die Klasse im Bogen stehen'
                                   : 'Entfernen'}
                    onClick={()=>entfernen(i)}>✕</button>
                </div>
              );
            })}

            <div className="einst-klassen-fuss">
              <button type="button" className="btn-icon" onClick={hinzu}>+ Klasse</button>
              {eigene && (
                <button type="button" className="btn-icon"
                  onClick={()=>klassenSetzen(KLASSEN_STANDARD.map(k=>({...k})))}>
                  ↺ Die zwölf des Regelwerks
                </button>
              )}
              {!eigene && (
                <span className="einst-hinweis" style={{margin:0}}>
                  Noch unverändert — das sind die zwölf des Regelwerks.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={onSpeichern}>💾 Speichern</button>
        </div>
      </div>
    </div>
  );
};
