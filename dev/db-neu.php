<?php
// Baut die oertliche Testdatenbank neu auf: loeschen, anlegen, fertig.
// Das Schema legt api.php beim ersten Aufruf selbst an — genau darum geht
// es ja, es soll hier laufen, bevor es auf dem Server laeuft.
//
// Aufruf:  php dev/db-neu.php
//
// Die Sperre unten ist der eigentliche Grund, warum diese Datei
// existiert. Im Projektordner liegt eine config.php, die auf die
// Datenbank der Gruppe zeigt. Ein "DROP DATABASE" mit der falschen
// Konfiguration waere nicht rueckgaengig zu machen, und ein Skript, das
// loescht, darf sich nicht darauf verlassen, dass es richtig aufgerufen
// wurde.

require_once __DIR__ . '/config.dev.php';

$erlaubt = ['127.0.0.1', 'localhost', '::1'];
if (!in_array(DB_HOST, $erlaubt, true)) {
    fwrite(STDERR, "Abbruch: DB_HOST ist '" . DB_HOST . "'.\n"
        . "Dieses Skript loescht eine Datenbank und laeuft nur gegen diesen Rechner.\n");
    exit(2);
}
if (!preg_match('/_dev$/', DB_NAME)) {
    fwrite(STDERR, "Abbruch: DB_NAME ist '" . DB_NAME . "' und endet nicht auf _dev.\n");
    exit(2);
}

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';charset=utf8mb4', DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    fwrite(STDERR, "Keine Verbindung zur Datenbank: " . $e->getMessage() . "\n"
        . "Laeuft MariaDB? (dev/start.ps1 startet sie mit)\n");
    exit(1);
}

$pdo->exec('DROP DATABASE IF EXISTS `' . DB_NAME . '`');
$pdo->exec('CREATE DATABASE `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
echo "Datenbank " . DB_NAME . " neu angelegt.\n";
