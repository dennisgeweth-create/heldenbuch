// Heldenbuch — die Bilder der Gegenstände.
//
// Im Inventar und in der Ansicht eines Gegenstands steht sein Bild groß —
// dort waren die schlichten Strich-Icons (js/icons.js) zu karg. Hier sind
// die Gegenstände mehrfarbig gezeichnet: im 48er-Raster, mit einer
// gemeinsamen dunklen Kontur, aus einer festen Palette (Stahl, Gold,
// Leder, Holz, Stoff, Pergament, Glas). Klein, in Listen und Knöpfen,
// steht weiter das Strich-Icon, das jedes Bild als `linie` nennt.
//
// Gespeichert wird im Bogen ein Kürzel „ib:kettenhemd" (oder, bei alten
// Gegenständen, ein Emoji, das hier einem Bild zugeordnet ist). Hat ein
// Gegenstand gar keins, rät `raten(name)` nach seinem Namen.
//
// Muss nach js/icons.js geladen werden; ohne React tut es nichts.
(function () {
  'use strict';
  if (!window.HB_IKONEN) return;

  // ── Die Palette ───────────────────────────────────────────────
  var P = {
    stahl: '#dfe5eb', stahlM: '#a7b2bd', stahlD: '#6c7883',
    gold: '#f2cf68', goldD: '#c4932c',
    leder: '#a2683a', lederD: '#6f4422', lederH: '#c48a55',
    holz: '#b47c45', holzD: '#7e532a',
    rot: '#bf3640', rotD: '#7f2028', blau: '#3f72b5', blauD: '#294d80',
    gruen: '#4f914f', gruenD: '#2f5e30', violett: '#7d55b4', violettD: '#523485',
    braun: '#8c6b4a', braunD: '#5c4530',
    papier: '#f3e6c4', papierD: '#d9c39a',
    glas: '#cfe9f5', flamme: '#ff8a25', flammeH: '#ffd25e',
    rubin: '#e3405c', saphir: '#4aa8ea', smaragd: '#3cc78c',
    knochen: '#eee3c9', hanf: '#c99c5c', hanfD: '#a17636',
  };
  // Je Bild eine Liste. Erstes Zeichen sagt, wie gezeichnet wird:
  //   F:farbe  gefüllt, mit Kontur      E:farbe  dasselbe, mit Loch (evenodd)
  //   f:farbe  gefüllt, ohne Kontur     h        Lichtkante (weiß, halb durchsichtig)
  //   L        feine Linie in Konturfarbe
  //   S:farbe  Linie in Farbe           W:farbe  breite Linie in Farbe
  // Danach ein Pfad — oder „c x y r" für einen Kreis.
  var B = {
    // ── Waffen ──
    langschwert: {linie: 'klinge', label: 'Langschwert', teile: [
      'F:stahl M42 5.5l-1.6 5.8-21.2 21.2-4.2-4.2L36.2 7.1z',
      'S:stahlM M39.6 8.4L18.2 29.8',
      'F:gold M9.6 26.4l2.9-2.9 12 12-2.9 2.9z',
      'F:leder M14.6 33.1l2.3 2.3-6.1 6.1-2.3-2.3z',
      'F:gold c 7.4 41.4 2.7', 'h M40.6 7.4l-.6 2.1-19 19-1-1z']},
    saebel: {linie: 'klinge', label: 'Säbel', teile: [
      'F:stahl M41.5 4.5c-1.5 11-9.5 21.5-21 25.5l-2.8-2.8C28 21 36 13.5 41.5 4.5z',
      'h M40 7.5c-2.5 8.5-9 16-17.5 20l-.8-.8C30 22.5 36.5 15.5 40 7.5z',
      'F:gold M13.5 24.6c3-2 6.4-1.2 8.6 1l2.3 2.3c2.2 2.2 3 5.6 1 8.6l-2.4-2.4c.7-1.4.2-3-1-4.1l-1.9-1.9c-1.1-1.2-2.7-1.7-4.1-1z',
      'F:lederD M16.2 31.8l2.2 2.2-6.4 6.4-2.2-2.2z', 'F:gold c 8.6 41.6 2.4']},
    dolch: {linie: 'klinge', label: 'Dolch', teile: [
      'F:stahl M38.5 9.5l-1.2 4.6-12.9 12.9-3.4-3.4 12.9-12.9z',
      'h M37.4 10.6l-.6 2.2-11.4 11.4-.8-.8z',
      'F:gold M16.8 22.4l2.5-2.5 9.3 9.3-2.5 2.5z',
      'F:leder M20.3 28.3l2 2-5.5 5.5-2-2z', 'F:gold c 14.2 37.8 2.3']},
    streitaxt: {linie: 'axt', label: 'Streitaxt', teile: [
      'F:holz M33.4 6.8l3.1 2.1-21.6 34.6-3.1-2.1z',
      'F:stahl M26.5 9.2C30 4.4 36.6 2.6 41.8 5.2c1.4 5.6-.4 11.8-5 15.8z',
      'h M30 8.2c3-2.6 7.4-3.6 10.4-2.4.6 2.6.2 5.4-1 7.8z',
      'F:stahlD M27 10.6l-4.6 1.4 2.6 3.6 3.2-2.2z', 'F:lederD M17.5 34.6l3.1 2.1-1.7 2.7-3.1-2.1z']},
    kriegshammer: {linie: 'hammer', label: 'Kriegshammer', teile: [
      'F:holz M27.6 16.6l3 3-19.7 21.8-3-3z',
      'F:stahlD M26.5 5.5l16 16-5.6 5.6-16-16z', 'F:stahl M28.4 7.4l12.2 12.2-1.9 1.9-12.2-12.2z',
      'F:lederD M14.8 33.4l3 3-2.3 2.5-3-3z']},
    streitkolben: {linie: 'hammer', label: 'Streitkolben', teile: [
      'F:holz M23.4 21.6l3 3-14.6 15.6-3-3z',
      'F:stahlD M31 6.5l3 6 6.5 1-2.5 6 3.5 5.5-6.5 1-3 6-4.5-4.5-6 1.5 1.5-6-4.5-4.5 6-2.5 1-6.5z',
      'F:stahl c 30.5 17.5 6', 'h M27 14.5a4.5 4.5 0 0 1 5-2.2', 'F:gold M10.8 35.2l3 3-1.6 1.7-3-3z']},
    speer: {linie: 'dreizack', label: 'Speer', teile: [
      'F:holz M34.4 11.8l2.2 2.2L8.6 43.2l-2.2-2.2z',
      'F:stahl M44 4c-1 6.3-4.3 10.3-9 11.8l-2.6-2.6C33.9 8.5 37.8 5.1 44 4z',
      'S:stahlM M42.6 5.4l-8.4 8.4', 'F:gold M31.6 13.6l2.8 2.8-1.8 1.8-2.8-2.8z']},
    kampfstab: {linie: 'stab', label: 'Kampfstab', teile: [
      'F:holz M38.6 4.8l3.2 3.2L9.4 43.2l-3.2-3.2z', 'h M39.4 6.6l.8.8L8.6 41.4l-.8-.8z',
      'F:gold M34.6 9.4l3.6 3.6-1.8 1.9-3.6-3.6z', 'F:gold M11.8 34.2l3.6 3.6-1.8 1.9-3.6-3.6z',
      'F:lederD M21.6 23.4l3.6 3.6-2.6 2.8-3.6-3.6z']},
    zauberstab: {linie: 'stab', label: 'Zauberstab', teile: [
      'F:holzD M9.4 40.2l19-19 2.4 2.4-19 19z', 'F:gold M25.6 20.2l2.4 2.4-1.6 1.6-2.4-2.4z',
      'f:saphir c 32.5 15.5 6', 'F:glas c 32.5 15.5 3.4',
      'F:flammeH M39.5 5.5l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z',
      'F:flammeH M42 18l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z']},
    bogen: {linie: 'bogen', label: 'Langbogen', teile: [
      'F:holz M12.5 3c17.5 6 17.5 36 0 42l3.2-3.6C24 35 24 13 15.7 6.6z',
      'F:lederD M17.2 20.4h4.4v7.2h-4.4z', 'L M14 5.4v37.2', 'W:holzD M7 24h29.5', 'F:stahl M42 24l-5.6-3.6v7.2z',
      'F:rot M8.4 24l-3.8-3.6h4.8l2.2 3.6-2.2 3.6H4.6z']},
    armbrust: {linie: 'bogen', label: 'Armbrust', teile: [
      'F:holz M21 13h6v29a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z',
      'F:stahlD M5.5 15.5c6.5-4 30.5-4 37 0l-1.2 3.2c-6.2-3.6-28.4-3.6-34.6 0z',
      'L M7 18.5L24 26l17-7.5', 'S:holzD M24 4v22', 'F:stahl M24 2.5l-2.4 4h4.8z',
      'F:stahlD M22 30h4v4h-4z']},
    koecher: {linie: 'bogen', label: 'Köcher mit Pfeilen', teile: [
      'S:holzD M18 16L13 4M24 16V3M30 16l5-12',
      'F:rot M11.2 3.2l3.6-1.2.4 4.6-2.6.9z', 'F:knochen M22.2 1.5h3.6l-.4 4.5h-2.8z', 'F:rot M33.2 2l3.6 1.2-1.4 4.4-2.6-.9z',
      'F:leder M15 14h18l-2.2 29H17.2z', 'F:lederD M15 14h18v4H15z', 'F:gold M16.4 30h15.2v2.6H16.4z',
      'S:lederH M20 22v16']},

    // ── Rüstung ──
    lederruestung: {linie: 'ruestung', label: 'Lederrüstung', teile: [
      'F:leder M14 8l6-3h8l6 3 5 6-3.5 4V42H12.5V18L9 14z',
      'F:lederD M9 14l5-6 2 9-3.5 1zM39 14l-5-6-2 9 3.5 1z',
      'F:lederD M20 5h8l-4 7z', 'L M24 12v15', 'L M21.5 15h5M21.5 19h5M21.5 23h5',
      'F:lederD M12.5 30h23v3.4h-23z', 'F:gold M22 29.4h4v4.6h-4z', 'S:lederH M15 36h18']},
    kettenhemd: {linie: 'ruestung', label: 'Kettenhemd', teile: [
      'F:stahlM M14 8l6-3h8l6 3 6 7-4 3-2-2v26H12V16l-2 2-4-3z',
      'S:stahlD M13 17q1.8 1.8 3.6 0t3.6 0 3.6 0 3.6 0 3.6 0 3.6 0 3.6 0',
      'S:stahlD M13 21.5q1.8 1.8 3.6 0t3.6 0 3.6 0 3.6 0 3.6 0 3.6 0 3.6 0',
      'S:stahlD M13 26q1.8 1.8 3.6 0t3.6 0 3.6 0 3.6 0 3.6 0 3.6 0 3.6 0',
      'S:stahlD M13 30.5q1.8 1.8 3.6 0t3.6 0 3.6 0 3.6 0 3.6 0 3.6 0 3.6 0',
      'S:stahlD M13 35q1.8 1.8 3.6 0t3.6 0 3.6 0 3.6 0 3.6 0 3.6 0 3.6 0',
      'F:stahlD M19.5 5h9l-4.5 5.5z', 'h M14.5 9l5-2.5v32H14z']},
    schuppenpanzer: {linie: 'ruestung', label: 'Schuppenpanzer', teile: [
      'F:goldD M14 8l6-3h8l6 3 5 6-3.5 4V42H12.5V18L9 14z',
      'S:lederD M13 18a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0',
      'S:lederD M13 23.5a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0',
      'S:lederD M13 29a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0',
      'S:lederD M13 34.5a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.2 0',
      'F:lederD M20 5h8l-4 6z', 'h M13.5 18.5h4V41h-4z']},
    brustpanzer: {linie: 'ruestung', label: 'Brustpanzer', teile: [
      'F:stahl M11.5 10c3-2.2 6-3.6 8.6-4.2L24 9l3.9-3.2c2.6.6 5.6 2 8.6 4.2l-2.4 8.4c1.4 4.6 1.2 10.4-.8 14.8-2 4.8-5.8 8-9.3 9-3.5-1-7.3-4.2-9.3-9-2-4.4-2.2-10.2-.8-14.8z',
      'F:stahlD M20.1 5.8L24 9l3.9-3.2c-1.2-.3-2.5-.4-3.9-.4s-2.7.1-3.9.4z', 'S:stahlM M24 9v32', 'L M14 18.4c2 .8 5 1 7.6.6M34 18.4c-2 .8-5 1-7.6.6',
      'F:lederD M12.2 30h23.6l-.6 3.4H12.8z', 'F:gold M22.2 29.6h3.6v4.2h-3.6z',
      'h M14.4 11.6c1.6-1 3.4-1.8 5.2-2.4l-1.6 26.6c-2.4-3-4-7.2-3.8-12.6.2-2.6.6-4.6.6-4.6z', 'F:gold c 16 13.4 1.1', 'F:gold c 32 13.4 1.1']},
    plattenpanzer: {linie: 'ruestung', label: 'Plattenpanzer', teile: [
      'F:stahlM M4.5 13c1.5-4.5 5.5-7.5 10.5-7.5l1.5 9.5-8 4.5z', 'F:stahlM M43.5 13c-1.5-4.5-5.5-7.5-10.5-7.5L31.5 15l8 4.5z',
      'F:stahl M14 9c3.5-2 6.4-3 10-3s6.5 1 10 3l1 12c0 8.4-4.6 14-11 16-6.4-2-11-7.6-11-16z',
      'F:stahlD M19.5 6.5c1.3 2.4 2.7 3.5 4.5 3.5s3.2-1.1 4.5-3.5c-1.4-.3-2.9-.5-4.5-.5s-3.1.2-4.5.5z',
      'S:stahlM M24 10.5v26', 'F:stahlM M15.5 35.5h17L31 43H17z', 'L M16.5 39.2h15', 'h M16 11.6l3.6-1.6-.8 22.6C16.8 29.8 15.8 26 15.8 21.6z',
      'F:gold c 9.5 12 1.1', 'F:gold c 38.5 12 1.1']},
    helm: {linie: 'helm', label: 'Helm', teile: [
      'F:rot M21.5 7c-.5-3 1-4.5 2.5-4.5S27 4 26.5 7z',
      'F:stahl M11.5 15c0-5.5 5.5-9 12.5-9s12.5 3.5 12.5 9v19c0 5-5.5 9-12.5 9s-12.5-4-12.5-9z',
      'F:stahlD M13.5 20.5h8.5v3.4h-8.5zM26 20.5h8.5v3.4H26z', 'S:stahlM M24 7v35',
      'F:stahlD c 19.5 32 .9', 'F:stahlD c 22 34 .9', 'F:stahlD c 26 34 .9', 'F:stahlD c 28.5 32 .9',
      'h M14 15c0-3.5 3-6 7-7.2v11.6H14z']},
    spitzhut: {linie: 'hut', label: 'Spitzhut', teile: [
      'F:violettD M6 37c6-2.6 30-2.6 36 0l-2.6 4.6H8.6z',
      'F:violett M13.5 36.4L27 3.5c1 0 2 1 2.2 2.2L35 36.4z',
      'F:gold M13.7 31.6h21.2l.9 4H13z', 'F:flammeH M25 17l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
      'F:flammeH M29.5 25l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z', 'h M18 30.5L26.6 8l.8.6-6.6 22z']},
    kapuze: {linie: 'maske', label: 'Kapuze', teile: [
      'F:gruen M24 4c-8 0-13 6-13 14v7L5 40c6 3.4 32 3.4 38 0l-6-15v-7c0-8-5-14-13-14z',
      'F:gruenD M11 25c4 4 22 4 26 0l6 15c-6 3.4-32 3.4-38 0z',
      'F:#1b1611 M24 11c-4.6 0-7.4 3.6-7.4 8.4v5.2c2.6 2.4 12.2 2.4 14.8 0v-5.2c0-4.8-2.8-8.4-7.4-8.4z',
      'F:gold c 24 30.6 2', 'h M13 18c0-5.6 2.8-9.8 7-12-2 2.6-3.2 6-3.2 10v8c-1.4-.6-2.8-1.4-3.8-2.2z']},
    umhang: {linie: 'ruestung', label: 'Umhang', teile: [
      'F:rot M24 5c-5 0-9 3-10 7L7 42c5.5 2.4 28.5 2.4 34 0l-7-30c-1-4-5-7-10-7z',
      'F:rotD M18 12c1.6 3 3.6 4.4 6 4.4s4.4-1.4 6-4.4l3.4 30c-3.6 1-15.2 1-18.8 0z',
      'S:rotD M16 20l-4 20M32 20l4 20', 'F:gold c 24 11 2.6', 'h M13.6 13.4L9 40.6c-.8-.2-1.4-.4-2-.6l7-28z']},
    robe: {linie: 'ruestung', label: 'Robe', teile: [
      'F:blau M18 6h12l4.5 4 8 10.5-4.5 4-3.5-3.5V43H13.5V21L10 24.5l-4.5-4 8-10.5z',
      'F:blauD M20 6h8l-4 6z', 'F:gold M13.5 24h21v3.4h-21z', 'F:gold M13.5 40.4h21V43h-21z',
      'S:gold M24 27.4V40', 'h M15.5 10l3-4h1.4l-3 4v33h-1.4z']},
    tunika: {linie: 'ruestung', label: 'Tunika', teile: [
      'F:gruen M17 7h14l5.5 4 6 8-4.5 4.4-3-3V40H13V20.4l-3 3L5.5 19l6-8z',
      'F:gruenD M20 7h8l-4 5.5z', 'F:braunD M13 25h22v3.6H13z', 'F:gold M22.4 24.6h3.2v4.4h-3.2z',
      'S:gruenD M17 32v8M31 32v8', 'h M15 11l2.6-4h1.2l-2.4 4v29H15z']},
    hose: {linie: 'ruestung', label: 'Hose', teile: [
      'F:braun M14.5 6h19l2.4 36h-7.6L24.4 20l-3.9 22h-7.6z', 'F:braunD M14.5 6h19v4h-19z',
      'S:braunD M24.4 10v10', 'h M16.4 10.4h2L15.6 41H14.6z']},
    handschuhe: {linie: 'hand', label: 'Handschuhe', teile: [
      'F:lederD M15 32h15l1 11H14z',
      'F:leder M16 32V17a2.2 2.2 0 0 1 4.4 0v7V12.6a2.2 2.2 0 0 1 4.4 0V24V14.6a2.2 2.2 0 0 1 4.4 0V26l2.8-2.8a2.2 2.2 0 0 1 3.2 3.2L28 34z',
      'S:lederH M15.5 36.5h15']},
    panzerhandschuh: {linie: 'hand', label: 'Panzerhandschuh', teile: [
      'F:stahlD M14.5 31h16l1.5 12H13z',
      'F:stahl M16 31V17a2.2 2.2 0 0 1 4.4 0v7V12.6a2.2 2.2 0 0 1 4.4 0V24V14.6a2.2 2.2 0 0 1 4.4 0V26l2.8-2.8a2.2 2.2 0 0 1 3.2 3.2L28.4 33z',
      'L M16 21h4.4M20.4 18h4.4M24.8 20h4.4', 'S:stahlM M14.5 36.5h16.5', 'F:gold c 22.5 39.5 1.2']},
    armschienen: {linie: 'arm', label: 'Armschienen', teile: [
      'F:leder M14 9h20l2.4 30H11.6z', 'F:stahlM M13.6 14h20.8l.3 3.6H13.3z', 'F:stahlM M12.6 27h22.8l.3 3.6H12.3z',
      'F:gold c 24 15.8 1.3', 'F:gold c 24 28.8 1.3', 'h M15.6 9.6h3L16.4 38.4h-3z']},
    stiefel: {linie: 'stiefel', label: 'Stiefel', teile: [
      'F:leder M16 5h12v20l8.5 5.2c2 1.2 3 3 3 5.2V39H14V5z', 'F:lederD M15 5h14v5H15z',
      'F:#3d2c1d M13.5 38.5h26.4V43H13.5z', 'L M28 25l-4 3.5M30.6 26.6l-3.2 3', 'h M16.6 10.6h3V37h-3z']},
    guertel: {linie: 'guertel', label: 'Gürtel', teile: [
      'F:leder M3.5 20h41v8.4h-41z', 'S:lederH M5 22.2h38', 'E:gold M19.5 16.6h9.4v15.2h-9.4zM22.1 19.6v9.2h4.2v-9.2z',
      'S:stahlD M24.2 24.2h8', 'F:lederD c 36 24.2 1', 'F:lederD c 40 24.2 1']},
    wappenschild: {linie: 'schild', label: 'Schild', teile: [
      'F:stahlM M7.5 6.5h33v12.5c0 12.6-7.3 19.6-16.5 23.6C14.8 38.6 7.5 31.6 7.5 19z',
      'F:blau M10.5 9.5h27V19c0 10.4-5.9 16.6-13.5 20-7.6-3.4-13.5-9.6-13.5-20z',
      'F:gold M21.8 11h4.4v26h-4.4z', 'F:gold M12 18.4h24v4.4H12z', 'h M11.2 10.2h4V30c-2.4-2.8-4-6.4-4-11z']},
    rundschild: {linie: 'schild', label: 'Rundschild', teile: [
      'E:stahlD c 24 24 19 M24 8a16 16 0 1 0 .01 0z', 'F:holz c 24 24 16',
      'L M14 11.4v25.2M19 8.8v30.4M29 8.8v30.4M34 11.4v25.2', 'F:stahl c 24 24 5.4', 'h M21.6 21.4a3.4 3.4 0 0 1 3.2-2.2']},

    // ── Schmuck und Schätze ──
    ring: {linie: 'ring', label: 'Ring', teile: [
      'E:gold M24 17a11 11 0 1 0 .01 0zM24 21a7 7 0 1 1-.01 0z',
      'F:goldD M19.4 18.2l2.2-3.4h4.8l2.2 3.4z', 'F:rubin M24 7l5.4 5.4L24 18.8l-5.4-6.4z', 'h M22 10.6l2-2 1.2 1.2-2 2.4z']},
    amulett: {linie: 'amulett', label: 'Amulett', teile: [
      'S:goldD M11 4c2 10 6.6 15 13 19.4M37 4c-2 10-6.6 15-13 19.4',
      'F:gold c 24 30.5 9', 'F:goldD c 24 30.5 6.6', 'F:saphir c 24 30.5 4.4', 'h M21.8 28.4a2.8 2.8 0 0 1 2.4-1.6']},
    krone: {linie: 'krone', label: 'Krone', teile: [
      'F:gold M7 17l7 6.4 5.4-10.4L24 21l4.6-8 5.4 10.4 7-6.4-3.2 18.4H10.2z',
      'F:goldD M10 35.4h28l-.8 5H10.8z', 'F:rubin c 24 30 2.4', 'F:saphir c 15.6 30.4 1.8', 'F:smaragd c 32.4 30.4 1.8',
      'F:gold c 7 16.6 1.8', 'F:gold c 19.4 12.6 1.8', 'F:gold c 28.6 12.6 1.8', 'F:gold c 41 16.6 1.8']},
    maske: {linie: 'maske', label: 'Maske', teile: [
      'E:violett M5.5 17.5c6.5-3.4 12.5-3.2 18.5 2.2 6-5.4 12-5.6 18.5-2.2-1 8.6-5.2 13-10.5 13-3.4 0-6.2-2.6-8-5-1.8 2.4-4.6 5-8 5-5.3 0-9.5-4.4-10.5-13zM12 21.4c1.6-1.4 4.4-1.4 6 .6-1.6 1.8-4.4 1.8-6-.6zM30 22c1.6-2 4.4-2 6-.6-1.6 2.4-4.4 2.4-6 .6z',
      'S:gold M6 18c4-2 9-2.2 13 0M29 18c4-2.2 9-2 13 0', 'S:holzD M41.5 24l2.5 16']},
    edelstein: {linie: 'edelstein', label: 'Edelstein', teile: [
      'F:saphir M14 9.5h20l8.5 10.5L24 41 5.5 20z',
      'L M5.5 20h37M14 9.5l4 10.5 6 21 6-21 4-10.5M18 20l6-10.5L30 20', 'h M14.6 10.6l2.4 9H7.4z']},
    rubin: {linie: 'edelstein', label: 'Rubin', teile: [
      'F:rubin M14 9.5h20l8.5 10.5L24 41 5.5 20z',
      'L M5.5 20h37M14 9.5l4 10.5 6 21 6-21 4-10.5M18 20l6-10.5L30 20', 'h M14.6 10.6l2.4 9H7.4z']},
    muenzen: {linie: 'muenze', label: 'Münzen', teile: [
      'F:goldD c 17 30 10', 'F:gold c 17 30 8', 'S:goldD M13.6 30h6.8M17 26.6v6.8',
      'F:goldD c 31 21 10', 'F:gold c 31 21 8', 'L M27 21a4 4 0 0 1 8 0 4 4 0 0 1-8 0', 'h M26 17a6 6 0 0 1 4-2']},
    beutel: {linie: 'beutel', label: 'Geldbeutel', teile: [
      'F:leder M18 12.5h12l-2 4c7 3 11.4 9 11.4 15 0 6.4-6.4 10.5-15.4 10.5S8.6 37.9 8.6 31.5c0-6 4.4-12 11.4-15z',
      'F:goldD M16.6 15.4h14.8v3.2H16.6z', 'F:gold c 20 9.4 3', 'F:gold c 27.4 8.6 2.6',
      'S:lederH M13 30c1-4 3.4-7.4 6.6-9.4', 'F:gold c 24 30 3', 'L M22.4 30h3.2']},
    truhe: {linie: 'truhe', label: 'Truhe', teile: [
      'F:holz M5.5 22h37v19h-37z', 'F:holzD M5.5 22c0-8 6-12.5 12.5-12.5h12c6.5 0 12.5 4.5 12.5 12.5z',
      'F:stahlM M10.5 10.6h4.4v30.4h-4.4zM33.1 10.6h4.4v30.4h-4.4z', 'F:stahlD M5.5 22h37v2.6h-37z',
      'F:gold M21 20h6v8h-6z', 'F:holzD c 24 25.4 1.1', 'L M16 30h4M28 30h4M16 35h4M28 35h4']},

    // ── Tränke und Proviant ──
    trank_rot: {linie: 'trank', label: 'Heiltrank', teile: [
      'F:holz M19 3h10v4.6H19z', 'F:glas M20.4 7.6h7.2v7.6h-7.2z', 'F:glas c 24 28.5 13',
      'f:rubin M11.6 27.2c4.4 2.2 8.4-2 12.4 0s8 2.2 12.4 0A12.4 12.4 0 0 1 11.6 27.2z',
      'h M15.6 21.6a10 10 0 0 1 6-5', 'L c 24 28.5 13']},
    trank_blau: {linie: 'trank', label: 'Manatrank', teile: [
      'F:holz M19 3h10v4.6H19z', 'F:glas M20.4 7.6h7.2v7.6h-7.2z', 'F:glas c 24 28.5 13',
      'f:saphir M11.6 27.2c4.4 2.2 8.4-2 12.4 0s8 2.2 12.4 0A12.4 12.4 0 0 1 11.6 27.2z',
      'h M15.6 21.6a10 10 0 0 1 6-5', 'L c 24 28.5 13']},
    trank_gruen: {linie: 'trank', label: 'Gift', teile: [
      'F:holzD M19 3h10v4.6H19z', 'F:glas M20.4 7.6h7.2v9.4c6 2.2 9.4 7.4 9.4 13.6a13 13 0 0 1-26 0c0-6.2 3.4-11.4 9.4-13.6z',
      'f:smaragd M12.2 29.4c4.4 2.2 7.4-1.6 11.8 0s7.4 2 11.8 0a12 12 0 0 1-23.6 0z',
      'F:knochen c 24 33.5 3.6', 'f:#1b1611 c 22.6 33 .9', 'f:#1b1611 c 25.4 33 .9', 'h M15 25a9.6 9.6 0 0 1 4.6-5']},
    brot: {linie: 'nahrung', label: 'Rationen', teile: [
      'F:#d39b55 M6 30c0-9 8-15 18-15s18 6 18 15c0 4-3 7-7 7H13c-4 0-7-3-7-7z',
      'S:#a8702f M16 19l-3 7M24 17.6l-2 8M32 19l-1 7', 'h M9 27c1.4-4.6 5-7.6 10-9-3.6 2.6-6 5.6-7 9.6z',
      'F:papierD M28 34.4l12 4.2-1.4 4.6-12-4.2z']},
    wasserschlauch: {linie: 'tropfen', label: 'Wasserschlauch', teile: [
      'F:leder M16 14c-6 4-8 12-6 20 2 6 8 9 14 9s12-3 14-9c2-8 0-16-6-20z',
      'F:lederD M20 7h8v8h-8z', 'F:holzD M19 4h10v4H19z', 'S:lederD M12 18C7 12 6 6 10 4M36 18c5-6 6-12 2-14',
      'h M14.4 22c-1.4 3.6-1.6 8 0 11.6 1 2.2 2.8 4 5 5-3.4-3-5-8.4-5-16.6z']},
    kraeuter: {linie: 'blatt', label: 'Kräuter', teile: [
      'S:gruenD M24 42V18M24 30l-8-10M24 26l8-11',
      'F:gruen M24 18c-4-3-5-8-2-13 4 3 5 8 2 13z', 'F:gruen M16 20c-5 0-8-3-9-8 5 0 8 3 9 8z',
      'F:gruen M32 15c1-5 4-8 9-8-1 5-4 8-9 8z', 'F:gruenD M16 30c-4 1-7 0-9-3 4-1 7 0 9 3z',
      'F:braunD M20 34h8v4h-8z']},

    // ── Schriften und Wissen ──
    schriftrolle: {linie: 'rolle', label: 'Schriftrolle', teile: [
      'F:papier M10 12h27v24H10z', 'F:papierD M8 8.5h31a3.5 3.5 0 0 1 0 7H8a3.5 3.5 0 0 1 0-7z',
      'F:papierD M8 32.5h31a3.5 3.5 0 0 1 0 7H8a3.5 3.5 0 0 1 0-7z', 'L M14 19.5h19M14 23.5h19M14 27.5h12',
      'F:rot c 33 36 3.2', 'F:rot M31 38.5l-1.6 5 2.6-1 1 2.4 1-6z']},
    buch: {linie: 'buch', label: 'Buch', teile: [
      'F:papier M35 8.5h4.5v32H35z', 'F:rot M9.5 5.5h26a2 2 0 0 1 2 2v33a2 2 0 0 1-2 2h-26z',
      'F:rotD M9.5 5.5h5v37h-5z', 'F:gold M20 16h11v2H20zM20 28h11v2H20z', 'S:gold M25.5 19.5v7',
      'F:gold M14.5 10.5h2v2h-2zM14.5 35.5h2v2h-2z', 'L M37.5 12h2M37.5 16h2M37.5 20h2']},
    zauberbuch: {linie: 'buch', label: 'Zauberbuch', teile: [
      'F:papier M35 8.5h4.5v32H35z', 'F:violett M9.5 5.5h26a2 2 0 0 1 2 2v33a2 2 0 0 1-2 2h-26z',
      'F:violettD M9.5 5.5h5v37h-5z', 'F:gold c 25.5 24 6.8', 'F:violettD c 25.5 24 5',
      'F:flammeH M25.5 18.6l1.4 3.8 4 .2-3.2 2.6 1.2 3.8-3.4-2.2-3.4 2.2 1.2-3.8-3.2-2.6 4-.2z', 'F:gold M33.4 5.5h2.6v6l-1.3-1.2-1.3 1.2z']},
    buch_offen: {linie: 'buch', label: 'Offenes Buch', teile: [
      'F:lederD M3 14c7-2 14-1 21 2 7-3 14-4 21-2v26c-7-2-14-1-21 2-7-3-14-4-21-2z',
      'F:papier M24 13c-5-3-12-4-18-3v26c6-1 13 0 18 3 5-3 12-4 18-3V10c-6-1-13 0-18 3z',
      'L M24 13v26', 'L M9 16c4-.4 8 .2 11 1.6M9 21c4-.4 8 .2 11 1.6M9 26c4-.4 8 .2 11 1.6M28 17.6c3-1.4 7-2 11-1.6M28 22.6c3-1.4 7-2 11-1.6',
      'F:rot M33 10.6h3v14l-1.5-1.4-1.5 1.4z']},
    karte: {linie: 'karte', label: 'Karte', teile: [
      'F:papier M5 10l12-4 14 4 12-4v32l-12 4-14-4-12 4z', 'F:papierD M17 6l14 4v32l-14-4z',
      'S:#8a6a48 M10 32c4-6 8-3 12-8s8-6 14-6', 'S:rot M33.5 15.5l4 4M37.5 15.5l-4 4', 'L M17 6v32M31 10v32']},
    feder: {linie: 'stift', label: 'Feder und Tinte', teile: [
      'F:#2a2f3a M8 32h16l-1.4 10H9.4z', 'F:#1b1611 M10 29.5h12V32H10z',
      'F:knochen M40 4C30 6 21 15 17.4 29.6l2.4 1C25 18 31 11 40 4z', 'S:#b9ab8c M38 6.4L19 30', 'S:#1b1611 M17.4 29.6l-1.4 3']},
    kompass: {linie: 'kompass', label: 'Kompass', teile: [
      'F:goldD c 24 25 16', 'F:papier c 24 25 12.6', 'L M24 13.6v2.4M24 34v2.4M12.6 25H15M33 25h2.4',
      'F:rot M24 25l-3-2.6L24 14l3 8.4z', 'F:stahl M24 25l3 2.6L24 36l-3-8.4z', 'F:gold c 24 25 1.6', 'F:gold M21.6 5.5h4.8V9h-4.8z']},
    fernrohr: {linie: 'lupe', label: 'Fernrohr', teile: [
      'F:goldD M6 34.4L32 12l3.4 4L9.4 38.4z', 'F:gold M28 10.4l6.6-5.4 5 6-6.6 5.4z', 'F:goldD M4 35.6l3.6-3 3.6 4.4-3.6 3z',
      'F:lederD M16.4 26l3.2-2.8 2.4 2.8-3.2 2.8z', 'F:glas M38.4 5.6l2.4-2 2.6 3.2-2.4 2z']},
    kristallkugel: {linie: 'kugel', label: 'Kristallkugel', teile: [
      'F:holzD M12 37h24l2 6H10z', 'F:gold M15 33.6h18l-1 3.6H16z',
      'F:#b7a6ee c 24 20 14', 'f:#8c74d8 M14 26c4 3 8-3 12-1s6 4 10 1a14 14 0 0 1-22 0z',
      'S:#efe8ff M18 18c2-4 8-5 10-1s-4 6-6 3', 'h M14.6 14.6a11 11 0 0 1 6.4-6', 'L c 24 20 14']},

    // ── Ausrüstung ──
    rucksack: {linie: 'rucksack', label: 'Rucksack', teile: [
      'F:leder M11.5 15c0-6 5.5-9.5 12.5-9.5s12.5 3.5 12.5 9.5v24.5a3 3 0 0 1-3 3h-19a3 3 0 0 1-3-3z',
      'F:lederD M11.5 15c0-6 5.5-9.5 12.5-9.5s12.5 3.5 12.5 9.5v6.5h-25z', 'F:lederD M17 28h14v10H17z',
      'F:gold M22.2 19.4h3.6v4.4h-3.6z', 'F:blau M13 6.4c0-2 22-2 22 0v3.4c0 2-22 2-22 0z', 'L M18 6.4v5M30 6.4v5']},
    seil: {linie: 'kette', label: 'Seil', teile: [
      'F:hanf c 24 25 15', 'F:hanfD c 24 25 10.6', 'F:hanf c 24 25 6.6', 'F:#5a4126 c 24 25 2.6',
      'S:hanfD M12 17q4 2 6-2M34 15q2 4 6 3M37 31q-3 1-3 5M15 35q-3-1-5 2', 'F:hanf M36 37l7 6-2 2-7-5z']},
    fackel: {linie: 'kerze', label: 'Fackel', teile: [
      'F:holz M21 22h6l-1.2 21h-3.6z', 'F:lederD M20.2 19.4h7.6v5h-7.6z',
      'F:flamme M24 2.5c4 5 8.4 8.2 8.4 13.4a8.4 8.4 0 0 1-16.8 0c0-4.2 3-6.4 4.2-9.4 1 2 2 3 3 3 0-2.2.2-4.4 1.2-7z',
      'f:flammeH M24 10.5c2 3 4 4.6 4 7.4a4 4 0 0 1-8 0c0-2.2 1.4-3.6 2.4-5.2.4 1 .8 1.4 1.4 1.4 0-1.2 0-2.4.2-3.6z']},
    laterne: {linie: 'laterne', label: 'Laterne', teile: [
      'S:stahlD M18 9a6 6 0 0 1 12 0', 'F:stahlD M15 9.4h18l2 4.6H13z', 'F:#ffe7a8 M15.6 14h16.8v20H15.6z',
      'F:flamme M24 18c2 2.6 3.4 4.2 3.4 6.4a3.4 3.4 0 0 1-6.8 0c0-2.2 1.4-3.8 3.4-6.4z',
      'F:stahlD M13 34h22l-2 6H15z', 'S:stahlD M19 14v20M29 14v20']},
    kerze: {linie: 'kerze', label: 'Kerze', teile: [
      'F:gold M10 39h28l-2.4 4.4H12.4z', 'F:#f3ead2 M18.5 17h11v22h-11z', 'F:#f3ead2 M26 17v6.4a1.6 1.6 0 0 0 3.2 0V17z',
      'L M24 17v-3', 'F:flamme M24 3c3 3.4 4.4 5.6 4.4 8a4.4 4.4 0 0 1-8.8 0c0-2.4 1.4-4.6 4.4-8z', 'f:flammeH M24 7.6c1.2 1.4 1.8 2.4 1.8 3.6a1.8 1.8 0 0 1-3.6 0c0-1.2.6-2.2 1.8-3.6z']},
    bettrolle: {linie: 'paket', label: 'Bettrolle', teile: [
      'F:blau M12 16h26a8 8 0 0 1 0 16H12z', 'F:blauD c 12 24 8', 'S:blau M12 18.6a5.4 5.4 0 0 1 0 10.8 2.8 2.8 0 0 1 0-5.6',
      'F:lederD M19 14.6h4v18.8h-4zM32 14.6h4v18.8h-4z', 'h M15 18.2h22v2H15z']},
    dietriche: {linie: 'schluessel', label: 'Diebeswerkzeug', teile: [
      'F:leder M5 14h38v20H5z', 'F:lederD M5 14h38v4H5z',
      'S:stahl M10 21h22l3-3M10 25.4h24M10 29.8h20l2.6 2.6', 'F:gold c 10 21 1.6', 'F:gold c 10 25.4 1.6', 'F:gold c 10 29.8 1.6']},
    werkzeugkiste: {linie: 'werkzeug', label: 'Werkzeugkiste', teile: [
      'F:rot M5.5 18h37v22h-37z', 'F:rotD M5.5 18h37v5h-37z', 'S:stahlD M17 18v-6h14v6',
      'F:stahlM M21 21.4h6v5h-6z', 'F:stahlD M13 9.4l3 3M35 9.4l-3 3']},
    laute: {linie: 'musik', label: 'Laute', teile: [
      'F:holzD M28.4 18.6L40 7l2.6 2.6L31 21.2z', 'F:holz M19 18c-7.6 0-13 5.6-13 12.4C6 37.4 11.4 42 18 42s13-5 13-12.4c0-6.8-4.4-11.6-12-11.6z',
      'F:#3d2c1d c 18.6 29.6 3.6', 'L M40.6 8.4L13 36', 'F:holzD M38 4l3 1.6 3 3L45.6 11 42 9z', 'h M9.4 28c.8-4.4 4-7.4 8.6-8-3 1.6-5.4 4.4-6.4 8.4z']},
    heiliges_symbol: {linie: 'sonne', label: 'Heiliges Symbol', teile: [
      'S:goldD M14 3c2 6 5 9 10 11M34 3c-2 6-5 9-10 11',
      'F:gold M24 13l2 5 5.4-1.6-1.6 5.4 5 2.2-5 2.2 1.6 5.4L26 30l-2 5-2-5-5.4 1.6 1.6-5.4-5-2.2 5-2.2-1.6-5.4L22 18z',
      'F:goldD c 24 24 4.4', 'F:flammeH c 24 24 2.2']},
    glocke: {linie: 'glocke', label: 'Glocke', teile: [
      'F:gold M14 31V21a10 10 0 0 1 20 0v10l3.4 4.4H10.6z', 'F:goldD M10.6 35.4h26.8v3H10.6z', 'F:goldD c 24 41 2.6',
      'S:goldD M24 6v5', 'h M16.6 30V21.4a7.4 7.4 0 0 1 4-6.6c-1.2 2-1.8 4.2-1.8 6.6V30z']},
    wuerfel: {linie: 'wuerfel', label: 'Würfel', teile: [
      'F:rot M24 4l17 9.8v20.4L24 44 7 34.2V13.8z', 'F:rotD M24 15l9.4 16.2H14.6z',
      'L M24 4v11M7 13.8l7.6 17.4M41 13.8l-7.6 17.4M7 34.2l7.6-3M41 34.2l-7.6-3M24 44l-9.4-12.8M24 44l9.4-12.8M24 15L7 13.8M24 15l17-1.2',
      'h M24 6.4v7.4L9.6 13z']},
    spielkarten: {linie: 'spielkarte', label: 'Spielkarten', teile: [
      'F:papier M8 14l14-5 9 26-14 5z', 'F:papier M18 8.6h15a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2v-26a2 2 0 0 1 2-2z',
      'F:rot M25.5 18c2.4 0 4 2 4 4s-4 7-4 7-4-5-4-7 1.6-4 4-4z', 'F:rot M19.4 11.4h2.4v3.4h-2.4z']},
    schaedel: {linie: 'schaedel', label: 'Schädel', teile: [
      'F:knochen M24 5a14 14 0 0 0-14 14c0 5 2.4 8.2 5.6 10.2V35a2.4 2.4 0 0 0 2.4 2.4h12A2.4 2.4 0 0 0 32.4 35v-5.8C35.6 27.2 38 24 38 19A14 14 0 0 0 24 5z',
      'f:#2a1f17 c 18.4 20.6 3.4', 'f:#2a1f17 c 29.6 20.6 3.4', 'f:#2a1f17 M24 25.4l-2 4h4z',
      'L M20 37.4V33M24 37.4V33M28 37.4V33', 'h M13 17a11 11 0 0 1 7.4-9c-3 2.6-4.6 6-4.6 10z']},
    knochen: {linie: 'knochen', label: 'Knochen', teile: [
      'F:knochen M13.6 9.6a4.4 4.4 0 1 0-6.8 4.8 4.4 4.4 0 1 0 4.8 6.8l15.6 15.6a4.4 4.4 0 1 0 4.8 6.8 4.4 4.4 0 1 0 6.8-4.8 4.4 4.4 0 1 0-4.8-6.8L18.4 16.4a4.4 4.4 0 1 0-4.8-6.8z',
      'h M10 9.6a2.4 2.4 0 0 1 3 .2']},
    fell: {linie: 'tier', label: 'Fell', teile: [
      'F:braun M24 6c3 0 5 2 6 4.4l6-3 1 6.6-4 4 6.4 6-4.4 3.4 2 8-6.4-1L28.6 42h-9.2L17.4 34.4l-6.4 1 2-8-4.4-3.4 6.4-6-4-4 1-6.6 6 3C19 8 21 6 24 6z',
      'F:braunD M24 10c1.8 0 3 1.4 3.4 3.4v20c-.4 2.2-1.6 3.6-3.4 3.6s-3-1.4-3.4-3.6v-20c.4-2 1.6-3.4 3.4-3.4z',
      'S:braunD M15 22l-3 2M33 22l3 2M16 30l-2.6 3M32 30l2.6 3']},
    spiegel: {linie: 'auge', label: 'Spiegel', teile: [
      'F:holzD M21.4 30h5.2l-.8 14h-3.6z', 'F:gold c 24 18 12.6', 'F:glas c 24 18 9.6', 'h M17 15a8 8 0 0 1 5-5.4L17.6 20z']},
    // ── Lager und Reise ──
    zelt: {linie: 'krugHaus', label: 'Zelt', teile: [
      'F:gruen M24 6L4 40h40z', 'F:gruenD M24 6l-7 34h14z', 'f:#1b1611 M24 22l-4.4 18h8.8z',
      'S:holzD M24 6V2.5', 'S:holzD M4 40l-2 3.4M44 40l2 3.4', 'h M24 6L8.4 38h3.6z']},
    kletterhaken: {linie: 'werkzeug', label: 'Kletterhaken', teile: [
      'E:stahlD c 35 10 6.4 M35 7a3 3 0 1 0 .01 0z',
      'F:stahl M31 13.4l4.4 4.4L13 42.6l-2.6.6.6-2.6z', 'h M32.4 15l1.4 1.4-19.6 22.4-.8-.8z',
      'F:stahl M8 8h10l-2 3H8zM8 13h8l-2 3H8z']},
    heilerausruestung: {linie: 'kreuz', label: 'Heilerausrüstung', teile: [
      'S:lederD M18 11V6.4h12V11', 'F:leder M7 15h34v26H7z', 'F:lederD M7 15c0-3 3-5 6-5h22c3 0 6 2 6 5v5H7z',
      'F:#f3ead2 c 24 30.5 7.4', 'F:rot M22.2 25.4h3.6v10.2h-3.6zM18.9 28.7h10.2v3.6H18.9z', 'F:gold M22 18h4v4h-4z']},
    kristall: {linie: 'edelstein', label: 'Arkaner Fokus (Kristall)', teile: [
      'F:stahlD M8 40h32l-2.4 4H10.4z',
      'F:#c9b6ff M12.5 21l5 4-1 15h-5l-1.6-12z', 'F:#c9b6ff M35.5 19l4.6 6-2 15h-5l-.6-16z',
      'F:#9fd8ff M24 4l7.4 10L28 40h-8l-3.4-26z', 'L M16.6 14h14.8M24 4v36',
      'h M22.6 7.6l-3.6 6.4 2.4 24h1.2z', 'F:flammeH M38 6l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z']},
    spinnennetz: {linie: 'hex', label: 'Spinnennetz', teile: [
      'S:#e8ecf0 M24 24L5 5M24 24L43 5M24 24L5 43M24 24l19 19M24 24V3M24 24v21M24 24H3M24 24h21',
      'S:#e8ecf0 M24 8.5l11 4.5 4.5 11-4.5 11-11 4.5-11-4.5L8.5 24 13 13z',
      'S:#e8ecf0 M24 15l6.4 2.6L33 24l-2.6 6.4L24 33l-6.4-2.6L15 24l2.6-6.4z',
      'L M29 32l-2.4-2M33 32l2.4-2M29 36l-2.4 2M33 36l2.4 2', 'F:#2a1f17 c 31 34 2.8', 'F:rot c 31 34 .9']},
    ewiges_licht: {linie: 'kerze', label: 'Ewiges Licht', teile: [
      'F:holz M21 22h6l-1.2 21h-3.6z', 'F:gold M20.2 19.4h7.6v5h-7.6z', 'F:gold M20.6 33h6.8v2.4h-6.8z',
      'F:#7fd0ff M24 2.5c4 5 8.4 8.2 8.4 13.4a8.4 8.4 0 0 1-16.8 0c0-4.2 3-6.4 4.2-9.4 1 2 2 3 3 3 0-2.2.2-4.4 1.2-7z',
      'f:#eefaff M24 10.5c2 3 4 4.6 4 7.4a4 4 0 0 1-8 0c0-2.2 1.4-3.6 2.4-5.2.4 1 .8 1.4 1.4 1.4 0-1.2 0-2.4.2-3.6z',
      'F:#eefaff M38 8l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z', 'F:#eefaff M9.5 14l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z']},
    sack: {linie: 'beutel', label: 'Sack', teile: [
      'F:hanf M16 10l-3.4-5h22.8L32 10z', 'F:hanf M15 12c-6 6-8.6 14-6.6 22 2 6 8 8.4 15.6 8.4s13.6-2.4 15.6-8.4c2-8-.6-16-6.6-22z',
      'F:hanfD M15.6 10h16.8v4H15.6z', 'S:hanfD M15 22c-2 5-2.6 10-1 14M28 30h6v6h-6z']},
    korb: {linie: 'truhe', label: 'Korb', teile: [
      'W:hanfD M12 20c0-13 24-13 24 0', 'F:hanf M7.5 20h33l-4.4 22H11.9z',
      'S:hanfD M9 26h30M10.2 32h27.6M11.4 38h25.2M16 20l1.2 22M24 20v22M32 20l-1.2 22']},
    fass: {linie: 'truhe', label: 'Fass', teile: [
      'F:holz M12 5h24c3 6 4.4 12.6 4.4 19S39 37 36 43H12c-3-6-4.4-12.6-4.4-19S9 11 12 5z',
      'L M18 5.4v37.2M24 5v38M30 5.4v37.2', 'F:stahlD M10.2 11h27.6v3H10.2zM8.2 22.6h31.6v3H8.2zM10.2 34h27.6v3H10.2z',
      'h M13.4 6.4h3.4c-2 5.6-2.8 11.2-2.8 17.6S14.8 36 16.8 41.6h-3.4c-2.4-5.6-3.4-11.2-3.4-17.6s1-12 3.4-17.6z']},
    kiste: {linie: 'paket', label: 'Kiste', teile: [
      'F:holz M7.5 11h33v31h-33z', 'L M7.5 21.4h33M7.5 31.6h33', 'S:holzD M10 13.4l28 26.2',
      'F:stahlD M7.5 11h5v5h-5zM35.5 11h5v5h-5zM7.5 37h5v5h-5zM35.5 37h5v5h-5z']},
    eimer: {linie: 'truhe', label: 'Eimer', teile: [
      'S:stahlD M9.5 15c0-11 29-11 29 0', 'F:holz M9.5 15h29l-4.4 27H13.9z',
      'F:stahlM M10.4 21h27.2v3H10.4zM12.6 34.6h22.8v3H12.6z', 'L M18 15l1.4 27M24 15v27M30 15l-1.4 27']},
    leiter: {linie: 'leiter', label: 'Leiter', teile: [
      'F:holz M11.5 3.5h4.4v41h-4.4zM32.1 3.5h4.4v41h-4.4z',
      'F:holzD M15.9 10h16.2v3.2H15.9zM15.9 19h16.2v3.2H15.9zM15.9 28h16.2v3.2H15.9zM15.9 37h16.2v3.2H15.9z']},
    stange: {linie: 'stab', label: 'Stange (3 m)', teile: [
      'F:holz M41 3.6l3.4 3.4L7 44.4 3.6 41z', 'h M41.8 5.2l.8.8L6.2 42.4l-.8-.8z',
      'F:stahlD M38.6 6l3.4 3.4-1.4 1.4-3.4-3.4zM24.8 19.8l3.4 3.4-1.4 1.4-3.4-3.4zM11 33.6l3.4 3.4-1.4 1.4-3.4-3.4z']},
    seil_seide: {linie: 'kette', label: 'Seil aus Seide', teile: [
      'F:#eee6f3 c 24 25 15', 'F:#cdbfda c 24 25 10.6', 'F:#eee6f3 c 24 25 6.6', 'F:#5a4a66 c 24 25 2.6',
      'S:#a998ba M12 17q4 2 6-2M34 15q2 4 6 3M37 31q-3 1-3 5M15 35q-3-1-5 2', 'F:#eee6f3 M36 37l7 6-2 2-7-5z']},
    enterhaken: {linie: 'werkzeug', label: 'Enterhaken', teile: [
      'S:hanfD M24 3c4-2.4 9-1 11 3.4', 'E:stahlD c 24 7 4.2 M24 4.8a2.2 2.2 0 1 0 .01 0z',
      'F:stahl M22 10.4h4v21h-4z', 'F:stahl M24 30c-6.4 0-10.4 4.4-12.4 10.4l3.2 1c2-4.4 5-7 9.2-7s7.2 2.6 9.2 7l3.2-1c-2-6-6-10.4-12.4-10.4z',
      'F:stahl M22 30h4v11l-2 2.6-2-2.6z', 'h M22.8 11.4h1.2v18.6h-1.2z']},
    oellampe: {linie: 'kerze', label: 'Öllampe', teile: [
      'S:goldD M9 27c-4.4 0-5.4 6.4 0 6.4', 'F:gold M8 29c0-6 8-8 16-8s14 2 18-.4l-6 8.4c-4 4-10 6-16 6s-12-2-12-6z',
      'F:goldD M17.6 21.4c0-3.4 3-5.4 6.4-5.4s6.4 2 6.4 5.4z', 'F:goldD c 24 15 1.6',
      'F:flamme M41 14c2 2.4 3.2 4.4 3.2 5.6a3.2 3.2 0 0 1-6.4 0c0-1.2 1.2-3.2 3.2-5.6z', 'h M11.6 28.4c2.4-2.4 6-3.4 10-3.6-3.4 1.2-6.4 2.4-8.4 4.4z']},
    zunder: {linie: 'flamme', label: 'Zunderkästchen', teile: [
      'F:stahlM M7 22h26v17H7z', 'F:stahlD M7 18h26v4H7z', 'L M7 30h26', 'F:#5d6670 M30 9l8.4 4.4-3.2 6-8.4-4.4z',
      'F:flammeH M40 20l1.2 3.4 3.4 1.2-3.4 1.2-1.2 3.4-1.2-3.4-3.4-1.2 3.4-1.2z', 'F:flamme c 36 30 1.3']},

    // ── Werkzeug und Gerät ──
    schaufel: {linie: 'werkzeug', label: 'Schaufel', teile: [
      'F:holz M36.4 6.4l3.2 3.2-16.8 16.8-3.2-3.2z', 'F:holzD M35 2.6l7.8 7.8-2.6 2.6-7.8-7.8z',
      'F:stahl M19.6 22.6l5.8 5.8-9.2 12c-3 3-8.4 0-8.4-4.4z', 'h M18.6 25.4l2 2-8 10.6c-.6-.6-1-1.6-1-2.4z']},
    spitzhacke: {linie: 'werkzeug', label: 'Spitzhacke', teile: [
      'F:holz M24.6 13l3.2 1.8L14 43.4l-3.2-1.8z', 'F:stahlM M5 15.6c8.6-7 28-9 38 0l-2.2 3.2c-9.4-5.8-24-4.8-33.6 0z',
      'F:stahlD M23 9.6h6.4l1 5.6h-8.4z']},
    hammer: {linie: 'hammer', label: 'Hammer', teile: [
      'F:holz M22.6 17.6l4.2 2-13.6 22.6-4.2-2z', 'F:stahlD M15.6 9.4L36 17.6l-2.8 6.6-20.4-8.2z',
      'F:stahl M33.2 16.6l4 1.6-2.4 6-4-1.6z', 'h M17 11.4l15.6 6.2-.6 1.4-15.6-6.2z']},
    flaschenzug: {linie: 'werkzeug', label: 'Flaschenzug', teile: [
      'S:stahlD M24 9.4V3', 'E:stahlM c 24 18 9 M24 15a3 3 0 1 0 .01 0z', 'F:stahlD c 24 18 1.6',
      'S:hanfD M15 18v24M33 18v17', 'F:stahlD M29 35h8v7h-8z']},
    rammbock: {linie: 'hammer', label: 'Rammbock', teile: [
      'F:holz M4.5 19h31v11h-31z', 'L M4.5 23h31M4.5 26.6h31', 'F:stahlD M35.5 16.4h8v16.2h-8z',
      'S:stahlD M12 30v6.4M27 30v6.4M12 19v-6.4M27 19v-6.4', 'F:stahlM M4.5 18h3v13h-3z']},
    kreide: {linie: 'stift', label: 'Kreide', teile: [
      'F:#f4f1ea M10 32l20-20 6.4 6.4-20 20z', 'F:#d9d3c4 M10 32l6.4 6.4-3.2 3.2-6.4-6.4z',
      'f:#f4f1ea c 32 38 1.2', 'f:#f4f1ea c 37 34 .9', 'f:#f4f1ea c 36 41 .8', 'h M12 31l18.6-18.6 1.2 1.2L13.2 32.2z']},
    kraehenfuesse: {linie: 'explosion', label: 'Krähenfüße', teile: [
      'F:stahlM M18 9l3 11 11 3-11 3-3 11-3-11-11-3 11-3z', 'F:stahlD c 18 23 2.4',
      'F:stahlM M36 24l2 7.2 7.2 2-7.2 2-2 7.2-2-7.2-7.2-2 7.2-2z', 'F:stahlD c 36 33.2 1.6']},
    fangeisen: {linie: 'werkzeug', label: 'Fangeisen', teile: [
      'F:stahlD M5 31a19 6.4 0 0 0 38 0z',
      'F:stahlM M8 31c0-10 7-16.4 16-16.4S40 21 40 31h-4.4c0-7-5-12-11.6-12S12.4 24 12.4 31z',
      'L M12.4 31l2-4.4 2 4.4 2-4.4 2 4.4 2-4.4 2 4.4 2-4.4 2 4.4 2-4.4 2 4.4 2-4.4 1.2 3.4', 'S:stahlD M24 37.4V44']},
    kuegelchen: {linie: 'muenze', label: 'Kügelchen', teile: [
      'F:stahl c 16 31 4.2', 'F:stahl c 25 35 4.2', 'F:stahl c 33.4 29.6 4.2', 'F:stahl c 20.4 23 4.2', 'F:stahl c 29 21.6 4.2',
      'h M14 29.6a2 2 0 0 1 2-1.4', 'h M23 33.6a2 2 0 0 1 2-1.4', 'h M18.4 21.6a2 2 0 0 1 2-1.4']},
    schloss: {linie: 'schloss', label: 'Schloss', teile: [
      'E:stahlM M14.6 22v-6.4a9.4 9.4 0 0 1 18.8 0V22h-4.4v-6.4a5 5 0 0 0-10 0V22z',
      'F:gold M11.5 21.4h25v21h-25z', 'F:#1b1611 c 24 30 2.4', 'F:#1b1611 M22.8 31h2.4l1.2 6h-4.8z', 'h M13.4 23.2h3.4v17.4h-3.4z']},
    handschellen: {linie: 'kette', label: 'Handschellen', teile: [
      'E:stahlM c 13 28 8.4 M13 23a5 5 0 1 0 .01 0z', 'E:stahlM c 35 28 8.4 M35 23a5 5 0 1 0 .01 0z',
      'W:stahlD M21.4 25.4h5.2', 'F:stahlD M10 18h6v3h-6zM32 18h6v3h-6z']},
    kette: {linie: 'kette', label: 'Kette', teile: [
      'E:stahlM M5 12.4h11a4.4 4.4 0 0 1 0 8.8H5a4.4 4.4 0 0 1 0-8.8zM6.4 15v3.6h8.2V15z',
      'E:stahlD M17.4 17.6h4.4a4.4 4.4 0 0 1 4.4 4.4v6a4.4 4.4 0 0 1-4.4 4.4h-4.4A4.4 4.4 0 0 1 13 28v-6a4.4 4.4 0 0 1 4.4-4.4zM15.6 21.4v7.2h8V21.4z',
      'E:stahlM M23 28.4h11a4.4 4.4 0 0 1 0 8.8H23a4.4 4.4 0 0 1 0-8.8zM24.4 31v3.6h8.2V31z',
      'E:stahlD M35.4 33.6h4.4a4.4 4.4 0 0 1 4.4 4.4v1a4.4 4.4 0 0 1-4.4 4.4h-4.4A4.4 4.4 0 0 1 31 39v-1a4.4 4.4 0 0 1 4.4-4.4zM33.6 37.4v2.2h8v-2.2z']},
    wetzstein: {linie: 'stein', label: 'Wetzstein', teile: [
      'F:#8b9198 M6 28l26-14 10 6-26 14z', 'F:#6a7178 M6 28v5l10 6v-5zM16 34v5l26-14v-5z',
      'F:#9fd8ff M36 6c2 3 3.4 5 3.4 6.4a3.4 3.4 0 0 1-6.8 0c0-1.4 1.4-3.4 3.4-6.4z', 'h M9.6 27.4l22-11.8 2.6 1.6-22 11.8z']},
    seife: {linie: 'tropfen', label: 'Seife', teile: [
      'F:#bde0d0 M8 24l18-8 14 6-18 8z', 'F:#8fc1aa M8 24v6.4l14 6v-6.4zM22 30v6.4l18-8V22z',
      'F:glas c 34 11 3.4', 'F:glas c 40.6 17 2.2', 'F:glas c 28 7 1.8', 'h M12 23.6l13.6-6 2.4 1-13.6 6z']},
    siegelwachs: {linie: 'stift', label: 'Siegelwachs', teile: [
      'F:rot M7.5 36.5l22-22 5 5-22 22z', 'F:rotD M7.5 36.5l5 5-2.6 2.6-5-5z',
      'F:rot c 34 34 7.4', 'F:rotD c 34 34 4.4', 'L M32 34h4M34 32v4']},
    pfeife: {linie: 'horn', label: 'Signalpfeife', teile: [
      'F:gold M5.5 21h23v8.4h-23z', 'F:gold c 31.5 28 7.4', 'F:#1b1611 M13 21h5v3.4h-5z',
      'F:goldD c 31.5 28 3', 'S:goldD M5.5 25.2a3.4 3.4 0 0 1-3.4-3.4', 'h M8 22.6h18v1.4H8z']},
    waage: {linie: 'diagramm', label: 'Waage', teile: [
      'F:goldD M14 40h20v4H14z', 'F:goldD M22 12h4v28h-4z', 'F:gold M7 11h34v3.4H7z',
      'L M10 14.4L6 26M10 14.4L14 26M38 14.4l-4 7.6M38 14.4l4 7.6',
      'F:gold M3.5 26h13l-2.4 4.4H5.9z', 'F:gold M31.5 22h13l-2.4 4.4h-8.2z', 'F:gold c 24 9.4 2.4']},
    lupe: {linie: 'lupe', label: 'Vergrößerungsglas', teile: [
      'F:holzD M28 28l4.4-4.4L44 35.2l-4.4 4.4z', 'E:gold c 20 20 12 M20 10a10 10 0 1 0 .01 0z',
      'F:glas c 20 20 10', 'h M13.6 16.4a7.4 7.4 0 0 1 5.4-4.4']},
    sanduhr: {linie: 'sanduhr', label: 'Sanduhr', teile: [
      'F:holzD M12 8h3v32h-3zM33 8h3v32h-3z', 'F:glas M16 8h16c0 8-6 12-6 16s6 8 6 16H16c0-8 6-12 6-16s-6-8-6-16z',
      'f:hanf M18 34.6c2-3 4-4 6-4s4 1 6 4l1 5.4H17zM19 12h10c-1 3-3 5-5 6-2-1-4-3-5-6z',
      'F:holz M9.5 4h29v4h-29zM9.5 40h29v4h-29z']},
    angel: {linie: 'werkzeug', label: 'Angel', teile: [
      'F:holz M7 42.4L35.4 5.4l2 1.4L9 43.8z', 'S:#e8ecf0 M36.4 6c4.4 8 4.4 20 0 30',
      'S:stahl M36.4 36c0 3.4-3.4 3.4-3.4 1', 'F:stahlD c 15 32.4 3.6', 'F:stahl c 15 32.4 1.2', 'F:rot c 36.4 30 1.6']},

    // ── Magie und Glaube ──
    komponentenbeutel: {linie: 'beutel', label: 'Komponentenbeutel', teile: [
      'F:violett M18 12.5h12l-2 4c7 3 11.4 9 11.4 15 0 6.4-6.4 10.5-15.4 10.5S8.6 37.9 8.6 31.5c0-6 4.4-12 11.4-15z',
      'F:violettD M16.6 15.4h14.8v3.2H16.6z', 'F:gold M24 23.4l1.6 4 4.2.4-3.2 2.8 1 4.2-3.6-2.2-3.6 2.2 1-4.2-3.2-2.8 4.2-.4z',
      'S:#a98bd8 M13 30c1-4 3.4-7.4 6.6-9.4']},
    mistel: {linie: 'blatt', label: 'Mistelzweig', teile: [
      'S:gruenD M24 24v18', 'F:gruen M24 24c-8-2-14-8-14-16 8 2 14 8 14 16z', 'F:gruen M24 24c8-2 14-8 14-16-8 2-14 8-14 16z',
      'L M24 24l-9-12M24 24l9-12', 'F:#f4f1ea c 21.6 28 2.4', 'F:#f4f1ea c 26.4 28.6 2.4', 'F:#f4f1ea c 24 32.4 2.4',
      'F:gold M20 40h8v3h-8z']},
    totem: {linie: 'maske', label: 'Totem', teile: [
      'F:holz M17 8h14v35H17z', 'F:holzD M15 5.5h18v4H15z',
      'F:#1b1611 M19.8 14h3.2v3.2h-3.2zM25 14h3.2v3.2H25z', 'L M20 22.4h8M20 32h8M24 26v4',
      'F:rot M17 25.4l-7.4 4 7.4 1.4z', 'F:blau M31 25.4l7.4 4-7.4 1.4z', 'F:gold M17 36h14v2.4H17z']},
    reliquie: {linie: 'amulett', label: 'Reliquie', teile: [
      'F:goldD M9.5 16.4L24 6l14.5 10.4z', 'F:gold M11.5 16h25v26h-25z', 'F:glas M17.5 22h13v13h-13z',
      'F:knochen M19.6 31.4l8.4-6.4 2 2-8.4 6.4z', 'F:rubin c 24 39 1.6', 'F:saphir c 24 12 1.6', 'h M13.4 17.6h3v22.8h-3z']},
    weihwasser: {linie: 'tropfen', label: 'Weihwasser', teile: [
      'F:holz M19.6 3.4h8.8v4h-8.8z', 'F:glas M20.4 7.4h7.2v6.4c6 2 9.4 7.4 9.4 13.6a13 13 0 0 1-26 0c0-6.2 3.4-11.6 9.4-13.6z',
      'f:saphir M12.4 27.4c4.4 2.2 7.4-1.6 11.6 0s7.4 2 11.6 0a11.6 11.6 0 0 1-23.2 0z',
      'F:gold M22.6 21h2.8v14h-2.8zM18.6 25h10.8v2.8H18.6z', 'h M15 23a9.6 9.6 0 0 1 4.6-5']},

    // ── Tränke, Krüge, Kochen ──
    feuerflasche: {linie: 'flamme', label: 'Alchemistenfeuer', teile: [
      'F:glas M20.4 12h7.2v6c5.4 2 9 7 9 12.6a12.6 12.6 0 0 1-25.2 0c0-5.6 3.6-10.6 9-12.6z',
      'f:flamme M12.6 29.4c4.4 2.2 7.4-1.6 11.4 0s7.4 2 11.4 0a11.4 11.4 0 0 1-22.8 0z',
      'F:#f3ead2 M19.4 9h9.2v4h-9.2z', 'F:flamme M24 0.6c2.4 3 4.2 4.6 4.2 6.6a4.2 4.2 0 0 1-8.4 0c0-2 1.8-3.6 4.2-6.6z',
      'f:flammeH M24 4c1 1.2 1.6 2 1.6 3a1.6 1.6 0 0 1-3.2 0c0-1 .6-1.8 1.6-3z', 'h M15.4 26a9 9 0 0 1 4.6-5']},
    phiole: {linie: 'trank', label: 'Phiole', teile: [
      'F:holz M19 3h10v4H19z', 'F:glas M20 7h8v28.4a4 4 0 0 1-8 0z',
      'f:violett M20.8 20h6.4v15.4a3.2 3.2 0 0 1-6.4 0z', 'h M21.4 9h1.2v24h-1.2z',
      'F:holz M32 13h8v3.4h-8z', 'F:glas M32.6 16.4h6.8v18a3.4 3.4 0 0 1-6.8 0z', 'f:smaragd M33.2 26h5.6v8.4a2.8 2.8 0 0 1-5.6 0z']},
    oelflasche: {linie: 'tropfen', label: 'Öl (Flasche)', teile: [
      'F:holz M20 4.4h8v3.6h-8z', 'F:braunD M20.4 8h7.2v6.4h-7.2z',
      'F:braun M18 14.4h12v3.6c6 2 8 8 8 14 0 7-6 10-14 10S10 39 10 32c0-6 2-12 8-14z',
      'F:papier M16.4 26h15.2v8.4H16.4z', 'L M19 29h10M19 31.6h7', 'h M13 30c.6-4.4 2.6-8 6-10-1.6 2.6-2.4 6-2.6 10z']},
    humpen: {linie: 'krug', label: 'Humpen', teile: [
      'S:#7d6650 M32 18h4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4', 'S:#7d6650 M32 21.4h3a1.6 1.6 0 0 1 1.6 1.6v4a1.6 1.6 0 0 1-1.6 1.6h-3',
      'F:#a88a6a M10 12.4h22V38a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z', 'F:#f4efe2 M9 13c0-4.4 4.4-6.4 7.4-4.4 2-3 6-3 8 0 3-1 6.6 0 6.6 4.4z',
      'S:#7d6650 M10 20h22M10 34h22', 'h M12.6 15h3v23.4h-3z']},
    krug: {linie: 'vase', label: 'Krug', teile: [
      'S:#7e4625 M33 18c6.4 0 8.4 10.4 2 14.4', 'F:#b46a3c M16 10h14l-2 6c6 2 10 8 10 14 0 8-6 12-14 12S10 38 10 30c0-6 4-12 10-14z',
      'F:#b46a3c M16 10l-4.4-3.4h4.4z', 'S:#7e4625 M13 28h22', 'h M13.4 30c.4-4.4 2.6-8 6-10-1.6 2.6-2.4 6-2.6 10z']},
    topf: {linie: 'krug', label: 'Topf', teile: [
      'S:#5a6068 M10 17c0-8.4 28-8.4 28 0', 'F:#3b3f45 M8 20h32v10c0 8-7 12-16 12S8 38 8 30z',
      'F:#5a6068 M6 16.6h36v4H6z', 'F:#3b3f45 M12 40l-2.4 4h4.4zM36 40l2.4 4h-4.4z', 'h M11 22h3v8c0 3 1 5.4 2.6 7-3.4-1.4-5.6-4-5.6-7z']},
    geschirr: {linie: 'krug', label: 'Reisegeschirr', teile: [
      'S:stahlD M36 23h8', 'F:stahlM M8 23h28v12a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z', 'F:stahl M6 20h32v3.4H6z',
      'S:stahl M35 14l-6.4 9', 'F:stahl c 37.6 10.4 3.6', 'h M10.4 25h2.4v11.4h-1c-.8-1-1.4-2.2-1.4-3.4z']},

    pergament: {linie: 'dokument', label: 'Pergament', teile: [
      'F:papier M10 5.5h22l6 6V42.5H10z', 'F:papierD M32 5.5v6h6z', 'L M14 16h16M14 21h20M14 26h20M14 31h14',
      'S:#8a6a48 M15 37c3-2 6 1 9-1', 'h M11.6 7h3v34h-3z']},

    // ── Musik ──
    floete: {linie: 'musik', label: 'Flöte', teile: [
      'F:holz M5.5 38.5L37.5 6.5l4 4-32 32z', 'F:holzD M35.5 4.5l6 6 2.4-2.4-6-6z',
      'f:#3d2c1d c 15 33 1.4', 'f:#3d2c1d c 19.6 28.4 1.4', 'f:#3d2c1d c 24.2 23.8 1.4', 'f:#3d2c1d c 28.8 19.2 1.4',
      'h M7.4 38.6L38.6 7.4l.8.8L8.2 39.4z']},
    horn: {linie: 'horn', label: 'Horn', teile: [
      'F:knochen M5 33c3.6-14.4 17.6-24.6 34-24.6l2.4 8.6c-12.4 0-22 7.6-26 19.4z',
      'F:#3d2c1d M38.6 8.6c1.6-.4 3.2-.4 4.4 0 1.4 2.6 1.8 5.6.8 8.4-1 .4-2.2.4-3.4.4z',
      'F:gold M14.4 23l2.6 1.8-3.2 5-2.6-1.6zM25.4 14.8l2 2.4-4.4 3.2-1.8-2.4z', 'F:goldD M4.6 32.6l10.6 3.4-1.2 3.4L4 36z',
      'S:lederD M8 33c6 4 16 2 22-6', 'h M9.4 29.6c3.6-9 12-15.6 22-17.6-8.4 3.4-15 9.4-18.6 18.6z']},
    trommel: {linie: 'musik', label: 'Trommel', teile: [
      'F:rot M8 18h32v18c0 4-7 6.4-16 6.4S8 40 8 36z', 'S:gold M10 22l6 14.6 6-14.6 6 14.6 6-14.6 4 10',
      'F:#efe2c2 M8 18c0-3 7-5.4 16-5.4s16 2.4 16 5.4-7 5.4-16 5.4S8 21 8 18z',
      'W:holzD M30 3.6l-5.6 10M41 5.6l-10 8']},
    leier: {linie: 'musik', label: 'Leier', teile: [
      'F:gold M10 7c0 18.4 4 28.4 14 30.4 10-2 14-12 14-30.4h-4.4c0 14-3 23.4-9.6 25.4C17.4 30.4 14.4 21 14.4 7z',
      'F:goldD M11.6 11h24.8v3.4H11.6z', 'S:#efe8d0 M18 14.4v19M22 14.4v22M26 14.4v22M30 14.4v19',
      'F:goldD M19 37h10l1.4 5.4H17.6z']},

    // ── Weitere Waffen ──
    kurzschwert: {linie: 'klinge', label: 'Kurzschwert', teile: [
      'F:stahl M39 8.5l-1.4 5.2-15.6 15.6-3.8-3.8 15.6-15.6z', 'S:stahlM M37 10.6L20.6 27',
      'F:gold M12.6 23.4l2.8-2.8 11 11-2.8 2.8z', 'F:leder M17.2 29.6l2.2 2.2-5.8 5.8-2.2-2.2z', 'F:gold c 10.4 39.2 2.6',
      'h M38 9.6l-.6 2-14.2 14.2-1-1z']},
    morgenstern: {linie: 'explosion', label: 'Morgenstern', teile: [
      'F:holz M22.4 23.4l3.2 3.2-14.4 14.4-3.2-3.2z', 'F:lederD M12 33.6l3.2 3.2-2.6 2.6-3.2-3.2z',
      'F:stahl M31 4l2.2 5.4h-4.4zM43.4 16l-5.4 2.2v-4.4zM31 28.4l-2.2-5.4h4.4zM18.6 16l5.4-2.2v4.4zM40 7l-2.2 5.4-3.2-3.2zM40 25l-5.4-2.2 3.2-3.2zM22 7l5.4 2.2-3.2 3.2z',
      'F:stahlD c 31 16 8', 'h M27 12.6a5 5 0 0 1 4.4-2.4']},
    hellebarde: {linie: 'dreizack', label: 'Hellebarde', teile: [
      'F:holz M30.4 11l2.6 2.6L8.6 44.4 6 41.8z',
      'F:stahl M27.4 7c6.4-.4 11 3.6 13 10l-8.6 6.4-6.4-8.4z', 'F:stahl M38 2.4l3.4 6.4-5-.6z', 'F:stahlD M24.4 13.4l-3.4-2.4 2.4-3z',
      'h M29.4 9.4c3.4 0 6 2 7.6 5l-4.4 3z']},
    sichel: {linie: 'klinge', label: 'Sichel', teile: [
      'F:holz M18.6 27.4l4.4 2-6.4 14-4.4-2z', 'F:stahl M13 30C8.4 18 18 5.6 33 7.4c-10.6 2.4-16.6 10.4-14.4 20.6z',
      'h M16 26c-1.6-7 3-14 10.6-17-5 3.6-8 8.6-8 15.6z']},
    keule: {linie: 'hammer', label: 'Keule', teile: [
      'F:holz M11.6 40.4c-2.2-2.2-2.2-4.4 0-6.6l16-22c4-4.4 10-2.4 12 2 2 4.4 0 8.4-4 10.4L18 40.4c-2.2 2.2-4.4 2.2-6.4 0z',
      'F:holzD c 30 16 1.6', 'F:holzD c 34.4 20 1.2', 'F:lederD M10 34.4l4 4-2.4 2.4-4-4z',
      'h M27 14c2-2.4 5-3 7.4-1.6-2.4.4-4.4 1.6-6 3.4z']},
    peitsche: {linie: 'kette', label: 'Peitsche', teile: [
      'W:leder M18 30c8-8.4 14-6.4 18 0s8 6.4 10-2.4', 'S:lederD M46 27.6l-1-4',
      'F:lederD M7.5 40.5l8.4-8.4 3.4 3.4-8.4 8.4z', 'F:gold M15 31.4l3.4 3.4-1.4 1.4-3.4-3.4z']},
    schleuder: {linie: 'kette', label: 'Schleuder', teile: [
      'S:leder M8 8c6 10.4 10 22 14 26M40 8c-6 10.4-10 22-14 26', 'F:lederD M17.6 31.4c2.4 4.4 10.4 4.4 12.8 0l-2 6.4h-8.8z',
      'F:#8b9198 c 24 33.6 3.2', 'F:lederD c 8 8 2.2', 'F:lederD c 40 8 2.2']},
    blasrohr: {linie: 'stab', label: 'Blasrohr', teile: [
      'F:holz M5.5 39.5L37.5 7.5l3 3-32 32z', 'F:holzD M35.4 5.4l7.2 7.2-1.8 1.8-7.2-7.2z',
      'S:stahl M24 40l10-10', 'F:rot M22 42l1.6-4.4 2.4 2.4z', 'S:stahl M30 44l10-10', 'F:rot M28 46l1.6-4.4 2.4 2.4z']},
    netz: {linie: 'hex', label: 'Netz', teile: [
      'S:hanf M8 12h32M6 20h36M6 28h36M8 36h32M12 8l-2 32M20 6v36M28 6v36M36 8l2 32',
      'F:stahlD c 8 8 2.4', 'F:stahlD c 40 8 2.4', 'F:stahlD c 8 40 2.4', 'F:stahlD c 40 40 2.4']},
  };

  // Zeichen alter Gegenstände → Bild.
  var BZ = {};
  var zu = function (name, zeichen) { zeichen.split(' ').forEach(function (z) { if (z) BZ[z] = name; }); };
  zu('langschwert', '⚔'); zu('dolch', '🗡 🔪'); zu('streitaxt', '🪓'); zu('kriegshammer', '🔨 ⚒');
  zu('bogen', '🏹'); zu('speer', '🔱'); zu('kampfstab', '🦯'); zu('zauberstab', '🪄');
  zu('wappenschild', '🛡 🔰'); zu('helm', '🪖'); zu('umhang', '🧥 🦺'); zu('robe', '👘'); zu('tunika', '👕 🧣');
  zu('handschuhe', '🧤 🥋'); zu('stiefel', '🥾 👟'); zu('guertel', '🎗 🎀'); zu('armschienen', '💪'); zu('spitzhut', '🎩 🧙');
  zu('maske', '🎭'); zu('ring', '💍 ⭕'); zu('amulett', '📿 🧿 🪬'); zu('krone', '👑'); zu('edelstein', '💎 🪩');
  zu('muenzen', '🪙'); zu('beutel', '💰 👜 💴 💵'); zu('truhe', '🧰 🧺 🎁 🗃'); zu('trank_rot', '🧪 🍷');
  zu('brot', '🍞 🍎 🍇 🌰 🧀'); zu('wasserschlauch', '💧 🫙'); zu('kraeuter', '🌿 🍀 🌱 🌾 🍄');
  zu('schriftrolle', '📜'); zu('buch', '📕 📚 📔 📒'); zu('buch_offen', '📖'); zu('karte', '🗺 🗾'); zu('feder', '📝 ✒ 🖋');
  zu('kompass', '🧭'); zu('fernrohr', '🔭'); zu('kristallkugel', '🔮'); zu('rucksack', '🎒'); zu('seil', '🪢');
  zu('fackel', '🔥'); zu('laterne', '🪔 🔦 💡'); zu('kerze', '🕯'); zu('dietriche', '🔑 🗝'); zu('werkzeugkiste', '🔧 🛠 ⛏ 🪛');
  zu('laute', '🎸 🎻 🎵 🎶'); zu('heiliges_symbol', '☀ ✝ ☥'); zu('glocke', '🔔'); zu('wuerfel', '🎲'); zu('spielkarten', '🃏 🎴');
  zu('schaedel', '💀 ☠'); zu('knochen', '🦴 🦷'); zu('fell', '🐺 🦊 🐻'); zu('spiegel', '🪞');
  zu('zelt', '⛺ 🏕'); zu('spinnennetz', '🕸 🕷'); zu('enterhaken', '🪝'); zu('korb', '🧺'); zu('leiter', '🪜');
  zu('eimer', '🪣'); zu('sanduhr', '⏳ ⌛'); zu('humpen', '🍺 🍻'); zu('schloss', '🔒 🔐'); zu('seife', '🧼');
  zu('lupe', '🔍 🔎 🔬'); zu('waage', '⚖'); zu('kette', '⛓ 🔗'); zu('fangeisen', '🪤'); zu('trommel', '🥁');
  zu('horn', '📯 🎺'); zu('floete', '🪈'); zu('fass', '🛢'); zu('sack', '🛍'); zu('kiste', '📦 🗃');
  zu('kreide', '🖍'); zu('phiole', '⚗'); zu('topf', '🍲'); zu('heilerausruestung', '🩹 💉 🩺');
  zu('kristall', '💠'); zu('hammer', '🔨'); zu('spitzhacke', '⛏'); zu('schaufel', '🪏');

  // Nach dem Namen raten — der erste Treffer zählt, das Genauere steht oben.
  var RATEN = [
    // Erst, was aus mehreren Wörtern besteht oder ein anderes enthält.
    [/ewige[sm]? licht|immerwährende flamme|dauerhafte flamme/, 'ewiges_licht'], [/krähenfüße/, 'kraehenfuesse'], [/spinnennetz|spinnweb/, 'spinnennetz'],
    [/heilerausrüstung|heilerkit|verbandszeug|verband/, 'heilerausruestung'], [/alchemistenfeuer/, 'feuerflasche'],
    [/komponentenbeutel|materialkomponenten/, 'komponentenbeutel'], [/kletterhaken|kletterausrüstung|eisenkeil|keile/, 'kletterhaken'],
    [/enterhaken|wurfanker/, 'enterhaken'], [/kristallkugel|kugel\b|\(kugel\)/, 'kristallkugel'],
    [/arkaner fokus|kristall/, 'kristall'], [/mistel/, 'mistel'], [/totem/, 'totem'], [/reliquie/, 'reliquie'],
    [/weihwasser/, 'weihwasser'], [/heiliges symbol|emblem/, 'heiliges_symbol'],
    [/panzerhandschuh|stulpe/, 'panzerhandschuh'], [/handschuh/, 'handschuhe'], [/handschellen|fesseln/, 'handschellen'],
    [/zauberstab|stab der|zepter|\brute\b/, 'zauberstab'], [/kampfstab|holzstab|stab\b/, 'kampfstab'], [/stange/, 'stange'],
    [/armbrust/, 'armbrust'], [/köcher|pfeil|bolzen/, 'koecher'], [/blasrohr/, 'blasrohr'], [/bogen/, 'bogen'],
    [/säbel|krummschwert|rapier|degen/, 'saebel'], [/kurzschwert/, 'kurzschwert'], [/dolch|messer|stilett/, 'dolch'],
    [/schwert|klinge/, 'langschwert'],
    [/vorschlaghammer|hammer, leicht|leichter hammer|werkzeughammer|^hammer/, 'hammer'], [/hammer/, 'kriegshammer'],
    [/spitzhacke|picke/, 'spitzhacke'], [/axt|beil/, 'streitaxt'], [/kolben/, 'streitkolben'],
    [/morgenstern|flegel/, 'morgenstern'], [/keule|knüppel/, 'keule'], [/sichel/, 'sichel'], [/peitsche/, 'peitsche'],
    [/schleuderkugel|kügelchen|murmel/, 'kuegelchen'], [/schleuder/, 'schleuder'],
    [/hellebarde|gleve|glefe|pike/, 'hellebarde'], [/speer|lanze|dreizack/, 'speer'], [/netz\b/, 'netz'],
    [/rundschild/, 'rundschild'], [/schild/, 'wappenschild'],
    [/kettenhemd|kettenpanzer|ringpanzer|kette(n)?rüstung/, 'kettenhemd'], [/schuppen/, 'schuppenpanzer'],
    [/platte|bänder|schienenpanzer/, 'plattenpanzer'], [/brustpanzer|halbplatte|kürass|harnisch/, 'brustpanzer'],
    [/leder.*(rüstung|panzer)|wams|gambeson/, 'lederruestung'],
    [/helm|haube/, 'helm'], [/kapuze/, 'kapuze'], [/hut\b|spitzhut|mütze/, 'spitzhut'],
    [/umhang|mantel|cape|cloak/, 'umhang'], [/robe|gewand|kutte/, 'robe'], [/hemd|tunika|kleid|weste|kostüm/, 'tunika'], [/hose/, 'hose'],
    [/armschiene/, 'armschienen'], [/stiefel|schuh/, 'stiefel'], [/gürtel/, 'guertel'],
    [/siegelring|\bring\b|ring des|ring der/, 'ring'], [/amulett|halskette|anhänger|talisman|medaillon/, 'amulett'],
    [/krone|diadem|reif/, 'krone'], [/maske|verkleidung/, 'maske'], [/rubin/, 'rubin'], [/edelstein|saphir|smaragd|diamant|juwel|perle/, 'edelstein'],
    [/heiltrank|trank der heilung|heilung/, 'trank_rot'], [/gift/, 'trank_gruen'], [/phiole|säure|parfüm|gegengift/, 'phiole'],
    [/trank|elixier/, 'trank_blau'], [/öllampe|\blampe/, 'oellampe'], [/öl\b|öl \(|ölflasche/, 'oelflasche'],
    [/ration|brot|proviant|essen|käse|fleisch/, 'brot'], [/wasserschlauch|trinkschlauch|feldflasche/, 'wasserschlauch'],
    [/humpen|becher/, 'humpen'], [/tonkrug|kanne|krug/, 'krug'], [/topf|kessel/, 'topf'], [/reisegeschirr|kochgeschirr|geschirr/, 'geschirr'],
    [/flasche/, 'oelflasche'], [/kraut|kräuter|pflanze|blume/, 'kraeuter'],
    [/schriftrolle|rolle/, 'schriftrolle'], [/behälter|kartenrolle/, 'schriftrolle'], [/zauberbuch|grimoire/, 'zauberbuch'],
    [/buch|foliant|tagebuch|journal/, 'buch'], [/papier|pergament/, 'pergament'], [/karte\b|landkarte/, 'karte'],
    [/feder|tinte|schreib|fälscher/, 'feder'], [/kompass|navigation/, 'kompass'], [/fernrohr|fernglas/, 'fernrohr'],
    [/vergrößerungsglas|lupe/, 'lupe'], [/sanduhr/, 'sanduhr'], [/waage/, 'waage'],
    [/rucksack|tornister/, 'rucksack'], [/materialbeutel|beutel|börse|geld/, 'beutel'], [/\bsack\b/, 'sack'],
    [/münze|goldstück/, 'muenzen'], [/truhe/, 'truhe'], [/kiste\b/, 'kiste'], [/korb/, 'korb'], [/fass\b/, 'fass'], [/eimer/, 'eimer'],
    [/seide/, 'seil_seide'], [/seil|tau\b/, 'seil'], [/zelt/, 'zelt'], [/bettrolle|schlafsack|decke/, 'bettrolle'],
    [/fackel/, 'fackel'], [/laterne/, 'laterne'], [/kerze/, 'kerze'], [/zunder/, 'zunder'], [/leiter/, 'leiter'],
    [/dietrich|diebeswerkzeug|einbruch/, 'dietriche'], [/schaufel|spaten/, 'schaufel'], [/flaschenzug/, 'flaschenzug'],
    [/rammbock/, 'rammbock'], [/kreide/, 'kreide'], [/fangeisen|falle/, 'fangeisen'],
    [/schloss\b/, 'schloss'], [/kette\b|kette \(/, 'kette'], [/wetzstein|schleifstein/, 'wetzstein'], [/seife/, 'seife'],
    [/siegelwachs/, 'siegelwachs'], [/signalpfeife|pfeife/, 'pfeife'], [/angel/, 'angel'],
    [/werkzeug|schmiede|ausrüstung|labor|vorräte/, 'werkzeugkiste'],
    [/flöte|schalmei|dudelsack/, 'floete'], [/horn\b/, 'horn'], [/trommel|hackbrett/, 'trommel'], [/leier|harfe|gambe/, 'leier'],
    [/laute|instrument|mandoline/, 'laute'], [/glocke/, 'glocke'], [/würfel/, 'wuerfel'], [/spielkarten|karten/, 'spielkarten'],
    [/schädel/, 'schaedel'], [/knochen/, 'knochen'], [/fell|pelz|haut/, 'fell'], [/spiegel/, 'spiegel'],
  ];
  var raten = function (name) {
    var n = String(name || '').toLowerCase();
    if (!n) return null;
    for (var i = 0; i < RATEN.length; i++) if (RATEN[i][0].test(n)) return 'ib:' + RATEN[i][1];
    return null;
  };

  // Die Auswahl im Gegenstandsdialog.
  var WAHL = [
    {label: 'Waffen', icons: ['langschwert', 'kurzschwert', 'saebel', 'dolch', 'streitaxt', 'kriegshammer', 'streitkolben', 'morgenstern', 'keule', 'sichel', 'speer', 'hellebarde', 'kampfstab', 'peitsche', 'netz', 'bogen', 'armbrust', 'koecher', 'schleuder', 'blasrohr']},
    {label: 'Rüstung & Schilde', icons: ['lederruestung', 'kettenhemd', 'schuppenpanzer', 'brustpanzer', 'plattenpanzer', 'helm', 'wappenschild', 'rundschild', 'panzerhandschuh', 'armschienen']},
    {label: 'Kleidung', icons: ['umhang', 'robe', 'tunika', 'hose', 'kapuze', 'spitzhut', 'handschuhe', 'stiefel', 'guertel', 'maske']},
    {label: 'Magie & Glaube', icons: ['zauberstab', 'kristall', 'kristallkugel', 'komponentenbeutel', 'mistel', 'totem', 'heiliges_symbol', 'reliquie', 'weihwasser', 'ewiges_licht', 'spinnennetz']},
    {label: 'Schmuck & Schätze', icons: ['ring', 'amulett', 'krone', 'edelstein', 'rubin', 'muenzen', 'beutel', 'truhe']},
    {label: 'Tränke & Proviant', icons: ['trank_rot', 'trank_blau', 'trank_gruen', 'phiole', 'feuerflasche', 'oelflasche', 'brot', 'wasserschlauch', 'humpen', 'krug', 'topf', 'geschirr', 'kraeuter']},
    {label: 'Lager & Reise', icons: ['rucksack', 'sack', 'zelt', 'bettrolle', 'seil', 'seil_seide', 'kletterhaken', 'enterhaken', 'leiter', 'stange', 'fackel', 'laterne', 'oellampe', 'kerze', 'zunder', 'heilerausruestung', 'korb', 'fass', 'kiste', 'eimer']},
    {label: 'Werkzeug & Gerät', icons: ['dietriche', 'werkzeugkiste', 'hammer', 'schaufel', 'spitzhacke', 'flaschenzug', 'rammbock', 'kreide', 'kraehenfuesse', 'fangeisen', 'kuegelchen', 'schloss', 'handschellen', 'kette', 'wetzstein', 'seife', 'siegelwachs', 'pfeife', 'waage', 'lupe', 'sanduhr', 'angel', 'glocke', 'spiegel']},
    {label: 'Schriften & Wissen', icons: ['schriftrolle', 'pergament', 'buch', 'zauberbuch', 'buch_offen', 'karte', 'feder', 'kompass', 'fernrohr']},
    {label: 'Musik & Spiel', icons: ['laute', 'floete', 'horn', 'trommel', 'leier', 'wuerfel', 'spielkarten']},
    {label: 'Sonstiges', icons: ['schaedel', 'knochen', 'fell']},
  ].map(function (k) { return {label: k.label, icons: k.icons.map(function (n) { return 'ib:' + n; })}; });

  // ── Zeichnen ──────────────────────────────────────────────────
  var KONTUR = '#22180f';
  var farbe = function (f) { return P[f] || f; };
  var teile = function (spec) {
    return spec.map(function (s) {
      var art = s.charAt(0), rest = s.slice(1), f = null;
      if (rest.charAt(0) === ':') { var sp = rest.indexOf(' '); f = farbe(rest.slice(1, sp)); rest = rest.slice(sp); }
      rest = rest.trim();
      var t = {art: art, farbe: f};
      if (rest.charAt(0) === 'c' && rest.charAt(1) === ' ') {
        var p = rest.slice(2).trim().split(/\s+/);
        t.kreis = {cx: +p[0], cy: +p[1], r: +p[2]};
        if (p.length > 3) t.d = p.slice(3).join(' ');   // Kreis mit Loch (E): der Rest ist ein Pfad
      } else t.d = rest;
      return t;
    });
  };
  var stil = function (t) {
    switch (t.art) {
      case 'F': return {fill: t.farbe, stroke: KONTUR, strokeWidth: 1.5};
      case 'E': return {fill: t.farbe, stroke: KONTUR, strokeWidth: 1.5, fillRule: 'evenodd'};
      case 'f': return {fill: t.farbe, stroke: 'none'};
      case 'h': return {fill: '#ffffff', fillOpacity: 0.32, stroke: 'none'};
      case 'L': return {fill: 'none', stroke: KONTUR, strokeWidth: 1.1};
      case 'S': return {fill: 'none', stroke: t.farbe, strokeWidth: 1.5};
      case 'W': return {fill: 'none', stroke: t.farbe, strokeWidth: 2.4};
      default: return {fill: 'none', stroke: KONTUR};
    }
  };
  var kreisPfad = function (k) {
    return 'M' + (k.cx - k.r) + ' ' + k.cy + 'a' + k.r + ' ' + k.r + ' 0 1 0 ' + (2 * k.r) + ' 0a' + k.r + ' ' + k.r + ' 0 1 0 ' + (-2 * k.r) + ' 0z';
  };

  // Welches Bild für ein gespeichertes Zeichen — oder null.
  var bildName = function (zeichen) {
    if (!zeichen) return null;
    var s = String(zeichen);
    if (s.indexOf('ib:') === 0) { var n = s.slice(3); return B[n] ? n : null; }
    var c = s.charCodeAt(0);
    var erst = c >= 0xD800 && c <= 0xDBFF ? s.slice(0, 2) : s.charAt(0);
    return BZ[erst] || null;
  };

  var reactBild = function (name, key, titel) {
    var R = window.React, alt = R.__hbAlt || R.createElement;
    var b = B[name];
    var kinder = teile(b.teile).map(function (t, i) {
      var st = stil(t);
      var d = t.kreis ? kreisPfad(t.kreis) + (t.d ? ' ' + t.d : '') : t.d;
      return alt('path', {key: i, d: d, style: st, strokeLinejoin: 'round', strokeLinecap: 'round'});
    });
    if (titel) kinder.unshift(alt('desc', {key: 'z'}, titel));
    return alt.apply(null, ['svg', {key: key, className: 'ib ib-' + name, viewBox: '0 0 48 48',
      'aria-hidden': 'true', focusable: 'false'}].concat(kinder));
  };

  // ── Nach außen ────────────────────────────────────────────────
  var H = window.HB_IKONEN;
  H.bilder = Object.keys(B);
  H.bildLabel = function (zeichen) { var n = bildName(zeichen); return n ? B[n].label : ''; };
  H.bildWahl = WAHL;
  H.raten = raten;
  // Zeigen zwei Zeichen dasselbe Bild? (Für „ausgewählt" in der Auswahl —
  // ein altes 🛡 und „ib:wappenschild" sind dasselbe.)
  H.gleichesBild = function (a, b) {
    if (a === b) return true;
    var x = bildName(a), y = bildName(b);
    return !!x && x === y;
  };
  // Das Bild eines Gegenstands: mehrfarbig, wenn es eines gibt; sonst das
  // Strich-Icon des Zeichens; sonst das Zeichen selbst.
  H.bild = function (zeichen, key) {
    var n = bildName(zeichen);
    if (n) return reactBild(n, key, zeichen);
    var linie = H.nameVon && H.nameVon(String(zeichen || ''));
    if (linie) return H.react(linie, key);
    return zeichen || null;
  };
  // Für den Strich-Umbau in icons.js: „ib:kettenhemd" im Fließtext wird
  // zum kleinen Strich-Icon.
  H.linieVonBild = function (token) { var n = bildName(token); return n ? B[n].linie : null; };
})();
