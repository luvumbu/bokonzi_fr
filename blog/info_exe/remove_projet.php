<?php
/**
 * remove_projet.php — Suppression de projet / Project deletion
 * FR: Supprime un projet de la base de donnees
 * EN: Deletes a project from the database
 */

session_start();
require_once "../Class/Language.php";
Language::init('fr');

header("Access-Control-Allow-Origin: *");

require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";
echo  $_POST["remove_projet"] ;
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
$where = ['id_projet' => $_POST["remove_projet"]];
$result = $databaseHandler->remove_sql_safe('projet', $where);
if ($result['success']) {
    echo t('project_delete_success') . $result['affected_rows'];
} else {
    echo t('project_delete_error') . $result['message'];
}
$databaseHandler->closeConnection();

?>