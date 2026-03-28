// ========================================
// Editeur — Interface de construction
// ========================================

class Editeur {

    constructor(scene) {
        this.scene = scene;
        this.elements = [];
        this._id = 0;
        this._priorite = 1; // murBase est a 1, on commence a 2
        this._historique = [];
        this._futur = [];     // pile redo
        this._maxHistorique = 30;
        this._groupeId = 0;
        this.exclusions = []; // Zones d'exclusion (fenetres, objets)
        this.traits = [];     // Traits au sol (lignes de delimitation)
        this._traitId = 0;
    }

    // Grouper plusieurs elements ensemble
    grouperElements(ids) {
        if (ids.length < 2) return false;
        this._groupeId++;
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.elements.length; j++) {
                if (this.elements[j].id === ids[i]) {
                    this.elements[j].params.groupeId = this._groupeId;
                }
            }
        }
        return this._groupeId;
    }

    // Degrouper un element
    degrouper(id) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                delete this.elements[i].params.groupeId;
                return true;
            }
        }
        return false;
    }

    // Degrouper tout un groupe
    degrouperGroupe(groupeId) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].params.groupeId === groupeId) {
                delete this.elements[i].params.groupeId;
            }
        }
    }

    // Trouver tous les elements du meme groupe
    trouverGroupe(id) {
        var groupeId = null;
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id && this.elements[i].params.groupeId) {
                groupeId = this.elements[i].params.groupeId;
                break;
            }
        }
        if (!groupeId) return [id];
        var ids = [];
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].params.groupeId === groupeId) {
                ids.push(this.elements[i].id);
            }
        }
        return ids;
    }

    // Deplacer un groupe entier (delta)
    deplacerGroupe(ids, deltaX, deltaZ) {
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.elements.length; j++) {
                if (this.elements[j].id === ids[i]) {
                    var el = this.elements[j];
                    el.params.x = (el.params.x || 0) + deltaX;
                    el.params.z = (el.params.z || 0) + deltaZ;
                    this._reconstruire(el);
                }
            }
        }
    }

    // Pivoter un groupe entier autour du centre
    pivoterGroupe(ids, deltaAngle) {
        // Trouver le centre du groupe
        var cx = 0, cz = 0, count = 0;
        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.elements.length; j++) {
                if (this.elements[j].id === ids[i]) {
                    cx += this.elements[j].params.x || 0;
                    cz += this.elements[j].params.z || 0;
                    count++;
                }
            }
        }
        if (count === 0) return;
        cx /= count;
        cz /= count;

        var rad = deltaAngle * Math.PI / 180;
        var cos = Math.cos(rad), sin = Math.sin(rad);

        for (var i = 0; i < ids.length; i++) {
            for (var j = 0; j < this.elements.length; j++) {
                if (this.elements[j].id === ids[i]) {
                    var el = this.elements[j];
                    // Pivoter la position autour du centre
                    var rx = (el.params.x || 0) - cx;
                    var rz = (el.params.z || 0) - cz;
                    el.params.x = cx + rx * cos - rz * sin;
                    el.params.z = cz + rx * sin + rz * cos;
                    // Pivoter l'angle du mur
                    if (el.params.nbCotes && el.params.nbCotes > 1) {
                        el.params.angleDepart = ((el.params.angleDepart || 0) + deltaAngle) % 360;
                    } else {
                        el.params.angle = ((el.params.angle || 0) + deltaAngle) % 360;
                    }
                    this._reconstruire(el);
                }
            }
        }
    }

    // Sauvegarder l'etat actuel dans l'historique
    sauvegarderEtat() {
        var etat = {
            murs: [],
            exclusions: []
        };
        for (var i = 0; i < this.elements.length; i++) {
            etat.murs.push(JSON.parse(JSON.stringify(this.elements[i].params)));
        }
        // Sauvegarder les exclusions avec leurs infos de creation
        for (var i = 0; i < this.exclusions.length; i++) {
            var ex = this.exclusions[i];
            var creation = null;
            var exType = 'fenetre';
            if (ex.group3D && ex.group3D.userData.porteCreation) {
                exType = 'porte';
                creation = JSON.parse(JSON.stringify(ex.group3D.userData.porteCreation));
            } else if (ex.group3D && ex.group3D.userData.fenetreCreation) {
                exType = 'fenetre';
                creation = JSON.parse(JSON.stringify(ex.group3D.userData.fenetreCreation));
            }
            etat.exclusions.push({
                x: ex.x, z: ex.z, y: ex.y,
                largeur: ex.largeur, hauteur: ex.hauteur,
                angle: ex.angle, forme: ex.forme,
                _type: exType,
                _creation: creation
            });
        }
        // Sauvegarder les traits au sol
        etat.traits = [];
        for (var i = 0; i < this.traits.length; i++) {
            etat.traits.push(JSON.parse(JSON.stringify(this.traits[i].params)));
        }
        // Hook pour sauvegarder les placos/laines (appele depuis menu-editeur.js)
        if (this._onSauvegarder) this._onSauvegarder(etat);
        this._historique.push(etat);
        if (this._historique.length > this._maxHistorique) {
            this._historique.shift();
        }
        // Nouvelle action = on vide le futur (plus de redo possible)
        this._futur = [];
    }

    // Capturer l'etat courant (sans l'ajouter a l'historique)
    _capturerEtatCourant() {
        var etat = { murs: [], exclusions: [], traits: [] };
        for (var i = 0; i < this.elements.length; i++) {
            etat.murs.push(JSON.parse(JSON.stringify(this.elements[i].params)));
        }
        for (var i = 0; i < this.exclusions.length; i++) {
            var ex = this.exclusions[i];
            var creation = null;
            var exType = 'fenetre';
            if (ex.group3D && ex.group3D.userData.porteCreation) {
                exType = 'porte';
                creation = JSON.parse(JSON.stringify(ex.group3D.userData.porteCreation));
            } else if (ex.group3D && ex.group3D.userData.fenetreCreation) {
                exType = 'fenetre';
                creation = JSON.parse(JSON.stringify(ex.group3D.userData.fenetreCreation));
            }
            etat.exclusions.push({
                x: ex.x, z: ex.z, y: ex.y,
                largeur: ex.largeur, hauteur: ex.hauteur,
                angle: ex.angle, forme: ex.forme,
                _type: exType, _creation: creation
            });
        }
        for (var i = 0; i < this.traits.length; i++) {
            etat.traits.push(JSON.parse(JSON.stringify(this.traits[i].params)));
        }
        if (this._onSauvegarder) this._onSauvegarder(etat);
        return etat;
    }

    // Restaurer un etat
    _restaurerEtat(etat) {
        this.viderTout();
        while (this.exclusions.length > 0) {
            this.supprimerExclusion(this.exclusions[0].id);
        }
        for (var i = 0; i < etat.murs.length; i++) {
            this.ajouterMur(etat.murs[i]);
        }
        while (this.traits.length > 0) {
            this.supprimerTrait(this.traits[0].id);
        }
        if (etat.traits) {
            for (var i = 0; i < etat.traits.length; i++) {
                this.ajouterTrait(etat.traits[i]);
            }
        }
        if (this._onAnnuler) this._onAnnuler(etat);
    }

    // Annuler la derniere action (marche arriere)
    annuler() {
        if (this._historique.length === 0) return false;
        // Sauvegarder l'etat courant dans le futur pour pouvoir refaire
        this._futur.push(this._capturerEtatCourant());
        var etat = this._historique.pop();
        this._restaurerEtat(etat);
        return true;
    }

    // Refaire l'action suivante (marche avant)
    refaire() {
        if (this._futur.length === 0) return false;
        // Sauvegarder l'etat courant dans l'historique
        this._historique.push(this._capturerEtatCourant());
        var etat = this._futur.pop();
        this._restaurerEtat(etat);
        return true;
    }

    // Extraire les segments (lignes) occupes par un mur
    _segments(params) {
        var segs = [];
        if (params.nbCotes && params.nbCotes > 1) {
            var px = params.x || 0;
            var pz = params.z || 0;
            var angle = params.angleDepart || 0;
            var distBr = params.distanceBranches || params.distance;
            for (var c = 0; c < params.nbCotes; c++) {
                var rad = angle * Math.PI / 180;
                // Cotes pairs (0,2) = branches, impairs (1,3) = fond
                var d = (c % 2 === 0) ? distBr : params.distance;
                var ex = px + Math.cos(rad) * d;
                var ez = pz + Math.sin(rad) * d;
                segs.push({ x1: px, z1: pz, x2: ex, z2: ez });
                px = ex;
                pz = ez;
                angle += 90;
            }
        } else {
            var rad = (params.angle || 0) * Math.PI / 180;
            var x = params.x || 0;
            var z = params.z || 0;
            segs.push({
                x1: x, z1: z,
                x2: x + Math.cos(rad) * params.distance,
                z2: z + Math.sin(rad) * params.distance
            });
        }
        return segs;
    }

    // Verifier si deux segments se chevauchent
    _segmentsOverlap(a, b) {
        var eps = 0.15; // tolerance epaisseur mur

        // Direction de chaque segment
        var dax = a.x2 - a.x1, daz = a.z2 - a.z1;
        var dbx = b.x2 - b.x1, dbz = b.z2 - b.z1;
        var la = Math.sqrt(dax * dax + daz * daz);
        var lb = Math.sqrt(dbx * dbx + dbz * dbz);
        if (la < 0.01 || lb < 0.01) return false;

        // Normaliser
        var nax = dax / la, naz = daz / la;
        var nbx = dbx / lb, nbz = dbz / lb;

        // Paralleles ? (produit vectoriel ~ 0)
        var cross = Math.abs(nax * nbz - naz * nbx);
        if (cross > 0.1) return false;

        // Distance perpendiculaire entre les deux lignes
        var dx = b.x1 - a.x1, dz = b.z1 - a.z1;
        var perpDist = Math.abs(dx * (-naz) + dz * nax);
        if (perpDist > eps) return false;

        // Projeter les deux segments sur l'axe commun
        var projA1 = 0, projA2 = la;
        var projB1 = dx * nax + dz * naz;
        var projB2 = (b.x2 - a.x1) * nax + (b.z2 - a.z1) * naz;

        // Ordonner
        var minA = Math.min(projA1, projA2);
        var maxA = Math.max(projA1, projA2);
        var minB = Math.min(projB1, projB2);
        var maxB = Math.max(projB1, projB2);

        // Chevauchement ?
        return maxA > minB + 0.01 && maxB > minA + 0.01;
    }

    // Calculer le decalage perpendiculaire pour eviter le chevauchement
    // Retourne {dx, dz} a ajouter a params.x/z, ou null si pas de collision
    _calculerDecalage(params, ignorerId) {
        var eps = 0.16; // distance minimale entre 2 murs (epaisseur + marge)
        var nouveauxSegs = this._segments(params);

        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === ignorerId) continue;
            var segsExistant = this._segments(this.elements[i].params);

            for (var n = 0; n < nouveauxSegs.length; n++) {
                for (var s = 0; s < segsExistant.length; s++) {
                    var correction = this._correctionSegment(nouveauxSegs[n], segsExistant[s], eps);
                    if (correction) return correction;
                }
            }
        }
        return null;
    }

    // Calculer la correction entre deux segments qui se chevauchent
    _correctionSegment(a, b, eps) {
        var dax = a.x2 - a.x1, daz = a.z2 - a.z1;
        var dbx = b.x2 - b.x1, dbz = b.z2 - b.z1;
        var la = Math.sqrt(dax * dax + daz * daz);
        var lb = Math.sqrt(dbx * dbx + dbz * dbz);
        if (la < 0.01 || lb < 0.01) return null;

        var nax = dax / la, naz = daz / la;
        var nbx = dbx / lb, nbz = dbz / lb;

        // Paralleles ?
        var cross = Math.abs(nax * nbz - naz * nbx);
        if (cross > 0.1) return null;

        // Direction perpendiculaire (du segment b vers a)
        var perpX = -nax * 0 + (-naz);
        var perpZ = nax;
        // Correction : la perpendiculaire au segment est (-naz, nax)
        perpX = -naz;
        perpZ = nax;

        // Distance signee du point a.start par rapport a la ligne b
        var dx = a.x1 - b.x1, dz = a.z1 - b.z1;
        var perpDist = dx * perpX + dz * perpZ;

        // Si trop loin, pas de collision
        if (Math.abs(perpDist) > eps) return null;

        // Verifier que les projections se chevauchent
        var projA1 = 0, projA2 = la;
        var projB1 = (b.x1 - a.x1) * nax + (b.z1 - a.z1) * naz;
        var projB2 = (b.x2 - a.x1) * nax + (b.z2 - a.z1) * naz;
        var minA = Math.min(projA1, projA2), maxA = Math.max(projA1, projA2);
        var minB = Math.min(projB1, projB2), maxB = Math.max(projB1, projB2);
        if (maxA <= minB + 0.01 || maxB <= minA + 0.01) return null;

        // Calculer le decalage pour pousser a a la distance eps de b
        var direction = perpDist >= 0 ? 1 : -1;
        var decalage = (eps - Math.abs(perpDist)) * direction;

        return { dx: perpX * decalage, dz: perpZ * decalage };
    }

    // Supprimer les murs existants qui chevauchent les nouveaux segments
    _supprimerChevauchements(nouveauxSegs) {
        var aSupprimer = [];
        for (var i = 0; i < this.elements.length; i++) {
            var segsExistant = this._segments(this.elements[i].params);
            var chevauche = false;
            for (var s = 0; s < segsExistant.length && !chevauche; s++) {
                for (var n = 0; n < nouveauxSegs.length && !chevauche; n++) {
                    if (this._segmentsOverlap(segsExistant[s], nouveauxSegs[n])) {
                        chevauche = true;
                    }
                }
            }
            if (chevauche) aSupprimer.push(this.elements[i].id);
        }
        for (var j = 0; j < aSupprimer.length; j++) {
            this.supprimer(aSupprimer[j]);
        }
        return aSupprimer.length;
    }

    // Construire une brique avec config, trous, ignorer, priorite
    _construireBrique(params, couleur, opacite, jointCouleur, jointOpacite, ignorer, priorite) {
        var brique = new Brique(this.scene);

        // Appliquer les dimensions du type de brique
        if (params.briqueType && typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[params.briqueType]) {
            var bt = BRIQUES_TYPES[params.briqueType];
            brique.longueur = bt.longueur;
            brique.hauteur = bt.hauteur;
            brique.epaisseur = bt.epaisseur;
            brique.joint = bt.joint;
        }

        if (couleur) brique.setCouleur(couleur, opacite);
        if (jointCouleur !== undefined) {
            brique.setCouleurJoint(jointCouleur, jointOpacite);
        }
        if (params.vertical) brique.setVertical(true);
        if (ignorer) brique.setIgnorer(ignorer[0], ignorer[1]);
        if (priorite) brique.setPriorite(priorite);

        if (params.trous) {
            for (var i = 0; i < params.trous.length; i++) {
                var t = params.trous[i];
                brique.ajouterTrou(t.x || 0, t.y || 0, t.largeur, t.hauteur, t.alignement || null, t.decalage || 0, t.mur || 0, t.forme || null);
            }
        }



        if (params.nbCotes && params.nbCotes > 1) {
            brique.construireForme(params.x || 0, params.y || 0, params.z || 0, params.distance, params.hauteur, params.nbCotes, params.angleDepart || 0, params.distanceBranches);
        } else {
            brique.construire(params.x || 0, params.y || 0, params.z || 0, params.distance, params.hauteur, params.angle || 0);
        }

        return brique;
    }

    // Ajouter un mur avec les parametres du formulaire
    ajouterMur(params) {

        var group = new THREE.Group();
        this.scene.add(group);

        if (params.bicolore) {
            // Bicolore : 2 briques superposees avec ignorer alterne
            var brique1 = this._construireBrique(params, params.couleur, params.opacite, params.jointCouleur, params.jointOpacite, [2, 1], 1);
            var brique2 = this._construireBrique(params, params.bicolore.couleur2, params.bicolore.opacite2, params.jointCouleur, params.jointOpacite, [2, 2], 2);

            // Regrouper les deux dans un groupe commun
            this.scene.remove(brique1.group);
            this.scene.remove(brique2.group);
            group.add(brique1.group);
            group.add(brique2.group);

            this._id++;
            var element = {
                id: this._id,
                nom: params.nom || ('Mur ' + this._id),
                brique: brique1,
                brique2: brique2,
                group: group,
                params: params
            };
            this._taguerElement(element);
            this.elements.push(element);
            return element;
        } else {
            var brique = this._construireBrique(params, params.couleur, params.opacite, params.jointCouleur, params.jointOpacite, null, null);

            this.scene.remove(group);

            this._id++;
            var element = {
                id: this._id,
                nom: params.nom || ('Mur ' + this._id),
                brique: brique,
                params: params
            };
            this._taguerElement(element);
            this.elements.push(element);
            return element;
        }
    }

    // Ajouter un trou a un element existant et reconstruire
    ajouterTrouElement(id, trou) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                var el = this.elements[i];
                var p = el.params;
                var hMur = p.hauteur || 2.5;

                // Utiliser la longueur reelle du segment (pas params.distance)
                var trouMur = trou.mur || 0;
                var segs = this._segments(p);
                var seg = segs[trouMur];
                var segLen = p.distance || 5;
                if (seg) {
                    var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
                    segLen = Math.sqrt(sdx * sdx + sdz * sdz);
                }

                // Resoudre la position X du trou
                var tx = trou.x || 0;
                if (trou.alignement) {
                    switch (trou.alignement) {
                        case 'start': tx = 0; break;
                        case 'center': tx = (segLen - trou.largeur) / 2; break;
                        case 'end': tx = segLen - trou.largeur; break;
                    }
                    tx += (trou.decalage || 0);
                }
                var ty = trou.y || 0;
                var tl = trou.largeur;
                var th = trou.hauteur;

                // Clamper aux limites du segment reel
                if (tx < 0) { tl += tx; tx = 0; }
                if (ty < 0) { th += ty; ty = 0; }
                if (tx + tl > segLen) tl = segLen - tx;
                if (ty + th > hMur) th = hMur - ty;
                if (tl < 0.05 || th < 0.05) return false;

                // Toujours utiliser la methode simple (trou dans params)
                // Le moteur de briques et les joints gerent les trous qui touchent les bords
                trou.x = tx;
                trou.y = ty;
                trou.largeur = tl;
                trou.hauteur = th;
                if (!el.params.trous) el.params.trous = [];
                el.params.trous.push(trou);
                this._reconstruire(el);
                return true;

                // Code split conserve mais plus utilise
                // Si le trou touche un bord : decouper en morceaux
                var trousExistants = p.trous ? JSON.parse(JSON.stringify(p.trous)) : [];
                var base = JSON.parse(JSON.stringify(p));
                delete base.trous;
                delete base.nbCotes;
                delete base.angleDepart;
                base.angle = angle;

                var groupeId = p.groupeId;
                this.supprimer(id);

                var defs = [];
                if (tx > 0.01) defs.push({ lx: 0, ly: 0, w: tx, h: hMur });
                if (tx + tl < dist - 0.01) defs.push({ lx: tx + tl, ly: 0, w: dist - (tx + tl), h: hMur });
                if (ty > 0.01) defs.push({ lx: tx, ly: 0, w: tl, h: ty });
                if (ty + th < hMur - 0.01) defs.push({ lx: tx, ly: ty + th, w: tl, h: hMur - (ty + th) });

                var ids = [];
                for (var d = 0; d < defs.length; d++) {
                    var df = defs[d];
                    var m = JSON.parse(JSON.stringify(base));
                    m.x = ox + cosA * df.lx;
                    m.z = oz + sinA * df.lx;
                    m.distance = df.w;
                    m.hauteur = df.h;
                    m.y = oy + df.ly;

                    for (var te = 0; te < trousExistants.length; te++) {
                        var te2 = trousExistants[te];
                        var tex = te2.x || 0;
                        var tey = te2.y || 0;
                        if (tex < df.lx + df.w && tex + te2.largeur > df.lx &&
                            tey < df.ly + df.h && tey + te2.hauteur > df.ly) {
                            var nt = JSON.parse(JSON.stringify(te2));
                            nt.x = tex - df.lx;
                            nt.y = tey - df.ly;
                            if (!m.trous) m.trous = [];
                            m.trous.push(nt);
                        }
                    }

                    if (groupeId) m.groupeId = groupeId;
                    var newEl = this.ajouterMur(m);
                    if (newEl) ids.push(newEl.id);
                }

                if (ids.length > 1) this.grouperElements(ids);
                return true;
            }
        }
        return false;
    }

    // Ajouter une zone d'exclusion (position monde)
    ajouterExclusion(worldX, worldZ, y, largeur, hauteur, angle, forme, group3D) {
        var excl = {
            id: Date.now(),
            x: worldX,
            z: worldZ,
            y: y,
            largeur: largeur,
            hauteur: hauteur,
            angle: angle || 0,
            forme: forme || 'rect',
            group3D: group3D || null,
            _creation: null,  // sera rempli par Porte._placer ou Fenetre._placer
            _type: null       // 'porte' ou 'fenetre'
        };
        this.exclusions.push(excl);
        return excl;
    }

    // Supprimer une exclusion par id
    supprimerExclusion(exclId) {
        for (var i = 0; i < this.exclusions.length; i++) {
            if (this.exclusions[i].id === exclId) {
                var excl = this.exclusions[i];
                if (excl.group3D) {
                    this.scene.remove(excl.group3D);
                }
                this.exclusions.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    // Convertir les exclusions monde en trous locaux pour un mur donne
    // Supprimer le trou d'un element qui correspond a une exclusion (fenetre/porte)
    supprimerTrouParExclusion(excl) {
        for (var e = 0; e < this.elements.length; e++) {
            var el = this.elements[e];
            var p = el.params;
            if (!p.trous || p.trous.length === 0) continue;
            var oy = p.y || 0;
            var segs = this._segments(p);

            // Tester chaque face (segment) du mur
            for (var si = 0; si < segs.length; si++) {
                var seg = segs[si];
                var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
                var slen = Math.sqrt(sdx * sdx + sdz * sdz);
                if (slen < 0.01) continue;
                var snx = sdx / slen, snz = sdz / slen;
                var perpX = -sdz / slen, perpZ = sdx / slen;

                // Distance perpendiculaire de l'exclusion a ce segment
                var ddx = excl.x - seg.x1, ddz = excl.z - seg.z1;
                var perpDist = Math.abs(ddx * perpX + ddz * perpZ);
                if (perpDist > 0.25) continue;

                // Position locale sur le segment
                var localX = ddx * snx + ddz * snz;
                var tx = localX - excl.largeur / 2;
                var ty = excl.y - oy;

                // Chercher le trou le plus proche sur cette face
                var bestIdx = -1;
                var bestDist = 0.50;
                for (var t = 0; t < p.trous.length; t++) {
                    var tr = p.trous[t];
                    if ((tr.mur || 0) !== si) continue;
                    var dtx = Math.abs((tr.x || 0) - tx);
                    var dty = Math.abs((tr.y || 0) - ty);
                    var dl = Math.abs(tr.largeur - excl.largeur);
                    var dh = Math.abs(tr.hauteur - excl.hauteur);
                    var d = dtx + dty + dl + dh;
                    if (d < bestDist) {
                        bestDist = d;
                        bestIdx = t;
                    }
                }

                if (bestIdx >= 0) {
                    p.trous.splice(bestIdx, 1);
                    this._reconstruire(el);
                    return true;
                }
            }
        }
        return false;
    }

    // Realigner les exclusions (fenetres/portes 3D) sur les trous des murs
    realignerExclusions() {
        for (var i = 0; i < this.exclusions.length; i++) {
            var excl = this.exclusions[i];
            if (!excl.group3D) continue;

            // Trouver le mur et le trou correspondant
            for (var e = 0; e < this.elements.length; e++) {
                var el = this.elements[e];
                var p = el.params;
                if (!p.trous || p.trous.length === 0) continue;

                var segs = this._segments(p);
                for (var s = 0; s < segs.length; s++) {
                    var seg = segs[s];
                    var sdx = seg.x2 - seg.x1;
                    var sdz = seg.z2 - seg.z1;
                    var sLen = Math.sqrt(sdx * sdx + sdz * sdz);
                    if (sLen < 0.01) continue;
                    var snx = sdx / sLen;
                    var snz = sdz / sLen;

                    // Normale perpendiculaire du segment + epaisseur
                    var perpX = -sdz / sLen, perpZ = sdx / sLen;
                    var bt = (typeof BRIQUES_TYPES !== 'undefined' && p.briqueType && BRIQUES_TYPES[p.briqueType]) ? BRIQUES_TYPES[p.briqueType] : null;
                    var epOff = bt ? bt.epaisseur / 2 : 0.06;

                    // Chercher le trou qui correspond a cette exclusion (par taille)
                    for (var t = 0; t < p.trous.length; t++) {
                        var tr = p.trous[t];
                        if ((tr.mur || 0) !== s) continue;
                        if (Math.abs(tr.largeur - excl.largeur) > 0.05) continue;
                        if (Math.abs(tr.hauteur - excl.hauteur) > 0.05) continue;

                        // Verifier que l'exclusion est proche de ce trou
                        var trouCentreX = seg.x1 + snx * ((tr.x || 0) + tr.largeur / 2);
                        var trouCentreZ = seg.z1 + snz * ((tr.x || 0) + tr.largeur / 2);
                        var ddx = excl.x - trouCentreX;
                        var ddz = excl.z - trouCentreZ;
                        var dist2 = ddx * ddx + ddz * ddz;

                        if (dist2 < 2.0) { // tolerance 1.4m
                            // Determiner de quel cote est l'exclusion (garder le meme cote)
                            var sideSign = (ddx * perpX + ddz * perpZ) >= 0 ? 1 : -1;
                            // Realigner la position monde de l'exclusion sur le trou + offset epaisseur
                            excl.x = trouCentreX + perpX * epOff * sideSign;
                            excl.z = trouCentreZ + perpZ * epOff * sideSign;
                            excl.y = (tr.y || 0) + (p.y || 0);
                            excl.group3D.position.x = excl.x;
                            excl.group3D.position.z = excl.z;
                            excl.group3D.position.y = excl.y;
                            // Rotation = angle du segment
                            var segAngle = Math.atan2(sdz, sdx);
                            excl.group3D.rotation.y = -segAngle;
                        }
                    }
                }
            }
        }
    }

    _exclusionsVersTrous(params) {
        var trous = [];
        var angle = params.angle || 0;
        var rad = angle * Math.PI / 180;
        var cosA = Math.cos(rad);
        var sinA = Math.sin(rad);
        var ox = params.x || 0;
        var oz = params.z || 0;
        var oy = params.y || 0;
        var dist = params.distance || 5;
        var hMur = params.hauteur || 2.5;

        for (var i = 0; i < this.exclusions.length; i++) {
            var excl = this.exclusions[i];
            // Convertir position monde en position locale du mur
            var dx = excl.x - ox;
            var dz = excl.z - oz;
            // Projeter sur l'axe du mur
            var localX = dx * cosA + dz * sinA;
            // Distance perpendiculaire au mur
            var perpDist = Math.abs(-dx * sinA + dz * cosA);

            // Si trop loin du mur (> epaisseur), ignorer
            if (perpDist > 0.15) continue;

            // Position locale du trou
            var tx = localX - excl.largeur / 2;
            var ty = excl.y - oy;

            // Clamper le trou aux limites du mur
            var tl = excl.largeur;
            var th = excl.hauteur;
            if (tx < 0) { tl += tx; tx = 0; }
            if (ty < 0) { th += ty; ty = 0; }
            if (tx + tl > dist) tl = dist - tx;
            if (ty + th > hMur) th = hMur - ty;

            // Ignorer si trop petit apres clampage
            if (tl < 0.05 || th < 0.05) continue;

            trous.push({
                x: tx,
                y: ty,
                largeur: tl,
                hauteur: th,
                forme: excl.forme
            });
        }
        return trous;
    }

    // Detecter les zones occupees par les murs existants et les convertir en trous
    _chevauchementsVersTrous(params, ignoreId) {
        var trous = [];
        var angle = params.angle || 0;
        var rad = angle * Math.PI / 180;
        var cosA = Math.cos(rad);
        var sinA = Math.sin(rad);
        var ox = params.x || 0;
        var oz = params.z || 0;
        var oy = params.y || 0;
        var dist = params.distance || 5;
        var hMur = params.hauteur || 2.5;
        var eps = 0.15; // epaisseur mur

        var newSegs = this._segments(params);

        for (var i = 0; i < this.elements.length; i++) {
            var el = this.elements[i];
            if (ignoreId && el.id === ignoreId) continue;
            var existSegs = this._segments(el.params);

            for (var n = 0; n < newSegs.length; n++) {
                for (var s = 0; s < existSegs.length; s++) {
                    var a = newSegs[n];
                    var b = existSegs[s];

                    // Direction du nouveau mur
                    var dax = a.x2 - a.x1, daz = a.z2 - a.z1;
                    var la = Math.sqrt(dax * dax + daz * daz);
                    if (la < 0.01) continue;
                    var nax = dax / la, naz = daz / la;

                    // Direction du mur existant
                    var dbx = b.x2 - b.x1, dbz = b.z2 - b.z1;
                    var lb = Math.sqrt(dbx * dbx + dbz * dbz);
                    if (lb < 0.01) continue;

                    // Paralleles ?
                    var cross = Math.abs(nax * (dbz / lb) - naz * (dbx / lb));
                    if (cross > 0.1) continue;

                    // Distance perpendiculaire
                    var dx = b.x1 - a.x1, dz = b.z1 - a.z1;
                    var perpDist = Math.abs(dx * (-naz) + dz * nax);
                    if (perpDist > eps) continue;

                    // Projeter le mur existant sur l'axe du nouveau mur
                    var projB1 = dx * nax + dz * naz;
                    var projB2 = (b.x2 - a.x1) * nax + (b.z2 - a.z1) * naz;
                    var minB = Math.min(projB1, projB2);
                    var maxB = Math.max(projB1, projB2);

                    // Zone de chevauchement sur l'axe
                    var overStart = Math.max(0, minB);
                    var overEnd = Math.min(la, maxB);

                    if (overEnd - overStart > 0.01) {
                        // Zone occupee : hauteur du mur existant
                        var existH = el.params.hauteur || 2.5;
                        var existY = el.params.y || 0;
                        // Chevauchement en Y
                        var yStart = Math.max(0, existY - oy);
                        var yEnd = Math.min(hMur, existY + existH - oy);
                        if (yEnd - yStart > 0.01) {
                            trous.push({
                                x: overStart,
                                y: yStart,
                                largeur: overEnd - overStart,
                                hauteur: yEnd - yStart
                            });
                        }
                    }
                }
            }
        }
        return trous;
    }

    // Ajouter un trou arrondi (utilise le systeme de trou direct, pas le split)
    ajouterTrouArrondi(id, trou) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                var el = this.elements[i];
                trou.forme = 'arrondi';
                if (!el.params.trous) el.params.trous = [];
                el.params.trous.push(trou);
                this._reconstruire(el);
                return true;
            }
        }
        return false;
    }

    ajouterTrouRond(id, trou) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                var el = this.elements[i];
                trou.forme = 'rond';
                if (!el.params.trous) el.params.trous = [];
                el.params.trous.push(trou);
                this._reconstruire(el);
                return true;
            }
        }
        return false;
    }

    // Creer une fenetre arrondie (vitre + cadre) dans la scene
    creerFenetreArrondie(worldX, worldZ, y, largeur, hauteur, angle) {
        var rad = angle * Math.PI / 180;
        var epaisseur = 0.05;
        var rayon = largeur / 2;
        var hautDroit = hauteur - rayon; // partie rectangulaire
        if (hautDroit < 0.1) hautDroit = 0.1;

        // Forme arrondie : rectangle + demi-cercle en haut
        var shape = new THREE.Shape();
        shape.moveTo(-largeur / 2, 0);
        shape.lineTo(largeur / 2, 0);
        shape.lineTo(largeur / 2, hautDroit);
        shape.absarc(0, hautDroit, rayon, 0, Math.PI, false);
        shape.lineTo(-largeur / 2, 0);

        // Vitre (bleu clair transparent)
        var vitreGeo = new THREE.ShapeGeometry(shape);
        var vitreMat = new THREE.MeshBasicMaterial({
            color: '#87CEEB',
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        var vitre = new THREE.Mesh(vitreGeo, vitreMat);
        vitre.renderOrder = 2;

        // Cadre (bleu plus fonce)
        var cadreEp = 0.04; // epaisseur du cadre
        var shapeExt = new THREE.Shape();
        shapeExt.moveTo(-largeur / 2, 0);
        shapeExt.lineTo(largeur / 2, 0);
        shapeExt.lineTo(largeur / 2, hautDroit);
        shapeExt.absarc(0, hautDroit, rayon, 0, Math.PI, false);
        shapeExt.lineTo(-largeur / 2, 0);

        var ri = rayon - cadreEp;
        var hdi = hautDroit;
        var li = largeur / 2 - cadreEp;
        var holeShape = new THREE.Path();
        holeShape.moveTo(-li, cadreEp);
        holeShape.lineTo(li, cadreEp);
        holeShape.lineTo(li, hdi);
        holeShape.absarc(0, hdi, ri, 0, Math.PI, false);
        holeShape.lineTo(-li, cadreEp);
        shapeExt.holes.push(holeShape);

        var cadreGeo = new THREE.ExtrudeGeometry(shapeExt, { depth: epaisseur, bevelEnabled: false });
        var cadreMat = new THREE.MeshStandardMaterial({ color: '#4a90d9', roughness: 0.3 });
        var cadre = new THREE.Mesh(cadreGeo, cadreMat);
        cadre.position.z = -epaisseur / 2;

        // Barre horizontale au milieu
        var barreGeo = new THREE.BoxGeometry(largeur - cadreEp * 2, cadreEp, epaisseur);
        var barre = new THREE.Mesh(barreGeo, cadreMat);
        barre.position.set(0, hautDroit * 0.5, 0);

        // Barre verticale
        var barreVGeo = new THREE.BoxGeometry(cadreEp, hautDroit - cadreEp, epaisseur);
        var barreV = new THREE.Mesh(barreVGeo, cadreMat);
        barreV.position.set(0, (hautDroit - cadreEp) / 2 + cadreEp, 0);

        // Groupe
        var group = new THREE.Group();
        group.add(vitre);
        group.add(cadre);
        group.add(barre);
        group.add(barreV);

        // Positionner dans le monde
        group.position.set(worldX, y, worldZ);
        group.rotation.y = -rad;

        this.scene.add(group);

        // Taguer tous les objets de la fenetre pour detection au clic
        group.traverse(function(child) {
            child.userData.isFenetre = true;
        });

        // Enregistrer la zone d'exclusion
        var excl = this.ajouterExclusion(worldX, worldZ, y, largeur, hauteur, angle, 'arrondi', group);
        group.userData.exclusionId = excl.id;

        return group;
    }

    // Reconstruire un element (vider + refaire avec ses params)
    _reconstruire(el) {
        this._viderElement(el);
        var p = el.params;
        p._ignoreId = el.id;

        if (p.bicolore) {
            var group = new THREE.Group();
            this.scene.add(group);
            var brique1 = this._construireBrique(p, p.couleur, p.opacite, p.jointCouleur, p.jointOpacite, [2, 1], 1);
            var brique2 = this._construireBrique(p, p.bicolore.couleur2, p.bicolore.opacite2, p.jointCouleur, p.jointOpacite, [2, 2], 2);
            this.scene.remove(brique1.group);
            this.scene.remove(brique2.group);
            group.add(brique1.group);
            group.add(brique2.group);
            el.brique = brique1;
            el.brique2 = brique2;
            el.group = group;
        } else {
            var brique = this._construireBrique(p, p.couleur, p.opacite, p.jointCouleur, p.jointOpacite, null, null);
            el.brique = brique;
            delete el.brique2;
            delete el.group;
        }
        delete p._ignoreId;
        this._taguerElement(el);
    }

    // Taguer tous les objets 3D d'un element avec son id
    _taguerElement(el) {
        var rootGroup = el.group || el.brique.group;
        rootGroup.traverse(function(child) {
            child.userData.editeurId = el.id;
        });
    }

    // Vider un element (supprimer ses objets 3D)
    _viderElement(el) {
        el.brique.vider();
        if (el.brique2) el.brique2.vider();
        if (el.group) {
            this.scene.remove(el.group);
        } else {
            this.scene.remove(el.brique.group);
        }
    }

    // Trouver quel segment (mur index) et position locale a partir d'un point monde
    trouverPositionSurMur(element, worldX, worldZ) {
        var segs = this._segments(element.params);
        var bestDist = Infinity;
        var bestMur = 0;
        var bestLocalX = 0;

        for (var i = 0; i < segs.length; i++) {
            var s = segs[i];
            var dx = s.x2 - s.x1, dz = s.z2 - s.z1;
            var len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) continue;
            var nx = dx / len, nz = dz / len;

            // Projection du point sur le segment
            var px = worldX - s.x1, pz = worldZ - s.z1;
            var proj = px * nx + pz * nz;
            proj = Math.max(0, Math.min(len, proj));

            // Distance perpendiculaire
            var closestX = s.x1 + nx * proj;
            var closestZ = s.z1 + nz * proj;
            var dist = Math.sqrt((worldX - closestX) * (worldX - closestX) + (worldZ - closestZ) * (worldZ - closestZ));

            if (dist < bestDist) {
                bestDist = dist;
                bestMur = i;
                bestLocalX = proj;
            }
        }

        return { mur: bestMur, localX: bestLocalX };
    }

    // Redimensionner un mur depuis un cote
    // cote: 'debut' ou 'fin'
    // newDistance: nouvelle longueur
    redimensionnerMur(id, cote, newDistance) {
        if (newDistance < 0.3) newDistance = 0.3;
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                var el = this.elements[i];
                var p = el.params;
                if (cote === 'debut') {
                    // Deplacer l'origine pour garder la fin fixe
                    var rad = (p.angle || 0) * Math.PI / 180;
                    var delta = newDistance - p.distance;
                    p.x = (p.x || 0) - Math.cos(rad) * delta;
                    p.z = (p.z || 0) - Math.sin(rad) * delta;
                }
                p.distance = newDistance;
                this._reconstruire(el);
                return true;
            }
        }
        return false;
    }

    // Obtenir les extremites d'un mur (debut et fin)
    extremitesMur(el) {
        var p = el.params;
        var rad = (p.angle || 0) * Math.PI / 180;
        var x1 = p.x || 0, z1 = p.z || 0;
        var x2 = x1 + Math.cos(rad) * p.distance;
        var z2 = z1 + Math.sin(rad) * p.distance;
        return { x1: x1, z1: z1, x2: x2, z2: z2, angle: p.angle || 0 };
    }

    // Deplacer un element vers une nouvelle position
    deplacerMur(id, newX, newZ) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                var el = this.elements[i];
                el.params.x = newX;
                el.params.z = newZ;
                this._reconstruire(el);
                return true;
            }
        }
        return false;
    }

    // Pivoter un element (ajouter un delta d'angle)
    pivoterMur(id, deltaAngle) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                var el = this.elements[i];
                if (el.params.nbCotes && el.params.nbCotes > 1) {
                    el.params.angleDepart = ((el.params.angleDepart || 0) + deltaAngle) % 360;
                } else {
                    el.params.angle = ((el.params.angle || 0) + deltaAngle) % 360;
                }
                this._reconstruire(el);
                return true;
            }
        }
        return false;
    }

    // Changer la couleur de tous les elements
    changerCouleurTous(couleur, opacite, jointCouleur, jointOpacite) {
        for (var i = 0; i < this.elements.length; i++) {
            var el = this.elements[i];
            el.params.couleur = couleur;
            if (opacite !== undefined) el.params.opacite = opacite;
            if (jointCouleur !== undefined) el.params.jointCouleur = jointCouleur;
            if (jointOpacite !== undefined) el.params.jointOpacite = jointOpacite;
            if (el.params.bicolore) {
                el.params.bicolore.couleur2 = couleur;
                if (opacite !== undefined) el.params.bicolore.opacite2 = opacite;
            }
            this._reconstruire(el);
        }
    }

    // Supprimer un element par son id
    supprimer(id) {
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i].id === id) {
                this._viderElement(this.elements[i]);
                this.elements.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    // Vider tout
    viderTout() {
        for (var i = 0; i < this.elements.length; i++) {
            this._viderElement(this.elements[i]);
        }
        this.elements = [];
    }

    // Compter les briques totales
    compterBriques() {
        var total = 0;
        for (var i = 0; i < this.elements.length; i++) {
            total += this.elements[i].brique.compter();
        }
        return total;
    }

    // Calculer toutes les surfaces en m²
    calculerSurfaceTotale() {
        var totalMurM2 = 0;    // surface des murs (briques)
        var totalLineaire = 0;  // metres lineaires
        var totalSolM2 = 0;     // surface au sol
        var totalTrousM2 = 0;   // surface portes/fenetres
        var details = [];

        for (var i = 0; i < this.elements.length; i++) {
            var p = this.elements[i].params;
            var dist = p.distance || 0;
            var haut = p.hauteur || 2.5;
            var nbCotes = p.nbCotes || 1;

            // Surface brute des murs
            var surfBrute = dist * haut * nbCotes;

            // Surface des trous (portes/fenetres)
            var surfTrous = 0;
            if (p.trous) {
                for (var t = 0; t < p.trous.length; t++) {
                    surfTrous += (p.trous[t].largeur || 0) * (p.trous[t].hauteur || 0);
                }
            }
            // Soustraire aussi les exclusions sur ce mur
            var segs = this._segments(p);
            for (var ex = 0; ex < this.exclusions.length; ex++) {
                var excl = this.exclusions[ex];
                // Verifier si l'exclusion est sur ce mur
                for (var s = 0; s < segs.length; s++) {
                    var seg = segs[s];
                    var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
                    var slen = Math.sqrt(sdx * sdx + sdz * sdz);
                    if (slen < 0.01) continue;
                    var snx = sdx / slen, snz = sdz / slen;
                    // Projeter l'exclusion sur le segment
                    var dx = excl.x - seg.x1, dz = excl.z - seg.z1;
                    var projAlong = dx * snx + dz * snz;
                    var projPerp = Math.abs(-dx * snz + dz * snx);
                    if (projPerp < 0.5 && projAlong > -0.5 && projAlong < slen + 0.5) {
                        surfTrous += (excl.largeur || 0) * (excl.hauteur || 0);
                    }
                }
            }

            var surfNette = surfBrute - surfTrous;
            if (surfNette < 0) surfNette = 0;

            totalMurM2 += surfNette;
            totalTrousM2 += surfTrous;
            totalLineaire += dist * nbCotes;

            // Surface au sol interieure (loi Carrez) pour les polygones
            var nbc = parseInt(nbCotes) || 0;
            if (nbc >= 3) {
                var bt = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[p.briqueType]) ? BRIQUES_TYPES[p.briqueType] : { epaisseur: 0.11 };
                var coteInt = dist - 2 * bt.epaisseur;
                if (coteInt < 0) coteInt = 0;
                totalSolM2 += (nbc * coteInt * coteInt / 4) / Math.tan(Math.PI / nbc);
            }

            details.push({
                nom: this.elements[i].nom || ('Mur ' + this.elements[i].id),
                distance: dist, hauteur: haut, nbCotes: nbCotes,
                surfBrute: surfBrute, surfTrous: surfTrous, surfNette: surfNette
            });
        }

        // Surface au sol interieure (loi Carrez) pour les pieces detectees
        // = surface axe central - perimetre * demi-epaisseur mur
        if (totalSolM2 === 0) {
            try {
                var pieces = this.detecterPiecesFermees();
                if (pieces && pieces.length > 0) {
                    for (var pi = 0; pi < pieces.length; pi++) {
                        var face = pieces[pi];
                        var aireAxe = face.aire || 0;
                        if (aireAxe <= 0) continue;
                        // Calculer le perimetre de la face
                        var perimetre = 0;
                        var pts = face.points;
                        if (pts) {
                            for (var fp = 0; fp < pts.length; fp++) {
                                var fpn = (fp + 1) % pts.length;
                                perimetre += Math.sqrt(Math.pow(pts[fpn].x - pts[fp].x, 2) + Math.pow(pts[fpn].z - pts[fp].z, 2));
                            }
                        }
                        // Epaisseur moyenne des murs
                        var epMoy = 0.11;
                        if (this.elements.length > 0) {
                            var sumEp = 0;
                            for (var em = 0; em < this.elements.length; em++) {
                                var bType = this.elements[em].params.briqueType || 'standard';
                                var btInfo = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[bType]) ? BRIQUES_TYPES[bType] : { epaisseur: 0.11 };
                                sumEp += btInfo.epaisseur;
                            }
                            epMoy = sumEp / this.elements.length;
                        }
                        // Surface interieure = surface axe - perimetre * demi-epaisseur
                        var aireInt = aireAxe - perimetre * epMoy / 2;
                        if (aireInt < 0) aireInt = 0;
                        totalSolM2 += aireInt;
                    }
                }
            } catch(e) {}
        }

        return {
            totalMurM2: totalMurM2,       // surface nette des murs (- portes/fenetres)
            totalMurBrut: totalMurM2 + totalTrousM2, // surface brute
            totalTrousM2: totalTrousM2,   // surface des ouvertures
            totalLineaire: totalLineaire, // metres lineaires
            totalSolM2: totalSolM2,       // surface au sol
            details: details
        };
    }

    // ========================================
    // Traits au sol — lignes de delimitation
    // ========================================

    // params: {x1, z1, x2, z2, couleur, tirets, rempli} — rectangle defini par 2 coins opposes
    ajouterTrait(params) {
        this._traitId++;
        var couleur = params.couleur || '#4a9eff';
        var tirets = params.tirets !== false;
        var rempli = params.rempli || false;

        var group = this._construireTraitGroup(params);
        this.scene.add(group);

        var trait = {
            id: this._traitId,
            line: group,
            params: JSON.parse(JSON.stringify(params))
        };
        trait.params.couleur = couleur;
        trait.params.tirets = tirets;
        trait.params.rempli = rempli;
        group.userData.traitId = trait.id;

        this.traits.push(trait);
        return trait;
    }

    _construireTraitGroup(params) {
        var couleur = params.couleur || '#4a9eff';
        var tirets = params.tirets !== false;
        var rempli = params.rempli || false;
        var ax = params.x1, az = params.z1;
        var bx = params.x2, bz = params.z2;
        var coins = [
            { x: ax, z: az }, { x: bx, z: az },
            { x: bx, z: bz }, { x: ax, z: bz }
        ];

        var group = new THREE.Group();

        // Sol rempli
        if (rempli) {
            var w = Math.abs(bx - ax), h = Math.abs(bz - az);
            if (w > 0.01 && h > 0.01) {
                var solGeo = new THREE.PlaneGeometry(w, h);
                var solMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(couleur),
                    transparent: true, opacity: 0.55,
                    side: THREE.DoubleSide, depthWrite: false
                });
                var sol = new THREE.Mesh(solGeo, solMat);
                sol.rotation.x = -Math.PI / 2;
                sol.position.set((ax + bx) / 2, 0.025, (az + bz) / 2);
                sol.userData._traitSol = true;
                group.add(sol);
            }
        }

        // 4 cotes
        for (var i = 0; i < 4; i++) {
            var c1 = coins[i], c2 = coins[(i + 1) % 4];
            var pts = [
                new THREE.Vector3(c1.x, 0.04, c1.z),
                new THREE.Vector3(c2.x, 0.04, c2.z)
            ];
            var geo = new THREE.BufferGeometry().setFromPoints(pts);
            var mat;
            if (tirets) {
                mat = new THREE.LineDashedMaterial({
                    color: new THREE.Color(couleur), linewidth: 3,
                    dashSize: 0.15, gapSize: 0.1
                });
            } else {
                mat = new THREE.LineBasicMaterial({
                    color: new THREE.Color(couleur), linewidth: 3
                });
            }
            var line = new THREE.Line(geo, mat);
            if (tirets) line.computeLineDistances();
            group.add(line);
        }

        return group;
    }

    supprimerTrait(id) {
        for (var i = 0; i < this.traits.length; i++) {
            if (this.traits[i].id === id) {
                var g = this.traits[i].line;
                this.scene.remove(g);
                // Dispose children
                for (var c = g.children.length - 1; c >= 0; c--) {
                    g.children[c].geometry.dispose();
                    g.children[c].material.dispose();
                }
                this.traits.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    reconstruireTrait(trait) {
        // Supprimer l'ancien group
        var g = trait.line;
        var wasVisible = g.visible;
        this.scene.remove(g);
        for (var c = g.children.length - 1; c >= 0; c--) {
            g.children[c].geometry.dispose();
            g.children[c].material.dispose();
            g.remove(g.children[c]);
        }

        var group = this._construireTraitGroup(trait.params);
        group.userData.traitId = trait.id;
        group.visible = wasVisible;
        this.scene.add(group);
        trait.line = group;
    }

    trouverTraitParId(id) {
        for (var i = 0; i < this.traits.length; i++) {
            if (this.traits[i].id === id) return this.traits[i];
        }
        return null;
    }

    // Segments des traits (rectangles) pour la detection de pieces fermees
    _segmentsTraits() {
        var segs = [];
        for (var i = 0; i < this.traits.length; i++) {
            var p = this.traits[i].params;
            var ax = p.x1, az = p.z1, bx = p.x2, bz = p.z2;
            // 4 cotes du rectangle
            segs.push({ x1: ax, z1: az, x2: bx, z2: az }); // bas
            segs.push({ x1: bx, z1: az, x2: bx, z2: bz }); // droite
            segs.push({ x1: bx, z1: bz, x2: ax, z2: bz }); // haut
            segs.push({ x1: ax, z1: bz, x2: ax, z2: az }); // gauche
        }
        return segs;
    }

    // Detecter les pieces fermees (polygones clos formes par les murs)
    detecterPiecesFermees() {
        var tol = 0.25; // tolerance pour fusionner les points proches
        var allSegs = [];

        // 1. Collecter tous les segments de tous les murs + traits au sol
        for (var i = 0; i < this.elements.length; i++) {
            var segs = this._segments(this.elements[i].params);
            for (var s = 0; s < segs.length; s++) {
                allSegs.push({ x1: segs[s].x1, z1: segs[s].z1, x2: segs[s].x2, z2: segs[s].z2 });
            }
        }
        var traitSegs = this._segmentsTraits();
        for (var i = 0; i < traitSegs.length; i++) {
            allSegs.push({ x1: traitSegs[i].x1, z1: traitSegs[i].z1, x2: traitSegs[i].x2, z2: traitSegs[i].z2 });
        }

        if (allSegs.length < 2) return [];

        // 2. Trouver les intersections entre segments et les jonctions en T
        //    (un endpoint qui tombe sur un autre segment)
        var splitPoints = []; // [{segIdx, t, x, z}] — points ou couper les segments

        for (var i = 0; i < allSegs.length; i++) {
            var a = allSegs[i];
            var ax = a.x2 - a.x1, az = a.z2 - a.z1;
            var aLen = Math.sqrt(ax * ax + az * az);
            if (aLen < 0.01) continue;

            for (var j = i + 1; j < allSegs.length; j++) {
                var b = allSegs[j];
                var bx = b.x2 - b.x1, bz = b.z2 - b.z1;
                var bLen = Math.sqrt(bx * bx + bz * bz);
                if (bLen < 0.01) continue;

                // Intersection segment-segment
                var cross = ax * bz - az * bx;
                if (Math.abs(cross) > 0.001) {
                    // Non paralleles — chercher l'intersection
                    var dx = b.x1 - a.x1, dz = b.z1 - a.z1;
                    var t = (dx * bz - dz * bx) / cross;
                    var u = (dx * az - dz * ax) / cross;
                    if (t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99) {
                        var ix = a.x1 + ax * t;
                        var iz = a.z1 + az * t;
                        splitPoints.push({ segIdx: i, t: t, x: ix, z: iz });
                        splitPoints.push({ segIdx: j, t: u, x: ix, z: iz });
                    }
                }

                // Jonction en T : endpoint de b sur segment a
                this._checkTJunction(b.x1, b.z1, a, i, tol, splitPoints);
                this._checkTJunction(b.x2, b.z2, a, i, tol, splitPoints);
                // Endpoint de a sur segment b
                this._checkTJunction(a.x1, a.z1, b, j, tol, splitPoints);
                this._checkTJunction(a.x2, a.z2, b, j, tol, splitPoints);
            }
        }

        // 3. Decouper les segments aux points de split
        // Grouper les splits par segment
        var splitsBySeg = {};
        for (var i = 0; i < splitPoints.length; i++) {
            var sp = splitPoints[i];
            if (!splitsBySeg[sp.segIdx]) splitsBySeg[sp.segIdx] = [];
            splitsBySeg[sp.segIdx].push(sp);
        }

        var finalSegs = [];
        for (var i = 0; i < allSegs.length; i++) {
            if (!splitsBySeg[i]) {
                finalSegs.push(allSegs[i]);
            } else {
                // Trier les splits par t croissant
                var splits = splitsBySeg[i];
                splits.sort(function(a, b) { return a.t - b.t; });
                // Deduplication
                var unique = [splits[0]];
                for (var k = 1; k < splits.length; k++) {
                    if (Math.abs(splits[k].t - unique[unique.length - 1].t) > 0.01) {
                        unique.push(splits[k]);
                    }
                }
                // Decouper
                var seg = allSegs[i];
                var prevX = seg.x1, prevZ = seg.z1;
                for (var k = 0; k < unique.length; k++) {
                    finalSegs.push({ x1: prevX, z1: prevZ, x2: unique[k].x, z2: unique[k].z });
                    prevX = unique[k].x;
                    prevZ = unique[k].z;
                }
                finalSegs.push({ x1: prevX, z1: prevZ, x2: seg.x2, z2: seg.z2 });
            }
        }

        // 4. Fusionner les points proches en noeuds
        var nodes = [];
        function findNode(x, z) {
            for (var i = 0; i < nodes.length; i++) {
                var dx = nodes[i].x - x, dz = nodes[i].z - z;
                if (Math.sqrt(dx * dx + dz * dz) < tol) return i;
            }
            nodes.push({ x: x, z: z });
            return nodes.length - 1;
        }

        // 5. Construire les aretes
        var edges = [];
        for (var i = 0; i < finalSegs.length; i++) {
            var s = finalSegs[i];
            var dx = s.x2 - s.x1, dz = s.z2 - s.z1;
            if (Math.sqrt(dx * dx + dz * dz) < 0.05) continue; // segment trop court
            var n1 = findNode(s.x1, s.z1);
            var n2 = findNode(s.x2, s.z2);
            if (n1 !== n2) {
                var doublon = false;
                for (var j = 0; j < edges.length; j++) {
                    if ((edges[j].n1 === n1 && edges[j].n2 === n2) ||
                        (edges[j].n1 === n2 && edges[j].n2 === n1)) {
                        doublon = true; break;
                    }
                }
                if (!doublon) edges.push({ n1: n1, n2: n2 });
            }
        }

        // 6. Construire l'adjacence triee par angle
        var adj = [];
        for (var i = 0; i < nodes.length; i++) adj.push([]);
        for (var i = 0; i < edges.length; i++) {
            var e = edges[i];
            var a1 = Math.atan2(nodes[e.n2].z - nodes[e.n1].z, nodes[e.n2].x - nodes[e.n1].x);
            var a2 = Math.atan2(nodes[e.n1].z - nodes[e.n2].z, nodes[e.n1].x - nodes[e.n2].x);
            adj[e.n1].push({ to: e.n2, angle: a1 });
            adj[e.n2].push({ to: e.n1, angle: a2 });
        }
        for (var i = 0; i < adj.length; i++) {
            adj[i].sort(function(a, b) { return a.angle - b.angle; });
        }

        // 7. Face traversal — pour chaque demi-arete, trouver la face
        var visited = {};
        var faces = [];

        for (var i = 0; i < edges.length; i++) {
            for (var dir = 0; dir < 2; dir++) {
                var startFrom = dir === 0 ? edges[i].n1 : edges[i].n2;
                var startTo = dir === 0 ? edges[i].n2 : edges[i].n1;
                var key = startFrom + '-' + startTo;
                if (visited[key]) continue;

                var face = [startFrom];
                var from = startFrom;
                var to = startTo;
                var ok = true;

                for (var step = 0; step < 200; step++) {
                    var k = from + '-' + to;
                    if (visited[k]) { ok = false; break; }
                    visited[k] = true;
                    face.push(to);

                    if (to === startFrom && face.length > 3) break;

                    var arrivalAngle = Math.atan2(nodes[from].z - nodes[to].z, nodes[from].x - nodes[to].x);
                    var neighbors = adj[to];
                    var nextTo = -1;
                    var bestDiff = Infinity;

                    for (var j = 0; j < neighbors.length; j++) {
                        var diff = neighbors[j].angle - arrivalAngle;
                        while (diff <= 0) diff += Math.PI * 2;
                        while (diff > Math.PI * 2) diff -= Math.PI * 2;
                        if (diff < bestDiff && diff > 0.001) {
                            bestDiff = diff;
                            nextTo = neighbors[j].to;
                        }
                    }

                    if (nextTo === -1) { ok = false; break; }
                    from = to;
                    to = nextTo;
                }

                if (ok && face.length >= 4 && face[face.length - 1] === face[0]) {
                    var poly = [];
                    for (var j = 0; j < face.length - 1; j++) {
                        poly.push({ x: nodes[face[j]].x, z: nodes[face[j]].z });
                    }

                    var aire = 0;
                    for (var j = 0; j < poly.length; j++) {
                        var curr = poly[j];
                        var next = poly[(j + 1) % poly.length];
                        aire += (curr.x * next.z - next.x * curr.z);
                    }
                    aire /= 2;

                    var cx = 0, cz = 0;
                    for (var j = 0; j < poly.length; j++) {
                        cx += poly[j].x;
                        cz += poly[j].z;
                    }
                    cx /= poly.length;
                    cz /= poly.length;

                    if (Math.abs(aire) > 0.3) {
                        faces.push({
                            points: poly,
                            aire: Math.abs(aire),
                            aireSigne: aire,
                            centre: { x: cx, z: cz },
                            nodeIds: face.slice(0, face.length - 1)
                        });
                    }
                }
            }
        }

        // 8. Filtrer la face exterieure (la plus grande)
        if (faces.length > 1) {
            var maxAire = 0, maxIdx = -1;
            for (var i = 0; i < faces.length; i++) {
                if (faces[i].aire > maxAire) { maxAire = faces[i].aire; maxIdx = i; }
            }
            if (maxIdx >= 0) {
                var secondMax = 0;
                for (var i = 0; i < faces.length; i++) {
                    if (i !== maxIdx && faces[i].aire > secondMax) secondMax = faces[i].aire;
                }
                if (maxAire > secondMax * 1.5) {
                    faces.splice(maxIdx, 1);
                }
            }
        }

        // Retirer les doublons
        var uniques = [];
        for (var i = 0; i < faces.length; i++) {
            var ids = faces[i].nodeIds.slice().sort(function(a, b) { return a - b; }).join(',');
            var existe = false;
            for (var j = 0; j < uniques.length; j++) {
                var ids2 = uniques[j].nodeIds.slice().sort(function(a, b) { return a - b; }).join(',');
                if (ids === ids2) { existe = true; break; }
            }
            if (!existe) uniques.push(faces[i]);
        }

        return uniques;
    }

    // Verifier si un point tombe sur un segment (jonction en T)
    _checkTJunction(px, pz, seg, segIdx, tol, splitPoints) {
        var sx = seg.x2 - seg.x1, sz = seg.z2 - seg.z1;
        var sLen = Math.sqrt(sx * sx + sz * sz);
        if (sLen < 0.05) return;

        // Projection du point sur le segment
        var dx = px - seg.x1, dz = pz - seg.z1;
        var t = (dx * sx + dz * sz) / (sLen * sLen);
        if (t <= 0.02 || t >= 0.98) return; // trop pres des extremites

        // Distance perpendiculaire
        var projX = seg.x1 + sx * t;
        var projZ = seg.z1 + sz * t;
        var dist = Math.sqrt((px - projX) * (px - projX) + (pz - projZ) * (pz - projZ));

        if (dist < tol) {
            splitPoints.push({ segIdx: segIdx, t: t, x: projX, z: projZ });
        }
    }

    // Exporter en JSON
    exporterJSON(nom) {
        var data = {
            nom: nom || 'Construction',
            murs: [],
            traits: []
        };
        for (var i = 0; i < this.elements.length; i++) {
            data.murs.push(this.elements[i].params);
        }
        for (var i = 0; i < this.traits.length; i++) {
            data.traits.push(this.traits[i].params);
        }
        return JSON.stringify(data, null, 4);
    }

    // Importer un JSON
    importerJSON(jsonString) {
        var data = JSON.parse(jsonString);
        this.viderTout();
        // Supprimer les traits
        while (this.traits.length > 0) {
            this.supprimerTrait(this.traits[0].id);
        }
        if (data.murs) {
            for (var i = 0; i < data.murs.length; i++) {
                this.ajouterMur(data.murs[i]);
            }
        }
        if (data.traits) {
            for (var i = 0; i < data.traits.length; i++) {
                this.ajouterTrait(data.traits[i]);
            }
        }
        return data;
    }
}
