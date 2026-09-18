// Heldenbuch — der Bogen als Textdatei, hin und zurück.
//
// „Der Bogen als Text" (2k-heldtext.jsx) ist fertig gerechnet und zum
// Vorlegen gedacht: die RK mit dem Schild darin, der Angriff mit Bonus.
// Wieder einlesen kann man ihn nicht — aus 17 lässt sich nicht ablesen,
// welche 13 eingetragen war.
//
// Diese Datei ist das Gegenstück: dasselbe in einem festen Schema, mit
// den eingetragenen Werten, hin und zurück verlustfrei. Sie ist auch das
// Format zum Diktieren — wer einen NSC von einer KI schreiben lässt,
// legt ihr TEXTBOGEN.md vor und liest die Antwort hier ein.
//
//     # Heldenbuch-Bogen 1
//
//     [Bogen]
//     Name: Brunhilde Eisenfaust
//     Art: Held
//     …
//     [Merkmale]
//     - Aktionsschub
//       Quelle: Kämpfer 2
//       Text: Einmal je Rast eine zusätzliche Aktion.
//
// Die Regeln sind so einfach, wie sie sein können:
//
//   * `# …` am Zeilenanfang ist eine Bemerkung.
//   * `[Abschnitt]` beginnt einen Abschnitt.
//   * `Schlüssel: Wert` ist eine Angabe.
//   * `- Name` beginnt einen Eintrag einer Liste; seine Angaben stehen
//     darunter, eingerückt.
//   * Eine eingerückte Zeile ohne `Schlüssel:` setzt den vorigen Wert
//     fort — so passen ganze Absätze in ein `Text:`.
//
// Was unbekannt ist, wird übergangen und gemeldet; was fehlt, bekommt
// den Wert eines neuen Bogens. Ein halb ausgefülltes Schema ergibt also
// einen halb ausgefüllten Bogen und nie einen Fehler.
//
// Alles bis zur Markierung ist reine Rechnung
// (dev/pruefungen/bogentext-test.js).

const BT_MARKE = 'Heldenbuch-Bogen';
const BT_VERSION = 1;
const BT_KOPF = '# ' + BT_MARKE + ' ' + BT_VERSION;

// ── Kleinkram ────────────────────────────────────────────────────
const btZahl = (v, vorgabe) => {
  const n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) ? n : (vorgabe === undefined ? 0 : vorgabe);
};
const btZahlText = (n) => String(Math.round((+n || 0) * 100) / 100).replace('.', ',');
const btJa = (v) => /^(ja|j|true|wahr|1|x)$/i.test(String(v == null ? '' : v).trim());
const btJaText = (b) => b ? 'ja' : 'nein';
const btListe = (v) => String(v == null ? '' : v).split(',').map(x => x.trim()).filter(Boolean);
// Eine Bemerkung hinter dem Wert: „ # …". Das Leerzeichen hinter dem
// Zeichen ist der Unterschied zu einer Farbe (#e05a5a).
const btOhneBemerkung = (zeile) => String(zeile).replace(/\s+#\s.*$/, '').trimEnd();
// Vergleichen ohne Rücksicht auf Groß- und Kleinschreibung oder Umlaute:
// „stärke", „Staerke" und „STR" sollen alle die Stärke treffen.
const btGleich = (a, b) => normSearch(expandUmlauts(String(a || ''))) === normSearch(expandUmlauts(String(b || '')));
// Aus einem Wort einen Schlüssel: die Tabelle ist [{key, label}, …].
const btSchluessel = (wort, tabelle) => {
  const t = tabelle.find(x => btGleich(x.label, wort) || btGleich(x.key, wort));
  return t ? t.key : '';
};
const btWort = (key, tabelle) => {
  const t = tabelle.find(x => x.key === key);
  return t ? t.label : key;
};
const BT_ATTRIBUTE = [
  {key: 'str', label: 'Stärke'}, {key: 'dex', label: 'Geschicklichkeit'},
  {key: 'con', label: 'Konstitution'}, {key: 'int', label: 'Intelligenz'},
  {key: 'wis', label: 'Weisheit'}, {key: 'cha', label: 'Charisma'},
];
const BT_FERTIGKEITEN = SKILLS.map(s => ({key: s.key, label: s.label}));
const BT_PLAETZE = GEAR_SLOTS.map(s => ({key: s.key, label: s.label}));
const BT_AUFFRISCHEN = [
  {key: 'kurz', label: 'kurze Rast'}, {key: 'lang', label: 'lange Rast'}, {key: 'tag', label: 'täglich'},
];

// „31 von 44" — zwei Zahlen in einer Zeile, in dieser Reihenfolge.
const btPaarZahlen = (v) => {
  const treffer = String(v == null ? '' : v).match(/-?\d+(?:[.,]\d+)?/g) || [];
  return [btZahl(treffer[0], 0), btZahl(treffer[1], 0)];
};

// ── Lesen: Zeilen zu Abschnitten ─────────────────────────────────
// Das Ergebnis ist absichtlich stumpf: Abschnitte mit Paaren und einer
// Liste von Einträgen, die selbst wieder Paare haben. Was die Wörter
// bedeuten, entscheidet erst bogenAusText.
const btZerlegen = (text) => {
  const zeilen = String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n');
  const abschnitte = [];
  let ab = null, ziel = null, letzter = '', leer = 0;
  const neuerAbschnitt = (name) => {
    ab = {name: name, paare: {}, liste: []};
    abschnitte.push(ab);
    ziel = ab; letzter = ''; leer = 0;
  };
  for (const roh of zeilen) {
    const einzug = roh.length - roh.replace(/^\s+/, '').length;
    const zeile = roh.trim();
    if (!zeile) { leer++; continue; }
    if (einzug === 0 && zeile.startsWith('#')) { letzter = ''; leer = 0; continue; }
    const kopf = /^\[(.+)\]$/.exec(zeile);
    if (kopf) { neuerAbschnitt(kopf[1].trim()); continue; }
    if (!ab) neuerAbschnitt('');
    if (einzug === 0 && /^[-*]\s+/.test(zeile)) {
      ziel = {wert: btOhneBemerkung(zeile).replace(/^[-*]\s+/, '').trim(), paare: {}};
      ab.liste.push(ziel);
      letzter = ''; leer = 0;
      continue;
    }
    const paar = /^([^:]{1,60}):\s?([\s\S]*)$/.exec(btOhneBemerkung(zeile));
    if (paar) {
      letzter = paar[1].trim();
      ziel.paare[letzter] = paar[2].trim();
      leer = 0;
      continue;
    }
    // Keine neue Angabe: dann gehört die Zeile zur vorigen.
    if (letzter && ziel.paare[letzter] !== undefined) {
      ziel.paare[letzter] += '\n'.repeat(Math.min(2, leer + 1)) + zeile;
    }
    leer = 0;
  }
  return abschnitte;
};
const btAbschnitt = (abschnitte, name) => abschnitte.find(a => btGleich(a.name, name)) || {name: name, paare: {}, liste: []};
const btWertAus = (abschnitt, ...namen) => {
  for (const n of namen) {
    const k = Object.keys(abschnitt.paare).find(x => btGleich(x, n));
    if (k !== undefined) return abschnitt.paare[k];
  }
  return undefined;
};
const btEintragWert = (eintrag, ...namen) => btWertAus(eintrag, ...namen);

// ── Wirkungen ────────────────────────────────────────────────────
// „Rüstungsklasse +1", „Stärke = 19", „Vorteil: Heimlichkeit".
const btWirkungText = (e) => {
  const wort = EFFECT_LABELS[e.target] || e.target;
  if (isFlagEffect(e.target)) return wort;
  return wort + ' ' + (e.mode === 'set' ? '= ' : ((+e.value || 0) >= 0 ? '+' : '')) + (+e.value || 0);
};
const btWirkungenText = (liste) => (liste || []).filter(e => e && e.target).map(btWirkungText).join(', ');
const BT_WIRKUNG_NAMEN = () => Object.keys(EFFECT_LABELS).map(k => ({key: k, label: EFFECT_LABELS[k]}));
const btWirkungLesen = (wort, nr) => {
  const roh = String(wort || '').trim();
  if (!roh) return null;
  // Der Wert steht hinten: „… +1", „… = 19". Alles davor ist der Name.
  const m = /^(.*?)\s*(=)?\s*([+-]?\d+(?:[.,]\d+)?)$/.exec(roh);
  const name = (m ? m[1] : roh).trim();
  const ziel = btSchluessel(name, BT_WIRKUNG_NAMEN());
  if (!ziel) return null;
  if (isFlagEffect(ziel)) return {id: 'fx' + nr, target: ziel, mode: 'bonus', value: 0};
  if (!m) return null;
  return {id: 'fx' + nr, target: ziel, mode: m[2] ? 'set' : 'bonus', value: btZahl(m[3], 0)};
};
const btWirkungenLesen = (wert, vorsilbe, warnungen) => {
  const raus = [];
  btListe(wert).forEach((w, i) => {
    const e = btWirkungLesen(w, vorsilbe + i);
    if (e) raus.push(e);
    else if (warnungen) warnungen.push('Unbekannte Wirkung übergangen: „' + w + '"');
  });
  return raus;
};

// ── Schreiben ────────────────────────────────────────────────────
const btZeile = (was, wert) => was + ': ' + (wert === undefined || wert === null ? '' : String(wert));
// Ein mehrzeiliger Wert: die Folgezeilen tiefer eingerückt, damit sie
// beim Lesen als Fortsetzung gelten und nicht als neue Angabe.
const btText = (was, wert, einzug) => {
  const t = String(wert == null ? '' : wert).replace(/\r\n?/g, '\n').trim();
  if (!t) return [];
  const [erste, ...rest] = t.split('\n');
  return [einzug + was + ': ' + erste, ...rest.map(z => einzug + '  ' + z)];
};

const bogenAlsText = (c) => {
  const z = [];
  const paar = (was, wert) => { z.push(btZeile(was, wert)); };
  const liste = (was, werte) => { const d = (werte || []).filter(x => String(x || '').trim()); if (d.length) paar(was, d.join(', ')); };
  const nebenStufen = (c.multiclasses || []).map(m => m.charClass + ' ' + (+m.level || 1) + (m.subclass ? ' (' + m.subclass + ')' : ''));

  z.push(BT_KOPF);
  z.push('# Diese Datei liest das Heldenbuch wieder ein: Bögen einlesen in der Seitenleiste.');
  z.push('');
  z.push('[Bogen]');
  paar('Name', c.name || '');
  paar('Art', istNsc(c) ? 'NSC ' + nscHaltung(c) : (c.dmOnly ? 'Held nur Spielleitung' : 'Held'));
  paar('Volk', c.race || '');
  paar('Klasse', c.charClass || '');
  paar('Stufe', +c.level || 1);
  if (c.subclass) paar('Unterklasse', c.subclass);
  if (nebenStufen.length) paar('Nebenklassen', nebenStufen.join(', '));
  paar('Hintergrund', c.background || '');
  paar('Übungsbonus', +c.profBonus || 2);

  z.push('');
  z.push('[Attribute]');
  BT_ATTRIBUTE.forEach(a => paar(a.label, +c[a.key] || 10));

  z.push('');
  z.push('[Werte]');
  paar('Trefferpunkte', (+c.hp || 0) + ' von ' + (+c.maxHp || 0));
  paar('Temporäre TP', +c.tempHp || 0);
  if (+c.tempMaxHp) paar('Zusätzliches TP-Maximum', +c.tempMaxHp);
  paar('Rüstungsklasse', +c.ac || 10);
  paar('Bewegung', btZahlText(c.speed));
  paar('Initiative', +c.initiative || 0);
  paar('Inspiration', (+c.inspiration || 0) + ' von ' + (+c.inspirationMax || 1));
  if (+c.erschoepfung) paar('Erschöpfung', +c.erschoepfung);
  const sp = c.sorceryPoints || {};
  if (+sp.max) paar('Zauberpunkte', (+sp.max || 0) + ' Punkte, ' + (+sp.used || 0) + ' verbraucht');

  z.push('');
  z.push('[Übungen]');
  liste('Rettungswürfe', (c.savingThrowProfs || []).map(k => btWort(k, BT_ATTRIBUTE)));
  liste('Fertigkeiten', (c.skillProfs || []).map(k => btWort(k, BT_FERTIGKEITEN)));
  liste('Expertise', (c.expertiseProfs || []).map(k => btWort(k, BT_FERTIGKEITEN)));
  paar('Alleskönner', btJaText(c.jackOfAllTrades));
  liste('Sprachen', c.languages);
  liste('Werkzeuge', c.toolProfs);
  liste('Waffen und Rüstungen', c.weaponProfs);

  const plaetze = Object.keys(c.spellSlots || {}).filter(g => +((c.spellSlots[g] || {}).max) > 0);
  if (plaetze.length) {
    z.push('');
    z.push('[Zauberplätze]');
    plaetze.sort((a, b) => +a - +b).forEach(g => {
      const s = c.spellSlots[g] || {};
      paar('Grad ' + g, (+s.max || 0) + ' Plätze, ' + (+s.used || 0) + ' verbraucht');
    });
  }

  if ((c.resources || []).length) {
    z.push('');
    z.push('[Ressourcen]');
    (c.resources || []).forEach(r => {
      z.push('- ' + (r.name || 'Ressource'));
      if (r.abbr) z.push('  ' + btZeile('Kurz', r.abbr));
      z.push('  ' + btZeile('Vorrat', (+r.max || 0) + ' Punkte, ' + (+r.used || 0) + ' verbraucht'));
      if (r.color) z.push('  ' + btZeile('Farbe', r.color));
      z.push('  ' + btZeile('Auffrischen', btWort(r.restType || 'lang', BT_AUFFRISCHEN)));
    });
  }

  if ((c.features || []).length) {
    z.push('');
    z.push('[Merkmale]');
    (c.features || []).forEach(f => {
      z.push('- ' + (f.name || 'Merkmal'));
      if (f.source) z.push('  ' + btZeile('Quelle', f.source));
      const w = btWirkungenText(f.effects);
      if (w) z.push('  ' + btZeile('Wirkung', w));
      if ((f.effects || []).length) z.push('  ' + btZeile('Wirkung aktiv', btJaText(f.effectsActive !== false)));
      if (f.ressource) {
        const r = (c.resources || []).find(x => x.id === f.ressource);
        z.push('  ' + btZeile('Ressource', (r ? r.name : f.ressource) + (+f.ressourceKosten ? ', Kosten ' + f.ressourceKosten : '')));
      }
      if (f.zauber) z.push('  ' + btZeile('Zauber', f.zauber));
      btText('Text', htmlZuText(f.description), '  ').forEach(x => z.push(x));
    });
  }

  if ((c.weapons || []).length) {
    z.push('');
    z.push('[Waffen]');
    (c.weapons || []).forEach(w => {
      z.push('- ' + (w.name || 'Waffe'));
      z.push('  ' + btZeile('Attribut', btWort(w.attrKey || 'str', BT_ATTRIBUTE)));
      z.push('  ' + btZeile('Geübt', btJaText(w.proficient !== false)));
      if (w.range) z.push('  ' + btZeile('Reichweite', w.range));
      if (+w.attackBonus) z.push('  ' + btZeile('Angriffsbonus', +w.attackBonus));
      if (w.damage) z.push('  ' + btZeile('Schaden', w.damage));
      if (w.damageType) z.push('  ' + btZeile('Schadensart', w.damageType));
      if ((w.properties || []).length) z.push('  ' + btZeile('Eigenschaften', (w.properties || []).join(', ')));
      const wi = btWirkungenText(w.effects);
      if (wi) z.push('  ' + btZeile('Wirkung', wi));
      btText('Text', htmlZuText(w.description), '  ').forEach(x => z.push(x));
    });
  }

  if ((c.spells || []).length) {
    z.push('');
    z.push('[Zauber]');
    (c.spells || []).forEach(s => {
      z.push('- ' + (s.name || 'Zauber'));
      z.push('  ' + btZeile('Grad', +s.level || 0));
      if (s.school) z.push('  ' + btZeile('Schule', s.school));
      if (s.castingTime) z.push('  ' + btZeile('Zeitaufwand', s.castingTime));
      if (s.range) z.push('  ' + btZeile('Reichweite', s.range));
      if (s.duration) z.push('  ' + btZeile('Dauer', s.duration));
      if (s.components) z.push('  ' + btZeile('Komponenten', s.components));
      z.push('  ' + btZeile('Vorbereitet', btJaText(s.prepared !== false)));
      btText('Text', htmlZuText(s.description), '  ').forEach(x => z.push(x));
    });
  }

  if ((c.inventory || []).length) {
    z.push('');
    z.push('[Ausrüstung]');
    const platzVon = (id) => {
      const s = GEAR_SLOTS.find(x => { const g = (c.gear || {})[x.key]; return g && g.id === id; });
      return s ? s.label : '';
    };
    (c.inventory || []).forEach(i => {
      z.push('- ' + (i.name || 'Gegenstand') + ((+i.qty || 1) > 1 ? ' ×' + (+i.qty || 1) : ''));
      if (i.rarity) z.push('  ' + btZeile('Seltenheit', i.rarity));
      if (i.weight) z.push('  ' + btZeile('Gewicht', i.weight));
      if (+i.wert) z.push('  ' + btZeile('Wert', +i.wert));
      if (i.source) z.push('  ' + btZeile('Quelle', i.source));
      if ((i.tags || []).length) z.push('  ' + btZeile('Schlagworte', (i.tags || []).join(', ')));
      if (i.gearKind) z.push('  ' + btZeile('Art', i.gearKind));
      if (i.armorType) z.push('  ' + btZeile('Rüstungsart', i.armorType));
      if (+i.baseAC) z.push('  ' + btZeile('Grund-RK', +i.baseAC));
      if (+i.acBonus) z.push('  ' + btZeile('RK-Bonus', +i.acBonus));
      if (i.kampf) z.push('  ' + btZeile('Im Kampf', 'ja'));
      const wi = btWirkungenText(i.effects);
      if (wi) {
        z.push('  ' + btZeile('Wirkung', wi));
        z.push('  ' + btZeile('Wirkung aktiv', btJaText(!!i.effectsActive)));
      }
      const p = platzVon(i.id);
      if (p) z.push('  ' + btZeile('Getragen', p));
      btText('Text', htmlZuText(i.description), '  ').forEach(x => z.push(x));
    });
  }

  const getragenW = GEAR_SLOTS.filter(s => { const g = (c.gear || {})[s.key]; return g && g.k === 'w'; })
    .map(s => { const w = (c.weapons || []).find(x => x.id === (c.gear[s.key] || {}).id); return w ? s.label + ': ' + w.name : ''; })
    .filter(Boolean);
  if (getragenW.length) {
    z.push('');
    z.push('[Waffenplätze]');
    getragenW.forEach(x => z.push(x));
  }

  const m = c.currency || {};
  if (['pp', 'gp', 'ep', 'sp', 'cp'].some(k => +m[k])) {
    z.push('');
    z.push('[Münzen]');
    paar('Platin', +m.pp || 0);
    paar('Gold', +m.gp || 0);
    paar('Elektrum', +m.ep || 0);
    paar('Silber', +m.sp || 0);
    paar('Kupfer', +m.cp || 0);
  }

  const notizen = (c.notesList || []);
  if (notizen.length || String(c.notes || '').trim()) {
    z.push('');
    z.push('[Notizen]');
    if (String(c.notes || '').trim()) btText('Freitext', htmlZuText(c.notes), '').forEach(x => z.push(x));
    notizen.forEach(n => {
      z.push('- ' + (n.title || 'Notiz'));
      if ((n.tags || []).length) z.push('  ' + btZeile('Schlagworte', (n.tags || []).join(', ')));
      btText('Text', htmlZuText(n.content), '  ').forEach(x => z.push(x));
    });
  }

  return z.join('\n') + '\n';
};

// ── Lesen: aus dem Text ein Bogen ────────────────────────────────
// Was hier entsteht, ist noch kein Eintrag der Anwendung: die Kennung
// vergibt erst, wer ihn einspielt. Warnungen sammeln, was übergangen
// wurde — sie stehen später in der Vorschau.
const bogenAusText = (text, opt) => {
  const warnungen = [];
  const abschnitte = btZerlegen(text);
  const marke = /^\s*#\s*Heldenbuch-Bogen/i.test(String(text || ''));
  const bogen = newChar();
  const o = opt || {};
  let nr = 0;
  const kennung = (vorsilbe) => vorsilbe + (o.jetzt || Date.now()) + '_' + (++nr);

  const kopf = btAbschnitt(abschnitte, 'Bogen');
  bogen.name = String(btWertAus(kopf, 'Name') || '').trim();
  const art = String(btWertAus(kopf, 'Art') || '').trim();
  if (/nsc/i.test(art)) {
    bogen.npc = true; bogen.dmOnly = true;
    bogen.haltung = /feind/i.test(art) ? 'feindlich' : 'freundlich';
  } else if (/spielleitung|nur dm/i.test(art)) {
    bogen.dmOnly = true;
  }
  const setzeText = (feld, ...namen) => { const v = btWertAus(kopf, ...namen); if (v !== undefined && String(v).trim()) bogen[feld] = String(v).trim(); };
  setzeText('race', 'Volk', 'Rasse');
  setzeText('charClass', 'Klasse');
  setzeText('background', 'Hintergrund');
  setzeText('subclass', 'Unterklasse');
  const stufe = btWertAus(kopf, 'Stufe');
  if (stufe !== undefined) bogen.level = Math.max(1, Math.min(20, Math.round(btZahl(stufe, 1))));
  const pb = btWertAus(kopf, 'Übungsbonus');
  if (pb !== undefined) bogen.profBonus = Math.max(1, Math.round(btZahl(pb, 2)));
  bogen.multiclasses = btListe(btWertAus(kopf, 'Nebenklassen', 'Nebenklasse')).map(w => {
    const m = /^(.*?)\s*(\d+)?\s*(?:\((.*)\))?$/.exec(w.trim()) || [];
    return {charClass: (m[1] || w).trim(), level: Math.max(1, Math.round(btZahl(m[2], 1))), subclass: (m[3] || '').trim()};
  }).filter(x => x.charClass);

  const attr = btAbschnitt(abschnitte, 'Attribute');
  BT_ATTRIBUTE.forEach(a => {
    const v = btWertAus(attr, a.label, a.key, AL[a.key]);
    if (v !== undefined) bogen[a.key] = Math.round(btZahl(v, 10));
  });

  const werte = btAbschnitt(abschnitte, 'Werte');
  const tp = btWertAus(werte, 'Trefferpunkte', 'TP');
  if (tp !== undefined) {
    const [jetzt, max] = btPaarZahlen(tp);
    bogen.maxHp = Math.max(1, Math.round(max || jetzt));
    bogen.hp = Math.round(jetzt);
  }
  const zahlFeld = (feld, ...namen) => { const v = btWertAus(werte, ...namen); if (v !== undefined) bogen[feld] = btZahl(v, bogen[feld]); };
  zahlFeld('tempHp', 'Temporäre TP');
  zahlFeld('tempMaxHp', 'Zusätzliches TP-Maximum');
  zahlFeld('ac', 'Rüstungsklasse', 'RK');
  zahlFeld('speed', 'Bewegung');
  zahlFeld('initiative', 'Initiative');
  zahlFeld('erschoepfung', 'Erschöpfung');
  const insp = btWertAus(werte, 'Inspiration');
  if (insp !== undefined) {
    const [a, b] = btPaarZahlen(insp);
    bogen.inspiration = Math.round(a); bogen.inspirationMax = Math.max(1, Math.round(b || 1));
  }
  const zp = btWertAus(werte, 'Zauberpunkte');
  if (zp !== undefined) {
    const [max, used] = btPaarZahlen(zp);
    bogen.sorceryPoints = {max: Math.round(max), used: Math.round(used)};
  }

  const ueb = btAbschnitt(abschnitte, 'Übungen');
  const schluesselListe = (wert, tabelle, was) => btListe(wert).map(w => {
    const k = btSchluessel(w, tabelle);
    if (!k) warnungen.push('Unbekannt bei ' + was + ': „' + w + '"');
    return k;
  }).filter(Boolean);
  bogen.savingThrowProfs = schluesselListe(btWertAus(ueb, 'Rettungswürfe'), BT_ATTRIBUTE, 'Rettungswürfe');
  bogen.skillProfs = schluesselListe(btWertAus(ueb, 'Fertigkeiten'), BT_FERTIGKEITEN, 'Fertigkeiten');
  bogen.expertiseProfs = schluesselListe(btWertAus(ueb, 'Expertise'), BT_FERTIGKEITEN, 'Expertise');
  bogen.jackOfAllTrades = btJa(btWertAus(ueb, 'Alleskönner'));
  bogen.languages = btListe(btWertAus(ueb, 'Sprachen'));
  bogen.toolProfs = btListe(btWertAus(ueb, 'Werkzeuge'));
  bogen.weaponProfs = btListe(btWertAus(ueb, 'Waffen und Rüstungen', 'Waffen', 'Rüstungen'));

  const slots = btAbschnitt(abschnitte, 'Zauberplätze');
  Object.keys(slots.paare).forEach(k => {
    const grad = Math.round(btZahl(k, 0));
    if (!(grad >= 1 && grad <= 9)) { warnungen.push('Zauberplätze: „' + k + '" ist kein Grad von 1 bis 9'); return; }
    const [max, used] = btPaarZahlen(slots.paare[k]);
    bogen.spellSlots[grad] = {max: Math.round(max), used: Math.round(used)};
  });

  bogen.resources = btAbschnitt(abschnitte, 'Ressourcen').liste.map(e => {
    const [max, used] = btPaarZahlen(btEintragWert(e, 'Vorrat') || '0');
    return {
      id: kennung('r'), name: e.wert, abbr: String(btEintragWert(e, 'Kurz') || '').trim(),
      max: Math.round(max), used: Math.round(used),
      color: String(btEintragWert(e, 'Farbe') || '').trim(),
      restType: btSchluessel(btEintragWert(e, 'Auffrischen') || 'lange Rast', BT_AUFFRISCHEN) || 'lang',
    };
  });

  bogen.features = btAbschnitt(abschnitte, 'Merkmale').liste.map((e, i) => {
    const res = String(btEintragWert(e, 'Ressource') || '').trim();
    const teile = res.split(',');
    const gefunden = res ? bogen.resources.find(r => btGleich(r.name, teile[0].trim())) : null;
    if (res && !gefunden) warnungen.push('Merkmal „' + e.wert + '": Ressource „' + teile[0].trim() + '" gibt es nicht');
    const wirkAktiv = btEintragWert(e, 'Wirkung aktiv');
    return {
      id: kennung('f'), name: e.wert, source: String(btEintragWert(e, 'Quelle') || '').trim(),
      description: textZuHtml(btEintragWert(e, 'Text', 'Beschreibung') || ''),
      effects: btWirkungenLesen(btEintragWert(e, 'Wirkung'), 'f' + i + '_', warnungen),
      effectsActive: wirkAktiv === undefined ? true : btJa(wirkAktiv),
      ressource: gefunden ? gefunden.id : '',
      ressourceKosten: teile[1] ? Math.round(btZahl(teile[1], 1)) : (gefunden ? 1 : 0),
      zauber: String(btEintragWert(e, 'Zauber') || '').trim(),
    };
  });

  bogen.weapons = btAbschnitt(abschnitte, 'Waffen').liste.map((e, i) => ({
    ...newWeapon(), id: kennung('w'), name: e.wert,
    attrKey: btSchluessel(btEintragWert(e, 'Attribut') || 'Stärke', BT_ATTRIBUTE) || 'str',
    proficient: btEintragWert(e, 'Geübt') === undefined ? true : btJa(btEintragWert(e, 'Geübt')),
    range: String(btEintragWert(e, 'Reichweite') || '1,5m').trim(),
    attackBonus: Math.round(btZahl(btEintragWert(e, 'Angriffsbonus'), 0)),
    damage: String(btEintragWert(e, 'Schaden') || '').trim(),
    damageType: String(btEintragWert(e, 'Schadensart') || '').trim(),
    properties: btListe(btEintragWert(e, 'Eigenschaften')),
    effects: btWirkungenLesen(btEintragWert(e, 'Wirkung'), 'w' + i + '_', warnungen),
    description: textZuHtml(btEintragWert(e, 'Text', 'Beschreibung') || ''),
  }));

  bogen.spells = btAbschnitt(abschnitte, 'Zauber').liste.map(e => ({
    ...newSpell(), id: kennung('s'), name: e.wert,
    level: Math.max(0, Math.min(9, Math.round(btZahl(btEintragWert(e, 'Grad'), 1)))),
    school: String(btEintragWert(e, 'Schule') || 'Hervorrufung').trim(),
    castingTime: String(btEintragWert(e, 'Zeitaufwand', 'Zeit') || '1 Aktion').trim(),
    range: String(btEintragWert(e, 'Reichweite') || '').trim(),
    duration: String(btEintragWert(e, 'Dauer') || '').trim(),
    components: String(btEintragWert(e, 'Komponenten') || '').trim(),
    prepared: btEintragWert(e, 'Vorbereitet') === undefined ? true : btJa(btEintragWert(e, 'Vorbereitet')),
    description: textZuHtml(btEintragWert(e, 'Text', 'Beschreibung') || ''),
  }));

  const gear = {};
  bogen.inventory = btAbschnitt(abschnitte, 'Ausrüstung').liste.map((e, i) => {
    const m = /^(.*?)(?:\s*[×x*]\s*(\d+))?$/.exec(e.wert.trim()) || [];
    const stueck = {
      ...newItem(), id: kennung('i'), name: (m[1] || e.wert).trim(),
      qty: Math.max(1, Math.round(btZahl(m[2], 1))),
      rarity: String(btEintragWert(e, 'Seltenheit') || 'gewöhnlich').trim(),
      weight: String(btEintragWert(e, 'Gewicht') || '').trim(),
      wert: btZahl(btEintragWert(e, 'Wert'), 0),
      source: String(btEintragWert(e, 'Quelle') || '').trim(),
      tags: btListe(btEintragWert(e, 'Schlagworte')),
      gearKind: String(btEintragWert(e, 'Art') || '').trim(),
      armorType: String(btEintragWert(e, 'Rüstungsart') || '').trim(),
      baseAC: Math.round(btZahl(btEintragWert(e, 'Grund-RK'), 0)),
      acBonus: Math.round(btZahl(btEintragWert(e, 'RK-Bonus'), 0)),
      kampf: btJa(btEintragWert(e, 'Im Kampf')),
      effects: btWirkungenLesen(btEintragWert(e, 'Wirkung'), 'i' + i + '_', warnungen),
      effectsActive: btJa(btEintragWert(e, 'Wirkung aktiv')),
      description: textZuHtml(btEintragWert(e, 'Text', 'Beschreibung') || ''),
    };
    const platz = String(btEintragWert(e, 'Getragen') || '').trim();
    if (platz) {
      const k = btSchluessel(platz, BT_PLAETZE);
      if (k) gear[k] = {k: 'i', id: stueck.id};
      else warnungen.push('Unbekannter Platz übergangen: „' + platz + '"');
    }
    return stueck;
  });

  const wplaetze = btAbschnitt(abschnitte, 'Waffenplätze');
  Object.keys(wplaetze.paare).forEach(p => {
    const k = btSchluessel(p, BT_PLAETZE);
    const w = bogen.weapons.find(x => btGleich(x.name, wplaetze.paare[p]));
    if (k && w) { gear[k] = {k: 'w', id: w.id}; w.equipped = true; }
    else warnungen.push('Waffenplatz übergangen: „' + p + ': ' + wplaetze.paare[p] + '"');
  });
  bogen.gear = gear;
  bogen.gearMigrated = GEAR_MIGRATION;

  const muenzen = btAbschnitt(abschnitte, 'Münzen');
  const muenzKarte = [['pp', 'Platin'], ['gp', 'Gold'], ['ep', 'Elektrum'], ['sp', 'Silber'], ['cp', 'Kupfer']];
  muenzKarte.forEach(([k, wort]) => {
    const v = btWertAus(muenzen, wort, k);
    if (v !== undefined) bogen.currency[k] = Math.round(btZahl(v, 0));
  });

  const notizen = btAbschnitt(abschnitte, 'Notizen');
  const frei = btWertAus(notizen, 'Freitext');
  if (frei !== undefined && String(frei).trim()) bogen.notes = textZuHtml(frei);
  bogen.notesList = notizen.liste.map(e => ({
    id: kennung('n'), title: e.wert, tags: btListe(btEintragWert(e, 'Schlagworte')),
    content: textZuHtml(btEintragWert(e, 'Text', 'Inhalt') || ''),
  }));

  if (!bogen.name) return {bogen: null, warnungen, fehler: marke ? 'Ohne Namen — im Abschnitt [Bogen] fehlt „Name".' : 'Das sieht nicht nach einem Heldenbuch-Bogen aus.'};
  return {bogen, warnungen, fehler: ''};
};

// ── Dateinamen ───────────────────────────────────────────────────
const btSicher = (name) => String(name || '').replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'bogen';
const bogenDateiname = (c) => btSicher(c && c.name) + '.txt';
const bogenBuendelName = (was, jetzt) => 'heldenbuch-' + btSicher(was || 'boegen').toLowerCase() + '-'
  + new Date(jetzt || Date.now()).toISOString().slice(0, 10) + '.zip';

// Beim Bündeln darf kein Name zweimal vorkommen — sonst überschreibt
// der zweite Wirt den ersten.
const bogenNamenEindeutig = (namen) => {
  const gesehen = new Map();
  return namen.map(n => {
    const zahl = (gesehen.get(n) || 0) + 1;
    gesehen.set(n, zahl);
    if (zahl === 1) return n;
    const punkt = n.lastIndexOf('.');
    return punkt > 0 ? n.slice(0, punkt) + '-' + zahl + n.slice(punkt) : n + '-' + zahl;
  });
};

// Was ein Stapel gelesener Dateien ergibt: je Datei ein Bogen oder ein
// Grund, warum nicht. Gleiche Namen im Bestand werden hier schon gefunden,
// damit die Vorschau sie zeigen kann, bevor etwas geschrieben wird.
const bogenStapel = (dateien, bestand, opt) => (dateien || []).map((d, i) => {
  const {bogen, warnungen, fehler} = bogenAusText(d.text, {jetzt: (opt && opt.jetzt) || Date.now(), nr: i});
  const vorhanden = bogen ? (bestand || []).find(c => !c.archived && btGleich(c.name, bogen.name)) : null;
  return {
    datei: d.name, bogen, warnungen, fehler,
    vorhandenId: vorhanden ? vorhanden.id : '',
    wahl: fehler ? 'aus' : (vorhanden ? 'ersetzen' : 'neu'),
  };
});
// ══ Ende der reinen Rechnung

// ── Die Textdateien holen und ablegen ────────────────────────────
// Eine .txt wird gelesen, wie sie ist; ein .zip wird entpackt und jede
// .txt daraus genommen. Unterordner sind erlaubt, alles andere im ZIP
// wird übergangen — ein Bild neben dem Bogen stört nicht.
const bogenDateienLesen = async (dateien) => {
  const raus = [];
  for (const d of dateien || []) {
    const name = d.name || 'ohne-namen';
    if (/\.zip$/i.test(name)) {
      const zip = await zipLesen(d);
      for (const e of zip.eintraege) {
        if (!/\.txt$/i.test(e.name) || e.name.endsWith('/')) continue;
        const bytes = await zip.lesen(e);
        raus.push({name: e.name, text: new TextDecoder().decode(bytes)});
      }
    } else {
      raus.push({name, text: await d.text()});
    }
  }
  return raus;
};

const bogenHerunterladen = (name, inhalt, art) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(inhalt instanceof Blob ? inhalt : new Blob([inhalt], {type: art || 'text/plain;charset=utf-8'}));
  a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};

// Ein Beispiel zum Herunterladen: dasselbe Schema, mit erklärenden
// Werten. Wer eine KI bittet, einen NSC zu schreiben, legt ihr diese
// Datei vor — sie zeigt jedes Feld einmal.
const BT_BEISPIEL = {
  ...newChar(),
  name: 'Wirt Arik (Beispiel)', npc: true, dmOnly: true, haltung: 'freundlich',
  race: 'Mensch', charClass: 'Kämpfer', level: 2, background: 'Gastwirt', profBonus: 2,
  str: 12, dex: 10, con: 14, int: 11, wis: 13, cha: 15,
  hp: 16, maxHp: 16, ac: 12, speed: 9, initiative: 0,
  savingThrowProfs: ['str', 'con'], skillProfs: ['einschuechtern', 'einblick'],
  languages: ['Gemeinsprache'], toolProfs: ['Brauerwerkzeug'],
  features: [{id: 'f1', name: 'Kennt jeden im Dorf', source: 'Gastwirt',
    description: '<p>Weiß, wer gestern wo getrunken hat.</p>', effects: [], effectsActive: true}],
  weapons: [{...newWeapon(), id: 'w1', name: 'Knüppel', damage: '1W6', damageType: 'Wucht'}],
  inventory: [{...newItem(), id: 'i1', name: 'Schankschürze', qty: 1, description: '<p>Fleckig.</p>'}],
  currency: {pp: 0, gp: 12, ep: 0, sp: 40, cp: 0},
  notesList: [{id: 'n1', title: 'Haltung zur Gruppe', tags: ['NSC'],
    content: '<p>Freundlich, solange bezahlt wird.</p>'}],
};

// ── Das Fenster ──────────────────────────────────────────────────
const BT_WAHL = [
  {k: 'neu', wort: 'Neu anlegen'},
  {k: 'ersetzen', wort: 'Vorhandenen ersetzen'},
  {k: 'aus', wort: 'Überspringen'},
];

const BogenAustausch = ({chars, advName, istNscListe, onEinspielen, onSchliessen}) => {
  const [stapel, setStapel] = React.useState(null);      // null = noch nichts gelesen
  const [laedt, setLaedt] = React.useState(false);
  const [fehler, setFehler] = React.useState('');
  const [exportWas, setExportWas] = React.useState('alle');
  const [fertig, setFertig] = React.useState('');
  const eingabe = React.useRef(null);

  const gewaehlt = (stapel || []).filter(e => e.wahl !== 'aus' && e.bogen);
  const helden = (chars || []).filter(c => !c.archived && !istNsc(c));
  const nscs   = (chars || []).filter(c => !c.archived && istNsc(c));
  const fuerExport = exportWas === 'helden' ? helden : exportWas === 'nsc' ? nscs : [...helden, ...nscs];

  const dateienGewaehlt = async (liste) => {
    setFehler(''); setFertig(''); setLaedt(true);
    try {
      const roh = await bogenDateienLesen([...liste]);
      if (!roh.length) throw new Error('Keine Textdatei dabei. Erwartet wird eine .txt oder ein .zip mit .txt-Dateien darin.');
      setStapel(bogenStapel(roh, chars));
    } catch (e) {
      setStapel(null);
      setFehler(e.message || 'Die Datei ließ sich nicht lesen.');
    }
    setLaedt(false);
  };

  const einspielen = () => {
    const zahl = onEinspielen(gewaehlt);
    setStapel(null);
    setFertig(zahl === 1 ? 'Ein Bogen ist eingelesen.' : zahl + ' Bögen sind eingelesen.');
  };

  const alleAuf = (wahl) => setStapel(s => s.map(e => (e.fehler || (wahl === 'ersetzen' && !e.vorhandenId)) ? e : {...e, wahl}));

  const exportieren = async () => {
    setFehler(''); setFertig(''); setLaedt(true);
    try {
      const namen = bogenNamenEindeutig(fuerExport.map(bogenDateiname));
      const eintraege = fuerExport.map((c, i) => ({name: namen[i], daten: bogenAlsText(c), packen: true}));
      const blob = await zipSchreiben(eintraege);
      bogenHerunterladen(bogenBuendelName(advName, Date.now()), blob, 'application/zip');
      setFertig(fuerExport.length + (fuerExport.length === 1 ? ' Bogen liegt' : ' Bögen liegen') + ' als ZIP bereit.');
    } catch (e) {
      setFehler('Das Bündeln ging nicht: ' + (e.message || ''));
    }
    setLaedt(false);
  };

  return (
    <Fenster onZu={onSchliessen} leiste={{id: 'boegen', titel: 'Bögen', symbol: '📥'}}>
    <div className="form-modal breit bt-fenster" style={{maxWidth: 820}}>
      <div className="form-title">📥 Bögen ein- und auslesen</div>

      <div className="bt-teil">
        <h4>Auslesen</h4>
        <p className="bt-hinweis">
          Jeder Bogen wird eine Textdatei nach festem Schema — lesbar, änderbar und wieder einlesbar.
          Das Bild kommt nicht mit.
        </p>
        <div className="bt-zeile">
          <select className="form-input" value={exportWas} aria-label="Was ausgelesen wird"
            onChange={e => setExportWas(e.target.value)}>
            <option value="alle">Helden und NSC ({helden.length + nscs.length})</option>
            <option value="helden">Nur Helden ({helden.length})</option>
            <option value="nsc">Nur NSC ({nscs.length})</option>
          </select>
          <button className="btn-save" disabled={!fuerExport.length || laedt} onClick={exportieren}>
            📦 Als ZIP sichern
          </button>
        </div>
      </div>

      <div className="bt-teil">
        <h4>Einlesen</h4>
        <p className="bt-hinweis">
          Eine .txt oder ein .zip mit vielen .txt darin. Vor dem Schreiben siehst du, was gefunden wurde.
        </p>
        <div className="bt-zeile">
          <input ref={eingabe} type="file" accept=".txt,.zip,text/plain,application/zip" multiple hidden
            onChange={e => { dateienGewaehlt(e.target.files || []); e.target.value = ''; }} />
          <button className="btn-save" disabled={laedt} onClick={() => eingabe.current && eingabe.current.click()}>
            📂 Dateien wählen …
          </button>
          <button className="btn-cancel" onClick={() => bogenHerunterladen('heldenbuch-bogen-schema.txt', bogenAlsText(BT_BEISPIEL))}>
            📄 Schema als Beispiel
          </button>
        </div>
      </div>

      {laedt && <div className="bt-hinweis">Wird gelesen …</div>}
      {fehler && <div className="bt-fehler">{fehler}</div>}
      {fertig && <div className="bt-gut">{fertig}</div>}

      {stapel && (
        <div className="bt-vorschau">
          <div className="bt-zeile bt-alle">
            <span>{stapel.length} {stapel.length === 1 ? 'Datei' : 'Dateien'} gelesen</span>
            <span className="bt-alle-knoepfe">
              Alle:
              {BT_WAHL.map(w => (
                <button key={w.k} className="btn-cancel bt-klein" onClick={() => alleAuf(w.k)}>{w.wort}</button>
              ))}
            </span>
          </div>
          <ul className="bt-liste">
            {stapel.map((e, i) => (
              <li key={i} className={'bt-eintrag' + (e.fehler ? ' schlecht' : '')}>
                <div className="bt-eintrag-kopf">
                  <b>{e.bogen ? e.bogen.name : e.datei}</b>
                  <span className="bt-leise">
                    {e.bogen
                      ? (istNsc(e.bogen) ? nscArt(e.bogen).zeichen + ' NSC' : '🛡 Held')
                        + ' · ' + (e.bogen.charClass || '—') + ' ' + e.bogen.level
                        + (e.vorhandenId ? ' · Name schon vorhanden' : ' · neu')
                      : e.fehler}
                  </span>
                </div>
                {!e.fehler && (
                  <div className="bt-eintrag-wahl">
                    {BT_WAHL.map(w => (
                      <label key={w.k} className={w.k === 'ersetzen' && !e.vorhandenId ? 'aus' : ''}>
                        <input type="radio" name={'bt' + i} checked={e.wahl === w.k}
                          disabled={w.k === 'ersetzen' && !e.vorhandenId}
                          onChange={() => setStapel(s => s.map((x, j) => j === i ? {...x, wahl: w.k} : x))} />
                        <span>{w.wort}</span>
                      </label>
                    ))}
                  </div>
                )}
                {(e.warnungen || []).length > 0 && (
                  <ul className="bt-warnungen">
                    {e.warnungen.slice(0, 6).map((w, j) => <li key={j}>{w}</li>)}
                    {e.warnungen.length > 6 && <li>… und {e.warnungen.length - 6} weitere</li>}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions">
        <span className="bt-leise" style={{marginRight: 'auto'}}>
          {istNscListe ? 'Eingelesene NSC landen in der NSC-Liste.' : ''}
        </span>
        <button className="btn-cancel" onClick={onSchliessen}>Schließen</button>
        {stapel && (
          <button className="btn-save" disabled={!gewaehlt.length} onClick={einspielen}>
            ✶ {gewaehlt.length} {gewaehlt.length === 1 ? 'Bogen' : 'Bögen'} einlesen
          </button>
        )}
      </div>
    </div>
    </Fenster>
  );
};
