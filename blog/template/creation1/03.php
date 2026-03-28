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
     'attrs' => ['id' => 'id_parent'],
    'flag' => false
]);

/* ==============================
   DIV id_p
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'id_h2'],
    'open'  => true,
    'flag'  => false
]);

/* ==============================
   p
================================ */
$group->addElement([
    'tag'  => 'h2',
    'text' => 'Bonjour h2',
    'flag' => true
]);

/* ==============================
   FERMETURE div id_p
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

