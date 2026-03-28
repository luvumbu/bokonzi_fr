<?php
/**
 * update_img_projet.php — Mise a jour image projet / Project image update
 * FR: Met a jour l'image principale d'un projet
 * EN: Updates the main image of a project
 */
session_start();
require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;
if (!$id_user) {
    http_response_code(403);
    echo "Non autorisé";
    exit;
}

$img_projet = $_POST["img_projet"] ;
$id_projet = $_POST["id_projet"] ;
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
// FR: Mettre a jour l'image du projet / EN: Update project image
$data = ['img_projet' =>$img_projet];
$where = ['id_projet' => $id_projet];
$result = $databaseHandler->update_sql_safe('projet', $data, $where);
if ($result['success']) {
    echo "Mise à jour réussie, lignes affectées : " . $result['affected_rows'];
} else {
    echo "Erreur : " . $result['message'];
}
$databaseHandler->closeConnection();
?>