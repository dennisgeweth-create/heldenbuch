// Heldenbuch — Ankündigungen.
//
// Kommt etwas Neues, läuft eine kurze Animation über den Bildschirm,
// damit es niemand übersieht: ein Brief, der aufspringt und davonfliegt;
// zwei Schwerter, die sich zum Kampfbeginn kreuzen; ein W20, der rollt,
// wenn eine Probe angesagt ist; der Mond zur Rast; eine Truhe, aus der
// Münzen springen; das Vordach des Ladens; und ein Banner, wenn man im
// Kampf an der Reihe ist.
//
// Die Bühne liegt über allem und nimmt keinen Klick an. Mehrere
// Ankündigungen kurz nacheinander warten in einer Schlange. Abschalten
// lässt es sich je Gerät (Mein Konto); wer im System „weniger Bewegung"
// eingestellt hat, bekommt dasselbe ohne Flug und Wirbel.

const ANK_MERKER = 'hb_animationen';
const ankAn = () => { try { return localStorage.getItem(ANK_MERKER) !== 'aus'; } catch (e) { return true; } };
const ankSetzen = (an) => { try { localStorage.setItem(ANK_MERKER, an ? 'an' : 'aus'); } catch (e) {} };

// Wie lange jede läuft — so lange wie ihre Animation im Stylesheet.
const ANK_DAUER = {post: 2700, kampf: 2500, zug: 2300, probe: 2400, rast: 2700, beute: 2500, laden: 2400};

// Wer zuhört: die Bühne. Ein kleiner Verteiler statt eines Zustands in
// der App, damit jede Stelle ankündigen kann, ohne etwas durchzureichen.
const ankHoerer = new Set();
const ankuendigen = (art, text, unter, erzwingen) => {
  if (!erzwingen && !ankAn()) return;
  const a = {art, text: text || '', unter: unter || '', id: Date.now() + Math.random()};
  ankHoerer.forEach(f => f(a));
};

// ── Die Bilder ──────────────────────────────────────────────────
const ankIcon = (name) => (window.HB_IKONEN ? window.HB_IKONEN.react(name) : null);

// Ein Schwert, senkrecht, die Spitze oben: Klinge mit Hohlkehle,
// Parierstange, Griff, Knauf.
const AnkSchwert = ({ klasse }) => (
  <svg className={'ank-schwert ' + klasse} viewBox="0 0 30 120" aria-hidden="true">
    <path className="ank-klinge" d="M15 3l4.5 10.5V79h-9V13.5z" />
    <path className="ank-kehle" d="M15 16v58" />
    <rect className="ank-parier" x="2" y="79" width="26" height="6" rx="3" />
    <rect className="ank-griff" x="12" y="85" width="6" height="21" rx="2" />
    <circle className="ank-knauf" cx="15" cy="110" r="5" />
  </svg>
);

const ANK_BILD = {
  post: () => (
    <div className="ank-flug">
      <svg className="ank-brief" viewBox="0 0 120 96" aria-hidden="true">
        <g className="ank-papier"><rect x="24" y="14" width="72" height="56" rx="3" />
          <path d="M34 28h52M34 38h52M34 48h36" /></g>
        <path className="ank-umschlag" d="M8 36h104v52H8z" />
        <path className="ank-falz" d="M8 88l40-28M112 88L72 60" />
        <path className="ank-klappe" d="M8 36l52 34 52-34" />
        <circle className="ank-siegel" cx="60" cy="68" r="8" />
      </svg>
    </div>
  ),
  kampf: () => (
    <div className="ank-kreuz">
      <div className="ank-blitz" />
      <AnkSchwert klasse="links" />
      <AnkSchwert klasse="rechts" />
    </div>
  ),
  zug: () => <div className="ank-symbol ank-wippen">{ankIcon('klinge')}</div>,
  probe: () => <div className="ank-symbol ank-rollen">{ankIcon('wuerfel')}</div>,
  rast: () => (
    <div className="ank-nacht">
      <div className="ank-symbol ank-steigen">{ankIcon('mond')}</div>
      {[0, 1, 2, 3, 4].map(i => <span key={i} className={'ank-sternchen s' + i}>{ankIcon('funke')}</span>)}
    </div>
  ),
  beute: () => (
    <div className="ank-schatz">
      <div className="ank-symbol ank-huepfen">{ankIcon('truhe')}</div>
      {[0, 1, 2, 3, 4, 5].map(i => <span key={i} className={'ank-muenze m' + i} />)}
    </div>
  ),
  laden: () => <div className="ank-symbol ank-schwingen">{ankIcon('laden')}</div>,
};

// ── Die Bühne ───────────────────────────────────────────────────
const AnkuendigungsBuehne = () => {
  const [schlange, setSchlange] = React.useState([]);
  React.useEffect(() => {
    // Mehr als drei Wartende sind Getöse; die übrigen fallen weg.
    const f = (a) => setSchlange(s => (s.length >= 3 ? s : [...s, a]));
    ankHoerer.add(f);
    return () => { ankHoerer.delete(f); };
  }, []);
  const jetzt = schlange[0];
  React.useEffect(() => {
    if (!jetzt) return undefined;
    const t = setTimeout(() => setSchlange(s => s.slice(1)), ANK_DAUER[jetzt.art] || 2500);
    return () => clearTimeout(t);
  }, [jetzt && jetzt.id]);
  if (!jetzt) return null;
  const bild = ANK_BILD[jetzt.art];
  return (
    <div className={'ank ank-' + jetzt.art} key={jetzt.id} role="status" aria-live="polite">
      <div className="ank-schleier" />
      <div className="ank-mitte">
        <div className="ank-bild">{bild ? bild() : null}</div>
        <div className="ank-text">
          <b>{jetzt.text}</b>
          {jetzt.unter && <i>{jetzt.unter}</i>}
        </div>
      </div>
    </div>
  );
};

// Zum Ausprobieren in „Mein Konto": jede einmal.
const ANK_PROBEN = [
  ['post', 'Neue Post', 'von Ilvara'],
  ['kampf', 'Kampf!', 'Würfelt Initiative'],
  ['zug', 'Du bist am Zug', 'Brunhilde'],
  ['probe', 'Probe', 'Wahrnehmung · SG 13'],
  ['rast', 'Lange Rast', 'Die Nacht im Schilf am Fluss'],
  ['beute', 'Beute liegt bereit', 'Truhe des Wirts'],
  ['laden', 'Der Laden hat geöffnet', 'Waffen und Rüstung'],
];
