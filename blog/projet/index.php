

<?php
require_once "projet/require_once.php";
$appBase = str_replace('\\', '/', str_replace(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '', str_replace('\\', '/', dirname(__DIR__)))) . '/';
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
// Je veux ma propre requête
$sql = "SELECT * FROM `projet` WHERE `id_projet`='$url'";
// On exécute et on crée une variable globale $mes_projets
$result = $databaseHandler->select_custom_safe($sql, 'mes_projets');

// FR: Si le projet n'existe pas, redirection vers l'accueil
// EN: If the project doesn't exist, redirect to home
if (!$result['success'] || empty($mes_projets)) {
    $databaseHandler->closeConnection();
    echo '<script>window.location.href = "./";</script>';
    return;
}

// FR: Verifier si l'utilisateur connecte est le proprietaire du projet
// EN: Check if logged-in user is the project owner
$is_logged_in = isset($_SESSION["info_index"][1][0]["id_user"]);
$is_owner = $is_logged_in
    && isset($mes_projets[0])
    && $mes_projets[0]["id_user_projet"] == $_SESSION["info_index"][1][0]["id_user"];

// FR: Si le visiteur n'est pas le proprietaire et le projet n'est pas visible, bloquer
// EN: If visitor is not the owner and project is not visible, block access
if (!$is_owner && isset($mes_projets[0]) && $mes_projets[0]["active_visibilite"] != 1) {
    $databaseHandler->closeConnection();
    ?>
    <div class="project-not-visible">
        <i class="fa-solid fa-eye-slash"></i>
        <p><?= t('project_not_visible') ?></p>
        <a href="./">&larr; <?= t('nav_home') ?></a>
    </div>
    <?php
    return;
}
?>









<?php
if ($is_owner) {
    require_once "Class/Js.php";
?>
    <nav class="app-sidebar">
        <button class="app-sidebar-btn" onclick="home()" title="Accueil"><i class="fa-solid fa-house"></i></button>
        <button class="app-sidebar-btn" onclick="file_dowload()" title="Ajouter image"><i class="fa-solid fa-image"></i></button>
        <button class="app-sidebar-btn" onclick="modifier_projet()" title="Modifier"><i class="fa-solid fa-pen-to-square"></i></button>
        <?php
        $isVisible = !empty($mes_projets[0]['active_visibilite']);
        $publicUrl = $appBase . 'public.php?id=' . $url;
        ?>
        <button class="app-sidebar-btn app-sidebar-preview <?= $isVisible ? 'preview-online' : 'preview-offline' ?>"
                onclick="window.open('<?= $publicUrl ?>', '_blank')"
                title="<?= $isVisible ? 'En ligne — voir le profil public' : 'Hors ligne — pas encore visible' ?>">
            <i class="fa-solid <?= $isVisible ? 'fa-globe' : 'fa-eye-slash' ?>"></i>
        </button>
        <?php if ($isVisible): ?>
            <span class="app-sidebar-status online">En ligne</span>
        <?php else: ?>
            <span class="app-sidebar-status offline">Hors ligne</span>
        <?php endif; ?>
        <div style="flex:1;"></div>
        <button class="app-sidebar-btn app-sidebar-logout" onclick="session_destroy()" title="Deconnexion"><i class="fa-solid fa-right-from-bracket"></i></button>
    </nav>
<?php


}

// FORMULAIRE 0001



// FORMULAIRE 0001

?>

<script>
    function home() {
        window.location.href = "<?= $appBase ?>";
    }
</script>




<?php if ($is_owner) { ?>

<!-- BOUTON CREER SOUS-PROJET -->
<div class="add-child-banner">
    <button class="add-child-btn" onclick="createSubProject(<?= $url ?>)">
        <i class="fa-solid fa-folder-plus"></i> Creer un sous-projet
    </button>
</div>
<script>
function createSubProject(parentId) {
    var btn = document.querySelector('.add-child-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creation...';

    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    formData.append("parent_projet", parentId);
    xhr.open("POST", "<?= $appBase ?>req_on/insert_projet.php", true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    window.location.href = "<?= $appBase ?>" + data.id;
                    return;
                }
            } catch(e) {}
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-folder-plus"></i> Creer un sous-projet';
    };
    xhr.send(formData);
}
</script>

<!-- LISTE DES SOUS-PROJETS -->
<?php
require_once "index/on/all_projet_sql_child.php";
$dbChild = new DatabaseHandler($dbname, $username, $password);
$resultChild = $dbChild->select_custom_safe($sql, 'sous_projets');
$dbChild->closeConnection();
?>
<?php if (!empty($sous_projets)): ?>
<div class="children-list">
    <h3 class="children-title"><i class="fa-solid fa-folder-tree"></i> Sous-projets (<?= count($sous_projets) ?>)</h3>
    <?php foreach ($sous_projets as $sp): ?>
    <a href="<?= $appBase . $sp['id_projet'] ?>" class="child-card">
        <?php if (!empty($sp['main_img_src'])): ?>
            <img src="<?= $appBase ?>uploads/<?= htmlspecialchars($sp['main_img_src']) ?>" alt="" class="child-img">
        <?php else: ?>
            <div class="child-icon"><i class="fa-solid fa-folder"></i></div>
        <?php endif; ?>
        <div class="child-info">
            <span class="child-name"><?= htmlspecialchars($sp['name_projet'] ?: 'Projet #' . $sp['id_projet']) ?></span>
            <span class="child-date"><?= date("d/m/Y", strtotime($sp['date_inscription_projet'])) ?></span>
        </div>
        <i class="fa-solid fa-chevron-right child-arrow"></i>
    </a>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<div id="index_form" style="display:none;width:100%;margin:16px auto;">
    <?php
    require_once "projet/index_form.php";
    ?>
</div>

<div id="file_dowload_x">
    <?php require_once "projet/file_upload.php"; ?>
</div>
<?php } ?>

<?php

$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// Je veux ma propre requête
$sql = "SELECT * FROM `projet` WHERE `id_projet`='$url'";

// On exécute et on crée une variable globale $mes_projets
$result = $databaseHandler->select_custom_safe($sql, 'mes_projet_parent');





/*
?>






<div class="nd_projet">
    <div id="name_projet">
        <?= $mes_projet_parent[0]["name_projet"]  ?>
    </div>
    <div id="description_projet">
        <?= $mes_projet_parent[0]["description_projet"]  ?>
    </div>
</div>


<a href="<?= $appBase ?>">
    <img width="50" height="50" src="https://img.icons8.com/ios/50/home--v1.png" alt="home--v1" />
</a>
 


*/























?>
<script>
    function deleteImage(btn) {
        var ok = new Information("<?= $appBase ?>req_on/img_projet_src_img.php"); // création de la classe 
        ok.add("img_projet_src_img", btn.title); // ajout de l'information pour lenvoi 
        console.log(ok.info()); // demande l'information dans le tableau
        ok.push(); // envoie l'information au code pkp 
        const block = btn.closest('.image_block');
        block.remove();
    }
</script>







<?php



$databaseHandler = new DatabaseHandler($dbname, $username, $password);

// Je veux ma propre requête
$sql = "SELECT * FROM `projet` WHERE `parent_projet`='$url'";

// On exécute et on crée une variable globale $mes_projets
$result = $databaseHandler->select_custom_safe($sql, 'mes_projet_child');

















?>

















<script>
    // Tableau qui va contenir tous les ID
    let imagesIds = [];

    // Sélectionne tous les blocs image
    document.querySelectorAll('.image_block').forEach(block => {
        const id = block.dataset.id; // récupère data-id
        imagesIds.push(parseInt(id, 10)); // push dans le tableau
    });
</script>




















</div>





<?php



if ($is_owner) {
?>


    <script>
        function file_dowload() {


            if (document.getElementById("file_dowload_x").style.display == "block") {
                document.getElementById("file_dowload_x").style.display = "none";

            } else {
                document.getElementById("file_dowload_x").style.display = "block";

            }


        }

        function modifier_projet() {
            var index_on_group = document.getElementById("index_on_group").className;



            if (index_on_group == "") {

                document.getElementById("index_on_group").className = "display_none";

            } else {
                index_on_group = "";

                document.getElementById("index_on_group").className = "";
            }
        }

        function modifier_projet() {
            if (document.getElementById("index_form").style.display == "block") {
                document.getElementById("index_form").style.display = "none";

            } else {
                document.getElementById("index_form").style.display = "block";

            }
        }
    </script>


    <div class="u-mb-150"></div>
<?php
}

?>






<?php if ($is_owner) { ?>
<script>
    function add_child(_this) {
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        formData.append("parent_projet", _this.title);
        xhr.open("POST", "<?= $appBase ?>req_on/insert_projet.php", true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    window.location.href = "<?= $appBase ?>" + data.id;
                } else {
                    location.reload();
                }
            }
        };
        xhr.send(formData);
    }

    // FR: Force le collage en texte brut dans les editeurs contenteditable
    // EN: Forces plain text paste in contenteditable editors
    // Preserve les balises <script>, <canvas>, <iframe> etc. comme texte
    document.querySelectorAll('.editor[contenteditable="true"]').forEach(function(editor) {
        editor.addEventListener('paste', function(e) {
            e.preventDefault();
            var text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    });

    // on_send_form est defini dans index_form.php

    function session_destroy() {
        var xhr = new XMLHttpRequest();
            xhr.open("POST", "<?= $appBase ?>req_on/session_destroy.php", true);
            xhr.onload = function() {
                try { var d = JSON.parse(xhr.responseText); if (d.redirect) { window.location.href = d.redirect; return; } } catch(e) {}
                window.location.href = "<?= $appBase ?>";
            };
            xhr.send();
    }
</script>
<?php } ?>










<?php


require_once "projet/index_html.php";

?>
<a href="<?= $appBase ?>"><img width="100" height="100" src="https://img.icons8.com/carbon-copy/100/home.png" alt="home" /></a>