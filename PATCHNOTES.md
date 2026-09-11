# ⚔ Heldenbuch — Patchnotes

## v5.3

### 📋 Der Bogen als Text — zum Vorlegen an eine KI

Im DM-Modus steht oben im Bogen ein neuer Knopf: **📋 Als Text**. Er
macht ein Fenster auf, in dem der ganze Held als schlichter Text steht —
zum Kopieren und Einfügen in ein KI-Gespräch.

Der Kampftracker konnte das für den Kampf schon lange. Für den Helden
selbst hieß es bisher: abtippen, oder der KI erzählen, was man gerade im
Kopf hat. Und wer erzählt, vergisst — meist genau das Merkmal, um das es
gleich gehen wird.

**Alles ist fertig gerechnet.** Nicht „Lederrüstung, dazu Geschick +4,
dazu Kampfstil", sondern **Rüstungsklasse 16**. Angriff und Schaden
jeder Waffe stehen mit Übungsbonus und Attribut darin, und bei Finesse
steht dabei, welches Attribut gewonnen hat. Eine KI, die den Text
bekommt, muss nichts addieren — und kann sich also auch nicht verrechnen.

Drin ist:

| | |
|---|---|
| Volk, Klassen, Unterklassen, Hintergrund | mit Gesamtstufe |
| Kampfwerte | RK, TP, Initiative, Bewegung, passive Wahrnehmung, Zauber-SG |
| Attribute | mit Modifikator und Rettungswurf |
| **Alle achtzehn Fertigkeiten** | auch die ungeübten |
| Sprachen, Werkzeuge, Waffen, Rüstungen | was geübt ist |
| Waffen | Angriff, Schaden, Reichweite, Eigenschaften |
| Getragenes und Inventar | samt Beutel |
| Zauberplätze, Zauberpunkte, Ressourcen | was davon noch frei ist |
| Merkmale | mit dem, was sie bewirken |
| Zauber | nach Grad, mit Schule, Wirkzeit, Reichweite, Dauer |
| Vorteile und Nachteile | die stecken in keiner Zahl |

Die achtzehn Fertigkeiten stehen **vollständig** da, auch die, auf die
niemand geübt ist. Sonst bekäme die KI auf „wie gut schleicht er?" bei
den meisten Helden keine Antwort.

Ein Schalter im Fenster: **Beschreibungen und Notizen mitgeben.** An
bedeutet vollständig — die KI kennt dann jeden Zaubertext. Aus lässt nur
die Werte stehen, was bei vierzig Zaubern ein Vielfaches kürzer ist und
in einem schon langen Gespräch mehr Luft lässt. Wie lang der Text gerade
ist, steht unten links.

Er ist nebenbei auch für Menschen lesbar: wer keinen Zugang hat, bekommt
den Helden so trotzdem als Ganzes vorgelegt.

## v5.2.2

### 🎲 „Wie zuletzt" am Tisch

Am Roulette und beim Craps steht neben dem Hebel ein Knopf, der die
letzte Lage noch einmal aufbaut. Wer eine Serie spielt, legt sonst
Runde um Runde ein Dutzend Jetons einzeln.

**Roulette:** `↻ Wie zuletzt · 250` — der Betrag steht dabei, damit man
sieht, was es kostet, bevor man drückt. Reicht der Beutel nicht, wird
gar nichts gelegt; eine halbe Ansage ist eine andere Wette als die, die
man wiederholen wollte.

**Craps:** gelegt wird nur, was gerade fehlt. Eine Passe mit gesetztem
Punkt liegt ja noch und wird nicht verdoppelt — und neu angenommen
würde sie ohnehin nicht.

Blackjack und Poker haben keinen: dort bleibt der Einsatz stehen, wo man
ihn eingestellt hat. Da gibt es nichts zu wiederholen.

### 🩹 Ein Fenster, das nicht mehr auf den Schirm passte

Mit v5.2.1 merken sich die Fenster ihre Größe — aber ohne zu prüfen, ob
sie auf den Schirm passt, auf dem sie das nächste Mal aufgehen. Wer den
Roulettetisch am Schreibtisch groß gezogen hatte, bekam ihn auf dem iPad
in derselben Größe: der Fuß mit **Werfen** hing unter dem Bildschirmrand.

Jetzt wird die gemerkte Größe auf das geklemmt, was der Schirm hergibt.
Dazu rechnen die Fenster ihre Höhe in `dvh` statt `vh` — auf iPad und
iPhone ist `100vh` größer als das, was man sieht, und genau darum ging
der Fuß verloren.

## v5.2.1

### 🪟 Alle Fenster lassen sich ziehen

Bisher war genau eines in der Größe veränderbar — das Kartenfeld der
Spielleitung. Jetzt alle vier Arten: die beiden Karten, die Kampfsicht
der Runde, die Taverne und jedes Dialogfenster. Der Zipfel sitzt unten
rechts, und **die Größe wird gemerkt** wie die Stelle.

**Jedes hat eine Mindestgröße**, und die ist gemessen, nicht geraten —
es ist jeweils die Breite, unter der die engste Zeile des Inhalts
umbricht:

| | |
|---|---|
| Kampfsicht der Runde | 400 × 280 |
| Kartenfeld der Spielleitung | 440 × 300 |
| Karte der Runde | 300 × 120 |
| Dialogfenster | 320 × 160 |
| Taverne | die Breite des Tisches — schmaler ist er nicht gebaut |

Beim Einbauen fiel auf, dass die Kampfsicht am Minimum ihren Fuß
abgeschnitten hätte, samt dem Knopf zum Ansagen. Deshalb rollt jetzt
der Mittelteil, während Kopf und Fuß stehen bleiben: **kleiner ziehen
heißt rollen, nicht verlieren.** Der Erklärsatz am Fuß ist dabei nach
oben ins Rollende gewandert — er wird einmal gelesen und brauchte in
einem schmalen Fenster vier Zeilen.

Die Tische der Taverne lassen sich nur vergrößern. Ihr Filz ist auf
seine Breite gebaut; schmaler rücken Tafeln und Einsatzfelder
ineinander, und das wäre genau der Verlust, den die Mindestgröße
verhindern soll.

## v5.2

Der Kampftracker bekommt ein Feld. Bis hierher führte er eine
Reihenfolge und wusste alles darüber, wie es den Figuren geht — aber
nichts darüber, wo sie stehen. Wer neben wem steht, ob eine Kugel drei
Ziele erwischt, ob jemand in Reichweite ist: das lag außerhalb.

Den Ausschlag für die Bauart gab eine einzige Anforderung — **die Karte
soll jederzeit kopierbar sein.** Kopierbar heißt Text, und ein Raster
ist schon fast einer. Deshalb ist der Textblock hier nicht die Ausgabe
am Ende, sondern der Zweck.

```
🗺 KARTE  8 × 5  ·  1 Feld = 1,5 m

    A  B  C  D  E  F  G  H
  1 .  .  #  #  #  .  .  .
  2 .  Br #  .  .  .  g1 .
  3 .  .  #  .  .  T  T  .
  4 Th .  .  .  ~  ~  .  .
  5 .  .  .  .  .  .  .  g2
```

### 🗺 Das Feld

Sieben Geländearten — Boden, Wand, Baum, Wasser, Tür zu, Tür offen,
Gefahr. Jeder Pinsel trägt sein eigenes Zeichen und seine eigene Farbe,
damit man die Legende nicht auswendig können muss.

**„Erst wählen, dann tippen" statt Ziehen.** Das geht mit Maus und
Finger gleich gut, während Ziehen auf einem Tablet erfahrungsgemäß hakt.
Figur antippen nimmt sie auf, ein Feld setzt sie ab. Wer auf ein
besetztes Feld zieht, **tauscht** mit dem, der dort steht — das ist am
Tisch das, was gemeint ist, und verliert niemanden.

Jede Figur trägt zwei Zeichen, einmal vergeben und dann fest: Helden
groß (`Br`, `Th`), Gegner klein mit Nummer (`g1`, `g2`). Fest deshalb,
weil derselbe Gegner in Runde 1 und Runde 9 dasselbe Kürzel tragen muss
— sonst wäre kein Protokoll lesbar.

Die Größe lässt sich jederzeit ändern, vier Vorlagen von 10×8 bis 32×24
oder frei bis 40×30. Am Rand hängt je eine Taste, die eine Reihe oder
Spalte anfügt: wer merkt, dass der Kampf aus dem Raum hinausläuft,
schiebt die Wand weiter, statt neu aufzubauen. **Beim Verkleinern fragt
es vorher und sagt, wen es kostet** — eine Karte, die still zwei Gegner
verliert, ist schlimmer als gar keine.

### 🤖 Eine Karte aus einem Bild

Der Block geht in beide Richtungen. Neben dem Einfügefeld steht die
Anweisung für eine KI: Bodenplan hinlegen, Anweisung dazu, den Text
zurück ins Feld. Der Leser ist beim Lesen großzügig und beim Schreiben
genau — ein Block, den eine KI aus einem Bild geschrieben hat, trifft
das Format selten aufs Zeichen. Er erkennt Figuren an ihren Namen wieder
und ordnet sie den Teilnehmern zu; anlegen tut er niemanden.

### 📜 Was im Protokoll steht

Jede Bewegung schreibt sich selbst mit: `Brunhilde zieht A2 → B2 ·
1 Feld (1,5 m)`. Die Meter stehen dabei, weil Reichweiten in Metern
angegeben sind.

Über dem Protokoll steht ein zweiter Schalter, **Karte**. Ist er an,
trägt der kopierte Verlauf am Ende jeder Runde eine Aufnahme des Feldes,
und ganz zum Schluss, wie es gerade steht. Was sich nicht gerührt hat,
kommt nicht zweimal — verglichen wird Gelände und wer auf welchem Feld
steht; Trefferpunkte zählen nicht dazu, die stehen schon Zeile für Zeile
im Verlauf.

Damit trägt der Text, den man einer KI hinlegt, auch die Stellung. Ohne
sie war „zieht nach E4" nur eine Vokabel.

### 👁 Sicht und Reichweite

Die Entfernungstafel rechnet nach der Regel des Grundregelwerks:
diagonal zählt eins. Dazu eine Sichttafel, die nur die Paare nennt, bei
denen etwas dazwischensteht — alle aufzulisten wäre bei acht Figuren
eine Wand aus Zeilen, in der die drei wichtigen untergehen.

**Sie sagt selbst, was sie ist: eine Näherung.** Gerechnet wird eine
Linie von Feldmitte zu Feldmitte. Das Grundregelwerk prüft von Ecke zu
Ecke und kennt Deckung in Stufen — halb, drei viertel, ganz. Davon steht
hier nichts, und das darf auch eine KI nicht für einen Regelentscheid
halten. **Deckungsgrade entscheidet die Spielleitung.**

Beim Setzen misst eine Zeile mit:

```
G2 · 5 Felder · 7,5 m · Wand auf C2 im Blick · Weg versperrt: Wand auf C2
E4 · 1 Feld · 1,5 m · Sicht frei · 1 Feld schwierig
```

Sicht und Weg stehen getrennt, weil sie es sind: durch Wasser sieht man
und kommt langsamer voran, eine Wand tut beides. Der Weg ist die gerade
Strecke, keine Wegfindung — wer um die Wand herumläuft, geht weiter als
dort steht.

### 🙈 Was die Runde sieht

Zwei Schalter, und beide müssen an sein.

Der eine gilt der ganzen Karte. Er steht **aus**, bis jemand ihn umlegt:
eine Aufstellung, die vor dem Kampf schon steht, gehört niemandem außer
der Spielleitung, und ein Standard, der den Hinterhalt verrät, ist
keiner.

Der andere gilt einzelnen Figuren — der Hinterhalt, der Unsichtbare, der
Wolf, den noch keiner gesehen hat. Am Schalter oben steht dann, wie
viele es sind, damit niemand vergisst, dass er etwas versteckt hat.

**Verborgen heißt verborgen, nicht ausgegraut.** Die Figur wird
herausgenommen, bevor irgendetwas das Gerät verlässt — eine Marke, die
nur nicht gezeichnet wird, stünde trotzdem in der Antwort, und wer die
Antwort liest, sieht sie. Dieselbe Grenze steht ein zweites Mal auf dem
Server. Das Gelände geht immer ganz mit: wer die Wand sieht, sieht sie
auch am Tisch.

Das Protokoll bleibt vollständig. Die Aufnahmen im Verlauf kennen auch
die verborgenen Figuren — der Verlauf gehört der Spielleitung, und
einer, der die Hälfte verschweigt, wäre hinterher gelogen.

### 🖼 Ein Bodenplan darunter

Ein Bild hineinziehen, und es liegt unter dem Raster. Ausgerichtet wird
über Zoom und Versatz, beides in Prozent der Rasterbreite, damit die
Einstellung stehen bleibt, wenn die Felder ihre Größe ändern.

Der leere Boden wird durchsichtig, **gemaltes Gelände bleibt
undurchsichtig**: das Bild zeigt den Raum, die gemalten Felder sind die
Wahrheit darüber. Wer eine Wand einträgt, will sie sehen, auch wenn der
Plan dort einen Teppich zeigt.

Der Plan bleibt auf dem Gerät der Spielleitung. Er geht nicht an die
Runde und nicht in den Textblock — der Kampf wird im Sekundentakt
geschrieben, und ein Bild gehört da nicht hinein. Im Gerät liegt er in
einem eigenen Fach: ist der Speicher voll, fällt das Bild aus und nicht
die Initiativreihenfolge.

### 🪟 Fenster statt Kästen

Beide Karten sind eigene Fenster, wie die Kampfsicht: am Kopf schieben,
das Dreieck klappt ein, das Kreuz macht zu. Stelle und Zustand merkt
sich das Gerät je Fenster.

Als Kasten in der Seite waren sie falsch herum: wer die Karte aufmacht,
schiebt damit die Initiativliste zwei Schirmlängen nach unten — und
genau die braucht er im selben Augenblick.

**Beide lassen sich vergrößern und verkleinern**, zwei Knöpfe oder Strg
und Mausrad. Dazu **⤢ Einpassen**: ein Druck, und die ganze Karte steht
ohne Rollbalken im Fenster. Unter zwölf Pixeln je Feld hört es auf —
darunter wäre die Karte kein Bild mehr, sondern ein Muster.

### 🐉 Höhe

Die Karte war flach. Bei Drachen, fliegenden Vampiren und Spinnen an
Wänden ist das die eine Sache, die fehlt — also trägt jede Figur jetzt
optional eine Höhe. Figur aufnehmen, `Höhe − 0 m +`, in Feldschritten
von 1,5 m.

```
FIGUREN
  Ar  Armin              Held     D5   32/38 TP
  Dr  Blauer Drache      Gegner   H8   124/244 TP · Höhe 12 m
```

Wer am Boden steht, trägt nichts mit sich herum. Ein Häkchen an der
Ecke des Feldes zeigt, wer oben ist — auf beiden Karten.

**Die Höhe zählt in der Entfernung mit**, als dritte Achse und in
Feldern gerechnet: zwölf Meter sind acht Felder, und ein Drache
senkrecht über einem Kämpfer ist acht Felder weit weg. Sonst hätte die
Tafel weiter eine Zahl genannt, die falsch ist, ohne es zu zeigen.

**Bei der Sicht bleibt es bei einer Frage.** Das Raster kennt die Höhe
der Wand nicht, also sagt es „aber Dr 12 m hoch: darüber hinweg
entscheidet die Spielleitung" — statt eine Wandhöhe zu erfinden.

Steigen und Sinken stehen im Protokoll (`steigt auf 12 m über G2`), die
Höhe bleibt beim Ziehen erhalten, geht an die Runde und kommt beim
Einlesen zurück. Gerechnet wird in **Metern**: `Höhe 40 ft` wird
bewusst nicht übernommen, sonst stünden vierzig Fuß als vierzig Meter
da.

### 🔑 Kleinigkeiten

- **Der Waldgnom mit Rüstungsklasse 5.** Die Vorschau im Assistenten
  („Das steht danach im Bogen") rechnete Initiative und Rüstungsklasse
  aus, sobald das Volk einen Bonus auf Geschicklichkeit gab — auch wenn
  noch gar kein Attribut gewählt war. Geschicklichkeit 0 plus 1 vom
  Waldgnom ergibt 1, und der Modifikator dazu ist −5. Geprüft wurde die
  Summe statt des Grundwerts. Dieselbe Stelle gab dem Zwerg auf der
  ersten Stufe Trefferpunkte unterhalb seines Trefferwürfels. Beides
  steht jetzt erst da, wenn die Attribute stehen.

  In v5.1.1 stand hier, die Ursache lägen in Modifikatoren in den
  Gegnerfeldern. Das war die falsche Stelle — die Anzeige dort ist
  trotzdem nützlich und bleibt.
- **„Neuer Charakter" ging nicht mehr auf.** Das Fenster blieb grau: der
  Assistent rechnete seinen Plan aus, bevor er wusste, ob ein Talent
  dazugehört, und brach an dieser Stelle jedes Mal ab. Die Ursache kam
  mit dem begabten Menschen in v5.1.1 herein und traf jeden neuen
  Charakter, nicht nur Menschen.
- **Das Protokollfenster ist höher** — 340 statt 220 Pixel. Mit einer
  Kartenaufnahme darin war es zu eng.
- **`KAMPFTRACKER.md`**, die Übersicht zum Vorlegen an eine KI, hat
  ihren ersten „steht nicht drin"-Punkt verloren: Stellungen stehen
  jetzt drin, wenn eine Karte geführt wird. Was weiter nicht drinsteht,
  steht weiter dabei.

## v5.1.1

Ein Abend am Tisch, eine Liste hinterher. Was hier steht, kommt fast
vollständig aus dem ersten echten Testlauf mit v5.1 — und das meiste
davon sind Dinge, die erst auffallen, wenn jemand wirklich damit spielt.

### ⏱ Es fühlt sich schneller an

Der Verzug beim Würfeln und im Kampf kam nirgends aus der Leitung: eine
Anfrage an den Server dauert **21 Millisekunden** (gemessen, Median über
25 Läufe). Er kam aus zwei anderen Stellen.

**Die eigene Handlung war nicht sofort da.** Wer würfelte, sah seinen
eigenen Wurf erst, wenn die nächste Abfrage antwortete — bis zu drei
Sekunden für eine Zahl, die längst feststand. Dabei schickt der Server
sie in seiner Antwort ohnehin zurück; sie wurde nur nicht benutzt. Jetzt
steht sie sofort da: der Wurf, die eigene Ansage im Kampf, die angesagte
Probe der Spielleitung.

**Nach dem Abschicken wurde der Takt abgewartet.** Jetzt wird sofort neu
gefragt.

Und der Takt selbst ist kürzer, solange etwas offen steht:

| | vorher | jetzt |
|---|--:|--:|
| Kampf läuft | 2,0 s | **1,2 s** |
| Probe offen | 3,0 s | **1,2 s** |
| Fund liegt | 5,0 s | **2,5 s** |

Im Leerlauf und im Hintergrund bleibt alles wie es war — dort wird
nichts erwartet.

### 🎲 Proben gehen an einzelne, und geheim heißt geheim

Eine Ansage ging bisher an alle. Jetzt lassen sich einzelne antippen;
niemand angetippt heißt weiter alle.

**„Verdeckt" und „geheim" sind zwei verschiedene Dinge.** Verdeckt
heißt: *du* weißt nicht, ob du bestanden hast. Geheim heißt: die
*anderen* wissen nicht einmal, dass du gewürfelt hast. Das kann die
Anzeige nicht halten — sie bekäme die Ansage und müsste sie nur
verschweigen. Deshalb filtert der **Server** sie heraus, bevor sie
hinausgeht.

Bei einer geheimen Probe steht kein Zahlenfeld, sondern **🎲 Würfeln**.
Wer zum Würfel greift, fällt auf, und dann weiß der ganze Tisch, dass
etwas gefragt wurde.

Danach kann die Spielleitung **Text und Bild an einzelne schicken** —
vorgeschlagen sind die, die es geschafft haben, ankreuzen lässt sich
jeder. Auch das filtert der Server.

### 🖼 Bilder hineinziehen

An sieben Stellen ließen sich Bilder einsetzen, und alle sieben waren
verschieden gebaut. Jetzt steht überall dieselbe Ablage — Gegner,
Heldenporträt, Waffe, Gegenstand, Datenbank, Post an einen Spieler —,
und sie nimmt drei Wege an: **hineinziehen**, anklicken, oder
**Strg+V**, wenn irgendwo ein Bild kopiert wurde.

Ein Bild direkt aus einer fremden Webseite hereinzuziehen geht nicht und
kann nicht gehen: dabei kommt keine Datei an, sondern eine Adresse.
Kopieren und einfügen geht dafür.

Zwei der alten Felder machten aus jedem PNG ein JPEG und damit aus jeder
Transparenz eine schwarze Fläche. Das ist mit erledigt.

### ⚔ Kampf

- **Ein angesagter Zauber kostet seinen Platz.** Wer das von Hand
  vergisst, zaubert den Abend zu Ende aus einem Vorrat, den es nicht
  mehr gibt. Gestrichen wird nur, wenn einer da ist — angesagt wird
  trotzdem, denn Rituale und Zaubereipunkte kosten keinen, und das
  entscheidet der Tisch und nicht der Bogen.
- **Reaktionen mit einem Griff.** In der Kampfsicht steht eine Leiste
  mit genau den Zaubern, deren Wirkzeit „Reaktion" sagt. Gegenzauber und
  Silberdornen tauchen von allein auf, sobald sie im Buch stehen.
- **Angesagt steht offen da.** Die Liste lag im Tracker hinter einem
  Knopf; bei einer Sache, die man genau dann braucht, wenn man ohnehin
  zwei andere im Kopf hat, war das ein Griff zu viel.

### 🎓 Bogen und Regeln

- **Der Mensch hat die Wahl.** „Vielseitig" ist der alte — überall
  einer; **„Begabt"** nimmt zwei Punkte nach Wahl und dafür ein Talent,
  schon auf der ersten Stufe. Dieselbe Frage wie bei der
  Attributssteigerung, nur zwölf Stufen früher.
- **Beute von Hand verteilen.** Gleiche Teile bleiben der Normalfall;
  „Anders verteilen" macht daraus ein Raster, je Held eine Zeile.
  Aufgehen muss es — der Fund wird danach weggeräumt, und was offen
  bliebe, wäre weg.
- **Der Artifizient** fehlte nicht im Regelwerk, sondern in
  Klassenlisten, die angelegt wurden, bevor es ihn gab. Die
  Einstellungen sagen jetzt, was fehlt, und legen es auf einen Griff
  dazu. Von allein hinzufügen wäre falsch: wer eine Klasse streicht,
  meint das.
- **Gegnerattribute zeigen ihren Modifikator.** Wer dort Modifikatoren
  einträgt statt Werte, bekommt Rüstungsklasse 5 und Initiative −4 —
  Geschicklichkeit 0 gibt nun einmal genau 10 + (−5). Das fiel bisher
  erst im Kampf auf. Jetzt steht es im Formular, und wenn alle sechs
  unter sieben liegen, rechnet ein Knopf es um.

### 🎰 Taverne

- **Die Auszahlungstafel war abgeschnitten.** Sie wurde als Flex-Kind
  zusammengestaucht und der Rest verschwand, ohne dass irgendwo etwas zu
  rollen war — beim Verschollenen Kapitel fehlten zwei Zeichen und beide
  Fußnoten. Betraf alle Tische, nicht nur die neuen.
- **Die Halle hat drei Gruppen**: Tische, Walzen, Wetten. An einem Tisch
  gibt jemand, eine Walze läuft von allein, und eine Wette geht auf
  etwas, das ohne den Spieler passiert.
- **Drei Zeichen waren kaum zu sehen**, weil sie als Textglyphe gesetzt
  wurden statt als Bild: ♟ → ♠️, 🕮 → 📖, 🗡 → ⚔️.

### 🔑 Kleinigkeiten

- **„Erstes Konto anlegen"** steht nur noch da, wo es noch keines gibt.
  Vorher konnte der Knopf, sobald es Konten gab, nur noch eine
  Fehlermeldung erzeugen.

## v5.1

Die Taverne bekommt drei Automaten dazu. Sie sind nach dem Vorbild
dreier Geräte gebaut, die jeder kennt, der schon einmal in einer
Spielhalle stand — nachgebaut ist der Ablauf, nicht die Aufmachung:
Namen, Zeichen und Bild sind eigene.

Alle drei sind derselbe Automat: fünf Walzen, drei Reihen, **zehn feste
Linien**. Zuschaltbar sind die nicht — wer im Original mit drei Linien
spielt, spielt einen schlechteren Automaten, und diese Falle muss das
Heldenbuch nicht nachbauen. Der Einsatz auf der Leiste ist der
Gesamteinsatz; eine Linie bekommt ein Zehntel davon.

Unterscheiden tun sie sich in genau einer Regel — der ihrer
Freispielrunde. Das ist der ganze Charakter eines solchen Geräts.

### 🕮 Das Verschollene Kapitel

Ein Zauberbuch in einer versunkenen Bibliothek. **Drei Bücher** öffnen
zehn Freispiele; vorher blättert das Buch sichtbar durch die Tafel und
bleibt bei einem Zeichen stehen. Liegt dieses Zeichen im Freispiel auf
drei Walzen oder mehr, füllt es sie ganz aus und zahlt über alle zehn
Linien — **auch dann, wenn die Walzen nicht nebeneinander liegen.** Drei
Bücher in der Runde legen zehn nach.

Das Buch ist dabei Wild und Streuzeichen zugleich. Wird es selbst zum
Sonderzeichen gelost, ist das der beste Fall, den dieser Automat kennt.

Auszahlung **95,2 %**, die Runde fällt etwa jede 117. Drehung.

### 🗡️ Klinge und Hörner

Die Arena unter der Stadt. **Drei Hörner auf Walze 1, 3 und 5** — nur
dort liegen sie — öffnen zehn Freispiele, und darin bleibt jede Klinge,
die fällt, **bis zum letzten Dreh stehen**. Sie sammeln sich an: der
siebte Freidreh wird auf einem Feld gespielt, auf dem schon vier Klingen
stecken. Nachgelegt wird nicht.

Die Klinge ersetzt jedes Zeichen außer den Hörnern und zahlt selbst am
höchsten. Welches Zeichen sie vertritt, entscheidet der Gewinn: vier
Klingen und eine Fechterin zahlen als fünf Fechterinnen.

Auszahlung **94,2 %**, die Runde fällt etwa jede 125. Drehung.

### 👁️ Das Wachsame Auge

Ein Wächter in einer Tempelruine. Er liegt **nur auf Walze 2, 3 und 4**
und füllt die Walze, auf der er fällt. **Drei Tore** öffnen zwölf
Freispiele, und darin tut jeder Wächter zwei Dinge auf einmal: er
**veredelt** — das unterste der vier billigen Zeichen verschwindet von
den Walzen, alles rückt eine Stufe hoch, für den Rest der Runde — und er
**verlängert**: ein Freidreh je Wächter, zwei bei zweien, drei bei
dreien.

Beides zusammen ist eine Lawine. Eine Runde, die gut anfängt, wird von
selbst immer besser. Damit sie sich nicht selbst auffrisst, hat sie zwei
Zäune: die Leiter endet bei den billigen Zeichen, und nach zwanzig
Drehungen ist Schluss.

Auszahlung **95,3 %**, die Runde fällt etwa jede 350. Drehung — sie ist
die stärkste im Haus und darf deshalb die seltenste sein.

### Was für alle drei gilt

- **Die Quote steht am Tisch**, und zwar die erreichte. Sie ist gemessen
  und nicht geschätzt: acht bis fünfzehn Millionen stille Drehungen je
  Automat, Freispielrunden eingerechnet.
- **Die Risikoleiter** und *Rabe oder Rose* gelten nach jedem Gewinn im
  Grundspiel — dieselben wie am dreiwalzigen Automaten.
- **Die Auszahlungen sind je Abenteuer einstellbar**, wie beim
  „Dreifachen Glück". Die Quote rechnet sich sofort mit.
- Die Halle hat jetzt zwei Überschriften: **Tische** und **Walzen**. An
  einem Tisch gibt jemand, an einem Automaten nicht.

## v5.0

Diese Fassung fängt mit einem Schrecken an: die Datenbank der Gruppe
war leer. Zauber weg, Gegenstände weg, Tierverwandlungen weg. Wieder da
ist sie aus einer Sicherung — aber ein Programm, dem so etwas passieren
kann, ist damit nicht fertig.

Deshalb steht in dieser Fassung an drei Stellen dasselbe: **was einmal
drin ist, geht nicht ohne Rückfrage wieder heraus.** Die Bibliothek
lässt sich nicht mehr leerschreiben, sie lässt sich sichern, und beim
Einspielen wird nichts überschrieben, was schon dasteht.

Dazu der Rest des Abends: Listen, die man einfügt statt sie zu tippen,
und ein Zug, in dem mehr als eine Sache passieren darf.

### 🛟 Die Datenbank kann sich nicht mehr selbst leeren

Wie es dazu kam, ist nicht restlos geklärt — sicher ist, wo es
schiefgehen *konnte*: an vier Stellen wurde die Sammlung gespeichert,
wie sie beim Öffnen des Fensters ausgesehen hat. Wer zwei Fenster offen
hatte, schrieb mit dem einen zurück, was das andere schon geändert
hatte.

Diese vier Stellen rechnen jetzt vom aktuellen Stand aus. Und darüber
liegt ein Riegel: **eine Speicherung, die aus etwas nichts machen
würde, wird abgelehnt** — mit einem Hinweis statt einer leeren
Datenbank. Ein Fehler, der die Sammlung kostet, ist etwas anderes als
einer, der eine Meldung zeigt.

### 💾 Sichern und einspielen

Unten im Datenbankfenster stehen zwei neue Knöpfe. **⬇ Sicherung** lädt
die ganze Sammlung als Datei herunter — Zauber, Waffen, Gegenstände,
Ausrüstungssätze, Tierverwandlungen, mit dem Datum im Dateinamen. Das
ist die Datei, die man wegheftet, bevor etwas passiert.

**⬆ Einspielen** liest sie zurück, und zwar *dazu* und nicht *darüber*:
Was schon dasteht, bleibt, wie es ist. Vorher steht in einer Rückfrage,
was ankommt und was übersprungen wird — „Das kommt dazu: 12 Zauber · 3
Gegenstände. Übersprungen werden 288, die es schon gibt." Doppelte
erkennt es am Namen, nachsichtig gegen Groß- und Kleinschreibung und
gegen Leerzeichen: „Seil, 15 m" und „Seil,15 m" sind dasselbe Seil.

Damit lässt sich eine Sammlung auch zusammenlegen, ohne dass jemand
hinterher 300 Zeilen durchsieht.

### 📋 Listen einfügen statt tippen

Beute entsteht am Tisch als Aufzählung: auf einem Zettel, in einer
Nachricht, in der Antwort einer KI. Sie danach Zeile für Zeile in
Felder zu übertragen, hat bisher jeder gescheut — und dann stand die
Beute nirgends.

Im Fenster **Beute hinlegen** steht jetzt oben ein Knopf *Liste
einfügen*. Der Text darf aussehen, wie er will:

```
Titel: Aus der Truhe im Keller
340 GM
22 SM
Ring des Schutzes | schimmert blau
8x Fackel
Schmuck | im Wert von 500 Gold
```

Aufzählungszeichen dürfen davorstehen, die Menge vorn oder hinten
(`8x Fackel`, `Fackel ×8`), die Notiz hinter einem senkrechten Strich.
Münzen erkennt eine Zeile an ihren Wörtern — `340 GM, 22 Silber und 15
KM` ist eine Kasse, `12 Goldringe` sind zwölf Ringe. Und ein
Bindestrich zählt nicht als Trennung: die Zwei-Hand-Axt behält ihren
Namen.

**Hingelegt wird nichts von allein.** Der Text füllt die Zeilen, und
davor sitzt weiter die Spielleitung — jede Zahl steht zum Ändern da.

Jeder Name wird in der Datenbank nachgeschlagen. Wird er gefunden, gilt
der Eintrag von dort: seine Schreibweise („8x fackel" wird zu Fackel),
seine Beschreibung, und beim Eintragen in die Bögen alles Übrige —
Gewicht, Seltenheit, Wirkung. Die Rückmeldung sagt, wie viele Stücke
von dort kamen. Nur eine Notiz aus der Liste selbst sticht die
Beschreibung: sie gilt für dieses eine Stück.

Daneben steht eine **Anweisung zum Kopieren**, die einer KI sagt, in
welcher Form die Liste zurückkommen soll. Unten hängt man an, was
gefunden werden soll.

### ⚔ Gegner aus dem Stegreif — jetzt eine ganze Liste

Dasselbe im Kampf. Der Knopf **✚ Nothelfer** nahm einen Gegner; jetzt
nimmt er eine Liste, mit demselben Feld darüber:

```
4x Goblin | 7 TP | RK 15
Goblin-Boss | 21 TP | RK 17
2x Wolf | 2W6+2 TP | RK 13
Wächter am Tor 11 13
```

Auch hier wird nachsichtig gelesen: mit Strichen, mit Kommas, ganz ohne
Trennzeichen (zwei Zahlen am Ende sind Trefferpunkte und
Rüstungsklasse), mit `TP`/`RK` oder ohne. Was fehlt, ist ein
Trefferpunkt und Rüstungsklasse zehn.

Steht bei den Trefferpunkten ein **Würfel**, wird er für jeden einzeln
geworfen — vier Goblins sind vier verschiedene Zahlen und nicht viermal
dieselbe.

**Und was in der Gegnersammlung steht, kommt von dort.** Jeder Name
wird nachgeschlagen — „goblin" findet den Goblin —, und dann bringt er
mit, was dort hinterlegt ist: Trefferwürfel, Rüstungsklasse, Initiative
nach seiner Geschicklichkeit, sein Bild und sein Blatt. Solche Zeilen
stehen hervorgehoben da. Die Zahlen daneben bleiben trotzdem deine: wer
„Wolf | 15 TP" schreibt, bekommt einen Wolf mit fünfzehn.

Wen die Sammlung nicht kennt, entsteht wie bisher aus dem Stegreif.
Geschrieben wird in die Sammlung dabei nie — gelesen schon.

### 📜 Der Aufstieg bringt die Merkmale mit

Was eine Stufe gibt, stand bisher nur im Buch. „Stufe 5: Zusätzlicher
Angriff" hat jeder von Hand abgeschrieben — oder es vergessen und ist
drei Sitzungen lang mit einem Angriff zu wenig herumgelaufen.

Der Aufstieg zeigt jetzt, was dazukommt, und trägt es auf Knopfdruck in
die Merkmale des Bogens ein — mit Name, kurzem Satz und Quelle
(„SRD 5.1 · Kämpfer 5"). Angekreuzt ist, was die Klasse selbst gibt;
**was von der Unterklasse kommt, steht nur als Erinnerung da** und ist
nicht vorgewählt: wie es heißt, weiß nur dein Bogen. Was schon im Bogen
steht, kommt kein zweites Mal — auch wenn es anders geschrieben ist.

**198 Merkmale, alle zwölf Klassen, Stufe 1 bis 20.** Die Stufen und die
englischen Namen stammen aus dem SRD 5.1 (Creative Commons Attribution
4.0) und sind Eintrag für Eintrag gegen die Quelle geprüft; die
deutschen Namen und die Sätze darunter sind kurze Zusammenfassungen und
ersetzen das Regelwerk nicht. Der englische Name steht bei jedem Eintrag
mit dabei — zum Nachschlagen im eigenen Buch.

Was **nicht** dabei ist und auch nicht dazukommen kann: die Talente und
Unterklassen aus dem Spielerhandbuch, Tasha's Kessel und Xanathar's
Ratgeber. Die stehen außerhalb der Lizenz; das SRD enthält genau ein
Talent. Für alles Weitere ist die Datenbank der Gruppe da.

### 📜 Eigene Merkmale

Was das SRD liefern darf, liefert es — der Rest kommt jetzt von euch.
Die Datenbank hat eine siebte Art bekommen: **Merkmale**, und ein
Eintrag weiß, wohin er gehört.

| | |
|---|---|
| **Klasse** | oder „Alle Klassen" für Hausregeln, die für jeden gelten |
| **Ab Stufe** | dort bietet der Aufstieg es an |
| **Unterklasse** | leer heißt: bei jeder. Steht ein Name da, nur bei der |
| **Beschreibung + Effekte** | wie bei Gegenständen — sie wirken, sobald es im Bogen steht |

Beim Aufstieg stehen sie in derselben Liste wie die aus dem SRD, mit dem
Zusatz **„aus eurer Datenbank"**, und sind wie diese vorgewählt und
abwählbar. Im Bogen steht ihre Herkunft: `Eigen · Kämpfer 5`.

Ein Merkmal, das an eine Unterklasse gebunden ist, **ersetzt die
Erinnerung** „Merkmal der Unterklasse" auf seiner Stufe — genau wie eine
hinterlegte Unterklasse es tut. Damit lässt sich eine eigene Unterklasse
vollständig nachbauen: den Namen beim Aufstieg unter „Eigene…"
eintragen, ihre Merkmale hier hinterlegen, und der nächste Aufstieg
weiß Bescheid.

### 🎓 Unterklassen

„Auf Stufe 3 wird die Unterklasse gewählt" stand bisher als Hinweis da,
und was sie dann gibt, hat man im Buch nachgeschlagen.

Jetzt fragt der Aufstieg auf der richtigen Stufe — bei jeder Klasse auf
ihrer eigenen, und bei mehreren Klassen für jede getrennt. Zur Wahl
steht die Unterklasse aus dem SRD und **Eigene…** für alles andere; der
Name kommt in den Bogen und steht dort klein unter der Klasse im Schild.

Ist es eine hinterlegte, kommen **ihre Merkmale** von da an mit — an den
Stufen, an denen bisher nur „Merkmal des Archetyps" als Erinnerung
stand. Genau diese Erinnerung fällt dann weg: sie stand ja nur da, weil
niemand wusste, was dort kommt. Bei einer eigenen bleibt sie stehen.

**56 Unterklassenmerkmale, zwölf Unterklassen** — eine je Klasse, mehr
enthält das SRD nicht. Auch sie sind Eintrag für Eintrag gegen die
Quelle geprüft.

Eine bestehende Unterklasse rührt der Aufstieg nie an — einen Schwur
wechselt man nicht beim Stufenanstieg. Wer sich vertan hat, ändert sie
im Bearbeiten-Formular, wo jetzt neben Klasse und Stufe auch ein Feld
dafür steht.

### ⭐ Talente

Die Datenbank hat eine sechste Art bekommen: **Talente**. Name,
Voraussetzung, ein Text in euren Worten — und die beiden Haken, die das
Heldenbuch selbst rechnen kann: die **Effekte** (dieselben wie bei
Gegenständen und Sets) und das **halbe Talent**, das nebenbei ein
Attribut um 1 steigert. Angehakt wird, welche Attribute zur Wahl
stehen; nichts angehakt heißt ein ganzes Talent.

Beim Aufstieg steht unter „Talent" jetzt die Liste statt eines
Hinweises. Gewählt, und das Talent kommt als Merkmal in den Bogen — mit
seinem Text, mit seiner Quelle und mit seinen Effekten, die dann auch
wirken. Ist es ein halbes, fragt der Aufstieg, **wohin das +1 geht** —
und wählt es nicht für dich, so wie die Attributssteigerung daneben
auch nichts vorwählt.

Die Voraussetzung wird angezeigt und nicht geprüft: was am Tisch gilt,
entscheidet der Tisch.

Gefüllt wird die Liste von euch. Das Regelwerk steht nicht im Programm —
aus dem SRD wäre genau ein Talent zu holen —, aber eure Einträge liegen
damit an derselben Stelle wie Zauber und Gegenstände: sie gehen in die
Sicherung, das Einspielen filtert Doppelte, und der Riegel gegen das
Leerschreiben gilt auch für sie.

### 💰 Der Beutel

Fünf Münzsorten, jede mit eigenem Fenster, darin „Hinzufügen",
„Wegnehmen" und „Setzen" — drei Wege für eine Sache, und der dritte
hiess anders, als er tat. Am Tisch wird aber ausgegeben und
eingenommen, und gerechnet wird in Gold.

Jetzt steht da, was drin ist, und darunter ein Feld und zwei Knöpfe:
**− Ausgeben** und **+ Einnehmen**, Beträge in Gold. „2,5" sind zwei
Gold und fünf Silber. Das Wechseln macht das Programm — bezahlt wird
aus dem Kleingeld zuerst, und was zu viel hingelegt wurde, kommt als
Wechselgeld zurück. Dieselbe Rechnung wie im Laden. Reicht der Beutel
nicht, sagt es das und rührt nichts an.

### 👁 Knöpfe, die man sieht

Drei Stellen, an denen etwas da war, das man nicht fand:

- **Am Kopf des Bogens** standen Aufstieg, Bearbeiten, Archiv und
  Löschen als blasse Zeichen ohne Rahmen — 55 % Deckkraft, Umriss erst
  beim Darüberfahren, und am Finger gibt es kein Darüberfahren. Jetzt
  sind es Knöpfe mit Rand und Wort; der Aufstieg trägt Gold, weil er
  der ist, den man sucht. Eng wird es, bleibt das Zeichen allein.
- **Der Stift an einer Zauberkarte** war schwarz auf der farbigen
  Fusszeile seiner Schule: ein eingetragener Stil hatte die Klasse
  überschrieben, die es richtig machte. Er und das Kreuz daneben haben
  jetzt einen dunklen Grund, einen Rand und helle Schrift.
- **„Von Hand"** stand in der Heldenleiste neben „Neuer Charakter" — an
  einer Stelle, an der man wählen musste, bevor man wusste, was der
  Assistent überhaupt fragt. Er steht jetzt im Assistenten selbst, im
  ersten Schritt: dort weiss man, wovon man sich verabschiedet.

### ⇧ Der Aufstieg kennt mehrere Klassen

Der Stufenaufstieg konnte nur die Hauptklasse. Wer gemischt hatte, bekam
den Übungsbonus aus **ihrer** Stufe statt aus der Summe — ein Magier 4 /
Kleriker 1 stand auf +2, richtig sind +3. Und die Zauberplätze liess er
ganz stehen.

Jetzt wird gewählt, welche Klasse aufsteigt — die vorhandenen stehen als
Knöpfe da, eine neue kommt aus der Liste daneben. Daraus folgt alles
Übrige: der Trefferwürfel dieser Klasse, ihre Attributssteigerung, ihre
Unterklassenstufe. Der Übungsbonus folgt der Gesamtstufe.

**Die Zauberplätze rechnet er jetzt auch gemischt.** Volle Klassen
zählen ganz, halbe zur Hälfte und abgerundet — ein Paladin 1 bringt
nichts mit, ein Paladin 2 eine Stufe. Wer nur eine zaubernde Klasse hat,
rechnet weiter nach deren eigener Tabelle, so wie es das Regelwerk
sagt. Die Plätze des Paktmagiers kommen oben drauf, mit dem Hinweis,
dass sie schon nach einer kurzen Rast zurückkommen.

Dazu die Failsafes, die beim Mischen am meisten fehlen: **die
Voraussetzungen.** Wer einen Paladin dazunimmt, liest *„Für Paladin
verlangt das Regelwerk Stärke 13 und Charisma 13 — hier steht Stärke 10,
Charisma 12."* Verboten wird nichts; eine Runde, die es anders hält,
soll nicht am Programm scheitern.

### ⚡ Jemand kommt dazwischen

Der Drache hat legendäre Aktionen, der Schurke hält eine Aktion bereit,
der Schauplatz rührt sich auf Initiative 20. Bisher kannte die Reihe
nur ein Nacheinander — wer dazwischen handelte, tat das im Kopf der
Spielleitung.

Jede Zeile hat aufgeklappt jetzt **⚡ Dazwischen**. Wer damit an die
Reihe kommt, handelt sofort: seine Zeile ist hervorgehoben und bietet
das Zugfenster an, im Kopf steht *„⚡ Dazwischen: Goblin 2 · danach
wieder Drache"*, und die unterbrochene Zeile bleibt gestrichelt stehen
— **ihr Zug ist nicht vorbei, er wartet.** Aus „Nächster" wird
solange *„↩ Zurück zu Drache"*.

Die Runde und die Reihenfolge rührt das nicht an. Im Protokoll steht
eine Zeile dazu, und die Runde sieht es in der geteilten Ansicht
genauso.

Zwei Kleinigkeiten am selben Ort:

- **In der Vorbereitung ist niemand mehr am Zug.** Die Reihe stand
  schon da, und der erste war hervorgehoben, als warte die Gruppe auf
  ihn — dabei hatte noch niemand gewürfelt.
- Aus **„Nächster Zug ▶"** wurde **„Nächster ▶"**.

### 🎒 Beute und Laden füllen sich aus der Datenbank

Beim Tippen schlägt die Sammlung der Gruppe vor, und was dahintersteht
— Beschreibung, Seltenheit, Gewicht — kommt beim Eintragen von selbst
mit. Der Ring des Schutzes steht damit im Inventar so da wie in der
Datenbank und nicht als nackte Zeile.

**Die Beschreibung bleibt trotzdem deine.** Wer „Schmuck" schreibt und
„im Wert von 500 Gold" dahinter, bekommt genau das — der Vorschlag
füllt nur, wo nichts steht. Dasselbe in der Auslage des Ladens.

### 🗣 Mehrere Ansagen in einem Zug

Ein Zug ist selten eine Sache. Angriff und Trank, Zauber und Rückzug —
bisher passte eine Ansage hinein, und der Rest wurde daneben geredet.

Jetzt meldet ein Spieler so viele Aktionen und Bonusaktionen an, wie er
will. Oben in seinem Fenster steht die Zusammenfassung dessen, was er
eingereicht hat, jede Zeile als **Aktion** oder **Bonusaktion**
gekennzeichnet. Die Spielleitung sieht die Vorschläge nebeneinander,
nimmt einen oder mehrere davon an und arbeitet sie **nacheinander** ab
— ein Fenster nach dem anderen, in der Reihenfolge, in der sie
angenommen wurden.

### 🍺 Die Taverne im Log

Wer in der Taverne gewinnt oder verliert, steht jetzt unter einem
eigenen Tag. Ein Abend am Rouletterad soll nicht dieselbe Liste füllen
wie der Kampf, den man nachlesen will — und umgekehrt findet man das
Spielgeld jetzt an einer Stelle.

### 🩹 Behoben

- **Der Reiter „Log" am Charakterbogen war leer**, seit die Konten
  eingeführt wurden. Er fragte nach einem Gruppenpasswort, das es seit
  Stufe 7 nicht mehr gibt, und ließ es bei jedem Laden bleiben.
  Dieselbe Abfrage stand noch an einer zweiten Stelle.
- **Zwei Schließen-Knöpfe im Abenteuerlog** — das Fenster brachte
  seinen eigenen mit und bekam noch einen vom Rahmen.
- **Ein Tag im Abenteuerlog schloss das Fenster.** Das war meine eigene
  Nebenwirkung aus dem Punkt darüber; behoben ist es an der Stelle, an
  der jedes Fenster entsteht, damit es nicht dem nächsten passiert.
- **Die Ansagen im Kampf gingen verloren**, wenn das Fenster zwischen
  zwei Meldungen neu aufgebaut wurde. Die Warteschlange liegt jetzt
  eine Ebene höher, wo das Neuaufbauen sie nicht erwischt.
- **Die Werkbank unter `dev/` lief nicht mehr**: zwei Hilfsfunktionen
  stehen in der `index.html` und nicht in den Quellen. Betrifft nur das
  Testen, aber ohne sie prüft man nichts.
- **Die Datenbank ließ sich nicht mehr speichern**, sobald sie über 2 MB
  wuchs — genau das passierte beim Einspielen der Gegenstände. Die
  Grenze lag bei 2 MB und stand seit Jahren da, ohne Grund: die Spalte
  ist LONGTEXT. Sie liegt jetzt bei 6 MB, und daneben steht die Grenze,
  die wirklich zählt — die des Datenbankservers selbst
  (`max_allowed_packet`). Ist die kleiner, sagt die Meldung das, statt
  den Fehler in einen Absturz laufen zu lassen.
- **Ein Fehler auf dem Server kam als HTML-Seite zurück**, mit Status
  200 obendrein. Der Client las daraus kein JSON und meldete
  „unbekannter Fehler" — bei genau dieser Sache. Jetzt antwortet auch
  ein Absturz in JSON und sagt, was passiert ist.
- **Das ✕ am Fensterrahmen konnte statt zu schließen etwas löschen.**
  Es sucht sich seinen Ausgang selbst — und ein blosses ✕ galt als
  Ausgang. In einer Liste ist das erste ✕ aber der Löschknopf der ersten
  Zeile: wer das Datenbankfenster zumachen wollte, wurde gefragt, ob die
  Adamantrüstung aus der Sammlung soll. Gesucht wird jetzt nur noch, wo
  ein Wort dransteht — Abbrechen, Schließen, Fertig, Verstanden —, und
  zuerst im Fuß des Fensters. Wo es gar nichts findet, bietet der Rahmen
  kein Kreuz mehr an, statt aufs Geratewohl zu klicken. Das Datenbank‑
  fenster sagt ihm jetzt selbst, wie es zugeht.
- **Und wenn Speichern fehlschlägt, sagt die Meldung, was das
  bedeutet:** auf diesem Gerät steht die Datenbank dann anders da als
  auf dem Server, und eine Sicherung vor dem nächsten Laden rettet die
  Arbeit.

## v4.9

Der Abend selbst war gut abgedeckt — Kampf, Zauberplätze, Rasten,
Zustände, Kalender. Nicht abgedeckt war alles davor und danach, und
dort steckt die Arbeit, die niemand gern macht: einen Charakter bauen,
ihn aufsteigen lassen, Proben einsammeln, Beute verteilen, einkaufen.

Sieben Stufen, jede für sich fertig; der Plan dazu steht in der
`SPIELFLUSS.md`. Dazu ein sechster Tisch in der Taverne und ein Log,
das endlich sagt, wer etwas getan hat.

**Ein Grundsatz trägt alles davon: erst zeigen, dann ändern.** Kein
Assistent schreibt in einen Bogen, ohne vorher hinzuschreiben, was er
ändern wird. Und gerechnet wird nicht in der Oberfläche, sondern in
einer Funktion daneben — das Übernehmen schreibt genau deren Ergebnis.
Die Vorschau *kann* deshalb nicht von dem abweichen, was danach im
Bogen steht.

### ⇧ Der Stufenaufstieg

Ein Charakter wird einmal erstellt und fünfzehnmal aufgestiegen. Bis
hierher war jeder Aufstieg Handarbeit: Trefferpunkte rechnen,
Übungsbonus nachschlagen, Zauberplätze umstellen — zehn Minuten, in
denen vier Leute warten.

Der Knopf steht oben am Bogen, neben dem Stift. Stufe wählen,
Trefferpunkte würfeln oder den Durchschnitt nehmen, bei einer
Attributssteigerung entscheiden — dann steht im Kasten, was sich
ändert, und erst dann der Knopf.

**Nichts ist vorgewählt.** Die Attributssteigerung fängt ohne Wahl an:
eine vorgewählte Stärke landete sonst im Bogen eines Magiers, weil
jemand nur auf Übernehmen drückt.

Dazu: die Trefferpunkte sind **tippbar** — damit geht der Aufstieg auch
rückwärts, ohne dass jemand raten muss, was damals fiel. Verbrauchte
Zauberplätze bleiben verbraucht; das Auffüllen ist Sache der langen
Rast. Und was er nicht kann, sagt er: eine eigene Klasse steht nicht in
den Tabellen, dann rechnet er Stufe und Übungsbonus und lässt den Rest.
Bei mehreren Klassen lässt er die Zauberplätze stehen — eine falsche
Zahl wäre schlimmer als gar keine.

### ✶ Der Charakterassistent

„Neuer Charakter" war ein Formular mit fünf Feldern. Danach stand ein
leerer Bogen da, und man trug zwei Stunden lang ein, was eigentlich aus
den Regeln folgt.

Jetzt sechs Schritte — Volk, Klasse, Attribute, Hintergrund,
Fertigkeiten, Ausrüstung —, jeder mit einem Satz Regelinfo. Das ist der
halbe Nutzen für jemanden, der neu ist. Am Ende steht ein Bogen mit
allem, was daraus folgt: Trefferpunkte, Rüstungsklasse, Übungsbonus,
Rettungswürfe, Initiative, Sprachen, Zauberplätze, die Merkmale des
Volkes mit Namen und Quelle, und das Startpaket im Inventar.

Die Attribute gehen auf drei Wegen: **Standardsatz**, **Punktekauf**
(27, wird rot bei 28) oder **4W6, schlechtester weg**.

**Kein Knopf wird nur grau.** „Weiter" trägt den Grund als Aufschrift:
*„Genau 2 Fertigkeiten — gewählt: 1."* Die zwei Fertigkeiten des
Hintergrunds sind gesperrt und stehen mit „vom Hintergrund" da — eine
davon noch einmal zu wählen würde einen Klassenplatz verschenken, und
es geht gar nicht erst.

**Von Hand geht es weiter wie bisher:** daneben steht „✎ Von Hand" und
fragt nur nach den fünf Feldern.

### 🎲 Proben auf Ansage

„Alle einen Wurf auf Wahrnehmung." Bisher: reihum fragen, Zahlen
sammeln, im Kopf vergleichen.

Die Spielleitung sagt Fertigkeit **oder Rettungswurf** und einen
Schwierigkeitsgrad an, wahlweise verdeckt. Bei jedem Spieler erscheint
ein Balken mit **seinem** Modifikator — dem aus dem Bogen, mit Übung,
Expertise und allem, was daran hängt. Er trägt seinen Wurf ein; die
Spielleitung sieht die Liste: wer bestanden hat, wer nicht, wer fehlt.

Gewürfelt wird nicht. Wer am Tisch sitzt, würfelt mit der Hand; das
Feld nimmt die Zahl.

Eine Ansage **verfällt nach einer Viertelstunde** von selbst — eine
offene Probe darf den Tisch nicht blockieren. Es gibt immer nur eine je
Abenteuer. Würfeln darf nur, wem der Bogen gehört, und zweimal melden
ersetzt sich selbst.

### ⚡ Konzentration

Kein Tisch denkt daran. **Und niemand muss etwas eintragen:** ob ein
Zauber Konzentration verlangt, steht in seiner Wirkungsdauer, und die
Vorlagen tragen es alle. Es gilt damit rückwirkend für jeden Zauber,
der schon in einem Bogen steht.

- Wer wirkt, hält — und wenn schon etwas gehalten wurde, steht im
  Protokoll, dass es endet. Zwei gleichzeitig gibt es nicht.
- Wer Schaden nimmt, muss halten können: die Zeile steht dort, wo jeder
  Schaden durchgeht, mit dem richtigen Schwierigkeitsgrad — die Hälfte
  des Schadens, mindestens 10. Das ist die Zahl, die am Tisch am
  häufigsten falsch geraten wird.
- Wer umfällt, hält nichts mehr. Dafür gibt es keinen Rettungswurf.
- Der Bogen zeigt es an, mit einem Knopf zum Beenden.

### 💰 Beute verteilen

Gab es gar nicht. Gefunden wurde am Tisch, verteilt im Kopf,
eingetragen hinterher von jedem selbst — oder von niemandem. Am
nächsten Abend weiß dann keiner mehr, wer den Ring hat.

Die Spielleitung legt einen Fund hin, **jeder sieht ihn**, und genommen
wird durch Antippen des Helden. Die Münzen teilt das Programm
gleichmäßig durch die Helden des Abenteuers, den Rest an den ersten —
und es steht vorher da, wer wie viel bekommt.

**Ein Fund ist erst verteilt, wenn nichts mehr offen liegt.** *In die
Bögen eintragen* bleibt gesperrt, solange ein Stück daliegt, und
darüber steht, wie viele es sind. Erst dann wandert alles hinüber —
Stücke ins Inventar, Münzen in den Beutel, je Held eine Zeile ins
Abenteuerlog. Beute, die halb verteilt in einem Fenster verschwindet,
ist am nächsten Abend Streit.

### 🏪 Der Laden

Kaufen hieß: im Inventar eine Zeile anlegen, im Beutel eine Zahl
herunterrechnen, beides von Hand in zwei Reitern. Verkaufen dasselbe
rückwärts. Deshalb wurde beides selten richtig gemacht.

Die Spielleitung stellt zusammen, was ein Ort führt und zu welchem Teil
er zurückkauft — der übliche halbe. Der Rest ist Rechnen: **bezahlt
wird aus dem Kleingeld zuerst**, wer mit Kupfer zahlen kann, behält sein
Gold, und was zu viel hingelegt wurde, kommt als Wechselgeld zurück.
Der Beutel wird dabei nicht umgerechnet — wer Platin hat, hat es
hinterher noch.

Kaufen ist gesperrt, wenn es nicht reicht. Verkaufen ist gesperrt,
solange kein Preis dasteht.

### 🎒 Traglast — je Abenteuer, von Haus aus **aus**

Die Gewichte standen schon an den Gegenständen; es fehlte die Grenze.
Aber Traglast ist Buchführung, und die meisten Runden wollen sie nicht:
deshalb ein Schalter in den Einstellungen des Abenteuers, und
**standardmäßig aus**. Ist er aus, ändert sich nichts.

Ist er an: belastet ab Stärke × 2,5 kg, stark belastet ab × 5, Schluss
bei × 7,5 — gerechnet mit der wirksamen Stärke, samt Effekten.

**Sie verbietet nichts** und ändert auch die Bewegungsrate nicht von
selbst. Sie zeigt an und schreibt hin, was es bedeutet; was die Runde
daraus macht, ist ihre Sache. Ein Heldenbuch, das das Aufheben eines
Seils verweigert, wird ausgeschaltet.

### 📖 Das Log sagt, wer es war

Wer eine Zeile geschrieben hat, stand seit Stufe 7 in der Datenbank —
herausgegeben wurde es nie und angezeigt schon gar nicht. Beide
Ansichten zeigen den Namen jetzt unter der Uhrzeit, und **gesucht wird
auch danach**: „wer hat den Trank genommen" ist die häufigere Frage als
„wie hieß er".

Wird ein Konto gelöscht, bleibt die Zeile stehen und verliert nur den
Namen. Die Kampagnenhistorie gehört der Runde.

Dazu sagen die Zeilen jetzt, **was** passiert ist statt nur, dass etwas
passiert ist. Unter jeder standen die Feldnamen aus dem Code —
„grad: 3 · schule: Hervorrufung"; die haben jetzt Wörter, ja/nein statt
true/false, und ein Pfeil zwischen zwei Ständen bekommt Luft. „Waffe
bearbeitet" nannte nur den Namen; jetzt steht daneben, was sich
geändert hat — beim Inventar vor allem die Menge: *wer hat den letzten
Trank genommen?*

### ♟ Ultimate Texas Hold'em

Der sechste Tisch der Taverne, und Poker gegen die Bank statt
gegeneinander: am Heldenbuch sitzt selten die ganze Runde gleichzeitig
vor demselben Gerät.

Nicht der Einsatz wird kleiner, je länger man wartet, sondern die
Erhöhung — vor dem Flop das Vierfache, nach dem Flop das Doppelte, am
River das Einfache oder passen. Wer ein Blatt hat, muss früh dafür
bezahlen; das ist die ganze Spannung.

Die Tafel rät auch hier mit, und **am River rechnet sie**: es sind 45
Karten übrig und damit 990 Blätter, die der Geber haben kann. Die
werden alle durchgerechnet und der Ertrag des Erhöhens gegen die Kosten
des Passens gestellt. Die übliche Faustregel wäre schneller und
falscher.

Drin ist alles: Ante und Blind, die Blind zahlt nach dem eigenen Blatt
bis 500:1, der Geber öffnet mit einem Paar, und die Trips-Nebenwette
zahlt nach dem eigenen Blatt allein.

### 🧾 Was sonst noch anders ist

- **Der Hausvorteil steht nicht mehr in der Taverne.** Er stand an sechs
  Stellen — als Spalte in der Halle, auf dem Filz, an den Crapsfeldern,
  unter der Trips-Wette, über der Tafel des Automaten. Gedacht war er
  als Ehrlichkeit; nur sitzt am Tisch keine Statistik, sondern ein Held.
  Die Auszahlungen bleiben: 35 zu 1 und 9 zu 5 braucht man zum Setzen.
- **Der Fuß des Roulettetisches endet mit den Knöpfen.** Darunter stand
  ein leerer Streifen: eine Meldezeile, die fast immer leer war, und 40
  Punkte Polster. Die Meldung steht jetzt in der Hinweiszeile über dem
  Tapis — die sagt ohnehin, was zu tun ist. Das Fenster ist 714 statt
  792 Punkte hoch und rollt nicht mehr.

### 🩹 Behoben

- Der Vergleich am Charakter sah beim Bearbeiten nach Trefferpunkten,
  Rüstungsklasse und Bewegung — Felder, die dieses Formular gar nicht
  anfasst. Die Zeilen kamen also nie. Er sieht jetzt nach dem, was es
  dort gibt, samt dem Schalter, der einen Bogen vor den Spielern
  verbirgt.
- Dieselbe Reihenfolgenfalle wie bei der Breite der Tische: die
  Tablet-Regel für die Mitte stand in der Datei **vor** ihrer
  Grundregel und kam nie an.

## v4.8

Nachschlag zur Taverne — und zwei Sachen aus dem Kampf, die lange auf
der Liste standen. Der Beutel liegt jetzt wirklich am Helden und nicht
nur fast, die Tische bekommen die Breite ihres Fensters, der Wirt sagt
etwas dazu, und ein Heiltrank rechnet selbst.

### 👛 Der Beutel lag am Gerät, nicht am Helden

In v4.7 stand, der Beutel hänge am Helden. Das war die halbe Wahrheit:
die Marken lagen im `localStorage`, und „am Helden“ hieß damit **„je
Held in diesem Browser“**. Wer denselben Charakter mit einem anderen
Konto oder an einem anderen Gerät öffnete, fand einen anderen Beutel.

Sie stehen jetzt im Bogen und gehen denselben Weg wie alles andere
daran — über den Server, für alle gleich. Und der Umzug **findet auch
statt**: wer die Taverne öffnet und im Bogen nichts findet, schreibt
seinen Gerätestand hinein. Ihn nur zu lesen hätte bedeutet: solange
niemand spielt, zeigt jedes Gerät weiter seine eigene Zahl.

Dazu folgt der Tisch dem Bogen, solange nichts läuft — ändert ein
zweites Gerät den Beutel, kommt die Zahl alle zwei Sekunden herüber.
Nicht mitten im Wurf: ein Einsatz, der unterwegs ist, gehört zu Ende
gespielt.

Die Statistik des Wirts bleibt mit Absicht im Gerät. Sie geht niemanden
an außer den, der spielt.

### 📐 Die Tische bekommen die Breite ihres Fensters

Die Rennbahn war nicht immer gleich breit. Der Grund stand eine Ebene
höher: `.automat-mitte` zentrierte mit `align-items:center` und stand
in der Datei **hinter** allen fünf Tischen — deren `stretch` kam nie an.
Der Filz war dadurch so breit wie sein längster Satz, und weil auf der
Rennbahn der Ruf des Ansagers *im* Filz steht, wechselte die Bahn bei
jedem Zwischenruf die Breite. Am Telefon fiel es nicht auf: dort ist das
Fenster ohnehin so schmal wie der Text.

Gemessen: 229 Punkte Bahn in einem 700 Punkte breiten Fenster, jetzt 674
— und über einen ganzen Lauf hinweg dieselben 674.

**Ab Tabletbreite wächst damit das Spiel und nicht der Rand.** Eine
Spielkarte von 46 Punkten sah auf 620 Punkten Filz aus wie ein
Daumennagel; sie ist jetzt 58 × 83, dazu ein größerer Einsatzkreis und
höhere Tasten. Craps bekommt Würfel von 52 statt 40. Am Telefon bleibt
alles, wie es war.

### 🧔 Der Wirt steht am Tisch

Er sagt jetzt etwas zu Gewinn und Verlust — an den drei Tischen, an
denen jemand gibt: **Roulette, Blackjack, Craps**. Nicht am Automaten
und nicht an der Rennbahn; dort steht er nicht daneben, und ein Wirt,
der überall gleichzeitig steht, ist keiner.

Er bekommt, **was gefallen ist**, nicht nur ob gewonnen wurde. Zum
Blackjack, zur Null, zur Sieben nach einem Punkt hat er etwas Eigenes zu
sagen, zum Gewöhnlichen etwas Gewöhnliches — aber nie zweimal
hintereinander dasselbe.

Und er schweigt, wenn nichts entschieden wurde: ein Crapswurf mit
stehendem Punkt entscheidet oft gar nichts, die Passe bleibt liegen.
„Kleiner Verlust“ wäre dann schlicht gelogen.

Seine Zeile hält ihren Platz auch leer. Ein Tisch, der bei jeder
Abrechnung um eine Zeile wächst und danach wieder schrumpft, ruckelt bei
jedem Wurf.

### 🃏 Blackjack bekommt einen Takt

Bisher lagen vier Karten im selben Augenblick da, der Wirt zog fertig,
es war abgerechnet — wer hinsah, hatte nichts gesehen.

Jetzt kommt **eine Karte nach der anderen**, in der Reihenfolge des
Tisches: Spieler, Wirt, Spieler, und die zweite des Wirts verdeckt
zuletzt. Der Wirt zieht einzeln, mit Pause dazwischen — wer auf die
Sechzehn hofft, soll den Augenblick haben —, und vor dem Aufdecken wie
vor dem Abrechnen liegt noch einer. Jede Karte kommt dabei von der Seite
des Schlittens hereingeflogen; bei `prefers-reduced-motion` gar nicht.

**Die Tafel lässt sich abschalten.** Ein Schalter in der Ecke des
Filzes: aus heißt kein hervorgehobener Knopf und kein „Die Tafel rät“,
nur noch „12 gegen 9“. Ob man die Grundstrategie sehen will, ist
Geschmack und keine Hausregel — die Wahl liegt deshalb im Gerät, jeder
stellt sie für sich und niemand für andere.

### 🎲 Zwei Stellen, an denen Platz leer stand

**Der Würfelbalken bei Craps** zählt jetzt die Serie des Schützen. Das
ist, was an einem Crapstisch ohnehin jeder mitzählt — und gezählt wird
nicht nach Würfen, sondern nach der letzten Sieben: sie beendet jede
Serie.

**Neben dem Roulettekessel** standen 596 × 77 Punkte leer, während die
Abrechnung darunter Platz brauchte. Dort steht jetzt der Zettel: vor dem
Wurf, was auf dem Tapis liegt, danach, was es gebracht hat — so wie es
der Croupier neben dem Kessel ansagt. Die Spalte ist immer da und immer
gleich hoch, das Fenster wechselt seine Höhe beim Wurf also nicht mehr.
Am Telefon gibt es sie nicht; dort ist daneben kein Platz.

### 🪟 Ein Fenster, das man nicht mehr sieht, ist verloren

Beide Fensterarten merken sich ihren Platz in Bildpunkten vom linken
oberen Eck. Wurde das Browserfenster kleiner, blieben sie liegen, wo sie
lagen — also draußen, mitsamt ihrem Abbrechen-Knopf.

Sie holen sich jetzt zurück ins Bild, und die Bearbeiten-Fenster werden
schmaler, wenn es sonst nicht mehr passt; wird wieder Platz, bekommen
sie ihre alte Breite zurück. Beim Tavernenschirm stand das sogar schon
da — nur im falschen Bauteil: der Aufruf saß seit dem Umbau auf die
Halle im Automaten, wo es kein `setPos` mehr gibt, und warf jedes Mal
einen Fehler.

Es gilt auch beim Tischwechsel: der Roulettetisch ist 780 breit, und auf
einem schmalen Schirm rückt das Fenster dafür von selbst nach links.

### 🧪 Tränke mit Wirkung

Ein Gegenstand darf jetzt dieselbe Wirkung tragen wie ein Zauber — Art,
Würfel, Schadensart, Rettungswurf, halber Schaden, Fläche. Damit rechnet
das Zugfenster auch beim Heiltrank, statt ihn nur zu protokollieren, und
**der Schalter steht schon auf Heilung**, wenn die Wirkung heilt;
umlegen lässt er sich trotzdem.

Der Gradwähler bleibt beim Zauber: ein Trank hat keinen Grad.

Die Felder stehen im Editor nur da, wenn **im Kampf zu verwenden**
angehakt ist — sonst stünden sie am Seil und an der Winterdecke. Und
„↧ Aus der Beschreibung lesen“ gibt es auch hier: „Du erhältst 2W4+2
Trefferpunkte zurück“ trägt sich damit selbst ein. Ohne Angaben bleibt
der Gegenstand, was er war.

### ⏱ Zwei Sekunden im Kampf

Vier waren zu viel. Die Spielleitung saß schon am nächsten Zug, wenn
beim Spieler **„du bist dran“** aufleuchtete. Teuer ist der schnellere
Takt nicht: die Anfrage trägt einen Stand mit und bekommt nichts zurück,
wenn sich nichts bewegt hat.

Ein verstecktes Fenster fragt weiterhin gar nicht — und wer zum Fenster
zurückkommt, bekommt sofort den Stand von jetzt statt den von vor zwölf
Sekunden.

### 🩹 Behoben

- **Unter den Knöpfen des Roulettetisches stand ein leerer Streifen.**
  Zwei Ursachen: eine Meldezeile, die fast immer leer war, und 40 Punkte
  Polster, die am Telefon Rollraum sind und auf dem Schreibtisch nichts.
  Die Meldung steht jetzt in der Hinweiszeile über dem Tapis — die sagt
  ohnehin, was zu tun ist, und wenn etwas dazwischenkam, sagt sie das
  statt dessen. Das Fenster ist damit 714 statt 792 Punkte hoch und
  rollt nicht mehr.
- Und noch einmal dieselbe Falle wie bei der Breite: die Tablet-Regel
  für die Mitte stand in der Datei **vor** ihrer Grundregel und kam nie
  an. Die Grundregel steht jetzt davor.
- Drei tote Regelsätze in der Taverne: `.rn-mitte`, `.cr-mitte`,
  `.rlt-mitte` und `.bj-mitte` sagten seit v4.7 dasselbe wie die Regel,
  die sie überschrieb — jetzt sagen sie nichts mehr, weil es die Regel
  selbst tut.
- Der Wirt sprach beim ersten Versuch auch dann von Verlust, wenn der
  Wurf nur den Punkt gesetzt hatte.

## v4.7

Die Ausgabe der Taverne. Aus einem Automaten wird ein Haus mit fünf
Tischen — Blackjack, Roulette samt Rennbahn, Craps und ein
Pferderennen, das wirklich gelaufen wird. Der Beutel hängt jetzt am
Helden, und wer will, spielt mit echtem Gold aus dem Bogen.

Gebaut in sieben Stufen, jede für sich fertig; der Plan dazu steht in
der `TAVERNE.md`.

### 🍺 Die Spielhalle

Die Taverne ist ein Eingang mit Tischen geworden. Je Tisch eine Zeile:
was er ist, und rechts, **was er kostet** — der Hausvorteil steht
sichtbar davor, nicht im Kleingedruckten.

Der Weg zurück in die Halle steht links im Kopf, neben dem Namen des
Tisches. Nicht, während die Walzen laufen oder die Würfel rollen: ein
Einsatz, der unterwegs ist, gehört zu Ende gespielt.

In den Einstellungen des Abenteuers steht, **welche Tische aufgebaut
sind**. Ein geschlossener Tisch steht nicht in der Halle; wer gerade
daran sitzt, wird zurückgeschickt.

### 👛 Der Beutel hängt am Helden

Bisher lag in der Taverne ein Beutel, gleichgültig wer spielte — die
Marken standen im Gerät. Jetzt hat **jeder Held seinen eigenen**.
Welcher auf dem Tisch liegt, sagt der offene Bogen; ist keiner offen,
der zuletzt bespielte. Wer zwei Charaktere gleichzeitig spielt, wechselt
ihn im Kopf des Fensters — nicht mitten im Lauf, sonst fänden die Marken
den falschen Beutel.

Was früher im Gerät lag, bekommt der erste Held, der die Taverne
betritt.

### 🃏 Blackjack

Sechs Blätter im Schlitten, bei drei Vierteln kommt ein neuer — das ist
die Stelle, an der ein Kartenzähler aufhört zu zählen. Blackjack zahlt
**3:2**, Versicherung 2:1. Verdoppeln auf **9, 10 und 11**, Teilen bis
zu drei Blätter, geteilte Asse bekommen je eine Karte und stehen dann.

Alles davon steht aufgedruckt auf dem grünen Filz, samt der Zahl der
Blätter, die noch im Schlitten liegen. Wer am Tisch nach den Regeln
fragen muss, spielt gegen jemanden, der sie besser kennt.

**Die Tafel rät mit:** die Grundstrategie hebt den Knopf hervor, den sie
empfiehlt — gedrückt wird trotzdem selbst. Auch die Versicherung sagt
selbst, dass sie auf Dauer verliert.

### 🎡 Französisches Roulette

Ein Zéro statt zwei, der Kessel in seiner echten Reihenfolge, und **La
Partage**: fällt die Null, kommt bei den einfachen Chancen die Hälfte
zurück. Das drückt den Hausvorteil von 2,7 % auf **1,35 %** und macht
diesen Tisch zum mildesten im Haus.

Mehrfachwetten werden nicht über die Ränder zwischen den Feldern gelegt
— auf einem Berührschirm trifft das niemand. Du sagst vorher, was du
legen willst — **Plein · Cheval · Transversale · Carré · Sixain** — und
tippst dann die Zahlen an; der Tisch prüft, ob sie aneinanderstoßen, und
sagt es, wenn nicht. Der Jetonturm steht auf der kleinsten Zahl der
Wette, und jede gedeckte Zahl bekommt einen Saum.

**🏁 Die Rennbahn** ist der Kessel, ausgerollt, in einem kleinen Fenster
über dem Tisch: die Null an der Kehre, dann einmal herum und auf der
unteren Spur zurück. Vier Ansagen — Zéro-Spiel, Große Serie, Kleine
Serie, Waisen — legen ihre Stücke so, wie sie am Tisch gelegt werden:
als Chevals, Transversalen und ein Carré, nicht als Zahlenliste. Dazu
Nachbarn von 1–1 bis 4–4 en plein.

### 🎲 Craps

Zwei Würfel, ein Punkt. Der erste Wurf entscheidet sofort — 7 und 11
gewinnen die Passe, 2, 3 und 12 verlieren sie — oder setzt den Punkt;
von da an gilt nur noch die eine Frage: kommt der Punkt vor der 7?

Drin ist alles, was dazugehört: Pass und Don't Pass (Bar 12), Come und
Don't Come mit eigenen Punkten, Place auf 4 bis 10, das Feld für einen
Wurf, die Mitte mit Hart 6, Hart 8, Allen Craps und der Jeden 7.

Und die **Odds** hinter der Passe, höchstens dreifach, zur wahren Quote:
2:1 auf 4 und 10, 3:2 auf 5 und 9, 6:5 auf 6 und 8. **Kein Hausanteil**
— es ist die einzige Wette im Haus, an der das Haus nichts verdient, und
genau so steht sie da. Die *Jede 7* steht dafür rot: mit 16,7 % ist sie
die teuerste des Hauses. Am Tisch sagt das niemand.

Der Tisch lässt nur zu, was die Regel zulässt — Passe nur vor dem Punkt,
Come und Place nur danach, Odds nur hinter einer Passe — und sagt den
Grund, statt still abzulehnen.

### 🐎 Das Pferderennen

Kein Zufallsgenerator, der am Ende einen Sieger zieht und die Bewegung
dazu erfindet: **das Rennen wird gelaufen.** Sechs Pferde mit Tempo,
Ausdauer, Antritt und Laufstil; alle halbe Sekunde ein Schritt, und der
Kraftverbrauch steigt mit der vierten Potenz des Tempos — wer vorn zu
schnell geht, bezahlt es im Schlussbogen. Deshalb siehst du ein
Führpferd führen und einen Steher kommen.

Und weil das Rennen simuliert wird, **kommen die Quoten daraus**: vor
jedem Lauf werden 2500 Rennen im Stillen durchgerechnet, die Trefferzahl
ist die Wahrscheinlichkeit, ihr Kehrwert abzüglich 12 % die Quote.
Niemand kann die Quote von der Wirklichkeit trennen — es ist dieselbe
Rechnung.

Gewettet wird auf **Sieg, Platz, Zwilling und Einlauf**. Was in 2500
Läufen nie vorkam, nimmt das Haus nicht an. Strecke (1400–2000 m) und
Boden (fest, gut, weich) wechseln je Lauf und stehen beide in den
Quoten: über 1400 m bleibt allen etwas übrig und der Antritt
entscheidet, über 2000 m kommen alle leer ins Ziel und der Steher
gewinnt.

### ◉ Echtes Gold

Genau dafür hängt der Beutel am Helden. In den Einstellungen des
Abenteuers steht die Wahl:

- **⛃ Spielmarken** — wie bisher, im Gerät, berühren keinen Bogen.
- **◉ Echtes Gold** — aus dem Bogen, über den Server, Teil der Kampagne.
  Dann gilt eine kleinere Einsatzleiter: 1, 2, 5, 10. Fünfzig Goldmünzen
  sind kein Zeitvertreib mehr, sondern eine Rüstung.

Dazu ein **Höchstverlust je Tag und Held**. Er deckelt nicht den Bogen,
sondern was auf dem Tisch liegt: wer 40 Gold hat und 10 verspielen darf,
sieht am Tisch 10 — der Rest taucht dort gar nicht erst auf. Gezählt
wird gegen den Stand des Tagesanfangs, damit auch stimmt, wer erst
verliert und dann zurückgewinnt.

Wer die Taverne verlässt, hinterlässt **eine Zeile im Abenteuerlog**:
gesetzt, zurück, unterm Strich. Nicht jeder Dreh — das wären dreißig
Zeilen je Abend.

### 🧔 Der Wirt

Drei Hausregeln je Abenteuer, jede mit ihrem Preis daneben:

| Regel | an | aus |
|---|---|---|
| La Partage am Roulettetisch | 1,35 % ans Haus | 2,7 % |
| Der Wirt zieht auf weicher 17 | gut 0,2 % mehr fürs Haus | er bleibt auf jeder 17 |
| Die Mitte des Crapstisches | zahlt am besten, kostet am meisten | abgeräumt |

Was gilt, steht am Tisch selbst und nicht nur in den Einstellungen — der
Roulettetisch schreibt seinen eigenen Hausvorteil hin, der Filz die
Regel des Wirts. Eine Einstellung, die man am Tisch nicht sieht, ist
eine Falle.

Dazu eine **Statistik je Held**: Runden, gesetzt, zurück, unterm Strich
und die längste Serie in beide Richtungen. Und der Wirt selbst steht in
der Halle und sagt etwas dazu — aus dem, was dasteht, nicht aus dem
Nichts.

### 🎨 Die Taverne im Farbschema des Heldenbuchs

Sie trug eine eigene Farbwelt: warmes Messing auf Rauch, noch aus der
Zeit, als das Heldenbuch selbst golden war. Beim Aufmachen wechselte das
ganze Bild die Temperatur.

Sie trägt jetzt dieselben Farben wie alles andere. **Warm bleibt nur,
was Geld ist** — Marken, Einsätze und Gewinne stehen in Bernstein.
Grün bleibt, was am Tisch grün ist: Blackjack, Craps und der
Roulettetapis liegen auf Filz, so wie sie es überall tun.

### 📐 Größer, wo Platz ist

Ab Tabletbreite bekommt jeder Tisch die Breite, die er braucht —
Automat 520, Blackjack 620, Rennen 700, Craps 720, **Roulette 780** —
nie mehr, als der Schirm hergibt. Auf dem Telefon füllt er ihn wie
bisher. Dazu bis zu 900 Punkte Höhe statt 760.

### 🩹 Behoben

- **Das Roulettefenster wurde beim Spielen länger und wieder kürzer.**
  Drei Ursachen: die Knopfreihe brach um, die Abrechnung wuchs mit jeder
  Gewinnzeile, und der Fuß wechselte zwischen einer und zwei Reihen.
  Jetzt ein Raster mit fester Zeilenhöhe, eine Abrechnung, die in ihrem
  eigenen Kasten rollt, und ein Fuß, dessen Hauptknopf sein Wort
  wechselt.
- Der Rennbahn-Knopf hieß intern wie die Rennbahn selbst und erbte
  deren Rand — er saß dadurch tiefer als die anderen fünf.

## v4.6

Die Ausgabe der Fenster. Dreißig Dialoge, die bisher als Vorhang vor
allem lagen, lassen sich jetzt beiseite schieben und zuklappen — und die
fünf, in denen wirklich gearbeitet wird, haben Arbeitsbreite bekommen.

### 🪟 Dialoge sind Fenster

Jeder Dialog war ein Vorhang. Er lag in der Mitte, nahm den ganzen
Schirm, und wer nachsehen wollte, was dahinter steht — der eigene Bogen,
die Liste, der laufende Kampf —, musste ihn schließen und die Eingaben
aufgeben.

Jetzt hat jeder Dialog eine Titelzeile mit zwei Knöpfen:

- **▾ zuklappen.** Es bleibt nur die Titelzeile stehen, und der Vorhang
  fällt weg: das Heldenbuch dahinter ist wieder zu bedienen. Der Dialog
  wartet als schmaler Balken, bis du ihn mit **▴** wieder aufklappst.
  Nichts geht dabei verloren — was eingetippt ist, steht nach dem
  Aufklappen noch da.
- **✕ schließen.** Wo ein Dialog keinen Klick auf den Hintergrund kennt,
  drückt das Kreuz seinen eigenen *Abbrechen*.

**Geschoben wird an der Titelzeile.** Ab Tabletbreite: anfassen,
hinlegen, dort bleibt es. Auf dem Telefon geht der Dialog weiter von
unten auf — ein schwebendes Fenster auf einem Telefon wäre eine
Fingerübung — und **zugeklappt liegt der Balken über der Reiterleiste**,
ohne sie zu verdecken. Damit kommt man auch dort an seinen Bogen, ohne
den Dialog zu verlieren.

Dazu, was ein Fenster sonst noch braucht: **der Titel bleibt beim Rollen
oben stehen, der Fuß mit Abbrechen und Speichern unten.** In einem
langen Formular sucht man den Speichern-Knopf nicht mehr am Ende.

Nicht umgebaut, weil es keinen Sinn ergibt: die Sicherheitsabfrage, die
beantwortet werden will, Symbol- und Platzwahl, die über einem anderen
Fenster liegen, sowie Münzfeld und Bildbetrachter.

### 🔎 Der Hintergrund ist wieder scharf

Der Vorhang zeichnete alles dahinter weich. Ein Fenster schiebt man aber
beiseite, um daneben zu lesen — und weich gezeichnet war dort nichts
mehr zu lesen. Schlimmer noch: sobald das Fenster beim Schieben auf feste
Lage umsprang, hatte der Weichzeichner nichts mehr zu zeichnen und ließ
nur Grau stehen.

Er ist weg, der Vorhang von 0.8 auf 0.62 aufgehellt, und **sobald ein
Fenster verschoben ist, verschwindet er ganz** — wie beim Zuklappen.
Dahinter lässt sich dann auch wieder arbeiten.

### 📐 Fünf Fenster in Arbeitsbreite

Waffe, Zauber, Merkmal, Notiz und Gegenstand sind die Fenster, in denen
wirklich gearbeitet wird. In 480 Punkten Breite stand darin alles
untereinander: sechs kurze Felder auf sechs Zeilen, dann drei
Textblöcke — man rollte durch ein Fenster, das halb leer war.

| Fenster | vorher | jetzt |
|---|---|---|
| Zauber | 480 | **880** |
| Gegenstand | 520 | **840** |
| Waffe | 480 | **820** |
| Notiz | 520 | **780** |
| Merkmal | 480 | **700** |

Ab 900 Punkten Schirmbreite — also auch auf dem Tablet — liegt darin ein
Raster aus sechs Spalten: ein kurzes Feld nimmt zwei davon, drei stehen
nebeneinander; ein halber Block nimmt drei, zwei stehen nebeneinander;
ein ganzer alle sechs.

Damit steht beim **Zauber die Beschreibung neben der Wirkung im Kampf**,
bei der **Waffe die Beschreibung neben dem Bild**, beim **Merkmal der
Name neben der Quelle**. Grad, Schule, Wirkzeit, Reichweite, Dauer und
Komponenten stehen zu dritt in zwei Zeilen statt zu zweit in dreien. Das
Zauberfenster ist damit 699 statt gut 1000 Punkte hoch — es passt wieder
auf einen Schirm.

### 👆 Am Tablet fingergerecht

In den Fenstern sind Eingabefelder jetzt 15 px mit 10 px Polster,
*Speichern* und *Abbrechen* 42 Punkte hoch und die Fenstergriffe 36. Auf
Berührschirmen allgemein 34.

### 🩹 Behoben

- **Weißer Bildschirm bei manchen Bögen.** Ein Bogen ohne Zauber- oder
  Waffenliste — so kommen sie von älteren Ständen und von außen herein —
  riss den Zauber- bzw. den Aktionenreiter mit. Jetzt nicht mehr.

## v4.5

Die Ausgabe, in der die Runde mitsieht. Der Kampf liegt nicht mehr
allein im Gerät der Spielleitung: er steht auf dem Server, jeder am
Tisch sieht ihn — verschleiert, so wie im Bogen —, und wer dran ist,
kann selbst ansagen, was er vorhat. Dazu Flächenzauber, Resistenzen,
Gegenstände und Merkmale im Zug, und eine mobile Fassung, die
nachgemessen ist.

### 👁 Die Spieleransicht

Bisher lag der Kampf allein im Gerät der Spielleitung. Das war richtig,
solange ihn niemand sonst brauchte. Jetzt liegt er auf dem Server, und
wer nicht leitet, fragt alle paar Sekunden nach: während eines Kampfes
alle vier, sonst alle zwölf, und gar nicht, wenn das Fenster im
Hintergrund liegt. Die Antwort ist eine Zahl; der Rest kommt nur, wenn
sie sich bewegt hat.

Zu sehen ist die Reihenfolge, wer am Zug ist und wie es den Figuren
geht. Der eigene Held ist hervorgehoben.

**Was nicht zu sehen ist**, ist der eigentliche Punkt: die Trefferpunkte
der Gegner, ihre Rüstungsklasse, die Notizen der Spielleitung und das
Protokoll. Und zwar nicht, weil die Ansicht sie wegließe — **der Server
schickt sie gar nicht erst mit**. Verschleiern im Browser wäre keine
Verschleierung.

Beim Gegner steht deshalb immer der Zustand statt der Zahl, „Verwundet"
mit grobem Balken. Bei den Helden gilt dieselbe Regel wie im Bogen:
zeigt das Abenteuer die Punkte offen, stehen die Zahlen da, sonst auch
dort der Zustand.

Drei Einstellungen je Abenteuer, unter **Was die Runde sieht**:

- **Von allein** — sobald ein Kampf läuft, geht er bei den Spielern auf.
- **Auf Ansage** — erst wenn du im Tracker auf *Zeigen* drückst. Der
  Knopf steht dann oben neben dem Protokoll.
- **Gar nicht** — der Kampf bleibt bei dir, wie bisher.

Entschieden wird auch das auf dem Server: bei *gar nicht* und bei *auf
Ansage* ohne Freigabe liefert er nichts aus, nicht einmal die Namen.

### 🪟 Und zwar als Fenster, nicht als Vorhang

Beim Spieler liegt der Kampf in einem Fenster derselben Bauart wie die
Taverne: es liegt über der Anwendung, nimmt aber keine Klicks weg. Wer
mitten im Kampf in seinem Bogen nachsehen will, tippt einfach dorthin.
Am Kopf schiebt man es dahin, wo es nicht stört, und dort bleibt es —
die Stelle steht im Gerät und überlebt das Neuladen. Am schmalen Schirm
füllt es den Schirm; ein schwebendes Fenster auf einem Telefon wäre eine
Fingerübung.

### 📣 Der Spieler sagt an, du trägst ein

In der Spieleransicht steht **Ansagen, was du tust**. Darin dieselbe
Auswahl wie bei dir: seine Waffen, sein Zauberbuch mit Suchfeld, der
Gradwähler mit seinen Plätzen — und die Ziele als Kacheln ohne Zahlen,
so wie der Server sie liefert. Dazu ein Satz.

Zahlen kommen dabei nicht vor. Wie viel ankommt, weiß er nicht, und die
Trefferpunkte der Gegner gehen ihn nichts an. Die Zahlen trägst
weiterhin du ein.

Bei dir steht im Kampfkopf **Ansagen · N**. Die Tafel zeigt, wer was
vorhat; *Eintragen* öffnet das Zugfenster für diesen Helden — mit dem
angesagten Zauber, dem angesagten Grad, dem Satz und **den schon
angekreuzten Zielen**. Übernehmen nimmt die Ansage aus der Liste.

Die Ansagen stehen auch im Zugfenster selbst: oben, was dieser Held
angesagt hat, mit *↧ übernehmen*; darunter blasser, was die anderen
vorhaben. Du arbeitest die Runde in diesem einen Fenster ab und siehst
dabei, was noch kommt.

### 🧪 Gegenstände und ⭐ Merkmale im Zug

Das Zugfenster hat fünf Arten statt drei: **⚔ Angriff · ✨ Zauber ·
🧪 Gegenstand · ⭐ Merkmal · ✍ Nur beschreiben**.

**Gegenstand** bietet an, was im Inventar als *„⚔ Im Kampf zu
verwenden"* angehakt ist und wovon noch etwas da ist — Tränke,
Schriftrollen, Öle. Das Häkchen sitzt im Gegenstandsformular neben Menge
und Gewicht; ohne es stünden dort auch Seil und Winterdecke.

**Benutzen zieht ab.** So wie der Zauberplatz abgehakt wird, sinkt die
Menge im Bogen um eins — ein Trank wurde bisher daneben erzählt, von
Hand verrechnet und im Bogen selbst abgezogen. Bei null fällt der
Gegenstand aus der Auswahl, bleibt aber im Inventar stehen;
nachgefüllt wird außerhalb des Kampfes. Im Protokoll steht dann:

      Gegenstand: Trank der Heilung
      Trank der Heilung verbraucht · noch 2
      Brunhilde wird um 9 geheilt · 18 → 27

**Merkmale** werden nicht gekennzeichnet: welches im Kampf taugt, weiß
der Spieler besser als der Bogen. Sie stehen sortiert wie im Bogen, mit
Suchfeld ab sechs Einträgen.

Beides steht auch dem Spieler zur Ansage offen — es ist dieselbe
Auswahl.

### 💥 Flächenzauber, Resistenz und Immunität

Beim Feuerball stand dieselbe Zahl viermal da, einmal je Ziel. Zauber
tragen jetzt ein Merkmal **Fläche — eine Zahl für alle**. Ist es
gesetzt, steht der Schaden einmal oben, und bei jedem Ziel nur noch, ob
sein Rettungswurf gelang; daneben, was dabei herauskommt: 22, oder 11
für den, der besteht.

*↧ Würfel nachtragen* erkennt es am Text der Vorlage — „jede Kreatur",
oder ein Rettungswurf zusammen mit Radius, Kegel, Sphäre, Linie.
Feuerball, Blitz und Sprühende Farben kommen so als Fläche herein,
Magisches Geschoss und Schockgriff nicht: dort bleibt es bei einer
eigenen Zahl je Ziel — drei Geschosse, drei Ziele, drei Werte.

Dazu je Ziel ein Schalter: **voll · ½ Res. · immun**. Die Reihenfolge
ist die des Regelwerks — erst der Rettungswurf, dann die Minderung. 22
wird zu 11 für den, der besteht; mit Resistenz zu 5; wer immun ist,
nimmt nichts. Im Protokoll steht es dabei: *„nimmt 5 Schaden —
Resistenz"* und *„Wolf 1 ist immun gegen Feuer"*.

Wo der Bogen die Resistenz kennt — ein Held mit dem Merkmal *Resistenz:
Feuer* —, ist sie bei einem Feuerzauber vorgewählt. Ändern kannst du sie
trotzdem: eine Resistenz hängt oft am Umstand und nicht nur am Bogen.
Beim Gegner, dessen Resistenzen ohnehin nur als Text auf dem Bogen
stehen, ist der Schalter der einzige Weg.

### 📱 Die mobile Fassung, nachgemessen

Nicht geschätzt, sondern bei 375 Punkten Breite jede Ansicht
durchgegangen und jedes Bedienelement vermessen.

**Der Kampftracker** war der schlimmste Fall: die Kopfzeile nahm 211
Punkte, jede Kampfzeile 354 bis 389. Von 812 Punkten Schirm blieb Platz
für anderthalb Figuren — wer wissen wollte, wer als nächstes dran ist,
musste durch eine Wand aus Tasten scrollen. Jetzt ist eine zugeklappte
Zeile wieder eine Zeile: Initiative, Name, Zustände, Rüstungsklasse und
Trefferpunkte nebeneinander, 101 statt 354 Punkte. Notiz und
Tastenblock kommen, wenn man sie antippt, und bei dem, der dran ist,
sind sie von selbst da. Sechs Figuren passen auf einen Schirm statt
anderthalb. Die Kopfzeile trägt nur noch, was in jeder Runde gebraucht
wird — alles Seltenere steht hinter dem **⋯**-Knopf. Und wer dran ist,
rückt nach *Nächster Zug* von selbst ins Bild.

**Überall sonst** ging es um Fläche unter dem Daumen. Alles hier war
unter 34 Punkten hoch und ist es nicht mehr: die Hinzufügen-Knöpfe im
Bogen, der Name des Helden im Kopf, *Alle Slots wiederherstellen*, das
Kreuz an einer Notiz, der Tauschgriff an einem Ausrüstungsplatz, die
Filtermarken in Zauberbuch, Log und Abenteuerlog, die Werkzeugleiste des
Texteditors, *Abbrechen* und *Speichern* in jedem Fenster, die Kopfzeile
eines Einstellungsblocks, die Löschkreuze in Listen und die Reiter der
Datenbank. Auf breitem Schirm ändert sich nichts.

**Und was ganz fehlte:** in der schmalen Heldenleiste standen Konto,
DM-Modus, Neuladen und Abmelden nicht — am Telefon kam man damit weder
in die Spielleitung hinein noch wieder heraus. Die Reihe steht jetzt
auch dort.

### 🛡 Ein Wappen

Das Zeichen ist das schwarze Lederbuch mit dem gotischen H, dem roten
Band und den Beschlägen — im Kopf der Heldenleiste, im Browser-Tab und
auf dem Startbildschirm. Weil es keinen Schriftzug trägt, steht der Name
wieder darunter, mit der Ausgabe als kleinem Schild daneben.

## v4.4

Die Ausgabe, in der die Spielleitung den Schaden nicht mehr zweimal
einträgt. Dazu ein Wappen, aufgeräumte Einstellungen und Zauber, die
wissen, was sie tun.

### ✍ Das Zugfenster

Bisher hast du den Schaden über *Schaden…* eingetragen und daneben
aufgeschrieben, was eigentlich passiert ist — zweimal dieselbe Sache.
Das Zugfenster dreht die Reihenfolge um: du sagst, **was** geschieht,
und die Trefferpunkte fallen als Nebenprodukt ab.

Auf der Karte dessen, der am Zug ist, steht **✍ Zug eintragen**. Nur
dort, nur auf Knopfdruck: ein Fenster, das bei jedem Zugwechsel von
allein aufgeht, ist nach drei Runden abgeschaltet.

Darin, von oben nach unten:

- **Was tut er** — Angriff, Zauber oder nur beschreiben. Was der Bogen
  nicht hergibt, ist ausgegraut.
- **Womit** — seine Waffen mit ihrem Schadenswürfel, oder sein
  Zauberbuch nach Grad sortiert. Ab sechs Einträgen steht ein Suchfeld
  darüber: es sucht über Namen, Schule, Schadensart und Grad.
- **Auf wen** — die Initiativliste als Kacheln mit Rüstungsklasse und
  Trefferpunktbalken. Mehrere gehen, für den Feuerball.
- **Was ankommt** — je Ziel *Treffer* oder *daneben* und der Wert.
  Gewürfelt wird am Tisch; den gewürfelten Wert kannst du daneben
  eintragen, dann steht er im Protokoll, musst du aber nicht.
- **Beschreibung** — freiwillig, ein Satz zum Zug.
- **Und darunter steht schon da, was gleich im Protokoll stehen wird** —
  samt Trefferpunkten davor und danach. Der Knopf sagt selbst, was er
  tut: „✓ Übernehmen — trägt 7 TP ab".

**Zusätzlicher Schaden.** Eine brennende Klinge macht zweierlei: neben
dem Schadensfeld sitzt **＋ Art**, jede weitere Zeile hat ihre eigene
Art und ihren Wert. Im Protokoll steht dann
*„Wolf 1 nimmt 9 Schaden (6 Hieb + 3 Feuer) · 11 → 2"*.

**Mehrere Aktionen im selben Zug.** **+ und weiter** trägt ein und lässt
das Fenster offen; Waffe, Zauber und Grad bleiben stehen, weil der
zweite Hieb meistens derselbe ist. Was im Zug schon eingetragen wurde,
steht in der Vorschau darüber — du hast den ganzen Zug vor dir.

**Bei Gegnern** gibt es keine Auswahl: nur wem wie viel Schaden oder
Heilung, plus Beschreibung. Ein Gegner hat im Heldenbuch keine
Waffenliste, seine Angriffe stehen im Text seines Bogens.

Ein Schalter in den Einstellungen des Abenteuers blendet den Knopf ganz
aus, für Runden, die ohne Mitschrift spielen.

### ✨ Zauber wissen jetzt, was sie tun

Am Zauber stand bisher, was er **ist** — Grad, Schule, Reichweite,
Dauer. Nicht, was er **tut**. Dafür gibt es jetzt ein Feld: Art,
Würfel, Steigerung je Grad, Rettungswurf und ob Bestehen halbiert.

Eintippen musst du das meistens nicht. Im Zauberreiter des Bogens steht
**↧ Würfel nachtragen** — ein Druck liest es aus den Beschreibungen und
trägt es bei allen Zaubern des Helden ein. Er fasst nur an, wo noch
nichts steht, rührt nichts an, wo die Beschreibung keinen Würfel
hergibt, und sagt danach, wie viele es waren. Im Zauberformular gibt es
denselben Knopf für einen einzelnen.

Damit kann das Zugfenster rechnen:

- **Der Gradwähler** zeigt deine Zauberplätze mit ihrem Rest, rechnet
  den Wurf hoch — Feuerball auf dem 4. Grad ist 9W6 — und **hakt den
  Platz im Bogen ab**. Die dritte Buchführung fällt weg.
- **Beim Rettungswurf** steht statt *Treffer/daneben* ein
  *misslungen/bestanden*, der Zauber-SG steht daneben, und Bestehen
  halbiert den eingetragenen Schaden von selbst.

### 🎓 Klassen haben ein Zauberattribut

In einer festen Tafel im Code stand, womit die zwölf des Regelwerks
zaubern. Eine Hausklasse hatte deshalb **nie** einen Zauber-SG und nie
einen Zauberangriff. Jetzt steht das Attribut in der Klassenliste des
Abenteuers, wahlweise „zaubert nicht", und die zwölf bringen ihren Wert
aus dem Regelwerk mit.

### ⚙ Einstellungen, aufgeräumt

Die Einstellungen des Abenteuers und die Verwaltung bestehen jetzt aus
Abschnitten, die zugeklappt aufgehen. Neben dem Titel steht, was gerade
gilt — „Offen", „89 % · Vollbild 1 auf 200", „3 von 3 zugeordnet",
„12 Klassen", „5 Konten". Zugeklappt sieht man damit mehr als vorher im
Aufgeklappten. Der lange Teil hat außerdem eine eigene schmale
Rollleiste bekommen statt der grauen des Systems.

### 🛡 Ein Wappen

Das Heldenbuch hat ein Zeichen: zwei Drachen über einem aufgeschlagenen
Bogen, ein W20 in der Mitte, das Band mit dem Namen darunter. Es steht
im Kopf der Heldenleiste und ist zugleich das Symbol im Browser-Tab und
auf dem Startbildschirm. Der Schriftzug darunter ist weg — der Name
steht im Wappen.

### 🔕 Die Leiste ist still geworden

Unten stand „STRAHD · Verbunden". Verbunden zu sein ist
selbstverständlich, seit sich jeder anmeldet, und die Gruppe steht am
Konto. Die Zeile erscheint nur noch, wenn sie etwas zu sagen hat: nicht
gesichert, oder der Server schweigt. Die Ausgabe steht dafür oben am
Wappen.

## v4.3

Eine Ausgabe für den Kampftisch. Der Tracker bekommt eine Vorbereitung,
das Protokoll schreibt von allein mit und wirft nichts mehr weg.

### ⚔ Erst aufstellen, dann kämpfen

Der Tracker geht nicht mehr mitten in Runde 1 auf, sondern in der
**Vorbereitung**: Gegner dazustellen, Initiativen ansagen, Helden ein-
und ausladen. Erst **▶ Kampf starten** macht daraus Runde 1.

Man sieht es an der Farbe. Der Kampf ist rot und golden, die
Vorbereitung blau — Kopfzeile, das Abzeichen „Vorbereitung“, der
Startknopf und ein Band über der Liste. Statt „Am Zug“ steht dort, wer
aufgestellt ist.

Was in der Vorbereitung geschieht, kommt nicht ins Protokoll. Einen
Gegner hinstellen und einem Helden die Trefferpunkte richtigstellen ist
kein Teil des Kampfes und stünde sonst schon in Runde 1, bevor der
Kampf begonnen hat.

### ⏹ Beenden führt zurück, nicht hinaus

**Kampf beenden** stellt wieder die Vorbereitung hin: Gegner erledigt,
Initiativen leer, Helden bereit. Am Tisch folgt auf einen Kampf
meistens der nächste, nicht das Heldenbuch.

### 📜 Das Protokoll schreibt mit

Im Kampf läuft im Hintergrund eine Mitschrift: wer am Zug ist, wer
Schaden nimmt, wer geheilt wird, wer einen Zustand bekommt oder
loswird, wer fällt, wer wieder aufsteht, wer würfelt. Ein Knopfdruck
legt den ganzen Verlauf in die Zwischenablage — wahlweise mit den
Trefferpunktständen oder nur mit den Beträgen, wenn die Runde nicht
lesen soll, wie dünn es beim Gegner steht.

Aufgeschrieben wird, was geschehen ist, nicht der fertige Satz. Wer den
Schaden ausgeteilt hat, steht nicht da — das weiß die Anwendung nicht,
das stellt der Leser her wie am Tisch auch.

### 🗄 Frühere Kämpfe

Beim Beenden wandert der Verlauf ins **Gesamtprotokoll**: Reiter
„Frühere“ im Protokollfenster, links die Tage — Heute, Gestern, dann
Wochentag und Datum —, darunter die Kämpfe des Tages mit Uhrzeit, Name,
Runden und Abenteuer. Aufklappen zeigt den ganzen Verlauf, kopieren
geht auch dort. Sechzig Kämpfe hebt es auf.

Es liegt wie der laufende Kampf **im Gerät der Spielleitung**. Es ist
ihre Mitschrift, kein Teil der Bögen — auf dem Server wäre es ein
Fremdkörper zwischen den Charakterblättern. Auf einem zweiten Gerät ist
es also nicht da.

### ✚ Nothelfer

Der Wächter, der im Abenteuerbuch mit einem Satz abgehandelt ist, oder
der Wolf, den sich gerade jemand ausgedacht hat: **Name,
Trefferpunkte, Rüstungsklasse** — mehr braucht er nicht, und in die
Gegnersammlung muss er dafür nicht.

### 🩹 Behoben

**Die Trefferpunkte sprangen zurück.** Wer im Tracker Schaden eintrug,
sah ihn ein paar Sekunden später wieder verschwinden. Die Ursache war
kein Fehler im Tracker, sondern ein Echo: ein zweites Gerät schickte
seinen älteren Stand desselben Bogens hinterher und überschrieb den
frischen. Jetzt schickt jedes Gerät nur noch die Werte, die es selbst
geändert hat, und der Server setzt daraus zusammen.

**Mengen ließen sich nicht eintippen.** In den Zahlenfeldern stand
immer schon eine 1 oder 0, die sich nicht löschen ließ — kaum war das
Feld leer, füllte es sich wieder. Jetzt gilt, solange man im Feld
steht, was man getippt hat, auch nichts; erst beim Verlassen wird eine
Zahl daraus. Enter übernimmt, Escape verwirft.

**Das Schadensfenster nahm die getippte Zahl nicht an.** „Anwenden“
blieb ausgegraut, solange die Zahl nur im Feld stand. Nebenbei: die 0
steht beim Öffnen nicht mehr da, man tippt in ein leeres Feld.

**Notizen an Helden** im Tracker wurden nicht gespeichert. Sie gehören
zum Helden, nicht zum Kampf, und bleiben jetzt auch nach ihm stehen.

**Fremde Bögen** zeigen keine Bearbeiten-, Hinzufügen- und
Tab-Knöpfe mehr — Nachtrag zur Besitzregel aus v4.2. Wer einen Bogen
nur ansehen darf, sieht auch nur, was zum Ansehen da ist.

**Der Fuß der Heldenliste** ist aufgeräumt; die Warnung über die
fehlende lokale Kopie ist weg.

**Das Vollbild in der Taverne** lässt sich in den Einstellungen des
Abenteuers regeln — es ist das Bonusspiel des Automaten, also
darf es häufiger kommen; die Auszahlungen sind entsprechend
zurückgenommen.

## v4.2

Von jetzt an meldet sich jeder mit **seinem eigenen Konto** an. Der
gemeinsame Gruppencode und das DM-Passwort sind Geschichte — mit ihnen
das „wer den Zettel hat, darf alles“.

### 👤 Anmelden

Zwei Felder: **Name und Passwort.** Kein Gruppencode, keine Server-URL.
Deine Gruppe, deine Rolle und deine Helden hängen am Konto; wo die
Anwendung liegt, weiß sie selbst.

Dein Konto legt die Spielleitung an und gibt dir ein **Einmalpasswort**.
Beim ersten Anmelden wählst du dein eigenes — danach kennt es niemand
mehr, auch nicht die Verwaltung: auf dem Server steht nur sein Hash.

Über deinen Namen unten in der Leiste kommst du zu **Mein Konto**: dein
Passwort ändern, und nachlesen, was über dich gespeichert ist.

### 🧑 Bögen gehören jemandem

Ein Bogen kann einem Konto zugeordnet sein. Dann ändert ihn nur noch
sein Besitzer — und die Spielleitung des Abenteuers. Alle anderen kommen
nicht mehr daran, auch nicht mit einem Klick zu viel im falschen Bogen.

Das gilt **auf dem Server**, nicht nur in der Anzeige. Ein fremder Bogen
wird abgewiesen, egal von wo die Anfrage kommt. Dasselbe für das
Inventar: ein Gegenstand ist Teil des Bogens.

Wer einen neuen Helden anlegt, besitzt ihn. Und was niemandem gehört,
bleibt für alle offen — die Zuordnung macht es strenger, nie kaputt.

Dein eigener Held trägt ein **👤** in der Liste.

### 🔮 Die Spielleitung gilt je Abenteuer

Wer Eberron leitet, kann in Strahd mitspielen. Beides zugleich, mit
einem Konto.

In den Einstellungen eines Abenteuers steht, wer es leitet. Nur wer dort
eingetragen ist, kommt in diesem Abenteuer in den DM-Modus, an fremde
Bögen und an die verdeckten Trefferpunkte. Wechselst du in ein
Abenteuer, das jemand anders leitet, fällst du dort aus dem DM-Modus —
und siehst die Trefferpunkte der anderen wieder als „Verwundet“ statt
als Zahl.

Steht für ein Abenteuer niemand da, leitet es wie bisher jede
Spielleitung der Gruppe.

Der DM-Modus braucht kein zweites Passwort mehr. Ein Klick auf **🔮 DM**,
und du bist drin.

### 📋 Das Abenteuerlog

Seit es Konten gibt, steht in jeder Zeile auch, **wer** sie geschrieben
hat. Aus der Chronik der Figuren wird damit eine der Menschen — und
deshalb wird sie auch so behandelt:

- Gespeichert wird eine **Kennung, nicht dein Name.** Wird dein Konto
  gelöscht, bleibt die Zeile stehen und verliert die Kennung. Die
  Kampagnenhistorie gehört der Runde.
- **Nach 180 Tagen ist Schluss** — die Verwaltung kann die Frist ändern.
  Vorher gab es keine; jede Zeile seit dem ersten Tag lag noch da.
- **Wer was sieht, entscheidet der Server.** Bisher kam alles im Browser
  an, und die Anwendung ließ die DM-Helden weg — wer sich die Antwort
  ansah, sah sie trotzdem. Jetzt bekommt ein Spieler die Zeilen zu
  DM-Helden gar nicht erst, und eine Spielleitung nicht, was in einem
  fremden Abenteuer passiert.
- Unter **Mein Konto** steht, was über dich gespeichert ist, mit einem
  Knopf, der alles als Datei ausgibt.

Nebenbei: die **IP-Adressen** der Anfragebremse liegen nur noch als Hash
da und werden aufgeräumt. Sie standen im Klartext und für immer — ein
Personenbezug, den niemand wollte.

### 🛠 Verwaltung

Für die Verwaltung, erreichbar über **Mein Konto**: Konten anlegen,
Rollen vergeben, Passwörter zurücksetzen, Konten löschen, Gruppen
anlegen und die Aufbewahrung des Logs stellen.

Ein gelöschtes Konto reißt keine Löcher: seine Bögen bleiben und gehören
danach niemandem, seine Logzeilen bleiben und verlieren die Kennung.

### Was das für den ersten Abend bedeutet

Beim nächsten Öffnen steht die Anmeldemaske da. Name und Passwort
bekommst du von der Spielleitung. Danach ist alles, wo es war.

Solange niemand einen Bogen zuordnet und niemand für ein Abenteuer
eingetragen wird, ändert sich am Spiel **nichts** — beide Regeln
greifen erst, wenn jemand etwas einträgt.

### Unter der Haube

Die Serverseite läuft seit dieser Ausgabe auch auf dem Rechner der
Entwicklung, mit einer eigenen Wegwerfdatenbank und **129 Prüfungen**,
die bei jeder Änderung durchlaufen. Vorher wurde sie zum ersten Mal auf
dem Server ausgeführt — für Speicherlogik ging das gut, für Anmeldecode
wäre es fahrlässig gewesen. Ein halbes Dutzend Fehler ist dabei
hängengeblieben, bevor irgendjemand sie zu sehen bekam.

## v4.1

Eine Ausgabe für den Feierabend: In der Taverne des Glücks steht ein
Spielautomat. Sonst hat sich nichts geändert.

### 🎰 Dreifaches Glück

Ein Spielautomat als Zeitvertreib: **Dreifaches Glück**, drei Walzen, fünf
Linien, drei gleiche Symbole zahlen. Erreichbar über **🎰 Taverne** in der
Leiste, für alle, nicht nur die Spielleitung.

Die Taverne ist ein **Fenster, kein Vorhang**: sie liegt über dem Heldenbuch,
nimmt aber keine Klicks weg. Du kannst nebenher deinen Bogen ansehen, den Helden
wechseln, Reiter durchgehen — die Taverne bleibt offen und dort stehen, wo du
sie hingeschoben hast. Verschoben wird sie am Kopf, und ihr Platz bleibt bis zum
nächsten Mal gemerkt. Am Handy bleibt sie bildschirmfüllend; ein schwebendes
Fenster ist dort keine gute Idee.

Gespielt wird mit **Spielmarken, die im Gerät liegen** — nicht am Charakter,
nicht am Server, ohne jede Verbindung zum Charakterbogen. Wer leer ist, bekommt
vom Wirt 200 neue. Es geht um nichts.

Die Auszahlungstabelle steht offen im Automaten, samt der **ausgerechneten
Quote** — sie ergibt sich aus Häufigkeit, Auszahlung und Vollbild und ist keine
Schätzung. Zurzeit 88,9 %.

Die Walzen laufen und halten von links nach rechts nacheinander an, der Gewinn
zählt hoch, und bei mehreren Gewinnlinien leuchtet eine nach der anderen auf —
sonst leuchtet das halbe Feld und man sieht nicht, woran es lag. Wer Bewegung im
Betriebssystem abgeschaltet hat, bekommt das Ergebnis sofort.

### Das Vollbild — das Bonusspiel

Neun gleiche Speisesymbole auf dem ganzen Feld: fünf Linien auf einmal und
danach das **Rad der Fortuna** — vier Felder, drei grüne und eines rot. Jedes
grüne zahlt den Vollbildgewinn noch einmal, das rote beendet es, höchstens
dreimal. Daher der Name.

Von allein fällt so ein Bild praktisch nie — beim Krug einmal in
zweihundertfünfzigtausend Drehungen, und ein Bonusspiel, das niemand je zu sehen
bekommt, ist keines. Deshalb **wird es gezogen**: etwa **jede 200. Drehung**
legt der Automat statt neun einzelner Symbole ein volles Bild. Welche Speise es
wird, entscheidet ihre Häufigkeit — der Krug oft, der Apfel selten.

Die Spielleitung stellt das ein: **aus** oder von 1 auf 1000 bis 1 auf 50
Drehungen. Es geht dabei nichts geschenkt — das Bonusspiel zieht seinen Anteil
aus derselben Quote, und der steht daneben (bei 1 auf 200: **44 %**). Häufiger
heißt kleinere Linien, seltener heißt größere. Nach dem Umstellen einmal
einregeln, dann stimmen die Auszahlungen wieder dazu.

Weil das Vollbild jetzt vorkommt, sind die **Auszahlungen der Linien kleiner**
als vorher — die Quote bleibt, wo sie war.

Drei Glücksmünzen auf einer Linie bringen einen **Freidreh**.

**Der Automat gehört der Spielleitung.** Unter **⚙ Einstellungen** des
Abenteuers stehen Häufigkeit und Auszahlung je Symbol, dazu ein Höchsteinsatz.
Daneben die Quote — sie rechnet sich beim Tippen mit. Ein Knopf regelt die
Auszahlungen auf eine Zielquote ein und trifft sie auf ein Zehntelprozent genau;
was danach dasteht, ist die erreichte Zahl, nicht die gewünschte.

Wer einen zwielichtigen Automaten will, stellt 80 % ein und sagt nichts.

**Nach jedem Gewinn kannst du ihn setzen statt einstecken** — ganz oder zur
Hälfte:

- **🪜 Leiter des Wagemuts** — ein Licht läuft über acht Felder, eines ist grün.
  Wer im richtigen Augenblick hält, verdoppelt und steigt eine Sprosse; mit
  jeder Sprosse läuft das Licht schneller. Danebengedrückt kostet alles.
- **🂠 Rabe oder Rose** — schwarz oder rot raten. Richtig verdoppelt, falsch
  kostet alles.

Höchstens fünf Sprossen, dann wird ausgezahlt. Was im Spiel ist, liegt solange
nicht in der Kasse: gesetzt wird sichtbar, damit nie ein Betrag herumsteht, über
den noch gewürfelt wird.

## v4.0.1

### Neu: 🕰 Chronik — der Kalender der Spielleitung

Im DM-Modus liegt neben ⚔ Kampf jetzt **🕰 Chronik**. Sie öffnet eine Spalte
rechts neben dem Bogen und trägt **eine Uhr je Abenteuer**: Strahd auf Tag 9
lässt Eberron auf Tag 1 stehen.

Daran hängen Ereignisse in drei Arten, die sich darin unterscheiden, was ihr
Ablaufen bedeutet:

| | wenn die Zeit um ist |
|---|---|
| ⏳ **Frist** | „Armins Finger wächst nach — ist abgelaufen" |
| 🧭 **Reise** | „Ismark reitet nach Krezk — **ist angekommen in Krezk**" |
| 📅 **Termin** | „Fest des heiligen Andral — ist jetzt" |

Die Reise trägt Von und Nach. Damit bekommst du am richtigen Tag gesagt, wo du
einen NSC hinstellen musst, dem die Gruppe nie begegnet ist. Ein Ereignis darf
auch **ohne Frist** mitlaufen — für das, was einfach nur dastehen soll — oder
sich **alle N Tage wiederholen**; dann stellt es sich beim Feuern selbst auf den
nächsten Termin.

**„Die Gruppe schläft drei Tage".** Über **⏩ Zeit vergeht** — Schnellknöpfe für
1 Std, Rast · 8 Std, 1 Tag, 3 Tage, 1 Woche, oder Tage und Stunden von Hand.
Bevor etwas passiert, steht da, was passieren wird. Danach zeigt dasselbe
Fenster, was fällig geworden ist, samt deiner Notiz dazu.

Dazu: **✓** hakt ab, ohne irgendwo hineinzuschreiben. **↩** holt zurück.
**Uhr direkt stellen** korrigiert einen Verzähler, ohne etwas fällig zu machen.
Steht etwas Fälliges an, sagt das der Knopf in der Leiste — die Chronik darf
also zugeklappt bleiben, ohne dass eine Frist untergeht.

### Die Chronik greift in die Bögen

Ein Ereignis kann einem Helden etwas antun. Zwei Wege:

**Merkmal umschalten.** Läuft die Frist ab, wird ein Merkmal ab- oder
eingeschaltet. Der Malus verschwindet mit der Frist, statt drei Sitzungen später
aufzufallen.

**Effekt setzen** — derselbe Effekt-Editor wie bei Waffen, wahlweise *ab sofort
bis die Frist abläuft* (der Fluch, der nach drei Tagen vergeht) oder *erst wenn
sie abgelaufen ist* (der Fluch, der in drei Tagen zuschlägt und dann bleibt).

Das Merkmal dazu wird bei jeder Änderung **neu aus der Uhr abgeleitet**, nicht
gesetzt und irgendwann wieder entfernt. Nichts kann hängenbleiben, und wer die
Uhr zurückstellt, bekommt den Fluch zurück. Im Bogen sind diese Merkmale
gesperrt (🕰 statt ✎ ✕) — dort geändert wären sie beim nächsten Weiterdrehen
überschrieben.

**Die Sicherung:** ein umgeschaltetes Merkmal ist ein Eingriff in einen fremden
Bogen und steht im Zeitfenster einzeln zum Abwählen — dieselbe Regel wie beim
Kampf. Jede Änderung landet im Abenteuerlog.

### Neu: ⚙ Einstellungen je Abenteuer

Unter **Abenteuer ▸ ⚙ Einstellungen**, nur im DM-Modus. Was hier steht, gilt für
die ganze Gruppe.

**Trefferpunkte: Offen oder Verdeckt.** Verdeckt heißt: der Spieler liest
„Schwer verwundet" statt „14 / 38", mit einem 🔒 daneben — auch im
Bearbeiten-Modus, und dort gibt es dann kein Eingabefeld. Der Balken folgt dem
Zustand in groben Stufen, nicht dem genauen Anteil; ein exakter Balken verriete
die Zahl, die er verbergen soll. Die Spielleitung sieht die Zahlen wie immer.

**Klassen je Abenteuer.** Ändern, ergänzen, entfernen — mit Farbe, und mit der
Angabe, wie viele Helden eine Klasse spielen, bevor du sie streichst. Eine
Hausklasse braucht nur Namen und Farbe; Trefferwürfel und Zauberattribut stehen
ohnehin im Bogen. Ein neuer Held startet mit der ersten Klasse der Liste, und
eine Klasse, die noch in einem Bogen steht, bleibt dort wählbar — sonst spränge
der Held beim Öffnen still auf eine andere.

### Vorteil und Nachteil auf Fertigkeiten

Bisher gab es nur „Heimlichkeit". Jetzt jede Fertigkeit, in beide Richtungen,
dazu *auf alle Fertigkeiten* sowie Nachteil auf Initiative und auf
Todesrettungswürfe. Ein gebrochener Arm gibt keinen Abzug in Zahlen, er gibt
Nachteil — „−2 auf Athletik" war eine Notlüge im Bogen.

Die Fertigkeitszeile trägt die Marke direkt: **▲** Vorteil, **▼** Nachteil,
**⇅** wenn beides gilt und sich nach Regelwerk aufhebt.

### Der Kampftracker sieht wieder aus wie der alte

Links die Seitenspalte: oben die Helden mit Klasse, RK, Balken und temporären
Trefferpunkten, darunter **die ganze Gegnersammlung mit Suchfeld und einem `+`
je Zeile** — ein Klick, und der Nachzügler steht mit ausgewürfelten
Trefferpunkten in der Initiative.

Rechts die Karten: Initiativfeld, Bild, Name, **Notizfeld**, RK, Trefferpunkte,
Tastenblock. Die kleinen Schritte gehen direkt (`-1 -5 +1 +5`), alles Größere im
Fenster: Sprungtasten 1/2/5/10/20/50 in beide Richtungen und ein Zähler für die
krumme Zahl.

Das Zustandsfenster hat **👍 Vorteil / 👎 Nachteil**, die fünfzehn Zustände als
Chips und **Erschöpfung als sechs Stufen** statt zweier Pfeile. In der Kopfzeile
ist **🎲 Alle Init.** dazugekommen — würfelt für jeden, bei dem noch nichts
steht.

**Das Notizfeld je Figur sieht nur die Spielleitung.** Es liegt im Kampf, und
der Kampf liegt nur auf ihrem Gerät.

### Trefferpunkte gelten sofort

Die Trefferpunkte der Helden liegen nicht mehr im Kampf, sondern **im Bogen**.
Was im Tracker eingetragen wird, steht dort im selben Augenblick. Damit fällt
das Übertragen am Ende weg — und mit ihm der Kampf, der mit einem Klick daneben
verlorenging.

Ins Abenteuerlog kommen nur noch die beiden Augenblicke, die man nachlesen will:
*bei 0 Trefferpunkten* und *wieder auf den Beinen*. Jeder einzelne Treffer wäre
sonst eine Zeile.

### ☠ Todesrettungswürfe

Fällt ein Held auf 0, klappt unter seiner Karte eine Reihe auf: drei Erfolge,
drei Fehlschläge, anklickbar. Drei Erfolge → **Stabilisiert**, drei Fehlschläge →
**Tot**, dazu ein ↺. Heilung über null setzt sie zurück und blendet die Reihe
wieder aus.

Sie stehen im Bogen, nicht im Kampf — wer vor der Tür verblutet, tut das auch
nach einem Neuladen und nach dem Kampfende.

### Temporäre maximale Trefferpunkte

Heldenmahl, Aid, ein Segen für diesen Abend: **+Temp Max** im Tracker hebt die
Obergrenze eines Helden. Sie steht auch im Bogen — im Trefferpunktblock als
„(+20 max)" und im Bearbeiten-Modus als viertes Feld *T.Max*. Ein Bonus für einen
Abend, den man nach der langen Rast nicht mehr findet, wäre eine Falle.

Bei Gegnern gibt es stattdessen **Max TP**, weil deren Obergrenze ohnehin nur im
Kampf lebt.

### Der Bogen hält sich von selbst aktuell

Bisher sah ein Spieler neue Trefferpunkte erst nach **↺ Laden**. Jetzt läuft ein
Abgleich im Hintergrund, und der Balken fällt, während die Spielleitung den
Schaden einträgt.

Gebaut auf der Annahme, dass sich fast immer nichts geändert hat — der Normalfall
kostet deshalb so gut wie nichts:

- Die Anfrage trägt eine abgeleitete Kennung statt des Passworts. Die
  Passwortprüfung ist mit Absicht langsam und liefe sonst alle paar Sekunden auf
  jedem Gerät der Gruppe.
- Die Antwort sind ein Zähler und die Trefferpunkte — ein paar hundert Byte. Ein
  voller Ladevorgang mit allen Bildern läuft nur, wenn sich am Bogen wirklich
  etwas anderes geändert hat.
- Liegt das Fenster im Hintergrund: gar nichts. Sichtbar werden löst sofort einen
  Abgleich aus.
- Eigene Änderungen werden erkannt und nicht noch einmal heruntergeladen.
- Bleibt es ruhig, wächst der Abstand von 5 auf 15 und dann 60 Sekunden.

Nachgemessen: eine reine Trefferpunktänderung kostet **eine** kleine Anfrage und
keinen Ladevorgang.

### Schaden und Heilung ohne Umweg über einen Kampf

Im DM-Modus steht unter dem Trefferpunktbalken jedes Bogens dieselbe Tastenreihe
wie im Kampftracker: `-1 -5 Schaden…` / `+1 +5 Heilen…` / `+Temp HP` /
`+Temp Max`. Eine Falle im Gang, ein Trank auf der Straße, ein Sturz vom Pferd —
dafür muss niemand mehr einen Kampf starten.

Dazu **☾ Lange Rast**: volle Trefferpunkte, temporäre Punkte und temporäres
Maximum zurückgesetzt, Todesrettungswürfe gelöscht — ein Knopf statt vier Felder.

Fällt jemand dabei auf null, klappen die **Todesrettungswürfe** auch hier auf.
Die Regeln sind dieselben wie im Kampf: temporäre Punkte fangen den Schaden
zuerst, Heilung deckelt am wirksamen Maximum, und wer wieder über null steht,
würfelt nicht mehr ums Überleben. Im Abenteuerlog stehen die beiden Augenblicke,
die man nachlesen will.

### Kleinigkeiten und Fehlerbehebungen

- **Verdeckte Trefferpunkte blitzten beim Neuladen kurz auf.** Die
  Einstellungen des Abenteuers kommen einen Augenblick nach dem Bogen — und
  solange sie fehlten, galt „offen". Jetzt gilt in dieser Lücke verdeckt: eine
  Zahl, die einen Augenblick später erscheint, verrät nichts, eine Zahl, die
  kurz aufblitzt, schon.
- **Ein Neuladen wirft dich nicht mehr auf den Startschirm.** Offener Held,
  offener Reiter und die ein- oder ausgeklappte Heldenliste stehen danach wieder
  so da wie vorher. Gibt es den Helden nicht mehr oder gehört er zu einem
  anderen Abenteuer, landest du wie bisher in der Übersicht. Für die
  Spielleitung kommt auch der Kampfschirm zurück — wenn ein Kampf läuft und er
  vorher offen war.
- Die Knöpfe im Kampf sind ein zusammenhängendes Bedienteil statt loser Tasten
  und tragen ihre Farbe schon im Ruhezustand — mitten im Kampf sucht niemand mit
  der Maus, welche die rote ist.
- **Kritisch:** eine fehlende Sortierregel an einer neuen Tabelle ließ den
  Server auf *jede* Anfrage mit einem leeren Fehler antworten. Behoben — und der
  Schema-Aufbau nennt jetzt den Grund, statt stumm alles lahmzulegen.
- Ereignisse der Chronik gehören immer zu genau einem Abenteuer. Beim Umhängen
  bleibt die Restzeit stehen und wird auf die andere Uhr umgerechnet.

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
