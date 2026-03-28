<?php
/**
 * web.php — Page vitrine BOKONZI / BOKONZI showcase page
 * FR: Page d'accueil publique avec services et contact
 * EN: Public landing page with services and contact
 */
session_start();
require_once "Class/Language.php";
require_once "Class/LanguageSwitcher.php";
require_once "Class/ThemeSwitcher.php";
Language::init('fr');
ThemeSwitcher::init();
?>
<!DOCTYPE html>
<html lang="<?= Language::getLang() ?>">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BOKONZI Web Agency</title>
<link rel="stylesheet" href="css.css">
</head>

<body class="page-web <?= ThemeSwitcher::getBodyClass() ?>">

<!-- Menu de navigation / Navigation menu -->
<nav>
    <div class="logo">BOKONZI</div>
    <ul>
        <li><a href="#accueil"><?= t('nav_home') ?></a></li>
        <li><a href="#services"><?= t('nav_services') ?></a></li>
        <li><a href="#projets"><?= t('nav_projects') ?></a></li>
        <li><a href="#equipe"><?= t('nav_team') ?></a></li>
        <li><a href="#contact"><?= t('nav_contact') ?></a></li>
        <li><?= LanguageSwitcher::render() ?></li>
    </ul>
</nav>

<!-- Banniere / Hero -->
<header id="accueil">
    <div class="hero-text">
        <h1>BOKONZI Web Agency</h1>
        <p><?= t('hero_subtitle') ?></p>
    </div>
</header>

<!-- Services -->
<section id="services">
<div class="card">
    <span class="tag">Web Engineering</span>
    <h2><?= t('card_web_title') ?></h2>
    <ul>
        <li><?= t('card_web_1') ?></li>
        <li><?= t('card_web_2') ?></li>
        <li><?= t('card_web_3') ?></li>
        <li><?= t('card_web_4') ?></li>
    </ul>
</div>

<div class="card">
    <span class="tag">Sport Data</span>
    <h2><?= t('card_sport_title') ?></h2>
    <ul>
        <li><?= t('card_sport_1') ?></li>
        <li><?= t('card_sport_2') ?></li>
        <li><?= t('card_sport_3') ?></li>
    </ul>
</div>

<div class="card">
    <span class="tag">Game Development</span>
    <h2><?= t('card_game_title') ?></h2>
    <ul>
        <li><?= t('card_game_1') ?></li>
        <li><?= t('card_game_2') ?></li>
        <li><?= t('card_game_3') ?></li>
    </ul>
</div>

<div class="card">
    <span class="tag">3D Modeling</span>
    <h2><?= t('card_3d_title') ?></h2>
    <ul>
        <li><?= t('card_3d_1') ?></li>
        <li><?= t('card_3d_2') ?></li>
        <li><?= t('card_3d_3') ?></li>
    </ul>
</div>
</section>

<!-- Footer -->
<footer id="contact">
<?= t('footer_copy') ?>
</footer>

</body>
</html>
