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
    gearWornList, nhGesperrt, setGearSlot, gearArmor, gearShield, gearAusVorlage, gearSetList,
    gearPick, setGearPick, fxOn, fxTitle, patchChar, appAlert, appConfirm,
    setItemViewer, setWeaponViewer, setItf, setItfEditId, setShowIF, setImgViewer,
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

  // Die beiden Ansichten nehmen Unterschiedliches entgegen: der
  // Waffenbetrachter eine Kennung, der Gegenstandsbetrachter das Objekt.
  const oeffneAnsicht = (eintrag) => {
    if (!eintrag) return;
    if (eintrag.k === 'w') setWeaponViewer(eintrag.obj.id);
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
    // Der Platz selbst zeigt, was darin steckt; gewechselt wird ueber den
    // kleinen Knopf daneben. Ein leerer Platz hat nichts zu zeigen und
    // oeffnet deshalb gleich die Auswahl.
    return (
      <div key={s.key} className={klassen}>
        <button className="gear-slot-btn" disabled={gesperrt}
          onClick={()=>{ if (gesperrt) return; if (o) oeffneAnsicht(eintrag); else setGearPick(s.key); }}
          title={gesperrt ? 'Die Haupthand führt einen Zweihänder' : (o ? o.name+' — tippen für Einzelheiten' : s.label+' belegen')}
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
        {o && !gesperrt && (
          <button className="gear-slot-info" title={s.label+' wechseln oder ablegen'}
            onClick={()=>setGearPick(s.key)} aria-label={s.label+' wechseln oder ablegen'}>⇄</button>
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
    effectsFor(itemFx,'ac').forEach(e => {
      teile.push(e.source+': '+(e.mode==='set' ? 'RK = '+(+e.value||0) : fnum(+e.value||0)));
    });
    return teile;
  };

  // ── Bild des Helden ──
  // Es liegt im Charakter-Datensatz, und der geht bei jeder Aenderung am
  // Helden vollstaendig zum Server — anders als Inventargegenstaende, die
  // einzeln gespeichert werden. Deshalb 480px lange Kante: angezeigt wird
  // es ohnehin nur handtellergross.
  // Verkleinert wird in der Ablage; hier kommt nur noch das fertige
  // Bild an.
  const bildSetzen = (daten) => patchChar({portrait: daten});
  const bildEntfernen = () => appConfirm('Bild wirklich entfernen?', () => patchChar({portrait: ''}));

  const s = gearPick ? GEAR_SLOTS.find(x => x.key === gearPick) : null;

  return (
    <>
      <div className="gear-block">
      <div className="gear-head">
        <div className="section-title" style={{marginBottom:0}}>🛡 Ausrüstung</div>
        <div className="gear-ac" title={fxTitle('ac')}>
          <span className="gear-ac-l">Rüstungsklasse</span>
          <span className={"gear-ac-v"+(fxOn('ac')?" fx-touched":"")}>{displayAC}</span>
        </div>
      </div>

      <div className="gear-doll">
        <div className="gear-col">{spalte('links').map(platzKachel)}</div>
        {/* Die Mitte ist so hoch wie die Platzspalten daneben. Das Bild
            fuellt sie ganz aus, die Herleitung liegt als eigene Flaeche
            darueber — sie hat einen eigenen Grund, damit der Text auch auf
            einem hellen Foto lesbar bleibt. */}
        <div className="gear-mid">
          {cur.portrait ? (
            <>
              <img className="gear-mid-bild" src={cur.portrait} alt={cur.name}
                onClick={()=>setImgViewer({name:cur.name, imageData:cur.portrait})} />
              {/* Das Bild bleibt anklickbar zum Ansehen; getauscht wird
                  über die Werkzeuge daneben. */}
              <div className="gear-portrait-tools">
                <BildAblage bild={null} maxPx={480} aufschrift="✎" hinweis=""
                  hoehe={30} onBild={bildSetzen} />
                <button className="gear-portrait-btn" onClick={bildEntfernen}
                  title="Bild entfernen" aria-label="Bild entfernen">✕</button>
              </div>
            </>
          ) : (
            <BildAblage bild={null} maxPx={480} hoehe={0}
              aufschrift="📷 Bild wählen" hinweis="ziehen · klicken · Strg+V"
              onBild={bildSetzen} />
          )}
          <div className="gear-mid-info">
            <div className="gear-mid-name">{cur.name}</div>
            <div className="gear-herleitung">
              {computedAC === null
                ? <div className="gear-hint">RK von Hand eingetragen — lege eine Rüstung an, damit sie gerechnet wird.</div>
                : herleitung().map((t,i) => <div key={i} className={i===0?'stark':''}>{i===0?'':'+ '}{t}</div>)}
              {computedAC !== null && <div className="gear-summe">= {displayAC} RK</div>}
            </div>
          </div>
        </div>
        <div className="gear-col">{spalte('rechts').map(platzKachel)}</div>
      </div>

      <div className="gear-hands">{spalte('hand').map(platzKachel)}</div>

      {/* Sets: erreichte Stufen hell, noch nicht erreichte gedaempft — man
          soll auf einen Blick sehen, wie weit es noch ist. */}
      {gearSetList.length > 0 && (
        <div className="gear-sets">
          {gearSetList.map(s => {
            const ziel = s.stufen.length ? Math.max(...s.stufen.map(st=>+st.teile||0)) : s.teile;
            return (
              <div className="gear-set" key={s.name}>
                <div className="gear-set-kopf">
                  <span className="gear-set-name">✦ {s.name}</span>
                  <span className="gear-set-zahl">{s.teile}{ziel>s.teile || s.stufen.length ? ' / '+ziel : ''} Teile</span>
                </div>
                {s.stufen.length === 0 ? (
                  <div className="gear-set-stufe offen">
                    {s.def
                      ? 'Für dieses Set sind noch keine Stufen hinterlegt.'
                      : 'Kein Eintrag in der Datenbank — lege unter 📚 Datenbank › Sets einen mit genau diesem Namen an.'}
                  </div>
                ) : s.stufen.map((st, i) => (
                  <div className={"gear-set-stufe"+(st.aktiv?" aktiv":"")} key={i}>
                    <span className="gear-set-teile">{st.teile} Teile</span>
                    <span className="gear-set-fx">
                      {(st.effects||[]).length === 0
                        ? <i>nichts hinterlegt</i>
                        : (st.effects||[]).map((e,j)=><span key={j} className="fx-chip">{EFFECT_LABELS[e.target]||e.target} {effectText(e)}</span>)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Die Boni aus Talenten stehen jetzt bei den Merkmalen — ein
          Kampfstil ist ein Merkmal, kein Ausruestungsstueck, und kann dort
          mehr als nur die Ruestungsklasse anheben. */}
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
