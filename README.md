# ⚔ Heldenbuch

Ein Charakterbogen und Spielleitungswerkzeug für **Dungeons & Dragons 5e**,
auf Deutsch, für eine Gruppe, die zusammen an einem Tisch sitzt.

Es ist kein Regelrechner und kein Würfelserver. Gewürfelt wird am Tisch.
Das Heldenbuch hält fest, was dabei herauskommt, und nimmt der
Spielleitung die Buchführung ab — Trefferpunkte, Zauberplätze,
Initiative, Beute, Kalender. Wer am Tisch schneller im Kopf rechnet als
er tippt, soll im Kopf rechnen dürfen.

> **Dieses Programm wurde vollständig von einer KI geschrieben.**
> Was das heißt und was es nicht heißt, steht weiter unten unter
> [„Von einer KI gebaut"](#-von-einer-ki-gebaut).

---

## Was es kann

**Für die Spielenden**

- **Charakterbogen** mit sieben Reitern: Werte, Zauber, Ausrüstung,
  Merkmale, Notizen, Abenteuerlog, Aufstieg.
- **Charakterassistent** — sechs Schritte von „Name" bis „fertig", mit
  einer Vorschau dessen, was danach im Bogen steht.
- **Stufenaufstieg** mit Vorschau: erst sehen, was sich ändert, dann
  übernehmen.
- **Ausrüstungspuppe** mit Plätzen, und Effekte, die von dort aus in die
  Werte durchschlagen.
- **Im Kampf ansagen**, was man vorhat — Aktion, Bonusaktion, Reaktion,
  mit Ziel und Zaubergrad. Die Spielleitung sieht es und trägt ein, was
  daraus wurde.

**Für die Spielleitung**

- **Kampftracker**: Initiative, Runden, Zustände, Todesrettungswürfe,
  ein Protokoll, das jeden Zug mitschreibt.
- **Kampfkarte**: ein Raster mit Gelände und Figuren, Entfernungen,
  Sichtlinien und Höhe. Sie ist als **Text** gebaut und lässt sich
  jederzeit kopieren — und wieder einlesen.
- **Gegnersammlung und Begegnungen**, Beute zum Verteilen, ein Laden,
  ein Kalender mit Ereignissen.
- **Proben auf Ansage** — an einzelne oder an alle, offen oder geheim.
- **Taverne** mit neun Spielen: Blackjack, Roulette, Craps, Poker,
  Pferderennen und vier Automaten. Gespielt wird mit Spielmarken, nicht
  mit dem Gold der Helden.

**Zusammenspiel**

Ein Server hält die Bögen zusammen; wer am Tisch sitzt, sieht dasselbe.
Was die Spielleitung nicht zeigen will, wird nicht gezeigt — und zwar
serverseitig gefiltert, nicht nur im Browser ausgeblendet.

---

## 🤖 Von einer KI gebaut

Das Heldenbuch ist **zu hundert Prozent von Claude geschrieben** — Code,
Kommentare, Dokumentation, Patchnotes, diese README. Kein Teil davon ist
von Hand getippt.

Die Rolle des Menschen war eine andere: entscheiden, was gebaut wird,
Fehler aus dem echten Spiel melden, und Nein sagen. Das Heldenbuch ist
über viele Monate am Spieltisch entstanden, und jede Änderung kam aus
einer Abendrunde, an der jemand etwas vermisst hat.

**Was das für dich bedeutet, wenn du hier hereinschaust:**

- **Lies den Code, bevor du ihn benutzt.** Das gilt für jeden fremden
  Code, hier aber besonders. Es gibt keinen Menschen, der jede Zeile
  gelesen hat.
- **Die Kommentare erklären das Warum, nicht das Was.** Sie sind
  ausführlicher als üblich und begründen Entscheidungen, damit der
  nächste Durchgang — ob Mensch oder Maschine — den Grund kennt und
  nicht dagegen arbeitet.
- **Geprüft wird mit eigenen Testläufen**, nicht mit einem Rahmenwerk:
  reine Rechnung mit Node, die Schnittstelle über echte HTTP-Anfragen
  gegen eine Wegwerfdatenbank, die Oberfläche in Werkbankseiten unter
  `dev/`. Zurzeit **582 Rechnungsprüfungen und 262 auf dem Server**.
  Sie sind kein Ersatz für ein Codereview, aber sie fangen das meiste —
  siehe [Prüfen](#prüfen).
- **Fehler sehen anders aus.** Typische Fehler dieser Bauweise sind
  nicht Tippfehler, sondern Annahmen, die einmal richtig waren und beim
  nächsten Umbau nicht mitgezogen wurden. Zwei stehen als Beispiel in
  den Patchnotes zu v5.2.

Wer das für keine gute Idee hält, hat gute Gründe. Die Alternative war
nicht „dasselbe, von Hand geschrieben", sondern: gar nicht.

---

## Wie es gebaut ist

Absichtlich klein gehalten. **Kein npm, kein `node_modules`, kein
Bundler, kein Framework über React hinaus.**

| | |
|---|---|
| **Oberfläche** | React 18, als Datei unter `vendor/` |
| **Bauschritt** | `node build.js` hängt `js/src/*.jsx` in Namensreihenfolge aneinander und übersetzt einmal mit Babel zu `js/app.js` |
| **Server** | eine einzige `api.php`, PDO, MariaDB/MySQL |
| **Auslieferung** | GitHub Action → SFTP, mit Prüfsummenvergleich danach |
| **Abhängigkeiten** | React, React-DOM, Babel. Sonst keine. |

Die `js/app.js` liegt **mitcommittet** im Repo. Das ist Absicht: die
Seite läuft damit auch ohne Bauschritt, und der Prüflauf vergleicht eine
Datei, die wirklich da ist. Die Action bricht ab, wenn sie nicht zu den
Quellen passt.

Es gibt **keine Imports** — alle Dateien teilen einen Geltungsbereich,
und die Reihenfolge der Dateinamen ist die Reihenfolge im Ergebnis.
Ungewöhnlich, aber es hält den Bauschritt bei zwanzig Zeilen.

### Aufbau

```
index.html          Gerüst, Kopfdaten, API-Client
js/src/*.jsx        der ganze Anwendungscode — hier wird gearbeitet
js/app.js           daraus gebaut. Nicht von Hand ändern.
js/data.js          Regeltabellen
js/util.js          reine Hilfsfunktionen, ohne React
styles.css          die gesamte Oberfläche
api.php             Server-Sync, braucht config.php
data-*.json         SRD-Vorlagen, nach Art getrennt
dev/                Testseiten und Prüfungen — wird nie ausgeliefert
dev/pruefungen/     die Rechnungsprüfungen, mit node dev/pruefen.js
```

Welche Datei was macht, steht in [`CLAUDE.md`](CLAUDE.md).

### Weitere Unterlagen

| | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Dateiübersicht, Rollen und Rechte, Deploy — der Einstieg |
| [`PATCHNOTES.md`](PATCHNOTES.md) | was sich je Ausgabe geändert hat. Wird ausgeliefert |
| [`KAMPFTRACKER.md`](KAMPFTRACKER.md) | was der Tracker führt und ausgibt — zum Vorlegen an eine KI |
| [`KAMPFKARTE.md`](KAMPFKARTE.md) | Konzept und Bauplan der Rasterkarte |
| [`TAVERNE.md`](TAVERNE.md), [`TAVERNE-WALZEN.md`](TAVERNE-WALZEN.md) | die Spiele und ihre Mathematik |
| [`SPIELFLUSS.md`](SPIELFLUSS.md) | alles um den Spielabend herum |

---

## Selbst betreiben

Gebraucht werden ein Webspace mit **PHP 8** und **MariaDB/MySQL** — mehr
nicht. Kein Node auf dem Server, kein Composer. (Geprüft wird mit 8.2.
PHP 7.4 dürfte reichen, ist aber nicht ausprobiert.)

**1. Dateien hochlegen.** Was in den Webroot gehört, steht in der
Dateiliste der [Deploy-Action](.github/workflows/deploy.yml). Kurz:
`index.html`, `styles.css`, `api.php`, `.htaccess`, die `js/`-Dateien,
die `data-*.json`, `vendor/react*` und die Bilder. **Nicht** hochladen:
`js/src/`, `dev/`, `vendor/babel.min.js`, die Markdown-Dateien außer
`PATCHNOTES.md`.

**2. `config.php` daneben legen.** Vorlage ist
[`config.example.php`](config.example.php):

```php
define('DB_HOST',        'localhost');
define('DB_NAME',        '…');
define('DB_USER',        '…');
define('DB_PASS',        '…');
define('ALLOWED_ORIGIN', 'https://example.com/heldenbuch/');
define('ADMIN_USER',     'dein-benutzername');
```

`ADMIN_USER` ist die Verwaltung. Der Name steht mit Absicht in dieser
Datei und nicht in der Datenbank: wer ihn ändern will, braucht Zugriff
auf die Zugangsdaten — so kann sich niemand selbst dazu machen.

**3. Aufrufen.** Die Tabellen legt `api.php` beim ersten Zugriff selbst
an. Solange es noch kein Konto gibt, bietet der Anmeldeschirm an, das
erste anzulegen; danach verschwindet der Knopf.

### Örtlich entwickeln

```bash
python devserver.py          # Oberfläche auf Port 8777, ohne Server
```

Nicht `python -m http.server`: das sendet keine Cache-Vorgabe, und der
Browser liefert dann alte Stände aus.

Mit Serverseite (braucht XAMPP daneben):

```bash
powershell -NoProfile -Command ".\dev\start.ps1 -Neu"
C:/xampp/php/php.exe dev/test-api.php --neu
```

`start.ps1` startet MariaDB und PHP auf Port 8123 und legt die
Wegwerfdatenbank `heldenbuch_dev` an. Die `config.php` des echten
Servers wird dabei nicht angefasst — `dev/db-neu.php` verweigert die
Arbeit, wenn der Host nicht der eigene Rechner ist oder die Datenbank
nicht auf `_dev` endet.

**Nach jeder Änderung in `js/src/`:**

```bash
node build.js
```

### Prüfen

```bash
node dev/pruefen.js                              # 582 Rechnungsprüfungen
C:/xampp/php/php.exe dev/test-api.php --neu      # 262 an der Schnittstelle
```

Die Rechnungsprüfungen unter `dev/pruefungen/` brauchen weder Browser
noch Server noch Datenbank: sie lesen die Quelldateien, schneiden den
Teil ohne React heraus und rechnen. Deshalb steht in jeder Quelldatei
mit nennenswerter Mathematik eine Marke
`// ══ Ende der reinen Rechnung` — darüber läuft alles ohne React.

Die Oberfläche wird in Werkbankseiten geprüft, die ohne Anmeldung
laufen: `dev/tisch.html` (Taverne), `dev/karte-schau.html` (Kampfkarte
und Protokoll), `dev/assistent-schau.html` (Charakterassistent),
`dev/patchnotes-schau.html`. Die brauchen ein Auge.

### Selbst ausliefern

Die [Deploy-Action](.github/workflows/deploy.yml) lädt bei jedem Push auf
`master` per SFTP hoch und vergleicht danach jede Datei per Prüfsumme mit
dem, was auf dem Server angekommen ist. Sie braucht fünf Secrets:
`SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD`, `REMOTE_DIR`, `SITE_URL`.

Ohne diese Secrets — also in jedem Fork — laufen nur die Prüfschritte,
und die Auslieferung wird übersprungen.

Der Upload löscht auf dem Server **nichts**. Das ist Absicht:
`config.php` und `data-eigen.json` liegen nur dort und müssen jeden
Upload überleben.

---

## Regeln, Lizenz, Grenzen

**Der Code** steht unter der [MIT-Lizenz](LICENSE).

**Die Regeldaten** — Zauber, Waffen, Tiergestalten, Klassenmerkmale —
stammen aus dem **SRD 5.1** von Wizards of the Coast und stehen unter
**CC-BY-4.0**. Wer sie weitergibt, muss den Vermerk in [`NOTICE`](NOTICE)
mitgeben.

**Text aus dem Spielerhandbuch, Tashas Kessel oder Xanathars Ratgeber ist
hier nicht drin** und wird auch nicht ausgeliefert. Das Heldenbuch kann
solches Material zwar führen — es liest eine `data-eigen.json` neben der
`index.html`, wenn eine da ist —, aber diese Datei legt jede Gruppe aus
ihren eigenen Büchern selbst an, auf ihrem eigenen Server. Sie steht in
der `.gitignore`. **Diese Grenze ist Absicht und soll so bleiben.**

Dungeons & Dragons und D&D sind Marken von Wizards of the Coast LLC.
Das Heldenbuch ist ein unabhängiges Werkzeug und steht in keiner
Verbindung zu Wizards of the Coast.

---

## Mitmachen

Das Heldenbuch ist für eine bestimmte Gruppe an einem bestimmten Tisch
gebaut. Es ist öffentlich, damit andere hineinsehen und es nachbauen
können — nicht, weil es ein Produkt werden soll.

Fehlerberichte sind willkommen, besonders solche aus echten Spielabenden:
**was hast du getan, was hast du erwartet, was stand da.** Genau daraus
ist fast alles hier entstanden.
