// Heldenbuch — Wurzelkomponente: Zustand, Server-Sync, Seitenleiste,
// Dialoge. Haelt alles, was der Bogen ueber SheetCtx bekommt.

function App() {
  const [chars,  setChars]   = useState([]);
  const [sel,    setSel]     = useState(null);
  const [tab,    setTab]     = useState("stats");
  const [mv,     setMv]      = useState("list");
  const [showCF, setShowCF]  = useState(false);
  const [showWF, setShowWF]  = useState(false);
  const [showFF,     setShowFF]     = useState(false);
  const [ffEditId,   setFfEditId]   = useState(null);
  const [ff,         setFf]         = useState({name:'',source:'',description:'',effects:[],effectsActive:true});
  const [exFeature,  setExFeature]  = useState(null);
  const [slotsEdit,  setSlotsEdit]  = useState(false);
  const [spEdit,     setSpEdit]     = useState(false);
  const [resEdit,    setResEdit]    = useState(false);
  const [statsEdit,  setStatsEdit]  = useState(false);
  const [showSF, setShowSF]  = useState(false);
  const [sfEditId, setSfEditId] = useState(null);
  const [invRarity,  setInvRarity]  = useState('all');
  const [imgViewer,  setImgViewer]  = useState(null);  // {name, imageData}
  const [itemViewer,    setItemViewer]    = useState(null);
  // Nur die id: die Waffe wird beim Rendern frisch aus cur geholt, damit die
  // Detailansicht nach einer Bearbeitung nicht auf einer Kopie stehen bleibt.
  const [weaponViewer,  setWeaponViewer]  = useState(null);
  const [coinPopover,   setCoinPopover]   = useState(null);
  const [showLog,      setShowLog]      = useState(false);
  const [logEntries,   setLogEntries]   = useState([]);
  const [logLoading,   setLogLoading]   = useState(false);
  const [showAdventLog,setShowAdventLog]= useState(false);
  const [adventEntries,setAdventEntries]= useState([]);
  const [adventSearch, setAdventSearch] = useState('');
  const [adventTabFilter,setAdventTabFilter] = useState([]);
  const [coinDelta,     setCoinDelta]     = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [invTagFilter, setInvTagFilter] = useState([]);
  const [showNF,     setShowNF]     = useState(false);
  const [nfEditId,   setNfEditId]   = useState(null);
  const [nf,         setNf]         = useState({title:'',content:''});
  const [noteTagFilter, setNoteTagFilter] = useState([]);
  const [exNote,     setExNote]     = useState(null);
  const [showIF, setShowIF]  = useState(false);
  const [itfEditId, setItfEditId] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSel,  setTransferSel]  = useState(new Set());
  const [transferMode, setTransferMode] = useState(false);
  const [showArchive,  setShowArchive]  = useState(false);
  const [charSearch,   setCharSearch]   = useState('');
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
    const fokussierbar = (wurzel) => [...wurzel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]'
    )].filter(el => !el.disabled && el.offsetParent !== null);

    const aufTaste = (e) => {
      const overlays = document.querySelectorAll('.form-overlay');
      if (!overlays.length) return;
      const oben = overlays[overlays.length - 1];

      if (e.key === 'Escape') {
        const knopf = [...oben.querySelectorAll('button')].find(b =>
          /abbrechen|schlie(ss|ß)en|verstanden|^✕$/i.test(b.textContent.trim()));
        if (knopf) { e.preventDefault(); knopf.click(); }
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
        const erster = ziele[0], letzter = ziele[ziele.length - 1];
        if (e.shiftKey && document.activeElement === erster) { e.preventDefault(); letzter.focus(); }
        else if (!e.shiftKey && document.activeElement === letzter) { e.preventDefault(); erster.focus(); }
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
  const [ec,     setEc]      = useState(null);
  const [wf,     setWf]      = useState(newWeapon());
  const [wfEditId, setWfEditId] = useState(null);
  const [sf,     setSf]      = useState(newSpell());
  const [itf,    setItf]     = useState(newItem());
  const [exSpell,setExSpell] = useState(null);
  const [collapsedLevels, setCollapsedLevels] = useState(() => window.innerWidth < 1025 ? new Set([0,1,2,3,4,5,6,7,8,9]) : new Set());
  const [spellTagFilter, setSpellTagFilter] = useState({classes:[], dmg:[]});
  const [openUnprepared, setOpenUnprepared] = useState(new Set());
  const [exItem, setExItem]  = useState(null);
  const [showTpl,  setShowTpl]  = useState(null); // 'spell' | 'weapon' | 'wildshape'
  const [tplData,  setTplData]  = useState(null);
  const [userLibrary, setUserLibrary] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hb_library') || '{}'); } catch { return {}; }
  });
  // Ob die geteilte Datenbank schon vorliegt. Nur dann sind die
  // Einstellungen des Abenteuers bekannt — und nur dann duerfen verdeckte
  // Trefferpunkte als Zahl erscheinen.
  const [libGeladen, setLibGeladen] = useState(() => {
    try { return !!localStorage.getItem('hb_library'); } catch { return false; }
  });
  const libTimer = useRef(null);
  const [tplSearch,setTplSearch]= useState('');
  const [tplFilter,setTplFilter]= useState('all');
  const [tplClassFilter, setTplClassFilter] = useState([]);
  const [tplDmgFilter, setTplDmgFilter] = useState([]);
  const [wsFilter, setWsFilter] = useState({cr:'all', tag:'all'});
  const [wsExpand, setWsExpand] = useState(null);
  const toggleWsFav = (name) => {
    const favs = cur.wsFavorites || [];
    patchChar({wsFavorites: favs.includes(name) ? favs.filter(n=>n!==name) : [...favs, name]});
  };

  // Server-Sync
  const [svUrl,      setSvUrl]      = useState('');
  const [svCode,     setSvCode]     = useState('');
  const [svPass,     setSvPass]     = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMsg,    setSyncMsg]    = useState('');
  const [offeneAenderungen, setOffeneAenderungen] = useState(0);
  const [isDmMode,   setIsDmMode]   = useState(false);
  const [dmPass,     setDmPass]     = useState('');
  const [dmLibrary,  setDmLibrary]  = useState({});
  const [hasDmMode,  setHasDmMode]  = useState(false);
  const [showDmLogin,setShowDmLogin]= useState(false);
  const [dmLoginInput,setDmLoginInput]=useState('');
  const [dmLoginErr, setDmLoginErr] = useState('');
  const [showSetup,  setShowSetup]  = useState(false);
  const [showDB,     setShowDB]     = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null); // {msg, onOk}
  const appConfirm = (msg, onOk, okLabel) => setConfirmDlg({msg, onOk, okLabel});
  // Hinweis ohne Rueckfrage — nutzt denselben Dialog, damit Meldungen im
  // Bogen bleiben statt als Systemfenster des Browsers aufzupoppen.
  const appAlert = (msg) => setConfirmDlg({msg, onOk: null, okLabel: 'Verstanden'});
  const [dbTab,      setDbTab]      = useState('spell');
  const [dbForm,     setDbForm]     = useState(null);
  const [dbFormId,   setDbFormId]   = useState(null);
  const [dbListTick,  setDbListTick]  = useState(0);
  const [dbExpandedEntry, setDbExpandedEntry] = useState(null);
  const [dbGradeFilter, setDbGradeFilter] = useState('');
  const [setupMode,  setSetupMode]  = useState('login'); // login|register
  const [setupForm,  setSetupForm]  = useState({url:'',code:'',pass:''});
  const [setupErr,   setSetupErr]   = useState('');
  const [setupBusy,  setSetupBusy]  = useState(false);
  const [gearReady,  setGearReady]  = useState(false);   // Serverstand da, Umstellung darf laufen
  const [ansichtBereit, setAnsichtBereit] = useState(false); // Merker gelesen, ab jetzt schreiben
  // Welches Abenteuer gerade offen ist. Steht im Geraet, nicht am Server:
  // zwei Spieler duerfen gleichzeitig in verschiedenen Kampagnen blaettern.
  const [advAktiv,   setAdvAktiv]   = useState(() => { try { return localStorage.getItem('hb_adventure') || ''; } catch { return ''; } });
  const [showAdvVerwaltung, setShowAdvVerwaltung] = useState(false);
  const [advEinstellung, setAdvEinstellung] = useState(null);  // Abenteuer im Einstellungsfenster
  // Gegner der Spielleitung. Nur im DM-Modus geladen, eigene Tabelle.
  const [enemies, setEnemies] = useState([]);
  const [enemiesGeladen, setEnemiesGeladen] = useState(false);
  const [enemyForm, setEnemyForm] = useState(null);   // offener Bearbeiten-Dialog
  const [enemyView, setEnemyView] = useState(null);   // offene Werteübersicht
  const [enemyImportBusy, setEnemyImportBusy] = useState(false);
  const [encounters, setEncounters] = useState([]);
  // Der laufende Kampf liegt im Geraet, nicht nur im Arbeitsspeicher: im
  // alten Tracker kostete ein versehentliches Neuladen mitten im Kampf die
  // ganze Initiativreihenfolge. Er gehoert der Spielleitung an diesem
  // Geraet, deshalb reicht der lokale Speicher — auf dem Server waere er
  // ein Fremdkoerper zwischen den Charakterboegen.
  const [kampf, setKampfRoh] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hb_kampf') || 'null'); } catch { return null; }
  });
  const [showKampf, setShowKampf] = useState(false);
  const setKampf = (wertOderFn) => setKampfRoh(vorher => {
    const neu = typeof wertOderFn === 'function' ? wertOderFn(vorher) : wertOderFn;
    try {
      if (neu) localStorage.setItem('hb_kampf', JSON.stringify(neu));
      else localStorage.removeItem('hb_kampf');
    } catch {}
    return neu;
  });
  const [encForm, setEncForm] = useState(null);
  // Die Chronik liegt als ein Stueck am Server: "die Gruppe schlaeft drei
  // Tage" ruehrt jedes offene Ereignis an, das waere zeilenweise ein
  // Dutzend Anfragen fuer einen Knopfdruck.
  const [chronik, setChronik] = useState({zeit:{}, ereignisse:[]});
  const [showChronik, setShowChronik] = useState(() => {
    try { return localStorage.getItem('hb_chronik_offen') === '1'; } catch { return false; }
  });
  const [ereignisForm, setEreignisForm] = useState(null);  // {e, neu}
  // Der Automat in der Taverne. Zeitvertreib fuer alle, nicht nur die
  // Spielleitung — und ohne jede Verbindung zum Charakterbogen.
  const [showAutomat, setShowAutomat] = useState(false);
  const [zeitOffen, setZeitOffen] = useState(false);
  const [encNurAktives, setEncNurAktives] = useState(true);
  const [enemySuche, setEnemySuche] = useState('');
  const [enemyCr,    setEnemyCr]    = useState('');
  const [enemyTag,   setEnemyTag]   = useState('');
  const [advMenuOffen, setAdvMenuOffen] = useState(false);
  const [gearPick,   setGearPick]   = useState(null);    // offener Platz im Auswahldialog
  const saveTimer = useRef(null);
  const autoSyncTimer = useRef(null);
  // Hintergrundabgleich: die Kennung (billig statt bcrypt), der zuletzt
  // gesehene Stand und ein Zaehler ruhiger Runden fuer die Bremse.
  const pollToken   = useRef(null);
  const revRef      = useRef(null);
  const ruheRef     = useRef(0);
  // Wo man beim letzten Mal war. Wird einmal nach dem Laden angewandt.
  const ansichtGeholt = useRef(false);
  const charsRef = useRef([]);
  const selRef   = useRef(null);
  const pendingRef     = useRef(false);
  const pendingChars   = useRef({});       // {charId: charWithoutInventory}
  const pendingDeletes = useRef(new Set()); // charIds to delete
  const pendingItems   = useRef({});       // {charId_itemId: itemData}
  const pendingItemDel = useRef(new Set()); // "charId_itemId" to delete
  const selectChar = (id) => { selRef.current = id; setSel(id); };

  // ── Lokale Kopie ────────────────────────────────────────────────
  // Der Browser gibt einer Seite rund 5 MB. Mit Heldenbildern und
  // Gegenstandsbildern ist das erreichbar, und dann wirft setItem. Bisher
  // riss das die Anmeldung mit: der Fehler landete ungefangen im
  // Anmeldefenster ("exceeded the quota") und niemand kam mehr hinein.
  //
  // Die Kopie ist eine Bequemlichkeit — sie zeigt den letzten Stand, bis
  // der Server antwortet. Ihr Fehlen darf nichts blockieren: die Daten
  // liegen auf dem Server, und die Warteschlange merkt sich Kennungen,
  // keine Inhalte. Passt die Kopie nicht mehr, sagen wir das und arbeiten
  // ohne sie weiter.
  const [spiegelVoll, setSpiegelVoll] = useState(false);
  const spiegleChars = (json) => {
    try {
      localStorage.setItem('dnd_chars', json);
      setSpiegelVoll(false);
      return true;
    } catch (e) {
      // Platz schaffen: die Bibliothek laesst sich jederzeit neu laden.
      try { localStorage.removeItem('hb_library'); } catch {}
      try { localStorage.removeItem('hb_dm_library'); } catch {}
      try { localStorage.setItem('dnd_chars', json); setSpiegelVoll(false); return true; } catch {}
      // Ein unvollstaendiger Stand waere schlimmer als keiner: er saehe
      // aus wie Datenverlust. Lieber gar keine Kopie.
      try { localStorage.removeItem('dnd_chars'); } catch {}
      console.warn('[Heldenbuch] Lokale Kopie passt nicht in den Browserspeicher:', e && e.message);
      setSpiegelVoll(true);
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
  const zaehleOffen = () =>
    Object.keys(pendingChars.current).length + Object.keys(pendingItems.current).length +
    pendingDeletes.current.size + pendingItemDel.current.size;
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
      if (offen === 0) { localStorage.removeItem(WARTESCHLANGE); return; }
      localStorage.setItem(WARTESCHLANGE, JSON.stringify({
        chars:    Object.keys(pendingChars.current),
        items:    Object.keys(pendingItems.current),
        delChars: [...pendingDeletes.current],
        delItems: [...pendingItemDel.current],
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
        if (c) pendingChars.current[id] = {...c, inventory: []};
      });
      pendingItems.current = {};
      (roh.items || []).forEach(k => {
        const [charId, itemId] = k.split('__');
        const c = charsRef.current.find(x => x.id === charId);
        const item = c && (c.inventory || []).find(i => i.id === itemId);
        if (item) pendingItems.current[k] = {charId, itemId, item};
      });
      pendingDeletes.current = new Set(roh.delChars || []);
      pendingItemDel.current = new Set(roh.delItems || []);
      const offen = zaehleOffen();
      pendingRef.current = offen > 0;
      setOffeneAenderungen(offen);
      return pendingRef.current;
    } catch { return false; }
  };
  const libRef = useRef({});
  const dmLibRef = useRef({});
  const isDmRef = useRef(false);
  const dmPassRef = useRef('');

  // charsRef muss synchron mitlaufen: save() difft gegen charsRef.current und
  // stellt jeden dort vorhandenen, in der neuen Liste fehlenden Charakter zur
  // Löschung auf dem Server. Eine veraltete Referenz löscht also echte Daten.
  // Deshalb nur über applyChars setzen — nie setChars(...) allein aufrufen.
  const applyChars = (next) => { charsRef.current = next; setChars(next); };

  // charsRef is set synchronously in save() and load ops — NOT via useEffect
  // selRef is updated directly in selectChar below
  useEffect(() => { libRef.current = userLibrary; }, [userLibrary]);
  useEffect(() => { dmLibRef.current = dmLibrary; }, [dmLibrary]);
  useEffect(() => { isDmRef.current = isDmMode; }, [isDmMode]);
  useEffect(() => { dmPassRef.current = dmPass; }, [dmPass]);


  // Auto-sync every 5 seconds in background (silent)
  // Interval sync: push localStorage to server every 3 seconds if pending
  useEffect(() => {
    const tick = async () => {
      if (!pendingRef.current) return;
      const {url, code, pass} = serverCreds();
      if (!url || !code || !pass) return;

      // Snapshot and optimistically reset
      const toSave    = {...pendingChars.current};
      const toDelete  = new Set(pendingDeletes.current);
      const toSaveI   = {...pendingItems.current};
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

      try {
        const ops = [
          ...Object.values(toSave).map(c => apiSaveChar(url, code, pass, c.id, c)),
          ...Object.values(toSaveI).map(({charId,itemId,item}) => apiSaveItem(url, code, pass, charId, itemId, item)),
          ...[...toDelete].map(id => apiDeleteChar(url, code, pass, id)),
          ...[...toDeleteI].map(k => { const [charId,itemId]=k.split('__'); return apiDeleteItem(url, code, pass, charId, itemId); }),
        ];
        const antworten = ops.length > 0 ? await Promise.all(ops) : [];
        // Jede Antwort traegt den Stand nach dem Schreiben. Ihn hier zu
        // uebernehmen heisst: der naechste Abgleich erkennt die eigene
        // Aenderung und laedt sie nicht noch einmal herunter.
        const staende = antworten.map(a => a && a.rev).filter(r => typeof r === 'number');
        if (staende.length) revRef.current = Math.max(revRef.current || 0, ...staende);
        // Waehrend des Wartens kann schon wieder etwas dazugekommen sein —
        // deshalb den aktuellen Stand sichern, nicht blind leeren.
        merkeWarteschlange();
        setSyncStatus('ok'); setSyncMsg('Gespeichert ✓');
      } catch(e) {
        // Re-queue on failure
        Object.assign(pendingChars.current, toSave);
        Object.assign(pendingItems.current, toSaveI);
        for (const id of toDelete) pendingDeletes.current.add(id);
        for (const k of toDeleteI) pendingItemDel.current.add(k);
        pendingRef.current = true;
        merkeWarteschlange();
        setSyncStatus('err'); setSyncMsg(e.message);
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
  const POLL_SCHNELL = 5000, POLL_RUHIG = 15000, POLL_LEISE = 60000;
  const pollAbstand = () => ruheRef.current < 12 ? POLL_SCHNELL
                          : ruheRef.current < 50 ? POLL_RUHIG : POLL_LEISE;

  // Die vier Werte aus der Antwort in die Charaktere schreiben. Bewusst
  // ueber applyChars und nicht ueber save: was vom Server kommt, darf
  // nicht als eigene Aenderung wieder hochgehen.
  const vitalsAnwenden = (vitals) => {
    if (!vitals) return false;
    let geaendert = false;
    const neu = charsRef.current.map(c => {
      const v = vitals[c.id];
      if (!v) return c;
      const p = {};
      ['hp','tempHp','tempMaxHp'].forEach(k => {
        if (v[k] !== undefined && (+v[k]||0) !== (+c[k]||0)) p[k] = +v[k]||0;
      });
      if (JSON.stringify(v.deathSaves||null) !== JSON.stringify(c.deathSaves||null)) {
        p.deathSaves = v.deathSaves;
      }
      if (!Object.keys(p).length) return c;
      geaendert = true;
      return {...c, ...p};
    });
    if (geaendert) { applyChars(neu); spiegleChars(JSON.stringify(neu)); }
    return geaendert;
  };

  useEffect(() => {
    let beendet = false, timer = null;
    const plan = (ms) => { if (!beendet) timer = setTimeout(lauf, ms); };

    const lauf = async () => {
      if (beendet) return;
      const {url, code, pass} = serverCreds();
      const tok = pollToken.current;
      // Nichts zu tun — und das ist der haeufigste Fall.
      if (!url || !code || !tok || pendingRef.current
          || (typeof document !== 'undefined' && document.hidden)) {
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
            applyChars(data.chars || []);
            spiegleChars(JSON.stringify(data.chars || []));
            if (data.library) { setUserLibrary(data.library); setLibGeladen(true); safeSetItem('hb_library', JSON.stringify(data.library)); }
          }
          if (data.rev != null) revRef.current = data.rev;
        } else if (revRef.current == null && d.rev != null) {
          revRef.current = d.rev;
        }
        ruheRef.current = (etwasNeu || revNeu) ? 0 : ruheRef.current + 1;
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
    if (!chars.length && !gearReady) return;   // noch nichts zum Wiederfinden
    ansichtGeholt.current = true;
    let a = null;
    try { a = JSON.parse(localStorage.getItem(ANSICHT) || 'null'); } catch {}
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
        sel, tab, mv, sidebar: sidebarCollapsed, kampf: showKampf,
      }));
    } catch {}
  }, [ansichtBereit, sel, tab, mv, sidebarCollapsed, showKampf]);

  // tplData only loaded when template picker opens (openTpl)

  useEffect(() => {
    const {url, code, pass} = serverCreds();
    setSvUrl(url); setSvCode(code); setSvPass(pass);
    if (url && code && pass) {
      // Load localStorage immediately for instant display while server loads
      try { const v=localStorage.getItem('dnd_chars'); if(v) applyChars(JSON.parse(v)); } catch {}
      try { const lib=localStorage.getItem('hb_library'); if(lib) { setUserLibrary(JSON.parse(lib)); setLibGeladen(true); } } catch {}
      // Offene Aenderungen der letzten Sitzung zuerst aufnehmen: sie setzen
      // pendingRef, und der Ladevorgang unten laesst die lokale Kopie dann
      // stehen, statt sie mit dem Serverstand zu ueberschreiben. Der
      // Sekundentakt schiebt sie hoch, sobald der Server antwortet.
      ladeWarteschlange();
      // Load server data on startup — but only apply if no unsaved local changes
      apiLoadChars(url, code, pass).then(d => {
        pollToken.current = d.poll_token || null;
        revRef.current    = d.rev != null ? d.rev : null;
        if (d.has_dm) setHasDmMode(true);
        if (d.library) { setUserLibrary(d.library); setLibGeladen(true); safeSetItem('hb_library', JSON.stringify(d.library)); }
        if (!pendingRef.current) {
          // No unsaved local changes — server is authoritative
          applyChars(d.chars || []);
          spiegleChars(JSON.stringify(d.chars || []));
        }
        // If pendingRef=true: local has newer unsaved data — keep it, interval will push to server
        setSyncStatus('ok'); setSyncMsg('Verbunden ✓');
        setGearReady(true);
      }).catch((e) => {
        // Kein "Lokal ✓": das las sich wie ein gelungener Speichervorgang,
        // obwohl nichts beim Server angekommen ist. Der Zustand ist ein
        // Fehler, kein Betriebsmodus — und wird auch so angezeigt.
        //
        // Gezeigt wird der Grund, den der Server nennt, nicht ein
        // geratener. "Server nicht erreichbar" stimmt nur, wenn die
        // Verbindung selbst scheitert; ein falsches Passwort oder eine
        // Absage der Datenbank sehen von hier genauso aus und wuerden
        // sonst unter der falschen Ueberschrift landen.
        const grund = (e && e.message) ? e.message : 'Laden fehlgeschlagen';
        console.error('[Heldenbuch] Laden fehlgeschlagen:', e);
        setSyncStatus('err'); setSyncMsg(grund);
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
    const warnen = (e) => { if (pendingRef.current) { e.preventDefault(); e.returnValue = ''; } };
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
    if (!liste.some(c => (c.gearMigrated||0) < GEAR_MIGRATION)) return;
    save(liste.map(c => { const p = migrateGear(c); return p ? {...c, ...p} : c; }));
  }, [gearReady, chars]);

  // Abenteuer anlegen und Helden zuordnen. Wie die Ausruestungsumstellung
  // wartet auch das den Serverstand ab — sonst schriebe es den lokalen
  // Stand fest und der vom Server ginge verloren.
  useEffect(() => {
    if (!gearReady) return;
    const ergebnis = advMigration(userLibrary, charsRef.current);
    if (!ergebnis) return;
    if (ergebnis.libGeaendert)   saveLibrary(ergebnis.lib);
    if (ergebnis.charsGeaendert) save(ergebnis.chars);
  }, [gearReady, chars, userLibrary]);

  const saveLibrary = (lib) => {
    // Setzt bewusst nicht libGeladen: hier kommt auch die
    // Abenteuer-Umstellung durch, die ein Abenteuer ohne Einstellungen
    // erfindet. Das darf nicht als "Einstellungen bekannt" gelten, sonst
    // stuenden verdeckte Trefferpunkte doch wieder offen da.
    setUserLibrary(lib);
    safeSetItem('hb_library', JSON.stringify(lib));
    const {url, code, pass} = serverCreds();
    if (!url || !code || !pass) return;
    apiSaveLibrary(url, code, pass, lib).catch(() => {});
  };

  const addToLibrary = (type, entry) => {
    const lib = {...userLibrary};
    lib[type] = [...(lib[type]||[])];
    const exists = lib[type].some(e => e.name === entry.name);
    if (!exists) lib[type].push({...entry, _custom: true});
    saveLibrary(lib);
  };

  const removeFromLibrary = (type, name) => {
    const lib = {...userLibrary, [type]: (userLibrary[type]||[]).filter(e=>e.name!==name)};
    saveLibrary(lib);
  };

  const newDbEntry = type => {
    if (type==='spell')  return {name:'',level:1,school:'Hervorrufung',castingTime:'1 Aktion',range:'9 m',duration:'Sofort',components:'V, S',description:'',classes:[],damageTags:[]};
    if (type==='item')   return {name:'',qty:1,weight:'',rarity:'gewöhnlich',description:'',tags:[],source:'',icon:'🎒',imageData:'',
                                 gearKind:'',armorType:'',baseAC:0,acBonus:0,effects:[],setName:''};
    if (type==='weapon') return {name:'',damage:'1W6',damageType:'Hieb',range:'1,5 m',description:'',properties:[]};
    // stufen: ab wie vielen getragenen Teilen welche Effekte dazukommen.
    if (type==='set')    return {name:'',description:'',stufen:[{teile:2,effects:[]}]};
    return {name:'',cr:'1/4',size:'Mittel',type:'Tier',ac:10,hp:10,speed:'9 m',str:10,dex:10,con:10,int:3,wis:12,cha:6,senses:'',skills:'',tagsStr:'',abilitiesStr:'',actions:[{name:'',desc:''}]};
  };

  const openDbForm = (type, entry) => {
    if (!entry) { setDbForm(newDbEntry(type)); setDbFormId(null); return; }
    const form = {...entry};
    if (type==='wildshape') {
      form.tagsStr = (entry.tags||[]).join(', ');
      form.abilitiesStr = (entry.abilities||[]).join('\n');
      if (!form.actions || form.actions.length===0) form.actions = [{name:'',desc:''}];
    }
    setDbForm(form);
    setDbFormId(entry.name);
  };

  const saveDbEntry = () => {
    if (!dbForm || !dbForm.name.trim()) { appAlert('Name darf nicht leer sein.'); return; }
    let entry = {...dbForm, _custom:true};
    if (dbTab==='wildshape') {
      entry.tags = (dbForm.tagsStr||'').split(',').map(t=>t.trim()).filter(Boolean);
      entry.abilities = (dbForm.abilitiesStr||'').split('\n').map(a=>a.trim()).filter(Boolean);
      entry.actions = (dbForm.actions||[]).filter(a=>a.name.trim());
      delete entry.tagsStr; delete entry.abilitiesStr;
    }
    const type = dbTab;
    const editId = dbFormId;
    const finalEntry = entry;

    const updater = prev => {
      const entries = [...(prev[type]||[])];
      if (editId !== null) {
        const idx = entries.findIndex(e=>e.name===editId);
        if (idx>=0) entries[idx]=finalEntry; else entries.push(finalEntry);
      } else {
        if (entries.some(e=>e.name===finalEntry.name)) { appAlert('Ein Eintrag mit diesem Namen existiert bereits.'); return prev; }
        entries.push(finalEntry);
      }
      return {...prev, [type]: entries};
    };

    const {url, code, pass} = serverCreds();
    if (isDmMode) {
      setDmLibrary(prev => {
        const lib = updater(prev);
        apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(()=>{});
        return lib;
      });
    } else {
      setUserLibrary(prev => {
        const lib = updater(prev);
        safeSetItem('hb_library', JSON.stringify(lib));
        apiSaveLibrary(url, code, pass, lib).catch(()=>{});
        return lib;
      });
    }
    setDbForm(null); setDbFormId(null);
  };

  const deleteDbEntry = (type, name) => {
    appConfirm('"'+name+'" aus der Bibliothek löschen?', () => {
      const {url, code, pass} = serverCreds();
      if (isDmMode) {
        setDmLibrary(prev => {
          const lib = {...prev, [type]: (prev[type]||[]).filter(e=>e.name!==name)};
          apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(()=>{});
          return lib;
        });
      } else {
        setUserLibrary(prev => {
          const lib = {...prev, [type]: (prev[type]||[]).filter(e=>e.name!==name)};
          safeSetItem('hb_library', JSON.stringify(lib));
          apiSaveLibrary(url, code, pass, lib).catch(()=>{});
          return lib;
        });
      }
    });
  };

  const doSyncLoad = async (url, code, pass) => {
    setSyncStatus('busy'); setSyncMsg('Lade vom Server...');
    try {
      const data = await apiLoad(url, code, pass);
      pollToken.current = data.poll_token || null;
      revRef.current    = data.rev != null ? data.rev : null;
      ruheRef.current   = 0;
      // User explicitly requested reload — always apply server data
      pendingRef.current = false;   // cancel any pending local saves
      applyChars(data.chars || []);
      spiegleChars(JSON.stringify(data.chars || []));
      if (data.library) { setUserLibrary(data.library); setLibGeladen(true); safeSetItem('hb_library', JSON.stringify(data.library)); }
      if (data.has_dm) setHasDmMode(true);
      setSyncStatus('ok'); setSyncMsg('Geladen ✓');
    } catch(e) {
      setSyncStatus('err'); setSyncMsg(e.message);
    }
  };

  const doDmLogin = async () => {
    if (!dmLoginInput.trim()) { setDmLoginErr('Bitte DM-Passwort eingeben.'); return; }
    setDmLoginErr('');
    try {
      const {url, code, pass} = serverCreds();
      const dm = dmLoginInput.trim();
      const data = await apiDmLoad(url, code, pass, dm);
      setDmLibrary(data.dm_library || {});
      setDmPass(dm);
      setIsDmMode(true);
      setShowDmLogin(false);
      setDmLoginInput('');
      // Gegner kommen aus einer eigenen Tabelle und nur fuer die
      // Spielleitung. Faellt der Abruf aus, bleibt der DM-Modus trotzdem
      // nutzbar — die Gegnerliste sagt dann, dass sie nicht geladen ist.
      try {
        const [g, b] = await Promise.all([
          apiDmLoadEnemies(url, code, pass, dm),
          apiDmLoadEncounters(url, code, pass, dm),
        ]);
        setEnemies(Array.isArray(g.enemies) ? g.enemies : []);
        setEncounters(Array.isArray(b.encounters) ? b.encounters : []);
        setEnemiesGeladen(true);
      } catch(e) {
        setEnemies([]); setEncounters([]); setEnemiesGeladen(false);
        console.error('[Heldenbuch] Gegner konnten nicht geladen werden:', e);
      }
      // Eigener Versuch: faellt die Chronik aus, bleibt die Gegnerliste
      // trotzdem geladen. Sie haengen sachlich nicht zusammen.
      try {
        const ch = await apiDmLoadChronik(url, code, pass, dm);
        setChronik(ch.chronik && typeof ch.chronik === 'object'
          ? {zeit: ch.chronik.zeit || {}, ereignisse: ch.chronik.ereignisse || []}
          : {zeit:{}, ereignisse:[]});
      } catch(e) {
        setChronik({zeit:{}, ereignisse:[]});
        console.error('[Heldenbuch] Chronik konnte nicht geladen werden:', e);
      }
      // Der Kampfschirm braucht den DM-Modus und kann deshalb erst hier
      // zurueckkommen. Nur, wenn ein Kampf laeuft und er vorher offen war
      // — wer ihn zugeklappt hat, will ihn nicht wiederhaben.
      try {
        const a = JSON.parse(localStorage.getItem(ANSICHT) || 'null');
        if (a && a.kampf && kampf) setShowKampf(true);
      } catch {}
    } catch(e) {
      setDmLoginErr(e.message || 'Falsches DM-Passwort.');
    }
  };

  const doDmLogout = () => {
    setIsDmMode(false);
    setDmPass('');
    setDmLibrary({});
    // Nichts von der Spielleitung bleibt im Speicher zurueck, wenn jemand
    // das Geraet weiterreicht.
    setEnemies([]); setEncounters([]); setEnemiesGeladen(false);
    setChronik({zeit:{}, ereignisse:[]}); setShowChronik(false);
    setEreignisForm(null); setZeitOffen(false); setAdvEinstellung(null);
  };

  // Einmaliges Einlesen einer Sammlung aus einer JSON-Datei. Geht in einem
  // Zug zum Server statt in 360 Einzelanfragen — das waere langsam und
  // wuerde die Anfragebremse reizen.
  const importEnemies = async (datei) => {
    if (!datei) return;
    setEnemyImportBusy(true);
    try {
      const text = await datei.text();
      const liste = JSON.parse(text);
      if (!Array.isArray(liste)) throw new Error('Die Datei enthält keine Liste.');
      const brauchbar = liste.filter(e => e && e.id && e.name);
      if (!brauchbar.length) throw new Error('Kein Eintrag mit Kennung und Namen gefunden.');
      const {url, code, pass} = serverCreds();
      const antwort = await apiDmImportEnemies(url, code, pass, dmPassRef.current, brauchbar);
      const g = await apiDmLoadEnemies(url, code, pass, dmPassRef.current);
      setEnemies(Array.isArray(g.enemies) ? g.enemies : []);
      setEnemiesGeladen(true);
      const uebersprungen = (liste.length - brauchbar.length) + (antwort.skipped || 0);
      appAlert(antwort.imported + ' Gegner eingelesen.'
        + (uebersprungen ? ' ' + uebersprungen + ' übersprungen (ohne Kennung oder zu groß).' : ''));
    } catch (err) {
      appAlert('Einlesen fehlgeschlagen: ' + (err.message || 'unbekannter Fehler'));
    }
    setEnemyImportBusy(false);
  };

  // ── Gegner ──────────────────────────────────────────────────────
  // Jeder Gegner wird einzeln gespeichert. Fehler werden gezeigt statt
  // verschluckt: eine stille Absage saehe aus wie ein gelungenes Speichern.
  const saveEnemy = async (e) => {
    if (!e || !e.id) return false;
    setEnemies(list => list.some(x=>x.id===e.id) ? list.map(x=>x.id===e.id?e:x) : [...list, e]);
    const {url, code, pass} = serverCreds();
    try {
      await apiDmSaveEnemy(url, code, pass, dmPassRef.current, e.id, e);
      return true;
    } catch (err) {
      appAlert('Gegner konnte nicht gespeichert werden: ' + (err.message || 'unbekannter Fehler'));
      return false;
    }
  };
  const saveEncounter = async (b) => {
    if (!b || !b.id) return false;
    setEncounters(list => list.some(x=>x.id===b.id) ? list.map(x=>x.id===b.id?b:x) : [...list, b]);
    const {url, code, pass} = serverCreds();
    try {
      await apiDmSaveEncounter(url, code, pass, dmPassRef.current, b.id, b);
      return true;
    } catch (err) {
      appAlert('Begegnung konnte nicht gespeichert werden: ' + (err.message || 'unbekannter Fehler'));
      return false;
    }
  };
  const deleteEncounter = (b) => appConfirm('Begegnung „' + (b.name||'') + '“ löschen?', async () => {
    const vorher = encounters;
    setEncounters(list => list.filter(x=>x.id!==b.id));
    const {url, code, pass} = serverCreds();
    try { await apiDmDeleteEncounter(url, code, pass, dmPassRef.current, b.id); }
    catch (err) {
      setEncounters(vorher);
      appAlert('Begegnung konnte nicht gelöscht werden: ' + (err.message || 'unbekannter Fehler'));
    }
  }, 'Löschen');

  const deleteEnemy = (id) => appConfirm('Gegner wirklich löschen?', async () => {
    const vorher = enemies;
    setEnemies(list => list.filter(x=>x.id!==id));
    const {url, code, pass} = serverCreds();
    try { await apiDmDeleteEnemy(url, code, pass, dmPassRef.current, id); }
    catch (err) {
      setEnemies(vorher);   // nicht so tun, als waere er weg
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
    save(charsRef.current.map(c => c.id === charId ? {...c, ...patch} : c));
    // Ins Log kommen nur die beiden Augenblicke, die man spaeter
    // nachlesen will. Jeder einzelne Treffer waere eine Zeile, und nach
    // einem Kampf stuenden dreissig davon im Abenteuerlog.
    const alt = +vorher.hp || 0, neu = patch.hp;
    if (neu !== undefined && alt > 0 && neu <= 0) {
      addLog(charId, name || vorher.name, 'charakter', 'Bei 0 Trefferpunkten',
        {kampf: (kampf && kampf.name) || undefined});
    } else if (neu !== undefined && alt <= 0 && neu > 0) {
      addLog(charId, name || vorher.name, 'charakter', 'Wieder auf den Beinen: ' + neu + ' TP',
        {kampf: (kampf && kampf.name) || undefined});
    }
  };

  const saveChronik = (ch) => {
    setChronik(ch);
    chronikMerkmaleAbgleichen(ch);
    const {url, code, pass} = serverCreds();
    if (!url || !code || !pass || !dmPassRef.current) return;
    apiDmSaveChronik(url, code, pass, dmPassRef.current, ch).catch(err =>
      appAlert('Chronik konnte nicht gespeichert werden: ' + (err.message || 'unbekannter Fehler')));
  };

  // Die Chronik-Merkmale werden nicht gesetzt und irgendwann wieder
  // entfernt, sondern nach jeder Aenderung neu abgeleitet. Was abgeleitet
  // wird, kann nicht haengenbleiben — und ein zurueckgedrehter Tag bringt
  // den Fluch von selbst zurueck.
  const chronikMerkmaleAbgleichen = (ch) => {
    const soll = chronikMerkmale(ch, advId);
    const dazu = [], weg = [];
    let geaendert = false;
    const neu = charsRef.current.map(c => {
      // Nur Helden des offenen Abenteuers: die Uhr eines anderen Abenteuers
      // sagt ueber sie nichts aus, und ihre Merkmale duerfen nicht fallen.
      if ((c.adventure || '') !== advId) return c;
      const alt   = (c.features||[]).filter(istChronikMerkmal);
      const neuF  = soll[c.id] || [];
      if (JSON.stringify(alt) === JSON.stringify(neuF)) return c;
      geaendert = true;
      neuF.filter(f => !alt.some(a => a.id === f.id)).forEach(f => dazu.push({c, f}));
      alt.filter(f => !neuF.some(n2 => n2.id === f.id)).forEach(f => weg.push({c, f}));
      return {...c, features: [...(c.features||[]).filter(f => !istChronikMerkmal(f)), ...neuF]};
    });
    if (!geaendert) return;
    save(neu);
    dazu.forEach(({c,f}) => addLog(c.id, c.name, 'attribute', 'Aus der Chronik: ' + f.name, {wirkt: 'ab jetzt'}));
    weg.forEach(({c,f})  => addLog(c.id, c.name, 'attribute', 'Aus der Chronik beendet: ' + f.name));
  };
  const chronikUmschalten = () => setShowChronik(v => {
    try { localStorage.setItem('hb_chronik_offen', v ? '0' : '1'); } catch {}
    return !v;
  });
  const chronikJetzt = () => zeitDerUhr(chronik, advId);
  const ereignisSpeichern = (e) => {
    const liste = chronik.ereignisse || [];
    saveChronik({...chronik, ereignisse: liste.some(x=>x.id===e.id)
      ? liste.map(x=>x.id===e.id?e:x) : [...liste, e]});
    setEreignisForm(null);
  };
  const ereignisLoeschen = (e) => appConfirm('Ereignis „' + (e.name||'') + '“ löschen?', () => {
    saveChronik({...chronik, ereignisse: (chronik.ereignisse||[]).filter(x=>x.id!==e.id)});
  }, 'Löschen');
  // Abhaken heisst nur "zur Kenntnis genommen". Es schreibt nichts in
  // fremde Boegen — das tut allein das Zeitfenster, und dort ausdruecklich.
  const ereignisAbhaken = (e) => {
    const jetzt = chronikJetzt();
    saveChronik({...chronik, ereignisse: (chronik.ereignisse||[]).map(x => {
      if (x.id !== e.id) return x;
      if (x.wiederholung > 0 && x.faellig != null) {
        let f = x.faellig;
        while (f <= jetzt) f += x.wiederholung;
        return {...x, faellig: f};
      }
      return {...x, erledigt: true, erledigtBei: x.faellig != null ? x.faellig : jetzt};
    })});
  };
  const ereignisWiederOeffnen = (e) => saveChronik({...chronik,
    ereignisse: (chronik.ereignisse||[]).map(x => x.id===e.id ? {...x, erledigt:false} : x)});
  const uhrStellen = (stunde) => saveChronik({...chronik,
    zeit: {...(chronik.zeit||{}), [advId]: Math.max(0, stunde)}});

  // Die Uhr weiterdrehen. Faellige Ereignisse werden abgelegt oder — wenn
  // sie sich wiederholen — auf den naechsten Termin gesetzt. Die Merkmale
  // gehen denselben Speicherweg wie jede andere Aenderung am Bogen.
  const zeitAnwenden = (delta, feuert, bindungen) => {
    const jetzt = chronikJetzt();
    const nachher = jetzt + delta;
    const gefeuert = new Set(feuert.map(e => e.id));
    const ereignisse = (chronik.ereignisse||[]).map(e => {
      if (!gefeuert.has(e.id)) return e;
      if (e.wiederholung > 0 && e.faellig != null) {
        let f = e.faellig;
        while (f <= nachher) f += e.wiederholung;
        return {...e, faellig: f};
      }
      return {...e, erledigt: true, erledigtBei: e.faellig};
    });
    saveChronik({...chronik, zeit: {...(chronik.zeit||{}), [advId]: nachher}, ereignisse});

    if (bindungen && bindungen.length) {
      save(charsRef.current.map(c => {
        const treffer = bindungen.filter(b => b.charId === c.id);
        if (!treffer.length) return c;
        return {...c, features: (c.features||[]).map(f => {
          const b = treffer.find(x => x.featureId === f.id);
          return b ? {...f, effectsActive: b.wirkung === 'an'} : f;
        })};
      }));
      // Im Abenteuerlog nachvollziehbar: es sind fremde Boegen.
      bindungen.forEach(b => addLog(b.charId, b.charName, 'attribute',
        'Merkmal ' + (b.wirkung === 'an' ? 'eingeschaltet' : 'abgeschaltet') + ': ' + b.featureName,
        {ereignis: b.ereignis || undefined, tag: uhrTag(nachher)}));
    }
  };

  const saveDmLibrary = (lib) => {
    setDmLibrary(lib);
    const {url, code, pass} = serverCreds();
    if (!url || !code || !pass || !dmPassRef.current) return;
    apiDmSaveLibrary(url, code, pass, dmPassRef.current, lib).catch(()=>{});
  };

  const save = (u) => {
    const prev = charsRef.current;
    applyChars(u);

    const prevMap = new Map(prev.map(c => [c.id, c]));
    const newMap  = new Map(u.map(c => [c.id, c]));

    for (const [charId, c] of newMap) {
      const prevC = prevMap.get(charId);
      // Diff inventory separately
      const prevInv = new Map((prevC?.inventory||[]).map(i => [i.id, i]));
      const newInv  = new Map((c.inventory||[]).map(i => [i.id, i]));
      for (const [itemId, item] of newInv) {
        if (JSON.stringify(item) !== JSON.stringify(prevInv.get(itemId))) {
          pendingItems.current[charId+'__'+itemId] = {charId, itemId, item};
          pendingItemDel.current.delete(charId+'__'+itemId);
        }
      }
      for (const [itemId] of prevInv) {
        if (!newInv.has(itemId)) {
          pendingItemDel.current.add(charId+'__'+itemId);
          delete pendingItems.current[charId+'__'+itemId];
        }
      }
      // Diff char without inventory
      const cNoInv = {...c, inventory:[]};
      const prevNoInv = prevC ? {...prevC, inventory:[]} : null;
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
    spiegleChars(JSON.stringify(u));
    merkeWarteschlange();
    setSyncStatus('busy'); setSyncMsg('Speichert...');
  };

  // Aendert den ausgewaehlten Helden. fn bekommt ihn und liefert die Felder,
  // die sich aendern sollen. Ersetzt 35 gleichlautende Aufrufe, in denen
  // charsRef und selRef jedes Mal von Hand ausgeschrieben waren — und damit
  // 35 Gelegenheiten, versehentlich den veralteten Zustand statt der Referenz
  // zu lesen. Genau daran hing der Datenverlust-Fehler.
  const patchCurrent = fn => save(charsRef.current.map(c =>
    c.id === selRef.current ? {...c, ...fn(c)} : c));

  // Logging helper — fire-and-forget, never blocks UI
  const addLog = (charId, charName, tab, action, details) => {
    const {url, code, pass} = serverCreds();
    if (!url || !code || !pass) return;
    const entry = { char_id: charId, char_name: charName, tab, action, details };
    apiSaveLog(url, code, pass, entry).catch(()=>{});
  };

  const applySetup = async () => {
    const { url, code, pass, dmPass: regDmPass } = setupForm;
    if (!url.trim()||!code.trim()||!pass.trim()) { setSetupErr('Bitte alle Felder ausfüllen.'); return; }
    if (pass.length < 6) { setSetupErr('Passwort mindestens 6 Zeichen.'); return; }
    setSetupBusy(true); setSetupErr('');
    try {
      if (setupMode === 'register') await registerGroup(url, code.toUpperCase(), pass, regDmPass||'');
      const data = await apiLoad(url, code.toUpperCase(), pass);
      pollToken.current = data.poll_token || null;
      revRef.current    = data.rev != null ? data.rev : null;
      localStorage.setItem('sv_url',  url);
      localStorage.setItem('sv_code', code.toUpperCase());
      localStorage.setItem('sv_pass', pass);
      setSvUrl(url); setSvCode(code.toUpperCase()); setSvPass(pass);
      applyChars(data.chars || []);
      pendingRef.current = false;
      spiegleChars(JSON.stringify(data.chars || []));
      if (data.library) { setUserLibrary(data.library); setLibGeladen(true); safeSetItem('hb_library', JSON.stringify(data.library)); }
      if (data.has_dm) setHasDmMode(true);
      setSyncStatus('ok'); setSyncMsg('Verbunden ✓');
      setShowSetup(false);
    } catch(e) { setSetupErr(e.message); }
    setSetupBusy(false);
  };

  const signOut = () => {
    // Abmelden mit offenen Aenderungen hiesse, sie wegzuwerfen: die
    // Zugangsdaten waeren weg, und ohne sie kommt die Warteschlange
    // nirgends mehr an.
    if (pendingRef.current) {
      const n = zaehleOffen();
      appAlert('Es ' + (n===1 ? 'wartet noch eine Änderung' : 'warten noch ' + n + ' Änderungen')
        + ' auf den Server. Warte, bis oben „Gespeichert ✓“ steht, sonst '
        + (n===1 ? 'geht sie' : 'gehen sie') + ' verloren.');
      return;
    }
    appConfirm('Von der Gruppe abmelden? Die Charaktere bleiben auf dem Server.', () => {
      ['sv_url','sv_code','sv_pass'].forEach(k=>localStorage.removeItem(k));
      // Die lokale Kopie geht mit: sonst bliebe ein Stand liegen, der zu
      // keiner Gruppe mehr gehoert.
      localStorage.removeItem('dnd_chars');
      localStorage.removeItem(WARTESCHLANGE);
      localStorage.removeItem(ANSICHT);
      applyChars([]);
      setSvUrl(''); setSvCode(''); setSvPass('');
      setSyncStatus('idle'); setSyncMsg(''); setOffeneAenderungen(0);
      setSetupForm({url:'',code:'',pass:''});
      setShowSetup(true);
    }, 'Abmelden');
  };

  const cur = chars.find(c=>c.id===sel);
  // ── Abenteuer ───────────────────────────────────────────────────
  // Steht vor allem, was Farben, Klassen oder Trefferpunkte braucht: die
  // Einstellungen des offenen Abenteuers gehen in beides ein.
  const abenteuer = advListe(userLibrary);
  const advId = abenteuer.some(a => a.id === advAktiv) ? advAktiv : (abenteuer[0] ? abenteuer[0].id : '');
  const advName = (abenteuer.find(a => a.id === advId) || {}).name || 'Abenteuer';
  const advObj  = abenteuer.find(a => a.id === advId) || null;
  // Welche Klassen dieses Abenteuer kennt — ohne eigene Liste die zwoelf
  // des Regelwerks.
  const klassen = advKlassen(advObj);
  // Ob dieser Bogen seine Trefferpunkte als Zahl zeigen darf.
  const tpOffen = tpSichtbar(advObj, isDmMode, libGeladen);
  // Steht am Chronik-Knopf, damit die Leiste zugeklappt bleiben darf, ohne
  // dass eine abgelaufene Frist unbemerkt liegen bleibt.
  const chronikFaellig = !isDmMode ? 0 : ereignisseDerUhr(chronik, advId)
    .filter(e => !e.erledigt && e.faellig != null && e.faellig <= zeitDerUhr(chronik, advId)).length;

  // Eine Auswahlliste, die den bereits eingetragenen Wert immer enthaelt.
  const klassenWahl = (aktuell) => {
    const namen = klassen.map(k => k.name);
    return aktuell && !namen.includes(aktuell) ? [aktuell, ...namen] : namen;
  };
  const cc  = klassenStil((cur && cur.charClass) || 'Kämpfer', klassen);

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
    const aus = [], gesehen = new Set();
    [...(userLibrary.set||[]), ...(isDmMode ? (dmLibrary.set||[]) : [])].forEach(s => {
      if (s && s.name && !gesehen.has(s.name)) { gesehen.add(s.name); aus.push(s); }
    });
    return aus;
  })();
  const itemFx = collectEffects(cur, setDefs);
  const gearSetList = gearSets(cur, setDefs);
  const fxOn   = t => itemFx.some(e => e.target === t);
  const fx     = (t, base) => applyEffect(itemFx, t, base);
  const fxTitle = (t) => {
    const rel = effectsFor(itemFx, t);
    if (!rel.length) return undefined;
    return rel.map(e => `${e.source}: ${EFFECT_LABELS[e.target]} ${effectText(e)}`).join('\n');
  };
  const effCur = cur ? {
    ...cur,
    str: fx('str', cur.str), dex: fx('dex', cur.dex), con: fx('con', cur.con),
    int: fx('int', cur.int), wis: fx('wis', cur.wis), cha: fx('cha', cur.cha),
    maxHp:     fx('maxHp',     cur.maxHp) + (+cur.tempMaxHp || 0),
    speed:     fx('speed',     cur.speed),
    profBonus: fx('profBonus', cur.profBonus),
  } : null;
  // Initiative wird im Bogen als Attributswert gefuehrt und erst bei der
  // Anzeige in einen Modifikator umgerechnet — ein Initiative-Effekt wirkt
  // deshalb auf den fertigen Modifikator, nicht auf den Wert.
  const initTotal = cur ? fx('initiative', mod(cur.initiative || effCur.dex)) : 0;

  // Trefferbonus und Schaden einer Waffe. Stand wortgleich zweimal im Code —
  // einmal fuer die Waffenkarte, einmal fuer die Detailansicht; eine Regel
  // haette man dort kuenftig zweimal aendern muessen. "fin" waehlt das
  // guenstigere der beiden Attribute (Finesse).
  const weaponStats = (w) => {
    const aKey = w.attrKey === "fin"
      ? (mod(effCur.str) >= mod(effCur.dex) ? "str" : "dex")
      : (w.attrKey || "str");
    const attrMod  = mod(effCur[aKey] || 10);
    const bonus    = fx('attack', (w.proficient ? effCur.profBonus : 0) + attrMod + (w.attackBonus||0));
    const dmgBonus = fx('damage', attrMod + (w.attackBonus||0));
    const dmgStr   = w.damage + (dmgBonus!==0 ? (dmgBonus>0 ? " + "+dmgBonus : " - "+Math.abs(dmgBonus)) : "");
    return { aKey, attrMod, bonus, dmgBonus, dmgStr };
  };

  // Dieselbe Auswahl wie die Liste "Aktiv" in der Seitenleiste, damit der
  // Wechsel im Kopf keine Helden anbietet, die dort ausgeblendet sind.
  const advWechseln = (id) => {
    setAdvAktiv(id);
    try { localStorage.setItem('hb_adventure', id); } catch {}
    // Der offene Held gehoert zum alten Abenteuer und wuerde sonst
    // weiterhin rechts stehen, waehrend links seine Gruppe fehlt.
    selectChar(null); setMv('list'); setAdvMenuOffen(false);
  };
  // Alles, was zum offenen Abenteuer gehoert. Ein Held ohne Zuordnung
  // taucht im ersten Abenteuer auf, damit nichts unsichtbar wird.
  const imAbenteuer = (c) => !advId || (c.adventure || (abenteuer[0]||{}).id) === advId;
  const advChars = chars.filter(imAbenteuer);
  const advSpeichern = (liste) => saveLibrary({...userLibrary, _adventures: liste});

  const switchList = advChars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode));
  const switchIndex = switchList.findIndex(c => c.id === sel);

  // Der Neue gehoert in das Abenteuer, das gerade offen ist — sonst
  // legte man ihn an und faende ihn nicht wieder.
  // Die Vorgabe kommt aus dem Abenteuer: hat es "Kaempfer" gestrichen,
  // soll der neue Held nicht damit anfangen.
  const openNew  = () => {
    const erste = (klassen[0] || {}).name;
    setEc({...newChar(), adventure: advId, ...(erste ? {charClass: erste} : {})});
    setShowCF(true);
  };
  const openEdit = () => { setEc({...cur}); setShowCF(true); };

  const saveChar = () => {
    if (!ec.name.trim()) return;
    const exists = charsRef.current.find(c=>c.id===ec.id);
    save(exists ? charsRef.current.map(c=>c.id===ec.id?ec:c) : [...charsRef.current,ec]);
    if (exists) {
      const prev = charsRef.current.find(c=>c.id===ec.id);
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
      addLog(ec.id, ec.name, 'charakter', 'Charakter bearbeitet',
        Object.keys(charChanges).length > 0 ? charChanges : {klasse:ec.charClass,stufe:ec.level});
    } else {
      addLog(ec.id, ec.name, 'charakter', 'Charakter erstellt',
        {klasse:ec.charClass, stufe:ec.level, rasse:ec.race});
    }
    selectChar(ec.id); setShowCF(false);
  };
  const deleteChar = () => {
    if (!confirm(cur.name+" wirklich löschen?")) return;
    save(charsRef.current.filter(c=>c.id!==selRef.current)); selectChar(null); setMv("list");
  };
  const addWeapon = () => {
    if (!wf.name.trim()) return;
    const cur2 = charsRef.current.find(c=>c.id===selRef.current);
    if (wfEditId) {
      patchCurrent(c=>({weapons:c.weapons.map(w=>w.id===wfEditId?{...wf,id:wfEditId}:w)}));
      addLog(selRef.current, cur2?.name, 'waffen', `Waffe bearbeitet: ${wf.name}`, {schaden:wf.damage});
    } else {
      patchCurrent(c=>({weapons:[...c.weapons,{...wf,id:Date.now().toString()}]}));
      addLog(selRef.current, cur2?.name, 'waffen', `Waffe hinzugefügt: ${wf.name}`, {schaden:wf.damage});
    }
    setWf(newWeapon()); setWfEditId(null); setShowWF(false);
  };
  const delWeapon = id => appConfirm("Waffe wirklich löschen?", () => patchCurrent(c=>({weapons:c.weapons.filter(w=>w.id!==id)})));
  const toggleEquipped = id => patchCurrent(c=>({weapons:c.weapons.map(w=>w.id===id?{...w,equipped:!w.equipped}:w)}));
  const addSpell = () => {
    if (!sf.name.trim()) return;
    const curSel = selRef.current;
    const curChars = charsRef.current;
    if (sfEditId) {
      save(curChars.map(c=>c.id===curSel?{...c,spells:c.spells.map(s=>s.id===sfEditId?{...sf,id:sfEditId}:s)}:c));
    } else {
      save(curChars.map(c=>c.id===curSel?{...c,spells:[...c.spells,{...sf,id:Date.now().toString()}]}:c));
    }
    const cur2 = charsRef.current.find(c=>c.id===selRef.current);
    if (sfEditId) addLog(selRef.current, cur2?.name, 'zauber', `Zauber bearbeitet: ${sf.name}`, {grad:sf.level,schule:sf.school});
    else addLog(selRef.current, cur2?.name, 'zauber', `Zauber hinzugefügt: ${sf.name}`, {grad:sf.level,schule:sf.school});
    setSf(newSpell()); setSfEditId(null); setShowSF(false);
  };
  const delSpell = id => appConfirm("Zauber wirklich löschen?", () => {
    const cur2 = charsRef.current.find(c=>c.id===selRef.current);
    const spell = cur2?.spells?.find(s=>s.id===id);
    patchCurrent(c=>({spells:c.spells.filter(s=>s.id!==id)}));
    if (spell) addLog(selRef.current, cur2?.name, 'zauber', `Zauber gelöscht: ${spell.name}`, {grad:spell.level});
  });
  const toggleSpellPrepared = id => patchCurrent(c=>({spells:c.spells.map(s=>s.id===id?{...s,prepared:s.prepared===false?true:false}:s)}));
  const saveFeature = () => {
    if (!ff.name.trim()) return;
    const features = cur.features || [];
    let updated;
    if (ffEditId) {
      updated = features.map(f=>f.id===ffEditId?{...ff,id:ffEditId}:f);
    } else {
      updated = [...features, {...ff, id:Date.now().toString()}];
    }
    const cur2 = charsRef.current.find(c=>c.id===selRef.current);
    patchCurrent(c=>({features:updated}));
    addLog(selRef.current, cur2?.name, 'attribute', ffEditId?`Merkmal bearbeitet: ${ff.name}`:`Merkmal hinzugefügt: ${ff.name}`, {quelle:ff.source||undefined});
    setFf({name:'',source:'',description:'',effects:[],effectsActive:true}); setFfEditId(null); setShowFF(false);
  };
  const delFeature = id => appConfirm("Merkmal wirklich löschen?", () => patchCurrent(c=>({features:(c.features||[]).filter(f=>f.id!==id)})));
  // Ein Kampfstil wirkt nicht immer — ohne Rüstung greift der defensive
  // nicht. Umschalten ohne Umweg über den Bearbeiten-Dialog.
  const toggleFeatureFx = id => patchCurrent(c=>({features:(c.features||[]).map(f=>
    f.id===id ? {...f, effectsActive: f.effectsActive===false} : f)}));
  const addItem = () => {
    if (!itf.name.trim()) return;
    const cur2 = charsRef.current.find(c=>c.id===selRef.current);
    if (itfEditId) {
      patchCurrent(c=>({inventory:(c.inventory||[]).map(i=>i.id===itfEditId?{...itf,id:itfEditId}:i)}));
      addLog(selRef.current, cur2?.name, 'inventar', `Gegenstand bearbeitet: ${itf.name}`, {seltenheit:itf.rarity,menge:itf.qty});
    } else {
      patchCurrent(c=>({inventory:[...(c.inventory||[]),{...itf,id:Date.now().toString()}]}));
      addLog(selRef.current, cur2?.name, 'inventar', `Gegenstand hinzugefügt: ${itf.name}`, {seltenheit:itf.rarity,menge:itf.qty});
    }
    setItf(newItem()); setItfEditId(null); setShowIF(false);
  };
  // Einzelne Felder eines Gegenstands aendern, ohne den Bearbeiten-Dialog —
  // gebraucht fuer den Effekt-Schalter in der Detailansicht.
  const updItem = (id, patch) => patchCurrent(c=>({inventory:(c.inventory||[]).map(i=>i.id===id?{...i,...patch}:i)}));
  const delItem = id => appConfirm("Gegenstand wirklich löschen?", () => {
    const cur2 = charsRef.current.find(c=>c.id===selRef.current);
    const item = (cur2?.inventory||[]).find(i=>i.id===id);
    patchCurrent(c=>({inventory:(c.inventory||[]).filter(i=>i.id!==id)}));
    if (item) addLog(selRef.current, cur2?.name, 'inventar', `Gegenstand gelöscht: ${item.name}`, {seltenheit:item.rarity});
  });
  const doTransfer = (targetId, ids) => {
    const items = (cur.inventory||[]).filter(i=>ids.has(i.id));
    const target = charsRef.current.find(c=>c.id===targetId);
    const updated = charsRef.current.map(c => {
      if (c.id === selRef.current) return {...c, inventory:(c.inventory||[]).filter(i=>!ids.has(i.id))};
      if (c.id === targetId) return {...c, inventory:[...(c.inventory||[]),...items.map(i=>({...i,id:Date.now().toString()+Math.random().toString(36).slice(2)}))]};
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
      addLog(sel, cur?.name, 'inventar',
        `${items.length} Gegenstand${items.length!==1?'e':''} an ${target?.name||'?'} übergeben`,
        itemDetails
      );
      addLog(targetId, target?.name, 'inventar',
        `${items.length} Gegenstand${items.length!==1?'e':''} von ${cur?.name||'?'} erhalten`,
        itemDetails
      );
    }
    setTransferSel(new Set());
    setShowTransfer(false);
  };

  // Notes helpers — migrate legacy cur.notes on the fly
  const notesList = (() => {
    const list = cur && cur.notesList || [];
    if (list.length === 0 && cur && cur.notes) return [{id:'legacy',title:'Notizen',content:cur.notes}];
    return list;
  })();
  const saveNote = () => {
    if (!nf.title.trim() && !nf.content.trim()) return;
    const title = nf.title.trim() || 'Notiz';
    const entry = {...nf, title};
    let updated;
    if (nfEditId) {
      updated = notesList.map(n=>n.id===nfEditId?{...entry,id:nfEditId}:n);
    } else {
      updated = [...notesList,{...entry,id:Date.now().toString()}];
    }
    patchCurrent(c=>({notesList:updated,notes:''}));
    setNf({title:'',content:'',tags:[]}); setNfEditId(null); setShowNF(false);
  };
  const delNote = id => {
    appConfirm("Notiz wirklich löschen?", () => {
      const updated = notesList.filter(n=>n.id!==id);
      patchCurrent(c=>({notesList:updated,notes:''}));
    });
  };
  const updCurrency = (k,v) => patchCurrent(c=>({currency:{...(c.currency||{}), [k]:Math.max(0,+v||0)}}));
  const toggleSkill = key => {
    const profs = cur.skillProfs||[];
    const exp   = cur.expertiseProfs||[];
    const isP   = profs.includes(key);
    const isE   = exp.includes(key);
    // Cycle: none → prof → expertise → none
    if (!isP && !isE) {
      patchCurrent(c=>({skillProfs:[...profs,key]}));
    } else if (isP && !isE) {
      patchCurrent(c=>({expertiseProfs:[...exp,key]}));
    } else {
      patchCurrent(c=>({skillProfs:profs.filter(x=>x!==key),expertiseProfs:exp.filter(x=>x!==key)}));
    }
  };
  const toggleJoAT = () => patchCurrent(c=>({jackOfAllTrades:!c.jackOfAllTrades}));
  const toggleSave = attr => {
    const p = cur.savingThrowProfs||[];
    patchCurrent(c=>({savingThrowProfs:p.includes(attr)?p.filter(x=>x!==attr):[...p,attr]}));
  };

  const slots    = cur && cur.spellSlots || {1:{max:0,used:0},2:{max:0,used:0},3:{max:0,used:0},4:{max:0,used:0},5:{max:0,used:0},6:{max:0,used:0},7:{max:0,used:0},8:{max:0,used:0},9:{max:0,used:0}};
  const updSlots = s => patchCurrent(c=>({spellSlots:s}));
  const togSlot  = (l,i) => { const s=slots[l]; const avail=s.max-s.used; updSlots({...slots,[l]:{...s,used:i<avail?s.max-i:s.max-(i+1)}}); };
  const chgMax   = (l,d) => { const s=slots[l]; const m=Math.max(0,Math.min(9,s.max+d)); updSlots({...slots,[l]:{max:m,used:Math.min(s.used,m)}}); };
  const resetAll = () => { const r={}; for(let i=1;i<=9;i++) r[i]={...slots[i],used:0}; updSlots(r); };

  const sp = cur && cur.sorceryPoints || {max:0, used:0};
  const updSP = s => patchCurrent(c=>({sorceryPoints:s}));
  const togSP = i => { const avail=sp.max-sp.used; updSP({...sp, used: i < avail ? sp.max-i : sp.max-(i+1) }); };
  const spChgMax = d => { const m=Math.max(0,Math.min(20,sp.max+d)); updSP({max:m,used:Math.min(sp.used,m)}); };

  // Local input buffers – prevent focus loss on direct-save inputs
  const [localInputs, setLocalInputs] = useState({});
  const localVal = (key, fallback) => key in localInputs ? localInputs[key] : fallback;
  const setLocal  = (key, val)       => setLocalInputs(prev => ({...prev, [key]: val}));
  const clearLocal= (key)            => setLocalInputs(prev => { const n={...prev}; delete n[key]; return n; });

  const resources = cur && cur.resources || [];
  const updResources = r => patchCurrent(c=>({resources:r}));

  // ── Inspiration ──────────────────────────────────────────────────
  // Anders als die frei angelegten Ressourcen hat sie jeder Held, deshalb
  // steht sie fest im Bogen. Aeltere Charaktere haben die Felder noch nicht,
  // daher die Ersatzwerte. Sie wird beim Rasten ausdruecklich nicht
  // zurueckgesetzt — sie bleibt, bis man sie einsetzt.
  const inspMax = Math.max(1, Math.min(10, +(cur && cur.inspirationMax) || 1));
  const insp    = Math.max(0, Math.min(inspMax, +(cur && cur.inspiration) || 0));
  const setInsp = (n) => {
    const v = Math.max(0, Math.min(inspMax, n));
    if (v === insp) return;
    patchCurrent(() => ({inspiration: v}));
    addLog(selRef.current, cur && cur.name, 'charakter',
      v > insp ? 'Inspiration erhalten' : 'Inspiration eingesetzt',
      {stand: v + '/' + inspMax});
  };
  const setInspMax = (n) => {
    const m = Math.max(1, Math.min(10, n));
    patchCurrent(c => ({inspirationMax: m, inspiration: Math.min(+c.inspiration || 0, m)}));
  };
  const patchChar = patch => patchCurrent(c=>({...patch}));
  const addResource = () => updResources([...resources,{id:Date.now().toString(),name:"Neue Ressource",max:3,used:0,color:"#c9a84c",restType:"lang"}]);

  // ── Ausruestungsplaetze ─────────────────────────────────────────
  const gearWornList = gearWorn(cur);
  const nhGesperrt   = nebenhandGesperrt(cur);
  // Legt einen Gegenstand oder eine Waffe in einen Platz — oder raeumt ihn
  // mit obj=null. Alles in einem Zug, damit die Regeln nicht in einem
  // Zwischenzustand verletzt sind: dasselbe Stueck liegt nie in zwei
  // Plaetzen, und ein Zweihaender raeumt die Nebenhand.
  const setGearSlot = (slotKey, k, id) => patchCurrent(c => {
    const gear = {...(c.gear||{})};
    if (!id) delete gear[slotKey];
    else {
      Object.keys(gear).forEach(s => { const g=gear[s]; if (g && g.k===k && g.id===id) delete gear[s]; });
      gear[slotKey] = {k, id};
    }
    if (slotKey === 'haupthand') {
      const w = id && k==='w' ? (c.weapons||[]).find(x=>x.id===id) : null;
      if (isZweihand(w)) delete gear.nebenhand;
    }
    // equipped der Waffen aus den Haenden ableiten: die Waffenkarten im
    // Aktionen-Reiter lesen dieses Kennzeichen und sollen dasselbe sagen.
    const inHand = new Set(Object.values(gear).filter(g=>g.k==='w').map(g=>g.id));
    const weapons = (c.weapons||[]).map(w => !!w.equipped === inHand.has(w.id) ? w : {...w, equipped: inHand.has(w.id)});
    return {gear, weapons};
  });

  // Legt ein Stueck aus einer Vorlage an und steckt es sofort in seinen
  // Platz. Ohne das waeren es fuer ein Kettenhemd sechs Schritte: Gegenstand
  // anlegen, benennen, Platz waehlen, Art waehlen, speichern, anlegen.
  const gearAusVorlage = (slotKey, tpl) => patchCurrent(c => {
    const id = 'tpl_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5);
    const item = {...newItem(), id, name: tpl.name, gearKind: tpl.art,
      armorType: tpl.armorType, baseAC: tpl.baseAC, icon: tpl.icon || '🛡️'};
    return {inventory: [...(c.inventory||[]), item], gear: {...(c.gear||{}), [slotKey]: {k:'i', id}}};
  });

  // Nur echte Ruestung zaehlt als Grundwert: ein Stueck ohne Ruestungsart
  // oder ohne Basiswert im Ruestungsplatz wuerde sonst die 10 der
  // unbewaffneten RK durch 0 ersetzen.
  const gearArmor = (() => {
    const r = cur && cur.gearMigrated ? gearAt(cur,'ruestung') : null;
    return (r && r.armorType && r.armorType!=='shield' && +r.baseAC > 0) ? r : null;
  })();
  const gearShield = (() => {
    if (!cur || !cur.gearMigrated || nhGesperrt) return null;
    const nh = gearAt(cur,'nebenhand');
    return (nh && nh.armorType === 'shield') ? nh : null;
  })();
  const computedAC = (() => {
    if (!cur) return null;
    const dex = mod(effCur.dex);
    // Seit die Talent-Boni Merkmale sind, kommen sie ueber fx('ac') herein.
    // Bis ein Held dort angekommen ist, zaehlt weiter die alte Liste.
    const activeAbBonuses = (cur.gearMigrated||0) >= 3 ? 0
      : (cur.acBonuses||[]).filter(b=>b.active).reduce((s,b)=>s+(+b.bonus||0), 0);
    if (cur.gearMigrated) {
      const itemBonuses = gearWornList.reduce((s,{obj})=>s+(+obj.acBonus||0), 0);
      const shBonus = gearShield ? (+gearShield.baseAC || 2) : 0;
      if (!gearArmor) {
        if (shBonus===0 && activeAbBonuses===0 && itemBonuses===0 && !fxOn('ac')) return null;
        return fx('ac', 10 + dex + shBonus + activeAbBonuses + itemBonuses);
      }
      const t = gearArmor.armorType;
      const basis = +gearArmor.baseAC || 0;
      const ac = t==='heavy' ? basis : t==='medium' ? basis + Math.min(2, dex) : basis + dex;
      return fx('ac', ac + shBonus + activeAbBonuses + itemBonuses);
    }
    // Vor der Umstellung unveraendert aus der alten Ausruestungsliste. Der
    // Zweig lebt nur noch fuer die Augenblicke zwischen Laden und
    // Umstellung — die Oberflaeche dazu ist weg, die Daten sind es nicht.
    const equipment = cur.equipment || [];
    const equippedArmors  = equipment.filter(e=>e.equipped && e.type!=="shield" && e.type!=="other");
    const equippedShields = equipment.filter(e=>e.equipped && e.type==="shield");
    const itemBonuses = equipment.filter(e=>e.equipped && (e.acBonus||0)!==0).reduce((s,e)=>s+(+e.acBonus||0), 0);
    if (equippedArmors.length === 0) {
      // Ohne Rüstung nur rechnen, wenn ueberhaupt etwas beitraegt — ein
      // RK-Effekt zaehlt dabei mit.
      const shBonus = equippedShields.reduce((s,sh)=>s+(sh.baseAC||2), 0);
      if (shBonus===0 && activeAbBonuses===0 && itemBonuses===0 && !fxOn('ac')) return null;
      return fx('ac', 10 + dex + shBonus + activeAbBonuses + itemBonuses);
    }
    const a = equippedArmors[0];
    let ac = a.type==="heavy" ? a.baseAC
           : a.type==="medium" ? a.baseAC + Math.min(2, dex)
           : a.baseAC + dex; // light or other
    ac += equippedShields.reduce((s,sh)=>s+(sh.baseAC||2), 0);
    ac += activeAbBonuses + itemBonuses;
    return fx('ac', ac);
  })();
  const displayAC = computedAC !== null ? computedAC : (cur ? cur.ac : 10);

    const languages  = cur && cur.languages  || [];
  const toolProfs  = cur && cur.toolProfs  || [];
  const weaponProfs = cur && cur.weaponProfs || [];
  const addLanguage  = (val) => { if(!val.trim()) return; patchCurrent(c=>({languages:[...(c.languages||[]),val.trim()]})); };
  const delLanguage  = (i)   => patchCurrent(c=>({languages:(c.languages||[]).filter((_,j)=>j!==i)}));
  const addToolProf  = (val) => { if(!val.trim()) return; patchCurrent(c=>({toolProfs:[...(c.toolProfs||[]),val.trim()]})); };
  const delToolProf  = (i)   => patchCurrent(c=>({toolProfs:(c.toolProfs||[]).filter((_,j)=>j!==i)}));
  const addWeaponProf = (val) => { if(!val.trim()) return; patchCurrent(c=>({weaponProfs:[...(c.weaponProfs||[]),val.trim()]})); };
  const delWeaponProf = (i)   => patchCurrent(c=>({weaponProfs:(c.weaponProfs||[]).filter((_,j)=>j!==i)}));
  const armorProfs  = cur && cur.armorProfs  || [];
  const addArmorProf  = (val) => { if(!val.trim()) return; patchCurrent(c=>({armorProfs:[...(c.armorProfs||[]),val.trim()]})); };
  const delArmorProf  = (i)   => patchCurrent(c=>({armorProfs:(c.armorProfs||[]).filter((_,j)=>j!==i)}));
  const delResource = id => appConfirm("Ressource wirklich löschen?", () => updResources(resources.filter(r=>r.id!==id)));
  const updResource = (id,patch) => updResources(resources.map(r=>r.id===id?{...r,...patch}:r));
  const togResourcePip = (id,i) => {
    const r = resources.find(x=>x.id===id);
    const avail = r.max - r.used;
    updResource(id, {used: i < avail ? r.max-i : r.max-(i+1) });
  };

  // Die Vorlagen lagen bis hierher in einer data.json von 448 KB, die beim
  // Oeffnen jeder Vorlagenauswahl komplett geladen wurde — wer eine Waffe
  // suchte (3 KB), holte sich alle 484 Zauber (409 KB) mit. Jetzt liegt jede
  // Art in einer eigenen Datei und wird einzeln und nur einmal geladen.
  const TPL_QUELLEN = {
    spell:     ['spells',     'data-spells.json'],
    weapon:    ['weapons',    'data-weapons.json'],
    wildshape: ['wildshapes', 'data-wildshapes.json'],
  };
  const ladeVorlagen = async (type) => {
    const eintrag = TPL_QUELLEN[type];
    if (!eintrag) return true;
    const [key, datei] = eintrag;
    if (tplData && tplData[key]) return true;      // schon geladen
    try {
      const r = await fetch(datei);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      setTplData(prev => ({...(prev || {}), [key]: d[key] || []}));
      return true;
    } catch (e) {
      appAlert(datei + ' konnte nicht geladen werden. Liegt die Datei im selben Ordner wie index.html?');
      return false;
    }
  };
  const openTpl = async (type) => {
    setTplSearch(''); setTplFilter('all'); setWsFilter({cr:'all',tag:'all'}); setWsExpand(null); setTplClassFilter([]); setTplDmgFilter([]);
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
  }, [sel, (cur && (cur.wsFavorites || []).length) || 0, !!(tplData && tplData.wildshapes)]);
  const pickSpell = s => {
    setSf({...newSpell(), name:s.name, level:s.level, school:s.school, castingTime:s.castingTime, range:s.range, duration:s.duration, components:s.components||'V, S', description:s.description, classes:s.classes||[], damageTags:s.damageTags||[]});
    setShowTpl(null); setShowSF(true);
  };
  const pickWeapon = w => {
    // Bibliothekseintraege koennen ein Bild mitbringen — das uebernehmen wir.
    setWf({...newWeapon(), name:w.name, damage:w.damage, damageType:w.damageType, range:w.range||"1,5m", description:w.description||"", properties:w.properties||[], imageData:w.imageData||""}); setWfEditId(null);
    setShowTpl(null); setShowWF(true);
  };
  const goChar = id => { selectChar(id); setTab("stats"); setMv("sheet"); setTransferMode(false); setTransferSel(new Set()); };
  const archiveChar   = () => {
    patchCurrent(c=>({archived:true}));
    selectChar(null); setMv("list");
  };
  const unarchiveChar = id => save(charsRef.current.map(c=>c.id===id?{...c,archived:false}:c));

  // ── AdventureLog component (extracted to avoid hooks-in-IIFE error) ─────
  const AdventureLog = ({onClose, isDmMode}) => {
    const fmt = ts => new Date(ts.replace(' ','T')+'Z').toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const tabColor = t => ({'zauber':'#c060a0','inventar':'#e0a030','waffen':'#c84040','charakter':'var(--gold)'}[t]||'var(--border-bright)');
    const TAB_ICONS2 = LOG_TAB_ICONS;   // wortgleiche Kopie, jetzt nur noch ein Ort
    const TABS2 = ['charakter','zauber','inventar','waffen','attribute','rüst','notizen'];
    const dmCharIds = new Set(JSON.parse(localStorage.getItem('dnd_chars')||'[]').filter(c=>c.dmOnly===true).map(c=>c.id));

    const [alEntries,     setAlEntries]     = useState([]);
    const [alLoading,     setAlLoading]     = useState(false);
    const [alHasMore,     setAlHasMore]     = useState(true);
    const [alSearchInput, setAlSearchInput] = useState('');
    const [alTabs,        setAlTabs]        = useState([]);    // include filter
    const [alExclude,     setAlExclude]     = useState([]);    // exclude filter
    const scrollRef    = useRef(null);
    const searchTimer  = useRef(null);
    const alTabsRef    = useRef([]);
    const alExcludeRef = useRef([]);
    const alSearchRef  = useRef('');

    const fetchPage = (offset, search, tabs, reset) => {
      const {url, code, pass} = serverCreds();
      if (!url||!code||!pass) return;
      setAlLoading(true);
      apiLoadLogs(url,code,pass,null,{limit:50,offset,search,tabFilter:tabs})
        .then(d => {
          const excl = alExcludeRef.current;
          const logs = (d.logs||[]).filter(e =>
            (isDmMode || !dmCharIds.has(e.char_id)) &&
            (excl.length===0 || !excl.includes(e.tab))
          );
          setAlEntries(prev => reset ? logs : [...prev, ...logs]);
          setAlHasMore(!!d.has_more);
          setAlLoading(false);
        })
        .catch(()=>setAlLoading(false));
    };

    useEffect(()=>{ fetchPage(0,'',[], true); }, []);

    const handleSearch = (val) => {
      setAlSearchInput(val);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(()=>{
        alSearchRef.current = val;
        fetchPage(0, val, alTabsRef.current, true);
      }, 400);
    };

    const handleTabClick = (t) => {
      const inc = alTabsRef.current.includes(t);
      const exc = alExcludeRef.current.includes(t);
      if (!inc && !exc) {
        // off → include
        alTabsRef.current = [...alTabsRef.current, t];
        setAlTabs([...alTabsRef.current]);
        fetchPage(0, alSearchRef.current, alTabsRef.current, true);
      } else if (inc) {
        // include → exclude
        alTabsRef.current = alTabsRef.current.filter(x=>x!==t);
        setAlTabs([...alTabsRef.current]);
        alExcludeRef.current = [...alExcludeRef.current, t];
        setAlExclude([...alExcludeRef.current]);
        fetchPage(0, alSearchRef.current, alTabsRef.current, true);
      } else {
        // exclude → off
        alExcludeRef.current = alExcludeRef.current.filter(x=>x!==t);
        setAlExclude([...alExcludeRef.current]);
        fetchPage(0, alSearchRef.current, alTabsRef.current, true);
      }
    };

    const loadMore = () => {
      if (!alLoading && alHasMore)
        fetchPage(alEntries.length, alSearchRef.current, alTabsRef.current, false);
    };

    return (
      <div className="form-overlay">
        <div className="form-modal" style={{maxWidth:640,height:'85vh',display:'flex',flexDirection:'column',padding:0,overflow:'hidden'}}>
          <div style={{padding:'14px 18px 10px',borderBottom:'1px solid var(--border)',flexShrink:0,background:'var(--bg-deep)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div className="form-title" style={{margin:0,flex:1}}>📖 Abenteuerlog</div>
              <button className="btn-cancel" onClick={onClose}>✕</button>
            </div>
            <input className="form-input" style={{marginBottom:8,padding:'6px 10px',fontSize:12}}
              placeholder="Suchen..." value={alSearchInput} onChange={e=>handleSearch(e.target.value)} />
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {TABS2.map(t=>{
                const inc = alTabs.includes(t);
                const exc = alExclude.includes(t);
                return (
                  <button key={t} onClick={()=>handleTabClick(t)}
                    title={inc?'Klicken zum Ausschließen':exc?'Klicken zum Zurücksetzen':'Klicken zum Einschließen'}
                    style={{padding:'3px 8px',borderRadius:12,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',
                      textTransform:'uppercase',letterSpacing:'0.05em',border:'1px solid',
                      background:inc?'var(--gold)':exc?'rgba(200,60,60,0.25)':'var(--bg-card)',
                      borderColor:inc?'var(--gold)':exc?'#c83c3c':'var(--border)',
                      color:inc?'var(--bg-deep)':exc?'#e07070':'var(--text-muted)',
                      textDecoration:exc?'line-through':'none'}}>
                    {(TAB_ICONS2[t]||'📌')+' '+t}
                  </button>
                );
              })}
            </div>
          </div>
          <div ref={scrollRef} style={{flex:1,overflowY:'auto',padding:'10px 14px'}}
            onScroll={e=>{const el=e.target; if(el.scrollHeight-el.scrollTop-el.clientHeight<120) loadMore();}}>
            {alEntries.length===0 && !alLoading && <div style={{color:'var(--text-muted)',fontStyle:'italic',fontSize:13,marginTop:20,textAlign:'center'}}>Keine Einträge gefunden.</div>}
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              {alEntries.map((e,i)=>(
                <div key={e.id||i} style={{display:'flex',gap:8,padding:'7px 10px',background:'var(--bg-card)',borderRadius:4,
                  borderLeft:'3px solid '+tabColor(e.tab),alignItems:'flex-start'}}>
                  <div style={{fontSize:13,flexShrink:0}}>{TAB_ICONS2[e.tab]||'📌'}</div>
                  <div style={{flex:1,minWidth:0}}>
                    {e.char_name && <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--gold-dim)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{e.char_name}</div>}
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-primary)',lineHeight:1.3}}>{e.action}</div>
                    {e.details && Object.keys(e.details).length>0 && (
                      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>
                        {Object.entries(e.details).map(([k,v])=>k+': '+v).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',whiteSpace:'nowrap',flexShrink:0}}>{fmt(e.created_at)}</div>
                </div>
              ))}
            </div>
            {alLoading && <div style={{textAlign:'center',padding:'12px',color:'var(--text-muted)',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11}}>Lade...</div>}
            {!alLoading && alHasMore && (
              <div style={{textAlign:'center',padding:'10px'}}>
                <button onClick={loadMore}
                  style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,padding:'6px 16px',background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-muted)',borderRadius:4,cursor:'pointer'}}>
                  Mehr laden
                </button>
              </div>
            )}
            {!alHasMore && alEntries.length>0 && <div style={{textAlign:'center',padding:'10px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:'var(--text-muted)'}}>Alle {alEntries.length} Einträge geladen</div>}
          </div>
        </div>
      </div>
    );
  };

  const CharList = () => {
    const active   = advChars.filter(c=>!c.archived && (c.dmOnly !== true || isDmMode));
    const archived = advChars.filter(c=> c.archived && (c.dmOnly !== true || isDmMode));
    const q = charSearch.toLowerCase();
    const filterSearch = list => q ? list.filter(c=>(c.name||'').toLowerCase().includes(q) || (c.charClass||'').toLowerCase().includes(q) || (c.race||'').toLowerCase().includes(q)) : list;
    const list = filterSearch(showArchive ? archived : active);
    return (
      <>
        {/* Archiv-Toggle */}
        <div style={{display:"flex",gap:4,padding:"4px 8px 0",marginBottom:8}}>
          <button
            onClick={()=>setShowArchive(false)}
            style={{flex:1,padding:"5px 0",fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",
              background:!showArchive?"var(--bg-panel)":"none",border:"1px solid",
              borderColor:!showArchive?"var(--gold-dim)":"var(--border)",
              color:!showArchive?"var(--gold)":"var(--text-muted)",borderRadius:"3px 0 0 3px",cursor:"pointer"}}>
            ⚔ Aktiv {active.length>0 && <span style={{opacity:0.7}}>({active.length})</span>}
          </button>
          <button
            onClick={()=>setShowArchive(true)}
            style={{flex:1,padding:"5px 0",fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",
              background:showArchive?"var(--bg-panel)":"none",border:"1px solid",
              borderColor:showArchive?"var(--gold-dim)":"var(--border)",
              color:showArchive?"var(--gold)":"var(--text-muted)",borderRadius:"0 3px 3px 0",cursor:"pointer",marginLeft:-1}}>
            📦 Archiv {archived.length>0 && <span style={{opacity:0.7}}>({archived.length})</span>}
          </button>
        </div>

        {list.length === 0 && (
          <div style={{padding:"40px 20px",textAlign:"center",color:"var(--text-muted)"}}>
            <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>{showArchive?"📦":"⚔"}</div>
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14}}>
              {showArchive ? "Archiv ist leer" : "Noch keine Helden"}
            </div>
            <div style={{fontSize:12,marginTop:6,opacity:0.6}}>
              {showArchive ? "Archivierte Charaktere erscheinen hier" : "Erstelle deinen ersten Charakter"}
            </div>
          </div>
        )}

        {list.map(c => (
          <div key={c.id}
            className={"char-item"+(sel===c.id?" active":"")}
            onClick={()=>goChar(c.id)}
            style={{cursor:"pointer",opacity:showArchive?0.8:1,
              borderStyle:showArchive?"dashed":c.dmOnly?"dashed":"solid",
              borderColor:c.dmOnly?(sel===c.id?'#c060a0':'#c060a040'):undefined,
              display:"flex",alignItems:"center",gap:6,paddingRight:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div className="char-item-name" style={{display:"flex",alignItems:"center",gap:6}}>
                {showArchive && <span style={{fontSize:10,opacity:0.5}}>📦</span>}
                {c.dmOnly && <span title="DM-Held" style={{fontSize:10,color:'#c060a0'}}>🔮</span>}
                {c.name}
              </div>
              <div className="char-item-sub">{c.race} · {c.charClass}{(c.multiclasses||[]).length>0 ? ' / '+(c.multiclasses.map(m=>m.charClass).join(' / ')) : ''}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
              <div style={{background:"var(--bg-void)",border:"1px solid var(--border)",borderRadius:3,padding:"1px 6px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:"var(--gold-dim)",whiteSpace:"nowrap"}}>Lv {(c.level||1)+(c.multiclasses||[]).reduce((s,m)=>s+(m.level||0),0)}</div>
              {showArchive && (
                <button
                  onClick={e=>{e.stopPropagation();unarchiveChar(c.id);}}
                  style={{padding:"3px 7px",fontSize:10,fontFamily:"'Roboto Condensed',sans-serif",
                    background:"none",border:"1px solid var(--gold-dim)",borderRadius:3,
                    color:"var(--gold-dim)",cursor:"pointer",whiteSpace:"nowrap"}}
                  title="Charakter reaktivieren">
                  ↩ aktiv
                </button>
              )}
            </div>
          </div>
        ))}
      </>
    );
  };

  // Wird bei jedem Rendern neu gebaut — genau wie zuvor die
  // Closure-Variablen von Sheet.
  const sheetCtx = {
    addArmorProf, addLanguage, addLog, addResource, addToolProf,
    addWeaponProf, appAlert, appConfirm, archiveChar, armorProfs, cc,
    charMenuOpen, chars, chgMax, collapsedLevels, computedAC, cur,
    delArmorProf, deleteChar, delFeature, delItem, delLanguage, delNote,
    delResource, delSpell, delToolProf, delWeaponProf, displayAC,
    effCur, exFeature, exItem, exNote, exSpell, fx, fxOn, fxTitle,
    gearArmor, gearAusVorlage, gearPick, gearSetList, gearShield,
    gearWornList, initTotal, insp, inspMax, invRarity, invTagFilter,
    isDmMode, itemFx, klassen, languages, nhGesperrt, notesList, noteTagFilter,
    openEdit, openNew, openTpl, openUnprepared, patchChar, patchCurrent, resEdit,
    resetAll, resources, save, sel, selectChar, setCharMenuOpen,
    setCoinDelta, setCoinPopover, setCollapsedLevels, setExFeature,
    setExNote, setExSpell, setFf, setFfEditId, setGearPick, setGearSlot,
    setImgViewer, setInsp, setInspMax, setInvRarity, setInvTagFilter,
    setItemViewer, setItf, setItfEditId, setNf, setNfEditId,
    setNoteTagFilter, setOpenUnprepared, setResEdit, setSf, setSfEditId,
    setShowFF, setShowIF, setShowNF, setShowSF, setShowTransfer,
    setShowWF, setSlotsEdit, setSpEdit, setSpellTagFilter, setStatsEdit,
    setTab, setTransferMode, setTransferSel, setWeaponViewer, setWf,
    setWfEditId, setWsExpand, slots, slotsEdit, sp, spChgMax, spEdit,
    spellTagFilter, statsEdit, switchList, tab, tpOffen,
    toggleEquipped, toggleFeatureFx, toggleJoAT, toggleSave,
    toggleSkill, toggleSpellPrepared, toggleWsFav, togResourcePip,
    togSlot, togSP, toolProfs, tplData, transferMode, transferSel,
    unarchiveChar, updResource, updSP, weaponProfs, weaponStats,
    wsExpand
  };

  return (
    <SheetCtx.Provider value={sheetCtx}>
      <div className={"app"+(sidebarCollapsed?" sb-collapsed":"")}>

        {/* Steht ausserhalb der Leiste, damit er im eingeklappten Zustand
            erreichbar bleibt. Eingeklappt traegt er eine Beschriftung: ein
            blosser Pfeil sah nach Zierrat aus und wurde uebersehen. */}
        <button
          className={"sidebar-toggle"+(sidebarCollapsed?" open":"")}
          onClick={()=>setSidebarCollapsed(c=>!c)}
          title={sidebarCollapsed?"Heldenübersicht einblenden":"Heldenübersicht ausblenden"}
          aria-expanded={!sidebarCollapsed}
          style={{left: sidebarCollapsed ? 0 : 260}}
        >
          {sidebarCollapsed ? <><span className="sidebar-toggle-pfeil">▶</span><span className="sidebar-toggle-text">Helden</span></> : '◀'}
        </button>

        <div className={"sidebar"+(sidebarCollapsed?" collapsed":"")}>
          <div className="sidebar-header">
            <div className="sidebar-title">⚔ Heldenbuch ⚔</div>
            <div className="sidebar-subtitle">Dungeons &amp; Dragons · 🐉</div>
          </div>
          <div className="char-list">
            <div style={{padding:'6px 8px 0'}}>
              <input
                className="form-input"
                style={{width:'100%',padding:'5px 10px',fontSize:12,boxSizing:'border-box',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:4,color:'var(--text-primary)'}}
                placeholder="🔍 Held suchen..."
                value={charSearch}
                onChange={e=>setCharSearch(e.target.value)}
              />
            </div>
            <CharList />
          </div>
          {/* Abenteuer stehen unter der Heldenliste, nicht darueber: man
              wechselt sie selten, sucht aber staendig einen Helden. */}
          {abenteuer.length > 0 && (
            <div className="adv-leiste">
              <button className="adv-knopf" onClick={()=>setAdvMenuOffen(o=>!o)}
                title="Abenteuer wechseln" aria-expanded={advMenuOffen}>
                <span className="adv-knopf-label">Abenteuer</span>
                <span className="adv-knopf-name">{advName}</span>
                <span className="adv-knopf-caret">{advMenuOffen ? '▾' : '▸'}</span>
              </button>
              {advMenuOffen && (
                <>
                  <div style={{position:'fixed',inset:0,zIndex:29}} onClick={()=>setAdvMenuOffen(false)} />
                  <div className="adv-menu">
                    {abenteuer.map(a => {
                      const n = chars.filter(c => (c.adventure||abenteuer[0].id) === a.id && !c.archived).length;
                      return (
                        <button key={a.id} className={"adv-menu-eintrag"+(a.id===advId?" aktiv":"")}
                          onClick={()=>advWechseln(a.id)}>
                          <span className="adv-menu-name">{a.name}</span>
                          <span className="adv-menu-zahl">{n}</span>
                        </button>
                      );
                    })}
                    {/* Was hier steht, gilt fuer die ganze Gruppe — verdeckte
                        Trefferpunkte waeren keine, wenn jeder sie wieder
                        aufdecken koennte. Deshalb nur im DM-Modus. */}
                    {isDmMode && (
                      <button className="adv-menu-verwalten"
                        onClick={()=>{setAdvMenuOffen(false);
                          const a = abenteuer.find(x=>x.id===advId);
                          if (a) setAdvEinstellung({...a});}}>⚙ Einstellungen · {advName}</button>
                    )}
                    <button className="adv-menu-verwalten"
                      onClick={()=>{setAdvMenuOffen(false);setShowAdvVerwaltung(true);}}>⚙ Abenteuer verwalten</button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="sidebar-footer">
            <button className="btn-new" onClick={openNew}>✦ Neuer Charakter</button>
            <div className="sidebar-tools">
              <button className="btn-tool" onClick={()=>{setShowDB(true);setDbForm(null);setDbFormId(null);}}>📚 Datenbank</button>
              <button className="btn-tool" onClick={()=>{
                setAdventSearch(''); setAdventTabFilter([]);
                setShowAdventLog(true);
                const {url, code, pass} = serverCreds();
                if(url&&code&&pass) apiLoadLogs(url,code,pass,null,500).then(d=>setAdventEntries(d.logs||[])).catch(()=>{});
              }}>📖 Abenteuerlog</button>
              {isDmMode && (
                <button className="btn-tool" onClick={()=>setShowKampf(true)}>
                  ⚔ Kampf{kampf && kampf.aktiv ? ' · Runde ' + kampf.runde : ''}
                </button>
              )}
              {isDmMode && (
                <button className={"btn-tool"+(showChronik?" an":"")} onClick={chronikUmschalten}>
                  🕰 Chronik{chronikFaellig > 0 ? ' · ' + chronikFaellig + ' fällig' : ''}
                </button>
              )}
              <button className="btn-tool" onClick={()=>setShowAutomat(true)}>🎰 Taverne</button>
            </div>
            {svCode ? (
              <>
                <div className="sync-line">
                  <div className={"sync-dot "+(offeneAenderungen>0?"err":syncStatus==="busy"?"busy":syncStatus==="err"?"err":"ok")}/>
                  <span className="sync-line-code">{svCode}</span>
                  {/* Der Rueckstand steht vor der Statusmeldung: er ist die
                      wichtigere Aussage, wenn beides zutrifft. */}
                  <span className={"sync-line-msg"+(offeneAenderungen>0?" offen":"")}>
                    · {offeneAenderungen>0 ? offeneAenderungen+" nicht gesichert" : (syncMsg||"Verbunden")}
                  </span>
                  <span className="sync-line-ver">v4.0.1</span>
                  {spiegelVoll && (
                    <span className="sync-line-hint" title="Der Browserspeicher ist voll. Die Charaktere liegen weiter auf dem Server und werden bei jedem Start von dort geladen — nur die lokale Kopie für den Offline-Fall entfällt.">
                      ⚠ ohne lokale Kopie
                    </span>
                  )}
                </div>
                <div className="sync-actions">
                  <button className="btn-sync" title="Daten neu vom Server laden" onClick={()=>doSyncLoad(svUrl,svCode,svPass)}>↺ Laden</button>
                  {hasDmMode && !isDmMode && (
                    <button className="btn-sync dm" title="In den DM-Modus wechseln" onClick={()=>{setDmLoginInput('');setDmLoginErr('');setShowDmLogin(true);}}>🔮 DM</button>
                  )}
                  {isDmMode && (
                    <button className="btn-sync dm active" title="DM-Modus verlassen" onClick={doDmLogout}>🔮 DM aus</button>
                  )}
                  <button className="btn-sync" title="Von der Gruppe abmelden" onClick={signOut}>⎋ Abmelden</button>
                </div>
              </>
            ) : (
              <button className="btn-sync" onClick={()=>setShowSetup(true)}>⚙️ Server verbinden</button>
            )}
          </div>
        </div>

        <div className="main">
          {isTouchLayout && mv==="list" && (
            <div className="mobile-list-screen">
              <div style={{padding:"16px 12px 12px",borderBottom:"1px solid var(--border)",textAlign:"center"}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:16,color:"var(--gold)"}}>⚔ Heldenbuch ⚔</div>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:"var(--text-muted)",letterSpacing:"0.15em",textTransform:"uppercase",marginTop:4}}>Dungeons &amp; Dragons · 🐉</div>
                {/* Sync status on mobile list */}
                {svCode && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:6}}>
                    <div className={"sync-dot "+(offeneAenderungen>0?"err":syncStatus==="busy"?"busy":syncStatus==="err"?"err":"ok")}/>
                    <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',letterSpacing:'0.08em'}}>
                      {svCode} · {offeneAenderungen>0 ? offeneAenderungen+' nicht gesichert' : (syncMsg||'Verbunden')}
                    </span>
                  </div>
                )}
                <div className="sidebar-tools" style={{marginTop:10}}>
                  <button className="btn-tool" onClick={()=>{setShowDB(true);setDbForm(null);setDbFormId(null);}}>
                    📚 Datenbank
                  </button>
                  <button className="btn-tool" onClick={()=>{
                    setAdventSearch(''); setAdventTabFilter([]);
                    setShowAdventLog(true);
                  }}>
                    📖 Abenteuerlog
                  </button>
                  {isDmMode && (
                    <button className="btn-tool" onClick={()=>setShowKampf(true)}>
                      ⚔ Kampf{kampf && kampf.aktiv ? ' · Runde ' + kampf.runde : ''}
                    </button>
                  )}
                  {isDmMode && (
                    <button className={"btn-tool"+(showChronik?" an":"")} onClick={chronikUmschalten}>
                      🕰 Chronik{chronikFaellig > 0 ? ' · ' + chronikFaellig + ' fällig' : ''}
                    </button>
                  )}
                  <button className="btn-tool" onClick={()=>setShowAutomat(true)}>🎰 Taverne</button>
                </div>
              </div>
              <div style={{padding:8}}>
                <div style={{padding:'6px 0 4px'}}>
                  <input
                    className="form-input"
                    style={{width:'100%',padding:'5px 10px',fontSize:12,boxSizing:'border-box',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:4,color:'var(--text-primary)'}}
                    placeholder="🔍 Held suchen..."
                    value={charSearch}
                    onChange={e=>setCharSearch(e.target.value)}
                  />
                </div>
                <CharList />
              </div>
            </div>
          )}
          {isTouchLayout && mv==="sheet" && (
            <div className="mobile-sheet">
              <div className="mobile-topbar">
                <button className="mobile-back" onClick={()=>setMv("list")}>← Helden</button>
                <div className="mobile-topbar-title">{cur && cur.name||"—"}</div>
                <div className="mobile-topbar-actions">
                  {cur && <>
                    <button className="btn-icon" style={{padding:"5px 8px",fontSize:11}} onClick={openEdit}>✎</button>
                    {cur.archived
                      ? <button className="btn-icon" style={{padding:"5px 8px",fontSize:11,borderColor:"var(--gold-dim)",color:"var(--gold-dim)"}} onClick={()=>unarchiveChar(cur.id)}>↩</button>
                      : <button className="btn-icon" style={{padding:"5px 8px",fontSize:11,color:"var(--text-muted)"}} onClick={()=>appConfirm("Charakter archivieren?", archiveChar, "Archivieren")}>📦</button>
                    }
                    <button className="btn-icon btn-delete" style={{padding:"5px 8px",fontSize:11}} onClick={deleteChar}>✕</button>
                  </>}
                </div>
              </div>
              <Sheet />
            </div>
          )}
          {!isTouchLayout && <div className="desktop-sheet"><Sheet /></div>}
        </div>

        {isDmMode && showChronik && (
          <ChronikLeiste
            chronik={chronik} advId={advId} advName={advName} chars={chars}
            ueberlagert={isTouchLayout}
            onZeit={()=>setZeitOffen(true)}
            onNeu={()=>setEreignisForm({e: newEreignis(advId, chronikJetzt()), neu:true})}
            onBearbeiten={(e)=>setEreignisForm({e, neu:false})}
            onLoeschen={ereignisLoeschen}
            onAbhaken={ereignisAbhaken}
            onWiederOeffnen={ereignisWiederOeffnen}
            onSchliessen={chronikUmschalten} />
        )}

        {/* Die Leiste steht rechts daneben, nicht darueber: sonst laege der
            Knopf "+ Ereignis" unter der Reiterleiste. */}
        <nav className="mobile-bottom-nav" style={{left: (isTouchLayout || sidebarCollapsed) ? 0 : 260,
          right: (!isTouchLayout && isDmMode && showChronik) ? 300 : 0}}>
          <div className="mobile-bottom-nav-inner-wrap">
            {mv==="list" ? (
              <button className="mobile-nav-btn active">
                <span className="mobile-nav-icon">⚔</span>
                <span className="mobile-nav-label">Helden</span>
              </button>
            ) : (
              [["stats","🎯","Attribute"],["aktionen","⚔️","Aktionen"],["zauber","✨","Zauber"],["merkmale","⭐","Merkmale"],["inventar","🎒","Inventar"],["notizen","📜","Notizen"],["log","📋","Log"]].map(([k,ic,lb]) => (
                <button key={k} className={"mobile-nav-btn"+(tab===k?" active":"")} onClick={()=>{setTab(k);if(k!=="inventar"){setTransferMode(false);setTransferSel(new Set());}}}>
                  <span className="mobile-nav-icon">{ic}</span>
                  <span className="mobile-nav-label">{lb}</span>
                </button>
              ))
            )}
          </div>
        </nav>

        <button className="mobile-fab" onClick={mv==="list"?openNew:()=>setMv("list")}>
          {mv==="list" ? "+" : "☰"}
        </button>

      </div>

      {showCF && ec && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:420}}>
            <div className="form-title">{chars.find(c=>c.id===ec.id)?"✎ Charakter bearbeiten":"✶ Neuer Charakter"}</div>

            <div className="form-group" style={{marginBottom:14}}>
              <div className="form-label">Name</div>
              <input className="form-input" style={{width:"100%",boxSizing:"border-box"}} placeholder="z.B. Aragorn" value={ec.name} onChange={e=>setEc({...ec,name:e.target.value})} autoFocus/>
            </div>

            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div className="form-group" style={{flex:1}}>
                <div className="form-label">Rasse</div>
                <select className="form-select" style={{width:"100%"}} value={ec.race} onChange={e=>setEc({...ec,race:e.target.value})}>
                  {RACES.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group" style={{flex:1}}>
                <div className="form-label">Hintergrund</div>
                <input className="form-input" style={{width:"100%",boxSizing:"border-box"}} placeholder="z.B. Soldat" value={ec.background} onChange={e=>setEc({...ec,background:e.target.value})} />
              </div>
            </div>

            <div className="section-title" style={{margin:"4px 0 10px"}}>Klassen &amp; Stufen</div>
            <div className="multiclass-row" style={{marginBottom:8}}>
              <select className="form-select" style={{flex:1}} value={ec.charClass} onChange={e=>setEc({...ec,charClass:e.target.value})}>
                {/* Eine Klasse, die im Bogen steht und nicht mehr in der Liste
                    ist, bleibt waehlbar — sonst spraenge der Held beim
                    Oeffnen still auf eine andere Klasse. */}
                {klassenWahl(ec.charClass).map(c=><option key={c}>{c}</option>)}
              </select>
              <input className="form-input" type="number" min="1" max="20" value={ec.level}
                onChange={e=>setEc({...ec,level:Math.max(1,Math.min(20,+e.target.value))})}
                style={{maxWidth:64,textAlign:"center"}} placeholder="Stufe"/>
              <div style={{fontSize:10,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif",whiteSpace:"nowrap",alignSelf:"center"}}>Hauptklasse</div>
            </div>
            {(ec.multiclasses||[]).map((mc,i)=>(
              <div className="multiclass-row" key={i} style={{marginBottom:8}}>
                <select className="form-select" style={{flex:1}} value={mc.charClass}
                  onChange={e=>setEc({...ec,multiclasses:ec.multiclasses.map((m,j)=>j===i?{...m,charClass:e.target.value}:m)})}>
                  {klassenWahl(mc.charClass).map(c=><option key={c}>{c}</option>)}
                </select>
                <input className="form-input" type="number" min="1" max="20" value={mc.level}
                  onChange={e=>setEc({...ec,multiclasses:ec.multiclasses.map((m,j)=>j===i?{...m,level:Math.max(1,+e.target.value)}:m)})}
                  style={{maxWidth:64,textAlign:"center"}} placeholder="Stufe"/>
                <button className="btn-sm-del"
                  onClick={()=>setEc({...ec,multiclasses:ec.multiclasses.filter((_,j)=>j!==i)})}>&#x2715;</button>
              </div>
            ))}
            <button className="btn-sm-add"
              onClick={()=>setEc({...ec,multiclasses:[...(ec.multiclasses||[]),{charClass:"Kämpfer",level:1}]})}>
              + Multiclass hinzufügen
            </button>

            <div className="form-actions" style={{marginTop:20}}>
              {isDmMode && (
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginRight:"auto"}}>
                  <input type="checkbox" checked={ec.dmOnly||false} onChange={e=>setEc({...ec,dmOnly:e.target.checked})} style={{width:16,height:16,cursor:"pointer",accentColor:"#c060a0"}} />
                  <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:"#c060a0"}}>🔮 Nur DM-Modus</span>
                </label>
              )}
              <button className="btn-cancel" onClick={()=>setShowCF(false)}>Abbrechen</button>
              <button className="btn-save" onClick={saveChar}>✶ Speichern</button>
            </div>
          </div>
        </div>
      )}
      {showWF && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:480}}>
            <div className="form-title">{wfEditId ? "Waffe bearbeiten" : "Neue Waffe"}</div>
            <div className="form-grid">
              <div className="form-group form-full">
                <div className="form-label">Name</div>
                <input className="form-input" placeholder="z.B. Langschwert +1" value={wf.name} onChange={e=>setWf({...wf,name:e.target.value})} autoFocus/>
              </div>
              <div className="form-group">
                <div className="form-label">Schaden</div>
                <input className="form-input" placeholder="1W6" value={wf.damage} onChange={e=>setWf({...wf,damage:e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label">Schadensart</div>
                <select className="form-select" value={wf.damageType} onChange={e=>setWf({...wf,damageType:e.target.value})}>
                  {DTYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Attribut</div>
                <select className="form-select" value={wf.attrKey||"str"} onChange={e=>setWf({...wf,attrKey:e.target.value})}>
                  {WATTRS.map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Reichweite</div>
                <input className="form-input" placeholder="1,5m" value={wf.range||""} onChange={e=>setWf({...wf,range:e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label">Angriffsbonus (+/−)</div>
                <input className="form-input" type="number" placeholder="0" value={wf.attackBonus||0} onChange={e=>setWf({...wf,attackBonus:parseInt(e.target.value)||0})} />
              </div>
              <div className="form-group" style={{justifyContent:"flex-end"}}>
                <div className="form-label">Optionen</div>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,color:"var(--text-secondary)",padding:"8px 0"}}>
                  <input type="checkbox" style={{accentColor:"var(--gold)",width:15,height:15}}
                    checked={wf.proficient!==false}
                    onChange={e=>setWf({...wf,proficient:e.target.checked})} />
                  Übung (Proficiency)
                </label>
              </div>
              <div className="form-group form-full">
                <div className="form-label">Eigenschaften</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:2}}>
                  {WPROPS.map(p => {
                    const on=(wf.properties||[]).includes(p);
                    return <button key={p} onClick={()=>setWf({...wf,properties:on?(wf.properties||[]).filter(x=>x!==p):[...(wf.properties||[]),p]})}
                      style={{padding:"4px 12px",borderRadius:12,border:"1px solid",fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,cursor:"pointer",
                        borderColor:on?"var(--gold)":"var(--border)",background:on?"var(--bg-panel)":"var(--bg-card)",color:on?"var(--gold)":"var(--text-muted)"}}>{p}</button>;
                  })}
                </div>
              </div>
              <div className="form-group form-full">
                <div className="form-label">Beschreibung (optional)</div>
                <RichEditor value={wf.description||''} onChange={v=>setWf({...wf,description:v})}
                  placeholder="z.B. Reichweite geworfen: 9/36m, magisch..." rows={2} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Bild (optional)</div>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  {wf.imageData && (
                    <div style={{position:'relative',flexShrink:0}}>
                      <img src={wf.imageData} alt="" style={{width:80,height:64,objectFit:'contain',borderRadius:4,border:'1px solid var(--border)',background:'var(--bg-void)'}} />
                      <button onClick={()=>setWf({...wf,imageData:''})}
                        style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'var(--crimson)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>✕</button>
                    </div>
                  )}
                  <label style={{flex:1,padding:'10px 14px',background:'var(--bg-card)',border:'1px dashed var(--border)',borderRadius:6,cursor:'pointer',textAlign:'center',fontSize:12,color:'var(--text-muted)',fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:'0.05em'}}>
                    📷 {wf.imageData ? 'Bild ändern' : 'Bild auswählen'}
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                      const file = e.target.files?.[0];
                      if(!file) return;
                      // 600px: das Bild fuellt die Karte formatfuellend aus und
                      // wird dabei beschnitten, dafuer braucht es mehr Reserve
                      // als die reine Anzeigebreite. Transparenz bleibt
                      // erhalten, siehe compressImage.
                      compressImage(file, 600, data => { if(data) setWf(prev=>({...prev,imageData:data})); });
                    }} />
                  </label>
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:5,fontStyle:'italic'}}>Füllt die Karte im Format 5:7 aus, hochkant wird also am wenigsten beschnitten. Transparente PNGs bleiben transparent.</div>
              </div>
              <div className="form-group form-full">
                <div className="form-label">✦ Effekte</div>
                <EffectEditor effects={wf.effects} onChange={v=>setWf({...wf,effects:v})}
                  hint="Wirken, solange die Waffe angelegt ist." />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>{setShowWF(false);setWfEditId(null);}}>Abbrechen</button>
              <button className="btn-save" onClick={addWeapon}>{wfEditId ? "Speichern" : "+ Hinzufügen"}</button>
            </div>
          </div>
        </div>
      )}


      {showFF && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:480}}>
            <div className="form-title">{ffEditId ? '✏️ Fähigkeit bearbeiten' : '⭐ Neue Fähigkeit'}</div>
            <div className="form-grid">
              <div className="form-group form-full">
                <div className="form-label">Name</div>
                <input className="form-input" placeholder="z.B. Bardische Inspiration, Wildform..." value={ff.name} onChange={e=>setFf({...ff,name:e.target.value})} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Quelle (optional)</div>
                <input className="form-input" placeholder="z.B. Barde Stufe 1, Kampfstil..." value={ff.source} onChange={e=>setFf({...ff,source:e.target.value})} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Beschreibung</div>
                <RichEditor value={ff.description} onChange={v=>setFf({...ff,description:v})}
                  placeholder="Beschreibung der Fähigkeit, Nutzungsbedingungen..." rows={6} />
              </div>
              {/* Hier sind die RK-Boni aus Talenten gelandet. Ein Kampfstil
                  gehoert zu den Merkmalen und kann jetzt mehr als nur die
                  Ruestungsklasse anheben. */}
              <div className="form-group form-full">
                <div className="form-label">✦ Effekte</div>
                <EffectEditor effects={ff.effects||[]} onChange={v=>setFf({...ff,effects:v})}
                  hint="Wirken, solange das Merkmal eingeschaltet ist — z.B. Defensiver Kampfstil +1 RK." />
                {(ff.effects||[]).length>0 && (
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginTop:8}}>
                    <input type="checkbox" checked={ff.effectsActive!==false}
                      onChange={e=>setFf({...ff,effectsActive:e.target.checked})}
                      style={{width:16,height:16,cursor:'pointer',accentColor:'var(--arcane-bright)'}} />
                    <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,color:'var(--text-secondary)'}}>Wirkt gerade</span>
                  </label>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>{setShowFF(false);setFfEditId(null);}}>Abbrechen</button>
              <button className="btn-save" onClick={saveFeature}>{ffEditId ? '✓ Speichern' : '+ Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}

      {showSF && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:480}}>
            <div className="form-title">{sfEditId ? '✏️ Zauber bearbeiten' : '✨ Neuer Zauber'}</div>
            <div className="form-grid">
              <div className="form-group form-full">
                <div className="form-label">Name</div>
                <input className="form-input" placeholder="z.B. Feuerball" value={sf.name} onChange={e=>setSf({...sf,name:e.target.value})} autoFocus/>
              </div>
              <div className="form-group">
                <div className="form-label">Grad</div>
                <select className="form-select" value={sf.level} onChange={e=>setSf({...sf,level:+e.target.value})}>
                  <option value={0}>∞ Zaubertrick</option>
                  {[1,2,3,4,5,6,7,8,9].map(l=><option key={l} value={l}>Grad {l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Schule</div>
                <select className="form-select" value={sf.school} onChange={e=>setSf({...sf,school:e.target.value})}>
                  {SCHOOLS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Wirkzeit</div>
                <input className="form-input" placeholder="1 Aktion" value={sf.castingTime} onChange={e=>setSf({...sf,castingTime:e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label">Reichweite</div>
                <input className="form-input" placeholder="9 m" value={sf.range} onChange={e=>setSf({...sf,range:e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label">Dauer</div>
                <input className="form-input" placeholder="Sofort" value={sf.duration} onChange={e=>setSf({...sf,duration:e.target.value})} />
              </div>
              <div className="form-group">
                <div className="form-label">Komponenten</div>
                <input className="form-input" placeholder="V, S, M (...)" value={sf.components||''} onChange={e=>setSf({...sf,components:e.target.value})} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Beschreibung</div>
                <RichEditor value={sf.description} onChange={v=>setSf({...sf,description:v})} placeholder="Wirkung des Zaubers..." rows={4} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Klassen</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:4}}>
                  {['Artifizient', 'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Kämpfer', 'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer'].map(c=>{
                    const cc={'Artifizient':'#70b8c8','Barbar':'#c84040','Barde':'#4090c0','Druide':'#52b788','Hexenmeister':'#9060c0','Kämpfer':'#c08040','Kleriker':'#e0c040','Magier':'#6080d0','Mönch':'#d09040','Paladin':'#e0a030','Schurke':'#808080','Waldläufer':'#70a050','Zauberer':'#c060a0'};const col=cc[c]||'#c9a84c';const on=(sf.classes||[]).includes(c);
                    return <button key={c} type="button" onClick={()=>setSf(f=>({...f,classes:on?(f.classes||[]).filter(x=>x!==c):[...(f.classes||[]),c]}))}
                      style={{padding:'2px 9px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',border:'1px solid '+(on?col:col+'40'),background:on?col+'22':'var(--bg-card)',color:on?col:'var(--text-muted)'}}>{c}</button>;
                  })}
                </div>
              </div>
              <div className="form-group form-full">
                <div className="form-label">Schadenstypen</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:4}}>
                  {['Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekrotisch', 'Gleißend', 'Psychisch', 'Energie', 'Schall', 'Hieb', 'Stich', 'Wucht'].map(d=>{
                    const on=(sf.damageTags||[]).includes(d);
                    const dc={Feuer:'#e07030',Kälte:'#70b8d8',Blitz:'#c0d850',Säure:'#90c040',Gift:'#80b030',Nekrose:'#9060c0',Strahlend:'#f0e060',Psychisch:'#c070d0',Kraft:'#80a0f0',Hieb:'#a07050',Stich:'#b08060',Wucht:'#c09070'}[d]||'#aaa';
                    return <button key={d} type="button" onClick={()=>setSf(f=>({...f,damageTags:on?(f.damageTags||[]).filter(x=>x!==d):[...(f.damageTags||[]),d]}))}
                      style={{padding:'2px 9px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',border:`1px solid ${on?dc:dc+'40'}`,background:on?dc+'22':'var(--bg-card)',color:on?dc:'var(--text-muted)'}}>⚔️ {d}</button>;
                  })}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>{setShowSF(false);setSfEditId(null);}}>Abbrechen</button>
              <button className="btn-save" onClick={addSpell}>{sfEditId ? '✓ Speichern' : '+ Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}

      {showNF && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:520}}>
            <div className="form-title">{nfEditId ? '✏️ Notiz bearbeiten' : '📄 Neue Notiz'}</div>
            <div className="form-grid">
              <div className="form-group form-full">
                <div className="form-label">Titel</div>
                <input className="form-input" placeholder="z.B. Hintergrundgeschichte" value={nf.title} onChange={e=>setNf({...nf,title:e.target.value})} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Tags</div>
                <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:4,padding:'6px 8px',display:'flex',flexWrap:'wrap',gap:6,alignItems:'center',minHeight:38}}>
                  {(nf.tags||[]).map((t,i)=>(
                    <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,background:'var(--bg-panel)',border:'1px solid var(--border-bright)',borderRadius:12,padding:'2px 8px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:'var(--gold)',letterSpacing:'0.06em'}}>
                      {t}
                      <button onClick={()=>setNf({...nf,tags:(nf.tags||[]).filter((_,j)=>j!==i)})} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:11,padding:0,lineHeight:1}}>✕</button>
                    </span>
                  ))}
                  <input
                    style={{flex:1,minWidth:80,background:'transparent',border:'none',outline:'none',fontFamily:"'Roboto',sans-serif",fontSize:14,color:'var(--text-primary)'}}
                    placeholder={(nf.tags||[]).length===0?"z.B. Kampagne":"+ Tag..."}
                    onKeyDown={e=>{
                      if((e.key==='Enter'||e.key===','||e.key===';')&&e.target.value.trim()){
                        e.preventDefault();
                        setNf({...nf,tags:[...(nf.tags||[]),e.target.value.trim()]});
                        e.target.value='';
                      } else if(e.key==='Backspace'&&!e.target.value&&(nf.tags||[]).length>0){
                        setNf({...nf,tags:(nf.tags||[]).slice(0,-1)});
                      }
                    }}
                    onBlur={e=>{if(e.target.value.trim()){setNf({...nf,tags:[...(nf.tags||[]),e.target.value.trim()]});e.target.value='';}}}
                  />
                </div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:3}}>Enter oder Komma zum Hinzufügen · Backspace zum Entfernen</div>
              </div>
              <div className="form-group form-full">
                <div className="form-label">Inhalt</div>
                <RichEditor value={nf.content} onChange={v=>setNf({...nf,content:v})}
                  placeholder="Schreibe hier deine Notiz..." rows={10} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>{setShowNF(false);setNfEditId(null);}}>Abbrechen</button>
              <button className="btn-save" onClick={saveNote}>{nfEditId ? '✓ Speichern' : '+ Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}

      {showIF && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:520}}>
            <div className="form-title">{itfEditId ? '✏️ Gegenstand bearbeiten' : '🎒 Neuer Gegenstand'}</div>

            {/* DB item templates — only shown when creating new */}
            {!itfEditId && (() => {
              const activeItems = isDmMode
                ? [...(dmLibrary.item||[]), ...(userLibrary.item||[])]
                : (userLibrary.item||[]);
              if (activeItems.length === 0) return null;
              return (
                <div style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:isDmMode?'#c060a0':'var(--gold)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
                      {isDmMode?'🔮 DM-Datenbank':'📚 Aus Datenbank'}
                    </div>
                    <div style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>{activeItems.length} Einträge</div>
                  </div>
                  <input className="form-input" style={{marginBottom:6,padding:'5px 10px',fontSize:12}} placeholder="Suchen..."
                    onChange={e=>{
                      const q=e.target.value.toLowerCase();
                      const wrap=e.target.closest('.form-modal').querySelector('.db-item-list');
                      if(wrap)[...wrap.children].forEach(c=>{c.style.display=c.dataset.name.includes(q)?'':'none';});
                    }}
                  />
                  {/* Kopie statt Verweis: der uebernommene Gegenstand bleibt
                      eigenstaendig, auch wenn ihn jemand im Spiel veraendert.
                      libRef haelt fest, woraus er entstanden ist — damit
                      bleibt spaeter ein "aus der Datenbank auffrischen"
                      moeglich, ohne dass die Datenbank heute schon stabile
                      Kennungen braeuchte. */}
                  <div className="db-item-list" style={{display:'flex',flexWrap:'wrap',gap:5,maxHeight:110,overflowY:'auto'}}>
                    {activeItems.map((item,i)=>{
                      const r=RARITIES.find(x=>x.key===item.rarity)||RARITIES[0];
                      const isDmItem = isDmMode && (dmLibrary.item||[]).some(d=>d.name===item.name);
                      return (
                        <button key={i} data-name={(item.name||'').toLowerCase()}
                          onClick={()=>setItf({...newItem(),...item,id:Date.now().toString(),libRef:item.name})}
                          title={item.description||item.source||''}
                          style={{padding:'3px 10px',borderRadius:12,fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,cursor:'pointer',
                            border:'1px solid '+(isDmItem?'#c060a060':r.color+'60'),
                            background:isDmItem?'rgba(192,96,160,0.12)':r.color+'15',
                            color:isDmItem?'#c060a0':r.color,letterSpacing:'0.05em'}}>
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Icon picker */}
            {showIconPicker && (() => {
              const ICON_CATS = [
                {label:'Nahkampfwaffen',icons:['⚔','🗡','🔪','🪃','🪓','🏏','🪝','⚒','🔨','🪚','🗾','🧨']},
                {label:'Fernkampf & Magie',icons:['🏹','🪃','⚡','🌟','💥','🔥','❄','🌊','💨','☄','🌀','🔮','🌀','✨','💫','🌙']},
                {label:'Rüstung & Schutz',icons:['🛡','⛓','🪖','🧤','🥋','🎭','🧣','🧥','👘','🦺','🎩','👑']},
                {label:'Schmuck & Artefakte',icons:['💍','📿','🪬','💎','🪩','🏺','🪆','🪄','🎀','🧿','⭕','♾']},
                {label:'Tränke & Essen',icons:['🧪','🔬','🫙','🍶','🍵','🫖','🍷','🍺','🍯','🥃','🍎','🍇','🍄','🌹','🌿','🌾']},
                {label:'Bücher & Schriften',icons:['📜','📖','📚','📝','📒','📋','🗾','🔭','🔬','🧭','📡','📅']},
                {label:'Werkzeuge & Schlösser',icons:['🔑','🗝','⛏','🔧','🪛','🔩','🪤','🧰','🪜','🪣','⚙','🔗','📎','✂','🧲','🪝']},
                {label:'Licht & Feuer',icons:['🕯','🪔','🔦','💡','🔥','🪵','🎇','🎆','⚡','☀','🌟','✴']},
                {label:'Säcke & Behälter',icons:['🎒','👜','💰','💴','💵','🪙','📦','🗃','🧺','🪣','🎁','📫']},
                {label:'Natur & Edelsteine',icons:['🪨','🌊','🌿','🍀','🌱','🌾','🌰','🌹','🌻','💧','🔱','🌙','☀','⭐','🌈','❄']},
                {label:'Tiere & Monster',icons:['🐲','🦄','🦅','🐺','🦊','🐗','🦂','🕷','🦇','🐍','🦁','🐻','🦎','🐙','🦀','🦟','🐉','🦋','🦩','🦚','🦜','🐓','🦑']},
                {label:'Körper & Seele',icons:['💀','☠','👁','🫀','🧠','🦷','🦴','🩸','💉','🩺','🧬','🫁','🤚','✊','🤝','👁️‍🗨️']},
                {label:'Sonstiges',icons:['🎲','🎯','🎪','🎠','🏺','🎵','🎶','🎸','📯','🥁','🎺','🎻','🃏','🎴','🀄','🎭','🎬','🎨']},
              ];
              return (
                <div className="form-overlay" onClick={()=>setShowIconPicker(false)}>
                  <div className="form-modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
                    <div className="form-title" style={{marginBottom:12}}>Icon wählen</div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,padding:'8px 12px',background:'var(--bg-void)',borderRadius:6,border:'1px solid var(--border)'}}>
                      <span style={{fontSize:32}}>{itf.icon||'🎒'}</span>
                      <div>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--gold)'}}>Ausgewählt</div>
                        <div style={{fontSize:12,color:'var(--text-muted)'}}>Klicke ein Icon um es auszuwählen</div>
                      </div>
                    </div>
                    {ICON_CATS.map(cat=>(
                      <div key={cat.label} style={{marginBottom:10}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>{cat.label}</div>
                        <div className="icon-picker-grid">
                          {cat.icons.map(ic=>(
                            <button key={ic} className={"icon-picker-btn"+(itf.icon===ic?" selected":"")}
                              onClick={()=>{setItf(p=>({...p,icon:ic}));setShowIconPicker(false);}}>
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="form-actions" style={{marginTop:12}}>
                      <button className="btn-cancel" onClick={()=>setShowIconPicker(false)}>Schließen</button>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="form-grid">
              <div className="form-group form-full">
                <div className="form-label">Name</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button onClick={()=>setShowIconPicker(true)}
                    style={{fontSize:24,width:42,height:42,borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-card)',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}
                    title="Icon wählen">
                    {itf.icon||'🎒'}
                  </button>
                  <input className="form-input" style={{flex:1}} placeholder="z.B. Trank der Heilung" value={itf.name} onChange={e=>setItf({...itf,name:e.target.value})} autoFocus/>
                </div>
              </div>
              <div className="form-group">
                <div className="form-label">Seltenheit</div>
                <select className="form-select" value={itf.rarity} onChange={e=>setItf({...itf,rarity:e.target.value})}>
                  {RARITIES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Menge</div>
                <input className="form-input" type="number" min="1" value={itf.qty} onChange={e=>setItf({...itf,qty:Math.max(1,+e.target.value)})} />
              </div>
              <div className="form-group">
                <div className="form-label">Gewicht (kg, optional)</div>
                <input className="form-input" type="number" min="0" step="0.1" placeholder="z.B. 1.5" value={itf.weight} onChange={e=>setItf({...itf,weight:e.target.value})} />
              </div>
              {/* Ausruestungsplatz: erst damit taucht das Stueck in der
                  Auswahl eines Platzes auf. Ohne Angabe bleibt es ein reiner
                  Inventargegenstand, so wie bisher. */}
              <div className="form-group">
                <div className="form-label">Ausrüstungsplatz</div>
                <select className="form-select" value={itf.gearKind||''} onChange={e=>{
                  const k = e.target.value;
                  const art = k==='ruestung' ? (itf.armorType && itf.armorType!=='shield' ? itf.armorType : 'light')
                            : k==='schild'   ? 'shield' : '';
                  const basis = (ARMOR_KINDS.find(a=>a.key===art)||{}).basis || 0;
                  setItf({...itf, gearKind:k, armorType:art, baseAC: art ? (+itf.baseAC || basis) : 0});
                }}>
                  {GEAR_KINDS.map(g=><option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </div>
              {itf.gearKind==='ruestung' && (
                <div className="form-group">
                  <div className="form-label">Rüstungsart</div>
                  <select className="form-select" value={itf.armorType||'light'} onChange={e=>{
                    const art = e.target.value;
                    setItf({...itf, armorType:art, baseAC:(ARMOR_KINDS.find(a=>a.key===art)||{}).basis||0});
                  }}>
                    {ARMOR_KINDS.filter(a=>a.key&&a.key!=='shield').map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
                  </select>
                </div>
              )}
              {(itf.gearKind==='ruestung'||itf.gearKind==='schild') && (
                <div className="form-group">
                  <div className="form-label">{itf.gearKind==='schild'?'Bonus zur RK':'Basis-RK'}</div>
                  <input className="form-input" type="number" min="0" max="25" value={itf.baseAC||0}
                    onChange={e=>setItf({...itf,baseAC:+e.target.value})} />
                </div>
              )}
              {itf.gearKind && (
                <div className="form-group">
                  <div className="form-label">Magischer RK-Bonus</div>
                  <input className="form-input" type="number" min="-5" max="10" value={itf.acBonus||0}
                    placeholder="z.B. +1" onChange={e=>setItf({...itf,acBonus:+e.target.value})} />
                </div>
              )}
              {itf.gearKind && (
                <div className="form-group form-full">
                  <div className="form-label">Gehört zu einem Set (optional)</div>
                  <input className="form-input" list="hb-set-namen-inv" value={itf.setName||''}
                    onChange={e=>setItf({...itf,setName:e.target.value})}
                    placeholder="z.B. Hain des Ersten Lichts" />
                  <datalist id="hb-set-namen-inv">
                    {[...new Set([
                      ...((userLibrary.item||[]).map(e=>e.setName)),
                      ...((isDmMode ? (dmLibrary.item||[]) : []).map(e=>e.setName)),
                      ...((cur && cur.inventory || []).map(i=>i.setName)),
                    ].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de')).map(n=><option key={n} value={n}/>)}
                  </datalist>
                </div>
              )}
              {itf.gearKind && (
                <div className="form-group form-full">
                  <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic',fontFamily:"'Roboto Condensed',sans-serif"}}>
                    {itf.gearKind==='ruestung' && ((ARMOR_KINDS.find(a=>a.key===itf.armorType)||{}).hinweis||'')+' — RK '+(itf.baseAC||0)+(itf.acBonus?' + '+itf.acBonus+' (magisch)':'')}
                    {itf.gearKind==='schild'   && 'Gibt +'+((+itf.baseAC||0)+(+itf.acBonus||0))+' auf die RK, wenn es in der Nebenhand steckt'}
                    {itf.gearKind!=='ruestung' && itf.gearKind!=='schild' && (itf.acBonus?'+'+itf.acBonus+' zur RK, solange getragen':'Wirkt über seine Effekte, solange getragen')}
                  </div>
                </div>
              )}
              <div className="form-group form-full">
                <div className="form-label">Beschreibung (optional)</div>
                <RichEditor value={itf.description} onChange={v=>setItf({...itf,description:v})} placeholder="Wirkung, Eigenschaften..." rows={3} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Erhalten durch (optional)</div>
                <input className="form-input" placeholder="z.B. Gefunden in Dungeon, Kauf beim Händler..." value={itf.source||''} onChange={e=>setItf({...itf,source:e.target.value})} />
              </div>
              <div className="form-group form-full">
                <div className="form-label">Tags (Enter oder Komma zum Hinzufügen)</div>
                <div className="tag-input-wrap" onClick={e=>e.currentTarget.querySelector('input').focus()}>
                  {(itf.tags||[]).map(t=>(
                    <span key={t} className="tag-chip">{t}<button className="tag-chip-del" onClick={()=>setItf({...itf,tags:(itf.tags||[]).filter(x=>x!==t)})}>×</button></span>
                  ))}
                  <input className="tag-text-input" placeholder={(itf.tags||[]).length===0?"z.B. Waffe, Ruestung, Quest...":""}
                    onKeyDown={e=>{
                      const v=e.target.value.trim();
                      if((e.key==="Enter"||e.key===",")&&v){e.preventDefault();const t=v.replace(/,/g,"").trim();if(t&&!(itf.tags||[]).includes(t))setItf({...itf,tags:[...(itf.tags||[]),t]});e.target.value="";}
                      if(e.key==="Backspace"&&!e.target.value&&(itf.tags||[]).length>0)setItf({...itf,tags:(itf.tags||[]).slice(0,-1)});
                    }}
                    onBlur={e=>{
                      const v=e.target.value.trim().replace(/,/g,"");
                      if(v&&!(itf.tags||[]).includes(v)){setItf({...itf,tags:[...(itf.tags||[]),v]});e.target.value="";}
                    }} />
                </div>
              </div>
              {/* Image upload */}
              <div className="form-group form-full">
                <div className="form-label">Bild (optional)</div>
                <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  {itf.imageData && (
                    <div style={{position:'relative',flexShrink:0}}>
                      <img src={itf.imageData} alt="" style={{width:80,height:60,objectFit:'cover',borderRadius:4,border:'1px solid var(--border)'}} />
                      <button onClick={()=>setItf({...itf,imageData:''})}
                        style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',background:'var(--crimson)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>✕</button>
                    </div>
                  )}
                  <label style={{flex:1,padding:'10px 14px',background:'var(--bg-card)',border:'1px dashed var(--border)',borderRadius:6,cursor:'pointer',textAlign:'center',fontSize:12,color:'var(--text-muted)',fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:'0.05em'}}>
                    📷 Bild auswählen
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        // Compress via canvas — max 600px wide, 0.75 quality → ~60-100KB
                        const img = new Image();
                        img.onload = () => {
                          const MAX = 1000;
                          const scale = img.width > MAX ? MAX / img.width : 1;
                          const canvas = document.createElement('canvas');
                          canvas.width  = Math.round(img.width  * scale);
                          canvas.height = Math.round(img.height * scale);
                          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                          const compressed = canvas.toDataURL('image/jpeg', 0.85);
                          setItf(prev=>({...prev,imageData:compressed}));
                        };
                        img.src = ev.target.result;
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                </div>
              </div>
              <div className="form-group form-full">
                <div className="form-label">✦ Effekte</div>
                <EffectEditor effects={itf.effects} onChange={v=>setItf({...itf,effects:v})}
                  hint="Wirken, solange der Gegenstand eingeschaltet ist." />
                {(itf.effects||[]).length>0 && (
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginTop:8}}>
                    <input type="checkbox" checked={!!itf.effectsActive}
                      onChange={e=>setItf({...itf,effectsActive:e.target.checked})}
                      style={{width:16,height:16,cursor:'pointer',accentColor:'var(--arcane-bright)'}} />
                    <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,color:'var(--text-secondary)'}}>Effekte wirken gerade (getragen / eingeschaltet)</span>
                  </label>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>{setShowIF(false);setItfEditId(null);}}>Abbrechen</button>
              <button className="btn-save" onClick={addItem}>{itfEditId ? '✓ Speichern' : '+ Hinzufügen'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Transfer Modal */}
      {showTransfer && cur && (() => {
        const transferItems = (cur.inventory||[]).filter(i=>transferSel.has(i.id));
        // DM heroes can transfer to anyone; normal heroes can only transfer to DM heroes if in DM mode
        const others = chars.filter(c => {
          if (c.id === sel || c.archived) return false;
          if (c.dmOnly) return isDmMode;  // DM heroes only visible when in DM mode
          return true;
        });
        return (
          <div className="form-overlay">
            <div className="form-modal" style={{maxWidth:420}}>
              <div className="form-title">➤ Gegenstände übergeben</div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif",marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>Ausgewählte Gegenstände</div>
                <div style={{background:"var(--bg-void)",borderRadius:4,padding:"8px 10px",maxHeight:140,overflowY:"auto"}}>
                  {transferItems.map(item=>{
                    const r = RARITIES.find(x=>x.key===item.rarity)||RARITIES[0];
                    return (
                      <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{flex:1,fontSize:13,color:"var(--text-primary)"}}>{item.name}</span>
                        <span style={{fontSize:11,color:r.color}}>{r.label}</span>
                        <span style={{fontSize:12,color:"var(--text-muted)"}}>x{item.qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{fontSize:12,color:"var(--text-muted)",fontFamily:"'Roboto Condensed',sans-serif",marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>An wen übergeben?</div>
              {!isDmMode && cur.dmOnly && (
                <div style={{fontSize:12,color:"#c060a0",fontStyle:"italic",marginBottom:8,padding:"6px 10px",background:"rgba(192,96,160,0.08)",borderRadius:4,border:"1px solid rgba(192,96,160,0.2)"}}>
                  🔮 DM-Held kann nur im DM-Modus Gegenstände an normale Helden übergeben.
                </div>
              )}
              {others.length === 0 ? (
                <div style={{color:"var(--text-muted)",fontStyle:"italic",fontSize:13,marginBottom:16}}>Keine verfügbaren Charaktere in der Gruppe.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {others.map(c=>{
                    const cc = klassenStil(c.charClass || 'Kämpfer', klassen);
                    return (
                      <button key={c.id}
                        onClick={()=>doTransfer(c.id, transferSel)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                          background:"var(--bg-card)",
                          border:"1px solid "+(c.dmOnly?"rgba(192,96,160,0.4)":"var(--border)"),
                          borderRadius:4,cursor:"pointer",textAlign:"left",transition:"border-color 0.15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=c.dmOnly?"#c060a0":"#7ab8f5"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=c.dmOnly?"rgba(192,96,160,0.4)":"var(--border)"}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:c.dmOnly?"#c060a0":cc.bg,border:"1px solid "+(c.dmOnly?"#c060a0":cc.border),flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:c.dmOnly?"#c060a0":"var(--text-primary)",display:"flex",alignItems:"center",gap:5}}>
                            {c.dmOnly && <span style={{fontSize:10}}>🔮</span>}
                            {c.name||"Unbenannt"}
                          </div>
                          <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{c.charClass} · Stufe {c.level} · {(c.inventory||[]).length} Gegenst. im Inventar</div>
                        </div>
                        <div style={{color:c.dmOnly?"#c060a0":"#7ab8f5",fontSize:16}}>➤</div>
                      </button>
                    );
                  })}
                </div>
              )}
              <button className="btn-icon" style={{width:"100%",justifyContent:"center"}} onClick={()=>setShowTransfer(false)}>Abbrechen</button>
            </div>
          </div>
        );
      })()}

      {/* Coin Popover */}
      {coinPopover && (() => {
        const cur = coinPopover.val || 0;
        const delta = parseInt(coinDelta)||0;
        const apply = (sign) => {
          const newVal = Math.max(0, cur + sign * Math.abs(delta||0));
          updCurrency(coinPopover.key, newVal);
          setCoinPopover(prev => ({...prev, val: newVal}));
          setCoinDelta('');
        };
        return (
          <div className="form-overlay" style={{background:'rgba(0,0,0,0.6)'}} onClick={()=>setCoinPopover(null)}>
            <div style={{background:'var(--bg-panel)',borderRadius:8,padding:'18px 20px',
              border:`2px solid ${coinPopover.color}60`,boxShadow:'0 8px 32px rgba(0,0,0,0.7)',
              minWidth:220,maxWidth:280}} onClick={e=>e.stopPropagation()}>
              {/* Header */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <span style={{fontSize:28}}>🪙</span>
                <div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,color:coinPopover.color,fontWeight:700,letterSpacing:'0.08em'}}>{coinPopover.label}</div>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:20,color:'var(--text-primary)',lineHeight:1}}>{cur}</div>
                </div>
              </div>
              {/* Input */}
              <div style={{marginBottom:12}}>
                <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Betrag</div>
                <input
                  autoFocus
                  type="number" min="0"
                  value={coinDelta}
                  onChange={e=>setCoinDelta(e.target.value)}
                  onKeyDown={e=>{
                    if(e.key==='Enter' && coinDelta) apply(1);
                    if(e.key==='Escape') setCoinPopover(null);
                  }}
                  style={{width:'100%',boxSizing:'border-box',background:'var(--bg-void)',
                    border:`1px solid ${coinPopover.color}60`,borderRadius:4,
                    color:'var(--text-primary)',fontFamily:"'Roboto Condensed',sans-serif",
                    fontSize:18,textAlign:'center',padding:'8px 4px',outline:'none'}}
                  placeholder="0"
                />
              </div>
              {/* Buttons */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                <button
                  onClick={()=>apply(1)}
                  style={{padding:'10px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,fontWeight:700,
                    background:`${coinPopover.color}25`,border:`1px solid ${coinPopover.color}80`,
                    color:coinPopover.color,borderRadius:5,cursor:'pointer',letterSpacing:'0.05em'}}>
                  + Hinzufügen
                </button>
                <button
                  onClick={()=>apply(-1)}
                  style={{padding:'10px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,fontWeight:700,
                    background:'rgba(180,60,60,0.15)',border:'1px solid rgba(180,60,60,0.5)',
                    color:'#e07070',borderRadius:5,cursor:'pointer',letterSpacing:'0.05em'}}>
                  − Wegnehmen
                </button>
              </div>
              {/* Direct set */}
              <div style={{borderTop:'1px solid var(--border)',paddingTop:10,display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>Direkt setzen</span>
                <button
                  onClick={()=>{ if(coinDelta!=='') { updCurrency(coinPopover.key, Math.max(0,parseInt(coinDelta)||0)); setCoinPopover(null); }}}
                  style={{flex:1,padding:'5px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,
                    background:'var(--bg-card)',border:'1px solid var(--border)',
                    color:'var(--text-muted)',borderRadius:4,cursor:'pointer'}}>
                  = Setzen
                </button>
                <button onClick={()=>setCoinPopover(null)}
                  style={{padding:'5px 10px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,
                    background:'none',border:'1px solid var(--border)',
                    color:'var(--text-muted)',borderRadius:4,cursor:'pointer'}}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Item Detail Modal */}
      {itemViewer && (() => {
        const item = itemViewer;
        const r = RARITIES.find(x=>x.key===item.rarity)||RARITIES[0];
        const icon = item.icon || '🎒';
        return (
          <div className="form-overlay" onClick={()=>setItemViewer(null)}>
            <div className="form-modal" style={{maxWidth:460,padding:0,overflow:'hidden',maxHeight:'85vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
              {/* Header */}
              <div style={{background:`linear-gradient(180deg, ${r.color}30 0%, ${r.color}14 100%), var(--bg-card)`,borderBottom:`1px solid ${r.color}55`,padding:'16px 18px 14px',display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{fontSize:40,lineHeight:1,filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',flexShrink:0}}>{icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text-primary)',textTransform:'uppercase',letterSpacing:'0.06em',lineHeight:1.3}}>{item.name}</div>
                  <div style={{fontFamily:"'Roboto',sans-serif",fontSize:12,color:'var(--parchment-dim)',marginTop:4,fontStyle:'italic'}}>
                    {r.label}
                    {item.qty>1?` · ×${item.qty}`:''}
                    {item.weight?` · ${item.weight} kg`:''}
                  </div>
                </div>
                <button onClick={()=>setItemViewer(null)}
                  style={{background:'rgba(0,0,0,0.3)',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:16,lineHeight:1,padding:'4px 7px',borderRadius:4,flexShrink:0}}>✕</button>
              </div>
              {/* Body */}
              <div style={{padding:'14px 18px',background:'var(--bg-panel)',display:'flex',gap:14,overflowY:'auto',flex:1}}>
                {item.imageData && (
                  <div style={{flexShrink:0,width:110,height:110,borderRadius:6,overflow:'hidden',border:`2px solid ${r.color}60`,cursor:'zoom-in',background:'var(--bg-void)',display:'flex',alignItems:'center',justifyContent:'center'}}
                    onClick={()=>setImgViewer({name:item.name,imageData:item.imageData})}>
                    <img src={item.imageData} alt={item.name}
                      style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',display:'block'}} />
                  </div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  {item.description && (
                    <div style={{fontFamily:"'Roboto',sans-serif",fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:8}}
                      dangerouslySetInnerHTML={{__html:sanitizeHtml(item.description)}} />
                  )}
                  {item.source && (
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>📦 {item.source}</div>
                  )}
                  {(item.tags||[]).length>0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {(item.tags||[]).map(t=><span key={t} className="inv-tag">{t}</span>)}
                    </div>
                  )}
                  {(item.gearKind || item.setName) && (
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-muted)',marginBottom:6,lineHeight:1.6}}>
                      {item.gearKind && <div>🛡 Platz: <span style={{color:'var(--text-secondary)'}}>{(GEAR_KINDS.find(g=>g.key===item.gearKind)||{}).label}</span>
                        {item.armorType==='shield' && ' · +'+(+item.baseAC||2)+' RK'}
                        {item.armorType && item.armorType!=='shield' && ' · Basis '+(+item.baseAC||0)}
                        {(+item.acBonus||0)!==0 && ' · '+((+item.acBonus)>=0?'+':'')+(+item.acBonus)+' RK magisch'}
                      </div>}
                      {item.setName && <div>✦ Set: <span style={{color:'var(--text-secondary)'}}>{item.setName}</span></div>}
                    </div>
                  )}
                  {(item.effects||[]).length>0 && (() => {
                    // Ein Stueck in einem Platz wirkt, ohne dass jemand es
                    // zusaetzlich einschalten muesste — sonst stuende hier
                    // "Ruht" an einer angelegten Ruestung.
                    const imPlatz = gearWornList.some(x => x.k==='i' && x.obj.id===item.id);
                    const wirkt = imPlatz || !!item.effectsActive;
                    return (
                      <div style={{marginTop:10}}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--arcane-bright)',marginBottom:5}}>✦ Effekte</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:4,opacity:wirkt?1:0.5,marginBottom:7}}>
                          {(item.effects||[]).map(e=><span key={e.id} className="fx-chip">{EFFECT_LABELS[e.target]||e.target} {effectText(e)}</span>)}
                        </div>
                        {imPlatz ? (
                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--gold)'}}>✦ Wirkt, weil angelegt</div>
                        ) : (
                          /* Ein- und ausschalten ohne Umweg über den Bearbeiten-Dialog:
                             ein Amulett legt man im Spiel oft ab und wieder an. */
                          <button className="btn-icon" style={{fontSize:11,padding:'5px 10px'}}
                            onClick={()=>{
                              const next = !item.effectsActive;
                              updItem(item.id,{effectsActive:next});
                              setItemViewer({...item, effectsActive:next});
                            }}>
                            {item.effectsActive ? '✦ Wirkt — ausschalten' : '◇ Ruht — einschalten'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                  {!item.description && !item.source && (item.tags||[]).length===0 && (item.effects||[]).length===0 && (
                    <div style={{fontFamily:"'Roboto',sans-serif",fontSize:13,color:'var(--text-muted)',fontStyle:'italic'}}>Keine weiteren Infos.</div>
                  )}
                </div>
              </div>
              {/* Footer */}
              <div style={{display:'flex',gap:8,padding:'10px 18px',background:'var(--bg-deep)',borderTop:'1px solid var(--border)'}}>
                <button className="btn-icon" style={{flex:1}} onClick={()=>{setItemViewer(null);setItf({...item});setItfEditId(item.id);setShowIF(true);}}>✎ Bearbeiten</button>
                <button style={{padding:'8px 14px',background:'rgba(180,60,60,0.15)',border:'1px solid rgba(180,60,60,0.4)',borderRadius:3,color:'#e07070',cursor:'pointer',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11}}
                  onClick={()=>{setItemViewer(null);delItem(item.id);}}>✕ Löschen</button>
                <button className="btn-cancel" onClick={()=>setItemViewer(null)}>Schließen</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Waffen-Detailansicht — oeffnet sich beim Antippen einer Waffenkarte */}
      {weaponViewer && cur && (() => {
        const w = (cur.weapons||[]).find(x=>x.id===weaponViewer);
        if (!w) return null;
        const { bonus, dmgStr } = weaponStats(w);
        const attrLabel = (WATTRS.find(a=>a.key===(w.attrKey||"str")) || WATTRS[0]).label;
        const dc = DTYPE_COLORS[w.damageType] || "#a07050";
        const stats = [
          {l:"Angriff",   v:(bonus>=0?"+"+bonus:""+bonus), c:"var(--gold)"},
          {l:"Schaden",   v:dmgStr,                        c:"var(--text-primary)"},
          {l:"Schadensart",v:w.damageType||"—",            c:"var(--text-primary)"},
          {l:"Reichweite",v:w.range||"—",                  c:"var(--text-primary)"},
          {l:"Attribut",  v:attrLabel,                     c:"var(--text-primary)"},
          {l:"Übung",     v:w.proficient?"Ja":"Nein",      c:w.proficient?"var(--gold)":"var(--text-muted)"},
        ];
        return (
          <div className="form-overlay" onClick={()=>setWeaponViewer(null)}>
            <div className="form-modal" style={{maxWidth:460,padding:0,overflow:'hidden',maxHeight:'85vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
              {/* Kopf: nach Schadensart getoenter Balken, wie bei den Gegenständen */}
              <div style={{background:`linear-gradient(180deg, ${dc}30 0%, ${dc}14 100%), var(--bg-card)`,borderBottom:`1px solid ${dc}55`,padding:'14px 18px 12px',display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text-primary)',textTransform:'uppercase',letterSpacing:'0.06em',lineHeight:1.3}}>{w.name||"Waffe"}</div>
                  <div style={{fontFamily:"'Roboto',sans-serif",fontSize:12,color:'var(--parchment-dim)',marginTop:4,fontStyle:'italic'}}>
                    {w.equipped ? "Ausgerüstet" : "Abgelegt"}{w.damageType?` · ${w.damageType}`:''}
                  </div>
                </div>
                <button onClick={()=>setWeaponViewer(null)}
                  style={{background:'rgba(0,0,0,0.3)',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:16,lineHeight:1,padding:'4px 7px',borderRadius:4,flexShrink:0}}>✕</button>
              </div>
              {/* Körper */}
              <div style={{padding:'14px 18px',background:'var(--bg-panel)',overflowY:'auto',flex:1}}>
                <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                  {w.imageData && (
                    <div style={{flexShrink:0,width:120,height:120,borderRadius:6,overflow:'hidden',border:'1px solid var(--border)',cursor:'zoom-in',background:'radial-gradient(circle at 50% 45%, var(--bg-hover) 0%, var(--bg-void) 100%)',display:'flex',alignItems:'center',justifyContent:'center'}}
                      onClick={()=>setImgViewer({name:w.name,imageData:w.imageData})}>
                      <img src={w.imageData} alt={w.name}
                        style={{maxWidth:'88%',maxHeight:'88%',objectFit:'contain',display:'block',filter:'drop-shadow(0 3px 7px rgba(0,0,0,0.65))'}} />
                    </div>
                  )}
                  <div style={{flex:1,minWidth:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 10px'}}>
                    {stats.map(s => (
                      <div key={s.l}>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)'}}>{s.l}</div>
                        <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:15,color:s.c,lineHeight:1.3}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(w.effects||[]).length>0 && (
                  <div style={{marginTop:14}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--arcane-bright)',marginBottom:5}}>
                      ✦ Effekte {w.equipped ? '· wirken' : '· ruhen (nicht angelegt)'}
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,opacity:w.equipped?1:0.5}}>
                      {(w.effects||[]).map(e=><span key={e.id} className="fx-chip">{EFFECT_LABELS[e.target]||e.target} {effectText(e)}</span>)}
                    </div>
                  </div>
                )}
                {(w.properties||[]).length>0 && (
                  <div style={{marginTop:14}}>
                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:5}}>Eigenschaften</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {(w.properties||[]).map(p=><span key={p} className="prop-tag">{p}</span>)}
                    </div>
                  </div>
                )}
                {w.description && w.description.trim() && (
                  <div style={{marginTop:14,fontFamily:"'Roboto',sans-serif",fontSize:13,color:'var(--text-secondary)',lineHeight:1.6}}
                    dangerouslySetInnerHTML={{__html:sanitizeHtml(w.description)}} />
                )}
              </div>
              {/* Fuß */}
              <div style={{display:'flex',gap:8,padding:'10px 18px',background:'var(--bg-deep)',borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
                <button className="btn-icon" style={{flex:1}} onClick={()=>toggleEquipped(w.id)}>⚔ {w.equipped?"Ablegen":"Anlegen"}</button>
                <button className="btn-icon" style={{flex:1}} onClick={()=>{setWeaponViewer(null);setWf({...w,properties:w.properties||[]});setWfEditId(w.id);setShowWF(true);}}>✎ Bearbeiten</button>
                <button style={{padding:'8px 14px',background:'rgba(180,60,60,0.15)',border:'1px solid rgba(180,60,60,0.4)',borderRadius:3,color:'#e07070',cursor:'pointer',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11}}
                  onClick={()=>{setWeaponViewer(null);delWeapon(w.id);}}>✕ Löschen</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Viewer Modal */}
      {imgViewer && (
        <div className="form-overlay" style={{background:'rgba(0,0,0,0.85)'}} onClick={()=>setImgViewer(null)}>
          <div style={{maxWidth:'90vw',maxHeight:'90vh',display:'flex',flexDirection:'column',alignItems:'center',gap:12}} onClick={e=>e.stopPropagation()}>
            <img src={imgViewer.imageData} alt={imgViewer.name}
              style={{maxWidth:'85vw',maxHeight:'80vh',objectFit:'contain',borderRadius:8,boxShadow:'0 8px 40px rgba(0,0,0,0.8)',border:'2px solid rgba(232,213,163,0.18)'}} />
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:14,color:'var(--parchment)',letterSpacing:'0.1em',textTransform:'uppercase'}}>{imgViewer.name}</div>
            <button onClick={()=>setImgViewer(null)}
              style={{padding:'6px 20px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,background:'rgba(232,213,163,0.10)',border:'1px solid rgba(232,213,163,0.28)',color:'var(--text-secondary)',borderRadius:4,cursor:'pointer',letterSpacing:'0.08em'}}>
              ✕ Schließen
            </button>
          </div>
        </div>
      )}

      {/* Adventure Log Modal */}
      {showAdventLog && <AdventureLog onClose={()=>setShowAdventLog(false)} isDmMode={isDmMode} />}



      {/* Server Setup Modal */}
      {showDB && (() => {
        // Gegner nur im DM-Modus: sie liegen in einer eigenen Tabelle
        // hinter dem DM-Passwort, damit Spieler die Werte nicht abrufen.
        const types = [{k:'spell',label:'Zauber',icon:'📖'},{k:'weapon',label:'Waffen',icon:'⚔'},{k:'wildshape',label:'Tiere',icon:'🐺'},{k:'item',label:'Gegenstände',icon:'🎒'},{k:'set',label:'Sets',icon:'✦'},
          ...(isDmMode ? [{k:'enemy',label:'Gegner',icon:'💀'},{k:'encounter',label:'Begegnungen',icon:'⚔'}] : [])];
        // Reset search when tab changes
        const wkCurrent = '_dbSearch_'+dbTab;
        const wktCurrent = '_dbTagFilter_'+dbTab;
        const activeLib = isDmMode ? dmLibrary : userLibrary;
        const setActiveLib = isDmMode ? saveDmLibrary : saveLibrary;
        const entries = activeLib[dbTab]||[];
        const SCHOOLS = ['Verzauberung','Beschwörung','Verwandlung','Nekromantie','Hervorrufung','Illusion','Erkenntnis','Bann'];
        const DMG_TYPES = ['Hieb','Stich','Wucht','Feuer','Kälte','Blitz','Säure','Gift','Nekro','Psycho','Energie','Kraft'];
        const WPN_PROPS = ['Finesse','Weit','Leicht','Schwer','Werfbar','Zweihändig','Vielseitig','Ladezeit','Besondere'];
        return (
          <div className="form-overlay">
            <div className="form-modal" style={{maxWidth:600,height:'85vh',display:'flex',flexDirection:'column'}}>
              <div className="form-title">📚 Datenbank verwalten {isDmMode && <span style={{fontSize:11,color:'#c060a0',fontFamily:"'Roboto Condensed',sans-serif",marginLeft:8}}>🔮 DM-Modus</span>}</div>

              {/* Tabs */}
              {/* Mit sieben Reitern reicht die Breite nicht mehr fuer alle
                  Woerter nebeneinander: statt sie umbrechen zu lassen,
                  darf die Zeile seitlich scrollen. */}
              <div className="db-reiter">
                {types.map(t=>(
                  <button key={t.k} onClick={()=>{setDbTab(t.k);setDbForm(null);setDbFormId(null);setDbGradeFilter('');setDbExpandedEntry(null);}}
                    style={{flex:'1 0 auto',whiteSpace:'nowrap',padding:'7px 9px',fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,cursor:'pointer',border:'1px solid',borderRadius:4,
                      borderColor:dbTab===t.k?'var(--gold)':'var(--border)',
                      background:dbTab===t.k?'var(--bg-panel)':'var(--bg-card)',
                      color:dbTab===t.k?'var(--gold)':'var(--text-muted)'}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Gegner haben eine eigene Ablage und deshalb eine eigene
                  Liste — die generische darunter arbeitet auf der
                  Bibliothek, in der Gegner bewusst nicht liegen. */}
              {dbTab==='encounter' ? (
                <BegegnungListe
                  encounters={encounters} enemies={enemies}
                  abenteuer={abenteuer} advId={advId}
                  nurAktives={encNurAktives} setNurAktives={setEncNurAktives}
                  onBearbeiten={b=>setEncForm({...b})}
                  onLoeschen={deleteEncounter}
                  onNeu={()=>setEncForm(newEncounter(advId))} />
              ) : dbTab==='enemy' ? (
                <GegnerListe
                  enemies={enemies} geladen={enemiesGeladen}
                  suche={enemySuche} setSuche={setEnemySuche}
                  crFilter={enemyCr} setCrFilter={setEnemyCr}
                  tagFilter={enemyTag} setTagFilter={setEnemyTag}
                  onAnsehen={g=>setEnemyView(g)}
                  onNeu={()=>setEnemyForm(newEnemy())}
                  onImport={importEnemies} importBusy={enemyImportBusy} />
              ) : dbForm ? (
                <div style={{flex:1,overflowY:'auto'}}>
                  <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:12,color:'var(--gold)',marginBottom:12}}>{dbFormId?'Eintrag bearbeiten':'Neuer Eintrag'}</div>

                  {/* SPELL FORM */}
                  {dbTab==='spell' && (
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <div className="form-label">Name</div>
                        <input className="form-input" value={dbForm.name} onChange={e=>setDbForm(f=>({...f,name:e.target.value}))} placeholder="Zaubername" autoFocus/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Grad</div>
                        <select className="form-select" value={dbForm.level} onChange={e=>setDbForm(f=>({...f,level:+e.target.value}))}>
                          <option value={0}>Zaubertrick</option>
                          {[1,2,3,4,5,6,7,8,9].map(l=><option key={l} value={l}>Grad {l}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Schule</div>
                        <select className="form-select" value={dbForm.school} onChange={e=>setDbForm(f=>({...f,school:e.target.value}))}>
                          {SCHOOLS.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Wirkzeit</div>
                        <input className="form-input" value={dbForm.castingTime} onChange={e=>setDbForm(f=>({...f,castingTime:e.target.value}))} placeholder="1 Aktion"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Reichweite</div>
                        <input className="form-input" value={dbForm.range} onChange={e=>setDbForm(f=>({...f,range:e.target.value}))} placeholder="9 m"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Dauer</div>
                        <input className="form-input" value={dbForm.duration} onChange={e=>setDbForm(f=>({...f,duration:e.target.value}))} placeholder="Sofort"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Komponenten</div>
                        <input className="form-input" value={dbForm.components} onChange={e=>setDbForm(f=>({...f,components:e.target.value}))} placeholder="V, S, M (...)"/>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Beschreibung</div>
                        <textarea className="form-textarea" rows={5} style={{resize:'vertical'}} value={dbForm.description} onChange={e=>setDbForm(f=>({...f,description:e.target.value}))}/>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Klassen</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:4}}>
                          {['Artifizient', 'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Kämpfer', 'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer'].map(c=>{
                            const cc={'Artifizient':'#70b8c8','Barbar':'#c84040','Barde':'#4090c0','Druide':'#52b788','Hexenmeister':'#9060c0','Kämpfer':'#c08040','Kleriker':'#e0c040','Magier':'#6080d0','Mönch':'#d09040','Paladin':'#e0a030','Schurke':'#808080','Waldläufer':'#70a050','Zauberer':'#c060a0'};const col=cc[c]||'#c9a84c';const on=(dbForm.classes||[]).includes(c);
                            return <button key={c} type="button" onClick={()=>setDbForm(f=>({...f,classes:on?(f.classes||[]).filter(x=>x!==c):[...(f.classes||[]),c]}))}
                              style={{padding:'2px 9px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',border:'1px solid '+(on?col:col+'40'),background:on?col+'22':'var(--bg-card)',color:on?col:'var(--text-muted)'}}>{c}</button>;
                          })}
                        </div>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Schadenstypen</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:4}}>
                          {['Feuer', 'Kälte', 'Blitz', 'Säure', 'Gift', 'Nekrotisch', 'Gleißend', 'Psychisch', 'Energie', 'Schall', 'Hieb', 'Stich', 'Wucht'].map(d=>{
                            const on=(dbForm.damageTags||[]).includes(d);
                            const dc={Feuer:'#e07030',Kälte:'#70b8d8',Blitz:'#c0d850',Säure:'#90c040',Gift:'#80b030',Nekrose:'#9060c0',Strahlend:'#f0e060',Psychisch:'#c070d0',Kraft:'#80a0f0',Hieb:'#a07050',Stich:'#b08060',Wucht:'#c09070'}[d]||'#aaa';
                            return <button key={d} type="button" onClick={()=>setDbForm(f=>({...f,damageTags:on?(f.damageTags||[]).filter(x=>x!==d):[...(f.damageTags||[]),d]}))}
                              style={{padding:'2px 9px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',border:`1px solid ${on?dc:dc+'40'}`,background:on?dc+'22':'var(--bg-card)',color:on?dc:'var(--text-muted)'}}>⚔️ {d}</button>;
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WEAPON FORM */}
                  {dbTab==='weapon' && (
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <div className="form-label">Name</div>
                        <input className="form-input" value={dbForm.name} onChange={e=>setDbForm(f=>({...f,name:e.target.value}))} placeholder="Waffenname" autoFocus/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Schaden</div>
                        <input className="form-input" value={dbForm.damage} onChange={e=>setDbForm(f=>({...f,damage:e.target.value}))} placeholder="1W8"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Schadensart</div>
                        <select className="form-select" value={dbForm.damageType} onChange={e=>setDbForm(f=>({...f,damageType:e.target.value}))}>
                          {DMG_TYPES.map(d=><option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Reichweite</div>
                        <input className="form-input" value={dbForm.range||''} onChange={e=>setDbForm(f=>({...f,range:e.target.value}))} placeholder="1,5 m"/>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Eigenschaften</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                          {WPN_PROPS.map(p=>{
                            const on=(dbForm.properties||[]).includes(p);
                            return <button key={p} onClick={()=>setDbForm(f=>({...f,properties:on?(f.properties||[]).filter(x=>x!==p):[...(f.properties||[]),p]}))}
                              style={{padding:'4px 12px',borderRadius:12,border:'1px solid',fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,cursor:'pointer',
                                borderColor:on?'var(--gold)':'var(--border)',background:on?'var(--bg-panel)':'var(--bg-card)',color:on?'var(--gold)':'var(--text-muted)'}}>{p}</button>;
                          })}
                        </div>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Beschreibung (optional)</div>
                        <textarea className="form-textarea" rows={3} style={{resize:'vertical'}} value={dbForm.description||''} onChange={e=>setDbForm(f=>({...f,description:e.target.value}))}/>
                      </div>
                    </div>
                  )}

                  {/* SET FORM */}
                  {dbTab==='set' && (
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <label className="form-label">Name des Sets</label>
                        <input className="form-input" value={dbForm.name} onChange={e=>setDbForm(f=>({...f,name:e.target.value}))}
                          placeholder="z.B. Hain des Ersten Lichts" autoFocus/>
                        <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic',marginTop:5}}>
                          Genau so muss der Name bei den Gegenständen eingetragen sein, die dazugehören.
                        </div>
                      </div>
                      <div className="form-group form-full">
                        <label className="form-label">Beschreibung (optional)</label>
                        <textarea className="form-input" rows={2} style={{resize:'vertical'}} value={dbForm.description||''}
                          onChange={e=>setDbForm(f=>({...f,description:e.target.value}))}/>
                      </div>
                      <div className="form-group form-full">
                        <label className="form-label">Stufen</label>
                        <div style={{fontSize:11,color:'var(--text-muted)',fontStyle:'italic',marginBottom:8}}>
                          Ab wie vielen getragenen Teilen welche Effekte dazukommen. Erreichte Stufen wirken alle
                          zugleich — wer bei 2 und 4 Teilen etwas hinterlegt, bekommt mit 4 Teilen beides.
                        </div>
                        {(dbForm.stufen||[]).map((st, i) => (
                          <div key={i} style={{border:'1px solid var(--border)',borderRadius:6,padding:'10px 12px',marginBottom:8,background:'var(--bg-card)'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-muted)',letterSpacing:'0.08em',textTransform:'uppercase'}}>Ab</span>
                              <input className="form-input" type="number" min={1} max={15} style={{width:64,padding:'5px 8px',textAlign:'center'}}
                                value={st.teile} aria-label="Anzahl Teile"
                                onChange={e=>setDbForm(f=>({...f,stufen:(f.stufen||[]).map((x,j)=>j===i?{...x,teile:Math.max(1,+e.target.value)}:x)}))}/>
                              <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-muted)'}}>Teilen</span>
                              <button style={{marginLeft:'auto',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:14,padding:'2px 6px'}}
                                title="Stufe entfernen" aria-label={'Stufe ab '+st.teile+' Teilen entfernen'}
                                onClick={()=>setDbForm(f=>({...f,stufen:(f.stufen||[]).filter((_,j)=>j!==i)}))}>✕</button>
                            </div>
                            <EffectEditor effects={st.effects||[]}
                              onChange={v=>setDbForm(f=>({...f,stufen:(f.stufen||[]).map((x,j)=>j===i?{...x,effects:v}:x)}))}
                              hint={'Wirken ab '+st.teile+' getragenen Teilen.'} />
                          </div>
                        ))}
                        <button className="btn-add" style={{width:'100%'}}
                          onClick={()=>setDbForm(f=>{
                            const vorhanden=(f.stufen||[]).map(s=>+s.teile||0);
                            const naechste=Math.min(15,(vorhanden.length?Math.max(...vorhanden):0)+2);
                            return {...f, stufen:[...(f.stufen||[]), {teile:naechste, effects:[]}]};
                          })}>+ Stufe hinzufügen</button>
                      </div>
                    </div>
                  )}

                  {/* WILDSHAPE FORM */}
                  {dbTab==='wildshape' && (
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <div className="form-label">Name</div>
                        <input className="form-input" value={dbForm.name} onChange={e=>setDbForm(f=>({...f,name:e.target.value}))} placeholder="Tiername" autoFocus/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">CR</div>
                        <input className="form-input" value={dbForm.cr} onChange={e=>setDbForm(f=>({...f,cr:e.target.value}))} placeholder="1/4"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Typ</div>
                        <input className="form-input" value={dbForm.type} onChange={e=>setDbForm(f=>({...f,type:e.target.value}))} placeholder="Tier"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Größe</div>
                        <select className="form-select" value={dbForm.size} onChange={e=>setDbForm(f=>({...f,size:e.target.value}))}>
                          {['Winzig','Klein','Mittel','Groß','Riesig','Gigantisch'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <div className="form-label">RK</div>
                        <input className="form-input" type="number" value={dbForm.ac} onChange={e=>setDbForm(f=>({...f,ac:+e.target.value}))}/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">TP</div>
                        <input className="form-input" type="number" value={dbForm.hp} onChange={e=>setDbForm(f=>({...f,hp:+e.target.value}))}/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Bewegung</div>
                        <input className="form-input" value={dbForm.speed} onChange={e=>setDbForm(f=>({...f,speed:e.target.value}))} placeholder="9 m"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Tags (kommagetrennt)</div>
                        <input className="form-input" value={dbForm.tagsStr||''} onChange={e=>setDbForm(f=>({...f,tagsStr:e.target.value}))} placeholder="Schwimmen, Fliegen"/>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Attribute</div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginTop:4}}>
                          {[['str','STR'],['dex','GES'],['con','KON'],['int','INT'],['wis','WEI'],['cha','CHA']].map(([k,l])=>(
                            <div key={k}>
                              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textAlign:'center',marginBottom:3,letterSpacing:'0.1em'}}>{l}</div>
                              <input className="form-input" type="number" min={1} max={30} style={{textAlign:'center',padding:'6px 4px'}} value={dbForm[k]} onChange={e=>setDbForm(f=>({...f,[k]:+e.target.value}))}/>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Sinne</div>
                        <input className="form-input" value={dbForm.senses||''} onChange={e=>setDbForm(f=>({...f,senses:e.target.value}))} placeholder="Dunkelsicht 18 m"/>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Fertigkeiten</div>
                        <input className="form-input" value={dbForm.skills||''} onChange={e=>setDbForm(f=>({...f,skills:e.target.value}))} placeholder="Wahrnehmung +3"/>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Besondere Fähigkeiten (eine pro Zeile)</div>
                        <textarea className="form-textarea" rows={3} style={{resize:'vertical'}} value={dbForm.abilitiesStr||''} onChange={e=>setDbForm(f=>({...f,abilitiesStr:e.target.value}))} placeholder="Amphibisch. Das Tier kann sowohl..."/>
                      </div>
                      <div className="form-group form-full">
                        <div className="form-label">Aktionen</div>
                        {(dbForm.actions||[{name:'',desc:''}]).map((a,i)=>(
                          <div key={i} style={{display:'grid',gridTemplateColumns:'140px 1fr auto',gap:6,marginBottom:6,alignItems:'center'}}>
                            <input className="form-input" placeholder="Name" value={a.name} onChange={e=>setDbForm(f=>({...f,actions:f.actions.map((x,j)=>j===i?{...x,name:e.target.value}:x)}))}/>
                            <input className="form-input" placeholder="Beschreibung" value={a.desc} onChange={e=>setDbForm(f=>({...f,actions:f.actions.map((x,j)=>j===i?{...x,desc:e.target.value}:x)}))}/>
                            <button onClick={()=>setDbForm(f=>({...f,actions:f.actions.filter((_,j)=>j!==i)}))} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:16,padding:'4px 6px'}}>x</button>
                          </div>
                        ))}
                        <button className="btn-add" style={{fontSize:11,padding:'5px 12px'}} onClick={()=>setDbForm(f=>({...f,actions:[...(f.actions||[]),{name:'',desc:''}]}))}>+ Aktion</button>
                      </div>
                    </div>
                  )}

                                    {/* ITEM FORM */}
                  {dbTab==='item' && (
                    <div className="form-grid">
                      <div className="form-group form-full">
                        <label className="form-label">Name</label>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <button type="button" onClick={()=>setShowIconPicker(true)}
                            style={{fontSize:22,width:38,height:38,borderRadius:6,border:'1px solid var(--border)',background:'var(--bg-card)',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}
                            title="Icon wählen">{dbForm.icon||'🎒'}</button>
                          <input className="form-input" style={{flex:1}} value={dbForm.name} onChange={e=>setDbForm(f=>({...f,name:e.target.value}))} placeholder="z.B. Heiltrank" autoFocus/>
                        </div>
                        {showIconPicker && (() => {
                          const ICON_CATS2=[{label:'Waffen',icons:['⚔','🗡','🔪','🪃','🪓','🏹','🔱','⚡','🌟','💥','🔥','❄','☠','🩸']},{label:'Rüstung',icons:['🛡','⛓','🪬','💎','📿','🔮','🧿','🪄','🎭','👑','💍','🧤','🎩','🪖']},{label:'Tränke & Magie',icons:['🧪','🔬','🪄','🔭','📜','📖','🗾','🧲','💡','🕯','🪔','🔦','✨','💫','🌀','♾']},{label:'Natur',icons:['🌿','🍄','🌱','🌾','🍀','🌹','🌻','🍎','🍇','🫙','🌰','🌊','🪨','🌙','☀','⭐']},{label:'Werkzeuge',icons:['🔑','🗝','⛏','🪚','🔧','🪛','🔩','🪤','🧰','🪜','🪣','🧱','💰','👜','🎒','🗃']},{label:'Sonstiges',icons:['💀','👁','🫀','🦷','🧠','🤝','✊','🎲','🎯','🏺','📦','🧲','⚙','🐲','🦄','🦅']}];
                          return (
                            <div className="form-overlay" style={{zIndex:300}} onClick={()=>setShowIconPicker(false)}>
                              <div className="form-modal" style={{maxWidth:340}} onClick={e=>e.stopPropagation()}>
                                <div className="form-title" style={{marginBottom:10}}>Icon wählen</div>
                                {ICON_CATS2.map(cat=>(
                                  <div key={cat.label} style={{marginBottom:8}}>
                                    <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{cat.label}</div>
                                    <div className="icon-picker-grid">
                                      {cat.icons.map(ic=>(
                                        <button key={ic} className={"icon-picker-btn"+((dbForm.icon||'🎒')===ic?" selected":"")}
                                          onClick={()=>{setDbForm(f=>({...f,icon:ic}));setShowIconPicker(false);}}>
                                          {ic}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <div className="form-actions" style={{marginTop:8}}><button className="btn-cancel" onClick={()=>setShowIconPicker(false)}>Schließen</button></div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div><label className="form-label">Seltenheit</label>
                        <select className="form-input" value={dbForm.rarity||'gewöhnlich'} onChange={e=>setDbForm(f=>({...f,rarity:e.target.value}))}>
                          {RARITIES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                      </div>
                      <div><label className="form-label">Gewicht (kg)</label><input className="form-input" value={dbForm.weight||''} onChange={e=>setDbForm(f=>({...f,weight:e.target.value}))} placeholder="0.5"/></div>
                      <div><label className="form-label">Menge (Standard)</label><input className="form-input" type="number" min={1} value={dbForm.qty||1} onChange={e=>setDbForm(f=>({...f,qty:+e.target.value}))}/></div>
                      <div className="form-group form-full"><label className="form-label">Tags <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>(kommagetrennt)</span></label>
                        <input className="form-input" value={(dbForm.tags||[]).join(', ')} onChange={e=>setDbForm(f=>({...f,tags:e.target.value.split(',').map(t=>t.trim()).filter(Boolean)}))} placeholder="z.B. Verbrauchsgut, Magie"/>
                      </div>
                      <div className="form-group form-full">
                        <label className="form-label">Bild (optional)</label>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          {dbForm.imageData && (
                            <div style={{width:60,height:60,borderRadius:4,overflow:'hidden',border:'1px solid var(--border)',flexShrink:0,cursor:'pointer'}}
                              onClick={()=>setImgViewer({name:dbForm.name,imageData:dbForm.imageData})}>
                              <img src={dbForm.imageData} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
                            </div>
                          )}
                          <label style={{cursor:'pointer',flex:1}}>
                            <div className="form-input" style={{textAlign:'center',padding:'8px',cursor:'pointer',color:'var(--text-muted)'}}>
                              {dbForm.imageData ? '🖼 Bild ändern' : '📷 Bild hochladen'}
                            </div>
                            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                              const file=e.target.files?.[0]; if(!file) return;
                              const reader=new FileReader();
                              reader.onload=ev=>{
                                const img=new Image(); img.onload=()=>{
                                  const MAX=1000,scale=img.width>MAX?MAX/img.width:1;
                                  const c=document.createElement('canvas');
                                  c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
                                  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
                                  setDbForm(f=>({...f,imageData:c.toDataURL('image/jpeg',0.85)}));
                                }; img.src=ev.target.result;
                              }; reader.readAsDataURL(file);
                            }}/>
                          </label>
                          {dbForm.imageData && <button type="button" onClick={()=>setDbForm(f=>({...f,imageData:''}))}
                            style={{background:'none',border:'1px solid var(--border)',color:'var(--text-muted)',borderRadius:4,cursor:'pointer',padding:'4px 8px',fontSize:11}}>✕</button>}
                        </div>
                      </div>
                      <div className="form-group form-full"><label className="form-label">Beschreibung</label><textarea className="form-input" rows={3} style={{resize:'vertical'}} value={dbForm.description||''} onChange={e=>setDbForm(f=>({...f,description:e.target.value}))}/></div>
                      <div className="form-group form-full"><label className="form-label">Erhalten durch (optional)</label><input className="form-input" value={dbForm.source||''} onChange={e=>setDbForm(f=>({...f,source:e.target.value}))} placeholder="z.B. Händler, Quest-Belohnung..."/></div>

                      {/* Ab hier das, was den Eintrag zu Ausruestung macht:
                          Platz, Werte und Effekte. Wer den Gegenstand spaeter
                          in sein Inventar uebernimmt, bekommt eine Kopie mit
                          allem davon. */}
                      <div className="form-group">
                        <label className="form-label">Ausrüstungsplatz</label>
                        <select className="form-input" value={dbForm.gearKind||''} onChange={e=>{
                          const k = e.target.value;
                          const art = k==='ruestung' ? (dbForm.armorType && dbForm.armorType!=='shield' ? dbForm.armorType : 'light')
                                    : k==='schild'   ? 'shield' : '';
                          const basis = (ARMOR_KINDS.find(a=>a.key===art)||{}).basis || 0;
                          setDbForm(f=>({...f, gearKind:k, armorType:art, baseAC: art ? (+f.baseAC || basis) : 0}));
                        }}>
                          {GEAR_KINDS.map(g=><option key={g.key} value={g.key}>{g.label}</option>)}
                        </select>
                      </div>
                      {dbForm.gearKind==='ruestung' && (
                        <div className="form-group">
                          <label className="form-label">Rüstungsart</label>
                          <select className="form-input" value={dbForm.armorType||'light'} onChange={e=>{
                            const art=e.target.value;
                            setDbForm(f=>({...f, armorType:art, baseAC:(ARMOR_KINDS.find(a=>a.key===art)||{}).basis||0}));
                          }}>
                            {ARMOR_KINDS.filter(a=>a.key&&a.key!=='shield').map(a=><option key={a.key} value={a.key}>{a.label}</option>)}
                          </select>
                        </div>
                      )}
                      {(dbForm.gearKind==='ruestung'||dbForm.gearKind==='schild') && (
                        <div className="form-group">
                          <label className="form-label">{dbForm.gearKind==='schild'?'Bonus zur RK':'Basis-RK'}</label>
                          <input className="form-input" type="number" min={0} max={25} value={dbForm.baseAC||0}
                            onChange={e=>setDbForm(f=>({...f,baseAC:+e.target.value}))}/>
                        </div>
                      )}
                      {dbForm.gearKind && (
                        <div className="form-group">
                          <label className="form-label">Magischer RK-Bonus</label>
                          <input className="form-input" type="number" min={-5} max={10} value={dbForm.acBonus||0}
                            onChange={e=>setDbForm(f=>({...f,acBonus:+e.target.value}))} placeholder="z.B. +1"/>
                        </div>
                      )}
                      {/* Set-Zugehoerigkeit: hier steht nur, wozu das Stueck
                          gehoert. Was ein Set ab wie vielen Teilen gibt, wird
                          im Set-Register hinterlegt. */}
                      <div className="form-group form-full">
                        <label className="form-label">Gehört zu einem Set (optional)</label>
                        <input className="form-input" list="hb-set-namen" value={dbForm.setName||''}
                          onChange={e=>setDbForm(f=>({...f,setName:e.target.value}))}
                          placeholder="z.B. Hain des Ersten Lichts"/>
                        <datalist id="hb-set-namen">
                          {[...new Set((activeLib.item||[]).map(e=>e.setName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'))
                            .map(n=><option key={n} value={n}/>)}
                        </datalist>
                      </div>
                      <div className="form-group form-full">
                        <label className="form-label">✦ Effekte</label>
                        <EffectEditor effects={dbForm.effects||[]} onChange={v=>setDbForm(f=>({...f,effects:v}))}
                          hint="Wirken, solange das Stück getragen wird." />
                      </div>
                    </div>
                  )}

                  <div className="form-actions" style={{marginTop:16}}>
                    <button className="btn-cancel" onClick={()=>{setDbForm(null);setDbFormId(null);}}>Abbrechen</button>
                    <button className="btn-save" onClick={saveDbEntry}>💾 Speichern</button>
                  </div>
                </div>
              ) : (
                <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
                  {(() => {
                    // Build search/filter state via a local component trick using refs on window
                    const wk = '_dbSearch_'+dbTab;
                    const wkt = '_dbTagFilter_'+dbTab;
                    if (window[wk] === undefined) window[wk] = '';
                    if (window[wkt] === undefined) window[wkt] = [];
                    const q = window[wk];
                    const activeTags = window[wkt];

                    // Collect all tags from entries
                    const allTags = [...new Set(entries.flatMap(e => {
                      if (dbTab==='spell') return [...(e.classes||[]), ...(e.damageTags||[])];
                      if (dbTab==='item') return e.tags||[];
                      if (dbTab==='wildshape') return e.tags||[];
                      if (dbTab==='weapon') return e.properties||[];
                      return [];
                    }))].filter(Boolean).sort();

                            const RARITY_ORDER = {gewöhnlich:0,ungewöhnlich:1,selten:2,sehr_selten:3,legendär:4,artefakt:5};
                            const dbItemSort = window['_dbItemSort_'] || 'name';
                            const sorted = [...entries].sort((a,b)=>{
                              if (dbTab==='item' && dbItemSort==='rarity') {
                                const ra = RARITY_ORDER[a.rarity]??0, rb = RARITY_ORDER[b.rarity]??0;
                                return ra!==rb ? ra-rb : a.name.localeCompare(b.name,'de');
                              }
                              return a.name.localeCompare(b.name,'de');
                            });
                    const filtered = sorted.filter(e => {
                      const matchQ = !q || e.name.toLowerCase().includes(q);
                      if (!matchQ) return false;
                      if (dbTab==='spell' && dbGradeFilter !== '' && String(e.level) !== String(dbGradeFilter)) return false;
                      if (activeTags.length === 0) return true;
                      const eTags = dbTab==='spell' ? [...(e.classes||[]),...(e.damageTags||[])]
                        : dbTab==='item' ? (e.tags||[])
                        : dbTab==='wildshape' ? (e.tags||[])
                        : (e.properties||[]);
                      return activeTags.every(t => eTags.includes(t));
                    });

                    return (
                      <>
                        {/* Search + Tag filter */}
                        <div style={{marginBottom:10,flexShrink:0}}>
                          {/* Row 1: search + grade/rarity filter */}
                          <div style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
                            <input
                              className="form-input"
                              style={{flex:1,padding:'6px 10px',fontSize:13,boxSizing:'border-box',minWidth:0}}
                              placeholder={`${entries.length} Einträge durchsuchen...`}
                              defaultValue={q}
                              onInput={e=>{window[wk]=e.target.value.toLowerCase();setDbListTick(n=>n+1);}}
                            />
                            {dbTab==='spell' && (
                              <select className="tpl-filter-select" style={{flexShrink:0,minWidth:110}}
                                value={dbGradeFilter}
                                onChange={e=>{setDbGradeFilter(e.target.value);setDbListTick(n=>n+1);}}>
                                <option value="">Alle Grade</option>
                                <option value="0">Zaubertrick</option>
                                {[1,2,3,4,5,6,7,8,9].map(l=><option key={l} value={l}>Grad {l}</option>)}
                              </select>
                            )}
                            {dbTab==='item' && (
                              <select className="tpl-filter-select" style={{flexShrink:0,minWidth:120}}
                                defaultValue="name"
                                onChange={e=>{window['_dbItemSort_']=e.target.value;setDbListTick(n=>n+1);}}>
                                <option value="name">A–Z Name</option>
                                <option value="rarity">Seltenheit</option>
                              </select>
                            )}
                          </div>
                          {/* Row 2: full-width add button */}
                          <button className="btn-add" style={{width:'100%',marginBottom:6}}
                            onClick={()=>openDbForm(dbTab,null)}>
                            + Neu
                          </button>
                          {allTags.length>0 && (
                            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                              {allTags.map(t=>{
                                const on = activeTags.includes(t);
                                const col = dbTab==='spell'
                                  ? ({Feuer:'#e07030',Kälte:'#70b8d8',Blitz:'#c0d850',Säure:'#90c040',Gift:'#80b030',Nekrose:'#9060c0',Strahlend:'#f0e060',Psychisch:'#c070d0',Kraft:'#80a0f0',Barde:'#4090c0',Druide:'#52b788',Hexenmeister:'#9060c0',Kleriker:'#e0c040',Magier:'#6080d0',Paladin:'#e0a030',Waldläufer:'#70a050',Zauberer:'#c060a0',Kämpfer:'#c08040',Mönch:'#d09040',Schurke:'#808080',Barbar:'#c84040',Artifizient:'#70b8c8'}[t]||'#c9a84c')
                                  : 'var(--gold)';
                                return (
                                  <button key={t}
                                    onClick={()=>{
                                      window[wkt]=on?activeTags.filter(x=>x!==t):[...activeTags,t];
                                      setDbListTick(n=>n+1);
                                    }}
                                    style={{padding:'2px 8px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',
                                      border:`1px solid ${on?col:col+'50'}`,background:on?col+'20':'transparent',
                                      color:on?col:'var(--text-muted)'}}>
                                    {t}
                                  </button>
                                );
                              })}
                              {activeTags.length>0 && (
                                <button onClick={()=>{window[wkt]=[];setDbListTick(n=>n+1);}}
                                  style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:10,padding:'2px 4px'}}>
                                  ✕ zurücksetzen
                                </button>
                              )}
                            </div>
                          )}
                          {(q||activeTags.length>0) && (
                            <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:"'Roboto Condensed',sans-serif",marginTop:4}}>
                              {filtered.length} / {entries.length} Einträge
                            </div>
                          )}
                        </div>

                        {/* List */}
                        <div style={{overflowY:'auto',flex:1}}>
                          {entries.length===0
                            ? <div style={{color:'var(--text-muted)',fontStyle:'italic',fontSize:13,marginBottom:12}}>Noch keine eigenen Einträge.</div>
                            : filtered.length===0
                              ? <div style={{color:'var(--text-muted)',fontStyle:'italic',fontSize:13}}>Keine Einträge gefunden.</div>
                              : filtered.map((e,i)=>{
                                const expKey = dbTab+':'+e.name;
                                const isExp = dbExpandedEntry === expKey;
                                return (
                                  <div key={i} style={{background:'var(--bg-card)',border:'1px solid '+(isExp?'var(--border-bright)':'var(--border)'),borderRadius:4,marginBottom:6,overflow:'hidden'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',cursor:'pointer'}}
                                      onClick={()=>setDbExpandedEntry(isExp?null:expKey)}>
                                      <div style={{fontSize:10,color:'var(--text-muted)',transition:'transform 0.15s',transform:isExp?'rotate(90deg)':'rotate(0deg)'}}>▶</div>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                                          {dbTab==='item' && <span style={{fontSize:16}}>{e.icon||'🎒'}</span>}
                                          <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:13,color:'var(--text-primary)'}}>{e.name}</div>
                                        </div>
                                        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                                          {dbTab==='spell' && `Grad ${e.level} · ${e.school} · ${e.castingTime}`}
                                          {dbTab==='weapon' && `${e.damage} ${e.damageType}schaden · ${(e.properties||[]).join(', ')||'—'}`}
                                          {dbTab==='wildshape' && `CR ${e.cr} · ${e.size} · RK ${e.ac} · TP ${e.hp}`}
                                          {dbTab==='item' && `${(RARITIES.find(r=>r.key===e.rarity)||RARITIES[0]).label}${e.weight?' · '+e.weight+' kg':''}${e.gearKind?' · '+((GEAR_KINDS.find(g=>g.key===e.gearKind)||{}).label||''):''}`}
                                          {dbTab==='set' && (() => {
                                            const st = (e.stufen||[]).map(s=>+s.teile||0).sort((a,b)=>a-b);
                                            const teile = (activeLib.item||[]).filter(i=>i.setName===e.name).length;
                                            return (st.length ? 'Stufen bei '+st.join(', ')+' Teilen' : 'Noch keine Stufen')
                                                 + ' · ' + teile + ' Gegenstand' + (teile===1?'':'e') + ' in der Datenbank';
                                          })()}
                                        </div>
                                      </div>
                                      <button onClick={ev=>{ev.stopPropagation();openDbForm(dbTab,e);}} style={{background:'none',border:'1px solid var(--border)',borderRadius:3,color:'var(--text-muted)',cursor:'pointer',padding:'4px 9px',fontSize:11}}>✎</button>
                                      <button onClick={ev=>{ev.stopPropagation();deleteDbEntry(dbTab,e.name);}} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'4px 6px',fontSize:14}}>✕</button>
                                    </div>
                                    {isExp && (
                                      <div style={{padding:'8px 12px 10px',borderTop:'1px solid var(--border)',fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>
                                        {dbTab==='spell' && (<>
                                          <div><strong>Reichw.</strong> {e.range||'—'} · <strong>Dauer</strong> {e.duration||'—'} · <strong>Komp.</strong> {e.components||'—'}</div>
                                          {(e.classes||[]).length>0 && <div style={{marginTop:4}}><strong>Klassen:</strong> {e.classes.join(', ')}</div>}
                                          {e.description && <div style={{marginTop:6,fontFamily:"'Roboto',sans-serif",fontSize:13,color:'var(--text-secondary)',whiteSpace:'pre-wrap'}}>{e.description.slice(0,300)}{e.description.length>300?'…':''}</div>}
                                        </>)}
                                        {dbTab==='weapon' && (<>
                                          <div><strong>Reichw.</strong> {e.range||'—'} · <strong>Eigenschaften:</strong> {(e.properties||[]).join(', ')||'—'}</div>
                                          {e.description && <div style={{marginTop:6,whiteSpace:'pre-wrap'}}>{e.description}</div>}
                                        </>)}
                                        {dbTab==='wildshape' && (<>
                                          <div><strong>Bewegung:</strong> {e.speed||'—'} · <strong>Sinne:</strong> {e.senses||'—'}</div>
                                          {e.skills && <div><strong>Fertigk.:</strong> {e.skills}</div>}
                                        </>)}
                                        {dbTab==='set' && (<>
                                          {e.description && <div style={{marginBottom:6}}>{e.description}</div>}
                                          {(e.stufen||[]).slice().sort((a,b)=>(+a.teile||0)-(+b.teile||0)).map((st,si)=>(
                                            <div key={si} style={{marginBottom:5}}>
                                              <strong>{st.teile} Teile:</strong>{' '}
                                              {(st.effects||[]).length===0
                                                ? <span style={{fontStyle:'italic'}}>noch nichts hinterlegt</span>
                                                : (st.effects||[]).map((fxE,fi)=><span key={fi} className="fx-chip">{EFFECT_LABELS[fxE.target]||fxE.target} {effectText(fxE)}</span>)}
                                            </div>
                                          ))}
                                          {(() => {
                                            const teile = (activeLib.item||[]).filter(i=>i.setName===e.name);
                                            return teile.length>0 && (
                                              <div style={{marginTop:6}}>
                                                <strong>Teile:</strong> {teile.map(i=>i.name).join(', ')}
                                              </div>
                                            );
                                          })()}
                                        </>)}
                                        {dbTab==='item' && (<>
                                          <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                                            {e.imageData && (
                                              <img src={e.imageData} style={{width:64,height:64,objectFit:'contain',borderRadius:4,border:'1px solid var(--border)',flexShrink:0,cursor:'zoom-in'}}
                                                onClick={ev=>{ev.stopPropagation();setImgViewer({name:e.name,imageData:e.imageData});}}/>
                                            )}
                                            <div style={{flex:1}}>
                                              {(e.tags||[]).length>0 && <div style={{marginBottom:4}}>{(e.tags||[]).map(t=><span key={t} className="inv-tag">{t}</span>)}</div>}
                                              {e.setName && <div><strong>Set:</strong> {e.setName}</div>}
                                              {e.gearKind && (
                                                <div><strong>Platz:</strong> {(GEAR_KINDS.find(g=>g.key===e.gearKind)||{}).label}
                                                  {e.armorType==='shield' && ' · +'+(+e.baseAC||2)+' RK'}
                                                  {e.armorType && e.armorType!=='shield' && ' · '+((ARMOR_KINDS.find(a=>a.key===e.armorType)||{}).label||'')+', Basis '+(+e.baseAC||0)}
                                                  {(+e.acBonus||0)!==0 && ' · '+((+e.acBonus)>=0?'+':'')+(+e.acBonus)+' RK magisch'}
                                                </div>
                                              )}
                                              {(e.effects||[]).length>0 && (
                                                <div style={{marginTop:4,display:'flex',flexWrap:'wrap',gap:4}}>
                                                  {(e.effects||[]).map((fxE,fi)=><span key={fi} className="fx-chip">{EFFECT_LABELS[fxE.target]||fxE.target} {effectText(fxE)}</span>)}
                                                </div>
                                              )}
                                              {e.source && <div><strong>Erhalten durch:</strong> {e.source}</div>}
                                              {e.description && <div style={{marginTop:4}}>{e.description}</div>}
                                            </div>
                                          </div>
                                        </>)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                          }
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {!dbForm && <div className="form-actions" style={{marginTop:12,flexShrink:0}}>
                <button className="btn-cancel" onClick={()=>setShowDB(false)}>Schließen</button>
              </div>}
            </div>
          </div>
        );
      })()}

      {confirmDlg && (
        <div className="form-overlay" style={{zIndex:200}}>
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-msg">{confirmDlg.msg}</div>
            <div className="confirm-actions">
              {confirmDlg.onOk && <button className="confirm-cancel" onClick={()=>setConfirmDlg(null)}>Abbrechen</button>}
              <button className="confirm-ok" onClick={()=>{if(confirmDlg.onOk)confirmDlg.onOk();setConfirmDlg(null);}}>{confirmDlg.okLabel||'Bestätigen'}</button>
            </div>
          </div>
        </div>
      )}


      {showDmLogin && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:380}}>
            <div className="form-title" style={{color:'#c060a0'}}>🔮 DM-Modus betreten</div>
            <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:16,fontFamily:"'Roboto',sans-serif"}}>
              Gib das DM-Passwort ein um Zugriff auf den Dungeon Master Bereich zu erhalten.
            </div>
            <div className="form-group">
              <div className="form-label">DM-Passwort</div>
              <input className="form-input" type="password" autoFocus
                value={dmLoginInput}
                onChange={e=>setDmLoginInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&doDmLogin()}
                placeholder="DM-Passwort eingeben..." />
            </div>
            {dmLoginErr && (
              <div style={{background:"#3a1010",border:"1px solid var(--crimson)",borderRadius:4,padding:"8px 12px",fontSize:13,color:"#e87070",marginBottom:8}}>
                ⚠️ {dmLoginErr}
              </div>
            )}
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>setShowDmLogin(false)}>Abbrechen</button>
              <button className="btn-save" style={{background:'linear-gradient(135deg,#6030a0,#402070)',borderColor:'#c060a0'}} onClick={doDmLogin}>
                🔮 Einloggen
              </button>
            </div>
          </div>
        </div>
      )}

      {showAutomat && <AutomatSchirm onSchliessen={()=>setShowAutomat(false)} />}

      {advEinstellung && isDmMode && (
        <AbenteuerEinstellungen
          adv={advEinstellung}
          helden={chars.filter(c => (c.adventure||(abenteuer[0]||{}).id) === advEinstellung.id)}
          onAendern={setAdvEinstellung}
          onAbbrechen={()=>setAdvEinstellung(null)}
          onSpeichern={()=>{
            // Leere Klassennamen fallen weg, sonst stuende eine namenlose
            // Zeile im Auswahlfeld des Bogens.
            const geputzt = {...advEinstellung};
            if (Array.isArray(geputzt.klassen)) {
              geputzt.klassen = geputzt.klassen.filter(k => (k.name||'').trim())
                .map(k => ({name:k.name.trim(), color:k.color||'#8b9198'}));
              if (!geputzt.klassen.length) delete geputzt.klassen;
            }
            advSpeichern(abenteuer.map(a => a.id===geputzt.id ? geputzt : a));
            setAdvEinstellung(null);
          }} />
      )}

      {ereignisForm && isDmMode && (
        <EreignisFormular
          ereignis={ereignisForm.e} neu={ereignisForm.neu}
          chronik={chronik} advId={advId} abenteuer={abenteuer} chars={chars}
          onAendern={(e)=>setEreignisForm(f=>({...f, e}))}
          onSpeichern={()=>ereignisSpeichern(ereignisForm.e)}
          onAbbrechen={()=>setEreignisForm(null)} />
      )}

      {zeitOffen && isDmMode && (
        <ZeitDialog
          chronik={chronik} advId={advId} chars={chars}
          onAnwenden={zeitAnwenden}
          onUhrStellen={uhrStellen}
          onAbbrechen={()=>setZeitOffen(false)} />
      )}

      {showKampf && isDmMode && (
        <KampfAnsicht
          kampf={kampf} setKampf={setKampf}
          enemies={enemies} encounters={encounters}
          helden={advChars.filter(c => !c.archived && (c.dmOnly !== true || isDmMode))}
          setDefs={setDefs} abenteuer={abenteuer} advId={advId}
          onSchliessen={()=>setShowKampf(false)}
          onGegnerBlatt={(id)=>{ const g = enemies.find(e=>e.id===id); if (g) setEnemyView(g); }}
          onHeldAendern={heldImKampfAendern}
          onBeenden={()=>appConfirm(
            'Kampf beenden? Die Trefferpunkte stehen schon in den Bögen — es geht nichts verloren.',
            ()=>{ setKampf(null); setShowKampf(false); }, 'Beenden')} />
      )}

      {encForm && (
        <BegegnungFormular form={encForm} setForm={setEncForm}
          enemies={enemies} abenteuer={abenteuer}
          neu={!encounters.some(x=>x.id===encForm.id)}
          onAbbrechen={()=>setEncForm(null)}
          onSpeichern={async ()=>{
            if (!encForm.name.trim()) { appAlert('Die Begegnung braucht einen Namen.'); return; }
            if (await saveEncounter(encForm)) setEncForm(null);
          }} />
      )}

      {/* Gegner ansehen und bearbeiten */}
      {enemyView && !enemyForm && (
        <GegnerBlatt gegner={enemyView}
          onSchliessen={()=>setEnemyView(null)}
          onBearbeiten={()=>setEnemyForm({...enemyView})}
          onBild={setImgViewer}
          onLoeschen={()=>{ const id=enemyView.id; setEnemyView(null); deleteEnemy(id); }} />
      )}
      {enemyForm && (
        <GegnerFormular form={enemyForm} setForm={setEnemyForm}
          neu={!enemies.some(x=>x.id===enemyForm.id)}
          onAbbrechen={()=>setEnemyForm(null)}
          onSpeichern={async ()=>{
            if (!enemyForm.name.trim()) { appAlert('Der Gegner braucht einen Namen.'); return; }
            const gespeichert = await saveEnemy(enemyForm);
            if (gespeichert) { setEnemyView(enemyForm); setEnemyForm(null); }
          }} />
      )}

      {/* Abenteuer verwalten */}
      {showAdvVerwaltung && (
        <div className="form-overlay" onClick={()=>setShowAdvVerwaltung(false)}>
          <div className="form-modal" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div className="form-title">🗺 Abenteuer</div>
            <p style={{fontSize:12.5,color:'var(--text-muted)',lineHeight:1.6,marginBottom:14}}>
              Jedes Abenteuer hat eigene Helden. Zauber, Waffen und Gegenstände aus der
              Datenbank gelten weiterhin für alle — ein Heiltrank ist in jeder Kampagne derselbe.
            </p>
            <div className="adv-verwaltung">
              {abenteuer.map((a,i) => {
                const helden = chars.filter(c => (c.adventure||abenteuer[0].id) === a.id);
                return (
                  <div className="adv-zeile" key={a.id}>
                    <input className="adv-zeile-name" defaultValue={a.name} key={'n_'+a.id}
                      aria-label={'Name des Abenteuers '+a.name}
                      onBlur={e=>{
                        const name = e.target.value.trim();
                        if (!name || name === a.name) { e.target.value = a.name; return; }
                        advSpeichern(abenteuer.map(x => x.id===a.id ? {...x, name} : x));
                      }} />
                    <span className="adv-zeile-zahl">{helden.length} {helden.length===1?'Held':'Helden'}</span>
                    {isDmMode && (
                      <button className="adv-zeile-einst" aria-label={'Einstellungen für '+a.name}
                        title="Einstellungen"
                        onClick={()=>{setShowAdvVerwaltung(false);setAdvEinstellung({...a});}}>⚙</button>
                    )}
                    <button className="adv-zeile-del" aria-label={'Abenteuer '+a.name+' löschen'}
                      title={helden.length ? 'Erst die Helden verschieben oder löschen'
                            : abenteuer.length<2 ? 'Das letzte Abenteuer bleibt' : 'Abenteuer löschen'}
                      disabled={helden.length>0 || abenteuer.length<2}
                      onClick={()=>appConfirm('Abenteuer „'+a.name+'“ löschen?', ()=>{
                        const rest = abenteuer.filter(x=>x.id!==a.id);
                        advSpeichern(rest);
                        if (advId === a.id) advWechseln(rest[0].id);
                      }, 'Löschen')}>✕</button>
                  </div>
                );
              })}
            </div>
            <button className="btn-add" style={{width:'100%',marginTop:10}}
              onClick={()=>{
                const id = 'adv_' + Date.now().toString(36);
                advSpeichern([...abenteuer, {id, name:'Neues Abenteuer'}]);
                advWechseln(id);
                setShowAdvVerwaltung(false);
              }}>+ Neues Abenteuer</button>
            {cur && abenteuer.length > 1 && (
              <div className="adv-verschieben">
                <div className="form-label">„{cur.name}“ verschieben nach</div>
                <select className="form-select" value={cur.adventure||abenteuer[0].id}
                  onChange={e=>{ patchChar({adventure:e.target.value}); advWechseln(e.target.value); setShowAdvVerwaltung(false); }}>
                  {abenteuer.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-actions">
              <button className="btn-cancel" onClick={()=>setShowAdvVerwaltung(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {showSetup && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:460}}>
            <div className="form-title">☁️ Server-Sync einrichten</div>
            <p style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.6,marginBottom:16}}>
              Charaktere werden auf deinem eigenen Server gespeichert und sind auf jedem Gerät verfügbar.
              Jede Gruppe hat einen eindeutigen <strong style={{color:"var(--text-secondary)"}}>Code</strong> und ein <strong style={{color:"var(--text-secondary)"}}>Passwort</strong>.
            </p>
            {/* Mode Toggle */}
            <div style={{display:"flex",gap:0,marginBottom:16,borderRadius:4,overflow:"hidden",border:"1px solid var(--border)"}}>
              {[["login","🔑 Anmelden"],["register","✦ Neue Gruppe"]].map(([m,l])=>(
                <button key={m} onClick={()=>{setSetupMode(m);setSetupErr('');}}
                  style={{flex:1,padding:"9px 4px",fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,letterSpacing:"0.08em",
                    cursor:"pointer",border:"none",
                    background:setupMode===m?"var(--gold-dim)":"var(--bg-card)",
                    color:setupMode===m?"var(--gold-bright)":"var(--text-muted)"}}>
                  {l}
                </button>
              ))}
            </div>
            <div className="form-grid" style={{gridTemplateColumns:"1fr"}}>
              <div className="form-group">
                <div className="form-label">Server URL</div>
                <input className="form-input" placeholder="https://deine-domain.de" value={setupForm.url}
                  onChange={e=>setSetupForm({...setupForm,url:e.target.value})} />
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>URL deines Webhostings, wo api.php liegt</div>
              </div>
              <div className="form-group">
                <div className="form-label">Gruppen-Code</div>
                <input className="form-input" placeholder="z.B. ABENTEURER" maxLength={20}
                  value={setupForm.code}
                  onChange={e=>setSetupForm({...setupForm,code:e.target.value.toUpperCase()})}
                  style={{fontFamily:"'Roboto Condensed',sans-serif",letterSpacing:"0.1em"}} />
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>Buchstaben, Zahlen, - und _ erlaubt</div>
              </div>
              <div className="form-group">
                <div className="form-label">Passwort</div>
                <input className="form-input" type="password" placeholder="Mind. 6 Zeichen"
                  value={setupForm.pass}
                  onChange={e=>setSetupForm({...setupForm,pass:e.target.value})} />
              </div>
              {setupMode==='register' && (
                <div className="form-group form-full">
                  <div className="form-label">🔮 DM-Passwort <span style={{fontSize:10,color:'var(--text-muted)',fontStyle:'italic'}}>(optional — für Dungeon Master Bereich)</span></div>
                  <input className="form-input" type="password" placeholder="DM-Passwort (optional)"
                    value={setupForm.dmPass||''}
                    onChange={e=>setSetupForm({...setupForm,dmPass:e.target.value})} />
                </div>
              )}
            </div>
            {setupErr && (
              <div style={{background:"#3a1010",border:"1px solid var(--crimson)",borderRadius:4,padding:"8px 12px",fontSize:13,color:"#e87070",marginBottom:8}}>
                ⚠️ {setupErr}
              </div>
            )}
            <div className="form-actions">
              {svCode && <button className="btn-cancel" onClick={()=>setShowSetup(false)}>Abbrechen</button>}
              <button className="btn-save" style={{flex:1,opacity:setupBusy?0.6:1}} onClick={applySetup} disabled={setupBusy}>
                {setupBusy ? "Verbinde..." : setupMode==="register" ? "✦ Gruppe erstellen & verbinden" : "🔑 Anmelden"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Template Picker Modal */}
      {showTpl && tplData && (
        <div className="form-overlay">
          <div className="form-modal" style={{maxWidth:580}}>
            <div className="form-title">
              {showTpl==='spell' ? '📖 Zauber aus SRD wählen' : showTpl==='wildshape' ? '🐺 Tierverwandlung – Bestiar' : '📖 Waffe aus SRD wählen'}
              <span style={{fontSize:11,fontFamily:"'Roboto',sans-serif",color:"var(--text-muted)",marginLeft:10,fontWeight:"normal"}}>SRD 5.1 – Creative Commons</span>
            </div>
            <div className="tpl-search-bar">
              <input className="tpl-search-input" placeholder="Suchen..." autoFocus
                value={tplSearch} onChange={e=>setTplSearch(e.target.value)} />
              {showTpl==='spell' && (
                <select className="tpl-filter-select" value={tplFilter} onChange={e=>setTplFilter(e.target.value)}>
                  <option value="all">Alle Grade</option>
                  <option value="0">Zaubertricks</option>
                  {[1,2,3,4,5,6,7,8,9].map(l=><option key={l} value={l}>Grad {l}</option>)}
                </select>
              )}
            </div>
            {showTpl==='wildshape' && tplData && tplData.wildshapes && (() => {
              const allCRs = ['0','1/8','1/4','1/2','1','2','3','5','6','8'];
              const allTags = [...new Set(tplData.wildshapes.flatMap(w=>w.tags))].sort();
              const filtered = fuzzyFilter(
                tplData.wildshapes.filter(w =>
                  (wsFilter.cr==='all' || w.cr===wsFilter.cr) &&
                  (wsFilter.tag==='all' || w.tags.includes(wsFilter.tag))
                ),
                tplSearch,
                w => [w.name, w.type, ...w.tags, w.size]
              );
              const statMod = v => { const m=Math.floor((v-10)/2); return (m>=0?'+':'')+m; };
              return (
                <>
                  <div className="ws-filters">
                    <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:"var(--text-muted)",alignSelf:"center"}}>CR:</span>
                    {['all',...allCRs].map(cr => (
                      <button key={cr} className={"ws-filter-btn"+(wsFilter.cr===cr?" active":"")} onClick={()=>setWsFilter(f=>({...f,cr:cr}))}>{cr==='all'?'Alle':cr}</button>
                    ))}
                  </div>
                  <div className="ws-filters">
                    <span style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:10,color:"var(--text-muted)",alignSelf:"center"}}>Tag:</span>
                    {['all',...allTags].map(tag => (
                      <button key={tag} className={"ws-filter-btn"+(wsFilter.tag===tag?" active":"")} onClick={()=>setWsFilter(f=>({...f,tag:tag}))}>{tag==='all'?'Alle':tag}</button>
                    ))}
                  </div>
                  <div className="tpl-count">{filtered.length + (userLibrary.wildshape||[]).length} Tiere gefunden</div>
                  <div className="tpl-list">
                    {(userLibrary.wildshape||[]).filter(w=>fuzzyFilter([w],tplSearch,x=>[x.name,x.type,...(x.tags||[])]).length>0).map((w,i) => {
                      const isExp = wsExpand === ('cust_'+w.name);
                      return (
                        <div key={'c'+i} className={"ws-card"+(isExp?" expanded":"")} style={{borderColor:'var(--gold-dim)'}}>
                          <div className="ws-card-header" onClick={()=>setWsExpand(isExp?null:('cust_'+w.name))}>
                            <div className="ws-cr-badge" style={{borderColor:'var(--gold-dim)',color:'var(--gold)'}}>CR {w.cr}</div>
                            <div style={{flex:1}}>
                              <div className="ws-card-name">{w.name} <span style={{fontSize:9,color:'var(--gold)',fontFamily:"'Roboto Condensed',sans-serif"}}>★</span></div>
                              <div className="ws-card-meta">{w.size} · {w.type} · RK {w.ac} · TP {w.hp}</div>
                              <div className="ws-tags">{(w.tags||[]).map(t=><span className="ws-tag" key={t}>{t}</span>)}</div>
                            </div>
                            <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:4}}>
                              <button style={{background:'none',border:'1px solid var(--border)',borderRadius:3,color:'var(--text-muted)',cursor:'pointer',padding:'3px 7px',fontSize:11}} onClick={()=>{setShowTpl(null);setDbTab('wildshape');openDbForm('wildshape',w);setShowDB(true);}}>✎</button>
                              <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'3px 5px',fontSize:13}} onClick={()=>deleteDbEntry('wildshape',w.name)}>✕</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filtered.map((w,i) => {
                      const isExp = wsExpand === w.name;
                      return (
                        <div key={i} className={"ws-card"+(isExp?" expanded":"")} onClick={()=>setWsExpand(isExp?null:w.name)}>
                          <div className="ws-card-header">
                            <div className="ws-cr-badge">CR {w.cr}</div>
                            <div style={{flex:1}}>
                              <div className="ws-card-name">{w.name}</div>
                              <div className="ws-card-meta">{w.size} · {w.type} · RK {w.ac} · TP {w.hp} · {w.speed}</div>
                              <div className="ws-tags">{w.tags.map(t=><span className="ws-tag" key={t}>{t}</span>)}</div>
                            </div>
                            <button onClick={e=>{e.stopPropagation();toggleWsFav(w.name);}}
                              style={{background:"none",border:"none",cursor:"pointer",fontSize:18,
                                color:(cur.wsFavorites||[]).includes(w.name)?"#f0c040":"var(--border-bright)",
                                padding:"4px 6px",transition:"color 0.15s",lineHeight:1}}
                              title={(cur.wsFavorites||[]).includes(w.name)?"Aus Favoriten entfernen":"Zu Favoriten hinzufügen"}>
                              {(cur.wsFavorites||[]).includes(w.name)?"★":"☆"}
                            </button>
                            <div style={{color:"var(--text-muted)",fontSize:16}}>{isExp?'▲':'▼'}</div>
                          </div>
                          {isExp && (
                            <div style={{marginTop:10}}>
                              <div className="ws-stats-grid">
                                {[['STR',w.str],['GES',w.dex],['KON',w.con],['INT',w.int],['WEI',w.wis],['CHA',w.cha]].map(([l,v])=>(
                                  <div className="ws-stat" key={l}>
                                    <div className="ws-stat-label">{l}</div>
                                    <div className="ws-stat-val">{v}</div>
                                    <div className="ws-stat-mod">{statMod(v)}</div>
                                  </div>
                                ))}
                              </div>
                              {w.senses && <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:4}}>👁 {w.senses}</div>}
                              {w.skills && <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:6}}>🎯 {w.skills}</div>}
                              {w.abilities.length > 0 && (
                                <div className="ws-abilities">
                                  {w.abilities.map((a,ai)=><div key={ai} style={{marginBottom:2}}>• {a}</div>)}
                                </div>
                              )}
                              {w.actions.length > 0 && (
                                <div className="ws-actions">
                                  {w.actions.map((a,ai)=>(
                                    <div className="ws-action" key={ai}>
                                      <div className="ws-action-name">⚔ {a.name}</div>
                                      <div>{a.desc}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            {showTpl==='spell' && (() => {
              const CLASSES_LIST = ['Artifizient', 'Barbar', 'Barde', 'Druide', 'Hexenmeister', 'Kleriker', 'Kämpfer', 'Magier', 'Mönch', 'Paladin', 'Schurke', 'Waldläufer', 'Zauberer'];
              const CLASS_COLORS_MAP = {'Artifizient':'#70b8c8','Barbar':'#c84040','Barde':'#4090c0','Druide':'#52b788','Hexenmeister':'#9060c0','Kämpfer':'#c08040','Kleriker':'#e0c040','Magier':'#6080d0','Mönch':'#d09040','Paladin':'#e0a030','Schurke':'#808080','Waldläufer':'#70a050','Zauberer':'#c060a0'};
              const DMG_LIST = ['Feuer','Kälte','Blitz','Säure','Gift','Nekrotisch','Gleißend','Psychisch','Energie','Schall'];
              const basePre = tplData.spells.filter(s => tplFilter==='all' || s.level===+tplFilter);
              const baseFiltered = basePre.filter(s => {
                const classOk = tplClassFilter.length===0 || tplClassFilter.some(c=>(s.classes||[]).includes(c));
                const dmgOk = tplDmgFilter.length===0 || tplDmgFilter.some(d=>(s.damageTags||[]).includes(d));
                return classOk && dmgOk;
              });
              const filtered = fuzzyFilter(baseFiltered, tplSearch, s => s.name);
              const customSpells = fuzzyFilter((userLibrary.spell||[]).filter(s=>tplFilter==='all'||s.level===+tplFilter), tplSearch, s=>s.name);
              const hasTagFilter = tplClassFilter.length>0 || tplDmgFilter.length>0;
              return (
                <>
                  {/* Class filter row */}
                  <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:6,paddingBottom:6,borderBottom:'1px solid var(--border)'}}>
                    {CLASSES_LIST.map(c=>{
                      const on=tplClassFilter.includes(c);const col=CLASS_COLORS_MAP[c]||'#c9a84c';
                      return <button key={c} onClick={()=>setTplClassFilter(f=>on?f.filter(x=>x!==c):[...f,c])}
                        style={{padding:'2px 8px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',
                          border:'1px solid '+(on?col:col+'40'),background:on?col+'22':'var(--bg-card)',color:on?col:'var(--text-muted)'}}>
                        {c}
                      </button>;
                    })}
                    {DMG_LIST.map(d=>{
                      const on=tplDmgFilter.includes(d);
                      const dc={Feuer:'#e07030',Kälte:'#70b8d8',Blitz:'#c0d850',Säure:'#90c040',Gift:'#80b030',Nekrose:'#9060c0',Strahlend:'#f0e060',Psychisch:'#c070d0',Kraft:'#80a0f0','Schall':'#c0a0e0'}[d]||'#aaa';
                      return <button key={d} onClick={()=>setTplDmgFilter(f=>on?f.filter(x=>x!==d):[...f,d])}
                        style={{padding:'2px 8px',borderRadius:10,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',
                          border:`1px solid ${on?dc:dc+'40'}`,background:on?dc+'22':'var(--bg-card)',color:on?dc:'var(--text-muted)'}}>
                        ⚔️ {d}
                      </button>;
                    })}
                    {hasTagFilter && <button onClick={()=>{setTplClassFilter([]);setTplDmgFilter([]);}}
                      style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:10,fontFamily:"'Roboto Condensed',sans-serif",padding:'2px 6px'}}>
                      ✕ zurücksetzen
                    </button>}
                  </div>
                  <div className="tpl-count">{filtered.length + customSpells.length} Zauber gefunden</div>
                  <div className="tpl-list">
                    {customSpells.length>0 && (<>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--gold)',letterSpacing:'0.15em',marginBottom:6,paddingBottom:4,borderBottom:'1px solid var(--border)'}}>★ EIGENE EINTRÄGE</div>
                      {customSpells.map((s,i) => {
                        const sc = SC[s.school]||SC["Hervorrufung"];
                        return (
                          <div className="tpl-item" key={'c'+i} style={{borderColor:'var(--gold-dim)'}}>
                            <div className="tpl-item-orb" style={{backgroundColor:sc.bg,borderColor:sc.border,color:sc.text}} onClick={()=>pickSpell(s)}>{s.level===0?"∞":s.level}</div>
                            <div className="tpl-item-body" onClick={()=>pickSpell(s)}>
                              <div className="tpl-item-name">{s.name}</div>
                              <div className="tpl-item-meta">{s.school} · {s.castingTime} · {s.components||'—'}</div>
                            </div>
                            <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:4,flexShrink:0}}>
                              <button style={{background:'none',border:'1px solid var(--border)',borderRadius:3,color:'var(--text-muted)',cursor:'pointer',padding:'3px 7px',fontSize:11}} onClick={()=>{setShowTpl(null);setDbTab('spell');openDbForm('spell',s);setShowDB(true);}}>✎</button>
                              <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'3px 5px',fontSize:13}} onClick={()=>deleteDbEntry('spell',s.name)}>✕</button>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{height:1,background:'var(--border)',margin:'8px 0'}}/>
                    </>)}
                    {filtered.map((s,i) => {
                      const sc = SC[s.school]||SC["Hervorrufung"];
                      return (
                        <div className="tpl-item" key={i} onClick={()=>pickSpell(s)}>
                          <div className="tpl-item-orb" style={{backgroundColor:sc.bg,borderColor:sc.border,color:sc.text}}>{s.level===0?"∞":s.level}</div>
                          <div className="tpl-item-body">
                            <div className="tpl-item-name">{s.name}</div>
                            <div className="tpl-item-meta">{s.school} · {s.castingTime} · {s.components||'—'}</div>
                            <div className="tpl-item-desc">{s.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            {showTpl==='weapon' && (() => {
              const filtered = fuzzyFilter(tplData.weapons, tplSearch, w => w.name);
              const customWeapons = fuzzyFilter(userLibrary.weapon||[], tplSearch, w=>w.name);
              return (
                <>
                  <div className="tpl-count">{filtered.length + customWeapons.length} Waffen gefunden</div>
                  <div className="tpl-list">
                    {customWeapons.length>0 && (<>
                      <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--gold)',letterSpacing:'0.15em',marginBottom:6,paddingBottom:4,borderBottom:'1px solid var(--border)'}}>★ EIGENE EINTRÄGE</div>
                      {customWeapons.map((w,i) => (
                        <div className="tpl-item" key={'c'+i} style={{borderColor:'var(--gold-dim)'}}>
                          <div className="tpl-item-orb" style={{backgroundColor:"var(--crimson)",borderColor:"#a02020",color:"#e87070",fontSize:10}} onClick={()=>pickWeapon(w)}>{w.damage}</div>
                          <div className="tpl-item-body" onClick={()=>pickWeapon(w)}>
                            <div className="tpl-item-name">{w.name}</div>
                            <div className="tpl-item-meta">{w.damage} {w.damageType}schaden · {(w.properties||[]).join(', ')||'Keine Eigenschaften'}</div>
                          </div>
                          <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:4,flexShrink:0}}>
                            <button style={{background:'none',border:'1px solid var(--border)',borderRadius:3,color:'var(--text-muted)',cursor:'pointer',padding:'3px 7px',fontSize:11}} onClick={()=>{setShowTpl(null);setDbTab('weapon');openDbForm('weapon',w);setShowDB(true);}}>✎</button>
                            <button style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'3px 5px',fontSize:13}} onClick={()=>deleteDbEntry('weapon',w.name)}>✕</button>
                          </div>
                        </div>
                      ))}
                      <div style={{height:1,background:'var(--border)',margin:'8px 0'}}/>
                    </>)}
                    {filtered.map((w,i) => (
                      <div className="tpl-item" key={i} onClick={()=>pickWeapon(w)}>
                        <div className="tpl-item-orb" style={{backgroundColor:"var(--crimson)",borderColor:"#a02020",color:"#e87070",fontSize:10}}>{w.damage}</div>
                        <div className="tpl-item-body">
                          <div className="tpl-item-name">{w.name}</div>
                          <div className="tpl-item-meta">{w.damage} {w.damageType}schaden · {w.properties.join(', ')||'Keine Eigenschaften'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <div className="form-actions" style={{marginTop:12}}>
              <button className="btn-cancel" onClick={()=>setShowTpl(null)}>Schließen</button>
            </div>
          </div>
        </div>
      )}
    </SheetCtx.Provider>
  );
}

    

    const container = document.getElementById('root');
    const rootEl = ReactDOM.createRoot(container);
    rootEl.render(<App />);
    document.getElementById('loading').style.display = 'none';
    container.style.display = 'block';
