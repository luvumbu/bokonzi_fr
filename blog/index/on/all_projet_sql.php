<?php
/**
 * all_projet_sql.php — Requete SQL pour les projets racine de l'utilisateur / SQL query for user root projects
 * FR: Requete SQL qui selectionne tous les projets racine (sans parent) de l'utilisateur connecte
 * EN: SQL query that selects all root projects (without parent) of the logged-in user
 */
$session_id_user = $_SESSION["info_index"][1][0]["id_user"];
$sql = "
SELECT p.*, ip.img_projet_src_img AS main_img_src
FROM projet p
LEFT JOIN projet_img ip ON p.img_projet = ip.id_projet_img_auto
WHERE p.id_user_projet = '$session_id_user'
AND p.parent_projet IS NULL
ORDER BY p.date_inscription_projet DESC
"; 
?>