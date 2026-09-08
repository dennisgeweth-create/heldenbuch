# 🎰 Drei Walzen mehr — Konzept

Die Taverne hat sechs Tische und einen Automaten. Der Automat ist der
kleinste von allen: drei Walzen, fünf feste Linien, ein Bonus. Was hier
vorgeschlagen wird, sind drei Automaten nach dem Vorbild dreier Geräte,
die jeder kennt, der schon einmal in einer Spielhalle stand — und die
sich, das ist der Punkt, **fast nur in ihrer Bonusrunde unterscheiden**.

Genau deshalb sind es drei und nicht einer. Ein Fünfwalzengerüst zu
bauen lohnt sich für ein einziges Spiel nicht; für drei schon, denn
neunzig Prozent davon sind dasselbe Gerüst. Der Aufwand liegt einmal in
der Mitte und dreimal in einer Bonusrunde, die je etwa hundert Zeilen
groß ist.

**Wie beim „Dreifachen Glück" gilt: nachgebaut wird der Ablauf, nicht
die Aufmachung.** Name, Zeichen und Bild sind eigene. Spielregeln sind
frei; Marken, Grafik und Namen der Hersteller sind es nicht, und ein
Nachbau, der sich als das Original ausgibt, käme dem Heldenbuch teuer zu
stehen. Die Vorbilder stehen unten mit Namen da, weil man sie zum
Verstehen braucht — im Programm taucht keiner davon auf.

---

## Was die drei Vorbilder gemeinsam haben

Alle drei sind derselbe Automat, dreimal anders erzählt:

| | |
|---|---|
| **Feld** | 5 Walzen × 3 Reihen = 15 Zeichen |
| **Linien** | 10, im Original zuschaltbar, Einsatz je Linie |
| **Wertung** | von links, **ab Walze 1**, ohne Lücke. Je Linie zählt nur der höchste Gewinn, nicht beide |
| **Wild** | ersetzt jedes Zeichen außer dem Scatter |
| **Scatter** | zählt **irgendwo** auf dem Feld, nicht auf einer Linie, und zahlt über den Gesamteinsatz |
| **Bonus** | 3 Scatter → eine feste Zahl Freispiele mit **einer** zusätzlichen Regel |
| **Risiko** | nach jedem Gewinn Kartenrisiko (rot/schwarz) oder Leiter, bis zu fünf Sprossen |

Der letzte Punkt ist ein Glücksfall: **die Risikoleiter steht schon.**
„Leiter des Wagemuts" und „Rabe oder Rose" in `2f-automat.jsx` sind
genau das, was alle drei Vorbilder hinter jedem Gewinn anbieten. Sie
werden unverändert weiterverwendet.

## Und was sie unterscheidet

Nur die eine zusätzliche Regel im Freispiel. Sie ist der ganze Charakter
des Geräts:

| Vorbild | Freispiele | Die eine Regel |
|---|---|---|
| Book of Ra Deluxe | 10, nachladbar | **Ein Zeichen wird vorher gelost** und füllt im Freispiel ganze Walzen — und zahlt dabei, ohne nebeneinander zu liegen |
| Eye of Horus | 12, wachsend | **Jedes Wild veredelt**: das unterste Zeichen der Tafel fällt weg, alles rückt eine Stufe hoch — dauerhaft für die Runde |
| El Torero | 10, nicht nachladbar | **Jedes Wild bleibt stehen** bis zum letzten Dreh und sammelt sich an |

Drei Arten, dieselbe Spannung zu bauen: Vorbild eins **verspricht
vorher**, zwei **wird stetig besser**, drei **sammelt an**. Wer alle
drei nebeneinander stellt, hat drei verschiedene Abende und nicht
dreimal denselben.

---

## Vorbild 1 · Book of Ra Deluxe (Novomatic)

**Ablauf.** 5×3, zehn Linien, Einsatz je Linie. Das Buch ist Wild
**und** Scatter zugleich — es ersetzt jedes Zeichen auf einer Linie und
zählt gleichzeitig verstreut über das ganze Feld. Drei Bücher irgendwo
lösen zehn Freispiele aus.

**Die Bonusrunde.** Bevor der erste Freidreh läuft, blättert das Buch
und bleibt bei **einem** Zeichen stehen: dem Sondersymbol dieser Runde.
Fällt es im Freispiel **mindestens dreimal irgendwo** auf dem Feld,
dehnt es sich über jede Walze aus, auf der es liegt, und wird über alle
zehn Linien gewertet. Das Entscheidende dabei — und der Grund, warum das
Ding seit zwanzig Jahren läuft: **es muss nicht nebeneinander liegen.**
Ein Sondersymbol auf Walze 1, 3 und 5 zahlt wie drei nebeneinander.
Fallen im Freispiel wieder drei Bücher, kommen zehn Freispiele obendrauf.

**Die Tafel** (Vielfaches des Linieneinsatzes, klassische Deluxe-Staffel):

| Zeichen | 2 | 3 | 4 | 5 |
|---|--:|--:|--:|--:|
| Forscher | 5 | 100 | 1.000 | 5.000 |
| Pharao | – | 100 | 750 | 2.000 |
| Statue | – | 40 | 400 | 1.000 |
| Skarabäus | – | 40 | 400 | 1.000 |
| A · K | – | 5 | 40 | 150 |
| 10 · J · Q | – | 5 | 25 | 100 |
| **Buch** (verstreut, Gesamteinsatz) | 1 | 2 | 20 | 200 |

Was daran auffällt: **der Sprung ist enorm.** Vom Vierer zum Fünfer
verfünffacht sich die Auszahlung. Das Gerät zahlt selten und dann viel —
hohe Schwankung, und die Freispielrunde trägt den Löwenanteil.

## Vorbild 2 · Eye of Horus (Merkur)

**Ablauf.** 5×3, zehn Linien, Quote 96,31 %, bis zu 10.000× Einsatz.
Zwei Besonderheiten schon im Grundspiel: das **Wild liegt nur auf den
Walzen 2, 3 und 4** — nie auf der ersten oder letzten — und wenn es
fällt, **dehnt es sich über die ganze Walze aus**. Es zahlt selbst
nichts. Der Scatter ist ein eigenes Zeichen; drei davon geben **zwölf**
Freispiele.

**Die Bonusrunde — die klügste der drei.** Im Freispiel tut jedes Wild,
das landet, zwei Dinge auf einmal:

1. **Es veredelt.** Das unterste noch im Spiel befindliche Zeichen der
   Tafel verschwindet von den Bändern; alles, was darauf lag, rückt eine
   Stufe hoch. Und das gilt **für den Rest der Runde**. Nach genügend
   Wilds bestehen die Walzen nur noch aus hohen Zeichen.
2. **Es verlängert.** Ein Wild in einem Dreh gibt einen Freidreh dazu,
   zwei geben drei, drei geben fünf.

Beides zusammen ist eine Lawine: mehr Wilds heißt bessere Zeichen *und*
mehr Drehungen, um sie zu treffen. Eine Runde, die gut anfängt, wird von
selbst immer besser — und eine, die schlecht anfängt, ist nach zwölf
Drehungen vorbei. Deshalb fühlt sich dieses Gerät anders an als die
anderen beiden, obwohl darunter dieselbe Maschine steht.

## Vorbild 3 · El Torero (Merkur)

**Ablauf.** 5×3, zehn zuschaltbare Linien, Quote 94,19 %, hohe
Schwankung, bis zu 10.000×. Der Torero ist **Wild und zugleich das
höchstzahlende Zeichen** — er ersetzt alles außer dem Stier. Der Stier
ist Scatter, zahlt selbst nichts, und **drei davon auf den Walzen 1, 3
und 5** starten zehn Freispiele. (Nicht irgendwo: genau dort. Das ist
ungewöhnlich und macht den Auslöser seltener, als er aussieht.)

**Die Bonusrunde.** Jeder Torero, der in den zehn Freispielen fällt,
**bleibt an seinem Platz stehen** — bis zum letzten Dreh. Sie sammeln
sich an. Der siebte Freidreh wird auf einem Feld gespielt, auf dem schon
vier Wilds kleben. Nachladen gibt es nicht; die Runde ist nach zehn
Drehungen zu Ende, egal was fällt.

**Die Tafel** (Vielfaches des Linieneinsatzes, gerundet):

| Zeichen | 3 | 4 | 5 |
|---|--:|--:|--:|
| Torero (Wild) | 10 | 30 | 100 |
| Señorita | 5 | 20 | 50 |
| Hut · Gitarre · Rose | 3 | 10 | 25 |
| 10 · J · Q · K · A | 1 | 2 | 5 |
| **Stier** (Scatter) — Freispiele, keine eigene Auszahlung | | | |

**Diese Tafel sieht arm aus, und das ist Absicht.** Fünf Toreros zahlen
hundertfach, wo Book of Ra fünftausendfach zahlt. El Torero verdient
sein Geld nicht auf den Linien, sondern in der Freispielrunde: erst die
klebenden Wilds machen aus einer mageren Tafel große Beträge. Wer die
Tafel eins zu eins übernähme und die Bonusrunde wegließe, hätte einen
Automaten, der nichts auszahlt.

---

## Die drei Tische im Heldenbuch

### 🕮 Das Verschollene Kapitel

*Ein Zauberbuch in einer versunkenen Bibliothek.* Das Buch schlägt sich
auf und bestimmt, welches Zeichen diese Runde regiert.

| Zeichen | 2 | 3 | 4 | 5 |
|---|--:|--:|--:|--:|
| 🧭 Der Gräber | 5 | 100 | 1.000 | 5.000 |
| 👑 Die Drachenkrone | – | 100 | 750 | 2.000 |
| 🗿 Der steinerne Wächter | – | 40 | 400 | 1.000 |
| 🪲 Der Grabkäfer | – | 40 | 400 | 1.000 |
| 🜂 Feuer · 🜁 Luft | – | 5 | 40 | 150 |
| 🜃 Erde · 🜄 Wasser | – | 5 | 25 | 100 |
| 📜 **Das Buch** — Wild und verstreut | 1 | 2 | 20 | 200 |

Drei Bücher → zehn Freispiele. Vorher blättert das Buch sichtbar durch
die Tafel und bleibt bei einem Zeichen stehen — **das aufgeschlagene
Kapitel**. Liegt es im Freispiel dreimal, füllt es seine Walzen und
zahlt über alle Linien, nebeneinander oder nicht. Drei Bücher im
Freispiel legen zehn nach.

### 👁 Das Wachsame Auge

*Ein Wächter in einer Tempelruine. Sein Blick veredelt, was er trifft.*

| Zeichen | 3 | 4 | 5 |
|---|--:|--:|--:|
| 🦅 Der Falke | 20 | 200 | 1.000 |
| 🐍 Die Natter | 15 | 100 | 500 |
| 🗝️ Der Schlüssel | 10 | 60 | 250 |
| ⚱️ Die Urne | 10 | 40 | 150 |
| 🪶 Die Feder | 3 | 15 | 60 |
| 🌾 Der Halm | 3 | 12 | 50 |
| 💧 Der Tropfen | 2 | 10 | 40 |
| 🪨 Der Kiesel | 2 | 8 | 30 |
| 👁 **Der Wächter** — Wild, nur Walze 2–4, füllt die Walze, zahlt nichts | | | |
| 🚪 **Das Tor** — Scatter, 3 → zwölf Freispiele | | | |

Die acht zahlenden Zeichen stehen in einer **Leiter**: Kiesel → Tropfen
→ Halm → Feder → Urne → Schlüssel → Natter → Falke. Jedes Wild im
Freispiel nimmt die unterste Sprosse von den Bändern; alles rückt hoch.
Dazu ein Freidreh je Wild, drei bei zweien, fünf bei dreien.

Die Leiter ist die **Reihenfolge** der Tafel, nicht ihre Zahlen — wer
die Auszahlungen je Abenteuer verstellt, verstellt die Leiter nicht mit.
Das muss so sein, sonst hinge die Bonusrunde an einem Zahlenfeld (siehe
unten, „Die Rechnung").

### 🗡️ Klinge und Hörner

*Die Arena unter der Stadt. Der Minotaurus, und was von den Klingen im
Sand steckenbleibt.*

| Zeichen | 3 | 4 | 5 |
|---|--:|--:|--:|
| 🗡️ **Die Klinge** — Wild, ersetzt alles außer den Hörnern | 10 | 30 | 100 |
| 💃 Die Fechterin | 5 | 20 | 50 |
| 🌹 Die Rose · 🪘 Die Trommel · 🛡️ Der Schild | 3 | 10 | 25 |
| 🍷 🔔 🧤 ⛓️ Becher · Glocke · Handschuh · Kette | 1 | 2 | 5 |
| 🐂 **Die Hörner** — Scatter auf Walze 1, 3 und 5 → zehn Freispiele | | | |

Jede Klinge, die im Freispiel fällt, **bleibt stecken** bis zum letzten
Dreh. Kein Nachladen. Die flache Tafel bleibt flach — hier zahlt die
Runde, nicht die Linie.

---

## Stufe 8 · Das Fünfwalzen-Gerüst

Die eigentliche Arbeit. `js/src/2f7-walzen.jsx`, reine Rechnung und ein
Anzeigebauteil, beides von den drei Automaten geteilt.

**Bänder statt Würfeln.** Der bestehende Automat zieht jedes der neun
Felder einzeln. Für fünf Walzen taugt das nicht: ein echtes Gerät hat
**je Walze ein Band**, und die drei sichtbaren Zeichen sind drei
aufeinanderfolgende Einträge davon. Nur so lässt sich einstellen, dass
der Wächter nie auf Walze 1 liegt, dass die Hörner genau auf 1, 3 und 5
liegen, und wie oft zwei gleiche Zeichen übereinanderstehen. Ein Band
ist eine Liste von etwa 40 Einträgen je Walze.

**Zehn feste Linien** auf den Feldern 0–14 (0–4 oben, 5–9 Mitte, 10–14
unten):

```
 1  Mitte      5  6  7  8  9         6  Wanne oben   0  1  7 13 14
 2  Oben       0  1  2  3  4         7  Wanne unten 10 11  7  3  4
 3  Unten     10 11 12 13 14         8  Zacke oben   5  1  2  3  9
 4  V          0  6 12  8  4         9  Zacke unten  5 11 12 13  9
 5  Λ         10  6  2  8 14        10  Zickzack     0  6  2  8  4
```

Zuschaltbar sind sie nicht — zehn Linien, immer alle. Wer im Original
mit drei Linien spielt, spielt einen schlechteren Automaten, und diese
Falle muss das Heldenbuch nicht nachbauen.

**Der Einsatz auf der Leiter ist der Gesamteinsatz**, der Linieneinsatz
ein Zehntel davon. Bei Marken also 0,5 · 1 · 2 · 5, bei Gold 0,1 bis 1.
Gerechnet wird in Bruchzahlen, **gerundet wird einmal am Ende eines
Drehs** — nicht je Linie, sonst summieren sich zehn Rundungsfehler.

Was das Gerüst mitbringt:

- `walzenZiehen(bänder)` → 15 Zeichen.
- `linienWerten(feld, tafel, linieneinsatz)` → Treffer je Linie, von
  links ab Walze 1, mit Wild-Ersatz, je Linie nur der beste.
- `scatterWerten(feld, zeichen)` → Zahl und Lage, egal wo.
- `FreispielLauf` — der Zustandsautomat: Zähler, Sonderzeichen, klebende
  Felder, Veredelungsstufe. Alle drei Runden sind derselbe Automat mit
  je einem anderen Haken.
- `WalzenSchirm` — fünf laufende Bänder, die Linienanzeige, das
  Aufleuchten der Treffer, die Freispielzählung.
- `quoteAusTafel(häufigkeiten, tafel)` und `walzenEinregeln(…)` — siehe
  unten.

**Dateinamen, eine bekannte Falle.** `build.js` sortiert mit `.sort()`,
also nach Zeichen. `2f10-…` stünde damit **vor** `2f2-…`. Deshalb
`2f7-walzen.jsx`, `2f8-buch.jsx`, `2f9-auge.jsx` und `2fa-arena.jsx` —
„2fa" steht nach „2f9" und vor „2g".

## Stufe 9 · 🕮 Das Verschollene Kapitel

Der erste der drei, weil seine Bonusrunde die einfachste ist: ein
gelostes Zeichen, ein Zähler, eine Ausdehnungsregel. An ihm zeigt sich,
ob das Gerüst trägt. Neu dazu nur: das Blättern vor der Runde, die
gefüllte Walze, und die Wertung ohne Nachbarschaft.

## Stufe 10 · 🗡️ Klinge und Hörner

Der zweite, weil er das Gerüst am wenigsten fordert: klebende Felder
sind eine Liste von Positionen, die vor dem Ziehen wieder eingesetzt
wird. Zehn Zeilen Regel. Er bringt dafür die **Scatter-Bedingung je
Walze** mit, die das Gerüst noch nicht kann.

## Stufe 11 · 👁 Das Wachsame Auge

Zuletzt, weil er am meisten verlangt: das Wild, das nur auf drei Walzen
liegt und sich ausdehnt, die Veredelungsleiter, die die Bänder während
der Runde umschreibt, und die wachsende Freispielzahl. Er ist auch der,
der sich am besten anfühlt — deshalb steht er hinten und nicht vorn:
wenn er der erste wäre, sähen die anderen beiden danach blass aus.

---

## Die Rechnung: warum hier keine Formel steht

Beim „Dreifachen Glück" ist die Quote eine geschlossene Formel — neun
unabhängige Felder, fünf Linien, das lässt sich hinschreiben. Bei fünf
Walzen mit Wild-Ersatz, verstreuten Scattern, Freispielen mit eigener
Regel und Nachladen **geht das nicht mehr**. Wer es trotzdem versucht,
schreibt eine Formel hin, die niemand mehr prüfen kann.

Der Ausweg steht schon im Haus: **die Rennbahn rechnet 2500 stille
Rennen, bevor sie ihre Quoten hinschreibt.** Dasselbe hier, nur an einer
Stelle klüger.

**Die Quote ist in den Auszahlungen linear** — das nutzt der bestehende
Automat schon aus, wenn er die Tafel auf ein Ziel streckt. Also braucht
die Simulation die Auszahlungen gar nicht zu kennen. Sie zählt nur, wie
oft was passiert:

1. Einmal, beim Bauen, laufen einige Millionen stille Drehungen über die
   Bänder — Freispiele eingeschlossen.
2. Gezählt wird je Zeichen und je Länge, wie oft es getroffen wird, im
   Grundspiel und im Freispiel getrennt. Heraus kommt eine
   **Häufigkeitstafel**, ein paar Dutzend Zahlen.
3. Die Quote ist von da an ein Skalarprodukt aus Häufigkeit und
   Auszahlung — sofort, im Browser, bei jeder Änderung der
   Spielleitung. Und das Einregeln auf ein Ziel bleibt eine Division,
   genau wie heute.

Das gilt, **solange keine Regel an einem Auszahlungsbetrag hängt**. Beim
Wachsamen Auge hängt die Veredelungsleiter deshalb an der *Reihenfolge*
der Tafel und nicht an ihren Zahlen: wer die Beträge verstellt,
verschiebt die Leiter nicht und macht die Häufigkeitstafel nicht
ungültig. Die Reihenfolge selbst ist nicht einstellbar.

Die Häufigkeitstafeln liegen als Konstanten in der jeweiligen Datei,
danebengeschrieben, mit wie vielen Drehungen sie gemessen wurden. Das
Messprogramm kommt nach `dev/` und läuft mit `node` — es gehört nicht in
die Anwendung, sondern in die Werkstatt.

---

## Einstellungen je Abenteuer

Wie bei allem anderen: nichts eingetragen heißt, es gilt der Standard.

- **Offen oder zu**, je Automat — die drei tragen sich in `zu` ein wie
  die sechs Tische auch.
- **Die Auszahlungen**, je Zeichen, wie beim „Dreifachen Glück". Die
  erreichte Quote steht daneben, nicht die gewünschte.
- **Die Zielquote**, mit einem Knopf, der die Tafel darauf streckt.
- **Höchsteinsatz** — der bestehende, für alle Tische einer.
- Nicht einstellbar: Bänder, Linien, die Reihenfolge der Tafel und die
  Bonusregeln. Wer daran dreht, dreht am Spiel und nicht an seiner Runde.

## Die Halle bei neun Tischen

Neun Einträge sind eine lange Liste. Die Halle bekommt zwei
Überschriften — **Walzen** und **Tische** — und sonst nichts Neues. Der
Wirt steht weiterhin nicht an den Automaten; er steht dort, wo jemand
gibt.

## Was an `styles.css` dazukommt

Ein Block für den Fünfwalzenschirm: fünf Bänder statt drei, die
Linienanzeige über dem Feld, das gefüllte Walzenbild, klebende Felder,
die Freispielzählung. Etwa so viel wie der bestehende Automatenblock.
**Immer hinter die Grundregel schreiben** — gleich starke Regeln weiter
unten gewinnen, und `@media`-Blöcke vor ihrer Grundregel greifen nie.

## Was schon bekannt ist und wieder gilt

- **Gebucht wird sofort**, angezeigt danach. Der Lauf der Walzen ist
  Anzeige; hängt ein Zeitgeber im Hintergrund fest, steht der Automat
  sonst ewig auf „Läuft…". Der bestehende `aufloesen()`-Weg wird
  mitübernommen — bei Freispielen erst recht, denn dort laufen zehn
  Drehungen hintereinander.
- **`prefers-reduced-motion`** schaltet den Lauf ab und zeigt das
  Ergebnis sofort. Eine Freispielrunde muss sich dann in einem Schritt
  abrechnen lassen und nicht in zwölf.
- **Nichts verlässt das Gerät.** Marken aus dem Beutel des Helden, Gold
  aus dem Bogen, wenn die Spielleitung es so eingestellt hat. Kein
  fremder Bogen, keine Anfrage nach draußen.

---

## Reihenfolge, kurz begründet

| Stufe | Warum hier |
|---|---|
| 8 Gerüst | Trägt alle drei; ohne sie dreimal dasselbe gebaut |
| 9 Kapitel | Einfachste Bonusrunde — prüft das Gerüst am billigsten |
| 10 Arena | Klebende Felder sind zehn Zeilen; bringt die Scatter-Bedingung je Walze |
| 11 Auge | Verlangt am meisten und wirkt am stärksten — deshalb zuletzt |

## Woher die Zahlen stammen

Die Bonusregeln und die Kennzahlen — Linien, Quote, Höchstgewinn,
Freispielzahl, Zusatzdrehungen — sind nachgeschlagen und stimmen mit den
veröffentlichten Beschreibungen der Geräte überein. Die
**Auszahlungstafeln** sind die geläufig dokumentierten Staffeln; die
deutschen Automatenfassungen weichen davon ab, weil sie unter anderen
Auflagen laufen. Für uns ist das ohne Belang: die Zahlen werden ohnehin
auf die Quote gestreckt, die die Spielleitung setzt. Wichtig ist die
**Form** der Tafel — wie viele Stufen, wie steil der Sprung von vier auf
fünf, und ob das Wild selbst zahlt.
