// ========================================
// Escalier — Classe de creation d'escaliers
// ========================================

class Escalier {

    constructor(scene) {
        this.scene = scene;
        this.couleurMarche = '#A0522D';
        this.couleurContremarche = '#8B4513';
        this.couleurRampe = '#666666';
        this.couleurLimon = '#5C4033';
    }

    static modeles() {
        return [
            // Escaliers droits
            { id: 'droit-13', nom: 'Droit 13 marches', largeur: 0.90, longueur: 3.50, hauteur: 2.50, nbMarches: 13, cat: 'droit',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><path d="M4 32 L4 28 L8 28 L8 24 L12 24 L12 20 L16 20 L16 16 L20 16 L20 12 L24 12 L24 8 L28 8 L28 4 L32 4 L32 32 Z" fill="#A0522D" stroke="#8B4513" stroke-width="1"/><line x1="28" y1="4" x2="28" y2="32" stroke="#666" stroke-width="1.5"/></svg>' },
            { id: 'droit-15', nom: 'Droit 15 marches', largeur: 0.90, longueur: 4.00, hauteur: 2.80, nbMarches: 15, cat: 'droit',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><path d="M4 32 L4 29 L6 29 L6 26 L8 26 L8 23 L10 23 L10 20 L12 20 L12 17 L14 17 L14 14 L16 14 L16 11 L18 11 L18 8 L20 8 L20 5 L22 5 L22 32 Z" fill="#A0522D" stroke="#8B4513" stroke-width="1"/><line x1="20" y1="5" x2="20" y2="32" stroke="#666" stroke-width="1.5"/></svg>' },
            { id: 'droit-etroit', nom: 'Droit etroit', largeur: 0.70, longueur: 3.50, hauteur: 2.50, nbMarches: 13, cat: 'droit',
              ico: '<svg viewBox="0 0 30 36" width="30" height="36"><path d="M4 32 L4 28 L7 28 L7 24 L10 24 L10 20 L13 20 L13 16 L16 16 L16 12 L19 12 L19 8 L22 8 L22 4 L26 4 L26 32 Z" fill="#A0522D" stroke="#8B4513" stroke-width="1"/><line x1="22" y1="4" x2="22" y2="32" stroke="#666" stroke-width="1.2"/></svg>' },
            { id: 'droit-large', nom: 'Droit large', largeur: 1.20, longueur: 3.50, hauteur: 2.50, nbMarches: 13, cat: 'droit',
              ico: '<svg viewBox="0 0 40 36" width="40" height="36"><path d="M4 32 L4 28 L8 28 L8 24 L12 24 L12 20 L16 20 L16 16 L20 16 L20 12 L24 12 L24 8 L28 8 L28 4 L36 4 L36 32 Z" fill="#A0522D" stroke="#8B4513" stroke-width="1"/><line x1="32" y1="4" x2="32" y2="32" stroke="#666" stroke-width="1.5"/></svg>' },
            // Escaliers quart-tournant
            { id: 'quart-droite', nom: '1/4 tournant droite', largeur: 0.90, longueur: 3.00, hauteur: 2.50, nbMarches: 13, cat: 'tournant',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><path d="M4 32 L4 28 L8 28 L8 24 L12 24 L12 20 L16 20 L16 16 L20 16 L20 12 L24 12 L24 8" fill="none" stroke="#A0522D" stroke-width="2"/><path d="M24 8 L28 8 L28 12 L32 12 L32 16 L32 20" fill="none" stroke="#A0522D" stroke-width="2"/><path d="M22 6 Q30 6 30 14" fill="none" stroke="#666" stroke-width="1.5" stroke-dasharray="2,2"/></svg>' },
            { id: 'quart-gauche', nom: '1/4 tournant gauche', largeur: 0.90, longueur: 3.00, hauteur: 2.50, nbMarches: 13, cat: 'tournant',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><path d="M32 32 L32 28 L28 28 L28 24 L24 24 L24 20 L20 20 L20 16 L16 16 L16 12 L12 12 L12 8" fill="none" stroke="#A0522D" stroke-width="2"/><path d="M12 8 L8 8 L8 12 L4 12 L4 16 L4 20" fill="none" stroke="#A0522D" stroke-width="2"/><path d="M14 6 Q6 6 6 14" fill="none" stroke="#666" stroke-width="1.5" stroke-dasharray="2,2"/></svg>' },
            // Escalier en U (demi-tournant)
            { id: 'demi-tournant', nom: 'Demi-tournant (U)', largeur: 1.80, longueur: 2.50, hauteur: 2.50, nbMarches: 14, cat: 'tournant',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="4" y="4" width="12" height="28" fill="none" stroke="#A0522D" stroke-width="1.5"/><rect x="20" y="4" width="12" height="28" fill="none" stroke="#A0522D" stroke-width="1.5"/><path d="M16 32 L16 28 Q16 20 24 20" fill="none" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="8" x2="16" y2="8" stroke="#8B4513" stroke-width="0.6"/><line x1="4" y1="12" x2="16" y2="12" stroke="#8B4513" stroke-width="0.6"/><line x1="4" y1="16" x2="16" y2="16" stroke="#8B4513" stroke-width="0.6"/><line x1="4" y1="20" x2="16" y2="20" stroke="#8B4513" stroke-width="0.6"/><line x1="4" y1="24" x2="16" y2="24" stroke="#8B4513" stroke-width="0.6"/><line x1="4" y1="28" x2="16" y2="28" stroke="#8B4513" stroke-width="0.6"/><line x1="20" y1="8" x2="32" y2="8" stroke="#8B4513" stroke-width="0.6"/><line x1="20" y1="12" x2="32" y2="12" stroke="#8B4513" stroke-width="0.6"/><line x1="20" y1="16" x2="32" y2="16" stroke="#8B4513" stroke-width="0.6"/><line x1="20" y1="20" x2="32" y2="20" stroke="#8B4513" stroke-width="0.6"/><line x1="20" y1="24" x2="32" y2="24" stroke="#8B4513" stroke-width="0.6"/><line x1="20" y1="28" x2="32" y2="28" stroke="#8B4513" stroke-width="0.6"/></svg>' },
            // Echelle de meunier
            { id: 'meunier', nom: 'Echelle de meunier', largeur: 0.60, longueur: 1.50, hauteur: 2.50, nbMarches: 10, cat: 'special',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><line x1="4" y1="4" x2="4" y2="34" stroke="#5C4033" stroke-width="2"/><line x1="20" y1="4" x2="20" y2="34" stroke="#5C4033" stroke-width="2"/><line x1="4" y1="7" x2="20" y2="7" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="10" x2="20" y2="10" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="13" x2="20" y2="13" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="16" x2="20" y2="16" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="19" x2="20" y2="19" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="22" x2="20" y2="22" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="25" x2="20" y2="25" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="28" x2="20" y2="28" stroke="#A0522D" stroke-width="1.5"/><line x1="4" y1="31" x2="20" y2="31" stroke="#A0522D" stroke-width="1.5"/></svg>' }
        ];
    }

    setCouleurs(couleurMarche, couleurRampe) {
        this.couleurMarche = couleurMarche;
        this.couleurRampe = couleurRampe;
    }

    // overrides = { largeur, longueur, hauteur, nbMarches } (optionnel)
    creer(modeleId, worldX, worldZ, angle, overrides) {
        this._lastModeleId = modeleId;
        var mod = null;
        var modeles = Escalier.modeles();
        for (var i = 0; i < modeles.length; i++) {
            if (modeles[i].id === modeleId) { mod = modeles[i]; break; }
        }
        if (!mod) mod = modeles[0];

        // Appliquer les overrides utilisateur
        if (overrides) {
            mod = JSON.parse(JSON.stringify(mod));
            if (overrides.largeur !== undefined) mod.largeur = overrides.largeur;
            if (overrides.longueur !== undefined) mod.longueur = overrides.longueur;
            if (overrides.hauteur !== undefined) mod.hauteur = overrides.hauteur;
            if (overrides.nbMarches !== undefined) mod.nbMarches = overrides.nbMarches;
        }

        switch (modeleId) {
            case 'quart-droite':  return this._creerQuartTournant(worldX, worldZ, angle, mod, 1);
            case 'quart-gauche':  return this._creerQuartTournant(worldX, worldZ, angle, mod, -1);
            case 'demi-tournant': return this._creerDemiTournant(worldX, worldZ, angle, mod);
            case 'meunier':       return this._creerMeunier(worldX, worldZ, angle, mod);
            default:              return this._creerDroit(worldX, worldZ, angle, mod);
        }
    }

    creerGhost() {
        var geo = new THREE.BoxGeometry(0.90, 0.10, 0.25);
        var mat = new THREE.MeshBasicMaterial({ color: '#A0522D', transparent: true, opacity: 0.5, depthWrite: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        return mesh;
    }

    // Escalier droit
    _creerDroit(worldX, worldZ, angle, mod) {
        var group = new THREE.Group();
        var n = mod.nbMarches;
        var marchH = mod.hauteur / n;
        var giron = mod.longueur / n;
        var larg = mod.largeur;
        var ep = 0.035;

        for (var i = 0; i < n; i++) {
            // Marche (giron)
            var marche = this._box(larg, ep, giron, 0, marchH * (i + 1), giron * i + giron / 2);
            marche.userData.isMarche = true;
            group.add(marche);

            // Contremarche
            var cm = this._box(larg, marchH - ep, 0.02, 0, marchH * i + (marchH - ep) / 2 + ep, giron * i + 0.01);
            cm.userData.isContremarche = true;
            group.add(cm);
        }

        // Limons (2 cotes)
        this._ajouterLimons(group, larg, mod.hauteur, mod.longueur, n);

        // Rampe (1 cote droit)
        this._ajouterRampe(group, larg / 2, mod.hauteur, mod.longueur, n);

        return this._placer(group, worldX, worldZ, angle, mod);
    }

    // Escalier echelle de meunier (pente raide, pas de contremarche)
    _creerMeunier(worldX, worldZ, angle, mod) {
        var group = new THREE.Group();
        var n = mod.nbMarches;
        var marchH = mod.hauteur / n;
        var giron = mod.longueur / n;
        var larg = mod.largeur;
        var ep = 0.03;

        for (var i = 0; i < n; i++) {
            var marche = this._box(larg, ep, giron * 0.8, 0, marchH * (i + 1), giron * i + giron / 2);
            marche.userData.isMarche = true;
            group.add(marche);
        }

        // 2 limons lateraux (simples montants)
        var limonH = mod.hauteur + 0.90;
        var limonAngle = Math.atan2(mod.hauteur, mod.longueur);
        var limonLen = Math.sqrt(mod.hauteur * mod.hauteur + mod.longueur * mod.longueur) + 0.30;
        for (var side = -1; side <= 1; side += 2) {
            var limon = this._box(0.06, 0.06, limonLen, side * larg / 2, mod.hauteur / 2, mod.longueur / 2);
            limon.rotation.x = -limonAngle;
            limon.position.y = mod.hauteur / 2 + 0.15;
            limon.userData.isLimon = true;
            group.add(limon);
        }

        return this._placer(group, worldX, worldZ, angle, mod);
    }

    // Quart-tournant (direction = 1 pour droite, -1 pour gauche)
    _creerQuartTournant(worldX, worldZ, angle, mod, direction) {
        var group = new THREE.Group();
        var n = mod.nbMarches;
        var marchH = mod.hauteur / n;
        var larg = mod.largeur;
        var ep = 0.035;

        // Partie droite : 9 marches
        var nDroit = 9;
        var gironDroit = (mod.longueur - larg) / nDroit;
        for (var i = 0; i < nDroit; i++) {
            var marche = this._box(larg, ep, gironDroit, 0, marchH * (i + 1), gironDroit * i + gironDroit / 2);
            marche.userData.isMarche = true;
            group.add(marche);

            var cm = this._box(larg, marchH - ep, 0.02, 0, marchH * i + (marchH - ep) / 2 + ep, gironDroit * i + 0.01);
            cm.userData.isContremarche = true;
            group.add(cm);
        }

        // Palier tournant : 4 marches rayonnantes
        var palierY = marchH * nDroit;
        var palierZ = gironDroit * nDroit;
        var cornerX = direction * larg / 2;
        var nTournant = n - nDroit;
        var angleStep = (Math.PI / 2) / nTournant;

        for (var i = 0; i < nTournant; i++) {
            var a1 = angleStep * i;
            var a2 = angleStep * (i + 1);
            var aMid = (a1 + a2) / 2;
            var r = larg;
            var mx = cornerX + direction * (-Math.sin(aMid) * r / 2 - larg / 2);
            var mz = palierZ + Math.cos(aMid) * r / 2;
            var marcheTournant = this._box(larg, ep, larg * 0.6, mx, palierY + marchH * (i + 1), mz);
            marcheTournant.rotation.y = direction * aMid;
            marcheTournant.userData.isMarche = true;
            group.add(marcheTournant);
        }

        // Rampe sur partie droite
        this._ajouterRampe(group, direction * larg / 2, palierY, gironDroit * nDroit, nDroit);

        return this._placer(group, worldX, worldZ, angle, mod);
    }

    // Demi-tournant (U)
    _creerDemiTournant(worldX, worldZ, angle, mod) {
        var group = new THREE.Group();
        var n = mod.nbMarches;
        var marchH = mod.hauteur / n;
        var volee = Math.floor(n / 2);
        var larg = mod.largeur / 2 - 0.05; // largeur par volee
        var ep = 0.035;
        var profondeur = mod.longueur;
        var giron = profondeur / volee;

        // Volee montante (cote gauche)
        for (var i = 0; i < volee; i++) {
            var marche = this._box(larg, ep, giron, -larg / 2 - 0.025, marchH * (i + 1), giron * i + giron / 2);
            marche.userData.isMarche = true;
            group.add(marche);

            var cm = this._box(larg, marchH - ep, 0.02, -larg / 2 - 0.025, marchH * i + (marchH - ep) / 2 + ep, giron * i + 0.01);
            cm.userData.isContremarche = true;
            group.add(cm);
        }

        // Palier intermediaire
        var palierY = marchH * volee;
        var palierZ = profondeur;
        var palier = this._box(mod.largeur, ep, larg, 0, palierY + marchH, palierZ + larg / 2);
        palier.userData.isMarche = true;
        group.add(palier);

        // Volee descendante inversee (cote droit, monte en arriere)
        var volee2 = n - volee - 1; // -1 pour le palier
        var giron2 = profondeur / volee2;
        for (var i = 0; i < volee2; i++) {
            var marche2 = this._box(larg, ep, giron2, larg / 2 + 0.025, palierY + marchH + marchH * (i + 1), palierZ - giron2 * i - giron2 / 2);
            marche2.userData.isMarche = true;
            group.add(marche2);

            var cm2 = this._box(larg, marchH - ep, 0.02, larg / 2 + 0.025, palierY + marchH + marchH * i + (marchH - ep) / 2 + ep, palierZ - giron2 * i + 0.01);
            cm2.userData.isContremarche = true;
            group.add(cm2);
        }

        // Rampes des 2 cotes
        this._ajouterRampe(group, -mod.largeur / 2, palierY, profondeur, volee);

        return this._placer(group, worldX, worldZ, angle, mod);
    }

    // Utilitaires de construction
    _box(w, h, d, x, y, z) {
        var color = '#A0522D';
        // Determiner la couleur selon le type
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleurMarche, roughness: 0.5 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    _ajouterLimons(group, largeur, hauteur, longueur, nbMarches) {
        var limonEp = 0.05;
        var limonH = 0.15;
        var angle = Math.atan2(hauteur, longueur);
        var limonLen = Math.sqrt(hauteur * hauteur + longueur * longueur);

        for (var side = -1; side <= 1; side += 2) {
            var geo = new THREE.BoxGeometry(limonEp, limonH, limonLen);
            var mat = new THREE.MeshStandardMaterial({ color: this.couleurLimon, roughness: 0.4 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(side * (largeur / 2 + limonEp / 2), hauteur / 2, longueur / 2);
            mesh.rotation.x = -angle;
            mesh.userData.isLimon = true;
            group.add(mesh);
        }
    }

    _ajouterRampe(group, xPos, hauteur, longueur, nbMarches) {
        var rampeH = 0.90;
        var angle = Math.atan2(hauteur, longueur);
        var rampeLen = Math.sqrt(hauteur * hauteur + longueur * longueur);

        // Main courante
        var geo = new THREE.BoxGeometry(0.06, 0.04, rampeLen);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleurRampe, roughness: 0.3, metalness: 0.4 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(xPos, hauteur / 2 + rampeH, longueur / 2);
        mesh.rotation.x = -angle;
        mesh.userData.isRampe = true;
        group.add(mesh);

        // Barreaux verticaux
        var marchH = hauteur / nbMarches;
        var giron = longueur / nbMarches;
        for (var i = 1; i < nbMarches; i += 2) {
            var bh = rampeH;
            var geo2 = new THREE.CylinderGeometry(0.012, 0.012, bh, 6);
            var mat2 = new THREE.MeshStandardMaterial({ color: this.couleurRampe, roughness: 0.3, metalness: 0.4 });
            var barreau = new THREE.Mesh(geo2, mat2);
            barreau.position.set(xPos, marchH * (i + 1) + bh / 2, giron * i);
            barreau.userData.isRampe = true;
            group.add(barreau);
        }
    }

    _placer(group, worldX, worldZ, angle, mod) {
        var rad = angle * Math.PI / 180;
        group.position.set(worldX, 0, worldZ);
        group.rotation.y = -rad;

        group.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.isEscalier = true;
            }
        });

        group.userData.escalierCreation = {
            modeleId: mod.id,
            worldX: worldX, worldZ: worldZ,
            angle: angle,
            couleurMarche: this.couleurMarche,
            couleurRampe: this.couleurRampe,
            largeur: mod.largeur,
            longueur: mod.longueur,
            hauteur: mod.hauteur,
            nbMarches: mod.nbMarches
        };

        this.scene.add(group);
        return group;
    }

    // Changer les couleurs d'un escalier existant
    static changerCouleur(group, couleurMarche, couleurRampe) {
        group.traverse(function(child) {
            if (child.isMesh && child.userData.isEscalier) {
                if (child.userData.isRampe) {
                    child.material.color.set(couleurRampe);
                } else {
                    child.material.color.set(couleurMarche);
                }
            }
        });
    }

    static lireCouleurs(group) {
        var marche = '#A0522D', rampe = '#666666';
        group.traverse(function(child) {
            if (child.isMesh && child.userData.isEscalier) {
                if (child.userData.isRampe) {
                    rampe = '#' + child.material.color.getHexString();
                } else if (child.userData.isMarche) {
                    marche = '#' + child.material.color.getHexString();
                }
            }
        });
        return { marche: marche, rampe: rampe };
    }
}
