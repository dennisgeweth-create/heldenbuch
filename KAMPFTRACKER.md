# ⚔ Der Kampftracker — Übersicht für eine KI

Dieses Blatt ist dafür gedacht, einer KI (ChatGPT o. ä.) vorgelegt zu
werden, damit sie einen laufenden Kampf mitlesen und Vorschläge für die
Kreaturen machen kann. Es erklärt, **was der Tracker führt, was er
ausgibt, und was er ausdrücklich nicht weiß**.

Der letzte Punkt ist der wichtigste. Eine KI, die glaubt, sie kenne
Stellungen und Entfernungen, gibt Ratschläge, die am Tisch nicht
umsetzbar sind.

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

**Ein Schalter im Protokoll heißt „mit Zahlen".** Ist er aus, fehlen die
Trefferpunktstände (`· 12 → 3`) — dann sieht die KI, *dass* Schaden
gefallen ist, aber nicht, wie es der Figur geht. Für eine Analyse sollte
er **an** sein.

---

## Was NICHT im Protokoll steht

Das ist der Teil, den eine KI von sich aus nicht wissen kann und den sie
auch nicht erraten soll.

- **Keine Stellungen, keine Entfernungen, keine Karte.** Der Tracker
  führt eine Initiativliste, kein Raster. Wer neben wem steht, ob eine
  Kugel drei Ziele erwischt, ob jemand in Reichweite ist — davon weiß er
  nichts. **Vorschläge zu Bewegung, Deckung, Flankieren oder
  Flächenzaubern brauchen die Spielleitung als Quelle.**
- **Keine Werteblöcke der Gegner.** Angriffe, Zauber, Resistenzen,
  legendäre Aktionen einer Kreatur stehen in der Gegnersammlung, nicht
  im Protokoll. Wer Vorschläge für eine Kreatur will, muss ihr Blatt
  mitgeben.
- **Kein aktueller Gesamtstand.** Das Protokoll ist ein Verlauf. Wer
  jetzt wie viele Trefferpunkte hat, lässt sich daraus zwar
  zusammenrechnen, steht aber nirgends als Liste. Bei einem langen Kampf
  ist es sicherer, den Stand kurz dazuzuschreiben.
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

WAS DU NICHT HAST
Es gibt keine Karte und keine Entfernungen. Frag nach Stellung und
Reichweite, statt sie anzunehmen. Wenn ein Vorschlag von der Stellung
abhängt, sag das dazu, statt eine zu erfinden.

WAS ICH WILL
- Für jede Kreatur, die als Nächstes dran ist: ein bis drei Züge zur
  Wahl, jeder mit einem Satz Begründung.
- Was die Kreatur an dieser Stelle plausibel TUT — nach ihrer
  Intelligenz und ihrem Wesen, nicht nach dem, was optimal wäre. Ein
  Goblin flieht, ein Golem nicht.
- Wenn ein Spieler etwas angesagt hat, worauf die Kreatur reagieren
  könnte: nenn es.
- Nenn Rettungswürfe und Schwierigkeitsgrade, die ich brauchen werde.

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

**Nur mit zusätzlicher Angabe:**

- Alles, was von Stellung, Reichweite oder Sichtlinie abhängt.
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

Die Spieler sehen im Heldenbuch eine andere Fassung: Reihenfolge, wer am
Zug ist, und wie es den Figuren ungefähr geht — nie die Zahlen der
Gegner.
