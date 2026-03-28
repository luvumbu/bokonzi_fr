<?php
require_once "require_once.php";

 /* ==============================
   GROUPE PRINCIPAL
================================ */
$group = new Group(false);

/* ==============================
   DIV PRINCIPALE
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'main_div_form_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   INPUT 1
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'input_div_1'],
    'open' => true,
    'flag' => false
]);

$group->addElement([
    'tag'  => 'input',
    'attrs'=> [
        'type' => 'text',
        'id'   => 'input_1',
        'placeholder' => 'Texte 1'
    ],
    'self' => true,
    'flag' => true
]);

$group->addElement([
    'tag'   => 'div',
    'close' => true
]);

/* ==============================
   INPUT 2
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'input_div_2'],
    'open' => true,
    'flag' => false
]);

$group->addElement([
    'tag'  => 'input',
    'attrs'=> [
        'type' => 'text',
        'id'   => 'input_2',
        'placeholder' => 'Texte 2'
    ],
    'self' => true,
    'flag' => true
]);

$group->addElement([
    'tag'   => 'div',
    'close' => true
]);

/* ==============================
   DIV ENVOYER
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'send_div_1'],
    'text'  => 'Envoyer',
    'flag'  => true
]);

/* ==============================
   FERMETURE DIV PRINCIPALE
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


 

<!--
<div>
   <div>
      <input type="text">
   </div>
   <div>
      <input type="text">
   </div>
   <div>
      Envoyer
   </div>
</div>
-->