<?php
// ════════════════════════════════════════════════════════════════
//  Heldenbuch API  v3.1 — Granulare Speicherung
// ════════════════════════════════════════════════════════════════
// Die Konfiguration liegt neben dieser Datei und steht nicht im Repo.
//
// Fuer den oertlichen Testlauf darf sie ueber HB_CONFIG umgebogen werden —
// aber nur, wenn PHP von der Kommandozeile oder aus dem eingebauten Server
// laeuft. Unter dem Webserver wird die Variable nicht einmal gelesen: die
// Konfiguration traegt die Zugangsdaten der Datenbank, und die soll nichts
// von aussen umlenken koennen.
$hbEigen = (PHP_SAPI === 'cli' || PHP_SAPI === 'cli-server') ? (string)getenv('HB_CONFIG') : '';
require_once ($hbEigen !== '' && is_file($hbEigen)) ? $hbEigen : __DIR__ . '/config.php';
define('MAX_CHAR_BYTES',  500000);   // 500KB pro Char (ohne Items)
define('MAX_ITEM_BYTES',  2000000);  // 2MB pro Item (Bild!)
define('MAX_LIB_BYTES',   2000000);  // 2MB Bibliothek
define('MAX_ENEMY_BYTES', 2000000);  // 2MB pro Gegner (Bild!)
define('MAX_KAMPF_BYTES',  300000);   // 300KB je Kampf — er wird oft geschrieben
define('RATE_LIMIT_ATTEMPTS',   1000);
define('LOG_TAGE_STANDARD',     180);   // Aufbewahrung des Abenteuerlogs
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
// hb_vitals und hb_rev tragen den Hintergrundabgleich. Beide sind
// abgeleitet, nicht Wahrheit: die steht weiter in hb_chars.char_json. Sie
// existieren, damit ein Abgleich nicht das Naheliegende tun muss — alles
// lesen, um festzustellen, dass sich nichts geaendert hat.
//   hb_vitals: die vier Werte, die sich im Kampf im Sekundentakt aendern.
//              Ein paar Byte je Held statt eines Bogens mit Bild.
//   hb_rev:    zaehlt nur hoch, wenn sich etwas anderes geaendert hat.
//              Solange die Zahl steht, muss niemand laden.
//
// Jede Tabelle mit Fremdschluessel braucht dieselbe Kollation wie
// hb_sessions.code — sonst lehnt MySQL den Schluessel ab, und weil dieser
// Block bei jeder Anfrage laeuft, faellt die ganze Schnittstelle aus.
// hb_enemies: die Gegner der Spielleitung liegen zeilenweise wie
// hb_items, nicht als Eintrag in der DM-Bibliothek. Die wird als ein
// Stueck gespeichert — jede Aenderung an einem Goblin lüde die ganze
// Sammlung erneut hoch, und mit Bildern waere ihre 2-MB-Grenze nach rund
// dreissig Monsterportraets erreicht. Zeilenweise gilt das Limit je
// Gegner statt je Sammlung.
try {
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

    CREATE TABLE IF NOT EXISTS hb_encounters (
        id           INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20) NOT NULL,
        enc_id       VARCHAR(50) NOT NULL,
        enc_json     LONGTEXT    NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_sen (session_code, enc_id),
        CONSTRAINT fk_hben_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_chronik (
        session_code VARCHAR(20) NOT NULL PRIMARY KEY,
        chronik_json LONGTEXT    NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_hbch_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Ein laufender Kampf je Abenteuer. Mehr braucht kein Tisch, und die
    -- Beschraenkung macht die Frage nach dem richtigen Kampf ueberfluessig.
    -- stand zaehlt jede Aenderung mit: ein Geraet fragt nur die Zahl und
    -- holt den Rest erst, wenn sie sich bewegt hat.
    CREATE TABLE IF NOT EXISTS hb_kampf (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        kampf_json   LONGTEXT    NOT NULL,
        stand        BIGINT      NOT NULL DEFAULT 1,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, adv_id),
        CONSTRAINT fk_hbk_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_vitals (
        session_code VARCHAR(20)  NOT NULL,
        char_id      VARCHAR(50)  NOT NULL,
        vitals_json  VARCHAR(255) NOT NULL,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, char_id),
        CONSTRAINT fk_hbv_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_rev (
        session_code VARCHAR(20) NOT NULL PRIMARY KEY,
        rev          BIGINT      NOT NULL DEFAULT 1,
        CONSTRAINT fk_hbr_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- ── Konten ──────────────────────────────────────────────
    -- Nutzer sind global, die Gruppe bleibt der Mandant: session_code
    -- steht weiter in jeder Tabelle und in jeder Abfrage. Die
    -- Mitgliedschaft verbindet beides. Das ist Weg C aus dem Konzept —
    -- ein Admin ueber alles, ohne 51 Abfragen umzuschreiben.
    CREATE TABLE IF NOT EXISTS hb_users (
        id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(40)  NOT NULL,
        pass_hash     VARCHAR(255) NOT NULL,
        ist_admin     TINYINT(1)   NOT NULL DEFAULT 0,
        muss_wechseln TINYINT(1)   NOT NULL DEFAULT 0,
        angelegt_am   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Die Anmeldung als Zufallskennung. Abmelden heisst: Zeile loeschen.
    -- Sie ersetzt das Passwort in jeder Anfrage — geprueft wird ein
    -- Schluesselvergleich statt eines bcrypt-Durchlaufs.
    CREATE TABLE IF NOT EXISTS hb_logins (
        token       CHAR(64) NOT NULL PRIMARY KEY,
        user_id     INT      NOT NULL,
        angelegt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        zuletzt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_login_user (user_id),
        CONSTRAINT fk_hblg_user FOREIGN KEY (user_id) REFERENCES hb_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Wer gehoert zu welcher Gruppe, und als was. Dieselbe Kollation wie
    -- hb_sessions.code, sonst lehnt MySQL den Fremdschluessel ab und der
    -- Schema-Aufbau bricht bei jeder Anfrage.
    CREATE TABLE IF NOT EXISTS hb_mitglied (
        user_id      INT         NOT NULL,
        session_code VARCHAR(20) NOT NULL,
        rolle        VARCHAR(10) NOT NULL DEFAULT 'spieler',
        seit         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, session_code),
        KEY idx_mitglied_code (session_code),
        CONSTRAINT fk_hbm_user    FOREIGN KEY (user_id)      REFERENCES hb_users(id)     ON DELETE CASCADE,
        CONSTRAINT fk_hbm_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Wer leitet welches Abenteuer. Eine eigene Tabelle und nicht ein
    -- Feld in der Bibliothek: die schreibt jedes Mitglied, und was die
    -- Anwendung schreibt, darf nicht ueber Rechte entscheiden. Sonst
    -- traegt sich ein Spieler selbst als Spielleitung ein.
    CREATE TABLE IF NOT EXISTS hb_adv_dm (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        user_id      INT         NOT NULL,
        PRIMARY KEY (session_code, adv_id, user_id),
        KEY idx_advdm_user (user_id),
        CONSTRAINT fk_hbad_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE,
        CONSTRAINT fk_hbad_user    FOREIGN KEY (user_id)      REFERENCES hb_users(id)      ON DELETE CASCADE
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
} catch (PDOException $e) {
    // Bis hierher lief dieser Block ungeschuetzt: eine einzige abgelehnte
    // Tabelle machte damit jede Anfrage zu einem leeren 500er, ohne einen
    // Hinweis worauf. Jetzt sagt die Antwort, was die Datenbank
    // beanstandet — das ist der Unterschied zwischen fuenf Minuten und
    // einem Abend Suchen.
    respond(500, 'Datenbank-Schema: ' . $e->getMessage());
}

// Legacy-Migration: alte chars_json Spalte hinzufügen falls nicht da
try { $pdo->exec("ALTER TABLE hb_sessions ADD COLUMN chars_json LONGTEXT"); } catch (PDOException $e) {}

// Wem ein Bogen gehoert. Nullbar, weil die vorhandenen Helden erst
// zugeordnet werden muessen — und weil ein leeres Feld nichts kostet.
// Durchgesetzt wird der Besitz erst in Stufe 3; hier steht nur die Spalte,
// damit es bei einer Schemaaenderung bleibt statt zweier.
try { $pdo->exec("ALTER TABLE hb_chars ADD COLUMN owner INT NULL"); } catch (PDOException $e) {}

// Zwei Angaben aus dem Bogen, die der Server oft braucht und die er sonst
// jedes Mal aus dem JSON holen muesste — mitsamt Portraet und Inventar.
// Sie werden beim Speichern aus dem Bogen abgeleitet, nie von aussen
// gesetzt: die Wahrheit steht weiter in char_json.
try { $pdo->exec("ALTER TABLE hb_chars ADD COLUMN adv_id VARCHAR(50) NULL"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE hb_chars ADD COLUMN dm_only TINYINT(1) NOT NULL DEFAULT 0"); } catch (PDOException $e) {}

// Das Abenteuerlog traegt jetzt, wer eine Zeile geschrieben hat, und zu
// welchem Abenteuer sie gehoert. Die Kennung und nicht der Name: eine
// Kennung laesst sich spaeter anonymisieren, ein in tausend Zeilen
// eingebrannter Name nicht.
try { $pdo->exec("ALTER TABLE hb_logs ADD COLUMN user_id INT NULL"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE hb_logs ADD COLUMN adv_id VARCHAR(50) NULL"); } catch (PDOException $e) {}
// Beim Loeschen eines Kontos bleibt die Zeile stehen und verliert nur die
// Kennung. Die Kampagnenhistorie gehoert der Runde, nicht dem Einzelnen.
try { $pdo->exec("ALTER TABLE hb_logs ADD CONSTRAINT fk_hbl_user
                  FOREIGN KEY (user_id) REFERENCES hb_users(id) ON DELETE SET NULL"); } catch (PDOException $e) {}
// Wie lange das Log stehen bleibt, in Tagen. NULL heisst: die Vorgabe.
try { $pdo->exec("ALTER TABLE hb_sessions ADD COLUMN log_tage INT NULL"); } catch (PDOException $e) {}

// ── Hilfsfunktionen ─────────────────────────────────────────────
function checkRateLimit(PDO $pdo): void {
    // Die Adresse selbst wird nicht gespeichert. Die Bremse muss sie nie
    // lesen, nur wiedererkennen — und eine IP-Adresse im Klartext, die
    // niemals wieder verschwindet, war ein Personenbezug, den niemand
    // wollte. Der Hash ist auf denselben 45 Zeichen zu Hause.
    // 40 Zeichen, weil die Spalte 45 fasst — ein voller SHA-256 waere
    // stillschweigend abgeschnitten worden, und dann findet die Abfrage
    // ihre eigene Zeile nicht wieder.
    $ip   = substr(hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0')), 0, 40);
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
    // Was aelter ist als das Zeitfenster, wird nicht mehr gebraucht. Nur
    // hin und wieder, damit nicht jede Anfrage einen Aufraeumlauf zahlt.
    if (random_int(1, 50) === 1) {
        $pdo->prepare("DELETE FROM hb_rate_limits WHERE window_start < (NOW() - INTERVAL ? SECOND)")
            ->execute([RATE_LIMIT_WINDOW_SEC * 4]);
        // Und die Zeilen aus der Zeit, als hier noch die Adresse selbst
        // stand. Sie sind an ihrer Laenge zu erkennen.
        $pdo->exec("DELETE FROM hb_rate_limits WHERE CHAR_LENGTH(ip) <> 40");
    }
}
// ── Hintergrundabgleich ─────────────────────────────────────────
// Diese vier Werte aendern sich im Kampf staendig, alles andere am Bogen
// so gut wie nie. Deshalb werden sie getrennt gefuehrt.
const VITAL_FELDER = ['hp', 'tempHp', 'tempMaxHp', 'deathSaves'];
function vitalsAus(array $c): array {
    $v = [];
    foreach (VITAL_FELDER as $f) if (array_key_exists($f, $c)) $v[$f] = $c[$f];
    return $v;
}
function ohneVitals(array $c): array {
    foreach (VITAL_FELDER as $f) unset($c[$f]);
    return $c;
}
// Nur hochzaehlen, wenn sich etwas anderes als die vier Werte geaendert
// hat. Ein Trefferpunkt weniger soll keinen vollen Ladevorgang bei jedem
// in der Gruppe ausloesen.
function revHoch(PDO $pdo, string $code): void {
    $pdo->prepare("INSERT INTO hb_rev (session_code,rev) VALUES(?,1)
                   ON DUPLICATE KEY UPDATE rev=rev+1")->execute([$code]);
}
function revStand(PDO $pdo, string $code): int {
    $st = $pdo->prepare("SELECT rev FROM hb_rev WHERE session_code=?");
    $st->execute([$code]);
    $r = $st->fetch();
    return (int)($r['rev'] ?? 0);
}
// Kennung fuer den Abgleich. Sie wird aus dem Passwort-Hash abgeleitet und
// ist damit ohne den Hash nicht zu erraten — aber ihre Pruefung kostet
// einen Stringvergleich statt eines bcrypt-Durchlaufs. Genau deshalb gibt
// es sie: der Abgleich laeuft alle paar Sekunden auf jedem Geraet, und
// bcrypt ist mit Absicht langsam.
function pollToken(string $code, string $hash): string {
    return hash('sha256', $code . '|' . $hash);
}

// ── Konten ──────────────────────────────────────────────────────
// Der Admin steht in der config.php, nicht in der Anwendung. Damit gibt
// es kein Henne-Ei-Problem beim ersten Start und keine Luecke, durch die
// sich jemand selbst zum Admin macht: wer den Namen aendern will, braucht
// Zugriff auf die Datei mit den Datenbank-Zugangsdaten.
function adminName(): string {
    return defined('ADMIN_USER') ? trim((string)ADMIN_USER) : '';
}
function istAdmin(?array $u): bool {
    if (!$u) return false;
    if ((int)($u['ist_admin'] ?? 0) === 1) return true;
    $a = adminName();
    return $a !== '' && (string)$u['name'] === $a;
}
function validateName(string $n): bool {
    return preg_match('/^[\p{L}\p{N} _\-.]{3,40}$/u', $n) === 1;
}

function nutzerAusToken(PDO $pdo, string $token): array {
    if (strlen($token) !== 64 || !ctype_xdigit($token)) respond(401, 'Nicht angemeldet.');
    $st = $pdo->prepare("SELECT u.id, u.name, u.ist_admin, u.muss_wechseln
                         FROM hb_logins l JOIN hb_users u ON u.id = l.user_id
                         WHERE l.token = ?");
    $st->execute([$token]);
    $u = $st->fetch();
    if (!$u) respond(401, 'Nicht angemeldet.');
    // Nur einmal je Minute schreiben: die Kennung wird bei jedem Abgleich
    // mitgeschickt, und ein Schreibvorgang je Anfrage waere teurer als die
    // Anfrage selbst.
    $pdo->prepare("UPDATE hb_logins SET zuletzt=NOW()
                   WHERE token=? AND zuletzt < (NOW() - INTERVAL 1 MINUTE)")->execute([$token]);
    return $u;
}
function mitgliedsRolle(PDO $pdo, int $userId, string $code): string {
    $st = $pdo->prepare("SELECT rolle FROM hb_mitglied WHERE user_id=? AND session_code=?");
    $st->execute([$userId, $code]);
    return (string)($st->fetch()['rolle'] ?? '');
}
function sitzungsZeile(PDO $pdo, string $code): array {
    $st = $pdo->prepare("SELECT password_hash, library_json, dm_pass_hash, dm_library_json, chars_json, log_tage
                         FROM hb_sessions WHERE code=?");
    $st->execute([$code]);
    $row = $st->fetch();
    if (!$row) respond(404, 'Gruppe nicht gefunden.');
    return $row;
}
function nutzerAntwort(PDO $pdo, array $u): array {
    $st = $pdo->prepare("SELECT session_code, rolle FROM hb_mitglied WHERE user_id=? ORDER BY seit ASC");
    $st->execute([(int)$u['id']]);
    $antwort = [
        'id'            => (int)$u['id'],
        'name'          => $u['name'],
        'ist_admin'     => istAdmin($u),
        'muss_wechseln' => (int)($u['muss_wechseln'] ?? 0) === 1,
        'gruppen'       => $st->fetchAll(),
    ];
    // Die Verwaltung gehoert zu keiner Gruppe und darf in jede. Seit die
    // Anmeldemaske keinen Gruppencode mehr hat, muss sie erfahren, welche
    // es gibt — sonst haette sie nirgendwohin.
    if ($antwort['ist_admin']) {
        $antwort['alle_gruppen'] = array_column(
            $pdo->query("SELECT code FROM hb_sessions ORDER BY created_at ASC")->fetchAll(), 'code');
    }
    return $antwort;
}

// ── Wer leitet welches Abenteuer ────────────────────────────────
// Auch hier ist die Regel einseitig: solange fuer ein Abenteuer niemand
// eingetragen ist, leitet es jede Spielleitung der Gruppe — also genau
// wie bisher. Erst der erste Eintrag grenzt ein. Damit aendert sich fuer
// eine Runde, die nichts eintraegt, nichts, und jeder Eintrag macht es
// enger statt kaputt.
function advDmKarte(PDO $pdo, string $code): array {
    $st = $pdo->prepare("SELECT adv_id, user_id FROM hb_adv_dm WHERE session_code=?");
    $st->execute([$code]);
    $karte = [];
    foreach ($st->fetchAll() as $r) $karte[(string)$r['adv_id']][] = (int)$r['user_id'];
    return $karte;
}
function istDmVon(PDO $pdo, array $z, string $code, string $advId): bool {
    if (!$z['user']) return true;                       // der alte Weg leitet alles
    if ($z['rolle'] === 'admin') return true;
    if ($advId === '') return $z['rolle'] === 'dm';     // kein Abenteuer genannt
    $st = $pdo->prepare("SELECT user_id FROM hb_adv_dm WHERE session_code=? AND adv_id=?");
    $st->execute([$code, $advId]);
    $ids = array_map('intval', array_column($st->fetchAll(), 'user_id'));
    // Wer fuer dieses Abenteuer eingetragen ist, leitet es — gleich welche
    // Rolle er in der Gruppe hat. Wer Eberron leitet, kann in Strahd
    // mitspielen; das ist am Tisch der Normalfall und nicht die Ausnahme.
    if ($ids) return in_array((int)$z['user']['id'], $ids, true);
    // Niemand eingetragen: dann gilt die Rolle in der Gruppe. Solange eine
    // Runde nichts eintraegt, aendert sich fuer sie nichts.
    return $z['rolle'] === 'dm';
}
// Leitet dieses Konto ueberhaupt irgendein Abenteuer dieser Gruppe? Die
// Sachen der Spielleitung — Gegner, Chronik, ihre Bibliothek — liegen
// gruppenweit; wer irgendwo den Schirm haelt, braucht sie.
function fuehrtIrgendwas(PDO $pdo, string $code, int $userId): bool {
    $st = $pdo->prepare("SELECT 1 FROM hb_adv_dm WHERE session_code=? AND user_id=? LIMIT 1");
    $st->execute([$code, $userId]);
    return (bool)$st->fetch();
}

// ── Der Kampf und was ein Spieler davon sehen darf ──────────────
// Dieselbe Leiter wie im Bogen (js/util.js, TP_ZUSTAENDE). Sie steht
// hier ein zweites Mal, und das ist Absicht: verschleiern im Browser
// waere keine Verschleierung. Wer die Antwort des Servers ansieht, saehe
// die Zahl trotzdem. Also faellt sie hier heraus, bevor sie das Haus
// verlaesst.
function tpZustandServer(int $hp, int $max): array {
    $anteil = $max > 0 ? max(0, $hp) / $max : 0.0;
    $stufen = [
        [1.0,  1.0,  'Unverletzt'],
        [0.75, 0.85, 'Leicht verletzt'],
        [0.5,  0.62, 'Verwundet'],
        [0.25, 0.37, 'Schwer verwundet'],
        [0.01, 0.12, 'Am Ende'],
        [0.0,  0.0,  'Kampfunfähig'],
    ];
    foreach ($stufen as $s) {
        if ($anteil >= $s[0]) return ['zustand' => $s[2], 'balken' => $s[1]];
    }
    return ['zustand' => 'Kampfunfähig', 'balken' => 0.0];
}

// Die Einstellungen eines Abenteuers liegen in der Bibliothek unter
// _adventures, dort wo auch die Abenteuerliste steht. Der Server liest
// sie mit, weil zwei Regeln daran haengen, die er selbst durchsetzen
// muss: ob die Trefferpunkte offen sind und wer den Kampf sehen darf.
function abenteuerAusBibliothek(PDO $pdo, string $code, string $advId): array {
    $st = $pdo->prepare("SELECT library_json FROM hb_sessions WHERE code=?");
    $st->execute([$code]);
    $lib = json_decode((string)($st->fetchColumn() ?: '{}'), true);
    $advs = (is_array($lib) && isset($lib['_adventures']) && is_array($lib['_adventures']))
        ? $lib['_adventures'] : [];
    foreach ($advs as $a) {
        if (is_array($a) && (string)($a['id'] ?? '') === $advId) return $a;
    }
    return [];
}
// Ist nichts eingetragen, sind die Punkte offen — so war es immer.
function tpOffenImAbenteuer(PDO $pdo, string $code, string $advId): bool {
    return empty(abenteuerAusBibliothek($pdo, $code, $advId)['hpVerdeckt']);
}
// Wer den laufenden Kampf sehen darf: von allein ("auto"), erst wenn die
// Spielleitung ihn zeigt ("ansage"), oder gar nicht ("aus"). Ohne
// Eintrag gilt "auto" — wer den Kampf auf den Server schreibt, will ihn
// in aller Regel auch zeigen.
function kampfSichtImAbenteuer(PDO $pdo, string $code, string $advId): string {
    $w = (string)(abenteuerAusBibliothek($pdo, $code, $advId)['kampfSicht'] ?? 'auto');
    return in_array($w, ['auto', 'ansage', 'aus'], true) ? $w : 'auto';
}

// Die Fassung fuer alle, die das Abenteuer nicht leiten.
//
// Beim Gegner fallen die Zahlen immer heraus — seine Trefferpunkte sind
// das, was die Runde im Kampf herausfinden soll, und seine
// Ruestungsklasse ebenso. Uebrig bleibt, was am Tisch ohnehin jeder
// sieht: dass er dasteht, wie es ihm geht, und was ihn plagt.
//
// Beim Helden traegt der Kampf gar keine Trefferpunkte — die stehen im
// Bogen und gehen ihren eigenen Weg. Hier faellt nur weg, was die
// Spielleitung fuer sich notiert hat.
//
// Das Protokoll bleibt ganz draussen: darin stehen die Zahlen der Gegner
// im Klartext.
function kampfFuerSpieler(array $k, bool $hpOffen): array {
    $raus = [
        'name'   => (string)($k['name'] ?? 'Kampf'),
        'phase'  => (string)($k['phase'] ?? 'kampf'),
        'aktiv'  => !empty($k['aktiv']),
        'runde'  => (int)($k['runde'] ?? 1),
        'zug'    => (int)($k['zug'] ?? 0),
    ];
    $teil = [];
    foreach ((array)($k['teilnehmer'] ?? []) as $t) {
        if (!is_array($t)) continue;
        $held = (string)($t['art'] ?? '') === 'held';
        $e = [
            'id'           => (string)($t['id'] ?? ''),
            'art'          => $held ? 'held' : 'gegner',
            'ini'          => isset($t['ini']) && $t['ini'] !== null ? (int)$t['ini'] : null,
            'zustaende'    => array_values((array)($t['zustaende'] ?? [])),
            'erschoepfung' => (int)($t['erschoepfung'] ?? 0),
            'vorteil'      => !empty($t['vorteil']),
            'nachteil'     => !empty($t['nachteil']),
        ];
        if ($held) {
            // Der Held wird ueber seinen Bogen gefunden; dort gelten die
            // Regeln, die es schon gibt.
            $e['charId'] = (string)($t['charId'] ?? '');
        } else {
            $e['name'] = (string)($t['name'] ?? 'Gegner');
            $hp  = (int)($t['hp'] ?? 0);
            $max = max(1, (int)($t['hpMax'] ?? 1));
            $e = array_merge($e, tpZustandServer($hp, $max));
            $e['tot'] = $hp <= 0;
        }
        $teil[] = $e;
    }
    $raus['teilnehmer'] = $teil;
    // Die Ansagen gehen an alle zurueck: der Spieler soll sehen, dass
    // seine angekommen ist, und die Runde sieht, wer schon angesagt hat.
    $ans = [];
    foreach ((array)($k['ansagen'] ?? []) as $a) {
        if (is_array($a)) $ans[] = $a;
    }
    $raus['ansagen'] = $ans;
    // Ob die Helden ihre Zahlen sehen duerfen, entscheidet weiter der
    // Bogen. Der Kampf sagt nur, was fuer dieses Abenteuer gilt, damit
    // ein Spielergeraet nicht raten muss.
    $raus['hpOffen'] = $hpOffen;
    return $raus;
}

// ── Wer darf welche Logzeilen sehen ─────────────────────────────
// Bisher hat der Browser gefiltert: die Antwort trug alles, und die
// Anwendung liess die Zeilen der DM-Helden weg. Wer sich die Antwort
// ansah, sah sie trotzdem. Jetzt entscheidet der Server.
function logFrist(?array $row): int {
    $t = (int)($row['log_tage'] ?? 0);
    return $t > 0 ? $t : LOG_TAGE_STANDARD;
}
function dmOnlyIds(PDO $pdo, string $code): array {
    $st = $pdo->prepare("SELECT char_id FROM hb_chars WHERE session_code=? AND dm_only=1");
    $st->execute([$code]);
    return array_column($st->fetchAll(), 'char_id');
}
function spielerAbenteuer(PDO $pdo, string $code, int $userId): array {
    $st = $pdo->prepare("SELECT DISTINCT adv_id FROM hb_chars
                         WHERE session_code=? AND owner=? AND adv_id IS NOT NULL");
    $st->execute([$code, $userId]);
    return array_column($st->fetchAll(), 'adv_id');
}

// ── Besitz eines Bogens ─────────────────────────────────────────
// Die Regel ist mit Absicht einseitig: ein Bogen ohne Besitzer darf von
// jedem in der Gruppe geaendert werden — genau wie bisher. Erst die
// Zuordnung schuetzt ihn. So aendert die Umstellung fuer eine Runde, die
// noch nichts zugeordnet hat, ueberhaupt nichts, und jede Zuordnung
// macht es strenger statt kaputt.
//
// Der alte Weg ueber das Gruppenpasswort kennt keinen Besitz: wer es hat,
// ist die Gruppe. Das bleibt so, bis er abgeschaltet wird.
function besitzPruefen(PDO $pdo, array $z, string $code, string $charId): void {
    if (!$z['user']) return;
    if ($z['rolle'] === 'admin') return;
    // adv_id statt char_json: der Bogen kann ein Portraet tragen, und den
    // fuer eine Rechtefrage zu entpacken waere Verschwendung.
    $st = $pdo->prepare("SELECT owner, adv_id FROM hb_chars WHERE session_code=? AND char_id=?");
    $st->execute([$code, $charId]);
    $r = $st->fetch();
    if (!$r) return;                                    // gibt es noch nicht
    // Die Spielleitung darf an jeden Bogen ihres Abenteuers — aber nur an
    // die ihres Abenteuers. Ein DM der Nebenrunde hat in Strahd nichts
    // verloren, und ohne diese Zeile haette er es.
    $eigener = $r['owner'] !== null && (int)$r['owner'] === (int)$z['user']['id'];
    if ($z['rolle'] === 'dm') {
        if (istDmVon($pdo, $z, $code, (string)($r['adv_id'] ?? ''))) return;
        // Leitet sie dieses Abenteuer nicht, ist sie darin ein Spieler wie
        // jeder andere — und bekommt den Grund gesagt, der wirklich
        // zutrifft, statt "gehoert jemand anderem".
        if ($eigener) return;
        respond(403, 'Dieses Abenteuer leitet jemand anderes.');
    }
    if ($r['owner'] === null) return;
    if (!$eigener) respond(403, 'Dieser Bogen gehört jemand anderem.');
}

// ── Zugang zu einer Gruppe ──────────────────────────────────────
// Zwei Wege, und beide fuehren hierher: das Gruppenpasswort wie bisher,
// oder ein angemeldetes Konto. Solange die Anwendung noch das Passwort
// schickt, aendert sich fuer sie nichts — deshalb steht der alte Weg
// zuerst und ohne jede Bedingung.
//
// rolle ist 'gruppe' (der alte Weg, darf alles), 'spieler', 'dm' oder
// 'admin'. Ausgewertet wird sie ab Stufe 3; hier steht sie schon in der
// Antwort, damit die Anwendung sie kennt, bevor etwas davon abhaengt.
function zugang(PDO $pdo, string $code, string $pass, array $body): array {
    $token = (string)($body['token'] ?? '');
    if ($token === '') {
        // Stufe 7: der Weg ueber Gruppencode und Gruppenpasswort ist zu.
        // Er hat die Umstellung getragen, damit niemand mitten in einer
        // Sitzung vor einer fremden Maske stand — jetzt kennt der Server
        // nur noch Konten.
        respond(403, 'Der Zugang über den Gruppencode ist abgeschaltet. Bitte mit dem eigenen Konto anmelden.');
    }
    $u    = nutzerAusToken($pdo, $token);
    $row  = sitzungsZeile($pdo, $code);
    $adm  = istAdmin($u);
    $rolle = $adm ? 'admin' : mitgliedsRolle($pdo, (int)$u['id'], $code);
    if ($rolle === '') respond(403, 'Kein Zugang zu dieser Gruppe.');
    return ['row' => $row, 'user' => $u, 'rolle' => $rolle];
}
// Dasselbe fuer alles, was der Spielleitung gehoert.
function zugangDm(PDO $pdo, string $code, string $pass, string $dmPass, array $body): array {
    $z = zugang($pdo, $code, $pass, $body);
    if ($z['rolle'] === 'dm' || $z['rolle'] === 'admin') return $z;
    if ($z['user'] && fuehrtIrgendwas($pdo, $code, (int)$z['user']['id'])) return $z;
    respond(403, 'Das darf nur die Spielleitung.');
}

function validateCode(string $c): bool { $l=strlen($c); return $l>=3&&$l<=20&&preg_match('/^[A-Za-z0-9_\-]+$/',$c); }
function validatePassword(string $p): bool { $l=strlen($p); return $l>=6&&$l<=128; }
function respond(int $status, string $message, array $extra=[]): never {
    http_response_code($status);
    echo json_encode(array_merge(['ok'=>$status<400,'message'=>$message],$extra), JSON_UNESCAPED_UNICODE);
    exit;
}
// Die beiden Pruefungen des alten Zugangs sind mit Stufe 7 entfallen.
// hb_sessions.password_hash bleibt: aus ihm leitet sich die Kennung des
// Hintergrundabgleichs ab, und die traegt jede Anfrage des Abgleichs
// statt eines Passworts.

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
    $stmt = $pdo->prepare("SELECT char_id, char_json, owner, adv_id, dm_only, updated_at
                           FROM hb_chars WHERE session_code=? ORDER BY id ASC");
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
    $besitz = [];
    $nach = [];
    $latestTs = 0;
    foreach ($charRows as $r) {
        $c = json_decode($r['char_json'], true);
        if (!$c) continue;
        $c['inventory'] = $itemsByChar[$c['id']] ?? [];
        $chars[] = $c;
        // Der Besitzer steht in einer eigenen Spalte und geht auch so
        // zurueck. Im Charakter selbst haette er nichts verloren: der wird
        // von der Anwendung geschrieben, und was sie schreibt, darf nicht
        // ueber Rechte entscheiden.
        if ($r['owner'] !== null) $besitz[(string)$r['char_id']] = (int)$r['owner'];
        // Boegen, die vor der Umstellung gespeichert wurden, tragen die
        // abgeleiteten Angaben noch nicht. Sie werden hier einmal
        // nachgezogen — beim Laden ist der Bogen ohnehin schon entpackt.
        $sollAdv = (string)($c['adventure'] ?? '');
        $sollDm  = !empty($c['dmOnly']) ? 1 : 0;
        if ((string)($r['adv_id'] ?? '') !== $sollAdv || (int)$r['dm_only'] !== $sollDm) {
            $nach[] = [$sollAdv !== '' ? $sollAdv : null, $sollDm, $code, (string)$r['char_id']];
        }
        $ts = strtotime($r['updated_at']) * 1000;
        if ($ts > $latestTs) $latestTs = $ts;
    }
    if ($nach) {
        $up = $pdo->prepare("UPDATE hb_chars SET adv_id=?, dm_only=? WHERE session_code=? AND char_id=?");
        foreach ($nach as $z2) $up->execute($z2);
    }
    return ['chars' => $chars, 'owners' => $besitz, 'updated_at' => $latestTs];
}

// ── Actions ─────────────────────────────────────────────────────
switch ($action) {

    // Eine Gruppe legt die Verwaltung an. Das Gruppenpasswort ist seit
    // Stufe 7 kein Zugang mehr, sondern nur noch der Anker, aus dem die
    // Kennung des Hintergrundabgleichs abgeleitet wird — die Anwendung
    // wuerfelt es und zeigt es niemandem.
    case 'register':
        checkRateLimit($pdo);
        $regU = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($regU))         respond(403, 'Das darf nur die Verwaltung.');
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
        $row    = zugang($pdo, $code, $pass, $body)['row'];
        $result = loadAll($pdo, $code, $row);

        // hb_vitals einmalig fuellen, damit der Abgleich auch fuer
        // Charaktere greift, die seit der Umstellung nicht gespeichert
        // wurden. Bewusst nur einfuegen, nie ueberschreiben: was schon
        // dasteht, kann frischer sein als dieser Lesevorgang.
        $vs = $pdo->prepare("INSERT INTO hb_vitals (session_code,char_id,vitals_json) VALUES(?,?,?)
                             ON DUPLICATE KEY UPDATE vitals_json=vitals_json");
        foreach ($result['chars'] as $c) {
            if (empty($c['id'])) continue;
            $vj = json_encode(vitalsAus($c), JSON_UNESCAPED_UNICODE);
            if (strlen($vj) <= 255) $vs->execute([$code, (string)$c['id'], $vj]);
        }

        respond(200, 'OK', [
            'chars'      => $result['chars'],
            'owners'     => (object)$result['owners'],
            // Wer welches Abenteuer leitet. Kein Geheimnis — die Runde
            // weiss ohnehin, wer am Schirm sitzt.
            'adv_dms'    => (object)advDmKarte($pdo, $code),
            'log_tage'   => logFrist($row),
            'library'    => json_decode($row['library_json']??'{}', true) ?? [],
            'has_dm'     => !empty($row['dm_pass_hash']),
            'updated_at' => $result['updated_at'],
            // Fuer den Hintergrundabgleich: die billige Kennung und der
            // Stand, ab dem nichts Neues mehr kam.
            'poll_token' => pollToken($code, (string)$row['password_hash']),
            'rev'        => revStand($pdo, $code),
        ]);

    // ── Hintergrundabgleich ─────────────────────────────────────
    // Der billigste Weg zu wissen, ob sich etwas getan hat: zwei kleine
    // Abfragen auf Schluesselspalten, keine Charakterbogen, kein bcrypt.
    // Die Antwort ist ein paar hundert Byte gross und traegt die
    // Trefferpunkte gleich mit — damit reicht sie im Kampf allein aus,
    // und geladen wird nur, wenn sich sonst etwas geaendert hat.
    //
    // Ohne Anfragebremse mit Absicht: die kostet zwei Schreibvorgaenge
    // und waere teurer als die Abfrage selbst. Geschuetzt ist der Weg
    // ueber die Kennung, die ohne den Passwort-Hash nicht zu raten ist.
    case 'poll':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $tok = (string)($body['poll_token'] ?? '');
        $st  = $pdo->prepare("SELECT password_hash FROM hb_sessions WHERE code=?");
        $st->execute([$code]);
        $row = $st->fetch();
        if (!$row) respond(401, 'Unbekannter Code.');
        if ($tok === '' || !hash_equals(pollToken($code, (string)$row['password_hash']), $tok))
            respond(401, 'Kennung ungültig. Bitte neu laden.');

        $st = $pdo->prepare("SELECT char_id, vitals_json FROM hb_vitals WHERE session_code=?");
        $st->execute([$code]);
        $vitals = [];
        foreach ($st as $r) {
            $v = json_decode($r['vitals_json'], true);
            if (is_array($v)) $vitals[$r['char_id']] = $v;
        }
        respond(200, 'OK', ['rev' => revStand($pdo, $code), 'vitals' => $vitals]);

    // Charakter-Basis speichern (OHNE inventory)
    case 'save_char':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $char   = $body['char']    ?? null;
        $charId = $body['char_id'] ?? null;
        if (!$char || !$charId) respond(400, 'Fehlende Daten.');
        if (!is_array($char)) respond(400, 'Charakter hat das falsche Format.');
        unset($char['inventory']); // Items kommen über save_item
        $json = json_encode($char, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_CHAR_BYTES) respond(413, 'Charakter zu groß.');
        $z = zugang($pdo, $code, $pass, $body);
        besitzPruefen($pdo, $z, $code, (string)$charId);

        // Vorher lesen, um zu wissen, ob sich mehr geaendert hat als die
        // Trefferpunkte. Das kostet einen Lesevorgang je Speichern —
        // gespart wird dafuer ein voller Ladevorgang bei jedem anderen in
        // der Gruppe, und zwar bei jedem einzelnen Treffer im Kampf.
        $st = $pdo->prepare("SELECT char_json FROM hb_chars WHERE session_code=? AND char_id=?");
        $st->execute([$code, $charId]);
        $altRow  = $st->fetch();
        $altChar = $altRow ? (json_decode($altRow['char_json'], true) ?: []) : null;
        // Ein Geraet, das die Trefferpunkte nicht angefasst hat, schickt sie
        // nicht mehr mit. Was fehlt, kommt aus dem Bestand — sonst schriebe
        // ein Spielergeraet mit einem paar Sekunden alten Stand die Zahlen
        // zurueck, die die Spielleitung gerade im Kampf eingetragen hat.
        // Genau daran sprangen die Trefferpunkte am Tisch zurueck.
        if ($altChar) {
            foreach (VITAL_FELDER as $vf) {
                if (!array_key_exists($vf, $char) && array_key_exists($vf, $altChar)) {
                    $char[$vf] = $altChar[$vf];
                }
            }
            $json = json_encode($char, JSON_UNESCAPED_UNICODE);
        }
        $inhaltNeu = json_encode(ohneVitals($char), JSON_UNESCAPED_UNICODE);
        $inhaltAlt = $altChar === null ? null : json_encode(ohneVitals($altChar), JSON_UNESCAPED_UNICODE);

        // Ein neuer Bogen gehoert dem, der ihn anlegt — sofern er
        // angemeldet ist. Beim Aktualisieren steht owner nicht in der
        // Zuweisungsliste und bleibt deshalb, wie es ist: ein Speichern
        // soll niemandem den Besitz nehmen oder geben.
        // fetch() liefert false, nicht null, wenn es die Zeile nicht gibt —
        // deshalb hier auf falsy pruefen und nicht auf null.
        $neuerBesitzer = (!$altRow && $z['user']) ? (int)$z['user']['id'] : null;
        $advId  = (string)($char['adventure'] ?? '');
        $nurDm  = !empty($char['dmOnly']) ? 1 : 0;
        $pdo->prepare("INSERT INTO hb_chars (session_code,char_id,char_json,owner,adv_id,dm_only)
                       VALUES(?,?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE char_json=VALUES(char_json), adv_id=VALUES(adv_id),
                                              dm_only=VALUES(dm_only), updated_at=NOW()")
            ->execute([$code, $charId, $json, $neuerBesitzer, $advId !== '' ? $advId : null, $nurDm]);

        $vitals = json_encode(vitalsAus($char), JSON_UNESCAPED_UNICODE);
        if (strlen($vitals) <= 255) {
            $pdo->prepare("INSERT INTO hb_vitals (session_code,char_id,vitals_json) VALUES(?,?,?)
                           ON DUPLICATE KEY UPDATE vitals_json=VALUES(vitals_json), updated_at=NOW()")
                ->execute([$code, $charId, $vitals]);
        }
        if ($inhaltNeu !== $inhaltAlt) revHoch($pdo, $code);
        respond(200, 'Charakter gespeichert.', ['rev' => revStand($pdo, $code)]);

    // Charakter löschen (kaskadiert nicht — Items manuell löschen)
    case 'delete_char':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $charId = $body['char_id'] ?? null;
        if (!$charId) respond(400, 'Fehlende char_id.');
        $z = zugang($pdo, $code, $pass, $body);
        besitzPruefen($pdo, $z, $code, (string)$charId);
        $pdo->prepare("DELETE FROM hb_chars WHERE session_code=? AND char_id=?")->execute([$code, $charId]);
        $pdo->prepare("DELETE FROM hb_items WHERE session_code=? AND char_id=?")->execute([$code, $charId]);
        $pdo->prepare("DELETE FROM hb_vitals WHERE session_code=? AND char_id=?")->execute([$code, $charId]);
        revHoch($pdo, $code);
        respond(200, 'Charakter gelöscht.', ['rev' => revStand($pdo, $code)]);

    // Einzelnes Item speichern
    case 'save_item':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $charId = $body['char_id'] ?? null;
        $itemId = $body['item_id'] ?? null;
        $item   = $body['item']   ?? null;
        if (!$charId || !$itemId || !$item) respond(400, 'Fehlende Daten.');
        $json = json_encode($item, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_ITEM_BYTES) respond(413, 'Item zu groß (max 2 MB).');
        // Das Inventar gehoert zum Bogen. Ohne diese Zeile waere der
        // Besitz mit einem Gegenstand zu umgehen.
        besitzPruefen($pdo, zugang($pdo, $code, $pass, $body), $code, (string)$charId);
        $pdo->prepare("INSERT INTO hb_items (session_code,char_id,item_id,item_json) VALUES(?,?,?,?)
                       ON DUPLICATE KEY UPDATE item_json=VALUES(item_json), updated_at=NOW()")
            ->execute([$code, $charId, $itemId, $json]);
        revHoch($pdo, $code);
        respond(200, 'Item gespeichert.', ['rev' => revStand($pdo, $code)]);

    // Item löschen
    case 'delete_item':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $charId = $body['char_id'] ?? null;
        $itemId = $body['item_id'] ?? null;
        if (!$charId || !$itemId) respond(400, 'Fehlende Daten.');
        besitzPruefen($pdo, zugang($pdo, $code, $pass, $body), $code, (string)$charId);
        $pdo->prepare("DELETE FROM hb_items WHERE session_code=? AND char_id=? AND item_id=?")
            ->execute([$code, $charId, $itemId]);
        revHoch($pdo, $code);
        respond(200, 'Item gelöscht.', ['rev' => revStand($pdo, $code)]);

    case 'save_library':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $library = $body['library'] ?? null;
        if ($library === null) respond(400, 'Fehlende Daten.');
        $libJson = json_encode($library, JSON_UNESCAPED_UNICODE);
        if (strlen($libJson) > MAX_LIB_BYTES) respond(413, 'Bibliothek zu groß.');
        zugang($pdo, $code, $pass, $body);
        $pdo->prepare("UPDATE hb_sessions SET library_json=? WHERE code=?")->execute([$libJson, $code]);
        revHoch($pdo, $code);
        respond(200, 'Bibliothek gespeichert.', ['rev' => revStand($pdo, $code)]);

    case 'dm_load':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $row = zugangDm($pdo, $code, $pass, $dmPass, $body)['row'];
        respond(200, 'OK', ['dm_library' => json_decode($row['dm_library_json']??'{}', true) ?? []]);

    case 'dm_save_library':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $dmLibrary = $body['dm_library'] ?? null;
        if ($dmLibrary === null) respond(400, 'Fehlende Daten.');
        $json = json_encode($dmLibrary, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_LIB_BYTES) respond(413, 'DM-Bibliothek zu groß.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $pdo->prepare("UPDATE hb_sessions SET dm_library_json=? WHERE code=?")->execute([$json, $code]);
        respond(200, 'DM-Bibliothek gespeichert.');

    // ── Gegner ──────────────────────────────────────────────────
    // Zeilenweise gespeichert, damit das Aendern eines Gegners nicht die
    // ganze Sammlung hochlaedt. Alle vier Wege verlangen das DM-Passwort:
    // Spieler sollen die Werte ihrer Gegner nicht abrufen koennen.
    case 'dm_load_enemies':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
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
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $pdo->prepare("INSERT INTO hb_enemies (session_code,enemy_id,enemy_json) VALUES(?,?,?)
                       ON DUPLICATE KEY UPDATE enemy_json=VALUES(enemy_json)")
            ->execute([$code, $enemyId, $json]);
        respond(200, 'Gegner gespeichert.');

    case 'dm_delete_enemy':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $enemyId = (string)($body['enemy_id'] ?? '');
        if ($enemyId === '') respond(400, 'Fehlende Kennung.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
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
        zugangDm($pdo, $code, $pass, $dmPass, $body);
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

    // ── Begegnungen ─────────────────────────────────────────────
    // Dieselbe Ablage wie bei den Gegnern: einzeln gespeichert, hinter dem
    // DM-Passwort. Sie sind klein, aber eine zweite Ablageart nebeneinander
    // waere nur eine weitere Regel, die man sich merken muss.
    case 'dm_load_encounters':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $stmt = $pdo->prepare("SELECT enc_json FROM hb_encounters WHERE session_code=? ORDER BY id ASC");
        $stmt->execute([$code]);
        $encs = [];
        foreach ($stmt as $r) {
            $e = json_decode($r['enc_json'], true);
            if (is_array($e)) $encs[] = $e;
        }
        respond(200, 'OK', ['encounters' => $encs]);

    case 'dm_save_encounter':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $encId = (string)($body['enc_id'] ?? '');
        $enc   = $body['encounter'] ?? null;
        if ($encId === '' || $enc === null) respond(400, 'Fehlende Daten.');
        if (strlen($encId) > 50) respond(400, 'Kennung zu lang.');
        $json = json_encode($enc, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_CHAR_BYTES) respond(413, 'Begegnung zu groß.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $pdo->prepare("INSERT INTO hb_encounters (session_code,enc_id,enc_json) VALUES(?,?,?)
                       ON DUPLICATE KEY UPDATE enc_json=VALUES(enc_json)")
            ->execute([$code, $encId, $json]);
        respond(200, 'Begegnung gespeichert.');

    case 'dm_delete_encounter':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $encId = (string)($body['enc_id'] ?? '');
        if ($encId === '') respond(400, 'Fehlende Kennung.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $pdo->prepare("DELETE FROM hb_encounters WHERE session_code=? AND enc_id=?")
            ->execute([$code, $encId]);
        respond(200, 'Begegnung gelöscht.');

    // -- Chronik ---------------------------------------------------
    // Anders als Gegner und Begegnungen liegt die Chronik als ein Stueck:
    // "die Gruppe schlaeft drei Tage" ruehrt jedes offene Ereignis an. In
    // Zeilen waere das ein Dutzend Anfragen fuer einen Knopfdruck. Sie ist
    // reiner Text ohne Bilder, die Groesse bleibt also klein.
    case 'dm_load_chronik':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $stmt = $pdo->prepare("SELECT chronik_json FROM hb_chronik WHERE session_code=?");
        $stmt->execute([$code]);
        $row = $stmt->fetch();
        $ch  = $row ? json_decode($row['chronik_json'], true) : null;
        respond(200, 'OK', ['chronik' => is_array($ch) ? $ch : null]);

    case 'dm_save_chronik':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $ch = $body['chronik'] ?? null;
        if (!is_array($ch)) respond(400, 'Fehlende Daten.');
        $json = json_encode($ch, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_LIB_BYTES) respond(413, 'Chronik zu groß.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $pdo->prepare("INSERT INTO hb_chronik (session_code,chronik_json) VALUES(?,?)
                       ON DUPLICATE KEY UPDATE chronik_json=VALUES(chronik_json)")
            ->execute([$code, $json]);
        respond(200, 'Chronik gespeichert.');

    case 'set_dm_password':
        checkRateLimit($pdo);
        if (!validateCode($code))       respond(400, 'Ungültiger Code.');
        if (!validatePassword($dmPass)) respond(400, 'DM-Passwort zu kurz.');
        zugang($pdo, $code, $pass, $body);
        $pdo->prepare("UPDATE hb_sessions SET dm_pass_hash=? WHERE code=?")
            ->execute([password_hash($dmPass, PASSWORD_BCRYPT, ['cost'=>11]), $code]);
        respond(200, 'DM-Passwort gesetzt.');

    case 'change_password':
        checkRateLimit($pdo);
        $newPass = $body['new_password'] ?? '';
        if (!validateCode($code))        respond(400, 'Ungültiger Code.');
        if (!validatePassword($newPass)) respond(400, 'Neues Passwort zu kurz.');
        zugang($pdo, $code, $pass, $body);
        $pdo->prepare("UPDATE hb_sessions SET password_hash=? WHERE code=?")
            ->execute([password_hash($newPass, PASSWORD_BCRYPT, ['cost'=>11]), $code]);
        respond(200, 'Passwort geändert.');

    case 'save_log':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $entry = $body['entry'] ?? null;
        if (!$entry || empty($entry['action'])) respond(400, 'Fehlende Log-Daten.');
        $z = zugang($pdo, $code, $pass, $body);
        $pdo->prepare("INSERT INTO hb_logs (session_code, char_id, char_name, tab, action, details, user_id, adv_id)
                       VALUES (?,?,?,?,?,?,?,?)")
            ->execute([
                $code,
                $entry['char_id']   ?? null,
                mb_substr($entry['char_name'] ?? '', 0, 100),
                mb_substr($entry['tab']       ?? '', 0, 30),
                mb_substr($entry['action']    ?? '', 0, 255),
                isset($entry['details']) ? json_encode($entry['details'], JSON_UNESCAPED_UNICODE) : null,
                // Die Kennung, nicht der Name. Ohne Konto bleibt sie leer —
                // der alte Weg weiss nicht, wer geschrieben hat.
                $z['user'] ? (int)$z['user']['id'] : null,
                mb_substr((string)($entry['adv_id'] ?? ''), 0, 50) ?: null,
            ]);
        // Aufraeumen, aber nicht bei jeder Zeile: einmal in zwanzig
        // Schreibvorgaengen reicht voellig, und der Rest kostet nichts.
        if (random_int(1, 20) === 1) {
            $pdo->prepare("DELETE FROM hb_logs WHERE session_code=? AND created_at < (NOW() - INTERVAL ? DAY)")
                ->execute([$code, logFrist($z['row'])]);
        }
        respond(200, 'Geloggt.');

    case 'load_logs':
        checkRateLimit($pdo);
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
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
        // ── Sichtbarkeit ──
        // Der alte Weg und die Verwaltung sehen alles. Eine Spielleitung
        // sieht nicht, was in einem Abenteuer passiert, das jemand anders
        // leitet. Ein Spieler sieht keine Zeilen zu DM-Helden — und, wenn
        // ihm ueberhaupt ein Held gehoert, nur die Abenteuer, in denen er
        // mitspielt. Gehoert ihm keiner, aendert sich nichts: dieselbe
        // einseitige Regel wie beim Besitz.
        $ich = $z['user'];
        if ($ich && $z['rolle'] !== 'admin') {
            if ($z['rolle'] === 'dm') {
                $fremd = [];
                foreach (advDmKarte($pdo, $code) as $adv => $ids) {
                    if (!in_array((int)$ich['id'], $ids, true)) $fremd[] = $adv;
                }
                if ($fremd) {
                    $ph = implode(',', array_fill(0, count($fremd), '?'));
                    $where[] = "(adv_id IS NULL OR adv_id NOT IN ($ph))";
                    $params  = array_merge($params, $fremd);
                }
            } else {
                $verdeckt = dmOnlyIds($pdo, $code);
                if ($verdeckt) {
                    $ph = implode(',', array_fill(0, count($verdeckt), '?'));
                    $where[] = "(char_id IS NULL OR char_id NOT IN ($ph))";
                    $params  = array_merge($params, $verdeckt);
                }
                $meine = spielerAbenteuer($pdo, $code, (int)$ich['id']);
                if ($meine) {
                    $ph = implode(',', array_fill(0, count($meine), '?'));
                    $where[] = "(adv_id IS NULL OR adv_id IN ($ph))";
                    $params  = array_merge($params, $meine);
                }
            }
        }

        $sql = 'SELECT id, char_id, char_name, tab, action, details, created_at, user_id, adv_id FROM hb_logs WHERE '.implode(' AND ', $where).' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        foreach ($logs as &$l) {
            if ($l['details']) $l['details'] = json_decode($l['details'], true);
        }
        respond(200, 'OK', ['logs' => $logs, 'has_more' => count($logs) >= $limit, 'offset' => $offset]);

    // ── Konten ──────────────────────────────────────────────────
    // Ab hier gilt nicht mehr "wer das Gruppenpasswort hat, ist die
    // Gruppe", sondern "wer angemeldet ist, ist jemand".

    case 'login':
        checkRateLimit($pdo);
        $name = trim((string)($body['user'] ?? ''));
        if ($name === '' || $pass === '') respond(400, 'Name und Passwort fehlen.');
        $st = $pdo->prepare("SELECT id, name, pass_hash, ist_admin, muss_wechseln FROM hb_users WHERE name=?");
        $st->execute([$name]);
        $u = $st->fetch();
        // Auch ohne Treffer wird gerechnet: sonst verraet die Antwortzeit,
        // welche Namen es gibt.
        $hash = $u['pass_hash'] ?? '$2y$11$ungueltigerhashzumrechnen000000000000000000000000000';
        if (!password_verify($pass, $hash) || !$u) respond(401, 'Name oder Passwort falsch.');
        $token = bin2hex(random_bytes(32));
        $pdo->prepare("INSERT INTO hb_logins (token,user_id) VALUES(?,?)")->execute([$token, (int)$u['id']]);
        respond(200, 'Angemeldet.', ['token' => $token, 'user' => nutzerAntwort($pdo, $u)]);

    case 'logout':
        // Ohne Anmeldung nichts zu tun, und das ist kein Fehler.
        $t = (string)($body['token'] ?? '');
        if ($t !== '') $pdo->prepare("DELETE FROM hb_logins WHERE token=?")->execute([$t]);
        respond(200, 'Abgemeldet.');

    case 'me':
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        respond(200, 'OK', ['user' => nutzerAntwort($pdo, $u)]);

    case 'password_change':
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        $alt = (string)($body['alt'] ?? '');
        $neu = (string)($body['neu'] ?? '');
        if (!validatePassword($neu)) respond(400, 'Neues Passwort zu kurz (mind. 6 Zeichen).');
        $st = $pdo->prepare("SELECT pass_hash FROM hb_users WHERE id=?");
        $st->execute([(int)$u['id']]);
        if (!password_verify($alt, (string)($st->fetch()['pass_hash'] ?? ''))) {
            respond(401, 'Altes Passwort falsch.');
        }
        $pdo->prepare("UPDATE hb_users SET pass_hash=?, muss_wechseln=0 WHERE id=?")
            ->execute([password_hash($neu, PASSWORD_BCRYPT, ['cost' => 11]), (int)$u['id']]);
        // Alle anderen Anmeldungen dieses Kontos enden — ein
        // Passwortwechsel, der fremde Sitzungen stehen laesst, ist keiner.
        $pdo->prepare("DELETE FROM hb_logins WHERE user_id=? AND token<>?")
            ->execute([(int)$u['id'], (string)$body['token']]);
        respond(200, 'Passwort geändert.');

    case 'user_create': {
        $name = trim((string)($body['name'] ?? ''));
        $neu  = (string)($body['neu'] ?? $pass);
        if (!validateName($name))     respond(400, 'Name ungültig (3–40 Zeichen).');
        if (!validatePassword($neu))  respond(400, 'Passwort zu kurz (mind. 6 Zeichen).');

        // Das erste Konto legt niemand an, der schon angemeldet ist — es
        // gibt ja noch keinen. Erlaubt ist genau ein Fall: die Tabelle ist
        // leer und der Name ist der, der in der config.php steht.
        $anzahl = (int)$pdo->query("SELECT COUNT(*) AS n FROM hb_users")->fetch()['n'];
        $token  = (string)($body['token'] ?? '');
        $alsAdmin = false;
        if ($anzahl === 0 && $token === '') {
            if (adminName() === '')      respond(403, 'Kein ADMIN_USER in der Konfiguration.');
            if ($name !== adminName())   respond(403, 'Das erste Konto muss ' . adminName() . ' heißen.');
            $alsAdmin = true;
        } else {
            $u = nutzerAusToken($pdo, $token);
            if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
            $alsAdmin = !empty($body['ist_admin']);
        }
        $st = $pdo->prepare("SELECT id FROM hb_users WHERE name=?");
        $st->execute([$name]);
        if ($st->fetch()) respond(409, 'Name bereits vergeben.');
        $pdo->prepare("INSERT INTO hb_users (name,pass_hash,ist_admin,muss_wechseln) VALUES(?,?,?,?)")
            ->execute([$name, password_hash($neu, PASSWORD_BCRYPT, ['cost' => 11]),
                       $alsAdmin ? 1 : 0, $alsAdmin ? 0 : 1]);
        respond(201, 'Konto angelegt.', ['id' => (int)$pdo->lastInsertId()]);
    }

    case 'user_list': {
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
        $rows = $pdo->query("SELECT u.id, u.name, u.ist_admin, u.muss_wechseln, u.angelegt_am,
                                    (SELECT COUNT(*) FROM hb_logins l WHERE l.user_id=u.id) AS angemeldet
                             FROM hb_users u ORDER BY u.name")->fetchAll();
        $m = $pdo->query("SELECT user_id, session_code, rolle FROM hb_mitglied")->fetchAll();
        respond(200, 'OK', ['users' => $rows, 'mitglied' => $m, 'admin_user' => adminName()]);
    }

    case 'user_reset': {
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
        $ziel = (int)($body['user_id'] ?? 0);
        $neu  = (string)($body['neu'] ?? '');
        if (!$ziel) respond(400, 'Kein Konto angegeben.');
        if (!validatePassword($neu)) respond(400, 'Passwort zu kurz (mind. 6 Zeichen).');
        $st = $pdo->prepare("UPDATE hb_users SET pass_hash=?, muss_wechseln=1 WHERE id=?");
        $st->execute([password_hash($neu, PASSWORD_BCRYPT, ['cost' => 11]), $ziel]);
        if ($st->rowCount() === 0) respond(404, 'Konto nicht gefunden.');
        // Ein zurueckgesetztes Passwort beendet die offenen Anmeldungen.
        $pdo->prepare("DELETE FROM hb_logins WHERE user_id=?")->execute([$ziel]);
        respond(200, 'Passwort zurückgesetzt. Es muss beim ersten Anmelden geändert werden.');
    }

    case 'member_set': {
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
        $ziel  = (int)($body['user_id'] ?? 0);
        $gcode = trim((string)($body['gruppe'] ?? ''));
        $rolle = (string)($body['rolle'] ?? '');
        if (!$ziel || !validateCode($gcode)) respond(400, 'Konto oder Gruppe fehlt.');
        if ($rolle === '') {
            $pdo->prepare("DELETE FROM hb_mitglied WHERE user_id=? AND session_code=?")
                ->execute([$ziel, $gcode]);
            respond(200, 'Aus der Gruppe genommen.');
        }
        if ($rolle !== 'spieler' && $rolle !== 'dm') respond(400, 'Unbekannte Rolle.');
        sitzungsZeile($pdo, $gcode);                       // 404, wenn es die Gruppe nicht gibt
        $st = $pdo->prepare("SELECT id FROM hb_users WHERE id=?");
        $st->execute([$ziel]);
        if (!$st->fetch()) respond(404, 'Konto nicht gefunden.');
        $pdo->prepare("INSERT INTO hb_mitglied (user_id,session_code,rolle) VALUES(?,?,?)
                       ON DUPLICATE KEY UPDATE rolle=VALUES(rolle)")
            ->execute([$ziel, $gcode, $rolle]);
        respond(200, 'Rolle gesetzt.');
    }

    // Wem ein Bogen gehoert, bestimmt die Spielleitung. Ein Spieler kann
    // sich keinen nehmen — sonst waere der Besitz nur eine Anzeige.
    case 'char_owner_set': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugangDm($pdo, $code, $pass, $dmPass, $body);
        $charId = (string)($body['char_id'] ?? '');
        if ($charId === '') respond(400, 'Fehlende char_id.');
        // Zuordnen darf nur, wer das Abenteuer dieses Helden leitet.
        $cs = $pdo->prepare("SELECT adv_id FROM hb_chars WHERE session_code=? AND char_id=?");
        $cs->execute([$code, $charId]);
        $cr = $cs->fetch();
        if (!$cr) respond(404, 'Bogen nicht gefunden.');
        if (!istDmVon($pdo, $z, $code, (string)($cr['adv_id'] ?? ''))) {
            respond(403, 'Dieses Abenteuer leitet jemand anderes.');
        }
        $owner = $body['owner'] ?? null;
        if ($owner === null || $owner === '' || (int)$owner === 0) {
            $pdo->prepare("UPDATE hb_chars SET owner=NULL WHERE session_code=? AND char_id=?")
                ->execute([$code, $charId]);
            respond(200, 'Zuordnung aufgehoben.');
        }
        // Nur an jemanden, der auch in der Gruppe ist — ein Bogen, der
        // einem Fremden gehoert, waere fuer alle gesperrt.
        $st = $pdo->prepare("SELECT rolle FROM hb_mitglied WHERE user_id=? AND session_code=?");
        $st->execute([(int)$owner, $code]);
        if (!$st->fetch()) respond(404, 'Dieses Konto gehört nicht zu der Gruppe.');
        $up = $pdo->prepare("UPDATE hb_chars SET owner=? WHERE session_code=? AND char_id=?");
        $up->execute([(int)$owner, $code, $charId]);
        if ($up->rowCount() === 0) {
            // rowCount ist auch 0, wenn derselbe Besitzer schon dastand.
            $pr = $pdo->prepare("SELECT owner FROM hb_chars WHERE session_code=? AND char_id=?");
            $pr->execute([$code, $charId]);
            $vor = $pr->fetch();
            if (!$vor) respond(404, 'Bogen nicht gefunden.');
        }
        respond(200, 'Zugeordnet.');
    }

    // Ein Konto entfernen. Was daran haengt, wird nicht mitgeloescht:
    // Boegen verlieren ihren Besitzer, statt fuer alle gesperrt
    // liegenzubleiben, und Logzeilen behalten ihren Inhalt und verlieren
    // die Kennung. Die Kampagnenhistorie gehoert der Runde, nicht dem
    // Einzelnen — Loecher darin waeren fuer alle ein Verlust.
    case 'user_delete': {
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
        $ziel = (int)($body['user_id'] ?? 0);
        if (!$ziel) respond(400, 'Kein Konto angegeben.');
        if ($ziel === (int)$u['id']) respond(400, 'Das eigene Konto lässt sich nicht löschen.');
        $st = $pdo->prepare("SELECT name FROM hb_users WHERE id=?");
        $st->execute([$ziel]);
        $z = $st->fetch();
        if (!$z) respond(404, 'Konto nicht gefunden.');
        // Der Name aus der Konfiguration bleibt: ohne ihn kaeme niemand
        // mehr in die Verwaltung, ausser ueber die Datenbank.
        if (adminName() !== '' && (string)$z['name'] === adminName()) {
            respond(400, 'Dieses Konto steht in der Konfiguration und bleibt.');
        }
        $pdo->prepare("UPDATE hb_chars SET owner=NULL WHERE owner=?")->execute([$ziel]);
        $pdo->prepare("UPDATE hb_logs  SET user_id=NULL WHERE user_id=?")->execute([$ziel]);
        $pdo->prepare("DELETE FROM hb_users WHERE id=?")->execute([$ziel]);
        respond(200, 'Konto gelöscht.');
    }

    // Was ueber mich gespeichert ist. Beantwortet die Frage, bevor sie
    // gestellt wird — und ist, wenn der Adminbereich einmal steht, dort
    // ohnehin fast fertig.
    case 'my_data': {
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        $st = $pdo->prepare("SELECT session_code, rolle, seit FROM hb_mitglied WHERE user_id=?");
        $st->execute([(int)$u['id']]);
        $gruppen = $st->fetchAll();
        $st = $pdo->prepare("SELECT session_code, char_id, adv_id FROM hb_chars WHERE owner=?");
        $st->execute([(int)$u['id']]);
        $boegen = $st->fetchAll();
        $st = $pdo->prepare("SELECT id, session_code, char_name, tab, action, adv_id, created_at
                             FROM hb_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 2000");
        $st->execute([(int)$u['id']]);
        $zeilen = $st->fetchAll();
        $st = $pdo->prepare("SELECT angelegt_am, zuletzt FROM hb_logins WHERE user_id=? ORDER BY zuletzt DESC");
        $st->execute([(int)$u['id']]);
        respond(200, 'OK', [
            'konto'      => ['id' => (int)$u['id'], 'name' => $u['name'], 'ist_admin' => istAdmin($u)],
            'gruppen'    => $gruppen,
            'boegen'     => $boegen,
            'anmeldungen'=> $st->fetchAll(),
            'log'        => $zeilen,
            'log_zeilen' => count($zeilen),
        ]);
    }

    // Wie lange das Log stehen bleibt. Null oder nichts heisst: Vorgabe.
    case 'log_frist_set': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
        $tage = (int)($body['tage'] ?? 0);
        if ($tage !== 0 && ($tage < 7 || $tage > 3650)) respond(400, 'Zwischen 7 und 3650 Tagen.');
        sitzungsZeile($pdo, $code);
        $pdo->prepare("UPDATE hb_sessions SET log_tage=? WHERE code=?")
            ->execute([$tage ?: null, $code]);
        if ($tage) {
            $pdo->prepare("DELETE FROM hb_logs WHERE session_code=? AND created_at < (NOW() - INTERVAL ? DAY)")
                ->execute([$code, $tage]);
        }
        respond(200, 'Aufbewahrung gesetzt.', ['tage' => $tage ?: LOG_TAGE_STANDARD]);
    }

    // Wer ein Abenteuer leitet, bestimmt die Verwaltung. Eine leere Liste
    // heisst "niemand eingetragen" und damit wieder: jede Spielleitung der
    // Gruppe.
    case 'adv_dm_set': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $u = nutzerAusToken($pdo, (string)($body['token'] ?? ''));
        if (!istAdmin($u)) respond(403, 'Das darf nur die Verwaltung.');
        $advId = trim((string)($body['adv_id'] ?? ''));
        if ($advId === '' || strlen($advId) > 50) respond(400, 'Kein Abenteuer angegeben.');
        $ids = $body['user_ids'] ?? [];
        if (!is_array($ids)) respond(400, 'user_ids muss eine Liste sein.');
        sitzungsZeile($pdo, $code);
        $pdo->prepare("DELETE FROM hb_adv_dm WHERE session_code=? AND adv_id=?")->execute([$code, $advId]);
        $ein = $pdo->prepare("INSERT INTO hb_adv_dm (session_code,adv_id,user_id) VALUES(?,?,?)");
        $pruef = $pdo->prepare("SELECT rolle FROM hb_mitglied WHERE user_id=? AND session_code=?");
        foreach ($ids as $id) {
            $id = (int)$id;
            if (!$id) continue;
            // Nur, wer in der Gruppe ist. Ein Fremder als Spielleitung
            // waere eine Zuordnung, die niemand mehr aufloesen kann.
            $pruef->execute([$id, $code]);
            if (!$pruef->fetch()) respond(404, 'Ein Konto gehört nicht zu der Gruppe.');
            $ein->execute([$code, $advId, $id]);
        }
        respond(200, 'Spielleitung gesetzt.', ['adv_dms' => (object)advDmKarte($pdo, $code)]);
    }

    // Wer gehoert zu dieser Gruppe. Die Spielleitung braucht das zum
    // Zuordnen; die ganze Kontenliste bleibt der Verwaltung vorbehalten.
    case 'member_list': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        $st = $pdo->prepare("SELECT u.id, u.name, m.rolle FROM hb_mitglied m
                             JOIN hb_users u ON u.id = m.user_id
                             WHERE m.session_code=? ORDER BY u.name");
        $st->execute([$code]);
        respond(200, 'OK', ['mitglieder' => $st->fetchAll()]);
    }

    // -- Der Kampf auf dem Server -----------------------------------
    // Bis v4.4 lag der Kampf allein im Geraet der Spielleitung. Das war
    // richtig, solange ihn niemand sonst brauchte. Damit die Runde
    // mitsehen kann, muss er dorthin, wo alle hinsehen koennen — und
    // genau da beginnt die Arbeit: was die Spielleitung sieht, ist nicht
    // das, was ein Spieler sehen darf.
    //
    // Deshalb kennt der Server zwei Fassungen. Die ganze bekommt, wer das
    // Abenteuer leitet. Alle anderen bekommen eine, aus der die Zahlen
    // heraus sind: bei Gegnern immer, bei den Helden richtet es sich nach
    // derselben Regel wie im Bogen. Gefiltert wird hier und nicht im
    // Browser — was einmal ausgeliefert ist, ist heraussen.
    case 'kampf_setzen': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $advId = (string)($body['adv_id'] ?? '');
        if ($advId === '') respond(400, 'Fehlendes Abenteuer.');
        $z = zugang($pdo, $code, $pass, $body);
        if (!istDmVon($pdo, $z, $code, $advId)) {
            respond(403, 'Dieses Abenteuer leitet jemand anderes.');
        }
        $k = $body['kampf'] ?? null;
        // null raeumt ab: der Kampf ist vorbei, es gibt nichts mehr zu sehen.
        if ($k === null) {
            $pdo->prepare("DELETE FROM hb_kampf WHERE session_code=? AND adv_id=?")
                ->execute([$code, $advId]);
            respond(200, 'Kampf beendet.', ['stand' => 0]);
        }
        if (!is_array($k)) respond(400, 'Kampf hat das falsche Format.');
        // Zwei schreiben an demselben Kampf: die Spielleitung den ganzen,
        // der Spieler nur seine Ansage. Wer die Ansagen nicht mitschickt,
        // will sie auch nicht loeschen — dieselbe Regel wie bei den
        // Trefferpunkten, und aus demselben Grund.
        if (!array_key_exists('ansagen', $k)) {
            $alt = $pdo->prepare("SELECT kampf_json FROM hb_kampf WHERE session_code=? AND adv_id=?");
            $alt->execute([$code, $advId]);
            $vorher = json_decode((string)($alt->fetchColumn() ?: ''), true);
            if (is_array($vorher) && !empty($vorher['ansagen'])) $k['ansagen'] = $vorher['ansagen'];
        }
        $json = json_encode($k, JSON_UNESCAPED_UNICODE);
        // Bilder gehoeren nicht in den Kampf: er wird waehrend eines
        // Gefechts im Sekundentakt geschrieben. Der Tracker laesst sie
        // deshalb weg, und diese Grenze haelt es auch dann klein, wenn
        // eine aeltere Fassung es nicht tut.
        if (strlen($json) > MAX_KAMPF_BYTES) respond(413, 'Kampf zu groß.');
        $pdo->prepare("INSERT INTO hb_kampf (session_code,adv_id,kampf_json,stand)
                       VALUES(?,?,?,1)
                       ON DUPLICATE KEY UPDATE kampf_json=VALUES(kampf_json), stand=stand+1")
            ->execute([$code, $advId, $json]);
        $st = $pdo->prepare("SELECT stand FROM hb_kampf WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        respond(200, 'Kampf gespeichert.', ['stand' => (int)($st->fetchColumn() ?: 1)]);
    }

    // Der Spieler sagt an, was er tut. Die Zahlen bleiben bei der
    // Spielleitung — hier kommt nur an, WAS jemand vorhat: Waffe oder
    // Zauber, auf wen, und ein Satz dazu.
    //
    // Drei Grenzen, alle auf dem Server: es geht nur zum eigenen Bogen,
    // nur wenn dieser Held im Kampf steht, und es kann nichts anderes
    // veraendern als die Liste der Ansagen. Wer den Kampf schreiben will,
    // braucht kampf_setzen — und das darf nur die Spielleitung.
    case 'kampf_eintrag': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $advId  = (string)($body['adv_id'] ?? '');
        $charId = (string)($body['char_id'] ?? '');
        if ($advId === '' || $charId === '') respond(400, 'Fehlende Daten.');
        $z = zugang($pdo, $code, $pass, $body);

        // Der Bogen muss ihm gehoeren. Die Spielleitung darf ohnehin
        // ueber ihr eigenes Fenster und braucht diesen Weg nicht.
        $cs = $pdo->prepare("SELECT owner FROM hb_chars WHERE session_code=? AND char_id=?");
        $cs->execute([$code, $charId]);
        $cr = $cs->fetch();
        if (!$cr) respond(404, 'Bogen nicht gefunden.');
        $eigen = $z['user'] && $cr['owner'] !== null && (int)$cr['owner'] === (int)$z['user']['id'];
        if (!$eigen && !istDmVon($pdo, $z, $code, $advId)) {
            respond(403, 'Das ist nicht dein Bogen.');
        }

        $st = $pdo->prepare("SELECT kampf_json, stand FROM hb_kampf WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(404, 'Hier läuft gerade kein Kampf.');
        $k = json_decode($row['kampf_json'], true);
        if (!is_array($k)) respond(404, 'Hier läuft gerade kein Kampf.');

        $drin = false;
        foreach ((array)($k['teilnehmer'] ?? []) as $t) {
            if (is_array($t) && (string)($t['charId'] ?? '') === $charId) { $drin = true; break; }
        }
        if (!$drin) respond(403, 'Dieser Held steht nicht in diesem Kampf.');

        $a = $body['ansage'] ?? null;
        if (!is_array($a)) respond(400, 'Fehlende Ansage.');
        // Es wird genommen, was gebraucht wird — nicht, was geschickt
        // wurde. Sonst schriebe ein Spieler ueber diesen Weg Felder in
        // den Kampf, die ihm nicht gehoeren.
        $sauber = [
            'id'     => bin2hex(random_bytes(6)),
            'charId' => $charId,
            'art'    => in_array((string)($a['art'] ?? ''), ['angriff','zauber','frei'], true)
                        ? (string)$a['art'] : 'frei',
            'was'    => mb_substr(trim((string)($a['was'] ?? '')), 0, 80),
            'grad'   => max(0, min(9, (int)($a['grad'] ?? 0))),
            'text'   => mb_substr(trim((string)($a['text'] ?? '')), 0, 500),
            'ziele'  => [],
            'zeit'   => time(),
        ];
        foreach ((array)($a['ziele'] ?? []) as $zid) {
            if (count($sauber['ziele']) >= 12) break;
            $sauber['ziele'][] = mb_substr((string)$zid, 0, 60);
        }
        if ($sauber['was'] === '' && $sauber['text'] === '' && !$sauber['ziele']) {
            respond(400, 'Da steht nichts drin.');
        }

        $liste = (array)($k['ansagen'] ?? []);
        $liste[] = $sauber;
        // Was aelter ist als die letzten zwei Dutzend, hat niemand mehr
        // gelesen — und der Kampf soll klein bleiben.
        if (count($liste) > 24) $liste = array_slice($liste, -24);
        $k['ansagen'] = $liste;

        $json = json_encode($k, JSON_UNESCAPED_UNICODE);
        if (strlen($json) > MAX_KAMPF_BYTES) respond(413, 'Kampf zu groß.');
        $pdo->prepare("UPDATE hb_kampf SET kampf_json=?, stand=stand+1
                       WHERE session_code=? AND adv_id=?")
            ->execute([$json, $code, $advId]);
        respond(200, 'Angesagt.', ['ansage' => $sauber]);
    }

    // Was ein Geraet alle paar Sekunden fragt. Die Antwort ist klein: der
    // Stand ist eine Zahl, und nur wenn sie sich geaendert hat, lohnt der
    // Blick auf den Rest. Wer "seit" mitschickt und schon den neuesten
    // Stand hat, bekommt nur die Zahl zurueck.
    case 'kampf_stand': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $advId = (string)($body['adv_id'] ?? '');
        if ($advId === '') respond(400, 'Fehlendes Abenteuer.');
        $z = zugang($pdo, $code, $pass, $body);
        $st = $pdo->prepare("SELECT kampf_json, stand FROM hb_kampf WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(200, 'OK', ['stand' => 0, 'kampf' => null, 'dm' => false]);
        $stand = (int)$row['stand'];
        $seit  = isset($body['seit']) ? (int)$body['seit'] : -1;
        $dm    = istDmVon($pdo, $z, $code, $advId);
        $k = json_decode($row['kampf_json'], true);
        // Die Spielleitung schreibt den Kampf selbst; sie braucht ihn
        // nicht zurueck. Was sie braucht, sind die Ansagen der Runde.
        if ($dm && ($body['nur'] ?? '') === 'ansagen') {
            respond(200, 'OK', ['stand' => $stand, 'dm' => true,
                                'ansagen' => array_values((array)(is_array($k) ? ($k['ansagen'] ?? []) : []))]);
        }
        if (!is_array($k)) respond(200, 'OK', ['stand' => $stand, 'kampf' => null, 'dm' => $dm]);
        // Erst die Sichtbarkeit, dann die Abkuerzung: wird die Freigabe
        // zurueckgenommen, aendert das den Stand des Kampfes nicht — die
        // Antwort muss es trotzdem sofort sagen.
        if (!$dm) {
            // Zwei Gruende, warum ein Spieler nichts sieht: das Abenteuer
            // zeigt den Kampf grundsaetzlich nicht, oder die Spielleitung
            // hat ihn noch nicht freigegeben. Beides wird hier
            // entschieden und nicht im Browser.
            $sicht = kampfSichtImAbenteuer($pdo, $code, $advId);
            if ($sicht === 'aus' || ($sicht === 'ansage' && empty($k['gezeigt']))) {
                respond(200, 'OK', ['stand' => $stand, 'kampf' => null,
                                    'dm' => false, 'sicht' => $sicht]);
            }
            // Wer schon den neuesten Stand hat, braucht den Rest nicht.
            if ($seit === $stand) respond(200, 'OK', ['stand' => $stand, 'dm' => false, 'sicht' => $sicht]);
            $k = kampfFuerSpieler($k, tpOffenImAbenteuer($pdo, $code, $advId));
            respond(200, 'OK', ['stand' => $stand, 'kampf' => $k, 'dm' => false, 'sicht' => $sicht]);
        }
        if ($seit === $stand) respond(200, 'OK', ['stand' => $stand, 'dm' => true]);
        respond(200, 'OK', ['stand' => $stand, 'kampf' => $k, 'dm' => true]);
    }

    default:
        respond(400, 'Unbekannte Aktion.');
}
