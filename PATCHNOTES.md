# ⚔ Heldenbuch — Patchnotes

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
