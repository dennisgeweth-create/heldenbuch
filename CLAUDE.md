# Heldenbuch

D&D-5e-Charakterverwaltung. Läuft ohne Framework-Toolchain: React aus
`vendor/`, kein npm, kein `node_modules`.

## Dateien

| Datei | Rolle |
|---|---|
| `index.html` | Gerüst, Kopfdaten, API-Client, Ladebild |
| `js/app.jsx` | **Anwendungscode — hier wird bearbeitet** |
| `js/app.js` | daraus erzeugt, wird ausgeliefert. Nicht von Hand ändern. |
| `js/data.js` | Regeltabellen (Klassen, Zauberschulen, Fertigkeiten, Effektziele) |
| `js/util.js` | reine Hilfsfunktionen ohne React |
| `styles.css` | gesamte Oberfläche |
| `data-*.json` | SRD-Vorlagen, nach Art getrennt geladen |
| `api.php` | Server-Sync, braucht `config.php` (nicht im Repo) |

## Nach jeder Änderung an `js/app.jsx`

```bash
node build.js
```

Sonst schlägt der Deploy fehl — die Action prüft mit `node build.js --check`,
ob `js/app.js` zur Quelle passt.

## Lokal ansehen

```bash
python devserver.py
```

Nicht `python -m http.server`: das sendet keine Cache-Vorgabe, und der Browser
liefert dann alte Stände von `styles.css` und `js/*.js` aus.

## Deploy

Push auf `master` → GitHub-Action → SFTP. Die Action stempelt den
Commit-Kurzhash in die `?v=`-Verweise und vergleicht anschließend jede
ausgelieferte Datei per Prüfsumme mit der hochgeladenen.

Der Upload löscht bewusst nichts auf dem Server — `config.php` mit den
Datenbank-Zugangsdaten liegt nur dort und muss überleben.
