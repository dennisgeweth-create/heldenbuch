// Heldenbuch — Abenteuerlog eines einzelnen Helden (Reiter "Log").

const LogTab = ({charId, isDmMode}) => {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [search,  setSearch]  = React.useState('');
  const [tabFilter, setTabFilter] = React.useState([]);
  const [tabExclude, setTabExclude] = React.useState([]);
  const tabFilterRef  = React.useRef([]);
  const tabExcludeRef = React.useRef([]);

  React.useEffect(() => {
    if (!charId) return;
    setLoading(true);
    const {url, code, pass} = serverCreds();
    if (!url||!code||!pass) { setLoading(false); return; }
    apiLoadLogs(url, code, pass, charId, {limit:100,offset:0,search:'',tabFilter:[]})
      .then(d => { setEntries(d.logs||[]); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [charId]);

  const q = search.toLowerCase();
  // We need to know which chars are DM-only — check from the chars list via closure
  const dmCharIds = new Set(
    JSON.parse(localStorage.getItem('dnd_chars')||'[]')
      .filter(c=>c.dmOnly===true).map(c=>c.id)
  );
  const filtered = entries.filter(e => {
    if (!isDmMode && dmCharIds.has(e.char_id)) return false;
    if (tabFilter.length>0 && !tabFilter.includes(e.tab)) return false;
    if (tabExclude.length>0 && tabExclude.includes(e.tab)) return false;
    if (q && !e.action.toLowerCase().includes(q)) return false;
    return true;
  });

  const fmt = ts => new Date(ts.replace(' ','T')+'Z').toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const tabColor = t => ({'zauber':'#c060a0','inventar':'#e0a030','waffen':'#c84040','charakter':'var(--gold)'}[t]||'var(--border-bright)');

  return (
    <div>
      <div className="section-title" style={{marginBottom:10}}>📋 Änderungslog</div>
      <div style={{display:'flex',gap:6,marginBottom:8}}>
        <input className="form-input" style={{flex:1,padding:'5px 10px',fontSize:12}}
          placeholder="Suchen..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div className="marken-reihe" style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
        {LOG_TABS.map(t=>{
          const inc = tabFilter.includes(t);
          const exc = tabExclude.includes(t);
          return (
            <button key={t} onClick={()=>{
              const curInc = tabFilterRef.current.includes(t);
              const curExc = tabExcludeRef.current.includes(t);
              if (!curInc && !curExc) {
                tabFilterRef.current = [...tabFilterRef.current, t];
                setTabFilter([...tabFilterRef.current]);
              } else if (curInc) {
                tabFilterRef.current = tabFilterRef.current.filter(x=>x!==t);
                setTabFilter([...tabFilterRef.current]);
                tabExcludeRef.current = [...tabExcludeRef.current, t];
                setTabExclude([...tabExcludeRef.current]);
              } else {
                tabExcludeRef.current = tabExcludeRef.current.filter(x=>x!==t);
                setTabExclude([...tabExcludeRef.current]);
              }
            }}
              title={inc?'Klicken zum Ausschließen':exc?'Klicken zum Zurücksetzen':'Klicken zum Einschließen'}
              style={{padding:'3px 8px',borderRadius:12,fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,cursor:'pointer',
                textTransform:'uppercase',letterSpacing:'0.05em',border:'1px solid',
                background:inc?'var(--gold)':exc?'rgba(200,60,60,0.25)':'var(--bg-card)',
                borderColor:inc?'var(--gold)':exc?'#c83c3c':'var(--border)',
                color:inc?'var(--bg-deep)':exc?'#e07070':'var(--text-muted)',
                textDecoration:exc?'line-through':'none'}}>
              {LOG_TAB_ICONS[t]||'📌'} {t}
            </button>
          );
        })}
      </div>
      {loading && <div style={{color:'var(--text-muted)',fontStyle:'italic',fontSize:13}}>Lade...</div>}
      {!loading && filtered.length===0 && <div style={{color:'var(--text-muted)',fontStyle:'italic',fontSize:13}}>Keine Einträge gefunden.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {filtered.map((e,i)=>(
          <div key={i} style={{display:'flex',gap:8,padding:'7px 10px',background:'var(--bg-card)',borderRadius:4,
            borderLeft:'3px solid '+tabColor(e.tab), alignItems:'flex-start'}}>
            <div style={{fontSize:13,flexShrink:0}}>{LOG_TAB_ICONS[e.tab]||'📌'}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:11,color:'var(--text-primary)',lineHeight:1.3}}>{e.action}</div>
              {e.details && Object.keys(e.details).length>0 && (
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>
                  {logEinzelheiten(e.details).join(' · ')}
                </div>
              )}
            </div>
            {/* Rechts steht, wann — und darunter, wer. Die Kennung stand
                seit jeher in der Zeile, herausgegeben wurde sie nie.
                Fehlt sie, ist die Zeile aelter als die Konten oder das
                Konto ist geloescht; dann bleibt der Platz leer. */}
            <div style={{fontFamily:"'Roboto Condensed',sans-serif",fontSize:9,color:'var(--text-muted)',whiteSpace:'nowrap',flexShrink:0,textAlign:'right'}}>
              <div>{fmt(e.created_at)}</div>
              {e.user_name && <div style={{color:'var(--gold-dim)',marginTop:2}}>{e.user_name}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
