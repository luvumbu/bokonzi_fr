<?php
/**
 * update_projet.php — Mise a jour projet / Project update
 * FR: Endpoint de mise a jour des donnees projet
 * EN: Project data update endpoint
 */
session_start();
require_once "../Class/DatabaseHandler.php";
require_once "../req_off/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;
if (!$id_user) {
    http_response_code(403);
    echo "Non autorisé";
    exit;
}
?>


