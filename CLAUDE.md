# Heldenbuch

D&D-5e-Charakterverwaltung. Läuft ohne Framework-Toolchain: React aus
`vendor/`, kein npm, kein `node_modules`.

## Dateien

| Datei | Rolle |
|---|---|
| `index.html` | Gerüst, Kopfdaten, API-Client, Ladebild |
| `js/src/*.jsx` | **Anwendungscode — hier wird bearbeitet** |
| ↳ `0-basis.jsx` | Hooks und Kürzel, gilt für alle folgenden Dateien |
| ↳ `1-editors.jsx` | Rich-Text- und Effekt-Editor |
| ↳ `2-logtab.jsx` | Abenteuerlog eines Helden |
| ↳ `2b-gegner.jsx` | Gegnersammlung und Begegnungen der Spielleitung |
| ↳ `2c-kampf.jsx` | Kampftracker: Aufstellung, Runden, Todesrettungswürfe |
| ↳ `2c2-karte.jsx` | Kampfkarte — Raster, Gelände, Figuren, Sicht, Textblock und sein Leser |
| ↳ `2d-chronik.jsx` | Kalender und Ereignisse der Spielleitung |
| ↳ `2e-abenteuer.jsx` | Einstellungen eines Abenteuers (nur im DM-Modus) |
| ↳ `2f-automat.jsx` | Taverne: Halle, Fenster, Beutel je Held, Automat |
| ↳ `2f2-blackjack.jsx` | Blackjack — zweiter Tisch der Taverne |
| ↳ `2f3-roulette.jsx` | Französisches Roulette samt Rennbahn |
| ↳ `2f4-craps.jsx` | Craps — Linien, Odds, Come, Place, Feld, Mitte |
| ↳ `2f5-rennen.jsx` | Pferderennen — Simulation, und die Quoten daraus |
| ↳ `2f6-poker.jsx` | Ultimate Texas Hold’em — Blattbewertung, Tafel, Abrechnung |
| ↳ `2f7-walzen.jsx` | Fünfwalzen-Gerüst: zehn Linien, Bänder, Wild, Streuzeichen, Rechnung |
| ↳ `2f8-buch.jsx` | „Das Verschollene Kapitel“ — gelostes Sonderzeichen, das ganze Walzen füllt |
| ↳ `2f9-arena.jsx` | „Klinge und Hörner“ — klebende Wilds in zehn Freispielen |
| ↳ `2fa-auge.jsx` | „Das Wachsame Auge“ — Wild füllt die Walze und veredelt die Tafel |
| ↳ `2h-proben.jsx` | Proben auf Ansage — Balken und Ansagefenster |
| ↳ `2i-beute.jsx` | Beute — hinlegen, nehmen, in die Bögen eintragen |
| ↳ `2j-laden.jsx` | Laden — Auslage, kaufen, verkaufen |
| ↳ `2k-heldtext.jsx` | Der ganze Bogen als Text — zum Vorlegen an eine KI, samt Fenster |
| ↳ `3-sheet.jsx` | Charakterbogen mit den sieben Reitern |
| ↳ `3a-ausruestung.jsx` | Ausrüstungspuppe mit ihren Plätzen |
| ↳ `3b-aufstieg.jsx` | Stufenaufstieg — Vorschau, dann übernehmen |
| ↳ `3c-assistent.jsx` | Charakterassistent — sechs Schritte |
| ↳ `4-app.jsx` | Zustand, Server-Sync, Seitenleiste, Dialoge |
| `js/app.js` | daraus zusammengesetzt und übersetzt. Nicht von Hand ändern. |
| `js/data.js` | Regeltabellen (Klassen, Zauberschulen, Fertigkeiten, Effektziele) |
| `js/util.js` | reine Hilfsfunktionen ohne React |
| `styles.css` | gesamte Oberfläche |
| `data-*.json` | SRD-Vorlagen, nach Art getrennt geladen |
| ↳ `data-merkmale.json` | Klassen- **und Unterklassenmerkmale** Stufe 1–20 (SRD 5.1); der Aufstieg lädt sie beim Öffnen |
| `api.php` | Server-Sync, braucht `config.php` (nicht im Repo) |
| `TAVERNE.md` | Stufenplan der Taverne — alle Stufen gebaut |
| `TAVERNE-WALZEN.md` | Konzept und Stufenplan der drei Fünfwalzenautomaten |
| `KAMPFTRACKER.md` | Was der Tracker führt und ausgibt — zum Vorlegen an eine KI |
| `KAMPFKARTE.md` | Konzept und Stufenplan der Rasterkarte im Kampf |
| `SPIELFLUSS.md` | Stufenplan für alles um den Abend herum — alle Stufen gebaut |
| `PATCHNOTES.md` | wird **ausgeliefert**: die Ausgabe-Nummer in der Heldenleiste öffnet sie |
| `dev/` | oertliche Serverseite und Werkbankseiten zum Testen — wird nie ausgeliefert |
| ↳ `dev/pruefungen/` | die Rechnungspruefungen, alle auf einmal mit `node dev/pruefen.js` |
| ↳ `dev/echt.html` | **die Oberfläche am lebenden Objekt** — fährt die richtige App hoch und klickt sich durch; prüft sich selbst |
| `README.md` | was das Heldenbuch ist — die Seite fuer Besucher des Repos |
| `LICENSE`, `NOTICE` | MIT fuer den Code, CC-BY fuer die SRD-Daten |

## Nach jeder Änderung in `js/src/`

```bash
node build.js
```

Und was die Rechnung angeht:

```bash
node dev/pruefen.js
```

**Wer an der Oberfläche war, prüft sie auch.** `node dev/pruefen.js` kann das
nicht: ein Knopf, dessen `onClick` eine gelöschte Funktion ruft, übersetzt
sauber und fällt erst beim Klicken um — so ging „Als Text" von v5.3.1 bis
v5.3.4 gar nicht auf, während alle Rechnungsprüfungen grün waren. Deshalb:

```bash
python devserver.py
```

und dann **http://localhost:8777/dev/echt.html**. Die Seite fährt die richtige
Anwendung hoch — dieselbe `js/app.js`, derselbe Startweg wie in der
`index.html`, nur ohne Server — und klickt sich hindurch: DM-Modus, Held
wählen, Bogen, „Als Text", kopieren, schließen. Unten steht, was gut war und
was nicht. Ihr Speicher liegt nur im Arbeitsspeicher, sie kann also keine
echten Helden überschreiben.

Sonst schlägt der Deploy fehl — die Action prüft mit `node build.js --check`,
ob `js/app.js` zu den Quellen passt.

Die Dateien werden in Namensreihenfolge (`0-`, `1-`, …) aneinandergehängt und
teilen sich einen Geltungsbereich — es gibt keine Imports. Reihenfolge zählt:
`Sheet` muss vor `App` stehen.

## Lokal ansehen

```bash
python devserver.py
```

Nicht `python -m http.server`: das sendet keine Cache-Vorgabe, und der Browser
liefert dann alte Stände von `styles.css` und `js/*.js` aus.

## Konten, Rollen, Rechte

Ein Weg hinein: `login` gibt eine Kennung, die jede Anfrage traegt
(`sv_token`, angehaengt in `apiRequest`). Der Gruppencode und das
DM-Passwort sind seit v4.2 abgeschaltet — `zugang()` weist eine Anfrage
ohne Kennung ab. `hb_sessions.password_hash` bleibt trotzdem: aus ihm
leitet sich der `poll_token` des Hintergrundabgleichs ab.

Rollen je Gruppe (`hb_mitglied`): `spieler`, `dm` — sie gelten nur dort,
wo fuer ein Abenteuer niemand eingetragen ist. Wer welches Abenteuer
leitet, steht in `hb_adv_dm`, und dafuer kommt jedes Mitglied in Frage.
Die Verwaltung steht als `ADMIN_USER` in der `config.php` — nicht in der
Datenbank, damit sich niemand selbst dazu macht.

Zwei Regeln, beide einseitig — nichts eintragen aendert nichts, jeder
Eintrag grenzt ein:

- **Besitz** (`hb_chars.owner`): ein Bogen ohne Besitzer ist fuer jeden
  in der Gruppe aenderbar. Geprueft in `besitzPruefen()` vor `save_char`,
  `delete_char`, `save_item`, `delete_item`.
- **Spielleitung je Abenteuer** (`hb_adv_dm`): ist fuer ein Abenteuer
  niemand eingetragen, leitet es jede Spielleitung der Gruppe. Wer
  eingetragen ist, leitet es — auch ein Spieler der Gruppe.

`darfSchreiben()` im Client haelt sich an dieselben Regeln, bevor etwas
in die Warteschlange geht. Nicht als Sicherung — die steht auf dem
Server — sondern damit das Aufraeumen beim Laden nicht bei jedem Start
an fremden Boegen abprallt.

Was die Anwendung schreibt, entscheidet nie ueber Rechte — deshalb liegen
Besitz und Spielleitung in eigenen Spalten und Tabellen und nicht in
`char_json` oder der Bibliothek.

## Serverseite lokal testen

`api.php` lief frueher erst auf dem Server zum ersten Mal. Seit XAMPP
danebensteht, geht es vorher:

```bash
powershell -NoProfile -Command ".\dev\start.ps1 -Neu"
C:/xampp/php/php.exe dev/test-api.php
```

`start.ps1` startet MariaDB und den eingebauten PHP-Server auf Port 8123.
`-Neu` legt die Wegwerfdatenbank `heldenbuch_dev` frisch an, `-Stop`
beendet beides. `dev/test-api.php` prueft die Schnittstelle ueber echte
HTTP-Anfragen.

Die Anwendung sucht `api.php` neben sich — zum Ausprobieren mit Server
deshalb **http://127.0.0.1:8123/index.html** aufrufen und nicht den
Devserver auf 8777. Wer beides trennen will, setzt `sv_url` von Hand:

```js
localStorage.setItem('sv_url', 'http://127.0.0.1:8123')
```

**Achtung:** die `config.php` im Projektordner zeigt auf die Datenbank der
Gruppe. Der Testlauf fasst sie nicht an — `api.php` nimmt `HB_CONFIG` nur
an, wenn PHP von der Kommandozeile oder aus dem eingebauten Server laeuft,
und `dev/db-neu.php` verweigert die Arbeit, wenn der Host nicht dieser
Rechner ist oder die Datenbank nicht auf `_dev` endet.

## Deploy

Push auf `master` → GitHub-Action → SFTP. Die Action stempelt den
Commit-Kurzhash in die `?v=`-Verweise und vergleicht anschließend jede
ausgelieferte Datei per Prüfsumme mit der hochgeladenen.

Der Upload löscht bewusst nichts auf dem Server — `config.php` mit den
Datenbank-Zugangsdaten liegt nur dort und muss überleben.
