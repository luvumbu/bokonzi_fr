// ========================================
// Plinthe — Se pose uniquement SUR le placo
// ========================================

class Plinthe {

    constructor(scene) {
        this.scene = scene;
        this.couleur = '#D4C8B0';
    }

    static modeles() {
        return [
            { id: 'platre-8',   nom: 'Platre 8cm',     hauteur: 0.08, ep: 0.010, cat: 'platre',
              ico: '<svg viewBox="0 0 40 12" width="40" height="12"><rect x="1" y="2" width="38" height="9" rx="1" fill="#D4C8B0" stroke="#B8A888" stroke-width="1.5"/><line x1="1" y1="3" x2="39" y2="3" stroke="#C8BCA0" stroke-width="0.8"/></svg>' },
            { id: 'platre-10',  nom: 'Platre 10cm',    hauteur: 0.10, ep: 0.010, cat: 'platre',
              ico: '<svg viewBox="0 0 40 14" width="40" height="14"><rect x="1" y="2" width="38" height="11" rx="1" fill="#D4C8B0" stroke="#B8A888" stroke-width="1.5"/><line x1="1" y1="3" x2="39" y2="3" stroke="#C8BCA0" stroke-width="0.8"/></svg>' },
            { id: 'platre-15',  nom: 'Platre 15cm',    hauteur: 0.15, ep: 0.012, cat: 'platre',
              ico: '<svg viewBox="0 0 40 18" width="40" height="18"><rect x="1" y="2" width="38" height="15" rx="1" fill="#D4C8B0" stroke="#B8A888" stroke-width="1.5"/><line x1="1" y1="4" x2="39" y2="4" stroke="#C8BCA0" stroke-width="0.8"/></svg>' },
            { id: 'pvc-6',      nom: 'PVC 6cm',        hauteur: 0.06, ep: 0.015, cat: 'pvc',
              ico: '<svg viewBox="0 0 40 10" width="40" height="10"><rect x="1" y="2" width="38" height="7" rx="1" fill="#B0B0B0" stroke="#888" stroke-width="1"/></svg>' },
            { id: 'bois-10',    nom: 'Bois 10cm',      hauteur: 0.10, ep: 0.012, cat: 'bois',
              ico: '<svg viewBox="0 0 40 14" width="40" height="14"><rect x="1" y="2" width="38" height="11" rx="1" fill="#A0764E" stroke="#8B6538" stroke-width="1.5"/><line x1="1" y1="4" x2="39" y2="4" stroke="#B8885A" stroke-width="0.5"/></svg>' },
            { id: 'alu-6',      nom: 'Alu brosse 6cm', hauteur: 0.06, ep: 0.008, cat: 'metal',
              ico: '<svg viewBox="0 0 40 10" width="40" height="10"><rect x="1" y="2" width="38" height="7" rx="0.5" fill="#C0C0C8" stroke="#999" stroke-width="1"/></svg>' }
        ];
    }

    static couleursParModele(id) {
        if (id && id.indexOf('pvc') === 0) return '#B0B0B0';
        if (id && id.indexOf('bois') === 0) return '#A0764E';
        if (id && id.indexOf('alu') === 0) return '#C0C0C8';
        return '#D4C8B0';
    }

    setCouleur(c) { this.couleur = c; }

    // Creer la plinthe — se colle sur la face du placo, au sol
    creer(modeleId, placoInfo, placoGroup) {
        var modele = null;
        var modeles = Plinthe.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === modeleId) { modele = modeles[i]; break; }
        }
        if (!modele) modele = modeles[0];

        var pi = placoInfo;
        var largeur = pi.largeur;
        var hauteur = modele.hauteur;
        var ep = modele.ep;
        var angle = pi.angle;
        var rad = angle * Math.PI / 180;
        var side = pi.side || 1;

        var group = new THREE.Group();

        // Plaque
        var geo = new THREE.BoxGeometry(largeur, hauteur, ep);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleur, roughness: 0.7 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, hauteur / 2, 0);
        group.add(mesh);

        // Lisere haut decoratif
        var lGeo = new THREE.BoxGeometry(largeur, 0.004, ep + 0.002);
        var lMat = new THREE.MeshStandardMaterial({ color: this.couleur, roughness: 0.5 });
        var lisere = new THREE.Mesh(lGeo, lMat);
        lisere.position.set(0, hauteur, 0);
        group.add(lisere);

        // Position : collee sur la face exterieure du placo
        // On part de la position reelle du placoGroup (son centre)
        // et on avance de ep_placo/2 + ep_plinthe/2 dans la direction perpendiculaire
        var placoPos = placoGroup.position;
        var decalage = (pi.ep / 2 + ep / 2) * side;
        var perpX = -Math.sin(rad) * decalage;
        var perpZ = Math.cos(rad) * decalage;

        group.position.set(placoPos.x + perpX, 0, placoPos.z + perpZ);
        group.rotation.y = -rad;

        group.traverse(function(c) { c.userData.isPlinthe = true; });
        group.userData.plinthInfo = {
            modeleId: modeleId,
            placoWorldX: pi.worldX, placoWorldZ: pi.worldZ,
            largeur: largeur, hauteur: hauteur,
            angle: angle, ep: ep, side: side,
            murEpFull: pi.murEpFull || 0.11, extraBack: (pi.extraBack || 0) + pi.ep,
            couleur: this.couleur
        };

        this.scene.add(group);
        return group;
    }

    // Ghost pour preview
    creerGhost(modeleId, largeur, hauteur) {
        var modele = null;
        var modeles = Plinthe.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === modeleId) { modele = modeles[i]; break; }
        }
        if (!modele) modele = modeles[0];
        var h = hauteur || modele.hauteur;

        var group = new THREE.Group();
        var geo = new THREE.BoxGeometry(largeur || 1, h, modele.ep);
        var mat = new THREE.MeshBasicMaterial({ color: this.couleur, transparent: true, opacity: 0.5, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, h / 2, 0);
        group.add(mesh);

        var edges = new THREE.EdgesGeometry(geo);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: this.couleur, transparent: true, opacity: 0.7 }));
        line.position.copy(mesh.position);
        group.add(line);

        group.visible = false;
        return group;
    }

    static changerCouleur(group, couleur) {
        group.traverse(function(c) {
            if (c.isMesh && c.material) c.material.color.set(couleur);
        });
    }

    static lireCouleur(group) {
        var col = '#D4C8B0';
        group.traverse(function(c) {
            if (c.isMesh && c.material && c.material.roughness >= 0.7) {
                col = '#' + c.material.color.getHexString();
            }
        });
        return col;
    }
}
