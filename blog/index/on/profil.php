<?php
/**
 * profil.php — Affichage du profil / Profile display
 * FR: Affiche les informations du profil (lecture seule si connecte via Google)
 * EN: Displays profile information (read-only if connected via Google)
 */
$user = $_SESSION["info_index"][1][0];
$mainUser = $_SESSION['user'] ?? null;
$fromBridge = !empty($mainUser);
?>

<div class="profil-container">
    <h2 class="profil-title"><?= t('profile_title') ?></h2>

    <?php if ($fromBridge && !empty($mainUser['picture'])): ?>
    <div style="text-align:center;margin-bottom:16px;">
        <img src="<?= htmlspecialchars($mainUser['picture']) ?>" alt="" style="width:80px;height:80px;border-radius:50%;border:3px solid var(--color-primary);" referrerpolicy="no-referrer">
    </div>
    <?php endif; ?>

    <div class="profil-info-grid">
        <div class="profil-info-row">
            <span class="profil-info-label"><?= t('profile_lastname') ?></span>
            <span class="profil-info-value"><?= htmlspecialchars($user['nom_user'] ?? '-') ?></span>
        </div>
        <div class="profil-info-row">
            <span class="profil-info-label">Prenom</span>
            <span class="profil-info-value"><?= htmlspecialchars($user['prenom_user'] ?? '-') ?></span>
        </div>
        <?php if (!empty($user['email_user'])): ?>
        <div class="profil-info-row">
            <span class="profil-info-label">Email</span>
            <span class="profil-info-value"><?= htmlspecialchars($user['email_user']) ?></span>
        </div>
        <?php endif; ?>
        <div class="profil-info-row">
            <span class="profil-info-label"><?= t('profile_registered') ?></span>
            <span class="profil-info-value"><?= date("d/m/Y", strtotime($user["date_inscription_user"])) ?></span>
        </div>
        <?php if ($fromBridge): ?>
        <div class="profil-info-row">
            <span class="profil-info-label">Compte</span>
            <span class="profil-info-value">Google (<?= htmlspecialchars($mainUser['email']) ?>)</span>
        </div>
        <?php endif; ?>
    </div>

    <?php if (!$fromBridge): ?>
    <!-- Formulaire modification (uniquement si login classique) -->
    <?php
    $group = new Group(false);
    $group->addElement(['tag' => 'label', 'attrs' => ['for' => 'nom_user'], 'text' => t('profile_lastname'), 'flag' => false]);
    $group->addElement(['tag' => 'input', 'attrs' => ['type' => 'text', 'id' => 'nom_user', 'name' => 'nom_user', 'value' => $user["nom_user"], 'placeholder' => t('profile_lastname')], 'flag' => true]);
    $group->addElement(['tag' => 'label', 'attrs' => ['for' => 'password_user'], 'text' => t('profile_password'), 'flag' => false]);
    $group->addElement(['tag' => 'input', 'attrs' => ['type' => 'password', 'id' => 'password_user', 'name' => 'password_user', 'value' => '', 'placeholder' => t('profile_password')], 'flag' => true]);
    $group->addElement(['tag' => 'label', 'attrs' => ['for' => 'password_user_confirm'], 'text' => t('profile_password_confirm'), 'flag' => false]);
    $group->addElement(['tag' => 'input', 'attrs' => ['type' => 'password', 'id' => 'password_user_confirm', 'name' => 'password_user_confirm', 'value' => '', 'placeholder' => t('profile_password_confirm')], 'flag' => false]);
    $group->addElement(['tag' => 'input', 'attrs' => ['type' => 'hidden', 'id' => 'id_user', 'value' => $user["id_user"]], 'flag' => true]);
    $group->addElement(['tag' => 'div', 'attrs' => ['class' => 'submit-btn', 'onclick' => 'on_send_profil()'], 'text' => t('profile_save'), 'flag' => false]);
    $group->addElement(['tag' => 'p', 'attrs' => ['id' => 'profil_error', 'class' => 'profil-error'], 'text' => '', 'flag' => false]);
    $manager = new GroupManager('profilData');
    $manager->addGroup($group);
    echo $manager->render();
    $manager->generateJsInformation('req_on/update_profil.php');
    ?>
    <script>
    function on_send_profil() {
        if (typeof profilData === 'undefined') return;
        var pass = document.getElementById("password_user").value;
        var confirm = document.getElementById("password_user_confirm").value;
        var errorEl = document.getElementById("profil_error");
        if (pass !== confirm) { errorEl.textContent = "<?= t('profile_password_mismatch') ?>"; return; }
        errorEl.textContent = "";
        for (var i = 0; i < profilData.identite_tab.length; i++) {
            var id = profilData.identite_tab[i][0];
            var el = document.getElementById(id);
            if (el) profilData.identite_tab[i][1] = el.value;
        }
        profilData.req.onload = function() { if (profilData.req.status === 200) location.reload(); };
        profilData.push();
    }
    </script>
    <?php endif; ?>
</div>
