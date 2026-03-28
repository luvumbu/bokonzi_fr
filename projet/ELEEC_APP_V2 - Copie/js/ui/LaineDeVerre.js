// ========================================
// LaineDeVerre — Classe de creation de laine de verre (isolant)
// Se pose SUR le mur (pas de trou), ne depasse jamais les briques
// ========================================

class LaineDeVerre {

    constructor(scene, editeur) {
        this.scene = scene;
        this.editeur = editeur;
        this.couleurLaine = '#F2D544';
        this.opaciteLaine = 0.99;
    }

    static modeles() {
        return [
            // Rouleaux classiques
            { id: 'gr32-100', nom: 'GR 32 — 100mm', largeur: 1.20, hauteur: 2.50, ep: 0.100, cat: 'rouleau',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#F2D544" stroke="#D4A017" stroke-width="1.5"/><line x1="2" y1="6" x2="22" y2="6" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="11" x2="22" y2="11" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="16" x2="22" y2="16" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="21" x2="22" y2="21" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="26" x2="22" y2="26" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="31" x2="22" y2="31" stroke="#E8C840" stroke-width="0.8"/></svg>' },
            { id: 'gr32-120', nom: 'GR 32 — 120mm', largeur: 1.20, hauteur: 2.50, ep: 0.120, cat: 'rouleau',
              ico: '<svg viewBox="0 0 26 36" width="26" height="36"><rect x="1" y="1" width="24" height="34" rx="1" fill="#F2D544" stroke="#D4A017" stroke-width="2"/><line x1="1" y1="6" x2="25" y2="6" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="11" x2="25" y2="11" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="16" x2="25" y2="16" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="21" x2="25" y2="21" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="26" x2="25" y2="26" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="31" x2="25" y2="31" stroke="#E8C840" stroke-width="0.8"/></svg>' },
            { id: 'gr32-200', nom: 'GR 32 — 200mm', largeur: 1.20, hauteur: 2.50, ep: 0.200, cat: 'rouleau',
              ico: '<svg viewBox="0 0 30 36" width="30" height="36"><rect x="1" y="1" width="28" height="34" rx="1" fill="#F2D544" stroke="#D4A017" stroke-width="2.5"/><line x1="1" y1="6" x2="29" y2="6" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="11" x2="29" y2="11" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="16" x2="29" y2="16" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="21" x2="29" y2="21" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="26" x2="29" y2="26" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="31" x2="29" y2="31" stroke="#E8C840" stroke-width="0.8"/></svg>' },
            { id: 'gr32-240', nom: 'GR 32 — 240mm', largeur: 1.20, hauteur: 2.50, ep: 0.240, cat: 'rouleau',
              ico: '<svg viewBox="0 0 32 36" width="32" height="36"><rect x="1" y="1" width="30" height="34" rx="1" fill="#F2D544" stroke="#D4A017" stroke-width="3"/><line x1="1" y1="6" x2="31" y2="6" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="11" x2="31" y2="11" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="16" x2="31" y2="16" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="21" x2="31" y2="21" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="26" x2="31" y2="26" stroke="#E8C840" stroke-width="0.8"/><line x1="1" y1="31" x2="31" y2="31" stroke="#E8C840" stroke-width="0.8"/></svg>' },
            // Panneaux
            { id: 'semi-rigide', nom: 'Semi-rigide 75mm', largeur: 0.60, hauteur: 1.35, ep: 0.075, cat: 'panneau',
              ico: '<svg viewBox="0 0 20 36" width="20" height="36"><rect x="2" y="1" width="16" height="34" rx="1" fill="#E6C83A" stroke="#C49A00" stroke-width="1.5"/><line x1="2" y1="9" x2="18" y2="9" stroke="#D4B030" stroke-width="0.8"/><line x1="2" y1="17" x2="18" y2="17" stroke="#D4B030" stroke-width="0.8"/><line x1="2" y1="25" x2="18" y2="25" stroke="#D4B030" stroke-width="0.8"/></svg>' },
            { id: 'rigide', nom: 'Rigide 45mm', largeur: 0.60, hauteur: 1.35, ep: 0.045, cat: 'panneau',
              ico: '<svg viewBox="0 0 18 36" width="18" height="36"><rect x="2" y="1" width="14" height="34" rx="1" fill="#DAB832" stroke="#B8960A" stroke-width="1.5"/><line x1="2" y1="9" x2="16" y2="9" stroke="#C8A828" stroke-width="0.8"/><line x1="2" y1="17" x2="16" y2="17" stroke="#C8A828" stroke-width="0.8"/><line x1="2" y1="25" x2="16" y2="25" stroke="#C8A828" stroke-width="0.8"/></svg>' },
            { id: 'acoustique', nom: 'Acoustique 45mm', largeur: 0.60, hauteur: 1.35, ep: 0.045, cat: 'panneau',
              ico: '<svg viewBox="0 0 18 36" width="18" height="36"><rect x="2" y="1" width="14" height="34" rx="1" fill="#B8D830" stroke="#8AAA10" stroke-width="1.5"/><line x1="2" y1="9" x2="16" y2="9" stroke="#A0C028" stroke-width="0.8"/><line x1="2" y1="17" x2="16" y2="17" stroke="#A0C028" stroke-width="0.8"/><line x1="2" y1="25" x2="16" y2="25" stroke="#A0C028" stroke-width="0.8"/></svg>' },
            { id: 'souple-60', nom: 'Souple 60mm', largeur: 1.20, hauteur: 2.50, ep: 0.060, cat: 'rouleau',
              ico: '<svg viewBox="0 0 22 36" width="22" height="36"><rect x="2" y="1" width="18" height="34" rx="1" fill="#F5DC58" stroke="#D4A017" stroke-width="1"/><line x1="2" y1="6" x2="20" y2="6" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="11" x2="20" y2="11" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="16" x2="20" y2="16" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="21" x2="20" y2="21" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="26" x2="20" y2="26" stroke="#E8C840" stroke-width="0.8"/><line x1="2" y1="31" x2="20" y2="31" stroke="#E8C840" stroke-width="0.8"/></svg>' }
        ];
    }

    static couleursParModele(modeleId) {
        switch (modeleId) {
            case 'acoustique': return { laine: '#B8D830' };
            default:           return { laine: '#F2D544' };
        }
    }

    setCouleurs(couleurLaine, opaciteLaine) {
        this.couleurLaine = couleurLaine;
        this.opaciteLaine = opaciteLaine;
    }

    // Creer une plaque de laine de verre sur un mur
    creer(modeleId, worldX, worldZ, y, largeur, hauteur, angle, ep, murSide, murEpFull) {
        var side = murSide || 1;
        this._murEpFull = murEpFull || 0.11;
        return this._creerPlaque(worldX, worldZ, y, largeur, hauteur, angle, ep || 0.100, side);
    }

    _creerPlaque(worldX, worldZ, y, largeur, hauteur, angle, ep, side) {
        var group = new THREE.Group();

        // Bloc principal (laine fibreuse)
        var geo = new THREE.BoxGeometry(largeur, hauteur, ep);
        var mat = new THREE.MeshStandardMaterial({
            color: this.couleurLaine,
            roughness: 1.0,
            transparent: this.opaciteLaine < 0.99,
            opacity: Math.min(this.opaciteLaine, 0.99)
        });
        var bloc = new THREE.Mesh(geo, mat);
        bloc.position.set(0, hauteur / 2, 0);
        group.add(bloc);

        // Lignes fibreuses horizontales (texture visuelle)
        var fibreMat = new THREE.MeshStandardMaterial({ color: this._assombrir(this.couleurLaine, 0.85), roughness: 1.0 });
        var espacement = 0.08; // fibres tous les 8cm
        var nbFibres = Math.floor(hauteur / espacement);
        for (var i = 1; i < nbFibres; i++) {
            var fy = espacement * i;
            if (fy >= hauteur - 0.02) break;
            var fGeo = new THREE.BoxGeometry(largeur - 0.01, 0.003, ep + 0.001);
            var fMesh = new THREE.Mesh(fGeo, fibreMat);
            fMesh.position.set(0, fy, 0);
            group.add(fMesh);
        }

        // Bordures (kraft / papier)
        var bEp = 0.008;
        var bMat = new THREE.MeshStandardMaterial({ color: '#C49A00', roughness: 0.7 });
        // Bas
        group.add(this._bordure(largeur, bEp, ep + 0.002, 0, bEp / 2, 0, bMat));
        // Haut
        group.add(this._bordure(largeur, bEp, ep + 0.002, 0, hauteur - bEp / 2, 0, bMat));
        // Gauche
        group.add(this._bordure(bEp, hauteur, ep + 0.002, -largeur / 2 + bEp / 2, hauteur / 2, 0, bMat));
        // Droite
        group.add(this._bordure(bEp, hauteur, ep + 0.002, largeur / 2 - bEp / 2, hauteur / 2, 0, bMat));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle, ep, side, this._murEpFull);
    }

    _bordure(w, h, d, x, y, z, mat) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    _assombrir(hex, factor) {
        var r = parseInt(hex.substr(1, 2), 16);
        var g = parseInt(hex.substr(3, 2), 16);
        var b = parseInt(hex.substr(5, 2), 16);
        r = Math.round(r * factor); g = Math.round(g * factor); b = Math.round(b * factor);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    _placer(group, worldX, worldZ, y, largeur, hauteur, angle, ep, side, murEpFull) {
        var rad = angle * Math.PI / 180;
        var murEp = murEpFull || 0.11;
        var offset;
        if (side >= 0) {
            offset = murEp + ep / 2 + 0.001;
        } else {
            offset = -(ep / 2 + 0.001);
        }
        var offsetX = -Math.sin(rad) * offset;
        var offsetZ = Math.cos(rad) * offset;

        group.position.set(worldX + offsetX, y, worldZ + offsetZ);
        group.rotation.y = -rad;

        this.scene.add(group);

        // Taguer pour detection au clic + polygonOffset positif (mur passe devant)
        group.traverse(function(child) {
            child.userData.isLaine = true;
            if (child.material) {
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                for (var m = 0; m < mats.length; m++) {
                    mats[m].polygonOffset = true;
                    mats[m].polygonOffsetFactor = 1;
                    mats[m].polygonOffsetUnits = 1;
                }
            }
        });

        // Stocker les infos
        group.userData.laineInfo = {
            largeur: largeur,
            hauteur: hauteur,
            ep: ep,
            murEpFull: murEp,
            side: side,
            angle: angle,
            y: y,
            worldX: worldX,
            worldZ: worldZ
        };

        return group;
    }

    // Ghost transparent (Group avec fibres et bordures)
    static creerGhost(largeur, hauteur, ep, couleur) {
        var group = new THREE.Group();
        var opGhost = 0.45;
        ep = ep || 0.100;

        // Bloc principal
        var geo = new THREE.BoxGeometry(largeur, hauteur, ep + 0.005);
        var mat = new THREE.MeshBasicMaterial({ color: couleur || '#F2D544', transparent: true, opacity: opGhost, depthWrite: false, side: THREE.DoubleSide });
        var bloc = new THREE.Mesh(geo, mat);
        bloc.position.set(0, hauteur / 2, 0);
        group.add(bloc);

        // Fibres horizontales
        var fibreMat = new THREE.MeshBasicMaterial({ color: '#C49A00', transparent: true, opacity: opGhost + 0.15, depthWrite: false });
        var espacement = 0.08;
        var nbFibres = Math.floor(hauteur / espacement);
        for (var i = 1; i < nbFibres; i++) {
            var fy = espacement * i;
            if (fy >= hauteur - 0.02) break;
            var fGeo = new THREE.BoxGeometry(largeur - 0.01, 0.004, ep + 0.008);
            var fMesh = new THREE.Mesh(fGeo, fibreMat);
            fMesh.position.set(0, fy, 0);
            group.add(fMesh);
        }

        // Bordures kraft
        var bEp = 0.008;
        var bMat = new THREE.MeshBasicMaterial({ color: '#A07800', transparent: true, opacity: opGhost + 0.2, depthWrite: false });
        var bBas = new THREE.Mesh(new THREE.BoxGeometry(largeur, bEp, ep + 0.008), bMat);
        bBas.position.set(0, bEp / 2, 0); group.add(bBas);
        var bHaut = new THREE.Mesh(new THREE.BoxGeometry(largeur, bEp, ep + 0.008), bMat);
        bHaut.position.set(0, hauteur - bEp / 2, 0); group.add(bHaut);
        var bG = new THREE.Mesh(new THREE.BoxGeometry(bEp, hauteur, ep + 0.008), bMat);
        bG.position.set(-largeur / 2 + bEp / 2, hauteur / 2, 0); group.add(bG);
        var bD = new THREE.Mesh(new THREE.BoxGeometry(bEp, hauteur, ep + 0.008), bMat);
        bD.position.set(largeur / 2 - bEp / 2, hauteur / 2, 0); group.add(bD);

        group.traverse(function(c) { c.userData._isGhostLaine = true; });
        group.userData._ghostDims = { width: largeur, height: hauteur, ep: ep };
        return group;
    }

    static majGhost(group, largeur, hauteur, ep, couleur) {
        while (group.children.length > 0) {
            var c = group.children[0];
            if (c.geometry) c.geometry.dispose();
            if (c.material) c.material.dispose();
            group.remove(c);
        }
        var tmp = LaineDeVerre.creerGhost(largeur, hauteur, ep, couleur);
        while (tmp.children.length > 0) {
            var child = tmp.children[0];
            tmp.remove(child);
            group.add(child);
        }
        group.userData._ghostDims = { width: largeur, height: hauteur, ep: ep };
    }

    static changerCouleur(group, couleurLaine, opaciteLaine) {
        group.traverse(function(child) {
            if (child.isMesh && child.geometry.parameters) {
                var gp = child.geometry.parameters;
                if (gp.width > 0.01 && gp.height > 0.01) {
                    var isEdge = gp.width < 0.01 || gp.height < 0.01;
                    if (!isEdge) {
                        child.material.color.set(couleurLaine);
                        child.material.opacity = Math.min(opaciteLaine, 0.99);
                        child.material.transparent = opaciteLaine < 0.99;
                    }
                }
            }
        });
    }

    static lireCouleurs(group) {
        var laine = '#F2D544';
        var opacite = 99;
        group.traverse(function(child) {
            if (child.isMesh && child.geometry.parameters) {
                var gp = child.geometry.parameters;
                if (gp.width > 0.1 && gp.height > 0.1) {
                    laine = '#' + child.material.color.getHexString();
                    opacite = Math.round(child.material.opacity * 100);
                }
            }
        });
        return { laine: laine, opacite: opacite };
    }
}
