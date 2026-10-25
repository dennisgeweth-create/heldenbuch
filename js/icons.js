// Heldenbuch — die Icons.
//
// Ein eigenes Set statt Emojis: Emojis sehen auf jedem Geraet anders aus
// (Windows, Android, iOS malen sie je nach Laune bunt, flach oder gar
// nicht), und sie passen weder zueinander noch zum Bogen. Hier ist jedes
// Icon im selben 24er-Raster gezeichnet, mit derselben Linie, und nimmt
// die Farbe und Groesse der Schrift an, in der es steht.
//
// Wie es in die Seite kommt: im Code stehen weiter die Zeichen (⚔, 📜, ✎
// …) — sie sind kurz, lesbar und durchsuchbar. Diese Datei haengt sich
// vor React.createElement: jeder Text, der als Kind eines Elements
// gezeichnet wird, wird nach bekannten Zeichen abgesucht, und jedes wird
// durch sein Icon ersetzt. Attribute (title, placeholder, aria-label)
// koennen kein Bild tragen; dort fallen die Zeichen weg. <option> und
// <textarea> ebenso. Wer ein Emoji wirklich als Emoji zeigen will — der
// Emoji-Knopf im Texteditor —, setzt data-emoji am Element.
//
// Geladen von beiden Seiten (Heldenbuch und Planer), nach React, vor der
// Anwendung. Kein Build, keine Abhaengigkeit.
(function () {
  'use strict';

  // ── Die Zeichnungen ───────────────────────────────────────────
  // Je Icon eine Liste: ein Pfad ist ein String; 'c x y r' ein Kreis;
  // ein vorangestelltes '!' fuellt statt zu ziehen.
  var I = {
    // Handgriffe
    x:          ['M6.5 6.5l11 11M17.5 6.5l-11 11'],
    haken:      ['M4.5 12.5l4.8 4.8L19.5 7'],
    stift:      ['M4 20l1.1-4.6L15.6 4.9a2.1 2.1 0 0 1 3 3L8.1 18.4z', 'M13.6 6.9l3 3'],
    plus:       ['M12 5v14M5 12h14'],
    kreuz:      ['M9.2 3.8h5.6v5.4h5.4v5.6h-5.4v5.4H9.2v-5.4H3.8V9.2h5.4z'],
    menue:      ['M4 7h16M4 12h16M4 17h16'],
    lupe:       ['c10.5 10.5 6', 'M15 15l5 5'],
    zahnrad:    ['M12 3l1.6 2.3 2.7-.8.4 2.8 2.6 1.1-1.2 2.6 1.2 2.6-2.6 1.1-.4 2.8-2.7-.8L12 21l-1.6-2.3-2.7.8-.4-2.8-2.6-1.1L5.9 13 4.7 10.4l2.6-1.1.4-2.8 2.7.8z', 'c12 12 3'],
    werkzeug:   ['M14.7 4.2a4.6 4.6 0 0 0-5.5 6L3.8 15.6a1.8 1.8 0 0 0 2.6 2.6l5.4-5.4a4.6 4.6 0 0 0 6-5.5l-2.7 2.7-2.3-.6-.6-2.3z'],
    schloss:    ['M6.5 10.5h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8.5 10.5v-3a3.5 3.5 0 0 1 7 0v3', 'M12 14.5V17'],
    schluessel: ['c7.5 15.5 3.5', 'M10 13l9.5-9.5', 'M16.5 6.5L19 9', 'M14 9l2 2'],
    warnung:    ['M12 3.8l9 15.7H3z', 'M12 9.5v4.8', '!c12 17 0.9'],
    verbot:     ['c12 12 8.5', 'M6 6l12 12'],
    diskette:   ['M5 3.5h11.5l4 4V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z', 'M7.5 3.5v5h8v-5', 'M7 20.5V14h10v6.5'],
    muell:      ['M4.5 6.5h15', 'M9.5 6.5V4h5v2.5', 'M6.5 6.5l1 14h9l1-14', 'M10 10.5v6.5M14 10.5v6.5'],
    ordner:     ['M3.5 6.5A1.5 1.5 0 0 1 5 5h4.5l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z'],
    dokument:   ['M6 3h8l4.5 4.5V21H6z', 'M14 3v4.5h4.5', 'M9 12h6M9 15.5h6'],
    klammer:    ['M16.5 7.5l-7.8 7.8a2 2 0 0 0 2.8 2.8l8-8a4 4 0 0 0-5.7-5.6l-8.1 8.1a6 6 0 0 0 8.5 8.5l5.8-5.8'],
    liste:      ['M8 4.5H6.5A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H16', 'M9 3h6v3H9z', 'M8.5 11h7M8.5 14.5h7M8.5 18h4'],
    pin:        ['M9 3.5h6', 'M10 3.5v5.5l-3 3.5h10L14 9V3.5', 'M12 12.5V21'],
    kalender:   ['M4 5.5h16v15H4z', 'M4 10h16', 'M8.5 3v4.5M15.5 3v4.5'],
    uhr:        ['c12 12 8.5', 'M12 7.5V12l3 2'],
    sanduhr:    ['M6.5 3h11M6.5 21h11', 'M7.5 3c0 4.5 4.5 6 4.5 9s-4.5 4.5-4.5 9', 'M16.5 3c0 4.5-4.5 6-4.5 9s4.5 4.5 4.5 9'],
    glocke:     ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
    flagge:     ['M5 21V4', 'M5 4.5h12l-2 4 2 4H5'],
    diagramm:   ['M4.5 20.5h15', 'M7.5 17v-5M11.5 17V7.5M15.5 17v-7M19.5 17V5'],
    abmelden:   ['M14.5 4.5h4A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5h-4', 'M9.5 8l-4 4 4 4', 'M5.5 12H15'],
    extern:     ['M10 5.5H5.5v13h13V14', 'M13.5 4.5h6v6', 'M19.5 4.5L11 13'],
    senden:     ['M4 12L20 4l-4 16-4-6.5z', 'M12 13.5L20 4'],
    laden:      ['M12 3.5v11', 'M7.5 10l4.5 4.5 4.5-4.5', 'M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3'],
    hochladen:  ['M12 15V4', 'M7.5 8.5L12 4l4.5 4.5', 'M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3'],
    hoch:       ['M12 19.5V5', 'M6 11l6-6 6 6'],
    runter:     ['M12 4.5V19', 'M6 13l6 6 6-6'],
    zurueck:    ['M9 14L4.5 9.5 9 5', 'M4.5 9.5H15a5 5 0 0 1 0 10h-3'],
    drehenL:    ['M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9', 'M4.5 4.5V9H9'],
    drehenR:    ['M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9', 'M19.5 4.5V9H15'],
    tauschen:   ['M4 8h15l-3.5-3.5', 'M20 16H5l3.5 3.5'],
    vor:        ['M9 5.5l6.5 6.5L9 18.5'],
    zurueckV:   ['M15 5.5L8.5 12l6.5 6.5'],
    auf:        ['M5.5 15L12 8.5l6.5 6.5'],
    ab:         ['M5.5 9l6.5 6.5L18.5 9'],
    play:       ['!M7.5 4.8v14.4L19 12z'],
    stopp:      ['!M6.5 6.5h11v11h-11z'],
    vorspulen:  ['M4 6.5l7 5.5-7 5.5z', 'M12.5 6.5l7 5.5-7 5.5z'],

    // Menschen und Stimmen
    person:     ['c12 8 3.8', 'M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5'],
    personen:   ['c9 8.5 3.2', 'M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5', 'M15.5 5.5a3.2 3.2 0 0 1 0 6.2', 'M17.5 14.7c2.4.6 4 2.4 4 5.3'],
    ausweis:    ['M3.5 5.5h17v13h-17z', 'c9 10.8 2', 'M5.8 16c.5-1.5 1.7-2.3 3.2-2.3s2.7.8 3.2 2.3', 'M14.5 10h3.5M14.5 13.5h3.5'],
    sprechen:   ['M4 5h16v11h-9.5L6 20v-4H4z'],
    horn:       ['M3.5 10v4h3l8.5 4.5v-13L6.5 10z', 'M18 9a4 4 0 0 1 0 6', 'M6.5 14l1.3 5h2.5l-.9-4'],
    brief:      ['M3.5 6h17v12h-17z', 'M3.5 6.5l8.5 6.5 8.5-6.5'],
    hand:       ['M8 12.5V6a1.5 1.5 0 0 1 3 0v5', 'M11 10.5V4.5a1.5 1.5 0 0 1 3 0v6', 'M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.5 7-6.5 7-3 0-4.5-1.5-6-4l-2-3.5a1.5 1.5 0 0 1 2.5-1.6L8 13.5'],
    bund:       ['M2.5 11.5L6 8l3.2 1.2L12 8l2.8 1.2L18 8l3.5 3.5', 'M6.5 12.5l4.2 4.2a1.4 1.4 0 0 0 2 0l5-5', 'M9.5 11l2.8 2.8M12 9.2l3 3', 'M4.5 13.5l2 2'],
    hoch2:      ['M7 11.5l5-5 5 5', 'M7 17.5l5-5 5 5'],
    runter2:    ['M7 6.5l5 5 5-5', 'M7 12.5l5 5 5-5'],
    kappe:      ['M2.5 9L12 4.5 21.5 9 12 13.5z', 'M6.5 11v5c3 2.2 8 2.2 11 0v-5', 'M21.5 9v5'],
    maske:      ['M5 4.5c4 1.5 10 1.5 14 0V11c0 5-3.1 8.5-7 9.5-3.9-1-7-4.5-7-9.5z', 'M8.3 10c.8-.7 2-.7 2.8 0M12.9 10c.8-.7 2-.7 2.8 0', 'M9.5 15c1.5 1.2 3.5 1.2 5 0'],
    kopf:       ['M12 3a7 7 0 0 0-7 7c0 2.4 1 3.9 2 5v5.5h7v-2.5h2a2 2 0 0 0 2-2v-2l2-1-1.6-3A7 7 0 0 0 12 3z'],

    // Kampf
    schwerter:  ['M20.5 3.5l-.9 3.4-9.1 9.1-2.5-2.5 9.1-9.1z', 'M5.5 13.2l5.3 5.3', 'M7.6 16.4l-3.6 3.6', 'M3.5 3.5l.9 3.4 9.1 9.1 2.5-2.5-9.1-9.1z', 'M18.5 13.2l-5.3 5.3', 'M16.4 16.4l3.6 3.6'],
    klinge:     ['M20 4l-.9 3.4-9.6 9.6-2.5-2.5 9.6-9.6z', 'M5 13.2l5.8 5.8', 'M7.3 16.7L4 20'],
    axt:        ['M15.5 4.5L5 20.5', 'M11.2 8c2-3.2 6-4.6 9.4-4 .6 3.5-.8 7.5-4 9.5z'],
    bogen:      ['M7 3.5c6 2.4 9.5 5.6 9.5 8.5s-3.5 6.1-9.5 8.5', 'M7 3.5v17', 'M3.5 12h15.5', 'M16.5 9.5L19 12l-2.5 2.5', 'M3.5 12L2 10.5M3.5 12L2 13.5'],
    hammer:     ['M13.5 3.5l7 7-2.5 2.5-7-7z', 'M12.2 8.8L3.8 17.2a1.8 1.8 0 0 0 2.5 2.5l8.4-8.4'],
    dreizack:   ['M12 21V5.5', 'M6 4v5a6 6 0 0 0 12 0V4', 'M10.5 6L12 3l1.5 3'],
    schild:     ['M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z', 'M12 7.5v9M8 11.5h8'],
    helm:       ['M5.5 20.5v-8a6.5 6.5 0 0 1 13 0v8h-4.3v-5.5H9.8v5.5z', 'M12 6V3.5', 'M9.8 15h4.4'],
    ruestung:   ['M8 3.5l4 2 4-2 4 3-2 4.2V20.5H6V10.7l-2-4.2z', 'M12 5.5v15'],
    schaedel:   ['M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.3 3 5.4V19a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5v-3.1c1.7-1.1 3-2.8 3-5.4A7.5 7.5 0 0 0 12 3z', '!c9 11.5 1.7', '!c15 11.5 1.7', 'M10.5 20.5v-2.5M13.5 20.5v-2.5'],
    knochen:    ['M8.3 6.2a2.2 2.2 0 1 0-3.4 2.4 2.2 2.2 0 1 0 2.4 3.4l4.7 4.7a2.2 2.2 0 1 0 2.4 3.4 2.2 2.2 0 1 0 3.4-2.4 2.2 2.2 0 1 0-2.4-3.4L10.7 9.6a2.2 2.2 0 1 0-2.4-3.4z'],
    explosion:  ['M12 2.8l1.8 5.1 4.9-2.2-2.2 4.9 5.1 1.8-5.1 1.8 2.2 4.9-4.9-2.2-1.8 5.1-1.8-5.1-4.9 2.2 2.2-4.9-5.1-1.8 5.1-1.8-2.2-4.9 4.9 2.2z'],
    ziel:       ['c12 12 8.5', 'c12 12 5', '!c12 12 1.6'],
    herz:       ['M12 20s-8-4.7-8-10.5a4.5 4.5 0 0 1 8-2.9 4.5 4.5 0 0 1 8 2.9C20 15.3 12 20 12 20z'],
    tropfen:    ['M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'],
    stiefel:    ['M7.5 3.5h5V12l5.5 2.5a2.5 2.5 0 0 1 1.5 2.3V20H6.5z', 'M6.5 17h13'],
    guertel:    ['M3 10h18v4H3z', 'M10 8.8h4v6.4h-4z', 'M12 12h2'],
    arm:        ['M7.5 4.5h9l1.5 15h-12z', 'M7 9h10M6.5 14h11'],

    // Magie und Himmel
    kugel:      ['c12 10.5 6.5', 'M7.5 20h9l-1.6-3.6M9.1 16.4L7.5 20', 'M9 8.5a3.5 3.5 0 0 1 3-2'],
    stab:       ['M4 20L14.5 9.5', 'M16.5 3.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z', 'M20 11l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z'],
    funke:      ['!M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z'],
    funkeL:     ['M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z'],
    stern:      ['M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.1 6.6 20l1-6.1-4.4-4.3 6.1-.9z'],
    sternV:     ['!M12 3.2l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.1 6.6 20l1-6.1-4.4-4.3 6.1-.9z'],
    blitz:      ['M13 2.5L5.5 13.5H11l-1 8 8-11.5h-5.5z'],
    flamme:     ['M12 21c-4 0-6.5-2.7-6.5-6.2 0-3.3 2.5-5.3 3.5-8.3.9 2 2 3 3 3 0-3 1.5-5.5 3.5-6.5-.5 3 4 5.5 4 11.3 0 3.9-3 6.7-7.5 6.7z', 'M12 21c-1.8 0-3-1.2-3-2.9 0-1.9 1.6-2.8 2.2-4.6 1.4 1.4 3.8 2.5 3.8 4.6 0 1.7-1.2 2.9-3 2.9z'],
    schnee:     ['M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9', 'M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5'],
    welle:      ['M2.5 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2', 'M2.5 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2', 'M2.5 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 3-2'],
    wirbel:     ['M3.5 9h11a3 3 0 1 0-3-3', 'M3.5 13h15a3 3 0 1 1-3 3', 'M3.5 17h6'],
    mond:       ['M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
    sonne:      ['c12 12 4', 'M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8'],
    regenbogen: ['M3 18a9 9 0 0 1 18 0', 'M6.5 18a5.5 5.5 0 0 1 11 0', 'M10 18a2 2 0 0 1 4 0'],
    auge:       ['M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z', 'c12 12 2.8'],

    // Schrift und Wissen
    buch:       ['M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z', 'M12 6.5v13'],
    buecher:    ['M4 4.5h4v15H4z', 'M8 6.5h4v13H8z', 'M13.2 5.6l3.8-1 3.6 13.5-3.8 1z'],
    tagebuch:   ['M5.5 4.5A1.5 1.5 0 0 1 7 3h12v15H7a1.5 1.5 0 0 0-1.5 1.5z', 'M5.5 19.5A1.5 1.5 0 0 0 7 21h12v-3', 'M10 3v6l2-1.5L14 9V3'],
    rolle:      ['M8 3.5h10.5a2 2 0 0 1 0 4H17', 'M8 3.5a2 2 0 0 0-2 2V16.5', 'M17 7.5V18.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1 0-4H15a2 2 0 0 1 2 2', 'M9.5 9h4.5M9.5 12.5h4.5'],
    karte:      ['M3.5 6.5L9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z', 'M9 4v13.5M15 6.5V20'],
    kompass:    ['c12 12 8.5', 'M15.5 8.5l-2 5-5 2 2-5z'],
    bild:       ['M3.5 5.5h17v13h-17z', 'M3.5 15.5L8 11l4 4 2.5-2.5 6 6', 'c15.5 9.5 1.5'],
    kamera:     ['M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'c12 13.5 3.5'],
    palette:    ['M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.3.3-2.8 1.8-2.8H17a3.5 3.5 0 0 0 3.5-3.5c0-4.7-3.8-8.5-8.5-8.5z', '!c8 10.5 1.1', '!c11 7 1.1', '!c15.3 7.6 1.1'],
    musik:      ['M9 18V5.5l10-2V16', 'c7 18 2.2', 'c17 16 2.2'],
    spielkarte: ['M6.5 3.5h9A1.5 1.5 0 0 1 17 5v14a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5z', 'M19.5 7l.8.3a1.4 1.4 0 0 1 .9 1.8l-3.2 10.4', 'M11 9l2 3-2 3-2-3z'],
    wuerfel:    ['M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z', 'M12 7.2l4.4 7.6H7.6z', 'M12 2.5v4.7M3.5 7.4l4.1 7.4M20.5 7.4l-4.1 7.4M3.5 16.6l4.1-1.8M20.5 16.6l-4.1-1.8M12 21.5l-4.4-6.7M12 21.5l4.4-6.7'],

    // Habe und Gut
    rucksack:   ['M6 9.5a6 6 0 0 1 12 0V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', 'M9.5 4.5a2.5 2.5 0 0 1 5 0', 'M9 13.5h6v4H9z'],
    beutel:     ['M9 3.5h6l-1.5 3h-3z', 'M10.5 6.5C6 8.5 4 12.5 4 15.5 4 19 7 20.5 12 20.5s8-1.5 8-5c0-3-2-7-6.5-9', 'M9 9h6'],
    muenze:     ['c12 12 8.5', 'c12 12 5.2'],
    edelstein:  ['M6.5 4h11L21 9l-9 11.5L3 9z', 'M3 9h18', 'M9.5 4L8 9l4 11.5L16 9l-1.5-5'],
    krone:      ['M3.5 8l4 4 4.5-7 4.5 7 4-4-1.8 10.5H5.3z', 'M5.5 21h13'],
    ring:       ['c12 15 6', 'M9.5 5.5L12 3l2.5 2.5L12 8.5z'],
    amulett:    ['M7 3.5c0 4 2.5 7 5 8.5 2.5-1.5 5-4.5 5-8.5', 'c12 16.5 4', 'c12 16.5 1.5'],
    paket:      ['M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2z', 'M4 7.2l8 4.4 8-4.4', 'M12 11.6v9.6', 'M8 5l8 4.4'],
    truhe:      ['M3.5 10h17v9.5h-17z', 'M3.5 10c0-3 2-5.5 5-5.5h7c3 0 5 2.5 5 5.5', 'M3.5 13h17', 'M11 12h2v3h-2z'],
    trank:      ['M9.5 3h5', 'M10.5 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L13.5 9V3', 'M7.5 15h9'],
    becher:     ['M7 3.5h10c0 5-2 8-5 8.5-3-.5-5-3.5-5-8.5z', 'M12 12v8', 'M8 20.5h8'],
    krug:       ['M6 7h9.5v12a1.5 1.5 0 0 1-1.5 1.5H7.5A1.5 1.5 0 0 1 6 19z', 'M15.5 9.5H17a2.5 2.5 0 0 1 2.5 2.5v1.5A2.5 2.5 0 0 1 17 16h-1.5', 'M6 7c0-2 1.5-3 3-2.5 1-1.5 3.5-1.5 4.5 0 1.5-.3 2.5.8 2 2.5', 'M9 10.5v6.5M12.5 10.5v6.5'],
    vase:       ['M9 3.5h6', 'M10 3.5v3c-3 1.5-4.5 4-4.5 7 0 4 3 7 6.5 7s6.5-3 6.5-7c0-3-1.5-5.5-4.5-7v-3'],
    nahrung:    ['M12 7.5c-2-2-7-1.5-7 4 0 5 3.5 9.5 7 9 3.5.5 7-4 7-9 0-5.5-5-6-7-4z', 'M12 7.5c0-2 1-3.5 3-4.5'],
    kerze:      ['M9 10h6v10.5H9z', 'M12 10V7.5', 'M12 7.5c-1.3-1-1.3-2.7 0-4.5 1.3 1.8 1.3 3.5 0 4.5z'],
    laterne:    ['M9 3.5h6', 'M12 3.5v2', 'M8 5.5h8l1 3v9l-1 3H8l-1-3v-9z', 'M7 8.5h10M7 17.5h10', 'M12 11c-1 1-1.5 2-1.5 2.8a1.5 1.5 0 0 0 3 0c0-.8-.5-1.8-1.5-2.8z'],
    kette:      ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
    leiter:     ['M7.5 3v18M16.5 3v18', 'M7.5 7h9M7.5 11.5h9M7.5 16h9'],
    hut:        ['M7.5 15.5V5.5h9v10', 'M3 16.5c3 1.6 15 1.6 18 0', 'M7.5 12.5h9'],
    besen:      ['M15 3.5l-4 7', 'M7.5 10.5l7 4-2.8 6.2c-3-.8-5.8-2.8-7-5.5z', 'M8.5 15.5l3 2'],
    stein:      ['M4 16.5l2.5-7 5-3.5 5.5 2 3 6-3 5H7z'],
    blatt:      ['M5 19c0-8 5-14 15-14 0 10-6 15-14 15', 'M5 19l8-8'],
    rose:       ['M12 21v-8', 'M12 13c-3 0-5-2-5-5 2 0 3 .5 3.5 1.5C11 7 12 5.5 14 4.5c.5 2 .5 3.5-.5 5 1 0 2.5-.5 3.5-1.5 0 3-2 5-5 5z', 'M12 17.5c-2 0-3.5-1-4-2.5M12 18.5c1.5-1.5 3-2 4.5-1.5'],

    // Orte
    krugHaus:   ['M3.5 10.5L12 4l8.5 6.5', 'M5.5 9v11.5h13V9', 'M10 20.5v-5h4v5'],
    laden:      ['M3.5 9.5L5 4.5h14l1.5 5', 'M3.5 9.5a2.8 2.8 0 0 0 5.7 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.7 0', 'M5 11.5V20h14v-8.5', 'M10 20v-5h4v5'],
    automat:    ['M4 6.5h12.5v13H4z', 'M6.5 9h7.5v4.5H6.5z', 'M9 9v4.5M11.5 9v4.5', 'M16.5 10h2V5.5', 'c18.5 4.2 1.2', 'M6.5 16.5h7.5'],
    rad:        ['c12 12 8.5', 'c12 12 3', 'M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5'],
    pferd:      ['M7.5 20.5h10', 'M9 20.5c0-3 1.5-5 3.5-6.5L9 12.5 7 14l-1.5-2L10 6.5l1-3 1.5 2c4 .5 6 4 6 8.5v6.5'],

    // Karte und Wetter (vor allem im Planer)
    dorf:       ['M2.5 12L7 8l4.5 4', 'M3.5 11v8.5h7V11', 'M12.5 10L17 6l4.5 4', 'M13.5 9.5v10h7v-10'],
    kirche:     ['M12 2.5v4M10.5 4h3', 'M6 21v-9l6-5 6 5v9z', 'M10 21v-4.5a2 2 0 0 1 4 0V21'],
    tempel:     ['M3 9l9-5 9 5z', 'M5 9.5v9M9.5 9.5v9M14.5 9.5v9M19 9.5v9', 'M3 20.5h18'],
    anker:      ['c12 5 2', 'M12 7v14', 'M8 11h8', 'M4.5 14a7.5 7.5 0 0 0 15 0', 'M4.5 14L3 15.5M19.5 14l1.5 1.5'],
    baum:       ['M12 3l5 6.5h-2.5l4 5.5H15l3 4H6l3-4H5.5l4-5.5H7z', 'M12 19v2.5'],
    berg:       ['M2.5 19.5l7-12 4 6.5 2.5-3.5 5.5 9z', 'M7.5 11l2 1.5 2-1.5'],
    hoehle:     ['M3 19.5c0-6 4-11 9-11s9 5 9 11z', 'M8 19.5c0-3 1.8-5.5 4-5.5s4 2.5 4 5.5'],
    frage:      ['M9 9a3 3 0 1 1 4.3 2.7c-.8.4-1.3 1.2-1.3 2.1V15', '!c12 18.4 1'],
    ausruf:     ['M12 4.5v10', '!c12 18.5 1.1'],
    wolke:      ['M7 18.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6-1.5 4.5 4.5 0 0 1 .4 9.5z'],
    wolkeSonne: ['c8 8 2.5', 'M8 3v1.5M3 8h1.5M4.5 4.5l1 1M11.5 4.5l-1 1', 'M9.5 20a3.5 3.5 0 0 1-.4-7 5 5 0 0 1 9.4-1.2A4 4 0 0 1 18 20z'],
    regen:      ['M7 15.5a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 6a4.5 4.5 0 0 1 .5 9.5z', 'M8 18.5l-1 2.5M12 18.5l-1 2.5M16 18.5l-1 2.5'],
    gewitter:   ['M7 15.5a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 6a4.5 4.5 0 0 1 .5 9.5z', 'M12.5 13.5l-2 3.5h3l-2 3.5'],
    hex:        ['M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z'],
    figur:      ['c12 5 2.2', 'M12 7.5v7', 'M7.5 10.5h9', 'M12 14.5l-3 6M12 14.5l3 6'],
    weg:        ['M8.5 3.5L5 20.5', 'M15.5 3.5l3.5 17', 'M7.3 8h9.4M6.4 12.5h11.2M5.5 17h13'],
    schirm:     ['M3.5 5h17v11h-17z', 'M9 20h6', 'M12 16v4'],
    vollbild:   ['M4 9V4h5', 'M15 4h5v5', 'M20 15v5h-5', 'M9 20H4v-5'],
    karren:     ['M3 5h2.5l2 10h10l2-7H6.5', 'c9 19 1.5', 'c16 19 1.5'],
    schiff:     ['M12 3v13', 'M12 4.5l6 9.5h-6', 'M11 6.5L6 14h5', 'M3.5 17h17l-2.2 3.5H5.7z'],
    offline:    ['M2.5 9a14 14 0 0 1 19 0', 'M5.5 12.5a9.5 9.5 0 0 1 13 0', 'M9 16a4.5 4.5 0 0 1 6 0', 'M3.5 3.5l17 17', '!c12 19.5 1'],
    lineal:     ['M3.5 15.5l12-12 5 5-12 12z', 'M7 12l2 2M10 9l2 2M13 6l2 2'],
    winkel:     ['M4 20V4l16 16z', 'M8 16v-3.5l3.5 3.5z'],
    kasten:     ['M5 5h14v14H5z'],
    kastenHaken:['M5 5h14v14H5z', 'M8.5 12l2.5 2.5 5-5'],

    // Getier
    tier:       ['M12 13c-3 0-5 2.5-5 4.5s2 3 5 3 5-1 5-3-2-4.5-5-4.5z', 'c6 10.5 1.6', 'c9.5 6.8 1.6', 'c14.5 6.8 1.6', 'c18 10.5 1.6'],
    vogel:      ['M3 13c4 0 6-3 8-6 1 3 3 5 7 5l3-2-1 4c-2 3-5 5-9 5-3 0-6-2-8-6z', 'M15.5 10.5h.01'],
    kaefer:     ['M12 7a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0v-4a3 3 0 0 0-3-3z', 'M12 7V4.5', 'M9 10.5L5 9M15 10.5l4-1.5M9 13.5H5M15 13.5h4M9.3 16L6 18.5M14.7 16l3.3 2.5'],
    schlange:   ['M5 19.5c3 0 4-2 4-4s-1-4 1-5 4 1 5-1-1-4 1-5 3 0 3 0', 'M18.5 4.5h.01'],
    fledermaus: ['M2.5 9c2 0 3 1 3.5 2.5C7 10 8.5 10 9.5 11c.5-1 1.5-2 2.5-2s2 1 2.5 2c1-1 2.5-1 3.5.5.5-1.5 1.5-2.5 3.5-2.5-1 4-4 7-9.5 8.5C6.5 16 3.5 13 2.5 9z'],
    krake:      ['M7 11a5 5 0 0 1 10 0v2H7z', 'M7 13c0 3-2 4-3 6M9.5 13.5c0 3-1 5-2 6.5M14.5 13.5c0 3 1 5 2 6.5M17 13c0 3 2 4 3 6'],
    drache:     ['M3 19c4-1 6-4 6.5-8 2 2 4.5 2 6.5 1-1 3.5-4 6-8 7', 'M9.5 11c0-3.5 2-6.5 5-7.5 0 2 .8 3.5 2.5 4.5 1.3-1.3 3-1.8 4.5-1.5-.8 2.2-2.5 3.8-5 4.5'],
  };

  // ── Welches Zeichen welches Icon ist ─────────────────────────
  var Z = {};
  var zu = function (name, zeichen) { zeichen.split(' ').forEach(function (z) { if (z) Z[z] = name; }); };
  zu('x', '✕ ✗ ❌ ✖');
  zu('haken', '✓ ✔ ✅');
  zu('kastenHaken', '☑');
  zu('kasten', '☐');
  zu('stift', '✎ ✏ ✍ 📝 🖊 🖋');
  zu('kreuz', '✚ 💉 🩺 🧬 ⛑');
  zu('menue', '☰');
  zu('lupe', '🔍 🔎 🔭 🔬');
  zu('zahnrad', '⚙');
  zu('werkzeug', '🔧 🛠 🪛 🔩 ⛏ 🪚 🪤 🪣 🧲 ✂ 🪝 🧱 🔨');
  zu('schloss', '🔒 🔐');
  zu('schluessel', '🔑 🗝');
  zu('warnung', '⚠');
  zu('verbot', '🚫 ⛔');
  zu('diskette', '💾');
  zu('muell', '🗑');
  zu('ordner', '📂 📁');
  zu('dokument', '📄 📃 📑 📥 📤');
  zu('klammer', '📎');
  zu('liste', '📋');
  zu('pin', '📌 📍');
  zu('kalender', '📅 📆 🗓');
  zu('uhr', '⏰ 🕰 ⌚ ⏱');
  zu('sanduhr', '⏳ ⌛');
  zu('glocke', '🔔');
  zu('flagge', '🏁 🚩 🏴 ⚑');
  zu('diagramm', '📊 📈');
  zu('abmelden', '⎋');
  zu('extern', '↗');
  zu('senden', '➤');
  zu('laden', '⬇ ↧ ⇩');
  zu('hochladen', '⬆ ⇪');
  zu('hoch', '⇧ 👍');
  zu('runter', '👎');
  zu('zurueck', '↩ ↶');
  zu('drehenL', '↺');
  zu('drehenR', '↻ 🔄 🔁');
  zu('tauschen', '⇄');
  zu('vor', '▸ ► ▹');
  zu('zurueckV', '◀ ◄ ◂');
  zu('auf', '▲ ▴ 🔺');
  zu('ab', '▼ ▾');
  zu('play', '▶');
  zu('stopp', '⏹ ■');
  zu('vorspulen', '⏩ ⏭');
  zu('person', '👤 🧑 🧔 🧙 👸 💃 🪆 🗿');
  zu('personen', '👥');
  zu('ausweis', '🪪');
  zu('sprechen', '🗣 💬 🗨');
  zu('horn', '📣 📢 📯 📡');
  zu('brief', '✉ 📫 📨 📩 💌');
  zu('hand', '🤚 ✊ ✋ 🧤 🥋');
  zu('bund', '🤝');
  zu('kappe', '🎓');
  zu('maske', '🎭 🤹');
  zu('kopf', '🧠');
  zu('schwerter', '⚔');
  zu('klinge', '🗡 🔪 🪃');
  zu('axt', '🪓');
  zu('bogen', '🏹');
  zu('hammer', '⚒ 🏏');
  zu('dreizack', '🔱');
  zu('schild', '🛡 🔰');
  zu('helm', '🪖');
  zu('ruestung', '🧥 👘 🦺 🧣');
  zu('schaedel', '💀 ☠');
  zu('knochen', '🦴 🦷');
  zu('explosion', '💥 🎇 🎆 ☄ 🧨');
  zu('ziel', '🎯');
  zu('herz', '❤ 🫀 🫁');
  zu('tropfen', '🩸 💧');
  zu('stiefel', '🥾 👟');
  zu('guertel', '🎗 🎀');
  zu('arm', '💪');
  zu('kugel', '🔮');
  zu('stab', '🪄');
  zu('funke', '✦ ✨ 💫 ✶ ✴ ⚜ ✧');
  zu('sternV', '★ ⭐ 🌟');
  zu('stern', '☆');
  zu('blitz', '⚡');
  zu('flamme', '🔥 🪵');
  zu('schnee', '❄');
  zu('welle', '🌊');
  zu('wirbel', '🌀 🌪 💨');
  zu('mond', '☾ 🌙 ☽');
  zu('sonne', '☀');
  zu('regenbogen', '🌈');
  zu('auge', '👁');
  zu('buch', '📖');
  zu('buecher', '📚');
  zu('tagebuch', '📔 📒 📓 📕');
  zu('rolle', '📜');
  zu('karte', '🗺 🗾');
  zu('kompass', '🧭');
  zu('bild', '🖼');
  zu('kamera', '📷 📸');
  zu('palette', '🎨 🎪 🎠 🎬');
  zu('musik', '🎵 🎶 🎸 🎻 🎺 🥁');
  zu('spielkarte', '🃏 🎴 🀄 🂠');
  zu('wuerfel', '🎲');
  zu('rucksack', '🎒');
  zu('beutel', '💰 👜 💴 💵');
  zu('muenze', '🪙 ⛃');
  zu('edelstein', '💎 🪩');
  zu('krone', '👑');
  zu('ring', '💍 ⭕');
  zu('amulett', '📿 🧿 🪬 ☥');
  zu('paket', '📦 🗃 🗄');
  zu('truhe', '🧰 🧺 🎁');
  zu('trank', '🧪');
  zu('becher', '🍵 🫖 🍷 🥃 🍶');
  zu('krug', '🍺 🍻');
  zu('vase', '🏺 🫙 🍯');
  zu('nahrung', '🍎 🍇 🍄 🌰 🍒 🍋 🍊 🍞 🧀 🍖 🟣');
  zu('kerze', '🕯');
  zu('laterne', '🪔 🔦 💡');
  zu('kette', '⛓ 🔗 ♾');
  zu('leiter', '🪜');
  zu('hut', '🎩');
  zu('besen', '🧹');
  zu('stein', '🪨');
  zu('blatt', '🌿 🍀 🌱 🌾 ☘ 🪷');
  zu('rose', '🌹 🌻 🌸 🌺');
  zu('krugHaus', '🏠 🏡 🏰 🏯');
  zu('laden', '🏪');
  zu('automat', '🎰');
  zu('rad', '🎡');
  zu('pferd', '🐎 🦄 🐂 🐴 🏇');
  zu('tier', '🐺 🦊 🐗 🦁 🐻 🐕 🐈');
  zu('vogel', '🦅 🐦 🦜 🐓 🦚 🦩 🪶');
  zu('kaefer', '🦂 🕷 🦟 🦋 🪲 🐜');
  zu('schlange', '🐍 🦎');
  zu('fledermaus', '🦇 🧛');
  zu('krake', '🐙 🦑 🦀');
  zu('drache', '🐲 🐉');
  zu('dorf', '🏘');
  zu('kirche', '⛪');
  zu('tempel', '🏛');
  zu('anker', '⚓');
  zu('baum', '🌲 🌳');
  zu('berg', '⛰ 🏔');
  zu('hoehle', '🕳');
  zu('frage', '❓ ❔');
  zu('ausruf', '❗ ❕');
  zu('wolke', '☁');
  zu('wolkeSonne', '🌤 ⛅ 🌥');
  zu('regen', '🌧 🌦');
  zu('gewitter', '⛈ 🌩');
  zu('hex', '⬡ ⬢');
  zu('figur', '🧍 🚶');
  zu('weg', '🛤');
  zu('schirm', '📺 🖥');
  zu('vollbild', '⛶');
  zu('karren', '🛒');
  zu('schiff', '⛵ 🚢');
  zu('offline', '📴');
  zu('lineal', '📏');
  zu('winkel', '📐');

  // Die Auswahl fuer Gegenstaende und Waffen: jedes Icon einmal, mit dem
  // Zeichen, das im Bogen gespeichert wird.
  var WAHL = [
    {label: 'Waffen',            icons: ['⚔', '🗡', '🪓', '🏹', '🔨', '🔱', '💥']},
    {label: 'Rüstung & Kleidung', icons: ['🛡', '🪖', '🧥', '🧤', '🥾', '🎗', '💪', '🎩', '🎭']},
    {label: 'Magie',             icons: ['🔮', '🪄', '✨', '⚡', '🔥', '❄', '🌊', '🌀', '🌙', '☀', '⭐', '👁']},
    {label: 'Schmuck & Schätze', icons: ['💍', '📿', '💎', '👑', '🪙', '💰', '🏺']},
    {label: 'Tränke & Essen',    icons: ['🧪', '🍷', '🍺', '🍎', '🩸', '🌿', '🌹']},
    {label: 'Schriften',         icons: ['📜', '📖', '📚', '📔', '🗺', '🧭', '✉', '📄']},
    {label: 'Werkzeug & Licht',  icons: ['🔑', '🔧', '⛓', '🪜', '🕯', '🪔', '🎒', '📦', '🧰', '🧹']},
    {label: 'Tiere & Wesen',     icons: ['🐲', '🐎', '🐺', '🦅', '🕷', '🐍', '🦇', '🐙', '💀', '🦴']},
    {label: 'Sonstiges',         icons: ['🎲', '🎯', '🃏', '🎵', '🎨', '❤', '🤝', '🪨', '🧠', '🔔']},
  ];

  // ── Zeichnen ──────────────────────────────────────────────────
  var NS = 'http://www.w3.org/2000/svg';
  var teile = function (name) {
    var d = I[name] || I.funkeL;
    return d.map(function (s) {
      var voll = s.charAt(0) === '!';
      if (voll) s = s.slice(1);
      if (s.charAt(0) === 'c') {
        var p = s.slice(1).trim().split(/\s+/).map(Number);
        return {kreis: true, cx: p[0], cy: p[1], r: p[2], voll: voll};
      }
      return {d: s, voll: voll};
    });
  };
  // Fuer React: ein <svg> mit seinen Pfaden. Das Zeichen, fuer das es
  // steht, liegt unsichtbar darin (<desc>): nicht zu sehen, nicht
  // vorgelesen (aria-hidden), aber im textContent — wer die Seite nach
  // Text absucht oder kopiert, findet weiter „⚔ Kampf".
  var reactIcon = function (R, name, key, zeichen) {
    var kinder = teile(name).map(function (t, i) {
      var stil = t.voll ? {fill: 'currentColor', stroke: 'none'} : null;
      return t.kreis
        ? R.__hbAlt('circle', {key: i, cx: t.cx, cy: t.cy, r: t.r, style: stil})
        : R.__hbAlt('path', {key: i, d: t.d, style: stil});
    });
    if (zeichen) kinder.unshift(R.__hbAlt('desc', {key: 'z'}, zeichen));
    return R.__hbAlt.apply(null, ['svg', {key: key, className: 'ik ik-' + name, viewBox: '0 0 24 24',
      'aria-hidden': 'true', focusable: 'false'}].concat(kinder));
  };
  // Fuer Seiten ohne React (js/neu.js): dasselbe als Markup.
  var markup = function (name) {
    return '<svg class="ik ik-' + name + '" viewBox="0 0 24 24" aria-hidden="true">'
      + teile(name).map(function (t) {
        var f = t.voll ? ' style="fill:currentColor;stroke:none"' : '';
        return t.kreis ? '<circle cx="' + t.cx + '" cy="' + t.cy + '" r="' + t.r + '"' + f + '/>'
                       : '<path d="' + t.d + '"' + f + '/>';
      }).join('') + '</svg>';
  };

  // Ein Zeichen samt Variationswahl (U+FE0F) und Verbindungen (U+200D),
  // z. B. 🐦‍⬛ oder 👁️‍🗨️. Gesucht wird nach dem ersten Zeichen.
  var EINS = '(?:[\\u2190-\\u21FF\\u2300-\\u23FF\\u25A0-\\u25FF\\u2600-\\u27BF\\u2B00-\\u2BFF]|\\uD83C[\\uDC00-\\uDFFF]|\\uD83D[\\uDC00-\\uDFFF]|\\uD83E[\\uDC00-\\uDFFF])';
  var MUSTER = new RegExp(EINS + '\\uFE0F?(?:\\u200D' + EINS + '\\uFE0F?)*', 'g');
  var VORAB = /[←-➿⬀-⯿\uD83C-\uD83E]/;
  var ersterVon = function (s) {
    var c = s.charCodeAt(0);
    return c >= 0xD800 && c <= 0xDBFF ? s.slice(0, 2) : s.charAt(0);
  };
  var nameVon = function (zeichen) { return Z[ersterVon(zeichen)] || null; };

  // Ein Text in Stuecke: Text und Icons. Zeichen ohne Icon bleiben Text.
  var zerlegen = function (R, text, praefix) {
    if (!VORAB.test(text)) return null;
    MUSTER.lastIndex = 0;
    var raus = [], letzt = 0, m, n = 0, getroffen = false;
    while ((m = MUSTER.exec(text))) {
      var name = nameVon(m[0]);
      if (!name) continue;
      getroffen = true;
      if (m.index > letzt) raus.push(text.slice(letzt, m.index));
      raus.push(reactIcon(R, name, praefix + (n++), m[0]));
      letzt = m.index + m[0].length;
    }
    if (!getroffen) return null;
    if (letzt < text.length) raus.push(text.slice(letzt));
    return raus;
  };
  // Wo kein Bild hin kann: das Zeichen samt folgendem Leerzeichen weg.
  var tilgen = function (text) {
    if (!VORAB.test(text)) return text;
    MUSTER.lastIndex = 0;
    return text.replace(MUSTER, function (z) { return nameVon(z) ? '\u0000' : z; })
               .replace(/\u0000\s?/g, '').trim();
  };

  var OHNE_BILD = {option: 1, textarea: 1, title: 1, style: 1, script: 1};
  var ATTR = ['placeholder', 'title', 'aria-label', 'alt'];

  var anReact = function (R) {
    if (!R || R.__hbAlt) return;
    var alt = R.createElement;
    R.__hbAlt = alt;
    R.createElement = function (typ, props) {
      var n = arguments.length;
      if (n < 3 && !props) return alt.apply(null, arguments);
      // Attribute: ohne Zeichen.
      if (props) {
        for (var a = 0; a < ATTR.length; a++) {
          var v = props[ATTR[a]];
          if (typeof v === 'string' && VORAB.test(v)) {
            var neu = {};
            for (var k in props) neu[k] = props[k];
            for (var b = 0; b < ATTR.length; b++) {
              if (typeof neu[ATTR[b]] === 'string') neu[ATTR[b]] = tilgen(neu[ATTR[b]]);
            }
            props = neu;
            break;
          }
        }
      }
      if (n < 3) return alt(typ, props);
      var roh = typeof typ === 'string' && (OHNE_BILD[typ] || (props && props['data-emoji']));
      var args = [typ, props], geaendert = false;
      for (var i = 2; i < n; i++) {
        var kind = arguments[i];
        if (typeof kind === 'string' && VORAB.test(kind)) {
          if (roh) {
            if (OHNE_BILD[typ]) { args.push(tilgen(kind)); geaendert = true; continue; }
          } else {
            var stuecke = zerlegen(R, kind, 'ik' + i + '_');
            if (stuecke) { args.push.apply(args, stuecke); geaendert = true; continue; }
          }
        } else if (Array.isArray(kind) && !roh) {
          // Ein Feld von Kindern ({liste.map(...)}): Texte darin ebenso.
          var feld = null;
          for (var j = 0; j < kind.length; j++) {
            if (typeof kind[j] === 'string' && VORAB.test(kind[j])) {
              var st = zerlegen(R, kind[j], 'ik' + i + '_' + j + '_');
              if (st) { if (!feld) feld = kind.slice(0, j); feld.push(R.__hbAlt.apply(null, [R.Fragment, {key: 'ikf' + j}].concat(st))); continue; }
            }
            if (feld) feld.push(kind[j]);
          }
          if (feld) { args.push(feld); geaendert = true; continue; }
        }
        args.push(kind);
      }
      return alt.apply(null, geaendert ? args : arguments);
    };
  };

  window.HB_IKONEN = {
    namen: Object.keys(I),
    zeichen: Z,
    wahl: WAHL,
    nameVon: nameVon,
    markup: markup,
    tilgen: tilgen,
    // Ein Icon gezielt, mit Namen: HB_IKONEN.react('schwerter').
    react: function (name, key) { return reactIcon(window.React, name, key); },
  };
  if (window.React) anReact(window.React);
})();
