# 🎲 Der Spielfluss — Stufenplan

Das Heldenbuch trägt den Abend selbst gut: Kampf, Zauberplätze, Rasten,
Zustände, Kalender, Log. Was es nicht trägt, ist alles davor und
danach — und dort steckt die Arbeit, die niemand gern macht.

Der Plan steht hier, weil die Reihenfolge zählt: jede Stufe ist für sich
fertig und benutzbar, und keine verlangt Arbeit, die eine spätere wieder
wegwirft. Die Stufen 3 bis 7 hängen an keiner davor — wenn eine davon
am Tisch dringender wird, kommt sie vor.

**Nicht in diesem Plan:** ein Sitzungsknopf mit Anfang und Ende. Der
wird nie gebraucht.

---

## Grundsätze, die für alle Stufen gelten

- **Erst zeigen, dann ändern.** Kein Assistent schreibt etwas in einen
  Bogen, ohne vorher hinzuschreiben, was er ändern wird — „TP 24 → 31 ·
  Übungsbonus +2 → +3 · neu: *Aktionsschub*". Erst dann der Knopf. Das
  ist der Failsafe, der alle folgenden Stufen trägt, und er wird in
  Stufe 1 einmal gebaut.
- **Was von Hand kam, bleibt.** Jeder Wert, den ein Assistent gesetzt
  hat, ist als solcher markiert. Nur diese darf ein späterer Lauf
  anfassen. Wer seine Trefferpunkte selbst eingetragen hat, hat einen
  Grund gehabt.
- **Kein Assistent ist Pflicht.** Das Formular von Hand bleibt, wo es
  ist. Wer seinen Bogen lieber selbst tippt, merkt von alldem nichts.
- **Regeln sind Daten, kein Code.** Trefferwürfel, Übungsbonus,
  Zauberplätze, Fertigkeitslisten stehen in Datendateien neben den
  SRD-Vorlagen, die es schon gibt. Eine Hausregel ändert dann eine
  Zeile und keine Funktion.
- **Was eine Runde nicht will, gibt es nicht.** Alles, was Buchführung
  hinzufügt, ist je Abenteuer abschaltbar — und was mehr Arbeit macht
  als es bringt, ist von Haus aus **aus**.
- **Jede Änderung steht im Log**, mit dem, der sie gemacht hat. Das
  steht seit v4.8.1 da und muss nur benutzt werden.

---

## Stufe 0 · Steht schon

- Charakterbogen mit sieben Reitern, Effekte, Ausrüstungspuppe.
- Kampftracker: Initiative, Runden, Zugfenster, Todesrettungswürfe,
  Zustände, Resistenzen, Flächen und Rettungswürfe.
- Zauberplätze und Ressourcen mit Rastarten, kurze und lange Rast.
- Gegner, Begegnungen, Chronik, Abenteuerlog, Rollen und Besitz.
- Bibliothek mit SRD-Vorlagen für Zauber, Waffen und Tiergestalten.
- Gewicht steht bereits an jedem Gegenstand — es zählt nur niemand
  zusammen.

---

## Stufe 1 · Der Stufenaufstieg ✓

*Steht seit v4.9.* **Zuerst, weil er sich wiederholt.** Ein Charakter wird einmal erstellt
und fünfzehnmal aufgestiegen. Heute ist jeder Aufstieg Handarbeit:
Trefferpunkte rechnen, Übungsbonus nachschlagen, Merkmale eintippen,
Zauberplätze umstellen, ab Stufe 3 die Unterklasse. Das dauert am Tisch
zehn Minuten, in denen vier Leute warten, und dabei wird regelmäßig
etwas vergessen.

Er braucht nur **Tabellen**, keinen Fließtext:

| Was | Umfang |
|---|---|
| Trefferwürfel je Klasse | 12 Zeilen |
| Übungsbonus je Stufe | 20 Zahlen |
| Stufen mit Attributssteigerung | je Klasse eine Liste |
| Zauberplätze je Klasse und Stufe | die drei Tabellen (voll, halb, Pakt) |
| Stufe der Unterklassenwahl | eine Zahl je Klasse |

Der Ablauf: Stufe wählen → Trefferpunkte (würfeln oder Durchschnitt) →
Attributssteigerung oder Talent, wenn diese Stufe eine gibt →
Unterklasse, wenn sie fällig ist → **Vorschau** → Übernehmen.

**Failsafes, wie gebaut:**

- Der Vorschaukasten ist die ganze Sicherung — was nicht darin steht,
  passiert nicht. Gerechnet wird in `aufstiegPlan`, und das Übernehmen
  schreibt genau dessen Ergebnis: die Vorschau *kann* nicht abweichen.
- **Nichts ist vorgewählt.** Die Attributssteigerung fängt ohne Wahl an
  — eine vorgewählte Stärke landete sonst im Bogen eines Magiers, weil
  jemand nur auf Übernehmen gedrückt hat.
- **Die Trefferpunkte sind änderbar.** Durchschnitt oder Würfeln setzen
  die Zahl, tippen darf man sie trotzdem. Damit geht der Aufstieg auch
  rückwärts, ohne dass jemand raten muss, was damals fiel.
- **Verbrauchte Zauberplätze bleiben verbraucht.** Der Aufstieg füllt
  sie nicht auf; das tut die lange Rast.
- **Was er nicht kann, sagt er.** Eine eigene Klasse steht nicht in den
  Tabellen — dann rechnet er Stufe und Übungsbonus und lässt den Rest.
  Bei mehreren Klassen lässt er die Zauberplätze stehen: die folgen
  einer eigenen Tabelle, und eine falsche Zahl wäre schlimmer als gar
  keine.
- Im Log steht dieselbe Liste noch einmal, mit dem, der sie ausgelöst
  hat.

**Was er nicht tut:** Klassenmerkmale anlegen. Ihre Namen stehen noch
nicht in den Tabellen — er sagt nur, wenn eine Stufe eine
Unterklassenwahl fällig macht. Die Namen kämen mit Stufe 2 dazu, wenn
die Klassendaten ohnehin wachsen.

## Stufe 2 · Der Charakterassistent

Heute ist „✶ Neuer Charakter" ein Formular mit fünf Feldern. Danach
steht ein leerer Bogen da, und man trägt zwei Stunden lang ein, was
eigentlich aus den Regeln folgt.

Sechs Schritte, jeder mit einem **„Warum?"** — einem Satz Regelinfo.
Das ist der halbe Nutzen für jemanden, der neu ist.

| Schritt | Was er setzt | Was er verhindert |
|---|---|---|
| **Volk** | Bewegungsrate, Größe, Sprachen, Völkermerkmale | — |
| **Klasse** | Trefferwürfel, Rettungswurf-Übungen, Rüstung und Waffen, Zauberattribut | — |
| **Attribute** | Standard-Array, Punktekauf (27) oder 4W6 | Punktekauf über 27; eine Array-Zahl zweimal |
| **Hintergrund** | zwei Fertigkeiten, Werkzeug, Sprachen, Ausrüstung | — |
| **Fertigkeiten** | aus der Liste der Klasse | zu viele, doppelte, die vom Hintergrund schon belegten |
| **Ausrüstung** | Paket der Klasse **oder** Startgold | beides |

Am Ende rechnet er ab, was folgt: Trefferpunkte, Rüstungsklasse aus der
getragenen Rüstung, Übungsbonus, Rettungswürfe, Initiative,
Zauberplätze, Zahl der vorbereiteten Zauber.

**Failsafes:** Der „Fertig"-Knopf sagt, *was* noch fehlt, statt nur grau
zu werden. Nichts wird überschrieben, was schon dasteht, ohne dass es in
der Vorschau steht. Er läuft auf einem fertigen Bogen erneut, ohne ihn
zu zerlegen.

**Der ehrliche Haken:** Völker, Klassen und Hintergründe müssen als
Daten da sein, auf Deutsch. Das ist die eigentliche Arbeit — nicht die
Oberfläche. Deshalb erst die Tabellen aus Stufe 1, dann die Startpakete,
und die Merkmalstexte wachsen über die Bibliothek mit.

## Stufe 3 · Proben auf Ansage

„Alle einen Wurf auf Wahrnehmung." Heute: reihum fragen, Zahlen
sammeln, im Kopf vergleichen. Dabei liegt die Maschinerie schon da — der
Kampftracker sagt seit v4.8 in zwei Sekunden „du bist dran".

Die Spielleitung wählt Fertigkeit und Schwierigkeitsgrad, wahlweise
verdeckt. Bei jedem Spieler erscheint eine Zeile mit **seinem**
Modifikator; er trägt seinen Wurf ein. Die Spielleitung sieht eine
Liste: wer bestanden hat, wer nicht, wer noch fehlt.

**Failsafe:** Eine Ansage verfällt von selbst. Eine offene Probe, die
niemand mehr beantwortet, darf den Tisch nicht blockieren.

**Was sie nicht tut:** für den Spieler würfeln. Wer am Tisch sitzt,
würfelt mit der Hand; das Feld nimmt die Zahl.

## Stufe 4 · Konzentration

Kein Tisch denkt daran. Ein Zauber mit Konzentration steht als Zeile am
Bogen — wer Schaden nimmt, bekommt im Zugfenster den
Konstitutions-Rettungswurf mit dem richtigen Schwierigkeitsgrad
vorgelegt (10 oder die Hälfte des Schadens, was größer ist).

Klein, weil das Zugfenster Rettungswürfe schon kann und die Zauber
bereits eine Wirkung tragen. Es fehlt ein Feld am Zauber und eine Zeile
am Bogen.

## Stufe 5 · Beute verteilen

Gibt es noch gar nicht. Die Spielleitung legt einen Fund an — Münzen und
Gegenstände —, die Gruppe verteilt ihn. Gold und Gegenstände wandern in
die Bögen, eine Zeile ins Abenteuerlog, und zwar mit dem, der sie
genommen hat.

**Failsafe:** Ein Fund ist erst verteilt, wenn alles vergeben ist. Was
offen bleibt, bleibt sichtbar — Beute, die halb verteilt in einem
Fenster verschwindet, ist am nächsten Abend Streit.

## Stufe 6 · Der Laden

Kaufen und verkaufen aus der Bibliothek: Gold heraus, Gegenstand hinein,
ohne Handarbeit in zwei Reitern. Die Spielleitung stellt zusammen, was
ein Ort führt, und zu welchem Preis er kauft — der übliche halbe.

Nach Stufe 5, weil beide dasselbe brauchen: Gegenstände von einer Seite
auf die andere schieben und das Gold dazu buchen.

## Stufe 7 · Traglast — je Abenteuer, von Haus aus **aus**

Die Gewichte stehen schon an den Gegenständen; es fehlt die Summe und
die Grenze. Aber Traglast ist Buchführung, und die meisten Runden wollen
sie nicht: deshalb eine Abenteueroption, und **standardmäßig aus**. Ist
sie aus, ändert sich nichts — kein Balken, keine Warnung, kein Feld.

Ist sie an, gilt die Variante aus dem Regelwerk:

| Ab | Was |
|---|---|
| Stärke × 2,5 kg | belastet — 3 m weniger Bewegung |
| Stärke × 5 kg | stark belastet — 6 m weniger, Nachteil auf Angriffe und Rettungswürfe |
| Stärke × 7,5 kg | mehr geht nicht |

**Failsafe:** Sie verbietet nichts. Sie zeigt, dass die Grenze
überschritten ist, und trägt den Zustand ein — was die Gruppe daraus
macht, ist ihre Sache. Ein Heldenbuch, das das Aufheben eines Seils
verweigert, wird ausgeschaltet.

---

## Reihenfolge, kurz begründet

**1 vor 2**, weil der Aufstieg dieselben Tabellen braucht, viel kleiner
ist und sich jede Stufe auszahlt statt einmal je Charakter. Und weil er
den Vorschaukasten erzwingt, der danach beide trägt.

**3, 4, 5, 6, 7 hängen an nichts** — sie stehen in der Reihenfolge, in
der sie an einem Abend fehlen. Wer anders spielt, zieht eine vor.
