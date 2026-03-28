<?php
require_once "require_once.php" ; 

/* ==============================
   GROUPE PRINCIPALE
================================ */
$group = new Group(false);

/* ==============================
   DIV PRINCIPALE
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'main_div_img_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   DIV CONTENEUR IMAGE
================================ */
$group->addElement([
    'tag'  => 'div',
    'attrs'=> ['id' => 'img_container_1'],
    'open' => true,
    'flag' => false
]);

/* ==============================
   IMAGE
================================ */
$group->addElement([
    'tag'   => 'img',
    'attrs' => [
        'src'   => 'https://i.pinimg.com/1200x/0e/a8/7c/0ea87caa229147492d24a85e216e68d7.jpg',
        'alt'   => '',
        'srcset'=> ''
    ],
    'self'  => true,
    'flag'  => true
]);

/* ==============================
   FERMETURE DIV CONTENEUR IMAGE
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
      <img src="https://i.pinimg.com/1200x/0e/a8/7c/0ea87caa229147492d24a85e216e68d7.jpg" alt="" srcset="">
   </div>
</div>
-->