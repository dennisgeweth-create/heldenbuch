# ⚔ Heldenbuch — Patchnotes

## v3.9

### Neu: Heldenwechsel im Charakterbogen

Oben im Bogen kannst du jetzt direkt zwischen deinen Helden wechseln, ohne den
Umweg über die Seitenleiste: Mit **◀ ▶** blätterst du durch alle aktiven Helden,
ein Tipp auf den **Namen** öffnet eine Liste zum direkten Anspringen.
Funktioniert auf Desktop, iPad und Handy. Archivierte Helden werden übersprungen.

### Bedienung auf iPad & Handy

- Das **iPad** zeigt jetzt die für Touch gebaute Ansicht (vorher eine
  Desktop-Mischform, die nicht für Finger gedacht war) — nutzt die
  Bildschirmbreite aber weiterhin mit mehrspaltigen Rastern.
- **Bearbeiten- und Löschen-Knöpfe** bei Waffen, Merkmalen und Inventar sind auf
  Touch-Geräten jetzt immer sichtbar. Vorher waren sie auf dem iPad unsichtbar
  und damit unbenutzbar.
- **Alle Tippziele deutlich vergrößert**: Zauberplätze, Ressourcen-Punkte,
  Fertigkeits-Knöpfe, Kopfzeilen-Aktionen. Fehlgriffe sollten damit weitgehend
  Geschichte sein.
- **Bessere Lesbarkeit**: keine 8-Pixel-Schriften mehr, mehr Luft zwischen den
  Abschnitten.
- iPhone-Ärgernis behoben: Eingabefelder **zoomen nicht mehr automatisch hinein**.

### Aufgeräumte Oberfläche

- **Linkes Menü neu sortiert**: „Neuer Charakter" bleibt die große Hauptaktion,
  Datenbank und Abenteuerlog stehen kompakt nebeneinander, der Server-Sync ist
  eine schlanke Statuszeile. Die Heldenliste hat dadurch **rund zwei Drittel mehr
  Platz**.
- **Taverne des Glücks** ist aus dem Menü genommen (bleibt im Hintergrund
  erhalten und kann jederzeit zurückkehren).
- Die **mitscrollende Leiste** (Zauberplätze / Zaubereipunkte / Ressourcen) ist
  jetzt dezenter und eine **reine Anzeige** — versehentliches Antippen kann keinen
  Zauberplatz mehr verbrauchen. Abgehakt wird wie gewohnt in den jeweiligen
  Bereichen.

### Fehlerbehebungen

- **Kritisch:** Wer die App ohne Server-Verbindung nutzte, verlor beim ersten
  Bearbeiten **alle lokalen Charaktere**. Behoben — und die Fehlerquelle so
  umgebaut, dass diese Art Fehler nicht wieder entstehen kann.
- Vier weitere Stellen im Speichercode beseitigt, die im ungünstigen Moment
  Charaktere aus der **Gruppendatenbank** hätten löschen können.

### Technik (kurz)

- Projekt liegt jetzt versioniert auf GitHub; jeder Push wird **automatisch auf
  den Server deployt** und per Prüfsumme verifiziert.
- Die App rendert nur noch die aktive Ansicht statt Desktop und Mobil
  gleichzeitig — **halb so viel DOM**, spürbar auf älteren Geräten.
