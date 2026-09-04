<?php
// ════════════════════════════════════════════════════════════════
//  Testlauf gegen die oertliche Schnittstelle
// ════════════════════════════════════════════════════════════════
// Prueft api.php ueber echte HTTP-Anfragen — also den ganzen Weg: JSON
// hinein, Statuscode und JSON heraus. Alles gegen die Wegwerfdatenbank.
//
//   .\dev\start.ps1 -Neu
//   php dev/test-api.php
//
// Bis hierher wurde die Serverseite nie ausgefuehrt, bevor sie auf dem
// Server lief. Das ging gut, solange es um Speichern ging; fuer
// Anmeldecode waere es fahrlaessig.

$BASIS = getenv('HB_TEST_URL') ?: 'http://127.0.0.1:8123/api.php';

// Mit --neu wird die Testdatenbank vorher geleert. Die Kontenpruefungen
// weiter unten brauchen das: das erste Konto laesst sich nur anlegen,
// solange es keines gibt, und genau das soll geprueft werden.
if (in_array('--neu', $argv ?? [], true)) {
    passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/db-neu.php'), $rc);
    if ($rc !== 0) exit($rc);
}

$gruen = 0; $rot = 0; $abschnitt = '';

function abschnitt(string $t): void { global $abschnitt; $abschnitt = $t; echo "\n── $t\n"; }

function ruf(string $action, array $daten = []): array {
    global $BASIS;
    $roh = json_encode(array_merge(['action' => $action], $daten), JSON_UNESCAPED_UNICODE);
    $ctx = stream_context_create(['http' => [
        'method'        => 'POST',
        'header'        => "Content-Type: application/json\r\n",
        'content'       => $roh,
        'ignore_errors' => true,           // 4xx/5xx sind hier Ergebnisse, keine Fehler
        'timeout'       => 15,
    ]]);
    $antwort = @file_get_contents($BASIS, false, $ctx);
    $status  = 0;
    foreach ($http_response_header ?? [] as $z) {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#', $z, $m)) $status = (int)$m[1];
    }
    if ($antwort === false) {
        fwrite(STDERR, "Keine Antwort von $BASIS — laeuft dev/start.ps1?\n");
        exit(1);
    }
    return ['status' => $status, 'body' => json_decode($antwort, true) ?? ['roh' => $antwort]];
}

function pruefe(string $was, bool $ok, string $zusatz = ''): bool {
    global $gruen, $rot;
    if ($ok) { $gruen++; echo "  ok    $was\n"; }
    else     { $rot++;   echo "  FEHL  $was" . ($zusatz ? "  → $zusatz" : '') . "\n"; }
    return $ok;
}

function kurz(array $a): string {
    return $a['status'] . ' ' . mb_substr((string)($a['body']['message'] ?? ''), 0, 70);
}

// ── Eine frische Gruppe je Lauf, damit Laeufe einander nicht sehen ──
$code = 'T' . substr((string)time(), -6) . rand(10, 99);
$pass = 'testpasswort';
$dmp  = 'dmpasswort';

abschnitt('Gruppe anlegen');
$r = ruf('register', ['code' => $code, 'password' => $pass]);
pruefe('register legt an (201)', $r['status'] === 201, kurz($r));
$r = ruf('register', ['code' => $code, 'password' => $pass]);
pruefe('derselbe Code wird abgelehnt (409)', $r['status'] === 409, kurz($r));
$r = ruf('register', ['code' => 'x', 'password' => $pass]);
pruefe('zu kurzer Code wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('register', ['code' => $code . 'B', 'password' => '123']);
pruefe('zu kurzes Passwort wird abgelehnt (400)', $r['status'] === 400, kurz($r));

abschnitt('Anmelden');
$r = ruf('load', ['code' => $code, 'password' => 'falsch']);
pruefe('falsches Passwort wird abgelehnt (401)', $r['status'] === 401, kurz($r));
$r = ruf('load', ['code' => 'GIBTSNICHT', 'password' => $pass]);
pruefe('unbekannter Code wird abgelehnt (401)', $r['status'] === 401, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('richtiges Passwort laedt (200)', $r['status'] === 200, kurz($r));
pruefe('leere Gruppe hat keine Helden', ($r['body']['chars'] ?? null) === []);
pruefe('load liefert eine Abgleich-Kennung', !empty($r['body']['poll_token']));
pruefe('load sagt, dass kein DM-Passwort gesetzt ist', ($r['body']['has_dm'] ?? true) === false);
$token = $r['body']['poll_token'];
$rev0  = (int)($r['body']['rev'] ?? -1);

abschnitt('Charakter speichern und laden');
$held = ['id' => 'h1', 'name' => 'Armin', 'charClass' => 'Kämpfer', 'level' => 3,
         'hp' => 18, 'maxHp' => 24, 'tempHp' => 0, 'adventure' => 'strahd'];
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'h1', 'char' => $held]);
pruefe('save_char speichert (200)', $r['status'] === 200, kurz($r));
$rev1 = (int)($r['body']['rev'] ?? -1);
pruefe('neuer Inhalt zaehlt den Stand hoch', $rev1 > $rev0, "vorher $rev0, nachher $rev1");

$r = ruf('load', ['code' => $code, 'password' => $pass]);
$geladen = $r['body']['chars'][0] ?? [];
pruefe('der Held kommt zurueck', ($geladen['name'] ?? '') === 'Armin');
pruefe('Umlaute ueberstehen den Weg', ($geladen['charClass'] ?? '') === 'Kämpfer',
       (string)($geladen['charClass'] ?? ''));
pruefe('das Inventar ist leer, nicht fehlend', ($geladen['inventory'] ?? null) === []);

abschnitt('Der Hintergrundabgleich');
$r = ruf('poll', ['code' => $code, 'poll_token' => $token]);
pruefe('poll antwortet (200)', $r['status'] === 200, kurz($r));
pruefe('poll meldet denselben Stand', (int)($r['body']['rev'] ?? -1) === $rev1);
pruefe('poll traegt die Trefferpunkte mit',
       (($r['body']['vitals']['h1']['hp'] ?? null) === 18), json_encode($r['body']['vitals'] ?? null));
$r = ruf('poll', ['code' => $code, 'poll_token' => 'falschefalschefalsche']);
pruefe('poll mit falscher Kennung wird abgelehnt (401)', $r['status'] === 401, kurz($r));

// Das ist der Kern der Sparsamkeit: eine reine Trefferpunktaenderung darf
// bei niemandem einen vollen Ladevorgang ausloesen.
$held['hp'] = 7;
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'h1', 'char' => $held]);
$rev2 = (int)($r['body']['rev'] ?? -1);
pruefe('geaenderte Trefferpunkte zaehlen den Stand NICHT hoch', $rev2 === $rev1,
       "vorher $rev1, nachher $rev2");
$r = ruf('poll', ['code' => $code, 'poll_token' => $token]);
pruefe('poll zeigt die neuen Trefferpunkte', ($r['body']['vitals']['h1']['hp'] ?? null) === 7,
       json_encode($r['body']['vitals'] ?? null));

$held['level'] = 4;
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'h1', 'char' => $held]);
pruefe('eine andere Aenderung zaehlt den Stand hoch', (int)$r['body']['rev'] > $rev2);

abschnitt('Gegenstaende');
$r = ruf('save_item', ['code' => $code, 'password' => $pass, 'char_id' => 'h1',
                       'item_id' => 'i1', 'item' => ['id' => 'i1', 'name' => 'Seil']]);
pruefe('save_item speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('der Gegenstand haengt am Helden',
       (($r['body']['chars'][0]['inventory'][0]['name'] ?? '') === 'Seil'));
$r = ruf('delete_item', ['code' => $code, 'password' => $pass, 'char_id' => 'h1', 'item_id' => 'i1']);
pruefe('delete_item loescht (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('danach ist das Inventar leer', ($r['body']['chars'][0]['inventory'] ?? null) === []);

abschnitt('Bibliothek');
$r = ruf('save_library', ['code' => $code, 'password' => $pass,
                          'library' => ['_adventures' => [['id' => 'strahd', 'name' => 'Strahd']]]]);
pruefe('save_library speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('die Abenteuerliste kommt zurueck',
       (($r['body']['library']['_adventures'][0]['name'] ?? '') === 'Strahd'));

abschnitt('Die Spielleitung');
$r = ruf('dm_load', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('ohne gesetztes DM-Passwort kein Zugang (403)', $r['status'] === 403, kurz($r));
$r = ruf('set_dm_password', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('DM-Passwort setzen (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'password' => $pass, 'dm_password' => 'falsch']);
pruefe('falsches DM-Passwort wird abgelehnt (401)', $r['status'] === 401, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('richtiges DM-Passwort laedt (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_save_library', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp,
                             'dm_library' => ['heldNotizen' => ['h1' => 'Fluch am Finger']]]);
pruefe('dm_save_library speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('die Heldennotiz kommt zurueck',
       (($r['body']['dm_library']['heldNotizen']['h1'] ?? '') === 'Fluch am Finger'));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('ein Spieler bekommt die DM-Bibliothek NICHT zu sehen',
       !array_key_exists('dm_library', $r['body']));

abschnitt('Gegner und Begegnungen');
$r = ruf('dm_save_enemy', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp,
                           'enemy_id' => 'g1', 'enemy' => ['id' => 'g1', 'name' => 'Wolf', 'ac' => 13]]);
pruefe('dm_save_enemy speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load_enemies', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('der Gegner kommt zurueck', (($r['body']['enemies'][0]['name'] ?? '') === 'Wolf'));
$r = ruf('dm_save_encounter', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp,
                               'enc_id' => 'b1', 'encounter' => ['id' => 'b1', 'name' => 'Wolfsrudel']]);
pruefe('dm_save_encounter speichert (200)', $r['status'] === 200, kurz($r));

abschnitt('Chronik');
$r = ruf('dm_save_chronik', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp,
                             'chronik' => ['uhren' => ['strahd' => 9]]]);
pruefe('dm_save_chronik speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load_chronik', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('die Uhr steht auf 9', (($r['body']['chronik']['uhren']['strahd'] ?? 0) === 9));

abschnitt('Abenteuerlog');
$r = ruf('save_log', ['code' => $code, 'password' => $pass,
                      'entry' => ['char_id' => 'h1', 'char_name' => 'Armin', 'tab' => 'attribute',
                                  'action' => 'Trefferpunkte geändert', 'details' => ['von' => 18, 'auf' => 7]]]);
pruefe('save_log schreibt (200)', $r['status'] === 200, kurz($r));
$r = ruf('load_logs', ['code' => $code, 'password' => $pass, 'limit' => 10]);
pruefe('load_logs liest zurueck', (($r['body']['logs'][0]['action'] ?? '') === 'Trefferpunkte geändert'));
pruefe('die Einzelheiten kommen als Objekt zurueck',
       (($r['body']['logs'][0]['details']['auf'] ?? null) === 7));

abschnitt('Loeschen');
$r = ruf('delete_char', ['code' => $code, 'password' => $pass, 'char_id' => 'h1']);
pruefe('delete_char loescht (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('danach ist die Gruppe leer', ($r['body']['chars'] ?? null) === []);

abschnitt('Abwehr');
$r = ruf('gibtsnicht', ['code' => $code, 'password' => $pass]);
pruefe('unbekannte Aktion wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'h1', 'char' => 'kein Objekt']);
pruefe('ein Charakter im falschen Format wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('save_char', ['code' => $code, 'password' => 'falsch', 'char_id' => 'h9',
                       'char' => ['id' => 'h9', 'name' => 'Fremder']]);
pruefe('ohne Passwort wird nicht gespeichert (401)', $r['status'] === 401, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('und es steht auch nichts drin', ($r['body']['chars'] ?? null) === []);

// ════════════════════════════════════════════════════════════════
//  Konten — Stufe 1
// ════════════════════════════════════════════════════════════════

$admin     = 'dennis';                 // muss zu ADMIN_USER passen
$adminPass = 'adminpasswort';
$spieler   = 'spieler' . rand(1000, 9999);
$dm        = 'dm' . rand(1000, 9999);

abschnitt('Das erste Konto');
$r = ruf('user_create', ['name' => 'irgendwer', 'neu' => 'egalegal']);
$frisch = $r['status'] === 403;
pruefe('ein fremder Name wird als erstes Konto abgelehnt (403)', $frisch,
       kurz($r) . ($r['status'] === 401 ? '  — Datenbank nicht leer, mit --neu starten' : ''));
if (!$frisch) { echo "\nAbbruch: die Kontenpruefungen brauchen eine leere Datenbank.\n"
                   . "  php dev/test-api.php --neu\n"; exit(1); }
$r = ruf('user_create', ['name' => $admin, 'neu' => $adminPass]);
pruefe('der Name aus der Konfiguration wird angelegt (201)', $r['status'] === 201, kurz($r));
$r = ruf('user_create', ['name' => 'nochwer', 'neu' => 'egalegal']);
pruefe('danach geht es nicht mehr ohne Anmeldung (401)', $r['status'] === 401, kurz($r));

abschnitt('Anmelden');
$r = ruf('login', ['user' => $admin, 'password' => 'falsch']);
pruefe('falsches Passwort wird abgelehnt (401)', $r['status'] === 401, kurz($r));
$r = ruf('login', ['user' => 'gibtsnicht', 'password' => $adminPass]);
pruefe('unbekannter Name wird abgelehnt (401)', $r['status'] === 401, kurz($r));
pruefe('und die Antwort verraet nicht, welches von beidem falsch war',
       ($r['body']['message'] ?? '') === 'Name oder Passwort falsch.');
$r = ruf('login', ['user' => $admin, 'password' => $adminPass]);
pruefe('richtiges Passwort meldet an (200)', $r['status'] === 200, kurz($r));
$tAdmin = (string)($r['body']['token'] ?? '');
pruefe('die Kennung ist 64 Zeichen lang', strlen($tAdmin) === 64, (string)strlen($tAdmin));
pruefe('das erste Konto ist die Verwaltung', ($r['body']['user']['ist_admin'] ?? false) === true);
$r = ruf('me', ['token' => $tAdmin]);
pruefe('me kennt das Konto', ($r['body']['user']['name'] ?? '') === $admin);
$r = ruf('me', ['token' => str_repeat('a', 64)]);
pruefe('eine erfundene Kennung wird abgelehnt (401)', $r['status'] === 401, kurz($r));
$r = ruf('me', ['token' => 'zu-kurz']);
pruefe('eine zu kurze Kennung wird abgelehnt (401)', $r['status'] === 401, kurz($r));

abschnitt('Konten anlegen und Rollen vergeben');
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $spieler, 'neu' => 'einmalpasswort']);
pruefe('die Verwaltung legt ein Konto an (201)', $r['status'] === 201, kurz($r));
$idSpieler = (int)($r['body']['id'] ?? 0);
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $dm, 'neu' => 'einmalpasswort']);
$idDm = (int)($r['body']['id'] ?? 0);
pruefe('und noch eines', $r['status'] === 201, kurz($r));
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $spieler, 'neu' => 'einmalpasswort']);
pruefe('derselbe Name wird abgelehnt (409)', $r['status'] === 409, kurz($r));
$r = ruf('user_create', ['token' => $tAdmin, 'name' => 'ab', 'neu' => 'einmalpasswort']);
pruefe('ein zu kurzer Name wird abgelehnt (400)', $r['status'] === 400, kurz($r));

$r = ruf('login', ['user' => $spieler, 'password' => 'einmalpasswort']);
$tSpieler = (string)($r['body']['token'] ?? '');
pruefe('das neue Konto kann sich anmelden (200)', $r['status'] === 200, kurz($r));
pruefe('und muss das Einmalpasswort wechseln',
       ($r['body']['user']['muss_wechseln'] ?? false) === true);
pruefe('es ist nicht die Verwaltung', ($r['body']['user']['ist_admin'] ?? true) === false);

$r = ruf('user_list', ['token' => $tSpieler]);
pruefe('ein Spieler sieht die Kontenliste nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('user_create', ['token' => $tSpieler, 'name' => 'schmuggel', 'neu' => 'einmalpasswort']);
pruefe('ein Spieler legt keine Konten an (403)', $r['status'] === 403, kurz($r));
$r = ruf('user_list', ['token' => $tAdmin]);
pruefe('die Verwaltung sieht die Kontenliste (200)', $r['status'] === 200, kurz($r));
pruefe('sie enthaelt drei Konten', count($r['body']['users'] ?? []) === 3,
       (string)count($r['body']['users'] ?? []));
pruefe('Passwort-Hashes stehen nicht darin',
       !array_key_exists('pass_hash', ($r['body']['users'][0] ?? ['pass_hash' => 1])));

abschnitt('Passwort wechseln');
$r = ruf('password_change', ['token' => $tSpieler, 'alt' => 'falsch', 'neu' => 'meineigenes']);
pruefe('mit falschem alten Passwort geht nichts (401)', $r['status'] === 401, kurz($r));
$r = ruf('password_change', ['token' => $tSpieler, 'alt' => 'einmalpasswort', 'neu' => 'kurz']);
pruefe('ein zu kurzes neues Passwort wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('password_change', ['token' => $tSpieler, 'alt' => 'einmalpasswort', 'neu' => 'meineigenes']);
pruefe('mit dem richtigen alten geht es (200)', $r['status'] === 200, kurz($r));
$r = ruf('login', ['user' => $spieler, 'password' => 'meineigenes']);
pruefe('das neue Passwort gilt (200)', $r['status'] === 200, kurz($r));
pruefe('der Wechselzwang ist weg', ($r['body']['user']['muss_wechseln'] ?? true) === false);
$tSpieler = (string)$r['body']['token'];
$r = ruf('login', ['user' => $spieler, 'password' => 'einmalpasswort']);
pruefe('das alte Passwort gilt nicht mehr (401)', $r['status'] === 401, kurz($r));

abschnitt('Mitgliedschaft');
$r = ruf('member_set', ['token' => $tSpieler, 'user_id' => $idSpieler, 'gruppe' => $code, 'rolle' => 'dm']);
pruefe('ein Spieler vergibt keine Rollen (403)', $r['status'] === 403, kurz($r));
$r = ruf('member_set', ['token' => $tAdmin, 'user_id' => $idSpieler, 'gruppe' => 'GIBTSNICHT', 'rolle' => 'spieler']);
pruefe('eine unbekannte Gruppe wird abgelehnt (404)', $r['status'] === 404, kurz($r));
$r = ruf('member_set', ['token' => $tAdmin, 'user_id' => $idSpieler, 'gruppe' => $code, 'rolle' => 'koenig']);
pruefe('eine erfundene Rolle wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('member_set', ['token' => $tAdmin, 'user_id' => $idSpieler, 'gruppe' => $code, 'rolle' => 'spieler']);
pruefe('die Verwaltung setzt die Rolle (200)', $r['status'] === 200, kurz($r));
$r = ruf('member_set', ['token' => $tAdmin, 'user_id' => $idDm, 'gruppe' => $code, 'rolle' => 'dm']);
pruefe('und macht den anderen zum DM (200)', $r['status'] === 200, kurz($r));
$r = ruf('me', ['token' => $tSpieler]);
pruefe('me nennt die Gruppe und die Rolle',
       (($r['body']['user']['gruppen'][0]['rolle'] ?? '') === 'spieler'),
       json_encode($r['body']['user']['gruppen'] ?? null));

abschnitt('Zugang ueber die Anmeldung statt ueber das Gruppenpasswort');
$r = ruf('login', ['user' => $dm, 'password' => 'einmalpasswort']);
$tDm = (string)($r['body']['token'] ?? '');
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
pruefe('ein Mitglied laedt ohne Gruppenpasswort (200)', $r['status'] === 200, kurz($r));
pruefe('und bekommt dieselben Daten', array_key_exists('library', $r['body']));
$r = ruf('load', ['code' => $code, 'token' => $tAdmin]);
pruefe('die Verwaltung kommt ueberall hinein (200)', $r['status'] === 200, kurz($r));

$r = ruf('user_create', ['token' => $tAdmin, 'name' => 'fremder' . rand(100, 999), 'neu' => 'einmalpasswort']);
$idFremd = (int)$r['body']['id'];
$r = ruf('login', ['user' => ($fremdName = ''), 'password' => '']);   // Platzhalter, gleich richtig
$r = ruf('user_list', ['token' => $tAdmin]);
$fremdName = '';
foreach ($r['body']['users'] as $x) if ((int)$x['id'] === $idFremd) $fremdName = $x['name'];
$r = ruf('login', ['user' => $fremdName, 'password' => 'einmalpasswort']);
$tFremd = (string)($r['body']['token'] ?? '');
$r = ruf('load', ['code' => $code, 'token' => $tFremd]);
pruefe('wer nicht in der Gruppe ist, kommt nicht hinein (403)', $r['status'] === 403, kurz($r));

abschnitt('Die Spielleitung ueber die Anmeldung');
$r = ruf('dm_load', ['code' => $code, 'token' => $tSpieler]);
pruefe('ein Spieler bekommt die DM-Bibliothek nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tDm]);
pruefe('der DM der Gruppe schon (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tAdmin]);
pruefe('die Verwaltung auch (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_save_enemy', ['code' => $code, 'token' => $tSpieler,
                           'enemy_id' => 'g9', 'enemy' => ['id' => 'g9', 'name' => 'Schmuggelgegner']]);
pruefe('ein Spieler speichert keinen Gegner (403)', $r['status'] === 403, kurz($r));
$r = ruf('dm_load_enemies', ['code' => $code, 'token' => $tDm]);
$namen = array_column($r['body']['enemies'] ?? [], 'name');
pruefe('und es steht auch keiner drin', !in_array('Schmuggelgegner', $namen, true),
       implode(', ', $namen));

abschnitt('Abmelden');
$r = ruf('logout', ['token' => $tFremd]);
pruefe('logout antwortet (200)', $r['status'] === 200, kurz($r));
$r = ruf('me', ['token' => $tFremd]);
pruefe('danach gilt die Kennung nicht mehr (401)', $r['status'] === 401, kurz($r));
$r = ruf('logout', []);
pruefe('logout ohne Kennung ist kein Fehler (200)', $r['status'] === 200, kurz($r));

abschnitt('Passwort zuruecksetzen');
$r = ruf('user_reset', ['token' => $tSpieler, 'user_id' => $idDm, 'neu' => 'neuesnotpasswort']);
pruefe('ein Spieler setzt nichts zurueck (403)', $r['status'] === 403, kurz($r));
$r = ruf('user_reset', ['token' => $tAdmin, 'user_id' => 999999, 'neu' => 'neuesnotpasswort']);
pruefe('ein unbekanntes Konto wird gemeldet (404)', $r['status'] === 404, kurz($r));
$r = ruf('user_reset', ['token' => $tAdmin, 'user_id' => $idDm, 'neu' => 'neuesnotpasswort']);
pruefe('die Verwaltung setzt zurueck (200)', $r['status'] === 200, kurz($r));
$r = ruf('me', ['token' => $tDm]);
pruefe('die offene Anmeldung des Kontos endet dabei (401)', $r['status'] === 401, kurz($r));
$r = ruf('login', ['user' => $dm, 'password' => 'neuesnotpasswort']);
pruefe('das neue Passwort gilt (200)', $r['status'] === 200, kurz($r));
pruefe('und muss gewechselt werden', ($r['body']['user']['muss_wechseln'] ?? false) === true);

abschnitt('Der alte Weg lebt weiter');
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('das Gruppenpasswort laedt weiterhin (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('das DM-Passwort gilt weiterhin (200)', $r['status'] === 200, kurz($r));

echo "\n" . str_repeat('─', 52) . "\n";
echo $rot === 0 ? "Alle $gruen Pruefungen bestanden.\n" : "$gruen bestanden, $rot fehlgeschlagen.\n";
exit($rot === 0 ? 0 : 1);
