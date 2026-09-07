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

// ════════════════════════════════════════════════════════════════
//  Der Kampf auf dem Server
// ════════════════════════════════════════════════════════════════
// Die Frage, um die es hier geht, ist nicht "kommt er an" — sondern
// "was sieht ein Spieler davon". Ein Kampf, der die Trefferpunkte der
// Gegner ausliefert, nimmt der Runde das Herausfinden.
abschnitt('Der Kampf auf dem Server');

// $dm leitet Strahd (weiter oben eingetragen), $spieler nicht.
$kampf = [
    'aktiv' => true, 'phase' => 'kampf', 'name' => 'Am Tor', 'runde' => 2, 'zug' => 1,
    'teilnehmer' => [
        ['id' => 'held-h1', 'art' => 'held', 'charId' => 'h1', 'ini' => 17,
         'zustaende' => ['Gepackt'], 'erschoepfung' => 1, 'vorteil' => true, 'nachteil' => false],
        ['id' => 'g1', 'art' => 'gegner', 'name' => 'Wolf 1', 'ac' => 13,
         'hp' => 4, 'hpMax' => 11, 'tempHp' => 0, 'ini' => 12,
         'zustaende' => [], 'erschoepfung' => 0, 'notiz' => 'greift zuerst den Magier an'],
    ],
    'log' => [
        ['art' => 'start', 'r' => 1, 'wer' => 'Am Tor'],
        ['art' => 'schaden', 'r' => 2, 'wer' => 'Wolf 1', 'wert' => 7, 'von' => 11, 'auf' => 4],
    ],
];

$r = ruf('kampf_setzen', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd', 'kampf' => $kampf]);
pruefe('ein Spieler schreibt keinen Kampf (403)', $r['status'] === 403, kurz($r));
$r = ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => $kampf]);
pruefe('die Spielleitung des Abenteuers schreibt ihn (200)', $r['status'] === 200, kurz($r));
pruefe('und bekommt einen Stand zurueck', (int)($r['body']['stand'] ?? 0) >= 1);
$standEins = (int)($r['body']['stand'] ?? 0);
$r = ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => $kampf]);
pruefe('jede Aenderung zaehlt den Stand hoch', (int)($r['body']['stand'] ?? 0) === $standEins + 1);
$stand = (int)($r['body']['stand'] ?? 0);
$r = ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => 'kein Objekt']);
pruefe('ein Kampf im falschen Format wird abgelehnt (400)', $r['status'] === 400, kurz($r));
$r = ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'kampf' => $kampf]);
pruefe('ohne Abenteuer geht es nicht (400)', $r['status'] === 400, kurz($r));

abschnitt('Die Spielleitung sieht alles');
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd']);
$k = $r['body']['kampf'] ?? [];
$gegner = null;
foreach ((array)($k['teilnehmer'] ?? []) as $t) if (($t['art'] ?? '') === 'gegner') $gegner = $t;
pruefe('sie liest den Kampf (200)', $r['status'] === 200, kurz($r));
pruefe('und wird als Spielleitung gefuehrt', ($r['body']['dm'] ?? false) === true);
pruefe('die Trefferpunkte des Gegners stehen da', ($gegner['hp'] ?? null) === 4);
pruefe('die Ruestungsklasse auch', ($gegner['ac'] ?? null) === 13);
pruefe('ihre Notiz ebenso', ($gegner['notiz'] ?? '') !== '');
pruefe('und das Protokoll ist mit dabei', count((array)($k['log'] ?? [])) === 2);

abschnitt('Der Spieler sieht den Zustand, nicht die Zahl');
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd']);
$k = $r['body']['kampf'] ?? [];
$gegner = null; $held = null;
foreach ((array)($k['teilnehmer'] ?? []) as $t) {
    if (($t['art'] ?? '') === 'gegner') $gegner = $t; else $held = $t;
}
pruefe('er liest den Kampf (200)', $r['status'] === 200, kurz($r));
pruefe('aber nicht als Spielleitung', ($r['body']['dm'] ?? true) === false);
pruefe('Runde und Zug stehen da', ($k['runde'] ?? 0) === 2 && ($k['zug'] ?? -1) === 1);
pruefe('der Gegner steht mit Namen da', ($gegner['name'] ?? '') === 'Wolf 1');
pruefe('seine Trefferpunkte nicht', !array_key_exists('hp', (array)$gegner));
pruefe('sein Maximum auch nicht', !array_key_exists('hpMax', (array)$gegner));
pruefe('seine Ruestungsklasse ebenso wenig', !array_key_exists('ac', (array)$gegner));
pruefe('die Notiz der Spielleitung erst recht nicht', !array_key_exists('notiz', (array)$gegner));
pruefe('stattdessen steht sein Zustand da', ($gegner['zustand'] ?? '') === 'Schwer verwundet',
       json_encode($gegner, JSON_UNESCAPED_UNICODE));
pruefe('mit einem groben Balken', ($gegner['balken'] ?? -1) === 0.37);
pruefe('das Protokoll bleibt draussen', !array_key_exists('log', (array)$k));
pruefe('der Held steht mit seiner Kennung da', ($held['charId'] ?? '') === 'h1');
pruefe('seine Zustaende sind sichtbar', ($held['zustaende'][0] ?? '') === 'Gepackt');
pruefe('die Initiative auch', ($held['ini'] ?? 0) === 17);
pruefe('und das Abenteuer sagt, ob Zahlen offen sind', ($k['hpOffen'] ?? null) === true);

abschnitt('Verdeckte Trefferpunkte gelten auch hier');
$lib = ruf('load', ['code' => $code, 'token' => $tDm])['body']['library'] ?? [];
$advs = $lib['_adventures'] ?? [];
foreach ($advs as $i => $a) if (($a['id'] ?? '') === 'strahd') $advs[$i]['hpVerdeckt'] = true;
$lib['_adventures'] = $advs;
$r = ruf('save_library', ['code' => $code, 'token' => $tDm, 'library' => $lib]);
pruefe('das Abenteuer wird auf verdeckt gestellt (200)', $r['status'] === 200, kurz($r));
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd']);
pruefe('der Spieler erfaehrt es', (($r['body']['kampf']['hpOffen'] ?? true) === false));
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd']);
pruefe('die Spielleitung sieht weiter die Zahlen',
       ($r['body']['kampf']['teilnehmer'][1]['hp'] ?? null) === 4);

abschnitt('Der Stand spart die Antwort');
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd', 'seit' => $stand]);
pruefe('wer schon den neuesten Stand hat, bekommt nur die Zahl',
       ($r['body']['stand'] ?? 0) === $stand && !array_key_exists('kampf', $r['body']));
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd', 'seit' => $stand - 1]);
pruefe('wer hinterher ist, bekommt den Kampf', isset($r['body']['kampf']));

abschnitt('Nebenan und danach');
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'eberron']);
pruefe('ein Abenteuer ohne Kampf antwortet mit Stand 0',
       ($r['body']['stand'] ?? -1) === 0
       && array_key_exists('kampf', $r['body']) && $r['body']['kampf'] === null);
$r = ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => null]);
pruefe('die Spielleitung raeumt den Kampf ab (200)', $r['status'] === 200, kurz($r));
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd']);
pruefe('danach ist nichts mehr zu sehen',
       array_key_exists('kampf', $r['body']) && $r['body']['kampf'] === null);
$r = ruf('kampf_stand', ['code' => $code, 'adv_id' => 'strahd']);
pruefe('ohne Kennung geht gar nichts (403)', $r['status'] === 403, kurz($r));

abschnitt('Der Spieler sagt an');
// Ein frischer Kampf, in dem h1 steht. h1 gehoert dem Spieler.
$kampf2 = [
    'aktiv' => true, 'phase' => 'kampf', 'name' => 'Im Hof', 'runde' => 1, 'zug' => 0,
    'teilnehmer' => [
        ['id' => 'held-h1', 'art' => 'held', 'charId' => 'h1', 'ini' => 15,
         'zustaende' => [], 'erschoepfung' => 0],
        ['id' => 'g9', 'art' => 'gegner', 'name' => 'Ork', 'ac' => 14,
         'hp' => 15, 'hpMax' => 15, 'ini' => 9, 'zustaende' => [], 'erschoepfung' => 0],
    ],
];
ruf('char_owner_set', ['code' => $code, 'token' => $tAdmin, 'char_id' => 'h1', 'owner' => $ids[$spieler]]);
ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => $kampf2]);

$ansage = ['art' => 'zauber', 'was' => 'Feuerball', 'grad' => 4,
           'ziele' => ['Ork'], 'zielIds' => ['g9'], 'text' => 'Ich zünde den Heuhaufen an.'];
$r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd',
                           'char_id' => 'h1', 'ansage' => $ansage]);
pruefe('der Besitzer sagt an (200)', $r['status'] === 200, kurz($r));
pruefe('und bekommt sie zurueck', ($r['body']['ansage']['was'] ?? '') === 'Feuerball');
pruefe('mit eigener Kennung', strlen((string)($r['body']['ansage']['id'] ?? '')) > 6);
pruefe('die Ziele stehen mit Namen drin', ($r['body']['ansage']['ziele'][0] ?? '') === 'Ork');
pruefe('und mit Kennung, damit die Spielleitung sie nicht sucht',
       ($r['body']['ansage']['zielIds'][0] ?? '') === 'g9');

$r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tZweiter, 'adv_id' => 'strahd',
                           'char_id' => 'h1', 'ansage' => $ansage]);
pruefe('ein anderer Spieler nicht (403)', $r['status'] === 403, kurz($r));
$r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd',
                           'char_id' => 'n1', 'ansage' => $ansage]);
pruefe('und auch nicht mit einem fremden Bogen (403)', $r['status'] === 403, kurz($r));
$r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'eberron',
                           'char_id' => 'h1', 'ansage' => $ansage]);
pruefe('ohne laufenden Kampf gibt es nichts anzusagen (404)', $r['status'] === 404, kurz($r));
$r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd',
                           'char_id' => 'h1', 'ansage' => ['art' => 'frei', 'text' => '']]);
pruefe('eine leere Ansage wird abgelehnt (400)', $r['status'] === 400, kurz($r));

// Was geschickt wird, ist nicht, was gespeichert wird.
$r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd',
    'char_id' => 'h1', 'ansage' => ['art' => 'unfug', 'was' => str_repeat('x', 200),
                                    'grad' => 99, 'text' => 'kurz', 'runde' => 99,
                                    'hp' => 1, 'ziele' => array_fill(0, 30, 'z'),
                                    'zielIds' => array_fill(0, 30, 'q')]]);
$a = $r['body']['ansage'] ?? [];
pruefe('eine erfundene Art wird zu "frei"', ($a['art'] ?? '') === 'frei');
pruefe('ein zu langer Name wird gekuerzt', mb_strlen((string)($a['was'] ?? '')) === 80);
pruefe('ein unmoeglicher Grad wird gedeckelt', ($a['grad'] ?? -1) === 9);
pruefe('zu viele Ziele werden gekappt', count((array)($a['ziele'] ?? [])) === 12);
pruefe('ihre Kennungen ebenso', count((array)($a['zielIds'] ?? [])) === 12);
pruefe('fremde Felder kommen gar nicht erst mit',
       !array_key_exists('hp', $a) && !array_key_exists('runde', $a));

abschnitt('Die Ansagen ueberleben den Spiegel');
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd']);
pruefe('die Spielleitung sieht beide Ansagen',
       count((array)($r['body']['kampf']['ansagen'] ?? [])) === 2);
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'nur' => 'ansagen']);
pruefe('und kann sie einzeln holen (200)', $r['status'] === 200, kurz($r));
pruefe('ohne den ganzen Kampf', !array_key_exists('kampf', $r['body'])
       && count((array)($r['body']['ansagen'] ?? [])) === 2);
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd']);
pruefe('der Spieler sieht sie auch',
       count((array)($r['body']['kampf']['ansagen'] ?? [])) === 2);

// Der Spiegel der Spielleitung schickt keine Ansagen mit — sie muessen
// trotzdem stehen bleiben.
$kampf2['runde'] = 2;
ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => $kampf2]);
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd']);
pruefe('nach dem naechsten Spiegeln stehen sie noch da',
       count((array)($r['body']['kampf']['ansagen'] ?? [])) === 2);
pruefe('und die Runde ist mitgezogen', ($r['body']['kampf']['runde'] ?? 0) === 2);

// Wer sie mitschickt, will sie aendern.
$kampf2['ansagen'] = [];
ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => $kampf2]);
$r = ruf('kampf_stand', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd']);
pruefe('mitgeschickt raeumt sie ab', count((array)($r['body']['kampf']['ansagen'] ?? [])) === 0);

// Seit dem Zugfenster steht im Bogen mehr als Waffe und Zauber: ein
// Trank aus dem Inventar und ein Merkmal des Charakters. Die Liste der
// erlaubten Arten muss beides durchlassen, sonst kommt beim
// Spielleiter nur noch „Nur beschreiben“ an.
foreach ([['gegenstand', 'Trank der Heilung'], ['merkmal', 'Zweiter Atem']] as $paar) {
    $r = ruf('kampf_eintrag', ['code' => $code, 'token' => $tSpieler, 'adv_id' => 'strahd',
        'char_id' => 'h1',
        'ansage' => ['art' => $paar[0], 'was' => $paar[1], 'zielIds' => ['g9']]]);
    pruefe('ein Zug der Art "' . $paar[0] . '" laesst sich ansagen (200)',
           $r['status'] === 200, kurz($r));
    pruefe('und behaelt seine Art', ($r['body']['ansage']['art'] ?? '') === $paar[0],
           (string)($r['body']['ansage']['art'] ?? ''));
    pruefe('und seinen Namen', ($r['body']['ansage']['was'] ?? '') === $paar[1]);
}

ruf('kampf_setzen', ['code' => $code, 'token' => $tDm, 'adv_id' => 'strahd', 'kampf' => null]);

// Das Abenteuer wieder offen stellen, damit die folgenden Pruefungen
// dieselbe Ausgangslage haben wie bisher.
foreach ($advs as $i => $a) if (($a['id'] ?? '') === 'strahd') $advs[$i]['hpVerdeckt'] = false;
$lib['_adventures'] = $advs;
ruf('save_library', ['code' => $code, 'token' => $tDm, 'library' => $lib]);

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
