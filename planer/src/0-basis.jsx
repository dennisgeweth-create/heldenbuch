// ── Abenteuerplaner: Grundlagen ──────────────────────────────────
// Der Planer ist eine eigene Seite neben dem Heldenbuch, mit eigenem
// Buendel (planer/planer.js) — aber derselben Anmeldung, derselben
// Gruppe und derselben api.php. Siehe PLANER.md.
//
// Die Dateien in planer/src/ werden wie im Heldenbuch in Namensreihenfolge
// aneinandergehaengt und teilen sich einen Geltungsbereich.
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// Die Ausgabe des Planers zaehlt eigenstaendig: er waechst in Stufen,
// die mit den Ausgaben des Heldenbuchs nichts zu tun haben.
const PLANER_VERSION = 'Stufe 4';
