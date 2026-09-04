<?php
// ════════════════════════════════════════════════════════════════
//  Testlauf gegen die oertliche Schnittstelle
// ════════════════════════════════════════════════════════════════
// Prueft api.php ueber echte HTTP-Anfragen — also den ganzen Weg: JSON
// hinein, Statuscode und JSON heraus. Alles gegen die Wegwerfdatenbank.
//
//   .\dev\start.ps1 -Neu
//   php dev/test-api.php --neu
//
// Seit Stufe 7 kennt der Server nur noch Konten. Deshalb faengt der Lauf
// da an, wo eine neue Aufstellung anfaengt: mit dem ersten Konto, und
// erst danach mit einer Gruppe.

$BASIS = getenv('HB_TEST_URL') ?: 'http://127.0.0.1:8123/api.php';

// Mit --neu wird die Testdatenbank vorher geleert. Der Lauf braucht das:
// das erste Konto laesst sich nur anlegen, solange es keines gibt, und
// genau das soll geprueft werden.
if (in_array('--neu', $argv ?? [], true)) {
    passthru(escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg(__DIR__ . '/db-neu.php'), $rc);
    if ($rc !== 0) exit($rc);
}

$gruen = 0; $rot = 0;

function abschnitt(string $t): void { echo "\n-- $t\n"; }

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
        fwrite(STDERR, "Keine Antwort von $BASIS - laeuft dev/start.ps1?\n");
        exit(1);
    }
    return ['status' => $status, 'body' => json_decode($antwort, true) ?? ['roh' => $antwort]];
}

function pruefe(string $was, bool $ok, string $zusatz = ''): bool {
    global $gruen, $rot;
    if ($ok) { $gruen++; echo "  ok    $was\n"; }
    else     { $rot++;   echo "  FEHL  $was" . ($zusatz ? "  -> $zusatz" : '') . "\n"; }
    return $ok;
}
function kurz(array $a): string {
    return $a['status'] . ' ' . mb_substr((string)($a['body']['message'] ?? ''), 0, 70);
}

$admin     = 'dennis';                 // muss zu ADMIN_USER passen
$adminPass = 'adminpasswort';
$code      = 'T' . substr((string)time(), -6) . rand(10, 99);
$gruppePw  = 'gruppenpasswort';

// ════════════════════════════════════════════════════════════════
//  Das erste Konto
// ════════════════════════════════════════════════════════════════
abschnitt('Das erste Konto');
$r = ruf('user_create', ['name' => 'irgendwer', 'neu' => 'egalegal']);
$frisch = $r['status'] === 403;
pruefe('ein fremder Name wird als erstes Konto abgelehnt (403)', $frisch,
       kurz($r) . ($r['status'] === 401 ? '  - Datenbank nicht leer, mit --neu starten' : ''));
if (!$frisch) { echo "\nAbbruch: der Lauf braucht eine leere Datenbank.\n  php dev/test-api.php --neu\n"; exit(1); }
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

// ════════════════════════════════════════════════════════════════
//  Die Gruppe
// ════════════════════════════════════════════════════════════════
abschnitt('Eine Gruppe anlegen');
$r = ruf('register', ['code' => $code, 'password' => $gruppePw]);
pruefe('ohne Anmeldung geht das nicht mehr (401)', $r['status'] === 401, kurz($r));
$r = ruf('register', ['code' => $code, 'password' => $gruppePw, 'token' => $tAdmin]);
pruefe('die Verwaltung legt an (201)', $r['status'] === 201, kurz($r));
$r = ruf('register', ['code' => $code, 'password' => $gruppePw, 'token' => $tAdmin]);
pruefe('derselbe Code wird abgelehnt (409)', $r['status'] === 409, kurz($r));
$r = ruf('register', ['code' => 'x', 'password' => $gruppePw, 'token' => $tAdmin]);
pruefe('ein zu kurzer Code wird abgelehnt (400)', $r['status'] === 400, kurz($r));

abschnitt('Der alte Zugang ist zu');
foreach ([['load', []], ['save_library', ['library' => []]],
          ['save_char', ['char_id' => 'x', 'char' => ['id' => 'x', 'name' => 'X']]],
          ['load_logs', []]] as $paar) {
    $r = ruf($paar[0], array_merge(['code' => $code, 'password' => $gruppePw], $paar[1]));
    pruefe($paar[0] . ' mit dem Gruppenpasswort wird abgewiesen (403)', $r['status'] === 403, kurz($r));
}
$r = ruf('dm_load', ['code' => $code, 'password' => $gruppePw, 'dm_password' => 'egal']);
pruefe('dm_load mit dem DM-Passwort ebenso (403)', $r['status'] === 403, kurz($r));
pruefe('und die Meldung sagt, was zu tun ist',
       strpos((string)($r['body']['message'] ?? ''), 'Konto') !== false,
       (string)($r['body']['message'] ?? ''));

abschnitt('Konten und Rollen');
$spieler = 'spieler' . rand(1000, 9999);
$zweiter = 'zweiter' . rand(1000, 9999);
$dm      = 'meister' . rand(1000, 9999);
$dm2     = 'zweitdm' . rand(1000, 9999);
$ids = [];
foreach ([$spieler, $zweiter, $dm, $dm2] as $n) {
    $r = ruf('user_create', ['token' => $tAdmin, 'name' => $n, 'neu' => 'einmalpasswort']);
    $ids[$n] = (int)($r['body']['id'] ?? 0);
}
pruefe('vier Konten angelegt', count(array_filter($ids)) === 4, json_encode($ids));
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $spieler, 'neu' => 'einmalpasswort']);
pruefe('derselbe Name wird abgelehnt (409)', $r['status'] === 409, kurz($r));
$r = ruf('user_create', ['token' => $tAdmin, 'name' => 'ab', 'neu' => 'einmalpasswort']);
pruefe('ein zu kurzer Name wird abgelehnt (400)', $r['status'] === 400, kurz($r));

foreach ([[$spieler, 'spieler'], [$zweiter, 'spieler'], [$dm, 'dm'], [$dm2, 'dm']] as $paar) {
    ruf('member_set', ['token' => $tAdmin, 'user_id' => $ids[$paar[0]],
                       'gruppe' => $code, 'rolle' => $paar[1]]);
}
$anmelden = function ($name, $pw) {
    $r = ruf('login', ['user' => $name, 'password' => $pw]);
    return (string)($r['body']['token'] ?? '');
};
$tSpieler = $anmelden($spieler, 'einmalpasswort');
$tZweiter = $anmelden($zweiter, 'einmalpasswort');
$tDm      = $anmelden($dm,      'einmalpasswort');
$tDm2     = $anmelden($dm2,     'einmalpasswort');
pruefe('alle vier koennen sich anmelden', $tSpieler && $tZweiter && $tDm && $tDm2);
$r = ruf('login', ['user' => $spieler, 'password' => 'einmalpasswort']);
pruefe('und muessen das Einmalpasswort wechseln',
       ($r['body']['user']['muss_wechseln'] ?? false) === true);
$r = ruf('me', ['token' => $tSpieler]);
pruefe('me nennt Gruppe und Rolle',
       (($r['body']['user']['gruppen'][0]['rolle'] ?? '') === 'spieler'),
       json_encode($r['body']['user']['gruppen'] ?? null));
$r = ruf('me', ['token' => $tAdmin]);
pruefe('die Verwaltung erfaehrt, welche Gruppen es gibt',
       in_array($code, $r['body']['user']['alle_gruppen'] ?? [], true),
       json_encode($r['body']['user']['alle_gruppen'] ?? null));
$r = ruf('user_list', ['token' => $tSpieler]);
pruefe('ein Spieler sieht die Kontenliste nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('user_list', ['token' => $tAdmin]);
pruefe('die Verwaltung schon (200)', $r['status'] === 200, kurz($r));
pruefe('Passwort-Hashes stehen nicht darin',
       !array_key_exists('pass_hash', ($r['body']['users'][0] ?? ['pass_hash' => 1])));

abschnitt('Passwort wechseln');
$r = ruf('password_change', ['token' => $tSpieler, 'alt' => 'falsch', 'neu' => 'meineigenes']);
pruefe('mit falschem alten Passwort geht nichts (401)', $r['status'] === 401, kurz($r));
$r = ruf('password_change', ['token' => $tSpieler, 'alt' => 'einmalpasswort', 'neu' => 'kurz']);
pruefe('ein zu kurzes neues Passwort wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('password_change', ['token' => $tSpieler, 'alt' => 'einmalpasswort', 'neu' => 'meineigenes']);
pruefe('mit dem richtigen alten geht es (200)', $r['status'] === 200, kurz($r));
$tSpieler = $anmelden($spieler, 'meineigenes');
pruefe('das neue Passwort gilt', $tSpieler !== '');
$r = ruf('login', ['user' => $spieler, 'password' => 'einmalpasswort']);
pruefe('das alte gilt nicht mehr (401)', $r['status'] === 401, kurz($r));

// ════════════════════════════════════════════════════════════════
//  Bogen, Gegenstaende, Bibliothek
// ════════════════════════════════════════════════════════════════
abschnitt('Charakter speichern und laden');
$held = ['id' => 'h1', 'name' => 'Armin', 'charClass' => 'Kämpfer', 'level' => 3,
         'hp' => 18, 'maxHp' => 24, 'tempHp' => 0, 'adventure' => 'strahd'];
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'char' => $held]);
pruefe('save_char speichert (200)', $r['status'] === 200, kurz($r));
$rev1 = (int)($r['body']['rev'] ?? -1);
$r = ruf('load', ['code' => $code, 'token' => $tDm]);
$geladen = $r['body']['chars'][0] ?? [];
pruefe('der Held kommt zurueck', ($geladen['name'] ?? '') === 'Armin');
pruefe('Umlaute ueberstehen den Weg', ($geladen['charClass'] ?? '') === 'Kämpfer',
       (string)($geladen['charClass'] ?? ''));
pruefe('das Inventar ist leer, nicht fehlend', ($geladen['inventory'] ?? null) === []);
pruefe('load liefert eine Abgleich-Kennung', !empty($r['body']['poll_token']));
$token = (string)$r['body']['poll_token'];

abschnitt('Der Hintergrundabgleich');
$r = ruf('poll', ['code' => $code, 'poll_token' => $token]);
pruefe('poll antwortet (200)', $r['status'] === 200, kurz($r));
pruefe('poll traegt die Trefferpunkte mit',
       (($r['body']['vitals']['h1']['hp'] ?? null) === 18), json_encode($r['body']['vitals'] ?? null));
$r = ruf('poll', ['code' => $code, 'poll_token' => 'falschefalschefalsche']);
pruefe('poll mit falscher Kennung wird abgelehnt (401)', $r['status'] === 401, kurz($r));
// Der Kern der Sparsamkeit: eine reine Trefferpunktaenderung darf bei
// niemandem einen vollen Ladevorgang ausloesen.
$held['hp'] = 7;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'char' => $held]);
$rev2 = (int)($r['body']['rev'] ?? -1);
pruefe('geaenderte Trefferpunkte zaehlen den Stand NICHT hoch', $rev2 === $rev1,
       "vorher $rev1, nachher $rev2");
$r = ruf('poll', ['code' => $code, 'poll_token' => $token]);
pruefe('poll zeigt die neuen Trefferpunkte', ($r['body']['vitals']['h1']['hp'] ?? null) === 7);
$held['level'] = 4;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'char' => $held]);
pruefe('eine andere Aenderung zaehlt den Stand hoch', (int)$r['body']['rev'] > $rev2);

abschnitt('Gegenstaende und Bibliothek');
$r = ruf('save_item', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1',
                       'item_id' => 'i1', 'item' => ['id' => 'i1', 'name' => 'Seil']]);
pruefe('save_item speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tDm]);
pruefe('der Gegenstand haengt am Helden',
       (($r['body']['chars'][0]['inventory'][0]['name'] ?? '') === 'Seil'));
$r = ruf('delete_item', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'item_id' => 'i1']);
pruefe('delete_item loescht (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_library', ['code' => $code, 'token' => $tDm,
                          'library' => ['_adventures' => [
                              ['id' => 'strahd',  'name' => 'Strahd'],
                              ['id' => 'eberron', 'name' => 'Eberron']]]]);
pruefe('save_library speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
pruefe('die Abenteuerliste kommt zurueck',
       (($r['body']['library']['_adventures'][0]['name'] ?? '') === 'Strahd'));

abschnitt('Die Sachen der Spielleitung');
$r = ruf('dm_load', ['code' => $code, 'token' => $tSpieler]);
pruefe('ein Spieler bekommt die DM-Bibliothek nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tDm]);
pruefe('die Spielleitung schon (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_save_library', ['code' => $code, 'token' => $tDm,
                             'dm_library' => ['heldNotizen' => ['h1' => 'Fluch am Finger']]]);
pruefe('dm_save_library speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tDm]);
pruefe('die Heldennotiz kommt zurueck',
       (($r['body']['dm_library']['heldNotizen']['h1'] ?? '') === 'Fluch am Finger'));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
pruefe('ein Spieler bekommt sie nie zu sehen', !array_key_exists('dm_library', $r['body']));
$r = ruf('dm_save_enemy', ['code' => $code, 'token' => $tDm,
                           'enemy_id' => 'g1', 'enemy' => ['id' => 'g1', 'name' => 'Wolf', 'ac' => 13]]);
pruefe('dm_save_enemy speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load_enemies', ['code' => $code, 'token' => $tDm]);
pruefe('der Gegner kommt zurueck', (($r['body']['enemies'][0]['name'] ?? '') === 'Wolf'));
$r = ruf('dm_save_chronik', ['code' => $code, 'token' => $tDm, 'chronik' => ['uhren' => ['strahd' => 9]]]);
pruefe('dm_save_chronik speichert (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load_chronik', ['code' => $code, 'token' => $tDm]);
pruefe('die Uhr steht auf 9', (($r['body']['chronik']['uhren']['strahd'] ?? 0) === 9));

// ════════════════════════════════════════════════════════════════
//  Besitz
// ════════════════════════════════════════════════════════════════
abschnitt('Ein Bogen ohne Besitzer');
// Seit Stufe 3 gehoert jeder neu angelegte Bogen dem, der ihn anlegt —
// h1 also der Spielleitung. Herrenlos sind nur noch die Boegen aus der
// Zeit davor, und den Fall stellen wir hier absichtlich her.
ruf('char_owner_set', ['code' => $code, 'token' => $tAdmin, 'char_id' => 'h1', 'owner' => null]);
$r = ruf('load', ['code' => $code, 'token' => $tDm]);
pruefe('load nennt die Besitzer', array_key_exists('owners', $r['body']));
pruefe('h1 hat noch keinen', !isset($r['body']['owners']['h1']),
       json_encode($r['body']['owners'] ?? null));
$held['hp'] = 5;
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 'h1', 'char' => $held]);
pruefe('ein herrenloser Bogen bleibt fuer jeden aenderbar (200)', $r['status'] === 200, kurz($r));

abschnitt('Ein Bogen mit Besitzer');
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tSpieler,
                            'char_id' => 'h1', 'owner' => $ids[$spieler]]);
pruefe('ein Spieler nimmt sich keinen Bogen (403)', $r['status'] === 403, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'owner' => 999999]);
pruefe('nicht an jemanden ausserhalb der Gruppe (404)', $r['status'] === 404, kurz($r));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm,
                            'char_id' => 'h1', 'owner' => $ids[$spieler]]);
pruefe('die Spielleitung ordnet zu (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
pruefe('load nennt den Besitzer', (($r['body']['owners']['h1'] ?? 0) === $ids[$spieler]));
$held['hp'] = 4;
$r = ruf('save_char', ['code' => $code, 'token' => $tSpieler, 'char_id' => 'h1', 'char' => $held]);
pruefe('der Besitzer darf speichern (200)', $r['status'] === 200, kurz($r));
$held['hp'] = 99;
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'h1', 'char' => $held]);
pruefe('ein anderer Spieler nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tSpieler]);
$h1 = null; foreach ($r['body']['chars'] as $c) if ($c['id'] === 'h1') $h1 = $c;
pruefe('und es steht auch nichts Fremdes drin', ($h1['hp'] ?? null) === 4, json_encode($h1['hp'] ?? null));
$r = ruf('save_item', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'h1',
                       'item_id' => 'x1', 'item' => ['id' => 'x1', 'name' => 'Untergeschoben']]);
pruefe('auch kein Gegenstand im fremden Inventar (403)', $r['status'] === 403, kurz($r));
$r = ruf('delete_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'h1']);
pruefe('und geloescht wird er auch nicht (403)', $r['status'] === 403, kurz($r));
$held['hp'] = 4;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'char' => $held]);
pruefe('die Spielleitung darf trotzdem (200)', $r['status'] === 200, kurz($r));

abschnitt('Wer anlegt, besitzt');
$neu = ['id' => 'n1', 'name' => 'Eigener', 'charClass' => 'Magier', 'level' => 1,
        'hp' => 6, 'maxHp' => 6, 'adventure' => 'eberron'];
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'n1', 'char' => $neu]);
pruefe('ein neuer Bogen wird angelegt (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tZweiter]);
pruefe('und gehoert dem, der ihn angelegt hat',
       (($r['body']['owners']['n1'] ?? 0) === $ids[$zweiter]), json_encode($r['body']['owners'] ?? null));

// ════════════════════════════════════════════════════════════════
//  Spielleitung je Abenteuer
// ════════════════════════════════════════════════════════════════
abschnitt('Solange niemand eingetragen ist');
$r = ruf('load', ['code' => $code, 'token' => $tDm]);
pruefe('load nennt die Spielleitungen', array_key_exists('adv_dms', $r['body']));
pruefe('und die Liste ist leer', empty((array)$r['body']['adv_dms']));
$r = ruf('save_char', ['code' => $code, 'token' => $tDm2, 'char_id' => 'h1', 'char' => $held]);
pruefe('jede Spielleitung darf ueberall (200)', $r['status'] === 200, kurz($r));

abschnitt('Eingetragen wird eingegrenzt');
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'user_ids' => [$ids[$dm]]]);
pruefe('eine Spielleitung traegt sich nicht selbst ein (403)', $r['status'] === 403, kurz($r));
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'strahd', 'user_ids' => [999999]]);
pruefe('ein Fremder wird abgelehnt (404)', $r['status'] === 404, kurz($r));
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'strahd', 'user_ids' => [$ids[$dm]]]);
pruefe('die Verwaltung traegt ein (200)', $r['status'] === 200, kurz($r));
pruefe('die Antwort traegt die neue Karte',
       (($r['body']['adv_dms']['strahd'][0] ?? 0) === $ids[$dm]));
$held['hp'] = 3;
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'h1', 'char' => $held]);
pruefe('die eingetragene Spielleitung darf weiter (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tDm2, 'char_id' => 'h1', 'char' => $held]);
pruefe('die andere nicht mehr (403)', $r['status'] === 403, kurz($r));
pruefe('und die Meldung nennt den Grund',
       strpos((string)($r['body']['message'] ?? ''), 'Abenteuer') !== false,
       (string)($r['body']['message'] ?? ''));
$r = ruf('char_owner_set', ['code' => $code, 'token' => $tDm2, 'char_id' => 'h1', 'owner' => $ids[$zweiter]]);
pruefe('sie ordnet dort auch nichts zu (403)', $r['status'] === 403, kurz($r));

abschnitt('DM hier, Spieler nebenan');
$r = ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin,
                        'adv_id' => 'eberron', 'user_ids' => [$ids[$zweiter]]]);
pruefe('ein Spieler der Gruppe darf Spielleitung eines Abenteuers werden (200)',
       $r['status'] === 200, kurz($r));
$neu['hp'] = 4;
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'n1', 'char' => $neu]);
pruefe('in seinem Abenteuer darf er alles (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tZweiter]);
pruefe('und kommt an die Sachen der Spielleitung (200)', $r['status'] === 200, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tZweiter, 'char_id' => 'h1', 'char' => $held]);
pruefe('nebenan bleibt er Spieler (403)', $r['status'] === 403, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'n1', 'char' => $neu]);
pruefe('und die Gruppenspielleitung ist in Eberron aussen vor (403)', $r['status'] === 403, kurz($r));
ruf('adv_dm_set', ['code' => $code, 'token' => $tAdmin, 'adv_id' => 'eberron', 'user_ids' => []]);
$r = ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'n1', 'char' => $neu]);
pruefe('ausgetragen gilt wieder die Rolle in der Gruppe (200)', $r['status'] === 200, kurz($r));
$r = ruf('dm_load', ['code' => $code, 'token' => $tZweiter]);
pruefe('und der Spieler ist wieder nur Spieler (403)', $r['status'] === 403, kurz($r));

abschnitt('Die Mitgliederliste');
$r = ruf('member_list', ['code' => $code, 'token' => $tSpieler]);
pruefe('ein Spieler bekommt sie nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('member_list', ['code' => $code, 'token' => $tDm]);
pruefe('die Spielleitung schon (200)', $r['status'] === 200, kurz($r));
pruefe('sie enthaelt die vier der Gruppe', count($r['body']['mitglieder'] ?? []) === 4,
       (string)count($r['body']['mitglieder'] ?? []));

// ════════════════════════════════════════════════════════════════
//  Das Abenteuerlog
// ════════════════════════════════════════════════════════════════
abschnitt('Wer geschrieben hat, steht als Kennung darin');
ruf('save_char', ['code' => $code, 'token' => $tDm, 'char_id' => 'd1', 'char' => [
    'id' => 'd1', 'name' => 'Strahd selbst', 'charClass' => 'Magier', 'level' => 9,
    'hp' => 60, 'maxHp' => 60, 'adventure' => 'strahd', 'dmOnly' => true]]);
ruf('save_log', ['code' => $code, 'token' => $tSpieler, 'entry' =>
    ['char_id' => 'h1', 'char_name' => 'Armin', 'tab' => 'attribute',
     'action' => 'Vom Spieler geschrieben', 'adv_id' => 'strahd']]);
ruf('save_log', ['code' => $code, 'token' => $tDm, 'entry' =>
    ['char_id' => 'd1', 'char_name' => 'Strahd selbst', 'tab' => 'notizen',
     'action' => 'Geheime Zeile zum DM-Helden', 'adv_id' => 'strahd']]);
ruf('save_log', ['code' => $code, 'token' => $tDm2, 'entry' =>
    ['char_id' => 'n1', 'char_name' => 'Eigener', 'tab' => 'waffen',
     'action' => 'Zeile aus Eberron', 'adv_id' => 'eberron']]);

$r = ruf('my_data', ['token' => $tSpieler]);
pruefe('my_data antwortet (200)', $r['status'] === 200, kurz($r));
pruefe('es kennt das eigene Konto', (($r['body']['konto']['name'] ?? '') === $spieler));
$eigene = array_column($r['body']['log'] ?? [], 'action');
pruefe('die eigene Zeile steht darin', in_array('Vom Spieler geschrieben', $eigene, true));
pruefe('fremde Zeilen nicht', !in_array('Zeile aus Eberron', $eigene, true));
$r = ruf('my_data', []);
pruefe('ohne Anmeldung gibt es keine Auskunft (401)', $r['status'] === 401, kurz($r));

abschnitt('Wer welche Zeilen zu sehen bekommt');
$holen = function ($daten) use ($code) {
    $r = ruf('load_logs', array_merge(['code' => $code, 'limit' => 100], $daten));
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
pruefe('die andere Spielleitung sieht Strahd nicht',
       !in_array('Geheime Zeile zum DM-Helden', $alsDm2, true), implode(' | ', $alsDm2));
$alsAdmin = $holen(['token' => $tAdmin]);
pruefe('die Verwaltung sieht beides',
       in_array('Geheime Zeile zum DM-Helden', $alsAdmin, true)
       && in_array('Zeile aus Eberron', $alsAdmin, true));

abschnitt('Aufbewahrung');
$r = ruf('load', ['code' => $code, 'token' => $tAdmin]);
pruefe('load nennt die Frist', (($r['body']['log_tage'] ?? 0) === 180));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tSpieler, 'tage' => 30]);
pruefe('ein Spieler stellt sie nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tAdmin, 'tage' => 3]);
pruefe('unter sieben Tagen wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('log_frist_set', ['code' => $code, 'token' => $tAdmin, 'tage' => 30]);
pruefe('die Verwaltung stellt sie (200)', $r['status'] === 200, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tAdmin]);
pruefe('und load nennt die neue', (($r['body']['log_tage'] ?? 0) === 30));

// ════════════════════════════════════════════════════════════════
//  Konto entfernen
// ════════════════════════════════════════════════════════════════
abschnitt('Ein Konto entfernen');
$weg = 'wegdamit' . rand(1000, 9999);
$r = ruf('user_create', ['token' => $tAdmin, 'name' => $weg, 'neu' => 'einmalpasswort']);
$idWeg = (int)$r['body']['id'];
ruf('member_set', ['token' => $tAdmin, 'user_id' => $idWeg, 'gruppe' => $code, 'rolle' => 'spieler']);
$tWeg = $anmelden($weg, 'einmalpasswort');
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
$eigeneId = 0;
foreach ($r['body']['users'] as $x) if ($x['name'] === $admin) $eigeneId = (int)$x['id'];
$r = ruf('user_delete', ['token' => $tAdmin, 'user_id' => $eigeneId]);
pruefe('das eigene Konto bleibt (400)', $r['status'] === 400, kurz($r));
$r = ruf('user_delete', ['token' => $tAdmin, 'user_id' => $idWeg]);
pruefe('die Verwaltung loescht (200)', $r['status'] === 200, kurz($r));
$r = ruf('me', ['token' => $tWeg]);
pruefe('die Anmeldung ist damit weg (401)', $r['status'] === 401, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => $tAdmin]);
pruefe('der Bogen ist noch da',
       in_array('Verwaister Bogen', array_column($r['body']['chars'], 'name'), true));
pruefe('und gehoert jetzt niemandem', !isset($r['body']['owners']['w1']));
$r = ruf('load_logs', ['code' => $code, 'token' => $tAdmin, 'limit' => 100]);
$zeile = null;
foreach ($r['body']['logs'] as $l) if ($l['action'] === 'Zeile eines spaeter geloeschten Kontos') $zeile = $l;
pruefe('die Logzeile steht noch', $zeile !== null);
pruefe('ohne Kennung', $zeile !== null && $zeile['user_id'] === null);
pruefe('mit ihrem Inhalt', $zeile !== null && $zeile['char_name'] === 'Verwaister Bogen');

abschnitt('Abmelden und Abwehr');
$r = ruf('logout', ['token' => $tZweiter]);
pruefe('logout antwortet (200)', $r['status'] === 200, kurz($r));
$r = ruf('me', ['token' => $tZweiter]);
pruefe('danach gilt die Kennung nicht mehr (401)', $r['status'] === 401, kurz($r));
$r = ruf('gibtsnicht', ['code' => $code, 'token' => $tAdmin]);
pruefe('unbekannte Aktion wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('save_char', ['code' => $code, 'token' => $tAdmin, 'char_id' => 'h1', 'char' => 'kein Objekt']);
pruefe('ein Charakter im falschen Format wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('load', ['code' => 'GIBTSNICHT', 'token' => $tAdmin]);
pruefe('eine unbekannte Gruppe wird gemeldet (404)', $r['status'] === 404, kurz($r));
$r = ruf('load', ['code' => $code, 'token' => str_repeat('b', 64)]);
pruefe('eine erfundene Kennung wird abgelehnt (401)', $r['status'] === 401, kurz($r));

echo "\n" . str_repeat('=', 52) . "\n";
echo $rot === 0 ? "Alle $gruen Pruefungen bestanden.\n" : "$gruen bestanden, $rot fehlgeschlagen.\n";
exit($rot === 0 ? 0 : 1);
