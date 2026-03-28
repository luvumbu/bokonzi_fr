<?php
/**
 * insert_social.php — Ajout reseau social / Add social media
 * FR: Endpoint AJAX pour ajouter un reseau social
 * EN: AJAX endpoint to add a social media link
 */
session_start();
header('Content-Type: application/json');
require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;

if ($id_user && !empty($_POST['nom_social']) && !empty($_POST['url_social'])) {
    $databaseHandler = new DatabaseHandler($dbname, $username, $password);

    $data = [
        'id_user_social' => $id_user,
        'nom_social'     => $_POST['nom_social'],
        'img_social'     => $_POST['img_social'] ?? '',
        'url_social'     => $_POST['url_social'],
    ];

    $result = $databaseHandler->insert_safe('social_media', $data, 'url_social');
    $databaseHandler->closeConnection();

    echo json_encode(['success' => $result['success'], 'id' => $result['id'] ?? null]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false]);
}
