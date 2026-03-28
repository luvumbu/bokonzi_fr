<?php
/**
 * img_projet_src_img.php — Suppression d'image / Image deletion
 * FR: Supprime une image du projet (fichier et base de donnees)
 * EN: Deletes a project image (file and database)
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

$databaseHandler = new DatabaseHandler($dbname, $username, $password);



$fichier = __DIR__ . "/../uploads/" . basename($_POST["img_projet_src_img"]);

if (file_exists($fichier)) {
    unlink($fichier);
    echo "Fichier supprimé ✅";
} else {
    echo "Fichier introuvable ❌";
}





// Supprimer l'utilisateur dont id_utilisateur = 3
$where = ['img_projet_src_img' => $_POST["img_projet_src_img"]];

$result = $databaseHandler->remove_sql_safe('projet_img', $where);

if ($result['success']) {
    echo "Suppression réussie, lignes affectées : " . $result['affected_rows'];
} else {
    echo "Impossible de supprimer : " . $result['message'];
}

$databaseHandler->closeConnection();


?>