<?php
// Page d'accueil — univers Kirby avec projets flottants
// Depend de : config.php, sql/projets_sql.php, css/accueil.css, css/kirby.css
// Utilise par : acces direct (URL racine)

if (!file_exists(__DIR__ . '/.credentials.php')) {
    header('Location: auth/login.php');
    exit;
}

require_once 'config.php';
require_once __DIR__ . '/sql/projets_sql.php';

$logged = isset($_SESSION['user']);
$user = $logged ? $_SESSION['user'] : null;
$isAdmin = false;
if ($logged) {
    $stmtAdmin = $conn->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmtAdmin->bind_param('i', $user['id']);
    $stmtAdmin->execute();
    $adminRow = $stmtAdmin->get_result()->fetch_assoc();
    $isAdmin = !empty($adminRow['is_admin']);
    $_SESSION['user']['is_admin'] = $isAdmin;
}

syncProjets($conn, __DIR__ . '/projet');
$projets = getProjets($conn, false);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>bokonzi.fr</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="css/accueil.css">
    <link rel="stylesheet" href="css/kirby.css">
    <script src="js/kirby.js"></script>
</head>
<body>
    <!-- NAVBAR -->
    <nav class="navbar">
        <a href="index.php" class="nav-brand">bokonzi.fr</a>
        <div class="nav-right">
            <?php if ($logged): ?>
                <?php if (!empty($user['picture'])): ?>
                    <img src="<?= htmlspecialchars($user['picture']) ?>" alt="Avatar" class="nav-avatar" referrerpolicy="no-referrer">
                <?php endif; ?>
                <a href="pages/dashboard.php" class="nav-link">Dashboard</a>
                <a href="auth/logout.php" class="nav-link nav-logout">Deconnexion</a>
            <?php else: ?>
                <a href="auth/login.php" class="nav-link nav-login">Se connecter</a>
            <?php endif; ?>
        </div>
    </nav>

    <!-- HERO -->
    <header class="hero">
        <h1>Mes projets</h1>
        <p>Bienvenue sur bokonzi.fr — explorez les projets disponibles.</p>
    </header>

    <?php if (empty($projets)): ?>
        <main class="main">
            <p class="empty-msg">Aucun projet disponible pour le moment.</p>
        </main>
    <?php else: ?>
    <!-- UNIVERS KIRBY -->
    <div class="kirby-world">
        <!-- Etoiles -->
        <button class="kirby-toggle-mode" onclick="toggleDayNight(this)"><span>&#9788;</span><span class="mode-label">Jour</span></button>
        <div class="kirby-sidebar">
            <div class="kirby-sidebar-title">Projets</div>
            <?php foreach ($projets as $p): ?>
            <a href="projet/<?= htmlspecialchars($p['nom']) ?>/" class="kirby-sidebar-item" target="_blank">
                <span class="kirby-sidebar-dot" style="background: <?= htmlspecialchars($p['sprite_color'] ?? '#6c5ce7') ?>;"></span>
                <span class="kirby-sidebar-name"><?= htmlspecialchars($p['titre'] ?: $p['nom']) ?></span>
            </a>
            <?php endforeach; ?>
        </div>
        <div class="kirby-planet"></div>
        <div class="kirby-planet-ring"></div>
        <div class="kirby-stars" id="kirbyStars"></div>
        <!-- Nuages -->
        <div class="kirby-clouds" id="kirbyClouds"></div>
        <!-- Collines -->
        <div class="kirby-hills">
            <div class="hill hill-1"></div>
            <div class="hill hill-2"></div>
            <div class="hill hill-3"></div>
            <div class="hill hill-4"></div>
        </div>
        <!-- Zone de vol (sprites ici) -->
        <div class="kirby-sky" id="kirbySky"></div>
        <!-- Sol -->
        <div class="kirby-ground">
            <div class="ground-grass" id="groundGrass"></div>
            <div class="ground-dirt"></div>
        </div>
    </div>
    <?php endif; ?>

    <!-- FOOTER -->
    <footer class="footer">
        <p>&copy; <?= date('Y') ?> bokonzi.fr</p>
    </footer>

    <?php if (!empty($projets)): ?>
    <script>
    (function() {
        // === Generer les etoiles ===
        var starsEl = document.getElementById('kirbyStars');
        for (var s = 0; s < 60; s++) {
            var star = document.createElement('div');
            var r = Math.random();
            star.className = 'kirby-star' + (r > 0.92 ? ' big blink' : r > 0.75 ? ' blink' : r > 0.6 ? ' blink-slow' : '');
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 55 + '%';
            star.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
            starsEl.appendChild(star);
        }

        // === Generer les nuages ===
        var cloudsEl = document.getElementById('kirbyClouds');
        var cloudData = [];
        for (var c = 0; c < 5; c++) {
            var cloud = document.createElement('div');
            cloud.className = 'kirby-cloud';
            var cw = 120 + Math.random() * 180;
            var ch = 25 + Math.random() * 20;
            cloud.style.width = cw + 'px';
            cloud.style.height = ch + 'px';
            cloud.style.top = (10 + Math.random() * 40) + '%';
            var cx = Math.random() * (window.innerWidth + cw) - cw;
            cloud.style.opacity = 0.4 + Math.random() * 0.4;
            cloudsEl.appendChild(cloud);
            cloudData.push({ el: cloud, x: cx, speed: 0.15 + Math.random() * 0.25, w: cw });
        }

        // === Generer l'herbe ===
        var grassEl = document.getElementById('groundGrass');
        var grassCount = Math.floor(window.innerWidth / 10);
        for (var g = 0; g < grassCount; g++) {
            var blade = document.createElement('div');
            blade.className = 'grass-blade';
            blade.style.left = (g / grassCount * 100) + '%';
            blade.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
            grassEl.appendChild(blade);
        }

        // === Sprites projets ===
        var userId = <?= $logged ? (int)$user['id'] : 0 ?>;
        var projets = <?= json_encode(array_map(function($p) {
            return [
                'nom' => $p['titre'] ?: $p['nom'],
                'desc' => $p['description'] ?? '',
                'image' => $p['image'] ?? '',
                'auteur' => $p['auteur_nom'] ?? '',
                'url' => 'projet/' . $p['nom'] . '/',
                'auteur_id' => (int)($p['auteur_id'] ?? 0),
                'sprite_size' => (int)($p['sprite_size'] ?? 100),
                'sprite_force' => (int)($p['sprite_force'] ?? 100),
                'sprite_color' => $p['sprite_color'] ?? '#6c5ce7',
                'sprite_speed' => (int)($p['sprite_speed'] ?? 100),
            ];
        }, $projets)) ?>;

        var sky = document.getElementById('kirbySky');
        var sprites = [];
        var W, H;

        function measure() {
            var rect = sky.getBoundingClientRect();
            W = rect.width;
            H = rect.height;
        }
        measure();
        window.addEventListener('resize', function() {
            measure();
            // re-generer herbe
            grassEl.innerHTML = '';
            var gc = Math.floor(window.innerWidth / 10);
            for (var g = 0; g < gc; g++) {
                var b = document.createElement('div');
                b.className = 'grass-blade';
                b.style.left = (g / gc * 100) + '%';
                b.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
                grassEl.appendChild(b);
            }
        });

        projets.forEach(function(p, i) {
            var owned = userId > 0 && (p.auteur_id === userId);
            var sizeScale = (p.sprite_size || 100) / 100;
            var forceScale = (p.sprite_force || 100) / 100;
            var speedScale = (p.sprite_speed || 100) / 100;
            var color = p.sprite_color || '#6c5ce7';

            var el = document.createElement('a');
            el.className = 'floating-sprite' + (userId > 0 ? (owned ? ' sprite-mine' : ' sprite-enemy') : '');
            el.href = p.url;
            el.target = '_blank';
            el.title = p.nom;
            el.style.borderColor = color + '66';
            el.style.width = Math.round(110 * sizeScale) + 'px';
            el.style.boxShadow = '0 0 12px ' + color + '33';

            if (p.image) {
                var img = document.createElement('img');
                img.src = p.image;
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

            if (p.desc) {
                var desc = document.createElement('span');
                desc.className = 'floating-desc';
                desc.textContent = p.desc;
                el.appendChild(desc);
            }
            if (p.auteur) {
                var auteur = document.createElement('span');
                auteur.className = 'floating-auteur';
                auteur.textContent = 'par ' + p.auteur;
                el.appendChild(auteur);
            }

            sky.appendChild(el);

            var total = projets.length;
            var speed = (owned ? 1.5 : 1) * speedScale;
            var sw = Math.round((owned ? 85 : (userId > 0 ? 130 : 110)) * sizeScale);
            var sh = Math.round((owned ? 90 : (userId > 0 ? 140 : 120)) * sizeScale);
            var maxY = H - sh;
            var slotH = maxY / total;

            var x = Math.random() * Math.max(0, W - sw);
            var y = slotH * i + Math.random() * Math.max(0, slotH * 0.3);

            sprites.push({
                el: el, x: x, baseY: y, y: y,
                vx: (0.3 + Math.random() * 0.5) * speed * (Math.random() < 0.5 ? 1 : -1),
                vy: (0.05 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
                wave: (i / total) * Math.PI * 2 + Math.random() * 0.5,
                waveSpeed: 0.012 + Math.random() * 0.015,
                waveAmp: 8 + Math.random() * 12,
                spriteW: el.offsetWidth || sw, spriteH: el.offsetHeight || sh, facingRight: true,
                owned: owned, vyJump: 0, onGround: false,
                force: forceScale, speed: speedScale,
                knockX: 0, knockY: 0, target: null, stunned: 0
            });
        });

        var needsResize = true;
        setTimeout(function() { needsResize = true; }, 200);


        var gravity = 0.18;
        var groundY = H - 70;
        var hasOwned = userId > 0;

        // Init owned au sol
        sprites.forEach(function(s) {
            if (s.owned) {
                s.baseY = groundY;
                s.y = groundY;
                s.onGround = true;
                s.vy = 0;
            }
        });

        function animate() {
            if (needsResize) {
                sprites.forEach(function(s) {
                    var w = s.el.offsetWidth;
                    var h = s.el.offsetHeight;
                    if (w > 0 && h > 0) { s.spriteW = w; s.spriteH = h; }
                });
                needsResize = false;
            }
            var ww = window.innerWidth;
            cloudData.forEach(function(c) {
                c.x += c.speed;
                if (c.x > ww + 20) c.x = -c.w - 20;
                c.el.style.transform = 'translateX(' + c.x.toFixed(1) + 'px)';
            });

            var maxY = H - 120;
            sprites.forEach(function(s) {
                if (hasOwned && s.owned) {
                    s.x += s.vx * 0.5 * s.speed;
                    s.vyJump += gravity;
                    s.y += s.vyJump;
                    if (s.y >= groundY) { s.y = groundY; s.vyJump = 0; s.onGround = true; }
                    if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                    if (s.x >= W - s.spriteW) { s.x = W - s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
                    var closestDist = 9999;
                    sprites.forEach(function(e) {
                        if (e.owned) return;
                        var dx = (s.x + s.spriteW/2) - (e.x + e.spriteW/2);
                        var dy = (s.y + s.spriteH/2) - (e.y + e.spriteH/2);
                        if (Math.sqrt(dx*dx+dy*dy) < closestDist) closestDist = Math.sqrt(dx*dx+dy*dy);
                    });
                    if (closestDist < 180 && s.onGround && Math.random() < 0.04) {
                        s.vyJump = -(4 + Math.random() * 3);
                        s.onGround = false;
                    }
                } else if (hasOwned && !s.owned) {
                    // Knockback progressif
                    if (s.knockX || s.knockY) {
                        s.x += s.knockX;
                        s.baseY += s.knockY;
                        s.knockX *= 0.92;
                        s.knockY *= 0.92;
                        if (Math.abs(s.knockX) < 0.05) s.knockX = 0;
                        if (Math.abs(s.knockY) < 0.05) s.knockY = 0;
                    }
                    s.x += s.vx * s.speed;
                    s.wave += s.waveSpeed;
                    s.baseY += s.vy * 0.25;
                    s.y = s.baseY + Math.sin(s.wave) * s.waveAmp;
                    var ownedList = sprites.filter(function(m) { return m.owned; });
                    if (ownedList.length) {
                        if (s.stunned > 0) {
                            s.stunned--;
                            s.wave += s.waveSpeed * 2;
                            s.vx *= 0.98;
                        } else {
                            var activeAttackers = sprites.filter(function(o) {
                                return !o.owned && o !== s && o.stunned <= 0 && o.target;
                            });
                            var takenTargets = activeAttackers.map(function(o) { return o.target; });

                            if (!s.target) {
                                var candidates = ownedList.filter(function(m) {
                                    return takenTargets.indexOf(m) === -1;
                                });
                                if (!candidates.length) candidates = ownedList;
                                var best = null, bestDist = 9999;
                                candidates.forEach(function(m) {
                                    var dx = (s.x+s.spriteW/2)-(m.x+m.spriteW/2);
                                    var dy = (s.y+s.spriteH/2)-(m.y+m.spriteH/2);
                                    var d = Math.sqrt(dx*dx+dy*dy);
                                    if (d < bestDist) { bestDist = d; best = m; }
                                });
                                s.target = best;
                            }

                            var t = s.target;
                            if (t) {
                                var tdx = (t.x+t.spriteW/2)-(s.x+s.spriteW/2);
                                var tdy = (t.y+t.spriteH/2)-(s.y+s.spriteH/2);
                                var tDist = Math.sqrt(tdx*tdx+tdy*tdy);
                                var angle = Math.atan2(tdy, tdx);
                                var accel = tDist > 200 ? 0.12 : 0.06;
                                s.vx += Math.cos(angle) * accel;
                                s.baseY += Math.sin(angle) * accel * 2;
                                s.facingRight = tdx > 0;
                            }
                        }
                    }
                    if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                    if (s.x >= W-s.spriteW) { s.x = W-s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
                    if (s.baseY <= 0) { s.baseY = 0; s.vy = Math.abs(s.vy); }
                    if (s.baseY >= maxY) { s.baseY = maxY; s.vy = -Math.abs(s.vy); }
                    if (s.y < 0) s.y = 0;
                    if (s.y > maxY) s.y = maxY;
                    var maxVx = 2.5 * s.speed;
                    if (s.vx > maxVx) s.vx = maxVx;
                    if (s.vx < -maxVx) s.vx = -maxVx;
                } else {
                    s.x += s.vx * s.speed;
                    s.wave += s.waveSpeed;
                    s.baseY += s.vy * 0.25;
                    s.y = s.baseY + Math.sin(s.wave) * s.waveAmp;
                    if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                    if (s.x >= W-s.spriteW) { s.x = W-s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
                    if (s.baseY <= 0) { s.baseY = 0; s.vy = Math.abs(s.vy); }
                    if (s.baseY >= maxY) { s.baseY = maxY; s.vy = -Math.abs(s.vy); }
                    if (s.y < 0) s.y = 0;
                    if (s.y > maxY) s.y = maxY;
                }
                s.el.style.transform = 'translate('+s.x.toFixed(1)+'px,'+s.y.toFixed(1)+'px)';
                var spriteImg = s.el.querySelector('img') || s.el.querySelector('.floating-icon');
                if (spriteImg) spriteImg.style.transform = s.facingRight ? '' : 'scaleX(-1)';
            });

            // Collision AABB (bords des carres) + force
            for (var ai = 0; ai < sprites.length; ai++) {
                for (var bi = ai + 1; bi < sprites.length; bi++) {
                    var a = sprites[ai], b = sprites[bi];
                    var margin = 6;
                    if (a.x + margin < b.x + b.spriteW - margin && a.x + a.spriteW - margin > b.x + margin &&
                        a.y + margin < b.y + b.spriteH - margin && a.y + a.spriteH - margin > b.y + margin) {

                        if (a.owned && b.owned) continue;

                        var dx = (a.x + a.spriteW/2) - (b.x + b.spriteW/2);
                        var dy = (a.y + a.spriteH/2) - (b.y + b.spriteH/2);
                        var angle = Math.atan2(dy, dx);

                        var forceA = a.force || 1;
                        var forceB = b.force || 1;
                        var knockPower = 10;

                        if (a.owned && !b.owned) {
                            var ratio = forceA / (forceA + forceB);
                            b.knockX = -Math.cos(angle) * knockPower * (0.5 + ratio);
                            b.knockY = -Math.sin(angle) * knockPower * (0.5 + ratio);
                            b.vx = 0; b.stunned = 120; b.target = null;
                        } else if (b.owned && !a.owned) {
                            var ratio = forceB / (forceA + forceB);
                            a.knockX = Math.cos(angle) * knockPower * (0.5 + ratio);
                            a.knockY = Math.sin(angle) * knockPower * (0.5 + ratio);
                            a.vx = 0; a.stunned = 120; a.target = null;
                        } else {
                            var totalForce = forceA + forceB;
                            a.knockX = Math.cos(angle) * knockPower * (forceB / totalForce);
                            a.knockY = Math.sin(angle) * knockPower * (forceB / totalForce);
                            b.knockX = -Math.cos(angle) * knockPower * (forceA / totalForce);
                            b.knockY = -Math.sin(angle) * knockPower * (forceA / totalForce);
                            if (forceA < forceB) { a.vx = 0; a.stunned = 120; a.target = null; }
                            else if (forceB < forceA) { b.vx = 0; b.stunned = 120; b.target = null; }
                            else { a.vx = 0; b.vx = 0; }
                        }

                    }
                }
            }

            // Separation entre rouges (soft push AABB)
            var enemies = sprites.filter(function(s) { return !s.owned; });
            for (var ei = 0; ei < enemies.length; ei++) {
                for (var ej = ei + 1; ej < enemies.length; ej++) {
                    var a = enemies[ei], b = enemies[ej];
                    var overlapX = Math.min(a.x+a.spriteW, b.x+b.spriteW) - Math.max(a.x, b.x);
                    var overlapY = Math.min(a.y+a.spriteH, b.y+b.spriteH) - Math.max(a.y, b.y);
                    if (overlapX > 0 && overlapY > 0) {
                        var dx = (a.x+a.spriteW/2)-(b.x+b.spriteW/2);
                        var dy = (a.y+a.spriteH/2)-(b.y+b.spriteH/2);
                        var angle = Math.atan2(dy, dx);
                        var push = Math.min(overlapX, overlapY) * 0.1;
                        a.x += Math.cos(angle) * push;
                        a.baseY += Math.sin(angle) * push;
                        b.x -= Math.cos(angle) * push;
                        b.baseY -= Math.sin(angle) * push;
                    }
                }
            }


            requestAnimationFrame(animate);
        }
        animate();
    })();
    </script>
    <?php endif; ?>
</body>
</html>
