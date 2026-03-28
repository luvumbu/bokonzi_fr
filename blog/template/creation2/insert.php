<?php
/*
session_start();
header("Access-Control-Allow-Origin: *");
require_once "../Class/DatabaseHandler.php";
require_once "../req_off/dbCheck.php";

$session_id_user = $_SESSION["info_index"][1][0]["id_user"];

if(isset($session_id_user)){
// Connexion
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
$projectData = [
    'id_user_projet' =>  $session_id_user,
    'name_projet' => '',
    'description_projet' => ''
];
$resultProjet = $databaseHandler->insert_safe('projet', $projectData, 'id_projet');
if ($resultProjet['success']) {
    $idProjet = $resultProjet['id'];
    echo "Projet créé (ID $idProjet)<br>";

    // 🔹 Créer un style par défaut pour ce projet
    $defaultStyle = [
        'id_projet_style' => $idProjet

        // tu peux ajouter d'autres valeurs par défaut
    ];
    $databaseHandler->insert_safe('style', $defaultStyle, 'id_style');

    // 🔹 Créer des paramètres par défaut pour ce projet
    $defaultParams = [
        'id_projet_param' => $idProjet
    ];
    $databaseHandler->insert_safe('projet_params', $defaultParams, 'id_param');

    echo "Style et paramètres par défaut créés pour le projet<br>";
} else {
    echo "⚠️ Problème lors de la création du projet : " . $resultProjet['message'] . "<br>";
}
// 🔹 Fermer la connexion
$databaseHandler->closeConnection();
}
else{
    echo "COnnectez vous pour faire le test";
}


*/