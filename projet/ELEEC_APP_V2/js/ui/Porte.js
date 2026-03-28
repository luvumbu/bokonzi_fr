// ========================================
// Porte — Classe de creation de portes
// ========================================

class Porte {

    constructor(scene, editeur) {
        this.scene = scene;
        this.editeur = editeur;
        this.couleurCadre = '#8B4513';
        this.couleurPorte = '#D2691E';
        this.couleurPoignee = '#C0C0C0';
        this.cadreEp = 0.05;
        this.profondeur = 0.08;
    }

    static modeles() {
        return [
            // Portes pleines
            { id: 'simple',       nom: 'Simple',            largeur: 0.83, hauteur: 2.04, y: 0, cat: 'pleine',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><circle cx="18" cy="18" r="1.5" fill="#C0C0C0"/></svg>' },
            { id: 'simple-etroit',nom: 'Simple etroite',    largeur: 0.63, hauteur: 2.04, y: 0, cat: 'pleine',
              ico: '<svg viewBox="0 0 18 36" width="18" height="36"><rect x="2" y="1" width="14" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><circle cx="13" cy="18" r="1.2" fill="#C0C0C0"/></svg>' },
            { id: 'double',       nom: 'Double battant',    largeur: 1.46, hauteur: 2.04, y: 0, cat: 'pleine',
              ico: '<svg viewBox="0 0 30 36" width="30" height="36"><rect x="2" y="1" width="12" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><rect x="16" y="1" width="12" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><circle cx="13" cy="18" r="1.2" fill="#C0C0C0"/><circle cx="17" cy="18" r="1.2" fill="#C0C0C0"/></svg>' },
            { id: 'large',        nom: 'Large',             largeur: 1.00, hauteur: 2.04, y: 0, cat: 'pleine',
              ico: '<svg viewBox="0 0 28 36" width="28" height="36"><rect x="2" y="1" width="24" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><circle cx="22" cy="18" r="1.5" fill="#C0C0C0"/></svg>' },
            { id: 'garage',       nom: 'Garage',            largeur: 2.40, hauteur: 2.15, y: 0, cat: 'pleine',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="1" width="32" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><line x1="4" y1="9" x2="32" y2="9" stroke="#8B4513" stroke-width="0.8"/><line x1="4" y1="17" x2="32" y2="17" stroke="#8B4513" stroke-width="0.8"/><line x1="4" y1="25" x2="32" y2="25" stroke="#8B4513" stroke-width="0.8"/><circle cx="18" cy="31" r="1.2" fill="#C0C0C0"/></svg>' },
            { id: 'garage-double',nom: 'Garage double',     largeur: 5.00, hauteur: 2.15, y: 0, cat: 'pleine',
              ico: '<svg viewBox="0 0 44 36" width="44" height="36"><rect x="2" y="1" width="40" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><line x1="4" y1="9" x2="40" y2="9" stroke="#8B4513" stroke-width="0.8"/><line x1="4" y1="17" x2="40" y2="17" stroke="#8B4513" stroke-width="0.8"/><line x1="4" y1="25" x2="40" y2="25" stroke="#8B4513" stroke-width="0.8"/><circle cx="22" cy="31" r="1.2" fill="#C0C0C0"/></svg>' },
            // Portes vitrees
            { id: 'vitree',       nom: 'Vitre haut',        largeur: 0.83, hauteur: 2.04, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="20" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><rect x="2" y="21" width="20" height="14" rx="0" fill="#87CEEB" fill-opacity="0.5" stroke="#4a90d9" stroke-width="1.5"/><line x1="12" y1="21" x2="12" y2="35" stroke="#4a90d9" stroke-width="0.8"/><circle cx="18" cy="12" r="1.5" fill="#C0C0C0"/></svg>' },
            { id: 'vitree-pleine',nom: 'Vitre pleine',      largeur: 0.83, hauteur: 2.04, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="34" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="2" y1="18" x2="22" y2="18" stroke="#4a90d9" stroke-width="0.8"/><circle cx="18" cy="16" r="1.5" fill="#C0C0C0"/></svg>' },
            { id: 'vitree-double',nom: 'Vitre double',      largeur: 1.46, hauteur: 2.04, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 30 36" width="30" height="36"><rect x="2" y="1" width="12" height="14" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="16" y="1" width="12" height="14" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="2" y="16" width="12" height="19" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="16" y="16" width="12" height="19" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><circle cx="13" cy="18" r="1" fill="#C0C0C0"/><circle cx="17" cy="18" r="1" fill="#C0C0C0"/></svg>' },
            { id: 'vitree-3',     nom: 'Vitre 3 carreaux',  largeur: 0.83, hauteur: 2.04, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 24 36" width="24" height="36"><rect x="2" y="1" width="20" height="16" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><rect x="2" y="18" width="6" height="17" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="9" y="18" width="6" height="17" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="16" y="18" width="6" height="17" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><circle cx="18" cy="10" r="1.5" fill="#C0C0C0"/></svg>' },
            { id: 'vitree-triple',nom: 'Vitre triple',       largeur: 2.19, hauteur: 2.04, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 40 36" width="40" height="36"><rect x="2" y="1" width="10" height="14" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="14" y="1" width="10" height="14" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="26" y="1" width="12" height="14" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="2" y="16" width="10" height="19" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="14" y="16" width="10" height="19" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="26" y="16" width="12" height="19" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><circle cx="13" cy="18" r="1" fill="#C0C0C0"/><circle cx="15" cy="18" r="1" fill="#C0C0C0"/></svg>' },
            { id: 'coulissante',  nom: 'Baie coulissante',  largeur: 2.40, hauteur: 2.15, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 36 36" width="36" height="36"><rect x="2" y="1" width="15" height="34" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><rect x="19" y="1" width="15" height="34" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="17" y1="1" x2="17" y2="35" stroke="#4a90d9" stroke-width="2"/><circle cx="16" cy="18" r="1" fill="#C0C0C0"/><circle cx="20" cy="18" r="1" fill="#C0C0C0"/></svg>' },
            { id: 'vitree-large', nom: 'Vitre large',       largeur: 1.00, hauteur: 2.04, y: 0, cat: 'vitree',
              ico: '<svg viewBox="0 0 28 36" width="28" height="36"><rect x="2" y="1" width="24" height="34" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="14" y1="1" x2="14" y2="35" stroke="#4a90d9" stroke-width="0.8"/><line x1="2" y1="18" x2="26" y2="18" stroke="#4a90d9" stroke-width="0.8"/><circle cx="22" cy="16" r="1.5" fill="#C0C0C0"/></svg>' },
            // Portes coulissantes
            { id: 'couliss-pleine', nom: 'Coulissante pleine', largeur: 0.93, hauteur: 2.04, y: 0, cat: 'coulissante',
              ico: '<svg viewBox="0 0 26 36" width="26" height="36"><rect x="2" y="1" width="22" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><line x1="2" y1="4" x2="24" y2="4" stroke="#8B4513" stroke-width="0.8"/><line x1="2" y1="32" x2="24" y2="32" stroke="#8B4513" stroke-width="0.8"/><circle cx="6" cy="18" r="1.5" fill="#C0C0C0"/><path d="M16 18 L22 18" stroke="#C0C0C0" stroke-width="0.8" stroke-dasharray="2,1"/></svg>' },
            { id: 'couliss-large',  nom: 'Coulissante large',  largeur: 1.20, hauteur: 2.04, y: 0, cat: 'coulissante',
              ico: '<svg viewBox="0 0 30 36" width="30" height="36"><rect x="2" y="1" width="26" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><line x1="2" y1="4" x2="28" y2="4" stroke="#8B4513" stroke-width="0.8"/><line x1="2" y1="32" x2="28" y2="32" stroke="#8B4513" stroke-width="0.8"/><circle cx="6" cy="18" r="1.5" fill="#C0C0C0"/><path d="M18 18 L26 18" stroke="#C0C0C0" stroke-width="0.8" stroke-dasharray="2,1"/></svg>' },
            { id: 'couliss-double', nom: 'Coulissante double', largeur: 1.66, hauteur: 2.04, y: 0, cat: 'coulissante',
              ico: '<svg viewBox="0 0 34 36" width="34" height="36"><rect x="2" y="1" width="14" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="18" y="1" width="14" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><line x1="2" y1="4" x2="32" y2="4" stroke="#8B4513" stroke-width="0.8"/><line x1="2" y1="32" x2="32" y2="32" stroke="#8B4513" stroke-width="0.8"/><circle cx="14" cy="18" r="1" fill="#C0C0C0"/><circle cx="20" cy="18" r="1" fill="#C0C0C0"/></svg>' },
            { id: 'galandage',      nom: 'Galandage',          largeur: 0.93, hauteur: 2.04, y: 0, cat: 'coulissante',
              ico: '<svg viewBox="0 0 26 36" width="26" height="36"><rect x="2" y="1" width="10" height="34" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1.5"/><rect x="14" y="3" width="10" height="30" rx="0" fill="none" stroke="#8B4513" stroke-width="0.8" stroke-dasharray="2,2"/><circle cx="6" cy="18" r="1.5" fill="#C0C0C0"/><path d="M14 18 L24 18" stroke="#aaa" stroke-width="0.6" stroke-dasharray="2,1"/></svg>' },
            { id: 'couliss-vitree', nom: 'Coulissante vitree', largeur: 0.93, hauteur: 2.04, y: 0, cat: 'coulissante',
              ico: '<svg viewBox="0 0 26 36" width="26" height="36"><rect x="2" y="1" width="22" height="34" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1.5"/><line x1="2" y1="4" x2="24" y2="4" stroke="#4a90d9" stroke-width="0.8"/><line x1="2" y1="32" x2="24" y2="32" stroke="#4a90d9" stroke-width="0.8"/><line x1="13" y1="4" x2="13" y2="32" stroke="#4a90d9" stroke-width="0.6"/><circle cx="6" cy="18" r="1.5" fill="#C0C0C0"/></svg>' }
        ];
    }

    setCouleurs(couleurCadre, couleurPorte) {
        this.couleurCadre = couleurCadre;
        this.couleurPorte = couleurPorte;
    }

    creer(modeleId, worldX, worldZ, y, largeur, hauteur, angle) {
        this._lastModeleId = modeleId;
        switch (modeleId) {
            case 'double':         return this._creerDouble(worldX, worldZ, y, largeur, hauteur, angle);
            case 'garage':
            case 'garage-double':  return this._creerGarage(worldX, worldZ, y, largeur, hauteur, angle);
            case 'vitree':         return this._creerVitree(worldX, worldZ, y, largeur, hauteur, angle);
            case 'vitree-pleine':
            case 'vitree-large':   return this._creerVitreePleine(worldX, worldZ, y, largeur, hauteur, angle);
            case 'vitree-double':  return this._creerVitreeDouble(worldX, worldZ, y, largeur, hauteur, angle);
            case 'vitree-3':       return this._creerVitree3(worldX, worldZ, y, largeur, hauteur, angle);
            case 'vitree-triple':  return this._creerVitreeTriple(worldX, worldZ, y, largeur, hauteur, angle);
            case 'coulissante':    return this._creerCoulissante(worldX, worldZ, y, largeur, hauteur, angle);
            case 'couliss-pleine':
            case 'couliss-large':  return this._creerCoulissPleine(worldX, worldZ, y, largeur, hauteur, angle);
            case 'couliss-double': return this._creerCoulissDouble(worldX, worldZ, y, largeur, hauteur, angle);
            case 'galandage':      return this._creerGalandage(worldX, worldZ, y, largeur, hauteur, angle);
            case 'couliss-vitree': return this._creerCoulissVitree(worldX, worldZ, y, largeur, hauteur, angle);
            default:               return this._creerSimple(worldX, worldZ, y, largeur, hauteur, angle);
        }
    }

    // Porte simple (1 panneau + cadre + poignee — visible des 2 cotes)
    _creerSimple(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Panneau de porte (visible des 2 cotes)
        group.add(this._panneau(largeur - c * 2, hauteur - c, p, 0, hauteur / 2 - c / 2, 0));

        // Cadre : haut + 2 cotes (des 2 faces)
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Poignee des 2 cotes
        group.add(this._poignee(largeur / 2 - c - 0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(-(largeur / 2 - c - 0.08), hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte double battant
    _creerDouble(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var demiL = largeur / 2;

        // 2 panneaux
        group.add(this._panneau(demiL - c * 1.5, hauteur - c, p, -demiL / 2, hauteur / 2 - c / 2, 0));
        group.add(this._panneau(demiL - c * 1.5, hauteur - c, p, demiL / 2, hauteur / 2 - c / 2, 0));

        // Cadre exterieur
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Montant central
        group.add(this._barre(c, hauteur - c, p, 0, (hauteur - c) / 2, 0));

        // 2 poignees de chaque cote
        group.add(this._poignee(-0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(-0.08, hauteur * 0.45, -(p / 2 + 0.02)));
        group.add(this._poignee(0.08, hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte garage (panneau plein avec lignes horizontales)
    _creerGarage(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Panneau principal
        group.add(this._panneau(largeur - c * 2, hauteur - c, p, 0, hauteur / 2 - c / 2, 0));

        // Cadre
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Lignes horizontales (sections de garage)
        var nbSections = 4;
        var sectionH = (hauteur - c) / nbSections;
        for (var i = 1; i < nbSections; i++) {
            group.add(this._barre(largeur - c * 2, c * 0.5, p, 0, sectionH * i, 0));
        }

        // Poignee basse au centre des 2 cotes
        group.add(this._poignee(0, hauteur * 0.12, p / 2 + 0.02));
        group.add(this._poignee(0, hauteur * 0.12, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte vitree (panneau + vitre en haut)
    _creerVitree(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var vitreH = hauteur * 0.4;
        var panneauH = hauteur - vitreH - c;

        // Panneau bas (partie pleine)
        group.add(this._panneau(largeur - c * 2, panneauH, p, 0, panneauH / 2, 0));

        // Vitre en haut
        var vitreGeo = new THREE.PlaneGeometry(largeur - c * 2, vitreH - c);
        var vitreMat = new THREE.MeshBasicMaterial({
            color: '#87CEEB',
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        var vitre = new THREE.Mesh(vitreGeo, vitreMat);
        vitre.position.set(0, panneauH + vitreH / 2, 0);
        vitre.renderOrder = 2;
        group.add(vitre);

        // Barre entre panneau et vitre
        group.add(this._barre(largeur - c * 2, c, p, 0, panneauH, 0));

        // Cadre
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Croisillon sur la vitre
        group.add(this._barre(c * 0.7, vitreH - c * 2, p, 0, panneauH + vitreH / 2, 0));

        // Poignee des 2 cotes
        group.add(this._poignee(largeur / 2 - c - 0.08, hauteur * 0.42, p / 2 + 0.02));
        group.add(this._poignee(-(largeur / 2 - c - 0.08), hauteur * 0.42, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte vitree pleine (vitre sur toute la hauteur + cadre)
    _creerVitreePleine(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Vitre pleine hauteur
        group.add(this._vitre(largeur - c * 2, hauteur - c * 2, 0, hauteur / 2, 0));

        // Cadre
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));          // haut
        group.add(this._barre(largeur, c, p, 0, c / 2, 0));                    // bas
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Barre horizontale au milieu
        group.add(this._barre(largeur - c * 2, c * 0.7, p, 0, hauteur * 0.5, 0));

        // Poignee des 2 cotes
        group.add(this._poignee(largeur / 2 - c - 0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(-(largeur / 2 - c - 0.08), hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte vitree double battant (2 panneaux vitres)
    _creerVitreeDouble(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var demiL = largeur / 2;
        var panneauH = hauteur * 0.3;
        var vitreH = hauteur - panneauH - c * 2;

        // 2 panneaux bas
        group.add(this._panneau(demiL - c * 1.5, panneauH, p, -demiL / 2, panneauH / 2, 0));
        group.add(this._panneau(demiL - c * 1.5, panneauH, p, demiL / 2, panneauH / 2, 0));

        // 2 vitres hautes
        group.add(this._vitre(demiL - c * 2, vitreH - c, -demiL / 2, panneauH + c + vitreH / 2, 0));
        group.add(this._vitre(demiL - c * 2, vitreH - c, demiL / 2, panneauH + c + vitreH / 2, 0));

        // Barres entre panneaux et vitres
        group.add(this._barre(demiL - c * 1.5, c, p, -demiL / 2, panneauH + c / 2, 0));
        group.add(this._barre(demiL - c * 1.5, c, p, demiL / 2, panneauH + c / 2, 0));

        // Cadre exterieur
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Montant central
        group.add(this._barre(c, hauteur - c, p, 0, (hauteur - c) / 2, 0));

        // 2 poignees de chaque cote
        group.add(this._poignee(-0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(-0.08, hauteur * 0.45, -(p / 2 + 0.02)));
        group.add(this._poignee(0.08, hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte vitree 3 carreaux (panneau bas + 3 vitres en haut)
    _creerVitree3(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var panneauH = hauteur * 0.35;
        var vitreH = hauteur - panneauH - c * 2;
        var tiersL = (largeur - c * 2) / 3;

        // Panneau bas
        group.add(this._panneau(largeur - c * 2, panneauH, p, 0, panneauH / 2, 0));

        // 3 vitres
        group.add(this._vitre(tiersL - c * 0.7, vitreH - c, -tiersL, panneauH + c + vitreH / 2, 0));
        group.add(this._vitre(tiersL - c * 0.7, vitreH - c, 0, panneauH + c + vitreH / 2, 0));
        group.add(this._vitre(tiersL - c * 0.7, vitreH - c, tiersL, panneauH + c + vitreH / 2, 0));

        // Barre entre panneau et vitres
        group.add(this._barre(largeur - c * 2, c, p, 0, panneauH + c / 2, 0));

        // 2 montants verticaux entre les vitres
        group.add(this._barre(c * 0.7, vitreH, p, -tiersL / 2, panneauH + c + vitreH / 2, 0));
        group.add(this._barre(c * 0.7, vitreH, p, tiersL / 2, panneauH + c + vitreH / 2, 0));

        // Cadre
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Poignee des 2 cotes
        group.add(this._poignee(largeur / 2 - c - 0.08, hauteur * 0.42, p / 2 + 0.02));
        group.add(this._poignee(-(largeur / 2 - c - 0.08), hauteur * 0.42, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Porte vitree triple battant (3 panneaux vitres)
    _creerVitreeTriple(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var tiersL = largeur / 3;
        var panneauH = hauteur * 0.3;
        var vitreH = hauteur - panneauH - c * 2;

        // 3 panneaux bas
        group.add(this._panneau(tiersL - c * 1.5, panneauH, p, -tiersL, panneauH / 2, 0));
        group.add(this._panneau(tiersL - c * 1.5, panneauH, p, 0, panneauH / 2, 0));
        group.add(this._panneau(tiersL - c * 1.5, panneauH, p, tiersL, panneauH / 2, 0));

        // 3 vitres hautes
        group.add(this._vitre(tiersL - c * 2, vitreH - c, -tiersL, panneauH + c + vitreH / 2, 0));
        group.add(this._vitre(tiersL - c * 2, vitreH - c, 0, panneauH + c + vitreH / 2, 0));
        group.add(this._vitre(tiersL - c * 2, vitreH - c, tiersL, panneauH + c + vitreH / 2, 0));

        // Barres entre panneaux et vitres
        group.add(this._barre(tiersL - c * 1.5, c, p, -tiersL, panneauH + c / 2, 0));
        group.add(this._barre(tiersL - c * 1.5, c, p, 0, panneauH + c / 2, 0));
        group.add(this._barre(tiersL - c * 1.5, c, p, tiersL, panneauH + c / 2, 0));

        // Cadre exterieur
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // 2 montants verticaux entre les 3 battants
        group.add(this._barre(c, hauteur - c, p, -tiersL / 2, (hauteur - c) / 2, 0));
        group.add(this._barre(c, hauteur - c, p, tiersL / 2, (hauteur - c) / 2, 0));

        // Poignees sur le battant central (des 2 cotes)
        group.add(this._poignee(-tiersL / 2 + 0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(tiersL / 2 - 0.08, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(-tiersL / 2 + 0.08, hauteur * 0.45, -(p / 2 + 0.02)));
        group.add(this._poignee(tiersL / 2 - 0.08, hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Baie coulissante (2 grands panneaux vitres coulissants)
    _creerCoulissante(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var demiL = largeur / 2;

        // 2 grandes vitres
        group.add(this._vitre(demiL - c * 1.5, hauteur - c * 2, -demiL / 2, hauteur / 2, 0));
        group.add(this._vitre(demiL - c * 1.5, hauteur - c * 2, demiL / 2, hauteur / 2, 0));

        // Cadre exterieur
        group.add(this._barre(largeur, c, p, 0, hauteur - c / 2, 0));          // haut
        group.add(this._barre(largeur, c, p, 0, c / 2, 0));                    // bas (rail)
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Montant central
        group.add(this._barre(c * 1.5, hauteur - c * 2, p, 0, hauteur / 2, 0));

        // Cadres internes des 2 panneaux
        group.add(this._barre(c * 0.5, hauteur - c * 2, p, -demiL + c, hauteur / 2, 0));
        group.add(this._barre(c * 0.5, hauteur - c * 2, p, demiL - c, hauteur / 2, 0));

        // Poignee au centre des 2 cotes
        group.add(this._poignee(-0.06, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(0.06, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(-0.06, hauteur * 0.45, -(p / 2 + 0.02)));
        group.add(this._poignee(0.06, hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Coulissante pleine (1 panneau + rail haut/bas)
    _creerCoulissPleine(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Panneau plein
        group.add(this._panneau(largeur - c * 2, hauteur - c * 2, p, 0, hauteur / 2, 0));

        // Rails haut et bas
        group.add(this._barre(largeur, c * 0.6, p, 0, hauteur - c * 0.3, 0));
        group.add(this._barre(largeur, c * 0.6, p, 0, c * 0.3, 0));

        // Montants gauche/droite
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Poignee encastree (des 2 cotes)
        group.add(this._poignee(-largeur / 2 + c + 0.06, hauteur * 0.45, p / 2 + 0.015));
        group.add(this._poignee(-largeur / 2 + c + 0.06, hauteur * 0.45, -(p / 2 + 0.015)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Coulissante double (2 panneaux pleins qui se croisent)
    _creerCoulissDouble(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();
        var demiL = largeur / 2;

        // 2 panneaux pleins
        group.add(this._panneau(demiL - c * 1.5, hauteur - c * 2, p, -demiL / 4, hauteur / 2, -p * 0.3));
        group.add(this._panneau(demiL - c * 1.5, hauteur - c * 2, p, demiL / 4, hauteur / 2, p * 0.3));

        // Rails haut et bas
        group.add(this._barre(largeur, c * 0.6, p * 1.5, 0, hauteur - c * 0.3, 0));
        group.add(this._barre(largeur, c * 0.6, p * 1.5, 0, c * 0.3, 0));

        // Montants
        group.add(this._barre(c, hauteur, p * 1.5, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p * 1.5, largeur / 2 - c / 2, hauteur / 2, 0));

        // Poignees au centre
        group.add(this._poignee(-0.04, hauteur * 0.45, p / 2 + 0.02));
        group.add(this._poignee(0.04, hauteur * 0.45, -(p / 2 + 0.02)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Galandage (panneau disparait dans le mur)
    _creerGalandage(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Panneau plein (visible a moitie — l'autre moitie est dans le mur)
        group.add(this._panneau(largeur - c * 2, hauteur - c * 2, p, 0, hauteur / 2, 0));

        // Rail haut
        group.add(this._barre(largeur * 2, c * 0.5, p, largeur / 2, hauteur - c * 0.25, 0));

        // Cadre visible (cote ouverture seulement)
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));

        // Poignee encastree
        group.add(this._poignee(-largeur / 2 + c + 0.06, hauteur * 0.45, p / 2 + 0.015));
        group.add(this._poignee(-largeur / 2 + c + 0.06, hauteur * 0.45, -(p / 2 + 0.015)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // Coulissante vitree (1 panneau vitre)
    _creerCoulissVitree(worldX, worldZ, y, largeur, hauteur, angle) {
        var c = this.cadreEp;
        var p = this.profondeur;
        var group = new THREE.Group();

        // Vitre
        group.add(this._vitre(largeur - c * 2, hauteur - c * 2, 0, hauteur / 2, 0));

        // Croisillon vertical
        group.add(this._barre(c * 0.4, hauteur - c * 2, p, 0, hauteur / 2, 0));

        // Rails haut et bas
        group.add(this._barre(largeur, c * 0.6, p, 0, hauteur - c * 0.3, 0));
        group.add(this._barre(largeur, c * 0.6, p, 0, c * 0.3, 0));

        // Montants
        group.add(this._barre(c, hauteur, p, -largeur / 2 + c / 2, hauteur / 2, 0));
        group.add(this._barre(c, hauteur, p, largeur / 2 - c / 2, hauteur / 2, 0));

        // Poignee
        group.add(this._poignee(-largeur / 2 + c + 0.06, hauteur * 0.45, p / 2 + 0.015));
        group.add(this._poignee(-largeur / 2 + c + 0.06, hauteur * 0.45, -(p / 2 + 0.015)));

        return this._placer(group, worldX, worldZ, y, largeur, hauteur, angle);
    }

    // === UTILITAIRES ===

    _vitre(w, h, x, y, z) {
        var geo = new THREE.PlaneGeometry(w, h);
        var mat = new THREE.MeshBasicMaterial({
            color: '#87CEEB',
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.renderOrder = 2;
        return mesh;
    }

    _panneau(w, h, d, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d * 0.8);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleurPorte, roughness: 0.6 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    _barre(w, h, d, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleurCadre, roughness: 0.3 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    _poignee(x, y, z) {
        var geo = new THREE.CylinderGeometry(0.015, 0.015, 0.10, 12);
        var mat = new THREE.MeshStandardMaterial({ color: this.couleurPoignee, roughness: 0.2, metalness: 0.8 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(x, y, z);
        return mesh;
    }

    _placer(group, worldX, worldZ, y, largeur, hauteur, angle) {
        var rad = angle * Math.PI / 180;
        group.position.set(worldX, y, worldZ);
        group.rotation.y = -rad;

        // Arc d'ouverture au sol (quart de cercle — style plan architecte)
        var modId = this._lastModeleId || 'simple';
        this._ajouterArcOuverture(group, modId, largeur, hauteur);

        this.scene.add(group);

        // Taguer pour detection au clic
        group.traverse(function(child) {
            child.userData.isPorte = true;
        });

        // Stocker les infos de recreation (pour le undo et le cache)
        var creationData = {
            modeleId: modId,
            couleurCadre: this.couleurCadre,
            couleurPorte: this.couleurPorte,
            worldX: worldX, worldZ: worldZ, y: y,
            largeur: largeur, hauteur: hauteur, angle: angle
        };
        group.userData.porteCreation = creationData;

        // Enregistrer l'exclusion
        var excl = this.editeur.ajouterExclusion(worldX, worldZ, y, largeur, hauteur, angle, 'rect', group);
        excl._creation = creationData;
        excl._type = 'porte';
        group.userData.exclusionId = excl.id;

        return group;
    }

    // Arc d'ouverture au sol — montre comment la porte s'ouvre
    _ajouterArcOuverture(group, modeleId, largeur, hauteur) {
        var couleur = '#D2691E';
        var opacite = 0.6;

        if (modeleId === 'coulissante' || modeleId === 'couliss-pleine' || modeleId === 'couliss-large' || modeleId === 'couliss-vitree' || modeleId === 'couliss-double') {
            // Baie coulissante : fleche horizontale (glisse le long du mur)
            this._flecheSol(group, -largeur / 4, largeur / 4, 0.20, couleur, opacite);
            return;
        }

        if (modeleId === 'galandage') {
            // Galandage : fleche qui rentre dans le mur (vers la droite)
            this._flecheSol(group, -largeur / 4, largeur / 2 + 0.15, 0.20, couleur, opacite);
            return;
        }

        if (modeleId === 'garage' || modeleId === 'garage-double') {
            // Garage : fleche vers l'avant (s'ouvre vers l'exterieur/haut)
            this._flecheSol(group, 0, 0, 0.35, couleur, opacite);
            return;
        }

        var isDouble = (modeleId === 'double' || modeleId === 'vitree-double');

        if (isDouble) {
            // Double battant : 2 arcs, charnieres aux extremites
            var demiL = largeur / 2;
            // Vantail gauche : charniere a x=-largeur/2, s'ouvre vers z+
            this._arcSol(group, -largeur / 2, 0, demiL, 0, Math.PI / 2, couleur, opacite);
            // Vantail droit : charniere a x=+largeur/2, s'ouvre vers z+
            this._arcSol(group, largeur / 2, 0, demiL, Math.PI / 2, Math.PI, couleur, opacite);
        } else {
            // Simple battant : charniere a gauche (x=-largeur/2), s'ouvre vers z+
            this._arcSol(group, -largeur / 2, 0, largeur, 0, Math.PI / 2, couleur, opacite);
        }
    }

    // Quart de cercle au sol — charniere en (cx, cz), rayon, de startAngle a endAngle
    // Angle 0 = direction X+, PI/2 = direction Z+
    _arcSol(group, cx, cz, rayon, startAngle, endAngle, couleur, opacite) {
        var segs = 24;
        var pts = [];
        for (var i = 0; i <= segs; i++) {
            var t = startAngle + (endAngle - startAngle) * (i / segs);
            pts.push(new THREE.Vector3(
                cx + Math.cos(t) * rayon,
                0.02,
                cz + Math.sin(t) * rayon
            ));
        }

        // Arc en tirets
        var arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
        var arcMat = new THREE.LineDashedMaterial({
            color: new THREE.Color(couleur), transparent: true, opacity: opacite,
            dashSize: 0.10, gapSize: 0.06
        });
        var arcLine = new THREE.Line(arcGeo, arcMat);
        arcLine.computeLineDistances();
        arcLine.userData._arcOuverture = true;
        group.add(arcLine);

        // Ligne du rayon : charniere → bout ouvert
        var rayPts = [
            new THREE.Vector3(cx, 0.02, cz),
            new THREE.Vector3(pts[pts.length - 1].x, 0.02, pts[pts.length - 1].z)
        ];
        var rayGeo = new THREE.BufferGeometry().setFromPoints(rayPts);
        var rayMat = new THREE.LineDashedMaterial({
            color: new THREE.Color(couleur), transparent: true, opacity: opacite * 0.5,
            dashSize: 0.06, gapSize: 0.04
        });
        var rayLine = new THREE.Line(rayGeo, rayMat);
        rayLine.computeLineDistances();
        rayLine.userData._arcOuverture = true;
        group.add(rayLine);
    }

    // Fleche au sol pour coulissante/garage
    _flecheSol(group, fromX, toX, zOffset, couleur, opacite) {
        // Ligne
        var pts = [
            new THREE.Vector3(fromX, 0.02, zOffset),
            new THREE.Vector3(toX, 0.02, zOffset)
        ];
        var geo = new THREE.BufferGeometry().setFromPoints(pts);
        var mat = new THREE.LineDashedMaterial({
            color: new THREE.Color(couleur), transparent: true, opacity: opacite,
            dashSize: 0.08, gapSize: 0.05
        });
        var line = new THREE.Line(geo, mat);
        line.computeLineDistances();
        line.userData._arcOuverture = true;
        group.add(line);

        // Pointe de fleche
        var dir = toX >= fromX ? 1 : -1;
        var tipX = toX;
        var aPts = [
            new THREE.Vector3(tipX - 0.08 * dir, 0.02, zOffset - 0.05),
            new THREE.Vector3(tipX, 0.02, zOffset),
            new THREE.Vector3(tipX - 0.08 * dir, 0.02, zOffset + 0.05)
        ];
        var aGeo = new THREE.BufferGeometry().setFromPoints(aPts);
        var aLine = new THREE.Line(aGeo, new THREE.LineBasicMaterial({
            color: new THREE.Color(couleur), transparent: true, opacity: opacite
        }));
        aLine.userData._arcOuverture = true;
        group.add(aLine);
    }

    // Changer les couleurs d'une porte existante
    static changerCouleur(group, couleurCadre, couleurPorte) {
        group.traverse(function(child) {
            if (child.isMesh) {
                if (child.material.metalness > 0.5) {
                    // C'est la poignee, ne pas changer
                } else if (child.material.roughness > 0.4) {
                    // C'est le panneau
                    child.material.color.set(couleurPorte);
                } else if (!child.material.transparent) {
                    // C'est le cadre
                    child.material.color.set(couleurCadre);
                }
            }
        });
    }

    // Lire les couleurs actuelles d'une porte
    static lireCouleurs(group) {
        var cadre = '#8B4513';
        var porte = '#D2691E';
        group.traverse(function(child) {
            if (child.isMesh) {
                if (child.material.metalness > 0.5) {
                    // poignee
                } else if (child.material.roughness > 0.4) {
                    porte = '#' + child.material.color.getHexString();
                } else if (!child.material.transparent) {
                    cadre = '#' + child.material.color.getHexString();
                }
            }
        });
        return { cadre: cadre, porte: porte };
    }
}
