<?php
/**
 * themes.css.php — Charge automatiquement tous les fichiers CSS du dossier themes/
 * Ajouter un theme = deposer un .css dans themes/ et c'est tout
 */
header('Content-Type: text/css; charset=utf-8');

$dir = __DIR__ . '/themes/';
foreach (glob($dir . '*.css') as $file) {
    readfile($file);
    echo "\n";
}
