// ── Benutzen am Bogen ───────────────────────────────────────────
// Ein Zauber wird gewirkt, ein Trank getrunken, ein Merkmal eingesetzt —
// und was es kostet, geht gleich vom Bogen ab und steht im Log. Die
// Rechnung steht in js/util.js (zauberWirken, gegenstandBenutzen,
// merkmalEinsetzen, ressourceEinsetzen); hier steht nur, was man dafür
// sieht: das Fenster, in dem man den Grad wählt, und der kurze Hinweis
// danach.

// Ein Zauber ab Grad 1 fragt, worauf er gewirkt wird. Vorgewählt ist
// der kleinste Grad mit freiem Platz; ist keiner frei, bleiben Ritual
// und „ohne Platz“.
const WirkenFenster = ({ held, zauber, onWirken, onAbbrechen }) => {
  const wahl = zauberGradWahl(held, zauber);
  const ritual = zauberIstRitual(zauber);
  const [weg, setWeg] = useState(() => {
    const g = zauberGradVorschlag(held, zauber);
    return g ? {grad: g} : (ritual ? {ritual: true} : {frei: true});
  });
  const grund = +zauber.level || 0;
  const gradJetzt = weg.grad || grund;
  const wurf = hatWirkung(zauber.wirkung) ? wuerfelAufGrad(zauber.wirkung, grund, gradJetzt) : '';
  const alt = held.konzentration && held.konzentration.name;
  const konz = brauchtKonzentration(zauber);
  const gleich = (w) => JSON.stringify(w) === JSON.stringify(weg);
  return (
    <Fenster>
      <div className="form-modal wirken-fenster" style={{maxWidth:460}}>
        <div className="form-title">✨ {zauber.name || 'Zauber'} wirken</div>
        <div className="wirken-kopf">
          <span>{grund}. Grad · {zauber.school || '—'}</span>
          <span>{zauber.castingTime || '—'}</span>
          <span>{zauber.duration || '—'}</span>
        </div>

        <div className="form-label" style={{marginTop:14}}>Zauberplatz</div>
        {wahl.length > 0 ? (
          <div className="wirken-grade" role="radiogroup" aria-label="Zauberplatz">
            {wahl.map(x => (
              <button key={x.grad} type="button" role="radio" aria-checked={gleich({grad: x.grad})}
                className={'wirken-grad' + (gleich({grad: x.grad}) ? ' an' : '')}
                disabled={x.frei <= 0} onClick={() => setWeg({grad: x.grad})}
                title={x.frei <= 0 ? 'Kein Platz dieses Grades mehr frei' : 'Auf Grad ' + x.grad + ' wirken'}>
                <span className="wirken-grad-zahl">{x.grad}</span>
                <span className="wirken-grad-punkte" aria-hidden="true">
                  {Array.from({length: Math.min(x.max, 6)}).map((_, i) => (
                    <i key={i} className={i < x.frei ? 'frei' : ''} />
                  ))}
                </span>
                <span className="wirken-grad-rest">{x.frei}/{x.max}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="reiter-hinweis">Ab Grad {grund} sind keine Zauberplätze eingetragen.</div>
        )}
        <div className="wirken-sonst">
          {ritual && (
            <label className="zw-schalter">
              <input type="radio" name="wirken-weg" checked={gleich({ritual: true})}
                onChange={() => setWeg({ritual: true})} />
              <span>Als Ritual — 10 Minuten länger, kein Platz</span>
            </label>
          )}
          <label className="zw-schalter">
            <input type="radio" name="wirken-weg" checked={gleich({frei: true})}
              onChange={() => setWeg({frei: true})} />
            <span>Ohne Zauberplatz (Volk, Talent, Gegenstand)</span>
          </label>
        </div>

        {(wurf || konz) && (
          <div className="zw-probe" style={{marginTop:12}}>
            {wurf && <>Wurf auf Grad {gradJetzt}: <b>{wurf}</b>{zauber.wirkung.schadensart ? ' ' + zauber.wirkung.schadensart : ''}</>}
            {wurf && konz && ' · '}
            {konz && (alt && alt !== zauber.name
              ? <>Konzentration — <b>{alt}</b> endet</>
              : <>Konzentration</>)}
          </div>
        )}

        <div className="form-actions">
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" onClick={() => onWirken(weg)}
            disabled={!!weg.grad && !(wahl.find(x => x.grad === weg.grad) || {}).frei}>✨ Wirken</button>
        </div>
      </div>
    </Fenster>
  );
};

// Der Hinweis nach dem Benutzen: was abging, unten am Rand, und nach ein
// paar Sekunden wieder weg. Ins Log ist es da schon geschrieben.
const BenutztHinweis = ({ hinweis, onWeg }) => {
  useEffect(() => {
    if (!hinweis) return;
    const t = setTimeout(onWeg, 4000);
    return () => clearTimeout(t);
  }, [hinweis && hinweis.t]);
  if (!hinweis) return null;
  return (
    <div className="benutzt-hinweis" role="status" key={hinweis.t} onClick={onWeg}>
      <span className="benutzt-haken">✓</span>
      <span>{hinweis.text}</span>
    </div>
  );
};
