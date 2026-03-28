<?php
/**
 * login_bdd.php — Authentification utilisateur / User authentication
 * FR: Verifie les identifiants de connexion en base de donnees
 * EN: Verifies login credentials in database
 */
session_start();
require_once "../Class/Language.php";
Language::init('fr');

require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";

$_SESSION["info_index"] = array();
$info_index_1 = t('login_user_found');
$info_index_2 = t('login_user_not_found');

$__dbname = $_POST["dbname"];
$__username = $_POST["username"];

$_SESSION["info_index"][0] = $info_index_1;

$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// FR: Requete personnalisee / EN: Custom query
$sql = 'SELECT * FROM `profil_user` WHERE `prenom_user`="' . $__dbname . '" AND `password_user`="' . $__username . '"';

// FR: Execution et creation de la variable globale / EN: Execute and create global variable
$result = $databaseHandler->select_custom_safe($sql, 'mes_projets');

if ($result['success']) {

    if (count($mes_projets) != 0) {
        $_SESSION["info_index"][0] = $info_index_1 . count($mes_projets) . ' _  : ' . $mes_projets[0]["nom_user"] . "ifno ok";
         $_SESSION["info_index"][1] = $mes_projets;


    } else {
        $_SESSION["info_index"][0] = $info_index_2;
    }
} else {

    $_SESSION["info_index"][0] = $info_index_2;
    $_SESSION["info_index"][1] =false;
}
?>
