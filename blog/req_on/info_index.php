<?php
/**
 * info_index.php — Information de session / Session information
 * FR: Retourne l'information de session pour le traitement JS
 * EN: Returns session information for JS processing
 */
session_start();
echo $_SESSION["info_index"][0] ;
/* FR: Cette information est envoyee a JS pour le traitement / EN: This information is sent to JS for processing */
?>

