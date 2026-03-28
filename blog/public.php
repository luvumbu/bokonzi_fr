<?php
/**
 * public.php — Vue publique d'un article blog (sans Kirby, sans sidebar)
 * Acces : public.php?id=XX
 */
session_start();
require_once __DIR__ . '/Class/bootstrap.php';
require_once __DIR__ . '/info_exe/dbCheck.php';
require_once __DIR__ . '/Class/DatabaseHandler.php';
require_once __DIR__ . '/Class/Language.php';
require_once __DIR__ . '/Class/Give_url.php';
require_once __DIR__ . '/Class/html_brut.php';
Language::init('fr');

$url = (int)($_GET['id'] ?? 0);
if ($url <= 0) {
    header('Location: ./');
    exit;
}

// Chemins absolus
$appBase = str_replace('\\', '/', str_replace(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '', str_replace('\\', '/', __DIR__))) . '/';
$siteBase = str_replace('\\', '/', str_replace(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '', str_replace('\\', '/', dirname(__DIR__)))) . '/';

// Verifier visibilite
$db = new DatabaseHandler($dbname, $username, $password);
$sql = "SELECT * FROM projet WHERE id_projet = $url";
$result = $db->select_custom_safe($sql, 'check_projet');
$db->closeConnection();

if (!$result['success'] || empty($check_projet)) {
    die('Projet introuvable');
}

$is_logged_in = isset($_SESSION["info_index"][1][0]["id_user"]);
$is_owner = $is_logged_in && $check_projet[0]["id_user_projet"] == $_SESSION["info_index"][1][0]["id_user"];

if (!$is_owner && $check_projet[0]["active_visibilite"] != 1) {
    die('Ce projet n\'est pas encore visible publiquement.');
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($check_projet[0]['name_projet'] ?? 'Projet') ?> — BOKONZI</title>
    <link rel="icon" type="image/svg+xml" href="<?= $siteBase ?>favicon.svg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="<?= $appBase ?>css/article-public.css">
</head>
<body>
<?php
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
require_once __DIR__ . '/projet/index_html.php';
?>
<a href="<?= $appBase ?>" class="blog-home-btn">
    <i class="fa-solid fa-arrow-left"></i> Retour
</a>
</body>
</html>
