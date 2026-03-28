<?php
// ======================================
// Securite + Connexion DB
// ======================================
$url = isset($url) ? (int)$url : 0;
$databaseHandler = new DatabaseHandler($dbname, $username, $password);

$sql = "
SELECT
    p.id_projet, p.id_user_projet, p.name_projet, p.description_projet,
    p.use_html_project_name, p.use_html_description_projet,
    p.google_title, p.use_html_google_title,
    p.metacontent, p.use_html_metacontent,
    p.parent_projet, p.active_visibilite, p.price, p.date_inscription_projet,
    p.img_projet AS img_principale_id,
    ip.id_projet_img_auto AS main_img_id,
    ip.img_projet_src_img AS main_img_src,
    ip.extension_img AS main_img_ext,
    u.prenom_user AS auteur_prenom,
    u.nom_user AS auteur_nom
FROM projet p
LEFT JOIN projet_img ip ON p.img_projet = ip.id_projet_img_auto
LEFT JOIN profil_user u ON p.id_user_projet = u.id_user
WHERE p.id_projet = {$url} OR p.parent_projet = {$url}
";
$result = $databaseHandler->select_custom_safe($sql, 'xx');
if (!$result['success']) { die("Erreur SQL : " . $result['message']); }

// Reconstruction
$projets = [];
foreach ($xx as $row) {
    $id = $row['id_projet'];
    if (!isset($projets[$id])) {
        $projets[$id] = $row;
        $projets[$id]['image_principale'] = $row['main_img_id'] ? [
            'main_img_src' => $row['main_img_src'],
            'main_img_ext' => $row['main_img_ext'],
        ] : null;
    }
}
$xx = array_values($projets);

// Filtrer : parent + enfants visibles
$xx = array_values(array_filter($xx, function($p) use ($url, $is_owner) {
    if ($p['id_projet'] == $url) return true;
    return $is_owner || $p['active_visibilite'] == 1;
}));

$_render_brut = $is_owner ? 'replace_element_1' : 'replace_element_safe';

// Projet principal = premier element
$main = $xx[0] ?? null;
if (!$main) return;

// Sous-projets (enfants)
$children = array_filter($xx, function($p) use ($url) { return $p['id_projet'] != $url; });
?>

<link rel="stylesheet" href="<?= $appBase ?>css/article-public.css">

<article class="blog-post">

    <!-- ====== LIEN PARENT ====== -->
    <?php if (!empty($main['parent_projet'])): ?>
    <div class="blog-breadcrumb">
        <a href="<?= $appBase . $main['parent_projet'] ?>" class="blog-parent-link">
            <i class="fa-solid fa-arrow-left"></i> Retour au projet parent
        </a>
    </div>
    <?php endif; ?>

    <!-- ====== HEADER BLOG ====== -->
    <header class="blog-header">
        <?php if (!empty($main['google_title'])): ?>
            <div class="blog-category">
                <?php if ($main['use_html_google_title'] == 1): ?>
                    <?= html_premier_caractere('<div>' . html_vers_texte_brut($main['google_title']) . '</div>', 'span', 'colors_title') ?>
                <?php else: ?>
                    <?= $_render_brut($main['google_title']) ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($main['name_projet'])): ?>
            <h1 class="blog-title">
                <?php if ($main['use_html_project_name'] == 1): ?>
                    <?= html_premier_caractere('<div>' . html_vers_texte_brut($main['name_projet']) . '</div>', 'span', 'colors_title') ?>
                <?php else: ?>
                    <?= $_render_brut($main['name_projet']) ?>
                <?php endif; ?>
            </h1>
        <?php endif; ?>

        <?php if (!empty($main['metacontent'])): ?>
            <p class="blog-subtitle">
                <?php if ($main['use_html_metacontent'] == 1): ?>
                    <?= html_premier_caractere('<div>' . html_vers_texte_brut($main['metacontent']) . '</div>', 'span', 'colors_description') ?>
                <?php else: ?>
                    <?= $_render_brut($main['metacontent']) ?>
                <?php endif; ?>
            </p>
        <?php endif; ?>

        <div class="blog-meta">
            <?php if (!empty($main['auteur_prenom'])): ?>
                <span class="blog-author"><i class="fa-solid fa-user"></i> <?= htmlspecialchars($main['auteur_prenom'] . ' ' . ($main['auteur_nom'] ?? '')) ?></span>
            <?php endif; ?>
            <span class="blog-date"><i class="fa-regular fa-calendar"></i> <?= date("d/m/Y", strtotime($main['date_inscription_projet'])) ?></span>
            <?php if ($main['price'] > 0): ?>
                <span class="blog-price"><i class="fa-solid fa-tag"></i> <?= $main['price'] ?> &euro;</span>
            <?php endif; ?>
        </div>
    </header>

    <!-- ====== IMAGE HERO / CARROUSEL ====== -->
    <?php
    $dbCarousel = new DatabaseHandler($dbname, $username, $password);
    $sqlChecked = "SELECT * FROM projet_img WHERE id_projet_img = " . (int)$main['id_projet'] . " AND is_checked = 1 ORDER BY id_projet_img_auto";
    $resChecked = $dbCarousel->select_custom_safe($sqlChecked, 'checked_imgs');
    $dbCarousel->closeConnection();
    ?>

    <?php if (!empty($checked_imgs) && count($checked_imgs) > 1): ?>
        <?php $carouselId = 'carousel-' . $main['id_projet']; ?>
        <div class="blog-hero">
            <div class="carousel" id="<?= $carouselId ?>">
                <div class="carousel-track">
                    <?php foreach ($checked_imgs as $ci): ?>
                    <div class="carousel-slide">
                        <?= renderFileMedia($appBase . 'uploads/' . $ci['img_projet_src_img']) ?>
                    </div>
                    <?php endforeach; ?>
                </div>
                <button class="carousel-btn carousel-prev" onclick="carouselMove('<?= $carouselId ?>', -1)">&#10094;</button>
                <button class="carousel-btn carousel-next" onclick="carouselMove('<?= $carouselId ?>', 1)">&#10095;</button>
                <div class="carousel-dots">
                    <?php for ($d = 0; $d < count($checked_imgs); $d++): ?>
                    <span class="carousel-dot<?= $d === 0 ? ' active' : '' ?>" onclick="carouselGo('<?= $carouselId ?>', <?= $d ?>)"></span>
                    <?php endfor; ?>
                </div>
            </div>
        </div>
    <?php elseif (!empty($main['image_principale']['main_img_src'])): ?>
        <div class="blog-hero">
            <div class="blog-hero-img">
                <?= renderFileMedia($appBase . 'uploads/' . $main['image_principale']['main_img_src']) ?>
            </div>
        </div>
    <?php endif; ?>

    <!-- ====== CONTENU ARTICLE ====== -->
    <?php if (!empty($main['description_projet'])): ?>
    <div class="blog-content">
        <?php if ($main['use_html_description_projet'] == 1): ?>
            <?= html_premier_caractere('<div>' . html_vers_texte_brut($main['description_projet']) . '</div>', 'span', 'colors_description') ?>
        <?php else: ?>
            <?= $_render_brut($main['description_projet']) ?>
        <?php endif; ?>
    </div>
    <?php endif; ?>

    <!-- ====== SOUS-PROJETS (articles lies) ====== -->
    <?php if (!empty($children)):
        // Recuperer la premiere image de chaque enfant (img_projet ou premiere image uploadee)
        $childImgs = [];
        $dbImgs = new DatabaseHandler($dbname, $username, $password);
        foreach ($children as $ch) {
            $cid = (int)$ch['id_projet'];
            $imgSrc = null;
            // D'abord l'image principale
            if (!empty($ch['image_principale']['main_img_src'])) {
                $imgSrc = $ch['image_principale']['main_img_src'];
            } else {
                // Sinon la premiere image uploadee pour ce projet
                $sqlImg = "SELECT img_projet_src_img FROM projet_img WHERE id_projet_img = $cid ORDER BY id_projet_img_auto ASC LIMIT 1";
                $resImg = $dbImgs->select_custom_safe($sqlImg, 'first_img');
                if ($resImg['success'] && !empty($first_img)) {
                    $imgSrc = $first_img[0]['img_projet_src_img'];
                }
            }
            $childImgs[$cid] = $imgSrc;
        }
        $dbImgs->closeConnection();
    ?>
    <div class="blog-related">
        <h2 class="blog-related-title"><i class="fa-solid fa-newspaper"></i> Articles lies</h2>
        <div class="blog-cards">
            <?php foreach ($children as $child):
                $cImg = $childImgs[(int)$child['id_projet']] ?? null;
            ?>
            <a href="<?= $appBase . $child['id_projet'] ?>" class="blog-card">
                <?php if ($cImg): ?>
                    <div class="blog-card-img">
                        <img src="<?= $appBase ?>uploads/<?= htmlspecialchars($cImg) ?>" alt="">
                    </div>
                <?php else: ?>
                    <div class="blog-card-img blog-card-placeholder">
                        <i class="fa-solid fa-file-lines"></i>
                    </div>
                <?php endif; ?>
                <div class="blog-card-body">
                    <h3><?= htmlspecialchars($child['name_projet'] ?: 'Article #' . $child['id_projet']) ?></h3>
                    <?php if (!empty($child['description_projet'])): ?>
                        <p><?= htmlspecialchars(mb_substr(strip_tags($child['description_projet']), 0, 100)) ?><?= mb_strlen(strip_tags($child['description_projet'])) > 100 ? '...' : '' ?></p>
                    <?php endif; ?>
                    <span class="blog-card-date"><?= date("d/m/Y", strtotime($child['date_inscription_projet'])) ?></span>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <!-- ====== SOCIAL MEDIA AUTEUR (tout en bas) ====== -->
    <?php
    $dbSocial = new DatabaseHandler($dbname, $username, $password);
    $sqlSocial = "SELECT * FROM social_media WHERE id_user_social = " . (int)$main['id_user_projet'] . " ORDER BY date_inscription_social";
    $resSocial = $dbSocial->select_custom_safe($sqlSocial, 'author_socials');
    $dbSocial->closeConnection();
    ?>
    <?php if (!empty($author_socials)): ?>
    <div class="blog-social">
        <h3 class="blog-social-title"><i class="fa-solid fa-share-nodes"></i> Retrouvez l'auteur</h3>
        <div class="blog-social-links">
            <?php foreach ($author_socials as $soc): ?>
            <a href="<?= htmlspecialchars($soc['url_social']) ?>" target="_blank" class="blog-social-item" title="<?= htmlspecialchars($soc['nom_social']) ?>">
                <?php if (!empty($soc['img_social'])): ?>
                    <img src="<?= $appBase . htmlspecialchars($soc['img_social']) ?>" alt="<?= htmlspecialchars($soc['nom_social']) ?>">
                <?php else: ?>
                    <span class="blog-social-icon" data-name="<?= htmlspecialchars($soc['nom_social']) ?>" data-url="<?= htmlspecialchars($soc['url_social']) ?>"><i class="fa-solid fa-globe"></i></span>
                <?php endif; ?>
                <span class="blog-social-name"><?= htmlspecialchars($soc['nom_social']) ?></span>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    <script>
    (function(){
        var platforms = {
            youtube:{icon:'fa-youtube',color:'#FF0000'},instagram:{icon:'fa-instagram',color:'#E4405F'},
            twitter:{icon:'fa-twitter',color:'#1DA1F2'},x:{icon:'fa-x-twitter',color:'#000'},
            facebook:{icon:'fa-facebook-f',color:'#1877F2'},tiktok:{icon:'fa-tiktok',color:'#000'},
            linkedin:{icon:'fa-linkedin-in',color:'#0A66C2'},github:{icon:'fa-github',color:'#333'},
            discord:{icon:'fa-discord',color:'#5865F2'},twitch:{icon:'fa-twitch',color:'#9146FF'},
            spotify:{icon:'fa-spotify',color:'#1DB954'},whatsapp:{icon:'fa-whatsapp',color:'#25D366'},
            telegram:{icon:'fa-telegram',color:'#26A5E4'},pinterest:{icon:'fa-pinterest-p',color:'#E60023'},
            reddit:{icon:'fa-reddit-alien',color:'#FF4500'},snapchat:{icon:'fa-snapchat',color:'#FFFC00'}
        };
        document.querySelectorAll('.blog-social-icon').forEach(function(el){
            var text = ((el.dataset.name||'') + ' ' + (el.dataset.url||'')).toLowerCase();
            for (var k in platforms) {
                if (text.indexOf(k) !== -1) {
                    el.innerHTML = '<i class="fa-brands ' + platforms[k].icon + '"></i>';
                    el.style.background = platforms[k].color;
                    if (k === 'snapchat') el.style.color = '#000';
                    return;
                }
            }
        });
    })();
    </script>
    <?php endif; ?>

</article>


<script>
var carouselState = {};
function carouselMove(id, dir) {
    var c = document.getElementById(id); if (!c) return;
    var t = c.querySelector('.carousel-track'), s = c.querySelectorAll('.carousel-slide');
    if (!carouselState[id]) carouselState[id] = 0;
    carouselState[id] += dir;
    if (carouselState[id] < 0) carouselState[id] = s.length - 1;
    if (carouselState[id] >= s.length) carouselState[id] = 0;
    t.style.transform = 'translateX(-' + (carouselState[id] * 100) + '%)';
    updateDots(id);
}
function carouselGo(id, i) {
    var c = document.getElementById(id); if (!c) return;
    carouselState[id] = i;
    c.querySelector('.carousel-track').style.transform = 'translateX(-' + (i * 100) + '%)';
    updateDots(id);
}
function updateDots(id) {
    var c = document.getElementById(id); if (!c) return;
    c.querySelectorAll('.carousel-dot').forEach(function(d, i) { d.classList.toggle('active', i === carouselState[id]); });
}
document.querySelectorAll('.carousel').forEach(function(c) { setInterval(function() { carouselMove(c.id, 1); }, 4000); });
</script>
