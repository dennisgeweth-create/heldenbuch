// ── Chronik: Kalender und Ereignisse der Spielleitung ─────────────
// Am Tisch laeuft mehr Zeit ab, als die Gruppe mitbekommt: ein Finger
// waechst nach, ein Fest rueckt naeher, ein Bote ist fuenf Tage nach Krezk
// unterwegs. Das steht sonst auf einem Zettel neben dem Schirm und wird
// beim "wir schlafen drei Tage" von Hand nachgerechnet.
//
// Deshalb liegt hier eine Uhr je Abenteuer und daran haengen Ereignisse mit
// einem absoluten Faelligkeitszeitpunkt. Absolut, nicht als Restzeit: sonst
// muesste jedes Weiterdrehen jedes Ereignis anfassen, und ein doppelt
// ausgeloester Klick zoege die Zeit zweimal ab.
const STD_TAG = 24;

const EREIGNIS_ARTEN = [
  {k:'frist',  icon:'⏳', label:'Frist',  vorbei:'ist abgelaufen'},
  {k:'reise',  icon:'🧭', label:'Reise',  vorbei:'ist angekommen'},
  {k:'termin', icon:'📅', label:'Termin', vorbei:'ist jetzt'},
];
const artInfo = (k) => EREIGNIS_ARTEN.find(a => a.k === k) || EREIGNIS_ARTEN[0];

const newEreignis = (advId, jetzt) => ({
  id: 'ev' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
  adventure: advId || '',
  art: 'frist',
  name: '', ort: '', ziel: '', notiz: '',
  faellig: (jetzt || 0) + 3 * STD_TAG,   // null = laeuft mit, ohne Frist
  wiederholung: 0,                       // Stunden; 0 = einmalig
  // {charId, art:'merkmal'|'effekt', …} — siehe chronikMerkmale()
  bindung: null,
  erledigt: false,
});

// "3 Tage", "5 Std", "2 Tage 4 Std" — Stunden fallen weg, wo sie niemand
// eingetragen hat, damit die Anzeige nicht mit "0 Std" zugestellt wird.
const restText = (std) => {
  if (std <= 0) return 'fällig';
  const t = Math.floor(std / STD_TAG), r = std % STD_TAG;
  if (t && r) return t + (t === 1 ? ' Tag ' : ' Tage ') + r + ' Std';
  if (t)      return t + (t === 1 ? ' Tag' : ' Tage');
  return r + ' Std';
};
const uhrTag    = (std) => Math.floor((std || 0) / STD_TAG) + 1;
const uhrStunde = (std) => (((std || 0) % STD_TAG) + STD_TAG) % STD_TAG;

const zeitDerUhr = (chronik, advId) => ((chronik && chronik.zeit) || {})[advId] || 0;
const ereignisseDerUhr = (chronik, advId) =>
  ((chronik && chronik.ereignisse) || []).filter(e => !e.adventure || e.adventure === advId);

// Untertitel einer Zeile: bei Reisen die Strecke, sonst Ort oder Notiz.
const ereignisUnterzeile = (e) => {
  if (e.art === 'reise') return (e.ort || '?') + ' → ' + (e.ziel || '?');
  return e.ort || e.notiz || '';
};

// ── Effekte aus der Chronik ──────────────────────────────────────
// Ein Ereignis kann einem Helden einen Effekt anhaengen, so wie es eine
// Waffe tut. Das Merkmal dazu wird nicht "irgendwann gesetzt und
// irgendwann wieder entfernt" — es wird bei jeder Aenderung neu aus der
// Uhr abgeleitet. Damit gibt es keinen Stand, der haengenbleiben kann:
// wer die Uhr zurueckstellt, bekommt den Fluch zurueck.
//
//   sofort  — gilt ab dem Eintragen bis die Frist ablaeuft (der Fluch,
//             der nach drei Tagen vergeht)
//   spaeter — gilt erst ab der Faelligkeit (der Fluch, der in drei Tagen
//             zuschlaegt und dann bleibt)
const CHR_PRAEFIX = 'chr_';
const chronikMerkmale = (chronik, advId) => {
  const jetzt = zeitDerUhr(chronik, advId);
  const soll = {};
  ereignisseDerUhr(chronik, advId).forEach(e => {
    const b = e.bindung;
    if (!b || b.art !== 'effekt' || !b.charId || !(b.effects||[]).length) return;
    const abgelaufen = e.faellig != null && e.faellig <= jetzt;
    const gilt = b.sofort === false ? abgelaufen : (!e.erledigt && !abgelaufen);
    if (!gilt) return;
    (soll[b.charId] = soll[b.charId] || []).push({
      id: CHR_PRAEFIX + e.id,
      name: e.name || 'Ereignis',
      source: 'Chronik',
      description: e.notiz || '',
      effects: b.effects,
      effectsActive: true,
    });
  });
  return soll;
};
const istChronikMerkmal = (f) => String((f && f.id) || '').indexOf(CHR_PRAEFIX) === 0;

// ── Die Leiste ───────────────────────────────────────────────────
const ChronikLeiste = ({ chronik, advId, advName, chars, ueberlagert,
                         onZeit, onNeu, onBearbeiten, onLoeschen, onAbhaken,
                         onWiederOeffnen, onSchliessen }) => {
  const [zeigeErledigt, setZeigeErledigt] = React.useState(false);
  const jetzt = zeitDerUhr(chronik, advId);
  const alle  = ereignisseDerUhr(chronik, advId);

  const offen = alle.filter(e => !e.erledigt);
  const nachRest = (a, b) => a.faellig - b.faellig;
  const faellig  = offen.filter(e => e.faellig != null && e.faellig <= jetzt).sort(nachRest);
  const laufend  = offen.filter(e => e.faellig != null && e.faellig >  jetzt).sort(nachRest);
  const ohneFrist = offen.filter(e => e.faellig == null)
    .sort((a,b) => (a.name||'').localeCompare(b.name||'','de'));
  const erledigt = alle.filter(e => e.erledigt)
    .sort((a,b) => (b.erledigtBei||0) - (a.erledigtBei||0));

  const heldName = (id) => (chars.find(c => c.id === id) || {}).name || 'unbekannt';

  const Zeile = ({ e, art }) => {
    const info = artInfo(e.art);
    const unter = ereignisUnterzeile(e);
    return (
      <div className={'chr-ev' + (art === 'faellig' ? ' faellig' : '') + (art === 'erledigt' ? ' erledigt' : '')}>
        <button className="chr-ev-haupt" onClick={()=>onBearbeiten(e)} title="Ereignis bearbeiten">
          <span className="chr-ev-icon">{info.icon}</span>
          <span className="chr-ev-text">
            <b>{e.name || '(ohne Namen)'}</b>
            {(unter || e.bindung) && (
              <i>
                {unter}
                {e.bindung && (
                  <span className="chr-ev-bindung" title={'Schaltet ein Merkmal bei ' + heldName(e.bindung.charId)}>
                    {(unter ? ' · ' : '') + '⚡ ' + heldName(e.bindung.charId)}
                  </span>
                )}
              </i>
            )}
          </span>
          <span className="chr-ev-rest">
            {art === 'erledigt' ? 'Tag ' + uhrTag(e.erledigtBei)
              : e.faellig == null ? '—'
              : restText(e.faellig - jetzt)}
            {e.wiederholung > 0 && art !== 'erledigt' && <i>↻</i>}
          </span>
        </button>
        {art === 'faellig' && (
          <button className="chr-ev-ok" onClick={()=>onAbhaken(e)} title="Abhaken">✓</button>
        )}
        {art === 'erledigt' && (
          <button className="chr-ev-ok" onClick={()=>onWiederOeffnen(e)} title="Wieder aufnehmen">↩</button>
        )}
        <button className="chr-ev-del" onClick={()=>onLoeschen(e)}
          aria-label={'Ereignis ' + (e.name||'') + ' löschen'}>✕</button>
      </div>
    );
  };

  return (
    <aside className={'chronik' + (ueberlagert ? ' ueberlagert' : '')}>
      <div className="chronik-kopf">
        <div>
          <div className="chronik-titel">🕰 Chronik</div>
          <div className="chronik-adv">{advName}</div>
        </div>
        <button className="chronik-zu" onClick={onSchliessen} aria-label="Chronik schließen">✕</button>
      </div>

      <div className="chronik-uhr">
        <div className="chronik-uhr-zahl">
          <span className="chronik-tag">Tag {uhrTag(jetzt)}</span>
          <span className="chronik-stunde">{uhrStunde(jetzt)} Uhr</span>
        </div>
        <button className="chronik-zeit-knopf" onClick={onZeit}>⏩ Zeit vergeht</button>
      </div>

      <div className="chronik-rollen">
        {offen.length === 0 && erledigt.length === 0 && (
          <div className="chronik-leer">
            <p>Noch nichts eingetragen.</p>
            <p>Trag ein, was im Hintergrund läuft — eine Frist, eine Reise,
               ein Termin. Beim Weiterdrehen der Uhr rechnet sich alles
               von selbst ab.</p>
          </div>
        )}

        {faellig.length > 0 && (
          <div className="chronik-block">
            <div className="chronik-block-titel faellig">⏰ Fällig</div>
            {faellig.map(e => <Zeile key={e.id} e={e} art="faellig" />)}
          </div>
        )}

        {laufend.length > 0 && (
          <div className="chronik-block">
            <div className="chronik-block-titel">Läuft</div>
            {laufend.map(e => <Zeile key={e.id} e={e} art="laufend" />)}
          </div>
        )}

        {ohneFrist.length > 0 && (
          <div className="chronik-block">
            <div className="chronik-block-titel">Ohne Frist</div>
            {ohneFrist.map(e => <Zeile key={e.id} e={e} art="offen" />)}
          </div>
        )}

        {erledigt.length > 0 && (
          <div className="chronik-block">
            <button className="chronik-block-titel klappbar" onClick={()=>setZeigeErledigt(v=>!v)}>
              {(zeigeErledigt ? '▾ ' : '▸ ') + 'Vorbei (' + erledigt.length + ')'}
            </button>
            {zeigeErledigt && erledigt.map(e => <Zeile key={e.id} e={e} art="erledigt" />)}
          </div>
        )}
      </div>

      <div className="chronik-fuss">
        <button className="btn-tool" onClick={onNeu}>+ Ereignis</button>
      </div>
    </aside>
  );
};

// ── Ereignis anlegen und ändern ──────────────────────────────────
const EreignisFormular = ({ ereignis, chronik, advId, abenteuer, chars, neu,
                            onAendern, onSpeichern, onAbbrechen }) => {
  const e = ereignis;
  const setzen = (p) => onAendern({...e, ...p});
  // Jede Kampagne hat ihre eigene Uhr, deshalb rechnet die Restzeit gegen
  // die Uhr des Abenteuers, an dem dieses Ereignis haengt — nicht gegen die
  // gerade offene.
  const jetzt = zeitDerUhr(chronik, e.adventure || advId);
  // Umhaengen laesst die Restzeit stehen und setzt die Faelligkeit auf die
  // andere Uhr um. Sonst spraenge "noch 3 Tage" auf "vor 40 Tagen".
  const abenteuerWechseln = (neuAdv) => {
    const rest = e.faellig == null ? null : Math.max(0, e.faellig - jetzt);
    onAendern({...e, adventure: neuAdv, bindung: null,
      faellig: rest == null ? null : zeitDerUhr(chronik, neuAdv) + rest});
  };
  const ohneFrist = e.faellig == null;
  const rest = ohneFrist ? 0 : Math.max(0, e.faellig - jetzt);
  const restTage = Math.floor(rest / STD_TAG), restStd = rest % STD_TAG;
  const fristSetzen = (t, s) => setzen({faellig: jetzt + Math.max(0, t) * STD_TAG + Math.max(0, s)});

  // Nur Helden des Abenteuers, an das dieses Ereignis haengt — sonst steht
  // die halbe Kampagne im Auswahlfeld.
  const helden = chars.filter(c => !c.archived
    && (!e.adventure || !c.adventure || c.adventure === e.adventure));
  const b = e.bindung || {};
  const held = helden.find(c => c.id === b.charId);
  const merkmale = (held && held.features) || [];

  return (
    <div className="form-overlay">
      <div className="form-modal" style={{maxWidth:520}}>
        <div className="form-title">{neu ? '🕰 Neues Ereignis' : '✎ Ereignis bearbeiten'}</div>
        <div className="form-grid" style={{maxHeight:'62vh',overflowY:'auto',paddingRight:4}}>

          <div className="form-group form-full">
            <label className="form-label">Art</label>
            <div className="chr-art-wahl">
              {EREIGNIS_ARTEN.map(a => (
                <button type="button" key={a.k}
                  className={'chr-art' + (e.art === a.k ? ' aktiv' : '')}
                  onClick={()=>setzen({art:a.k})}>
                  <span>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group form-full">
            <label className="form-label">Was</label>
            <input className="form-input" value={e.name} autoFocus
              onChange={ev=>setzen({name:ev.target.value})}
              placeholder={e.art === 'reise' ? 'z.B. Ismark reitet nach Krezk'
                : e.art === 'termin' ? 'z.B. Fest des heiligen Andral'
                : 'z.B. Armins Finger wächst nach'} />
          </div>

          {e.art === 'reise' ? (
            <>
              <div className="form-group">
                <label className="form-label">Von</label>
                <input className="form-input" value={e.ort||''}
                  onChange={ev=>setzen({ort:ev.target.value})} placeholder="Vallaki" />
              </div>
              <div className="form-group">
                <label className="form-label">Nach</label>
                <input className="form-input" value={e.ziel||''}
                  onChange={ev=>setzen({ziel:ev.target.value})} placeholder="Krezk" />
              </div>
            </>
          ) : (
            <div className="form-group form-full">
              <label className="form-label">Wo (freiwillig)</label>
              <input className="form-input" value={e.ort||''}
                onChange={ev=>setzen({ort:ev.target.value})} placeholder="Vallaki" />
            </div>
          )}

          <div className="form-group form-full">
            <label className="form-label">
              {e.art === 'reise' ? 'Reisezeit' : e.art === 'termin' ? 'Noch bis dahin' : 'Restzeit'}
            </label>
            <div className="chr-frist">
              <ZahlFeld className="form-input" min={0} max={999} disabled={ohneFrist}
                wert={restTage} aria-label="Tage"
                onWert={v =>fristSetzen(v, restStd)} />
              <span>Tage</span>
              <ZahlFeld className="form-input" min={0} max={23} disabled={ohneFrist}
                wert={restStd} aria-label="Stunden"
                onWert={v =>fristSetzen(restTage, v)} />
              <span>Std</span>
            </div>
            <label className="chr-check">
              <input type="checkbox" checked={ohneFrist}
                onChange={ev=>setzen({faellig: ev.target.checked ? null : jetzt + STD_TAG})} />
              Ohne Frist — läuft einfach mit
            </label>
            {!ohneFrist && (
              <div className="chr-hinweis">Fällig an Tag {uhrTag(e.faellig)}, {uhrStunde(e.faellig)} Uhr.</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Wiederholt sich alle</label>
            <div className="chr-frist">
              <ZahlFeld className="form-input" min={0} max={365}
                wert={Math.round((e.wiederholung||0) / STD_TAG)} aria-label="Wiederholung in Tagen"
                onWert={v =>setzen({wiederholung: v * STD_TAG})} />
              <span>Tage</span>
            </div>
            <div className="chr-hinweis">0 = einmalig</div>
          </div>

          <div className="form-group">
            <label className="form-label">Abenteuer</label>
            <select className="form-select" value={e.adventure||advId}
              onChange={ev=>abenteuerWechseln(ev.target.value)}>
              {(abenteuer||[]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="form-group form-full">
            <label className="form-label">Notiz für dich</label>
            <textarea className="form-input" rows={2} style={{resize:'vertical'}} value={e.notiz||''}
              onChange={ev=>setzen({notiz:ev.target.value})}
              placeholder="Was du wissen musst, wenn es soweit ist." />
          </div>

          {/* Der eigentliche Gewinn: der Malus verschwindet mit der Frist,
              statt drei Sitzungen spaeter aufzufallen. Geschrieben wird
              trotzdem erst nach ausdruecklicher Bestaetigung im Zeitfenster. */}
          <div className="form-group form-full chr-bindung">
            <label className="form-label">Wirkung auf einen Helden</label>
            <div className="chr-bindung-reihe">
              <select className="form-select" value={b.charId || ''}
                onChange={ev=>setzen({bindung: ev.target.value
                  ? {...b, charId:ev.target.value, art:b.art||'merkmal', featureId:''} : null})}>
                <option value="">— keine —</option>
                {helden.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {b.charId && (
                <div className="chr-art-wahl">
                  <button type="button" className={'chr-art' + (b.art !== 'effekt' ? ' aktiv' : '')}
                    onClick={()=>setzen({bindung:{...b, art:'merkmal', featureId:b.featureId||'', wirkung:b.wirkung||'aus'}})}>
                    <span>⭐</span>Merkmal umschalten
                  </button>
                  <button type="button" className={'chr-art' + (b.art === 'effekt' ? ' aktiv' : '')}
                    onClick={()=>setzen({bindung:{...b, art:'effekt', effects:b.effects||[], sofort:b.sofort!==false}})}>
                    <span>✦</span>Effekt setzen
                  </button>
                </div>
              )}

              {b.charId && b.art !== 'effekt' && (
                <>
                  <select className="form-select" value={b.featureId||''}
                    onChange={ev=>setzen({bindung:{...b, featureId:ev.target.value}})}>
                    <option value="">— Merkmal wählen —</option>
                    {merkmale.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <select className="form-select" value={b.wirkung||'aus'}
                    onChange={ev=>setzen({bindung:{...b, wirkung:ev.target.value}})}>
                    <option value="aus">abschalten, wenn die Frist abläuft</option>
                    <option value="an">einschalten, wenn die Frist abläuft</option>
                  </select>
                  {merkmale.length === 0 && (
                    <div className="chr-hinweis warn">Dieser Held hat noch kein Merkmal, das man umschalten könnte.</div>
                  )}
                </>
              )}

              {b.charId && b.art === 'effekt' && (
                <>
                  <select className="form-select" value={b.sofort === false ? 'spaeter' : 'sofort'}
                    onChange={ev=>setzen({bindung:{...b, sofort: ev.target.value === 'sofort'}})}>
                    <option value="sofort">gilt ab sofort, bis die Frist abläuft</option>
                    <option value="spaeter">gilt erst, wenn die Frist abgelaufen ist</option>
                  </select>
                  <EffectEditor effects={b.effects||[]}
                    onChange={v=>setzen({bindung:{...b, effects:v}})}
                    hint={'Damit verändert dieses Ereignis die Werte von '
                          + ((held && held.name) || 'diesem Helden') + '.'} />
                  <div className="chr-hinweis">
                    {b.sofort === false
                      ? 'Steht als Merkmal „' + (e.name || 'Ereignis') + '“ im Bogen, sobald die Frist abgelaufen ist — und bleibt dann.'
                      : 'Steht ab dem Speichern als Merkmal „' + (e.name || 'Ereignis') + '“ im Bogen und verschwindet mit der Frist.'}
                    {' '}Wird das Ereignis gelöscht, geht es mit.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={!e.name.trim()} onClick={onSpeichern}>💾 Speichern</button>
        </div>
      </div>
    </div>
  );
};

// ── Zeit vergeht ─────────────────────────────────────────────────
// Zeigt vorher, was passieren wird. Was in fremde Charakterboegen
// schreibt, steht einzeln zum Abwaehlen da — dieselbe Regel wie beim
// Uebertragen der Trefferpunkte nach dem Kampf.
const ZeitDialog = ({ chronik, advId, chars, onAnwenden, onUhrStellen, onAbbrechen }) => {
  const jetzt = zeitDerUhr(chronik, advId);
  const [tage, setTage] = React.useState(1);
  const [std,  setStd]  = React.useState(0);
  const [abgewaehlt, setAbgewaehlt] = React.useState({});
  const [stellen, setStellen] = React.useState(false);
  const [zielTag, setZielTag] = React.useState(uhrTag(jetzt));
  const [zielStd, setZielStd] = React.useState(uhrStunde(jetzt));
  const [ergebnis, setErgebnis] = React.useState(null);

  const delta = Math.max(0, tage) * STD_TAG + Math.max(0, std);
  const nachher = jetzt + delta;
  const feuert = ereignisseDerUhr(chronik, advId)
    .filter(e => !e.erledigt && e.faellig != null && e.faellig > jetzt && e.faellig <= nachher)
    .sort((a,b) => a.faellig - b.faellig);

  const held = (id) => chars.find(c => c.id === id);
  const merkmal = (b) => {
    const c = b && held(b.charId);
    return c && (c.features||[]).find(f => f.id === b.featureId);
  };

  const angebunden = feuert
    .map(e => ({e, b:e.bindung, c:e.bindung && held(e.bindung.charId)}))
    .filter(x => x.b && x.b.charId);
  // Ein umgeschaltetes Merkmal ist ein Eingriff in einen fremden Bogen und
  // steht deshalb zum Abwaehlen da. Ein Chronik-Effekt dagegen wird aus der
  // Uhr abgeleitet — ihn hier abzuwaehlen hiesse, ihn im naechsten
  // Augenblick wieder abzuleiten. Er steht als Ansage, nicht als Kaestchen.
  const bindungen = angebunden.filter(x => x.b.art !== 'effekt')
    .map(x => ({...x, f: merkmal(x.b)}));
  const effektB = angebunden.filter(x => x.b.art === 'effekt' && (x.b.effects||[]).length);

  const anwenden = () => {
    const gewaehlt = bindungen
      .filter(x => x.c && x.f && !abgewaehlt[x.e.id])
      .map(x => ({charId:x.b.charId, featureId:x.b.featureId, wirkung:x.b.wirkung || 'aus',
                  charName:x.c.name, featureName:x.f.name, ereignis:x.e.name}));
    onAnwenden(delta, feuert, gewaehlt);
    setErgebnis({delta, feuert, nachher});
  };

  if (ergebnis) {
    return (
      <div className="form-overlay">
        <div className="form-modal" style={{maxWidth:460}}>
          <div className="form-title">⏩ {restText(ergebnis.delta)} vergangen</div>
          <div className="zeit-jetzt">
            Es ist jetzt <b>Tag {uhrTag(ergebnis.nachher)}, {uhrStunde(ergebnis.nachher)} Uhr</b>.
          </div>
          {ergebnis.feuert.length === 0 ? (
            <div className="chr-hinweis">Nichts ist fällig geworden.</div>
          ) : (
            <div className="zeit-vorschau-block">
              {ergebnis.feuert.map(e => (
                <div className="zeit-vorschau-zeile" key={e.id}>
                  <span className="chr-ev-icon">{artInfo(e.art).icon}</span>
                  <span>
                    <b>{e.name}</b> — {artInfo(e.art).vorbei}
                    {e.art === 'reise' && e.ziel ? ' in ' + e.ziel : ''}
                    {e.notiz && <i className="zeit-notiz">{e.notiz}</i>}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button className="btn-save" onClick={onAbbrechen}>Weiter</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-overlay">
      <div className="form-modal" style={{maxWidth:500}}>
        <div className="form-title">⏩ Zeit vergeht</div>
        <div style={{maxHeight:'64vh',overflowY:'auto',paddingRight:4}}>

          <div className="zeit-jetzt">Gerade: <b>Tag {uhrTag(jetzt)}, {uhrStunde(jetzt)} Uhr</b></div>

          <div className="zeit-schnell">
            {[['1 Std',0,1],['Rast · 8 Std',0,8],['1 Tag',1,0],['3 Tage',3,0],['1 Woche',7,0]].map(w => (
              <button type="button" key={w[0]}
                className={'zeit-knopf' + (tage===w[1] && std===w[2] ? ' aktiv' : '')}
                onClick={()=>{setTage(w[1]);setStd(w[2]);}}>{w[0]}</button>
            ))}
          </div>

          <div className="chr-frist" style={{marginTop:10}}>
            <ZahlFeld className="form-input" min={0} max={999} wert={tage}
              aria-label="Tage" onWert={v =>setTage(v)} />
            <span>Tage</span>
            <ZahlFeld className="form-input" min={0} max={23} wert={std}
              aria-label="Stunden" onWert={v =>setStd(v)} />
            <span>Std</span>
          </div>

          <div className="zeit-nachher">
            Danach: <b>Tag {uhrTag(nachher)}, {uhrStunde(nachher)} Uhr</b>
          </div>

          {delta > 0 && (
            <div className="zeit-vorschau-block">
              <div className="zeit-vorschau-titel">
                {feuert.length === 0 ? 'Nichts wird fällig.'
                  : feuert.length + (feuert.length === 1 ? ' Ereignis wird fällig' : ' Ereignisse werden fällig')}
              </div>
              {feuert.map(e => (
                <div className="zeit-vorschau-zeile" key={e.id}>
                  <span className="chr-ev-icon">{artInfo(e.art).icon}</span>
                  <span>
                    <b>{e.name}</b> — {artInfo(e.art).vorbei}
                    {e.art === 'reise' && e.ziel ? ' in ' + e.ziel : ''}
                    {e.wiederholung > 0 && (
                      <i className="zeit-notiz">läuft danach weiter, alle {Math.round(e.wiederholung/STD_TAG)} Tage</i>
                    )}
                  </span>
                </div>
              ))}

              {effektB.length > 0 && (
                <div className="zeit-bindungen">
                  <div className="zeit-vorschau-titel">Effekte in fremden Bögen</div>
                  {effektB.map(x => (
                    <div className="zeit-bindung" key={'fx_'+x.e.id}>
                      <span className="chr-ev-icon">✦</span>
                      <span>
                        {x.c ? <>Bei <b>{x.c.name}</b>: </> : 'Bei einem Helden, der nicht mehr da ist: '}
                        „{x.e.name}“ {x.b.sofort === false ? 'greift ab jetzt' : 'endet'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {bindungen.length > 0 && (
                <div className="zeit-bindungen">
                  <div className="zeit-vorschau-titel">Das wird in fremde Bögen geschrieben</div>
                  {bindungen.map(x => (
                    <label className={'zeit-bindung' + (!x.c || !x.f ? ' fehlt' : '')} key={x.e.id}>
                      <input type="checkbox" disabled={!x.c || !x.f}
                        checked={!!(x.c && x.f) && !abgewaehlt[x.e.id]}
                        onChange={ev=>setAbgewaehlt(a=>({...a, [x.e.id]: !ev.target.checked}))} />
                      <span>
                        {!x.c ? 'Der Held zu „' + x.e.name + '“ ist nicht mehr da.'
                          : !x.f ? 'Bei ' + x.c.name + ': das Merkmal zu „' + x.e.name + '“ gibt es nicht mehr.'
                          : <>Bei <b>{x.c.name}</b>: „{x.f.name}“ {x.b.wirkung === 'an' ? 'einschalten' : 'abschalten'}</>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <button type="button" className="zeit-stellen-link" onClick={()=>setStellen(v=>!v)}>
            {(stellen ? '▾ ' : '▸ ') + 'Uhr direkt stellen'}
          </button>
          {stellen && (
            <div className="zeit-stellen">
              <div className="chr-frist">
                <span>Tag</span>
                <ZahlFeld className="form-input" min={1} max={9999} wert={zielTag}
                  aria-label="Tag" onWert={v =>setZielTag(v)} />
                <ZahlFeld className="form-input" min={0} max={23} wert={zielStd}
                  aria-label="Stunde" onWert={v =>setZielStd(v)} />
                <span>Uhr</span>
                <button type="button" className="btn-icon"
                  onClick={()=>{ onUhrStellen((zielTag-1)*STD_TAG + zielStd); onAbbrechen(); }}>Setzen</button>
              </div>
              <div className="chr-hinweis">Stellt nur die Uhr. Es wird nichts fällig und nichts geschrieben.</div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={delta === 0} onClick={anwenden}>
            {delta === 0 ? 'Keine Zeit gewählt' : '⏩ ' + restText(delta) + ' vergehen lassen'}
          </button>
        </div>
      </div>
    </div>
  );
};
