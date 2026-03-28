<?php
/**
 * session_destroy.php — Deconnexion de l'app / App logout
 * FR: Supprime la session de l'app et redirige vers le dashboard
 * EN: Clears app session and redirects to dashboard
 */
session_start();
unset($_SESSION["info_index"]);
unset($_SESSION["idProjet"]);
header('Content-Type: application/json');
$docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);
$appRoot = str_replace('\\', '/', dirname(__DIR__));
$baseUri = str_replace($docRoot, '', dirname($appRoot));
echo json_encode(['redirect' => $baseUri . '/pages/dashboard.php?tab=apps']);
?>
