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
// Die Bibliothek einer Runde waechst ueber Jahre und wird als Ganzes
// geschrieben. 2 MB waren nach der Wiederherstellung der Sammlung —
// 288 Zauber, 208 Gegenstaende, 85 Tierverwandlungen — auf 60 KB genau
// erreicht: der naechste Gegenstand ging nicht mehr durch. Die Spalte
// ist LONGTEXT und traegt Groesseres muehelos; die Grenze steht gegen
// Unfug, nicht gegen Wachstum. 6 MB bleiben unter dem, was PHP an einer
// Anfrage ueblicherweise durchlaesst (post_max_size, meist 8 MB).
define('MAX_LIB_BYTES',   6000000);  // 6MB Bibliothek
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

// Faellt irgendwo eine Ausnahme durch, kam bisher eine HTML-Fehlerseite
// mit Status 200 zurueck. Der Client liest daraus kein JSON, meldet
// „unbekannter Fehler" und laesst jeden im Dunkeln — genau so ist eine
// zu grosse Bibliothek als raetselhafter Fehlschlag geendet statt als
// Satz, der sagt, woran es lag. Die Meldung steht mit drin: dies ist der
// Server der eigenen Runde, und ohne sie sucht man Stunden.
set_exception_handler(function (Throwable $e) {
    if (!headers_sent()) http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Serverfehler: ' . $e->getMessage()],
                     JSON_UNESCAPED_UNICODE);
    exit;
});

$raw  = file_get_contents('php://input');
// Eine Anfrage, die groesser ist als post_max_size, kommt leer oder
// abgeschnitten an. „Ungültiges JSON" waere dann die falsche Auskunft
// und schickt jeden in die falsche Richtung — der Vergleich mit der
// angekuendigten Laenge sagt, was wirklich los ist.
$angekuendigt = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($angekuendigt > 0 && strlen($raw) < $angekuendigt) {
    respond(413, 'Die Anfrage kam abgeschnitten an: ' . strlen($raw) . ' von '
        . $angekuendigt . ' Bytes. Der Server nimmt keine so große Anfrage an '
        . '(post_max_size in der PHP-Konfiguration).');
}
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

    CREATE TABLE IF NOT EXISTS hb_beute (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        beute_json   TEXT        NOT NULL,
        stand        BIGINT      NOT NULL DEFAULT 1,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, adv_id),
        CONSTRAINT fk_hbb_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS hb_proben (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        probe_json   TEXT        NOT NULL,
        stand        BIGINT      NOT NULL DEFAULT 1,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, adv_id),
        CONSTRAINT fk_hbp_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
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

    -- Post an die Spielleitung: ein Satz, den die Runde nicht lesen soll —
    -- „ich stecke den Ring heimlich ein“. Je Abenteuer, je Held, und wer
    -- ihn geschrieben hat. gelesen setzt nur die Spielleitung.
    CREATE TABLE IF NOT EXISTS hb_post (
        id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20)  NOT NULL,
        adv_id       VARCHAR(50)  NOT NULL,
        char_id      VARCHAR(50)  NOT NULL,
        char_name    VARCHAR(100) NOT NULL DEFAULT '',
        user_id      INT          NOT NULL,
        text         TEXT         NOT NULL,
        gelesen      TINYINT(1)   NOT NULL DEFAULT 0,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_post_adv (session_code, adv_id, created_at),
        CONSTRAINT fk_hbpo_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Eine Rast je Abenteuer: kurz oder lang, unter welchen Umstaenden,
    -- und wer sie schon in seinen Bogen uebernommen hat.
    CREATE TABLE IF NOT EXISTS hb_rast (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        rast_json    TEXT        NOT NULL,
        stand        BIGINT      NOT NULL DEFAULT 1,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, adv_id),
        CONSTRAINT fk_hbra_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- ── Das Sitzungstagebuch ────────────────────────────────
    -- Ein Abend, ein Eintrag je Person, die Bilder gemeinsam. Die
    -- Bilder liegen nicht hier, sondern als Dateien in der Ablage —
    -- derselbe Ordner, den der Planer benutzt, nur mit eigener Kennung.
    CREATE TABLE IF NOT EXISTS hb_tagebuch (
        id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20)  NOT NULL,
        adv_id       VARCHAR(50)  NOT NULL,
        sitzung_id   VARCHAR(50)  NOT NULL,
        datum        DATE         NOT NULL,
        titel        VARCHAR(160) NOT NULL DEFAULT '',
        spielzeit    VARCHAR(80)  NOT NULL DEFAULT '',
        ablage       CHAR(32)     NOT NULL,
        user_id      INT          NOT NULL,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tb (session_code, sitzung_id),
        KEY idx_tb_adv (session_code, adv_id, datum),
        CONSTRAINT fk_hbtb_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Je Person ein Eintrag je Sitzung. nur_dm gehoert der Spielleitung:
    -- was sie so kennzeichnet, schickt der Server den Spielern nicht.
    CREATE TABLE IF NOT EXISTS hb_tb_eintrag (
        id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20)  NOT NULL,
        sitzung_id   VARCHAR(50)  NOT NULL,
        user_id      INT          NOT NULL,
        user_name    VARCHAR(100) NOT NULL DEFAULT '',
        char_id      VARCHAR(50)  NOT NULL DEFAULT '',
        char_name    VARCHAR(100) NOT NULL DEFAULT '',
        text         MEDIUMTEXT   NOT NULL,
        nur_dm       TINYINT(1)   NOT NULL DEFAULT 0,
        updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tbe (session_code, sitzung_id, user_id),
        CONSTRAINT fk_hbtbe_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Die Bilder haengen an der Sitzung, nicht am Eintrag: der Abend hat
    -- sie gemeinsam erlebt.
    CREATE TABLE IF NOT EXISTS hb_tb_bild (
        id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(20)  NOT NULL,
        sitzung_id   VARCHAR(50)  NOT NULL,
        datei        VARCHAR(80)  NOT NULL,
        titel        VARCHAR(160) NOT NULL DEFAULT '',
        bytes        INT          NOT NULL DEFAULT 0,
        user_id      INT          NOT NULL,
        user_name    VARCHAR(100) NOT NULL DEFAULT '',
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_tbb (session_code, sitzung_id, id),
        CONSTRAINT fk_hbtbb_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- ── Abenteuerplaner ─────────────────────────────────────
    -- Karten und alles, was darauf liegt, je Abenteuer. Die Bilder
    -- liegen nicht hier, sondern als Dateien unter planer-dateien/ —
    -- ablage ist der zufaellige Ordnername einer Karte. sichtbar
    -- entscheidet der Server, nicht die Anwendung: was ein Spieler nicht
    -- sehen soll, geht gar nicht erst hinaus.
    CREATE TABLE IF NOT EXISTS hb_plan_karte (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        karte_id     VARCHAR(50) NOT NULL,
        ablage       CHAR(32)    NOT NULL,
        sichtbar     TINYINT(1)  NOT NULL DEFAULT 0,
        karte_json   MEDIUMTEXT  NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, karte_id),
        KEY idx_plank_adv (session_code, adv_id),
        CONSTRAINT fk_hbpk_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Orte, Routen, Figuren, Regionen: eine Tabelle, die Art steht dabei.
    CREATE TABLE IF NOT EXISTS hb_plan_obj (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        obj_id       VARCHAR(50) NOT NULL,
        karte_id     VARCHAR(50) NOT NULL,
        art          VARCHAR(20) NOT NULL,
        sichtbar     TINYINT(1)  NOT NULL DEFAULT 0,
        obj_json     MEDIUMTEXT  NOT NULL,
        updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (session_code, obj_id),
        KEY idx_plano_karte (session_code, karte_id),
        KEY idx_plano_adv (session_code, adv_id),
        CONSTRAINT fk_hbpo2_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- Zaehlt jede Aenderung am Planer eines Abenteuers. Ein Geraet fragt
    -- nur die Zahl und laedt erst, wenn sie sich bewegt hat.
    CREATE TABLE IF NOT EXISTS hb_plan_stand (
        session_code VARCHAR(20) NOT NULL,
        adv_id       VARCHAR(50) NOT NULL,
        stand        BIGINT      NOT NULL DEFAULT 1,
        PRIMARY KEY (session_code, adv_id),
        CONSTRAINT fk_hbps_session FOREIGN KEY (session_code) REFERENCES hb_sessions(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
// Wie lange eine Probe auf Ansage offen steht, bevor sie von selbst
// verschwindet. Eine Viertelstunde: laenger wuerfelt niemand nach.
const PROBE_FRIST = 900;

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
// Die Boegen, die diesem Konto gehoeren — fuer alles, was nur der eigene
// Held sehen darf.
function eigeneBoegen(PDO $pdo, string $code, array $z): array {
    if (empty($z['user'])) return [];
    $st = $pdo->prepare("SELECT char_id FROM hb_chars WHERE session_code=? AND owner=?");
    $st->execute([$code, (int)$z['user']['id']]);
    return array_map('strval', $st->fetchAll(PDO::FETCH_COLUMN));
}

function kampfFuerSpieler(array $k, bool $hpOffen, array $eigeneChars = []): array {
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
        // Ein NSC steht zwar auf einem Bogen, aber auf keinem, den ein
        // Spieler hat. Er geht deshalb hinaus wie ein Gegner: Name und
        // grober Stand. Nur beim Verbuendeten steht dabei, dass er einer
        // ist — der Widersacher ist fuer die Runde erst einmal ein Gegner
        // wie jeder andere.
        $lager = (string)($t['lager'] ?? '');
        $held = (string)($t['art'] ?? '') === 'held' && $lager === '';
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
            if ($lager === 'verbuendet') $e['lager'] = 'verbuendet';
        }
        $teil[] = $e;
    }
    $raus['teilnehmer'] = $teil;
    // Was laeuft — aber nur, was Helden gewirkt haben. Was ein Gegner
    // haelt, soll die Runde am Tisch herausfinden und nicht im Fenster
    // ablesen. Auch der Name eines Gegners als Ziel bleibt, was er ist:
    // sichtbar steht der Gegner ohnehin in der Reihe.
    $lauf = [];
    foreach ((array)($k['laufend'] ?? []) as $w) {
        if (!is_array($w) || (string)($w['seite'] ?? '') !== 'held') continue;
        $lauf[] = [
            'id'       => (string)($w['id'] ?? ''),
            'vonId'    => (string)($w['vonId'] ?? ''),
            'von'      => (string)($w['von'] ?? ''),
            'seite'    => 'held',
            'name'     => (string)($w['name'] ?? ''),
            'konz'     => !empty($w['konz']),
            'bisRunde' => isset($w['bisRunde']) && $w['bisRunde'] !== null ? (int)$w['bisRunde'] : null,
            'zielIds'  => array_values(array_map('strval', (array)($w['zielIds'] ?? []))),
        ];
    }
    $raus['laufend'] = $lauf;
    // Die Karte, wenn die Spielleitung sie zeigt. Der Tracker filtert
    // die verborgenen Figuren schon vor dem Senden heraus; hier steht
    // dieselbe Grenze noch einmal, damit eine aeltere Fassung des
    // Browsers nichts durchlaesst, was sie nicht durchlassen soll.
    $karte = $k['karte'] ?? null;
    if (is_array($karte) && !empty($karte['zeigen'])
        && (int)($karte['breite'] ?? 0) > 0 && (int)($karte['hoehe'] ?? 0) > 0) {
        $weg = array_flip(array_map('strval', (array)($karte['verborgen'] ?? [])));
        $figuren = [];
        foreach ((array)($karte['figuren'] ?? []) as $id => $f) {
            if (!is_array($f) || isset($weg[(string)$id])) continue;
            $figuren[(string)$id] = ['x' => (int)($f['x'] ?? 0),
                                     'y' => (int)($f['y'] ?? 0),
                                     'k' => (string)($f['k'] ?? '??')];
        }
        $raus['karte'] = [
            'breite'     => (int)$karte['breite'],
            'hoehe'      => (int)$karte['hoehe'],
            'feldMeter'  => (float)($karte['feldMeter'] ?? 1.5),
            'gelaende'   => (string)($karte['gelaende'] ?? ''),
            'figuren'    => $figuren,
            'zeigen'     => true,
        ];
    }
    // Die Ansagen gehen an alle zurueck: der Spieler soll sehen, dass
    // seine angekommen ist, und die Runde sieht, wer schon angesagt hat.
    // Geheime Ansagen nur an den, dessen Held sie gemacht hat.
    $ans = [];
    foreach ((array)($k['ansagen'] ?? []) as $a) {
        if (!is_array($a)) continue;
        if (!empty($a['geheim']) && !in_array((string)($a['charId'] ?? ''), $eigeneChars, true)) continue;
        $ans[] = $a;
    }
    $raus['ansagen'] = $ans;
    // Ob die Helden ihre Zahlen sehen duerfen, entscheidet weiter der
    // Bogen. Der Kampf sagt nur, was fuer dieses Abenteuer gilt, damit
    // ein Spielergeraet nicht raten muss.
    $raus['hpOffen'] = $hpOffen;
    return $raus;
}

// ── Das Sitzungstagebuch ────────────────────────────────────────
// Ein Bild darf so gross sein wie ein Handyfoto (der Browser rechnet es
// vorher ohnehin kleiner).
const TB_MAX_BILD   = 12000000;
// Hochgeladen wird stueckweise (tagebuch_stueck): jede Anfrage traegt
// hoechstens 4 MB, als Base64 rund 5,6 MB. Die Grenze fuer ein Video haengt
// deshalb nicht mehr an post_max_size (bis v5.24 waren es 32 MB am Stueck),
// sondern am Platz auf dem Webspace und der Geduld beim Hochladen.
const TB_STUECK     = 4194304;
const TB_MAX_VIDEO  = 1073741824;   // 1 GB
const TB_TEIL_ALTER     = 86400;           // halbe Uploads nach einem Tag weg
const TB_MAX_TEXT   = 60000;
const TB_BILD_ARTEN = ['png' => 'png', 'jpg' => 'jpg', 'jpeg' => 'jpg', 'webp' => 'webp'];
// Nur, was ein Browser von sich aus abspielt. MOV und MKV bleiben
// draussen: sie laden hoch und laufen dann bei der Haelfte der Runde nicht.
const TB_VIDEO_ARTEN = ['mp4' => 'mp4', 'm4v' => 'mp4', 'webm' => 'webm', 'ogv' => 'ogv'];

// Stimmt der Inhalt mit der Endung? Bei Bildern prueft das der Planer
// schon (planInhaltPasst); Videos tragen ihre Kennung ebenso vorn.
function tbInhaltPasst(string $art, string $daten): bool {
    switch ($art) {
        case 'mp4':  return strlen($daten) > 12 && substr($daten, 4, 4) === 'ftyp';
        case 'webm': return strncmp($daten, "\x1A\x45\xDF\xA3", 4) === 0;
        case 'ogv':  return strncmp($daten, 'OggS', 4) === 0;
    }
    return planInhaltPasst($art, $daten);
}
// Bild oder Video — die Endung entscheidet, und sie kommt vom Server.
function tbArtVon(string $endung): string {
    if (isset(TB_BILD_ARTEN[$endung]))  return 'bild';
    if (isset(TB_VIDEO_ARTEN[$endung])) return 'video';
    return '';
}

// Die Sitzung, oder nichts. Gesucht wird immer mit dem Abenteuer dabei —
// eine Kennung allein soll nicht in ein fremdes Abenteuer fuehren.
function tbSitzung(PDO $pdo, string $code, string $advId, string $id): ?array {
    $st = $pdo->prepare("SELECT * FROM hb_tagebuch WHERE session_code=? AND adv_id=? AND sitzung_id=?");
    $st->execute([$code, $advId, $id]);
    $r = $st->fetch();
    return $r ?: null;
}
// Wer aendern darf: wer es angelegt hat, und die Spielleitung. Dieselbe
// Regel wie beim Bogen — einseitig, und die Spielleitung kann immer.
function tbDarf(PDO $pdo, array $z, string $code, string $advId, int $wem): bool {
    if (empty($z['user'])) return true;
    if ((int)$z['user']['id'] === $wem) return true;
    return istDmVon($pdo, $z, $code, $advId);
}

// ── Wer darf welche Logzeilen sehen ─────────────────────────────
// Bisher hat der Browser gefiltert: die Antwort trug alles, und die
// Anwendung liess die Zeilen der DM-Helden weg. Wer sich die Antwort
// ansah, sah sie trotzdem. Jetzt entscheidet der Server.
function logFrist(?array $row): int {
    $t = (int)($row['log_tage'] ?? 0);
    return $t > 0 ? $t : LOG_TAGE_STANDARD;
}
// Wer welche verborgenen Boegen sehen darf. Verborgen (dm_only) sind die
// alten DM-Helden und alle NSC. Bisher hing das allein am Browser: der
// Server schickte sie jedem und die Anwendung liess sie weg. Wer sich die
// Antwort ansah, sah die Werte des Widersachers trotzdem.
//
// Dieselbe Regel wie ueberall: die Verwaltung sieht alles, wer ein
// Abenteuer leitet sieht dessen Boegen, und solange fuer ein Abenteuer
// niemand eingetragen ist, gilt die Rolle in der Gruppe.
function dmSichtPruefer(PDO $pdo, array $z, string $code): callable {
    if (!$z['user'] || $z['rolle'] === 'admin') return fn($adv) => true;
    $karte = advDmKarte($pdo, $code);
    $ich   = (int)$z['user']['id'];
    $istDm = $z['rolle'] === 'dm';
    return function ($adv) use ($karte, $ich, $istDm) {
        $a = (string)($adv ?? '');
        if ($a !== '' && !empty($karte[$a])) return in_array($ich, $karte[$a], true);
        return $istDm;
    };
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
// Wie gross eine einzelne Anweisung an die Datenbank sein darf,
// entscheidet nicht diese Datei, sondern der Datenbankserver:
// max_allowed_packet. Ist der kleiner als unsere eigene Grenze, ist er
// die Grenze — und dann soll das dastehen und nicht als Absturz enden.
function paketGrenze(PDO $pdo): int {
    static $wert = null;
    if ($wert === null) {
        try { $wert = (int)$pdo->query('SELECT @@max_allowed_packet')->fetchColumn(); }
        catch (Throwable $e) { $wert = 0; }
    }
    return $wert;
}
// Was neben der Bibliothek noch im Paket steckt — die Anweisung selbst,
// der Rest der Anfrage. 64 KB sind reichlich gerechnet.
function libGrenze(PDO $pdo): int {
    $paket = paketGrenze($pdo);
    return ($paket > 131072) ? min(MAX_LIB_BYTES, $paket - 65536) : MAX_LIB_BYTES;
}
// „Zu gross" allein sagt niemandem, ob zwei Zeilen fehlen oder das
// Doppelte — und schon gar nicht, wer die Grenze gesetzt hat.
function zuGross(string $was, int $ist, int $grenze): never {
    $mb = fn(int $n) => number_format($n / 1048576, 2, ',', '') . ' MB';
    respond(413, $was . ' zu groß: ' . $mb($ist) . ', erlaubt sind ' . $mb($grenze) . '.'
        . ($grenze < MAX_LIB_BYTES
            ? ' Diese Grenze setzt die Datenbank (max_allowed_packet), nicht das Heldenbuch.'
            : ''),
        ['grenze' => $grenze, 'groesse' => $ist]);
}
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
function loadAll(PDO $pdo, string $code, array $sessionRow, ?callable $dmSicht = null): array {
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
    $darfDm = $dmSicht ?: fn($adv) => true;
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
        // Der Bogen eines NSC oder DM-Helden verlaesst den Server nur in
        // Richtung Spielleitung. Der Stand (updated_at) zaehlt trotzdem
        // weiter — sonst haengt der Abgleich des Spielers an einer
        // Aenderung, die er nie zu sehen bekommt.
        if ((int)($r['dm_only'] ?? 0) === 1 && !$darfDm($r['adv_id'] ?? '')) {
            $ts = strtotime($r['updated_at']) * 1000;
            if ($ts > $latestTs) $latestTs = $ts;
            continue;
        }
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

// ── Abenteuerplaner ─────────────────────────────────────────────
// Die Dateien einer Karte liegen unter planer-dateien/<ablage>/. Der
// Ordnername ist zufaellig und 32 Zeichen lang: wer ihn nicht bekommt,
// findet die Kacheln nicht — und ein Spieler bekommt ihn nur fuer
// Karten, die sichtbar sind. Ausgeliefert werden sie vom Webserver
// direkt, weil eine Karte aus Tausenden Kacheln besteht und jede davon
// durch PHP zu schicken den Server in die Knie zwingt.
const PLAN_MAX_JSON   = 400000;     // eine Karte oder ein Ort, ohne Bilder
const PLAN_MAX_DATEI  = 25000000;   // eine einzelne Datei
const PLAN_ARTEN      = ['ort', 'route', 'reise', 'figur', 'region', 'notiz', 'tabelle', 'handout', 'quest', 'hinweis', 'fraktion', 'gruppe'];
// Was zum Abenteuer gehoert und nicht zu einer Karte. Einen eigenen
// Ordner fuer Dateien hat davon nur das Handout.
const PLAN_OHNE_KARTE = ['handout', 'quest', 'hinweis', 'fraktion'];
// Nur Namen, die der Planer selbst vergibt: Kleinbuchstaben, Ziffern,
// Strich und Unterstrich; Punkte nur vor der Endung. Damit gibt es kein
// .. und keine versteckte Datei, und die Endung ist immer eine der vier.
const PLAN_PFAD = '#^(?:[a-z0-9][a-z0-9_-]{0,40}/){0,6}[a-z0-9][a-z0-9_-]{0,60}\.(webp|png|jpg|jpeg|json)$#';

function planAblageWurzel(): string {
    return __DIR__ . '/planer-dateien';
}
function planId(string $id): bool {
    return preg_match('/^[A-Za-z0-9_-]{3,50}$/', $id) === 1;
}
function planStandHoch(PDO $pdo, string $code, string $advId): int {
    $pdo->prepare("INSERT INTO hb_plan_stand (session_code, adv_id, stand) VALUES(?,?,1)
                   ON DUPLICATE KEY UPDATE stand=stand+1")->execute([$code, $advId]);
    return planStand($pdo, $code, $advId);
}
function planStand(PDO $pdo, string $code, string $advId): int {
    $st = $pdo->prepare("SELECT stand FROM hb_plan_stand WHERE session_code=? AND adv_id=?");
    $st->execute([$code, $advId]);
    return (int)($st->fetchColumn() ?: 0);
}
// Was nur die Spielleitung liest, steht in jedem Eintrag unter dm.
// Eine Regel fuer alles, was noch kommt: Orte, Figuren, Tabellen.
function planOhneDm(array $o): array {
    unset($o['dm']);
    return $o;
}
// Der Ordner der Karte. Beim ersten Schreiben wird er angelegt, und mit
// ihm die Wurzel samt ihrer .htaccess — die verbietet Verzeichnislisten
// und das Ausfuehren von allem, was nach Programm aussieht. Hochladen
// laesst sich dergleichen ohnehin nicht, siehe PLAN_PFAD.
function planOrdner(string $ablage, bool $anlegen): string {
    if (!preg_match('/^[0-9a-f]{32}$/', $ablage)) respond(500, 'Ablage ungültig.');
    $wurzel = planAblageWurzel();
    if ($anlegen && !is_dir($wurzel)) {
        if (!@mkdir($wurzel, 0755, true) && !is_dir($wurzel)) respond(500, 'Der Ordner planer-dateien lässt sich nicht anlegen.');
    }
    if ($anlegen && !is_file($wurzel . '/.htaccess')) {
        @file_put_contents($wurzel . '/.htaccess',
            "Options -Indexes\n"
          . "<IfModule mod_mime.c>\n  RemoveHandler .php .phtml .phar .cgi .pl .py\n</IfModule>\n"
          . "<FilesMatch \"\\.(php|phtml|phar|cgi|pl|py|sh|htaccess)$\">\n  Require all denied\n</FilesMatch>\n"
          . "<IfModule mod_headers.c>\n  Header set X-Content-Type-Options nosniff\n</IfModule>\n");
    }
    $ordner = $wurzel . '/' . $ablage;
    if ($anlegen && !is_dir($ordner)) {
        if (!@mkdir($ordner, 0755, true) && !is_dir($ordner)) respond(500, 'Der Kartenordner lässt sich nicht anlegen.');
    }
    return $ordner;
}
function planOrdnerLeeren(string $ordner, bool $selbst): void {
    if (!is_dir($ordner)) return;
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($ordner, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($it as $f) { $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname()); }
    // Erst loslassen, dann loeschen: solange der Iterator den Ordner
    // offen haelt, weigert sich Windows, ihn zu entfernen — zurueck blieb
    // ein leerer Ordner je geloeschter Karte und je geloeschtem Abend.
    unset($it);
    clearstatcache(true, $ordner);
    if ($selbst) @rmdir($ordner);
}
// Stimmt der Inhalt mit der Endung? Ein Bild, das keines ist, bleibt
// draussen — auch dann, wenn es nur ein Versehen war.
function planInhaltPasst(string $endung, string $daten): bool {
    switch ($endung) {
        case 'png':  return strncmp($daten, "\x89PNG\r\n\x1a\n", 8) === 0;
        case 'jpg':
        case 'jpeg': return strncmp($daten, "\xFF\xD8\xFF", 3) === 0;
        case 'webp': return strlen($daten) > 12 && substr($daten, 0, 4) === 'RIFF' && substr($daten, 8, 4) === 'WEBP';
        case 'json': json_decode($daten); return json_last_error() === JSON_ERROR_NONE;
    }
    return false;
}
// Wohin die Dateien einer Anfrage gehoeren: in den Ordner einer Karte
// (karte_id) oder in den eigenen Ordner eines Handouts (obj_id). Ein
// Handout hat seinen eigenen, damit ein Spieler, der ein Handout bekommt,
// nicht den Ordner einer verborgenen Karte erfaehrt.
function planAblageAus(PDO $pdo, string $code, string $advId, array $body): string {
    $objId = (string)($body['obj_id'] ?? '');
    if ($objId !== '' && empty($body['karte_id'])) {
        $st = $pdo->prepare("SELECT art, obj_json FROM hb_plan_obj WHERE session_code=? AND adv_id=? AND obj_id=?");
        $st->execute([$code, $advId, $objId]);
        $r = $st->fetch();
        $o = $r ? (json_decode((string)$r['obj_json'], true) ?: []) : [];
        if (!$r || !preg_match('/^[0-9a-f]{32}$/', (string)($o['ablage'] ?? ''))) respond(404, 'Eintrag mit eigener Ablage nicht gefunden.');
        return (string)$o['ablage'];
    }
    return (string)planKarte($pdo, $code, $advId, (string)($body['karte_id'] ?? ''))['ablage'];
}

// Karte lesen und dabei pruefen, dass sie zu diesem Abenteuer gehoert.
function planKarte(PDO $pdo, string $code, string $advId, string $karteId): array {
    $st = $pdo->prepare("SELECT karte_id, ablage, sichtbar, karte_json FROM hb_plan_karte
                         WHERE session_code=? AND adv_id=? AND karte_id=?");
    $st->execute([$code, $advId, $karteId]);
    $r = $st->fetch();
    if (!$r) respond(404, 'Karte nicht gefunden.');
    return $r;
}
function planKarteAntwort(array $r, bool $dm): array {
    $k = json_decode((string)$r['karte_json'], true) ?: [];
    if (!$dm) $k = planOhneDm($k);
    return array_merge($k, ['id' => (string)$r['karte_id'], 'ablage' => (string)$r['ablage'],
                            'sichtbar' => (bool)$r['sichtbar']]);
}
function planObjAntwort(array $r, bool $dm): array {
    $o = json_decode((string)$r['obj_json'], true) ?: [];
    if (!$dm) $o = planOhneDm($o);
    // Die Spur einer Heldengruppe — wo sie ueberall war — bekommen Spieler
    // nur, wenn die Spielleitung sie fuer diese Gruppe freigibt. Sonst nur
    // den Punkt, an dem die Gruppe jetzt steht.
    if (!$dm && (string)$r['art'] === 'gruppe' && empty($o['spurFuerSpieler']) && is_array($o['spur'] ?? null) && $o['spur']) {
        $o['spur'] = [end($o['spur'])];
    }
    return array_merge($o, ['id' => (string)$r['obj_id'], 'karteId' => (string)$r['karte_id'],
                            'art' => (string)$r['art'], 'sichtbar' => (bool)$r['sichtbar']]);
}
// Die Felder, die in eigenen Spalten stehen, gehoeren nicht noch einmal
// ins JSON — sonst gaebe es zwei Wahrheiten.
function planJson(array $o, array $ohne): string {
    foreach ($ohne as $f) unset($o[$f]);
    $j = json_encode($o, JSON_UNESCAPED_UNICODE);
    if ($j === false) respond(400, 'Der Eintrag lässt sich nicht speichern.');
    if (strlen($j) > PLAN_MAX_JSON) respond(413, 'Der Eintrag ist zu groß (höchstens 400 KB ohne Bilder).');
    return $j;
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
        $z      = zugang($pdo, $code, $pass, $body);
        $row    = $z['row'];
        $result = loadAll($pdo, $code, $row, dmSichtPruefer($pdo, $z, $code));

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

        // Der Abgleich kennt kein Konto: seine Kennung gilt fuer die ganze
        // Gruppe. Deshalb bleiben die Lebenszeichen der verborgenen Boegen
        // hier ganz draussen — auch fuer die Spielleitung. Sie sieht sie
        // beim naechsten Laden, das ohnehin folgt, sobald sich etwas tut.
        $verborgen = [];
        $stV = $pdo->prepare("SELECT char_id FROM hb_chars WHERE session_code=? AND dm_only=1");
        $stV->execute([$code]);
        foreach ($stV->fetchAll() as $rv) $verborgen[(string)$rv['char_id']] = true;
        $st = $pdo->prepare("SELECT char_id, vitals_json FROM hb_vitals WHERE session_code=?");
        $st->execute([$code]);
        $vitals = [];
        foreach ($st as $r) {
            if (isset($verborgen[(string)$r['char_id']])) continue;
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
        zugang($pdo, $code, $pass, $body);
        if (strlen($libJson) > libGrenze($pdo)) zuGross('Bibliothek', strlen($libJson), libGrenze($pdo));
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
        zugangDm($pdo, $code, $pass, $dmPass, $body);
        if (strlen($json) > libGrenze($pdo)) zuGross('DM-Bibliothek', strlen($json), libGrenze($pdo));
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
        // Gesucht wird auch nach dem, der es getan hat: "wer hat den
        // Trank genommen" ist die haeufigere Frage als "was hiess er".
        if ($search) {
            $where[] = '(l.action LIKE ? OR l.char_name LIKE ? OR u.name LIKE ?)';
            $params[] = '%'.$search.'%'; $params[] = '%'.$search.'%'; $params[] = '%'.$search.'%';
        }
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

        // Der Name des Kontos kommt mit. LEFT JOIN mit Absicht: ein
        // geloeschtes Konto nimmt seine Zeilen nicht mit, sie verlieren
        // nur den Namen.
        $sql = 'SELECT l.id, l.char_id, l.char_name, l.tab, l.action, l.details, l.created_at,
                       l.user_id, l.adv_id, u.name AS user_name
                FROM hb_logs l LEFT JOIN hb_users u ON u.id = l.user_id
                WHERE '.implode(' AND ', $where).' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();
        foreach ($logs as &$l) {
            if ($l['details']) $l['details'] = json_decode($l['details'], true);
        }
        respond(200, 'OK', ['logs' => $logs, 'has_more' => count($logs) >= $limit, 'offset' => $offset]);

    // ── Die Beute ───────────────────────────────────────────────
    // Ein Fund je Abenteuer. Die Spielleitung legt ihn hin, die Gruppe
    // nimmt sich — jeder das, wozu er schreiben darf. Verteilt ist er
    // erst, wenn kein Stück mehr offen liegt; das entscheidet aber die
    // Oberflaeche, nicht der Server. Hier steht nur, was liegt.
    case 'beute_setzen':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $roh = $body['beute'] ?? null;
        if ($roh === null) {
            $pdo->prepare("DELETE FROM hb_beute WHERE session_code=? AND adv_id=?")
                ->execute([$code, $advId]);
            respond(200, 'Abgeräumt.');
        }
        if (!is_array($roh)) respond(400, 'Fehlende Beute.');
        $muenzen = [];
        foreach (['pp','gp','ep','sp','cp'] as $m) {
            $muenzen[$m] = max(0, min(999999, (int)(($roh['muenzen'] ?? [])[$m] ?? 0)));
        }
        $stuecke = [];
        foreach ((array)($roh['stuecke'] ?? []) as $st) {
            if (count($stuecke) >= 40) break;
            if (!is_array($st)) continue;
            $name = mb_substr(trim((string)($st['name'] ?? '')), 0, 80);
            if ($name === '') continue;
            $stuecke[] = [
                'id'     => bin2hex(random_bytes(5)),
                'name'   => $name,
                'anzahl' => max(1, min(999, (int)($st['anzahl'] ?? 1))),
                'notiz'  => mb_substr(trim((string)($st['notiz'] ?? '')), 0, 120),
                // Was ein Stueck wert ist, in Kupfer. Kommt es als Unsinn,
                // ist es eben nichts wert.
                'wert'   => max(0, min(100000000, (int)($st['wert'] ?? 0))),
                'an'     => null,
                'anName' => '',
            ];
        }
        if (!$stuecke && !array_sum($muenzen)) respond(400, 'Der Fund ist leer.');
        $beute = ['id' => bin2hex(random_bytes(6)), 'zeit' => time(),
                  'titel' => mb_substr(trim((string)($roh['titel'] ?? '')), 0, 80),
                  'muenzen' => $muenzen, 'stuecke' => $stuecke];
        $pdo->prepare("INSERT INTO hb_beute (session_code, adv_id, beute_json, stand)
                       VALUES(?,?,?,1)
                       ON DUPLICATE KEY UPDATE beute_json=VALUES(beute_json), stand=stand+1")
            ->execute([$code, $advId, json_encode($beute, JSON_UNESCAPED_UNICODE)]);
        respond(201, 'Hingelegt.', ['beute' => $beute]);

    case 'beute_nehmen':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId  = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $stId   = mb_substr((string)($body['stueck_id'] ?? ''), 0, 40);
        $charId = mb_substr((string)($body['char_id'] ?? ''), 0, 50);
        if ($advId === '' || $stId === '') respond(400, 'Fehlende Daten.');
        // Nehmen darf nur, wer in diesen Bogen schreiben darf. Zurueck-
        // legen (char_id leer) darf jeder in der Runde.
        if ($charId !== '') besitzPruefen($pdo, $z, $code, $charId);
        $st = $pdo->prepare("SELECT beute_json FROM hb_beute WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(404, 'Es liegt nichts.');
        $beute = json_decode($row['beute_json'], true);
        if (!is_array($beute)) respond(404, 'Es liegt nichts.');
        $gefunden = false;
        foreach ($beute['stuecke'] as &$stueck) {
            if ((string)$stueck['id'] !== $stId) continue;
            $gefunden = true;
            $stueck['an']     = $charId === '' ? null : $charId;
            $stueck['anName'] = $charId === '' ? '' : mb_substr(trim((string)($body['name'] ?? '')), 0, 60);
        }
        unset($stueck);
        if (!$gefunden) respond(404, 'Das Stück liegt nicht mehr da.');
        $pdo->prepare("UPDATE hb_beute SET beute_json=?, stand=stand+1
                       WHERE session_code=? AND adv_id=?")
            ->execute([json_encode($beute, JSON_UNESCAPED_UNICODE), $code, $advId]);
        respond(200, 'Genommen.', ['beute' => $beute]);

    case 'beute_stand':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        $st = $pdo->prepare("SELECT beute_json, stand FROM hb_beute WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(200, 'OK', ['stand' => 0, 'beute' => null]);
        $stand = (int)$row['stand'];
        $seit  = (int)($body['seit'] ?? -1);
        if ($seit >= 0 && $seit === $stand) respond(200, 'OK', ['stand' => $stand]);
        respond(200, 'OK', ['stand' => $stand, 'beute' => json_decode($row['beute_json'], true)]);

    // ── Proben auf Ansage ───────────────────────────────────────
    // "Alle einen Wurf auf Wahrnehmung." Bis hierher hiess das: reihum
    // fragen, Zahlen sammeln, im Kopf vergleichen. Eine Ansage steht je
    // Abenteuer, und es gibt immer nur eine — die naechste loest die
    // vorige ab. Wer eine liegen laesst, blockiert damit niemanden: nach
    // einer Viertelstunde ist sie von selbst weg.
    case 'probe_setzen':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $roh = $body['probe'] ?? null;
        if ($roh === null) {
            // Abräumen ist erlaubt und der zweite Weg, eine Ansage
            // loszuwerden.
            $pdo->prepare("DELETE FROM hb_proben WHERE session_code=? AND adv_id=?")
                ->execute([$code, $advId]);
            respond(200, 'Abgeräumt.');
        }
        if (!is_array($roh)) respond(400, 'Fehlende Ansage.');
        // Wer gefragt ist. Leer heisst alle — so war es bisher, und so
        // bleibt es fuer jede Ansage, die niemanden nennt.
        $fuer = [];
        foreach ((array)($roh['fuer'] ?? []) as $cid) {
            $cid = mb_substr(trim((string)$cid), 0, 50);
            if ($cid !== '' && !in_array($cid, $fuer, true)) $fuer[] = $cid;
            if (count($fuer) >= 24) break;
        }
        $probe = [
            'id'   => bin2hex(random_bytes(6)),
            'art'  => in_array((string)($roh['art'] ?? ''), ['fert','rw'], true) ? (string)$roh['art'] : 'fert',
            'wert' => mb_substr(trim((string)($roh['wert'] ?? '')), 0, 30),
            'sg'   => max(0, min(40, (int)($roh['sg'] ?? 0))),
            'verdeckt' => !empty($roh['verdeckt']),
            'text' => mb_substr(trim((string)($roh['text'] ?? '')), 0, 160),
            'fuer' => $fuer,
            // Geheim heisst: die anderen erfahren nicht einmal, dass
            // gewuerfelt wurde. Das kann der Client nicht halten — er
            // bekaeme die Ansage ja und muesste sie nur verschweigen.
            // Also filtert der Server, und ohne Empfaenger gibt es kein
            // Geheimnis.
            'geheim' => !empty($roh['geheim']) && count($fuer) > 0,
            'zeit' => time(),
            'antworten' => [],
            'nachrichten' => [],
        ];
        if ($probe['wert'] === '') respond(400, 'Worauf denn?');
        $pdo->prepare("INSERT INTO hb_proben (session_code, adv_id, probe_json, stand)
                       VALUES(?,?,?,1)
                       ON DUPLICATE KEY UPDATE probe_json=VALUES(probe_json), stand=stand+1")
            ->execute([$code, $advId, json_encode($probe, JSON_UNESCAPED_UNICODE)]);
        respond(201, 'Angesagt.', ['probe' => $probe]);

    case 'probe_antwort':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId  = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $charId = mb_substr((string)($body['char_id'] ?? ''), 0, 50);
        if ($advId === '' || $charId === '') respond(400, 'Fehlende Daten.');
        // Antworten darf nur, wem der Bogen gehoert — sonst wuerfelte
        // einer fuer alle.
        besitzPruefen($pdo, $z, $code, $charId);
        $st = $pdo->prepare("SELECT probe_json FROM hb_proben WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(404, 'Es steht keine Probe an.');
        $probe = json_decode($row['probe_json'], true);
        if (!is_array($probe)) respond(404, 'Es steht keine Probe an.');
        if ((string)($body['probe_id'] ?? '') !== (string)$probe['id'])
            respond(409, 'Die Ansage hat sich geändert. Bitte neu ansehen.');
        $antwort = [
            'charId' => $charId,
            'name'   => mb_substr(trim((string)($body['name'] ?? '')), 0, 60),
            'wurf'   => max(-40, min(99, (int)($body['wurf'] ?? 0))),
            'bonus'  => max(-20, min(40, (int)($body['bonus'] ?? 0))),
            'zeit'   => time(),
        ];
        // Wer zweimal antwortet, ersetzt sich selbst. Ein Zahlendreher
        // soll nicht als zweite Zeile stehenbleiben.
        $liste = [];
        foreach ((array)($probe['antworten'] ?? []) as $a) {
            if (is_array($a) && (string)($a['charId'] ?? '') !== $charId) $liste[] = $a;
        }
        $liste[] = $antwort;
        if (count($liste) > 24) $liste = array_slice($liste, -24);
        $probe['antworten'] = $liste;
        $pdo->prepare("UPDATE hb_proben SET probe_json=?, stand=stand+1
                       WHERE session_code=? AND adv_id=?")
            ->execute([json_encode($probe, JSON_UNESCAPED_UNICODE), $code, $advId]);
        respond(200, 'Notiert.', ['antwort' => $antwort]);

    // Die Spielleitung schickt hinterher etwas an einzelne: „Du siehst
    // Kratzspuren am Tuerrahmen." Steht an der Probe, geht nur an die
    // Genannten, und der Server haelt das — nicht der Client.
    case 'probe_nachricht': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $st = $pdo->prepare("SELECT probe_json FROM hb_proben WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(404, 'Es steht keine Probe an.');
        $probe = json_decode($row['probe_json'], true);
        if (!is_array($probe)) respond(404, 'Es steht keine Probe an.');

        $an = [];
        foreach ((array)($body['an'] ?? []) as $cid) {
            $cid = mb_substr(trim((string)$cid), 0, 50);
            if ($cid !== '' && !in_array($cid, $an, true)) $an[] = $cid;
            if (count($an) >= 24) break;
        }
        $text = mb_substr(trim((string)($body['text'] ?? '')), 0, 1200);
        $bild = (string)($body['bild'] ?? '');
        // Ein Bild kommt als Data-URL und ist vorher verkleinert worden.
        // Was groesser ist, war keines — oder jemand hat es umgangen.
        if ($bild !== '' && (strlen($bild) > 400000 || strpos($bild, 'data:image/') !== 0)) {
            respond(413, 'Das Bild ist zu groß.');
        }
        if ($text === '' && $bild === '') respond(400, 'Nichts zu senden.');
        if (!$an) respond(400, 'An niemanden.');

        $liste = (array)($probe['nachrichten'] ?? []);
        $liste[] = ['id' => bin2hex(random_bytes(6)), 'an' => $an,
                    'text' => $text, 'bild' => $bild, 'zeit' => time()];
        if (count($liste) > 12) $liste = array_slice($liste, -12);
        $probe['nachrichten'] = $liste;
        $pdo->prepare("UPDATE hb_proben SET probe_json=?, stand=stand+1
                       WHERE session_code=? AND adv_id=?")
            ->execute([json_encode($probe, JSON_UNESCAPED_UNICODE), $code, $advId]);
        respond(200, 'Gesendet.');
    }

    case 'probe_stand':
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z2 = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        $st = $pdo->prepare("SELECT probe_json, stand FROM hb_proben WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(200, 'OK', ['stand' => 0, 'probe' => null]);
        $stand = (int)$row['stand'];
        $probe = json_decode($row['probe_json'], true);
        // Der Failsafe: eine Ansage, die eine Viertelstunde offen steht,
        // hat sich erledigt. Sie verschwindet von selbst, damit ein
        // vergessener Wurf niemandem den Bildschirm belegt.
        if (is_array($probe) && (time() - (int)($probe['zeit'] ?? 0)) > PROBE_FRIST) $probe = null;

        // ── Was dieser Tisch sehen darf ──
        // Eine geheime Probe und eine Nachricht an einzelne sind nur dann
        // etwas wert, wenn sie gar nicht erst hinausgehen. Der Client
        // koennte sie nur verschweigen — und wer die Konsole aufmacht,
        // sieht sie trotzdem. Also entscheidet das hier.
        // Die Besitzabfrage kostet eine Zeile Datenbank je Abruf — und
        // abgefragt wird im Spiel jede gute Sekunde. Sie laeuft deshalb
        // nur, wenn an dieser Probe ueberhaupt etwas zu verbergen ist.
        $heikel = is_array($probe)
            && (!empty($probe['geheim']) || !empty($probe['nachrichten']));
        $istDm = $heikel ? istDmVon($pdo, $z2, $code, $advId) : true;
        if ($heikel && !$istDm) {
            $meine = [];
            if ($z2['user']) {
                $q = $pdo->prepare("SELECT char_id FROM hb_chars
                                    WHERE session_code=? AND owner=?");
                $q->execute([$code, (int)$z2['user']['id']]);
                $meine = array_column($q->fetchAll(), 'char_id');
            }
            $betrifft = function (array $ids) use ($meine) {
                foreach ($ids as $cid) if (in_array($cid, $meine, true)) return true;
                return false;
            };
            // Ohne Konto laesst sich kein Besitz feststellen; dann gilt der
            // alte Weg, und der kennt keine Geheimnisse.
            if (!empty($probe['geheim']) && $z2['user'] && !$betrifft((array)($probe['fuer'] ?? []))) {
                $probe = null;
            }
            if (is_array($probe)) {
                $raus = [];
                foreach ((array)($probe['nachrichten'] ?? []) as $n) {
                    if (!is_array($n)) continue;
                    if (!$z2['user'] || $betrifft((array)($n['an'] ?? []))) $raus[] = $n;
                }
                $probe['nachrichten'] = $raus;
            }
        }

        // Nur wenn sich etwas getan hat, geht die ganze Ansage hinaus.
        $seit = (int)($body['seit'] ?? -1);
        if ($seit >= 0 && $seit === $stand) respond(200, 'OK', ['stand' => $stand]);
        respond(200, 'OK', ['stand' => $stand, 'probe' => $probe]);

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

    // Ob dieser Server ueberhaupt noch ein erstes Konto braucht. Ohne
    // Kennung beantwortbar — es gibt ja noch keine —, und die Antwort
    // ist ein einzelnes Ja/Nein. Mehr steht nicht drin: der Name der
    // Verwaltung bleibt drin, wo er steht.
    case 'setup_noetig': {
        $anzahl = (int)$pdo->query("SELECT COUNT(*) AS n FROM hb_users")->fetch()['n'];
        respond(200, 'ok', ['leer' => $anzahl === 0]);
    }

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
            'art'    => in_array((string)($a['art'] ?? ''),
                                 ['angriff','zauber','gegenstand','merkmal','frei'], true)
                        ? (string)$a['art'] : 'frei',
            // Aktion, Bonusaktion oder Reaktion. Ein Zug ist selten eine
            // Sache, und die Spielleitung muss sehen koennen, was wovon
            // ist — sonst zaehlt am Ende niemand mit.
            'typ'    => in_array((string)($a['typ'] ?? ''),
                                 ['aktion','bonus','reaktion'], true)
                        ? (string)$a['typ'] : 'aktion',
            'was'    => mb_substr(trim((string)($a['was'] ?? '')), 0, 80),
            'grad'   => max(0, min(9, (int)($a['grad'] ?? 0))),
            'text'   => mb_substr(trim((string)($a['text'] ?? '')), 0, 500),
            'ziele'   => [],
            'zielIds' => [],
            'zeit'    => time(),
            // Nur fuer die Spielleitung. Die Runde bekommt die Ansage gar
            // nicht erst zu sehen — kampfFuerSpieler laesst sie weg.
            'geheim'  => !empty($a['geheim']),
        ];
        foreach ((array)($a['ziele'] ?? []) as $zid) {
            if (count($sauber['ziele']) >= 12) break;
            $sauber['ziele'][] = mb_substr((string)$zid, 0, 60);
        }
        // Die Kennungen der Ziele gehen mit: die Spielleitung soll sie
        // nicht noch einmal antippen muessen.
        foreach ((array)($a['zielIds'] ?? []) as $zid) {
            if (count($sauber['zielIds']) >= 12) break;
            $sauber['zielIds'][] = mb_substr((string)$zid, 0, 60);
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
            $k = kampfFuerSpieler($k, tpOffenImAbenteuer($pdo, $code, $advId),
                                  eigeneBoegen($pdo, $code, $z));
            respond(200, 'OK', ['stand' => $stand, 'kampf' => $k, 'dm' => false, 'sicht' => $sicht]);
        }
        if ($seit === $stand) respond(200, 'OK', ['stand' => $stand, 'dm' => true]);
        respond(200, 'OK', ['stand' => $stand, 'kampf' => $k, 'dm' => true]);
    }

    // ── Die Rast ─────────────────────────────────────────────────
    // Die Spielleitung sagt an, jeder uebernimmt fuer seinen Helden, und
    // alle sehen, wer schon fertig ist. Was eine Rast mit einem Bogen
    // macht, rechnet der Browser — der Bogen geht danach seinen normalen
    // Weg ueber save_char. Hier steht nur, was angesagt ist.
    case 'rast_setzen': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $roh = $body['rast'] ?? null;
        if ($roh === null) {
            $pdo->prepare("DELETE FROM hb_rast WHERE session_code=? AND adv_id=?")->execute([$code, $advId]);
            respond(200, 'Die Rast ist vorbei.');
        }
        if (!is_array($roh)) respond(400, 'Fehlende Rast.');
        $fuer = [];
        foreach ((array)($roh['fuer'] ?? []) as $cid) {
            $cid = mb_substr(trim((string)$cid), 0, 50);
            if ($cid !== '' && !in_array($cid, $fuer, true)) $fuer[] = $cid;
            if (count($fuer) >= 24) break;
        }
        if (!$fuer) respond(400, 'Niemand rastet.');
        $teile = [];
        foreach ((array)($roh['teile'] ?? []) as $t) {
            if (count($teile) >= 16) break;
            $teile[] = mb_substr((string)$t, 0, 60);
        }
        $rast = [
            'id'     => bin2hex(random_bytes(6)),
            'art'    => ($roh['art'] ?? '') === 'kurz' ? 'kurz' : 'lang',
            'regel'  => ($roh['regel'] ?? '') === 'grr' ? 'grr' : 'standard',
            'stufe'  => max(0, min(7, (int)($roh['stufe'] ?? 0))),
            'essen'  => !array_key_exists('essen', $roh) || !empty($roh['essen']),
            'teile'  => $teile,
            'text'   => mb_substr(trim((string)($roh['text'] ?? '')), 0, 160),
            'fuer'   => $fuer,
            'zeit'   => time(),
            'antworten' => [],
        ];
        $pdo->prepare("INSERT INTO hb_rast (session_code, adv_id, rast_json, stand) VALUES(?,?,?,1)
                       ON DUPLICATE KEY UPDATE rast_json=VALUES(rast_json), stand=stand+1")
            ->execute([$code, $advId, json_encode($rast, JSON_UNESCAPED_UNICODE)]);
        respond(201, 'Angesagt.', ['rast' => $rast]);
    }

    case 'rast_stand': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        $st = $pdo->prepare("SELECT rast_json, stand FROM hb_rast WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(200, 'OK', ['stand' => 0, 'rast' => null]);
        $stand = (int)$row['stand'];
        if (isset($body['seit']) && (int)$body['seit'] === $stand) respond(200, 'OK', ['stand' => $stand]);
        $rast = json_decode($row['rast_json'], true);
        // Eine Rast, die einen Tag lang offen steht, hat sich erledigt.
        if (is_array($rast) && time() - (int)($rast['zeit'] ?? 0) > 86400) $rast = null;
        respond(200, 'OK', ['stand' => $stand, 'rast' => $rast]);
    }

    case 'rast_antwort': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId  = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $charId = mb_substr((string)($body['char_id'] ?? ''), 0, 50);
        if ($advId === '' || $charId === '') respond(400, 'Fehlende Daten.');
        besitzPruefen($pdo, $z, $code, $charId);
        $st = $pdo->prepare("SELECT rast_json FROM hb_rast WHERE session_code=? AND adv_id=?");
        $st->execute([$code, $advId]);
        $row = $st->fetch();
        if (!$row) respond(404, 'Es ist keine Rast angesagt.');
        $rast = json_decode($row['rast_json'], true);
        if (!is_array($rast)) respond(404, 'Es ist keine Rast angesagt.');
        if ((string)($body['rast_id'] ?? '') !== (string)$rast['id']) respond(409, 'Die Rast hat sich geändert.');
        if (!in_array($charId, (array)$rast['fuer'], true)) respond(403, 'Dieser Held rastet hier nicht.');
        $liste = [];
        foreach ((array)($rast['antworten'] ?? []) as $a) {
            if (is_array($a) && (string)($a['charId'] ?? '') !== $charId) $liste[] = $a;
        }
        $liste[] = ['charId' => $charId,
                    'name'   => mb_substr(trim((string)($body['name'] ?? '')), 0, 60),
                    'text'   => mb_substr(trim((string)($body['text'] ?? '')), 0, 400),
                    'zeit'   => time()];
        $rast['antworten'] = $liste;
        $pdo->prepare("UPDATE hb_rast SET rast_json=?, stand=stand+1 WHERE session_code=? AND adv_id=?")
            ->execute([json_encode($rast, JSON_UNESCAPED_UNICODE), $code, $advId]);
        respond(200, 'Übernommen.');
    }

    // ── Post an die Spielleitung ─────────────────────────────────
    // Schreiben darf, wem der Held gehoert. Lesen darf die Spielleitung
    // alles in ihrem Abenteuer, ein Spieler nur, was er selbst geschrieben
    // hat — damit er sieht, ob es angekommen und gelesen ist.
    case 'post_senden': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId  = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $charId = mb_substr((string)($body['char_id'] ?? ''), 0, 50);
        $text   = mb_substr(trim((string)($body['text'] ?? '')), 0, 1000);
        if ($advId === '' || $charId === '') respond(400, 'Fehlende Daten.');
        if ($text === '') respond(400, 'Da steht nichts drin.');
        $cs = $pdo->prepare("SELECT owner, char_json FROM hb_chars WHERE session_code=? AND char_id=?");
        $cs->execute([$code, $charId]);
        $cr = $cs->fetch();
        if (!$cr) respond(404, 'Bogen nicht gefunden.');
        if ($cr['owner'] === null || (int)$cr['owner'] !== (int)$z['user']['id']) {
            respond(403, 'Das ist nicht dein Bogen.');
        }
        $name = mb_substr((string)((json_decode((string)$cr['char_json'], true) ?: [])['name'] ?? ''), 0, 100);
        // Ein Briefkasten, kein Chat: mehr als dreissig ungelesene von
        // einem Konto sind ein Versehen oder Unfug.
        $n = $pdo->prepare("SELECT COUNT(*) FROM hb_post WHERE session_code=? AND adv_id=? AND user_id=? AND gelesen=0");
        $n->execute([$code, $advId, (int)$z['user']['id']]);
        if ((int)$n->fetchColumn() >= 30) respond(429, 'Die Spielleitung hat noch viel Ungelesenes von dir.');
        $pdo->prepare("INSERT INTO hb_post (session_code, adv_id, char_id, char_name, user_id, text)
                       VALUES (?,?,?,?,?,?)")
            ->execute([$code, $advId, $charId, $name, (int)$z['user']['id'], $text]);
        respond(201, 'Gesendet.', ['id' => (int)$pdo->lastInsertId()]);
    }

    case 'post_liste': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Kein Abenteuer genannt.');
        $dm = istDmVon($pdo, $z, $code, $advId);
        $sql = "SELECT id, char_id, char_name, text, gelesen, UNIX_TIMESTAMP(created_at) AS zeit
                FROM hb_post WHERE session_code=? AND adv_id=?"
             . ($dm ? '' : ' AND user_id=?') . " ORDER BY id DESC LIMIT 60";
        $st = $pdo->prepare($sql);
        $st->execute($dm ? [$code, $advId] : [$code, $advId, (int)$z['user']['id']]);
        $post = [];
        $ungelesen = 0;
        foreach ($st->fetchAll() as $r) {
            $post[] = ['id' => (int)$r['id'], 'charId' => (string)$r['char_id'],
                       'name' => (string)$r['char_name'], 'text' => (string)$r['text'],
                       'gelesen' => (bool)$r['gelesen'], 'zeit' => (int)$r['zeit']];
            if (!$r['gelesen']) $ungelesen++;
        }
        respond(200, 'OK', ['post' => $post, 'dm' => $dm, 'ungelesen' => $ungelesen]);
    }

    case 'post_gelesen': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $pdo->prepare("UPDATE hb_post SET gelesen=? WHERE session_code=? AND adv_id=? AND id=?")
            ->execute([empty($body['gelesen']) ? 0 : 1, $code, $advId, (int)($body['id'] ?? 0)]);
        respond(200, 'OK');
    }

    case 'post_loeschen': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $id = (int)($body['id'] ?? 0);
        // Die Spielleitung raeumt ihr Postfach auf; wer geschrieben hat,
        // darf zuruecknehmen, solange es noch nicht gelesen ist.
        if (istDmVon($pdo, $z, $code, $advId)) {
            $st = $pdo->prepare("DELETE FROM hb_post WHERE session_code=? AND adv_id=? AND id=?");
            $st->execute([$code, $advId, $id]);
        } else {
            $st = $pdo->prepare("DELETE FROM hb_post WHERE session_code=? AND adv_id=? AND id=? AND user_id=? AND gelesen=0");
            $st->execute([$code, $advId, $id, (int)$z['user']['id']]);
        }
        if (!$st->rowCount()) respond(404, 'Nicht gefunden — oder schon gelesen.');
        respond(200, 'Gelöscht.');
    }

    // ── Das Sitzungstagebuch ────────────────────────────────────
    // Ein Abend gehoert der ganzen Runde: jeder legt ihn an, jeder
    // schreibt seinen eigenen Eintrag, und die Bilder haengen an der
    // Sitzung und nicht am Eintrag. Gelesen wird alles von allen — bis
    // auf das, was die Spielleitung fuer sich kennzeichnet.
    case 'tagebuch_liste': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Fehlendes Abenteuer.');
        $dm = istDmVon($pdo, $z, $code, $advId);
        $ich = (int)($z['user']['id'] ?? 0);
        $st = $pdo->prepare("SELECT * FROM hb_tagebuch WHERE session_code=? AND adv_id=? ORDER BY datum DESC, id DESC LIMIT 500");
        $st->execute([$code, $advId]);
        $sitzungen = [];
        $ids = [];
        foreach ($st->fetchAll() as $r) {
            $ids[] = (string)$r['sitzung_id'];
            $sitzungen[(string)$r['sitzung_id']] = [
                'id'        => (string)$r['sitzung_id'],
                'datum'     => (string)$r['datum'],
                'titel'     => (string)$r['titel'],
                'spielzeit' => (string)$r['spielzeit'],
                'ablage'    => (string)$r['ablage'],
                'von'       => (int)$r['user_id'],
                'eintraege' => [],
                'bilder'    => [],
            ];
        }
        if ($ids) {
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $se = $pdo->prepare("SELECT * FROM hb_tb_eintrag WHERE session_code=? AND sitzung_id IN ($ph) ORDER BY id ASC");
            $se->execute(array_merge([$code], $ids));
            foreach ($se->fetchAll() as $r) {
                // Was die Spielleitung fuer sich schreibt, verlaesst den
                // Server nur in ihre Richtung.
                if ((int)$r['nur_dm'] === 1 && !$dm && (int)$r['user_id'] !== $ich) continue;
                $sitzungen[(string)$r['sitzung_id']]['eintraege'][] = [
                    'id'        => (int)$r['id'],
                    'userId'    => (int)$r['user_id'],
                    'user'      => (string)$r['user_name'],
                    'charId'    => (string)$r['char_id'],
                    'charName'  => (string)$r['char_name'],
                    'text'      => (string)$r['text'],
                    'nurDm'     => (int)$r['nur_dm'] === 1,
                    'geaendert' => strtotime((string)$r['updated_at']) * 1000,
                    'meiner'    => (int)$r['user_id'] === $ich,
                ];
            }
            $sb = $pdo->prepare("SELECT * FROM hb_tb_bild WHERE session_code=? AND sitzung_id IN ($ph) ORDER BY id ASC");
            $sb->execute(array_merge([$code], $ids));
            foreach ($sb->fetchAll() as $r) {
                $sitzungen[(string)$r['sitzung_id']]['bilder'][] = [
                    'id'     => (int)$r['id'],
                    'datei'  => (string)$r['datei'],
                    'titel'  => (string)$r['titel'],
                    'bytes'  => (int)$r['bytes'],
                    'user'   => (string)$r['user_name'],
                    'meins'  => (int)$r['user_id'] === $ich,
                ];
            }
        }
        respond(200, 'OK', ['sitzungen' => array_values($sitzungen), 'dm' => $dm, 'ich' => $ich]);
    }

    case 'tagebuch_sitzung': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        if ($advId === '') respond(400, 'Fehlendes Abenteuer.');
        $s = $body['sitzung'] ?? null;
        if (!is_array($s)) respond(400, 'Keine Sitzung.');
        $id = (string)($s['id'] ?? '');
        $datum = (string)($s['datum'] ?? '');
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $datum)) respond(400, 'Das Datum fehlt oder passt nicht (JJJJ-MM-TT).');
        $titel = mb_substr(trim((string)($s['titel'] ?? '')), 0, 160);
        $spielzeit = mb_substr(trim((string)($s['spielzeit'] ?? '')), 0, 80);
        $ich = (int)($z['user']['id'] ?? 0);
        if ($id !== '') {
            if (!planId($id)) respond(400, 'Ungültige Kennung.');
            $alt = tbSitzung($pdo, $code, $advId, $id);
            if (!$alt) respond(404, 'Die Sitzung gibt es nicht.');
            if (!tbDarf($pdo, $z, $code, $advId, (int)$alt['user_id'])) respond(403, 'Das darf nur, wer sie angelegt hat — oder die Spielleitung.');
            $pdo->prepare("UPDATE hb_tagebuch SET datum=?, titel=?, spielzeit=? WHERE session_code=? AND sitzung_id=?")
                ->execute([$datum, $titel, $spielzeit, $code, $id]);
            respond(200, 'Gespeichert.', ['id' => $id]);
        }
        $neu = 's_' . bin2hex(random_bytes(8));
        $ablage = bin2hex(random_bytes(16));
        $pdo->prepare("INSERT INTO hb_tagebuch (session_code, adv_id, sitzung_id, datum, titel, spielzeit, ablage, user_id)
                       VALUES(?,?,?,?,?,?,?,?)")
            ->execute([$code, $advId, $neu, $datum, $titel, $spielzeit, $ablage, $ich]);
        respond(201, 'Angelegt.', ['id' => $neu, 'ablage' => $ablage]);
    }

    case 'tagebuch_sitzung_weg': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $id = (string)($body['sitzung_id'] ?? '');
        $s = $advId !== '' && planId($id) ? tbSitzung($pdo, $code, $advId, $id) : null;
        if (!$s) respond(404, 'Die Sitzung gibt es nicht.');
        if (!tbDarf($pdo, $z, $code, $advId, (int)$s['user_id'])) respond(403, 'Das darf nur, wer sie angelegt hat — oder die Spielleitung.');
        // Erst die Bilder vom Datenträger, dann die Zeilen: eine Datei
        // ohne Eintrag fände später niemand mehr.
        planOrdnerLeeren(planOrdner((string)$s['ablage'], false), true);
        $pdo->prepare("DELETE FROM hb_tb_bild WHERE session_code=? AND sitzung_id=?")->execute([$code, $id]);
        $pdo->prepare("DELETE FROM hb_tb_eintrag WHERE session_code=? AND sitzung_id=?")->execute([$code, $id]);
        $pdo->prepare("DELETE FROM hb_tagebuch WHERE session_code=? AND sitzung_id=?")->execute([$code, $id]);
        respond(200, 'Gelöscht.');
    }

    // Der eigene Eintrag. Je Person einer — ein zweites Speichern
    // ueberschreibt ihn, und niemand schreibt im Namen eines anderen.
    case 'tagebuch_eintrag': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        if (empty($z['user'])) respond(403, 'Dafür braucht es ein Konto.');
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $id = (string)($body['sitzung_id'] ?? '');
        $s = $advId !== '' && planId($id) ? tbSitzung($pdo, $code, $advId, $id) : null;
        if (!$s) respond(404, 'Die Sitzung gibt es nicht.');
        $text = (string)($body['text'] ?? '');
        if (strlen($text) > TB_MAX_TEXT) respond(413, 'Der Eintrag ist zu lang.');
        $nurDm = !empty($body['nur_dm']) && istDmVon($pdo, $z, $code, $advId) ? 1 : 0;
        $ich = (int)$z['user']['id'];
        if (trim($text) === '') {
            $pdo->prepare("DELETE FROM hb_tb_eintrag WHERE session_code=? AND sitzung_id=? AND user_id=?")
                ->execute([$code, $id, $ich]);
            respond(200, 'Eintrag entfernt.');
        }
        $pdo->prepare("INSERT INTO hb_tb_eintrag (session_code, sitzung_id, user_id, user_name, char_id, char_name, text, nur_dm)
                       VALUES(?,?,?,?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE user_name=VALUES(user_name), char_id=VALUES(char_id),
                                              char_name=VALUES(char_name), text=VALUES(text), nur_dm=VALUES(nur_dm)")
            ->execute([$code, $id, $ich, mb_substr((string)$z['user']['name'], 0, 100),
                       mb_substr((string)($body['char_id'] ?? ''), 0, 50),
                       mb_substr((string)($body['char_name'] ?? ''), 0, 100), $text, $nurDm]);
        respond(200, 'Gespeichert.');
    }

    // Stueckweise hochladen. Die Stuecke kommen der Reihe nach; jedes
    // haengt sich an eine Teildatei im Ordner des Abends. Wer ein Stueck
    // zweimal schickt (weil die Antwort verloren ging), bekommt ein Ja und
    // nichts doppelt; wer eines auslaesst, erfaehrt, wo es weitergeht.
    // Erst mit dem letzten Stueck wird geprueft, ob der Inhalt zur Endung
    // passt, und die Datei bekommt ihren Namen.
    case 'tagebuch_stueck': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        if (empty($z['user'])) respond(403, 'Dafür braucht es ein Konto.');
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $id = (string)($body['sitzung_id'] ?? '');
        $s = $advId !== '' && planId($id) ? tbSitzung($pdo, $code, $advId, $id) : null;
        if (!$s) respond(404, 'Die Sitzung gibt es nicht.');
        $upload = (string)($body['upload'] ?? '');
        if (!preg_match('/^[0-9a-f]{32}$/', $upload)) respond(400, 'Ungültige Kennung des Uploads.');
        $nr = (int)($body['nr'] ?? -1);
        $gesamt = (int)($body['gesamt'] ?? 0);
        $groesse = (int)($body['groesse'] ?? 0);
        $endung = strtolower((string)($body['endung'] ?? ''));
        $art = tbArtVon($endung);
        if ($art === '') respond(415, 'Nur PNG, JPEG, WebP — oder MP4, WebM, OGV.');
        $grenze = $art === 'video' ? TB_MAX_VIDEO : TB_MAX_BILD;
        if ($groesse < 1) respond(400, 'Leere Datei.');
        if ($groesse > $grenze) {
            respond(413, $art === 'video' ? 'Ein Video ist größer als 1 GB.' : 'Ein Bild ist größer als 12 MB.');
        }
        if ($gesamt !== (int)ceil($groesse / TB_STUECK) || $nr < 0 || $nr >= $gesamt) {
            respond(400, 'Die Stücke passen nicht zur Größe.');
        }
        $daten = base64_decode((string)($body['daten'] ?? ''), true);
        if ($daten === false) respond(400, 'Das Stück kam nicht lesbar an.');
        $soll = $nr === $gesamt - 1 ? $groesse - $nr * TB_STUECK : TB_STUECK;
        if (strlen($daten) !== $soll) respond(400, 'Das Stück hat die falsche Länge.');

        $ordner = planOrdner((string)$s['ablage'], true);
        $teil = $ordner . '/' . $upload . '.teil';
        // Mit dem ersten Stueck: angefangene Uploads, die seit einem Tag
        // niemand fortsetzt, raeumen sich weg.
        if ($nr === 0) {
            foreach (glob($ordner . '/*.teil') ?: [] as $alt) {
                if ($alt !== $teil && @filemtime($alt) < time() - TB_TEIL_ALTER) @unlink($alt);
            }
            @unlink($teil);
        }
        clearstatcache(true, $teil);
        $da = is_file($teil) ? (int)filesize($teil) : 0;
        $ab = $nr * TB_STUECK;
        if ($da === $ab + $soll) {
            // Schon angekommen — die Antwort ging verloren. Nichts doppelt.
        } elseif ($da === $ab) {
            if (@file_put_contents($teil, $daten, FILE_APPEND | LOCK_EX) === false) {
                respond(507, 'Das Stück ließ sich nicht schreiben (Speicherplatz?).');
            }
        } else {
            respond(409, 'Da fehlt ein Stück.', ['erwartet' => intdiv($da, TB_STUECK)]);
        }
        if ($nr < $gesamt - 1) respond(200, 'Stück angekommen.', ['nr' => $nr]);

        // Das letzte Stueck: jetzt ist die Datei ganz.
        clearstatcache(true, $teil);
        if ((int)filesize($teil) !== $groesse) { @unlink($teil); respond(400, 'Die Datei kam nicht vollständig an.'); }
        $kopf = (string)@file_get_contents($teil, false, null, 0, 64);
        $zielArt = $art === 'video' ? TB_VIDEO_ARTEN[$endung] : TB_BILD_ARTEN[$endung];
        if (!tbInhaltPasst($zielArt, $kopf)) { @unlink($teil); respond(415, 'Der Inhalt passt nicht zur Endung.'); }
        $name = bin2hex(random_bytes(8)) . '.' . $zielArt;
        if (!@rename($teil, $ordner . '/' . $name)) { @unlink($teil); respond(500, 'Die Datei ließ sich nicht ablegen.'); }
        $titel = mb_substr(trim((string)($body['titel'] ?? '')), 0, 160);
        $pdo->prepare("INSERT INTO hb_tb_bild (session_code, sitzung_id, datei, titel, bytes, user_id, user_name)
                       VALUES(?,?,?,?,?,?,?)")
            ->execute([$code, $id, $name, $titel, $groesse,
                       (int)$z['user']['id'], mb_substr((string)$z['user']['name'], 0, 100)]);
        respond(201, 'Hochgeladen.', ['bild' => ['id' => (int)$pdo->lastInsertId(), 'datei' => $name, 'titel' => $titel],
                                      'ablage' => (string)$s['ablage']]);
    }

    case 'tagebuch_bild_weg': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = mb_substr((string)($body['adv_id'] ?? ''), 0, 50);
        $bildId = (int)($body['bild_id'] ?? 0);
        $st = $pdo->prepare("SELECT b.*, t.ablage, t.adv_id FROM hb_tb_bild b
                             JOIN hb_tagebuch t ON t.session_code=b.session_code AND t.sitzung_id=b.sitzung_id
                             WHERE b.session_code=? AND b.id=?");
        $st->execute([$code, $bildId]);
        $b = $st->fetch();
        if (!$b || (string)$b['adv_id'] !== $advId) respond(404, 'Das Bild gibt es nicht.');
        if (!tbDarf($pdo, $z, $code, $advId, (int)$b['user_id'])) respond(403, 'Das darf nur, wer es hochgeladen hat — oder die Spielleitung.');
        @unlink(planOrdner((string)$b['ablage'], false) . '/' . (string)$b['datei']);
        $pdo->prepare("DELETE FROM hb_tb_bild WHERE session_code=? AND id=?")->execute([$code, $bildId]);
        respond(200, 'Gelöscht.');
    }

    // ── Abenteuerplaner ─────────────────────────────────────────
    // Der Planer ist eine eigene Seite, aber dieselbe Anmeldung und
    // dieselbe Gruppe. Lesen darf jedes Mitglied — ein Spieler nur, was
    // sichtbar ist, und ohne die Notizen der Spielleitung. Schreiben darf
    // nur, wer das Abenteuer leitet.
    case 'planer_start': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $lib = json_decode((string)($z['row']['library_json'] ?? '{}'), true);
        $advs = (is_array($lib) && isset($lib['_adventures']) && is_array($lib['_adventures'])) ? $lib['_adventures'] : [];
        $liste = [];
        foreach ($advs as $a) {
            if (!is_array($a) || empty($a['id'])) continue;
            $id = (string)$a['id'];
            $liste[] = ['id' => $id, 'name' => (string)($a['name'] ?? $id), 'leitest' => istDmVon($pdo, $z, $code, $id)];
        }
        respond(200, 'OK', ['nutzer' => ['id' => (int)$z['user']['id'], 'name' => (string)$z['user']['name']],
                            'rolle' => $z['rolle'], 'abenteuer' => $liste]);
    }

    // Die Boegen eines Abenteuers, fuer die Heldengruppen und die Figuren
    // auf der Karte. Kein ganzer Bogen — nur, was auf einer Tafel steht:
    // Name, Haltung, Ruestungsklasse, Trefferpunkte. Die Zahlen sind die
    // eingetragenen; was ein Ring dazugibt, rechnet der Planer nicht.
    case 'planer_helden': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!planId($advId)) respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $lib = json_decode((string)($z['row']['library_json'] ?? '{}'), true);
        $advs = (is_array($lib) && is_array($lib['_adventures'] ?? null)) ? $lib['_adventures'] : [];
        $erstes = (string)(($advs[0] ?? [])['id'] ?? '');
        $st = $pdo->prepare("SELECT char_id, adv_id, char_json FROM hb_chars WHERE session_code=? AND (adv_id=? OR (adv_id IS NULL AND ?=?))");
        $st->execute([$code, $advId, $advId, $erstes]);
        $helden = [];
        foreach ($st->fetchAll() as $r) {
            $c = json_decode((string)$r['char_json'], true) ?: [];
            if (!empty($c['archived'])) continue;
            $helden[] = [
                'id'      => (string)$r['char_id'],
                'name'    => mb_substr((string)($c['name'] ?? ''), 0, 100),
                'nurDm'   => !empty($c['dmOnly']),
                'npc'     => !empty($c['npc']),
                'haltung' => (string)($c['haltung'] ?? '') === 'feindlich' ? 'feindlich' : 'freundlich',
                'stufe'   => (int)($c['level'] ?? 1),
                'rk'      => (int)($c['ac'] ?? 10),
                'tp'      => (int)($c['hp'] ?? 0),
                'tpMax'   => (int)($c['maxHp'] ?? 0),
            ];
        }
        usort($helden, fn($a, $b) => strcmp($a['name'], $b['name']));
        respond(200, 'OK', ['helden' => $helden]);
    }

    case 'planer_stand': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!planId($advId)) respond(400, 'Kein Abenteuer genannt.');
        respond(200, 'OK', ['stand' => planStand($pdo, $code, $advId)]);
    }

    case 'planer_laden': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!planId($advId)) respond(400, 'Kein Abenteuer genannt.');
        $dm = istDmVon($pdo, $z, $code, $advId);
        $st = $pdo->prepare("SELECT karte_id, ablage, sichtbar, karte_json FROM hb_plan_karte
                             WHERE session_code=? AND adv_id=?" . ($dm ? '' : ' AND sichtbar=1'));
        $st->execute([$code, $advId]);
        $karten = []; $offen = [];
        foreach ($st->fetchAll() as $r) { $karten[] = planKarteAntwort($r, $dm); $offen[(string)$r['karte_id']] = true; }
        $st = $pdo->prepare("SELECT obj_id, karte_id, art, sichtbar, obj_json FROM hb_plan_obj
                             WHERE session_code=? AND adv_id=?" . ($dm ? '' : ' AND sichtbar=1'));
        $st->execute([$code, $advId]);
        $objekte = [];
        $ich = (int)($z['user']['id'] ?? 0);
        foreach ($st->fetchAll() as $r) {
            if (!$dm && in_array((string)$r['art'], PLAN_OHNE_KARTE, true)) {
                // Das gehoert zu keiner Karte. Ist ein Handout an bestimmte
                // Konten gerichtet, bekommen es nur diese.
                $an = array_map('intval', (array)((json_decode((string)$r['obj_json'], true) ?: [])['an'] ?? []));
                if ((string)$r['art'] === 'handout' && $an && !in_array($ich, $an, true)) continue;
                $objekte[] = planObjAntwort($r, $dm);
                continue;
            }
            // Ein sichtbarer Ort auf einer verborgenen Karte verriete die Karte.
            if (!$dm && empty($offen[(string)$r['karte_id']])) continue;
            $objekte[] = planObjAntwort($r, $dm);
        }
        respond(200, 'OK', ['dm' => $dm, 'stand' => planStand($pdo, $code, $advId),
                            'karten' => $karten, 'objekte' => $objekte]);
    }

    case 'planer_karte_speichern': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!planId($advId)) respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $k = $body['karte'] ?? null;
        if (!is_array($k)) respond(400, 'Fehlende Karte.');
        $id = (string)($k['id'] ?? '');
        if (!planId($id)) respond(400, 'Die Karte hat keine gültige Kennung.');
        $name = mb_substr(trim((string)($k['name'] ?? '')), 0, 120);
        if ($name === '') respond(400, 'Die Karte braucht einen Namen.');
        $k['name'] = $name;
        $json = planJson($k, ['id', 'ablage', 'sichtbar']);
        $st = $pdo->prepare("SELECT adv_id, ablage FROM hb_plan_karte WHERE session_code=? AND karte_id=?");
        $st->execute([$code, $id]);
        $alt = $st->fetch();
        if ($alt && (string)$alt['adv_id'] !== $advId) respond(409, 'Diese Kennung gehört zu einem anderen Abenteuer.');
        $ablage = $alt ? (string)$alt['ablage'] : bin2hex(random_bytes(16));
        $pdo->prepare("INSERT INTO hb_plan_karte (session_code, adv_id, karte_id, ablage, sichtbar, karte_json)
                       VALUES (?,?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE sichtbar=VALUES(sichtbar), karte_json=VALUES(karte_json)")
            ->execute([$code, $advId, $id, $ablage, empty($k['sichtbar']) ? 0 : 1, $json]);
        $stand = planStandHoch($pdo, $code, $advId);
        respond($alt ? 200 : 201, 'Gespeichert.', ['karte' => planKarteAntwort(planKarte($pdo, $code, $advId, $id), true),
                                                  'stand' => $stand]);
    }

    case 'planer_karte_loeschen': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $k = planKarte($pdo, $code, $advId, (string)($body['karte_id'] ?? ''));
        $pdo->prepare("DELETE FROM hb_plan_obj WHERE session_code=? AND karte_id=?")->execute([$code, $k['karte_id']]);
        $pdo->prepare("DELETE FROM hb_plan_karte WHERE session_code=? AND karte_id=?")->execute([$code, $k['karte_id']]);
        planOrdnerLeeren(planOrdner((string)$k['ablage'], false), true);
        respond(200, 'Gelöscht.', ['stand' => planStandHoch($pdo, $code, $advId)]);
    }

    case 'planer_obj_speichern': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!planId($advId)) respond(400, 'Kein Abenteuer genannt.');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $o = $body['obj'] ?? null;
        if (!is_array($o)) respond(400, 'Fehlender Eintrag.');
        $id  = (string)($o['id'] ?? '');
        $art = (string)($o['art'] ?? '');
        if (!planId($id)) respond(400, 'Der Eintrag hat keine gültige Kennung.');
        if (!in_array($art, PLAN_ARTEN, true)) respond(400, 'Unbekannte Art: ' . mb_substr($art, 0, 20));
        $st = $pdo->prepare("SELECT adv_id, obj_json FROM hb_plan_obj WHERE session_code=? AND obj_id=?");
        $st->execute([$code, $id]);
        $alt = $st->fetch();
        if ($alt && (string)$alt['adv_id'] !== $advId) respond(409, 'Diese Kennung gehört zu einem anderen Abenteuer.');
        if (in_array($art, PLAN_OHNE_KARTE, true) && (string)($o['karteId'] ?? '') === '') {
            $karte = ['karte_id' => ''];
        } elseif (!in_array($art, PLAN_OHNE_KARTE, true)) {
            $karte = planKarte($pdo, $code, $advId, (string)($o['karteId'] ?? ''));
        } else {
            $karte = planKarte($pdo, $code, $advId, (string)$o['karteId']);
        }
        if ($art === 'handout') {
            // Seinen Ordner vergibt der Server — was die Anwendung schickt, zaehlt nicht.
            $altAblage = (string)(($alt ? (json_decode((string)$alt['obj_json'], true) ?: []) : [])['ablage'] ?? '');
            $o['ablage'] = preg_match('/^[0-9a-f]{32}$/', $altAblage) ? $altAblage : bin2hex(random_bytes(16));
            $an = [];
            foreach ((array)($o['an'] ?? []) as $u) { $u = (int)$u; if ($u > 0 && !in_array($u, $an, true)) $an[] = $u; }
            $o['an'] = array_slice($an, 0, 50);
        } else {
            unset($o['ablage']);
        }
        $json = planJson($o, ['id', 'karteId', 'art', 'sichtbar']);
        $pdo->prepare("INSERT INTO hb_plan_obj (session_code, adv_id, obj_id, karte_id, art, sichtbar, obj_json)
                       VALUES (?,?,?,?,?,?,?)
                       ON DUPLICATE KEY UPDATE karte_id=VALUES(karte_id), art=VALUES(art),
                                               sichtbar=VALUES(sichtbar), obj_json=VALUES(obj_json)")
            ->execute([$code, $advId, $id, $karte['karte_id'], $art, empty($o['sichtbar']) ? 0 : 1, $json]);
        respond($alt ? 200 : 201, 'Gespeichert.', ['stand' => planStandHoch($pdo, $code, $advId),
                                                  'ablage' => $art === 'handout' ? $o['ablage'] : null]);
    }

    case 'planer_obj_loeschen': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $objId = (string)($body['obj_id'] ?? '');
        $st = $pdo->prepare("SELECT obj_json FROM hb_plan_obj WHERE session_code=? AND adv_id=? AND obj_id=?");
        $st->execute([$code, $advId, $objId]);
        $weg = $st->fetch();
        $st = $pdo->prepare("DELETE FROM hb_plan_obj WHERE session_code=? AND adv_id=? AND obj_id=?");
        $st->execute([$code, $advId, $objId]);
        if (!$st->rowCount()) respond(404, 'Nicht gefunden.');
        $wegAblage = (string)(($weg ? (json_decode((string)$weg['obj_json'], true) ?: []) : [])['ablage'] ?? '');
        if (preg_match('/^[0-9a-f]{32}$/', $wegAblage)) planOrdnerLeeren(planOrdner($wegAblage, false), true);
        respond(200, 'Gelöscht.', ['stand' => planStandHoch($pdo, $code, $advId)]);
    }

    // Dateien kommen in Buendeln, als Base64 im JSON: derselbe Weg wie
    // jede andere Anfrage, und ein Buendel bleibt unter post_max_size.
    // Die Anwendung schneidet sie passend zu.
    case 'planer_dateien_hoch': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $k = ['ablage' => planAblageAus($pdo, $code, $advId, $body)];
        $liste = $body['dateien'] ?? null;
        if (!is_array($liste) || !$liste) respond(400, 'Keine Dateien.');
        if (count($liste) > 500) respond(413, 'Höchstens 500 Dateien je Anfrage.');
        // Erst alles pruefen, dann schreiben: ein Buendel geht ganz oder gar nicht.
        $fertig = [];
        foreach ($liste as $d) {
            $pfad = (string)($d['pfad'] ?? '');
            if (!preg_match(PLAN_PFAD, $pfad, $m)) respond(400, 'Ungültiger Dateiname: ' . mb_substr($pfad, 0, 80));
            $daten = base64_decode((string)($d['daten'] ?? ''), true);
            if ($daten === false || $daten === '') respond(400, 'Die Datei ' . $pfad . ' kam nicht lesbar an.');
            if (strlen($daten) > PLAN_MAX_DATEI) respond(413, 'Die Datei ' . $pfad . ' ist größer als 25 MB.');
            if (!planInhaltPasst($m[1], $daten)) respond(415, 'Der Inhalt von ' . $pfad . ' passt nicht zur Endung.');
            $fertig[$pfad] = $daten;
        }
        $ordner = planOrdner((string)$k['ablage'], true);
        $bytes = 0;
        foreach ($fertig as $pfad => $daten) {
            $ziel = $ordner . '/' . $pfad;
            $dir = dirname($ziel);
            if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) respond(500, 'Ordner für ' . $pfad . ' lässt sich nicht anlegen.');
            // Erst unter anderem Namen, dann umbenennen: eine Kachel, die
            // gerade jemand laedt, ist nie halb geschrieben.
            $tmp = $ziel . '.' . bin2hex(random_bytes(4)) . '.tmp';
            if (@file_put_contents($tmp, $daten) === false) respond(507, 'Die Datei ' . $pfad . ' ließ sich nicht schreiben (Speicherplatz?).');
            if (!@rename($tmp, $ziel)) { @unlink($ziel); if (!@rename($tmp, $ziel)) { @unlink($tmp); respond(500, 'Die Datei ' . $pfad . ' ließ sich nicht ablegen.'); } }
            $bytes += strlen($daten);
        }
        respond(201, 'Hochgeladen.', ['anzahl' => count($fertig), 'bytes' => $bytes]);
    }

    case 'planer_dateien_liste': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $k = ['ablage' => planAblageAus($pdo, $code, $advId, $body)];
        $ordner = planOrdner((string)$k['ablage'], false);
        $dateien = []; $summe = 0;
        if (is_dir($ordner)) {
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($ordner, FilesystemIterator::SKIP_DOTS));
            foreach ($it as $f) {
                if (!$f->isFile()) continue;
                $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($ordner) + 1));
                if (!preg_match(PLAN_PFAD, $rel)) continue;     // halbe .tmp und Fremdes
                $dateien[] = ['pfad' => $rel, 'bytes' => $f->getSize()];
                $summe += $f->getSize();
            }
        }
        usort($dateien, fn($a, $b) => strcmp($a['pfad'], $b['pfad']));
        respond(200, 'OK', ['ablage' => (string)$k['ablage'], 'dateien' => $dateien, 'bytes' => $summe]);
    }

    case 'planer_dateien_weg': {
        if (!validateCode($code)) respond(400, 'Ungültiger Code.');
        $z = zugang($pdo, $code, $pass, $body);
        $advId = (string)($body['adv_id'] ?? '');
        if (!istDmVon($pdo, $z, $code, $advId)) respond(403, 'Das darf nur die Spielleitung.');
        $k = ['ablage' => planAblageAus($pdo, $code, $advId, $body)];
        $ordner = planOrdner((string)$k['ablage'], false);
        // Drei Weisen: einzelne Dateien (pfade), ein Unterordner (praefix,
        // hoechstens zwei Ebenen: ein altes Kartenbild b3, die Bilder eines
        // Orts orte/o_…) oder alles.
        if (isset($body['pfade'])) {
            $pfade = (array)$body['pfade'];
            if (count($pfade) > 500) respond(413, 'Höchstens 500 Dateien je Anfrage.');
            foreach ($pfade as $pf) { if (!preg_match(PLAN_PFAD, (string)$pf)) respond(400, 'Ungültiger Dateiname: ' . mb_substr((string)$pf, 0, 80)); }
            foreach ($pfade as $pf) { if (is_file($ordner . '/' . $pf)) @unlink($ordner . '/' . $pf); }
            respond(200, 'Gelöscht.');
        }
        $praefix = (string)($body['praefix'] ?? '');
        if ($praefix !== '') {
            if (!preg_match('#^[a-z0-9][a-z0-9_-]{0,40}(/[a-z0-9][a-z0-9_-]{0,60})?$#', $praefix)) respond(400, 'Ungültiger Ordner.');
            planOrdnerLeeren($ordner . '/' . $praefix, true);
            respond(200, 'Geleert.');
        }
        planOrdnerLeeren($ordner, false);
        respond(200, 'Geleert.');
    }

    default:
        respond(400, 'Unbekannte Aktion.');
}
