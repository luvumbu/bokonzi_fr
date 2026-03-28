<?php
// Page de connexion — Setup BDD + Google OAuth + Admin
// Depend de : .credentials.php, .google_oauth.php (via config.php), config.php, sql/login_sql.php, css/login.css, js/login.js
// Utilise par : index.php (redirection si deconnecte), auth/logout.php (redirection apres deconnexion)
//
// +-------------------------+--------------------------------------------------+
// | Mode                    | Condition                                        |
// +-------------------------+--------------------------------------------------+
// | Setup (formulaire BDD)  | .credentials.php absent → cree le fichier        |
// | Connexion Google        | .google_oauth.php present + cles non vides       |
// | Connexion Admin         | .credentials.php present (DB_USER / DB_PASS)     |
// | Redirection index       | Session deja active                              |
// +-------------------------+--------------------------------------------------+

session_start();

$credFile = __DIR__ . '/../.credentials.php';
$credsMissing = !file_exists($credFile);
$setupError = '';
$setupSuccess = false;

// ========================================
// MODE SETUP : .credentials.php absent → formulaire pour le creer
// ========================================
if ($credsMissing) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['setup_creds'])) {
        $name = trim($_POST['db_name'] ?? '');
        $user = trim($_POST['db_user'] ?? '');
        $pass = $_POST['db_pass'] ?? '';

        // Tester la connexion MySQL
        try {
            $testConn = new mysqli('localhost', $user, $pass);
            $testConn->close();

            // Connexion OK → creer le fichier
            $content = "<?php\n";
            $content .= "// Credentials BDD — NE PAS PARTAGER\n";
            $content .= "// Depend de : rien (fichier autonome)\n";
            $content .= "// Utilise par : config.php (require)\n";
            $content .= "// Protege par : .htaccess (acces HTTP bloque)\n";
            $content .= "// Si ce fichier n'existe pas, le site ne demarre pas\n\n";
            $content .= "return [\n";
            $content .= "    'DB_HOST' => 'localhost',\n";
            $content .= "    'DB_NAME' => " . var_export($name, true) . ",\n";
            $content .= "    'DB_USER' => " . var_export($user, true) . ",\n";
            $content .= "    'DB_PASS' => " . var_export($pass, true) . ",\n";
            $content .= "];\n";

            if (file_put_contents($credFile, $content)) {
                $setupSuccess = true;
                $credsMissing = false;
            } else {
                $setupError = 'Impossible d\'ecrire le fichier. Verifiez les permissions.';
            }
        } catch (mysqli_sql_exception $e) {
            $setupError = 'Connexion echouee : ' . $e->getMessage();
        }
    }
}

// ========================================
// MODE NORMAL : .credentials.php existe
// ========================================
$adminError = '';
$floatingProjets = [];

if (!$credsMissing) {
    require_once __DIR__ . '/../config.php';
    require_once __DIR__ . '/../sql/login_sql.php';
    require_once __DIR__ . '/../sql/projets_sql.php';

    // Charger les projets visibles pour l'animation
    $floatingProjets = getProjets($conn, false);

    if (isset($_SESSION['user'])) {
        header('Location: ../index.php');
        exit;
    }

    // Login admin
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_login'])) {
        $inputUser = $_POST['username'] ?? '';
        $inputPass = $_POST['password'] ?? '';
        if ($inputUser === DB_USER && $inputPass === DB_PASS) {
            $adminData = adminLogin($conn);

            $_SESSION['user'] = [
                'id' => $adminData['id'],
                'google_id' => 'admin',
                'email' => 'admin@local',
                'name' => 'Administrateur',
                'given_name' => 'Admin',
                'family_name' => '',
                'picture' => '',
                'locale' => 'fr',
                'login_count' => $adminData['login_count'],
                'is_admin' => true
            ];
            header('Location: ../index.php');
            exit;
        } else {
            $adminError = 'Identifiants incorrects.';
        }
    }

    // Google OAuth (seulement si credentials configures)
    $googleEnabled = defined('GOOGLE_CLIENT_ID') && GOOGLE_CLIENT_ID !== '';
    $authUrl = '';
    if ($googleEnabled) {
        $state = bin2hex(random_bytes(16));
        $_SESSION['oauth_state'] = $state;
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id' => GOOGLE_CLIENT_ID,
            'redirect_uri' => GOOGLE_REDIRECT_URI,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'online',
            'prompt' => 'consent'
        ]);
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion — bokonzifr</title>
    <link rel="stylesheet" href="../css/login.css">
    <link rel="stylesheet" href="../css/kirby.css">
    <script src="../js/kirby.js"></script>
</head>
<body>
    <!-- UNIVERS KIRBY ARRIERE-PLAN -->
    <?php if (!empty($floatingProjets)): ?>
    <div class="kirby-world kirby-bg">
        <button class="kirby-toggle-mode" onclick="toggleDayNight(this)"><span>&#9788;</span><span class="mode-label">Jour</span></button>
        <div class="kirby-sidebar">
            <div class="kirby-sidebar-title">Projets</div>
            <?php foreach ($floatingProjets as $p): ?>
            <a href="../projet/<?= htmlspecialchars($p['nom']) ?>/" class="kirby-sidebar-item" target="_blank">
                <span class="kirby-sidebar-dot" style="background: <?= htmlspecialchars($p['sprite_color'] ?? '#6c5ce7') ?>;"></span>
                <span class="kirby-sidebar-name"><?= htmlspecialchars($p['titre'] ?: $p['nom']) ?></span>
            </a>
            <?php endforeach; ?>
        </div>
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

    <div class="login-wrapper">
    <div class="login-box">
        <h1>bokonzifr</h1>

        <?php if ($setupSuccess): ?>
            <p class="success">Configuration enregistree !</p>
            <p style="color:#8b949e; font-size:14px; margin-top:10px;">Redirection...</p>
            <script>setTimeout(function(){ location.href = 'login.php'; }, 1500);</script>

        <?php elseif ($credsMissing): ?>
            <p style="color:#f0883e; margin-top:15px;">Configuration initiale</p>
            <p style="color:#8b949e; font-size:13px;">Entrez vos identifiants pour demarrer le site.</p>

            <form class="setup-form" method="POST">
                <label>Nom de la base de donnees</label>
                <input type="text" name="db_name" value="<?= htmlspecialchars($_POST['db_name'] ?? '') ?>" placeholder="bokonzifr">
                <label>Utilisateur MySQL</label>
                <input type="text" name="db_user" value="<?= htmlspecialchars($_POST['db_user'] ?? '') ?>" placeholder="root">
                <label>Mot de passe MySQL</label>
                <input type="password" name="db_pass" value="<?= htmlspecialchars($_POST['db_pass'] ?? '') ?>" placeholder="(vide si local)">

                <?php if ($setupError): ?>
                    <p class="error"><?= htmlspecialchars($setupError) ?></p>
                <?php endif; ?>

                <input type="hidden" name="setup_creds" value="1">
                <button type="submit" class="btn-setup">Enregistrer</button>
            </form>

        <?php else: ?>
            <p>Connectez-vous pour continuer</p>
            <?php if ($googleEnabled): ?>
            <a href="<?= htmlspecialchars($authUrl) ?>" class="btn-google">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                Se connecter avec Google
            </a>

            <div class="separator">ou</div>

            <button class="admin-toggle">Connexion administrateur</button>
            <?php endif; ?>

            <form id="adminForm" class="admin-form<?= (!$googleEnabled || $adminError) ? ' show' : '' ?>" method="POST">
                <?php if ($adminError): ?>
                    <p class="error"><?= htmlspecialchars($adminError) ?></p>
                <?php endif; ?>
                <input type="text" name="username" placeholder="Nom d'utilisateur">
                <input type="password" name="password" placeholder="Mot de passe">
                <input type="hidden" name="admin_login" value="1">
                <button type="submit" class="btn-admin">Se connecter</button>
            </form>
        <?php endif; ?>
    </div>
    </div><!-- /login-wrapper -->

    <?php if (!empty($floatingProjets)): ?>
    <script>
    (function() {
        // Etoiles
        var starsEl = document.getElementById('kirbyStars');
        for (var s = 0; s < 50; s++) {
            var star = document.createElement('div');
            var r = Math.random();
            star.className = 'kirby-star' + (r > 0.92 ? ' big blink' : r > 0.75 ? ' blink' : r > 0.6 ? ' blink-slow' : '');
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 55 + '%';
            star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
            starsEl.appendChild(star);
        }

        // Nuages
        var cloudsEl = document.getElementById('kirbyClouds');
        var cloudData = [];
        for (var c = 0; c < 4; c++) {
            var cloud = document.createElement('div');
            cloud.className = 'kirby-cloud';
            var cw = 100 + Math.random() * 160;
            cloud.style.width = cw + 'px';
            cloud.style.height = (20 + Math.random() * 18) + 'px';
            cloud.style.top = (10 + Math.random() * 40) + '%';
            cloud.style.opacity = 0.3 + Math.random() * 0.4;
            var cx = Math.random() * window.innerWidth;
            cloudsEl.appendChild(cloud);
            cloudData.push({ el: cloud, x: cx, speed: 0.12 + Math.random() * 0.2, w: cw });
        }

        // Herbe
        var grassEl = document.getElementById('groundGrass');
        var gc = Math.floor(window.innerWidth / 10);
        for (var g = 0; g < gc; g++) {
            var blade = document.createElement('div');
            blade.className = 'grass-blade';
            blade.style.left = (g / gc * 100) + '%';
            blade.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
            grassEl.appendChild(blade);
        }

        // Sprites
        var projets = <?= json_encode(array_map(function($p) {
            return [
                'nom' => $p['titre'] ?: $p['nom'],
                'image' => $p['image'] ?? '',
                'url' => '../projet/' . $p['nom'] . '/',
            ];
        }, $floatingProjets)) ?>;

        var sky = document.getElementById('kirbySky');
        var sprites = [];
        var W, H;

        function measure() {
            var rect = sky.getBoundingClientRect();
            W = rect.width;
            H = rect.height;
        }
        measure();
        window.addEventListener('resize', measure);

        projets.forEach(function(p, i) {
            var el = document.createElement('a');
            el.className = 'floating-sprite sprite-enemy';
            el.href = p.url;
            el.target = '_blank';
            el.title = p.nom;

            if (p.image) {
                var img = document.createElement('img');
                img.src = '../' + p.image;
                img.alt = p.nom;
                el.appendChild(img);
            } else {
                var icon = document.createElement('span');
                icon.className = 'floating-icon';
                icon.textContent = '\uD83D\uDCC2';
                el.appendChild(icon);
            }

            var label = document.createElement('span');
            label.className = 'floating-label';
            label.textContent = p.nom;
            el.appendChild(label);

            sky.appendChild(el);

            var total = projets.length;
            var sw = 130, sh = 140;
            var maxY = H - sh;
            var slotH = maxY / total;

            sprites.push({
                el: el,
                x: Math.random() * Math.max(0, W - sw),
                baseY: slotH * i + Math.random() * Math.max(0, slotH * 0.3),
                y: 0,
                vx: (0.3 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1),
                vy: (0.05 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
                wave: (i / total) * Math.PI * 2 + Math.random() * 0.5,
                waveSpeed: 0.012 + Math.random() * 0.015,
                waveAmp: 8 + Math.random() * 12,
                spriteW: sw, spriteH: sh, facingRight: true
            });
        });

        function animate() {
            var ww = window.innerWidth;
            cloudData.forEach(function(c) {
                c.x += c.speed;
                if (c.x > ww + 20) c.x = -c.w - 20;
                c.el.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
            });

            var maxY = H - 140;
            sprites.forEach(function(s) {
                s.x += s.vx;
                s.wave += s.waveSpeed;
                s.baseY += s.vy * 0.25;
                s.y = s.baseY + Math.sin(s.wave) * s.waveAmp;

                if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                if (s.x >= W-s.spriteW) { s.x = W-s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
                if (s.baseY <= 0) { s.baseY = 0; s.vy = Math.abs(s.vy); }
                if (s.baseY >= maxY) { s.baseY = maxY; s.vy = -Math.abs(s.vy); }
                if (s.y < 0) s.y = 0;
                if (s.y > maxY) s.y = maxY;

                s.el.style.transform = 'translate('+s.x.toFixed(1)+'px,'+s.y.toFixed(1)+'px)';
                var spriteImg = s.el.querySelector('img') || s.el.querySelector('.floating-icon');
                if (spriteImg) spriteImg.style.transform = s.facingRight ? '' : 'scaleX(-1)';
            });
            requestAnimationFrame(animate);
        }
        animate();
    })();
    </script>
    <?php endif; ?>

    <?php if (!$credsMissing && !$setupSuccess): ?>
        <script src="../js/login.js"></script>
    <?php endif; ?>
</body>
</html>
