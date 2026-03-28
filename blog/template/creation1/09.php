<?php
require_once "require_once.php";

$url = $_GET['url'] ?? '';

echo $url ; 

var_dump($url) ;
?>
<link rel="stylesheet" href="../../css.css">
<?php


$group = new Group(false);

/* CONTENEUR PRINCIPAL */
$group->addElement([
    'tag' => 'div',
    'attrs' => ['class' => 'new-project'],
    'open' => true,
    'flag' => true
]);

/* FORMULAIRE */
$group->addElement([
    'tag' => 'form',
    'attrs' => [
        'class' => 'project-form',
        'method' => 'POST',
        'action' => 'save.php'
    ],
    'open' => true,
    'flag' => true
]);

/* =====================================================
   NOM DU PROJET
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Indiquez le nom de votre projet.',
    'flag' => true
]);

$group->addElement([
    'tag' => 'label',
    'attrs' => ['for' => 'use_html_project_name'],
    'open' => true,
    'flag' => true
]);
$group->addElement(['tag' => 'text', 'text' => 'Autoriser HTML', 'flag' => true]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'id' => 'use_html_project_name',
        'name' => 'use_html_project_name',
        'value' => '1'
    ],
    'flag' => true
]);
$group->addElement(['tag' => 'label', 'close' => true, 'flag' => true]);

$group->addElement([
    'tag' => 'div',
    'attrs' => [
        'id' => 'project_name',
        'class' => 'editor',
        'contenteditable' => 'true',


        'data-placeholder' => 'Nom du projet...'
    ],
    'flag' => true
]);


$group->addElement([
    'tag' => 'img',
    'attrs' => [
        'width' => '40',
        'height' => '40',
        'src' => 'https://img.icons8.com/fluency/40/delete-forever.png',
        'onclick' => 'document.getElementById("project_name").innerHTML="";',
        'class' => 'remove_element',
        'alt' => 'delete-sign--v1',

    ],

    'flag' => true
]);
/* =====================================================
   DESCRIPTION PROJET
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Décrivez brièvement votre projet.',
    'flag' => true
]);

$group->addElement([
    'tag' => 'label',
    'attrs' => ['for' => 'use_html_description_projet'],
    'open' => true,
    'flag' => true
]);
$group->addElement(['tag' => 'text', 'text' => 'Autoriser HTML', 'flag' => true]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'id' => 'use_html_description_projet',
        'name' => 'use_html_description_projet',
        'value' => '1'
    ],
    'flag' => true
]);
$group->addElement(['tag' => 'label', 'close' => true, 'flag' => true]);

$group->addElement([
    'tag' => 'div',
    'attrs' => [
        'id' => 'description_projet',
        'class' => 'editor',
        'contenteditable' => 'true',
        'spellcheck' => 'true',
        'data-placeholder' => 'Décris brièvement le projet...'
    ],
    'flag' => true
]);

$group->addElement([
    'tag' => 'img',
    'attrs' => [
        'width' => '40',
        'height' => '40',
        'src' => 'https://img.icons8.com/fluency/40/delete-forever.png',
        'onclick' => 'document.getElementById("description_projet").innerHTML="";',
        'class' => 'remove_element',
        'alt' => 'delete-sign--v1',

    ],

    'flag' => true
]);
/* =====================================================
   GOOGLE TITLE
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Indiquez le titre SEO qui apparaîtra dans Google.',
    'flag' => true
]);

$group->addElement([
    'tag' => 'label',
    'attrs' => ['for' => 'use_html_google_title'],
    'open' => true,
    'flag' => true
]);
$group->addElement(['tag' => 'text', 'text' => 'Autoriser HTML', 'flag' => true]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'id' => 'use_html_google_title',
        'name' => 'use_html_google_title',
        'value' => '1'
    ],
    'flag' => true
]);
$group->addElement(['tag' => 'label', 'close' => true, 'flag' => true]);

$group->addElement([
    'tag' => 'div',
    'attrs' => [
        'id' => 'google_title',
        'class' => 'editor',
        'contenteditable' => 'true',
        'data-placeholder' => 'Titre SEO Google...'
    ],
    'flag' => true
]);
$group->addElement([
    'tag' => 'img',
    'attrs' => [
        'width' => '40',
        'height' => '40',
        'src' => 'https://img.icons8.com/fluency/40/delete-forever.png',
        'onclick' => 'document.getElementById("google_title").innerHTML="";',
        'class' => 'remove_element',
        'alt' => 'delete-sign--v1',

    ],

    'flag' => true
]);
/* =====================================================
   META CONTENT
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Indiquez la meta description SEO.',
    'flag' => true
]);

$group->addElement([
    'tag' => 'label',
    'attrs' => ['for' => 'use_html_metacontent'],
    'open' => true,
    'flag' => true
]);
$group->addElement(['tag' => 'text', 'text' => 'Autoriser HTML', 'flag' => true]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'id' => 'use_html_metacontent',
        'name' => 'use_html_metacontent',
        'value' => '1'
    ],
    'flag' => true
]);
$group->addElement(['tag' => 'label', 'close' => true, 'flag' => true]);




$group->addElement([
    'tag' => 'div',
    'attrs' => [
        'id' => 'metacontent',
        'class' => 'editor',
        'contenteditable' => 'true',
        'data-placeholder' => 'Meta description SEO...'
    ],
    'flag' => true
]);




$group->addElement([
    'tag' => 'img',
    'attrs' => [
        'width' => '40',
        'height' => '40',
        'src' => 'https://img.icons8.com/fluency/40/delete-forever.png',
        'onclick' => 'document.getElementById("metacontent").innerHTML="";',
        'class' => 'remove_element',
        'alt' => 'delete-sign--v1',

    ],

    'flag' => true
]);
/* =====================================================
   price
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Indiquez le price du projet.',
    'flag' => true
]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'number',
        'name' => 'price',
        'id' => 'price',
        'min' => '0',
        'step' => '1'
    ],
    'flag' => true
]);



/* =====================================================
   VISIBILITÉ
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Projet visible publiquement.',
    'flag' => true
]);




$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'name' => 'active_visibilite',
        'id' => 'active_visibilite',
        'value' => '1'
    ],
    'flag' => true
]);

/* =====================================================
   QR CODE
===================================================== */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Activer la génération du QR code.',
    'flag' => true
]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'name' => 'active_qr_code',
        'id' => 'active_qr_code',
        'value' => '1'
    ],
    'flag' => true
]);

/* =========================
   VOIX VOCALE (CHECKBOX)
========================= */
$group->addElement([
    'tag' => 'p',
    'attrs' => ['class' => 'field-description'],
    'text' => 'Activez la voix vocale pour ce projet.',
    'flag' => true
]);

$group->addElement([
    'tag' => 'label',
    'attrs' => ['for' => 'active_voix_vocale'],
    'open' => true,
    'flag' => true
]);
$group->addElement([
    'tag' => 'text',
    'text' => 'Voix vocale',
    'flag' => true
]);
$group->addElement([
    'tag' => 'input',
    'attrs' => [
        'type' => 'checkbox',
        'name' => 'active_voix_vocale',
        'id' => 'active_voix_vocale',
        'value' => '1'
    ],
    'flag' => true
]);
$group->addElement([
    'tag' => 'label',
    'close' => true,
    'flag' => true
]);

 
$group->addElement([
    'tag' => 'label',
    'close' => true,
    'flag' => true
]);



/* =====================================================
   BOUTON ENVOI
===================================================== */
$group->addElement([
    'tag' => 'div',
    'attrs' => [
        'class' => 'submit-btn',
        'onclick' => 'on_send_form()'
    ],
    'text' => 'Envoyer',
    'flag' => true
]);

/* FERMETURES */
$group->addElement(['tag' => 'form', 'close' => true, 'flag' => true]);
$group->addElement(['tag' => 'div', 'close' => true, 'flag' => true]);

/* MANAGER */
$manager = new GroupManager('formData');
$manager->addGroup($group);
echo $manager->render();
$manager->generateJsInformation('x.php');
$manager->pushJs();
?>




<script>
    function on_send_form() {

        if (typeof formData === 'undefined') {
            console.warn('formData n\'existe pas encore !');
            return;
        }

        for (let i = 0; i < formData.identite_tab.length; i++) {
            let id = formData.identite_tab[i][0];
            let value = '';

            let el = document.getElementById(id);
            if (el) {
                // Pour les div contenteditable (éditeur)
                if (el.contentEditable === "true") {
                    value = el.innerHTML;
                }
                // Pour checkbox
                else if (el.type === 'checkbox') {
                    value = el.checked ? '1' : '0';
                }
                // Pour radio (si nécessaire)
                else if (el.type === 'radio') {
                    let checked = document.querySelector('input[name="' + el.name + '"]:checked');
                    value = checked ? checked.value : '';
                }
                // Pour les autres inputs classiques
                else {
                    value = el.value;
                }

                formData.identite_tab[i][1] = value;
            }
        }

        console.log('Valeurs à envoyer :', formData.identite_tab);
        formData.push();
    }
</script>



 <?php 

 /*
    <div id="gallery-flex">

        <!-- IMAGE 1 -->
        <div class="gallery-item">
            <img src="https://i.pinimg.com/736x/5e/54/9f/5e549f54dd92ff0fc96dd2f44f3f9c2b.jpg" alt="">

            <div class="actions">
                <!-- Checkbox -->
                <input type="checkbox" class="check-remove">

                <!-- Corbeille -->
                <img
                    src="https://img.icons8.com/ios-glyphs/30/trash--v1.png"
                    class="remove_element"
                    alt="Supprimer"
                    title="Supprimer">

                <!-- Etoile -->
                <label class="star-wrap">
                    <input type="radio" name="mainImage">
                    <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
                        <polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.8 5.5 21 7.5 13.5 2 9 9 9" />
                    </svg>
                </label>
            </div>
        </div>

        <!-- IMAGE 2 -->
        <div class="gallery-item">
            <img src="https://i.pinimg.com/736x/5e/54/9f/5e549f54dd92ff0fc96dd2f44f3f9c2b.jpg" alt="">

            <div class="actions">
                <!-- Checkbox -->
                <input type="checkbox" class="check-remove">

                <!-- Corbeille -->
                <img
                    src="https://img.icons8.com/ios-glyphs/30/trash--v1.png"
                    class="remove_element"
                    alt="Supprimer"
                    title="Supprimer">

                <!-- Etoile -->
                <label class="star-wrap">
                    <input type="radio" name="mainImage">
                    <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
                        <polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 16.8 5.5 21 7.5 13.5 2 9 9 9" />
                    </svg>
                </label>
            </div>
        </div>
    </div>
 */


    ?>

