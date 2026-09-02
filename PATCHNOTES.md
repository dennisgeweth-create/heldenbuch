# ⚔ Heldenbuch — Patchnotes

## v4.0

### Neu: Kampftracker im Heldenbuch — nur für die Spielleitung

Der Kampftracker ist umgezogen. Er läuft jetzt im Heldenbuch selbst, hinter dem
DM-Passwort, und kennt eure Charaktere direkt — keine zweite Heldenliste mehr,
die man doppelt pflegen und synchron halten muss.

**Bestiarium.** Unter **📚 Datenbank › 💀 Gegner** liegt die Gegnersammlung.
Über **⇪ Sammlung einlesen** kommt eine JSON-Datei komplett hinein — die 360
Gegner aus dem alten Tracker in einem Rutsch. Gesucht wird über Name,
Schlagwort und Herausforderungsgrad, sortiert ist nach Grad. Die Werteübersicht
zeigt Angriffe, Merkmale, Bonusaktionen, Reaktionen sowie legendäre und
Schauplatzaktionen. Bilder je Gegner sind möglich.

**Begegnungen.** Unter **⚔ Begegnungen** stellst du Gegner mit Anzahl zu einer
Begegnung zusammen. Sie gehört zu einem Abenteuer, damit die Krypten von Strahd
nicht in der nächsten Kampagne auftauchen.

**Der Kampf.** Über **⚔ Kampf** in der Seitenleiste. Die Trefferpunkte der
Gegner werden ausgewürfelt statt gemittelt, gleichartige durchnummeriert, die
Initiative geworfen. Die Helden des offenen Abenteuers kommen automatisch dazu —
ihre Initiative bleibt leer, bis du die angesagte Zahl einträgst. Dann: Runden,
Züge, Schaden, Heilung, temporäre Trefferpunkte (die den Schaden zuerst
abfangen), fünfzehn Zustände und Erschöpfung.

**Spontan geht auch.** Über **⚡ Spontaner Kampf** wählst du Gegner direkt aus
der Sammlung, ohne vorher eine Begegnung anzulegen — suchen, anklicken, mehrfach
klicken für mehrere, starten. Dasselbe Fenster holt über **⚡ Gegner** auch
Nachzügler in einen laufenden Kampf; sie würfeln ihre Initiative und sortieren
sich ein, ohne dass der aktuelle Zug verrutscht.

**Ein versehentliches Neuladen kostet den Kampf nicht mehr.** Im alten Tracker
stand er nur im Arbeitsspeicher — ein F5 mitten im Gefecht, und
Initiativreihenfolge, Trefferpunkte und Zustände waren fort. Jetzt steht er nach
dem Neuladen unverändert da, und der Knopf zeigt die laufende Runde an.

### Was der Tracker jetzt weiß und vorher nicht wissen konnte

Die Werte der Helden kommen **gerechnet aus dem Bogen**, nicht getippt aus einer
zweiten Liste — und zwar laufend, nicht nur beim Kampfbeginn. Legt jemand mitten
im Kampf seinen Schild ab, steht seine Rüstungsklasse sofort richtig.

An der Initiativzeile hängen deshalb Dinge, die es im alten Tracker nicht gab:

- **Immunitäten und Resistenzen** — wogegen dieser Held immun ist, was er
  widersteht
- **Vorteil und Nachteil** aus Gegenständen und Merkmalen
- **Passive Wahrnehmung** direkt sichtbar, für die Frage, wer die Falle bemerkt
- Ein Klick auf den Namen zeigt **alle sechs Rettungswürfe** und die wirkenden
  Effekte **mit ihrer Herkunft** — also „Defensiver Kampfstil Rüstungsklasse +1"
  statt nur „+1"

### Trefferpunkte zurück in die Bögen

Am Kampfende kannst du die Trefferpunkte in die Charakterbögen schreiben.
Ausdrücklich, nicht automatisch: es steht je Held nebeneinander, was im Bogen
steht und was im Kampf herausgekommen ist, und jede Zeile lässt sich abwählen.

**Die Sicherung dabei:** hat ein Spieler seinen Bogen während des Kampfes selbst
verändert — sich etwa geheilt —, ist die Zeile nicht vorgewählt und trägt den
Hinweis, dass der Bogen inzwischen angefasst wurde. Ohne das hätte der ältere
Kampfwert die neuere Eingabe stillschweigend überschrieben. Jede Übertragung
landet zusätzlich im Abenteuerlog.

### Für die Spielleitung wichtig

- Der Gegner-Reiter erscheint **nur im DM-Modus**. Spieler können die Werte ihrer
  Gegner nicht abrufen — auch nicht mit Gruppen-Code und Passwort.
- Gegner werden **einzeln gespeichert**, nicht als ein Block. Deshalb kostet das
  Ändern eines Goblins nicht mehr das Hochladen der ganzen Sammlung, und Bilder
  sprengen keine Obergrenze.
- Der laufende Kampf liegt **auf deinem Gerät**, nicht auf dem Server. Er
  übersteht ein Neuladen, aber kein Wechseln des Geräts.

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
