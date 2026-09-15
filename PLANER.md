# 🗺 Der Abenteuerplaner — Konzept und Stufen

Karten wie bei Google Maps, Helden und NSC auf der Reise, Reisezeit und
Zufallsbegegnungen, Orte mit Wissen und Dateien vom eigenen Rechner.
Alles hängt an Heldenbuch und Kampftracker.

Die Machbarkeitsstudie vom 15.09.2026 hat die Richtung festgelegt. Hier
steht, was daraus geworden ist und was noch kommt.

---

## Was entschieden ist

| Frage | Antwort |
|---|---|
| Wer benutzt ihn? | **Spielleitung und Spieler, live.** Spieler sehen nur, was sichtbar ist. |
| Wie groß werden Karten? | **Sehr groß.** Deshalb Kacheln, und die Dateien liegen nicht in der Datenbank. |
| Freie Karte oder Hexfelder? | **Frei.** Ein Hexraster kann später dazukommen. |
| Im- und Export? | **Eine Paketdatei `.hbplan`**, ein gewöhnliches ZIP. Siehe unten. |
| Rechner am Spieltisch | Verschiedene PCs, **Chrome oder Edge**. |
| Webspace | Rund 195 GB frei. |
| Adresse | **`heldenbuch2/planer/`**, derselbe Deploy, dieselbe Anmeldung. |

## Aufbau

Eigene Seite, eigenes Bündel, **gemeinsamer Server**:

| Datei | Rolle |
|---|---|
| `planer/index.html` | Gerüst und die Wege nach draußen: `planerApi`, `planerDateiHolen`, `planerSpeichern`, `planerZugang` |
| `planer/src/*.jsx` | Quellen, wie im Heldenbuch in Namensreihenfolge zusammengesetzt |
| ↳ `0-basis.jsx` | Hooks, `PLANER_VERSION` |
| ↳ `1-paket.jsx` | **reine Rechnung:** ZIP schreiben und lesen (samt ZIP64), `hbplan.json`, Export und Einspielen |
| ↳ `1b-kacheln.jsx` | **reine Rechnung:** Bildmaße aus dem Dateikopf, Kachelpyramide, Ansicht und Zoom, Maßstab und Lineal, Reihenfolge beim Schneiden und Hochladen |
| ↳ `1c-reise.jsx` | **reine Rechnung:** Gelände, Tempo, Fortbewegung, Reise Tag für Tag, Gewaltmarsch, Wetter nach Klima und Jahreszeit, Aufträge ans Heldenbuch |
| ↳ `1d-begegnung.jsx` | **reine Rechnung:** Punkt in der Fläche, innerste Region, Wachen eines Reisetags, Begegnungswurf, Reisetagebuch als Text |
| ↳ `1e-sicht.jsx` | **reine Rechnung:** Nebel (aufgedeckt, Kreise entlang der Reise, Orte darunter), Spielersicht für den Tisch, ungesehene Handouts |
| ↳ `1f-welt.jsx` | **reine Rechnung:** Zeit, Figuren und Wegpunkte, Dateiverweise, Quests, Wissen, Fraktionen, Proviant, Navigation, Hexfelder, Offline-Pfade |
| ↳ `2-leinwand.jsx` | die Kartenansicht: Kacheln, Nebel, Hexfelder, Ziehen, Mausrad, zwei Finger, Orte, Figuren, Regionen, Routen, Gruppen, Linien |
| ↳ `3-ort.jsx` | Bilder im Browser öffnen, verkleinern und schneiden; Maßstabsdialog; die Tafel eines Orts |
| ↳ `3b-reise.jsx` | die Tafeln einer Route und einer Reise, die Übergabe ans Heldenbuch |
| ↳ `3c-begegnung.jsx` | die Tafel einer Region, der Tabelleneditor, die Liste der Wachen |
| ↳ `3d-sicht.jsx` | Handouts (Tafel, Lesefenster, Liste) und das Tischfenster (`?tisch=1`) |
| ↳ `3e-welt.jsx` | Zeitleiste, Figurtafel, freigegebene Ordner und Dateiliste, Quests, Wissen, Fraktionen, Hexfelder |
| `planer/sw.js` | Service Worker für den Fall ohne Netz |
| `planer/bruecke/` | die Planer-Brücke für Windows und ihr Einrichtungsskript |
| ↳ `4-app.jsx` | die Seite |
| `planer/planer.js` | daraus gebaut von `node build.js`, **mitcommittet** wie `js/app.js` |
| `planer/planer.css` | eigene Oberfläche, dieselben Farben wie `styles.css` |
| `api.php` | Aktionen `planer_*`, Tabellen `hb_plan_karte`, `hb_plan_obj`, `hb_plan_stand` |
| `planer-dateien/` | **nur auf dem Server**, nicht im Repo. Je Karte ein Ordner mit zufälligem Namen |

Die Anmeldung kommt aus demselben Speicher wie im Heldenbuch
(`sv_token`, `sv_code`). Ohne sie zeigt der Planer nur den Weg zurück.

## Rechte

- **Lesen** darf jedes Mitglied der Gruppe. Ein Spieler bekommt nur
  sichtbare Karten, darauf nur sichtbare Einträge, und **nie das Feld
  `dm`**. Diese Regel gilt für alles, was noch kommt: Was nur die
  Spielleitung liest, steht unter `dm`.
- **Schreiben** darf, wer das Abenteuer leitet (`istDmVon`).
- Der Ordnername einer Karte (`ablage`, 32 Hex-Zeichen) ist das
  Einzige, womit man an ihre Dateien kommt. Spieler bekommen ihn nur für
  sichtbare Karten. Die Dateien liefert der Webserver direkt aus, weil
  Tausende Kacheln durch PHP zu schicken zu langsam wäre.
- Hochgeladen wird nur, was `PLAN_PFAD` erlaubt: Kleinbuchstaben,
  Ziffern, `-` und `_`, Endung `webp`, `png`, `jpg`, `jpeg` oder `json`.
  Der Inhalt muss zur Endung passen, sonst weist der Server das ganze
  Bündel ab.

## Das Paket `.hbplan`

Ein ZIP, das jedes Entpackprogramm öffnet:

```
hbplan.json                 Beschreibung, Karten, Einträge, Dateiliste
karten/<karte>/<pfad>       die Dateien jeder Karte, so wie abgelegt
objekte/<eintrag>/<pfad>    die Dateien eines Eintrags mit eigenem Ordner (Handouts, seit v5.15.0)
```

`hbplan.json`:

```json
{
  "format": "heldenbuch-planer",
  "version": 1,
  "erstellt": "2026-09-15T18:15:42.000Z",
  "programm": "Abenteuerplaner Stufe 0",
  "abenteuer": { "id": "strahd", "name": "Fluch des Strahd" },
  "karten":   [ { "id": "k_…", "name": "Barovia", "sichtbar": true, "dm": { } } ],
  "objekte":  [ { "id": "o_…", "karteId": "k_…", "art": "ort", "sichtbar": false } ],
  "dateien":  [ { "karte": "k_…", "pfad": "kacheln/0/0/0.webp", "bytes": 18234 } ]
}
```

- **Bilder gehen ungepackt hinein**, weil sie schon gepackt sind. Das
  JSON wird gepackt. Ab 65 535 Dateien oder 4 GB kommt das
  ZIP64-Verzeichnis dazu.
- **Einspielen legt alles zusätzlich an**, mit neuen Kennungen. Nichts
  Vorhandenes wird überschrieben. Verweise zwischen Einträgen werden
  mit umgeschrieben, auch in Feldern, die es heute noch nicht gibt.
- Ist ein Name schon vergeben, heißt die neue Karte „… (importiert)“.
- **Scheitert das Einspielen** mittendrin, werden die schon angelegten
  Karten samt Dateien wieder gelöscht.
- Ein Paket aus einer **neueren Formatversion** wird mit einem Hinweis
  abgelehnt, nicht halb gelesen.
- Die Notizen der Spielleitung gehen mit. Ein Paket ist deshalb ein
  Arbeitsstand der Spielleitung, nichts zum Weitergeben an Spieler.

## Prüfen

```bash
node dev/pruefen.js                          # u. a. planer-paket-test.js
C:/xampp/php/php.exe dev/test-api.php --neu  # Abschnitte "Abenteuerplaner"
```

und im Browser **http://localhost:8777/dev/planer-echt.html**. Die Seite
fährt den echten Planer gegen einen Server im Arbeitsspeicher und klickt
sich durch: Anlegen, Sichtbarkeit, Kartenbild, Maßstab, Orte, Routen,
Reisen, Übergabe, Regionen, Nebel, Handouts, das Tischfenster (in einer
Ecke derselben Seite), Export, Löschen, Einspielen, Spielersicht. Die Übergabe
auf der Seite des Heldenbuchs prüft `dev/echt.html`.

---

## Stufen

### ✅ Stufe 0 · Gerüst (v5.11.0)

Zwei Bündel, eigene Seite, gemeinsame Anmeldung, Tabellen, Dateiablage,
Karten anlegen, umbenennen, sichtbar schalten und löschen. **Export und
Einspielen als `.hbplan`.** Der Weg hinein steht im Heldenbuch in der
Seitenleiste.

### ✅ Stufe 1 · Karte und Orte (v5.12.0)

**Kacheln.** Ein Kartenbild wird im Browser der Spielleitung zur
Kachelpyramide geschnitten: 256 Pixel je Kachel, Stufe 0 zeigt das ganze
Bild, die oberste Stufe 1:1.

```
b<version>/<z>/<x>/<y>.webp      Kacheln (JPEG, wo der Browser kein WebP schreibt)
b<version>/vorschau.webp         Vorschau für die Liste, höchstens 360 px
orte/<ort>/<zufall>.webp         Bilder eines Orts, höchstens 1600 px
```

- Jede Stufe wird einmal aus dem Original verkleinert, dann in Kacheln
  geteilt. Hochgeladen wird in Bündeln von 2,5 MB, höchstens zwei
  zugleich, während weiter geschnitten wird.
- **Ein neues Bild kommt in einen neuen Ordner.** Erst wenn alles oben
  ist, zeigt die Karte darauf, dann wird der alte Ordner gelöscht.
  Scheitert es oder wird abgebrochen, wird der neue Ordner gelöscht und
  die Karte bleibt, wie sie war.
- **Hat das neue Bild eine andere Größe,** werden Orte und Maßstab im
  Verhältnis umgerechnet. Alle Koordinaten sind Pixel des Originalbilds.
- **Kann der Browser das Bild nicht am Stück öffnen,** wird es auf 50 %
  und dann 25 % verkleinert geöffnet. Die Meldung sagt das dazu.
- **Gemessen am 15.09.2026 im Chromium des Browserfensters** (ohne Upload):
  8 000 × 6 000 Pixel ergeben 1 025 Kacheln in 5 Sekunden, 16 000 ×
  10 000 Pixel ergeben 3 377 Kacheln in 15,5 Sekunden, Öffnen 0,3 Sekunden.

**Keine Leaflet-Bibliothek.** Die Studie hatte Leaflet vorgesehen. Die
Ansicht ist stattdessen selbst geschrieben (`2-leinwand.jsx`, `1b-kacheln.jsx`):

- Das Heldenbuch kommt ohne Fremdbibliotheken aus.
- Für eine Bildkarte ohne Erdkugel ist die Rechnung überschaubar.
- Sie lässt sich ohne Browser prüfen (`planer-kacheln-test.js`).

**Ansicht.** `{zoom, x, y}`: Der Bildpunkt x, y liegt in der Fenstermitte,
`zoom` zählt stetig in Stufen. Geladen wird die nächstschärfere Stufe,
darunter liegt eine zwei Stufen gröbere, damit beim Zoomen nichts leer
bleibt.

**Maßstab** `{a, b, laenge, einheit}` an der Karte. Das Lineal rechnet
die Länge und die Zeit zu Fuß im normalen Tempo.

**Orte** sind Einträge der Art `ort`:

```json
{ "id": "o_…", "karteId": "k_…", "art": "ort", "sichtbar": true,
  "name": "Dorf Barovia", "symbol": "🏘", "x": 1002, "y": 588,
  "text": "für Spieler", "bilder": ["orte/o_…/….webp"],
  "unterkarte": "k_…", "dm": { "notiz": "nur Spielleitung" } }
```

**Schnittstelle.** `planer_dateien_weg` löscht jetzt auch einzelne
Dateien (`pfade`) oder einen Unterordner (`praefix`, höchstens zwei
Ebenen).

**Cache.** Kacheln und Ortsbilder dürfen ein Jahr im Browser bleiben
(`.htaccess`), weil sich ihr Name bei jeder Änderung ändert.

### ✅ Stufe 2 · Reise, Zeit und Wetter (v5.13.0)

**Route** (Art `route`): `punkte` in Bildpixeln, `gelaende` je Abschnitt.

**Reise** (Art `reise`):

```json
{ "routeId": "r_…", "richtung": "hin",
  "optionen": { "tempo": "normal", "fortbewegung": "fuss", "stunden": 8 },
  "personen": 4, "klima": "gemaessigt", "jahreszeit": "sommer",
  "samen": 12345, "wetterVorgaben": { "0": { "niederschlag": "sturm", "temperatur": "kalt", "wind": "stark" } },
  "pos": 36, "tagebuch": [ { "nr": 1, "strecke": 36, "stunden": 8, "wetter": { }, "gewaltmarsch": [] } ] }
```

- `pos` ist die zurückgelegte Strecke in der Einheit des Maßstabs, in
  Reiserichtung. Die Gruppe steht bei `punktAufRoute(routeInRichtung(…), pos)`.
- Der Plan wird bei jedem Anzeigen neu gerechnet, ab `pos`. Gespeichert
  wird nur, was geschehen ist (`tagebuch`), und was die Spielleitung
  festgelegt hat (`wetterVorgaben`).

**Zahlen.** Aus den Grundregeln, in Kilometer wie im deutschen
Spielerhandbuch (1 Meile = 1,5 km):

- Tempo: langsam 3, normal 4,5, schnell 6 km/h.
- Gewaltmarsch: jede angefangene Stunde über 8 kostet einen
  KO-Rettungswurf gegen SG 10 + Stunden über 8.
- Schwieriges Gelände halbiert.
- Wasserfahrzeuge nach ihrer Tabelle, mit Mannschaft 24 Stunden, das
  Ruderboot 8.

Vorgaben des Planers:

- Hügel und Wüste zählen drei Viertel.
- Wagen haben eine eigene Spalte je Gelände.
- Sturm halbiert an Land, Orkan hält Schiffe fest.

**Wetter.** Eigene Gewichtstafeln je Klima und Jahreszeit, keine
Regeltabelle. Die Hälfte der Zeit bleibt ein Wert wie am Vortag oder
rückt eine Stufe. Gewürfelt wird mit einem Samen, damit dieselbe Reise
dasselbe Wetter behält. Die Schlüssel sind die der Rast
(`RAST_NIEDERSCHLAG` usw.); `planer-reise-test.js` prüft die Gleichheit.

**Übergabe ans Heldenbuch.** Der Planer schreibt nie in Bögen oder in die
Chronik. Er legt einen Auftrag in `localStorage` (`hb_planer_auftrag`),
beide Seiten wohnen unter derselben Adresse:

| Auftrag | Im Heldenbuch |
|---|---|
| `{art:'zeit', stunden}` | `ZeitDialog`, vorbelegt |
| `{art:'rast', rastArt, basis, niederschlag, temperatur, wind, massnahmen, text}` | `RastAnsage`, vorbelegt |
| `{art:'probe', probeArt:'rw', wert:'con', sg, text}` | `ProbenAnsage`, vorbelegt |
| `{art:'kampf', begegnungId, name}` | Kampftracker geht auf und fragt, ob die Begegnung geladen wird (seit v5.14.0) |

- Das Heldenbuch nimmt einen Auftrag nur im DM-Modus an. Es wechselt
  dafür notfalls ins genannte Abenteuer.
- Es quittiert in `hb_planer_quittung`, und der Planer meldet, ob der
  Dialog aufging.
- Aufträge älter als 30 Minuten verfallen.
- Was an Bögen hängt, Erschöpfung, Rast oder Chronik-Effekte, läuft
  damit durch die bestehenden Dialoge, und die Spielleitung bestätigt.

### ✅ Stufe 3 · Begegnungen und Kampftracker (v5.14.0)

**Region** (Art `region`): `punkte` (Vieleck in Bildpixeln), `farbe`,
`text`, `dm.notiz`, und `dm.tabelle`. Die Tabelle steht unter `dm`, also
bekommen Spieler sie nie.

```json
{ "jeStunden": 8, "wuerfel": 20, "ab": 18, "abNacht": 17,
  "eintraege": [ { "id": "t_…", "gewicht": 3, "zeit": "immer|tag|nacht",
                   "art": "kampf|ereignis", "begegnungId": "enc_…", "text": "aus dem Nebel" } ] }
```

**Wachen.** `tagesPruefungen` geht die 24 Stunden ab dem Aufbruch
(`reise.startStunde`, Vorgabe 8) durch:

- Geprüft wird zu jeder Stunde, zu der irgendeine Tabelle fällig ist, und
  zwar dort, wo die Gruppe dann steht: unterwegs auf der Route oder am
  Tagesziel im Lager.
- Es gilt die innerste Region an diesem Punkt, also die mit der kleinsten
  Fläche, und nur wenn deren eigener Takt passt.
- Nachts heißt 20 bis 6 Uhr und nimmt `abNacht`.
- Gewürfelt wird mit `wuerfelSamen(reise.samen, tag, reise.nochmal[tag])`.
  Dieselbe Reise würfelt so dasselbe, bis jemand 🎲 drückt.
- Beim Abschließen landen die Wachen gekürzt im Tagebuch (`pruefungKurz`).

**Begegnungen** kommen aus dem Heldenbuch (`dm_load_encounters`, nur die
des Abenteuers und die ohne Abenteuer). Der Planer liest sie nur und legt
keine Gegner an. Ein Treffer mit Kampf wird zum Auftrag `kampf`. Im
Kampftracker fragt `onFrage`, bevor `begegnungLaden` die Gegner dazulegt,
auch in einen laufenden Kampf.

**Abenteuerlog.** Ein Reisetag geht über `save_log` hinein: Reiter
`Reise`, `action` ist die Zeile aus `reisetagText`, der volle Text steht
in `details`. Der Tagebucheintrag merkt sich `geloggt`, damit er nicht
doppelt hineingeht.

### ✅ Stufe 4 · Spielersicht (v5.15.0)

**Nebel** (`karte.nebel`): `{ an, flaechen: [{art:'kreis', x, y, r} | {art:'vieleck', punkte} | {art:'alles'}] }`.

- Er steht nicht unter `dm`, weil Spieler ihn zum Zeichnen brauchen.
- Er ist eine SVG-Maske über den Kacheln: bei Spielern und am Tisch
  deckend, bei der Spielleitung halb durchsichtig oder ausgeblendet.
- **Grenze:** Er verdeckt die Anzeige, nicht die Kacheln. Die Kacheln
  einer sichtbaren Karte bleiben über ihre Adresse abrufbar.
- Kreisradien kommen als Schirmpixel (45/110/240) und werden über das
  Zoommaß in Bildpixel umgerechnet, das `onKlick` mitliefert.
- Eine Reise mit `sichtweite` legt beim Abschließen eines Tages
  `kreiseEntlang(route, massstab, von, bis, sichtweite)` dazu.
- Nach jeder Änderung schaltet `orteImAufgedeckten` Orte mit `mitNebel`
  sichtbar.
- `nebelAufraeumen` wirft Kreise weg, die ganz in anderen liegen.

**Handout** (Art `handout`, ohne Karte): `titel`, `text`, `bild`, `an`
(Kennungen von Konten; leer heißt alle), `sichtbar` (verteilt), `geaendert`.

- **Eigener Ordner:** `ablage` vergibt der Server beim ersten Speichern.
  Dateien gehen mit `obj_id` statt `karte_id` durch `planer_dateien_*`.
  So erfährt ein Spieler durch ein Handout nie den Ordner einer
  verborgenen Karte.
- **Empfänger:** `planer_laden` gibt Spielern nur Handouts an alle oder an
  sie selbst.
- **Gelesen:** Was ein Spieler gelesen hat, merkt sich sein Browser
  (`hb_planer_gesehen_<adv>`), je Fassung. Ein neu verteiltes oder
  geändertes Handout kommt wieder.

**Tisch** (`planer/?tisch=1&adv=…`, `TischApp`):

- Lädt mit der Anmeldung der Spielleitung und filtert selbst mit
  `spielerSicht`, nach derselben Regel wie der Server. Handouts an
  einzelne gehören nicht dazu.
- Die Seite der Spielleitung spricht mit ihm über
  `BroadcastChannel('hb-planer-tisch')`:

  | Nachricht | Wirkung |
  |---|---|
  | `karte` | andere Karte; ein gezeigtes Handout verschwindet |
  | `ansicht` | Mitte und sichtbare Breite in Bildpixeln; das Handout bleibt |
  | `handout` | Handout groß darüber |
  | `leer` | Handout weg |
  | `neu` | neu laden |

**Abgleich:** Spieler fragen alle 5 Sekunden nach dem Stand, die
Spielleitung alle 15.

### ✅ Stufe 5 · Figuren und lokale Dateien (v5.16.0)

**Figur** (Art `figur`, an einer Karte): `name`, `symbol`, `wegpunkte`
`[{zeit, x, y, notiz}]`. `zeit` zählt Stunden wie die Chronik.

- `figurPosition(figur, zeit)` geht linear zwischen den Wegpunkten; vor
  dem ersten und nach dem letzten steht die Figur still.
- Die Spielleitung stellt die Zeit am Schieber ein.
- Spieler sehen sichtbare Figuren zur freigegebenen Zeit `karte.zeit`.
- Ziehen oder „📍 Wegpunkt“ setzt `wegpunktSetzen(figur, zeit, punkt)`.

**Lokale Dateien** (`ort.dm.dateien`): `[{bibliothek, pfad, titel}]`. Der
Pfad ist relativ, mit Schrägstrichen, ohne `..` und ohne Laufwerk
(`relativerPfad`).

- **Ansehen:** Freigegebene Ordner liegen als `FileSystemDirectoryHandle`
  in IndexedDB (`hb-planer-ordner`) dieses Browsers. `planerOrdner.datei`
  läuft den Pfad hinab und fragt die Leseerlaubnis nach. Was der Browser
  zeigen kann (`IM_BROWSER`), geht im `DateiBetrachter` auf.
- **Öffnen:** `heldenbuch-planer://oeffnen?bibliothek=…&pfad=…` ruft die
  Planer-Brücke.
  - `%APPDATA%\Heldenbuch-Planer\bibliotheken.json` ordnet Namen Ordnern
    zu, `_vlc` optional dem VLC.
  - Die Brücke weist ab: fremde Schemata und Aufträge, unbekannte
    Bibliotheken, absolute Pfade, `..`, alles außerhalb des Ordners
    (auch Nachbarordner mit ähnlichem Namen) und jede Endung außerhalb
    der Liste.
  - `installieren.ps1` legt den Schlüssel unter
    `HKCU\Software\Classes\heldenbuch-planer` an; `-Entfernen` nimmt ihn
    wieder weg.
  - **Grenze:** Verknüpfungen und Junctions innerhalb des Ordners werden
    nicht aufgelöst. Wer einen Link auf `C:\` in seine Bibliothek legt,
    öffnet dort, was die Endungsliste erlaubt.

### ✅ Stufe 6 · Welt, Unterwegs, Hexfelder, Offline (v5.16.0)

**Ohne Karte** (`PLAN_OHNE_KARTE` in `api.php` und im Planer): `handout`,
`quest`, `hinweis`, `fraktion`. Nur das Handout hat einen eigenen Ordner.

- **Quest:** `titel`, `status` (offen/aktiv/erledigt/gescheitert),
  `auftraggeber`, `zielOrt`, `belohnung`, `text`, `schritte [{text, erledigt}]`.
- **Hinweis:** `artDesWissens` (Gerücht/Hinweis/Wissen), `text`, `ortId`,
  `questId`, `bekanntSeit`. Unter `dm` steht, ob er stimmt. `sichtbar`
  heißt: die Spieler wissen es.
- **Fraktion:** `name`, `farbe`, `ruf` (−3 … +3), `text`, `regionen`;
  `dm.ziele`.

**Unterwegs.**

- Die Reise führt `vorrat {rationen, wasserLiter}`, `vorratNachTag` zieht
  je Person 1 Ration und 4 l ab.
- `navigationSg` nimmt das schwierigste Gelände des Tags; die SG sind
  Vorgaben des Planers: offen 10, Hügel 12, Wüste 13, Wald, Sumpf,
  Gebirge und Schnee 15, Straße und Wasser keine.
- Die Probe geht als Auftrag `probe` (Fertigkeit `ueberleben`) ans
  Heldenbuch.
- „Verirrt“ schreibt den Tag mit Strecke 0.

**Hexfelder** (`karte.hex {an, groesse, spieler}`):

- Spitze Hexfelder, `groesse` von Seite zu Seite in der Einheit des
  Maßstabs.
- Adressen in versetzten Koordinaten (odd-r), Spalte.Zeile ab 01.01.
- Gezeichnet wird nur, was im Ausschnitt liegt, höchstens 2 500 Felder;
  beschriftet erst ab lesbarer Größe.

**Offline.**

- `sw.js`: Dateien unter `planer-dateien/` zuerst aus dem Vorrat, die
  Seite zuerst aus dem Netz.
- Die letzte Antwort von `planer_start` und `planer_laden` liegt in
  `localStorage` (`hb_planer_offline_*`). Ist der Server nicht
  erreichbar, zeigt der Planer sie mit einem Hinweis.
- **📥 Offline** holt `offlinePfade` aller Karten einmal. Ohne Service
  Worker (etwa auf `dev/`) sagt es das.

Der Abenteuerplaner ist damit vollständig. Weitere Wünsche kommen in die
`TODO.md`.
