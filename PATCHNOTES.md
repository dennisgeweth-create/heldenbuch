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

## v3.10

### Neu: Ausrüstung mit Plätzen statt einer Liste

Der Inventar-Reiter hat oben eine Ausrüstungsanzeige bekommen: **15 Plätze** —
Kopf, Hals, Umhang, Rüstung, Armschienen, Handschuhe, Gürtel, Stiefel, zwei
Ringe, Wunderding, Sonstiges und drei für die Hände. Ein Tipp auf ein angelegtes
Stück zeigt seine Einzelheiten, der **⇄** daneben wechselt oder legt ab. Ein
leerer Platz führt direkt zur Auswahl.

- Die **Rüstungsklasse wird gerechnet** und in der Mitte aufgeschlüsselt:
  „Kettenhemd: 13 + GES 2 · + Schild: +2 · + Ring des Schutzes: +1 = 18 RK".
  Kein Nachrechnen mehr von Hand.
- Die **Handplätze zeigen auf deine Waffen** — wechselst du hier, wechselt es
  auch auf der Waffenkarte im Aktionen-Reiter. Ein Zweihänder in der Haupthand
  belegt und sperrt die Nebenhand.
- **Rüstungsvorlagen** von Lederrüstung bis Plattenpanzer stehen in der Auswahl
  des Rüstungsplatzes und legen das Stück in einem Schritt an *und* ziehen es an.
- In der Mitte kannst du ein **Bild deines Helden** hochladen, im Format einer
  Spielkarte. Ohne Bild stehen dort die gekreuzten Schwerter als Knopf.

Getragenes ist jetzt ein ganz normaler Inventargegenstand mit einem Platz — es
gibt keine zweite Ausrüstungsliste mehr, die man doppelt pflegen muss.
Bestehende Ausrüstung wurde beim ersten Öffnen automatisch übernommen.

### Neu: Sets

Gegenstände können zu einem Set gehören. Unter **📚 Datenbank › ✦ Sets** legst du
fest, was ab wie vielen getragenen Teilen dazukommt — etwa „2 Teile: Bewegung +3“
und „4 Teile: Rüstungsklasse +2“. Erreichte Stufen wirken alle zugleich.

Unter der Ausrüstung steht dann, wie weit du bist: **„✦ Hain des Ersten Lichts
2 / 4 Teile"**, erreichte Stufen hell, offene gedämpft. Gezählt werden getragene
Stücke — zwei Ringe desselben Sets sind zwei Teile.

### Neu: Mehrere Abenteuer

Eine Anmeldung kann jetzt mehrere Kampagnen führen. Unter der Heldenliste steht,
welches Abenteuer offen ist; die Liste zeigt nur dessen Helden. Euer bisheriger
Bestand ist automatisch zu **„Strahd"** geworden.

Neue Abenteuer legst du unter **⚙ Abenteuer verwalten** an, dort lassen sie sich
auch umbenennen und Helden verschieben. Zauber, Waffen und Gegenstände aus der
Datenbank gelten weiterhin für alle — ein Heiltrank ist in jeder Kampagne
derselbe.

### Effekte können sehr viel mehr

Gegenstände, Waffen und **neuerdings auch Merkmale** können Werte verändern. Aus
41 möglichen Zielen sind **77** geworden:

- **Immunitäten** gegen kritische Treffer, Bezaubern, Furcht, Gift, Krankheit,
  magischen Schlaf, Gelähmt und Blind
- **Resistenzen** gegen alle 13 Schadensarten
- **Vorteil und Nachteil** auf Initiative, Heimlichkeit, Rettungswürfe gegen
  Zauber und Gift, Todesrettungswürfe
- **Sinne und Bewegung**: Passive Wahrnehmung, Dunkelsicht, Schwimm-, Kletter-
  und Flugbewegung
- **Besonderes**: nicht überraschbar, Wasseratmung, braucht keinen Schlaf,
  versteht alle Sprachen

Diese neue Sorte trägt keine Zahl — sie gilt oder gilt nicht. Im Effekte-
Überblick stehen sie zusätzlich gebündelt unter **„Gilt gerade"**, damit im Kampf
auf einen Blick klar ist, wogegen du immun bist, ohne die Gegenstände
durchzusehen.

**Merkmale mit Effekten** sind der Grund, warum die RK-Boni aus Talenten
umgezogen sind: Der Defensive Kampfstil steht jetzt bei den Merkmalen, wo er
hingehört, mit einem Schalter auf der Karte — er greift ja nicht ohne Rüstung.

### Suchen und Finden

- **Inventarsuche** über *alle* Angaben eines Gegenstands: Name, Schlagworte,
  Herkunft, Seltenheit, Effekte und Beschreibung. Umlaute darfst du weglassen,
  „ubermantel" findet den Übermantel. Ein großer Zurücksetzen-Knopf räumt Suche,
  Seltenheit und Schlagworte auf einmal weg.
- Die **Gegenstandsdatenbank** kennt jetzt Ausrüstungsplatz, Rüstungswerte,
  Effekte und Set-Zugehörigkeit. Was du daraus übernimmst, bringt alles mit.

### Bedienung

- Die **Heldenliste klappt sich nicht mehr weg**, wenn du einen Helden auswählst.
  Wer mehr Platz für den Bogen will, klappt sie selbst ein — der Knopf am linken
  Rand trägt dann die Aufschrift „Helden".
- Der **Bearbeiten-Knopf im Attribute-Tab steht unten**, wo man ihn sucht, wenn
  man wirklich etwas ändern will. Läuft der Modus, steht oben eine Marke.
- **Übungen, Expertise, Rettungswürfe und der Allrounder lassen sich nur noch im
  Bearbeiten-Modus umschalten.** Am Spieltisch tippt man auf einer
  Fertigkeitszeile schnell daneben, und eine versehentlich gesetzte Übung
  verschiebt still einen Wurf.
- Die beiden Werkzeuge über der Kampfwerte-Leiste sind zu einem **Zahnrad am Ende
  der Leiste** geworden — immer an derselben Stelle, aber nicht mehr im Weg.
- Die **Blätterpfeile am Heldennamen sind weg**; gewechselt wird über das Menü am
  Namen. (Der Hinweis dazu in v3.9 gilt nicht mehr.)
- **Am Handy**: die Ausrüstungsplätze stehen untereinander statt in zwei engen
  Spalten, und in der Tableiste trägt nur noch der offene Reiter seinen Namen —
  die übrigen sechs sind Symbole und dadurch größer zu treffen.

### Fehlerbehebungen

- **Kritisch:** Wer viele Bilder gespeichert hatte, kam irgendwann **gar nicht
  mehr hinein** — die Anmeldung brach mit „exceeded the quota" ab, weil der
  Browserspeicher voll war. Behoben; ein voller Speicher blockiert jetzt nichts
  mehr, und die App sagt es, statt eine halbe Kopie zu hinterlassen.
- **Kritisch:** Änderungen, die entstanden während der Server nicht erreichbar
  war, gingen beim Schließen des Fensters **still verloren**. Sie überstehen das
  jetzt und gehen zum Server, sobald er wieder antwortet.
- Die Meldung **„Lokal ✓"** ist weg. Sie las sich wie ein gelungenes Speichern,
  obwohl nichts angekommen war. Jetzt steht dort der echte Grund und, solange
  etwas aussteht, **„N nicht gesichert"** in Rot — und der Browser fragt nach,
  wenn du das Fenster schließen willst.
- **Abmelden** verlangt jetzt, dass nichts mehr aussteht.
- Ohne Gruppe werden **keine Charaktere mehr geladen** — es gab sonst einen
  Stand hinter dem Anmeldefenster, an dem man arbeiten konnte, ohne dass er je
  irgendwo ankam.
- In der Ausrüstungsanzeige **öffneten Waffen ihre Einzelheiten nicht**.
- Auf dem Tablet standen die **Rettungswürfe über ihren Kasten hinaus**.
- Bei angelegter Ausrüstung stand in der Gegenstandsansicht **„Ruht"**, obwohl
  die Effekte längst wirkten.

### Technik (kurz)

- Der Anwendungscode liegt jetzt in sieben Quelldateien statt einer.
- Die Rüstungsklasse wird an **einer** Stelle gerechnet und von Bogen und
  Kampftracker gemeinsam benutzt — statt zweier Fassungen, die auseinanderlaufen.
- Die Warteschlange zum Server merkt sich **Kennungen statt Inhalte**: ein paar
  Byte statt eines vollständigen zweiten Abzugs aller Charaktere.

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
