<?php
/**
 * social_media.php — Gestion des reseaux sociaux / Social media management
 * FR: Formulaire pour ajouter des reseaux sociaux + liste des existants
 * EN: Form to add social media links + existing list
 */
$user = $_SESSION["info_index"][1][0];
$id_user = $user["id_user"];

// Creer la table si elle n'existe pas
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
$tables = $databaseHandler->getAllTables();
if (!in_array('social_media', $tables, true)) {
    $databaseHandler->create_table('social_media', [
        "id_social" => "INT UNSIGNED AUTO_INCREMENT PRIMARY KEY",
        "id_user_social" => "INT UNSIGNED NOT NULL",
        "nom_social" => "VARCHAR(100) NOT NULL",
        "img_social" => "LONGTEXT",
        "url_social" => "TEXT NOT NULL",
        "date_inscription_social" => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ]);
}

// Charger les reseaux existants
$sql = "SELECT * FROM `social_media` WHERE `id_user_social`='$id_user' ORDER BY `date_inscription_social` DESC";
$result = $databaseHandler->select_custom_safe($sql, 'mes_sociaux');
if (!$result['success']) {
    $mes_sociaux = [];
}
?>

<div class="social-container">
    <h2 class="social-title"><?= t('social_title') ?></h2>

    <!-- Liste des reseaux existants -->
    <div id="social_list">
        <?php foreach ($mes_sociaux as $s) { ?>
            <div class="social-card" id="social_<?= $s['id_social'] ?>">
                <div class="social-brand-icon" id="brand_<?= $s['id_social'] ?>"></div>
                <?php if (!empty($s['img_social'])) { ?>
                    <img src="<?= htmlspecialchars($s['img_social']) ?>" alt="<?= htmlspecialchars($s['nom_social']) ?>" class="social-icon">
                <?php } ?>
                <!-- Mode affichage -->
                <div class="social-info social-view" id="social_view_<?= $s['id_social'] ?>">
                    <strong><?= htmlspecialchars($s['nom_social']) ?></strong>
                    <a href="<?= htmlspecialchars($s['url_social']) ?>" target="_blank"><?= htmlspecialchars($s['url_social']) ?></a>
                </div>
                <!-- Mode edition (cache par defaut) -->
                <div class="social-edit-form" id="social_edit_<?= $s['id_social'] ?>" style="display:none;">
                    <input type="text" class="social-edit-input" id="edit_nom_<?= $s['id_social'] ?>" value="<?= htmlspecialchars($s['nom_social']) ?>" placeholder="Nom">
                    <input type="text" class="social-edit-input" id="edit_img_<?= $s['id_social'] ?>" value="<?= htmlspecialchars($s['img_social']) ?>" placeholder="URL image">
                    <div style="display:flex;gap:6px;align-items:center;">
                        <label class="social-upload-label" for="edit_file_<?= $s['id_social'] ?>"><i class="fa-solid fa-upload"></i> Image</label>
                        <input type="file" id="edit_file_<?= $s['id_social'] ?>" accept="image/*" style="display:none;" onchange="upload_edit_social_img(this, <?= $s['id_social'] ?>)">
                        <img id="edit_preview_<?= $s['id_social'] ?>" src="<?= !empty($s['img_social']) ? htmlspecialchars($s['img_social']) : '' ?>" class="social-edit-preview" style="<?= empty($s['img_social']) ? 'display:none;' : '' ?>">
                    </div>
                    <input type="text" class="social-edit-input" id="edit_url_<?= $s['id_social'] ?>" value="<?= htmlspecialchars($s['url_social']) ?>" placeholder="URL">
                    <div style="display:flex;gap:6px;">
                        <button class="social-save-btn" onclick="save_social(<?= $s['id_social'] ?>)"><i class="fa-solid fa-check"></i> Enregistrer</button>
                        <button class="social-cancel-btn" onclick="cancel_edit_social(<?= $s['id_social'] ?>)"><i class="fa-solid fa-xmark"></i> Annuler</button>
                    </div>
                </div>
                <button class="social-edit" onclick="edit_social(<?= $s['id_social'] ?>)" id="btn_edit_<?= $s['id_social'] ?>" title="Modifier">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="social-delete" onclick="delete_social(<?= $s['id_social'] ?>)" title="<?= t('upload_delete') ?>">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <script>setSocialBrandIcon("brand_<?= $s['id_social'] ?>", "<?= addslashes($s['nom_social']) ?>", "<?= addslashes($s['url_social']) ?>");</script>
        <?php } ?>
    </div>

    <!-- Formulaire ajout -->
    <div class="social-form" id="social_form">
        <label for="social_nom"><?= t('social_name') ?></label>
        <input type="text" id="social_nom" placeholder="<?= t('social_name_placeholder') ?>">

        <label for="social_img"><?= t('social_image') ?></label>
        <input type="text" id="social_img" placeholder="<?= t('social_image_placeholder') ?>">
        <label class="social-upload-label" for="social_file"><?= t('social_upload') ?></label>
        <input type="file" id="social_file" accept="image/*" onchange="upload_social_img(this)">
        <img id="social_preview" class="social-preview" src="" alt="">

        <label for="social_url"><?= t('social_url') ?></label>
        <input type="text" id="social_url" placeholder="<?= t('social_url_placeholder') ?>">

        <div class="submit-btn" onclick="add_social()"><?= t('social_add') ?></div>
    </div>

</div>

<script>
var socialPlatforms = {
    youtube:    { icon: 'fa-youtube',    color: '#FF0000' },
    instagram:  { icon: 'fa-instagram',  color: '#E4405F' },
    twitter:    { icon: 'fa-twitter',    color: '#1DA1F2' },
    x:          { icon: 'fa-x-twitter',  color: '#000000' },
    facebook:   { icon: 'fa-facebook-f', color: '#1877F2' },
    tiktok:     { icon: 'fa-tiktok',     color: '#000000' },
    linkedin:   { icon: 'fa-linkedin-in',color: '#0A66C2' },
    github:     { icon: 'fa-github',     color: '#333333' },
    discord:    { icon: 'fa-discord',    color: '#5865F2' },
    twitch:     { icon: 'fa-twitch',     color: '#9146FF' },
    snapchat:   { icon: 'fa-snapchat',   color: '#FFFC00' },
    pinterest:  { icon: 'fa-pinterest-p',color: '#E60023' },
    reddit:     { icon: 'fa-reddit-alien',color: '#FF4500' },
    spotify:    { icon: 'fa-spotify',    color: '#1DB954' },
    whatsapp:   { icon: 'fa-whatsapp',   color: '#25D366' },
    telegram:   { icon: 'fa-telegram',   color: '#26A5E4' },
    dribbble:   { icon: 'fa-dribbble',   color: '#EA4C89' },
    behance:    { icon: 'fa-behance',    color: '#1769FF' },
    vimeo:      { icon: 'fa-vimeo-v',    color: '#1AB7EA' },
    soundcloud: { icon: 'fa-soundcloud', color: '#FF5500' }
};

function detectPlatform(name, url) {
    var text = (name + ' ' + url).toLowerCase();
    for (var key in socialPlatforms) {
        if (text.indexOf(key) !== -1) return key;
    }
    return null;
}

function setSocialBrandIcon(elId, name, url) {
    var el = document.getElementById(elId);
    if (!el) return;
    var platform = detectPlatform(name, url);
    if (platform) {
        var p = socialPlatforms[platform];
        el.innerHTML = '<i class="fa-brands ' + p.icon + '"></i>';
        el.style.background = p.color;
        if (platform === 'snapchat') el.style.color = '#000';
    } else {
        el.innerHTML = '<i class="fa-solid fa-globe"></i>';
        el.style.background = 'var(--color-primary)';
    }
}

function buildSocialCard(id, nom, img, socialUrl) {
    var brandId = 'brand_' + id;
    var html = '<div class="social-brand-icon" id="' + brandId + '"></div>';
    if (img) html += '<img src="' + img + '" class="social-icon" alt="' + nom + '">';
    html += '<div class="social-info"><strong>' + nom + '</strong>' +
            '<a href="' + socialUrl + '" target="_blank">' + socialUrl + '</a></div>' +
            '<button class="social-delete" onclick="delete_social(' + id + ')">' +
            '<i class="fa-solid fa-trash"></i></button>';
    return html;
}

function upload_social_img(input) {
    if (!input.files[0]) return;
    var file = input.files[0];
    var fd = new FormData();
    fd.append("file", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "req_on/upload_social_img.php", true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                document.getElementById("social_img").value = data.path;
                document.getElementById("social_preview").src = data.path;
                document.getElementById("social_preview").style.display = "block";
            }
        }
    };
    xhr.send(fd);
}

function add_social() {
    var nom = document.getElementById("social_nom").value.trim();
    var img = document.getElementById("social_img").value.trim();
    var socialUrl = document.getElementById("social_url").value.trim();

    if (!nom || !socialUrl) {
        alert("Remplissez le nom et l'URL");
        return;
    }

    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    formData.append("nom_social", nom);
    formData.append("img_social", img);
    formData.append("url_social", socialUrl);

    xhr.open("POST", "req_on/insert_social.php", true);
    xhr.onerror = function() {
        alert("Erreur réseau");
    };
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                var data = JSON.parse(xhr.responseText);
            } catch(e) {
                alert("Réponse invalide: " + xhr.responseText);
                return;
            }
            if (data.success) {
                var card = document.createElement("div");
                card.className = "social-card";
                card.id = "social_" + data.id;
                card.innerHTML = buildSocialCard(data.id, nom, img, socialUrl);
                document.getElementById("social_list").prepend(card);
                setSocialBrandIcon("brand_" + data.id, nom, socialUrl);

                document.getElementById("social_nom").value = "";
                document.getElementById("social_img").value = "";
                document.getElementById("social_url").value = "";
                document.getElementById("social_file").value = "";
                document.getElementById("social_preview").style.display = "none";
            } else {
                alert("Erreur serveur: " + xhr.responseText);
            }
        } else {
            alert("Erreur HTTP " + xhr.status);
        }
    };
    xhr.send(formData);
}

function upload_edit_social_img(input, id) {
    if (!input.files[0]) return;
    var fd = new FormData();
    fd.append("file", input.files[0]);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "req_on/upload_social_img.php", true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
                document.getElementById("edit_img_" + id).value = data.path;
                var preview = document.getElementById("edit_preview_" + id);
                preview.src = data.path;
                preview.style.display = "block";
            }
        }
    };
    xhr.send(fd);
}

function edit_social(id) {
    document.getElementById('social_view_' + id).style.display = 'none';
    document.getElementById('social_edit_' + id).style.display = 'flex';
    document.getElementById('btn_edit_' + id).style.display = 'none';
}

function cancel_edit_social(id) {
    document.getElementById('social_view_' + id).style.display = '';
    document.getElementById('social_edit_' + id).style.display = 'none';
    document.getElementById('btn_edit_' + id).style.display = '';
}

function save_social(id) {
    var nom = document.getElementById('edit_nom_' + id).value.trim();
    var img = document.getElementById('edit_img_' + id).value.trim();
    var url = document.getElementById('edit_url_' + id).value.trim();

    if (!nom || !url) { alert('Nom et URL obligatoires'); return; }

    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append('id_social', id);
    fd.append('nom_social', nom);
    fd.append('img_social', img);
    fd.append('url_social', url);

    xhr.open('POST', 'req_on/update_social.php', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            location.reload();
        }
    };
    xhr.send(fd);
}

function delete_social(id) {
    var xhr = new XMLHttpRequest();
    var formData = new FormData();
    formData.append("id_social", id);

    xhr.open("POST", "req_on/delete_social.php", true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var el = document.getElementById("social_" + id);
            if (el) el.remove();
        }
    };
    xhr.send(formData);
}
</script>
