// Heldenbuch — der ganze Bogen als Text.
//
// Gedacht zum Weitergeben. Am Tisch sitzt neuerdings oft eine KI mit am
// Rand: sie soll einen Begleiter spielen, einen Zauber nachschlagen oder
// sagen, was der Held hier eigentlich koennte. Dafuer braucht sie den
// Bogen — und zwar ganz, nicht die drei Zahlen, an die man gerade denkt.
//
// Deshalb steht hier alles fertig gerechnet: die Ruestungsklasse mit dem
// Schild darin, der Angriff mit Uebungsbonus und Attribut, jede
// Fertigkeit mit ihrem Endwert. Wer den Text liest, soll nichts
// zusammenzaehlen muessen, was der Bogen laengst zusammengezaehlt hat.
// Ein Mensch ohne Heldenbuch kann ihn genauso lesen.
//
// Reine Rechnung, kein React: derselbe Text entsteht in der Pruefung
// unter dev/pruefungen/ ohne Browser.

const HT_BREITE = 78;

// Ein Absatz, umgebrochen auf Zeilenbreite, jede Zeile mit Einzug.
// Absaetze im Text bleiben Absaetze — eine Zauberbeschreibung mit zwei
// Teilen soll nicht zu einem Block zusammenlaufen.
const htUmbruch = (text, einzug, breite) => {
  const platz = Math.max(20, (breite || HT_BREITE) - einzug.length);
  const raus = [];
  String(text === undefined || text === null ? '' : text)
    .replace(/\r/g, '').split('\n').forEach(absatz => {
      const worte = absatz.trim().split(/\s+/).filter(Boolean);
      if (!worte.length) { raus.push(''); return; }
      let zeile = '';
      worte.forEach(wort => {
        if (!zeile) { zeile = wort; return; }
        if (zeile.length + 1 + wort.length <= platz) { zeile += ' ' + wort; return; }
        raus.push(einzug + zeile);
        zeile = wort;
      });
      raus.push(einzug + zeile);
    });
  // Leerzeilen am Anfang und Ende faellt niemandem auf, wenn sie fehlen —
  // zwei Leerzeilen mitten im Text schon.
  while (raus.length && !raus[0]) raus.shift();
  while (raus.length && !raus[raus.length - 1]) raus.pop();
  return raus;
};

// „12,5" statt „12.5" — der Bogen zeigt Zahlen deutsch, und der Text soll
// sich nicht davon unterscheiden.
const htZahl = (n) => String(n).replace('.', ',');

// Eine beschriftete Zeile: zwei Spalten, damit die Werte untereinander
// stehen und nicht suchen lassen.
const htPaar = (was, wert) => '  ' + String(was).padEnd(21) + wert;

// Was in einer Liste steht, als Aufzaehlung — oder gar nichts.
const htListe = (was, liste) => {
  const da = (liste || []).filter(x => String(x || '').trim());
  return da.length ? [htPaar(was, da.join(', '))] : [];
};

// Die Effekte eines Stuecks in Worten: „Rüstungsklasse +1, Stärke = 19".
// Schalter ohne Zahl („Vorteil: Heimlichkeit") stehen ohne Zahl da.
const htEffekte = (liste) => (liste || [])
  .filter(e => e && e.target && EFFECT_LABELS[e.target])
  .map(e => (EFFECT_LABELS[e.target] || e.target)
            + (effectText(e) ? ' ' + effectText(e) : ''))
  .join(', ');

// ── Der Bogen als Text ───────────────────────────────────────────
//
//   c        der Held
//   opts.klassen   die Klassenliste des Abenteuers (fuer das Zauberattribut)
//   opts.setDefs   die Set-Register der Datenbank (fuer die Setboni)
const heldText = (c, opts) => {
  if (!c) return '';
  const o = opts || {};
  const w = charWerte(c, o.setDefs || []);
  const eff = w.eff;
  const fx = (ziel, basis) => applyEffect(w.effekte, ziel, basis);
  const t = [];
  const leer = () => { if (t.length && t[t.length - 1] !== '') t.push(''); };
  const titel = (wort) => { leer(); t.push(wort); };

  // ── Kopf ───────────────────────────────────────────────────────
  const stufe = (+c.level || 1)
    + (c.multiclasses || []).reduce((s, m) => s + (+m.level || 0), 0);
  const klassenText = [
    c.charClass + ' ' + (+c.level || 1) + (c.subclass ? ' (' + c.subclass + ')' : ''),
    ...(c.multiclasses || []).map(m => m.charClass + ' ' + (+m.level || 0)
      + (m.subclass ? ' (' + m.subclass + ')' : '')),
  ].join(' / ');

  t.push('═'.repeat(HT_BREITE));
  t.push('  ' + String(c.name || 'Namenloser Held').toUpperCase());
  t.push('═'.repeat(HT_BREITE));
  t.push('  ' + [c.race, klassenText, c.background].filter(Boolean).join(' · '));
  t.push('  Gesamtstufe ' + stufe + ' · Übungsbonus ' + fnum(eff.profBonus));
  t.push('');
  // Die Ausgabe steht mit im Text. Nicht der Zierde wegen: als dieser
  // Text zum ersten Mal am Tisch ankam, hiess es, es komme nicht alles
  // mit — und die Ursache war ein Browser, der die alte Fassung noch
  // im Speicher hatte. Wer die Nummer im Text sieht, sieht es sofort.
  t.push('  Charakterbogen aus dem Heldenbuch'
    + (typeof HB_VERSION === 'string' ? ' ' + HB_VERSION : '')
    + ' (D&D 5e). Alle Zahlen stehen fertig');
  t.push('  gerechnet da: Boni aus Ausrüstung, Merkmalen und Talenten sind bereits');
  t.push('  eingerechnet und dürfen nicht noch einmal addiert werden.');

  // ── Kampfwerte ─────────────────────────────────────────────────
  const spAttr = klassenAttr(c.charClass, o.klassen);
  titel('KAMPFWERTE');
  t.push(htPaar('Rüstungsklasse', w.ac));
  t.push(htPaar('Trefferpunkte', w.hp + ' von ' + w.maxHp
    + (w.tempHp ? '  (+' + w.tempHp + ' temporär)' : '')
    + (+c.tempMaxHp ? '  (Maximum um ' + (+c.tempMaxHp) + ' erhöht)' : '')));
  if (w.hp <= 0) {
    const ds = c.deathSaves || {};
    t.push(htPaar('', 'Kampfunfähig · Todesrettungswürfe '
      + (+ds.erfolge || 0) + ' Erfolge, ' + (+ds.fehler || 0) + ' Fehler'));
  }
  t.push(htPaar('Initiative', fnum(w.initiative)));
  t.push(htPaar('Bewegung', htZahl(eff.speed) + ' m'));
  if (w.passive !== null) t.push(htPaar('Passive Wahrnehmung', w.passive));
  if (spAttr) {
    t.push(htPaar('Zauber-SG', fx('spellDc', 8 + eff.profBonus + mod(eff[spAttr]))));
    t.push(htPaar('Zauberangriff', fnum(fx('spellAttack', eff.profBonus + mod(eff[spAttr])))
      + '   (' + ATTR_NAME[spAttr] + ')'));
  }
  if (+c.inspirationMax || +c.inspiration)
    t.push(htPaar('Inspiration', (+c.inspiration || 0) + ' von ' + (+c.inspirationMax || 1)));

  // ── Attribute ──────────────────────────────────────────────────
  titel('ATTRIBUTE   (★ = Rettungswurf geübt)');
  ATTR_WAHL.forEach(({k}) => {
    const geuebt = (c.savingThrowProfs || []).includes(k);
    t.push('  ' + ATTR_NAME[k].padEnd(18)
      + String(eff[k]).padStart(2) + '  (' + fmod(eff[k]) + ')'
      + '    Rettungswurf ' + fnum(w.saves[k]) + (geuebt ? ' ★' : ''));
  });

  // ── Fertigkeiten ───────────────────────────────────────────────
  // Alle achtzehn, auch die ungeuebten: wer den Text einer KI hinlegt,
  // will auf „Wie gut ist er im Schleichen?" eine Zahl bekommen und kein
  // „steht nicht dabei".
  const kurzAttr = {str:'Stä', dex:'Ges', con:'Kon', int:'Int', wis:'Wei', cha:'Cha'};
  titel('FERTIGKEITEN   (★ geübt, ★★ Expertise, ½ Alleskönner)');
  SKILLS.forEach(sk => {
    const p = (c.skillProfs || []).includes(sk.key);
    const e = (c.expertiseProfs || []).includes(sk.key);
    const j = c.jackOfAllTrades && !p && !e;
    const zeichen = e ? '★★' : p ? '★ ' : j ? '½ ' : '  ';
    t.push('  ' + zeichen + ' ' + sk.label.padEnd(22)
      + '(' + kurzAttr[sk.attr] + ')  ' + fnum(w.skills[sk.key]).padStart(3));
  });

  // ── Uebungen ───────────────────────────────────────────────────
  const uebungen = [
    ...htListe('Sprachen', c.languages),
    ...htListe('Werkzeuge', c.toolProfs),
    ...htListe('Waffen', c.weaponProfs),
    ...htListe('Rüstungen', c.armorProfs),
  ];
  if (uebungen.length) { titel('ÜBUNGEN'); uebungen.forEach(z => t.push(z)); }

  // ── Waffen ─────────────────────────────────────────────────────
  // Angriff und Schaden nach derselben Rechnung wie im Bogen. Finesse
  // waehlt dabei das bessere von Staerke und Geschick — hier steht am
  // Ende, welches gewonnen hat.
  const getragen = gearWorn(c);
  const platzVon = (art, id) => {
    const g = getragen.find(x => x.k === art && x.obj.id === id);
    return g ? g.slot.label : null;
  };
  const waffen = c.weapons || [];
  if (waffen.length) {
    titel('WAFFEN');
    waffen.forEach(wa => {
      const aKey = wa.attrKey === 'fin'
        ? (mod(eff.str) >= mod(eff.dex) ? 'str' : 'dex')
        : (wa.attrKey || 'str');
      const attrMod = mod(eff[aKey] || 10);
      const angriff = fx('attack', (wa.proficient ? eff.profBonus : 0) + attrMod + (+wa.attackBonus || 0));
      const schadenBonus = fx('damage', attrMod + (+wa.attackBonus || 0));
      const schaden = wa.damage + (schadenBonus !== 0
        ? (schadenBonus > 0 ? ' + ' + schadenBonus : ' - ' + Math.abs(schadenBonus)) : '');
      const platz = platzVon('w', wa.id);
      t.push('  ' + (wa.name || 'Waffe'));
      t.push('      Angriff ' + fnum(angriff) + ' · Schaden ' + schaden
        + (wa.damageType ? ' (' + wa.damageType + ')' : '')
        + (wa.range ? ' · Reichweite ' + wa.range : '')
        + '   [' + kurzAttr[aKey] + (wa.proficient ? ', geübt' : ', ungeübt') + ']');
      if (platz) t.push('      Geführt: ' + platz);
      if ((wa.properties || []).length) t.push('      Eigenschaften: ' + wa.properties.join(', '));
      const fxText = htEffekte(wa.effects);
      if (fxText && (platz || wa.equipped)) t.push('      Wirkt: ' + fxText);
      if (wa.description) htUmbruch(wa.description, '      ').forEach(z => t.push(z));
    });
  }

  // ── Getragene Ausruestung ──────────────────────────────────────
  // Das Inventar selbst steht nicht im Text — drei Fackeln und ein Seil
  // sagen ueber den Helden nichts, und bei einem Beutel voll Kram waere
  // es die laengste Liste im ganzen Bogen. Was er *traegt*, steht da: es
  // steckt in seinen Werten, und ein magischer Umhang ist naeher an
  // einem Merkmal als an einem Seil. Darum auch mit seinem Text.
  if (getragen.length) {
    titel('GETRAGEN');
    getragen.forEach(({slot, obj, k}) => {
      const rk = obj.armorType && +obj.baseAC > 0 ? '  (Grundwert RK ' + obj.baseAC + ')'
               : +obj.acBonus ? '  (RK ' + fnum(+obj.acBonus) + ')' : '';
      // „gewöhnlich" ist keine Auskunft — und sie steht in den Boegen
      // mal mit Umlaut, mal ohne.
      const selten = /^gew(ö|oe)hnlich$/i.test(String(obj.rarity || '').trim())
        ? '' : String(obj.rarity || '').trim();
      t.push(htPaar(slot.label, (obj.name || '—') + rk + (selten ? '  (' + selten + ')' : '')));
      const fxText = htEffekte(obj.effects);
      if (fxText) t.push('      Wirkt: ' + fxText);
      // Nur Gegenstaende. Eine Waffe steht oben schon mit ihrem ganzen
      // Text da; hier waere er dasselbe ein zweites Mal.
      if (k !== 'w' && obj.description)
        htUmbruch(obj.description, '      ').forEach(z => t.push(z));
    });
    const sets = gearSets(c, o.setDefs || []).filter(s => s.hoechste > 0);
    sets.forEach(s => {
      t.push(htPaar('Satz', s.name + ' — ' + s.teile + ' Teile getragen'));
      s.stufen.filter(st => st.aktiv).forEach(st => {
        const fxText = htEffekte(st.effects);
        if (fxText) t.push('      Ab ' + (+st.teile || 0) + ' Teilen: ' + fxText);
      });
    });
  }

  // ── Was sich verbraucht ────────────────────────────────────────
  const plaetze = c.spellSlots || {};
  const platzZeilen = [];
  for (let g = 1; g <= 9; g++) {
    const p = plaetze[g] || {max: 0, used: 0};
    if (+p.max > 0) platzZeilen.push('Grad ' + g + ': ' + Math.max(0, (+p.max || 0) - (+p.used || 0))
      + ' von ' + p.max + ' frei');
  }
  const sp = c.sorceryPoints || {max: 0, used: 0};
  const ress = c.resources || [];
  if (platzZeilen.length || +sp.max > 0 || ress.length) {
    titel('WAS SICH VERBRAUCHT');
    if (platzZeilen.length) t.push(htPaar('Zauberplätze', platzZeilen.join(' · ')));
    if (+sp.max > 0) t.push(htPaar('Zauberpunkte',
      Math.max(0, sp.max - (+sp.used || 0)) + ' von ' + sp.max + ' frei'));
    ress.forEach(r => t.push(htPaar(r.name || 'Ressource',
      Math.max(0, (+r.max || 0) - (+r.used || 0)) + ' von ' + (+r.max || 0) + ' frei   ('
      + (r.restType === 'kurz' ? 'kurze Rast' : r.restType === 'tag' ? 'täglich' : 'lange Rast') + ')')));
  }

  // ── Merkmale ───────────────────────────────────────────────────
  const merkmale = [...(c.features || [])]
    .sort((a, b) => (a.source || '').localeCompare(b.source || '', 'de')
                 || (a.name || '').localeCompare(b.name || '', 'de'));
  if (merkmale.length) {
    titel('MERKMALE UND FÄHIGKEITEN');
    merkmale.forEach(f => {
      t.push('  ' + (f.name || 'Merkmal') + (f.source ? '   — ' + f.source : ''));
      const fxText = htEffekte(f.effects);
      if (fxText) t.push('      ' + (f.effectsActive === false ? 'Ruht: ' : 'Wirkt: ') + fxText);
      if (f.description) htUmbruch(f.description, '      ').forEach(z => t.push(z));
    });
  }

  // ── Zauber ─────────────────────────────────────────────────────
  const zauber = c.spells || [];
  if (zauber.length) {
    const nachGrad = {};
    zauber.forEach(s => { (nachGrad[+s.level || 0] = nachGrad[+s.level || 0] || []).push(s); });
    titel('ZAUBER' + (spAttr ? '   (Zauberattribut ' + ATTR_NAME[spAttr] + ')' : ''));
    // Womit gezaubert wird, steht in der Klassenliste des Abenteuers.
    // Steht die Klasse nicht darin — eine Hausklasse, ein Tippfehler,
    // ein Abenteuer, in dem noch niemand sie eingetragen hat —, gibt es
    // keinen Zauber-SG. Oben fiele er dann stillschweigend weg, und die
    // KI bekaeme eine Zauberliste ohne die Zahl, nach der sie als
    // erstes fragen wird. Also steht hier, warum.
    if (!spAttr) {
      t.push('  Für die Klasse „' + (c.charClass || '—') + '" ist kein Zauberattribut');
      t.push('  hinterlegt — Zauber-SG und Zauberangriff fehlen deshalb oben.');
      t.push('');
    }
    Object.keys(nachGrad).map(Number).sort((a, b) => a - b).forEach((g, i) => {
      const p = plaetze[g] || {max: 0, used: 0};
      if (i) t.push('');
      t.push('  ' + (g === 0 ? 'Zaubertricks' : 'Grad ' + g)
        + (g > 0 && +p.max > 0
           ? '   (' + Math.max(0, (+p.max || 0) - (+p.used || 0)) + ' von ' + p.max + ' Plätzen frei)' : ''));
      nachGrad[g].slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de')).forEach(s => {
        t.push('    ' + (s.name || 'Zauber')
          + (s.prepared === false ? '   [nicht vorbereitet]' : ''));
        // Ob er Konzentration verlangt, steht in der Wirkungsdauer — genau
        // daran erkennt es auch der Kampftracker. Es noch einmal
        // danebenzuschreiben hiesse dasselbe zweimal.
        t.push('        ' + [s.school, s.castingTime, s.range, s.components, s.duration]
          .filter(Boolean).join(' · '));
        if (s.description) htUmbruch(s.description, '        ').forEach(z => t.push(z));
      });
    });
  }

  // ── Vorteile und Nachteile ─────────────────────────────────────
  // Schalter tragen keine Zahl und stecken deshalb in keinem der Werte
  // oben. Ohne sie fehlt der KI genau das, was am Tisch den Unterschied
  // macht: „Vorteil gegen Gift" steht sonst nirgends.
  if ((w.flags || []).length) {
    titel('BESONDERHEITEN');
    w.flags.forEach(f => t.push('  ' + f.label
      + (f.quellen && f.quellen.length ? '   (' + f.quellen.join(', ') + ')' : '')));
  }

  // ── Notizen ────────────────────────────────────────────────────
  const notizen = (c.notesList || []).filter(n => (n.title || n.content));
  if (String(c.notes || '').trim() || notizen.length) {
    titel('NOTIZEN');
    if (String(c.notes || '').trim())
      htUmbruch(c.notes, '  ').forEach(z => t.push(z));
    notizen.forEach(n => {
      t.push('');
      t.push('  ' + (n.title || 'Notiz')
        + ((n.tags || []).length ? '   [' + n.tags.join(', ') + ']' : ''));
      if (n.content) htUmbruch(n.content, '    ').forEach(z => t.push(z));
    });
  }

  t.push('');
  return t.join('\n');
};

// ══ Ende der reinen Rechnung ═════════════════════════════════════

// ── Das Fenster dazu ─────────────────────────────────────────────
// Der Text steht sichtbar da und wird nicht nur still kopiert: wer ihn
// einer KI hinlegt, will vorher sehen, was er hinlegt. Der Knopf daneben
// nimmt ihn dann in einem Griff mit.
const HeldTextFenster = ({char, klassen, setDefs, onZu}) => {
  // null · 'gut' · 'weg' — und der Stand bleibt vier Sekunden stehen.
  // Zwei waren zu kurz: wer auf das Feld schaut oder mit dem Finger auf
  // dem Knopf steht, hat ihn bis dahin nicht gesehen.
  const [stand, setStand] = React.useState(null);
  const feld = React.useRef(null);
  if (!char) return null;
  const text = heldText(char, {klassen, setDefs});

  const kopieren = async () => {
    // Das Feld wird mitgegeben: steht der Text ohnehin sichtbar da, ist
    // es der verlaesslichste Weg — und scheitert auch der, bleibt er
    // markiert stehen, und die Tastatur nimmt ihn mit.
    const gut = await inZwischenablage(text, feld.current);
    setStand(gut ? 'gut' : 'weg');
    setTimeout(() => setStand(null), 4000);
  };

  return (
    <Fenster onZu={onZu}>
      <div className="form-modal breit" style={{maxWidth:900}}>
        <div className="form-title">📋 {char.name} als Text</div>
        <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12,lineHeight:1.5}}>
          Der ganze Bogen mit fertig gerechneten Werten — zum Einfügen in ein
          KI-Gespräch. Alles steht darin: Attribute, alle achtzehn Fertigkeiten,
          Waffen, Getragenes, Merkmale und Zauber, jeweils mit ihrem ganzen Text.
        </div>
        <textarea className="hb-text-feld" readOnly value={text} ref={feld}
          onFocus={e=>e.target.select()} spellCheck={false} />
        {stand === 'weg' && (
          <div className="hb-text-weg">
            Der Browser hat das Kopieren abgelehnt — das kommt vor, wenn das
            Fenster gerade nicht im Vordergrund steht. Der Text ist jetzt
            markiert: <b>Strg+C</b> (am Mac <b>⌘+C</b>) nimmt ihn mit.
          </div>
        )}
        <div className="form-actions" style={{marginTop:14}}>
          <span className="hb-text-mass">
            {text.split('\n').length} Zeilen · {text.length} Zeichen
          </span>
          <button className="btn-cancel" onClick={onZu}>Schließen</button>
          <button className={'btn-save hb-kopf-knopf'
                             + (stand ? ' ' + stand : '')} onClick={kopieren}>
            {stand === 'gut' ? '✓ In der Zwischenablage'
              : stand === 'weg' ? '✕ Ging nicht — siehe oben'
              : '📋 Alles kopieren'}
          </button>
        </div>
      </div>
    </Fenster>
  );
};
