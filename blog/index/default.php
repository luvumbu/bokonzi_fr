<?php
/**
 * default.php — Page par defaut / Default page
 * FR: Routeur principal — redirige vers creation BDD ou login
 * EN: Main router — redirects to DB creation or login
 */
$source_dbcheck = "info_exe/dbCheck.php";
$login = "index/login.php" ;

// FR: Demande a l'utilisateur le nom de la BD, la table et le mot de passe
// EN: Ask the user for DB name, table and password

// FR: Verification de l'existence du fichier de configuration
// EN: Check if the configuration file exists
if (!file_exists($source_dbcheck)) {
   require_once "index/creation_formulaire_bdd.php";
} else {
   require_once $source_dbcheck;

   // FR: Tester la connexion BDD — si echec, supprimer dbCheck et afficher formulaire
   // EN: Test DB connection — if it fails, delete dbCheck and show creation form
   $test_conn = @new mysqli("localhost", $username, $password, $dbname);
   if ($test_conn->connect_error) {
      unlink($source_dbcheck);
      require_once "index/creation_formulaire_bdd.php";
      return;
   }
   $test_conn->close();
   if (isset($_SESSION["info_index"])) {
      if ($_SESSION["info_index"][1]) {
       require_once "index/on.php";
       // FR: Lorsque l'utilisateur est en ligne
       // EN: When the user is online
      } else {
        require_once $login;
        require_once "index/public_projets.php";
        require_once "info_exe/effacement.php";
      }
   } else {
       require_once $login;
       require_once "index/public_projets.php";
       require_once "info_exe/effacement.php";
   }
}




//require_once "index/creation_formulaire_bdd.php";
