<?php
/**
 * login.php — Formulaire de connexion style dashboard
 */
?>
<div class="dashboard-header" style="justify-content:center;text-align:center;flex-direction:column;gap:12px;">
    <img src="<?= (isset($appBase) ? $appBase : '') ?>logo.svg" alt="BOKONZI Blog" style="width:80px;height:80px;border-radius:20px;box-shadow:0 4px 16px rgba(108,92,231,0.25);">
    <div>
        <h1>BOKONZI Blog</h1>
        <p class="email">Connectez-vous pour acceder a vos projets</p>
    </div>
</div>

<section class="section">
    <div class="card">
        <h2>Connexion</h2>
        <div id="info_index"></div>
        <div style="display:flex;flex-direction:column;gap:14px;max-width:400px;">
            <div>
                <label style="color:#64748b;font-size:13px;font-weight:600;display:block;margin-bottom:6px;"><?= t('label_dbname') ?></label>
                <input type="text" id="dbname" value="" placeholder="Prenom"
                    style="width:100%;padding:12px 16px;font-size:15px;background:#0f1525;color:#e2e8f0;border:1px solid #1e293b;border-radius:10px;outline:none;">
            </div>
            <div>
                <label style="color:#64748b;font-size:13px;font-weight:600;display:block;margin-bottom:6px;"><?= t('label_tablename') ?></label>
                <input type="password" id="username" value="" placeholder="Mot de passe"
                    style="width:100%;padding:12px 16px;font-size:15px;background:#0f1525;color:#e2e8f0;border:1px solid #1e293b;border-radius:10px;outline:none;">
            </div>
            <button class="btn-action btn-save" onclick="login_js()" style="padding:14px;font-size:15px;border:none;cursor:pointer;margin-top:8px;">
                <?= t('btn_submit') ?>
            </button>
        </div>
    </div>
</section>

<script>
    // Compatibilite avec l'ancien systeme JS de login
    var formData = {
        identite_tab: [['dbname', ''], ['username', '']],
        req: new XMLHttpRequest(),
        push: function() {
            var fd = new FormData();
            for (var i = 0; i < this.identite_tab.length; i++) {
                fd.append(this.identite_tab[i][0], this.identite_tab[i][1]);
            }
            this.req.open("POST", "req_on/login_bdd.php");
            this.req.send(fd);
        }
    };
</script>
<?php require_once "index/login_js.php"; ?>
