# ⚔ Der Kampftracker — Übersicht für eine KI

Dieses Blatt ist dafür gedacht, einer KI (ChatGPT o. ä.) vorgelegt zu
werden, damit sie einen laufenden Kampf mitlesen und Vorschläge für die
Kreaturen machen kann. Es erklärt, **was der Tracker führt, was er
ausgibt, und was er ausdrücklich nicht weiß**.

Der letzte Punkt ist der wichtigste. Eine KI, die glaubt, sie kenne
Stellungen und Entfernungen, gibt Ratschläge, die am Tisch nicht
umsetzbar sind.

Es geht auch in die andere Richtung: der Abschnitt *„Eine Karte
schreiben, die der Tracker einliest"* beschreibt das Format so genau,
dass eine KI aus dem Bild eines Bodenplans einen Block schreiben kann,
den die Spielleitung direkt einfügt.

---

## Kurz: der Ablauf

Ein Kampf hat zwei Zustände.

**Vorbereitung.** Die Reihe steht, aber niemand ist am Zug. Gegner
kommen dazu, die Spieler sagen ihre Initiative an. Wer noch keine Zahl
hat, steht unten.

**Laufend.** Reihum, absteigend nach Initiative. Ist der letzte durch,
beginnt die nächste Runde. Dazwischen kann jemand **einschieben** — für
legendäre Aktionen, Reaktionen, alles, was nicht auf seinen Zug wartet;
der Unterbrochene bleibt „am Zug" und ist danach wieder dran.

Die Spieler **sagen an**, was sie vorhaben (Aktion · Bonusaktion ·
Reaktion, mit Ziel und Zauberrang). Die Spielleitung sieht diese Ansagen
und trägt dann ein, was daraus wurde.

**Gewürfelt wird am Tisch, nicht im Programm.** Der Tracker rechnet
nichts aus und entscheidet nichts. Er hält fest, was passiert ist, und
schreibt die Trefferpunkte in die Bögen.

**Dazu kann eine Karte kommen** — ein Raster, auf dem Figuren und
Gelände stehen. Sie ist freiwillig: ein Kampf ohne Karte läuft genau wie
vorher. Steht eine, bewegt sich vieles von dem, was unten unter
*„Was NICHT im Protokoll steht"* aufgezählt ist, auf die andere Seite.

---

## Was der Tracker je Figur führt

| Feld | gilt für | Bedeutung |
|---|---|---|
| `name` | alle | angezeigter Name, bei mehreren durchnummeriert („Goblin 1") |
| `art` | alle | `held` oder `gegner` |
| `ini` | alle | Initiative. `null` = noch nicht angesagt |
| `hp` / `hpMax` | alle | aktuelle und höchste Trefferpunkte |
| `tempHp` | alle | temporäre Trefferpunkte |
| `ac` | alle | Rüstungsklasse |
| `zustaende` | alle | Liste aus der festen Liste unten |
| `erschoepfung` | alle | 0–6 |
| `vorteil` / `nachteil` | alle | Marke für den nächsten Wurf |
| `deathSaves` | nur Helden | Todesrettungswürfe, Erfolge und Fehlschläge |
| `notiz` | alle | freier Text der Spielleitung |
| `nothelfer` | nur Gegner | aus dem Stegreif angelegt, ohne Eintrag in der Sammlung |

**Zustände** sind eine feste Liste, damit „Liegend" bei allen gleich
heißt:

> Geblendet · Betäubt · Bezaubert · Erschöpft · Verängstigt · Gepackt ·
> Handlungsunfähig · Unsichtbar · Gelähmt · Versteinert · Vergiftet ·
> Liegend · Festgesetzt · Bewusstlos · Taub

**Die Trefferpunkte der Helden liegen im Bogen, nicht im Kampf.** Was im
Tracker eingetragen wird, steht sofort im Charakterbogen — es gibt kein
Übertragen am Ende.

**Wo eine Figur steht, führt die Karte** und nicht die Figur. Sie hält
je Figur nur drei Dinge: Spalte, Zeile und ein Kürzel aus zwei Zeichen.
Wer im Kampf steht, steht in der Reihe oben — eine Karte mit eigener
Figurenliste ginge beim ersten gelöschten Gegner auseinander. Deshalb
legt auch der Import niemanden an.

---

## Was die KI bekommt: das Protokoll

Im Tracker steht **📜 Protokoll**, und darin ein Knopf, der den ganzen
Verlauf als Text in die Zwischenablage legt. Das ist der Text, der
eingefügt wird. Er sieht so aus:

```
⚔ Überfall an der Furt
14.9.2026, 20:41

── Runde 1 ──────────────────────
⚔ Brunhilde beginnt
▸ Brunhilde ist am Zug
   Angriff: Kriegshammer
   Kriegshammer → Goblin 2: Treffer (18 gegen RK 15)
   Goblin 2 nimmt 9 Schaden · 12 → 3
▸ Goblin 1 ist am Zug
   Goblin 1 → Halgrim: daneben (11 gegen RK 17)
▸ Halgrim ist am Zug
   Zauber: Feuerball · 3. Grad
   Zauberplatz 3. Grad abgehakt
   Feuerball → Goblin 1: Rettungswurf GES misslungen (9 gegen SG 15)
   Goblin 1 nimmt 24 Schaden · 14 → 0
   Goblin 1 ist kampfunfähig
   ⚡ Halgrim hält „Bannstrahl" — Konstitutions-Rettungswurf gegen SG 12

── Runde 2 ──────────────────────
   ⚡ Der Hauptmann kommt dazwischen
   Brunhilde ist Verängstigt
```

### Die Zeilenarten

Eingerückte Zeilen gehören zum Zug darüber.

| Zeile | heißt |
|---|---|
| `⚔ … beginnt` | der Kampf startet, diese Figur hat die höchste Initiative |
| `▸ … ist am Zug` | Zugwechsel |
| `⚡ … kommt dazwischen` | eingeschoben; der Unterbrochene ist danach wieder dran |
| `… zieht B3 → E4 · 3 Felder (4,5 m)` | Bewegung auf der Karte, diagonal zählt eins. Ältere Verläufe haben die Meter noch nicht |
| `… steigt auf 12 m über G2 (von 0 m)` | Höhenwechsel — abheben, landen, klettern. `sinkt auf` in die andere Richtung |
| `Angriff:` / `Zauber:` / `Gegenstand:` / `Merkmal:` | was angesagt bzw. eingetragen wurde, ggf. mit Rang und Würfel |
| `… → Ziel: Treffer (18 gegen RK 15)` | Angriffswurf gegen ein Ziel |
| `… → Ziel: Rettungswurf GES misslungen (9 gegen SG 15)` | Rettungswurf |
| `… nimmt N Schaden · 12 → 3` | Schaden, davor und danach. Mehrere Arten stehen aufgeschlüsselt |
| `— Resistenz` am Ende | der Schaden war schon halbiert |
| `… ist immun gegen …` | nichts angekommen |
| `… wird um N geheilt · 3 → 14` | Heilung |
| `+N temporäre Trefferpunkte` | temporäre TP |
| `Zauberplatz N. Grad abgehakt` | ein Platz ist weg |
| `⚡ … hält „X" — Konstitutions-Rettungswurf gegen SG N` | **Erinnerung**, nicht das Ergebnis. Gewürfelt wird am Tisch |
| `⚡ … hält jetzt „X"` / `„X" endet` | Konzentration beginnt bzw. endet |
| `… verbraucht · noch N` | ein Gegenstand ist aufgebraucht |
| `… ist kampfunfähig` / `ist wieder auf den Beinen` | auf 0 TP bzw. wieder darüber |
| `… ist Verängstigt` / `ist nicht mehr Verängstigt` | Zustand an oder aus |
| `… hat Vorteil` / `hat keinen Nachteil mehr` | Marke |
| `… : Erschöpfung N` | Erschöpfungsstufe |
| `… : Todesrettungswürfe 2✓ 1✗ — stabilisiert` | Todesrettungswürfe |
| `+ Name (14 TP, RK 15)` | jemand kommt dazu |
| `− Name verlässt den Kampf` | jemand geht raus |
| `„…"` in Anführungszeichen | freier Text der Spielleitung |

**Zwei Schalter stehen über dem Protokoll.** Für eine Analyse sollten
beide **an** sein.

- **Trefferpunkte.** Aus fehlen die Stände (`· 12 → 3`) — dann sieht die
  KI, *dass* Schaden gefallen ist, aber nicht, wie es der Figur geht.
- **Karte.** Aus fehlen die Kartenblöcke, die unten beschrieben sind.

### Die Karte im Verlauf

Führt die Spielleitung eine Karte, steht am Ende jeder Runde, wie das
Feld danach aussah — und ganz am Schluss unter `── Jetzt ──`, wie es
gerade steht. Eine Runde, in der sich nichts bewegt und nichts gemalt
wurde, legt keine zweite Aufnahme an.

```
── Ende der Runde 1 ───────────────

🗺 KARTE  8 × 5  ·  1 Feld = 1,5 m

    A  B  C  D  E  F  G  H
  1 .  .  #  #  #  .  .  .
  2 .  Br #  .  .  .  g1 .
  3 .  .  #  .  .  T  T  .
  4 Th .  .  .  ~  ~  .  .
  5 .  .  .  .  .  .  .  g2

FIGUREN
  Br  Brunhilde          Held     B2  22/30 TP
  Th  Thalia             Held     A4  18/18 TP
  g1  Goblin 1           Gegner   G2  4/7 TP · liegend
  Dr  Blauer Drache      Gegner   H5  124/244 TP · Höhe 12 m

GELÄNDE
  #  Wand       Bewegung blockiert, Sicht blockiert
  T  Baum       Bewegung blockiert, Sicht blockiert
  ~  Wasser     Bewegung schwierig

ENTFERNUNGEN (Felder, diagonal zählt eins, Höhe zählt mit)
  Br → g1  5   Br → Dr  8
  Th → g1  6   Th → Dr  8

SICHT (Näherung: Linie Mitte zu Mitte, keine Deckungsgrade —
       im Zweifel entscheidet die Spielleitung)
  Br → g1  Wand auf C2
  Br → Dr  Wand auf C2 — aber Dr 12 m hoch: darüber hinweg entscheidet die Spielleitung
  Th → g1  Wand auf C3
```

Was darin gilt:

- **Spalten A, B, C … Z, dann AA**; Zeilen ab 1. `B2` ist Spalte B,
  Zeile 2.
- **Ein Feld = 1,5 m (5 Fuß)**, sofern die Kopfzeile nichts anderes
  sagt. Reichweiten in Metern also durch 1,5 teilen.
- **Diagonal zählt eins.** Die Entfernungstafel rechnet schon so; wer
  selbst nachzählt, muss es auch so tun.
- **Gelände blockiert oder nicht** — die Tafel sagt es je Zeichen. Die
  Karte kennt keine Höhe, keine halbe Deckung, keinen Untergrund: was
  nicht in der Geländetafel steht, weiß sie nicht.
- **Höhe.** Steht bei einer Figur `Höhe 12 m`, ist sie so weit über dem
  Boden — der Drache, der fliegende Vampir, die Spinne an der Wand.
  Steht nichts dabei, steht sie auf dem Boden. **Die Höhe zählt in der
  Entfernung mit**, als dritte Achse und in Feldern gerechnet: zwölf
  Meter sind acht Felder, und ein Drache senkrecht über einem Kämpfer
  ist acht Felder weit weg. Die Tafelüberschrift sagt es, sobald jemand
  in der Luft ist.
- **Das Gelände hat keine Höhe.** Ob ein Drache in zwölf Metern über die
  Wand hinwegsieht, kann die Karte nicht sagen — sie kennt die Höhe der
  Wand nicht. Sie sagt deshalb, dass die Frage besteht, und überlässt
  die Antwort der Spielleitung. Rechne nicht selbst nach: eine Höhe
  bedeutet nicht automatisch freie Sicht.
- **Die Entfernungstafel steht nur zwischen den Seiten** — Held gegen
  Gegner. Held zu Held und Gegner zu Gegner muss man abzählen.
- **Die Sichttafel nennt nur, wo etwas dazwischensteht.** Ein Paar, das
  dort nicht auftaucht, sieht sich. Steht nirgends etwas, sagt die
  Tafel das in einer Zeile.
- **Sicht ist eine Näherung, kein Regelentscheid.** Gerechnet wird eine
  Linie von Feldmitte zu Feldmitte; Start- und Zielfeld zählen nicht
  mit. Das Grundregelwerk prüft von Ecke zu Ecke und kennt Deckung in
  Stufen — halb, drei viertel, ganz. Davon steht hier nichts.
  **Deckungsgrade und Grenzfälle entscheidet die Spielleitung.**

Denselben Block liest der Tracker auch wieder ein — wie er dafür
aussehen muss, steht im nächsten Abschnitt.

---

## Eine Karte schreiben, die der Tracker einliest

Der Textblock geht **in beide Richtungen**. Was oben steht, gibt der
Tracker aus — und denselben Block liest er auch wieder ein. Damit kann
eine KI eine Karte *herstellen*: aus dem Bild eines Bodenplans, aus
einer Beschreibung, oder indem sie eine bestehende Karte abändert.

Die Spielleitung fügt das Ergebnis im Kampftracker unter **🗺 Karte** in
das Feld **„Karte als Text einfügen"** ein (bei einer bestehenden Karte
heißt es „Andere Karte einfügen"). Die Größe muss vorher nicht
eingestellt werden — sie ergibt sich aus dem Block.

### Das Mindeste: nur das Raster

```
    A  B  C  D  E  F  G  H
 1  .  .  #  #  #  .  .  .
 2  .  .  #  .  /  .  .  .
 3  .  .  #  #  #  .  ~  ~
```

Das ist eine vollständige Karte: 8 Spalten, 3 Zeilen.

### Die Zeichen — genau diese sieben

| | | Bewegung | Sicht |
|---|---|---|---|
| `.` | Boden | frei | frei |
| `#` | Wand oder Fels | blockiert | blockiert |
| `T` | Baum oder Säule | blockiert | blockiert |
| `~` | Wasser | schwierig | frei |
| `+` | Tür zu | blockiert | blockiert |
| `/` | Tür offen | frei | frei |
| `x` | Gefahr (Feuer, Dornen) | frei | frei |

Andere Zeichen gibt es nicht. Ein fremdes Sonderzeichen wird zu Boden,
und der Tracker sagt dazu, welches er nicht kannte.

### Die Regeln

- **Ein Zeichen je Feld, durch Leerzeichen getrennt.** Wie viele
  Leerzeichen, ist gleich — zerlegt wird an Leerraum, nicht nach
  Spaltenbreite.
- **Spalten von links:** A, B, C … Z, dann AA, AB … Zeilen von oben,
  ab 1. `B2` ist Spalte B, Zeile 2.
- **Ein Feld ist 1,5 m (5 Fuß).** Nach diesem Maß wird ein Bodenplan
  abgeschätzt.
- **Höchstens 40 Spalten und 30 Zeilen.** Was darüber steht, wird
  abgeschnitten, und der Tracker sagt es.
- **Die Kopfzeile mit den Buchstaben und die Zeilennummern sind
  freiwillig.** Sie werden erkannt und übersprungen. Ein Block ganz ohne
  sie wird genauso gelesen.
- **Zeilen dürfen unterschiedlich lang sein.** Kürzere werden mit Boden
  aufgefüllt, und der Tracker sagt, wie viele es waren.

### Was der Leser überspringt

Er sucht das Raster und lässt alles andere liegen. Übersprungen werden:
eine Zeile, die mit `🗺` oder `KARTE` beginnt; die Kopfzeile aus
Buchstaben; Zeilennummern am Zeilenanfang; leere Zeilen. Ab einer Zeile
`FIGUREN`, `GELÄNDE`, `ENTFERNUNGEN` oder `SICHT` sucht er kein Raster
mehr.

**Eine Zeile gilt als Rasterzeile, wenn** sie mindestens zwei Felder
hat, **kein** Feld länger als zwei Zeichen ist, und mindestens ein
bekanntes Geländezeichen darin vorkommt. Reiner Fließtext ist damit
sicher: „Die Tür ist zu" enthält Wörter mit mehr als zwei Buchstaben und
wird nicht für ein Raster gehalten.

### Figuren mitschicken — geht, aber mit einer Regel

Für eine Karte aus einem **Bild** gilt: **nur Gelände, keine Figuren.**
Wer auf dem Plan steht, weiß die KI nicht, und geratene Figuren stehen
falsch.

Wenn Figuren doch mitsollen — etwa weil eine ausgegebene Karte
zurückgespielt oder abgeändert wird —, gehen sie so:

```
    A  B  C  D  E  F  G  H
 1  .  .  #  #  #  .  .  .
 2  .  Br #  .  .  .  g1 .
 3  .  .  #  .  .  T  T  .

FIGUREN
  Br  Brunhilde
  g1  Goblin 1
```

Im Raster steht das **Kürzel** (höchstens zwei Zeichen) statt des
Geländes; der Boden darunter bleibt Boden. Der `FIGUREN`-Block sagt,
welcher Name zu welchem Kürzel gehört — zwei oder mehr Leerzeichen
zwischen Kürzel und Namen.

### Höhe

Steht in der Zeile einer Figur irgendwo **`Höhe N m`**, wird sie
übernommen. Sonst steht die Figur auf dem Boden.

```
FIGUREN
  Ar  Armin              Held     D5   32/38 TP
  Dr  Blauer Drache      Gegner   H8   124/244 TP · Höhe 12 m
```

- **Meter, nicht Fuß.** Das Heldenbuch rechnet durchgehend metrisch —
  ein Feld ist 1,5 m. Ein Werteblock mit `fly 80 ft.` wird also
  umgerechnet: 40 ft sind 12 m.
- **Komma oder Punkt** geht beides: `Höhe 4,5 m` und `Höhe 4.5 m`.
  Auch `Hoehe` ohne Umlaut wird gelesen. Die Einheit muss aber `m`
  sein — `Höhe 40 ft` wird bewusst *nicht* übernommen, sonst würden
  vierzig Fuß als vierzig Meter dastehen.
- **Nur wer nicht am Boden steht**, trägt die Angabe. `Höhe 0 m` bei
  sieben von acht Figuren wäre eine Spalte Nullen.
- Die Angabe darf irgendwo in der Zeile stehen, auch zwischen anderen
  Angaben. Was sonst noch in der Zeile steht, ist egal.

**Der Import legt niemanden an.** Er ordnet die Kürzel den Figuren zu,
die schon im Kampf stehen, gesucht über den Namen (Groß- und
Kleinschreibung egal, Namensanfang genügt). Wer nicht in der Reihe
steht, wird nicht gesetzt, und der Tracker sagt, welches Kürzel offen
blieb.

### Was der Tracker meldet

Nach dem Einfügen steht da, was gelesen wurde — `8 × 3 Felder gelesen,
2 Figuren gesetzt` — und dazu jede Warnung: abgeschnittene Zeilen,
aufgefüllte Zeilen, unbekannte Zeichen, nicht zugeordnete Kürzel.
**Kommt gar kein Raster vor, passiert nichts**, und es steht „Kein
Raster gefunden."

### Die Anweisung zum Weitergeben

Genau dieser Text steht auch neben dem Einfügefeld im Tracker. Er wird
der KI zusammen mit dem Bild des Bodenplans vorgelegt:

```
Du bekommst das Bild einer Kampfkarte. Schreib daraus einen Textblock
in genau diesem Format:

      A  B  C  D  E  F  G  H
  1   .  .  #  #  #  .  .  .
  2   .  .  #  .  /  .  .  .
  3   .  .  #  #  #  .  ~  ~

Regeln:
- Ein Zeichen je Feld, durch Leerzeichen getrennt.
- Spalten von links: A, B, C … Z, dann AA, AB …
- Zeilen von oben, ab 1.
- Erlaubt sind genau diese Zeichen:
    .  Boden          #  Wand oder Fels    T  Baum oder Säule
    ~  Wasser         +  Tür zu            /  Tür offen
    x  Gefahr (Feuer, Dornen)
- Ein Feld ist 1,5 m (5 Fuß). Schätz die Größe danach ab.
- Höchstens 40 Spalten und 30 Zeilen.
- Zeichne keine Figuren ein — nur das Gelände.
- Schreib nichts dazu, keine Erklärung, keinen Kommentar.
```

Der letzte Punkt ist der wichtigste: **kein Vorwort, kein Nachwort.**
Der Leser ist zwar großzügig und überspringt, was er nicht braucht —
aber ein Satz wie „Hier ist deine Karte:" ist eine Fehlerquelle
umsonst.

---

## Was NICHT im Protokoll steht

Das ist der Teil, den eine KI von sich aus nicht wissen kann und den sie
auch nicht erraten soll.

- **Stellungen nur, wenn eine Karte geführt wird.** Steht kein
  Kartenblock im Text, führt der Tracker nur eine Initiativliste: wer
  neben wem steht, ob eine Kugel drei Ziele erwischt, ob jemand in
  Reichweite ist, weiß er dann nicht. **Vorschläge zu Bewegung, Deckung,
  Flankieren oder Flächenzaubern brauchen dann die Spielleitung als
  Quelle.** Steht eine Karte da, gilt sie — aber nur so weit, wie oben
  beschrieben.
- **Keine Werteblöcke der Gegner.** Angriffe, Zauber, Resistenzen,
  legendäre Aktionen einer Kreatur stehen in der Gegnersammlung, nicht
  im Protokoll. Wer Vorschläge für eine Kreatur will, muss ihr Blatt
  mitgeben.
- **Kein aktueller Gesamtstand — außer die Karte liefert ihn.** Das
  Protokoll ist ein Verlauf; wer jetzt wie viele Trefferpunkte hat,
  lässt sich daraus zwar zusammenrechnen, steht aber nirgends als
  Liste. Wird eine Karte geführt, ist die Figurentafel der letzten
  Aufnahme genau diese Liste. Ohne Karte ist es bei einem langen Kampf
  sicherer, den Stand kurz dazuzuschreiben.
- **Nichts, was nicht eingetragen wurde.** Was am Tisch nur gesagt
  wurde, steht nicht drin.

---

## Vorlage: was der Spielleitung an die KI schickt

```
Du analysierst einen laufenden D&D-5e-Kampf und schlägst Züge für die
Kreaturen vor, die ich leite.

WAS DU BEKOMMST
1. Das Protokoll aus meinem Kampftracker (Verlaufstext, Zeilenarten
   siehe unten).
2. Die Werteblöcke der Kreaturen, für die du Vorschläge machst.
3. Den aktuellen Stand, falls ich ihn dazuschreibe.

WAS ZUR STELLUNG GILT
Steht im Protokoll ein Block „🗺 KARTE", ist das die Stellung: Raster
mit Spalten A, B, C … und Zeilen ab 1, ein Feld 1,5 m, diagonal zählt
eins. Die Geländetafel sagt, was Bewegung oder Sicht blockiert; die
Sichttafel nennt die Paare, zwischen denen etwas steht — wer dort nicht
steht, sieht sich. Rechne damit, aber nur damit: die Sicht ist eine
Näherung von Feldmitte zu Feldmitte, und Höhe, Deckungsgrade und
Grenzfälle entscheide ich.

Steht kein solcher Block da, gibt es keine Stellung und keine
Entfernungen. Frag danach, statt sie anzunehmen. Wenn ein Vorschlag von
der Stellung abhängt, sag das dazu, statt eine zu erfinden.

WAS ICH WILL
- Für jede Kreatur, die als Nächstes dran ist: ein bis drei Züge zur
  Wahl, jeder mit einem Satz Begründung.
- Was die Kreatur an dieser Stelle plausibel TUT — nach ihrer
  Intelligenz und ihrem Wesen, nicht nach dem, was optimal wäre. Ein
  Goblin flieht, ein Golem nicht.
- Wenn ein Spieler etwas angesagt hat, worauf die Kreatur reagieren
  könnte: nenn es.
- Nenn Rettungswürfe und Schwierigkeitsgrade, die ich brauchen werde.

WENN ICH DICH UM EINE KARTE BITTE
Ich lege dir dann ein Bild eines Bodenplans vor. Schreib den Textblock
in genau dem Format, das im Abschnitt „Eine Karte schreiben" steht —
nur das Gelände, keine Figuren, kein Vorwort, kein Nachwort.

WAS DU NICHT TUST
Nicht würfeln. Nicht entscheiden. Keine Zahlen erfinden, die nicht im
Werteblock stehen.
```

Danach das Protokoll einfügen, die Werteblöcke, und — bei langen
Kämpfen — zwei Zeilen Stand:

```
Stand jetzt:
Brunhilde 31/44 TP, Halgrim 12/28 TP (Konzentration auf Bannstrahl),
Goblin 1 kampfunfähig, Goblin 2 3/12 TP, Hauptmann 40/52 TP, verängstigt.
Stellung: die Goblins am Wasser, der Hauptmann fünf Meter dahinter.
```

---

## Was die KI daraus tatsächlich beantworten kann

**Gut:**

- Wer hat wie viel Schaden gemacht und wo geht der Kampf hin.
- Welche Ressourcen sind weg — Zauberplätze, Gegenstände, Konzentration.
- Welche Zustände liegen an und was folgt daraus.
- Ob eine Kreatur nach ihrem Wesen kämpfen, fliehen oder verhandeln
  würde.
- Welche Rettungswürfe gleich fällig sind.

**Mit Karte zusätzlich gut:**

- Wer in Reichweite ist, wer wegziehen müsste, wohin es einen Schritt
  weit lohnt.
- Ob ein Flächenzauber mehrere trifft — abgezählt am Raster.
- Ob eine Wand oder ein Baum zwischen zwei Figuren steht.

**Nur mit zusätzlicher Angabe:**

- Ohne Karte alles, was von Stellung oder Reichweite abhängt.
- Deckungsgrade und Sicht-Grenzfälle, auch mit Karte.
- Alles, was aus dem Werteblock der Kreatur kommt.

**Gar nicht:**

- Würfeln. Der Tracker würfelt nur die Initiative der Gegner und deren
  Trefferpunkte beim Aufstellen; alles andere kommt vom Tisch.

---

## Ein Hinweis zur Fairness

Das Protokoll enthält die Zahlen der Gegner — Trefferpunkte,
Rüstungsklasse, was gewirkt hat und was nicht. Es ist für die
Spielleitung gedacht. Wer es einer KI gibt, gibt ihr die Sicht der
Spielleitung; das ist der Sinn der Sache, sollte aber nicht versehentlich
im Gruppenchat landen.

Dasselbe gilt für die Karte im Verlauf: sie zeigt **alle** Figuren, auch
die, die für die Runde verborgen sind. Der Verlauf gehört der
Spielleitung, und einer, der die Hälfte verschweigt, wäre hinterher
gelogen — aber er gehört damit auch nicht in den Gruppenchat.

Die Spieler sehen im Heldenbuch eine andere Fassung: Reihenfolge, wer am
Zug ist, und wie es den Figuren ungefähr geht — nie die Zahlen der
Gegner.
