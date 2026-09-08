// Heldenbuch — die Beute.
//
// Bis hierher gab es sie gar nicht: gefunden wurde am Tisch, verteilt
// im Kopf, und eingetragen hat es hinterher jeder für sich — oder
// niemand. Am nächsten Abend weiss dann keiner mehr, wer den Ring hat.
//
// Ein Fund je Abenteuer. Die Spielleitung legt ihn hin, jeder nimmt
// sich, wozu er schreiben darf, und beim Abschliessen wandert alles in
// die Bögen: Stücke ins Inventar, Münzen in den Beutel, eine Zeile ins
// Abenteuerlog — mit dem, der sie genommen hat.
//
// **Ein Fund ist erst verteilt, wenn nichts mehr offen liegt.** Der
// Knopf zum Abschliessen sagt, wie viele Stücke noch daliegen. Beute,
// die halb verteilt in einem Fenster verschwindet, ist am nächsten
// Abend Streit.

// Münzen gleichmäßig auf die Helden, der Rest an den ersten. Kupfer
// zu wechseln ist eine Sache für den Tisch und nicht für das Programm.
const beuteTeilen = (muenzen, zahl) => {
  const teile = [];
  for (let i = 0; i < Math.max(1, zahl); i++) teile.push({pp:0, gp:0, ep:0, sp:0, cp:0});
  for (const m of ['pp','gp','ep','sp','cp']) {
    const n = Math.max(0, Math.round((muenzen || {})[m] || 0));
    const je = Math.floor(n / Math.max(1, zahl));
    const rest = n - je * Math.max(1, zahl);
    teile.forEach(t => { t[m] = je; });
    if (rest > 0) teile[0][m] += rest;
  }
  return teile;
};
const beuteMuenzText = (m) => COINS
  .filter(c => (m || {})[c.key] > 0)
  .map(c => (m[c.key]) + ' ' + c.label)
  .join(' · ');

// Was die Spielleitung einer KI vorlegt, damit hinten eine Liste
// herauskommt, die dieses Fenster lesen kann. Der letzte Absatz bleibt
// absichtlich offen — dort steht, was diesmal gefunden werden soll.
const BEUTE_KI_ANWEISUNG = [
  'Erstelle mir eine Beuteliste für Dungeons & Dragons 5e auf Deutsch.',
  'Antworte nur mit der Liste: keine Einleitung, keine Erklärung, keine',
  'Tabelle, keine Überschriften, keine Fettschrift.',
  '',
  'Eine Zeile je Eintrag, in dieser Form:',
  '  Titel: woher die Beute stammt        (höchstens einmal, ganz oben)',
  '  <Zahl> <Münzart>                     (nur Münzen in der Zeile; PM, GM, EM, SM, KM)',
  '  <Anzahl>x <Gegenstand> | <Notiz>     (Anzahl und Notiz darfst du weglassen)',
  '',
  'Dabei gilt:',
  '- Gegenstände mit ihrem deutschen Namen, so wie er im Regelwerk steht:',
  '  „Ring des Schutzes", „Trank der Heilung", „Fackel".',
  '- Die Notiz hinter dem senkrechten Strich ist ein kurzer Satz für den',
  '  Tisch, kein Regeltext: „schimmert blau", „im Wert von 500 Gold".',
  '- Jede Münzart in eine eigene Zeile, ohne Punkt als Tausendertrennung.',
  '- Keine Zwischenüberschriften, keine Gruppen, keine Gesamtsumme.',
  '',
  'Beispiel:',
  'Titel: Aus der Truhe im Keller',
  '340 GM',
  '22 SM',
  'Ring des Schutzes | schimmert blau, wenn Magie in der Nähe ist',
  '8x Fackel',
  'Schmuck | im Wert von 500 Gold',
  '',
  'Und das soll gefunden werden:',
  '',
].join('\n');

const BeuteAnlegen = ({ gegenstaende, onAbbrechen, onHinlegen }) => {
  const [titel, setTitel] = React.useState('');
  const [muenzen, setMuenzen] = React.useState({pp:0, gp:0, ep:0, sp:0, cp:0});
  const [zeilen, setZeilen] = React.useState([{name:'', anzahl:1, notiz:''}]);

  const setZeile = (i, p) => setZeilen(z => z.map((x, j) => j === i ? {...x, ...p} : x));
  const stuecke = zeilen.filter(z => z.name.trim());

  // Der eingefügte Text wird zu Zeilen — nicht zu Beute. Hingelegt wird
  // erst mit dem Knopf unten, und bis dahin steht alles zum Ändern da.
  const uebernehmen = (roh) => {
    const g = beuteAusText(roh);
    const geld = COINS.some(c => g.muenzen[c.key] > 0);
    if (!g.stuecke.length && !geld) {
      return {gut: false, meldung: 'Daraus lässt sich nichts lesen. Eine Zeile je Gegenstand.'};
    }
    if (g.titel && !titel.trim()) setTitel(g.titel);
    if (geld) setMuenzen(m => {
      const n = {...m};
      COINS.forEach(c => { n[c.key] = (n[c.key] || 0) + (g.muenzen[c.key] || 0); });
      return n;
    });
    if (g.stuecke.length) setZeilen(z => z.filter(x => x.name.trim()).concat(
      // Steht der Name in der Datenbank, bringt er seine Beschreibung
      // mit — aber nur, wo die Liste selbst keine Notiz mitgeliefert hat.
      g.stuecke.map(st => {
        const t = dbGegenstand(gegenstaende, st.name);
        return {name: st.name, anzahl: st.anzahl, notiz: st.notiz || (t ? dbKurz(t) : '')};
      }),
      [{name:'', anzahl:1, notiz:''}]));

    const was = [];
    if (g.stuecke.length) was.push(g.stuecke.length + (g.stuecke.length === 1 ? ' Stück' : ' Stücke'));
    if (geld) was.push(beuteMuenzText(g.muenzen));
    return {gut: true, meldung: 'Übernommen: ' + was.join(' und ')
      + '. Sieh die Zeilen durch, bevor du hinlegst.'};
  };

  const leer = !stuecke.length && !COINS.some(c => muenzen[c.key] > 0);

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">💰 Beute hinlegen</div>

        <ListeEinfuegen anweisung={BEUTE_KI_ANWEISUNG} onText={uebernehmen}
          platzhalter={'Eine Zeile je Gegenstand:\n\n340 GM\n8x Fackel\nRing des Schutzes | schimmert blau'} />

        <div className="form-group form-full">
          <div className="form-label">Woher</div>
          <input className="form-input" value={titel} maxLength={80}
            placeholder="z.B. Aus der Truhe im Keller"
            onChange={e=>setTitel(e.target.value)} />
        </div>

        <div className="form-label">Münzen</div>
        <div className="beute-muenzen">
          {COINS.map(c => (
            <label className="beute-muenze" key={c.key}>
              <span style={{color:c.color}}>{c.label}</span>
              <ZahlFeld className="form-input" min={0} wert={muenzen[c.key]}
                onWert={v=>setMuenzen(m => ({...m, [c.key]: v}))} />
            </label>
          ))}
        </div>

        {/* Die Sammlung der Gruppe als Vorschlagsliste — einmal fuer
            alle Zeilen. */}
        <datalist id="hb-db-gegenstaende">
          {(gegenstaende || []).map(g => <option key={g.name} value={g.name} />)}
        </datalist>

        <div className="form-label" style={{marginTop:12}}>Stücke</div>
        <div className="beute-zeilen">
          {zeilen.map((z, i) => (
            <div className="beute-neu" key={i}>
              {/* Aus der Datenbank: der Name schlägt vor, und was
                  dahintersteht — Beschreibung, Seltenheit, Gewicht —
                  kommt beim Eintragen von selbst mit. */}
              <input className="form-input" value={z.name} maxLength={80} list="hb-db-gegenstaende"
                placeholder="z.B. Ring des Schutzes"
                onChange={e=>{
                  const v = e.target.value;
                  const t = dbGegenstand(gegenstaende, v);
                  // Die Notiz nur vorschlagen, solange keine dasteht —
                  // wer selbst etwas geschrieben hat, behaelt es.
                  setZeile(i, {name: v, notiz: (z.notiz || (t ? dbKurz(t) : ''))});
                }} />
              <ZahlFeld className="form-input beute-anzahl" min={1} wert={z.anzahl}
                onWert={v=>setZeile(i, {anzahl: v})} />
              <input className="form-input" value={z.notiz} maxLength={120} placeholder="Notiz"
                onChange={e=>setZeile(i, {notiz: e.target.value})} />
              <button className="konz-weg" title="Zeile weg"
                onClick={()=>setZeilen(z2 => z2.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="bj-taste" onClick={()=>setZeilen(z => [...z, {name:'', anzahl:1, notiz:''}])}>
            + Noch eine Zeile
          </button>
        </div>

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={leer}
            onClick={()=>onHinlegen({titel, muenzen, stuecke})}>
            {leer ? 'Da ist noch nichts' : 'Hinlegen'}
          </button>
        </div>
      </div>
    </Fenster>
  );
};

const BeuteFenster = ({ beute, helden, isDmMode, darfNehmen, onNehmen, onSchliessen,
                        onAbschliessen, onAbraeumen }) => {
  if (!beute) return null;
  const stuecke = beute.stuecke || [];
  const offen = stuecke.filter(s => !s.an);
  const teile = beuteTeilen(beute.muenzen, helden.length);
  const muenzText = beuteMuenzText(beute.muenzen);

  return (
    <Fenster onClick={onSchliessen}>
      <div className="form-modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">💰 {beute.titel || 'Was gefunden wurde'}</div>

        {muenzText && (
          <div className="beute-kasse">
            <div className="beute-kasse-summe">{muenzText}</div>
            {helden.length > 0 ? (
              <div className="beute-kasse-teil">
                Geteilt durch {helden.length}: je <b>{beuteMuenzText(teile[1] || teile[0]) || 'nichts'}</b>
                {beuteMuenzText(teile[0]) !== beuteMuenzText(teile[1] || teile[0])
                  ? ' · der Rest an ' + helden[0].name : ''}
              </div>
            ) : (
              <div className="beute-kasse-teil">Kein Held im Abenteuer — die Münzen bleiben liegen.</div>
            )}
          </div>
        )}

        <div className="beute-liste">
          {stuecke.length === 0 && <div className="probe-leer">Nur Münzen.</div>}
          {stuecke.map(s => (
            <div className={'beute-stueck' + (s.an ? ' vergeben' : '')} key={s.id}>
              <div className="beute-was">
                <b>{s.name}{s.anzahl > 1 ? ' ×' + s.anzahl : ''}</b>
                {s.notiz && <i>{s.notiz}</i>}
              </div>
              {s.an ? (
                <div className="beute-an">
                  <span>{s.anName || 'vergeben'}</span>
                  <button className="konz-weg" title="Zurücklegen"
                    onClick={()=>onNehmen(s, null)}>✕</button>
                </div>
              ) : (
                <div className="beute-wer">
                  {helden.filter(h => darfNehmen(h)).map(h => (
                    <button className="bj-taste" key={h.id}
                      onClick={()=>onNehmen(s, h)}>{h.name}</button>
                  ))}
                  {helden.filter(h => darfNehmen(h)).length === 0 && (
                    <span className="probe-leer">Kein Bogen, in den du schreiben darfst.</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {isDmMode ? (
          <>
            <div className={'beute-stand' + (offen.length ? ' offen' : '')}>
              {offen.length
                ? offen.length + (offen.length === 1 ? ' Stück liegt' : ' Stücke liegen') + ' noch da'
                : 'Alles vergeben.'}
            </div>
            <div className="form-actions" style={{marginTop:12}}>
              <button className="btn-cancel" onClick={onAbraeumen}>Wegräumen</button>
              <button className="btn-cancel" onClick={onSchliessen}>Später</button>
              <button className="btn-save" disabled={offen.length > 0}
                onClick={onAbschliessen}
                title={offen.length ? 'Erst muss alles vergeben sein' : ''}>
                In die Bögen eintragen
              </button>
            </div>
          </>
        ) : (
          <div className="form-actions" style={{marginTop:12}}>
            <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
          </div>
        )}
      </div>
    </Fenster>
  );
};
