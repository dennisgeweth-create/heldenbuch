// Heldenbuch — die Rast.
//
// Die Spielleitung sagt an: kurze oder lange Rast, und unter welchen
// Bedingungen. Jeder Spieler bekommt ein Fenster für seinen Helden und
// entscheidet dort, was er daraus macht — welche Trefferwürfel er wirft,
// welche Zauberplätze er zurückholt. Übernommen wird in den eigenen Bogen.
//
// Zwei Regeln stehen zur Wahl, je Abenteuer (`adv.rastRegel`):
//
//   standard  So, wie es im Regelwerk steht: nach der langen Rast ist
//             alles wieder da.
//   grr       Die Variante „Gradueller Rauer Realismus" (A.B. Funing,
//             DMsGuild). Eine lange Rast gibt nur einen Teil zurück, und
//             wie viel, hängt davon ab, wo und wie gerastet wird. Hier
//             stehen nur ihre Zahlen, nicht ihr Text — nachzulesen ist
//             sie im Heft selbst.

// ── Die Rastbedingungen ─────────────────────────────────────────
// Sieben Stufen. tp: je Charakterstufe zu den Trefferpunkten, tpMin: was
// am Ende mindestens herauskommt; zp: zu den Zauberpunkten; ersch: ob
// eine Erschöpfungsstufe fällt; kompl: ob es Komplikationen gibt.
const RAST_STUFEN = [
  {n: 1, name: 'Erbärmlich', tp: -2, tpMin: 0, zp: -2, ersch: false, kompl: true,
   bsp: 'ungeschützt im Freien, bei schlechtem Wetter'},
  {n: 2, name: 'Ärmlich', tp: -1, tpMin: 1, zp: -1, ersch: false, kompl: false,
   bsp: 'ungeschützt im Freien, das Wetter hält'},
  {n: 3, name: 'Schlecht', tp: -1, tpMin: 1, zp: -1, ersch: true, kompl: false,
   bsp: 'Schlafsack im Freien, oder geschützt in Zelt oder Höhle'},
  {n: 4, name: 'Einfach', tp: 0, tpMin: 1, zp: 0, ersch: true, kompl: false,
   bsp: 'Zelt, Schlafsack und Feuer'},
  {n: 5, name: 'Komfortabel', tp: 1, tpMin: 1, zp: 1, ersch: true, kompl: false,
   bsp: 'Gasthaus, Tempel, Essen und Trinken'},
  {n: 6, name: 'Wohlhabend', tp: 2, tpMin: 1, zp: 2, ersch: true, kompl: false,
   bsp: 'dazu Bedienung und Heilkräuter'},
  {n: 7, name: 'Edel', tp: 4, tpMin: 1, zp: 4, ersch: true, kompl: false,
   bsp: 'das Beste, was eine Stadt zu bieten hat'},
];
const rastStufe = (n) => RAST_STUFEN[Math.max(1, Math.min(7, Math.round(+n || 2))) - 1];

// Die Umstände, aus denen der Rechner einen Vorschlag macht. Die Werte
// sind Stufen: −1 verschlechtert um eine.
const RAST_NIEDERSCHLAG = [
  {k: 'klar',   l: 'Wolkenlos'},
  {k: 'leicht', l: 'Leicht bewölkt'},
  {k: 'wolken', l: 'Bewölkt oder Nebel'},
  {k: 'regen',  l: 'Regen, Hagel, Schnee'},
  {k: 'sturm',  l: 'Starkregen, Hagelsturm, Schneesturm'},
];
const RAST_TEMPERATUR = [
  {k: 'glut',   l: 'Unerträglich heiß', w: -2},
  {k: 'heiss',  l: 'Heiß',              w: -1},
  {k: 'warm',   l: 'Warm',              w: 1},
  {k: 'mild',   l: 'Moderat',           w: 0},
  {k: 'kuehl',  l: 'Kühl',              w: -1},
  {k: 'kalt',   l: 'Kalt',              w: -2},
  {k: 'arktis', l: 'Arktisch kalt',     w: -3},
];
const RAST_WIND = [
  {k: 'flaute', l: 'Flaute'},
  {k: 'maessig', l: 'Mäßiger Wind'},
  {k: 'stark',  l: 'Starker Wind'},
  {k: 'boeen',  l: 'Starke Böen'},
  {k: 'orkan',  l: 'Sturm'},
];
const RAST_MASSNAHMEN = [
  {k: 'feuer',    l: 'Lagerfeuer'},
  {k: 'schlafsack', l: 'Schlafsack oder Bettrolle'},
  {k: 'decke',    l: 'Decke'},
  {k: 'zelt',     l: 'Zelt'},
  {k: 'winter',   l: 'Winterfeste Kleidung'},
  {k: 'schirm',   l: 'Sonnenschirm'},
  {k: 'huette',   l: 'Zauber: Winzige Hütte'},
  {k: 'herrenhaus', l: 'Zauber: Prächtiges Herrenhaus'},
];
const RAST_BASIS = [
  {k: 1, l: 'Erbärmlich'}, {k: 2, l: 'Ärmlich — Wildnis'}, {k: 3, l: 'Schlecht'},
  {k: 4, l: 'Einfach'}, {k: 5, l: 'Komfortabel — Gasthaus'}, {k: 6, l: 'Wohlhabend'},
  {k: 7, l: 'Edel'},
];

// Aus den Umständen die Stufe. Zurück kommen die Stufe und die Posten,
// aus denen sie sich zusammensetzt — die Spielleitung soll sehen, warum
// der Vorschlag lautet, wie er lautet, bevor sie ihn übernimmt oder
// umstellt.
const rastVorschlag = ({basis, niederschlag, temperatur, wind, massnahmen} = {}) => {
  const teile = [];
  const m = new Set(massnahmen || []);
  const b = Math.max(1, Math.min(7, +basis || 2));
  const temp = RAST_TEMPERATUR.find(t => t.k === temperatur) || RAST_TEMPERATUR[3];
  const heiss = temp.k === 'heiss' || temp.k === 'glut';
  const kaltArt = ['kuehl', 'kalt', 'arktis'].includes(temp.k);
  const post = (text, wert) => { if (wert) teile.push({text, wert}); };

  // Die Hütte nimmt dem Wetter alles, das Herrenhaus ist ein Gasthaus.
  if (m.has('herrenhaus')) {
    return {stufe: 5, teile: [{text: 'Prächtiges Herrenhaus: komfortabel', wert: 0}]};
  }
  const ohneWetter = m.has('huette');

  let wetter = 0;
  if (!ohneWetter) {
    // Niederschlag
    if (niederschlag === 'klar' && temp.k === 'glut') post('Wolkenlos bei Glut', -1), wetter -= 1;
    if (niederschlag === 'regen' && temp.k !== 'glut') post('Regen, Hagel oder Schnee', -1), wetter -= 1;
    if (niederschlag === 'sturm') post('Starkregen oder Sturm', -2), wetter -= 2;
    // Temperatur
    if (temp.w) post(temp.l, temp.w), wetter += temp.w;
    // Wind
    if (wind === 'maessig' && (temp.k === 'kalt' || temp.k === 'arktis')) post('Mäßiger Wind bei Kälte', -1), wetter -= 1;
    if (wind === 'maessig' && heiss) post('Mäßiger Wind bei Hitze', 1), wetter += 1;
    if (wind === 'stark' && (temp.k === 'warm' || kaltArt)) post('Starker Wind', -1), wetter -= 1;
    if (wind === 'boeen') post('Starke Böen', -1), wetter -= 1;
    if (wind === 'orkan') post('Sturm', -2), wetter -= 2;
  } else {
    post('Winzige Hütte: das Wetter bleibt draußen', 0);
  }

  // Was die Gruppe dagegen tut.
  let hilfe = 0;
  const hilft = (text, wert) => { post(text, wert); hilfe += wert; };
  if (m.has('feuer') && kaltArt) hilft('Lagerfeuer', 1);
  if (m.has('schlafsack')) {
    if (temp.k === 'glut') hilft('Schlafsack bei Glut', -1);
    else if (temp.k !== 'heiss') hilft('Schlafsack', 1);
  }
  const hatSchlafsack = m.has('schlafsack');
  if (m.has('decke') && kaltArt && (!hatSchlafsack || temp.k !== 'kuehl')) hilft('Decke', 1);
  if (m.has('zelt') && !ohneWetter) {
    if (niederschlag === 'regen' || niederschlag === 'sturm') hilft('Zelt gegen Niederschlag', 1);
    if ((wind === 'maessig' || wind === 'stark') && (temp.k === 'warm' || kaltArt)) hilft('Zelt gegen Wind', 1);
  }
  if (m.has('winter')) {
    if (temp.k === 'kalt' || temp.k === 'arktis') {
      if (!(hatSchlafsack && m.has('decke')) || temp.k === 'arktis') hilft('Winterkleidung', 1);
    } else if (temp.k === 'warm' || heiss) hilft('Winterkleidung bei Wärme', -1);
  }
  if (m.has('schirm') && niederschlag === 'klar' && heiss) hilft('Sonnenschirm', 1);

  return {stufe: Math.max(1, Math.min(7, b + wetter + hilfe)), teile};
};

// ── Trefferwürfel ───────────────────────────────────────────────
// Der Bogen führt, wie viele verbraucht sind, je Würfelgröße — ein
// Paladin 5 / Kleriker 5 hat fünf W10 und fünf W8, und die zählen
// getrennt. Wie viele es insgesamt sind, folgt aus den Klassen.
const trefferwuerfelVorrat = (held) => {
  const je = {};
  charKlassen(held).forEach(k => {
    const w = (KLASSEN_REGELN[k.charClass] || {}).tw || 8;
    je[w] = (je[w] || 0) + k.level;
  });
  const verbraucht = (held && held.trefferwuerfel) || {};
  return Object.keys(je).map(Number).sort((a, b) => b - a).map(w => ({
    w, gesamt: je[w], verbraucht: Math.max(0, Math.min(je[w], +verbraucht[w] || 0)),
  }));
};

// n Trefferwürfel zurück, die größten zuerst.
const trefferwuerfelZurueck = (held, n) => {
  const neu = {...((held && held.trefferwuerfel) || {})};
  let rest = Math.max(0, n);
  trefferwuerfelVorrat(held).forEach(v => {
    const weg = Math.min(rest, v.verbraucht);
    if (weg) { neu[v.w] = v.verbraucht - weg; rest -= weg; }
  });
  return neu;
};

// ── Zauberpunkte ────────────────────────────────────────────────
// Nach der Variante holt ein Zauberwirker nach der langen Rast Plätze
// zurück, deren Grade zusammen höchstens so viel ergeben: volle Klassen
// ihre Stufe, halbe die Hälfte, Drittel-Wirker ein Drittel, jeweils
// aufgerundet. Der Hexenmeister bekommt seine Paktplätze ganz.
const DRITTEL_UNTERKLASSEN = ['Mystischer Ritter', 'Arkaner Betrüger', 'Eldritch Knight', 'Arcane Trickster'];
const zauberpunkteGrund = (held) => {
  let punkte = 0, pakt = false, zaubert = false;
  charKlassen(held).forEach(k => {
    const art = ZAUBER_ART(k.charClass);
    const unter = k.haupt ? (held.subclass || '') : '';
    if (art === 'voll') { punkte += k.level; zaubert = true; }
    else if (art === 'halb' || art === 'artifizient') { if (k.level >= 2 || art === 'artifizient') { punkte += Math.ceil(k.level / 2); zaubert = true; } }
    else if (art === 'pakt') { pakt = true; zaubert = true; }
    else if (DRITTEL_UNTERKLASSEN.includes(unter) && k.level >= 3) { punkte += Math.ceil(k.level / 3); zaubert = true; }
  });
  return {punkte, pakt, zaubert};
};

// Was von einer Auswahl {grad: anzahl} gilt: nur Plätze, die verbraucht
// sind, und zusammen nicht mehr Grade als erlaubt.
const zauberAuswahlSumme = (auswahl) => Object.keys(auswahl || {})
  .reduce((s, g) => s + (+g) * Math.max(0, +auswahl[g] || 0), 0);
const zauberAuswahlGeht = (held, auswahl, budget) => {
  const plaetze = (held && held.spellSlots) || {};
  const ueber = Object.keys(auswahl || {}).some(g =>
    (+auswahl[g] || 0) > (+((plaetze[g] || {}).used) || 0));
  return !ueber && zauberAuswahlSumme(auswahl) <= Math.max(0, budget);
};

// ── Komplikationen ──────────────────────────────────────────────
const RAST_KOMPLIKATIONEN = [
  {w: 1, text: 'Eine Erschöpfungsstufe', ersch: 1},
  {w: 2, text: '1W4 Trefferpunkte verloren', tpW4: true},
  {w: 3, text: 'Vergiftet', zustand: 'Vergiftet'},
  {w: 4, text: 'Mit Gackerfieber angesteckt', krankheit: 'Gackerfieber'},
  {w: 5, text: 'Mit Kanalpest angesteckt', krankheit: 'Kanalpest'},
  {w: 6, text: 'Mit Augenfäule angesteckt', krankheit: 'Augenfäule'},
];

// ── Was eine Rast mit einem Bogen macht ─────────────────────────
// Rein und ohne Würfel: gewürfelt wird im Fenster, und hier kommt an,
// was gefallen ist. Zurück kommen der Patch für den Bogen und die Sätze,
// die die Spielleitung als Antwort sieht.
//
//   rast   {art: 'kurz'|'lang', regel: 'standard'|'grr', stufe, essen}
//   wahl   {plaetze: {grad: n}, wuerfe: [{w, wurf}], rw, w6, w4}
const rastAnwenden = (held, werte, rast, wahl = {}) => {
  const c = held || {};
  const w = werte || charWerte(c, {});
  const con = mod((w.eff || {}).con || c.con || 10);
  const maxHp = +w.maxHp || +c.maxHp || 1;
  const stufe = gesamtStufe(c);
  const grr = rast.regel === 'grr';
  const patch = {};
  const saetze = [];
  const resources = (c.resources || []);

  // Die Trefferwürfel, die jemand wirft — gilt für die kurze Rast.
  const wuerfe = (wahl.wuerfe || []).filter(x => x && +x.w);
  const wuerfelSumme = wuerfe.reduce((s, x) => s + Math.max(0, (+x.wurf || 0) + con), 0);
  const verbraucht = {...(c.trefferwuerfel || {})};
  wuerfe.forEach(x => { verbraucht[x.w] = (+verbraucht[x.w] || 0) + 1; });

  if (rast.art === 'kurz') {
    if (wuerfe.length) {
      patch.trefferwuerfel = verbraucht;
      if (grr) {
        // Erste Hilfe statt Heilung: temporäre Trefferpunkte, die sich
        // nicht zu vorhandenen addieren.
        const temp = Math.max(+c.tempHp || 0, wuerfelSumme);
        patch.tempHp = temp;
        saetze.push(wuerfe.length + ' Trefferwürfel · ' + wuerfelSumme + ' temporäre TP');
      } else {
        patch.hp = Math.min(maxHp - (+c.tempMaxHp || 0), (+c.hp || 0) + wuerfelSumme);
        saetze.push(wuerfe.length + ' Trefferwürfel · +' + wuerfelSumme + ' TP');
      }
    }
    const kurzRes = resources.some(r => r.restType === 'kurz' && +r.used);
    if (kurzRes) {
      patch.resources = resources.map(r => r.restType === 'kurz' ? {...r, used: 0} : r);
      saetze.push('Kurzrast-Ressourcen zurück');
    }
    // Der Paktmagier holt seine Plätze schon nach der kurzen Rast.
    if (zauberpunkteGrund(c).pakt && !grr) {
      const p = zauberPlaetzeGemischt(charKlassen(c).filter(k => ZAUBER_ART(k.charClass) === 'pakt')) || {};
      const slots = {...(c.spellSlots || {})};
      let n = 0;
      Object.keys(p).forEach(g => { if (p[g] && slots[g] && +slots[g].used) { n += Math.min(p[g], +slots[g].used); slots[g] = {...slots[g], used: Math.max(0, +slots[g].used - p[g])}; } });
      if (n) { patch.spellSlots = slots; saetze.push(n + ' Paktplatz' + (n === 1 ? '' : 'plätze') + ' zurück'); }
    }
    if (!saetze.length) saetze.push('Kurze Rast, nichts verbraucht');
    return {patch, saetze};
  }

  // ── Lange Rast ──
  if (rast.essen === false) {
    saetze.push('Ohne Essen und Trinken — die lange Rast bringt nichts');
    return {patch, saetze};
  }
  const lageStufe = rastStufe(rast.stufe);
  let ersch = Math.max(0, +c.erschoepfung || 0);
  let hp = +c.hp || 0;
  const hpDecke = maxHp - (+c.tempMaxHp || 0);

  if (!grr) {
    patch.hp = hpDecke;
    const vorrat = trefferwuerfelVorrat(c);
    const gesamt = vorrat.reduce((s, v) => s + v.gesamt, 0);
    patch.trefferwuerfel = trefferwuerfelZurueck(c, Math.max(1, Math.floor(gesamt / 2)));
    const slots = {};
    Object.keys(c.spellSlots || {}).forEach(g => { slots[g] = {...c.spellSlots[g], used: 0}; });
    patch.spellSlots = slots;
    if (ersch > 0) { ersch -= 1; saetze.push('Erschöpfung −1'); }
    saetze.unshift('Volle Trefferpunkte, alle Zauberplätze');
  } else {
    // Trefferpunkte nach der Variante
    const jeStufe = 1 + con + lageStufe.tp;
    const gewinn = Math.max(lageStufe.tpMin, jeStufe * stufe);
    hp = Math.min(hpDecke, hp + gewinn);
    patch.hp = hp;
    saetze.push('+' + gewinn + ' TP (' + lageStufe.name + ')');
    patch.trefferwuerfel = trefferwuerfelZurueck(c, 1);
    if (lageStufe.ersch && ersch > 0) { ersch -= 1; saetze.push('Erschöpfung −1'); }
    // Zauberplätze nach Auswahl, Pakt ganz
    const grund = zauberpunkteGrund(c);
    const budget = Math.max(0, grund.punkte + (grund.punkte ? lageStufe.zp : 0));
    const slots = {...(c.spellSlots || {})};
    let zurueck = 0;
    if (grund.punkte && zauberAuswahlGeht(c, wahl.plaetze, budget)) {
      Object.keys(wahl.plaetze || {}).forEach(g => {
        const n = Math.max(0, +wahl.plaetze[g] || 0);
        if (n && slots[g]) { slots[g] = {...slots[g], used: Math.max(0, (+slots[g].used || 0) - n)}; zurueck += n * (+g); }
      });
    }
    if (grund.pakt) {
      const p = zauberPlaetzeGemischt(charKlassen(c).filter(k => ZAUBER_ART(k.charClass) === 'pakt')) || {};
      Object.keys(p).forEach(g => { if (p[g] && slots[g]) slots[g] = {...slots[g], used: Math.max(0, (+slots[g].used || 0) - p[g])}; });
      saetze.push('Paktplätze zurück');
    }
    if (grund.punkte || grund.pakt) patch.spellSlots = slots;
    if (grund.punkte) saetze.push(zurueck + ' von ' + budget + ' Zauberpunkten eingelöst');
  }

  // Was sich über Nacht erholt, gilt für beide Regeln.
  if (resources.some(r => (r.restType === 'lang' || r.restType === 'kurz' || r.restType === 'tag') && +r.used)) {
    patch.resources = resources.map(r => ['lang', 'kurz', 'tag'].includes(r.restType || 'lang') ? {...r, used: 0} : r);
  }
  if (c.sorceryPoints && +c.sorceryPoints.used) patch.sorceryPoints = {...c.sorceryPoints, used: 0};
  patch.deathSaves = {erfolge: 0, fehler: 0};

  // Komplikationen — nur nach der Variante und nur, wenn es erbärmlich war.
  if (grr && lageStufe.kompl && wahl.rw != null && wahl.rw !== '') {
    if (+wahl.rw >= 10) {
      saetze.push('Rettungswurf KON ' + wahl.rw + ' — keine Komplikation');
    } else if (wahl.w6) {
      const k = RAST_KOMPLIKATIONEN[Math.max(1, Math.min(6, +wahl.w6)) - 1];
      saetze.push('Rettungswurf KON ' + wahl.rw + ' misslungen · ' + k.text);
      if (k.ersch) ersch += 1;
      if (k.tpW4) patch.hp = Math.max(0, (patch.hp != null ? patch.hp : hp) - Math.max(1, Math.min(4, +wahl.w4 || 1)));
      if (k.zustand || k.krankheit) patch.rastLeiden = [...(c.rastLeiden || []), k.zustand || k.krankheit];
    }
  }
  if (ersch !== (+c.erschoepfung || 0)) patch.erschoepfung = Math.max(0, Math.min(6, ersch));
  return {patch, saetze};
};

// ══ Ende der reinen Rechnung ════════════════════════════════════

// ── Die Spielleitung sagt an ────────────────────────────────────
const RastWahl = ({ titel, optionen, wert, onWert }) => (
  <label className="rast-feld">
    <span>{titel}</span>
    <select className="form-select" value={wert} onChange={e=>onWert(e.target.value)}>
      {optionen.map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
    </select>
  </label>
);
const RastAnsage = ({ regel, helden, onAbbrechen, onAnsagen }) => {
  const [art, setArt] = React.useState('lang');
  const [basis, setBasis] = React.useState(2);
  const [niederschlag, setNiederschlag] = React.useState('leicht');
  const [temperatur, setTemperatur] = React.useState('mild');
  const [wind, setWind] = React.useState('flaute');
  const [massnahmen, setMassnahmen] = React.useState([]);
  const [von, setVon] = React.useState(null);        // von Hand gesetzte Stufe
  const [essen, setEssen] = React.useState(true);
  const [text, setText] = React.useState('');
  const [fuer, setFuer] = React.useState(() => helden.map(h => h.id));

  const grr = regel === 'grr';
  const vorschlag = rastVorschlag({basis, niederschlag, temperatur, wind, massnahmen});
  const stufe = von || vorschlag.stufe;
  const lage = rastStufe(stufe);
  // Über den Vorgänger, nicht über die Liste dieses Bildes: zwei Klicks
  // kurz hintereinander sähen sonst beide die alte und nur der zweite bliebe.
  const um = (liste, set, k) => set(l => l.includes(k) ? l.filter(x => x !== k) : [...l, k]);

  return (
    <Fenster onClick={onAbbrechen}>
      <div className="form-modal rast-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">☾ Rast ansagen</div>
        <div className="einst-wahl">
          <button type="button" className={'einst-option' + (art === 'kurz' ? ' aktiv' : '')} onClick={()=>setArt('kurz')}>
            <b>Kurze Rast</b><i>{grr ? 'Trefferwürfel geben temporäre TP' : 'Trefferwürfel heilen'}</i>
          </button>
          <button type="button" className={'einst-option' + (art === 'lang' ? ' aktiv' : '')} onClick={()=>setArt('lang')}>
            <b>Lange Rast</b><i>{grr ? 'ein Teil kommt zurück, je nach Lage' : 'alles kommt zurück'}</i>
          </button>
        </div>

        {art === 'lang' && grr && (
          <>
            <div className="form-label" style={{marginTop:12}}>Wo und wie gerastet wird</div>
            <div className="rast-rechner">
              <RastWahl titel="Grundlage" optionen={RAST_BASIS} wert={basis} onWert={v=>{ setBasis(+v); setVon(null); }} />
              <RastWahl titel="Niederschlag" optionen={RAST_NIEDERSCHLAG} wert={niederschlag} onWert={v=>{ setNiederschlag(v); setVon(null); }} />
              <RastWahl titel="Temperatur" optionen={RAST_TEMPERATUR} wert={temperatur} onWert={v=>{ setTemperatur(v); setVon(null); }} />
              <RastWahl titel="Wind" optionen={RAST_WIND} wert={wind} onWert={v=>{ setWind(v); setVon(null); }} />
            </div>
            <div className="rast-massnahmen">
              {RAST_MASSNAHMEN.map(x => (
                <button type="button" key={x.k} aria-pressed={massnahmen.includes(x.k)}
                  className={'zust-chip' + (massnahmen.includes(x.k) ? ' an gut' : '')}
                  onClick={()=>{ um(massnahmen, setMassnahmen, x.k); setVon(null); }}>{x.l}</button>
              ))}
            </div>
            {vorschlag.teile.length > 0 && (
              <div className="rast-teile">
                {vorschlag.teile.map((t, i) => (
                  <span key={i} className={t.wert > 0 ? 'plus' : t.wert < 0 ? 'minus' : ''}>
                    {t.text}{t.wert ? ' ' + (t.wert > 0 ? '+' : '−') + Math.abs(t.wert) : ''}
                  </span>
                ))}
              </div>
            )}
            <div className="form-label" style={{marginTop:12}}>
              Rastbedingung {von ? '— von Hand gesetzt' : '— Vorschlag'}
            </div>
            <div className="rast-stufen">
              {RAST_STUFEN.map(s => (
                <button type="button" key={s.n} title={s.bsp}
                  className={'rast-stufe s' + s.n + (s.n === stufe ? ' an' : '')}
                  onClick={()=>setVon(s.n === vorschlag.stufe ? null : s.n)}>{s.name}</button>
              ))}
            </div>
            <div className="rast-lage">
              <b>{lage.name}</b> · {lage.bsp}
              <span>TP je Stufe {lage.tp >= 0 ? '+' : '−'}{Math.abs(lage.tp)} · Zauberpunkte {lage.zp >= 0 ? '+' : '−'}{Math.abs(lage.zp)}
                {!lage.ersch && ' · keine Erschöpfung weg'}{lage.kompl && ' · Komplikationen (KON-RW SG 10)'}</span>
            </div>
          </>
        )}

        {art === 'lang' && (
          <label className="zug-lauf-an" style={{marginTop:10}}>
            <input type="checkbox" checked={essen} onChange={e=>setEssen(e.target.checked)} />
            <span>Essen und Trinken vorhanden — ohne bringt die lange Rast nichts</span>
          </label>
        )}

        <div className="form-label" style={{marginTop:12}}>Wer rastet</div>
        <div className="rast-massnahmen">
          {helden.map(h => (
            <button type="button" key={h.id} aria-pressed={fuer.includes(h.id)}
              className={'zust-chip' + (fuer.includes(h.id) ? ' an gut' : '')}
              onClick={()=>um(fuer, setFuer, h.id)}>{h.name}</button>
          ))}
        </div>
        <input className="form-input" style={{marginTop:10}} value={text} maxLength={160}
          placeholder="Ein Satz dazu, z. B. „Die Nacht im Schilf am Fluss“" onChange={e=>setText(e.target.value)} />

        <div className="form-actions" style={{marginTop:14}}>
          <button className="btn-cancel" onClick={onAbbrechen}>Abbrechen</button>
          <button className="btn-save" disabled={!fuer.length}
            onClick={()=>onAnsagen({art, regel: grr ? 'grr' : 'standard',
              stufe: art === 'lang' && grr ? stufe : 0, essen: art === 'lang' ? essen : true,
              teile: art === 'lang' && grr ? vorschlag.teile.map(t => t.text + (t.wert ? ' ' + (t.wert > 0 ? '+' : '−') + Math.abs(t.wert) : '')) : [],
              text: text.trim(), fuer})}>☾ Ansagen</button>
        </div>
      </div>
    </Fenster>
  );
};

// ── Ein Held rastet ─────────────────────────────────────────────
const rastWurf = (n) => Math.floor(Math.random() * n) + 1;
const RastHeld = ({ held, setDefs, rast, onUebernehmen }) => {
  const werte = charWerte(held, setDefs);
  const con = mod(werte.eff.con);
  const grr = rast.regel === 'grr';
  const lage = rastStufe(rast.stufe);
  const vorrat = trefferwuerfelVorrat(held);
  const grund = zauberpunkteGrund(held);
  const budget = Math.max(0, grund.punkte + (grund.punkte ? lage.zp : 0));
  const [plaetze, setPlaetze] = React.useState({});
  const [wuerfe, setWuerfe] = React.useState([]);        // [{w, wurf}]
  const [rw, setRw] = React.useState('');
  const [w6, setW6] = React.useState(0);
  const [w4, setW4] = React.useState(0);

  const summe = zauberAuswahlSumme(plaetze);
  const slots = held.spellSlots || {};
  const grade = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(g => (+((slots[g] || {}).used) || 0) > 0);
  const kompl = rast.art === 'lang' && grr && lage.kompl && rast.essen !== false;
  const komplFertig = !kompl || (rw !== '' && (+rw >= 10 || (w6 && (w6 !== 2 || w4))));
  const {saetze} = rastAnwenden(held, werte, rast, {plaetze, wuerfe, rw: kompl ? rw : null, w6, w4});
  const offen = (w) => {
    const v = vorrat.find(x => x.w === w);
    return v ? v.gesamt - v.verbraucht - wuerfe.filter(x => x.w === w).length : 0;
  };

  return (
    <div className="rast-held">
      <div className="rast-held-kopf">
        <b>{held.name}</b>
        <span>{werte.hp} / {werte.maxHp} TP{(+held.erschoepfung || 0) > 0 ? ' · Erschöpfung ' + held.erschoepfung : ''}</span>
      </div>

      {rast.art === 'kurz' && (
        <div className="rast-block">
          <div className="form-label">Trefferwürfel werfen — je {con >= 0 ? '+' : '−'}{Math.abs(con)} KON</div>
          <div className="rast-wuerfel">
            {vorrat.map(v => (
              <button type="button" key={v.w} className="bj-taste" disabled={offen(v.w) <= 0}
                onClick={()=>setWuerfe(l => [...l, {w: v.w, wurf: rastWurf(v.w)}])}>
                🎲 W{v.w} <i>{offen(v.w)} übrig</i>
              </button>
            ))}
          </div>
          {wuerfe.length > 0 && (
            <div className="rast-teile">
              {wuerfe.map((x, i) => (
                <span key={i} className="plus">W{x.w}: <ZahlFeld className="form-input rast-zahl" min={1} max={x.w} wert={x.wurf}
                  onWert={v=>setWuerfe(l => l.map((y, j) => j === i ? {...y, wurf: v} : y))} />
                  <button type="button" className="konz-weg" onClick={()=>setWuerfe(l => l.filter((_, j) => j !== i))}>✕</button></span>
              ))}
            </div>
          )}
        </div>
      )}

      {rast.art === 'lang' && grr && rast.essen !== false && grund.punkte > 0 && (
        <div className="rast-block">
          <div className="form-label">Zauberplätze zurückholen — {summe} von {budget} Zauberpunkten</div>
          {grade.length === 0 ? <div className="probe-leer">Kein Zauberplatz verbraucht.</div> : (
            <div className="rast-grade">
              {grade.map(g => {
                const n = +plaetze[g] || 0;
                const used = +slots[g].used || 0;
                return (
                  <div className="rast-grad" key={g}>
                    <span>{g}. Grad</span>
                    <button type="button" className="bj-taste" disabled={n <= 0}
                      onClick={()=>setPlaetze(p => ({...p, [g]: n - 1}))}>−</button>
                    <b>{n}</b><i>/ {used}</i>
                    <button type="button" className="bj-taste" disabled={n >= used || summe + g > budget}
                      onClick={()=>setPlaetze(p => ({...p, [g]: n + 1}))}>+</button>
                  </div>
                );
              })}
            </div>
          )}
          {(held.charClass === 'Magier' || (held.multiclasses || []).some(m => m.charClass === 'Magier')) && (
            <div className="zw-probe">Nach dieser Variante gibt es keine Arkane Erholung.</div>
          )}
        </div>
      )}

      {kompl && (
        <div className="rast-block rast-kompl">
          <div className="form-label">Erbärmliche Nacht — Konstitutionsrettungswurf gegen SG 10</div>
          <div className="rast-wuerfel">
            <button type="button" className="bj-taste" onClick={()=>{ setRw(rastWurf(20) + (werte.saves.con || 0)); setW6(0); setW4(0); }}>
              🎲 W20 {(werte.saves.con || 0) >= 0 ? '+' : '−'}{Math.abs(werte.saves.con || 0)}</button>
            <ZahlFeld className="form-input rast-zahl" wert={rw} leerWert="" placeholder="—" aria-label="Rettungswurf"
              onWert={v=>{ setRw(v); setW6(0); setW4(0); }} />
            {rw !== '' && +rw < 10 && (
              <button type="button" className="bj-taste" onClick={()=>{ const r = rastWurf(6); setW6(r); setW4(r === 2 ? rastWurf(4) : 0); }}>
                🎲 W6 Komplikation{w6 ? ': ' + w6 : ''}</button>
            )}
          </div>
        </div>
      )}

      <div className="rast-ergebnis">
        {saetze.map((s, i) => <div key={i}>• {s}</div>)}
      </div>
      <button className="btn-save" disabled={!komplFertig}
        onClick={()=>onUebernehmen(held, {plaetze, wuerfe, rw: kompl ? rw : null, w6, w4})}>
        ✓ In den Bogen übernehmen</button>
    </div>
  );
};

// ── Das Fenster zur Rast ────────────────────────────────────────
// Spieler sehen ihre eigenen Helden, die Spielleitung alle, die rasten —
// mit dem Stand, wer schon übernommen hat.
const RastFenster = ({ rast, helden, meine, isDmMode, setDefs, onUebernehmen, onAbraeumen, onSchliessen }) => {
  const antworten = rast.antworten || [];
  const erledigt = (id) => antworten.find(a => a.charId === id);
  const lage = rastStufe(rast.stufe);
  const offen = meine.filter(h => (rast.fuer || []).includes(h.id) && !erledigt(h.id));
  return (
    <Fenster onClick={onSchliessen}>
      <div className="form-modal rast-fenster" onClick={e=>e.stopPropagation()}>
        <div className="form-title">☾ {rast.art === 'kurz' ? 'Kurze Rast' : 'Lange Rast'}
          {rast.art === 'lang' && rast.regel === 'grr' ? ' · ' + lage.name : ''}</div>
        {rast.text && <div className="post-wink">„{rast.text}“</div>}
        {rast.art === 'lang' && rast.regel === 'grr' && (rast.teile || []).length > 0 && (
          <div className="rast-teile">{rast.teile.map((t, i) => <span key={i}>{t}</span>)}</div>
        )}

        {offen.map(h => (
          <RastHeld key={h.id + rast.id} held={h} setDefs={setDefs} rast={rast} onUebernehmen={onUebernehmen} />
        ))}
        {!isDmMode && offen.length === 0 && (
          <div className="probe-leer">Deine Helden haben die Rast übernommen.</div>
        )}

        {isDmMode && (
          <>
            <div className="form-label" style={{marginTop:12}}>Wer schon fertig ist</div>
            <div className="post-liste">
              {(rast.fuer || []).map(id => {
                const h = helden.find(x => x.id === id);
                const a = erledigt(id);
                return (
                  <div className={'post-zettel' + (a ? ' gelesen' : '')} key={id}>
                    <div className="post-kopf"><b>{(h && h.name) || (a && a.name) || 'Held'}</b>
                      <span className="post-stand">{a ? '✓ übernommen' : 'wartet'}</span></div>
                    {a && <div className="post-inhalt">{a.text}</div>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="form-actions" style={{marginTop:14}}>
          {isDmMode && <button className="btn-cancel laden-abraeumen" style={{marginRight:'auto'}} onClick={onAbraeumen}>Rast beenden</button>}
          <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        </div>
      </div>
    </Fenster>
  );
};
