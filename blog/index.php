<?php
/**
 * index.php — Point d'entree principal / Main entry point
 * FR: Routeur principal de l'application BOKONZI CMS
 * EN: Main router for the BOKONZI CMS application
 */
session_start();
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOKONZI Blog</title>
<?php
$appBase = str_replace('\\', '/', str_replace(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '', str_replace('\\', '/', __DIR__))) . '/';
$siteBase = str_replace('\\', '/', str_replace(str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']), '', str_replace('\\', '/', dirname(__DIR__)))) . '/';
?>
    <link rel="icon" type="image/svg+xml" href="<?= $appBase ?>logo.svg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="<?= $siteBase ?>css/dashboard.css">
    <link rel="stylesheet" href="<?= $siteBase ?>css/kirby.css">
    <link rel="stylesheet" href="<?= $appBase ?>css.css">
    <script src="<?= $siteBase ?>js/kirby.js"></script>
</head>
<?php
require_once "index/require_once.php";
?>
<body>
<?php
$default = "index/default.php";
$projet_bdd = "projet/index.php";
$url = $_GET['url'] ?? '';
$isProjetPage = ($url !== '');
?>

    <?php if (!$isProjetPage): ?>
    <!-- UNIVERS KIRBY ARRIERE-PLAN (accueil uniquement) -->
    <div class="kirby-world kirby-bg">
        <button class="kirby-toggle-mode" onclick="toggleDayNight(this)"><span>&#9788;</span><span class="mode-label">Jour</span></button>
        <div class="kirby-planet"></div>
        <div class="kirby-planet-ring"></div>
        <div class="kirby-stars" id="kirbyStars"></div>
        <div class="kirby-clouds" id="kirbyClouds"></div>
        <div class="kirby-hills">
            <div class="hill hill-1"></div>
            <div class="hill hill-2"></div>
            <div class="hill hill-3"></div>
            <div class="hill hill-4"></div>
        </div>
        <div class="kirby-sky" id="kirbySky"></div>
        <div class="kirby-ground">
            <div class="ground-grass" id="groundGrass"></div>
            <div class="ground-dirt"></div>
        </div>
    </div>
    <?php endif; ?>

    <div class="dashboard-container">
<?php
switch ($url) {
    case '':
        if (isset($_SESSION["info_index"][1])) {
            if (!$filename_bool) {
                require_once $default;
            }
        } else {
            require_once $default;
        }
        break;
    default:
        require_once $projet_bdd;
        break;
}
?>
    </div>

    <?php if (!$isProjetPage): ?>
    <script>
    (function() {
        var starsEl = document.getElementById('kirbyStars');
        if (starsEl) {
            for (var s = 0; s < 50; s++) {
                var star = document.createElement('div');
                var r = Math.random();
                star.className = 'kirby-star' + (r > 0.92 ? ' big blink' : r > 0.75 ? ' blink' : r > 0.6 ? ' blink-slow' : '');
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 55 + '%';
                star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
                starsEl.appendChild(star);
            }
        }
        var cloudsEl = document.getElementById('kirbyClouds');
        if (cloudsEl) {
            var cloudData = [];
            for (var c = 0; c < 5; c++) {
                var cloud = document.createElement('div');
                cloud.className = 'kirby-cloud';
                var cw = 120 + Math.random() * 180;
                cloud.style.width = cw + 'px';
                cloud.style.height = (25 + Math.random() * 20) + 'px';
                cloud.style.top = (10 + Math.random() * 40) + '%';
                var cx = Math.random() * (window.innerWidth + cw) - cw;
                cloud.style.opacity = 0.4 + Math.random() * 0.4;
                cloudsEl.appendChild(cloud);
                cloudData.push({ el: cloud, x: cx, speed: 0.15 + Math.random() * 0.25, w: cw });
            }
            function animClouds() {
                var ww = window.innerWidth;
                cloudData.forEach(function(c) {
                    c.x += c.speed;
                    if (c.x > ww + 20) c.x = -c.w - 20;
                    c.el.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
                });
                requestAnimationFrame(animClouds);
            }
            animClouds();
        }
        var grassEl = document.getElementById('groundGrass');
        if (grassEl) {
            var gc = Math.floor(window.innerWidth / 10);
            for (var g = 0; g < gc; g++) {
                var blade = document.createElement('div');
                blade.className = 'grass-blade';
                blade.style.left = (g / gc * 100) + '%';
                blade.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
                grassEl.appendChild(blade);
            }
        }
    })();
    </script>
    <?php endif; ?>
</body>
</html>
