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
  '  <Anzahl>x <Gegenstand> | <Notiz> | <Seltenheit> | <Wert je Stück>   (Anzahl, Notiz, Seltenheit und Wert darfst du weglassen)',
  '',
  'Dabei gilt:',
  '- Gegenstände mit ihrem deutschen Namen, so wie er im Regelwerk steht:',
  '  „Ring des Schutzes", „Trank der Heilung", „Fackel".',
  '- Die Notiz hinter dem senkrechten Strich ist ein kurzer Satz für den',
  '  Tisch, kein Regeltext: „schimmert blau", „im Wert von 500 Gold".',
  '- Die Seltenheit nur bei magischen Stücken, als eines dieser Wörter:',
  '  gewöhnlich, ungewöhnlich, selten, sehr selten, legendär, Artefakt.',
  '- Der Wert je Stück mit Münzart, etwa 350 GM — nur bei Stücken, die man verkaufen kann.',
  '- Jede Münzart in eine eigene Zeile, ohne Punkt als Tausendertrennung.',
  '- Keine Zwischenüberschriften, keine Gruppen, keine Gesamtsumme.',
  '',
  'Beispiel:',
  'Titel: Aus der Truhe im Keller',
  '340 GM',
  '22 SM',
  'Ring des Schutzes | schimmert blau, wenn Magie in der Nähe ist | selten | 3500 GM',
  '8x Fackel',
  'Schmuck | im Wert von 500 Gold',
  '',
  'Und das soll gefunden werden:',
  '',
].join('\n');

// ── Was ein Stück über den Namen hinaus trägt ──────────────────
// Seltenheit, Gewicht, Tags und eine längere Beschreibung — einstellbar
// beim Hinlegen und, solange der Fund liegt, auch danach. Steht das Stück
// in der Datenbank, ist es vorbelegt; was hier steht, sticht sie.
const beuteLeereZeile = () => ({name:'', anzahl:1, notiz:'', wert:0,
                                seltenheit:'', gewicht:'', beschreibung:'', tags:[]});
const beuteTagsAus = (text) => [...new Set(String(text || '').split(',')
  .map(t => t.trim()).filter(Boolean))].slice(0, 8);
// Was zum Server geht: ohne die Hilfsfelder der Oberfläche.
const beuteZeileRein = ({auf, tagsText, ...r}) => ({...r,
  gewicht: String(r.gewicht || '').replace(',', '.'), tags: r.tags || []});
// Aus der Datenbank vorbelegen, was noch leer ist.
const beuteAusDb = (z, t) => !t ? {} : {
  seltenheit: z.seltenheit || t.rarity || '',
  gewicht: z.gewicht || (t.weight ? String(t.weight) : ''),
};
const beuteMehrDa = (z) => !!(String(z.gewicht || '').trim() || String(z.beschreibung || '').trim()
  || (z.tags || []).length);
const seltenheitVon = (k) => (typeof RARITIES !== 'undefined' ? RARITIES : []).find(r => r.key === k) || null;

const BeuteSeltenheit = ({ wert, onWert }) => (
  <select className="form-select beute-selten" value={wert || ''} aria-label="Seltenheit"
    style={{color: (seltenheitVon(wert) || {}).color}}
    onChange={e => onWert(e.target.value)}>
    <option value="">Seltenheit …</option>
    {RARITIES.map(r => <option key={r.key} value={r.key} style={{color: r.color}}>{r.label}</option>)}
  </select>
);

const BeuteMehr = ({ z, onZ }) => (
  <div className="beute-mehr">
    <label className="beute-mehr-feld">
      <span>Gewicht (kg)</span>
      <input className="form-input" inputMode="decimal" value={z.gewicht || ''} maxLength={8}
        placeholder="z.B. 0,5" onChange={e => onZ({gewicht: e.target.value.replace(/[^0-9.,]/g, '')})} />
    </label>
    <label className="beute-mehr-feld breit">
      <span>Tags, mit Komma getrennt</span>
      <input className="form-input" maxLength={200} placeholder="z.B. Magisch, Quest"
        value={z.tagsText !== undefined ? z.tagsText : (z.tags || []).join(', ')}
        onChange={e => onZ({tagsText: e.target.value, tags: beuteTagsAus(e.target.value)})} />
    </label>
    <label className="beute-mehr-feld voll">
      <span>Beschreibung — kommt so in den Bogen</span>
      <textarea className="form-input" rows={3} maxLength={2000} value={z.beschreibung || ''}
        placeholder="Wirkung, Geschichte, Einstimmung …"
        onChange={e => onZ({beschreibung: e.target.value})} />
    </label>
  </div>
);

// Die zweite Zeile eines Stücks: Seltenheit gleich, der Rest hinter „Mehr".
const BeuteZeileMehr = ({ z, onZ }) => (
  <>
    <div className="beute-neu2">
      <BeuteSeltenheit wert={z.seltenheit} onWert={v => onZ({seltenheit: v})} />
      <button type="button" className={'btn-icon beute-mehr-knopf' + (beuteMehrDa(z) ? ' da' : '')}
        aria-expanded={!!z.auf} onClick={() => onZ({auf: !z.auf})}>
        {z.auf ? '▾ Weniger' : '▸ Gewicht, Tags, Beschreibung'}{!z.auf && beuteMehrDa(z) ? ' ●' : ''}
      </button>
    </div>
    {z.auf && <BeuteMehr z={z} onZ={onZ} />}
  </>
);

const BeuteAnlegen = ({ gegenstaende, onAbbrechen, onHinlegen }) => {
  const [titel, setTitel] = React.useState('');
  const [muenzen, setMuenzen] = React.useState({pp:0, gp:0, ep:0, sp:0, cp:0});
  const [zeilen, setZeilen] = React.useState([beuteLeereZeile()]);

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
    // Steht der Name in der Datenbank, gilt der Eintrag von dort: seine
    // Schreibweise, seine Beschreibung, und beim Eintragen in die Bögen
    // alles Übrige — Gewicht, Seltenheit, Wirkung. Nur eine Notiz aus
    // der Liste selbst sticht die Beschreibung: sie gilt für dieses eine
    // Stück („Schmuck im Wert von 500 Gold").
    const reihen = g.stuecke.map(st => {
      const t = dbGegenstand(gegenstaende, st.name);
      return {...beuteLeereZeile(), name: (t && t.name) || st.name, anzahl: st.anzahl,
              notiz: st.notiz || (t ? dbKurz(t) : ''), ausDb: !!t,
              wert: st.wert || (+(t && t.wert) || 0),
              ...beuteAusDb({seltenheit: st.seltenheit || ''}, t),
              seltenheit: st.seltenheit || (t && t.rarity) || ''};
    });
    if (reihen.length) setZeilen(z => z.filter(x => x.name.trim())
      .concat(reihen.map(({ausDb, ...r}) => r), [beuteLeereZeile()]));

    const was = [];
    if (reihen.length) was.push(reihen.length + (reihen.length === 1 ? ' Stück' : ' Stücke'));
    if (geld) was.push(beuteMuenzText(g.muenzen));
    const ausDb = reihen.filter(r => r.ausDb).length;
    return {gut: true, meldung: 'Übernommen: ' + was.join(' und ')
      + (ausDb ? ' — ' + ausDb + ' davon aus der Datenbank, mit allem, was dort steht' : '')
      + '. Sieh die Zeilen durch, bevor du hinlegst.'};
  };

  const leer = !stuecke.length && !COINS.some(c => muenzen[c.key] > 0);

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:580}} onClick={e=>e.stopPropagation()}>
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
            <div className="beute-zeile" key={i}>
            <div className="beute-neu">
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
                  setZeile(i, {name: v, notiz: (z.notiz || (t ? dbKurz(t) : '')),
                               wert: (+z.wert || 0) || (+(t && t.wert) || 0),
                               ...beuteAusDb(z, t)});
                }} />
              <ZahlFeld className="form-input beute-anzahl" min={1} wert={z.anzahl}
                onWert={v=>setZeile(i, {anzahl: v})} />
              <input className="form-input" value={z.notiz} maxLength={120} placeholder="Notiz"
                onChange={e=>setZeile(i, {notiz: e.target.value})} />
              <GoldFeld className="form-input beute-wert" placeholder="Wert GM" kupfer={z.wert}
                aria-label="Wert je Stück in Gold" onKupfer={k=>setZeile(i, {wert: k})} />
              <button className="konz-weg" title="Zeile weg"
                onClick={()=>setZeilen(z2 => z2.filter((_, j) => j !== i))}>✕</button>
            </div>
            <BeuteZeileMehr z={z} onZ={p => setZeile(i, p)} />
            </div>
          ))}
          <button className="bj-taste" onClick={()=>setZeilen(z => [...z, beuteLeereZeile()])}>
            + Noch eine Zeile
          </button>
        </div>

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={leer}
            onClick={()=>onHinlegen({titel, muenzen, stuecke: stuecke.map(beuteZeileRein)})}>
            {leer ? 'Da ist noch nichts' : 'Hinlegen'}
          </button>
        </div>
      </div>
    </Fenster>
  );
};

// ── Wenn nicht gleichmaessig geteilt werden soll ──────────────
// Gleiche Teile sind der Normalfall und bleiben es. Aber nicht jeder
// Fund wird gleich geteilt: die Kriegskasse geht an den, der die Truppe
// bezahlt, der Anteil des Gefallenen an seine Familie, und wer den
// Drachen allein erlegt hat, bekommt eben mehr. Von Hand heisst deshalb
// wirklich von Hand — je Held und Muenzart eine Zahl.
//
// Aufgehen muss es trotzdem: der Fund wird danach weggeraeumt, und was
// nicht zugeteilt ist, waere weg. Deshalb steht daneben, was noch offen
// ist, und der Knopf bleibt zu, solange es nicht null ist.
const beuteHandRest = (muenzen, hand) => {
  const rest = {};
  COINS.forEach(c => {
    const ganz = Math.max(0, Math.round((muenzen || {})[c.key] || 0));
    let weg = 0;
    Object.keys(hand || {}).forEach(id => { weg += Math.max(0, Math.round((hand[id] || {})[c.key] || 0)); });
    rest[c.key] = ganz - weg;
  });
  return rest;
};
const beuteHandStimmt = (muenzen, hand) => {
  const r = beuteHandRest(muenzen, hand);
  return COINS.every(c => r[c.key] === 0);
};
// Der Anfangsvorschlag der Handverteilung ist die gleichmaessige — von
// einem leeren Raster aus faengt niemand gern an.
const beuteHandStart = (muenzen, helden) => {
  const teile = beuteTeilen(muenzen, helden.length);
  const raus = {};
  helden.forEach((h, i) => { raus[h.id] = {...(teile[i] || {})}; });
  return raus;
};

// Ein Stück, das schon daliegt, ändern — nur die Spielleitung.
const BeuteStueckAendern = ({ stueck, onFertig, onAbbrechen }) => {
  const [z, setZ] = React.useState(() => ({...beuteLeereZeile(), ...stueck, auf: true}));
  const [laeuft, setLaeuft] = React.useState(false);
  const onZ = (p) => setZ(x => ({...x, ...p}));
  return (
    <div className="beute-aendern">
      <div className="beute-neu">
        <input className="form-input" value={z.name} maxLength={80} aria-label="Name"
          onChange={e => onZ({name: e.target.value})} />
        <ZahlFeld className="form-input beute-anzahl" min={1} wert={z.anzahl}
          onWert={v => onZ({anzahl: v})} />
        <input className="form-input" value={z.notiz || ''} maxLength={120} placeholder="Notiz"
          onChange={e => onZ({notiz: e.target.value})} />
        <GoldFeld className="form-input beute-wert" placeholder="Wert GM" kupfer={z.wert}
          aria-label="Wert je Stück in Gold" onKupfer={k => onZ({wert: k})} />
      </div>
      <BeuteZeileMehr z={z} onZ={onZ} />
      <div className="beute-aendern-knoepfe">
        <button type="button" className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
        <button type="button" className="btn-save" disabled={!z.name.trim() || laeuft}
          onClick={async () => {
            setLaeuft(true);
            const {id, an, anName, ...rest} = beuteZeileRein(z);
            const gut = await onFertig(rest);
            setLaeuft(false);
            if (gut !== false) onAbbrechen();
          }}>Übernehmen</button>
      </div>
    </div>
  );
};

const BeuteFenster = ({ beute, helden, isDmMode, darfNehmen, onNehmen, onSchliessen,
                        onAbschliessen, onAbraeumen, onAendern }) => {
  // Die Haken muessen vor jedem vorzeitigen Ende stehen.
  const [hand, setHand] = React.useState(null);   // null = gleichmaessig
  const [aendern, setAendern] = React.useState(null);   // id des Stuecks
  const stuecke = (beute && beute.stuecke) || [];
  const offen = stuecke.filter(s => !s.an);
  const teile = beuteTeilen(beute && beute.muenzen, helden.length);
  const muenzText = beuteMuenzText(beute && beute.muenzen);
  // Nur die Muenzarten, die wirklich im Fund liegen — fuenf Spalten fuer
  // dreissig Goldstuecke waeren vier Spalten Nichts.
  const arten = COINS.filter(c => ((beute && beute.muenzen) || {})[c.key] > 0);
  const rest = hand ? beuteHandRest(beute && beute.muenzen, hand) : null;
  const stimmt = !hand || beuteHandStimmt(beute && beute.muenzen, hand);
  const handSetzen = (id, key, v) => setHand(h => ({
    ...h, [id]: {...(h[id] || {}), [key]: Math.max(0, Math.round(+v || 0))}}));
  if (!beute) return null;

  return (
    <Fenster onClick={onSchliessen}
      leiste={{id: 'beute', titel: 'Beute', symbol: '💰',
               zaehler: ((beute && beute.stuecke) || []).filter(x => !x.an).length || ''}}>
      <div className="form-modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">💰 {beute.titel || 'Was gefunden wurde'}</div>

        {muenzText && (
          <div className="beute-kasse">
            <div className="beute-kasse-summe">{muenzText}</div>
            {helden.length === 0 ? (
              <div className="beute-kasse-teil">Kein Held im Abenteuer — die Münzen bleiben liegen.</div>
            ) : !hand ? (
              <div className="beute-kasse-teil">
                Geteilt durch {helden.length}: je <b>{beuteMuenzText(teile[1] || teile[0]) || 'nichts'}</b>
                {beuteMuenzText(teile[0]) !== beuteMuenzText(teile[1] || teile[0])
                  ? ' · der Rest an ' + helden[0].name : ''}
                {isDmMode && (
                  <button type="button" className="btn-icon" style={{marginLeft:10}}
                    onClick={()=>setHand(beuteHandStart(beute.muenzen, helden))}>
                    Anders verteilen
                  </button>
                )}
              </div>
            ) : (
              <div className="beute-hand">
                <div className="beute-hand-kopf">
                  <span>Von Hand</span>
                  <button type="button" className="btn-icon" onClick={()=>setHand(null)}>
                    ↺ Gleichmäßig
                  </button>
                </div>
                <table className="beute-hand-tafel">
                  <thead>
                    <tr>
                      <th />
                      {arten.map(c => <th key={c.key} style={{color:c.color}}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {helden.map(h => (
                      <tr key={h.id}>
                        <td className="beute-hand-name">{h.name}</td>
                        {arten.map(c => (
                          <td key={c.key}>
                            <ZahlFeld className="form-input" min={0}
                              aria-label={c.label + ' für ' + h.name}
                              wert={(hand[h.id] || {})[c.key] || 0}
                              onWert={v => handSetzen(h.id, c.key, v)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={stimmt ? '' : 'offen'}>
                      <td className="beute-hand-name">{stimmt ? 'Geht auf' : 'Noch offen'}</td>
                      {arten.map(c => (
                        <td key={c.key} className="beute-hand-rest">
                          {rest[c.key] === 0 ? '✓' : rest[c.key]}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
                {!stimmt && (
                  <div className="beute-hand-warnung">
                    Der Fund wird danach weggeräumt — was hier offen bleibt, wäre weg.
                    {COINS.some(c => rest[c.key] < 0) && ' Und mehr als da ist, geht auch nicht.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="beute-liste">
          {stuecke.length === 0 && <div className="probe-leer">Nur Münzen.</div>}
          {stuecke.map(s => aendern === s.id ? (
            <BeuteStueckAendern key={s.id} stueck={s}
              onFertig={felder => onAendern(s.id, felder)} onAbbrechen={() => setAendern(null)} />
          ) : (
            <div className={'beute-stueck' + (s.an ? ' vergeben' : '')} key={s.id}>
              <div className="beute-was">
                <b>{s.name}{s.anzahl > 1 ? ' ×' + s.anzahl : ''}</b>
                {seltenheitVon(s.seltenheit) && (
                  <span className="beute-selten-marke" style={{color: seltenheitVon(s.seltenheit).color,
                    borderColor: seltenheitVon(s.seltenheit).color}}>{seltenheitVon(s.seltenheit).label}</span>
                )}
                {(s.notiz || (+s.wert || 0) > 0 || s.gewicht || (s.tags || []).length > 0) && (
                  <i>{[s.notiz, (+s.wert || 0) > 0 ? 'Wert ' + preisText(s.wert) : '',
                       s.gewicht ? String(s.gewicht).replace('.', ',') + ' kg' : '',
                       ...(s.tags || []).map(t => '#' + t)]
                    .filter(Boolean).join(' · ')}</i>
                )}
                {s.beschreibung && (
                  <details className="beute-text">
                    <summary>Beschreibung</summary>
                    <div>{s.beschreibung}</div>
                  </details>
                )}
              </div>
              {isDmMode && onAendern && (
                <button type="button" className="btn-icon beute-stift" title="Stück ändern"
                  aria-label={'„' + s.name + '“ ändern'} onClick={() => setAendern(s.id)}>✎</button>
              )}
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
              <button className="btn-save" disabled={offen.length > 0 || !stimmt}
                onClick={()=>onAbschliessen(hand)}
                title={offen.length ? 'Erst muss alles vergeben sein'
                     : !stimmt ? 'Die Münzen gehen noch nicht auf' : ''}>
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
