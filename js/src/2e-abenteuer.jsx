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

  const kampfSicht = KAMPF_SICHT.some(x => x.k === adv.kampfSicht) ? adv.kampfSicht : 'auto';

  // Fuer die Zeile, die zugeklappt neben dem Titel steht.
  const zugeordnet = (helden || []).filter(h => (besitzer || {})[h.id]).length;

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

        <div className="einst-roll">
          <div className="form-group form-full" style={{marginBottom:18}}>
            <label className="form-label">Name des Abenteuers</label>
            <input className="form-input" value={adv.name||''}
              onChange={e=>setzen({name:e.target.value})} placeholder="z.B. Strahd" />
          </div>

          {/* ── Trefferpunkte ── */}
          <EinstBlock titel="❤ Trefferpunkte" kurz={adv.hpVerdeckt ? 'Verdeckt' : 'Offen'}>
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
          </EinstBlock>

          {/* ── Der Kampf ── */}
          <EinstBlock titel="⚔ Kampftracker"
            kurz={(adv.zugfenster === false ? 'ohne Zugfenster' : 'mit Zugfenster')
                  + ' · Runde ' + (KAMPF_SICHT.find(x => x.k === kampfSicht) || {}).kurz}>
            <label className="einst-dm-zeile">
              <input type="checkbox" checked={adv.zugfenster !== false}
                onChange={e=>setzen({zugfenster: e.target.checked})} />
              <span>Zugfenster anbieten</span>
            </label>
            <div className="einst-hinweis">
              Auf der Karte dessen, der am Zug ist, steht dann <b>✍ Zug eintragen</b>. Darin
              wählt die Spielleitung Waffe oder Zauber, tippt Ziele an und trägt ein, was
              ankommt — die Trefferpunkte rechnet das Fenster mit und schreibt den Zug ins
              Protokoll. Ohne Häkchen bleibt der Tracker, wie er war.
            </div>

            <div className="einst-titel" style={{marginTop:16}}>👁 Was die Runde sieht</div>
            <div className="einst-wahl drei">
              {KAMPF_SICHT.map(w => (
                <button type="button" key={w.k}
                  className={'einst-option' + (kampfSicht === w.k ? ' aktiv' : '')}
                  onClick={()=>setzen({kampfSicht: w.k})}>
                  <b>{w.l}</b><i>{w.t}</i>
                </button>
              ))}
            </div>
            <div className="einst-hinweis">
              Die Spieler sehen die Initiativliste, wer am Zug ist und wie es den Figuren
              geht — <b>nie die Trefferpunkte der Gegner</b>, nie ihre Rüstungsklasse, nie
              deine Notizen und nie das Protokoll. Der Zustand steht da wie im Bogen:
              „Schwer verwundet“ statt einer Zahl. Bei den Helden gilt weiter, was oben unter
              Trefferpunkte eingestellt ist. Der Server hält sich daran, nicht die Anzeige.
            </div>
          </EinstBlock>

          {/* ── Der Automat ── */}
          <EinstBlock titel="🎰 Automat der Taverne"
            kurz={(rechnung.quote * 100).toFixed(0) + ' % · Vollbild '
                  + (autoVoll ? '1 auf ' + autoVoll : 'aus')}>
            <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
              Häufigkeit sagt, wie oft ein Symbol fällt; Auszahlung, was drei
              davon auf einer Linie bringen — als Vielfaches des Einsatzes.
              Beides zusammen mit dem Vollbild ergibt die Quote, und die steht
              daneben: sie wird gerechnet, nicht geschätzt.
            </div>

            <div className="einst-quote">
              <span className="einst-quote-label">Auszahlungsquote</span>
              <b>{(rechnung.quote * 100).toFixed(1).replace('.', ',')} %</b>
              <ZahlFeld className="form-input einst-ziel" min={10} max={200}
                aria-label="Zielquote in Prozent" wert={ziel}
                onWert={v =>setZiel(v)} />
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
                        <ZahlFeld className="form-input" min={0} max={999}
                          aria-label={'Häufigkeit ' + sym.name} wert={sym.gewicht}
                          onWert={v =>autoSetzen(autoSym.map((x,j) =>
                            j===i ? {...x, gewicht: v} : x))} />
                      </td>
                      <td>
                        <ZahlFeld className="form-input" min={0} max={99999} step="0.05"
                          aria-label={'Auszahlung ' + sym.name} wert={sym.zahlt}
                          onWert={v =>autoSetzen(autoSym.map((x,j) =>
                            j===i ? {...x, zahlt: v} : x))} />
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
          </EinstBlock>

          {/* ── Wer leitet dieses Abenteuer ── */}
          {(mitglieder || []).length > 0 && (
            <EinstBlock titel="🔮 Spielleitung dieses Abenteuers"
              kurz={(advDms || []).length
                ? (advDms || []).length + (((advDms || []).length === 1) ? ' Konto' : ' Konten')
                : 'jede Spielleitung'}>
              <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
                {(advDms || []).length === 0
                  ? 'Niemand eingetragen — dann leitet es jede Spielleitung der Gruppe. Wer hier steht, leitet es allein.'
                  : 'Nur wer hier steht, kommt in diesem Abenteuer in den DM-Modus, an fremde Bögen und an die verdeckten Trefferpunkte.'}
                {' '}Das gilt je Abenteuer: wer hier den Schirm hält, kann nebenan mitspielen.
                {!istAdmin && ' Ändern kann das nur die Verwaltung.'}
              </div>
              {(mitglieder || []).map(m => {
                const drin = (advDms || []).includes(m.id);
                return (
                  <label className="einst-dm-zeile" key={m.id}>
                    <input type="checkbox" checked={drin} disabled={!istAdmin}
                      onChange={()=>onAdvDms(drin ? (advDms || []).filter(x => x !== m.id)
                                                  : [...(advDms || []), m.id])} />
                    <span>{m.name}{m.rolle === 'dm' ? ' · Spielleitung der Gruppe' : ''}</span>
                  </label>
                );
              })}
            </EinstBlock>
          )}

          {/* ── Wem gehoert welcher Held ── */}
          <EinstBlock titel="🧑 Helden und ihre Konten"
            kurz={zugeordnet + ' von ' + (helden || []).length + ' zugeordnet'}>
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
          </EinstBlock>

          {/* ── Klassen ── */}
          <EinstBlock titel="🎓 Klassen"
            kurz={klassen.length + (klassen.length === 1 ? ' Klasse' : ' Klassen')
                  + (eigene ? '' : ' · Regelwerk')}>
            <div className="einst-hinweis" style={{marginTop:0,marginBottom:10}}>
              Was hier steht, steht im Charakterbogen zur Wahl. Name und Farbe
              genügen; das Attribut sagt, womit die Klasse zaubert — daran hängen
              im Bogen der Zauber-SG und der Zauberangriff. „Zaubert nicht“ lässt
              beide weg. Der Trefferwürfel steht weiter im Bogen des Helden.
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
                  <select className="form-select einst-attr"
                    aria-label={'Zauberattribut von ' + (k.name || 'Klasse')}
                    title="Womit diese Klasse zaubert"
                    value={k.attr !== undefined ? (k.attr || '') : (SPELL_ATTR[k.name] || '')}
                    onChange={e=>aendern(i, {attr: e.target.value})}>
                    <option value="">zaubert nicht</option>
                    {ATTR_WAHL.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
                  </select>
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
          </EinstBlock>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={onSpeichern}>💾 Speichern</button>
        </div>
      </div>
    </div>
  );
};
