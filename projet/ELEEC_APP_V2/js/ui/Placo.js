// ========================================
// Placo — Classe de creation de plaques de platre
// Se pose SUR le mur (pas de trou), ne depasse jamais les briques
// ========================================

class Placo {

    constructor(scene, editeur) {
        this.scene = scene;
        this.editeur = editeur;
        this.couleurPlaco = '#F5F5F0';
        this.couleurJoint = '#E0DDD5';
        this.opacitePlaco = 0.99;
        this.epaisseur = 0.013; // 13mm standard BA13
    }

    static modeles() {
        return [
            // Plaques standard
            { id: 'ba13',       nom: 'BA13 standard',    largeur: 1.20, hauteur: 2.50, ep: 0.013, cat: 'standard',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="2" y1="23" x2="22" y2="23" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'ba13-demi',  nom: 'BA13 demi',        largeur: 0.60, hauteur: 2.50, ep: 0.013, cat: 'standard',
              ico: '<svg viewBox="0 0 16 36" width="16" height="36"><rect x="2" y="1" width="12" height="34" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="1.5"/><line x1="2" y1="12" x2="14" y2="12" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="2" y1="23" x2="14" y2="23" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'ba10',       nom: 'BA10 (10mm)',       largeur: 1.20, hauteur: 2.50, ep: 0.010, cat: 'standard',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="3" y="1" width="18" height="34" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="1"/><line x1="3" y1="12" x2="21" y2="12" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="3" y1="23" x2="21" y2="23" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'ba18',       nom: 'BA18 (18mm)',       largeur: 1.20, hauteur: 2.50, ep: 0.018, cat: 'standard',
              ico: '<svg viewBox="0 0 26 36" width="26" height="36"><rect x="1" y="1" width="24" height="34" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="2"/><line x1="1" y1="12" x2="25" y2="12" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="1" y1="23" x2="25" y2="23" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'ba25',       nom: 'BA25 (25mm)',       largeur: 1.20, hauteur: 2.50, ep: 0.025, cat: 'standard',
              ico: '<svg viewBox="0 0 28 36" width="28" height="36"><rect x="1" y="1" width="26" height="34" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="2.5"/><line x1="1" y1="12" x2="27" y2="12" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="1" y1="23" x2="27" y2="23" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            // Plaques speciales
            { id: 'hydro',      nom: 'Hydrofuge (vert)',  largeur: 1.20, hauteur: 2.50, ep: 0.013, cat: 'speciale',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#C8E6C9" stroke="#66BB6A" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#A5D6A7" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="2" y1="23" x2="22" y2="23" stroke="#A5D6A7" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'feu',        nom: 'Coupe-feu (rose)',  largeur: 1.20, hauteur: 2.50, ep: 0.013, cat: 'speciale',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#F8BBD0" stroke="#E91E63" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#F48FB1" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="2" y1="23" x2="22" y2="23" stroke="#F48FB1" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'phonique',   nom: 'Phonique (bleu)',   largeur: 1.20, hauteur: 2.50, ep: 0.013, cat: 'speciale',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#BBDEFB" stroke="#42A5F5" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#90CAF9" stroke-width="0.5" stroke-dasharray="2,2"/><line x1="2" y1="23" x2="22" y2="23" stroke="#90CAF9" stroke-width="0.5" stroke-dasharray="2,2"/></svg>' }
        ];
    }

    // Couleurs par defaut selon le modele
    static couleursParModele(modeleId) {
        switch (modeleId) {
            case 'hydro':       return { placo: '#C8E6C9', joint: '#A5D6A7' };
            case 'feu':         return { placo: '#F8BBD0', joint: '#F48FB1' };
            case 'phonique':    return { placo: '#BBDEFB', joint: '#90CAF9' };
            default:            return { placo: '#F5F5F0', joint: '#E0DDD5' };
        }
    }

    setCouleurs(couleurPlaco, opacitePlaco) {
        this.couleurPlaco = couleurPlaco;
        this.opacitePlaco = opacitePlaco;
    }

    // Creer une plaque de placo sur un mur
    // murParams: les params du mur (pour clamper la taille)
    // worldX, worldZ: position centre sur le mur
    // y: position basse de la plaque
    // largeur, hauteur: dimensions de la plaque
    // angle: angle du mur
    // ep: epaisseur de la plaque
    creer(modeleId, worldX, worldZ, y, largeur, hauteur, angle, ep, murSide, murEpFull, extraBack) {
        var side = murSide || 1; // 1 = devant, -1 = derriere
        this._murEpFull = murEpFull || 0.11;
        this._extraBack = extraBack || 0;
        return this._creerPlaque(worldX, worldZ, y, largeur, hauteur, angle, ep || this.epaisseur, side);
    }

    _creerPlaque(worldX, worldZ, y, largeur, hauteur, angle, ep, side) {
        var group = new THREE.Group();

        // Plaque principale
        var geo = new THREE.BoxGeometry(largeur, hauteur, ep);
        var mat = new THREE.MeshStandardMaterial({
            color: this.couleurPlaco,
            roughness: 0.9,
            transparent: this.opacitePlaco < 0.99,
            opacity: Math.min(this.opacitePlaco, 0.99)
        });
        var plaque = new THREE.Mesh(geo, mat);
        plaque.position.set(0, hauteur / 2, 0);
        group.add(plaque);

        // Joints horizontaux (traits subtils tous les ~60cm)
        var jointEp = 0.003;
        var jointDepth = ep + 0.001;
        var jointMat = new THREE.MeshStandardMaterial({ color: this.couleurJoint, roughness: 0.8 });
        var espacement = 0.60; // joints tous les 60cm
        var nbJoints = Math.floor(hauteur / espacement) - 1;
        for (var i = 1; i <= nbJoints; i++) {
            var jy = espacement * i;
            if (jy >= hauteur - 0.05) break;
            var jGeo = new THREE.BoxGeometry(largeur - 0.02, jointEp, jointDepth);
            var jMesh = new THREE.Mesh(jGeo, jointMat);
            jMesh.position.set(0, jy, 0);
            group.add(jMesh);
        }

        // Cadre bord (liseré subtil sur les 4 bords)
        var bEp = 0.005;
        var bMat = new THREE.MeshStandardMaterial({ color: this.couleurJoint, roughness: 0.8 });
        // Bas
        group.add(this._bordure(largeur, bEp, ep + 0.001, 0, bEp / 2, 0, bMat));
        // Haut
        group.add(this._bordure(largeur, bEp, ep + 0.001, 0, hauteur - bEp / 2, 0, bMat));
        // Gauche
        group.add(this._bordure(bEp, hauteur, ep + 0.001, -largeur / 2 + bEp / 2, hauteur / 2, 0, bMat));
        // Droite
        group.add(this._bordure(bEp, hauteur, ep + 0.001, largeur / 2 - bEp / 2, hauteur / 2, 0, bMat));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle, ep, side, this._murEpFull);
    }

    _bordure(w, h, d, x, y, z, mat) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    _placer(group, worldX, worldZ, y, largeur, hauteur, angle, ep, side, murEpFull) {
        var rad = angle * Math.PI / 180;
        // Les briques vont de z=0 a z=epaisseur en local
        // murEpFull peut inclure des couches supplementaires (laine, placo existant)
        var murEp = murEpFull || 0.11;
        var offset;
        var gap = 0.005; // gap anti z-fighting pour ne jamais toucher le mur
        if (side >= 0) {
            offset = murEp + ep / 2 + gap; // devant : epaisseur complete + couches + placo
        } else {
            // Derriere : extraBack = epaisseur des couches (laine etc.) sur le cote arriere
            var eb = this._extraBack || 0;
            offset = -(eb + ep / 2 + gap);
        }
        var offsetX = -Math.sin(rad) * offset;
        var offsetZ = Math.cos(rad) * offset;

        group.position.set(worldX + offsetX, y, worldZ + offsetZ);
        group.rotation.y = -rad;

        this.scene.add(group);

        // Taguer pour detection au clic
        group.traverse(function(child) {
            child.userData.isPlaco = true;
        });

        // Stocker les infos dans le group
        group.userData.placoInfo = {
            largeur: largeur,
            hauteur: hauteur,
            ep: ep,
            murEpFull: murEp,
            extraBack: this._extraBack || 0,
            side: side,
            angle: angle,
            y: y,
            worldX: worldX,
            worldZ: worldZ
        };

        return group;
    }

    // Changer la couleur d'une plaque existante
    static changerCouleur(group, couleurPlaco, opacitePlaco) {
        group.traverse(function(child) {
            if (child.isMesh) {
                if (child.geometry.parameters && child.geometry.parameters.width > 0.01 &&
                    child.geometry.parameters.height > 0.01) {
                    // C'est la plaque ou une bordure
                    var isJointOrBord = child.geometry.parameters.width < 0.01 ||
                                        child.geometry.parameters.height < 0.01;
                    if (!isJointOrBord) {
                        child.material.color.set(couleurPlaco);
                        child.material.opacity = Math.min(opacitePlaco, 0.99);
                        child.material.transparent = opacitePlaco < 0.99;
                    }
                }
            }
        });
    }

    // Creer un ghost transparent (Group avec joints et bordures)
    static creerGhost(largeur, hauteur, ep, couleur) {
        var group = new THREE.Group();
        var opGhost = 0.45;
        ep = ep || 0.013;

        // Plaque principale
        var geo = new THREE.BoxGeometry(largeur, hauteur, ep + 0.005);
        var mat = new THREE.MeshBasicMaterial({ color: couleur || '#F5F5F0', transparent: true, opacity: opGhost, depthWrite: false, side: THREE.DoubleSide });
        var plaque = new THREE.Mesh(geo, mat);
        plaque.position.set(0, hauteur / 2, 0);
        group.add(plaque);

        // Joints horizontaux tous les 60cm
        var jointMat = new THREE.MeshBasicMaterial({ color: '#C8C0B8', transparent: true, opacity: opGhost + 0.15, depthWrite: false });
        var espacement = 0.60;
        var nbJoints = Math.floor(hauteur / espacement) - 1;
        for (var i = 1; i <= nbJoints; i++) {
            var jy = espacement * i;
            if (jy >= hauteur - 0.05) break;
            var jGeo = new THREE.BoxGeometry(largeur - 0.02, 0.004, ep + 0.008);
            var jMesh = new THREE.Mesh(jGeo, jointMat);
            jMesh.position.set(0, jy, 0);
            group.add(jMesh);
        }

        // Bordures (4 cotes)
        var bEp = 0.006;
        var bMat = new THREE.MeshBasicMaterial({ color: '#A09890', transparent: true, opacity: opGhost + 0.2, depthWrite: false });
        // Bas
        var bBas = new THREE.Mesh(new THREE.BoxGeometry(largeur, bEp, ep + 0.008), bMat);
        bBas.position.set(0, bEp / 2, 0);
        group.add(bBas);
        // Haut
        var bHaut = new THREE.Mesh(new THREE.BoxGeometry(largeur, bEp, ep + 0.008), bMat);
        bHaut.position.set(0, hauteur - bEp / 2, 0);
        group.add(bHaut);
        // Gauche
        var bG = new THREE.Mesh(new THREE.BoxGeometry(bEp, hauteur, ep + 0.008), bMat);
        bG.position.set(-largeur / 2 + bEp / 2, hauteur / 2, 0);
        group.add(bG);
        // Droite
        var bD = new THREE.Mesh(new THREE.BoxGeometry(bEp, hauteur, ep + 0.008), bMat);
        bD.position.set(largeur / 2 - bEp / 2, hauteur / 2, 0);
        group.add(bD);

        // Taguer tous les enfants comme ghost placo
        group.traverse(function(c) { c.userData._isGhostPlaco = true; });
        group.userData._ghostDims = { width: largeur, height: hauteur, ep: ep };
        return group;
    }

    // Mettre a jour les dimensions du ghost (recree les enfants)
    static majGhost(group, largeur, hauteur, ep, couleur) {
        // Supprimer les anciens enfants
        while (group.children.length > 0) {
            var c = group.children[0];
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
            group.remove(c);
        }
        // Recreer avec les nouvelles dimensions
        var tmp = Placo.creerGhost(largeur, hauteur, ep, couleur);
        while (tmp.children.length > 0) {
            var child = tmp.children[0];
            tmp.remove(child);
            group.add(child);
        }
        group.userData._ghostDims = { width: largeur, height: hauteur, ep: ep };
    }

    // Lire les couleurs actuelles d'une plaque
    static lireCouleurs(group) {
        var placo = '#F5F5F0';
        var opacite = 99;
        group.traverse(function(child) {
            if (child.isMesh && child.geometry.parameters) {
                var gp = child.geometry.parameters;
                // La plaque principale est la plus grande
                if (gp.width > 0.1 && gp.height > 0.1) {
                    placo = '#' + child.material.color.getHexString();
                    opacite = Math.round(child.material.opacity * 100);
                }
            }
        });
        return { placo: placo, opacite: opacite };
    }
}
