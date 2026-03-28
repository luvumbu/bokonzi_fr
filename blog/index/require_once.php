<?php
/**
 * require_once.php — Bootstrap index / Index bootstrap
 * FR: Chargement des classes et initialisation de la langue
 * EN: Class loading and language initialization
 */
require_once "Class/Language.php";
require_once "Class/LanguageSwitcher.php";
require_once "Class/ThemeSwitcher.php";
require_once "Class/bootstrap.php";

Language::init('fr');
ThemeSwitcher::init();

$filename = 'req_form/dbCheck.php';
$filename_bool = false ;

if (file_exists($filename)) {

require_once $filename;
$filename_bool = true ;

}

?>
