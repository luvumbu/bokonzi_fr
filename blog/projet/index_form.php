<?php
/**
 * index_form.php — Formulaire modifier projet (double design)
 * Depend de : $mes_projets, $url, $appBase
 * Design 1 (HTML decoché) : input/textarea simple
 * Design 2 (HTML coché) : editeur contenteditable riche
 */
$p = $mes_projets[0];

// Champs avec toggle HTML
$fields = [
    [
        'id' => 'name_projet',
        'checkbox_id' => 'use_html_project_name',
        'label' => 'Nom du projet',
        'description' => 'Indiquez le nom de votre projet.',
        'value' => $p['name_projet'] ?? '',
        'checked' => $p['use_html_project_name'] == 1,
        'placeholder' => 'Nom du projet...',
        'type' => 'input',
    ],
    [
        'id' => 'description_projet',
        'checkbox_id' => 'use_html_description_projet',
        'label' => 'Description',
        'description' => 'Decrivez brievement votre projet.',
        'value' => $p['description_projet'] ?? '',
        'checked' => $p['use_html_description_projet'] == 1,
        'placeholder' => 'Description du projet...',
        'type' => 'textarea',
    ],
    [
        'id' => 'google_title',
        'checkbox_id' => 'use_html_google_title',
        'label' => 'Google Title',
        'description' => 'Indiquez le titre SEO qui apparaitra dans Google.',
        'value' => $p['google_title'] ?? '',
        'checked' => $p['use_html_google_title'] == 1,
        'placeholder' => 'Titre SEO Google...',
        'type' => 'input',
    ],
    [
        'id' => 'metacontent',
        'checkbox_id' => 'use_html_metacontent',
        'label' => 'Meta content',
        'description' => 'Indiquez la meta description SEO.',
        'value' => $p['metacontent'] ?? '',
        'checked' => $p['use_html_metacontent'] == 1,
        'placeholder' => 'Meta description SEO...',
        'type' => 'textarea',
    ],
];
?>

<div class="new-project new-project-center">
<form class="project-form" method="POST" action="save.php">

<?php foreach ($fields as $f): ?>
    <div class="field">
        <p class="field-description"><?= $f['description'] ?></p>
        <div class="field-header">
            <label class="toggle-label">
                <input type="checkbox"
                    id="<?= $f['checkbox_id'] ?>"
                    class="toggle-design"
                    data-target="<?= $f['id'] ?>"
                    <?= $f['checked'] ? 'checked' : '' ?>>
                <span class="toggle-text">Autoriser HTML</span>
            </label>
            <span class="vd-trash" onclick="clearField('<?= $f['id'] ?>')" title="Vider le champ">&#128465;</span>
        </div>

        <!-- Design 1 : Input simple (HTML decoché) -->
        <div class="design-simple" id="design-simple-<?= $f['id'] ?>" style="<?= $f['checked'] ? 'display:none' : '' ?>">
            <?php if ($f['type'] === 'textarea'): ?>
                <textarea id="simple-<?= $f['id'] ?>" class="field-input" placeholder="<?= $f['placeholder'] ?>"><?= htmlspecialchars(strip_tags($f['value'])) ?></textarea>
            <?php else: ?>
                <input type="text" id="simple-<?= $f['id'] ?>" class="field-input" placeholder="<?= $f['placeholder'] ?>" value="<?= htmlspecialchars(strip_tags($f['value'])) ?>">
            <?php endif; ?>
        </div>

        <!-- Design 2 : Editeur riche (HTML coché) -->
        <div class="design-html" id="design-html-<?= $f['id'] ?>" style="<?= $f['checked'] ? '' : 'display:none' ?>">
            <div id="html-<?= $f['id'] ?>" class="editor" contenteditable="true" data-placeholder="<?= $f['placeholder'] ?>"><?= $f['value'] ?></div>
        </div>

        <!-- Champ cache qui sera envoye -->
        <div id="<?= $f['id'] ?>" class="display_none" contenteditable="true"><?= $f['value'] ?></div>
    </div>
<?php endforeach; ?>

<!-- PRIX -->
<div class="field">
    <p class="field-description">Indiquez le prix du projet.</p>
    <input type="number" id="price" name="price" min="0" step="1" value="<?= $p['price'] ?? 0 ?>" class="field-input" style="width:200px;">
</div>

<!-- VISIBILITE -->
<div class="field">
    <p class="field-description">Projet visible publiquement.</p>
    <label class="toggle-label">
        <input type="checkbox" id="active_visibilite" <?= $p['active_visibilite'] == 1 ? 'checked' : '' ?>>
        <span class="toggle-text">Visible en ligne</span>
    </label>
</div>

<!-- QR CODE -->
<div class="field">
    <p class="field-description">Activer la generation du QR code.</p>
    <label class="toggle-label">
        <input type="checkbox" id="active_qr_code" <?= (!empty($p['active_qr_code']) && $p['active_qr_code'] == 1) ? 'checked' : '' ?>>
        <span class="toggle-text">QR Code actif</span>
    </label>
</div>

<!-- VOIX VOCALE -->
<div class="field">
    <p class="field-description">Activez la voix vocale pour ce projet.</p>
    <label class="toggle-label">
        <input type="checkbox" id="active_voix_vocale" <?= (!empty($p['active_voix_vocale']) && $p['active_voix_vocale'] == 1) ? 'checked' : '' ?>>
        <span class="toggle-text">Voix vocale</span>
    </label>
</div>

<!-- MOT DE PASSE -->
<div class="field">
    <p class="field-description">Definissez un mot de passe pour proteger le projet.</p>
    <input type="text" id="password_projet" class="field-input" placeholder="Laisser vide = pas de mot de passe" value="<?= htmlspecialchars($p['password_projet'] ?? '') ?>">
</div>

<!-- ID PROJET (cache) -->
<div id="id_projet" class="display_none" contenteditable="true"><?= $url ?></div>

<!-- AJOUTER SOUS-PROJET -->
<img width="40" height="40" src="https://img.icons8.com/color/48/add--v1.png" onclick="add_child(this)" title="<?= $url ?>" class="add_child">

<!-- ENVOYER -->
<div class="submit-btn" onclick="on_send_form()">Enregistrer</div>

</form>
</div>

<script>
// Toggle entre design simple et design HTML
document.querySelectorAll('.toggle-design').forEach(function(cb) {
    cb.addEventListener('change', function() {
        var target = this.dataset.target;
        var simple = document.getElementById('design-simple-' + target);
        var html = document.getElementById('design-html-' + target);
        var hidden = document.getElementById(target);

        if (this.checked) {
            // Passer en mode HTML : copier la valeur simple vers l'editeur
            var simpleInput = simple.querySelector('input, textarea');
            var htmlEditor = html.querySelector('.editor');
            if (simpleInput && htmlEditor && !htmlEditor.innerHTML.trim()) {
                htmlEditor.textContent = simpleInput.value;
            }
            simple.style.display = 'none';
            html.style.display = '';
        } else {
            // Passer en mode simple : copier le texte de l'editeur vers l'input
            var htmlEditor = html.querySelector('.editor');
            var simpleInput = simple.querySelector('input, textarea');
            if (htmlEditor && simpleInput && !simpleInput.value.trim()) {
                simpleInput.value = htmlEditor.textContent;
            }
            html.style.display = 'none';
            simple.style.display = '';
        }
    });
});

// Vider un champ
function clearField(id) {
    var simple = document.querySelector('#design-simple-' + id + ' input, #design-simple-' + id + ' textarea');
    var html = document.querySelector('#design-html-' + id + ' .editor');
    var hidden = document.getElementById(id);
    if (simple) simple.value = '';
    if (html) html.innerHTML = '';
    if (hidden) hidden.innerHTML = '';
}

// Synchroniser les valeurs avant envoi
function syncFields() {
    document.querySelectorAll('.toggle-design').forEach(function(cb) {
        var target = cb.dataset.target;
        var hidden = document.getElementById(target);
        if (cb.checked) {
            var editor = document.querySelector('#design-html-' + target + ' .editor');
            if (editor && hidden) hidden.innerHTML = editor.innerHTML;
        } else {
            var input = document.querySelector('#design-simple-' + target + ' input, #design-simple-' + target + ' textarea');
            if (input && hidden) hidden.innerHTML = input.value;
        }
    });
}


</script>

<script>
// Envoi AJAX direct — sans GroupManager
function on_send_form() {
    syncFields();

    var fields = [
        'name_projet', 'description_projet', 'google_title', 'metacontent',
        'use_html_project_name', 'use_html_description_projet', 'use_html_google_title', 'use_html_metacontent',
        'id_projet', 'price', 'active_visibilite', 'active_qr_code', 'active_voix_vocale', 'password_projet'
    ];

    var fd = new FormData();

    for (var i = 0; i < fields.length; i++) {
        var id = fields[i];
        var el = document.getElementById(id);
        if (!el) continue;

        var value = '';
        if (el.contentEditable === 'true') {
            value = el.innerHTML;
        } else if (el.type === 'checkbox') {
            value = el.checked ? '1' : '0';
        } else {
            value = el.value;
        }
        fd.append(id, value);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '<?= $appBase ?>req_on/update_front.php', true);
    xhr.onload = function() {
        console.log('Reponse:', xhr.responseText);
        if (xhr.status === 200) {
            location.reload();
        }
    };
    xhr.send(fd);
}
</script>
