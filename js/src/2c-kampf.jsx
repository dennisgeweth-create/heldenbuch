// Heldenbuch — der Kampf.
//
// Die Initiativliste aus Gegnern einer Begegnung und den Helden des
// offenen Abenteuers. Anders als im alten Kampftracker uebersteht sie ein
// Neuladen: der Stand liegt im Geraet, nicht nur im Arbeitsspeicher.
//
// Bewusst uebernommen aus dem alten Tracker, weil dort richtig entschieden:
// die Trefferpunkte der Gegner werden ausgewuerfelt statt gemittelt,
// gleichartige Gegner durchnummeriert, und die Zustaende sind eine feste
// Liste statt freier Eingabe.

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

// ── Kampf aufstellen ─────────────────────────────────────────────
const kampfAufstellen = (begegnung, enemies, helden, setDefs) => {
  const teilnehmer = [];

  (begegnung.enemies || []).forEach(({enemyId, count, name}) => {
    const vorlage = enemies.find(e => e.id === enemyId);
    if (!vorlage) return;                       // geloescht — still ueberspringen
    const anzahl = Math.max(1, +count || 1);
    for (let i = 0; i < anzahl; i++) {
      const tp = wuerfelTP(vorlage);
      teilnehmer.push({
        id: enemyId + '-' + Date.now().toString(36) + '-' + i,
        art: 'gegner', vorlageId: enemyId,
        name: anzahl > 1 ? (name || vorlage.name) + ' ' + (i+1) : (name || vorlage.name),
        ac: +vorlage.ac || 10, hpMax: tp, hp: tp, tempHp: 0,
        ini: w20() + mod(+vorlage.dex || 10), dex: +vorlage.dex || 10,
        zustaende: [], erschoepfung: 0, bild: vorlage.image || null,
      });
    }
  });

  helden.forEach(h => {
    const werte = charWerte(h, setDefs);
    teilnehmer.push({
      id: 'held-' + h.id, art: 'held', charId: h.id,
      name: h.name,
      unterzeile: (h.race ? h.race + ' · ' : '') + h.charClass + ' ' + h.level,
      ac: werte.ac, hpMax: werte.maxHp, hp: werte.hp, tempHp: werte.tempHp,
      // Der Stand des Bogens beim Kampfbeginn. Weicht er beim Uebertragen
      // davon ab, hat der Spieler selbst etwas geaendert — dann wird nicht
      // ungefragt darueber geschrieben.
      hpBeiStart: werte.hp, tempBeiStart: werte.tempHp,
      // Die Initiative der Helden wuerfeln die Spieler selbst — hier bleibt
      // das Feld leer, bis jemand die Zahl ansagt.
      ini: null, dex: werte.dex, iniBonus: werte.initiative,
      zustaende: [], erschoepfung: 0, bild: h.portrait || null,
      passive: werte.passive, flags: werte.flags.map(f => f.label), saves: werte.saves,
    });
  });

  return {
    aktiv: true, name: begegnung.name || 'Kampf', runde: 1, zug: 0,
    teilnehmer: sortiereNachIni(teilnehmer),
  };
};

// Ohne Initiative ganz nach unten: solange die Spieler ihre Zahl nicht
// angesagt haben, steht die Reihenfolge noch nicht fest.
const sortiereNachIni = (liste) => [...liste].sort((a,b) => {
  const av = a.ini === null ? -999 : a.ini, bv = b.ini === null ? -999 : b.ini;
  return bv - av || mod(b.dex) - mod(a.dex) || (a.name||'').localeCompare(b.name||'','de');
});

// ── Eine Zeile ───────────────────────────────────────────────────
const KampfZeile = ({ t, dran, onSchaden, onHeilen, onTemp, onIni, onZustand,
                      onErschoepfung, onEntfernen, onBlatt, zustandOffen, setZustandOffen,
                      detailOffen, setDetailOffen }) => {
  const [eingabe, setEingabe] = React.useState('');
  const tot = t.hp <= 0;
  const anteil = t.hpMax > 0 ? Math.max(0, Math.min(1, t.hp / t.hpMax)) : 0;
  // Ampel fuer die Trefferpunkte. Gruen gibt es in der Palette nicht —
  // sie ist durchgehend rot-gold, deshalb hier eine eigene Farbe.
  const farbe = anteil > 0.5 ? '#56b183' : anteil > 0.25 ? '#d9a441' : '#e04545';

  const zahl = () => {
    const n = parseInt(eingabe, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const anwenden = (fn) => { const n = zahl(); if (n) { fn(n); setEingabe(''); } };

  return (
    <div className={"kampf-zeile"+(dran?" dran":"")+(tot?" tot":"")+(t.art==='held'?" held":" gegner")}>
      {/* Direkt eintippen statt ueber ein Browserfenster: das Heldenbuch
          haelt seine Rueckfragen im Bogen, und mitten im Kampf ist ein
          Systemfenster ohnehin der falsche Ort. */}
      <input className="kampf-ini" type="number" value={t.ini === null ? '' : t.ini}
        placeholder="–" aria-label={'Initiative ' + t.name} title="Initiative eintragen"
        onChange={e=>onIni(e.target.value)} />

      <div className="kampf-figur">
        {t.bild ? <img src={t.bild} alt="" /> : <span>{t.art==='held' ? '🛡' : '💀'}</span>}
      </div>

      <div className="kampf-mitte">
        <div className="kampf-name-zeile">
          {t.art === 'gegner' && t.vorlageId ? (
            <button className="kampf-name kampf-name-knopf" onClick={()=>onBlatt(t.vorlageId)}
              title="Werte nachschlagen">{t.name}</button>
          ) : t.art === 'held' ? (
            <button className="kampf-name kampf-name-knopf"
              onClick={()=>setDetailOffen(detailOffen===t.id ? null : t.id)}
              title="Werte aus dem Bogen" aria-expanded={detailOffen===t.id}>{t.name}</button>
          ) : (
            <span className="kampf-name">{t.name}</span>
          )}
          <span className="kampf-rk">RK {t.ac}</span>
          {t.passive != null && <span className="kampf-passiv" title="Passive Wahrnehmung">👁 {t.passive}</span>}
          {t.ini === null && <span className="kampf-warte">Initiative fehlt</span>}
          {t.fehlt && <span className="kampf-warte">nicht mehr im Abenteuer</span>}
        </div>
        {t.unterzeile && <div className="kampf-unter">{t.unterzeile}</div>}

        <div className="kampf-balken" aria-label={'Trefferpunkte ' + t.hp + ' von ' + t.hpMax}>
          <div className="kampf-balken-fuell" style={{width:(anteil*100)+'%', background:farbe}} />
        </div>
        <div className="kampf-tp">
          <b style={{color:farbe}}>{t.hp}</b> / {t.hpMax}
          {t.tempHp > 0 && <span className="kampf-temp">+{t.tempHp} temporär</span>}
          {t.erschoepfung > 0 && <span className="kampf-ersch">Erschöpfung {t.erschoepfung}</span>}
        </div>

        {(t.zustaende||[]).length > 0 && (
          <div className="kampf-zustaende">
            {(t.zustaende||[]).map(z => (
              <button key={z} className="kampf-zustand" onClick={()=>onZustand(z)} title="Entfernen">{z} ✕</button>
            ))}
          </div>
        )}
        {(t.flags||[]).length > 0 && (
          <div className="kampf-flags">
            {(t.flags||[]).map(f => <span key={f} className="kampf-flag">{f}</span>)}
          </div>
        )}
      </div>

      <div className="kampf-werkzeug">
        <div className="kampf-hp-eingabe">
          <input type="number" min="1" value={eingabe} placeholder="—"
            aria-label={'Schaden oder Heilung für ' + t.name}
            onChange={e=>setEingabe(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') anwenden(onSchaden); }} />
          <button className="kampf-minus" title="Schaden" onClick={()=>anwenden(onSchaden)}>−</button>
          <button className="kampf-plus"  title="Heilung" onClick={()=>anwenden(onHeilen)}>+</button>
          <button className="kampf-temp-btn" title="Temporäre Trefferpunkte" onClick={()=>anwenden(onTemp)}>t</button>
        </div>
        <div className="kampf-zeile-tools">
          <button onClick={()=>setZustandOffen(zustandOffen===t.id ? null : t.id)}
            title="Zustände" aria-expanded={zustandOffen===t.id}>◇</button>
          <button onClick={()=>onErschoepfung(1)} title="Erschöpfung +1">▲</button>
          <button onClick={()=>onErschoepfung(-1)} title="Erschöpfung −1">▼</button>
          <button onClick={onEntfernen} title="Aus dem Kampf nehmen">✕</button>
        </div>
      </div>

      {zustandOffen === t.id && (
        <div className="kampf-zustand-wahl">
          {CONDITIONS.map(z => (
            <button key={z} className={((t.zustaende||[]).includes(z)?'aktiv':'')}
              onClick={()=>onZustand(z)}>{z}</button>
          ))}
        </div>
      )}

      {/* Was der Bogen ueber diesen Helden weiss — die Zahlen, nach denen
          am Tisch sonst gefragt wird. Sie kommen bei jedem Rendern frisch
          aus dem Charakter, nicht aus einem Abzug vom Kampfbeginn. */}
      {detailOffen === t.id && t.art === 'held' && (
        <div className="kampf-detail">
          {t.saves && (
            <div className="kampf-detail-block">
              <div className="kampf-detail-titel">Rettungswürfe</div>
              <div className="kampf-saves">
                {[['str','STR'],['dex','GES'],['con','KON'],['int','INT'],['wis','WEI'],['cha','CHA']].map(([k,l]) => (
                  <div className="kampf-save" key={k}>
                    <span>{l}</span><b>{fnum(t.saves[k])}</b>
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
                    <i>{e.source}</i> {EFFECT_LABELS[e.target]||e.target} {effectText(e)}
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
    </div>
  );
};

// ── Trefferpunkte zurueck in die Boegen ──────────────────────────
// Kein stiller Automatismus: es sind die Boegen der Spieler, das
// Heldenbuch speichert im Sekundentakt, und wer seinen Bogen gerade offen
// hat, merkt vom Ueberschreiben nichts. Deshalb steht hier, was sich
// aendern wuerde, und jede Zeile laesst sich abwaehlen.
const UebertragenDialog = ({ teilnehmer, helden, setDefs, onUebertragen, onOhne, onAbbrechen }) => {
  const zeilen = teilnehmer.filter(t => t.art === 'held').map(t => {
    const c = helden.find(h => h.id === t.charId);
    if (!c) return null;
    const imBogen = +c.hp || 0;
    const tempBogen = +c.tempHp || 0;
    // Hat der Spieler seinen Bogen waehrend des Kampfes selbst angefasst?
    const fremd = t.hpBeiStart !== undefined && imBogen !== t.hpBeiStart;
    const gleich = imBogen === t.hp && tempBogen === (t.tempHp||0);
    return {charId: c.id, name: c.name, imBogen, tempBogen,
            imKampf: t.hp, tempKampf: t.tempHp||0, fremd, gleich};
  }).filter(Boolean);

  // Vorgewaehlt ist, was sich unterscheidet und was der Spieler nicht
  // selbst angefasst hat.
  const [gewaehlt, setGewaehlt] = React.useState(
    () => new Set(zeilen.filter(z => !z.gleich && !z.fremd).map(z => z.charId)));

  const umschalten = (id) => setGewaehlt(m => {
    const n = new Set(m);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const zuUebertragen = zeilen.filter(z => gewaehlt.has(z.charId));

  return (
    <div className="form-overlay">
      <div className="form-modal" style={{maxWidth:520}}>
        <div className="form-title">Trefferpunkte übertragen</div>
        {zeilen.length === 0 ? (
          <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>
            In diesem Kampf steht kein Held aus dem Abenteuer — es gibt nichts zu übertragen.
          </p>
        ) : (
          <>
            <p style={{fontSize:12.5,color:'var(--text-muted)',lineHeight:1.6,marginBottom:12}}>
              Was hier angehakt ist, wird in den Bogen geschrieben. Die Spieler bekommen
              es beim nächsten Abgleich, ohne Rückfrage.
            </p>
            <div className="ueb-liste">
              {zeilen.map(z => (
                <label className={"ueb-zeile"+(z.gleich?" gleich":"")+(z.fremd?" fremd":"")} key={z.charId}>
                  <input type="checkbox" checked={gewaehlt.has(z.charId)} disabled={z.gleich}
                    onChange={()=>umschalten(z.charId)} />
                  <span className="ueb-name">{z.name}</span>
                  <span className="ueb-werte">
                    <b>{z.imBogen}</b>{z.tempBogen ? ' +' + z.tempBogen : ''}
                    <i>→</i>
                    <b>{z.imKampf}</b>{z.tempKampf ? ' +' + z.tempKampf : ''}
                  </span>
                  {z.gleich && <span className="ueb-hinweis">unverändert</span>}
                  {z.fremd && !z.gleich && (
                    <span className="ueb-warnung">Bogen wurde während des Kampfes geändert</span>
                  )}
                </label>
              ))}
            </div>
          </>
        )}
        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-cancel" onClick={onOhne}>Ohne Übertragen beenden</button>
          <button className="btn-save" disabled={zuUebertragen.length === 0}
            onClick={()=>onUebertragen(zuUebertragen)}>
            {zuUebertragen.length === 0 ? 'Nichts ausgewählt'
              : zuUebertragen.length + (zuUebertragen.length === 1 ? ' Bogen' : ' Bögen') + ' schreiben'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Der Kampf ────────────────────────────────────────────────────
const KampfAnsicht = ({ kampf, setKampf, enemies, encounters, helden, setDefs,
                        abenteuer, advId, onSchliessen, onGegnerBlatt, onBeenden }) => {
  const [zustandOffen, setZustandOffen] = React.useState(null);
  const [detailOffen, setDetailOffen] = React.useState(null);
  const [uebertragen, setUebertragen] = React.useState(false);

  if (!kampf || !kampf.aktiv) {
    const waehlbar = encounters.filter(e => !e.adventure || e.adventure === advId);
    return (
      <div className="kampf-schirm">
        <div className="kampf-kopf">
          <div className="kampf-titel">⚔ Kampf</div>
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
        <div className="kampf-start">
          <p className="kampf-start-hinweis">
            Wähle eine Begegnung. Die Trefferpunkte der Gegner werden ausgewürfelt,
            die Helden des offenen Abenteuers kommen mit ihren gerechneten Werten dazu.
          </p>
          {waehlbar.length === 0 ? (
            <p className="kampf-leer">Keine Begegnung in diesem Abenteuer. Lege eine unter 📚 Datenbank › Begegnungen an.</p>
          ) : (
            <div className="kampf-start-liste">
              {waehlbar.map(b => {
                const anzahl = (b.enemies||[]).reduce((s,t)=>s+(+t.count||1), 0);
                const fehlend = (b.enemies||[]).filter(t => !enemies.some(g=>g.id===t.enemyId)).length;
                return (
                  <button key={b.id} className="kampf-start-eintrag"
                    disabled={anzahl === 0 || fehlend === anzahl}
                    onClick={()=>setKampf(kampfAufstellen(b, enemies, helden, setDefs))}>
                    <span className="kampf-start-name">{b.name}</span>
                    <span className="kampf-start-sub">
                      {b.difficulty} · {anzahl} Gegner · {helden.length} Helden
                      {fehlend ? ' · ' + fehlend + ' Gegner fehlt in der Sammlung' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Im Kampf steht nur, was zum Kampf gehoert: Trefferpunkte, Zustaende,
  // Initiative. Alles, was aus dem Bogen kommt — Ruestungsklasse, maximale
  // Trefferpunkte, Immunitaeten, Rettungswuerfe —, wird bei jedem Rendern
  // neu gelesen. Legt ein Held mitten im Kampf einen Schild an, steht seine
  // RK hier sofort richtig, statt bis zum naechsten Kampf falsch zu bleiben.
  const liste = kampf.teilnehmer.map(t => {
    if (t.art !== 'held') return t;
    const c = helden.find(h => h.id === t.charId);
    if (!c) return {...t, fehlt: true};
    const w = charWerte(c, setDefs);
    return {...t,
      name: c.name,
      unterzeile: (c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level,
      ac: w.ac, hpMax: w.maxHp, dex: w.dex,
      bild: c.portrait || null,
      passive: w.passive, saves: w.saves, effekte: w.effekte,
      flags: w.flags.map(f => f.label),
    };
  });
  const amZug = liste[kampf.zug] || null;
  const aendern = (id, fn) => setKampf(k => ({...k, teilnehmer: k.teilnehmer.map(t => t.id===id ? fn(t) : t)}));

  const schaden = (id, n) => aendern(id, t => {
    // Temporäre Punkte fangen zuerst — so steht es im Regelwerk.
    const vomTemp = Math.min(t.tempHp || 0, n);
    const rest = n - vomTemp;
    return {...t, tempHp: (t.tempHp||0) - vomTemp, hp: Math.max(0, t.hp - rest)};
  });
  const heilen = (id, n) => aendern(id, t => ({...t, hp: Math.min(t.hpMax, t.hp + n)}));
  const temp   = (id, n) => aendern(id, t => ({...t, tempHp: Math.max(t.tempHp||0, n)}));
  const zustand = (id, z) => aendern(id, t => ({...t,
    zustaende: (t.zustaende||[]).includes(z) ? (t.zustaende||[]).filter(x=>x!==z) : [...(t.zustaende||[]), z]}));
  const erschoepfung = (id, d) => aendern(id, t => ({...t, erschoepfung: Math.max(0, Math.min(6, (t.erschoepfung||0) + d))}));
  const ini = (id, v) => setKampf(k => {
    const n = v === '' ? null : parseInt(v, 10);
    const neu = k.teilnehmer.map(t => t.id===id ? {...t, ini: Number.isFinite(n) ? n : null} : t);
    const sortiert = sortiereNachIni(neu);
    // Der Zug bleibt bei derselben Figur, auch wenn die Reihenfolge sich
    // durch die neue Zahl verschiebt.
    const dranId = k.teilnehmer[k.zug] && k.teilnehmer[k.zug].id;
    const zug = Math.max(0, sortiert.findIndex(t => t.id === dranId));
    return {...k, teilnehmer: sortiert, zug};
  });
  const entfernen = (id) => setKampf(k => {
    const idx = k.teilnehmer.findIndex(t => t.id === id);
    const teilnehmer = k.teilnehmer.filter(t => t.id !== id);
    const zug = idx < k.zug ? Math.max(0, k.zug-1) : Math.min(k.zug, Math.max(0, teilnehmer.length-1));
    return {...k, teilnehmer, zug};
  });
  const naechster = () => setKampf(k => {
    if (!k.teilnehmer.length) return k;
    const naechsterZug = k.zug + 1;
    return naechsterZug >= k.teilnehmer.length
      ? {...k, zug: 0, runde: k.runde + 1}
      : {...k, zug: naechsterZug};
  });

  const ohneIni = liste.filter(t => t.ini === null).length;

  return (
    <div className="kampf-schirm">
      <div className="kampf-kopf">
        <div className="kampf-titel">⚔ {kampf.name}</div>
        <div className="kampf-runde">
          <span>Runde</span><b>{kampf.runde}</b>
        </div>
        <div className="kampf-dran">
          {amZug ? <>Am Zug: <b>{amZug.name}</b></> : 'Niemand am Zug'}
        </div>
        <button className="kampf-weiter" onClick={naechster}>Nächster Zug ▶</button>
        <button className="btn-cancel" onClick={()=>setUebertragen(true)}>Kampf beenden</button>
        <button className="btn-cancel" onClick={onSchliessen} title="Nur schließen, der Kampf läuft weiter">✕</button>
      </div>

      {ohneIni > 0 && (
        <div className="kampf-hinweis">
          {ohneIni === 1 ? 'Bei einer Figur fehlt die Initiative' : 'Bei ' + ohneIni + ' Figuren fehlt die Initiative'} —
          sie stehen unten, bis die Zahl eingetragen ist. Auf die Zahl links tippen.
        </div>
      )}

      {uebertragen && (
        <UebertragenDialog
          teilnehmer={kampf.teilnehmer} helden={helden} setDefs={setDefs}
          onAbbrechen={()=>setUebertragen(false)}
          onOhne={()=>{ setUebertragen(false); onBeenden(); }}
          onUebertragen={(zeilen)=>{ setUebertragen(false); onBeenden(zeilen); }} />
      )}

      <div className="kampf-liste">
        {liste.map(t => (
          <KampfZeile key={t.id} t={t} dran={amZug && amZug.id === t.id}
            zustandOffen={zustandOffen} setZustandOffen={setZustandOffen}
            onSchaden={n=>schaden(t.id,n)} onHeilen={n=>heilen(t.id,n)} onTemp={n=>temp(t.id,n)}
            onIni={v=>ini(t.id,v)} onZustand={z=>zustand(t.id,z)}
            onErschoepfung={d=>erschoepfung(t.id,d)} onEntfernen={()=>entfernen(t.id)}
            onBlatt={onGegnerBlatt}
            detailOffen={detailOffen} setDetailOffen={setDetailOffen} />
        ))}
      </div>
    </div>
  );
};
