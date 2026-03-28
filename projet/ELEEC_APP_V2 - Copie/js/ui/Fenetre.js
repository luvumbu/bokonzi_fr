// ========================================
// Fenetre — Classe de creation de fenetres
// ========================================

class Fenetre {

    constructor(scene, editeur) {
        this.scene = scene;
        this.editeur = editeur;
        this.couleurVitre = '#87CEEB';
        this.couleurCadre = '#4a90d9';
        this.opaciteVitre = 0.3;
        this.cadreEp = 0.05;
        this.profondeur = 0.08;
    }

    static modeles() {
        return [
            // Fenetres standard
            { id: 'rectangle',  nom: 'Rectangulaire',   largeur: 1.20, hauteur: 1.15, y: 0.90, cat: 'standard',
              ico: '<svg viewBox="0 0 28 24" width="28" height="24"><rect x="2" y="2" width="24" height="20" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="14" y1="2" x2="14" y2="22" stroke="#4a90d9" stroke-width="0.8"/><line x1="2" y1="12" x2="26" y2="12" stroke="#4a90d9" stroke-width="0.8"/></svg>' },
            { id: 'double',     nom: 'Double',          largeur: 1.60, hauteur: 1.15, y: 0.90, cat: 'standard',
              ico: '<svg viewBox="0 0 34 24" width="34" height="24"><rect x="2" y="2" width="14" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><rect x="18" y="2" width="14" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="9" y1="2" x2="9" y2="22" stroke="#4a90d9" stroke-width="0.6"/><line x1="25" y1="2" x2="25" y2="22" stroke="#4a90d9" stroke-width="0.6"/></svg>' },
            { id: 'haute',      nom: 'Haute etroite',   largeur: 0.50, hauteur: 1.80, y: 0.50, cat: 'standard',
              ico: '<svg viewBox="0 0 16 34" width="16" height="34"><rect x="2" y="2" width="12" height="30" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="32" stroke="#4a90d9" stroke-width="0.8"/><line x1="2" y1="17" x2="14" y2="17" stroke="#4a90d9" stroke-width="0.8"/></svg>' },
            { id: 'petite',     nom: 'Petite',          largeur: 0.60, hauteur: 0.60, y: 1.20, cat: 'standard',
              ico: '<svg viewBox="0 0 18 18" width="18" height="18"><rect x="2" y="2" width="14" height="14" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="9" y1="2" x2="9" y2="16" stroke="#4a90d9" stroke-width="0.8"/><line x1="2" y1="9" x2="16" y2="9" stroke="#4a90d9" stroke-width="0.8"/></svg>' },
            { id: 'oeil-boeuf',  nom: 'Oeil de boeuf',   largeur: 0.40, hauteur: 0.40, y: 1.50, cat: 'standard',
              ico: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="14" stroke="#4a90d9" stroke-width="0.6"/><line x1="2" y1="8" x2="14" y2="8" stroke="#4a90d9" stroke-width="0.6"/></svg>' },
            // Grandes fenetres
            { id: 'large',      nom: 'Baie vitree',     largeur: 2.40, hauteur: 1.40, y: 0.80, cat: 'grande',
              ico: '<svg viewBox="0 0 40 24" width="40" height="24"><rect x="2" y="2" width="11" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><rect x="15" y="2" width="11" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><rect x="28" y="2" width="11" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/></svg>' },
            { id: 'panoramique',nom: 'Panoramique',     largeur: 3.00, hauteur: 1.00, y: 1.00, cat: 'grande',
              ico: '<svg viewBox="0 0 44 18" width="44" height="18"><rect x="2" y="2" width="40" height="14" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="15" y1="2" x2="15" y2="16" stroke="#4a90d9" stroke-width="0.6"/><line x1="29" y1="2" x2="29" y2="16" stroke="#4a90d9" stroke-width="0.6"/></svg>' },
            { id: 'triple',     nom: 'Triple',          largeur: 1.80, hauteur: 1.15, y: 0.90, cat: 'grande',
              ico: '<svg viewBox="0 0 36 24" width="36" height="24"><rect x="2" y="2" width="10" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="13" y="2" width="10" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="24" y="2" width="10" height="20" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/></svg>' }
        ];
    }

    setCouleurs(couleurCadre, couleurVitre, opaciteVitre) {
        this.couleurCadre = couleurCadre;
        this.couleurVitre = couleurVitre;
        this.opaciteVitre = opaciteVitre;
    }

    creer(modeleId, worldX, worldZ, y, largeur, hauteur, angle) {
        this._lastModeleId = modeleId;
        switch (modeleId) {
            case 'double':      return this._creerDouble(worldX, worldZ, y, largeur, hauteur, angle);
            case 'large':
            case 'triple':      return this._creerLarge(worldX, worldZ, y, largeur, hauteur, angle);
            case 'panoramique': return this._creerDouble(worldX, worldZ, y, largeur, hauteur, angle);
            default:            return this._creerSimple(worldX, worldZ, y, largeur, hauteur, angle);
        }
    }

    // Fenetre simple (1 vitre + cadre + croisillon)
    _creerSimple(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Vitre
        group.add(this._vitre(largeur - c * 2, hauteur - c * 2, p, 0, hauteur / 2, 0));

        // Cadre : 4 barres
        group.add(this._barre(largeur, c, p, 0, c / 2, 0));                    // bas
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));          // haut
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));  // gauche
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));   // droite

        // Croisillon
        group.add(this._barre(largeur - c * 2, c * 0.7, p, 0, hauteur / 2, 0));       // horizontal
        group.add(this._barre(c * 0.7, hauteur - c * 2, p, 0, hauteur / 2, 0));       // vertical

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Fenetre double (2 panneaux)
    _creerDouble(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var demiL = largeur / 2;

        // 2 vitres
        group.add(this._vitre(demiL - c * 2, hauteur - c * 2, p, -demiL / 2, hauteur / 2, 0));
        group.add(this._vitre(demiL - c * 2, hauteur - c * 2, p, demiL / 2, hauteur / 2, 0));

        // Cadre exterieur
        group.add(this._barre(largeur, c, p, 0, c / 2, 0));
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Montant central
        group.add(this._barre(c * 1.5, hauteur - c * 2, p, 0, hauteur / 2, 0));

        // Croisillons horizontaux
        group.add(this._barre(demiL - c * 2, c * 0.7, p, -demiL / 2, hauteur / 2, 0));
        group.add(this._barre(demiL - c * 2, c * 0.7, p, demiL / 2, hauteur / 2, 0));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Baie vitree (3 panneaux)
    _creerLarge(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var tiersL = largeur / 3;

        // 3 vitres
        group.add(this._vitre(tiersL - c * 2, hauteur - c * 2, p, -tiersL, hauteur / 2, 0));
        group.add(this._vitre(tiersL - c * 2, hauteur - c * 2, p, 0, hauteur / 2, 0));
        group.add(this._vitre(tiersL - c * 2, hauteur - c * 2, p, tiersL, hauteur / 2, 0));

        // Cadre exterieur
        group.add(this._barre(largeur, c, p, 0, c / 2, 0));
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // 2 montants
        group.add(this._barre(c * 1.5, hauteur - c * 2, p, -tiersL / 2, hauteur / 2, 0));
        group.add(this._barre(c * 1.5, hauteur - c * 2, p, tiersL / 2, hauteur / 2, 0));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // === UTILITAIRES ===

    _vitre(w, h, d, x, y, z) {
        var geo = new THREE.PlaneGeometry(w, h);
        var mat = new THREE.MeshBasicMaterial({
            color: this.couleurVitre,
            transparent: true,
            opacity: this.opaciteVitre,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.renderOrder = 2;
        return mesh;
    }

    _barre(w, h, d, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleurCadre, roughness: 0.3 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    _placer(group, worldX, worldZ, y, largeur, hauteur, angle) {
        var rad = angle * Math.PI / 180;
        group.position.set(worldX, y, worldZ);
        group.rotation.y = -rad;

        this.scene.add(group);

        // Taguer pour detection au clic
        group.traverse(function(child) {
            child.userData.isFenetre = true;
        });

        // Stocker les infos de recreation (pour le undo et le cache)
        var creationData = {
            modeleId: this._lastModeleId || 'rectangle',
            couleurCadre: this.couleurCadre,
            couleurVitre: this.couleurVitre,
            opaciteVitre: this.opaciteVitre,
            worldX: worldX, worldZ: worldZ, y: y,
            largeur: largeur, hauteur: hauteur, angle: angle
        };
        group.userData.fenetreCreation = creationData;

        // Enregistrer l'exclusion
        var excl = this.editeur.ajouterExclusion(worldX, worldZ, y, largeur, hauteur, angle, 'rect', group);
        excl._creation = creationData;
        excl._type = 'fenetre';
        group.userData.exclusionId = excl.id;

        return group;
    }

    // Changer les couleurs d'une fenetre existante
    static changerCouleur(group, couleurCadre, couleurVitre, opaciteVitre) {
        group.traverse(function(child) {
            if (child.isMesh) {
                if (child.material.transparent) {
                    // C'est la vitre
                    child.material.color.set(couleurVitre);
                    child.material.opacity = opaciteVitre;
                } else {
                    // C'est le cadre
                    child.material.color.set(couleurCadre);
                }
            }
        });
    }

    // Lire les couleurs actuelles d'une fenetre
    static lireCouleurs(group) {
        var cadre = '#4a90d9';
        var vitre = '#87CEEB';
        var opacite = 30;
        group.traverse(function(child) {
            if (child.isMesh) {
                if (child.material.transparent) {
                    vitre = '#' + child.material.color.getHexString();
                    opacite = Math.round(child.material.opacity * 100);
                } else {
                    cadre = '#' + child.material.color.getHexString();
                }
            }
        });
        return { cadre: cadre, vitre: vitre, opacite: opacite };
    }
}
