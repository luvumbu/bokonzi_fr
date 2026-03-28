<?php
/**
 * delete_social.php — Suppression reseau social / Delete social media
 * FR: Endpoint AJAX pour supprimer un reseau social
 * EN: AJAX endpoint to delete a social media link
 */
session_start();
header('Content-Type: application/json');
require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;
$id_social = $_POST['id_social'] ?? null;

if ($id_user && $id_social) {
    $databaseHandler = new DatabaseHandler($dbname, $username, $password);

    $where = ['id_social' => $id_social, 'id_user_social' => $id_user];
    $result = $databaseHandler->remove_sql_safe('social_media', $where);
    $databaseHandler->closeConnection();

    echo json_encode(['success' => true]);
} else {
    http_response_code(400);
    echo json_encode(['success' => false]);
}
