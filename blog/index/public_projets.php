<?php
/**
 * public_projets.php — Projets publics / Public projects
 * FR: Affiche les noms des projets visibles avec miniature
 * EN: Displays names of visible projects with thumbnail
 */
$databaseHandler = new DatabaseHandler($dbname, $username, $password);

$sql = "
SELECT p.id_projet, p.name_projet,
       ip.img_projet_src_img AS main_img_src
FROM projet p
LEFT JOIN projet_img ip ON p.img_projet = ip.id_projet_img_auto
WHERE p.active_visibilite = 1
  AND (p.parent_projet IS NULL OR p.parent_projet = 0)
ORDER BY p.date_inscription_projet DESC
";

$result = $databaseHandler->select_custom_safe($sql, 'public_projets');

if ($result['success'] && !empty($public_projets)) {
?>
<div class="public-projets">
    <?php foreach ($public_projets as $p) {
        $name = htmlspecialchars(strip_tags($p['name_projet']));
        if (empty($name)) $name = 'Projet #' . $p['id_projet'];
    ?>
        <a href="<?= $p['id_projet'] ?>" class="public-projet-link">
            <?php if (!empty($p['main_img_src'])) { ?>
                <img src="uploads/<?= htmlspecialchars($p['main_img_src']) ?>" alt="">
            <?php } ?>
            <span><?= $name ?></span>
        </a>
    <?php } ?>
</div>
<?php
}
$databaseHandler->closeConnection();
?>
