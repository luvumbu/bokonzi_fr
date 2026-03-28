<?php
/**
 * update_front.php — Mise a jour projet / Project update
 * FR: Met a jour les donnees front-end d'un projet
 * EN: Updates project front-end data
 */
session_start();
require_once "../Class/Language.php";
Language::init('fr');

require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;
if (!$id_user) {
    http_response_code(403);
    echo "Non autorisé";
    exit;
}

if (!empty($_POST)) {
    // FR: Transforme toutes les cles POST en variables locales
    // EN: Convert all POST keys to local variables
    extract($_POST, EXTR_SKIP);

    $names = array_keys($_POST);

} else {
    echo t('project_no_post');
}

echo  $id_projet;
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
// FR: Mettre a jour le projet / EN: Update the project
$data = [
    'name_projet' => $name_projet,
    'description_projet' => $description_projet,
    'use_html_project_name' => $use_html_project_name,
    'use_html_description_projet' => $use_html_description_projet,
    'use_html_google_title' => $use_html_google_title,
    'google_title' => $google_title,
    'use_html_metacontent' => $use_html_metacontent,
    'metacontent' => $metacontent,
    'price' => $price,
    'active_visibilite' => $active_visibilite,
    'active_qr_code' => $active_qr_code,
    'password_projet' => $password_projet,
    'active_voix_vocale' => $active_voix_vocale


];
$where = ['id_projet' => $id_projet];
$result = $databaseHandler->update_sql_safe('projet', $data, $where);

if ($result['success']) {
    echo t('project_update_success') . $result['affected_rows'];
} else {
    echo t('error_generic') . $result['message'];
}
$databaseHandler->closeConnection();
