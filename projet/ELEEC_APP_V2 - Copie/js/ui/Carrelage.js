// ========================================
// Carrelage — Se pose SUR le placo (revetement mural)
// Utilise une texture canvas (1 seul mesh) pour la performance
// ========================================

class Carrelage {

    constructor(scene) {
        this.scene = scene;
        this.couleurCarreau = '#E8E0D0';
        this.couleurJoint = '#C8C0B0';
    }

    static modeles() {
        return [
            { id: 'carre-20', nom: '20x20 cm', tW: 0.20, tH: 0.20, ep: 0.008, cat: 'classique',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="15" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/><rect x="19" y="2" width="15" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/><rect x="2" y="19" width="15" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/><rect x="19" y="19" width="15" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/></svg>' },
            { id: 'carre-30', nom: '30x30 cm', tW: 0.30, tH: 0.30, ep: 0.009, cat: 'classique',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="15" height="15" rx="0.5" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="2"/><rect x="19" y="2" width="15" height="15" rx="0.5" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="2"/><rect x="2" y="19" width="15" height="15" rx="0.5" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="2"/><rect x="19" y="19" width="15" height="15" rx="0.5" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="2"/></svg>' },
            { id: 'rect-30x60', nom: '30x60 cm', tW: 0.30, tH: 0.60, ep: 0.009, cat: 'classique',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="15" height="32" rx="0.5" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/><rect x="19" y="2" width="15" height="32" rx="0.5" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1.5"/></svg>' },
            { id: 'rect-10x30', nom: '10x30 cm', tW: 0.10, tH: 0.30, ep: 0.008, cat: 'classique',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="9" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1"/><rect x="13" y="2" width="9" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1"/><rect x="24" y="2" width="10" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1"/><rect x="2" y="19" width="9" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1"/><rect x="13" y="19" width="9" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1"/><rect x="24" y="19" width="10" height="15" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="1"/></svg>' },
            { id: 'metro', nom: 'Metro 7.5x15', tW: 0.15, tH: 0.075, ep: 0.007, cat: 'metro',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="15" height="7" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1"/><rect x="19" y="2" width="15" height="7" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1"/><rect x="10" y="11" width="15" height="7" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1"/><rect x="2" y="20" width="15" height="7" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1"/><rect x="19" y="20" width="15" height="7" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1"/><rect x="10" y="29" width="15" height="7" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1"/></svg>' },
            { id: 'metro-grand', nom: 'Metro 10x20', tW: 0.20, tH: 0.10, ep: 0.007, cat: 'metro',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="15" height="9" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1.2"/><rect x="19" y="2" width="15" height="9" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1.2"/><rect x="10" y="13" width="15" height="9" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1.2"/><rect x="2" y="24" width="15" height="9" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1.2"/><rect x="19" y="24" width="15" height="9" fill="#F0F0F0" stroke="#D0D0D0" stroke-width="1.2"/></svg>' },
            { id: 'mosaique-5', nom: 'Mosaique 5x5', tW: 0.05, tH: 0.05, ep: 0.006, cat: 'mosaique',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="2" width="6" height="6" fill="#87CEEB" stroke="#5BA0C8" stroke-width="0.8"/><rect x="10" y="2" width="6" height="6" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="0.8"/><rect x="18" y="2" width="6" height="6" fill="#87CEEB" stroke="#5BA0C8" stroke-width="0.8"/><rect x="26" y="2" width="6" height="6" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="0.8"/><rect x="2" y="10" width="6" height="6" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="0.8"/><rect x="10" y="10" width="6" height="6" fill="#87CEEB" stroke="#5BA0C8" stroke-width="0.8"/><rect x="18" y="10" width="6" height="6" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="0.8"/><rect x="26" y="10" width="6" height="6" fill="#87CEEB" stroke="#5BA0C8" stroke-width="0.8"/><rect x="2" y="18" width="6" height="6" fill="#87CEEB" stroke="#5BA0C8" stroke-width="0.8"/><rect x="10" y="18" width="6" height="6" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="0.8"/><rect x="18" y="18" width="6" height="6" fill="#87CEEB" stroke="#5BA0C8" stroke-width="0.8"/><rect x="26" y="18" width="6" height="6" fill="#E8E0D0" stroke="#C8C0B0" stroke-width="0.8"/></svg>' }
        ];
    }

    static couleursParModele(id) {
        if (id === 'metro' || id === 'metro-grand') return '#F0F0F0';
        if (id === 'mosaique-5') return '#87CEEB';
        return '#E8E0D0';
    }

    setCouleurs(couleurCarreau, couleurJoint) {
        this.couleurCarreau = couleurCarreau;
        this.couleurJoint = couleurJoint;
    }

    // Genere une texture canvas avec le motif de carrelage
    static _genererTexture(largeur, hauteur, tW, tH, couleurCarreau, couleurJoint, isMetro) {
        // Resolution : 200 pixels par metre (suffisant, pas excessif)
        var ppm = 200;
        var cW = Math.round(largeur * ppm);
        var cH = Math.round(hauteur * ppm);
        // Limiter la taille du canvas pour eviter les problemes memoire
        var maxPx = 2048;
        if (cW > maxPx) { ppm = Math.round(maxPx / largeur); cW = Math.round(largeur * ppm); cH = Math.round(hauteur * ppm); }
        if (cH > maxPx) { ppm = Math.round(maxPx / hauteur); cW = Math.round(largeur * ppm); cH = Math.round(hauteur * ppm); }

        var canvas = document.createElement('canvas');
        canvas.width = cW;
        canvas.height = cH;
        var ctx = canvas.getContext('2d');

        // Fond = couleur joint
        ctx.fillStyle = couleurJoint;
        ctx.fillRect(0, 0, cW, cH);

        // Dessiner les carreaux
        ctx.fillStyle = couleurCarreau;
        var tWpx = tW * ppm;
        var tHpx = tH * ppm;
        var jointPx = Math.max(1, Math.round(0.002 * ppm));

        var nbX = Math.ceil(cW / (tWpx + jointPx)) + 1;
        var nbY = Math.ceil(cH / (tHpx + jointPx)) + 1;

        for (var row = 0; row < nbY; row++) {
            var ox = (isMetro && row % 2 === 1) ? tWpx / 2 : 0;
            for (var col = 0; col < nbX; col++) {
                var px = col * (tWpx + jointPx) + ox;
                // Y inversé : canvas 0 en haut, Three.js 0 en bas
                var py = cH - (row + 1) * (tHpx + jointPx);
                ctx.fillRect(
                    Math.round(px),
                    Math.round(py),
                    Math.round(tWpx),
                    Math.round(tHpx)
                );
            }
        }

        var texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        return texture;
    }

    // Creer le carrelage — 1 seul mesh avec texture canvas
    creer(modeleId, placoInfo, placoGroup) {
        var modele = null;
        var modeles = Carrelage.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === modeleId) { modele = modeles[i]; break; }
        }
        if (!modele) modele = modeles[0];

        var pi = placoInfo;
        var largeur = pi.largeur;
        var hauteur = pi.hauteur;
        var ep = modele.ep;
        var angle = pi.angle;
        var rad = angle * Math.PI / 180;
        var side = pi.side || 1;
        var isMetro = (modeleId === 'metro' || modeleId === 'metro-grand');

        var group = new THREE.Group();

        // Texture canvas avec le motif
        var texture = Carrelage._genererTexture(largeur, hauteur, modele.tW, modele.tH, this.couleurCarreau, this.couleurJoint, isMetro);

        // Un seul mesh plat avec la texture
        var geo = new THREE.BoxGeometry(largeur, hauteur, ep);
        var mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, hauteur / 2, 0);
        group.add(mesh);

        // Position : collee sur la face exterieure du placo
        var placoPos = placoGroup.position;
        var decalage = (pi.ep / 2 + ep / 2) * side;
        var perpX = -Math.sin(rad) * decalage;
        var perpZ = Math.cos(rad) * decalage;

        group.position.set(placoPos.x + perpX, pi.y || 0, placoPos.z + perpZ);
        group.rotation.y = -rad;

        group.traverse(function(c) { c.userData.isCarrelage = true; });
        group.userData.carrelageInfo = {
            modeleId: modeleId,
            placoWorldX: pi.worldX, placoWorldZ: pi.worldZ,
            largeur: largeur, hauteur: hauteur,
            angle: angle, ep: ep, side: side,
            couleurCarreau: this.couleurCarreau,
            couleurJoint: this.couleurJoint
        };

        this.scene.add(group);
        return group;
    }

    // Ghost pour preview — 1 seul mesh transparent
    creerGhost(modeleId, largeur, hauteur) {
        var modele = null;
        var modeles = Carrelage.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === modeleId) { modele = modeles[i]; break; }
        }
        if (!modele) modele = modeles[0];

        var h = hauteur || 2.50;
        var isMetro = (modeleId === 'metro' || modeleId === 'metro-grand');
        var texture = Carrelage._genererTexture(largeur, h, modele.tW, modele.tH, this.couleurCarreau, this.couleurJoint, isMetro);

        var group = new THREE.Group();
        var geo = new THREE.BoxGeometry(largeur, h, modele.ep);
        var mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, h / 2, 0);
        group.add(mesh);

        group.visible = false;
        return group;
    }

    // Changer couleurs = regenerer la texture
    static changerCouleurs(group, couleurCarreau, couleurJoint) {
        var info = group.userData.carrelageInfo;
        if (!info) return;
        var modele = null;
        var modeles = Carrelage.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === info.modeleId) { modele = modeles[i]; break; }
        }
        if (!modele) return;
        var isMetro = (info.modeleId === 'metro' || info.modeleId === 'metro-grand');
        var texture = Carrelage._genererTexture(info.largeur, info.hauteur, modele.tW, modele.tH, couleurCarreau, couleurJoint, isMetro);
        group.traverse(function(c) {
            if (c.isMesh && c.material && c.material.map) {
                c.material.map.dispose();
                c.material.map = texture;
                c.material.needsUpdate = true;
            }
        });
        info.couleurCarreau = couleurCarreau;
        info.couleurJoint = couleurJoint;
    }

    static lireCouleurs(group) {
        var info = group.userData.carrelageInfo;
        if (info) return { carreau: info.couleurCarreau, joint: info.couleurJoint };
        return { carreau: '#E8E0D0', joint: '#C8C0B0' };
    }
}
