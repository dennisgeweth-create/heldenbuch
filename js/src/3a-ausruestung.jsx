// Heldenbuch — die Ausruestungspuppe.
//
// Eigene Datei, weil 3-sheet.jsx sonst weiter waechst; sie liest denselben
// Kontext wie Sheet und steht deshalb hinter ihm, wo SheetCtx schon
// angelegt ist.
//
// Antippen statt Ziehen: ein Tipp auf einen Platz oeffnet die Auswahl, ein
// zweiter legt an. Auf dem Tablet ist das zuverlaessiger als Ziehen und
// braucht keine Sonderbehandlung fuer Beruehrung.

const AusruestungsPuppe = () => {
  const {
    cur, effCur, computedAC, displayAC, itemFx,
    gearWornList, nhGesperrt, setGearSlot, gearArmor, gearShield, gearAusVorlage,
    gearPick, setGearPick, fxOn, fxTitle,
    acBonuses, addAcBonus, delAcBonus, updAcBonus,
    setItemViewer, setWeaponViewer, setItf, setItfEditId, setShowIF,
  } = React.useContext(SheetCtx);

  if (!cur) return null;

  const belegt = {};
  gearWornList.forEach(x => { belegt[x.slot.key] = x; });

  const spalte = (name) => GEAR_SLOTS.filter(s => s.spalte === name);

  // Was in einen Platz passt: Waffen aus cur.weapons, Gegenstaende ueber
  // ihren eingetragenen Ausruestungsplatz.
  const kandidaten = (s) => {
    const out = [];
    if (s.nimmt.includes('waffe')) {
      (cur.weapons||[]).forEach(w => out.push({k:'w', obj:w, art:'Waffe'}));
    }
    (cur.inventory||[]).forEach(i => {
      if (i.gearKind && s.nimmt.includes(i.gearKind)) out.push({k:'i', obj:i, art:(GEAR_KINDS.find(g=>g.key===i.gearKind)||{}).label||''});
    });
    return out;
  };

  // In welchem Platz steckt etwas gerade? Fuer den Hinweis in der Auswahl.
  const platzVon = (k, id) => {
    const t = gearWornList.find(x => x.k === k && x.obj.id === id);
    return t ? t.slot : null;
  };

  const oeffneAnsicht = (eintrag) => {
    if (!eintrag) return;
    if (eintrag.k === 'w') setWeaponViewer(eintrag.obj);
    else setItemViewer(eintrag.obj);
  };

  const platzKachel = (s) => {
    const eintrag = belegt[s.key];
    const gesperrt = s.key === 'nebenhand' && nhGesperrt;
    const o = eintrag ? eintrag.obj : null;
    const klassen = 'gear-slot'
      + (gesperrt ? ' gesperrt' : o ? ' belegt' : ' leer')
      + (s.rk && o ? ' rk' : '');
    const beschriftung = gesperrt ? 'durch Zweihänder belegt' : o ? o.name : 'leer';
    return (
      <div key={s.key} className={klassen}>
        <button className="gear-slot-btn" disabled={gesperrt}
          onClick={()=>{ if(!gesperrt) setGearPick(s.key); }}
          title={gesperrt ? 'Die Haupthand führt einen Zweihänder' : (o ? o.name+' — tippen zum Wechseln' : s.label+' belegen')}
          aria-label={s.label+': '+beschriftung}>
          <span className="gear-slot-ic">
            {o && o.imageData
              ? <img src={o.imageData} alt="" />
              : <span className="gear-slot-emoji">{(o && o.icon) || s.icon}</span>}
          </span>
          <span className="gear-slot-txt">
            <b>{s.label}</b>
            <i>{beschriftung}</i>
          </span>
        </button>
        {o && (
          <button className="gear-slot-info" title={'Einzelheiten zu '+o.name}
            onClick={()=>oeffneAnsicht(eintrag)} aria-label={'Einzelheiten zu '+o.name}>i</button>
        )}
      </div>
    );
  };

  // ── Herleitung der Ruestungsklasse ──
  const herleitung = () => {
    const dex = mod(effCur.dex);
    const teile = [];
    if (gearArmor) {
      const t = gearArmor.armorType, b = +gearArmor.baseAC || 0;
      if (t === 'heavy')  teile.push(gearArmor.name+': '+b);
      if (t === 'medium') teile.push(gearArmor.name+': '+b+' + GES '+Math.min(2,dex));
      if (t === 'light')  teile.push(gearArmor.name+': '+b+' + GES '+dex);
    } else {
      teile.push('Unbewaffnet: 10 + GES '+dex);
    }
    if (gearShield) teile.push(gearShield.name+': +'+(+gearShield.baseAC||2));
    gearWornList.forEach(({obj}) => {
      if ((+obj.acBonus||0) !== 0) teile.push(obj.name+': '+((+obj.acBonus)>=0?'+':'')+(+obj.acBonus));
    });
    (acBonuses||[]).filter(b=>b.active && (b.bonus||0)!==0).forEach(b => {
      teile.push(b.name+': '+(b.bonus>=0?'+':'')+b.bonus);
    });
    effectsFor(itemFx,'ac').forEach(e => {
      teile.push(e.source+': '+(e.mode==='set' ? 'RK = '+(+e.value||0) : fnum(+e.value||0)));
    });
    return teile;
  };

  const s = gearPick ? GEAR_SLOTS.find(x => x.key === gearPick) : null;

  return (
    <>
      <div className="gear-head">
        <div className="section-title" style={{marginBottom:0}}>🛡 Ausrüstung</div>
        <div className="gear-ac" title={fxTitle('ac')}>
          <span className="gear-ac-l">Rüstungsklasse</span>
          <span className={"gear-ac-v"+(fxOn('ac')?" fx-touched":"")}>{displayAC}</span>
        </div>
      </div>

      <div className="gear-doll">
        <div className="gear-col">{spalte('links').map(platzKachel)}</div>
        <div className="gear-mid">
          <div className="gear-figur" aria-hidden="true">⚔</div>
          <div className="gear-mid-name">{cur.name}</div>
          <div className="gear-herleitung">
            {computedAC === null
              ? <div className="gear-hint">RK von Hand eingetragen — lege eine Rüstung an, damit sie gerechnet wird.</div>
              : herleitung().map((t,i) => <div key={i} className={i===0?'stark':''}>{i===0?'':'+ '}{t}</div>)}
            {computedAC !== null && <div className="gear-summe">= {displayAC} RK</div>}
          </div>
        </div>
        <div className="gear-col">{spalte('rechts').map(platzKachel)}</div>
      </div>

      <div className="gear-hands">{spalte('hand').map(platzKachel)}</div>

      {/* Boni aus Talenten sind keine Gegenstaende und haben keinen Platz.
          Sie bleiben vorerst als eigene Liste stehen und ziehen erst um,
          wenn Merkmale eigene Effekte bekommen. */}
      <div className="gear-boni">
        <div className="gear-boni-head">
          <div className="block-title">✦ RK-Boni durch Talente &amp; Fähigkeiten</div>
          <button className="btn-add" onClick={addAcBonus}>+ Bonus</button>
        </div>
        {(acBonuses||[]).length === 0
          ? <div className="gear-hint">Kein Bonus eingetragen (z.B. Defensiver Kampfstil, Natürliche Rüstung).</div>
          : (acBonuses||[]).map(b => (
            <div key={b.id} className={"gear-bonus"+(b.active?" aktiv":"")}>
              <button className="gear-bonus-tog" onClick={()=>updAcBonus(b.id,{active:!b.active})}
                title={b.active?'Deaktivieren':'Aktivieren'} aria-pressed={!!b.active}>{b.active?'✦':'◇'}</button>
              <input className="gear-bonus-name" defaultValue={b.name} key={'bn_'+b.id}
                aria-label="Name des Bonus" onBlur={e=>updAcBonus(b.id,{name:e.target.value})} />
              <input className="gear-bonus-val" type="number" min={-5} max={20} defaultValue={b.bonus} key={'bv_'+b.id}
                aria-label="Höhe des Bonus" onBlur={e=>updAcBonus(b.id,{bonus:+e.target.value})} />
              <span className="gear-bonus-rk">RK</span>
              <button className="gear-bonus-del" onClick={()=>delAcBonus(b.id)} aria-label={'Bonus '+b.name+' löschen'}>✕</button>
            </div>
          ))}
      </div>

      {/* Auswahl fuer einen Platz */}
      {s && (
        <div className="form-overlay" onClick={()=>setGearPick(null)}>
          <div className="form-modal gear-pick" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="form-title">{s.icon} {s.label}</div>
            {(() => {
              const liste = kandidaten(s);
              const drin = belegt[s.key];
              return (
                <>
                  {drin && (
                    <button className="gear-pick-leeren" onClick={()=>{setGearSlot(s.key,null,null);setGearPick(null);}}>
                      ✕ {drin.obj.name} ablegen
                    </button>
                  )}
                  {liste.length === 0 ? (
                    <div className="gear-pick-leer">
                      Nichts passendes dabei.
                      {s.nimmt.includes('waffe')
                        ? ' Waffen legst du im Aktionen-Reiter an.'
                        : ' Trage bei einem Gegenstand im Inventar den Ausrüstungsplatz „'+((GEAR_KINDS.find(g=>g.key===s.nimmt[0])||{}).label||s.label)+'“ ein, dann steht er hier zur Wahl.'}
                    </div>
                  ) : (
                    <div className="gear-pick-list">
                      {liste.map(({k,obj,art}) => {
                        const jetzt = platzVon(k, obj.id);
                        const hier  = jetzt && jetzt.key === s.key;
                        return (
                          <button key={k+obj.id} className={"gear-pick-item"+(hier?" hier":"")}
                            onClick={()=>{ setGearSlot(s.key, k, obj.id); setGearPick(null); }}>
                            <span className="gear-pick-ic">
                              {obj.imageData ? <img src={obj.imageData} alt="" /> : (obj.icon || (k==='w'?'⚔':'🎒'))}
                            </span>
                            <span className="gear-pick-txt">
                              <b>{obj.name || '(ohne Namen)'}</b>
                              <i>
                                {art}
                                {k==='w' && isZweihand(obj) && ' · Zweihänder'}
                                {k==='i' && obj.armorType==='shield' && ' · +'+(+obj.baseAC||2)+' RK'}
                                {k==='i' && obj.armorType && obj.armorType!=='shield' && ' · Basis '+(+obj.baseAC||0)}
                                {(+obj.acBonus||0)!==0 && ' · '+((+obj.acBonus)>=0?'+':'')+(+obj.acBonus)+' RK'}
                                {(obj.effects||[]).length>0 && ' · '+(obj.effects||[]).length+' Effekt'+((obj.effects||[]).length>1?'e':'')}
                              </i>
                            </span>
                            {jetzt && <span className="gear-pick-wo">{hier ? 'hier' : jetzt.kurz}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Vorlagen fuer die Plaetze, in die eine Ruestung passt:
                      ein Tipp legt das Stueck an und zieht es gleich an. */}
                  {(() => {
                    const vorlagen = ARMOR_TEMPLATES.filter(t => s.nimmt.includes(t.art));
                    if (!vorlagen.length) return null;
                    return (
                      <div className="gear-vorlagen">
                        <div className="gear-vorlagen-titel">Vorlagen</div>
                        <div className="gear-vorlagen-chips">
                          {vorlagen.map(t => (
                            <button key={t.name} className="gear-vorlage"
                              title={t.name+' anlegen und anziehen'}
                              onClick={()=>{ gearAusVorlage(s.key, t); setGearPick(null); }}>
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {!s.nimmt.includes('waffe') && (
                    <button className="gear-pick-neu" onClick={()=>{
                      setItf({...newItem(), gearKind:s.nimmt[0]==='schild'?'schild':s.nimmt[0]});
                      setItfEditId(null); setShowIF(true); setGearPick(null);
                    }}>+ Neuen Gegenstand für diesen Platz anlegen</button>
                  )}
                </>
              );
            })()}
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>setGearPick(null)}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
