// ========================================
// Brique — Mur de briques complet avec trous
// ========================================
//
// Utilisation :
//   var mur = new Brique(scene);
//   mur.setCouleur('#8b6132');
//   mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
//   mur.construireForme(0, 0, 0, 5, 2.50, 4, 0);
//
// Methodes publiques :
//   setCouleur(couleur)            — couleur des briques
//   setCouleurJoint(couleur)       — couleur du joint (null = pas de joint)
//   setDimensions(l, h, e)         — longueur, hauteur, epaisseur de la brique
//   setJoint(j)                    — taille du joint
//   setVertical(val)               — true = briques debout
//   setIgnorer(tousLes, commencerVide) — ignorer des briques
//   ajouterTrou(x, y, largeur, hauteur, alignement, decalage, murIndex)
//   viderTrous()                   — supprimer tous les trous
//   construire(x, y, z, distance, hauteur, angle) — un seul mur
//   construireForme(x, y, z, distance, hauteur, nbCotes, angleDepart) — forme
//   getPositions(x, y, z, distance, hauteur) — connaitre les faces
//   compter()                      — nombre de briques
//   vider()                        — tout supprimer
//

class Brique {

    constructor(scene) {
        this.scene = scene;

        // Dimensions standard
        this.longueur = 0.22;
        this.hauteur = 0.065;
        this.epaisseur = 0.11;
        this.joint = 0.01;
        this.couleur = '#8B4513';
        this.couleurJoint = '#CCCCCC';
        this.vertical = false;

        // Materiaux
        this.material = new THREE.MeshStandardMaterial({
            color: this.couleur,
            roughness: 0.85
        });
        this.materialJoint = new THREE.MeshStandardMaterial({
            color: this.couleurJoint,
            roughness: 0.95,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1
        });

        // Groupe 3D
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Compteurs
        this._nbBriques = 0;
        this._nbTotal = 0;
        this._nbMurs = 0;
        this._ignorer = [];

        // Trous
        this._trous = [];

        // Donnees temporaires pour InstancedMesh
        this._brickData = [];
    }

    // --- Getters ---

    getLongueur() { return this.longueur; }
    getHauteur() { return this.hauteur; }
    getEpaisseur() { return this.epaisseur; }
    getJoint() { return this.joint; }
    getModuleL() { return (this.vertical ? this.hauteur : this.longueur) + this.joint; }
    getModuleH() { return (this.vertical ? this.longueur : this.hauteur) + this.joint; }
    compter() { return this._nbBriques; }

    // --- Setters ---

    setDimensions(l, h, e) { this.longueur = l; this.hauteur = h; this.epaisseur = e; }
    setJoint(j) { this.joint = j; }
    setVertical(val) { this.vertical = val; }

    setCouleur(couleur, opacite) {
        this.couleur = couleur;
        // Convertir 0-100 en 0-1 si necessaire
        var op = (opacite !== undefined && opacite !== null) ? opacite : 99;
        if (op > 1) op = op / 100;
        if (op > 0.99) op = 0.99;
        if (op < 0.01) op = 0.99;
        if (op >= 0.99) {
            // Opaque : materiau standard
            this.material = new THREE.MeshStandardMaterial({
                color: couleur,
                roughness: 0.85
            });
        } else {
            // Semi-transparent
            this.material = new THREE.MeshBasicMaterial({
                color: couleur,
                transparent: true,
                opacity: op,
                depthWrite: false,
                side: THREE.DoubleSide
            });
        }
    }

    // Priorite d'affichage — le dernier appele doit avoir le chiffre le plus haut
    // Evite le Z-fighting quand plusieurs couches sont au meme endroit
    // ex: setPriorite(1), setPriorite(2), setPriorite(3)...
    setPriorite(val) {
        this.material.polygonOffset = true;
        this.material.polygonOffsetFactor = -val;
        this.material.polygonOffsetUnits = -val;
    }

    setCouleurJoint(couleur, opacite) {
        this.couleurJoint = couleur;
        if (couleur) {
            var op = (opacite !== undefined && opacite !== null) ? opacite : 99;
            if (op > 1) op = op / 100;
            if (op > 0.99) op = 0.99;
            if (op < 0.01) op = 0.99;
            if (op >= 0.99) {
                this.materialJoint = new THREE.MeshStandardMaterial({
                    color: couleur, roughness: 0.95,
                    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
                });
            } else {
                this.materialJoint = new THREE.MeshBasicMaterial({
                    color: couleur,
                    transparent: true,
                    opacity: op,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
                });
            }
        } else {
            this.materialJoint = null;
        }
    }

    // Ignorer des briques a intervalle regulier
    // tousLes = intervalle (0 = aucune, 2 = une sur deux, 3 = une sur trois)
    // garder = quelle brique garder dans le cycle (1 = premiere, 2 = deuxieme, etc.)
    //          defaut = 1
    // ex: setIgnorer(2, 1) → garde 1, 3, 5, 7... (impaires)
    // ex: setIgnorer(2, 2) → garde 2, 4, 6, 8... (paires)
    // ex: setIgnorer(3, 1) → garde 1, 4, 7, 10...
    // ex: setIgnorer(3, 2) → garde 2, 5, 8, 11...
    // ex: setIgnorer(3, 3) → garde 3, 6, 9, 12...
    setIgnorer(tousLes, garder) {
        this._ignorer = [];
        garder = garder || 1;
        if (tousLes > 0) {
            for (var i = 1; i <= 5000; i++) {
                // Garder seulement la brique numero "garder" dans chaque cycle
                var positionDansCycle = ((i - 1) % tousLes) + 1;
                if (positionDansCycle !== garder) {
                    this._ignorer.push(i);
                }
            }
        }
    }

    // --- Trous ---

    // Ajouter un trou dans un mur
    // x = position horizontale (ignore si alignement)
    // y = position verticale depuis le bas (0 = sol)
    // largeur, hauteur = dimensions du trou
    // alignement = 'start', 'center', 'end', 'between', null
    // decalage = decalage apres alignement (+ droite, - gauche)
    // murIndex = sur quel mur (0, 1, 2, 3)
    ajouterTrou(x, y, largeur, hauteur, alignement, decalage, murIndex, forme) {
        this._trous.push({
            x: x || 0,
            y: y || 0,
            largeur: largeur,
            hauteur: hauteur,
            alignement: alignement || null,
            decalage: decalage || 0,
            mur: murIndex || 0,
            forme: forme || 'rect'
        });
    }

    viderTrous() {
        this._trous = [];
    }

    // --- Privee : pose UNE brique ---

    _ajouterUne(x, y, z, largeur) {
        var bLarg = this.vertical ? this.hauteur : this.longueur;
        var bHaut = this.vertical ? this.longueur : this.hauteur;
        var bw = largeur || bLarg;

        // Collecter les donnees (pas de mesh = rapide)
        this._brickData.push({
            x: x + bw / 2,
            y: y + bHaut / 2,
            z: this.epaisseur / 2,
            w: bw,
            h: bHaut,
            e: this.epaisseur
        });

        this._nbBriques++;
    }

    // --- Privee : pose UN RANG ---

    _ajouterRang(x, y, z, distance, rang) {
        var moduleL = this.getModuleL();
        var bLarg = this.vertical ? this.hauteur : this.longueur;
        var decalage = (rang % 2 === 0) ? 0 : moduleL / 2;
        var posX = -decalage;
        var nb = 0;

        while (posX < distance) {
            var bx = posX;
            var bw = bLarg;
            if (bx < 0) { bw = bw + bx; bx = 0; }
            if (bx + bw > distance) { bw = distance - bx; }

            if (bw > 0.005) {
                this._nbTotal++;
                if (this._ignorer.indexOf(this._nbTotal) === -1) {
                    this._ajouterUne(x + bx, y, z, bw);
                    nb++;
                }
            }
            posX += moduleL;
        }
        return nb;
    }

    // --- Publique : construire UN MUR ---

    construire(x, y, z, distance, hauteur, angle, murIndex) {
        angle = angle || 0;
        murIndex = murIndex || 0;

        var murGroup = new THREE.Group();
        var ancienGroup = this.group;
        this.group = murGroup;
        this._nbTotal = 0;
        this._brickData = [];
        if (murIndex === 0) this._allBrickData = [];

        var moduleH = this.getModuleH();
        var bHaut = this.vertical ? this.longueur : this.hauteur;
        var nbRangs = Math.ceil(hauteur / moduleH);

        // Collecter les trous de ce mur et calculer positions
        var trous = [];
        for (var t = 0; t < this._trous.length; t++) {
            var trou = this._trous[t];
            if (trou.mur !== murIndex) continue;

            var tx = trou.x;
            if (trou.alignement) {
                switch (trou.alignement) {
                    case 'start':   tx = 0; break;
                    case 'center':
                    case 'between': tx = (distance - trou.largeur) / 2; break;
                    case 'end':     tx = distance - trou.largeur; break;
                }
                tx += trou.decalage;
            }

            var ty = trou.y || 0;
            if (tx < 0) tx = 0;
            if (ty < 0) ty = 0;

            trous.push({
                x: tx,
                y: ty,
                largeur: trou.largeur,
                hauteur: trou.hauteur,
                forme: trou.forme || 'rect'
            });
        }

        // Separer trous rectangulaires, arrondis et ronds
        var trousRect = [];
        var trousArch = [];
        var trousRond = [];
        for (var t = 0; t < trous.length; t++) {
            if (trous[t].forme === 'arrondi') {
                trousArch.push(trous[t]);
            } else if (trous[t].forme === 'rond') {
                trousRond.push(trous[t]);
            } else {
                trousRect.push(trous[t]);
            }
        }

        // Briques du BAS vers le HAUT, alignees sur la grille globale (y=0 = sol)
        // y est la position absolue du bas du mur/morceau
        var baseY = y;
        var premierRangGlobal = Math.floor(baseY / moduleH);
        var dernierRangGlobal = Math.ceil((baseY + hauteur) / moduleH);

        for (var rg = premierRangGlobal; rg < dernierRangGlobal; rg++) {
            var yRang = rg * moduleH - baseY;  // position relative au morceau
            if (yRang < -0.001) continue;
            if (yRang < 0) yRang = 0;
            var hBrique = Math.min(bHaut, hauteur - yRang);
            if (hBrique <= 0) continue;

            var rangTrous = [];
            for (var t = 0; t < trousRect.length; t++) {
                if (yRang + hBrique > trousRect[t].y && yRang < trousRect[t].y + trousRect[t].hauteur) {
                    rangTrous.push(trousRect[t]);
                }
            }

            if (rangTrous.length === 0) {
                this._ajouterRang(0, yRang, 0, distance, rg);
            } else {
                rangTrous.sort(function(a, b) { return a.x - b.x; });
                var debut = 0;
                for (var t = 0; t < rangTrous.length; t++) {
                    if (rangTrous[t].x - debut > 0.005) {
                        this._ajouterRang(debut, yRang, 0, rangTrous[t].x - debut, rg);
                    }
                    debut = rangTrous[t].x + rangTrous[t].largeur;
                }
                if (distance - debut > 0.005) {
                    this._ajouterRang(debut, yRang, 0, distance - debut, rg);
                }
            }
        }

        // Filtrer les briques individuelles contre les trous arrondis
        // Chaque brique est testee : si son centre est dans la forme arche, elle est retiree
        if (trousArch.length > 0) {
            var filtered = [];
            for (var b = 0; b < this._brickData.length; b++) {
                var br = this._brickData[b];
                var bCenterX = br.x;  // centre de la brique
                var bCenterY = br.y;
                var bHalfW = br.w / 2;
                var bHalfH = br.h / 2;
                var inside = false;

                for (var a = 0; a < trousArch.length && !inside; a++) {
                    var arch = trousArch[a];
                    var rayon = arch.largeur / 2;
                    var hautDroit = arch.hauteur - rayon;
                    var archCX = arch.x + rayon;  // centre X de l'arche
                    var archY0 = arch.y;           // bas de l'arche

                    // Tester les 4 coins + le centre de la brique (5 points)
                    var pts = [
                        { px: bCenterX, py: bCenterY },                          // centre
                        { px: bCenterX - bHalfW * 0.5, py: bCenterY },           // gauche
                        { px: bCenterX + bHalfW * 0.5, py: bCenterY },           // droite
                        { px: bCenterX, py: bCenterY + bHalfH * 0.5 },           // haut
                        { px: bCenterX, py: bCenterY - bHalfH * 0.5 }            // bas
                    ];

                    for (var p = 0; p < pts.length && !inside; p++) {
                        var px = pts[p].px;
                        var py = pts[p].py;
                        var relY = py - archY0;

                        if (relY < 0 || relY > arch.hauteur) continue;

                        if (relY <= hautDroit) {
                            // Partie rectangulaire
                            if (px >= arch.x && px <= arch.x + arch.largeur) {
                                inside = true;
                            }
                        } else {
                            // Partie circulaire
                            var dy = relY - hautDroit;
                            var dx = px - archCX;
                            if (dx * dx + dy * dy <= rayon * rayon) {
                                inside = true;
                            }
                        }
                    }
                }

                if (!inside) {
                    filtered.push(br);
                }
            }
            this._brickData = filtered;
        }

        // Filtrer les briques contre les trous ronds (cercle complet)
        if (trousRond.length > 0) {
            var filtered = [];
            for (var b = 0; b < this._brickData.length; b++) {
                var br = this._brickData[b];
                var bCenterX = br.x;
                var bCenterY = br.y;
                var bHalfW = br.w / 2;
                var bHalfH = br.h / 2;
                var inside = false;

                for (var a = 0; a < trousRond.length && !inside; a++) {
                    var rond = trousRond[a];
                    var rayon = rond.largeur / 2;
                    var cx = rond.x + rayon;
                    var cy = rond.y + rond.hauteur / 2;

                    var pts = [
                        { px: bCenterX, py: bCenterY },
                        { px: bCenterX - bHalfW * 0.5, py: bCenterY },
                        { px: bCenterX + bHalfW * 0.5, py: bCenterY },
                        { px: bCenterX, py: bCenterY + bHalfH * 0.5 },
                        { px: bCenterX, py: bCenterY - bHalfH * 0.5 }
                    ];

                    for (var p = 0; p < pts.length && !inside; p++) {
                        var dx = pts[p].px - cx;
                        var dy = pts[p].py - cy;
                        if (dx * dx + dy * dy <= rayon * rayon) {
                            inside = true;
                        }
                    }
                }

                if (!inside) {
                    filtered.push(br);
                }
            }
            this._brickData = filtered;
        }

        // Optimiser : fusionner les briques en InstancedMesh
        this._optimiser(murGroup);

        // Joint avec trous (chaque trou clampe strictement a l'interieur)
        if (this.materialJoint) {
            var jointShape = new THREE.Shape([
                new THREE.Vector2(0, 0),
                new THREE.Vector2(distance, 0),
                new THREE.Vector2(distance, hauteur),
                new THREE.Vector2(0, hauteur)
            ]);
            var marge = 0.002;
            var tousTrous = trousRect.concat(trousArch).concat(trousRond);
            for (var t = 0; t < tousTrous.length; t++) {
                var tr = tousTrous[t];
                // Clamper aux limites du mur
                var jx = Math.max(marge, tr.x);
                var jy = Math.max(marge, tr.y);
                var jl = tr.largeur - (jx - tr.x);
                var jh = tr.hauteur - (jy - tr.y);
                if (jx + jl > distance - marge) jl = distance - jx - marge;
                if (jy + jh > hauteur - marge) jh = hauteur - jy - marge;
                if (jl < 0.01 || jh < 0.01) continue;

                var hole = new THREE.Path();
                if (tr.forme === 'rond') {
                    var rayon = Math.min(jl, jh) / 2;
                    var cx = jx + jl / 2;
                    var cy = jy + jh / 2;
                    hole.absarc(cx, cy, rayon, 0, Math.PI * 2, false);
                } else if (tr.forme === 'arrondi') {
                    var rayon = Math.min(jl / 2, jh);
                    var hautDroit = jh - rayon;
                    if (hautDroit < 0) hautDroit = 0;
                    var cx = jx + jl / 2;
                    hole.moveTo(jx, jy);
                    hole.lineTo(jx + jl, jy);
                    hole.lineTo(jx + jl, jy + hautDroit);
                    hole.absarc(cx, jy + hautDroit, rayon, 0, Math.PI, false);
                    hole.lineTo(jx, jy);
                } else {
                    hole.moveTo(jx, jy);
                    hole.lineTo(jx + jl, jy);
                    hole.lineTo(jx + jl, jy + jh);
                    hole.lineTo(jx, jy + jh);
                    hole.lineTo(jx, jy);
                }
                jointShape.holes.push(hole);
            }
            var jointGeo = new THREE.ExtrudeGeometry(jointShape, {
                depth: this.epaisseur, bevelEnabled: false
            });
            var jointMesh = new THREE.Mesh(jointGeo, this.materialJoint);
            jointMesh.receiveShadow = true;
            if (this.materialJoint.transparent) {
                jointMesh.renderOrder = 1;
            }
            murGroup.add(jointMesh);
        }

        murGroup.position.set(x, y, z);
        murGroup.rotation.y = -angle * Math.PI / 180;

        this.group = ancienGroup;
        this.group.add(murGroup);
        this._nbMurs++;
    }

    // --- Publique : construire une FORME ---

    construireForme(x, y, z, distance, hauteur, nbCotes, angleDepart, distanceBranches) {
        angleDepart = angleDepart || 0;
        if (nbCotes < 1) nbCotes = 1;
        if (nbCotes > 4) nbCotes = 4;
        var distBr = distanceBranches || distance;

        var posX = x;
        var posZ = z;
        var angle = angleDepart;

        for (var c = 0; c < nbCotes; c++) {
            // Cotes pairs (0,2) = branches, impairs (1,3) = fond
            var d = (c % 2 === 0) ? distBr : distance;
            this.construire(posX, y, posZ, d, hauteur, angle, c);
            var rad = angle * Math.PI / 180;
            posX += Math.cos(rad) * d;
            posZ += Math.sin(rad) * d;
            angle += 90;
        }
    }

    // --- Publique : importer un JSON ---

    // Charge un fichier JSON et construit tout
    // url = chemin vers le fichier JSON
    // callback = fonction appelee quand c'est fini (optionnel)
    static importer(scene, url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function() {
            if (xhr.status !== 200) {
                console.error('Erreur chargement JSON : ' + xhr.status);
                return;
            }

            var data = JSON.parse(xhr.responseText);
            var instances = [];

            for (var m = 0; m < data.murs.length; m++) {
                var def = data.murs[m];
                var brique = new Brique(scene);

                // Configuration
                if (def.couleur) brique.setCouleur(def.couleur);
                if (def.jointCouleur !== undefined) brique.setCouleurJoint(def.jointCouleur);
                if (def.dimensions) brique.setDimensions(def.dimensions[0], def.dimensions[1], def.dimensions[2]);
                if (def.joint) brique.setJoint(def.joint);
                if (def.vertical) brique.setVertical(def.vertical);
                if (def.ignorer) brique.setIgnorer(def.ignorer[0], def.ignorer[1]);
                if (def.priorite) brique.setPriorite(def.priorite);

                // Trous
                if (def.trous) {
                    for (var t = 0; t < def.trous.length; t++) {
                        var tr = def.trous[t];
                        brique.ajouterTrou(
                            tr.x || 0,
                            tr.y || 0,
                            tr.largeur,
                            tr.hauteur,
                            tr.alignement || null,
                            tr.decalage || 0,
                            tr.mur || 0
                        );
                    }
                }

                // Construire
                if (def.nbCotes && def.nbCotes > 1) {
                    brique.construireForme(
                        def.x || 0, def.y || 0, def.z || 0,
                        def.distance, def.hauteur,
                        def.nbCotes, def.angleDepart || 0
                    );
                } else {
                    brique.construire(
                        def.x || 0, def.y || 0, def.z || 0,
                        def.distance, def.hauteur,
                        def.angle || 0
                    );
                }

                instances.push(brique);
            }

            console.log('Import JSON : ' + data.murs.length + ' murs charges depuis ' + url);
            if (callback) callback(instances, data);
        };
        xhr.send();
    }

    // --- Privee : optimiser un groupe en InstancedMesh ---

    _optimiser(murGroup) {
        if (this._brickData.length === 0) return;
        // Sauvegarder les donnees de briques pour la simulation
        if (!this._allBrickData) this._allBrickData = [];
        for (var i = 0; i < this._brickData.length; i++) {
            this._allBrickData.push(this._brickData[i]);
        }

        // Creer UN SEUL InstancedMesh depuis les donnees collectees
        var unitGeo = new THREE.BoxGeometry(1, 1, 1);
        var instMesh = new THREE.InstancedMesh(unitGeo, this.material, this._brickData.length);
        if (this.material.transparent) {
            instMesh.renderOrder = 1;
            instMesh.castShadow = false;
        } else {
            instMesh.castShadow = true;
        }
        instMesh.receiveShadow = true;
        instMesh.userData.isBrickGroup = true;

        var dummy = new THREE.Object3D();
        for (var i = 0; i < this._brickData.length; i++) {
            var b = this._brickData[i];
            dummy.position.set(b.x, b.y, b.z);
            dummy.scale.set(b.w, b.h, b.e);
            dummy.updateMatrix();
            instMesh.setMatrixAt(i, dummy.matrix);
        }
        instMesh.instanceMatrix.needsUpdate = true;
        murGroup.add(instMesh);
    }

    // --- Publique : detruire une brique par son instanceId ---
    // Utiliser avec un raycaster : intersection.instanceId
    // ex: mur.detruireBrique(intersection.object, intersection.instanceId);

    detruireBrique(instMesh, instanceId) {
        if (!instMesh || !instMesh.isInstancedMesh) return;

        // Mettre le scale a 0 = la brique disparait
        var matrix = new THREE.Matrix4();
        matrix.makeScale(0, 0, 0);
        instMesh.setMatrixAt(instanceId, matrix);
        instMesh.instanceMatrix.needsUpdate = true;
        this._nbBriques--;
    }

    // --- Publique : ajouter une brique a cote d'une existante ---
    // intersection = resultat du raycaster (intersection avec un InstancedMesh)
    // Utilise la face normale pour savoir de quel cote poser la nouvelle brique.
    //
    // Utilisation :
    //   var intersects = raycaster.intersectObjects(scene.children, true);
    //   if (intersects.length > 0) {
    //       mur.ajouterBrique(intersects[0]);
    //   }

    ajouterBrique(intersection) {
        if (!intersection || !intersection.object || !intersection.face) return null;

        var obj = intersection.object;
        var parent = obj.parent || this.group;

        // Dimensions standard de la brique
        var bLarg = this.vertical ? this.hauteur : this.longueur;
        var bHaut = this.vertical ? this.longueur : this.hauteur;
        var moduleL = bLarg + this.joint;
        var moduleH = bHaut + this.joint;

        // Point d'impact en coordonnees monde
        var worldPoint = intersection.point.clone();

        // Normale de la face en coordonnees monde
        var worldNormal = intersection.face.normal.clone();
        var normalMatrix = new THREE.Matrix3();
        if (obj.isInstancedMesh && intersection.instanceId !== undefined) {
            var instMatrix = new THREE.Matrix4();
            obj.getMatrixAt(intersection.instanceId, instMatrix);
            var fullMatrix = new THREE.Matrix4().multiplyMatrices(obj.matrixWorld, instMatrix);
            normalMatrix.setFromMatrix4(fullMatrix);
        } else {
            normalMatrix.setFromMatrix4(obj.matrixWorld);
        }
        worldNormal.applyMatrix3(normalMatrix).normalize();

        // Arrondir la normale a l'axe le plus proche
        var ax = Math.abs(worldNormal.x);
        var ay = Math.abs(worldNormal.y);
        var az = Math.abs(worldNormal.z);

        var offset = new THREE.Vector3();
        if (ay >= ax && ay >= az) {
            // Face haut/bas
            offset.y = (worldNormal.y > 0 ? 1 : -1) * moduleH;
        } else if (ax >= az) {
            // Face gauche/droite
            offset.x = (worldNormal.x > 0 ? 1 : -1) * moduleL;
        } else {
            // Face avant/arriere
            offset.z = (worldNormal.z > 0 ? 1 : -1) * (this.epaisseur + this.joint);
        }

        // Position monde de la nouvelle brique
        var newWorldPos = worldPoint.clone().add(offset);

        // Convertir en local du parent
        var localPos = newWorldPos.clone();
        var parentInverse = new THREE.Matrix4().copy(parent.matrixWorld).invert();
        localPos.applyMatrix4(parentInverse);

        // Aligner sur la grille (x = horizontal le long du mur, y = vertical)
        localPos.x = Math.round((localPos.x - bLarg / 2) / moduleL) * moduleL + bLarg / 2;
        localPos.y = Math.round((localPos.y - bHaut / 2) / moduleH) * moduleH + bHaut / 2;
        // z : garder tel quel (epaisseur du mur)

        // Empecher sous le sol
        if (localPos.y < bHaut / 2) localPos.y = bHaut / 2;

        // Creer le bloc complet
        var geo = new THREE.BoxGeometry(bLarg, bHaut, this.epaisseur);
        var mesh = new THREE.Mesh(geo, this.material);
        mesh.position.copy(localPos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isBrick = true;
        mesh.userData.isManual = true;

        parent.add(mesh);
        this._nbBriques++;
        return mesh;
    }

    // --- Publique : vider ---

    vider() {
        this._viderGroupe(this.group);
        this._nbBriques = 0;
        this._nbTotal = 0;
        this._nbMurs = 0;
        this._brickData = [];
    }

    _viderGroupe(groupe) {
        while (groupe.children.length > 0) {
            var child = groupe.children[0];
            if (child.children && child.children.length > 0) {
                this._viderGroupe(child);
            }
            if (child.geometry) child.geometry.dispose();
            groupe.remove(child);
        }
    }

    // --- Publique : positions ---

    getPositions(x, y, z, distance, hauteur) {
        return {
            exterieur: { x: x, y: y, z: z },
            interieur: { x: x, y: y, z: z + this.epaisseur },
            gauche: x,
            droite: x + distance,
            bas: y,
            haut: y + hauteur,
            largeur: distance,
            hauteur: hauteur,
            epaisseur: this.epaisseur,
            devant: { x: x, y: y, z: z - 0.001 },
            derriere: { x: x, y: y, z: z + this.epaisseur + 0.001 }
        };
    }
}
