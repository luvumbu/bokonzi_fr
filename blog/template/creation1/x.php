<?php 

 require_once "../Class/DatabaseHandler.php" ; 
 require_once "../req_off/dbCheck.php" ; 
 
 





 
if (!empty($_POST)) {
    // Transforme toutes les clés POST en variables locales
    extract($_POST, EXTR_SKIP); // EXTR_SKIP évite d'écraser des variables existantes

    // Affichage des noms des champs POST uniquement
    $names = array_keys($_POST);
    var_dump($names); // Affiche juste les noms des champs

    // Exemple : si $_POST contient "meta" et "title"
    // tu pourras faire directement :
    // echo $meta;
    // echo $title;

} else {
    echo "Aucune donnée POST reçue.";
}
 
echo $project_name ; 
//echo $use_html_project_name ; 

 
 /*

$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// Mettre à jour le nom du projet dont id_projet = 2
 
    $data = [
    'name_projet' => $_POST["name_projet"],
    'description_projet' => $_POST["description_projet"]
    ];


  
$where = ['id_projet' => $_POST["id_envoyer"]];

$result = $databaseHandler->update_sql_safe('projet', $data, $where);

if ($result['success']) {
    echo "Mise à jour réussie, lignes affectées : " . $result['affected_rows'];
} else {
    echo "Erreur : " . $result['message'];
}

$databaseHandler->closeConnection();

*/