<?php

require_once "require_once.php" ; 

 
/* ==============================
   GROUPE PRINCIPAL
================================ */
$group = new Group(false);

/* ==============================
   DIV PRINCIPALE
================================ */
$group->addElement([
    'tag'  => 'div',
    'open' => true,
    'flag' => false
]);

/* ==============================
   DIV id_h1
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'id_h1'],
    'open'  => true,
    'flag'  => false
]);

/* ==============================
   H1
================================ */
$group->addElement([
    'tag'  => 'h1',
    'text' => 'Bonjour h1',
    'flag' => true
]);

/* ==============================
   FERMETURE div id_h1
================================ */
$group->addElement([
    'tag'   => 'div',
    'close' => true
]);

/* ==============================
   FERMETURE div principale
================================ */
$group->addElement([
    'tag'   => 'div',
    'close' => true
]);

/* ==============================
   MANAGER
================================ */
$manager = new GroupManager('formData');
$manager->addGroup($group);

/* ==============================
   RENDU
================================ */
echo $manager->render();




?>

