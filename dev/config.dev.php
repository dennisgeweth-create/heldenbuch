<?php
// ════════════════════════════════════════════════════════════════
//  Konfiguration der oertlichen Testdatenbank
// ════════════════════════════════════════════════════════════════
// Hier stehen mit Absicht keine Geheimnisse: das ist eine Wegwerf-
// datenbank auf diesem Rechner, die jederzeit neu aufgebaut werden darf.
// Deshalb darf diese Datei — anders als config.php — im Repo liegen.
//
// Benutzt wird sie nur, wenn HB_CONFIG darauf zeigt und PHP von der
// Kommandozeile oder aus dem eingebauten Server laeuft. Siehe api.php.

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'heldenbuch_dev');
define('DB_USER', 'root');
define('DB_PASS', '');            // XAMPP legt root ohne Passwort an

// Der oertliche Entwicklungsserver des Heldenbuchs.
define('ALLOWED_ORIGIN', 'http://localhost:8777');
