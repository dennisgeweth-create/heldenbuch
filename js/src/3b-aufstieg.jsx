// Heldenbuch — der Stufenaufstieg.
//
// Ein Charakter wird einmal erstellt und fünfzehnmal aufgestiegen. Bis
// hierher war jeder Aufstieg Handarbeit: Trefferpunkte rechnen,
// Übungsbonus nachschlagen, Zauberplätze umstellen — zehn Minuten, in
// denen vier Leute warten, und regelmäßig wird etwas vergessen.
//
// Der Grundsatz des ganzen Fensters steht in der Vorschau: **erst
// zeigen, dann ändern.** Was nicht im Kasten steht, passiert nicht.
// Gerechnet wird dabei nicht hier, sondern in `aufstiegPlan` — dieselbe
// Funktion, die das Übernehmen benutzt. Die Vorschau kann deshalb nicht
// von dem abweichen, was danach im Bogen steht.

const AUFSTIEG_ASI = ['zwei', 'eins', 'talent'];

// Die Klassenmerkmale aus dem SRD. Geladen wird einmal je Sitzung und
// erst, wenn der Aufstieg aufgeht — 35 KB bei jedem Start für etwas,
// das einmal im Monat gebraucht wird, waeren verkehrt.
let MERKMAL_DATEN = null;
// Neben der ausgelieferten Datei liegt wahlweise eine zweite:
// `data-eigen.json`. Sie steht nicht im Repo und wird nie ausgeliefert —
// wer die Bücher besitzt, legt sie selbst neben die index.html, und der
// Upload rührt sie nicht an (er löscht dort nichts). Was darin steht,
// gilt damit für die ganze Gruppe wie das Regelwerk selbst; die
// Datenbank bleibt frei für das, was ihr euch ausgedacht habt.
//
// Sie hat dieselbe Form wie data-merkmale.json und darf zusätzlich
// `talente` mitbringen:
//   {quelle:"PHB", merkmale:{Kämpfer:[…]}, unterklassen:{…}, talente:[…]}
const EIGEN_DATEI = 'data-eigen.json';

// Mit derselben Ausgabe-Nummer wie die uebrigen Dateien. Ohne sie
// behaelt der Browser die Fassung von gestern — und wer seine Sammlung
// gerade erst hochgeladen hat, sieht sie nicht.
const holen = (datei) => {
  const s = document.querySelector('script[src*="app.js"]');
  const v = s ? ((s.getAttribute('src') || '').split('?')[1] || '') : '';
  return fetch(datei + (v ? '?' + v : ''))
    .then(r => r.ok ? r.json() : null)
    .catch(() => null);
};

// Zwei Sammlungen werden eine. **Die eigene gewinnt:** wer die Bücher
// besitzt und ihre Merkmale hinlegt, will deren Wortlaut sehen und nicht
// meine Zusammenfassung. Was das SRD darüber hinaus kennt, bleibt
// stehen — so fehlt nichts, was schon da war.
const listeMischen = (eigen, srd) => {
  const da = new Set((eigen || []).map(x => dbSchluessel(x.name)));
  return [...(eigen || []), ...(srd || []).filter(x => !da.has(dbSchluessel(x.name)))];
};

const merkmaleMischen = (srd, eigen) => {
  if (!eigen) return srd;
  const quelle = eigen.quelle || 'Eigene Sammlung';
  const stempeln = (liste) => (liste || []).map(m => ({...m, herkunft: m.herkunft || quelle}));
  const raus = {...srd, merkmale: {...(srd.merkmale || {})},
                unterklassen: {...(srd.unterklassen || {})}};

  Object.keys(eigen.merkmale || {}).forEach(kl => {
    raus.merkmale[kl] = listeMischen(stempeln(eigen.merkmale[kl]), raus.merkmale[kl]);
  });
  Object.keys(eigen.unterklassen || {}).forEach(kl => {
    const meine = (eigen.unterklassen[kl] || []).map(u => ({
      ...u, herkunft: u.herkunft || quelle, merkmale: stempeln(u.merkmale)}));
    raus.unterklassen[kl] = listeMischen(meine, raus.unterklassen[kl]);
  });
  raus.talente = stempeln(eigen.talente);
  return raus;
};

const merkmaleLaden = () => {
  if (MERKMAL_DATEN) return Promise.resolve(MERKMAL_DATEN);
  return Promise.all([holen('data-merkmale.json'), holen(EIGEN_DATEI)])
    .then(([srd, eigen]) => {
      MERKMAL_DATEN = merkmaleMischen(srd || {}, eigen);
      return MERKMAL_DATEN;
    })
    .catch(() => ({}));
};

const StufenAufstieg = ({ char, talente, eigeneMerkmale, onAbbrechen, onUebernehmen }) => {
  // Wer mehrere Klassen hat, steigt in einer davon auf — und welche das
  // ist, entscheidet alles Weitere: den Trefferwürfel, die Stufe, die
  // Attributssteigerung. Die Gesamtstufe ist die Summe und traegt den
  // Übungsbonus; das rechnet aufstiegPlan.
  const eigene = charKlassen(char);
  const [klasse, setKlasse] = React.useState(char.charClass);
  const dabei = eigene.find(k => k.charClass === klasse) || null;
  const regel = KLASSEN_REGELN[klasse] || null;
  const von   = dabei ? dabei.level : 0;
  const [ziel, setZiel] = React.useState(Math.min(20, von + 1));
  const stufen = Math.max(0, ziel - von);
  const weitere = Object.keys(KLASSEN_REGELN)
    .filter(n => !eigene.some(k => k.charClass === n));

  // Der Durchschnitt eines Trefferwürfels ist die Hälfte plus eins —
  // beim W10 also 6. So steht es im Regelwerk, und die meisten Runden
  // nehmen ihn, weil ein schlechter Wurf eine ganze Stufe lang wehtut.
  const kon = mod(+char.con || 10);
  const schnitt = regel ? Math.max(1, Math.floor(regel.tw / 2) + 1 + kon) : 0;
  const [art, setArt] = React.useState('schnitt');   // schnitt | wurf
  const [tpPlus, setTpPlus] = React.useState(schnitt * Math.max(1, stufen));
  const [gewuerfelt, setGewuerfelt] = React.useState(null);

  // Die Merkmale der Klasse. `aus` sind die abgewählten — vorgewählt ist
  // alles, was die Klasse selbst gibt; was von der Unterklasse kommt,
  // steht nur als Erinnerung da.
  const [merkmalDaten, setMerkmalDaten] = React.useState(MERKMAL_DATEN);
  const [aus, setAus] = React.useState({});
  React.useEffect(() => { merkmaleLaden().then(setMerkmalDaten); }, []);

  // Nichts ist vorgewählt. Eine vorgewählte Stärke landet sonst im
  // Bogen eines Magiers, weil jemand nur auf Übernehmen gedrückt hat —
  // der Assistent darf diese Wahl nicht für jemanden treffen.
  const [asiArt, setAsiArt] = React.useState(null);
  const [asiA, setAsiA] = React.useState('str');
  const [asiB, setAsiB] = React.useState('dex');
  // Bei „Talent": welches, und — wenn es ein halbes ist — auf welches
  // Attribut das +1 geht.
  const [talName, setTalName] = React.useState('');
  const [talAttr, setTalAttr] = React.useState('');

  // Die Unterklasse. Steht schon eine im Bogen, ist hier nichts zu
  // wählen — den Schwur wechselt man nicht beim Aufstieg.
  const [unter, setUnter] = React.useState('');
  const [unterEigen, setUnterEigen] = React.useState('');

  // Ändert sich Klasse oder Ziel, stimmt der alte Betrag nicht mehr.
  React.useEffect(() => { setZiel(Math.min(20, von + 1)); }, [klasse]);
  React.useEffect(() => {
    setGewuerfelt(null); setArt('schnitt'); setAsiArt(null); setAus({});
    setTalName(''); setTalAttr(''); setUnter(''); setUnterEigen('');
    setTpPlus(regel ? schnitt * stufen : 0);
  }, [klasse, ziel]);

  const wuerfeln = () => {
    let summe = 0; const einzeln = [];
    for (let i = 0; i < Math.max(1, stufen); i++) {
      const w = 1 + Math.floor(Math.random() * regel.tw);
      einzeln.push(w);
      summe += Math.max(1, w + kon);
    }
    setGewuerfelt(einzeln); setArt('wurf'); setTpPlus(summe);
  };

  // Gibt eine der gewonnenen Stufen eine Attributssteigerung?
  const asiStufen = [];
  if (regel) for (let s = von + 1; s <= ziel; s++) if (regel.asi.includes(s)) asiStufen.push(s);
  const asi = (!asiStufen.length || !asiArt || asiArt === 'talent') ? null
    : asiArt === 'zwei' ? {[asiA]: 2}
    : (asiA === asiB ? {[asiA]: 2} : {[asiA]: 1, [asiB]: 1});

  // Die Unterklasse wird auf einer bestimmten Stufe gewählt. Erreicht
  // der Aufstieg sie und steht noch keine im Bogen, fragt das Fenster.
  const unterSchon = unterVon(char, klasse);
  const unterListe = unterklassenFuer(merkmalDaten, klasse);
  const unterStufe = regel ? regel.unter : 0;
  const unterFaellig = !unterSchon && unterStufe > 0 && ziel >= unterStufe && von < unterStufe;
  const unterWahl = unterSchon || (unter === '_eigen' ? unterEigen.trim() : unter);

  const neueMerkmale = merkmaleFuer(merkmalDaten, klasse, von, ziel, char.features,
                                   unterWahl, eigeneMerkmale);
  // Vorgewählt ist, was die Klasse einfach gibt. Eine Erinnerung an die
  // Unterklasse und eine **optionale** Regel aus einem Buch sind es
  // nicht — die nimmt man bewusst oder gar nicht.
  const vorgewaehlt = (m) => !m.unter && !m.optional;
  const gewaehlt = neueMerkmale.filter(m => aus[m.stufe + ':' + m.name] === undefined
    ? vorgewaehlt(m) : !aus[m.stufe + ':' + m.name]);

  // Talente aus zwei Quellen: was neben der index.html liegt, gilt für
  // die ganze Gruppe; was in der Datenbank steht, habt ihr euch selbst
  // ausgedacht. Bei gleichem Namen gewinnt die Datei.
  const alleTalente = [
    ...((merkmalDaten && merkmalDaten.talente) || []),
    ...(talente || []).filter(t => !((merkmalDaten && merkmalDaten.talente) || [])
      .some(x => dbSchluessel(x.name) === dbSchluessel(t.name))),
  ];
  const talEintrag = alleTalente.find(t => t.name === talName) || null;
  const talHalb = talEintrag ? (talEintrag.halb || []) : [];
  const talent = (asiStufen.length && asiArt === 'talent' && talEintrag)
    ? {...talEintrag, attr: (talHalb.length ? (talHalb.includes(talAttr) ? talAttr : '') : '')}
    : null;

  const plan = aufstiegPlan(char,
    {klasse, ziel, tpPlus, asi, merkmale: gewaehlt, talent, unterklasse: unterWahl});
  const geht = ziel > von;

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">⇧ Stufenaufstieg — {char.name}</div>

        {/* Welche Klasse steigt auf? Bei einer einzigen steht sie nur
            da; ab der zweiten wird sie gewählt, und eine neue kommt aus
            der Liste daneben. */}
        {(eigene.length > 1 || weitere.length > 0) && (
          <div className="auf-klassen">
            {eigene.map(k => (
              <button type="button" key={k.charClass}
                className={'bj-taste' + (klasse === k.charClass ? ' haupt' : '')}
                onClick={()=>setKlasse(k.charClass)}>
                {k.charClass} {k.level}
              </button>
            ))}
            <select className="form-select auf-dazu" value={dabei ? '' : klasse}
              onChange={e=>{ if (e.target.value) setKlasse(e.target.value); }}>
              <option value="">+ Neue Klasse…</option>
              {weitere.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <div className="auf-kopf">
          <span className="auf-klasse">{klasse}</span>
          <span className="auf-pfeil">{dabei ? 'Stufe ' + von + ' →' : 'neu, auf Stufe'}</span>
          <select className="form-select auf-ziel" value={ziel}
            onChange={e=>setZiel(+e.target.value)}>
            {Array.from({length:20}, (_, i) => i + 1)
              .filter(st => st > von)
              .map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          {eigene.length > 1 && (
            <span className="auf-gesamt">
              Gesamt {gesamtStufe(char)} → {gesamtStufe(char) + stufen}
            </span>
          )}
        </div>

        {/* ── Die Unterklasse ─────────────────────────────────── */}
        {unterFaellig && (
          <div className="form-group form-full" style={{marginTop:14}}>
            <div className="form-label">
              Unterklasse — {klasse} Stufe {unterStufe}
            </div>
            <div className="auf-tp">
              {unterListe.map(u => (
                <button type="button" key={u.name}
                  className={'bj-taste' + (unter === u.name ? ' haupt' : '')}
                  onClick={()=>setUnter(u.name)}>
                  {u.name}
                </button>
              ))}
              <button type="button"
                className={'bj-taste' + (unter === '_eigen' ? ' haupt' : '')}
                onClick={()=>setUnter('_eigen')}>
                Eigene…
              </button>
            </div>
            {unter === '_eigen' && (
              <div className="auf-tp" style={{marginTop:6}}>
                <input className="form-input" value={unterEigen} maxLength={60} autoFocus
                  placeholder="z.B. Pfad des Totems"
                  onChange={e=>setUnterEigen(e.target.value)} />
              </div>
            )}
            <div className="auf-hinweis">
              {unter === '_eigen'
                ? 'Der Name kommt in den Bogen; ihre Merkmale trägst du selbst ein.'
                : unterListe.length
                  ? 'Aus dem SRD 5.1 — mehr als eine je Klasse steht dort nicht. Ihre Merkmale kommen dann unten mit.'
                  : 'Für diese Klasse ist keine hinterlegt — trag den Namen selbst ein.'}
            </div>
          </div>
        )}
        {!unterFaellig && unterSchon && (
          <div className="auf-hinweis" style={{marginTop:10}}>
            {klasse}: <b>{unterSchon}</b>
          </div>
        )}

        {/* ── Trefferpunkte ────────────────────────────────────── */}
        <div className="form-group form-full" style={{marginTop:14}}>
          <div className="form-label">Trefferpunkte</div>
          {regel ? (
            <>
              <div className="auf-tp">
                <button type="button" className={'bj-taste' + (art === 'schnitt' ? ' haupt' : '')}
                  onClick={()=>{setArt('schnitt'); setGewuerfelt(null); setTpPlus(schnitt * stufen);}}>
                  Durchschnitt
                </button>
                <button type="button" className={'bj-taste' + (art === 'wurf' ? ' haupt' : '')}
                  onClick={wuerfeln} disabled={stufen < 1}>
                  {gewuerfelt ? 'Nochmal würfeln' : 'Würfeln'} · W{regel.tw}
                </button>
                <label className="auf-zahl">
                  <span>{tpPlus >= 0 ? '+' : '−'}</span>
                  <ZahlFeld className="form-input" wert={Math.abs(tpPlus)}
                    onWert={v => setTpPlus(tpPlus < 0 ? -v : v)} />
                </label>
              </div>
              <div className="auf-hinweis">
                W{regel.tw} {kon >= 0 ? '+ ' + kon : '− ' + Math.abs(kon)} (Konstitution)
                {stufen > 1 ? ' · ' + stufen + ' Stufen' : ''}
                {gewuerfelt ? ' · gewürfelt: ' + gewuerfelt.join(', ') : ''}
                {' — die Zahl lässt sich ändern.'}
              </div>
            </>
          ) : (
            <div className="auf-hinweis">
              Ohne Trefferwürfel in den Tabellen rechnet hier niemand. Trag die
              Punkte ein, die dazukommen sollen.
              <div className="auf-tp" style={{marginTop:8}}>
                <label className="auf-zahl">
                  <span>+</span>
                  <ZahlFeld className="form-input" wert={Math.abs(tpPlus)}
                    onWert={v => setTpPlus(v)} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── Attributssteigerung ──────────────────────────────── */}
        {asiStufen.length > 0 && (
          <div className="form-group form-full">
            <div className="form-label">
              Attributssteigerung — {klasse} Stufe {asiStufen.join(' und ')}
            </div>
            <div className="auf-tp">
              {AUFSTIEG_ASI.map(k => (
                <button type="button" key={k} className={'bj-taste' + (asiArt === k ? ' haupt' : '')}
                  onClick={()=>setAsiArt(k)}>
                  {k === 'zwei' ? '+2 auf eines' : k === 'eins' ? '+1 auf zwei' : 'Talent'}
                </button>
              ))}
            </div>
            {asiArt && asiArt !== 'talent' && (
              <div className="auf-tp" style={{marginTop:6}}>
                <select className="form-select" value={asiA} onChange={e=>setAsiA(e.target.value)}>
                  {ATTR_WAHL.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
                </select>
                {asiArt === 'eins' && (
                  <select className="form-select" value={asiB} onChange={e=>setAsiB(e.target.value)}>
                    {ATTR_WAHL.map(a => <option key={a.k} value={a.k}>{a.l}</option>)}
                  </select>
                )}
              </div>
            )}
            {asiArt === 'talent' && (alleTalente.length === 0 ? (
              <div className="auf-hinweis">
                Es ist noch kein Talent hinterlegt. Zwei Wege: einzeln unter
                <b> 📚 Datenbank ▸ ⭐ Talente</b>, oder als Sammlung für die ganze
                Gruppe in einer <b>data-eigen.json</b> neben der index.html.
                Bis dahin lässt der Aufstieg die Attribute in Ruhe.
              </div>
            ) : (
              <>
                <div className="auf-tp" style={{marginTop:6}}>
                  <select className="form-select" value={talName}
                    onChange={e=>{ setTalName(e.target.value); setTalAttr(''); }}>
                    <option value="">Talent wählen…</option>
                    {[...alleTalente].sort((a, b) => a.name.localeCompare(b.name, 'de'))
                      .map(t => <option key={t.name} value={t.name}>
                        {t.name}{t.herkunft ? ' · ' + t.herkunft : ''}
                      </option>)}
                  </select>
                </div>
                {talEintrag && (
                  <div className="auf-hinweis">
                    {talEintrag.voraussetzung
                      ? <><b>Voraussetzung:</b> {talEintrag.voraussetzung}<br/></> : null}
                    {talEintrag.description || 'Ohne Beschreibung in der Datenbank.'}
                  </div>
                )}
                {/* Ein halbes Talent steigert nebenbei ein Attribut. Welches,
                    entscheidet niemand für dich — auch hier nicht. */}
                {talHalb.length > 0 && (
                  <div className="auf-tp" style={{marginTop:6}}>
                    <span className="auf-hinweis" style={{alignSelf:'center'}}>+1 auf</span>
                    {talHalb.map(k => (
                      <button type="button" key={k}
                        className={'bj-taste' + (talAttr === k ? ' haupt' : '')}
                        onClick={()=>setTalAttr(k)}>
                        {(ATTR_WAHL.find(a => a.k === k) || {}).l || k}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ))}
          </div>
        )}

        {/* ── Was die Klasse gibt ─────────────────────────────── */}
        {neueMerkmale.length > 0 && (
          <div className="form-group form-full">
            <div className="form-label">
              Neue Merkmale — {gewaehlt.length} von {neueMerkmale.length} ausgewählt
            </div>
            <div className="auf-merkmale">
              {neueMerkmale.map(m => {
                const k = m.stufe + ':' + m.name;
                const an = aus[k] === undefined ? vorgewaehlt(m) : !aus[k];
                return (
                  <label className={'auf-merkmal' + (an ? ' an' : '')
                    + (m.unter || m.optional ? ' unter' : '')} key={k}>
                    <input type="checkbox" checked={an}
                      onChange={()=>setAus(a => ({...a, [k]: an}))} />
                    <span className="auf-merkmal-kopf">
                      <b>{m.name}</b>
                      <i>Stufe {m.stufe}{m.quelle ? ' · ' + m.quelle
                        : m.unter ? ' · Unterklasse' : ''}
                        {m.optional ? ' · optional' : ''}
                        {m.herkunft && m.herkunft !== 'SRD 5.1'
                          ? ' · ' + (m.herkunft === 'Eigen' ? 'aus eurer Datenbank' : m.herkunft)
                          : ''}</i>
                    </span>
                    <span className="auf-merkmal-text">{m.text}</span>
                  </label>
                );
              })}
            </div>
            <div className="auf-hinweis">
              Aus dem SRD 5.1. Was die Unterklasse gibt, steht nur als Erinnerung da —
              wie es heißt, weiß dein Bogen.
            </div>
          </div>
        )}

        {/* ── Die Vorschau. Sie ist die ganze Sicherung. ───────── */}
        <div className="form-label" style={{marginTop:4}}>Das ändert sich</div>
        <div className="auf-vorschau">
          {plan.zeilen.length === 0
            ? <div className="auf-nichts">Nichts — die Stufe steht schon so da.</div>
            : plan.zeilen.map((z, i) => (
                <div className="auf-zeile" key={i}>
                  <span>{z.was}</span>
                  <b>{z.alt} <i>→</i> {z.neu}</b>
                </div>
              ))}
        </div>

        {plan.hinweise.length > 0 && (
          <div className="auf-warnung">
            {plan.hinweise.map((h, i) => <div key={i}>⚠ {h}</div>)}
          </div>
        )}

        <div className="form-actions" style={{marginTop:16}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={!geht || plan.zeilen.length === 0}
            onClick={()=>onUebernehmen(plan)}>
            Übernehmen
          </button>
        </div>
      </div>
    </Fenster>
  );
};
