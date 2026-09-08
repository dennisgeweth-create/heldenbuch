// Heldenbuch — der Charakterassistent.
//
// „✶ Neuer Charakter" war ein Formular mit fünf Feldern. Danach stand
// ein leerer Bogen da, und man trug zwei Stunden lang ein, was
// eigentlich aus den Regeln folgt.
//
// Sechs Schritte, jeder mit einem Satz Regelinfo — das ist der halbe
// Nutzen für jemanden, der neu ist. Gerechnet wird nicht hier, sondern
// in `assistentPlan`; das Fenster sammelt nur den Entwurf ein und zeigt,
// was daraus wird. Das Übernehmen schreibt genau dasselbe.
//
// Von Hand geht es weiter wie bisher: der Assistent ist ein Angebot.

const ASS_SCHRITTE = ['Volk', 'Klasse', 'Attribute', 'Hintergrund', 'Fertigkeiten', 'Ausrüstung'];

const CharakterAssistent = ({ klassen, onAbbrechen, onFertig, onVonHand }) => {
  const [schritt, setSchritt] = React.useState(0);
  const [e, setE] = React.useState({
    name: '', volk: '', untervolk: '', klasse: '', hintergrund: '',
    attribute: {}, wahlBoni: {}, fertigkeiten: [], ausruestung: '', gold: 0,
  });
  const setzen = (p) => setE(x => ({...x, ...p}));
  const plan = assistentPlan(e);

  const volk  = volkFinden(e.volk);
  const unter = unterFinden(volk, e.untervolk);
  const kl    = KLASSEN_REGELN[e.klasse] || null;
  const hg    = HINTERGRUENDE.find(h => h.name === e.hintergrund) || null;
  // Die Klassen des Abenteuers, nicht die der Regeln: hat die Runde
  // welche gestrichen, stehen sie hier auch nicht.
  const klassenListe = (klassen && klassen.length)
    ? klassen.map(k => k.name) : Object.keys(KLASSEN_REGELN);

  // ── Was jeder Schritt braucht, damit „Weiter" hell wird ────────
  const wahlBoniSumme = Object.values(e.wahlBoni || {}).reduce((a, b) => a + b, 0);
  const ausHg = hg ? hg.fert : [];
  const eigene = (e.fertigkeiten || []).filter(f => !ausHg.includes(f));
  const offen = [
    !e.name.trim() ? 'Ein Name fehlt.'
      : !volk ? 'Wähle ein Volk.'
      : (volk.unter || []).length && !unter ? 'Wähle eine Untergruppe.'
      : volk.wahlBoni && wahlBoniSumme !== volk.wahlBoni
        ? 'Verteile ' + volk.wahlBoni + ' Punkte auf verschiedene Attribute.' : '',
    !e.klasse ? 'Wähle eine Klasse.' : '',
    ATTR_WAHL.some(a => !e.attribute[a.k]) ? 'Die Attribute stehen noch nicht.' : '',
    !hg ? 'Wähle einen Hintergrund.' : '',
    !kl ? '' : eigene.length !== kl.fertZahl
      ? 'Genau ' + kl.fertZahl + ' Fertigkeiten — gewählt: ' + eigene.length + '.' : '',
    !e.ausruestung ? 'Paket oder Startgold.' : '',
  ];
  const hakt = offen[schritt];

  // ── Attribute ─────────────────────────────────────────────────
  const [art, setArt] = React.useState('satz');   // satz | kauf | wuerfel
  const kosten = punkteKosten(e.attribute);
  const satzFrei = STANDARD_SATZ.filter(w =>
    STANDARD_SATZ.filter(x => x === w).length
    > ATTR_WAHL.filter(a => e.attribute[a.k] === w).length);

  const attrSetzen = (k, v) => setzen({attribute: {...e.attribute, [k]: v || undefined}});

  const fertUm = (k) => {
    if (ausHg.includes(k)) return;                       // die stehen fest
    const drin = (e.fertigkeiten || []).includes(k);
    setzen({fertigkeiten: drin
      ? e.fertigkeiten.filter(x => x !== k)
      : [...e.fertigkeiten, k]});
  };

  const goldWuerfeln = () => {
    if (!kl || !kl.gold) return;
    const m = /^(\d+)W(\d+)(?:×(\d+))?$/.exec(kl.gold);
    if (!m) return;
    let summe = 0;
    for (let i = 0; i < +m[1]; i++) summe += 1 + Math.floor(Math.random() * +m[2]);
    setzen({ausruestung: 'gold', gold: summe * (+m[3] || 1)});
  };

  const fertList = !kl ? [] : (kl.fert === 'alle' ? SKILLS.map(x => x.key) : kl.fert);

  return (
    <Fenster>
      <div className="form-modal ass-fenster" onClick={ev=>ev.stopPropagation()}>
        <div className="form-title">✶ Neuer Charakter — Schritt für Schritt</div>

        <div className="ass-leiste">
          {ASS_SCHRITTE.map((n, i) => (
            <button type="button" key={n}
              className={'ass-punkt' + (i === schritt ? ' an' : '') + (offen[i] ? '' : ' fertig')}
              onClick={()=>setSchritt(i)}>
              <i>{i + 1}</i>{n}
            </button>
          ))}
        </div>

        <div className="ass-inhalt">
          {/* ── 1 · Volk ──────────────────────────────────────── */}
          {schritt === 0 && (
            <>
              <div className="form-group form-full">
                <div className="form-label">Name</div>
                <input className="form-input" value={e.name} autoFocus
                  placeholder="z.B. Brunhilde" onChange={ev=>setzen({name: ev.target.value})} />
              </div>
              <div className="ass-warum">Das Volk gibt Attributsboni, wie weit man geht,
                die Sprachen und ein paar Merkmale. Es ändert sich später nie wieder.</div>
              <div className="ass-wahl">
                {VOELKER.map(v => (
                  <button type="button" key={v.name}
                    className={'ass-karte' + (e.volk === v.name ? ' an' : '')}
                    onClick={()=>setzen({volk: v.name, untervolk: '', wahlBoni: {}})}>
                    <b>{v.name}</b>
                    <i>{ATTR_WAHL.filter(a => v.boni[a.k]).map(a => a.l + ' +' + v.boni[a.k]).join(', ')}</i>
                  </button>
                ))}
              </div>
              {volk && (volk.unter || []).length > 0 && (
                <div className="ass-wahl" style={{marginTop:8}}>
                  {volk.unter.map(u => (
                    <button type="button" key={u.name}
                      className={'ass-karte klein' + (e.untervolk === u.name ? ' an' : '')}
                      onClick={()=>setzen({untervolk: u.name})}>
                      <b>{u.name}</b>
                      <i>{ATTR_WAHL.filter(a => (u.boni||{})[a.k]).map(a => a.l + ' +' + u.boni[a.k]).join(', ')}
                        {u.tempo ? ' · ' + u.tempo + ' m' : ''}</i>
                    </button>
                  ))}
                </div>
              )}
              {volk && volk.wahlBoni > 0 && (
                <>
                  <div className="ass-warum" style={{marginTop:10}}>
                    Der Halbelf verteilt {volk.wahlBoni} Punkte selbst — auf zwei
                    verschiedene Attribute, nicht auf Charisma.
                  </div>
                  <div className="ass-wahl">
                    {ATTR_WAHL.filter(a => a.k !== 'cha').map(a => (
                      <button type="button" key={a.k}
                        className={'ass-karte klein' + ((e.wahlBoni||{})[a.k] ? ' an' : '')}
                        onClick={()=>{
                          const w = {...(e.wahlBoni || {})};
                          if (w[a.k]) delete w[a.k];
                          else if (Object.keys(w).length < volk.wahlBoni) w[a.k] = 1;
                          setzen({wahlBoni: w});
                        }}>
                        <b>{a.l}</b><i>{(e.wahlBoni||{})[a.k] ? '+1' : '—'}</i>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── 2 · Klasse ────────────────────────────────────── */}
          {schritt === 1 && (
            <>
              <div className="ass-warum">Die Klasse bestimmt den Trefferwürfel, zwei
                geübte Rettungswürfe, womit man kämpft — und ob man zaubert.</div>
              <div className="ass-wahl">
                {klassenListe.map(n => {
                  const k = KLASSEN_REGELN[n];
                  return (
                    <button type="button" key={n}
                      className={'ass-karte' + (e.klasse === n ? ' an' : '')}
                      onClick={()=>setzen({klasse: n, fertigkeiten: [], ausruestung: ''})}>
                      <b>{n}</b>
                      <i>{k ? 'W' + k.tw + ' · ' + k.rw.map(x => (ATTR_WAHL.find(a=>a.k===x)||{}).l).join(', ')
                            + (k.zauber ? ' · zaubert' : '') : 'eigene Klasse'}</i>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── 3 · Attribute ─────────────────────────────────── */}
          {schritt === 2 && (
            <>
              <div className="ass-warum">Sechs Werte. Der Standardsatz ist der
                schnellste Weg, der Punktekauf der gerechteste, die Würfel der
                aufregendste — und der einzige, bei dem es schiefgehen kann.</div>
              <div className="ass-tasten">
                {[['satz','Standardsatz'],['kauf','Punktekauf'],['wuerfel','4W6, schlechtester weg']].map(([k, l]) => (
                  <button type="button" key={k} className={'bj-taste' + (art === k ? ' haupt' : '')}
                    onClick={()=>{ setArt(k); setzen({attribute: {}});
                      if (k === 'wuerfel') setzen({attribute: attributeWuerfeln()}); }}>
                    {l}
                  </button>
                ))}
                {art === 'wuerfel' && (
                  <button type="button" className="bj-taste"
                    onClick={()=>setzen({attribute: attributeWuerfeln()})}>Nochmal</button>
                )}
              </div>
              {art === 'kauf' && (
                <div className={'ass-kauf' + (kosten > PUNKTE_GESAMT ? ' zuviel' : '')}>
                  {Math.min(kosten, 99)} von {PUNKTE_GESAMT} Punkten
                  {kosten > PUNKTE_GESAMT ? ' — zu viel' : ''}
                </div>
              )}
              <div className="ass-attr">
                {ATTR_WAHL.map(a => {
                  const wert = e.attribute[a.k];
                  const bonus = ((volk && volk.boni[a.k]) || 0)
                    + ((unter && (unter.boni||{})[a.k]) || 0) + ((e.wahlBoni||{})[a.k] || 0);
                  return (
                    <div className="ass-attr-zeile" key={a.k}>
                      <span className="ass-attr-name">{a.l}</span>
                      {art === 'satz' ? (
                        <select className="form-select" value={wert || ''}
                          onChange={ev=>attrSetzen(a.k, +ev.target.value)}>
                          <option value="">—</option>
                          {[...new Set([...satzFrei, wert].filter(Boolean))]
                            .sort((x, y) => y - x).map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      ) : art === 'kauf' ? (
                        <select className="form-select" value={wert || ''}
                          onChange={ev=>attrSetzen(a.k, +ev.target.value)}>
                          <option value="">—</option>
                          {Object.keys(PUNKTE_KOSTEN).map(w =>
                            <option key={w} value={w}>{w} ({PUNKTE_KOSTEN[w]})</option>)}
                        </select>
                      ) : (
                        <span className="ass-attr-wurf">{wert || '—'}</span>
                      )}
                      <span className="ass-attr-summe">
                        {wert ? (wert + bonus) : '—'}
                        {wert && bonus ? <i> (+{bonus})</i> : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── 4 · Hintergrund ───────────────────────────────── */}
          {schritt === 3 && (
            <>
              <div className="ass-warum">Der Hintergrund sagt, was der Held vor dem
                ersten Abenteuer getan hat. Er gibt zwei geübte Fertigkeiten — die
                stehen fest und zählen nicht gegen die der Klasse.</div>
              <div className="ass-wahl">
                {HINTERGRUENDE.map(h => (
                  <button type="button" key={h.name}
                    className={'ass-karte' + (e.hintergrund === h.name ? ' an' : '')}
                    onClick={()=>setzen({hintergrund: h.name})}>
                    <b>{h.name}</b>
                    <i>{h.fert.map(f => (SKILLS.find(s=>s.key===f)||{}).label).join(', ')} · {h.merkmal}</i>
                  </button>
                ))}
              </div>
              {hg && <div className="ass-warum" style={{marginTop:8}}>Dazu: {hg.dazu}.</div>}
            </>
          )}

          {/* ── 5 · Fertigkeiten ──────────────────────────────── */}
          {schritt === 4 && (
            <>
              <div className="ass-warum">
                {kl ? 'Genau ' + kl.fertZahl + ' aus der Liste der Klasse.' : 'Erst die Klasse.'}
                {ausHg.length ? ' Die zwei vom Hintergrund sind schon vergeben — eine davon '
                  + 'noch einmal zu nehmen bringt nichts.' : ''}
              </div>
              <div className="ass-wahl">
                {fertList.map(k => {
                  const fest = ausHg.includes(k);
                  const an = fest || (e.fertigkeiten || []).includes(k);
                  const voll = kl && eigene.length >= kl.fertZahl && !an;
                  return (
                    <button type="button" key={k} disabled={fest || voll}
                      className={'ass-karte klein' + (an ? ' an' : '') + (fest ? ' fest' : '')}
                      onClick={()=>fertUm(k)}>
                      <b>{(SKILLS.find(s=>s.key===k)||{}).label}</b>
                      <i>{fest ? 'vom Hintergrund' : (SKILLS.find(s=>s.key===k)||{}).attr.toUpperCase()}</i>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── 6 · Ausrüstung ────────────────────────────────── */}
          {schritt === 5 && (
            <>
              <div className="ass-warum">Entweder das Paket der Klasse oder Startgold —
                nie beides. Wer Gold nimmt, kauft selbst ein.</div>
              <div className="ass-wahl">
                <button type="button" className={'ass-karte' + (e.ausruestung === 'paket' ? ' an' : '')}
                  onClick={()=>setzen({ausruestung: 'paket', gold: 0})}>
                  <b>Das Paket</b><i>{kl ? (kl.paket || []).join(', ') : '—'}</i>
                </button>
                <button type="button" className={'ass-karte' + (e.ausruestung === 'gold' ? ' an' : '')}
                  onClick={goldWuerfeln}>
                  <b>Startgold {kl ? '· ' + kl.gold : ''}</b>
                  <i>{e.ausruestung === 'gold' ? e.gold + ' Goldmünzen — nochmal klicken zum Neuwürfeln'
                                               : 'wird gewürfelt'}</i>
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Die Vorschau steht immer da ───────────────────────── */}
        <div className="form-label" style={{marginTop:10}}>Das steht danach im Bogen</div>
        <div className="auf-vorschau ass-vorschau">
          {plan.zeilen.length === 0
            ? <div className="auf-nichts">Noch nichts entschieden.</div>
            : plan.zeilen.map((z, i) => (
                <div className="auf-zeile" key={i}><span>{z.was}</span><b>{z.neu}</b></div>
              ))}
        </div>

        {plan.fehlt.length > 0 && (
          <div className="auf-warnung">
            <div>Es fehlt noch: {plan.fehlt.join(' · ')}</div>
          </div>
        )}

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          {/* Der Weg von Hand stand in der Heldenleiste neben „Neuer
              Charakter" — an einer Stelle, an der man ihn wählen musste,
              bevor man wusste, was der Assistent überhaupt fragt. Hier
              steht er da, wo man ihn braucht: wenn er einem zu langsam
              geht. Eingetragenes bleibt dabei zurück, deshalb nur im
              ersten Schritt. */}
          {onVonHand && schritt === 0 && (
            <button className="btn-cancel" onClick={onVonHand}
              title="Nur Name, Volk, Hintergrund und Klasse — den Rest trägst du selbst ein">
              ✎ Lieber von Hand
            </button>
          )}
          {schritt > 0 && (
            <button className="btn-cancel" onClick={()=>setSchritt(schritt - 1)}>Zurück</button>
          )}
          {schritt < ASS_SCHRITTE.length - 1 ? (
            <button className="btn-save" disabled={!!hakt} title={hakt || ''}
              onClick={()=>setSchritt(schritt + 1)}>
              {hakt || 'Weiter'}
            </button>
          ) : (
            <button className="btn-save" disabled={plan.fehlt.length > 0}
              onClick={()=>onFertig(plan)}>
              {plan.fehlt.length > 0 ? 'Es fehlt noch etwas' : 'Charakter anlegen'}
            </button>
          )}
        </div>
      </div>
    </Fenster>
  );
};
