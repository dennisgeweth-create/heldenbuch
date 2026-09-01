// Heldenbuch — Eingabebausteine: Rich-Text-Editor und Effekt-Editor.
// Beide ohne Bezug zum Charakterbogen, deshalb eigene Datei.

const RichEditor = ({ value, onChange, placeholder, rows }) => {
  const ref = React.useRef(null);
  const [showEmoji, setShowEmoji] = React.useState(false);
  const savedRange = React.useRef(null);

  // Update innerHTML only when value changes from OUTSIDE and editor is not focused
  // This prevents React re-renders from stealing focus while user types
  React.useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return; // typing — don't interfere
    if (ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]); // runs whenever value prop changes

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd, val) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val||null);
    onChange(ref.current?.innerHTML || '');
  };

  const isActive = (cmd) => { try { return document.queryCommandState(cmd); } catch { return false; } };

  const insertEmoji = (emoji) => {
    ref.current?.focus();
    restoreRange();
    document.execCommand('insertText', false, emoji);
    onChange(ref.current?.innerHTML || '');
    setShowEmoji(false);
  };

  // Feste Hoehe statt mitwachsend: ein contentEditable waechst sonst mit dem
  // Inhalt und schiebt bei langen Beschreibungen die Speichern-Knoepfe aus
  // dem Blick. Untergrenze 96px (rund vier Zeilen) — mit zwei Zeilen laesst
  // sich schlecht schreiben. Laengere Texte scrollen im Feld.
  const boxH = Math.max(rows ? rows * 24 : 80, 96);

  return (
    <div className="rte-wrap" onClick={()=>ref.current?.focus()}>
      <div className="rte-toolbar" onMouseDown={e=>e.preventDefault()}>
        <button type="button" className={"rte-btn rte-btn-bold"+(isActive('bold')?' active':'')}
          onMouseDown={e=>{e.preventDefault();exec('bold');}}>B</button>
        <button type="button" className={"rte-btn rte-btn-italic"+(isActive('italic')?' active':'')}
          onMouseDown={e=>{e.preventDefault();exec('italic');}}>I</button>
        <button type="button" className={"rte-btn rte-btn-underline"+(isActive('underline')?' active':'')}
          onMouseDown={e=>{e.preventDefault();exec('underline');}}>U</button>
        <div style={{width:1,height:16,background:'var(--border)',margin:'0 2px'}}/>
        <button type="button" className="rte-btn"
          onMouseDown={e=>{e.preventDefault();exec('insertUnorderedList');}}>• Liste</button>
        <button type="button" className="rte-btn"
          onMouseDown={e=>{e.preventDefault();exec('insertOrderedList');}}>1. Liste</button>
        <div style={{width:1,height:16,background:'var(--border)',margin:'0 2px'}}/>
        <div className="rte-emoji-wrap">
          <button type="button" className="rte-btn"
            onMouseDown={e=>{e.preventDefault();saveRange();setShowEmoji(s=>!s);}}>😊 Emoji</button>
          {showEmoji && (
            <div className="rte-emoji-grid">
              {EMOJI_LIST.map(em=>(
                <button key={em} type="button" className="rte-emoji-item"
                  onMouseDown={e=>{e.preventDefault();insertEmoji(em);}}>{em}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div
        ref={ref}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder||'Hier schreiben...'}
        style={{height:boxH}}
        onInput={()=>onChange(ref.current?.innerHTML||'')}
        onBlur={()=>{setShowEmoji(false);onChange(ref.current?.innerHTML||'');}}
      />
    </div>
  );
};

// ── Effekt-Editor ────────────────────────────────────────────────
// Eine Zeile je Effekt: Was wird veraendert, wie, und um wie viel.
// Bewusst ohne Zwischenzustand — jede Aenderung geht direkt an onChange,
// damit der Effekt nicht beim Speichern verlorengehen kann.
const EffectEditor = ({ effects, onChange, hint }) => {
  const list = effects || [];
  const set = (id, patch) => onChange(list.map(e => e.id===id ? {...e, ...patch} : e));
  return (
    <div className="fx-editor">
      {list.length === 0 && (
        <div className="fx-empty">Keine Effekte. {hint || 'Damit kann dieser Gegenstand Werte des Helden verändern.'}</div>
      )}
      {list.map(e => (
        <div className="fx-row" key={e.id}>
          <select className="form-select fx-target" value={e.target}
            onChange={ev=>set(e.id,{target:ev.target.value})}>
            {EFFECT_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
              </optgroup>
            ))}
          </select>
          <select className="form-select fx-mode" value={e.mode||'bonus'}
            onChange={ev=>set(e.id,{mode:ev.target.value})}>
            <option value="bonus">Bonus (+/−)</option>
            <option value="set">Fester Wert</option>
          </select>
          <input className="form-input fx-value" type="number" value={e.value}
            onChange={ev=>set(e.id,{value:ev.target.value===''?0:+ev.target.value})} />
          <button type="button" className="fx-del" title="Effekt entfernen"
            onClick={()=>onChange(list.filter(x=>x.id!==e.id))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-add fx-add" onClick={()=>onChange([...list, newEffect()])}>
        + Effekt hinzufügen
      </button>
      {list.length > 0 && (
        <div className="fx-preview">
          {list.map(e => (
            <span className="fx-chip" key={e.id}>{EFFECT_LABELS[e.target]||e.target} {effectText(e)}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── LogTab component ─────────────────────────────────────────────
