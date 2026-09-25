# 📄 Der Textbogen

Ein Charakterbogen des Heldenbuchs als Textdatei — zum Sichern, zum
Weitergeben, zum Ändern mit jedem Texteditor und zum Wiedereinlesen.

In der Seitenleiste steht **📥 Bögen**. Dort werden alle Bögen eines
Abenteuers als ZIP ausgelesen und einzelne `.txt` oder ganze ZIP-Bündel
wieder eingelesen. Einen einzelnen Bogen sichert der Knopf **⬇ Textbogen**
im Kopf des Bogens.

Dieses Blatt ist auch dafür da, es einer KI hinzulegen: „Schreib mir einen
NSC in diesem Format." Was dabei herauskommt, liest das Heldenbuch ein.

## Die Regeln

* `# …` am Zeilenanfang ist eine Bemerkung.
* `[Abschnitt]` beginnt einen Abschnitt.
* `Schlüssel: Wert` ist eine Angabe.
* `- Name` beginnt einen Eintrag einer Liste; seine Angaben stehen
  darunter, **eingerückt**.
* Eine eingerückte Zeile ohne `Schlüssel:` setzt den vorigen Wert fort —
  so passen ganze Absätze in ein `Text:`.

Groß- und Kleinschreibung ist gleichgültig, die Reihenfolge der
Abschnitte auch. Umlaute dürfen ausgeschrieben werden (`Staerke`).
Was fehlt, bekommt den Wert eines neuen Bogens; was unbekannt ist, wird
übergangen und in der Vorschau gemeldet. Nur zwei Dinge sind Pflicht: die
erste Zeile `# Heldenbuch-Bogen 1` und ein `Name`.

**Nicht enthalten:** das Bild, das Abenteuerlog und die Kennung. Ein
eingelesener Bogen bekommt eine neue Kennung — oder die des vorhandenen,
wenn du beim Einlesen „Vorhandenen ersetzen" wählst.

## Ein ganzes Beispiel

```
# Heldenbuch-Bogen 1

[Bogen]
Name: Wirt Arik
Art: NSC freundlich          # Held | Held nur Spielleitung | NSC freundlich | NSC feindlich
Volk: Mensch
Klasse: Kämpfer
Stufe: 2
Unterklasse: Champion
Nebenklassen: Schurke 1 (Dieb), Magier 2
Hintergrund: Gastwirt
Übungsbonus: 2

[Attribute]
Stärke: 12
Geschicklichkeit: 10
Konstitution: 14
Intelligenz: 11
Weisheit: 13
Charisma: 15

[Werte]
Trefferpunkte: 16 von 16     # jetzt von höchstens
Temporäre TP: 0
Rüstungsklasse: 12
Bewegung: 9                  # in Metern, deutsch: 7,5
Initiative: 0                # Bonus zur Geschicklichkeit, meist 0
Inspiration: 0 von 1
Erschöpfung: 0
Zauberpunkte: 0 Punkte, 0 verbraucht

[Übungen]
Rettungswürfe: Stärke, Konstitution
Fertigkeiten: Einschüchtern, Motiv erkennen
Expertise: Einschüchtern
Alleskönner: nein
Sprachen: Gemeinsprache, Zwergisch
Werkzeuge: Brauerwerkzeug
Waffen und Rüstungen: Einfache Waffen

[Zauberplätze]
Grad 1: 4 Plätze, 1 verbraucht
Grad 2: 2 Plätze, 0 verbraucht

[Ressourcen]
- Kampfrausch
  Kurz: KR
  Vorrat: 3 Punkte, 1 verbraucht
  Farbe: #e05a5a
  Auffrischen: kurze Rast          # kurze Rast | lange Rast | täglich

[Merkmale]
- Kennt jeden im Dorf
  Quelle: Gastwirt
  Wirkung: Alle Fertigkeiten +1
  Wirkung aktiv: ja
  Ressource: Kampfrausch, Kosten 1
  Zauber: Person festhalten
  Text: Weiß, wer gestern wo getrunken hat.
    Und wer nicht bezahlt hat.

[Waffen]
- Knüppel
  Attribut: Stärke
  Geübt: ja
  Reichweite: 1,5m
  Angriffsbonus: 0
  Schaden: 1W6
  Schadensart: Wucht
  Eigenschaften: Leicht
  Text: Steht hinter dem Tresen.

[Zauber]
- Person festhalten
  Grad: 2
  Schule: Verzauberung
  Zeitaufwand: 1 Aktion
  Reichweite: 18 m
  Dauer: 1 Minute
  Komponenten: V, S, M
  Vorbereitet: ja
  Text: Hält jemanden fest.

[Ausrüstung]
- Heiltrank ×3
  Seltenheit: ungewöhnlich
  Gewicht: 0,25
  Wert: 50
  Quelle: Händler
  Schlagworte: Trank
  Im Kampf: ja
- Kettenhemd
  Art: ruestung              # Platzart: ruestung, schild, waffe, ring, umhang, …
  Rüstungsart: medium        # light | medium | heavy
  Grund-RK: 13
  RK-Bonus: 0
  Wirkung: Rüstungsklasse +1
  Wirkung aktiv: ja
  Getragen: Rüstung          # Platz der Ausrüstungspuppe
  Text: Schwer, aber gut.

[Waffenplätze]
Haupthand: Knüppel

[Münzen]
Platin: 0
Gold: 12
Elektrum: 0
Silber: 40
Kupfer: 0

[Notizen]
Freitext: Steht seit dreißig Jahren hinter demselben Tresen.
- Haltung zur Gruppe
  Schlagworte: NSC, Barovia
  Text: Freundlich, solange bezahlt wird.
```

## Wirkungen

`Wirkung:` nimmt eine Liste, mit Komma getrennt. Jede Wirkung ist der Name
des Ziels und dahinter der Wert:

```
Wirkung: Rüstungsklasse +1, Stärke = 19, Vorteil: Heimlichkeit
```

`+1` rechnet dazu, `= 19` setzt fest, und ein Schalter (Vorteil auf etwas)
steht allein. Die Namen sind dieselben wie im Effekt-Editor des Bogens:
Attribute, Rüstungsklasse, Max. Trefferpunkte, Bewegung (m), Initiative,
Übungsbonus, Angriffswürfe, Schaden, Zauber-SG, Zauber-Angriffsbonus,
Rettungswürfe, jede Fertigkeit, Passive Wahrnehmung, Dunkelsicht (m).

## Ein Bündel

Ein ZIP mit `.txt`-Dateien darin wird in einem Zug gelesen; Unterordner
sind erlaubt, alles andere im ZIP wird übergangen. Vor dem Schreiben zeigt
das Fenster je Datei, was gefunden wurde und ob es den Namen schon gibt —
und du entscheidest je Bogen: neu anlegen, vorhandenen ersetzen oder
überspringen.
