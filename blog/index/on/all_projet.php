<?php
/**
 * all_projet.php — Liste des projets style dashboard
 */
$databaseHandler = new DatabaseHandler($dbname, $username, $password);
$result = $databaseHandler->select_custom_safe($sql, 'mes_projets');
if (!$result['success']) {
    echo '<p class="empty-msg">' . t('error_generic') . '</p>';
    return;
}
?>

<?php if (empty($mes_projets)): ?>
    <p class="empty-msg">Aucun projet. Creez-en un ci-dessus.</p>
<?php else: ?>
    <?php foreach ($mes_projets as $p):
        $id = $p['id_projet'];
        $name = $p['name_projet'] ?: 'Projet #' . $id;
        $desc = $p['description_projet'] ?? '';
        $date = date("d/m/Y H:i", strtotime($p['date_inscription_projet']));
        $img = !empty($p['main_img_src']) ? 'uploads/' . $p['main_img_src'] : '';
    ?>
    <div class="projet-block" id="projet-<?= $id ?>">
        <div class="projet-block-header" onclick="this.parentElement.classList.toggle('open')">
            <?php if ($img): ?>
                <img src="<?= htmlspecialchars($img) ?>" alt="" class="projet-link-img">
            <?php else: ?>
                <span class="projet-icon">&#128194;</span>
            <?php endif; ?>
            <span class="projet-nom"><?= htmlspecialchars($name) ?></span>
            <span style="color:#64748b;font-size:12px;margin-left:auto;"><?= $date ?></span>
            <button class="btn-action btn-save" onclick="event.stopPropagation(); consulter('<?= $id ?>');" style="padding:6px 14px;font-size:13px;">
                <i class="fa-solid fa-eye"></i> Ouvrir
            </button>
            <button class="btn-action" onclick="event.stopPropagation(); remove_projet('<?= $id ?>');" style="padding:6px 14px;font-size:13px;background:#ef4444;">
                <i class="fa-solid fa-trash"></i>
            </button>
            <span class="projet-block-arrow">&#9654;</span>
        </div>
        <div class="projet-block-body">
            <?php if ($desc): ?>
                <p style="color:#94a3b8;font-size:14px;padding:8px 0;"><?= htmlspecialchars($desc) ?></p>
            <?php endif; ?>
        </div>
    </div>
    <?php endforeach; ?>
<?php endif; ?>

<script>
    function remove_projet(id) {
        if (!confirm('Supprimer ce projet ?')) return;
        var el = document.getElementById('projet-' + id);
        if (el) el.style.display = 'none';
        var ok = new Information("info_exe/remove_projet.php");
        ok.add("remove_projet", id);
        ok.push();
    }

    function consulter(id) {
        window.location.href = id;
    }
</script>
