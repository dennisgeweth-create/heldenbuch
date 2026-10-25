// Heldenbuch — eine neue Fassung erkennen.
//
// Die Seite selbst kommt nie aus dem Zwischenspeicher, und jede Datei
// traegt die Nummer ihrer Auslieferung (?v=…). Ein Neuladen holt also die
// neue Fassung — nur laedt niemand neu: am Telefon holt der Browser einen
// Tab aus dem Hintergrund zurueck, ohne die Seite neu zu holen, und am
// Rechner bleibt der Tab tagelang offen. Dann laeuft die alte Fassung
// weiter, und keiner merkt es.
//
// Deshalb fragt die Seite nach: version.json schreibt der Deploy als
// letzte Datei, mit der Nummer der Auslieferung. Steht dort eine andere
// als die eigene (window.HB_BAU, ebenfalls vom Deploy gestempelt):
//
//   · Liegt die Seite im Hintergrund, oder kommt man gerade zu ihr
//     zurueck, und ist nichts ungespeichert und kein Dialog offen
//     (window.hbOffen, von der Anwendung gesetzt), laedt sie sich selbst
//     neu. Wo man war, merkt sich die Anwendung ohnehin.
//   · Sonst steht unten ein Hinweis mit einem Knopf zum Neuladen.
//
// Ein Neuladen, nach dem immer noch die alte Fassung dasteht (etwa weil
// der Upload noch lief), wird nicht wiederholt — sonst liefe die Seite im
// Kreis. Dann bleibt der Hinweis.
//
// Kein React, keine Abhaengigkeit: dieselbe Datei laedt auch der
// Abenteuerplaner. In der Werkbank (HB_BAU = 'dev') tut sie nichts.
(function () {
  var bau = window.HB_BAU;
  if (!bau || bau === 'dev' || !window.fetch) return;
  var skript = document.currentScript && document.currentScript.src || '';
  var basis = skript.replace(/js\/neu\.js(\?.*)?$/, '');
  var MERKER = 'hb_neu_versucht';
  var neu = null, hinweis = null, weggeklickt = null;

  var offen = function () {
    try { return typeof window.hbOffen === 'function' ? !!window.hbOffen() : false; }
    catch (e) { return true; }
  };
  var versucht = function () { try { return sessionStorage.getItem(MERKER); } catch (e) { return null; } };
  var laden = function () {
    try { sessionStorage.setItem(MERKER, neu || ''); } catch (e) {}
    location.reload();
  };
  // Selbst neu laden darf die Seite nur einmal je neuer Nummer.
  var vonSelbst = function () { return neu && versucht() !== neu && !offen(); };

  var zeigen = function () {
    if (hinweis || weggeklickt === neu) return;
    hinweis = document.createElement('div');
    hinweis.setAttribute('role', 'status');
    hinweis.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:100000;'
      + 'display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);padding:9px 10px 9px 14px;'
      + 'border-radius:8px;background:#1a1c1e;border:1px solid #e8b84b;box-shadow:0 10px 30px rgba(0,0,0,.6);'
      + "font:13px 'Roboto',sans-serif;color:#e4e6e8";
    var text = document.createElement('span');
    // Mit dem Icon aus js/icons.js, wenn es geladen ist.
    if (window.HB_IKONEN) text.innerHTML = window.HB_IKONEN.markup('funke') + ' ';
    text.appendChild(document.createTextNode('Eine neue Fassung ist da.'));
    var knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.textContent = 'Neu laden';
    knopf.style.cssText = 'cursor:pointer;padding:6px 12px;border-radius:5px;border:1px solid #e8b84b;'
      + "background:#e8b84b;color:#0f1011;font:600 12px 'Roboto Condensed',sans-serif;letter-spacing:.06em";
    knopf.onclick = laden;
    var zu = document.createElement('button');
    zu.type = 'button';
    zu.setAttribute('aria-label', 'Später');
    zu.title = 'Später';
    zu.textContent = '✕';
    zu.style.cssText = 'cursor:pointer;border:none;background:none;color:#8b9198;font-size:14px;padding:4px 6px';
    zu.onclick = function () { weggeklickt = neu; if (hinweis) hinweis.remove(); hinweis = null; };
    hinweis.appendChild(text); hinweis.appendChild(knopf); hinweis.appendChild(zu);
    document.body.appendChild(hinweis);
  };

  var pruefen = function () {
    fetch(basis + 'version.json?t=' + Date.now(), {cache: 'no-store'})
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.bau) return;
        if (d.bau === bau) { neu = null; return; }
        neu = String(d.bau);
        if (document.hidden && vonSelbst()) { laden(); return; }
        zeigen();
      })
      .catch(function () {});
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (vonSelbst()) { laden(); return; }
    pruefen();
  });
  setInterval(pruefen, 60000);
  setTimeout(pruefen, 4000);
})();
