/**
 * sprites.js — Sprites flottants pour les projets CMS
 * Depend de : un conteneur #sprite-sky dans le HTML
 * Utilise par : index/on.php
 *
 * Appel : initSprites(projets, containerId)
 *   projets = [{ id, nom, desc, image, url }]
 */
function initSprites(projets, containerId) {
    var sky = document.getElementById(containerId);
    if (!sky || !projets.length) return;

    var sprites = [];
    var W, H;

    function measure() {
        var rect = sky.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
    }
    measure();
    window.addEventListener('resize', measure);

    // Couleurs aleatoires pour chaque sprite
    var colors = ['#6c5ce7','#e84393','#00b894','#fdcb6e','#0984e3','#d63031','#e17055','#00cec9'];

    projets.forEach(function(p, i) {
        var color = colors[i % colors.length];

        var el = document.createElement('a');
        el.className = 'floating-sprite sprite-mine';
        el.href = p.url || p.id;
        el.title = p.nom || 'Projet #' + p.id;
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
        label.textContent = p.nom || 'Projet #' + p.id;
        el.appendChild(label);

        if (p.desc) {
            var desc = document.createElement('span');
            desc.className = 'floating-desc';
            desc.textContent = p.desc.substring(0, 40);
            el.appendChild(desc);
        }

        sky.appendChild(el);

        var total = projets.length;
        var speed = 0.8 + Math.random() * 0.6;
        var sw = 110;
        var sh = 120;
        var maxY = Math.max(H - sh, 100);
        var slotH = maxY / Math.max(total, 1);

        var x = Math.random() * Math.max(0, W - sw);
        var y = slotH * i + Math.random() * Math.max(0, slotH * 0.3);

        sprites.push({
            el: el, x: x, baseY: y, y: y,
            vx: (0.3 + Math.random() * 0.5) * speed * (Math.random() < 0.5 ? 1 : -1),
            vy: (0.05 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
            wave: (i / total) * Math.PI * 2 + Math.random() * 0.5,
            waveSpeed: 0.012 + Math.random() * 0.015,
            waveAmp: 8 + Math.random() * 12,
            spriteW: sw, spriteH: sh, facingRight: true,
            speed: speed
        });
    });

    // Mesurer apres le render
    setTimeout(function() {
        sprites.forEach(function(s) {
            var w = s.el.offsetWidth;
            var h = s.el.offsetHeight;
            if (w > 0 && h > 0) { s.spriteW = w; s.spriteH = h; }
        });
    }, 200);

    function animate() {
        var maxY = Math.max(H - 120, 50);

        sprites.forEach(function(s) {
            // Mouvement flottant
            s.x += s.vx * s.speed;
            s.wave += s.waveSpeed;
            s.baseY += s.vy * 0.25;
            s.y = s.baseY + Math.sin(s.wave) * s.waveAmp;

            // Rebonds
            if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); s.facingRight = true; }
            if (s.x >= W - s.spriteW) { s.x = W - s.spriteW; s.vx = -Math.abs(s.vx); s.facingRight = false; }
            if (s.baseY <= 0) { s.baseY = 0; s.vy = Math.abs(s.vy); }
            if (s.baseY >= maxY) { s.baseY = maxY; s.vy = -Math.abs(s.vy); }
            if (s.y < 0) s.y = 0;
            if (s.y > maxY) s.y = maxY;

            // Appliquer
            s.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px)';
            var spriteImg = s.el.querySelector('img') || s.el.querySelector('.floating-icon');
            if (spriteImg) spriteImg.style.transform = s.facingRight ? '' : 'scaleX(-1)';
        });

        // Collision entre sprites — se repoussent
        for (var ai = 0; ai < sprites.length; ai++) {
            for (var bi = ai + 1; bi < sprites.length; bi++) {
                var a = sprites[ai], b = sprites[bi];
                var margin = 6;
                if (a.x + margin < b.x + b.spriteW - margin && a.x + a.spriteW - margin > b.x + margin &&
                    a.y + margin < b.y + b.spriteH - margin && a.y + a.spriteH - margin > b.y + margin) {
                    var dx = (a.x + a.spriteW / 2) - (b.x + b.spriteW / 2);
                    var dy = (a.y + a.spriteH / 2) - (b.y + b.spriteH / 2);
                    var angle = Math.atan2(dy, dx);
                    var push = 3;
                    a.x += Math.cos(angle) * push;
                    a.baseY += Math.sin(angle) * push;
                    b.x -= Math.cos(angle) * push;
                    b.baseY -= Math.sin(angle) * push;
                    // Inverser directions
                    a.vx = Math.cos(angle) * Math.abs(a.vx);
                    b.vx = -Math.cos(angle) * Math.abs(b.vx);
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}
