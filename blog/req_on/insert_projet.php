<?php
/**
 * insert_projet.php — Creation de projet / Project creation
 * FR: Cree un nouveau projet avec style et parametres par defaut
 * EN: Creates a new project with default style and parameters
 */
session_start();
require_once "../Class/Language.php";
Language::init('fr');

require_once "../Class/DatabaseHandler.php";
require_once "../info_exe/dbCheck.php";
$session_id_user = $_SESSION["info_index"][1][0]["id_user"];
if (isset($session_id_user)) {
    // FR: Connexion / EN: Connection
    if (isset($_POST["parent_projet"])) {
        $databaseHandler = new DatabaseHandler($dbname, $username, $password);
        $projectData = [
            'id_user_projet' =>  $session_id_user,
            'name_projet' => '',
            'description_projet' => '',
            'parent_projet' => $_POST["parent_projet"]
        ];
    } else {
        $databaseHandler = new DatabaseHandler($dbname, $username, $password);
        $projectData = [
            'id_user_projet' =>  $session_id_user,
            'name_projet' => '',
            'description_projet' => ''
        ];
    }
    // Insertion directe sans verification d'unicite (id_projet est AUTO_INCREMENT)
    $columnsStr = implode("`, `", array_keys($projectData));
    $valuesStr = implode("', '", array_map([$databaseHandler->connection, 'real_escape_string'], array_values($projectData)));
    $sql = "INSERT INTO `projet` (`$columnsStr`) VALUES ('$valuesStr')";
    $insertOk = $databaseHandler->connection->query($sql);
    $resultProjet = [
        'success' => $insertOk === true,
        'id' => $insertOk ? $databaseHandler->connection->insert_id : null,
        'message' => $insertOk ? 'OK' : $databaseHandler->connection->error
    ];
    if ($resultProjet['success'] && $resultProjet['id'] > 0) {
        $idProjet = $resultProjet['id'];

        // FR: Creer un style par defaut pour ce projet / EN: Create default style for this project
        $defaultStyle = [
            'id_projet_style' => $idProjet
        ];
        $databaseHandler->insert_safe('style', $defaultStyle, 'id_style');

        // FR: Creer des parametres par defaut / EN: Create default parameters
        $defaultParams = [
            'id_projet_param' => $idProjet
        ];
        $databaseHandler->insert_safe('projet_params', $defaultParams, 'id_param');

        $_SESSION["idProjet"] = $idProjet;
        $databaseHandler->closeConnection();

        // FR: Retourne le JSON avec l'ID / EN: Return JSON with the ID
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'id' => $idProjet]);
    } else {
        $databaseHandler->closeConnection();
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $resultProjet['message']]);
    }
} else {
    echo t('login_connect_prompt');
}
