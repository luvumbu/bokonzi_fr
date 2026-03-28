<?php
/**
 * all_projet_sql_child.php — Requete SQL pour les sous-projets / SQL query for sub-projects
 * FR: Requete SQL qui selectionne tous les projets enfants d'un projet parent donne
 * EN: SQL query that selects all child projects of a given parent project
 */

$sql = "
SELECT p.*, ip.img_projet_src_img AS main_img_src
FROM projet p
LEFT JOIN projet_img ip ON p.img_projet = ip.id_projet_img_auto
WHERE p.parent_projet = '{$url}'
ORDER BY p.date_inscription_projet DESC
";
 
?>