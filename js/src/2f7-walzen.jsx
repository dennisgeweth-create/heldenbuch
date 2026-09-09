// Heldenbuch — Das Fuenfwalzen-Geruest.
//
// Der bestehende Automat hat drei Walzen und fuenf feste Linien; seine
// Quote ist eine geschlossene Formel. Fuer fuenf Walzen mit Wild-Ersatz,
// verstreuten Zeichen und Freispielrunden geht das nicht mehr — und
// deshalb steht hier ein anderes Geruest, kein groesseres.
//
// Drei Automaten setzen darauf auf. Sie unterscheiden sich einzig in der
// Regel, die im Freispiel zusaetzlich gilt; alles andere — Bandlauf,
// Linienwertung, Streuzeichen, Rechnung, Anzeige — steht hier einmal.
//
// Was hier NICHT steht: React-Zustand fuer ein bestimmtes Spiel. Der
// obere Teil dieser Datei ist reine Rechnung ohne React und ohne JSX und
// laesst sich deshalb einzeln pruefen (dev: bis zur Marke schneiden und
// durch node schicken).

const W_WALZEN = 5;
const W_REIHEN = 3;
const W_FELDER = W_WALZEN * W_REIHEN;      // 0..4 oben, 5..9 Mitte, 10..14 unten

// ── Die zehn Linien ──────────────────────────────────────────────
// Zuschaltbar sind sie nicht. Im Original darf man Linien abwaehlen und
// spielt damit einen schlechteren Automaten — diese Falle muss das
// Heldenbuch nicht nachbauen. Zehn Linien, immer alle.
const W_LINIEN = [
  {name:'Mitte',       felder:[ 5, 6, 7, 8, 9]},
  {name:'Oben',        felder:[ 0, 1, 2, 3, 4]},
  {name:'Unten',       felder:[10,11,12,13,14]},
  {name:'V',           felder:[ 0, 6,12, 8, 4]},
  {name:'Λ',           felder:[10, 6, 2, 8,14]},
  {name:'Wanne oben',  felder:[ 0, 1, 7,13,14]},
  {name:'Wanne unten', felder:[10,11, 7, 3, 4]},
  {name:'Zacke oben',  felder:[ 5, 1, 2, 3, 9]},
  {name:'Zacke unten', felder:[ 5,11,12,13, 9]},
  {name:'Zickzack',    felder:[ 0, 6, 2, 8, 4]},
];

// Der Einsatz auf der Leiter ist der Gesamteinsatz; der Linieneinsatz ist
// ein Zehntel davon. Gerechnet wird in Bruchzahlen und gerundet einmal am
// Ende eines Drehs — nicht je Linie, sonst summieren sich zehn
// Rundungsfehler zu einem sichtbaren.
const wLinieneinsatz = (einsatz) => (+einsatz || 0) / W_LINIEN.length;

// ── Zeichen ──────────────────────────────────────────────────────
// Ein Zeichen hat drei Rollen, die sich nicht ausschliessen:
//
//   zahlt  — zahlt auf einer Linie, je Laenge. {3:x, 4:y, 5:z}
//   wild   — ersetzt jedes andere Zeichen auf einer Linie.
//   streu  — zaehlt irgendwo auf dem Feld und zahlt ueber den
//            Gesamteinsatz. {3:x, …}
//
// Das Buch des ersten Automaten ist wild UND streu; die Klinge des
// dritten ist wild und zahlt selbst; der Waechter des zweiten ist nur
// wild und zahlt nichts. Alle drei Faelle fallen hier heraus, ohne dass
// die Wertung sie kennt.
const wZahlt  = (sym, n) => (sym && sym.zahlt && +sym.zahlt[n]) || 0;
const wStreut = (sym, n) => (sym && sym.streu && +sym.streu[n]) || 0;
const wSymbol = (k, symbole) => symbole.find(s => s.k === k) || null;

// ── Baender statt Wuerfeln ───────────────────────────────────────
// Der bestehende Automat zieht jedes Feld einzeln. Fuer fuenf Walzen
// taugt das nicht: dann liesse sich weder einstellen, dass ein Zeichen
// nie auf der ersten Walze liegt, noch wie oft zwei gleiche uebereinander
// stehen. Ein echtes Geraet hat je Walze ein Band; gezogen wird eine
// Stelle darauf, sichtbar sind drei aufeinanderfolgende Eintraege.
const wZiehen = (baender, zufall) => {
  const r = zufall || Math.random;
  const feld = new Array(W_FELDER);
  for (let w = 0; w < W_WALZEN; w++) {
    const band = baender[w];
    const p = Math.floor(r() * band.length);
    for (let z = 0; z < W_REIHEN; z++) feld[z * W_WALZEN + w] = band[(p + z) % band.length];
  }
  return feld;
};

// Ein Band von Hand hinzuschreiben waere fuer fuenf Walzen eine Liste von
// dreihundert Eintraegen, in der niemand mehr sieht, was gemeint ist —
// und in der beim Abtippen genau die Klumpen entstehen, die ein Band
// nicht haben soll. Also steht da, wie oft ein Zeichen auf dem Band
// liegt, und die Plaetze werden gleichmaessig verteilt: haeufige zuerst,
// jedes im gleichen Abstand, der Versatz je Walze anders.
const wBandAusAnzahlen = (anzahlen, laenge, versatz) => {
  const band = new Array(laenge).fill(null);
  const liste = Object.keys(anzahlen).map(k => [k, +anzahlen[k] || 0])
    .filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (!liste.length) return band;
  liste.forEach((paar, idx) => {
    const k = paar[0], c = paar[1];
    // Der Bruchteil verschiebt die Reihe gegen die vorige, damit nicht
    // alle Zeichen auf denselben Plaetzen anfangen.
    const anfang = ((versatz || 0) + idx * 0.37) % 1;
    for (let j = 0; j < c; j++) {
      let p = Math.round((j + anfang) * laenge / c) % laenge;
      let n = 0;
      while (band[p] !== null && n < laenge) { p = (p + 1) % laenge; n++; }
      if (band[p] === null) band[p] = k;
    }
  });
  // Was die Rundung uebriglaesst, bekommt das haeufigste Zeichen.
  for (let i = 0; i < laenge; i++) if (band[i] === null) band[i] = liste[0][0];
  return band;
};

// Fuenf Baender aus denselben Anzahlen, je Walze anders versetzt.
const wBaenderAus = (anzahlen, laenge) =>
  [0, 1, 2, 3, 4].map(w => wBandAusAnzahlen(anzahlen, laenge, w * 0.2 + 0.05));

// ── Eine Linie ───────────────────────────────────────────────────
// Von links, ab Walze 1, ohne Luecke.
//
// Welches Zeichen ein Wild vertritt, entscheidet der Gewinn. Deshalb wird
// jedes zahlende Zeichen durchprobiert und das beste genommen, statt das
// erste Feld zu befragen. Das ist keine Feinheit: bei einem Automaten,
// dessen Wild selbst zahlt, waere die Antwort sonst manchmal falsch —
// zwei Klingen und drei Fechterinnen zahlen als Fechterinnen mehr, drei
// Klingen und zwei Fechterinnen als Klingen.
const wLinieWerten = (feld, linie, symbole, linieneinsatz) => {
  let best = null;
  for (const sym of symbole) {
    if (!sym.zahlt) continue;                       // reine Streu- und Wildzeichen
    let n = 0;
    for (const f of linie.felder) {
      const k = feld[f];
      if (k === sym.k) { n++; continue; }
      const s2 = wSymbol(k, symbole);
      if (s2 && s2.wild) { n++; continue; }
      break;
    }
    const betrag = wZahlt(sym, n) * linieneinsatz;
    if (betrag <= 0) continue;
    // Bei gleichem Betrag gewinnt die laengere Kette; bei gleicher Laenge
    // das Zeichen, das wirklich auf Walze 1 liegt — damit die Meldung
    // sagt, was man sieht.
    const besser = !best || betrag > best.betrag
      || (betrag === best.betrag && n > best.laenge)
      || (betrag === best.betrag && n === best.laenge && feld[linie.felder[0]] === sym.k);
    if (besser) best = {sym, laenge: n, betrag, felder: linie.felder.slice(0, n)};
  }
  return best;
};

// ── Streuzeichen ─────────────────────────────────────────────────
// Sie zaehlen irgendwo, nicht auf einer Linie. Ein Zeichen darf dabei an
// Walzen gebunden sein: die Hoerner des dritten Automaten zaehlen nur auf
// Walze 1, 3 und 5, und dort je Walze hoechstens einmal. Das macht den
// Ausloeser seltener, als er aussieht, und gehoert deshalb in die Regel
// und nicht in die Baender.
const wStreuWerten = (feld, sym, einsatz) => {
  const wo = [];
  const walzen = new Set();
  for (let i = 0; i < W_FELDER; i++) {
    if (feld[i] !== sym.k) continue;
    const w = i % W_WALZEN;
    if (sym.streuWalzen && !sym.streuWalzen.includes(w)) continue;
    if (sym.streuWalzen && walzen.has(w)) continue;   // je Walze zaehlt eine
    walzen.add(w);
    wo.push(i);
  }
  return {sym, anzahl: wo.length, felder: wo, betrag: wStreut(sym, wo.length) * einsatz};
};

// ── Ein ganzer Dreh ──────────────────────────────────────────────
// Der Gewinn kommt als Bruchzahl heraus. Gerundet wird beim Buchen, und
// zwar einmal.
const wWerten = (feld, symbole, einsatz) => {
  const le = wLinieneinsatz(einsatz);
  const treffer = [];
  let gewinn = 0;
  W_LINIEN.forEach((linie, nr) => {
    const t = wLinieWerten(feld, linie, symbole, le);
    if (!t) return;
    gewinn += t.betrag;
    treffer.push({nr, name: linie.name, ...t});
  });
  const streu = [];
  symbole.filter(s => s.streu).forEach(s => {
    const e = wStreuWerten(feld, s, einsatz);
    if (e.anzahl <= 0) return;
    gewinn += e.betrag;
    streu.push(e);
  });
  return {gewinn, treffer, streu};
};

// Wie oft ein Streuzeichen liegt — die Frage, an der jede Freispielrunde
// haengt. Ohne Wertung, weil der Ausloeser nichts kostet.
const wStreuZahl = (feld, symbole, k) => {
  const s = wSymbol(k, symbole);
  return s ? wStreuWerten(feld, s, 0).anzahl : 0;
};

// Wo ein Zeichen ueberall liegt, egal auf welcher Linie. Das braucht die
// Bonusrunde des ersten Automaten, deren Sonderzeichen sich ausdehnt.
const wWalzenMit = (feld, k) => {
  const raus = [];
  for (let w = 0; w < W_WALZEN; w++) {
    for (let z = 0; z < W_REIHEN; z++) {
      if (feld[z * W_WALZEN + w] === k) { raus.push(w); break; }
    }
  }
  return raus;
};

// Eine Walze vollstaendig mit einem Zeichen fuellen. Der zweite Automat
// tut das mit seinem Wild, der erste mit dem gelosten Sonderzeichen.
const wWalzeFuellen = (feld, walze, k) => {
  const neu = feld.slice();
  for (let z = 0; z < W_REIHEN; z++) neu[z * W_WALZEN + walze] = k;
  return neu;
};

// ── Die Rechnung ─────────────────────────────────────────────────
// Bei fuenf Walzen mit Wild-Ersatz, Streuzeichen und Freispielen mit
// eigener Regel gibt es keine Formel mehr, die noch jemand pruefen kann.
// Der Ausweg steht schon im Haus: die Rennbahn rechnet 2500 stille
// Rennen, bevor sie ihre Quoten hinschreibt.
//
// Hier eine Stelle klueger. Die Quote ist in den Auszahlungen linear —
// das nutzt schon der bestehende Automat aus, wenn er seine Tafel auf ein
// Ziel streckt. Also braucht die Messung die Auszahlungen gar nicht zu
// kennen: sie zaehlt nur, wie oft was getroffen wird. Heraus kommt eine
// Haeufigkeitstafel aus ein paar Dutzend Zahlen, und die Quote ist von da
// an ein Skalarprodukt — sofort, im Browser, bei jeder Aenderung der
// Spielleitung.
//
// Das gilt, solange keine Regel an einem Auszahlungsbetrag haengt. Beim
// Wachsamen Auge haengt die Veredelungsleiter deshalb an der Reihenfolge
// der Tafel und nicht an ihren Zahlen.
const wZaehler = () => ({
  drehungen: 0,
  linie: {},          // k -> {laenge -> Zahl}
  streu: {},          // k -> {anzahl -> Zahl}
});

// Linien und Streuzeichen getrennt, weil eine Bonusrunde sie oft
// getrennt braucht: das Verschollene Kapitel wertet die Linien auf dem
// ausgefuellten Feld und die Buecher auf dem gezogenen.
const wZaehlenLinien = (z, feld, symbole, gewicht) => {
  const g = gewicht === undefined ? 1 : gewicht;
  W_LINIEN.forEach(linie => {
    const t = wLinieWerten(feld, linie, symbole, 1);
    if (!t) return;
    const e = z.linie[t.sym.k] || (z.linie[t.sym.k] = {});
    e[t.laenge] = (e[t.laenge] || 0) + g;
  });
};
const wZaehlenStreu = (z, feld, symbole, gewicht) => {
  const g = gewicht === undefined ? 1 : gewicht;
  symbole.filter(s => s.streu).forEach(s => {
    const n = wStreuWerten(feld, s, 0).anzahl;
    if (!n) return;
    const e = z.streu[s.k] || (z.streu[s.k] = {});
    e[n] = (e[n] || 0) + g;
  });
};
// Ein ganzer Treffer, so wie ihn der Grunddreh macht.
const wZaehlen = (z, feld, symbole, gewicht) => {
  wZaehlenLinien(z, feld, symbole, gewicht);
  wZaehlenStreu(z, feld, symbole, gewicht);
};
// Eine Kette, die nicht auf einer Linie steht — die Ausdehnung des
// Sonderzeichens zahlt ueber alle zehn Linien auf einmal, ohne dass
// eine davon getroffen sein muesste.
const wZaehlenFrei = (z, k, laenge, wieoft) => {
  const e = z.linie[k] || (z.linie[k] = {});
  e[laenge] = (e[laenge] || 0) + wieoft;
};

// Der Automat gibt eine Runde her, die aus einem Feld heraus laeuft; das
// Geruest weiss nicht, was darin passiert, und muss es auch nicht. Es
// reicht, dass sie zaehlt.
const wMessen = (regeln, drehungen, zufall) => {
  const r = zufall || Math.random;
  const z = wZaehler();
  const sym = regeln.symbole;
  for (let i = 0; i < drehungen; i++) {
    const feld = wZiehen(regeln.baender, r);
    wZaehlen(z, feld, sym, 1);
    if (regeln.freiLauf) regeln.freiLauf(feld, z, r);
    z.drehungen++;
  }
  return z;
};

// Haeufigkeit mal Auszahlung, geteilt durch die Zahl der Drehungen. Die
// Linien zahlen ueber den Linieneinsatz (ein Zehntel), die Streuzeichen
// ueber den Gesamteinsatz — deshalb der Faktor.
const wQuote = (z, symbole) => {
  if (!z || !z.drehungen) return 0;
  let summe = 0;
  Object.keys(z.linie).forEach(k => {
    const s = wSymbol(k, symbole);
    Object.keys(z.linie[k]).forEach(n => { summe += z.linie[k][n] * wZahlt(s, +n) / W_LINIEN.length; });
  });
  Object.keys(z.streu).forEach(k => {
    const s = wSymbol(k, symbole);
    Object.keys(z.streu[k]).forEach(n => { summe += z.streu[k][n] * wStreut(s, +n); });
  });
  return summe / z.drehungen;
};

// Die Quote ist in den Auszahlungen linear, also trifft es genau, alle
// mit demselben Faktor zu strecken. Nur das Runden verschiebt es wieder
// ein wenig — und deshalb steht am Tisch danach die erreichte Zahl und
// nicht die gewuenschte.
const wRunden = (x) => x < 10 ? Math.max(0.05, Math.round(x * 100) / 100)
                     : x < 100 ? Math.round(x * 10) / 10
                     : Math.round(x);
const wEinregeln = (symbole, z, ziel) => {
  const jetzt = wQuote(z, symbole);
  if (!jetzt || !ziel) return symbole;
  const f = ziel / jetzt;
  const strecken = (t) => {
    if (!t) return t;
    const neu = {};
    Object.keys(t).forEach(n => { neu[n] = wRunden(+t[n] * f); });
    return neu;
  };
  return symbole.map(s => ({...s, zahlt: strecken(s.zahlt), streu: strecken(s.streu)}));
};

// Die Auszahlungen der Spielleitung uebernehmen, den Rest vom Standard.
// Wie beim bestehenden Automaten: Name und Zeichen stehen fest, die
// Zahlen nicht. Die Reihenfolge steht ebenfalls fest — an ihr haengt beim
// Wachsamen Auge die Veredelung.
const wSymboleAus = (standard, eig) => {
  if (!eig || !Array.isArray(eig)) return standard;
  const liste = standard.map(s => {
    const o = eig.find(x => x && x.k === s.k);
    if (!o) return s;
    const nimm = (alt, neu) => {
      if (!alt || !neu) return alt;
      const raus = {};
      Object.keys(alt).forEach(n => { raus[n] = Math.max(0, +neu[n] || 0); });
      return raus;
    };
    return {...s, zahlt: nimm(s.zahlt, o.zahlt), streu: nimm(s.streu, o.streu)};
  });
  // Eine Tafel, auf der nichts mehr zahlt, waere kein Automat mehr.
  const zahltWas = liste.some(s => s.zahlt && Object.keys(s.zahlt).some(n => +s.zahlt[n] > 0));
  return zahltWas ? liste : standard;
};

// ══ Ende der reinen Rechnung ═══════════════════════════════════════
// Alles darueber laeuft ohne React und ohne Browser und wird so geprueft.

// ── Der Lauf der Baender ─────────────────────────────────────────
// Fuenf Walzen, die nacheinander stehenbleiben. Wie beim bestehenden
// Automaten ist das Band ein Vorlauf aus Zufallszeichen, an dessen Ende
// die drei stehen, die stehenbleiben sollen.
const W_BAND = 16;
const W_DAUER = [800, 1000, 1200, 1400, 1600];

const wBandBauen = (feld, walze, symbole, zufall) => {
  const r = zufall || Math.random;
  const vorlauf = Array.from({length: W_BAND - W_REIHEN},
    () => symbole[Math.floor(r() * symbole.length)].k);
  const sicht = [];
  for (let z = 0; z < W_REIHEN; z++) sicht.push(feld[z * W_WALZEN + walze]);
  return [...vorlauf, ...sicht];
};

// ── Sofort buchen, danach zeigen ─────────────────────────────────
// Derselbe Grund wie beim bestehenden Automaten, hier noch dringender:
// eine Freispielrunde sind zehn Laeufe hintereinander. Der Ausgang steht
// fest, sobald gezogen wurde; der Lauf zeigt ihn nur. Haengt der
// Zeitgeber im Hintergrund fest — und das darf ein Browser —, stuende
// der Automat sonst auf „Laeuft…" und die Taste bliebe gesperrt.
//
// Deshalb loest jeder Weg auf: der Zeitgeber, das Zurueckkommen zum
// Fenster, und das Verlassen der Seite.
const useWalzenLauf = () => {
  const [laeuft, setLaeuft] = React.useState(false);
  const schwebend = React.useRef(null);       // {fertig, faellig}
  const uhr = React.useRef(null);

  const reduziert = React.useMemo(() => {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch { return false; }
  }, []);

  const aufloesen = React.useCallback(() => {
    const s = schwebend.current;
    if (!s) return;
    schwebend.current = null;
    if (uhr.current) { clearTimeout(uhr.current); uhr.current = null; }
    setLaeuft(false);
    s.fertig();
  }, []);

  React.useEffect(() => {
    const wach = () => {
      if (schwebend.current && (document.hidden || Date.now() >= schwebend.current.faellig)) aufloesen();
    };
    document.addEventListener('visibilitychange', wach);
    return () => {
      document.removeEventListener('visibilitychange', wach);
      if (uhr.current) clearTimeout(uhr.current);
    };
  }, [aufloesen]);

  // Wer Bewegung abgeschaltet hat, bekommt das Ergebnis sofort — auch
  // eine ganze Freispielrunde, und nicht zwoelfmal hintereinander eine
  // Sekunde Warten.
  const starten = React.useCallback((fertig, dauer) => {
    if (reduziert) { fertig(); return; }
    const d = dauer || (Math.max(...W_DAUER) + 60);
    schwebend.current = {fertig, faellig: Date.now() + d};
    setLaeuft(true);
    uhr.current = setTimeout(aufloesen, d);
  }, [aufloesen, reduziert]);

  return {laeuft, starten, aufloesen, reduziert};
};

// Der Gewinn zaehlt hoch, statt dazustehen — kurz genug, dass niemand
// wartet, lang genug, dass man es merkt.
const useHochzaehler = (ziel) => {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!ziel || ziel <= 0) { setN(0); return; }
    const start = Date.now(), dauer = 520;
    const takt = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dauer);
      setN(Math.round(ziel * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) clearInterval(takt);
    }, 40);
    return () => clearInterval(takt);
  }, [ziel]);
  return n;
};

// Zehn Linien koennen zugleich treffen. Alle auf einmal leuchten zu
// lassen hiesse: das halbe Feld leuchtet und man sieht nicht, woran es
// lag. Also nacheinander.
const useLinienWechsel = (treffer) => {
  const [i, setI] = React.useState(-1);
  const zahl = treffer ? treffer.length : 0;
  React.useEffect(() => {
    if (zahl < 2) { setI(-1); return; }
    let k = 0;
    setI(0);
    const takt = setInterval(() => { k = (k + 1) % zahl; setI(k); }, 950);
    return () => clearInterval(takt);
  }, [zahl]);
  return i;
};

// ── Der Schirm ───────────────────────────────────────────────────
// Fuenf Walzen mit je einem Fenster von drei Zellen. Das Band ist 16
// Zellen lang und faehrt auf die letzten drei — daher -81,25 % (13 von
// 16), wie beim bestehenden Automaten.
const WalzenSchirm = ({ baender, symbole, dreh, laeuft, leuchtet, klebt, gefuellt }) => (
  <div className={'walzen-feld' + (laeuft ? ' laeuft' : '')} role="group" aria-label="Walzen">
    {[0,1,2,3,4].map(walze => (
      <div className={'walzen-walze' + (gefuellt && gefuellt.includes(walze) ? ' voll' : '')} key={walze}>
        {/* Der Schluessel traegt die Nummer des Drehs: React baut das Band
            dadurch neu auf, und der Lauf faengt von vorn an, statt beim
            zweiten Mal stehenzubleiben. */}
        <div className="walzen-band" key={dreh}
          style={laeuft ? {animationDuration: W_DAUER[walze] + 'ms'}
                        : {transform: 'translateY(-81.25%)'}}>
          {baender[walze].map((k, i) => {
            const reihe = i - (W_BAND - W_REIHEN);
            const nr = reihe >= 0 ? reihe * W_WALZEN + walze : -1;
            const s = wSymbol(k, symbole);
            // Ein Feld kann beides sein: ein Treffer und ein Zeichen, das
            // stehenbleibt. Dann gilt der Treffer — er sagt, was gerade
            // passiert ist, das Kleben nur, was bleibt.
            return (
              <div key={i} className={'walzen-zelle'
                  + (leuchtet && leuchtet.has(nr) ? ' treffer'
                     : klebt && klebt.has(nr) ? ' klebt' : '')}>
                <span>{s ? s.z : '·'}</span>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

// Welche Felder leuchten: ohne Ergebnis keins, bei einer Linie deren
// Felder, bei mehreren die gerade gezeigte. Streuzeichen leuchten immer
// mit — sie liegen nicht auf einer Linie und kaemen sonst nie dran.
const wLeuchtet = (ergebnis, zeigeLinie) => {
  const raus = new Set();
  if (!ergebnis) return raus;
  const gezeigt = ergebnis.treffer.length > 1 && zeigeLinie >= 0
    ? [ergebnis.treffer[zeigeLinie]] : ergebnis.treffer;
  gezeigt.forEach(t => t.felder.forEach(f => raus.add(f)));
  (ergebnis.streu || []).forEach(e => e.felder.forEach(f => raus.add(f)));
  return raus;
};

// ── Die Tafel ────────────────────────────────────────────────────
// Sie steht unter jedem der drei Automaten und sieht ueberall gleich
// aus. Was ein Zeichen kann, steht dabei — wild, verstreut, an Walzen
// gebunden —, damit niemand die Regeln erraten muss.
const wZahlSpalten = [5, 4, 3, 2];
// Eine Nachkommastelle, mit Komma. „94.4 %" liest hier niemand.
const wProzent = (q) => (Math.round(q * 1000) / 10).toFixed(1).replace('.', ',') + ' %';

const WalzenTafel = ({ symbole, quote, kinder }) => {
  const [offen, setOffen] = React.useState(false);
  const zeigt = (n) => symbole.some(s => wZahlt(s, n) > 0 || wStreut(s, n) > 0);
  const spalten = wZahlSpalten.filter(zeigt);
  return (
    <div className="automat-tafel">
      <button className="automat-tafel-kopf" onClick={()=>setOffen(o=>!o)} aria-expanded={offen}>
        <span>{offen ? '▾' : '▸'} Auszahlungen</span>
        {quote > 0 && <span className="tafel-quote">{wProzent(quote)}</span>}
      </button>
      {offen && (
        <>
          <table className="automat-tabelle walzen-tabelle">
            <thead>
              <tr><th /><th /><th /><th /></tr>
            </thead>
            <tbody>
              {symbole.map(s => (
                <tr key={s.k}>
                  <td className="sym">{s.z}</td>
                  <td className="nam">
                    {s.name}
                    {s.wild && <i>ersetzt jedes Zeichen</i>}
                    {s.streu && <i>zählt verstreut{s.streuWalzen
                      ? ' — nur Walze ' + s.streuWalzen.map(w => w + 1).join(', ') : ''}</i>}
                  </td>
                  {spalten.map(n => {
                    const v = wZahlt(s, n) || wStreut(s, n);
                    return <td key={n} className="zahl">{v ? zahlText(v) + '×' : '–'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="automat-fussnote">
            Zehn Linien, immer alle. Gewertet wird von links ab der ersten
            Walze, ohne Lücke; je Linie zählt nur der beste Gewinn. Der
            Einsatz auf der Leiste ist der Gesamteinsatz — eine Linie
            bekommt ein Zehntel davon, und die Vielfachen oben beziehen
            sich darauf. Verstreute Zeichen zählen irgendwo auf dem Feld
            und rechnen über den ganzen Einsatz.
          </p>
          {kinder}
        </>
      )}
    </div>
  );
};
