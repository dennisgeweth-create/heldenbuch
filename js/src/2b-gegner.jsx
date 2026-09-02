// Heldenbuch — Gegner der Spielleitung.
//
// Eigene Datei, damit 4-app.jsx nicht weiter waechst. Die Bausteine
// bekommen alles ueber Eigenschaften statt ueber den Kontext: sie gehoeren
// zum DM-Bereich, nicht zum Charakterbogen.
//
// Gegner liegen zeilenweise auf dem Server, nicht in der DM-Bibliothek.
// Sonst lüde jede Aenderung an einem Goblin die ganze Sammlung hoch, und
// mit Bildern waere deren 2-MB-Grenze nach rund dreissig Portraets
// erreicht.

// Herausforderungsgrade in Spielreihenfolge, nicht alphabetisch: "1/8"
// gehoert vor "1", und "10" hinter "9".
const CR_ORDNUNG = ['0','1/8','1/4','1/2','1','2','3','4','5','6','7','8','9','10',
  '11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26',
  '27','28','29','30'];
const crRang = (cr) => {
  const i = CR_ORDNUNG.indexOf(String(cr||'').trim());
  return i === -1 ? 999 : i;
};

// Die fuenf Aktionslisten haben dieselbe Form {name, bonus, damage, type} —
// deshalb ein Editor fuer alle statt fuenf gleichlautender.
const GEGNER_LISTEN = [
  {key:'attacks',          label:'Angriffe'},
  {key:'bonusActions',     label:'Bonusaktionen'},
  {key:'reactions',        label:'Reaktionen'},
  {key:'legendaryActions', label:'Legendäre Aktionen'},
  {key:'lairActions',      label:'Schauplatzaktionen'},
];

const newEnemy = () => ({
  id: 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
  name:'', type:'Humanoid', cr:'1/4', size:'Mittel',
  ac:12, hpMax:10, hpDice:'2d8',
  str:10, dex:10, con:10, int:10, wis:10, cha:10, speed:9,
  attacks:[], traits:[], tags:[], image:null,
});

// ── Werteübersicht ───────────────────────────────────────────────
const GegnerBlatt = ({ gegner, onSchliessen, onBearbeiten, onLoeschen, onBild }) => {
  if (!gegner) return null;
  const g = gegner;
  const attr = [['str','STR'],['dex','GES'],['con','KON'],['int','INT'],['wis','WEI'],['cha','CHA']];
  const listen = GEGNER_LISTEN.filter(l => (g[l.key]||[]).length > 0);
  return (
    <div className="form-overlay" onClick={onSchliessen}>
      <div className="form-modal gegner-blatt" onClick={e=>e.stopPropagation()}>
        <div className="gegner-blatt-kopf">
          {g.image && (
            <img className="gegner-blatt-bild" src={g.image} alt=""
              onClick={()=>onBild && onBild({name:g.name, imageData:g.image})} />
          )}
          <div className="gegner-blatt-titel">
            <div className="gegner-blatt-name">{g.name}</div>
            <div className="gegner-blatt-sub">{g.size} · {g.type} · Herausforderung {g.cr}</div>
          </div>
          <button className="gegner-blatt-zu" onClick={onSchliessen} aria-label="Schließen">✕</button>
        </div>

        <div className="gegner-blatt-koerper">
          <div className="gegner-kernwerte">
            <div><span>Rüstungsklasse</span><b>{g.ac}</b></div>
            <div><span>Trefferpunkte</span><b>{g.hpMax}{g.hpDice ? ' (' + g.hpDice + ')' : ''}</b></div>
            <div><span>Bewegung</span><b>{g.speed} m</b></div>
          </div>

          <div className="gegner-attribute">
            {attr.map(([k,l]) => (
              <div className="gegner-attr" key={k}>
                <span>{l}</span>
                <b>{g[k]}</b>
                <i>{fnum(mod(g[k]))}</i>
              </div>
            ))}
          </div>

          {(g.tags||[]).length > 0 && (
            <div className="gegner-marken">
              {(g.tags||[]).map(t => <span className="inv-tag" key={t}>{t}</span>)}
            </div>
          )}

          {(g.traits||[]).length > 0 && (
            <div className="gegner-abschnitt">
              <div className="gegner-abschnitt-titel">Merkmale</div>
              {(g.traits||[]).map((t,i) => <div className="gegner-merkmal" key={i}>{t}</div>)}
            </div>
          )}

          {listen.map(l => (
            <div className="gegner-abschnitt" key={l.key}>
              <div className="gegner-abschnitt-titel">{l.label}</div>
              {(g[l.key]||[]).map((a,i) => (
                <div className="gegner-aktion" key={i}>
                  <div className="gegner-aktion-name">{a.name}</div>
                  {(a.bonus || a.damage) && (
                    <div className="gegner-aktion-werte">
                      {a.bonus ? <span>{fnum(a.bonus)} zum Treffen</span> : null}
                      {a.damage ? <span>{a.damage}{a.type ? ' ' + a.type : ''}</span> : null}
                      {a.range ? <span>{a.range}</span> : null}
                      {a.dc ? <span>{a.dc}</span> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-icon" style={{flex:1}} onClick={onBearbeiten}>✎ Bearbeiten</button>
          <button className="gegner-loeschen" onClick={onLoeschen}>✕ Löschen</button>
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
      </div>
    </div>
  );
};

// ── Bearbeiten ───────────────────────────────────────────────────
const GegnerFormular = ({ form, setForm, onSpeichern, onAbbrechen, neu }) => {
  if (!form) return null;
  const f = form;
  const setzen = (patch) => setForm({...f, ...patch});
  const liste = (key) => f[key] || [];
  const setListe = (key, wert) => setzen({[key]: wert});

  return (
    <div className="form-overlay">
      <div className="form-modal" style={{maxWidth:560}}>
        <div className="form-title">{neu ? '💀 Neuer Gegner' : '✎ Gegner bearbeiten'}</div>
        <div className="form-grid" style={{maxHeight:'62vh',overflowY:'auto',paddingRight:4}}>

          <div className="form-group form-full">
            <label className="form-label">Name</label>
            <input className="form-input" value={f.name} autoFocus
              onChange={e=>setzen({name:e.target.value})} placeholder="z.B. Vampir-Spawn" />
          </div>

          <div className="form-group">
            <label className="form-label">Art</label>
            <input className="form-input" value={f.type||''} onChange={e=>setzen({type:e.target.value})} placeholder="Untoter" />
          </div>
          <div className="form-group">
            <label className="form-label">Herausforderung</label>
            <input className="form-input" list="hb-cr-liste" value={f.cr||''} onChange={e=>setzen({cr:e.target.value})} placeholder="1/4" />
            <datalist id="hb-cr-liste">{CR_ORDNUNG.map(c=><option key={c} value={c}/>)}</datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Größe</label>
            <select className="form-select" value={f.size||'Mittel'} onChange={e=>setzen({size:e.target.value})}>
              {['Winzig','Klein','Mittel','Groß','Riesig','Gigantisch'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rüstungsklasse</label>
            <input className="form-input" type="number" value={f.ac} onChange={e=>setzen({ac:+e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Trefferpunkte</label>
            <input className="form-input" type="number" value={f.hpMax} onChange={e=>setzen({hpMax:+e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Würfel</label>
            <input className="form-input" value={f.hpDice||''} onChange={e=>setzen({hpDice:e.target.value})} placeholder="2d8+4" />
          </div>
          <div className="form-group">
            <label className="form-label">Bewegung (m)</label>
            <input className="form-input" type="number" value={f.speed} onChange={e=>setzen({speed:+e.target.value})} />
          </div>

          <div className="form-group form-full">
            <label className="form-label">Attribute</label>
            <div className="gegner-attr-eingabe">
              {[['str','STR'],['dex','GES'],['con','KON'],['int','INT'],['wis','WEI'],['cha','CHA']].map(([k,l])=>(
                <div key={k}>
                  <span>{l}</span>
                  <input className="form-input" type="number" min={1} max={30} value={f[k]}
                    aria-label={l} onChange={e=>setzen({[k]:+e.target.value})} />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group form-full">
            <label className="form-label">Schlagworte <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>(kommagetrennt)</span></label>
            <input className="form-input" value={(f.tags||[]).join(', ')}
              onChange={e=>setzen({tags:e.target.value.split(',').map(t=>t.trim()).filter(Boolean)})}
              placeholder="z.B. Strahd, Boss, Untot" />
          </div>

          <div className="form-group form-full">
            <label className="form-label">Bild (optional)</label>
            <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              {f.image && (
                <div style={{position:'relative',flexShrink:0}}>
                  <img src={f.image} alt="" style={{width:84,height:84,objectFit:'cover',borderRadius:5,border:'1px solid var(--border)'}} />
                  <button onClick={()=>setzen({image:null})} aria-label="Bild entfernen"
                    style={{position:'absolute',top:-7,right:-7,width:20,height:20,borderRadius:'50%',background:'var(--crimson)',border:'none',color:'#fff',fontSize:10,cursor:'pointer'}}>✕</button>
                </div>
              )}
              <label style={{flex:1,padding:'11px 14px',background:'var(--bg-card)',border:'1px dashed var(--border)',borderRadius:6,cursor:'pointer',textAlign:'center',fontSize:12,color:'var(--text-muted)',fontFamily:"'Roboto Condensed',sans-serif"}}>
                📷 Bild wählen
                {/* Gegner liegen einzeln auf dem Server, deshalb ist hier
                    mehr Platz als beim Heldenbild — 800px lange Kante. */}
                <input type="file" accept="image/*" style={{display:'none'}}
                  onChange={e=>{
                    const d=e.target.files && e.target.files[0]; e.target.value='';
                    if(d) compressImage(d, 800, daten => { if(daten) setzen({image:daten}); });
                  }} />
              </label>
            </div>
          </div>

          <div className="form-group form-full">
            <label className="form-label">Merkmale <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>(eine Zeile je Merkmal)</span></label>
            <textarea className="form-input" rows={3} style={{resize:'vertical'}}
              value={(f.traits||[]).join('\n')}
              onChange={e=>setzen({traits:e.target.value.split('\n').map(t=>t.trim()).filter(Boolean)})}
              placeholder={'Immunität: Gift\nRegeneration 10/Runde'} />
          </div>

          {GEGNER_LISTEN.map(l => (
            <div className="form-group form-full" key={l.key}>
              <label className="form-label">{l.label}</label>
              {liste(l.key).length === 0 && (
                <div style={{fontSize:11.5,color:'var(--text-muted)',fontStyle:'italic',marginBottom:6}}>Noch nichts eingetragen.</div>
              )}
              {liste(l.key).map((a,i) => (
                <div className="gegner-aktion-zeile" key={i}>
                  <input className="form-input" value={a.name||''} placeholder="Name"
                    aria-label="Name" onChange={e=>setListe(l.key, liste(l.key).map((x,j)=>j===i?{...x,name:e.target.value}:x))} />
                  <input className="form-input" type="number" value={a.bonus||0} title="Bonus zum Treffen"
                    aria-label="Bonus" onChange={e=>setListe(l.key, liste(l.key).map((x,j)=>j===i?{...x,bonus:+e.target.value}:x))} />
                  <input className="form-input" value={a.damage||''} placeholder="1d6+2"
                    aria-label="Schaden" onChange={e=>setListe(l.key, liste(l.key).map((x,j)=>j===i?{...x,damage:e.target.value}:x))} />
                  <input className="form-input" value={a.type||''} placeholder="Hieb"
                    aria-label="Schadensart" onChange={e=>setListe(l.key, liste(l.key).map((x,j)=>j===i?{...x,type:e.target.value}:x))} />
                  <button className="fx-del" type="button" title="Entfernen"
                    onClick={()=>setListe(l.key, liste(l.key).filter((_,j)=>j!==i))}>✕</button>
                </div>
              ))}
              <button type="button" className="btn-add" style={{width:'100%',marginTop:4}}
                onClick={()=>setListe(l.key, [...liste(l.key), {name:'',bonus:0,damage:'',type:''}])}>
                + {l.label.replace(/e$/,'')} hinzufügen
              </button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={onSpeichern}>💾 Speichern</button>
        </div>
      </div>
    </div>
  );
};

// ── Liste im Datenbank-Dialog ────────────────────────────────────
const GegnerListe = ({ enemies, geladen, suche, setSuche, crFilter, setCrFilter,
                       tagFilter, setTagFilter, onAnsehen, onNeu, onImport, importBusy }) => {
  const alleTags = [...new Set(enemies.flatMap(e => e.tags || []))].sort((a,b)=>a.localeCompare(b,'de'));
  const alleCr   = [...new Set(enemies.map(e => e.cr).filter(Boolean))].sort((a,b)=>crRang(a)-crRang(b));
  const q = (suche||'').trim();
  const gefiltert = enemies.filter(e => {
    if (crFilter && e.cr !== crFilter) return false;
    if (tagFilter && !(e.tags||[]).includes(tagFilter)) return false;
    if (!q) return true;
    return containsFold(e.name||'', q) || containsFold(e.type||'', q)
        || containsFold((e.tags||[]).join(' '), q) || containsFold((e.traits||[]).join(' '), q);
  }).sort((a,b) => crRang(a.cr)-crRang(b.cr) || (a.name||'').localeCompare(b.name||'','de'));

  return (
    <div className="gegner-liste-huelle">
      <div className="gegner-werkzeuge">
        <input className="form-input gegner-suche" type="search" value={suche||''}
          placeholder={enemies.length + ' Gegner durchsuchen…'} aria-label="Gegner durchsuchen"
          onChange={e=>setSuche(e.target.value)} />
        <select className="tpl-filter-select" value={crFilter||''} onChange={e=>setCrFilter(e.target.value)} aria-label="Herausforderungsgrad">
          <option value="">Alle Grade</option>
          {alleCr.map(c=><option key={c} value={c}>HG {c}</option>)}
        </select>
        <button className="btn-icon" onClick={onNeu}>+ Neu</button>
      </div>

      {alleTags.length > 0 && (
        <div className="tag-filter-bar">
          {alleTags.map(t => (
            <button key={t} className={"tag-filter-btn"+(tagFilter===t?" active":"")}
              onClick={()=>setTagFilter(tagFilter===t?'':t)}>{t}</button>
          ))}
        </div>
      )}

      {enemies.length === 0 ? (
        <div className="gegner-leer">
          <p>{geladen
            ? 'Noch keine Gegner. Lies unten eine Sammlung aus einer JSON-Datei ein — etwa die aus dem alten Kampftracker.'
            : 'Die Gegner konnten nicht geladen werden. Verlasse den DM-Modus und betritt ihn erneut.'}</p>
        </div>
      ) : gefiltert.length === 0 ? (
        <div className="gegner-leer"><p>Kein Gegner gefunden.</p></div>
      ) : (
        <div className="gegner-reihen">
          {gefiltert.map(e => (
            <button className="gegner-reihe" key={e.id} onClick={()=>onAnsehen(e)}>
              <span className="gegner-reihe-bild">
                {e.image ? <img src={e.image} alt="" /> : <span>💀</span>}
              </span>
              <span className="gegner-reihe-text">
                <b>{e.name}</b>
                <i>{e.size} · {e.type}</i>
              </span>
              <span className="gegner-reihe-werte">
                <span className="gegner-hg">HG {e.cr}</span>
                RK {e.ac} · {e.hpMax} TP
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="gegner-fuss">
        <label className={"gegner-import"+(importBusy?" busy":"")}>
          {importBusy ? '⏳ Wird eingelesen…' : '⇪ Sammlung einlesen (JSON)'}
          <input type="file" accept="application/json,.json" style={{display:'none'}} disabled={importBusy}
            onChange={e=>{ const d=e.target.files && e.target.files[0]; e.target.value=''; if(d) onImport(d); }} />
        </label>
        <span className="gegner-fuss-zahl">
          {gefiltert.length === enemies.length
            ? enemies.length + ' Gegner'
            : gefiltert.length + ' von ' + enemies.length}
        </span>
      </div>
    </div>
  );
};

// ── Begegnungen ──────────────────────────────────────────────────
// Eine Begegnung ist eine Liste aus Gegnern mit Anzahl. Sie gehoert zu
// einem Abenteuer, damit die Krypten von Strahd nicht in der naechsten
// Kampagne auftauchen.
const SCHWIERIGKEITEN = ['Leicht','Mittel','Schwer','Tödlich'];

const newEncounter = (advId) => ({
  id: 'enc_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
  name:'', difficulty:'Mittel', description:'', enemies:[], adventure: advId || '',
});

const BegegnungFormular = ({ form, setForm, enemies, abenteuer, onSpeichern, onAbbrechen, neu }) => {
  const [suche, setSuche] = useState('');
  if (!form) return null;
  const f = form;
  const setzen = (patch) => setForm({...f, ...patch});
  const teile = f.enemies || [];

  const q = suche.trim();
  const treffer = !q ? [] : enemies
    .filter(e => containsFold(e.name||'', q) || containsFold((e.tags||[]).join(' '), q))
    .sort((a,b) => crRang(a.cr)-crRang(b.cr) || (a.name||'').localeCompare(b.name||'','de'))
    .slice(0, 12);

  const hinzu = (e) => {
    const drin = teile.find(t => t.enemyId === e.id);
    setzen({enemies: drin
      ? teile.map(t => t.enemyId===e.id ? {...t, count:(t.count||1)+1} : t)
      : [...teile, {enemyId:e.id, count:1, name:e.name}]});
    setSuche('');
  };

  return (
    <div className="form-overlay">
      <div className="form-modal" style={{maxWidth:540}}>
        <div className="form-title">{neu ? '⚔ Neue Begegnung' : '✎ Begegnung bearbeiten'}</div>
        <div className="form-grid" style={{maxHeight:'62vh',overflowY:'auto',paddingRight:4}}>

          <div className="form-group form-full">
            <label className="form-label">Name</label>
            <input className="form-input" value={f.name} autoFocus
              onChange={e=>setzen({name:e.target.value})} placeholder="z.B. Vampirhorst" />
          </div>
          <div className="form-group">
            <label className="form-label">Schwierigkeit</label>
            <select className="form-select" value={f.difficulty||'Mittel'} onChange={e=>setzen({difficulty:e.target.value})}>
              {SCHWIERIGKEITEN.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Abenteuer</label>
            <select className="form-select" value={f.adventure||''} onChange={e=>setzen({adventure:e.target.value})}>
              <option value="">— alle —</option>
              {(abenteuer||[]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group form-full">
            <label className="form-label">Beschreibung</label>
            <textarea className="form-input" rows={2} style={{resize:'vertical'}} value={f.description||''}
              onChange={e=>setzen({description:e.target.value})}
              placeholder="Ein verlassenes Herrenhaus — bewohnt von blutdurstigen Vampir-Spawns." />
          </div>

          <div className="form-group form-full">
            <label className="form-label">Gegner</label>
            {teile.length === 0 && (
              <div style={{fontSize:11.5,color:'var(--text-muted)',fontStyle:'italic',marginBottom:6}}>
                Noch keiner. Suche unten nach einem Gegner, um ihn aufzunehmen.
              </div>
            )}
            {teile.map((t,i) => {
              const g = enemies.find(e => e.id === t.enemyId);
              return (
                <div className="beg-teil" key={t.enemyId+i}>
                  <span className="beg-teil-name">
                    {t.name || (g && g.name) || 'Unbekannt'}
                    {g ? <i> HG {g.cr} · RK {g.ac} · {g.hpMax} TP</i>
                       : <i className="beg-fehlt">nicht mehr in der Sammlung</i>}
                  </span>
                  <input className="form-input beg-teil-zahl" type="number" min={1} max={99}
                    value={t.count||1} aria-label={'Anzahl ' + (t.name||'')}
                    onChange={e=>setzen({enemies: teile.map((x,j)=>j===i?{...x,count:Math.max(1,+e.target.value)}:x)})} />
                  <button type="button" className="fx-del" title="Entfernen"
                    onClick={()=>setzen({enemies: teile.filter((_,j)=>j!==i)})}>✕</button>
                </div>
              );
            })}

            <div className="beg-suche-huelle">
              <input className="form-input" value={suche} onChange={e=>setSuche(e.target.value)}
                placeholder="Gegner suchen und hinzufügen…" aria-label="Gegner suchen" />
              {treffer.length > 0 && (
                <div className="beg-treffer">
                  {treffer.map(e => (
                    <button type="button" key={e.id} className="beg-treffer-zeile" onClick={()=>hinzu(e)}>
                      <b>{e.name}</b>
                      <i>HG {e.cr} · {e.type}</i>
                    </button>
                  ))}
                </div>
              )}
              {q && treffer.length === 0 && (
                <div style={{fontSize:11.5,color:'var(--text-muted)',fontStyle:'italic',marginTop:5}}>Kein Gegner gefunden.</div>
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

const BegegnungListe = ({ encounters, enemies, abenteuer, advId, nurAktives, setNurAktives,
                          onBearbeiten, onLoeschen, onNeu }) => {
  const sichtbar = encounters
    .filter(e => !nurAktives || !e.adventure || e.adventure === advId)
    .sort((a,b) => (a.name||'').localeCompare(b.name||'','de'));
  const advName = (id) => (abenteuer.find(a=>a.id===id)||{}).name;

  return (
    <div className="gegner-liste-huelle">
      <div className="gegner-werkzeuge">
        <label className="beg-filter">
          <input type="checkbox" checked={nurAktives} onChange={e=>setNurAktives(e.target.checked)} />
          Nur das offene Abenteuer
        </label>
        <button className="btn-icon" onClick={onNeu}>+ Neu</button>
      </div>

      {sichtbar.length === 0 ? (
        <div className="gegner-leer">
          <p>{encounters.length === 0
            ? 'Noch keine Begegnung. Stelle eine aus deinen Gegnern zusammen.'
            : 'Keine Begegnung in diesem Abenteuer.'}</p>
        </div>
      ) : (
        <div className="gegner-reihen">
          {sichtbar.map(e => {
            const anzahl = (e.enemies||[]).reduce((s,t)=>s+(+t.count||1), 0);
            const fehlend = (e.enemies||[]).filter(t => !enemies.some(g=>g.id===t.enemyId)).length;
            return (
              <div className="beg-reihe" key={e.id}>
                <button className="beg-reihe-haupt" onClick={()=>onBearbeiten(e)}>
                  <span className="beg-reihe-text">
                    <b>{e.name || '(ohne Namen)'}</b>
                    <i>
                      {e.difficulty}
                      {' · '}{anzahl} Gegner
                      {e.adventure && advName(e.adventure) ? ' · ' + advName(e.adventure) : ''}
                      {fehlend ? ' · ' + fehlend + ' fehlt' : ''}
                    </i>
                  </span>
                </button>
                <button className="beg-reihe-del" onClick={()=>onLoeschen(e)} aria-label={'Begegnung ' + e.name + ' löschen'}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
