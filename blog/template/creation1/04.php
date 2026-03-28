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
    'attrs'=> ['id' => 'main_div_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   DIV TITRE
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'titre_div_1'],
    'text'  => 'Mon titre',
    'flag'  => true
]);

/* ==============================
   DIV CONTENEUR ELEMENTS
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'container_elements_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   ELEMENT 1
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'element_1'],
    'text'  => 'Element 1',
    'flag'  => true
]);

/* ==============================
   ELEMENT 2
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'element_2'],
    'text'  => 'Element 2',
    'flag'  => true
]);

/* ==============================
   ELEMENT 3
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'element_3'],
    'text'  => 'Element 3',
    'flag'  => true
]);

/* ==============================
   FERMETURE DIV CONTENEUR ELEMENTS
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
      Mon titre 
   </div>
   <div>
      <div>
         Element 1 
      </div>
            <div>
         Element 2 
      </div>
            <div>
         Element 3 
      </div>
   </div>
</div>
-->