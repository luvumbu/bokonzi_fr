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
    'attrs'=> ['id' => 'main_div_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   DIV GAUCHE
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'left_container_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   ELEMENTS GAUCHE
================================ */
for ($i=1; $i<=5; $i++) {
    $group->addElement([
        'tag'   => 'div',
        'attrs' => ['id' => 'left_element_'.$i],
        'text'  => 'ELEMENT GAUCHE '.$i,
        'flag'  => true
    ]);
}

/* ==============================
   FERMETURE DIV GAUCHE
================================ */
$group->addElement([
    'tag'   => 'div',
    'close' => true
]);

/* ==============================
   DIV DROITE
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'right_container_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   ELEMENTS DROITE
================================ */
for ($i=1; $i<=4; $i++) {
    $group->addElement([
        'tag'   => 'div',
        'attrs' => ['id' => 'right_element_'.$i],
        'text'  => 'ELEMENT DROITE '.$i,
        'flag'  => true
    ]);
}

/* ==============================
   FERMETURE DIV DROITE
================================ */
$group->addElement([
    'tag'   => 'div',
    'close' => true
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
      <div>
         ELEMENT GAUCHE 1
      </div>
      <div>
         ELEMENT GAUCHE 1
      </div>
      <div>
         ELEMENT GAUCHE 1
      </div>
      <div>
         ELEMENT GAUCHE 1
      </div>
      <div>
         ELEMENT GAUCHE 1
      </div>
   </div>
   <div>
      <div>
         ELEMENT DROITE 1
      </div>
      <div>
         ELEMENT DROITE 1
      </div>
      <div>
         ELEMENT DROITE 1
      </div>
      <div>
         ELEMENT DROITE 1
      </div>
   </div>
</div>
-->