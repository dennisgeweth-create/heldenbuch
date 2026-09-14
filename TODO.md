# 📜 Heldenbuch — was noch aussteht

Offene Vorhaben. Erledigtes wandert in die `PATCHNOTES.md` und hier heraus.

## Vom Spielabend (September 2026)

Zehn Wünsche vom Tisch, hier nach Bauplan sortiert — zusammen, was
dieselben Daten anfasst, und das Kleine zuerst. Die Nummer in Klammern
ist die Stelle in der Liste vom Abend. Größe: **S** ein Abend, **M** zwei
bis drei, **L** mehr.

### A · Schnell, und sofort am Tisch zu merken

- [ ] **Merkmale ohne Ziel eintragen** (1) · S
  Die Wahl ⭐ Merkmal gibt es schon. Das Zugfenster schreibt eine Aktion
  aber nur, wenn ein Ziel angekreuzt oder Text getippt ist
  (`bauen()` in `2c-kampf.jsx`, „gegenstand && (ziele || text)“). Zweiter
  Atem, Tatendrang, Kampfrausch haben kein Ziel — also bleibt der Knopf
  grau und im Protokoll steht nichts. Fix: bei Merkmal (und Zauber mit
  Reichweite „Selbst“) reicht die Wahl. Dazu die Beschreibung des
  Merkmals aufklappbar im Fenster, damit niemand im Bogen nachschlagen muss.
- [ ] **Zustände im Zugfenster setzen** (8) · S
  Heute nur über den Knopf „Zustände“ in der Kampfzeile. Im Zugfenster
  bekommt jedes angekreuzte Ziel eine Zeile Zustands-Chips — dieselbe
  `ZustandWahl`, derselbe Protokolleintrag `zustand`. Gilt auch für den
  Zug eines Gegners (`nurWerte`).
- [ ] **Händlerfenster mit zwei Reitern** (6) · S
  „Kaufen“ und „Verkaufen“ statt beides untereinander in `LadenFenster`.
  Geldbeutel und Heldenwahl bleiben über den Reitern stehen.

### B · Rückgängig

- [ ] **Letzte Aktion zurücknehmen** (7) · M
  Früh bauen, damit alles aus C und D gleich mit zurückgenommen wird.
  Vor jedem `onAnwenden` einen Schnappschuss legen: der Kampf selbst plus
  von jedem berührten Helden die alten Werte der Felder, die das Fenster
  ändert (TP, temp. TP, Zauberplätze, Menge, Konzentration, Zustände).
  Ein Knopf „↶ Rückgängig“ im Tracker, eine Stufe tief, im Protokoll als
  gestrichene Zeile statt still gelöscht.
  *Offen:* Hat ein Spieler in der Zwischenzeit selbst an seinen TP
  gedreht, wird nicht blind überschrieben — dann fragt der Tracker nach.

### C · Wirkungen, die mehr tun als TP

- [ ] **Zauber lösen Zustände aus** (9) · M
  Die Wirkung eines Zaubers (und Gegenstands) bekommt ein Feld
  `zustaende`. Mit Rettungswurf: gesetzt nur bei „misslungen“ — der
  Schalter steht dort schon. Ohne Rettungswurf: bei Treffer. Die
  Spielleitung kann den Chip im Fenster vor dem Übernehmen noch abwählen.
  Die SRD-Vorlagen in `data-spells.json` bekommen die Zustände dort, wo
  sie eindeutig sind (Person festhalten → Gelähmt, Schlaf, Furcht …).
- [ ] **Merkmale lösen einen Zauber aus** (2) · M
  Ein Merkmal bekommt entweder eine Verknüpfung auf einen Zauber aus dem
  Zauberbuch (dann ohne Zauberplatz) oder eigene Wirkungsfelder wie ein
  Trank — Würfel, Rettungswurf, Fläche, Zustände. Im Zugfenster rechnet
  es dann wie ein Zauber. Dazu ein Zähler „Anwendungen · erholt bei
  kurzer/langer Rast“, der beim Benutzen sinkt wie die Menge eines Tranks.
  Das Beispiel vom Tisch — „Heiligtum der Dämmerung“ — stammt aus Tashas
  Kessel: gebaut wird nur der Mechanismus, der Text bleibt wie immer in
  der eigenen `data-eigen.json`.

### D · Was gerade läuft

(3) und (4) sind eine Sache: eine Liste laufender Wirkungen im Kampf.

- [ ] **Laufende Wirkungen mit Dauer** (4) · M
  `kampf.laufend = [{id, von, name, art: 'konz'|'aura'|'wirkung',
  ziele, bisRunde, sichtbar}]`. Beim Wirken wird die Dauer aus dem Text
  gelesen — „1 Minute“ = 10 Runden, „10 Minuten“ = 100, „bis zu 1 Minute“
  ebenso —, änderbar vor dem Übernehmen. Läuft sie ab, am Zugbeginn des
  Wirkenden: Hinweis im Tracker und Zeile im Protokoll („Segen endet“).
  Endet die Konzentration (Schaden, neuer Zauber, bewusstlos), fällt die
  Wirkung mit. Die Konzentration am Helden gibt es schon
  (`held.konzentration`), sie wird hier nur angehängt.
- [ ] **Auren und Konzentration im Tracker zeigen** (3) · M
  Spielleitung: als Marke an der Kampfzeile des Wirkenden („◎ Segen ·
  noch 7“) und an den Zielen. Spieler (`2g-kampfsicht.jsx`): dasselbe,
  aber **nur Wirkungen von Helden**. Das Ausfiltern macht der Server in
  `api.php` beim Zusammenstellen der Spielersicht — wie heute schon die
  TP der Gegner —, nicht das Spielergerät. Auf der Karte optional ein Ring
  um die Figur.

### E · Geld

- [ ] **Gegenstände haben einen Wert** (5) · M
  `newItem()` bekommt `wert` (in Kupfer, wie die Ladenpreise), der
  Gegenstandseditor ein Feld „Wert“ in GM/SM/KM. Die Beute-Liste gibt
  einen Preis, wenn einer drinsteht, gleich an den Gegenstand weiter
  (`beuteAusText` liest heute keine Preise, der Preisleser des Ladens,
  `ladenPreisKupfer`, steht aber schon in `util.js` bereit). Beim
  Verkaufen schlägt der Laden dann `wert × Ankauf` vor statt einer leeren
  Zahl — heute nur, wenn er dieselbe Ware selbst führt. Die SRD-Vorlagen
  tragen keine Preise; die gäbe es aus der SRD-Ausrüstungstabelle
  nachzutragen.

### F · Heimlich

- [ ] **Geheime Notiz an die Spielleitung** (10) · M
  Eine Ansage mit dem Schalter „🔒 nur für die Spielleitung“.
  **Wichtig:** Ansagen gehen heute an *alle* zurück (`api.php`, „Die
  Ansagen gehen an alle zurueck“) — die Mitspieler sehen sie in ihrer
  Kampfsicht. Der Server muss geheime also herausnehmen, außer für die
  Spielleitung und den, der sie geschrieben hat. Im Protokoll erst
  sichtbar, wenn die Spielleitung sie aufdeckt.
  *Offen:* nur im Kampf, oder auch außerhalb — als kleiner Briefkasten
  im Bogen, den die Spielleitung als Zähler sieht?

## Erledigt

- ~~Tränke mit Wirkung~~ — ein Gegenstand trägt dieselben Wirkungsfelder
  wie ein Zauber; das Zugfenster rechnet und stellt sich bei einem
  Heiltrank selbst auf Heilung.
- ~~Schnellerer Abgleich (Stufe 4)~~ — zwei Sekunden im Kampf statt vier,
  und wer zum Fenster zurückkommt, sieht sofort den Stand von jetzt.
- ~~Der Kopf des Roulettetisches~~ — neben dem Kessel steht jetzt der
  Zettel: vorher, was auf dem Tapis liegt, danach, was es gebracht hat.
- ~~Sprüche des Wirts bei Gewinn und Verlust~~ — an den drei Tischen, an
  denen jemand gibt; er antwortet auf das, was gefallen ist, und
  schweigt, wenn nichts entschieden wurde.
- ~~Die Rennbahn war nicht immer gleich breit~~ — `.automat-mitte` stand
  mit `align-items:center` hinter allen Tischen; der Filz war so breit
  wie sein längster Satz.
- ~~Fenster verschwanden beim Verkleinern des Browserfensters~~ — beide
  Fensterarten holen sich zurück ins Bild.
- ~~Gegenstände im Kampf benutzen, Menge abziehen, Merkmale benutzen~~ —
  siehe Zugfenster: ⚔ Angriff · ✨ Zauber · 🧪 Gegenstand · ⭐ Merkmal.
- ~~Patchnotes ab v4.4~~ — stehen als **v4.5** in der `PATCHNOTES.md`.
