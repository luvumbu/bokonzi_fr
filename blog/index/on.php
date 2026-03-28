<?php
/**
 * on.php — Page utilisateur connecte / Logged-in user page
 * FR: Interface style dashboard pour l'utilisateur connecte
 */
require_once "Class/Js.php";
require_once "on/menu_principal.php";
?>

<!-- SECTION PROJETS -->
<section id="section-projets" class="section">
    <div class="card">
        <h2>Mes projets</h2>
        <!-- Bouton nouveau projet -->
        <div style="margin-bottom:20px;">
            <button class="btn-action btn-save" id="menu_nouveau_projet" onclick="add_element(this)">
                <i class="fa-solid fa-folder-plus"></i> <?= t('menu_new_project') ?>
            </button>
        </div>
        <?php
        require_once "on/all_projet_sql.php";
        require_once "on/all_projet.php";
        ?>
    </div>
</section>

<!-- SECTION PROFIL (masquee par defaut) -->
<section id="section-profil" class="section" style="display:none;">
    <div class="card">
        <h2>Profil</h2>
        <?php require_once "on/profil.php"; ?>
    </div>
</section>

<!-- SECTION SOCIAL (masquee par defaut) -->
<section id="section-social" class="section" style="display:none;">
    <div class="card">
        <h2>Reseaux sociaux</h2>
        <?php require_once "on/social_media.php"; ?>
    </div>
</section>

<script>
    // Navigation onglets
    function switchAppTab(sectionId) {
        document.querySelectorAll('.section').forEach(function(s) { s.style.display = 'none'; });
        document.querySelectorAll('.menu-btn').forEach(function(b) { b.classList.remove('active'); });
        var section = document.getElementById(sectionId);
        if (section) section.style.display = 'block';
    }

    document.getElementById('btn-projets').addEventListener('click', function() {
        switchAppTab('section-projets');
        this.classList.add('active');
    });

    function show_profil() {
        switchAppTab('section-profil');
        document.getElementById('btn-profil').classList.add('active');
    }
    function show_social() {
        switchAppTab('section-social');
        document.getElementById('btn-social').classList.add('active');
    }

    function session_destroy() {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "req_on/session_destroy.php", true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    if (data.redirect) { window.location.href = data.redirect; return; }
                } catch(e) {}
            }
            window.location.href = "../pages/dashboard.php?tab=apps";
        };
        xhr.send();
    }

    function add_element(_this) {
        _this.style.display = "none";
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "req_on/insert_projet.php", true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (data.success) {
                    window.location.href = data.id;
                } else {
                    _this.style.display = "";
                }
            }
        };
        xhr.send();
    }

    // === Sprites flottants projets ===
    (function() {
        var sky = document.getElementById('kirbySky');
        if (!sky) return;

        var projets = <?= json_encode(array_map(function($p) {
            return [
                'nom' => $p['name_projet'] ?: 'Projet #' . $p['id_projet'],
                'desc' => $p['description_projet'] ?? '',
                'image' => !empty($p['main_img_src']) ? 'uploads/' . $p['main_img_src'] : '',
                'url' => $p['id_projet'],
            ];
        }, $mes_projets ?? [])) ?>;

        if (!projets.length) return;

        var sprites = [];
        var colors = ['#6c5ce7','#e84393','#00b894','#fdcb6e','#0984e3','#d63031','#e17055','#00cec9'];
        var W, H;

        function measure() {
            var rect = sky.getBoundingClientRect();
            W = rect.width; H = rect.height;
        }
        measure();
        window.addEventListener('resize', measure);

        projets.forEach(function(p, i) {
            var color = colors[i % colors.length];
            var el = document.createElement('a');
            el.className = 'floating-sprite sprite-mine';
            el.href = p.url;
            el.title = p.nom;
            el.style.borderColor = color + '66';
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

            sky.appendChild(el);

            var total = projets.length;
            var speed = 0.8 + Math.random() * 0.6;
            var sw = 110, sh = 120;
            var maxY = Math.max(H - sh, 100);
            var slotH = maxY / Math.max(total, 1);
            var x = Math.random() * Math.max(0, W - sw);
            var y = slotH * i + Math.random() * Math.max(0, slotH * 0.3);

            sprites.push({
                el: el, x: x, baseY: y, y: y,
                vx: (0.3 + Math.random() * 0.5) * speed * (Math.random() < 0.5 ? 1 : -1),
                vy: (0.05 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
                wave: (i / total) * Math.PI * 2, waveSpeed: 0.012 + Math.random() * 0.015,
                waveAmp: 8 + Math.random() * 12, spriteW: sw, spriteH: sh,
                facingRight: true, speed: speed
            });
        });

        setTimeout(function() {
            sprites.forEach(function(s) {
                var w = s.el.offsetWidth, h = s.el.offsetHeight;
                if (w > 0) { s.spriteW = w; s.spriteH = h; }
            });
        }, 200);

        function animate() {
            var maxY = Math.max(H - 120, 50);
            sprites.forEach(function(s) {
                s.x += s.vx * s.speed;
                s.wave += s.waveSpeed;
                s.baseY += s.vy * 0.25;
                s.y = s.baseY + Math.sin(s.wave) * s.waveAmp;
                if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
                if (s.x >= W - s.spriteW) { s.x = W - s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
                if (s.baseY <= 0) { s.baseY = 0; s.vy = Math.abs(s.vy); }
                if (s.baseY >= maxY) { s.baseY = maxY; s.vy = -Math.abs(s.vy); }
                if (s.y < 0) s.y = 0;
                if (s.y > maxY) s.y = maxY;
                s.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
                var si = s.el.querySelector('img') || s.el.querySelector('.floating-icon');
                if (si) si.style.transform = s.facingRight ? '' : 'scaleX(-1)';
            });
            for (var ai = 0; ai < sprites.length; ai++) {
                for (var bi = ai + 1; bi < sprites.length; bi++) {
                    var a = sprites[ai], b = sprites[bi];
                    if (a.x < b.x + b.spriteW && a.x + a.spriteW > b.x &&
                        a.y < b.y + b.spriteH && a.y + a.spriteH > b.y) {
                        var dx = (a.x + a.spriteW/2) - (b.x + b.spriteW/2);
                        var dy = (a.y + a.spriteH/2) - (b.y + b.spriteH/2);
                        var angle = Math.atan2(dy, dx);
                        a.x += Math.cos(angle) * 3; a.baseY += Math.sin(angle) * 3;
                        b.x -= Math.cos(angle) * 3; b.baseY -= Math.sin(angle) * 3;
                        a.vx = Math.cos(angle) * Math.abs(a.vx);
                        b.vx = -Math.cos(angle) * Math.abs(b.vx);
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    })();
</script>
