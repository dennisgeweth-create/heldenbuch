// Abenteuerplaner — Service Worker fuer den Fall ohne Netz.
//
//  planer-dateien/  (Kacheln, Bilder)  zuerst aus dem Vorrat, sonst aus
//                                      dem Netz, und dann in den Vorrat.
//                                      Ihre Namen aendern sich bei jeder
//                                      Aenderung; ein Treffer ist nie alt.
//  planer/, vendor/ (die Seite)        zuerst aus dem Netz, damit eine neue
//                                      Ausgabe sofort gilt; ohne Netz aus
//                                      dem Vorrat.
//
// Die Daten selbst (planer_laden) sind POST-Anfragen; die haelt die Seite
// im localStorage vor, nicht dieser Worker.
const DATEIEN = 'hb-planer-dateien-v1';
const SEITE = 'hb-planer-seite-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (u.pathname.includes('/planer-dateien/')) {
    e.respondWith(caches.open(DATEIEN).then(async (c) => {
      const treffer = await c.match(r, { ignoreSearch: true });
      if (treffer) return treffer;
      const antwort = await fetch(r);
      if (antwort.ok) c.put(r, antwort.clone());
      return antwort;
    }));
    return;
  }
  if (u.pathname.includes('/planer/') || u.pathname.includes('/vendor/')
      || u.pathname.endsWith('/js/zip.js') || u.pathname.endsWith('/favicon.png')) {
    e.respondWith(fetch(r).then((antwort) => {
      if (antwort.ok) { const kopie = antwort.clone(); caches.open(SEITE).then((c) => c.put(r, kopie)); }
      return antwort;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then((t) => t || Response.error())));
  }
});
