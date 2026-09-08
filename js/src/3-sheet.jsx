// Heldenbuch — der Charakterbogen mit seinen sieben Reitern.

// ── Charakterbogen ───────────────────────────────────────────────
// Sheet war bis Stufe 3 innerhalb von App definiert und wurde damit bei
// jedem Rendern als neue Komponente erzeugt: React warf den kompletten
// Teilbaum weg und baute ihn neu auf. Eigener Zustand ueberlebte darin
// keinen Tastendruck — der Grund, warum jeder Schalter seinen Zustand in
// App ablegen musste. Als eigenstaendige Komponente entfaellt das.
//
// Die Werte aus App kommen ueber einen Kontext statt als Prop-Liste; die
// Entnahme hier und das Objekt in App entstehen aus derselben Liste und
// koennen deshalb nicht auseinanderlaufen.
const SheetCtx = React.createContext(null);

const Sheet = () => {
  const {
    addArmorProf, addLanguage, addLog, addResource, addToolProf,
    addWeaponProf, appAlert, appConfirm, archiveChar, armorProfs, cc,
    charMenuOpen, chars, chgMax, collapsedLevels, computedAC, cur, darfBearbeiten,
    delArmorProf, deleteChar, delFeature, delItem, delLanguage, delNote,
    delResource, delSpell, delToolProf, delWeaponProf, displayAC,
    effCur, exFeature, exItem, exNote, exSpell, fx, fxOn, fxTitle,
    initTotal, insp, inspMax, invRarity, invTagFilter, isDmMode, itemFx,
    klassen, languages, notesList, noteTagFilter, openAufstieg, openEdit, openNew, openTpl,
    openUnprepared, patchChar, patchCurrent, resEdit, resetAll, resources, save, sel,
    selectChar, setCharMenuOpen, setCoinDelta, setCoinPopover,
    setCollapsedLevels, setExFeature, setExNote, setExSpell, setFf,
    setFfEditId, setImgViewer, setInsp, setInspMax, setInvRarity,
    setInvTagFilter, setItemViewer, setItf, setItfEditId, setNf,
    setNfEditId, setNoteTagFilter, setOpenUnprepared, setResEdit, setSf,
    setSfEditId, setShowFF, setShowIF, setShowNF, setShowSF,
    setShowTransfer, setShowWF, setSlotsEdit, setSpEdit,
    setSpellTagFilter, setStatsEdit, setTab, setTransferMode,
    setTransferSel, setWeaponViewer, setWf, setWfEditId, setWsExpand,
    slots, slotsEdit, sp, spChgMax, spEdit, spellTagFilter, statsEdit,
    switchList, tab, tpOffen, toggleEquipped, toggleFeatureFx,
    toggleJoAT, toggleSave, toggleSkill, toggleSpellPrepared,
    toggleWsFav, togResourcePip, togSlot, togSP, toolProfs, tplData,
    transferMode, transferSel, unarchiveChar, updResource, updSP,
    weaponProfs, weaponStats, wsExpand
  } = React.useContext(SheetCtx);

  // Eigener Zustand in Sheet — moeglich, seit Sheet eine eigenstaendige
  // Komponente ist. Vorher haette ihn jedes Rendern zurueckgesetzt.
  const [leisteWahlOffen, setLeisteWahlOffen] = useState(false);
  // Schaden und Heilung ausserhalb des Kampfes. Dieselben Regeln und
  // dasselbe Fenster wie im Kampftracker — wer beides bedient, soll nicht
  // zwei Bedienungen lernen muessen.
  const [tpDlg, setTpDlg] = useState(null);   // 'schaden' | 'heilung' | 'temp' | 'maxtemp'
  const [nachgetragen, setNachgetragen] = useState(null);   // Rueckmeldung des Einlesers
  const [werkzeugOffen, setWerkzeugOffen] = useState(false);
  const [invSuche, setInvSuche] = useState("");
  const invSucheRef = useRef(null);
  // Nach dem Zuruecksetzen steht der Zeiger wieder im Feld: der haeufigste
  // naechste Schritt ist eine neue Suche, nicht das Blaettern.
  const invFilterLeeren = () => {
    setInvSuche(""); setInvRarity('all'); setInvTagFilter([]);
    if (invSucheRef.current) invSucheRef.current.focus();
  };

    if (!cur) return (
      <div className="empty-state">
        <div className="empty-rune">⚔</div>
        <div className="empty-title">Kein Held ausgewählt</div>
        <div className="empty-sub">Wähle einen Helden aus der Liste<br/>oder erstelle einen neuen</div>
        <button className="btn-save" onClick={openNew} style={{marginTop:8}}>✦ Jetzt erstellen</button>
      </div>
    );

    const sbl = {};
    (cur.spells||[]).forEach(s => { if(!sbl[s.level]) sbl[s.level]=[]; sbl[s.level].push(s); });
    Object.keys(sbl).forEach(l => sbl[l].sort((a,b)=>a.name.localeCompare(b.name,'de')));
    const sls = Object.keys(sbl).map(Number).sort((a,b)=>a-b);
    const inv = cur.inventory || [];
    const currency = cur.currency || {pp:0,gp:0,ep:0,sp:0,cp:0};
    const totalGp = (currency.pp*10)+(currency.gp)+(currency.ep*0.5)+(currency.sp*0.1)+(currency.cp*0.01);
    const totalWeight = inv.reduce((s,i)=>s+(parseFloat(i.weight)||0)*i.qty, 0);

    // ── Werte fuer die mitscrollende Leiste ──────────────────────────
    // Der Katalog fuehrt alles, was dort stehen kann; gezeigt wird, was der
    // Held ausgewaehlt hat. feld: bei Werten, die im Bearbeiten-Modus direkt
    // eingegeben werden. t: betroffenes Effektziel, faerbt den Wert und
    // erklaert ihn im Tooltip.
    // Womit gezaubert wird, steht seit v4.3 in der Klassenliste des
    // Abenteuers — auch fuer eine Hausklasse, die im Regelwerk nicht steht.
    const spAttrL   = klassenAttr(cur.charClass, klassen);
    const spSGL     = spAttrL ? fx('spellDc', 8 + effCur.profBonus + mod(effCur[spAttrL])) : null;
    const spAtkL    = spAttrL ? fx('spellAttack', effCur.profBonus + mod(effCur[spAttrL])) : null;
    const wahrSkill = SKILLS.find(x=>x.key==='aufmerksamkeit');
    const passivWert = (() => {
      if (!wahrSkill) return null;
      const isP = (cur.skillProfs||[]).includes(wahrSkill.key);
      const isE = (cur.expertiseProfs||[]).includes(wahrSkill.key);
      const joat = cur.jackOfAllTrades && !isP && !isE;
      const b = isE ? effCur.profBonus*2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus/2) : 0;
      // Das Beobachter-Talent hebt nur die passive Wahrnehmung, nicht den
      // Wurf — deshalb ein eigenes Ziel und keine Fertigkeitserhoehung.
      return fx('passivePerception', 10 + fx('skill_'+wahrSkill.key, fx('skillAll', mod(effCur[wahrSkill.attr]) + b)));
    })();
    // ── Trefferpunkte ausserhalb des Kampfes ──
    // Gleiche Regeln wie im Kampf: temporaere Punkte fangen zuerst, Heilung
    // deckelt am wirksamen Maximum, und wer wieder ueber null steht,
    // wuerfelt nicht mehr ums Ueberleben.
    const tpMerken = (alt, neu) => {
      if (alt > 0 && neu <= 0) addLog(cur.id, cur.name, 'charakter', 'Bei 0 Trefferpunkten');
      else if (alt <= 0 && neu > 0) addLog(cur.id, cur.name, 'charakter', 'Wieder auf den Beinen: ' + neu + ' TP');
    };
    const tpSchaden = (n) => patchCurrent(c => {
      const vomTemp = Math.min(+c.tempHp||0, n);
      const neu = Math.max(0, (+c.hp||0) - (n - vomTemp));
      tpMerken(+c.hp||0, neu);
      return {tempHp: (+c.tempHp||0) - vomTemp, hp: neu};
    });
    const tpHeilen = (n) => patchCurrent(c => {
      const neu = Math.min(effCur.maxHp, Math.max(0, (+c.hp||0) + n));
      tpMerken(+c.hp||0, neu);
      return neu > 0 ? {hp: neu, deathSaves: {erfolge:0, fehler:0}} : {hp: neu};
    });
    const tpTemp = (n) => patchCurrent(c => ({tempHp: Math.max(0, n < 0 ? (+c.tempHp||0) + n : Math.max(+c.tempHp||0, n))}));
    const tpMaxTemp = (n) => patchCurrent(c => ({tempMaxHp: Math.max(0, (+c.tempMaxHp||0) + n)}));
    const tpAnwenden = (modus, n) => {
      if (!n) return;
      if (modus === 'schaden') n > 0 ? tpSchaden(n) : tpHeilen(-n);
      if (modus === 'heilung') n > 0 ? tpHeilen(n) : tpSchaden(-n);
      if (modus === 'temp')    tpTemp(n);
      if (modus === 'maxtemp') tpMaxTemp(n);
    };

    const ATTR_NAMEN = {str:"Stärke",dex:"Geschick",con:"Konstitution",int:"Intelligenz",wis:"Weisheit",cha:"Charisma"};
    const stickyKatalog = [
      {k:'ac',        l:"Rüstungsklasse", s:computedAC!==null?"🛡 RK*":"🛡 RK", i:"🛡", t:'ac',
       v:displayAC, feld: computedAC===null ? 'ac' : null},
      {k:'initiative',l:"Initiative",     s:"⚡ Init.", i:"⚡", t:'initiative', v:fnum(initTotal)},
      {k:'speed',     l:"Bewegung",       s:"👟 Bew.",  i:"👟", t:'speed', v:effCur.speed+"m", feld:'speed'},
      {k:'profBonus', l:"Übungsbonus",    s:"📖 ÜB",   i:"📖", t:'profBonus', v:"+"+effCur.profBonus, feld:'profBonus'},
      {k:'hp',        l:"Trefferpunkte",  s:"❤ TP",    i:"❤", t:'maxHp',
       v: tpOffen ? cur.hp+" / "+effCur.maxHp : tpZustand(cur.hp, effCur.maxHp).label},
      ...(passivWert!==null ? [{k:'passive', l:"Passive Wahrnehmung", s:"👁 Pass.", i:"👁", t:'passivePerception', v:passivWert}] : []),
      ...(spSGL!==null ? [
        {k:'spellDc',     l:"Zauber-SG",     s:"✨ SG", i:"✨", t:'spellDc',     v:spSGL},
        {k:'spellAttack', l:"Zauberangriff", s:"✨ ZA", i:"✨", t:'spellAttack', v:fnum(spAtkL)},
      ] : []),
      ...["str","dex","con","int","wis","cha"].map(a => (
        {k:'attr_'+a, l:ATTR_NAMEN[a], s:AL[a], i:"", t:a, v:fmod(effCur[a])}
      )),
    ];
    // Ohne eigene Auswahl die bisherigen fuenf Werte.
    const STICKY_STANDARD = ['ac','initiative','speed','profBonus','spellDc'];
    const stickyWahl = Array.isArray(cur.stickyFields) ? cur.stickyFields : STICKY_STANDARD;
    const stickyGewaehlt = stickyKatalog.filter(b => stickyWahl.includes(b.k));
    const stickyUmschalten = (k) => {
      const drin = stickyWahl.includes(k);
      // Mindestens ein Wert bleibt stehen, sonst waere die Leiste leer.
      if (drin && stickyWahl.length <= 1) return;
      patchChar({stickyFields: drin ? stickyWahl.filter(x=>x!==k) : [...stickyWahl, k]});
    };

    // Ein fremder Bogen ist zum Ansehen da. Alles, was schreibt —
    // Hinzufuegen, Bearbeiten, Loeschen, die Umschalter der Reiter — wird
    // ueber die Klasse sheet-nur-lesen ausgeblendet. Der Server weist es
    // ohnehin ab; hier steht es, damit niemand etwas anklickt, das nichts
    // tun kann.
    return (
      <div className={"sheet" + (darfBearbeiten ? "" : " sheet-nur-lesen")}>
        {!darfBearbeiten && (
          <div className="nur-lesen-band">
            🔒 Fremder Bogen — nur zum Ansehen.
            <i>Ändern darf ihn sein Konto und die Spielleitung des Abenteuers.</i>
          </div>
        )}
        <div className="sheet-header">
          <div style={{minWidth:0,flex:1}}>
            {switchList.length < 2 ? (
              <div className="char-name">{cur.name}</div>
            ) : (
              /* Ohne Blaetterpfeile: gewechselt wird ueber das Menue am
                 Namen. Sich durch die Gruppe zu klicken, um zu einem
                 bestimmten Helden zu kommen, brauchte niemand. */
              <div className={"char-switch"+(charMenuOpen?" open":"")}>
                <button className="char-name-btn" title="Held wählen" onClick={()=>setCharMenuOpen(o=>!o)}>
                  <div className="char-name">{cur.name}</div>
                  <span className="char-name-caret">▾</span>
                </button>
                {charMenuOpen && (
                  <>
                    <div style={{position:'fixed',inset:0,zIndex:29}} onClick={()=>setCharMenuOpen(false)} />
                    <div className="char-switch-menu">
                      {switchList.map(c=>{
                        const ccc = klassenStil(c.charClass || 'Kämpfer', klassen);
                        return (
                          <button key={c.id} className={"char-switch-item"+(c.id===sel?" current":"")}
                            onClick={()=>{ selectChar(c.id); setCharMenuOpen(false); }}>
                            <span className="char-switch-item-dot" style={{background:ccc.bg,borderColor:ccc.border}} />
                            <span className="char-switch-item-name">{c.name}</span>
                            <span className="char-switch-item-sub">Lv {(c.level||1)+(c.multiclasses||[]).reduce((s,m)=>s+(m.level||0),0)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="char-meta">
              {cur.race}
              {" · Stufe "}{(cur.level||1) + (cur.multiclasses||[]).reduce((s,m)=>s+(m.level||0),0)}
              {cur.background?" · "+cur.background:""}
            </div>
          </div>
          <div className="sheet-header-right" style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
            <div className="class-badges">
              <div className="class-badge" style={{backgroundColor:cc.bg,borderColor:cc.border,color:cc.text}}>
                {cur.charClass} {cur.level}
              </div>
              {(cur.multiclasses||[]).map((mc,i)=>{
                const mcc = klassenStil(mc.charClass || 'Kämpfer', klassen);
                return <div key={i} className="class-badge" style={{backgroundColor:mcc.bg,borderColor:mcc.border,color:mcc.text}}>{mc.charClass} {mc.level}</div>;
              })}
            </div>
            {/* Wer den Bogen nicht aendern darf, bekommt die Knoepfe nicht
                hingestellt. Der Server weist es ohnehin ab; eine Tuer
                anzubieten, die zu ist, waere nur aergerlich. */}
            <div className="header-actions">
              {darfBearbeiten ? <>
                {/* Der Aufstieg steht neben dem Stift, weil er dorthin
                    gehört: beides ändert den Bogen selbst. */}
                <button title="Stufenaufstieg"
                  onClick={openAufstieg}
                  style={{padding:"4px 8px",background:"none",border:"1px solid transparent",borderRadius:3,
                    color:"var(--text-muted)",fontSize:14,cursor:"pointer",opacity:0.55,transition:"opacity 0.15s,border-color 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.borderColor="var(--border-bright)";}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity="0.55";e.currentTarget.style.borderColor="transparent";}}>
                  ⇧
                </button>
                <button title="Bearbeiten"
                  onClick={openEdit}
                  style={{padding:"4px 8px",background:"none",border:"1px solid transparent",borderRadius:3,
                    color:"var(--text-muted)",fontSize:14,cursor:"pointer",opacity:0.55,transition:"opacity 0.15s,border-color 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.borderColor="var(--border-bright)";}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity="0.55";e.currentTarget.style.borderColor="transparent";}}>
                  ✎
                </button>
                {cur.archived ? (
                  <button title="Reaktivieren"
                    onClick={()=>unarchiveChar(cur.id)}
                    style={{padding:"4px 10px",background:"none",border:"1px solid var(--gold-dim)",borderRadius:3,
                      color:"var(--gold-dim)",fontSize:12,fontFamily:"'Roboto Condensed',sans-serif",cursor:"pointer",opacity:0.8,letterSpacing:"0.05em"}}
                    onMouseEnter={e=>{e.currentTarget.style.opacity="1";}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity="0.8";}}>
                    ↩ aktiv
                  </button>
                ) : (
                  <button title="Archivieren"
                    onClick={()=>appConfirm("Charakter \""+cur.name+"\" archivieren?", archiveChar, "Archivieren")}
                    style={{padding:"4px 8px",background:"none",border:"1px solid transparent",borderRadius:3,
                      color:"var(--text-muted)",fontSize:14,cursor:"pointer",opacity:0.45,transition:"opacity 0.15s,border-color 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.borderColor="var(--border)"}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity="0.45";e.currentTarget.style.borderColor="transparent"}}>
                    📦
                  </button>
                )}
                <button title="Löschen"
                  onClick={deleteChar}
                  style={{padding:"4px 8px",background:"none",border:"1px solid transparent",borderRadius:3,
                    color:"var(--text-muted)",fontSize:14,cursor:"pointer",opacity:0.45,transition:"opacity 0.15s,border-color 0.15s,color 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.color="var(--crimson-bright)";e.currentTarget.style.borderColor="var(--crimson)";}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity="0.45";e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.borderColor="transparent";}}>
                  ✕
                </button>
              </> : (
                <span className="fremder-bogen" title="Dieser Bogen gehört jemand anderem — ändern darf ihn sein Konto und die Spielleitung">🔒</span>
              )}
            </div>
          </div>
        </div>

        {/* ── HP-Block ──
            In manchen Runden kennt nur die Spielleitung die Zahl. Dann steht
            hier der Zustand, und die Eingabefelder bleiben weg: eine Zahl,
            die man selbst eintragen darf, waere keine verdeckte Zahl. */}
        <div className="hp-bar-container">
          <div className="hp-bar-label">
            <span>❤ Trefferpunkte</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {!tpOffen ? (
                <span style={{color:tpZustand(cur.hp, effCur.maxHp).color,
                              fontFamily:"'Roboto Condensed',sans-serif"}}
                  title="In diesem Abenteuer führt die Spielleitung die Trefferpunkte">
                  {tpZustand(cur.hp, effCur.maxHp).label}
                  <span style={{color:"var(--text-muted)",marginLeft:6,fontSize:11}}>🔒</span>
                </span>
              ) : statsEdit ? (
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <label style={{fontSize:10,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif"}}>Akt.</label>
                  <ZahlFeld wert={cur.hp} onWert={v=>patchChar({hp:v})}
                    style={{width:52,padding:"2px 4px",background:"var(--bg-card)",border:"1px solid var(--crimson-bright)",borderRadius:3,color:"var(--crimson-bright)",fontSize:13,textAlign:"center"}}/>
                  <label style={{fontSize:10,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif"}}>Max</label>
                  <ZahlFeld wert={cur.maxHp} onWert={v=>patchChar({maxHp:v})} min={1}
                    style={{width:52,padding:"2px 4px",background:"var(--bg-card)",border:"1px solid var(--border-bright)",borderRadius:3,color:"var(--parchment)",fontSize:13,textAlign:"center"}}/>
                  <label style={{fontSize:10,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif"}}>Temp</label>
                  <ZahlFeld wert={cur.tempHp||0} onWert={v=>patchChar({tempHp:v})} min={0} leerWert={0}
                    style={{width:52,padding:"2px 4px",background:"var(--bg-card)",border:"1px solid #4a90d9",borderRadius:3,color:"#7ab8f5",fontSize:13,textAlign:"center"}}/>
                  {/* Temporaeres Maximum: kommt meist aus dem Kampftracker und
                      muss nach der langen Rast wieder weg. Unsichtbar waere es
                      ein Bonus, den niemand mehr findet. */}
                  <label style={{fontSize:10,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif"}}>T.Max</label>
                  <ZahlFeld wert={cur.tempMaxHp||0} onWert={v=>patchChar({tempMaxHp:v})} min={0} leerWert={0}
                    style={{width:52,padding:"2px 4px",background:"var(--bg-card)",border:"1px solid #7a4a68",borderRadius:3,color:"#d4a6c8",fontSize:13,textAlign:"center"}}/>
                </div>
              ) : (
                <span style={{color:"var(--crimson-bright)"}} title={fxTitle('maxHp')}>
                  {cur.hp} / <span className={fxOn('maxHp')?"fx-touched":undefined}>{effCur.maxHp}{fxOn('maxHp')&&<span className="fx-mark">✦</span>}</span>
                  {(cur.tempHp||0) > 0 && <span style={{color:"#7ab8f5",marginLeft:6}}>(+{cur.tempHp} temp)</span>}
                  {(cur.tempMaxHp||0) > 0 && <span style={{color:"#d4a6c8",marginLeft:6}}>(+{cur.tempMaxHp} max)</span>}
                </span>
              )}
            </div>
          </div>
          <div className="hp-bar-track">
            <div style={{display:"flex",height:"100%",width:"100%"}}>
              <div className="hp-bar-fill" style={{
                width: (tpOffen ? Math.max(0,Math.min(100,(cur.hp/(effCur.maxHp||1))*100))
                                : tpZustand(cur.hp, effCur.maxHp).balken*100) + "%",
                flexShrink:0,
                ...(tpOffen ? {} : {background: tpZustand(cur.hp, effCur.maxHp).color})}} />
              {tpOffen && (cur.tempHp||0) > 0 && (
                <div style={{
                  width:Math.max(0,Math.min(25,(cur.tempHp/(effCur.maxHp||1))*100))+"%",
                  background:"linear-gradient(90deg,rgba(74,144,217,0.7),rgba(122,184,245,0.9))",
                  flexShrink:0,borderRadius:"0 2px 2px 0",marginLeft:1
                }}/>
              )}
            </div>
          </div>
          {/* Schaden und Heilung ohne Umweg ueber einen Kampf. Nur fuer die
              Spielleitung: es ist der Bogen eines anderen, und ausserhalb
              des Kampfes traegt ihn sonst der Spieler selbst nach. */}
          {isDmMode && (
            <div className="tp-tasten">
              <button className="kt dmg"  title="1 Schaden" onClick={()=>tpSchaden(1)}>-1</button>
              <button className="kt dmg"  title="5 Schaden" onClick={()=>tpSchaden(5)}>-5</button>
              <button className="kt dmg breit" onClick={()=>setTpDlg('schaden')}>Schaden…</button>
              <button className="kt heal" title="1 heilen" onClick={()=>tpHeilen(1)}>+1</button>
              <button className="kt heal" title="5 heilen" onClick={()=>tpHeilen(5)}>+5</button>
              <button className="kt heal breit" onClick={()=>setTpDlg('heilung')}>Heilen…</button>
              <button className="kt temp breit" onClick={()=>setTpDlg('temp')}>+Temp HP</button>
              <button className="kt max breit" onClick={()=>setTpDlg('maxtemp')}
                title="Temporäre maximale Trefferpunkte">+Temp Max</button>
              <button className="kt heal breit" title="Volle Trefferpunkte, temporäres zurücksetzen"
                onClick={()=>patchCurrent(c => {
                  tpMerken(+c.hp||0, effCur.maxHp);
                  return {hp: effCur.maxHp - (+c.tempMaxHp||0), tempHp: 0, tempMaxHp: 0,
                          deathSaves: {erfolge:0, fehler:0}};
                })}>☾ Lange Rast</button>
            </div>
          )}
          {/* Faellt jemand ausserhalb des Kampfes auf null, wird auch dort
              gewuerfelt. Dieselben Punkte wie im Kampftracker. */}
          {isDmMode && (cur.hp||0) <= 0 && (
            <TodesWuerfe stand={cur.deathSaves}
              onSetzen={(d)=>patchChar({deathSaves:d})} />
          )}
          {tpDlg && (
            <WertDialog modus={tpDlg} name={cur.name} start={0}
              onAbbrechen={()=>setTpDlg(null)}
              onAnwenden={(n)=>{ setTpDlg(null); tpAnwenden(tpDlg, n); }} />
          )}
        </div>

        {/* ── Sticky header: Kampfwerte + Ressourcen ── */}
        <div className="sticky-header">
        {/* ── Kampfwerte + Edit-Toggle ── */}
        {/* Was in der Leiste steht, waehlt jeder Held selbst. Frueher waren
            es fest fuenf Werte; wer keine Zauber wirkt, sah dort einen
            Zauber-SG, und wer viel schleicht, vermisste die Passive
            Wahrnehmung. Die Auswahl haengt am Charakter, nicht am Geraet —
            sie gilt damit auch am Tablet der Gruppe. */}

        <div className="combat-row">
          {statsEdit ? (
            /* Im Bearbeiten-Modus bekommen die gewaehlten Werte ein
               Eingabefeld, sofern sie eines haben — abgeleitete Werte wie
               Initiative oder Zauber-SG bleiben Anzeige. */
            stickyGewaehlt.map(b => (
              <div className="combat-box" key={b.k}>
                <div className="combat-label">{b.i} {b.l}</div>
                <div className="combat-label-short">{b.s}</div>
                {b.feld ? (
                  <ZahlFeld wert={cur[b.feld]} aria-label={b.l}
                    onWert={v=>patchChar({[b.feld]:v})}
                    style={{width:56,padding:"3px 4px",background:"var(--bg-card)",border:"1px solid var(--border-bright)",borderRadius:3,color:"var(--gold)",fontSize:18,textAlign:"center",display:"block",margin:"4px auto 0",fontFamily:"'Roboto Condensed',sans-serif"}}/>
                ) : (
                  <div className="combat-value" style={{fontSize:14,color:"var(--text-muted)"}}>{b.v}</div>
                )}
              </div>
            ))
          ) : (
            stickyGewaehlt.map(b => {
              const touched = fxOn(b.t) || (b.t==='initiative' && fxOn('dex')) || (b.t==='ac' && fxOn('dex'));
              return (
                <div className="combat-box" key={b.k} title={fxTitle(b.t)}>
                  <div className="combat-label">{b.i} {b.l}</div>
                  <div className="combat-label-short">{b.s}</div>
                  <div className={"combat-value"+(touched?" fx-touched":"")}>{b.v}{fxOn(b.t)&&<span className="fx-mark">✦</span>}</div>
                </div>
              );
            })
          )}
          {/* Die beiden Werkzeuge sassen als eigene Knopfzeile ueber der
              Leiste und nahmen dort dauerhaft Platz weg, obwohl man sie
              selten braucht. Jetzt haengen sie als Zahnrad am Ende der
              Leiste — immer an derselben Stelle, aber nicht mehr im Weg. */}
          <div className="leiste-werkzeug">
            <button className={"leiste-zahnrad"+(werkzeugOffen||statsEdit?" aktiv":"")}
              onClick={()=>setWerkzeugOffen(o=>!o)}
              title="Leiste einstellen" aria-expanded={werkzeugOffen}
              aria-label="Leiste einstellen">⚙</button>
            {werkzeugOffen && (
              <>
                <div style={{position:'fixed',inset:0,zIndex:29}} onClick={()=>setWerkzeugOffen(false)} />
                <div className="leiste-werkzeug-menu">
                  <button onClick={()=>{setLeisteWahlOffen(true);setWerkzeugOffen(false);}}>
                    ⚙ Werte auswählen
                  </button>
                  <button onClick={()=>{setStatsEdit(!statsEdit);setWerkzeugOffen(false);}}>
                    {statsEdit ? "✓ Bearbeiten beenden" : "✏️ Werte bearbeiten"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resource mini-bar */}
        {(() => {
          const activeSlots = [1,2,3,4,5,6,7,8,9].filter(l=>slots[l]&&slots[l].max>0);
          const isZauberer = cur.charClass==="Zauberer"||(cur.multiclasses||[]).some(m=>m.charClass==="Zauberer");
          // Inspiration erscheint hier nur, wenn man welche hat — als
          // Erinnerung genau dann, wenn sie zaehlt. Bei 0 waere es Ballast.
          const hasContent = activeSlots.length>0||(isZauberer&&sp.max>0)||resources.length>0||insp>0;
          if(!hasContent) return null;
          return (
            <div className="res-mini-bar">
              {insp>0 && (
                <div className="res-mini-group" title={"Inspiration: "+insp+"/"+inspMax}>
                  <span className="res-mini-label" style={{color:"var(--inspiration)"}}>INSP</span>
                  {Array.from({length:inspMax}).map((_,i)=>(
                    <span key={i} className={"res-mini-pip"+(i<insp?" on":"")}
                      style={i<insp?{background:"var(--inspiration)",borderColor:"var(--inspiration)"}:{borderColor:"var(--inspiration)"}} />
                  ))}
                </div>
              )}
              {activeSlots.length>0 && (
                <div className="res-mini-group">
                  <span className="res-mini-label">ZPL</span>
                  {activeSlots.map(l=>{
                    const s=slots[l]; const avail=s.max-s.used;
                    return (
                      <span key={l} className="res-mini-slot-group" title={"Grad "+l+": "+avail+"/"+s.max}>
                        <span className="res-mini-slot-grade">{l}</span>
                        {Array.from({length:s.max}).map((_,i)=>(
                          <span key={i} className={"res-mini-pip"+(i<avail?" on":"")} />
                        ))}
                      </span>
                    );
                  })}
                </div>
              )}
              {isZauberer&&sp.max>0&&(
                <div className="res-mini-group" title={"Zaubereipunkte: "+(sp.max-sp.used)+"/"+sp.max}>
                  <span className="res-mini-label" style={{color:"var(--arcane-bright)"}}>ZPU</span>
                  {Array.from({length:sp.max}).map((_,i)=>{
                    const avail=sp.max-sp.used;
                    return <span key={i} className={"res-mini-pip"+(i<avail?" on":"")} style={i<avail?{background:"var(--arcane-bright)",borderColor:"var(--arcane-bright)"}:{borderColor:"var(--arcane-bright)"}} />;
                  })}
                </div>
              )}
              {resources.map((res,ri)=>{
                const avail=res.max-res.used;
                return (
                  <React.Fragment key={res.id}>
                    <div className="res-mini-group" title={res.name+": "+avail+"/"+res.max}>
                      <span className="res-mini-label" style={{color:res.color||"var(--gold)"}}>{res.abbr||res.name}</span>
                      {Array.from({length:res.max}).map((_,i)=>(
                        <span key={i} className={"res-mini-pip"+(i<avail?" on":"")} style={i<avail?{background:res.color||"var(--gold-dim)",borderColor:res.color||"var(--gold)"}:{borderColor:res.color||"var(--gold)"}} />
                      ))}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          );
        })()}

        </div>
        <div className="tabs">
          {[["stats","🎯 Attribute"],["aktionen","⚔️ Aktionen"],["zauber","✨ Zauber"],["merkmale","⭐ Merkmale"],["inventar","🎒 Inventar"],["notizen","📜 Notizen"],["log","📋 Log"]].map(([k,l]) => (
            <div key={k} className={"tab"+(tab===k?" active":"")} aria-current={tab===k?"page":undefined}
              {...clickable(()=>{setTab(k);if(k!=="inventar"){setTransferMode(false);setTransferSel(new Set());}}, l)}>{l}</div>
          ))}
        </div>

        {tab==="stats" && (
          <>
            {/* Überblick: was gerade an den Werten dreht und woher es kommt.
                Steht bewusst hier, weil direkt darunter die betroffenen
                Zahlen mit ✦ markiert sind. */}
            {/* Was gerade gehalten wird. Ein Zauber mit Konzentration
                endet, wenn man einen zweiten wirkt oder einen
                Rettungswurf nach einem Treffer nicht schafft — und
                genau daran denkt am Tisch niemand. */}
            {cur.konzentration && cur.konzentration.name && (
              <div className="konz-zeile">
                <span className="konz-zeichen">⚡</span>
                <span className="konz-text">
                  Hält <b>{cur.konzentration.name}</b>
                  <i>Schaden verlangt einen Konstitutions-Rettungswurf gegen SG 10
                    oder die Hälfte des Schadens — was größer ist.</i>
                </span>
                {darfBearbeiten && (
                  <button className="konz-weg" title="Beenden"
                    onClick={()=>patchCurrent(()=>({konzentration: null}))}>✕</button>
                )}
              </div>
            )}

            {itemFx.length > 0 && (() => {
              const bySource = [];
              itemFx.forEach(e => {
                let g = bySource.find(x=>x.source===e.source && x.icon===e.icon);
                if (!g) { g = {source:e.source, icon:e.icon, list:[]}; bySource.push(g); }
                g.list.push(e);
              });
              return (
                <div className="fx-panel">
                  <div className="fx-panel-title">✦ Aktive Effekte</div>
                  {bySource.map((g,i) => (
                    <div className="fx-src" key={i}>
                      <div className="fx-src-name">{g.icon} {g.source}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                        {g.list.map(e=>(
                          <span key={e.id} className={"fx-chip"+(isFlagEffect(e.target)?" fx-chip-flag":"")}>
                            {EFFECT_LABELS[e.target]||e.target} {effectText(e)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* Schalter noch einmal gebuendelt: im Kampf will man
                      wissen, wogegen man immun ist, ohne erst durch die
                      Gegenstaende zu suchen, von denen es kommt. */}
                  {(() => {
                    const schalter = activeFlags(itemFx);
                    if (!schalter.length) return null;
                    return (
                      <div className="fx-flags">
                        <div className="fx-flags-title">Gilt gerade</div>
                        <div className="fx-flags-list">
                          {schalter.map(f => (
                            <span key={f.target} className="fx-chip fx-chip-flag"
                              title={'aus: '+f.quellen.join(', ')}>{f.label}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic',marginTop:8,lineHeight:1.5}}>
                    Betroffene Werte sind mit ✦ markiert. Zum Abschalten die Waffe ablegen,
                    die Rüstung ausziehen oder den Gegenstand im Inventar ausschalten.
                  </div>
                </div>
              );
            })()}
            {/* Aufbau wie im gedruckten Bogen: links die Attribute
                untereinander mit den Rettungswuerfen daneben, rechts die
                Fertigkeiten in einer alphabetischen Liste. Auf schmalen
                Schirmen stapelt sich beides. */}
            <div className="stats-section">
              {/* Der Bearbeiten-Knopf steht unter den Werten, nicht ueber
                  ihnen: gelesen wird hier staendig, geaendert selten. */}
              <div className="section-head">
                <div className="section-title">🎯 Attribute &amp; Fertigkeiten</div>
                {statsEdit && <span className="stats-edit-marke">Bearbeiten</span>}
              </div>

              <div className="sheet-columns">
                {/* ── Linke Spalte: Attribute, Rettungswuerfe, Passive ── */}
                <div className="sheet-col-left">
                  <div className="attr-column">
                    {[["str","Stärke"],["dex","Geschicklichkeit"],["con","Konstitution"],
                      ["int","Intelligenz"],["wis","Weisheit"],["cha","Charisma"]].map(([k,l]) => (
                      <div className="attr-box" key={k} title={fxTitle(k)}>
                        <div className="attr-label">{l}</div>
                        {/* Wie im Bogen: der Modifikator ist die grosse Zahl,
                            der Attributswert steht klein darunter. */}
                        <div className={"attr-mod"+(fxOn(k)?" fx-touched":"")}>{fmod(effCur[k])}</div>
                        {statsEdit ? (
                          /* Bearbeitet wird der eigene Wert, nicht der von
                             Gegenstaenden veraenderte. */
                          <ZahlFeld className="attr-input" min={1} max={30} wert={cur[k]}
                            aria-label={l}
                            onWert={v=>patchChar({[k]:v})} />
                        ) : (
                          <div className={"attr-score"+(fxOn(k)?" fx-touched":"")}>
                            {effCur[k]}{fxOn(k) && <span className="fx-mark">✦</span>}
                          </div>
                        )}
                        {fxOn(k) && !statsEdit && cur[k]!==effCur[k] && (
                          <div className="attr-own">eigen {cur[k]}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="save-block">
                    <div className="block-title">🎲 Rettungswürfe</div>
                    <div className="saves-grid">
                      {[["str","STR"],["dex","GES"],["con","KON"],["int","INT"],["wis","WEI"],["cha","CHA"]].map(([attr,label])=>{
                        const isP = (cur.savingThrowProfs||[]).includes(attr);
                        const base = mod(effCur[attr]) + (isP?effCur.profBonus:0);
                        const val = fx('save_'+attr, fx('saveAll', base));
                        const touched = fxOn('save_'+attr)||fxOn('saveAll')||fxOn(attr)||fxOn('profBonus');
                        const tip = [fxTitle(attr),fxTitle('profBonus'),fxTitle('saveAll'),fxTitle('save_'+attr)].filter(Boolean).join('\n');
                        return (
                          <div key={attr} className={"save-box"+(isP?" prof":"")+(statsEdit?" schaltbar":"")} title={tip||undefined}
                            {...(statsEdit ? clickable(()=>toggleSave(attr), "Rettungswurf "+label+(isP?" — Übung aktiv":"")) : {})}>
                            <div className="save-pip"/>
                            <div className="save-label">{label}</div>
                            <div className={"save-value"+(touched?" fx-touched":"")} style={{color:isP?"var(--gold)":"var(--text-muted)"}}>{fnum(val)}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="block-hint">
                      {statsEdit ? "Klick schaltet die Übung um" : "zum Ändern unten auf Bearbeiten"}
                    </div>
                  </div>

                  {/* Steht im Bogen unter den Fertigkeiten und fehlte hier
                      bisher ganz. 10 plus der Wahrnehmungswert. */}
                  {(() => {
                    const sk = SKILLS.find(x=>x.key==='aufmerksamkeit');
                    if (!sk) return null;
                    const isP = (cur.skillProfs||[]).includes(sk.key);
                    const isE = (cur.expertiseProfs||[]).includes(sk.key);
                    const joat = cur.jackOfAllTrades && !isP && !isE;
                    const bonus = isE ? effCur.profBonus*2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus/2) : 0;
                    const tot = fx('skill_'+sk.key, fx('skillAll', mod(effCur[sk.attr]) + bonus));
                    return (
                      <div className="passive-box" title="Passive Wahrnehmung — 10 + Wahrnehmung">
                        <div className="passive-label">Passive Wahrnehmung</div>
                        <div className="passive-value">{fx('passivePerception', 10 + tot)}</div>
                      </div>
                    );
                  })()}
                </div>

                {/* ── Rechte Spalte: Fertigkeiten alphabetisch ── */}
                <div className="sheet-col-right">
                  <div className="skill-block">
                    <div className="block-head">
                      <div className="block-title">✦ Fertigkeiten</div>
                      <button
                        className="joat-toggle"
                        disabled={!statsEdit}
                        title={statsEdit ? undefined : "Zum Ändern unten auf Bearbeiten"}
                        onClick={()=>{ if (statsEdit) toggleJoAT(); }}
                        style={{
                          borderRadius:3,cursor:"pointer",fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,
                          letterSpacing:"0.08em",textTransform:"uppercase",
                          background: cur.jackOfAllTrades ? "var(--gold-dim)" : "var(--bg-card)",
                          border: `1px solid ${cur.jackOfAllTrades ? "var(--gold)" : "var(--border)"}`,
                          color: cur.jackOfAllTrades ? "var(--gold-bright)" : "var(--text-muted)",
                        }}>
                        {cur.jackOfAllTrades ? "✦ Allrounder aktiv" : "◇ Allrounder"}
                      </button>
                    </div>
                    {/* Alphabetisch in einer Liste wie im Bogen, statt nach
                        Attribut gruppiert. Das Attribut steht als Kuerzel in
                        der Zeile. */}
                    {[...SKILLS].sort((a,b)=>a.label.localeCompare(b.label,'de')).map(sk => {
                      const attr  = sk.attr;
                      const isP   = (cur.skillProfs||[]).includes(sk.key);
                      const isE   = (cur.expertiseProfs||[]).includes(sk.key);
                      const joat  = cur.jackOfAllTrades && !isP && !isE;
                      const bonus = isE ? effCur.profBonus*2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus/2) : 0;
                      const tot   = fx('skill_'+sk.key, fx('skillAll', mod(effCur[attr]) + bonus));
                      const skTouched = fxOn('skill_'+sk.key)||fxOn('skillAll')||fxOn(attr)||fxOn('profBonus');
                      const skTip = [fxTitle(attr),fxTitle('profBonus'),fxTitle('skillAll'),fxTitle('skill_'+sk.key)].filter(Boolean).join('\n');
                      // Vorteil und Nachteil tragen keine Zahl, sie stehen als
                      // Marke neben dem Wurf. Beides zugleich hebt sich nach
                      // Regelwerk auf — das sagt die Marke dann auch.
                      const vt = fxOn('adv_skill_'+sk.key) || fxOn('adv_skillAll')
                              || (sk.key==='heimlichkeit' && fxOn('adv_stealth'));
                      const nt = fxOn('dis_skill_'+sk.key) || fxOn('dis_skillAll')
                              || (sk.key==='heimlichkeit' && fxOn('dis_stealth'));
                      const pip   = isE ? "⬤⬤" : isP ? "⬤" : joat ? "◑" : "○";
                      const col   = isE ? "var(--arcane-bright)" : isP ? "var(--gold)" : joat ? "var(--gold-dim)" : "var(--border-bright)";
                      return (
                        <div className="skill-row" key={sk.key} title={skTip||undefined}>
                          <button
                            className={"skill-prof-btn"+(isE?" expertise":"")}
                            disabled={!statsEdit}
                            onClick={()=>{ if (statsEdit) toggleSkill(sk.key); }}
                            style={{ background: isE ? "var(--arcane)" : isP ? "var(--gold-dim)" : "var(--bg-void)",
                                     borderColor: col, color: col }}
                            title={!statsEdit ? "Zum Ändern unten auf Bearbeiten"
                                  : isE?"Expertise (Klick: entfernen)":isP?"Übung (Klick: Expertise)":"Kein Bonus (Klick: Übung hinzufügen)"}
                          >{pip}</button>
                          <div className="skill-name">{sk.label}</div>
                          <div className="skill-attr-tag" style={{color:AC[attr],borderColor:AC[attr]+"55"}}>{AL[attr]}</div>
                          <div className={"skill-value"+(skTouched?" fx-touched":"")} style={{color: isE ? "var(--arcane-bright)" : isP ? "var(--gold)" : joat ? "var(--gold-dim)" : "var(--text-muted)"}}>
                            {fnum(tot)}
                            {vt && nt && <span className="skill-vt neutral" title="Vorteil und Nachteil heben sich auf">⇅</span>}
                            {vt && !nt && <span className="skill-vt gut" title="Vorteil">▲</span>}
                            {nt && !vt && <span className="skill-vt schlecht" title="Nachteil">▼</span>}
                            {isE && <span className="skill-flag">EX</span>}
                            {joat && <span className="skill-flag">JoAT</span>}
                          </div>
                        </div>
                      );
                    })}
                    <div className="block-hint">
                      ⬤ Übung · ⬤⬤ Expertise
                      {statsEdit ? " · Klick zum Wechseln" : " · zum Ändern unten auf Bearbeiten"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="stats-fuss">
                <button className={"panel-edit-btn gross"+(statsEdit?" active":"")}
                  onClick={()=>setStatsEdit(!statsEdit)}>
                  {statsEdit ? "✓ Fertig" : "✏️ Attribute & Übungen bearbeiten"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Ausruestung: die Puppe steht ueber Waehrung und Gegenstaenden —
            Charakterfenster oben, Taschen darunter. Der alte Ausruestungs-
            block mit eigener Liste ist damit abgeloest; cur.equipment bleibt
            unangetastet im Datensatz liegen, bis sich die Umstellung
            bewaehrt hat. */}
        {tab==="inventar" && <AusruestungsPuppe />}

        {/* Aktionen: oben Ressourcen & Sonderpunkte (im Kampf haeufiger
            angefasst als eine Waffe nachgeschlagen wird), darunter durch eine
            Trennlinie abgesetzt die Waffen als Karten. */}
        {tab==="aktionen" && (
          <>
            <div className="slots-panel" style={{marginBottom:0}}>
              <div className="slots-panel-header">
                <div className="slots-title">◇ Ressourcen &amp; Sonderpunkte</div>
                <button className={"panel-edit-btn"+(resEdit?" active":"")} onClick={()=>setResEdit(!resEdit)}>{resEdit?"✓ Fertig":"✏️ Bearbeiten"}</button>
              </div>
              {/* Alle Eintraege als Kacheln in einem Raster. Vorher war jeder
                  eine Zeile ueber die volle Breite — bei sechs Eintraegen
                  586px hoch, obwohl links nur ein Name und ein paar Punkte
                  standen. Im Bearbeiten-Modus bleibt es einspaltig, dort
                  brauchen die Eingabefelder die Breite. */}
              <div className={"resource-list"+(resEdit?" bearbeiten":"")}>
                {/* Inspiration steht fest an erster Stelle: sie ist Teil der
                    Grundregeln und nicht wie die uebrigen Eintraege frei
                    angelegt — deshalb ohne Namensfeld und ohne Löschen. */}
                <div className="resource-item insp-item">
                  <div className="resource-name" style={{color:"var(--inspiration)"}}>✦ Inspiration</div>
                  <div className="resource-pips">
                    {Array.from({length:inspMax}).map((_,i) => (
                      <div key={i}
                        className="resource-pip"
                        title={i<insp ? "Inspiration einsetzen" : "Inspiration erhalten"}
                        style={{
                          backgroundColor: i<insp ? "var(--inspiration)" : "var(--bg-void)",
                          borderColor: "var(--inspiration)",
                          opacity: i<insp ? 1 : 0.25,
                          boxShadow: i<insp ? "0 0 6px rgba(232,184,75,0.45)" : "none",
                        }}
                        {...clickable(()=>setInsp(i<insp ? i : i+1),
                          "Inspiration " + (i+1) + " von " + inspMax + (i<insp ? " — einsetzen" : " — erhalten"))}
                      />
                    ))}
                    {resEdit && inspMax<10 && <button className="slot-max-btn" onClick={()=>setInspMax(inspMax+1)}>+</button>}
                    {resEdit && inspMax>1 && <button className="slot-max-btn" onClick={()=>setInspMax(inspMax-1)}>−</button>}
                    <span className="resource-count" style={{color:"var(--inspiration)"}}>
                      {insp}<small>/{inspMax}</small>
                    </span>
                  </div>
                  <div className="resource-foot">
                    <span className="resource-rest">Vorteil auf einen Wurf</span>
                  </div>
                </div>
                {resources.map(res => (
                  <div className="resource-item" key={res.id}>
                    {resEdit ? (
                      <div className="resource-header">
                        <input
                          className="form-input"
                          style={{padding:"3px 6px",fontSize:13,fontFamily:"'Roboto Condensed',sans-serif",flex:1,background:"transparent",border:"none",borderBottom:"1px solid var(--border)",borderRadius:0,color:"var(--text-primary)"}}
                          key={`res_name_${res.id}_${res.name}`}
                          defaultValue={res.name}
                          onBlur={e=>updResource(res.id,{name:e.target.value})}
                        />
                        <input
                          className="form-input"
                          style={{padding:"3px 6px",fontSize:11,fontFamily:"'Roboto Condensed',sans-serif",width:52,background:"transparent",border:"none",borderBottom:"1px solid var(--border)",borderRadius:0,color:"var(--text-muted)"}}
                          key={`res_abbr_${res.id}_${res.abbr}`}
                          defaultValue={res.abbr||""}
                          placeholder="Kürzel"
                          onBlur={e=>updResource(res.id,{abbr:e.target.value})}
                          title="Abkürzung für die Ressourcen-Leiste"
                        />
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <input type="color"
                            defaultValue={res.color||"#c9a84c"}
                            onBlur={e=>updResource(res.id,{color:e.target.value})}
                            onChange={e=>e.target.parentElement.querySelector('.color-preview')&&(e.target.parentElement.querySelector('.color-preview').style.background=e.target.value)}
                            style={{width:22,height:22,padding:0,border:"none",borderRadius:3,cursor:"pointer",background:"none"}} title="Farbe wählen"/>
                          <select className="form-select" style={{padding:"2px 4px",fontSize:11,width:"auto"}}
                            value={res.restType||"lang"} onChange={e=>updResource(res.id,{restType:e.target.value})}>
                            <option value="lang">Lange Rast</option>
                            <option value="kurz">Kurze Rast</option>
                            <option value="tag">Täglich</option>
                          </select>
                          <button className="resource-del" onClick={()=>delResource(res.id)}>✕</button>
                        </div>
                      </div>
                    ) : (
                      /* Die Rastart steht in der Fusszeile, damit der Name die
                         ganze Kachelbreite hat. */
                      <div className="resource-name" style={{color:res.color||"#c9a84c"}}>{res.name||"Ressource"}</div>
                    )}
                    <div className="resource-pips">
                      {Array.from({length:res.max}).map((_,i) => {
                        const avail = res.max - res.used;
                        return (
                          <div key={i}
                            className="resource-pip"
                            style={{
                              backgroundColor: i<avail ? (res.color||"#c9a84c") : "var(--bg-void)",
                              borderColor: res.color||"#c9a84c",
                              opacity: i<avail ? 1 : 0.25,
                              boxShadow: i<avail ? `0 0 5px ${res.color||"#c9a84c"}60` : "none",
                            }}
                            {...clickable(()=>togResourcePip(res.id,i),
                              (res.name||"Ressource") + " " + (i+1) + " von " + res.max)}
                          />
                        );
                      })}
                      {resEdit && <button className="slot-max-btn" onClick={()=>updResource(res.id,{max:Math.min(30,res.max+1)})}>+</button>}
                      {resEdit && res.max>0 && <button className="slot-max-btn" onClick={()=>updResource(res.id,{max:Math.max(0,res.max-1),used:Math.min(res.used,res.max-1)})}>−</button>}
                      <span className="resource-count" style={{color:res.color||"#c9a84c"}}>
                        {res.max-res.used}<small>/{res.max}</small>
                      </span>
                    </div>
                    {/* Rastart und Zuruecksetzen teilen sich eine Zeile: der
                        fruehere Knopf mit ausgeschriebener Rastart kostete in
                        der Kachel eine eigene Zeile. */}
                    <div className="resource-foot">
                      <span className="resource-rest">{res.restType==="kurz"?"Kurze Rast":res.restType==="tag"?"Täglich":"Lange Rast"}</span>
                      {res.used>0 && (
                        <button className="resource-restore-btn"
                          title={"Zurücksetzen ("+(res.restType==="kurz"?"Kurze Rast":res.restType==="tag"?"Täglich":"Lange Rast")+")"}
                          onClick={()=>updResource(res.id,{used:0})}>↺</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {resources.length === 0 && (
                <div style={{color:"var(--text-muted)",fontSize:13,fontStyle:"italic",margin:"10px 0 4px"}}>Sonst noch keine Ressourcen.{!resEdit && ' Klicke "Bearbeiten" zum Hinzufügen.'}</div>
              )}
              {resEdit && <button className="btn-add" onClick={addResource}>+ Ressource hinzufügen</button>}
            </div>

            <div className="section-divider" />

            <div className="section-title" style={{marginBottom:12}}>&#128481; Waffen</div>
            {(cur.weapons||[]).length===0
              ? <div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:14,marginBottom:12}}>Keine Waffen angelegt. Klicke unten um eine hinzuzufügen.</div>
              : <div className="weapon-grid">
                  {[...cur.weapons]
                    .sort((a,b)=>{
                      if(!!a.equipped !== !!b.equipped) return a.equipped?-1:1;
                      return (a.name||"").localeCompare(b.name||"","de");
                    })
                    .map(w => {
                      const { bonus, dmgStr } = weaponStats(w);
                      const isEquipped = !!w.equipped;
                      const meta = [w.range||null, w.damageType||null].filter(Boolean).join(" · ");
                      return (
                        <div key={w.id} className={"weapon-card"+(isEquipped?" equipped":"")}
                          {...clickable(()=>setWeaponViewer(w.id), (w.name||"Waffe")+" — Details")}>
                          <div className="weapon-card-img">
                            {w.imageData
                              ? <img src={w.imageData} alt={w.name||"Waffe"} />
                              : <div className="weapon-card-glyph">⚔</div>}
                            <button className="weapon-equip-btn"
                              title={isEquipped?"Ablegen":"Anlegen"}
                              onClick={e=>{e.stopPropagation();toggleEquipped(w.id);}}>⚔</button>
                          </div>
                          <div className="weapon-card-info">
                            <div className="weapon-card-name">{w.name||"—"}</div>
                            {meta && <div className="weapon-card-meta">{meta}</div>}
                            <div className="weapon-card-stats">
                              <div className="weapon-card-stat">
                                <div className="weapon-card-stat-label">Angriff</div>
                                <div className="weapon-card-stat-value atk">{bonus>=0?"+"+bonus:bonus}</div>
                              </div>
                              <div className="weapon-card-stat">
                                <div className="weapon-card-stat-label">Schaden</div>
                                <div className="weapon-card-stat-value">{dmgStr}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
            }
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn-add" style={{flex:1}} onClick={()=>{setWf(newWeapon());setWfEditId(null);setShowWF(true);}}>+ Waffe hinzufügen</button>
              <button className="btn-add" style={{flex:1,borderColor:"var(--gold)",color:"var(--gold)"}} onClick={()=>openTpl('weapon')}>&#128214; Von Vorlage (SRD)</button>
            </div>
          </>
        )}

        {/* Merkmale: Klassenfaehigkeiten (vorher im Zauber-Tab) und die
            Fertigkeitsnachweise (vorher im Attribute-Tab). */}
        {tab==="merkmale" && (
          <>
            <div style={{marginTop:24}}>
              <div className="section-title" style={{marginBottom:12}}>⭐ Klassenfähigkeiten &amp; Merkmale</div>
              {(cur.features||[]).length === 0
                ? <div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:13,marginBottom:12}}>Keine Fähigkeiten eingetragen.</div>
                : <div className="features-grid">{[...(cur.features||[])].sort((a,b)=>(a.source||'').localeCompare(b.source||'','de')||a.name.localeCompare(b.name,'de')).map(feat => (
                    <div key={feat.id} className={"feature-card"+(exFeature===feat.id?" expanded":"")} aria-expanded={exFeature===feat.id}
                      {...clickable(()=>setExFeature(exFeature===feat.id?null:feat.id), feat.name)}>
                      <div className="feature-card-banner">
                        <div className="feature-card-orb">⭐</div>
                        <div className="feature-card-name">{feat.name}</div>
                        <div className="feature-actions" onClick={e=>e.stopPropagation()}>
                          {/* Was aus der Chronik kommt, wird dort gepflegt.
                              Hier geaendert waere es beim naechsten Tick
                              wieder ueberschrieben — also gar nicht erst
                              anbieten. */}
                          {istChronikMerkmal(feat) ? (
                            <span className="feature-gesperrt" title="Kommt aus der Chronik der Spielleitung">🕰</span>
                          ) : (
                            <>
                              {/* Das ganze Merkmal uebernehmen, nicht nur die drei
                                  Textfelder — sonst faellt beim Bearbeiten weg,
                                  was an Effekten daranhaengt. */}
                              <button className="spell-edit-btn" onClick={e=>{e.stopPropagation();setFf({effects:[],effectsActive:true,...feat});setFfEditId(feat.id);setShowFF(true);}}>✎</button>
                              <button className="spell-delete" onClick={e=>{e.stopPropagation();delFeature(feat.id);}}>✕</button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="feature-card-body">
                        {feat.source && <div className="feature-source">{feat.source}</div>}
                        {(feat.effects||[]).length>0 && (
                          <div className="feature-fx" onClick={e=>e.stopPropagation()}>
                            <div className={"feature-fx-chips"+(feat.effectsActive===false?" ruht":"")}>
                              {(feat.effects||[]).map(e=><span key={e.id} className="fx-chip">{EFFECT_LABELS[e.target]||e.target} {effectText(e)}</span>)}
                            </div>
                            <button className="feature-fx-tog" disabled={istChronikMerkmal(feat)}
                              onClick={()=>{ if (!istChronikMerkmal(feat)) toggleFeatureFx(feat.id); }}
                              aria-pressed={feat.effectsActive!==false}
                              title={istChronikMerkmal(feat) ? 'Läuft mit der Chronik ab'
                                    : feat.effectsActive===false?'Einschalten':'Ausschalten'}>
                              {feat.effectsActive===false ? '◇ Ruht' : '✦ Wirkt'}
                            </button>
                          </div>
                        )}
                      </div>
                      {feat.description && (
                        <div className="feature-card-desc-wrap">
                          <div><div className="feature-card-desc">{feat.description}</div></div>
                        </div>
                      )}
                    </div>
                  ))}</div>
              }
              <button className="btn-add" onClick={()=>{setFf({name:'',source:'',description:'',effects:[],effectsActive:true});setFfEditId(null);setShowFF(true);}}>+ Fähigkeit hinzufügen</button>
            </div>
            {/* Sprachen, Werkzeuge, Waffen & Rüstungen */}
            <div className="profs-grid">
              {[
                {title:'🗣 Sprachen', items:languages, add:addLanguage, del:delLanguage, placeholder:'z.B. Gemeinsprache, Elfisch'},
                {title:'🔧 Werkzeugsfähigkeiten', items:toolProfs, add:addToolProf, del:delToolProf, placeholder:'z.B. Diebeswerkzeug'},
                {title:'⚔️ Waffenfähigkeiten', items:weaponProfs, add:addWeaponProf, del:delWeaponProf, placeholder:'z.B. Einfache Waffen, Kriegswaffen'},
                {title:'🛡️ Rüstungsfertigkeiten', items:armorProfs, add:addArmorProf, del:delArmorProf, placeholder:'z.B. Leichte Rüstung, Schilde'}
              ].map(({title,items,add,del,placeholder}) => (
                <div key={title} className="stats-section" style={{marginBottom:0}}>
                  <div className="section-title">{title}</div>
                  <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,overflow:'hidden'}}>
                    {items.length===0 && <div style={{padding:'8px 12px',fontSize:13,color:'var(--text-muted)',fontStyle:'italic'}}>Keine Einträge.</div>}
                    {items.map((item,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',padding:'6px 10px',borderBottom:'1px solid var(--border)',gap:8}}>
                        <div style={{flex:1,fontFamily:"'Roboto',sans-serif",fontSize:14,color:'var(--text-secondary)'}}>{item}</div>
                        <button className="chip-remove" onClick={()=>del(i)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:13,lineHeight:1}}>✕</button>
                      </div>
                    ))}
                    <div style={{display:'flex',gap:6,padding:'6px 10px'}}>
                      <input
                        className="form-input"
                        style={{flex:1,padding:'4px 8px',fontSize:13,background:'transparent',border:'none',borderBottom:'1px solid var(--border)',borderRadius:0,color:'var(--text-primary)'}}
                        placeholder={placeholder}
                        onKeyDown={e=>{if(e.key==='Enter'){add(e.target.value);e.target.value='';}}}
                        onBlur={e=>{if(e.target.value.trim()){add(e.target.value);e.target.value='';}}}
                      />
                      <span style={{fontSize:11,color:'var(--text-muted)',alignSelf:'center',whiteSpace:'nowrap'}}>↵ Enter</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="zauber" && (
          <>
            <div className="slots-panel">
              <div className="slots-panel-header">
                <div className="slots-title">◈ Zauberplätze</div>
                <button className={"panel-edit-btn"+(slotsEdit?" active":"")} onClick={()=>setSlotsEdit(!slotsEdit)}>{slotsEdit?"✓ Fertig":"✏️ Bearbeiten"}</button>
              </div>
              {[1,2,3,4,5,6,7,8,9].every(l=>!slots[l] || slots[l].max===0) && (
                <div style={{color:"var(--text-muted)",fontSize:13,fontStyle:"italic",marginBottom:8}}>Noch keine Slots.{!slotsEdit && ' Klicke "Bearbeiten" zum Hinzufügen.'}</div>
              )}
              <div className="slots-grid">
                {[1,2,3,4,5,6,7,8,9].map(l => {
                  const s = slots[l]||{max:0,used:0};
                  if (!slotsEdit && s.max === 0) return null;
                  return (
                    <div className="slot-row" key={l}>
                      <div className="slot-row-label">Grad {l}</div>
                      <div className="slot-pips">
                        {Array.from({length:s.max}).map((_,i) => (
                          <div key={i} className={"slot-pip "+(i<(s.max-s.used)?"available":"used")} onClick={()=>togSlot(l,i)} />
                        ))}
                        {slotsEdit && <button className="slot-max-btn" onClick={()=>chgMax(l,1)}>+</button>}
                        {slotsEdit && s.max>0 && <button className="slot-max-btn" onClick={()=>chgMax(l,-1)}>−</button>}
                        {!slotsEdit && s.max===0 && <span style={{color:"var(--text-muted)",fontSize:11}}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {[1,2,3,4,5,6,7,8,9].some(l=>slots[l] && slots[l].max>0) && (
                <button className="slot-restore-btn" onClick={resetAll}>↺ Alle Slots wiederherstellen (lange Rast)</button>
              )}
            </div>

            {/* Zaubereipunkte */}
            {(() => {
              const isZauberer = cur.charClass === "Zauberer" || (cur.multiclasses||[]).some(m=>m.charClass==="Zauberer");
              if (!isZauberer) return null;
              return sp.max > 0 ? (
                <div className="sorcery-panel">
                  <div className="slots-panel-header" style={{marginBottom:8}}>
                    <div className="sorcery-title" style={{margin:0}}>✦ Zaubereipunkte</div>
                    <button className={"panel-edit-btn"+(spEdit?" active":"")} onClick={()=>setSpEdit(!spEdit)} style={{borderColor:"var(--arcane-bright)",color:spEdit?"var(--arcane-bright)":"var(--text-muted)",opacity: spEdit?1:0.6}}>{spEdit?"✓ Fertig":"✏️ Bearbeiten"}</button>
                  </div>
                  <div className="sorcery-pips">
                    {Array.from({length:sp.max}).map((_,i) => {
                      const avail = sp.max - sp.used;
                      return <div key={i} className={"sorcery-pip "+(i<avail?"available":"spent")} onClick={()=>togSP(i)} title={i<avail?"Punkt ausgeben":"Punkt zurück"}/>;
                    })}
                    {spEdit && <button className="slot-max-btn" onClick={()=>spChgMax(1)} title="Max erhöhen">+</button>}
                    {spEdit && sp.max>0 && <button className="slot-max-btn" onClick={()=>spChgMax(-1)} title="Max verringern">−</button>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:18,color:"var(--arcane-bright)"}}>
                      {sp.max-sp.used} <span style={{fontSize:11,color:"var(--text-muted)"}}>/ {sp.max}</span>
                    </div>
                    {sp.used>0 && <button className="slot-restore-btn" style={{borderColor:"var(--arcane-bright)",color:"var(--arcane-bright)"}} onClick={()=>updSP({...sp,used:0})}>↺ Wiederherstellen (Lange Rast)</button>}
                  </div>
                </div>
              ) : (
                <button className="btn-add" style={{marginBottom:16}} onClick={()=>updSP({max:cur.level,used:0})}>✦ Zaubereipunkte aktivieren</button>
              );
            })()}

            {/* Ressourcen-Tracker */}


            <div className="section-title" style={{marginBottom:8}}>✨ Bekannte Zauber</div>
            {(() => {
              // Build all class/dmg tags from current spells using tplData lookup
              // Ein Bogen ohne Zauberliste ist keiner mit einer leeren: er
              // kommt so von aelteren Staenden und von aussen herein. Ohne
              // die Klammer sturzt der ganze Reiter ab.
              const alleSprueche = cur.spells || [];
              const allSpellClasses = [...new Set(alleSprueche.flatMap(s => s.classes||[]))].sort();
              const allSpellDmg = [...new Set(alleSprueche.flatMap(s => s.damageTags||[]))].sort();
              const hasFilters = allSpellClasses.length>0 || allSpellDmg.length>0;
              const filterActive = spellTagFilter.classes.length>0 || spellTagFilter.dmg.length>0;
              return hasFilters && (
                <div className="marken-reihe" style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12,alignItems:'center'}}>
                  {allSpellClasses.map(c=>{const cc={'Artifizient':'#70b8c8','Barbar':'#c84040','Barde':'#4090c0','Druide':'#52b788','Hexenmeister':'#9060c0','Kämpfer':'#c08040','Kleriker':'#e0c040','Magier':'#6080d0','Mönch':'#d09040','Paladin':'#e0a030','Schurke':'#808080','Waldläufer':'#70a050','Zauberer':'#c060a0'};const col=cc[c]||'#c9a84c';const on=spellTagFilter.classes.includes(c);
                    return <button key={c} onClick={()=>setSpellTagFilter(f=>({...f,classes:on?f.classes.filter(x=>x!==c):[...f.classes,c]}))}
                      style={{padding:'2px 8px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',letterSpacing:'0.06em',
                        border:'1px solid '+(on?col:col+'40'),background:on?col+'22':'var(--bg-card)',color:on?col:'var(--text-muted)'}}>
                      {c}
                    </button>;
                  })}
                  {allSpellDmg.map(d=>{
                    const dc={Feuer:'#e07030',Kälte:'#70b8d8',Blitz:'#c0d850',Säure:'#90c040',Gift:'#80b030',Nekrose:'#9060c0',Strahlend:'#f0e060',Psychisch:'#c070d0',Kraft:'#80a0f0',Hieb:'#a07050',Stich:'#b08060',Wucht:'#c09070'}[d]||'#a0a0a0';
                    const on = spellTagFilter.dmg.includes(d);
                    return (
                      <button key={d} onClick={()=>setSpellTagFilter(f=>({...f,dmg:f.dmg.includes(d)?f.dmg.filter(x=>x!==d):[...f.dmg,d]}))}
                        style={{padding:'2px 8px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',letterSpacing:'0.06em',
                          border:`1px solid ${on?dc:dc+'40'}`,background:on?dc+'22':'var(--bg-card)',color:on?dc:'var(--text-muted)'}}>
                        ⚔️ {d}
                      </button>
                    );
                  })}
                  {filterActive && <button onClick={()=>setSpellTagFilter({classes:[],dmg:[]})} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:11,fontFamily:"'Roboto Condensed',sans-serif",padding:'2px 6px'}}>✕ zurücksetzen</button>}
                </div>
              );
            })()}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <button className="btn-add" style={{flex:1}} onClick={()=>{setSf({...newSpell(),level:0});setSfEditId(null);setShowSF(true);}}>+ Zaubertrick</button>
              <button className="btn-add" style={{flex:1}} onClick={()=>{setSf(newSpell());setSfEditId(null);setShowSF(true);}}>+ Zauber (Grad 1–9)</button>
              <button className="btn-add" style={{flex:1,borderColor:"var(--arcane-bright)",color:"var(--arcane-bright)"}} onClick={()=>openTpl('spell')}>📖 Von Vorlage (SRD)</button>
            </div>
            {/* Der Einleser fuer alle auf einmal. Er fasst nur an, was noch
                keine Wirkung hat — was von Hand eingetragen wurde, bleibt.
                Ohne ihn muesste jeder Zauber einzeln aufgemacht werden. */}
            {darfBearbeiten && (cur.spells||[]).length > 0 && (
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
                <button className="btn-add" style={{borderColor:"var(--inspiration)",color:"var(--inspiration)"}}
                  title="Würfel, Rettungswurf und Steigerung aus den Beschreibungen übernehmen — für alle Zauber, bei denen noch nichts eingetragen ist"
                  onClick={()=>{
                    let n = 0;
                    const neu = (cur.spells || []).map(sp => {
                      if (hatWirkung(sp.wirkung) || !String(sp.description || '').trim()) return sp;
                      const w = wirkungAusText(sp.description, sp.damageTags);
                      if (!hatWirkung(w)) return sp;
                      n++;
                      return {...sp, wirkung: w};
                    });
                    if (n) patchChar({spells: neu});
                    setNachgetragen(n);
                  }}>↧ Würfel nachtragen</button>
                {nachgetragen !== null && (
                  <span style={{fontSize:12.5,color:nachgetragen?"var(--inspiration)":"var(--text-muted)"}}>
                    {nachgetragen
                      ? nachgetragen + (nachgetragen === 1 ? ' Zauber ergänzt' : ' Zauber ergänzt')
                        + ' — im Zugfenster steht der Würfel jetzt dabei.'
                      : 'Nichts zu ergänzen: entweder steht die Wirkung schon da, oder in der Beschreibung steht kein Würfel.'}
                  </span>
                )}
              </div>
            )}
            {(cur.spells||[]).length===0
              ? <div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:14,marginBottom:12}}>Noch keine Zauber eingetragen.</div>
              : [0,...sls.filter(l=>l!==0)].filter(l=>sbl[l]).map(l => {
                  const isCollapsed = collapsedLevels.has(l);
                  const toggleLevel = () => setCollapsedLevels(prev => {
                    const next = new Set(prev);
                    if (next.has(l)) next.delete(l); else next.add(l);
                    return next;
                  });
                  return (
                  <div className="spell-level-group" key={l}>
                    <div className="spell-level-header" style={{cursor:"pointer"}} aria-expanded={!isCollapsed}
                      {...clickable(toggleLevel, (l===0?"Zaubertricks":"Grad "+l)+" auf- oder zuklappen")}>
                      <div className="spell-level-title">{l===0?"✦ Zaubertricks":"Grad "+l}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
                        {l>0 && slots[l] && slots[l].max>0 && (
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            {Array.from({length:slots[l].max}).map((_,i) => {
                              const avail = slots[l].max - slots[l].used;
                              return <div key={i} onClick={e=>{e.stopPropagation();togSlot(l,i);}} style={{
                                width:14, height:14, borderRadius:"50%",
                                background: i<avail ? "var(--gold-dim)" : "transparent",
                                border: "1px solid " + (i<avail ? "var(--gold)" : "var(--border-bright)"),
                                cursor:"pointer", flexShrink:0,
                                boxShadow: i<avail ? "0 0 4px rgba(201,168,76,0.4)" : "none",
                                transition:"all 0.15s"
                              }} title={i<avail ? "Slot verfügbar" : "Slot verbraucht"} />;
                            })}
                            <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:"var(--gold)",marginLeft:2,opacity:0.85}}>
                              {slots[l].max-slots[l].used}/{slots[l].max}
                            </span>
                          </div>
                        )}
                        <div className="spell-level-count">{(() => {
                          const prep = sbl[l].filter(s=>s.prepared!==false).length;
                          const unprep = sbl[l].filter(s=>s.prepared===false).length;
                          if (unprep===0) return sbl[l].length+" Zauber";
                          return prep+" ✓"+(unprep?" · "+unprep+" ○":"");
                        })()}</div>
                        <div style={{fontSize:10,color:"var(--text-muted)",marginLeft:4,transition:"transform 0.2s",transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)"}}>▾</div>
                      </div>
                    </div>
                    {!isCollapsed && (() => {
                      const tagFilterFn = s => {
                        if (spellTagFilter.classes.length===0 && spellTagFilter.dmg.length===0) return true;
                        const classOk = spellTagFilter.classes.length===0 || spellTagFilter.classes.some(c=>(s.classes||[]).includes(c));
                        const dmgOk = spellTagFilter.dmg.length===0 || spellTagFilter.dmg.some(d=>(s.damageTags||[]).includes(d));
                        return classOk && dmgOk;
                      };
                      const preparedSpells = sbl[l].filter(s => s.prepared!==false && tagFilterFn(s));
                      const unpreparedSpells = sbl[l].filter(s => s.prepared===false && tagFilterFn(s));
                      const renderSpell = s => {
                        const sc = SC[s.school]||SC["Hervorrufung"];
                        const spellClasses = s.classes||[];
                        const spellDmgTags = s.damageTags||[];
                        const levelLabel = s.level===0 ? 'Zaubertrick' : `${s.level}. Grad · ${s.school}`;
                        return (
                          <div key={s.id} className={"spell-card"+(exSpell===s.id?" expanded":"")}
                            style={{borderColor: sc.border, borderWidth:2}} aria-expanded={exSpell===s.id}
                            {...clickable(()=>setExSpell(exSpell===s.id?null:s.id), s.name)}>
                            {/* Header: colored band with name */}
                            <div className="spell-card-header" style={{background:`linear-gradient(180deg, ${sc.border} 0%, ${sc.bg} 100%)`}}>
                              <div className="spell-card-name">{s.name}</div>
                              <div className="spell-card-school-label">{levelLabel}</div>
                            </div>
                            {/* Stats: 2×2 grid */}
                            <div className="spell-card-stats-grid">
                              <div className="spell-card-stat-cell">
                                <div className="spell-card-stat-label" style={{color:sc.text}}>Wirkzeit</div>
                                <div className="spell-card-stat-value">{s.castingTime||'—'}</div>
                              </div>
                              <div className="spell-card-stat-cell">
                                <div className="spell-card-stat-label" style={{color:sc.text}}>Reichweite</div>
                                <div className="spell-card-stat-value">{s.range||'—'}</div>
                              </div>
                              <div className="spell-card-stat-cell">
                                <div className="spell-card-stat-label" style={{color:sc.text}}>Komponenten</div>
                                <div className="spell-card-stat-value">{s.components||'—'}</div>
                              </div>
                              <div className="spell-card-stat-cell">
                                <div className="spell-card-stat-label" style={{color:sc.text}}>Dauer</div>
                                <div className="spell-card-stat-value">{s.duration||'—'}</div>
                              </div>
                            </div>
                            {/* Expandable description */}
                            <div className="spell-card-desc-wrap">
                              <div><div className="spell-card-desc" dangerouslySetInnerHTML={{__html:sanitizeHtml(s.description)}} /></div>
                            </div>
                            {/* Tags row */}
                            {(spellClasses.length>0||spellDmgTags.length>0) && (
                              <div className="spell-card-tags">
                                {/* Getoent statt gefuellt: die Karte ist jetzt dunkel,
                                    dort traegt die Farbe selbst als Schrift. */}
                                {spellClasses.map(c=>{const col=CC_COLORS[c]||'#c9a84c';
                                  return <span key={c} style={{padding:'1px 6px',borderRadius:8,fontFamily:"'Roboto Condensed',sans-serif",fontSize:8,letterSpacing:'0.05em',background:col+'22',border:'1px solid '+col+'80',color:col}}>{c}</span>;
                                })}
                                {spellDmgTags.map(d=>{const col=DMG_COLORS[d]||'#a0a0a0';
                                  return <span key={d} style={{padding:'1px 6px',borderRadius:8,fontFamily:"'Roboto Condensed',sans-serif",fontSize:8,letterSpacing:'0.05em',background:col+'22',border:'1px solid '+col+'80',color:col}}>⚔ {d}</span>;
                                })}
                              </div>
                            )}
                            {/* Footer: school + actions */}
                            <div className="spell-card-footer" style={{background:`${sc.bg}cc`}}>
                              <div className="spell-card-school-footer" style={{color:sc.text}}>{s.school}</div>
                              <div className="spell-actions" onClick={e=>e.stopPropagation()} style={{alignItems:'center',gap:4}}>
                                <button title={s.prepared===false?"Vorbereiten":"Nicht vorbereitet markieren"}
                                  onClick={e=>{e.stopPropagation();toggleSpellPrepared(s.id);}}
                                  style={{background:'none',border:'none',cursor:'pointer',padding:'1px 3px',lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  <span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',
                                    background:s.prepared===false?'#e0c040':'#3aaa5c',
                                    boxShadow:s.prepared===false?'0 0 4px #e0c040aa':'0 0 6px #3aaa5caa',
                                    transition:'all 0.2s'}} />
                                </button>
                                <button className="spell-edit-btn" onClick={e=>{e.stopPropagation();setSf({...s});setSfEditId(s.id);setShowSF(true);}}                                  style={{background:'rgba(0,0,0,0.12)',border:'none',color:'rgba(0,0,0,0.5)',cursor:'pointer',fontSize:10,padding:'2px 5px',borderRadius:3}}>✎</button>
                                <button className="spell-delete" onClick={e=>{e.stopPropagation();delSpell(s.id);}}>✕</button>
                              </div>
                            </div>
                          </div>
                        );
                      };
                      return (
                        <>
                          <div className="spells-list">{preparedSpells.map(renderSpell)}</div>
                          {unpreparedSpells.length>0 && (
                            <div style={{marginTop:8}}>
                              <div
                                onClick={()=>setOpenUnprepared(prev=>{const s=new Set(prev);s.has(l)?s.delete(l):s.add(l);return s;})}
                                style={{cursor:'pointer',fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:'var(--text-muted)',letterSpacing:'0.1em',
                                  textTransform:'uppercase',display:'flex',alignItems:'center',gap:6,padding:'4px 0',
                                  borderTop:'1px solid var(--border)',userSelect:'none'}}>
                                <span style={{fontSize:9,transition:'transform 0.2s',transform:openUnprepared.has(l)?'rotate(90deg)':'rotate(0deg)'}}>▶</span>
                                {unpreparedSpells.length} nicht vorbereitet
                              </div>
                              {openUnprepared.has(l) && (
                                <div className="spells-list" style={{marginTop:8,opacity:0.6}}>
                                  {unpreparedSpells.map(renderSpell)}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })
            }

            {(cur.charClass==="Druide" || (cur.multiclasses||[]).some(m=>m.charClass==="Druide")) && (
              <>
                <button className="btn-add" style={{marginTop:8,borderColor:"#52b788",color:"#52b788",width:"100%"}} onClick={()=>openTpl('wildshape')}>🐺 Tierverwandlungs-Bestiar</button>
                {(cur.wsFavorites||[]).length > 0 && tplData && tplData.wildshapes && (() => {
                  const statMod = v => { const m=Math.floor((v-10)/2); return (m>=0?'+':'')+m; };
                  const favAnimals = tplData.wildshapes.filter(w => (cur.wsFavorites||[]).includes(w.name));
                  return (
                    <div style={{marginTop:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,paddingBottom:6,borderBottom:"1px solid var(--border)"}}>
                        <div className="section-title" style={{margin:0}}>⭐ Tierverwandlung – Favoriten</div>
                        <div style={{fontSize:11,color:"var(--text-muted)",marginLeft:"auto"}}>{favAnimals.length} Tiere</div>
                      </div>
                      <div className="spells-list">
                        {favAnimals.map((w,i) => {
                          const isExp = wsExpand === ("fav_"+w.name);
                          return (
                            <div key={i} className={"spell-card"+(isExp?" expanded":"")}
                              style={{borderColor:"#52b78880"}}
                              onClick={()=>setWsExpand(isExp?null:("fav_"+w.name))}>
                              <div className="spell-card-banner" style={{background:"linear-gradient(135deg,#1a3d2b 0%,#2a5c3f80 100%)"}}>
                                <div className="spell-card-orb" style={{background:"#52b78840",borderColor:"#52b78880",color:"#52b788",fontSize:10}}>CR{w.cr}</div>
                                <div className="spell-card-school-label" style={{flex:1}}>{w.name}</div>
                                <div className="spell-actions" onClick={e=>e.stopPropagation()}>
                                  <button className="spell-edit-btn" style={{color:"#f0c040"}} title="Aus Favoriten entfernen"
                                    onClick={e=>{e.stopPropagation();toggleWsFav(w.name);}}>★</button>
                                </div>
                              </div>
                              <div className="spell-card-body">
                                <div className="spell-card-name" style={{fontSize:10,color:"#52b788",opacity:0.85}}>{w.size} · {w.type}</div>
                                <div className="spell-card-stats">
                                  <div className="spell-card-stat"><strong>RK</strong>{w.ac}</div>
                                  <div className="spell-card-stat"><strong>TP</strong>{w.hp}</div>
                                  <div className="spell-card-stat"><strong>Bew.</strong>{w.speed}</div>
                                </div>
                                <div className="spell-card-stats" style={{marginTop:4}}>
                                  {[['STR',w.str],['GES',w.dex],['KON',w.con],['INT',w.int],['WEI',w.wis],['CHA',w.cha]].map(([l,v])=>(
                                    <div key={l} className="spell-card-stat"><strong>{l}</strong>{v} ({statMod(v)})</div>
                                  ))}
                                </div>
                              </div>
                              {isExp && (
                                <div className="spell-card-desc-wrap">
                                  <div className="spell-card-desc">
                                    {w.senses && <div style={{marginBottom:4}}>👁 <strong>Sinne:</strong> {w.senses}</div>}
                                    {w.skills && <div style={{marginBottom:4}}>🎯 <strong>Fertigk.:</strong> {w.skills}</div>}
                                    {(w.tags||[]).length>0 && <div style={{marginBottom:6}}>{w.tags.map(t=><span className="ws-tag" key={t} style={{marginRight:4,marginBottom:2,display:"inline-block"}}>{t}</span>)}</div>}
                                    {w.abilities && w.abilities.map((a,ai)=><div key={ai} style={{marginBottom:3}}>• {a}</div>)}
                                    {w.actions && w.actions.map((a,ai)=>(
                                      <div key={ai} style={{marginTop:4,borderTop:"1px solid #52b78830",paddingTop:4}}>
                                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:"#52b788",marginBottom:2}}>⚔ {a.name}</div>
                                        <div style={{fontSize:12}}>{a.desc}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

          </>
        )}

        {tab==="inventar" && (
          <>
            <div className="section-title" style={{marginBottom:12}}>💰 Währung</div>
            <div className="currency-row">
              {COINS.map(c => {
                const val = currency[c.key]||0;
                return (
                  <div className="currency-box" key={c.key}
                    style={{borderColor:c.color+'40', cursor:'pointer', userSelect:'none'}}
                    onClick={e=>{
                      setCoinDelta('');
                      setCoinPopover({key:c.key, label:c.label, color:c.color, val});
                    }}>
                    <div className="currency-icon" style={{color:c.color}}>🪙</div>
                    <div className="currency-label" style={{color:c.color}}>{c.label}</div>
                    <div className="currency-input" style={{color:c.color,borderColor:c.color+'40',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,minHeight:32}}>
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:"var(--text-muted)",textAlign:"right",marginBottom:20}}>
              Gesamtwert: <span style={{color:"var(--gold)"}}>{totalGp.toFixed(2)} GM</span>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div className="section-title" style={{marginBottom:0,flex:1}}>🎒 Gegenstände</div>
              {!transferMode ? (
                <>
                  <button className="btn-icon" style={{padding:"4px 10px",fontSize:11,borderColor:"var(--border-bright)",color:"var(--text-secondary)"}}
                    onClick={()=>{setItf(newItem());setItfEditId(null);setShowIF(true);}}>+ Hinzufügen</button>
                  {inv.length > 0 && chars.filter(c=>c.id!==sel && !c.archived && (!c.dmOnly || isDmMode)).length > 0 && (
                    <button className="btn-icon" style={{padding:"4px 10px",fontSize:11,borderColor:"#7ab8f5",color:"#7ab8f5"}}
                      onClick={()=>{setTransferMode(true);setTransferSel(new Set());}}>➤ Übergeben</button>
                  )}
                </>
              ) : (
                <>
                  <button className="btn-icon" style={{padding:"4px 10px",fontSize:11}}
                    onClick={()=>{setTransferMode(false);setTransferSel(new Set());}}>✕ Abbrechen</button>
                  <button className="btn-icon"
                    style={{padding:"4px 10px",fontSize:11,borderColor:transferSel.size>0?"#7ab8f5":"var(--border)",color:transferSel.size>0?"#7ab8f5":"var(--text-muted)",opacity:transferSel.size>0?1:0.5}}
                    onClick={()=>{ if(transferSel.size>0) setShowTransfer(true); }}
                    disabled={transferSel.size===0}>
                    ➤ {transferSel.size>0 ? `${transferSel.size} übergeben` : "Auswahl..."}
                  </button>
                </>
              )}
            </div>
            {inv.length > 0 && (() => {
              const allTags = [...new Set(inv.flatMap(i=>i.tags||[]))].sort((a,b)=>a.localeCompare(b,"de"));
              return (
                <div style={{marginBottom:12}}>
                  {/* Die Suche laeuft ueber alle Angaben eines Gegenstands:
                      Name, Schlagworte, Herkunft, Seltenheit, Effekte und
                      Beschreibung. Zuruecksetzen raeumt Suche, Seltenheit und
                      Schlagworte in einem Griff weg — am Tablet waere das
                      sonst ein Weg ueber drei Bedienelemente. */}
                  <div className="inv-search-bar">
                    <div className="inv-search-field">
                      <span className="inv-search-icon" aria-hidden="true">🔍</span>
                      <input ref={invSucheRef} className="inv-search-input" type="search"
                        placeholder="Gegenstände durchsuchen…" value={invSuche}
                        aria-label="Gegenstände durchsuchen" autoComplete="off"
                        onChange={e=>setInvSuche(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Escape' && invSuche){ e.stopPropagation(); setInvSuche(""); } }} />
                    </div>
                    <select className="tpl-filter-select" value={invRarity}
                      onChange={e=>setInvRarity(e.target.value)} style={{padding:"6px 8px"}}>
                      <option value="all">Alle Seltenheiten</option>
                      {RARITIES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    {(invSuche.trim()!=="" || invRarity!=='all' || invTagFilter.length>0) && (
                      <button className="inv-search-reset" onClick={invFilterLeeren}>
                        ✕ Zurücksetzen
                      </button>
                    )}
                  </div>
                  {allTags.length>0 && (
                    <div className="tag-filter-bar">
                      {allTags.map(tag=><button key={tag} className={"tag-filter-btn"+(invTagFilter.includes(tag)?" active":"")} onClick={()=>setInvTagFilter(invTagFilter.includes(tag)?invTagFilter.filter(t=>t!==tag):[...invTagFilter,tag])}>{tag}</button>)}
                    </div>
                  )}
                </div>
              );
            })()}
            {(() => {
              const rarityOrder = {artefakt:0,legendär:1,sehrSelten:2,selten:3,ungewöhnlich:4,gewöhnlich:5};
              const such = invSuche.trim();
              const filtered = inv.map(item => {
                const matchRarity = invRarity==='all' || item.rarity===invRarity;
                const matchTags = invTagFilter.length===0 || invTagFilter.every(t=>(item.tags||[]).includes(t));
                if (!matchRarity || !matchTags) return null;
                const rl = (RARITIES.find(x=>x.key===item.rarity)||{}).label;
                const score = itemSearchScore(item, such, rl);
                return score > 0 ? {item, score} : null;
              }).filter(Boolean).sort((a,b) => {
                // Bei einer Suche zaehlt die Trefferguete, sonst bleibt es bei
                // der gewohnten Ordnung nach Seltenheit.
                if (such) return b.score - a.score || a.item.name.localeCompare(b.item.name, 'de');
                const rd = ((rarityOrder[a.item.rarity] !== undefined ? rarityOrder[a.item.rarity] : 5)) - ((rarityOrder[b.item.rarity] !== undefined ? rarityOrder[b.item.rarity] : 5));
                return rd !== 0 ? rd : a.item.name.localeCompare(b.item.name, 'de');
              }).map(x => x.item);
              if (inv.length===0) return <div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:14,marginBottom:12}}>Keine Gegenstände im Inventar.</div>;
              if (filtered.length===0) return (
                <div className="inv-leer">
                  <div>Keine Gegenstände gefunden{such ? <> für „{such}“</> : null}.</div>
                  <button className="inv-search-reset" onClick={invFilterLeeren}>✕ Zurücksetzen</button>
                </div>
              );
              return (
                <div>
                  {transferMode && (
                    <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                      <input type="checkbox"
                        checked={filtered.length>0 && filtered.every(i=>transferSel.has(i.id))}
                        onChange={e=>{ if(e.target.checked) setTransferSel(new Set(filtered.map(i=>i.id))); else setTransferSel(new Set()); }}
                        style={{cursor:'pointer',accentColor:'var(--gold)'}}/>
                      <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-muted)'}}>Alle auswählen</span>
                    </div>
                  )}
                  <div>
                    {transferMode && (
                      <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                        <input type="checkbox"
                          checked={filtered.length>0 && filtered.every(i=>transferSel.has(i.id))}
                          onChange={e=>{ if(e.target.checked) setTransferSel(new Set(filtered.map(i=>i.id))); else setTransferSel(new Set()); }}
                          style={{cursor:'pointer',accentColor:'var(--gold)'}}/>
                        <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-muted)'}}>Alle auswählen</span>
                      </div>
                    )}
                    <div className="inv-grid">
                      {filtered.map(item => {
                        const r = RARITIES.find(x=>x.key===item.rarity)||RARITIES[0];
                        const checked = transferSel.has(item.id);
                        const icon = item.icon || '🎒';
                        const isExp = exItem === item.id;
                        return (
                          <div key={item.id} className={"inv-card"+(isExp?" expanded":"")}
                            style={{borderColor:r.color, outline:transferMode&&checked?`2px solid ${r.color}`:'none', outlineOffset:2}}
                            aria-pressed={transferMode?checked:undefined}
                            {...clickable(transferMode
                              ? ()=>{ const s=new Set(transferSel); checked?s.delete(item.id):s.add(item.id); setTransferSel(s); }
                              : ()=>setItemViewer(item), item.name)}>
                            {/* Header: always visible, qty badge top-left */}
                            {/* Getöntes statt vollflächig farbiges Band: die volle Seltenheitsfarbe
                                war im abgedunkelten Raum die hellste Fläche der App und liess
                                fuer den Namen keinen lesbaren Kontrast zu. Die Farbe traegt
                                weiterhin der 2px-Rahmen der Karte. */}
                            <div className="inv-card-header" style={{background:`linear-gradient(180deg, ${r.color}30 0%, ${r.color}14 100%), var(--bg-card)`, borderBottom:`1px solid ${r.color}55`, position:'relative'}}>
                              <div style={{position:'absolute',top:5,left:6,background:'var(--bg-void)',color:'var(--parchment)',
                                border:`1px solid ${r.color}77`,
                                fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,fontWeight:700,lineHeight:1,
                                padding:'2px 5px',borderRadius:8,minWidth:16,textAlign:'center',
                                display:item.qty>1?'block':'none'}}>
                                {item.qty}
                              </div>
                              <div className="inv-card-icon">{icon}</div>
                              <div className="inv-card-name">{item.name}</div>
                            </div>
                            {/* Expandable body */}
                            <div className="inv-card-body-wrap">
                              <div>
                                <div style={{padding:'7px 9px',background:'var(--bg-card)'}}>
                                  {/* Image — clickable, full width */}
                                  {item.imageData && (
                                    <img src={item.imageData} alt={item.name}
                                      style={{width:'100%',borderRadius:4,marginBottom:6,cursor:'zoom-in',display:'block',objectFit:'contain',maxHeight:180}}
                                      onClick={e=>{e.stopPropagation();setImgViewer({name:item.name,imageData:item.imageData});}} />
                                  )}
                                  {item.description && <div style={{fontFamily:"'Roboto',sans-serif",fontSize:12,color:'var(--text-secondary)',lineHeight:1.45,marginBottom:4}} dangerouslySetInnerHTML={{__html:sanitizeHtml(item.description)}} />}
                                  {item.source && <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>📦 {item.source}</div>}
                                  {(item.tags||[]).length>0 && (
                                    <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:4}}>
                                      {(item.tags||[]).map(t=><span key={t} className={"inv-tag"+(invTagFilter.includes(t)?" active":"")}
                                        onClick={e=>{e.stopPropagation();if(!transferMode)setInvTagFilter(invTagFilter.includes(t)?invTagFilter.filter(x=>x!==t):[...invTagFilter,t]);}}>{t}</span>)}
                                    </div>
                                  )}
                                  {item.weight && <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase'}}>{item.weight} kg</div>}
                                </div>
                                <div className="inv-card-footer">
                                  {transferMode
                                    ? <input type="checkbox" checked={checked}
                                        onChange={e=>{const s=new Set(transferSel);e.target.checked?s.add(item.id):s.delete(item.id);setTransferSel(s);}}
                                        style={{cursor:'pointer',accentColor:'var(--gold)',width:14,height:14}} onClick={e=>e.stopPropagation()}/>
                                    : <div className="inv-card-actions" onClick={e=>e.stopPropagation()} style={{width:'100%',justifyContent:'flex-end'}}>
                                        <button onClick={e=>{e.stopPropagation();setItf({...item});setItfEditId(item.id);setShowIF(true);}}
                                          style={{background:'rgba(232,213,163,0.10)',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:10,padding:'3px 8px',borderRadius:3}}>✎</button>
                                        <button onClick={e=>{e.stopPropagation();delItem(item.id);}}
                                          style={{background:'rgba(232,213,163,0.10)',border:'none',color:'#d98a8a',cursor:'pointer',fontSize:10,padding:'3px 8px',borderRadius:3}}>✕</button>
                                      </div>
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{marginTop:10,display:'flex',gap:12,flexWrap:'wrap'}}>
                    {totalWeight>0 && <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:"var(--text-muted)"}}>Gesamtgewicht: <span style={{color:"var(--text-secondary)"}}>{totalWeight.toFixed(2)} kg</span></div>}
                    {(such||invRarity!=='all'||invTagFilter.length>0) && <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:"var(--text-muted)"}}>{filtered.length} von {inv.length} Gegenständen</div>}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {tab==="notizen" && (
          <>
            <div className="section-title" style={{marginBottom:12}}>📜 Notizen</div>
            {(() => {
              const allNoteTags = [...new Set(notesList.flatMap(n=>n.tags||[]))].sort();
              const filtered = (noteTagFilter.length===0 ? notesList : notesList.filter(n=>(n.tags||[]).some(t=>noteTagFilter.includes(t))))
                .slice().sort((a,b)=>(a.title||'').localeCompare(b.title||'','de'));
              return (
                <>
                  {allNoteTags.length>0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12,alignItems:'center'}}>
                      <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Filter:</span>
                      {allNoteTags.map(t=>(
                        <button key={t} className={"tag-filter-btn"+(noteTagFilter.includes(t)?' active':'')}
                          onClick={()=>setNoteTagFilter(noteTagFilter.includes(t)?noteTagFilter.filter(x=>x!==t):[...noteTagFilter,t])}>
                          {t}
                        </button>
                      ))}
                      {noteTagFilter.length>0 && <button onClick={()=>setNoteTagFilter([])} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:11,fontFamily:"'Roboto Condensed',sans-serif",padding:'2px 6px'}}>✕ zurücksetzen</button>}
                    </div>
                  )}
                  {filtered.length===0
                    ? <div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:14,marginBottom:12}}>{notesList.length===0?'Noch keine Notizen vorhanden.':'Keine Notizen für diesen Filter.'}</div>
                    : filtered.map(note => {
                        const isEx = exNote === note.id;
                        return (
                          <div className="note-card" key={note.id}
                            onClick={()=>setExNote(isEx ? null : note.id)}
                            style={{borderColor: isEx ? 'var(--gold-dim)' : ''}}>
                            <div className="note-card-header">
                              <div className="note-card-title">📄 {note.title}</div>
                              <button className="btn-icon" style={{padding:"3px 8px",fontSize:11}}
                                onClick={e=>{e.stopPropagation();setNf({title:note.title,content:note.content,tags:note.tags||[]});setNfEditId(note.id);setShowNF(true);}}>
                                ✏️ Bearbeiten
                              </button>
                              <button className="note-del" onClick={e=>{e.stopPropagation();delNote(note.id);}}>✕</button>
                            </div>
                            {(note.tags||[]).length>0 && (
                              <div className="inv-tags" style={{marginTop:4}}>
                                {(note.tags).map(t=>(
                                  <span key={t} className={"inv-tag"+(noteTagFilter.includes(t)?' active':'')}
                                    onClick={e=>{e.stopPropagation();setNoteTagFilter(noteTagFilter.includes(t)?noteTagFilter.filter(x=>x!==t):[...noteTagFilter,t]);}}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            {note.content && (
                              <div className={"note-card-body"+(isEx?" open":"")}>
                                <div>
                                  {!isEx
                                    ? <div className="note-card-preview">{note.content.length>120?note.content.slice(0,120)+'…':note.content}</div>
                                    : <div style={{marginTop:8,fontFamily:"'Roboto',sans-serif",fontSize:15,color:"var(--text-secondary)",lineHeight:1.7,whiteSpace:"pre-wrap",paddingBottom:4}}>{note.content}</div>
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                  }
                </>
              );
            })()}
            <button className="btn-add" onClick={()=>{setNf({title:'',content:'',tags:[]});setNfEditId(null);setShowNF(true);}}>+ Neue Notiz</button>
          </>
        )}

        {/* Auswahl der Leisten-Werte. Bewusst ein Dialog statt einer
            aufklappbaren Zeile: die Leiste selbst soll schmal bleiben. */}
        {leisteWahlOffen && (
          <div className="form-overlay" onClick={()=>setLeisteWahlOffen(false)}>
            <div className="form-modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
              <div className="form-title">⚙ Werte in der Leiste</div>
              <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:14,lineHeight:1.5}}>
                Was hier ausgewählt ist, steht oben in der mitscrollenden Leiste.
                Die Auswahl gehört zum Helden — jeder in der Gruppe hat seine eigene.
              </div>
              <div className="leiste-wahl">
                {stickyKatalog.map(b => {
                  const an = stickyWahl.includes(b.k);
                  const letzter = an && stickyWahl.length <= 1;
                  return (
                    <label key={b.k} className={"leiste-wahl-zeile"+(an?" an":"")}
                      title={letzter ? "Mindestens ein Wert muss bleiben" : undefined}>
                      <input type="checkbox" checked={an} disabled={letzter}
                        onChange={()=>stickyUmschalten(b.k)} />
                      <span className="leiste-wahl-name">{b.i} {b.l}</span>
                      <span className="leiste-wahl-wert">{b.v}</span>
                    </label>
                  );
                })}
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={()=>patchChar({stickyFields:STICKY_STANDARD})}>Zurücksetzen</button>
                <button className="btn-save" onClick={()=>setLeisteWahlOffen(false)}>Fertig</button>
              </div>
            </div>
          </div>
        )}

        {tab==="log" && (
          <LogTab charId={sel} charName={cur?.name} addLog={addLog} isDmMode={isDmMode} />
        )}
      </div>
    );
};
