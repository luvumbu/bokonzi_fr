<?php
/**
 * update_social.php — Modifier un reseau social
 */
session_start();
require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;
if (!$id_user) {
    http_response_code(403);
    echo json_encode(['success' => false]);
    exit;
}

$id = (int)($_POST['id_social'] ?? 0);
$nom = $_POST['nom_social'] ?? '';
$img = $_POST['img_social'] ?? '';
$url = $_POST['url_social'] ?? '';

if ($id <= 0 || empty($nom) || empty($url)) {
    echo json_encode(['success' => false, 'message' => 'Champs manquants']);
    exit;
}

$databaseHandler = new DatabaseHandler($dbname, $username, $password);
$data = [
    'nom_social' => $nom,
    'img_social' => $img,
    'url_social' => $url
];
$where = ['id_social' => $id];
$result = $databaseHandler->update_sql_safe('social_media', $data, $where);
$databaseHandler->closeConnection();

header('Content-Type: application/json');
echo json_encode(['success' => $result['success']]);
