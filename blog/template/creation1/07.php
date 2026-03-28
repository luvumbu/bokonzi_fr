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
   ELEMENTS GAUCHE (<h1>)
================================ */
for ($i = 1; $i <= 5; $i++) {
    $group->addElement([
        'tag'  => 'div',
        'attrs'=> ['id' => 'left_element_div_'.$i],
        'open' => true,
        'flag' => false
    ]);

    $group->addElement([
        'tag'  => 'h1',
        'attrs'=> ['id' => 'left_element_h1_'.$i],
        'text' => 'ELEMENT GAUCHE '.$i,
        'flag' => true
    ]);

    $group->addElement([
        'tag'   => 'div',
        'close' => true
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
   ELEMENTS DROITE (<h2>)
================================ */
for ($i = 1; $i <= 4; $i++) {
    $group->addElement([
        'tag'  => 'div',
        'attrs'=> ['id' => 'right_element_div_'.$i],
        'open' => true,
        'flag' => false
    ]);

    $group->addElement([
        'tag'  => 'h2',
        'attrs'=> ['id' => 'right_element_h2_'.$i],
        'text' => 'ELEMENT DROITE '.$i,
        'flag' => true
    ]);

    $group->addElement([
        'tag'   => 'div',
        'close' => true
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
         <h1>
            ELEMENT GAUCHE 1
         </h1>
      </div>
      <div>
         <h1>
            ELEMENT GAUCHE 1
         </h1>
      </div>
      <div>
         <h1>
            ELEMENT GAUCHE 1
         </h1>
      </div>
      <div>
         <h1>
            ELEMENT GAUCHE 1
         </h1>
      </div>
      <div>
         <h1>
            ELEMENT GAUCHE 1
         </h1>
      </div>
   </div>
   <div>
      <div>
         <h2>
            ELEMENT DROITE 1
         </h2>
      </div>
      <div>
         <h2>
            ELEMENT DROITE 1
         </h2>
      </div>
      <div>
         <h2>
            ELEMENT DROITE 1
         </h2>
      </div>
      <div>
         <h2>
            ELEMENT DROITE 1
         </h2>
      </div>
   </div>
</div>
-->