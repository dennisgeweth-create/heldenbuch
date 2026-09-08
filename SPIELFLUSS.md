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

## Stufe 2 · Der Charakterassistent ✓

*Steht seit v4.9.* Bis dahin war „✶ Neuer Charakter" ein Formular mit fünf Feldern. Danach
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

**Failsafes, wie gebaut:**

- **Kein Knopf wird nur grau.** „Weiter“ trägt den Grund als Aufschrift:
  „Genau 2 Fertigkeiten — gewählt: 1.“ Unten steht die vollständige
  Liste dessen, was noch fehlt.
- **Die zwei Fertigkeiten des Hintergrunds sind gesperrt** und stehen mit
  „vom Hintergrund“ da. Eine davon noch einmal zu wählen würde einen
  Klassenplatz verschenken — es geht gar nicht erst.
- Ist die Zahl der Klasse erreicht, lässt sich keine weitere anklicken.
- Der Punktekauf zählt mit und wird rot, sobald 27 überschritten sind;
  aus dem Standardsatz kann jede Zahl nur so oft kommen, wie sie darin
  vorkommt.
- Die Vorschau steht **immer** da, nicht erst am Ende, und zeigt die
  Volksboni einzeln („17 (15 + 2)“).

**Zwei Wege hinein:** der Assistent führt durch die Regeln, „✎ Von
Hand“ fragt wie bisher nur nach fünf Feldern.

**Der ehrliche Haken war die Datenpflege**, und sie ist zur Hälfte
getan: neun Völker mit Untergruppen, zwölf Hintergründe und je Klasse
die Fertigkeitsliste, die Übungen, das Startgold und ein Paket. Was
fehlt, sind die **Texte** der Merkmale — angelegt werden sie mit Namen
und Quelle, gefüllt werden sie aus der Bibliothek der Gruppe.

## Stufe 3 · Proben auf Ansage ✓

„Alle einen Wurf auf Wahrnehmung." Heute: reihum fragen, Zahlen
sammeln, im Kopf vergleichen. Dabei liegt die Maschinerie schon da — der
Kampftracker sagt seit v4.8 in zwei Sekunden „du bist dran".

Die Spielleitung wählt Fertigkeit und Schwierigkeitsgrad, wahlweise
verdeckt. Bei jedem Spieler erscheint eine Zeile mit **seinem**
Modifikator; er trägt seinen Wurf ein. Die Spielleitung sieht eine
Liste: wer bestanden hat, wer nicht, wer noch fehlt.

*Steht seit v4.9.*

**Failsafes, wie gebaut:**

- **Eine Ansage verfällt nach einer Viertelstunde**, vom Server aus. Eine
  offene Probe, die niemand mehr beantwortet, blockiert den Tisch nicht.
- Es gibt **immer nur eine** je Abenteuer; die nächste löst die vorige ab.
- **Würfeln darf nur, wem der Bogen gehört** — der Server prüft es mit
  derselben Besitzregel wie beim Speichern. Sonst würfelte einer für
  alle.
- **Zweimal melden ersetzt sich selbst.** Ein Zahlendreher bleibt nicht
  als zweite Zeile stehen.
- Ein Wurf auf eine Ansage, die inzwischen abgelöst wurde, wird
  abgelehnt statt der neuen zugeschlagen.
- **Verdeckt** heißt wirklich verdeckt: der Schwierigkeitsgrad geht nicht
  an die Spieler, und niemand erfährt, ob er bestanden hat.

Der Modifikator kommt aus dem Bogen — mit Übung, Expertise und allem,
was daran hängt. Dafür rechnet `charWerte` jetzt alle achtzehn
Fertigkeiten statt nur die passive Wahrnehmung; die Zahl im Balken ist
dieselbe wie die im Bogen und keine nachgebaute.

Angesagt wird auch auf **Rettungswürfe**, nicht nur auf Fertigkeiten —
„alle einen KON-Rettungswurf“ ist am Tisch genauso häufig.

**Was sie nicht tut:** für den Spieler würfeln. Wer am Tisch sitzt,
würfelt mit der Hand; das Feld nimmt die Zahl.

## Stufe 4 · Konzentration ✓

*Steht seit v4.9.* Kein Tisch denkt daran, und niemand gibt es gern zu.

**Ob ein Zauber Konzentration verlangt, muss niemand eintragen:** es
steht in seiner Wirkungsdauer. „Konzentration, bis zu 1 Minute“ — die
Vorlagen der SRD tragen es alle. Damit gilt es rückwirkend für jeden
Zauber, der schon im Bogen steht.

Was daraus folgt, steht an den vier Stellen, an denen es am Tisch
vergessen wird:

- **Wer wirkt, hält.** Das Zugfenster trägt es in den Bogen ein — und
  wenn schon etwas gehalten wurde, steht im Protokoll, dass es endet.
  Zwei gleichzeitig gibt es nicht.
- **Wer Schaden nimmt, muss halten können.** Im Protokoll steht die
  Zeile mit dem richtigen Schwierigkeitsgrad: die Hälfte des Schadens,
  mindestens 10. Das ist die Zahl, die am Tisch am häufigsten falsch
  geraten wird. Sie steht bei jedem Schaden — aus dem Zugfenster, von
  der Karte, aus dem Bogen.
- **Wer umfällt, hält nichts mehr.** Dafür gibt es keinen Rettungswurf.
- **Der Bogen zeigt es an**, mit einem Knopf zum Beenden.

**Was es nicht tut:** den Rettungswurf würfeln oder entscheiden, ob er
gelang. Es erinnert und nennt die Zahl; gewürfelt wird mit der Hand.

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
