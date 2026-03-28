// ========================================
// PapierPeint — Se pose SUR le placo (revetement mural)
// 1 seul mesh avec texture canvas pour la performance
// ========================================

class PapierPeint {

    constructor(scene) {
        this.scene = scene;
        this.couleur1 = '#F5EDE0';
        this.couleur2 = '#E8D8C4';
    }

    static modeles() {
        return [
            // Unis
            { id: 'uni-blanc', nom: 'Uni blanc', motif: 'uni', cat: 'uni',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" rx="2" fill="#F5F5F5" stroke="#DDD" stroke-width="1.5"/></svg>' },
            { id: 'uni-beige', nom: 'Uni beige', motif: 'uni', cat: 'uni',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" rx="2" fill="#F5EDE0" stroke="#D8C8B0" stroke-width="1.5"/></svg>' },
            { id: 'uni-gris', nom: 'Uni gris', motif: 'uni', cat: 'uni',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" rx="2" fill="#D0D0D0" stroke="#AAA" stroke-width="1.5"/></svg>' },
            // Rayures
            { id: 'rayures-v', nom: 'Rayures vert.', motif: 'rayures-v', cat: 'rayures',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#F5EDE0"/><line x1="8" y1="2" x2="8" y2="34" stroke="#E8D8C4" stroke-width="3"/><line x1="18" y1="2" x2="18" y2="34" stroke="#E8D8C4" stroke-width="3"/><line x1="28" y1="2" x2="28" y2="34" stroke="#E8D8C4" stroke-width="3"/></svg>' },
            { id: 'rayures-h', nom: 'Rayures horiz.', motif: 'rayures-h', cat: 'rayures',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#F5EDE0"/><line x1="2" y1="8" x2="34" y2="8" stroke="#E8D8C4" stroke-width="3"/><line x1="2" y1="18" x2="34" y2="18" stroke="#E8D8C4" stroke-width="3"/><line x1="2" y1="28" x2="34" y2="28" stroke="#E8D8C4" stroke-width="3"/></svg>' },
            { id: 'rayures-fines', nom: 'Rayures fines', motif: 'rayures-fines', cat: 'rayures',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#F5EDE0"/><line x1="6" y1="2" x2="6" y2="34" stroke="#E8D8C4" stroke-width="1.5"/><line x1="11" y1="2" x2="11" y2="34" stroke="#E8D8C4" stroke-width="1.5"/><line x1="16" y1="2" x2="16" y2="34" stroke="#E8D8C4" stroke-width="1.5"/><line x1="21" y1="2" x2="21" y2="34" stroke="#E8D8C4" stroke-width="1.5"/><line x1="26" y1="2" x2="26" y2="34" stroke="#E8D8C4" stroke-width="1.5"/><line x1="31" y1="2" x2="31" y2="34" stroke="#E8D8C4" stroke-width="1.5"/></svg>' },
            // Motifs
            { id: 'damier', nom: 'Damier', motif: 'damier', cat: 'motif',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="8" height="8" fill="#F5EDE0"/><rect x="10" y="2" width="8" height="8" fill="#E8D8C4"/><rect x="18" y="2" width="8" height="8" fill="#F5EDE0"/><rect x="26" y="2" width="8" height="8" fill="#E8D8C4"/><rect x="2" y="10" width="8" height="8" fill="#E8D8C4"/><rect x="10" y="10" width="8" height="8" fill="#F5EDE0"/><rect x="18" y="10" width="8" height="8" fill="#E8D8C4"/><rect x="26" y="10" width="8" height="8" fill="#F5EDE0"/><rect x="2" y="18" width="8" height="8" fill="#F5EDE0"/><rect x="10" y="18" width="8" height="8" fill="#E8D8C4"/><rect x="18" y="18" width="8" height="8" fill="#F5EDE0"/><rect x="26" y="18" width="8" height="8" fill="#E8D8C4"/><rect x="2" y="26" width="8" height="8" fill="#E8D8C4"/><rect x="10" y="26" width="8" height="8" fill="#F5EDE0"/><rect x="18" y="26" width="8" height="8" fill="#E8D8C4"/><rect x="26" y="26" width="8" height="8" fill="#F5EDE0"/></svg>' },
            { id: 'losanges', nom: 'Losanges', motif: 'losanges', cat: 'motif',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#F5EDE0"/><polygon points="18,4 28,18 18,32 8,18" fill="none" stroke="#E8D8C4" stroke-width="1.5"/><polygon points="4,10 10,18 4,26" fill="none" stroke="#E8D8C4" stroke-width="1"/><polygon points="32,10 26,18 32,26" fill="none" stroke="#E8D8C4" stroke-width="1"/></svg>' },
            { id: 'chevrons', nom: 'Chevrons', motif: 'chevrons', cat: 'motif',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#F5EDE0"/><polyline points="2,12 18,4 34,12" fill="none" stroke="#E8D8C4" stroke-width="2"/><polyline points="2,22 18,14 34,22" fill="none" stroke="#E8D8C4" stroke-width="2"/><polyline points="2,32 18,24 34,32" fill="none" stroke="#E8D8C4" stroke-width="2"/></svg>' },
            { id: 'briques', nom: 'Briquettes', motif: 'briques', cat: 'motif',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#C8A080"/><rect x="3" y="3" width="14" height="6" rx="0.5" fill="#D4A878" stroke="#B8906A" stroke-width="0.8"/><rect x="19" y="3" width="14" height="6" rx="0.5" fill="#D4A878" stroke="#B8906A" stroke-width="0.8"/><rect x="10" y="11" width="14" height="6" rx="0.5" fill="#D4A878" stroke="#B8906A" stroke-width="0.8"/><rect x="3" y="19" width="14" height="6" rx="0.5" fill="#D4A878" stroke="#B8906A" stroke-width="0.8"/><rect x="19" y="19" width="14" height="6" rx="0.5" fill="#D4A878" stroke="#B8906A" stroke-width="0.8"/><rect x="10" y="27" width="14" height="6" rx="0.5" fill="#D4A878" stroke="#B8906A" stroke-width="0.8"/></svg>' },
            { id: 'pois', nom: 'A pois', motif: 'pois', cat: 'motif',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="32" height="32" fill="#F5EDE0"/><circle cx="10" cy="10" r="3" fill="#E8D8C4"/><circle cx="26" cy="10" r="3" fill="#E8D8C4"/><circle cx="18" cy="18" r="3" fill="#E8D8C4"/><circle cx="10" cy="26" r="3" fill="#E8D8C4"/><circle cx="26" cy="26" r="3" fill="#E8D8C4"/></svg>' }
        ];
    }

    static couleursParModele(id) {
        if (id === 'uni-blanc') return { c1: '#F5F5F5', c2: '#F5F5F5' };
        if (id === 'uni-gris') return { c1: '#D0D0D0', c2: '#D0D0D0' };
        if (id === 'briques') return { c1: '#D4A878', c2: '#B8906A' };
        return { c1: '#F5EDE0', c2: '#E8D8C4' };
    }

    setCouleurs(c1, c2) {
        this.couleur1 = c1;
        this.couleur2 = c2;
    }

    // Dessiner le motif sur un canvas
    static _genererTexture(largeur, hauteur, motif, couleur1, couleur2) {
        var ppm = 200;
        var cW = Math.round(largeur * ppm);
        var cH = Math.round(hauteur * ppm);
        var maxPx = 2048;
        if (cW > maxPx) { ppm = Math.round(maxPx / largeur); cW = Math.round(largeur * ppm); cH = Math.round(hauteur * ppm); }
        if (cH > maxPx) { ppm = Math.round(maxPx / hauteur); cW = Math.round(largeur * ppm); cH = Math.round(hauteur * ppm); }

        var canvas = document.createElement('canvas');
        canvas.width = cW;
        canvas.height = cH;
        var ctx = canvas.getContext('2d');

        // Fond
        ctx.fillStyle = couleur1;
        ctx.fillRect(0, 0, cW, cH);

        ctx.fillStyle = couleur2;
        ctx.strokeStyle = couleur2;

        if (motif === 'uni') {
            // rien de plus

        } else if (motif === 'rayures-v') {
            var bande = Math.round(0.08 * ppm); // 8cm
            var gap = Math.round(0.08 * ppm);
            for (var x = 0; x < cW; x += bande + gap) {
                ctx.fillRect(x, 0, bande, cH);
            }

        } else if (motif === 'rayures-h') {
            var bande = Math.round(0.08 * ppm);
            var gap = Math.round(0.08 * ppm);
            for (var y = 0; y < cH; y += bande + gap) {
                ctx.fillRect(0, y, cW, bande);
            }

        } else if (motif === 'rayures-fines') {
            var step = Math.round(0.04 * ppm); // 4cm
            ctx.lineWidth = Math.max(1, Math.round(0.005 * ppm));
            for (var x = 0; x < cW; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, cH);
                ctx.stroke();
            }

        } else if (motif === 'damier') {
            var cell = Math.round(0.10 * ppm); // 10cm
            for (var row = 0; row < Math.ceil(cH / cell); row++) {
                for (var col = 0; col < Math.ceil(cW / cell); col++) {
                    if ((row + col) % 2 === 1) {
                        ctx.fillRect(col * cell, row * cell, cell, cell);
                    }
                }
            }

        } else if (motif === 'losanges') {
            var dW = Math.round(0.15 * ppm); // 15cm
            var dH = Math.round(0.20 * ppm); // 20cm
            ctx.lineWidth = Math.max(1, Math.round(0.004 * ppm));
            for (var row = 0; row < Math.ceil(cH / dH) + 1; row++) {
                var ox = (row % 2 === 1) ? dW / 2 : 0;
                for (var col = -1; col < Math.ceil(cW / dW) + 1; col++) {
                    var cx = col * dW + dW / 2 + ox;
                    var cy = row * dH;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - dH / 2);
                    ctx.lineTo(cx + dW / 2, cy);
                    ctx.lineTo(cx, cy + dH / 2);
                    ctx.lineTo(cx - dW / 2, cy);
                    ctx.closePath();
                    ctx.stroke();
                }
            }

        } else if (motif === 'chevrons') {
            var chevH = Math.round(0.10 * ppm);
            ctx.lineWidth = Math.max(2, Math.round(0.006 * ppm));
            for (var y = 0; y < cH + chevH; y += chevH) {
                ctx.beginPath();
                for (var x = 0; x < cW + chevH; x += chevH) {
                    if (x === 0) ctx.moveTo(x, y);
                    ctx.lineTo(x + chevH / 2, y - chevH / 2);
                    ctx.lineTo(x + chevH, y);
                }
                ctx.stroke();
            }

        } else if (motif === 'briques') {
            var bW = Math.round(0.20 * ppm); // 20cm
            var bH = Math.round(0.08 * ppm); // 8cm
            var joint = Math.max(1, Math.round(0.003 * ppm));
            // fond = couleur joint
            ctx.fillStyle = couleur2;
            ctx.fillRect(0, 0, cW, cH);
            ctx.fillStyle = couleur1;
            for (var row = 0; row < Math.ceil(cH / (bH + joint)) + 1; row++) {
                var ox = (row % 2 === 1) ? bW / 2 : 0;
                var py = row * (bH + joint);
                for (var col = -1; col < Math.ceil(cW / (bW + joint)) + 1; col++) {
                    var px = col * (bW + joint) + ox;
                    ctx.fillRect(Math.round(px), Math.round(py), Math.round(bW), Math.round(bH));
                }
            }

        } else if (motif === 'pois') {
            var r = Math.round(0.02 * ppm); // 2cm rayon
            var step = Math.round(0.10 * ppm); // 10cm espacement
            for (var row = 0; row < Math.ceil(cH / step) + 1; row++) {
                var ox = (row % 2 === 1) ? step / 2 : 0;
                for (var col = 0; col < Math.ceil(cW / step) + 1; col++) {
                    ctx.beginPath();
                    ctx.arc(col * step + ox, row * step, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        var texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    // Trouver le motif d'un modele
    static _motifDuModele(modeleId) {
        var modeles = PapierPeint.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === modeleId) return modeles[i].motif;
        }
        return 'uni';
    }

    creer(modeleId, placoInfo, placoGroup) {
        var pi = placoInfo;
        var largeur = pi.largeur;
        var hauteur = pi.hauteur;
        var ep = 0.001; // papier peint = tres fin
        var angle = pi.angle;
        var rad = angle * Math.PI / 180;
        var side = pi.side || 1;
        var motif = PapierPeint._motifDuModele(modeleId);

        var group = new THREE.Group();

        var texture = PapierPeint._genererTexture(largeur, hauteur, motif, this.couleur1, this.couleur2);
        var geo = new THREE.PlaneGeometry(largeur, hauteur);
        var mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, hauteur / 2, 0);
        group.add(mesh);

        // Colle sur la face du placo
        var placoPos = placoGroup.position;
        var decalage = (pi.ep / 2 + ep) * side;
        var perpX = -Math.sin(rad) * decalage;
        var perpZ = Math.cos(rad) * decalage;

        group.position.set(placoPos.x + perpX, pi.y || 0, placoPos.z + perpZ);
        group.rotation.y = -rad;

        group.traverse(function(c) { c.userData.isPapierPeint = true; });
        group.userData.papierPeintInfo = {
            modeleId: modeleId,
            placoWorldX: pi.worldX, placoWorldZ: pi.worldZ,
            largeur: largeur, hauteur: hauteur,
            angle: angle, side: side,
            couleur1: this.couleur1,
            couleur2: this.couleur2
        };

        this.scene.add(group);
        return group;
    }

    creerGhost(modeleId, largeur, hauteur) {
        var h = hauteur || 2.50;
        var motif = PapierPeint._motifDuModele(modeleId);
        var texture = PapierPeint._genererTexture(largeur, h, motif, this.couleur1, this.couleur2);

        var group = new THREE.Group();
        var geo = new THREE.PlaneGeometry(largeur, h);
        var mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, h / 2, 0);
        group.add(mesh);

        group.visible = false;
        return group;
    }

    static changerCouleurs(group, couleur1, couleur2) {
        var info = group.userData.papierPeintInfo;
        if (!info) return;
        var motif = PapierPeint._motifDuModele(info.modeleId);
        var texture = PapierPeint._genererTexture(info.largeur, info.hauteur, motif, couleur1, couleur2);
        group.traverse(function(c) {
            if (c.isMesh && c.material && c.material.map) {
                c.material.map.dispose();
                c.material.map = texture;
                c.material.needsUpdate = true;
            }
        });
        info.couleur1 = couleur1;
        info.couleur2 = couleur2;
    }

    static lireCouleurs(group) {
        var info = group.userData.papierPeintInfo;
        if (info) return { couleur1: info.couleur1, couleur2: info.couleur2 };
        return { couleur1: '#F5EDE0', couleur2: '#E8D8C4' };
    }
}
