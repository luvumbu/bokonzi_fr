<?php
/**
 * creation_formulaire_bdd.php — Formulaire creation BDD / DB creation form
 * FR: Formulaire initial pour configurer la base de donnees
 * EN: Initial form to configure the database
 */
require_once "index/require_once.php";
?>
<link rel="stylesheet" href="css.css">
<div id="info_index"></div>
<?php
/* ==============================
   GROUPE PRINCIPAL / MAIN GROUP
================================ */
$group = new Group(false);

/* ==============================
   CONTAINER PRINCIPAL / MAIN CONTAINER
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => ['id' => 'main_container'],
    'open'  => true,
    'flag'  => false
]);

/* ==============================
   TITRE DU FORMULAIRE / FORM TITLE
================================ */
$group->addElement([
    'tag'   => 'h1',
    'attrs' => ['class'=>"h1_tag"],
    'text'  => t('form_title'),
    'flag'  => true
]);

/* ==============================
   INPUT 1 — DB NAME
================================ */
$group->addElement(['tag'=>'div','open'=>true]);
$group->addElement([
    'tag'=>'label',
    'attrs'=>['for'=>'mon_id_1'],
    'text'=> t('label_dbname'),
    'flag'=>false
]);
$group->addElement([
    'tag'=>'input',
    'attrs'=>[
        'type'=>'text',
        'id'=>'dbname',
        'value'=>'test',
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
    'text'=> t('label_tablename'),
    'flag'=>false
]);
$group->addElement([
    'tag'=>'input',
    'attrs'=>[
        'type'=>'text',
        'id'=>'username',
         'value'=>'root',
        'placeholder'=>'user name'
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
    'text'=> t('label_password'),
    'flag'=>false
]);
$group->addElement([
    'tag'=>'input',
    'attrs'=>[
        'type'=>'password',
        'id'=>'password',
        'placeholder'=>'password'
    ],
    'self'=>true,
    'flag'=>true
]);
$group->addElement(['tag'=>'div','close'=>true]);

/* ==============================
   DIV ENVOYER / SUBMIT BUTTON
================================ */
$group->addElement([
    'tag'   => 'div',
    'attrs' => [
        'id'      => 'id_envoyer',
        'onclick' => 'send_off()',
        'class'   => 'envoyer'
    ],
    'text'  => t('btn_submit'),
    'flag'  => true
]);

/* ==============================
   FERMETURE CONTAINER / CLOSE CONTAINER
================================ */
$group->addElement(['tag'=>'div','close'=>true]);

/* ==============================
   MANAGER
================================ */
$manager = new GroupManager('formData');
$manager->addGroup($group);

/* ==============================
   RENDU HTML + JS / HTML + JS RENDERING
================================ */
echo $manager->render();
$manager->generateJsInformation('req_off/dbCheck_bdd.php');
//$manager->pushJs();
?>


<script>



    function send_off() {

    console.log(formData);


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
    const myTimeout = setTimeout(myGreeting, 250);

    function myGreeting() {
        location.reload();
    }

}
</script>