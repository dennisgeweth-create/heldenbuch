// Heldenbuch — der Laden.
//
// Kaufen hiess bisher: im Inventar eine Zeile anlegen, im Beutel eine
// Zahl herunterrechnen, und beides von Hand in zwei Reitern. Verkaufen
// dasselbe rückwärts. Beides wird deshalb selten richtig gemacht.
//
// Die Spielleitung stellt zusammen, was ein Ort führt und zu welchem
// Teil er zurückkauft — der übliche halbe. Der Rest ist Rechnen, und
// das kann das Programm besser: bezahlt wird aus dem Kleingeld zuerst,
// und was zu viel hingelegt wurde, kommt als Wechselgeld zurück.

// Gold als Text, wie man es tippt: „2,5" sind 250 Kupfer.
const goldZuKupfer = (t) => {
  const n = Number(String(t).replace(',', '.'));
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
};
const kupferZuGold = (k) => String(Math.round((+k || 0)) / 100).replace('.', ',');

// Was einer KI vorgelegt wird, damit sie eine Auslage schreibt, die der
// Leser auch einliest. Derselbe Bau wie bei der Beute: erst die Form,
// dann die Regeln, dann ein Beispiel — und ganz zum Schluss die Frage,
// die sich jeder selbst anhaengt.
const LADEN_KI_ANWEISUNG = [
  'Erstelle mir die Auslage eines Ladens für Dungeons & Dragons 5e auf Deutsch.',
  'Antworte nur mit der Liste: keine Einleitung, keine Erklärung, keine',
  'Tabelle, keine Überschriften, keine Fettschrift.',
  '',
  'Eine Zeile je Eintrag, in dieser Form:',
  '  Laden: <Name des Ortes>              (höchstens einmal, ganz oben)',
  '  Kauft zu <Zahl> %                    (was der Ort für Gebrauchtes zahlt)',
  '  <Ware> | <Preis> | <Notiz>           (Preis und Notiz darfst du weglassen)',
  '',
  'Dabei gilt:',
  '- Waren mit ihrem deutschen Namen, so wie er im Regelwerk steht:',
  '  „Seil aus Hanf (15 m)", „Trank der Heilung", „Fackel".',
  '- Der Preis mit Münzart: „50 GM", „2,5 GM", „1 SM". Eine Zahl ohne',
  '  Münzart gilt als Gold.',
  '- Die Notiz ist ein kurzer Satz für den Tisch, kein Regeltext:',
  '  „letztes Stück", „nur gegen Vorbestellung".',
  '- Keine Zwischenüberschriften, keine Gruppen, keine Gesamtsumme.',
  '',
  'Beispiel:',
  'Laden: Bogens Krämerladen',
  'Kauft zu 40 %',
  'Fackel | 1 KM | brennt eine Stunde',
  'Seil aus Hanf (15 m) | 1 GM',
  'Trank der Heilung | 50 GM | letztes Stück',
  'Wanderstab | 5 KM',
  '',
  'Und das soll der Ort führen:',
  '',
].join('\n');

const LadenBearbeiten = ({ laden, gegenstaende, onAbbrechen, onSpeichern }) => {
  const [name, setName] = React.useState((laden && laden.name) || 'Der Laden');
  const [kauf, setKauf] = React.useState(Math.round(((laden && laden.kauf) || 0.5) * 100));
  const [waren, setWaren] = React.useState(
    ((laden && laden.waren) || []).map(w => ({...w, gold: kupferZuGold(w.preis)}))
      .concat([{name:'', gold:'', notiz:''}]));

  const setZeile = (i, p) => setWaren(w => w.map((x, j) => j === i ? {...x, ...p} : x));

  // ── Eine Auslage einfügen ──
  // Was schon dasteht, bleibt stehen: eingefügt wird dazu. Wer eine
  // Auslage ersetzen will, leert sie vorher — das ist seltener als
  // nachlegen, und ein Einfügen, das still alles löscht, wäre der
  // schlechtere Tausch.
  const uebernehmen = (roh) => {
    const g = ladenAusText(roh);
    if (!g.waren.length && !g.name && g.kauf === null) {
      return {gut: false, meldung: 'Daraus lässt sich nichts lesen. Eine Zeile je Ware.'};
    }
    if (g.name) setName(g.name);
    if (g.kauf !== null) setKauf(g.kauf);
    // Steht der Name in der Datenbank, gilt ihre Schreibweise und ihre
    // Beschreibung — dieselbe Regel wie bei der Beute. Eine Notiz aus
    // der Liste sticht sie: sie gilt für diesen Laden.
    const reihen = g.waren.map(w => {
      const t = dbGegenstand(gegenstaende, w.name);
      return {name: (t && t.name) || w.name,
              gold: w.preis ? kupferZuGold(w.preis) : '',
              notiz: w.notiz || (t ? dbKurz(t) : ''),
              ausDb: !!t};
    });
    if (reihen.length) setWaren(w => w.filter(x => (x.name || '').trim())
      .concat(reihen.map(({ausDb, ...r}) => r), [{name:'', gold:'', notiz:''}]));

    const was = [];
    if (reihen.length) was.push(reihen.length + (reihen.length === 1 ? ' Ware' : ' Waren'));
    if (g.name) was.push('der Name');
    if (g.kauf !== null) was.push('der Ankauf');
    const ohnePreis = reihen.filter(r => !r.gold).length;
    const ausDb = reihen.filter(r => r.ausDb).length;
    return {gut: true, meldung: 'Übernommen: ' + was.join(', ')
      + (ausDb ? ' — ' + ausDb + ' davon aus der Datenbank' : '')
      + (ohnePreis ? (ausDb ? '. ' : ' — ') + ohnePreis
         + (ohnePreis === 1 ? ' Zeile hat keinen Preis' : ' Zeilen haben keinen Preis') : '')
      + '.'};
  };
  const fertig = () => onSpeichern({
    name: name.trim() || 'Der Laden',
    kauf: Math.max(0, Math.min(100, kauf)) / 100,
    waren: waren.filter(w => (w.name || '').trim()).map((w, i) => ({
      id: w.id || ('w' + Date.now() + i),
      name: w.name.trim(), preis: goldZuKupfer(w.gold), notiz: (w.notiz || '').trim(),
    })),
  });

  return (
    <Fenster>
      <div className="form-modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div className="form-title">🏪 Was der Ort führt</div>
        <div className="beute-neu" style={{marginBottom:10}}>
          <input className="form-input" value={name} maxLength={60}
            placeholder="z.B. Bogens Krämerladen" onChange={e=>setName(e.target.value)} />
          <label className="auf-zahl">
            <span>kauft zu</span>
            <ZahlFeld className="form-input" min={0} max={100} wert={kauf} onWert={setKauf} />
            <span>%</span>
          </label>
        </div>

        <ListeEinfuegen anweisung={LADEN_KI_ANWEISUNG} onText={uebernehmen}
          aufschrift="Auslage einfügen"
          platzhalter={'Eine Zeile je Ware:\n\nLaden: Bogens Krämerladen\nKauft zu 40 %\nFackel | 1 KM | brennt eine Stunde\nSeil aus Hanf (15 m) | 1 GM'} />

        <div className="ass-warum">Preise in Gold — „2,5" sind zwei Gold und fünf Silber.
          Eine Zeile ohne Namen fällt weg. Was in der Datenbank steht, wird beim
          Tippen vorgeschlagen und bringt seine Werte mit.</div>
        <datalist id="hb-db-waren">
          {(gegenstaende || []).map(g => <option key={g.name} value={g.name} />)}
        </datalist>
        <div className="beute-zeilen laden-bearbeiten">
          {waren.map((w, i) => (
            <div className="beute-neu" key={i}>
              {/* Dieselbe Vorschlagsliste wie bei der Beute. Was der Ort
                  führt, steht meistens schon in der Datenbank. */}
              <input className="form-input" value={w.name} maxLength={80} list="hb-db-waren"
                placeholder="Ware"
                onChange={e=>{
                  const v = e.target.value;
                  const t = dbGegenstand(gegenstaende, v);
                  setZeile(i, {name: v, notiz: (w.notiz || (t ? dbKurz(t) : ''))});
                }} />
              <input className="form-input laden-preis" value={w.gold} placeholder="GM"
                onChange={e=>setZeile(i, {gold: e.target.value})} />
              <input className="form-input" value={w.notiz || ''} maxLength={120} placeholder="Notiz"
                onChange={e=>setZeile(i, {notiz: e.target.value})} />
              <button className="konz-weg" title="Zeile weg"
                onClick={()=>setWaren(x => x.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button className="bj-taste" onClick={()=>setWaren(w => [...w, {name:'', gold:'', notiz:''}])}>
            + Noch eine Zeile
          </button>
        </div>

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={fertig}>Speichern</button>
        </div>
      </div>
    </Fenster>
  );
};

const LadenFenster = ({ laden, helden, isDmMode, onKaufen, onVerkaufen,
                        onBearbeiten, onSchliessen }) => {
  const [wer, setWer] = React.useState((helden[0] || {}).id || '');
  const [preise, setPreise] = React.useState({});      // was für ein Stück geboten wird
  const held = helden.find(h => h.id === wer) || null;
  const beutel = (held && held.currency) || {pp:0,gp:0,ep:0,sp:0,cp:0};
  const habe = muenzenSumme(beutel);
  const waren = (laden && laden.waren) || [];
  const kauf = (laden && laden.kauf) || 0;

  // Was der Laden für ein Stück aus dem Inventar bietet: der Anteil vom
  // Ladenpreis, wenn er die Ware führt — sonst muss jemand eine Zahl
  // hinschreiben, und das ist die Spielleitung.
  const gebot = (i) => {
    if (preise[i.id] !== undefined) return goldZuKupfer(preise[i.id]);
    const w = waren.find(x => x.name.toLowerCase() === (i.name || '').toLowerCase());
    return w ? Math.round(w.preis * kauf) : 0;
  };

  return (
    <Fenster onClick={onSchliessen}>
      <div className="form-modal laden-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">🏪 {(laden && laden.name) || 'Der Laden'}</div>

        {helden.length > 1 && (
          <div className="form-group form-full">
            <div className="form-label">Wer kauft</div>
            <select className="form-select" value={wer} onChange={e=>setWer(e.target.value)}>
              {helden.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}

        {held && (
          <div className="laden-beutel">
            <span>{held.name} hat</span>
            <b>{preisText(habe)}</b>
          </div>
        )}

        <div className="form-label" style={{marginTop:10}}>Auslage</div>
        <div className="beute-liste">
          {waren.length === 0 && <div className="probe-leer">Der Ort führt noch nichts.</div>}
          {waren.map(w => {
            const reicht = habe >= w.preis;
            return (
              <div className="beute-stueck" key={w.id}>
                <div className="beute-was">
                  <b>{w.name}</b>
                  {w.notiz && <i>{w.notiz}</i>}
                </div>
                <span className="laden-schild">{preisText(w.preis)}</span>
                <button className="bj-taste" disabled={!held || !reicht}
                  title={reicht ? '' : 'Dafür reicht der Beutel nicht'}
                  onClick={()=>onKaufen(held, w)}>Kaufen</button>
              </div>
            );
          })}
        </div>

        {held && (held.inventory || []).length > 0 && kauf > 0 && (
          <>
            <div className="form-label" style={{marginTop:12}}>
              Verkaufen — der Ort zahlt {Math.round(kauf * 100)} %
            </div>
            <div className="beute-liste">
              {(held.inventory || []).map(i => {
                const g = gebot(i);
                return (
                  <div className="beute-stueck" key={i.id}>
                    <div className="beute-was">
                      <b>{i.name}{(+i.qty || 1) > 1 ? ' ×' + i.qty : ''}</b>
                    </div>
                    <input className="form-input laden-preis"
                      value={preise[i.id] !== undefined ? preise[i.id] : kupferZuGold(g)}
                      onChange={e=>setPreise(p => ({...p, [i.id]: e.target.value}))} />
                    <button className="bj-taste" disabled={g <= 0}
                      title={g > 0 ? '' : 'Wofür denn? Trag einen Preis ein.'}
                      onClick={()=>onVerkaufen(held, i, g)}>Verkaufen</button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="form-actions" style={{marginTop:14}}>
          {isDmMode && (
            <button className="btn-cancel" style={{marginRight:'auto'}}
              onClick={onBearbeiten}>Auslage ändern</button>
          )}
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
      </div>
    </Fenster>
  );
};
