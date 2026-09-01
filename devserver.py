#!/usr/bin/env python3
"""Lokaler Entwicklungsserver fuer das Heldenbuch.

Statt `python -m http.server`, weil dessen Antworten ohne Cache-Vorgabe
kommen: der Browser haelt styles.css und js/*.js dann heuristisch fest und
liefert beim Neuladen alte Staende aus. Beim Deploy loest der Commit-Hash in
?v=... dasselbe Problem — lokal bleibt der Platzhalter ?v=dev stehen, deshalb
hier no-store.

    python devserver.py [port]
"""
import functools
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    # Immer den Ordner dieser Datei ausliefern, unabhaengig davon, aus
    # welchem Verzeichnis der Server gestartet wurde.
    root = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(NoCacheHandler, directory=root)
    print(f"Heldenbuch auf http://localhost:{port}  (ohne Cache, aus {root})")
    ThreadingHTTPServer(("", port), handler).serve_forever()
