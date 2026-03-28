<?php
require_once "../Class/Element_.php";
require_once "../Class/Group_.php";
require_once "../Class/GroupManager_.php";
require_once "../Class/DatabaseHandler.php";

/* ==============================
   GROUPE PRINCIPAL
================================ */
$group = new Group(false);

/* ==============================
   CONTAINER PRINCIPAL
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'main_container'],
    'open'  => true,
    'flag'  => false
]);

/* ==============================
   TITRE DU FORMULAIRE
================================ */
$group->addElement([
    'tag'   => 'h1',
    'attrs' => ['class'=>"h1_tag"],
    'text'  => 'Mon formulaire',
    'flag'  => true
]);

/* ==============================
   INPUT 1 — DB NAME
================================ */
$group->addElement(['tag'=>'div','open'=>true]);
$group->addElement([
    'tag'=>'label',
    'attrs'=>['for'=>'mon_id_1'],
    'text'=>'DB NAME',
    'flag'=>false
]);
$group->addElement([
    'tag'=>'input',
    'attrs'=>[
        'type'=>'text',
        'id'=>'mon_id_1',
        'placeholder'=>'dbname'
    ],
    'self'=>true,
    'flag'=>true
]);
$group->addElement(['tag'=>'div','close'=>true]);

/* ==============================
   INPUT 2 — TABLE NAME
================================ */
$group->addElement(['tag'=>'div','open'=>true]);
$group->addElement([
    'tag'=>'label',
    'attrs'=>['for'=>'mon_id_2'],
    'text'=>'TABLE NAME',
    'flag'=>false
]);
$group->addElement([
    'tag'=>'input',
    'attrs'=>[
        'type'=>'text',
        'id'=>'mon_id_2',
        'placeholder'=>'table name'
    ],
    'self'=>true,
    'flag'=>true
]);
$group->addElement(['tag'=>'div','close'=>true]);

/* ==============================
   INPUT 3 — PASSWORD
================================ */
$group->addElement(['tag'=>'div','open'=>true]);
$group->addElement([
    'tag'=>'label',
    'attrs'=>['for'=>'mon_id_3'],
    'text'=>'PASSWORD',
    'flag'=>false
]);
$group->addElement([
    'tag'=>'input',
    'attrs'=>[
        'type'=>'password',
        'id'=>'mon_id_3',
        'placeholder'=>'password'
    ],
    'self'=>true,
    'flag'=>true
]);
$group->addElement(['tag'=>'div','close'=>true]);

/* ==============================
   DIV ENVOYER
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => [
        'id'      => 'id_envoyer',
        'onclick' => 'send()',
        'class'   => 'envoyer'
    ],
    'text'  => 'Envoyer',
    'flag'  => true
]);

/* ==============================
   FERMETURE CONTAINER
================================ */
$group->addElement(['tag'=>'div','close'=>true]);

/* ==============================
   MANAGER
================================ */
$manager = new GroupManager('formData');
$manager->addGroup($group);

/* ==============================
   RENDU HTML + JS
================================ */
echo $manager->render();
$manager->generateJsInformation('traitement.php');
$manager->pushJs();
?>
<link rel="stylesheet" href="../../css.css">

<script>
function send() {



console.log(formData ) ; 

 
    if (typeof formData === 'undefined') {
        console.warn('formData n\'existe pas encore !');
        return;
    }

    for (let i = 0; i < formData.identite_tab.length; i++) {
        let id = formData.identite_tab[i][0];
        let value = '';

        let el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox') {
                value = el.checked ? el.value : '0';
            } else if (el.type === 'radio') {
                let checked = document.querySelector('input[name="' + el.name + '"]:checked');
                value = checked ? checked.value : '';
            } else {
                value = el.value;
            }
            formData.identite_tab[i][1] = value;
        }
    }

    console.log('Valeurs à envoyer :', formData.identite_tab);
    formData.push();

   
}
</script>


 