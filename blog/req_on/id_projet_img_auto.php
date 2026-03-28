<?php
/**
 * id_projet_img_auto.php — Gestion des images cochees / Checked images management
 * FR: Met a jour le statut is_checked des images du projet
 * EN: Updates the is_checked status of project images
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
// ---------------------------
// FR: Connexion unique / EN: Single connection
// ---------------------------
$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// ---------------------------
// 2️⃣ Récupérer et transformer les tableaux
// ---------------------------



$presentIds = isset($_POST['presentIds']) && $_POST['presentIds'] !== ''
    ? array_map('intval', explode(',', $_POST['presentIds']))
    : [];

$absentIds  = isset($_POST['absentIds']) && $_POST['absentIds'] !== ''
    ? array_map('intval', explode(',', $_POST['absentIds']))
    : [];
echo "test";
// ---------------------------
// 3️⃣ Fonction de mise à jour
// ---------------------------
function updateIds($ids, $value, $dbHandler) {
    foreach ($ids as $id) {
        $data  = ['is_checked' => $value];
        $where = ['id_projet_img_auto' => $id];

        $result = $dbHandler->update_sql_safe('projet_img', $data, $where);

        if ($result['success']) {
            echo "ID $id → is_checked = $value, lignes affectées : {$result['affected_rows']}<br>";
        } else {
            echo "ID $id → ERREUR : {$result['message']}<br>";
        }
    }
}

// ---------------------------
// 4️⃣ Mise à jour
// ---------------------------
updateIds($presentIds, 1, $databaseHandler);
updateIds($absentIds, 0, $databaseHandler);

// ---------------------------
// 5️⃣ Fermer la connexion
// ---------------------------
$databaseHandler->closeConnection();
?>
