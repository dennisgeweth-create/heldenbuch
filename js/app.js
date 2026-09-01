// ACHTUNG: erzeugt von build.js aus js/src/*.jsx — Aenderungen hier gehen
// beim naechsten Bau verloren. Quelle bearbeiten, dann `node build.js`.
// Zusammengesetzt aus: 0-basis.jsx, 1-editors.jsx, 2-logtab.jsx, 3-sheet.jsx, 4-app.jsx
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
  }, "Keine Effekte. ", hint || 'Damit kann dieser Gegenstand Werte des Helden verändern.'), list.map(e => /*#__PURE__*/React.createElement("div", {
    className: "fx-row",
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
  }, i.label))))), /*#__PURE__*/React.createElement("select", {
    className: "form-select fx-mode",
    value: e.mode || 'bonus',
    onChange: ev => set(e.id, {
      mode: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "bonus"
  }, "Bonus (+/\u2212)"), /*#__PURE__*/React.createElement("option", {
    value: "set"
  }, "Fester Wert")), /*#__PURE__*/React.createElement("input", {
    className: "form-input fx-value",
    type: "number",
    value: e.value,
    onChange: ev => set(e.id, {
      value: ev.target.value === '' ? 0 : +ev.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fx-del",
    title: "Effekt entfernen",
    onClick: () => onChange(list.filter(x => x.id !== e.id))
  }, "\u2715"))), /*#__PURE__*/React.createElement("button", {
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
    acBonuses,
    addAcBonus,
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
    delAcBonus,
    delArmorProf,
    delEquipmentItem,
    delFeature,
    delItem,
    delLanguage,
    delNote,
    delResource,
    delSpell,
    delToolProf,
    delWeaponProf,
    deleteChar,
    displayAC,
    effCur,
    eqEditId,
    eqForm,
    equipment,
    equippedArmors,
    equippedShields,
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
    noteTagFilter,
    notesList,
    openEdit,
    openNew,
    openTpl,
    openUnprepared,
    patchChar,
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
    setEqEditId,
    setEqForm,
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
    setShowEF,
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
    stepChar,
    switchList,
    tab,
    togResourcePip,
    togSP,
    togSlot,
    toggleEquipmentItem,
    toggleEquipped,
    toggleJoAT,
    toggleSave,
    toggleSkill,
    toggleSpellPrepared,
    toggleWsFav,
    toolProfs,
    tplData,
    transferMode,
    transferSel,
    unarchiveChar,
    updAcBonus,
    updEquipment,
    updResource,
    updSP,
    weaponProfs,
    weaponStats,
    wsExpand,
    languages
  } = React.useContext(SheetCtx);
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
  return /*#__PURE__*/React.createElement("div", {
    className: "sheet"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sheet-header"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, switchList.length < 2 ? /*#__PURE__*/React.createElement("div", {
    className: "char-name"
  }, cur.name) : /*#__PURE__*/React.createElement("div", {
    className: "char-switch" + (charMenuOpen ? " open" : "")
  }, /*#__PURE__*/React.createElement("button", {
    className: "char-step",
    title: "Vorheriger Held",
    onClick: () => stepChar(-1)
  }, "\u25C0"), /*#__PURE__*/React.createElement("button", {
    className: "char-name-btn",
    title: "Held w\xE4hlen",
    onClick: () => setCharMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("div", {
    className: "char-name"
  }, cur.name), /*#__PURE__*/React.createElement("span", {
    className: "char-name-caret"
  }, "\u25BE")), /*#__PURE__*/React.createElement("button", {
    className: "char-step",
    title: "N\xE4chster Held",
    onClick: () => stepChar(1)
  }, "\u25B6"), charMenuOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 29
    },
    onClick: () => setCharMenuOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "char-switch-menu"
  }, switchList.map(c => {
    const ccc = CC[c.charClass] || CC["Kämpfer"];
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
    const mcc = CC[mc.charClass] || CC["Kämpfer"];
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
  }, /*#__PURE__*/React.createElement("button", {
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
  }, "\u2715")))), /*#__PURE__*/React.createElement("div", {
    className: "hp-bar-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hp-bar-label"
  }, /*#__PURE__*/React.createElement("span", null, "\u2764 Trefferpunkte"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, statsEdit ? /*#__PURE__*/React.createElement("div", {
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
  }, "Akt."), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: cur.hp,
    onChange: e => patchChar({
      hp: Number(e.target.value)
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
  }, "Max"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: cur.maxHp,
    onChange: e => patchChar({
      maxHp: Number(e.target.value)
    }),
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
  }, "Temp"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: cur.tempHp || 0,
    onChange: e => patchChar({
      tempHp: Number(e.target.value)
    }),
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
  }, "(+", cur.tempHp, " temp)")))), /*#__PURE__*/React.createElement("div", {
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
      width: Math.max(0, Math.min(100, cur.hp / (effCur.maxHp || 1) * 100)) + "%",
      flexShrink: 0
    }
  }), (cur.tempHp || 0) > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(25, cur.tempHp / (effCur.maxHp || 1) * 100)) + "%",
      background: "linear-gradient(90deg,rgba(74,144,217,0.7),rgba(122,184,245,0.9))",
      flexShrink: 0,
      borderRadius: "0 2px 2px 0",
      marginLeft: 1
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "sticky-header"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "panel-edit-btn" + (statsEdit ? " active" : ""),
    onClick: () => setStatsEdit(!statsEdit)
  }, statsEdit ? "✓ Fertig" : "✏️ Bearbeiten")), /*#__PURE__*/React.createElement("div", {
    className: "combat-row"
  }, statsEdit ? (computedAC !== null ? [{
    k: "speed",
    l: "Bewegung (m)",
    s: "👟 Bew.",
    i: "👟"
  }, {
    k: "profBonus",
    l: "Übungsbonus",
    s: "📖 ÜB",
    i: "📖"
  }] : [{
    k: "ac",
    l: "Rüstungsklasse",
    s: "🛡 RK",
    i: "🛡"
  }, {
    k: "speed",
    l: "Bewegung (m)",
    s: "👟 Bew.",
    i: "👟"
  }, {
    k: "profBonus",
    l: "Übungsbonus",
    s: "📖 ÜB",
    i: "📖"
  }]).map(s => /*#__PURE__*/React.createElement("div", {
    className: "combat-box",
    key: s.k
  }, /*#__PURE__*/React.createElement("div", {
    className: "combat-label"
  }, s.i, " ", s.l), /*#__PURE__*/React.createElement("div", {
    className: "combat-label-short"
  }, s.s), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: cur[s.k],
    onChange: e => patchChar({
      [s.k]: Number(e.target.value)
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
  }))).concat([/*#__PURE__*/React.createElement("div", {
    className: "combat-box",
    key: "ini"
  }, /*#__PURE__*/React.createElement("div", {
    className: "combat-label"
  }, "\u26A1 Initiative"), /*#__PURE__*/React.createElement("div", {
    className: "combat-label-short"
  }, "\u26A1 Init."), /*#__PURE__*/React.createElement("div", {
    className: "combat-value",
    style: {
      fontSize: 14,
      color: "var(--text-muted)"
    }
  }, fnum(initTotal)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "var(--text-muted)",
      marginTop: 2,
      fontStyle: "italic"
    }
  }, "= DEX-Mod")), (() => {
    const spAttr = SPELL_ATTR[cur.charClass];
    if (!spAttr) return null;
    const sg = fx('spellDc', 8 + effCur.profBonus + mod(effCur[spAttr]));
    return /*#__PURE__*/React.createElement("div", {
      className: "combat-box",
      key: "spsg"
    }, /*#__PURE__*/React.createElement("div", {
      className: "combat-label"
    }, "\u2728 Zauber-SG"), /*#__PURE__*/React.createElement("div", {
      className: "combat-label-short"
    }, "\u2728 SG"), /*#__PURE__*/React.createElement("div", {
      className: "combat-value",
      style: {
        fontSize: 14,
        color: "var(--text-muted)"
      }
    }, sg), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: "var(--text-muted)",
        marginTop: 2,
        fontStyle: "italic"
      }
    }, "= ", AL[spAttr], "-Mod"));
  })()]) : (() => {
    const spAttr = SPELL_ATTR[cur.charClass];
    const spSG = spAttr ? fx('spellDc', 8 + effCur.profBonus + mod(effCur[spAttr])) : null;
    // t: betroffenes Effektziel — faerbt den Wert und erklaert ihn
    // im Tooltip, damit man eine veraenderte Zahl zuordnen kann.
    const boxes = [{
      l: "Rüstungsklasse",
      s: computedAC !== null ? "🛡 RK*" : "🛡 RK",
      v: displayAC,
      i: "🛡",
      t: 'ac'
    }, {
      l: "Initiative",
      s: "⚡ Init.",
      v: fnum(initTotal),
      i: "⚡",
      t: 'initiative'
    }, {
      l: "Bewegung",
      s: "👟 Bew.",
      v: effCur.speed + "m",
      i: "👟",
      t: 'speed'
    }, {
      l: "Übungsbonus",
      s: "📖 ÜB",
      v: "+" + effCur.profBonus,
      i: "📖",
      t: 'profBonus'
    }];
    if (spSG !== null) boxes.push({
      l: "Zauber-SG",
      s: "✨ SG",
      v: spSG,
      i: "✨",
      t: 'spellDc'
    });
    return boxes.map(s => {
      const touched = fxOn(s.t) || s.t === 'initiative' && fxOn('dex') || s.t === 'ac' && fxOn('dex');
      return /*#__PURE__*/React.createElement("div", {
        className: "combat-box",
        key: s.l,
        title: fxTitle(s.t)
      }, /*#__PURE__*/React.createElement("div", {
        className: "combat-label"
      }, s.i, " ", s.l), /*#__PURE__*/React.createElement("div", {
        className: "combat-label-short"
      }, s.s), /*#__PURE__*/React.createElement("div", {
        className: "combat-value" + (touched ? " fx-touched" : "")
      }, s.v, fxOn(s.t) && /*#__PURE__*/React.createElement("span", {
        className: "fx-mark"
      }, "\u2726")));
    });
  })()), (() => {
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
      className: "fx-chip"
    }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))))), /*#__PURE__*/React.createElement("div", {
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
    className: "section-title"
  }, "\uD83C\uDFAF Grundattribute"), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, [["str", "Stärke"], ["dex", "Geschick"], ["con", "Konstitution"], ["int", "Intelligenz"], ["wis", "Weisheit"], ["cha", "Charisma"]].map(([k, l]) => /*#__PURE__*/React.createElement("div", {
    className: "stat-box",
    key: k,
    title: fxTitle(k)
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, l), statsEdit ?
  /*#__PURE__*/
  /* Im Bearbeiten-Modus der eigene Wert, nicht der von
     Gegenstaenden veraenderte. */
  React.createElement("input", {
    type: "number",
    min: 1,
    max: 30,
    value: cur[k],
    onChange: e => patchChar({
      [k]: Math.max(1, Math.min(30, Number(e.target.value)))
    }),
    style: {
      width: 52,
      padding: "4px 2px",
      background: "var(--bg-void)",
      border: "1px solid var(--gold)",
      borderRadius: 3,
      color: "var(--gold)",
      fontSize: 22,
      textAlign: "center",
      display: "block",
      margin: "4px auto",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    className: "stat-value" + (fxOn(k) ? " fx-touched" : "")
  }, effCur[k], fxOn(k) && /*#__PURE__*/React.createElement("span", {
    className: "fx-mark"
  }, "\u2726")), /*#__PURE__*/React.createElement("div", {
    className: "stat-mod" + (fxOn(k) ? " fx-touched" : "")
  }, fmod(effCur[k])), fxOn(k) && !statsEdit && cur[k] !== effCur[k] && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "var(--text-muted)",
      marginTop: 1,
      fontStyle: "italic"
    }
  }, "eigen ", cur[k]))))), /*#__PURE__*/React.createElement("div", {
    className: "stats-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-title"
  }, "\uD83C\uDFB2 Rettungsw\xFCrfe"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      marginBottom: 10,
      fontStyle: "italic"
    }
  }, "Klick zum Aktivieren der \xDCbung"), /*#__PURE__*/React.createElement("div", {
    className: "saves-grid"
  }, [["str", "STR"], ["dex", "GES"], ["con", "KON"], ["int", "INT"], ["wis", "WEI"], ["cha", "CHA"]].map(([attr, label]) => {
    const isP = (cur.savingThrowProfs || []).includes(attr);
    const base = mod(effCur[attr]) + (isP ? effCur.profBonus : 0);
    const val = fx('save_' + attr, fx('saveAll', base));
    const touched = fxOn('save_' + attr) || fxOn('saveAll') || fxOn(attr) || fxOn('profBonus');
    const tip = [fxTitle(attr), fxTitle('profBonus'), fxTitle('saveAll'), fxTitle('save_' + attr)].filter(Boolean).join('\n');
    return /*#__PURE__*/React.createElement("div", _extends({
      key: attr,
      className: "save-box" + (isP ? " prof" : ""),
      title: tip || undefined
    }, clickable(() => toggleSave(attr), "Rettungswurf " + label + (isP ? " — Übung aktiv" : ""))), /*#__PURE__*/React.createElement("div", {
      className: "save-pip"
    }), /*#__PURE__*/React.createElement("div", {
      className: "save-label"
    }, label), /*#__PURE__*/React.createElement("div", {
      className: "save-value" + (touched ? " fx-touched" : ""),
      style: {
        color: isP ? "var(--gold)" : "var(--text-muted)"
      }
    }, fnum(val)));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stats-section"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginBottom: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      fontStyle: "italic"
    }
  }, "\u2B24 = \xDCbung \xB7 \u2B24\u2B24 = Expertise \xB7 Klick zum Wechseln"), /*#__PURE__*/React.createElement("button", {
    className: "joat-toggle",
    onClick: toggleJoAT,
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
  }, cur.jackOfAllTrades ? "✦ Allrounder aktiv" : "◇ Allrounder")), /*#__PURE__*/React.createElement("div", {
    className: "skills-layout"
  }, ["str", "dex", "int", "wis", "cha"].map(attr => /*#__PURE__*/React.createElement("div", {
    className: "skill-group",
    key: attr
  }, /*#__PURE__*/React.createElement("div", {
    className: "skill-group-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "skill-attr-badge",
    style: {
      color: AC[attr],
      borderColor: AC[attr] + "60"
    }
  }, AL[attr]), /*#__PURE__*/React.createElement("div", {
    className: "skill-attr-name"
  }, AF[attr]), /*#__PURE__*/React.createElement("div", {
    className: "skill-attr-mod" + (fxOn(attr) ? " fx-touched" : ""),
    style: {
      color: AC[attr]
    },
    title: fxTitle(attr)
  }, fmod(effCur[attr]))), SKILLS.filter(s => s.attr === attr).map(sk => {
    const isP = (cur.skillProfs || []).includes(sk.key);
    const isE = (cur.expertiseProfs || []).includes(sk.key);
    const joat = cur.jackOfAllTrades && !isP && !isE;
    const bonus = isE ? effCur.profBonus * 2 : isP ? effCur.profBonus : joat ? Math.floor(effCur.profBonus / 2) : 0;
    const tot = fx('skill_' + sk.key, fx('skillAll', mod(effCur[attr]) + bonus));
    const skTouched = fxOn('skill_' + sk.key) || fxOn('skillAll') || fxOn(attr) || fxOn('profBonus');
    const skTip = [fxTitle(attr), fxTitle('profBonus'), fxTitle('skillAll'), fxTitle('skill_' + sk.key)].filter(Boolean).join('\n');
    const pip = isE ? "⬤⬤" : isP ? "⬤" : joat ? "◑" : "○";
    const col = isE ? "var(--arcane-bright)" : isP ? "var(--gold)" : joat ? "var(--gold-dim)" : "var(--border-bright)";
    return /*#__PURE__*/React.createElement("div", {
      className: "skill-row",
      key: sk.key,
      title: skTip || undefined
    }, /*#__PURE__*/React.createElement("button", {
      className: "skill-prof-btn" + (isE ? " expertise" : ""),
      onClick: () => toggleSkill(sk.key),
      style: {
        background: isE ? "var(--arcane)" : isP ? "var(--gold-dim)" : "var(--bg-void)",
        borderColor: col,
        color: col
      },
      title: isE ? "Expertise (Klick: entfernen)" : isP ? "Übung (Klick: Expertise)" : "Kein Bonus (Klick: Übung hinzufügen)"
    }, pip), /*#__PURE__*/React.createElement("div", {
      className: "skill-name"
    }, sk.label), /*#__PURE__*/React.createElement("div", {
      className: "skill-value" + (skTouched ? " fx-touched" : ""),
      style: {
        color: isE ? "var(--arcane-bright)" : isP ? "var(--gold)" : joat ? "var(--gold-dim)" : "var(--text-muted)"
      }
    }, fnum(tot), isE && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        opacity: 0.6,
        marginLeft: 2
      }
    }, "EX"), joat && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        opacity: 0.6,
        marginLeft: 2
      }
    }, "JoAT")));
  })))))), tab === "inventar" && (() => {
    const ARMOR_TYPES = [{
      key: 'light',
      label: 'Leichte Rüstung',
      hint: 'Basis + GES-Mod'
    }, {
      key: 'medium',
      label: 'Mittlere Rüstung',
      hint: 'Basis + GES-Mod (max. +2)'
    }, {
      key: 'heavy',
      label: 'Schwere Rüstung',
      hint: 'Basis (kein GES)'
    }, {
      key: 'shield',
      label: 'Schild',
      hint: '+Bonus zur RK'
    }, {
      key: 'other',
      label: 'Sonstiges',
      hint: 'Kein RK-Einfluss'
    }];
    const openEqForm = item => {
      if (item) {
        setEqForm({
          ...item
        });
        setEqEditId(item.id);
      } else {
        setEqForm({
          name: '',
          type: 'light',
          baseAC: 11,
          acBonus: 0,
          equipped: false,
          notes: '',
          effects: []
        });
        setEqEditId(null);
      }
      setShowEF(true);
    };
    const saveEqForm = () => {
      if (!eqForm.name.trim()) {
        appAlert('Name darf nicht leer sein.');
        return;
      }
      const entry = {
        ...eqForm,
        id: eqEditId || Date.now().toString()
      };
      if (eqEditId) {
        updEquipment(equipment.map(e => e.id === eqEditId ? entry : e));
      } else {
        // Only one armor at a time should be equipped — but allow multiple, user decides
        updEquipment([...equipment, entry]);
      }
      setShowEF(false);
      setEqEditId(null);
    };
    const warnMultiArmor = equippedArmors.length > 1;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "section-title",
      style: {
        marginBottom: 8
      }
    }, "\uD83D\uDEE1 Ausr\xFCstung & R\xFCstung"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg-card)',
        border: '1px solid ' + (computedAC !== null ? 'var(--gold-dim)' : 'var(--border)'),
        borderRadius: 6,
        padding: '10px 14px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        color: 'var(--text-muted)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }
    }, "\uD83D\uDEE1 R\xFCstungsklasse"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 26,
        color: computedAC !== null ? 'var(--gold)' : 'var(--text-muted)'
      }
    }, displayAC)), computedAC !== null ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: "'Roboto Condensed',sans-serif",
        lineHeight: 1.7
      }
    }, (() => {
      const dex = mod(effCur.dex);
      const parts = [];

      // Base armor
      if (equippedArmors.length > 0) {
        const a = equippedArmors[0];
        if (a.type === 'heavy') parts.push(a.name + ': ' + a.baseAC);
        if (a.type === 'medium') parts.push(a.name + ': ' + a.baseAC + ' + GES ' + Math.min(2, dex));
        if (a.type === 'light') parts.push(a.name + ': ' + a.baseAC + ' + GES ' + dex);
        if ((a.acBonus || 0) !== 0) parts.push('Magisch: +' + a.acBonus);
      } else {
        parts.push('Unbewaffnet: 10 + GES ' + dex);
      }

      // Shields
      equippedShields.forEach(sh => {
        parts.push(sh.name + ': +' + (sh.baseAC || 2) + (sh.acBonus ? ' +' + sh.acBonus : ''));
      });

      // Item bonuses (other equipped items with acBonus)
      equipment.filter(e => e.equipped && e.type === 'other' && (e.acBonus || 0) !== 0).forEach(e => {
        parts.push(e.name + ': +' + e.acBonus);
      });

      // Talent/ability bonuses
      acBonuses.filter(b => b.active && (b.bonus || 0) !== 0).forEach(b => {
        parts.push(b.name + ': ' + (b.bonus >= 0 ? '+' : '') + b.bonus);
      });

      // Effekte angelegter Gegenstaende auf die RK
      effectsFor(itemFx, 'ac').forEach(e => {
        parts.push(e.source + ': ' + (e.mode === 'set' ? 'RK = ' + (+e.value || 0) : fnum(+e.value || 0)));
      });
      return /*#__PURE__*/React.createElement("div", null, parts.map((p, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          color: i === 0 ? 'var(--text-secondary)' : 'var(--text-muted)'
        }
      }, i === 0 ? '' : '+ ', p)), /*#__PURE__*/React.createElement("div", {
        style: {
          borderTop: '1px solid var(--border)',
          marginTop: 4,
          paddingTop: 4,
          color: 'var(--gold)'
        }
      }, "= ", displayAC, " RK"));
    })()) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--text-muted)',
        fontStyle: 'italic'
      }
    }, "Keine R\xFCstung angelegt \u2014 Basis 10 + GES-Mod (", fmod(effCur.dex), ")"), warnMultiArmor && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--crimson-bright)',
        fontFamily: "'Roboto Condensed',sans-serif"
      }
    }, "\u26A0\uFE0F Mehrere R\xFCstungen angelegt!")), equipment.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: 14,
        marginBottom: 12
      }
    }, "Noch keine Ausr\xFCstung eingetragen.") : equipment.map(item => {
      const typeLabel = ARMOR_TYPES.find(t => t.key === item.type) || ARMOR_TYPES[0];
      const isArmor = item.type !== 'shield' && item.type !== 'other';
      const isShield = item.type === 'shield';
      return /*#__PURE__*/React.createElement("div", {
        key: item.id,
        style: {
          background: 'var(--bg-card)',
          border: '1px solid ' + (item.equipped ? 'var(--gold-dim)' : 'var(--border)'),
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: item.equipped ? 'inset 0 0 0 1px rgba(201,168,76,0.15)' : ''
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => toggleEquipmentItem(item.id),
        title: item.equipped ? 'Ablegen' : 'Anlegen',
        style: {
          width: 36,
          height: 36,
          borderRadius: 4,
          flexShrink: 0,
          cursor: 'pointer',
          fontSize: 18,
          background: item.equipped ? 'var(--gold-dim)20' : 'var(--bg-panel)',
          border: '1px solid ' + (item.equipped ? 'var(--gold)' : 'var(--border)'),
          color: item.equipped ? 'var(--gold)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, item.equipped ? '🛡' : '○'), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "'Roboto Condensed',sans-serif",
          fontSize: 13,
          color: item.equipped ? 'var(--gold)' : 'var(--text-primary)'
        }
      }, item.name, item.equipped && /*#__PURE__*/React.createElement("span", {
        style: {
          marginLeft: 8,
          fontSize: 9,
          letterSpacing: '0.1em',
          color: 'var(--gold-dim)'
        }
      }, "ANGELEGT")), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 2
        }
      }, typeLabel.label, item.type !== 'other' && /*#__PURE__*/React.createElement("span", {
        style: {
          marginLeft: 6
        }
      }, "\xB7 ", isShield ? '+' + (item.baseAC || 2) + ' RK' : 'Basis RK ' + item.baseAC)), item.notes && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          marginTop: 2
        }
      }, item.notes)), /*#__PURE__*/React.createElement("button", {
        onClick: () => openEqForm(item),
        style: {
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 3,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: 11
        }
      }, "\u270E"), /*#__PURE__*/React.createElement("button", {
        onClick: () => delEquipmentItem(item.id),
        style: {
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px 6px',
          fontSize: 14
        }
      }, "\u2715"));
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn-add",
      style: {
        marginTop: 4,
        width: '100%'
      },
      onClick: () => openEqForm(null)
    }, "+ Ausr\xFCstung hinzuf\xFCgen"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        color: 'var(--text-muted)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: 8
      }
    }, "Vorlagen"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6
      }
    }, [{
      name: 'Lederrüstung',
      type: 'light',
      baseAC: 11
    }, {
      name: 'Verstärkte Lederrüstung',
      type: 'light',
      baseAC: 12
    }, {
      name: 'Lederlamellenrüstung',
      type: 'light',
      baseAC: 13
    }, {
      name: 'Schuppenpanzer',
      type: 'medium',
      baseAC: 13
    }, {
      name: 'Kettenhemd',
      type: 'medium',
      baseAC: 13
    }, {
      name: 'Brustpanzer',
      type: 'medium',
      baseAC: 14
    }, {
      name: 'Schienenpanzer',
      type: 'medium',
      baseAC: 15
    }, {
      name: 'Halbplatte',
      type: 'medium',
      baseAC: 15
    }, {
      name: 'Ringpanzerhemd',
      type: 'heavy',
      baseAC: 14
    }, {
      name: 'Kettenpanzer',
      type: 'heavy',
      baseAC: 16
    }, {
      name: 'Bänderpanzer',
      type: 'heavy',
      baseAC: 17
    }, {
      name: 'Plattenpanzer',
      type: 'heavy',
      baseAC: 18
    }, {
      name: 'Schild',
      type: 'shield',
      baseAC: 2
    }].map(tpl => /*#__PURE__*/React.createElement("button", {
      key: tpl.name,
      onClick: () => {
        setEqForm({
          ...tpl,
          id: Date.now().toString(),
          equipped: false,
          notes: ''
        });
        setEqEditId(null);
        setShowEF(true);
      },
      style: {
        padding: '3px 10px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-muted)',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 9,
        cursor: 'pointer',
        letterSpacing: '0.06em'
      }
    }, tpl.name)))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-title",
      style: {
        marginBottom: 0
      }
    }, "\u2726 RK-Boni durch Talente & F\xE4higkeiten")), acBonuses.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: 13,
        marginBottom: 8
      }
    }, "Kein Bonus eingetragen (z.B. Defensiver Kampfstil, Nat\xFCrliche R\xFCstung, Ring des Schutzes).") : acBonuses.map(b => /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-card)',
        border: '1px solid ' + (b.active ? 'var(--gold-dim)' : 'var(--border)'),
        borderRadius: 5,
        padding: '7px 10px',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => updAcBonus(b.id, {
        active: !b.active
      }),
      style: {
        width: 28,
        height: 28,
        borderRadius: 4,
        flexShrink: 0,
        cursor: 'pointer',
        background: b.active ? 'var(--gold-dim)20' : 'var(--bg-panel)',
        border: '1px solid ' + (b.active ? 'var(--gold)' : 'var(--border)'),
        color: b.active ? 'var(--gold)' : 'var(--text-muted)',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      title: b.active ? 'Deaktivieren' : 'Aktivieren'
    }, b.active ? '✦' : '◇'), /*#__PURE__*/React.createElement("input", {
      style: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        outline: 'none',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 12,
        color: 'var(--text-primary)',
        padding: '2px 4px'
      },
      defaultValue: b.name,
      onBlur: e => updAcBonus(b.id, {
        name: e.target.value
      }),
      key: 'bn_' + b.id
    }), /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: -5,
      max: 20,
      style: {
        width: 52,
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 3,
        outline: 'none',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 14,
        color: b.active ? 'var(--gold)' : 'var(--text-muted)',
        padding: '2px 6px',
        textAlign: 'center'
      },
      defaultValue: b.bonus,
      onBlur: e => updAcBonus(b.id, {
        bonus: +e.target.value
      }),
      key: 'bv_' + b.id
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'var(--text-muted)',
        fontFamily: "'Roboto Condensed',sans-serif",
        minWidth: 20
      }
    }, "RK"), /*#__PURE__*/React.createElement("button", {
      onClick: () => delAcBonus(b.id),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '2px 4px',
        fontSize: 13
      }
    }, "\u2715"))), /*#__PURE__*/React.createElement("button", {
      className: "btn-add",
      style: {
        marginTop: 4
      },
      onClick: addAcBonus
    }, "+ RK-Bonus hinzuf\xFCgen"), acBonuses.filter(b => b.active).length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8,
        fontSize: 12,
        color: 'var(--text-muted)',
        fontStyle: 'italic'
      }
    }, "Aktive Boni: ", acBonuses.filter(b => b.active).map(b => (b.bonus >= 0 ? '+' : '') + b.bonus + ' (' + b.name + ')').join(', '))));
  })(), tab === "aktionen" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
    className: "resource-item insp-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "resource-header"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 13,
      color: "var(--inspiration)",
      flex: 1
    }
  }, "\u2726 Inspiration"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, "Vorteil auf einen Wurf")), /*#__PURE__*/React.createElement("div", {
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
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 14,
      color: "var(--inspiration)",
      marginLeft: 4
    }
  }, insp, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)"
    }
  }, "/", inspMax))), insp === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      fontStyle: "italic",
      marginTop: 4
    }
  }, "Punkt antippen, wenn die Spielleitung dir Inspiration gibt.")), resources.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: 13,
      fontStyle: "italic",
      margin: "10px 0 8px"
    }
  }, "Sonst noch keine Ressourcen.", !resEdit && ' Klicke "Bearbeiten" zum Hinzufügen.'), /*#__PURE__*/React.createElement("div", {
    className: "resource-list"
  }, resources.map(res => /*#__PURE__*/React.createElement("div", {
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
  }, "\u2715"))) : /*#__PURE__*/React.createElement("div", {
    className: "resource-header"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 13,
      color: res.color || "#c9a84c",
      flex: 1
    }
  }, res.name || "Ressource"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      fontFamily: "'Roboto Condensed',sans-serif"
    }
  }, res.restType === "kurz" ? "Kurze Rast" : res.restType === "tag" ? "Täglich" : "Lange Rast")), /*#__PURE__*/React.createElement("div", {
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
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 14,
      color: res.color || "#c9a84c",
      marginLeft: 4
    }
  }, res.max - res.used, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--text-muted)"
    }
  }, "/", res.max))), res.used > 0 && /*#__PURE__*/React.createElement("button", {
    className: "resource-restore-btn",
    onClick: () => updResource(res.id, {
      used: 0
    })
  }, "\u21BA ", res.restType === "kurz" ? "Kurze Rast" : res.restType === "tag" ? "Täglich" : "Lange Rast")))), resEdit && /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    onClick: addResource
  }, "+ Ressource hinzuf\xFCgen")), /*#__PURE__*/React.createElement("div", {
    className: "section-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-title",
    style: {
      marginBottom: 12
    }
  }, "\uD83D\uDDE1 Waffen"), cur.weapons.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("button", {
    className: "spell-edit-btn",
    onClick: e => {
      e.stopPropagation();
      setFf({
        name: feat.name,
        source: feat.source || '',
        description: feat.description || ''
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
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "feature-card-body"
  }, feat.source && /*#__PURE__*/React.createElement("div", {
    className: "feature-source"
  }, feat.source)), feat.description && /*#__PURE__*/React.createElement("div", {
    className: "feature-card-desc-wrap"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "feature-card-desc"
  }, feat.description)))))), /*#__PURE__*/React.createElement("button", {
    className: "btn-add",
    onClick: () => {
      setFf({
        name: '',
        source: '',
        description: ''
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
    const allSpellClasses = [...new Set(cur.spells.flatMap(s => s.classes || []))].sort();
    const allSpellDmg = [...new Set(cur.spells.flatMap(s => s.damageTags || []))].sort();
    const hasFilters = allSpellClasses.length > 0 || allSpellDmg.length > 0;
    const filterActive = spellTagFilter.classes.length > 0 || spellTagFilter.dmg.length > 0;
    return hasFilters && /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83D\uDCD6 Von Vorlage (SRD)")), cur.spells.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: allTags.length > 0 ? 8 : 0
      }
    }, /*#__PURE__*/React.createElement("select", {
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
    }, r.label))), invTagFilter.length > 0 && /*#__PURE__*/React.createElement("button", {
      className: "tag-filter-btn",
      onClick: () => setInvTagFilter([]),
      style: {
        borderColor: "var(--crimson)",
        color: "var(--crimson)"
      }
    }, "\u2715 Filter leeren")), allTags.length > 0 && /*#__PURE__*/React.createElement("div", {
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
    const filtered = inv.filter(item => {
      const matchRarity = invRarity === 'all' || item.rarity === invRarity;
      const matchTags = invTagFilter.length === 0 || invTagFilter.every(t => (item.tags || []).includes(t));
      return matchRarity && matchTags;
    }).sort((a, b) => {
      const rd = (rarityOrder[a.rarity] !== undefined ? rarityOrder[a.rarity] : 5) - (rarityOrder[b.rarity] !== undefined ? rarityOrder[b.rarity] : 5);
      return rd !== 0 ? rd : a.name.localeCompare(b.name, 'de');
    });
    if (inv.length === 0) return /*#__PURE__*/React.createElement("div", {
      style: {
        color: "var(--text-muted)",
        fontStyle: "italic",
        fontSize: 14,
        marginBottom: 12
      }
    }, "Keine Gegenst\xE4nde im Inventar.");
    if (filtered.length === 0) return /*#__PURE__*/React.createElement("div", {
      style: {
        color: "var(--text-muted)",
        fontStyle: "italic",
        fontSize: 14,
        marginBottom: 12
      }
    }, "Keine Gegenst\xE4nde gefunden.");
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
    }, totalWeight.toFixed(2), " kg")), (invRarity !== 'all' || invTagFilter.length > 0) && /*#__PURE__*/React.createElement("div", {
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
  }, "+ Neue Notiz")), tab === "log" && /*#__PURE__*/React.createElement(LogTab, {
    charId: sel,
    charName: cur?.name,
    addLog: addLog,
    isDmMode: isDmMode
  }));
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
    description: ''
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
  const [showEF, setShowEF] = useState(false);
  const [eqEditId, setEqEditId] = useState(null);
  const [eqForm, setEqForm] = useState({
    name: '',
    type: 'light',
    baseAC: 11,
    acBonus: 0,
    equipped: false,
    notes: ''
  });
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (sel) setSidebarCollapsed(true);else setSidebarCollapsed(false);
  }, [sel]);
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
  const [isDmMode, setIsDmMode] = useState(false);
  const [dmPass, setDmPass] = useState('');
  const [dmLibrary, setDmLibrary] = useState({});
  const [hasDmMode, setHasDmMode] = useState(false);
  const [showDmLogin, setShowDmLogin] = useState(false);
  const [dmLoginInput, setDmLoginInput] = useState('');
  const [dmLoginErr, setDmLoginErr] = useState('');
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
  const [setupMode, setSetupMode] = useState('login'); // login|register
  const [setupForm, setSetupForm] = useState({
    url: '',
    code: '',
    pass: ''
  });
  const [setupErr, setSetupErr] = useState('');
  const [setupBusy, setSetupBusy] = useState(false);
  const saveTimer = useRef(null);
  const autoSyncTimer = useRef(null);
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
  const libRef = useRef({});
  const dmLibRef = useRef({});
  const isDmRef = useRef(false);
  const dmPassRef = useRef('');

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

  // Auto-sync every 5 seconds in background (silent)
  // Interval sync: push localStorage to server every 3 seconds if pending
  useEffect(() => {
    const tick = async () => {
      if (!pendingRef.current) return;
      const {
        url,
        code,
        pass
      } = serverCreds();
      if (!url || !code || !pass) return;

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
      try {
        const ops = [...Object.values(toSave).map(c => apiSaveChar(url, code, pass, c.id, c)), ...Object.values(toSaveI).map(({
          charId,
          itemId,
          item
        }) => apiSaveItem(url, code, pass, charId, itemId, item)), ...[...toDelete].map(id => apiDeleteChar(url, code, pass, id)), ...[...toDeleteI].map(k => {
          const [charId, itemId] = k.split('__');
          return apiDeleteItem(url, code, pass, charId, itemId);
        })];
        if (ops.length > 0) await Promise.all(ops);
        setSyncStatus('ok');
        setSyncMsg('Gespeichert ✓');
      } catch (e) {
        // Re-queue on failure
        Object.assign(pendingChars.current, toSave);
        Object.assign(pendingItems.current, toSaveI);
        for (const id of toDelete) pendingDeletes.current.add(id);
        for (const k of toDeleteI) pendingItemDel.current.add(k);
        pendingRef.current = true;
        setSyncStatus('err');
        setSyncMsg(e.message);
      }
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // tplData only loaded when template picker opens (openTpl)

  useEffect(() => {
    const {
      url,
      code,
      pass
    } = serverCreds();
    setSvUrl(url);
    setSvCode(code);
    setSvPass(pass);
    if (url && code && pass) {
      // Load localStorage immediately for instant display while server loads
      try {
        const v = localStorage.getItem('dnd_chars');
        if (v) applyChars(JSON.parse(v));
      } catch {}
      try {
        const lib = localStorage.getItem('hb_library');
        if (lib) setUserLibrary(JSON.parse(lib));
      } catch {}
      // Load server data on startup — but only apply if no unsaved local changes
      apiLoadChars(url, code, pass).then(d => {
        if (d.has_dm) setHasDmMode(true);
        if (d.library) {
          setUserLibrary(d.library);
          safeSetItem('hb_library', JSON.stringify(d.library));
        }
        if (!pendingRef.current) {
          // No unsaved local changes — server is authoritative
          applyChars(d.chars || []);
          localStorage.setItem('dnd_chars', JSON.stringify(d.chars || []));
        }
        // If pendingRef=true: local has newer unsaved data — keep it, interval will push to server
        setSyncStatus('ok');
        setSyncMsg('Verbunden ✓');
      }).catch(() => {
        setSyncStatus('ok');
        setSyncMsg('Lokal ✓');
      });
    } else {
      try {
        const v = localStorage.getItem('dnd_chars');
        if (v) applyChars(JSON.parse(v));
      } catch {}
      setShowSetup(true);
    }
  }, []);
  const saveLibrary = lib => {
    setUserLibrary(lib);
    safeSetItem('hb_library', JSON.stringify(lib));
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!url || !code || !pass) return;
    apiSaveLibrary(url, code, pass, lib).catch(() => {});
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
      imageData: ''
    };
    if (type === 'weapon') return {
      name: '',
      damage: '1W6',
      damageType: 'Hieb',
      range: '1,5 m',
      description: '',
      properties: []
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
      // User explicitly requested reload — always apply server data
      pendingRef.current = false; // cancel any pending local saves
      applyChars(data.chars || []);
      localStorage.setItem('dnd_chars', JSON.stringify(data.chars || []));
      if (data.library) {
        setUserLibrary(data.library);
        safeSetItem('hb_library', JSON.stringify(data.library));
      }
      if (data.has_dm) setHasDmMode(true);
      setSyncStatus('ok');
      setSyncMsg('Geladen ✓');
    } catch (e) {
      setSyncStatus('err');
      setSyncMsg(e.message);
    }
  };
  const doDmLogin = async () => {
    if (!dmLoginInput.trim()) {
      setDmLoginErr('Bitte DM-Passwort eingeben.');
      return;
    }
    setDmLoginErr('');
    try {
      const {
        url,
        code,
        pass
      } = serverCreds();
      const data = await apiDmLoad(url, code, pass, dmLoginInput.trim());
      setDmLibrary(data.dm_library || {});
      setDmPass(dmLoginInput.trim());
      setIsDmMode(true);
      setShowDmLogin(false);
      setDmLoginInput('');
    } catch (e) {
      setDmLoginErr(e.message || 'Falsches DM-Passwort.');
    }
  };
  const doDmLogout = () => {
    setIsDmMode(false);
    setDmPass('');
    setDmLibrary({});
  };
  const saveDmLibrary = lib => {
    setDmLibrary(lib);
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!url || !code || !pass || !dmPassRef.current) return;
    apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(() => {});
  };
  const save = u => {
    const prev = charsRef.current;
    applyChars(u);
    const prevMap = new Map(prev.map(c => [c.id, c]));
    const newMap = new Map(u.map(c => [c.id, c]));
    for (const [charId, c] of newMap) {
      const prevC = prevMap.get(charId);
      // Diff inventory separately
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
        pendingChars.current[charId] = cNoInv;
        pendingDeletes.current.delete(charId);
      }
    }
    for (const [id] of prevMap) {
      if (!newMap.has(id)) {
        pendingDeletes.current.add(id);
        delete pendingChars.current[id];
      }
    }
    pendingRef.current = true;
    try {
      localStorage.setItem('dnd_chars', JSON.stringify(u));
    } catch {}
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
  } : c));

  // Logging helper — fire-and-forget, never blocks UI
  const addLog = (charId, charName, tab, action, details) => {
    const {
      url,
      code,
      pass
    } = serverCreds();
    if (!url || !code || !pass) return;
    const entry = {
      char_id: charId,
      char_name: charName,
      tab,
      action,
      details
    };
    apiSaveLog(url, code, pass, entry).catch(() => {});
  };
  const applySetup = async () => {
    const {
      url,
      code,
      pass,
      dmPass: regDmPass
    } = setupForm;
    if (!url.trim() || !code.trim() || !pass.trim()) {
      setSetupErr('Bitte alle Felder ausfüllen.');
      return;
    }
    if (pass.length < 6) {
      setSetupErr('Passwort mindestens 6 Zeichen.');
      return;
    }
    setSetupBusy(true);
    setSetupErr('');
    try {
      if (setupMode === 'register') await registerGroup(url, code.toUpperCase(), pass, regDmPass || '');
      const data = await apiLoad(url, code.toUpperCase(), pass);
      localStorage.setItem('sv_url', url);
      localStorage.setItem('sv_code', code.toUpperCase());
      localStorage.setItem('sv_pass', pass);
      setSvUrl(url);
      setSvCode(code.toUpperCase());
      setSvPass(pass);
      applyChars(data.chars || []);
      pendingRef.current = false;
      localStorage.setItem('dnd_chars', JSON.stringify(data.chars || []));
      if (data.library) {
        setUserLibrary(data.library);
        safeSetItem('hb_library', JSON.stringify(data.library));
      }
      if (data.has_dm) setHasDmMode(true);
      setSyncStatus('ok');
      setSyncMsg('Verbunden ✓');
      setShowSetup(false);
    } catch (e) {
      setSetupErr(e.message);
    }
    setSetupBusy(false);
  };
  const signOut = () => {
    ['sv_url', 'sv_code', 'sv_pass'].forEach(k => localStorage.removeItem(k));
    setSvUrl('');
    setSvCode('');
    setSvPass('');
    setSyncStatus('idle');
    setSyncMsg('');
    setSetupForm({
      url: '',
      code: '',
      pass: ''
    });
    setShowSetup(true);
  };
  const cur = chars.find(c => c.id === sel);
  const cc = CC[cur && cur.charClass] || CC["Kämpfer"];

  // ── Effekte angelegter Gegenstaende ──────────────────────────────
  // itemFx sind die gerade wirkenden Effekte, effCur ist der Held mit
  // bereits verrechneten Grundwerten. Alles, was angezeigt oder
  // weitergerechnet wird, liest ab hier effCur; Eingabefelder bleiben
  // bei cur, sonst wuerde man den veraenderten statt den eigenen Wert
  // bearbeiten.
  const itemFx = collectEffects(cur);
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
    maxHp: fx('maxHp', cur.maxHp),
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
  const switchList = chars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode));
  const switchIndex = switchList.findIndex(c => c.id === sel);
  const stepChar = dir => {
    if (!switchList.length) return;
    // Ein archivierter Held steht nicht in der Liste (Index -1): dann zum
    // ersten aktiven springen statt stumm nichts zu tun.
    const next = switchIndex === -1 ? switchList[0] : switchList[(switchIndex + dir + switchList.length) % switchList.length];
    selectChar(next.id);
    setCharMenuOpen(false);
  };
  const openNew = () => {
    setEc(newChar());
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
      description: ''
    });
    setFfEditId(null);
    setShowFF(false);
  };
  const delFeature = id => appConfirm("Merkmal wirklich löschen?", () => patchCurrent(c => ({
    features: (c.features || []).filter(f => f.id !== id)
  })));
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
  const equipment = cur && cur.equipment || [];
  const updEquipment = eq => patchCurrent(c => ({
    equipment: eq
  }));
  const toggleEquipmentItem = id => updEquipment(equipment.map(e => e.id === id ? {
    ...e,
    equipped: !e.equipped
  } : e));
  const delEquipmentItem = id => appConfirm("Ausrüstung wirklich löschen?", () => updEquipment(equipment.filter(e => e.id !== id)));
  const acBonuses = cur && cur.acBonuses || [];
  const updAcBonuses = b => patchCurrent(c => ({
    acBonuses: b
  }));
  const addAcBonus = () => updAcBonuses([...acBonuses, {
    id: Date.now().toString(),
    name: 'Neuer Bonus',
    bonus: 1,
    active: true
  }]);
  const delAcBonus = id => appConfirm('RK-Bonus wirklich löschen?', () => updAcBonuses(acBonuses.filter(b => b.id !== id)));
  const updAcBonus = (id, patch) => updAcBonuses(acBonuses.map(b => b.id === id ? {
    ...b,
    ...patch
  } : b));
  const newEquipItem = () => ({
    id: Date.now().toString(),
    name: "",
    type: "light",
    baseAC: 11,
    acBonus: 0,
    equipped: false,
    notes: "",
    effects: []
  });

  // Compute AC from equipped armor
  // "Sonstiges" ist als "Kein RK-Einfluss" ausgewiesen und traegt nur ueber
  // acBonus bei — es darf deshalb nicht als Grundruestung zaehlen, sonst
  // ersetzt ein Umhang mit Basis 0 die 10 der unbewaffneten RK.
  const equippedArmors = equipment.filter(e => e.equipped && e.type !== "shield" && e.type !== "other");
  const equippedShields = equipment.filter(e => e.equipped && e.type === "shield");
  const computedAC = (() => {
    if (!cur) return null;
    const dex = mod(effCur.dex);
    const activeAbBonuses = (cur.acBonuses || []).filter(b => b.active).reduce((s, b) => s + (+b.bonus || 0), 0);
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
        pass
      } = serverCreds();
      if (!url || !code || !pass) return;
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
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay"
    }, /*#__PURE__*/React.createElement("div", {
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
    const active = chars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode));
    const archived = chars.filter(c => c.archived && (c.dmOnly !== true || isDmMode));
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
        padding: "5px 0",
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
        padding: "5px 0",
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
    }, "\uD83D\uDD2E"), c.name), /*#__PURE__*/React.createElement("div", {
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
    acBonuses,
    addAcBonus,
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
    delAcBonus,
    delArmorProf,
    delEquipmentItem,
    delFeature,
    delItem,
    delLanguage,
    delNote,
    delResource,
    delSpell,
    delToolProf,
    delWeaponProf,
    deleteChar,
    displayAC,
    effCur,
    eqEditId,
    eqForm,
    equipment,
    equippedArmors,
    equippedShields,
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
    noteTagFilter,
    notesList,
    openEdit,
    openNew,
    openTpl,
    openUnprepared,
    patchChar,
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
    setEqEditId,
    setEqForm,
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
    setShowEF,
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
    stepChar,
    switchList,
    tab,
    togResourcePip,
    togSP,
    togSlot,
    toggleEquipmentItem,
    toggleEquipped,
    toggleJoAT,
    toggleSave,
    toggleSkill,
    toggleSpellPrepared,
    toggleWsFav,
    toolProfs,
    tplData,
    transferMode,
    transferSel,
    unarchiveChar,
    updAcBonus,
    updEquipment,
    updResource,
    updSP,
    weaponProfs,
    weaponStats,
    wsExpand,
    languages
  };
  return /*#__PURE__*/React.createElement(SheetCtx.Provider, {
    value: sheetCtx
  }, /*#__PURE__*/React.createElement("div", {
    className: "app" + (sidebarCollapsed ? " sb-collapsed" : "")
  }, sel && /*#__PURE__*/React.createElement("button", {
    className: "sidebar-toggle" + (sidebarCollapsed ? " open" : ""),
    onClick: () => setSidebarCollapsed(c => !c),
    title: sidebarCollapsed ? "Seitenleiste einblenden" : "Seitenleiste ausblenden",
    style: {
      left: sidebarCollapsed ? 0 : 260
    }
  }, sidebarCollapsed ? '▶' : '◀'), /*#__PURE__*/React.createElement("div", {
    className: "sidebar" + (sidebarCollapsed ? " collapsed" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-title"
  }, "\u2694 Heldenbuch \u2694"), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-subtitle"
  }, "Dungeons & Dragons \xB7 \uD83D\uDC09")), /*#__PURE__*/React.createElement("div", {
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
  })), /*#__PURE__*/React.createElement(CharList, null)), /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83D\uDCD6 Abenteuerlog")), svCode ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "sync-line"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sync-dot " + (syncStatus === "busy" ? "busy" : syncStatus === "err" ? "err" : "ok")
  }), /*#__PURE__*/React.createElement("span", {
    className: "sync-line-code"
  }, svCode), /*#__PURE__*/React.createElement("span", {
    className: "sync-line-msg"
  }, "\xB7 ", syncMsg || "Verbunden"), /*#__PURE__*/React.createElement("span", {
    className: "sync-line-ver"
  }, "v3.9")), /*#__PURE__*/React.createElement("div", {
    className: "sync-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-sync",
    title: "Daten neu vom Server laden",
    onClick: () => doSyncLoad(svUrl, svCode, svPass)
  }, "\u21BA Laden"), hasDmMode && !isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-sync dm",
    title: "In den DM-Modus wechseln",
    onClick: () => {
      setDmLoginInput('');
      setDmLoginErr('');
      setShowDmLogin(true);
    }
  }, "\uD83D\uDD2E DM"), isDmMode && /*#__PURE__*/React.createElement("button", {
    className: "btn-sync dm active",
    title: "DM-Modus verlassen",
    onClick: doDmLogout
  }, "\uD83D\uDD2E DM aus"), /*#__PURE__*/React.createElement("button", {
    className: "btn-sync",
    title: "Von der Gruppe abmelden",
    onClick: signOut
  }, "\u238B Abmelden"))) : /*#__PURE__*/React.createElement("button", {
    className: "btn-sync",
    onClick: () => setShowSetup(true)
  }, "\u2699\uFE0F Server verbinden"))), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, isTouchLayout && mv === "list" && /*#__PURE__*/React.createElement("div", {
    className: "mobile-list-screen"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 12px 12px",
      borderBottom: "1px solid var(--border)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 16,
      color: "var(--gold)"
    }
  }, "\u2694 Heldenbuch \u2694"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 9,
      color: "var(--text-muted)",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      marginTop: 4
    }
  }, "Dungeons & Dragons \xB7 \uD83D\uDC09"), svCode && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sync-dot " + (syncStatus === "busy" ? "busy" : syncStatus === "err" ? "err" : "ok")
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 9,
      color: 'var(--text-muted)',
      letterSpacing: '0.08em'
    }
  }, svCode, " \xB7 ", syncMsg || 'Verbunden')), /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83D\uDCD6 Abenteuerlog"))), /*#__PURE__*/React.createElement("div", {
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
  }, cur && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
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
  }, "\u2715")))), /*#__PURE__*/React.createElement(Sheet, null)), !isTouchLayout && /*#__PURE__*/React.createElement("div", {
    className: "desktop-sheet"
  }, /*#__PURE__*/React.createElement(Sheet, null))), /*#__PURE__*/React.createElement("nav", {
    className: "mobile-bottom-nav",
    style: {
      left: isTouchLayout || sidebarCollapsed ? 0 : 260
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
  }, mv === "list" ? "+" : "☰")), showCF && ec && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
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
  }, CLASSES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: "1",
    max: "20",
    value: ec.level,
    onChange: e => setEc({
      ...ec,
      level: Math.max(1, Math.min(20, +e.target.value))
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
  }, CLASSES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: "1",
    max: "20",
    value: mc.level,
    onChange: e => setEc({
      ...ec,
      multiclasses: ec.multiclasses.map((m, j) => j === i ? {
        ...m,
        level: Math.max(1, +e.target.value)
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
  }, "\u2736 Speichern")))), showWF && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 480
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
  }, "Angriffsbonus (+/\u2212)"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    placeholder: "0",
    value: wf.attackBonus || 0,
    onChange: e => setWf({
      ...wf,
      attackBonus: parseInt(e.target.value) || 0
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
    className: "form-group form-full"
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
    className: "form-group form-full"
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
  }, wfEditId ? "Speichern" : "+ Hinzufügen")))), showFF && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, ffEditId ? '✏️ Fähigkeit bearbeiten' : '⭐ Neue Fähigkeit'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
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
    className: "form-group form-full"
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
  }))), /*#__PURE__*/React.createElement("div", {
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
  }, ffEditId ? '✓ Speichern' : '+ Hinzufügen')))), showSF && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 480
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
    className: "form-group form-full"
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
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Klassen"), /*#__PURE__*/React.createElement("div", {
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
  }, sfEditId ? '✓ Speichern' : '+ Hinzufügen')))), showNF && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 520
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
  }, nfEditId ? '✓ Speichern' : '+ Hinzufügen')))), showIF && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 520
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
          id: Date.now().toString()
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
  }, "Menge"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: "1",
    value: itf.qty,
    onChange: e => setItf({
      ...itf,
      qty: Math.max(1, +e.target.value)
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
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay"
    }, /*#__PURE__*/React.createElement("div", {
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
      const cc = CC[c.charClass] || CC["Kämpfer"];
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
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay",
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
    }, t))), (item.effects || []).length > 0 && /*#__PURE__*/React.createElement("div", {
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
        opacity: item.effectsActive ? 1 : 0.5,
        marginBottom: 7
      }
    }, (item.effects || []).map(e => /*#__PURE__*/React.createElement("span", {
      key: e.id,
      className: "fx-chip"
    }, EFFECT_LABELS[e.target] || e.target, " ", effectText(e)))), /*#__PURE__*/React.createElement("button", {
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
    }, item.effectsActive ? '✦ Wirkt — ausschalten' : '◇ Ruht — einschalten')), !item.description && !item.source && (item.tags || []).length === 0 && (item.effects || []).length === 0 && /*#__PURE__*/React.createElement("div", {
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
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay",
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
    }];
    // Reset search when tab changes
    const wkCurrent = '_dbSearch_' + dbTab;
    const wktCurrent = '_dbTagFilter_' + dbTab;
    const activeLib = isDmMode ? dmLibrary : userLibrary;
    const setActiveLib = isDmMode ? saveDmLibrary : saveLibrary;
    const entries = activeLib[dbTab] || [];
    const SCHOOLS = ['Verzauberung', 'Beschwörung', 'Verwandlung', 'Nekromantie', 'Hervorrufung', 'Illusion', 'Erkenntnis', 'Bann'];
    const DMG_TYPES = ['Hieb', 'Stich', 'Wucht', 'Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekro', 'Psycho', 'Energie', 'Kraft'];
    const WPN_PROPS = ['Finesse', 'Weit', 'Leicht', 'Schwer', 'Werfbar', 'Zweihändig', 'Vielseitig', 'Ladezeit', 'Besondere'];
    return /*#__PURE__*/React.createElement("div", {
      className: "form-overlay"
    }, /*#__PURE__*/React.createElement("div", {
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
      style: {
        display: 'flex',
        gap: 4,
        marginBottom: 14,
        flexShrink: 0
      }
    }, types.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.k,
      onClick: () => {
        setDbTab(t.k);
        setDbForm(null);
        setDbFormId(null);
        setDbGradeFilter('');
        setDbExpandedEntry(null);
      },
      style: {
        flex: 1,
        padding: '7px 4px',
        fontFamily: "'Roboto Condensed',sans-serif",
        fontSize: 11,
        cursor: 'pointer',
        border: '1px solid',
        borderRadius: 4,
        borderColor: dbTab === t.k ? 'var(--gold)' : 'var(--border)',
        background: dbTab === t.k ? 'var(--bg-panel)' : 'var(--bg-card)',
        color: dbTab === t.k ? 'var(--gold)' : 'var(--text-muted)'
      }
    }, t.icon, " ", t.label))), dbForm ? /*#__PURE__*/React.createElement("div", {
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
    }))), dbTab === 'wildshape' && /*#__PURE__*/React.createElement("div", {
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
    }, "RK"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      type: "number",
      value: dbForm.ac,
      onChange: e => setDbForm(f => ({
        ...f,
        ac: +e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: "form-label"
    }, "TP"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      type: "number",
      value: dbForm.hp,
      onChange: e => setDbForm(f => ({
        ...f,
        hp: +e.target.value
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
    }, l), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      type: "number",
      min: 1,
      max: 30,
      style: {
        textAlign: 'center',
        padding: '6px 4px'
      },
      value: dbForm[k],
      onChange: e => setDbForm(f => ({
        ...f,
        [k]: +e.target.value
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
    }, "Menge (Standard)"), /*#__PURE__*/React.createElement("input", {
      className: "form-input",
      type: "number",
      min: 1,
      value: dbForm.qty || 1,
      onChange: e => setDbForm(f => ({
        ...f,
        qty: +e.target.value
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
        }, dbTab === 'spell' && `Grad ${e.level} · ${e.school} · ${e.castingTime}`, dbTab === 'weapon' && `${e.damage} ${e.damageType}schaden · ${(e.properties || []).join(', ') || '—'}`, dbTab === 'wildshape' && `CR ${e.cr} · ${e.size} · RK ${e.ac} · TP ${e.hp}`, dbTab === 'item' && `${(RARITIES.find(r => r.key === e.rarity) || RARITIES[0]).label}${e.weight ? ' · ' + e.weight + ' kg' : ''}`)), /*#__PURE__*/React.createElement("button", {
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
        }, e.description)), dbTab === 'wildshape' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Bewegung:"), " ", e.speed || '—', " \xB7 ", /*#__PURE__*/React.createElement("strong", null, "Sinne:"), " ", e.senses || '—'), e.skills && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Fertigk.:"), " ", e.skills)), dbTab === 'item' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
        }, t))), e.source && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Erhalten durch:"), " ", e.source), e.description && /*#__PURE__*/React.createElement("div", {
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
  }, confirmDlg.okLabel || 'Bestätigen')))), showEF && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, eqEditId ? '✎ Ausrüstung bearbeiten' : '+ Ausrüstung hinzufügen'), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: eqForm.name,
    onChange: e => setEqForm({
      ...eqForm,
      name: e.target.value
    }),
    placeholder: "z.B. Plattenpanzer",
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Typ"), /*#__PURE__*/React.createElement("select", {
    className: "form-input",
    value: eqForm.type,
    onChange: e => {
      const t = e.target.value;
      const base = t === 'shield' ? 2 : t === 'light' ? 11 : t === 'medium' ? 13 : t === 'heavy' ? 16 : 0;
      setEqForm({
        ...eqForm,
        type: t,
        baseAC: base
      });
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "light"
  }, "Leichte R\xFCstung"), /*#__PURE__*/React.createElement("option", {
    value: "medium"
  }, "Mittlere R\xFCstung"), /*#__PURE__*/React.createElement("option", {
    value: "heavy"
  }, "Schwere R\xFCstung"), /*#__PURE__*/React.createElement("option", {
    value: "shield"
  }, "Schild"), /*#__PURE__*/React.createElement("option", {
    value: "other"
  }, "Sonstiges"))), eqForm.type !== 'other' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, eqForm.type === 'shield' ? 'Bonus zur RK' : 'Basis-RK'), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: 2,
    max: 20,
    value: eqForm.baseAC,
    onChange: e => setEqForm({
      ...eqForm,
      baseAC: +e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Magischer RK-Bonus"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "number",
    min: -5,
    max: 10,
    value: eqForm.acBonus || 0,
    onChange: e => setEqForm({
      ...eqForm,
      acBonus: +e.target.value
    }),
    placeholder: "z.B. +1 f\xFCr magische R\xFCstung"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label",
    style: {
      fontSize: 11,
      color: 'var(--text-muted)',
      marginBottom: 4,
      fontStyle: 'italic'
    }
  }, eqForm.type === 'light' && 'RK = ' + eqForm.baseAC + ' + GES-Mod' + (eqForm.acBonus ? ' + ' + eqForm.acBonus + ' (magisch)' : ''), eqForm.type === 'medium' && 'RK = ' + eqForm.baseAC + ' + GES-Mod (max. +2)' + (eqForm.acBonus ? ' + ' + eqForm.acBonus + ' (magisch)' : ''), eqForm.type === 'heavy' && 'RK = ' + eqForm.baseAC + ' (GES wird ignoriert)' + (eqForm.acBonus ? ' + ' + eqForm.acBonus + ' (magisch)' : ''), eqForm.type === 'shield' && 'Gibt +' + (+eqForm.baseAC + (+eqForm.acBonus || 0)) + ' auf die RK', eqForm.type === 'other' && (eqForm.acBonus ? '+' + eqForm.acBonus + ' zur RK' : 'Kein Einfluss auf die RK'))), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Notizen"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    value: eqForm.notes || '',
    onChange: e => setEqForm({
      ...eqForm,
      notes: e.target.value
    }),
    placeholder: "z.B. Umhang des Schutzes, Schild der Ablenkung"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "\u2726 Effekte"), /*#__PURE__*/React.createElement(EffectEditor, {
    effects: eqForm.effects,
    onChange: v => setEqForm({
      ...eqForm,
      effects: v
    }),
    hint: "Wirken, solange das St\xFCck angelegt ist."
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: "eq-equipped",
    checked: !!eqForm.equipped,
    onChange: e => setEqForm({
      ...eqForm,
      equipped: e.target.checked
    }),
    style: {
      width: 16,
      height: 16,
      cursor: 'pointer',
      accentColor: 'var(--gold)'
    }
  }), /*#__PURE__*/React.createElement("label", {
    htmlFor: "eq-equipped",
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 12,
      color: 'var(--text-muted)',
      cursor: 'pointer'
    }
  }, "Jetzt anlegen"))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => {
      setShowEF(false);
      setEqEditId(null);
    }
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    onClick: () => {
      if (!eqForm.name.trim()) {
        appAlert('Name darf nicht leer sein.');
        return;
      }
      const entry = {
        ...eqForm,
        id: eqEditId || Date.now().toString()
      };
      if (eqEditId) updEquipment(equipment.map(e => e.id === eqEditId ? entry : e));else updEquipment([...equipment, entry]);
      setShowEF(false);
      setEqEditId(null);
    }
  }, "\uD83D\uDCBE Speichern")))), showDmLogin && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title",
    style: {
      color: '#c060a0'
    }
  }, "\uD83D\uDD2E DM-Modus betreten"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginBottom: 16,
      fontFamily: "'Roboto',sans-serif"
    }
  }, "Gib das DM-Passwort ein um Zugriff auf den Dungeon Master Bereich zu erhalten."), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "DM-Passwort"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    autoFocus: true,
    value: dmLoginInput,
    onChange: e => setDmLoginInput(e.target.value),
    onKeyDown: e => e.key === 'Enter' && doDmLogin(),
    placeholder: "DM-Passwort eingeben..."
  })), dmLoginErr && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#3a1010",
      border: "1px solid var(--crimson)",
      borderRadius: 4,
      padding: "8px 12px",
      fontSize: 13,
      color: "#e87070",
      marginBottom: 8
    }
  }, "\u26A0\uFE0F ", dmLoginErr), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-cancel",
    onClick: () => setShowDmLogin(false)
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    className: "btn-save",
    style: {
      background: 'linear-gradient(135deg,#6030a0,#402070)',
      borderColor: '#c060a0'
    },
    onClick: doDmLogin
  }, "\uD83D\uDD2E Einloggen")))), showSetup && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-modal",
    style: {
      maxWidth: 460
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-title"
  }, "\u2601\uFE0F Server-Sync einrichten"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      lineHeight: 1.6,
      marginBottom: 16
    }
  }, "Charaktere werden auf deinem eigenen Server gespeichert und sind auf jedem Ger\xE4t verf\xFCgbar. Jede Gruppe hat einen eindeutigen ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-secondary)"
    }
  }, "Code"), " und ein ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-secondary)"
    }
  }, "Passwort"), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 0,
      marginBottom: 16,
      borderRadius: 4,
      overflow: "hidden",
      border: "1px solid var(--border)"
    }
  }, [["login", "🔑 Anmelden"], ["register", "✦ Neue Gruppe"]].map(([m, l]) => /*#__PURE__*/React.createElement("button", {
    key: m,
    onClick: () => {
      setSetupMode(m);
      setSetupErr('');
    },
    style: {
      flex: 1,
      padding: "9px 4px",
      fontFamily: "'Roboto Condensed',sans-serif",
      fontSize: 11,
      letterSpacing: "0.08em",
      cursor: "pointer",
      border: "none",
      background: setupMode === m ? "var(--gold-dim)" : "var(--bg-card)",
      color: setupMode === m ? "var(--gold-bright)" : "var(--text-muted)"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    className: "form-grid",
    style: {
      gridTemplateColumns: "1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Server URL"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "https://deine-domain.de",
    value: setupForm.url,
    onChange: e => setSetupForm({
      ...setupForm,
      url: e.target.value
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, "URL deines Webhostings, wo api.php liegt")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Gruppen-Code"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    placeholder: "z.B. ABENTEURER",
    maxLength: 20,
    value: setupForm.code,
    onChange: e => setSetupForm({
      ...setupForm,
      code: e.target.value.toUpperCase()
    }),
    style: {
      fontFamily: "'Roboto Condensed',sans-serif",
      letterSpacing: "0.1em"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, "Buchstaben, Zahlen, - und _ erlaubt")), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "Passwort"), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    placeholder: "Mind. 6 Zeichen",
    value: setupForm.pass,
    onChange: e => setSetupForm({
      ...setupForm,
      pass: e.target.value
    })
  })), setupMode === 'register' && /*#__PURE__*/React.createElement("div", {
    className: "form-group form-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-label"
  }, "\uD83D\uDD2E DM-Passwort ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: 'var(--text-muted)',
      fontStyle: 'italic'
    }
  }, "(optional \u2014 f\xFCr Dungeon Master Bereich)")), /*#__PURE__*/React.createElement("input", {
    className: "form-input",
    type: "password",
    placeholder: "DM-Passwort (optional)",
    value: setupForm.dmPass || '',
    onChange: e => setSetupForm({
      ...setupForm,
      dmPass: e.target.value
    })
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
    onClick: applySetup,
    disabled: setupBusy
  }, setupBusy ? "Verbinde..." : setupMode === "register" ? "✦ Gruppe erstellen & verbinden" : "🔑 Anmelden")))), showTpl && tplData && /*#__PURE__*/React.createElement("div", {
    className: "form-overlay"
  }, /*#__PURE__*/React.createElement("div", {
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
