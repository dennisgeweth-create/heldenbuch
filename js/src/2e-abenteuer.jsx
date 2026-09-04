// ── Einstellungen eines Abenteuers ───────────────────────────────
// Was hier steht, gilt fuer alle in der Gruppe — es liegt in derselben
// geteilten Datenbank wie die Abenteuerliste selbst. Deshalb sind es
// bewusst wenige, klar benannte Schalter und keine Sammelkiste.
const AbenteuerEinstellungen = ({ adv, helden, onAendern, onSpeichern, onAbbrechen,
                                  besitzer, mitglieder, onBesitzer,
                                  advDms, istAdmin, onAdvDms }) => {
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

  // Der Automat: nur Haeufigkeit und Auszahlung sind einstellbar. Name und
  // Zeichen bleiben, sonst waere die Auszahlungstafel im Automaten eine
  // andere als die hier.
  const [ziel, setZiel] = React.useState(90);
  const autoSym  = automatSymbole(adv.automat);
  const autoVoll = automatVollbildEins(adv.automat);
  const autoVollP = automatVollbildP(adv.automat);
  const rechnung = automatRechnung(autoSym, autoVollP);
  const autoSetzen = (liste) => setzen({automat: {...(adv.automat||{}),
    symbole: liste.map(x => ({k:x.k, gewicht:x.gewicht, zahlt:x.zahlt}))}});
  const autoFeld = (p) => setzen({automat: {...(adv.automat||{}), ...p}});
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

          {/* ── Der Automat ── */}
          <div className="einst-block">
            <div className="einst-titel">🎰 Automat der Taverne</div>
            <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
              Häufigkeit sagt, wie oft ein Symbol fällt; Auszahlung, was drei
              davon auf einer Linie bringen — als Vielfaches des Einsatzes.
              Beides zusammen mit dem Vollbild ergibt die Quote, und die steht
              daneben: sie wird gerechnet, nicht geschätzt.
            </div>

            <div className="einst-quote">
              <span className="einst-quote-label">Auszahlungsquote</span>
              <b>{(rechnung.quote * 100).toFixed(1).replace('.', ',')} %</b>
              <input className="form-input einst-ziel" type="number" min={10} max={200}
                aria-label="Zielquote in Prozent" value={ziel}
                onChange={e=>setZiel(Math.max(10, Math.min(200, +e.target.value || 0)))} />
              <button type="button" className="btn-icon"
                onClick={()=>autoSetzen(automatEinregeln(autoSym, ziel / 100, autoVollP))}>
                auf {ziel} % einregeln
              </button>
            </div>

            {/* Das Bonusspiel. Es zieht seinen Anteil aus derselben Quote —
                haeufiger heisst kleinere Linien, und genau das steht da. */}
            <div className="einst-quote">
              <span className="einst-quote-label">Vollbild</span>
              <select className="form-select einst-vollwahl" value={autoVoll}
                aria-label="Häufigkeit des Vollbilds"
                onChange={e=>autoFeld({vollbild: +e.target.value})}>
                <option value={0}>aus — nur, wenn es von allein fällt</option>
                {VOLLBILD_STUFEN.map(n => (
                  <option key={n} value={n}>1 auf {n} Drehungen</option>
                ))}
              </select>
            </div>
            <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
              Neun gleiche Speisen: fünf Linien auf einmal und danach das Rad
              der Fortuna — das Bonusspiel des Automaten. Von allein fällt das
              praktisch nie, deshalb wird es gezogen.{' '}
              {autoVoll ? (
                <b>Davon kommen {(rechnung.bonus * 100).toFixed(0)} % der Quote.</b>
              ) : (
                <b>Ohne Vollbild liegt die ganze Quote auf den Linien.</b>
              )}{' '}
              Häufiger heißt kleinere Linien: nach dem Umstellen wieder
              einregeln, dann stimmen die Auszahlungen dazu.
              {rechnung.quote > 1.05 && (
                <b className="einst-warnung"> Über 100 % — auf Dauer zahlt das Haus drauf.</b>
              )}
            </div>

            <div className="tabellenhuelle">
              <table className="einst-automat">
                <thead>
                  <tr><th colSpan={2}>Symbol</th><th>Häufigkeit</th><th>Auszahlung</th></tr>
                </thead>
                <tbody>
                  {autoSym.map((sym, i) => (
                    <tr key={sym.k}>
                      <td className="zeichen">{sym.z}</td>
                      <td className="name">{sym.name}</td>
                      <td>
                        <input className="form-input" type="number" min={0} max={999}
                          aria-label={'Häufigkeit ' + sym.name} value={sym.gewicht}
                          onChange={e=>autoSetzen(autoSym.map((x,j) =>
                            j===i ? {...x, gewicht: Math.max(0, +e.target.value || 0)} : x))} />
                      </td>
                      <td>
                        <input className="form-input" type="number" min={0} max={99999} step="0.05"
                          aria-label={'Auszahlung ' + sym.name} value={sym.zahlt}
                          onChange={e=>autoSetzen(autoSym.map((x,j) =>
                            j===i ? {...x, zahlt: Math.max(0, +e.target.value || 0)} : x))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="einst-klassen-fuss">
              <label className="einst-max">
                Höchsteinsatz
                <select className="form-select" value={(adv.automat && adv.automat.maxEinsatz) || 0}
                  onChange={e=>setzen({automat: {...(adv.automat||{}), maxEinsatz: +e.target.value || 0}})}>
                  <option value={0}>ohne Grenze</option>
                  {AUTOMAT_EINSAETZE.map(n2 => <option key={n2} value={n2}>{n2} Marken</option>)}
                </select>
              </label>
              {adv.automat && adv.automat.symbole && (
                <button type="button" className="btn-icon"
                  onClick={()=>setzen({automat: {...(adv.automat||{}), symbole: undefined}})}>
                  ↺ Standardautomat
                </button>
              )}
            </div>
            <div className="einst-hinweis">
              Gespielt wird mit Spielmarken, die im Gerät jedes Einzelnen liegen —
              nichts davon berührt einen Charakterbogen. Wer einen zwielichtigen
              Automaten will, regelt ihn auf 80 % ein und sagt nichts.
            </div>
          </div>

          {/* ── Wer leitet dieses Abenteuer ── */}
          {(mitglieder || []).some(m => m.rolle === 'dm') && (
            <div className="einst-block">
              <div className="einst-titel">🔮 Spielleitung dieses Abenteuers</div>
              <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
                {(advDms || []).length === 0
                  ? 'Niemand eingetragen — dann leitet es jede Spielleitung der Gruppe. Wer hier steht, leitet es allein.'
                  : 'Nur wer hier steht, kommt in diesem Abenteuer in den DM-Modus, an fremde Bögen und an die verdeckten Trefferpunkte.'}
                {!istAdmin && ' Ändern kann das nur die Verwaltung.'}
              </div>
              {(mitglieder || []).filter(m => m.rolle === 'dm').map(m => {
                const drin = (advDms || []).includes(m.id);
                return (
                  <label className="einst-dm-zeile" key={m.id}>
                    <input type="checkbox" checked={drin} disabled={!istAdmin}
                      onChange={()=>onAdvDms(drin ? (advDms || []).filter(x => x !== m.id)
                                                  : [...(advDms || []), m.id])} />
                    <span>{m.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* ── Wem gehoert welcher Held ── */}
          <div className="einst-block">
            <div className="einst-titel">🧑 Helden und ihre Konten</div>
            <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
              Ein zugeordneter Bogen lässt sich nur noch von seinem Konto ändern —
              und von dir. Was hier niemandem gehört, bleibt für alle offen; die
              Zuordnung macht es strenger, nie kaputt. Der Server hält sich daran,
              nicht die Anzeige.
            </div>
            {!(mitglieder || []).length ? (
              <div className="einst-hinweis" style={{margin:0}}>
                In dieser Gruppe hat noch niemand ein Konto. Solange das so ist,
                gehört kein Bogen jemandem — genau wie bisher.
              </div>
            ) : (helden || []).length === 0 ? (
              <div className="einst-hinweis" style={{margin:0}}>Kein Held in diesem Abenteuer.</div>
            ) : (
              (helden || []).map(h => (
                <div className="einst-klasse" key={h.id}>
                  <span className="einst-besitz-name">{h.name || 'Namenlos'}</span>
                  <select className="form-select" aria-label={'Konto für ' + (h.name || 'Held')}
                    value={(besitzer && besitzer[h.id]) || ''}
                    onChange={e=>onBesitzer(h.id, e.target.value)}>
                    <option value="">— niemandem —</option>
                    {(mitglieder || []).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.rolle === 'dm' ? ' (DM)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))
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
