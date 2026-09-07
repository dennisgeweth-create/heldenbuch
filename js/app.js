// ACHTUNG: erzeugt von build.js aus js/src/*.jsx — Aenderungen hier gehen
// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.
// Zusammengesetzt aus: 0-basis.jsx, 1-editors.jsx, 2-logtab.jsx, 2b-gegner.jsx, 2c-kampf.jsx, 2d-chronik.jsx, 2e-abenteuer.jsx, 2f-automat.jsx, 2g-kampfsicht.jsx, 3-sheet.jsx, 3a-ausruestung.jsx, 4-app.jsx
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
// ==== js/src/0-basis.jsx ====
// Heldenbuch — gemeinsame Grundlagen für alle folgenden Quelldateien.
//
// build.js setzt js/src/*.jsx in Dateinamen-Reihenfolge zu einem Skript
// zusammen; alle Dateien teilen sich deshalb einen Geltungsbereich. Was hier
// steht, gilt überall.
//
// Vorausgesetzt aus dem <head> von index.html: React, ReactDOM, js/data.js,
// js/util.js und der API-Client aus dem einfachen <script>-Block.

const {
  useState,
  useEffect,
  useRef
} = React;
const apiLoad = apiLoadChars;
const apiSave = apiSaveChars;

// ── Ein Zahlenfeld, das man leeren darf ──────────────────────────
// Die Felder im Heldenbuch schrieben ihren Wert bei jedem Tastendruck
// zurueck: Number('') ist 0, und mit Math.max(1, …) wurde daraus eine 1.
// Wer eine 12 eintragen wollte, musste sie ueber die stehengebliebene
// Ziffer schreiben — loeschen ging nicht, das Feld fuellte sich sofort
// wieder. Genau das machte das Eintragen von Mengen umstaendlich.
//
// Hier gilt, solange jemand im Feld steht, was er getippt hat — auch
// nichts. Erst beim Verlassen wird daraus eine Zahl: Enter uebernimmt,
// Escape verwirft, ein leeres Feld faellt auf leerWert zurueck oder,
// wenn es keinen gibt, auf den alten Wert.
//
// Nebenbei spart es Schreibvorgaenge: aus "123" wurden bisher drei
// Speicherlaeufe, jetzt ist es einer.
//
// Mit "sofort" wandert die Zahl schon beim Tippen nach aussen, waehrend
// im Feld weiter der Rohtext steht. Das brauchen Fenster, die noch etwas
// anderes an der Zahl haengen haben — die Schaltflaeche "Anwenden" im
// Schadensfenster war ausgegraut, solange die getippte Zahl nur im Feld
// stand, und eine ausgegraute Schaltflaeche nimmt keinen Klick an: sie
// loeste nicht einmal das Verlassen des Feldes aus. Wer 7 eintippte und
// klickte, sah gar nichts geschehen.
const ZahlFeld = ({
  wert,
  onWert,
  min,
  max,
  leerWert,
  sofort,
  onKeyDown,
  ...rest
}) => {
  const [roh, setRoh] = useState(null); // null = zeig, was von aussen kommt
  const zeigen = roh !== null ? roh : wert === undefined || wert === null || wert === '' ? '' : String(wert);

  // Aus dem, was im Feld steht, eine Zahl machen — oder undefined, wenn
  // daraus (noch) keine wird, etwa bei "-" oder "1e".
  const alsZahl = t => {
    t = String(t).trim();
    if (t === '') return leerWert !== undefined ? leerWert : wert;
    let n = Number(t.replace(',', '.'));
    if (!Number.isFinite(n)) return undefined;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    return n;
  };
  const festhalten = () => {
    if (roh === null) return;
    let n = alsZahl(roh);
    if (n === undefined) n = wert;
    setRoh(null);
    if (n !== wert) onWert(n);
  };
  return /*#__PURE__*/React.createElement("input", _extends({
    type: "number"
  }, rest, {
    min: min,
    max: max,
    value: zeigen,
    onChange: e => {
      setRoh(e.target.value);
      if (!sofort) return;
      const n = alsZahl(e.target.value);
      if (n !== undefined && n !== wert) onWert(n);
    },
    onBlur: festhalten,
    onKeyDown: e => {
      if (e.key === 'Enter') {
        festhalten();
      }
      if (e.key === 'Escape') {
        setRoh(null);
        e.currentTarget.blur();
      }
      if (onKeyDown) onKeyDown(e);
    }
  }));
};

// ── Die Ausgabe ─────────────────────────────────────────────────
// Steht an einer Stelle und wird an zweien gezeigt: im Logo der
// Heldenleiste und in der schmalen Ansicht.
const HB_VERSION = 'v4.6';

// ── Ein einklappbarer Abschnitt der Einstellungen ────────────────
// Die Einstellungsfenster sind lang geworden — Trefferpunkte, Automat,
// Spielleitung, Konten, Klassen, und in der Verwaltung noch einmal
// dasselbe. Zugeklappt sieht man auf einen Blick, was es gibt;
// aufgeklappt nur das, was man gerade sucht. Deshalb geht alles
// zugeklappt auf.
//
// "kurz" ist die Zeile, die zugeklappt rechts steht: was gerade gilt,
// ohne dass man aufklappen muss.
const EinstBlock = ({
  titel,
  kurz,
  offenStart,
  children
}) => {
  const [offen, setOffen] = useState(!!offenStart);
  return /*#__PURE__*/React.createElement("div", {
    className: 'einst-block' + (offen ? ' offen' : '')
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "einst-kopf",
    "aria-expanded": offen,
    onClick: () => setOffen(o => !o)
  }, /*#__PURE__*/React.createElement("span", {
    className: "einst-pfeil"
  }, offen ? '▾' : '▸'), /*#__PURE__*/React.createElement("span", {
    className: "einst-titel"
  }, titel), kurz ? /*#__PURE__*/React.createElement("i", {
    className: "einst-kurz"
  }, kurz) : null), offen && /*#__PURE__*/React.createElement("div", {
    className: "einst-inhalt"
  }, children));
};

// ── Ein Bearbeiten-Fenster ist ein Fenster ────────────────────
// Bisher war jeder Dialog ein Vorhang: er lag in der Mitte, nahm den
// ganzen Schirm, und wer nachsehen wollte, was dahinter steht — der
// eigene Bogen, die Liste, der Kampf —, musste ihn schliessen und die
// Eingaben aufgeben.
//
// Jetzt hat jeder Dialog eine Titelzeile, an der man ihn beiseite
// schiebt, und einen Knopf, der ihn auf genau diese Zeile zusammen-
// klappt. Zugeklappt faellt der Vorhang weg: das Heldenbuch dahinter
// ist wieder zu bedienen, und der Dialog wartet als schmaler Balken,
// bis man ihn wieder aufklappt. Auf dem Telefon liegt dieser Balken am
// unteren Rand — dort, wo der Dialog ohnehin aufgeht.
//
// Damit dafuer nicht dreissig Dialoge einzeln umgeschrieben werden
// mussten, arbeitet das Fenster am fertigen Baum: es nimmt den Dialog,
// den es umschliesst, markiert dessen erstes Kind als Kopf — die
// Titelzeile, die jeder ohnehin hat — und haengt die beiden Knoepfe
// daneben. Wer <Fenster> statt <div className="form-overlay"> schreibt,
// bekommt alles Weitere geschenkt.
const FENSTER_LUFT = 120; // so viel bleibt immer greifbar am Rand

// Nicht jeder Dialog kennt einen Weg hinaus, den wir kennen: manche
// schliessen per Klick auf den Hintergrund, andere nur ueber ihren
// eigenen Abbrechen-Knopf. Das Kreuz nimmt, was da ist.
const fensterAusgang = el => el && [...el.querySelectorAll('button')].find(b => !b.classList.contains('fenster-knopf') && /^(abbrechen|schlie(ss|ß)en|fertig|verstanden|✕|✕ .*)$/i.test((b.textContent || '').trim()));
const Fenster = ({
  onClick,
  children,
  ...rest
}) => {
  const [pos, setPos] = useState(null); // null = mittig, wie bisher
  const [zu, setZu] = useState(false);
  const [ausgang, setAusgang] = useState(false);
  const haus = useRef(null);
  const zug = useRef(null);
  useEffect(() => {
    setAusgang(!!onClick || !!fensterAusgang(haus.current));
  }, [onClick]);
  const schliessen = () => {
    if (onClick) {
      onClick({
        stopPropagation: () => {}
      });
      return;
    }
    const k = fensterAusgang(haus.current);
    if (k) k.click();
  };

  // Geschoben wird am Kopf — und nur dort, damit ein Griff daneben nicht
  // aus Versehen das ganze Fenster mitnimmt.
  const zugStart = e => {
    const el = haus.current;
    if (!el || !e.target.closest) return;
    if ((window.innerWidth || 0) <= 640) return; // am Telefon liegt es unten fest
    if (!e.target.closest('.fenster-kopf')) return;
    if (e.target.closest('button, a, input, select, textarea, [contenteditable]')) return;
    const r = el.getBoundingClientRect();
    zug.current = {
      dx: e.clientX - r.left,
      dy: e.clientY - r.top
    };
    setPos({
      x: r.left,
      y: r.top,
      w: r.width
    });
    try {
      el.setPointerCapture(e.pointerId);
    } catch (err) {}
  };
  const zugBewegen = e => {
    if (!zug.current) return;
    const b = window.innerWidth || 1200,
      h = window.innerHeight || 800;
    setPos(p => p && {
      ...p,
      x: Math.max(-p.w + FENSTER_LUFT, Math.min(e.clientX - zug.current.dx, b - FENSTER_LUFT)),
      y: Math.max(0, Math.min(e.clientY - zug.current.dy, h - 44))
    });
  };
  const zugEnde = () => {
    zug.current = null;
  };
  const kind = React.Children.toArray(children).find(k => React.isValidElement(k));
  if (!kind) return null;
  const innen = React.Children.toArray(kind.props.children);
  const kopfI = innen.findIndex(k => React.isValidElement(k) && typeof k.type === 'string');
  if (kopfI >= 0) {
    innen[kopfI] = React.cloneElement(innen[kopfI], {
      className: ((innen[kopfI].props.className || '') + ' fenster-kopf').trim()
    });
    innen.splice(kopfI, 0, /*#__PURE__*/React.createElement("div", {
      className: "fenster-knoepfe",
      key: "hb-fenster-knoepfe"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fenster-knopf",
      onClick: () => setZu(z => !z),
      "aria-expanded": !zu,
      title: zu ? 'Wieder aufklappen' : 'Zuklappen — an das Heldenbuch dahinter',
      "aria-label": zu ? 'Fenster aufklappen' : 'Fenster zuklappen'
    }, zu ? '▴' : '▾'), ausgang && /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fenster-knopf",
      onClick: schliessen,
      title: "Schlie\xDFen",
      "aria-label": "Fenster schlie\xDFen"
    }, "\u2715")));
  }
  const gehaeuse = React.cloneElement(kind, {
    ref: haus,
    className: ((kind.props.className || '') + ' fenster' + (zu ? ' zu' : '') + (pos ? ' los' : '')).trim(),
    style: {
      ...(kind.props.style || {}),
      ...(pos ? {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: pos.w,
        maxWidth: 'none',
        margin: 0,
        maxHeight: 'calc(100vh - ' + Math.round(pos.y) + 'px - 14px)'
      } : null)
    },
    onPointerDown: zugStart,
    onPointerMove: zugBewegen,
    onPointerUp: zugEnde,
    onPointerCancel: zugEnde,
    children: innen
  });

  // Wer ein Fenster beiseite schiebt, will sehen, was daneben steht.
  // Der Vorhang verschwindet deshalb, sobald das Fenster verschoben ist
  // - genau wie beim Zuklappen.
  return /*#__PURE__*/React.createElement("div", _extends({
    className: 'form-overlay' + (zu ? ' zu' : '') + (pos ? ' los' : ''),
    onClick: onClick
  }, rest), gehaeuse);
};

// ==== js/src/1-editors.jsx ====
// Heldenbuch — Eingabebausteine: Rich-Text-Editor und Effekt-Editor.
// Beide ohne Bezug zum Charakterbogen, deshalb eigene Datei.

const RichEditor = ({
  value,
  onChange,
  placeholder,
  rows
}) => {
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
    document.execCommand(cmd, false, val || null);
    onChange(ref.current?.innerHTML || '');
  };
  const isActive = cmd => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };
  const insertEmoji = emoji => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "rte-wrap",
    onClick: () => ref.current?.focus()
  }, /*#__PURE__*/React.createElement("div", {
    className: "rte-toolbar",
    onMouseDown: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "rte-btn rte-btn-bold" + (isActive('bold') ? ' active' : ''),
    onMouseDown: e => {
      e.preventDefault();
      exec('bold');
    }
  }, "B"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "rte-btn rte-btn-italic" + (isActive('italic') ? ' active' : ''),
    onMouseDown: e => {
      e.preventDefault();
      exec('italic');
    }
  }, "I"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "rte-btn rte-btn-underline" + (isActive('underline') ? ' active' : ''),
    onMouseDown: e => {
      e.preventDefault();
      exec('underline');
    }
  }, "U"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 16,
      background: 'var(--border)',
      margin: '0 2px'
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "rte-btn",
    onMouseDown: e => {
      e.preventDefault();
      exec('insertUnorderedList');
    }
  }, "\u2022 Liste"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "rte-btn",
    onMouseDown: e => {
      e.preventDefault();
      exec('insertOrderedList');
    }
  }, "1. Liste"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 16,
      background: 'var(--border)',
      margin: '0 2px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "rte-emoji-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "rte-btn",
    onMouseDown: e => {
      e.preventDefault();
      saveRange();
      setShowEmoji(s => !s);
    }
  }, "\uD83D\uDE0A Emoji"), showEmoji && /*#__PURE__*/React.createElement("div", {
    className: "rte-emoji-grid"
  }, EMOJI_LIST.map(em => /*#__PURE__*/React.createElement("button", {
    key: em,
    type: "button",
    className: "rte-emoji-item",
    onMouseDown: e => {
      e.preventDefault();
      insertEmoji(em);
    }
  }, em))))), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    className: "rte-content",
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder || 'Hier schreiben...',
    style: {
      height: boxH
    },
    onInput: () => onChange(ref.current?.innerHTML || ''),
    onBlur: () => {
      setShowEmoji(false);
      onChange(ref.current?.innerHTML || '');
    }
  }));
};

// ── Effekt-Editor ────────────────────────────────────────────────
// Eine Zeile je Effekt: Was wird veraendert, wie, und um wie viel.
// Bewusst ohne Zwischenzustand — jede Aenderung geht direkt an onChange,
// damit der Effekt nicht beim Speichern verlorengehen kann.
const EffectEditor = ({
  effects,
  onChange,
  hint
}) => {
  const list = effects || [];
  const set = (id, patch) => onChange(list.map(e => e.id === id ? {
    ...e,
    ...patch
  } : e));
  return /*#__PURE__*/React.createElement("div", {
    className: "fx-editor"
  }, list.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "fx-empty"
  }, "Keine Effekte. ", hint || 'Damit kann dieser Gegenstand Werte des Helden verändern.'), list.map(e => {
    // Schalter haben keine Hoehe: "Immun gegen Gift +1" ergibt keinen
    // Sinn, also fallen Rechenart und Wert bei ihnen weg.
    const schalter = isFlagEffect(e.target);
    return /*#__PURE__*/React.createElement("div", {
      className: "fx-row" + (schalter ? " fx-row-flag" : ""),
      key: e.id
    }, /*#__PURE__*/React.createElement("select", {
      className: "form-select fx-target",
      value: e.target,
      onChange: ev => set(e.id, {
        target: ev.target.value
      })
    }, EFFECT_GROUPS.map(g => /*#__PURE__*/React.createElement("optgroup", {
      key: g.group,
      label: g.group
    }, g.items.map(i => /*#__PURE__*/React.createElement("option", {
      key: i.key,
      value: i.key
    }, i.label))))), schalter ? /*#__PURE__*/React.createElement("span", {
      className: "fx-flag-note"
    }, "gilt, solange aktiv") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("select", {
      className: "form-select fx-mode",
      value: e.mode || 'bonus',
      onChange: ev => set(e.id, {
        mode: ev.target.value
      })
    }, /*#__PURE__*/React.createElement("option", {
      value: "bonus"
    }, "Bonus (+/\u2212)"), /*#__PURE__*/React.createElement("option", {
      value: "set"
    }, "Fester Wert")), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input fx-value",
      wert: e.value,
      onWert: v => set(e.id, {
        value: v
      })
    })), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fx-del",
      title: "Effekt entfernen",
      onClick: () => onChange(list.filter(x => x.id !== e.id))
    }, "\u2715"));
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-add fx-add",
    onClick: () => onChange([...list, newEffect()])
  }, "+ Effekt hinzuf\xFCgen"), list.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "fx-preview"
  }, list.map(e => /*#__PURE__*/React.createElement("span", {
    className: "fx-chip",
    key: e.id
  }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))));
};

// ── LogTab component ─────────────────────────────────────────────

// ==== js/src/2-logtab.jsx ====
// Heldenbuch — Abenteuerlog eines einzelnen Helden (Reiter "Log").

const LogTab = ({
  charId,
  isDmMode
}) => {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [tabFilter, setTabFilter] = React.useState([]);
  const [tabExclude, setTabExclude] = React.useState([]);
  const tabFilterRef = React.useRef([]);
  const tabExcludeRef = React.useRef([]);
  React.useEffect(() => {
    if (!charId) return;
    setLoading(true);
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!url || !code || !pass) {
      setLoading(false);
      return;
    }
    apiLoadLogs(url, code, pass, charId, {
      limit: 100,
      offset: 0,
      search: '',
      tabFilter: []
    }).then(d => {
      setEntries(d.logs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [charId]);
  const q = search.toLowerCase();
  // We need to know which chars are DM-only — check from the chars list via closure
  const dmCharIds = new Set(JSON.parse(localStorage.getItem('dnd_chars') || '[]').filter(c => c.dmOnly === true).map(c => c.id));
  const filtered = entries.filter(e => {
    if (!isDmMode && dmCharIds.has(e.char_id)) return false;
    if (tabFilter.length > 0 && !tabFilter.includes(e.tab)) return false;
    if (tabExclude.length > 0 && tabExclude.includes(e.tab)) return false;
    if (q && !e.action.toLowerCase().includes(q)) return false;
    return true;
  });
  const fmt = ts => new Date(ts.replace(' ', 'T') + 'Z').toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const tabColor = t => ({
    'zauber': '#c060a0',
    'inventar': '#e0a030',
    'waffen': '#c84040',
    'charakter': 'var(--gold)'
  })[t] || 'var(--border-bright)';
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 10
    }
  }, "\uD83D\uDCCB \xC4nderungslog"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      flex: 1,
      padding: '5px 10px',
      fontSize: 12
    },
    placeholder: "Suchen...",
    value: search,
    onChange: e => setSearch(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "marken-reihe",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 10
    }
  }, LOG_TABS.map(t => {
    const inc = tabFilter.includes(t);
    const exc = tabExclude.includes(t);
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => {
        const curInc = tabFilterRef.current.includes(t);
        const curExc = tabExcludeRef.current.includes(t);
        if (!curInc && !curExc) {
          tabFilterRef.current = [...tabFilterRef.current, t];
          setTabFilter([...tabFilterRef.current]);
        } else if (curInc) {
          tabFilterRef.current = tabFilterRef.current.filter(x => x !== t);
          setTabFilter([...tabFilterRef.current]);
          tabExcludeRef.current = [...tabExcludeRef.current, t];
          setTabExclude([...tabExcludeRef.current]);
        } else {
          tabExcludeRef.current = tabExcludeRef.current.filter(x => x !== t);
          setTabExclude([...tabExcludeRef.current]);
        }
      },
      title: inc ? 'Klicken zum Ausschließen' : exc ? 'Klicken zum Zurücksetzen' : 'Klicken zum Einschließen',
      style: {
        padding: '3px 8px',
        borderRadius: 12,
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        border: '1px solid',
        background: inc ? 'var(--gold)' : exc ? 'rgba(200,60,60,0.25)' : 'var(--bg-card)',
        borderColor: inc ? 'var(--gold)' : exc ? '#c83c3c' : 'var(--border)',
        color: inc ? 'var(--bg-deep)' : exc ? '#e07070' : 'var(--text-muted)',
        textDecoration: exc ? 'line-through' : 'none'
      }
    }, LOG_TAB_ICONS[t] || '📌', " ", t);
  })), loading && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      fontSize: 13
    }
  }, "Lade..."), !loading && filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      fontSize: 13
    }
  }, "Keine Eintr\xE4ge gefunden."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, filtered.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 8,
      padding: '7px 10px',
      background: 'var(--bg-card)',
      borderRadius: 4,
      borderLeft: '3px solid ' + tabColor(e.tab),
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      flexShrink: 0
    }
  }, LOG_TAB_ICONS[e.tab] || '📌'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 11,
      color: 'var(--text-primary)',
      lineHeight: 1.3
    }
  }, e.action), e.details && Object.keys(e.details).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      marginTop: 2
    }
  }, Object.entries(e.details).map(([k, v]) => k + ': ' + v).join(' · '))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 9,
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, fmt(e.created_at))))));
};

// ==== js/src/2b-gegner.jsx ====
// Heldenbuch — Gegner der Spielleitung.
//
// Eigene Datei, damit 4-app.jsx nicht weiter waechst. Die Bausteine
// bekommen alles ueber Eigenschaften statt ueber den Kontext: sie gehoeren
// zum DM-Bereich, nicht zum Charakterbogen.
//
// Gegner liegen zeilenweise auf dem Server, nicht in der DM-Bibliothek.
// Sonst lüde jede Aenderung an einem Goblin die ganze Sammlung hoch, und
// mit Bildern waere deren 2-MB-Grenze nach rund dreissig Portraets
// erreicht.

// Herausforderungsgrade in Spielreihenfolge, nicht alphabetisch: "1/8"
// gehoert vor "1", und "10" hinter "9".
const CR_ORDNUNG = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
const crRang = cr => {
  const i = CR_ORDNUNG.indexOf(String(cr || '').trim());
  return i === -1 ? 999 : i;
};

// Die fuenf Aktionslisten haben dieselbe Form {name, bonus, damage, type} —
// deshalb ein Editor fuer alle statt fuenf gleichlautender.
const GEGNER_LISTEN = [{
  key: 'attacks',
  label: 'Angriffe'
}, {
  key: 'bonusActions',
  label: 'Bonusaktionen'
}, {
  key: 'reactions',
  label: 'Reaktionen'
}, {
  key: 'legendaryActions',
  label: 'Legendäre Aktionen'
}, {
  key: 'lairActions',
  label: 'Schauplatzaktionen'
}];
const newEnemy = () => ({
  id: 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  name: '',
  type: 'Humanoid',
  cr: '1/4',
  size: 'Mittel',
  ac: 12,
  hpMax: 10,
  hpDice: '2d8',
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
  speed: 9,
  attacks: [],
  traits: [],
  tags: [],
  image: null
});

// ── Werteübersicht ───────────────────────────────────────────────
const GegnerBlatt = ({
  gegner,
  onSchliessen,
  onBearbeiten,
  onLoeschen,
  onBild
}) => {
  if (!gegner) return null;
  const g = gegner;
  const attr = [['str', 'STR'], ['dex', 'GES'], ['con', 'KON'], ['int', 'INT'], ['wis', 'WEI'], ['cha', 'CHA']];
  const listen = GEGNER_LISTEN.filter(l => (g[l.key] || []).length > 0);
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onSchliessen
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal gegner-blatt",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-blatt-kopf"
  }, g.image && /*#__PURE__*/React.createElement("img", {
    className: "gegner-blatt-bild",
    src: g.image,
    alt: "",
    onClick: () => onBild && onBild({
      name: g.name,
      imageData: g.image
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "gegner-blatt-titel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-blatt-name"
  }, g.name), /*#__PURE__*/React.createElement("div", {
    className: "gegner-blatt-sub"
  }, g.size, " \xB7 ", g.type, " \xB7 Herausforderung ", g.cr)), /*#__PURE__*/React.createElement("button", {
    className: "gegner-blatt-zu",
    onClick: onSchliessen,
    "aria-label": "Schlie\xDFen"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "gegner-blatt-koerper"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-kernwerte"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "R\xFCstungsklasse"), /*#__PURE__*/React.createElement("b", null, g.ac)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Trefferpunkte"), /*#__PURE__*/React.createElement("b", null, g.hpMax, g.hpDice ? ' (' + g.hpDice + ')' : '')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Bewegung"), /*#__PURE__*/React.createElement("b", null, g.speed, " m"))), /*#__PURE__*/React.createElement("div", {
    className: "gegner-attribute"
  }, attr.map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    className: "gegner-attr",
    key: k
  }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("b", null, g[k]), /*#__PURE__*/React.createElement("i", null, fnum(mod(g[k])))))), (g.tags || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "gegner-marken"
  }, (g.tags || []).map(t => /*#__PURE__*/React.createElement("span", {
    className: "inv-tag",
    key: t
  }, t))), (g.traits || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "gegner-abschnitt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-abschnitt-titel"
  }, "Merkmale"), (g.traits || []).map((t, i) => /*#__PURE__*/React.createElement("div", {
    className: "gegner-merkmal",
    key: i
  }, t))), listen.map(l => /*#__PURE__*/React.createElement("div", {
    className: "gegner-abschnitt",
    key: l.key
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-abschnitt-titel"
  }, l.label), (g[l.key] || []).map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: "gegner-aktion",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-aktion-name"
  }, a.name), (a.bonus || a.damage) && /*#__PURE__*/React.createElement("div", {
    className: "gegner-aktion-werte"
  }, a.bonus ? /*#__PURE__*/React.createElement("span", null, fnum(a.bonus), " zum Treffen") : null, a.damage ? /*#__PURE__*/React.createElement("span", null, a.damage, a.type ? ' ' + a.type : '') : null, a.range ? /*#__PURE__*/React.createElement("span", null, a.range) : null, a.dc ? /*#__PURE__*/React.createElement("span", null, a.dc) : null)))))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      flex: 1
    },
    onClick: onBearbeiten
  }, "\u270E Bearbeiten"), /*#__PURE__*/React.createElement("button", {
    className: "gegner-loeschen",
    onClick: onLoeschen
  }, "\u2715 L\xF6schen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onSchliessen
  }, "Schlie\xDFen"))));
};

// ── Bearbeiten ───────────────────────────────────────────────────
const GegnerFormular = ({
  form,
  setForm,
  onSpeichern,
  onAbbrechen,
  neu
}) => {
  if (!form) return null;
  const f = form;
  const setzen = patch => setForm({
    ...f,
    ...patch
  });
  const liste = key => f[key] || [];
  const setListe = (key, wert) => setzen({
    [key]: wert
  });
  return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, neu ? '💀 Neuer Gegner' : '✎ Gegner bearbeiten'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid",
    style: {
      maxHeight: '62vh',
      overflowY: 'auto',
      paddingRight: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: f.name,
    autoFocus: true,
    onChange: e => setzen({
      name: e.target.value
    }),
    placeholder: "z.B. Vampir-Spawn"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Art"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: f.type || '',
    onChange: e => setzen({
      type: e.target.value
    }),
    placeholder: "Untoter"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Herausforderung"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    list: "hb-cr-liste",
    value: f.cr || '',
    onChange: e => setzen({
      cr: e.target.value
    }),
    placeholder: "1/4"
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "hb-cr-liste"
  }, CR_ORDNUNG.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Gr\xF6\xDFe"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: f.size || 'Mittel',
    onChange: e => setzen({
      size: e.target.value
    })
  }, ['Winzig', 'Klein', 'Mittel', 'Groß', 'Riesig', 'Gigantisch'].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "R\xFCstungsklasse"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    wert: f.ac,
    onWert: v => setzen({
      ac: v
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Trefferpunkte"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    wert: f.hpMax,
    onWert: v => setzen({
      hpMax: v
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "W\xFCrfel"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: f.hpDice || '',
    onChange: e => setzen({
      hpDice: e.target.value
    }),
    placeholder: "2d8+4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Bewegung (m)"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    wert: f.speed,
    onWert: v => setzen({
      speed: v
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Attribute"), /*#__PURE__*/React.createElement("div", {
    className: "gegner-attr-eingabe"
  }, [['str', 'STR'], ['dex', 'GES'], ['con', 'KON'], ['int', 'INT'], ['wis', 'WEI'], ['cha', 'CHA']].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 1,
    max: 30,
    wert: f[k],
    "aria-label": l,
    onWert: v => setzen({
      [k]: v
    })
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Schlagworte ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      fontStyle: 'italic'
    }
  }, "(kommagetrennt)")), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: (f.tags || []).join(', '),
    onChange: e => setzen({
      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
    }),
    placeholder: "z.B. Strahd, Boss, Untot"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Bild (optional)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, f.image && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: f.image,
    alt: "",
    style: {
      width: 84,
      height: 84,
      objectFit: 'cover',
      borderRadius: 5,
      border: '1px solid var(--border)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setzen({
      image: null
    }),
    "aria-label": "Bild entfernen",
    style: {
      position: 'absolute',
      top: -7,
      right: -7,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: 'var(--crimson)',
      border: 'none',
      color: '#fff',
      fontSize: 10,
      cursor: 'pointer'
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("label", {
    style: {
      flex: 1,
      padding: '11px 14px',
      background: 'var(--bg-card)',
      border: '1px dashed var(--border)',
      borderRadius: 6,
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--text-muted)',
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, "\uD83D\uDCF7 Bild w\xE4hlen", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: e => {
      const d = e.target.files && e.target.files[0];
      e.target.value = '';
      if (d) compressImage(d, 800, daten => {
        if (daten) setzen({
          image: daten
        });
      });
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Merkmale ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      fontStyle: 'italic'
    }
  }, "(eine Zeile je Merkmal)")), /*#__PURE__*/React.createElement("textarea", {
    className: "form-input",
    rows: 3,
    style: {
      resize: 'vertical'
    },
    value: (f.traits || []).join('\n'),
    onChange: e => setzen({
      traits: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
    }),
    placeholder: 'Immunität: Gift\nRegeneration 10/Runde'
  })), GEGNER_LISTEN.map(l => /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full",
    key: l.key
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, l.label), liste(l.key).length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      marginBottom: 6
    }
  }, "Noch nichts eingetragen."), liste(l.key).map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: "gegner-aktion-zeile",
    key: i
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: a.name || '',
    placeholder: "Name",
    "aria-label": "Name",
    onChange: e => setListe(l.key, liste(l.key).map((x, j) => j === i ? {
      ...x,
      name: e.target.value
    } : x))
  }), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    wert: a.bonus || 0,
    title: "Bonus zum Treffen",
    "aria-label": "Bonus",
    onWert: v => setListe(l.key, liste(l.key).map((x, j) => j === i ? {
      ...x,
      bonus: v
    } : x))
  }), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: a.damage || '',
    placeholder: "1d6+2",
    "aria-label": "Schaden",
    onChange: e => setListe(l.key, liste(l.key).map((x, j) => j === i ? {
      ...x,
      damage: e.target.value
    } : x))
  }), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: a.type || '',
    placeholder: "Hieb",
    "aria-label": "Schadensart",
    onChange: e => setListe(l.key, liste(l.key).map((x, j) => j === i ? {
      ...x,
      type: e.target.value
    } : x))
  }), /*#__PURE__*/React.createElement("button", {
    className: "fx-del",
    type: "button",
    title: "Entfernen",
    onClick: () => setListe(l.key, liste(l.key).filter((_, j) => j !== i))
  }, "\u2715"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-add",
    style: {
      width: '100%',
      marginTop: 4
    },
    onClick: () => setListe(l.key, [...liste(l.key), {
      name: '',
      bonus: 0,
      damage: '',
      type: ''
    }])
  }, "+ ", l.label.replace(/e$/, ''), " hinzuf\xFCgen")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: onSpeichern
  }, "\uD83D\uDCBE Speichern"))));
};

// ── Liste im Datenbank-Dialog ────────────────────────────────────
const GegnerListe = ({
  enemies,
  geladen,
  suche,
  setSuche,
  crFilter,
  setCrFilter,
  tagFilter,
  setTagFilter,
  onAnsehen,
  onNeu,
  onImport,
  importBusy
}) => {
  const alleTags = [...new Set(enemies.flatMap(e => e.tags || []))].sort((a, b) => a.localeCompare(b, 'de'));
  const alleCr = [...new Set(enemies.map(e => e.cr).filter(Boolean))].sort((a, b) => crRang(a) - crRang(b));
  const q = (suche || '').trim();
  const gefiltert = enemies.filter(e => {
    if (crFilter && e.cr !== crFilter) return false;
    if (tagFilter && !(e.tags || []).includes(tagFilter)) return false;
    if (!q) return true;
    return containsFold(e.name || '', q) || containsFold(e.type || '', q) || containsFold((e.tags || []).join(' '), q) || containsFold((e.traits || []).join(' '), q);
  }).sort((a, b) => crRang(a.cr) - crRang(b.cr) || (a.name || '').localeCompare(b.name || '', 'de'));
  return /*#__PURE__*/React.createElement("div", {
    className: "gegner-liste-huelle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-werkzeuge"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input gegner-suche",
    type: "search",
    value: suche || '',
    placeholder: enemies.length + ' Gegner durchsuchen…',
    "aria-label": "Gegner durchsuchen",
    onChange: e => setSuche(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "tpl-filter-select",
    value: crFilter || '',
    onChange: e => setCrFilter(e.target.value),
    "aria-label": "Herausforderungsgrad"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Alle Grade"), alleCr.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, "HG ", c))), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: onNeu
  }, "+ Neu")), alleTags.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "tag-filter-bar"
  }, alleTags.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: "tag-filter-btn" + (tagFilter === t ? " active" : ""),
    onClick: () => setTagFilter(tagFilter === t ? '' : t)
  }, t))), enemies.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "gegner-leer"
  }, /*#__PURE__*/React.createElement("p", null, geladen ? 'Noch keine Gegner. Lies unten eine Sammlung aus einer JSON-Datei ein — etwa die aus dem alten Kampftracker.' : 'Die Gegner konnten nicht geladen werden. Verlasse den DM-Modus und betritt ihn erneut.')) : gefiltert.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "gegner-leer"
  }, /*#__PURE__*/React.createElement("p", null, "Kein Gegner gefunden.")) : /*#__PURE__*/React.createElement("div", {
    className: "gegner-reihen"
  }, gefiltert.map(e => /*#__PURE__*/React.createElement("button", {
    className: "gegner-reihe",
    key: e.id,
    onClick: () => onAnsehen(e)
  }, /*#__PURE__*/React.createElement("span", {
    className: "gegner-reihe-bild"
  }, e.image ? /*#__PURE__*/React.createElement("img", {
    src: e.image,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC80")), /*#__PURE__*/React.createElement("span", {
    className: "gegner-reihe-text"
  }, /*#__PURE__*/React.createElement("b", null, e.name), /*#__PURE__*/React.createElement("i", null, e.size, " \xB7 ", e.type)), /*#__PURE__*/React.createElement("span", {
    className: "gegner-reihe-werte"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gegner-hg"
  }, "HG ", e.cr), "RK ", e.ac, " \xB7 ", e.hpMax, " TP")))), /*#__PURE__*/React.createElement("div", {
    className: "gegner-fuss"
  }, /*#__PURE__*/React.createElement("label", {
    className: "gegner-import" + (importBusy ? " busy" : "")
  }, importBusy ? '⏳ Wird eingelesen…' : '⇪ Sammlung einlesen (JSON)', /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "application/json,.json",
    style: {
      display: 'none'
    },
    disabled: importBusy,
    onChange: e => {
      const d = e.target.files && e.target.files[0];
      e.target.value = '';
      if (d) onImport(d);
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "gegner-fuss-zahl"
  }, gefiltert.length === enemies.length ? enemies.length + ' Gegner' : gefiltert.length + ' von ' + enemies.length)));
};

// ── Begegnungen ──────────────────────────────────────────────────
// Eine Begegnung ist eine Liste aus Gegnern mit Anzahl. Sie gehoert zu
// einem Abenteuer, damit die Krypten von Strahd nicht in der naechsten
// Kampagne auftauchen.
const SCHWIERIGKEITEN = ['Leicht', 'Mittel', 'Schwer', 'Tödlich'];
const newEncounter = advId => ({
  id: 'enc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  name: '',
  difficulty: 'Mittel',
  description: '',
  enemies: [],
  adventure: advId || ''
});
const BegegnungFormular = ({
  form,
  setForm,
  enemies,
  abenteuer,
  onSpeichern,
  onAbbrechen,
  neu
}) => {
  const [suche, setSuche] = useState('');
  if (!form) return null;
  const f = form;
  const setzen = patch => setForm({
    ...f,
    ...patch
  });
  const teile = f.enemies || [];
  const q = suche.trim();
  const treffer = !q ? [] : enemies.filter(e => containsFold(e.name || '', q) || containsFold((e.tags || []).join(' '), q)).sort((a, b) => crRang(a.cr) - crRang(b.cr) || (a.name || '').localeCompare(b.name || '', 'de')).slice(0, 12);
  const hinzu = e => {
    const drin = teile.find(t => t.enemyId === e.id);
    setzen({
      enemies: drin ? teile.map(t => t.enemyId === e.id ? {
        ...t,
        count: (t.count || 1) + 1
      } : t) : [...teile, {
        enemyId: e.id,
        count: 1,
        name: e.name
      }]
    });
    setSuche('');
  };
  return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 540
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, neu ? '⚔ Neue Begegnung' : '✎ Begegnung bearbeiten'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid",
    style: {
      maxHeight: '62vh',
      overflowY: 'auto',
      paddingRight: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: f.name,
    autoFocus: true,
    onChange: e => setzen({
      name: e.target.value
    }),
    placeholder: "z.B. Vampirhorst"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Schwierigkeit"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: f.difficulty || 'Mittel',
    onChange: e => setzen({
      difficulty: e.target.value
    })
  }, SCHWIERIGKEITEN.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Abenteuer"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: f.adventure || '',
    onChange: e => setzen({
      adventure: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 alle \u2014"), (abenteuer || []).map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Beschreibung"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-input",
    rows: 2,
    style: {
      resize: 'vertical'
    },
    value: f.description || '',
    onChange: e => setzen({
      description: e.target.value
    }),
    placeholder: "Ein verlassenes Herrenhaus \u2014 bewohnt von blutdurstigen Vampir-Spawns."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Gegner"), teile.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      marginBottom: 6
    }
  }, "Noch keiner. Suche unten nach einem Gegner, um ihn aufzunehmen."), teile.map((t, i) => {
    const g = enemies.find(e => e.id === t.enemyId);
    return /*#__PURE__*/React.createElement("div", {
      className: "beg-teil",
      key: t.enemyId + i
    }, /*#__PURE__*/React.createElement("span", {
      className: "beg-teil-name"
    }, t.name || g && g.name || 'Unbekannt', g ? /*#__PURE__*/React.createElement("i", null, " HG ", g.cr, " \xB7 RK ", g.ac, " \xB7 ", g.hpMax, " TP") : /*#__PURE__*/React.createElement("i", {
      className: "beg-fehlt"
    }, "nicht mehr in der Sammlung")), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input beg-teil-zahl",
      min: 1,
      max: 99,
      wert: t.count || 1,
      "aria-label": 'Anzahl ' + (t.name || ''),
      onWert: v => setzen({
        enemies: teile.map((x, j) => j === i ? {
          ...x,
          count: v
        } : x)
      })
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fx-del",
      title: "Entfernen",
      onClick: () => setzen({
        enemies: teile.filter((_, j) => j !== i)
      })
    }, "\u2715"));
  }), /*#__PURE__*/React.createElement("div", {
    className: "beg-suche-huelle"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: suche,
    onChange: e => setSuche(e.target.value),
    placeholder: "Gegner suchen und hinzuf\xFCgen\u2026",
    "aria-label": "Gegner suchen"
  }), treffer.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "beg-treffer"
  }, treffer.map(e => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: e.id,
    className: "beg-treffer-zeile",
    onClick: () => hinzu(e)
  }, /*#__PURE__*/React.createElement("b", null, e.name), /*#__PURE__*/React.createElement("i", null, "HG ", e.cr, " \xB7 ", e.type)))), q && treffer.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      marginTop: 5
    }
  }, "Kein Gegner gefunden.")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: onSpeichern
  }, "\uD83D\uDCBE Speichern"))));
};
const BegegnungListe = ({
  encounters,
  enemies,
  abenteuer,
  advId,
  nurAktives,
  setNurAktives,
  onBearbeiten,
  onLoeschen,
  onNeu
}) => {
  const sichtbar = encounters.filter(e => !nurAktives || !e.adventure || e.adventure === advId).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
  const advName = id => (abenteuer.find(a => a.id === id) || {}).name;
  return /*#__PURE__*/React.createElement("div", {
    className: "gegner-liste-huelle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gegner-werkzeuge"
  }, /*#__PURE__*/React.createElement("label", {
    className: "beg-filter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: nurAktives,
    onChange: e => setNurAktives(e.target.checked)
  }), "Nur das offene Abenteuer"), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: onNeu
  }, "+ Neu")), sichtbar.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "gegner-leer"
  }, /*#__PURE__*/React.createElement("p", null, encounters.length === 0 ? 'Noch keine Begegnung. Stelle eine aus deinen Gegnern zusammen.' : 'Keine Begegnung in diesem Abenteuer.')) : /*#__PURE__*/React.createElement("div", {
    className: "gegner-reihen"
  }, sichtbar.map(e => {
    const anzahl = (e.enemies || []).reduce((s, t) => s + (+t.count || 1), 0);
    const fehlend = (e.enemies || []).filter(t => !enemies.some(g => g.id === t.enemyId)).length;
    return /*#__PURE__*/React.createElement("div", {
      className: "beg-reihe",
      key: e.id
    }, /*#__PURE__*/React.createElement("button", {
      className: "beg-reihe-haupt",
      onClick: () => onBearbeiten(e)
    }, /*#__PURE__*/React.createElement("span", {
      className: "beg-reihe-text"
    }, /*#__PURE__*/React.createElement("b", null, e.name || '(ohne Namen)'), /*#__PURE__*/React.createElement("i", null, e.difficulty, ' · ', anzahl, " Gegner", e.adventure && advName(e.adventure) ? ' · ' + advName(e.adventure) : '', fehlend ? ' · ' + fehlend + ' fehlt' : ''))), /*#__PURE__*/React.createElement("button", {
      className: "beg-reihe-del",
      onClick: () => onLoeschen(e),
      "aria-label": 'Begegnung ' + e.name + ' löschen'
    }, "\u2715"));
  })));
};

// ==== js/src/2c-kampf.jsx ====
// Heldenbuch — der Kampf.
//
// Die Initiativliste aus Gegnern einer Begegnung und den Helden des
// offenen Abenteuers. Anders als im alten Kampftracker uebersteht sie ein
// Neuladen: der Stand liegt im Geraet, nicht nur im Arbeitsspeicher.
//
// Aufbau und Bedienung folgen dem alten Tracker, weil er sich am Tisch
// bewaehrt hat: Helden und Gegnersammlung links, Initiativkarten rechts,
// je Karte ein Notizfeld und ein Tastenblock mit den kleinen Schritten
// direkt und den grossen im Fenster.
//
// Der wichtige Unterschied zum alten: die Trefferpunkte der Helden liegen
// nicht im Kampf, sondern im Bogen. Was hier eingetragen wird, steht dort
// sofort — es gibt kein Uebertragen am Ende und damit auch keinen Kampf,
// der mit einem Klick daneben verlorengeht.

const w20 = () => Math.floor(Math.random() * 20) + 1;

// "11d8+33" auswuerfeln. Ohne brauchbare Angabe bleibt es beim Mittelwert
// aus der Vorlage — besser eine Zahl als keine.
const wuerfelTP = vorlage => {
  const m = String(vorlage.hpDice || '').match(/(\d+)\s*[dw]\s*(\d+)\s*(?:\+\s*(\d+))?/i);
  if (!m) return +vorlage.hpMax || 1;
  const [, anzahl, seiten, bonus] = m.map(Number);
  let summe = bonus || 0;
  for (let i = 0; i < anzahl; i++) summe += Math.floor(Math.random() * seiten) + 1;
  return Math.max(1, summe);
};

// Ein Gegner aus seiner Vorlage. Steht hier einzeln, weil ihn auch die
// Gegnerliste in der Seitenspalte braucht — dort kommt einer nach dem
// anderen dazu, mitten im laufenden Kampf.
const gegnerAusVorlage = (vorlage, name) => {
  const tp = wuerfelTP(vorlage);
  return {
    id: vorlage.id + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    art: 'gegner',
    vorlageId: vorlage.id,
    name: name || vorlage.name,
    ac: +vorlage.ac || 10,
    hpMax: tp,
    hp: tp,
    tempHp: 0,
    ini: w20() + mod(+vorlage.dex || 10),
    dex: +vorlage.dex || 10,
    zustaende: [],
    erschoepfung: 0,
    notiz: '',
    bild: vorlage.image || null
  };
};

// Ein Nothelfer: der Waechter, der im Abenteuerbuch mit einem Satz
// abgehandelt ist, oder der Wolf, den sich jemand gerade ausgedacht hat.
// Drei Angaben genuegen — alles Weitere steht im Kopf der Spielleitung
// und braucht keinen Eintrag in der Sammlung.
const nothelferAnlegen = (name, tp, ac) => {
  const hp = Math.max(1, Math.round(+tp || 1));
  return {
    id: 'not-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    art: 'gegner',
    vorlageId: null,
    nothelfer: true,
    name: (name || '').trim() || 'Gegner',
    ac: Math.max(1, Math.round(+ac || 10)),
    hpMax: hp,
    hp,
    tempHp: 0,
    ini: w20(),
    dex: 10,
    zustaende: [],
    erschoepfung: 0,
    notiz: '',
    bild: null
  };
};

// Die Gegner einer Begegnung, ausgewuerfelt und durchnummeriert. Steht
// einzeln, weil eine Begegnung auch in einen schon laufenden Kampf
// nachgeladen werden kann.
const gegnerAusBegegnung = (begegnung, enemies) => {
  const teilnehmer = [];
  (begegnung && begegnung.enemies || []).forEach(({
    enemyId,
    count,
    name
  }) => {
    const vorlage = enemies.find(e => e.id === enemyId);
    if (!vorlage) return; // geloescht — still ueberspringen
    const anzahl = Math.max(1, +count || 1);
    for (let i = 0; i < anzahl; i++) {
      teilnehmer.push(gegnerAusVorlage(vorlage, anzahl > 1 ? (name || vorlage.name) + ' ' + (i + 1) : name || vorlage.name));
    }
  });
  return teilnehmer;
};

// ── Kampf aufstellen ─────────────────────────────────────────────
// Aufgestellt wird zuerst nur: die Helden stehen da, Gegner kommen dazu,
// Initiativen werden angesagt. Das ist die Vorbereitung — die Runde
// laeuft noch nicht, und das Protokoll bleibt leer, bis jemand "Kampf
// starten" drueckt. Vorher ist noch nichts geschehen, was der Rede wert
// waere, und ein Kampf, der schon in Runde 1 steht, waehrend die Gruppe
// noch ueberlegt, macht die Runden falsch.
const kampfAufstellen = (begegnung, enemies, helden, setDefs) => {
  const teilnehmer = gegnerAusBegegnung(begegnung, enemies);

  // Vom Helden bleibt im Kampf nur, was zum Kampf gehoert: Initiative,
  // Zustaende, Erschoepfung. Trefferpunkte und Notiz stehen ausserhalb —
  // die einen im Bogen, die andere in der DM-Bibliothek.
  helden.forEach(h => {
    teilnehmer.push({
      id: 'held-' + h.id,
      art: 'held',
      charId: h.id,
      // Die Initiative der Helden wuerfeln die Spieler selbst — hier bleibt
      // das Feld leer, bis jemand die Zahl ansagt.
      ini: null,
      zustaende: [],
      erschoepfung: 0,
      vorteil: false,
      nachteil: false
    });
  });
  return {
    aktiv: true,
    phase: 'vorbereitung',
    name: begegnung.name || 'Kampf',
    runde: 1,
    zug: 0,
    teilnehmer: sortiereNachIni(teilnehmer),
    log: []
  };
};

// Ein Kampf aus einer aelteren Fassung kennt keine Phase. Der lief, als
// er gespeichert wurde, und wird nicht nachtraeglich in die Vorbereitung
// zurueckgeschoben — mitten im Kampf neu zu laden ist genau der Fall,
// fuer den der Stand ueberhaupt im Geraet liegt.
const inVorbereitung = k => !!k && k.phase === 'vorbereitung';

// Ohne Initiative ganz nach unten: solange die Spieler ihre Zahl nicht
// angesagt haben, steht die Reihenfolge noch nicht fest.
const sortiereNachIni = liste => [...liste].sort((a, b) => {
  const av = a.ini === null ? -999 : a.ini,
    bv = b.ini === null ? -999 : b.ini;
  return bv - av || mod(b.dex || 10) - mod(a.dex || 10) || (a.name || '').localeCompare(b.name || '', 'de');
});

// ── Das Protokoll ────────────────────────────────────────────────
// Es liegt im Kampf selbst und endet mit ihm — wie die Initiative. Kein
// Server, keine Tabelle: was hier steht, ist die Mitschrift dieses einen
// Abends und gehoert niemand anderem.
//
// Gespeichert wird, was passiert ist, nicht der fertige Satz. Erst beim
// Anzeigen wird daraus Text — und nur so laesst sich derselbe Verlauf
// einmal mit und einmal ohne Trefferpunktstaende ausgeben.
//
// Was die Anwendung nicht weiss, steht auch nicht drin: wer den Schaden
// ausgeteilt hat. Sie kennt nur, wer ihn bekommt und wer gerade am Zug
// ist. Die Verbindung stellt der Leser her, so wie am Tisch auch.
const AKTION_WORT = {
  zauber: 'Zauber',
  angriff: 'Angriff',
  gegenstand: 'Gegenstand',
  merkmal: 'Merkmal'
};
const protokollZeile = (e, mitZahlen) => {
  const stand = mitZahlen && e.von !== undefined && e.auf !== undefined ? ' · ' + e.von + ' → ' + e.auf : '';
  switch (e.art) {
    case 'start':
      return '⚔ ' + e.wer + ' beginnt';
    case 'runde':
      return '';
    // wird als Ueberschrift gesetzt
    case 'zug':
      return '▸ ' + e.wer + ' ist am Zug';
    // Die drei aus dem Zugfenster. Sie stehen zwischen dem Zug und seinen
    // Folgen: erst was jemand tut, dann was daraus wird.
    case 'frei':
      return '   „' + e.text + '“';
    case 'aktion':
      return '   ' + (AKTION_WORT[e.modus] || 'Angriff') + ': ' + e.was + (e.grad ? ' · ' + e.grad + '. Grad' : '') + (e.wurf ? ' (' + e.wurf + ')' : '');
    case 'rettung':
      return '   ' + (e.was ? e.was + ' → ' : '') + e.ziel + ': Rettungswurf ' + (e.rw ? e.rw + ' ' : '') + (e.bestanden ? 'bestanden' : 'misslungen') + (e.wurf !== '' && e.wurf != null && e.sg ? ' (' + e.wurf + ' gegen SG ' + e.sg + ')' : '');
    case 'platz':
      return '   Zauberplatz ' + e.grad + '. Grad abgehakt';
    // Ein Trank ist nach dem Zug leer. Was noch da ist, steht dabei —
    // sonst muesste man dafuer in den Bogen schauen.
    case 'verbrauch':
      return '   ' + e.was + ' verbraucht' + (e.rest === undefined || e.rest === null ? '' : ' · noch ' + e.rest);
    case 'wurf':
      return '   ' + (e.was ? e.was + ' → ' : '') + e.ziel + ': ' + (e.treffer ? 'Treffer' : 'daneben') + (e.wurf !== '' && e.wurf != null ? ' (' + e.wurf + ' gegen RK ' + e.ac + ')' : '');
    case 'schaden':
      return '   ' + e.wer + ' nimmt ' + e.wert + ' Schaden' + (e.teile && e.teile.length > 1 ? ' (' + e.teile.map(x => x.wert + (x.art ? ' ' + x.art : '')).join(' + ') + ')' : '') + stand + (e.minderung === 'res' ? ' — Resistenz' : '');
    case 'immun':
      return '   ' + e.wer + ' ist immun' + (e.was ? ' gegen ' + e.was : '');
    case 'heilung':
      return '   ' + e.wer + ' wird um ' + e.wert + ' geheilt' + stand;
    case 'temp':
      return '   ' + e.wer + ': ' + (e.wert >= 0 ? '+' : '') + e.wert + ' temporäre Trefferpunkte';
    case 'maxtemp':
      return '   ' + e.wer + ': ' + (e.wert >= 0 ? '+' : '') + e.wert + ' temporäres Maximum';
    case 'maxhp':
      return '   ' + e.wer + ': Maximum ' + (e.wert >= 0 ? '+' : '') + e.wert;
    case 'nieder':
      return '   ' + e.wer + ' ist kampfunfähig';
    case 'auf':
      return '   ' + e.wer + ' ist wieder auf den Beinen' + (mitZahlen ? ' · ' + e.auf : '');
    case 'zustand':
      return '   ' + e.wer + (e.an ? ' ist ' : ' ist nicht mehr ') + e.was;
    case 'marke':
      return '   ' + e.wer + (e.an ? ' hat ' + e.was : ' hat keinen ' + e.was + ' mehr');
    case 'ersch':
      return '   ' + e.wer + ': Erschöpfung ' + e.wert;
    case 'todes':
      return '   ' + e.wer + ': Todesrettungswürfe ' + e.erfolge + '✓ ' + e.fehler + '✗' + (e.lage === 'stabil' ? ' — stabilisiert' : e.lage === 'tot' ? ' — tot' : '');
    case 'dazu':
      return '   + ' + e.wer + (mitZahlen && e.hp !== undefined ? ' (' + e.hp + ' TP, RK ' + e.ac + ')' : '');
    case 'weg':
      return '   − ' + e.wer + ' verlässt den Kampf';
    default:
      return '   ' + (e.wer || '');
  }
};

// Der ganze Verlauf als Text, wie er in die Zwischenablage geht.
const protokollText = (kampf, mitZahlen, zeit) => {
  const zeilen = [];
  zeilen.push('⚔ ' + (kampf.name || 'Kampf'));
  zeilen.push(new Date(zeit || Date.now()).toLocaleString('de-DE'));
  zeilen.push('');
  let runde = null;
  (kampf.log || []).forEach(e => {
    if (e.r !== runde) {
      runde = e.r;
      if (zeilen.length > 3) zeilen.push('');
      zeilen.push('── Runde ' + runde + ' ──────────────────────');
    }
    const z = protokollZeile(e, mitZahlen);
    if (z) zeilen.push(z);
  });
  if ((kampf.log || []).length === 0) zeilen.push('(noch nichts geschehen)');
  return zeilen.join('\n');
};

// Derselbe Verlauf auf dem Schirm. Steht einzeln, weil ihn zwei
// Stellen zeichnen: der laufende Kampf und jeder alte aus dem Archiv.
const ProtokollZeilen = ({
  log,
  mitZahlen
}) => {
  const zeilen = [];
  let runde = null;
  (log || []).forEach((e, i) => {
    if (e.r !== runde) {
      runde = e.r;
      zeilen.push( /*#__PURE__*/React.createElement("div", {
        className: "pr-runde",
        key: 'r' + i
      }, "\u2500\u2500 Runde ", runde, " \u2500\u2500"));
    }
    const z = protokollZeile(e, mitZahlen);
    if (z) zeilen.push( /*#__PURE__*/React.createElement("div", {
      className: 'pr-zeile' + (e.art === 'zug' ? ' zug' : '') + (e.art === 'nieder' || e.art === 'todes' && e.lage === 'tot' ? ' schwer' : ''),
      key: i
    }, z));
  });
  return zeilen;
};

// In die Zwischenablage. Wo die neue Schnittstelle fehlt — altes
// Android, unsichere Verbindung —, hilft der Umweg ueber ein Feld, das
// kurz da ist und gleich wieder verschwindet.
const inZwischenablage = async text => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const f = document.createElement('textarea');
      f.value = text;
      f.style.position = 'fixed';
      f.style.opacity = '0';
      document.body.appendChild(f);
      f.select();
      document.execCommand('copy');
      document.body.removeChild(f);
      return true;
    } catch {
      return false;
    }
  }
};

// ── Das Gesamtprotokoll ──────────────────────────────────────────
// Jeder beendete Kampf wandert hierher: Name, Zeit, Verlauf. Es liegt
// wie der laufende Kampf im Geraet der Spielleitung — es ist ihre
// Mitschrift, nicht Teil der Boegen, und hat auf dem Server nichts
// verloren. Der aelteste faellt heraus, wenn es zu viele werden; sechzig
// Kaempfe sind ein gutes halbes Jahr Spielabende.
const ARCHIV_SCHLUESSEL = 'hb_kampf_archiv';
const ARCHIV_MAX = 60;
const archivLesen = () => {
  try {
    const a = JSON.parse(localStorage.getItem(ARCHIV_SCHLUESSEL) || '[]');
    // Der juengste zuerst — auch wenn zwischendurch die Uhr des Geraets
    // verstellt wurde und die Reihenfolge im Speicher nicht mehr stimmt.
    return Array.isArray(a) ? [...a].sort((x, y) => (y.zeit || 0) - (x.zeit || 0)) : [];
  } catch {
    return [];
  }
};
const archivLegen = eintrag => {
  const liste = [eintrag, ...archivLesen()].slice(0, ARCHIV_MAX);
  try {
    localStorage.setItem(ARCHIV_SCHLUESSEL, JSON.stringify(liste));
  } catch {}
  return liste;
};

// Der Tag als Schluessel, in der Zeit des Geraets: ein Kampf um halb eins
// nachts gehoert zu dem Abend, an dem er stattfand, nicht zum Datum in
// London.
const tagVon = zeit => {
  const d = new Date(zeit);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const tagName = tag => {
  if (tag === tagVon(Date.now())) return 'Heute';
  if (tag === tagVon(Date.now() - 86400000)) return 'Gestern';
  const [j, m, t] = tag.split('-').map(Number);
  return new Date(j, m - 1, t).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
};
const uhrzeitVon = zeit => new Date(zeit).toLocaleTimeString('de-DE', {
  hour: '2-digit',
  minute: '2-digit'
});
const KampfArchiv = ({
  mitZahlen
}) => {
  const [liste] = React.useState(archivLesen);
  const tage = [...new Set(liste.map(e => tagVon(e.zeit)))];
  const [tag, setTag] = React.useState(tage[0] || '');
  const [offen, setOffen] = React.useState(liste.length ? liste[0].id : null);
  const [kopiert, setKopiert] = React.useState(null);
  if (!liste.length) return /*#__PURE__*/React.createElement("div", {
    className: "kampf-protokoll-text"
  }, /*#__PURE__*/React.createElement("i", null, "Noch kein beendeter Kampf. Was du beendest, findest du hier wieder."));
  const desTages = liste.filter(e => tagVon(e.zeit) === tag);
  const kopieren = async e => {
    if (!(await inZwischenablage(protokollText(e, mitZahlen, e.zeit)))) return;
    setKopiert(e.id);
    setTimeout(() => setKopiert(null), 2000);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "kampf-archiv"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-archiv-tage"
  }, tage.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    type: "button",
    className: 'kampf-archiv-tag' + (t === tag ? ' an' : ''),
    onClick: () => {
      setTag(t);
      setOffen(null);
    }
  }, tagName(t), /*#__PURE__*/React.createElement("i", null, liste.filter(e => tagVon(e.zeit) === t).length)))), /*#__PURE__*/React.createElement("div", {
    className: "kampf-archiv-liste"
  }, desTages.map(e => /*#__PURE__*/React.createElement("div", {
    className: "kampf-archiv-kampf",
    key: e.id
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kampf-archiv-kopf",
    onClick: () => setOffen(o => o === e.id ? null : e.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "ka-pfeil"
  }, offen === e.id ? '▾' : '▸'), /*#__PURE__*/React.createElement("span", {
    className: "ka-zeit"
  }, uhrzeitVon(e.zeit)), /*#__PURE__*/React.createElement("b", {
    className: "ka-name"
  }, e.name), /*#__PURE__*/React.createElement("i", {
    className: "ka-info"
  }, e.runden, " ", e.runden === 1 ? 'Runde' : 'Runden', " \xB7 ", (e.log || []).length, " Eintr\xE4ge", e.abenteuer ? ' · ' + e.abenteuer : '')), offen === e.id && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "kampf-protokoll-text"
  }, /*#__PURE__*/React.createElement(ProtokollZeilen, {
    log: e.log,
    mitZahlen: mitZahlen
  })), /*#__PURE__*/React.createElement("div", {
    className: "kampf-archiv-fuss"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: () => kopieren(e)
  }, kopiert === e.id ? '✓ Kopiert' : '📋 Kopieren')))))));
};

// ── Todesrettungswuerfe ──────────────────────────────────────────
// Bei 0 Trefferpunkten wird gewuerfelt: drei Erfolge stabilisieren, drei
// Fehlschlaege toeten. Die Punkte stehen im Bogen, nicht im Kampf — wer
// draussen vor der Tuer verblutet, tut das auch nach einem Neuladen.
const TODES_LEER = {
  erfolge: 0,
  fehler: 0
};
const todesStand = d => {
  const s = d || TODES_LEER;
  if ((s.erfolge || 0) >= 3) return 'stabil';
  if ((s.fehler || 0) >= 3) return 'tot';
  return 'offen';
};
const TodesWuerfe = ({
  stand,
  onSetzen
}) => {
  const s = stand || TODES_LEER;
  const lage = todesStand(s);
  const Reihe = ({
    feld,
    wert,
    label,
    klasse
  }) => /*#__PURE__*/React.createElement("div", {
    className: "td-reihe"
  }, /*#__PURE__*/React.createElement("span", {
    className: "td-label"
  }, label), [1, 2, 3].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    className: 'td-pip ' + klasse + (wert >= i ? ' an' : ''),
    "aria-label": label + ' ' + i,
    "aria-pressed": wert >= i,
    onClick: () => onSetzen({
      ...s,
      [feld]: wert === i ? i - 1 : i
    })
  }, wert >= i ? klasse === 'gut' ? '✓' : '✕' : '○')));
  return /*#__PURE__*/React.createElement("div", {
    className: 'kampf-todes' + (lage !== 'offen' ? ' ' + lage : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "td-titel"
  }, lage === 'stabil' ? '☘ Stabilisiert' : lage === 'tot' ? '☠ Tot' : '☠ Todesrettungswürfe'), /*#__PURE__*/React.createElement(Reihe, {
    feld: "erfolge",
    wert: s.erfolge || 0,
    label: "Erfolg",
    klasse: "gut"
  }), /*#__PURE__*/React.createElement(Reihe, {
    feld: "fehler",
    wert: s.fehler || 0,
    label: "Fehler",
    klasse: "schlecht"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "td-reset",
    onClick: () => onSetzen({
      erfolge: 0,
      fehler: 0
    })
  }, "\u21BA Zur\xFCcksetzen"));
};

// ── Zahlenfenster ────────────────────────────────────────────────
// Die kleinen Schritte liegen auf der Karte, alles Groessere hier: sechs
// Sprungtasten in beide Richtungen und ein Feld fuer die krumme Zahl.
// Zwei Richtungen auch beim Schaden — man vertippt sich, und dann will man
// zurueck, ohne den Kopf zu verdrehen.
const WERT_MODI = {
  schaden: {
    titel: 'Schaden',
    vorzeichen: -1,
    farbe: 'dmg',
    beides: true
  },
  heilung: {
    titel: 'Heilung',
    vorzeichen: +1,
    farbe: 'heal',
    beides: true
  },
  temp: {
    titel: 'Temp HP',
    vorzeichen: +1,
    farbe: 'temp',
    beides: false
  },
  maxtemp: {
    titel: 'Temp. max. TP',
    vorzeichen: +1,
    farbe: 'max',
    beides: false
  },
  maxhp: {
    titel: 'Max. TP',
    vorzeichen: +1,
    farbe: 'max',
    beides: false
  }
};
const SPRUENGE = [1, 2, 5, 10, 20, 50];
const WertDialog = ({
  modus,
  name,
  start,
  onAnwenden,
  onAbbrechen
}) => {
  const cfg = WERT_MODI[modus] || WERT_MODI.schaden;
  const [wert, setWert] = React.useState(+start || 0);
  const stufe = n => setWert(w => w + n);
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onAbbrechen
  }, /*#__PURE__*/React.createElement("div", {
    className: 'wert-fenster ' + cfg.farbe,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "wert-titel"
  }, cfg.titel, " \u2014 ", name), /*#__PURE__*/React.createElement("div", {
    className: "wert-strich"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wert-label"
  }, cfg.titel, " ", cfg.vorzeichen < 0 ? '−' : '+'), /*#__PURE__*/React.createElement("div", {
    className: "wert-reihe"
  }, SPRUENGE.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: 'wert-sprung ' + (cfg.vorzeichen < 0 ? 'minus' : 'plus'),
    onClick: () => stufe(n)
  }, (cfg.vorzeichen < 0 ? '−' : '+') + n))), cfg.beides && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "wert-label mitte"
  }, cfg.vorzeichen < 0 ? '+' : '−'), /*#__PURE__*/React.createElement("div", {
    className: "wert-reihe"
  }, SPRUENGE.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: 'wert-sprung ' + (cfg.vorzeichen < 0 ? 'plus' : 'minus'),
    onClick: () => stufe(-n)
  }, (cfg.vorzeichen < 0 ? '+' : '−') + n)))), /*#__PURE__*/React.createElement("div", {
    className: "wert-stepper"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => stufe(-1),
    "aria-label": "Eins weniger"
  }, "\u2212"), /*#__PURE__*/React.createElement(ZahlFeld, {
    wert: wert || '',
    sofort: true,
    "aria-label": cfg.titel,
    leerWert: 0,
    onWert: setWert,
    onKeyDown: e => {
      if (e.key !== 'Enter') return;
      const n = Number(e.currentTarget.value);
      if (n) onAnwenden(Math.abs(n) * (n < 0 ? -1 : 1));
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => stufe(1),
    "aria-label": "Eins mehr"
  }, "+"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "wert-reset",
    onClick: () => setWert(0),
    "aria-label": "Zur\xFCcksetzen"
  }, "\u21BA")), /*#__PURE__*/React.createElement("div", {
    className: "wert-aktionen"
  }, /*#__PURE__*/React.createElement("button", {
    className: "wert-ok",
    disabled: !wert,
    onClick: () => onAnwenden(wert)
  }, "Anwenden"), /*#__PURE__*/React.createElement("button", {
    className: "wert-ab",
    onClick: onAbbrechen
  }, "Abbrechen"))));
};

// ── Was jemand tut und womit ─────────────────────────────────────
// Dieselbe Auswahl brauchen zwei Fenster: das der Spielleitung, die
// gleich die Wirkung eintraegt, und das des Spielers, der nur ansagt.
// Sie steht deshalb einmal hier und nicht zweimal.
//
// Sie liest ausschliesslich aus dem Bogen dessen, der handelt — seine
// Waffen, seine Zauber, seine Zauberplaetze. Da gibt es nichts zu
// verbergen: das ist sein Zeug. Ueber Wirkung entscheidet sie nichts.
const sortierteSprueche = held => [...(held && held.spells || [])].sort((a, b) => (a.level || 0) - (b.level || 0) || (a.name || '').localeCompare(b.name || '', 'de'));

// Was im Inventar als „im Kampf zu verwenden“ gekennzeichnet ist und
// wovon noch etwas da ist — Traenke, Schriftrollen, Öle. Ein Gegenstand
// bei null steht nicht mehr zur Wahl; er bleibt aber im Bogen, denn
// nachgefuellt wird ausserhalb des Kampfes.
const kampfGegenstaende = held => (held && held.inventory || []).filter(i => i && i.kampf && (+i.qty || 0) > 0).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));

// Merkmale werden nicht gekennzeichnet: welches im Kampf taugt, weiss der
// Spieler besser als der Bogen. Sortiert wie im Charakterbogen, und ab
// sechs Eintraegen steht ohnehin ein Suchfeld darueber.
const kampfMerkmale = held => [...(held && held.features || [])].sort((a, b) => (a.source || '').localeCompare(b.source || '', 'de') || (a.name || '').localeCompare(b.name || '', 'de'));
const aktionsQuelle = (held, art) => art === 'zauber' ? sortierteSprueche(held) : art === 'angriff' ? held && held.weapons || [] : art === 'gegenstand' ? kampfGegenstaende(held) : art === 'merkmal' ? kampfMerkmale(held) : [];

// Was jede Art in der Auswahl von sich zeigt. Steht beisammen, damit die
// Liste nicht aus vier verschachtelten Fragezeichen besteht.
const ART_ANSICHT = {
  angriff: {
    sym: '⚔',
    label: 'Womit — aus dem Bogen',
    suche: 'Waffe suchen',
    leer: 'Keine Waffen im Bogen.'
  },
  zauber: {
    sym: '✨',
    label: 'Welcher Zauber — aus dem Zauberbuch',
    suche: 'Zauber suchen',
    leer: 'Keine Zauber im Bogen.'
  },
  gegenstand: {
    sym: '🧪',
    label: 'Was — aus dem Inventar',
    suche: 'Gegenstand suchen',
    leer: 'Nichts im Inventar ist für den Kampf gekennzeichnet.'
  },
  merkmal: {
    sym: '⭐',
    label: 'Welches Merkmal',
    suche: 'Merkmal suchen',
    leer: 'Keine Merkmale im Bogen.'
  }
};

// Aus der Wahl {art, i, grad} alles ableiten, was beide Fenster
// brauchen. Steht hier, damit die Ableitung nicht in jedem Fenster
// wieder anders aussieht.
const aktionsStand = (held, wahl) => {
  const quelle = aktionsQuelle(held, wahl.art);
  const gegenstand = wahl.i === null || wahl.i === undefined ? null : quelle[wahl.i] || null;
  const grundGrad = gegenstand ? +gegenstand.level || 0 : 0;
  const wirkung = wahl.art === 'zauber' && gegenstand && hatWirkung(gegenstand.wirkung) ? gegenstand.wirkung : null;
  const grad = wahl.grad || grundGrad;
  return {
    quelle,
    gegenstand,
    grundGrad,
    wirkung,
    grad,
    wurf: wirkung ? wuerfelAufGrad(wirkung, grundGrad, grad) : ''
  };
};
const AktionsWahl = ({
  held,
  wahl,
  setWahl,
  wer
}) => {
  const waffen = held && held.weapons || [];
  const sprueche = sortierteSprueche(held);
  const sachen = kampfGegenstaende(held);
  const merkmale = kampfMerkmale(held);
  const ansicht = ART_ANSICHT[wahl.art] || ART_ANSICHT.angriff;
  const {
    quelle,
    gegenstand,
    grundGrad,
    wirkung,
    grad,
    wurf
  } = aktionsStand(held, wahl);

  // Ein Magier auf Stufe 9 hat drei Dutzend Zauber. Gesucht wird ueber
  // Namen, Schule, Schadensart und Grad; die Auswahl haengt am Eintrag
  // und bleibt beim Filtern stehen.
  const suchWort = (wahl.suche || '').trim().toLowerCase();
  const gezeigt = !suchWort ? quelle : quelle.filter(g => (g.name || '').toLowerCase().includes(suchWort) || (g.school || '').toLowerCase().includes(suchWort) || (g.damageType || '').toLowerCase().includes(suchWort) || (g.source || '').toLowerCase().includes(suchWort) || (g.tags || []).some(t => (t || '').toLowerCase().includes(suchWort)) || wahl.art === 'zauber' && String(g.level === 0 ? 'zaubertrick' : g.level + '. grad').includes(suchWort));

  // Die zweite Zeile eines Eintrags und das, was rechts steht — je Art
  // etwas anderes, aber immer dieselben zwei Plaetze.
  const unterZeile = g => wahl.art === 'zauber' ? (g.level === 0 ? 'Zaubertrick' : (g.level || 1) + '. Grad') + (g.school ? ' · ' + g.school : '') + (g.range ? ' · ' + g.range : '') : wahl.art === 'angriff' ? (g.damageType ? g.damageType + ' · ' : '') + (g.range || '') : wahl.art === 'gegenstand' ? ((RARITIES.find(r => r.key === g.rarity) || {}).label || '') + ((g.tags || []).length ? ' · ' + (g.tags || []).join(', ') : '') : g.source || '';
  const rechts = g => wahl.art === 'zauber' ? hatWirkung(g.wirkung) ? g.wirkung.wuerfel || '' : '' : wahl.art === 'angriff' ? g.damage || '' : wahl.art === 'gegenstand' ? (+g.qty || 0) + '×' : '';

  // Die Plaetze des Helden: nur Grade, fuer die er welche hat — und der
  // eigene Grad des Zaubers, damit immer etwas dasteht.
  const plaetze = held && held.spellSlots || {};
  const grade = [];
  for (let l = Math.max(1, grundGrad); l <= 9; l++) {
    const p = plaetze[l] || plaetze[String(l)];
    if (l === grundGrad || p && (+p.max || 0) > 0) grade.push(l);
  }
  const platzRest = l => {
    const p = plaetze[l] || plaetze[String(l)];
    return p ? Math.max(0, (+p.max || 0) - (+p.used || 0)) : 0;
  };
  const waehlen = i => {
    const neu = i === wahl.i ? null : i;
    const g = neu === null ? null : quelle[neu];
    setWahl({
      ...wahl,
      i: neu,
      grad: g && wahl.art === 'zauber' ? +g.level || 0 : 0
    });
  };
  const ArtTaste = ({
    k,
    kind,
    aus
  }) => /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'zug-taste' + (wahl.art === k ? ' an' : ''),
    disabled: aus,
    onClick: () => setWahl({
      ...wahl,
      art: k,
      i: null,
      grad: 0,
      suche: ''
    })
  }, kind);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Was tut ", wer), /*#__PURE__*/React.createElement("div", {
    className: "zug-reihe"
  }, /*#__PURE__*/React.createElement(ArtTaste, {
    k: "angriff",
    kind: "\u2694 Angriff",
    aus: !waffen.length
  }), /*#__PURE__*/React.createElement(ArtTaste, {
    k: "zauber",
    kind: "\u2728 Zauber",
    aus: !sprueche.length
  }), /*#__PURE__*/React.createElement(ArtTaste, {
    k: "gegenstand",
    kind: "\uD83E\uDDEA Gegenstand",
    aus: !sachen.length
  }), /*#__PURE__*/React.createElement(ArtTaste, {
    k: "merkmal",
    kind: "\u2B50 Merkmal",
    aus: !merkmale.length
  }), /*#__PURE__*/React.createElement(ArtTaste, {
    k: "frei",
    kind: "\u270D Nur beschreiben"
  }))), wahl.art !== 'frei' && /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, ansicht.label), quelle.length > 5 && /*#__PURE__*/React.createElement("input", {
    className: "zug-suche",
    value: wahl.suche || '',
    placeholder: "\uD83D\uDD0D Suchen\u2026",
    "aria-label": ansicht.suche,
    onChange: e => setWahl({
      ...wahl,
      suche: e.target.value
    })
  }), quelle.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "zug-leer"
  }, ansicht.leer) : gezeigt.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "zug-leer"
  }, "Nichts gefunden zu \u201E", (wahl.suche || '').trim(), "\u201C.") : /*#__PURE__*/React.createElement("div", {
    className: "zug-liste"
  }, gezeigt.map(g => {
    const i = quelle.indexOf(g);
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: g.id || i,
      className: 'zug-zeile' + (i === wahl.i ? ' an' : '') + (wahl.art === 'zauber' || wahl.art === 'merkmal' ? ' arkan' : ''),
      onClick: () => waehlen(i)
    }, /*#__PURE__*/React.createElement("span", {
      className: "zug-sym"
    }, ansicht.sym), /*#__PURE__*/React.createElement("span", {
      className: "zug-text"
    }, /*#__PURE__*/React.createElement("b", null, g.name || 'Ohne Namen'), /*#__PURE__*/React.createElement("i", null, unterZeile(g))), /*#__PURE__*/React.createElement("span", {
      className: "zug-wirkt"
    }, rechts(g)));
  }))), wahl.art === 'zauber' && gegenstand && grundGrad > 0 && /*#__PURE__*/React.createElement("div", {
    className: "zug-grad"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-grad-label"
  }, "Zauberplatz"), /*#__PURE__*/React.createElement("span", {
    className: "zug-reihe"
  }, grade.map(l => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: l,
    className: 'zug-grad-taste' + (l === grad ? ' an' : ''),
    title: platzRest(l) + ' von ' + ((plaetze[l] || plaetze[String(l)] || {}).max || 0) + ' frei',
    onClick: () => setWahl({
      ...wahl,
      grad: l
    })
  }, l, /*#__PURE__*/React.createElement("i", null, platzRest(l))))), /*#__PURE__*/React.createElement("span", {
    className: "zug-grad-erg"
  }, wurf ? /*#__PURE__*/React.createElement("b", null, wurf) : /*#__PURE__*/React.createElement("i", null, "kein W\xFCrfel am Zauber"), grad > grundGrad && /*#__PURE__*/React.createElement("span", null, " \xB7 ", grad - grundGrad, " Grad h\xF6her"), platzRest(grad) > 0 ? /*#__PURE__*/React.createElement("span", null, " \xB7 Platz ", grad, ". Grad wird abgehakt") : /*#__PURE__*/React.createElement("span", null, " \xB7 kein Platz mehr frei"))));
};

// ── Das Zugfenster ───────────────────────────────────────────────
// Bis hierher trug die Spielleitung den Schaden ein und schrieb daneben
// auf, was eigentlich geschehen ist. Das Fenster dreht die Reihenfolge um:
// sie sagt, WAS geschieht — Waffe oder Zauber, auf wen, wie viel —, und die
// Trefferpunkte fallen als Nebenprodukt ab. Derselbe Schaden wird nicht
// mehr zweimal getippt.
//
// Drei Entscheidungen stecken darin:
//   Es geht nur auf Knopfdruck auf. Ein Tracker, der bei jedem Zugwechsel
//   eine Eingabe verlangt, wird nach drei Runden abgeschaltet.
//   Es wuerfelt nicht. Gewuerfelt wird am Tisch; getroffen oder daneben ist
//   ein Schalter, und der Wurf darf danebenstehen, muss aber nicht.
//   Beim Gegner gibt es keine Auswahl. Er hat im Heldenbuch keine
//   Waffenliste, nur seinen Bogen aus der Sammlung — also nur Ziele, Werte
//   und die Beschreibung.
const ZugFenster = ({
  t,
  liste,
  helden,
  setDefs,
  klassen,
  runde,
  bisher,
  ansage,
  ansagen,
  onAnsageWeg,
  onAbbrechen,
  onAnwenden
}) => {
  const held = t.art === 'held' ? (helden || []).find(h => h.id === t.charId) : null;
  const waffen = held && held.weapons || [];
  const sprueche = sortierteSprueche(held);

  // Der Zauber-SG steht im Bogen — daran haengt, ob ein Rettungswurf
  // gelingt. Er wird hier nur gezeigt; entschieden wird am Tisch.
  const werte = held ? charWerte(held, setDefs) : null;
  const zAttr = held ? klassenAttr(held.charClass, klassen) : null;
  const zauberSG = werte && zAttr ? 8 + (+werte.eff.profBonus || 0) + mod(werte.eff[zAttr]) : null;

  // Die Auswahl teilt sich dieses Fenster mit dem des Spielers. Kommt es
  // aus einer Ansage, steht schon drin, was der Spieler gesagt hat — die
  // Spielleitung ergaenzt nur noch die Zahlen.
  const [wahl, setWahl] = React.useState(() => {
    if (ansage && held) {
      const q = aktionsQuelle(held, ansage.art);
      const i = q.findIndex(g => (g.name || '') === (ansage.was || ''));
      return {
        art: ansage.art || 'frei',
        i: i >= 0 ? i : null,
        grad: +ansage.grad || 0,
        suche: ''
      };
    }
    return {
      art: waffen.length ? 'angriff' : sprueche.length ? 'zauber' : 'frei',
      i: null,
      grad: 0,
      suche: ''
    };
  });
  const [richtung, setRichtung] = React.useState('schaden');
  // Kommt das Fenster aus einer Ansage, sind die Ziele des Spielers
  // schon angekreuzt — was inzwischen aus dem Kampf ist, faellt weg.
  const [ziele, setZiele] = React.useState(() => {
    const z = {};
    (ansage && ansage.zielIds || []).forEach(id => {
      if ((liste || []).some(x => x.id === id)) z[id] = {
        treffer: true,
        bestanden: false,
        wurf: '',
        wert: 0
      };
    });
    return z;
  });
  const [text, setText] = React.useState(ansage ? ansage.text || '' : '');
  // Welche Ansage gerade in den Feldern steht — sie ist erledigt, sobald
  // uebernommen wird.
  const [genommen, setGenommen] = React.useState(ansage ? ansage.id : null);

  // Eine Ansage in die Felder holen. Dasselbe, was beim Aufmachen ueber
  // "Eintragen" passiert — nur ohne das Fenster zu schliessen.
  const ansageNehmen = a => {
    const q = aktionsQuelle(held, a.art);
    const i = q.findIndex(g => (g.name || '') === (a.was || ''));
    setWahl({
      art: a.art || 'frei',
      i: i >= 0 ? i : null,
      grad: +a.grad || 0,
      suche: ''
    });
    const z = {};
    (a.zielIds || []).forEach(id => {
      if ((liste || []).some(x => x.id === id)) z[id] = {
        treffer: true,
        bestanden: false,
        wurf: '',
        wert: 0
      };
    });
    setZiele(z);
    setText(a.text || '');
    setGenommen(a.id);
  };
  const meineAnsagen = (ansagen || []).filter(a => held && a.charId === held.id);
  const andereAnsagen = (ansagen || []).filter(a => !held || a.charId !== held.id);

  // Beim Gegner gibt es nichts zu waehlen — nur wem wie viel.
  const nurWerte = t.art !== 'held';
  const art = nurWerte ? 'frei' : wahl.art;
  const {
    gegenstand,
    grundGrad,
    wirkung,
    grad,
    wurf: wurfJetzt
  } = nurWerte ? {
    gegenstand: null,
    grundGrad: 0,
    wirkung: null,
    grad: 0,
    wurf: ''
  } : aktionsStand(held, wahl);
  const mitRettung = !!(wirkung && wirkung.rettung);
  // Flaechenzauber: ein Wurf fuer alle. Der Schaden steht dann einmal
  // oben, und bei jedem Ziel nur noch, ob der Rettungswurf gelang.
  const flaeche = !!(wirkung && wirkung.flaeche);
  const [gemeinsam, setGemeinsam] = React.useState(0);
  const [gemeinsamZusatz, setGemeinsamZusatz] = React.useState([]);
  const mitSchalter = !nurWerte && art !== 'frei' && richtung === 'schaden' && !mitRettung;
  const platzRest = l => {
    const p = (held && held.spellSlots || {})[l] || (held && held.spellSlots || {})[String(l)];
    return p ? Math.max(0, (+p.max || 0) - (+p.used || 0)) : 0;
  };

  // Was der Bogen schon weiss: eine Resistenz gegen genau diese
  // Schadensart steht als Merkmal am Helden. Sie ist damit vorgewaehlt —
  // aendern kann die Spielleitung sie trotzdem, denn eine Resistenz
  // haengt oft am Umstand und nicht nur am Bogen.
  const schadensArt = () => art === 'zauber' ? wirkung && wirkung.schadensart || '' : gegenstand && gegenstand.damageType || '';
  const vorgemindert = ziel => {
    const a = schadensArt();
    if (!a || !ziel) return '';
    return (ziel.flags || []).some(f => f === 'Resistenz: ' + a) ? 'res' : '';
  };
  const zielSetzen = (id, p) => setZiele(z => ({
    ...z,
    [id]: {
      ...z[id],
      ...p
    }
  }));
  // Eine brennende Klinge macht zweierlei Schaden. Der Grundschaden
  // steht im Feld, alles Weitere kommt als eigene Zeile mit eigener Art
  // dazu — im Protokoll steht dann "10 Schaden (7 Hieb + 3 Feuer)".
  const zusatzDazu = id => setZiele(z => ({
    ...z,
    [id]: {
      ...z[id],
      zusatz: [...((z[id] || {}).zusatz || []), {
        art: '',
        wert: 0
      }]
    }
  }));
  const zusatzSetzen = (id, i, p) => setZiele(z => ({
    ...z,
    [id]: {
      ...z[id],
      zusatz: ((z[id] || {}).zusatz || []).map((x, j) => j === i ? {
        ...x,
        ...p
      } : x)
    }
  }));
  const zusatzWeg = (id, i) => setZiele(z => ({
    ...z,
    [id]: {
      ...z[id],
      zusatz: ((z[id] || {}).zusatz || []).filter((_, j) => j !== i)
    }
  }));
  const zielUm = id => setZiele(z => {
    if (z[id]) {
      const k = {
        ...z
      };
      delete k[id];
      return k;
    }
    const t2 = (liste || []).find(x => x.id === id);
    return {
      ...z,
      [id]: {
        treffer: true,
        bestanden: false,
        wurf: '',
        wert: 0,
        minderung: vorgemindert(t2)
      }
    };
  });
  // Einmal gebaut, zweimal genutzt: als Vorschau und als das, was beim
  // Uebernehmen wirklich geschrieben wird. So kann die Vorschau nicht von
  // dem abweichen, was danach im Protokoll steht.
  const bauen = () => {
    const eintraege = [],
      treffer = [];
    let verbrauch = null;
    if (text.trim()) eintraege.push({
      art: 'frei',
      wer: t.name,
      text: text.trim()
    });
    let platz = null;
    // Die Waffe bleibt nach "und weiter" stehen — ohne Ziel und ohne Text
    // waere "Angriff: Langschwert" allein aber eine leere Zeile.
    if (gegenstand && (Object.keys(ziele).length || text.trim())) {
      eintraege.push({
        art: 'aktion',
        wer: t.name,
        was: gegenstand.name,
        modus: art,
        grad: art === 'zauber' && grad > grundGrad ? grad : 0,
        wurf: wurfJetzt || ''
      });
      // Der Zauberplatz gehoert zum Wirken und steht deshalb gleich
      // darunter, nicht hinter den Rettungswuerfen.
      if (held && art === 'zauber' && grundGrad > 0 && platzRest(grad) > 0) {
        platz = {
          charId: held.id,
          grad
        };
        eintraege.push({
          art: 'platz',
          wer: t.name,
          grad
        });
      }
      // Und ebenso der Trank: benutzt ist benutzt, die Zahl im Inventar
      // sinkt um eins. Damit muss niemand daneben mitzaehlen.
      if (held && art === 'gegenstand' && (+gegenstand.qty || 0) > 0) {
        const rest = Math.max(0, (+gegenstand.qty || 0) - 1);
        verbrauch = {
          charId: held.id,
          itemId: gegenstand.id,
          name: gegenstand.name,
          rest
        };
        eintraege.push({
          art: 'verbrauch',
          wer: t.name,
          was: gegenstand.name,
          rest
        });
      }
    }
    Object.keys(ziele).forEach(id => {
      const ziel = liste.find(x => x.id === id);
      if (!ziel) return;
      const z = ziele[id];
      const basis = flaeche ? Math.max(0, Math.round(+gemeinsam || 0)) : Math.max(0, Math.round(+z.wert || 0));
      const extra = (flaeche ? gemeinsamZusatz : z.zusatz || []).map(x => ({
        wert: Math.max(0, Math.round(+x.wert || 0)),
        art: (x.art || '').trim()
      })).filter(x => x.wert > 0);
      const voll = basis + extra.reduce((sum, x) => sum + x.wert, 0);
      // Die Teile stehen nur dann im Protokoll, wenn es mehr als einen gibt.
      const grundArt = art === 'zauber' ? wirkung && wirkung.schadensart || '' : gegenstand && gegenstand.damageType || '';
      const teile = extra.length ? [{
        wert: basis,
        art: grundArt
      }, ...extra] : null;
      let n = voll;
      if (mitRettung) {
        eintraege.push({
          art: 'rettung',
          was: gegenstand ? gegenstand.name : '',
          ziel: ziel.name,
          rw: RETTUNG_KURZ[wirkung.rettung] || '',
          wurf: z.wurf,
          sg: zauberSG,
          bestanden: !!z.bestanden
        });
        if (z.bestanden) n = wirkung.halb ? Math.floor(voll / 2) : 0;
      } else if (mitSchalter) {
        eintraege.push({
          art: 'wurf',
          was: gegenstand ? gegenstand.name : '',
          ziel: ziel.name,
          wurf: z.wurf,
          ac: ziel.ac,
          treffer: !!z.treffer
        });
        if (!z.treffer) n = 0;
      }
      // Und zuletzt, was am Ziel selbst haengt: Resistenz halbiert, was
      // uebrig ist, Immunitaet nimmt alles. Diese Reihenfolge steht so im
      // Regelwerk — erst der Rettungswurf, dann die Minderung.
      const mind = richtung === 'schaden' ? z.minderung || '' : '';
      if (mind === 'immun') {
        eintraege.push({
          art: 'immun',
          wer: ziel.name,
          was: schadensArt()
        });
        n = 0;
      } else if (mind === 'res') {
        n = Math.floor(n / 2);
      }
      // Halbiert der Rettungswurf oder eine Resistenz, stimmen die Teile
      // nicht mehr — dann steht nur die Zahl da statt einer falschen
      // Aufteilung.
      if (n > 0) treffer.push({
        id,
        modus: richtung,
        n,
        ziel,
        minderung: mind,
        teile: n === voll && richtung === 'schaden' ? teile : null
      });
    });
    return {
      eintraege,
      treffer,
      platz,
      verbrauch
    };
  };
  const {
    eintraege,
    treffer
  } = bauen();
  const summe = treffer.reduce((s, x) => s + x.n, 0);

  // Ein Zug ist selten eine Sache: Angriff und Bonusaktion, zwei Hiebe
  // des Kaempfers, Zauber und Trank. "Und weiter" traegt ein und raeumt
  // das Fenster fuer die naechste Aktion ab — Waffe, Zauber und Grad
  // bleiben stehen, weil der zweite Hieb meistens derselbe ist.
  const uebernehmen = weiter => {
    const gebaut = bauen();
    onAnwenden(gebaut, weiter, genommen);
    if (weiter) {
      setZiele({});
      setText('');
      setGenommen(null);
      setGemeinsam(0);
      setGemeinsamZusatz([]);
      // Nach dem Trank ordnet sich die Liste neu — an derselben
      // Stelle steht dann etwas anderes. Also die Wahl los, statt
      // aus Versehen den naechsten Gegenstand zu verbrauchen.
      if (gebaut.verbrauch) setWahl(w => ({
        ...w,
        i: null
      }));
    }
  };

  // Die Vorschau zeigt dieselben Zeilen, die gleich im Protokoll stehen —
  // samt der Trefferpunkte davor und danach. Was in diesem Zug schon
  // eingetragen wurde, steht mit darueber: so sieht man den ganzen Zug.
  const vorschau = [{
    art: 'zug',
    r: runde,
    wer: t.name
  }, ...(bisher || []), ...eintraege.map(e => ({
    ...e,
    r: runde
  }))];
  treffer.forEach(({
    modus,
    n,
    ziel,
    teile,
    minderung
  }) => {
    const von = ziel.hp || 0;
    const auf = modus === 'heilung' ? Math.min(ziel.hpMax, von + n) : Math.max(0, von - n);
    vorschau.push({
      art: modus,
      r: runde,
      wer: ziel.name,
      wert: n,
      von,
      auf,
      teile,
      minderung
    });
    if (von > 0 && auf <= 0) vorschau.push({
      art: 'nieder',
      r: runde,
      wer: ziel.name
    });
  });
  const knopf = summe ? richtung === 'heilung' ? '✓ Übernehmen — heilt ' + summe + ' TP' : '✓ Übernehmen — trägt ' + summe + ' TP ab' : '✓ Übernehmen';
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onAbbrechen
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-fenster",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-kopf"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-titel"
  }, "\u270D ", t.name), /*#__PURE__*/React.createElement("span", {
    className: "zug-wer"
  }, "Runde ", runde, t.unterzeile ? ' · ' + t.unterzeile : ''), /*#__PURE__*/React.createElement("span", {
    className: "zug-tp"
  }, /*#__PURE__*/React.createElement("b", null, t.hp), " / ", t.hpMax, " TP")), /*#__PURE__*/React.createElement("div", {
    className: "zug-leib"
  }, (meineAnsagen.length > 0 || andereAnsagen.length > 0) && /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "\uD83D\uDCE3 Angesagt"), meineAnsagen.map(a => /*#__PURE__*/React.createElement("div", {
    className: 'zug-ansage' + (genommen === a.id ? ' an' : ''),
    key: a.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "za-was"
  }, a.was ? /*#__PURE__*/React.createElement("b", null, (AKTION_WORT[a.art] || 'Angriff') + ': ', a.was, a.grad ? ' · ' + a.grad + '. Grad' : '') : null, (a.ziele || []).length ? /*#__PURE__*/React.createElement("span", null, " \u2192 ", (a.ziele || []).join(', ')) : null, a.text ? /*#__PURE__*/React.createElement("i", null, "\u201E", a.text, "\u201C") : null), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: () => ansageNehmen(a),
    title: "In die Felder \xFCbernehmen"
  }, "\u21A7 \xFCbernehmen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fx-del",
    title: "Erledigt",
    onClick: () => onAnsageWeg && onAnsageWeg(a.id)
  }, "\u2715"))), andereAnsagen.map(a => {
    const wer = (helden || []).find(h => h.id === a.charId);
    return /*#__PURE__*/React.createElement("div", {
      className: "zug-ansage fremd",
      key: a.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "za-was"
    }, /*#__PURE__*/React.createElement("b", null, wer ? wer.name : 'Jemand'), a.was ? /*#__PURE__*/React.createElement("span", null, " \xB7 ", a.was, a.grad ? ' · ' + a.grad + '. Grad' : '') : null, (a.ziele || []).length ? /*#__PURE__*/React.createElement("span", null, " \u2192 ", (a.ziele || []).join(', ')) : null, a.text ? /*#__PURE__*/React.createElement("i", null, "\u201E", a.text, "\u201C") : null));
  })), !nurWerte && /*#__PURE__*/React.createElement(AktionsWahl, {
    held: held,
    wahl: wahl,
    setWahl: setWahl,
    wer: t.name
  }), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Auf wen"), /*#__PURE__*/React.createElement("div", {
    className: "zug-ziele"
  }, liste.map(z => {
    const anteil = Math.max(0, Math.min(1, (z.hp || 0) / Math.max(1, z.hpMax || 1)));
    const farbe = anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a';
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: z.id,
      className: 'zug-ziel' + (ziele[z.id] ? ' an' : '') + (z.art === 'held' ? ' held' : ''),
      onClick: () => zielUm(z.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "zug-ziel-kopf"
    }, /*#__PURE__*/React.createElement("b", null, z.name), /*#__PURE__*/React.createElement("i", null, "RK ", z.ac)), /*#__PURE__*/React.createElement("span", {
      className: "zug-balken"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: anteil * 100 + '%',
        background: farbe
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "zug-ziel-tp"
    }, z.hp, " / ", z.hpMax, " TP"));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Was ankommt", mitRettung && zauberSG != null && /*#__PURE__*/React.createElement("span", {
    className: "zug-sg"
  }, "Rettungswurf ", RETTUNG_KURZ[wirkung.rettung], " gegen SG ", zauberSG), /*#__PURE__*/React.createElement("span", {
    className: "zug-richtung"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: richtung === 'schaden' ? 'an dmg' : '',
    onClick: () => setRichtung('schaden')
  }, "\u2212 Schaden"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: richtung === 'heilung' ? 'an heal' : '',
    onClick: () => setRichtung('heilung')
  }, "+ Heilung"))), flaeche && Object.keys(ziele).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "zug-flaeche"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-flaeche-label"
  }, "F\xFCr alle"), /*#__PURE__*/React.createElement("span", {
    className: "zug-feld"
  }, /*#__PURE__*/React.createElement("span", null, richtung === 'heilung' ? 'Heilt' : 'Schaden'), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "zug-zahl",
    sofort: true,
    min: 0,
    wert: gemeinsam,
    leerWert: 0,
    "aria-label": "Schaden f\xFCr alle Ziele",
    onWert: v => setGemeinsam(v)
  })), richtung === 'schaden' && gemeinsamZusatz.map((x, i) => /*#__PURE__*/React.createElement("span", {
    className: "zug-zusatz",
    key: i,
    style: {
      width: 'auto',
      paddingLeft: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "zug-art",
    list: "hb-schadensarten",
    value: x.art || '',
    placeholder: "Feuer",
    "aria-label": 'Schadensart ' + (i + 1) + ' für alle',
    onChange: e => setGemeinsamZusatz(l => l.map((y, j) => j === i ? {
      ...y,
      art: e.target.value
    } : y))
  }), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "zug-zahl",
    sofort: true,
    min: 0,
    wert: x.wert,
    leerWert: 0,
    "aria-label": 'Zusatzschaden ' + (i + 1) + ' für alle',
    onWert: v => setGemeinsamZusatz(l => l.map((y, j) => j === i ? {
      ...y,
      wert: v
    } : y))
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fx-del",
    title: "Weg",
    onClick: () => setGemeinsamZusatz(l => l.filter((_, j) => j !== i))
  }, "\u2715"))), richtung === 'schaden' && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "zug-plus",
    title: "Zus\xE4tzlicher Schaden anderer Art",
    onClick: () => setGemeinsamZusatz(l => [...l, {
      art: '',
      wert: 0
    }])
  }, "\uFF0B Art"), /*#__PURE__*/React.createElement("span", {
    className: "zug-flaeche-hinweis"
  }, Object.keys(ziele).length, " ", Object.keys(ziele).length === 1 ? 'Ziel' : 'Ziele', mitRettung ? wirkung.halb ? ' · wer besteht, nimmt die Hälfte' : ' · wer besteht, nimmt nichts' : '')), Object.keys(ziele).length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "zug-leer"
  }, "Noch kein Ziel gew\xE4hlt.") : /*#__PURE__*/React.createElement("div", {
    className: "zug-wirkung"
  }, Object.keys(ziele).map(id => {
    const z = ziele[id];
    const ziel = liste.find(x => x.id === id);
    if (!ziel) return null;
    const gesamt = flaeche ? Math.max(0, Math.round(+gemeinsam || 0)) + gemeinsamZusatz.reduce((sum, x) => sum + Math.max(0, Math.round(+x.wert || 0)), 0) : Math.max(0, Math.round(+z.wert || 0)) + (z.zusatz || []).reduce((sum, x) => sum + Math.max(0, Math.round(+x.wert || 0)), 0);
    const halbiert = mitRettung && z.bestanden && wirkung.halb;
    return /*#__PURE__*/React.createElement("div", {
      className: "zug-w-zeile",
      key: id
    }, /*#__PURE__*/React.createElement("span", {
      className: "zug-w-name"
    }, ziel.name), mitRettung && /*#__PURE__*/React.createElement("span", {
      className: "zug-schalter"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: 'nein' + (z.bestanden ? '' : ' an'),
      onClick: () => zielSetzen(id, {
        bestanden: false
      })
    }, "misslungen"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: 'ja' + (z.bestanden ? ' an' : ''),
      onClick: () => zielSetzen(id, {
        bestanden: true
      })
    }, "bestanden")), mitSchalter && /*#__PURE__*/React.createElement("span", {
      className: "zug-schalter"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: 'ja' + (z.treffer ? ' an' : ''),
      onClick: () => zielSetzen(id, {
        treffer: true
      })
    }, "Treffer"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: 'nein' + (z.treffer ? '' : ' an'),
      onClick: () => zielSetzen(id, {
        treffer: false
      })
    }, "daneben")), (mitSchalter || mitRettung) && /*#__PURE__*/React.createElement("span", {
      className: "zug-feld"
    }, /*#__PURE__*/React.createElement("span", null, "Wurf"), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "zug-zahl",
      sofort: true,
      wert: z.wurf,
      leerWert: "",
      placeholder: "\u2014",
      "aria-label": 'Gewürfelt für ' + ziel.name,
      onWert: v => zielSetzen(id, {
        wurf: v
      })
    })), flaeche ? /*#__PURE__*/React.createElement("span", {
      className: "zug-feld"
    }, /*#__PURE__*/React.createElement("span", null, richtung === 'heilung' ? 'Heilt' : 'Schaden'), /*#__PURE__*/React.createElement("b", {
      className: "zug-ergebnis"
    }, (() => {
      let n = mitRettung && z.bestanden ? wirkung.halb ? Math.floor(gesamt / 2) : 0 : gesamt;
      if (z.minderung === 'immun') n = 0;else if (z.minderung === 'res') n = Math.floor(n / 2);
      return n;
    })())) : /*#__PURE__*/React.createElement(React.Fragment, null, (mitRettung || !mitSchalter || z.treffer) && /*#__PURE__*/React.createElement("span", {
      className: "zug-feld"
    }, /*#__PURE__*/React.createElement("span", null, richtung === 'heilung' ? 'Heilt' : 'Schaden'), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "zug-zahl",
      sofort: true,
      min: 0,
      wert: z.wert,
      leerWert: 0,
      "aria-label": (richtung === 'heilung' ? 'Heilung' : 'Schaden') + ' an ' + ziel.name,
      onWert: v => zielSetzen(id, {
        wert: v
      })
    }), halbiert && /*#__PURE__*/React.createElement("i", {
      className: "zug-halb"
    }, "\u2192 ", Math.floor(gesamt / 2)), mitRettung && z.bestanden && !wirkung.halb && /*#__PURE__*/React.createElement("i", {
      className: "zug-halb"
    }, "\u2192 0")), richtung === 'schaden' && (mitRettung || !mitSchalter || z.treffer) && /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "zug-plus",
      title: "Zus\xE4tzlicher Schaden anderer Art \u2014 eine brennende Klinge, geweihtes \xD6l",
      onClick: () => zusatzDazu(id)
    }, "\uFF0B Art")), richtung === 'schaden' && /*#__PURE__*/React.createElement("span", {
      className: "zug-mind",
      title: "Resistenz halbiert, Immunit\xE4t nimmt alles"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: z.minderung ? '' : 'an',
      onClick: () => zielSetzen(id, {
        minderung: ''
      })
    }, "voll"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: z.minderung === 'res' ? 'an res' : '',
      onClick: () => zielSetzen(id, {
        minderung: 'res'
      })
    }, "\xBD Res."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: z.minderung === 'immun' ? 'an immun' : '',
      onClick: () => zielSetzen(id, {
        minderung: 'immun'
      })
    }, "immun")), /*#__PURE__*/React.createElement("span", {
      className: "zug-w-notiz"
    }, "RK ", ziel.ac, " \xB7 ", ziel.hp, "/", ziel.hpMax), richtung === 'schaden' && (z.zusatz || []).map((x, i) => /*#__PURE__*/React.createElement("span", {
      className: "zug-zusatz",
      key: i
    }, /*#__PURE__*/React.createElement("span", null, "zus\xE4tzlich"), /*#__PURE__*/React.createElement("input", {
      className: "zug-art",
      list: "hb-schadensarten",
      value: x.art || '',
      placeholder: "Feuer",
      "aria-label": 'Schadensart ' + (i + 1) + ' an ' + ziel.name,
      onChange: e => zusatzSetzen(id, i, {
        art: e.target.value
      })
    }), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "zug-zahl",
      sofort: true,
      min: 0,
      wert: x.wert,
      leerWert: 0,
      "aria-label": 'Zusatzschaden ' + (i + 1) + ' an ' + ziel.name,
      onWert: v => zusatzSetzen(id, i, {
        wert: v
      })
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fx-del",
      title: "Weg",
      onClick: () => zusatzWeg(id, i)
    }, "\u2715"))));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Beschreibung \u2014 freiwillig"), /*#__PURE__*/React.createElement("textarea", {
    className: "zug-frei",
    value: text,
    onChange: e => setText(e.target.value),
    placeholder: "Was geschieht in diesem Zug?",
    "aria-label": "Beschreibung des Zuges"
  })), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Kommt so ins Protokoll"), /*#__PURE__*/React.createElement("div", {
    className: "zug-vorschau"
  }, /*#__PURE__*/React.createElement(ProtokollZeilen, {
    log: vorschau,
    mitZahlen: true
  })))), /*#__PURE__*/React.createElement("datalist", {
    id: "hb-schadensarten"
  }, SCHADENSARTEN.map(a2 => /*#__PURE__*/React.createElement("option", {
    key: a2,
    value: a2
  }))), /*#__PURE__*/React.createElement("div", {
    className: "zug-fuss"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-hinweis"
  }, "Was hier steht, geht sofort in die B\xF6gen."), /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Schlie\xDFen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: () => uebernehmen(true),
    title: "Eintragen und das Fenster f\xFCr die n\xE4chste Aktion dieses Zuges offen lassen",
    disabled: !eintraege.length && !treffer.length
  }, "+ und weiter"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: () => uebernehmen(false),
    disabled: !eintraege.length && !treffer.length
  }, knopf))));
};

// ── Zustandsfenster ──────────────────────────────────────────────
const ZustandWahl = ({
  t,
  onZustand,
  onErschoepfung,
  onMarke,
  onSchliessen
}) => /*#__PURE__*/React.createElement("div", {
  className: "kampf-zust-panel",
  onClick: e => e.stopPropagation()
}, /*#__PURE__*/React.createElement("div", {
  className: "kampf-zust-titel"
}, "Zust\xE4nde \u2014 ", t.name), /*#__PURE__*/React.createElement("div", {
  className: "kampf-zust-marken"
}, /*#__PURE__*/React.createElement("button", {
  type: "button",
  className: 'zust-marke gut' + (t.vorteil ? ' an' : ''),
  onClick: () => onMarke('vorteil')
}, "\uD83D\uDC4D Vorteil"), /*#__PURE__*/React.createElement("button", {
  type: "button",
  className: 'zust-marke schlecht' + (t.nachteil ? ' an' : ''),
  onClick: () => onMarke('nachteil')
}, "\uD83D\uDC4E Nachteil")), /*#__PURE__*/React.createElement("div", {
  className: "kampf-zust-chips"
}, CONDITIONS.map(z => /*#__PURE__*/React.createElement("button", {
  key: z,
  type: "button",
  className: 'zust-chip' + ((t.zustaende || []).includes(z) ? ' an' : ''),
  onClick: () => onZustand(z)
}, z))), /*#__PURE__*/React.createElement("div", {
  className: "kampf-zust-ersch"
}, /*#__PURE__*/React.createElement("div", {
  className: "kampf-zust-untertitel"
}, "Ersch\xF6pfung (Stufe ", t.erschoepfung || 0, "/6)"), /*#__PURE__*/React.createElement("div", {
  className: "kampf-ersch-pips"
}, [1, 2, 3, 4, 5, 6].map(i => /*#__PURE__*/React.createElement("button", {
  key: i,
  type: "button",
  className: 'ersch-pip' + ((t.erschoepfung || 0) >= i ? ' an' : ''),
  "aria-label": 'Erschöpfung ' + i,
  "aria-pressed": (t.erschoepfung || 0) >= i,
  onClick: () => onErschoepfung((t.erschoepfung || 0) === i ? i - 1 : i)
}, i)))), /*#__PURE__*/React.createElement("button", {
  type: "button",
  className: "kampf-zust-zu",
  onClick: onSchliessen
}, "Schlie\xDFen \u2715"));

// ── Eine Karte ───────────────────────────────────────────────────
const KampfZeile = ({
  t,
  dran,
  onWert,
  onFenster,
  onZug,
  onIni,
  onNotiz,
  onNotizFertig,
  onZustand,
  onMarke,
  onErschoepfung,
  onEntfernen,
  onBlatt,
  onTodes,
  auf,
  onAufklappen,
  zustandOffen,
  setZustandOffen,
  detailOffen,
  setDetailOffen
}) => {
  // Wer dran ist, rueckt ins Bild. Auf dem Telefon steht sonst nach
  // "Naechster Zug" jemand anderes auf dem Schirm als der, der handelt.
  const eigen = React.useRef(null);
  React.useEffect(() => {
    if (dran && eigen.current) eigen.current.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }, [dran]);
  const gesamtMax = Math.max(1, t.hpMax || 1);
  const anteil = Math.max(0, Math.min(1, (t.hp || 0) / gesamtMax));
  const tot = (t.hp || 0) <= 0;
  const farbe = anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a';
  const lage = t.art === 'held' ? todesStand(t.deathSaves) : 'offen';
  return /*#__PURE__*/React.createElement("div", {
    ref: eigen,
    className: 'kampf-zeile' + (dran ? ' dran' : '') + (tot ? ' tot' : '') + (t.art === 'held' ? ' held' : ' gegner') + (auf ? ' auf' : ' zu')
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-ini-feld"
  }, /*#__PURE__*/React.createElement("input", {
    className: "kampf-ini",
    type: "number",
    value: t.ini === null ? '' : t.ini,
    placeholder: "\u2014",
    "aria-label": 'Initiative ' + t.name,
    title: "Initiative eintragen",
    onChange: e => onIni(e.target.value)
  }), /*#__PURE__*/React.createElement("span", {
    className: "kampf-ini-label"
  }, "init.")), /*#__PURE__*/React.createElement("div", {
    className: "kampf-figur"
  }, t.bild ? /*#__PURE__*/React.createElement("img", {
    src: t.bild,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", null, t.art === 'held' ? '🛡' : '💀')), /*#__PURE__*/React.createElement("div", {
    className: "kampf-namensblock"
  }, t.art === 'gegner' && t.vorlageId ? /*#__PURE__*/React.createElement("button", {
    className: "kampf-name kampf-name-knopf",
    onClick: () => onBlatt(t.vorlageId),
    title: "Werte nachschlagen"
  }, t.name) : t.art === 'held' ? /*#__PURE__*/React.createElement("button", {
    className: "kampf-name kampf-name-knopf",
    onClick: () => setDetailOffen(detailOffen === t.id ? null : t.id),
    title: "Werte aus dem Bogen",
    "aria-expanded": detailOffen === t.id
  }, t.name) : /*#__PURE__*/React.createElement("span", {
    className: "kampf-name"
  }, t.name), t.unterzeile && /*#__PURE__*/React.createElement("div", {
    className: "kampf-unter"
  }, t.unterzeile), /*#__PURE__*/React.createElement("div", {
    className: "kampf-marken"
  }, t.ini === null && /*#__PURE__*/React.createElement("span", {
    className: "kampf-warte"
  }, "Initiative fehlt"), t.fehlt && /*#__PURE__*/React.createElement("span", {
    className: "kampf-warte"
  }, "nicht mehr im Abenteuer"), t.passive != null && /*#__PURE__*/React.createElement("span", {
    className: "kampf-passiv",
    title: "Passive Wahrnehmung"
  }, "\uD83D\uDC41 ", t.passive), t.vorteil && /*#__PURE__*/React.createElement("span", {
    className: "kampf-marke gut"
  }, "\uD83D\uDC4D Vorteil"), t.nachteil && /*#__PURE__*/React.createElement("span", {
    className: "kampf-marke schlecht"
  }, "\uD83D\uDC4E Nachteil"), (t.erschoepfung || 0) > 0 && /*#__PURE__*/React.createElement("span", {
    className: "kampf-marke ersch"
  }, "Ersch\xF6pfung ", t.erschoepfung), (t.zustaende || []).map(z => /*#__PURE__*/React.createElement("button", {
    key: z,
    className: "kampf-zustand",
    onClick: () => onZustand(z),
    title: "Entfernen"
  }, z, " \u2715")), (t.flags || []).map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    className: "kampf-flag"
  }, f))), dran && onZug && /*#__PURE__*/React.createElement("button", {
    className: "kampf-zug-knopf",
    onClick: onZug,
    title: "Angriff, Zauber oder Beschreibung eintragen \u2014 die Trefferpunkte rechnet es mit"
  }, "\u270D Zug eintragen")), /*#__PURE__*/React.createElement("textarea", {
    className: "kampf-notiz",
    value: t.notiz || '',
    placeholder: "Notiz\u2026",
    "aria-label": 'Notiz zu ' + t.name,
    onChange: e => onNotiz(e.target.value),
    onBlur: () => onNotizFertig && onNotizFertig()
  }), /*#__PURE__*/React.createElement("button", {
    className: "kampf-auf",
    onClick: onAufklappen,
    "aria-expanded": !!auf,
    title: auf ? 'Zuklappen' : 'Notiz und Tasten zeigen',
    "aria-label": (auf ? 'Zuklappen: ' : 'Aufklappen: ') + t.name
  }, auf ? '▾' : '▸'), /*#__PURE__*/React.createElement("div", {
    className: "kampf-ac"
  }, "AC ", t.ac), /*#__PURE__*/React.createElement("div", {
    className: "kampf-hp"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-hp-zahl"
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: farbe
    }
  }, (t.hp || 0) + (t.tempHp || 0)), /*#__PURE__*/React.createElement("span", null, "/ ", t.hpMax), (t.tempHp || 0) > 0 && /*#__PURE__*/React.createElement("i", {
    className: "kampf-temp"
  }, "\uD83D\uDEE1+", t.tempHp)), /*#__PURE__*/React.createElement("div", {
    className: "kampf-balken"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-balken-fuell",
    style: {
      width: anteil * 100 + '%',
      background: farbe
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "kampf-hp-unter"
  }, (t.tempHp || 0) > 0 && /*#__PURE__*/React.createElement("span", {
    className: "kampf-temp"
  }, "+", t.tempHp, " Temp HP"), (t.tempMaxHp || 0) > 0 && /*#__PURE__*/React.createElement("span", {
    className: "kampf-maxtemp"
  }, "+", t.tempMaxHp, " Temp. Max"))), /*#__PURE__*/React.createElement("div", {
    className: "kampf-tasten"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-tasten-grid"
  }, /*#__PURE__*/React.createElement("button", {
    className: "kt dmg",
    title: "1 Schaden",
    onClick: () => onWert('schaden', 1)
  }, "-1"), /*#__PURE__*/React.createElement("button", {
    className: "kt dmg",
    title: "5 Schaden",
    onClick: () => onWert('schaden', 5)
  }, "-5"), /*#__PURE__*/React.createElement("button", {
    className: "kt dmg breit",
    onClick: () => onFenster('schaden')
  }, "Schaden\u2026"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal",
    title: "1 heilen",
    onClick: () => onWert('heilung', 1)
  }, "+1"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal",
    title: "5 heilen",
    onClick: () => onWert('heilung', 5)
  }, "+5"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal breit",
    onClick: () => onFenster('heilung')
  }, "Heilen\u2026"), /*#__PURE__*/React.createElement("button", {
    className: "kt temp weit",
    onClick: () => onFenster('temp')
  }, "+Temp HP"), t.art === 'held' ? /*#__PURE__*/React.createElement("button", {
    className: "kt max breit",
    onClick: () => onFenster('maxtemp'),
    title: "Tempor\xE4re maximale Trefferpunkte \u2014 Heldenmahl, Aid, ein Segen f\xFCr diesen Abend"
  }, "+Temp Max") : /*#__PURE__*/React.createElement("button", {
    className: "kt max breit",
    onClick: () => onFenster('maxhp'),
    title: "Maximale Trefferpunkte setzen"
  }, "Max TP")), /*#__PURE__*/React.createElement("button", {
    className: 'kt zust' + (zustandOffen === t.id ? ' offen' : ''),
    "aria-expanded": zustandOffen === t.id,
    onClick: () => setZustandOffen(zustandOffen === t.id ? null : t.id)
  }, "Zust\xE4nde"), zustandOffen === t.id && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "kampf-zust-schirm",
    onClick: () => setZustandOffen(null)
  }), /*#__PURE__*/React.createElement(ZustandWahl, {
    t: t,
    onZustand: onZustand,
    onErschoepfung: onErschoepfung,
    onMarke: onMarke,
    onSchliessen: () => setZustandOffen(null)
  }))), t.art === 'held' && (tot || lage !== 'offen') && /*#__PURE__*/React.createElement(TodesWuerfe, {
    stand: t.deathSaves,
    onSetzen: onTodes
  }), detailOffen === t.id && t.art === 'held' && /*#__PURE__*/React.createElement("div", {
    className: "kampf-detail"
  }, t.saves && /*#__PURE__*/React.createElement("div", {
    className: "kampf-detail-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-detail-titel"
  }, "Rettungsw\xFCrfe"), /*#__PURE__*/React.createElement("div", {
    className: "kampf-saves"
  }, Object.keys(t.saves).map(k => /*#__PURE__*/React.createElement("div", {
    className: "kampf-save",
    key: k
  }, /*#__PURE__*/React.createElement("span", null, AL[k]), /*#__PURE__*/React.createElement("b", null, fnum(t.saves[k])))))), (t.effekte || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "kampf-detail-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-detail-titel"
  }, "Wirkt gerade"), /*#__PURE__*/React.createElement("div", {
    className: "kampf-effekte"
  }, (t.effekte || []).map((e, i) => /*#__PURE__*/React.createElement("span", {
    className: "kampf-effekt",
    key: i
  }, e.source, ": ", EFFECT_LABELS[e.target] || e.target, " ", effectText(e))))), (t.effekte || []).length === 0 && !t.saves && /*#__PURE__*/React.createElement("div", {
    className: "kampf-detail-leer"
  }, "Keine besonderen Werte.")), /*#__PURE__*/React.createElement("button", {
    className: "kampf-raus",
    onClick: onEntfernen,
    title: "Aus dem Kampf nehmen",
    "aria-label": t.name + ' aus dem Kampf nehmen'
  }, "\u2715"));
};

// ── Spontan zusammenstellen ──────────────────────────────────────
// Nicht jeder Kampf ist vorbereitet. Hier werden Gegner direkt gewaehlt,
// ohne den Umweg ueber eine gespeicherte Begegnung.
// Eine gespeicherte Begegnung in den laufenden Kampf holen. Frueher war
// das die Startseite des Trackers; sie stand jedem Kampf im Weg, der ohne
// Begegnung anfangen sollte — und das ist der Normalfall am Tisch.
const BegegnungWahl = ({
  encounters,
  enemies,
  advId,
  onLaden,
  onAbbrechen
}) => {
  const waehlbar = encounters.filter(e => !e.adventure || e.adventure === advId);
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onAbbrechen
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\uD83D\uDCCB Begegnung laden"), waehlbar.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "kampf-leer"
  }, "Keine Begegnung in diesem Abenteuer. Lege eine unter \uD83D\uDCDA Datenbank \u203A Begegnungen an.") : /*#__PURE__*/React.createElement("div", {
    className: "kampf-start-liste"
  }, waehlbar.map(b => {
    const anzahl = (b.enemies || []).reduce((s, t) => s + (+t.count || 1), 0);
    const fehlend = (b.enemies || []).filter(t => !enemies.some(g => g.id === t.enemyId)).length;
    return /*#__PURE__*/React.createElement("button", {
      key: b.id,
      className: "kampf-start-eintrag",
      disabled: anzahl === 0 || fehlend === anzahl,
      onClick: () => onLaden(b)
    }, /*#__PURE__*/React.createElement("span", {
      className: "kampf-start-name"
    }, b.name), /*#__PURE__*/React.createElement("span", {
      className: "kampf-start-sub"
    }, b.difficulty, " \xB7 ", anzahl, " Gegner", fehlend ? ' · ' + fehlend + ' Gegner fehlt in der Sammlung' : ''));
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"))));
};
const NothelferFenster = ({
  onAnlegen,
  onAbbrechen
}) => {
  const [name, setName] = React.useState('');
  const [tp, setTp] = React.useState('');
  const [ac, setAc] = React.useState('');
  const [anzahl, setAnzahl] = React.useState(1);
  const fertig = () => {
    const n = Math.max(1, Math.min(20, +anzahl || 1));
    onAnlegen(name, tp, ac, n);
  };
  const taste = e => {
    if (e.key === 'Enter') fertig();
  };
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onAbbrechen
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 400
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\u271A Nothelfer"), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 14
    }
  }, "F\xFCr den W\xE4chter, der im Abenteuerbuch mit einem Satz abgehandelt ist. Er kommt sofort in die Initiative und wandert nicht in die Gegnersammlung."), /*#__PURE__*/React.createElement("div", {
    className: "form-grid",
    style: {
      gridTemplateColumns: "1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    autoFocus: true,
    placeholder: "z.B. W\xE4chter am Tor",
    value: name,
    onChange: e => setName(e.target.value),
    onKeyDown: taste
  })), /*#__PURE__*/React.createElement("div", {
    className: "not-zeile"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Trefferpunkte"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: 1,
    max: 9999,
    placeholder: "11",
    value: tp,
    onChange: e => setTp(e.target.value),
    onKeyDown: taste
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "R\xFCstungsklasse"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: 1,
    max: 40,
    placeholder: "13",
    value: ac,
    onChange: e => setAc(e.target.value),
    onKeyDown: taste
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Anzahl"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: 1,
    max: 20,
    value: anzahl,
    onChange: e => setAnzahl(e.target.value),
    onKeyDown: taste
  })))), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0
    }
  }, "Die Initiative wird gew\xFCrfelt. Leere Felder bedeuten 1 Trefferpunkt und R\xFCstungsklasse 10."), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: fertig
  }, "In den Kampf"))));
};
const SpontanWahl = ({
  enemies,
  laufend,
  onStarten,
  onAbbrechen
}) => {
  const [suche, setSuche] = React.useState('');
  const [gewaehlt, setGewaehlt] = React.useState([]);
  const q = suche.trim();
  const treffer = enemies.filter(e => !q || containsFold(e.name || '', q) || containsFold((e.tags || []).join(' '), q) || containsFold(e.type || '', q)).sort((a, b) => crRang(a.cr) - crRang(b.cr) || (a.name || '').localeCompare(b.name || '', 'de')).slice(0, q ? 25 : 15);
  const hinzu = e => setGewaehlt(g => {
    const drin = g.find(x => x.enemyId === e.id);
    return drin ? g.map(x => x.enemyId === e.id ? {
      ...x,
      count: x.count + 1
    } : x) : [...g, {
      enemyId: e.id,
      count: 1,
      name: e.name
    }];
  });
  const anzahlSetzen = (id, n) => setGewaehlt(g => g.map(x => x.enemyId === id ? {
    ...x,
    count: Math.max(1, n)
  } : x));
  const entfernen = id => setGewaehlt(g => g.filter(x => x.enemyId !== id));
  const gesamt = gewaehlt.reduce((s, x) => s + x.count, 0);
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onAbbrechen
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal spontan",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, laufend ? '⚡ Gegner in den Kampf holen' : '⚡ Spontaner Kampf'), gewaehlt.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "spontan-gewaehlt"
  }, gewaehlt.map(x => {
    const g = enemies.find(e => e.id === x.enemyId);
    return /*#__PURE__*/React.createElement("div", {
      className: "spontan-teil",
      key: x.enemyId
    }, /*#__PURE__*/React.createElement("span", {
      className: "spontan-teil-name"
    }, x.name, g && /*#__PURE__*/React.createElement("i", null, "HG ", g.cr, " \xB7 RK ", g.ac, " \xB7 ", g.hpMax, " TP")), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input spontan-zahl",
      min: 1,
      max: 30,
      wert: x.count,
      "aria-label": 'Anzahl ' + x.name,
      onWert: v => anzahlSetzen(x.enemyId, v)
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fx-del",
      title: "Entfernen",
      onClick: () => entfernen(x.enemyId)
    }, "\u2715"));
  })), /*#__PURE__*/React.createElement("input", {
    className: "form-input spontan-suche",
    value: suche,
    autoFocus: true,
    placeholder: enemies.length + ' Gegner durchsuchen…',
    "aria-label": "Gegner suchen",
    onChange: e => setSuche(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "spontan-treffer"
  }, treffer.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "spontan-leer"
  }, "Kein Gegner gefunden.") : treffer.map(e => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: e.id,
    className: "spontan-zeile",
    onClick: () => hinzu(e)
  }, /*#__PURE__*/React.createElement("span", {
    className: "spontan-bild"
  }, e.image ? /*#__PURE__*/React.createElement("img", {
    src: e.image,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC80")), /*#__PURE__*/React.createElement("span", {
    className: "spontan-text"
  }, /*#__PURE__*/React.createElement("b", null, e.name), /*#__PURE__*/React.createElement("i", null, e.size, " \xB7 ", e.type)), /*#__PURE__*/React.createElement("span", {
    className: "spontan-werte"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gegner-hg"
  }, "HG ", e.cr), "RK ", e.ac, " \xB7 ", e.hpMax, " TP")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    disabled: gesamt === 0,
    onClick: () => onStarten(gewaehlt)
  }, gesamt === 0 ? 'Noch nichts gewählt' : laufend ? gesamt + ' Gegner dazunehmen' : 'Kampf mit ' + gesamt + (gesamt === 1 ? ' Gegner' : ' Gegnern') + ' starten'))));
};

// ── Die Seitenspalte ─────────────────────────────────────────────
// Oben die Helden des Abenteuers mit ihrem Stand, unten die ganze
// Gegnersammlung mit einem Pluszeichen je Zeile. So kommt der Nachzuegler
// mit einem Klick in den Kampf, ohne Umweg ueber ein Fenster.
const KampfSeite = ({
  helden,
  setDefs,
  enemies,
  imKampf,
  ueberlagert,
  onZu,
  onGegnerDazu,
  onHeldDazu
}) => {
  const [suche, setSuche] = React.useState('');
  const q = suche.trim();
  const treffer = enemies.filter(e => !q || containsFold(e.name || '', q) || containsFold((e.tags || []).join(' '), q) || containsFold(e.type || '', q)).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de')).slice(0, 200);
  return /*#__PURE__*/React.createElement("aside", {
    className: "kampf-seite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-kopf"
  }, /*#__PURE__*/React.createElement("span", null, "\u2694 Helden"), ueberlagert ? /*#__PURE__*/React.createElement("button", {
    className: "kampf-seite-zu",
    onClick: onZu,
    "aria-label": "Spalte schlie\xDFen"
  }, "\u2715") : /*#__PURE__*/React.createElement("span", {
    className: "kampf-seite-rechts"
  }, "im Kampf")), /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-helden"
  }, helden.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-leer"
  }, "Kein Held im Abenteuer."), helden.map(h => {
    const w = charWerte(h, setDefs);
    const gesamt = Math.max(1, w.maxHp || 1);
    const anteil = Math.max(0, Math.min(1, (w.hp || 0) / gesamt));
    const farbe = anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a';
    const drin = imKampf.has(h.id);
    return /*#__PURE__*/React.createElement("div", {
      className: 'kampf-seite-held' + (drin ? '' : ' draussen'),
      key: h.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "kampf-seite-figur"
    }, h.portrait ? /*#__PURE__*/React.createElement("img", {
      src: h.portrait,
      alt: ""
    }) : /*#__PURE__*/React.createElement("span", null, "\uD83D\uDEE1")), /*#__PURE__*/React.createElement("div", {
      className: "kampf-seite-text"
    }, /*#__PURE__*/React.createElement("b", null, h.name), /*#__PURE__*/React.createElement("i", null, h.charClass, " ", h.level, " \xB7 AC ", w.ac), /*#__PURE__*/React.createElement("div", {
      className: "kampf-balken klein"
    }, /*#__PURE__*/React.createElement("div", {
      className: "kampf-balken-fuell",
      style: {
        width: anteil * 100 + '%',
        background: farbe
      }
    })), (w.tempHp || 0) > 0 && /*#__PURE__*/React.createElement("span", {
      className: "kampf-temp"
    }, "+", w.tempHp, " Temp HP")), /*#__PURE__*/React.createElement("div", {
      className: "kampf-seite-zahl"
    }, /*#__PURE__*/React.createElement("b", {
      style: {
        color: farbe
      }
    }, (w.hp || 0) + (w.tempHp || 0)), "/", w.maxHp, !drin && /*#__PURE__*/React.createElement("button", {
      className: "kampf-seite-plus",
      title: "In den Kampf holen",
      onClick: () => onHeldDazu(h)
    }, "+")));
  })), /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-kopf gegner"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC80 Gegner"), /*#__PURE__*/React.createElement("span", {
    className: "kampf-seite-rechts"
  }, enemies.length)), /*#__PURE__*/React.createElement("input", {
    className: "kampf-seite-suche",
    value: suche,
    placeholder: "\uD83D\uDD0D Suchen\u2026",
    "aria-label": "Gegner suchen",
    onChange: e => setSuche(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-gegner"
  }, enemies.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-leer"
  }, "Noch keine Gegner. Unter \uD83D\uDCDA Datenbank \u203A \uD83D\uDC80 Gegner eine Sammlung einlesen.") : treffer.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-leer"
  }, "Kein Gegner gefunden.") : treffer.map(e => /*#__PURE__*/React.createElement("div", {
    className: "kampf-seite-gzeile",
    key: e.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "kampf-seite-gtext"
  }, /*#__PURE__*/React.createElement("b", null, e.name), /*#__PURE__*/React.createElement("i", null, "HP ", e.hpMax, " \xB7 AC ", e.ac)), /*#__PURE__*/React.createElement("button", {
    className: "kampf-seite-plus",
    title: e.name + ' dazunehmen',
    "aria-label": e.name + ' dazunehmen',
    onClick: () => onGegnerDazu(e)
  }, "+")))));
};

// ── Der Kampf ────────────────────────────────────────────────────
const KampfAnsicht = ({
  kampf,
  setKampf,
  enemies,
  encounters,
  helden,
  setDefs,
  abenteuer,
  advId,
  ansagen,
  onAnsageWeg,
  onSchliessen,
  onGegnerBlatt,
  onFrage,
  onHeldAendern,
  heldNotizen,
  onHeldNotiz,
  onHeldNotizSichern
}) => {
  const [zustandOffen, setZustandOffen] = React.useState(null);
  const [detailOffen, setDetailOffen] = React.useState(null);
  const [spontan, setSpontan] = React.useState(false);
  const [begegnungOffen, setBegegnungOffen] = React.useState(false);
  const [nothelferOffen, setNothelferOffen] = React.useState(false);
  const [protokollOffen, setProtokollOffen] = React.useState(false);
  const [protokollTab, setProtokollTab] = React.useState('jetzt');
  // Zaehlt jeden beendeten Kampf mit. Er steht am Archiv als Schluessel,
  // damit es nach einem Ende neu aus dem Speicher liest.
  const [archivStand, setArchivStand] = React.useState(0);
  const [mitZahlen, setMitZahlen] = React.useState(true);
  const [kopiert, setKopiert] = React.useState(false);
  const [wertDlg, setWertDlg] = React.useState(null); // {id, modus}
  const [zugFenster, setZugFenster] = React.useState(null); // {id, ansage}
  const [ansagenOffen, setAnsagenOffen] = React.useState(false);
  // Auf dem Telefon traegt jede Zeile sonst ihren ganzen Tastenblock —
  // fuenf Figuren sind dann fast zwei Bildschirme, ohne dass man die
  // Reihenfolge sieht. Aufgeklappt ist, wer dran ist, und was man antippt.
  const [zeileOffen, setZeileOffen] = React.useState(null);
  const [mehrOffen, setMehrOffen] = React.useState(false);
  // Am schmalen Schirm liegt die Seitenspalte uebereinander statt daneben.
  const [seiteOffen, setSeiteOffen] = React.useState(false);

  // Der Tracker geht in der Vorbereitung auf: die Helden stehen schon da,
  // Gegner und Initiativen kommen dazu. Frueher stand hier eine Startseite
  // mit der Begegnungsliste — die war im Weg, weil der haeufigste Fall
  // keiner Begegnung entspricht: die Gruppe laeuft in etwas hinein, und
  // die Gegner kommen einzeln dazu. Wer eine vorbereitete Begegnung will,
  // laedt sie hier nach; aufgestellt ist dann alles.
  React.useEffect(() => {
    if (!kampf || !kampf.aktiv) {
      setKampf(kampfAufstellen({
        name: 'Kampf',
        enemies: []
      }, enemies, helden, setDefs));
    }
  }, []);

  // Bis v4.1 lag die Heldennotiz im Kampf und war mit ihm weg. Ein Kampf,
  // der jetzt noch offen ist, traegt seine Notizen also im alten Feld —
  // die werden einmalig herausgehoben, damit sie nicht doch noch
  // verlorengehen. Danach ist die Bibliothek die einzige Quelle.
  React.useEffect(() => {
    if (!kampf || !kampf.aktiv) return;
    const alt = kampf.teilnehmer.filter(t => t.art === 'held' && t.notiz && !(heldNotizen || {})[t.charId]);
    if (!alt.length) return;
    alt.forEach(t => onHeldNotiz(t.charId, t.notiz));
    setKampf(k => k && {
      ...k,
      teilnehmer: k.teilnehmer.map(t => t.art === 'held' ? {
        ...t,
        notiz: ''
      } : t)
    });
  }, []);

  // Wer am Zug ist, gehoert ins Protokoll — und zwar gleich, wodurch er
  // es wurde. Am Knopf "Naechster Zug" zu haengen liess genau die Faelle
  // aus, in denen niemand ihn drueckt: die allererste Runde, das
  // Wuerfeln der Initiative, ein Nachzuegler, der sich davorschiebt, eine
  // Figur, die aus der Reihe genommen wird. Deshalb haengt der Eintrag am
  // Zustand.
  //
  // Der Schluessel ist Runde und Figur zusammen: dieselbe Figur in der
  // naechsten Runde ist ein neuer Zug, dieselbe Figur nach dem dritten
  // Neuzeichnen nicht.
  const dranRoh = kampf && kampf.aktiv && !inVorbereitung(kampf) ? kampf.teilnehmer[kampf.zug] : null;
  const zugSchluessel = dranRoh ? kampf.runde + ':' + dranRoh.id : null;
  const zuletztAmZug = React.useRef(undefined);
  if (zuletztAmZug.current === undefined) {
    // Beim Oeffnen eines laufenden Kampfes steht schon im Protokoll, wer
    // dran ist. Ohne diese Zeile stuende es nach jedem Aufklappen erneut da.
    const frueher = [...(kampf && kampf.log || [])].reverse().find(e => e.art === 'zug');
    zuletztAmZug.current = frueher ? frueher.r + ':' + frueher.id : null;
  }
  React.useEffect(() => {
    if (!zugSchluessel || zuletztAmZug.current === zugSchluessel) return;
    zuletztAmZug.current = zugSchluessel;
    const c = dranRoh.art === 'held' ? helden.find(h => h.id === dranRoh.charId) : null;
    const name = c ? c.name : dranRoh.name || '';
    const unter = c ? (c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level : '';
    protokollieren({
      art: 'zug',
      id: dranRoh.id,
      wer: name + (unter ? ' (' + unter + ')' : '')
    });
  }, [zugSchluessel]);

  // Ein Bild lang gibt es noch keinen Kampf — der Effekt oben stellt ihn
  // auf. Etwas anzuzeigen, das sofort wieder verschwindet, waere Flackern.
  if (!kampf || !kampf.aktiv) return null;

  // Alles, was aus dem Bogen kommt, wird bei jedem Rendern neu gelesen:
  // Ruestungsklasse, Trefferpunkte, Immunitaeten, Rettungswuerfe. Legt ein
  // Held mitten im Kampf einen Schild an, steht seine RK hier sofort
  // richtig — und was hier eingetragen wird, steht dort sofort.
  const liste = kampf.teilnehmer.map(t => {
    if (t.art !== 'held') return t;
    const c = helden.find(h => h.id === t.charId);
    if (!c) return {
      ...t,
      fehlt: true,
      name: t.name || 'Fehlt',
      hp: 0,
      hpMax: 1,
      ac: 10
    };
    const w = charWerte(c, setDefs);
    return {
      ...t,
      name: c.name,
      unterzeile: (c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level,
      ac: w.ac,
      hpMax: w.maxHp,
      hp: w.hp,
      tempHp: w.tempHp,
      dex: w.dex,
      tempMaxHp: +c.tempMaxHp || 0,
      deathSaves: c.deathSaves || TODES_LEER,
      notiz: (heldNotizen || {})[c.id] || '',
      bild: c.portrait || null,
      passive: w.passive,
      saves: w.saves,
      effekte: w.effekte,
      flags: w.flags.map(f => f.label)
    };
  });
  const amZug = liste[kampf.zug] || null;
  const imKampf = new Set(kampf.teilnehmer.filter(t => t.art === 'held').map(t => t.charId));

  // Was zum Kampf gehoert, bleibt im Kampf.
  const aendernKampf = (id, fn) => setKampf(k => ({
    ...k,
    teilnehmer: k.teilnehmer.map(t => t.id === id ? fn(t) : t)
  }));

  // Eine Zeile ins Protokoll. Die Runde kommt aus dem Kampf selbst, nicht
  // aus dem Aufrufer — sonst stuende ein Eintrag in der falschen Runde,
  // wenn er im selben Atemzug mit dem Zugwechsel kommt.
  // In der Vorbereitung schreibt sie nichts: was dort geschieht — Gegner
  // aufstellen, Initiativen eintragen, einem Helden die Trefferpunkte
  // richtigstellen — ist kein Teil des Kampfes und stuende sonst schon
  // in Runde 1, bevor der Kampf begonnen hat.
  const protokollieren = eintrag => setKampf(k => !k || inVorbereitung(k) ? k : {
    ...k,
    log: [...(k.log || []), {
      ...eintrag,
      r: k.runde
    }]
  });
  // Dasselbe fuer die beiden Stellen, die gleich mehrere Zeilen schreiben.
  const mitLog = (k, eintraege) => inVorbereitung(k) ? k : {
    ...k,
    log: [...(k.log || []), ...eintraege]
  };

  // Was zum Helden gehoert, geht in den Bogen — sofort, nicht am Ende.
  const aendernWerte = (id, fn, eintrag) => {
    const t = liste.find(x => x.id === id);
    if (!t || t.fehlt) return;
    const neu = fn(t);

    // Erst notieren, was geschehen ist — mit dem Stand davor und danach.
    if (eintrag) {
      if (eintrag.art === 'todes') {
        const d = neu.deathSaves || TODES_LEER;
        protokollieren({
          art: 'todes',
          wer: t.name,
          erfolge: d.erfolge || 0,
          fehler: d.fehler || 0,
          lage: todesStand(d)
        });
      } else {
        protokollieren({
          ...eintrag,
          wer: t.name,
          von: t.hp || 0,
          auf: neu.hp || 0
        });
      }
    }
    // Und die beiden Augenblicke, die man spaeter nachliest.
    if ((t.hp || 0) > 0 && (neu.hp || 0) <= 0) protokollieren({
      art: 'nieder',
      wer: t.name
    });
    if ((t.hp || 0) <= 0 && (neu.hp || 0) > 0) protokollieren({
      art: 'auf',
      wer: t.name,
      auf: neu.hp
    });
    if (t.art === 'held') {
      const p = {
        hp: neu.hp,
        tempHp: neu.tempHp
      };
      if (neu.tempMaxHp !== undefined) p.tempMaxHp = neu.tempMaxHp;
      if (neu.deathSaves !== undefined) p.deathSaves = neu.deathSaves;
      // Wer wieder ueber null steht, wuerfelt nicht mehr ums Ueberleben.
      if (neu.hp > 0) p.deathSaves = TODES_LEER;
      onHeldAendern(t.charId, p, t.name);
    } else {
      aendernKampf(id, fn);
    }
  };
  const schaden = (t, n) => {
    // Temporäre Punkte fangen zuerst — so steht es im Regelwerk.
    const vomTemp = Math.min(t.tempHp || 0, n);
    return {
      ...t,
      tempHp: (t.tempHp || 0) - vomTemp,
      hp: Math.max(0, (t.hp || 0) - (n - vomTemp))
    };
  };
  const heilen = (t, n) => ({
    ...t,
    hp: Math.min(t.hpMax, Math.max(0, (t.hp || 0) + n))
  });
  const temp = (t, n) => ({
    ...t,
    tempHp: Math.max(0, n < 0 ? (t.tempHp || 0) + n : Math.max(t.tempHp || 0, n))
  });

  // Auf der Karte: die kleinen Schritte ohne Fenster.
  // "extra" traegt mit, was aus dem Zugfenster kommt und in die Zeile
  // gehoert — heute die Aufteilung des Schadens nach Arten.
  const wertDirekt = (id, modus, n, extra) => {
    if (modus === 'schaden') aendernWerte(id, t => schaden(t, n), {
      art: 'schaden',
      wert: n,
      ...(extra || {})
    });
    if (modus === 'heilung') aendernWerte(id, t => heilen(t, n), {
      art: 'heilung',
      wert: n,
      ...(extra || {})
    });
  };

  // Was im Zugfenster steht, geht denselben Weg wie alles andere: erst die
  // Zeilen ins Protokoll, dann die Werte durch wertDirekt in die Boegen.
  // Kein zweiter Rechenweg, der auseinanderlaufen kann.
  const zugAnwenden = ({
    eintraege,
    treffer,
    platz,
    verbrauch
  }, weiter, ansageId) => {
    // Was eingetragen ist, muss nicht mehr angesagt bleiben.
    if (ansageId && onAnsageWeg) onAnsageWeg(ansageId);
    if (!weiter) setZugFenster(null);else setZugFenster(z => z && {
      id: z.id
    });
    (eintraege || []).forEach(e => protokollieren(e));
    (treffer || []).forEach(({
      id,
      modus,
      n,
      teile,
      minderung
    }) => wertDirekt(id, modus, n, teile || minderung ? {
      teile,
      minderung
    } : null));
    // Der Zauberplatz gehoert in den Bogen, nicht in den Kampf.
    if (platz) {
      const c = helden.find(h => h.id === platz.charId);
      if (c) {
        const alt = (c.spellSlots || {})[platz.grad] || {
          max: 0,
          used: 0
        };
        onHeldAendern(platz.charId, {
          spellSlots: {
            ...(c.spellSlots || {}),
            [platz.grad]: {
              ...alt,
              used: Math.min(+alt.max || 0, (+alt.used || 0) + 1)
            }
          }
        }, c.name);
      }
    }
    // Ebenso der verbrauchte Gegenstand. Bei null bleibt er im Inventar
    // stehen — leer, aber auffindbar; nachgefuellt wird im Bogen.
    if (verbrauch) {
      const c = helden.find(h => h.id === verbrauch.charId);
      if (c) {
        onHeldAendern(verbrauch.charId, {
          inventory: (c.inventory || []).map(i => i.id === verbrauch.itemId ? {
            ...i,
            qty: Math.max(0, (+i.qty || 0) - 1)
          } : i)
        }, c.name);
      }
    }
  };
  const fensterAnwenden = n => {
    const {
      id,
      modus
    } = wertDlg;
    setWertDlg(null);
    if (!n) return;
    if (modus === 'schaden') aendernWerte(id, t => n > 0 ? schaden(t, n) : heilen(t, -n), n > 0 ? {
      art: 'schaden',
      wert: n
    } : {
      art: 'heilung',
      wert: -n
    });
    if (modus === 'heilung') aendernWerte(id, t => n > 0 ? heilen(t, n) : schaden(t, -n), n > 0 ? {
      art: 'heilung',
      wert: n
    } : {
      art: 'schaden',
      wert: -n
    });
    if (modus === 'temp') aendernWerte(id, t => temp(t, n), {
      art: 'temp',
      wert: n
    });
    if (modus === 'maxtemp') aendernWerte(id, t => ({
      ...t,
      tempMaxHp: Math.max(0, (t.tempMaxHp || 0) + n)
    }), {
      art: 'maxtemp',
      wert: n
    });
    // Sinkt die Obergrenze unter den aktuellen Stand, sinkt der Stand mit.
    if (modus === 'maxhp') {
      const ziel = liste.find(x => x.id === id);
      if (ziel) protokollieren({
        art: 'maxhp',
        wer: ziel.name,
        wert: n
      });
      aendernKampf(id, t => {
        const m = Math.max(1, (t.hpMax || 1) + n);
        return {
          ...t,
          hpMax: m,
          hp: Math.min(t.hp, m)
        };
      });
    }
  };
  const zustand = (id, z) => {
    const t = liste.find(x => x.id === id);
    if (t) protokollieren({
      art: 'zustand',
      wer: t.name,
      was: z,
      an: !(t.zustaende || []).includes(z)
    });
    aendernKampf(id, t2 => ({
      ...t2,
      zustaende: (t2.zustaende || []).includes(z) ? (t2.zustaende || []).filter(x => x !== z) : [...(t2.zustaende || []), z]
    }));
  };
  const marke = (id, k) => {
    const t = liste.find(x => x.id === id);
    if (t) protokollieren({
      art: 'marke',
      wer: t.name,
      was: k === 'vorteil' ? 'Vorteil' : 'Nachteil',
      an: !t[k]
    });
    aendernKampf(id, t2 => ({
      ...t2,
      [k]: !t2[k]
    }));
  };
  const erschoepfung = (id, stufe) => {
    const t = liste.find(x => x.id === id);
    const neu = Math.max(0, Math.min(6, stufe));
    if (t && (t.erschoepfung || 0) !== neu) protokollieren({
      art: 'ersch',
      wer: t.name,
      wert: neu
    });
    aendernKampf(id, t2 => ({
      ...t2,
      erschoepfung: neu
    }));
  };
  // Die Notiz zu einem Helden gehoert zu ihm, nicht zu diesem Kampf —
  // deshalb denselben Weg wie die Trefferpunkte: hinaus aus dem Kampf.
  const notiz = (id, v) => {
    const t = liste.find(x => x.id === id);
    if (t && t.art === 'held' && !t.fehlt) onHeldNotiz(t.charId, v);else aendernKampf(id, alt => ({
      ...alt,
      notiz: v
    }));
  };

  // Der Kampf speichert von Helden nur, was zum Kampf gehoert — zum
  // Sortieren fehlt dort die Geschicklichkeit. Sie kommt fuer den
  // Vergleich aus dem Bogen und wird nicht mitgespeichert.
  const heldDex = t => {
    if (t.art !== 'held') return t.dex || 10;
    const c = helden.find(h => h.id === t.charId);
    return c ? charWerte(c, setDefs).dex : 10;
  };
  const heldName = t => {
    if (t.art !== 'held') return t.name || '';
    const c = helden.find(h => h.id === t.charId);
    return c ? c.name : t.name || '';
  };
  // Sortiert die rohen Eintraege und behaelt sie roh: sortiert wird auf
  // einer angereicherten Kopie, zurueck kommen die Originale.
  const sortiereRoh = teilnehmer => {
    const reihe = sortiereNachIni(teilnehmer.map(t => ({
      ...t,
      dex: heldDex(t),
      name: heldName(t)
    })));
    return reihe.map(x => teilnehmer.find(t => t.id === x.id));
  };
  const neuOrdnen = (k, teilnehmer) => {
    const dranId = k.teilnehmer[k.zug] && k.teilnehmer[k.zug].id;
    const reihe = sortiereRoh(teilnehmer);
    return {
      ...k,
      teilnehmer: reihe,
      zug: Math.max(0, reihe.findIndex(t => t.id === dranId))
    };
  };
  const ini = (id, v) => setKampf(k => {
    const n = v === '' ? null : parseInt(v, 10);
    return neuOrdnen(k, k.teilnehmer.map(t => t.id === id ? {
      ...t,
      ini: Number.isFinite(n) ? n : null
    } : t));
  });
  const entfernen = id => setKampf(k => {
    const raus = k.teilnehmer.find(t => t.id === id);
    const idx = k.teilnehmer.findIndex(t => t.id === id);
    const teilnehmer = k.teilnehmer.filter(t => t.id !== id);
    const zug = idx < k.zug ? Math.max(0, k.zug - 1) : Math.min(k.zug, Math.max(0, teilnehmer.length - 1));
    return mitLog({
      ...k,
      teilnehmer,
      zug
    }, [{
      art: 'weg',
      r: k.runde,
      wer: raus && (heldName(raus) || raus.name) || 'Jemand'
    }]);
  });
  const dazu = neue => setKampf(k => mitLog(neuOrdnen(k, [...k.teilnehmer, ...neue]), neue.map(t => ({
    art: 'dazu',
    r: k.runde,
    wer: heldName(t) || t.name,
    hp: t.hpMax,
    ac: t.ac
  }))));

  // Eine vorbereitete Begegnung in den laufenden Kampf. Steht noch kein
  // Gegner drin und heisst der Kampf noch wie der leere, uebernimmt er den
  // Namen der Begegnung — das ist der Fall, in dem der Tracker gerade erst
  // aufgegangen ist.
  const begegnungLaden = b => {
    setBegegnungOffen(false);
    const neue = gegnerAusBegegnung(b, enemies);
    if (!neue.length) return;
    setKampf(k => {
      const leer = !k.teilnehmer.some(t => t.art === 'gegner');
      return neuOrdnen({
        ...k,
        name: leer && b.name ? b.name : k.name
      }, [...k.teilnehmer, ...neue]);
    });
  };

  // ── Vorbereitung → Kampf → Vorbereitung ────────────────────────
  // Der Start macht aus der Aufstellung Runde 1. Von hier an zaehlt die
  // Runde, und das Protokoll faengt an mitzuschreiben.
  const starten = () => {
    zuletztAmZug.current = null; // der erste am Zug gehoert hinein
    setKampf(k => ({
      ...k,
      phase: 'kampf',
      runde: 1,
      zug: 0,
      teilnehmer: sortiereRoh(k.teilnehmer),
      log: [{
        art: 'start',
        r: 1,
        wer: k.name || 'Kampf'
      }]
    }));
  };

  // Das Ende fuehrt nicht hinaus, sondern zurueck an den Anfang: der
  // Verlauf wandert ins Gesamtprotokoll, die Gegner sind erledigt, die
  // Helden stehen wieder bereit. Am Tisch folgt auf einen Kampf meistens
  // der naechste, nicht das Heldenbuch.
  const beenden = () => onFrage('Kampf beenden? Der Verlauf wandert ins Gesamtprotokoll, die Trefferpunkte ' + 'stehen schon in den Bögen. Danach steht wieder die Vorbereitung da — ' + 'ohne Gegner, ohne Initiativen.', () => {
    const eigen = (kampf.log || []).filter(e => e.art !== 'start');
    if (eigen.length) {
      archivLegen({
        id: 'kl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        name: kampf.name || 'Kampf',
        zeit: Date.now(),
        runden: kampf.runde,
        abenteuer: ((abenteuer || []).find(a => a.id === advId) || {}).name || '',
        log: kampf.log || []
      });
      setArchivStand(n => n + 1);
    }
    zuletztAmZug.current = null;
    setKampf(kampfAufstellen({
      name: 'Kampf',
      enemies: []
    }, enemies, helden, setDefs));
  }, 'Beenden');
  const naechster = () => setKampf(k => {
    if (!k.teilnehmer.length) return k;
    const naechsterZug = k.zug + 1;
    return naechsterZug >= k.teilnehmer.length ? {
      ...k,
      zug: 0,
      runde: k.runde + 1
    } : {
      ...k,
      zug: naechsterZug
    };
  });

  // Wuerfelt nur fuer die, bei denen noch nichts steht — eine angesagte
  // Zahl wird nicht ueberschrieben.
  const alleIni = () => setKampf(k => neuOrdnen(k, k.teilnehmer.map(t => t.ini !== null ? t : {
    ...t,
    ini: w20() + mod(heldDex(t))
  })));
  const protokollKopieren = async () => {
    if (!(await inZwischenablage(protokollText(kampf, mitZahlen)))) return;
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };
  const ohneIni = liste.filter(t => t.ini === null).length;
  const dlgZiel = wertDlg && liste.find(t => t.id === wertDlg.id);
  const zugZiel = zugFenster && liste.find(t => t.id === zugFenster.id);
  // Alles, was seit dem letzten Zugwechsel im Protokoll steht — das
  // Fenster zeigt es an, damit man den ganzen Zug vor sich hat.
  const bisherImZug = (() => {
    const log = kampf.log || [];
    let i = log.length - 1;
    while (i >= 0 && log[i].art !== 'zug') i--;
    return i < 0 ? [] : log.slice(i + 1);
  })();
  const vorbereitung = inVorbereitung(kampf);
  // Der Knopf laesst sich je Abenteuer abschalten — fuer Runden, die ohne
  // Mitschrift spielen. Ohne Eintrag ist er da.
  const advObj = (abenteuer || []).find(a => a.id === advId) || null;
  const zugfensterAn = !advObj || advObj.zugfenster !== false;
  // Zeigt das Abenteuer den Kampf erst auf Ansage, braucht die
  // Spielleitung einen Knopf dafuer. Bei "von allein" und "gar nicht"
  // gibt es nichts zu druecken.
  const sichtAnsage = !!advObj && advObj.kampfSicht === 'ansage';
  const zahlHelden = liste.filter(t => t.art === 'held').length;
  const zahlGegner = liste.length - zahlHelden;
  return /*#__PURE__*/React.createElement("div", {
    className: 'kampf-schirm' + (seiteOffen ? ' seite-offen' : '') + (vorbereitung ? ' vorbereitung' : '')
  }, /*#__PURE__*/React.createElement(KampfSeite, {
    helden: helden,
    setDefs: setDefs,
    enemies: enemies,
    imKampf: imKampf,
    ueberlagert: seiteOffen,
    onZu: () => setSeiteOffen(false),
    onGegnerDazu: e => {
      dazu([gegnerAusVorlage(e)]);
      setSeiteOffen(false);
    },
    onHeldDazu: h => {
      dazu([{
        id: 'held-' + h.id,
        art: 'held',
        charId: h.id,
        ini: null,
        zustaende: [],
        erschoepfung: 0,
        notiz: '',
        vorteil: false,
        nachteil: false
      }]);
      setSeiteOffen(false);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "kampf-haupt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-kopf"
  }, /*#__PURE__*/React.createElement("button", {
    className: "kampf-seite-knopf",
    onClick: () => setSeiteOffen(true),
    title: "Helden und Gegner",
    "aria-label": "Helden und Gegner"
  }, "\u2630"), /*#__PURE__*/React.createElement("div", {
    className: "kampf-titel"
  }, "\u2694 ", kampf.name), vorbereitung ? /*#__PURE__*/React.createElement("div", {
    className: "kampf-phase"
  }, "Vorbereitung") : /*#__PURE__*/React.createElement("div", {
    className: "kampf-runde"
  }, /*#__PURE__*/React.createElement("span", null, "Runde"), /*#__PURE__*/React.createElement("b", null, kampf.runde)), /*#__PURE__*/React.createElement("div", {
    className: "kampf-dran"
  }, vorbereitung ? /*#__PURE__*/React.createElement(React.Fragment, null, "Aufgestellt: ", /*#__PURE__*/React.createElement("b", null, zahlHelden), " ", zahlHelden === 1 ? 'Held' : 'Helden', ",", ' ', /*#__PURE__*/React.createElement("b", null, zahlGegner), " ", zahlGegner === 1 ? 'Gegner' : 'Gegner') : amZug ? /*#__PURE__*/React.createElement(React.Fragment, null, "Am Zug: ", /*#__PURE__*/React.createElement("b", null, amZug.name)) : 'Niemand am Zug'), /*#__PURE__*/React.createElement("button", {
    className: "kampf-mehr-knopf",
    onClick: () => setMehrOffen(o => !o),
    "aria-expanded": mehrOffen,
    title: "Weitere Handgriffe"
  }, "\u22EF"), /*#__PURE__*/React.createElement("div", {
    className: 'kampf-kopf-mehr' + (mehrOffen ? ' offen' : '')
  }, /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn",
    onClick: alleIni,
    title: "F\xFCr alle ohne Zahl w\xFCrfeln"
  }, "\uD83C\uDFB2 Alle Init."), /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn zusatz",
    onClick: () => setSpontan(true),
    title: "Gegner nachtr\xE4glich dazunehmen"
  }, "\u26A1 Gegner"), /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn zusatz",
    onClick: () => setBegegnungOffen(true),
    title: "Eine vorbereitete Begegnung dazuladen"
  }, "\uD83D\uDCCB Begegnung"), /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn zusatz",
    onClick: () => setNothelferOffen(true),
    title: "Gegner aus dem Stegreif: Name, Trefferpunkte, R\xFCstungsklasse"
  }, "\u271A Nothelfer"), sichtAnsage && !vorbereitung && /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn sicht" + (kampf.gezeigt ? " an" : ""),
    onClick: () => setKampf(k => k && {
      ...k,
      gezeigt: !k.gezeigt
    }),
    title: kampf.gezeigt ? 'Die Runde sieht die Initiativliste und wie es den Figuren geht — nie die Zahlen der Gegner' : 'Der Runde zeigen: Reihenfolge, wer am Zug ist, wie es den Figuren geht'
  }, kampf.gezeigt ? '👁 Gezeigt' : '👁 Zeigen'), (ansagen || []).length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn ansage" + (ansagenOffen ? " an" : ""),
    onClick: () => setAnsagenOffen(o => !o),
    title: "Was die Runde angesagt hat"
  }, "\uD83D\uDCE3 Ansagen \xB7 ", (ansagen || []).length), /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn zusatz" + (protokollOffen ? " an" : ""),
    onClick: () => setProtokollOffen(o => !o),
    title: "Was in diesem Kampf geschehen ist"
  }, "\uD83D\uDCDC Protokoll", !vorbereitung && (kampf.log || []).length > 1 ? ' · ' + (kampf.log || []).length : ''), !vorbereitung && /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-btn ende",
    onClick: beenden
  }, "\u23F9 Kampf beenden")), vorbereitung ? /*#__PURE__*/React.createElement("button", {
    className: "kampf-weiter start",
    onClick: starten,
    disabled: !liste.length,
    title: liste.length ? 'Runde 1 beginnt — ab hier schreibt das Protokoll mit' : 'Erst jemanden aufstellen'
  }, "\u25B6 Kampf starten") : /*#__PURE__*/React.createElement("button", {
    className: "kampf-weiter",
    onClick: naechster
  }, "N\xE4chster Zug \u25B6"), /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-x",
    onClick: onSchliessen,
    title: "Nur schlie\xDFen, der Kampf l\xE4uft weiter",
    "aria-label": "Kampftracker schlie\xDFen"
  }, "\u2715")), ansagenOffen && (ansagen || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "kampf-ansagen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-ansagen-kopf"
  }, "\uD83D\uDCE3 Angesagt \u2014 eintragen f\xFCllt das Zugfenster schon aus"), (ansagen || []).map(a => {
    const held = (helden || []).find(h => h.id === a.charId);
    const zeile = liste.find(x => x.art === 'held' && x.charId === a.charId);
    return /*#__PURE__*/React.createElement("div", {
      className: "kampf-ansage",
      key: a.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "ka-wer"
    }, held ? held.name : 'Jemand'), /*#__PURE__*/React.createElement("span", {
      className: "ka-was"
    }, a.was ? /*#__PURE__*/React.createElement("b", null, (AKTION_WORT[a.art] || 'Angriff') + ': ', a.was, a.grad ? ' · ' + a.grad + '. Grad' : '') : null, (a.ziele || []).length ? /*#__PURE__*/React.createElement("span", null, " \u2192 ", (a.ziele || []).join(', ')) : null, a.text ? /*#__PURE__*/React.createElement("i", null, "\u201E", a.text, "\u201C") : null), zeile && /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      title: "Ins Zugfenster \xFCbernehmen",
      onClick: () => {
        setAnsagenOffen(false);
        setZugFenster({
          id: zeile.id,
          ansage: a
        });
      }
    }, "\u270D Eintragen"), /*#__PURE__*/React.createElement("button", {
      className: "fx-del",
      title: "Erledigt, weg damit",
      onClick: () => onAnsageWeg && onAnsageWeg(a.id)
    }, "\u2715"));
  })), protokollOffen && /*#__PURE__*/React.createElement("div", {
    className: "kampf-protokoll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-protokoll-kopf"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kampf-protokoll-reiter"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: protokollTab === 'jetzt' ? 'an' : '',
    onClick: () => setProtokollTab('jetzt')
  }, "\uD83D\uDCDC Dieser Kampf"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: protokollTab === 'archiv' ? 'an' : '',
    onClick: () => setProtokollTab('archiv')
  }, "\uD83D\uDDC4 Fr\xFChere")), /*#__PURE__*/React.createElement("label", {
    className: "kampf-protokoll-schalter",
    title: "Ohne H\xE4kchen stehen nur die Betr\xE4ge da, nicht die Trefferpunktst\xE4nde"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: mitZahlen,
    onChange: e => setMitZahlen(e.target.checked)
  }), "Trefferpunkte"), protokollTab === 'jetzt' && /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: protokollKopieren
  }, kopiert ? '✓ Kopiert' : '📋 Kopieren')), protokollTab === 'jetzt' ? /*#__PURE__*/React.createElement("div", {
    className: "kampf-protokoll-text"
  }, vorbereitung ? /*#__PURE__*/React.createElement("i", null, "Der Kampf l\xE4uft noch nicht. Ab \u201EKampf starten\u201C steht hier, was geschieht \u2014 und beim Beenden wandert es unter \u201EFr\xFChere\u201C.") : (kampf.log || []).length <= 1 ? /*#__PURE__*/React.createElement("i", null, "Noch nichts geschehen. Was du eintr\xE4gst, steht hier.") : /*#__PURE__*/React.createElement(ProtokollZeilen, {
    log: kampf.log,
    mitZahlen: mitZahlen
  })) : /*#__PURE__*/React.createElement(KampfArchiv, {
    key: archivStand,
    mitZahlen: mitZahlen
  })), vorbereitung && /*#__PURE__*/React.createElement("div", {
    className: "kampf-vorband"
  }, /*#__PURE__*/React.createElement("b", null, "Vorbereitung."), " Gegner dazustellen, Initiativen eintragen, Helden ein- und ausladen. Die Runde l\xE4uft noch nicht \u2014 ins Protokoll kommt erst etwas, wenn der Kampf gestartet ist."), ohneIni > 0 && !vorbereitung && /*#__PURE__*/React.createElement("div", {
    className: "kampf-hinweis"
  }, ohneIni === 1 ? 'Bei einer Figur fehlt die Initiative' : 'Bei ' + ohneIni + ' Figuren fehlt die Initiative', " \u2014 sie stehen unten, bis die Zahl eingetragen ist. Links auf die Zahl tippen oder oben w\xFCrfeln lassen."), nothelferOffen && /*#__PURE__*/React.createElement(NothelferFenster, {
    onAbbrechen: () => setNothelferOffen(false),
    onAnlegen: (name, tp, ac, anzahl) => {
      setNothelferOffen(false);
      const neue = [];
      for (let i = 0; i < anzahl; i++) {
        neue.push(nothelferAnlegen(anzahl > 1 ? ((name || '').trim() || 'Gegner') + ' ' + (i + 1) : name, tp, ac));
      }
      dazu(neue);
    }
  }), begegnungOffen && /*#__PURE__*/React.createElement(BegegnungWahl, {
    encounters: encounters,
    enemies: enemies,
    advId: advId,
    onAbbrechen: () => setBegegnungOffen(false),
    onLaden: begegnungLaden
  }), spontan && /*#__PURE__*/React.createElement(SpontanWahl, {
    enemies: enemies,
    laufend: true,
    onAbbrechen: () => setSpontan(false),
    onStarten: auswahl => {
      setSpontan(false);
      const frisch = [];
      auswahl.forEach(({
        enemyId,
        count
      }) => {
        const v = enemies.find(e => e.id === enemyId);
        if (!v) return;
        const n = Math.max(1, +count || 1);
        for (let i = 0; i < n; i++) frisch.push(gegnerAusVorlage(v, n > 1 ? v.name + ' ' + (i + 1) : v.name));
      });
      dazu(frisch);
    }
  }), wertDlg && dlgZiel && /*#__PURE__*/React.createElement(WertDialog, {
    modus: wertDlg.modus,
    name: dlgZiel.name,
    start: 0,
    onAbbrechen: () => setWertDlg(null),
    onAnwenden: fensterAnwenden
  }), zugZiel && /*#__PURE__*/React.createElement(ZugFenster, {
    t: zugZiel,
    liste: liste,
    helden: helden,
    setDefs: setDefs,
    klassen: advKlassen(advObj),
    runde: kampf.runde,
    bisher: bisherImZug,
    ansage: zugFenster.ansage,
    key: (zugFenster.ansage || {}).id || zugFenster.id,
    ansagen: ansagen,
    onAnsageWeg: onAnsageWeg,
    onAbbrechen: () => setZugFenster(null),
    onAnwenden: zugAnwenden
  }), /*#__PURE__*/React.createElement("div", {
    className: "kampf-liste"
  }, liste.map(t => /*#__PURE__*/React.createElement(KampfZeile, {
    key: t.id,
    t: t,
    dran: amZug && amZug.id === t.id,
    zustandOffen: zustandOffen,
    setZustandOffen: setZustandOffen,
    detailOffen: detailOffen,
    setDetailOffen: setDetailOffen,
    onWert: (modus, n) => wertDirekt(t.id, modus, n),
    onFenster: modus => setWertDlg({
      id: t.id,
      modus
    }),
    onZug: zugfensterAn ? () => setZugFenster({
      id: t.id
    }) : undefined,
    onIni: v => ini(t.id, v),
    onNotiz: v => notiz(t.id, v),
    onNotizFertig: t.art === 'held' ? onHeldNotizSichern : undefined,
    onZustand: z => zustand(t.id, z),
    onMarke: k => marke(t.id, k),
    onErschoepfung: st => erschoepfung(t.id, st),
    onTodes: d => aendernWerte(t.id, alt => ({
      ...alt,
      deathSaves: d
    }), {
      art: 'todes'
    }),
    onEntfernen: () => entfernen(t.id),
    onBlatt: onGegnerBlatt,
    auf: amZug && amZug.id === t.id || zeileOffen === t.id,
    onAufklappen: () => setZeileOffen(o => o === t.id ? null : t.id)
  })))));
};

// ==== js/src/2d-chronik.jsx ====
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
const EREIGNIS_ARTEN = [{
  k: 'frist',
  icon: '⏳',
  label: 'Frist',
  vorbei: 'ist abgelaufen'
}, {
  k: 'reise',
  icon: '🧭',
  label: 'Reise',
  vorbei: 'ist angekommen'
}, {
  k: 'termin',
  icon: '📅',
  label: 'Termin',
  vorbei: 'ist jetzt'
}];
const artInfo = k => EREIGNIS_ARTEN.find(a => a.k === k) || EREIGNIS_ARTEN[0];
const newEreignis = (advId, jetzt) => ({
  id: 'ev' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  adventure: advId || '',
  art: 'frist',
  name: '',
  ort: '',
  ziel: '',
  notiz: '',
  faellig: (jetzt || 0) + 3 * STD_TAG,
  // null = laeuft mit, ohne Frist
  wiederholung: 0,
  // Stunden; 0 = einmalig
  // {charId, art:'merkmal'|'effekt', …} — siehe chronikMerkmale()
  bindung: null,
  erledigt: false
});

// "3 Tage", "5 Std", "2 Tage 4 Std" — Stunden fallen weg, wo sie niemand
// eingetragen hat, damit die Anzeige nicht mit "0 Std" zugestellt wird.
const restText = std => {
  if (std <= 0) return 'fällig';
  const t = Math.floor(std / STD_TAG),
    r = std % STD_TAG;
  if (t && r) return t + (t === 1 ? ' Tag ' : ' Tage ') + r + ' Std';
  if (t) return t + (t === 1 ? ' Tag' : ' Tage');
  return r + ' Std';
};
const uhrTag = std => Math.floor((std || 0) / STD_TAG) + 1;
const uhrStunde = std => ((std || 0) % STD_TAG + STD_TAG) % STD_TAG;
const zeitDerUhr = (chronik, advId) => (chronik && chronik.zeit || {})[advId] || 0;
const ereignisseDerUhr = (chronik, advId) => (chronik && chronik.ereignisse || []).filter(e => !e.adventure || e.adventure === advId);

// Untertitel einer Zeile: bei Reisen die Strecke, sonst Ort oder Notiz.
const ereignisUnterzeile = e => {
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
    if (!b || b.art !== 'effekt' || !b.charId || !(b.effects || []).length) return;
    const abgelaufen = e.faellig != null && e.faellig <= jetzt;
    const gilt = b.sofort === false ? abgelaufen : !e.erledigt && !abgelaufen;
    if (!gilt) return;
    (soll[b.charId] = soll[b.charId] || []).push({
      id: CHR_PRAEFIX + e.id,
      name: e.name || 'Ereignis',
      source: 'Chronik',
      description: e.notiz || '',
      effects: b.effects,
      effectsActive: true
    });
  });
  return soll;
};
const istChronikMerkmal = f => String(f && f.id || '').indexOf(CHR_PRAEFIX) === 0;

// ── Die Leiste ───────────────────────────────────────────────────
const ChronikLeiste = ({
  chronik,
  advId,
  advName,
  chars,
  ueberlagert,
  onZeit,
  onNeu,
  onBearbeiten,
  onLoeschen,
  onAbhaken,
  onWiederOeffnen,
  onSchliessen
}) => {
  const [zeigeErledigt, setZeigeErledigt] = React.useState(false);
  const jetzt = zeitDerUhr(chronik, advId);
  const alle = ereignisseDerUhr(chronik, advId);
  const offen = alle.filter(e => !e.erledigt);
  const nachRest = (a, b) => a.faellig - b.faellig;
  const faellig = offen.filter(e => e.faellig != null && e.faellig <= jetzt).sort(nachRest);
  const laufend = offen.filter(e => e.faellig != null && e.faellig > jetzt).sort(nachRest);
  const ohneFrist = offen.filter(e => e.faellig == null).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
  const erledigt = alle.filter(e => e.erledigt).sort((a, b) => (b.erledigtBei || 0) - (a.erledigtBei || 0));
  const heldName = id => (chars.find(c => c.id === id) || {}).name || 'unbekannt';
  const Zeile = ({
    e,
    art
  }) => {
    const info = artInfo(e.art);
    const unter = ereignisUnterzeile(e);
    return /*#__PURE__*/React.createElement("div", {
      className: 'chr-ev' + (art === 'faellig' ? ' faellig' : '') + (art === 'erledigt' ? ' erledigt' : '')
    }, /*#__PURE__*/React.createElement("button", {
      className: "chr-ev-haupt",
      onClick: () => onBearbeiten(e),
      title: "Ereignis bearbeiten"
    }, /*#__PURE__*/React.createElement("span", {
      className: "chr-ev-icon"
    }, info.icon), /*#__PURE__*/React.createElement("span", {
      className: "chr-ev-text"
    }, /*#__PURE__*/React.createElement("b", null, e.name || '(ohne Namen)'), (unter || e.bindung) && /*#__PURE__*/React.createElement("i", null, unter, e.bindung && /*#__PURE__*/React.createElement("span", {
      className: "chr-ev-bindung",
      title: 'Schaltet ein Merkmal bei ' + heldName(e.bindung.charId)
    }, (unter ? ' · ' : '') + '⚡ ' + heldName(e.bindung.charId)))), /*#__PURE__*/React.createElement("span", {
      className: "chr-ev-rest"
    }, art === 'erledigt' ? 'Tag ' + uhrTag(e.erledigtBei) : e.faellig == null ? '—' : restText(e.faellig - jetzt), e.wiederholung > 0 && art !== 'erledigt' && /*#__PURE__*/React.createElement("i", null, "\u21BB"))), art === 'faellig' && /*#__PURE__*/React.createElement("button", {
      className: "chr-ev-ok",
      onClick: () => onAbhaken(e),
      title: "Abhaken"
    }, "\u2713"), art === 'erledigt' && /*#__PURE__*/React.createElement("button", {
      className: "chr-ev-ok",
      onClick: () => onWiederOeffnen(e),
      title: "Wieder aufnehmen"
    }, "\u21A9"), /*#__PURE__*/React.createElement("button", {
      className: "chr-ev-del",
      onClick: () => onLoeschen(e),
      "aria-label": 'Ereignis ' + (e.name || '') + ' löschen'
    }, "\u2715"));
  };
  return /*#__PURE__*/React.createElement("aside", {
    className: 'chronik' + (ueberlagert ? ' ueberlagert' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "chronik-kopf"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "chronik-titel"
  }, "\uD83D\uDD70 Chronik"), /*#__PURE__*/React.createElement("div", {
    className: "chronik-adv"
  }, advName)), /*#__PURE__*/React.createElement("button", {
    className: "chronik-zu",
    onClick: onSchliessen,
    "aria-label": "Chronik schlie\xDFen"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "chronik-uhr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chronik-uhr-zahl"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chronik-tag"
  }, "Tag ", uhrTag(jetzt)), /*#__PURE__*/React.createElement("span", {
    className: "chronik-stunde"
  }, uhrStunde(jetzt), " Uhr")), /*#__PURE__*/React.createElement("button", {
    className: "chronik-zeit-knopf",
    onClick: onZeit
  }, "\u23E9 Zeit vergeht")), /*#__PURE__*/React.createElement("div", {
    className: "chronik-rollen"
  }, offen.length === 0 && erledigt.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "chronik-leer"
  }, /*#__PURE__*/React.createElement("p", null, "Noch nichts eingetragen."), /*#__PURE__*/React.createElement("p", null, "Trag ein, was im Hintergrund l\xE4uft \u2014 eine Frist, eine Reise, ein Termin. Beim Weiterdrehen der Uhr rechnet sich alles von selbst ab.")), faellig.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "chronik-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chronik-block-titel faellig"
  }, "\u23F0 F\xE4llig"), faellig.map(e => /*#__PURE__*/React.createElement(Zeile, {
    key: e.id,
    e: e,
    art: "faellig"
  }))), laufend.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "chronik-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chronik-block-titel"
  }, "L\xE4uft"), laufend.map(e => /*#__PURE__*/React.createElement(Zeile, {
    key: e.id,
    e: e,
    art: "laufend"
  }))), ohneFrist.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "chronik-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chronik-block-titel"
  }, "Ohne Frist"), ohneFrist.map(e => /*#__PURE__*/React.createElement(Zeile, {
    key: e.id,
    e: e,
    art: "offen"
  }))), erledigt.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "chronik-block"
  }, /*#__PURE__*/React.createElement("button", {
    className: "chronik-block-titel klappbar",
    onClick: () => setZeigeErledigt(v => !v)
  }, (zeigeErledigt ? '▾ ' : '▸ ') + 'Vorbei (' + erledigt.length + ')'), zeigeErledigt && erledigt.map(e => /*#__PURE__*/React.createElement(Zeile, {
    key: e.id,
    e: e,
    art: "erledigt"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "chronik-fuss"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: onNeu
  }, "+ Ereignis")));
};

// ── Ereignis anlegen und ändern ──────────────────────────────────
const EreignisFormular = ({
  ereignis,
  chronik,
  advId,
  abenteuer,
  chars,
  neu,
  onAendern,
  onSpeichern,
  onAbbrechen
}) => {
  const e = ereignis;
  const setzen = p => onAendern({
    ...e,
    ...p
  });
  // Jede Kampagne hat ihre eigene Uhr, deshalb rechnet die Restzeit gegen
  // die Uhr des Abenteuers, an dem dieses Ereignis haengt — nicht gegen die
  // gerade offene.
  const jetzt = zeitDerUhr(chronik, e.adventure || advId);
  // Umhaengen laesst die Restzeit stehen und setzt die Faelligkeit auf die
  // andere Uhr um. Sonst spraenge "noch 3 Tage" auf "vor 40 Tagen".
  const abenteuerWechseln = neuAdv => {
    const rest = e.faellig == null ? null : Math.max(0, e.faellig - jetzt);
    onAendern({
      ...e,
      adventure: neuAdv,
      bindung: null,
      faellig: rest == null ? null : zeitDerUhr(chronik, neuAdv) + rest
    });
  };
  const ohneFrist = e.faellig == null;
  const rest = ohneFrist ? 0 : Math.max(0, e.faellig - jetzt);
  const restTage = Math.floor(rest / STD_TAG),
    restStd = rest % STD_TAG;
  const fristSetzen = (t, s) => setzen({
    faellig: jetzt + Math.max(0, t) * STD_TAG + Math.max(0, s)
  });

  // Nur Helden des Abenteuers, an das dieses Ereignis haengt — sonst steht
  // die halbe Kampagne im Auswahlfeld.
  const helden = chars.filter(c => !c.archived && (!e.adventure || !c.adventure || c.adventure === e.adventure));
  const b = e.bindung || {};
  const held = helden.find(c => c.id === b.charId);
  const merkmale = held && held.features || [];
  return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, neu ? '🕰 Neues Ereignis' : '✎ Ereignis bearbeiten'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid",
    style: {
      maxHeight: '62vh',
      overflowY: 'auto',
      paddingRight: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Art"), /*#__PURE__*/React.createElement("div", {
    className: "chr-art-wahl"
  }, EREIGNIS_ARTEN.map(a => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: a.k,
    className: 'chr-art' + (e.art === a.k ? ' aktiv' : ''),
    onClick: () => setzen({
      art: a.k
    })
  }, /*#__PURE__*/React.createElement("span", null, a.icon), a.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Was"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: e.name,
    autoFocus: true,
    onChange: ev => setzen({
      name: ev.target.value
    }),
    placeholder: e.art === 'reise' ? 'z.B. Ismark reitet nach Krezk' : e.art === 'termin' ? 'z.B. Fest des heiligen Andral' : 'z.B. Armins Finger wächst nach'
  })), e.art === 'reise' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Von"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: e.ort || '',
    onChange: ev => setzen({
      ort: ev.target.value
    }),
    placeholder: "Vallaki"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Nach"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: e.ziel || '',
    onChange: ev => setzen({
      ziel: ev.target.value
    }),
    placeholder: "Krezk"
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Wo (freiwillig)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: e.ort || '',
    onChange: ev => setzen({
      ort: ev.target.value
    }),
    placeholder: "Vallaki"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, e.art === 'reise' ? 'Reisezeit' : e.art === 'termin' ? 'Noch bis dahin' : 'Restzeit'), /*#__PURE__*/React.createElement("div", {
    className: "chr-frist"
  }, /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 999,
    disabled: ohneFrist,
    wert: restTage,
    "aria-label": "Tage",
    onWert: v => fristSetzen(v, restStd)
  }), /*#__PURE__*/React.createElement("span", null, "Tage"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 23,
    disabled: ohneFrist,
    wert: restStd,
    "aria-label": "Stunden",
    onWert: v => fristSetzen(restTage, v)
  }), /*#__PURE__*/React.createElement("span", null, "Std")), /*#__PURE__*/React.createElement("label", {
    className: "chr-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: ohneFrist,
    onChange: ev => setzen({
      faellig: ev.target.checked ? null : jetzt + STD_TAG
    })
  }), "Ohne Frist \u2014 l\xE4uft einfach mit"), !ohneFrist && /*#__PURE__*/React.createElement("div", {
    className: "chr-hinweis"
  }, "F\xE4llig an Tag ", uhrTag(e.faellig), ", ", uhrStunde(e.faellig), " Uhr.")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Wiederholt sich alle"), /*#__PURE__*/React.createElement("div", {
    className: "chr-frist"
  }, /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 365,
    wert: Math.round((e.wiederholung || 0) / STD_TAG),
    "aria-label": "Wiederholung in Tagen",
    onWert: v => setzen({
      wiederholung: v * STD_TAG
    })
  }), /*#__PURE__*/React.createElement("span", null, "Tage")), /*#__PURE__*/React.createElement("div", {
    className: "chr-hinweis"
  }, "0 = einmalig")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Abenteuer"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: e.adventure || advId,
    onChange: ev => abenteuerWechseln(ev.target.value)
  }, (abenteuer || []).map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Notiz f\xFCr dich"), /*#__PURE__*/React.createElement("textarea", {
    className: "form-input",
    rows: 2,
    style: {
      resize: 'vertical'
    },
    value: e.notiz || '',
    onChange: ev => setzen({
      notiz: ev.target.value
    }),
    placeholder: "Was du wissen musst, wenn es soweit ist."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full chr-bindung"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Wirkung auf einen Helden"), /*#__PURE__*/React.createElement("div", {
    className: "chr-bindung-reihe"
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: b.charId || '',
    onChange: ev => setzen({
      bindung: ev.target.value ? {
        ...b,
        charId: ev.target.value,
        art: b.art || 'merkmal',
        featureId: ''
      } : null
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keine \u2014"), helden.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))), b.charId && /*#__PURE__*/React.createElement("div", {
    className: "chr-art-wahl"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'chr-art' + (b.art !== 'effekt' ? ' aktiv' : ''),
    onClick: () => setzen({
      bindung: {
        ...b,
        art: 'merkmal',
        featureId: b.featureId || '',
        wirkung: b.wirkung || 'aus'
      }
    })
  }, /*#__PURE__*/React.createElement("span", null, "\u2B50"), "Merkmal umschalten"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'chr-art' + (b.art === 'effekt' ? ' aktiv' : ''),
    onClick: () => setzen({
      bindung: {
        ...b,
        art: 'effekt',
        effects: b.effects || [],
        sofort: b.sofort !== false
      }
    })
  }, /*#__PURE__*/React.createElement("span", null, "\u2726"), "Effekt setzen")), b.charId && b.art !== 'effekt' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: b.featureId || '',
    onChange: ev => setzen({
      bindung: {
        ...b,
        featureId: ev.target.value
      }
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Merkmal w\xE4hlen \u2014"), merkmale.map(f => /*#__PURE__*/React.createElement("option", {
    key: f.id,
    value: f.id
  }, f.name))), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: b.wirkung || 'aus',
    onChange: ev => setzen({
      bindung: {
        ...b,
        wirkung: ev.target.value
      }
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "aus"
  }, "abschalten, wenn die Frist abl\xE4uft"), /*#__PURE__*/React.createElement("option", {
    value: "an"
  }, "einschalten, wenn die Frist abl\xE4uft")), merkmale.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "chr-hinweis warn"
  }, "Dieser Held hat noch kein Merkmal, das man umschalten k\xF6nnte.")), b.charId && b.art === 'effekt' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: b.sofort === false ? 'spaeter' : 'sofort',
    onChange: ev => setzen({
      bindung: {
        ...b,
        sofort: ev.target.value === 'sofort'
      }
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "sofort"
  }, "gilt ab sofort, bis die Frist abl\xE4uft"), /*#__PURE__*/React.createElement("option", {
    value: "spaeter"
  }, "gilt erst, wenn die Frist abgelaufen ist")), /*#__PURE__*/React.createElement(EffectEditor, {
    effects: b.effects || [],
    onChange: v => setzen({
      bindung: {
        ...b,
        effects: v
      }
    }),
    hint: 'Damit verändert dieses Ereignis die Werte von ' + (held && held.name || 'diesem Helden') + '.'
  }), /*#__PURE__*/React.createElement("div", {
    className: "chr-hinweis"
  }, b.sofort === false ? 'Steht als Merkmal „' + (e.name || 'Ereignis') + '“ im Bogen, sobald die Frist abgelaufen ist — und bleibt dann.' : 'Steht ab dem Speichern als Merkmal „' + (e.name || 'Ereignis') + '“ im Bogen und verschwindet mit der Frist.', ' ', "Wird das Ereignis gel\xF6scht, geht es mit."))))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    disabled: !e.name.trim(),
    onClick: onSpeichern
  }, "\uD83D\uDCBE Speichern"))));
};

// ── Zeit vergeht ─────────────────────────────────────────────────
// Zeigt vorher, was passieren wird. Was in fremde Charakterboegen
// schreibt, steht einzeln zum Abwaehlen da — dieselbe Regel wie beim
// Uebertragen der Trefferpunkte nach dem Kampf.
const ZeitDialog = ({
  chronik,
  advId,
  chars,
  onAnwenden,
  onUhrStellen,
  onAbbrechen
}) => {
  const jetzt = zeitDerUhr(chronik, advId);
  const [tage, setTage] = React.useState(1);
  const [std, setStd] = React.useState(0);
  const [abgewaehlt, setAbgewaehlt] = React.useState({});
  const [stellen, setStellen] = React.useState(false);
  const [zielTag, setZielTag] = React.useState(uhrTag(jetzt));
  const [zielStd, setZielStd] = React.useState(uhrStunde(jetzt));
  const [ergebnis, setErgebnis] = React.useState(null);
  const delta = Math.max(0, tage) * STD_TAG + Math.max(0, std);
  const nachher = jetzt + delta;
  const feuert = ereignisseDerUhr(chronik, advId).filter(e => !e.erledigt && e.faellig != null && e.faellig > jetzt && e.faellig <= nachher).sort((a, b) => a.faellig - b.faellig);
  const held = id => chars.find(c => c.id === id);
  const merkmal = b => {
    const c = b && held(b.charId);
    return c && (c.features || []).find(f => f.id === b.featureId);
  };
  const angebunden = feuert.map(e => ({
    e,
    b: e.bindung,
    c: e.bindung && held(e.bindung.charId)
  })).filter(x => x.b && x.b.charId);
  // Ein umgeschaltetes Merkmal ist ein Eingriff in einen fremden Bogen und
  // steht deshalb zum Abwaehlen da. Ein Chronik-Effekt dagegen wird aus der
  // Uhr abgeleitet — ihn hier abzuwaehlen hiesse, ihn im naechsten
  // Augenblick wieder abzuleiten. Er steht als Ansage, nicht als Kaestchen.
  const bindungen = angebunden.filter(x => x.b.art !== 'effekt').map(x => ({
    ...x,
    f: merkmal(x.b)
  }));
  const effektB = angebunden.filter(x => x.b.art === 'effekt' && (x.b.effects || []).length);
  const anwenden = () => {
    const gewaehlt = bindungen.filter(x => x.c && x.f && !abgewaehlt[x.e.id]).map(x => ({
      charId: x.b.charId,
      featureId: x.b.featureId,
      wirkung: x.b.wirkung || 'aus',
      charName: x.c.name,
      featureName: x.f.name,
      ereignis: x.e.name
    }));
    onAnwenden(delta, feuert, gewaehlt);
    setErgebnis({
      delta,
      feuert,
      nachher
    });
  };
  if (ergebnis) {
    return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 460
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-title"
    }, "\u23E9 ", restText(ergebnis.delta), " vergangen"), /*#__PURE__*/React.createElement("div", {
      className: "zeit-jetzt"
    }, "Es ist jetzt ", /*#__PURE__*/React.createElement("b", null, "Tag ", uhrTag(ergebnis.nachher), ", ", uhrStunde(ergebnis.nachher), " Uhr"), "."), ergebnis.feuert.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "chr-hinweis"
    }, "Nichts ist f\xE4llig geworden.") : /*#__PURE__*/React.createElement("div", {
      className: "zeit-vorschau-block"
    }, ergebnis.feuert.map(e => /*#__PURE__*/React.createElement("div", {
      className: "zeit-vorschau-zeile",
      key: e.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "chr-ev-icon"
    }, artInfo(e.art).icon), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, e.name), " \u2014 ", artInfo(e.art).vorbei, e.art === 'reise' && e.ziel ? ' in ' + e.ziel : '', e.notiz && /*#__PURE__*/React.createElement("i", {
      className: "zeit-notiz"
    }, e.notiz))))), /*#__PURE__*/React.createElement("div", {
      className: "form-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-save",
      onClick: onAbbrechen
    }, "Weiter"))));
  }
  return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 500
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\u23E9 Zeit vergeht"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '64vh',
      overflowY: 'auto',
      paddingRight: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "zeit-jetzt"
  }, "Gerade: ", /*#__PURE__*/React.createElement("b", null, "Tag ", uhrTag(jetzt), ", ", uhrStunde(jetzt), " Uhr")), /*#__PURE__*/React.createElement("div", {
    className: "zeit-schnell"
  }, [['1 Std', 0, 1], ['Rast · 8 Std', 0, 8], ['1 Tag', 1, 0], ['3 Tage', 3, 0], ['1 Woche', 7, 0]].map(w => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: w[0],
    className: 'zeit-knopf' + (tage === w[1] && std === w[2] ? ' aktiv' : ''),
    onClick: () => {
      setTage(w[1]);
      setStd(w[2]);
    }
  }, w[0]))), /*#__PURE__*/React.createElement("div", {
    className: "chr-frist",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 999,
    wert: tage,
    "aria-label": "Tage",
    onWert: v => setTage(v)
  }), /*#__PURE__*/React.createElement("span", null, "Tage"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 23,
    wert: std,
    "aria-label": "Stunden",
    onWert: v => setStd(v)
  }), /*#__PURE__*/React.createElement("span", null, "Std")), /*#__PURE__*/React.createElement("div", {
    className: "zeit-nachher"
  }, "Danach: ", /*#__PURE__*/React.createElement("b", null, "Tag ", uhrTag(nachher), ", ", uhrStunde(nachher), " Uhr")), delta > 0 && /*#__PURE__*/React.createElement("div", {
    className: "zeit-vorschau-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zeit-vorschau-titel"
  }, feuert.length === 0 ? 'Nichts wird fällig.' : feuert.length + (feuert.length === 1 ? ' Ereignis wird fällig' : ' Ereignisse werden fällig')), feuert.map(e => /*#__PURE__*/React.createElement("div", {
    className: "zeit-vorschau-zeile",
    key: e.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "chr-ev-icon"
  }, artInfo(e.art).icon), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, e.name), " \u2014 ", artInfo(e.art).vorbei, e.art === 'reise' && e.ziel ? ' in ' + e.ziel : '', e.wiederholung > 0 && /*#__PURE__*/React.createElement("i", {
    className: "zeit-notiz"
  }, "l\xE4uft danach weiter, alle ", Math.round(e.wiederholung / STD_TAG), " Tage")))), effektB.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "zeit-bindungen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zeit-vorschau-titel"
  }, "Effekte in fremden B\xF6gen"), effektB.map(x => /*#__PURE__*/React.createElement("div", {
    className: "zeit-bindung",
    key: 'fx_' + x.e.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "chr-ev-icon"
  }, "\u2726"), /*#__PURE__*/React.createElement("span", null, x.c ? /*#__PURE__*/React.createElement(React.Fragment, null, "Bei ", /*#__PURE__*/React.createElement("b", null, x.c.name), ": ") : 'Bei einem Helden, der nicht mehr da ist: ', "\u201E", x.e.name, "\u201C ", x.b.sofort === false ? 'greift ab jetzt' : 'endet')))), bindungen.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "zeit-bindungen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zeit-vorschau-titel"
  }, "Das wird in fremde B\xF6gen geschrieben"), bindungen.map(x => /*#__PURE__*/React.createElement("label", {
    className: 'zeit-bindung' + (!x.c || !x.f ? ' fehlt' : ''),
    key: x.e.id
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    disabled: !x.c || !x.f,
    checked: !!(x.c && x.f) && !abgewaehlt[x.e.id],
    onChange: ev => setAbgewaehlt(a => ({
      ...a,
      [x.e.id]: !ev.target.checked
    }))
  }), /*#__PURE__*/React.createElement("span", null, !x.c ? 'Der Held zu „' + x.e.name + '“ ist nicht mehr da.' : !x.f ? 'Bei ' + x.c.name + ': das Merkmal zu „' + x.e.name + '“ gibt es nicht mehr.' : /*#__PURE__*/React.createElement(React.Fragment, null, "Bei ", /*#__PURE__*/React.createElement("b", null, x.c.name), ": \u201E", x.f.name, "\u201C ", x.b.wirkung === 'an' ? 'einschalten' : 'abschalten')))))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "zeit-stellen-link",
    onClick: () => setStellen(v => !v)
  }, (stellen ? '▾ ' : '▸ ') + 'Uhr direkt stellen'), stellen && /*#__PURE__*/React.createElement("div", {
    className: "zeit-stellen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chr-frist"
  }, /*#__PURE__*/React.createElement("span", null, "Tag"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 1,
    max: 9999,
    wert: zielTag,
    "aria-label": "Tag",
    onWert: v => setZielTag(v)
  }), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 23,
    wert: zielStd,
    "aria-label": "Stunde",
    onWert: v => setZielStd(v)
  }), /*#__PURE__*/React.createElement("span", null, "Uhr"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: () => {
      onUhrStellen((zielTag - 1) * STD_TAG + zielStd);
      onAbbrechen();
    }
  }, "Setzen")), /*#__PURE__*/React.createElement("div", {
    className: "chr-hinweis"
  }, "Stellt nur die Uhr. Es wird nichts f\xE4llig und nichts geschrieben."))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    disabled: delta === 0,
    onClick: anwenden
  }, delta === 0 ? 'Keine Zeit gewählt' : '⏩ ' + restText(delta) + ' vergehen lassen'))));
};

// ==== js/src/2e-abenteuer.jsx ====
// ── Einstellungen eines Abenteuers ───────────────────────────────
// Was hier steht, gilt fuer alle in der Gruppe — es liegt in derselben
// geteilten Datenbank wie die Abenteuerliste selbst. Deshalb sind es
// bewusst wenige, klar benannte Schalter und keine Sammelkiste.
const AbenteuerEinstellungen = ({
  adv,
  helden,
  onAendern,
  onSpeichern,
  onAbbrechen,
  besitzer,
  mitglieder,
  onBesitzer,
  advDms,
  istAdmin,
  onAdvDms
}) => {
  const klassen = advKlassen(adv);
  const eigene = Array.isArray(adv.klassen) && adv.klassen.length > 0;
  const setzen = p => onAendern({
    ...adv,
    ...p
  });

  // Welche Klassen im Abenteuer tatsaechlich gespielt werden. Eine davon
  // zu entfernen nimmt einem Helden seine Klasse — das sagt die Zeile.
  const inBenutzung = {};
  (helden || []).forEach(c => {
    [c.charClass, ...(c.multiclasses || []).map(m => m.charClass)].filter(Boolean).forEach(k => {
      inBenutzung[k] = (inBenutzung[k] || 0) + 1;
    });
  });
  const klassenSetzen = liste => setzen({
    klassen: liste
  });
  const kampfSicht = KAMPF_SICHT.some(x => x.k === adv.kampfSicht) ? adv.kampfSicht : 'auto';

  // Fuer die Zeile, die zugeklappt neben dem Titel steht.
  const zugeordnet = (helden || []).filter(h => (besitzer || {})[h.id]).length;

  // Der Automat: nur Haeufigkeit und Auszahlung sind einstellbar. Name und
  // Zeichen bleiben, sonst waere die Auszahlungstafel im Automaten eine
  // andere als die hier.
  const [ziel, setZiel] = React.useState(90);
  const autoSym = automatSymbole(adv.automat);
  const autoVoll = automatVollbildEins(adv.automat);
  const autoVollP = automatVollbildP(adv.automat);
  const rechnung = automatRechnung(autoSym, autoVollP);
  const autoSetzen = liste => setzen({
    automat: {
      ...(adv.automat || {}),
      symbole: liste.map(x => ({
        k: x.k,
        gewicht: x.gewicht,
        zahlt: x.zahlt
      }))
    }
  });
  const autoFeld = p => setzen({
    automat: {
      ...(adv.automat || {}),
      ...p
    }
  });
  const aendern = (i, p) => klassenSetzen(klassen.map((k, j) => j === i ? {
    ...k,
    ...p
  } : k));
  const entfernen = i => klassenSetzen(klassen.filter((_, j) => j !== i));
  const hinzu = () => klassenSetzen([...klassen, {
    name: '',
    color: '#8b9198'
  }]);
  return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\u2699 Einstellungen \xB7 ", adv.name || 'Abenteuer'), /*#__PURE__*/React.createElement("div", {
    className: "einst-roll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full",
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Name des Abenteuers"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: adv.name || '',
    onChange: e => setzen({
      name: e.target.value
    }),
    placeholder: "z.B. Strahd"
  })), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\u2764 Trefferpunkte",
    kurz: adv.hpVerdeckt ? 'Verdeckt' : 'Offen'
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-wahl"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'einst-option' + (!adv.hpVerdeckt ? ' aktiv' : ''),
    onClick: () => setzen({
      hpVerdeckt: false
    })
  }, /*#__PURE__*/React.createElement("b", null, "Offen"), /*#__PURE__*/React.createElement("i", null, "Jeder sieht seine Zahlen und kann sie \xE4ndern.")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'einst-option' + (adv.hpVerdeckt ? ' aktiv' : ''),
    onClick: () => setzen({
      hpVerdeckt: true
    })
  }, /*#__PURE__*/React.createElement("b", null, "Verdeckt"), /*#__PURE__*/React.createElement("i", null, "Spieler sehen nur ihren Zustand \u2014 \u201EVerwundet\u201C statt \u201E14 / 38\u201C. Zahlen und Eingabefelder bleiben der Spielleitung."))), adv.hpVerdeckt && /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis"
  }, "Die Trefferpunkte werden dann im DM-Modus gepflegt \u2014 im Bogen oder \xFCber den Kampftracker. Maximum und tempor\xE4re Trefferpunkte sind mit verdeckt, sonst lie\xDFe sich die Zahl zur\xFCckrechnen.")), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\u2694 Kampftracker",
    kurz: (adv.zugfenster === false ? 'ohne Zugfenster' : 'mit Zugfenster') + ' · Runde ' + (KAMPF_SICHT.find(x => x.k === kampfSicht) || {}).kurz
  }, /*#__PURE__*/React.createElement("label", {
    className: "einst-dm-zeile"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: adv.zugfenster !== false,
    onChange: e => setzen({
      zugfenster: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("span", null, "Zugfenster anbieten")), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis"
  }, "Auf der Karte dessen, der am Zug ist, steht dann ", /*#__PURE__*/React.createElement("b", null, "\u270D Zug eintragen"), ". Darin w\xE4hlt die Spielleitung Waffe oder Zauber, tippt Ziele an und tr\xE4gt ein, was ankommt \u2014 die Trefferpunkte rechnet das Fenster mit und schreibt den Zug ins Protokoll. Ohne H\xE4kchen bleibt der Tracker, wie er war."), /*#__PURE__*/React.createElement("div", {
    className: "einst-titel",
    style: {
      marginTop: 16
    }
  }, "\uD83D\uDC41 Was die Runde sieht"), /*#__PURE__*/React.createElement("div", {
    className: "einst-wahl drei"
  }, KAMPF_SICHT.map(w => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: w.k,
    className: 'einst-option' + (kampfSicht === w.k ? ' aktiv' : ''),
    onClick: () => setzen({
      kampfSicht: w.k
    })
  }, /*#__PURE__*/React.createElement("b", null, w.l), /*#__PURE__*/React.createElement("i", null, w.t)))), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis"
  }, "Die Spieler sehen die Initiativliste, wer am Zug ist und wie es den Figuren geht \u2014 ", /*#__PURE__*/React.createElement("b", null, "nie die Trefferpunkte der Gegner"), ", nie ihre R\xFCstungsklasse, nie deine Notizen und nie das Protokoll. Der Zustand steht da wie im Bogen: \u201ESchwer verwundet\u201C statt einer Zahl. Bei den Helden gilt weiter, was oben unter Trefferpunkte eingestellt ist. Der Server h\xE4lt sich daran, nicht die Anzeige.")), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83C\uDF7A Tische der Taverne",
    kurz: tavernenZu(adv.automat).length + ' von ' + TAVERNEN_TISCHE.length + ' offen'
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Welche Tische in diesem Abenteuer aufgebaut sind. Ein geschlossener Tisch steht nicht in der Halle \u2014 wer gerade daran sitzt, wird in die Halle zur\xFCckgeschickt."), /*#__PURE__*/React.createElement("div", {
    className: "einst-tische"
  }, TAVERNEN_TISCHE.map(t => {
    const zu = (adv.automat && adv.automat.zu || []).includes(t.k);
    return /*#__PURE__*/React.createElement("label", {
      key: t.k,
      className: 'einst-tisch' + (t.da ? '' : ' spaeter')
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: !zu,
      disabled: !t.da,
      onChange: e => {
        const l = (adv.automat && adv.automat.zu || []).filter(x => x !== t.k);
        autoFeld({
          zu: e.target.checked ? l : [...l, t.k]
        });
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "einst-tisch-z"
    }, t.z), /*#__PURE__*/React.createElement("span", {
      className: "einst-tisch-t"
    }, /*#__PURE__*/React.createElement("b", null, t.name), /*#__PURE__*/React.createElement("i", null, t.da ? t.unter : 'wird noch gebaut')));
  }))), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83C\uDFB0 Automat der Taverne",
    kurz: (rechnung.quote * 100).toFixed(0) + ' % · Vollbild ' + (autoVoll ? '1 auf ' + autoVoll : 'aus')
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "H\xE4ufigkeit sagt, wie oft ein Symbol f\xE4llt; Auszahlung, was drei davon auf einer Linie bringen \u2014 als Vielfaches des Einsatzes. Beides zusammen mit dem Vollbild ergibt die Quote, und die steht daneben: sie wird gerechnet, nicht gesch\xE4tzt."), /*#__PURE__*/React.createElement("div", {
    className: "einst-quote"
  }, /*#__PURE__*/React.createElement("span", {
    className: "einst-quote-label"
  }, "Auszahlungsquote"), /*#__PURE__*/React.createElement("b", null, (rechnung.quote * 100).toFixed(1).replace('.', ','), " %"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input einst-ziel",
    min: 10,
    max: 200,
    "aria-label": "Zielquote in Prozent",
    wert: ziel,
    onWert: v => setZiel(v)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: () => autoSetzen(automatEinregeln(autoSym, ziel / 100, autoVollP))
  }, "auf ", ziel, " % einregeln")), /*#__PURE__*/React.createElement("div", {
    className: "einst-quote"
  }, /*#__PURE__*/React.createElement("span", {
    className: "einst-quote-label"
  }, "Vollbild"), /*#__PURE__*/React.createElement("select", {
    className: "form-select einst-vollwahl",
    value: autoVoll,
    "aria-label": "H\xE4ufigkeit des Vollbilds",
    onChange: e => autoFeld({
      vollbild: +e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: 0
  }, "aus \u2014 nur, wenn es von allein f\xE4llt"), VOLLBILD_STUFEN.map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, "1 auf ", n, " Drehungen")))), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Neun gleiche Speisen: f\xFCnf Linien auf einmal und danach das Rad der Fortuna \u2014 das Bonusspiel des Automaten. Von allein f\xE4llt das praktisch nie, deshalb wird es gezogen.", ' ', autoVoll ? /*#__PURE__*/React.createElement("b", null, "Davon kommen ", (rechnung.bonus * 100).toFixed(0), " % der Quote.") : /*#__PURE__*/React.createElement("b", null, "Ohne Vollbild liegt die ganze Quote auf den Linien."), ' ', "H\xE4ufiger hei\xDFt kleinere Linien: nach dem Umstellen wieder einregeln, dann stimmen die Auszahlungen dazu.", rechnung.quote > 1.05 && /*#__PURE__*/React.createElement("b", {
    className: "einst-warnung"
  }, " \xDCber 100 % \u2014 auf Dauer zahlt das Haus drauf.")), /*#__PURE__*/React.createElement("div", {
    className: "tabellenhuelle"
  }, /*#__PURE__*/React.createElement("table", {
    className: "einst-automat"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    colSpan: 2
  }, "Symbol"), /*#__PURE__*/React.createElement("th", null, "H\xE4ufigkeit"), /*#__PURE__*/React.createElement("th", null, "Auszahlung"))), /*#__PURE__*/React.createElement("tbody", null, autoSym.map((sym, i) => /*#__PURE__*/React.createElement("tr", {
    key: sym.k
  }, /*#__PURE__*/React.createElement("td", {
    className: "zeichen"
  }, sym.z), /*#__PURE__*/React.createElement("td", {
    className: "name"
  }, sym.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 999,
    "aria-label": 'Häufigkeit ' + sym.name,
    wert: sym.gewicht,
    onWert: v => autoSetzen(autoSym.map((x, j) => j === i ? {
      ...x,
      gewicht: v
    } : x))
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: 0,
    max: 99999,
    step: "0.05",
    "aria-label": 'Auszahlung ' + sym.name,
    wert: sym.zahlt,
    onWert: v => autoSetzen(autoSym.map((x, j) => j === i ? {
      ...x,
      zahlt: v
    } : x))
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "einst-klassen-fuss"
  }, /*#__PURE__*/React.createElement("label", {
    className: "einst-max"
  }, "H\xF6chsteinsatz", /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: adv.automat && adv.automat.maxEinsatz || 0,
    onChange: e => setzen({
      automat: {
        ...(adv.automat || {}),
        maxEinsatz: +e.target.value || 0
      }
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: 0
  }, "ohne Grenze"), AUTOMAT_EINSAETZE.map(n2 => /*#__PURE__*/React.createElement("option", {
    key: n2,
    value: n2
  }, n2, " Marken")))), adv.automat && adv.automat.symbole && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: () => setzen({
      automat: {
        ...(adv.automat || {}),
        symbole: undefined
      }
    })
  }, "\u21BA Standardautomat")), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis"
  }, "Gespielt wird mit Spielmarken, die im Ger\xE4t jedes Einzelnen liegen \u2014 nichts davon ber\xFChrt einen Charakterbogen. Wer einen zwielichtigen Automaten will, regelt ihn auf 80 % ein und sagt nichts.")), (mitglieder || []).length > 0 && /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83D\uDD2E Spielleitung dieses Abenteuers",
    kurz: (advDms || []).length ? (advDms || []).length + ((advDms || []).length === 1 ? ' Konto' : ' Konten') : 'jede Spielleitung'
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, (advDms || []).length === 0 ? 'Niemand eingetragen — dann leitet es jede Spielleitung der Gruppe. Wer hier steht, leitet es allein.' : 'Nur wer hier steht, kommt in diesem Abenteuer in den DM-Modus, an fremde Bögen und an die verdeckten Trefferpunkte.', ' ', "Das gilt je Abenteuer: wer hier den Schirm h\xE4lt, kann nebenan mitspielen.", !istAdmin && ' Ändern kann das nur die Verwaltung.'), (mitglieder || []).map(m => {
    const drin = (advDms || []).includes(m.id);
    return /*#__PURE__*/React.createElement("label", {
      className: "einst-dm-zeile",
      key: m.id
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: drin,
      disabled: !istAdmin,
      onChange: () => onAdvDms(drin ? (advDms || []).filter(x => x !== m.id) : [...(advDms || []), m.id])
    }), /*#__PURE__*/React.createElement("span", null, m.name, m.rolle === 'dm' ? ' · Spielleitung der Gruppe' : ''));
  })), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83E\uDDD1 Helden und ihre Konten",
    kurz: zugeordnet + ' von ' + (helden || []).length + ' zugeordnet'
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Ein zugeordneter Bogen l\xE4sst sich nur noch von seinem Konto \xE4ndern \u2014 und von dir. Was hier niemandem geh\xF6rt, bleibt f\xFCr alle offen; die Zuordnung macht es strenger, nie kaputt. Der Server h\xE4lt sich daran, nicht die Anzeige."), !(mitglieder || []).length ? /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      margin: 0
    }
  }, "In dieser Gruppe hat noch niemand ein Konto. Solange das so ist, geh\xF6rt kein Bogen jemandem \u2014 genau wie bisher.") : (helden || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      margin: 0
    }
  }, "Kein Held in diesem Abenteuer.") : (helden || []).map(h => /*#__PURE__*/React.createElement("div", {
    className: "einst-klasse",
    key: h.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "einst-besitz-name"
  }, h.name || 'Namenlos'), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    "aria-label": 'Konto für ' + (h.name || 'Held'),
    value: besitzer && besitzer[h.id] || '',
    onChange: e => onBesitzer(h.id, e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 niemandem \u2014"), (mitglieder || []).map(m => /*#__PURE__*/React.createElement("option", {
    key: m.id,
    value: m.id
  }, m.name, m.rolle === 'dm' ? ' (DM)' : '')))))), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83C\uDF93 Klassen",
    kurz: klassen.length + (klassen.length === 1 ? ' Klasse' : ' Klassen') + (eigene ? '' : ' · Regelwerk')
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Was hier steht, steht im Charakterbogen zur Wahl. Name und Farbe gen\xFCgen; das Attribut sagt, womit die Klasse zaubert \u2014 daran h\xE4ngen im Bogen der Zauber-SG und der Zauberangriff. \u201EZaubert nicht\u201C l\xE4sst beide weg. Der Trefferw\xFCrfel steht weiter im Bogen des Helden."), klassen.map((k, i) => {
    const genutzt = inBenutzung[k.name] || 0;
    return /*#__PURE__*/React.createElement("div", {
      className: "einst-klasse",
      key: i
    }, /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "einst-farbe",
      value: k.color || '#8b9198',
      "aria-label": 'Farbe für ' + (k.name || 'Klasse'),
      onChange: e => aendern(i, {
        color: e.target.value
      })
    }), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: k.name,
      "aria-label": "Klassenname",
      placeholder: "Name der Klasse",
      onChange: e => aendern(i, {
        name: e.target.value
      })
    }), /*#__PURE__*/React.createElement("select", {
      className: "form-select einst-attr",
      "aria-label": 'Zauberattribut von ' + (k.name || 'Klasse'),
      title: "Womit diese Klasse zaubert",
      value: k.attr !== undefined ? k.attr || '' : SPELL_ATTR[k.name] || '',
      onChange: e => aendern(i, {
        attr: e.target.value
      })
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "zaubert nicht"), ATTR_WAHL.map(a => /*#__PURE__*/React.createElement("option", {
      key: a.k,
      value: a.k
    }, a.l))), /*#__PURE__*/React.createElement("span", {
      className: "einst-genutzt"
    }, genutzt ? genutzt + (genutzt === 1 ? ' Held' : ' Helden') : ''), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "fx-del",
      title: genutzt ? 'Wird noch gespielt — entfernen lässt die Klasse im Bogen stehen' : 'Entfernen',
      onClick: () => entfernen(i)
    }, "\u2715"));
  }), /*#__PURE__*/React.createElement("div", {
    className: "einst-klassen-fuss"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: hinzu
  }, "+ Klasse"), eigene && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: () => klassenSetzen(KLASSEN_STANDARD.map(k => ({
      ...k
    })))
  }, "\u21BA Die zw\xF6lf des Regelwerks"), !eigene && /*#__PURE__*/React.createElement("span", {
    className: "einst-hinweis",
    style: {
      margin: 0
    }
  }, "Noch unver\xE4ndert \u2014 das sind die zw\xF6lf des Regelwerks.")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: onSpeichern
  }, "\uD83D\uDCBE Speichern"))));
};

// ==== js/src/2f-automat.jsx ====
// Heldenbuch — „Dreifaches Glück", der Automat in der Taverne des Glücks.
//
// Im Ablauf nach dem Vorbild klassischer Dreiwalzer gebaut: 3×3 Felder,
// fünf feste Linien (die drei Reihen und die beiden Diagonalen), Gewinn
// ist immer drei gleiche Symbole auf einer Linie. Name, Symbole und
// Aussehen sind eigene — nachgebaut wird der Ablauf, nicht die Aufmachung.
//
// Die Marken liegen im Geraet, nicht am Server und nicht am Charakter:
// das hier ist Zeitvertreib, kein Teil der Kampagnenwirtschaft. Kein
// fremder Bogen wird angefasst, keine Anfrage geht nach draussen. Der
// Umbau auf echtes Gold spaeter ist trotzdem vorbereitet — der Automat
// kennt nur "lesen" und "schreiben", nicht das Feld dahinter.

const AUTOMAT_SPEICHER = 'hb_automat';
const MARKEN_START = 200;

// Gewicht steuert, wie oft ein Symbol faellt; zahlt ist das Vielfache des
// Einsatzes bei drei gleichen auf einer Linie. Beides zusammen ergibt die
// Quote, und die rechnet automatQuote() aus — geraten wird hier nichts.
const AUTOMAT_STANDARD = [{
  k: 'ratte',
  z: '🐀',
  name: 'Ratte',
  gewicht: 40,
  zahlt: 1
}, {
  k: 'krug',
  z: '🍺',
  name: 'Krug',
  gewicht: 30,
  zahlt: 2.5,
  speise: true
}, {
  k: 'kaese',
  z: '🧀',
  name: 'Käse',
  gewicht: 22,
  zahlt: 4,
  speise: true
}, {
  k: 'keule',
  z: '🍗',
  name: 'Keule',
  gewicht: 14,
  zahlt: 8,
  speise: true
}, {
  k: 'apfel',
  z: '🍎',
  name: 'Apfel',
  gewicht: 9,
  zahlt: 17,
  speise: true
}, {
  k: 'muenze',
  z: '🪙',
  name: 'Glücksmünze',
  gewicht: 6,
  zahlt: 22,
  freidreh: true
}, {
  k: 'kelch',
  z: '🏺',
  name: 'Kelch',
  gewicht: 4,
  zahlt: 45
}, {
  k: 'rubin',
  z: '💠',
  name: 'Rubin',
  gewicht: 3,
  zahlt: 85
}, {
  k: 'drache',
  z: '🐉',
  name: 'Drachenauge',
  gewicht: 2,
  zahlt: 225
}];

// Die fuenf Linien auf dem Feld 0..8 (oben links nach unten rechts).
const AUTOMAT_LINIEN = [{
  name: 'Oben',
  felder: [0, 1, 2]
}, {
  name: 'Mitte',
  felder: [3, 4, 5]
}, {
  name: 'Unten',
  felder: [6, 7, 8]
}, {
  name: 'Fallend',
  felder: [0, 4, 8]
}, {
  name: 'Steigend',
  felder: [6, 4, 2]
}];
const AUTOMAT_EINSAETZE = [5, 10, 20, 50];

// Name und Zeichen stehen fest, Haeufigkeit und Auszahlung nicht: die
// Spielleitung stellt sie je Abenteuer. Was sie nicht angefasst hat,
// bleibt beim Standard.
const automatSymbole = cfg => {
  const eig = cfg && Array.isArray(cfg.symbole) ? cfg.symbole : null;
  if (!eig) return AUTOMAT_STANDARD;
  const liste = AUTOMAT_STANDARD.map(s => {
    const o = eig.find(x => x && x.k === s.k);
    return o ? {
      ...s,
      gewicht: Math.max(0, +o.gewicht || 0),
      zahlt: Math.max(0, +o.zahlt || 0)
    } : s;
  });
  // Eine Walze, auf der nichts liegen kann, waere kein Automat mehr.
  return liste.some(x => x.gewicht > 0) ? liste : AUTOMAT_STANDARD;
};
const automatEinsaetze = cfg => {
  const max = cfg && +cfg.maxEinsatz;
  const gefiltert = max ? AUTOMAT_EINSAETZE.filter(n => n <= max) : AUTOMAT_EINSAETZE;
  return gefiltert.length ? gefiltert : [AUTOMAT_EINSAETZE[0]];
};
// ── Das Vollbild ─────────────────────────────────────────────────
// Neun gleiche Speisen — das Bonusspiel des Automaten. Von allein faellt
// das so gut wie nie (die Wahrscheinlichkeit hoch neun: beim Krug einmal
// in zweihundertfuenfzigtausend Drehungen), und ein Bonus, den niemand je
// zu sehen bekommt, ist keiner. Deshalb wird es gezogen: mit einer
// eingestellten Haeufigkeit legt der Automat statt neun einzelner Symbole
// ein volles Bild. Welche Speise, entscheidet ihre Haeufigkeit — der Krug
// oft, der Apfel selten.
//
// Was das kostet, steht in der Quote und wird dort auch verrechnet: ein
// haeufigeres Vollbild heisst kleinere Linien.
const VOLLBILD_STANDARD = 200; // eine von zweihundert Drehungen
const VOLLBILD_STUFEN = [50, 100, 150, 200, 300, 500, 1000];
const automatVollbildEins = cfg => {
  const roh = cfg && cfg.vollbild;
  if (roh === undefined || roh === null || roh === '') return VOLLBILD_STANDARD;
  const n = Math.round(+roh || 0);
  return n > 0 ? Math.max(20, Math.min(5000, n)) : 0;
};
const automatVollbildP = cfg => {
  const n = automatVollbildEins(cfg);
  return n ? 1 / n : 0;
};
const symbolVon = (k, liste) => (liste || AUTOMAT_STANDARD).find(s => s.k === k) || AUTOMAT_STANDARD.find(s => s.k === k) || AUTOMAT_STANDARD[0];

// ── Die Quote, ausgerechnet statt geschaetzt ─────────────────
// Bei fuenf festen Linien und neun unabhaengig gezogenen Symbolen ist der
// Erwartungswert eine geschlossene Formel: je Symbol die Wahrscheinlichkeit
// hoch drei mal seine Auszahlung, mal fuenf Linien.
//
// Zwei Dinge machen sie rekursiv: der Freidreh und das gezogene Vollbild
// sind selbst wieder eine ganze Quote wert. Also steht die Quote auf
// beiden Seiten der Gleichung und loest sich zu einer Division auf.
//
// Was das Rad im Mittel nachlegt: drei von vier Feldern sind gruen,
// hoechstens dreimal hintereinander.
const RAD_ERWARTUNG = 0.75 + 0.5625 + 0.421875;
const automatRechnung = (symbole, vollbildP) => {
  const liste = symbole || AUTOMAT_STANDARD;
  const summe = liste.reduce((s, x) => s + (+x.gewicht || 0), 0);
  if (!summe) return {
    quote: 0,
    bonus: 0
  };
  let linien = 0,
    freidrehP = 0,
    natur = 0;
  liste.forEach(x => {
    const p = (+x.gewicht || 0) / summe;
    const p3 = p * p * p;
    linien += p3 * (+x.zahlt || 0);
    if (x.freidreh) freidrehP += p3;
    // Das Vollbild, das von allein faellt — verschwindend, aber nicht null.
    if (x.speise) natur += Math.pow(p, 9) * 5 * (+x.zahlt || 0) * RAD_ERWARTUNG;
  });
  linien *= AUTOMAT_LINIEN.length;

  // Das gezogene Vollbild: fuenf Linien und danach das Rad.
  const speisen = liste.filter(x => x.speise && (+x.gewicht || 0) > 0);
  const gs = speisen.reduce((s, x) => s + (+x.gewicht || 0), 0);
  let voll = 0,
    vollFrei = 0;
  speisen.forEach(x => {
    const q = (+x.gewicht || 0) / gs;
    voll += q * 5 * (+x.zahlt || 0) * (1 + RAD_ERWARTUNG);
    if (x.freidreh) vollFrei += q;
  });
  // Ohne Speisen auf den Walzen gibt es nichts zu ziehen.
  const v = gs ? Math.max(0, Math.min(1, +vollbildP || 0)) : 0;
  const pFrei = Math.min(0.5, AUTOMAT_LINIEN.length * freidrehP);
  const nenner = 1 - (v * vollFrei + (1 - v) * pFrei);
  const quote = (v * voll + (1 - v) * (linien + natur)) / (nenner > 0 ? nenner : 1);
  return {
    quote,
    bonus: quote > 0 ? v * voll / quote : 0
  };
};
const automatQuote = (symbole, vollbildP) => automatRechnung(symbole, vollbildP).quote;

// Die Quote ist in den Auszahlungen linear — alle mit demselben Faktor
// zu strecken trifft das Ziel also genau. Nur das Runden auf ganze Zahlen
// verschiebt es wieder ein wenig, und deshalb steht danach die erreichte
// Zahl da und nicht die gewuenschte.
// Fein genug runden, damit die Zahl am Ende stimmt. Ganze Zahlen waren zu
// grob: die Ratte faellt so oft, dass ihre Auszahlung ein Drittel der
// ganzen Quote traegt — eine halbe Stelle mehr oder weniger verschob das
// Ziel um mehrere Prozentpunkte. Deshalb feiner, wo es haeufig ist, und
// glatt, wo die Zahlen ohnehin gross sind.
const zahlRunden = x => x < 10 ? Math.max(0.05, Math.round(x * 100) / 100) : x < 50 ? Math.round(x * 10) / 10 : Math.round(x);
// Auszahlungen als Text: ohne unnoetige Nullen und mit Komma.
const zahlText = z => {
  const n = +z || 0;
  return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')).replace('.', ',');
};
const automatEinregeln = (symbole, ziel, vollbildP) => {
  const jetzt = automatQuote(symbole, vollbildP);
  if (!jetzt || !ziel) return symbole;
  const f = ziel / jetzt;
  return symbole.map(s => ({
    ...s,
    zahlt: zahlRunden((+s.zahlt || 0) * f)
  }));
};

// ── Ein Dreh ─────────────────────────────────────────────────────
const ziehSymbol = (liste, summe) => {
  let w = Math.random() * summe;
  for (const s of liste) {
    w -= +s.gewicht || 0;
    if (w <= 0) return s.k;
  }
  return liste[liste.length - 1].k;
};
const zieheWalzen = (symbole, vollbildP) => {
  const liste = symbole || AUTOMAT_STANDARD;
  const summe = liste.reduce((s, x) => s + (+x.gewicht || 0), 0);
  // Erst die Frage, ob es ein Vollbild wird — danach neun einzelne Symbole.
  // Andersherum (neun ziehen und bei Bedarf ueberschreiben) waere dasselbe,
  // sagte aber nicht, dass hier zwei verschiedene Ziehungen stattfinden.
  const speisen = liste.filter(x => x.speise && (+x.gewicht || 0) > 0);
  const gs = speisen.reduce((s, x) => s + (+x.gewicht || 0), 0);
  if (gs && Math.random() < (+vollbildP || 0)) {
    return Array(9).fill(ziehSymbol(speisen, gs));
  }
  return Array.from({
    length: 9
  }, () => ziehSymbol(liste, summe));
};
const werteAus = (feld, einsatz, liste) => {
  const treffer = [];
  let gewinn = 0,
    freidreh = false;
  AUTOMAT_LINIEN.forEach((linie, i) => {
    const [a, b, c] = linie.felder;
    if (feld[a] !== feld[b] || feld[b] !== feld[c]) return;
    const sym = symbolVon(feld[a], liste);
    const betrag = Math.round(sym.zahlt * einsatz);
    gewinn += betrag;
    if (sym.freidreh) freidreh = true;
    treffer.push({
      nr: i,
      name: linie.name,
      felder: linie.felder,
      sym,
      betrag
    });
  });
  // Ein Vollbild aus Speisen — das Rad dazu kommt in Stufe 4.
  const erstes = feld[0];
  const vollbild = feld.every(x => x === erstes) && !!symbolVon(erstes, liste).speise;
  return {
    gewinn,
    treffer,
    freidreh,
    vollbild
  };
};

// ── Marken ───────────────────────────────────────────────────────
// Nur im Geraet. Kein Server, kein Charakterbogen — und trotzdem schon
// hinter einer Abstraktion, damit "spaeter mit echtem Gold" eine
// Zeilenaenderung bleibt und kein Umbau.
// ── Der Beutel haengt am Helden ────────────────────────────
// Bis hierher lagen die Marken im Geraet: ein Beutel, gleichgueltig wer
// spielte. Sie haengen jetzt am Helden — nicht, weil das Spiel es heute
// verlangte, sondern weil es der Umbau auf echtes Gold tut. Gold liegt im
// Bogen; wer die Marken schon dort fuehrt, muss spaeter nur das Feld
// tauschen und nicht die halbe Taverne.
//
// Und weil jemand zwei Charaktere gleichzeitig spielen kann, gibt es
// zwei Beutel. Welcher auf dem Tisch liegt, sagt der offene Bogen; im
// Kopf des Fensters steht es und laesst sich umstellen.
const beutelLesen = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || '{}') || {};
  } catch {
    return {};
  }
};
const beutelSchreiben = d => {
  try {
    localStorage.setItem(AUTOMAT_SPEICHER, JSON.stringify(d));
  } catch {}
};
const OHNE_HELD = '_ohne'; // ohne Bogen spielt man trotzdem

const WAEHRUNGEN = {
  marken: {
    name: 'Spielmarken',
    kurz: '⛃',
    lesen: heldId => {
      const d = beutelLesen();
      const b = d.beutel || {};
      const k = heldId || OHNE_HELD;
      if (Number.isFinite(+b[k])) return +b[k];
      // Was frueher im Geraet lag, bekommt der erste Held, der die
      // Taverne betritt. Beim ersten Einsatz ist es umgezogen und steht
      // dort nicht mehr — sonst erbte es jeder noch einmal.
      if (Number.isFinite(+d.marken)) return +d.marken;
      return MARKEN_START;
    },
    schreiben: (heldId, n) => {
      const d = beutelLesen();
      const {
        marken,
        ...rest
      } = d;
      beutelSchreiben({
        ...rest,
        beutel: {
          ...(d.beutel || {}),
          [heldId || OHNE_HELD]: Math.max(0, Math.round(n))
        },
        zuletzt: heldId || OHNE_HELD
      });
    },
    // Wer zuletzt gespielt hat — gebraucht, wenn gerade kein Bogen offen ist.
    zuletzt: () => beutelLesen().zuletzt || null
  }
};

// ── Der Lauf der Walzen ──────────────────────────────────────────
// Jede Walze ist ein Band aus Zufallssymbolen, an dessen Ende die drei
// Symbole stehen, die stehenbleiben sollen. Das Band faehrt von oben nach
// unten durch und haelt auf den letzten dreien — mit unterschiedlichen
// Laufzeiten je Spalte, damit sie nacheinander stehen, wie es sich gehoert.
const WALZEN_BAND = 16; // Zellen je Band
const WALZEN_DAUER = [900, 1150, 1400]; // Millisekunden je Spalte

const bandBauen = (feld, spalte, liste) => {
  const l = liste || AUTOMAT_STANDARD;
  const vorlauf = Array.from({
    length: WALZEN_BAND - 3
  }, () => l[Math.floor(Math.random() * l.length)].k);
  return [...vorlauf, feld[spalte], feld[3 + spalte], feld[6 + spalte]];
};

// ── Das Rad der Fortuna ──────────────────────────────────────────
// Ein Vollbild aus Speisen oeffnet das Rad: vier Felder, drei gruene und
// ein rotes. Jedes gruene zahlt den Vollbildgewinn noch einmal, das rote
// beendet es, hoechstens dreimal. Daher der Name des Automaten.
//
// Feld 0 ist rot und liegt oben, 1 bis 3 sind gruen im Uhrzeigersinn.
const RAD_FELDER = 4;
const RAD_GRUEN = 3;
const RAD_DAUER = 2200;

// Wohin muss sich das Rad drehen, damit Feld k unter dem Zeiger steht?
// Immer vorwaerts und ueber mehrere volle Umdrehungen — ein Rad, das den
// kuerzesten Weg nimmt, sieht aus wie ein Zeiger, nicht wie ein Rad.
const radZiel = (k, aktuell) => {
  const soll = (360 - (k * (360 / RAD_FELDER) + 45)) % 360;
  const rest = (aktuell % 360 + 360) % 360;
  let plus = soll - rest;
  if (plus < 0) plus += 360;
  return aktuell + 360 * 4 + plus;
};

// ── Die Risikospiele ─────────────────────────────────────────────
// Nach einem Gewinn kann man ihn setzen statt einzustecken. Zwei Wege,
// beide verdoppeln und beide koennen alles kosten:
//
//   Die Leiter des Wagemuts — ein Licht laeuft ueber acht Felder, eines
//   ist gruen. Wer im richtigen Augenblick haelt, steigt eine Sprosse.
//   Mit jeder Sprosse laeuft das Licht schneller.
//
//   Rabe oder Rose — schwarz oder rot raten, mehr nicht.
//
// Hoechstens fuenf Sprossen; danach wird ausgezahlt. Ein Spiel, das
// endlos weiterlaufen kann, hat keinen Reiz mehr, sondern nur noch Zeit.
const LEITER_FELDER = 8;
const RISIKO_STUFEN = 5;
const leiterTempo = stufe => Math.max(70, 170 - stufe * 22);
const RisikoFenster = ({
  risiko,
  setRisiko,
  onNehmen,
  onSchliessen
}) => {
  const {
    art,
    betrag,
    stufe,
    aus,
    letztes
  } = risiko;
  const takt = React.useRef(null);

  // Das Licht laeuft, solange die Leiter offen und nicht entschieden ist.
  React.useEffect(() => {
    if (art !== 'leiter' || aus || !risiko.laeuft) return;
    const t = setInterval(() => {
      setRisiko(r => r && r.laeuft ? {
        ...r,
        pos: (r.pos + 1) % LEITER_FELDER
      } : r);
    }, leiterTempo(stufe));
    takt.current = t;
    return () => clearInterval(t);
  }, [art, aus, risiko.laeuft, stufe, setRisiko]);
  const weiter = gewonnen => setRisiko(r => ({
    ...r,
    laeuft: false,
    letztes: gewonnen ? 'gut' : 'schlecht',
    betrag: gewonnen ? r.betrag * 2 : 0,
    stufe: gewonnen ? r.stufe + 1 : r.stufe,
    aus: !gewonnen || r.stufe + 1 >= RISIKO_STUFEN
  }));
  const halt = () => {
    if (risiko.laeuft) weiter(risiko.pos === risiko.ziel);
  };
  const raten = farbe => {
    if (risiko.laeuft || aus) return;
    const gezogen = Math.random() < 0.5 ? 'rabe' : 'rose';
    setRisiko(r => ({
      ...r,
      gezogen
    }));
    weiter(gezogen === farbe);
  };
  const nochmal = () => setRisiko(r => ({
    ...r,
    laeuft: art === 'leiter',
    pos: 0,
    ziel: Math.floor(Math.random() * LEITER_FELDER),
    letztes: null,
    gezogen: null
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "rad-huelle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rad-fenster risiko"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rad-titel"
  }, art === 'leiter' ? 'Leiter des Wagemuts' : 'Rabe oder Rose'), /*#__PURE__*/React.createElement("div", {
    className: "rad-unter"
  }, art === 'leiter' ? 'Halt im richtigen Augenblick — das grüne Feld verdoppelt, jedes andere kostet alles.' : 'Schwarz oder rot. Richtig geraten verdoppelt, falsch kostet alles.'), /*#__PURE__*/React.createElement("div", {
    className: "risiko-betrag"
  }, /*#__PURE__*/React.createElement("span", null, "Im Spiel"), /*#__PURE__*/React.createElement("b", {
    className: betrag > 0 ? '' : 'weg'
  }, betrag), /*#__PURE__*/React.createElement("i", null, "Sprosse ", stufe, " von ", RISIKO_STUFEN)), art === 'leiter' ? /*#__PURE__*/React.createElement("div", {
    className: "leiter-felder",
    role: "group",
    "aria-label": "Leiter"
  }, Array.from({
    length: LEITER_FELDER
  }, (_, i) =>
  /*#__PURE__*/
  // Das Ziel ist immer zu sehen — auf ein Feld zielen, das man
  // nicht kennt, waere kein Wagemut, sondern Raten.
  React.createElement("span", {
    key: i,
    className: 'leiter-feld' + (risiko.pos === i ? ' licht' : '') + (risiko.ziel === i ? ' ziel' : '')
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "karte-wahl"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "karte-knopf rabe",
    disabled: aus || !!letztes,
    onClick: () => raten('rabe')
  }, "\uD83D\uDC26\u200D\u2B1B", /*#__PURE__*/React.createElement("span", null, "Rabe")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "karte-knopf rose",
    disabled: aus || !!letztes,
    onClick: () => raten('rose')
  }, "\uD83C\uDF39", /*#__PURE__*/React.createElement("span", null, "Rose"))), /*#__PURE__*/React.createElement("div", {
    className: "rad-stand"
  }, letztes === 'gut' ? /*#__PURE__*/React.createElement("b", {
    className: "rad-gut"
  }, "Getroffen \u2014 verdoppelt!") : letztes === 'schlecht' ? /*#__PURE__*/React.createElement("b", {
    className: "rad-schlecht"
  }, "Daneben. Alles weg.") : art === 'leiter' ? /*#__PURE__*/React.createElement("b", {
    className: "leise"
  }, "Halt dr\xFCcken, wenn das Licht gr\xFCn steht.") : /*#__PURE__*/React.createElement("b", {
    className: "leise"
  }, "W\xE4hle.")), /*#__PURE__*/React.createElement("div", {
    className: "rad-tasten risiko-tasten"
  }, art === 'leiter' && risiko.laeuft && /*#__PURE__*/React.createElement("button", {
    className: "automat-hebel",
    onClick: halt
  }, "Halt!"), !risiko.laeuft && !aus && letztes === 'gut' && /*#__PURE__*/React.createElement("button", {
    className: "automat-hebel",
    onClick: nochmal
  }, "Nochmal wagen"), !risiko.laeuft && betrag > 0 && /*#__PURE__*/React.createElement("button", {
    className: "automat-nachschub nehmen",
    onClick: () => onNehmen(betrag)
  }, betrag, " nehmen"), betrag <= 0 && /*#__PURE__*/React.createElement("button", {
    className: "automat-hebel",
    onClick: onSchliessen
  }, "Weiter"))));
};

// ── Das Fenster ──────────────────────────────────────────────────
// Der Automat ist Zeitvertreib und darf deshalb niemanden aufhalten: er
// liegt als Fenster ueber der Anwendung, nimmt keine Klicks weg und
// laesst sich am Kopf verschieben. Wer nebenbei seinen Bogen ansehen
// will, klickt einfach dorthin.
const FENSTER_BREITE = 430;
const fensterLesen = () => {
  try {
    const d = JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || 'null');
    if (d && d.fenster && Number.isFinite(+d.fenster.x)) return {
      x: +d.fenster.x,
      y: +d.fenster.y
    };
  } catch {}
  return null;
};
const fensterSchreiben = pos => {
  try {
    const d = JSON.parse(localStorage.getItem(AUTOMAT_SPEICHER) || '{}') || {};
    localStorage.setItem(AUTOMAT_SPEICHER, JSON.stringify({
      ...d,
      fenster: pos
    }));
  } catch {}
};
// Immer so viel stehen lassen, dass man den Kopf noch zu fassen bekommt.
const fensterKlemmen = pos => ({
  x: Math.max(-FENSTER_BREITE + 140, Math.min(pos.x, (window.innerWidth || 1200) - 140)),
  y: Math.max(0, Math.min(pos.y, (window.innerHeight || 800) - 60))
});

// ── Der Schirm ───────────────────────────────────────────────────
// ── Der Automat, jetzt ein Tisch unter mehreren ───────────────
// Rahmen, Kopf, Beutel und das Schieben liegen seit der Halle eine
// Ebene hoeher: sie gehoeren der Taverne und nicht dem Automaten. Hier
// steht nur noch, was auf dem Tisch passiert.
const AutomatTisch = ({
  cfg,
  marken,
  setMarken,
  onLaeuft
}) => {
  const waehrung = WAEHRUNGEN.marken;
  // Was die Spielleitung fuer dieses Abenteuer eingestellt hat.
  const symbole = React.useMemo(() => automatSymbole(cfg), [cfg]);
  const einsaetze = React.useMemo(() => automatEinsaetze(cfg), [cfg]);
  const vollbildP = React.useMemo(() => automatVollbildP(cfg), [cfg]);
  const vollbildEins = React.useMemo(() => automatVollbildEins(cfg), [cfg]);
  const [einsatz, setEinsatz] = React.useState(10);
  const [feld, setFeld] = React.useState(() => Array(9).fill('ratte'));
  const [ergebnis, setErgebnis] = React.useState(null); // {gewinn, treffer, …}
  const [freidrehe, setFreidrehe] = React.useState(0);
  const [tafelOffen, setTafelOffen] = React.useState(false);
  const [baender, setBaender] = React.useState(() => [0, 1, 2].map(() => Array(WALZEN_BAND).fill('ratte')));
  const [dreh, setDreh] = React.useState(0); // erzwingt den Neustart der Animation
  const [laeuft, setLaeuft] = React.useState(false);
  const [zeigeLinie, setZeigeLinie] = React.useState(-1); // -1 = alle
  const [zaehler, setZaehler] = React.useState(0);
  const [rad, setRad] = React.useState(null); // {basis, runde, gewonnen, winkel, dreht, aus, letztes}
  // Was gerade auf dem Tisch liegt und gesetzt werden darf: der Gewinn
  // dieses Drehs samt allem, was das Rad nachgelegt hat.
  const [riskierbar, setRiskierbar] = React.useState(0);
  const [risiko, setRisiko] = React.useState(null);
  const laufRef = React.useRef(null);
  const radRef = React.useRef(null);

  // Solange die Walzen laufen, darf der Beutel oben nicht gewechselt
  // werden — die Taverne muss davon wissen.
  React.useEffect(() => {
    if (onLaeuft) onLaeuft(laeuft);
  }, [laeuft]);
  const quote = React.useMemo(() => automatQuote(symbole, vollbildP), [symbole, vollbildP]);

  // Wer Bewegung im Betriebssystem abgeschaltet hat, bekommt das Ergebnis
  // sofort. Ein Automat ist kein Grund, sich darueber hinwegzusetzen.
  const reduziert = React.useMemo(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  // Der Lauf ist Anzeige, nicht Buchhaltung. Gebucht wird sofort — sonst
  // haenge der Ausgang eines Spiels an einem Zeitgeber, den der Browser
  // im Hintergrund beliebig lange aufschieben darf. Hier stand der
  // Automat dann auf "Läuft…" und die Taste blieb gesperrt.
  //
  // Deshalb loest jeder Weg das Ergebnis auf: der Zeitgeber, das
  // Zurueckkommen zum Fenster, und das Verlassen der Seite.
  const schwebendRef = React.useRef(null); // {e, faellig}
  const aufloesen = React.useCallback(() => {
    const sch = schwebendRef.current;
    if (!sch) return;
    schwebendRef.current = null;
    if (laufRef.current) {
      clearTimeout(laufRef.current);
      laufRef.current = null;
    }
    setLaeuft(false);
    setErgebnis(sch.e);
  }, []);
  React.useEffect(() => {
    const wach = () => {
      // Im Hintergrund gibt es nichts zu sehen; sichtbar werden heisst,
      // dass der Lauf laengst haette enden sollen.
      if (schwebendRef.current && (document.hidden || Date.now() >= schwebendRef.current.faellig)) aufloesen();
    };
    document.addEventListener('visibilitychange', wach);
    return () => {
      document.removeEventListener('visibilitychange', wach);
      if (laufRef.current) clearTimeout(laufRef.current);
    };
  }, [aufloesen]);

  // Senkt die Spielleitung den Hoechsteinsatz, darf kein Betrag stehen
  // bleiben, den es nicht mehr gibt.
  React.useEffect(() => {
    if (!einsaetze.includes(einsatz)) setEinsatz(einsaetze[einsaetze.length - 1]);
  }, [einsaetze]);

  // Wird das Browserfenster kleiner, darf die Taverne nicht draussen
  // liegenbleiben — sie waere sonst nur noch ueber das Zuruecksetzen des
  // Speichers zu erreichen.
  React.useEffect(() => {
    const anpassen = () => setPos(p => {
      const k = fensterKlemmen(p);
      return k.x === p.x && k.y === p.y ? p : k;
    });
    window.addEventListener('resize', anpassen);
    return () => window.removeEventListener('resize', anpassen);
  }, []);
  const frei = freidrehe > 0;
  const kannDrehen = !laeuft && !rad && !risiko && (frei || marken >= einsatz);
  const drehen = () => {
    if (!kannDrehen) return;
    const zahlt = frei ? 0 : einsatz;
    const neuesFeld = zieheWalzen(symbole, vollbildP);
    const e = werteAus(neuesFeld, einsatz, symbole);
    setFeld(neuesFeld);
    setBaender([0, 1, 2].map(sp => bandBauen(neuesFeld, sp, symbole)));
    setErgebnis(null);
    setZeigeLinie(-1);
    setZaehler(0);
    setRiskierbar(0);
    setRisiko(null);
    setDreh(d => d + 1);

    // Einsatz und Gewinn in einem Schritt und sofort: das Ergebnis steht
    // in dem Augenblick fest, in dem gezogen wird. Der Lauf zeigt es
    // nur noch.
    setMarken(marken - zahlt + e.gewinn);
    setFreidrehe(f => Math.max(0, f - (frei ? 1 : 0)) + (e.freidreh ? 1 : 0));
    if (reduziert) {
      setErgebnis(e);
      return;
    }
    const dauer = Math.max(...WALZEN_DAUER) + 60;
    schwebendRef.current = {
      e,
      faellig: Date.now() + dauer
    };
    setLaeuft(true);
    laufRef.current = setTimeout(aufloesen, dauer);
  };

  // Was dieser Dreh eingebracht hat, darf gesetzt werden.
  React.useEffect(() => {
    setRiskierbar(ergebnis ? ergebnis.gewinn : 0);
  }, [ergebnis]);

  // Ein Vollbild oeffnet das Rad, sobald die Walzen stehen.
  React.useEffect(() => {
    if (ergebnis && ergebnis.vollbild && ergebnis.gewinn > 0) {
      setRad({
        basis: ergebnis.gewinn,
        runde: 0,
        gewonnen: 0,
        winkel: 0,
        dreht: false,
        aus: false,
        letztes: null
      });
    }
  }, [ergebnis]);

  // Auch hier: erst zahlen, dann drehen. Der Ausgang steht fest, sobald
  // gezogen wurde — die Drehung zeigt ihn nur.
  const radAufloesen = React.useCallback(() => {
    if (!radRef.current) return;
    radRef.current = null;
    setRad(r => r && {
      ...r,
      dreht: false
    });
  }, []);
  React.useEffect(() => {
    const wach = () => {
      if (radRef.current) radAufloesen();
    };
    document.addEventListener('visibilitychange', wach);
    return () => document.removeEventListener('visibilitychange', wach);
  }, [radAufloesen]);
  const radDrehen = () => {
    if (!rad || rad.dreht || rad.aus) return;
    const gruen = Math.random() < RAD_GRUEN / RAD_FELDER;
    const feld = gruen ? 1 + Math.floor(Math.random() * RAD_GRUEN) : 0;
    const runde = rad.runde + 1;
    if (gruen) {
      setMarken(marken + rad.basis);
      setRiskierbar(w => w + rad.basis);
    }
    setRad({
      ...rad,
      winkel: radZiel(feld, rad.winkel),
      runde,
      dreht: true,
      letztes: gruen ? 'gruen' : 'rot',
      gewonnen: rad.gewonnen + (gruen ? rad.basis : 0),
      aus: !gruen || runde >= RAD_GRUEN
    });
    radRef.current = true;
    setTimeout(radAufloesen, RAD_DAUER + 40);
  };

  // Setzen heisst: der Gewinn geht von der Kasse zurueck auf den Tisch.
  // Danach entscheidet das Spiel, ob er verdoppelt zurueckkommt oder gar
  // nicht — so steht in der Kasse nie ein Betrag, ueber den noch
  // gewuerfelt wird.
  const risikoStarten = (art, halb) => {
    const gesamt = riskierbar;
    if (gesamt <= 0 || risiko) return;
    const einsatzRisiko = halb ? Math.floor(gesamt / 2) : gesamt;
    if (einsatzRisiko <= 0) return;
    setMarken(marken - einsatzRisiko);
    setRiskierbar(0);
    setRisiko({
      art,
      betrag: einsatzRisiko,
      stufe: 0,
      aus: false,
      letztes: null,
      laeuft: art === 'leiter',
      pos: 0,
      ziel: Math.floor(Math.random() * LEITER_FELDER),
      gezogen: null
    });
  };

  // Der Gewinn zaehlt hoch, statt dazustehen. Kurz genug, dass niemand
  // wartet, lang genug, dass man es merkt.
  React.useEffect(() => {
    if (!ergebnis || ergebnis.gewinn <= 0) {
      setZaehler(0);
      return;
    }
    const ziel = ergebnis.gewinn,
      start = Date.now(),
      dauer = 520;
    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dauer);
      setZaehler(Math.round(ziel * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) clearInterval(tick);
    }, 40);
    return () => clearInterval(tick);
  }, [ergebnis]);

  // Mehrere Gewinnlinien werden nacheinander gezeigt, sonst leuchtet das
  // halbe Feld und man sieht nicht, woran es lag.
  React.useEffect(() => {
    if (!ergebnis || ergebnis.treffer.length < 2) {
      setZeigeLinie(-1);
      return;
    }
    let i = 0;
    setZeigeLinie(0);
    const tick = setInterval(() => {
      i = (i + 1) % ergebnis.treffer.length;
      setZeigeLinie(i);
    }, 900);
    return () => clearInterval(tick);
  }, [ergebnis]);

  // Welche Felder gerade leuchten. Ohne Ergebnis keins, bei einer Linie
  // deren drei, bei mehreren die gerade gezeigte.
  const leuchtet = new Set();
  if (ergebnis && !laeuft) {
    const gezeigt = ergebnis.treffer.length > 1 && zeigeLinie >= 0 ? [ergebnis.treffer[zeigeLinie]] : ergebnis.treffer;
    gezeigt.forEach(t => t.felder.forEach(f => leuchtet.add(f)));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, risiko && /*#__PURE__*/React.createElement(RisikoFenster, {
    risiko: risiko,
    setRisiko: setRisiko,
    onNehmen: b => {
      setMarken(marken + b);
      setRisiko(null);
    },
    onSchliessen: () => setRisiko(null)
  }), rad && /*#__PURE__*/React.createElement("div", {
    className: "rad-huelle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rad-fenster"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rad-titel"
  }, "Rad der Fortuna"), /*#__PURE__*/React.createElement("div", {
    className: "rad-unter"
  }, "Drei gr\xFCne Felder, eines rot. Jedes gr\xFCne zahlt die", /*#__PURE__*/React.createElement("b", null, " ", rad.basis, " "), " noch einmal \u2014 h\xF6chstens dreimal."), /*#__PURE__*/React.createElement("div", {
    className: "rad-buehne"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rad-zeiger",
    "aria-hidden": "true"
  }, "\u25BC"), /*#__PURE__*/React.createElement("div", {
    className: "rad-scheibe",
    style: {
      transform: 'rotate(' + rad.winkel + 'deg)',
      transition: rad.dreht ? 'transform ' + RAD_DAUER + 'ms cubic-bezier(.16,.78,.24,1)' : 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "rad-stand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rad-runden"
  }, [1, 2, 3].map(i => /*#__PURE__*/React.createElement("i", {
    key: i,
    className: 'rad-punkt' + (rad.runde >= i ? ' voll' : '')
  }))), rad.dreht ? /*#__PURE__*/React.createElement("b", {
    className: "leise"
  }, "\u2026") : rad.letztes === 'gruen' ? /*#__PURE__*/React.createElement("b", {
    className: "rad-gut"
  }, "Noch einmal! +", rad.basis) : rad.letztes === 'rot' ? /*#__PURE__*/React.createElement("b", {
    className: "rad-schlecht"
  }, "Rot. Vorbei.") : /*#__PURE__*/React.createElement("b", {
    className: "leise"
  }, "Dreh am Rad.")), rad.gewonnen > 0 && /*#__PURE__*/React.createElement("div", {
    className: "rad-summe"
  }, "Zus\xE4tzlich gewonnen: ", /*#__PURE__*/React.createElement("b", null, rad.gewonnen)), /*#__PURE__*/React.createElement("div", {
    className: "rad-tasten"
  }, !rad.aus ? /*#__PURE__*/React.createElement("button", {
    className: "automat-hebel",
    disabled: rad.dreht,
    onClick: radDrehen
  }, rad.dreht ? 'Dreht…' : rad.runde === 0 ? 'Rad drehen' : 'Nochmal') : /*#__PURE__*/React.createElement("button", {
    className: "automat-hebel",
    disabled: rad.dreht,
    onClick: () => setRad(null)
  }, "Weiter")))), /*#__PURE__*/React.createElement("div", {
    className: "automat-mitte"
  }, /*#__PURE__*/React.createElement("div", {
    className: "automat-kasten"
  }, /*#__PURE__*/React.createElement("div", {
    className: 'automat-feld' + (laeuft ? ' laeuft' : ''),
    role: "group",
    "aria-label": "Walzen"
  }, [0, 1, 2].map(spalte => /*#__PURE__*/React.createElement("div", {
    className: "automat-walze",
    key: spalte
  }, /*#__PURE__*/React.createElement("div", {
    className: "automat-band",
    key: dreh,
    style: laeuft ? {
      animationDuration: WALZEN_DAUER[spalte] + 'ms'
    } : {
      transform: 'translateY(-81.25%)'
    }
  }, baender[spalte].map((k, i) => {
    // Nur die letzten drei Zellen sind das Ergebnis; sie
    // tragen die Hervorhebung, sobald die Walze steht.
    const reihe = i - (WALZEN_BAND - 3);
    const feldNr = reihe >= 0 ? reihe * 3 + spalte : -1;
    return /*#__PURE__*/React.createElement("div", {
      className: 'automat-zelle' + (leuchtet.has(feldNr) ? ' treffer' : ''),
      key: i
    }, /*#__PURE__*/React.createElement("span", null, symbolVon(k, symbole).z));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "automat-meldung",
    "aria-live": "polite"
  }, laeuft ? /*#__PURE__*/React.createElement("span", {
    className: "leise"
  }, "\u2026") : !ergebnis ? /*#__PURE__*/React.createElement("span", {
    className: "leise"
  }, "Einsatz w\xE4hlen und drehen.") : ergebnis.gewinn > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", {
    className: "gewinn"
  }, "+", zaehler), /*#__PURE__*/React.createElement("span", {
    className: "leise"
  }, ergebnis.treffer.length > 1 && zeigeLinie >= 0 ? ergebnis.treffer[zeigeLinie].name + ' · ' + ergebnis.treffer[zeigeLinie].sym.name + '  ·  +' + ergebnis.treffer[zeigeLinie].betrag + '   (' + (zeigeLinie + 1) + ' von ' + ergebnis.treffer.length + ')' : ergebnis.treffer.map(t => t.name + ' · ' + t.sym.name).join('   '))) : /*#__PURE__*/React.createElement("span", {
    className: "leise"
  }, "Nichts. Nochmal."), ergebnis && ergebnis.vollbild && /*#__PURE__*/React.createElement("span", {
    className: "vollbild"
  }, "Vollbild!"), freidrehe > 0 && /*#__PURE__*/React.createElement("span", {
    className: "freidreh"
  }, "\uD83E\uDE99 ", freidrehe, " Freidreh", freidrehe > 1 ? 'e' : '')), /*#__PURE__*/React.createElement("div", {
    className: "automat-einsatz"
  }, /*#__PURE__*/React.createElement("span", {
    className: "automat-label"
  }, "Einsatz"), einsaetze.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: 'automat-chip' + (einsatz === n ? ' aktiv' : ''),
    disabled: frei,
    onClick: () => setEinsatz(n)
  }, n))), /*#__PURE__*/React.createElement("button", {
    className: 'automat-hebel' + (frei ? ' frei' : ''),
    disabled: !kannDrehen,
    onClick: drehen
  }, laeuft ? 'Läuft…' : rad ? 'Das Rad läuft' : frei ? '🪙 Freidreh' : kannDrehen ? 'Drehen · ' + einsatz : 'Zu wenig Marken'), riskierbar > 0 && !laeuft && !rad && !risiko && /*#__PURE__*/React.createElement("div", {
    className: "risiko-angebot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "risiko-angebot-text"
  }, riskierbar, " setzen?"), /*#__PURE__*/React.createElement("button", {
    className: "risiko-knopf",
    onClick: () => risikoStarten('leiter', false)
  }, "\uD83E\uDE9C Leiter"), /*#__PURE__*/React.createElement("button", {
    className: "risiko-knopf",
    onClick: () => risikoStarten('karte', false)
  }, "\uD83C\uDCA0 Rabe oder Rose"), riskierbar >= 2 && /*#__PURE__*/React.createElement("button", {
    className: "risiko-knopf halb",
    title: "Nur die H\xE4lfte setzen, den Rest behalten",
    onClick: () => risikoStarten('leiter', true)
  }, "\xBD Leiter")), marken < einsaetze[0] && !frei && !laeuft && /*#__PURE__*/React.createElement("button", {
    className: "automat-nachschub",
    onClick: () => setMarken(MARKEN_START)
  }, "Der Wirt legt ", MARKEN_START, " Marken nach")), /*#__PURE__*/React.createElement("div", {
    className: "automat-tafel"
  }, /*#__PURE__*/React.createElement("button", {
    className: "automat-tafel-kopf",
    onClick: () => setTafelOffen(o => !o),
    "aria-expanded": tafelOffen
  }, /*#__PURE__*/React.createElement("span", null, tafelOffen ? '▾' : '▸', " Auszahlungen"), /*#__PURE__*/React.createElement("i", null, "Quote ", (quote * 100).toFixed(1).replace('.', ','), " %")), tafelOffen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("table", {
    className: "automat-tabelle"
  }, /*#__PURE__*/React.createElement("tbody", null, [...symbole].reverse().map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.k
  }, /*#__PURE__*/React.createElement("td", {
    className: "sym"
  }, s.z, s.z, s.z), /*#__PURE__*/React.createElement("td", {
    className: "nam"
  }, s.name, s.freidreh && /*#__PURE__*/React.createElement("i", null, "bringt einen Freidreh"), s.speise && /*#__PURE__*/React.createElement("i", null, "z\xE4hlt f\xFCrs Vollbild")), /*#__PURE__*/React.createElement("td", {
    className: "zahl"
  }, zahlText(s.zahlt), " \xD7"))))), /*#__PURE__*/React.createElement("p", {
    className: "automat-fussnote"
  }, "F\xFCnf Linien: die drei Reihen und die beiden Diagonalen. Drei gleiche Symbole auf einer Linie zahlen das Vielfache des Einsatzes. Die Quote ist aus H\xE4ufigkeit und Auszahlung gerechnet, nicht gesch\xE4tzt."), /*#__PURE__*/React.createElement("p", {
    className: "automat-fussnote"
  }, /*#__PURE__*/React.createElement("b", null, "Vollbild"), " \u2014 alle neun Felder dieselbe Speise: f\xFCnf Linien auf einmal und danach das Rad der Fortuna.", ' ', vollbildEins ? 'Etwa jede ' + vollbildEins + '. Drehung.' : 'Nur, wenn es von allein fällt — und das tut es so gut wie nie.')))));
};

// ══ Die Spielhalle ══════════════════════════════════════════
// Aus der Taverne wird ein Eingang mit mehreren Tischen. Der Automat
// ist einer davon; die anderen stehen schon in der Liste, damit man
// sieht, was das Haus vorhat — aufgebaut sind sie noch nicht, und das
// steht auch dabei. Ein Tisch, den es nicht gibt, wird nicht angeboten,
// als gaebe es ihn.
//
// Was hier oben liegt und alle Tische benutzen: das Fenster, der Kopf
// mit Beutel und Beutelwechsler, das Schieben, das Schliessen. Ein
// zweiter Tisch braucht davon nichts noch einmal zu bauen.
const TAVERNEN_TISCHE = [{
  k: 'automat',
  z: '🎰',
  name: 'Dreifaches Glück',
  unter: 'Drei Walzen, fünf Linien, Rad der Fortuna',
  rand: 'Einsatz 5–50',
  da: true
}, {
  k: 'blackjack',
  z: '🃏',
  name: 'Blackjack',
  unter: 'Gegen den Wirt. Blackjack zahlt anderthalbfach',
  rand: 'Bank ≈ 0,5 %'
}, {
  k: 'roulette',
  z: '🎡',
  name: 'Französisches Roulette',
  unter: 'Ein Zéro, La Partage — die mildeste Bank im Haus',
  rand: 'Bank 1,35 %'
}, {
  k: 'craps',
  z: '🎲',
  name: 'Craps',
  unter: 'Zwei Würfel, ein Punkt — und die Odds ohne Hausanteil',
  rand: 'Bank 1,4 %'
}, {
  k: 'rennen',
  z: '🐎',
  name: 'Die Rennbahn vor dem Tor',
  unter: 'Sechs Pferde, echt gelaufen — die Quoten kommen aus dem Lauf',
  rand: 'Bank 12 %'
}];

// Welche Tische die Spielleitung fuer dieses Abenteuer geschlossen hat.
// Nichts eingetragen heisst: alle offen — wie ueberall im Heldenbuch.
const tavernenZu = cfg => {
  const l = cfg && Array.isArray(cfg.zu) ? cfg.zu : [];
  return TAVERNEN_TISCHE.filter(t => !l.includes(t.k));
};
const TavernenHalle = ({
  tische,
  onWahl
}) => /*#__PURE__*/React.createElement("div", {
  className: "halle"
}, tische.length === 0 ? /*#__PURE__*/React.createElement("div", {
  className: "halle-leer"
}, "Heute ist geschlossen \u2014 die Spielleitung hat alle Tische abgeraeumt.") : tische.map(t => /*#__PURE__*/React.createElement("button", {
  type: "button",
  key: t.k,
  className: 'halle-tisch' + (t.da ? '' : ' spaeter'),
  disabled: !t.da,
  onClick: () => t.da && onWahl(t.k),
  title: t.da ? t.name : 'Dieser Tisch wird noch gebaut'
}, /*#__PURE__*/React.createElement("span", {
  className: "halle-zeichen"
}, t.z), /*#__PURE__*/React.createElement("span", {
  className: "halle-text"
}, /*#__PURE__*/React.createElement("span", {
  className: "halle-name"
}, t.name), /*#__PURE__*/React.createElement("span", {
  className: "halle-unter"
}, t.unter)), /*#__PURE__*/React.createElement("span", {
  className: "halle-rand"
}, t.da ? t.rand : 'im Bau'))));
const TaverneSchirm = ({
  cfg,
  helden,
  heldStart,
  onSchliessen
}) => {
  const waehrung = WAEHRUNGEN.marken;
  // Wessen Beutel auf dem Tisch liegt: der offene Bogen, sonst der
  // zuletzt bespielte, sonst der erste. Ohne Bogen geht es auch.
  const stall = helden && helden.length ? helden : [];
  const [heldId, setHeldId] = React.useState(() => {
    if (heldStart && stall.some(h => h.id === heldStart)) return heldStart;
    const z = waehrung.zuletzt();
    if (z && stall.some(h => h.id === z)) return z;
    return stall.length ? stall[0].id : null;
  });
  const [marken, setMarkenRoh] = React.useState(() => waehrung.lesen(heldId));
  const [tisch, setTisch] = React.useState(null); // null = die Halle
  const [laeuft, setLaeuft] = React.useState(false); // sperrt Beutel und Rueckweg
  const [pos, setPos] = React.useState(() => fensterLesen() || fensterKlemmen({
    x: Math.max(20, (window.innerWidth || 1200) - FENSTER_BREITE - 40),
    y: 70
  }));
  const zug = React.useRef(null); // {dx, dy} waehrend des Schiebens

  const setMarken = n => {
    const m = Math.max(0, Math.round(n));
    waehrung.schreiben(heldId, m);
    setMarkenRoh(m);
  };
  // Wechselt der Beutel, kommt der Stand des anderen Helden auf den Tisch.
  React.useEffect(() => {
    setMarkenRoh(waehrung.lesen(heldId));
  }, [heldId]);
  const offen = React.useMemo(() => tavernenZu(cfg), [cfg]);
  const jetzt = tisch ? TAVERNEN_TISCHE.find(t => t.k === tisch) : null;
  // Ein Tisch, den die Spielleitung zwischendurch schliesst, laesst
  // einen nicht darin sitzen.
  React.useEffect(() => {
    if (tisch && !offen.some(t => t.k === tisch)) setTisch(null);
  }, [offen, tisch]);

  // Schieben am Kopf. Zeigerereignisse statt Maus: dasselbe fuer Finger
  // und Stift, und der Zeiger bleibt beim Fenster, auch wenn er darueber
  // hinausrutscht.
  const zugStart = e => {
    if (e.target.closest('button, select')) return; // Knoepfe schieben nicht
    zug.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const zugBewegen = e => {
    if (!zug.current) return;
    setPos(fensterKlemmen({
      x: e.clientX - zug.current.dx,
      y: e.clientY - zug.current.dy
    }));
  };
  const zugEnde = () => {
    if (zug.current) {
      zug.current = null;
      fensterSchreiben(pos);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "automat-schirm",
    style: {
      left: pos.x,
      top: pos.y,
      width: FENSTER_BREITE
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "automat-kopf",
    onPointerDown: zugStart,
    onPointerMove: zugBewegen,
    onPointerUp: zugEnde,
    onPointerCancel: zugEnde,
    title: "Zum Verschieben ziehen"
  }, jetzt && /*#__PURE__*/React.createElement("button", {
    className: "automat-x zurueck",
    onClick: () => setTisch(null),
    disabled: laeuft,
    "aria-label": "Zur\xFCck in die Halle",
    title: "Zur\xFCck in die Halle"
  }, "\u2039"), /*#__PURE__*/React.createElement("div", {
    className: "automat-kopf-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "automat-titel"
  }, jetzt ? jetzt.z + ' ' + jetzt.name : '🍺 Taverne des Glücks'), /*#__PURE__*/React.createElement("div", {
    className: "automat-ort"
  }, stall.length > 1 ? /*#__PURE__*/React.createElement("select", {
    className: "automat-beutel",
    value: heldId || '',
    disabled: laeuft,
    onPointerDown: e => e.stopPropagation(),
    onChange: e => setHeldId(e.target.value),
    "aria-label": "Wessen Beutel auf dem Tisch liegt",
    title: "Wessen Beutel auf dem Tisch liegt"
  }, stall.map(h => /*#__PURE__*/React.createElement("option", {
    key: h.id,
    value: h.id
  }, h.name))) : stall.length === 1 ? stall[0].name : offen.length + (offen.length === 1 ? ' Tisch' : ' Tische'))), /*#__PURE__*/React.createElement("div", {
    className: "automat-kasse"
  }, /*#__PURE__*/React.createElement("span", null, waehrung.kurz), /*#__PURE__*/React.createElement("b", null, marken), /*#__PURE__*/React.createElement("i", null, waehrung.name)), /*#__PURE__*/React.createElement("button", {
    className: "automat-x",
    onClick: onSchliessen,
    "aria-label": "Schlie\xDFen"
  }, "\u2715")), jetzt && jetzt.k === 'automat' ? /*#__PURE__*/React.createElement(AutomatTisch, {
    cfg: cfg,
    marken: marken,
    setMarken: setMarken,
    onLaeuft: setLaeuft
  }) : /*#__PURE__*/React.createElement("div", {
    className: "automat-mitte halle-mitte"
  }, /*#__PURE__*/React.createElement(TavernenHalle, {
    tische: offen,
    onWahl: setTisch
  }), /*#__PURE__*/React.createElement("div", {
    className: "halle-fuss"
  }, "Gespielt wird mit Spielmarken, und die liegen im Beutel des Helden \u2014 nichts davon ber\xFChrt einen Bogen. Was das Haus an einem Tisch verdient, steht am Tisch.")));
};

// ==== js/src/2g-kampfsicht.jsx ====
// Heldenbuch — der Kampf, wie ihn die Runde sieht.
//
// Der Kampftracker gehoert der Spielleitung. Was hier steht, ist die
// andere Seite desselben Kampfes: die Reihenfolge, wer dran ist, wie es
// den Figuren geht. Keine Zahlen der Gegner, keine Notizen, kein
// Protokoll — und das nicht, weil diese Ansicht sie weglaesst, sondern
// weil der Server sie gar nicht erst mitschickt (api.php,
// kampfFuerSpieler). Was hier ankommt, darf hier stehen.
//
// Bei den Helden gilt weiter die Regel des Bogens: zeigt das Abenteuer
// die Trefferpunkte offen, stehen die Zahlen da; sonst der Zustand.

// Die Farbe zum Zustand — dieselbe Leiter wie im Bogen, hier ueber den
// Namen gefunden, weil vom Server nur er und ein grober Balken kommen.
const zustandFarbe = label => (TP_ZUSTAENDE.find(z => z.label === label) || TP_ZUSTAENDE[TP_ZUSTAENDE.length - 1]).color;
const KampfSichtZeile = ({
  t,
  dran,
  helden,
  setDefs,
  tpOffen,
  eigenerHeld
}) => {
  const held = t.art === 'held';
  const c = held ? (helden || []).find(h => h.id === t.charId) : null;
  const w = c ? charWerte(c, setDefs) : null;

  // Beim Gegner kommt der Zustand fertig vom Server. Beim Helden steht er
  // im Bogen, und ob die Zahl dazu sichtbar ist, entscheidet das
  // Abenteuer — genau wie in der Heldenliste.
  const zustand = held ? w ? tpZustand(w.hp, w.maxHp) : null : {
    label: t.zustand || '—',
    balken: +t.balken || 0,
    color: zustandFarbe(t.zustand)
  };
  const anteil = held ? w ? Math.max(0, Math.min(1, w.hp / Math.max(1, w.maxHp))) : 0 : +t.balken || 0;
  const farbe = held && tpOffen && w ? anteil > 0.5 ? '#56b183' : anteil > 0.25 ? 'var(--inspiration)' : '#e05a5a' : zustand ? zustand.color : 'var(--text-muted)';
  return /*#__PURE__*/React.createElement("div", {
    className: 'ks-zeile' + (dran ? ' dran' : '') + (held ? ' held' : ' gegner') + (eigenerHeld ? ' eigen' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "ks-ini"
  }, t.ini === null || t.ini === undefined ? '—' : t.ini), /*#__PURE__*/React.createElement("div", {
    className: "ks-name"
  }, /*#__PURE__*/React.createElement("b", null, held ? c ? c.name : 'Held' : t.name || 'Gegner'), held && c && /*#__PURE__*/React.createElement("i", null, (c.race ? c.race + ' · ' : '') + c.charClass + ' ' + c.level), /*#__PURE__*/React.createElement("div", {
    className: "ks-marken"
  }, dran && /*#__PURE__*/React.createElement("span", {
    className: "ks-dran"
  }, "am Zug"), eigenerHeld && /*#__PURE__*/React.createElement("span", {
    className: "ks-eigen"
  }, "dein Held"), t.vorteil && /*#__PURE__*/React.createElement("span", {
    className: "ks-marke gut"
  }, "\uD83D\uDC4D Vorteil"), t.nachteil && /*#__PURE__*/React.createElement("span", {
    className: "ks-marke schlecht"
  }, "\uD83D\uDC4E Nachteil"), (t.erschoepfung || 0) > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ks-marke ersch"
  }, "Ersch\xF6pfung ", t.erschoepfung), (t.zustaende || []).map(z => /*#__PURE__*/React.createElement("span", {
    className: "ks-marke",
    key: z
  }, z)))), /*#__PURE__*/React.createElement("div", {
    className: "ks-tp"
  }, held && tpOffen && w ? /*#__PURE__*/React.createElement("span", {
    className: "ks-zahl",
    style: {
      color: farbe
    }
  }, w.hp, " ", /*#__PURE__*/React.createElement("i", null, "/ ", w.maxHp)) : /*#__PURE__*/React.createElement("span", {
    className: "ks-zustand",
    style: {
      color: farbe
    }
  }, zustand ? zustand.label : '—'), /*#__PURE__*/React.createElement("span", {
    className: "ks-balken"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: (held && tpOffen ? anteil : zustand ? zustand.balken : 0) * 100 + '%',
      background: farbe
    }
  }))));
};

// ── Der Spieler sagt an ─────────────────────────────────────────
// Er waehlt aus seinem eigenen Bogen — dieselbe Auswahl, die auch die
// Spielleitung benutzt (AktionsWahl) — und tippt die Ziele an. Was
// dabei nicht vorkommt, ist eine Zahl: wie viel ankommt, weiss er
// nicht, und die Trefferpunkte der Gegner gehen ihn nichts an. Er sagt
// an, die Spielleitung traegt ein.
const AnsageFenster = ({
  held,
  kampf,
  helden,
  runde,
  onAbbrechen,
  onSenden
}) => {
  const waffen = held && held.weapons || [];
  const sprueche = sortierteSprueche(held);
  const [wahl, setWahl] = React.useState({
    art: waffen.length ? 'angriff' : sprueche.length ? 'zauber' : 'frei',
    i: null,
    grad: 0,
    suche: ''
  });
  const [ziele, setZiele] = React.useState({});
  const [text, setText] = React.useState('');
  const [laeuft, setLaeuft] = React.useState(false);
  const {
    gegenstand,
    grundGrad,
    grad,
    wurf
  } = aktionsStand(held, wahl);
  const liste = kampf && kampf.teilnehmer || [];
  const zielUm = id => setZiele(z => {
    if (z[id]) {
      const k = {
        ...z
      };
      delete k[id];
      return k;
    }
    return {
      ...z,
      [id]: true
    };
  });
  const zielName = t => t.art === 'held' ? ((helden || []).find(h => h.id === t.charId) || {}).name || 'Held' : t.name || 'Gegner';
  const etwasDa = !!gegenstand || !!text.trim() || Object.keys(ziele).length > 0;
  const senden = async () => {
    setLaeuft(true);
    await onSenden({
      art: wahl.art,
      was: gegenstand ? gegenstand.name || '' : '',
      grad: wahl.art === 'zauber' && grad > grundGrad ? grad : 0,
      // Beides: die Namen zum Lesen und die Kennungen zum Weitergeben —
      // damit im Zugfenster der Spielleitung schon angekreuzt ist, worauf
      // der Spieler zielt.
      ziele: Object.keys(ziele).map(id => zielName(liste.find(x => x.id === id) || {})),
      zielIds: Object.keys(ziele),
      text: text.trim()
    });
    setLaeuft(false);
  };
  return /*#__PURE__*/React.createElement(Fenster, {
    onClick: onAbbrechen
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-fenster",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-kopf"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-titel"
  }, "\u270D ", held ? held.name : 'Ansage'), /*#__PURE__*/React.createElement("span", {
    className: "zug-wer"
  }, "Runde ", runde, " \xB7 was hast du vor?")), /*#__PURE__*/React.createElement("div", {
    className: "zug-leib"
  }, /*#__PURE__*/React.createElement(AktionsWahl, {
    held: held,
    wahl: wahl,
    setWahl: setWahl,
    wer: "du"
  }), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Auf wen"), /*#__PURE__*/React.createElement("div", {
    className: "zug-ziele"
  }, liste.map(t => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: t.id,
    className: 'zug-ziel' + (ziele[t.id] ? ' an' : '') + (t.art === 'held' ? ' held' : ''),
    onClick: () => zielUm(t.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-ziel-kopf"
  }, /*#__PURE__*/React.createElement("b", null, zielName(t))), /*#__PURE__*/React.createElement("span", {
    className: "zug-ziel-tp"
  }, t.art === 'held' ? t.charId === (held || {}).id ? 'du' : 'Held' : t.zustand || ''))))), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Beschreibung \u2014 was du tust"), /*#__PURE__*/React.createElement("textarea", {
    className: "zug-frei",
    value: text,
    onChange: e => setText(e.target.value),
    maxLength: 500,
    "aria-label": "Beschreibung deiner Aktion",
    placeholder: "Ich springe hinter den Karren und schleudere Feuer \xFCber die Lichtung."
  })), /*#__PURE__*/React.createElement("div", {
    className: "zug-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "zug-label"
  }, "Das geht so an die Spielleitung"), /*#__PURE__*/React.createElement("div", {
    className: "zug-vorschau"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pr-zeile zug"
  }, "\u25B8 ", held ? held.name : 'Du', " sagt an"), gegenstand && /*#__PURE__*/React.createElement("div", {
    className: "pr-zeile"
  }, "   ", wahl.art === 'zauber' ? 'Zauber' : 'Angriff', ": ", gegenstand.name, wahl.art === 'zauber' && grad > grundGrad ? ' · ' + grad + '. Grad' : '', wurf ? ' (' + wurf + ')' : ''), Object.keys(ziele).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "pr-zeile"
  }, "   auf ", Object.keys(ziele).map(id => zielName(liste.find(x => x.id === id) || {})).join(', ')), text.trim() && /*#__PURE__*/React.createElement("div", {
    className: "pr-zeile frei"
  }, "   \u201E", text.trim(), "\u201C"), !etwasDa && /*#__PURE__*/React.createElement("i", null, "W\xE4hle etwas aus oder schreib einen Satz.")))), /*#__PURE__*/React.createElement("div", {
    className: "zug-fuss"
  }, /*#__PURE__*/React.createElement("span", {
    className: "zug-hinweis"
  }, "Wie viel ankommt, tr\xE4gt die Spielleitung ein."), /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: onAbbrechen
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    disabled: !etwasDa || laeuft,
    onClick: senden
  }, laeuft ? 'Wird gesendet…' : '📣 An die Spielleitung'))));
};

// Wie die Taverne: ein Fenster, das ueber der Anwendung liegt, aber
// keine Klicks wegnimmt. Wer waehrend des Kampfes in seinem Bogen
// nachsehen will, tippt einfach dorthin — der Kampf bleibt offen und
// bleibt stehen, wo man ihn hingeschoben hat.
const KS_SPEICHER = 'hb_kampfsicht_fenster';
const KS_BREITE = 460;
const ksLesen = () => {
  try {
    const d = JSON.parse(localStorage.getItem(KS_SPEICHER) || 'null');
    if (d && Number.isFinite(+d.x)) return {
      x: +d.x,
      y: +d.y
    };
  } catch {}
  return null;
};
const ksSchreiben = pos => {
  try {
    localStorage.setItem(KS_SPEICHER, JSON.stringify(pos));
  } catch {}
};
// Immer so viel stehen lassen, dass man den Kopf noch zu fassen bekommt.
const ksKlemmen = pos => ({
  x: Math.max(-KS_BREITE + 140, Math.min(pos.x, (window.innerWidth || 1200) - 140)),
  y: Math.max(0, Math.min(pos.y, (window.innerHeight || 800) - 60))
});
const KampfSicht = ({
  kampf,
  helden,
  eigeneIds,
  setDefs,
  tpOffen,
  onAnsage,
  onSchliessen
}) => {
  const [pos, setPos] = React.useState(() => ksLesen() || ksKlemmen({
    x: Math.max(16, (window.innerWidth || 1200) - KS_BREITE - 32),
    y: 76
  }));
  const zug = React.useRef(null);
  const zugStart = e => {
    if (e.target.closest('button')) return; // der Schliessknopf schiebt nicht
    zug.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const zugBewegen = e => {
    if (!zug.current) return;
    setPos(ksKlemmen({
      x: e.clientX - zug.current.dx,
      y: e.clientY - zug.current.dy
    }));
  };
  const zugEnde = () => {
    if (zug.current) {
      zug.current = null;
      ksSchreiben(pos);
    }
  };
  if (!kampf) return null;
  const liste = kampf.teilnehmer || [];
  const dranIdx = Math.max(0, Math.min(liste.length - 1, +kampf.zug || 0));
  const dran = liste[dranIdx] || null;
  const dranName = dran ? dran.art === 'held' ? ((helden || []).find(h => h.id === dran.charId) || {}).name || 'Held' : dran.name || 'Gegner' : '';
  return /*#__PURE__*/React.createElement("div", {
    className: "ks-fenster",
    style: {
      left: pos.x,
      top: pos.y,
      width: KS_BREITE
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ks-kopf",
    onPointerDown: zugStart,
    onPointerMove: zugBewegen,
    onPointerUp: zugEnde,
    onPointerCancel: zugEnde,
    title: "Zum Verschieben ziehen"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ks-titel"
  }, "\u2694 ", kampf.name || 'Kampf'), /*#__PURE__*/React.createElement("span", {
    className: "ks-runde"
  }, /*#__PURE__*/React.createElement("span", null, "Runde"), /*#__PURE__*/React.createElement("b", null, kampf.runde || 1)), /*#__PURE__*/React.createElement("span", {
    className: "ks-dran-kopf"
  }, dranName ? /*#__PURE__*/React.createElement(React.Fragment, null, "Am Zug: ", /*#__PURE__*/React.createElement("b", null, dranName)) : 'Niemand am Zug'), /*#__PURE__*/React.createElement("button", {
    className: "kampf-kopf-x",
    onClick: onSchliessen,
    title: "Schlie\xDFen \u2014 der Kampf l\xE4uft weiter",
    "aria-label": "Schlie\xDFen"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "ks-liste"
  }, liste.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "ks-leer"
  }, "Noch steht niemand in der Reihe.") : liste.map((t, i) => /*#__PURE__*/React.createElement(KampfSichtZeile, {
    key: t.id || i,
    t: t,
    dran: i === dranIdx,
    helden: helden,
    setDefs: setDefs,
    tpOffen: tpOffen,
    eigenerHeld: t.art === 'held' && (eigeneIds || []).includes(t.charId)
  }))), (kampf.ansagen || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "ks-ansagen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ks-ansagen-titel"
  }, "\uD83D\uDCE3 Angesagt"), (kampf.ansagen || []).slice(-6).map(a => /*#__PURE__*/React.createElement("div", {
    className: "ks-ansage",
    key: a.id
  }, /*#__PURE__*/React.createElement("b", null, ((helden || []).find(h => h.id === a.charId) || {}).name || 'Jemand'), a.was ? /*#__PURE__*/React.createElement("span", null, a.art === 'zauber' ? ' zaubert ' : ' greift an mit ', a.was, a.grad ? ' · ' + a.grad + '. Grad' : '') : null, (a.ziele || []).length ? /*#__PURE__*/React.createElement("span", null, " \u2192 ", (a.ziele || []).join(', ')) : null, a.text ? /*#__PURE__*/React.createElement("i", null, "\u201E", a.text, "\u201C") : null))), /*#__PURE__*/React.createElement("div", {
    className: "ks-fuss"
  }, onAnsage ? /*#__PURE__*/React.createElement("button", {
    className: "ks-ansage-knopf",
    onClick: onAnsage
  }, "\u270D Ansagen, was du tust") : null, /*#__PURE__*/React.createElement("span", null, "Was die Spielleitung notiert, steht hier nicht \u2014 und die Trefferpunkte der Gegner bleiben ihre Sache. Was du hier siehst, siehst du auch am Tisch.")));
};

// ==== js/src/3-sheet.jsx ====
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
    addArmorProf,
    addLanguage,
    addLog,
    addResource,
    addToolProf,
    addWeaponProf,
    appAlert,
    appConfirm,
    archiveChar,
    armorProfs,
    cc,
    charMenuOpen,
    chars,
    chgMax,
    collapsedLevels,
    computedAC,
    cur,
    darfBearbeiten,
    delArmorProf,
    deleteChar,
    delFeature,
    delItem,
    delLanguage,
    delNote,
    delResource,
    delSpell,
    delToolProf,
    delWeaponProf,
    displayAC,
    effCur,
    exFeature,
    exItem,
    exNote,
    exSpell,
    fx,
    fxOn,
    fxTitle,
    initTotal,
    insp,
    inspMax,
    invRarity,
    invTagFilter,
    isDmMode,
    itemFx,
    klassen,
    languages,
    notesList,
    noteTagFilter,
    openEdit,
    openNew,
    openTpl,
    openUnprepared,
    patchChar,
    patchCurrent,
    resEdit,
    resetAll,
    resources,
    save,
    sel,
    selectChar,
    setCharMenuOpen,
    setCoinDelta,
    setCoinPopover,
    setCollapsedLevels,
    setExFeature,
    setExNote,
    setExSpell,
    setFf,
    setFfEditId,
    setImgViewer,
    setInsp,
    setInspMax,
    setInvRarity,
    setInvTagFilter,
    setItemViewer,
    setItf,
    setItfEditId,
    setNf,
    setNfEditId,
    setNoteTagFilter,
    setOpenUnprepared,
    setResEdit,
    setSf,
    setSfEditId,
    setShowFF,
    setShowIF,
    setShowNF,
    setShowSF,
    setShowTransfer,
    setShowWF,
    setSlotsEdit,
    setSpEdit,
    setSpellTagFilter,
    setStatsEdit,
    setTab,
    setTransferMode,
    setTransferSel,
    setWeaponViewer,
    setWf,
    setWfEditId,
    setWsExpand,
    slots,
    slotsEdit,
    sp,
    spChgMax,
    spEdit,
    spellTagFilter,
    statsEdit,
    switchList,
    tab,
    tpOffen,
    toggleEquipped,
    toggleFeatureFx,
    toggleJoAT,
    toggleSave,
    toggleSkill,
    toggleSpellPrepared,
    toggleWsFav,
    togResourcePip,
    togSlot,
    togSP,
    toolProfs,
    tplData,
    transferMode,
    transferSel,
    unarchiveChar,
    updResource,
    updSP,
    weaponProfs,
    weaponStats,
    wsExpand
  } = React.useContext(SheetCtx);

  // Eigener Zustand in Sheet — moeglich, seit Sheet eine eigenstaendige
  // Komponente ist. Vorher haette ihn jedes Rendern zurueckgesetzt.
  const [leisteWahlOffen, setLeisteWahlOffen] = useState(false);
  // Schaden und Heilung ausserhalb des Kampfes. Dieselben Regeln und
  // dasselbe Fenster wie im Kampftracker — wer beides bedient, soll nicht
  // zwei Bedienungen lernen muessen.
  const [tpDlg, setTpDlg] = useState(null); // 'schaden' | 'heilung' | 'temp' | 'maxtemp'
  const [nachgetragen, setNachgetragen] = useState(null); // Rueckmeldung des Einlesers
  const [werkzeugOffen, setWerkzeugOffen] = useState(false);
  const [invSuche, setInvSuche] = useState("");
  const invSucheRef = useRef(null);
  // Nach dem Zuruecksetzen steht der Zeiger wieder im Feld: der haeufigste
  // naechste Schritt ist eine neue Suche, nicht das Blaettern.
  const invFilterLeeren = () => {
    setInvSuche("");
    setInvRarity('all');
    setInvTagFilter([]);
    if (invSucheRef.current) invSucheRef.current.focus();
  };
  if (!cur) return /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-rune"
  }, "\u2694"), /*#__PURE__*/React.createElement("div", {
    className: "empty-title"
  }, "Kein Held ausgew\xE4hlt"), /*#__PURE__*/React.createElement("div", {
    className: "empty-sub"
  }, "W\xE4hle einen Helden aus der Liste", /*#__PURE__*/React.createElement("br", null), "oder erstelle einen neuen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: openNew,
    style: {
      marginTop: 8
    }
  }, "\u2726 Jetzt erstellen"));
  const sbl = {};
  (cur.spells || []).forEach(s => {
    if (!sbl[s.level]) sbl[s.level] = [];
    sbl[s.level].push(s);
  });
  Object.keys(sbl).forEach(l => sbl[l].sort((a, b) => a.name.localeCompare(b.name, 'de')));
  const sls = Object.keys(sbl).map(Number).sort((a, b) => a - b);
  const inv = cur.inventory || [];
  const currency = cur.currency || {
    pp: 0,
    gp: 0,
    ep: 0,
    sp: 0,
    cp: 0
  };
  const totalGp = currency.pp * 10 + currency.gp + currency.ep * 0.5 + currency.sp * 0.1 + currency.cp * 0.01;
  const totalWeight = inv.reduce((s, i) => s + (parseFloat(i.weight) || 0) * i.qty, 0);

  // ── Werte fuer die mitscrollende Leiste ──────────────────────────
  // Der Katalog fuehrt alles, was dort stehen kann; gezeigt wird, was der
  // Held ausgewaehlt hat. feld: bei Werten, die im Bearbeiten-Modus direkt
  // eingegeben werden. t: betroffenes Effektziel, faerbt den Wert und
  // erklaert ihn im Tooltip.
  // Womit gezaubert wird, steht seit v4.3 in der Klassenliste des
  // Abenteuers — auch fuer eine Hausklasse, die im Regelwerk nicht steht.
  const spAttrL = klassenAttr(cur.charClass, klassen);
  const spSGL = spAttrL ? fx('spellDc', 8 + effCur.profBonus + mod(effCur[spAttrL])) : null;
  const spAtkL = spAttrL ? fx('spellAttack', effCur.profBonus + mod(effCur[spAttrL])) : null;
  const wahrSkill = SKILLS.find(x => x.key === 'aufmerksamkeit');
  const passivWert = (() => {
    if (!wahrSkill) return null;
    const isP = (cur.skillProfs || []).includes(wahrSkill.key);
    const isE = (cur.expertiseProfs || []).includes(wahrSkill.key);
    const joat = cur.jackOfAllTrades && !isP && !isE;
    const b = isE ? effCur.profBonus * 2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus / 2) : 0;
    // Das Beobachter-Talent hebt nur die passive Wahrnehmung, nicht den
    // Wurf — deshalb ein eigenes Ziel und keine Fertigkeitserhoehung.
    return fx('passivePerception', 10 + fx('skill_' + wahrSkill.key, fx('skillAll', mod(effCur[wahrSkill.attr]) + b)));
  })();
  // ── Trefferpunkte ausserhalb des Kampfes ──
  // Gleiche Regeln wie im Kampf: temporaere Punkte fangen zuerst, Heilung
  // deckelt am wirksamen Maximum, und wer wieder ueber null steht,
  // wuerfelt nicht mehr ums Ueberleben.
  const tpMerken = (alt, neu) => {
    if (alt > 0 && neu <= 0) addLog(cur.id, cur.name, 'charakter', 'Bei 0 Trefferpunkten');else if (alt <= 0 && neu > 0) addLog(cur.id, cur.name, 'charakter', 'Wieder auf den Beinen: ' + neu + ' TP');
  };
  const tpSchaden = n => patchCurrent(c => {
    const vomTemp = Math.min(+c.tempHp || 0, n);
    const neu = Math.max(0, (+c.hp || 0) - (n - vomTemp));
    tpMerken(+c.hp || 0, neu);
    return {
      tempHp: (+c.tempHp || 0) - vomTemp,
      hp: neu
    };
  });
  const tpHeilen = n => patchCurrent(c => {
    const neu = Math.min(effCur.maxHp, Math.max(0, (+c.hp || 0) + n));
    tpMerken(+c.hp || 0, neu);
    return neu > 0 ? {
      hp: neu,
      deathSaves: {
        erfolge: 0,
        fehler: 0
      }
    } : {
      hp: neu
    };
  });
  const tpTemp = n => patchCurrent(c => ({
    tempHp: Math.max(0, n < 0 ? (+c.tempHp || 0) + n : Math.max(+c.tempHp || 0, n))
  }));
  const tpMaxTemp = n => patchCurrent(c => ({
    tempMaxHp: Math.max(0, (+c.tempMaxHp || 0) + n)
  }));
  const tpAnwenden = (modus, n) => {
    if (!n) return;
    if (modus === 'schaden') n > 0 ? tpSchaden(n) : tpHeilen(-n);
    if (modus === 'heilung') n > 0 ? tpHeilen(n) : tpSchaden(-n);
    if (modus === 'temp') tpTemp(n);
    if (modus === 'maxtemp') tpMaxTemp(n);
  };
  const ATTR_NAMEN = {
    str: "Stärke",
    dex: "Geschick",
    con: "Konstitution",
    int: "Intelligenz",
    wis: "Weisheit",
    cha: "Charisma"
  };
  const stickyKatalog = [{
    k: 'ac',
    l: "Rüstungsklasse",
    s: computedAC !== null ? "🛡 RK*" : "🛡 RK",
    i: "🛡",
    t: 'ac',
    v: displayAC,
    feld: computedAC === null ? 'ac' : null
  }, {
    k: 'initiative',
    l: "Initiative",
    s: "⚡ Init.",
    i: "⚡",
    t: 'initiative',
    v: fnum(initTotal)
  }, {
    k: 'speed',
    l: "Bewegung",
    s: "👟 Bew.",
    i: "👟",
    t: 'speed',
    v: effCur.speed + "m",
    feld: 'speed'
  }, {
    k: 'profBonus',
    l: "Übungsbonus",
    s: "📖 ÜB",
    i: "📖",
    t: 'profBonus',
    v: "+" + effCur.profBonus,
    feld: 'profBonus'
  }, {
    k: 'hp',
    l: "Trefferpunkte",
    s: "❤ TP",
    i: "❤",
    t: 'maxHp',
    v: tpOffen ? cur.hp + " / " + effCur.maxHp : tpZustand(cur.hp, effCur.maxHp).label
  }, ...(passivWert !== null ? [{
    k: 'passive',
    l: "Passive Wahrnehmung",
    s: "👁 Pass.",
    i: "👁",
    t: 'passivePerception',
    v: passivWert
  }] : []), ...(spSGL !== null ? [{
    k: 'spellDc',
    l: "Zauber-SG",
    s: "✨ SG",
    i: "✨",
    t: 'spellDc',
    v: spSGL
  }, {
    k: 'spellAttack',
    l: "Zauberangriff",
    s: "✨ ZA",
    i: "✨",
    t: 'spellAttack',
    v: fnum(spAtkL)
  }] : []), ...["str", "dex", "con", "int", "wis", "cha"].map(a => ({
    k: 'attr_' + a,
    l: ATTR_NAMEN[a],
    s: AL[a],
    i: "",
    t: a,
    v: fmod(effCur[a])
  }))];
  // Ohne eigene Auswahl die bisherigen fuenf Werte.
  const STICKY_STANDARD = ['ac', 'initiative', 'speed', 'profBonus', 'spellDc'];
  const stickyWahl = Array.isArray(cur.stickyFields) ? cur.stickyFields : STICKY_STANDARD;
  const stickyGewaehlt = stickyKatalog.filter(b => stickyWahl.includes(b.k));
  const stickyUmschalten = k => {
    const drin = stickyWahl.includes(k);
    // Mindestens ein Wert bleibt stehen, sonst waere die Leiste leer.
    if (drin && stickyWahl.length <= 1) return;
    patchChar({
      stickyFields: drin ? stickyWahl.filter(x => x !== k) : [...stickyWahl, k]
    });
  };

  // Ein fremder Bogen ist zum Ansehen da. Alles, was schreibt —
  // Hinzufuegen, Bearbeiten, Loeschen, die Umschalter der Reiter — wird
  // ueber die Klasse sheet-nur-lesen ausgeblendet. Der Server weist es
  // ohnehin ab; hier steht es, damit niemand etwas anklickt, das nichts
  // tun kann.
  return /*#__PURE__*/React.createElement("div", {
    className: "sheet" + (darfBearbeiten ? "" : " sheet-nur-lesen")
  }, !darfBearbeiten && /*#__PURE__*/React.createElement("div", {
    className: "nur-lesen-band"
  }, "\uD83D\uDD12 Fremder Bogen \u2014 nur zum Ansehen.", /*#__PURE__*/React.createElement("i", null, "\xC4ndern darf ihn sein Konto und die Spielleitung des Abenteuers.")), /*#__PURE__*/React.createElement("div", {
    className: "sheet-header"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, switchList.length < 2 ? /*#__PURE__*/React.createElement("div", {
    className: "char-name"
  }, cur.name) :
  /*#__PURE__*/
  /* Ohne Blaetterpfeile: gewechselt wird ueber das Menue am
     Namen. Sich durch die Gruppe zu klicken, um zu einem
     bestimmten Helden zu kommen, brauchte niemand. */
  React.createElement("div", {
    className: "char-switch" + (charMenuOpen ? " open" : "")
  }, /*#__PURE__*/React.createElement("button", {
    className: "char-name-btn",
    title: "Held w\xE4hlen",
    onClick: () => setCharMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    className: "char-name"
  }, cur.name), /*#__PURE__*/React.createElement("span", {
    className: "char-name-caret"
  }, "\u25BE")), charMenuOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 29
    },
    onClick: () => setCharMenuOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "char-switch-menu"
  }, switchList.map(c => {
    const ccc = klassenStil(c.charClass || 'Kämpfer', klassen);
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      className: "char-switch-item" + (c.id === sel ? " current" : ""),
      onClick: () => {
        selectChar(c.id);
        setCharMenuOpen(false);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "char-switch-item-dot",
      style: {
        background: ccc.bg,
        borderColor: ccc.border
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "char-switch-item-name"
    }, c.name), /*#__PURE__*/React.createElement("span", {
      className: "char-switch-item-sub"
    }, "Lv ", (c.level || 1) + (c.multiclasses || []).reduce((s, m) => s + (m.level || 0), 0)));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "char-meta"
  }, cur.race, " · Stufe ", (cur.level || 1) + (cur.multiclasses || []).reduce((s, m) => s + (m.level || 0), 0), cur.background ? " · " + cur.background : "")), /*#__PURE__*/React.createElement("div", {
    className: "sheet-header-right",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      alignItems: "flex-end",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "class-badges"
  }, /*#__PURE__*/React.createElement("div", {
    className: "class-badge",
    style: {
      backgroundColor: cc.bg,
      borderColor: cc.border,
      color: cc.text
    }
  }, cur.charClass, " ", cur.level), (cur.multiclasses || []).map((mc, i) => {
    const mcc = klassenStil(mc.charClass || 'Kämpfer', klassen);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "class-badge",
      style: {
        backgroundColor: mcc.bg,
        borderColor: mcc.border,
        color: mcc.text
      }
    }, mc.charClass, " ", mc.level);
  })), /*#__PURE__*/React.createElement("div", {
    className: "header-actions"
  }, darfBearbeiten ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    title: "Bearbeiten",
    onClick: openEdit,
    style: {
      padding: "4px 8px",
      background: "none",
      border: "1px solid transparent",
      borderRadius: 3,
      color: "var(--text-muted)",
      fontSize: 14,
      cursor: "pointer",
      opacity: 0.55,
      transition: "opacity 0.15s,border-color 0.15s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = "1";
      e.currentTarget.style.borderColor = "var(--border-bright)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = "0.55";
      e.currentTarget.style.borderColor = "transparent";
    }
  }, "\u270E"), cur.archived ? /*#__PURE__*/React.createElement("button", {
    title: "Reaktivieren",
    onClick: () => unarchiveChar(cur.id),
    style: {
      padding: "4px 10px",
      background: "none",
      border: "1px solid var(--gold-dim)",
      borderRadius: 3,
      color: "var(--gold-dim)",
      fontSize: 12,
      fontFamily: "'Roboto Condensed',sans-serif",
      cursor: "pointer",
      opacity: 0.8,
      letterSpacing: "0.05em"
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = "1";
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = "0.8";
    }
  }, "\u21A9 aktiv") : /*#__PURE__*/React.createElement("button", {
    title: "Archivieren",
    onClick: () => appConfirm("Charakter \"" + cur.name + "\" archivieren?", archiveChar, "Archivieren"),
    style: {
      padding: "4px 8px",
      background: "none",
      border: "1px solid transparent",
      borderRadius: 3,
      color: "var(--text-muted)",
      fontSize: 14,
      cursor: "pointer",
      opacity: 0.45,
      transition: "opacity 0.15s,border-color 0.15s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = "1";
      e.currentTarget.style.borderColor = "var(--border)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = "0.45";
      e.currentTarget.style.borderColor = "transparent";
    }
  }, "\uD83D\uDCE6"), /*#__PURE__*/React.createElement("button", {
    title: "L\xF6schen",
    onClick: deleteChar,
    style: {
      padding: "4px 8px",
      background: "none",
      border: "1px solid transparent",
      borderRadius: 3,
      color: "var(--text-muted)",
      fontSize: 14,
      cursor: "pointer",
      opacity: 0.45,
      transition: "opacity 0.15s,border-color 0.15s,color 0.15s"
    },
    onMouseEnter: e => {
      e.currentTarget.style.opacity = "1";
      e.currentTarget.style.color = "var(--crimson-bright)";
      e.currentTarget.style.borderColor = "var(--crimson)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.opacity = "0.45";
      e.currentTarget.style.color = "var(--text-muted)";
      e.currentTarget.style.borderColor = "transparent";
    }
  }, "\u2715")) : /*#__PURE__*/React.createElement("span", {
    className: "fremder-bogen",
    title: "Dieser Bogen geh\xF6rt jemand anderem \u2014 \xE4ndern darf ihn sein Konto und die Spielleitung"
  }, "\uD83D\uDD12")))), /*#__PURE__*/React.createElement("div", {
    className: "hp-bar-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-bar-label"
  }, /*#__PURE__*/React.createElement("span", null, "\u2764 Trefferpunkte"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, !tpOffen ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: tpZustand(cur.hp, effCur.maxHp).color,
      fontFamily: "'Roboto Condensed',sans-serif"
    },
    title: "In diesem Abenteuer f\xFChrt die Spielleitung die Trefferpunkte"
  }, tpZustand(cur.hp, effCur.maxHp).label, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      marginLeft: 6,
      fontSize: 11
    }
  }, "\uD83D\uDD12")) : statsEdit ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, "Akt."), /*#__PURE__*/React.createElement(ZahlFeld, {
    wert: cur.hp,
    onWert: v => patchChar({
      hp: v
    }),
    style: {
      width: 52,
      padding: "2px 4px",
      background: "var(--bg-card)",
      border: "1px solid var(--crimson-bright)",
      borderRadius: 3,
      color: "var(--crimson-bright)",
      fontSize: 13,
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, "Max"), /*#__PURE__*/React.createElement(ZahlFeld, {
    wert: cur.maxHp,
    onWert: v => patchChar({
      maxHp: v
    }),
    min: 1,
    style: {
      width: 52,
      padding: "2px 4px",
      background: "var(--bg-card)",
      border: "1px solid var(--border-bright)",
      borderRadius: 3,
      color: "var(--parchment)",
      fontSize: 13,
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, "Temp"), /*#__PURE__*/React.createElement(ZahlFeld, {
    wert: cur.tempHp || 0,
    onWert: v => patchChar({
      tempHp: v
    }),
    min: 0,
    leerWert: 0,
    style: {
      width: 52,
      padding: "2px 4px",
      background: "var(--bg-card)",
      border: "1px solid #4a90d9",
      borderRadius: 3,
      color: "#7ab8f5",
      fontSize: 13,
      textAlign: "center"
    }
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, "T.Max"), /*#__PURE__*/React.createElement(ZahlFeld, {
    wert: cur.tempMaxHp || 0,
    onWert: v => patchChar({
      tempMaxHp: v
    }),
    min: 0,
    leerWert: 0,
    style: {
      width: 52,
      padding: "2px 4px",
      background: "var(--bg-card)",
      border: "1px solid #7a4a68",
      borderRadius: 3,
      color: "#d4a6c8",
      fontSize: 13,
      textAlign: "center"
    }
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--crimson-bright)"
    },
    title: fxTitle('maxHp')
  }, cur.hp, " / ", /*#__PURE__*/React.createElement("span", {
    className: fxOn('maxHp') ? "fx-touched" : undefined
  }, effCur.maxHp, fxOn('maxHp') && /*#__PURE__*/React.createElement("span", {
    className: "fx-mark"
  }, "\u2726")), (cur.tempHp || 0) > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#7ab8f5",
      marginLeft: 6
    }
  }, "(+", cur.tempHp, " temp)"), (cur.tempMaxHp || 0) > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#d4a6c8",
      marginLeft: 6
    }
  }, "(+", cur.tempMaxHp, " max)")))), /*#__PURE__*/React.createElement("div", {
    className: "hp-bar-track"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: "100%",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-bar-fill",
    style: {
      width: (tpOffen ? Math.max(0, Math.min(100, cur.hp / (effCur.maxHp || 1) * 100)) : tpZustand(cur.hp, effCur.maxHp).balken * 100) + "%",
      flexShrink: 0,
      ...(tpOffen ? {} : {
        background: tpZustand(cur.hp, effCur.maxHp).color
      })
    }
  }), tpOffen && (cur.tempHp || 0) > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(25, cur.tempHp / (effCur.maxHp || 1) * 100)) + "%",
      background: "linear-gradient(90deg,rgba(74,144,217,0.7),rgba(122,184,245,0.9))",
      flexShrink: 0,
      borderRadius: "0 2px 2px 0",
      marginLeft: 1
    }
  }))), isDmMode && /*#__PURE__*/React.createElement("div", {
    className: "tp-tasten"
  }, /*#__PURE__*/React.createElement("button", {
    className: "kt dmg",
    title: "1 Schaden",
    onClick: () => tpSchaden(1)
  }, "-1"), /*#__PURE__*/React.createElement("button", {
    className: "kt dmg",
    title: "5 Schaden",
    onClick: () => tpSchaden(5)
  }, "-5"), /*#__PURE__*/React.createElement("button", {
    className: "kt dmg breit",
    onClick: () => setTpDlg('schaden')
  }, "Schaden\u2026"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal",
    title: "1 heilen",
    onClick: () => tpHeilen(1)
  }, "+1"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal",
    title: "5 heilen",
    onClick: () => tpHeilen(5)
  }, "+5"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal breit",
    onClick: () => setTpDlg('heilung')
  }, "Heilen\u2026"), /*#__PURE__*/React.createElement("button", {
    className: "kt temp breit",
    onClick: () => setTpDlg('temp')
  }, "+Temp HP"), /*#__PURE__*/React.createElement("button", {
    className: "kt max breit",
    onClick: () => setTpDlg('maxtemp'),
    title: "Tempor\xE4re maximale Trefferpunkte"
  }, "+Temp Max"), /*#__PURE__*/React.createElement("button", {
    className: "kt heal breit",
    title: "Volle Trefferpunkte, tempor\xE4res zur\xFCcksetzen",
    onClick: () => patchCurrent(c => {
      tpMerken(+c.hp || 0, effCur.maxHp);
      return {
        hp: effCur.maxHp - (+c.tempMaxHp || 0),
        tempHp: 0,
        tempMaxHp: 0,
        deathSaves: {
          erfolge: 0,
          fehler: 0
        }
      };
    })
  }, "\u263E Lange Rast")), isDmMode && (cur.hp || 0) <= 0 && /*#__PURE__*/React.createElement(TodesWuerfe, {
    stand: cur.deathSaves,
    onSetzen: d => patchChar({
      deathSaves: d
    })
  }), tpDlg && /*#__PURE__*/React.createElement(WertDialog, {
    modus: tpDlg,
    name: cur.name,
    start: 0,
    onAbbrechen: () => setTpDlg(null),
    onAnwenden: n => {
      setTpDlg(null);
      tpAnwenden(tpDlg, n);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "sticky-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "combat-row"
  }, statsEdit ? (
  /* Im Bearbeiten-Modus bekommen die gewaehlten Werte ein
     Eingabefeld, sofern sie eines haben — abgeleitete Werte wie
     Initiative oder Zauber-SG bleiben Anzeige. */
  stickyGewaehlt.map(b => /*#__PURE__*/React.createElement("div", {
    className: "combat-box",
    key: b.k
  }, /*#__PURE__*/React.createElement("div", {
    className: "combat-label"
  }, b.i, " ", b.l), /*#__PURE__*/React.createElement("div", {
    className: "combat-label-short"
  }, b.s), b.feld ? /*#__PURE__*/React.createElement(ZahlFeld, {
    wert: cur[b.feld],
    "aria-label": b.l,
    onWert: v => patchChar({
      [b.feld]: v
    }),
    style: {
      width: 56,
      padding: "3px 4px",
      background: "var(--bg-card)",
      border: "1px solid var(--border-bright)",
      borderRadius: 3,
      color: "var(--gold)",
      fontSize: 18,
      textAlign: "center",
      display: "block",
      margin: "4px auto 0",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "combat-value",
    style: {
      fontSize: 14,
      color: "var(--text-muted)"
    }
  }, b.v)))) : stickyGewaehlt.map(b => {
    const touched = fxOn(b.t) || b.t === 'initiative' && fxOn('dex') || b.t === 'ac' && fxOn('dex');
    return /*#__PURE__*/React.createElement("div", {
      className: "combat-box",
      key: b.k,
      title: fxTitle(b.t)
    }, /*#__PURE__*/React.createElement("div", {
      className: "combat-label"
    }, b.i, " ", b.l), /*#__PURE__*/React.createElement("div", {
      className: "combat-label-short"
    }, b.s), /*#__PURE__*/React.createElement("div", {
      className: "combat-value" + (touched ? " fx-touched" : "")
    }, b.v, fxOn(b.t) && /*#__PURE__*/React.createElement("span", {
      className: "fx-mark"
    }, "\u2726")));
  }), /*#__PURE__*/React.createElement("div", {
    className: "leiste-werkzeug"
  }, /*#__PURE__*/React.createElement("button", {
    className: "leiste-zahnrad" + (werkzeugOffen || statsEdit ? " aktiv" : ""),
    onClick: () => setWerkzeugOffen(o => !o),
    title: "Leiste einstellen",
    "aria-expanded": werkzeugOffen,
    "aria-label": "Leiste einstellen"
  }, "\u2699"), werkzeugOffen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 29
    },
    onClick: () => setWerkzeugOffen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "leiste-werkzeug-menu"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setLeisteWahlOffen(true);
      setWerkzeugOffen(false);
    }
  }, "\u2699 Werte ausw\xE4hlen"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setStatsEdit(!statsEdit);
      setWerkzeugOffen(false);
    }
  }, statsEdit ? "✓ Bearbeiten beenden" : "✏️ Werte bearbeiten"))))), (() => {
    const activeSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => slots[l] && slots[l].max > 0);
    const isZauberer = cur.charClass === "Zauberer" || (cur.multiclasses || []).some(m => m.charClass === "Zauberer");
    // Inspiration erscheint hier nur, wenn man welche hat — als
    // Erinnerung genau dann, wenn sie zaehlt. Bei 0 waere es Ballast.
    const hasContent = activeSlots.length > 0 || isZauberer && sp.max > 0 || resources.length > 0 || insp > 0;
    if (!hasContent) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "res-mini-bar"
    }, insp > 0 && /*#__PURE__*/React.createElement("div", {
      className: "res-mini-group",
      title: "Inspiration: " + insp + "/" + inspMax
    }, /*#__PURE__*/React.createElement("span", {
      className: "res-mini-label",
      style: {
        color: "var(--inspiration)"
      }
    }, "INSP"), Array.from({
      length: inspMax
    }).map((_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "res-mini-pip" + (i < insp ? " on" : ""),
      style: i < insp ? {
        background: "var(--inspiration)",
        borderColor: "var(--inspiration)"
      } : {
        borderColor: "var(--inspiration)"
      }
    }))), activeSlots.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "res-mini-group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "res-mini-label"
    }, "ZPL"), activeSlots.map(l => {
      const s = slots[l];
      const avail = s.max - s.used;
      return /*#__PURE__*/React.createElement("span", {
        key: l,
        className: "res-mini-slot-group",
        title: "Grad " + l + ": " + avail + "/" + s.max
      }, /*#__PURE__*/React.createElement("span", {
        className: "res-mini-slot-grade"
      }, l), Array.from({
        length: s.max
      }).map((_, i) => /*#__PURE__*/React.createElement("span", {
        key: i,
        className: "res-mini-pip" + (i < avail ? " on" : "")
      })));
    })), isZauberer && sp.max > 0 && /*#__PURE__*/React.createElement("div", {
      className: "res-mini-group",
      title: "Zaubereipunkte: " + (sp.max - sp.used) + "/" + sp.max
    }, /*#__PURE__*/React.createElement("span", {
      className: "res-mini-label",
      style: {
        color: "var(--arcane-bright)"
      }
    }, "ZPU"), Array.from({
      length: sp.max
    }).map((_, i) => {
      const avail = sp.max - sp.used;
      return /*#__PURE__*/React.createElement("span", {
        key: i,
        className: "res-mini-pip" + (i < avail ? " on" : ""),
        style: i < avail ? {
          background: "var(--arcane-bright)",
          borderColor: "var(--arcane-bright)"
        } : {
          borderColor: "var(--arcane-bright)"
        }
      });
    })), resources.map((res, ri) => {
      const avail = res.max - res.used;
      return /*#__PURE__*/React.createElement(React.Fragment, {
        key: res.id
      }, /*#__PURE__*/React.createElement("div", {
        className: "res-mini-group",
        title: res.name + ": " + avail + "/" + res.max
      }, /*#__PURE__*/React.createElement("span", {
        className: "res-mini-label",
        style: {
          color: res.color || "var(--gold)"
        }
      }, res.abbr || res.name), Array.from({
        length: res.max
      }).map((_, i) => /*#__PURE__*/React.createElement("span", {
        key: i,
        className: "res-mini-pip" + (i < avail ? " on" : ""),
        style: i < avail ? {
          background: res.color || "var(--gold-dim)",
          borderColor: res.color || "var(--gold)"
        } : {
          borderColor: res.color || "var(--gold)"
        }
      }))));
    }));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, [["stats", "🎯 Attribute"], ["aktionen", "⚔️ Aktionen"], ["zauber", "✨ Zauber"], ["merkmale", "⭐ Merkmale"], ["inventar", "🎒 Inventar"], ["notizen", "📜 Notizen"], ["log", "📋 Log"]].map(([k, l]) => /*#__PURE__*/React.createElement("div", _extends({
    key: k,
    className: "tab" + (tab === k ? " active" : ""),
    "aria-current": tab === k ? "page" : undefined
  }, clickable(() => {
    setTab(k);
    if (k !== "inventar") {
      setTransferMode(false);
      setTransferSel(new Set());
    }
  }, l)), l))), tab === "stats" && /*#__PURE__*/React.createElement(React.Fragment, null, itemFx.length > 0 && (() => {
    const bySource = [];
    itemFx.forEach(e => {
      let g = bySource.find(x => x.source === e.source && x.icon === e.icon);
      if (!g) {
        g = {
          source: e.source,
          icon: e.icon,
          list: []
        };
        bySource.push(g);
      }
      g.list.push(e);
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "fx-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "fx-panel-title"
    }, "\u2726 Aktive Effekte"), bySource.map((g, i) => /*#__PURE__*/React.createElement("div", {
      className: "fx-src",
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      className: "fx-src-name"
    }, g.icon, " ", g.source), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4
      }
    }, g.list.map(e => /*#__PURE__*/React.createElement("span", {
      key: e.id,
      className: "fx-chip" + (isFlagEffect(e.target) ? " fx-chip-flag" : "")
    }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))))), (() => {
      const schalter = activeFlags(itemFx);
      if (!schalter.length) return null;
      return /*#__PURE__*/React.createElement("div", {
        className: "fx-flags"
      }, /*#__PURE__*/React.createElement("div", {
        className: "fx-flags-title"
      }, "Gilt gerade"), /*#__PURE__*/React.createElement("div", {
        className: "fx-flags-list"
      }, schalter.map(f => /*#__PURE__*/React.createElement("span", {
        key: f.target,
        className: "fx-chip fx-chip-flag",
        title: 'aus: ' + f.quellen.join(', ')
      }, f.label))));
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginTop: 8,
        lineHeight: 1.5
      }
    }, "Betroffene Werte sind mit \u2726 markiert. Zum Abschalten die Waffe ablegen, die R\xFCstung ausziehen oder den Gegenstand im Inventar ausschalten."));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "stats-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "\uD83C\uDFAF Attribute & Fertigkeiten"), statsEdit && /*#__PURE__*/React.createElement("span", {
    className: "stats-edit-marke"
  }, "Bearbeiten")), /*#__PURE__*/React.createElement("div", {
    className: "sheet-columns"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet-col-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "attr-column"
  }, [["str", "Stärke"], ["dex", "Geschicklichkeit"], ["con", "Konstitution"], ["int", "Intelligenz"], ["wis", "Weisheit"], ["cha", "Charisma"]].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    className: "attr-box",
    key: k,
    title: fxTitle(k)
  }, /*#__PURE__*/React.createElement("div", {
    className: "attr-label"
  }, l), /*#__PURE__*/React.createElement("div", {
    className: "attr-mod" + (fxOn(k) ? " fx-touched" : "")
  }, fmod(effCur[k])), statsEdit ?
  /*#__PURE__*/
  /* Bearbeitet wird der eigene Wert, nicht der von
     Gegenstaenden veraenderte. */
  React.createElement(ZahlFeld, {
    className: "attr-input",
    min: 1,
    max: 30,
    wert: cur[k],
    "aria-label": l,
    onWert: v => patchChar({
      [k]: v
    })
  }) : /*#__PURE__*/React.createElement("div", {
    className: "attr-score" + (fxOn(k) ? " fx-touched" : "")
  }, effCur[k], fxOn(k) && /*#__PURE__*/React.createElement("span", {
    className: "fx-mark"
  }, "\u2726")), fxOn(k) && !statsEdit && cur[k] !== effCur[k] && /*#__PURE__*/React.createElement("div", {
    className: "attr-own"
  }, "eigen ", cur[k])))), /*#__PURE__*/React.createElement("div", {
    className: "save-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "block-title"
  }, "\uD83C\uDFB2 Rettungsw\xFCrfe"), /*#__PURE__*/React.createElement("div", {
    className: "saves-grid"
  }, [["str", "STR"], ["dex", "GES"], ["con", "KON"], ["int", "INT"], ["wis", "WEI"], ["cha", "CHA"]].map(([attr, label]) => {
    const isP = (cur.savingThrowProfs || []).includes(attr);
    const base = mod(effCur[attr]) + (isP ? effCur.profBonus : 0);
    const val = fx('save_' + attr, fx('saveAll', base));
    const touched = fxOn('save_' + attr) || fxOn('saveAll') || fxOn(attr) || fxOn('profBonus');
    const tip = [fxTitle(attr), fxTitle('profBonus'), fxTitle('saveAll'), fxTitle('save_' + attr)].filter(Boolean).join('\n');
    return /*#__PURE__*/React.createElement("div", _extends({
      key: attr,
      className: "save-box" + (isP ? " prof" : "") + (statsEdit ? " schaltbar" : ""),
      title: tip || undefined
    }, statsEdit ? clickable(() => toggleSave(attr), "Rettungswurf " + label + (isP ? " — Übung aktiv" : "")) : {}), /*#__PURE__*/React.createElement("div", {
      className: "save-pip"
    }), /*#__PURE__*/React.createElement("div", {
      className: "save-label"
    }, label), /*#__PURE__*/React.createElement("div", {
      className: "save-value" + (touched ? " fx-touched" : ""),
      style: {
        color: isP ? "var(--gold)" : "var(--text-muted)"
      }
    }, fnum(val)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "block-hint"
  }, statsEdit ? "Klick schaltet die Übung um" : "zum Ändern unten auf Bearbeiten")), (() => {
    const sk = SKILLS.find(x => x.key === 'aufmerksamkeit');
    if (!sk) return null;
    const isP = (cur.skillProfs || []).includes(sk.key);
    const isE = (cur.expertiseProfs || []).includes(sk.key);
    const joat = cur.jackOfAllTrades && !isP && !isE;
    const bonus = isE ? effCur.profBonus * 2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus / 2) : 0;
    const tot = fx('skill_' + sk.key, fx('skillAll', mod(effCur[sk.attr]) + bonus));
    return /*#__PURE__*/React.createElement("div", {
      className: "passive-box",
      title: "Passive Wahrnehmung \u2014 10 + Wahrnehmung"
    }, /*#__PURE__*/React.createElement("div", {
      className: "passive-label"
    }, "Passive Wahrnehmung"), /*#__PURE__*/React.createElement("div", {
      className: "passive-value"
    }, fx('passivePerception', 10 + tot)));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "sheet-col-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "skill-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "block-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "block-title"
  }, "\u2726 Fertigkeiten"), /*#__PURE__*/React.createElement("button", {
    className: "joat-toggle",
    disabled: !statsEdit,
    title: statsEdit ? undefined : "Zum Ändern unten auf Bearbeiten",
    onClick: () => {
      if (statsEdit) toggleJoAT();
    },
    style: {
      borderRadius: 3,
      cursor: "pointer",
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: cur.jackOfAllTrades ? "var(--gold-dim)" : "var(--bg-card)",
      border: `1px solid ${cur.jackOfAllTrades ? "var(--gold)" : "var(--border)"}`,
      color: cur.jackOfAllTrades ? "var(--gold-bright)" : "var(--text-muted)"
    }
  }, cur.jackOfAllTrades ? "✦ Allrounder aktiv" : "◇ Allrounder")), [...SKILLS].sort((a, b) => a.label.localeCompare(b.label, 'de')).map(sk => {
    const attr = sk.attr;
    const isP = (cur.skillProfs || []).includes(sk.key);
    const isE = (cur.expertiseProfs || []).includes(sk.key);
    const joat = cur.jackOfAllTrades && !isP && !isE;
    const bonus = isE ? effCur.profBonus * 2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus / 2) : 0;
    const tot = fx('skill_' + sk.key, fx('skillAll', mod(effCur[attr]) + bonus));
    const skTouched = fxOn('skill_' + sk.key) || fxOn('skillAll') || fxOn(attr) || fxOn('profBonus');
    const skTip = [fxTitle(attr), fxTitle('profBonus'), fxTitle('skillAll'), fxTitle('skill_' + sk.key)].filter(Boolean).join('\n');
    // Vorteil und Nachteil tragen keine Zahl, sie stehen als
    // Marke neben dem Wurf. Beides zugleich hebt sich nach
    // Regelwerk auf — das sagt die Marke dann auch.
    const vt = fxOn('adv_skill_' + sk.key) || fxOn('adv_skillAll') || sk.key === 'heimlichkeit' && fxOn('adv_stealth');
    const nt = fxOn('dis_skill_' + sk.key) || fxOn('dis_skillAll') || sk.key === 'heimlichkeit' && fxOn('dis_stealth');
    const pip = isE ? "⬤⬤" : isP ? "⬤" : joat ? "◑" : "○";
    const col = isE ? "var(--arcane-bright)" : isP ? "var(--gold)" : joat ? "var(--gold-dim)" : "var(--border-bright)";
    return /*#__PURE__*/React.createElement("div", {
      className: "skill-row",
      key: sk.key,
      title: skTip || undefined
    }, /*#__PURE__*/React.createElement("button", {
      className: "skill-prof-btn" + (isE ? " expertise" : ""),
      disabled: !statsEdit,
      onClick: () => {
        if (statsEdit) toggleSkill(sk.key);
      },
      style: {
        background: isE ? "var(--arcane)" : isP ? "var(--gold-dim)" : "var(--bg-void)",
        borderColor: col,
        color: col
      },
      title: !statsEdit ? "Zum Ändern unten auf Bearbeiten" : isE ? "Expertise (Klick: entfernen)" : isP ? "Übung (Klick: Expertise)" : "Kein Bonus (Klick: Übung hinzufügen)"
    }, pip), /*#__PURE__*/React.createElement("div", {
      className: "skill-name"
    }, sk.label), /*#__PURE__*/React.createElement("div", {
      className: "skill-attr-tag",
      style: {
        color: AC[attr],
        borderColor: AC[attr] + "55"
      }
    }, AL[attr]), /*#__PURE__*/React.createElement("div", {
      className: "skill-value" + (skTouched ? " fx-touched" : ""),
      style: {
        color: isE ? "var(--arcane-bright)" : isP ? "var(--gold)" : joat ? "var(--gold-dim)" : "var(--text-muted)"
      }
    }, fnum(tot), vt && nt && /*#__PURE__*/React.createElement("span", {
      className: "skill-vt neutral",
      title: "Vorteil und Nachteil heben sich auf"
    }, "\u21C5"), vt && !nt && /*#__PURE__*/React.createElement("span", {
      className: "skill-vt gut",
      title: "Vorteil"
    }, "\u25B2"), nt && !vt && /*#__PURE__*/React.createElement("span", {
      className: "skill-vt schlecht",
      title: "Nachteil"
    }, "\u25BC"), isE && /*#__PURE__*/React.createElement("span", {
      className: "skill-flag"
    }, "EX"), joat && /*#__PURE__*/React.createElement("span", {
      className: "skill-flag"
    }, "JoAT")));
  }), /*#__PURE__*/React.createElement("div", {
    className: "block-hint"
  }, "\u2B24 \xDCbung \xB7 \u2B24\u2B24 Expertise", statsEdit ? " · Klick zum Wechseln" : " · zum Ändern unten auf Bearbeiten")))), /*#__PURE__*/React.createElement("div", {
    className: "stats-fuss"
  }, /*#__PURE__*/React.createElement("button", {
    className: "panel-edit-btn gross" + (statsEdit ? " active" : ""),
    onClick: () => setStatsEdit(!statsEdit)
  }, statsEdit ? "✓ Fertig" : "✏️ Attribute & Übungen bearbeiten")))), tab === "inventar" && /*#__PURE__*/React.createElement(AusruestungsPuppe, null), tab === "aktionen" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "slots-panel",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "slots-panel-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slots-title"
  }, "\u25C7 Ressourcen & Sonderpunkte"), /*#__PURE__*/React.createElement("button", {
    className: "panel-edit-btn" + (resEdit ? " active" : ""),
    onClick: () => setResEdit(!resEdit)
  }, resEdit ? "✓ Fertig" : "✏️ Bearbeiten")), /*#__PURE__*/React.createElement("div", {
    className: "resource-list" + (resEdit ? " bearbeiten" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "resource-item insp-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "resource-name",
    style: {
      color: "var(--inspiration)"
    }
  }, "\u2726 Inspiration"), /*#__PURE__*/React.createElement("div", {
    className: "resource-pips"
  }, Array.from({
    length: inspMax
  }).map((_, i) => /*#__PURE__*/React.createElement("div", _extends({
    key: i,
    className: "resource-pip",
    title: i < insp ? "Inspiration einsetzen" : "Inspiration erhalten",
    style: {
      backgroundColor: i < insp ? "var(--inspiration)" : "var(--bg-void)",
      borderColor: "var(--inspiration)",
      opacity: i < insp ? 1 : 0.25,
      boxShadow: i < insp ? "0 0 6px rgba(232,184,75,0.45)" : "none"
    }
  }, clickable(() => setInsp(i < insp ? i : i + 1), "Inspiration " + (i + 1) + " von " + inspMax + (i < insp ? " — einsetzen" : " — erhalten"))))), resEdit && inspMax < 10 && /*#__PURE__*/React.createElement("button", {
    className: "slot-max-btn",
    onClick: () => setInspMax(inspMax + 1)
  }, "+"), resEdit && inspMax > 1 && /*#__PURE__*/React.createElement("button", {
    className: "slot-max-btn",
    onClick: () => setInspMax(inspMax - 1)
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    className: "resource-count",
    style: {
      color: "var(--inspiration)"
    }
  }, insp, /*#__PURE__*/React.createElement("small", null, "/", inspMax))), /*#__PURE__*/React.createElement("div", {
    className: "resource-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "resource-rest"
  }, "Vorteil auf einen Wurf"))), resources.map(res => /*#__PURE__*/React.createElement("div", {
    className: "resource-item",
    key: res.id
  }, resEdit ? /*#__PURE__*/React.createElement("div", {
    className: "resource-header"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      padding: "3px 6px",
      fontSize: 13,
      fontFamily: "'Roboto Condensed',sans-serif",
      flex: 1,
      background: "transparent",
      border: "none",
      borderBottom: "1px solid var(--border)",
      borderRadius: 0,
      color: "var(--text-primary)"
    },
    key: `res_name_${res.id}_${res.name}`,
    defaultValue: res.name,
    onBlur: e => updResource(res.id, {
      name: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      padding: "3px 6px",
      fontSize: 11,
      fontFamily: "'Roboto Condensed',sans-serif",
      width: 52,
      background: "transparent",
      border: "none",
      borderBottom: "1px solid var(--border)",
      borderRadius: 0,
      color: "var(--text-muted)"
    },
    key: `res_abbr_${res.id}_${res.abbr}`,
    defaultValue: res.abbr || "",
    placeholder: "K\xFCrzel",
    onBlur: e => updResource(res.id, {
      abbr: e.target.value
    }),
    title: "Abk\xFCrzung f\xFCr die Ressourcen-Leiste"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    defaultValue: res.color || "#c9a84c",
    onBlur: e => updResource(res.id, {
      color: e.target.value
    }),
    onChange: e => e.target.parentElement.querySelector('.color-preview') && (e.target.parentElement.querySelector('.color-preview').style.background = e.target.value),
    style: {
      width: 22,
      height: 22,
      padding: 0,
      border: "none",
      borderRadius: 3,
      cursor: "pointer",
      background: "none"
    },
    title: "Farbe w\xE4hlen"
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    style: {
      padding: "2px 4px",
      fontSize: 11,
      width: "auto"
    },
    value: res.restType || "lang",
    onChange: e => updResource(res.id, {
      restType: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "lang"
  }, "Lange Rast"), /*#__PURE__*/React.createElement("option", {
    value: "kurz"
  }, "Kurze Rast"), /*#__PURE__*/React.createElement("option", {
    value: "tag"
  }, "T\xE4glich")), /*#__PURE__*/React.createElement("button", {
    className: "resource-del",
    onClick: () => delResource(res.id)
  }, "\u2715"))) :
  /*#__PURE__*/
  /* Die Rastart steht in der Fusszeile, damit der Name die
     ganze Kachelbreite hat. */
  React.createElement("div", {
    className: "resource-name",
    style: {
      color: res.color || "#c9a84c"
    }
  }, res.name || "Ressource"), /*#__PURE__*/React.createElement("div", {
    className: "resource-pips"
  }, Array.from({
    length: res.max
  }).map((_, i) => {
    const avail = res.max - res.used;
    return /*#__PURE__*/React.createElement("div", _extends({
      key: i,
      className: "resource-pip",
      style: {
        backgroundColor: i < avail ? res.color || "#c9a84c" : "var(--bg-void)",
        borderColor: res.color || "#c9a84c",
        opacity: i < avail ? 1 : 0.25,
        boxShadow: i < avail ? `0 0 5px ${res.color || "#c9a84c"}60` : "none"
      }
    }, clickable(() => togResourcePip(res.id, i), (res.name || "Ressource") + " " + (i + 1) + " von " + res.max)));
  }), resEdit && /*#__PURE__*/React.createElement("button", {
    className: "slot-max-btn",
    onClick: () => updResource(res.id, {
      max: Math.min(30, res.max + 1)
    })
  }, "+"), resEdit && res.max > 0 && /*#__PURE__*/React.createElement("button", {
    className: "slot-max-btn",
    onClick: () => updResource(res.id, {
      max: Math.max(0, res.max - 1),
      used: Math.min(res.used, res.max - 1)
    })
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    className: "resource-count",
    style: {
      color: res.color || "#c9a84c"
    }
  }, res.max - res.used, /*#__PURE__*/React.createElement("small", null, "/", res.max))), /*#__PURE__*/React.createElement("div", {
    className: "resource-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "resource-rest"
  }, res.restType === "kurz" ? "Kurze Rast" : res.restType === "tag" ? "Täglich" : "Lange Rast"), res.used > 0 && /*#__PURE__*/React.createElement("button", {
    className: "resource-restore-btn",
    title: "Zurücksetzen (" + (res.restType === "kurz" ? "Kurze Rast" : res.restType === "tag" ? "Täglich" : "Lange Rast") + ")",
    onClick: () => updResource(res.id, {
      used: 0
    })
  }, "\u21BA"))))), resources.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: 13,
      fontStyle: "italic",
      margin: "10px 0 4px"
    }
  }, "Sonst noch keine Ressourcen.", !resEdit && ' Klicke "Bearbeiten" zum Hinzufügen.'), resEdit && /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    onClick: addResource
  }, "+ Ressource hinzuf\xFCgen")), /*#__PURE__*/React.createElement("div", {
    className: "section-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 12
    }
  }, "\uD83D\uDDE1 Waffen"), (cur.weapons || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontStyle: "italic",
      fontSize: 14,
      marginBottom: 12
    }
  }, "Keine Waffen angelegt. Klicke unten um eine hinzuzuf\xFCgen.") : /*#__PURE__*/React.createElement("div", {
    className: "weapon-grid"
  }, [...cur.weapons].sort((a, b) => {
    if (!!a.equipped !== !!b.equipped) return a.equipped ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "", "de");
  }).map(w => {
    const {
      bonus,
      dmgStr
    } = weaponStats(w);
    const isEquipped = !!w.equipped;
    const meta = [w.range || null, w.damageType || null].filter(Boolean).join(" · ");
    return /*#__PURE__*/React.createElement("div", _extends({
      key: w.id,
      className: "weapon-card" + (isEquipped ? " equipped" : "")
    }, clickable(() => setWeaponViewer(w.id), (w.name || "Waffe") + " — Details")), /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-img"
    }, w.imageData ? /*#__PURE__*/React.createElement("img", {
      src: w.imageData,
      alt: w.name || "Waffe"
    }) : /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-glyph"
    }, "\u2694"), /*#__PURE__*/React.createElement("button", {
      className: "weapon-equip-btn",
      title: isEquipped ? "Ablegen" : "Anlegen",
      onClick: e => {
        e.stopPropagation();
        toggleEquipped(w.id);
      }
    }, "\u2694")), /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-info"
    }, /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-name"
    }, w.name || "—"), meta && /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-meta"
    }, meta), /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stats"
    }, /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stat"
    }, /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stat-label"
    }, "Angriff"), /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stat-value atk"
    }, bonus >= 0 ? "+" + bonus : bonus)), /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stat"
    }, /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stat-label"
    }, "Schaden"), /*#__PURE__*/React.createElement("div", {
      className: "weapon-card-stat-value"
    }, dmgStr)))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      flex: 1
    },
    onClick: () => {
      setWf(newWeapon());
      setWfEditId(null);
      setShowWF(true);
    }
  }, "+ Waffe hinzuf\xFCgen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      flex: 1,
      borderColor: "var(--gold)",
      color: "var(--gold)"
    },
    onClick: () => openTpl('weapon')
  }, "\uD83D\uDCD6 Von Vorlage (SRD)"))), tab === "merkmale" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 12
    }
  }, "\u2B50 Klassenf\xE4higkeiten & Merkmale"), (cur.features || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontStyle: "italic",
      fontSize: 13,
      marginBottom: 12
    }
  }, "Keine F\xE4higkeiten eingetragen.") : /*#__PURE__*/React.createElement("div", {
    className: "features-grid"
  }, [...(cur.features || [])].sort((a, b) => (a.source || '').localeCompare(b.source || '', 'de') || a.name.localeCompare(b.name, 'de')).map(feat => /*#__PURE__*/React.createElement("div", _extends({
    key: feat.id,
    className: "feature-card" + (exFeature === feat.id ? " expanded" : ""),
    "aria-expanded": exFeature === feat.id
  }, clickable(() => setExFeature(exFeature === feat.id ? null : feat.id), feat.name)), /*#__PURE__*/React.createElement("div", {
    className: "feature-card-banner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "feature-card-orb"
  }, "\u2B50"), /*#__PURE__*/React.createElement("div", {
    className: "feature-card-name"
  }, feat.name), /*#__PURE__*/React.createElement("div", {
    className: "feature-actions",
    onClick: e => e.stopPropagation()
  }, istChronikMerkmal(feat) ? /*#__PURE__*/React.createElement("span", {
    className: "feature-gesperrt",
    title: "Kommt aus der Chronik der Spielleitung"
  }, "\uD83D\uDD70") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "spell-edit-btn",
    onClick: e => {
      e.stopPropagation();
      setFf({
        effects: [],
        effectsActive: true,
        ...feat
      });
      setFfEditId(feat.id);
      setShowFF(true);
    }
  }, "\u270E"), /*#__PURE__*/React.createElement("button", {
    className: "spell-delete",
    onClick: e => {
      e.stopPropagation();
      delFeature(feat.id);
    }
  }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
    className: "feature-card-body"
  }, feat.source && /*#__PURE__*/React.createElement("div", {
    className: "feature-source"
  }, feat.source), (feat.effects || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "feature-fx",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "feature-fx-chips" + (feat.effectsActive === false ? " ruht" : "")
  }, (feat.effects || []).map(e => /*#__PURE__*/React.createElement("span", {
    key: e.id,
    className: "fx-chip"
  }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))), /*#__PURE__*/React.createElement("button", {
    className: "feature-fx-tog",
    disabled: istChronikMerkmal(feat),
    onClick: () => {
      if (!istChronikMerkmal(feat)) toggleFeatureFx(feat.id);
    },
    "aria-pressed": feat.effectsActive !== false,
    title: istChronikMerkmal(feat) ? 'Läuft mit der Chronik ab' : feat.effectsActive === false ? 'Einschalten' : 'Ausschalten'
  }, feat.effectsActive === false ? '◇ Ruht' : '✦ Wirkt'))), feat.description && /*#__PURE__*/React.createElement("div", {
    className: "feature-card-desc-wrap"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "feature-card-desc"
  }, feat.description)))))), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    onClick: () => {
      setFf({
        name: '',
        source: '',
        description: '',
        effects: [],
        effectsActive: true
      });
      setFfEditId(null);
      setShowFF(true);
    }
  }, "+ F\xE4higkeit hinzuf\xFCgen")), /*#__PURE__*/React.createElement("div", {
    className: "profs-grid"
  }, [{
    title: '🗣 Sprachen',
    items: languages,
    add: addLanguage,
    del: delLanguage,
    placeholder: 'z.B. Gemeinsprache, Elfisch'
  }, {
    title: '🔧 Werkzeugsfähigkeiten',
    items: toolProfs,
    add: addToolProf,
    del: delToolProf,
    placeholder: 'z.B. Diebeswerkzeug'
  }, {
    title: '⚔️ Waffenfähigkeiten',
    items: weaponProfs,
    add: addWeaponProf,
    del: delWeaponProf,
    placeholder: 'z.B. Einfache Waffen, Kriegswaffen'
  }, {
    title: '🛡️ Rüstungsfertigkeiten',
    items: armorProfs,
    add: addArmorProf,
    del: delArmorProf,
    placeholder: 'z.B. Leichte Rüstung, Schilde'
  }].map(({
    title,
    items,
    add,
    del,
    placeholder
  }) => /*#__PURE__*/React.createElement("div", {
    key: title,
    className: "stats-section",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      overflow: 'hidden'
    }
  }, items.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px',
      fontSize: 13,
      color: 'var(--text-muted)',
      fontStyle: 'italic'
    }
  }, "Keine Eintr\xE4ge."), items.map((item, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '6px 10px',
      borderBottom: '1px solid var(--border)',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontFamily: "'Roboto',sans-serif",
      fontSize: 14,
      color: 'var(--text-secondary)'
    }
  }, item), /*#__PURE__*/React.createElement("button", {
    className: "chip-remove",
    onClick: () => del(i),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: 13,
      lineHeight: 1
    }
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: '6px 10px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      flex: 1,
      padding: '4px 8px',
      fontSize: 13,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid var(--border)',
      borderRadius: 0,
      color: 'var(--text-primary)'
    },
    placeholder: placeholder,
    onKeyDown: e => {
      if (e.key === 'Enter') {
        add(e.target.value);
        e.target.value = '';
      }
    },
    onBlur: e => {
      if (e.target.value.trim()) {
        add(e.target.value);
        e.target.value = '';
      }
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      alignSelf: 'center',
      whiteSpace: 'nowrap'
    }
  }, "\u21B5 Enter"))))))), tab === "zauber" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "slots-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slots-panel-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slots-title"
  }, "\u25C8 Zauberpl\xE4tze"), /*#__PURE__*/React.createElement("button", {
    className: "panel-edit-btn" + (slotsEdit ? " active" : ""),
    onClick: () => setSlotsEdit(!slotsEdit)
  }, slotsEdit ? "✓ Fertig" : "✏️ Bearbeiten")), [1, 2, 3, 4, 5, 6, 7, 8, 9].every(l => !slots[l] || slots[l].max === 0) && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: 13,
      fontStyle: "italic",
      marginBottom: 8
    }
  }, "Noch keine Slots.", !slotsEdit && ' Klicke "Bearbeiten" zum Hinzufügen.'), /*#__PURE__*/React.createElement("div", {
    className: "slots-grid"
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => {
    const s = slots[l] || {
      max: 0,
      used: 0
    };
    if (!slotsEdit && s.max === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "slot-row",
      key: l
    }, /*#__PURE__*/React.createElement("div", {
      className: "slot-row-label"
    }, "Grad ", l), /*#__PURE__*/React.createElement("div", {
      className: "slot-pips"
    }, Array.from({
      length: s.max
    }).map((_, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "slot-pip " + (i < s.max - s.used ? "available" : "used"),
      onClick: () => togSlot(l, i)
    })), slotsEdit && /*#__PURE__*/React.createElement("button", {
      className: "slot-max-btn",
      onClick: () => chgMax(l, 1)
    }, "+"), slotsEdit && s.max > 0 && /*#__PURE__*/React.createElement("button", {
      className: "slot-max-btn",
      onClick: () => chgMax(l, -1)
    }, "\u2212"), !slotsEdit && s.max === 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-muted)",
        fontSize: 11
      }
    }, "\u2014")));
  })), [1, 2, 3, 4, 5, 6, 7, 8, 9].some(l => slots[l] && slots[l].max > 0) && /*#__PURE__*/React.createElement("button", {
    className: "slot-restore-btn",
    onClick: resetAll
  }, "\u21BA Alle Slots wiederherstellen (lange Rast)")), (() => {
    const isZauberer = cur.charClass === "Zauberer" || (cur.multiclasses || []).some(m => m.charClass === "Zauberer");
    if (!isZauberer) return null;
    return sp.max > 0 ? /*#__PURE__*/React.createElement("div", {
      className: "sorcery-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "slots-panel-header",
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sorcery-title",
      style: {
        margin: 0
      }
    }, "\u2726 Zaubereipunkte"), /*#__PURE__*/React.createElement("button", {
      className: "panel-edit-btn" + (spEdit ? " active" : ""),
      onClick: () => setSpEdit(!spEdit),
      style: {
        borderColor: "var(--arcane-bright)",
        color: spEdit ? "var(--arcane-bright)" : "var(--text-muted)",
        opacity: spEdit ? 1 : 0.6
      }
    }, spEdit ? "✓ Fertig" : "✏️ Bearbeiten")), /*#__PURE__*/React.createElement("div", {
      className: "sorcery-pips"
    }, Array.from({
      length: sp.max
    }).map((_, i) => {
      const avail = sp.max - sp.used;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "sorcery-pip " + (i < avail ? "available" : "spent"),
        onClick: () => togSP(i),
        title: i < avail ? "Punkt ausgeben" : "Punkt zurück"
      });
    }), spEdit && /*#__PURE__*/React.createElement("button", {
      className: "slot-max-btn",
      onClick: () => spChgMax(1),
      title: "Max erh\xF6hen"
    }, "+"), spEdit && sp.max > 0 && /*#__PURE__*/React.createElement("button", {
      className: "slot-max-btn",
      onClick: () => spChgMax(-1),
      title: "Max verringern"
    }, "\u2212")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 18,
        color: "var(--arcane-bright)"
      }
    }, sp.max - sp.used, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-muted)"
      }
    }, "/ ", sp.max)), sp.used > 0 && /*#__PURE__*/React.createElement("button", {
      className: "slot-restore-btn",
      style: {
        borderColor: "var(--arcane-bright)",
        color: "var(--arcane-bright)"
      },
      onClick: () => updSP({
        ...sp,
        used: 0
      })
    }, "\u21BA Wiederherstellen (Lange Rast)"))) : /*#__PURE__*/React.createElement("button", {
      className: "btn-add",
      style: {
        marginBottom: 16
      },
      onClick: () => updSP({
        max: cur.level,
        used: 0
      })
    }, "\u2726 Zaubereipunkte aktivieren");
  })(), /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 8
    }
  }, "\u2728 Bekannte Zauber"), (() => {
    // Build all class/dmg tags from current spells using tplData lookup
    // Ein Bogen ohne Zauberliste ist keiner mit einer leeren: er
    // kommt so von aelteren Staenden und von aussen herein. Ohne
    // die Klammer sturzt der ganze Reiter ab.
    const alleSprueche = cur.spells || [];
    const allSpellClasses = [...new Set(alleSprueche.flatMap(s => s.classes || []))].sort();
    const allSpellDmg = [...new Set(alleSprueche.flatMap(s => s.damageTags || []))].sort();
    const hasFilters = allSpellClasses.length > 0 || allSpellDmg.length > 0;
    const filterActive = spellTagFilter.classes.length > 0 || spellTagFilter.dmg.length > 0;
    return hasFilters && /*#__PURE__*/React.createElement("div", {
      className: "marken-reihe",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
        alignItems: 'center'
      }
    }, allSpellClasses.map(c => {
      const cc = {
        'Artifizient': '#70b8c8',
        'Barbar': '#c84040',
        'Barde': '#4090c0',
        'Druide': '#52b788',
        'Hexenmeister': '#9060c0',
        'Kämpfer': '#c08040',
        'Kleriker': '#e0c040',
        'Magier': '#6080d0',
        'Mönch': '#d09040',
        'Paladin': '#e0a030',
        'Schurke': '#808080',
        'Waldläufer': '#70a050',
        'Zauberer': '#c060a0'
      };
      const col = cc[c] || '#c9a84c';
      const on = spellTagFilter.classes.includes(c);
      return /*#__PURE__*/React.createElement("button", {
        key: c,
        onClick: () => setSpellTagFilter(f => ({
          ...f,
          classes: on ? f.classes.filter(x => x !== c) : [...f.classes, c]
        })),
        style: {
          padding: '2px 8px',
          borderRadius: 10,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          letterSpacing: '0.06em',
          border: '1px solid ' + (on ? col : col + '40'),
          background: on ? col + '22' : 'var(--bg-card)',
          color: on ? col : 'var(--text-muted)'
        }
      }, c);
    }), allSpellDmg.map(d => {
      const dc = {
        Feuer: '#e07030',
        Kälte: '#70b8d8',
        Blitz: '#c0d850',
        Säure: '#90c040',
        Gift: '#80b030',
        Nekrose: '#9060c0',
        Strahlend: '#f0e060',
        Psychisch: '#c070d0',
        Kraft: '#80a0f0',
        Hieb: '#a07050',
        Stich: '#b08060',
        Wucht: '#c09070'
      }[d] || '#a0a0a0';
      const on = spellTagFilter.dmg.includes(d);
      return /*#__PURE__*/React.createElement("button", {
        key: d,
        onClick: () => setSpellTagFilter(f => ({
          ...f,
          dmg: f.dmg.includes(d) ? f.dmg.filter(x => x !== d) : [...f.dmg, d]
        })),
        style: {
          padding: '2px 8px',
          borderRadius: 10,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          letterSpacing: '0.06em',
          border: `1px solid ${on ? dc : dc + '40'}`,
          background: on ? dc + '22' : 'var(--bg-card)',
          color: on ? dc : 'var(--text-muted)'
        }
      }, "\u2694\uFE0F ", d);
    }), filterActive && /*#__PURE__*/React.createElement("button", {
      onClick: () => setSpellTagFilter({
        classes: [],
        dmg: []
      }),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: "'Roboto Condensed',sans-serif",
        padding: '2px 6px'
      }
    }, "\u2715 zur\xFCcksetzen"));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      flex: 1
    },
    onClick: () => {
      setSf({
        ...newSpell(),
        level: 0
      });
      setSfEditId(null);
      setShowSF(true);
    }
  }, "+ Zaubertrick"), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      flex: 1
    },
    onClick: () => {
      setSf(newSpell());
      setSfEditId(null);
      setShowSF(true);
    }
  }, "+ Zauber (Grad 1\u20139)"), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      flex: 1,
      borderColor: "var(--arcane-bright)",
      color: "var(--arcane-bright)"
    },
    onClick: () => openTpl('spell')
  }, "\uD83D\uDCD6 Von Vorlage (SRD)")), darfBearbeiten && (cur.spells || []).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      borderColor: "var(--inspiration)",
      color: "var(--inspiration)"
    },
    title: "W\xFCrfel, Rettungswurf und Steigerung aus den Beschreibungen \xFCbernehmen \u2014 f\xFCr alle Zauber, bei denen noch nichts eingetragen ist",
    onClick: () => {
      let n = 0;
      const neu = (cur.spells || []).map(sp => {
        if (hatWirkung(sp.wirkung) || !String(sp.description || '').trim()) return sp;
        const w = wirkungAusText(sp.description, sp.damageTags);
        if (!hatWirkung(w)) return sp;
        n++;
        return {
          ...sp,
          wirkung: w
        };
      });
      if (n) patchChar({
        spells: neu
      });
      setNachgetragen(n);
    }
  }, "\u21A7 W\xFCrfel nachtragen"), nachgetragen !== null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: nachgetragen ? "var(--inspiration)" : "var(--text-muted)"
    }
  }, nachgetragen ? nachgetragen + (nachgetragen === 1 ? ' Zauber ergänzt' : ' Zauber ergänzt') + ' — im Zugfenster steht der Würfel jetzt dabei.' : 'Nichts zu ergänzen: entweder steht die Wirkung schon da, oder in der Beschreibung steht kein Würfel.')), (cur.spells || []).length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontStyle: "italic",
      fontSize: 14,
      marginBottom: 12
    }
  }, "Noch keine Zauber eingetragen.") : [0, ...sls.filter(l => l !== 0)].filter(l => sbl[l]).map(l => {
    const isCollapsed = collapsedLevels.has(l);
    const toggleLevel = () => setCollapsedLevels(prev => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);else next.add(l);
      return next;
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "spell-level-group",
      key: l
    }, /*#__PURE__*/React.createElement("div", _extends({
      className: "spell-level-header",
      style: {
        cursor: "pointer"
      },
      "aria-expanded": !isCollapsed
    }, clickable(toggleLevel, (l === 0 ? "Zaubertricks" : "Grad " + l) + " auf- oder zuklappen")), /*#__PURE__*/React.createElement("div", {
      className: "spell-level-title"
    }, l === 0 ? "✦ Zaubertricks" : "Grad " + l), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginLeft: "auto"
      }
    }, l > 0 && slots[l] && slots[l].max > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 3
      }
    }, Array.from({
      length: slots[l].max
    }).map((_, i) => {
      const avail = slots[l].max - slots[l].used;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        onClick: e => {
          e.stopPropagation();
          togSlot(l, i);
        },
        style: {
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: i < avail ? "var(--gold-dim)" : "transparent",
          border: "1px solid " + (i < avail ? "var(--gold)" : "var(--border-bright)"),
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: i < avail ? "0 0 4px rgba(201,168,76,0.4)" : "none",
          transition: "all 0.15s"
        },
        title: i < avail ? "Slot verfügbar" : "Slot verbraucht"
      });
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        color: "var(--gold)",
        marginLeft: 2,
        opacity: 0.85
      }
    }, slots[l].max - slots[l].used, "/", slots[l].max)), /*#__PURE__*/React.createElement("div", {
      className: "spell-level-count"
    }, (() => {
      const prep = sbl[l].filter(s => s.prepared !== false).length;
      const unprep = sbl[l].filter(s => s.prepared === false).length;
      if (unprep === 0) return sbl[l].length + " Zauber";
      return prep + " ✓" + (unprep ? " · " + unprep + " ○" : "");
    })()), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--text-muted)",
        marginLeft: 4,
        transition: "transform 0.2s",
        transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)"
      }
    }, "\u25BE"))), !isCollapsed && (() => {
      const tagFilterFn = s => {
        if (spellTagFilter.classes.length === 0 && spellTagFilter.dmg.length === 0) return true;
        const classOk = spellTagFilter.classes.length === 0 || spellTagFilter.classes.some(c => (s.classes || []).includes(c));
        const dmgOk = spellTagFilter.dmg.length === 0 || spellTagFilter.dmg.some(d => (s.damageTags || []).includes(d));
        return classOk && dmgOk;
      };
      const preparedSpells = sbl[l].filter(s => s.prepared !== false && tagFilterFn(s));
      const unpreparedSpells = sbl[l].filter(s => s.prepared === false && tagFilterFn(s));
      const renderSpell = s => {
        const sc = SC[s.school] || SC["Hervorrufung"];
        const spellClasses = s.classes || [];
        const spellDmgTags = s.damageTags || [];
        const levelLabel = s.level === 0 ? 'Zaubertrick' : `${s.level}. Grad · ${s.school}`;
        return /*#__PURE__*/React.createElement("div", _extends({
          key: s.id,
          className: "spell-card" + (exSpell === s.id ? " expanded" : ""),
          style: {
            borderColor: sc.border,
            borderWidth: 2
          },
          "aria-expanded": exSpell === s.id
        }, clickable(() => setExSpell(exSpell === s.id ? null : s.id), s.name)), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-header",
          style: {
            background: `linear-gradient(180deg, ${sc.border} 0%, ${sc.bg} 100%)`
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-name"
        }, s.name), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-school-label"
        }, levelLabel)), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stats-grid"
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-cell"
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-label",
          style: {
            color: sc.text
          }
        }, "Wirkzeit"), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-value"
        }, s.castingTime || '—')), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-cell"
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-label",
          style: {
            color: sc.text
          }
        }, "Reichweite"), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-value"
        }, s.range || '—')), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-cell"
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-label",
          style: {
            color: sc.text
          }
        }, "Komponenten"), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-value"
        }, s.components || '—')), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-cell"
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-label",
          style: {
            color: sc.text
          }
        }, "Dauer"), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-stat-value"
        }, s.duration || '—'))), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-desc-wrap"
        }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-desc",
          dangerouslySetInnerHTML: {
            __html: sanitizeHtml(s.description)
          }
        }))), (spellClasses.length > 0 || spellDmgTags.length > 0) && /*#__PURE__*/React.createElement("div", {
          className: "spell-card-tags"
        }, spellClasses.map(c => {
          const col = CC_COLORS[c] || '#c9a84c';
          return /*#__PURE__*/React.createElement("span", {
            key: c,
            style: {
              padding: '1px 6px',
              borderRadius: 8,
              fontFamily: "'Roboto Condensed',sans-serif",
              fontSize: 8,
              letterSpacing: '0.05em',
              background: col + '22',
              border: '1px solid ' + col + '80',
              color: col
            }
          }, c);
        }), spellDmgTags.map(d => {
          const col = DMG_COLORS[d] || '#a0a0a0';
          return /*#__PURE__*/React.createElement("span", {
            key: d,
            style: {
              padding: '1px 6px',
              borderRadius: 8,
              fontFamily: "'Roboto Condensed',sans-serif",
              fontSize: 8,
              letterSpacing: '0.05em',
              background: col + '22',
              border: '1px solid ' + col + '80',
              color: col
            }
          }, "\u2694 ", d);
        })), /*#__PURE__*/React.createElement("div", {
          className: "spell-card-footer",
          style: {
            background: `${sc.bg}cc`
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "spell-card-school-footer",
          style: {
            color: sc.text
          }
        }, s.school), /*#__PURE__*/React.createElement("div", {
          className: "spell-actions",
          onClick: e => e.stopPropagation(),
          style: {
            alignItems: 'center',
            gap: 4
          }
        }, /*#__PURE__*/React.createElement("button", {
          title: s.prepared === false ? "Vorbereiten" : "Nicht vorbereitet markieren",
          onClick: e => {
            e.stopPropagation();
            toggleSpellPrepared(s.id);
          },
          style: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '1px 3px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: s.prepared === false ? '#e0c040' : '#3aaa5c',
            boxShadow: s.prepared === false ? '0 0 4px #e0c040aa' : '0 0 6px #3aaa5caa',
            transition: 'all 0.2s'
          }
        })), /*#__PURE__*/React.createElement("button", {
          className: "spell-edit-btn",
          onClick: e => {
            e.stopPropagation();
            setSf({
              ...s
            });
            setSfEditId(s.id);
            setShowSF(true);
          },
          style: {
            background: 'rgba(0,0,0,0.12)',
            border: 'none',
            color: 'rgba(0,0,0,0.5)',
            cursor: 'pointer',
            fontSize: 10,
            padding: '2px 5px',
            borderRadius: 3
          }
        }, "\u270E"), /*#__PURE__*/React.createElement("button", {
          className: "spell-delete",
          onClick: e => {
            e.stopPropagation();
            delSpell(s.id);
          }
        }, "\u2715"))));
      };
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        className: "spells-list"
      }, preparedSpells.map(renderSpell)), unpreparedSpells.length > 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        onClick: () => setOpenUnprepared(prev => {
          const s = new Set(prev);
          s.has(l) ? s.delete(l) : s.add(l);
          return s;
        }),
        style: {
          cursor: 'pointer',
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          borderTop: '1px solid var(--border)',
          userSelect: 'none'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          transition: 'transform 0.2s',
          transform: openUnprepared.has(l) ? 'rotate(90deg)' : 'rotate(0deg)'
        }
      }, "\u25B6"), unpreparedSpells.length, " nicht vorbereitet"), openUnprepared.has(l) && /*#__PURE__*/React.createElement("div", {
        className: "spells-list",
        style: {
          marginTop: 8,
          opacity: 0.6
        }
      }, unpreparedSpells.map(renderSpell))));
    })());
  }), (cur.charClass === "Druide" || (cur.multiclasses || []).some(m => m.charClass === "Druide")) && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      marginTop: 8,
      borderColor: "#52b788",
      color: "#52b788",
      width: "100%"
    },
    onClick: () => openTpl('wildshape')
  }, "\uD83D\uDC3A Tierverwandlungs-Bestiar"), (cur.wsFavorites || []).length > 0 && tplData && tplData.wildshapes && (() => {
    const statMod = v => {
      const m = Math.floor((v - 10) / 2);
      return (m >= 0 ? '+' : '') + m;
    };
    const favAnimals = tplData.wildshapes.filter(w => (cur.wsFavorites || []).includes(w.name));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: "1px solid var(--border)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-title",
      style: {
        margin: 0
      }
    }, "\u2B50 Tierverwandlung \u2013 Favoriten"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-muted)",
        marginLeft: "auto"
      }
    }, favAnimals.length, " Tiere")), /*#__PURE__*/React.createElement("div", {
      className: "spells-list"
    }, favAnimals.map((w, i) => {
      const isExp = wsExpand === "fav_" + w.name;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "spell-card" + (isExp ? " expanded" : ""),
        style: {
          borderColor: "#52b78880"
        },
        onClick: () => setWsExpand(isExp ? null : "fav_" + w.name)
      }, /*#__PURE__*/React.createElement("div", {
        className: "spell-card-banner",
        style: {
          background: "linear-gradient(135deg,#1a3d2b 0%,#2a5c3f80 100%)"
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "spell-card-orb",
        style: {
          background: "#52b78840",
          borderColor: "#52b78880",
          color: "#52b788",
          fontSize: 10
        }
      }, "CR", w.cr), /*#__PURE__*/React.createElement("div", {
        className: "spell-card-school-label",
        style: {
          flex: 1
        }
      }, w.name), /*#__PURE__*/React.createElement("div", {
        className: "spell-actions",
        onClick: e => e.stopPropagation()
      }, /*#__PURE__*/React.createElement("button", {
        className: "spell-edit-btn",
        style: {
          color: "#f0c040"
        },
        title: "Aus Favoriten entfernen",
        onClick: e => {
          e.stopPropagation();
          toggleWsFav(w.name);
        }
      }, "\u2605"))), /*#__PURE__*/React.createElement("div", {
        className: "spell-card-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "spell-card-name",
        style: {
          fontSize: 10,
          color: "#52b788",
          opacity: 0.85
        }
      }, w.size, " \xB7 ", w.type), /*#__PURE__*/React.createElement("div", {
        className: "spell-card-stats"
      }, /*#__PURE__*/React.createElement("div", {
        className: "spell-card-stat"
      }, /*#__PURE__*/React.createElement("strong", null, "RK"), w.ac), /*#__PURE__*/React.createElement("div", {
        className: "spell-card-stat"
      }, /*#__PURE__*/React.createElement("strong", null, "TP"), w.hp), /*#__PURE__*/React.createElement("div", {
        className: "spell-card-stat"
      }, /*#__PURE__*/React.createElement("strong", null, "Bew."), w.speed)), /*#__PURE__*/React.createElement("div", {
        className: "spell-card-stats",
        style: {
          marginTop: 4
        }
      }, [['STR', w.str], ['GES', w.dex], ['KON', w.con], ['INT', w.int], ['WEI', w.wis], ['CHA', w.cha]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
        key: l,
        className: "spell-card-stat"
      }, /*#__PURE__*/React.createElement("strong", null, l), v, " (", statMod(v), ")")))), isExp && /*#__PURE__*/React.createElement("div", {
        className: "spell-card-desc-wrap"
      }, /*#__PURE__*/React.createElement("div", {
        className: "spell-card-desc"
      }, w.senses && /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 4
        }
      }, "\uD83D\uDC41 ", /*#__PURE__*/React.createElement("strong", null, "Sinne:"), " ", w.senses), w.skills && /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 4
        }
      }, "\uD83C\uDFAF ", /*#__PURE__*/React.createElement("strong", null, "Fertigk.:"), " ", w.skills), (w.tags || []).length > 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 6
        }
      }, w.tags.map(t => /*#__PURE__*/React.createElement("span", {
        className: "ws-tag",
        key: t,
        style: {
          marginRight: 4,
          marginBottom: 2,
          display: "inline-block"
        }
      }, t))), w.abilities && w.abilities.map((a, ai) => /*#__PURE__*/React.createElement("div", {
        key: ai,
        style: {
          marginBottom: 3
        }
      }, "\u2022 ", a)), w.actions && w.actions.map((a, ai) => /*#__PURE__*/React.createElement("div", {
        key: ai,
        style: {
          marginTop: 4,
          borderTop: "1px solid #52b78830",
          paddingTop: 4
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 11,
          color: "#52b788",
          marginBottom: 2
        }
      }, "\u2694 ", a.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12
        }
      }, a.desc))))));
    })));
  })())), tab === "inventar" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 12
    }
  }, "\uD83D\uDCB0 W\xE4hrung"), /*#__PURE__*/React.createElement("div", {
    className: "currency-row"
  }, COINS.map(c => {
    const val = currency[c.key] || 0;
    return /*#__PURE__*/React.createElement("div", {
      className: "currency-box",
      key: c.key,
      style: {
        borderColor: c.color + '40',
        cursor: 'pointer',
        userSelect: 'none'
      },
      onClick: e => {
        setCoinDelta('');
        setCoinPopover({
          key: c.key,
          label: c.label,
          color: c.color,
          val
        });
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "currency-icon",
      style: {
        color: c.color
      }
    }, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("div", {
      className: "currency-label",
      style: {
        color: c.color
      }
    }, c.label), /*#__PURE__*/React.createElement("div", {
      className: "currency-input",
      style: {
        color: c.color,
        borderColor: c.color + '40',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 16,
        minHeight: 32
      }
    }, val));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 10,
      color: "var(--text-muted)",
      textAlign: "right",
      marginBottom: 20
    }
  }, "Gesamtwert: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--gold)"
    }
  }, totalGp.toFixed(2), " GM")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 0,
      flex: 1
    }
  }, "\uD83C\uDF92 Gegenst\xE4nde"), !transferMode ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "4px 10px",
      fontSize: 11,
      borderColor: "var(--border-bright)",
      color: "var(--text-secondary)"
    },
    onClick: () => {
      setItf(newItem());
      setItfEditId(null);
      setShowIF(true);
    }
  }, "+ Hinzuf\xFCgen"), inv.length > 0 && chars.filter(c => c.id !== sel && !c.archived && (!c.dmOnly || isDmMode)).length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "4px 10px",
      fontSize: 11,
      borderColor: "#7ab8f5",
      color: "#7ab8f5"
    },
    onClick: () => {
      setTransferMode(true);
      setTransferSel(new Set());
    }
  }, "\u27A4 \xDCbergeben")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "4px 10px",
      fontSize: 11
    },
    onClick: () => {
      setTransferMode(false);
      setTransferSel(new Set());
    }
  }, "\u2715 Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "4px 10px",
      fontSize: 11,
      borderColor: transferSel.size > 0 ? "#7ab8f5" : "var(--border)",
      color: transferSel.size > 0 ? "#7ab8f5" : "var(--text-muted)",
      opacity: transferSel.size > 0 ? 1 : 0.5
    },
    onClick: () => {
      if (transferSel.size > 0) setShowTransfer(true);
    },
    disabled: transferSel.size === 0
  }, "\u27A4 ", transferSel.size > 0 ? `${transferSel.size} übergeben` : "Auswahl..."))), inv.length > 0 && (() => {
    const allTags = [...new Set(inv.flatMap(i => i.tags || []))].sort((a, b) => a.localeCompare(b, "de"));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "inv-search-bar"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inv-search-field"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inv-search-icon",
      "aria-hidden": "true"
    }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
      ref: invSucheRef,
      className: "inv-search-input",
      type: "search",
      placeholder: "Gegenst\xE4nde durchsuchen\u2026",
      value: invSuche,
      "aria-label": "Gegenst\xE4nde durchsuchen",
      autoComplete: "off",
      onChange: e => setInvSuche(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Escape' && invSuche) {
          e.stopPropagation();
          setInvSuche("");
        }
      }
    })), /*#__PURE__*/React.createElement("select", {
      className: "tpl-filter-select",
      value: invRarity,
      onChange: e => setInvRarity(e.target.value),
      style: {
        padding: "6px 8px"
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "all"
    }, "Alle Seltenheiten"), RARITIES.map(r => /*#__PURE__*/React.createElement("option", {
      key: r.key,
      value: r.key
    }, r.label))), (invSuche.trim() !== "" || invRarity !== 'all' || invTagFilter.length > 0) && /*#__PURE__*/React.createElement("button", {
      className: "inv-search-reset",
      onClick: invFilterLeeren
    }, "\u2715 Zur\xFCcksetzen")), allTags.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "tag-filter-bar"
    }, allTags.map(tag => /*#__PURE__*/React.createElement("button", {
      key: tag,
      className: "tag-filter-btn" + (invTagFilter.includes(tag) ? " active" : ""),
      onClick: () => setInvTagFilter(invTagFilter.includes(tag) ? invTagFilter.filter(t => t !== tag) : [...invTagFilter, tag])
    }, tag))));
  })(), (() => {
    const rarityOrder = {
      artefakt: 0,
      legendär: 1,
      sehrSelten: 2,
      selten: 3,
      ungewöhnlich: 4,
      gewöhnlich: 5
    };
    const such = invSuche.trim();
    const filtered = inv.map(item => {
      const matchRarity = invRarity === 'all' || item.rarity === invRarity;
      const matchTags = invTagFilter.length === 0 || invTagFilter.every(t => (item.tags || []).includes(t));
      if (!matchRarity || !matchTags) return null;
      const rl = (RARITIES.find(x => x.key === item.rarity) || {}).label;
      const score = itemSearchScore(item, such, rl);
      return score > 0 ? {
        item,
        score
      } : null;
    }).filter(Boolean).sort((a, b) => {
      // Bei einer Suche zaehlt die Trefferguete, sonst bleibt es bei
      // der gewohnten Ordnung nach Seltenheit.
      if (such) return b.score - a.score || a.item.name.localeCompare(b.item.name, 'de');
      const rd = (rarityOrder[a.item.rarity] !== undefined ? rarityOrder[a.item.rarity] : 5) - (rarityOrder[b.item.rarity] !== undefined ? rarityOrder[b.item.rarity] : 5);
      return rd !== 0 ? rd : a.item.name.localeCompare(b.item.name, 'de');
    }).map(x => x.item);
    if (inv.length === 0) return /*#__PURE__*/React.createElement("div", {
      style: {
        color: "var(--text-muted)",
        fontStyle: "italic",
        fontSize: 14,
        marginBottom: 12
      }
    }, "Keine Gegenst\xE4nde im Inventar.");
    if (filtered.length === 0) return /*#__PURE__*/React.createElement("div", {
      className: "inv-leer"
    }, /*#__PURE__*/React.createElement("div", null, "Keine Gegenst\xE4nde gefunden", such ? /*#__PURE__*/React.createElement(React.Fragment, null, " f\xFCr \u201E", such, "\u201C") : null, "."), /*#__PURE__*/React.createElement("button", {
      className: "inv-search-reset",
      onClick: invFilterLeeren
    }, "\u2715 Zur\xFCcksetzen"));
    return /*#__PURE__*/React.createElement("div", null, transferMode && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: filtered.length > 0 && filtered.every(i => transferSel.has(i.id)),
      onChange: e => {
        if (e.target.checked) setTransferSel(new Set(filtered.map(i => i.id)));else setTransferSel(new Set());
      },
      style: {
        cursor: 'pointer',
        accentColor: 'var(--gold)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-muted)'
      }
    }, "Alle ausw\xE4hlen")), /*#__PURE__*/React.createElement("div", null, transferMode && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: filtered.length > 0 && filtered.every(i => transferSel.has(i.id)),
      onChange: e => {
        if (e.target.checked) setTransferSel(new Set(filtered.map(i => i.id)));else setTransferSel(new Set());
      },
      style: {
        cursor: 'pointer',
        accentColor: 'var(--gold)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-muted)'
      }
    }, "Alle ausw\xE4hlen")), /*#__PURE__*/React.createElement("div", {
      className: "inv-grid"
    }, filtered.map(item => {
      const r = RARITIES.find(x => x.key === item.rarity) || RARITIES[0];
      const checked = transferSel.has(item.id);
      const icon = item.icon || '🎒';
      const isExp = exItem === item.id;
      return /*#__PURE__*/React.createElement("div", _extends({
        key: item.id,
        className: "inv-card" + (isExp ? " expanded" : ""),
        style: {
          borderColor: r.color,
          outline: transferMode && checked ? `2px solid ${r.color}` : 'none',
          outlineOffset: 2
        },
        "aria-pressed": transferMode ? checked : undefined
      }, clickable(transferMode ? () => {
        const s = new Set(transferSel);
        checked ? s.delete(item.id) : s.add(item.id);
        setTransferSel(s);
      } : () => setItemViewer(item), item.name)), /*#__PURE__*/React.createElement("div", {
        className: "inv-card-header",
        style: {
          background: `linear-gradient(180deg, ${r.color}30 0%, ${r.color}14 100%), var(--bg-card)`,
          borderBottom: `1px solid ${r.color}55`,
          position: 'relative'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute',
          top: 5,
          left: 6,
          background: 'var(--bg-void)',
          color: 'var(--parchment)',
          border: `1px solid ${r.color}77`,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          fontWeight: 700,
          lineHeight: 1,
          padding: '2px 5px',
          borderRadius: 8,
          minWidth: 16,
          textAlign: 'center',
          display: item.qty > 1 ? 'block' : 'none'
        }
      }, item.qty), /*#__PURE__*/React.createElement("div", {
        className: "inv-card-icon"
      }, icon), /*#__PURE__*/React.createElement("div", {
        className: "inv-card-name"
      }, item.name)), /*#__PURE__*/React.createElement("div", {
        className: "inv-card-body-wrap"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '7px 9px',
          background: 'var(--bg-card)'
        }
      }, item.imageData && /*#__PURE__*/React.createElement("img", {
        src: item.imageData,
        alt: item.name,
        style: {
          width: '100%',
          borderRadius: 4,
          marginBottom: 6,
          cursor: 'zoom-in',
          display: 'block',
          objectFit: 'contain',
          maxHeight: 180
        },
        onClick: e => {
          e.stopPropagation();
          setImgViewer({
            name: item.name,
            imageData: item.imageData
          });
        }
      }), item.description && /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto',sans-serif",
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          marginBottom: 4
        },
        dangerouslySetInnerHTML: {
          __html: sanitizeHtml(item.description)
        }
      }), item.source && /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4
        }
      }, "\uD83D\uDCE6 ", item.source), (item.tags || []).length > 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          marginBottom: 4
        }
      }, (item.tags || []).map(t => /*#__PURE__*/React.createElement("span", {
        key: t,
        className: "inv-tag" + (invTagFilter.includes(t) ? " active" : ""),
        onClick: e => {
          e.stopPropagation();
          if (!transferMode) setInvTagFilter(invTagFilter.includes(t) ? invTagFilter.filter(x => x !== t) : [...invTagFilter, t]);
        }
      }, t))), item.weight && /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }
      }, item.weight, " kg")), /*#__PURE__*/React.createElement("div", {
        className: "inv-card-footer"
      }, transferMode ? /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: checked,
        onChange: e => {
          const s = new Set(transferSel);
          e.target.checked ? s.add(item.id) : s.delete(item.id);
          setTransferSel(s);
        },
        style: {
          cursor: 'pointer',
          accentColor: 'var(--gold)',
          width: 14,
          height: 14
        },
        onClick: e => e.stopPropagation()
      }) : /*#__PURE__*/React.createElement("div", {
        className: "inv-card-actions",
        onClick: e => e.stopPropagation(),
        style: {
          width: '100%',
          justifyContent: 'flex-end'
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: e => {
          e.stopPropagation();
          setItf({
            ...item
          });
          setItfEditId(item.id);
          setShowIF(true);
        },
        style: {
          background: 'rgba(232,213,163,0.10)',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 3
        }
      }, "\u270E"), /*#__PURE__*/React.createElement("button", {
        onClick: e => {
          e.stopPropagation();
          delItem(item.id);
        },
        style: {
          background: 'rgba(232,213,163,0.10)',
          border: 'none',
          color: '#d98a8a',
          cursor: 'pointer',
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 3
        }
      }, "\u2715"))))));
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap'
      }
    }, totalWeight > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: "var(--text-muted)"
      }
    }, "Gesamtgewicht: ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-secondary)"
      }
    }, totalWeight.toFixed(2), " kg")), (such || invRarity !== 'all' || invTagFilter.length > 0) && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: "var(--text-muted)"
      }
    }, filtered.length, " von ", inv.length, " Gegenst\xE4nden")));
  })()), tab === "notizen" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 12
    }
  }, "\uD83D\uDCDC Notizen"), (() => {
    const allNoteTags = [...new Set(notesList.flatMap(n => n.tags || []))].sort();
    const filtered = (noteTagFilter.length === 0 ? notesList : notesList.filter(n => (n.tags || []).some(t => noteTagFilter.includes(t)))).slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', 'de'));
    return /*#__PURE__*/React.createElement(React.Fragment, null, allNoteTags.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }
    }, "Filter:"), allNoteTags.map(t => /*#__PURE__*/React.createElement("button", {
      key: t,
      className: "tag-filter-btn" + (noteTagFilter.includes(t) ? ' active' : ''),
      onClick: () => setNoteTagFilter(noteTagFilter.includes(t) ? noteTagFilter.filter(x => x !== t) : [...noteTagFilter, t])
    }, t)), noteTagFilter.length > 0 && /*#__PURE__*/React.createElement("button", {
      onClick: () => setNoteTagFilter([]),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: "'Roboto Condensed',sans-serif",
        padding: '2px 6px'
      }
    }, "\u2715 zur\xFCcksetzen")), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: "var(--text-muted)",
        fontStyle: "italic",
        fontSize: 14,
        marginBottom: 12
      }
    }, notesList.length === 0 ? 'Noch keine Notizen vorhanden.' : 'Keine Notizen für diesen Filter.') : filtered.map(note => {
      const isEx = exNote === note.id;
      return /*#__PURE__*/React.createElement("div", {
        className: "note-card",
        key: note.id,
        onClick: () => setExNote(isEx ? null : note.id),
        style: {
          borderColor: isEx ? 'var(--gold-dim)' : ''
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "note-card-header"
      }, /*#__PURE__*/React.createElement("div", {
        className: "note-card-title"
      }, "\uD83D\uDCC4 ", note.title), /*#__PURE__*/React.createElement("button", {
        className: "btn-icon",
        style: {
          padding: "3px 8px",
          fontSize: 11
        },
        onClick: e => {
          e.stopPropagation();
          setNf({
            title: note.title,
            content: note.content,
            tags: note.tags || []
          });
          setNfEditId(note.id);
          setShowNF(true);
        }
      }, "\u270F\uFE0F Bearbeiten"), /*#__PURE__*/React.createElement("button", {
        className: "note-del",
        onClick: e => {
          e.stopPropagation();
          delNote(note.id);
        }
      }, "\u2715")), (note.tags || []).length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "inv-tags",
        style: {
          marginTop: 4
        }
      }, note.tags.map(t => /*#__PURE__*/React.createElement("span", {
        key: t,
        className: "inv-tag" + (noteTagFilter.includes(t) ? ' active' : ''),
        onClick: e => {
          e.stopPropagation();
          setNoteTagFilter(noteTagFilter.includes(t) ? noteTagFilter.filter(x => x !== t) : [...noteTagFilter, t]);
        }
      }, t))), note.content && /*#__PURE__*/React.createElement("div", {
        className: "note-card-body" + (isEx ? " open" : "")
      }, /*#__PURE__*/React.createElement("div", null, !isEx ? /*#__PURE__*/React.createElement("div", {
        className: "note-card-preview"
      }, note.content.length > 120 ? note.content.slice(0, 120) + '…' : note.content) : /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 8,
          fontFamily: "'Roboto',sans-serif",
          fontSize: 15,
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          paddingBottom: 4
        }
      }, note.content))));
    }));
  })(), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    onClick: () => {
      setNf({
        title: '',
        content: '',
        tags: []
      });
      setNfEditId(null);
      setShowNF(true);
    }
  }, "+ Neue Notiz")), leisteWahlOffen && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay",
    onClick: () => setLeisteWahlOffen(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 460
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\u2699 Werte in der Leiste"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Was hier ausgew\xE4hlt ist, steht oben in der mitscrollenden Leiste. Die Auswahl geh\xF6rt zum Helden \u2014 jeder in der Gruppe hat seine eigene."), /*#__PURE__*/React.createElement("div", {
    className: "leiste-wahl"
  }, stickyKatalog.map(b => {
    const an = stickyWahl.includes(b.k);
    const letzter = an && stickyWahl.length <= 1;
    return /*#__PURE__*/React.createElement("label", {
      key: b.k,
      className: "leiste-wahl-zeile" + (an ? " an" : ""),
      title: letzter ? "Mindestens ein Wert muss bleiben" : undefined
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: an,
      disabled: letzter,
      onChange: () => stickyUmschalten(b.k)
    }), /*#__PURE__*/React.createElement("span", {
      className: "leiste-wahl-name"
    }, b.i, " ", b.l), /*#__PURE__*/React.createElement("span", {
      className: "leiste-wahl-wert"
    }, b.v));
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => patchChar({
      stickyFields: STICKY_STANDARD
    })
  }, "Zur\xFCcksetzen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: () => setLeisteWahlOffen(false)
  }, "Fertig")))), tab === "log" && /*#__PURE__*/React.createElement(LogTab, {
    charId: sel,
    charName: cur?.name,
    addLog: addLog,
    isDmMode: isDmMode
  }));
};

// ==== js/src/3a-ausruestung.jsx ====
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
    cur,
    effCur,
    computedAC,
    displayAC,
    itemFx,
    gearWornList,
    nhGesperrt,
    setGearSlot,
    gearArmor,
    gearShield,
    gearAusVorlage,
    gearSetList,
    gearPick,
    setGearPick,
    fxOn,
    fxTitle,
    patchChar,
    appAlert,
    appConfirm,
    setItemViewer,
    setWeaponViewer,
    setItf,
    setItfEditId,
    setShowIF,
    setImgViewer
  } = React.useContext(SheetCtx);
  if (!cur) return null;
  const belegt = {};
  gearWornList.forEach(x => {
    belegt[x.slot.key] = x;
  });
  const spalte = name => GEAR_SLOTS.filter(s => s.spalte === name);

  // Was in einen Platz passt: Waffen aus cur.weapons, Gegenstaende ueber
  // ihren eingetragenen Ausruestungsplatz.
  const kandidaten = s => {
    const out = [];
    if (s.nimmt.includes('waffe')) {
      (cur.weapons || []).forEach(w => out.push({
        k: 'w',
        obj: w,
        art: 'Waffe'
      }));
    }
    (cur.inventory || []).forEach(i => {
      if (i.gearKind && s.nimmt.includes(i.gearKind)) out.push({
        k: 'i',
        obj: i,
        art: (GEAR_KINDS.find(g => g.key === i.gearKind) || {}).label || ''
      });
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
  const oeffneAnsicht = eintrag => {
    if (!eintrag) return;
    if (eintrag.k === 'w') setWeaponViewer(eintrag.obj.id);else setItemViewer(eintrag.obj);
  };
  const platzKachel = s => {
    const eintrag = belegt[s.key];
    const gesperrt = s.key === 'nebenhand' && nhGesperrt;
    const o = eintrag ? eintrag.obj : null;
    const klassen = 'gear-slot' + (gesperrt ? ' gesperrt' : o ? ' belegt' : ' leer') + (s.rk && o ? ' rk' : '');
    const beschriftung = gesperrt ? 'durch Zweihänder belegt' : o ? o.name : 'leer';
    // Der Platz selbst zeigt, was darin steckt; gewechselt wird ueber den
    // kleinen Knopf daneben. Ein leerer Platz hat nichts zu zeigen und
    // oeffnet deshalb gleich die Auswahl.
    return /*#__PURE__*/React.createElement("div", {
      key: s.key,
      className: klassen
    }, /*#__PURE__*/React.createElement("button", {
      className: "gear-slot-btn",
      disabled: gesperrt,
      onClick: () => {
        if (gesperrt) return;
        if (o) oeffneAnsicht(eintrag);else setGearPick(s.key);
      },
      title: gesperrt ? 'Die Haupthand führt einen Zweihänder' : o ? o.name + ' — tippen für Einzelheiten' : s.label + ' belegen',
      "aria-label": s.label + ': ' + beschriftung
    }, /*#__PURE__*/React.createElement("span", {
      className: "gear-slot-ic"
    }, o && o.imageData ? /*#__PURE__*/React.createElement("img", {
      src: o.imageData,
      alt: ""
    }) : /*#__PURE__*/React.createElement("span", {
      className: "gear-slot-emoji"
    }, o && o.icon || s.icon)), /*#__PURE__*/React.createElement("span", {
      className: "gear-slot-txt"
    }, /*#__PURE__*/React.createElement("b", null, s.label), /*#__PURE__*/React.createElement("i", null, beschriftung))), o && !gesperrt && /*#__PURE__*/React.createElement("button", {
      className: "gear-slot-info",
      title: s.label + ' wechseln oder ablegen',
      onClick: () => setGearPick(s.key),
      "aria-label": s.label + ' wechseln oder ablegen'
    }, "\u21C4"));
  };

  // ── Herleitung der Ruestungsklasse ──
  const herleitung = () => {
    const dex = mod(effCur.dex);
    const teile = [];
    if (gearArmor) {
      const t = gearArmor.armorType,
        b = +gearArmor.baseAC || 0;
      if (t === 'heavy') teile.push(gearArmor.name + ': ' + b);
      if (t === 'medium') teile.push(gearArmor.name + ': ' + b + ' + GES ' + Math.min(2, dex));
      if (t === 'light') teile.push(gearArmor.name + ': ' + b + ' + GES ' + dex);
    } else {
      teile.push('Unbewaffnet: 10 + GES ' + dex);
    }
    if (gearShield) teile.push(gearShield.name + ': +' + (+gearShield.baseAC || 2));
    gearWornList.forEach(({
      obj
    }) => {
      if ((+obj.acBonus || 0) !== 0) teile.push(obj.name + ': ' + (+obj.acBonus >= 0 ? '+' : '') + +obj.acBonus);
    });
    effectsFor(itemFx, 'ac').forEach(e => {
      teile.push(e.source + ': ' + (e.mode === 'set' ? 'RK = ' + (+e.value || 0) : fnum(+e.value || 0)));
    });
    return teile;
  };

  // ── Bild des Helden ──
  // Es liegt im Charakter-Datensatz, und der geht bei jeder Aenderung am
  // Helden vollstaendig zum Server — anders als Inventargegenstaende, die
  // einzeln gespeichert werden. Deshalb 480px lange Kante: angezeigt wird
  // es ohnehin nur handtellergross.
  const bildWaehlen = ev => {
    const datei = ev.target.files && ev.target.files[0];
    ev.target.value = ''; // damit dieselbe Datei erneut gewaehlt werden kann
    if (!datei) return;
    compressImage(datei, 480, daten => {
      if (daten) patchChar({
        portrait: daten
      });else appAlert('Das Bild liess sich nicht lesen.');
    });
  };
  const bildEntfernen = () => appConfirm('Bild wirklich entfernen?', () => patchChar({
    portrait: ''
  }));
  const s = gearPick ? GEAR_SLOTS.find(x => x.key === gearPick) : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "gear-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gear-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 0
    }
  }, "\uD83D\uDEE1 Ausr\xFCstung"), /*#__PURE__*/React.createElement("div", {
    className: "gear-ac",
    title: fxTitle('ac')
  }, /*#__PURE__*/React.createElement("span", {
    className: "gear-ac-l"
  }, "R\xFCstungsklasse"), /*#__PURE__*/React.createElement("span", {
    className: "gear-ac-v" + (fxOn('ac') ? " fx-touched" : "")
  }, displayAC))), /*#__PURE__*/React.createElement("div", {
    className: "gear-doll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gear-col"
  }, spalte('links').map(platzKachel)), /*#__PURE__*/React.createElement("div", {
    className: "gear-mid"
  }, cur.portrait ? /*#__PURE__*/React.createElement("img", {
    className: "gear-mid-bild",
    src: cur.portrait,
    alt: cur.name,
    onClick: () => setImgViewer({
      name: cur.name,
      imageData: cur.portrait
    })
  }) : /*#__PURE__*/React.createElement("label", {
    className: "gear-mid-leer",
    title: "Bild des Helden hochladen"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gear-figur",
    "aria-hidden": "true"
  }, "\u2694"), /*#__PURE__*/React.createElement("span", {
    className: "gear-portrait-hinweis"
  }, "\uD83D\uDCF7 Bild w\xE4hlen"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: bildWaehlen
  })), cur.portrait && /*#__PURE__*/React.createElement("div", {
    className: "gear-portrait-tools"
  }, /*#__PURE__*/React.createElement("label", {
    className: "gear-portrait-btn",
    title: "Anderes Bild w\xE4hlen"
  }, "\u270E", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: bildWaehlen
  })), /*#__PURE__*/React.createElement("button", {
    className: "gear-portrait-btn",
    onClick: bildEntfernen,
    title: "Bild entfernen",
    "aria-label": "Bild entfernen"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "gear-mid-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gear-mid-name"
  }, cur.name), /*#__PURE__*/React.createElement("div", {
    className: "gear-herleitung"
  }, computedAC === null ? /*#__PURE__*/React.createElement("div", {
    className: "gear-hint"
  }, "RK von Hand eingetragen \u2014 lege eine R\xFCstung an, damit sie gerechnet wird.") : herleitung().map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: i === 0 ? 'stark' : ''
  }, i === 0 ? '' : '+ ', t)), computedAC !== null && /*#__PURE__*/React.createElement("div", {
    className: "gear-summe"
  }, "= ", displayAC, " RK")))), /*#__PURE__*/React.createElement("div", {
    className: "gear-col"
  }, spalte('rechts').map(platzKachel))), /*#__PURE__*/React.createElement("div", {
    className: "gear-hands"
  }, spalte('hand').map(platzKachel)), gearSetList.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "gear-sets"
  }, gearSetList.map(s => {
    const ziel = s.stufen.length ? Math.max(...s.stufen.map(st => +st.teile || 0)) : s.teile;
    return /*#__PURE__*/React.createElement("div", {
      className: "gear-set",
      key: s.name
    }, /*#__PURE__*/React.createElement("div", {
      className: "gear-set-kopf"
    }, /*#__PURE__*/React.createElement("span", {
      className: "gear-set-name"
    }, "\u2726 ", s.name), /*#__PURE__*/React.createElement("span", {
      className: "gear-set-zahl"
    }, s.teile, ziel > s.teile || s.stufen.length ? ' / ' + ziel : '', " Teile")), s.stufen.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "gear-set-stufe offen"
    }, s.def ? 'Für dieses Set sind noch keine Stufen hinterlegt.' : 'Kein Eintrag in der Datenbank — lege unter 📚 Datenbank › Sets einen mit genau diesem Namen an.') : s.stufen.map((st, i) => /*#__PURE__*/React.createElement("div", {
      className: "gear-set-stufe" + (st.aktiv ? " aktiv" : ""),
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "gear-set-teile"
    }, st.teile, " Teile"), /*#__PURE__*/React.createElement("span", {
      className: "gear-set-fx"
    }, (st.effects || []).length === 0 ? /*#__PURE__*/React.createElement("i", null, "nichts hinterlegt") : (st.effects || []).map((e, j) => /*#__PURE__*/React.createElement("span", {
      key: j,
      className: "fx-chip"
    }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))))));
  }))), s && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay",
    onClick: () => setGearPick(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal gear-pick",
    style: {
      maxWidth: 460
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, s.icon, " ", s.label), (() => {
    const liste = kandidaten(s);
    const drin = belegt[s.key];
    return /*#__PURE__*/React.createElement(React.Fragment, null, drin && /*#__PURE__*/React.createElement("button", {
      className: "gear-pick-leeren",
      onClick: () => {
        setGearSlot(s.key, null, null);
        setGearPick(null);
      }
    }, "\u2715 ", drin.obj.name, " ablegen"), liste.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "gear-pick-leer"
    }, "Nichts passendes dabei.", s.nimmt.includes('waffe') ? ' Waffen legst du im Aktionen-Reiter an.' : ' Trage bei einem Gegenstand im Inventar den Ausrüstungsplatz „' + ((GEAR_KINDS.find(g => g.key === s.nimmt[0]) || {}).label || s.label) + '“ ein, dann steht er hier zur Wahl.') : /*#__PURE__*/React.createElement("div", {
      className: "gear-pick-list"
    }, liste.map(({
      k,
      obj,
      art
    }) => {
      const jetzt = platzVon(k, obj.id);
      const hier = jetzt && jetzt.key === s.key;
      return /*#__PURE__*/React.createElement("button", {
        key: k + obj.id,
        className: "gear-pick-item" + (hier ? " hier" : ""),
        onClick: () => {
          setGearSlot(s.key, k, obj.id);
          setGearPick(null);
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "gear-pick-ic"
      }, obj.imageData ? /*#__PURE__*/React.createElement("img", {
        src: obj.imageData,
        alt: ""
      }) : obj.icon || (k === 'w' ? '⚔' : '🎒')), /*#__PURE__*/React.createElement("span", {
        className: "gear-pick-txt"
      }, /*#__PURE__*/React.createElement("b", null, obj.name || '(ohne Namen)'), /*#__PURE__*/React.createElement("i", null, art, k === 'w' && isZweihand(obj) && ' · Zweihänder', k === 'i' && obj.armorType === 'shield' && ' · +' + (+obj.baseAC || 2) + ' RK', k === 'i' && obj.armorType && obj.armorType !== 'shield' && ' · Basis ' + (+obj.baseAC || 0), (+obj.acBonus || 0) !== 0 && ' · ' + (+obj.acBonus >= 0 ? '+' : '') + +obj.acBonus + ' RK', (obj.effects || []).length > 0 && ' · ' + (obj.effects || []).length + ' Effekt' + ((obj.effects || []).length > 1 ? 'e' : ''))), jetzt && /*#__PURE__*/React.createElement("span", {
        className: "gear-pick-wo"
      }, hier ? 'hier' : jetzt.kurz));
    })), (() => {
      const vorlagen = ARMOR_TEMPLATES.filter(t => s.nimmt.includes(t.art));
      if (!vorlagen.length) return null;
      return /*#__PURE__*/React.createElement("div", {
        className: "gear-vorlagen"
      }, /*#__PURE__*/React.createElement("div", {
        className: "gear-vorlagen-titel"
      }, "Vorlagen"), /*#__PURE__*/React.createElement("div", {
        className: "gear-vorlagen-chips"
      }, vorlagen.map(t => /*#__PURE__*/React.createElement("button", {
        key: t.name,
        className: "gear-vorlage",
        title: t.name + ' anlegen und anziehen',
        onClick: () => {
          gearAusVorlage(s.key, t);
          setGearPick(null);
        }
      }, t.name))));
    })(), !s.nimmt.includes('waffe') && /*#__PURE__*/React.createElement("button", {
      className: "gear-pick-neu",
      onClick: () => {
        setItf({
          ...newItem(),
          gearKind: s.nimmt[0] === 'schild' ? 'schild' : s.nimmt[0]
        });
        setItfEditId(null);
        setShowIF(true);
        setGearPick(null);
      }
    }, "+ Neuen Gegenstand f\xFCr diesen Platz anlegen"));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setGearPick(null)
  }, "Schlie\xDFen")))));
};

// ==== js/src/4-app.jsx ====
// Heldenbuch — Wurzelkomponente: Zustand, Server-Sync, Seitenleiste,
// Dialoge. Haelt alles, was der Bogen ueber SheetCtx bekommt.

function App() {
  const [chars, setChars] = useState([]);
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("stats");
  const [mv, setMv] = useState("list");
  const [showCF, setShowCF] = useState(false);
  const [showWF, setShowWF] = useState(false);
  const [showFF, setShowFF] = useState(false);
  const [ffEditId, setFfEditId] = useState(null);
  const [ff, setFf] = useState({
    name: '',
    source: '',
    description: '',
    effects: [],
    effectsActive: true
  });
  const [exFeature, setExFeature] = useState(null);
  const [slotsEdit, setSlotsEdit] = useState(false);
  const [spEdit, setSpEdit] = useState(false);
  const [resEdit, setResEdit] = useState(false);
  const [statsEdit, setStatsEdit] = useState(false);
  const [showSF, setShowSF] = useState(false);
  const [sfEditId, setSfEditId] = useState(null);
  const [invRarity, setInvRarity] = useState('all');
  const [imgViewer, setImgViewer] = useState(null); // {name, imageData}
  const [itemViewer, setItemViewer] = useState(null);
  // Nur die id: die Waffe wird beim Rendern frisch aus cur geholt, damit die
  // Detailansicht nach einer Bearbeitung nicht auf einer Kopie stehen bleibt.
  const [weaponViewer, setWeaponViewer] = useState(null);
  const [coinPopover, setCoinPopover] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [logEntries, setLogEntries] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [showAdventLog, setShowAdventLog] = useState(false);
  const [adventEntries, setAdventEntries] = useState([]);
  const [adventSearch, setAdventSearch] = useState('');
  const [adventTabFilter, setAdventTabFilter] = useState([]);
  const [coinDelta, setCoinDelta] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [invTagFilter, setInvTagFilter] = useState([]);
  const [showNF, setShowNF] = useState(false);
  const [nfEditId, setNfEditId] = useState(null);
  const [nf, setNf] = useState({
    title: '',
    content: ''
  });
  const [noteTagFilter, setNoteTagFilter] = useState([]);
  const [exNote, setExNote] = useState(null);
  const [showIF, setShowIF] = useState(false);
  const [itfEditId, setItfEditId] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSel, setTransferSel] = useState(new Set());
  const [transferMode, setTransferMode] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [charSearch, setCharSearch] = useState('');
  // Die Heldenliste bleibt stehen, wo der Benutzer sie gelassen hat.
  // Vorher klappte sie sich beim Auswaehlen eines Helden selbst weg, und
  // zurueck ging es nur ueber einen fingerbreiten Streifen am linken Rand
  // — auf Geraeten ueber 1024px (dazu zaehlt ein Tablet im Querformat)
  // war das der einzige Weg zurueck zur Uebersicht und schlicht nicht zu
  // finden.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Dialoge: Escape und Tastaturfokus ────────────────────────────
  // Beides fehlte in allen 20 Dialogen. Statt jeden einzeln umzubauen, hier
  // einmal generisch: gesucht wird der zuletzt geoeffnete .form-overlay.
  //
  // Escape drueckt den Abbrechen- bzw. Schliessen-Knopf des Dialogs — also
  // genau das, was der Knopf ohnehin tut, samt Aufraeumen der Bearbeiten-Id.
  //
  // Bewusst NICHT vereinheitlicht: dass manche Dialoge per Klick auf den
  // Hintergrund schliessen und andere nicht. Ansichten tun es, Formulare
  // nicht — sonst kostet ein Fehlklick die Eingaben. Das ist Absicht.
  useEffect(() => {
    const fokussierbar = wurzel => [...wurzel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]')].filter(el => !el.disabled && el.offsetParent !== null);
    const aufTaste = e => {
      const overlays = document.querySelectorAll('.form-overlay');
      if (!overlays.length) return;
      const oben = overlays[overlays.length - 1];
      if (e.key === 'Escape') {
        const knopf = [...oben.querySelectorAll('button')].find(b => /abbrechen|schlie(ss|ß)en|verstanden|^✕$/i.test(b.textContent.trim()));
        if (knopf) {
          e.preventDefault();
          knopf.click();
        }
        return;
      }
      if (e.key === 'Tab') {
        const ziele = fokussierbar(oben);
        if (!ziele.length) return;
        // Steht der Fokus noch ausserhalb, zuerst hineinholen.
        if (!oben.contains(document.activeElement)) {
          e.preventDefault();
          ziele[0].focus();
          return;
        }
        const erster = ziele[0],
          letzter = ziele[ziele.length - 1];
        if (e.shiftKey && document.activeElement === erster) {
          e.preventDefault();
          letzter.focus();
        } else if (!e.shiftKey && document.activeElement === letzter) {
          e.preventDefault();
          erster.focus();
        }
      }
    };
    document.addEventListener('keydown', aufTaste);
    return () => document.removeEventListener('keydown', aufTaste);
  }, []);
  // Muss mit dem CSS-Breakpoint (max-width:1024px) übereinstimmen: nur der
  // aktive Bogen wird gerendert, statt beide zu bauen und einen zu verstecken.
  const TOUCH_MQ = '(max-width:1024px)';
  const [isTouchLayout, setIsTouchLayout] = useState(() => window.matchMedia(TOUCH_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(TOUCH_MQ);
    const onChange = e => setIsTouchLayout(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const [charMenuOpen, setCharMenuOpen] = useState(false);
  const [ec, setEc] = useState(null);
  const [wf, setWf] = useState(newWeapon());
  const [wfEditId, setWfEditId] = useState(null);
  const [sf, setSf] = useState(newSpell());
  const [itf, setItf] = useState(newItem());
  const [exSpell, setExSpell] = useState(null);
  const [collapsedLevels, setCollapsedLevels] = useState(() => window.innerWidth < 1025 ? new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) : new Set());
  const [spellTagFilter, setSpellTagFilter] = useState({
    classes: [],
    dmg: []
  });
  const [openUnprepared, setOpenUnprepared] = useState(new Set());
  const [exItem, setExItem] = useState(null);
  const [showTpl, setShowTpl] = useState(null); // 'spell' | 'weapon' | 'wildshape'
  const [tplData, setTplData] = useState(null);
  const [userLibrary, setUserLibrary] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hb_library') || '{}');
    } catch {
      return {};
    }
  });
  // Ob die geteilte Datenbank schon vorliegt. Nur dann sind die
  // Einstellungen des Abenteuers bekannt — und nur dann duerfen verdeckte
  // Trefferpunkte als Zahl erscheinen.
  const [libGeladen, setLibGeladen] = useState(() => {
    try {
      return !!localStorage.getItem('hb_library');
    } catch {
      return false;
    }
  });
  const libTimer = useRef(null);
  const [tplSearch, setTplSearch] = useState('');
  const [tplFilter, setTplFilter] = useState('all');
  const [tplClassFilter, setTplClassFilter] = useState([]);
  const [tplDmgFilter, setTplDmgFilter] = useState([]);
  const [wsFilter, setWsFilter] = useState({
    cr: 'all',
    tag: 'all'
  });
  const [wsExpand, setWsExpand] = useState(null);
  const toggleWsFav = name => {
    const favs = cur.wsFavorites || [];
    patchChar({
      wsFavorites: favs.includes(name) ? favs.filter(n => n !== name) : [...favs, name]
    });
  };

  // Server-Sync
  const [svUrl, setSvUrl] = useState('');
  const [svCode, setSvCode] = useState('');
  const [svPass, setSvPass] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMsg, setSyncMsg] = useState('');
  const [offeneAenderungen, setOffeneAenderungen] = useState(0);
  const [isDmMode, setIsDmMode] = useState(false);
  const [dmPass, setDmPass] = useState('');
  const [dmLibrary, setDmLibrary] = useState({});
  // Das angemeldete Konto: {id, name, ist_admin, muss_wechseln, gruppen}.
  // Null heisst "ueber das Gruppenpasswort verbunden" — der alte Weg, der
  // weiterlaeuft, bis jeder ein Konto hat.
  const [konto, setKonto] = useState(null);
  const [passwortDlg, setPasswortDlg] = useState(null); // {alt, neu, neu2, err, pflicht}
  // Wem welcher Bogen gehoert: {charId: userId}. Kommt aus einer eigenen
  // Spalte und wird nie in den Charakter geschrieben — was die Anwendung
  // schreibt, darf nicht ueber Rechte entscheiden.
  const [besitzer, setBesitzer] = useState({});
  // Wer welches Abenteuer leitet: {advId: [userId]}. Leer heisst "niemand
  // eingetragen" und damit: jede Spielleitung der Gruppe.
  const [advDms, setAdvDms] = useState({});
  const [logTage, setLogTage] = useState(180);
  const [kontoDlg, setKontoDlg] = useState(null); // {daten, laedt, err}
  const [verwaltung, setVerwaltung] = useState(null); // {laedt, users, mitglied, err, …}
  const [mitglieder, setMitglieder] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [showDB, setShowDB] = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null); // {msg, onOk}
  const appConfirm = (msg, onOk, okLabel) => setConfirmDlg({
    msg,
    onOk,
    okLabel
  });
  // Hinweis ohne Rueckfrage — nutzt denselben Dialog, damit Meldungen im
  // Bogen bleiben statt als Systemfenster des Browsers aufzupoppen.
  const appAlert = msg => setConfirmDlg({
    msg,
    onOk: null,
    okLabel: 'Verstanden'
  });
  const [dbTab, setDbTab] = useState('spell');
  const [dbForm, setDbForm] = useState(null);
  const [dbFormId, setDbFormId] = useState(null);
  const [dbListTick, setDbListTick] = useState(0);
  const [dbExpandedEntry, setDbExpandedEntry] = useState(null);
  const [dbGradeFilter, setDbGradeFilter] = useState('');
  const [setupForm, setSetupForm] = useState({
    code: '',
    pass: ''
  });
  const [setupErr, setSetupErr] = useState('');
  const [setupBusy, setSetupBusy] = useState(false);
  const [gearReady, setGearReady] = useState(false); // Serverstand da, Umstellung darf laufen
  const [ansichtBereit, setAnsichtBereit] = useState(false); // Merker gelesen, ab jetzt schreiben
  // Welches Abenteuer gerade offen ist. Steht im Geraet, nicht am Server:
  // zwei Spieler duerfen gleichzeitig in verschiedenen Kampagnen blaettern.
  const [advAktiv, setAdvAktiv] = useState(() => {
    try {
      return localStorage.getItem('hb_adventure') || '';
    } catch {
      return '';
    }
  });
  const [showAdvVerwaltung, setShowAdvVerwaltung] = useState(false);
  const [advEinstellung, setAdvEinstellung] = useState(null); // Abenteuer im Einstellungsfenster
  // Gegner der Spielleitung. Nur im DM-Modus geladen, eigene Tabelle.
  const [enemies, setEnemies] = useState([]);
  const [enemiesGeladen, setEnemiesGeladen] = useState(false);
  const [enemyForm, setEnemyForm] = useState(null); // offener Bearbeiten-Dialog
  const [enemyView, setEnemyView] = useState(null); // offene Werteübersicht
  const [enemyImportBusy, setEnemyImportBusy] = useState(false);
  const [encounters, setEncounters] = useState([]);
  // Der laufende Kampf liegt im Geraet, nicht nur im Arbeitsspeicher: im
  // alten Tracker kostete ein versehentliches Neuladen mitten im Kampf die
  // ganze Initiativreihenfolge. Er gehoert der Spielleitung an diesem
  // Geraet, deshalb reicht der lokale Speicher — auf dem Server waere er
  // ein Fremdkoerper zwischen den Charakterboegen.
  const [kampf, setKampfRoh] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hb_kampf') || 'null');
    } catch {
      return null;
    }
  });
  const [showKampf, setShowKampf] = useState(false);
  const setKampf = wertOderFn => setKampfRoh(vorher => {
    const neu = typeof wertOderFn === 'function' ? wertOderFn(vorher) : wertOderFn;
    try {
      if (neu) localStorage.setItem('hb_kampf', JSON.stringify(neu));else localStorage.removeItem('hb_kampf');
    } catch {}
    return neu;
  });
  const [encForm, setEncForm] = useState(null);
  // Die Chronik liegt als ein Stueck am Server: "die Gruppe schlaeft drei
  // Tage" ruehrt jedes offene Ereignis an, das waere zeilenweise ein
  // Dutzend Anfragen fuer einen Knopfdruck.
  const [chronik, setChronik] = useState({
    zeit: {},
    ereignisse: []
  });
  const [showChronik, setShowChronik] = useState(() => {
    try {
      return localStorage.getItem('hb_chronik_offen') === '1';
    } catch {
      return false;
    }
  });
  const [ereignisForm, setEreignisForm] = useState(null); // {e, neu}
  // Der Automat in der Taverne. Zeitvertreib fuer alle, nicht nur die
  // Spielleitung — und ohne jede Verbindung zum Charakterbogen.
  const [showAutomat, setShowAutomat] = useState(false);
  const [zeitOffen, setZeitOffen] = useState(false);
  const [encNurAktives, setEncNurAktives] = useState(true);
  const [enemySuche, setEnemySuche] = useState('');
  const [enemyCr, setEnemyCr] = useState('');
  const [enemyTag, setEnemyTag] = useState('');
  const [advMenuOffen, setAdvMenuOffen] = useState(false);
  const [gearPick, setGearPick] = useState(null); // offener Platz im Auswahldialog
  const saveTimer = useRef(null);
  const autoSyncTimer = useRef(null);
  // Hintergrundabgleich: die Kennung (billig statt bcrypt), der zuletzt
  // gesehene Stand und ein Zaehler ruhiger Runden fuer die Bremse.
  const pollToken = useRef(null);
  const revRef = useRef(null);
  const ruheRef = useRef(0);
  // Wo man beim letzten Mal war. Wird einmal nach dem Laden angewandt.
  const ansichtGeholt = useRef(false);
  const charsRef = useRef([]);
  const selRef = useRef(null);
  const pendingRef = useRef(false);
  const pendingChars = useRef({}); // {charId: charWithoutInventory}
  const pendingDeletes = useRef(new Set()); // charIds to delete
  const pendingItems = useRef({}); // {charId_itemId: itemData}
  const pendingItemDel = useRef(new Set()); // "charId_itemId" to delete
  const selectChar = id => {
    selRef.current = id;
    setSel(id);
  };

  // ── Lokale Kopie ────────────────────────────────────────────────
  // Der Browser gibt einer Seite rund 5 MB. Mit Heldenbildern und
  // Gegenstandsbildern ist das erreichbar, und dann wirft setItem. Bisher
  // riss das die Anmeldung mit: der Fehler landete ungefangen im
  // Anmeldefenster ("exceeded the quota") und niemand kam mehr hinein.
  //
  // Die Kopie ist eine Bequemlichkeit — sie zeigt den letzten Stand, bis
  // der Server antwortet. Ihr Fehlen darf nichts blockieren: die Daten
  // liegen auf dem Server, und die Warteschlange merkt sich Kennungen,
  // keine Inhalte.
  //
  // Passt sie nicht mehr in den Browserspeicher, wird ohne sie
  // weitergearbeitet. Angezeigt wird das nicht mehr: es war eine Warnung
  // ueber etwas, das niemanden betrifft — geladen wird ohnehin vom
  // Server. Fuer die Fehlersuche steht es in der Konsole.
  const spiegleChars = json => {
    try {
      localStorage.setItem('dnd_chars', json);
      return true;
    } catch (e) {
      // Platz schaffen: die Bibliothek laesst sich jederzeit neu laden.
      try {
        localStorage.removeItem('hb_library');
      } catch {}
      try {
        localStorage.removeItem('hb_dm_library');
      } catch {}
      try {
        localStorage.setItem('dnd_chars', json);
        return true;
      } catch {}
      // Ein unvollstaendiger Stand waere schlimmer als keiner: er saehe
      // aus wie Datenverlust. Lieber gar keine Kopie.
      try {
        localStorage.removeItem('dnd_chars');
      } catch {}
      console.warn('[Heldenbuch] Lokale Kopie passt nicht in den Browserspeicher:', e && e.message);
      return false;
    }
  };

  // ── Warteschlange zum Server ────────────────────────────────────
  // Sie lag bisher nur im Arbeitsspeicher. Wer aenderte, waehrend der
  // Server nicht erreichbar war, und dann das Fenster schloss, verlor die
  // Aenderung stillschweigend: beim naechsten Laden stand pendingRef auf
  // false, und der Serverstand ueberschrieb die lokale Kopie. Jetzt liegt
  // sie neben den Daten und wird beim Start wieder aufgenommen — was
  // einmal geaendert wurde, geht zum Server, sobald er antwortet.
  const WARTESCHLANGE = 'hb_pending';
  const zaehleOffen = () => Object.keys(pendingChars.current).length + Object.keys(pendingItems.current).length + pendingDeletes.current.size + pendingItemDel.current.size;
  // Gemerkt wird nur, WAS offen ist — nicht der Inhalt. Der steht ohnehin
  // in dnd_chars. Ihn danebenzulegen hat den Browserspeicher gesprengt:
  // Heldenbilder und Gegenstandsbilder wiegen je einige zehn Kilobyte, und
  // mit sechs Helden ist die Grenze von rund 5 MB schnell erreicht. So
  // bleiben ein paar hundert Byte, und beim Senden wird ohnehin der
  // aktuelle Stand gelesen statt eines alten Abzugs.
  const merkeWarteschlange = () => {
    try {
      const offen = zaehleOffen();
      setOffeneAenderungen(offen);
      if (offen === 0) {
        localStorage.removeItem(WARTESCHLANGE);
        return;
      }
      localStorage.setItem(WARTESCHLANGE, JSON.stringify({
        chars: Object.keys(pendingChars.current),
        items: Object.keys(pendingItems.current),
        delChars: [...pendingDeletes.current],
        delItems: [...pendingItemDel.current]
      }));
    } catch {}
  };
  const ladeWarteschlange = () => {
    try {
      const roh = JSON.parse(localStorage.getItem(WARTESCHLANGE) || 'null');
      if (!roh) return false;
      // Aus den Kennungen den heutigen Stand zusammensuchen. Was es nicht
      // mehr gibt, faellt weg — dafuer gibt es nichts mehr zu senden.
      pendingChars.current = {};
      (roh.chars || []).forEach(id => {
        const c = charsRef.current.find(x => x.id === id);
        // Nach einem Neustart weiss niemand mehr, welche Werte diese
        // Aenderung betraf. Dann gehen alle mit — die oertliche Kopie ist
        // das Letzte, was jemand gesehen hat.
        if (c) pendingChars.current[id] = {
          c: {
            ...c,
            inventory: []
          },
          vitals: [...VITAL_FELDER]
        };
      });
      pendingItems.current = {};
      (roh.items || []).forEach(k => {
        const [charId, itemId] = k.split('__');
        const c = charsRef.current.find(x => x.id === charId);
        const item = c && (c.inventory || []).find(i => i.id === itemId);
        if (item) pendingItems.current[k] = {
          charId,
          itemId,
          item
        };
      });
      pendingDeletes.current = new Set(roh.delChars || []);
      pendingItemDel.current = new Set(roh.delItems || []);
      const offen = zaehleOffen();
      pendingRef.current = offen > 0;
      setOffeneAenderungen(offen);
      return pendingRef.current;
    } catch {
      return false;
    }
  };
  const libRef = useRef({});
  const dmLibRef = useRef({});
  const isDmRef = useRef(false);
  const dmPassRef = useRef('');
  const kontoRef = useRef(null);
  const besitzerRef = useRef({});
  const advDmsRef = useRef({});
  // Welches Abenteuer gerade offen ist. Als Referenz, weil addLog weiter
  // oben steht als advId — und weil die Logzeile sonst nicht sagen
  // koennte, wohin sie gehoert.
  const advIdRef = useRef('');

  // charsRef muss synchron mitlaufen: save() difft gegen charsRef.current und
  // stellt jeden dort vorhandenen, in der neuen Liste fehlenden Charakter zur
  // Löschung auf dem Server. Eine veraltete Referenz löscht also echte Daten.
  // Deshalb nur über applyChars setzen — nie setChars(...) allein aufrufen.
  const applyChars = next => {
    charsRef.current = next;
    setChars(next);
  };

  // charsRef is set synchronously in save() and load ops — NOT via useEffect
  // selRef is updated directly in selectChar below
  useEffect(() => {
    libRef.current = userLibrary;
  }, [userLibrary]);
  useEffect(() => {
    dmLibRef.current = dmLibrary;
  }, [dmLibrary]);
  useEffect(() => {
    isDmRef.current = isDmMode;
  }, [isDmMode]);
  useEffect(() => {
    dmPassRef.current = dmPass;
  }, [dmPass]);
  useEffect(() => {
    kontoRef.current = konto;
  }, [konto]);
  useEffect(() => {
    besitzerRef.current = besitzer;
  }, [besitzer]);
  useEffect(() => {
    advDmsRef.current = advDms;
  }, [advDms]);

  // ── Wer darf was ────────────────────────────────────────────────
  // Verbunden ist, wer angemeldet ist und weiss, zu welcher Gruppe. Seit
  // Stufe 7 gibt es keinen zweiten Weg mehr — das Gruppenpasswort ist
  // abgeschaltet, und der Server nimmt es auch nicht mehr an.
  const verbunden = c => !!c.url && !!c.code && !!c.token;
  // Die Rolle des Kontos in einer Gruppe. Ohne Konto: leer — dann gilt der
  // alte Weg, und der darf alles.
  const rolleIn = (k, code) => {
    if (!k) return '';
    if (k.ist_admin) return 'admin';
    const g = (k.gruppen || []).find(x => x.session_code === code);
    return g && g.rolle || '';
  };
  const kontoIstDm = (k, code) => ['dm', 'admin'].includes(rolleIn(k, code));
  // Darf dieser Bogen ueberhaupt zum Server? Der Server entscheidet das
  // ohnehin — hier steht es nur, damit gar nicht erst gefragt wird.
  //
  // Das ist kein Schoenheitsfehler: die Anwendung raeumt beim Laden in
  // jedem Bogen auf (fehlende Felder, alte Ausruestungsformate). Ohne
  // diese Zeile ginge dieses Aufraeumen auch an fremde Boegen, kaeme
  // jedes Mal als Ablehnung zurueck, und der Spieler saehe bei jedem
  // Laden "Aenderung abgelehnt" — endlos, weil die Aenderung nie ankommt.
  const darfBogen = (c, k, karte, bes, code) => {
    if (!c) return false;
    if (!k) return true;
    if (k.ist_admin) return true;
    if (leitetAbenteuer(k, karte, code, c.adventure || '')) return true;
    const b = (bes || {})[c.id];
    return !b || b === k.id;
  };
  // Beim Speichern zaehlt der Stand von jetzt, und der steht in den
  // Referenzen — der Zustand hinkt dort um einen Durchlauf hinterher.
  const darfSchreiben = c => darfBogen(c, kontoRef.current, advDmsRef.current, besitzerRef.current, localStorage.getItem('sv_code') || '');
  // Leitet dieses Konto dieses Abenteuer? Wer dafuer eingetragen ist,
  // leitet es — gleich welche Rolle er sonst in der Gruppe hat. Wer
  // Eberron leitet, kann in Strahd mitspielen.
  //
  // Ist fuer ein Abenteuer niemand eingetragen, gilt die Rolle in der
  // Gruppe: dieselbe einseitige Regel wie beim Besitz. Eintragen grenzt
  // ein, nichts eintragen aendert nichts.
  const leitetAbenteuer = (k, karte, code, advId) => {
    if (!k) return true; // der alte Weg leitet alles
    if (k.ist_admin) return true;
    const liste = (karte || {})[advId];
    if (Array.isArray(liste) && liste.length) return liste.includes(k.id);
    return rolleIn(k, code) === 'dm';
  };
  // Die Spielleitung erreicht ihre Sachen entweder mit dem DM-Passwort
  // oder ueber ihr Konto. Wer hier steht, ist ohnehin schon im DM-Modus —
  // und ob er darf, hat der Server beim Betreten entschieden und
  // entscheidet er bei jeder Anfrage erneut. Diese Zeile verhindert nur
  // Anfragen, die gar keinen Absender haetten.
  const dmBereit = () => !!dmPassRef.current || !!kontoRef.current;

  // ── Was gerade unterwegs ist ────────────────────────────────────
  // Der Speicherlauf gibt die Warteschlange frei, sobald er sie
  // abgeschickt hat — nicht erst, wenn die Antwort da ist. In genau
  // diesem Augenblick darf der Hintergrundabgleich laufen, und er
  // bekommt vom Server noch die alten Trefferpunkte: die neuen sind ja
  // noch unterwegs. Er schrieb sie dann ueber die frisch eingetragenen.
  //
  // Das war der Grund, warum im Kampftracker eingetragener Schaden nach
  // kurzer Zeit wieder verschwand.
  //
  // Deshalb merkt sich diese Karte, wessen Trefferpunkte gerade fliegen.
  // Fuer sie laesst der Abgleich die Finger von den Werten. Die
  // Nachfrist faengt den anderen Fall: eine Abgleich-Anfrage, die schon
  // unterwegs war, bevor wir geschrieben haben, und deren Antwort erst
  // danach eintrifft.
  const imFlug = useRef(new Map()); // charId -> geschuetzt bis
  const FLUG_NACHFRIST = 2000;
  const flugAn = id => imFlug.current.set(id, Infinity);
  const flugAus = id => imFlug.current.set(id, Date.now() + FLUG_NACHFRIST);
  const fliegt = id => {
    const bis = imFlug.current.get(id);
    if (bis === undefined) return false;
    if (Date.now() < bis) return true;
    imFlug.current.delete(id);
    return false;
  };
  // Ein voller Ladevorgang ersetzt alle Boegen auf einmal. Was gerade
  // unterwegs ist oder noch in der Warteschlange steht, darf er nicht
  // mit ersetzen: der Server hat unsere Zahl noch nicht, seine Antwort
  // traegt die alte.
  //
  // Genau hier verschwand im Kampftracker eingetragener Schaden. Nicht
  // am Abgleich der Trefferpunkte — der laedt nur die vier Werte und
  // laesst die eigenen in Ruhe —, sondern am vollen Ladevorgang, den
  // dieses Geraet erst dann macht, wenn ein anderes am Tisch etwas
  // gespeichert hat. Am Spielabend ist das dauernd der Fall.
  const mitEigenen = vomServer => (vomServer || []).map(sc => {
    if (!fliegt(sc.id) && !pendingChars.current[sc.id]) return sc;
    const eigen = charsRef.current.find(c => c.id === sc.id);
    return eigen || sc;
  });

  // Auto-sync every 5 seconds in background (silent)
  // Interval sync: push localStorage to server every 3 seconds if pending
  useEffect(() => {
    const tick = async () => {
      if (!pendingRef.current) return;
      const zug = serverCreds();
      const {
        url,
        code,
        pass
      } = zug;
      if (!verbunden(zug)) return;

      // Snapshot and optimistically reset
      const toSave = {
        ...pendingChars.current
      };
      const toDelete = new Set(pendingDeletes.current);
      const toSaveI = {
        ...pendingItems.current
      };
      const toDeleteI = new Set(pendingItemDel.current);
      pendingRef.current = false;
      pendingChars.current = {};
      pendingDeletes.current = new Set();
      pendingItems.current = {};
      pendingItemDel.current = new Set();
      // Die gespeicherte Warteschlange bleibt hier absichtlich stehen. Wer
      // sie schon jetzt loeschte, verloere alles, wenn das Fenster
      // ausgerechnet waehrend des Sendens zugeht. Geleert wird sie erst,
      // wenn der Server bestaetigt hat. Ein doppelt gesendeter Eintrag
      // schadet nicht: save_char und save_item ueberschreiben denselben
      // Datensatz, und Loeschungen sind ohnehin wiederholbar.

      // Jeder Auftrag einzeln, damit ein abgelehnter nicht die anderen
      // mitreisst — und damit erkennbar bleibt, welcher es war.
      Object.values(toSave).forEach(e => flugAn(e.c.id));
      // Gesendet wird der Stand von jetzt, nicht der von damals. Zwischen
      // Einreihen und Senden koennen Sekunden liegen, und in denen kann
      // der Abgleich neuere Trefferpunkte gebracht haben — vom Kampf am
      // Tisch. Ein alter Abzug schriebe sie wieder weg, und auf jedem
      // anderen Geraet saehe es aus, als spraengen die Trefferpunkte
      // zurueck. Genau so geschah es: nicht dieses Geraet las Altes,
      // sondern ein anderes schrieb Altes.
      const frisch = e => {
        const jetzt = charsRef.current.find(x => x.id === e.c.id);
        const bogen = {
          ...(jetzt || e.c),
          inventory: []
        };
        // Was dieses Geraet nicht geaendert hat, laesst es weg. Der Server
        // behaelt dann, was dort steht.
        VITAL_FELDER.forEach(f => {
          if (!e.vitals.includes(f)) delete bogen[f];
        });
        return bogen;
      };
      const auftraege = [...Object.values(toSave).map(e => ({
        zurueck: () => {
          pendingChars.current[e.c.id] = e;
        },
        tun: () => apiSaveChar(url, code, pass, e.c.id, frisch(e))
      })), ...Object.values(toSaveI).map(o => ({
        zurueck: () => {
          pendingItems.current[o.charId + '__' + o.itemId] = o;
        },
        tun: () => apiSaveItem(url, code, pass, o.charId, o.itemId, o.item)
      })), ...[...toDelete].map(id => ({
        zurueck: () => pendingDeletes.current.add(id),
        tun: () => apiDeleteChar(url, code, pass, id)
      })), ...[...toDeleteI].map(k => {
        const [cid, iid] = k.split('__');
        return {
          zurueck: () => pendingItemDel.current.add(k),
          tun: () => apiDeleteItem(url, code, pass, cid, iid)
        };
      })];
      const ergebnisse = auftraege.length ? await Promise.allSettled(auftraege.map(a => a.tun())) : [];
      Object.values(toSave).forEach(e => flugAus(e.c.id));
      const staende = [];
      let abgelehnt = 0,
        letzterFehler = null;
      ergebnisse.forEach((e, i) => {
        if (e.status === 'fulfilled') {
          if (e.value && typeof e.value.rev === 'number') staende.push(e.value.rev);
          return;
        }
        const grund = e.reason || {};
        // 403 heisst: der Server wird das nie annehmen — ein fremder Bogen.
        // Wieder einzureihen hiesse, es jede Sekunde erneut zu versuchen
        // und die Anzeige dauerhaft auf "nicht gesichert" zu stellen. Die
        // oertliche Aenderung faellt beim naechsten Abgleich ohnehin weg.
        if (grund.status === 403) {
          abgelehnt++;
          return;
        }
        letzterFehler = grund;
        auftraege[i].zurueck();
      });
      // Jede Antwort traegt den Stand nach dem Schreiben. Ihn hier zu
      // uebernehmen heisst: der naechste Abgleich erkennt die eigene
      // Aenderung und laedt sie nicht noch einmal herunter.
      if (staende.length) revRef.current = Math.max(revRef.current || 0, ...staende);
      if (letzterFehler) pendingRef.current = true;
      // Waehrend des Wartens kann schon wieder etwas dazugekommen sein —
      // deshalb den aktuellen Stand sichern, nicht blind leeren.
      merkeWarteschlange();
      if (letzterFehler) {
        setSyncStatus('err');
        setSyncMsg(letzterFehler.message || 'Fehler');
      } else if (abgelehnt) {
        // Was der Server nicht angenommen hat, darf oertlich nicht stehen
        // bleiben — sonst sieht der Spieler eine Aenderung, die es
        // nirgends gibt, und haelt sie fuer gespeichert. Ein Stand, den
        // der Server nie vergeben kann, laesst den naechsten Abgleich den
        // echten Bogen holen.
        revRef.current = -1;
        setSyncStatus('err');
        setSyncMsg(abgelehnt === 1 ? 'Änderung abgelehnt — fremder Bogen' : abgelehnt + ' Änderungen abgelehnt — fremde Bögen');
      } else {
        setSyncStatus('ok');
        setSyncMsg('Gespeichert ✓');
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Hintergrundabgleich ─────────────────────────────────────────
  // Damit der Spieler seine Trefferpunkte fallen sieht, waehrend die
  // Spielleitung sie eintraegt. Gebaut auf der Annahme, dass sich fast
  // immer nichts geaendert hat — der Normalfall muss deshalb so gut wie
  // nichts kosten:
  //
  //   · Die Anfrage traegt eine abgeleitete Kennung statt des Passworts.
  //     bcrypt ist mit Absicht langsam und liefe sonst alle paar Sekunden
  //     auf jedem Geraet der Gruppe.
  //   · Die Antwort sind ein Zaehler und die Trefferpunkte — ein paar
  //     hundert Byte. Ein voller Ladevorgang mit allen Bildern laeuft nur,
  //     wenn sich am Bogen wirklich etwas geaendert hat.
  //   · Im Hintergrund liegendes Fenster: gar nichts. Sichtbar werden
  //     loest sofort einen Abgleich aus.
  //   · Eigene offene Aenderungen: gar nichts. Erst senden, dann fragen.
  //   · Bleibt es ruhig, wird der Abstand groesser.
  const POLL_SCHNELL = 5000,
    POLL_RUHIG = 15000,
    POLL_LEISE = 60000;
  const pollAbstand = () => ruheRef.current < 12 ? POLL_SCHNELL : ruheRef.current < 50 ? POLL_RUHIG : POLL_LEISE;

  // Die vier Werte aus der Antwort in die Charaktere schreiben. Bewusst
  // ueber applyChars und nicht ueber save: was vom Server kommt, darf
  // nicht als eigene Aenderung wieder hochgehen.
  const vitalsAnwenden = vitals => {
    if (!vitals) return false;
    let geaendert = false;
    const neu = charsRef.current.map(c => {
      const v = vitals[c.id];
      if (!v) return c;
      // Unsere eigene Aenderung ist noch unterwegs oder wartet noch: dann
      // ist die Zahl vom Server aelter als unsere, nicht neuer.
      if (fliegt(c.id) || pendingChars.current[c.id]) return c;
      const p = {};
      ['hp', 'tempHp', 'tempMaxHp'].forEach(k => {
        if (v[k] !== undefined && (+v[k] || 0) !== (+c[k] || 0)) p[k] = +v[k] || 0;
      });
      if (JSON.stringify(v.deathSaves || null) !== JSON.stringify(c.deathSaves || null)) {
        p.deathSaves = v.deathSaves;
      }
      if (!Object.keys(p).length) return c;
      geaendert = true;
      return {
        ...c,
        ...p
      };
    });
    if (geaendert) {
      applyChars(neu);
      spiegleChars(JSON.stringify(neu));
    }
    return geaendert;
  };
  useEffect(() => {
    let beendet = false,
      timer = null;
    const plan = ms => {
      if (!beendet) timer = setTimeout(lauf, ms);
    };
    const lauf = async () => {
      if (beendet) return;
      const {
        url,
        code,
        pass
      } = serverCreds();
      const tok = pollToken.current;
      // Nichts zu tun — und das ist der haeufigste Fall.
      if (!url || !code || !tok || pendingRef.current || typeof document !== 'undefined' && document.hidden) {
        plan(POLL_RUHIG);
        return;
      }
      try {
        const d = await apiPoll(url, code, tok);
        const etwasNeu = vitalsAnwenden(d.vitals);
        const revNeu = d.rev != null && revRef.current != null && d.rev !== revRef.current;
        if (revNeu) {
          // Am Bogen hat sich mehr geaendert als Trefferpunkte — jetzt
          // lohnt der volle Ladevorgang, und nur jetzt.
          revRef.current = d.rev;
          const data = await apiLoad(url, code, pass);
          if (!pendingRef.current) {
            const eigene = mitEigenen(data.chars);
            applyChars(eigene);
            spiegleChars(JSON.stringify(eigene));
            if (data.library) {
              setUserLibrary(data.library);
              setLibGeladen(true);
              safeSetItem('hb_library', JSON.stringify(data.library));
            }
          }
          if (data.rev != null) revRef.current = data.rev;
        } else if (revRef.current == null && d.rev != null) {
          revRef.current = d.rev;
        }
        ruheRef.current = etwasNeu || revNeu ? 0 : ruheRef.current + 1;
      } catch (e) {
        // Still bleiben: der Sekundentakt des Sendens meldet Fehler
        // ohnehin, und eine zweite rote Zeile fuer einen misslungenen
        // Abgleich waere nur Laerm. Aber weit zurueckschalten: gegen einen
        // Server, der nicht antwortet oder die Kennung nicht mehr kennt,
        // hilft haeufiges Fragen nichts. Ein gelungener Ladevorgang setzt
        // die Bremse wieder zurueck.
        ruheRef.current = 50;
      }
      plan(pollAbstand());
    };

    // Sichtbar werden heisst: es kann etwas verpasst worden sein.
    const wach = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        ruheRef.current = 0;
        if (timer) clearTimeout(timer);
        plan(300);
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', wach);
    plan(POLL_SCHNELL);
    return () => {
      beendet = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', wach);
    };
  }, []);

  // ── Wo man war ──────────────────────────────────────────────────
  // Ein Neuladen mitten in der Sitzung warf einen bisher auf den
  // Startschirm zurueck — offener Held weg, offener Reiter weg. Gemerkt
  // wird das im Geraet, nicht am Server: zwei Leute duerfen gleichzeitig
  // verschiedene Boegen offen haben.
  const ANSICHT = 'hb_ansicht';

  // Zuerst lesen, dann schreiben. Andersherum ueberschriebe der leere
  // Startzustand den Merker, bevor ihn jemand gelesen hat — genau das
  // hatte diesen Einbau im ersten Anlauf wirkungslos gemacht.
  useEffect(() => {
    if (ansichtGeholt.current) return;
    if (!chars.length && !gearReady) return; // noch nichts zum Wiederfinden
    ansichtGeholt.current = true;
    let a = null;
    try {
      a = JSON.parse(localStorage.getItem(ANSICHT) || 'null');
    } catch {}
    if (a) {
      if (typeof a.sidebar === 'boolean') setSidebarCollapsed(a.sidebar);
      // Nur, wenn es den Helden noch gibt und er zum offenen Abenteuer
      // gehoert — sonst landet man auf einem Bogen, der nicht dazu passt.
      const held = chars.find(c => c.id === a.sel && !c.archived && imAbenteuer(c));
      if (held) {
        selectChar(held.id);
        if (a.tab) setTab(a.tab);
        if (a.mv === 'sheet') setMv('sheet');
      }
    }
    setAnsichtBereit(true);
  }, [chars, gearReady]);
  useEffect(() => {
    if (!ansichtBereit) return;
    try {
      localStorage.setItem(ANSICHT, JSON.stringify({
        sel,
        tab,
        mv,
        sidebar: sidebarCollapsed,
        kampf: showKampf
      }));
    } catch {}
  }, [ansichtBereit, sel, tab, mv, sidebarCollapsed, showKampf]);

  // tplData only loaded when template picker opens (openTpl)

  useEffect(() => {
    const zug = serverCreds();
    const {
      url,
      code,
      pass,
      token
    } = zug;
    setSvUrl(url);
    setSvCode(code);
    setSvPass(pass);
    // Was vom alten Zugang noch im Speicher liegt, wird hier still
    // entsorgt — gebraucht wird es nicht mehr, und liegenlassen hiesse,
    // ein Passwort aufzubewahren, das niemandem mehr etwas nuetzt.
    try {
      localStorage.removeItem('sv_pass');
    } catch {}
    // Wer angemeldet ist, holt zuerst sein Konto: davon haengt ab, ob der
    // Knopf fuer die Spielleitung ueberhaupt dasteht. Faellt es aus, ist
    // die Kennung abgelaufen oder zurueckgesetzt worden — dann muss man
    // sich neu anmelden, und der Speicher darf sie nicht behalten.
    if (token) {
      apiMe(url).then(d => setKonto(d.user || null)).catch(() => {
        try {
          localStorage.removeItem('sv_token');
        } catch {}
        setKonto(null);
        setShowSetup(true);
      });
    } else {
      // Keine Kennung, kein Zugang: die Maske gleich aufmachen, statt den
      // Bogen leer dastehen zu lassen.
      setShowSetup(true);
    }
    if (verbunden(zug)) {
      // Load localStorage immediately for instant display while server loads
      try {
        const v = localStorage.getItem('dnd_chars');
        if (v) applyChars(JSON.parse(v));
      } catch {}
      try {
        const lib = localStorage.getItem('hb_library');
        if (lib) {
          setUserLibrary(JSON.parse(lib));
          setLibGeladen(true);
        }
      } catch {}
      // Offene Aenderungen der letzten Sitzung zuerst aufnehmen: sie setzen
      // pendingRef, und der Ladevorgang unten laesst die lokale Kopie dann
      // stehen, statt sie mit dem Serverstand zu ueberschreiben. Der
      // Sekundentakt schiebt sie hoch, sobald der Server antwortet.
      ladeWarteschlange();
      // Load server data on startup — but only apply if no unsaved local changes
      apiLoadChars(url, code, pass).then(d => {
        pollToken.current = d.poll_token || null;
        revRef.current = d.rev != null ? d.rev : null;
        setBesitzer(d.owners || {});
        setAdvDms(d.adv_dms || {});
        if (d.log_tage) setLogTage(d.log_tage);
        if (d.library) {
          setUserLibrary(d.library);
          setLibGeladen(true);
          safeSetItem('hb_library', JSON.stringify(d.library));
        }
        if (!pendingRef.current) {
          // No unsaved local changes — server is authoritative
          applyChars(d.chars || []);
          spiegleChars(JSON.stringify(d.chars || []));
        }
        // If pendingRef=true: local has newer unsaved data — keep it, interval will push to server
        setSyncStatus('ok');
        setSyncMsg('Verbunden ✓');
        setGearReady(true);
      }).catch(e => {
        // Kein "Lokal ✓": das las sich wie ein gelungener Speichervorgang,
        // obwohl nichts beim Server angekommen ist. Der Zustand ist ein
        // Fehler, kein Betriebsmodus — und wird auch so angezeigt.
        //
        // Gezeigt wird der Grund, den der Server nennt, nicht ein
        // geratener. "Server nicht erreichbar" stimmt nur, wenn die
        // Verbindung selbst scheitert; ein falsches Passwort oder eine
        // Absage der Datenbank sehen von hier genauso aus und wuerden
        // sonst unter der falschen Ueberschrift landen.
        const grund = e && e.message ? e.message : 'Laden fehlgeschlagen';
        console.error('[Heldenbuch] Laden fehlgeschlagen:', e);
        setSyncStatus('err');
        setSyncMsg(grund);
        setGearReady(true);
      });
    } else {
      // Ohne Gruppe wird nichts geladen. Sonst laege hinter dem
      // Anmeldefenster ein Stand, an dem man arbeiten koennte, ohne dass
      // er je irgendwo ankommt.
      setShowSetup(true);
      setGearReady(true);
    }
  }, []);

  // Beim Schliessen warnen, solange etwas aussteht. Der Browser zeigt dazu
  // seine eigene Rueckfrage; Text laesst sich nicht vorgeben.
  useEffect(() => {
    const warnen = e => {
      if (pendingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warnen);
    return () => window.removeEventListener('beforeunload', warnen);
  }, []);

  // Umstellung auf Ausruestungsplaetze, einmal je Held.
  //
  // Sie wartet den Serverstand ab: jedes Speichern setzt pendingRef, und der
  // Ladevorgang oben uebernimmt die Serverdaten nur, solange pendingRef falsch
  // ist. Liefe die Umstellung vorher, wuerde sie den lokalen Stand fest-
  // schreiben und den vom Server verwerfen — auf einem Geraet, das laenger
  // nicht offen war, waere das echter Datenverlust.
  useEffect(() => {
    if (!gearReady) return;
    const liste = charsRef.current;
    if (!liste.length) return;
    if (!liste.some(c => (c.gearMigrated || 0) < GEAR_MIGRATION)) return;
    save(liste.map(c => {
      const p = migrateGear(c);
      return p ? {
        ...c,
        ...p
      } : c;
    }));
  }, [gearReady, chars]);

  // Abenteuer anlegen und Helden zuordnen. Wie die Ausruestungsumstellung
  // wartet auch das den Serverstand ab — sonst schriebe es den lokalen
  // Stand fest und der vom Server ginge verloren.
  useEffect(() => {
    if (!gearReady) return;
    const ergebnis = advMigration(userLibrary, charsRef.current);
    if (!ergebnis) return;
    if (ergebnis.libGeaendert) saveLibrary(ergebnis.lib);
    if (ergebnis.charsGeaendert) save(ergebnis.chars);
  }, [gearReady, chars, userLibrary]);
  const saveLibrary = lib => {
    // Setzt bewusst nicht libGeladen: hier kommt auch die
    // Abenteuer-Umstellung durch, die ein Abenteuer ohne Einstellungen
    // erfindet. Das darf nicht als "Einstellungen bekannt" gelten, sonst
    // stuenden verdeckte Trefferpunkte doch wieder offen da.
    setUserLibrary(lib);
    safeSetItem('hb_library', JSON.stringify(lib));
    const zug = serverCreds();
    if (!verbunden(zug)) return;
    apiSaveLibrary(zug.url, zug.code, zug.pass, lib).catch(() => {});
  };
  const addToLibrary = (type, entry) => {
    const lib = {
      ...userLibrary
    };
    lib[type] = [...(lib[type] || [])];
    const exists = lib[type].some(e => e.name === entry.name);
    if (!exists) lib[type].push({
      ...entry,
      _custom: true
    });
    saveLibrary(lib);
  };
  const removeFromLibrary = (type, name) => {
    const lib = {
      ...userLibrary,
      [type]: (userLibrary[type] || []).filter(e => e.name !== name)
    };
    saveLibrary(lib);
  };
  const newDbEntry = type => {
    if (type === 'spell') return {
      name: '',
      level: 1,
      school: 'Hervorrufung',
      castingTime: '1 Aktion',
      range: '9 m',
      duration: 'Sofort',
      components: 'V, S',
      description: '',
      classes: [],
      damageTags: []
    };
    if (type === 'item') return {
      name: '',
      qty: 1,
      weight: '',
      rarity: 'gewöhnlich',
      description: '',
      tags: [],
      source: '',
      icon: '🎒',
      imageData: '',
      gearKind: '',
      armorType: '',
      baseAC: 0,
      acBonus: 0,
      effects: [],
      setName: ''
    };
    if (type === 'weapon') return {
      name: '',
      damage: '1W6',
      damageType: 'Hieb',
      range: '1,5 m',
      description: '',
      properties: []
    };
    // stufen: ab wie vielen getragenen Teilen welche Effekte dazukommen.
    if (type === 'set') return {
      name: '',
      description: '',
      stufen: [{
        teile: 2,
        effects: []
      }]
    };
    return {
      name: '',
      cr: '1/4',
      size: 'Mittel',
      type: 'Tier',
      ac: 10,
      hp: 10,
      speed: '9 m',
      str: 10,
      dex: 10,
      con: 10,
      int: 3,
      wis: 12,
      cha: 6,
      senses: '',
      skills: '',
      tagsStr: '',
      abilitiesStr: '',
      actions: [{
        name: '',
        desc: ''
      }]
    };
  };
  const openDbForm = (type, entry) => {
    if (!entry) {
      setDbForm(newDbEntry(type));
      setDbFormId(null);
      return;
    }
    const form = {
      ...entry
    };
    if (type === 'wildshape') {
      form.tagsStr = (entry.tags || []).join(', ');
      form.abilitiesStr = (entry.abilities || []).join('\n');
      if (!form.actions || form.actions.length === 0) form.actions = [{
        name: '',
        desc: ''
      }];
    }
    setDbForm(form);
    setDbFormId(entry.name);
  };
  const saveDbEntry = () => {
    if (!dbForm || !dbForm.name.trim()) {
      appAlert('Name darf nicht leer sein.');
      return;
    }
    let entry = {
      ...dbForm,
      _custom: true
    };
    if (dbTab === 'wildshape') {
      entry.tags = (dbForm.tagsStr || '').split(',').map(t => t.trim()).filter(Boolean);
      entry.abilities = (dbForm.abilitiesStr || '').split('\n').map(a => a.trim()).filter(Boolean);
      entry.actions = (dbForm.actions || []).filter(a => a.name.trim());
      delete entry.tagsStr;
      delete entry.abilitiesStr;
    }
    const type = dbTab;
    const editId = dbFormId;
    const finalEntry = entry;
    const updater = prev => {
      const entries = [...(prev[type] || [])];
      if (editId !== null) {
        const idx = entries.findIndex(e => e.name === editId);
        if (idx >= 0) entries[idx] = finalEntry;else entries.push(finalEntry);
      } else {
        if (entries.some(e => e.name === finalEntry.name)) {
          appAlert('Ein Eintrag mit diesem Namen existiert bereits.');
          return prev;
        }
        entries.push(finalEntry);
      }
      return {
        ...prev,
        [type]: entries
      };
    };
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (isDmMode) {
      setDmLibrary(prev => {
        const lib = updater(prev);
        apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(() => {});
        return lib;
      });
    } else {
      setUserLibrary(prev => {
        const lib = updater(prev);
        safeSetItem('hb_library', JSON.stringify(lib));
        apiSaveLibrary(url, code, pass, lib).catch(() => {});
        return lib;
      });
    }
    setDbForm(null);
    setDbFormId(null);
  };
  const deleteDbEntry = (type, name) => {
    appConfirm('"' + name + '" aus der Bibliothek löschen?', () => {
      const {
        url,
        code,
        pass
      } = serverCreds();
      if (isDmMode) {
        setDmLibrary(prev => {
          const lib = {
            ...prev,
            [type]: (prev[type] || []).filter(e => e.name !== name)
          };
          apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(() => {});
          return lib;
        });
      } else {
        setUserLibrary(prev => {
          const lib = {
            ...prev,
            [type]: (prev[type] || []).filter(e => e.name !== name)
          };
          safeSetItem('hb_library', JSON.stringify(lib));
          apiSaveLibrary(url, code, pass, lib).catch(() => {});
          return lib;
        });
      }
    });
  };
  const doSyncLoad = async (url, code, pass) => {
    setSyncStatus('busy');
    setSyncMsg('Lade vom Server...');
    try {
      const data = await apiLoad(url, code, pass);
      pollToken.current = data.poll_token || null;
      revRef.current = data.rev != null ? data.rev : null;
      ruheRef.current = 0;
      // User explicitly requested reload — always apply server data
      pendingRef.current = false; // cancel any pending local saves
      applyChars(data.chars || []);
      spiegleChars(JSON.stringify(data.chars || []));
      if (data.library) {
        setUserLibrary(data.library);
        setLibGeladen(true);
        safeSetItem('hb_library', JSON.stringify(data.library));
      }
      setBesitzer(data.owners || {});
      setAdvDms(data.adv_dms || {});
      if (data.log_tage) setLogTage(data.log_tage);
      setSyncStatus('ok');
      setSyncMsg('Geladen ✓');
    } catch (e) {
      setSyncStatus('err');
      setSyncMsg(e.message);
    }
  };

  // Wer in der Gruppe ist. Gebraucht wird das an zwei Stellen: beim
  // Betreten des DM-Bereichs und in den Einstellungen eines Abenteuers.
  // Die Verwaltung kommt in die Einstellungen, ohne vorher in den
  // DM-Modus zu wechseln — dann war die Liste leer, und das Fenster
  // behauptete, in der Gruppe habe niemand ein Konto.
  const mitgliederLaden = async dm => {
    const {
      url,
      code,
      pass
    } = serverCreds();
    try {
      const m = await apiMitglieder(url, code, pass, dm !== undefined ? dm : dmPassRef.current);
      setMitglieder(Array.isArray(m.mitglieder) ? m.mitglieder : []);
      return true;
    } catch (e) {
      setMitglieder([]);
      return false;
    }
  };

  // Der DM-Bereich, geoeffnet mit dem DM-Passwort oder — wer angemeldet
  // ist und die Rolle hat — mit einer leeren Zeichenkette. Der Server
  // entscheidet; hier steht nur, was mitgeschickt wird.
  const dmLaden = async dm => {
    {
      const {
        url,
        code,
        pass
      } = serverCreds();
      const data = await apiDmLoad(url, code, pass, dm);
      setDmLibrary(data.dm_library || {});
      setDmPass(dm);
      setIsDmMode(true);
      // Gegner kommen aus einer eigenen Tabelle und nur fuer die
      // Spielleitung. Faellt der Abruf aus, bleibt der DM-Modus trotzdem
      // nutzbar — die Gegnerliste sagt dann, dass sie nicht geladen ist.
      try {
        const [g, b] = await Promise.all([apiDmLoadEnemies(url, code, pass, dm), apiDmLoadEncounters(url, code, pass, dm)]);
        setEnemies(Array.isArray(g.enemies) ? g.enemies : []);
        setEncounters(Array.isArray(b.encounters) ? b.encounters : []);
        setEnemiesGeladen(true);
      } catch (e) {
        setEnemies([]);
        setEncounters([]);
        setEnemiesGeladen(false);
        console.error('[Heldenbuch] Gegner konnten nicht geladen werden:', e);
      }
      await mitgliederLaden(dm);
      // Eigener Versuch: faellt die Chronik aus, bleibt die Gegnerliste
      // trotzdem geladen. Sie haengen sachlich nicht zusammen.
      try {
        const ch = await apiDmLoadChronik(url, code, pass, dm);
        setChronik(ch.chronik && typeof ch.chronik === 'object' ? {
          zeit: ch.chronik.zeit || {},
          ereignisse: ch.chronik.ereignisse || []
        } : {
          zeit: {},
          ereignisse: []
        });
      } catch (e) {
        setChronik({
          zeit: {},
          ereignisse: []
        });
        console.error('[Heldenbuch] Chronik konnte nicht geladen werden:', e);
      }
      // Der Kampfschirm braucht den DM-Modus und kann deshalb erst hier
      // zurueckkommen. Nur, wenn ein Kampf laeuft und er vorher offen war
      // — wer ihn zugeklappt hat, will ihn nicht wiederhaben.
      try {
        const a = JSON.parse(localStorage.getItem(ANSICHT) || 'null');
        if (a && a.kampf && kampf) setShowKampf(true);
      } catch {}
    }
  };

  // Wer als Spielleitung angemeldet ist, braucht kein zweites Passwort.
  const dmMitKonto = async () => {
    try {
      await dmLaden('');
    } catch (e) {
      appAlert('Der DM-Bereich ließ sich nicht öffnen: ' + (e.message || ''));
    }
  };

  // Einen Bogen einem Konto zuordnen — oder die Zuordnung aufheben.
  // Danach steht der Besitz auch oertlich richtig, ohne alles neu zu laden.
  // Wer ein Abenteuer leitet, bestimmt die Verwaltung.
  const advDmSetzen = async (advId2, userIds) => {
    const {
      url,
      code
    } = serverCreds();
    try {
      const a = await apiAdvDmSetzen(url, code, advId2, userIds);
      setAdvDms(a.adv_dms || {});
    } catch (e) {
      appAlert('Das ging nicht: ' + (e.message || ''));
    }
  };
  const besitzerSetzen = async (charId, userId) => {
    const {
      url,
      code,
      pass
    } = serverCreds();
    try {
      await apiBesitzerSetzen(url, code, pass, dmPassRef.current, charId, userId || null);
      setBesitzer(b => {
        const n = {
          ...b
        };
        if (userId) n[charId] = +userId;else delete n[charId];
        return n;
      });
    } catch (e) {
      appAlert('Die Zuordnung ging nicht: ' + (e.message || ''));
    }
  };
  const doDmLogout = () => {
    setIsDmMode(false);
    setDmPass('');
    setDmLibrary({});
    // Nichts von der Spielleitung bleibt im Speicher zurueck, wenn jemand
    // das Geraet weiterreicht.
    setEnemies([]);
    setEncounters([]);
    setEnemiesGeladen(false);
    setMitglieder([]);
    setChronik({
      zeit: {},
      ereignisse: []
    });
    setShowChronik(false);
    setEreignisForm(null);
    setZeitOffen(false);
    setAdvEinstellung(null);
  };

  // Einmaliges Einlesen einer Sammlung aus einer JSON-Datei. Geht in einem
  // Zug zum Server statt in 360 Einzelanfragen — das waere langsam und
  // wuerde die Anfragebremse reizen.
  const importEnemies = async datei => {
    if (!datei) return;
    setEnemyImportBusy(true);
    try {
      const text = await datei.text();
      const liste = JSON.parse(text);
      if (!Array.isArray(liste)) throw new Error('Die Datei enthält keine Liste.');
      const brauchbar = liste.filter(e => e && e.id && e.name);
      if (!brauchbar.length) throw new Error('Kein Eintrag mit Kennung und Namen gefunden.');
      const {
        url,
        code,
        pass
      } = serverCreds();
      const antwort = await apiDmImportEnemies(url, code, pass, dmPassRef.current, brauchbar);
      const g = await apiDmLoadEnemies(url, code, pass, dmPassRef.current);
      setEnemies(Array.isArray(g.enemies) ? g.enemies : []);
      setEnemiesGeladen(true);
      const uebersprungen = liste.length - brauchbar.length + (antwort.skipped || 0);
      appAlert(antwort.imported + ' Gegner eingelesen.' + (uebersprungen ? ' ' + uebersprungen + ' übersprungen (ohne Kennung oder zu groß).' : ''));
    } catch (err) {
      appAlert('Einlesen fehlgeschlagen: ' + (err.message || 'unbekannter Fehler'));
    }
    setEnemyImportBusy(false);
  };

  // ── Gegner ──────────────────────────────────────────────────────
  // Jeder Gegner wird einzeln gespeichert. Fehler werden gezeigt statt
  // verschluckt: eine stille Absage saehe aus wie ein gelungenes Speichern.
  const saveEnemy = async e => {
    if (!e || !e.id) return false;
    setEnemies(list => list.some(x => x.id === e.id) ? list.map(x => x.id === e.id ? e : x) : [...list, e]);
    const {
      url,
      code,
      pass
    } = serverCreds();
    try {
      await apiDmSaveEnemy(url, code, pass, dmPassRef.current, e.id, e);
      return true;
    } catch (err) {
      appAlert('Gegner konnte nicht gespeichert werden: ' + (err.message || 'unbekannter Fehler'));
      return false;
    }
  };
  const saveEncounter = async b => {
    if (!b || !b.id) return false;
    setEncounters(list => list.some(x => x.id === b.id) ? list.map(x => x.id === b.id ? b : x) : [...list, b]);
    const {
      url,
      code,
      pass
    } = serverCreds();
    try {
      await apiDmSaveEncounter(url, code, pass, dmPassRef.current, b.id, b);
      return true;
    } catch (err) {
      appAlert('Begegnung konnte nicht gespeichert werden: ' + (err.message || 'unbekannter Fehler'));
      return false;
    }
  };
  const deleteEncounter = b => appConfirm('Begegnung „' + (b.name || '') + '“ löschen?', async () => {
    const vorher = encounters;
    setEncounters(list => list.filter(x => x.id !== b.id));
    const {
      url,
      code,
      pass
    } = serverCreds();
    try {
      await apiDmDeleteEncounter(url, code, pass, dmPassRef.current, b.id);
    } catch (err) {
      setEncounters(vorher);
      appAlert('Begegnung konnte nicht gelöscht werden: ' + (err.message || 'unbekannter Fehler'));
    }
  }, 'Löschen');
  const deleteEnemy = id => appConfirm('Gegner wirklich löschen?', async () => {
    const vorher = enemies;
    setEnemies(list => list.filter(x => x.id !== id));
    const {
      url,
      code,
      pass
    } = serverCreds();
    try {
      await apiDmDeleteEnemy(url, code, pass, dmPassRef.current, id);
    } catch (err) {
      setEnemies(vorher); // nicht so tun, als waere er weg
      appAlert('Gegner konnte nicht gelöscht werden: ' + (err.message || 'unbekannter Fehler'));
    }
  }, 'Löschen');

  // ── Chronik ─────────────────────────────────────────────────────
  // Wie bei den Gegnern: ein Fehlschlag wird gezeigt, nicht verschluckt.
  // Eine stille Absage saehe aus wie ein gelungenes Speichern, und die
  // naechste Sitzung faenge dann am falschen Tag an.
  // Der Kampftracker schreibt sofort in den Bogen, nicht erst am Ende.
  // Dieselbe Warteschlange wie jede andere Aenderung, damit die Anzeige
  // "N nicht gesichert" stimmt und nichts an ihr vorbeigeht.
  const heldImKampfAendern = (charId, patch, name) => {
    const vorher = charsRef.current.find(c => c.id === charId);
    if (!vorher) return;
    save(charsRef.current.map(c => c.id === charId ? {
      ...c,
      ...patch
    } : c), true);
    // Ins Log kommen nur die beiden Augenblicke, die man spaeter
    // nachlesen will. Jeder einzelne Treffer waere eine Zeile, und nach
    // einem Kampf stuenden dreissig davon im Abenteuerlog.
    const alt = +vorher.hp || 0,
      neu = patch.hp;
    if (neu !== undefined && alt > 0 && neu <= 0) {
      addLog(charId, name || vorher.name, 'charakter', 'Bei 0 Trefferpunkten', {
        kampf: kampf && kampf.name || undefined
      });
    } else if (neu !== undefined && alt <= 0 && neu > 0) {
      addLog(charId, name || vorher.name, 'charakter', 'Wieder auf den Beinen: ' + neu + ' TP', {
        kampf: kampf && kampf.name || undefined
      });
    }
  };
  const saveChronik = ch => {
    setChronik(ch);
    chronikMerkmaleAbgleichen(ch);
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!verbunden(serverCreds()) || !dmBereit()) return;
    apiDmSaveChronik(url, code, pass, dmPassRef.current, ch).catch(err => appAlert('Chronik konnte nicht gespeichert werden: ' + (err.message || 'unbekannter Fehler')));
  };

  // Die Chronik-Merkmale werden nicht gesetzt und irgendwann wieder
  // entfernt, sondern nach jeder Aenderung neu abgeleitet. Was abgeleitet
  // wird, kann nicht haengenbleiben — und ein zurueckgedrehter Tag bringt
  // den Fluch von selbst zurueck.
  const chronikMerkmaleAbgleichen = ch => {
    const soll = chronikMerkmale(ch, advId);
    const dazu = [],
      weg = [];
    let geaendert = false;
    const neu = charsRef.current.map(c => {
      // Nur Helden des offenen Abenteuers: die Uhr eines anderen Abenteuers
      // sagt ueber sie nichts aus, und ihre Merkmale duerfen nicht fallen.
      if ((c.adventure || '') !== advId) return c;
      const alt = (c.features || []).filter(istChronikMerkmal);
      const neuF = soll[c.id] || [];
      if (JSON.stringify(alt) === JSON.stringify(neuF)) return c;
      geaendert = true;
      neuF.filter(f => !alt.some(a => a.id === f.id)).forEach(f => dazu.push({
        c,
        f
      }));
      alt.filter(f => !neuF.some(n2 => n2.id === f.id)).forEach(f => weg.push({
        c,
        f
      }));
      return {
        ...c,
        features: [...(c.features || []).filter(f => !istChronikMerkmal(f)), ...neuF]
      };
    });
    if (!geaendert) return;
    save(neu);
    dazu.forEach(({
      c,
      f
    }) => addLog(c.id, c.name, 'attribute', 'Aus der Chronik: ' + f.name, {
      wirkt: 'ab jetzt'
    }));
    weg.forEach(({
      c,
      f
    }) => addLog(c.id, c.name, 'attribute', 'Aus der Chronik beendet: ' + f.name));
  };
  const chronikUmschalten = () => setShowChronik(v => {
    try {
      localStorage.setItem('hb_chronik_offen', v ? '0' : '1');
    } catch {}
    return !v;
  });
  const chronikJetzt = () => zeitDerUhr(chronik, advId);
  const ereignisSpeichern = e => {
    const liste = chronik.ereignisse || [];
    saveChronik({
      ...chronik,
      ereignisse: liste.some(x => x.id === e.id) ? liste.map(x => x.id === e.id ? e : x) : [...liste, e]
    });
    setEreignisForm(null);
  };
  const ereignisLoeschen = e => appConfirm('Ereignis „' + (e.name || '') + '“ löschen?', () => {
    saveChronik({
      ...chronik,
      ereignisse: (chronik.ereignisse || []).filter(x => x.id !== e.id)
    });
  }, 'Löschen');
  // Abhaken heisst nur "zur Kenntnis genommen". Es schreibt nichts in
  // fremde Boegen — das tut allein das Zeitfenster, und dort ausdruecklich.
  const ereignisAbhaken = e => {
    const jetzt = chronikJetzt();
    saveChronik({
      ...chronik,
      ereignisse: (chronik.ereignisse || []).map(x => {
        if (x.id !== e.id) return x;
        if (x.wiederholung > 0 && x.faellig != null) {
          let f = x.faellig;
          while (f <= jetzt) f += x.wiederholung;
          return {
            ...x,
            faellig: f
          };
        }
        return {
          ...x,
          erledigt: true,
          erledigtBei: x.faellig != null ? x.faellig : jetzt
        };
      })
    });
  };
  const ereignisWiederOeffnen = e => saveChronik({
    ...chronik,
    ereignisse: (chronik.ereignisse || []).map(x => x.id === e.id ? {
      ...x,
      erledigt: false
    } : x)
  });
  const uhrStellen = stunde => saveChronik({
    ...chronik,
    zeit: {
      ...(chronik.zeit || {}),
      [advId]: Math.max(0, stunde)
    }
  });

  // Die Uhr weiterdrehen. Faellige Ereignisse werden abgelegt oder — wenn
  // sie sich wiederholen — auf den naechsten Termin gesetzt. Die Merkmale
  // gehen denselben Speicherweg wie jede andere Aenderung am Bogen.
  const zeitAnwenden = (delta, feuert, bindungen) => {
    const jetzt = chronikJetzt();
    const nachher = jetzt + delta;
    const gefeuert = new Set(feuert.map(e => e.id));
    const ereignisse = (chronik.ereignisse || []).map(e => {
      if (!gefeuert.has(e.id)) return e;
      if (e.wiederholung > 0 && e.faellig != null) {
        let f = e.faellig;
        while (f <= nachher) f += e.wiederholung;
        return {
          ...e,
          faellig: f
        };
      }
      return {
        ...e,
        erledigt: true,
        erledigtBei: e.faellig
      };
    });
    saveChronik({
      ...chronik,
      zeit: {
        ...(chronik.zeit || {}),
        [advId]: nachher
      },
      ereignisse
    });
    if (bindungen && bindungen.length) {
      save(charsRef.current.map(c => {
        const treffer = bindungen.filter(b => b.charId === c.id);
        if (!treffer.length) return c;
        return {
          ...c,
          features: (c.features || []).map(f => {
            const b = treffer.find(x => x.featureId === f.id);
            return b ? {
              ...f,
              effectsActive: b.wirkung === 'an'
            } : f;
          })
        };
      }));
      // Im Abenteuerlog nachvollziehbar: es sind fremde Boegen.
      bindungen.forEach(b => addLog(b.charId, b.charName, 'attribute', 'Merkmal ' + (b.wirkung === 'an' ? 'eingeschaltet' : 'abgeschaltet') + ': ' + b.featureName, {
        ereignis: b.ereignis || undefined,
        tag: uhrTag(nachher)
      }));
    }
  };

  // ── Notizen der Spielleitung zu den Helden ────────────────────
  // Sie lagen bis v4.1 im Kampf und waren mit ihm weg. Jetzt liegen sie in
  // der DM-Bibliothek: dort ueberstehen sie das Kampfende, den Neustart und
  // den Geraetewechsel — und sie sind, anders als ein Feld im Bogen, auch
  // auf dem Server hinter dem DM-Passwort. Ein Spieler bekommt sie nie zu
  // sehen, nicht einmal in der Antwort des Servers.
  //
  // Beim Tippen wird nicht gespeichert: die Bibliothek geht als ein Stueck
  // hoch, und das je Tastendruck waere teuer. Stattdessen kurz nach dem
  // letzten Zeichen und beim Verlassen des Feldes.
  const notizTimer = useRef(null);
  const heldNotizSichern = () => {
    if (notizTimer.current) {
      clearTimeout(notizTimer.current);
      notizTimer.current = null;
    }
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!verbunden(serverCreds()) || !dmBereit()) return;
    apiDmSaveLibrary(url, code, pass, dmPassRef.current, dmLibRef.current).catch(() => {});
  };
  const heldNotizSetzen = (charId, text) => {
    // Funktional, damit zwei Notizen im selben Durchlauf einander nicht
    // ueberschreiben — beim einmaligen Uebernehmen alter Kampfnotizen
    // kommen sie genau so.
    setDmLibrary(prev => {
      const notizen = {
        ...(prev && prev.heldNotizen || {})
      };
      if (text) notizen[charId] = text;else delete notizen[charId];
      return {
        ...(prev || {}),
        heldNotizen: notizen
      };
    });
    if (notizTimer.current) clearTimeout(notizTimer.current);
    notizTimer.current = setTimeout(heldNotizSichern, 900);
  };
  // Was noch im Zeitgeber haengt, geht beim Verlassen der Seite trotzdem raus.
  useEffect(() => {
    const raus = () => {
      if (notizTimer.current) heldNotizSichern();
    };
    window.addEventListener('pagehide', raus);
    return () => {
      window.removeEventListener('pagehide', raus);
      raus();
    };
  }, []);
  const saveDmLibrary = lib => {
    setDmLibrary(lib);
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!verbunden(serverCreds()) || !dmBereit()) return;
    apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(() => {});
  };

  // vomNutzer sagt, ob dahinter ein Klick steht. Nur dann wird ein
  // abgewiesener Bogen gemeldet: das Aufraeumen beim Laden geht ueber
  // dieselbe Stelle, und dessen Abweisungen sind kein Ereignis.
  const save = (u, vomNutzer) => {
    const prev = charsRef.current;
    applyChars(u);
    let verweigert = 0;
    const prevMap = new Map(prev.map(c => [c.id, c]));
    const newMap = new Map(u.map(c => [c.id, c]));
    for (const [charId, c] of newMap) {
      const prevC = prevMap.get(charId);
      // Diff inventory separately
      // Was ohnehin abgelehnt wuerde, wird gar nicht erst eingereiht.
      if (!darfSchreiben(c)) {
        if (JSON.stringify({
          ...c,
          inventory: []
        }) !== JSON.stringify(prevC ? {
          ...prevC,
          inventory: []
        } : null)) verweigert++;
        continue;
      }
      const prevInv = new Map((prevC?.inventory || []).map(i => [i.id, i]));
      const newInv = new Map((c.inventory || []).map(i => [i.id, i]));
      for (const [itemId, item] of newInv) {
        if (JSON.stringify(item) !== JSON.stringify(prevInv.get(itemId))) {
          pendingItems.current[charId + '__' + itemId] = {
            charId,
            itemId,
            item
          };
          pendingItemDel.current.delete(charId + '__' + itemId);
        }
      }
      for (const [itemId] of prevInv) {
        if (!newInv.has(itemId)) {
          pendingItemDel.current.add(charId + '__' + itemId);
          delete pendingItems.current[charId + '__' + itemId];
        }
      }
      // Diff char without inventory
      const cNoInv = {
        ...c,
        inventory: []
      };
      const prevNoInv = prevC ? {
        ...prevC,
        inventory: []
      } : null;
      if (JSON.stringify(cNoInv) !== JSON.stringify(prevNoInv)) {
        // Welche der vier Werte, die sich im Kampf im Sekundentakt
        // aendern, hat dieses Geraet angefasst? Nur die gehen mit. Alles
        // andere waere ein Echo: ein Stand von vor ein paar Sekunden, der
        // die Zahl eines anderen ueberschreibt.
        const vitalNeu = VITAL_FELDER.filter(f => JSON.stringify(c[f]) !== JSON.stringify(prevC ? prevC[f] : undefined));
        const alt = pendingChars.current[charId];
        pendingChars.current[charId] = {
          c: cNoInv,
          // Was schon wartete, bleibt gemerkt: sonst ginge eine Aenderung
          // verloren, die vor dieser eingereiht wurde.
          vitals: [...new Set([...(alt && alt.vitals || []), ...vitalNeu])]
        };
        pendingDeletes.current.delete(charId);
      }
    }
    for (const [id, alt] of prevMap) {
      if (!newMap.has(id)) {
        if (!darfSchreiben(alt)) continue;
        pendingDeletes.current.add(id);
        delete pendingChars.current[id];
      }
    }

    // Ein Bogen, den der Server nicht annehmen wuerde, wird nicht
    // eingereiht — aber stillschweigend faellt er nur beim Aufraeumen
    // weg. Steht ein Klick dahinter, gehoert es gesagt: sonst sieht man
    // "Gespeichert ✓" und die Aenderung ist trotzdem gleich wieder da.
    if (verweigert && vomNutzer) {
      setSyncStatus('err');
      setSyncMsg(verweigert === 1 ? 'Nicht erlaubt — fremder Bogen' : verweigert + ' Änderungen nicht erlaubt');
      return;
    }
    pendingRef.current = true;
    spiegleChars(JSON.stringify(u));
    merkeWarteschlange();
    setSyncStatus('busy');
    setSyncMsg('Speichert...');
  };

  // Aendert den ausgewaehlten Helden. fn bekommt ihn und liefert die Felder,
  // die sich aendern sollen. Ersetzt 35 gleichlautende Aufrufe, in denen
  // charsRef und selRef jedes Mal von Hand ausgeschrieben waren — und damit
  // 35 Gelegenheiten, versehentlich den veralteten Zustand statt der Referenz
  // zu lesen. Genau daran hing der Datenverlust-Fehler.
  const patchCurrent = fn => save(charsRef.current.map(c => c.id === selRef.current ? {
    ...c,
    ...fn(c)
  } : c), true);

  // Logging helper — fire-and-forget, never blocks UI
  const addLog = (charId, charName, tab, action, details) => {
    const {
      url,
      code,
      pass,
      token
    } = serverCreds();
    if (!verbunden({
      url,
      code,
      pass,
      token
    })) return;
    const entry = {
      char_id: charId,
      char_name: charName,
      tab,
      action,
      details,
      adv_id: advIdRef.current || undefined
    };
    apiSaveLog(url, code, pass, entry).catch(() => {});
  };

  // Anmelden mit einem Konto. Der Gruppencode kommt aus dem Konto selbst
  // — es weiss, zu welchen Gruppen es gehoert. Angeben muss man ihn nur,
  // wenn es mehrere sind oder wenn man die Verwaltung ist und in eine
  // Gruppe will, in der man nicht Mitglied ist.
  // Das allererste Konto. Der Server laesst es ohne Anmeldung anlegen,
  // aber nur solange es ueberhaupt keines gibt und nur unter dem Namen aus
  // der config.php — sonst machte sich der erste Besucher zum Admin.
  // Danach legt die Verwaltung die Konten an.
  //
  // Ohne diesen Knopf war der Server in der Lage dazu und die Anwendung
  // bot es nirgends an: anmelden konnte sich niemand, weil es nichts gab,
  // womit man sich anmelden koennte.
  const erstesKontoAnlegen = async () => {
    const url = serverCreds().url;
    const name = (setupForm.name || '').trim();
    const pw = setupForm.pass || '';
    if (!name || !pw) {
      setSetupErr('Bitte Name und Passwort angeben.');
      return;
    }
    if (pw.length < 6) {
      setSetupErr('Das Passwort braucht mindestens sechs Zeichen.');
      return;
    }
    setSetupBusy(true);
    setSetupErr('');
    try {
      await apiKontoNeu(url, name, pw, true);
    } catch (e) {
      setSetupBusy(false);
      setSetupErr(e.status === 401 ? 'Es gibt schon Konten — dann legt sie die Verwaltung an, nicht diese Maske.' : e.message);
      return;
    }
    setSetupBusy(false);
    // Angelegt ist angemeldet: derselbe Weg wie sonst auch.
    await applyKontoSetup();
  };
  const applyKontoSetup = async () => {
    const url = serverCreds().url;
    const name = (setupForm.name || '').trim();
    const pw = setupForm.pass || '';
    if (!url) {
      setSetupErr('Die Adresse des Servers lässt sich hier nicht ermitteln.');
      return;
    }
    if (!name || !pw) {
      setSetupErr('Bitte Name und Passwort angeben.');
      return;
    }
    // Der Wechsel holt den Stand vom Server und ersetzt damit die oertliche
    // Kopie. Was noch nicht oben ist, waere weg.
    if (pendingRef.current) {
      const n = zaehleOffen();
      setSetupErr((n === 1 ? 'Eine Änderung wartet' : n + ' Änderungen warten') + ' noch auf den Server. Warte, bis oben „Gespeichert ✓“ steht.');
      return;
    }
    setSetupBusy(true);
    setSetupErr('');
    try {
      const an = await apiLogin(url, name, pw);
      localStorage.setItem('sv_token', an.token || '');
      const k = an.user || null;
      // Welche Gruppe. Sie steht am Konto und wird nicht mehr abgefragt:
      // die zuletzt benutzte, wenn sie noch dazugehoert, sonst die erste.
      // Die Verwaltung gehoert zu keiner und darf in jede — fuer sie
      // zaehlt die Liste aller Gruppen, die der Server mitschickt.
      const meine = (k && k.gruppen || []).map(g => g.session_code);
      const offen = k && k.ist_admin ? k.alle_gruppen || [] : [];
      const moeglich = meine.length ? meine : offen;
      const zuletzt = (localStorage.getItem('sv_code') || '').toUpperCase();
      const gcode = zuletzt && moeglich.includes(zuletzt) ? zuletzt : moeglich[0] || '';
      if (!gcode) {
        localStorage.removeItem('sv_token');
        throw new Error(k && k.ist_admin ? 'Es gibt noch keine Gruppe. Leg unter 🛠 Verwaltung eine an.' : 'Dein Konto gehört zu keiner Gruppe. Die Verwaltung muss dich aufnehmen.');
      }
      // Das Gruppenpasswort gibt es hier nicht — die Kennung ersetzt es.
      const data = await apiLoadChars(url, gcode, '');
      pollToken.current = data.poll_token || null;
      revRef.current = data.rev != null ? data.rev : null;
      localStorage.setItem('sv_code', gcode);
      localStorage.removeItem('sv_pass');
      setKonto(k);
      setSvUrl(url);
      setSvCode(gcode);
      setSvPass('');
      applyChars(data.chars || []);
      pendingRef.current = false;
      spiegleChars(JSON.stringify(data.chars || []));
      if (data.library) {
        setUserLibrary(data.library);
        setLibGeladen(true);
        safeSetItem('hb_library', JSON.stringify(data.library));
      }
      setBesitzer(data.owners || {});
      setAdvDms(data.adv_dms || {});
      if (data.log_tage) setLogTage(data.log_tage);
      setSyncStatus('ok');
      setSyncMsg('Angemeldet ✓');
      setShowSetup(false);
      // Ein Einmalpasswort gilt genau bis hierher.
      if (k && k.muss_wechseln) setPasswortDlg({
        alt: pw,
        neu: '',
        neu2: '',
        err: '',
        pflicht: true
      });
    } catch (e) {
      localStorage.removeItem('sv_token');
      setSetupErr(e.message);
    }
    setSetupBusy(false);
  };

  // Was ueber mich gespeichert ist — und die Moeglichkeit, es
  // mitzunehmen. Das Unangenehme an einem Protokoll ist selten das
  // Protokoll; es ist, ueberrascht davon zu erfahren.
  const kontoOeffnen = async () => {
    setKontoDlg({
      daten: null,
      laedt: true,
      err: ''
    });
    try {
      const d = await apiMeineDaten(serverCreds().url);
      setKontoDlg({
        daten: d,
        laedt: false,
        err: ''
      });
    } catch (e) {
      setKontoDlg({
        daten: null,
        laedt: false,
        err: e.message
      });
    }
  };
  const meineDatenSichern = () => {
    if (!kontoDlg || !kontoDlg.daten) return;
    try {
      const blob = new Blob([JSON.stringify(kontoDlg.daten, null, 2)], {
        type: 'application/json'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'heldenbuch-meine-daten.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) {
      appAlert('Das Speichern ging nicht: ' + (e.message || ''));
    }
  };
  const logFristSetzen = async tage => {
    const {
      url,
      code
    } = serverCreds();
    try {
      const a = await apiLogFrist(url, code, tage);
      setLogTage(a.tage || 180);
    } catch (e) {
      appAlert('Das ging nicht: ' + (e.message || ''));
    }
  };

  // ── Verwaltung ──────────────────────────────────────────────────
  // Einmalpasswoerter werden hier erzeugt und einmal angezeigt. Der
  // Server speichert nur ihren Hash; wer es nicht weitergibt, muss neu
  // zuruecksetzen. Ohne mehrdeutige Zeichen — das Ding wird abgetippt
  // oder vorgelesen.
  const einmalPasswort = () => {
    const zeichen = 'abcdefghijkmnpqrstuvwxyz23456789';
    const roh = new Uint32Array(12);
    (window.crypto || window.msCrypto).getRandomValues(roh);
    return [...roh].map(n => zeichen[n % zeichen.length]).join('');
  };
  const verwaltungLaden = async () => {
    setVerwaltung(v => ({
      ...(v || {}),
      laedt: true,
      err: ''
    }));
    try {
      const d = await apiKontoListe(serverCreds().url);
      setVerwaltung(v => ({
        ...(v || {}),
        laedt: false,
        err: '',
        users: d.users || [],
        mitglied: d.mitglied || [],
        adminUser: d.admin_user || ''
      }));
    } catch (e) {
      setVerwaltung(v => ({
        ...(v || {}),
        laedt: false,
        err: e.message
      }));
    }
  };
  const verwaltungOeffnen = () => {
    setKontoDlg(null);
    setVerwaltung({
      laedt: true,
      users: [],
      mitglied: [],
      err: '',
      neuName: '',
      gezeigt: null
    });
    verwaltungLaden();
  };
  const gruppeAnlegen = async () => {
    const name = (verwaltung && verwaltung.neueGruppe || '').trim().toUpperCase();
    if (!/^[A-Za-z0-9_\-]{3,20}$/.test(name)) {
      setVerwaltung(v => ({
        ...v,
        err: 'Der Code braucht 3 bis 20 Zeichen: Buchstaben, Zahlen, - und _.'
      }));
      return;
    }
    try {
      // Das Gruppenpasswort ist kein Zugang mehr. Es ankert nur die
      // Kennung des Hintergrundabgleichs — also wuerfeln und vergessen.
      await apiGruppeNeu(serverCreds().url, name, einmalPasswort() + einmalPasswort());
      setVerwaltung(v => ({
        ...v,
        neueGruppe: '',
        err: '',
        gezeigt: {
          name,
          pw: '—',
          was: 'als Gruppe angelegt'
        }
      }));
      const m = await apiMe(serverCreds().url);
      setKonto(m.user || null);
    } catch (e) {
      setVerwaltung(v => ({
        ...v,
        err: e.message
      }));
    }
  };
  const kontoAnlegen = async () => {
    const name = (verwaltung && verwaltung.neuName || '').trim();
    if (name.length < 3) {
      setVerwaltung(v => ({
        ...v,
        err: 'Der Name braucht mindestens drei Zeichen.'
      }));
      return;
    }
    const pw = einmalPasswort();
    try {
      await apiKontoNeu(serverCreds().url, name, pw, false);
      setVerwaltung(v => ({
        ...v,
        neuName: '',
        err: '',
        gezeigt: {
          name,
          pw,
          was: 'angelegt'
        }
      }));
      verwaltungLaden();
    } catch (e) {
      setVerwaltung(v => ({
        ...v,
        err: e.message
      }));
    }
  };
  const kontoZuruecksetzen = u => appConfirm('Für „' + u.name + '“ ein neues Einmalpasswort erzeugen? Das bisherige gilt dann nicht mehr, ' + 'und alle offenen Anmeldungen dieses Kontos enden.', async () => {
    const pw = einmalPasswort();
    try {
      await apiKontoReset(serverCreds().url, u.id, pw);
      setVerwaltung(v => ({
        ...v,
        err: '',
        gezeigt: {
          name: u.name,
          pw,
          was: 'zurückgesetzt'
        }
      }));
      verwaltungLaden();
    } catch (e) {
      setVerwaltung(v => ({
        ...v,
        err: e.message
      }));
    }
  }, 'Zurücksetzen');
  const kontoEntfernen = u => appConfirm('„' + u.name + '“ endgültig löschen? Die Bögen dieses Kontos bleiben und gehören danach ' + 'niemandem; die Zeilen im Abenteuerlog bleiben stehen und verlieren nur die Kennung.', async () => {
    try {
      await apiKontoLoeschen(serverCreds().url, u.id);
      verwaltungLaden();
    } catch (e) {
      setVerwaltung(v => ({
        ...v,
        err: e.message
      }));
    }
  }, 'Löschen');
  const rolleSetzen = async (u, rolle) => {
    try {
      await apiRolleSetzen(serverCreds().url, u.id, svCode, rolle);
      verwaltungLaden();
      // Die eigene Rolle kann sich mitgeaendert haben.
      try {
        const m = await apiMe(serverCreds().url);
        setKonto(m.user || null);
      } catch {}
    } catch (e) {
      setVerwaltung(v => ({
        ...v,
        err: e.message
      }));
    }
  };
  const passwortAendern = async () => {
    const d = passwortDlg;
    if (!d) return;
    if ((d.neu || '').length < 6) {
      setPasswortDlg({
        ...d,
        err: 'Mindestens 6 Zeichen.'
      });
      return;
    }
    if (d.neu !== d.neu2) {
      setPasswortDlg({
        ...d,
        err: 'Die beiden Eingaben sind nicht gleich.'
      });
      return;
    }
    try {
      await apiPassAendern(serverCreds().url, d.alt, d.neu);
      setKonto(k => k && {
        ...k,
        muss_wechseln: false
      });
      setPasswortDlg(null);
    } catch (e) {
      setPasswortDlg({
        ...d,
        err: e.message
      });
    }
  };
  const signOut = () => {
    // Abmelden mit offenen Aenderungen hiesse, sie wegzuwerfen: die
    // Zugangsdaten waeren weg, und ohne sie kommt die Warteschlange
    // nirgends mehr an.
    if (pendingRef.current) {
      const n = zaehleOffen();
      appAlert('Es ' + (n === 1 ? 'wartet noch eine Änderung' : 'warten noch ' + n + ' Änderungen') + ' auf den Server. Warte, bis oben „Gespeichert ✓“ steht, sonst ' + (n === 1 ? 'geht sie' : 'gehen sie') + ' verloren.');
      return;
    }
    appConfirm('Von der Gruppe abmelden? Die Charaktere bleiben auf dem Server.', () => {
      // Die Anmeldung endet auch auf dem Server: eine Kennung, die nur im
      // Browser geloescht wird, bleibt dort gueltig liegen.
      const alt = serverCreds();
      if (alt.token) apiLogout(alt.url, alt.token).catch(() => {});
      setKonto(null);
      // Alles der Spielleitung geht mit. Vorher blieb der DM-Modus samt
      // Bibliothek, Gegnern und Chronik im Speicher stehen — wer sich
      // danach als jemand anders anmeldete, sass in fremden Unterlagen.
      doDmLogout();
      ['sv_url', 'sv_code', 'sv_pass', 'sv_token'].forEach(k => localStorage.removeItem(k));
      // Die lokale Kopie geht mit: sonst bliebe ein Stand liegen, der zu
      // keiner Gruppe mehr gehoert.
      localStorage.removeItem('dnd_chars');
      localStorage.removeItem(WARTESCHLANGE);
      localStorage.removeItem(ANSICHT);
      applyChars([]);
      setSvUrl('');
      setSvCode('');
      setSvPass('');
      setSyncStatus('idle');
      setSyncMsg('');
      setOffeneAenderungen(0);
      setSetupForm({
        code: '',
        pass: ''
      });
      setShowSetup(true);
    }, 'Abmelden');
  };
  const cur = chars.find(c => c.id === sel);
  // ── Abenteuer ───────────────────────────────────────────────────
  // Steht vor allem, was Farben, Klassen oder Trefferpunkte braucht: die
  // Einstellungen des offenen Abenteuers gehen in beides ein.
  const abenteuer = advListe(userLibrary);
  const advId = abenteuer.some(a => a.id === advAktiv) ? advAktiv : abenteuer[0] ? abenteuer[0].id : '';
  const advName = (abenteuer.find(a => a.id === advId) || {}).name || 'Abenteuer';
  const advObj = abenteuer.find(a => a.id === advId) || null;
  advIdRef.current = advId;

  // ── Der Kampf geht mit auf den Server ──────────────────────────
  // Bis v4.4 lag er allein hier im Geraet. Damit die Runde mitsehen kann,
  // schreibt die Spielleitung ihn mit — aber nur, solange er laeuft:
  // die Aufstellung davor verriete, was gleich um die Ecke kommt, und
  // nach dem Ende gibt es nichts mehr zu sehen.
  //
  // Gespiegelt wird ohne Bilder. Der Kampf wird waehrend eines Gefechts
  // im Sekundentakt geschrieben, und ein Gegnerbild ist ein halbes
  // Megabyte — das gehoert in die Gegnersammlung, nicht in jede Anfrage.
  //
  // Der Server ist dabei Zuhoerer, nicht Quelle: was hier steht, gilt.
  // Zwei Spielleitungen an zwei Geraeten waeren ein eigener Schritt, und
  // der faengt nicht mit dem Schreiben an, sondern mit dem Zusammenfuehren.
  const kampfGespiegelt = useRef(null);
  useEffect(() => {
    const creds = serverCreds();
    if (!verbunden(creds)) return;
    const darf = isDmMode && konto && leitetAbenteuer(konto, advDms, svCode, advId);
    const laeuft = !!kampf && kampf.aktiv !== false && kampf.phase !== 'vorbereitung';
    const schlank = darf && laeuft ? {
      name: kampf.name,
      phase: kampf.phase || 'kampf',
      aktiv: true,
      runde: kampf.runde,
      zug: kampf.zug,
      gezeigt: !!kampf.gezeigt,
      teilnehmer: (kampf.teilnehmer || []).map(t => {
        const {
          bild,
          ...rest
        } = t;
        return rest;
      }),
      log: kampf.log || []
    } : null;
    // Nichts zu spiegeln und nichts gespiegelt: dann auch keine Anfrage.
    const text = JSON.stringify(schlank);
    if (text === kampfGespiegelt.current) return;
    if (schlank === null && kampfGespiegelt.current === null) return;
    if (!darf) return; // wer nicht leitet, raeumt auch nicht ab
    const uhr = setTimeout(() => {
      kampfGespiegelt.current = text;
      apiKampfSetzen(creds.url, creds.code, advId, schlank).catch(() => {
        kampfGespiegelt.current = null;
      }); // beim naechsten Mal erneut
    }, 1200);
    return () => clearTimeout(uhr);
  }, [kampf, isDmMode, konto, advId, svCode, advDms]);

  // Beim Wechsel des Abenteuers faengt das Spiegeln von vorn an — sonst
  // hielte der Merker den Stand des vorigen Abenteuers fuer den eigenen.
  useEffect(() => {
    kampfGespiegelt.current = null;
  }, [advId]);

  // ── Der Kampf, wie ihn die Runde sieht ─────────────────────────
  // Die Gegenseite des Spiegels: wer nicht leitet, fragt alle paar
  // Sekunden nach, ob ein Kampf laeuft. Die Antwort ist winzig — eine
  // Zahl, und der Rest nur, wenn sie sich bewegt hat.
  //
  // Was zurueckkommt, hat der Server schon zurechtgeschnitten: keine
  // Zahlen der Gegner, keine Notizen, kein Protokoll. Ob ueberhaupt
  // etwas kommt, entscheidet er auch — nach der Einstellung des
  // Abenteuers und danach, ob die Spielleitung freigegeben hat.
  const [kampfSichtDaten, setKampfSichtDaten] = useState(null);
  const [showKampfSicht, setShowKampfSicht] = useState(false);
  const kampfStandRef = useRef(-1);
  const kampfSichtRef = useRef(null);
  useEffect(() => {
    const creds = serverCreds();
    // Die Spielleitung hat den Tracker; sie braucht die Zuschauerbank nicht.
    if (isDmMode || !advId || !verbunden(creds)) {
      setKampfSichtDaten(null);
      return;
    }
    let lebt = true,
      uhr = null;
    const frage = async () => {
      if (!document.hidden) {
        try {
          // Die Abkuerzung nur, wenn wir wirklich noch etwas haben, das
          // stehenbleiben koennte — sonst bekaeme man nach einer
          // Freigabe nichts mehr, weil sich der Stand nicht bewegt hat.
          const seit = kampfSichtRef.current ? kampfStandRef.current : -1;
          const d = await apiKampfStand(creds.url, creds.code, advId, seit);
          if (!lebt) return;
          kampfStandRef.current = +d.stand || 0;
          // Fehlt "kampf" ganz, hat sich seit dem letzten Blick nichts
          // getan — dann bleibt stehen, was schon da ist.
          if (Object.prototype.hasOwnProperty.call(d, 'kampf')) {
            const neu = d.kampf || null;
            // Ein Kampf, der eben noch nicht da war, geht von allein auf.
            if (neu && !kampfSichtRef.current) setShowKampfSicht(true);
            if (!neu) setShowKampfSicht(false);
            kampfSichtRef.current = neu;
            setKampfSichtDaten(neu);
          }
        } catch {/* der naechste Versuch kommt gleich */}
      }
      // Waehrend eines Kampfes oefter, sonst selten. Die Anfrage ist ein
      // paar Dutzend Byte gross, aber sie muss keine Uhr sein.
      uhr = setTimeout(frage, kampfSichtRef.current ? 4000 : 12000);
    };
    frage();
    return () => {
      lebt = false;
      clearTimeout(uhr);
    };
  }, [isDmMode, advId, svCode, konto]);

  // Beim Wechsel des Abenteuers faengt das Zusehen von vorn an.
  useEffect(() => {
    kampfStandRef.current = -1;
    kampfSichtRef.current = null;
    setKampfSichtDaten(null);
    setShowKampfSicht(false);
  }, [advId]);

  // Die eigenen Helden werden in der Liste hervorgehoben.
  const eigeneHeldenIds = konto ? chars.filter(c => +(besitzer || {})[c.id] === +konto.id).map(c => c.id) : [];

  // Wer in der Taverne einen Beutel hat: die eigenen Bögen. Wer keine
  // besitzt — eine Gruppe ohne eingetragenen Besitz, die Spielleitung mit
  // ihren Nichtspielerfiguren — spielt mit denen, die er sieht. Zwei
  // gleichzeitig gespielte Charaktere haben damit zwei Beutel.
  const tavernenHelden = (() => {
    const sichtbar = chars.filter(c => !c.archived && (!c.dmOnly || isDmMode));
    const eigene = sichtbar.filter(c => eigeneHeldenIds.includes(c.id));
    return (eigene.length ? eigene : sichtbar).map(c => ({
      id: c.id,
      name: c.name
    }));
  })();

  // Die Ansagen der Runde. Die Spielleitung fragt sie getrennt ab — sie
  // schreibt den Kampf ja selbst und braucht ihn nicht zurueck, nur das,
  // was die Spieler hineingerufen haben.
  const [ansagen, setAnsagen] = useState([]);
  const [ansageFuer, setAnsageFuer] = useState(null); // charId, waehrend das Fenster offen ist

  useEffect(() => {
    const creds = serverCreds();
    if (!isDmMode || !advId || !verbunden(creds)) {
      setAnsagen([]);
      return;
    }
    let lebt = true,
      uhr = null;
    const frage = async () => {
      if (!document.hidden) {
        try {
          const d = await apiKampfAnsagen(creds.url, creds.code, advId);
          if (lebt) setAnsagen(Array.isArray(d.ansagen) ? d.ansagen : []);
        } catch {/* der naechste Versuch kommt gleich */}
      }
      uhr = setTimeout(frage, 5000);
    };
    frage();
    return () => {
      lebt = false;
      clearTimeout(uhr);
    };
  }, [isDmMode, advId, svCode, konto]);

  // Abgearbeitet ist abgearbeitet: die Spielleitung nimmt die Ansage aus
  // der Liste, und weil sie dabei das Feld mitschickt, nimmt der Server
  // sie auch aus dem Kampf.
  const ansageWeg = id => {
    setAnsagen(a => a.filter(x => x.id !== id));
    const creds = serverCreds();
    if (!verbunden(creds) || !kampf) return;
    const rest = ansagen.filter(x => x.id !== id);
    apiKampfSetzen(creds.url, creds.code, advId, {
      name: kampf.name,
      phase: kampf.phase || 'kampf',
      aktiv: true,
      runde: kampf.runde,
      zug: kampf.zug,
      gezeigt: !!kampf.gezeigt,
      teilnehmer: (kampf.teilnehmer || []).map(t => {
        const {
          bild,
          ...r
        } = t;
        return r;
      }),
      log: kampf.log || [],
      ansagen: rest
    }).catch(() => {});
  };

  // Und die andere Seite: der Spieler schickt seine Ansage ab.
  const ansageSenden = async ansage => {
    const creds = serverCreds();
    if (!verbunden(creds) || !ansageFuer) return;
    try {
      await apiKampfAnsage(creds.url, creds.code, advId, ansageFuer, ansage);
      setAnsageFuer(null);
      kampfStandRef.current = -1; // beim naechsten Blick alles neu holen
    } catch (e) {
      appAlert('Die Ansage kam nicht an: ' + (e.message || 'unbekannter Fehler'));
    }
  };

  // Welcher eigene Held steht im Kampf? Wer dran ist, hat Vorrang.
  const ansageHeldId = (() => {
    if (!kampfSichtDaten) return null;
    const drin = (kampfSichtDaten.teilnehmer || []).filter(t => t.art === 'held' && eigeneHeldenIds.includes(t.charId));
    if (!drin.length) return null;
    const dran = (kampfSichtDaten.teilnehmer || [])[kampfSichtDaten.zug || 0];
    if (dran && drin.some(t => t.charId === dran.charId)) return dran.charId;
    return drin[0].charId;
  })();
  const einstellungFuer = advEinstellung ? advEinstellung.id : null;
  useEffect(() => {
    if (!einstellungFuer) return;
    if (!kontoRef.current && !dmPassRef.current) return;
    mitgliederLaden();
  }, [einstellungFuer]);

  // Wechselt die Spielleitung in ein Abenteuer, das sie nicht leitet, ist
  // sie dort ein Spieler — also raus aus dem DM-Modus. Das ist kein
  // Schoenheitsfehler: an isDmMode haengt auch, ob verdeckte
  // Trefferpunkte als Zahl dastehen. Wer Eberron leitet, soll die von
  // Strahd nicht sehen.
  useEffect(() => {
    if (!isDmMode || !konto) return;
    if (leitetAbenteuer(konto, advDms, svCode, advId)) return;
    doDmLogout();
  }, [advId, advDms, konto, isDmMode]);

  // Welche Klassen dieses Abenteuer kennt — ohne eigene Liste die zwoelf
  // des Regelwerks.
  const klassen = advKlassen(advObj);
  // Ob dieser Bogen seine Trefferpunkte als Zahl zeigen darf.
  const tpOffen = tpSichtbar(advObj, isDmMode, libGeladen);
  // Beim Rendern zaehlt der Zustand: sonst stuenden die Knoepfe einen
  // Durchlauf zu lange da.
  const darfBearbeiten = darfBogen(cur, konto, advDms, besitzer, svCode);
  // Steht am Chronik-Knopf, damit die Leiste zugeklappt bleiben darf, ohne
  // dass eine abgelaufene Frist unbemerkt liegen bleibt.
  const chronikFaellig = !isDmMode ? 0 : ereignisseDerUhr(chronik, advId).filter(e => !e.erledigt && e.faellig != null && e.faellig <= zeitDerUhr(chronik, advId)).length;

  // Eine Auswahlliste, die den bereits eingetragenen Wert immer enthaelt.
  const klassenWahl = aktuell => {
    const namen = klassen.map(k => k.name);
    return aktuell && !namen.includes(aktuell) ? [aktuell, ...namen] : namen;
  };
  const cc = klassenStil(cur && cur.charClass || 'Kämpfer', klassen);

  // ── Effekte angelegter Gegenstaende ──────────────────────────────
  // itemFx sind die gerade wirkenden Effekte, effCur ist der Held mit
  // bereits verrechneten Grundwerten. Alles, was angezeigt oder
  // weitergerechnet wird, liest ab hier effCur; Eingabefelder bleiben
  // bei cur, sonst wuerde man den veraenderten statt den eigenen Wert
  // bearbeiten.
  // Setbeschreibungen kommen aus der geteilten Datenbank. Gleiche Namen
  // gewinnt der Eintrag der Gruppe — der DM ergaenzt, ueberschreibt aber
  // nicht still, was alle sehen.
  const setDefs = (() => {
    const aus = [],
      gesehen = new Set();
    [...(userLibrary.set || []), ...(isDmMode ? dmLibrary.set || [] : [])].forEach(s => {
      if (s && s.name && !gesehen.has(s.name)) {
        gesehen.add(s.name);
        aus.push(s);
      }
    });
    return aus;
  })();
  const itemFx = collectEffects(cur, setDefs);
  const gearSetList = gearSets(cur, setDefs);
  const fxOn = t => itemFx.some(e => e.target === t);
  const fx = (t, base) => applyEffect(itemFx, t, base);
  const fxTitle = t => {
    const rel = effectsFor(itemFx, t);
    if (!rel.length) return undefined;
    return rel.map(e => `${e.source}: ${EFFECT_LABELS[e.target]} ${effectText(e)}`).join('\n');
  };
  const effCur = cur ? {
    ...cur,
    str: fx('str', cur.str),
    dex: fx('dex', cur.dex),
    con: fx('con', cur.con),
    int: fx('int', cur.int),
    wis: fx('wis', cur.wis),
    cha: fx('cha', cur.cha),
    maxHp: fx('maxHp', cur.maxHp) + (+cur.tempMaxHp || 0),
    speed: fx('speed', cur.speed),
    profBonus: fx('profBonus', cur.profBonus)
  } : null;
  // Initiative wird im Bogen als Attributswert gefuehrt und erst bei der
  // Anzeige in einen Modifikator umgerechnet — ein Initiative-Effekt wirkt
  // deshalb auf den fertigen Modifikator, nicht auf den Wert.
  const initTotal = cur ? fx('initiative', mod(cur.initiative || effCur.dex)) : 0;

  // Trefferbonus und Schaden einer Waffe. Stand wortgleich zweimal im Code —
  // einmal fuer die Waffenkarte, einmal fuer die Detailansicht; eine Regel
  // haette man dort kuenftig zweimal aendern muessen. "fin" waehlt das
  // guenstigere der beiden Attribute (Finesse).
  const weaponStats = w => {
    const aKey = w.attrKey === "fin" ? mod(effCur.str) >= mod(effCur.dex) ? "str" : "dex" : w.attrKey || "str";
    const attrMod = mod(effCur[aKey] || 10);
    const bonus = fx('attack', (w.proficient ? effCur.profBonus : 0) + attrMod + (w.attackBonus || 0));
    const dmgBonus = fx('damage', attrMod + (w.attackBonus || 0));
    const dmgStr = w.damage + (dmgBonus !== 0 ? dmgBonus > 0 ? " + " + dmgBonus : " - " + Math.abs(dmgBonus) : "");
    return {
      aKey,
      attrMod,
      bonus,
      dmgBonus,
      dmgStr
    };
  };

  // Dieselbe Auswahl wie die Liste "Aktiv" in der Seitenleiste, damit der
  // Wechsel im Kopf keine Helden anbietet, die dort ausgeblendet sind.
  const advWechseln = id => {
    setAdvAktiv(id);
    try {
      localStorage.setItem('hb_adventure', id);
    } catch {}
    // Der offene Held gehoert zum alten Abenteuer und wuerde sonst
    // weiterhin rechts stehen, waehrend links seine Gruppe fehlt.
    selectChar(null);
    setMv('list');
    setAdvMenuOffen(false);
  };
  // Alles, was zum offenen Abenteuer gehoert. Ein Held ohne Zuordnung
  // taucht im ersten Abenteuer auf, damit nichts unsichtbar wird.
  const imAbenteuer = c => !advId || (c.adventure || (abenteuer[0] || {}).id) === advId;
  const advChars = chars.filter(imAbenteuer);
  const advSpeichern = liste => saveLibrary({
    ...userLibrary,
    _adventures: liste
  });
  const switchList = advChars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode));
  const switchIndex = switchList.findIndex(c => c.id === sel);

  // Der Neue gehoert in das Abenteuer, das gerade offen ist — sonst
  // legte man ihn an und faende ihn nicht wieder.
  // Die Vorgabe kommt aus dem Abenteuer: hat es "Kaempfer" gestrichen,
  // soll der neue Held nicht damit anfangen.
  const openNew = () => {
    const erste = (klassen[0] || {}).name;
    setEc({
      ...newChar(),
      adventure: advId,
      ...(erste ? {
        charClass: erste
      } : {})
    });
    setShowCF(true);
  };
  const openEdit = () => {
    setEc({
      ...cur
    });
    setShowCF(true);
  };
  const saveChar = () => {
    if (!ec.name.trim()) return;
    const exists = charsRef.current.find(c => c.id === ec.id);
    save(exists ? charsRef.current.map(c => c.id === ec.id ? ec : c) : [...charsRef.current, ec]);
    if (exists) {
      const prev = charsRef.current.find(c => c.id === ec.id);
      const charChanges = {};
      if (prev) {
        if (prev.name !== ec.name) charChanges['Name'] = `${prev.name}→${ec.name}`;
        if (prev.charClass !== ec.charClass) charChanges['Klasse'] = `${prev.charClass}→${ec.charClass}`;
        if (prev.level !== ec.level) charChanges['Stufe'] = `${prev.level}→${ec.level}`;
        if (prev.race !== ec.race) charChanges['Rasse'] = `${prev.race}→${ec.race}`;
        if (prev.hp !== ec.hp) charChanges['Max HP'] = `${prev.hp}→${ec.hp}`;
        if (prev.ac !== ec.ac) charChanges['RK'] = `${prev.ac}→${ec.ac}`;
        if (prev.speed !== ec.speed) charChanges['Bewegung'] = `${prev.speed}→${ec.speed}`;
      }
      addLog(ec.id, ec.name, 'charakter', 'Charakter bearbeitet', Object.keys(charChanges).length > 0 ? charChanges : {
        klasse: ec.charClass,
        stufe: ec.level
      });
    } else {
      addLog(ec.id, ec.name, 'charakter', 'Charakter erstellt', {
        klasse: ec.charClass,
        stufe: ec.level,
        rasse: ec.race
      });
    }
    selectChar(ec.id);
    setShowCF(false);
  };
  const deleteChar = () => {
    if (!confirm(cur.name + " wirklich löschen?")) return;
    save(charsRef.current.filter(c => c.id !== selRef.current));
    selectChar(null);
    setMv("list");
  };
  const addWeapon = () => {
    if (!wf.name.trim()) return;
    const cur2 = charsRef.current.find(c => c.id === selRef.current);
    if (wfEditId) {
      patchCurrent(c => ({
        weapons: c.weapons.map(w => w.id === wfEditId ? {
          ...wf,
          id: wfEditId
        } : w)
      }));
      addLog(selRef.current, cur2?.name, 'waffen', `Waffe bearbeitet: ${wf.name}`, {
        schaden: wf.damage
      });
    } else {
      patchCurrent(c => ({
        weapons: [...c.weapons, {
          ...wf,
          id: Date.now().toString()
        }]
      }));
      addLog(selRef.current, cur2?.name, 'waffen', `Waffe hinzugefügt: ${wf.name}`, {
        schaden: wf.damage
      });
    }
    setWf(newWeapon());
    setWfEditId(null);
    setShowWF(false);
  };
  const delWeapon = id => appConfirm("Waffe wirklich löschen?", () => patchCurrent(c => ({
    weapons: c.weapons.filter(w => w.id !== id)
  })));
  const toggleEquipped = id => patchCurrent(c => ({
    weapons: c.weapons.map(w => w.id === id ? {
      ...w,
      equipped: !w.equipped
    } : w)
  }));
  const addSpell = () => {
    if (!sf.name.trim()) return;
    const curSel = selRef.current;
    const curChars = charsRef.current;
    if (sfEditId) {
      save(curChars.map(c => c.id === curSel ? {
        ...c,
        spells: c.spells.map(s => s.id === sfEditId ? {
          ...sf,
          id: sfEditId
        } : s)
      } : c));
    } else {
      save(curChars.map(c => c.id === curSel ? {
        ...c,
        spells: [...c.spells, {
          ...sf,
          id: Date.now().toString()
        }]
      } : c));
    }
    const cur2 = charsRef.current.find(c => c.id === selRef.current);
    if (sfEditId) addLog(selRef.current, cur2?.name, 'zauber', `Zauber bearbeitet: ${sf.name}`, {
      grad: sf.level,
      schule: sf.school
    });else addLog(selRef.current, cur2?.name, 'zauber', `Zauber hinzugefügt: ${sf.name}`, {
      grad: sf.level,
      schule: sf.school
    });
    setSf(newSpell());
    setSfEditId(null);
    setShowSF(false);
  };
  const delSpell = id => appConfirm("Zauber wirklich löschen?", () => {
    const cur2 = charsRef.current.find(c => c.id === selRef.current);
    const spell = cur2?.spells?.find(s => s.id === id);
    patchCurrent(c => ({
      spells: c.spells.filter(s => s.id !== id)
    }));
    if (spell) addLog(selRef.current, cur2?.name, 'zauber', `Zauber gelöscht: ${spell.name}`, {
      grad: spell.level
    });
  });
  const toggleSpellPrepared = id => patchCurrent(c => ({
    spells: c.spells.map(s => s.id === id ? {
      ...s,
      prepared: s.prepared === false ? true : false
    } : s)
  }));
  const saveFeature = () => {
    if (!ff.name.trim()) return;
    const features = cur.features || [];
    let updated;
    if (ffEditId) {
      updated = features.map(f => f.id === ffEditId ? {
        ...ff,
        id: ffEditId
      } : f);
    } else {
      updated = [...features, {
        ...ff,
        id: Date.now().toString()
      }];
    }
    const cur2 = charsRef.current.find(c => c.id === selRef.current);
    patchCurrent(c => ({
      features: updated
    }));
    addLog(selRef.current, cur2?.name, 'attribute', ffEditId ? `Merkmal bearbeitet: ${ff.name}` : `Merkmal hinzugefügt: ${ff.name}`, {
      quelle: ff.source || undefined
    });
    setFf({
      name: '',
      source: '',
      description: '',
      effects: [],
      effectsActive: true
    });
    setFfEditId(null);
    setShowFF(false);
  };
  const delFeature = id => appConfirm("Merkmal wirklich löschen?", () => patchCurrent(c => ({
    features: (c.features || []).filter(f => f.id !== id)
  })));
  // Ein Kampfstil wirkt nicht immer — ohne Rüstung greift der defensive
  // nicht. Umschalten ohne Umweg über den Bearbeiten-Dialog.
  const toggleFeatureFx = id => patchCurrent(c => ({
    features: (c.features || []).map(f => f.id === id ? {
      ...f,
      effectsActive: f.effectsActive === false
    } : f)
  }));
  const addItem = () => {
    if (!itf.name.trim()) return;
    const cur2 = charsRef.current.find(c => c.id === selRef.current);
    if (itfEditId) {
      patchCurrent(c => ({
        inventory: (c.inventory || []).map(i => i.id === itfEditId ? {
          ...itf,
          id: itfEditId
        } : i)
      }));
      addLog(selRef.current, cur2?.name, 'inventar', `Gegenstand bearbeitet: ${itf.name}`, {
        seltenheit: itf.rarity,
        menge: itf.qty
      });
    } else {
      patchCurrent(c => ({
        inventory: [...(c.inventory || []), {
          ...itf,
          id: Date.now().toString()
        }]
      }));
      addLog(selRef.current, cur2?.name, 'inventar', `Gegenstand hinzugefügt: ${itf.name}`, {
        seltenheit: itf.rarity,
        menge: itf.qty
      });
    }
    setItf(newItem());
    setItfEditId(null);
    setShowIF(false);
  };
  // Einzelne Felder eines Gegenstands aendern, ohne den Bearbeiten-Dialog —
  // gebraucht fuer den Effekt-Schalter in der Detailansicht.
  const updItem = (id, patch) => patchCurrent(c => ({
    inventory: (c.inventory || []).map(i => i.id === id ? {
      ...i,
      ...patch
    } : i)
  }));
  const delItem = id => appConfirm("Gegenstand wirklich löschen?", () => {
    const cur2 = charsRef.current.find(c => c.id === selRef.current);
    const item = (cur2?.inventory || []).find(i => i.id === id);
    patchCurrent(c => ({
      inventory: (c.inventory || []).filter(i => i.id !== id)
    }));
    if (item) addLog(selRef.current, cur2?.name, 'inventar', `Gegenstand gelöscht: ${item.name}`, {
      seltenheit: item.rarity
    });
  });
  const doTransfer = (targetId, ids) => {
    const items = (cur.inventory || []).filter(i => ids.has(i.id));
    const target = charsRef.current.find(c => c.id === targetId);
    const updated = charsRef.current.map(c => {
      if (c.id === selRef.current) return {
        ...c,
        inventory: (c.inventory || []).filter(i => !ids.has(i.id))
      };
      if (c.id === targetId) return {
        ...c,
        inventory: [...(c.inventory || []), ...items.map(i => ({
          ...i,
          id: Date.now().toString() + Math.random().toString(36).slice(2)
        }))]
      };
      return c;
    });
    save(updated);
    // Log transfer — only if neither char is DM-only
    if (!cur?.dmOnly && !target?.dmOnly) {
      const itemDetails = items.reduce((acc, i) => {
        const label = i.qty > 1 ? `${i.name} ×${i.qty}` : i.name;
        acc[label] = i.rarity || 'gewöhnlich';
        return acc;
      }, {});
      addLog(sel, cur?.name, 'inventar', `${items.length} Gegenstand${items.length !== 1 ? 'e' : ''} an ${target?.name || '?'} übergeben`, itemDetails);
      addLog(targetId, target?.name, 'inventar', `${items.length} Gegenstand${items.length !== 1 ? 'e' : ''} von ${cur?.name || '?'} erhalten`, itemDetails);
    }
    setTransferSel(new Set());
    setShowTransfer(false);
  };

  // Notes helpers — migrate legacy cur.notes on the fly
  const notesList = (() => {
    const list = cur && cur.notesList || [];
    if (list.length === 0 && cur && cur.notes) return [{
      id: 'legacy',
      title: 'Notizen',
      content: cur.notes
    }];
    return list;
  })();
  const saveNote = () => {
    if (!nf.title.trim() && !nf.content.trim()) return;
    const title = nf.title.trim() || 'Notiz';
    const entry = {
      ...nf,
      title
    };
    let updated;
    if (nfEditId) {
      updated = notesList.map(n => n.id === nfEditId ? {
        ...entry,
        id: nfEditId
      } : n);
    } else {
      updated = [...notesList, {
        ...entry,
        id: Date.now().toString()
      }];
    }
    patchCurrent(c => ({
      notesList: updated,
      notes: ''
    }));
    setNf({
      title: '',
      content: '',
      tags: []
    });
    setNfEditId(null);
    setShowNF(false);
  };
  const delNote = id => {
    appConfirm("Notiz wirklich löschen?", () => {
      const updated = notesList.filter(n => n.id !== id);
      patchCurrent(c => ({
        notesList: updated,
        notes: ''
      }));
    });
  };
  const updCurrency = (k, v) => patchCurrent(c => ({
    currency: {
      ...(c.currency || {}),
      [k]: Math.max(0, +v || 0)
    }
  }));
  const toggleSkill = key => {
    const profs = cur.skillProfs || [];
    const exp = cur.expertiseProfs || [];
    const isP = profs.includes(key);
    const isE = exp.includes(key);
    // Cycle: none → prof → expertise → none
    if (!isP && !isE) {
      patchCurrent(c => ({
        skillProfs: [...profs, key]
      }));
    } else if (isP && !isE) {
      patchCurrent(c => ({
        expertiseProfs: [...exp, key]
      }));
    } else {
      patchCurrent(c => ({
        skillProfs: profs.filter(x => x !== key),
        expertiseProfs: exp.filter(x => x !== key)
      }));
    }
  };
  const toggleJoAT = () => patchCurrent(c => ({
    jackOfAllTrades: !c.jackOfAllTrades
  }));
  const toggleSave = attr => {
    const p = cur.savingThrowProfs || [];
    patchCurrent(c => ({
      savingThrowProfs: p.includes(attr) ? p.filter(x => x !== attr) : [...p, attr]
    }));
  };
  const slots = cur && cur.spellSlots || {
    1: {
      max: 0,
      used: 0
    },
    2: {
      max: 0,
      used: 0
    },
    3: {
      max: 0,
      used: 0
    },
    4: {
      max: 0,
      used: 0
    },
    5: {
      max: 0,
      used: 0
    },
    6: {
      max: 0,
      used: 0
    },
    7: {
      max: 0,
      used: 0
    },
    8: {
      max: 0,
      used: 0
    },
    9: {
      max: 0,
      used: 0
    }
  };
  const updSlots = s => patchCurrent(c => ({
    spellSlots: s
  }));
  const togSlot = (l, i) => {
    const s = slots[l];
    const avail = s.max - s.used;
    updSlots({
      ...slots,
      [l]: {
        ...s,
        used: i < avail ? s.max - i : s.max - (i + 1)
      }
    });
  };
  const chgMax = (l, d) => {
    const s = slots[l];
    const m = Math.max(0, Math.min(9, s.max + d));
    updSlots({
      ...slots,
      [l]: {
        max: m,
        used: Math.min(s.used, m)
      }
    });
  };
  const resetAll = () => {
    const r = {};
    for (let i = 1; i <= 9; i++) r[i] = {
      ...slots[i],
      used: 0
    };
    updSlots(r);
  };
  const sp = cur && cur.sorceryPoints || {
    max: 0,
    used: 0
  };
  const updSP = s => patchCurrent(c => ({
    sorceryPoints: s
  }));
  const togSP = i => {
    const avail = sp.max - sp.used;
    updSP({
      ...sp,
      used: i < avail ? sp.max - i : sp.max - (i + 1)
    });
  };
  const spChgMax = d => {
    const m = Math.max(0, Math.min(20, sp.max + d));
    updSP({
      max: m,
      used: Math.min(sp.used, m)
    });
  };

  // Local input buffers – prevent focus loss on direct-save inputs
  const [localInputs, setLocalInputs] = useState({});
  const localVal = (key, fallback) => key in localInputs ? localInputs[key] : fallback;
  const setLocal = (key, val) => setLocalInputs(prev => ({
    ...prev,
    [key]: val
  }));
  const clearLocal = key => setLocalInputs(prev => {
    const n = {
      ...prev
    };
    delete n[key];
    return n;
  });
  const resources = cur && cur.resources || [];
  const updResources = r => patchCurrent(c => ({
    resources: r
  }));

  // ── Inspiration ──────────────────────────────────────────────────
  // Anders als die frei angelegten Ressourcen hat sie jeder Held, deshalb
  // steht sie fest im Bogen. Aeltere Charaktere haben die Felder noch nicht,
  // daher die Ersatzwerte. Sie wird beim Rasten ausdruecklich nicht
  // zurueckgesetzt — sie bleibt, bis man sie einsetzt.
  const inspMax = Math.max(1, Math.min(10, +(cur && cur.inspirationMax) || 1));
  const insp = Math.max(0, Math.min(inspMax, +(cur && cur.inspiration) || 0));
  const setInsp = n => {
    const v = Math.max(0, Math.min(inspMax, n));
    if (v === insp) return;
    patchCurrent(() => ({
      inspiration: v
    }));
    addLog(selRef.current, cur && cur.name, 'charakter', v > insp ? 'Inspiration erhalten' : 'Inspiration eingesetzt', {
      stand: v + '/' + inspMax
    });
  };
  const setInspMax = n => {
    const m = Math.max(1, Math.min(10, n));
    patchCurrent(c => ({
      inspirationMax: m,
      inspiration: Math.min(+c.inspiration || 0, m)
    }));
  };
  const patchChar = patch => patchCurrent(c => ({
    ...patch
  }));
  const addResource = () => updResources([...resources, {
    id: Date.now().toString(),
    name: "Neue Ressource",
    max: 3,
    used: 0,
    color: "#c9a84c",
    restType: "lang"
  }]);

  // ── Ausruestungsplaetze ─────────────────────────────────────────
  const gearWornList = gearWorn(cur);
  const nhGesperrt = nebenhandGesperrt(cur);
  // Legt einen Gegenstand oder eine Waffe in einen Platz — oder raeumt ihn
  // mit obj=null. Alles in einem Zug, damit die Regeln nicht in einem
  // Zwischenzustand verletzt sind: dasselbe Stueck liegt nie in zwei
  // Plaetzen, und ein Zweihaender raeumt die Nebenhand.
  const setGearSlot = (slotKey, k, id) => patchCurrent(c => {
    const gear = {
      ...(c.gear || {})
    };
    if (!id) delete gear[slotKey];else {
      Object.keys(gear).forEach(s => {
        const g = gear[s];
        if (g && g.k === k && g.id === id) delete gear[s];
      });
      gear[slotKey] = {
        k,
        id
      };
    }
    if (slotKey === 'haupthand') {
      const w = id && k === 'w' ? (c.weapons || []).find(x => x.id === id) : null;
      if (isZweihand(w)) delete gear.nebenhand;
    }
    // equipped der Waffen aus den Haenden ableiten: die Waffenkarten im
    // Aktionen-Reiter lesen dieses Kennzeichen und sollen dasselbe sagen.
    const inHand = new Set(Object.values(gear).filter(g => g.k === 'w').map(g => g.id));
    const weapons = (c.weapons || []).map(w => !!w.equipped === inHand.has(w.id) ? w : {
      ...w,
      equipped: inHand.has(w.id)
    });
    return {
      gear,
      weapons
    };
  });

  // Legt ein Stueck aus einer Vorlage an und steckt es sofort in seinen
  // Platz. Ohne das waeren es fuer ein Kettenhemd sechs Schritte: Gegenstand
  // anlegen, benennen, Platz waehlen, Art waehlen, speichern, anlegen.
  const gearAusVorlage = (slotKey, tpl) => patchCurrent(c => {
    const id = 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const item = {
      ...newItem(),
      id,
      name: tpl.name,
      gearKind: tpl.art,
      armorType: tpl.armorType,
      baseAC: tpl.baseAC,
      icon: tpl.icon || '🛡️'
    };
    return {
      inventory: [...(c.inventory || []), item],
      gear: {
        ...(c.gear || {}),
        [slotKey]: {
          k: 'i',
          id
        }
      }
    };
  });

  // Nur echte Ruestung zaehlt als Grundwert: ein Stueck ohne Ruestungsart
  // oder ohne Basiswert im Ruestungsplatz wuerde sonst die 10 der
  // unbewaffneten RK durch 0 ersetzen.
  const gearArmor = (() => {
    const r = cur && cur.gearMigrated ? gearAt(cur, 'ruestung') : null;
    return r && r.armorType && r.armorType !== 'shield' && +r.baseAC > 0 ? r : null;
  })();
  const gearShield = (() => {
    if (!cur || !cur.gearMigrated || nhGesperrt) return null;
    const nh = gearAt(cur, 'nebenhand');
    return nh && nh.armorType === 'shield' ? nh : null;
  })();
  const computedAC = (() => {
    if (!cur) return null;
    const dex = mod(effCur.dex);
    // Seit die Talent-Boni Merkmale sind, kommen sie ueber fx('ac') herein.
    // Bis ein Held dort angekommen ist, zaehlt weiter die alte Liste.
    const activeAbBonuses = (cur.gearMigrated || 0) >= 3 ? 0 : (cur.acBonuses || []).filter(b => b.active).reduce((s, b) => s + (+b.bonus || 0), 0);
    if (cur.gearMigrated) {
      const itemBonuses = gearWornList.reduce((s, {
        obj
      }) => s + (+obj.acBonus || 0), 0);
      const shBonus = gearShield ? +gearShield.baseAC || 2 : 0;
      if (!gearArmor) {
        if (shBonus === 0 && activeAbBonuses === 0 && itemBonuses === 0 && !fxOn('ac')) return null;
        return fx('ac', 10 + dex + shBonus + activeAbBonuses + itemBonuses);
      }
      const t = gearArmor.armorType;
      const basis = +gearArmor.baseAC || 0;
      const ac = t === 'heavy' ? basis : t === 'medium' ? basis + Math.min(2, dex) : basis + dex;
      return fx('ac', ac + shBonus + activeAbBonuses + itemBonuses);
    }
    // Vor der Umstellung unveraendert aus der alten Ausruestungsliste. Der
    // Zweig lebt nur noch fuer die Augenblicke zwischen Laden und
    // Umstellung — die Oberflaeche dazu ist weg, die Daten sind es nicht.
    const equipment = cur.equipment || [];
    const equippedArmors = equipment.filter(e => e.equipped && e.type !== "shield" && e.type !== "other");
    const equippedShields = equipment.filter(e => e.equipped && e.type === "shield");
    const itemBonuses = equipment.filter(e => e.equipped && (e.acBonus || 0) !== 0).reduce((s, e) => s + (+e.acBonus || 0), 0);
    if (equippedArmors.length === 0) {
      // Ohne Rüstung nur rechnen, wenn ueberhaupt etwas beitraegt — ein
      // RK-Effekt zaehlt dabei mit.
      const shBonus = equippedShields.reduce((s, sh) => s + (sh.baseAC || 2), 0);
      if (shBonus === 0 && activeAbBonuses === 0 && itemBonuses === 0 && !fxOn('ac')) return null;
      return fx('ac', 10 + dex + shBonus + activeAbBonuses + itemBonuses);
    }
    const a = equippedArmors[0];
    let ac = a.type === "heavy" ? a.baseAC : a.type === "medium" ? a.baseAC + Math.min(2, dex) : a.baseAC + dex; // light or other
    ac += equippedShields.reduce((s, sh) => s + (sh.baseAC || 2), 0);
    ac += activeAbBonuses + itemBonuses;
    return fx('ac', ac);
  })();
  const displayAC = computedAC !== null ? computedAC : cur ? cur.ac : 10;
  const languages = cur && cur.languages || [];
  const toolProfs = cur && cur.toolProfs || [];
  const weaponProfs = cur && cur.weaponProfs || [];
  const addLanguage = val => {
    if (!val.trim()) return;
    patchCurrent(c => ({
      languages: [...(c.languages || []), val.trim()]
    }));
  };
  const delLanguage = i => patchCurrent(c => ({
    languages: (c.languages || []).filter((_, j) => j !== i)
  }));
  const addToolProf = val => {
    if (!val.trim()) return;
    patchCurrent(c => ({
      toolProfs: [...(c.toolProfs || []), val.trim()]
    }));
  };
  const delToolProf = i => patchCurrent(c => ({
    toolProfs: (c.toolProfs || []).filter((_, j) => j !== i)
  }));
  const addWeaponProf = val => {
    if (!val.trim()) return;
    patchCurrent(c => ({
      weaponProfs: [...(c.weaponProfs || []), val.trim()]
    }));
  };
  const delWeaponProf = i => patchCurrent(c => ({
    weaponProfs: (c.weaponProfs || []).filter((_, j) => j !== i)
  }));
  const armorProfs = cur && cur.armorProfs || [];
  const addArmorProf = val => {
    if (!val.trim()) return;
    patchCurrent(c => ({
      armorProfs: [...(c.armorProfs || []), val.trim()]
    }));
  };
  const delArmorProf = i => patchCurrent(c => ({
    armorProfs: (c.armorProfs || []).filter((_, j) => j !== i)
  }));
  const delResource = id => appConfirm("Ressource wirklich löschen?", () => updResources(resources.filter(r => r.id !== id)));
  const updResource = (id, patch) => updResources(resources.map(r => r.id === id ? {
    ...r,
    ...patch
  } : r));
  const togResourcePip = (id, i) => {
    const r = resources.find(x => x.id === id);
    const avail = r.max - r.used;
    updResource(id, {
      used: i < avail ? r.max - i : r.max - (i + 1)
    });
  };

  // Die Vorlagen lagen bis hierher in einer data.json von 448 KB, die beim
  // Oeffnen jeder Vorlagenauswahl komplett geladen wurde — wer eine Waffe
  // suchte (3 KB), holte sich alle 484 Zauber (409 KB) mit. Jetzt liegt jede
  // Art in einer eigenen Datei und wird einzeln und nur einmal geladen.
  const TPL_QUELLEN = {
    spell: ['spells', 'data-spells.json'],
    weapon: ['weapons', 'data-weapons.json'],
    wildshape: ['wildshapes', 'data-wildshapes.json']
  };
  const ladeVorlagen = async type => {
    const eintrag = TPL_QUELLEN[type];
    if (!eintrag) return true;
    const [key, datei] = eintrag;
    if (tplData && tplData[key]) return true; // schon geladen
    try {
      const r = await fetch(datei);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      setTplData(prev => ({
        ...(prev || {}),
        [key]: d[key] || []
      }));
      return true;
    } catch (e) {
      appAlert(datei + ' konnte nicht geladen werden. Liegt die Datei im selben Ordner wie index.html?');
      return false;
    }
  };
  const openTpl = async type => {
    setTplSearch('');
    setTplFilter('all');
    setWsFilter({
      cr: 'all',
      tag: 'all'
    });
    setWsExpand(null);
    setTplClassFilter([]);
    setTplDmgFilter([]);
    if (!(await ladeVorlagen(type))) return;
    setShowTpl(type);
  };
  // Lieblingstiere brauchen die Tierdaten auch dann, wenn die Vorlagenauswahl
  // nie geoeffnet wurde. Vorher kamen sie mit der gemeinsamen data.json
  // zufaellig mit — jetzt werden sie gezielt nachgeladen.
  useEffect(() => {
    if (!cur || !(cur.wsFavorites || []).length) return;
    if (tplData && tplData.wildshapes) return;
    ladeVorlagen('wildshape');
  }, [sel, cur && (cur.wsFavorites || []).length || 0, !!(tplData && tplData.wildshapes)]);
  const pickSpell = s => {
    setSf({
      ...newSpell(),
      name: s.name,
      level: s.level,
      school: s.school,
      castingTime: s.castingTime,
      range: s.range,
      duration: s.duration,
      components: s.components || 'V, S',
      description: s.description,
      classes: s.classes || [],
      damageTags: s.damageTags || []
    });
    setShowTpl(null);
    setShowSF(true);
  };
  const pickWeapon = w => {
    // Bibliothekseintraege koennen ein Bild mitbringen — das uebernehmen wir.
    setWf({
      ...newWeapon(),
      name: w.name,
      damage: w.damage,
      damageType: w.damageType,
      range: w.range || "1,5m",
      description: w.description || "",
      properties: w.properties || [],
      imageData: w.imageData || ""
    });
    setWfEditId(null);
    setShowTpl(null);
    setShowWF(true);
  };
  const goChar = id => {
    selectChar(id);
    setTab("stats");
    setMv("sheet");
    setTransferMode(false);
    setTransferSel(new Set());
  };
  const archiveChar = () => {
    patchCurrent(c => ({
      archived: true
    }));
    selectChar(null);
    setMv("list");
  };
  const unarchiveChar = id => save(charsRef.current.map(c => c.id === id ? {
    ...c,
    archived: false
  } : c));

  // ── AdventureLog component (extracted to avoid hooks-in-IIFE error) ─────
  const AdventureLog = ({
    onClose,
    isDmMode
  }) => {
    const fmt = ts => new Date(ts.replace(' ', 'T') + 'Z').toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const tabColor = t => ({
      'zauber': '#c060a0',
      'inventar': '#e0a030',
      'waffen': '#c84040',
      'charakter': 'var(--gold)'
    })[t] || 'var(--border-bright)';
    const TAB_ICONS2 = LOG_TAB_ICONS; // wortgleiche Kopie, jetzt nur noch ein Ort
    const TABS2 = ['charakter', 'zauber', 'inventar', 'waffen', 'attribute', 'rüst', 'notizen'];
    const dmCharIds = new Set(JSON.parse(localStorage.getItem('dnd_chars') || '[]').filter(c => c.dmOnly === true).map(c => c.id));
    const [alEntries, setAlEntries] = useState([]);
    const [alLoading, setAlLoading] = useState(false);
    const [alHasMore, setAlHasMore] = useState(true);
    const [alSearchInput, setAlSearchInput] = useState('');
    const [alTabs, setAlTabs] = useState([]); // include filter
    const [alExclude, setAlExclude] = useState([]); // exclude filter
    const scrollRef = useRef(null);
    const searchTimer = useRef(null);
    const alTabsRef = useRef([]);
    const alExcludeRef = useRef([]);
    const alSearchRef = useRef('');
    const fetchPage = (offset, search, tabs, reset) => {
      const {
        url,
        code,
        pass,
        token
      } = serverCreds();
      if (!verbunden({
        url,
        code,
        pass,
        token
      })) return;
      setAlLoading(true);
      apiLoadLogs(url, code, pass, null, {
        limit: 50,
        offset,
        search,
        tabFilter: tabs
      }).then(d => {
        const excl = alExcludeRef.current;
        const logs = (d.logs || []).filter(e => (isDmMode || !dmCharIds.has(e.char_id)) && (excl.length === 0 || !excl.includes(e.tab)));
        setAlEntries(prev => reset ? logs : [...prev, ...logs]);
        setAlHasMore(!!d.has_more);
        setAlLoading(false);
      }).catch(() => setAlLoading(false));
    };
    useEffect(() => {
      fetchPage(0, '', [], true);
    }, []);
    const handleSearch = val => {
      setAlSearchInput(val);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        alSearchRef.current = val;
        fetchPage(0, val, alTabsRef.current, true);
      }, 400);
    };
    const handleTabClick = t => {
      const inc = alTabsRef.current.includes(t);
      const exc = alExcludeRef.current.includes(t);
      if (!inc && !exc) {
        // off → include
        alTabsRef.current = [...alTabsRef.current, t];
        setAlTabs([...alTabsRef.current]);
        fetchPage(0, alSearchRef.current, alTabsRef.current, true);
      } else if (inc) {
        // include → exclude
        alTabsRef.current = alTabsRef.current.filter(x => x !== t);
        setAlTabs([...alTabsRef.current]);
        alExcludeRef.current = [...alExcludeRef.current, t];
        setAlExclude([...alExcludeRef.current]);
        fetchPage(0, alSearchRef.current, alTabsRef.current, true);
      } else {
        // exclude → off
        alExcludeRef.current = alExcludeRef.current.filter(x => x !== t);
        setAlExclude([...alExcludeRef.current]);
        fetchPage(0, alSearchRef.current, alTabsRef.current, true);
      }
    };
    const loadMore = () => {
      if (!alLoading && alHasMore) fetchPage(alEntries.length, alSearchRef.current, alTabsRef.current, false);
    };
    return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 640,
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 18px 10px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--bg-deep)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-title",
      style: {
        margin: 0,
        flex: 1
      }
    }, "\uD83D\uDCD6 Abenteuerlog"), /*#__PURE__*/React.createElement("button", {
      className: "btn-cancel",
      onClick: onClose
    }, "\u2715")), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      style: {
        marginBottom: 8,
        padding: '6px 10px',
        fontSize: 12
      },
      placeholder: "Suchen...",
      value: alSearchInput,
      onChange: e => handleSearch(e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      className: "marken-reihe",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4
      }
    }, TABS2.map(t => {
      const inc = alTabs.includes(t);
      const exc = alExclude.includes(t);
      return /*#__PURE__*/React.createElement("button", {
        key: t,
        onClick: () => handleTabClick(t),
        title: inc ? 'Klicken zum Ausschließen' : exc ? 'Klicken zum Zurücksetzen' : 'Klicken zum Einschließen',
        style: {
          padding: '3px 8px',
          borderRadius: 12,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          border: '1px solid',
          background: inc ? 'var(--gold)' : exc ? 'rgba(200,60,60,0.25)' : 'var(--bg-card)',
          borderColor: inc ? 'var(--gold)' : exc ? '#c83c3c' : 'var(--border)',
          color: inc ? 'var(--bg-deep)' : exc ? '#e07070' : 'var(--text-muted)',
          textDecoration: exc ? 'line-through' : 'none'
        }
      }, (TAB_ICONS2[t] || '📌') + ' ' + t);
    }))), /*#__PURE__*/React.createElement("div", {
      ref: scrollRef,
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px'
      },
      onScroll: e => {
        const el = e.target;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) loadMore();
      }
    }, alEntries.length === 0 && !alLoading && /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: 13,
        marginTop: 20,
        textAlign: 'center'
      }
    }, "Keine Eintr\xE4ge gefunden."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }
    }, alEntries.map((e, i) => /*#__PURE__*/React.createElement("div", {
      key: e.id || i,
      style: {
        display: 'flex',
        gap: 8,
        padding: '7px 10px',
        background: 'var(--bg-card)',
        borderRadius: 4,
        borderLeft: '3px solid ' + tabColor(e.tab),
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        flexShrink: 0
      }
    }, TAB_ICONS2[e.tab] || '📌'), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, e.char_name && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--gold-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 2
      }
    }, e.char_name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-primary)',
        lineHeight: 1.3
      }
    }, e.action), e.details && Object.keys(e.details).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 2
      }
    }, Object.entries(e.details).map(([k, v]) => k + ': ' + v).join(' · '))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }
    }, fmt(e.created_at))))), alLoading && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '12px',
        color: 'var(--text-muted)',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11
      }
    }, "Lade..."), !alLoading && alHasMore && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '10px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: loadMore,
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        padding: '6px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        borderRadius: 4,
        cursor: 'pointer'
      }
    }, "Mehr laden")), !alHasMore && alEntries.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '10px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        color: 'var(--text-muted)'
      }
    }, "Alle ", alEntries.length, " Eintr\xE4ge geladen"))));
  };
  const CharList = () => {
    const active = advChars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode));
    const archived = advChars.filter(c => c.archived && (c.dmOnly !== true || isDmMode));
    const q = charSearch.toLowerCase();
    const filterSearch = list => q ? list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.charClass || '').toLowerCase().includes(q) || (c.race || '').toLowerCase().includes(q)) : list;
    const list = filterSearch(showArchive ? archived : active);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        padding: "4px 8px 0",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowArchive(false),
      style: {
        flex: 1,
        padding: "9px 0",
        minHeight: 36,
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: !showArchive ? "var(--bg-panel)" : "none",
        border: "1px solid",
        borderColor: !showArchive ? "var(--gold-dim)" : "var(--border)",
        color: !showArchive ? "var(--gold)" : "var(--text-muted)",
        borderRadius: "3px 0 0 3px",
        cursor: "pointer"
      }
    }, "\u2694 Aktiv ", active.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: 0.7
      }
    }, "(", active.length, ")")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowArchive(true),
      style: {
        flex: 1,
        padding: "9px 0",
        minHeight: 36,
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: showArchive ? "var(--bg-panel)" : "none",
        border: "1px solid",
        borderColor: showArchive ? "var(--gold-dim)" : "var(--border)",
        color: showArchive ? "var(--gold)" : "var(--text-muted)",
        borderRadius: "0 3px 3px 0",
        cursor: "pointer",
        marginLeft: -1
      }
    }, "\uD83D\uDCE6 Archiv ", archived.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: 0.7
      }
    }, "(", archived.length, ")"))), list.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "40px 20px",
        textAlign: "center",
        color: "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 36,
        marginBottom: 12,
        opacity: 0.3
      }
    }, showArchive ? "📦" : "⚔"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 14
      }
    }, showArchive ? "Archiv ist leer" : "Noch keine Helden"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        marginTop: 6,
        opacity: 0.6
      }
    }, showArchive ? "Archivierte Charaktere erscheinen hier" : "Erstelle deinen ersten Charakter")), list.map(c => /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: "char-item" + (sel === c.id ? " active" : ""),
      onClick: () => goChar(c.id),
      style: {
        cursor: "pointer",
        opacity: showArchive ? 0.8 : 1,
        borderStyle: showArchive ? "dashed" : c.dmOnly ? "dashed" : "solid",
        borderColor: c.dmOnly ? sel === c.id ? '#c060a0' : '#c060a040' : undefined,
        display: "flex",
        alignItems: "center",
        gap: 6,
        paddingRight: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "char-item-name",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, showArchive && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        opacity: 0.5
      }
    }, "\uD83D\uDCE6"), c.dmOnly && /*#__PURE__*/React.createElement("span", {
      title: "DM-Held",
      style: {
        fontSize: 10,
        color: '#c060a0'
      }
    }, "\uD83D\uDD2E"), konto && besitzer[c.id] === konto.id && /*#__PURE__*/React.createElement("span", {
      className: "char-eigen",
      title: "Dein Held"
    }, "\uD83D\uDC64"), c.name), /*#__PURE__*/React.createElement("div", {
      className: "char-item-sub"
    }, c.race, " \xB7 ", c.charClass, (c.multiclasses || []).length > 0 ? ' / ' + c.multiclasses.map(m => m.charClass).join(' / ') : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg-void)",
        border: "1px solid var(--border)",
        borderRadius: 3,
        padding: "1px 6px",
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: "var(--gold-dim)",
        whiteSpace: "nowrap"
      }
    }, "Lv ", (c.level || 1) + (c.multiclasses || []).reduce((s, m) => s + (m.level || 0), 0)), showArchive && /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        unarchiveChar(c.id);
      },
      style: {
        padding: "3px 7px",
        fontSize: 10,
        fontFamily: "'Roboto Condensed',sans-serif",
        background: "none",
        border: "1px solid var(--gold-dim)",
        borderRadius: 3,
        color: "var(--gold-dim)",
        cursor: "pointer",
        whiteSpace: "nowrap"
      },
      title: "Charakter reaktivieren"
    }, "\u21A9 aktiv")))));
  };

  // Wird bei jedem Rendern neu gebaut — genau wie zuvor die
  // Closure-Variablen von Sheet.
  const sheetCtx = {
    addArmorProf,
    addLanguage,
    addLog,
    addResource,
    addToolProf,
    addWeaponProf,
    appAlert,
    appConfirm,
    archiveChar,
    armorProfs,
    cc,
    charMenuOpen,
    chars,
    chgMax,
    collapsedLevels,
    computedAC,
    cur,
    delArmorProf,
    deleteChar,
    delFeature,
    delItem,
    delLanguage,
    delNote,
    delResource,
    delSpell,
    delToolProf,
    delWeaponProf,
    displayAC,
    effCur,
    exFeature,
    exItem,
    exNote,
    exSpell,
    fx,
    fxOn,
    fxTitle,
    gearArmor,
    gearAusVorlage,
    gearPick,
    gearSetList,
    gearShield,
    gearWornList,
    initTotal,
    insp,
    inspMax,
    invRarity,
    invTagFilter,
    isDmMode,
    itemFx,
    klassen,
    languages,
    nhGesperrt,
    notesList,
    noteTagFilter,
    darfBearbeiten,
    openEdit,
    openNew,
    openTpl,
    openUnprepared,
    patchChar,
    patchCurrent,
    resEdit,
    resetAll,
    resources,
    save,
    sel,
    selectChar,
    setCharMenuOpen,
    setCoinDelta,
    setCoinPopover,
    setCollapsedLevels,
    setExFeature,
    setExNote,
    setExSpell,
    setFf,
    setFfEditId,
    setGearPick,
    setGearSlot,
    setImgViewer,
    setInsp,
    setInspMax,
    setInvRarity,
    setInvTagFilter,
    setItemViewer,
    setItf,
    setItfEditId,
    setNf,
    setNfEditId,
    setNoteTagFilter,
    setOpenUnprepared,
    setResEdit,
    setSf,
    setSfEditId,
    setShowFF,
    setShowIF,
    setShowNF,
    setShowSF,
    setShowTransfer,
    setShowWF,
    setSlotsEdit,
    setSpEdit,
    setSpellTagFilter,
    setStatsEdit,
    setTab,
    setTransferMode,
    setTransferSel,
    setWeaponViewer,
    setWf,
    setWfEditId,
    setWsExpand,
    slots,
    slotsEdit,
    sp,
    spChgMax,
    spEdit,
    spellTagFilter,
    statsEdit,
    switchList,
    tab,
    tpOffen,
    toggleEquipped,
    toggleFeatureFx,
    toggleJoAT,
    toggleSave,
    toggleSkill,
    toggleSpellPrepared,
    toggleWsFav,
    togResourcePip,
    togSlot,
    togSP,
    toolProfs,
    tplData,
    transferMode,
    transferSel,
    unarchiveChar,
    updResource,
    updSP,
    weaponProfs,
    weaponStats,
    wsExpand
  };
  return /*#__PURE__*/React.createElement(SheetCtx.Provider, {
    value: sheetCtx
  }, /*#__PURE__*/React.createElement("div", {
    className: "app" + (sidebarCollapsed ? " sb-collapsed" : "")
  }, /*#__PURE__*/React.createElement("button", {
    className: "sidebar-toggle" + (sidebarCollapsed ? " open" : ""),
    onClick: () => setSidebarCollapsed(c => !c),
    title: sidebarCollapsed ? "Heldenübersicht einblenden" : "Heldenübersicht ausblenden",
    "aria-expanded": !sidebarCollapsed,
    style: {
      left: sidebarCollapsed ? 0 : 260
    }
  }, sidebarCollapsed ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "sidebar-toggle-pfeil"
  }, "\u25B6"), /*#__PURE__*/React.createElement("span", {
    className: "sidebar-toggle-text"
  }, "Helden")) : '◀'), /*#__PURE__*/React.createElement("div", {
    className: "sidebar" + (sidebarCollapsed ? " collapsed" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-header"
  }, /*#__PURE__*/React.createElement("img", {
    className: "hb-logo",
    src: "logo.png",
    alt: "Heldenbuch",
    width: 280,
    height: 280
  }), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-wort"
  }, "Heldenbuch", /*#__PURE__*/React.createElement("span", {
    className: "app-version"
  }, HB_VERSION))), /*#__PURE__*/React.createElement("div", {
    className: "char-list"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 8px 0'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      width: '100%',
      padding: '5px 10px',
      fontSize: 12,
      boxSizing: 'border-box',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      color: 'var(--text-primary)'
    },
    placeholder: "\uD83D\uDD0D Held suchen...",
    value: charSearch,
    onChange: e => setCharSearch(e.target.value)
  })), /*#__PURE__*/React.createElement(CharList, null)), abenteuer.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "adv-leiste"
  }, /*#__PURE__*/React.createElement("button", {
    className: "adv-knopf",
    onClick: () => setAdvMenuOffen(o => !o),
    title: "Abenteuer wechseln",
    "aria-expanded": advMenuOffen
  }, /*#__PURE__*/React.createElement("span", {
    className: "adv-knopf-label"
  }, "Abenteuer"), /*#__PURE__*/React.createElement("span", {
    className: "adv-knopf-name"
  }, advName), /*#__PURE__*/React.createElement("span", {
    className: "adv-knopf-caret"
  }, advMenuOffen ? '▾' : '▸')), advMenuOffen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 29
    },
    onClick: () => setAdvMenuOffen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "adv-menu"
  }, abenteuer.map(a => {
    const n = chars.filter(c => (c.adventure || abenteuer[0].id) === a.id && !c.archived).length;
    return /*#__PURE__*/React.createElement("button", {
      key: a.id,
      className: "adv-menu-eintrag" + (a.id === advId ? " aktiv" : ""),
      onClick: () => advWechseln(a.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "adv-menu-name"
    }, a.name), /*#__PURE__*/React.createElement("span", {
      className: "adv-menu-zahl"
    }, n));
  }), (isDmMode || konto && konto.ist_admin) && /*#__PURE__*/React.createElement("button", {
    className: "adv-menu-verwalten",
    onClick: () => {
      setAdvMenuOffen(false);
      const a = abenteuer.find(x => x.id === advId);
      if (a) setAdvEinstellung({
        ...a
      });
    }
  }, "\u2699 Einstellungen \xB7 ", advName), /*#__PURE__*/React.createElement("button", {
    className: "adv-menu-verwalten",
    onClick: () => {
      setAdvMenuOffen(false);
      setShowAdvVerwaltung(true);
    }
  }, "\u2699 Abenteuer verwalten")))), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-footer"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-new",
    onClick: openNew
  }, "\u2726 Neuer Charakter"), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-tools"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => {
      setShowDB(true);
      setDbForm(null);
      setDbFormId(null);
    }
  }, "\uD83D\uDCDA Datenbank"), /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => {
      setAdventSearch('');
      setAdventTabFilter([]);
      setShowAdventLog(true);
      const {
        url,
        code,
        pass
      } = serverCreds();
      if (url && code && pass) apiLoadLogs(url, code, pass, null, 500).then(d => setAdventEntries(d.logs || [])).catch(() => {});
    }
  }, "\uD83D\uDCD6 Abenteuerlog"), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => setShowKampf(true)
  }, "\u2694 Kampf", !kampf || !kampf.aktiv ? '' : kampf.phase === 'vorbereitung' ? ' · Vorbereitung' : ' · Runde ' + kampf.runde), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-tool" + (showChronik ? " an" : ""),
    onClick: chronikUmschalten
  }, "\uD83D\uDD70 Chronik", chronikFaellig > 0 ? ' · ' + chronikFaellig + ' fällig' : ''), !isDmMode && kampfSichtDaten && /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => setShowKampfSicht(true)
  }, "\u2694 Kampf \xB7 Runde ", kampfSichtDaten.runde || 1), /*#__PURE__*/React.createElement("button", {
    className: "btn-tool" + (showAutomat ? " an" : ""),
    onClick: () => setShowAutomat(o => !o)
  }, "\uD83C\uDFB0 Taverne")), svCode ? /*#__PURE__*/React.createElement(React.Fragment, null, (offeneAenderungen > 0 || syncStatus === "busy" || syncStatus === "err") && /*#__PURE__*/React.createElement("div", {
    className: "sync-line"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sync-dot " + (offeneAenderungen > 0 ? "err" : syncStatus === "busy" ? "busy" : "err")
  }), /*#__PURE__*/React.createElement("span", {
    className: "sync-line-msg" + (offeneAenderungen > 0 ? " offen" : "")
  }, offeneAenderungen > 0 ? offeneAenderungen + " nicht gesichert" : syncMsg || "…")), /*#__PURE__*/React.createElement("div", {
    className: "sync-actions"
  }, konto ? /*#__PURE__*/React.createElement("button", {
    className: "btn-konto",
    onClick: kontoOeffnen,
    title: 'Angemeldet als ' + konto.name + (rolleIn(konto, svCode) ? ' · ' + rolleIn(konto, svCode) : '') + ' — Passwort ändern, und was über dich gespeichert ist'
  }, /*#__PURE__*/React.createElement("span", {
    className: "btn-konto-name"
  }, "\uD83D\uDC64 ", konto.name), konto.ist_admin && /*#__PURE__*/React.createElement("i", {
    className: "btn-konto-rolle"
  }, "Verwaltung"), !konto.ist_admin && isDmMode && /*#__PURE__*/React.createElement("i", {
    className: "btn-konto-rolle"
  }, "Spielleitung")) : /*#__PURE__*/React.createElement("span", {
    className: "btn-konto leer"
  }, "Ohne Konto verbunden"), konto && leitetAbenteuer(konto, advDms, svCode, advId) && !isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-sync dm",
    title: "In den DM-Modus wechseln",
    onClick: dmMitKonto
  }, "\uD83D\uDD2E DM"), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-sync dm active",
    title: "DM-Modus verlassen",
    onClick: doDmLogout
  }, "\uD83D\uDD2E aus"), /*#__PURE__*/React.createElement("button", {
    className: "btn-sync schmal",
    title: "Daten neu vom Server laden",
    "aria-label": "Neu laden",
    onClick: () => doSyncLoad(svUrl, svCode, svPass)
  }, "\u21BA"), /*#__PURE__*/React.createElement("button", {
    className: "btn-sync schmal",
    title: "Abmelden",
    "aria-label": "Abmelden",
    onClick: signOut
  }, "\u238B"))) : /*#__PURE__*/React.createElement("button", {
    className: "btn-sync",
    onClick: () => {
      setSetupErr('');
      setSetupForm(f => ({
        ...f,
        pass: ''
      }));
      setShowSetup(true);
    }
  }, "\uD83D\uDC64 Anmelden"))), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, isTouchLayout && mv === "list" && /*#__PURE__*/React.createElement("div", {
    className: "mobile-list-screen"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 12px 12px",
      borderBottom: "1px solid var(--border)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("img", {
    className: "hb-logo schmal",
    src: "logo.png",
    alt: "Heldenbuch",
    width: 280,
    height: 280
  }), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-wort"
  }, "Heldenbuch", /*#__PURE__*/React.createElement("span", {
    className: "app-version"
  }, HB_VERSION)), svCode && (offeneAenderungen > 0 || syncStatus === "busy" || syncStatus === "err") && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sync-dot " + (offeneAenderungen > 0 ? "err" : syncStatus === "busy" ? "busy" : "err")
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 9,
      color: 'var(--text-muted)',
      letterSpacing: '0.08em'
    }
  }, offeneAenderungen > 0 ? offeneAenderungen + ' nicht gesichert' : syncMsg || '…')), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-tools",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => {
      setShowDB(true);
      setDbForm(null);
      setDbFormId(null);
    }
  }, "\uD83D\uDCDA Datenbank"), /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => {
      setAdventSearch('');
      setAdventTabFilter([]);
      setShowAdventLog(true);
    }
  }, "\uD83D\uDCD6 Abenteuerlog"), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => setShowKampf(true)
  }, "\u2694 Kampf", !kampf || !kampf.aktiv ? '' : kampf.phase === 'vorbereitung' ? ' · Vorbereitung' : ' · Runde ' + kampf.runde), !isDmMode && kampfSichtDaten && /*#__PURE__*/React.createElement("button", {
    className: "btn-tool",
    onClick: () => setShowKampfSicht(true)
  }, "\u2694 Kampf \xB7 Runde ", kampfSichtDaten.runde || 1), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-tool" + (showChronik ? " an" : ""),
    onClick: chronikUmschalten
  }, "\uD83D\uDD70 Chronik", chronikFaellig > 0 ? ' · ' + chronikFaellig + ' fällig' : ''), /*#__PURE__*/React.createElement("button", {
    className: "btn-tool" + (showAutomat ? " an" : ""),
    onClick: () => setShowAutomat(o => !o)
  }, "\uD83C\uDFB0 Taverne")), svCode && /*#__PURE__*/React.createElement("div", {
    className: "sync-actions",
    style: {
      marginTop: 10
    }
  }, konto ? /*#__PURE__*/React.createElement("button", {
    className: "btn-konto",
    onClick: kontoOeffnen,
    title: 'Angemeldet als ' + konto.name + (rolleIn(konto, svCode) ? ' · ' + rolleIn(konto, svCode) : '') + ' — Passwort ändern, und was über dich gespeichert ist'
  }, /*#__PURE__*/React.createElement("span", {
    className: "btn-konto-name"
  }, "\uD83D\uDC64 ", konto.name), konto.ist_admin && /*#__PURE__*/React.createElement("i", {
    className: "btn-konto-rolle"
  }, "Verwaltung"), !konto.ist_admin && isDmMode && /*#__PURE__*/React.createElement("i", {
    className: "btn-konto-rolle"
  }, "Spielleitung")) : /*#__PURE__*/React.createElement("span", {
    className: "btn-konto leer"
  }, "Ohne Konto verbunden"), konto && leitetAbenteuer(konto, advDms, svCode, advId) && !isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-sync dm",
    title: "In den DM-Modus wechseln",
    onClick: dmMitKonto
  }, "\uD83D\uDD2E DM"), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-sync dm active",
    title: "DM-Modus verlassen",
    onClick: doDmLogout
  }, "\uD83D\uDD2E aus"), /*#__PURE__*/React.createElement("button", {
    className: "btn-sync schmal",
    title: "Daten neu vom Server laden",
    "aria-label": "Neu laden",
    onClick: () => doSyncLoad(svUrl, svCode, svPass)
  }, "\u21BA"), /*#__PURE__*/React.createElement("button", {
    className: "btn-sync schmal",
    title: "Abmelden",
    "aria-label": "Abmelden",
    onClick: signOut
  }, "\u238B"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 0 4px'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      width: '100%',
      padding: '5px 10px',
      fontSize: 12,
      boxSizing: 'border-box',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      color: 'var(--text-primary)'
    },
    placeholder: "\uD83D\uDD0D Held suchen...",
    value: charSearch,
    onChange: e => setCharSearch(e.target.value)
  })), /*#__PURE__*/React.createElement(CharList, null))), isTouchLayout && mv === "sheet" && /*#__PURE__*/React.createElement("div", {
    className: "mobile-sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobile-topbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "mobile-back",
    onClick: () => setMv("list")
  }, "\u2190 Helden"), /*#__PURE__*/React.createElement("div", {
    className: "mobile-topbar-title"
  }, cur && cur.name || "—"), /*#__PURE__*/React.createElement("div", {
    className: "mobile-topbar-actions"
  }, cur && (darfBearbeiten ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "5px 8px",
      fontSize: 11
    },
    onClick: openEdit
  }, "\u270E"), cur.archived ? /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "5px 8px",
      fontSize: 11,
      borderColor: "var(--gold-dim)",
      color: "var(--gold-dim)"
    },
    onClick: () => unarchiveChar(cur.id)
  }, "\u21A9") : /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    style: {
      padding: "5px 8px",
      fontSize: 11,
      color: "var(--text-muted)"
    },
    onClick: () => appConfirm("Charakter archivieren?", archiveChar, "Archivieren")
  }, "\uD83D\uDCE6"), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon btn-delete",
    style: {
      padding: "5px 8px",
      fontSize: 11
    },
    onClick: deleteChar
  }, "\u2715")) : /*#__PURE__*/React.createElement("span", {
    className: "fremder-bogen",
    title: "Dieser Bogen geh\xF6rt jemand anderem"
  }, "\uD83D\uDD12")))), /*#__PURE__*/React.createElement(Sheet, null)), !isTouchLayout && /*#__PURE__*/React.createElement("div", {
    className: "desktop-sheet"
  }, /*#__PURE__*/React.createElement(Sheet, null))), isDmMode && showChronik && /*#__PURE__*/React.createElement(ChronikLeiste, {
    chronik: chronik,
    advId: advId,
    advName: advName,
    chars: chars,
    ueberlagert: isTouchLayout,
    onZeit: () => setZeitOffen(true),
    onNeu: () => setEreignisForm({
      e: newEreignis(advId, chronikJetzt()),
      neu: true
    }),
    onBearbeiten: e => setEreignisForm({
      e,
      neu: false
    }),
    onLoeschen: ereignisLoeschen,
    onAbhaken: ereignisAbhaken,
    onWiederOeffnen: ereignisWiederOeffnen,
    onSchliessen: chronikUmschalten
  }), /*#__PURE__*/React.createElement("nav", {
    className: "mobile-bottom-nav",
    style: {
      left: isTouchLayout || sidebarCollapsed ? 0 : 260,
      right: !isTouchLayout && isDmMode && showChronik ? 300 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mobile-bottom-nav-inner-wrap"
  }, mv === "list" ? /*#__PURE__*/React.createElement("button", {
    className: "mobile-nav-btn active"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mobile-nav-icon"
  }, "\u2694"), /*#__PURE__*/React.createElement("span", {
    className: "mobile-nav-label"
  }, "Helden")) : [["stats", "🎯", "Attribute"], ["aktionen", "⚔️", "Aktionen"], ["zauber", "✨", "Zauber"], ["merkmale", "⭐", "Merkmale"], ["inventar", "🎒", "Inventar"], ["notizen", "📜", "Notizen"], ["log", "📋", "Log"]].map(([k, ic, lb]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: "mobile-nav-btn" + (tab === k ? " active" : ""),
    onClick: () => {
      setTab(k);
      if (k !== "inventar") {
        setTransferMode(false);
        setTransferSel(new Set());
      }
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mobile-nav-icon"
  }, ic), /*#__PURE__*/React.createElement("span", {
    className: "mobile-nav-label"
  }, lb))))), /*#__PURE__*/React.createElement("button", {
    className: "mobile-fab",
    onClick: mv === "list" ? openNew : () => setMv("list")
  }, mv === "list" ? "+" : "☰")), showCF && ec && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, chars.find(c => c.id === ec.id) ? "✎ Charakter bearbeiten" : "✶ Neuer Charakter"), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      width: "100%",
      boxSizing: "border-box"
    },
    placeholder: "z.B. Aragorn",
    value: ec.name,
    onChange: e => setEc({
      ...ec,
      name: e.target.value
    }),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Rasse"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    style: {
      width: "100%"
    },
    value: ec.race,
    onChange: e => setEc({
      ...ec,
      race: e.target.value
    })
  }, RACES.map(r => /*#__PURE__*/React.createElement("option", {
    key: r
  }, r)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Hintergrund"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      width: "100%",
      boxSizing: "border-box"
    },
    placeholder: "z.B. Soldat",
    value: ec.background,
    onChange: e => setEc({
      ...ec,
      background: e.target.value
    })
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      margin: "4px 0 10px"
    }
  }, "Klassen & Stufen"), /*#__PURE__*/React.createElement("div", {
    className: "multiclass-row",
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    style: {
      flex: 1
    },
    value: ec.charClass,
    onChange: e => setEc({
      ...ec,
      charClass: e.target.value
    })
  }, klassenWahl(ec.charClass).map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: "1",
    max: "20",
    wert: ec.level,
    onWert: v => setEc({
      ...ec,
      level: v
    }),
    style: {
      maxWidth: 64,
      textAlign: "center"
    },
    placeholder: "Stufe"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif",
      whiteSpace: "nowrap",
      alignSelf: "center"
    }
  }, "Hauptklasse")), (ec.multiclasses || []).map((mc, i) => /*#__PURE__*/React.createElement("div", {
    className: "multiclass-row",
    key: i,
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    style: {
      flex: 1
    },
    value: mc.charClass,
    onChange: e => setEc({
      ...ec,
      multiclasses: ec.multiclasses.map((m, j) => j === i ? {
        ...m,
        charClass: e.target.value
      } : m)
    })
  }, klassenWahl(mc.charClass).map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: "1",
    max: "20",
    wert: mc.level,
    onWert: v => setEc({
      ...ec,
      multiclasses: ec.multiclasses.map((m, j) => j === i ? {
        ...m,
        level: v
      } : m)
    }),
    style: {
      maxWidth: 64,
      textAlign: "center"
    },
    placeholder: "Stufe"
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn-sm-del",
    onClick: () => setEc({
      ...ec,
      multiclasses: ec.multiclasses.filter((_, j) => j !== i)
    })
  }, "\u2715"))), /*#__PURE__*/React.createElement("button", {
    className: "btn-sm-add",
    onClick: () => setEc({
      ...ec,
      multiclasses: [...(ec.multiclasses || []), {
        charClass: "Kämpfer",
        level: 1
      }]
    })
  }, "+ Multiclass hinzuf\xFCgen"), /*#__PURE__*/React.createElement("div", {
    className: "form-actions",
    style: {
      marginTop: 20
    }
  }, isDmMode && /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      cursor: "pointer",
      marginRight: "auto"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: ec.dmOnly || false,
    onChange: e => setEc({
      ...ec,
      dmOnly: e.target.checked
    }),
    style: {
      width: 16,
      height: 16,
      cursor: "pointer",
      accentColor: "#c060a0"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 11,
      color: "#c060a0"
    }
  }, "\uD83D\uDD2E Nur DM-Modus")), /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setShowCF(false)
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: saveChar
  }, "\u2736 Speichern")))), showWF && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal breit",
    style: {
      maxWidth: 820
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, wfEditId ? "Waffe bearbeiten" : "Neue Waffe"), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. Langschwert +1",
    value: wf.name,
    onChange: e => setWf({
      ...wf,
      name: e.target.value
    }),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Schaden"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "1W6",
    value: wf.damage,
    onChange: e => setWf({
      ...wf,
      damage: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Schadensart"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: wf.damageType,
    onChange: e => setWf({
      ...wf,
      damageType: e.target.value
    })
  }, DTYPES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Attribut"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: wf.attrKey || "str",
    onChange: e => setWf({
      ...wf,
      attrKey: e.target.value
    })
  }, WATTRS.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.key,
    value: a.key
  }, a.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Reichweite"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "1,5m",
    value: wf.range || "",
    onChange: e => setWf({
      ...wf,
      range: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Angriffsbonus (+/\u2212)"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    placeholder: "0",
    wert: wf.attackBonus || 0,
    onWert: v => setWf({
      ...wf,
      attackBonus: v
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Optionen"), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 12,
      color: "var(--text-secondary)",
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    style: {
      accentColor: "var(--gold)",
      width: 15,
      height: 15
    },
    checked: wf.proficient !== false,
    onChange: e => setWf({
      ...wf,
      proficient: e.target.checked
    })
  }), "\xDCbung (Proficiency)")), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Eigenschaften"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 2
    }
  }, WPROPS.map(p => {
    const on = (wf.properties || []).includes(p);
    return /*#__PURE__*/React.createElement("button", {
      key: p,
      onClick: () => setWf({
        ...wf,
        properties: on ? (wf.properties || []).filter(x => x !== p) : [...(wf.properties || []), p]
      }),
      style: {
        padding: "4px 12px",
        borderRadius: 12,
        border: "1px solid",
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        cursor: "pointer",
        borderColor: on ? "var(--gold)" : "var(--border)",
        background: on ? "var(--bg-panel)" : "var(--bg-card)",
        color: on ? "var(--gold)" : "var(--text-muted)"
      }
    }, p);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-halb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Beschreibung (optional)"), /*#__PURE__*/React.createElement(RichEditor, {
    value: wf.description || '',
    onChange: v => setWf({
      ...wf,
      description: v
    }),
    placeholder: "z.B. Reichweite geworfen: 9/36m, magisch...",
    rows: 2
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-halb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Bild (optional)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, wf.imageData && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: wf.imageData,
    alt: "",
    style: {
      width: 80,
      height: 64,
      objectFit: 'contain',
      borderRadius: 4,
      border: '1px solid var(--border)',
      background: 'var(--bg-void)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setWf({
      ...wf,
      imageData: ''
    }),
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--crimson)',
      border: 'none',
      color: '#fff',
      fontSize: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("label", {
    style: {
      flex: 1,
      padding: '10px 14px',
      background: 'var(--bg-card)',
      border: '1px dashed var(--border)',
      borderRadius: 6,
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--text-muted)',
      fontFamily: "'Roboto Condensed',sans-serif",
      letterSpacing: '0.05em'
    }
  }, "\uD83D\uDCF7 ", wf.imageData ? 'Bild ändern' : 'Bild auswählen', /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: e => {
      const file = e.target.files?.[0];
      if (!file) return;
      // 600px: das Bild fuellt die Karte formatfuellend aus und
      // wird dabei beschnitten, dafuer braucht es mehr Reserve
      // als die reine Anzeigebreite. Transparenz bleibt
      // erhalten, siehe compressImage.
      compressImage(file, 600, data => {
        if (data) setWf(prev => ({
          ...prev,
          imageData: data
        }));
      });
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      marginTop: 5,
      fontStyle: 'italic'
    }
  }, "F\xFCllt die Karte im Format 5:7 aus, hochkant wird also am wenigsten beschnitten. Transparente PNGs bleiben transparent.")), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "\u2726 Effekte"), /*#__PURE__*/React.createElement(EffectEditor, {
    effects: wf.effects,
    onChange: v => setWf({
      ...wf,
      effects: v
    }),
    hint: "Wirken, solange die Waffe angelegt ist."
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => {
      setShowWF(false);
      setWfEditId(null);
    }
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: addWeapon
  }, wfEditId ? "Speichern" : "+ Hinzufügen")))), showFF && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal breit",
    style: {
      maxWidth: 700
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, ffEditId ? '✏️ Fähigkeit bearbeiten' : '⭐ Neue Fähigkeit'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-halb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. Bardische Inspiration, Wildform...",
    value: ff.name,
    onChange: e => setFf({
      ...ff,
      name: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-halb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Quelle (optional)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. Barde Stufe 1, Kampfstil...",
    value: ff.source,
    onChange: e => setFf({
      ...ff,
      source: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Beschreibung"), /*#__PURE__*/React.createElement(RichEditor, {
    value: ff.description,
    onChange: v => setFf({
      ...ff,
      description: v
    }),
    placeholder: "Beschreibung der F\xE4higkeit, Nutzungsbedingungen...",
    rows: 6
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "\u2726 Effekte"), /*#__PURE__*/React.createElement(EffectEditor, {
    effects: ff.effects || [],
    onChange: v => setFf({
      ...ff,
      effects: v
    }),
    hint: "Wirken, solange das Merkmal eingeschaltet ist \u2014 z.B. Defensiver Kampfstil +1 RK."
  }), (ff.effects || []).length > 0 && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: ff.effectsActive !== false,
    onChange: e => setFf({
      ...ff,
      effectsActive: e.target.checked
    }),
    style: {
      width: 16,
      height: 16,
      cursor: 'pointer',
      accentColor: 'var(--arcane-bright)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, "Wirkt gerade")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => {
      setShowFF(false);
      setFfEditId(null);
    }
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: saveFeature
  }, ffEditId ? '✓ Speichern' : '+ Hinzufügen')))), showSF && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal breit",
    style: {
      maxWidth: 880
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, sfEditId ? '✏️ Zauber bearbeiten' : '✨ Neuer Zauber'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. Feuerball",
    value: sf.name,
    onChange: e => setSf({
      ...sf,
      name: e.target.value
    }),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Grad"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: sf.level,
    onChange: e => setSf({
      ...sf,
      level: +e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: 0
  }, "\u221E Zaubertrick"), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: l
  }, "Grad ", l)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Schule"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: sf.school,
    onChange: e => setSf({
      ...sf,
      school: e.target.value
    })
  }, SCHOOLS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Wirkzeit"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "1 Aktion",
    value: sf.castingTime,
    onChange: e => setSf({
      ...sf,
      castingTime: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Reichweite"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "9 m",
    value: sf.range,
    onChange: e => setSf({
      ...sf,
      range: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Dauer"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "Sofort",
    value: sf.duration,
    onChange: e => setSf({
      ...sf,
      duration: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Komponenten"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "V, S, M (...)",
    value: sf.components || '',
    onChange: e => setSf({
      ...sf,
      components: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-halb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Beschreibung"), /*#__PURE__*/React.createElement(RichEditor, {
    value: sf.description,
    onChange: v => setSf({
      ...sf,
      description: v
    }),
    placeholder: "Wirkung des Zaubers...",
    rows: 4
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-halb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label zauber-wirkung-kopf"
  }, "Wirkung im Kampf", /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    title: "W\xFCrfel, Rettungswurf und Steigerung aus der Beschreibung \xFCbernehmen",
    onClick: () => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        ...wirkungAusText(f.description, f.damageTags)
      }
    }))
  }, "\u21A7 Aus der Beschreibung lesen")), /*#__PURE__*/React.createElement("div", {
    className: "zauber-wirkung"
  }, /*#__PURE__*/React.createElement("label", {
    className: "zw-feld"
  }, /*#__PURE__*/React.createElement("span", null, "Art"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: (sf.wirkung || {}).art || '',
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        art: e.target.value
      }
    }))
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keine \u2014"), /*#__PURE__*/React.createElement("option", {
    value: "schaden"
  }, "Schaden"), /*#__PURE__*/React.createElement("option", {
    value: "heilung"
  }, "Heilung"), /*#__PURE__*/React.createElement("option", {
    value: "temp"
  }, "Tempor\xE4re TP"))), /*#__PURE__*/React.createElement("label", {
    className: "zw-feld"
  }, /*#__PURE__*/React.createElement("span", null, "W\xFCrfel"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "8W6",
    value: (sf.wirkung || {}).wuerfel || '',
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        wuerfel: e.target.value
      }
    }))
  })), /*#__PURE__*/React.createElement("label", {
    className: "zw-feld"
  }, /*#__PURE__*/React.createElement("span", null, "Je Grad dar\xFCber"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "1W6",
    value: (sf.wirkung || {}).proGrad || '',
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        proGrad: e.target.value
      }
    }))
  })), /*#__PURE__*/React.createElement("label", {
    className: "zw-feld"
  }, /*#__PURE__*/React.createElement("span", null, "Rettungswurf"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: (sf.wirkung || {}).rettung || '',
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        rettung: e.target.value
      }
    }))
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 keiner, Angriffswurf \u2014"), RETTUNGEN.map(r => /*#__PURE__*/React.createElement("option", {
    key: r.k,
    value: r.k
  }, r.l)))), /*#__PURE__*/React.createElement("label", {
    className: "zw-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!(sf.wirkung || {}).halb,
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        halb: e.target.checked
      }
    }))
  }), /*#__PURE__*/React.createElement("span", null, "Bestanden = halber Schaden")), /*#__PURE__*/React.createElement("label", {
    className: "zw-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!(sf.wirkung || {}).attribut,
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        attribut: e.target.checked
      }
    }))
  }), /*#__PURE__*/React.createElement("span", null, "+ Zauberattribut")), /*#__PURE__*/React.createElement("label", {
    className: "zw-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!(sf.wirkung || {}).flaeche,
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        flaeche: e.target.checked
      }
    }))
  }), /*#__PURE__*/React.createElement("span", null, "Fl\xE4che \u2014 eine Zahl f\xFCr alle")), /*#__PURE__*/React.createElement("label", {
    className: "zw-schalter"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: ((sf.wirkung || {}).zieleProGrad || 0) > 0,
    onChange: e => setSf(f => ({
      ...f,
      wirkung: {
        ...(f.wirkung || {}),
        zieleProGrad: e.target.checked ? 1 : 0
      }
    }))
  }), /*#__PURE__*/React.createElement("span", null, "Ein Ziel mehr je Grad"))), hatWirkung(sf.wirkung) && /*#__PURE__*/React.createElement("div", {
    className: "zw-probe"
  }, "Auf Grad ", Math.max(1, sf.level || 1), ": ", /*#__PURE__*/React.createElement("b", null, wuerfelAufGrad(sf.wirkung, sf.level, sf.level) || '—'), (sf.wirkung || {}).proGrad && (sf.level || 0) < 9 && /*#__PURE__*/React.createElement(React.Fragment, null, ' · ', "auf Grad ", Math.min(9, (sf.level || 1) + 1), ":", ' ', /*#__PURE__*/React.createElement("b", null, wuerfelAufGrad(sf.wirkung, sf.level, Math.min(9, (sf.level || 1) + 1)))), (sf.wirkung || {}).rettung && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", RETTUNG_KURZ[(sf.wirkung || {}).rettung], (sf.wirkung || {}).halb ? ', bestanden halbiert' : ', bestanden ohne Wirkung'), (sf.wirkung || {}).flaeche && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", /*#__PURE__*/React.createElement("b", null, "Fl\xE4che"), ": eine Zahl f\xFCr alle Ziele"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Klassen"), /*#__PURE__*/React.createElement("div", {
    className: "marken-reihe",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 4
    }
  }, ['Artifizient', 'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Kämpfer', 'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer'].map(c => {
    const cc = {
      'Artifizient': '#70b8c8',
      'Barbar': '#c84040',
      'Barde': '#4090c0',
      'Druide': '#52b788',
      'Hexenmeister': '#9060c0',
      'Kämpfer': '#c08040',
      'Kleriker': '#e0c040',
      'Magier': '#6080d0',
      'Mönch': '#d09040',
      'Paladin': '#e0a030',
      'Schurke': '#808080',
      'Waldläufer': '#70a050',
      'Zauberer': '#c060a0'
    };
    const col = cc[c] || '#c9a84c';
    const on = (sf.classes || []).includes(c);
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      type: "button",
      onClick: () => setSf(f => ({
        ...f,
        classes: on ? (f.classes || []).filter(x => x !== c) : [...(f.classes || []), c]
      })),
      style: {
        padding: '2px 9px',
        borderRadius: 10,
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        cursor: 'pointer',
        border: '1px solid ' + (on ? col : col + '40'),
        background: on ? col + '22' : 'var(--bg-card)',
        color: on ? col : 'var(--text-muted)'
      }
    }, c);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Schadenstypen"), /*#__PURE__*/React.createElement("div", {
    className: "marken-reihe",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 4
    }
  }, ['Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekrotisch', 'Gleißend', 'Psychisch', 'Energie', 'Schall', 'Hieb', 'Stich', 'Wucht'].map(d => {
    const on = (sf.damageTags || []).includes(d);
    const dc = {
      Feuer: '#e07030',
      Kälte: '#70b8d8',
      Blitz: '#c0d850',
      Säure: '#90c040',
      Gift: '#80b030',
      Nekrose: '#9060c0',
      Strahlend: '#f0e060',
      Psychisch: '#c070d0',
      Kraft: '#80a0f0',
      Hieb: '#a07050',
      Stich: '#b08060',
      Wucht: '#c09070'
    }[d] || '#aaa';
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      type: "button",
      onClick: () => setSf(f => ({
        ...f,
        damageTags: on ? (f.damageTags || []).filter(x => x !== d) : [...(f.damageTags || []), d]
      })),
      style: {
        padding: '2px 9px',
        borderRadius: 10,
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        cursor: 'pointer',
        border: `1px solid ${on ? dc : dc + '40'}`,
        background: on ? dc + '22' : 'var(--bg-card)',
        color: on ? dc : 'var(--text-muted)'
      }
    }, "\u2694\uFE0F ", d);
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => {
      setShowSF(false);
      setSfEditId(null);
    }
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: addSpell
  }, sfEditId ? '✓ Speichern' : '+ Hinzufügen')))), showNF && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal breit",
    style: {
      maxWidth: 780
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, nfEditId ? '✏️ Notiz bearbeiten' : '📄 Neue Notiz'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Titel"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. Hintergrundgeschichte",
    value: nf.title,
    onChange: e => setNf({
      ...nf,
      title: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Tags"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '6px 8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      minHeight: 38
    }
  }, (nf.tags || []).map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-bright)',
      borderRadius: 12,
      padding: '2px 8px',
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 10,
      color: 'var(--gold)',
      letterSpacing: '0.06em'
    }
  }, t, /*#__PURE__*/React.createElement("button", {
    onClick: () => setNf({
      ...nf,
      tags: (nf.tags || []).filter((_, j) => j !== i)
    }),
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      fontSize: 11,
      padding: 0,
      lineHeight: 1
    }
  }, "\u2715"))), /*#__PURE__*/React.createElement("input", {
    style: {
      flex: 1,
      minWidth: 80,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontFamily: "'Roboto',sans-serif",
      fontSize: 14,
      color: 'var(--text-primary)'
    },
    placeholder: (nf.tags || []).length === 0 ? "z.B. Kampagne" : "+ Tag...",
    onKeyDown: e => {
      if ((e.key === 'Enter' || e.key === ',' || e.key === ';') && e.target.value.trim()) {
        e.preventDefault();
        setNf({
          ...nf,
          tags: [...(nf.tags || []), e.target.value.trim()]
        });
        e.target.value = '';
      } else if (e.key === 'Backspace' && !e.target.value && (nf.tags || []).length > 0) {
        setNf({
          ...nf,
          tags: (nf.tags || []).slice(0, -1)
        });
      }
    },
    onBlur: e => {
      if (e.target.value.trim()) {
        setNf({
          ...nf,
          tags: [...(nf.tags || []), e.target.value.trim()]
        });
        e.target.value = '';
      }
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      marginTop: 3
    }
  }, "Enter oder Komma zum Hinzuf\xFCgen \xB7 Backspace zum Entfernen")), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Inhalt"), /*#__PURE__*/React.createElement(RichEditor, {
    value: nf.content,
    onChange: v => setNf({
      ...nf,
      content: v
    }),
    placeholder: "Schreibe hier deine Notiz...",
    rows: 10
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => {
      setShowNF(false);
      setNfEditId(null);
    }
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: saveNote
  }, nfEditId ? '✓ Speichern' : '+ Hinzufügen')))), showIF && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal breit",
    style: {
      maxWidth: 840
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, itfEditId ? '✏️ Gegenstand bearbeiten' : '🎒 Neuer Gegenstand'), !itfEditId && (() => {
    const activeItems = isDmMode ? [...(dmLibrary.item || []), ...(userLibrary.item || [])] : userLibrary.item || [];
    if (activeItems.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: isDmMode ? '#c060a0' : 'var(--gold)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase'
      }
    }, isDmMode ? '🔮 DM-Datenbank' : '📚 Aus Datenbank'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        fontStyle: 'italic'
      }
    }, activeItems.length, " Eintr\xE4ge")), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      style: {
        marginBottom: 6,
        padding: '5px 10px',
        fontSize: 12
      },
      placeholder: "Suchen...",
      onChange: e => {
        const q = e.target.value.toLowerCase();
        const wrap = e.target.closest('.form-modal').querySelector('.db-item-list');
        if (wrap) [...wrap.children].forEach(c => {
          c.style.display = c.dataset.name.includes(q) ? '' : 'none';
        });
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "db-item-list",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 5,
        maxHeight: 110,
        overflowY: 'auto'
      }
    }, activeItems.map((item, i) => {
      const r = RARITIES.find(x => x.key === item.rarity) || RARITIES[0];
      const isDmItem = isDmMode && (dmLibrary.item || []).some(d => d.name === item.name);
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        "data-name": (item.name || '').toLowerCase(),
        onClick: () => setItf({
          ...newItem(),
          ...item,
          id: Date.now().toString(),
          libRef: item.name
        }),
        title: item.description || item.source || '',
        style: {
          padding: '3px 10px',
          borderRadius: 12,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 10,
          cursor: 'pointer',
          border: '1px solid ' + (isDmItem ? '#c060a060' : r.color + '60'),
          background: isDmItem ? 'rgba(192,96,160,0.12)' : r.color + '15',
          color: isDmItem ? '#c060a0' : r.color,
          letterSpacing: '0.05em'
        }
      }, item.name);
    })));
  })(), showIconPicker && (() => {
    const ICON_CATS = [{
      label: 'Nahkampfwaffen',
      icons: ['⚔', '🗡', '🔪', '🪃', '🪓', '🏏', '🪝', '⚒', '🔨', '🪚', '🗾', '🧨']
    }, {
      label: 'Fernkampf & Magie',
      icons: ['🏹', '🪃', '⚡', '🌟', '💥', '🔥', '❄', '🌊', '💨', '☄', '🌀', '🔮', '🌀', '✨', '💫', '🌙']
    }, {
      label: 'Rüstung & Schutz',
      icons: ['🛡', '⛓', '🪖', '🧤', '🥋', '🎭', '🧣', '🧥', '👘', '🦺', '🎩', '👑']
    }, {
      label: 'Schmuck & Artefakte',
      icons: ['💍', '📿', '🪬', '💎', '🪩', '🏺', '🪆', '🪄', '🎀', '🧿', '⭕', '♾']
    }, {
      label: 'Tränke & Essen',
      icons: ['🧪', '🔬', '🫙', '🍶', '🍵', '🫖', '🍷', '🍺', '🍯', '🥃', '🍎', '🍇', '🍄', '🌹', '🌿', '🌾']
    }, {
      label: 'Bücher & Schriften',
      icons: ['📜', '📖', '📚', '📝', '📒', '📋', '🗾', '🔭', '🔬', '🧭', '📡', '📅']
    }, {
      label: 'Werkzeuge & Schlösser',
      icons: ['🔑', '🗝', '⛏', '🔧', '🪛', '🔩', '🪤', '🧰', '🪜', '🪣', '⚙', '🔗', '📎', '✂', '🧲', '🪝']
    }, {
      label: 'Licht & Feuer',
      icons: ['🕯', '🪔', '🔦', '💡', '🔥', '🪵', '🎇', '🎆', '⚡', '☀', '🌟', '✴']
    }, {
      label: 'Säcke & Behälter',
      icons: ['🎒', '👜', '💰', '💴', '💵', '🪙', '📦', '🗃', '🧺', '🪣', '🎁', '📫']
    }, {
      label: 'Natur & Edelsteine',
      icons: ['🪨', '🌊', '🌿', '🍀', '🌱', '🌾', '🌰', '🌹', '🌻', '💧', '🔱', '🌙', '☀', '⭐', '🌈', '❄']
    }, {
      label: 'Tiere & Monster',
      icons: ['🐲', '🦄', '🦅', '🐺', '🦊', '🐗', '🦂', '🕷', '🦇', '🐍', '🦁', '🐻', '🦎', '🐙', '🦀', '🦟', '🐉', '🦋', '🦩', '🦚', '🦜', '🐓', '🦑']
    }, {
      label: 'Körper & Seele',
      icons: ['💀', '☠', '👁', '🫀', '🧠', '🦷', '🦴', '🩸', '💉', '🩺', '🧬', '🫁', '🤚', '✊', '🤝', '👁️‍🗨️']
    }, {
      label: 'Sonstiges',
      icons: ['🎲', '🎯', '🎪', '🎠', '🏺', '🎵', '🎶', '🎸', '📯', '🥁', '🎺', '🎻', '🃏', '🎴', '🀄', '🎭', '🎬', '🎨']
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay",
      onClick: () => setShowIconPicker(false)
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 380
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-title",
      style: {
        marginBottom: 12
      }
    }, "Icon w\xE4hlen"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        padding: '8px 12px',
        background: 'var(--bg-void)',
        borderRadius: 6,
        border: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 32
      }
    }, itf.icon || '🎒'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--gold)'
      }
    }, "Ausgew\xE4hlt"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)'
      }
    }, "Klicke ein Icon um es auszuw\xE4hlen"))), ICON_CATS.map(cat => /*#__PURE__*/React.createElement("div", {
      key: cat.label,
      style: {
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 5
      }
    }, cat.label), /*#__PURE__*/React.createElement("div", {
      className: "icon-picker-grid"
    }, cat.icons.map(ic => /*#__PURE__*/React.createElement("button", {
      key: ic,
      className: "icon-picker-btn" + (itf.icon === ic ? " selected" : ""),
      onClick: () => {
        setItf(p => ({
          ...p,
          icon: ic
        }));
        setShowIconPicker(false);
      }
    }, ic))))), /*#__PURE__*/React.createElement("div", {
      className: "form-actions",
      style: {
        marginTop: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-cancel",
      onClick: () => setShowIconPicker(false)
    }, "Schlie\xDFen"))));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowIconPicker(true),
    style: {
      fontSize: 24,
      width: 42,
      height: 42,
      borderRadius: 6,
      border: '1px solid var(--border)',
      background: 'var(--bg-card)',
      cursor: 'pointer',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: "Icon w\xE4hlen"
  }, itf.icon || '🎒'), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    style: {
      flex: 1
    },
    placeholder: "z.B. Trank der Heilung",
    value: itf.name,
    onChange: e => setItf({
      ...itf,
      name: e.target.value
    }),
    autoFocus: true
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Seltenheit"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: itf.rarity,
    onChange: e => setItf({
      ...itf,
      rarity: e.target.value
    })
  }, RARITIES.map(r => /*#__PURE__*/React.createElement("option", {
    key: r.key,
    value: r.key
  }, r.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Menge"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: "1",
    wert: itf.qty,
    onWert: v => setItf({
      ...itf,
      qty: v
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Gewicht (kg, optional)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: "0",
    step: "0.1",
    placeholder: "z.B. 1.5",
    value: itf.weight,
    onChange: e => setItf({
      ...itf,
      weight: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!itf.kampf,
    onChange: e => setItf({
      ...itf,
      kampf: e.target.checked
    }),
    style: {
      width: 16,
      height: 16,
      cursor: 'pointer',
      accentColor: 'var(--gold)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, "\u2694 Im Kampf zu verwenden \u2014 steht im Zugfenster zur Wahl, Benutzen zieht die Menge ab"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Ausr\xFCstungsplatz"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: itf.gearKind || '',
    onChange: e => {
      const k = e.target.value;
      const art = k === 'ruestung' ? itf.armorType && itf.armorType !== 'shield' ? itf.armorType : 'light' : k === 'schild' ? 'shield' : '';
      const basis = (ARMOR_KINDS.find(a => a.key === art) || {}).basis || 0;
      setItf({
        ...itf,
        gearKind: k,
        armorType: art,
        baseAC: art ? +itf.baseAC || basis : 0
      });
    }
  }, GEAR_KINDS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g.key,
    value: g.key
  }, g.label)))), itf.gearKind === 'ruestung' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "R\xFCstungsart"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: itf.armorType || 'light',
    onChange: e => {
      const art = e.target.value;
      setItf({
        ...itf,
        armorType: art,
        baseAC: (ARMOR_KINDS.find(a => a.key === art) || {}).basis || 0
      });
    }
  }, ARMOR_KINDS.filter(a => a.key && a.key !== 'shield').map(a => /*#__PURE__*/React.createElement("option", {
    key: a.key,
    value: a.key
  }, a.label)))), (itf.gearKind === 'ruestung' || itf.gearKind === 'schild') && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, itf.gearKind === 'schild' ? 'Bonus zur RK' : 'Basis-RK'), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: "0",
    max: "25",
    wert: itf.baseAC || 0,
    onWert: v => setItf({
      ...itf,
      baseAC: v
    })
  })), itf.gearKind && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Magischer RK-Bonus"), /*#__PURE__*/React.createElement(ZahlFeld, {
    className: "form-input",
    min: "-5",
    max: "10",
    wert: itf.acBonus || 0,
    placeholder: "z.B. +1",
    onWert: v => setItf({
      ...itf,
      acBonus: v
    })
  })), itf.gearKind && /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Geh\xF6rt zu einem Set (optional)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    list: "hb-set-namen-inv",
    value: itf.setName || '',
    onChange: e => setItf({
      ...itf,
      setName: e.target.value
    }),
    placeholder: "z.B. Hain des Ersten Lichts"
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "hb-set-namen-inv"
  }, [...new Set([...(userLibrary.item || []).map(e => e.setName), ...(isDmMode ? dmLibrary.item || [] : []).map(e => e.setName), ...(cur && cur.inventory || []).map(i => i.setName)].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')).map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  })))), itf.gearKind && /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, itf.gearKind === 'ruestung' && ((ARMOR_KINDS.find(a => a.key === itf.armorType) || {}).hinweis || '') + ' — RK ' + (itf.baseAC || 0) + (itf.acBonus ? ' + ' + itf.acBonus + ' (magisch)' : ''), itf.gearKind === 'schild' && 'Gibt +' + ((+itf.baseAC || 0) + (+itf.acBonus || 0)) + ' auf die RK, wenn es in der Nebenhand steckt', itf.gearKind !== 'ruestung' && itf.gearKind !== 'schild' && (itf.acBonus ? '+' + itf.acBonus + ' zur RK, solange getragen' : 'Wirkt über seine Effekte, solange getragen'))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Beschreibung (optional)"), /*#__PURE__*/React.createElement(RichEditor, {
    value: itf.description,
    onChange: v => setItf({
      ...itf,
      description: v
    }),
    placeholder: "Wirkung, Eigenschaften...",
    rows: 3
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Erhalten durch (optional)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. Gefunden in Dungeon, Kauf beim H\xE4ndler...",
    value: itf.source || '',
    onChange: e => setItf({
      ...itf,
      source: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Tags (Enter oder Komma zum Hinzuf\xFCgen)"), /*#__PURE__*/React.createElement("div", {
    className: "tag-input-wrap",
    onClick: e => e.currentTarget.querySelector('input').focus()
  }, (itf.tags || []).map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "tag-chip"
  }, t, /*#__PURE__*/React.createElement("button", {
    className: "tag-chip-del",
    onClick: () => setItf({
      ...itf,
      tags: (itf.tags || []).filter(x => x !== t)
    })
  }, "\xD7"))), /*#__PURE__*/React.createElement("input", {
    className: "tag-text-input",
    placeholder: (itf.tags || []).length === 0 ? "z.B. Waffe, Ruestung, Quest..." : "",
    onKeyDown: e => {
      const v = e.target.value.trim();
      if ((e.key === "Enter" || e.key === ",") && v) {
        e.preventDefault();
        const t = v.replace(/,/g, "").trim();
        if (t && !(itf.tags || []).includes(t)) setItf({
          ...itf,
          tags: [...(itf.tags || []), t]
        });
        e.target.value = "";
      }
      if (e.key === "Backspace" && !e.target.value && (itf.tags || []).length > 0) setItf({
        ...itf,
        tags: (itf.tags || []).slice(0, -1)
      });
    },
    onBlur: e => {
      const v = e.target.value.trim().replace(/,/g, "");
      if (v && !(itf.tags || []).includes(v)) {
        setItf({
          ...itf,
          tags: [...(itf.tags || []), v]
        });
        e.target.value = "";
      }
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Bild (optional)"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }
  }, itf.imageData && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: itf.imageData,
    alt: "",
    style: {
      width: 80,
      height: 60,
      objectFit: 'cover',
      borderRadius: 4,
      border: '1px solid var(--border)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setItf({
      ...itf,
      imageData: ''
    }),
    style: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: 'var(--crimson)',
      border: 'none',
      color: '#fff',
      fontSize: 10,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("label", {
    style: {
      flex: 1,
      padding: '10px 14px',
      background: 'var(--bg-card)',
      border: '1px dashed var(--border)',
      borderRadius: 6,
      cursor: 'pointer',
      textAlign: 'center',
      fontSize: 12,
      color: 'var(--text-muted)',
      fontFamily: "'Roboto Condensed',sans-serif",
      letterSpacing: '0.05em'
    }
  }, "\uD83D\uDCF7 Bild ausw\xE4hlen", /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        // Compress via canvas — max 600px wide, 0.75 quality → ~60-100KB
        const img = new Image();
        img.onload = () => {
          const MAX = 1000;
          const scale = img.width > MAX ? MAX / img.width : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setItf(prev => ({
            ...prev,
            imageData: compressed
          }));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "\u2726 Effekte"), /*#__PURE__*/React.createElement(EffectEditor, {
    effects: itf.effects,
    onChange: v => setItf({
      ...itf,
      effects: v
    }),
    hint: "Wirken, solange der Gegenstand eingeschaltet ist."
  }), (itf.effects || []).length > 0 && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!itf.effectsActive,
    onChange: e => setItf({
      ...itf,
      effectsActive: e.target.checked
    }),
    style: {
      width: 16,
      height: 16,
      cursor: 'pointer',
      accentColor: 'var(--arcane-bright)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, "Effekte wirken gerade (getragen / eingeschaltet)")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => {
      setShowIF(false);
      setItfEditId(null);
    }
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: addItem
  }, itfEditId ? '✓ Speichern' : '+ Hinzufügen')))), showTransfer && cur && (() => {
    const transferItems = (cur.inventory || []).filter(i => transferSel.has(i.id));
    // DM heroes can transfer to anyone; normal heroes can only transfer to DM heroes if in DM mode
    const others = chars.filter(c => {
      if (c.id === sel || c.archived) return false;
      if (c.dmOnly) return isDmMode; // DM heroes only visible when in DM mode
      return true;
    });
    return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 420
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-title"
    }, "\u27A4 Gegenst\xE4nde \xFCbergeben"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-muted)",
        fontFamily: "'Roboto Condensed',sans-serif",
        marginBottom: 8,
        letterSpacing: "0.1em",
        textTransform: "uppercase"
      }
    }, "Ausgew\xE4hlte Gegenst\xE4nde"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg-void)",
        borderRadius: 4,
        padding: "8px 10px",
        maxHeight: 140,
        overflowY: "auto"
      }
    }, transferItems.map(item => {
      const r = RARITIES.find(x => x.key === item.rarity) || RARITIES[0];
      return /*#__PURE__*/React.createElement("div", {
        key: item.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 0",
          borderBottom: "1px solid var(--border)"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1,
          fontSize: 13,
          color: "var(--text-primary)"
        }
      }, item.name), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: r.color
        }
      }, r.label), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "var(--text-muted)"
        }
      }, "x", item.qty));
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-muted)",
        fontFamily: "'Roboto Condensed',sans-serif",
        marginBottom: 8,
        letterSpacing: "0.1em",
        textTransform: "uppercase"
      }
    }, "An wen \xFCbergeben?"), !isDmMode && cur.dmOnly && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#c060a0",
        fontStyle: "italic",
        marginBottom: 8,
        padding: "6px 10px",
        background: "rgba(192,96,160,0.08)",
        borderRadius: 4,
        border: "1px solid rgba(192,96,160,0.2)"
      }
    }, "\uD83D\uDD2E DM-Held kann nur im DM-Modus Gegenst\xE4nde an normale Helden \xFCbergeben."), others.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: "var(--text-muted)",
        fontStyle: "italic",
        fontSize: 13,
        marginBottom: 16
      }
    }, "Keine verf\xFCgbaren Charaktere in der Gruppe.") : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 16
      }
    }, others.map(c => {
      const cc = klassenStil(c.charClass || 'Kämpfer', klassen);
      return /*#__PURE__*/React.createElement("button", {
        key: c.id,
        onClick: () => doTransfer(c.id, transferSel),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "var(--bg-card)",
          border: "1px solid " + (c.dmOnly ? "rgba(192,96,160,0.4)" : "var(--border)"),
          borderRadius: 4,
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 0.15s"
        },
        onMouseEnter: e => e.currentTarget.style.borderColor = c.dmOnly ? "#c060a0" : "#7ab8f5",
        onMouseLeave: e => e.currentTarget.style.borderColor = c.dmOnly ? "rgba(192,96,160,0.4)" : "var(--border)"
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: c.dmOnly ? "#c060a0" : cc.bg,
          border: "1px solid " + (c.dmOnly ? "#c060a0" : cc.border),
          flexShrink: 0
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 13,
          color: c.dmOnly ? "#c060a0" : "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 5
        }
      }, c.dmOnly && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10
        }
      }, "\uD83D\uDD2E"), c.name || "Unbenannt"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--text-muted)",
          marginTop: 2
        }
      }, c.charClass, " \xB7 Stufe ", c.level, " \xB7 ", (c.inventory || []).length, " Gegenst. im Inventar")), /*#__PURE__*/React.createElement("div", {
        style: {
          color: c.dmOnly ? "#c060a0" : "#7ab8f5",
          fontSize: 16
        }
      }, "\u27A4"));
    })), /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      style: {
        width: "100%",
        justifyContent: "center"
      },
      onClick: () => setShowTransfer(false)
    }, "Abbrechen")));
  })(), coinPopover && (() => {
    const cur = coinPopover.val || 0;
    const delta = parseInt(coinDelta) || 0;
    const apply = sign => {
      const newVal = Math.max(0, cur + sign * Math.abs(delta || 0));
      updCurrency(coinPopover.key, newVal);
      setCoinPopover(prev => ({
        ...prev,
        val: newVal
      }));
      setCoinDelta('');
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay",
      style: {
        background: 'rgba(0,0,0,0.6)'
      },
      onClick: () => setCoinPopover(null)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg-panel)',
        borderRadius: 8,
        padding: '18px 20px',
        border: `2px solid ${coinPopover.color}60`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        minWidth: 220,
        maxWidth: 280
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 28
      }
    }, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 14,
        color: coinPopover.color,
        fontWeight: 700,
        letterSpacing: '0.08em'
      }
    }, coinPopover.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 20,
        color: 'var(--text-primary)',
        lineHeight: 1
      }
    }, cur))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 5
      }
    }, "Betrag"), /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "number",
      min: "0",
      value: coinDelta,
      onChange: e => setCoinDelta(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Enter' && coinDelta) apply(1);
        if (e.key === 'Escape') setCoinPopover(null);
      },
      style: {
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--bg-void)',
        border: `1px solid ${coinPopover.color}60`,
        borderRadius: 4,
        color: 'var(--text-primary)',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 18,
        textAlign: 'center',
        padding: '8px 4px',
        outline: 'none'
      },
      placeholder: "0"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => apply(1),
      style: {
        padding: '10px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 13,
        fontWeight: 700,
        background: `${coinPopover.color}25`,
        border: `1px solid ${coinPopover.color}80`,
        color: coinPopover.color,
        borderRadius: 5,
        cursor: 'pointer',
        letterSpacing: '0.05em'
      }
    }, "+ Hinzuf\xFCgen"), /*#__PURE__*/React.createElement("button", {
      onClick: () => apply(-1),
      style: {
        padding: '10px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 13,
        fontWeight: 700,
        background: 'rgba(180,60,60,0.15)',
        border: '1px solid rgba(180,60,60,0.5)',
        color: '#e07070',
        borderRadius: 5,
        cursor: 'pointer',
        letterSpacing: '0.05em'
      }
    }, "\u2212 Wegnehmen")), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '1px solid var(--border)',
        paddingTop: 10,
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap'
      }
    }, "Direkt setzen"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (coinDelta !== '') {
          updCurrency(coinPopover.key, Math.max(0, parseInt(coinDelta) || 0));
          setCoinPopover(null);
        }
      },
      style: {
        flex: 1,
        padding: '5px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        borderRadius: 4,
        cursor: 'pointer'
      }
    }, "= Setzen"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setCoinPopover(null),
      style: {
        padding: '5px 10px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        background: 'none',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        borderRadius: 4,
        cursor: 'pointer'
      }
    }, "\u2715"))));
  })(), itemViewer && (() => {
    const item = itemViewer;
    const r = RARITIES.find(x => x.key === item.rarity) || RARITIES[0];
    const icon = item.icon || '🎒';
    return /*#__PURE__*/React.createElement(Fenster, {
      onClick: () => setItemViewer(null)
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 460,
        padding: 0,
        overflow: 'hidden',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: `linear-gradient(180deg, ${r.color}30 0%, ${r.color}14 100%), var(--bg-card)`,
        borderBottom: `1px solid ${r.color}55`,
        padding: '16px 18px 14px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 40,
        lineHeight: 1,
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
        flexShrink: 0
      }
    }, icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight: 1.3
      }
    }, item.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto',sans-serif",
        fontSize: 12,
        color: 'var(--parchment-dim)',
        marginTop: 4,
        fontStyle: 'italic'
      }
    }, r.label, item.qty > 1 ? ` · ×${item.qty}` : '', item.weight ? ` · ${item.weight} kg` : '')), /*#__PURE__*/React.createElement("button", {
      onClick: () => setItemViewer(null),
      style: {
        background: 'rgba(0,0,0,0.3)',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        padding: '4px 7px',
        borderRadius: 4,
        flexShrink: 0
      }
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 18px',
        background: 'var(--bg-panel)',
        display: 'flex',
        gap: 14,
        overflowY: 'auto',
        flex: 1
      }
    }, item.imageData && /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        width: 110,
        height: 110,
        borderRadius: 6,
        overflow: 'hidden',
        border: `2px solid ${r.color}60`,
        cursor: 'zoom-in',
        background: 'var(--bg-void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      onClick: () => setImgViewer({
        name: item.name,
        imageData: item.imageData
      })
    }, /*#__PURE__*/React.createElement("img", {
      src: item.imageData,
      alt: item.name,
      style: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        display: 'block'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, item.description && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto',sans-serif",
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: 8
      },
      dangerouslySetInnerHTML: {
        __html: sanitizeHtml(item.description)
      }
    }), item.source && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 6
      }
    }, "\uD83D\uDCE6 ", item.source), (item.tags || []).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4
      }
    }, (item.tags || []).map(t => /*#__PURE__*/React.createElement("span", {
      key: t,
      className: "inv-tag"
    }, t))), (item.gearKind || item.setName) && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-muted)',
        marginBottom: 6,
        lineHeight: 1.6
      }
    }, item.gearKind && /*#__PURE__*/React.createElement("div", null, "\uD83D\uDEE1 Platz: ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)'
      }
    }, (GEAR_KINDS.find(g => g.key === item.gearKind) || {}).label), item.armorType === 'shield' && ' · +' + (+item.baseAC || 2) + ' RK', item.armorType && item.armorType !== 'shield' && ' · Basis ' + (+item.baseAC || 0), (+item.acBonus || 0) !== 0 && ' · ' + (+item.acBonus >= 0 ? '+' : '') + +item.acBonus + ' RK magisch'), item.setName && /*#__PURE__*/React.createElement("div", null, "\u2726 Set: ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)'
      }
    }, item.setName))), (item.effects || []).length > 0 && (() => {
      // Ein Stueck in einem Platz wirkt, ohne dass jemand es
      // zusaetzlich einschalten muesste — sonst stuende hier
      // "Ruht" an einer angelegten Ruestung.
      const imPlatz = gearWornList.some(x => x.k === 'i' && x.obj.id === item.id);
      const wirkt = imPlatz || !!item.effectsActive;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--arcane-bright)',
          marginBottom: 5
        }
      }, "\u2726 Effekte"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          opacity: wirkt ? 1 : 0.5,
          marginBottom: 7
        }
      }, (item.effects || []).map(e => /*#__PURE__*/React.createElement("span", {
        key: e.id,
        className: "fx-chip"
      }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))), imPlatz ? /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 11,
          color: 'var(--gold)'
        }
      }, "\u2726 Wirkt, weil angelegt") :
      /*#__PURE__*/
      /* Ein- und ausschalten ohne Umweg über den Bearbeiten-Dialog:
         ein Amulett legt man im Spiel oft ab und wieder an. */
      React.createElement("button", {
        className: "btn-icon",
        style: {
          fontSize: 11,
          padding: '5px 10px'
        },
        onClick: () => {
          const next = !item.effectsActive;
          updItem(item.id, {
            effectsActive: next
          });
          setItemViewer({
            ...item,
            effectsActive: next
          });
        }
      }, item.effectsActive ? '✦ Wirkt — ausschalten' : '◇ Ruht — einschalten'));
    })(), !item.description && !item.source && (item.tags || []).length === 0 && (item.effects || []).length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto',sans-serif",
        fontSize: 13,
        color: 'var(--text-muted)',
        fontStyle: 'italic'
      }
    }, "Keine weiteren Infos."))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        padding: '10px 18px',
        background: 'var(--bg-deep)',
        borderTop: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      style: {
        flex: 1
      },
      onClick: () => {
        setItemViewer(null);
        setItf({
          ...item
        });
        setItfEditId(item.id);
        setShowIF(true);
      }
    }, "\u270E Bearbeiten"), /*#__PURE__*/React.createElement("button", {
      style: {
        padding: '8px 14px',
        background: 'rgba(180,60,60,0.15)',
        border: '1px solid rgba(180,60,60,0.4)',
        borderRadius: 3,
        color: '#e07070',
        cursor: 'pointer',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11
      },
      onClick: () => {
        setItemViewer(null);
        delItem(item.id);
      }
    }, "\u2715 L\xF6schen"), /*#__PURE__*/React.createElement("button", {
      className: "btn-cancel",
      onClick: () => setItemViewer(null)
    }, "Schlie\xDFen"))));
  })(), weaponViewer && cur && (() => {
    const w = (cur.weapons || []).find(x => x.id === weaponViewer);
    if (!w) return null;
    const {
      bonus,
      dmgStr
    } = weaponStats(w);
    const attrLabel = (WATTRS.find(a => a.key === (w.attrKey || "str")) || WATTRS[0]).label;
    const dc = DTYPE_COLORS[w.damageType] || "#a07050";
    const stats = [{
      l: "Angriff",
      v: bonus >= 0 ? "+" + bonus : "" + bonus,
      c: "var(--gold)"
    }, {
      l: "Schaden",
      v: dmgStr,
      c: "var(--text-primary)"
    }, {
      l: "Schadensart",
      v: w.damageType || "—",
      c: "var(--text-primary)"
    }, {
      l: "Reichweite",
      v: w.range || "—",
      c: "var(--text-primary)"
    }, {
      l: "Attribut",
      v: attrLabel,
      c: "var(--text-primary)"
    }, {
      l: "Übung",
      v: w.proficient ? "Ja" : "Nein",
      c: w.proficient ? "var(--gold)" : "var(--text-muted)"
    }];
    return /*#__PURE__*/React.createElement(Fenster, {
      onClick: () => setWeaponViewer(null)
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 460,
        padding: 0,
        overflow: 'hidden',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column'
      },
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: `linear-gradient(180deg, ${dc}30 0%, ${dc}14 100%), var(--bg-card)`,
        borderBottom: `1px solid ${dc}55`,
        padding: '14px 18px 12px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight: 1.3
      }
    }, w.name || "Waffe"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto',sans-serif",
        fontSize: 12,
        color: 'var(--parchment-dim)',
        marginTop: 4,
        fontStyle: 'italic'
      }
    }, w.equipped ? "Ausgerüstet" : "Abgelegt", w.damageType ? ` · ${w.damageType}` : '')), /*#__PURE__*/React.createElement("button", {
      onClick: () => setWeaponViewer(null),
      style: {
        background: 'rgba(0,0,0,0.3)',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        padding: '4px 7px',
        borderRadius: 4,
        flexShrink: 0
      }
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 18px',
        background: 'var(--bg-panel)',
        overflowY: 'auto',
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start'
      }
    }, w.imageData && /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        width: 120,
        height: 120,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        cursor: 'zoom-in',
        background: 'radial-gradient(circle at 50% 45%, var(--bg-hover) 0%, var(--bg-void) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      onClick: () => setImgViewer({
        name: w.name,
        imageData: w.imageData
      })
    }, /*#__PURE__*/React.createElement("img", {
      src: w.imageData,
      alt: w.name,
      style: {
        maxWidth: '88%',
        maxHeight: '88%',
        objectFit: 'contain',
        display: 'block',
        filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.65))'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 10px'
      }
    }, stats.map(s => /*#__PURE__*/React.createElement("div", {
      key: s.l
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)'
      }
    }, s.l), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 15,
        color: s.c,
        lineHeight: 1.3
      }
    }, s.v))))), (w.effects || []).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--arcane-bright)',
        marginBottom: 5
      }
    }, "\u2726 Effekte ", w.equipped ? '· wirken' : '· ruhen (nicht angelegt)'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        opacity: w.equipped ? 1 : 0.5
      }
    }, (w.effects || []).map(e => /*#__PURE__*/React.createElement("span", {
      key: e.id,
      className: "fx-chip"
    }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e))))), (w.properties || []).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 5
      }
    }, "Eigenschaften"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4
      }
    }, (w.properties || []).map(p => /*#__PURE__*/React.createElement("span", {
      key: p,
      className: "prop-tag"
    }, p)))), w.description && w.description.trim() && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14,
        fontFamily: "'Roboto',sans-serif",
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.6
      },
      dangerouslySetInnerHTML: {
        __html: sanitizeHtml(w.description)
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        padding: '10px 18px',
        background: 'var(--bg-deep)',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      style: {
        flex: 1
      },
      onClick: () => toggleEquipped(w.id)
    }, "\u2694 ", w.equipped ? "Ablegen" : "Anlegen"), /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      style: {
        flex: 1
      },
      onClick: () => {
        setWeaponViewer(null);
        setWf({
          ...w,
          properties: w.properties || []
        });
        setWfEditId(w.id);
        setShowWF(true);
      }
    }, "\u270E Bearbeiten"), /*#__PURE__*/React.createElement("button", {
      style: {
        padding: '8px 14px',
        background: 'rgba(180,60,60,0.15)',
        border: '1px solid rgba(180,60,60,0.4)',
        borderRadius: 3,
        color: '#e07070',
        cursor: 'pointer',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11
      },
      onClick: () => {
        setWeaponViewer(null);
        delWeapon(w.id);
      }
    }, "\u2715 L\xF6schen"))));
  })(), imgViewer && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay",
    style: {
      background: 'rgba(0,0,0,0.85)'
    },
    onClick: () => setImgViewer(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '90vw',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("img", {
    src: imgViewer.imageData,
    alt: imgViewer.name,
    style: {
      maxWidth: '85vw',
      maxHeight: '80vh',
      objectFit: 'contain',
      borderRadius: 8,
      boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
      border: '2px solid rgba(232,213,163,0.18)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 14,
      color: 'var(--parchment)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  }, imgViewer.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => setImgViewer(null),
    style: {
      padding: '6px 20px',
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 11,
      background: 'rgba(232,213,163,0.10)',
      border: '1px solid rgba(232,213,163,0.28)',
      color: 'var(--text-secondary)',
      borderRadius: 4,
      cursor: 'pointer',
      letterSpacing: '0.08em'
    }
  }, "\u2715 Schlie\xDFen"))), showAdventLog && /*#__PURE__*/React.createElement(AdventureLog, {
    onClose: () => setShowAdventLog(false),
    isDmMode: isDmMode
  }), showDB && (() => {
    // Gegner nur im DM-Modus: sie liegen in einer eigenen Tabelle
    // hinter dem DM-Passwort, damit Spieler die Werte nicht abrufen.
    const types = [{
      k: 'spell',
      label: 'Zauber',
      icon: '📖'
    }, {
      k: 'weapon',
      label: 'Waffen',
      icon: '⚔'
    }, {
      k: 'wildshape',
      label: 'Tiere',
      icon: '🐺'
    }, {
      k: 'item',
      label: 'Gegenstände',
      icon: '🎒'
    }, {
      k: 'set',
      label: 'Sets',
      icon: '✦'
    }, ...(isDmMode ? [{
      k: 'enemy',
      label: 'Gegner',
      icon: '💀'
    }, {
      k: 'encounter',
      label: 'Begegnungen',
      icon: '⚔'
    }] : [])];
    // Reset search when tab changes
    const wkCurrent = '_dbSearch_' + dbTab;
    const wktCurrent = '_dbTagFilter_' + dbTab;
    const activeLib = isDmMode ? dmLibrary : userLibrary;
    const setActiveLib = isDmMode ? saveDmLibrary : saveLibrary;
    const entries = activeLib[dbTab] || [];
    const SCHOOLS = ['Verzauberung', 'Beschwörung', 'Verwandlung', 'Nekromantie', 'Hervorrufung', 'Illusion', 'Erkenntnis', 'Bann'];
    const DMG_TYPES = ['Hieb', 'Stich', 'Wucht', 'Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekro', 'Psycho', 'Energie', 'Kraft'];
    const WPN_PROPS = ['Finesse', 'Weit', 'Leicht', 'Schwer', 'Werfbar', 'Zweihändig', 'Vielseitig', 'Ladezeit', 'Besondere'];
    return /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
      className: "form-modal",
      style: {
        maxWidth: 600,
        height: '85vh',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-title"
    }, "\uD83D\uDCDA Datenbank verwalten ", isDmMode && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: '#c060a0',
        fontFamily: "'Roboto Condensed',sans-serif",
        marginLeft: 8
      }
    }, "\uD83D\uDD2E DM-Modus")), /*#__PURE__*/React.createElement("div", {
      className: "db-reiter"
    }, types.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.k,
      onClick: () => {
        setDbTab(t.k);
        setDbForm(null);
        setDbFormId(null);
        setDbGradeFilter('');
        setDbExpandedEntry(null);
      },
      className: "db-reiter",
      style: {
        flex: '1 0 auto',
        whiteSpace: 'nowrap',
        padding: '7px 9px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        cursor: 'pointer',
        border: '1px solid',
        borderRadius: 4,
        borderColor: dbTab === t.k ? 'var(--gold)' : 'var(--border)',
        background: dbTab === t.k ? 'var(--bg-panel)' : 'var(--bg-card)',
        color: dbTab === t.k ? 'var(--gold)' : 'var(--text-muted)'
      }
    }, t.icon, " ", t.label))), dbTab === 'encounter' ? /*#__PURE__*/React.createElement(BegegnungListe, {
      encounters: encounters,
      enemies: enemies,
      abenteuer: abenteuer,
      advId: advId,
      nurAktives: encNurAktives,
      setNurAktives: setEncNurAktives,
      onBearbeiten: b => setEncForm({
        ...b
      }),
      onLoeschen: deleteEncounter,
      onNeu: () => setEncForm(newEncounter(advId))
    }) : dbTab === 'enemy' ? /*#__PURE__*/React.createElement(GegnerListe, {
      enemies: enemies,
      geladen: enemiesGeladen,
      suche: enemySuche,
      setSuche: setEnemySuche,
      crFilter: enemyCr,
      setCrFilter: setEnemyCr,
      tagFilter: enemyTag,
      setTagFilter: setEnemyTag,
      onAnsehen: g => setEnemyView(g),
      onNeu: () => setEnemyForm(newEnemy()),
      onImport: importEnemies,
      importBusy: enemyImportBusy
    }) : dbForm ? /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 12,
        color: 'var(--gold)',
        marginBottom: 12
      }
    }, dbFormId ? 'Eintrag bearbeiten' : 'Neuer Eintrag'), dbTab === 'spell' && /*#__PURE__*/React.createElement("div", {
      className: "form-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Name"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.name,
      onChange: e => setDbForm(f => ({
        ...f,
        name: e.target.value
      })),
      placeholder: "Zaubername",
      autoFocus: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Grad"), /*#__PURE__*/React.createElement("select", {
      className: "form-select",
      value: dbForm.level,
      onChange: e => setDbForm(f => ({
        ...f,
        level: +e.target.value
      }))
    }, /*#__PURE__*/React.createElement("option", {
      value: 0
    }, "Zaubertrick"), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => /*#__PURE__*/React.createElement("option", {
      key: l,
      value: l
    }, "Grad ", l)))), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Schule"), /*#__PURE__*/React.createElement("select", {
      className: "form-select",
      value: dbForm.school,
      onChange: e => setDbForm(f => ({
        ...f,
        school: e.target.value
      }))
    }, SCHOOLS.map(s => /*#__PURE__*/React.createElement("option", {
      key: s
    }, s)))), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Wirkzeit"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.castingTime,
      onChange: e => setDbForm(f => ({
        ...f,
        castingTime: e.target.value
      })),
      placeholder: "1 Aktion"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Reichweite"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.range,
      onChange: e => setDbForm(f => ({
        ...f,
        range: e.target.value
      })),
      placeholder: "9 m"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Dauer"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.duration,
      onChange: e => setDbForm(f => ({
        ...f,
        duration: e.target.value
      })),
      placeholder: "Sofort"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Komponenten"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.components,
      onChange: e => setDbForm(f => ({
        ...f,
        components: e.target.value
      })),
      placeholder: "V, S, M (...)"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Beschreibung"), /*#__PURE__*/React.createElement("textarea", {
      className: "form-textarea",
      rows: 5,
      style: {
        resize: 'vertical'
      },
      value: dbForm.description,
      onChange: e => setDbForm(f => ({
        ...f,
        description: e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Klassen"), /*#__PURE__*/React.createElement("div", {
      className: "marken-reihe",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 4
      }
    }, ['Artifizient', 'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Kämpfer', 'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer'].map(c => {
      const cc = {
        'Artifizient': '#70b8c8',
        'Barbar': '#c84040',
        'Barde': '#4090c0',
        'Druide': '#52b788',
        'Hexenmeister': '#9060c0',
        'Kämpfer': '#c08040',
        'Kleriker': '#e0c040',
        'Magier': '#6080d0',
        'Mönch': '#d09040',
        'Paladin': '#e0a030',
        'Schurke': '#808080',
        'Waldläufer': '#70a050',
        'Zauberer': '#c060a0'
      };
      const col = cc[c] || '#c9a84c';
      const on = (dbForm.classes || []).includes(c);
      return /*#__PURE__*/React.createElement("button", {
        key: c,
        type: "button",
        onClick: () => setDbForm(f => ({
          ...f,
          classes: on ? (f.classes || []).filter(x => x !== c) : [...(f.classes || []), c]
        })),
        style: {
          padding: '2px 9px',
          borderRadius: 10,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          border: '1px solid ' + (on ? col : col + '40'),
          background: on ? col + '22' : 'var(--bg-card)',
          color: on ? col : 'var(--text-muted)'
        }
      }, c);
    }))), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Schadenstypen"), /*#__PURE__*/React.createElement("div", {
      className: "marken-reihe",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 4
      }
    }, ['Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekrotisch', 'Gleißend', 'Psychisch', 'Energie', 'Schall', 'Hieb', 'Stich', 'Wucht'].map(d => {
      const on = (dbForm.damageTags || []).includes(d);
      const dc = {
        Feuer: '#e07030',
        Kälte: '#70b8d8',
        Blitz: '#c0d850',
        Säure: '#90c040',
        Gift: '#80b030',
        Nekrose: '#9060c0',
        Strahlend: '#f0e060',
        Psychisch: '#c070d0',
        Kraft: '#80a0f0',
        Hieb: '#a07050',
        Stich: '#b08060',
        Wucht: '#c09070'
      }[d] || '#aaa';
      return /*#__PURE__*/React.createElement("button", {
        key: d,
        type: "button",
        onClick: () => setDbForm(f => ({
          ...f,
          damageTags: on ? (f.damageTags || []).filter(x => x !== d) : [...(f.damageTags || []), d]
        })),
        style: {
          padding: '2px 9px',
          borderRadius: 10,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          border: `1px solid ${on ? dc : dc + '40'}`,
          background: on ? dc + '22' : 'var(--bg-card)',
          color: on ? dc : 'var(--text-muted)'
        }
      }, "\u2694\uFE0F ", d);
    })))), dbTab === 'weapon' && /*#__PURE__*/React.createElement("div", {
      className: "form-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Name"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.name,
      onChange: e => setDbForm(f => ({
        ...f,
        name: e.target.value
      })),
      placeholder: "Waffenname",
      autoFocus: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Schaden"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.damage,
      onChange: e => setDbForm(f => ({
        ...f,
        damage: e.target.value
      })),
      placeholder: "1W8"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Schadensart"), /*#__PURE__*/React.createElement("select", {
      className: "form-select",
      value: dbForm.damageType,
      onChange: e => setDbForm(f => ({
        ...f,
        damageType: e.target.value
      }))
    }, DMG_TYPES.map(d => /*#__PURE__*/React.createElement("option", {
      key: d
    }, d)))), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Reichweite"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.range || '',
      onChange: e => setDbForm(f => ({
        ...f,
        range: e.target.value
      })),
      placeholder: "1,5 m"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Eigenschaften"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4
      }
    }, WPN_PROPS.map(p => {
      const on = (dbForm.properties || []).includes(p);
      return /*#__PURE__*/React.createElement("button", {
        key: p,
        onClick: () => setDbForm(f => ({
          ...f,
          properties: on ? (f.properties || []).filter(x => x !== p) : [...(f.properties || []), p]
        })),
        style: {
          padding: '4px 12px',
          borderRadius: 12,
          border: '1px solid',
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 10,
          cursor: 'pointer',
          borderColor: on ? 'var(--gold)' : 'var(--border)',
          background: on ? 'var(--bg-panel)' : 'var(--bg-card)',
          color: on ? 'var(--gold)' : 'var(--text-muted)'
        }
      }, p);
    }))), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Beschreibung (optional)"), /*#__PURE__*/React.createElement("textarea", {
      className: "form-textarea",
      rows: 3,
      style: {
        resize: 'vertical'
      },
      value: dbForm.description || '',
      onChange: e => setDbForm(f => ({
        ...f,
        description: e.target.value
      }))
    }))), dbTab === 'set' && /*#__PURE__*/React.createElement("div", {
      className: "form-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Name des Sets"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.name,
      onChange: e => setDbForm(f => ({
        ...f,
        name: e.target.value
      })),
      placeholder: "z.B. Hain des Ersten Lichts",
      autoFocus: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginTop: 5
      }
    }, "Genau so muss der Name bei den Gegenst\xE4nden eingetragen sein, die dazugeh\xF6ren.")), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Beschreibung (optional)"), /*#__PURE__*/React.createElement("textarea", {
      className: "form-input",
      rows: 2,
      style: {
        resize: 'vertical'
      },
      value: dbForm.description || '',
      onChange: e => setDbForm(f => ({
        ...f,
        description: e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Stufen"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginBottom: 8
      }
    }, "Ab wie vielen getragenen Teilen welche Effekte dazukommen. Erreichte Stufen wirken alle zugleich \u2014 wer bei 2 und 4 Teilen etwas hinterlegt, bekommt mit 4 Teilen beides."), (dbForm.stufen || []).map((st, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 8,
        background: 'var(--bg-card)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }
    }, "Ab"), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      min: 1,
      max: 15,
      style: {
        width: 64,
        padding: '5px 8px',
        textAlign: 'center'
      },
      wert: st.teile,
      "aria-label": "Anzahl Teile",
      onWert: v => setDbForm(f => ({
        ...f,
        stufen: (f.stufen || []).map((x, j) => j === i ? {
          ...x,
          teile: v
        } : x)
      }))
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-muted)'
      }
    }, "Teilen"), /*#__PURE__*/React.createElement("button", {
      style: {
        marginLeft: 'auto',
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 14,
        padding: '2px 6px'
      },
      title: "Stufe entfernen",
      "aria-label": 'Stufe ab ' + st.teile + ' Teilen entfernen',
      onClick: () => setDbForm(f => ({
        ...f,
        stufen: (f.stufen || []).filter((_, j) => j !== i)
      }))
    }, "\u2715")), /*#__PURE__*/React.createElement(EffectEditor, {
      effects: st.effects || [],
      onChange: v => setDbForm(f => ({
        ...f,
        stufen: (f.stufen || []).map((x, j) => j === i ? {
          ...x,
          effects: v
        } : x)
      })),
      hint: 'Wirken ab ' + st.teile + ' getragenen Teilen.'
    }))), /*#__PURE__*/React.createElement("button", {
      className: "btn-add",
      style: {
        width: '100%'
      },
      onClick: () => setDbForm(f => {
        const vorhanden = (f.stufen || []).map(s => +s.teile || 0);
        const naechste = Math.min(15, (vorhanden.length ? Math.max(...vorhanden) : 0) + 2);
        return {
          ...f,
          stufen: [...(f.stufen || []), {
            teile: naechste,
            effects: []
          }]
        };
      })
    }, "+ Stufe hinzuf\xFCgen"))), dbTab === 'wildshape' && /*#__PURE__*/React.createElement("div", {
      className: "form-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Name"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.name,
      onChange: e => setDbForm(f => ({
        ...f,
        name: e.target.value
      })),
      placeholder: "Tiername",
      autoFocus: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "CR"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.cr,
      onChange: e => setDbForm(f => ({
        ...f,
        cr: e.target.value
      })),
      placeholder: "1/4"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Typ"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.type,
      onChange: e => setDbForm(f => ({
        ...f,
        type: e.target.value
      })),
      placeholder: "Tier"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Gr\xF6\xDFe"), /*#__PURE__*/React.createElement("select", {
      className: "form-select",
      value: dbForm.size,
      onChange: e => setDbForm(f => ({
        ...f,
        size: e.target.value
      }))
    }, ['Winzig', 'Klein', 'Mittel', 'Groß', 'Riesig', 'Gigantisch'].map(s => /*#__PURE__*/React.createElement("option", {
      key: s
    }, s)))), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "RK"), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      wert: dbForm.ac,
      onWert: v => setDbForm(f => ({
        ...f,
        ac: v
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "TP"), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      wert: dbForm.hp,
      onWert: v => setDbForm(f => ({
        ...f,
        hp: v
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Bewegung"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.speed,
      onChange: e => setDbForm(f => ({
        ...f,
        speed: e.target.value
      })),
      placeholder: "9 m"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Tags (kommagetrennt)"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.tagsStr || '',
      onChange: e => setDbForm(f => ({
        ...f,
        tagsStr: e.target.value
      })),
      placeholder: "Schwimmen, Fliegen"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Attribute"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6,1fr)',
        gap: 6,
        marginTop: 4
      }
    }, [['str', 'STR'], ['dex', 'GES'], ['con', 'KON'], ['int', 'INT'], ['wis', 'WEI'], ['cha', 'CHA']].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
      key: k
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginBottom: 3,
        letterSpacing: '0.1em'
      }
    }, l), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      min: 1,
      max: 30,
      style: {
        textAlign: 'center',
        padding: '6px 4px'
      },
      wert: dbForm[k],
      onWert: v => setDbForm(f => ({
        ...f,
        [k]: v
      }))
    }))))), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Sinne"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.senses || '',
      onChange: e => setDbForm(f => ({
        ...f,
        senses: e.target.value
      })),
      placeholder: "Dunkelsicht 18 m"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Fertigkeiten"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.skills || '',
      onChange: e => setDbForm(f => ({
        ...f,
        skills: e.target.value
      })),
      placeholder: "Wahrnehmung +3"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Besondere F\xE4higkeiten (eine pro Zeile)"), /*#__PURE__*/React.createElement("textarea", {
      className: "form-textarea",
      rows: 3,
      style: {
        resize: 'vertical'
      },
      value: dbForm.abilitiesStr || '',
      onChange: e => setDbForm(f => ({
        ...f,
        abilitiesStr: e.target.value
      })),
      placeholder: "Amphibisch. Das Tier kann sowohl..."
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "Aktionen"), (dbForm.actions || [{
      name: '',
      desc: ''
    }]).map((a, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '140px 1fr auto',
        gap: 6,
        marginBottom: 6,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      placeholder: "Name",
      value: a.name,
      onChange: e => setDbForm(f => ({
        ...f,
        actions: f.actions.map((x, j) => j === i ? {
          ...x,
          name: e.target.value
        } : x)
      }))
    }), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      placeholder: "Beschreibung",
      value: a.desc,
      onChange: e => setDbForm(f => ({
        ...f,
        actions: f.actions.map((x, j) => j === i ? {
          ...x,
          desc: e.target.value
        } : x)
      }))
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => setDbForm(f => ({
        ...f,
        actions: f.actions.filter((_, j) => j !== i)
      })),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 16,
        padding: '4px 6px'
      }
    }, "x"))), /*#__PURE__*/React.createElement("button", {
      className: "btn-add",
      style: {
        fontSize: 11,
        padding: '5px 12px'
      },
      onClick: () => setDbForm(f => ({
        ...f,
        actions: [...(f.actions || []), {
          name: '',
          desc: ''
        }]
      }))
    }, "+ Aktion"))), dbTab === 'item' && /*#__PURE__*/React.createElement("div", {
      className: "form-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Name"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setShowIconPicker(true),
      style: {
        fontSize: 22,
        width: 38,
        height: 38,
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        cursor: 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      title: "Icon w\xE4hlen"
    }, dbForm.icon || '🎒'), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      style: {
        flex: 1
      },
      value: dbForm.name,
      onChange: e => setDbForm(f => ({
        ...f,
        name: e.target.value
      })),
      placeholder: "z.B. Heiltrank",
      autoFocus: true
    })), showIconPicker && (() => {
      const ICON_CATS2 = [{
        label: 'Waffen',
        icons: ['⚔', '🗡', '🔪', '🪃', '🪓', '🏹', '🔱', '⚡', '🌟', '💥', '🔥', '❄', '☠', '🩸']
      }, {
        label: 'Rüstung',
        icons: ['🛡', '⛓', '🪬', '💎', '📿', '🔮', '🧿', '🪄', '🎭', '👑', '💍', '🧤', '🎩', '🪖']
      }, {
        label: 'Tränke & Magie',
        icons: ['🧪', '🔬', '🪄', '🔭', '📜', '📖', '🗾', '🧲', '💡', '🕯', '🪔', '🔦', '✨', '💫', '🌀', '♾']
      }, {
        label: 'Natur',
        icons: ['🌿', '🍄', '🌱', '🌾', '🍀', '🌹', '🌻', '🍎', '🍇', '🫙', '🌰', '🌊', '🪨', '🌙', '☀', '⭐']
      }, {
        label: 'Werkzeuge',
        icons: ['🔑', '🗝', '⛏', '🪚', '🔧', '🪛', '🔩', '🪤', '🧰', '🪜', '🪣', '🧱', '💰', '👜', '🎒', '🗃']
      }, {
        label: 'Sonstiges',
        icons: ['💀', '👁', '🫀', '🦷', '🧠', '🤝', '✊', '🎲', '🎯', '🏺', '📦', '🧲', '⚙', '🐲', '🦄', '🦅']
      }];
      return /*#__PURE__*/React.createElement("div", {
        className: "form-overlay",
        style: {
          zIndex: 300
        },
        onClick: () => setShowIconPicker(false)
      }, /*#__PURE__*/React.createElement("div", {
        className: "form-modal",
        style: {
          maxWidth: 340
        },
        onClick: e => e.stopPropagation()
      }, /*#__PURE__*/React.createElement("div", {
        className: "form-title",
        style: {
          marginBottom: 10
        }
      }, "Icon w\xE4hlen"), ICON_CATS2.map(cat => /*#__PURE__*/React.createElement("div", {
        key: cat.label,
        style: {
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 4
        }
      }, cat.label), /*#__PURE__*/React.createElement("div", {
        className: "icon-picker-grid"
      }, cat.icons.map(ic => /*#__PURE__*/React.createElement("button", {
        key: ic,
        className: "icon-picker-btn" + ((dbForm.icon || '🎒') === ic ? " selected" : ""),
        onClick: () => {
          setDbForm(f => ({
            ...f,
            icon: ic
          }));
          setShowIconPicker(false);
        }
      }, ic))))), /*#__PURE__*/React.createElement("div", {
        className: "form-actions",
        style: {
          marginTop: 8
        }
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn-cancel",
        onClick: () => setShowIconPicker(false)
      }, "Schlie\xDFen"))));
    })()), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Seltenheit"), /*#__PURE__*/React.createElement("select", {
      className: "form-input",
      value: dbForm.rarity || 'gewöhnlich',
      onChange: e => setDbForm(f => ({
        ...f,
        rarity: e.target.value
      }))
    }, RARITIES.map(r => /*#__PURE__*/React.createElement("option", {
      key: r.key,
      value: r.key
    }, r.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Gewicht (kg)"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.weight || '',
      onChange: e => setDbForm(f => ({
        ...f,
        weight: e.target.value
      })),
      placeholder: "0.5"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Menge (Standard)"), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      min: 1,
      wert: dbForm.qty || 1,
      onWert: v => setDbForm(f => ({
        ...f,
        qty: v
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Tags ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: 'var(--text-muted)',
        fontStyle: 'italic'
      }
    }, "(kommagetrennt)")), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: (dbForm.tags || []).join(', '),
      onChange: e => setDbForm(f => ({
        ...f,
        tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
      })),
      placeholder: "z.B. Verbrauchsgut, Magie"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Bild (optional)"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, dbForm.imageData && /*#__PURE__*/React.createElement("div", {
      style: {
        width: 60,
        height: 60,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        flexShrink: 0,
        cursor: 'pointer'
      },
      onClick: () => setImgViewer({
        name: dbForm.name,
        imageData: dbForm.imageData
      })
    }, /*#__PURE__*/React.createElement("img", {
      src: dbForm.imageData,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }
    })), /*#__PURE__*/React.createElement("label", {
      style: {
        cursor: 'pointer',
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-input",
      style: {
        textAlign: 'center',
        padding: '8px',
        cursor: 'pointer',
        color: 'var(--text-muted)'
      }
    }, dbForm.imageData ? '🖼 Bild ändern' : '📷 Bild hochladen'), /*#__PURE__*/React.createElement("input", {
      type: "file",
      accept: "image/*",
      style: {
        display: 'none'
      },
      onChange: e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            const MAX = 1000,
              scale = img.width > MAX ? MAX / img.width : 1;
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * scale);
            c.height = Math.round(img.height * scale);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            setDbForm(f => ({
              ...f,
              imageData: c.toDataURL('image/jpeg', 0.85)
            }));
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    })), dbForm.imageData && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setDbForm(f => ({
        ...f,
        imageData: ''
      })),
      style: {
        background: 'none',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        borderRadius: 4,
        cursor: 'pointer',
        padding: '4px 8px',
        fontSize: 11
      }
    }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Beschreibung"), /*#__PURE__*/React.createElement("textarea", {
      className: "form-input",
      rows: 3,
      style: {
        resize: 'vertical'
      },
      value: dbForm.description || '',
      onChange: e => setDbForm(f => ({
        ...f,
        description: e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Erhalten durch (optional)"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      value: dbForm.source || '',
      onChange: e => setDbForm(f => ({
        ...f,
        source: e.target.value
      })),
      placeholder: "z.B. H\xE4ndler, Quest-Belohnung..."
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Ausr\xFCstungsplatz"), /*#__PURE__*/React.createElement("select", {
      className: "form-input",
      value: dbForm.gearKind || '',
      onChange: e => {
        const k = e.target.value;
        const art = k === 'ruestung' ? dbForm.armorType && dbForm.armorType !== 'shield' ? dbForm.armorType : 'light' : k === 'schild' ? 'shield' : '';
        const basis = (ARMOR_KINDS.find(a => a.key === art) || {}).basis || 0;
        setDbForm(f => ({
          ...f,
          gearKind: k,
          armorType: art,
          baseAC: art ? +f.baseAC || basis : 0
        }));
      }
    }, GEAR_KINDS.map(g => /*#__PURE__*/React.createElement("option", {
      key: g.key,
      value: g.key
    }, g.label)))), dbForm.gearKind === 'ruestung' && /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "R\xFCstungsart"), /*#__PURE__*/React.createElement("select", {
      className: "form-input",
      value: dbForm.armorType || 'light',
      onChange: e => {
        const art = e.target.value;
        setDbForm(f => ({
          ...f,
          armorType: art,
          baseAC: (ARMOR_KINDS.find(a => a.key === art) || {}).basis || 0
        }));
      }
    }, ARMOR_KINDS.filter(a => a.key && a.key !== 'shield').map(a => /*#__PURE__*/React.createElement("option", {
      key: a.key,
      value: a.key
    }, a.label)))), (dbForm.gearKind === 'ruestung' || dbForm.gearKind === 'schild') && /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, dbForm.gearKind === 'schild' ? 'Bonus zur RK' : 'Basis-RK'), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      min: 0,
      max: 25,
      wert: dbForm.baseAC || 0,
      onWert: v => setDbForm(f => ({
        ...f,
        baseAC: v
      }))
    })), dbForm.gearKind && /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Magischer RK-Bonus"), /*#__PURE__*/React.createElement(ZahlFeld, {
      className: "form-input",
      min: -5,
      max: 10,
      wert: dbForm.acBonus || 0,
      onWert: v => setDbForm(f => ({
        ...f,
        acBonus: v
      })),
      placeholder: "z.B. +1"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "Geh\xF6rt zu einem Set (optional)"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      list: "hb-set-namen",
      value: dbForm.setName || '',
      onChange: e => setDbForm(f => ({
        ...f,
        setName: e.target.value
      })),
      placeholder: "z.B. Hain des Ersten Lichts"
    }), /*#__PURE__*/React.createElement("datalist", {
      id: "hb-set-namen"
    }, [...new Set((activeLib.item || []).map(e => e.setName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de')).map(n => /*#__PURE__*/React.createElement("option", {
      key: n,
      value: n
    })))), /*#__PURE__*/React.createElement("div", {
      className: "form-group form-full"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label"
    }, "\u2726 Effekte"), /*#__PURE__*/React.createElement(EffectEditor, {
      effects: dbForm.effects || [],
      onChange: v => setDbForm(f => ({
        ...f,
        effects: v
      })),
      hint: "Wirken, solange das St\xFCck getragen wird."
    }))), /*#__PURE__*/React.createElement("div", {
      className: "form-actions",
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-cancel",
      onClick: () => {
        setDbForm(null);
        setDbFormId(null);
      }
    }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
      className: "btn-save",
      onClick: saveDbEntry
    }, "\uD83D\uDCBE Speichern"))) : /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }
    }, (() => {
      // Build search/filter state via a local component trick using refs on window
      const wk = '_dbSearch_' + dbTab;
      const wkt = '_dbTagFilter_' + dbTab;
      if (window[wk] === undefined) window[wk] = '';
      if (window[wkt] === undefined) window[wkt] = [];
      const q = window[wk];
      const activeTags = window[wkt];

      // Collect all tags from entries
      const allTags = [...new Set(entries.flatMap(e => {
        if (dbTab === 'spell') return [...(e.classes || []), ...(e.damageTags || [])];
        if (dbTab === 'item') return e.tags || [];
        if (dbTab === 'wildshape') return e.tags || [];
        if (dbTab === 'weapon') return e.properties || [];
        return [];
      }))].filter(Boolean).sort();
      const RARITY_ORDER = {
        gewöhnlich: 0,
        ungewöhnlich: 1,
        selten: 2,
        sehr_selten: 3,
        legendär: 4,
        artefakt: 5
      };
      const dbItemSort = window['_dbItemSort_'] || 'name';
      const sorted = [...entries].sort((a, b) => {
        if (dbTab === 'item' && dbItemSort === 'rarity') {
          const ra = RARITY_ORDER[a.rarity] ?? 0,
            rb = RARITY_ORDER[b.rarity] ?? 0;
          return ra !== rb ? ra - rb : a.name.localeCompare(b.name, 'de');
        }
        return a.name.localeCompare(b.name, 'de');
      });
      const filtered = sorted.filter(e => {
        const matchQ = !q || e.name.toLowerCase().includes(q);
        if (!matchQ) return false;
        if (dbTab === 'spell' && dbGradeFilter !== '' && String(e.level) !== String(dbGradeFilter)) return false;
        if (activeTags.length === 0) return true;
        const eTags = dbTab === 'spell' ? [...(e.classes || []), ...(e.damageTags || [])] : dbTab === 'item' ? e.tags || [] : dbTab === 'wildshape' ? e.tags || [] : e.properties || [];
        return activeTags.every(t => eTags.includes(t));
      });
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 10,
          flexShrink: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 6,
          marginBottom: 6,
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement("input", {
        className: "form-input",
        style: {
          flex: 1,
          padding: '6px 10px',
          fontSize: 13,
          boxSizing: 'border-box',
          minWidth: 0
        },
        placeholder: `${entries.length} Einträge durchsuchen...`,
        defaultValue: q,
        onInput: e => {
          window[wk] = e.target.value.toLowerCase();
          setDbListTick(n => n + 1);
        }
      }), dbTab === 'spell' && /*#__PURE__*/React.createElement("select", {
        className: "tpl-filter-select",
        style: {
          flexShrink: 0,
          minWidth: 110
        },
        value: dbGradeFilter,
        onChange: e => {
          setDbGradeFilter(e.target.value);
          setDbListTick(n => n + 1);
        }
      }, /*#__PURE__*/React.createElement("option", {
        value: ""
      }, "Alle Grade"), /*#__PURE__*/React.createElement("option", {
        value: "0"
      }, "Zaubertrick"), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => /*#__PURE__*/React.createElement("option", {
        key: l,
        value: l
      }, "Grad ", l))), dbTab === 'item' && /*#__PURE__*/React.createElement("select", {
        className: "tpl-filter-select",
        style: {
          flexShrink: 0,
          minWidth: 120
        },
        defaultValue: "name",
        onChange: e => {
          window['_dbItemSort_'] = e.target.value;
          setDbListTick(n => n + 1);
        }
      }, /*#__PURE__*/React.createElement("option", {
        value: "name"
      }, "A\u2013Z Name"), /*#__PURE__*/React.createElement("option", {
        value: "rarity"
      }, "Seltenheit"))), /*#__PURE__*/React.createElement("button", {
        className: "btn-add",
        style: {
          width: '100%',
          marginBottom: 6
        },
        onClick: () => openDbForm(dbTab, null)
      }, "+ Neu"), allTags.length > 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4
        }
      }, allTags.map(t => {
        const on = activeTags.includes(t);
        const col = dbTab === 'spell' ? {
          Feuer: '#e07030',
          Kälte: '#70b8d8',
          Blitz: '#c0d850',
          Säure: '#90c040',
          Gift: '#80b030',
          Nekrose: '#9060c0',
          Strahlend: '#f0e060',
          Psychisch: '#c070d0',
          Kraft: '#80a0f0',
          Barde: '#4090c0',
          Druide: '#52b788',
          Hexenmeister: '#9060c0',
          Kleriker: '#e0c040',
          Magier: '#6080d0',
          Paladin: '#e0a030',
          Waldläufer: '#70a050',
          Zauberer: '#c060a0',
          Kämpfer: '#c08040',
          Mönch: '#d09040',
          Schurke: '#808080',
          Barbar: '#c84040',
          Artifizient: '#70b8c8'
        }[t] || '#c9a84c' : 'var(--gold)';
        return /*#__PURE__*/React.createElement("button", {
          key: t,
          onClick: () => {
            window[wkt] = on ? activeTags.filter(x => x !== t) : [...activeTags, t];
            setDbListTick(n => n + 1);
          },
          style: {
            padding: '2px 8px',
            borderRadius: 10,
            fontFamily: "'Roboto Condensed',sans-serif",
            fontSize: 9,
            cursor: 'pointer',
            border: `1px solid ${on ? col : col + '50'}`,
            background: on ? col + '20' : 'transparent',
            color: on ? col : 'var(--text-muted)'
          }
        }, t);
      }), activeTags.length > 0 && /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          window[wkt] = [];
          setDbListTick(n => n + 1);
        },
        style: {
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 10,
          padding: '2px 4px'
        }
      }, "\u2715 zur\xFCcksetzen")), (q || activeTags.length > 0) && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10,
          color: 'var(--text-muted)',
          fontFamily: "'Roboto Condensed',sans-serif",
          marginTop: 4
        }
      }, filtered.length, " / ", entries.length, " Eintr\xE4ge")), /*#__PURE__*/React.createElement("div", {
        style: {
          overflowY: 'auto',
          flex: 1
        }
      }, entries.length === 0 ? /*#__PURE__*/React.createElement("div", {
        style: {
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          fontSize: 13,
          marginBottom: 12
        }
      }, "Noch keine eigenen Eintr\xE4ge.") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
        style: {
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          fontSize: 13
        }
      }, "Keine Eintr\xE4ge gefunden.") : filtered.map((e, i) => {
        const expKey = dbTab + ':' + e.name;
        const isExp = dbExpandedEntry === expKey;
        return /*#__PURE__*/React.createElement("div", {
          key: i,
          style: {
            background: 'var(--bg-card)',
            border: '1px solid ' + (isExp ? 'var(--border-bright)' : 'var(--border)'),
            borderRadius: 4,
            marginBottom: 6,
            overflow: 'hidden'
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            cursor: 'pointer'
          },
          onClick: () => setDbExpandedEntry(isExp ? null : expKey)
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 10,
            color: 'var(--text-muted)',
            transition: 'transform 0.15s',
            transform: isExp ? 'rotate(90deg)' : 'rotate(0deg)'
          }
        }, "\u25B6"), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1,
            minWidth: 0
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }
        }, dbTab === 'item' && /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 16
          }
        }, e.icon || '🎒'), /*#__PURE__*/React.createElement("div", {
          style: {
            fontFamily: "'Roboto Condensed',sans-serif",
            fontSize: 13,
            color: 'var(--text-primary)'
          }
        }, e.name)), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 2
          }
        }, dbTab === 'spell' && `Grad ${e.level} · ${e.school} · ${e.castingTime}`, dbTab === 'weapon' && `${e.damage} ${e.damageType}schaden · ${(e.properties || []).join(', ') || '—'}`, dbTab === 'wildshape' && `CR ${e.cr} · ${e.size} · RK ${e.ac} · TP ${e.hp}`, dbTab === 'item' && `${(RARITIES.find(r => r.key === e.rarity) || RARITIES[0]).label}${e.weight ? ' · ' + e.weight + ' kg' : ''}${e.gearKind ? ' · ' + ((GEAR_KINDS.find(g => g.key === e.gearKind) || {}).label || '') : ''}`, dbTab === 'set' && (() => {
          const st = (e.stufen || []).map(s => +s.teile || 0).sort((a, b) => a - b);
          const teile = (activeLib.item || []).filter(i => i.setName === e.name).length;
          return (st.length ? 'Stufen bei ' + st.join(', ') + ' Teilen' : 'Noch keine Stufen') + ' · ' + teile + ' Gegenstand' + (teile === 1 ? '' : 'e') + ' in der Datenbank';
        })())), /*#__PURE__*/React.createElement("button", {
          onClick: ev => {
            ev.stopPropagation();
            openDbForm(dbTab, e);
          },
          style: {
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 3,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px 9px',
            fontSize: 11
          }
        }, "\u270E"), /*#__PURE__*/React.createElement("button", {
          onClick: ev => {
            ev.stopPropagation();
            deleteDbEntry(dbTab, e.name);
          },
          style: {
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px 6px',
            fontSize: 14
          }
        }, "\u2715")), isExp && /*#__PURE__*/React.createElement("div", {
          style: {
            padding: '8px 12px 10px',
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }
        }, dbTab === 'spell' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Reichw."), " ", e.range || '—', " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "Dauer"), " ", e.duration || '—', " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "Komp."), " ", e.components || '—'), (e.classes || []).length > 0 && /*#__PURE__*/React.createElement("div", {
          style: {
            marginTop: 4
          }
        }, /*#__PURE__*/React.createElement("strong", null, "Klassen:"), " ", e.classes.join(', ')), e.description && /*#__PURE__*/React.createElement("div", {
          style: {
            marginTop: 6,
            fontFamily: "'Roboto',sans-serif",
            fontSize: 13,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap'
          }
        }, e.description.slice(0, 300), e.description.length > 300 ? '…' : '')), dbTab === 'weapon' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Reichw."), " ", e.range || '—', " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "Eigenschaften:"), " ", (e.properties || []).join(', ') || '—'), e.description && /*#__PURE__*/React.createElement("div", {
          style: {
            marginTop: 6,
            whiteSpace: 'pre-wrap'
          }
        }, e.description)), dbTab === 'wildshape' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Bewegung:"), " ", e.speed || '—', " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "Sinne:"), " ", e.senses || '—'), e.skills && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Fertigk.:"), " ", e.skills)), dbTab === 'set' && /*#__PURE__*/React.createElement(React.Fragment, null, e.description && /*#__PURE__*/React.createElement("div", {
          style: {
            marginBottom: 6
          }
        }, e.description), (e.stufen || []).slice().sort((a, b) => (+a.teile || 0) - (+b.teile || 0)).map((st, si) => /*#__PURE__*/React.createElement("div", {
          key: si,
          style: {
            marginBottom: 5
          }
        }, /*#__PURE__*/React.createElement("strong", null, st.teile, " Teile:"), ' ', (st.effects || []).length === 0 ? /*#__PURE__*/React.createElement("span", {
          style: {
            fontStyle: 'italic'
          }
        }, "noch nichts hinterlegt") : (st.effects || []).map((fxE, fi) => /*#__PURE__*/React.createElement("span", {
          key: fi,
          className: "fx-chip"
        }, EFFECT_LABELS[fxE.target] || fxE.target, " ", effectText(fxE))))), (() => {
          const teile = (activeLib.item || []).filter(i => i.setName === e.name);
          return teile.length > 0 && /*#__PURE__*/React.createElement("div", {
            style: {
              marginTop: 6
            }
          }, /*#__PURE__*/React.createElement("strong", null, "Teile:"), " ", teile.map(i => i.name).join(', '));
        })()), dbTab === 'item' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start'
          }
        }, e.imageData && /*#__PURE__*/React.createElement("img", {
          src: e.imageData,
          style: {
            width: 64,
            height: 64,
            objectFit: 'contain',
            borderRadius: 4,
            border: '1px solid var(--border)',
            flexShrink: 0,
            cursor: 'zoom-in'
          },
          onClick: ev => {
            ev.stopPropagation();
            setImgViewer({
              name: e.name,
              imageData: e.imageData
            });
          }
        }), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1
          }
        }, (e.tags || []).length > 0 && /*#__PURE__*/React.createElement("div", {
          style: {
            marginBottom: 4
          }
        }, (e.tags || []).map(t => /*#__PURE__*/React.createElement("span", {
          key: t,
          className: "inv-tag"
        }, t))), e.setName && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Set:"), " ", e.setName), e.gearKind && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Platz:"), " ", (GEAR_KINDS.find(g => g.key === e.gearKind) || {}).label, e.armorType === 'shield' && ' · +' + (+e.baseAC || 2) + ' RK', e.armorType && e.armorType !== 'shield' && ' · ' + ((ARMOR_KINDS.find(a => a.key === e.armorType) || {}).label || '') + ', Basis ' + (+e.baseAC || 0), (+e.acBonus || 0) !== 0 && ' · ' + (+e.acBonus >= 0 ? '+' : '') + +e.acBonus + ' RK magisch'), (e.effects || []).length > 0 && /*#__PURE__*/React.createElement("div", {
          style: {
            marginTop: 4,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4
          }
        }, (e.effects || []).map((fxE, fi) => /*#__PURE__*/React.createElement("span", {
          key: fi,
          className: "fx-chip"
        }, EFFECT_LABELS[fxE.target] || fxE.target, " ", effectText(fxE)))), e.source && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Erhalten durch:"), " ", e.source), e.description && /*#__PURE__*/React.createElement("div", {
          style: {
            marginTop: 4
          }
        }, e.description))))));
      })));
    })()), !dbForm && /*#__PURE__*/React.createElement("div", {
      className: "form-actions",
      style: {
        marginTop: 12,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-cancel",
      onClick: () => setShowDB(false)
    }, "Schlie\xDFen"))));
  })(), confirmDlg && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay",
    style: {
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "confirm-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "confirm-icon"
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", {
    className: "confirm-msg"
  }, confirmDlg.msg), /*#__PURE__*/React.createElement("div", {
    className: "confirm-actions"
  }, confirmDlg.onOk && /*#__PURE__*/React.createElement("button", {
    className: "confirm-cancel",
    onClick: () => setConfirmDlg(null)
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "confirm-ok",
    onClick: () => {
      if (confirmDlg.onOk) confirmDlg.onOk();
      setConfirmDlg(null);
    }
  }, confirmDlg.okLabel || 'Bestätigen')))), verwaltung && /*#__PURE__*/React.createElement(Fenster, {
    onClick: () => setVerwaltung(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 620
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\uD83D\uDEE0 Verwaltung \xB7 ", svCode), verwaltung.err && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#3a1010",
      border: "1px solid var(--crimson)",
      borderRadius: 4,
      padding: "8px 12px",
      fontSize: 13,
      color: "#e87070",
      marginBottom: 8
    }
  }, "\u26A0\uFE0F ", verwaltung.err), verwaltung.gezeigt && /*#__PURE__*/React.createElement("div", {
    className: "verw-passwort"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, verwaltung.gezeigt.name), " ", verwaltung.gezeigt.was, ".", verwaltung.gezeigt.pw !== '—' && /*#__PURE__*/React.createElement(React.Fragment, null, ' ', "Einmalpasswort:", /*#__PURE__*/React.createElement("code", {
    className: "verw-code"
  }, verwaltung.gezeigt.pw))), /*#__PURE__*/React.createElement("i", null, verwaltung.gezeigt.pw !== '—' ? 'Gib es weiter — es steht nur hier und nur jetzt. Beim ersten Anmelden muss ein eigenes gewählt werden.' : 'Wer dazugehört, bestimmst du oben über die Rolle. Ohne Mitglied ist eine Gruppe leer.'), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: () => setVerwaltung(v => ({
      ...v,
      gezeigt: null
    }))
  }, "Verstanden")), /*#__PURE__*/React.createElement("div", {
    className: "einst-roll"
  }, /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83D\uDC65 Konten",
    kurz: (verwaltung.users || []).length + ((verwaltung.users || []).length === 1 ? ' Konto' : ' Konten')
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Diese Rolle gilt f\xFCr die ganze Gruppe und nur dort, wo f\xFCr ein Abenteuer niemand eingetragen ist. Wer welches Abenteuer leitet, steht in den Einstellungen des Abenteuers \u2014 und daf\xFCr kommt jedes Konto in Frage, auch ein Spieler. Wer Eberron leitet, kann in Strahd mitspielen."), verwaltung.laedt && /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      margin: 0
    }
  }, "Wird geholt\u2026"), (verwaltung.users || []).map(u => {
    const m = (verwaltung.mitglied || []).find(x => +x.user_id === +u.id && x.session_code === svCode);
    const selbst = konto && +konto.id === +u.id;
    const ausConfig = verwaltung.adminUser && u.name === verwaltung.adminUser;
    return /*#__PURE__*/React.createElement("div", {
      className: "verw-zeile",
      key: u.id
    }, /*#__PURE__*/React.createElement("span", {
      className: "verw-name"
    }, u.name, (+u.ist_admin === 1 || ausConfig) && /*#__PURE__*/React.createElement("i", {
      className: "verw-marke admin"
    }, "Verwaltung"), +u.muss_wechseln === 1 && /*#__PURE__*/React.createElement("i", {
      className: "verw-marke"
    }, "Einmalpasswort"), +u.angemeldet > 0 && /*#__PURE__*/React.createElement("i", {
      className: "verw-marke an"
    }, "angemeldet")), /*#__PURE__*/React.createElement("select", {
      className: "form-select verw-rolle",
      "aria-label": 'Rolle von ' + u.name,
      value: m && m.rolle || '',
      onChange: e => rolleSetzen(u, e.target.value)
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "nicht in der Gruppe"), /*#__PURE__*/React.createElement("option", {
      value: "spieler"
    }, "Spieler"), /*#__PURE__*/React.createElement("option", {
      value: "dm"
    }, "Spielleitung")), /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      title: "Neues Einmalpasswort",
      onClick: () => kontoZuruecksetzen(u)
    }, "\uD83D\uDD11"), /*#__PURE__*/React.createElement("button", {
      className: "fx-del",
      title: selbst ? 'Das eigene Konto bleibt' : ausConfig ? 'Steht in der Konfiguration' : 'Konto löschen',
      disabled: selbst || ausConfig,
      onClick: () => kontoEntfernen(u)
    }, "\u2715"));
  })), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\uD83D\uDDFA Neue Gruppe",
    kurz: "anlegen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Eine Gruppe ist ein eigener Satz Helden, Abenteuer und Gegner. Wer dazu geh\xF6rt, bestimmst du oben."), /*#__PURE__*/React.createElement("div", {
    className: "einst-klasse"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "Code, z.B. STRAHD",
    maxLength: 20,
    value: verwaltung.neueGruppe || '',
    onChange: e => setVerwaltung(v => ({
      ...v,
      neueGruppe: e.target.value.toUpperCase(),
      err: ''
    })),
    onKeyDown: e => e.key === 'Enter' && gruppeAnlegen()
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: gruppeAnlegen
  }, "Anlegen"))), /*#__PURE__*/React.createElement(EinstBlock, {
    titel: "\u2726 Neues Konto",
    kurz: "anlegen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 0,
      marginBottom: 10
    }
  }, "Das Passwort wird hier erzeugt und einmal angezeigt. Danach steht in der Datenbank nur noch sein Hash \u2014 auch die Verwaltung kann es nicht nachsehen."), /*#__PURE__*/React.createElement("div", {
    className: "einst-klasse"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "Name des Kontos",
    maxLength: 40,
    value: verwaltung.neuName || '',
    onChange: e => setVerwaltung(v => ({
      ...v,
      neuName: e.target.value,
      err: ''
    })),
    onKeyDown: e => e.key === 'Enter' && kontoAnlegen()
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn-icon",
    onClick: kontoAnlegen
  }, "Anlegen")))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setVerwaltung(null)
  }, "Schlie\xDFen")))), kontoDlg && /*#__PURE__*/React.createElement(Fenster, {
    onClick: () => setKontoDlg(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 560
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\uD83D\uDC64 Mein Konto"), kontoDlg.laedt && /*#__PURE__*/React.createElement("p", {
    className: "einst-hinweis"
  }, "Wird geholt\u2026"), kontoDlg.err && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#3a1010",
      border: "1px solid var(--crimson)",
      borderRadius: 4,
      padding: "8px 12px",
      fontSize: 13,
      color: "#e87070",
      marginBottom: 8
    }
  }, "\u26A0\uFE0F ", kontoDlg.err), kontoDlg.daten && (() => {
    const d = kontoDlg.daten;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: '62vh',
        overflowY: 'auto',
        paddingRight: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "einst-block"
    }, /*#__PURE__*/React.createElement("div", {
      className: "einst-titel"
    }, "\uD83D\uDD11 Zugang"), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Name"), /*#__PURE__*/React.createElement("b", null, d.konto.name)), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Rolle"), /*#__PURE__*/React.createElement("b", null, d.konto.ist_admin ? 'Verwaltung' : rolleIn(konto, svCode) === 'dm' ? 'Spielleitung' : 'Spieler')), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Gruppen"), /*#__PURE__*/React.createElement("b", null, (d.gruppen || []).map(g => g.session_code + ' (' + g.rolle + ')').join(', ') || '—')), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Offene Anmeldungen"), /*#__PURE__*/React.createElement("b", null, (d.anmeldungen || []).length)), /*#__PURE__*/React.createElement("div", {
      className: "einst-klassen-fuss"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      onClick: () => {
        setKontoDlg(null);
        setPasswortDlg({
          alt: '',
          neu: '',
          neu2: '',
          err: '',
          pflicht: false
        });
      }
    }, "Passwort \xE4ndern"), d.konto.ist_admin && /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      onClick: verwaltungOeffnen
    }, "\uD83D\uDEE0 Verwaltung"))), /*#__PURE__*/React.createElement("div", {
      className: "einst-block"
    }, /*#__PURE__*/React.createElement("div", {
      className: "einst-titel"
    }, "\uD83D\uDCCB Was \xFCber dich gespeichert ist"), /*#__PURE__*/React.createElement("div", {
      className: "einst-hinweis",
      style: {
        marginTop: 0,
        marginBottom: 10
      }
    }, "Das Abenteuerlog schreibt mit, was an einem Bogen ge\xE4ndert wird \u2014 seit es Konten gibt auch, ", /*#__PURE__*/React.createElement("b", null, "wer"), " es war. Gespeichert wird daf\xFCr deine Kennung, nicht dein Name; wird dein Konto einmal gel\xF6scht, bleibt die Zeile stehen und verliert die Kennung. Deine Spielleitung sieht das Log ihres Abenteuers, die Verwaltung alles."), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Dir geh\xF6rende B\xF6gen"), /*#__PURE__*/React.createElement("b", null, (d.boegen || []).length)), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Logzeilen von dir"), /*#__PURE__*/React.createElement("b", null, d.log_zeilen)), /*#__PURE__*/React.createElement("div", {
      className: "konto-zeile"
    }, /*#__PURE__*/React.createElement("span", null, "Aufbewahrung"), /*#__PURE__*/React.createElement("b", null, logTage, " Tage")), (d.log || []).length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "tabellenhuelle",
      style: {
        marginTop: 10,
        maxHeight: 180,
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      className: "einst-automat"
    }, /*#__PURE__*/React.createElement("tbody", null, (d.log || []).slice(0, 25).map(z => /*#__PURE__*/React.createElement("tr", {
      key: z.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "name"
    }, (z.created_at || '').slice(0, 16).replace('T', ' ')), /*#__PURE__*/React.createElement("td", {
      className: "name"
    }, z.char_name || '—'), /*#__PURE__*/React.createElement("td", null, z.action)))))), /*#__PURE__*/React.createElement("div", {
      className: "einst-klassen-fuss"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn-icon",
      onClick: meineDatenSichern
    }, "\u2B07 Alles als Datei"))), konto && konto.ist_admin && /*#__PURE__*/React.createElement("div", {
      className: "einst-block"
    }, /*#__PURE__*/React.createElement("div", {
      className: "einst-titel"
    }, "\uD83D\uDDC4 Aufbewahrung des Logs"), /*#__PURE__*/React.createElement("div", {
      className: "einst-hinweis",
      style: {
        marginTop: 0,
        marginBottom: 10
      }
    }, "\xC4ltere Zeilen werden gel\xF6scht. Gilt f\xFCr die ganze Gruppe, und nur die Verwaltung stellt es."), /*#__PURE__*/React.createElement("label", {
      className: "einst-max"
    }, "Aufbewahren", /*#__PURE__*/React.createElement("select", {
      className: "form-select",
      value: logTage,
      onChange: e => logFristSetzen(+e.target.value)
    }, [30, 90, 180, 365, 3650].map(t => /*#__PURE__*/React.createElement("option", {
      key: t,
      value: t
    }, t === 365 ? '1 Jahr' : t > 365 ? t / 365 + ' Jahre' : t + ' Tage'))))));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setKontoDlg(null)
  }, "Schlie\xDFen")))), passwortDlg && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 400
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\uD83D\uDD11 Passwort w\xE4hlen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginBottom: 16,
      lineHeight: 1.55
    }
  }, passwortDlg.pflicht ? 'Du bist mit einem Einmalpasswort angemeldet. Wähle jetzt dein eigenes — das alte gilt danach nicht mehr.' : 'Das neue Passwort gilt sofort. Andere Geräte, auf denen du angemeldet bist, werden abgemeldet.'), !passwortDlg.pflicht && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Bisheriges Passwort"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    value: passwortDlg.alt,
    onChange: e => setPasswortDlg({
      ...passwortDlg,
      alt: e.target.value,
      err: ''
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Neues Passwort"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    autoFocus: true,
    placeholder: "Mind. 6 Zeichen",
    value: passwortDlg.neu,
    onChange: e => setPasswortDlg({
      ...passwortDlg,
      neu: e.target.value,
      err: ''
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Noch einmal"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    value: passwortDlg.neu2,
    onChange: e => setPasswortDlg({
      ...passwortDlg,
      neu2: e.target.value,
      err: ''
    }),
    onKeyDown: e => e.key === 'Enter' && passwortAendern()
  })), passwortDlg.err && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#3a1010",
      border: "1px solid var(--crimson)",
      borderRadius: 4,
      padding: "8px 12px",
      fontSize: 13,
      color: "#e87070",
      marginBottom: 8
    }
  }, "\u26A0\uFE0F ", passwortDlg.err), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, !passwortDlg.pflicht && /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setPasswortDlg(null)
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: passwortAendern
  }, "\xDCbernehmen")))), showAutomat && /*#__PURE__*/React.createElement(TaverneSchirm, {
    cfg: advObj && advObj.automat,
    helden: tavernenHelden,
    heldStart: sel,
    onSchliessen: () => setShowAutomat(false)
  }), advEinstellung && (isDmMode || konto && konto.ist_admin) && /*#__PURE__*/React.createElement(AbenteuerEinstellungen, {
    adv: advEinstellung,
    helden: chars.filter(c => (c.adventure || (abenteuer[0] || {}).id) === advEinstellung.id),
    besitzer: besitzer,
    mitglieder: mitglieder,
    onBesitzer: besitzerSetzen,
    advDms: advDms[advEinstellung.id] || [],
    istAdmin: !!(konto && konto.ist_admin),
    onAdvDms: ids => advDmSetzen(advEinstellung.id, ids),
    onAendern: setAdvEinstellung,
    onAbbrechen: () => setAdvEinstellung(null),
    onSpeichern: () => {
      // Leere Klassennamen fallen weg, sonst stuende eine namenlose
      // Zeile im Auswahlfeld des Bogens.
      const geputzt = {
        ...advEinstellung
      };
      if (Array.isArray(geputzt.klassen)) {
        geputzt.klassen = geputzt.klassen.filter(k => (k.name || '').trim()).map(k => ({
          name: k.name.trim(),
          color: k.color || '#8b9198',
          attr: k.attr !== undefined ? k.attr : SPELL_ATTR[k.name.trim()] || ''
        }));
        if (!geputzt.klassen.length) delete geputzt.klassen;
      }
      advSpeichern(abenteuer.map(a => a.id === geputzt.id ? geputzt : a));
      setAdvEinstellung(null);
    }
  }), ereignisForm && isDmMode && /*#__PURE__*/React.createElement(EreignisFormular, {
    ereignis: ereignisForm.e,
    neu: ereignisForm.neu,
    chronik: chronik,
    advId: advId,
    abenteuer: abenteuer,
    chars: chars,
    onAendern: e => setEreignisForm(f => ({
      ...f,
      e
    })),
    onSpeichern: () => ereignisSpeichern(ereignisForm.e),
    onAbbrechen: () => setEreignisForm(null)
  }), zeitOffen && isDmMode && /*#__PURE__*/React.createElement(ZeitDialog, {
    chronik: chronik,
    advId: advId,
    chars: chars,
    onAnwenden: zeitAnwenden,
    onUhrStellen: uhrStellen,
    onAbbrechen: () => setZeitOffen(false)
  }), showKampfSicht && kampfSichtDaten && !isDmMode && /*#__PURE__*/React.createElement(KampfSicht, {
    kampf: kampfSichtDaten,
    helden: advChars,
    eigeneIds: eigeneHeldenIds,
    setDefs: setDefs,
    tpOffen: tpOffen,
    onAnsage: ansageHeldId ? () => setAnsageFuer(ansageHeldId) : null,
    onSchliessen: () => setShowKampfSicht(false)
  }), ansageFuer && kampfSichtDaten && /*#__PURE__*/React.createElement(AnsageFenster, {
    held: chars.find(c => c.id === ansageFuer),
    kampf: kampfSichtDaten,
    helden: advChars,
    runde: kampfSichtDaten.runde || 1,
    onAbbrechen: () => setAnsageFuer(null),
    onSenden: ansageSenden
  }), showKampf && isDmMode && /*#__PURE__*/React.createElement(KampfAnsicht, {
    kampf: kampf,
    setKampf: setKampf,
    enemies: enemies,
    encounters: encounters,
    helden: advChars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode)),
    setDefs: setDefs,
    abenteuer: abenteuer,
    advId: advId,
    onSchliessen: () => setShowKampf(false),
    onGegnerBlatt: id => {
      const g = enemies.find(e => e.id === id);
      if (g) setEnemyView(g);
    },
    onHeldAendern: heldImKampfAendern,
    heldNotizen: dmLibrary.heldNotizen,
    onHeldNotiz: heldNotizSetzen,
    onHeldNotizSichern: heldNotizSichern,
    ansagen: ansagen,
    onAnsageWeg: ansageWeg,
    onFrage: appConfirm
  }), encForm && /*#__PURE__*/React.createElement(BegegnungFormular, {
    form: encForm,
    setForm: setEncForm,
    enemies: enemies,
    abenteuer: abenteuer,
    neu: !encounters.some(x => x.id === encForm.id),
    onAbbrechen: () => setEncForm(null),
    onSpeichern: async () => {
      if (!encForm.name.trim()) {
        appAlert('Die Begegnung braucht einen Namen.');
        return;
      }
      if (await saveEncounter(encForm)) setEncForm(null);
    }
  }), enemyView && !enemyForm && /*#__PURE__*/React.createElement(GegnerBlatt, {
    gegner: enemyView,
    onSchliessen: () => setEnemyView(null),
    onBearbeiten: () => setEnemyForm({
      ...enemyView
    }),
    onBild: setImgViewer,
    onLoeschen: () => {
      const id = enemyView.id;
      setEnemyView(null);
      deleteEnemy(id);
    }
  }), enemyForm && /*#__PURE__*/React.createElement(GegnerFormular, {
    form: enemyForm,
    setForm: setEnemyForm,
    neu: !enemies.some(x => x.id === enemyForm.id),
    onAbbrechen: () => setEnemyForm(null),
    onSpeichern: async () => {
      if (!enemyForm.name.trim()) {
        appAlert('Der Gegner braucht einen Namen.');
        return;
      }
      const gespeichert = await saveEnemy(enemyForm);
      if (gespeichert) {
        setEnemyView(enemyForm);
        setEnemyForm(null);
      }
    }
  }), showAdvVerwaltung && /*#__PURE__*/React.createElement(Fenster, {
    onClick: () => setShowAdvVerwaltung(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 460
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\uD83D\uDDFA Abenteuer"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12.5,
      color: 'var(--text-muted)',
      lineHeight: 1.6,
      marginBottom: 14
    }
  }, "Jedes Abenteuer hat eigene Helden. Zauber, Waffen und Gegenst\xE4nde aus der Datenbank gelten weiterhin f\xFCr alle \u2014 ein Heiltrank ist in jeder Kampagne derselbe."), /*#__PURE__*/React.createElement("div", {
    className: "adv-verwaltung"
  }, abenteuer.map((a, i) => {
    const helden = chars.filter(c => (c.adventure || abenteuer[0].id) === a.id);
    return /*#__PURE__*/React.createElement("div", {
      className: "adv-zeile",
      key: a.id
    }, /*#__PURE__*/React.createElement("input", {
      className: "adv-zeile-name",
      defaultValue: a.name,
      key: 'n_' + a.id,
      "aria-label": 'Name des Abenteuers ' + a.name,
      onBlur: e => {
        const name = e.target.value.trim();
        if (!name || name === a.name) {
          e.target.value = a.name;
          return;
        }
        advSpeichern(abenteuer.map(x => x.id === a.id ? {
          ...x,
          name
        } : x));
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "adv-zeile-zahl"
    }, helden.length, " ", helden.length === 1 ? 'Held' : 'Helden'), (isDmMode || konto && konto.ist_admin) && /*#__PURE__*/React.createElement("button", {
      className: "adv-zeile-einst",
      "aria-label": 'Einstellungen für ' + a.name,
      title: "Einstellungen",
      onClick: () => {
        setShowAdvVerwaltung(false);
        setAdvEinstellung({
          ...a
        });
      }
    }, "\u2699"), /*#__PURE__*/React.createElement("button", {
      className: "adv-zeile-del",
      "aria-label": 'Abenteuer ' + a.name + ' löschen',
      title: helden.length ? 'Erst die Helden verschieben oder löschen' : abenteuer.length < 2 ? 'Das letzte Abenteuer bleibt' : 'Abenteuer löschen',
      disabled: helden.length > 0 || abenteuer.length < 2,
      onClick: () => appConfirm('Abenteuer „' + a.name + '“ löschen?', () => {
        const rest = abenteuer.filter(x => x.id !== a.id);
        advSpeichern(rest);
        if (advId === a.id) advWechseln(rest[0].id);
      }, 'Löschen')
    }, "\u2715"));
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    style: {
      width: '100%',
      marginTop: 10
    },
    onClick: () => {
      const id = 'adv_' + Date.now().toString(36);
      advSpeichern([...abenteuer, {
        id,
        name: 'Neues Abenteuer'
      }]);
      advWechseln(id);
      setShowAdvVerwaltung(false);
    }
  }, "+ Neues Abenteuer"), cur && abenteuer.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "adv-verschieben"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "\u201E", cur.name, "\u201C verschieben nach"), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: cur.adventure || abenteuer[0].id,
    onChange: e => {
      patchChar({
        adventure: e.target.value
      });
      advWechseln(e.target.value);
      setShowAdvVerwaltung(false);
    }
  }, abenteuer.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.name)))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setShowAdvVerwaltung(false)
  }, "Schlie\xDFen")))), showSetup && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\uD83D\uDC64 Anmelden"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      lineHeight: 1.6,
      marginBottom: 16
    }
  }, "Melde dich mit deinem Konto an. Deine Gruppe, deine Rolle und deine Helden h\xE4ngen daran \u2014 mehr musst du nicht wissen."), /*#__PURE__*/React.createElement("div", {
    className: "form-grid",
    style: {
      gridTemplateColumns: "1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "Dein Kontoname",
    maxLength: 40,
    autoFocus: true,
    value: setupForm.name || '',
    onChange: e => setSetupForm({
      ...setupForm,
      name: e.target.value
    }),
    onKeyDown: e => e.key === 'Enter' && applyKontoSetup()
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Passwort"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    placeholder: "Dein Passwort",
    value: setupForm.pass || '',
    onChange: e => setSetupForm({
      ...setupForm,
      pass: e.target.value
    }),
    onKeyDown: e => e.key === 'Enter' && applyKontoSetup()
  }))), setupErr && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#3a1010",
      border: "1px solid var(--crimson)",
      borderRadius: 4,
      padding: "8px 12px",
      fontSize: 13,
      color: "#e87070",
      marginBottom: 8
    }
  }, "\u26A0\uFE0F ", setupErr), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, svCode && /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setShowSetup(false)
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    style: {
      flex: 1,
      opacity: setupBusy ? 0.6 : 1
    },
    onClick: applyKontoSetup,
    disabled: setupBusy
  }, setupBusy ? "Verbinde..." : "👤 Anmelden")), /*#__PURE__*/React.createElement("div", {
    className: "einst-hinweis",
    style: {
      marginTop: 14,
      marginBottom: 0
    }
  }, "Ganz frischer Server? Das ", /*#__PURE__*/React.createElement("b", null, "allererste"), " Konto legt sich hier selbst an \u2014 unter dem Namen, der als ", /*#__PURE__*/React.createElement("code", null, "ADMIN_USER"), " in der ", /*#__PURE__*/React.createElement("code", null, "config.php"), "steht. Alle weiteren macht danach die Verwaltung.", /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    style: {
      marginLeft: 8
    },
    disabled: setupBusy,
    onClick: erstesKontoAnlegen
  }, "Erstes Konto anlegen")))), showTpl && tplData && /*#__PURE__*/React.createElement(Fenster, null, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 580
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, showTpl === 'spell' ? '📖 Zauber aus SRD wählen' : showTpl === 'wildshape' ? '🐺 Tierverwandlung – Bestiar' : '📖 Waffe aus SRD wählen', /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: "'Roboto',sans-serif",
      color: "var(--text-muted)",
      marginLeft: 10,
      fontWeight: "normal"
    }
  }, "SRD 5.1 \u2013 Creative Commons")), /*#__PURE__*/React.createElement("div", {
    className: "tpl-search-bar"
  }, /*#__PURE__*/React.createElement("input", {
    className: "tpl-search-input",
    placeholder: "Suchen...",
    autoFocus: true,
    value: tplSearch,
    onChange: e => setTplSearch(e.target.value)
  }), showTpl === 'spell' && /*#__PURE__*/React.createElement("select", {
    className: "tpl-filter-select",
    value: tplFilter,
    onChange: e => setTplFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "Alle Grade"), /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "Zaubertricks"), [1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: l
  }, "Grad ", l)))), showTpl === 'wildshape' && tplData && tplData.wildshapes && (() => {
    const allCRs = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '5', '6', '8'];
    const allTags = [...new Set(tplData.wildshapes.flatMap(w => w.tags))].sort();
    const filtered = fuzzyFilter(tplData.wildshapes.filter(w => (wsFilter.cr === 'all' || w.cr === wsFilter.cr) && (wsFilter.tag === 'all' || w.tags.includes(wsFilter.tag))), tplSearch, w => [w.name, w.type, ...w.tags, w.size]);
    const statMod = v => {
      const m = Math.floor((v - 10) / 2);
      return (m >= 0 ? '+' : '') + m;
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "ws-filters"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        color: "var(--text-muted)",
        alignSelf: "center"
      }
    }, "CR:"), ['all', ...allCRs].map(cr => /*#__PURE__*/React.createElement("button", {
      key: cr,
      className: "ws-filter-btn" + (wsFilter.cr === cr ? " active" : ""),
      onClick: () => setWsFilter(f => ({
        ...f,
        cr: cr
      }))
    }, cr === 'all' ? 'Alle' : cr))), /*#__PURE__*/React.createElement("div", {
      className: "ws-filters"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 10,
        color: "var(--text-muted)",
        alignSelf: "center"
      }
    }, "Tag:"), ['all', ...allTags].map(tag => /*#__PURE__*/React.createElement("button", {
      key: tag,
      className: "ws-filter-btn" + (wsFilter.tag === tag ? " active" : ""),
      onClick: () => setWsFilter(f => ({
        ...f,
        tag: tag
      }))
    }, tag === 'all' ? 'Alle' : tag))), /*#__PURE__*/React.createElement("div", {
      className: "tpl-count"
    }, filtered.length + (userLibrary.wildshape || []).length, " Tiere gefunden"), /*#__PURE__*/React.createElement("div", {
      className: "tpl-list"
    }, (userLibrary.wildshape || []).filter(w => fuzzyFilter([w], tplSearch, x => [x.name, x.type, ...(x.tags || [])]).length > 0).map((w, i) => {
      const isExp = wsExpand === 'cust_' + w.name;
      return /*#__PURE__*/React.createElement("div", {
        key: 'c' + i,
        className: "ws-card" + (isExp ? " expanded" : ""),
        style: {
          borderColor: 'var(--gold-dim)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-card-header",
        onClick: () => setWsExpand(isExp ? null : 'cust_' + w.name)
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-cr-badge",
        style: {
          borderColor: 'var(--gold-dim)',
          color: 'var(--gold)'
        }
      }, "CR ", w.cr), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-card-name"
      }, w.name, " ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          color: 'var(--gold)',
          fontFamily: "'Roboto Condensed',sans-serif"
        }
      }, "\u2605")), /*#__PURE__*/React.createElement("div", {
        className: "ws-card-meta"
      }, w.size, " \xB7 ", w.type, " \xB7 RK ", w.ac, " \xB7 TP ", w.hp), /*#__PURE__*/React.createElement("div", {
        className: "ws-tags"
      }, (w.tags || []).map(t => /*#__PURE__*/React.createElement("span", {
        className: "ws-tag",
        key: t
      }, t)))), /*#__PURE__*/React.createElement("div", {
        onClick: e => e.stopPropagation(),
        style: {
          display: 'flex',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("button", {
        style: {
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 3,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '3px 7px',
          fontSize: 11
        },
        onClick: () => {
          setShowTpl(null);
          setDbTab('wildshape');
          openDbForm('wildshape', w);
          setShowDB(true);
        }
      }, "\u270E"), /*#__PURE__*/React.createElement("button", {
        style: {
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '3px 5px',
          fontSize: 13
        },
        onClick: () => deleteDbEntry('wildshape', w.name)
      }, "\u2715"))));
    }), filtered.map((w, i) => {
      const isExp = wsExpand === w.name;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "ws-card" + (isExp ? " expanded" : ""),
        onClick: () => setWsExpand(isExp ? null : w.name)
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-card-header"
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-cr-badge"
      }, "CR ", w.cr), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-card-name"
      }, w.name), /*#__PURE__*/React.createElement("div", {
        className: "ws-card-meta"
      }, w.size, " \xB7 ", w.type, " \xB7 RK ", w.ac, " \xB7 TP ", w.hp, " \xB7 ", w.speed), /*#__PURE__*/React.createElement("div", {
        className: "ws-tags"
      }, w.tags.map(t => /*#__PURE__*/React.createElement("span", {
        className: "ws-tag",
        key: t
      }, t)))), /*#__PURE__*/React.createElement("button", {
        onClick: e => {
          e.stopPropagation();
          toggleWsFav(w.name);
        },
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: (cur.wsFavorites || []).includes(w.name) ? "#f0c040" : "var(--border-bright)",
          padding: "4px 6px",
          transition: "color 0.15s",
          lineHeight: 1
        },
        title: (cur.wsFavorites || []).includes(w.name) ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"
      }, (cur.wsFavorites || []).includes(w.name) ? "★" : "☆"), /*#__PURE__*/React.createElement("div", {
        style: {
          color: "var(--text-muted)",
          fontSize: 16
        }
      }, isExp ? '▲' : '▼')), isExp && /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 10
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-stats-grid"
      }, [['STR', w.str], ['GES', w.dex], ['KON', w.con], ['INT', w.int], ['WEI', w.wis], ['CHA', w.cha]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
        className: "ws-stat",
        key: l
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-stat-label"
      }, l), /*#__PURE__*/React.createElement("div", {
        className: "ws-stat-val"
      }, v), /*#__PURE__*/React.createElement("div", {
        className: "ws-stat-mod"
      }, statMod(v))))), w.senses && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 4
        }
      }, "\uD83D\uDC41 ", w.senses), w.skills && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 6
        }
      }, "\uD83C\uDFAF ", w.skills), w.abilities.length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "ws-abilities"
      }, w.abilities.map((a, ai) => /*#__PURE__*/React.createElement("div", {
        key: ai,
        style: {
          marginBottom: 2
        }
      }, "\u2022 ", a))), w.actions.length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "ws-actions"
      }, w.actions.map((a, ai) => /*#__PURE__*/React.createElement("div", {
        className: "ws-action",
        key: ai
      }, /*#__PURE__*/React.createElement("div", {
        className: "ws-action-name"
      }, "\u2694 ", a.name), /*#__PURE__*/React.createElement("div", null, a.desc))))));
    })));
  })(), showTpl === 'spell' && (() => {
    const CLASSES_LIST = ['Artifizient', 'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Kämpfer', 'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer'];
    const CLASS_COLORS_MAP = {
      'Artifizient': '#70b8c8',
      'Barbar': '#c84040',
      'Barde': '#4090c0',
      'Druide': '#52b788',
      'Hexenmeister': '#9060c0',
      'Kämpfer': '#c08040',
      'Kleriker': '#e0c040',
      'Magier': '#6080d0',
      'Mönch': '#d09040',
      'Paladin': '#e0a030',
      'Schurke': '#808080',
      'Waldläufer': '#70a050',
      'Zauberer': '#c060a0'
    };
    const DMG_LIST = ['Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekrotisch', 'Gleißend', 'Psychisch', 'Energie', 'Schall'];
    const basePre = tplData.spells.filter(s => tplFilter === 'all' || s.level === +tplFilter);
    const baseFiltered = basePre.filter(s => {
      const classOk = tplClassFilter.length === 0 || tplClassFilter.some(c => (s.classes || []).includes(c));
      const dmgOk = tplDmgFilter.length === 0 || tplDmgFilter.some(d => (s.damageTags || []).includes(d));
      return classOk && dmgOk;
    });
    const filtered = fuzzyFilter(baseFiltered, tplSearch, s => s.name);
    const customSpells = fuzzyFilter((userLibrary.spell || []).filter(s => tplFilter === 'all' || s.level === +tplFilter), tplSearch, s => s.name);
    const hasTagFilter = tplClassFilter.length > 0 || tplDmgFilter.length > 0;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 6,
        paddingBottom: 6,
        borderBottom: '1px solid var(--border)'
      }
    }, CLASSES_LIST.map(c => {
      const on = tplClassFilter.includes(c);
      const col = CLASS_COLORS_MAP[c] || '#c9a84c';
      return /*#__PURE__*/React.createElement("button", {
        key: c,
        onClick: () => setTplClassFilter(f => on ? f.filter(x => x !== c) : [...f, c]),
        style: {
          padding: '2px 8px',
          borderRadius: 10,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          border: '1px solid ' + (on ? col : col + '40'),
          background: on ? col + '22' : 'var(--bg-card)',
          color: on ? col : 'var(--text-muted)'
        }
      }, c);
    }), DMG_LIST.map(d => {
      const on = tplDmgFilter.includes(d);
      const dc = {
        Feuer: '#e07030',
        Kälte: '#70b8d8',
        Blitz: '#c0d850',
        Säure: '#90c040',
        Gift: '#80b030',
        Nekrose: '#9060c0',
        Strahlend: '#f0e060',
        Psychisch: '#c070d0',
        Kraft: '#80a0f0',
        'Schall': '#c0a0e0'
      }[d] || '#aaa';
      return /*#__PURE__*/React.createElement("button", {
        key: d,
        onClick: () => setTplDmgFilter(f => on ? f.filter(x => x !== d) : [...f, d]),
        style: {
          padding: '2px 8px',
          borderRadius: 10,
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 9,
          cursor: 'pointer',
          border: `1px solid ${on ? dc : dc + '40'}`,
          background: on ? dc + '22' : 'var(--bg-card)',
          color: on ? dc : 'var(--text-muted)'
        }
      }, "\u2694\uFE0F ", d);
    }), hasTagFilter && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setTplClassFilter([]);
        setTplDmgFilter([]);
      },
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 10,
        fontFamily: "'Roboto Condensed',sans-serif",
        padding: '2px 6px'
      }
    }, "\u2715 zur\xFCcksetzen")), /*#__PURE__*/React.createElement("div", {
      className: "tpl-count"
    }, filtered.length + customSpells.length, " Zauber gefunden"), /*#__PURE__*/React.createElement("div", {
      className: "tpl-list"
    }, customSpells.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--gold)',
        letterSpacing: '0.15em',
        marginBottom: 6,
        paddingBottom: 4,
        borderBottom: '1px solid var(--border)'
      }
    }, "\u2605 EIGENE EINTR\xC4GE"), customSpells.map((s, i) => {
      const sc = SC[s.school] || SC["Hervorrufung"];
      return /*#__PURE__*/React.createElement("div", {
        className: "tpl-item",
        key: 'c' + i,
        style: {
          borderColor: 'var(--gold-dim)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-orb",
        style: {
          backgroundColor: sc.bg,
          borderColor: sc.border,
          color: sc.text
        },
        onClick: () => pickSpell(s)
      }, s.level === 0 ? "∞" : s.level), /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-body",
        onClick: () => pickSpell(s)
      }, /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-name"
      }, s.name), /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-meta"
      }, s.school, " \xB7 ", s.castingTime, " \xB7 ", s.components || '—')), /*#__PURE__*/React.createElement("div", {
        onClick: e => e.stopPropagation(),
        style: {
          display: 'flex',
          gap: 4,
          flexShrink: 0
        }
      }, /*#__PURE__*/React.createElement("button", {
        style: {
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 3,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '3px 7px',
          fontSize: 11
        },
        onClick: () => {
          setShowTpl(null);
          setDbTab('spell');
          openDbForm('spell', s);
          setShowDB(true);
        }
      }, "\u270E"), /*#__PURE__*/React.createElement("button", {
        style: {
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '3px 5px',
          fontSize: 13
        },
        onClick: () => deleteDbEntry('spell', s.name)
      }, "\u2715")));
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: 'var(--border)',
        margin: '8px 0'
      }
    })), filtered.map((s, i) => {
      const sc = SC[s.school] || SC["Hervorrufung"];
      return /*#__PURE__*/React.createElement("div", {
        className: "tpl-item",
        key: i,
        onClick: () => pickSpell(s)
      }, /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-orb",
        style: {
          backgroundColor: sc.bg,
          borderColor: sc.border,
          color: sc.text
        }
      }, s.level === 0 ? "∞" : s.level), /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-name"
      }, s.name), /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-meta"
      }, s.school, " \xB7 ", s.castingTime, " \xB7 ", s.components || '—'), /*#__PURE__*/React.createElement("div", {
        className: "tpl-item-desc"
      }, s.description)));
    })));
  })(), showTpl === 'weapon' && (() => {
    const filtered = fuzzyFilter(tplData.weapons, tplSearch, w => w.name);
    const customWeapons = fuzzyFilter(userLibrary.weapon || [], tplSearch, w => w.name);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "tpl-count"
    }, filtered.length + customWeapons.length, " Waffen gefunden"), /*#__PURE__*/React.createElement("div", {
      className: "tpl-list"
    }, customWeapons.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--gold)',
        letterSpacing: '0.15em',
        marginBottom: 6,
        paddingBottom: 4,
        borderBottom: '1px solid var(--border)'
      }
    }, "\u2605 EIGENE EINTR\xC4GE"), customWeapons.map((w, i) => /*#__PURE__*/React.createElement("div", {
      className: "tpl-item",
      key: 'c' + i,
      style: {
        borderColor: 'var(--gold-dim)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-orb",
      style: {
        backgroundColor: "var(--crimson)",
        borderColor: "#a02020",
        color: "#e87070",
        fontSize: 10
      },
      onClick: () => pickWeapon(w)
    }, w.damage), /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-body",
      onClick: () => pickWeapon(w)
    }, /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-name"
    }, w.name), /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-meta"
    }, w.damage, " ", w.damageType, "schaden \xB7 ", (w.properties || []).join(', ') || 'Keine Eigenschaften')), /*#__PURE__*/React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: 'flex',
        gap: 4,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 3,
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '3px 7px',
        fontSize: 11
      },
      onClick: () => {
        setShowTpl(null);
        setDbTab('weapon');
        openDbForm('weapon', w);
        setShowDB(true);
      }
    }, "\u270E"), /*#__PURE__*/React.createElement("button", {
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '3px 5px',
        fontSize: 13
      },
      onClick: () => deleteDbEntry('weapon', w.name)
    }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: 'var(--border)',
        margin: '8px 0'
      }
    })), filtered.map((w, i) => /*#__PURE__*/React.createElement("div", {
      className: "tpl-item",
      key: i,
      onClick: () => pickWeapon(w)
    }, /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-orb",
      style: {
        backgroundColor: "var(--crimson)",
        borderColor: "#a02020",
        color: "#e87070",
        fontSize: 10
      }
    }, w.damage), /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-name"
    }, w.name), /*#__PURE__*/React.createElement("div", {
      className: "tpl-item-meta"
    }, w.damage, " ", w.damageType, "schaden \xB7 ", w.properties.join(', ') || 'Keine Eigenschaften'))))));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "form-actions",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setShowTpl(null)
  }, "Schlie\xDFen")))));
}
const container = document.getElementById('root');
const rootEl = ReactDOM.createRoot(container);
rootEl.render( /*#__PURE__*/React.createElement(App, null));
document.getElementById('loading').style.display = 'none';
container.style.display = 'block';
