<?php
// ════════════════════════════════════════════════════════════════
//  Heldenbuch API  v3.1 — Granulare Speicherung
// ════════════════════════════════════════════════════════════════
require_once __DIR__ . '/config.php';
define('MAX_CHAR_BYTES',  500000);   // 500KB pro Char (ohne Items)
define('MAX_ITEM_BYTES',  2000000);  // 2MB pro Item (Bild!)
define('MAX_LIB_BYTES',   2000000);  // 2MB Bibliothek
define('MAX_ENEMY_BYTES', 2000000);  // 2MB pro Gegner (Bild!)
define('RATE_LIMIT_ATTEMPTS',   1000);
define('RATE_LIMIT_WINDOW_SEC', 300);

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === ALLOWED_ORIGIN) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { respond(405, 'Nur POST-Anfragen erlaubt.'); }

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) respond(400, 'Ungültiges JSON.');

$action = $body['action']      ?? '';
$code   = trim($body['code']   ?? '');
$pass   = $body['password']    ?? '';
$dmPass = $body['dm_password'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
         PDO::ATTR_EMULATE_PREPARES => false]
    );
} catch (PDOException $e) { respond(500, 'Datenbankverbindung fehlgeschlagen.'); }

// ── Schema ──────────────────────────────────────────────────────
// hb_enemies: die Gegner der Spielleitung liegen zeilenweise wie
// hb_items, nicht als Eintrag in der DM-Bibliothek. Die wird als ein
// Stueck gespeichert — jede Aenderung an einem Goblin lüde die ganze
// Sammlung erneut hoch, und mit Bildern waere ihre 2-MB-Grenze nach rund
// dreissig Monsterportraets erreicht. Zeilenweise gilt das Limit je
// Gegner statt je Sammlung.
$pdo->exec("
    CREATE TABLE IF NOT EXISTS hb_sessions (
        code            VARCHAR(20)  NOT NULL PRIMARY KEY,
        password_hash   VARCHAR(255) NOT NULL,
        library_json    LONGTEXT,
        dm_pass_hash    VARCHAR(255),
        dm_library_json LONGTEXT,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_chars (
        id           INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20) NOT NULL,
        char_id      VARCHAR(50) NOT NULL,
        char_json    LONGTEXT    NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_sc (session_code, char_id),
        CONSTRAINT fk_hbc_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_items (
        id           INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20) NOT NULL,
        char_id      VARCHAR(50) NOT NULL,
        item_id      VARCHAR(50) NOT NULL,
        item_json    LONGTEXT    NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_sci (session_code, char_id, item_id),
        CONSTRAINT fk_hbi_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_enemies (
        id           INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20) NOT NULL,
        enemy_id     VARCHAR(50) NOT NULL,
        enemy_json   LONGTEXT    NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_se (session_code, enemy_id),
        CONSTRAINT fk_hbe_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_rate_limits (
        ip           VARCHAR(45) NOT NULL PRIMARY KEY,
        attempts     SMALLINT    NOT NULL DEFAULT 1,
        window_start DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS hb_logs (
        id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20)  NOT NULL,
        char_id      VARCHAR(50),
        char_name    VARCHAR(100),
        tab          VARCHAR(30),
        action       VARCHAR(255) NOT NULL,
        details      TEXT,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_session_log (session_code, created_at),
        CONSTRAINT fk_hbl_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// Legacy-Migration: alte chars_json Spalte hinzufügen falls nicht da
try { $pdo->exec("ALTER TABLE hb_sessions ADD COLUMN chars_json LONGTEXT"); } catch (PDOException $e) {}

// ── Hilfsfunktionen ─────────────────────────────────────────────
function checkRateLimit(PDO $pdo): void {
    $ip   = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $stmt = $pdo->prepare("SELECT attempts, window_start FROM hb_rate_limits WHERE ip = ?");
    $stmt->execute([$ip]);
    $row = $stmt->fetch();
    if ($row) {
        $age = time() - strtotime($row['window_start']);
        if ($age > RATE_LIMIT_WINDOW_SEC)
            $pdo->prepare("UPDATE hb_rate_limits SET attempts=1, window_start=NOW() WHERE ip=?")->execute([$ip]);
        elseif ((int)$row['attempts'] >= RATE_LIMIT_ATTEMPTS)
            respond(429, "Zu viele Anfragen. Bitte warte " . (int)ceil((RATE_LIMIT_WINDOW_SEC-$age)/60) . " Minute(n).");
        else
            $pdo->prepare("UPDATE hb_rate_limits SET attempts=attempts+1 WHERE ip=?")->execute([$ip]);
    } else {
        $pdo->prepare("INSERT INTO hb_rate_limits (ip) VALUES (?)")->execute([$ip]);
    }
}
function validateCode(string $c): bool { $l=strlen($c); return $l>=3&&$l<=20&&preg_match('/^[A-Za-z0-9_\-]+$/',$c); }
function validatePassword(string $p): bool { $l=strlen($p); return $l>=6&&$l<=128; }
function respond(int $status, string $message, array $extra=[]): never {
    http_response_code($status);
    echo json_encode(array_merge(['ok'=>$status<400,'message'=>$message],$extra), JSON_UNESCAPED_UNICODE);
    exit;
}
function verifySession(PDO $pdo, string $code, string $pass): array {
    $stmt = $pdo->prepare("SELECT password_hash, library_json, dm_pass_hash, dm_library_json, chars_json FROM hb_sessions WHERE code=?");
    $stmt->execute([$code]);
    $row  = $stmt->fetch();
    $hash = $row['password_hash'] ?? '$2y$10$invalidhashpadding000000000000000000000000000000000000';
    if (!$row || !password_verify($pass, $hash)) respond(401, 'Code oder Passwort falsch.');
    return $row;
}
function verifyDmSession(PDO $pdo, string $code, string $pass, string $dmPass): array {
    $row = verifySession($pdo, $code, $pass);
    if (!($row['dm_pass_hash']??null)) respond(403, 'Kein DM-Passwort gesetzt.');
    if (!password_verify($dmPass, $row['dm_pass_hash'])) respond(401, 'DM-Passwort falsch.');
    return $row;
}

// Lädt alle Chars + Items, migriert Legacy-Daten einmalig
function loadAll(PDO $pdo, string $code, array $sessionRow): array {
    // 1. Check ob hb_chars leer — dann von chars_json migrieren
    $cnt = (int)$pdo->prepare("SELECT COUNT(*) FROM hb_chars WHERE session_code=?")->execute([$code]) && 1;
    $stmt = $pdo->prepare("SELECT COUNT(*) as n FROM hb_chars WHERE session_code=?");
    $stmt->execute([$code]);
    $n = (int)($stmt->fetch()['n'] ?? 0);

    if ($n === 0 && !empty($sessionRow['chars_json'])) {
        $oldChars = json_decode($sessionRow['chars_json'], true) ?? [];
        if (!empty($oldChars)) {
            $insC = $pdo->prepare("INSERT IGNORE INTO hb_chars (session_code,char_id,char_json) VALUES(?,?,?)");
            $insI = $pdo->prepare("INSERT IGNORE INTO hb_items (session_code,char_id,item_id,item_json) VALUES(?,?,?,?)");
            foreach ($oldChars as $c) {
                if (empty($c['id'])) continue;
                $inv = $c['inventory'] ?? [];
                unset($c['inventory']);
                $insC->execute([$code, $c['id'], json_encode($c, JSON_UNESCAPED_UNICODE)]);
                foreach ($inv as $item) {
                    if (empty($item['id'])) continue;
                    $insI->execute([$code, $c['id'], $item['id'], json_encode($item, JSON_UNESCAPED_UNICODE)]);
                }
            }
        }
    }

    // 2. Lade Chars
    $stmt = $pdo->prepare("SELECT char_id, char_json, updated_at FROM hb_chars WHERE session_code=? ORDER BY id ASC");
    $stmt->execute([$code]);
    $charRows = $stmt->fetchAll();

    // 3. Lade alle Items für diese Session
    $stmt = $pdo->prepare("SELECT char_id, item_json FROM hb_items WHERE session_code=? ORDER BY id ASC");
    $stmt->execute([$code]);
    $itemsByChar = [];
    foreach ($stmt->fetchAll() as $r) {
        $item = json_decode($r['item_json'], true);
        if ($item) $itemsByChar[$r['char_id']][] = $item;
    }

    // 4. Zusammensetzen
    $chars = [];
    $latestTs = 0;
    foreach ($charRows as $r) {
        $c = json_decode($r['char_json'], true);
        if (!$c) continue;
        $c['inventory'] = $itemsByChar[$c['id']] ?? [];
        $chars[] = $c;
        $ts = strtotime($r['updated_at']) * 1000;
        if ($ts > $latestTs) $latestTs = $ts;
    }
    return ['chars' => $chars, 'updated_at' => $latestTs];
}

// ── Actions ─────────────────────────────────────────────────────
switch ($action) {

    case 'register':
        checkRateLimit($pdo);
        if (!validateCode($code))     respond(400, 'Code ungültig.');
        if (!validatePassword($pass)) respond(400, 'Passwort zu kurz (mind. 6 Zeichen).');
        $stmt = $pdo->prepare("SELECT code FROM hb_sessions WHERE code=?");
        $stmt->execute([$code]);
        if ($stmt->fetch()) respond(409, 'Code bereits vergeben.');
        $hash   = password_hash($pass, PASSWORD_BCRYPT, ['cost'=>11]);
        $dmHash = ($dmPass && validatePassword($dmPass)) ? password_hash($dmPass, PASSWORD_BCRYPT, ['cost'=>11]) : null;
        $pdo->prepare("INSERT INTO hb_sessions (code,password_hash,dm_pass_hash,chars_json) VALUES(?,?,?,'[]')")
            ->execute([$code, $hash, $dmHash]);
        respond(201, 'Gruppe erstellt.');

    case 'load':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $row    = verifySession($pdo, $code, $pass);
        $result = loadAll($pdo, $code, $row);
        respond(200, 'OK', [
            'chars'      => $result['chars'],
            'library'    => json_decode($row['library_json']??'{}', true) ?? [],
            'has_dm'     => !empty($row['dm_pass_hash']),
            'updated_at' => $result['updated_at'],
        ]);

    // Charakter-Basis speichern (OHNE inventory)
    case 'save_char':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $char   = $body['char']    ?? null;
        $charId = $body['char_id'] ?? null;
        if (!$char || !$charId) respond(400, 'Fehlende Daten.');
        unset($char['inventory']); // Items kommen über save_item
        $json = json_encode($char, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_CHAR_BYTES) respond(413, 'Charakter zu groß.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("INSERT INTO hb_chars (session_code,char_id,char_json) VALUES(?,?,?)
                       ON DUPLICATE KEY UPDATE char_json=VALUES(char_json), updated_at=NOW()")
            ->execute([$code, $charId, $json]);
        respond(200, 'Charakter gespeichert.');

    // Charakter löschen (kaskadiert nicht — Items manuell löschen)
    case 'delete_char':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $charId = $body['char_id'] ?? null;
        if (!$charId) respond(400, 'Fehlende char_id.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("DELETE FROM hb_chars WHERE session_code=? AND char_id=?")->execute([$code, $charId]);
        $pdo->prepare("DELETE FROM hb_items WHERE session_code=? AND char_id=?")->execute([$code, $charId]);
        respond(200, 'Charakter gelöscht.');

    // Einzelnes Item speichern
    case 'save_item':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $charId = $body['char_id'] ?? null;
        $itemId = $body['item_id'] ?? null;
        $item   = $body['item']   ?? null;
        if (!$charId || !$itemId || !$item) respond(400, 'Fehlende Daten.');
        $json = json_encode($item, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_ITEM_BYTES) respond(413, 'Item zu groß (max 2 MB).');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("INSERT INTO hb_items (session_code,char_id,item_id,item_json) VALUES(?,?,?,?)
                       ON DUPLICATE KEY UPDATE item_json=VALUES(item_json), updated_at=NOW()")
            ->execute([$code, $charId, $itemId, $json]);
        respond(200, 'Item gespeichert.');

    // Item löschen
    case 'delete_item':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $charId = $body['char_id'] ?? null;
        $itemId = $body['item_id'] ?? null;
        if (!$charId || !$itemId) respond(400, 'Fehlende Daten.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("DELETE FROM hb_items WHERE session_code=? AND char_id=? AND item_id=?")
            ->execute([$code, $charId, $itemId]);
        respond(200, 'Item gelöscht.');

    case 'save_library':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $library = $body['library'] ?? null;
        if ($library === null) respond(400, 'Fehlende Daten.');
        $libJson = json_encode($library, JSON_UNESCAPED_UNICODE);
        if (strlen($libJson) > MAX_LIB_BYTES) respond(413, 'Bibliothek zu groß.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("UPDATE hb_sessions SET library_json=? WHERE code=?")->execute([$libJson, $code]);
        respond(200, 'Bibliothek gespeichert.');

    case 'dm_load':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $row = verifyDmSession($pdo, $code, $pass, $dmPass);
        respond(200, 'OK', ['dm_library' => json_decode($row['dm_library_json']??'{}', true) ?? []]);

    case 'dm_save_library':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $dmLibrary = $body['dm_library'] ?? null;
        if ($dmLibrary === null) respond(400, 'Fehlende Daten.');
        $json = json_encode($dmLibrary, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_LIB_BYTES) respond(413, 'DM-Bibliothek zu groß.');
        verifyDmSession($pdo, $code, $pass, $dmPass);
        $pdo->prepare("UPDATE hb_sessions SET dm_library_json=? WHERE code=?")->execute([$json, $code]);
        respond(200, 'DM-Bibliothek gespeichert.');

    // ── Gegner ──────────────────────────────────────────────────
    // Zeilenweise gespeichert, damit das Aendern eines Gegners nicht die
    // ganze Sammlung hochlaedt. Alle vier Wege verlangen das DM-Passwort:
    // Spieler sollen die Werte ihrer Gegner nicht abrufen koennen.
    case 'dm_load_enemies':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        verifyDmSession($pdo, $code, $pass, $dmPass);
        $stmt = $pdo->prepare("SELECT enemy_json FROM hb_enemies WHERE session_code=? ORDER BY id ASC");
        $stmt->execute([$code]);
        $enemies = [];
        foreach ($stmt as $r) {
            $e = json_decode($r['enemy_json'], true);
            if (is_array($e)) $enemies[] = $e;
        }
        respond(200, 'OK', ['enemies' => $enemies]);

    case 'dm_save_enemy':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $enemyId = (string)($body['enemy_id'] ?? '');
        $enemy   = $body['enemy'] ?? null;
        if ($enemyId === '' || $enemy === null) respond(400, 'Fehlende Daten.');
        if (strlen($enemyId) > 50) respond(400, 'Gegner-Kennung zu lang.');
        $json = json_encode($enemy, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_ENEMY_BYTES) respond(413, 'Gegner zu groß (max 2 MB).');
        verifyDmSession($pdo, $code, $pass, $dmPass);
        $pdo->prepare("INSERT INTO hb_enemies (session_code,enemy_id,enemy_json) VALUES(?,?,?)
                       ON DUPLICATE KEY UPDATE enemy_json=VALUES(enemy_json)")
            ->execute([$code, $enemyId, $json]);
        respond(200, 'Gegner gespeichert.');

    case 'dm_delete_enemy':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $enemyId = (string)($body['enemy_id'] ?? '');
        if ($enemyId === '') respond(400, 'Fehlende Kennung.');
        verifyDmSession($pdo, $code, $pass, $dmPass);
        $pdo->prepare("DELETE FROM hb_enemies WHERE session_code=? AND enemy_id=?")
            ->execute([$code, $enemyId]);
        respond(200, 'Gegner gelöscht.');

    // Einmaliges Einlesen einer ganzen Sammlung. 360 einzelne Anfragen
    // waeren langsam und wuerden die Anfragebremse reizen; hier geht alles
    // in einer Transaktion, damit ein Fehler auf halbem Weg keinen halben
    // Bestand hinterlaesst.
    case 'dm_import_enemies':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $liste = $body['enemies'] ?? null;
        if (!is_array($liste)) respond(400, 'Fehlende Daten.');
        if (count($liste) > 2000) respond(413, 'Zu viele Gegner auf einmal (max. 2000).');
        verifyDmSession($pdo, $code, $pass, $dmPass);
        $stmt = $pdo->prepare("INSERT INTO hb_enemies (session_code,enemy_id,enemy_json) VALUES(?,?,?)
                               ON DUPLICATE KEY UPDATE enemy_json=VALUES(enemy_json)");
        $pdo->beginTransaction();
        $n = 0; $uebersprungen = 0;
        try {
            foreach ($liste as $e) {
                $eid = (string)($e['id'] ?? '');
                if ($eid === '' || strlen($eid) > 50) { $uebersprungen++; continue; }
                $json = json_encode($e, JSON_UNESCAPED_UNICODE);
                if (strlen($json) > MAX_ENEMY_BYTES) { $uebersprungen++; continue; }
                $stmt->execute([$code, $eid, $json]);
                $n++;
            }
            $pdo->commit();
        } catch (PDOException $ex) {
            $pdo->rollBack();
            respond(500, 'Einlesen fehlgeschlagen, nichts geändert.');
        }
        respond(200, $n . ' Gegner eingelesen.', ['imported' => $n, 'skipped' => $uebersprungen]);

    case 'set_dm_password':
        checkRateLimit($pdo);
        if (!validateCode($code))       respond(400, 'Ungültiger Code.');
        if (!validatePassword($dmPass)) respond(400, 'DM-Passwort zu kurz.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("UPDATE hb_sessions SET dm_pass_hash=? WHERE code=?")
            ->execute([password_hash($dmPass, PASSWORD_BCRYPT, ['cost'=>11]), $code]);
        respond(200, 'DM-Passwort gesetzt.');

    case 'change_password':
        checkRateLimit($pdo);
        $newPass = $body['new_password'] ?? '';
        if (!validateCode($code))        respond(400, 'Ungültiger Code.');
        if (!validatePassword($newPass)) respond(400, 'Neues Passwort zu kurz.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("UPDATE hb_sessions SET password_hash=? WHERE code=?")
            ->execute([password_hash($newPass, PASSWORD_BCRYPT, ['cost'=>11]), $code]);
        respond(200, 'Passwort geändert.');

    case 'save_log':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $entry = $body['entry'] ?? null;
        if (!$entry || empty($entry['action'])) respond(400, 'Fehlende Log-Daten.');
        verifySession($pdo, $code, $pass);
        $pdo->prepare("INSERT INTO hb_logs (session_code, char_id, char_name, tab, action, details) VALUES (?,?,?,?,?,?)")
            ->execute([
                $code,
                $entry['char_id']   ?? null,
                mb_substr($entry['char_name'] ?? '', 0, 100),
                mb_substr($entry['tab']       ?? '', 0, 30),
                mb_substr($entry['action']    ?? '', 0, 255),
                isset($entry['details']) ? json_encode($entry['details'], JSON_UNESCAPED_UNICODE) : null,
            ]);
        respond(200, 'Geloggt.');

    case 'load_logs':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        verifySession($pdo, $code, $pass);
        $charId  = $body['char_id']    ?? null;
        $limit   = min((int)($body['limit']  ?? 50), 100);
        $offset  = max((int)($body['offset'] ?? 0), 0);
        $search  = trim($body['search'] ?? '');
        $tabFilter = $body['tab_filter'] ?? [];
        if (!is_array($tabFilter)) $tabFilter = [];

        $where = ['session_code = ?'];
        $params = [$code];
        if ($charId) { $where[] = 'char_id = ?'; $params[] = $charId; }
        if ($search) { $where[] = '(action LIKE ? OR char_name LIKE ?)'; $params[] = '%'.$search.'%'; $params[] = '%'.$search.'%'; }
        if (!empty($tabFilter)) {
            $ph = implode(',', array_fill(0, count($tabFilter), '?'));
            $where[] = "tab IN ($ph)";
            $params = array_merge($params, $tabFilter);
        }
        $sql = 'SELECT id, char_id, char_name, tab, action, details, created_at FROM hb_logs WHERE '.implode(' AND ', $where).' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        foreach ($logs as &$l) {
            if ($l['details']) $l['details'] = json_decode($l['details'], true);
        }
        respond(200, 'OK', ['logs' => $logs, 'has_more' => count($logs) >= $limit, 'offset' => $offset]);

    default:
        respond(400, 'Unbekannte Aktion.');
}
