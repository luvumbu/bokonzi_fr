<?php
// Configuration globale — BDD + Google OAuth
// Depend de : .credentials.php (BDD), .google_oauth.php (OAuth), sql/config_sql.php (init tables)
// Utilise par : index.php, auth/login.php, auth/callback.php, auth/logout.php, pages/dashboard.php, admin/setup_bdd.php, docs/index.php
//
// +---------------------+------------------------------------------+
// | Fichier             | Role                                     |
// +---------------------+------------------------------------------+
// | .credentials.php    | Identifiants BDD (auto-supprime si KO)   |
// | .google_oauth.php   | Cles Google OAuth (permanent)            |
// | sql/config_sql.php  | initDatabase() creation BDD + tables     |
// +---------------------+------------------------------------------+
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ========================================
// 1. CREDENTIALS — fichier obligatoire
// ========================================

$credFile = __DIR__ . '/.credentials.php';
$_loginUrl = (stripos($_SERVER['REQUEST_URI'] ?? '', '/auth/') !== false)
    ? 'login.php'
    : 'auth/login.php';

if (!file_exists($credFile)) {
    header('Location: ' . $_loginUrl);
    exit;
}
$creds = require $credFile;

define('DB_HOST', $creds['DB_HOST']);
define('DB_NAME', $creds['DB_NAME']);
define('DB_USER', $creds['DB_USER']);
define('DB_PASS', $creds['DB_PASS']);

// ========================================
// 2. GOOGLE OAUTH (depuis .google_oauth.php)
// ========================================

$oauthFile = __DIR__ . '/.google_oauth.php';
$oauth = file_exists($oauthFile) ? require $oauthFile : [];

$isLocal = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']);

define('GOOGLE_CLIENT_ID', $oauth['GOOGLE_CLIENT_ID'] ?? '');
define('GOOGLE_CLIENT_SECRET', $oauth['GOOGLE_CLIENT_SECRET'] ?? '');
define('GOOGLE_REDIRECT_URI', $isLocal
    ? 'http://localhost/dossier_bokonzi_fr/auth/callback.php'
    : 'https://bokonzi.fr/auth/callback.php'
);

// ========================================
// 3. ADMIN — gere uniquement en BDD (is_admin)
// Le premier admin est admin@local (connexion formulaire)
// ========================================

// ========================================
// 4. CONNEXION MYSQL
// ========================================

// Forcer les exceptions mysqli (certains serveurs ne le font pas par defaut)
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
    $conn->set_charset('utf8mb4');
    $conn->select_db(DB_NAME);
} catch (mysqli_sql_exception $e) {
    // Credentials ou BDD invalides → supprimer le fichier
    if (isset($conn) && !$conn->connect_error) {
        $conn->close();
    }
    unlink($credFile);
    header('Location: ' . $_loginUrl);
    exit;
}

// Initialiser la BDD et les tables
require_once __DIR__ . '/sql/config_sql.php';
initDatabase($conn);
