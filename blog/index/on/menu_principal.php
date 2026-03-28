<?php
/**
 * menu_principal.php — Menu principal style dashboard avec logo
 */
$appUser = $_SESSION["info_index"][1][0];
$mainUser = $_SESSION['user'] ?? null;
// $appBase est defini dans index.php parent
$logoPath = (isset($appBase) ? $appBase : '') . 'logo.svg';
?>
<!-- Header profil -->
<div class="dashboard-header">
    <img src="<?= $logoPath ?>" alt="BOKONZI Blog" class="blog-logo">
    <?php if ($mainUser && !empty($mainUser['picture'])): ?>
        <img src="<?= htmlspecialchars($mainUser['picture']) ?>" alt="" class="avatar" referrerpolicy="no-referrer">
    <?php endif; ?>
    <div>
        <h1><?= htmlspecialchars($appUser['prenom_user'] . ' ' . ($appUser['nom_user'] ?? '')) ?></h1>
        <p class="email"><?= htmlspecialchars($appUser['email_user'] ?? '') ?></p>
        <?php if ($mainUser && !empty($mainUser['is_admin'])): ?>
            <span class="badge-admin">Admin</span>
        <?php endif; ?>
    </div>
</div>

<!-- Menu navigation -->
<nav class="menu">
    <a href="<?= $siteBase ?? '../' ?>pages/dashboard.php" class="menu-btn menu-link"><i class="fa-solid fa-arrow-left"></i> Dashboard</a>
    <button class="menu-btn active" id="btn-projets">Mes projets</button>
    <button class="menu-btn" id="btn-profil" onclick="show_profil()">Profil</button>
    <button class="menu-btn" id="btn-social" onclick="show_social()">Social</button>
    <button class="menu-btn" onclick="session_destroy()">Deconnexion</button>
</nav>
