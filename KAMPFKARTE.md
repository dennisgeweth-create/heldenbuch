# 🗺 Die Kampfkarte — Konzept

Der Kampftracker führt eine Reihenfolge, kein Feld. Wer neben wem steht,
ob der Feuerball drei Ziele erwischt, ob der Schurke aus dem Rücken
kommt — davon weiß er nichts, und deshalb steht in `KAMPFTRACKER.md`
der Satz, dass eine KI danach fragen muss, statt es anzunehmen.

Das soll sich ändern. Hier steht, wie.

---

## Was den Ausschlag gibt

Aus der Anforderung sind zwei Sätze wichtiger als alles andere:

> *„Das kann sehr rudimentär sein, da es ja auch zu jederzeit einfach
> kopierbar sein soll."*

**Kopierbar heißt Text.** Ein Bild lässt sich nicht in ChatGPT einfügen
und auch nicht in eine Notiz. Eine Karte, deren Ergebnis kein Text ist,
löst genau das Problem nicht, für das sie gebaut wird.

Und **rudimentär ist hier kein Zugeständnis, sondern die Bedingung.** Je
freier die Karte, desto schlechter lässt sie sich in Zeilen fassen. Eine
Fläche mit Zentimetergenauigkeit wäre schöner und für den Zweck
schlechter.

Daraus folgt fast alles Weitere: **ein Raster.** Es hat feste Felder,
feste Spaltennamen, und es lässt sich Zeile für Zeile hinschreiben.

---

## Vier Wege, und warum es der dritte wird

### 1 · Nur eine Entfernungstabelle

Keine Karte, nur „wer ist wie weit von wem". Die Spielleitung pflegt ein
paar Zahlen.

**Dafür:** in einem Nachmittag gebaut, perfekt kopierbar.
**Dagegen:** bei sechs Figuren sind das fünfzehn Zahlen, die von Hand
gepflegt werden wollen, und nach jeder Bewegung wieder. Das hält keine
Runde durch. Und Hindernisse lassen sich gar nicht abbilden.

### 2 · Zonen statt Raster

Benannte Bereiche und was an was grenzt: *Am Tor · Hinter der Mauer · Im
Wasser.* Figuren stehen in einer Zone, nicht auf einem Feld.

**Dafür:** sehr wenig Arbeit, sehr gut kopierbar, passt zu Runden, die
ohne Bodenplan spielen.
**Dagegen:** keine Entfernungen, keine Flächenzauber, kein „fünf Meter
weiter und ich bin dran". Es ist eine andere Art zu spielen, nicht eine
einfachere Karte.

*Bleibt als möglicher zweiter Modus im Hinterkopf — nicht als Ersatz.*

### 3 · Rasterkarte ⟵ **empfohlen**

Ein Gitter aus Feldern, je Feld ein Gelände und höchstens eine Figur.
Ein Feld ist 1,5 m (5 Fuß), wie im Regelwerk.

**Dafür:** Entfernungen ergeben sich von selbst. Flächenzauber lassen
sich abzählen. Hindernisse sind einfach Felder. Und der Text schreibt
sich fast von allein — ein Raster **ist** schon fast ASCII.
**Dagegen:** es braucht Platz. Bearbeitet wird am Schreibtisch oder auf
dem iPad, nie auf dem Telefon — damit ist das keine Einschränkung mehr.

### 4 · Bild mit Marken

Ein hochgeladener Bodenplan, Figuren als Marken darauf.

**Dafür:** sieht am besten aus.
**Dagegen:** das Ergebnis ist ein Bild. Nicht kopierbar im Sinne der
Anforderung, und deutlich mehr Arbeit.

*Aber:* als **Untergrund unter dem Raster** wird daraus später eine gute
Sache — das Bild fürs Auge, das Raster für den Text. Siehe Stufe 6.

---

## Wie die Karte aussieht

### Auf dem Schirm

Ein Feld im Tracker, aufklappbar wie das Protokoll. Links das Raster,
rechts die Ablage mit den Figuren, die noch nicht stehen.

- **Figur setzen:** Figur in der Ablage antippen, dann ein Feld. Ziehen
  geht auch.
- **Figur bewegen:** anfassen und auf ein anderes Feld ziehen. Beim
  Loslassen steht im Log, wie weit sie gezogen ist.
- **Gelände malen:** eine Geländeart wählen, dann über die Felder
  streichen. Noch einmal dieselbe Art auf dasselbe Feld löscht sie.
- **Wer am Zug ist, leuchtet.** Dieselbe Hervorhebung wie in der Liste.

### Als Text — das eigentliche Ergebnis

```
🗺 KARTE  16 × 12  ·  1 Feld = 1,5 m

    A B C D E F G H I J K L M N O P
 1  . . . # # # # . . . . . . . . .
 2  . . . # . . # . . ~ ~ . . T . .
 3  . Br. . . . + . . ~ ~ . . . . .
 4  . . Ha. . . # . g1. ~ . . . . .
 5  . . . . . . # . . g2. . . T . .
 6  . . . . . . # # # # # . . . . .

FIGUREN
  Br  Brunhilde        Held      B3   38/44 TP
  Ha  Halgrim          Held      C4   12/28 TP · Konzentration
  g1  Goblin 1         Gegner    I4    3/12 TP
  g2  Goblin 2         Gegner    J5   12/12 TP · Liegend

GELÄNDE
  #  Wand        blockiert Bewegung und Sicht
  +  Tür         zu — blockiert Bewegung und Sicht
  ~  Wasser      schwieriges Gelände
  T  Baum        blockiert Sicht

ENTFERNUNGEN (Felder, diagonal zählt eins)
  Br → g1  7      Ha → g1  6      Br → g2  8
```

Das ist der Block, der in die Zwischenablage geht und den eine KI ohne
weitere Erklärung lesen kann. Er beantwortet genau die Fragen, bei denen
`KAMPFTRACKER.md` bisher sagen muss: *frag die Spielleitung.*

---

## Derselbe Block auch hinein

Eine Karte von Hand zu malen dauert. Eine Karte, die schon existiert —
als Bild aus einem Abenteuerband, als Skizze, als Bodenplan — abzumalen
dauert länger.

**Also geht der Block auch rückwärts.** Die Spielleitung legt der KI das
Bild vor und die Anweisung dazu; die KI schreibt den Block; der Block
wird eingefügt, und die Karte steht.

Das ist kein zweites Format. **Was herauskommt, geht auch hinein** —
eine Karte lässt sich kopieren, weiterreichen, verändern und
zurückgeben. Ein Format, zwei Richtungen, und beide werden mit denselben
Prüfungen abgesichert.

Das Einfügefeld ist dasselbe, das die Beute und die Gegnerlisten schon
benutzen (`ListeEinfuegen` in `0-basis.jsx`), samt der Anweisung zum
Weitergeben — dieser Weg hat sich zweimal bewährt und wird nicht zum
dritten Mal neu erfunden.

### Was gelesen wird

Beim Lesen ist der Leser großzügig, beim Schreiben genau. Ein Block von
einer KI trifft das Format selten aufs Zeichen.

- **Ein Feld je Wortgruppe.** Die Zeilen werden an Leerräumen zerlegt,
  nicht nach Spaltenbreite abgezählt. `. . # ~ Br` liest sich genauso wie
  `.  .  #  ~  Br`.
- **Die Zeilennummer vorn darf fehlen** oder dastehen; beides geht.
- **Die Spaltenzeile darf fehlen.** Die Breite ergibt sich aus der
  längsten Zeile; kürzere Zeilen werden mit Boden aufgefüllt und das
  wird gemeldet.
- **Unbekannte Geländezeichen werden zu Boden** — mit einer Meldung,
  welche es waren. Lieber eine Karte mit einer Lücke als gar keine.
- **Die Figuren kommen über den Namen.** Im `FIGUREN`-Block steht
  `Br  Brunhilde`; gesucht wird der Teilnehmer, dessen Name dazu passt —
  mit derselben unscharfen Suche, die auch Beute und Gegner benutzen.
  Wer nicht gefunden wird, wird gemeldet und weggelassen. **Der Import
  legt keine Figuren an**; wer im Kampf stehen soll, steht in der
  Teilnehmerliste.

### Die Anweisung für die KI

Steht im Programm neben dem Einfügefeld, zum Kopieren — wie bei der
Beute. Sinngemäß:

```
Du bekommst das Bild einer Kampfkarte. Schreib daraus einen Textblock
in genau diesem Format:

    A  B  C  D  E  F  G  H
 1  .  .  #  #  #  .  .  .
 2  .  .  #  .  /  .  .  .
 3  .  .  #  #  #  .  ~  ~

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

Figuren bleiben ausdrücklich draußen: wer im Kampf steht, entscheidet
die Teilnehmerliste, und eine KI, die aus einem Bild „drei Goblins"
liest, legt sonst drei Figuren an, die es im Kampf nicht gibt.

---

## Was gespeichert wird

Die Karte hängt am Kampf und geht denselben Weg wie er — sie braucht
keine eigene Tabelle und keinen eigenen Abgleich.

```js
kampf.karte = {
  breite: 16, hoehe: 12,
  feldMeter: 1.5,
  // breite × hoehe Zeichen, zeilenweise. Ein String, kein Feld von
  // Feldern: er lässt sich vergleichen, kopieren und in einer Zeile
  // ansehen.
  gelaende: '...####.........' + '...#..#...~~..T.' + …,
  // Nur wer wirklich steht. Wer aus dem Kampf fliegt, verliert seinen
  // Platz von selbst — die Karte führt keine eigene Liste von Figuren.
  figuren: { 'held-7': {x:1, y:2, k:'Br'}, 'gob-3a': {x:8, y:3, k:'g1'} },
  // Was die Runde nicht sieht: der Meuchler auf dem Dach.
  verborgen: ['gob-9f'],
};
```

**Eine Regel, die den ganzen Bau zusammenhält: die Karte führt nur
Positionen.** Wer im Kampf steht, steht in `teilnehmer` — und nur dort.
Eine Karte, die eine zweite Liste von Figuren führte, ginge beim ersten
gelöschten Gegner auseinander.

**Größe:** ein 20×15-Raster sind 300 Zeichen Gelände plus eine Handvoll
Positionen. Die Grenze für einen Kampf liegt bei 300 KB
(`MAX_KAMPF_BYTES`) — das fällt nicht ins Gewicht, auch nicht mit einer
Aufnahme je Runde.

### Das Gelände — eine feste Liste

Genau wie die Zustände: fest, damit „Wand" bei allen dasselbe heißt und
im Text eindeutig bleibt.

| Zeichen | Name | Bewegung | Sicht |
|:--:|---|---|---|
| `.` | Boden | frei | frei |
| `#` | Wand, Fels | blockiert | blockiert |
| `T` | Baum, Säule | blockiert | blockiert |
| `~` | Wasser, Geröll | schwierig (doppelt) | frei |
| `+` | Tür (zu) | blockiert | blockiert |
| `/` | Tür (offen) | frei | frei |
| `x` | Gefahr — Feuer, Dornen | frei | frei |

Sieben Arten. Mehr wären hübscher und im Text schlechter zu lesen.

### Die Kürzel

Zwei Zeichen je Figur, einmal beim Setzen vergeben und dann fest:
Helden die ersten beiden Buchstaben (`Br`, `Ha`), Gegner der
Anfangsbuchstabe klein und eine Nummer (`g1`, `g2`). Bei Gleichstand
zählt eine Ziffer hoch. Fest vergeben, damit dieselbe Figur in Runde 1
und Runde 9 dasselbe Kürzel trägt — sonst wäre kein Protokoll lesbar.

---

## Entfernung und Sicht

**Entfernung** nach der Regel des Grundregelwerks: diagonal zählt wie
gerade, also die größere der beiden Differenzen. `Br(1,2) → g1(8,3)` = 7
Felder = 10,5 m.

Die Variante *5-10-5* (jede zweite Diagonale zählt doppelt) wäre eine
Zeile mehr und kann als Hausregel dazukommen. Nicht in der ersten
Fassung.

**Sicht** ist heikler. Eine Linie von Mitte zu Mitte durch die Felder zu
ziehen (Bresenham) ist zwanzig Zeilen und beantwortet „steht eine Wand
dazwischen" gut genug für den Tisch. Es ist **nicht** die Regel des
Grundregelwerks, die von Ecke zu Ecke prüft und Deckung in Stufen kennt.

Deshalb: Sicht kommt als **Stufe 5** und sagt im Text ausdrücklich, was
sie ist — eine Näherung, kein Regelentscheid. Wer das nicht will, lässt
sie aus; die Karte ist ohne sie vollständig benutzbar.

---

## Was ins Log kommt

Zwei neue Zeilenarten im Protokoll, in derselben Form wie die
bestehenden:

```
▸ Brunhilde ist am Zug
   zieht B3 → E4 · 3 Felder (4,5 m)
   Angriff: Kriegshammer
   Kriegshammer → Goblin 1: Treffer (18 gegen RK 15)
```

- `bewegung` — wer, von wo, nach wo, wie weit. Beim Ziehen einer Figur
  automatisch; kein zusätzlicher Griff.
- `karte` — eine Aufnahme des Rasters. Wird zu Beginn jeder Runde
  gesetzt, solange eine Karte existiert.

Die Aufnahme steht **nicht** im normalen Protokoll auf dem Schirm — dort
wäre sie sechs Zeilen Rauschen je Runde. Sie erscheint nur beim
Kopieren, und nur wenn der Schalter **„mit Karte"** an ist. Er steht
neben dem, der schon da ist („mit Zahlen").

Damit trägt der kopierte Verlauf die Karte, wie sie sich entwickelt hat
— und die KI kann sagen, warum ein Zug in Runde 3 anders aussah als in
Runde 6.

---

## Die Spieler

Die Karte gehört in die Kampfsicht, sonst nützt sie nur der
Spielleitung. Sie kommt dorthin **wie alles andere: über den Server, und
gefiltert.**

`kampfFuerSpieler()` in der `api.php` ist eine ausdrückliche Liste
dessen, was hinausgeht. Die Karte kommt dort dazu, mit zwei Regeln:

- **Verborgene Figuren fallen heraus** — nicht ihre Position, sondern
  sie selbst. Was nicht hinausgeht, lässt sich auch nicht in der Konsole
  finden.
- **Die Karte geht nur hinaus, wenn die Spielleitung sie zeigt.** Neben
  dem bestehenden Schalter „👁 Zeigen" steht ein zweiter für die Karte.
  Ein Tracker, der die Reihenfolge zeigt, muss nicht auch den Bodenplan
  zeigen.

Für die Spieler ist die Karte **nur zum Ansehen**. Wer seine Figur
bewegen will, sagt es an — das ist derselbe Weg wie bei allem anderen.

---

## Der Bauplan

### Stufe 1 · Die Rechnung ✓

`js/src/2c2-karte.jsx`, oberer Teil ohne React — damit er einzeln mit
`node` prüfbar ist, wie beim Fünfwalzengerüst.

- Raster anlegen, Größe ändern (Inhalt bleibt erhalten)
- Gelände lesen und setzen, Geländetafel
- Figuren setzen, bewegen, entfernen; ein Feld trägt höchstens eine
- Kürzel vergeben, eindeutig und stabil
- Entfernung zweier Felder, Feldname (`B3`) hin und her
- **Der Textblock** — das Ergebnis, an dem alles hängt
- **Und derselbe Block zurück:** der Leser, großzügig, mit Meldung, was
  er nicht verstanden hat

*Prüfungen:* Feldnamen über `Z` hinaus, Raster verkleinern mit Figuren
außerhalb, zwei Figuren auf ein Feld, Kürzel bei gleichen Namen,
Entfernung diagonal, der Textblock Zeichen für Zeichen — und die
Rundreise: was der Schreiber ausgibt, muss der Leser wieder einlesen und
dieselbe Karte ergeben.

### Stufe 2 · Das Feld im Tracker ✓

Aufklappbar wie das Protokoll. Raster zeichnen, Figuren setzen und
ziehen, Gelände malen, Ablage für die, die noch nicht stehen. Dazu das
**Einfügefeld** samt Anweisung zum Weitergeben — dasselbe Bauteil wie
bei Beute und Gegnerlisten.

Bearbeitet wird am Schreibtisch oder auf dem iPad. Das Raster darf
deshalb Platz nehmen: Felder von 34 Punkten, und wo es breiter wird als
der Kasten, rollt es in sich selbst statt zu schrumpfen.

**Die Größe gehört der Spielleitung.** Ein Flurgefecht braucht andere
Maße als eine Feldschlacht, und beides soll gehen:

- **Voreinstellung 16 × 12** — ein Raum mit Luft drumherum.
- **Frei einstellbar von 8 × 8 bis 40 × 30.** Darüber wird der Textblock
  breiter als jedes Fenster, in das man ihn einfügt; das ist die Grenze,
  und sie steht auch dabei.
- **Vier Vorlagen** für den schnellen Griff: *Kammer* 10 × 8, *Raum*
  16 × 12, *Halle* 24 × 18, *Freies Feld* 32 × 24.
- **Die Größe lässt sich jederzeit ändern**, auch mitten im Kampf.
  Gelände und Figuren bleiben stehen, wo sie waren. Wer verkleinert und
  dabei etwas abschneiden würde, bekommt es gesagt, bevor es passiert —
  eine Karte, die beim Verkleinern still zwei Gegner verliert, ist
  schlimmer als gar keine.
- **Wachsen in eine Richtung.** Am Rand des Rasters sitzt je eine kleine
  Taste, die eine Reihe oder Spalte anhängt. Wer merkt, dass der Kampf
  aus dem Raum hinausläuft, schiebt die Wand weiter, statt neu
  aufzubauen.

### Stufe 3 · Bewegung ins Log ✓

Die Zeile `zieht B3 → E4 · 3 Felder`, automatisch beim Loslassen. Dazu
die Aufnahme je Runde.

### Stufe 4 · Kopieren — halb

Der Knopf **🗺 Karte kopieren** steht schon am Feld: er kam mit Stufe 2,
weil ein Feld, in das man eine Karte einfügen kann und aus dem keine
herauskommt, seltsam ist.

**Es fehlt:** der Schalter „mit Karte" im Protokoll und die Aufnahme je
Runde. Damit trägt der kopierte Verlauf die Karte, wie sie sich
entwickelt hat.

### Stufe 5 · Sicht und Reichweite

Bresenham für „steht etwas dazwischen", und im Text eine Zeile je Paar,
wo es blockiert ist. Mit dem Hinweis, dass es eine Näherung ist.

Dazu die Anzeige beim Ziehen: wie weit ist es bis hierher, und ist der
Weg frei.

### Stufe 6 · Die Spielersicht

Karte in `kampfFuerSpieler()`, verborgene Figuren heraus, der zweite
Zeigen-Schalter, und die Anzeige in der Kampfsicht.

### Stufe 7 · Ein Bild darunter *(später, wenn überhaupt)*

Ein hochgeladener Bodenplan als Untergrund, das Raster halbdurchsichtig
darüber. Das Bild ist fürs Auge, das Raster bleibt die Wahrheit — der
Text ändert sich dadurch nicht. Die Bildablage von v5.1.1 kann das
schon; es fehlt nur das Ausrichten des Rasters auf das Bild, und das ist
die eigentliche Arbeit.

---

## Reihenfolge, kurz begründet

| Stufe | Warum hier |
|---|---|
| 1 Rechnung | Trägt alles; und der Textblock ist der Zweck, nicht das Beiwerk |
| 2 Feld | Ohne Bedienung ist die Rechnung nichts wert |
| 3 Log | Braucht Stufe 2, weil es an der Bewegung hängt |
| 4 Kopieren | **Hier ist die Anforderung erfüllt** — der Rest ist Komfort |
| 5 Sicht | Schön und heikel; deshalb nach dem, was sicher ist |
| 6 Spieler | Braucht eine Karte, die sich bewährt hat |
| 7 Bild | Ändert nichts am Text und kann deshalb ganz hinten stehen |

---

## Was ausdrücklich nicht gebaut wird

- **Kein Zeichnen mit der Maus.** Freie Linien lassen sich nicht in
  Zeilen fassen.
- **Kein Nebel des Krieges.** Was die Spielleitung nicht zeigen will,
  malt sie nicht — dafür gibt es den Schalter und die verborgenen
  Figuren.
- **Keine automatische Bewegung.** Der Tracker würfelt nicht und
  entscheidet nicht; er hält fest. Das gilt für die Karte genauso.
- **Keine Deckungsstufen nach Regelwerk.** Die Näherung sagt „etwas
  steht dazwischen", nicht „halbe Deckung, +2 RK". Das entscheidet der
  Tisch.
- **Keine Höhe.** Ein Raster ist flach. Wer auf dem Dach steht, steht in
  der Notiz.
- **Keine Bedienung auf dem Telefon.** Bearbeitet wird am Schreibtisch
  oder auf dem iPad. Ansehen geht überall — die Spielersicht ist ohnehin
  nur zum Lesen.

---

## Was das für `KAMPFTRACKER.md` bedeutet

Der Abschnitt *„Was NICHT im Protokoll steht"* verliert seinen ersten
und wichtigsten Punkt. Aus

> Keine Stellungen, keine Entfernungen, keine Karte. […] Vorschläge zu
> Bewegung, Deckung, Flankieren oder Flächenzaubern brauchen die
> Spielleitung als Quelle.

wird nach Stufe 4 eine Beschreibung des Kartenblocks — und die Vorlage
für die KI kann aufhören, nach der Stellung zu fragen. Genau darum geht
es.
