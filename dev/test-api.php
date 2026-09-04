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

// ════════════════════════════════════════════════════════════════
//  Besitz der Boegen — Stufe 3
// ════════════════════════════════════════════════════════════════

abschnitt('Ein Bogen ohne Besitzer');
// Die Anmeldungen von oben sind teils abgelaufen — hier frisch holen.
$r = ruf('login', ['user' => $dm, 'password' => 'neuesnotpasswort']);
$tDm = (string)$r['body']['token'];
$r = ruf('login', ['user' => $spieler, 'password' => 'meineigenes']);
$tSpieler = (string)$r['body']['token'];
// Ein zweiter Spieler in derselben Gruppe.
$zweiter = 'zweiter' . rand(1000, 9999);
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $zweiter, 'neu' => 'einmalpasswort']);
$idZweiter = (int)$r['body']['id'];
ruf('member_set', ['token' => $tAdmin, 'user_id' => $idZweiter, 'gruppe' => $code, 'rolle' => 'spieler']);
$r = ruf('login', ['user' => $zweiter, 'password' => 'einmalpasswort']);
$tZweiter = (string)$r['body']['token'];

// Ein Bogen ueber den alten Weg: der hat keinen Besitzer, wie alle, die
// es heute schon gibt.
$alt = ['id' => 'a1', 'name' => 'Herrenlos', 'charClass' => 'Schurke', 'level' => 1, 'hp' => 8, 'maxHp' => 8];
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'a1', 'char' => $alt]);
pruefe('der alte Weg legt an (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('load nennt die Besitzer', array_key_exists('owners', $r['body']));
pruefe('dieser Bogen hat keinen', !isset($r['body']['owners']['a1']),
       json_encode($r['body']['owners'] ?? null));
$alt['hp'] = 5;
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 'a1', 'char' => $alt]);
pruefe('ein herrenloser Bogen bleibt fuer jeden aenderbar (200)', $r['status'] === 200, kurz($r));

abschnitt('Ein Bogen mit Besitzer');
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tSpieler,
                            'char_id' => 'a1', 'owner' => $idSpieler]);
pruefe('ein Spieler nimmt sich keinen Bogen (403)', $r['status'] === 403, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm,
                            'char_id' => 'a1', 'owner' => $idFremd]);
pruefe('nicht an jemanden ausserhalb der Gruppe (404)', $r['status'] === 404, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm,
                            'char_id' => 'a1', 'owner' => $idSpieler]);
pruefe('die Spielleitung ordnet zu (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
pruefe('load nennt den Besitzer', (($r['body']['owners']['a1'] ?? 0) === $idSpieler),
       json_encode($r['body']['owners'] ?? null));

$alt['hp'] = 4;
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 'a1', 'char' => $alt]);
pruefe('der Besitzer darf speichern (200)', $r['status'] === 200, kurz($r));
$alt['hp'] = 99;
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'a1', 'char' => $alt]);
pruefe('ein anderer Spieler nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
$a1 = null;
foreach ($r['body']['chars'] as $c) if ($c['id'] === 'a1') $a1 = $c;
pruefe('und es steht auch nichts Fremdes drin', ($a1['hp'] ?? null) === 4, json_encode($a1['hp'] ?? null));

$r = ruf('save_item', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'a1',
                       'item_id' => 'x1', 'item' => ['id' => 'x1', 'name' => 'Untergeschoben']]);
pruefe('auch kein Gegenstand im fremden Inventar (403)', $r['status'] === 403, kurz($r));
$r = ruf('delete_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'a1']);
pruefe('und geloescht wird er auch nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'a1', 'char' => $alt]);
pruefe('die Spielleitung darf trotzdem (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'a1', 'char' => $alt]);
pruefe('und der alte Weg auch (200)', $r['status'] === 200, kurz($r));

abschnitt('Wer anlegt, besitzt');
$neu = ['id' => 'n1', 'name' => 'Eigener', 'charClass' => 'Magier', 'level' => 1, 'hp' => 6, 'maxHp' => 6];
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'n1', 'char' => $neu]);
pruefe('ein neuer Bogen wird angelegt (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tZweiter]);
pruefe('und gehoert dem, der ihn angelegt hat',
       (($r['body']['owners']['n1'] ?? 0) === $idZweiter), json_encode($r['body']['owners'] ?? null));
$neu['hp'] = 3;
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 'n1', 'char' => $neu]);
pruefe('ein anderer kommt nicht daran (403)', $r['status'] === 403, kurz($r));

abschnitt('Zuordnung aufheben');
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm, 'char_id' => 'n1', 'owner' => null]);
pruefe('die Spielleitung hebt sie auf (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 'n1', 'char' => $neu]);
pruefe('danach darf wieder jeder (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
pruefe('und niemand steht mehr daneben', !isset($r['body']['owners']['n1']));

abschnitt('Die Mitgliederliste');
$r = ruf('member_list', ['code' => $code, 'token' => $tSpieler]);
pruefe('ein Spieler bekommt sie nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('member_list', ['code' => $code, 'token' => $tDm]);
pruefe('die Spielleitung schon (200)', $r['status'] === 200, kurz($r));
$namenM = array_column($r['body']['mitglieder'] ?? [], 'name');
pruefe('sie enthaelt die drei der Gruppe', count($namenM) === 3, implode(', ', $namenM));
pruefe('und niemanden von ausserhalb', !in_array($fremdName, $namenM, true), implode(', ', $namenM));
$r = ruf('member_list', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp]);
pruefe('ueber das DM-Passwort geht sie auch (200)', $r['status'] === 200, kurz($r));

// ════════════════════════════════════════════════════════════════
//  Spielleitung je Abenteuer — Stufe 4
// ════════════════════════════════════════════════════════════════

abschnitt('Solange niemand eingetragen ist');
// Ein zweiter DM in derselben Gruppe.
$dm2 = 'dmzwei' . rand(1000, 9999);
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $dm2, 'neu' => 'einmalpasswort']);
$idDm2 = (int)$r['body']['id'];
ruf('member_set', ['token' => $tAdmin, 'user_id' => $idDm2, 'gruppe' => $code, 'rolle' => 'dm']);
$r = ruf('login', ['user' => $dm2, 'password' => 'einmalpasswort']);
$tDm2 = (string)$r['body']['token'];

// Je ein Held in zwei Abenteuern.
$hS = ['id' => 's1', 'name' => 'Strahdheld',  'charClass' => 'Kleriker', 'level' => 2,
       'hp' => 12, 'maxHp' => 12, 'adventure' => 'strahd'];
$hE = ['id' => 'e1', 'name' => 'Eberronheld', 'charClass' => 'Magier',   'level' => 2,
       'hp' => 9,  'maxHp' => 9,  'adventure' => 'eberron'];
ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 's1', 'char' => $hS]);
ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'e1', 'char' => $hE]);
ruf('char_owner_set', ['code' => $code, 'token' => $tAdmin, 'char_id' => 's1', 'owner' => $idSpieler]);
ruf('char_owner_set', ['code' => $code, 'token' => $tAdmin, 'char_id' => 'e1', 'owner' => $idZweiter]);

$hS['hp'] = 11;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm,  'char_id' => 's1', 'char' => $hS]);
pruefe('jede Spielleitung darf ueberall (200)', $r['status'] === 200, kurz($r));
$hE['hp'] = 8;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm2, 'char_id' => 'e1', 'char' => $hE]);
pruefe('auch die zweite (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tDm]);
pruefe('load nennt die Spielleitungen', array_key_exists('adv_dms', $r['body']));
pruefe('und die Liste ist leer', empty((array)$r['body']['adv_dms']),
       json_encode($r['body']['adv_dms']));

abschnitt('Eingetragen wird eingegrenzt');
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'user_ids' => [$idDm]]);
pruefe('eine Spielleitung traegt sich nicht selbst ein (403)', $r['status'] === 403, kurz($r));
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'strahd', 'user_ids' => [$idFremd]]);
pruefe('ein Fremder wird abgelehnt (404)', $r['status'] === 404, kurz($r));
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'strahd', 'user_ids' => [$idDm]]);
pruefe('die Verwaltung traegt ein (200)', $r['status'] === 200, kurz($r));
pruefe('die Antwort traegt die neue Karte',
       (($r['body']['adv_dms']['strahd'][0] ?? 0) === $idDm), json_encode($r['body']['adv_dms'] ?? null));

$hS['hp'] = 10;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm,  'char_id' => 's1', 'char' => $hS]);
pruefe('die eingetragene Spielleitung darf weiter (200)', $r['status'] === 200, kurz($r));
$hS['hp'] = 99;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm2, 'char_id' => 's1', 'char' => $hS]);
pruefe('die andere nicht mehr (403)', $r['status'] === 403, kurz($r));
pruefe('und die Meldung nennt den Grund',
       strpos((string)($r['body']['message'] ?? ''), 'Abenteuer') !== false,
       (string)($r['body']['message'] ?? ''));
$r = ruf('load', ['code' => $code, 'token' => $tDm]);
$s1 = null; foreach ($r['body']['chars'] as $c) if ($c['id'] === 's1') $s1 = $c;
pruefe('es steht auch nichts Fremdes drin', ($s1['hp'] ?? null) === 10, json_encode($s1['hp'] ?? null));

$hE['hp'] = 7;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm2, 'char_id' => 'e1', 'char' => $hE]);
pruefe('im nicht eingetragenen Abenteuer duerfen weiter beide (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tDm,  'char_id' => 'e1', 'char' => $hE]);
pruefe('auch die erste (200)', $r['status'] === 200, kurz($r));

abschnitt('Zuordnen gilt auch nur im eigenen Abenteuer');
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm2, 'char_id' => 's1', 'owner' => $idZweiter]);
pruefe('die fremde Spielleitung ordnet nicht zu (403)', $r['status'] === 403, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm, 'char_id' => 's1', 'owner' => $idZweiter]);
pruefe('die eigene schon (200)', $r['status'] === 200, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm, 'char_id' => 's1', 'owner' => $idSpieler]);
pruefe('und wieder zurueck (200)', $r['status'] === 200, kurz($r));

abschnitt('Der Spieler bleibt ein Spieler');
$hS['hp'] = 6;
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 's1', 'char' => $hS]);
pruefe('der Besitzer darf seinen Bogen (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 's1', 'char' => $hS]);
pruefe('ein anderer Spieler nicht (403)', $r['status'] === 403, kurz($r));

abschnitt('Austragen macht es wieder weit');
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'strahd', 'user_ids' => []]);
pruefe('die Verwaltung traegt alle aus (200)', $r['status'] === 200, kurz($r));
$hS['hp'] = 5;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm2, 'char_id' => 's1', 'char' => $hS]);
pruefe('danach darf wieder jede Spielleitung (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('und die Karte ist wieder leer', empty((array)$r['body']['adv_dms']),
       json_encode($r['body']['adv_dms']));

abschnitt('Der alte Weg kennt das alles nicht');
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'strahd', 'user_ids' => [$idDm]]);
$hS['hp'] = 4;
$r = ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 's1', 'char' => $hS]);
pruefe('das Gruppenpasswort schreibt weiter ueberall (200)', $r['status'] === 200, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'password' => $pass, 'dm_password' => $dmp,
                            'char_id' => 's1', 'owner' => $idSpieler]);
pruefe('und das DM-Passwort ordnet weiter zu (200)', $r['status'] === 200, kurz($r));

// ════════════════════════════════════════════════════════════════
//  Das Abenteuerlog — Stufe 5
// ════════════════════════════════════════════════════════════════

abschnitt('Wer geschrieben hat, steht als Kennung darin');
// Ein DM-Held in Strahd, damit es etwas zu verbergen gibt.
ruf('save_char', ['code' => $code, 'password' => $pass, 'char_id' => 'd1', 'char' => [
    'id' => 'd1', 'name' => 'Strahd selbst', 'charClass' => 'Magier', 'level' => 9,
    'hp' => 60, 'maxHp' => 60, 'adventure' => 'strahd', 'dmOnly' => true]]);

ruf('save_log', ['code' => $code, 'token' => $tSpieler, 'entry' =>
    ['char_id' => 's1', 'char_name' => 'Strahdheld', 'tab' => 'attribute',
     'action' => 'Vom Spieler geschrieben', 'adv_id' => 'strahd']]);
ruf('save_log', ['code' => $code, 'token' => $tDm, 'entry' =>
    ['char_id' => 'd1', 'char_name' => 'Strahd selbst', 'tab' => 'notizen',
     'action' => 'Geheime Zeile zum DM-Helden', 'adv_id' => 'strahd']]);
ruf('save_log', ['code' => $code, 'token' => $tDm2, 'entry' =>
    ['char_id' => 'e1', 'char_name' => 'Eberronheld', 'tab' => 'waffen',
     'action' => 'Zeile aus Eberron', 'adv_id' => 'eberron']]);

$r = ruf('my_data', ['token' => $tSpieler]);
pruefe('my_data antwortet (200)', $r['status'] === 200, kurz($r));
pruefe('es kennt das eigene Konto', (($r['body']['konto']['name'] ?? '') === $spieler));
pruefe('es nennt die Gruppen', (($r['body']['gruppen'][0]['session_code'] ?? '') === $code));
$eigene = array_column($r['body']['log'] ?? [], 'action');
pruefe('die eigene Zeile steht darin', in_array('Vom Spieler geschrieben', $eigene, true),
       implode(' | ', $eigene));
pruefe('fremde Zeilen nicht', !in_array('Zeile aus Eberron', $eigene, true), implode(' | ', $eigene));
pruefe('es nennt auch die offenen Anmeldungen', count($r['body']['anmeldungen'] ?? []) >= 1);
$r = ruf('my_data', []);
pruefe('ohne Anmeldung gibt es keine Auskunft (401)', $r['status'] === 401, kurz($r));

abschnitt('Wer welche Zeilen zu sehen bekommt');
$holen = function ($daten) {
    $r = ruf('load_logs', array_merge(['code' => $GLOBALS['code'], 'limit' => 100], $daten));
    return array_column($r['body']['logs'] ?? [], 'action');
};
$alsSpieler = $holen(['token' => $tSpieler]);
pruefe('ein Spieler sieht die Zeile zum DM-Helden nicht',
       !in_array('Geheime Zeile zum DM-Helden', $alsSpieler, true), implode(' | ', $alsSpieler));
pruefe('seine eigene schon', in_array('Vom Spieler geschrieben', $alsSpieler, true));
pruefe('und nichts aus dem fremden Abenteuer',
       !in_array('Zeile aus Eberron', $alsSpieler, true), implode(' | ', $alsSpieler));

$alsDm = $holen(['token' => $tDm]);
pruefe('die Spielleitung von Strahd sieht ihren DM-Helden',
       in_array('Geheime Zeile zum DM-Helden', $alsDm, true), implode(' | ', $alsDm));
$alsDm2 = $holen(['token' => $tDm2]);
pruefe('die Spielleitung von Eberron sieht Strahd nicht',
       !in_array('Geheime Zeile zum DM-Helden', $alsDm2, true), implode(' | ', $alsDm2));
pruefe('ihr eigenes Abenteuer schon', in_array('Zeile aus Eberron', $alsDm2, true));

$alsAdmin = $holen(['token' => $tAdmin]);
pruefe('die Verwaltung sieht beides',
       in_array('Geheime Zeile zum DM-Helden', $alsAdmin, true)
       && in_array('Zeile aus Eberron', $alsAdmin, true), implode(' | ', $alsAdmin));
$altWeg = $holen(['password' => $pass]);
pruefe('und der alte Weg auch',
       in_array('Geheime Zeile zum DM-Helden', $altWeg, true), implode(' | ', $altWeg));

abschnitt('Aufbewahrung');
$r = ruf('load', ['code' => $code, 'token' => $tAdmin]);
pruefe('load nennt die Frist', (($r['body']['log_tage'] ?? 0) === 180), json_encode($r['body']['log_tage'] ?? null));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tSpieler, 'tage' => 30]);
pruefe('ein Spieler stellt sie nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tAdmin, 'tage' => 3]);
pruefe('unter sieben Tagen wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tAdmin, 'tage' => 30]);
pruefe('die Verwaltung stellt sie (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tAdmin]);
pruefe('und load nennt die neue', (($r['body']['log_tage'] ?? 0) === 30), json_encode($r['body']['log_tage'] ?? null));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tAdmin, 'tage' => 0]);
pruefe('null setzt auf die Vorgabe zurueck', (($r['body']['tage'] ?? 0) === 180), kurz($r));

echo "\n" . str_repeat('─', 52) . "\n";
// ════════════════════════════════════════════════════════════════
//  Konto entfernen — Stufe 6
// ════════════════════════════════════════════════════════════════

abschnitt('Ein Konto entfernen');
$weg = 'wegdamit' . rand(1000, 9999);
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $weg, 'neu' => 'einmalpasswort']);
$idWeg = (int)$r['body']['id'];
ruf('member_set', ['token' => $tAdmin, 'user_id' => $idWeg, 'gruppe' => $code, 'rolle' => 'spieler']);
$r = ruf('login', ['user' => $weg, 'password' => 'einmalpasswort']);
$tWeg = (string)$r['body']['token'];
ruf('save_char', ['code' => $code, 'token' => $tWeg, 'char_id' => 'w1', 'char' => [
    'id' => 'w1', 'name' => 'Verwaister Bogen', 'charClass' => 'Barde', 'level' => 1,
    'hp' => 8, 'maxHp' => 8, 'adventure' => 'eberron']]);
ruf('save_log', ['code' => $code, 'token' => $tWeg, 'entry' =>
    ['char_id' => 'w1', 'char_name' => 'Verwaister Bogen', 'tab' => 'notizen',
     'action' => 'Zeile eines spaeter geloeschten Kontos', 'adv_id' => 'eberron']]);

$r = ruf('user_delete', ['token' => $tSpieler, 'user_id' => $idWeg]);
pruefe('ein Spieler loescht kein Konto (403)', $r['status'] === 403, kurz($r));
$r = ruf('user_delete', ['token' => $tAdmin, 'user_id' => 999999]);
pruefe('ein unbekanntes Konto wird gemeldet (404)', $r['status'] === 404, kurz($r));
$r = ruf('user_list', ['token' => $tAdmin]);
$eigene = 0;
foreach ($r['body']['users'] as $x) if ($x['name'] === $admin) $eigene = (int)$x['id'];
$r = ruf('user_delete', ['token' => $tAdmin, 'user_id' => $eigene]);
pruefe('das eigene Konto bleibt (400)', $r['status'] === 400, kurz($r));

$r = ruf('user_delete', ['token' => $tAdmin, 'user_id' => $idWeg]);
pruefe('die Verwaltung loescht (200)', $r['status'] === 200, kurz($r));
$r = ruf('me', ['token' => $tWeg]);
pruefe('die Anmeldung ist damit weg (401)', $r['status'] === 401, kurz($r));
$r = ruf('login', ['user' => $weg, 'password' => 'einmalpasswort']);
pruefe('und anmelden geht nicht mehr (401)', $r['status'] === 401, kurz($r));

$r = ruf('load', ['code' => $code, 'password' => $pass]);
pruefe('der Bogen ist noch da',
       in_array('Verwaister Bogen', array_column($r['body']['chars'], 'name'), true));
pruefe('und gehoert jetzt niemandem', !isset($r['body']['owners']['w1']),
       json_encode($r['body']['owners'] ?? null));
$r = ruf('load_logs', ['code' => $code, 'password' => $pass, 'limit' => 100]);
$zeile = null;
foreach ($r['body']['logs'] as $l) if ($l['action'] === 'Zeile eines spaeter geloeschten Kontos') $zeile = $l;
pruefe('die Logzeile steht noch', $zeile !== null);
pruefe('ohne Kennung', $zeile !== null && $zeile['user_id'] === null,
       json_encode($zeile['user_id'] ?? 'fehlt'));
pruefe('mit ihrem Inhalt', $zeile !== null && $zeile['char_name'] === 'Verwaister Bogen');

// ════════════════════════════════════════════════════════════════
//  DM hier, Spieler nebenan
// ════════════════════════════════════════════════════════════════

abschnitt('Die Rolle haengt am Abenteuer, nicht an der Gruppe');
// $zweiter ist Spieler der Gruppe. Er bekommt Eberron.
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin,
                        'adv_id' => 'eberron', 'user_ids' => [$idZweiter]]);
pruefe('ein Spieler der Gruppe darf Spielleitung eines Abenteuers werden (200)',
       $r['status'] === 200, kurz($r));

// e1 gehoert ihm ohnehin; s1 gehoert $idSpieler und liegt in Strahd.
$hE['hp'] = 6;
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'e1', 'char' => $hE]);
pruefe('in seinem Abenteuer darf er alles (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tZweiter]);
pruefe('und kommt an die Sachen der Spielleitung (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load_enemies', ['code' => $code, 'token' => $tZweiter]);
pruefe('auch an die Gegner (200)', $r['status'] === 200, kurz($r));

$hS['hp'] = 3;
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 's1', 'char' => $hS]);
pruefe('nebenan bleibt er Spieler und kommt an keinen fremden Bogen (403)',
       $r['status'] === 403, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tZweiter,
                            'char_id' => 's1', 'owner' => $idZweiter]);
pruefe('und ordnet dort auch nichts zu (403)', $r['status'] === 403, kurz($r));

// Umgekehrt: die Spielleitung der Gruppe, die Eberron nicht mehr leitet.
$hE['hp'] = 5;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'e1', 'char' => $hE]);
pruefe('die Gruppenspielleitung ist in Eberron jetzt aussen vor (403)',
       $r['status'] === 403, kurz($r));

$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'eberron', 'user_ids' => []]);
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'e1', 'char' => $hE]);
pruefe('ausgetragen gilt wieder die Rolle in der Gruppe (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tZweiter]);
pruefe('und der Spieler ist wieder nur Spieler (403)', $r['status'] === 403, kurz($r));

echo str_repeat('=', 52) . "\n";
echo $rot === 0 ? "Alle $gruen Pruefungen bestanden.\n" : "$gruen bestanden, $rot fehlgeschlagen.\n";
exit($rot === 0 ? 0 : 1);
