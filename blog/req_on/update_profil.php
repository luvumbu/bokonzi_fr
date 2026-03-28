<?php
/**
 * update_profil.php — Mise a jour du profil / Profile update
 * FR: Endpoint AJAX pour modifier prenom et mot de passe
 * EN: AJAX endpoint to update first name and password
 */
session_start();
require_once "../Class/Language.php";
Language::init('fr');

header('Content-Type: application/json');
require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$id_user = $_SESSION["info_index"][1][0]["id_user"] ?? null;

if ($id_user && !empty($_POST)) {
    $data = [
        'nom_user'      => $_POST['nom_user'] ?? '',
        'password_user' => $_POST['password_user'] ?? '',
    ];

    $databaseHandler = new DatabaseHandler($dbname, $username, $password);
    $where = ['id_user' => $id_user];
    $result = $databaseHandler->update_sql_safe('profil_user', $data, $where);

    if ($result['success']) {
        $_SESSION["info_index"][1][0]["nom_user"]        = $data['nom_user'];
        $_SESSION["info_index"][1][0]["password_user"]   = $data['password_user'];

        echo json_encode(['success' => true, 'message' => t('profile_update_success')]);
    } else {
        echo json_encode(['success' => false, 'message' => t('profile_update_error')]);
    }

    $databaseHandler->closeConnection();
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No data received']);
}
