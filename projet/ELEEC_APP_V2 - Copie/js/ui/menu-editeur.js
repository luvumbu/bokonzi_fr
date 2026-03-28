// ========================================
// Menu Editeur — Logique du formulaire
// ========================================

var editeur = new Editeur(sceneManager.scene);
var fenetre = new Fenetre(sceneManager.scene, editeur);
var porte = new Porte(sceneManager.scene, editeur);
var personnage = new Personnage(sceneManager.scene);
var escalierObj = new Escalier(sceneManager.scene);
var placo = new Placo(sceneManager.scene, editeur);
var laineDeVerre = new LaineDeVerre(sceneManager.scene, editeur);

var modeLaine = false;
var laineModele = null;
var ghostLaine = null;
var laineDrag = false;
var laineDragStart = null;
var modeDeplacerLaine = false;
var deplacerLaineGroup = null;
var deplacerLaineOrigPos = null;
var laineElements = [];
var modeAgrandirPlaque = false; // mode agrandir placo ou laine
var agrandirPlaqueGroup = null; // le group 3D qu'on agrandit
var agrandirPlaqueType = null;  // 'placo' ou 'laine'
var agrandirPlaqueInfo = null;  // copie de placoInfo/laineInfo
var agrandirPlaqueSeg = null;   // {seg, nx, nz, len, dx, dz}
var agrandirPlaqueOrigL = 0;    // largeur originale
var agrandirPlaqueOrigWX = 0;   // worldX original
var agrandirPlaqueOrigWZ = 0;   // worldZ original
var agrandirPlaqueGhost = null; // ghost blanc pour montrer la taille originale
var modePlaco = false;
var placoModele = null;
var ghostPlaco = null;
var ghostPlacoGroupe = []; // ghosts supplementaires pour murs groupes
var placoDrag = false; // true quand on est en train de glisser
var placoDragStart = null; // {localX, seg, element, mur, ...} point de depart du glisse
var modeDeplacerPlaco = false;
var deplacerPlacoGroup = null;
var deplacerPlacoOrigPos = null;
var placoElements = []; // Liste de tous les placos poses

// ========================================
// Systeme de detection de pieces fermees + zones
// ========================================
var piecesMeshes = [];      // THREE.Group pour chaque piece (sol + label)
var piecesZones = [];       // {id, nom, couleur, points, centre} — zones nommees
var _piecesAutoId = 0;
var ZONE_TYPES = [
    { nom: 'Cuisine',        couleur: '#FF9800', icone: '🍳' },
    { nom: 'Salon',          couleur: '#4CAF50', icone: '🛋' },
    { nom: 'Chambre',        couleur: '#9C27B0', icone: '🛏' },
    { nom: 'Salle de bain',  couleur: '#2196F3', icone: '🚿' },
    { nom: 'WC',             couleur: '#607D8B', icone: '🚽' },
    { nom: 'Entree',         couleur: '#795548', icone: '🚪' },
    { nom: 'Bureau',         couleur: '#3F51B5', icone: '💻' },
    { nom: 'Garage',         couleur: '#9E9E9E', icone: '🚗' },
    { nom: 'Buanderie',      couleur: '#00BCD4', icone: '🧺' },
    { nom: 'Cellier',        couleur: '#8BC34A', icone: '🏺' },
    { nom: 'Couloir',        couleur: '#FFEB3B', icone: '🚶' },
    { nom: 'Dressing',       couleur: '#E91E63', icone: '👔' },
    { nom: 'Personnalise',   couleur: '#FF5722', icone: '✏' }
];

function _creerTexteSpritePiece(texte, couleur, taille) {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = couleur;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texte, 256, 64);
    var texture = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(taille || 2, 0.5, 1);
    return sprite;
}

function _creerSolPiece(points, couleur, opacite) {
    // Creer un sol plat a partir des points du polygone
    // Note: ShapeGeometry est en XY, rotation -PI/2 autour de X donne (x, 0, -y)
    // donc on utilise -z pour compenser l'inversion
    var shape = new THREE.Shape();
    shape.moveTo(points[0].x, -points[0].z);
    for (var i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, -points[i].z);
    }
    shape.closePath();
    var geo = new THREE.ShapeGeometry(shape);
    var mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(couleur),
        transparent: true,
        opacity: opacite || 0.25,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02; // juste au-dessus du sol
    return mesh;
}

// Preview couleur en temps reel sur une piece
function _previewCouleurPiece(piece, couleur) {
    for (var i = 0; i < piecesMeshes.length; i++) {
        var g = piecesMeshes[i];
        var info = g.userData.pieceInfo;
        if (!info) continue;
        var dx = info.centre.x - piece.centre.x;
        var dz = info.centre.z - piece.centre.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
            // Mettre a jour sol + contour
            var c = new THREE.Color(couleur);
            g.children.forEach(function(child) {
                if (child.material) {
                    child.material.color.copy(c);
                    if (child.material.opacity !== undefined && child.material.transparent) {
                        child.material.opacity = 0.35;
                    }
                }
            });
            break;
        }
    }
}

function _afficherPiecesFermees() {
    // Nettoyer les anciens meshes
    for (var i = 0; i < piecesMeshes.length; i++) {
        sceneManager.scene.remove(piecesMeshes[i]);
    }
    piecesMeshes = [];

    // Detecter les pieces
    var pieces = editeur.detecterPiecesFermees();

    for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];

        // Chercher si une zone est assignee a cette piece (par centre proche)
        var zone = _trouverZonePourPiece(p);
        var couleur = zone ? zone.couleur : '#4a9eff';
        var opacite = zone ? 0.65 : 0.15;
        var nom = zone ? zone.nom : '';

        var group = new THREE.Group();

        // Sol colore
        var sol = _creerSolPiece(p.points, couleur, opacite);
        group.add(sol);

        // Contour
        var contourPts = [];
        for (var j = 0; j < p.points.length; j++) {
            contourPts.push(new THREE.Vector3(p.points[j].x, 0.03, p.points[j].z));
        }
        contourPts.push(new THREE.Vector3(p.points[0].x, 0.03, p.points[0].z));
        var contourGeo = new THREE.BufferGeometry().setFromPoints(contourPts);
        var contourMat = new THREE.LineBasicMaterial({ color: new THREE.Color(couleur), linewidth: 2 });
        var contourLine = new THREE.Line(contourGeo, contourMat);
        group.add(contourLine);

        // Label
        if (nom) {
            var label = _creerTexteSpritePiece(nom, couleur, Math.max(1.5, Math.sqrt(p.aire) * 0.8));
            label.position.set(p.centre.x, 0.5, p.centre.z);
            group.add(label);
        } else {
            // Petit indicateur "piece fermee"
            var indicateur = _creerTexteSpritePiece('[ Piece ' + (i + 1) + ' ]', '#4a9eff', 1.5);
            indicateur.position.set(p.centre.x, 0.3, p.centre.z);
            group.add(indicateur);
        }

        // Stocker les infos pour le clic
        group.userData.pieceInfo = {
            points: p.points,
            centre: p.centre,
            aire: p.aire,
            index: i
        };

        sceneManager.scene.add(group);
        piecesMeshes.push(group);
    }
}

function _trouverZonePourPiece(piece) {
    for (var i = 0; i < piecesZones.length; i++) {
        var z = piecesZones[i];
        var dx = z.centre.x - piece.centre.x;
        var dz = z.centre.z - piece.centre.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.5) return z;
    }
    return null;
}

function _pointDansPiece(px, pz, points) {
    // Ray casting algorithm
    var inside = false;
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i].x, zi = points[i].z;
        var xj = points[j].x, zj = points[j].z;
        var intersect = ((zi > pz) !== (zj > pz)) &&
            (px < (xj - xi) * (pz - zi) / (zj - zi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function _trouverPieceAuPoint(px, pz) {
    var pieces = editeur.detecterPiecesFermees();
    for (var i = 0; i < pieces.length; i++) {
        if (_pointDansPiece(px, pz, pieces[i].points)) return pieces[i];
    }
    return null;
}

function _trouverTraitAuPoint(px, pz) {
    var bestDist = 0.4;
    var bestTrait = null;
    for (var i = 0; i < editeur.traits.length; i++) {
        var t = editeur.traits[i];
        var p = t.params;
        var coins = [
            { x: p.x1, z: p.z1 }, { x: p.x2, z: p.z1 },
            { x: p.x2, z: p.z2 }, { x: p.x1, z: p.z2 }
        ];
        for (var c = 0; c < 4; c++) {
            var c1 = coins[c], c2 = coins[(c + 1) % 4];
            var dx = c2.x - c1.x, dz = c2.z - c1.z;
            var len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) continue;
            var qx = px - c1.x, qz = pz - c1.z;
            var proj = Math.max(0, Math.min(1, (qx * dx + qz * dz) / (len * len)));
            var cx = c1.x + dx * proj - px;
            var cz = c1.z + dz * proj - pz;
            var dist = Math.sqrt(cx * cx + cz * cz);
            if (dist < bestDist) {
                bestDist = dist;
                bestTrait = t;
            }
        }
    }
    return bestTrait;
}

var _popupZonePiece = null; // piece courante dans le popup

function _assignerZone(piece, nom, couleur) {
    // Supprimer l'ancienne zone a cet endroit
    for (var k = piecesZones.length - 1; k >= 0; k--) {
        var dx = piecesZones[k].centre.x - piece.centre.x;
        var dz = piecesZones[k].centre.z - piece.centre.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
            piecesZones.splice(k, 1);
        }
    }
    _piecesAutoId++;
    piecesZones.push({
        id: _piecesAutoId,
        nom: nom,
        couleur: couleur,
        centre: { x: piece.centre.x, z: piece.centre.z },
        aire: piece.aire
    });
    document.getElementById('zone-popup').style.display = 'none';
    _afficherPiecesFermees();
    _mettreAJourPanelZones();
}

function _retirerZone(piece) {
    for (var k = piecesZones.length - 1; k >= 0; k--) {
        var dx = piecesZones[k].centre.x - piece.centre.x;
        var dz = piecesZones[k].centre.z - piece.centre.z;
        if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
            piecesZones.splice(k, 1);
        }
    }
    document.getElementById('zone-popup').style.display = 'none';
    _afficherPiecesFermees();
    _mettreAJourPanelZones();
}

function _afficherPopupZone(piece, mouseX, mouseY) {
    var popup = document.getElementById('zone-popup');
    if (!popup) return;
    _popupZonePiece = piece;

    var liste = document.getElementById('zone-liste');
    liste.innerHTML = '';

    // Surface en m2
    var surfaceM2 = piece.aire.toFixed(2);
    document.getElementById('zone-surface').textContent = surfaceM2 + ' m²';

    // Zone actuelle
    var zoneActuelle = _trouverZonePourPiece(piece);
    document.getElementById('zone-actuelle').textContent = zoneActuelle ? zoneActuelle.nom : 'Aucune';

    // Pre-remplir nom + couleur
    var nomInput = document.getElementById('zone-nom-input');
    var couleurInput = document.getElementById('zone-couleur-input');
    nomInput.value = zoneActuelle ? zoneActuelle.nom : '';
    couleurInput.value = zoneActuelle ? zoneActuelle.couleur : '#FF9800';

    // Bouton retirer : visible seulement si zone assignee
    document.getElementById('zone-retirer-btn').style.display = zoneActuelle ? '' : 'none';

    // Presets rapides (sans "Personnalise")
    for (var i = 0; i < ZONE_TYPES.length; i++) {
        if (ZONE_TYPES[i].nom === 'Personnalise') continue;
        var zt = ZONE_TYPES[i];
        var div = document.createElement('div');
        div.style.cssText = 'display:flex; align-items:center; gap:8px; padding:5px 10px; cursor:pointer; color:#fff; border-radius:4px; transition:background 0.15s;';
        div.innerHTML = '<span style="font-size:14px;">' + zt.icone + '</span>' +
            '<span style="flex:1; font-size:11px;">' + zt.nom + '</span>' +
            '<span style="width:12px; height:12px; border-radius:2px; background:' + zt.couleur + ';"></span>';
        div.onmouseover = function() { this.style.background = 'rgba(255,255,255,0.1)'; };
        div.onmouseout = function() { this.style.background = 'transparent'; };
        div.onclick = (function(idx, pc) {
            return function() {
                var zt = ZONE_TYPES[idx];
                // Remplir les champs et appliquer directement
                document.getElementById('zone-nom-input').value = zt.nom;
                document.getElementById('zone-couleur-input').value = zt.couleur;
                _assignerZone(pc, zt.nom, zt.couleur);
            };
        })(i, piece);
        liste.appendChild(div);
    }

    // Positionner le popup
    popup.style.display = 'block';
    popup.style.left = mouseX + 'px';
    popup.style.top = mouseY + 'px';

    // Focus sur le champ nom
    setTimeout(function() {
        nomInput.focus();
        nomInput.select();
        // Garder dans l'ecran
        var rect = popup.getBoundingClientRect();
        if (rect.right > window.innerWidth) popup.style.left = (window.innerWidth - rect.width - 10) + 'px';
        if (rect.bottom > window.innerHeight) popup.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }, 10);
}

// Hook sauvegarder : ajouter placos et laines a l'etat
editeur._onSauvegarder = function(etat) {
    etat.placos = [];
    for (var i = 0; i < placoElements.length; i++) {
        var info = placoElements[i].userData.placoInfo;
        if (!info) continue;
        var cols = Placo.lireCouleurs(placoElements[i]);
        etat.placos.push({
            info: JSON.parse(JSON.stringify(info)),
            couleur: cols.placo,
            opacite: cols.opacite
        });
    }
    etat.laines = [];
    for (var i = 0; i < laineElements.length; i++) {
        var info = laineElements[i].userData.laineInfo;
        if (!info) continue;
        var cols = LaineDeVerre.lireCouleurs(laineElements[i]);
        etat.laines.push({
            info: JSON.parse(JSON.stringify(info)),
            couleur: cols.laine,
            opacite: cols.opacite
        });
    }
    // Sauvegarder les zones
    etat.piecesZones = JSON.parse(JSON.stringify(piecesZones));
};

// Hook annuler : restaurer exclusions, placos et laines
editeur._onAnnuler = function(etat) {
    // Restaurer les exclusions (fenetres/portes)
    if (etat.exclusions) {
        for (var i = 0; i < etat.exclusions.length; i++) {
            var ex = etat.exclusions[i];
            var c = ex._creation;
            if (!c) continue;
            if (ex._type === 'porte') {
                porte.setCouleurs(c.couleurCadre, c.couleurPorte);
                porte.creer(c.modeleId, c.worldX, c.worldZ, c.y, c.largeur, c.hauteur, c.angle);
            } else {
                fenetre.setCouleurs(c.couleurCadre, c.couleurVitre, c.opaciteVitre);
                fenetre.creer(c.modeleId, c.worldX, c.worldZ, c.y, c.largeur, c.hauteur, c.angle);
            }
        }
    }

    // Supprimer tous les placos existants
    for (var i = 0; i < placoElements.length; i++) {
        sceneManager.scene.remove(placoElements[i]);
    }
    placoElements = [];

    // Restaurer les placos
    if (etat.placos) {
        for (var i = 0; i < etat.placos.length; i++) {
            var p = etat.placos[i];
            placo.setCouleurs(p.couleur, p.opacite / 100);
            var g = placo.creer(null, p.info.worldX, p.info.worldZ, p.info.y, p.info.largeur, p.info.hauteur, p.info.angle, p.info.ep, p.info.side, p.info.murEpFull, p.info.extraBack || 0);
            placoElements.push(g);
        }
    }

    // Supprimer toutes les laines existantes
    for (var i = 0; i < laineElements.length; i++) {
        sceneManager.scene.remove(laineElements[i]);
    }
    laineElements = [];

    // Restaurer les laines
    if (etat.laines) {
        for (var i = 0; i < etat.laines.length; i++) {
            var l = etat.laines[i];
            laineDeVerre.setCouleurs(l.couleur, l.opacite / 100);
            var g = laineDeVerre.creer(null, l.info.worldX, l.info.worldZ, l.info.y, l.info.largeur, l.info.hauteur, l.info.angle, l.info.ep, l.info.side, l.info.murEpFull);
            laineElements.push(g);
        }
    }

    // Restaurer les zones
    if (etat.piecesZones) {
        piecesZones = JSON.parse(JSON.stringify(etat.piecesZones));
    }

    // Rafraichir l'affichage des pieces si le mode zones est actif
    if (modeZones) {
        setTimeout(function() {
            _afficherPiecesFermees();
            _mettreAJourPanelZones();
        }, 100);
    }
};

// Restaurer depuis le cache ou creer le mur initial
// On stocke les donnees pour restauration complete dans le setTimeout
window._cacheData = null;
(function() {
    var cache = null;
    try { cache = localStorage.getItem('eleec_cache'); } catch(e) {}
    if (cache) {
        try {
            var data = JSON.parse(cache);
            window._cacheData = data;
            // Restaurer mode toolbar immediatement
            if (data.toolbarTexte) {
                document.getElementById('toolbar').classList.add('mode-texte');
            }
            // Restaurer camera immediatement
            if (data.camera) {
                sceneManager.camera.position.set(data.camera.px, data.camera.py, data.camera.pz);
                sceneManager.controls.target.set(data.camera.tx, data.camera.ty, data.camera.tz);
                sceneManager.controls.update();
            }
            // Les murs sont restaures immediatement pour que la scene ne soit pas vide
            if (data.murs) {
                for (var i = 0; i < data.murs.length; i++) {
                    editeur.ajouterMur(data.murs[i]);
                }
            }
            console.log('Cache : ' + (data.murs ? data.murs.length : 0) + ' murs restaures, reste en attente...');
        } catch(e) {
            console.warn('Erreur restauration cache:', e);
            editeur.ajouterMur({ couleur: '#8b6132', jointCouleur: '#000000', distance: 5, hauteur: 2.50, angle: 0, x: 0, y: 0, z: 0 });
        }
    } else {
        editeur.ajouterMur({ couleur: '#8b6132', jointCouleur: '#000000', distance: 5, hauteur: 2.50, angle: 0, x: 0, y: 0, z: 0 });
    }
})();

// Restauration complete via _macroRestore (apres chargement de toutes les classes)
setTimeout(function() {
    if (!window._cacheData) return;
    var data = window._cacheData;
    try {
        // Utiliser _macroRestore qui gere TOUT (murs + exclusions + placos + laines)
        _macroRestore(data);
        console.log('Cache : _macroRestore OK — ' + (data.exclusions ? data.exclusions.length : 0) + ' exclusions, ' + (data.placos ? data.placos.length : 0) + ' placos, ' + (data.laines ? data.laines.length : 0) + ' laines');

        // Restaurer les traits
        while (editeur.traits.length > 0) editeur.supprimerTrait(editeur.traits[0].id);
        if (data.traits) {
            for (var i = 0; i < data.traits.length; i++) {
                var t = editeur.ajouterTrait(data.traits[i]);
                t.line.visible = false;
            }
        }

        // Restaurer les zones
        if (data.piecesZones) piecesZones = JSON.parse(JSON.stringify(data.piecesZones));

        // Restaurer les prix
        if (data.prix) {
            try {
                var dp = data.prix;
                if (dp.briques) { for (var k in dp.briques) { if (PRIX_BRIQUES && PRIX_BRIQUES[k]) PRIX_BRIQUES[k].unite = dp.briques[k].unite; } }
                if (dp.placos) { for (var k in dp.placos) { if (PRIX_PLACOS && PRIX_PLACOS[k]) PRIX_PLACOS[k].m2 = dp.placos[k].m2; } }
                if (dp.laines) { for (var k in dp.laines) { if (PRIX_LAINES && PRIX_LAINES[k]) PRIX_LAINES[k].m2 = dp.laines[k].m2; } }
                if (dp.portes) PRIX_PORTES = dp.portes;
                if (dp.fenetres) PRIX_FENETRES = dp.fenetres;
            } catch(e) {}
        }

        console.log('Cache : restauration complete');
    } catch(e) {
        console.error('Cache : erreur restauration:', e);
    }
    delete window._cacheData;
}, 800);

// ========================================
// MODES
// ========================================

var modePlacement = false;
var modeSuppression = false;
var modeTrou = false;
var trouEtape = 0;
var trouLocalX = 0;
var trouMurElement = null;
var trouMurIndex = 0;
var trouHitPoint = null;
var trouLigneV = null;
var modeDeplacement = false;
var modeEdition = false;
var editionElement = null;
var modeGrouper = false;
var grouperSelection = [];
var modeDegrouper = false;
var ctxElement = null;
var modeRedim = false;
var redimElement = null;
var redimCote = null;
var redimOrigX = 0;
var redimOrigZ = 0;
var redimOrigDist = 0;
var redimAngle = 0;
var redimGhost = null;
var redimVertical = false;
var redimOrigHauteur = 0;
var redimPerp = false;
var redimPerpElement = null;
var redimPerpNewEl = null;
var redimPerpGhost = null;
var redimPerpCote = 'droite';
var redimProp = false;
var redimPropElement = null;
var redimPropOrigDist = 0;
var redimPropExclusions = []; // exclusions avec positions d'origine
var modeDeplacerVertical = false;
var deplacerVElement = null;
var deplacerVOrigY = 0;
var modeDeplacerHorizontal = false;
var deplacerHElement = null;
var deplacerHOrigX = 0;
var deplacerHOrigZ = 0;
var deplacerExclusions = []; // exclusions liees au mur en cours de deplacement
var deplacerMurPlacos = [];  // placos lies au mur en cours de deplacement
var deplacerMurLaines = [];  // laines liees au mur en cours de deplacement
var modeMesure = false;
var mesurePoint1 = null;
var mesureLigne = null;
var mesureSphere1 = null;
var mesureSphere2 = null;
var mesuresListe = [];
var modeTrouRapide = false;
var trouRapideForme = 'rect';
var trouRapideElement = null;
var trouSelectElement = null;
var modeFenetre = false;
var fenetreModele = null;
var modePorte = false;
var porteModele = null;
var modeDeplacerFenetre = false;
var deplacerFenetreExcl = null;
var deplacerFenetreSnapshot = null;
var deplacerFenetreInfo = null;
var modeDeplacerPorte = false;
var deplacerPorteInfo = null;
var deplacerPorteAxe = 'libre'; // 'libre', 'x', 'y'
var deplacerPorteMurEl = null;
var deplacerFenetreAxe = 'libre'; // 'libre', 'x', 'y'
var deplacerFenetreMurEl = null;
var modeEffacerZone = false;
var effacerStart = null;
var effacerDrag = false;
var modeDeplacerZone = false;
var deplacerZonePhase = 'select'; // 'select' = dessiner la zone, 'move' = deplacer
var deplacerZoneStart = null;
var deplacerZoneDrag = false;
var deplacerZoneElements = []; // {type, ref, origX, origZ}
var deplacerZoneMoveStart = null; // point de depart du deplacement
var modeCopierZone = false;
var copierZonePhase = 'select'; // 'select' = dessiner, 'place' = placer la copie
var copierZoneStart = null;
var copierZoneDrag = false;
var copierZoneData = null; // {murs[], exclusions[], placos[], laines[], traits[], personnages[], escaliers[], plafonds[], cx, cz}
var copierZoneMoveStart = null;
// ========================================
// MACRO — Enregistrement / Lecture
// ========================================
var macroRecording = false;
var macroFrames = []; // liste de snapshots {murs, exclusions, placos, laines}
var macroPlaying = false;
var macroPaused = false;
var macroCurrentStep = 0;
var macroTimer = null;

var deplacementElement = null;
var deplacementSelectionne = false;
var deplacementOrigX = 0;
var deplacementOrigZ = 0;
var deplacementGroup = null;
var deplacementGroupeIds = [];
var deplacementGroupes3D = [];
var ghostMesh = null;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var planSol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var pointSol = new THREE.Vector3();
var grille = 0;
var aimantActif = true;

// ========================================
// TOGGLE MODE TEXTE / ICONE
// ========================================
(function() {
    // Injecter les labels texte dans chaque bouton qui a data-label
    var btns = document.querySelectorAll('#toolbar .tool-btn[data-label]');
    for (var i = 0; i < btns.length; i++) {
        var lbl = document.createElement('span');
        lbl.className = 'tool-label';
        lbl.textContent = btns[i].getAttribute('data-label');
        btns[i].appendChild(lbl);
    }
    // Toggle
    var modeTexte = false;
    document.getElementById('btn-toggle-mode').addEventListener('click', function() {
        modeTexte = !modeTexte;
        var toolbar = document.getElementById('toolbar');
        if (modeTexte) {
            toolbar.classList.add('mode-texte');
        } else {
            toolbar.classList.remove('mode-texte');
        }
    });

    // Deplacer les popups et menus contextuels hors des panels de categories
    // (un element position:fixed dans un parent display:none est invisible)
    // IMPORTANT: utiliser > (enfant direct) et [id$="-menu"] pour ne pas arracher les enfants des ctx menus
    var _popupsADeplacer = document.querySelectorAll(
        '.tool-cat-panel > .popup, ' +
        '.tool-cat-panel > [id^="ctx-"][id$="-menu"], ' +
        '.tool-cat-panel > [id^="edit-"][id$="-popup"], ' +
        '.tool-cat-panel > [id$="-popup"]:not(.tool-btn), ' +
        '.tool-cat-panel > [id^="macro-submenu"], ' +
        '.tool-cat-panel > [id^="export-panel"], ' +
        '.tool-cat-panel > [id^="export-overlay"]'
    );
    for (var _pd = 0; _pd < _popupsADeplacer.length; _pd++) {
        document.body.appendChild(_popupsADeplacer[_pd]);
    }

    // Categories toolbar — ouvrir/fermer les sous-menus
    function _fermerTousPanels() {
        var allPanels = document.querySelectorAll('.tool-cat-panel');
        var allCatBtns = document.querySelectorAll('.tool-cat-btn');
        for (var j = 0; j < allPanels.length; j++) allPanels[j].classList.remove('ouvert');
        for (var j = 0; j < allCatBtns.length; j++) allCatBtns[j].classList.remove('cat-ouvert');
    }

    var catBtns = document.querySelectorAll('.tool-cat-btn');
    for (var i = 0; i < catBtns.length; i++) {
        catBtns[i].addEventListener('click', function(e) {
            e.stopPropagation();
            // Fermer tous les popups flottants ouverts (outils d'une autre categorie)
            var popups = document.querySelectorAll('.popup');
            for (var p = 0; p < popups.length; p++) popups[p].style.display = 'none';
            var catId = this.getAttribute('data-cat');
            var panel = document.querySelector('.tool-cat-panel[data-cat="' + catId + '"]');
            if (!panel) return;
            var wasOpen = panel.classList.contains('ouvert');
            _fermerTousPanels();
            if (!wasOpen) {
                panel.classList.add('ouvert');
                this.classList.add('cat-ouvert');
                var rect = this.getBoundingClientRect();
                var toolbar = document.getElementById('toolbar');
                if (!toolbar.classList.contains('mode-texte')) {
                    panel.style.left = rect.left + 'px';
                    panel.style.top = (rect.bottom + 4) + 'px';
                    requestAnimationFrame(function() {
                        var pr = panel.getBoundingClientRect();
                        if (pr.right > window.innerWidth - 10) {
                            panel.style.left = (window.innerWidth - pr.width - 10) + 'px';
                        }
                    });
                }
            }
        });
    }

    // Clic sur un outil dans un panel → fermer le panel, marquer la categorie active
    var allToolBtnsInPanels = document.querySelectorAll('.tool-cat-panel .tool-btn');
    for (var i = 0; i < allToolBtnsInPanels.length; i++) {
        allToolBtnsInPanels[i].addEventListener('click', function() {
            // Retirer 'actif' de TOUS les tool-btn dans TOUS les panels
            var allInPanels = document.querySelectorAll('.tool-cat-panel .tool-btn');
            for (var j = 0; j < allInPanels.length; j++) {
                // Ne pas toucher a l'aimant (toggle independant)
                if (allInPanels[j].id === 'btn-aimant') continue;
                allInPanels[j].classList.remove('actif');
                allInPanels[j].style.borderColor = '';
            }
            // Marquer CE bouton comme actif
            if (this.id !== 'btn-aimant') {
                this.classList.add('actif');
            }
            // Trouver la categorie parente et la marquer
            var catPanel = this.closest('.tool-cat-panel');
            var catId = catPanel ? catPanel.getAttribute('data-cat') : null;
            // Retirer cat-actif de toutes les categories
            var allCatBtns = document.querySelectorAll('.tool-cat-btn');
            for (var j = 0; j < allCatBtns.length; j++) allCatBtns[j].classList.remove('cat-actif');
            if (catId) {
                var catBtn = document.querySelector('.tool-cat-btn[data-cat="' + catId + '"]');
                if (catBtn) catBtn.classList.add('cat-actif');
            }
            // Fermer le panel apres un petit delai (laisser le clic propager)
            setTimeout(_fermerTousPanels, 150);
        });
    }

    // Fermer les panels en cliquant ailleurs
    document.addEventListener('click', function(e) {
        if (e.target.closest('.tool-cat') || e.target.closest('.tool-cat-panel') || e.target.closest('.popup')) return;
        _fermerTousPanels();
    });
})();
var dernierX = null;
var dernierZ = null;
var seuilAimant = 0.8;
var mouseDownPos = { x: 0, y: 0 };
var survolElement = null;
var survolInfo = null;
var materialsOriginaux = [];
var ghostTrou = null;
var dirMenuOuvert = false;

function snapGrille(val) {
    return grille > 0 ? Math.round(val / grille) * grille : val;
}

// ========================================
// TYPES DE BRIQUES (dimensions reelles)
// ========================================

var BRIQUES_TYPES = {
    standard:   { longueur: 0.22,  hauteur: 0.065, epaisseur: 0.11,  joint: 0.01, nom: 'Standard',          couleur: '#8B4513', jointCouleur: '#C8C0B8' },
    pleine:     { longueur: 0.215, hauteur: 0.065, epaisseur: 0.105, joint: 0.01, nom: 'Pleine',            couleur: '#A0522D', jointCouleur: '#C8C0B8' },
    creuse:     { longueur: 0.50,  hauteur: 0.20,  epaisseur: 0.20,  joint: 0.01, nom: 'Creuse',            couleur: '#C4785A', jointCouleur: '#B0A89C' },
    platriere:  { longueur: 0.40,  hauteur: 0.20,  epaisseur: 0.05,  joint: 0.005, nom: 'Platriere',        couleur: '#E8D8C8', jointCouleur: '#F0EBE4' },
    parpaing:   { longueur: 0.50,  hauteur: 0.20,  epaisseur: 0.20,  joint: 0.01, nom: 'Parpaing',          couleur: '#888888', jointCouleur: '#A0A0A0' },
    beton_cell: { longueur: 0.60,  hauteur: 0.25,  epaisseur: 0.20,  joint: 0.003, nom: 'Beton cellulaire', couleur: '#D0D0D0', jointCouleur: '#E8E8E8' },
    monomur:    { longueur: 0.50,  hauteur: 0.25,  epaisseur: 0.30,  joint: 0.01, nom: 'Monomur',           couleur: '#C87C5A', jointCouleur: '#B0A89C' },
    pierre:     { longueur: 0.40,  hauteur: 0.20,  epaisseur: 0.20,  joint: 0.015, nom: 'Pierre de taille', couleur: '#D4C8A8', jointCouleur: '#B8B0A0' }
};

// ========================================
// LECTURE FORMULAIRE
// ========================================

function lireParams() {
    var type = document.getElementById('f-type').value;
    var briqueType = document.getElementById('f-brique-type').value;
    var params = {
        couleur: document.getElementById('f-couleur').value,
        opacite: parseInt(document.getElementById('f-opacite').value) / 100,
        jointCouleur: document.getElementById('f-joint').value,
        jointOpacite: parseInt(document.getElementById('f-opacite-joint').value) / 100,
        distance: parseFloat(document.getElementById('f-distance').value) || 5,
        hauteur: parseFloat(document.getElementById('f-hauteur').value) || 2.50,
        briqueType: briqueType
    };
    if (type === 'carre') {
        params.nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;
        params.angleDepart = parseInt(document.getElementById('f-angle').value) || 0;
    } else {
        params.angle = parseInt(document.getElementById('f-angle').value) || 0;
    }
    if (document.getElementById('f-bicolore').checked) {
        params.bicolore = {
            couleur2: document.getElementById('f-couleur2').value,
            opacite2: parseInt(document.getElementById('f-opacite2').value) / 100
        };
    }
    return params;
}

// ========================================
// GHOST (preview transparente)
// ========================================

function creerGhost() {
    supprimerGhost();
    var params = lireParams();
    var d = params.distance;
    var h = params.hauteur;
    var bt = BRIQUES_TYPES[params.briqueType] || BRIQUES_TYPES.standard;
    var e = bt.epaisseur;

    var mat = new THREE.MeshBasicMaterial({
        color: params.couleur,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });

    if (params.nbCotes && params.nbCotes > 1) {
        ghostMesh = new THREE.Group();
        var posX = 0;
        var posZ = 0;
        var angle = params.angleDepart || 0;
        for (var c = 0; c < params.nbCotes; c++) {
            var geo = new THREE.BoxGeometry(d, h, e);
            var mur = new THREE.Mesh(geo, mat);
            var rad = angle * Math.PI / 180;
            var cx = posX + Math.cos(rad) * d / 2;
            var cz = posZ + Math.sin(rad) * d / 2;
            mur.position.set(cx, h / 2, cz);
            mur.rotation.y = -rad;
            ghostMesh.add(mur);
            posX += Math.cos(rad) * d;
            posZ += Math.sin(rad) * d;
            angle += 90;
        }
    } else {
        var geo = new THREE.BoxGeometry(d, h, e);
        ghostMesh = new THREE.Mesh(geo, mat);
        ghostMesh.position.y = h / 2;
        var a = (params.angle || 0) * Math.PI / 180;
        ghostMesh.rotation.y = -a;
        ghostMesh.position.x = Math.cos(a) * d / 2;
        ghostMesh.position.z = Math.sin(a) * d / 2;
        var wrapper = new THREE.Group();
        wrapper.add(ghostMesh);
        ghostMesh = wrapper;
    }

    ghostMesh.visible = false;
    sceneManager.scene.add(ghostMesh);
}

function supprimerGhost() {
    if (ghostMesh) {
        sceneManager.scene.remove(ghostMesh);
        ghostMesh = null;
    }
}

// ========================================
// GESTION LISTE MESURES
// ========================================

function ajouterMesureListe(p1, p2, dist, distH, distV) {
    var id = Date.now();
    var mesure = {
        id: id,
        p1: p1,
        p2: p2,
        dist: dist,
        distH: distH,
        distV: distV,
        ligne: mesureLigne,
        sphere1: mesureSphere1,
        sphere2: mesureSphere2
    };
    mesuresListe.push(mesure);
    rafraichirMesuresPanel();
    return mesure;
}

function supprimerMesureItem(id) {
    for (var i = 0; i < mesuresListe.length; i++) {
        if (mesuresListe[i].id === id) {
            var m = mesuresListe[i];
            if (m.ligne) { sceneManager.scene.remove(m.ligne); m.ligne.geometry.dispose(); m.ligne.material.dispose(); }
            if (m.sphere1) { sceneManager.scene.remove(m.sphere1); m.sphere1.geometry.dispose(); m.sphere1.material.dispose(); }
            if (m.sphere2) { sceneManager.scene.remove(m.sphere2); m.sphere2.geometry.dispose(); m.sphere2.material.dispose(); }
            mesuresListe.splice(i, 1);
            break;
        }
    }
    rafraichirMesuresPanel();
}

function supprimerToutesMesures() {
    for (var i = 0; i < mesuresListe.length; i++) {
        var m = mesuresListe[i];
        if (m.ligne) { sceneManager.scene.remove(m.ligne); m.ligne.geometry.dispose(); m.ligne.material.dispose(); }
        if (m.sphere1) { sceneManager.scene.remove(m.sphere1); m.sphere1.geometry.dispose(); m.sphere1.material.dispose(); }
        if (m.sphere2) { sceneManager.scene.remove(m.sphere2); m.sphere2.geometry.dispose(); m.sphere2.material.dispose(); }
    }
    mesuresListe = [];
    rafraichirMesuresPanel();
}

function creerTrouDepuisMesure(mesure) {
    // Trouver le mur le plus proche du milieu de la mesure
    var midX = (mesure.p1.x + mesure.p2.x) / 2;
    var midZ = (mesure.p1.z + mesure.p2.z) / 2;
    var midY = Math.min(mesure.p1.y, mesure.p2.y);

    var bestEl = null;
    var bestDist = Infinity;
    for (var i = 0; i < editeur.elements.length; i++) {
        var el = editeur.elements[i];
        var segs = editeur._segments(el.params);
        for (var s = 0; s < segs.length; s++) {
            var seg = segs[s];
            var dx = seg.x2 - seg.x1, dz = seg.z2 - seg.z1;
            var len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) continue;
            var nx = dx / len, nz = dz / len;
            var px = midX - seg.x1, pz = midZ - seg.z1;
            var proj = px * nx + pz * nz;
            proj = Math.max(0, Math.min(len, proj));
            var cx = seg.x1 + nx * proj;
            var cz = seg.z1 + nz * proj;
            var d = Math.sqrt((midX - cx) * (midX - cx) + (midZ - cz) * (midZ - cz));
            if (d < bestDist) {
                bestDist = d;
                bestEl = el;
            }
        }
    }

    if (!bestEl || bestDist > 0.5) {
        document.getElementById('info-bar').textContent = 'Aucun mur trouve a proximite de la mesure';
        return;
    }

    // Calculer les dimensions du trou
    var largeur = mesure.distH;
    var hauteur = mesure.distV > 0.1 ? mesure.distV : (bestEl.params.hauteur || 2.5);

    // Trouver la position sur le mur
    var pos = editeur.trouverPositionSurMur(bestEl, midX, midZ);

    var trou = {
        largeur: largeur,
        hauteur: hauteur,
        y: midY,
        mur: pos.mur,
        x: Math.max(0, pos.localX - largeur / 2)
    };

    editeur.sauvegarderEtat();
    editeur.ajouterTrouElement(bestEl.id, trou);
    document.getElementById('info-bar').textContent = 'Trou cree : ' + largeur.toFixed(2) + 'm x ' + hauteur.toFixed(2) + 'm sur ' + (bestEl.nom || 'Mur ' + bestEl.id);
}

function rafraichirMesuresPanel() {
    var panel = document.getElementById('mesures-panel');
    var list = document.getElementById('mesures-list');
    if (mesuresListe.length === 0) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';
    var html = '';
    for (var i = 0; i < mesuresListe.length; i++) {
        var m = mesuresListe[i];
        var txt = (i + 1) + '. ' + m.dist.toFixed(2) + 'm';
        if (m.distV > 0.01) txt += ' (H:' + m.distH.toFixed(2) + ' V:' + m.distV.toFixed(2) + ')';
        html += '<div class="mesure-item" data-id="' + m.id + '">';
        html += '<span class="mesure-txt" data-id="' + m.id + '">' + txt + '</span>';
        html += '<span class="mesure-trou" data-id="' + m.id + '" title="Creer un trou avec cette mesure" style="cursor:pointer;color:#e94560;font-size:10px;margin-left:4px;">TROU</span>';
        html += '<span class="mesure-del" data-id="' + m.id + '">X</span>';
        html += '</div>';
    }
    list.innerHTML = html;
}

// ========================================
// GHOST REDIMENSIONNEMENT
// ========================================

function creerRedimGhost(el) {
    supprimerRedimGhost();
    var p = el.params;
    var rad = (p.angle || 0) * Math.PI / 180;
    var x = p.x || 0, z = p.z || 0;
    // Creer un simple mur transparent comme apercu
    var geo = new THREE.BoxGeometry(p.distance, p.hauteur || 2.5, 0.11);
    var mat = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.15,
        depthWrite: false
    });
    redimGhost = new THREE.Mesh(geo, mat);
    // Positionner au centre du mur
    var cx = x + Math.cos(rad) * p.distance / 2;
    var cz = z + Math.sin(rad) * p.distance / 2;
    redimGhost.position.set(cx, (p.hauteur || 2.5) / 2, cz);
    redimGhost.rotation.y = -rad;
    sceneManager.scene.add(redimGhost);
}

function supprimerRedimGhost() {
    if (redimGhost) {
        sceneManager.scene.remove(redimGhost);
        if (redimGhost.geometry) redimGhost.geometry.dispose();
        if (redimGhost.material) redimGhost.material.dispose();
        redimGhost = null;
    }
}

// ========================================
// MESURE
// ========================================

function supprimerMesure() {
    if (mesureLigne) {
        sceneManager.scene.remove(mesureLigne);
        if (mesureLigne.geometry) mesureLigne.geometry.dispose();
        if (mesureLigne.material) mesureLigne.material.dispose();
        mesureLigne = null;
    }
    if (mesureSphere1) {
        sceneManager.scene.remove(mesureSphere1);
        mesureSphere1.geometry.dispose();
        mesureSphere1.material.dispose();
        mesureSphere1 = null;
    }
    if (mesureSphere2) {
        sceneManager.scene.remove(mesureSphere2);
        mesureSphere2.geometry.dispose();
        mesureSphere2.material.dispose();
        mesureSphere2 = null;
    }
    mesurePoint1 = null;
}

function creerSphere(x, y, z, couleur) {
    var geo = new THREE.SphereGeometry(0.08, 12, 12);
    var mat = new THREE.MeshBasicMaterial({ color: couleur });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(x, y, z);
    sceneManager.scene.add(sphere);
    return sphere;
}

function majLigneMesure(x1, y1, z1, x2, y2, z2) {
    if (mesureLigne) {
        sceneManager.scene.remove(mesureLigne);
        mesureLigne.geometry.dispose();
        mesureLigne.material.dispose();
    }
    var geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(x2, y2, z2)
    ]);
    var mat = new THREE.LineBasicMaterial({ color: '#00ccff', linewidth: 2 });
    mesureLigne = new THREE.Line(geo, mat);
    sceneManager.scene.add(mesureLigne);
}

// ========================================
// ACTIVER / DESACTIVER LES MODES
// ========================================

function toutDesactiver() {
    modePlacement = false;
    modeSuppression = false;
    modeTrou = false;
    trouEtape = 0;
    trouMurElement = null;
    if (trouLigneV) { sceneManager.scene.remove(trouLigneV); trouLigneV.geometry.dispose(); trouLigneV.material.dispose(); trouLigneV = null; }
    modeDeplacement = false;
    modeEdition = false;
    editionElement = null;
    modeGrouper = false;
    grouperSelection = [];
    modeDegrouper = false;
    modeRedim = false;
    redimVertical = false;
    redimPerp = false;
    redimPerpElement = null;
    redimPerpNewEl = null;
    if (redimPerpGhost) { sceneManager.scene.remove(redimPerpGhost); redimPerpGhost = null; }
    redimProp = false;
    redimPropElement = null;
    redimElement = null;
    redimCote = null;
    supprimerRedimGhost();
    redimMultiSeg = -1;
    modeDeplacerVertical = false;
    deplacerVElement = null;
    modeDeplacerHorizontal = false;
    deplacerHElement = null;
    modeMesure = false;
    supprimerMesure();
    modeTrouRapide = false;
    trouRapideForme = 'rect';
    trouRapideElement = null;
    trouSelectElement = null;
    modeFenetre = false;
    fenetreModele = null;
    modePorte = false;
    porteModele = null;
    modeDeplacerFenetre = false;
    deplacerFenetreExcl = null;
    modeDeplacerPorte = false;
    deplacerPorteInfo = null;
    modePersonnage = false;
    modeDeplacerPerso = false;
    deplacerPersoGroup = null;
    if (personnageGhost) { sceneManager.scene.remove(personnageGhost); personnageGhost = null; }
    document.getElementById('personnage-popup').style.display = 'none';
    document.getElementById('ctx-perso-menu').style.display = 'none';
    document.getElementById('edit-perso-popup').style.display = 'none';
    modeEscalier = false;
    escalierModele = null;
    modeDeplacerEscalier = false;
    deplacerEscalierGroup = null;
    if (escalierGhost) { sceneManager.scene.remove(escalierGhost); escalierGhost = null; }
    document.getElementById('escalier-popup').style.display = 'none';
    document.getElementById('ctx-escalier-menu').style.display = 'none';
    document.getElementById('edit-escalier-popup').style.display = 'none';
    modePlafond4pts = false;
    plafondPoints = [];
    for (var _pm = 0; _pm < plafondMarkers.length; _pm++) sceneManager.scene.remove(plafondMarkers[_pm]);
    plafondMarkers = [];
    for (var _pl = 0; _pl < plafondGhostLines.length; _pl++) { sceneManager.scene.remove(plafondGhostLines[_pl]); plafondGhostLines[_pl].geometry.dispose(); plafondGhostLines[_pl].material.dispose(); }
    plafondGhostLines = [];
    if (plafondGhostRect) { sceneManager.scene.remove(plafondGhostRect); plafondGhostRect = null; }
    document.getElementById('plafond-4pts-popup').style.display = 'none';
    document.getElementById('ctx-plafond-menu').style.display = 'none';
    document.getElementById('edit-plafond-popup').style.display = 'none';
    _epfDeplacerPtIdx = -1;
    if (typeof _epfSupprimerMarkers === 'function') _epfSupprimerMarkers();
    modePlaco = false;
    placoModele = null;
    placoDrag = false;
    placoDragStart = null;
    modeDeplacerPlaco = false;
    deplacerPlacoGroup = null;
    deplacerPlacoOrigPos = null;
    if (ghostPlaco) { sceneManager.scene.remove(ghostPlaco); ghostPlaco = null; }
    for (var _gp = 0; _gp < ghostPlacoGroupe.length; _gp++) sceneManager.scene.remove(ghostPlacoGroupe[_gp]);
    ghostPlacoGroupe = [];
    document.getElementById('placo-popup').style.display = 'none';
    document.getElementById('edit-placo-popup').style.display = 'none';
    document.getElementById('ctx-placo-menu').style.display = 'none';
    modePlinthe = false;
    ctxPlintheGroup = null;
    if (ghostPlinthe) { sceneManager.scene.remove(ghostPlinthe); ghostPlinthe = null; }
    if (typeof _nettoyerGhostPlintheTout === 'function') _nettoyerGhostPlintheTout();
    document.getElementById('plinthe-popup').style.display = 'none';
    document.getElementById('ctx-plinthe-menu').style.display = 'none';
    modeCarrelage = false;
    ctxCarrelageGroup = null;
    if (ghostCarrelage) { sceneManager.scene.remove(ghostCarrelage); ghostCarrelage = null; }
    if (typeof _nettoyerGhostCarrelageTout === 'function') _nettoyerGhostCarrelageTout();
    modeCarrelageSol = false;
    if (ghostCarrelageSol) { sceneManager.scene.remove(ghostCarrelageSol); ghostCarrelageSol = null; }
    document.getElementById('carrelage-sol-popup').style.display = 'none';
    document.getElementById('carrelage-popup').style.display = 'none';
    document.getElementById('ctx-carrelage-menu').style.display = 'none';
    modePapierPeint = false;
    ctxPPGroup = null;
    if (ghostPP) { sceneManager.scene.remove(ghostPP); ghostPP = null; }
    if (typeof _nettoyerGhostPPTout === 'function') _nettoyerGhostPPTout();
    document.getElementById('papier-peint-popup').style.display = 'none';
    document.getElementById('ctx-pp-menu').style.display = 'none';
    modeTrait = false;
    traitDrag = false;
    traitStart = null;
    modeDeplacerTrait = false;
    deplacerTraitObj = null;
    deplacerTraitOrig = null;
    ctxTrait = null;
    editTrait = null;
    if (ghostTrait) { sceneManager.scene.remove(ghostTrait); ghostTrait = null; }
    if (ghostTraitCurseur) { sceneManager.scene.remove(ghostTraitCurseur); ghostTraitCurseur = null; }
    document.getElementById('trait-popup').style.display = 'none';
    document.getElementById('edit-trait-popup').style.display = 'none';
    document.getElementById('ctx-trait-menu').style.display = 'none';
    document.getElementById('btn-trait').classList.remove('actif');
    document.getElementById('btn-trait').style.borderColor = '';
    // Masquer les traits si le mode zones n'est pas actif
    if (!modeZones) {
        for (var ti = 0; ti < editeur.traits.length; ti++) {
            editeur.traits[ti].line.visible = false;
        }
    }
    modeAgrandirPlaque = false;
    agrandirPlaqueGroup = null;
    agrandirPlaqueType = null;
    agrandirPlaqueInfo = null;
    agrandirPlaqueSeg = null;
    if (agrandirPlaqueGhost) { sceneManager.scene.remove(agrandirPlaqueGhost); agrandirPlaqueGhost = null; }
    modeLaine = false;
    laineModele = null;
    laineDrag = false;
    laineDragStart = null;
    modeDeplacerLaine = false;
    deplacerLaineGroup = null;
    deplacerLaineOrigPos = null;
    if (ghostLaine) { sceneManager.scene.remove(ghostLaine); ghostLaine = null; }
    document.getElementById('laine-popup').style.display = 'none';
    document.getElementById('edit-laine-popup').style.display = 'none';
    document.getElementById('ctx-laine-menu').style.display = 'none';
    modeEffacerZone = false;
    effacerStart = null;
    effacerDrag = false;
    if (window._effacerRect3D) { sceneManager.scene.remove(window._effacerRect3D); window._effacerRect3D = null; }
    modeDeplacerZone = false;
    deplacerZonePhase = 'select';
    deplacerZoneStart = null;
    deplacerZoneDrag = false;
    deplacerZoneElements = [];
    deplacerZoneMoveStart = null;
    if (window._deplacerZoneRect3D) { sceneManager.scene.remove(window._deplacerZoneRect3D); window._deplacerZoneRect3D = null; }
    modeCopierZone = false;
    copierZonePhase = 'select';
    copierZoneStart = null;
    copierZoneDrag = false;
    copierZoneData = null;
    copierZoneMoveStart = null;
    if (window._copierZoneRect3D) { sceneManager.scene.remove(window._copierZoneRect3D); window._copierZoneRect3D = null; }
    if (window._copierZoneGhosts) {
        for (var gi = 0; gi < window._copierZoneGhosts.length; gi++) {
            sceneManager.scene.remove(window._copierZoneGhosts[gi]);
        }
        window._copierZoneGhosts = null;
    }
    document.getElementById('trou-rapide-popup').style.display = 'none';
    document.getElementById('trou-choix-popup').style.display = 'none';
    document.getElementById('fenetre-popup').style.display = 'none';
    document.getElementById('edit-fenetre-popup').style.display = 'none';
    document.getElementById('porte-popup').style.display = 'none';
    document.getElementById('edit-porte-popup').style.display = 'none';
    document.getElementById('ctx-porte-menu').style.display = 'none';
    document.getElementById('rotation-bar').style.display = 'none';
    document.getElementById('plateau-popup').style.display = 'none';
    document.getElementById('trou-precis-popup').style.display = 'none';
    document.getElementById('nf-precis-popup').style.display = 'none';
    document.getElementById('np-precis-popup').style.display = 'none';
    // Restaurer positions des placos/laines si deplacement annule
    for (var pi = 0; pi < deplacerMurPlacos.length; pi++) {
        var dp = deplacerMurPlacos[pi];
        dp.ref.position.x = dp.origPosX;
        dp.ref.position.z = dp.origPosZ;
    }
    deplacerMurPlacos = [];
    for (var li = 0; li < deplacerMurLaines.length; li++) {
        var dl = deplacerMurLaines[li];
        dl.ref.position.x = dl.origPosX;
        dl.ref.position.z = dl.origPosZ;
    }
    deplacerMurLaines = [];
    // Restaurer positions des exclusions
    for (var ei = 0; ei < deplacerExclusions.length; ei++) {
        var de = deplacerExclusions[ei];
        if (de.excl.group3D) {
            de.excl.group3D.position.x = de.origX;
            de.excl.group3D.position.z = de.origZ;
        }
    }
    deplacerExclusions = [];
    deplacementElement = null;
    deplacementSelectionne = false;
    deplacementGroup = null;
    deplacementGroupeIds = [];
    deplacementGroupes3D = [];
    supprimerGhost();
    supprimerGhostTrou();
    restaurerSurlignage();
    survolInfo = null;
    document.getElementById('params-popup').style.display = 'none';
    document.getElementById('trou-popup').style.display = 'none';
    document.getElementById('edit-popup').style.display = 'none';
    document.getElementById('grouper-bar').style.display = 'none';
    document.getElementById('ctx-menu').style.display = 'none';
    document.getElementById('ctx-fenetre-menu').style.display = 'none';
    ctxElement = null;
    document.getElementById('dir-menu').style.display = 'none';
    document.getElementById('zone-popup').style.display = 'none';
    dirMenuOuvert = false;
    var dirs = document.querySelectorAll('.dir-btn');
    for (var i = 0; i < dirs.length; i++) dirs[i].classList.remove('actif');
    document.getElementById('btn-mur').classList.remove('actif');
    var optBtns = ['btn-supprimer-mode','btn-trou-mode','btn-deplacer-mode','btn-editer-mode','btn-grouper-mode','btn-degrouper-mode'];
    for (var b = 0; b < optBtns.length; b++) {
        var el = document.getElementById(optBtns[b]);
        if (el) el.classList.remove('actif');
    }
    sceneManager.controls.enabled = true;
    document.getElementById('info-bar').textContent = 'Clic droit = orbiter | Molette = zoom';
    container.style.cursor = 'default';
    // Retirer l'etat actif de tous les outils dans les panels de categories
    var _allPanelBtns = document.querySelectorAll('.tool-cat-panel .tool-btn');
    for (var _ab = 0; _ab < _allPanelBtns.length; _ab++) {
        if (_allPanelBtns[_ab].id === 'btn-aimant') continue;
        _allPanelBtns[_ab].classList.remove('actif');
        _allPanelBtns[_ab].style.borderColor = '';
    }
    var _allCatBtns = document.querySelectorAll('.tool-cat-btn');
    for (var _ab = 0; _ab < _allCatBtns.length; _ab++) _allCatBtns[_ab].classList.remove('cat-actif');
}

function activerPlacement() {
    toutDesactiver();
    modePlacement = true;
    creerGhost();
    sceneManager.controls.enabled = true;
    document.getElementById('params-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'MODE PLACEMENT — Cliquez pour poser | Echap = annuler';
    container.style.cursor = 'crosshair';
}

function activerTrou() {
    toutDesactiver();
    modeTrou = true;
    sceneManager.controls.enabled = true;
    document.getElementById('trou-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'MODE TROU — Cliquez sur un mur | Echap = annuler';
    container.style.cursor = 'crosshair';
    creerGhostTrou();
}

function activerSuppression() {
    toutDesactiver();
    modeSuppression = true;
    sceneManager.controls.enabled = true;
    document.getElementById('info-bar').textContent = 'MODE SUPPRESSION — Cliquez sur un mur | Echap = annuler';
    container.style.cursor = 'crosshair';
}

function activerEdition() {
    toutDesactiver();
    modeEdition = true;
    sceneManager.controls.enabled = true;
    document.getElementById('info-bar').textContent = 'MODE EDITION — Cliquez sur un mur pour le modifier | Echap = annuler';
    container.style.cursor = 'pointer';
}

function ouvrirEdition(el) {
    editionElement = el;
    var p = el.params;
    document.getElementById('e-brique-type').value = p.briqueType || 'standard';
    document.getElementById('e-distance').value = p.distance || 5;
    document.getElementById('e-hauteur').value = p.hauteur || 2.5;
    document.getElementById('e-angle').value = p.angle || 0;
    document.getElementById('e-couleur').value = p.couleur || '#8B4513';
    document.getElementById('e-opacite').value = p.opacite !== undefined ? p.opacite : 99;
    document.getElementById('e-joint').value = p.jointCouleur || '#CCCCCC';
    document.getElementById('e-opacite-joint').value = p.jointOpacite !== undefined ? p.jointOpacite : 99;
    var nomTxt = el.nom || ('Mur ' + el.id);
    if (el.params.groupeId) nomTxt += ' (groupe ' + el.params.groupeId + ')';
    document.getElementById('edit-mur-nom').textContent = nomTxt;
    document.getElementById('btn-edit-degrouper').style.display = el.params.groupeId ? 'block' : 'none';
    // Surligner le bouton angle actif
    var angleBtns = document.querySelectorAll('.e-angle-btn');
    for (var i = 0; i < angleBtns.length; i++) {
        angleBtns[i].style.borderColor = (parseInt(angleBtns[i].getAttribute('data-angle')) === (p.angle || 0)) ? '#ffa500' : '#333';
    }
    document.getElementById('edit-popup').style.display = 'block';
}

function validerGrouper() {
    if (grouperSelection.length >= 2) {
        editeur.sauvegarderEtat();
        editeur.grouperElements(grouperSelection);
        var nb = grouperSelection.length;
        toutDesactiver();
        document.getElementById('info-bar').textContent = nb + ' murs groupes !';
    }
}

function activerGrouper() {
    toutDesactiver();
    modeGrouper = true;
    grouperSelection = [];
    sceneManager.controls.enabled = true;
    document.getElementById('grouper-bar').style.display = 'block';
    document.getElementById('info-bar').textContent = 'MODE GROUPER — Cliquez sur les murs a grouper';
    container.style.cursor = 'pointer';
}

function activerDegrouper() {
    toutDesactiver();
    modeDegrouper = true;
    sceneManager.controls.enabled = true;
    document.getElementById('info-bar').textContent = 'MODE DEGROUPER — Cliquez sur un mur groupe pour le separer | Echap = annuler';
    container.style.cursor = 'pointer';
}

function activerDeplacement() {
    toutDesactiver();
    modeDeplacement = true;
    sceneManager.controls.enabled = true;
    document.getElementById('info-bar').textContent = 'MODE DEPLACEMENT — Cliquez sur un mur pour le selectionner | Echap = annuler';
    container.style.cursor = 'grab';
}

// ========================================
// GHOST TROU (preview du trou)
// ========================================

function creerGhostTrou() {
    supprimerGhostTrou();
    var largeur = parseFloat(document.getElementById('f-trou-largeur').value) || 0.9;
    var hauteur = parseFloat(document.getElementById('f-trou-hauteur').value) || 2.1;
    var geo = new THREE.BoxGeometry(largeur, hauteur, 0.15);
    var mat = new THREE.MeshBasicMaterial({
        color: '#ff0000',
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    ghostTrou = new THREE.Mesh(geo, mat);
    ghostTrou.visible = false;
    sceneManager.scene.add(ghostTrou);
}

function supprimerGhostTrou() {
    if (ghostTrou) {
        sceneManager.scene.remove(ghostTrou);
        ghostTrou = null;
    }
}

// Positionner le ghost trou sur un mur a partir du hit point
// Trouver les exclusions (fenetres/portes) liees a un mur
function trouverExclusionsMur(el) {
    var result = [];
    var segs = editeur._segments(el.params);

    for (var i = 0; i < editeur.exclusions.length; i++) {
        var excl = editeur.exclusions[i];
        var found = false;
        for (var s = 0; s < segs.length && !found; s++) {
            var seg = segs[s];
            var sdx = seg.x2 - seg.x1;
            var sdz = seg.z2 - seg.z1;
            var sLen = Math.sqrt(sdx * sdx + sdz * sdz);
            if (sLen < 0.01) continue;
            var snx = sdx / sLen;
            var snz = sdz / sLen;
            var edx = excl.x - seg.x1;
            var edz = excl.z - seg.z1;
            var proj = edx * snx + edz * snz;
            var perp = Math.abs(-edx * snz + edz * snx);
            if (perp < 0.50 && proj > -excl.largeur && proj < sLen + excl.largeur) {
                found = true;
            }
        }
        if (found) result.push(excl);
    }
    return result;
}

function positionnerGhostTrou(element, hitPoint) {
    if (!ghostTrou || !element) return;

    var params = element.params;
    var segs = editeur._segments(params);
    var pos = editeur.trouverPositionSurMur(element, hitPoint.x, hitPoint.z);

    // Anti-saut : rester sur le meme segment sauf si un autre est nettement plus proche
    if (segs.length > 1 && ghostTrou._lastMur !== undefined && ghostTrou._lastMur !== pos.mur) {
        var lastSeg = segs[ghostTrou._lastMur];
        if (lastSeg) {
            var ldx = lastSeg.x2 - lastSeg.x1, ldz = lastSeg.z2 - lastSeg.z1;
            var llen = Math.sqrt(ldx * ldx + ldz * ldz);
            var lnx = ldx / llen, lnz = ldz / llen;
            var lpx = hitPoint.x - lastSeg.x1, lpz = hitPoint.z - lastSeg.z1;
            var lproj = Math.max(0, Math.min(llen, lpx * lnx + lpz * lnz));
            var lcx = lastSeg.x1 + lnx * lproj, lcz = lastSeg.z1 + lnz * lproj;
            var ldist = Math.sqrt((hitPoint.x - lcx) * (hitPoint.x - lcx) + (hitPoint.z - lcz) * (hitPoint.z - lcz));
            // Garder l'ancien segment si la distance est acceptable (hysteresis 0.3m)
            if (ldist < 0.30) {
                pos = { mur: ghostTrou._lastMur, localX: lproj };
            }
        }
    }
    ghostTrou._lastMur = pos.mur;

    var seg = segs[pos.mur];
    if (!seg) { ghostTrou.visible = false; return; }

    var largeur, hauteur, trouY, align;
    if (modeDeplacerFenetre && deplacerFenetreInfo) {
        largeur = deplacerFenetreInfo.largeur;
        hauteur = deplacerFenetreInfo.hauteur;
        trouY = deplacerFenetreInfo.y;
        align = 'click';
    } else if (modeDeplacerPorte && deplacerPorteInfo) {
        largeur = deplacerPorteInfo.largeur;
        hauteur = deplacerPorteInfo.hauteur;
        trouY = deplacerPorteInfo.y;
        align = 'click';
    } else if (modeFenetre && fenetreModele) {
        largeur = fenetreModele.largeur;
        hauteur = fenetreModele.hauteur;
        trouY = fenetreModele.y;
        align = 'click';
    } else if (modePorte && porteModele) {
        largeur = porteModele.largeur;
        hauteur = porteModele.hauteur;
        trouY = porteModele.y;
        align = 'click';
    } else if (modeTrouRapide) {
        largeur = parseFloat(document.getElementById('tr-largeur').value) || 0.9;
        hauteur = parseFloat(document.getElementById('tr-hauteur').value) || 2.1;
        trouY = parseFloat(document.getElementById('tr-y').value) || 0;
        align = document.getElementById('tr-align').value;
    } else {
        largeur = parseFloat(document.getElementById('f-trou-largeur').value) || 0.9;
        hauteur = parseFloat(document.getElementById('f-trou-hauteur').value) || 2.1;
        trouY = parseFloat(document.getElementById('f-trou-y').value) || 0;
        align = document.getElementById('f-trou-align').value;
    }

    // Mettre a jour la geometrie si la taille a change
    var geoParams = ghostTrou.geometry.parameters;
    if (trouRapideForme === 'rond') {
        var diam = Math.max(largeur, hauteur);
        if (!geoParams.radiusTop || geoParams.radiusTop !== diam / 2) {
            ghostTrou.geometry.dispose();
            ghostTrou.geometry = new THREE.CylinderGeometry(diam / 2, diam / 2, 0.15, 32);
            ghostTrou.rotation.x = Math.PI / 2;
        }
    } else if (geoParams.width !== largeur || geoParams.height !== hauteur) {
        ghostTrou.geometry.dispose();
        ghostTrou.geometry = new THREE.BoxGeometry(largeur, hauteur, 0.15);
    }

    // Direction du segment
    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len;
    var nz = dz / len;

    // Position X le long du mur
    var localX;
    if (align === 'click') {
        localX = pos.localX;
    } else if (align === 'center') {
        localX = len / 2;
    } else if (align === 'start') {
        localX = largeur / 2;
    } else if (align === 'end') {
        localX = len - largeur / 2;
    } else {
        localX = pos.localX;
    }

    // Clamper dimensions pour ne pas depasser le mur
    var hMur = element.params.hauteur || 2.5;
    if (largeur > len - 0.02) largeur = len - 0.02;
    if (hauteur + trouY > hMur) hauteur = hMur - trouY;
    if (trouY < 0) trouY = 0;
    localX = Math.max(largeur / 2 + 0.01, Math.min(len - largeur / 2 - 0.01, localX));

    // Position monde du centre du trou
    var wx = seg.x1 + nx * localX;
    var wz = seg.z1 + nz * localX;
    var wy = trouY + hauteur / 2;

    // Placer le ghost au centre de l'epaisseur du mur (meme position que l'element final)
    var nnx = -dz / len;
    var nnz = dx / len;
    var bt = BRIQUES_TYPES[element.params.briqueType] || BRIQUES_TYPES.standard;
    var ghostOffset = bt.epaisseur / 2;
    var camPerpDot = (sceneManager.camera.position.x - seg.x1) * nnx + (sceneManager.camera.position.z - seg.z1) * nnz;
    if (camPerpDot < 0) ghostOffset = -ghostOffset;
    ghostTrou.position.set(wx + nnx * ghostOffset, wy, wz + nnz * ghostOffset);

    // Rotation = meme que le mur
    var angle = Math.atan2(dz, dx);
    ghostTrou.rotation.y = -angle;

    // Forcer l'affichage par-dessus placo/laine
    ghostTrou.renderOrder = 999;
    ghostTrou.material.depthTest = false;
    ghostTrou.renderOrder = 999;

    ghostTrou.visible = true;
}

// ========================================
// SURLIGNAGE (trou + suppression)
// ========================================

function trouverElementParObjet(obj) {
    // Chercher le tag editeurId sur l'objet ou ses parents
    var current = obj;
    while (current) {
        if (current.userData && current.userData.editeurId !== undefined) {
            var id = current.userData.editeurId;
            for (var j = 0; j < editeur.elements.length; j++) {
                if (editeur.elements[j].id === id) {
                    var el = editeur.elements[j];
                    return { type: 'editeur', element: el, group: el.group || el.brique.group };
                }
            }
        }
        current = current.parent;
    }
    return null;
}

// Trouver le mur editeur le plus proche d'un placo/laine (par angle et position)
function _trouverMurParPlacoLaine(placoOrLaineGroup) {
    var info = placoOrLaineGroup.userData.placoInfo || placoOrLaineGroup.userData.laineInfo;
    if (!info) return null;
    var bestEl = null;
    var bestDist = Infinity;
    for (var i = 0; i < editeur.elements.length; i++) {
        var el = editeur.elements[i];
        var segs = editeur._segments(el.params);
        for (var si = 0; si < segs.length; si++) {
            var s = segs[si];
            var sdx = s.x2 - s.x1, sdz = s.z2 - s.z1;
            var slen = Math.sqrt(sdx * sdx + sdz * sdz);
            if (slen < 0.01) continue;
            var sAngle = Math.atan2(sdz, sdx) * 180 / Math.PI;
            var dA = Math.abs(sAngle - info.angle) % 360;
            if (dA > 2 && dA < 358) continue;
            // Distance perpendiculaire du centre du placo/laine au segment
            var nx = -sdz / slen, nz = sdx / slen;
            var perpDist = Math.abs((info.worldX - s.x1) * nx + (info.worldZ - s.z1) * nz);
            // Distance le long du segment
            var proj = (info.worldX - s.x1) * (sdx / slen) + (info.worldZ - s.z1) * (sdz / slen);
            if (proj >= -info.largeur && proj <= slen + info.largeur && perpDist < bestDist) {
                bestDist = perpDist;
                bestEl = el;
            }
        }
    }
    return bestEl;
}

// Chercher le mur en traversant placo/laine — avec fallback si le raycaster ne trouve pas le mur
function _chercherMurTraversant(intersects, ghostObj) {
    var found = null;
    var foundHit = null;
    var firstPlacoLaine = null; // premier placo/laine touche (pour fallback)
    var firstPlacoLaineHit = null;
    for (var i = 0; i < intersects.length; i++) {
        if (ghostObj && intersects[i].object === ghostObj) continue;
        var ud = intersects[i].object.userData;
        if (!ud) continue;
        if (ud.isFenetre || ud.isPorte || ud.isEscalier || ud.isPlafond) continue;
        if (ud.isPlaco || ud.isLaine) {
            if (!firstPlacoLaine) {
                var obj = intersects[i].object;
                while (obj.parent && obj.parent !== sceneManager.scene) obj = obj.parent;
                if (obj.userData.placoInfo || obj.userData.laineInfo) {
                    firstPlacoLaine = obj;
                    firstPlacoLaineHit = intersects[i].point;
                }
            }
            continue;
        }
        found = trouverElementParObjet(intersects[i].object);
        if (found) { foundHit = intersects[i].point; break; }
    }
    // Fallback : si pas de mur trouve mais un placo/laine, chercher le mur correspondant
    if (!found && firstPlacoLaine) {
        var murEl = _trouverMurParPlacoLaine(firstPlacoLaine);
        if (murEl) {
            found = { type: 'editeur', element: murEl, group: murEl.group || murEl.brique.group };
            foundHit = firstPlacoLaineHit;
        }
    }
    return { found: found, hit: foundHit };
}

function estEnfantDe(obj, groupe) {
    var enfants = groupe.children;
    for (var i = 0; i < enfants.length; i++) {
        if (enfants[i] === obj) return true;
        if (enfants[i].children && enfants[i].children.length > 0) {
            if (estEnfantDe(obj, enfants[i])) return true;
        }
    }
    return false;
}

function surlignerGroupe(group, couleur) {
    couleur = couleur || '#ff0000';
    group.traverse(function(child) {
        if (child.isMesh || child.isInstancedMesh) {
            materialsOriginaux.push({ mesh: child, material: child.material });
            child.material = new THREE.MeshBasicMaterial({
                color: couleur,
                transparent: true,
                opacity: 0.4,
                depthWrite: false
            });
        }
    });
}

function restaurerSurlignage() {
    for (var i = 0; i < materialsOriginaux.length; i++) {
        if (materialsOriginaux[i].mesh) {
            materialsOriginaux[i].mesh.material = materialsOriginaux[i].material;
        }
    }
    materialsOriginaux = [];
    survolElement = null;
}

// ========================================
// EVENEMENTS SOURIS
// ========================================

container.addEventListener('pointermove', function(e) {
    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Mode deplacer fenetre : ghost suit la souris sur les murs
    if (modeDeplacerFenetre && deplacerFenetreInfo) {
        if (deplacerFenetreAxe === 'x' && deplacerFenetreMurEl) {
            raycaster.setFromCamera(mouse, sceneManager.camera);
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (result && ghostTrou) {
                var pos = editeur.trouverPositionSurMur(deplacerFenetreMurEl, pointSol.x, pointSol.z);
                var localY = deplacerFenetreInfo.y - (deplacerFenetreMurEl.params.y || 0);
                deplacerFenetreInfo.localX = pos.localX - deplacerFenetreInfo.largeur / 2;
                positionnerGhostPrecis(deplacerFenetreMurEl, deplacerFenetreInfo.localX, localY, deplacerFenetreInfo.largeur, deplacerFenetreInfo.hauteur, deplacerFenetreInfo.segIndex || 0);
                document.getElementById('info-bar').textContent = 'DEPLACER FENETRE X — X: ' + deplacerFenetreInfo.localX.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
            return;
        } else if (deplacerFenetreAxe === 'y' && deplacerFenetreMurEl) {
            // Deplacement Y pur : on bouge UNIQUEMENT ghostTrou.position.y
            if (ghostTrou) {
                var baseYF = deplacerFenetreMurEl.params.y || 0;
                // Premier mouvement : capturer reference
                if (deplacerFenetreInfo._startNdcY === undefined) {
                    deplacerFenetreInfo._startNdcY = mouse.y;
                    deplacerFenetreInfo._startGhostY = ghostTrou.position.y;
                    // Echelle : combien de metres par unite NDC a cette profondeur
                    var _distF = sceneManager.camera.position.distanceTo(ghostTrou.position);
                    var _fovF = sceneManager.camera.fov * Math.PI / 180;
                    deplacerFenetreInfo._mPerNdc = _distF * Math.tan(_fovF / 2);
                }
                var _deltaNdcF = mouse.y - deplacerFenetreInfo._startNdcY;
                var _deltaWorldF = _deltaNdcF * deplacerFenetreInfo._mPerNdc;
                var _newWY = deplacerFenetreInfo._startGhostY + _deltaWorldF;
                // Clamp dans les limites du mur
                var _minWY = baseYF + deplacerFenetreInfo.hauteur / 2;
                var _maxWY = baseYF + (deplacerFenetreMurEl.params.hauteur || 2.5) - deplacerFenetreInfo.hauteur / 2;
                _newWY = Math.max(_minWY, Math.min(_maxWY, _newWY));
                // Appliquer Y uniquement — X et Z restent figes
                ghostTrou.position.y = _newWY;
                // Mettre a jour info.y pour la validation au clic
                var _localYF = _newWY - deplacerFenetreInfo.hauteur / 2 - baseYF;
                _localYF = Math.round(_localYF * 20) / 20;
                deplacerFenetreInfo.y = _localYF + baseYF;
                document.getElementById('info-bar').textContent = 'DEPLACER FENETRE Y — Y: ' + _localYF.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
            return;
        }
        // Mode libre — traverse placo/laine pour trouver le mur (avec fallback)
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var res = _chercherMurTraversant(intersects, ghostTrou);
        var found = res.found;
        var foundHit = res.hit;
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#5bb8f0');
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
        }
        if (ghostTrou && found && foundHit) {
            positionnerGhostTrou(found.element, foundHit);
        } else if (ghostTrou) {
            ghostTrou.visible = false;
        }
        return;
    }

    // Mode deplacer porte : ghost suit la souris sur les murs
    if (modeDeplacerPorte && deplacerPorteInfo) {
        if (deplacerPorteAxe === 'x' && deplacerPorteMurEl) {
            // Axe X : ghost suit la souris le long du mur, Y fixe a l'origine
            raycaster.setFromCamera(mouse, sceneManager.camera);
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (result && ghostTrou) {
                var pos = editeur.trouverPositionSurMur(deplacerPorteMurEl, pointSol.x, pointSol.z);
                var localY = deplacerPorteInfo.y - (deplacerPorteMurEl.params.y || 0);
                deplacerPorteInfo.localX = pos.localX - deplacerPorteInfo.largeur / 2;
                positionnerGhostPrecis(deplacerPorteMurEl, deplacerPorteInfo.localX, localY, deplacerPorteInfo.largeur, deplacerPorteInfo.hauteur, deplacerPorteInfo.segIndex || 0);
                document.getElementById('info-bar').textContent = 'DEPLACER PORTE X — X: ' + deplacerPorteInfo.localX.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
            return;
        } else if (deplacerPorteAxe === 'y' && deplacerPorteMurEl) {
            // Deplacement Y pur : on bouge UNIQUEMENT ghostTrou.position.y
            if (ghostTrou) {
                var baseYP = deplacerPorteMurEl.params.y || 0;
                // Premier mouvement : capturer reference
                if (deplacerPorteInfo._startNdcY === undefined) {
                    deplacerPorteInfo._startNdcY = mouse.y;
                    deplacerPorteInfo._startGhostY = ghostTrou.position.y;
                    // Echelle : combien de metres par unite NDC a cette profondeur
                    var _distP = sceneManager.camera.position.distanceTo(ghostTrou.position);
                    var _fovP = sceneManager.camera.fov * Math.PI / 180;
                    deplacerPorteInfo._mPerNdc = _distP * Math.tan(_fovP / 2);
                }
                var _deltaNdcP = mouse.y - deplacerPorteInfo._startNdcY;
                var _deltaWorldP = _deltaNdcP * deplacerPorteInfo._mPerNdc;
                var _newWYP = deplacerPorteInfo._startGhostY + _deltaWorldP;
                // Clamp dans les limites du mur
                var _minWYP = baseYP + deplacerPorteInfo.hauteur / 2;
                var _maxWYP = baseYP + (deplacerPorteMurEl.params.hauteur || 2.5) - deplacerPorteInfo.hauteur / 2;
                _newWYP = Math.max(_minWYP, Math.min(_maxWYP, _newWYP));
                // Appliquer Y uniquement — X et Z restent figes
                ghostTrou.position.y = _newWYP;
                // Mettre a jour info.y pour la validation au clic
                var _localYP = _newWYP - deplacerPorteInfo.hauteur / 2 - baseYP;
                _localYP = Math.round(_localYP * 20) / 20;
                deplacerPorteInfo.y = _localYP + baseYP;
                document.getElementById('info-bar').textContent = 'DEPLACER PORTE Y — Y: ' + _localYP.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
            return;
        }
        // Mode libre — traverse placo/laine pour trouver le mur (avec fallback)
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var res = _chercherMurTraversant(intersects, ghostTrou);
        var found = res.found;
        var foundHit = res.hit;
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#D2691E');
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
        }
        if (ghostTrou && found && foundHit) {
            positionnerGhostTrou(found.element, foundHit);
        } else if (ghostTrou) {
            ghostTrou.visible = false;
        }
        return;
    }

    // Mode personnage : ghost suit la souris sur le sol
    if (modePersonnage && personnageGhost) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            personnageGhost.position.set(pointSol.x, 0, pointSol.z);
            personnageGhost.visible = true;
        } else {
            personnageGhost.visible = false;
        }
        return;
    }

    // Mode deplacer personnage : le personnage suit la souris
    if (modeDeplacerPerso && deplacerPersoGroup) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            deplacerPersoGroup.position.set(pointSol.x, 0, pointSol.z);
        }
        return;
    }

    // Mode plafond : ghost 3D complet suit la souris
    if (modePlafond4pts) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var _pfResult = raycaster.ray.intersectPlane(planSol, pointSol);
        if (!_pfResult) return;

        var _pfNeedGhost = false;
        var _pfGhostPts = null;

        if (plafondModeRect && plafondPoints.length === 1) {
            // Rectangle : apercu entre point 1 et souris
            var p1 = plafondPoints[0];
            _pfGhostPts = [
                { x: p1.x, z: p1.z },
                { x: pointSol.x, z: p1.z },
                { x: pointSol.x, z: pointSol.z },
                { x: p1.x, z: pointSol.z }
            ];
            _pfNeedGhost = true;
        } else if (!plafondModeRect && plafondPoints.length >= 2 && plafondPoints.length < 4) {
            // 4pts : apercu partiel (points existants + souris comme prochain)
            _pfGhostPts = plafondPoints.slice();
            _pfGhostPts.push({ x: pointSol.x, z: pointSol.z });
            // Si on a 3 pts + souris = 4 → apercu complet
            if (_pfGhostPts.length === 4) _pfNeedGhost = true;
            // Si seulement 3, on fait quand meme un apercu triangle-ish
            if (_pfGhostPts.length === 3) _pfNeedGhost = true;
        }

        if (_pfNeedGhost && _pfGhostPts && _pfGhostPts.length >= 3) {
            if (plafondGhostRect) { sceneManager.scene.remove(plafondGhostRect); plafondGhostRect = null; }

            var _pfOpacite = (parseInt(document.getElementById('npf-ghost-opacite').value) || 30) / 100;
            var _pfHauteur = parseFloat(document.getElementById('npf-hauteur').value) || 2.50;
            var _pfEpM = (parseInt(document.getElementById('npf-ep').value) || 20) / 100;
            var _pfCoulDalle = document.getElementById('npf-couleur').value;
            var _pfCoulPoteau = document.getElementById('npf-poteau').value;
            var _pfAvecPoteaux = document.getElementById('npf-poteaux').checked;

            plafondGhostRect = new THREE.Group();
            var _pfGhostMat = new THREE.MeshBasicMaterial({ color: _pfCoulDalle, transparent: true, opacity: _pfOpacite, side: THREE.DoubleSide, depthWrite: false });

            // Dalle au sol (contour)
            var _pfShapeSol = new THREE.Shape();
            _pfShapeSol.moveTo(_pfGhostPts[0].x, -_pfGhostPts[0].z);
            for (var _gi = 1; _gi < _pfGhostPts.length; _gi++) _pfShapeSol.lineTo(_pfGhostPts[_gi].x, -_pfGhostPts[_gi].z);
            _pfShapeSol.lineTo(_pfGhostPts[0].x, -_pfGhostPts[0].z);
            var _pfGeoSol = new THREE.ShapeGeometry(_pfShapeSol);
            _pfGeoSol.rotateX(-Math.PI / 2);
            var _pfMeshSol = new THREE.Mesh(_pfGeoSol, _pfGhostMat.clone());
            _pfMeshSol.position.y = 0.01;
            plafondGhostRect.add(_pfMeshSol);

            // Dalle en hauteur
            var _pfShapeH = new THREE.Shape();
            _pfShapeH.moveTo(_pfGhostPts[0].x, -_pfGhostPts[0].z);
            for (var _gi = 1; _gi < _pfGhostPts.length; _gi++) _pfShapeH.lineTo(_pfGhostPts[_gi].x, -_pfGhostPts[_gi].z);
            _pfShapeH.lineTo(_pfGhostPts[0].x, -_pfGhostPts[0].z);
            var _pfExtGeo = new THREE.ExtrudeGeometry(_pfShapeH, { depth: _pfEpM, bevelEnabled: false });
            _pfExtGeo.rotateX(-Math.PI / 2);
            var _pfMeshH = new THREE.Mesh(_pfExtGeo, _pfGhostMat.clone());
            _pfMeshH.position.y = _pfHauteur;
            plafondGhostRect.add(_pfMeshH);

            // Poteaux ghost (lignes verticales aux coins)
            if (_pfAvecPoteaux) {
                var _pfPotMat = new THREE.MeshBasicMaterial({ color: _pfCoulPoteau, transparent: true, opacity: _pfOpacite, depthWrite: false });
                for (var _pi = 0; _pi < _pfGhostPts.length; _pi++) {
                    var _pfPotGeo = new THREE.BoxGeometry(0.15, _pfHauteur, 0.15);
                    var _pfPot = new THREE.Mesh(_pfPotGeo, _pfPotMat.clone());
                    _pfPot.position.set(_pfGhostPts[_pi].x, _pfHauteur / 2, _pfGhostPts[_pi].z);
                    plafondGhostRect.add(_pfPot);
                }
            }

            // Lignes de contour au sol (bien visibles)
            var _pfLinePts = [];
            for (var _li = 0; _li <= _pfGhostPts.length; _li++) {
                var _lp = _pfGhostPts[_li % _pfGhostPts.length];
                _pfLinePts.push(new THREE.Vector3(_lp.x, 0.03, _lp.z));
            }
            var _pfLineGeo = new THREE.BufferGeometry().setFromPoints(_pfLinePts);
            var _pfLineMat = new THREE.LineBasicMaterial({ color: '#ffffff' });
            plafondGhostRect.add(new THREE.Line(_pfLineGeo, _pfLineMat));

            // Lignes de contour en hauteur
            var _pfLinePtsH = [];
            for (var _li = 0; _li <= _pfGhostPts.length; _li++) {
                var _lp = _pfGhostPts[_li % _pfGhostPts.length];
                _pfLinePtsH.push(new THREE.Vector3(_lp.x, _pfHauteur, _lp.z));
            }
            var _pfLineGeoH = new THREE.BufferGeometry().setFromPoints(_pfLinePtsH);
            plafondGhostRect.add(new THREE.Line(_pfLineGeoH, _pfLineMat.clone()));

            // Lignes verticales aux coins
            for (var _vi = 0; _vi < _pfGhostPts.length; _vi++) {
                var _vPts = [
                    new THREE.Vector3(_pfGhostPts[_vi].x, 0.03, _pfGhostPts[_vi].z),
                    new THREE.Vector3(_pfGhostPts[_vi].x, _pfHauteur + _pfEpM, _pfGhostPts[_vi].z)
                ];
                var _vGeo = new THREE.BufferGeometry().setFromPoints(_vPts);
                plafondGhostRect.add(new THREE.Line(_vGeo, _pfLineMat.clone()));
            }

            sceneManager.scene.add(plafondGhostRect);
        } else if (!_pfNeedGhost && plafondGhostRect) {
            sceneManager.scene.remove(plafondGhostRect);
            plafondGhostRect = null;
        }
        return;
    }

    // Mode deplacer point plafond : le marker suit la souris
    if (_epfDeplacerPtIdx >= 0 && _epfDeplacerPtMarkers[_epfDeplacerPtIdx]) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            _epfDeplacerPtMarkers[_epfDeplacerPtIdx].position.set(pointSol.x, 0.10, pointSol.z);
        }
        return;
    }

    // Mode escalier : ghost suit la souris sur le sol
    if (modeEscalier && escalierGhost) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            escalierGhost.position.set(pointSol.x, 0.05, pointSol.z);
            escalierGhost.visible = true;
        } else {
            escalierGhost.visible = false;
        }
        return;
    }

    // Mode deplacer escalier : l'escalier suit la souris
    if (modeDeplacerEscalier && deplacerEscalierGroup) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            deplacerEscalierGroup.position.set(pointSol.x, 0, pointSol.z);
        }
        return;
    }

    // Mode copier zone
    if (modeCopierZone && copierZoneDrag) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var resCZ = raycaster.ray.intersectPlane(planSol, pointSol);
        if (resCZ) {
            if (copierZonePhase === 'select' && copierZoneStart) {
                var x1 = copierZoneStart.wx, z1 = copierZoneStart.wz;
                var x2 = pointSol.x, z2 = pointSol.z;
                if (window._copierZoneRect3D) {
                    sceneManager.scene.remove(window._copierZoneRect3D);
                    window._copierZoneRect3D.geometry.dispose();
                    window._copierZoneRect3D.material.dispose();
                }
                var w = Math.abs(x2 - x1), h = Math.abs(z2 - z1);
                if (w > 0.05 && h > 0.05) {
                    var geo = new THREE.PlaneGeometry(w, h);
                    var mat = new THREE.MeshBasicMaterial({ color: '#43B047', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
                    window._copierZoneRect3D = new THREE.Mesh(geo, mat);
                    window._copierZoneRect3D.rotation.x = -Math.PI / 2;
                    window._copierZoneRect3D.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
                    sceneManager.scene.add(window._copierZoneRect3D);
                }
                document.getElementById('info-bar').textContent = 'COPIER — ' + w.toFixed(1) + 'm x ' + h.toFixed(1) + 'm | Relachez pour selectionner';
            } else if (copierZonePhase === 'place' && copierZoneMoveStart && copierZoneData) {
                // Deplacer les ghosts
                var ddx = pointSol.x - copierZoneMoveStart.wx;
                var ddz = pointSol.z - copierZoneMoveStart.wz;
                if (window._copierZoneGhosts) {
                    for (var gi = 0; gi < window._copierZoneGhosts.length; gi++) {
                        var gh = window._copierZoneGhosts[gi];
                        gh.position.x = gh._origX + ddx;
                        gh.position.z = gh._origZ + ddz;
                    }
                }
                if (window._copierZoneRect3D) {
                    window._copierZoneRect3D.position.x = window._copierZoneRect3D._origX + ddx;
                    window._copierZoneRect3D.position.z = window._copierZoneRect3D._origZ + ddz;
                }
                document.getElementById('info-bar').textContent = 'Glissez pour placer la copie | Relachez pour valider | Echap = annuler';
            }
        }
    }

    // Mode deplacer zone
    if (modeDeplacerZone && deplacerZoneDrag) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var resZ = raycaster.ray.intersectPlane(planSol, pointSol);
        if (resZ) {
            if (deplacerZonePhase === 'select' && deplacerZoneStart) {
                // Dessiner le rectangle de selection
                var x1 = deplacerZoneStart.wx, z1 = deplacerZoneStart.wz;
                var x2 = pointSol.x, z2 = pointSol.z;
                if (window._deplacerZoneRect3D) {
                    sceneManager.scene.remove(window._deplacerZoneRect3D);
                    window._deplacerZoneRect3D.geometry.dispose();
                    window._deplacerZoneRect3D.material.dispose();
                }
                var w = Math.abs(x2 - x1), h = Math.abs(z2 - z1);
                if (w > 0.05 && h > 0.05) {
                    var geo = new THREE.PlaneGeometry(w, h);
                    var mat = new THREE.MeshBasicMaterial({ color: '#5bb8f0', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
                    window._deplacerZoneRect3D = new THREE.Mesh(geo, mat);
                    window._deplacerZoneRect3D.rotation.x = -Math.PI / 2;
                    window._deplacerZoneRect3D.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
                    sceneManager.scene.add(window._deplacerZoneRect3D);
                }
                document.getElementById('info-bar').textContent = 'DEPLACER ZONE — ' + w.toFixed(1) + 'm x ' + h.toFixed(1) + 'm | Relachez pour selectionner';
            } else if (deplacerZonePhase === 'move' && deplacerZoneMoveStart) {
                // Deplacer tous les elements selectionnes
                var ddx = pointSol.x - deplacerZoneMoveStart.wx;
                var ddz = pointSol.z - deplacerZoneMoveStart.wz;
                for (var dzi = 0; dzi < deplacerZoneElements.length; dzi++) {
                    var dze = deplacerZoneElements[dzi];
                    if (dze.type === 'mur') {
                        dze.ref.params.x = dze.origX + ddx;
                        dze.ref.params.z = dze.origZ + ddz;
                        editeur._reconstruire(dze.ref);
                    } else if (dze.type === 'exclusion') {
                        dze.ref.x = dze.origX + ddx;
                        dze.ref.z = dze.origZ + ddz;
                        if (dze.ref.group3D) {
                            dze.ref.group3D.position.x = dze.ref.x;
                            dze.ref.group3D.position.z = dze.ref.z;
                        }
                    } else if (dze.type === 'placo') {
                        var pi = dze.ref.userData.placoInfo;
                        pi.worldX = dze.origX + ddx;
                        pi.worldZ = dze.origZ + ddz;
                        dze.ref.position.x = dze.origPosX + ddx;
                        dze.ref.position.z = dze.origPosZ + ddz;
                    } else if (dze.type === 'laine') {
                        var li = dze.ref.userData.laineInfo;
                        li.worldX = dze.origX + ddx;
                        li.worldZ = dze.origZ + ddz;
                        dze.ref.position.x = dze.origPosX + ddx;
                        dze.ref.position.z = dze.origPosZ + ddz;
                    } else if (dze.type === 'personnage') {
                        dze.ref.position.x = dze.origPosX + ddx;
                        dze.ref.position.z = dze.origPosZ + ddz;
                    } else if (dze.type === 'escalier') {
                        dze.ref.position.x = dze.origPosX + ddx;
                        dze.ref.position.z = dze.origPosZ + ddz;
                    } else if (dze.type === 'plafond') {
                        dze.ref.position.x = dze.origPosX + ddx;
                        dze.ref.position.z = dze.origPosZ + ddz;
                    }
                }
                // Deplacer le rectangle de zone
                if (window._deplacerZoneRect3D && window._deplacerZoneRect3D._origX !== undefined) {
                    window._deplacerZoneRect3D.position.x = window._deplacerZoneRect3D._origX + ddx;
                    window._deplacerZoneRect3D.position.z = window._deplacerZoneRect3D._origZ + ddz;
                }
                document.getElementById('info-bar').textContent = 'DEPLACER ZONE — dx:' + ddx.toFixed(2) + ' dz:' + ddz.toFixed(2) + ' | Cliquez pour valider | Echap = annuler';
            }
        }
        return;
    }

    // Mode effacer zone : dessiner le rectangle 3D sur le sol
    if (modeEffacerZone && effacerDrag && effacerStart) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var res = raycaster.ray.intersectPlane(planSol, pointSol);
        if (res) {
            var x1 = effacerStart.wx, z1 = effacerStart.wz;
            var x2 = pointSol.x, z2 = pointSol.z;
            // Mettre a jour le rectangle 3D
            if (window._effacerRect3D) {
                sceneManager.scene.remove(window._effacerRect3D);
                window._effacerRect3D.geometry.dispose();
                window._effacerRect3D.material.dispose();
            }
            var w = Math.abs(x2 - x1);
            var h = Math.abs(z2 - z1);
            if (w > 0.05 && h > 0.05) {
                var geo = new THREE.PlaneGeometry(w, h);
                var mat = new THREE.MeshBasicMaterial({ color: '#e94560', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
                window._effacerRect3D = new THREE.Mesh(geo, mat);
                window._effacerRect3D.rotation.x = -Math.PI / 2;
                window._effacerRect3D.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
                sceneManager.scene.add(window._effacerRect3D);
            }
            document.getElementById('info-bar').textContent = 'EFFACER ZONE — ' + w.toFixed(1) + 'm x ' + h.toFixed(1) + 'm | Relachez pour effacer';
        }
        return;
    }

    // Mode fenetre : ghost sur le mur survole (pas si popup precis ouvert)
    // Traverse le placo et la laine de verre pour trouver le mur derriere
    if (modeFenetre && fenetreModele && !precisFenetreElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var res = _chercherMurTraversant(intersects, ghostTrou);
        var found = res.found;
        var foundHit = res.hit;
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#5bb8f0');
            if (ghostTrou) ghostTrou._lastMur = undefined; // reset segment lock
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
        }
        if (ghostTrou && found && foundHit) {
            positionnerGhostTrou(found.element, foundHit);
        } else if (ghostTrou) {
            ghostTrou.visible = false;
        }
        return;
    }

    // Mode porte : ghost sur le mur survole (pas si popup precis ouvert)
    // Traverse le placo et la laine de verre pour trouver le mur derriere
    if (modePorte && porteModele && !precisPorteElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var res = _chercherMurTraversant(intersects, ghostTrou);
        var found = res.found;
        var foundHit = res.hit;
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#D2691E');
            if (ghostTrou) ghostTrou._lastMur = undefined; // reset segment lock
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
        }
        if (ghostTrou && found && foundHit) {
            positionnerGhostTrou(found.element, foundHit);
        } else if (ghostTrou) {
            ghostTrou.visible = false;
        }
        return;
    }

    // Mode placo : ghost sur le mur survole (+ glisse pour definir la largeur)
    // Traverse et accumule les epaisseurs (laine, placo existant) pour empiler
    if (modePlaco && placoModele) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        var foundHit = null;
        var _placoExtraEp = 0; // epaisseur totale sous le nouveau placo
        var _firstLayerGroup = null; // premier placo/laine touche (le plus proche de la camera)
        var _firstLayerHit = null;
        var _firstLayerFound = false;
        for (var i = 0; i < intersects.length; i++) {
            var ud = intersects[i].object.userData;
            if (!ud) { continue; }
            if (ud._isGhostPlaco || ud._isGhostLaine) continue;
            if (ud.isFenetre || ud.isPorte || ud.isEscalier || ud.isPlafond) continue;
            // Premier placo/laine touche = le plus proche → on se pose PAR-DESSUS
            if (ud.isLaine && !_firstLayerFound) {
                var lObj = intersects[i].object;
                while (lObj.parent && lObj.parent !== sceneManager.scene) lObj = lObj.parent;
                if (lObj.userData.laineInfo) {
                    // murEpFull de la laine contient deja l'offset depuis le segment du mur
                    _placoExtraEp = lObj.userData.laineInfo.murEpFull + lObj.userData.laineInfo.ep;
                    _firstLayerGroup = lObj;
                    _firstLayerHit = intersects[i].point;
                    _firstLayerFound = true;
                }
                continue;
            }
            if (ud.isPlaco && !_firstLayerFound) {
                var pObj = intersects[i].object;
                while (pObj.parent && pObj.parent !== sceneManager.scene) pObj = pObj.parent;
                if (pObj.userData.placoInfo) {
                    _placoExtraEp = pObj.userData.placoInfo.murEpFull + pObj.userData.placoInfo.ep;
                    _firstLayerGroup = pObj;
                    _firstLayerHit = intersects[i].point;
                    _firstLayerFound = true;
                }
                continue;
            }
            // Ignorer les autres couches apres la premiere
            if (ud.isLaine || ud.isPlaco) continue;
            // Mur
            found = trouverElementParObjet(intersects[i].object);
            if (found) { foundHit = intersects[i].point; break; }
        }
        // Si une couche est detectee, l'extra = offset total de la couche (remplace murEpFull)
        // Le _placoExtraEp contient murEpFull+ep de la premiere couche, on soustrait murEpFull du mur
        // car positionnerGhostPlaco ajoute murEpFull du mur + extraEp
        if (_firstLayerFound) {
            var bt = found ? (BRIQUES_TYPES[found.element.params.briqueType] || BRIQUES_TYPES.standard) : BRIQUES_TYPES.standard;
            _placoExtraEp = _placoExtraEp - bt.epaisseur;
            if (_placoExtraEp < 0) _placoExtraEp = 0;
        }
        // Fallback : si pas de mur mais un placo/laine touche, trouver le mur par correspondance
        if (!found && _firstLayerGroup) {
            var murEl = _trouverMurParPlacoLaine(_firstLayerGroup);
            if (murEl) {
                found = { type: 'editeur', element: murEl, group: murEl.group || murEl.brique.group };
                foundHit = _firstLayerHit;
                if (_firstLayerFound) {
                    var bt2 = BRIQUES_TYPES[murEl.params.briqueType] || BRIQUES_TYPES.standard;
                    _placoExtraEp = (_firstLayerGroup.userData.laineInfo || _firstLayerGroup.userData.placoInfo).murEpFull
                        + (_firstLayerGroup.userData.laineInfo || _firstLayerGroup.userData.placoInfo).ep - bt2.epaisseur;
                    if (_placoExtraEp < 0) _placoExtraEp = 0;
                }
            }
        }
        if (!placoDrag) {
            if (found && found.group !== survolElement) {
                restaurerSurlignage();
                survolElement = found.group;
                survolInfo = found;
                surlignerGroupe(found.group, _placoExtraEp > 0 ? '#F2D544' : '#C8C0B8');
            } else if (!found && survolElement) {
                restaurerSurlignage();
                survolInfo = null;
            }
        }
        if (ghostPlaco && found && foundHit) {
            if (placoDrag && placoDragStart) {
                positionnerGhostPlacoDrag(found.element, foundHit);
            } else {
                positionnerGhostPlaco(found.element, foundHit, _placoExtraEp);
            }
        } else if (ghostPlaco && !placoDrag) {
            ghostPlaco.visible = false;
        }
        return;
    }

    // Mode deplacer placo : ghost suit la souris sur les murs
    // Detecte le premier element (le plus proche) et se pose par-dessus
    if (modeDeplacerPlaco && deplacerPlacoGroup) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        var foundHit = null;
        var _placoExtraEp = 0;
        var _firstLayerGroup = null;
        var _firstLayerHit = null;
        var _firstLayerFound = false;
        for (var i = 0; i < intersects.length; i++) {
            var ud = intersects[i].object.userData;
            if (!ud) continue;
            if (ud._isGhostPlaco || ud._isGhostLaine) continue;
            if (ud.isFenetre || ud.isPorte || ud.isEscalier || ud.isPlafond) continue;
            if (ud.isLaine && !_firstLayerFound) {
                var lObj = intersects[i].object;
                while (lObj.parent && lObj.parent !== sceneManager.scene) lObj = lObj.parent;
                if (lObj.userData.laineInfo) {
                    _placoExtraEp = lObj.userData.laineInfo.murEpFull + lObj.userData.laineInfo.ep;
                    _firstLayerGroup = lObj; _firstLayerHit = intersects[i].point; _firstLayerFound = true;
                }
                continue;
            }
            if (ud.isPlaco && !_firstLayerFound) {
                var pObj = intersects[i].object;
                while (pObj.parent && pObj.parent !== sceneManager.scene) pObj = pObj.parent;
                if (pObj === deplacerPlacoGroup) continue;
                if (pObj.userData.placoInfo) {
                    _placoExtraEp = pObj.userData.placoInfo.murEpFull + pObj.userData.placoInfo.ep;
                    _firstLayerGroup = pObj; _firstLayerHit = intersects[i].point; _firstLayerFound = true;
                }
                continue;
            }
            if (ud.isLaine || ud.isPlaco) continue;
            found = trouverElementParObjet(intersects[i].object);
            if (found) { foundHit = intersects[i].point; break; }
        }
        if (_firstLayerFound) {
            var bt = found ? (BRIQUES_TYPES[found.element.params.briqueType] || BRIQUES_TYPES.standard) : BRIQUES_TYPES.standard;
            _placoExtraEp = _placoExtraEp - bt.epaisseur;
            if (_placoExtraEp < 0) _placoExtraEp = 0;
        }
        // Fallback
        if (!found && _firstLayerGroup) {
            var murEl = _trouverMurParPlacoLaine(_firstLayerGroup);
            if (murEl) {
                found = { type: 'editeur', element: murEl, group: murEl.group || murEl.brique.group };
                foundHit = _firstLayerHit;
                if (_firstLayerFound) {
                    var bt2 = BRIQUES_TYPES[murEl.params.briqueType] || BRIQUES_TYPES.standard;
                    var fInfo = _firstLayerGroup.userData.laineInfo || _firstLayerGroup.userData.placoInfo;
                    _placoExtraEp = fInfo.murEpFull + fInfo.ep - bt2.epaisseur;
                    if (_placoExtraEp < 0) _placoExtraEp = 0;
                }
            }
        }
        if (found && foundHit) {
            positionnerGhostPlaco(found.element, foundHit, _placoExtraEp);
        }
        return;
    }

    // Mode agrandir plaque (placo/laine) : souris controle la largeur
    if (modeAgrandirPlaque && agrandirPlaqueGroup && agrandirPlaqueSeg) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var as = agrandirPlaqueSeg;
            var info = agrandirPlaqueInfo;
            // Projeter la souris sur l'axe du segment
            var px = pointSol.x - as.seg.x1;
            var pz = pointSol.z - as.seg.z1;
            var mouseProj = px * as.nx + pz * as.nz;
            // Pas de clamp : permet de deborder au-dela du mur
            // mouseProj = Math.max(0, Math.min(as.len, mouseProj));

            // Position originale du centre sur le segment
            var origRelX = (agrandirPlaqueOrigWX - as.seg.x1) * as.nx + (agrandirPlaqueOrigWZ - as.seg.z1) * as.nz;
            var origLeft = origRelX - agrandirPlaqueOrigL / 2;
            var origRight = origRelX + agrandirPlaqueOrigL / 2;

            // Determiner quel bord bouge : celui le plus proche de la souris
            var dLeft = Math.abs(mouseProj - origLeft);
            var dRight = Math.abs(mouseProj - origRight);

            var newLeft, newRight;
            if (dLeft < dRight) {
                // Agrandir/reduire du cote gauche (debordement autorise)
                newLeft = mouseProj;
                newRight = origRight;
            } else {
                // Agrandir/reduire du cote droit (debordement autorise)
                newLeft = origLeft;
                newRight = mouseProj;
            }

            var newLargeur = newRight - newLeft;
            if (newLargeur < 0.05) newLargeur = 0.05;
            var newCX = (newLeft + newRight) / 2;
            var newWX = as.seg.x1 + as.nx * newCX;
            var newWZ = as.seg.z1 + as.nz * newCX;

            // Mettre a jour la plaque en temps reel
            info.largeur = newLargeur;
            info.worldX = newWX;
            info.worldZ = newWZ;

            // Supprimer et recreer la plaque
            var cols, newG;
            if (agrandirPlaqueType === 'placo') {
                cols = Placo.lireCouleurs(agrandirPlaqueGroup);
                placo.setCouleurs(cols.placo, cols.opacite / 100);
                // Repositionner le group existant (respecter l'offset original avec extraBack)
                var rad = info.angle * Math.PI / 180;
                var murEp = info.murEpFull || 0.11;
                var eb = info.extraBack || 0;
                var gap = 0.005;
                var off;
                if (info.side >= 0) {
                    off = murEp + info.ep / 2 + gap;
                } else {
                    off = -(eb + info.ep / 2 + gap);
                }
                var offX = -Math.sin(rad) * off;
                var offZ = Math.cos(rad) * off;
                // Reconstruire les enfants
                while (agrandirPlaqueGroup.children.length > 0) {
                    var c = agrandirPlaqueGroup.children[0];
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) c.material.dispose();
                    agrandirPlaqueGroup.remove(c);
                }
                // Plaque principale
                var geo = new THREE.BoxGeometry(newLargeur, info.hauteur, info.ep);
                var mat = new THREE.MeshStandardMaterial({ color: cols.placo, roughness: 0.9, transparent: cols.opacite < 99, opacity: Math.min(cols.opacite / 100, 0.99) });
                var p = new THREE.Mesh(geo, mat);
                p.position.set(0, info.hauteur / 2, 0);
                agrandirPlaqueGroup.add(p);
                // Joints
                var jMat = new THREE.MeshStandardMaterial({ color: '#E0DDD5', roughness: 0.8 });
                var esp = 0.60;
                var nbJ = Math.floor(info.hauteur / esp) - 1;
                for (var ji = 1; ji <= nbJ; ji++) {
                    var jy = esp * ji;
                    if (jy >= info.hauteur - 0.05) break;
                    var jG = new THREE.BoxGeometry(newLargeur - 0.02, 0.003, info.ep + 0.001);
                    var jM = new THREE.Mesh(jG, jMat);
                    jM.position.set(0, jy, 0);
                    agrandirPlaqueGroup.add(jM);
                }
                agrandirPlaqueGroup.position.set(newWX + offX, info.y, newWZ + offZ);
                agrandirPlaqueGroup.rotation.y = -rad;
                agrandirPlaqueGroup.traverse(function(c) { c.userData.isPlaco = true; });
            } else {
                cols = LaineDeVerre.lireCouleurs(agrandirPlaqueGroup);
                laineDeVerre.setCouleurs(cols.laine, cols.opacite / 100);
                var rad = info.angle * Math.PI / 180;
                var murEp = info.murEpFull || 0.11;
                var eb = info.extraBack || 0;
                var gap = 0.005;
                var off;
                if (info.side >= 0) {
                    off = murEp + info.ep / 2 + gap;
                } else {
                    off = -(eb + info.ep / 2 + gap);
                }
                var offX = -Math.sin(rad) * off;
                var offZ = Math.cos(rad) * off;
                while (agrandirPlaqueGroup.children.length > 0) {
                    var c = agrandirPlaqueGroup.children[0];
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) c.material.dispose();
                    agrandirPlaqueGroup.remove(c);
                }
                var geo = new THREE.BoxGeometry(newLargeur, info.hauteur, info.ep);
                var mat = new THREE.MeshStandardMaterial({ color: cols.laine, roughness: 1.0, transparent: cols.opacite < 99, opacity: Math.min(cols.opacite / 100, 0.99) });
                var b = new THREE.Mesh(geo, mat);
                b.position.set(0, info.hauteur / 2, 0);
                agrandirPlaqueGroup.add(b);
                // Fibres
                var fMat = new THREE.MeshStandardMaterial({ color: '#C49A00', roughness: 1.0 });
                var fEsp = 0.08;
                var nbF = Math.floor(info.hauteur / fEsp);
                for (var fi = 1; fi < nbF; fi++) {
                    var fy = fEsp * fi;
                    if (fy >= info.hauteur - 0.02) break;
                    var fG = new THREE.BoxGeometry(newLargeur - 0.01, 0.003, info.ep + 0.001);
                    var fM = new THREE.Mesh(fG, fMat);
                    fM.position.set(0, fy, 0);
                    agrandirPlaqueGroup.add(fM);
                }
                agrandirPlaqueGroup.position.set(newWX + offX, info.y, newWZ + offZ);
                agrandirPlaqueGroup.rotation.y = -rad;
                agrandirPlaqueGroup.traverse(function(c) { c.userData.isLaine = true; });
            }

            // Mettre a jour les infos stockees
            agrandirPlaqueGroup.userData[agrandirPlaqueType === 'placo' ? 'placoInfo' : 'laineInfo'].largeur = newLargeur;
            agrandirPlaqueGroup.userData[agrandirPlaqueType === 'placo' ? 'placoInfo' : 'laineInfo'].worldX = newWX;
            agrandirPlaqueGroup.userData[agrandirPlaqueType === 'placo' ? 'placoInfo' : 'laineInfo'].worldZ = newWZ;

            document.getElementById('info-bar').textContent = 'AGRANDIR — ' + newLargeur.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
        }
        return;
    }

    // Mode laine de verre : ghost sur le mur survole (+ glisse, avec fallback)
    if (modeLaine && laineModele) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        var foundHit = null;
        var _firstLaineLayer = null;
        var _firstLaineLayerHit = null;
        for (var i = 0; i < intersects.length; i++) {
            var ud = intersects[i].object.userData;
            if (!ud) continue;
            if (ud._isGhostLaine) continue;
            if (ud.isFenetre || ud.isPorte || ud.isEscalier || ud.isPlafond) continue;
            if (ud.isLaine) {
                var lObj = intersects[i].object;
                while (lObj.parent && lObj.parent !== sceneManager.scene) lObj = lObj.parent;
                if (!_firstLaineLayer && lObj.userData.laineInfo) { _firstLaineLayer = lObj; _firstLaineLayerHit = intersects[i].point; }
                continue;
            }
            if (ud.isPlaco) {
                var pObj = intersects[i].object;
                while (pObj.parent && pObj.parent !== sceneManager.scene) pObj = pObj.parent;
                if (!_firstLaineLayer && pObj.userData.placoInfo) { _firstLaineLayer = pObj; _firstLaineLayerHit = intersects[i].point; }
                continue;
            }
            found = trouverElementParObjet(intersects[i].object);
            if (found) { foundHit = intersects[i].point; break; }
        }
        // Fallback
        if (!found && _firstLaineLayer) {
            var murEl = _trouverMurParPlacoLaine(_firstLaineLayer);
            if (murEl) {
                found = { type: 'editeur', element: murEl, group: murEl.group || murEl.brique.group };
                foundHit = _firstLaineLayerHit;
            }
        }
        if (!laineDrag) {
            if (found && found.group !== survolElement) {
                restaurerSurlignage();
                survolElement = found.group;
                survolInfo = found;
                surlignerGroupe(found.group, '#D4A017');
            } else if (!found && survolElement) {
                restaurerSurlignage();
                survolInfo = null;
            }
        }
        if (ghostLaine && found && foundHit) {
            if (laineDrag && laineDragStart) {
                positionnerGhostLaineDrag(found.element, foundHit);
            } else {
                positionnerGhostLaine(found.element, foundHit);
            }
        } else if (ghostLaine && !laineDrag) {
            ghostLaine.visible = false;
        }
        return;
    }

    // Mode deplacer laine : ghost suit la souris sur les murs (avec fallback)
    if (modeDeplacerLaine && deplacerLaineGroup) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        var foundHit = null;
        var _firstLL = null, _firstLLHit = null;
        for (var i = 0; i < intersects.length; i++) {
            var ud = intersects[i].object.userData;
            if (!ud) continue;
            if (ud._isGhostLaine) continue;
            if (ud.isFenetre || ud.isPorte || ud.isEscalier || ud.isPlafond) continue;
            if (ud.isLaine) {
                var lObj = intersects[i].object;
                while (lObj.parent && lObj.parent !== sceneManager.scene) lObj = lObj.parent;
                if (lObj === deplacerLaineGroup) continue;
                if (!_firstLL && lObj.userData.laineInfo) { _firstLL = lObj; _firstLLHit = intersects[i].point; }
                continue;
            }
            if (ud.isPlaco) {
                var pObj = intersects[i].object;
                while (pObj.parent && pObj.parent !== sceneManager.scene) pObj = pObj.parent;
                if (!_firstLL && pObj.userData.placoInfo) { _firstLL = pObj; _firstLLHit = intersects[i].point; }
                continue;
            }
            found = trouverElementParObjet(intersects[i].object);
            if (found) { foundHit = intersects[i].point; break; }
        }
        if (!found && _firstLL) {
            var murEl = _trouverMurParPlacoLaine(_firstLL);
            if (murEl) {
                found = { type: 'editeur', element: murEl, group: murEl.group || murEl.brique.group };
                foundHit = _firstLLHit;
            }
        }
        if (found && foundHit) {
            positionnerGhostLaine(found.element, foundHit);
        }
        return;
    }

    // Mode trou rapide : ghost sur le mur survole (traverse placo/laine avec fallback)
    if (modeTrouRapide) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var res = _chercherMurTraversant(intersects, ghostTrou);
        var found = res.found;
        var foundHit = res.hit;
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#e94560');
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
        }
        // Ghost trou
        if (ghostTrou) {
            if (found && found.element && foundHit) {
                positionnerGhostTrou(found.element, foundHit);
            } else {
                ghostTrou.visible = false;
            }
        }
        return;
    }

    // Mode mesure : ligne qui suit la souris apres le 1er point
    if (modeMesure) {
        if (!mesurePoint1) return;
        raycaster.setFromCamera(mouse, sceneManager.camera);
        // Chercher un point sur une brique d'abord
        var mx, my, mz, surBrique = false;
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        for (var i = 0; i < intersects.length; i++) {
            var info = trouverElementParObjet(intersects[i].object);
            if (info) {
                mx = intersects[i].point.x;
                my = intersects[i].point.y;
                mz = intersects[i].point.z;
                surBrique = true;
                break;
            }
        }
        if (!surBrique) {
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (result) { mx = pointSol.x; my = 0.05; mz = pointSol.z; }
            else return;
        }
        mx = snapGrille(mx) || mx;
        mz = snapGrille(mz) || mz;

        if (mesurePoint1) {
            majLigneMesure(mesurePoint1.x, mesurePoint1.y, mesurePoint1.z, mx, my, mz);
            if (mesureSphere2) { sceneManager.scene.remove(mesureSphere2); mesureSphere2.geometry.dispose(); mesureSphere2.material.dispose(); }
            mesureSphere2 = creerSphere(mx, my, mz, surBrique ? '#ff8800' : '#00ccff');
            var ddx = mx - mesurePoint1.x;
            var ddy = my - mesurePoint1.y;
            var ddz = mz - mesurePoint1.z;
            var dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
            var distH = Math.sqrt(ddx * ddx + ddz * ddz);
            var txt = 'MESURE — ' + dist.toFixed(2) + 'm';
            if (Math.abs(ddy) > 0.01) txt += ' (horiz: ' + distH.toFixed(2) + 'm, vert: ' + Math.abs(ddy).toFixed(2) + 'm)';
            txt += surBrique ? ' [brique]' : ' [sol]';
            txt += ' | Cliquez pour le 2e point';
            document.getElementById('info-bar').textContent = txt;
        } else {
            // Avant le 1er clic : montrer si on est sur une brique
            container.style.cursor = surBrique ? 'crosshair' : 'crosshair';
            document.getElementById('info-bar').textContent = 'MESURE — Cliquez pour le point A' + (surBrique ? ' [brique]' : ' [sol]') + ' | Echap = annuler';
        }
        return;
    }

    // Mode agrandir perpendiculaire (90°) — 1 cote choisi
    if (redimPerp && redimPerpNewEl) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var origAngle = (redimPerpElement.params.angle || 0);
            var origRad = origAngle * Math.PI / 180;
            var origDist = redimPerpElement.params.distance || 5;
            var origX = redimPerpElement.params.x || 0;
            var origZ = redimPerpElement.params.z || 0;
            var dirX = Math.cos(origRad);
            var dirZ = Math.sin(origRad);
            var epaisseur = redimPerpElement.brique ? redimPerpElement.brique.epaisseur : 0.11;
            var normX = -dirZ;
            var normZ = dirX;
            var hautPerp = redimPerpElement.params.hauteur || 2.5;
            var baseY = redimPerpElement.params.y || 0;

            // Points debut et fin du mur
            var debutX = origX;
            var debutZ = origZ;
            var finX = origX + dirX * origDist;
            var finZ = origZ + dirZ * origDist;

            // Determiner de quel bout on part (le plus proche de la souris)
            var dDebut = Math.sqrt((pointSol.x - debutX) * (pointSol.x - debutX) + (pointSol.z - debutZ) * (pointSol.z - debutZ));
            var dFin = Math.sqrt((pointSol.x - finX) * (pointSol.x - finX) + (pointSol.z - finZ) * (pointSol.z - finZ));
            var cornerX, cornerZ, boutTxt;
            if (dFin <= dDebut) {
                cornerX = finX; cornerZ = finZ; boutTxt = 'Fin';
            } else {
                cornerX = debutX; cornerZ = debutZ; boutTxt = 'Debut';
            }

            // Projeter la souris sur l'axe perpendiculaire pour la distance
            var perpAngle90 = (origAngle + 90) * Math.PI / 180;
            var perpDirX = Math.cos(perpAngle90);
            var perpDirZ = Math.sin(perpAngle90);
            var dx = pointSol.x - cornerX;
            var dz = pointSol.z - cornerZ;
            var proj = dx * perpDirX + dz * perpDirZ;
            var newDist = Math.max(0.3, Math.abs(proj));
            newDist = snapGrille(newDist) || newDist;

            // Le cote (droite/gauche) est determine par la position de la souris
            // Le nouveau mur part du coin exact, pas de decalage
            var startX, startZ, actualAngle, actualRad, coteTxt;
            if (proj >= 0) {
                actualAngle = origAngle + 90;
                coteTxt = 'Droite';
            } else {
                actualAngle = origAngle - 90;
                coteTxt = 'Gauche';
            }
            actualRad = actualAngle * Math.PI / 180;
            startX = cornerX;
            startZ = cornerZ;

            redimPerpNewEl.params.x = startX;
            redimPerpNewEl.params.z = startZ;
            redimPerpNewEl.params.angle = actualAngle;
            redimPerpNewEl.params.distance = newDist;
            var grpP = redimPerpNewEl.group || redimPerpNewEl.brique.group;
            grpP.visible = false;

            // Ghost
            if (redimPerpGhost) { sceneManager.scene.remove(redimPerpGhost); redimPerpGhost.geometry.dispose(); redimPerpGhost.material.dispose(); }
            var geoG = new THREE.BoxGeometry(newDist, hautPerp, epaisseur);
            var matG = new THREE.MeshBasicMaterial({ color: coteTxt === 'Droite' ? '#ff8800' : '#ffaa44', transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
            redimPerpGhost = new THREE.Mesh(geoG, matG);
            redimPerpGhost.position.set(
                startX + Math.cos(actualRad) * newDist / 2,
                baseY + hautPerp / 2,
                startZ + Math.sin(actualRad) * newDist / 2
            );
            redimPerpGhost.rotation.y = -actualRad;
            sceneManager.scene.add(redimPerpGhost);

            document.getElementById('info-bar').textContent = 'PERP 90° [' + boutTxt + ' → ' + coteTxt + '] — ' + newDist.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
        }
        return;
    }

    // Mode agrandir proportionnel (murs carres)
    if (redimProp && redimPropElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var p = redimPropElement.params;
            var ox = p.x || 0;
            var oz = p.z || 0;
            var dx = pointSol.x - ox;
            var dz = pointSol.z - oz;
            var distSouris = Math.sqrt(dx * dx + dz * dz);
            var nbCotes = p.nbCotes || 4;
            var newDist = Math.max(0.3, distSouris / Math.sqrt(nbCotes > 2 ? 2 : 1));
            newDist = snapGrille(newDist) || newDist;
            newDist = Math.round(newDist * 20) / 20;

            var ratio = newDist / redimPropOrigDist;

            redimPropElement.params.distance = newDist;

            // Ajuster les trous proportionnellement
            if (redimPropElement.params.trous) {
                for (var ti = 0; ti < redimPropElement.params.trous.length; ti++) {
                    var tr = redimPropElement.params.trous[ti];
                    if (tr._propOrigX === undefined) tr._propOrigX = tr.x || 0;
                    tr.x = tr._propOrigX * ratio;
                }
            }

            editeur._reconstruire(redimPropElement);
            surlignerGroupe(redimPropElement.group || redimPropElement.brique.group, '#43B047');

            // Repositionner les exclusions sur les nouveaux segments
            var newSegs = editeur._segments(redimPropElement.params);
            for (var ei = 0; ei < redimPropExclusions.length; ei++) {
                var re = redimPropExclusions[ei];
                var seg = newSegs[re.segIndex];
                if (!seg) continue;
                var sdx = seg.x2 - seg.x1;
                var sdz = seg.z2 - seg.z1;
                var newX = seg.x1 + sdx * re.ratio;
                var newZ = seg.z1 + sdz * re.ratio;
                re.excl.x = newX;
                re.excl.z = newZ;
                if (re.excl.group3D) {
                    re.excl.group3D.position.x = newX;
                    re.excl.group3D.position.z = newZ;
                }
            }

            document.getElementById('info-bar').textContent = 'PROPORTIONNEL — Cote: ' + newDist.toFixed(2) + 'm (x' + nbCotes + ' cotes) | Cliquez pour valider | Echap = annuler';
        }
        return;
    }



    // Mode redimensionnement : ajuster la taille en temps reel
    if (modeRedim && redimElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);

        if (redimVertical) {
            // Vertical : la hauteur depend de la position Y de la souris a l'ecran
            // Plus la souris est haute, plus le mur est haut
            var planVertical = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
            // Utiliser un plan vertical face a la camera
            var camDir = new THREE.Vector3();
            sceneManager.camera.getWorldDirection(camDir);
            camDir.y = 0;
            camDir.normalize();
            planVertical.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(redimOrigX, 0, redimOrigZ));
            var ptV = new THREE.Vector3();
            var resultV = raycaster.ray.intersectPlane(planVertical, ptV);
            if (resultV) {
                var newH = Math.max(0.3, ptV.y);
                newH = snapGrille(newH) || newH;
                redimElement.params.hauteur = newH;
                editeur._reconstruire(redimElement);
                surlignerGroupe(redimElement.group || redimElement.brique.group, '#cc66ff');
                document.getElementById('info-bar').textContent = 'HAUTEUR — ' + newH.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
        } else if (redimMultiSeg >= 0) {
            // Multi-cotes : agrandir un segment individuel
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (result) {
                var rad = redimAngle * Math.PI / 180;
                var dirX = Math.cos(rad), dirZ = Math.sin(rad);
                var dx = pointSol.x - redimOrigX, dz = pointSol.z - redimOrigZ;
                var proj = Math.abs(dx * dirX + dz * dirZ);
                var newDist = Math.max(0.3, proj);
                newDist = snapGrille(newDist) || newDist;
                newDist = Math.round(newDist * 20) / 20;

                // Mettre a jour le bon parametre selon le segment (pair=branches, impair=fond)
                if (redimMultiSeg % 2 === 0) {
                    redimElement.params.distanceBranches = newDist;
                } else {
                    redimElement.params.distance = newDist;
                }
                editeur._reconstruire(redimElement);
                editeur.realignerExclusions();
                surlignerGroupe(redimElement.group || redimElement.brique.group, '#00ccff');
                var nomSeg = (redimMultiSeg % 2 === 0) ? 'branche' : 'fond';
                document.getElementById('info-bar').textContent = 'SEGMENT ' + redimMultiSeg + ' (' + nomSeg + ') — ' + newDist.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
        } else {
            // Horizontal mur simple
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (result) {
                var rad = redimAngle * Math.PI / 180;
                var dirX = Math.cos(rad), dirZ = Math.sin(rad);
                var dx = pointSol.x - redimOrigX;
                var dz = pointSol.z - redimOrigZ;
                var proj = dx * dirX + dz * dirZ;

                var milieu = redimOrigDist / 2;
                var newX, newZ, newDist, cote;

                if (proj >= milieu) {
                    cote = 'fin';
                    newDist = Math.max(0.3, proj);
                    newDist = snapGrille(newDist) || newDist;
                    newX = redimOrigX;
                    newZ = redimOrigZ;
                } else {
                    cote = 'debut';
                    var finX = redimOrigX + dirX * redimOrigDist;
                    var finZ = redimOrigZ + dirZ * redimOrigDist;
                    newDist = Math.max(0.3, redimOrigDist - proj);
                    newDist = snapGrille(newDist) || newDist;
                    newX = finX - dirX * newDist;
                    newZ = finZ - dirZ * newDist;
                }

                // Decaler les trous pour qu'ils restent en place quand l'origine bouge
                var origShift = 0;
                if (cote === 'debut') {
                    origShift = newDist - redimOrigDist;
                }
                redimElement.params.x = newX;
                redimElement.params.z = newZ;
                redimElement.params.distance = newDist;
                if (redimElement.params.trous && origShift !== 0) {
                    for (var ti = 0; ti < redimElement.params.trous.length; ti++) {
                        if (redimElement.params.trous[ti]._origX === undefined) {
                            redimElement.params.trous[ti]._origX = redimElement.params.trous[ti].x || 0;
                        }
                        redimElement.params.trous[ti].x = redimElement.params.trous[ti]._origX + origShift;
                    }
                }
                editeur._reconstruire(redimElement);
                surlignerGroupe(redimElement.group || redimElement.brique.group, '#00ccff');
                document.getElementById('info-bar').textContent = 'REDIMENSIONNER (' + cote + ') — Distance: ' + newDist.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
            }
        }
        return;
    }

    // Mode deplacer vertical : la souris haut/bas change le Y du mur
    if (modeDeplacerVertical && deplacerVElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var planV = new THREE.Plane();
        var camDir = new THREE.Vector3();
        sceneManager.camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();
        var ox = deplacerVElement.params.x || 0;
        var oz = deplacerVElement.params.z || 0;
        planV.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(ox, 0, oz));
        var ptV = new THREE.Vector3();
        var resultV = raycaster.ray.intersectPlane(planV, ptV);
        if (resultV) {
            var newY = Math.max(0, ptV.y);
            newY = snapGrille(newY) || newY;
            newY = Math.round(newY * 20) / 20;
            var deltaY = newY - deplacerVOrigY;
            deplacerVElement.params.y = newY;
            editeur._reconstruire(deplacerVElement);
            surlignerGroupe(deplacerVElement.group || deplacerVElement.brique.group, '#ffcc00');
            // Deplacer les exclusions (fenetres/portes)
            for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                var de = deplacerExclusions[ei];
                de.excl.y = de.origY + deltaY;
                if (de.excl.group3D) de.excl.group3D.position.y = de.excl.y;
            }
            document.getElementById('info-bar').textContent = 'DEPLACER VERTICAL — Y: ' + newY.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
        }
        return;
    }

    // Mode deplacer horizontal : la souris projette sur l'axe du mur
    if (modeDeplacerHorizontal && deplacerHElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var angle = (deplacerHElement.params.angle || 0) * Math.PI / 180;
            var dirX = Math.cos(angle);
            var dirZ = Math.sin(angle);
            var dx = pointSol.x - deplacerHOrigX;
            var dz = pointSol.z - deplacerHOrigZ;
            var proj = dx * dirX + dz * dirZ;
            proj = snapGrille(proj) || proj;
            var newX = deplacerHOrigX + dirX * proj;
            var newZ = deplacerHOrigZ + dirZ * proj;
            var deltaX = newX - deplacerHOrigX;
            var deltaZ = newZ - deplacerHOrigZ;
            deplacerHElement.params.x = newX;
            deplacerHElement.params.z = newZ;
            editeur._reconstruire(deplacerHElement);
            surlignerGroupe(deplacerHElement.group || deplacerHElement.brique.group, '#00ccff');
            // Deplacer les exclusions (fenetres/portes)
            for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                var de = deplacerExclusions[ei];
                de.excl.x = de.origX + deltaX;
                de.excl.z = de.origZ + deltaZ;
                if (de.excl.group3D) {
                    de.excl.group3D.position.x = de.excl.x;
                    de.excl.group3D.position.z = de.excl.z;
                }
            }
            document.getElementById('info-bar').textContent = 'DEPLACER HORIZONTAL — Offset: ' + proj.toFixed(2) + 'm | Cliquez pour valider | Echap = annuler';
        }
        return;
    }

    // Mode grouper : surligner le mur survole
    if (modeGrouper) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        for (var i = 0; i < intersects.length; i++) {
            found = trouverElementParObjet(intersects[i].object);
            if (found) break;
        }
        // Ne pas changer le surlignage des murs deja selectionnes
        var dejaSelectionne = found && grouperSelection.indexOf(found.element.id) !== -1;
        if (found && !dejaSelectionne && found.group !== survolElement) {
            restaurerSurlignage();
            // Re-surligner les murs deja selectionnes
            for (var k = 0; k < grouperSelection.length; k++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id === grouperSelection[k]) {
                        surlignerGroupe(editeur.elements[j].group || editeur.elements[j].brique.group, '#43B047');
                    }
                }
            }
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#88ff88');
            container.style.cursor = 'pointer';
        } else if (!found && survolElement && !dejaSelectionne) {
            restaurerSurlignage();
            // Re-surligner les murs deja selectionnes
            for (var k = 0; k < grouperSelection.length; k++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id === grouperSelection[k]) {
                        surlignerGroupe(editeur.elements[j].group || editeur.elements[j].brique.group, '#43B047');
                    }
                }
            }
            survolInfo = null;
            survolElement = null;
            container.style.cursor = 'pointer';
        }
        return;
    }

    // Mode degrouper : surligner le groupe survole
    if (modeDegrouper) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        for (var i = 0; i < intersects.length; i++) {
            found = trouverElementParObjet(intersects[i].object);
            if (found) break;
        }
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolInfo = found;
            // Surligner tout le groupe en rouge
            var ids = editeur.trouverGroupe(found.element.id);
            for (var k = 0; k < ids.length; k++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id === ids[k]) {
                        surlignerGroupe(editeur.elements[j].group || editeur.elements[j].brique.group, found.element.params.groupeId ? '#e94560' : '#666');
                    }
                }
            }
            survolElement = found.group;
            container.style.cursor = found.element.params.groupeId ? 'pointer' : 'not-allowed';
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
            survolElement = null;
            container.style.cursor = 'pointer';
        }
        return;
    }

    // Mode edition : surligner le mur survole
    if (modeEdition && !editionElement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        for (var i = 0; i < intersects.length; i++) {
            found = trouverElementParObjet(intersects[i].object);
            if (found) break;
        }
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#ffa500');
            container.style.cursor = 'pointer';
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
            container.style.cursor = 'pointer';
        }
        return;
    }

    // Mode suppression : surligner le mur survole
    if (modeSuppression) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        for (var i = 0; i < intersects.length; i++) {
            found = trouverElementParObjet(intersects[i].object);
            if (found) break;
        }
        if (found && found.group !== survolElement) {
            restaurerSurlignage();
            survolElement = found.group;
            survolInfo = found;
            surlignerGroupe(found.group, '#ff0000');
        } else if (!found && survolElement) {
            restaurerSurlignage();
            survolInfo = null;
        }
        return;
    }

    // Mode trou manuel : etape 0 = survol, etape 1 = choisir X, etape 2 = choisir Y
    if (modeTrou) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        var found = null;
        var foundHit = null;
        for (var i = 0; i < intersects.length; i++) {
            if (ghostTrou && intersects[i].object === ghostTrou) continue;
            if (trouLigneV && intersects[i].object === trouLigneV) continue;
            found = trouverElementParObjet(intersects[i].object);
            if (found) { foundHit = intersects[i].point; break; }
        }

        if (trouEtape === 0) {
            // Etape 0 : survol — surligner et montrer ghost qui suit en X
            if (found && found.group !== survolElement) {
                restaurerSurlignage();
                survolElement = found.group;
                survolInfo = found;
                surlignerGroupe(found.group, '#ff8800');
            } else if (!found && survolElement) {
                restaurerSurlignage();
                survolInfo = null;
            }
            if (ghostTrou && found && foundHit) {
                positionnerGhostTrou(found.element, foundHit);
            } else if (ghostTrou) {
                ghostTrou.visible = false;
            }
        } else if (trouEtape === 1) {
            // Etape 1 : X valide, on bouge seulement en Y (hauteur)
            if (ghostTrou && trouMurElement) {
                // Utiliser un plan vertical face camera pour obtenir la hauteur
                var camDir = new THREE.Vector3();
                sceneManager.camera.getWorldDirection(camDir);
                camDir.y = 0;
                camDir.normalize();
                var planV = new THREE.Plane();
                planV.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(trouHitPoint.x, 0, trouHitPoint.z));
                var ptV = new THREE.Vector3();
                var resV = raycaster.ray.intersectPlane(planV, ptV);
                if (resV) {
                    var newY = Math.max(0, ptV.y);
                    document.getElementById('f-trou-y').value = newY.toFixed(2);
                    // Repositionner le ghost avec la nouvelle hauteur Y
                    var largeur = parseFloat(document.getElementById('f-trou-largeur').value) || 0.9;
                    var hauteur = parseFloat(document.getElementById('f-trou-hauteur').value) || 2.1;
                    // Recalculer la position du ghost
                    var segs = editeur._segments(trouMurElement.params);
                    var seg = segs[trouMurIndex] || segs[0];
                    var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
                    var slen = Math.sqrt(sdx * sdx + sdz * sdz);
                    var snx = sdx / slen, snz = sdz / slen;
                    var angle = Math.atan2(sdz, sdx);
                    var gx = seg.x1 + snx * trouLocalX;
                    var gz = seg.z1 + snz * trouLocalX;
                    ghostTrou.position.set(gx, newY + hauteur / 2, gz);
                    ghostTrou.rotation.y = -angle;
                    ghostTrou.visible = true;
                    document.getElementById('info-bar').textContent = 'TROU — Y: ' + newY.toFixed(2) + 'm | Cliquez pour percer | Echap = annuler';
                }
            }
        }
        return;
    }

    // Mode deplacement : surligner ou deplacer
    if (modeDeplacement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);

        if (deplacementSelectionne && deplacementGroupes3D.length > 0) {
            // Mur(s) selectionne(s) : suivent la souris
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (result) {
                var sx = snapGrille(pointSol.x);
                var sz = snapGrille(pointSol.z);
                var offX = sx - deplacementOrigX;
                var offZ = sz - deplacementOrigZ;
                for (var g = 0; g < deplacementGroupes3D.length; g++) {
                    deplacementGroupes3D[g].position.x = offX;
                    deplacementGroupes3D[g].position.z = offZ;
                }
                // Deplacer visuellement les exclusions
                for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                    var de = deplacerExclusions[ei];
                    if (de.excl.group3D) {
                        de.excl.group3D.position.x = de.origX + offX;
                        de.excl.group3D.position.z = de.origZ + offZ;
                    }
                }
                // Deplacer visuellement les placos
                for (var pi = 0; pi < deplacerMurPlacos.length; pi++) {
                    var dp = deplacerMurPlacos[pi];
                    dp.ref.position.x = dp.origPosX + offX;
                    dp.ref.position.z = dp.origPosZ + offZ;
                }
                // Deplacer visuellement les laines
                for (var li = 0; li < deplacerMurLaines.length; li++) {
                    var dl = deplacerMurLaines[li];
                    dl.ref.position.x = dl.origPosX + offX;
                    dl.ref.position.z = dl.origPosZ + offZ;
                }
            }
        } else {
            // Survol : surligner le mur sous la souris
            var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
            var found = null;
            for (var i = 0; i < intersects.length; i++) {
                found = trouverElementParObjet(intersects[i].object);
                if (found) break;
            }
            if (found && found.group !== survolElement) {
                restaurerSurlignage();
                survolElement = found.group;
                survolInfo = found;
                surlignerGroupe(found.group, '#4a9eff');
                container.style.cursor = 'pointer';
            } else if (!found && survolElement) {
                restaurerSurlignage();
                survolInfo = null;
                container.style.cursor = 'crosshair';
            }
        }
        return;
    }

    // Mode placement : deplacer le ghost
    if (!modePlacement || !ghostMesh) return;

    raycaster.setFromCamera(mouse, sceneManager.camera);
    raycaster.ray.intersectPlane(planSol, pointSol);

    if (pointSol) {
        var sx = snapGrille(pointSol.x);
        var sz = snapGrille(pointSol.z);

        if (aimantActif) {
            if (dernierX !== null && Math.abs(sx - dernierX) < seuilAimant) sx = dernierX;
            if (dernierZ !== null && Math.abs(sz - dernierZ) < seuilAimant) sz = dernierZ;
        }

        ghostMesh.position.set(sx, 0, sz);
        ghostMesh.visible = true;

        document.getElementById('f-x').value = sx;
        document.getElementById('f-z').value = sz;
    }
});

container.addEventListener('pointerdown', function(e) {
    mouseDownPos.x = e.clientX;
    mouseDownPos.y = e.clientY;

    // Mode deplacer zone : demarrer la selection ou le deplacement
    if (modeDeplacerZone && e.button === 0) {
        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        var mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
        var res = raycaster.ray.intersectPlane(planSol, new THREE.Vector3());
        if (res) {
            if (deplacerZonePhase === 'select') {
                deplacerZoneStart = { wx: res.x, wz: res.z };
                deplacerZoneDrag = true;
                sceneManager.controls.enabled = false;
            } else if (deplacerZonePhase === 'move') {
                deplacerZoneMoveStart = { wx: res.x, wz: res.z };
                deplacerZoneDrag = true;
                sceneManager.controls.enabled = false;
            }
        }
        return;
    }

    // Mode copier zone : demarrer la selection ou le placement
    if (modeCopierZone && e.button === 0) {
        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        var mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
        var res = raycaster.ray.intersectPlane(planSol, new THREE.Vector3());
        if (res) {
            if (copierZonePhase === 'select') {
                copierZoneStart = { wx: res.x, wz: res.z };
                copierZoneDrag = true;
                sceneManager.controls.enabled = false;
            } else if (copierZonePhase === 'place') {
                copierZoneMoveStart = { wx: res.x, wz: res.z };
                copierZoneDrag = true;
                sceneManager.controls.enabled = false;
            }
        }
        return;
    }

    // Mode effacer zone : demarrer la selection
    if (modeEffacerZone && e.button === 0) {
        // Obtenir la position 3D du clic sur le sol
        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        var mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
        var res = raycaster.ray.intersectPlane(planSol, new THREE.Vector3());
        if (res) {
            effacerStart = { sx: e.clientX, sy: e.clientY, wx: res.x, wz: res.z };
            effacerDrag = true;
            sceneManager.controls.enabled = false;
        }
        return;
    }

    // Mode placo : debut du glisse sur le mur (ou recouvrir tout le mur)
    if (modePlaco && placoModele && e.button === 0) {
        if (ghostPlaco && ghostPlaco.visible && ghostPlaco.userData._placoPos) {
            var pp = ghostPlaco.userData._placoPos;

            // Mode recouvrir : poser sur toute la face en 1 clic
            if (document.getElementById('npl-recouvrir').checked) {
                _recouvrirMurComplet(pp, 'placo');
                // Mode 2 cotes : poser aussi sur le cote oppose
                if (document.getElementById('npl-2cotes').checked) {
                    var ppInverse = {};
                    for (var k in pp) ppInverse[k] = pp[k];
                    ppInverse.side = pp.side * -1;
                    _recouvrirMurComplet(ppInverse, 'placo');
                }
                ghostPlaco.visible = false;
                return;
            }

            placoDrag = true;
            placoDragStart = {
                localX: pp.localX,
                seg: pp.seg,
                element: pp.element,
                mur: pp.mur,
                len: pp.len,
                nx: pp.nx,
                nz: pp.nz,
                y: pp.y,
                murH: pp.murH,
                angle: pp.angle,
                side: pp.side,
                murEpFull: pp.murEpFull,
                extraBack: pp.extraBack || 0
            };
            sceneManager.controls.enabled = false;
            document.getElementById('info-bar').textContent = 'PLACO — Glissez le long du mur, relachez pour poser';
        }
        return;
    }

    // Mode laine : debut du glisse sur le mur (ou recouvrir tout le mur)
    if (modeLaine && laineModele && e.button === 0) {
        if (ghostLaine && ghostLaine.visible && ghostLaine.userData._lainePos) {
            var lp = ghostLaine.userData._lainePos;

            // Mode recouvrir : poser sur toute la face en 1 clic
            if (document.getElementById('nlv-recouvrir').checked) {
                _recouvrirMurComplet(lp, 'laine');
                if (ghostLaine) ghostLaine.visible = false;
                return;
            }

            laineDrag = true;
            laineDragStart = {
                localX: lp.localX,
                seg: lp.seg,
                element: lp.element,
                mur: lp.mur,
                len: lp.len,
                nx: lp.nx,
                nz: lp.nz,
                y: lp.y,
                murH: lp.murH,
                angle: lp.angle,
                side: lp.side,
                murEpFull: lp.murEpFull
            };
            sceneManager.controls.enabled = false;
            document.getElementById('info-bar').textContent = 'LAINE — Glissez le long du mur, relachez pour poser';
        }
        return;
    }

    // Mode deplacement
    if (modeDeplacement && e.button === 0) {
        // Rien de selectionne : pas de clic sur le canvas ici, on gere dans pointerup
    }
});

container.addEventListener('pointerup', function(e) {
    // Mode deplacer fenetre : clic pour poser
    // Mode deplacer porte : clic pour reposer
    if (modeDeplacerPorte && deplacerPorteInfo && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        var el = (deplacerPorteAxe !== 'libre' && deplacerPorteMurEl) ? deplacerPorteMurEl : (survolInfo ? survolInfo.element : null);
        if (el && ghostTrou && ghostTrou.visible) {
            var info = deplacerPorteInfo;
            var pWx = ghostTrou.position.x;
            var pWz = ghostTrou.position.z;
            var pAngle = -ghostTrou.rotation.y * 180 / Math.PI;

            var ghostPos = editeur.trouverPositionSurMur(el, pWx, pWz);
            var ttx = ghostPos.localX - info.largeur / 2;
            var tty = info.y - (el.params.y || 0);

            // Recalculer position exacte sur le mur (au centre de l'epaisseur)
            var _segDP = editeur._segments(el.params)[ghostPos.mur];
            if (_segDP) {
                var _dxDP = _segDP.x2 - _segDP.x1, _dzDP = _segDP.z2 - _segDP.z1;
                var _lenDP = Math.sqrt(_dxDP * _dxDP + _dzDP * _dzDP);
                var _nxDP = _dxDP / _lenDP, _nzDP = _dzDP / _lenDP;
                var _btDP = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
                var _nnxDP = -_dzDP / _lenDP, _nnzDP = _dxDP / _lenDP;
                // Clamper aux limites du segment
                if (ttx < 0) ttx = 0;
                if (ttx + info.largeur > _lenDP) ttx = _lenDP - info.largeur;
                if (ttx < 0) ttx = 0;
                // Recalculer position monde apres clamp — cote camera
                var _centerDP = ttx + info.largeur / 2;
                var _camDotDP = (sceneManager.camera.position.x - _segDP.x1) * _nnxDP + (sceneManager.camera.position.z - _segDP.z1) * _nnzDP;
                var _sideDP = _camDotDP >= 0 ? 1 : -1;
                pWx = _segDP.x1 + _nxDP * _centerDP + _nnxDP * _btDP.epaisseur / 2 * _sideDP;
                pWz = _segDP.z1 + _nzDP * _centerDP + _nnzDP * _btDP.epaisseur / 2 * _sideDP;
                pAngle = Math.atan2(_dzDP, _dxDP) * 180 / Math.PI;
            }

            restaurerSurlignage();
            survolInfo = null;
            supprimerGhostTrou();

            editeur.ajouterTrouElement(el.id, {
                x: Math.max(0, ttx),
                y: Math.max(0, tty),
                largeur: info.largeur,
                hauteur: info.hauteur,
                mur: ghostPos.mur
            });

            porte.setCouleurs(info.couleurCadre, info.couleurPorte);
            porte.creer('simple', pWx, pWz, info.y, info.largeur, info.hauteur, pAngle);

            // Decouper les placos/laines a la nouvelle position
            _couperPlacosLainesParPorte(el, Math.max(0, ttx), Math.max(0, tty), info.largeur, info.hauteur, ghostPos.mur);
        }

        modeDeplacerPorte = false;
        deplacerPorteInfo = null;
        deplacerPorteAxe = 'libre';
        deplacerPorteMurEl = null;
        editeur.realignerExclusions();
        sceneManager.controls.enabled = true;
        document.getElementById('info-bar').textContent = 'Porte deplacee !';
        return;
    }

    if (modeDeplacerFenetre && deplacerFenetreInfo && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        var el = (deplacerFenetreAxe !== 'libre' && deplacerFenetreMurEl) ? deplacerFenetreMurEl : (survolInfo ? survolInfo.element : null);
        if (el && ghostTrou && ghostTrou.visible) {
            var info = deplacerFenetreInfo;
            var fWx = ghostTrou.position.x;
            var fWz = ghostTrou.position.z;
            var fAngle = -ghostTrou.rotation.y * 180 / Math.PI;

            var ghostPos = editeur.trouverPositionSurMur(el, fWx, fWz);
            var ttx = ghostPos.localX - info.largeur / 2;
            var tty = info.y - (el.params.y || 0);

            // Recalculer position exacte sur le mur (au centre de l'epaisseur)
            var _segDF = editeur._segments(el.params)[ghostPos.mur];
            if (_segDF) {
                var _dxDF = _segDF.x2 - _segDF.x1, _dzDF = _segDF.z2 - _segDF.z1;
                var _lenDF = Math.sqrt(_dxDF * _dxDF + _dzDF * _dzDF);
                var _nxDF = _dxDF / _lenDF, _nzDF = _dzDF / _lenDF;
                var _btDF = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
                var _nnxDF = -_dzDF / _lenDF, _nnzDF = _dxDF / _lenDF;
                // Clamper aux limites du segment
                if (ttx < 0) ttx = 0;
                if (ttx + info.largeur > _lenDF) ttx = _lenDF - info.largeur;
                if (ttx < 0) ttx = 0;
                // Recalculer position monde apres clamp — cote camera
                var _centerDF = ttx + info.largeur / 2;
                var _camDotDF = (sceneManager.camera.position.x - _segDF.x1) * _nnxDF + (sceneManager.camera.position.z - _segDF.z1) * _nnzDF;
                var _sideDF = _camDotDF >= 0 ? 1 : -1;
                fWx = _segDF.x1 + _nxDF * _centerDF + _nnxDF * _btDF.epaisseur / 2 * _sideDF;
                fWz = _segDF.z1 + _nzDF * _centerDF + _nnzDF * _btDF.epaisseur / 2 * _sideDF;
                fAngle = Math.atan2(_dzDF, _dxDF) * 180 / Math.PI;
            }

            restaurerSurlignage();
            survolInfo = null;
            supprimerGhostTrou();

            editeur.ajouterTrouElement(el.id, {
                x: Math.max(0, ttx),
                y: Math.max(0, tty),
                largeur: info.largeur,
                hauteur: info.hauteur,
                mur: ghostPos.mur
            });

            fenetre.setCouleurs(info.couleurCadre, info.couleurVitre, info.opaciteVitre);
            fenetre.creer('rectangle', fWx, fWz, info.y, info.largeur, info.hauteur, fAngle);

            // Decouper les placos/laines a la nouvelle position
            _couperPlacosLainesParPorte(el, Math.max(0, ttx), Math.max(0, tty), info.largeur, info.hauteur, ghostPos.mur);
        }

        modeDeplacerFenetre = false;
        deplacerFenetreExcl = null;
        deplacerFenetreInfo = null;
        deplacerFenetreSnapshot = null;
        deplacerFenetreAxe = 'libre';
        deplacerFenetreMurEl = null;
        editeur.realignerExclusions();
        sceneManager.controls.enabled = true;
        container.style.cursor = 'default';
        document.getElementById('info-bar').textContent = 'Fenetre deplacee !';
        return;
    }

    // Mode deplacer personnage : clic pour valider
    if (modeDeplacerPerso && deplacerPersoGroup && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Personnage deplace !';
        return;
    }

    // Mode personnage : clic pour placer
    if (modePersonnage && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var _persCols = lireCouleursPersoPopup();
            var perso = personnage.creer(_persCols, pointSol.x, pointSol.z);
            var _persTaille = getTaillePerso();
            perso.scale.setScalar(_persTaille);
            perso.userData.persoInfo = { couleurs: _persCols, worldX: pointSol.x, worldZ: pointSol.z, taille: _persTaille };
            personnagesListe.push(perso);
            document.getElementById('info-bar').textContent = 'Personnage place ! Cliquez pour en placer un autre | Echap = annuler';
        }
        return;
    }

    // Mode deplacer point plafond : clic pour valider la nouvelle position
    if (_epfDeplacerPtIdx >= 0 && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var idx = _epfDeplacerPtIdx;
            // Mettre a jour les inputs
            var xs = document.querySelectorAll('.epf-pt-x');
            var zs = document.querySelectorAll('.epf-pt-z');
            if (xs[idx] && zs[idx]) {
                xs[idx].value = pointSol.x.toFixed(2);
                zs[idx].value = pointSol.z.toFixed(2);
            }
            // Mettre a jour le marker
            if (_epfDeplacerPtMarkers[idx]) {
                _epfDeplacerPtMarkers[idx].position.set(pointSol.x, 0.10, pointSol.z);
            }
            _epfDeplacerPtIdx = -1;
            container.style.cursor = 'default';
            var allBtns = document.querySelectorAll('.epf-pt-move');
            for (var i = 0; i < allBtns.length; i++) allBtns[i].style.outline = '';
            document.getElementById('info-bar').textContent = 'Point P' + (idx + 1) + ' deplace ! Cliquez Appliquer pour valider ou deplacez un autre point.';
        }
        return;
    }

    // Mode plafond : clic pour ajouter un point
    if (modePlafond4pts && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            var px = pointSol.x, pz = pointSol.z;
            var _plafondTermine = false;

            if (plafondModeRect) {
                // Mode rectangle : 2 clics
                _plafondAjouterMarker(px, pz);
                plafondPoints.push({ x: px, z: pz });

                if (plafondPoints.length >= 2) {
                    // Generer les 4 coins du rectangle
                    var p1 = plafondPoints[0], p2 = plafondPoints[1];
                    plafondPoints = [
                        { x: p1.x, z: p1.z },
                        { x: p2.x, z: p1.z },
                        { x: p2.x, z: p2.z },
                        { x: p1.x, z: p2.z }
                    ];
                    _plafondTermine = true;
                }
            } else {
                // Mode 4 points libres
                _plafondAjouterMarker(px, pz);
                plafondPoints.push({ x: px, z: pz });

                if (plafondPoints.length >= 4) {
                    // Fermer le contour
                    var first = plafondPoints[0], last = plafondPoints[3];
                    var closePts = [new THREE.Vector3(last.x, 0.02, last.z), new THREE.Vector3(first.x, 0.02, first.z)];
                    var closeGeo = new THREE.BufferGeometry().setFromPoints(closePts);
                    var closeMat = new THREE.LineBasicMaterial({ color: '#B0A090' });
                    var closeLine = new THREE.Line(closeGeo, closeMat);
                    sceneManager.scene.add(closeLine);
                    plafondGhostLines.push(closeLine);
                    _plafondTermine = true;
                }
            }

            if (_plafondTermine) {
                // Creer le plafond
                var hauteur = parseFloat(document.getElementById('npf-hauteur').value) || 2.50;
                var ep = parseInt(document.getElementById('npf-ep').value) || 20;
                var coulDalle = document.getElementById('npf-couleur').value;
                var coulPoteau = document.getElementById('npf-poteau').value;
                var avecPoteaux = document.getElementById('npf-poteaux').checked;
                var plafGroup = _creerPlafond(plafondPoints, hauteur, ep, coulDalle, coulPoteau, avecPoteaux);
                plafondElements.push(plafGroup);
                editeur.sauvegarderEtat();

                // Nettoyer les markers et lignes
                for (var _pm = 0; _pm < plafondMarkers.length; _pm++) sceneManager.scene.remove(plafondMarkers[_pm]);
                plafondMarkers = [];
                for (var _pl = 0; _pl < plafondGhostLines.length; _pl++) { sceneManager.scene.remove(plafondGhostLines[_pl]); plafondGhostLines[_pl].geometry.dispose(); plafondGhostLines[_pl].material.dispose(); }
                plafondGhostLines = [];
                if (plafondGhostRect) { sceneManager.scene.remove(plafondGhostRect); plafondGhostRect = null; }
                plafondPoints = [];

                _plafondMajEtape();
                document.getElementById('info-bar').textContent = 'Plafond cree ! Recommencez ou Echap = quitter';
            } else {
                _plafondMajEtape();
            }
        }
        return;
    }

    // Mode deplacer escalier : clic pour valider
    if (modeDeplacerEscalier && deplacerEscalierGroup && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;
        if (deplacerEscalierGroup.userData.escalierCreation) {
            deplacerEscalierGroup.userData.escalierCreation.worldX = deplacerEscalierGroup.position.x;
            deplacerEscalierGroup.userData.escalierCreation.worldZ = deplacerEscalierGroup.position.z;
        }
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Escalier deplace !';
        editeur.sauvegarderEtat();
        return;
    }

    // Mode escalier : clic pour placer
    if (modeEscalier && escalierModele && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        var result = raycaster.ray.intersectPlane(planSol, pointSol);
        if (result) {
            escalierObj.setCouleurs(
                document.getElementById('nesc-marche').value,
                document.getElementById('nesc-rampe').value
            );
            var _escOv = _lireEscalierOverrides();
            var escGroup = escalierObj.creer(escalierModele.id, pointSol.x, pointSol.z, 0, _escOv);
            escalierElements.push(escGroup);
            document.getElementById('info-bar').textContent = 'Escalier place ! Cliquez pour en placer un autre | Echap = annuler';
            editeur.sauvegarderEtat();
        }
        return;
    }

    // Mode copier zone
    if (modeCopierZone && copierZoneDrag && e.button === 0) {
        copierZoneDrag = false;
        sceneManager.controls.enabled = false;

        if (copierZonePhase === 'select' && copierZoneStart) {
            // Fin selection — collecter les elements a copier
            var rect = sceneManager.renderer.domElement.getBoundingClientRect();
            var mx2 = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            var my2 = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(mx2, my2), sceneManager.camera);
            var res2 = raycaster.ray.intersectPlane(planSol, new THREE.Vector3());
            if (!res2) { copierZoneStart = null; return; }

            var zX1 = Math.min(copierZoneStart.wx, res2.x);
            var zX2 = Math.max(copierZoneStart.wx, res2.x);
            var zZ1 = Math.min(copierZoneStart.wz, res2.z);
            var zZ2 = Math.max(copierZoneStart.wz, res2.z);
            if (zX2 - zX1 < 0.1 && zZ2 - zZ1 < 0.1) { copierZoneStart = null; return; }

            var cx = (zX1 + zX2) / 2, cz = (zZ1 + zZ2) / 2;
            copierZoneData = { murs: [], exclusions: [], placos: [], laines: [], traits: [], personnages: [], escaliers: [], plafonds: [], cx: cx, cz: cz };

            // Collecter les murs
            for (var i = 0; i < editeur.elements.length; i++) {
                var el = editeur.elements[i];
                var ex = el.params.x || 0, ez = el.params.z || 0;
                if (ex >= zX1 && ex <= zX2 && ez >= zZ1 && ez <= zZ2) {
                    copierZoneData.murs.push(JSON.parse(JSON.stringify(el.params)));
                }
            }
            // Exclusions
            for (var i = 0; i < editeur.exclusions.length; i++) {
                var excl = editeur.exclusions[i];
                if (excl.x >= zX1 && excl.x <= zX2 && excl.z >= zZ1 && excl.z <= zZ2) {
                    var creation = null;
                    var exType = 'fenetre';
                    if (excl.group3D && excl.group3D.userData.porteCreation) {
                        exType = 'porte';
                        creation = JSON.parse(JSON.stringify(excl.group3D.userData.porteCreation));
                    } else if (excl.group3D && excl.group3D.userData.fenetreCreation) {
                        exType = 'fenetre';
                        creation = JSON.parse(JSON.stringify(excl.group3D.userData.fenetreCreation));
                    }
                    copierZoneData.exclusions.push({ x: excl.x, z: excl.z, y: excl.y, largeur: excl.largeur, hauteur: excl.hauteur, angle: excl.angle, type: exType, creation: creation });
                }
            }
            // Placos
            for (var i = 0; i < placoElements.length; i++) {
                var pg = placoElements[i];
                var pi = pg.userData.placoInfo;
                if (pi && pi.worldX >= zX1 && pi.worldX <= zX2 && pi.worldZ >= zZ1 && pi.worldZ <= zZ2) {
                    var cols = Placo.lireCouleurs(pg);
                    copierZoneData.placos.push({ worldX: pi.worldX, worldZ: pi.worldZ, y: pi.y, largeur: pi.largeur, hauteur: pi.hauteur, angle: pi.angle, ep: pi.ep, side: pi.side, murEpFull: pi.murEpFull, extraBack: pi.extraBack || 0, couleur: cols.placo, opacite: cols.opacite });
                }
            }
            // Laines
            for (var i = 0; i < laineElements.length; i++) {
                var lg = laineElements[i];
                var li = lg.userData.laineInfo;
                if (li && li.worldX >= zX1 && li.worldX <= zX2 && li.worldZ >= zZ1 && li.worldZ <= zZ2) {
                    var cols = LaineDeVerre.lireCouleurs(lg);
                    copierZoneData.laines.push({ worldX: li.worldX, worldZ: li.worldZ, y: li.y, largeur: li.largeur, hauteur: li.hauteur, angle: li.angle, ep: li.ep, side: li.side, murEpFull: li.murEpFull, couleur: cols.laine, opacite: cols.opacite });
                }
            }
            // Traits
            for (var i = 0; i < editeur.traits.length; i++) {
                var tp = editeur.traits[i].params;
                var tcx = (tp.x1 + tp.x2) / 2, tcz = (tp.z1 + tp.z2) / 2;
                if (tcx >= zX1 && tcx <= zX2 && tcz >= zZ1 && tcz <= zZ2) {
                    copierZoneData.traits.push(JSON.parse(JSON.stringify(tp)));
                }
            }
            // Personnages
            for (var i = 0; i < personnagesListe.length; i++) {
                var pg = personnagesListe[i];
                var px = pg.position.x, pz = pg.position.z;
                if (px >= zX1 && px <= zX2 && pz >= zZ1 && pz <= zZ2) {
                    var pi = pg.userData.persoInfo;
                    if (pi) copierZoneData.personnages.push(JSON.parse(JSON.stringify(pi)));
                }
            }
            // Escaliers
            for (var i = 0; i < escalierElements.length; i++) {
                var eg = escalierElements[i];
                var ex = eg.position.x, ez = eg.position.z;
                if (ex >= zX1 && ex <= zX2 && ez >= zZ1 && ez <= zZ2) {
                    var ek = eg.userData.escalierCreation;
                    if (ek) copierZoneData.escaliers.push(JSON.parse(JSON.stringify(ek)));
                }
            }
            // Plafonds
            for (var i = 0; i < plafondElements.length; i++) {
                var pfg = plafondElements[i];
                var pfc = pfg.userData.plafondCreation;
                if (pfc && pfc.points.length >= 3) {
                    var pfcx = 0, pfcz = 0;
                    for (var pi = 0; pi < pfc.points.length; pi++) { pfcx += pfc.points[pi].x; pfcz += pfc.points[pi].z; }
                    pfcx /= pfc.points.length; pfcz /= pfc.points.length;
                    if (pfcx >= zX1 && pfcx <= zX2 && pfcz >= zZ1 && pfcz <= zZ2) {
                        copierZoneData.plafonds.push(JSON.parse(JSON.stringify(pfc)));
                    }
                }
            }

            var total = copierZoneData.murs.length + copierZoneData.exclusions.length + copierZoneData.placos.length + copierZoneData.laines.length + copierZoneData.traits.length + copierZoneData.personnages.length + copierZoneData.escaliers.length + copierZoneData.plafonds.length;
            if (total === 0) {
                document.getElementById('info-bar').textContent = 'Aucun element dans la zone. Reessayez.';
                if (window._copierZoneRect3D) { sceneManager.scene.remove(window._copierZoneRect3D); window._copierZoneRect3D = null; }
                copierZoneStart = null;
                return;
            }

            // Creer des ghosts transparents pour les murs copies
            window._copierZoneGhosts = [];
            for (var i = 0; i < copierZoneData.murs.length; i++) {
                var mp = copierZoneData.murs[i];
                var segs = editeur._segments(mp);
                for (var s = 0; s < segs.length; s++) {
                    var sg = segs[s];
                    var h = mp.hauteur || 2.5;
                    var geoG = new THREE.BoxGeometry(Math.sqrt(Math.pow(sg.x2 - sg.x1, 2) + Math.pow(sg.z2 - sg.z1, 2)), h, 0.12);
                    var matG = new THREE.MeshBasicMaterial({ color: 0x43B047, transparent: true, opacity: 0.3, depthWrite: false });
                    var meshG = new THREE.Mesh(geoG, matG);
                    meshG.position.set((sg.x1 + sg.x2) / 2, h / 2, (sg.z1 + sg.z2) / 2);
                    meshG.rotation.y = -Math.atan2(sg.z2 - sg.z1, sg.x2 - sg.x1);
                    meshG._origX = meshG.position.x;
                    meshG._origZ = meshG.position.z;
                    sceneManager.scene.add(meshG);
                    window._copierZoneGhosts.push(meshG);
                }
            }

            // Rectangle aussi en ghost
            if (window._copierZoneRect3D) {
                window._copierZoneRect3D._origX = window._copierZoneRect3D.position.x;
                window._copierZoneRect3D._origZ = window._copierZoneRect3D.position.z;
            }

            copierZonePhase = 'place';
            container.style.cursor = 'move';
            document.getElementById('info-bar').textContent = total + ' element(s) copies — Cliquez et glissez pour placer la copie | Echap = annuler';
            copierZoneStart = null;

        } else if (copierZonePhase === 'place' && copierZoneMoveStart && copierZoneData) {
            // Fin placement — creer les copies a l'identique
            var ddx = pointSol.x - copierZoneMoveStart.wx;
            var ddz = pointSol.z - copierZoneMoveStart.wz;

            editeur.sauvegarderEtat();

            // 1. Copier les murs AVEC leurs trous (identique)
            for (var i = 0; i < copierZoneData.murs.length; i++) {
                var mp = JSON.parse(JSON.stringify(copierZoneData.murs[i]));
                mp.x = (mp.x || 0) + ddx;
                mp.z = (mp.z || 0) + ddz;
                // Garder les trous tels quels — ils sont en coordonnees locales au mur
                editeur.ajouterMur(mp);
            }

            // 2. Copier les exclusions (portes/fenetres visuelles)
            for (var i = 0; i < copierZoneData.exclusions.length; i++) {
                var exi = copierZoneData.exclusions[i];
                if (exi.creation) {
                    var c = JSON.parse(JSON.stringify(exi.creation));
                    c.worldX += ddx;
                    c.worldZ += ddz;
                    if (exi.type === 'porte') {
                        porte.setCouleurs(c.couleurCadre, c.couleurPorte);
                        var pg = porte.creer(c.modeleId, c.worldX, c.worldZ, c.y, c.largeur, c.hauteur, c.angle);
                        // Stocker les infos de creation pour le undo
                        if (pg && pg.userData) pg.userData.porteCreation = c;
                    } else {
                        fenetre.setCouleurs(c.couleurCadre || '#4a90d9', c.couleurVitre || '#87CEEB', c.opaciteVitre || 0.3);
                        var fg = fenetre.creer(c.modeleId, c.worldX, c.worldZ, c.y, c.largeur, c.hauteur, c.angle);
                        if (fg && fg.userData) fg.userData.fenetreCreation = c;
                    }
                }
            }

            // 3. Copier les placos (couleur + position identiques)
            for (var i = 0; i < copierZoneData.placos.length; i++) {
                var pi = copierZoneData.placos[i];
                placo.setCouleurs(pi.couleur, pi.opacite / 100);
                var g = placo.creer(null, pi.worldX + ddx, pi.worldZ + ddz, pi.y, pi.largeur, pi.hauteur, pi.angle, pi.ep, pi.side, pi.murEpFull, pi.extraBack);
                placoElements.push(g);
            }

            // 4. Copier les laines (couleur + position identiques)
            for (var i = 0; i < copierZoneData.laines.length; i++) {
                var li = copierZoneData.laines[i];
                laineDeVerre.setCouleurs(li.couleur, li.opacite / 100);
                var g = laineDeVerre.creer(null, li.worldX + ddx, li.worldZ + ddz, li.y, li.largeur, li.hauteur, li.angle, li.ep, li.side, li.murEpFull);
                laineElements.push(g);
            }

            // 5. Copier les traits au sol
            for (var i = 0; i < copierZoneData.traits.length; i++) {
                var tp = JSON.parse(JSON.stringify(copierZoneData.traits[i]));
                tp.x1 += ddx; tp.z1 += ddz;
                tp.x2 += ddx; tp.z2 += ddz;
                var nt = editeur.ajouterTrait(tp);
                nt.line.visible = modeZones;
            }

            // 6. Copier les personnages
            for (var i = 0; i < copierZoneData.personnages.length; i++) {
                var pi = JSON.parse(JSON.stringify(copierZoneData.personnages[i]));
                pi.worldX += ddx;
                pi.worldZ += ddz;
                var perso = personnage.creer(pi.couleurs, pi.worldX, pi.worldZ);
                perso.scale.setScalar(pi.taille || 1);
                perso.userData.persoInfo = pi;
                personnagesListe.push(perso);
            }

            // 7. Copier les escaliers
            for (var i = 0; i < copierZoneData.escaliers.length; i++) {
                var ek = JSON.parse(JSON.stringify(copierZoneData.escaliers[i]));
                ek.worldX += ddx;
                ek.worldZ += ddz;
                escalierObj.setCouleurs(ek.couleurMarche || '#A0522D', ek.couleurRampe || '#666666');
                var g = escalierObj.creer(ek.modeleId, ek.worldX, ek.worldZ, ek.angle || 0, { largeur: ek.largeur, longueur: ek.longueur, hauteur: ek.hauteur, nbMarches: ek.nbMarches });
                escalierElements.push(g);
            }

            // 8. Copier les plafonds
            for (var i = 0; i < copierZoneData.plafonds.length; i++) {
                var pk = JSON.parse(JSON.stringify(copierZoneData.plafonds[i]));
                for (var pi = 0; pi < pk.points.length; pi++) {
                    pk.points[pi].x += ddx;
                    pk.points[pi].z += ddz;
                }
                var g = _creerPlafond(pk.points, pk.hauteur, pk.ep, pk.couleurDalle, pk.couleurPoteau, pk.avecPoteaux);
                plafondElements.push(g);
            }

            // Nettoyer les ghosts
            if (window._copierZoneGhosts) {
                for (var gi = 0; gi < window._copierZoneGhosts.length; gi++) {
                    sceneManager.scene.remove(window._copierZoneGhosts[gi]);
                }
                window._copierZoneGhosts = null;
            }
            if (window._copierZoneRect3D) { sceneManager.scene.remove(window._copierZoneRect3D); window._copierZoneRect3D = null; }

            copierZonePhase = 'select';
            copierZoneMoveStart = null;
            copierZoneData = null;
            container.style.cursor = 'crosshair';
            document.getElementById('info-bar').textContent = 'Copie effectuee ! Selectionnez une nouvelle zone ou Echap pour quitter';
        }
        return;
    }

    // Mode effacer zone : fin de la selection
    // Mode deplacer zone : fin selection ou fin deplacement
    if (modeDeplacerZone && deplacerZoneDrag && e.button === 0) {
        deplacerZoneDrag = false;
        sceneManager.controls.enabled = true;

        if (deplacerZonePhase === 'select' && deplacerZoneStart) {
            // Fin de la selection — trouver les elements dans la zone
            var rect = sceneManager.renderer.domElement.getBoundingClientRect();
            var mx2 = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            var my2 = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(mx2, my2), sceneManager.camera);
            var res2 = raycaster.ray.intersectPlane(planSol, new THREE.Vector3());
            if (!res2) { deplacerZoneStart = null; return; }

            var zX1 = Math.min(deplacerZoneStart.wx, res2.x);
            var zX2 = Math.max(deplacerZoneStart.wx, res2.x);
            var zZ1 = Math.min(deplacerZoneStart.wz, res2.z);
            var zZ2 = Math.max(deplacerZoneStart.wz, res2.z);
            if (zX2 - zX1 < 0.1 && zZ2 - zZ1 < 0.1) { deplacerZoneStart = null; return; }

            editeur.sauvegarderEtat();
            deplacerZoneElements = [];

            // Murs
            for (var i = 0; i < editeur.elements.length; i++) {
                var el = editeur.elements[i];
                var ex = el.params.x || 0, ez = el.params.z || 0;
                if (ex >= zX1 && ex <= zX2 && ez >= zZ1 && ez <= zZ2) {
                    deplacerZoneElements.push({ type: 'mur', ref: el, origX: ex, origZ: ez });
                }
            }
            // Exclusions (portes/fenetres)
            for (var i = 0; i < editeur.exclusions.length; i++) {
                var excl = editeur.exclusions[i];
                if (excl.x >= zX1 && excl.x <= zX2 && excl.z >= zZ1 && excl.z <= zZ2) {
                    deplacerZoneElements.push({ type: 'exclusion', ref: excl, origX: excl.x, origZ: excl.z });
                }
            }
            // Placos
            for (var i = 0; i < placoElements.length; i++) {
                var pg = placoElements[i];
                var pi = pg.userData.placoInfo;
                if (pi && pi.worldX >= zX1 && pi.worldX <= zX2 && pi.worldZ >= zZ1 && pi.worldZ <= zZ2) {
                    deplacerZoneElements.push({ type: 'placo', ref: pg, origX: pi.worldX, origZ: pi.worldZ, origPosX: pg.position.x, origPosZ: pg.position.z });
                }
            }
            // Laines
            for (var i = 0; i < laineElements.length; i++) {
                var lg = laineElements[i];
                var li = lg.userData.laineInfo;
                if (li && li.worldX >= zX1 && li.worldX <= zX2 && li.worldZ >= zZ1 && li.worldZ <= zZ2) {
                    deplacerZoneElements.push({ type: 'laine', ref: lg, origX: li.worldX, origZ: li.worldZ, origPosX: lg.position.x, origPosZ: lg.position.z });
                }
            }
            // Personnages
            for (var i = 0; i < personnagesListe.length; i++) {
                var pg = personnagesListe[i];
                var px = pg.position.x, pz = pg.position.z;
                if (px >= zX1 && px <= zX2 && pz >= zZ1 && pz <= zZ2) {
                    deplacerZoneElements.push({ type: 'personnage', ref: pg, origPosX: px, origPosZ: pz });
                }
            }
            // Escaliers
            for (var i = 0; i < escalierElements.length; i++) {
                var eg = escalierElements[i];
                var ex = eg.position.x, ez = eg.position.z;
                if (ex >= zX1 && ex <= zX2 && ez >= zZ1 && ez <= zZ2) {
                    deplacerZoneElements.push({ type: 'escalier', ref: eg, origPosX: ex, origPosZ: ez });
                }
            }
            // Plafonds (centre des 4 points)
            for (var i = 0; i < plafondElements.length; i++) {
                var pfg = plafondElements[i];
                var pfc = pfg.userData.plafondCreation;
                if (pfc && pfc.points.length >= 4) {
                    var pfcx = (pfc.points[0].x + pfc.points[1].x + pfc.points[2].x + pfc.points[3].x) / 4;
                    var pfcz = (pfc.points[0].z + pfc.points[1].z + pfc.points[2].z + pfc.points[3].z) / 4;
                    if (pfcx >= zX1 && pfcx <= zX2 && pfcz >= zZ1 && pfcz <= zZ2) {
                        deplacerZoneElements.push({ type: 'plafond', ref: pfg, origPosX: pfg.position.x, origPosZ: pfg.position.z });
                    }
                }
            }

            if (deplacerZoneElements.length === 0) {
                document.getElementById('info-bar').textContent = 'Aucun element dans la zone. Reessayez.';
                if (window._deplacerZoneRect3D) { sceneManager.scene.remove(window._deplacerZoneRect3D); window._deplacerZoneRect3D = null; }
                deplacerZoneStart = null;
                return;
            }

            // Stocker la position du rectangle pour le deplacer aussi
            if (window._deplacerZoneRect3D) {
                window._deplacerZoneRect3D._origX = window._deplacerZoneRect3D.position.x;
                window._deplacerZoneRect3D._origZ = window._deplacerZoneRect3D.position.z;
            }

            deplacerZonePhase = 'move';
            container.style.cursor = 'move';
            document.getElementById('info-bar').textContent = deplacerZoneElements.length + ' element(s) selectionne(s) — Cliquez et glissez pour deplacer | Echap = annuler';
            deplacerZoneStart = null;
            return;

        } else if (deplacerZonePhase === 'move') {
            // Fin du deplacement — valider et mettre a jour les userData
            for (var dzi = 0; dzi < deplacerZoneElements.length; dzi++) {
                var dze = deplacerZoneElements[dzi];
                if (dze.type === 'escalier' && dze.ref.userData.escalierCreation) {
                    dze.ref.userData.escalierCreation.worldX = dze.ref.position.x;
                    dze.ref.userData.escalierCreation.worldZ = dze.ref.position.z;
                }
                if (dze.type === 'plafond' && dze.ref.userData.plafondCreation) {
                    var pc = dze.ref.userData.plafondCreation;
                    var ddx = dze.ref.position.x - dze.origPosX;
                    var ddz = dze.ref.position.z - dze.origPosZ;
                    for (var pi = 0; pi < pc.points.length; pi++) {
                        pc.points[pi].x += ddx;
                        pc.points[pi].z += ddz;
                    }
                }
                if (dze.type === 'personnage' && dze.ref.userData.persoInfo) {
                    dze.ref.userData.persoInfo.worldX = dze.ref.position.x;
                    dze.ref.userData.persoInfo.worldZ = dze.ref.position.z;
                }
            }
            editeur.sauvegarderEtat();
            if (window._deplacerZoneRect3D) { sceneManager.scene.remove(window._deplacerZoneRect3D); window._deplacerZoneRect3D = null; }
            var nb = deplacerZoneElements.length;
            deplacerZoneElements = [];
            deplacerZoneMoveStart = null;
            deplacerZonePhase = 'select';
            container.style.cursor = 'crosshair';
            editeur.realignerExclusions();
            document.getElementById('info-bar').textContent = nb + ' element(s) deplace(s) ! Selectionnez une autre zone ou Echap = quitter';
            return;
        }
    }

    if (modeEffacerZone && effacerDrag && effacerStart && e.button === 0) {
        effacerDrag = false;
        if (window._effacerRect3D) { sceneManager.scene.remove(window._effacerRect3D); window._effacerRect3D = null; }
        sceneManager.controls.enabled = true;

        // Obtenir la position 3D de fin sur le sol
        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        var mx2 = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        var my2 = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(mx2, my2), sceneManager.camera);
        var res2 = raycaster.ray.intersectPlane(planSol, new THREE.Vector3());
        if (!res2) return;

        // Zone 3D sur le plateau (min/max)
        var zoneX1 = Math.min(effacerStart.wx, res2.x);
        var zoneX2 = Math.max(effacerStart.wx, res2.x);
        var zoneZ1 = Math.min(effacerStart.wz, res2.z);
        var zoneZ2 = Math.max(effacerStart.wz, res2.z);

        // Trop petit = annuler
        if (zoneX2 - zoneX1 < 0.1 && zoneZ2 - zoneZ1 < 0.1) { effacerStart = null; return; }

        editeur.sauvegarderEtat();

        // Effacer les murs dont l'origine est dans la zone
        var aSupprimer = [];
        for (var i = 0; i < editeur.elements.length; i++) {
            var el = editeur.elements[i];
            var ex = el.params.x || 0;
            var ez = el.params.z || 0;
            if (ex >= zoneX1 && ex <= zoneX2 && ez >= zoneZ1 && ez <= zoneZ2) {
                aSupprimer.push(el.id);
            }
        }
        for (var i = 0; i < aSupprimer.length; i++) {
            editeur.supprimer(aSupprimer[i]);
        }

        // Effacer les fenetres (exclusions) dans la zone
        var exclASupprimer = [];
        for (var i = 0; i < editeur.exclusions.length; i++) {
            var excl = editeur.exclusions[i];
            if (excl.x >= zoneX1 && excl.x <= zoneX2 && excl.z >= zoneZ1 && excl.z <= zoneZ2) {
                exclASupprimer.push(excl.id);
            }
        }
        for (var i = 0; i < exclASupprimer.length; i++) {
            editeur.supprimerExclusion(exclASupprimer[i]);
        }

        // Effacer les mesures dans la zone
        var mesASupprimer = [];
        for (var i = 0; i < mesuresListe.length; i++) {
            var m = mesuresListe[i];
            if (m.p1 && m.p1.x >= zoneX1 && m.p1.x <= zoneX2 && m.p1.z >= zoneZ1 && m.p1.z <= zoneZ2) {
                mesASupprimer.push(m.id);
            }
        }
        for (var i = 0; i < mesASupprimer.length; i++) {
            supprimerMesureItem(mesASupprimer[i]);
        }

        // Effacer les placos dans la zone
        var placoASupprimer = [];
        for (var i = 0; i < placoElements.length; i++) {
            var pg = placoElements[i];
            if (pg.userData.placoInfo) {
                var pi = pg.userData.placoInfo;
                if (pi.worldX >= zoneX1 && pi.worldX <= zoneX2 && pi.worldZ >= zoneZ1 && pi.worldZ <= zoneZ2) {
                    placoASupprimer.push(i);
                }
            }
        }
        for (var i = placoASupprimer.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(placoElements[placoASupprimer[i]]);
            placoElements.splice(placoASupprimer[i], 1);
        }

        // Effacer les laines dans la zone
        var laineASupprimer = [];
        for (var i = 0; i < laineElements.length; i++) {
            var lg = laineElements[i];
            if (lg.userData.laineInfo) {
                var li = lg.userData.laineInfo;
                if (li.worldX >= zoneX1 && li.worldX <= zoneX2 && li.worldZ >= zoneZ1 && li.worldZ <= zoneZ2) {
                    laineASupprimer.push(i);
                }
            }
        }
        for (var i = laineASupprimer.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(laineElements[laineASupprimer[i]]);
            laineElements.splice(laineASupprimer[i], 1);
        }

        // Effacer les personnages dans la zone
        var persASupprimer = [];
        for (var i = 0; i < personnagesListe.length; i++) {
            var pg = personnagesListe[i];
            if (pg.position.x >= zoneX1 && pg.position.x <= zoneX2 && pg.position.z >= zoneZ1 && pg.position.z <= zoneZ2) {
                persASupprimer.push(i);
            }
        }
        for (var i = persASupprimer.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(personnagesListe[persASupprimer[i]]);
            personnagesListe.splice(persASupprimer[i], 1);
        }

        // Effacer les escaliers dans la zone
        var escASupprimer = [];
        for (var i = 0; i < escalierElements.length; i++) {
            var eg = escalierElements[i];
            if (eg.position.x >= zoneX1 && eg.position.x <= zoneX2 && eg.position.z >= zoneZ1 && eg.position.z <= zoneZ2) {
                escASupprimer.push(i);
            }
        }
        for (var i = escASupprimer.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(escalierElements[escASupprimer[i]]);
            escalierElements.splice(escASupprimer[i], 1);
        }

        // Effacer les plafonds dans la zone
        var plafASupprimer = [];
        for (var i = 0; i < plafondElements.length; i++) {
            var pfg = plafondElements[i];
            var pfc = pfg.userData.plafondCreation;
            if (pfc && pfc.points.length >= 3) {
                var pfcx = 0, pfcz = 0;
                for (var pi = 0; pi < pfc.points.length; pi++) { pfcx += pfc.points[pi].x; pfcz += pfc.points[pi].z; }
                pfcx /= pfc.points.length; pfcz /= pfc.points.length;
                if (pfcx >= zoneX1 && pfcx <= zoneX2 && pfcz >= zoneZ1 && pfcz <= zoneZ2) {
                    plafASupprimer.push(i);
                }
            }
        }
        for (var i = plafASupprimer.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(plafondElements[plafASupprimer[i]]);
            plafondElements.splice(plafASupprimer[i], 1);
        }

        var total = aSupprimer.length + exclASupprimer.length + mesASupprimer.length + placoASupprimer.length + laineASupprimer.length + persASupprimer.length + escASupprimer.length + plafASupprimer.length;
        document.getElementById('info-bar').textContent = total + ' element(s) efface(s) | Selectionnez une autre zone ou Echap = quitter';
        effacerStart = null;
        return;
    }

    // Mode porte : clic pour poser (ou ouvrir popup precis)
    if (modePorte && porteModele && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        // Mode precis : ouvrir le popup au lieu de poser
        if (modePrecisPorte && survolInfo && survolInfo.element) {
            precisPorteElement = survolInfo.element;
            precisPorteModele = porteModele;
            var p = precisPorteElement.params;
            // Utiliser la longueur reelle du segment 0
            var _segsP = editeur._segments(p);
            var _segP0 = _segsP[0];
            var dist = p.distance || 5;
            if (_segP0) {
                var _sdxP0 = _segP0.x2 - _segP0.x1, _sdzP0 = _segP0.z2 - _segP0.z1;
                dist = Math.sqrt(_sdxP0 * _sdxP0 + _sdzP0 * _sdzP0);
            }
            var haut = p.hauteur || 2.5;
            document.getElementById('np-precis-mur').textContent = (p.nom || 'Mur') + ' — ' + dist.toFixed(2) + 'm x ' + haut.toFixed(2) + 'm';
            // Init X
            document.getElementById('np-pos-x').value = '1.00';
            document.getElementById('np-pos-x').max = dist;
            document.getElementById('np-pos-x-range').max = dist;
            document.getElementById('np-pos-x-range').value = 1;
            // Init Y
            document.getElementById('np-pos-y').value = porteModele.y.toFixed(2);
            document.getElementById('np-pos-y').max = haut;
            document.getElementById('np-pos-y-range').max = haut;
            document.getElementById('np-pos-y-range').value = porteModele.y;
            // Reset a etape 1
            document.getElementById('np-step-x').style.display = 'block';
            document.getElementById('np-step-y').style.display = 'none';
            document.getElementById('porte-popup').style.display = 'none';
            document.getElementById('np-precis-popup').style.display = 'block';
            positionnerGhostPrecis(precisPorteElement, 1.00, porteModele.y, porteModele.largeur, porteModele.hauteur);
            document.getElementById('info-bar').textContent = 'PORTE PRECIS — Etape 1/2 : Ajustez la position X';
            return;
        }

        if (survolInfo && survolInfo.element) {
            var rect = sceneManager.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, sceneManager.camera);
            var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
            var resP = _chercherMurTraversant(intersects, ghostTrou);
            var hit = resP.hit;
            if (hit) {
                var el = survolInfo.element;
                var mod = porteModele;
                var elDist = el.params.distance || 5;
                var elHaut = el.params.hauteur || 2.5;
                var elAngle = el.params.angle || 0;
                var elRad = elAngle * Math.PI / 180;
                var pos = editeur.trouverPositionSurMur(el, hit.x, hit.z);
                var tx, ty, porteWx, porteWz, porteAngle, porteY, trouMurP;

                tx = pos.localX - mod.largeur / 2;
                ty = mod.y - (el.params.y || 0);
                porteY = mod.y;

                if (ghostTrou && ghostTrou.visible) {
                    porteWx = ghostTrou.position.x;
                    porteWz = ghostTrou.position.z;
                    porteAngle = -ghostTrou.rotation.y;
                } else {
                    porteWx = hit.x;
                    porteWz = hit.z;
                    porteAngle = elRad;
                }

                var ghostPos = editeur.trouverPositionSurMur(el, porteWx, porteWz);
                tx = ghostPos.localX - mod.largeur / 2;
                ty = mod.y - (el.params.y || 0);
                trouMurP = ghostPos.mur;

                // Recalculer la position exacte sur le segment du mur (au centre de l'epaisseur)
                var _seg = editeur._segments(el.params)[trouMurP];
                var _segLen = elDist;
                var _snx = 1, _snz = 0, _nnx = 0, _nnz = 0, _bt = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
                if (_seg) {
                    var _sdx = _seg.x2 - _seg.x1, _sdz = _seg.z2 - _seg.z1;
                    _segLen = Math.sqrt(_sdx * _sdx + _sdz * _sdz);
                    _snx = _sdx / _segLen; _snz = _sdz / _segLen;
                    _nnx = -_sdz / _segLen; _nnz = _sdx / _segLen;
                    porteAngle = Math.atan2(_sdz, _sdx);
                }

                // Clamper aux limites du SEGMENT reel (pas params.distance)
                if (tx < 0) tx = 0;
                if (tx + mod.largeur > _segLen) tx = _segLen - mod.largeur;
                if (tx < 0) tx = 0;
                if (ty < 0) ty = 0;
                if (ty + mod.hauteur > elHaut) ty = elHaut - mod.hauteur;
                if (ty < 0) ty = 0;

                // Recalculer la position monde APRES le clamp — cote camera
                var _clampedCenterX = tx + mod.largeur / 2;
                if (_seg) {
                    var _camDotP = (sceneManager.camera.position.x - _seg.x1) * _nnx + (sceneManager.camera.position.z - _seg.z1) * _nnz;
                    var _sideP = _camDotP >= 0 ? 1 : -1;
                    porteWx = _seg.x1 + _snx * _clampedCenterX + _nnx * _bt.epaisseur / 2 * _sideP;
                    porteWz = _seg.z1 + _snz * _clampedCenterX + _nnz * _bt.epaisseur / 2 * _sideP;
                }

                editeur.sauvegarderEtat();
                restaurerSurlignage();
                survolInfo = null;

                editeur.ajouterTrouElement(el.id, {
                    x: Math.max(0, tx),
                    y: Math.max(0, ty),
                    largeur: mod.largeur,
                    hauteur: mod.hauteur,
                    mur: trouMurP
                });

                porte.setCouleurs(
                    document.getElementById('np-cadre').value,
                    document.getElementById('np-porte').value
                );
                porte.creer(mod.id, porteWx, porteWz, porteY, mod.largeur, mod.hauteur, porteAngle * 180 / Math.PI);

                // Couper les placos et laines traverses par la porte
                _couperPlacosLainesParPorte(el, Math.max(0, tx), Math.max(0, ty), mod.largeur, mod.hauteur, trouMurP);

                document.getElementById('info-bar').textContent = 'Porte posee ! Cliquez pour en poser une autre | Echap = quitter';
            }
        }
        return;
    }

    // Mode placo : fin du glisse = poser
    if (modePlaco && placoModele && e.button === 0 && placoDrag && placoDragStart) {
        sceneManager.controls.enabled = true;

        if (ghostPlaco && ghostPlaco.visible && ghostPlaco.userData._placoPos) {
            var pp = ghostPlaco.userData._placoPos;
            // Minimum 5cm de largeur pour poser
            if (pp.largeur >= 0.05) {
                // Supprimer les placos existants qui chevauchent la meme zone (meme mur, meme cote)
                _supprimerPlacosChevauche(pp);

                var mod = placoModele;
                placo.setCouleurs(
                    document.getElementById('npl-couleur').value,
                    parseFloat(document.getElementById('npl-opacite').value) / 100
                );
                var group = placo.creer(mod.id, pp.worldX, pp.worldZ, pp.y, pp.largeur, pp.hauteur, pp.angle, mod.ep, pp.side, pp.murEpFull, pp.extraBack || 0);
                placoElements.push(group);
                // Decouper automatiquement pour les fenetres/portes existantes
                _decouperPlacoLainePourToutesExclusions(pp.element);
                document.getElementById('info-bar').textContent = 'Placo pose (' + pp.largeur.toFixed(2) + 'm x ' + pp.hauteur.toFixed(2) + 'm) ! Glissez pour en poser un autre | Echap = quitter';
            }
        }
        placoDrag = false;
        placoDragStart = null;
        return;
    }

    // Mode deplacer placo : clic pour poser
    if (modeDeplacerPlaco && deplacerPlacoGroup && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        if (ghostPlaco && ghostPlaco.visible && ghostPlaco.userData._placoPos) {
            var pp = ghostPlaco.userData._placoPos;
            var info = deplacerPlacoGroup.userData.placoInfo;
            // Lire les couleurs actuelles
            var cols = Placo.lireCouleurs(deplacerPlacoGroup);
            placo.setCouleurs(cols.placo, cols.opacite / 100);
            // Supprimer l'ancien
            sceneManager.scene.remove(deplacerPlacoGroup);
            var idx = placoElements.indexOf(deplacerPlacoGroup);
            if (idx >= 0) placoElements.splice(idx, 1);
            // Creer le nouveau
            var group = placo.creer(null, pp.worldX, pp.worldZ, pp.y, pp.largeur, pp.hauteur, pp.angle, info.ep, pp.side, pp.murEpFull || info.murEpFull, pp.extraBack || 0);
            placoElements.push(group);
            toutDesactiver();
            document.getElementById('info-bar').textContent = 'Placo deplace !';
        }
        return;
    }

    // Mode agrandir plaque : clic pour valider
    if (modeAgrandirPlaque && agrandirPlaqueGroup && e.button === 0) {
        // Supprimer le ghost blanc
        if (agrandirPlaqueGhost) {
            sceneManager.scene.remove(agrandirPlaqueGhost);
            agrandirPlaqueGhost = null;
        }
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Plaque redimensionnee !';
        return;
    }

    // Mode laine : fin du glisse = poser
    if (modeLaine && laineModele && e.button === 0 && laineDrag && laineDragStart) {
        sceneManager.controls.enabled = true;

        if (ghostLaine && ghostLaine.visible && ghostLaine.userData._lainePos) {
            var lp = ghostLaine.userData._lainePos;
            if (lp.largeur >= 0.02) {
                _supprimerLainesChevauche(lp);

                var mod = laineModele;
                laineDeVerre.setCouleurs(
                    document.getElementById('nlv-couleur').value,
                    parseFloat(document.getElementById('nlv-opacite').value) / 100
                );
                var group = laineDeVerre.creer(mod.id, lp.worldX, lp.worldZ, lp.y, lp.largeur, lp.hauteur, lp.angle, mod.ep, lp.side, lp.murEpFull);
                laineElements.push(group);
                // Decouper automatiquement pour les fenetres/portes existantes
                _decouperPlacoLainePourToutesExclusions(lp.element);
                document.getElementById('info-bar').textContent = 'Laine posee (' + lp.largeur.toFixed(2) + 'm x ' + lp.hauteur.toFixed(2) + 'm) ! Glissez pour en poser une autre | Echap = quitter';
            }
        }
        laineDrag = false;
        laineDragStart = null;
        return;
    }

    // Mode deplacer laine : clic pour poser
    if (modeDeplacerLaine && deplacerLaineGroup && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        if (ghostLaine && ghostLaine.visible && ghostLaine.userData._lainePos) {
            var lp = ghostLaine.userData._lainePos;
            var info = deplacerLaineGroup.userData.laineInfo;
            var cols = LaineDeVerre.lireCouleurs(deplacerLaineGroup);
            laineDeVerre.setCouleurs(cols.laine, cols.opacite / 100);
            sceneManager.scene.remove(deplacerLaineGroup);
            var idx = laineElements.indexOf(deplacerLaineGroup);
            if (idx >= 0) laineElements.splice(idx, 1);
            var group = laineDeVerre.creer(null, lp.worldX, lp.worldZ, lp.y, lp.largeur, lp.hauteur, lp.angle, info.ep, lp.side, lp.murEpFull || info.murEpFull);
            laineElements.push(group);
            toutDesactiver();
            document.getElementById('info-bar').textContent = 'Laine deplacee !';
        }
        return;
    }

    // Mode fenetre : clic pour poser (ou ouvrir popup precis)
    if (modeFenetre && fenetreModele && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        // Mode precis : ouvrir le popup au lieu de poser
        if (modePrecisFenetre && survolInfo && survolInfo.element) {
            precisFenetreElement = survolInfo.element;
            precisFenetreModele = fenetreModele;
            var p = precisFenetreElement.params;
            // Utiliser la longueur reelle du segment 0
            var _segsF = editeur._segments(p);
            var _segF0 = _segsF[0];
            var dist = p.distance || 5;
            if (_segF0) {
                var _sdxF0 = _segF0.x2 - _segF0.x1, _sdzF0 = _segF0.z2 - _segF0.z1;
                dist = Math.sqrt(_sdxF0 * _sdxF0 + _sdzF0 * _sdzF0);
            }
            var haut = p.hauteur || 2.5;
            document.getElementById('nf-precis-mur').textContent = (p.nom || 'Mur') + ' — ' + dist.toFixed(2) + 'm x ' + haut.toFixed(2) + 'm';
            // Init X
            document.getElementById('nf-pos-x').value = '1.00';
            document.getElementById('nf-pos-x').max = dist;
            document.getElementById('nf-pos-x-range').max = dist;
            document.getElementById('nf-pos-x-range').value = 1;
            // Init Y
            document.getElementById('nf-pos-y').value = fenetreModele.y.toFixed(2);
            document.getElementById('nf-pos-y').max = haut;
            document.getElementById('nf-pos-y-range').max = haut;
            document.getElementById('nf-pos-y-range').value = fenetreModele.y;
            // Reset a etape 1
            document.getElementById('nf-step-x').style.display = 'block';
            document.getElementById('nf-step-y').style.display = 'none';
            document.getElementById('fenetre-popup').style.display = 'none';
            document.getElementById('nf-precis-popup').style.display = 'block';
            positionnerGhostPrecis(precisFenetreElement, 1.00, fenetreModele.y, fenetreModele.largeur, fenetreModele.hauteur);
            document.getElementById('info-bar').textContent = 'FENETRE PRECIS — Etape 1/2 : Ajustez la position X';
            return;
        }

        if (survolInfo && survolInfo.element) {
            var rect = sceneManager.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, sceneManager.camera);
            var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
            var resF = _chercherMurTraversant(intersects, ghostTrou);
            var hit = resF.hit;
            if (hit) {
                var el = survolInfo.element;
                var mod = fenetreModele;
                var elDist = el.params.distance || 5;
                var elHaut = el.params.hauteur || 2.5;
                var elAngle = el.params.angle || 0;
                var elRad = elAngle * Math.PI / 180;
                var pos = editeur.trouverPositionSurMur(el, hit.x, hit.z);
                var tx, ty, fenetreWx, fenetreWz, fenetreAngle, fenetreY, trouMur;

                tx = pos.localX - mod.largeur / 2;
                ty = mod.y - (el.params.y || 0);
                fenetreY = mod.y;

                if (ghostTrou && ghostTrou.visible) {
                    fenetreWx = ghostTrou.position.x;
                    fenetreWz = ghostTrou.position.z;
                    fenetreAngle = -ghostTrou.rotation.y;
                } else {
                    fenetreWx = hit.x;
                    fenetreWz = hit.z;
                    fenetreAngle = elRad;
                }

                var ghostPos = editeur.trouverPositionSurMur(el, fenetreWx, fenetreWz);
                tx = ghostPos.localX - mod.largeur / 2;
                ty = mod.y - (el.params.y || 0);
                trouMur = ghostPos.mur;

                // Recalculer la position exacte sur le segment du mur (au centre de l'epaisseur)
                var _segF = editeur._segments(el.params)[trouMur];
                var _segLenF = elDist;
                var _snxF = 1, _snzF = 0, _nnxF = 0, _nnzF = 0, _btF = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
                if (_segF) {
                    var _sdxF = _segF.x2 - _segF.x1, _sdzF = _segF.z2 - _segF.z1;
                    _segLenF = Math.sqrt(_sdxF * _sdxF + _sdzF * _sdzF);
                    _snxF = _sdxF / _segLenF; _snzF = _sdzF / _segLenF;
                    _nnxF = -_sdzF / _segLenF; _nnzF = _sdxF / _segLenF;
                    fenetreAngle = Math.atan2(_sdzF, _sdxF);
                }

                // Clamper aux limites du SEGMENT reel (pas params.distance)
                if (tx < 0) tx = 0;
                if (tx + mod.largeur > _segLenF) tx = _segLenF - mod.largeur;
                if (tx < 0) tx = 0;
                if (ty < 0) ty = 0;
                if (ty + mod.hauteur > elHaut) ty = elHaut - mod.hauteur;
                if (ty < 0) ty = 0;

                // Recalculer la position monde APRES le clamp — cote camera
                var _clampedCenterXF = tx + mod.largeur / 2;
                if (_segF) {
                    var _camDotF = (sceneManager.camera.position.x - _segF.x1) * _nnxF + (sceneManager.camera.position.z - _segF.z1) * _nnzF;
                    var _sideF = _camDotF >= 0 ? 1 : -1;
                    fenetreWx = _segF.x1 + _snxF * _clampedCenterXF + _nnxF * _btF.epaisseur / 2 * _sideF;
                    fenetreWz = _segF.z1 + _snzF * _clampedCenterXF + _nnzF * _btF.epaisseur / 2 * _sideF;
                }

                editeur.sauvegarderEtat();
                restaurerSurlignage();
                survolInfo = null;

                editeur.ajouterTrouElement(el.id, {
                    x: Math.max(0, tx),
                    y: Math.max(0, ty),
                    largeur: mod.largeur,
                    hauteur: mod.hauteur,
                    mur: trouMur
                });

                fenetre.setCouleurs(
                    document.getElementById('nf-cadre').value,
                    document.getElementById('nf-vitre').value,
                    parseFloat(document.getElementById('nf-opacite').value) / 100
                );
                fenetre.creer(mod.id, fenetreWx, fenetreWz, fenetreY, mod.largeur, mod.hauteur, fenetreAngle * 180 / Math.PI);

                // Couper les placos et laines traverses par la fenetre
                _couperPlacosLainesParPorte(el, Math.max(0, tx), Math.max(0, ty), mod.largeur, mod.hauteur, trouMur);

                document.getElementById('info-bar').textContent = 'Fenetre posee ! Cliquez pour en poser une autre | Echap = quitter';
            }
        }
        return;
    }

    // Mode trou rapide : clic pour percer
    if (modeTrouRapide && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        if (survolInfo && survolInfo.element) {
            var rect = sceneManager.renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, sceneManager.camera);
            var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
            var resT = _chercherMurTraversant(intersects, ghostTrou);
            var hit = resT.hit;
            if (hit) {
                var el = survolInfo.element;
                var pos = editeur.trouverPositionSurMur(el, hit.x, hit.z);
                var largeur = parseFloat(document.getElementById('tr-largeur').value) || 0.9;
                var hauteur = parseFloat(document.getElementById('tr-hauteur').value) || 2.1;
                var trouY = parseFloat(document.getElementById('tr-y').value) || 0;
                var align = document.getElementById('tr-align').value;

                if (trouRapideForme === 'rond') {
                    largeur = Math.max(largeur, hauteur);
                    hauteur = largeur;
                }
                var trou = { largeur: largeur, hauteur: hauteur, y: trouY, mur: pos.mur };
                if (trouRapideForme && trouRapideForme !== 'rect') trou.forme = trouRapideForme;
                if (align === 'click') {
                    trou.x = Math.max(0, pos.localX - largeur / 2);
                } else {
                    trou.alignement = align;
                }

                editeur.sauvegarderEtat();
                // Calculer la position monde du centre du trou
                var elParams = el.params;
                var elAngle = elParams.angle || 0;
                var elRad = elAngle * Math.PI / 180;
                var elOx = elParams.x || 0;
                var elOz = elParams.z || 0;
                var trouCentreLocal = (trou.x || 0) + largeur / 2;
                var trouWx = elOx + Math.cos(elRad) * trouCentreLocal;
                var trouWz = elOz + Math.sin(elRad) * trouCentreLocal;

                restaurerSurlignage();
                survolInfo = null;

                if (trouRapideForme === 'rond') {
                    editeur.ajouterTrouRond(el.id, trou);
                } else {
                    editeur.ajouterTrouElement(el.id, trou);
                }

                // Couper les placos et laines traverses par le trou
                var trouXFinal = trou.x !== undefined ? trou.x : Math.max(0, pos.localX - largeur / 2);
                _couperPlacosLainesParPorte(el, trouXFinal, trouY, largeur, hauteur, pos.mur);

                document.getElementById('info-bar').textContent = 'Trou perce ! Cliquez sur un autre mur ou Echap = quitter';
            }
        }
        return;
    }

    // Mode mesure : clic pour poser un point
    if (modeMesure && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, sceneManager.camera);

        // Chercher un point sur une brique d'abord
        var mx, my, mz, surBrique = false;
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);
        for (var i = 0; i < intersects.length; i++) {
            var info = trouverElementParObjet(intersects[i].object);
            if (info) {
                mx = intersects[i].point.x;
                my = intersects[i].point.y;
                mz = intersects[i].point.z;
                surBrique = true;
                break;
            }
        }
        if (!surBrique) {
            var result = raycaster.ray.intersectPlane(planSol, pointSol);
            if (!result) return;
            mx = pointSol.x; my = 0.05; mz = pointSol.z;
        }
        mx = snapGrille(mx) || mx;
        mz = snapGrille(mz) || mz;

        if (!mesurePoint1) {
            // 1er point
            mesurePoint1 = { x: mx, y: my, z: mz };
            mesureSphere1 = creerSphere(mx, my, mz, surBrique ? '#ff8800' : '#00ccff');
            document.getElementById('info-bar').textContent = 'MESURE — Point A pose' + (surBrique ? ' [brique]' : ' [sol]') + ' | Cliquez pour le point B';
        } else {
            // 2e point — finaliser la sphere, ajouter a la liste
            if (mesureSphere2) { sceneManager.scene.remove(mesureSphere2); mesureSphere2.geometry.dispose(); mesureSphere2.material.dispose(); }
            mesureSphere2 = creerSphere(mx, my, mz, surBrique ? '#ff8800' : '#00ccff');
            majLigneMesure(mesurePoint1.x, mesurePoint1.y, mesurePoint1.z, mx, my, mz);
            var ddx = mx - mesurePoint1.x;
            var ddy = my - mesurePoint1.y;
            var ddz = mz - mesurePoint1.z;
            var dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
            var distH = Math.sqrt(ddx * ddx + ddz * ddz);
            ajouterMesureListe(mesurePoint1, {x: mx, y: my, z: mz}, dist, distH, Math.abs(ddy));
            var txt = 'MESURE — ' + dist.toFixed(2) + 'm';
            if (Math.abs(ddy) > 0.01) txt += ' (horiz: ' + distH.toFixed(2) + 'm, vert: ' + Math.abs(ddy).toFixed(2) + 'm)';
            txt += ' | Cliquez pour une nouvelle mesure | Echap = quitter';
            document.getElementById('info-bar').textContent = txt;
            // Reset pour la prochaine mesure, les objets 3D sont maintenant geres par la liste
            mesurePoint1 = null;
            mesureSphere1 = null;
            mesureSphere2 = null;
            mesureLigne = null;
        }
        return;
    }

    // Mode agrandir proportionnel : clic pour valider
    if (redimProp && redimPropElement && e.button === 0) {
        restaurerSurlignage();
        var finalDist = redimPropElement.params.distance;
        // Nettoyer les _propOrigX
        if (redimPropElement.params.trous) {
            for (var ti = 0; ti < redimPropElement.params.trous.length; ti++) {
                delete redimPropElement.params.trous[ti]._propOrigX;
            }
        }
        // Realigner les fenetres/portes sur les trous
        editeur.realignerExclusions();
        redimProp = false;
        redimPropElement = null;
        redimPropExclusions = [];
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Carre agrandi a ' + finalDist.toFixed(2) + 'm par cote !';
        return;
    }




    // Mode agrandir perpendiculaire : clic pour valider et grouper
    if (redimPerp && redimPerpNewEl && redimPerpElement && e.button === 0) {
        restaurerSurlignage();
        editeur._reconstruire(redimPerpNewEl);
        var grpP = redimPerpNewEl.group || redimPerpNewEl.brique.group;
        grpP.visible = true;
        // Grouper les 2 murs
        var ids = [redimPerpElement.id, redimPerpNewEl.id];
        editeur.grouperElements(ids);
        if (redimPerpGhost) { sceneManager.scene.remove(redimPerpGhost); redimPerpGhost = null; }
        redimPerp = false;
        redimPerpElement = null;
        redimPerpNewEl = null;
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Mur perpendiculaire cree et groupe !';
        return;
    }

    // Mode deplacer vertical : clic pour valider
    if (modeDeplacerVertical && deplacerVElement && e.button === 0) {
        restaurerSurlignage();
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Mur deplace a Y=' + (deplacerVElement.params.y || 0).toFixed(2) + 'm !';
        return;
    }

    // Mode deplacer horizontal : clic pour valider
    if (modeDeplacerHorizontal && deplacerHElement && e.button === 0) {
        restaurerSurlignage();
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Mur deplace !';
        return;
    }

    // Mode redimensionnement : clic pour valider
    if (modeRedim && redimElement && e.button === 0) {
        // Nettoyer les _origX temporaires des trous
        if (redimElement.params.trous) {
            for (var ti = 0; ti < redimElement.params.trous.length; ti++) {
                delete redimElement.params.trous[ti]._origX;
            }
        }
        restaurerSurlignage();
        editeur.realignerExclusions();
        modeRedim = false;
        redimElement = null;
        redimCote = null;
        toutDesactiver();
        document.getElementById('info-bar').textContent = 'Mur redimensionne !';
        return;
    }

    // Mode degrouper : clic pour degrouper
    if (modeDegrouper && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        if (survolInfo && survolInfo.element && survolInfo.element.params.groupeId) {
            editeur.sauvegarderEtat();
            editeur.degrouperGroupe(survolInfo.element.params.groupeId);
            restaurerSurlignage();
            survolElement = null;
            survolInfo = null;
            document.getElementById('info-bar').textContent = 'Groupe separe ! | MODE DEGROUPER — Cliquez sur un autre groupe ou Echap';
        }
        return;
    }

    // Mode grouper : clic pour ajouter/retirer un mur de la selection
    if (modeGrouper && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        if (survolInfo && survolInfo.element) {
            var elId = survolInfo.element.id;
            var idx = grouperSelection.indexOf(elId);
            if (idx !== -1) {
                // Deja selectionne : retirer
                grouperSelection.splice(idx, 1);
            } else {
                grouperSelection.push(elId);
            }
            // Actualiser le surlignage
            restaurerSurlignage();
            survolElement = null;
            for (var k = 0; k < grouperSelection.length; k++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id === grouperSelection[k]) {
                        surlignerGroupe(editeur.elements[j].group || editeur.elements[j].brique.group, '#43B047');
                    }
                }
            }
            document.getElementById('info-bar').textContent = 'GROUPER — ' + grouperSelection.length + ' mur(s) selectionne(s) | Entree = valider | Echap = annuler';
        }
        return;
    }

    // Mode edition : clic pour selectionner un mur a editer
    if (modeEdition && e.button === 0 && !editionElement) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return;

        if (survolInfo && survolInfo.element) {
            restaurerSurlignage();
            surlignerGroupe(survolInfo.group, '#ffa500');
            ouvrirEdition(survolInfo.element);
            document.getElementById('info-bar').textContent = 'EDITION — Modifiez les parametres puis cliquez Appliquer | Echap = annuler';
        }
        return;
    }

    // Mode deplacement : clic pour selectionner ou clic pour poser
    if (modeDeplacement && e.button === 0) {
        var dx = Math.abs(e.clientX - mouseDownPos.x);
        var dy = Math.abs(e.clientY - mouseDownPos.y);
        if (dx > 5 || dy > 5) return; // ignorer drag camera

        if (deplacementSelectionne && deplacementGroupes3D.length > 0) {
            // 2e clic : poser le(s) mur(s) a la nouvelle position
            var deltaX = deplacementGroupes3D[0].position.x;
            var deltaZ = deplacementGroupes3D[0].position.z;
            // Remettre les positions visuelles a zero
            for (var g = 0; g < deplacementGroupes3D.length; g++) {
                deplacementGroupes3D[g].position.x = 0;
                deplacementGroupes3D[g].position.z = 0;
            }
            editeur.sauvegarderEtat();
            // Deplacer les exclusions definitivement
            for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                var de = deplacerExclusions[ei];
                de.excl.x = de.origX + deltaX;
                de.excl.z = de.origZ + deltaZ;
                if (de.excl.group3D) {
                    de.excl.group3D.position.x = de.excl.x;
                    de.excl.group3D.position.z = de.excl.z;
                }
            }
            deplacerExclusions = [];
            // Deplacer les placos definitivement
            for (var pi = 0; pi < deplacerMurPlacos.length; pi++) {
                var dp = deplacerMurPlacos[pi];
                dp.ref.userData.placoInfo.worldX = dp.origX + deltaX;
                dp.ref.userData.placoInfo.worldZ = dp.origZ + deltaZ;
                dp.ref.position.x = dp.origPosX + deltaX;
                dp.ref.position.z = dp.origPosZ + deltaZ;
            }
            deplacerMurPlacos = [];
            // Deplacer les laines definitivement
            for (var li = 0; li < deplacerMurLaines.length; li++) {
                var dl = deplacerMurLaines[li];
                dl.ref.userData.laineInfo.worldX = dl.origX + deltaX;
                dl.ref.userData.laineInfo.worldZ = dl.origZ + deltaZ;
                dl.ref.position.x = dl.origPosX + deltaX;
                dl.ref.position.z = dl.origPosZ + deltaZ;
            }
            deplacerMurLaines = [];
            editeur.deplacerGroupe(deplacementGroupeIds, deltaX, deltaZ);
            deplacementSelectionne = false;
            deplacementElement = null;
            deplacementGroup = null;
            deplacementGroupeIds = [];
            deplacementGroupes3D = [];
            sceneManager.controls.enabled = true;
            container.style.cursor = 'crosshair';
            document.getElementById('info-bar').textContent = 'MODE DEPLACEMENT — Cliquez sur un mur pour le selectionner | Echap = annuler';
        } else if (survolInfo && survolInfo.element) {
            // 1er clic : selectionner le mur (et son groupe si existe)
            var el = survolInfo.element;
            deplacementElement = el;
            deplacementGroupeIds = editeur.trouverGroupe(el.id);
            deplacementGroupes3D = [];
            deplacementOrigX = el.params.x || 0;
            deplacementOrigZ = el.params.z || 0;
            // Surligner et collecter tous les groupes 3D
            for (var g = 0; g < deplacementGroupeIds.length; g++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id === deplacementGroupeIds[g]) {
                        var gr = editeur.elements[j].group || editeur.elements[j].brique.group;
                        deplacementGroupes3D.push(gr);
                        surlignerGroupe(gr, '#00ff88');
                    }
                }
            }
            deplacementGroup = deplacementGroupes3D[0];
            deplacementSelectionne = true;
            // Collecter les exclusions de tous les murs du groupe
            deplacerExclusions = [];
            for (var g = 0; g < deplacementGroupeIds.length; g++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id === deplacementGroupeIds[g]) {
                        var excls = trouverExclusionsMur(editeur.elements[j]);
                        for (var ei = 0; ei < excls.length; ei++) {
                            // Eviter les doublons
                            var existe = false;
                            for (var di = 0; di < deplacerExclusions.length; di++) {
                                if (deplacerExclusions[di].excl === excls[ei]) { existe = true; break; }
                            }
                            if (!existe) {
                                deplacerExclusions.push({ excl: excls[ei], origX: excls[ei].x, origZ: excls[ei].z, origY: excls[ei].y });
                            }
                        }
                    }
                }
            }
            console.log('Deplacement : ' + deplacerExclusions.length + ' exclusion(s) collectee(s)');
            console.log('Total exclusions dans editeur : ' + editeur.exclusions.length);
            for (var dbg = 0; dbg < editeur.exclusions.length; dbg++) {
                var dbgEx = editeur.exclusions[dbg];
                console.log('  excl ' + dbg + ' : x=' + dbgEx.x.toFixed(2) + ' z=' + dbgEx.z.toFixed(2) + ' group3D=' + (dbgEx.group3D ? 'OUI' : 'NON'));
            }
            for (var dbg = 0; dbg < deplacementGroupeIds.length; dbg++) {
                for (var dbj = 0; dbj < editeur.elements.length; dbj++) {
                    if (editeur.elements[dbj].id === deplacementGroupeIds[dbg]) {
                        var dbSegs = editeur._segments(editeur.elements[dbj].params);
                        for (var dbs = 0; dbs < dbSegs.length; dbs++) {
                            console.log('  seg ' + dbs + ' : (' + dbSegs[dbs].x1.toFixed(2) + ',' + dbSegs[dbs].z1.toFixed(2) + ') -> (' + dbSegs[dbs].x2.toFixed(2) + ',' + dbSegs[dbs].z2.toFixed(2) + ')');
                        }
                    }
                }
            }
            // Collecter les placos et laines lies aux murs deplaces
            deplacerMurPlacos = [];
            deplacerMurLaines = [];
            for (var g = 0; g < deplacementGroupeIds.length; g++) {
                for (var j = 0; j < editeur.elements.length; j++) {
                    if (editeur.elements[j].id !== deplacementGroupeIds[g]) continue;
                    var mp = editeur.elements[j].params;
                    var mSegs = editeur._segments(mp);
                    var mAngle = mp.angle || mp.angleDepart || 0;
                    // Trouver les placos sur ce mur
                    for (var pi = 0; pi < placoElements.length; pi++) {
                        var pInfo = placoElements[pi].userData.placoInfo;
                        if (!pInfo) continue;
                        if (Math.abs(pInfo.angle - mAngle) < 1) {
                            var proche = false;
                            for (var si = 0; si < mSegs.length; si++) {
                                var cx = (mSegs[si].x1 + mSegs[si].x2) / 2;
                                var cz = (mSegs[si].z1 + mSegs[si].z2) / 2;
                                var dx = Math.abs(pInfo.worldX - cx);
                                var dz = Math.abs(pInfo.worldZ - cz);
                                if (dx < mp.distance + 0.5 && dz < mp.distance + 0.5) { proche = true; break; }
                            }
                            if (proche) {
                                deplacerMurPlacos.push({ ref: placoElements[pi], origX: pInfo.worldX, origZ: pInfo.worldZ, origPosX: placoElements[pi].position.x, origPosZ: placoElements[pi].position.z });
                            }
                        }
                    }
                    // Trouver les laines sur ce mur
                    for (var li = 0; li < laineElements.length; li++) {
                        var lInfo = laineElements[li].userData.laineInfo;
                        if (!lInfo) continue;
                        if (Math.abs(lInfo.angle - mAngle) < 1) {
                            var proche = false;
                            for (var si = 0; si < mSegs.length; si++) {
                                var cx = (mSegs[si].x1 + mSegs[si].x2) / 2;
                                var cz = (mSegs[si].z1 + mSegs[si].z2) / 2;
                                var dx = Math.abs(lInfo.worldX - cx);
                                var dz = Math.abs(lInfo.worldZ - cz);
                                if (dx < mp.distance + 0.5 && dz < mp.distance + 0.5) { proche = true; break; }
                            }
                            if (proche) {
                                deplacerMurLaines.push({ ref: laineElements[li], origX: lInfo.worldX, origZ: lInfo.worldZ, origPosX: laineElements[li].position.x, origPosZ: laineElements[li].position.z });
                            }
                        }
                    }
                }
            }

            container.style.cursor = 'crosshair';
            var txt = deplacementGroupeIds.length > 1 ? ' (' + deplacementGroupeIds.length + ' murs groupes)' : '';
            document.getElementById('info-bar').textContent = 'DEPLACEMENT' + txt + ' — Cliquez pour poser | R/L = pivoter | Echap = annuler';
            document.getElementById('rotation-bar').style.display = 'block';
        }
        return;
    }

    // Ignorer clic droit (orbite camera)
    if (e.button !== 0) return;
    var dx = Math.abs(e.clientX - mouseDownPos.x);
    var dy = Math.abs(e.clientY - mouseDownPos.y);
    var isDrag = (dx > 5 || dy > 5);
    if (isDrag) return;

    // Skip si mode revetement (papier peint, carrelage, plinthe) — gere par listener dedie
    if (modePapierPeint || modeCarrelage || modePlinthe || modeCarrelageSol) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // --- MODE TROU (2 etapes : X puis Y) ---
    if (modeTrou) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);

        if (trouEtape === 0) {
            // Etape 0 : clic sur le mur = valider la position X
            for (var i = 0; i < intersects.length; i++) {
                if (ghostTrou && intersects[i].object === ghostTrou) continue;
                var info = trouverElementParObjet(intersects[i].object);
                if (info && info.type === 'editeur' && info.element) {
                    var hit = intersects[i].point;
                    trouMurElement = info.element;
                    trouHitPoint = hit;
                    var pos = editeur.trouverPositionSurMur(trouMurElement, hit.x, hit.z);
                    trouLocalX = pos.localX;
                    trouMurIndex = pos.mur;

                    // Dessiner une ligne verticale a cette position X
                    var segs = editeur._segments(trouMurElement.params);
                    var seg = segs[trouMurIndex] || segs[0];
                    var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
                    var slen = Math.sqrt(sdx * sdx + sdz * sdz);
                    var snx = sdx / slen, snz = sdz / slen;
                    var lx = seg.x1 + snx * trouLocalX;
                    var lz = seg.z1 + snz * trouLocalX;
                    if (trouLigneV) { sceneManager.scene.remove(trouLigneV); trouLigneV.geometry.dispose(); trouLigneV.material.dispose(); }
                    var lgeo = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(lx, 0, lz),
                        new THREE.Vector3(lx, (trouMurElement.params.hauteur || 2.5), lz)
                    ]);
                    var lmat = new THREE.LineBasicMaterial({ color: '#ff0000' });
                    trouLigneV = new THREE.Line(lgeo, lmat);
                    sceneManager.scene.add(trouLigneV);

                    trouEtape = 1;
                    document.getElementById('info-bar').textContent = 'TROU — X: ' + trouLocalX.toFixed(2) + 'm valide | Bougez pour choisir la hauteur Y | Cliquez pour percer';
                    break;
                }
            }
        } else if (trouEtape === 1) {
            // Etape 1 : clic = valider Y et percer le trou
            var largeur = parseFloat(document.getElementById('f-trou-largeur').value) || 0.9;
            var hauteur = parseFloat(document.getElementById('f-trou-hauteur').value) || 2.1;
            var trouY = parseFloat(document.getElementById('f-trou-y').value) || 0;

            var trou = {
                largeur: largeur,
                hauteur: hauteur,
                y: trouY,
                mur: trouMurIndex,
                x: Math.max(0, trouLocalX - largeur / 2)
            };

            restaurerSurlignage();
            survolInfo = null;
            if (trouLigneV) { sceneManager.scene.remove(trouLigneV); trouLigneV.geometry.dispose(); trouLigneV.material.dispose(); trouLigneV = null; }

            editeur.sauvegarderEtat();
            editeur.ajouterTrouElement(trouMurElement.id, trou);

            // Couper les placos et laines
            _couperPlacosLainesParPorte(trouMurElement, trou.x, trouY, largeur, hauteur, trouMurIndex);

            // Reset pour un nouveau trou
            trouEtape = 0;
            trouMurElement = null;
            document.getElementById('info-bar').textContent = 'TROU — Trou perce ! Cliquez sur un mur pour la position X | Echap = quitter';
        }
        return;
    }

    // --- MODE SUPPRESSION ---
    if (modeSuppression) {
        if (survolInfo) {
            var info = survolInfo;
            restaurerSurlignage();
            survolInfo = null;

            if (info.type === 'editeur' && info.element) {
                editeur.sauvegarderEtat();
                editeur.supprimer(info.element.id);
            }
        }
        return;
    }

    // --- MENU CONTEXTUEL (aucun mode actif) ---
    if (!modePlacement) {
        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);

        // Priorite : Porte > Fenetre > Personnage > Placo > Laine > Mur
        // On parcourt les intersections UNE SEULE fois et on prend le premier element trouve
        var ctxHandled = false;
        for (var i = 0; i < intersects.length && !ctxHandled; i++) {
            var ud = intersects[i].object.userData;
            if (!ud) continue;

            // 1. Porte (priorite haute)
            if (ud.isPorte) {
                var obj = intersects[i].object;
                while (obj && !obj.userData.exclusionId) obj = obj.parent;
                if (obj && obj.userData.exclusionId) {
                    window._ctxPorteGroup = obj;
                    var pmenu = document.getElementById('ctx-porte-menu');
                    pmenu.style.left = e.clientX + 'px';
                    pmenu.style.top = e.clientY + 'px';
                    pmenu.style.display = 'block';
                    var pmr = pmenu.getBoundingClientRect();
                    if (pmr.right > window.innerWidth) pmenu.style.left = (window.innerWidth - pmr.width - 5) + 'px';
                    if (pmr.bottom > window.innerHeight) pmenu.style.top = (window.innerHeight - pmr.height - 5) + 'px';
                    ctxHandled = true;
                }
                continue;
            }

            // 2. Fenetre
            if (ud.isFenetre) {
                var obj = intersects[i].object;
                while (obj && !obj.userData.exclusionId) obj = obj.parent;
                if (obj && obj.userData.exclusionId) {
                    window._clickedExclusionId = obj.userData.exclusionId;
                    var fmenu = document.getElementById('ctx-fenetre-menu');
                    fmenu.style.left = e.clientX + 'px';
                    fmenu.style.top = e.clientY + 'px';
                    fmenu.style.display = 'block';
                    var fmr = fmenu.getBoundingClientRect();
                    if (fmr.right > window.innerWidth) fmenu.style.left = (window.innerWidth - fmr.width - 5) + 'px';
                    if (fmr.bottom > window.innerHeight) fmenu.style.top = (window.innerHeight - fmr.height - 5) + 'px';
                    ctxHandled = true;
                }
                continue;
            }

            // 3. Personnage
            if (ud.isPersonnage) {
                var obj = intersects[i].object;
                while (obj.parent && obj.parent !== sceneManager.scene) obj = obj.parent;
                window._ctxPersoGroup = obj;
                var pmenu = document.getElementById('ctx-perso-menu');
                pmenu.style.left = e.clientX + 'px';
                pmenu.style.top = e.clientY + 'px';
                pmenu.style.display = 'block';
                var pmr = pmenu.getBoundingClientRect();
                if (pmr.right > window.innerWidth) pmenu.style.left = (window.innerWidth - pmr.width - 5) + 'px';
                if (pmr.bottom > window.innerHeight) pmenu.style.top = (window.innerHeight - pmr.height - 5) + 'px';
                ctxHandled = true;
                continue;
            }

            // 3b. Plafond
            if (ud.isPlafond) {
                var obj = intersects[i].object;
                while (obj.parent && obj.parent !== sceneManager.scene) obj = obj.parent;
                window._ctxPlafondGroup = obj;
                var pfmenu = document.getElementById('ctx-plafond-menu');
                pfmenu.style.left = e.clientX + 'px';
                pfmenu.style.top = e.clientY + 'px';
                pfmenu.style.display = 'block';
                var pfmr = pfmenu.getBoundingClientRect();
                if (pfmr.right > window.innerWidth) pfmenu.style.left = (window.innerWidth - pfmr.width - 5) + 'px';
                if (pfmr.bottom > window.innerHeight) pfmenu.style.top = (window.innerHeight - pfmr.height - 5) + 'px';
                ctxHandled = true;
                continue;
            }

            // 3c. Escalier
            if (ud.isEscalier) {
                var obj = intersects[i].object;
                while (obj.parent && obj.parent !== sceneManager.scene) obj = obj.parent;
                window._ctxEscalierGroup = obj;
                var emenu = document.getElementById('ctx-escalier-menu');
                emenu.style.left = e.clientX + 'px';
                emenu.style.top = e.clientY + 'px';
                emenu.style.display = 'block';
                var emr = emenu.getBoundingClientRect();
                if (emr.right > window.innerWidth) emenu.style.left = (window.innerWidth - emr.width - 5) + 'px';
                if (emr.bottom > window.innerHeight) emenu.style.top = (window.innerHeight - emr.height - 5) + 'px';
                ctxHandled = true;
                continue;
            }

            // 4. Placo — trouver le bon groupe dans placoElements
            if (ud.isPlaco) {
                var obj = intersects[i].object;
                var foundPlaco = null;
                for (var pi = 0; pi < placoElements.length; pi++) {
                    var pg = placoElements[pi];
                    var mesh = obj;
                    while (mesh) {
                        if (mesh === pg) { foundPlaco = pg; break; }
                        mesh = mesh.parent;
                    }
                    if (foundPlaco) break;
                }
                if (!foundPlaco) {
                    // Fallback : remonter au parent direct de la scene
                    foundPlaco = obj;
                    while (foundPlaco.parent && foundPlaco.parent !== sceneManager.scene) foundPlaco = foundPlaco.parent;
                }
                window._ctxPlacoGroup = foundPlaco;
                window._ctxPlacoGroupes = [foundPlaco];

                var pmenu = document.getElementById('ctx-placo-menu');
                pmenu.style.left = e.clientX + 'px';
                pmenu.style.top = e.clientY + 'px';
                pmenu.style.display = 'block';
                var pmr = pmenu.getBoundingClientRect();
                if (pmr.right > window.innerWidth) pmenu.style.left = (window.innerWidth - pmr.width - 5) + 'px';
                if (pmr.bottom > window.innerHeight) pmenu.style.top = (window.innerHeight - pmr.height - 5) + 'px';
                ctxHandled = true;
                continue;
            }

            // 5. Laine de verre — trouver le bon groupe dans laineElements
            if (ud.isLaine) {
                var obj = intersects[i].object;
                var foundLaine = null;
                for (var li = 0; li < laineElements.length; li++) {
                    var lg = laineElements[li];
                    var mesh = obj;
                    while (mesh) {
                        if (mesh === lg) { foundLaine = lg; break; }
                        mesh = mesh.parent;
                    }
                    if (foundLaine) break;
                }
                if (!foundLaine) {
                    foundLaine = obj;
                    while (foundLaine.parent && foundLaine.parent !== sceneManager.scene) foundLaine = foundLaine.parent;
                }
                window._ctxLaineGroup = foundLaine;
                var lmenu = document.getElementById('ctx-laine-menu');
                lmenu.style.left = e.clientX + 'px';
                lmenu.style.top = e.clientY + 'px';
                lmenu.style.display = 'block';
                var lmr = lmenu.getBoundingClientRect();
                if (lmr.right > window.innerWidth) lmenu.style.left = (window.innerWidth - lmr.width - 5) + 'px';
                if (lmr.bottom > window.innerHeight) lmenu.style.top = (window.innerHeight - lmr.height - 5) + 'px';
                ctxHandled = true;
                continue;
            }

            // 6. Mur (via editeurId)
            if (ud.editeurId !== undefined) {
                break; // sortir de la boucle pour tomber dans le code mur ci-dessous
            }
        }

        if (ctxHandled) return;

        // Mur : chercher l'element editeur
        {
            var found = null;
            for (var i = 0; i < intersects.length; i++) {
                found = trouverElementParObjet(intersects[i].object);
                if (found) break;
            }
            if (found && found.element) {
                ctxElement = found.element;
                var menu = document.getElementById('ctx-menu');
                document.getElementById('ctx-degrouper').style.display = ctxElement.params.groupeId ? 'flex' : 'none';
                var isMultiCtx = ctxElement.params.nbCotes && ctxElement.params.nbCotes > 1;
                document.getElementById('ctx-agrandir-prop').style.display = isMultiCtx ? 'flex' : 'none';
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
                menu.style.display = 'block';
                var mr = menu.getBoundingClientRect();
                if (mr.right > window.innerWidth) menu.style.left = (window.innerWidth - mr.width - 5) + 'px';
                if (mr.bottom > window.innerHeight) menu.style.top = (window.innerHeight - mr.height - 5) + 'px';
            }
        }
        return;
    }

    raycaster.setFromCamera(mouse, sceneManager.camera);
    raycaster.ray.intersectPlane(planSol, pointSol);

    if (pointSol) {
        var sx = snapGrille(pointSol.x);
        var sz = snapGrille(pointSol.z);

        var params = lireParams();
        params.x = sx;
        params.y = 0;
        params.z = sz;

        editeur.sauvegarderEtat();
        editeur.ajouterMur(params);

        dernierX = sx;
        dernierZ = sz;

        creerGhost();
    }
});

// Escape + Ctrl+Z + rotation pendant deplacement (R = +15°, L = -15°)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Si agrandir proportionnel en cours, annuler
        if (redimProp && redimPropElement) {
            redimPropElement.params.distance = redimPropOrigDist;
            // Restaurer les trous
            if (redimPropElement.params.trous) {
                for (var ti = 0; ti < redimPropElement.params.trous.length; ti++) {
                    var tr = redimPropElement.params.trous[ti];
                    if (tr._propOrigX !== undefined) { tr.x = tr._propOrigX; delete tr._propOrigX; }
                }
            }
            editeur._reconstruire(redimPropElement);
            // Restaurer les exclusions
            for (var ei = 0; ei < redimPropExclusions.length; ei++) {
                var re = redimPropExclusions[ei];
                re.excl.x = re.origX;
                re.excl.z = re.origZ;
                if (re.excl.group3D) {
                    re.excl.group3D.position.x = re.origX;
                    re.excl.group3D.position.z = re.origZ;
                }
            }
            redimProp = false;
            redimPropElement = null;
            redimPropExclusions = [];
        }
        // Si agrandir perpendiculaire en cours, annuler
        if (redimPerp && redimPerpNewEl) {
            editeur.supprimer(redimPerpNewEl.id);
            if (redimPerpGhost) { sceneManager.scene.remove(redimPerpGhost); redimPerpGhost = null; }
            redimPerp = false;
            redimPerpElement = null;
            redimPerpNewEl = null;
        }
        // Si deplacer vertical en cours, annuler
        if (modeDeplacerVertical && deplacerVElement) {
            deplacerVElement.params.y = deplacerVOrigY;
            editeur._reconstruire(deplacerVElement);
            // Restaurer les exclusions
            for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                var de = deplacerExclusions[ei];
                de.excl.y = de.origY;
                if (de.excl.group3D) de.excl.group3D.position.y = de.origY;
            }
            deplacerExclusions = [];
            modeDeplacerVertical = false;
            deplacerVElement = null;
        }
        // Si deplacer horizontal en cours, annuler
        if (modeDeplacerHorizontal && deplacerHElement) {
            deplacerHElement.params.x = deplacerHOrigX;
            deplacerHElement.params.z = deplacerHOrigZ;
            editeur._reconstruire(deplacerHElement);
            // Restaurer les exclusions
            for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                var de = deplacerExclusions[ei];
                de.excl.x = de.origX;
                de.excl.z = de.origZ;
                if (de.excl.group3D) {
                    de.excl.group3D.position.x = de.origX;
                    de.excl.group3D.position.z = de.origZ;
                }
            }
            deplacerExclusions = [];
            modeDeplacerHorizontal = false;
            deplacerHElement = null;
        }
        // Si redimensionnement en cours, annuler
        if (modeRedim && redimElement) {
            editeur.annuler();
            modeRedim = false;
            redimElement = null;
        }
        // Si deplacement en cours, remettre les murs a leur position d'origine
        if (modeDeplacement && deplacementSelectionne && deplacementGroupes3D.length > 0) {
            for (var g = 0; g < deplacementGroupes3D.length; g++) {
                deplacementGroupes3D[g].position.x = 0;
                deplacementGroupes3D[g].position.z = 0;
            }
            // Restaurer les exclusions
            for (var ei = 0; ei < deplacerExclusions.length; ei++) {
                var de = deplacerExclusions[ei];
                if (de.excl.group3D) {
                    de.excl.group3D.position.x = de.origX;
                    de.excl.group3D.position.z = de.origZ;
                }
            }
            deplacerExclusions = [];
        }
        // Si deplacement placo en cours, restaurer
        if (modeDeplacerPlaco && deplacerPlacoGroup) {
            deplacerPlacoGroup.visible = true;
        }
        // Si deplacement laine en cours, restaurer
        if (modeDeplacerLaine && deplacerLaineGroup) {
            deplacerLaineGroup.visible = true;
        }
        // Si copie zone en cours, annuler
        if (modeCopierZone && copierZonePhase === 'place') {
            if (window._copierZoneGhosts) {
                for (var gi = 0; gi < window._copierZoneGhosts.length; gi++) {
                    sceneManager.scene.remove(window._copierZoneGhosts[gi]);
                }
                window._copierZoneGhosts = null;
            }
            copierZoneData = null;
        }
        // Si deplacement zone en cours, annuler et restaurer positions
        if (modeDeplacerZone && deplacerZonePhase === 'move' && deplacerZoneElements.length > 0) {
            for (var dzi = 0; dzi < deplacerZoneElements.length; dzi++) {
                var dze = deplacerZoneElements[dzi];
                if (dze.type === 'mur') {
                    dze.ref.params.x = dze.origX;
                    dze.ref.params.z = dze.origZ;
                    editeur._reconstruire(dze.ref);
                } else if (dze.type === 'exclusion') {
                    dze.ref.x = dze.origX;
                    dze.ref.z = dze.origZ;
                    if (dze.ref.group3D) {
                        dze.ref.group3D.position.x = dze.ref.x;
                        dze.ref.group3D.position.z = dze.ref.z;
                    }
                } else if (dze.type === 'placo') {
                    dze.ref.userData.placoInfo.worldX = dze.origX;
                    dze.ref.userData.placoInfo.worldZ = dze.origZ;
                    dze.ref.position.x = dze.origPosX;
                    dze.ref.position.z = dze.origPosZ;
                } else if (dze.type === 'laine') {
                    dze.ref.userData.laineInfo.worldX = dze.origX;
                    dze.ref.userData.laineInfo.worldZ = dze.origZ;
                    dze.ref.position.x = dze.origPosX;
                    dze.ref.position.z = dze.origPosZ;
                } else if (dze.type === 'personnage') {
                    dze.ref.position.x = dze.origPosX;
                    dze.ref.position.z = dze.origPosZ;
                }
            }
            deplacerZoneElements = [];
        }
        // Si agrandir plaque en cours, restaurer la taille originale
        if (modeAgrandirPlaque && agrandirPlaqueGroup && agrandirPlaqueInfo) {
            var inf = agrandirPlaqueInfo;
            inf.largeur = agrandirPlaqueOrigL;
            inf.worldX = agrandirPlaqueOrigWX;
            inf.worldZ = agrandirPlaqueOrigWZ;
            var tag = agrandirPlaqueType === 'placo' ? 'placoInfo' : 'laineInfo';
            agrandirPlaqueGroup.userData[tag].largeur = agrandirPlaqueOrigL;
            agrandirPlaqueGroup.userData[tag].worldX = agrandirPlaqueOrigWX;
            agrandirPlaqueGroup.userData[tag].worldZ = agrandirPlaqueOrigWZ;
            // Reconstruire a la taille originale (simuler un pointermove)
            // On supprime et recree
            var arr = agrandirPlaqueType === 'placo' ? placoElements : laineElements;
            var idx = arr.indexOf(agrandirPlaqueGroup);
            sceneManager.scene.remove(agrandirPlaqueGroup);
            var newG;
            if (agrandirPlaqueType === 'placo') {
                var cols = Placo.lireCouleurs(agrandirPlaqueGroup);
                placo.setCouleurs(cols.placo, cols.opacite / 100);
                newG = placo.creer(null, agrandirPlaqueOrigWX, agrandirPlaqueOrigWZ, inf.y, agrandirPlaqueOrigL, inf.hauteur, inf.angle, inf.ep, inf.side, inf.murEpFull, inf.extraBack || 0);
            } else {
                var cols = LaineDeVerre.lireCouleurs(agrandirPlaqueGroup);
                laineDeVerre.setCouleurs(cols.laine, cols.opacite / 100);
                newG = laineDeVerre.creer(null, agrandirPlaqueOrigWX, agrandirPlaqueOrigWZ, inf.y, agrandirPlaqueOrigL, inf.hauteur, inf.angle, inf.ep, inf.side, inf.murEpFull);
            }
            if (idx >= 0) arr[idx] = newG;
            else arr.push(newG);
        }
        toutDesactiver();
        return;
    }

    // Ctrl+Z = annuler (marche arriere)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        toutDesactiver();
        editeur.annuler();
        return;
    }
    // Ctrl+Y = refaire (marche avant)
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        toutDesactiver();
        editeur.refaire();
        return;
    }

    // Entree = valider le groupement
    if (e.key === 'Enter' && modeGrouper) {
        e.preventDefault();
        validerGrouper();
        return;
    }

    // Rotation pendant le deplacement (touches R / L uniquement)
    if (modeDeplacement && deplacementSelectionne && deplacementGroupes3D.length > 0) {
        var delta = 0;
        if (e.key === 'r' || e.key === 'R') delta = 15;
        if (e.key === 'l' || e.key === 'L') delta = -15;
        if (delta !== 0) {
            e.preventDefault();
            rotationDeplacement(delta);
        }
    }
});

// Molette = zoom uniquement (plus de rotation par molette pendant deplacement)

// Fonction de rotation pendant le deplacement
function rotationDeplacement(delta) {
    if (!modeDeplacement || !deplacementSelectionne || deplacementGroupes3D.length === 0) return;
    var offsetX = deplacementGroupes3D[0].position.x;
    var offsetZ = deplacementGroupes3D[0].position.z;
    for (var g = 0; g < deplacementGroupes3D.length; g++) {
        deplacementGroupes3D[g].position.x = 0;
        deplacementGroupes3D[g].position.z = 0;
    }
    editeur.pivoterGroupe(deplacementGroupeIds, delta);
    deplacementGroupes3D = [];
    for (var g = 0; g < deplacementGroupeIds.length; g++) {
        for (var j = 0; j < editeur.elements.length; j++) {
            if (editeur.elements[j].id === deplacementGroupeIds[g]) {
                var gr = editeur.elements[j].group || editeur.elements[j].brique.group;
                deplacementGroupes3D.push(gr);
                gr.position.x = offsetX;
                gr.position.z = offsetZ;
                surlignerGroupe(gr, '#00ff88');
            }
        }
    }
    deplacementOrigX = deplacementElement.params.x || 0;
    deplacementOrigZ = deplacementElement.params.z || 0;
}

// Boutons de rotation visuels
document.getElementById('btn-rot-gauche').addEventListener('click', function(e) {
    e.stopPropagation();
    rotationDeplacement(-15);
});
document.getElementById('btn-rot-droite').addEventListener('click', function(e) {
    e.stopPropagation();
    rotationDeplacement(15);
});

// ========================================
// BOUTONS
// ========================================

document.getElementById('f-type').addEventListener('change', function() {
    var isCarre = this.value === 'carre';
    document.getElementById('zone-angle').style.display = isCarre ? 'none' : 'block';
    document.getElementById('zone-cotes').style.display = isCarre ? 'block' : 'none';
    if (modePlacement) creerGhost();
});

// Synchroniser distance x hauteur = surface mur + surface sol
function _majSurface() {
    var longueur = parseFloat(document.getElementById('f-distance').value) || 0;
    var h = parseFloat(document.getElementById('f-hauteur').value) || 0;
    var type = document.getElementById('f-type').value;
    var zonePiece = document.getElementById('zone-surface-piece');
    var briqueSelect = document.getElementById('f-brique-type');
    var briqueType = briqueSelect ? briqueSelect.value : 'standard';
    var bt = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[briqueType]) ? BRIQUES_TYPES[briqueType] : { epaisseur: 0.11 };
    var ep = bt.epaisseur;

    if (type === 'carre') {
        var nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;

        if (nbCotes === 4) {
            // Rectangle : longueur × largeur
            var largeur = parseFloat(document.getElementById('f-largeur').value) || longueur;
            // Surface mur = perimetre × hauteur
            var perimetre = 2 * (longueur + largeur);
            document.getElementById('f-surface').value = (perimetre * h).toFixed(2);
            // Surface sol brute
            document.getElementById('f-surface-sol').value = (longueur * largeur).toFixed(2);
            // Surface piece Carrez = (longueur - 2*ep) × (largeur - 2*ep)
            var longInt = longueur - 2 * ep;
            var largInt = largeur - 2 * ep;
            if (longInt < 0) longInt = 0;
            if (largInt < 0) largInt = 0;
            var aireInt = longInt * largInt;
            document.getElementById('f-surface-piece').value = aireInt.toFixed(2);
            document.getElementById('f-surface-piece-calcul').textContent = longInt.toFixed(2) + ' x ' + largInt.toFixed(2) + ' m';
        } else {
            // Polygone regulier
            document.getElementById('f-surface').value = (longueur * h * nbCotes).toFixed(2);
            var aireExt = (nbCotes * longueur * longueur / 4) / Math.tan(Math.PI / nbCotes);
            document.getElementById('f-surface-sol').value = aireExt.toFixed(2);
            var coteInt = longueur - 2 * ep;
            if (coteInt < 0) coteInt = 0;
            var aireInt = (nbCotes * coteInt * coteInt / 4) / Math.tan(Math.PI / nbCotes);
            document.getElementById('f-surface-piece').value = aireInt.toFixed(2);
            document.getElementById('f-surface-piece-calcul').textContent = 'cote int: ' + coteInt.toFixed(2) + ' m';
        }
        zonePiece.style.display = 'block';
    } else {
        // Mur simple
        document.getElementById('f-surface').value = (longueur * h).toFixed(2);
        zonePiece.style.display = 'none';
    }
    if (modePlacement) creerGhost();
}

document.getElementById('f-distance').addEventListener('input', function() { _majSurface(); _majSurfaceAuSolFromDims(); _majSurfaceHabitableFromDims(); });

// Quand on tape une surface au sol → recalcule longueur/largeur
document.getElementById('f-surface-au-sol').addEventListener('input', function() {
    var surfSol = parseFloat(this.value) || 0;
    if (surfSol <= 0) return;
    var type = document.getElementById('f-type').value;
    if (type === 'carre') {
        var nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;
        if (nbCotes === 4) {
            // Rectangle : garder le ratio longueur/largeur actuel, ou carré si largeur=longueur
            var longueur = parseFloat(document.getElementById('f-distance').value) || 5;
            var largeur = parseFloat(document.getElementById('f-largeur').value) || longueur;
            var ratio = largeur / longueur;
            // surfSol = L * (L * ratio) = L² * ratio → L = sqrt(surfSol / ratio)
            var newLong = Math.sqrt(surfSol / ratio);
            var newLarg = newLong * ratio;
            document.getElementById('f-distance').value = newLong.toFixed(2);
            document.getElementById('f-largeur').value = newLarg.toFixed(2);
        } else {
            // Polygone : surfSol = (n * s² / 4) / tan(π/n) → s = sqrt(surfSol * 4 * tan(π/n) / n)
            var n = nbCotes;
            var s = Math.sqrt(surfSol * 4 * Math.tan(Math.PI / n) / n);
            document.getElementById('f-distance').value = s.toFixed(2);
        }
    } else {
        // Mur simple : surface au sol = longueur × profondeur → on ajuste la longueur = sqrt(surfSol)
        var side = Math.sqrt(surfSol);
        document.getElementById('f-distance').value = side.toFixed(2);
    }
    _majSurface();
});

// Quand on tape une surface habitable → recalcule longueur/largeur (en ajoutant epaisseur murs)
document.getElementById('f-surface-habitable').addEventListener('input', function() {
    var surfHab = parseFloat(this.value) || 0;
    if (surfHab <= 0) return;
    var briqueSelect = document.getElementById('f-brique-type');
    var briqueType = briqueSelect ? briqueSelect.value : 'standard';
    var bt = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[briqueType]) ? BRIQUES_TYPES[briqueType] : { epaisseur: 0.11 };
    var ep = bt.epaisseur;
    var type = document.getElementById('f-type').value;

    if (type === 'carre') {
        var nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;
        if (nbCotes === 4) {
            var longueur = parseFloat(document.getElementById('f-distance').value) || 5;
            var largeur = parseFloat(document.getElementById('f-largeur').value) || longueur;
            var ratio = largeur / longueur;
            // surfHab = (L - 2*ep) * (L*ratio - 2*ep)
            // On resout pour L : approximation iterative simple
            var longInt = Math.sqrt(surfHab / ratio);
            var newLong = longInt + 2 * ep;
            var newLarg = longInt * ratio + 2 * ep;
            document.getElementById('f-distance').value = newLong.toFixed(2);
            document.getElementById('f-largeur').value = newLarg.toFixed(2);
        } else {
            // Polygone : surfHab = (n * coteInt² / 4) / tan(π/n) → coteInt = sqrt(...)
            var n = nbCotes;
            var coteInt = Math.sqrt(surfHab * 4 * Math.tan(Math.PI / n) / n);
            var coteExt = coteInt + 2 * ep;
            document.getElementById('f-distance').value = coteExt.toFixed(2);
        }
    } else {
        // Mur simple : surface hab = cote² → cote = sqrt(surfHab) + 2*ep
        var coteInt = Math.sqrt(surfHab);
        document.getElementById('f-distance').value = (coteInt + 2 * ep).toFixed(2);
    }
    _majSurface();
    _majSurfaceAuSolFromDims();
});

// Met a jour le champ "surface habitable" depuis les dimensions
function _majSurfaceHabitableFromDims() {
    var briqueSelect = document.getElementById('f-brique-type');
    var briqueType = briqueSelect ? briqueSelect.value : 'standard';
    var bt = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[briqueType]) ? BRIQUES_TYPES[briqueType] : { epaisseur: 0.11 };
    var ep = bt.epaisseur;
    var type = document.getElementById('f-type').value;
    var longueur = parseFloat(document.getElementById('f-distance').value) || 0;

    if (type === 'carre') {
        var nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;
        if (nbCotes === 4) {
            var largeur = parseFloat(document.getElementById('f-largeur').value) || longueur;
            var longInt = longueur - 2 * ep;
            var largInt = largeur - 2 * ep;
            if (longInt < 0) longInt = 0;
            if (largInt < 0) largInt = 0;
            document.getElementById('f-surface-habitable').value = (longInt * largInt).toFixed(2);
        } else {
            var coteInt = longueur - 2 * ep;
            if (coteInt < 0) coteInt = 0;
            var n = nbCotes;
            document.getElementById('f-surface-habitable').value = ((n * coteInt * coteInt / 4) / Math.tan(Math.PI / n)).toFixed(2);
        }
    } else {
        document.getElementById('f-surface-habitable').value = '';
    }
}

// Met a jour le champ "surface au sol" depuis les dimensions
function _majSurfaceAuSolFromDims() {
    var type = document.getElementById('f-type').value;
    var longueur = parseFloat(document.getElementById('f-distance').value) || 0;
    if (type === 'carre') {
        var nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;
        if (nbCotes === 4) {
            var largeur = parseFloat(document.getElementById('f-largeur').value) || longueur;
            document.getElementById('f-surface-au-sol').value = (longueur * largeur).toFixed(2);
        } else {
            var n = nbCotes;
            document.getElementById('f-surface-au-sol').value = ((n * longueur * longueur / 4) / Math.tan(Math.PI / n)).toFixed(2);
        }
    }
}

// Compteur global surface — se met a jour automatiquement
function _majSurfaceGlobale() {
    var stats = editeur.calculerSurfaceTotale();
    var nb = editeur.elements.length;
    var briques = 0;
    try { briques = editeur.compterBriques(); } catch(e) {}

    document.getElementById('surf-murs').textContent = 'Murs: ' + nb;
    var solEl = document.getElementById('surf-sol');
    solEl.textContent = 'Sol: ' + stats.totalSolM2.toFixed(2) + ' m\u00B2';
    solEl.style.color = stats.totalSolM2 > 0 ? '#FFD700' : '#43B047';
    solEl.style.fontSize = stats.totalSolM2 > 0 ? '13px' : '11px';
    solEl.style.borderColor = stats.totalSolM2 > 0 ? '#FFD700' : '#43B047';
    document.getElementById('surf-mur-m2').textContent = 'Murs: ' + stats.totalMurM2.toFixed(2) + ' m\u00B2';
    document.getElementById('surf-lineaire').textContent = stats.totalLineaire.toFixed(2) + ' ml';
    document.getElementById('surf-briques').textContent = briques + ' briques';
}
setInterval(_majSurfaceGlobale, 500);

// Clic sur "Sol: X m²" = ouvrir le detail par piece
document.getElementById('surf-sol').addEventListener('click', function() {
    var popup = document.getElementById('surface-detail-popup');
    if (popup.style.display === 'block') { popup.style.display = 'none'; return; }

    var html = '';
    var totalInt = 0;
    var nbPieces = 0;

    // 1) Pieces polygones (nbCotes)
    for (var i = 0; i < editeur.elements.length; i++) {
        var p = editeur.elements[i].params;
        var nbc = parseInt(p.nbCotes) || 0;
        if (nbc >= 3) {
            var bt = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[p.briqueType]) ? BRIQUES_TYPES[p.briqueType] : { epaisseur: 0.11 };
            var coteExt = p.distance || 0;
            var coteInt = coteExt - 2 * bt.epaisseur;
            if (coteInt < 0) coteInt = 0;
            var aireInt = (nbc * coteInt * coteInt / 4) / Math.tan(Math.PI / nbc);
            var aireExt = (nbc * coteExt * coteExt / 4) / Math.tan(Math.PI / nbc);
            nbPieces++;
            totalInt += aireInt;
            html += '<div style="padding:10px;margin-bottom:8px;background:rgba(255,215,0,0.1);border:2px solid #FFD700;border-radius:8px;">';
            html += '<div style="font-weight:bold;color:#FFD700;font-size:13px;">Piece ' + nbPieces + ' — ' + (editeur.elements[i].nom || nbc + ' cotes') + '</div>';
            html += '<div style="margin-top:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">';
            html += '<span style="color:#aaa;">Nombre de cotes:</span><span style="color:#fff;">' + nbc + '</span>';
            html += '<span style="color:#aaa;">Cote exterieur:</span><span style="color:#fff;">' + coteExt.toFixed(2) + ' m</span>';
            html += '<span style="color:#aaa;">Epaisseur mur:</span><span style="color:#fff;">' + (bt.epaisseur * 100).toFixed(1) + ' cm (' + bt.nom + ')</span>';
            html += '<span style="color:#aaa;">Cote interieur:</span><span style="color:#fff;font-weight:bold;">' + coteInt.toFixed(2) + ' m</span>';
            html += '<span style="color:#aaa;">Perimetre int:</span><span style="color:#fff;">' + (coteInt * nbc).toFixed(2) + ' m</span>';
            html += '<span style="color:#aaa;">Surface ext brute:</span><span style="color:#fff;">' + aireExt.toFixed(2) + ' m\u00B2</span>';
            html += '</div>';
            html += '<div style="margin-top:8px;padding:8px;background:rgba(255,215,0,0.15);border-radius:6px;text-align:center;">';
            html += '<span style="color:#aaa;font-size:10px;">SURFACE AU SOL (loi Carrez)</span><br>';
            html += '<span style="color:#FFD700;font-weight:bold;font-size:20px;">' + aireInt.toFixed(2) + ' m\u00B2</span>';
            html += '</div></div>';
        }
    }

    // 2) Pieces fermees detectees (murs individuels)
    try {
        var pieces = editeur.detecterPiecesFermees();
        if (pieces && pieces.length > 0) {
            // Epaisseur moyenne
            var epMoy = 0.11;
            if (editeur.elements.length > 0) {
                var sumEp = 0;
                for (var em = 0; em < editeur.elements.length; em++) {
                    var bType = editeur.elements[em].params.briqueType || 'standard';
                    var btInfo = (typeof BRIQUES_TYPES !== 'undefined' && BRIQUES_TYPES[bType]) ? BRIQUES_TYPES[bType] : { epaisseur: 0.11 };
                    sumEp += btInfo.epaisseur;
                }
                epMoy = sumEp / editeur.elements.length;
            }

            for (var pi = 0; pi < pieces.length; pi++) {
                var face = pieces[pi];
                var aireAxe = face.aire || 0;
                if (aireAxe <= 0) continue;
                var pts = face.points;
                var perimetre = 0;
                if (pts) {
                    for (var fp = 0; fp < pts.length; fp++) {
                        var fpn = (fp + 1) % pts.length;
                        perimetre += Math.sqrt(Math.pow(pts[fpn].x - pts[fp].x, 2) + Math.pow(pts[fpn].z - pts[fp].z, 2));
                    }
                }
                var aireInt = aireAxe - perimetre * epMoy / 2;
                if (aireInt < 0) aireInt = 0;
                nbPieces++;
                totalInt += aireInt;

                // Nom de zone si dispo
                var nomZone = 'Piece ' + nbPieces;
                for (var zi = 0; zi < piecesZones.length; zi++) {
                    if (piecesZones[zi].pieceIdx === pi) { nomZone = piecesZones[zi].nom || nomZone; break; }
                }

                html += '<div style="padding:8px;margin-bottom:6px;background:rgba(67,176,71,0.1);border:1px solid #43B047;border-radius:6px;">';
                html += '<div style="font-weight:bold;color:#43B047;">' + nomZone + '</div>';
                html += '<div style="margin-top:4px;display:grid;grid-template-columns:1fr 1fr;gap:4px;">';
                html += '<span style="color:#aaa;">Nb murs:</span><span>' + (pts ? pts.length : '?') + '</span>';
                html += '<span style="color:#aaa;">Perimetre:</span><span>' + perimetre.toFixed(2) + ' m</span>';
                html += '<span style="color:#aaa;">Epaisseur moy:</span><span>' + (epMoy * 100).toFixed(1) + ' cm</span>';
                html += '<span style="color:#aaa;">Surface axe:</span><span>' + aireAxe.toFixed(2) + ' m\u00B2</span>';
                html += '<span style="color:#aaa;font-weight:bold;">Surface int (Carrez):</span><span style="color:#43B047;font-weight:bold;font-size:13px;">' + aireInt.toFixed(2) + ' m\u00B2</span>';
                html += '</div></div>';
            }
        }
    } catch(e) {}

    if (nbPieces === 0) {
        html = '<div style="color:#888;text-align:center;padding:10px;">Aucune piece fermee detectee.<br><span style="font-size:10px;">Formez un carre ou connectez 3+ murs en boucle.</span></div>';
    } else {
        html += '<div style="margin-top:8px;padding:8px;background:rgba(67,176,71,0.2);border:1px solid #43B047;border-radius:6px;text-align:center;">';
        html += '<span style="color:#aaa;">TOTAL Surface habitable:</span><br>';
        html += '<span style="color:#43B047;font-weight:bold;font-size:16px;">' + totalInt.toFixed(2) + ' m\u00B2</span>';
        html += '</div>';
    }

    document.getElementById('surface-detail-content').innerHTML = html;
    popup.style.display = 'block';
});

document.getElementById('surface-detail-close').addEventListener('click', function() {
    document.getElementById('surface-detail-popup').style.display = 'none';
});

// Bouton "Effacer tout" dans la toolbar
document.getElementById('btn-reinitialiser').addEventListener('click', function() {
    if (!confirm('Tout effacer ?\nCette action va supprimer tous les murs, portes, fenetres, placos, laines, plinthes, carrelages, papiers peints et personnages.')) return;
    toutDesactiver();
    // Exclusions
    while (editeur.exclusions.length > 0) {
        if (editeur.exclusions[0].group3D) sceneManager.scene.remove(editeur.exclusions[0].group3D);
        editeur.exclusions.splice(0, 1);
    }
    // Murs
    editeur.viderTout();
    // Traits
    while (editeur.traits.length > 0) editeur.supprimerTrait(editeur.traits[0].id);
    // Placos
    for (var i = 0; i < placoElements.length; i++) sceneManager.scene.remove(placoElements[i]);
    placoElements.length = 0;
    // Laines
    for (var i = 0; i < laineElements.length; i++) sceneManager.scene.remove(laineElements[i]);
    laineElements.length = 0;
    // Plinthes
    for (var i = 0; i < plinthElements.length; i++) sceneManager.scene.remove(plinthElements[i]);
    plinthElements.length = 0;
    // Carrelages
    for (var i = 0; i < carrelageElements.length; i++) sceneManager.scene.remove(carrelageElements[i]);
    carrelageElements.length = 0;
    // Papiers peints
    for (var i = 0; i < ppElements.length; i++) sceneManager.scene.remove(ppElements[i]);
    ppElements.length = 0;
    // Carrelage sol
    for (var i = 0; i < carrelageSolElements.length; i++) sceneManager.scene.remove(carrelageSolElements[i]);
    carrelageSolElements.length = 0;
    // Personnages
    var _pClean = [];
    sceneManager.scene.traverse(function(c) { if (c.userData && c.userData.isPersonnage && c.parent === sceneManager.scene) _pClean.push(c); });
    for (var i = 0; i < _pClean.length; i++) sceneManager.scene.remove(_pClean[i]);
    personnagesListe.length = 0;
    // Escaliers
    for (var i = 0; i < escalierElements.length; i++) sceneManager.scene.remove(escalierElements[i]);
    escalierElements.length = 0;
    // Plafonds
    for (var i = 0; i < plafondElements.length; i++) sceneManager.scene.remove(plafondElements[i]);
    plafondElements.length = 0;
    // Cache
    try { localStorage.removeItem('eleec_cache'); } catch(e) {}
    document.getElementById('info-bar').textContent = 'Scene reinitialisee !';
});

// Bouton "Surface m²" dans la toolbar
document.getElementById('btn-surface-piece').addEventListener('click', function() {
    document.getElementById('surf-sol').click();
});
document.getElementById('f-hauteur').addEventListener('input', _majSurface);

// Surface mur → recalcule la distance
document.getElementById('f-surface').addEventListener('input', function() {
    var s = parseFloat(this.value) || 0;
    var h = parseFloat(document.getElementById('f-hauteur').value) || 2.5;
    if (h > 0) {
        var d = s / h;
        document.getElementById('f-distance').value = d.toFixed(2);
        // Mettre a jour surface sol aussi
        var type = document.getElementById('f-type').value;
        if (type === 'carre') {
            document.getElementById('f-surface-sol').value = (d * d).toFixed(2);
        }
    }
    if (modePlacement) creerGhost();
});

// Surface sol → recalcule le cote (distance)
document.getElementById('f-surface-sol').addEventListener('input', function() {
    var sol = parseFloat(this.value) || 0;
    var type = document.getElementById('f-type').value;
    if (type === 'carre' && sol > 0) {
        var nbCotes = parseInt(document.getElementById('f-nbcotes').value) || 4;
        var d;
        if (nbCotes === 4) {
            d = Math.sqrt(sol); // cote = racine(surface)
        } else if (nbCotes === 3) {
            d = Math.sqrt(sol * 4 / Math.sqrt(3));
        } else {
            d = Math.sqrt(sol);
        }
        document.getElementById('f-distance').value = d.toFixed(2);
        var h = parseFloat(document.getElementById('f-hauteur').value) || 2.5;
        document.getElementById('f-surface').value = (d * h).toFixed(2);
    }
    if (modePlacement) creerGhost();
});

// Afficher/masquer surface sol selon le type
document.getElementById('f-type').addEventListener('change', function() {
    var isCarre = this.value === 'carre';
    document.getElementById('zone-surface-sol').style.display = isCarre ? '' : 'none';
    document.getElementById('zone-surface-piece').style.display = isCarre ? 'block' : 'none';
    // Afficher largeur pour 4 cotes (rectangle)
    var nbC = parseInt(document.getElementById('f-nbcotes').value) || 4;
    document.getElementById('zone-largeur').style.display = (isCarre && nbC === 4) ? 'block' : 'none';
    if (isCarre) _majSurface();
});
document.getElementById('f-largeur').addEventListener('input', function() { _majSurface(); _majSurfaceAuSolFromDims(); _majSurfaceHabitableFromDims(); });
if (document.getElementById('f-nbcotes')) {
    document.getElementById('f-nbcotes').addEventListener('change', function() {
        var nbC = parseInt(this.value) || 4;
        var isCarre = document.getElementById('f-type').value === 'carre';
        document.getElementById('zone-largeur').style.display = (isCarre && nbC === 4) ? 'block' : 'none';
        _majSurface();
    });
}

document.getElementById('f-grille').addEventListener('change', function() {
    grille = parseFloat(this.value) || 0;
});

document.getElementById('btn-couleur-tous').addEventListener('click', function() {
    editeur.sauvegarderEtat();
    var couleur = document.getElementById('f-couleur').value;
    var opacite = parseFloat(document.getElementById('f-opacite').value);
    var jointCouleur = document.getElementById('f-joint').value;
    var jointOpacite = parseFloat(document.getElementById('f-opacite-joint').value);
    editeur.changerCouleurTous(couleur, opacite, jointCouleur, jointOpacite);
});

['f-distance', 'f-hauteur', 'f-angle', 'f-nbcotes', 'f-couleur'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
        if (modePlacement) creerGhost();
    });
});

// Changement de type de brique : mettre a jour les couleurs + ghost
document.getElementById('f-brique-type').addEventListener('change', function() {
    var bt = BRIQUES_TYPES[this.value];
    if (bt) {
        document.getElementById('f-couleur').value = bt.couleur;
        document.getElementById('f-joint').value = bt.jointCouleur;
    }
    _majSurface();
    _majSurfaceHabitableFromDims();
    if (modePlacement) creerGhost();
});

// Pareil dans le popup edition
document.getElementById('e-brique-type').addEventListener('change', function() {
    var bt = BRIQUES_TYPES[this.value];
    if (bt) {
        document.getElementById('e-couleur').value = bt.couleur;
        document.getElementById('e-joint').value = bt.jointCouleur;
    }
});

// Toggle bicolore
document.getElementById('f-bicolore').addEventListener('change', function() {
    document.getElementById('zone-bicolore').style.display = this.checked ? 'block' : 'none';
    if (modePlacement) creerGhost();
});

['f-couleur2'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
        if (modePlacement) creerGhost();
    });
});

document.getElementById('btn-aimant').addEventListener('click', function() {
    aimantActif = !aimantActif;
    this.classList.toggle('actif', aimantActif);
});

// Bouton Mur — ouvrir/fermer le sous-menu directions
document.getElementById('btn-mur').addEventListener('click', function() {
    if (dirMenuOuvert) {
        document.getElementById('dir-menu').style.display = 'none';
        dirMenuOuvert = false;
        if (modePlacement) toutDesactiver();
    } else {
        toutDesactiver();
        document.getElementById('dir-menu').style.display = 'block';
        dirMenuOuvert = true;
        document.getElementById('btn-mur').classList.add('actif');
    }
});

// Clic sur une direction dans le sous-menu
function clicDirection(angle, boutonId) {
    // Desactiver tous les boutons direction
    var dirs = document.querySelectorAll('.dir-btn');
    for (var i = 0; i < dirs.length; i++) dirs[i].classList.remove('actif');

    document.getElementById('f-angle').value = angle;
    document.getElementById('f-type').value = 'mur';
    document.getElementById('zone-angle').style.display = 'none';
    document.getElementById('zone-cotes').style.display = 'none';
    activerPlacement();
    document.getElementById('btn-mur').classList.add('actif');
    document.getElementById(boutonId).classList.add('actif');
}

function clicCarre(angleDepart, boutonId) {
    var dirs = document.querySelectorAll('.dir-btn');
    for (var i = 0; i < dirs.length; i++) dirs[i].classList.remove('actif');

    document.getElementById('f-type').value = 'carre';
    document.getElementById('f-angle').value = angleDepart;
    document.getElementById('zone-angle').style.display = 'none';
    document.getElementById('zone-cotes').style.display = 'block';
    activerPlacement();
    document.getElementById('btn-mur').classList.add('actif');
    document.getElementById(boutonId).classList.add('actif');
}

// Murs droits (croix : haut, bas, gauche, droite)
document.getElementById('btn-mur-h').addEventListener('click', function() { clicDirection(270, 'btn-mur-h'); });
document.getElementById('btn-mur-v').addEventListener('click', function() { clicDirection(90, 'btn-mur-v'); });
document.getElementById('btn-mur-g').addEventListener('click', function() { clicDirection(180, 'btn-mur-g'); });
document.getElementById('btn-mur-d').addEventListener('click', function() { clicDirection(0, 'btn-mur-d'); });
document.getElementById('btn-mur-45').addEventListener('click', function() { clicDirection(45, 'btn-mur-45'); });
document.getElementById('btn-mur-135').addEventListener('click', function() { clicDirection(135, 'btn-mur-135'); });
document.getElementById('btn-mur-225').addEventListener('click', function() { clicDirection(225, 'btn-mur-225'); });
document.getElementById('btn-mur-315').addEventListener('click', function() { clicDirection(315, 'btn-mur-315'); });

// Carre droit (centre)
document.getElementById('btn-mur-carre').addEventListener('click', function() { clicCarre(0, 'btn-mur-carre'); });

// Carres diagonaux (4 coins)
document.getElementById('btn-carre-og').addEventListener('click', function() { clicCarre(45, 'btn-carre-og'); });
document.getElementById('btn-carre-od').addEventListener('click', function() { clicCarre(135, 'btn-carre-od'); });
document.getElementById('btn-carre-og2').addEventListener('click', function() { clicCarre(225, 'btn-carre-og2'); });
document.getElementById('btn-carre-od2').addEventListener('click', function() { clicCarre(315, 'btn-carre-od2'); });

// Presets porte / fenetre
function appliquerPreset(type) {
    if (type === 'porte') {
        document.getElementById('f-trou-largeur').value = '0.90';
        document.getElementById('f-trou-hauteur').value = '2.10';
        document.getElementById('f-trou-y').value = '0';
        document.getElementById('btn-preset-porte').style.background = '#e94560';
        document.getElementById('btn-preset-porte').style.color = '#fff';
        document.getElementById('btn-preset-porte').style.border = 'none';
        document.getElementById('btn-preset-fenetre').style.background = '#16213e';
        document.getElementById('btn-preset-fenetre').style.color = '#aaa';
        document.getElementById('btn-preset-fenetre').style.border = '1px solid #333';
    } else {
        document.getElementById('f-trou-largeur').value = '1.20';
        document.getElementById('f-trou-hauteur').value = '1.20';
        document.getElementById('f-trou-y').value = '0.90';
        document.getElementById('btn-preset-fenetre').style.background = '#e94560';
        document.getElementById('btn-preset-fenetre').style.color = '#fff';
        document.getElementById('btn-preset-fenetre').style.border = 'none';
        document.getElementById('btn-preset-porte').style.background = '#16213e';
        document.getElementById('btn-preset-porte').style.color = '#aaa';
        document.getElementById('btn-preset-porte').style.border = '1px solid #333';
    }
    if (modeTrou) creerGhostTrou();
}

document.getElementById('btn-preset-porte').addEventListener('click', function() { appliquerPreset('porte'); });
document.getElementById('btn-preset-fenetre').addEventListener('click', function() { appliquerPreset('fenetre'); });

// Mise a jour du ghost trou quand les params changent
['f-trou-largeur', 'f-trou-hauteur', 'f-trou-y', 'f-trou-align', 'f-trou-decalage'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
        if (modeTrou) creerGhostTrou();
    });
});

// Bouton trou
document.getElementById('btn-grouper-valider').addEventListener('click', function() {
    validerGrouper();
});

document.getElementById('btn-grouper-annuler').addEventListener('click', function() {
    toutDesactiver();
});

// ========================================
// PERSONNAGE REPERE (1.70m)
// ========================================

var modePersonnage = false;
var personnageGhost = null;
var personnagesListe = []; // tous les personnages places
var modeDeplacerPerso = false;
var deplacerPersoGroup = null;

// Escaliers
var modeEscalier = false;
var escalierModele = null;
var escalierGhost = null;
var escalierElements = [];
var modeDeplacerEscalier = false;
var deplacerEscalierGroup = null;

// Plafonds
var modePlafond4pts = false;
var plafondModeRect = true; // true = rectangle 2 clics, false = 4 points libres
var plafondPoints = [];
var plafondMarkers = [];
var plafondGhostLines = [];
var plafondGhostRect = null;
var plafondElements = [];

function lireCouleursPersoPopup() {
    return {
        peau: document.getElementById('perso-peau').value,
        cheveux: document.getElementById('perso-cheveux').value,
        haut: document.getElementById('perso-haut').value,
        bas: document.getElementById('perso-bas').value,
        chaussures: document.getElementById('perso-chaussures').value
    };
}

function getTaillePerso() {
    return (parseFloat(document.getElementById('perso-taille').value) || 170) / 170;
}

document.getElementById('btn-personnage').addEventListener('click', function() {
    toutDesactiver();
    modePersonnage = true;
    container.style.cursor = 'crosshair';
    document.getElementById('personnage-popup').style.display = 'block';

    personnageGhost = personnage.creerGhost(lireCouleursPersoPopup());
    personnageGhost.scale.setScalar(getTaillePerso());
    sceneManager.scene.add(personnageGhost);

    document.getElementById('info-bar').textContent = 'PERSONNAGE — Choisissez les couleurs/taille puis cliquez sur le sol | Echap = annuler';
});

// Mettre a jour le ghost quand on change les couleurs ou la taille
['perso-peau', 'perso-cheveux', 'perso-haut', 'perso-bas', 'perso-chaussures', 'perso-taille'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
        if (!modePersonnage) return;
        var wasVisible = personnageGhost ? personnageGhost.visible : false;
        var oldPos = personnageGhost ? personnageGhost.position.clone() : null;
        if (personnageGhost) sceneManager.scene.remove(personnageGhost);
        personnageGhost = personnage.creerGhost(lireCouleursPersoPopup());
        personnageGhost.scale.setScalar(getTaillePerso());
        if (oldPos) personnageGhost.position.copy(oldPos);
        personnageGhost.visible = wasVisible;
        sceneManager.scene.add(personnageGhost);
    });
});

// Fermer menu perso si clic ailleurs
document.addEventListener('pointerdown', function(e) {
    var pm = document.getElementById('ctx-perso-menu');
    if (pm.style.display === 'block' && !pm.contains(e.target)) {
        pm.style.display = 'none';
    }
});

// Editer personnage
document.getElementById('ctx-perso-editer').addEventListener('click', function() {
    var group = window._ctxPersoGroup;
    if (!group) return;
    document.getElementById('ctx-perso-menu').style.display = 'none';
    window._editPersoGroup = group;
    var c = Personnage.lireCouleurs(group);
    document.getElementById('ep-peau').value = c.peau;
    document.getElementById('ep-cheveux').value = c.cheveux;
    document.getElementById('ep-haut').value = c.haut;
    document.getElementById('ep-bas').value = c.bas;
    document.getElementById('ep-chaussures').value = c.chaussures;
    document.getElementById('ep-taille').value = Math.round(group.scale.x * 170);
    document.getElementById('edit-perso-popup').style.display = 'block';
});

// Mise a jour temps reel des couleurs et taille du personnage edite
['ep-peau', 'ep-cheveux', 'ep-haut', 'ep-bas', 'ep-chaussures'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
        if (!window._editPersoGroup) return;
        Personnage.changerCouleurs(window._editPersoGroup, {
            peau: document.getElementById('ep-peau').value,
            cheveux: document.getElementById('ep-cheveux').value,
            haut: document.getElementById('ep-haut').value,
            bas: document.getElementById('ep-bas').value,
            chaussures: document.getElementById('ep-chaussures').value
        });
    });
});
document.getElementById('ep-taille').addEventListener('input', function() {
    if (!window._editPersoGroup) return;
    var scale = (parseFloat(this.value) || 170) / 170;
    window._editPersoGroup.scale.setScalar(scale);
});

document.getElementById('btn-ep-perso-ok').addEventListener('click', function() {
    document.getElementById('edit-perso-popup').style.display = 'none';
    window._editPersoGroup = null;
    document.getElementById('info-bar').textContent = 'Personnage modifie !';
});

// Deplacer personnage
document.getElementById('ctx-perso-deplacer').addEventListener('click', function() {
    var group = window._ctxPersoGroup;
    if (!group) return;
    document.getElementById('ctx-perso-menu').style.display = 'none';
    toutDesactiver();
    modeDeplacerPerso = true;
    deplacerPersoGroup = group;
    container.style.cursor = 'grab';
    document.getElementById('info-bar').textContent = 'DEPLACER PERSONNAGE — Cliquez pour poser | Echap = annuler';
    window._ctxPersoGroup = null;
});

// Supprimer personnage
document.getElementById('ctx-perso-supprimer').addEventListener('click', function() {
    var group = window._ctxPersoGroup;
    if (!group) return;
    document.getElementById('ctx-perso-menu').style.display = 'none';
    sceneManager.scene.remove(group);
    for (var i = 0; i < personnagesListe.length; i++) {
        if (personnagesListe[i] === group) { personnagesListe.splice(i, 1); break; }
    }
    window._ctxPersoGroup = null;
    document.getElementById('info-bar').textContent = 'Personnage supprime !';
});

// ========================================
// PLAFOND / PLANCHER (4 points)
// ========================================

function _creerPlafond(points, hauteur, ep, couleurDalle, couleurPoteau, avecPoteaux) {
    var group = new THREE.Group();
    var epM = ep / 100; // cm -> m

    // === DALLE COMPLETE (dessus + dessous + 4 cotes) ===

    // Dessus de la dalle
    var shape = new THREE.Shape();
    shape.moveTo(points[0].x, -points[0].z);
    for (var i = 1; i < points.length; i++) shape.lineTo(points[i].x, -points[i].z);
    shape.lineTo(points[0].x, -points[0].z);

    var extrudeGeo = new THREE.ExtrudeGeometry(shape, { depth: epM, bevelEnabled: false });
    extrudeGeo.rotateX(-Math.PI / 2);
    var dalleMat = new THREE.MeshStandardMaterial({ color: couleurDalle, roughness: 0.7, side: THREE.DoubleSide });
    var dalle = new THREE.Mesh(extrudeGeo, dalleMat);
    dalle.position.y = hauteur;
    dalle.castShadow = true;
    dalle.receiveShadow = true;
    dalle.userData.isPlafond = true;
    dalle.userData.isDalle = true;
    group.add(dalle);

    // Bordures laterales (4 faces verticales sur les bords de la dalle)
    var bordureMat = new THREE.MeshStandardMaterial({ color: couleurDalle, roughness: 0.8 });
    var n = points.length;
    for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;
        var dx = points[j].x - points[i].x;
        var dz = points[j].z - points[i].z;
        var longueur = Math.sqrt(dx * dx + dz * dz);
        if (longueur < 0.01) continue;
        var angle = Math.atan2(dx, dz);
        var cx = (points[i].x + points[j].x) / 2;
        var cz = (points[i].z + points[j].z) / 2;
        var bordGeo = new THREE.BoxGeometry(longueur, epM, 0.01);
        var bord = new THREE.Mesh(bordGeo, bordureMat);
        bord.position.set(cx, hauteur + epM / 2, cz);
        bord.rotation.y = -angle + Math.PI / 2;
        bord.castShadow = true;
        bord.userData.isPlafond = true;
        group.add(bord);
    }

    // === POTEAUX aux 4 coins (solides, section carree) ===
    if (avecPoteaux) {
        var poteauSection = 0.15;
        var poteauGeo = new THREE.BoxGeometry(poteauSection, hauteur, poteauSection);
        var poteauMat = new THREE.MeshStandardMaterial({ color: couleurPoteau, roughness: 0.5 });
        for (var i = 0; i < points.length; i++) {
            var poteau = new THREE.Mesh(poteauGeo, poteauMat.clone());
            poteau.position.set(points[i].x, hauteur / 2, points[i].z);
            poteau.castShadow = true;
            poteau.receiveShadow = true;
            poteau.userData.isPlafond = true;
            poteau.userData.isPoteau = true;
            group.add(poteau);
        }

        // Poutres horizontales entre les poteaux (sous la dalle)
        var poutreMat = new THREE.MeshStandardMaterial({ color: couleurPoteau, roughness: 0.6 });
        var poutreH = 0.12;
        var poutreW = 0.10;
        for (var i = 0; i < n; i++) {
            var j = (i + 1) % n;
            var dx = points[j].x - points[i].x;
            var dz = points[j].z - points[i].z;
            var longueur = Math.sqrt(dx * dx + dz * dz);
            if (longueur < 0.01) continue;
            var angle = Math.atan2(dx, dz);
            var cx = (points[i].x + points[j].x) / 2;
            var cz = (points[i].z + points[j].z) / 2;
            var poutreGeo = new THREE.BoxGeometry(poutreW, poutreH, longueur);
            var poutre = new THREE.Mesh(poutreGeo, poutreMat);
            poutre.position.set(cx, hauteur - poutreH / 2, cz);
            poutre.rotation.y = -angle;
            poutre.castShadow = true;
            poutre.userData.isPlafond = true;
            group.add(poutre);
        }
    }

    group.userData.plafondCreation = {
        points: JSON.parse(JSON.stringify(points)),
        hauteur: hauteur,
        ep: ep,
        couleurDalle: couleurDalle,
        couleurPoteau: couleurPoteau,
        avecPoteaux: avecPoteaux
    };

    sceneManager.scene.add(group);
    return group;
}

function _plafondMajEtape() {
    var n = plafondPoints.length;
    if (plafondModeRect) {
        var etapes = ['Cliquez le 1er coin du rectangle', 'Cliquez le coin oppose — le rectangle sera cree'];
        document.getElementById('npf-etape').textContent = etapes[n] || 'Pret !';
        document.getElementById('info-bar').textContent = 'PLAFOND RECTANGLE — ' + (etapes[n] || 'Pret !');
    } else {
        var etapes = ['Cliquez le 1er coin au sol (1/4)', 'Cliquez le 2eme coin (2/4)', 'Cliquez le 3eme coin (3/4)', 'Cliquez le 4eme coin (4/4) — le plafond sera cree'];
        document.getElementById('npf-etape').textContent = etapes[n] || 'Pret !';
        document.getElementById('info-bar').textContent = 'PLAFOND — ' + (etapes[n] || 'Pret !');
    }
    document.getElementById('btn-npf-annuler-point').style.display = n > 0 ? 'block' : 'none';
}

function _plafondAjouterMarker(x, z) {
    var geo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
    var mat = new THREE.MeshStandardMaterial({ color: '#B0A090', emissive: '#B0A090', emissiveIntensity: 0.3 });
    var marker = new THREE.Mesh(geo, mat);
    marker.position.set(x, 0.075, z);
    marker.castShadow = true;
    sceneManager.scene.add(marker);
    plafondMarkers.push(marker);

    // Ligne vers le marker precedent
    if (plafondPoints.length >= 1) {
        var prev = plafondPoints[plafondPoints.length - 1];
        var pts = [new THREE.Vector3(prev.x, 0.02, prev.z), new THREE.Vector3(x, 0.02, z)];
        var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        var lineMat = new THREE.LineBasicMaterial({ color: '#B0A090' });
        var line = new THREE.Line(lineGeo, lineMat);
        sceneManager.scene.add(line);
        plafondGhostLines.push(line);
    }
}

document.getElementById('btn-plafond').addEventListener('click', function() {
    if (modePlafond4pts) { toutDesactiver(); return; }
    toutDesactiver();
    modePlafond4pts = true;
    plafondPoints = [];
    container.style.cursor = 'crosshair';
    document.getElementById('plafond-4pts-popup').style.display = 'block';
    _plafondMajEtape();
});

document.getElementById('btn-npf-annuler-point').addEventListener('click', function() {
    if (plafondPoints.length > 0) {
        plafondPoints.pop();
        if (plafondMarkers.length > 0) {
            sceneManager.scene.remove(plafondMarkers.pop());
        }
        if (plafondGhostLines.length > 0) {
            var l = plafondGhostLines.pop();
            sceneManager.scene.remove(l); l.geometry.dispose(); l.material.dispose();
        }
        _plafondMajEtape();
    }
});

function _plafondSetModeRect(isRect) {
    plafondModeRect = isRect;
    // Reset points en cours
    plafondPoints = [];
    for (var _pm = 0; _pm < plafondMarkers.length; _pm++) sceneManager.scene.remove(plafondMarkers[_pm]);
    plafondMarkers = [];
    for (var _pl = 0; _pl < plafondGhostLines.length; _pl++) { sceneManager.scene.remove(plafondGhostLines[_pl]); plafondGhostLines[_pl].geometry.dispose(); plafondGhostLines[_pl].material.dispose(); }
    plafondGhostLines = [];
    if (plafondGhostRect) { sceneManager.scene.remove(plafondGhostRect); plafondGhostRect = null; }
    // Surligner bouton actif
    if (isRect) {
        document.getElementById('btn-npf-mode-rect').style.background = '#B0A090';
        document.getElementById('btn-npf-mode-rect').style.color = '#fff';
        document.getElementById('btn-npf-mode-rect').style.border = 'none';
        document.getElementById('btn-npf-mode-4pts').style.background = '#16213e';
        document.getElementById('btn-npf-mode-4pts').style.color = '#B0A090';
        document.getElementById('btn-npf-mode-4pts').style.border = '1px solid #B0A090';
    } else {
        document.getElementById('btn-npf-mode-4pts').style.background = '#B0A090';
        document.getElementById('btn-npf-mode-4pts').style.color = '#fff';
        document.getElementById('btn-npf-mode-4pts').style.border = 'none';
        document.getElementById('btn-npf-mode-rect').style.background = '#16213e';
        document.getElementById('btn-npf-mode-rect').style.color = '#B0A090';
        document.getElementById('btn-npf-mode-rect').style.border = '1px solid #B0A090';
    }
    _plafondMajEtape();
}

document.getElementById('btn-npf-mode-rect').addEventListener('click', function() { _plafondSetModeRect(true); });
document.getElementById('btn-npf-mode-4pts').addEventListener('click', function() { _plafondSetModeRect(false); });

document.getElementById('npf-ghost-opacite').addEventListener('input', function() {
    document.getElementById('npf-ghost-opacite-val').textContent = this.value + '%';
});

// Editer plafond — variables pour le mode deplacer point
var _epfDeplacerPtIdx = -1;
var _epfDeplacerPtMarkers = [];

function _epfGenererPointsHTML(points) {
    var couleurs = ['#e94560', '#4a9eff', '#43B047', '#ffa500'];
    var html = '';
    for (var i = 0; i < points.length; i++) {
        html += '<div style="display:flex; align-items:center; gap:4px;">';
        html += '<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:' + couleurs[i] + '; flex-shrink:0;"></span>';
        html += '<span style="color:#888; font-size:10px; width:16px;">P' + (i + 1) + '</span>';
        html += '<label style="font-size:10px; color:#aaa;">X</label><input type="number" class="epf-pt-x" data-idx="' + i + '" value="' + points[i].x.toFixed(2) + '" step="0.05" style="width:60px; font-size:11px; padding:2px 4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px;">';
        html += '<label style="font-size:10px; color:#aaa;">Z</label><input type="number" class="epf-pt-z" data-idx="' + i + '" value="' + points[i].z.toFixed(2) + '" step="0.05" style="width:60px; font-size:11px; padding:2px 4px; background:#16213e; color:#fff; border:1px solid #333; border-radius:3px;">';
        html += '<button class="epf-pt-move" data-idx="' + i + '" title="Cliquer au sol pour deplacer ce point" style="padding:2px 6px; background:' + couleurs[i] + '; color:#fff; border:none; border-radius:3px; cursor:pointer; font-size:10px; font-family:monospace;">&#10140;</button>';
        html += '</div>';
    }
    return html;
}

function _epfMontrerMarkers(points) {
    _epfSupprimerMarkers();
    var couleurs = [0xe94560, 0x4a9eff, 0x43B047, 0xffa500];
    for (var i = 0; i < points.length; i++) {
        var geo = new THREE.CylinderGeometry(0.10, 0.10, 0.20, 12);
        var mat = new THREE.MeshStandardMaterial({ color: couleurs[i], emissive: couleurs[i], emissiveIntensity: 0.5 });
        var m = new THREE.Mesh(geo, mat);
        m.position.set(points[i].x, 0.10, points[i].z);
        sceneManager.scene.add(m);
        _epfDeplacerPtMarkers.push(m);
    }
}

function _epfSupprimerMarkers() {
    for (var i = 0; i < _epfDeplacerPtMarkers.length; i++) sceneManager.scene.remove(_epfDeplacerPtMarkers[i]);
    _epfDeplacerPtMarkers = [];
}

function _epfLirePointsPopup() {
    var pts = [];
    var xs = document.querySelectorAll('.epf-pt-x');
    var zs = document.querySelectorAll('.epf-pt-z');
    for (var i = 0; i < xs.length; i++) {
        pts.push({ x: parseFloat(xs[i].value) || 0, z: parseFloat(zs[i].value) || 0 });
    }
    return pts;
}

// Ctx editer
document.getElementById('ctx-plafond-editer').addEventListener('click', function() {
    var group = window._ctxPlafondGroup;
    if (!group || !group.userData.plafondCreation) return;
    document.getElementById('ctx-plafond-menu').style.display = 'none';
    var cr = group.userData.plafondCreation;
    document.getElementById('epf-hauteur').value = cr.hauteur.toFixed(2);
    document.getElementById('epf-ep').value = cr.ep;
    document.getElementById('epf-couleur').value = cr.couleurDalle;
    document.getElementById('epf-poteau').value = cr.couleurPoteau;
    document.getElementById('epf-points-list').innerHTML = _epfGenererPointsHTML(cr.points);
    _epfMontrerMarkers(cr.points);
    _epfDeplacerPtIdx = -1;
    document.getElementById('edit-plafond-popup').style.display = 'block';
});

// Clic sur le bouton fleche d'un point → mode deplacer ce point
document.getElementById('epf-points-list').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.epf-pt-move');
    if (!btn) return;
    var idx = parseInt(btn.getAttribute('data-idx'));
    _epfDeplacerPtIdx = idx;
    container.style.cursor = 'crosshair';
    // Surligner le bouton actif
    var allBtns = document.querySelectorAll('.epf-pt-move');
    for (var i = 0; i < allBtns.length; i++) allBtns[i].style.outline = '';
    btn.style.outline = '2px solid #fff';
    document.getElementById('info-bar').textContent = 'PLAFOND — Cliquez au sol pour deplacer le point P' + (idx + 1) + ' | Echap = annuler';
});

// Appliquer les modifications
document.getElementById('btn-epf-appliquer').addEventListener('click', function() {
    var group = window._ctxPlafondGroup;
    if (!group || !group.userData.plafondCreation) return;
    var cr = group.userData.plafondCreation;
    var newPts = _epfLirePointsPopup();
    var newH = parseFloat(document.getElementById('epf-hauteur').value) || cr.hauteur;
    var newEp = parseInt(document.getElementById('epf-ep').value) || cr.ep;
    var newCoulD = document.getElementById('epf-couleur').value;
    var newCoulP = document.getElementById('epf-poteau').value;

    // Reconstruire
    sceneManager.scene.remove(group);
    for (var i = 0; i < plafondElements.length; i++) {
        if (plafondElements[i] === group) { plafondElements.splice(i, 1); break; }
    }
    var newGroup = _creerPlafond(newPts, newH, newEp, newCoulD, newCoulP, cr.avecPoteaux);
    plafondElements.push(newGroup);
    window._ctxPlafondGroup = newGroup;
    _epfSupprimerMarkers();
    _epfDeplacerPtIdx = -1;
    container.style.cursor = 'default';
    document.getElementById('edit-plafond-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Plafond mis a jour !';
    editeur.sauvegarderEtat();
});

// Bouton "Deplacer point" — bascule mode
document.getElementById('btn-epf-deplacer-pt').addEventListener('click', function() {
    if (_epfDeplacerPtIdx >= 0) {
        // Desactiver
        _epfDeplacerPtIdx = -1;
        container.style.cursor = 'default';
        var allBtns = document.querySelectorAll('.epf-pt-move');
        for (var i = 0; i < allBtns.length; i++) allBtns[i].style.outline = '';
        document.getElementById('info-bar').textContent = 'Mode deplacer point desactive. Modifiez les valeurs ou cliquez Appliquer.';
    } else {
        document.getElementById('info-bar').textContent = 'Cliquez sur la fleche d\'un point (P1-P4) puis cliquez au sol pour le deplacer.';
    }
});

// Masquer/afficher poteaux
document.getElementById('ctx-plafond-toggle-poteaux').addEventListener('click', function() {
    var group = window._ctxPlafondGroup;
    if (!group) return;
    document.getElementById('ctx-plafond-menu').style.display = 'none';
    var cr = group.userData.plafondCreation;
    if (!cr) return;
    // Basculer
    var newAvec = !cr.avecPoteaux;
    // Reconstruire
    sceneManager.scene.remove(group);
    for (var i = 0; i < plafondElements.length; i++) {
        if (plafondElements[i] === group) { plafondElements.splice(i, 1); break; }
    }
    var newGroup = _creerPlafond(cr.points, cr.hauteur, cr.ep, cr.couleurDalle, cr.couleurPoteau, newAvec);
    plafondElements.push(newGroup);
    window._ctxPlafondGroup = newGroup;
    document.getElementById('info-bar').textContent = newAvec ? 'Poteaux affiches !' : 'Poteaux masques !';
    editeur.sauvegarderEtat();
});

// Supprimer plafond
document.getElementById('ctx-plafond-supprimer').addEventListener('click', function() {
    var group = window._ctxPlafondGroup;
    if (!group) return;
    document.getElementById('ctx-plafond-menu').style.display = 'none';
    sceneManager.scene.remove(group);
    for (var i = 0; i < plafondElements.length; i++) {
        if (plafondElements[i] === group) { plafondElements.splice(i, 1); break; }
    }
    window._ctxPlafondGroup = null;
    document.getElementById('info-bar').textContent = 'Plafond supprime !';
    editeur.sauvegarderEtat();
});

// ========================================
// ESCALIER
// ========================================

document.getElementById('btn-escalier').addEventListener('click', function() {
    toutDesactiver();
    var modeles = Escalier.modeles();
    var categories = {
        'droit': { nom: 'Escaliers droits', couleur: '#A0522D', ico: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 14 L2 12 L5 12 L5 10 L8 10 L8 8 L11 8 L11 6 L14 6 L14 14 Z" fill="#A0522D" stroke="#8B4513" stroke-width="0.8"/></svg>' },
        'tournant': { nom: 'Escaliers tournants', couleur: '#8B6538', ico: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 14 L2 12 L5 12 L5 10 L8 10 L8 8 L10 8 L10 6" fill="none" stroke="#A0522D" stroke-width="1.5"/><path d="M10 6 L12 6 L12 8 L14 8" fill="none" stroke="#A0522D" stroke-width="1.5"/></svg>' },
        'special': { nom: 'Speciaux', couleur: '#5C4033', ico: '<svg viewBox="0 0 16 16" width="16" height="16"><line x1="4" y1="2" x2="4" y2="14" stroke="#5C4033" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="14" stroke="#5C4033" stroke-width="1.5"/><line x1="4" y1="4" x2="12" y2="4" stroke="#A0522D" stroke-width="1"/><line x1="4" y1="7" x2="12" y2="7" stroke="#A0522D" stroke-width="1"/><line x1="4" y1="10" x2="12" y2="10" stroke="#A0522D" stroke-width="1"/><line x1="4" y1="13" x2="12" y2="13" stroke="#A0522D" stroke-width="1"/></svg>' }
    };
    var html = '';
    var catsDone = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat || 'autre';
        if (catsDone[cat]) continue;
        catsDone[cat] = true;
        var catInfo = categories[cat] || { nom: cat, couleur: '#aaa', ico: '' };
        html += '<button class="escalier-cat-btn" data-cat="' + cat + '" style="width:100%; padding:8px; margin-bottom:2px; background:#1a1a2e; color:' + catInfo.couleur + '; border:1px solid ' + catInfo.couleur + '; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:8px;">';
        html += catInfo.ico;
        html += '<span style="flex:1; text-align:left;">' + catInfo.nom + '</span>';
        html += '<span class="escalier-cat-arrow" style="font-size:10px;">&#9660;</span>';
        html += '</button>';
        html += '<div class="escalier-cat-list" data-cat="' + cat + '" style="display:none; padding-left:4px;">';
        for (var j = 0; j < modeles.length; j++) {
            var m = modeles[j];
            if (m.cat !== cat) continue;
            html += '<button class="escalier-modele-btn" data-modele="' + m.id + '" style="width:100%; padding:5px 8px; margin-bottom:3px; background:#16213e; color:#fff; border:1px solid ' + catInfo.couleur + '55; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:flex; align-items:center; gap:8px; text-align:left;">';
            html += '<span style="flex-shrink:0;">' + (m.ico || '') + '</span>';
            html += '<span>' + m.nom + ' <span style="color:#888; font-size:9px;">(' + m.largeur.toFixed(2) + 'x' + m.longueur.toFixed(2) + ' h' + m.hauteur.toFixed(2) + ')</span></span>';
            html += '</button>';
        }
        html += '</div>';
    }
    document.getElementById('escalier-modeles').innerHTML = html;
    document.getElementById('escalier-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'ESCALIER — Choisissez une categorie puis un modele';
});

// Deplier/replier categories escalier
document.getElementById('escalier-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.escalier-cat-btn');
    if (btn) {
        var cat = btn.getAttribute('data-cat');
        var list = document.querySelector('.escalier-cat-list[data-cat="' + cat + '"]');
        if (list) {
            var visible = list.style.display !== 'none';
            var allLists = document.querySelectorAll('.escalier-cat-list');
            for (var i = 0; i < allLists.length; i++) allLists[i].style.display = 'none';
            var allArrows = document.querySelectorAll('.escalier-cat-arrow');
            for (var i = 0; i < allArrows.length; i++) allArrows[i].innerHTML = '&#9660;';
            if (!visible) {
                list.style.display = 'block';
                btn.querySelector('.escalier-cat-arrow').innerHTML = '&#9650;';
            }
        }
        return;
    }
});

// Clic sur un modele d'escalier
document.getElementById('escalier-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.escalier-modele-btn');
    if (!btn) return;
    var modeleId = btn.getAttribute('data-modele');
    var modeles = Escalier.modeles();
    var mod = null;
    for (var i = 0; i < modeles.length; i++) {
        if (modeles[i].id === modeleId) { mod = modeles[i]; break; }
    }
    if (!mod) return;

    var btns = document.querySelectorAll('.escalier-modele-btn');
    for (var i = 0; i < btns.length; i++) btns[i].style.background = '#16213e';
    btn.style.background = '#A0522D';

    escalierModele = mod;
    modeEscalier = true;
    container.style.cursor = 'crosshair';

    // Pre-remplir les champs dimensions
    document.getElementById('nesc-largeur').value = mod.largeur.toFixed(2);
    document.getElementById('nesc-longueur').value = mod.longueur.toFixed(2);
    document.getElementById('nesc-hauteur').value = mod.hauteur.toFixed(2);
    document.getElementById('nesc-nb').value = mod.nbMarches;

    // Ghost preview
    if (escalierGhost) { sceneManager.scene.remove(escalierGhost); escalierGhost = null; }
    var geo = new THREE.BoxGeometry(mod.largeur, 0.10, mod.longueur);
    var mat = new THREE.MeshBasicMaterial({ color: '#A0522D', transparent: true, opacity: 0.4, depthWrite: false });
    escalierGhost = new THREE.Mesh(geo, mat);
    escalierGhost.visible = false;
    sceneManager.scene.add(escalierGhost);

    document.getElementById('info-bar').textContent = 'ESCALIER ' + mod.nom + ' — Cliquez sur le sol pour poser | Echap = annuler';
});

// Couleurs input mis a jour live
['nesc-marche', 'nesc-rampe'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
        if (!modeEscalier) return;
        escalierObj.setCouleurs(
            document.getElementById('nesc-marche').value,
            document.getElementById('nesc-rampe').value
        );
    });
});

// Mettre a jour le ghost quand on change les dimensions
['nesc-largeur', 'nesc-longueur', 'nesc-hauteur', 'nesc-nb'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
        if (!modeEscalier || !escalierGhost) return;
        var l = parseFloat(document.getElementById('nesc-largeur').value) || 0.90;
        var lg = parseFloat(document.getElementById('nesc-longueur').value) || 3.50;
        // Reconstruire le ghost avec les nouvelles dimensions
        var wasVisible = escalierGhost.visible;
        var pos = escalierGhost.position.clone();
        sceneManager.scene.remove(escalierGhost);
        var geo = new THREE.BoxGeometry(l, 0.10, lg);
        var mat = new THREE.MeshBasicMaterial({ color: '#A0522D', transparent: true, opacity: 0.4, depthWrite: false });
        escalierGhost = new THREE.Mesh(geo, mat);
        escalierGhost.position.copy(pos);
        escalierGhost.visible = wasVisible;
        sceneManager.scene.add(escalierGhost);
    });
});

function _lireEscalierOverrides() {
    return {
        largeur: parseFloat(document.getElementById('nesc-largeur').value) || 0.90,
        longueur: parseFloat(document.getElementById('nesc-longueur').value) || 3.50,
        hauteur: parseFloat(document.getElementById('nesc-hauteur').value) || 2.50,
        nbMarches: parseInt(document.getElementById('nesc-nb').value) || 13
    };
}

// Editer escalier — appliquer
document.getElementById('btn-eesc-appliquer').addEventListener('click', function() {
    var group = window._ctxEscalierGroup;
    if (!group || !group.userData.escalierCreation) return;
    var cr = group.userData.escalierCreation;
    var couleurMarche = document.getElementById('eesc-marche').value;
    var couleurRampe = document.getElementById('eesc-rampe').value;
    var newLarg = parseFloat(document.getElementById('eesc-largeur').value) || cr.largeur;
    var newLong = parseFloat(document.getElementById('eesc-longueur').value) || cr.longueur;
    var newHaut = parseFloat(document.getElementById('eesc-hauteur').value) || cr.hauteur;
    var newNb = parseInt(document.getElementById('eesc-nb').value) || cr.nbMarches;

    // Si dimensions changees, reconstruire l'escalier
    if (newLarg !== cr.largeur || newLong !== cr.longueur || newHaut !== cr.hauteur || newNb !== cr.nbMarches) {
        var wx = group.position.x, wz = group.position.z;
        var ang = cr.angle || 0;
        sceneManager.scene.remove(group);
        for (var i = 0; i < escalierElements.length; i++) {
            if (escalierElements[i] === group) { escalierElements.splice(i, 1); break; }
        }
        escalierObj.setCouleurs(couleurMarche, couleurRampe);
        var newGroup = escalierObj.creer(cr.modeleId, wx, wz, ang, { largeur: newLarg, longueur: newLong, hauteur: newHaut, nbMarches: newNb });
        escalierElements.push(newGroup);
        window._ctxEscalierGroup = newGroup;
    } else {
        // Juste les couleurs
        Escalier.changerCouleur(group, couleurMarche, couleurRampe);
        cr.couleurMarche = couleurMarche;
        cr.couleurRampe = couleurRampe;
    }
    document.getElementById('edit-escalier-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Escalier mis a jour !';
    editeur.sauvegarderEtat();
});

// Ctx escalier — editer
document.getElementById('ctx-escalier-editer').addEventListener('click', function() {
    var group = window._ctxEscalierGroup;
    if (!group) return;
    document.getElementById('ctx-escalier-menu').style.display = 'none';
    var cols = Escalier.lireCouleurs(group);
    document.getElementById('eesc-marche').value = cols.marche;
    document.getElementById('eesc-rampe').value = cols.rampe;
    var cr = group.userData.escalierCreation || {};
    document.getElementById('eesc-largeur').value = (cr.largeur || 0.90).toFixed(2);
    document.getElementById('eesc-longueur').value = (cr.longueur || 3.50).toFixed(2);
    document.getElementById('eesc-hauteur').value = (cr.hauteur || 2.50).toFixed(2);
    document.getElementById('eesc-nb').value = cr.nbMarches || 13;
    document.getElementById('edit-escalier-popup').style.display = 'block';
});

// Ctx escalier — deplacer
document.getElementById('ctx-escalier-deplacer').addEventListener('click', function() {
    var group = window._ctxEscalierGroup;
    if (!group) return;
    document.getElementById('ctx-escalier-menu').style.display = 'none';
    toutDesactiver();
    modeDeplacerEscalier = true;
    deplacerEscalierGroup = group;
    container.style.cursor = 'grab';
    document.getElementById('info-bar').textContent = 'DEPLACER ESCALIER — Cliquez pour poser | Echap = annuler';
    window._ctxEscalierGroup = null;
});

// Ctx escalier — supprimer
document.getElementById('ctx-escalier-supprimer').addEventListener('click', function() {
    var group = window._ctxEscalierGroup;
    if (!group) return;
    document.getElementById('ctx-escalier-menu').style.display = 'none';
    sceneManager.scene.remove(group);
    for (var i = 0; i < escalierElements.length; i++) {
        if (escalierElements[i] === group) { escalierElements.splice(i, 1); break; }
    }
    window._ctxEscalierGroup = null;
    document.getElementById('info-bar').textContent = 'Escalier supprime !';
    editeur.sauvegarderEtat();
});

// Fermer les menus contextuels escalier/plafond au clic ailleurs
document.addEventListener('pointerdown', function(e) {
    var escMenu = document.getElementById('ctx-escalier-menu');
    if (escMenu.style.display === 'block' && !escMenu.contains(e.target)) {
        escMenu.style.display = 'none';
    }
    var plafMenu = document.getElementById('ctx-plafond-menu');
    if (plafMenu.style.display === 'block' && !plafMenu.contains(e.target)) {
        plafMenu.style.display = 'none';
    }
});

document.getElementById('btn-deplacer-zone').addEventListener('click', function() {
    toutDesactiver();
    modeDeplacerZone = true;
    deplacerZonePhase = 'select';
    container.style.cursor = 'crosshair';
    document.getElementById('info-bar').textContent = 'DEPLACER ZONE — Dessinez un rectangle au sol pour selectionner les elements';
});

document.getElementById('btn-copier-zone').addEventListener('click', function() {
    toutDesactiver();
    modeCopierZone = true;
    copierZonePhase = 'select';
    container.style.cursor = 'crosshair';
    sceneManager.controls.enabled = false;
    document.getElementById('info-bar').textContent = 'COPIER ZONE — Dessinez un rectangle pour selectionner les elements a copier';
});

document.getElementById('btn-effacer-zone').addEventListener('click', function() {
    toutDesactiver();
    modeEffacerZone = true;
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';
    document.getElementById('info-bar').textContent = 'EFFACER ZONE — Cliquez et glissez pour selectionner la zone | Echap = annuler';
});

document.getElementById('btn-undo').addEventListener('click', function() {
    toutDesactiver();
    editeur.annuler();
});

document.getElementById('btn-redo').addEventListener('click', function() {
    toutDesactiver();
    editeur.refaire();
});

// Bouton fenetre : generer les modeles et afficher le popup
document.getElementById('btn-fenetre').addEventListener('click', function() {
    toutDesactiver();
    var modeles = Fenetre.modeles();
    var categories = {
        'standard': { nom: 'Fenetres standard', couleur: '#5bb8f0', ico: '<svg viewBox="0 0 18 14" width="18" height="14"><rect x="1" y="1" width="16" height="12" rx="1" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><line x1="9" y1="1" x2="9" y2="13" stroke="#4a90d9" stroke-width="0.6"/><line x1="1" y1="7" x2="17" y2="7" stroke="#4a90d9" stroke-width="0.6"/></svg>' },
        'grande':   { nom: 'Grandes fenetres',  couleur: '#4a90d9', ico: '<svg viewBox="0 0 24 14" width="24" height="14"><rect x="1" y="1" width="7" height="12" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="9" y="1" width="7" height="12" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/><rect x="17" y="1" width="7" height="12" fill="#87CEEB" fill-opacity="0.4" stroke="#4a90d9" stroke-width="1"/></svg>' }
    };
    var html = '';
    var catsDone = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat || 'autre';
        if (catsDone[cat]) continue;
        catsDone[cat] = true;
        var catInfo = categories[cat] || { nom: cat, couleur: '#aaa', ico: '' };
        html += '<button class="fenetre-cat-btn" data-cat="' + cat + '" style="width:100%; padding:8px; margin-bottom:2px; background:#1a1a2e; color:' + catInfo.couleur + '; border:1px solid ' + catInfo.couleur + '; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:8px;">';
        html += catInfo.ico;
        html += '<span style="flex:1; text-align:left;">' + catInfo.nom + '</span>';
        html += '<span class="fenetre-cat-arrow" style="font-size:10px;">&#9660;</span>';
        html += '</button>';
        html += '<div class="fenetre-cat-list" data-cat="' + cat + '" style="display:none; padding-left:4px;">';
        for (var j = 0; j < modeles.length; j++) {
            var m = modeles[j];
            if (m.cat !== cat) continue;
            html += '<button class="fenetre-modele-btn" data-modele="' + m.id + '" style="width:100%; padding:5px 8px; margin-bottom:3px; background:#16213e; color:#fff; border:1px solid ' + catInfo.couleur + '55; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:flex; align-items:center; gap:8px; text-align:left;">';
            html += '<span style="flex-shrink:0;">' + (m.ico || '') + '</span>';
            html += '<span>' + m.nom + ' <span style="color:#888; font-size:9px;">(' + m.largeur.toFixed(2) + 'x' + m.hauteur.toFixed(2) + ' Y=' + m.y.toFixed(2) + ')</span></span>';
            html += '</button>';
        }
        html += '</div>';
    }
    document.getElementById('fenetre-modeles').innerHTML = html;
    document.getElementById('fenetre-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'FENETRE — Choisissez une categorie puis un modele';
});

// Deplier/replier les categories fenetre
document.getElementById('fenetre-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.fenetre-cat-btn');
    if (btn) {
        var cat = btn.getAttribute('data-cat');
        var list = document.querySelector('.fenetre-cat-list[data-cat="' + cat + '"]');
        if (list) {
            var visible = list.style.display !== 'none';
            var allLists = document.querySelectorAll('.fenetre-cat-list');
            for (var i = 0; i < allLists.length; i++) allLists[i].style.display = 'none';
            var allArrows = document.querySelectorAll('.fenetre-cat-arrow');
            for (var i = 0; i < allArrows.length; i++) allArrows[i].innerHTML = '&#9660;';
            if (!visible) {
                list.style.display = 'block';
                btn.querySelector('.fenetre-cat-arrow').innerHTML = '&#9650;';
            }
        }
        return;
    }
});

// Appliquer la couleur a toutes les fenetres existantes
document.getElementById('btn-nf-appliquer-toutes').addEventListener('click', function() {
    var couleurCadre = document.getElementById('nf-cadre').value;
    var couleurVitre = document.getElementById('nf-vitre').value;
    var opacite = parseFloat(document.getElementById('nf-opacite').value) / 100;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var excl = editeur.exclusions[i];
        if (excl.group3D) {
            Fenetre.changerCouleur(excl.group3D, couleurCadre, couleurVitre, opacite);
        }
    }
    document.getElementById('info-bar').textContent = 'Couleur appliquee a toutes les fenetres !';
});

// Clic sur un modele de fenetre
document.getElementById('fenetre-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.fenetre-modele-btn');
    if (!btn) return;
    var modeleId = btn.getAttribute('data-modele');
    var modeles = Fenetre.modeles();
    var mod = null;
    for (var i = 0; i < modeles.length; i++) {
        if (modeles[i].id === modeleId) { mod = modeles[i]; break; }
    }
    if (!mod) return;

    // Surligner le bouton selectionne
    var btns = document.querySelectorAll('.fenetre-modele-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].style.background = '#16213e';
    }
    btn.style.background = '#5bb8f0';

    fenetreModele = mod;
    modeFenetre = true;
    modePrecisFenetre = false;
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';

    // Afficher le bouton precis
    document.getElementById('btn-nf-mode-precis').style.display = 'block';

    // Creer le ghost preview
    supprimerGhostTrou();
    var geo = new THREE.BoxGeometry(mod.largeur, mod.hauteur, 0.15);
    var mat = new THREE.MeshBasicMaterial({ color: '#5bb8f0', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    ghostTrou = new THREE.Mesh(geo, mat);
    ghostTrou.visible = false;
    sceneManager.scene.add(ghostTrou);

    document.getElementById('info-bar').textContent = 'FENETRE ' + mod.nom + ' — Cliquez sur un mur pour poser | Echap = annuler';
});

// Bouton mode precis fenetre
document.getElementById('btn-nf-mode-precis').addEventListener('click', function() {
    if (!fenetreModele) return;
    modePrecisFenetre = true;
    document.getElementById('btn-nf-mode-precis').style.background = '#ffa500';
    document.getElementById('btn-nf-mode-precis').style.color = '#000';
    document.getElementById('info-bar').textContent = 'FENETRE PRECIS — Cliquez sur le mur cible, puis ajustez X/Y';
});

// ========================================
// PORTE
// ========================================

// Bouton porte : generer les categories depliables et afficher le popup
document.getElementById('btn-porte').addEventListener('click', function() {
    toutDesactiver();
    var modeles = Porte.modeles();
    var categories = {
        'pleine': { nom: 'Portes pleines', couleur: '#D2691E', ico: '<svg viewBox="0 0 16 20" width="16" height="20"><rect x="1" y="1" width="14" height="18" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><circle cx="12" cy="10" r="1" fill="#C0C0C0"/></svg>' },
        'vitree': { nom: 'Portes vitrees', couleur: '#5bb8f0', ico: '<svg viewBox="0 0 16 20" width="16" height="20"><rect x="1" y="1" width="14" height="10" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><rect x="1" y="11" width="14" height="8" fill="#87CEEB" fill-opacity="0.5" stroke="#4a90d9" stroke-width="1"/></svg>' },
        'coulissante': { nom: 'Portes coulissantes', couleur: '#A0764E', ico: '<svg viewBox="0 0 20 20" width="20" height="20"><rect x="1" y="1" width="18" height="18" rx="1" fill="#D2691E" stroke="#8B4513" stroke-width="1"/><line x1="1" y1="3" x2="19" y2="3" stroke="#8B4513" stroke-width="0.6"/><line x1="1" y1="17" x2="19" y2="17" stroke="#8B4513" stroke-width="0.6"/><path d="M12 10 L18 10" stroke="#C0C0C0" stroke-width="0.8" stroke-dasharray="2,1"/></svg>' }
    };
    var html = '';
    var catsDone = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat || 'autre';
        if (catsDone[cat]) continue;
        catsDone[cat] = true;
        var catInfo = categories[cat] || { nom: cat, couleur: '#aaa', ico: '' };
        // Bouton categorie (cliquable pour deplier)
        html += '<button class="porte-cat-btn" data-cat="' + cat + '" style="width:100%; padding:8px; margin-bottom:2px; background:#1a1a2e; color:' + catInfo.couleur + '; border:1px solid ' + catInfo.couleur + '; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:8px;">';
        html += catInfo.ico;
        html += '<span style="flex:1; text-align:left;">' + catInfo.nom + '</span>';
        html += '<span class="porte-cat-arrow" style="font-size:10px;">&#9660;</span>';
        html += '</button>';
        // Liste des modeles (cachee par defaut)
        html += '<div class="porte-cat-list" data-cat="' + cat + '" style="display:none; padding-left:4px;">';
        for (var j = 0; j < modeles.length; j++) {
            var m = modeles[j];
            if (m.cat !== cat) continue;
            html += '<button class="porte-modele-btn" data-modele="' + m.id + '" style="width:100%; padding:5px 8px; margin-bottom:3px; background:#16213e; color:#fff; border:1px solid ' + catInfo.couleur + '55; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:flex; align-items:center; gap:8px; text-align:left;">';
            html += '<span style="flex-shrink:0;">' + (m.ico || '') + '</span>';
            html += '<span>' + m.nom + ' <span style="color:#888; font-size:9px;">(' + m.largeur.toFixed(2) + 'x' + m.hauteur.toFixed(2) + ')</span></span>';
            html += '</button>';
        }
        html += '</div>';
    }
    document.getElementById('porte-modeles').innerHTML = html;
    document.getElementById('porte-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'PORTE — Choisissez une categorie puis un modele';
});

// Deplier/replier les categories porte
document.getElementById('porte-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.porte-cat-btn');
    if (btn) {
        var cat = btn.getAttribute('data-cat');
        var list = document.querySelector('.porte-cat-list[data-cat="' + cat + '"]');
        if (list) {
            var visible = list.style.display !== 'none';
            // Fermer toutes les listes
            var allLists = document.querySelectorAll('.porte-cat-list');
            for (var i = 0; i < allLists.length; i++) allLists[i].style.display = 'none';
            var allArrows = document.querySelectorAll('.porte-cat-arrow');
            for (var i = 0; i < allArrows.length; i++) allArrows[i].innerHTML = '&#9660;';
            // Ouvrir celle cliquee (sauf si elle etait deja ouverte)
            if (!visible) {
                list.style.display = 'block';
                btn.querySelector('.porte-cat-arrow').innerHTML = '&#9650;';
            }
        }
        return;
    }
});

// Appliquer la couleur a toutes les portes existantes
document.getElementById('btn-np-appliquer-toutes').addEventListener('click', function() {
    var couleurCadre = document.getElementById('np-cadre').value;
    var couleurPorte = document.getElementById('np-porte').value;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var excl = editeur.exclusions[i];
        if (excl.group3D && excl.group3D.children[0] && excl.group3D.children[0].userData.isPorte) {
            Porte.changerCouleur(excl.group3D, couleurCadre, couleurPorte);
        }
    }
    document.getElementById('info-bar').textContent = 'Couleur appliquee a toutes les portes !';
});

// Clic sur un modele de porte
document.getElementById('porte-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.porte-modele-btn');
    if (!btn) return;
    var modeleId = btn.getAttribute('data-modele');
    var modeles = Porte.modeles();
    var mod = null;
    for (var i = 0; i < modeles.length; i++) {
        if (modeles[i].id === modeleId) { mod = modeles[i]; break; }
    }
    if (!mod) return;

    // Surligner le bouton selectionne
    var btns = document.querySelectorAll('.porte-modele-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].style.background = '#16213e';
    }
    btn.style.background = '#D2691E';

    porteModele = mod;
    modePorte = true;
    modePrecisPorte = false;
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';

    // Afficher le bouton precis
    document.getElementById('btn-np-mode-precis').style.display = 'block';

    // Creer le ghost preview
    supprimerGhostTrou();
    var geo = new THREE.BoxGeometry(mod.largeur, mod.hauteur, 0.30);
    var mat = new THREE.MeshBasicMaterial({ color: '#D2691E', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    ghostTrou = new THREE.Mesh(geo, mat);
    ghostTrou.visible = false;
    sceneManager.scene.add(ghostTrou);

    document.getElementById('info-bar').textContent = 'PORTE ' + mod.nom + ' — Cliquez sur un mur pour poser | Echap = annuler';
});

// Bouton mode precis porte
document.getElementById('btn-np-mode-precis').addEventListener('click', function() {
    if (!porteModele) return;
    modePrecisPorte = true;
    document.getElementById('btn-np-mode-precis').style.background = '#ffa500';
    document.getElementById('btn-np-mode-precis').style.color = '#000';
    document.getElementById('info-bar').textContent = 'PORTE PRECIS — Cliquez sur le mur cible, puis ajustez X/Y';
});

// Menu contextuel porte (clic droit sur une porte)
// Editer porte
document.getElementById('ctx-porte-editer').addEventListener('click', function() {
    var group = window._ctxPorteGroup;
    if (!group) return;
    document.getElementById('ctx-porte-menu').style.display = 'none';
    var couleurs = Porte.lireCouleurs(group);
    document.getElementById('ep-cadre').value = couleurs.cadre;
    document.getElementById('ep-porte').value = couleurs.porte;
    window._editPorteGroup = group;
    document.getElementById('edit-porte-popup').style.display = 'block';
});

// Appliquer edition porte
document.getElementById('btn-ep-appliquer').addEventListener('click', function() {
    if (!window._editPorteGroup) return;
    Porte.changerCouleur(
        window._editPorteGroup,
        document.getElementById('ep-cadre').value,
        document.getElementById('ep-porte').value
    );
    document.getElementById('edit-porte-popup').style.display = 'none';
    window._editPorteGroup = null;
});

// Supprimer porte
document.getElementById('ctx-porte-supprimer').addEventListener('click', function() {
    var group = window._ctxPorteGroup;
    if (!group) return;
    document.getElementById('ctx-porte-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    // Trouver l'exclusion pour supprimer le trou
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === group.userData.exclusionId) {
            excl = editeur.exclusions[i]; break;
        }
    }
    if (excl) {
        editeur.supprimerTrouParExclusion(excl);
        editeur.supprimerExclusion(excl.id);
    }
    sceneManager.scene.remove(group);
    window._ctxPorteGroup = null;
});

// Deplacer porte (reutilise le meme systeme que deplacer fenetre)
document.getElementById('ctx-porte-deplacer').addEventListener('click', function() {
    var group = window._ctxPorteGroup;
    if (!group) return;
    document.getElementById('ctx-porte-menu').style.display = 'none';

    // Trouver l'exclusion
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === group.userData.exclusionId) {
            excl = editeur.exclusions[i]; break;
        }
    }
    if (!excl) return;

    // Lire les couleurs de la porte avant suppression
    var couleurs = Porte.lireCouleurs(group);
    var infoPorte = {
        largeur: excl.largeur,
        hauteur: excl.hauteur,
        y: excl.y,
        couleurCadre: couleurs.cadre,
        couleurPorte: couleurs.porte
    };

    editeur.sauvegarderEtat();

    // Trouver le mur d'origine pour reboucher les placos/laines
    var murElPorte = null;
    var trouMurPorte = 0;
    for (var e = 0; e < editeur.elements.length; e++) {
        var exclsMur = trouverExclusionsMur(editeur.elements[e]);
        for (var ei = 0; ei < exclsMur.length; ei++) {
            if (exclsMur[ei].id === excl.id) { murElPorte = editeur.elements[e]; break; }
        }
        if (murElPorte) break;
    }
    if (murElPorte) {
        var posOrig = editeur.trouverPositionSurMur(murElPorte, excl.x, excl.z);
        trouMurPorte = posOrig.mur;
    }

    // Supprimer le trou correspondant dans le mur (reboucher)
    editeur.supprimerTrouParExclusion(excl);

    // Supprimer la porte 3D et l'exclusion
    sceneManager.scene.remove(group);
    editeur.supprimerExclusion(excl.id);

    // Reboucher les placos/laines a l'ancienne position
    if (murElPorte) {
        _reboucherPlacosLaines(murElPorte, trouMurPorte);
    }

    toutDesactiver();
    modeDeplacerPorte = true;
    deplacerPorteInfo = infoPorte;

    // Creer le ghost
    supprimerGhostTrou();
    var geo = new THREE.BoxGeometry(deplacerPorteInfo.largeur, deplacerPorteInfo.hauteur, 0.30);
    var mat = new THREE.MeshBasicMaterial({ color: '#D2691E', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    ghostTrou = new THREE.Mesh(geo, mat);
    ghostTrou.visible = false;
    sceneManager.scene.add(ghostTrou);

    sceneManager.controls.enabled = true;
    container.style.cursor = 'grab';
    document.getElementById('info-bar').textContent = 'DEPLACER PORTE — Cliquez sur un mur pour reposer | Echap = annuler';
    window._ctxPorteGroup = null;
});

// Fonction commune : preparer deplacement porte sur X/Y precis
function preparerDeplacementPortePrecis(group) {
    if (!group) return null;
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === group.userData.exclusionId) {
            excl = editeur.exclusions[i]; break;
        }
    }
    if (!excl) return null;

    var couleurs = Porte.lireCouleurs(group);
    var info = {
        largeur: excl.largeur, hauteur: excl.hauteur, y: excl.y,
        couleurCadre: couleurs.cadre, couleurPorte: couleurs.porte,
        localX: 0
    };

    // Trouver le mur d'origine et calculer la position locale X
    var murEl = null;
    var excls = [];
    for (var e = 0; e < editeur.elements.length; e++) {
        excls = trouverExclusionsMur(editeur.elements[e]);
        for (var ei = 0; ei < excls.length; ei++) {
            if (excls[ei].id === excl.id) { murEl = editeur.elements[e]; break; }
        }
        if (murEl) break;
    }

    var trouMurP = 0;
    if (murEl) {
        var pos = editeur.trouverPositionSurMur(murEl, excl.x, excl.z);
        info.localX = pos.localX - excl.largeur / 2;
        trouMurP = pos.mur;
        info.segIndex = pos.mur;
    }

    editeur.sauvegarderEtat();
    editeur.supprimerTrouParExclusion(excl);
    sceneManager.scene.remove(group);
    editeur.supprimerExclusion(excl.id);

    // Reboucher les placos/laines a l'ancienne position
    if (murEl) {
        _reboucherPlacosLaines(murEl, trouMurP);
    }

    return { info: info, murEl: murEl };
}

// Porte deplacer X
// Fonction pour lancer deplacement porte sur un axe (souris)
function lancerDeplacerPorteAxe(axe) {
    var group = window._ctxPorteGroup;
    document.getElementById('ctx-porte-menu').style.display = 'none';
    var result = preparerDeplacementPortePrecis(group);
    if (!result || !result.murEl) return;
    var infoP = result.info;

    toutDesactiver();
    modeDeplacerPorte = true;
    deplacerPorteInfo = infoP;
    deplacerPorteAxe = axe;
    deplacerPorteMurEl = result.murEl;
    document.getElementById('np-cadre').value = infoP.couleurCadre;
    document.getElementById('np-porte').value = infoP.couleurPorte;

    supprimerGhostTrou();
    var geo = new THREE.BoxGeometry(infoP.largeur, infoP.hauteur, 0.30);
    var mat = new THREE.MeshBasicMaterial({ color: '#D2691E', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    ghostTrou = new THREE.Mesh(geo, mat);
    sceneManager.scene.add(ghostTrou);
    var localY = infoP.y - (result.murEl.params.y || 0);
    positionnerGhostPrecis(result.murEl, infoP.localX, localY, infoP.largeur, infoP.hauteur, infoP.segIndex || 0);

    sceneManager.controls.enabled = true;
    container.style.cursor = axe === 'x' ? 'ew-resize' : 'ns-resize';
    document.getElementById('info-bar').textContent = 'DEPLACER PORTE ' + axe.toUpperCase() + ' — Bougez la souris puis cliquez | Echap = annuler';
    window._ctxPorteGroup = null;
}

document.getElementById('ctx-porte-deplacer-x').addEventListener('click', function() { lancerDeplacerPorteAxe('x'); });
document.getElementById('ctx-porte-deplacer-y').addEventListener('click', function() { lancerDeplacerPorteAxe('y'); });

// Fonction commune : preparer deplacement fenetre sur X/Y precis
function preparerDeplacementFenetrePrecis(exclId) {
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === exclId) {
            excl = editeur.exclusions[i]; break;
        }
    }
    if (!excl || !excl.group3D) return null;

    var couleurs = Fenetre.lireCouleurs(excl.group3D);
    var info = {
        largeur: excl.largeur, hauteur: excl.hauteur, y: excl.y,
        couleurCadre: couleurs.cadre, couleurVitre: couleurs.vitre,
        opaciteVitre: couleurs.opacite / 100,
        localX: 0
    };

    var murEl = null;
    for (var e = 0; e < editeur.elements.length; e++) {
        var excls = trouverExclusionsMur(editeur.elements[e]);
        for (var ei = 0; ei < excls.length; ei++) {
            if (excls[ei].id === excl.id) { murEl = editeur.elements[e]; break; }
        }
        if (murEl) break;
    }

    var trouMurF = 0;
    if (murEl) {
        var pos = editeur.trouverPositionSurMur(murEl, excl.x, excl.z);
        info.localX = pos.localX - excl.largeur / 2;
        trouMurF = pos.mur;
        info.segIndex = pos.mur;
    }

    editeur.sauvegarderEtat();
    editeur.supprimerTrouParExclusion(excl);
    sceneManager.scene.remove(excl.group3D);
    editeur.supprimerExclusion(excl.id);

    // Reboucher les placos/laines a l'ancienne position
    if (murEl) {
        _reboucherPlacosLaines(murEl, trouMurF);
    }

    return { info: info, murEl: murEl };
}

// Fonction pour lancer deplacement fenetre sur un axe (souris)
function lancerDeplacerFenetreAxe(axe) {
    var exclId = window._clickedExclusionId;
    document.getElementById('ctx-fenetre-menu').style.display = 'none';
    var result = preparerDeplacementFenetrePrecis(exclId);
    if (!result || !result.murEl) return;
    var infoF = result.info;

    toutDesactiver();
    modeDeplacerFenetre = true;
    deplacerFenetreInfo = infoF;
    deplacerFenetreAxe = axe;
    deplacerFenetreMurEl = result.murEl;
    document.getElementById('nf-cadre').value = infoF.couleurCadre;
    document.getElementById('nf-vitre').value = infoF.couleurVitre;
    document.getElementById('nf-opacite').value = Math.round(infoF.opaciteVitre * 100);

    supprimerGhostTrou();
    var geo = new THREE.BoxGeometry(infoF.largeur, infoF.hauteur, 0.30);
    var mat = new THREE.MeshBasicMaterial({ color: '#5bb8f0', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    ghostTrou = new THREE.Mesh(geo, mat);
    sceneManager.scene.add(ghostTrou);
    var localY = infoF.y - (result.murEl.params.y || 0);
    positionnerGhostPrecis(result.murEl, infoF.localX, localY, infoF.largeur, infoF.hauteur, infoF.segIndex || 0);

    sceneManager.controls.enabled = true;
    container.style.cursor = axe === 'x' ? 'ew-resize' : 'ns-resize';
    document.getElementById('info-bar').textContent = 'DEPLACER FENETRE ' + axe.toUpperCase() + ' — Bougez la souris puis cliquez | Echap = annuler';
    window._clickedExclusionId = null;
}

document.getElementById('ctx-fenetre-deplacer-x').addEventListener('click', function() { lancerDeplacerFenetreAxe('x'); });
document.getElementById('ctx-fenetre-deplacer-y').addEventListener('click', function() { lancerDeplacerFenetreAxe('y'); });

document.getElementById('btn-mesurer').addEventListener('click', function() {
    toutDesactiver();
    modeMesure = true;
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';
    // Reafficher le panneau si des mesures existent
    if (mesuresListe.length > 0) {
        document.getElementById('mesures-panel').style.display = 'block';
    }
    document.getElementById('info-bar').textContent = 'MESURE — Cliquez pour poser le point A | Echap = annuler';
});

// Liste mesures : supprimer un item ou tout effacer
document.getElementById('mesures-list').addEventListener('click', function(ev) {
    var target = ev.target;
    var id = parseInt(target.getAttribute('data-id'));
    if (!id) return;
    if (target.classList.contains('mesure-del')) {
        supprimerMesureItem(id);
    } else if (target.classList.contains('mesure-trou')) {
        // Trouver la mesure et creer un trou
        for (var i = 0; i < mesuresListe.length; i++) {
            if (mesuresListe[i].id === id) {
                creerTrouDepuisMesure(mesuresListe[i]);
                break;
            }
        }
    }
});

document.getElementById('btn-mesures-clear').addEventListener('click', function() {
    supprimerToutesMesures();
});

// ========================================
// DEVIS — Estimation des couts materiaux
// ========================================

var PRIX_BRIQUES = {
    standard:   { unite: 0.45, nom: 'Brique standard' },
    pleine:     { unite: 0.55, nom: 'Brique pleine' },
    creuse:     { unite: 1.20, nom: 'Brique creuse' },
    platriere:  { unite: 0.90, nom: 'Brique platriere' },
    parpaing:   { unite: 1.10, nom: 'Parpaing' },
    beton_cell: { unite: 2.50, nom: 'Beton cellulaire' },
    monomur:    { unite: 3.80, nom: 'Monomur' },
    pierre:     { unite: 8.00, nom: 'Pierre de taille' }
};

var PRIX_PLACOS = {
    'ba13':      { m2: 5.50,  nom: 'BA13 standard' },
    'ba13-demi': { m2: 5.50,  nom: 'BA13 demi' },
    'ba10':      { m2: 4.80,  nom: 'BA10' },
    'ba18':      { m2: 7.20,  nom: 'BA18' },
    'ba25':      { m2: 9.50,  nom: 'BA25' },
    'hydro':       { m2: 8.50,  nom: 'Hydrofuge' },
    'feu':         { m2: 9.00,  nom: 'Coupe-feu' },
    'phonique':    { m2: 10.50, nom: 'Phonique' },
    'plinthe-8':   { m2: 3.50,  nom: 'Plinthe 8cm' },
    'plinthe-10':  { m2: 4.00,  nom: 'Plinthe 10cm' },
    'plinthe-15':  { m2: 5.50,  nom: 'Plinthe 15cm' },
    'plinthe-pvc': { m2: 3.00,  nom: 'Plinthe PVC' },
    'plinthe-bois':{ m2: 7.00,  nom: 'Plinthe bois' }
};

var PRIX_LAINES = {
    'gr32-100':    { m2: 8.00,  nom: 'GR32 100mm' },
    'gr32-120':    { m2: 10.00, nom: 'GR32 120mm' },
    'gr32-200':    { m2: 15.00, nom: 'GR32 200mm' },
    'gr32-240':    { m2: 18.00, nom: 'GR32 240mm' },
    'souple-60':   { m2: 5.50,  nom: 'Souple 60mm' },
    'semi-rigide': { m2: 9.00,  nom: 'Semi-rigide 75mm' },
    'rigide':      { m2: 7.50,  nom: 'Rigide 45mm' },
    'acoustique':  { m2: 11.00, nom: 'Acoustique 45mm' }
};

var PRIX_PORTES = 150;    // prix moyen porte
var PRIX_FENETRES = 200;  // prix moyen fenetre
var PRIX_CARRELAGE_SOL = 25; // prix moyen m² carrelage sol (pose + fourniture)

function _genererDevis() {
    var lignes = []; // {categorie, nom, qte, unite, prixUnit, total}
    var grandTotal = 0;

    // 1. BRIQUES — par type
    var briquesParType = {};
    for (var i = 0; i < editeur.elements.length; i++) {
        var el = editeur.elements[i];
        var type = el.params.briqueType || 'standard';
        var bt = BRIQUES_TYPES[type] || BRIQUES_TYPES.standard;
        // Compter les briques de cet element
        var nb = el.brique ? el.brique.compter() : 0;
        if (el.brique2) nb += el.brique2.compter();
        if (!briquesParType[type]) briquesParType[type] = 0;
        briquesParType[type] += nb;
    }
    for (var type in briquesParType) {
        var nb = briquesParType[type];
        var prix = PRIX_BRIQUES[type] || PRIX_BRIQUES.standard;
        var total = nb * prix.unite;
        lignes.push({ cat: 'Maconnerie', nom: prix.nom, qte: nb, unite: 'u', prixUnit: prix.unite, total: total, prixKey: type, prixSrc: 'brique' });
        grandTotal += total;
    }

    // Surface totale des murs (m²) pour info
    var surfaceMurs = 0;
    for (var i = 0; i < editeur.elements.length; i++) {
        var p = editeur.elements[i].params;
        var dist = p.distance || 0;
        var haut = p.hauteur || 2.5;
        var nbC = p.nbCotes || 1;
        surfaceMurs += dist * haut * nbC;
    }
    if (surfaceMurs > 0) {
        lignes.push({ cat: 'Maconnerie', nom: 'Surface murs totale', qte: surfaceMurs.toFixed(1), unite: 'm²', prixUnit: '-', total: 0, info: true });
    }

    // 2. PORTES — une ligne par porte
    var numPorte = 0;
    var modelesPortes = Porte.modeles();
    var modPortesMap = {};
    for (var mp = 0; mp < modelesPortes.length; mp++) modPortesMap[modelesPortes[mp].id] = modelesPortes[mp];
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var ex = editeur.exclusions[i];
        var isPorte = ex._type === 'porte' || (ex.group3D && ex.group3D.userData.porteCreation);
        if (!isPorte) continue;
        numPorte++;
        var creation = (ex.group3D && ex.group3D.userData.porteCreation) || ex._creation || {};
        var modInfo = modPortesMap[creation.modeleId];
        var nomPorte = modInfo ? modInfo.nom : (creation.modeleId || 'Porte');
        var dims = '';
        if (creation.largeur && creation.hauteur) dims = ' (' + (creation.largeur * 100).toFixed(0) + 'x' + (creation.hauteur * 100).toFixed(0) + 'cm)';
        lignes.push({ cat: 'Menuiserie - Portes', nom: 'Porte ' + numPorte + ' — ' + nomPorte + dims, qte: 1, unite: 'u', prixUnit: PRIX_PORTES, total: PRIX_PORTES, prixKey: 'porte_' + i, prixSrc: 'porte' });
        grandTotal += PRIX_PORTES;
    }

    // 3. FENETRES — une ligne par fenetre
    var numFenetre = 0;
    var modelesFenetres = Fenetre.modeles();
    var modFenetresMap = {};
    for (var mf = 0; mf < modelesFenetres.length; mf++) modFenetresMap[modelesFenetres[mf].id] = modelesFenetres[mf];
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var ex = editeur.exclusions[i];
        var isFenetre = ex._type === 'fenetre' || (ex.group3D && ex.group3D.userData.fenetreCreation && !ex.group3D.userData.porteCreation);
        if (!isFenetre) continue;
        numFenetre++;
        var creation = (ex.group3D && ex.group3D.userData.fenetreCreation) || ex._creation || {};
        var modInfo = modFenetresMap[creation.modeleId];
        var nomFenetre = modInfo ? modInfo.nom : (creation.modeleId || 'Fenetre');
        var dims = '';
        if (creation.largeur && creation.hauteur) dims = ' (' + (creation.largeur * 100).toFixed(0) + 'x' + (creation.hauteur * 100).toFixed(0) + 'cm)';
        lignes.push({ cat: 'Menuiserie - Fenetres', nom: 'Fenetre ' + numFenetre + ' — ' + nomFenetre + dims, qte: 1, unite: 'u', prixUnit: PRIX_FENETRES, total: PRIX_FENETRES, prixKey: 'fenetre_' + i, prixSrc: 'fenetre' });
        grandTotal += PRIX_FENETRES;
    }

    // 4. PLACOS — par type et surface
    var placosParType = {};
    for (var i = 0; i < placoElements.length; i++) {
        var pi = placoElements[i].userData.placoInfo;
        if (!pi) continue;
        var modId = pi.modeleId || 'ba13';
        var surface = (pi.largeur || 1.2) * (pi.hauteur || 2.5);
        if (!placosParType[modId]) placosParType[modId] = { surface: 0, nb: 0 };
        placosParType[modId].surface += surface;
        placosParType[modId].nb++;
    }
    for (var modId in placosParType) {
        var info = placosParType[modId];
        var prix = PRIX_PLACOS[modId] || PRIX_PLACOS['ba13'];
        var total = info.surface * prix.m2;
        lignes.push({ cat: 'Placo', nom: prix.nom + ' (' + info.nb + ' plaque' + (info.nb > 1 ? 's' : '') + ')', qte: info.surface.toFixed(1), unite: 'm²', prixUnit: prix.m2, total: total, prixKey: modId, prixSrc: 'placo' });
        grandTotal += total;
    }

    // 5. LAINES — par type et surface
    var lainesParType = {};
    for (var i = 0; i < laineElements.length; i++) {
        var li = laineElements[i].userData.laineInfo;
        if (!li) continue;
        var modId = li.modeleId || 'gr32-100';
        var surface = (li.largeur || 1.2) * (li.hauteur || 2.5);
        if (!lainesParType[modId]) lainesParType[modId] = { surface: 0, nb: 0 };
        lainesParType[modId].surface += surface;
        lainesParType[modId].nb++;
    }
    for (var modId in lainesParType) {
        var info = lainesParType[modId];
        var prix = PRIX_LAINES[modId] || PRIX_LAINES['gr32-100'];
        var total = info.surface * prix.m2;
        lignes.push({ cat: 'Isolation', nom: prix.nom + ' (' + info.nb + ' panneau' + (info.nb > 1 ? 'x' : '') + ')', qte: info.surface.toFixed(1), unite: 'm²', prixUnit: prix.m2, total: total, prixKey: modId, prixSrc: 'laine' });
        grandTotal += total;
    }

    // 6. CARRELAGE SOL — par piece avec details longueurs
    for (var i = 0; i < carrelageSolElements.length; i++) {
        var csk = carrelageSolElements[i].userData.csSol;
        if (!csk || !csk.points) continue;
        var pts = csk.points;
        // Calculer surface
        var surfCS = 0;
        for (var j = 0; j < pts.length; j++) {
            var curr = pts[j], next = pts[(j + 1) % pts.length];
            surfCS += (curr.x * next.z - next.x * curr.z);
        }
        surfCS = Math.abs(surfCS) / 2;
        // Calculer longueurs de chaque cote + perimetre
        var cotes = [];
        var perimetre = 0;
        for (var j = 0; j < pts.length; j++) {
            var p1 = pts[j], p2 = pts[(j + 1) % pts.length];
            var lg = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.z - p1.z) * (p2.z - p1.z));
            cotes.push(lg);
            perimetre += lg;
        }
        // Dimensions carreau
        var tWcm = csk.tW ? Math.round(csk.tW * 100) : '?';
        var tHcm = csk.tH ? Math.round(csk.tH * 100) : '?';
        // Nombre de carreaux estime
        var surfCarreau = (csk.tW || 0.30) * (csk.tH || 0.30);
        var nbCarreaux = Math.ceil(surfCS / surfCarreau);
        if (surfCS > 0.01) {
            // Ligne principale avec prix
            var total = surfCS * PRIX_CARRELAGE_SOL;
            lignes.push({ cat: 'Carrelage sol', nom: 'Piece ' + (i + 1) + ' — ' + (csk.modeleId || 'standard') + ' ' + tWcm + 'x' + tHcm + 'cm', qte: surfCS.toFixed(1), unite: 'm²', prixUnit: PRIX_CARRELAGE_SOL, total: total, prixKey: 'carrelage_sol_' + i, prixSrc: 'carrelage_sol' });
            grandTotal += total;
            // Lignes info : longueurs des cotes
            var cotesStr = cotes.map(function(c, idx) { return 'Cote ' + (idx + 1) + ': ' + c.toFixed(2) + 'm'; }).join(' | ');
            lignes.push({ cat: 'Carrelage sol', nom: cotesStr, qte: perimetre.toFixed(1), unite: 'm', prixUnit: '-', total: 0, info: true });
            // Ligne info : nombre de carreaux estime
            lignes.push({ cat: 'Carrelage sol', nom: 'Environ ' + nbCarreaux + ' carreaux (' + tWcm + 'x' + tHcm + 'cm)', qte: nbCarreaux, unite: 'u', prixUnit: '-', total: 0, info: true });
        }
    }

    // 7. Pieces detectees (info)
    var pieces = editeur.detecterPiecesFermees();
    var surfaceSol = 0;
    for (var i = 0; i < pieces.length; i++) surfaceSol += pieces[i].aire;
    if (surfaceSol > 0) {
        lignes.push({ cat: 'Surfaces', nom: pieces.length + ' piece(s) — surface au sol', qte: surfaceSol.toFixed(1), unite: 'm²', prixUnit: '-', total: 0, info: true });
    }

    return { lignes: lignes, total: grandTotal };
}

function _recalculerTotalDevis() {
    var rows = document.querySelectorAll('.devis-ligne-row');
    var grandTotal = 0;
    for (var i = 0; i < rows.length; i++) {
        var cb = rows[i].querySelector('.devis-ligne-cb');
        var totalSpan = rows[i].querySelector('.devis-ligne-total');
        if (!totalSpan) continue;
        if (cb && !cb.checked) continue; // ligne decochee => ignoree
        grandTotal += parseFloat(totalSpan.getAttribute('data-total')) || 0;
    }
    var totalDiv = document.getElementById('devis-total');
    totalDiv.innerHTML =
        '<div style="font-size:11px; color:#888; margin-bottom:4px;">Estimation HT (prix modifiables)</div>' +
        '<div style="font-size:18px; color:#43B047; font-weight:bold;">' + grandTotal.toFixed(2) + ' €</div>' +
        '<div style="font-size:10px; color:#888; margin-top:2px;">TTC (20%) : ' + (grandTotal * 1.2).toFixed(2) + ' €</div>';
}

function _afficherDevis() {
    var devis = _genererDevis();
    var contenu = document.getElementById('devis-contenu');
    contenu.innerHTML = '';

    var catCourante = '';
    for (var i = 0; i < devis.lignes.length; i++) {
        var l = devis.lignes[i];

        // Titre de categorie avec checkbox globale
        if (l.cat !== catCourante) {
            catCourante = l.cat;
            var titre = document.createElement('div');
            titre.style.cssText = 'display:flex; align-items:center; gap:6px; color:#ffa500; font-weight:bold; font-size:11px; margin-top:8px; margin-bottom:4px; padding-bottom:2px; border-bottom:1px solid rgba(255,165,0,0.2); letter-spacing:0.5px;';
            var catCb = document.createElement('input');
            catCb.type = 'checkbox';
            catCb.checked = true;
            catCb.className = 'devis-cat-cb';
            catCb.setAttribute('data-cat', catCourante);
            catCb.style.cssText = 'accent-color:#ffa500; cursor:pointer;';
            titre.appendChild(catCb);
            var catLabel = document.createElement('span');
            catLabel.textContent = catCourante.toUpperCase();
            catLabel.style.cursor = 'pointer';
            titre.appendChild(catLabel);
            contenu.appendChild(titre);

            // Click sur le label toggle aussi
            (function(cb) {
                catLabel.addEventListener('click', function() { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
            })(catCb);

            // Toggle toutes les lignes de cette categorie
            (function(cat) {
                catCb.addEventListener('change', function() {
                    var checked = this.checked;
                    var rows = contenu.querySelectorAll('.devis-ligne-row[data-cat="' + cat + '"]');
                    for (var j = 0; j < rows.length; j++) {
                        var cb = rows[j].querySelector('.devis-ligne-cb');
                        if (cb) {
                            cb.checked = checked;
                            rows[j].style.opacity = checked ? '1' : '0.35';
                        }
                    }
                    _recalculerTotalDevis();
                });
            })(catCourante);
        }

        var row = document.createElement('div');
        if (l.info) {
            row.style.cssText = 'display:flex; justify-content:space-between; padding:3px 4px; color:#888; font-size:10px; font-style:italic;';
            row.setAttribute('data-cat', l.cat);
            row.innerHTML = '<span>' + l.nom + '</span><span>' + l.qte + ' ' + l.unite + '</span>';
        } else {
            row.className = 'devis-ligne-row';
            row.setAttribute('data-cat', l.cat);
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:4px; border-radius:3px; margin-bottom:2px; background:rgba(255,165,0,0.05); gap:4px; transition:opacity 0.15s;';
            row.innerHTML =
                '<input type="checkbox" class="devis-ligne-cb" checked style="accent-color:#ffa500; cursor:pointer; flex-shrink:0;">' +
                '<span style="flex:1; color:#ccc; font-size:10px;">' + l.nom + '</span>' +
                '<span style="min-width:40px; text-align:right; color:#aaa; font-size:10px;">' + l.qte + ' ' + l.unite + '</span>' +
                '<span style="display:flex; align-items:center; gap:2px; min-width:65px; justify-content:flex-end;">' +
                    '<span style="color:#888; font-size:10px;">×</span>' +
                    '<input type="number" class="devis-prix-input" value="' + (typeof l.prixUnit === 'number' ? l.prixUnit : 0) + '" step="0.01" min="0" ' +
                    'data-qte="' + l.qte + '" data-idx="' + i + '" data-key="' + (l.prixKey || '') + '" data-src="' + (l.prixSrc || '') + '" ' +
                    'style="width:50px; padding:2px 3px; background:#16213e; color:#ffa500; border:1px solid #444; border-radius:3px; font-family:monospace; font-size:10px; text-align:right;">' +
                    '<span style="color:#888; font-size:10px;">€</span>' +
                '</span>' +
                '<span class="devis-ligne-total" data-total="' + l.total.toFixed(2) + '" style="min-width:55px; text-align:right; color:#43B047; font-weight:bold; font-size:11px;">' + l.total.toFixed(2) + '€</span>';
        }
        contenu.appendChild(row);
    }

    if (devis.lignes.length === 0) {
        contenu.innerHTML = '<div style="color:#666; text-align:center; padding:20px;">Aucun element dans la scene.<br>Construisez des murs pour voir le devis.</div>';
    }

    // Listeners sur les checkboxes individuelles
    var cbs = contenu.querySelectorAll('.devis-ligne-cb');
    for (var i = 0; i < cbs.length; i++) {
        cbs[i].addEventListener('change', function() {
            var row = this.closest('.devis-ligne-row');
            row.style.opacity = this.checked ? '1' : '0.35';
            // Mettre a jour la checkbox categorie
            var cat = row.getAttribute('data-cat');
            var catRows = contenu.querySelectorAll('.devis-ligne-row[data-cat="' + cat + '"]');
            var allChecked = true, noneChecked = true;
            for (var j = 0; j < catRows.length; j++) {
                var c = catRows[j].querySelector('.devis-ligne-cb');
                if (c && c.checked) noneChecked = false;
                if (c && !c.checked) allChecked = false;
            }
            var catCb = contenu.querySelector('.devis-cat-cb[data-cat="' + cat + '"]');
            if (catCb) {
                catCb.checked = allChecked;
                catCb.indeterminate = !allChecked && !noneChecked;
            }
            _recalculerTotalDevis();
        });
    }

    // Listeners sur les inputs de prix
    var inputs = contenu.querySelectorAll('.devis-prix-input');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('input', function() {
            var newPrix = parseFloat(this.value) || 0;
            var qte = parseFloat(this.getAttribute('data-qte')) || 0;
            var newTotal = qte * newPrix;
            // Mettre a jour le total de la ligne
            var totalSpan = this.closest('div').querySelector('.devis-ligne-total');
            totalSpan.textContent = newTotal.toFixed(2) + '€';
            totalSpan.setAttribute('data-total', newTotal.toFixed(2));
            // Sauvegarder le prix modifie dans le dictionnaire
            var key = this.getAttribute('data-key');
            var src = this.getAttribute('data-src');
            if (src === 'brique' && key && PRIX_BRIQUES[key]) PRIX_BRIQUES[key].unite = newPrix;
            else if (src === 'placo' && key && PRIX_PLACOS[key]) PRIX_PLACOS[key].m2 = newPrix;
            else if (src === 'laine' && key && PRIX_LAINES[key]) PRIX_LAINES[key].m2 = newPrix;
            else if (src === 'porte') PRIX_PORTES = newPrix;
            else if (src === 'fenetre') PRIX_FENETRES = newPrix;
            else if (src === 'carrelage_sol') PRIX_CARRELAGE_SOL = newPrix;
            // Recalculer le total global
            _recalculerTotalDevis();
        });
    }

    _recalculerTotalDevis();
}

function _devisEnTexte() {
    var devis = _genererDevis();
    // Recuperer l'etat des checkboxes (lignes cochees/decochees)
    var rows = document.querySelectorAll('.devis-ligne-row');
    var lignesExclues = {};
    for (var j = 0; j < rows.length; j++) {
        var cb = rows[j].querySelector('.devis-ligne-cb');
        if (cb && !cb.checked) {
            lignesExclues[rows[j].querySelector('.devis-prix-input').getAttribute('data-idx')] = true;
        }
    }

    var txt = '=== ESTIMATION DES COUTS ===\n\n';
    var catCourante = '';
    var totalExport = 0;
    for (var i = 0; i < devis.lignes.length; i++) {
        var l = devis.lignes[i];
        var exclue = lignesExclues[String(i)];
        if (l.cat !== catCourante) {
            catCourante = l.cat;
            txt += '\n--- ' + catCourante.toUpperCase() + ' ---\n';
        }
        if (l.info) {
            txt += '  ' + l.nom + ' : ' + l.qte + ' ' + l.unite + '\n';
        } else if (exclue) {
            txt += '  [EXCLU] ' + l.nom + ' : ' + l.qte + ' ' + l.unite + ' x ' + (typeof l.prixUnit === 'number' ? l.prixUnit.toFixed(2) : l.prixUnit) + '€ = ' + l.total.toFixed(2) + '€\n';
        } else {
            txt += '  ' + l.nom + ' : ' + l.qte + ' ' + l.unite + ' x ' + (typeof l.prixUnit === 'number' ? l.prixUnit.toFixed(2) : l.prixUnit) + '€ = ' + l.total.toFixed(2) + '€\n';
            totalExport += l.total;
        }
    }
    txt += '\n================================\n';
    txt += 'TOTAL HT : ' + totalExport.toFixed(2) + ' €\n';
    txt += 'TOTAL TTC (20%) : ' + (totalExport * 1.2).toFixed(2) + ' €\n';
    return txt;
}

document.getElementById('btn-compter').addEventListener('click', function() {
    var panel = document.getElementById('devis-panel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        return;
    }
    _afficherDevis();
    panel.style.display = 'block';
});

document.getElementById('devis-close').addEventListener('click', function() {
    document.getElementById('devis-panel').style.display = 'none';
});

document.getElementById('devis-copier').addEventListener('click', function() {
    var txt = _devisEnTexte();
    navigator.clipboard.writeText(txt).then(function() {
        document.getElementById('info-bar').textContent = 'Devis copie dans le presse-papier !';
    });
});

// Devis → TXT
document.getElementById('devis-exp-txt').addEventListener('click', function() {
    var txt = _devisEnTexte();
    var blob = new Blob([txt], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'devis-estimation.txt';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('info-bar').textContent = 'Devis exporte en TXT !';
});

// Devis → PDF
document.getElementById('devis-exp-pdf').addEventListener('click', function() {
    document.getElementById('exp-pdf').click();
});

// Devis → HTML
document.getElementById('devis-exp-html').addEventListener('click', function() {
    document.getElementById('exp-html').click();
});

// ========================================
// SIMULATION DE CONSTRUCTION
// ========================================

var simEnCours = false;
var simPause = false;
var simTimer = null;
var simBriques = [];       // toutes les briques triees
var simIndex = 0;          // brique courante
var simInstMesh = null;    // InstancedMesh temporaire
var simJoints = [];        // joints caches
var simOrigVisibility = []; // visibilite originale des elements
var simExclusions = [];    // exclusions a afficher au bon moment

function simCollecterBriques() {
    var briques = [];
    for (var e = 0; e < editeur.elements.length; e++) {
        var el = editeur.elements[e];
        var sources = [el.brique];
        if (el.brique2) sources.push(el.brique2);

        for (var s = 0; s < sources.length; s++) {
            var brique = sources[s];
            if (!brique || !brique._allBrickData || brique._allBrickData.length === 0) continue;

            // Recuperer couleur
            var couleur = brique.material ? '#' + brique.material.color.getHexString() : '#8B4513';

            // Recuperer les murGroups pour transformer en coordonnees monde
            var grp = brique.group;
            grp.traverse(function(child) {
                if (child.isInstancedMesh && child.userData.isBrickGroup) {
                    var murGroup = child.parent;
                    var worldMatrix = new THREE.Matrix4();
                    murGroup.updateMatrixWorld(true);
                    worldMatrix.copy(murGroup.matrixWorld);

                    var dummy = new THREE.Object3D();
                    for (var i = 0; i < child.count; i++) {
                        child.getMatrixAt(i, dummy.matrix);
                        dummy.matrix.premultiply(worldMatrix);
                        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                        briques.push({
                            wx: dummy.position.x,
                            wy: dummy.position.y,
                            wz: dummy.position.z,
                            sx: dummy.scale.x,
                            sy: dummy.scale.y,
                            sz: dummy.scale.z,
                            qx: dummy.quaternion.x,
                            qy: dummy.quaternion.y,
                            qz: dummy.quaternion.z,
                            qw: dummy.quaternion.w,
                            couleur: couleur
                        });
                    }
                }
            });
        }
    }
    // Trier du bas vers le haut, puis de gauche a droite
    briques.sort(function(a, b) {
        var dy = a.wy - b.wy;
        if (Math.abs(dy) > 0.01) return dy;
        return a.wx - b.wx;
    });
    return briques;
}

function simDemarrer() {
    if (simEnCours) return;
    toutDesactiver();

    // 1) Collecter les briques AVANT de cacher
    simBriques = simCollecterBriques();
    if (simBriques.length === 0) {
        document.getElementById('info-bar').textContent = 'Rien a simuler !';
        return;
    }

    simEnCours = true;
    simPause = false;
    simIndex = 0;

    // 2) TOUT CACHER — retirer de la scene les elements existants
    simOrigVisibility = [];
    for (var e = 0; e < editeur.elements.length; e++) {
        var el = editeur.elements[e];
        var grp = el.group || el.brique.group;
        simOrigVisibility.push({ group: grp, parent: grp.parent });
        if (grp.parent) grp.parent.remove(grp);
    }

    // Cacher les exclusions (fenetres/portes)
    simExclusions = [];
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var excl = editeur.exclusions[i];
        if (excl.group3D) {
            simExclusions.push({
                group: excl.group3D,
                parent: excl.group3D.parent,
                y: excl.y,
                hauteur: excl.hauteur,
                shown: false
            });
            if (excl.group3D.parent) excl.group3D.parent.remove(excl.group3D);
        }
    }

    // Cacher les placos
    simPlacos = [];
    for (var i = 0; i < placoElements.length; i++) {
        var pg = placoElements[i];
        var pi = pg.userData.placoInfo;
        if (pi) {
            simPlacos.push({
                group: pg,
                parent: pg.parent,
                y: pi.y,
                hauteur: pi.hauteur,
                shown: false
            });
            if (pg.parent) pg.parent.remove(pg);
        }
    }

    // Cacher les carrelages muraux
    simCarrelages = [];
    for (var i = 0; i < carrelageElements.length; i++) {
        var cg = carrelageElements[i];
        var ci = cg.userData.carrelageInfo;
        if (ci) {
            simCarrelages.push({ group: cg, parent: cg.parent, y: ci.y || 0, hauteur: ci.hauteur || 2.5, shown: false });
            if (cg.parent) cg.parent.remove(cg);
        }
    }

    // Cacher les plinthes
    simPlinthes = [];
    for (var i = 0; i < plinthElements.length; i++) {
        var pg = plinthElements[i];
        simPlinthes.push({ group: pg, parent: pg.parent, shown: false });
        if (pg.parent) pg.parent.remove(pg);
    }

    // Cacher les papiers peints
    simPapiers = [];
    for (var i = 0; i < ppElements.length; i++) {
        var pg = ppElements[i];
        var pi = pg.userData.papierPeintInfo;
        if (pi) {
            simPapiers.push({ group: pg, parent: pg.parent, y: pi.y || 0, hauteur: pi.hauteur || 2.5, shown: false });
            if (pg.parent) pg.parent.remove(pg);
        }
    }

    // Cacher les carrelages sol
    simCarrelagesSol = [];
    for (var i = 0; i < carrelageSolElements.length; i++) {
        var cg = carrelageSolElements[i];
        simCarrelagesSol.push({ group: cg, parent: cg.parent, shown: false });
        if (cg.parent) cg.parent.remove(cg);
    }

    // Cacher les laines de verre
    simLaines = [];
    for (var i = 0; i < laineElements.length; i++) {
        var lg = laineElements[i];
        var li = lg.userData.laineInfo;
        if (li) {
            simLaines.push({
                group: lg,
                parent: lg.parent,
                y: li.y,
                hauteur: li.hauteur,
                shown: false
            });
            if (lg.parent) lg.parent.remove(lg);
        }
    }

    // 3) Afficher la barre de controle et le message
    document.getElementById('sim-bar').style.display = 'block';
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('sim-compteur').textContent = '0 / ' + simBriques.length;
    document.getElementById('sim-progress').style.width = '0%';
    document.getElementById('sim-pause').innerHTML = '&#9646;&#9646;';
    document.getElementById('info-bar').textContent = 'SIMULATION — Preparation du chantier...';

    // 4) Attendre 1.5s pour voir la scene vide, puis lancer la construction
    setTimeout(function() {
        simPreparerMeshes();
        document.getElementById('info-bar').textContent = 'SIMULATION — Construction en cours... (' + simBriques.length + ' briques)';
        simTimer = setInterval(simStep, 10);
    }, 1500);
}

function simPreparerMeshes() {
    // Regrouper par couleur
    var parCouleur = {};
    for (var i = 0; i < simBriques.length; i++) {
        var c = simBriques[i].couleur;
        if (!parCouleur[c]) parCouleur[c] = [];
        parCouleur[c].push(i);
    }

    // Creer un InstancedMesh par couleur
    simInstMesh = [];
    var unitGeo = new THREE.BoxGeometry(1, 1, 1);
    var couleurs = Object.keys(parCouleur);
    for (var ci = 0; ci < couleurs.length; ci++) {
        var clr = couleurs[ci];
        var indices = parCouleur[clr];
        var mat = new THREE.MeshStandardMaterial({ color: clr, roughness: 0.7 });
        var inst = new THREE.InstancedMesh(unitGeo, mat, indices.length);
        inst.castShadow = true;
        inst.receiveShadow = true;
        inst.count = 0;
        inst.userData.simIndices = indices;
        inst.userData.simCouleur = clr;

        // Pre-remplir toutes les matrices
        var dummy = new THREE.Object3D();
        for (var j = 0; j < indices.length; j++) {
            var b = simBriques[indices[j]];
            dummy.position.set(b.wx, b.wy, b.wz);
            dummy.quaternion.set(b.qx, b.qy, b.qz, b.qw);
            dummy.scale.set(b.sx, b.sy, b.sz);
            dummy.updateMatrix();
            inst.setMatrixAt(j, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;

        sceneManager.scene.add(inst);
        simInstMesh.push(inst);
    }

    // Creer un index global -> (instMesh, localIndex)
    window._simMapping = [];
    for (var ci = 0; ci < simInstMesh.length; ci++) {
        var indices = simInstMesh[ci].userData.simIndices;
        for (var j = 0; j < indices.length; j++) {
            window._simMapping[indices[j]] = { mesh: simInstMesh[ci], local: j };
        }
    }

    // Compteur visible par mesh
    for (var ci = 0; ci < simInstMesh.length; ci++) {
        simInstMesh[ci].userData.simVisible = 0;
    }
}

function simStep() {
    if (simPause || !simEnCours) return;
    var vitesse = parseInt(document.getElementById('sim-vitesse').value) || 20;
    var nbParStep = Math.max(1, Math.round(vitesse / 5));

    for (var s = 0; s < nbParStep && simIndex < simBriques.length; s++) {
        var map = window._simMapping[simIndex];
        if (map) {
            map.mesh.userData.simVisible++;
            map.mesh.count = map.mesh.userData.simVisible;
            map.mesh.instanceMatrix.needsUpdate = true;
        }

        // Afficher les exclusions (fenetres/portes) quand on atteint leur hauteur
        var bY = simBriques[simIndex].wy;
        for (var ex = 0; ex < simExclusions.length; ex++) {
            if (!simExclusions[ex].shown && bY >= simExclusions[ex].y + simExclusions[ex].hauteur * 0.8) {
                sceneManager.scene.add(simExclusions[ex].group);
                simExclusions[ex].shown = true;
            }
        }

        // Afficher les laines de verre quand on atteint leur hauteur (avant le placo)
        if (simLaines) {
            for (var sl = 0; sl < simLaines.length; sl++) {
                if (!simLaines[sl].shown && bY >= simLaines[sl].y + simLaines[sl].hauteur * 0.85) {
                    sceneManager.scene.add(simLaines[sl].group);
                    simLaines[sl].shown = true;
                }
            }
        }

        // Afficher les placos quand on atteint leur hauteur (apres la laine)
        if (simPlacos) {
            for (var sp = 0; sp < simPlacos.length; sp++) {
                if (!simPlacos[sp].shown && bY >= simPlacos[sp].y + simPlacos[sp].hauteur * 0.9) {
                    sceneManager.scene.add(simPlacos[sp].group);
                    simPlacos[sp].shown = true;
                }
            }
        }

        // Afficher les carrelages muraux (apres le placo, meme hauteur)
        if (simCarrelages) {
            for (var sc = 0; sc < simCarrelages.length; sc++) {
                if (!simCarrelages[sc].shown && bY >= simCarrelages[sc].y + simCarrelages[sc].hauteur * 0.92) {
                    sceneManager.scene.add(simCarrelages[sc].group);
                    simCarrelages[sc].shown = true;
                }
            }
        }

        // Afficher les papiers peints (apres le placo)
        if (simPapiers) {
            for (var sp2 = 0; sp2 < simPapiers.length; sp2++) {
                if (!simPapiers[sp2].shown && bY >= simPapiers[sp2].y + simPapiers[sp2].hauteur * 0.92) {
                    sceneManager.scene.add(simPapiers[sp2].group);
                    simPapiers[sp2].shown = true;
                }
            }
        }

        // Afficher les plinthes (en bas, apparaissent a 30% de la hauteur du mur)
        if (simPlinthes) {
            for (var spl = 0; spl < simPlinthes.length; spl++) {
                if (!simPlinthes[spl].shown && bY >= 0.3) {
                    sceneManager.scene.add(simPlinthes[spl].group);
                    simPlinthes[spl].shown = true;
                }
            }
        }

        // Afficher les carrelages sol (apparaissent quand les murs sont a 50%)
        if (simCarrelagesSol) {
            for (var scs = 0; scs < simCarrelagesSol.length; scs++) {
                if (!simCarrelagesSol[scs].shown && simIndex > simBriques.length * 0.5) {
                    sceneManager.scene.add(simCarrelagesSol[scs].group);
                    simCarrelagesSol[scs].shown = true;
                }
            }
        }

        simIndex++;
    }

    var pct = Math.round((simIndex / simBriques.length) * 100);
    document.getElementById('sim-compteur').textContent = simIndex + ' / ' + simBriques.length;
    document.getElementById('sim-progress').style.width = pct + '%';

    if (simIndex >= simBriques.length) {
        simTerminer();
    }
}

function simTerminer() {
    clearInterval(simTimer);
    simTimer = null;

    // Montrer toutes les exclusions restantes
    for (var ex = 0; ex < simExclusions.length; ex++) {
        if (!simExclusions[ex].shown) {
            sceneManager.scene.add(simExclusions[ex].group);
            simExclusions[ex].shown = true;
        }
    }

    // Montrer les laines restantes
    if (simLaines) {
        for (var sl = 0; sl < simLaines.length; sl++) {
            if (!simLaines[sl].shown) {
                sceneManager.scene.add(simLaines[sl].group);
                simLaines[sl].shown = true;
            }
        }
    }

    // Montrer les placos restants
    if (simPlacos) {
        for (var sp = 0; sp < simPlacos.length; sp++) {
            if (!simPlacos[sp].shown) { sceneManager.scene.add(simPlacos[sp].group); simPlacos[sp].shown = true; }
        }
    }
    // Montrer les carrelages muraux restants
    if (simCarrelages) {
        for (var sc = 0; sc < simCarrelages.length; sc++) {
            if (!simCarrelages[sc].shown) { sceneManager.scene.add(simCarrelages[sc].group); simCarrelages[sc].shown = true; }
        }
    }
    // Montrer les papiers peints restants
    if (simPapiers) {
        for (var sp2 = 0; sp2 < simPapiers.length; sp2++) {
            if (!simPapiers[sp2].shown) { sceneManager.scene.add(simPapiers[sp2].group); simPapiers[sp2].shown = true; }
        }
    }
    // Montrer les plinthes restantes
    if (simPlinthes) {
        for (var spl = 0; spl < simPlinthes.length; spl++) {
            if (!simPlinthes[spl].shown) { sceneManager.scene.add(simPlinthes[spl].group); simPlinthes[spl].shown = true; }
        }
    }
    // Montrer les carrelages sol restants
    if (simCarrelagesSol) {
        for (var scs = 0; scs < simCarrelagesSol.length; scs++) {
            if (!simCarrelagesSol[scs].shown) { sceneManager.scene.add(simCarrelagesSol[scs].group); simCarrelagesSol[scs].shown = true; }
        }
    }

    document.getElementById('info-bar').textContent = 'SIMULATION TERMINEE — ' + simBriques.length + ' briques posees !';

    // Attendre 2s puis restaurer
    setTimeout(simRestaurer, 2000);
}

function simRestaurer() {
    // Supprimer les InstancedMesh temporaires
    if (simInstMesh) {
        for (var i = 0; i < simInstMesh.length; i++) {
            sceneManager.scene.remove(simInstMesh[i]);
            simInstMesh[i].geometry.dispose();
            simInstMesh[i].material.dispose();
        }
        simInstMesh = null;
    }

    // Remettre les elements originaux dans la scene
    for (var i = 0; i < simOrigVisibility.length; i++) {
        var item = simOrigVisibility[i];
        if (item.parent) {
            item.parent.add(item.group);
        } else {
            sceneManager.scene.add(item.group);
        }
    }
    // Remettre les exclusions (fenetres/portes) qui n'ont pas ete affichees
    for (var i = 0; i < simExclusions.length; i++) {
        var item = simExclusions[i];
        if (!item.shown) {
            if (item.parent) {
                item.parent.add(item.group);
            } else {
                sceneManager.scene.add(item.group);
            }
        }
    }

    // Remettre les laines non affichees
    if (simLaines) {
        for (var i = 0; i < simLaines.length; i++) {
            var item = simLaines[i];
            if (!item.shown) {
                if (item.parent) item.parent.add(item.group);
                else sceneManager.scene.add(item.group);
            }
        }
    }

    // Remettre les placos non affiches
    if (simPlacos) {
        for (var i = 0; i < simPlacos.length; i++) {
            var item = simPlacos[i];
            if (!item.shown) {
                if (item.parent) item.parent.add(item.group);
                else sceneManager.scene.add(item.group);
            }
        }
    }

    // Remettre les carrelages muraux non affiches
    if (simCarrelages) {
        for (var i = 0; i < simCarrelages.length; i++) {
            var item = simCarrelages[i];
            if (!item.shown) { if (item.parent) item.parent.add(item.group); else sceneManager.scene.add(item.group); }
        }
    }
    // Remettre les papiers peints non affiches
    if (simPapiers) {
        for (var i = 0; i < simPapiers.length; i++) {
            var item = simPapiers[i];
            if (!item.shown) { if (item.parent) item.parent.add(item.group); else sceneManager.scene.add(item.group); }
        }
    }
    // Remettre les plinthes non affichees
    if (simPlinthes) {
        for (var i = 0; i < simPlinthes.length; i++) {
            var item = simPlinthes[i];
            if (!item.shown) { if (item.parent) item.parent.add(item.group); else sceneManager.scene.add(item.group); }
        }
    }
    // Remettre les carrelages sol non affiches
    if (simCarrelagesSol) {
        for (var i = 0; i < simCarrelagesSol.length; i++) {
            var item = simCarrelagesSol[i];
            if (!item.shown) { if (item.parent) item.parent.add(item.group); else sceneManager.scene.add(item.group); }
        }
    }

    simEnCours = false;
    simPause = false;
    simBriques = [];
    simIndex = 0;
    simPlacos = null;
    simLaines = null;
    simCarrelages = null;
    simPapiers = null;
    simPlinthes = null;
    simCarrelagesSol = null;
    window._simMapping = null;

    document.getElementById('sim-bar').style.display = 'none';
    document.getElementById('toolbar').style.display = 'flex';
    document.getElementById('info-bar').textContent = 'Clic droit = orbiter | Molette = zoom';
}

function simArreter() {
    clearInterval(simTimer);
    simTimer = null;
    simRestaurer();
}

document.getElementById('btn-simuler').addEventListener('click', function() {
    simDemarrer();
});

document.getElementById('sim-pause').addEventListener('click', function() {
    simPause = !simPause;
    this.innerHTML = simPause ? '&#9654;' : '&#9646;&#9646;';
    document.getElementById('info-bar').textContent = simPause ? 'SIMULATION — Pause' : 'SIMULATION — Construction en cours...';
});

document.getElementById('sim-stop').addEventListener('click', function() {
    simArreter();
});

// --- MENU CONTEXTUEL ---
// Fermer le menu si on clique ailleurs
document.addEventListener('pointerdown', function(e) {
    var menu = document.getElementById('ctx-menu');
    if (menu.style.display === 'block' && !menu.contains(e.target)) {
        menu.style.display = 'none';
        ctxElement = null;
    }
});

document.getElementById('ctx-editer').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    activerEdition();
    ouvrirEdition(el);
    surlignerGroupe(el.group || el.brique.group, '#ffa500');
    document.getElementById('info-bar').textContent = 'EDITION — Modifiez les parametres puis cliquez Appliquer | Echap = annuler';
});

document.getElementById('ctx-deplacer').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    activerDeplacement();
    // Selectionner directement ce mur
    deplacementElement = el;
    deplacementGroupeIds = editeur.trouverGroupe(el.id);
    deplacementGroupes3D = [];
    deplacementOrigX = el.params.x || 0;
    deplacementOrigZ = el.params.z || 0;
    for (var g = 0; g < deplacementGroupeIds.length; g++) {
        for (var j = 0; j < editeur.elements.length; j++) {
            if (editeur.elements[j].id === deplacementGroupeIds[g]) {
                var gr = editeur.elements[j].group || editeur.elements[j].brique.group;
                deplacementGroupes3D.push(gr);
                surlignerGroupe(gr, '#00ff88');
            }
        }
    }
    deplacementGroup = deplacementGroupes3D[0];
    deplacementSelectionne = true;
    // Collecter les exclusions de tous les murs du groupe
    deplacerExclusions = [];
    for (var g = 0; g < deplacementGroupeIds.length; g++) {
        for (var j = 0; j < editeur.elements.length; j++) {
            if (editeur.elements[j].id === deplacementGroupeIds[g]) {
                var excls = trouverExclusionsMur(editeur.elements[j]);
                for (var ei = 0; ei < excls.length; ei++) {
                    var existe = false;
                    for (var di = 0; di < deplacerExclusions.length; di++) {
                        if (deplacerExclusions[di].excl === excls[ei]) { existe = true; break; }
                    }
                    if (!existe) {
                        deplacerExclusions.push({ excl: excls[ei], origX: excls[ei].x, origZ: excls[ei].z, origY: excls[ei].y });
                    }
                }
            }
        }
    }
    // Collecter les placos et laines
    deplacerMurPlacos = [];
    deplacerMurLaines = [];
    for (var g = 0; g < deplacementGroupeIds.length; g++) {
        for (var j = 0; j < editeur.elements.length; j++) {
            if (editeur.elements[j].id !== deplacementGroupeIds[g]) continue;
            var mp = editeur.elements[j].params;
            var mSegs = editeur._segments(mp);
            var mAngle = mp.angle || mp.angleDepart || 0;
            for (var pi = 0; pi < placoElements.length; pi++) {
                var pInfo = placoElements[pi].userData.placoInfo;
                if (!pInfo) continue;
                if (Math.abs(pInfo.angle - mAngle) < 1) {
                    for (var si = 0; si < mSegs.length; si++) {
                        var cx = (mSegs[si].x1 + mSegs[si].x2) / 2, cz = (mSegs[si].z1 + mSegs[si].z2) / 2;
                        if (Math.abs(pInfo.worldX - cx) < mp.distance + 0.5 && Math.abs(pInfo.worldZ - cz) < mp.distance + 0.5) {
                            deplacerMurPlacos.push({ ref: placoElements[pi], origX: pInfo.worldX, origZ: pInfo.worldZ, origPosX: placoElements[pi].position.x, origPosZ: placoElements[pi].position.z });
                            break;
                        }
                    }
                }
            }
            for (var li = 0; li < laineElements.length; li++) {
                var lInfo = laineElements[li].userData.laineInfo;
                if (!lInfo) continue;
                if (Math.abs(lInfo.angle - mAngle) < 1) {
                    for (var si = 0; si < mSegs.length; si++) {
                        var cx = (mSegs[si].x1 + mSegs[si].x2) / 2, cz = (mSegs[si].z1 + mSegs[si].z2) / 2;
                        if (Math.abs(lInfo.worldX - cx) < mp.distance + 0.5 && Math.abs(lInfo.worldZ - cz) < mp.distance + 0.5) {
                            deplacerMurLaines.push({ ref: laineElements[li], origX: lInfo.worldX, origZ: lInfo.worldZ, origPosX: laineElements[li].position.x, origPosZ: laineElements[li].position.z });
                            break;
                        }
                    }
                }
            }
        }
    }
    console.log('ctx-deplacer : ' + deplacerExclusions.length + ' excl, ' + deplacerMurPlacos.length + ' placos, ' + deplacerMurLaines.length + ' laines');
    container.style.cursor = 'crosshair';
    var txt = deplacementGroupeIds.length > 1 ? ' (' + deplacementGroupeIds.length + ' murs groupes)' : '';
    document.getElementById('info-bar').textContent = 'DEPLACEMENT' + txt + ' — Cliquez pour poser | R/L = pivoter | Echap = annuler';
    document.getElementById('rotation-bar').style.display = 'block';
});

// Percer un trou : d'abord selectionner le mur (rouge), puis choisir le type
document.getElementById('ctx-trou-select').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    toutDesactiver();
    // Surligner le mur en rouge
    trouSelectElement = el;
    surlignerGroupe(el.group || el.brique.group, '#e94560');
    // Afficher le popup de choix
    document.getElementById('trou-choix-mur').textContent = el.nom || ('Mur ' + el.id);
    document.getElementById('trou-choix-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'Mur selectionne — Choisissez le type de trou';
    ctxElement = null;
});

function lancerTrouRapideSurMur(largeur, hauteur, y, forme) {
    if (!trouSelectElement) return;
    document.getElementById('trou-choix-popup').style.display = 'none';
    restaurerSurlignage();
    modeTrouRapide = true;
    trouRapideForme = forme || 'rect';
    document.getElementById('tr-largeur').value = largeur;
    document.getElementById('tr-hauteur').value = hauteur;
    document.getElementById('tr-y').value = y;
    document.getElementById('tr-align').value = 'click';
    document.getElementById('trou-rapide-popup').style.display = 'block';
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';
    supprimerGhostTrou();
    var geo;
    var mat = new THREE.MeshBasicMaterial({ color: '#ff0000', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    if (trouRapideForme === 'rond') {
        geo = new THREE.CylinderGeometry(largeur / 2, largeur / 2, 0.15, 32);
        ghostTrou = new THREE.Mesh(geo, mat);
        ghostTrou.rotation.x = Math.PI / 2;
    } else {
        geo = new THREE.BoxGeometry(largeur, hauteur, 0.15);
        ghostTrou = new THREE.Mesh(geo, mat);
    }
    ghostTrou.visible = false;
    sceneManager.scene.add(ghostTrou);
    document.getElementById('info-bar').textContent = 'TROU — Cliquez sur le mur pour percer | Echap = annuler';
}

document.getElementById('btn-trou-porte').addEventListener('click', function() {
    lancerTrouRapideSurMur(0.83, 2.04, 0);
});

document.getElementById('btn-trou-fenetre').addEventListener('click', function() {
    lancerTrouRapideSurMur(1.20, 1.15, 0.90);
});

document.getElementById('btn-trou-rond').addEventListener('click', function() {
    lancerTrouRapideSurMur(0.50, 0.50, 0.90, 'rond');
});

document.getElementById('btn-trou-custom').addEventListener('click', function() {
    lancerTrouRapideSurMur(0.90, 2.10, 0);
});

document.getElementById('btn-trou-manuel').addEventListener('click', function() {
    if (!trouSelectElement) return;
    document.getElementById('trou-choix-popup').style.display = 'none';
    restaurerSurlignage();
    activerTrou();
});

// Trou precis (formulaire)
var trouPrecisElement = null;
var trouPrecisForme = 'rect';

document.getElementById('btn-trou-precis').addEventListener('click', function() {
    if (!trouSelectElement) return;
    trouPrecisElement = trouSelectElement;
    document.getElementById('trou-choix-popup').style.display = 'none';
    restaurerSurlignage();

    // Pre-remplir les infos du mur
    var p = trouPrecisElement.params;
    var dist = (p.distance || 5).toFixed(2);
    var haut = (p.hauteur || 2.5).toFixed(2);
    document.getElementById('tp-mur-info').textContent = (trouPrecisElement.nom || 'Mur') + ' — ' + dist + 'm x ' + haut + 'm';

    // Valeurs par defaut
    document.getElementById('tp-x').value = '0.50';
    document.getElementById('tp-x').max = dist;
    document.getElementById('tp-y').value = '0';
    document.getElementById('tp-y').max = haut;
    document.getElementById('tp-largeur').value = '0.90';
    document.getElementById('tp-hauteur').value = '2.10';
    trouPrecisForme = 'rect';

    // Reset boutons forme
    var btns = document.querySelectorAll('.tp-forme-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].style.background = '#16213e';
        btns[i].style.border = '1px solid #e94560';
    }
    btns[0].style.background = '#e94560';
    btns[0].style.border = 'none';

    document.getElementById('trou-precis-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'TROU PRECIS — Remplissez le formulaire puis cliquez Percer';
});

// Choix de forme
document.getElementById('trou-precis-popup').addEventListener('click', function(ev) {
    var btn = ev.target;
    if (!btn.classList.contains('tp-forme-btn')) return;
    trouPrecisForme = btn.getAttribute('data-forme');
    var btns = document.querySelectorAll('.tp-forme-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].style.background = '#16213e';
        btns[i].style.border = '1px solid #e94560';
    }
    btn.style.background = '#e94560';
    btn.style.border = 'none';

    // Si rond, forcer largeur = hauteur
    if (trouPrecisForme === 'rond') {
        var l = parseFloat(document.getElementById('tp-largeur').value) || 0.5;
        document.getElementById('tp-hauteur').value = l;
    }
});

// Sync largeur/hauteur pour le rond
document.getElementById('tp-largeur').addEventListener('input', function() {
    if (trouPrecisForme === 'rond') {
        document.getElementById('tp-hauteur').value = this.value;
    }
});
document.getElementById('tp-hauteur').addEventListener('input', function() {
    if (trouPrecisForme === 'rond') {
        document.getElementById('tp-largeur').value = this.value;
    }
});

// Valider le trou precis
document.getElementById('btn-tp-valider').addEventListener('click', function() {
    if (!trouPrecisElement) return;
    var tx = parseFloat(document.getElementById('tp-x').value) || 0;
    var ty = parseFloat(document.getElementById('tp-y').value) || 0;
    var tl = parseFloat(document.getElementById('tp-largeur').value) || 0.9;
    var th = parseFloat(document.getElementById('tp-hauteur').value) || 2.1;

    if (trouPrecisForme === 'rond') {
        tl = Math.max(tl, th);
        th = tl;
    }

    var trou = { x: tx, y: ty, largeur: tl, hauteur: th, mur: 0 };
    if (trouPrecisForme !== 'rect') trou.forme = trouPrecisForme;

    editeur.sauvegarderEtat();

    if (trouPrecisForme === 'rond') {
        editeur.ajouterTrouRond(trouPrecisElement.id, trou);
    } else if (trouPrecisForme === 'arrondi') {
        editeur.ajouterTrouArrondi(trouPrecisElement.id, trou);
    } else {
        editeur.ajouterTrouElement(trouPrecisElement.id, trou);
    }

    // Couper les placos et laines
    _couperPlacosLainesParPorte(trouPrecisElement, tx, ty, tl, th, 0);

    document.getElementById('trou-precis-popup').style.display = 'none';
    trouPrecisElement = null;
    document.getElementById('info-bar').textContent = 'Trou perce !';
});

// Annuler le trou precis
document.getElementById('btn-tp-annuler').addEventListener('click', function() {
    document.getElementById('trou-precis-popup').style.display = 'none';
    trouPrecisElement = null;
    toutDesactiver();
});

// ========================================
// FENETRE / PORTE — MODE PRECIS
// ========================================

var modePrecisFenetre = false;
var precisFenetreElement = null;
var precisFenetreModele = null;
var modePrecisPorte = false;
var precisPorteElement = null;
var precisPorteModele = null;

// Couper les placos et laines quand on pose une porte (ou fenetre)
// element : l'element mur, trouX/trouY/trouW/trouH : position du trou en local sur le mur, trouMur : index du segment
// Reboucher les placos/laines decoupes autour d'un trou (fusionner les morceaux)
// Trouve tous les morceaux sur la meme face/cote et les remplace par un seul placo/laine plein
function _reboucherPlacosLaines(element, trouMur) {
    var params = element.params;
    var segs = editeur._segments(params);
    var seg = segs[trouMur || 0];
    if (!seg) return;

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;
    var angle = Math.atan2(dz, dx) * 180 / Math.PI;
    var perpX = -nz, perpZ = nx;
    var murH = params.hauteur || 2.5;
    var oy = params.y || 0;

    // Surface totale du mur : centre du segment, pleine largeur et hauteur
    var cx = seg.x1 + nx * len / 2;
    var cz = seg.z1 + nz * len / 2;

    var lists = [
        { arr: placoElements, tag: 'placoInfo', creer: function(info, l, h, wx, wz, y) {
            var c = Placo.lireCouleurs(info._group);
            placo.setCouleurs(c.placo, c.opacite / 100);
            return placo.creer(null, wx, wz, y, l, h, info.angle, info.ep, info.side, info.murEpFull, info.extraBack || 0);
        }},
        { arr: laineElements, tag: 'laineInfo', creer: function(info, l, h, wx, wz, y) {
            var c = LaineDeVerre.lireCouleurs(info._group);
            laineDeVerre.setCouleurs(c.laine, c.opacite / 100);
            return laineDeVerre.creer(null, wx, wz, y, l, h, info.angle, info.ep, info.side, info.murEpFull);
        }}
    ];

    for (var li = 0; li < lists.length; li++) {
        var list = lists[li];
        // Regrouper par cote (side)
        var sides = {};

        for (var i = 0; i < list.arr.length; i++) {
            var g = list.arr[i];
            var info = g.userData[list.tag];
            if (!info) continue;

            // Meme mur ? (angle + distance perpendiculaire)
            var dAngle = Math.abs(info.angle - angle) % 360;
            if (dAngle > 2 && dAngle < 358) continue;
            var ddx = info.worldX - seg.x1, ddz = info.worldZ - seg.z1;
            var perpDist = Math.abs(ddx * perpX + ddz * perpZ);
            if (perpDist > 0.3) continue;

            var key = info.side;
            if (!sides[key]) {
                sides[key] = { info: info, indices: [] };
            }
            info._group = g;
            sides[key].indices.push(i);
        }

        // Pour chaque cote : supprimer tous les morceaux, recreer un seul plein
        // avec la surface totale du mur (len x murH)
        var removeAll = [];
        for (var key in sides) {
            var s = sides[key];
            if (s.indices.length < 1) continue;

            for (var j = 0; j < s.indices.length; j++) {
                removeAll.push(s.indices[j]);
            }

            // Recreer un seul element plein = surface totale du mur
            var newG = list.creer(s.info, len, murH, cx, cz, oy);
            list.arr.push(newG);
        }

        // Supprimer les anciens (du dernier au premier)
        removeAll.sort(function(a, b) { return b - a; });
        for (var r = 0; r < removeAll.length; r++) {
            sceneManager.scene.remove(list.arr[removeAll[r]]);
            list.arr.splice(removeAll[r], 1);
        }
    }

    // Redecouper pour tous les trous restants sur cette face
    if (params.trous && params.trous.length > 0) {
        for (var ti = 0; ti < params.trous.length; ti++) {
            var tr = params.trous[ti];
            if ((tr.mur || 0) !== (trouMur || 0)) continue;
            _couperPlacosLainesParPorte(element, tr.x || 0, tr.y || 0, tr.largeur, tr.hauteur, trouMur || 0);
        }
    }
}

function _couperPlacosLainesParPorte(element, trouX, trouY, trouW, trouH, trouMur) {
    var params = element.params;
    var segs = editeur._segments(params);
    var seg = segs[trouMur || 0];
    if (!seg) return;

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;
    var angle = Math.atan2(dz, dx) * 180 / Math.PI;
    var oy = params.y || 0;

    // Traiter les placos ET les laines
    var lists = [
        { arr: placoElements, cls: placo, tag: 'placoInfo', reader: Placo.lireCouleurs, creer: function(info, wx, wz, y, l, h) {
            var c = Placo.lireCouleurs(info._group);
            placo.setCouleurs(c.placo, c.opacite / 100);
            return placo.creer(null, wx, wz, y, l, h, info.angle, info.ep, info.side, info.murEpFull, info.extraBack || 0);
        }},
        { arr: laineElements, cls: laineDeVerre, tag: 'laineInfo', reader: LaineDeVerre.lireCouleurs, creer: function(info, wx, wz, y, l, h) {
            var c = LaineDeVerre.lireCouleurs(info._group);
            laineDeVerre.setCouleurs(c.laine, c.opacite / 100);
            return laineDeVerre.creer(null, wx, wz, y, l, h, info.angle, info.ep, info.side, info.murEpFull);
        }}
    ];

    for (var li = 0; li < lists.length; li++) {
        var list = lists[li];
        var toRemove = [];
        var toAdd = [];

        for (var i = 0; i < list.arr.length; i++) {
            var g = list.arr[i];
            var info = g.userData[list.tag];
            if (!info) continue;

            // Meme mur ? (angle a 2 degres pres)
            var dAngle = Math.abs(info.angle - angle) % 360;
            if (dAngle > 2 && dAngle < 358) continue;

            // Distance perpendiculaire (distinguer murs paralleles proches)
            var _perpX = -nz, _perpZ = nx;
            var _ddx = info.worldX - seg.x1, _ddz = info.worldZ - seg.z1;
            var _perpDist = Math.abs(_ddx * _perpX + _ddz * _perpZ);
            if (_perpDist > 0.3) continue;

            // Projeter le centre du placo/laine sur l'axe du segment
            var relX = (info.worldX - seg.x1) * nx + (info.worldZ - seg.z1) * nz;
            var elemLeft = relX - info.largeur / 2;
            var elemRight = relX + info.largeur / 2;
            var elemBot = info.y - oy;
            var elemTop = elemBot + info.hauteur;

            // Zone du trou (porte)
            var porteLeft = trouX;
            var porteRight = trouX + trouW;
            var porteBot = trouY;
            var porteTop = trouY + trouH;

            // Verifier le chevauchement
            var overlapX = elemLeft < porteRight && elemRight > porteLeft;
            var overlapY = elemBot < porteTop && elemTop > porteBot;
            if (!overlapX || !overlapY) continue;

            // Il y a chevauchement — supprimer l'original
            info._group = g; // ref pour lire les couleurs
            toRemove.push(i);

            // Reconstituer les morceaux restants autour du trou :
            //   [  GAUCHE  ][ HAUT  ][  DROITE  ]
            //   [          ][ TROU  ][           ]
            //   [          ][  BAS  ][           ]
            // Gauche et Droite = hauteur complete
            // Haut et Bas = seulement la largeur du trou

            // Morceau gauche (pleine hauteur)
            var leftW = porteLeft - elemLeft;
            if (leftW > 0.02) {
                var leftCX = elemLeft + leftW / 2;
                var lwx = seg.x1 + nx * leftCX;
                var lwz = seg.z1 + nz * leftCX;
                toAdd.push({ info: info, wx: lwx, wz: lwz, y: info.y, l: leftW, h: info.hauteur });
            }

            // Morceau droite (pleine hauteur)
            var rightW = elemRight - porteRight;
            if (rightW > 0.02) {
                var rightCX = porteRight + rightW / 2;
                var rwx = seg.x1 + nx * rightCX;
                var rwz = seg.z1 + nz * rightCX;
                toAdd.push({ info: info, wx: rwx, wz: rwz, y: info.y, l: rightW, h: info.hauteur });
            }

            // Largeur du milieu (zone du trou, clampee aux bords du placo)
            var midLeft = Math.max(elemLeft, porteLeft);
            var midRight = Math.min(elemRight, porteRight);
            var midW = midRight - midLeft;

            // Morceau en haut (au-dessus du trou)
            if (midW > 0.02 && elemTop > porteTop) {
                var topH = elemTop - porteTop;
                if (topH > 0.02) {
                    var topCX = midLeft + midW / 2;
                    var topY = oy + porteTop;
                    var twx = seg.x1 + nx * topCX;
                    var twz = seg.z1 + nz * topCX;
                    toAdd.push({ info: info, wx: twx, wz: twz, y: topY, l: midW, h: topH });
                }
            }

            // Morceau en bas (sous le trou — pour les fenetres)
            if (midW > 0.02 && elemBot < porteBot) {
                var botH = porteBot - elemBot;
                if (botH > 0.02) {
                    var botCX = midLeft + midW / 2;
                    var botY = info.y; // meme Y que l'original (le bas)
                    var bwx = seg.x1 + nx * botCX;
                    var bwz = seg.z1 + nz * botCX;
                    toAdd.push({ info: info, wx: bwx, wz: bwz, y: botY, l: midW, h: botH });
                }
            }
        }

        // Supprimer les originaux (du dernier au premier)
        for (var i = toRemove.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(list.arr[toRemove[i]]);
            list.arr.splice(toRemove[i], 1);
        }

        // Ajouter les morceaux
        for (var i = 0; i < toAdd.length; i++) {
            var p = toAdd[i];
            var newG = list.creer(p.info, p.wx, p.wz, p.y, p.l, p.h);
            list.arr.push(newG);
        }
    }

    // Supprimer les papiers peints et carrelages qui chevauchent le trou
    var overlayLists = [
        { arr: ppElements, tag: 'papierPeintInfo', xKey: 'placoWorldX', zKey: 'placoWorldZ' },
        { arr: carrelageElements, tag: 'carrelageInfo', xKey: 'placoWorldX', zKey: 'placoWorldZ' }
    ];
    for (var oi = 0; oi < overlayLists.length; oi++) {
        var ol = overlayLists[oi];
        var oRemove = [];
        for (var i = 0; i < ol.arr.length; i++) {
            var oInfo = ol.arr[i].userData[ol.tag];
            if (!oInfo) continue;
            var dAngleO = Math.abs(oInfo.angle - angle) % 360;
            if (dAngleO > 2 && dAngleO < 358) continue;
            var owx = oInfo[ol.xKey] || 0, owz = oInfo[ol.zKey] || 0;
            var _perpDistO = Math.abs((owx - seg.x1) * (-nz) + (owz - seg.z1) * nx);
            if (_perpDistO > 0.3) continue;
            var relXO = (owx - seg.x1) * nx + (owz - seg.z1) * nz;
            var oLeft = relXO - oInfo.largeur / 2;
            var oRight = relXO + oInfo.largeur / 2;
            var oBot = (oInfo.y || 0) - oy;
            var oTop = oBot + oInfo.hauteur;
            if (oLeft < trouX + trouW && oRight > trouX && oBot < trouY + trouH && oTop > trouY) {
                oRemove.push(i);
            }
        }
        for (var i = oRemove.length - 1; i >= 0; i--) {
            sceneManager.scene.remove(ol.arr[oRemove[i]]);
            ol.arr.splice(oRemove[i], 1);
        }
    }
}

// Supprimer les placos existants qui chevauchent la zone du nouveau placo (meme mur, meme cote)
// Recouvrir tout le mur (toutes les faces) en 1 clic
// pp = _placoPos ou _lainePos du ghost, type = 'placo' ou 'laine'
// Systeme de collision : trouver les murs qui forment une piece fermee
function _trouverMursPieceFermee(murDepart) {
    // 1) Collecter TOUS les segments de TOUS les murs avec leurs extremites
    var nodes = []; // { el, seg, x1,z1, x2,z2 }
    for (var i = 0; i < editeur.elements.length; i++) {
        var el = editeur.elements[i];
        var segs = editeur._segments(el.params);
        for (var s = 0; s < segs.length; s++) {
            nodes.push({ el: el, seg: segs[s], x1: segs[s].x1, z1: segs[s].z1, x2: segs[s].x2, z2: segs[s].z2 });
        }
    }
    if (nodes.length < 3) return null;

    // 2) Construire un graphe de connexions : 2 extremites sont connectees si dist < tol
    var tol = 0.50;
    // Chaque noeud a 2 points (debut, fin). On cherche les connexions point-a-point
    // Format : pour chaque noeud, lister les noeuds connectes a chaque bout
    var connections = []; // connections[i] = { debut: [indices], fin: [indices] }
    for (var i = 0; i < nodes.length; i++) {
        connections.push({ debut: [], fin: [] });
    }
    for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
            if (nodes[i].el.id === nodes[j].el.id) continue; // meme element = ignorer
            // 4 combinaisons de distances
            var d_i2_j1 = Math.sqrt(Math.pow(nodes[i].x2 - nodes[j].x1, 2) + Math.pow(nodes[i].z2 - nodes[j].z1, 2));
            var d_i2_j2 = Math.sqrt(Math.pow(nodes[i].x2 - nodes[j].x2, 2) + Math.pow(nodes[i].z2 - nodes[j].z2, 2));
            var d_i1_j1 = Math.sqrt(Math.pow(nodes[i].x1 - nodes[j].x1, 2) + Math.pow(nodes[i].z1 - nodes[j].z1, 2));
            var d_i1_j2 = Math.sqrt(Math.pow(nodes[i].x1 - nodes[j].x2, 2) + Math.pow(nodes[i].z1 - nodes[j].z2, 2));
            if (d_i2_j1 < tol) { connections[i].fin.push(j); connections[j].debut.push(i); }
            if (d_i2_j2 < tol) { connections[i].fin.push(j); connections[j].fin.push(i); }
            if (d_i1_j1 < tol) { connections[i].debut.push(j); connections[j].debut.push(i); }
            if (d_i1_j2 < tol) { connections[i].debut.push(j); connections[j].fin.push(i); }
        }
    }

    // 3) Trouver un circuit ferme en partant du mur de depart
    var startIdx = -1;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].el.id === murDepart.id) { startIdx = i; break; }
    }
    if (startIdx < 0) return null;

    // Parcours en profondeur pour trouver un cycle
    function _chercheCycle(current, visited, path) {
        var conns = connections[current].fin.concat(connections[current].debut);
        for (var c = 0; c < conns.length; c++) {
            var next = conns[c];
            if (next === startIdx && path.length >= 3) {
                return path; // Cycle trouve !
            }
            if (visited[next]) continue;
            visited[next] = true;
            path.push(next);
            var result = _chercheCycle(next, visited, path);
            if (result) return result;
            path.pop();
            visited[next] = false;
        }
        return null;
    }

    var visited = {};
    visited[startIdx] = true;
    var cycle = _chercheCycle(startIdx, visited, [startIdx]);

    if (cycle && cycle.length >= 3) {
        // Convertir les indices en elements uniques
        var result = [];
        var done = {};
        for (var i = 0; i < cycle.length; i++) {
            var el = nodes[cycle[i]].el;
            if (!done[el.id]) {
                done[el.id] = true;
                result.push(el);
            }
        }
        console.log('Piece fermee trouvee: ' + result.length + ' murs');
        return result;
    }

    // Debug si pas trouve
    var dbg = 'COLLISION DEBUG — ' + nodes.length + ' segments, ' + editeur.elements.length + ' murs\n';
    for (var i = 0; i < nodes.length; i++) {
        dbg += 'Seg ' + i + ': (' + nodes[i].x1.toFixed(2) + ',' + nodes[i].z1.toFixed(2) + ') -> (' + nodes[i].x2.toFixed(2) + ',' + nodes[i].z2.toFixed(2) + ')';
        dbg += ' | connexions debut=[' + connections[i].debut.join(',') + '] fin=[' + connections[i].fin.join(',') + ']\n';
    }
    dbg += 'Aucun cycle trouve depuis le mur ' + startIdx;
    console.log(dbg);
    return null;
}

// Recouvrir une piece fermee : detecte interieur/exterieur puis calcule les placos
function _recouvrirPieceFermee(mursDePiece, type) {
    // 1) Calculer le CENTRE de la piece (moyenne des extremites)
    var centreX = 0, centreZ = 0, nbPts = 0;
    for (var mi = 0; mi < mursDePiece.length; mi++) {
        var segs = editeur._segments(mursDePiece[mi].params);
        if (segs.length === 0) continue;
        centreX += segs[0].x1 + segs[0].x2;
        centreZ += segs[0].z1 + segs[0].z2;
        nbPts += 2;
    }
    centreX /= nbPts; centreZ /= nbPts;

    // 2) Detecter le SIDE avec la camera + determiner INTERIEUR ou EXTERIEUR
    var firstParams = mursDePiece[0].params;
    var firstSegs = editeur._segments(firstParams);
    var bt0 = BRIQUES_TYPES[firstParams.briqueType] || BRIQUES_TYPES.standard;
    var murEp0 = bt0.epaisseur;
    var s0 = firstSegs[0];
    var dx0 = s0.x2 - s0.x1, dz0 = s0.z2 - s0.z1;
    var len0 = Math.sqrt(dx0*dx0 + dz0*dz0);
    var nnx0 = -dz0/len0, nnz0 = dx0/len0;
    var camPerp = (sceneManager.camera.position.x - s0.x1)*nnx0 + (sceneManager.camera.position.z - s0.z1)*nnz0;
    var side = camPerp > murEp0/2 ? 1 : -1;

    // Le cote qui pointe vers le centre = INTERIEUR
    var midX = (s0.x1 + s0.x2) / 2, midZ = (s0.z1 + s0.z2) / 2;
    var toCentreX = centreX - midX, toCentreZ = centreZ - midZ;
    var dotCentre = toCentreX * nnx0 + toCentreZ * nnz0;
    // Si side pointe vers le centre = interieur, sinon = exterieur
    var estInterieur = (dotCentre > 0 && side > 0) || (dotCentre < 0 && side < 0);

    console.log('Piece fermee: side=' + side + ' interieur=' + estInterieur + ' centre=(' + centreX.toFixed(2) + ',' + centreZ.toFixed(2) + ')');

    // 3) Pour chaque mur : calculer le segment, l'epaisseur, la laine existante
    var infos = [];
    for (var mi = 0; mi < mursDePiece.length; mi++) {
        var el = mursDePiece[mi];
        var p = el.params;
        var segs = editeur._segments(p);
        if (segs.length === 0) continue;
        var seg = segs[0];
        var bt = BRIQUES_TYPES[p.briqueType] || BRIQUES_TYPES.standard;
        var murEp = bt.epaisseur;
        var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
        var slen = Math.sqrt(sdx*sdx + sdz*sdz);
        var snx = sdx/slen, snz = sdz/slen;
        var sAngle = Math.atan2(sdz, sdx) * 180 / Math.PI;

        // Laine existante sur ce cote
        var extraEp = 0;
        if (type === 'placo') {
            for (var li = 0; li < laineElements.length; li++) {
                var linfo = laineElements[li].userData.laineInfo;
                if (!linfo) continue;
                var dA = Math.abs(linfo.angle - sAngle) % 360;
                if (dA > 2 && dA < 358) continue;
                if (linfo.side === side) extraEp = Math.max(extraEp, linfo.ep);
            }
        }

        var placoEp = (type === 'placo' && placoModele) ? placoModele.ep : 0.013;

        // OFFSET AU COIN depend de interieur/exterieur
        var totalOffset;
        // Identifier la brique exacte de ce mur
        var briqueId = p.briqueType || 'standard';
        var briqueInfo = BRIQUES_TYPES[briqueId] || BRIQUES_TYPES.standard;
        var briqueEp = briqueInfo.epaisseur;

        if (estInterieur) {
            // INTERIEUR : pas de depassement, le placo fait exactement la longueur du mur
            totalOffset = 0;
        } else {
            // EXTERIEUR : epaisseur de CETTE brique + gap + laine + placo + 10cm
            totalOffset = briqueEp + 0.005 + extraEp + placoEp + 0.10;
        }

        console.log('Mur ' + mi + ': brique=' + briqueInfo.nom + ' ep=' + (briqueEp*100).toFixed(1) + 'cm → offset coin=' + (totalOffset*100).toFixed(1) + 'cm');

        infos.push({
            el: el, seg: seg, slen: slen, snx: snx, snz: snz, sAngle: sAngle,
            murEp: murEp, extraEp: extraEp, totalOffset: totalOffset,
            murH: p.hauteur || 2.5, oy: p.y || 0
        });
    }


    // 4) Chaque placo depasse aux 2 coins
    var nbPoses = 0;
    for (var i = 0; i < infos.length; i++) {
        var inf = infos[i];
        var prevIdx = (i + infos.length - 1) % infos.length;
        var nextIdx = (i + 1) % infos.length;
        var murEpEff = inf.murEp + inf.extraEp;

        var extDebut = infos[prevIdx].totalOffset;
        var extFin = infos[nextIdx].totalOffset;
        var poseLargeur = inf.slen + extDebut + extFin;
        var cx = inf.seg.x1 + inf.snx * inf.slen / 2 + inf.snx * (extFin - extDebut) / 2;
        var cz = inf.seg.z1 + inf.snz * inf.slen / 2 + inf.snz * (extFin - extDebut) / 2;

        // Supprimer les placos/laines existants sur cette face
        var ppFake = { worldX: cx, worldZ: cz, largeur: poseLargeur, angle: inf.sAngle, side: side, y: inf.oy };
        if (type === 'placo') { _supprimerPlacosChevauche(ppFake); }
        else { _supprimerLainesChevauche(ppFake); }

        // Poser
        if (type === 'placo') {
            var mod = placoModele;
            placo.setCouleurs(
                document.getElementById('npl-couleur').value,
                parseFloat(document.getElementById('npl-opacite').value) / 100
            );
            var g = placo.creer(mod.id, cx, cz, inf.oy, poseLargeur, inf.murH, inf.sAngle, mod.ep, side, murEpEff, inf.extraEp);
            placoElements.push(g);
        } else {
            var mod = laineModele;
            laineDeVerre.setCouleurs(
                document.getElementById('nlv-couleur').value,
                parseFloat(document.getElementById('nlv-opacite').value) / 100
            );
            var g = laineDeVerre.creer(mod.id, cx, cz, inf.oy, poseLargeur, inf.murH, inf.sAngle, mod.ep, side, inf.murEp);
            laineElements.push(g);
        }
        nbPoses++;

        // Decouper pour les fenetres/portes
        _decouperPlacoLainePourToutesExclusions(inf.el);
    }

    var nom = type === 'placo' ? 'Placo' : 'Laine';
    document.getElementById('info-bar').textContent = nom + ' pose sur ' + nbPoses + ' murs — piece fermee !';
}

function _recouvrirMurComplet(pp, type) {
    var element = pp.element;
    if (!element) return;

    // Mode "Recouvrir toute la piece" OU "Recouvrir tout le mur" sur un mur groupe
    var pieceCheck = type === 'placo' ? 'npl-piece' : 'nlv-piece';
    var recouvrirPiece = document.getElementById(pieceCheck) && document.getElementById(pieceCheck).checked;

    var params = element.params;
    if (recouvrirPiece) {
        // Cas 1 : mur carre/polygone (nbCotes > 1) = piece fermee en 1 seul element
        if (params.nbCotes && params.nbCotes > 1) {
            // Le code standard boucle sur tous les segments — continuer
        }
        // Cas 2 : murs individuels — chercher la piece fermee par collision
        else {
            var mursDePiece = _trouverMursPieceFermee(element);
            if (mursDePiece && mursDePiece.length > 1) {
                _recouvrirPieceFermee(mursDePiece, type);
                return;
            }
        }
    }

    var params = element.params;
    var segs = editeur._segments(params);
    var murH = params.hauteur || 2.5;
    var oy = params.y || 0;
    var bt = BRIQUES_TYPES[params.briqueType] || BRIQUES_TYPES.standard;
    var murEpFull = bt.epaisseur;

    // Detecter le cote : utiliser pp.side si fourni, sinon camera
    var seg0 = segs[pp.mur || 0];
    var dx0 = seg0.x2 - seg0.x1, dz0 = seg0.z2 - seg0.z1;
    var len0 = Math.sqrt(dx0 * dx0 + dz0 * dz0);
    var nnx0 = -dz0 / len0, nnz0 = dx0 / len0;
    var side;
    if (pp.side && pp.side !== 0) {
        side = pp.side;
    } else {
        var camPerp = (sceneManager.camera.position.x - seg0.x1) * nnx0 + (sceneManager.camera.position.z - seg0.z1) * nnz0;
        side = camPerp > murEpFull / 2 ? 1 : -1;
    }

    // Pour les murs multi-cotes (carre) : ajuster la largeur du placo
    // en soustrayant l'epaisseur du mur perpendiculaire a chaque bout
    var isMultiCotes = params.nbCotes && params.nbCotes > 1;

    var nbPoses = 0;

    for (var si = 0; si < segs.length; si++) {
        var seg = segs[si];
        var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
        var slen = Math.sqrt(sdx * sdx + sdz * sdz);
        if (slen < 0.01) continue;
        var snx = sdx / slen, snz = sdz / slen;
        var sAngle = Math.atan2(sdz, sdx) * 180 / Math.PI;

        // Centre de la face
        var cx = seg.x1 + snx * slen / 2;
        var cz = seg.z1 + snz * slen / 2;

        // Calculer l'epaisseur extra (laine existante sur ce cote)
        var extraEp = 0;
        if (type === 'placo') {
            // Chercher si laine existe sur cette face/cote
            for (var li = 0; li < laineElements.length; li++) {
                var linfo = laineElements[li].userData.laineInfo;
                if (!linfo) continue;
                var dA = Math.abs(linfo.angle - sAngle) % 360;
                if (dA > 2 && dA < 358) continue;
                if (linfo.side === side) {
                    extraEp = Math.max(extraEp, linfo.ep);
                }
            }
        }

        var murEpEff = murEpFull + extraEp;

        // Pour un carre : ajuster le placo aux coins selon le cote
        var poseLargeur = slen;
        var briqueId = params.briqueType || 'standard';
        var briqueInfo = BRIQUES_TYPES[briqueId] || BRIQUES_TYPES.standard;
        var briqueEp = briqueInfo.epaisseur;
        if (isMultiCotes && recouvrirPiece) {
            var placoEpLocal = (type === 'placo' && placoModele) ? placoModele.ep : 0.013;
            // Extension = juste laine + placo (la brique est deja dans le segment du carre)
            var coinExt = extraEp + placoEpLocal;
            poseLargeur = slen + 2 * coinExt;
        } else if (isMultiCotes) {
            // Reduire de 2x epaisseur brique aux coins (zone de chevauchement des murs perpendiculaires)
            poseLargeur = slen - 2 * briqueEp;
        }


        // Supprimer les placos/laines existants sur cette face/cote
        var ppFake = {
            worldX: cx, worldZ: cz,
            largeur: poseLargeur, angle: sAngle, side: side, y: oy
        };
        if (type === 'placo') {
            _supprimerPlacosChevauche(ppFake);
        } else {
            _supprimerLainesChevauche(ppFake);
        }

        // Poser
        if (type === 'placo') {
            var mod = placoModele;
            placo.setCouleurs(
                document.getElementById('npl-couleur').value,
                parseFloat(document.getElementById('npl-opacite').value) / 100
            );
            var g = placo.creer(mod.id, cx, cz, oy, poseLargeur, murH, sAngle, mod.ep, side, murEpEff, extraEp);
            placoElements.push(g);
        } else {
            var mod = laineModele;
            laineDeVerre.setCouleurs(
                document.getElementById('nlv-couleur').value,
                parseFloat(document.getElementById('nlv-opacite').value) / 100
            );
            var g = laineDeVerre.creer(mod.id, cx, cz, oy, poseLargeur, murH, sAngle, mod.ep, side, murEpFull);
            laineElements.push(g);
        }
        nbPoses++;
    }

    // Decouper automatiquement pour les fenetres/portes existantes
    _decouperPlacoLainePourToutesExclusions(element);

    var nom = type === 'placo' ? 'Placo' : 'Laine';
    document.getElementById('info-bar').textContent = nom + ' pose sur ' + nbPoses + ' face(s) ! Cliquez sur un autre mur | Echap = quitter';
}

// Apres pose placo/laine : decouper pour toutes les fenetres/portes du mur
function _decouperPlacoLainePourToutesExclusions(element) {
    if (!element || !element.params) return;
    var p = element.params;
    if (!p.trous || p.trous.length === 0) return;

    for (var t = 0; t < p.trous.length; t++) {
        var tr = p.trous[t];
        _couperPlacosLainesParPorte(element, tr.x || 0, tr.y || 0, tr.largeur, tr.hauteur, tr.mur || 0);
    }
}

function _supprimerPlacosChevauche(pp) {
    var toRemove = [];
    var cosA = Math.cos(pp.angle * Math.PI / 180);
    var sinA = Math.sin(pp.angle * Math.PI / 180);
    // Perpendiculaire au mur (pour distinguer 2 murs paralleles proches)
    var perpX = -sinA;
    var perpZ = cosA;
    for (var i = 0; i < placoElements.length; i++) {
        var pg = placoElements[i];
        var info = pg.userData.placoInfo;
        if (!info) continue;
        // Meme cote ?
        if (info.side !== pp.side) continue;
        // Meme angle (meme mur) ? Tolerance de 2 degres
        var dAngle = Math.abs(info.angle - pp.angle) % 360;
        if (dAngle > 2 && dAngle < 358) continue;
        // Meme hauteur Y ?
        if (Math.abs(info.y - pp.y) > 0.1) continue;
        // Distance perpendiculaire entre les 2 placos (distinguer murs paralleles)
        var ddx = info.worldX - pp.worldX;
        var ddz = info.worldZ - pp.worldZ;
        var perpDist = Math.abs(ddx * perpX + ddz * perpZ);
        if (perpDist > 0.3) continue; // trop loin = mur different
        // Chevauchement horizontal : projeter sur l'axe du segment
        var proj1 = info.worldX * cosA + info.worldZ * sinA;
        var proj2 = pp.worldX * cosA + pp.worldZ * sinA;
        var half1 = info.largeur / 2;
        var half2 = pp.largeur / 2;
        // Test de chevauchement 1D
        if (proj1 - half1 < proj2 + half2 && proj1 + half1 > proj2 - half2) {
            toRemove.push(i);
        }
    }
    // Supprimer du dernier au premier
    for (var i = toRemove.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(placoElements[toRemove[i]]);
        placoElements.splice(toRemove[i], 1);
    }
}

// Supprimer les laines existantes qui chevauchent la zone (meme mur, meme cote)
function _supprimerLainesChevauche(lp) {
    var toRemove = [];
    var cosA = Math.cos(lp.angle * Math.PI / 180);
    var sinA = Math.sin(lp.angle * Math.PI / 180);
    var perpX = -sinA;
    var perpZ = cosA;
    for (var i = 0; i < laineElements.length; i++) {
        var lg = laineElements[i];
        var info = lg.userData.laineInfo;
        if (!info) continue;
        if (info.side !== lp.side) continue;
        var dAngle = Math.abs(info.angle - lp.angle) % 360;
        if (dAngle > 2 && dAngle < 358) continue;
        if (Math.abs(info.y - lp.y) > 0.1) continue;
        // Distance perpendiculaire (distinguer murs paralleles proches)
        var ddx = info.worldX - lp.worldX;
        var ddz = info.worldZ - lp.worldZ;
        var perpDist = Math.abs(ddx * perpX + ddz * perpZ);
        if (perpDist > 0.3) continue; // mur different
        var proj1 = info.worldX * cosA + info.worldZ * sinA;
        var proj2 = lp.worldX * cosA + lp.worldZ * sinA;
        var half1 = info.largeur / 2;
        var half2 = lp.largeur / 2;
        if (proj1 - half1 < proj2 + half2 && proj1 + half1 > proj2 - half2) {
            toRemove.push(i);
        }
    }
    for (var i = toRemove.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(laineElements[toRemove[i]]);
        laineElements.splice(toRemove[i], 1);
    }
}

// Positionner le ghost laine sur un mur (avant clic = curseur vertical fin)
function positionnerGhostLaine(element, hitPoint) {
    if (!ghostLaine || !element || !laineModele) return;
    var params = element.params;
    var segs = editeur._segments(params);
    var pos = editeur.trouverPositionSurMur(element, hitPoint.x, hitPoint.z);
    var seg = segs[pos.mur];
    if (!seg) { ghostLaine.visible = false; return; }

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;

    var bt = BRIQUES_TYPES[params.briqueType] || BRIQUES_TYPES.standard;
    var murEpFull = bt.epaisseur;
    var epLaine = laineModele.ep || 0.100;
    var murH = params.hauteur || 2.5;
    var oy = params.y || 0;

    // Auto-detecter le cote du mur — hitPoint en priorite, camera en fallback pour les cas ambigus
    var nnx = -dz / len;
    var nnz = dx / len;
    var hitPerpDot = (hitPoint.x - seg.x1) * nnx + (hitPoint.z - seg.z1) * nnz;
    var camPerpDot = (sceneManager.camera.position.x - seg.x1) * nnx + (sceneManager.camera.position.z - seg.z1) * nnz;
    var side;
    // Si le hitPoint est loin du mur (vient d'un placo/laine via fallback), utiliser la camera
    if (hitPerpDot > murEpFull * 1.5 || hitPerpDot < -murEpFull * 0.5) {
        side = camPerpDot > murEpFull / 2 ? 1 : -1;
    } else if (hitPerpDot > murEpFull * 0.7) {
        side = 1;
    } else if (hitPerpDot < murEpFull * 0.3) {
        side = -1;
    } else {
        side = camPerpDot > murEpFull / 2 ? 1 : -1;
    }

    // Mode recouvrir : ghost sur toute la face / sinon curseur fin
    var recouvrir = document.getElementById('nlv-recouvrir') && document.getElementById('nlv-recouvrir').checked;
    var localX, ghostW;
    if (recouvrir) {
        localX = len / 2;
        ghostW = len;
        // Mur carre : reduire de 2x epaisseur brique aux coins
        var isMultiL = params.nbCotes && params.nbCotes > 1;
        if (isMultiL) {
            ghostW = len - 2 * bt.epaisseur;
        }
    } else {
        localX = Math.max(0, Math.min(len, pos.localX));
        ghostW = 0.04;
    }

    var wx = seg.x1 + nx * localX;
    var wz = seg.z1 + nz * localX;
    var wy = oy;

    var o = _placoOffset(dx, dz, len, murEpFull, epLaine, side);
    ghostLaine.position.set(wx + o.x, wy, wz + o.z);
    ghostLaine.rotation.y = -Math.atan2(dz, dx);
    ghostLaine.visible = true;

    var gd = ghostLaine.userData._ghostDims || { width: 0, height: 0 };
    if (Math.abs(gd.width - ghostW) > 0.01 || Math.abs(gd.height - murH) > 0.01) {
        var coulGhost = document.getElementById('nlv-couleur') ? document.getElementById('nlv-couleur').value : '#F2D544';
        LaineDeVerre.majGhost(ghostLaine, ghostW, murH, epLaine, coulGhost);
    }

    ghostLaine.userData._lainePos = {
        localX: localX,
        seg: seg, mur: pos.mur, element: element,
        len: len, nx: nx, nz: nz,
        y: oy, murH: murH,
        angle: Math.atan2(dz, dx) * 180 / Math.PI,
        side: side, murEpFull: murEpFull
    };
}

// Positionner le ghost laine en mode glisse
function positionnerGhostLaineDrag(element, hitPoint) {
    if (!ghostLaine || !laineDragStart || !laineModele) return;
    var ds = laineDragStart;
    var params = element.params;
    var segs = editeur._segments(params);
    var seg = segs[ds.mur];
    if (!seg) return;

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;

    // Pour mur carre interieur : limiter aux bornes interieures
    var clampMinL = 0, clampMaxL = len;
    var isMultiDragL = element.params.nbCotes && element.params.nbCotes > 1;
    if (isMultiDragL) {
        var btDragL = BRIQUES_TYPES[element.params.briqueType] || BRIQUES_TYPES.standard;
        clampMinL = btDragL.epaisseur;
        clampMaxL = len - btDragL.epaisseur;
    }
    var px = hitPoint.x - seg.x1, pz = hitPoint.z - seg.z1;
    var endLocalX = Math.max(clampMinL, Math.min(clampMaxL, px * nx + pz * nz));

    var minX = Math.min(ds.localX, endLocalX);
    var maxX = Math.max(ds.localX, endLocalX);
    var laineLargeur = maxX - minX;
    if (laineLargeur < 0.02) laineLargeur = 0.02;

    var murH = params.hauteur || 2.5;
    var oy = params.y || 0;
    var cx = (minX + maxX) / 2;
    var epLaine = laineModele.ep || 0.100;

    var wx = seg.x1 + nx * cx;
    var wz = seg.z1 + nz * cx;
    var wy = oy;

    var o = _placoOffset(dx, dz, len, ds.murEpFull, epLaine, ds.side);
    ghostLaine.position.set(wx + o.x, wy, wz + o.z);
    ghostLaine.rotation.y = -Math.atan2(dz, dx);
    ghostLaine.visible = true;

    var gd = ghostLaine.userData._ghostDims || { width: 0, height: 0 };
    if (Math.abs(gd.width - laineLargeur) > 0.01 || Math.abs(gd.height - murH) > 0.01) {
        var coulGhost = document.getElementById('nlv-couleur') ? document.getElementById('nlv-couleur').value : '#F2D544';
        LaineDeVerre.majGhost(ghostLaine, laineLargeur, murH, epLaine, coulGhost);
    }

    ghostLaine.userData._lainePos = {
        worldX: wx, worldZ: wz,
        y: oy, largeur: laineLargeur, hauteur: murH,
        angle: Math.atan2(dz, dx) * 180 / Math.PI,
        side: ds.side, element: element, mur: ds.mur,
        murEpFull: ds.murEpFull
    };

    document.getElementById('info-bar').textContent = 'LAINE — ' + laineLargeur.toFixed(2) + 'm x ' + murH.toFixed(2) + 'm | Relachez pour poser';
}

// Fonction pour positionner le ghost a une position X/Y precise sur un mur
// Calculer l'offset perpendiculaire du placo par rapport au mur
function _placoOffset(dxSeg, dzSeg, lenSeg, murEpFull, epPlaco, side, extraBack) {
    var off;
    if (side >= 0) {
        off = murEpFull + epPlaco / 2 + 0.001;
    } else {
        // extraBack = epaisseur des couches sur le cote arriere (laine, placo existant)
        var eb = extraBack || 0;
        off = -(eb + epPlaco / 2 + 0.001);
    }
    return {
        x: -(dzSeg / lenSeg) * off,
        z: (dxSeg / lenSeg) * off
    };
}

// Positionner le ghost placo sur un mur (avant clic = curseur vertical fin)
function positionnerGhostPlaco(element, hitPoint, extraEp) {
    if (!ghostPlaco || !element || !placoModele) return;
    var params = element.params;
    var segs = editeur._segments(params);
    var pos = editeur.trouverPositionSurMur(element, hitPoint.x, hitPoint.z);
    var seg = segs[pos.mur];
    if (!seg) { ghostPlaco.visible = false; return; }

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;

    var bt = BRIQUES_TYPES[params.briqueType] || BRIQUES_TYPES.standard;
    var murEpFull = bt.epaisseur;
    var epPlaco = placoModele.ep || 0.013;
    var murH = params.hauteur || 2.5;
    var oy = params.y || 0;
    var laineExtraEp = extraEp || 0; // epaisseur laine sous le placo

    // Auto-detecter le cote du mur — hitPoint en priorite, camera en fallback
    var nnx = -dz / len;
    var nnz = dx / len;
    var hitPerpDot = (hitPoint.x - seg.x1) * nnx + (hitPoint.z - seg.z1) * nnz;
    var camPerpDot = (sceneManager.camera.position.x - seg.x1) * nnx + (sceneManager.camera.position.z - seg.z1) * nnz;
    var side;
    if (hitPerpDot > murEpFull * 1.5 || hitPerpDot < -murEpFull * 0.5) {
        side = camPerpDot > murEpFull / 2 ? 1 : -1;
    } else if (hitPerpDot > murEpFull * 0.7) {
        side = 1;
    } else if (hitPerpDot < murEpFull * 0.3) {
        side = -1;
    } else {
        side = camPerpDot > murEpFull / 2 ? 1 : -1;
    }

    // murEpFull effectif : mur + laine (le placo se pose par-dessus)
    var murEpEff = murEpFull + laineExtraEp;

    // Mode recouvrir : ghost sur toute la face / sinon curseur fin
    var recouvrir = document.getElementById('npl-recouvrir') && document.getElementById('npl-recouvrir').checked;
    var localX, ghostW;
    if (recouvrir) {
        localX = len / 2; // centre de la face
        ghostW = len;
        // Mur carre : reduire de 2x epaisseur brique aux coins
        var isMulti = params.nbCotes && params.nbCotes > 1;
        if (isMulti) {
            ghostW = len - 2 * bt.epaisseur;
        }
    } else {
        localX = Math.max(0, Math.min(len, pos.localX));
        ghostW = 0.04;
    }

    var wx = seg.x1 + nx * localX;
    var wz = seg.z1 + nz * localX;
    var wy = oy; // Group positionne ses enfants depuis y=0

    // Pour side=1 : offset = murEpFull + extra + placo/2 (devant le mur + couches)
    // Pour side=-1 : offset = -(extra + placo/2) (derriere les couches)
    var o = _placoOffset(dx, dz, len, murEpEff, epPlaco, side, laineExtraEp);
    ghostPlaco.position.set(wx + o.x, wy, wz + o.z);
    ghostPlaco.rotation.y = -Math.atan2(dz, dx);
    ghostPlaco.visible = true;

    var gd = ghostPlaco.userData._ghostDims || { width: 0, height: 0 };
    if (Math.abs(gd.width - ghostW) > 0.01 || Math.abs(gd.height - murH) > 0.01) {
        var coulGhost = document.getElementById('npl-couleur') ? document.getElementById('npl-couleur').value : '#F5F5F0';
        Placo.majGhost(ghostPlaco, ghostW, murH, epPlaco, coulGhost);
    }

    ghostPlaco.userData._placoPos = {
        localX: localX,
        seg: seg, mur: pos.mur, element: element,
        len: len, nx: nx, nz: nz,
        y: oy, murH: murH,
        angle: Math.atan2(dz, dx) * 180 / Math.PI,
        side: side, murEpFull: murEpEff, extraBack: laineExtraEp
    };

}

// Positionner le ghost placo en mode glisse (entre point de depart et souris)
function positionnerGhostPlacoDrag(element, hitPoint) {
    if (!ghostPlaco || !placoDragStart || !placoModele) return;
    var ds = placoDragStart;
    var params = element.params;
    var segs = editeur._segments(params);
    var seg = segs[ds.mur];
    if (!seg) return;

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len, nz = dz / len;

    // Projeter la souris sur le segment, clamper aux bornes du mur
    // Pour mur carre interieur : limiter aux bornes interieures (sans epaisseur brique aux coins)
    var clampMin = 0, clampMax = len;
    var isMultiDrag = element.params.nbCotes && element.params.nbCotes > 1;
    if (isMultiDrag) {
        var btDrag = BRIQUES_TYPES[element.params.briqueType] || BRIQUES_TYPES.standard;
        clampMin = btDrag.epaisseur;
        clampMax = len - btDrag.epaisseur;
    }
    var px = hitPoint.x - seg.x1, pz = hitPoint.z - seg.z1;
    var endLocalX = Math.max(clampMin, Math.min(clampMax, px * nx + pz * nz));

    // Zone selectionnee
    var minX = Math.min(ds.localX, endLocalX);
    var maxX = Math.max(ds.localX, endLocalX);
    var placLargeur = maxX - minX;
    if (placLargeur < 0.02) placLargeur = 0.02;

    var murH = params.hauteur || 2.5;
    var oy = params.y || 0;
    var cx = (minX + maxX) / 2;
    var epPlaco = placoModele.ep || 0.013;

    var wx = seg.x1 + nx * cx;
    var wz = seg.z1 + nz * cx;
    var wy = oy; // Group positionne ses enfants depuis y=0

    var o = _placoOffset(dx, dz, len, ds.murEpFull, epPlaco, ds.side, ds.extraBack || 0);
    ghostPlaco.position.set(wx + o.x, wy, wz + o.z);
    ghostPlaco.rotation.y = -Math.atan2(dz, dx);
    ghostPlaco.visible = true;

    var gd = ghostPlaco.userData._ghostDims || { width: 0, height: 0 };
    if (Math.abs(gd.width - placLargeur) > 0.01 || Math.abs(gd.height - murH) > 0.01) {
        var coulGhost = document.getElementById('npl-couleur') ? document.getElementById('npl-couleur').value : '#F5F5F0';
        Placo.majGhost(ghostPlaco, placLargeur, murH, epPlaco, coulGhost);
    }

    ghostPlaco.userData._placoPos = {
        worldX: wx, worldZ: wz,
        y: oy, largeur: placLargeur, hauteur: murH,
        angle: Math.atan2(dz, dx) * 180 / Math.PI,
        side: ds.side, element: element, mur: ds.mur,
        murEpFull: ds.murEpFull, extraBack: ds.extraBack || 0
    };

    document.getElementById('info-bar').textContent = 'PLACO — ' + placLargeur.toFixed(2) + 'm x ' + murH.toFixed(2) + 'm | Relachez pour poser';
}

function positionnerGhostPrecis(el, localX, localY, largeur, hauteur, segIndex) {
    if (!ghostTrou) return;
    var params = el.params;
    var segs = editeur._segments(params);
    var seg = segs[segIndex || 0];
    if (!seg) return;

    var dx = seg.x2 - seg.x1;
    var dz = seg.z2 - seg.z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var nx = dx / len;
    var nz = dz / len;

    var cx = localX + largeur / 2;
    cx = Math.max(largeur / 2, Math.min(len - largeur / 2, cx));

    var wx = seg.x1 + nx * cx;
    var wz = seg.z1 + nz * cx;
    var wy = localY + hauteur / 2 + (params.y || 0);

    ghostTrou.position.set(wx, wy, wz);
    ghostTrou.rotation.y = -Math.atan2(dz, dx);
    ghostTrou.visible = true;
}

// --- FENETRE PRECIS ---
// Quand on clique sur un mur en mode fenetre, si modePrecisFenetre, on ouvre le popup
// Le mode s'active quand on coche une option ou clique un bouton

// Intercepter le clic sur mur en mode fenetre pour le mode precis
// On va modifier le handler existant : si modePrecisFenetre est vrai,
// au lieu de poser, on ouvre le popup precis

// Bouton Valider fenetre precise
document.getElementById('btn-nf-precis-valider').addEventListener('click', function() {
    if (!precisFenetreElement || !precisFenetreModele) return;
    var el = precisFenetreElement;
    var mod = precisFenetreModele;
    var tx = parseFloat(document.getElementById('nf-pos-x').value) || 0;
    var ty = parseFloat(document.getElementById('nf-pos-y').value) || 0;
    var elHaut = el.params.hauteur || 2.5;

    // Utiliser le segment reel (segment 0)
    var segs = editeur._segments(el.params);
    var seg = segs[0];
    var segLen = el.params.distance || 5;
    var snx = 1, snz = 0, nnx = 0, nnz = 0;
    var segAngle = el.params.angle || 0;
    if (seg) {
        var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
        segLen = Math.sqrt(sdx * sdx + sdz * sdz);
        snx = sdx / segLen; snz = sdz / segLen;
        nnx = -sdz / segLen; nnz = sdx / segLen;
        segAngle = Math.atan2(sdz, sdx) * 180 / Math.PI;
    }

    // Clamper au lieu d'alerter
    if (tx < 0) tx = 0;
    if (tx + mod.largeur > segLen) tx = segLen - mod.largeur;
    if (tx < 0) tx = 0;
    if (ty < 0) ty = 0;
    if (ty + mod.hauteur > elHaut) ty = elHaut - mod.hauteur;
    if (ty < 0) ty = 0;

    // Position monde = segment reel + offset epaisseur cote camera
    var bt = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
    var centerX = tx + mod.largeur / 2;
    var _camDotNF = (sceneManager.camera.position.x - seg.x1) * nnx + (sceneManager.camera.position.z - seg.z1) * nnz;
    var _sideNF = _camDotNF >= 0 ? 1 : -1;
    var fenetreWx = seg.x1 + snx * centerX + nnx * bt.epaisseur / 2 * _sideNF;
    var fenetreWz = seg.z1 + snz * centerX + nnz * bt.epaisseur / 2 * _sideNF;
    var fenetreY = ty + (el.params.y || 0);

    editeur.sauvegarderEtat();
    editeur.ajouterTrouElement(el.id, {
        x: tx, y: ty, largeur: mod.largeur, hauteur: mod.hauteur, mur: 0
    });

    fenetre.setCouleurs(
        document.getElementById('nf-cadre').value,
        document.getElementById('nf-vitre').value,
        parseFloat(document.getElementById('nf-opacite').value) / 100
    );
    fenetre.creer(mod.id, fenetreWx, fenetreWz, fenetreY, mod.largeur, mod.hauteur, segAngle);

    // Couper les placos et laines traverses par la fenetre
    _couperPlacosLainesParPorte(el, tx, ty, mod.largeur, mod.hauteur, 0);

    document.getElementById('nf-precis-popup').style.display = 'none';
    supprimerGhostTrou();
    precisFenetreElement = null;
    precisFenetreModele = null;
    modePrecisFenetre = false;
    document.getElementById('info-bar').textContent = 'Fenetre posee !';
});

document.getElementById('btn-nf-precis-annuler').addEventListener('click', function() {
    document.getElementById('nf-precis-popup').style.display = 'none';
    supprimerGhostTrou();
    precisFenetreElement = null;
    precisFenetreModele = null;
    modePrecisFenetre = false;
    toutDesactiver();
});

// Sync slider <-> input pour fenetre X
function syncNfGhost() {
    if (!precisFenetreElement || !precisFenetreModele) return;
    var x = parseFloat(document.getElementById('nf-pos-x').value) || 0;
    var y = parseFloat(document.getElementById('nf-pos-y').value) || 0;
    positionnerGhostPrecis(precisFenetreElement, x, y, precisFenetreModele.largeur, precisFenetreModele.hauteur);
}
document.getElementById('nf-pos-x-range').addEventListener('input', function() {
    document.getElementById('nf-pos-x').value = parseFloat(this.value).toFixed(2);
    syncNfGhost();
});
document.getElementById('nf-pos-x').addEventListener('input', function() {
    document.getElementById('nf-pos-x-range').value = this.value;
    syncNfGhost();
});
document.getElementById('nf-pos-y-range').addEventListener('input', function() {
    document.getElementById('nf-pos-y').value = parseFloat(this.value).toFixed(2);
    syncNfGhost();
});
document.getElementById('nf-pos-y').addEventListener('input', function() {
    document.getElementById('nf-pos-y-range').value = this.value;
    syncNfGhost();
});

// Navigation etapes fenetre
document.getElementById('btn-nf-next-y').addEventListener('click', function() {
    document.getElementById('nf-step-x').style.display = 'none';
    document.getElementById('nf-step-y').style.display = 'block';
    document.getElementById('info-bar').textContent = 'FENETRE PRECIS — Etape 2/2 : Ajustez la hauteur Y';
});
document.getElementById('btn-nf-back-x').addEventListener('click', function() {
    document.getElementById('nf-step-y').style.display = 'none';
    document.getElementById('nf-step-x').style.display = 'block';
    document.getElementById('info-bar').textContent = 'FENETRE PRECIS — Etape 1/2 : Ajustez la position X';
});

// --- PORTE PRECIS ---
document.getElementById('btn-np-precis-valider').addEventListener('click', function() {
    if (!precisPorteElement || !precisPorteModele) return;
    var el = precisPorteElement;
    var mod = precisPorteModele;
    var tx = parseFloat(document.getElementById('np-pos-x').value) || 0;
    var ty = parseFloat(document.getElementById('np-pos-y').value) || 0;
    var elHaut = el.params.hauteur || 2.5;

    // Utiliser le segment reel (segment 0)
    var segs = editeur._segments(el.params);
    var seg = segs[0];
    var segLen = el.params.distance || 5;
    var snx = 1, snz = 0, nnx = 0, nnz = 0;
    var segAngle = el.params.angle || 0;
    if (seg) {
        var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
        segLen = Math.sqrt(sdx * sdx + sdz * sdz);
        snx = sdx / segLen; snz = sdz / segLen;
        nnx = -sdz / segLen; nnz = sdx / segLen;
        segAngle = Math.atan2(sdz, sdx) * 180 / Math.PI;
    }

    // Clamper au lieu d'alerter
    if (tx < 0) tx = 0;
    if (tx + mod.largeur > segLen) tx = segLen - mod.largeur;
    if (tx < 0) tx = 0;
    if (ty < 0) ty = 0;
    if (ty + mod.hauteur > elHaut) ty = elHaut - mod.hauteur;
    if (ty < 0) ty = 0;

    // Position monde = segment reel + offset epaisseur cote camera
    var bt = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
    var centerX = tx + mod.largeur / 2;
    var _camDotNP = (sceneManager.camera.position.x - seg.x1) * nnx + (sceneManager.camera.position.z - seg.z1) * nnz;
    var _sideNP = _camDotNP >= 0 ? 1 : -1;
    var porteWx = seg.x1 + snx * centerX + nnx * bt.epaisseur / 2 * _sideNP;
    var porteWz = seg.z1 + snz * centerX + nnz * bt.epaisseur / 2 * _sideNP;
    var porteY = ty + (el.params.y || 0);

    editeur.sauvegarderEtat();
    editeur.ajouterTrouElement(el.id, {
        x: tx, y: ty, largeur: mod.largeur, hauteur: mod.hauteur, mur: 0
    });

    porte.setCouleurs(
        document.getElementById('np-cadre').value,
        document.getElementById('np-porte').value
    );
    porte.creer(mod.id, porteWx, porteWz, porteY, mod.largeur, mod.hauteur, segAngle);

    // Couper les placos et laines traverses par la porte
    _couperPlacosLainesParPorte(el, tx, ty, mod.largeur, mod.hauteur, 0);

    document.getElementById('np-precis-popup').style.display = 'none';
    supprimerGhostTrou();
    precisPorteElement = null;
    precisPorteModele = null;
    modePrecisPorte = false;
    document.getElementById('info-bar').textContent = 'Porte posee !';
});

document.getElementById('btn-np-precis-annuler').addEventListener('click', function() {
    document.getElementById('np-precis-popup').style.display = 'none';
    supprimerGhostTrou();
    precisPorteElement = null;
    precisPorteModele = null;
    modePrecisPorte = false;
    toutDesactiver();
});

// Sync slider <-> input pour porte X
function syncNpGhost() {
    if (!precisPorteElement || !precisPorteModele) return;
    var x = parseFloat(document.getElementById('np-pos-x').value) || 0;
    var y = parseFloat(document.getElementById('np-pos-y').value) || 0;
    positionnerGhostPrecis(precisPorteElement, x, y, precisPorteModele.largeur, precisPorteModele.hauteur);
}
document.getElementById('np-pos-x-range').addEventListener('input', function() {
    document.getElementById('np-pos-x').value = parseFloat(this.value).toFixed(2);
    syncNpGhost();
});
document.getElementById('np-pos-x').addEventListener('input', function() {
    document.getElementById('np-pos-x-range').value = this.value;
    syncNpGhost();
});
document.getElementById('np-pos-y-range').addEventListener('input', function() {
    document.getElementById('np-pos-y').value = parseFloat(this.value).toFixed(2);
    syncNpGhost();
});
document.getElementById('np-pos-y').addEventListener('input', function() {
    document.getElementById('np-pos-y-range').value = this.value;
    syncNpGhost();
});

// Navigation etapes porte
document.getElementById('btn-np-next-y').addEventListener('click', function() {
    document.getElementById('np-step-x').style.display = 'none';
    document.getElementById('np-step-y').style.display = 'block';
    document.getElementById('info-bar').textContent = 'PORTE PRECIS — Etape 2/2 : Ajustez la hauteur Y';
});
document.getElementById('btn-np-back-x').addEventListener('click', function() {
    document.getElementById('np-step-y').style.display = 'none';
    document.getElementById('np-step-x').style.display = 'block';
    document.getElementById('info-bar').textContent = 'PORTE PRECIS — Etape 1/2 : Ajustez la position X';
});

// Mettre a jour le ghost quand on change les dimensions dans le popup
['tr-largeur', 'tr-hauteur'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
        if (modeTrouRapide && ghostTrou) {
            supprimerGhostTrou();
            var l = parseFloat(document.getElementById('tr-largeur').value) || 0.9;
            var h = parseFloat(document.getElementById('tr-hauteur').value) || 2.1;
            var mat = new THREE.MeshBasicMaterial({ color: '#ff0000', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
            var geo;
            if (trouRapideForme === 'rond') {
                var diam = Math.max(l, h);
                document.getElementById('tr-largeur').value = diam;
                document.getElementById('tr-hauteur').value = diam;
                geo = new THREE.CylinderGeometry(diam / 2, diam / 2, 0.15, 32);
                ghostTrou = new THREE.Mesh(geo, mat);
                ghostTrou.rotation.x = Math.PI / 2;
            } else {
                geo = new THREE.BoxGeometry(l, h, 0.15);
                ghostTrou = new THREE.Mesh(geo, mat);
            }
            ghostTrou.visible = false;
            sceneManager.scene.add(ghostTrou);
        }
    });
});

document.getElementById('ctx-grouper').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    activerGrouper();
    // Pre-selectionner ce mur
    grouperSelection.push(el.id);
    surlignerGroupe(el.group || el.brique.group, '#43B047');
    document.getElementById('info-bar').textContent = 'GROUPER — 1 mur(s) selectionne(s) | Cliquez d\'autres murs puis validez';
});

document.getElementById('ctx-degrouper').addEventListener('click', function() {
    if (!ctxElement || !ctxElement.params.groupeId) return;
    document.getElementById('ctx-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    editeur.degrouperGroupe(ctxElement.params.groupeId);
    ctxElement = null;
    document.getElementById('info-bar').textContent = 'Groupe separe !';
});

var redimMultiSeg = -1; // -1 = mur simple, sinon index du segment clique

document.getElementById('ctx-agrandir').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    toutDesactiver();
    modeRedim = true;
    redimElement = el;

    var isMulti = el.params.nbCotes && el.params.nbCotes > 1;

    if (isMulti) {
        // Multi-cotes : detecter le segment le plus proche du clic
        var menu = document.getElementById('ctx-menu');
        var menuRect = menu.getBoundingClientRect();
        var clickSX = menuRect.left, clickSY = menuRect.top;
        var segs = editeur._segments(el.params);
        var bestSeg = 0, bestDist = Infinity;
        var canvasRect = sceneManager.renderer.domElement.getBoundingClientRect();
        for (var s = 0; s < segs.length; s++) {
            var seg = segs[s];
            var cx = (seg.x1 + seg.x2) / 2, cz = (seg.z1 + seg.z2) / 2;
            var v = new THREE.Vector3(cx, 0.5, cz);
            v.project(sceneManager.camera);
            var sx = (v.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left;
            var sy = (-v.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top;
            var d = Math.sqrt((clickSX - sx) * (clickSX - sx) + (clickSY - sy) * (clickSY - sy));
            if (d < bestDist) { bestDist = d; bestSeg = s; }
        }
        redimMultiSeg = bestSeg;
        var seg = segs[bestSeg];
        var sdx = seg.x2 - seg.x1, sdz = seg.z2 - seg.z1;
        redimAngle = Math.atan2(sdz, sdx) * 180 / Math.PI;
        redimOrigX = seg.x1;
        redimOrigZ = seg.z1;
        redimOrigDist = (bestSeg % 2 === 0) ? (el.params.distanceBranches || el.params.distance) : el.params.distance;
        var nomSeg = (bestSeg % 2 === 0) ? 'branche' : 'fond';
        surlignerGroupe(el.group || el.brique.group, '#00ccff');
        container.style.cursor = 'ew-resize';
        document.getElementById('info-bar').textContent = 'REDIMENSIONNER — Segment ' + bestSeg + ' (' + nomSeg + ') — Bougez la souris puis cliquez | Echap = annuler';
    } else {
        // Mur simple
        redimMultiSeg = -1;
        redimAngle = el.params.angle || 0;
        creerRedimGhost(el);
        redimOrigX = el.params.x || 0;
        redimOrigZ = el.params.z || 0;
        redimOrigDist = el.params.distance;

        var ext = editeur.extremitesMur(el);
        var menu = document.getElementById('ctx-menu');
        var menuRect = menu.getBoundingClientRect();
        var clickScreenX = menuRect.left, clickScreenY = menuRect.top;
        var v1 = new THREE.Vector3(ext.x1, 0.5, ext.z1);
        var v2 = new THREE.Vector3(ext.x2, 0.5, ext.z2);
        v1.project(sceneManager.camera);
        v2.project(sceneManager.camera);
        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        var sx1 = (v1.x * 0.5 + 0.5) * rect.width + rect.left;
        var sy1 = (-v1.y * 0.5 + 0.5) * rect.height + rect.top;
        var sx2 = (v2.x * 0.5 + 0.5) * rect.width + rect.left;
        var sy2 = (-v2.y * 0.5 + 0.5) * rect.height + rect.top;
        var d1 = Math.sqrt((clickScreenX - sx1) * (clickScreenX - sx1) + (clickScreenY - sy1) * (clickScreenY - sy1));
        var d2 = Math.sqrt((clickScreenX - sx2) * (clickScreenX - sx2) + (clickScreenY - sy2) * (clickScreenY - sy2));
        redimCote = d1 < d2 ? 'debut' : 'fin';

        surlignerGroupe(el.group || el.brique.group, '#00ccff');
        container.style.cursor = 'ew-resize';
        document.getElementById('info-bar').textContent = 'REDIMENSIONNER — Bougez la souris puis cliquez | Echap = annuler';
    }
    ctxElement = null;
});

document.getElementById('ctx-agrandir-v').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    toutDesactiver();
    modeRedim = true;
    redimVertical = true;
    redimElement = el;
    redimOrigX = el.params.x || 0;
    redimOrigZ = el.params.z || 0;
    redimOrigHauteur = el.params.hauteur || 2.5;
    creerRedimGhost(el);
    surlignerGroupe(el.group || el.brique.group, '#cc66ff');
    container.style.cursor = 'ns-resize';
    document.getElementById('info-bar').textContent = 'HAUTEUR — Bougez la souris vers le haut/bas puis cliquez | Echap = annuler';
    ctxElement = null;
});

document.getElementById('ctx-agrandir-perp').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    toutDesactiver();

    redimPerp = true;
    redimPerpElement = el;

    // Creer un mur temporaire (sera repositionne par le pointermove)
    var angle = el.params.angle || 0;
    var rad = angle * Math.PI / 180;
    var dist = el.params.distance || 5;
    var endX = (el.params.x || 0) + Math.cos(rad) * dist;
    var endZ = (el.params.z || 0) + Math.sin(rad) * dist;

    var newParams = {
        x: endX,
        z: endZ,
        y: el.params.y || 0,
        distance: 1,
        hauteur: el.params.hauteur || 2.5,
        angle: angle + 90,
        couleur: el.params.couleur || '#8B4513',
        opacite: el.params.opacite || 99,
        jointCouleur: el.params.jointCouleur || '#aaa',
        jointOpacite: el.params.jointOpacite || 99,
        briqueType: el.params.briqueType || 'standard'
    };

    redimPerpNewEl = editeur.ajouterMur(newParams);
    var grpP = redimPerpNewEl.group || redimPerpNewEl.brique.group;
    grpP.visible = false;

    container.style.cursor = 'crosshair';
    document.getElementById('info-bar').textContent = 'PERP 90° — Bougez la souris pour choisir le cote et la longueur | Cliquez pour valider | Echap = annuler';
    ctxElement = null;
});

document.getElementById('ctx-agrandir-prop').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    toutDesactiver();
    redimProp = true;
    redimPropElement = el;
    redimPropOrigDist = el.params.distance || 5;
    // Collecter les exclusions avec leur position relative sur le segment
    redimPropExclusions = [];
    var origSegs = editeur._segments(el.params);
    var excls = trouverExclusionsMur(el);
    for (var i = 0; i < excls.length; i++) {
        // Trouver sur quel segment et a quel ratio
        var bestSeg = 0;
        var bestRatio = 0.5;
        var bestPerp = 999;
        for (var s = 0; s < origSegs.length; s++) {
            var seg = origSegs[s];
            var sdx = seg.x2 - seg.x1;
            var sdz = seg.z2 - seg.z1;
            var sLen = Math.sqrt(sdx * sdx + sdz * sdz);
            var snx = sdx / sLen;
            var snz = sdz / sLen;
            var edx = excls[i].x - seg.x1;
            var edz = excls[i].z - seg.z1;
            var proj = edx * snx + edz * snz;
            var perp = Math.abs(-edx * snz + edz * snx);
            if (perp < bestPerp) {
                bestPerp = perp;
                bestSeg = s;
                bestRatio = proj / sLen;
            }
        }
        redimPropExclusions.push({
            excl: excls[i],
            origX: excls[i].x,
            origZ: excls[i].z,
            segIndex: bestSeg,
            ratio: bestRatio
        });
    }
    surlignerGroupe(el.group || el.brique.group, '#43B047');
    container.style.cursor = 'nwse-resize';
    document.getElementById('info-bar').textContent = 'PROPORTIONNEL — Bougez la souris pour agrandir/reduire | Cliquez pour valider | Echap = annuler';
    ctxElement = null;
});



// Collecter les exclusions d'un mur pour le deplacement
function collecterExclusionsDeplacement(el) {
    deplacerExclusions = [];
    var excls = trouverExclusionsMur(el);
    for (var i = 0; i < excls.length; i++) {
        deplacerExclusions.push({
            excl: excls[i],
            origX: excls[i].x,
            origZ: excls[i].z,
            origY: excls[i].y
        });
    }
}

document.getElementById('ctx-deplacer-h').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    toutDesactiver();
    modeDeplacerHorizontal = true;
    deplacerHElement = el;
    deplacerHOrigX = el.params.x || 0;
    deplacerHOrigZ = el.params.z || 0;
    collecterExclusionsDeplacement(el);
    surlignerGroupe(el.group || el.brique.group, '#00ccff');
    container.style.cursor = 'ew-resize';
    document.getElementById('info-bar').textContent = 'DEPLACER HORIZONTAL — Bougez la souris le long du mur puis cliquez | Echap = annuler';
    ctxElement = null;
});

document.getElementById('ctx-deplacer-v').addEventListener('click', function() {
    if (!ctxElement) return;
    var el = ctxElement;
    document.getElementById('ctx-menu').style.display = 'none';
    toutDesactiver();
    modeDeplacerVertical = true;
    deplacerVElement = el;
    deplacerVOrigY = el.params.y || 0;
    collecterExclusionsDeplacement(el);
    surlignerGroupe(el.group || el.brique.group, '#ffcc00');
    container.style.cursor = 'ns-resize';
    document.getElementById('info-bar').textContent = 'DEPLACER VERTICAL — Bougez la souris haut/bas puis cliquez | Echap = annuler';
    ctxElement = null;
});

// Reboucher les trous vides (sans porte/fenetre associee)
document.getElementById('ctx-supprimer').addEventListener('click', function() {
    if (!ctxElement) return;
    document.getElementById('ctx-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    editeur.supprimer(ctxElement.id);
    ctxElement = null;
});

// Supprimer une fenetre
document.getElementById('ctx-fenetre-deplacer').addEventListener('click', function() {
    if (!window._clickedExclusionId) return;
    document.getElementById('ctx-fenetre-menu').style.display = 'none';
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === window._clickedExclusionId) {
            excl = editeur.exclusions[i];
            break;
        }
    }
    if (!excl || !excl.group3D) return;

    // Lire les couleurs actuelles de la fenetre
    var couleurs = Fenetre.lireCouleurs(excl.group3D);

    deplacerFenetreInfo = {
        largeur: excl.largeur,
        hauteur: excl.hauteur,
        y: excl.y,
        couleurCadre: couleurs.cadre,
        couleurVitre: couleurs.vitre,
        opaciteVitre: couleurs.opacite / 100
    };

    editeur.sauvegarderEtat();

    // Trouver le mur d'origine pour reboucher les placos/laines
    var murElFenLib = null;
    var trouMurFenLib = 0;
    for (var e = 0; e < editeur.elements.length; e++) {
        var exclsMurF = trouverExclusionsMur(editeur.elements[e]);
        for (var ei = 0; ei < exclsMurF.length; ei++) {
            if (exclsMurF[ei].id === excl.id) { murElFenLib = editeur.elements[e]; break; }
        }
        if (murElFenLib) break;
    }
    if (murElFenLib) {
        var posOrigF = editeur.trouverPositionSurMur(murElFenLib, excl.x, excl.z);
        trouMurFenLib = posOrigF.mur;
    }

    // Supprimer le trou correspondant dans le mur (reboucher)
    editeur.supprimerTrouParExclusion(excl);

    // Supprimer la fenetre 3D et l'exclusion
    sceneManager.scene.remove(excl.group3D);
    editeur.supprimerExclusion(excl.id);

    // Reboucher les placos/laines a l'ancienne position
    if (murElFenLib) {
        _reboucherPlacosLaines(murElFenLib, trouMurFenLib);
    }

    toutDesactiver();
    modeDeplacerFenetre = true;
    deplacerFenetreExcl = { group3D: null, y: deplacerFenetreInfo.y, largeur: deplacerFenetreInfo.largeur, hauteur: deplacerFenetreInfo.hauteur };

    // Creer un ghost pour visualiser
    supprimerGhostTrou();
    var geo = new THREE.BoxGeometry(deplacerFenetreInfo.largeur, deplacerFenetreInfo.hauteur, 0.15);
    var mat = new THREE.MeshBasicMaterial({ color: '#5bb8f0', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    ghostTrou = new THREE.Mesh(geo, mat);
    ghostTrou.visible = false;
    sceneManager.scene.add(ghostTrou);

    sceneManager.controls.enabled = true;
    container.style.cursor = 'grab';
    document.getElementById('info-bar').textContent = 'DEPLACER FENETRE — Cliquez sur un mur pour poser | Echap = annuler';
});

document.getElementById('ctx-fenetre-editer').addEventListener('click', function() {
    if (!window._clickedExclusionId) return;
    document.getElementById('ctx-fenetre-menu').style.display = 'none';
    // Trouver le groupe 3D de la fenetre
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === window._clickedExclusionId) {
            excl = editeur.exclusions[i];
            break;
        }
    }
    if (!excl || !excl.group3D) return;
    // Lire les couleurs actuelles
    var couleurs = Fenetre.lireCouleurs(excl.group3D);
    document.getElementById('ef-cadre').value = couleurs.cadre;
    document.getElementById('ef-vitre').value = couleurs.vitre;
    document.getElementById('ef-opacite').value = couleurs.opacite;
    document.getElementById('edit-fenetre-popup').style.display = 'block';
});

// Mise a jour en temps reel des couleurs fenetre
['ef-cadre', 'ef-vitre', 'ef-opacite'].forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
        if (!window._clickedExclusionId) return;
        var excl = null;
        for (var i = 0; i < editeur.exclusions.length; i++) {
            if (editeur.exclusions[i].id === window._clickedExclusionId) {
                excl = editeur.exclusions[i]; break;
            }
        }
        if (!excl || !excl.group3D) return;
        Fenetre.changerCouleur(excl.group3D,
            document.getElementById('ef-cadre').value,
            document.getElementById('ef-vitre').value,
            parseFloat(document.getElementById('ef-opacite').value) / 100
        );
    });
});

document.getElementById('btn-ef-appliquer').addEventListener('click', function() {
    document.getElementById('edit-fenetre-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Couleur de la fenetre modifiee !';
});

document.getElementById('ctx-fenetre-supprimer').addEventListener('click', function() {
    if (!window._clickedExclusionId) return;
    document.getElementById('ctx-fenetre-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    // Trouver l'exclusion pour supprimer le trou
    var excl = null;
    for (var i = 0; i < editeur.exclusions.length; i++) {
        if (editeur.exclusions[i].id === window._clickedExclusionId) {
            excl = editeur.exclusions[i]; break;
        }
    }
    if (excl) {
        editeur.supprimerTrouParExclusion(excl);
        if (excl.group3D) sceneManager.scene.remove(excl.group3D);
        editeur.supprimerExclusion(excl.id);
    }
    window._clickedExclusionId = null;
    document.getElementById('edit-fenetre-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Fenetre supprimee ! Trou rebouche.';
});

// Fermer le menu fenetre si on clique ailleurs
document.addEventListener('pointerdown', function(e) {
    var fmenu = document.getElementById('ctx-fenetre-menu');
    if (fmenu.style.display === 'block' && !fmenu.contains(e.target)) {
        fmenu.style.display = 'none';
        window._clickedExclusionId = null;
    }
});

// Boutons angle rapide dans le popup edition
document.getElementById('edit-popup').addEventListener('click', function(ev) {
    if (ev.target.classList.contains('e-angle-btn')) {
        var angle = parseInt(ev.target.getAttribute('data-angle'));
        document.getElementById('e-angle').value = angle;
        var btns = document.querySelectorAll('.e-angle-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].style.borderColor = (parseInt(btns[i].getAttribute('data-angle')) === angle) ? '#ffa500' : '#333';
        }
    }
});

document.getElementById('btn-edit-appliquer').addEventListener('click', function() {
    if (!editionElement) return;
    editeur.sauvegarderEtat();
    var el = editionElement;
    el.params.briqueType = document.getElementById('e-brique-type').value;
    el.params.distance = parseFloat(document.getElementById('e-distance').value) || el.params.distance;
    el.params.hauteur = parseFloat(document.getElementById('e-hauteur').value) || el.params.hauteur;
    el.params.angle = parseFloat(document.getElementById('e-angle').value) || 0;
    el.params.couleur = document.getElementById('e-couleur').value;
    el.params.opacite = parseFloat(document.getElementById('e-opacite').value);
    el.params.jointCouleur = document.getElementById('e-joint').value;
    el.params.jointOpacite = parseFloat(document.getElementById('e-opacite-joint').value);
    if (el.params.bicolore) {
        el.params.bicolore.couleur2 = el.params.couleur;
        el.params.bicolore.opacite2 = el.params.opacite;
    }
    restaurerSurlignage();
    editeur._reconstruire(el);
    editionElement = null;
    document.getElementById('edit-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'MODE EDITION — Cliquez sur un mur pour le modifier | Echap = annuler';
});

document.getElementById('btn-edit-degrouper').addEventListener('click', function() {
    if (!editionElement) return;
    editeur.sauvegarderEtat();
    if (editionElement.params.groupeId) {
        editeur.degrouperGroupe(editionElement.params.groupeId);
    }
    editionElement = null;
    document.getElementById('edit-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Mur degroupe ! | MODE EDITION — Cliquez sur un mur pour le modifier';
});

document.getElementById('btn-edit-supprimer').addEventListener('click', function() {
    if (!editionElement) return;
    editeur.sauvegarderEtat();
    restaurerSurlignage();
    editeur.supprimer(editionElement.id);
    editionElement = null;
    document.getElementById('edit-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'MODE EDITION — Cliquez sur un mur pour le modifier | Echap = annuler';
});

// ========================================
// EXPORT / IMPORT MULTI-FORMAT
// ========================================

function _ouvrirExportPanel() {
    var panel = document.getElementById('export-panel');
    var overlay = document.getElementById('export-overlay');
    panel.style.display = 'block';
    overlay.style.display = 'block';
    // Generer la preview
    sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    var srcCanvas = sceneManager.renderer.domElement;
    var preview = document.getElementById('export-preview');
    preview.width = srcCanvas.width;
    preview.height = srcCanvas.height;
    preview.style.width = '100%';
    preview.style.height = 'auto';
    var ctx = preview.getContext('2d');
    ctx.drawImage(srcCanvas, 0, 0);
}

function _fermerExportPanel() {
    document.getElementById('export-panel').style.display = 'none';
    document.getElementById('export-overlay').style.display = 'none';
}

document.getElementById('btn-export-menu').addEventListener('click', function() {
    _ouvrirExportPanel();
});
document.getElementById('export-panel-close').addEventListener('click', _fermerExportPanel);
document.getElementById('export-overlay').addEventListener('click', _fermerExportPanel);

function _exportGetJSON() {
    var json = editeur.exporterJSON('Construction');
    var data = JSON.parse(json);
    data.piecesZones = piecesZones;
    data.prix = { briques: PRIX_BRIQUES, placos: PRIX_PLACOS, laines: PRIX_LAINES, portes: PRIX_PORTES, fenetres: PRIX_FENETRES };
    return data;
}

// --- EXPORT JSON ---
document.getElementById('exp-json').addEventListener('click', function() {
    _fermerExportPanel();
    var data = _exportGetJSON();
    var json = JSON.stringify(data, null, 4);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'construction.json';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('info-bar').textContent = 'Projet exporte en JSON';
});

// --- EXPORT PNG (capture d'ecran) ---
document.getElementById('exp-photo').addEventListener('click', function() {
    _fermerExportPanel();
    sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    var dataUrl = sceneManager.renderer.domElement.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'construction-3d.png';
    a.click();
    document.getElementById('info-bar').textContent = 'Capture PNG exportee';
});

// --- EXPORT HTML (page autonome avec visionneuse) ---
document.getElementById('exp-html').addEventListener('click', function() {
    _fermerExportPanel();
    var data = _exportGetJSON();
    var devisTxt = _devisEnTexte();
    // Capture 3D en base64
    sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    var imgData = sceneManager.renderer.domElement.toDataURL('image/png');

    var html = '<!DOCTYPE html>\n<html lang="fr"><head><meta charset="UTF-8"><title>Construction — ELEEC APP</title>\n';
    html += '<style>body{margin:0;background:#1a1a2e;color:#fff;font-family:monospace;}\n';
    html += '.container{max-width:900px;margin:0 auto;padding:20px;}\n';
    html += 'h1{color:#4a9eff;text-align:center;} h2{color:#ffa500;margin-top:30px;border-bottom:1px solid #333;padding-bottom:8px;}\n';
    html += '.capture{text-align:center;margin:20px 0;} .capture img{max-width:100%;border:2px solid #333;border-radius:8px;}\n';
    html += '.devis{background:rgba(255,165,0,0.05);border:1px solid #333;border-radius:8px;padding:15px;white-space:pre-wrap;font-size:12px;color:#ccc;}\n';
    html += '.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0;}\n';
    html += '.stat{background:rgba(74,158,255,0.08);border:1px solid #333;border-radius:6px;padding:12px;text-align:center;}\n';
    html += '.stat .val{font-size:24px;font-weight:bold;color:#43B047;} .stat .lbl{font-size:10px;color:#888;margin-top:4px;}\n';
    html += '.json-data{background:#16213e;border:1px solid #333;border-radius:8px;padding:10px;font-size:10px;max-height:300px;overflow:auto;color:#888;}\n';
    html += '</style></head><body><div class="container">\n';
    html += '<h1>Construction — ELEEC APP V2</h1>\n';
    html += '<p style="text-align:center;color:#888;">Genere le ' + new Date().toLocaleDateString('fr-FR') + ' a ' + new Date().toLocaleTimeString('fr-FR') + '</p>\n';

    // Stats
    html += '<div class="stats">\n';
    html += '<div class="stat"><div class="val">' + editeur.elements.length + '</div><div class="lbl">Murs</div></div>\n';
    html += '<div class="stat"><div class="val">' + editeur.exclusions.length + '</div><div class="lbl">Ouvertures</div></div>\n';
    html += '<div class="stat"><div class="val">' + editeur.compterBriques() + '</div><div class="lbl">Briques</div></div>\n';
    html += '</div>\n';

    var pieces = editeur.detecterPiecesFermees();
    var surfaceSol = 0;
    for (var i = 0; i < pieces.length; i++) surfaceSol += pieces[i].aire;
    if (pieces.length > 0) {
        html += '<div class="stats">\n';
        html += '<div class="stat"><div class="val">' + pieces.length + '</div><div class="lbl">Pieces</div></div>\n';
        html += '<div class="stat"><div class="val">' + surfaceSol.toFixed(1) + '</div><div class="lbl">Surface sol (m²)</div></div>\n';
        html += '<div class="stat"><div class="val">' + placoElements.length + '</div><div class="lbl">Placos</div></div>\n';
        html += '</div>\n';
    }

    // Capture 3D
    html += '<h2>Vue 3D</h2>\n';
    html += '<div class="capture"><img src="' + imgData + '" alt="Vue 3D"></div>\n';

    // Devis
    html += '<h2>Estimation des couts</h2>\n';
    html += '<div class="devis">' + devisTxt.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>\n';

    // Zones
    if (piecesZones.length > 0) {
        html += '<h2>Zones definies</h2>\n';
        html += '<div class="stats">\n';
        for (var i = 0; i < piecesZones.length; i++) {
            var z = piecesZones[i];
            html += '<div class="stat" style="border-color:' + z.couleur + '"><div class="val" style="color:' + z.couleur + '">' + z.nom + '</div><div class="lbl">' + (z.aire ? z.aire.toFixed(1) + ' m²' : '') + '</div></div>\n';
        }
        html += '</div>\n';
    }

    // JSON brut
    html += '<h2>Donnees du projet (JSON)</h2>\n';
    html += '<div class="json-data"><pre>' + JSON.stringify(data, null, 2).replace(/</g, '&lt;') + '</pre></div>\n';

    html += '</div></body></html>';

    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'construction.html';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('info-bar').textContent = 'Page HTML exportee avec vue 3D + devis';
});

// --- EXPORT PDF (via impression navigateur) ---
document.getElementById('exp-pdf').addEventListener('click', function() {
    _fermerExportPanel();
    var data = _exportGetJSON();
    var devisTxt = _devisEnTexte();
    sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
    var imgData = sceneManager.renderer.domElement.toDataURL('image/png');

    var pieces = editeur.detecterPiecesFermees();
    var surfaceSol = 0;
    for (var i = 0; i < pieces.length; i++) surfaceSol += pieces[i].aire;

    // Ouvrir une nouvelle fenetre pour impression PDF
    var win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Devis Construction</title>');
    win.document.write('<style>');
    win.document.write('body{margin:20px;font-family:monospace;font-size:12px;color:#222;}');
    win.document.write('h1{font-size:18px;color:#333;border-bottom:2px solid #333;padding-bottom:8px;}');
    win.document.write('h2{font-size:14px;color:#555;margin-top:20px;border-bottom:1px solid #ccc;padding-bottom:4px;}');
    win.document.write('.stats{display:flex;gap:15px;margin:10px 0;} .stat{border:1px solid #ccc;border-radius:4px;padding:8px 15px;text-align:center;} .stat .val{font-size:20px;font-weight:bold;} .stat .lbl{font-size:9px;color:#888;}');
    win.document.write('.capture img{max-width:100%;max-height:400px;border:1px solid #ccc;}');
    win.document.write('.devis{white-space:pre-wrap;background:#f8f8f8;border:1px solid #ddd;padding:10px;border-radius:4px;}');
    win.document.write('.zones{display:flex;gap:10px;flex-wrap:wrap;} .zone{border:2px solid;border-radius:4px;padding:6px 12px;text-align:center;font-weight:bold;}');
    win.document.write('@media print{body{margin:10px;} .no-print{display:none;}}');
    win.document.write('</style></head><body>');

    win.document.write('<h1>DEVIS — Construction ELEEC APP</h1>');
    win.document.write('<p style="color:#888;">Date : ' + new Date().toLocaleDateString('fr-FR') + '</p>');

    win.document.write('<div class="stats">');
    win.document.write('<div class="stat"><div class="val">' + editeur.elements.length + '</div><div class="lbl">Murs</div></div>');
    win.document.write('<div class="stat"><div class="val">' + editeur.exclusions.length + '</div><div class="lbl">Ouvertures</div></div>');
    win.document.write('<div class="stat"><div class="val">' + editeur.compterBriques() + '</div><div class="lbl">Briques</div></div>');
    if (pieces.length > 0) {
        win.document.write('<div class="stat"><div class="val">' + pieces.length + '</div><div class="lbl">Pieces</div></div>');
        win.document.write('<div class="stat"><div class="val">' + surfaceSol.toFixed(1) + ' m²</div><div class="lbl">Surface sol</div></div>');
    }
    win.document.write('</div>');

    win.document.write('<h2>Vue 3D</h2>');
    win.document.write('<div class="capture"><img src="' + imgData + '"></div>');

    if (piecesZones.length > 0) {
        win.document.write('<h2>Zones</h2><div class="zones">');
        for (var i = 0; i < piecesZones.length; i++) {
            var z = piecesZones[i];
            win.document.write('<div class="zone" style="border-color:' + z.couleur + ';color:' + z.couleur + '">' + z.nom + (z.aire ? '<br><span style="font-size:10px;color:#888;">' + z.aire.toFixed(1) + ' m²</span>' : '') + '</div>');
        }
        win.document.write('</div>');
    }

    win.document.write('<h2>Estimation des couts</h2>');
    win.document.write('<div class="devis">' + devisTxt.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>');

    win.document.write('<br><button class="no-print" onclick="window.print()" style="padding:10px 30px;font-size:14px;cursor:pointer;">Imprimer / Enregistrer en PDF</button>');
    win.document.write('</body></html>');
    win.document.close();
    document.getElementById('info-bar').textContent = 'Fenetre PDF ouverte — cliquez Imprimer pour sauvegarder en PDF';
});

// --- IMPORT JSON ---
document.getElementById('imp-json').addEventListener('click', function() {
    _fermerExportPanel();
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
        try {
            var data = JSON.parse(ev.target.result);
            editeur.importerJSON(ev.target.result);
            if (data.piecesZones) {
                piecesZones = data.piecesZones;
            }
            // Restaurer les prix personnalises si presents
            if (data.prix) {
                if (data.prix.briques) { for (var k in data.prix.briques) { if (PRIX_BRIQUES[k]) PRIX_BRIQUES[k].unite = data.prix.briques[k].unite; } }
                if (data.prix.placos) { for (var k in data.prix.placos) { if (PRIX_PLACOS[k]) PRIX_PLACOS[k].m2 = data.prix.placos[k].m2; } }
                if (data.prix.laines) { for (var k in data.prix.laines) { if (PRIX_LAINES[k]) PRIX_LAINES[k].m2 = data.prix.laines[k].m2; } }
                if (data.prix.portes) PRIX_PORTES = data.prix.portes;
                if (data.prix.fenetres) PRIX_FENETRES = data.prix.fenetres;
            }
            if (modeZones) {
                _afficherPiecesFermees();
                _mettreAJourPanelZones();
            }
            document.getElementById('info-bar').textContent = 'Projet importe !';
        } catch (err) {
            console.error('Erreur import JSON :', err);
            alert('Erreur import JSON.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// ========================================
// Double-clic = poser laine/placo a la position du ghost (pour les petites zones)
sceneManager.renderer.domElement.addEventListener('dblclick', function(ev) {
    // Laine : double-clic pose la laine sur toute la zone visible du ghost
    if (modeLaine && laineModele && ghostLaine && ghostLaine.visible && ghostLaine.userData._lainePos) {
        var lp = ghostLaine.userData._lainePos;
        if (lp.largeur >= 0.02) {
            _supprimerLainesChevauche(lp);
            var mod = laineModele;
            laineDeVerre.setCouleurs(
                document.getElementById('nlv-couleur').value,
                parseFloat(document.getElementById('nlv-opacite').value) / 100
            );
            editeur.sauvegarderEtat();
            var group = laineDeVerre.creer(mod.id, lp.worldX, lp.worldZ, lp.y, lp.largeur, lp.hauteur, lp.angle, mod.ep, lp.side, lp.murEpFull);
            laineElements.push(group);
            _decouperPlacoLainePourToutesExclusions(lp.element);
            document.getElementById('info-bar').textContent = 'Laine posee (' + lp.largeur.toFixed(2) + 'm) !';
        }
        return;
    }

    // Placo : double-clic pose le placo sur toute la zone visible du ghost
    if (modePlaco && placoModele && ghostPlaco && ghostPlaco.visible && ghostPlaco.userData._placoPos) {
        var pp = ghostPlaco.userData._placoPos;
        if (pp.largeur >= 0.02) {
            _supprimerPlacosChevauche(pp);
            var mod = placoModele;
            placo.setCouleurs(
                document.getElementById('npl-couleur').value,
                parseFloat(document.getElementById('npl-opacite').value) / 100
            );
            editeur.sauvegarderEtat();
            var group = placo.creer(mod.id, pp.worldX, pp.worldZ, pp.y, pp.largeur, pp.hauteur, pp.angle, mod.ep, pp.side, pp.murEpFull, pp.extraBack || 0);
            placoElements.push(group);
            _decouperPlacoLainePourToutesExclusions(pp.element);
            document.getElementById('info-bar').textContent = 'Placo pose (' + pp.largeur.toFixed(2) + 'm) !';
        }
        return;
    }
});

// PLINTHES — se posent uniquement sur le placo
// ========================================
var plintheObj = new Plinthe(sceneManager.scene);
var modePlinthe = false;
var plinthModeleId = null;
var ghostPlinthe = null;
var ghostPlintheTout = []; // ghosts supplementaires pour mode "tout le mur"
var plinthElements = [];
var ctxPlintheGroup = null;

(function() {
    var modeles = Plinthe.modeles();
    var cats = { 'platre': 'Platre', 'pvc': 'PVC', 'bois': 'Bois', 'metal': 'Metal' };
    var html = '';
    var done = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat;
        if (!done[cat]) {
            done[cat] = true;
            if (html) html += '</div>';
            html += '<div style="color:#A0764E; font-size:10px; font-weight:bold; margin-top:6px; margin-bottom:3px;">' + (cats[cat] || cat) + '</div><div style="display:flex; flex-wrap:wrap; gap:4px;">';
        }
        html += '<div class="plinthe-mod-btn" data-id="' + modeles[i].id + '" style="cursor:pointer; padding:4px 6px; border:1px solid #333; border-radius:4px; background:#16213e; display:flex; align-items:center; gap:6px; transition:border-color 0.15s;">';
        html += modeles[i].ico + '<span style="font-size:10px; color:#ccc;">' + modeles[i].nom + '</span></div>';
    }
    html += '</div>';
    document.getElementById('plinthe-modeles').innerHTML = html;
})();

document.getElementById('btn-plinthe').addEventListener('click', function() {
    if (modePlinthe) { toutDesactiver(); return; }
    toutDesactiver();
    modePlinthe = true;
    this.classList.add('actif');
    this.style.borderColor = '#A0764E';
    document.getElementById('plinthe-popup').style.display = 'block';
    if (!plinthModeleId) {
        plinthModeleId = Plinthe.modeles()[0].id;
        plintheObj.setCouleur(Plinthe.couleursParModele(plinthModeleId));
        document.getElementById('plinthe-couleur').value = Plinthe.couleursParModele(plinthModeleId);
    }
    if (ghostPlinthe) sceneManager.scene.remove(ghostPlinthe);
    ghostPlinthe = plintheObj.creerGhost(plinthModeleId, 1, null);
    sceneManager.scene.add(ghostPlinthe);
    document.getElementById('info-bar').textContent = 'Cliquez sur un PLACO pour poser la plinthe au pied';
    container.style.cursor = 'crosshair';
});

document.getElementById('plinthe-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.plinthe-mod-btn');
    if (!btn) return;
    plinthModeleId = btn.getAttribute('data-id');
    var col = Plinthe.couleursParModele(plinthModeleId);
    document.getElementById('plinthe-couleur').value = col;
    plintheObj.setCouleur(col);
    // Surbrillance
    var all = document.querySelectorAll('.plinthe-mod-btn');
    for (var i = 0; i < all.length; i++) { all[i].style.borderColor = '#333'; all[i].style.background = '#16213e'; }
    btn.style.borderColor = '#A0764E'; btn.style.background = 'rgba(160,118,78,0.2)';
    // Recréer ghost
    if (ghostPlinthe) sceneManager.scene.remove(ghostPlinthe);
    ghostPlinthe = plintheObj.creerGhost(plinthModeleId, 1, null);
    sceneManager.scene.add(ghostPlinthe);
    document.getElementById('info-bar').textContent = 'Modele ' + plinthModeleId + ' — Cliquez sur un PLACO pour poser';
});

document.getElementById('plinthe-couleur').addEventListener('input', function() {
    plintheObj.setCouleur(this.value);
    if (ghostPlinthe) sceneManager.scene.remove(ghostPlinthe);
    ghostPlinthe = plintheObj.creerGhost(plinthModeleId, 1, null);
    sceneManager.scene.add(ghostPlinthe);
});

// Nettoyer les ghosts "tout le mur"
function _nettoyerGhostPlintheTout() {
    for (var i = 0; i < ghostPlintheTout.length; i++) {
        sceneManager.scene.remove(ghostPlintheTout[i]);
    }
    ghostPlintheTout = [];
}

function _positionnerGhostPlinthe(ghost, pi) {
    var rad = pi.angle * Math.PI / 180;
    var side = pi.side || 1;
    // Trouver la position reelle du placoGroup pour coller le ghost
    var placoGroup = null;
    for (var pg = 0; pg < placoElements.length; pg++) {
        var pgi = placoElements[pg].userData.placoInfo;
        if (pgi && Math.abs(pgi.worldX - pi.worldX) < 0.01 && Math.abs(pgi.worldZ - pi.worldZ) < 0.01 && pgi.side === pi.side) {
            placoGroup = placoElements[pg]; break;
        }
    }
    if (placoGroup) {
        // Coller sur la face exterieure du placo
        var decalage = (pi.ep / 2 + 0.005) * side;
        var perpX = -Math.sin(rad) * decalage;
        var perpZ = Math.cos(rad) * decalage;
        ghost.position.set(placoGroup.position.x + perpX, 0, placoGroup.position.z + perpZ);
    } else {
        // Fallback : recalcul depuis le centre du mur
        var offset = pi.murEpFull + pi.ep + 0.005;
        var perpX = -Math.sin(rad) * side * offset;
        var perpZ = Math.cos(rad) * side * offset;
        ghost.position.set(pi.worldX + perpX, 0, pi.worldZ + perpZ);
    }
    ghost.rotation.y = -rad;
    ghost.scale.x = pi.largeur;
    ghost.visible = true;
}

// Survol : ghost sur le placo
sceneManager.renderer.domElement.addEventListener('pointermove', function(ev) {
    if (!modePlinthe || !ghostPlinthe) return;
    ghostPlinthe.visible = false;
    _nettoyerGhostPlintheTout();

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    // Ignorer les portes au survol
    for (var i = 0; i < hits.length; i++) {
        if (hits[i].object.userData && hits[i].object.userData.isPorte) return;
    }

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.placoInfo) obj = obj.parent;
        if (obj.userData && obj.userData.placoInfo) {
            var pi = obj.userData.placoInfo;

            // Pas de ghost devant une porte
            if (_placoDevantPorte(pi)) return;

            // Ghost principal sur le placo survole
            _positionnerGhostPlinthe(ghostPlinthe, pi);

            // Si "tout le mur" coche, afficher des ghosts sur tous les placos du meme mur
            if (document.getElementById('plinthe-tout-mur').checked) {
                var refAngle = pi.angle;
                var refMurEp = pi.murEpFull;
                for (var p = 0; p < placoElements.length; p++) {
                    var pj = placoElements[p].userData.placoInfo;
                    if (!pj) continue;
                    // Meme mur (meme angle, meme epaisseur) mais pas le meme placo
                    if (Math.abs(pj.angle - refAngle) < 1 && Math.abs(pj.murEpFull - refMurEp) < 0.05) {
                        if (Math.abs(pj.worldX - pi.worldX) < 0.01 && Math.abs(pj.worldZ - pi.worldZ) < 0.01 && pj.side === pi.side) continue;
                        // Pas devant une porte
                        if (_placoDevantPorte(pj)) continue;
                        // Verifier pas deja une plinthe
                        var dejaLa = false;
                        for (var k = 0; k < plinthElements.length; k++) {
                            var pk = plinthElements[k].userData.plinthInfo;
                            if (pk && Math.abs(pk.placoWorldX - pj.worldX) < 0.1 && Math.abs(pk.placoWorldZ - pj.worldZ) < 0.1 && pk.side === pj.side) {
                                dejaLa = true; break;
                            }
                        }
                        if (!dejaLa) {
                            var g2 = plintheObj.creerGhost(plinthModeleId, 1, null);
                            _positionnerGhostPlinthe(g2, pj);
                            sceneManager.scene.add(g2);
                            ghostPlintheTout.push(g2);
                        }
                    }
                }
            }
            return;
        }
    }
});

// Verifier si un placo est devant une porte (zone d'exclusion porte au sol)
function _placoDevantPorte(placoInfo) {
    var rad = placoInfo.angle * Math.PI / 180;
    var cosA = Math.cos(rad), sinA = Math.sin(rad);
    // Centre du placo en world
    var pcx = placoInfo.worldX;
    var pcz = placoInfo.worldZ;

    for (var i = 0; i < editeur.exclusions.length; i++) {
        var ex = editeur.exclusions[i];
        // Seulement les portes (y === 0, partent du sol)
        if (ex.y > 0.01) continue;
        // Meme angle ?
        var angleDiff = Math.abs(ex.angle - placoInfo.angle);
        if (angleDiff > 5 && Math.abs(angleDiff - 360) > 5) continue;
        // Distance entre le centre du placo et la porte
        var dx = pcx - ex.x;
        var dz = pcz - ex.z;
        // Projeter sur l'axe du mur
        var proj = dx * cosA + dz * sinA;
        var perp = Math.abs(-dx * sinA + dz * cosA);
        // Le placo est devant la porte si perp < 0.15 et le centre du placo est dans la largeur de la porte
        if (perp < 0.15 && Math.abs(proj) < ex.largeur / 2) {
            return true;
        }
    }
    return false;
}

// Clic : poser sur le placo
sceneManager.renderer.domElement.addEventListener('pointerup', function(ev) {
    if (!modePlinthe || !plinthModeleId || ev.button !== 0) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    // Ignorer si on clique sur une porte
    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        if (obj.userData && obj.userData.isPorte) {
            document.getElementById('info-bar').textContent = 'Pas de plinthe devant une porte';
            return;
        }
    }

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.placoInfo) obj = obj.parent;
        if (obj.userData && obj.userData.placoInfo) {
            // Verifier que ce placo n'est pas devant une porte
            var pi = obj.userData.placoInfo;
            if (_placoDevantPorte(pi)) {
                document.getElementById('info-bar').textContent = 'Pas de plinthe devant une porte';
                return;
            }

            plintheObj.setCouleur(document.getElementById('plinthe-couleur').value);
            editeur.sauvegarderEtat();

            var toutLeMur = document.getElementById('plinthe-tout-mur').checked;
            if (toutLeMur) {
                var refAngle = pi.angle;
                var refMurEp = pi.murEpFull;
                var nb = 0;
                for (var p = 0; p < placoElements.length; p++) {
                    var pj = placoElements[p].userData.placoInfo;
                    if (!pj) continue;
                    if (Math.abs(pj.angle - refAngle) < 1 && Math.abs(pj.murEpFull - refMurEp) < 0.05) {
                        // Pas devant une porte
                        if (_placoDevantPorte(pj)) continue;
                        // Pas de doublon
                        var dejaLa = false;
                        for (var k = 0; k < plinthElements.length; k++) {
                            var pk = plinthElements[k].userData.plinthInfo;
                            if (pk && Math.abs(pk.placoWorldX - pj.worldX) < 0.1 && Math.abs(pk.placoWorldZ - pj.worldZ) < 0.1 && pk.side === pj.side) {
                                dejaLa = true; break;
                            }
                        }
                        if (!dejaLa) {
                            var g = plintheObj.creer(plinthModeleId, pj, placoElements[p]);
                            plinthElements.push(g);
                            nb++;
                        }
                    }
                }
                document.getElementById('info-bar').textContent = nb + ' plinthe(s) posee(s) sur tout le mur !';
            } else {
                var g = plintheObj.creer(plinthModeleId, pi, obj);
                plinthElements.push(g);
                document.getElementById('info-bar').textContent = 'Plinthe posee sur le placo !';
            }
            return;
        }
    }
    document.getElementById('info-bar').textContent = 'Cliquez sur un PLACO (pas le mur directement)';
});

// Menu contextuel plinthe (porte prioritaire)
sceneManager.renderer.domElement.addEventListener('contextmenu', function(ev) {
    if (plinthElements.length === 0) return;
    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    // Si on touche une porte ou fenetre en premier, ne pas intercepter
    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        if (obj.userData && (obj.userData.isPorte || obj.userData.isFenetre)) return;
        var p = obj.parent;
        while (p) {
            if (p.userData && (p.userData.isPorte || p.userData.isFenetre || p.userData.porteCreation || p.userData.fenetreCreation)) return;
            p = p.parent;
        }
    }

    // Sinon chercher une plinthe
    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.plinthInfo) obj = obj.parent;
        if (obj.userData && obj.userData.plinthInfo) {
            ev.preventDefault(); ev.stopPropagation();
            ctxPlintheGroup = obj;
            var menu = document.getElementById('ctx-plinthe-menu');
            menu.style.display = 'block';
            menu.style.left = ev.clientX + 'px';
            menu.style.top = ev.clientY + 'px';
            return;
        }
    }
});

document.getElementById('ctx-plinthe-editer').addEventListener('click', function() {
    if (!ctxPlintheGroup) return;
    document.getElementById('ctx-plinthe-menu').style.display = 'none';
    var col = Plinthe.lireCouleur(ctxPlintheGroup);
    var newCol = prompt('Couleur (hex) :', col);
    if (newCol) {
        Plinthe.changerCouleur(ctxPlintheGroup, newCol);
        if (ctxPlintheGroup.userData.plinthInfo) ctxPlintheGroup.userData.plinthInfo.couleur = newCol;
    }
});

document.getElementById('ctx-plinthe-supprimer').addEventListener('click', function() {
    if (!ctxPlintheGroup) return;
    document.getElementById('ctx-plinthe-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    sceneManager.scene.remove(ctxPlintheGroup);
    for (var i = 0; i < plinthElements.length; i++) {
        if (plinthElements[i] === ctxPlintheGroup) { plinthElements.splice(i, 1); break; }
    }
    ctxPlintheGroup = null;
});

// CARRELAGE — revetement sur placo
// ========================================

var carrelageObj = new Carrelage(sceneManager.scene);
var modeCarrelage = false;
var carrelageModeleId = null;
var ghostCarrelage = null;
var ghostCarrelageTout = [];
var carrelageElements = [];
var ctxCarrelageGroup = null;

(function() {
    var modeles = Carrelage.modeles();
    var cats = { 'classique': 'Classique', 'metro': 'Metro / Faience', 'mosaique': 'Mosaique' };
    var html = '';
    var done = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat;
        if (!done[cat]) {
            done[cat] = true;
            if (html) html += '</div>';
            html += '<div style="color:#C8C0B0; font-size:10px; font-weight:bold; margin-top:6px; margin-bottom:3px;">' + (cats[cat] || cat) + '</div><div style="display:flex; flex-wrap:wrap; gap:4px;">';
        }
        html += '<div class="carrelage-mod-btn" data-id="' + modeles[i].id + '" style="cursor:pointer; padding:4px 6px; border:1px solid #333; border-radius:4px; background:#16213e; display:flex; align-items:center; gap:6px; transition:border-color 0.15s;">';
        html += modeles[i].ico + '<span style="font-size:10px; color:#ccc;">' + modeles[i].nom + '</span></div>';
    }
    html += '</div>';
    document.getElementById('carrelage-modeles').innerHTML = html;
})();

document.getElementById('btn-carrelage').addEventListener('click', function() {
    if (modeCarrelage) { toutDesactiver(); return; }
    toutDesactiver();
    modeCarrelage = true;
    this.classList.add('actif');
    this.style.borderColor = '#C8C0B0';
    document.getElementById('carrelage-popup').style.display = 'block';
    if (!carrelageModeleId) {
        carrelageModeleId = Carrelage.modeles()[0].id;
        var col = Carrelage.couleursParModele(carrelageModeleId);
        carrelageObj.setCouleurs(col, '#C8C0B0');
        document.getElementById('carrelage-couleur').value = col;
    }
    if (ghostCarrelage) sceneManager.scene.remove(ghostCarrelage);
    ghostCarrelage = carrelageObj.creerGhost(carrelageModeleId, 1, 2.50);
    sceneManager.scene.add(ghostCarrelage);
    document.getElementById('info-bar').textContent = 'Cliquez sur un PLACO pour poser le carrelage';
    container.style.cursor = 'crosshair';
});

document.getElementById('carrelage-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.carrelage-mod-btn');
    if (!btn) return;
    carrelageModeleId = btn.getAttribute('data-id');
    var col = Carrelage.couleursParModele(carrelageModeleId);
    document.getElementById('carrelage-couleur').value = col;
    // Mettre a jour les champs dimensions
    var mods = Carrelage.modeles();
    for (var m = 0; m < mods.length; m++) {
        if (mods[m].id === carrelageModeleId) {
            document.getElementById('carrelage-larg').value = Math.round(mods[m].tW * 100);
            document.getElementById('carrelage-haut').value = Math.round(mods[m].tH * 100);
            break;
        }
    }
    carrelageObj.setCouleurs(col, document.getElementById('carrelage-joint').value);
    var all = document.querySelectorAll('.carrelage-mod-btn');
    for (var i = 0; i < all.length; i++) { all[i].style.borderColor = '#333'; all[i].style.background = '#16213e'; }
    btn.style.borderColor = '#C8C0B0'; btn.style.background = 'rgba(200,192,176,0.2)';
    if (ghostCarrelage) sceneManager.scene.remove(ghostCarrelage);
    ghostCarrelage = carrelageObj.creerGhost(carrelageModeleId, 1, 2.50);
    sceneManager.scene.add(ghostCarrelage);
    document.getElementById('info-bar').textContent = 'Modele ' + carrelageModeleId + ' — Cliquez sur un PLACO pour poser';
});

document.getElementById('carrelage-couleur').addEventListener('input', function() {
    carrelageObj.setCouleurs(this.value, document.getElementById('carrelage-joint').value);
    if (ghostCarrelage) sceneManager.scene.remove(ghostCarrelage);
    ghostCarrelage = carrelageObj.creerGhost(carrelageModeleId, 1, 2.50);
    sceneManager.scene.add(ghostCarrelage);
});

document.getElementById('carrelage-joint').addEventListener('input', function() {
    carrelageObj.setCouleurs(document.getElementById('carrelage-couleur').value, this.value);
    if (ghostCarrelage) sceneManager.scene.remove(ghostCarrelage);
    ghostCarrelage = carrelageObj.creerGhost(carrelageModeleId, 1, 2.50);
    sceneManager.scene.add(ghostCarrelage);
});

function _nettoyerGhostCarrelageTout() {
    for (var i = 0; i < ghostCarrelageTout.length; i++) {
        sceneManager.scene.remove(ghostCarrelageTout[i]);
    }
    ghostCarrelageTout = [];
}

function _positionnerGhostCarrelage(ghost, pi) {
    var rad = pi.angle * Math.PI / 180;
    var side = pi.side || 1;
    var placoGroup = null;
    for (var pg = 0; pg < placoElements.length; pg++) {
        var pgi = placoElements[pg].userData.placoInfo;
        if (pgi && Math.abs(pgi.worldX - pi.worldX) < 0.01 && Math.abs(pgi.worldZ - pi.worldZ) < 0.01 && pgi.side === pi.side) {
            placoGroup = placoElements[pg]; break;
        }
    }
    if (placoGroup) {
        var decalage = (pi.ep / 2 + 0.005) * side;
        var perpX = -Math.sin(rad) * decalage;
        var perpZ = Math.cos(rad) * decalage;
        ghost.position.set(placoGroup.position.x + perpX, pi.y || 0, placoGroup.position.z + perpZ);
    } else {
        var offset = pi.murEpFull + pi.ep + 0.005;
        var perpX = -Math.sin(rad) * side * offset;
        var perpZ = Math.cos(rad) * side * offset;
        ghost.position.set(pi.worldX + perpX, pi.y || 0, pi.worldZ + perpZ);
    }
    ghost.rotation.y = -rad;
    ghost.scale.x = pi.largeur;
    ghost.scale.y = pi.hauteur / 2.50;
    ghost.visible = true;
}

// Survol : ghost carrelage sur le placo
sceneManager.renderer.domElement.addEventListener('pointermove', function(ev) {
    if (!modeCarrelage || !ghostCarrelage) return;
    ghostCarrelage.visible = false;
    _nettoyerGhostCarrelageTout();

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    for (var i = 0; i < hits.length; i++) {
        if (hits[i].object.userData && hits[i].object.userData.isPorte) return;
    }

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.placoInfo) obj = obj.parent;
        if (obj.userData && obj.userData.placoInfo) {
            var pi = obj.userData.placoInfo;
            _positionnerGhostCarrelage(ghostCarrelage, pi);

            if (document.getElementById('carrelage-tout-mur').checked) {
                var refAngle = pi.angle;
                var refMurEp = pi.murEpFull;
                for (var p = 0; p < placoElements.length; p++) {
                    var pj = placoElements[p].userData.placoInfo;
                    if (!pj) continue;
                    if (Math.abs(pj.angle - refAngle) < 1 && Math.abs(pj.murEpFull - refMurEp) < 0.05) {
                        if (Math.abs(pj.worldX - pi.worldX) < 0.01 && Math.abs(pj.worldZ - pi.worldZ) < 0.01 && pj.side === pi.side) continue;
                        var dejaLa = false;
                        for (var k = 0; k < carrelageElements.length; k++) {
                            var ck = carrelageElements[k].userData.carrelageInfo;
                            if (ck && Math.abs(ck.placoWorldX - pj.worldX) < 0.1 && Math.abs(ck.placoWorldZ - pj.worldZ) < 0.1 && ck.side === pj.side) {
                                dejaLa = true; break;
                            }
                        }
                        if (!dejaLa) {
                            var g2 = carrelageObj.creerGhost(carrelageModeleId, 1, 2.50);
                            _positionnerGhostCarrelage(g2, pj);
                            sceneManager.scene.add(g2);
                            ghostCarrelageTout.push(g2);
                        }
                    }
                }
            }
            return;
        }
    }
});

// Clic : poser le carrelage
sceneManager.renderer.domElement.addEventListener('click', function(ev) {
    if (!modeCarrelage) return;
    if (ev.button !== 0) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.placoInfo) obj = obj.parent;
        if (obj.userData && obj.userData.placoInfo) {
            var pi = obj.userData.placoInfo;
            editeur.sauvegarderEtat();

            if (document.getElementById('carrelage-tout-mur').checked) {
                var refAngle = pi.angle;
                var refMurEp = pi.murEpFull;
                var nb = 0;
                for (var p = 0; p < placoElements.length; p++) {
                    var pj = placoElements[p].userData.placoInfo;
                    if (!pj) continue;
                    if (Math.abs(pj.angle - refAngle) < 1 && Math.abs(pj.murEpFull - refMurEp) < 0.05) {
                        var dejaLa = false;
                        for (var k = 0; k < carrelageElements.length; k++) {
                            var ck = carrelageElements[k].userData.carrelageInfo;
                            if (ck && Math.abs(ck.placoWorldX - pj.worldX) < 0.1 && Math.abs(ck.placoWorldZ - pj.worldZ) < 0.1 && ck.side === pj.side) {
                                dejaLa = true; break;
                            }
                        }
                        if (!dejaLa) {
                            var g = carrelageObj.creer(carrelageModeleId, pj, placoElements[p]);
                            carrelageElements.push(g);
                            nb++;
                        }
                    }
                }
                document.getElementById('info-bar').textContent = nb + ' carrelage(s) pose(s) sur tout le mur !';
            } else {
                var g = carrelageObj.creer(carrelageModeleId, pi, obj);
                carrelageElements.push(g);
                document.getElementById('info-bar').textContent = 'Carrelage pose sur le placo !';
            }
            return;
        }
    }
    document.getElementById('info-bar').textContent = 'Cliquez sur un PLACO (pas le mur directement)';
});

// Clic droit : menu contextuel carrelage
sceneManager.renderer.domElement.addEventListener('contextmenu', function(ev) {
    if (modeCarrelage) return;
    document.getElementById('ctx-carrelage-menu').style.display = 'none';

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.carrelageInfo) obj = obj.parent;
        if (obj.userData && obj.userData.carrelageInfo) {
            ev.preventDefault();
            ctxCarrelageGroup = obj;
            var menu = document.getElementById('ctx-carrelage-menu');
            menu.style.left = ev.clientX + 'px';
            menu.style.top = ev.clientY + 'px';
            menu.style.display = 'block';
            return;
        }
    }
});

document.getElementById('ctx-carrelage-editer').addEventListener('click', function() {
    if (!ctxCarrelageGroup) return;
    document.getElementById('ctx-carrelage-menu').style.display = 'none';
    var cols = Carrelage.lireCouleurs(ctxCarrelageGroup);
    var newCarreau = prompt('Couleur carreau (hex)', cols.carreau);
    if (!newCarreau) return;
    var newJoint = prompt('Couleur joint (hex)', cols.joint);
    if (!newJoint) return;
    Carrelage.changerCouleurs(ctxCarrelageGroup, newCarreau, newJoint);
    if (ctxCarrelageGroup.userData.carrelageInfo) {
        ctxCarrelageGroup.userData.carrelageInfo.couleurCarreau = newCarreau;
        ctxCarrelageGroup.userData.carrelageInfo.couleurJoint = newJoint;
    }
});

document.getElementById('ctx-carrelage-supprimer').addEventListener('click', function() {
    if (!ctxCarrelageGroup) return;
    document.getElementById('ctx-carrelage-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    sceneManager.scene.remove(ctxCarrelageGroup);
    for (var i = 0; i < carrelageElements.length; i++) {
        if (carrelageElements[i] === ctxCarrelageGroup) { carrelageElements.splice(i, 1); break; }
    }
    ctxCarrelageGroup = null;
});

// CARRELAGE SOL — dans les pieces fermees
// ========================================

var modeCarrelageSol = false;
var csModeleId = null;
var carrelageSolElements = [];
var ghostCarrelageSol = null;

// Insetter un polygone vers l'interieur de `offset` metres
// Methode robuste : decaler chaque arete vers l'interieur puis recalculer les coins
function _insetPolygone(pts, offset) {
    var n = pts.length;
    if (n < 3 || offset <= 0) return pts;

    // Centre du polygone
    var cx = 0, cz = 0;
    for (var i = 0; i < n; i++) { cx += pts[i].x; cz += pts[i].z; }
    cx /= n; cz /= n;

    // Pour chaque arete, calculer la normale pointant vers le centre (interieur)
    var normals = [];
    for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;
        var dx = pts[j].x - pts[i].x, dz = pts[j].z - pts[i].z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.001) len = 0.001;
        // 2 normales possibles
        var n1x = dz / len, n1z = -dx / len;
        var n2x = -dz / len, n2z = dx / len;
        // Milieu de l'arete
        var mx = (pts[i].x + pts[j].x) / 2, mz = (pts[i].z + pts[j].z) / 2;
        // Choisir celle qui pointe vers le centre
        var dot1 = (cx - mx) * n1x + (cz - mz) * n1z;
        var dot2 = (cx - mx) * n2x + (cz - mz) * n2z;
        if (dot1 > dot2) {
            normals.push({ nx: n1x, nz: n1z });
        } else {
            normals.push({ nx: n2x, nz: n2z });
        }
    }

    // Decaler chaque arete et trouver les intersections des aretes adjacentes
    var result = [];
    for (var i = 0; i < n; i++) {
        var prev = (i + n - 1) % n;
        var j = (i + 1) % n;
        // Arete prev decalee (de pts[prev] a pts[i])
        var bx1 = pts[prev].x + normals[prev].nx * offset;
        var bz1 = pts[prev].z + normals[prev].nz * offset;
        var bx2 = pts[i].x + normals[prev].nx * offset;
        var bz2 = pts[i].z + normals[prev].nz * offset;
        // Arete i decalee (de pts[i] a pts[j])
        var ax1 = pts[i].x + normals[i].nx * offset;
        var az1 = pts[i].z + normals[i].nz * offset;
        var ax2 = pts[j].x + normals[i].nx * offset;
        var az2 = pts[j].z + normals[i].nz * offset;
        // Intersection
        var adx = ax2 - ax1, adz = az2 - az1;
        var bdx = bx2 - bx1, bdz = bz2 - bz1;
        var cross = adx * bdz - adz * bdx;
        if (Math.abs(cross) < 0.0001) {
            result.push({ x: ax1, z: az1 });
        } else {
            var t = ((bx1 - ax1) * bdz - (bz1 - az1) * bdx) / cross;
            result.push({ x: ax1 + adx * t, z: az1 + adz * t });
        }
    }
    return result;
}

(function() {
    var modeles = Carrelage.modeles();
    var html = '<div style="display:flex; flex-wrap:wrap; gap:4px;">';
    for (var i = 0; i < modeles.length; i++) {
        html += '<div class="cs-mod-btn" data-id="' + modeles[i].id + '" style="cursor:pointer; padding:4px 6px; border:1px solid #333; border-radius:4px; background:#16213e; display:flex; align-items:center; gap:6px; transition:border-color 0.15s;">';
        html += modeles[i].ico + '<span style="font-size:10px; color:#ccc;">' + modeles[i].nom + '</span></div>';
    }
    html += '</div>';
    document.getElementById('carrelage-sol-modeles').innerHTML = html;
})();

document.getElementById('btn-carrelage-sol').addEventListener('click', function() {
    if (modeCarrelageSol) { toutDesactiver(); return; }
    toutDesactiver();
    modeCarrelageSol = true;
    this.classList.add('actif');
    this.style.borderColor = '#A09080';
    document.getElementById('carrelage-sol-popup').style.display = 'block';
    if (!csModeleId) csModeleId = Carrelage.modeles()[0].id;
    container.style.cursor = 'crosshair';
    document.getElementById('info-bar').textContent = 'Cliquez dans une PIECE FERMEE pour carreler le sol';
});

document.getElementById('carrelage-sol-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.cs-mod-btn');
    if (!btn) return;
    csModeleId = btn.getAttribute('data-id');
    var mods = Carrelage.modeles();
    for (var m = 0; m < mods.length; m++) {
        if (mods[m].id === csModeleId) {
            document.getElementById('cs-larg').value = Math.round(mods[m].tW * 100);
            document.getElementById('cs-haut').value = Math.round(mods[m].tH * 100);
            break;
        }
    }
    var all = document.querySelectorAll('.cs-mod-btn');
    for (var i = 0; i < all.length; i++) { all[i].style.borderColor = '#333'; all[i].style.background = '#16213e'; }
    btn.style.borderColor = '#A09080'; btn.style.background = 'rgba(160,144,128,0.2)';
});

// Couleurs pour distinguer les carrelages sol par piece
var _csCouleurs = ['#4a9eff', '#43B047', '#ffa500', '#e94560', '#cc66ff', '#00ccff', '#F2D544', '#ff6b9d'];

// Creer un contour colore autour du carrelage sol
function _creerContourSol(pts, couleur, yPos) {
    var points = [];
    for (var i = 0; i <= pts.length; i++) {
        var p = pts[i % pts.length];
        points.push(new THREE.Vector3(p.x, yPos + 0.003, p.z));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: couleur, linewidth: 2 });
    return new THREE.Line(geo, mat);
}

// Trouver l'epaisseur brique moyenne pour insetter le polygone
function _getBriqueEpMoyenne() {
    for (var i = 0; i < editeur.elements.length; i++) {
        var bt = BRIQUES_TYPES[editeur.elements[i].params.briqueType] || BRIQUES_TYPES.standard;
        return bt.epaisseur;
    }
    return 0.11;
}

// Generer texture carrelage sol avec joint custom et pose decalee
function _genererTextureSolCustom(largeur, hauteur, tW, tH, coulCarreau, coulJoint, decale, jointEp) {
    var ppm = 100; // 100px/m pour perf (au lieu de 200)
    var cW = Math.round(largeur * ppm);
    var cH = Math.round(hauteur * ppm);
    if (cW > 2048) { ppm = Math.floor(2048 / largeur); cW = Math.round(largeur * ppm); cH = Math.round(hauteur * ppm); }
    if (cH > 2048) { ppm = Math.floor(2048 / hauteur); cW = Math.round(largeur * ppm); cH = Math.round(hauteur * ppm); }
    cW = Math.max(64, cW); cH = Math.max(64, cH);

    var canvas = document.createElement('canvas');
    canvas.width = cW; canvas.height = cH;
    var ctx = canvas.getContext('2d');

    // Fond = joint
    ctx.fillStyle = coulJoint;
    ctx.fillRect(0, 0, cW, cH);

    var tWpx = Math.round(tW * ppm);
    var tHpx = Math.round(tH * ppm);
    var jPx = Math.max(1, Math.round(jointEp * ppm));

    ctx.fillStyle = coulCarreau;

    var nbCol = Math.ceil(cW / (tWpx + jPx)) + 2;
    var nbRow = Math.ceil(cH / (tHpx + jPx)) + 2;

    for (var row = -1; row < nbRow; row++) {
        var offsetX = 0;
        if (decale && row % 2 !== 0) offsetX = (tWpx + jPx) / 2;
        for (var col = -1; col < nbCol; col++) {
            var x = col * (tWpx + jPx) + offsetX;
            var y = row * (tHpx + jPx);
            // Varier legerement la couleur pour un aspect realiste
            var r = parseInt(coulCarreau.substr(1, 2), 16);
            var g = parseInt(coulCarreau.substr(3, 2), 16);
            var b = parseInt(coulCarreau.substr(5, 2), 16);
            var variation = Math.floor(Math.random() * 12) - 6;
            r = Math.max(0, Math.min(255, r + variation));
            g = Math.max(0, Math.min(255, g + variation));
            b = Math.max(0, Math.min(255, b + variation));
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(Math.round(x), Math.round(y), tWpx, tHpx);
        }
    }

    var texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Creer un mesh sol a partir d'un polygone inset + texture carrelage
function _creerMeshSol(pts, modId, coulCarreau, coulJoint, yPos, opacite, customTW, customTH, contourCouleur, jointEp, angle, showLabel) {
    var mod = null;
    var modeles = Carrelage.modeles();
    for (var i = 0; i < modeles.length; i++) { if (modeles[i].id === modId) { mod = modeles[i]; break; } }
    if (!mod) mod = modeles[0];
    var tW = customTW || mod.tW;
    var tH = customTH || mod.tH;

    var shape = new THREE.Shape();
    shape.moveTo(pts[0].x, -pts[0].z);
    for (var i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, -pts[i].z);
    shape.lineTo(pts[0].x, -pts[0].z);

    var geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    // Apres rotation: (x, -z, 0) → (x, 0, z) = position monde correcte

    var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (var i = 0; i < pts.length; i++) {
        if (pts[i].x < minX) minX = pts[i].x;
        if (pts[i].x > maxX) maxX = pts[i].x;
        if (pts[i].z < minZ) minZ = pts[i].z;
        if (pts[i].z > maxZ) maxZ = pts[i].z;
    }
    var largeurSol = Math.max(0.1, maxX - minX);
    var profondeurSol = Math.max(0.1, maxZ - minZ);

    var isMetro = mod.id.indexOf('metro') >= 0 || angle === 'decale';
    var jEp = jointEp || 0.003;

    // Generer la texture avec joint custom
    var texW = largeurSol, texH = profondeurSol;
    if (angle === '45' || angle === 45) {
        // Diagonale : agrandir la texture pour couvrir la rotation
        var diag = Math.sqrt(largeurSol * largeurSol + profondeurSol * profondeurSol);
        texW = diag; texH = diag;
    }
    var texture = _genererTextureSolCustom(texW, texH, tW, tH, coulCarreau, coulJoint, isMetro, jEp);
    if (angle === '45' || angle === 45) {
        texture.rotation = Math.PI / 4;
        texture.center.set(0.5, 0.5);
    }

    var posAttr = geo.attributes.position;
    var uvAttr = geo.attributes.uv;
    for (var i = 0; i < posAttr.count; i++) {
        var px = posAttr.getX(i);
        var pz = posAttr.getZ(i);
        uvAttr.setXY(i, (px - minX) / largeurSol, (pz - minZ) / profondeurSol);
    }
    uvAttr.needsUpdate = true;

    var mat = new THREE.MeshStandardMaterial({
        map: texture, roughness: 0.6, side: THREE.DoubleSide,
        transparent: opacite < 0.99, opacity: opacite, depthWrite: opacite >= 0.99
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = yPos;

    // Groupe avec contour + label
    var group = new THREE.Group();
    group.add(mesh);
    if (contourCouleur) {
        group.add(_creerContourSol(pts, contourCouleur, yPos));
    }
    // Label surface
    if (showLabel) {
        var surfCS = 0;
        for (var si = 0; si < pts.length; si++) {
            var curr = pts[si], next = pts[(si + 1) % pts.length];
            surfCS += (curr.x * next.z - next.x * curr.z);
        }
        surfCS = Math.abs(surfCS) / 2;
        var cx = 0, cz = 0;
        for (var si = 0; si < pts.length; si++) { cx += pts[si].x; cz += pts[si].z; }
        cx /= pts.length; cz /= pts.length;
        var labelCanvas = document.createElement('canvas');
        labelCanvas.width = 256; labelCanvas.height = 64;
        var ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(surfCS.toFixed(1) + ' m²', 128, 28);
        ctx.font = '16px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText(Math.round(tW * 100) + 'x' + Math.round(tH * 100) + ' cm', 128, 52);
        var labelTex = new THREE.CanvasTexture(labelCanvas);
        var labelGeo = new THREE.PlaneGeometry(1.0, 0.25);
        var labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        var labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(cx, yPos + 0.01, cz);
        labelMesh.rotation.x = -Math.PI / 2;
        group.add(labelMesh);
    }
    return group;
    return mesh;
}

// Test point dans polygone (ray casting)
function _pointDansPolygone(px, pz, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i].x, zi = poly[i].z;
        var xj = poly[j].x, zj = poly[j].z;
        if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

// Cache des pieces pour eviter de recalculer a chaque mouvement de souris
var _csPiecesCache = null;
var _csPiecesCacheTime = 0;

function _getCachedPieces() {
    var now = Date.now();
    if (!_csPiecesCache || now - _csPiecesCacheTime > 2000) {
        _csPiecesCache = editeur.detecterPiecesFermees();
        _csPiecesCacheTime = now;
    }
    return _csPiecesCache;
}

function _invaliderCachePieces() { _csPiecesCache = null; }

// Trouver la piece sous la souris (utilise le cache)
function _trouverPieceSouris(ev) {
    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hit = rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (!hit) return null;
    var pieces = _getCachedPieces();
    for (var i = 0; i < pieces.length; i++) {
        if (_pointDansPolygone(hit.x, hit.z, pieces[i].points)) return pieces[i];
    }
    return null;
}

// Ghost simplifie (couleur unie, pas de texture) pour la performance
var _csGhostPieceId = null;

sceneManager.renderer.domElement.addEventListener('pointermove', function(ev) {
    if (!modeCarrelageSol || !csModeleId) return;

    var piece = _trouverPieceSouris(ev);
    var newId = piece ? (piece.centre.x.toFixed(1) + '_' + piece.centre.z.toFixed(1)) : null;

    // Si meme piece, ne rien faire
    if (newId === _csGhostPieceId && ghostCarrelageSol) return;
    _csGhostPieceId = newId;

    // Supprimer l'ancien ghost
    if (ghostCarrelageSol) { sceneManager.scene.remove(ghostCarrelageSol); ghostCarrelageSol = null; }
    if (!piece) return;

    // Ghost simple : juste un plan colore semi-transparent (pas de texture = rapide)
    var ep = _getBriqueEpMoyenne();
    var insetPts = _insetPolygone(piece.points, ep);
    var shape = new THREE.Shape();
    shape.moveTo(insetPts[0].x, -insetPts[0].z);
    for (var i = 1; i < insetPts.length; i++) shape.lineTo(insetPts[i].x, -insetPts[i].z);
    shape.lineTo(insetPts[0].x, -insetPts[0].z);
    var geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    var coulCarreau = document.getElementById('cs-couleur').value;
    var mat = new THREE.MeshBasicMaterial({ color: coulCarreau, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.003;
    ghostCarrelageSol = new THREE.Group();
    ghostCarrelageSol.add(mesh);
    ghostCarrelageSol.add(_creerContourSol(insetPts, '#ffffff', 0.003));
    sceneManager.scene.add(ghostCarrelageSol);
});

// Clic : poser le carrelage sol
sceneManager.renderer.domElement.addEventListener('click', function(ev) {
    if (!modeCarrelageSol || !csModeleId) return;
    if (ev.button !== 0) return;
    _invaliderCachePieces(); // Forcer recalcul au prochain clic
    _csGhostPieceId = null; // Forcer refresh ghost

    var piece = _trouverPieceSouris(ev);
    if (!piece) {
        document.getElementById('info-bar').textContent = 'Aucune piece fermee detectee ici.';
        return;
    }

    // Si deja carrele, remplacer l'ancien
    for (var i = carrelageSolElements.length - 1; i >= 0; i--) {
        var ci = carrelageSolElements[i].userData.csSol;
        if (ci && Math.abs(ci.cx - piece.centre.x) < 0.3 && Math.abs(ci.cz - piece.centre.z) < 0.3) {
            sceneManager.scene.remove(carrelageSolElements[i]);
            carrelageSolElements.splice(i, 1);
        }
    }

    editeur.sauvegarderEtat();

    var ep = _getBriqueEpMoyenne();
    var insetPts = _insetPolygone(piece.points, ep);
    var coulCarreau = document.getElementById('cs-couleur').value;
    var coulJoint = document.getElementById('cs-joint').value;
    var csTW = parseFloat(document.getElementById('cs-larg').value) / 100 || 0.30;
    var csTH = parseFloat(document.getElementById('cs-haut').value) / 100 || 0.30;
    var contourCoul = _csCouleurs[carrelageSolElements.length % _csCouleurs.length];
    var csJEp = parseFloat(document.getElementById('cs-joint-ep').value) / 1000 || 0.003;
    var csAngle = document.getElementById('cs-angle').value;
    var csLabel = document.getElementById('cs-label').checked;
    var mesh = _creerMeshSol(insetPts, csModeleId, coulCarreau, coulJoint, 0.002, 1.0, csTW, csTH, contourCoul, csJEp, csAngle, csLabel);
    mesh.userData.csSol = {
        modeleId: csModeleId,
        cx: piece.centre.x, cz: piece.centre.z,
        couleurCarreau: coulCarreau, couleurJoint: coulJoint,
        points: insetPts,
        contourCouleur: contourCoul,
        tW: csTW, tH: csTH,
        jointEp: csJEp, angle: csAngle, showLabel: csLabel
    };
    mesh.userData.isCarrelageSol = true;
    sceneManager.scene.add(mesh);
    carrelageSolElements.push(mesh);

    // Nettoyer le ghost pour le prochain survol
    if (ghostCarrelageSol) { sceneManager.scene.remove(ghostCarrelageSol); ghostCarrelageSol = null; }

    document.getElementById('info-bar').textContent = 'Carrelage sol pose ! (' + piece.aire.toFixed(1) + ' m²) | Cliquez dans une autre piece | Echap = quitter';
});

// Clic droit sur carrelage sol : supprimer
sceneManager.renderer.domElement.addEventListener('contextmenu', function(ev) {
    if (modeCarrelageSol) return;
    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(carrelageSolElements, false);
    if (hits.length > 0) {
        ev.preventDefault();
        var mesh = hits[0].object;
        if (confirm('Supprimer le carrelage sol ?')) {
            sceneManager.scene.remove(mesh);
            var idx = carrelageSolElements.indexOf(mesh);
            if (idx >= 0) carrelageSolElements.splice(idx, 1);
            document.getElementById('info-bar').textContent = 'Carrelage sol supprime';
        }
    }
});

// PAPIER PEINT — revetement sur placo
// ========================================

var ppObj = new PapierPeint(sceneManager.scene);
var modePapierPeint = false;
var ppModeleId = null;
var ghostPP = null;
var ghostPPTout = [];
var ppElements = [];
var ctxPPGroup = null;

(function() {
    var modeles = PapierPeint.modeles();
    var cats = { 'uni': 'Unis', 'rayures': 'Rayures', 'motif': 'Motifs' };
    var html = '';
    var done = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat;
        if (!done[cat]) {
            done[cat] = true;
            if (html) html += '</div>';
            html += '<div style="color:#D8C8B0; font-size:10px; font-weight:bold; margin-top:6px; margin-bottom:3px;">' + (cats[cat] || cat) + '</div><div style="display:flex; flex-wrap:wrap; gap:4px;">';
        }
        html += '<div class="pp-mod-btn" data-id="' + modeles[i].id + '" style="cursor:pointer; padding:4px 6px; border:1px solid #333; border-radius:4px; background:#16213e; display:flex; align-items:center; gap:6px; transition:border-color 0.15s;">';
        html += modeles[i].ico + '<span style="font-size:10px; color:#ccc;">' + modeles[i].nom + '</span></div>';
    }
    html += '</div>';
    document.getElementById('papier-peint-modeles').innerHTML = html;
})();

document.getElementById('btn-papier-peint').addEventListener('click', function() {
    if (modePapierPeint) { toutDesactiver(); return; }
    toutDesactiver();
    modePapierPeint = true;
    this.classList.add('actif');
    this.style.borderColor = '#D8C8B0';
    document.getElementById('papier-peint-popup').style.display = 'block';
    if (!ppModeleId) {
        ppModeleId = PapierPeint.modeles()[0].id;
        var cols = PapierPeint.couleursParModele(ppModeleId);
        ppObj.setCouleurs(cols.c1, cols.c2);
        document.getElementById('pp-couleur1').value = cols.c1;
        document.getElementById('pp-couleur2').value = cols.c2;
    }
    if (ghostPP) sceneManager.scene.remove(ghostPP);
    ghostPP = ppObj.creerGhost(ppModeleId, 1, 2.50);
    sceneManager.scene.add(ghostPP);
    document.getElementById('info-bar').textContent = 'Cliquez sur un PLACO pour poser le papier peint';
    container.style.cursor = 'crosshair';
});

document.getElementById('papier-peint-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.pp-mod-btn');
    if (!btn) return;
    ppModeleId = btn.getAttribute('data-id');
    var cols = PapierPeint.couleursParModele(ppModeleId);
    document.getElementById('pp-couleur1').value = cols.c1;
    document.getElementById('pp-couleur2').value = cols.c2;
    ppObj.setCouleurs(cols.c1, cols.c2);
    var all = document.querySelectorAll('.pp-mod-btn');
    for (var i = 0; i < all.length; i++) { all[i].style.borderColor = '#333'; all[i].style.background = '#16213e'; }
    btn.style.borderColor = '#D8C8B0'; btn.style.background = 'rgba(216,200,176,0.2)';
    if (ghostPP) sceneManager.scene.remove(ghostPP);
    ghostPP = ppObj.creerGhost(ppModeleId, 1, 2.50);
    sceneManager.scene.add(ghostPP);
    document.getElementById('info-bar').textContent = 'Modele ' + ppModeleId + ' — Cliquez sur un PLACO pour poser';
});

document.getElementById('pp-couleur1').addEventListener('input', function() {
    ppObj.setCouleurs(this.value, document.getElementById('pp-couleur2').value);
    if (ghostPP) sceneManager.scene.remove(ghostPP);
    ghostPP = ppObj.creerGhost(ppModeleId, 1, 2.50);
    sceneManager.scene.add(ghostPP);
});

document.getElementById('pp-couleur2').addEventListener('input', function() {
    ppObj.setCouleurs(document.getElementById('pp-couleur1').value, this.value);
    if (ghostPP) sceneManager.scene.remove(ghostPP);
    ghostPP = ppObj.creerGhost(ppModeleId, 1, 2.50);
    sceneManager.scene.add(ghostPP);
});

function _nettoyerGhostPPTout() {
    for (var i = 0; i < ghostPPTout.length; i++) {
        sceneManager.scene.remove(ghostPPTout[i]);
    }
    ghostPPTout = [];
}

function _positionnerGhostPP(ghost, pi) {
    var rad = pi.angle * Math.PI / 180;
    var side = pi.side || 1;
    var placoGroup = null;
    for (var pg = 0; pg < placoElements.length; pg++) {
        var pgi = placoElements[pg].userData.placoInfo;
        if (pgi && Math.abs(pgi.worldX - pi.worldX) < 0.01 && Math.abs(pgi.worldZ - pi.worldZ) < 0.01 && pgi.side === pi.side) {
            placoGroup = placoElements[pg]; break;
        }
    }
    if (placoGroup) {
        var decalage = (pi.ep / 2 + 0.002) * side;
        var perpX = -Math.sin(rad) * decalage;
        var perpZ = Math.cos(rad) * decalage;
        ghost.position.set(placoGroup.position.x + perpX, pi.y || 0, placoGroup.position.z + perpZ);
    } else {
        var offset = pi.murEpFull + pi.ep + 0.002;
        var perpX = -Math.sin(rad) * side * offset;
        var perpZ = Math.cos(rad) * side * offset;
        ghost.position.set(pi.worldX + perpX, pi.y || 0, pi.worldZ + perpZ);
    }
    ghost.rotation.y = -rad;
    ghost.scale.x = pi.largeur;
    ghost.scale.y = pi.hauteur / 2.50;
    ghost.visible = true;
}

// Survol : ghost papier peint
sceneManager.renderer.domElement.addEventListener('pointermove', function(ev) {
    if (!modePapierPeint || !ghostPP) return;
    ghostPP.visible = false;
    _nettoyerGhostPPTout();

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    for (var i = 0; i < hits.length; i++) {
        if (hits[i].object.userData && hits[i].object.userData.isPorte) return;
    }

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.placoInfo) obj = obj.parent;
        if (obj.userData && obj.userData.placoInfo) {
            var pi = obj.userData.placoInfo;
            _positionnerGhostPP(ghostPP, pi);

            if (document.getElementById('pp-tout-mur').checked) {
                var refAngle = pi.angle;
                var refMurEp = pi.murEpFull;
                for (var p = 0; p < placoElements.length; p++) {
                    var pj = placoElements[p].userData.placoInfo;
                    if (!pj) continue;
                    if (Math.abs(pj.angle - refAngle) < 1 && Math.abs(pj.murEpFull - refMurEp) < 0.05) {
                        if (Math.abs(pj.worldX - pi.worldX) < 0.01 && Math.abs(pj.worldZ - pi.worldZ) < 0.01 && pj.side === pi.side) continue;
                        var dejaLa = false;
                        for (var k = 0; k < ppElements.length; k++) {
                            var pk = ppElements[k].userData.papierPeintInfo;
                            if (pk && Math.abs(pk.placoWorldX - pj.worldX) < 0.1 && Math.abs(pk.placoWorldZ - pj.worldZ) < 0.1 && pk.side === pj.side) {
                                dejaLa = true; break;
                            }
                        }
                        if (!dejaLa) {
                            var g2 = ppObj.creerGhost(ppModeleId, 1, 2.50);
                            _positionnerGhostPP(g2, pj);
                            sceneManager.scene.add(g2);
                            ghostPPTout.push(g2);
                        }
                    }
                }
            }
            return;
        }
    }
});

// Clic : poser le papier peint
sceneManager.renderer.domElement.addEventListener('click', function(ev) {
    if (!modePapierPeint) return;
    if (ev.button !== 0) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.placoInfo) obj = obj.parent;
        if (obj.userData && obj.userData.placoInfo) {
            var pi = obj.userData.placoInfo;
            editeur.sauvegarderEtat();

            if (document.getElementById('pp-tout-mur').checked) {
                var refAngle = pi.angle;
                var refMurEp = pi.murEpFull;
                var nb = 0;
                for (var p = 0; p < placoElements.length; p++) {
                    var pj = placoElements[p].userData.placoInfo;
                    if (!pj) continue;
                    if (Math.abs(pj.angle - refAngle) < 1 && Math.abs(pj.murEpFull - refMurEp) < 0.05) {
                        var dejaLa = false;
                        for (var k = 0; k < ppElements.length; k++) {
                            var pk = ppElements[k].userData.papierPeintInfo;
                            if (pk && Math.abs(pk.placoWorldX - pj.worldX) < 0.1 && Math.abs(pk.placoWorldZ - pj.worldZ) < 0.1 && pk.side === pj.side) {
                                dejaLa = true; break;
                            }
                        }
                        if (!dejaLa) {
                            var g = ppObj.creer(ppModeleId, pj, placoElements[p]);
                            ppElements.push(g);
                            nb++;
                        }
                    }
                }
                document.getElementById('info-bar').textContent = nb + ' papier(s) peint(s) pose(s) sur tout le mur !';
            } else {
                var g = ppObj.creer(ppModeleId, pi, obj);
                ppElements.push(g);
                document.getElementById('info-bar').textContent = 'Papier peint pose sur le placo !';
            }
            return;
        }
    }
    document.getElementById('info-bar').textContent = 'Cliquez sur un PLACO (pas le mur directement)';
});

// Clic droit : menu contextuel papier peint
sceneManager.renderer.domElement.addEventListener('contextmenu', function(ev) {
    if (modePapierPeint) return;
    document.getElementById('ctx-pp-menu').style.display = 'none';

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = rc.intersectObjects(sceneManager.scene.children, true);

    for (var i = 0; i < hits.length; i++) {
        var obj = hits[i].object;
        while (obj.parent && !obj.userData.papierPeintInfo) obj = obj.parent;
        if (obj.userData && obj.userData.papierPeintInfo) {
            ev.preventDefault();
            ctxPPGroup = obj;
            var menu = document.getElementById('ctx-pp-menu');
            menu.style.left = ev.clientX + 'px';
            menu.style.top = ev.clientY + 'px';
            menu.style.display = 'block';
            return;
        }
    }
});

document.getElementById('ctx-pp-editer').addEventListener('click', function() {
    if (!ctxPPGroup) return;
    document.getElementById('ctx-pp-menu').style.display = 'none';
    var cols = PapierPeint.lireCouleurs(ctxPPGroup);
    var c1 = prompt('Couleur 1 (hex)', cols.couleur1);
    if (!c1) return;
    var c2 = prompt('Couleur 2 (hex)', cols.couleur2);
    if (!c2) return;
    PapierPeint.changerCouleurs(ctxPPGroup, c1, c2);
});

document.getElementById('ctx-pp-supprimer').addEventListener('click', function() {
    if (!ctxPPGroup) return;
    document.getElementById('ctx-pp-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    sceneManager.scene.remove(ctxPPGroup);
    for (var i = 0; i < ppElements.length; i++) {
        if (ppElements[i] === ctxPPGroup) { ppElements.splice(i, 1); break; }
    }
    ctxPPGroup = null;
});

// TRAITS AU SOL — delimitation de zones
// ========================================

var modeTrait = false;
var traitDrag = false;
var traitStart = null;   // {wx, wz} debut du clic+glisser
var ghostTrait = null;   // rectangle preview
var ghostTraitCurseur = null; // petit marqueur qui suit la souris avant le clic
var modeDeplacerTrait = false;
var deplacerTraitObj = null;
var deplacerTraitOrig = null;
var ctxTrait = null;
var editTrait = null;

function _traitCouleur() {
    return document.getElementById('trait-couleur').value || '#4a9eff';
}
function _traitTirets() {
    return document.getElementById('trait-style').value === 'tirets';
}

function _creerGhostTraitRect(x1, z1, x2, z2) {
    if (ghostTrait) { sceneManager.scene.remove(ghostTrait); ghostTrait = null; }
    var w = Math.abs(x2 - x1), h = Math.abs(z2 - z1);
    if (w < 0.05 && h < 0.05) return;
    var couleur = _traitCouleur();

    // Rectangle semi-transparent + contour
    var group = new THREE.Group();
    var geo = new THREE.PlaneGeometry(w, h);
    var mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur), transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2);
    group.add(plane);

    // Contour en tirets
    var coins = [
        new THREE.Vector3(x1, 0.04, z1),
        new THREE.Vector3(x2, 0.04, z1),
        new THREE.Vector3(x2, 0.04, z2),
        new THREE.Vector3(x1, 0.04, z2),
        new THREE.Vector3(x1, 0.04, z1)
    ];
    var cGeo = new THREE.BufferGeometry().setFromPoints(coins);
    var cMat = new THREE.LineDashedMaterial({ color: new THREE.Color(couleur), linewidth: 2, dashSize: 0.15, gapSize: 0.1 });
    var cLine = new THREE.Line(cGeo, cMat);
    cLine.computeLineDistances();
    group.add(cLine);

    sceneManager.scene.add(group);
    ghostTrait = group;
}

// Bouton trait
document.getElementById('btn-trait').addEventListener('click', function() {
    if (modeTrait) {
        toutDesactiver();
        return;
    }
    toutDesactiver();
    modeTrait = true;
    document.getElementById('btn-trait').classList.add('actif');
    document.getElementById('btn-trait').style.borderColor = '#4a9eff';
    document.getElementById('trait-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'Cliquez+glissez sur le sol pour dessiner un rectangle';
    container.style.cursor = 'crosshair';
    sceneManager.controls.enabled = false;
});

// Quand la couleur change, recréer le curseur fantome
document.getElementById('trait-couleur').addEventListener('input', function() {
    if (ghostTraitCurseur) {
        sceneManager.scene.remove(ghostTraitCurseur);
        ghostTraitCurseur = null; // sera recree au prochain pointermove
    }
});

// Pointerdown : debut du glisse
sceneManager.renderer.domElement.addEventListener('pointerdown', function(ev) {
    if (!modeTrait || modeDeplacerTrait) return;
    if (ev.button !== 0) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var pt = new THREE.Vector3();
    rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
    if (!pt) return;

    traitStart = { wx: snapGrille(pt.x), wz: snapGrille(pt.z) };
    traitDrag = true;
});

// Pointermove : curseur fantome + preview du rectangle
sceneManager.renderer.domElement.addEventListener('pointermove', function(ev) {
    if (!modeTrait) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var pt = new THREE.Vector3();
    rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
    if (!pt) return;

    var sx = snapGrille(pt.x), sz = snapGrille(pt.z);

    // Avant le clic : afficher le curseur fantome (croix + point)
    if (!traitDrag && !modeDeplacerTrait) {
        if (!ghostTraitCurseur) {
            ghostTraitCurseur = new THREE.Group();
            // Croix
            var couleur = _traitCouleur();
            var taille = 0.3;
            var matC = new THREE.LineBasicMaterial({ color: new THREE.Color(couleur), transparent: true, opacity: 0.7 });
            var g1 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-taille, 0.05, 0), new THREE.Vector3(taille, 0.05, 0)
            ]);
            var g2 = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0.05, -taille), new THREE.Vector3(0, 0.05, taille)
            ]);
            ghostTraitCurseur.add(new THREE.Line(g1, matC));
            ghostTraitCurseur.add(new THREE.Line(g2, matC));
            // Cercle au centre
            var circGeo = new THREE.RingGeometry(0.06, 0.1, 16);
            var circMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(couleur), transparent: true, opacity: 0.6, side: THREE.DoubleSide });
            var circ = new THREE.Mesh(circGeo, circMat);
            circ.rotation.x = -Math.PI / 2;
            circ.position.y = 0.05;
            ghostTraitCurseur.add(circ);
            sceneManager.scene.add(ghostTraitCurseur);
        }
        ghostTraitCurseur.position.set(sx, 0, sz);
        ghostTraitCurseur.visible = true;
    } else if (ghostTraitCurseur) {
        ghostTraitCurseur.visible = false;
    }

    // Pendant le glisse : preview du rectangle
    if (traitDrag && traitStart) {
        _creerGhostTraitRect(traitStart.wx, traitStart.wz, sx, sz);
        var w = Math.abs(sx - traitStart.wx).toFixed(1);
        var h = Math.abs(sz - traitStart.wz).toFixed(1);
        document.getElementById('info-bar').textContent = 'TRAIT — ' + w + 'm x ' + h + 'm | Relachez pour valider';
    }

    // Mode deplacement : le trait suit la souris
    if (modeDeplacerTrait && deplacerTraitObj) {
        var p = deplacerTraitObj.params;
        var w = p.x2 - p.x1, h = p.z2 - p.z1;
        p.x1 = sx; p.z1 = sz;
        p.x2 = sx + w; p.z2 = sz + h;
        editeur.reconstruireTrait(deplacerTraitObj);
    }
});

// Pointerup : valider le rectangle
sceneManager.renderer.domElement.addEventListener('pointerup', function(ev) {
    if (ev.button !== 0) return;

    // Fin du glisse trait
    if (modeTrait && traitDrag && traitStart && !modeDeplacerTrait) {
        traitDrag = false;
        if (ghostTrait) { sceneManager.scene.remove(ghostTrait); ghostTrait = null; }

        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        var rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
        var pt = new THREE.Vector3();
        rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
        if (!pt) { traitStart = null; return; }

        var x1 = traitStart.wx, z1 = traitStart.wz;
        var x2 = snapGrille(pt.x), z2 = snapGrille(pt.z);
        traitStart = null;

        // Minimum 0.3m de cote
        if (Math.abs(x2 - x1) < 0.3 && Math.abs(z2 - z1) < 0.3) return;

        editeur.sauvegarderEtat();
        editeur.ajouterTrait({
            x1: Math.min(x1, x2), z1: Math.min(z1, z2),
            x2: Math.max(x1, x2), z2: Math.max(z1, z2),
            couleur: _traitCouleur(),
            tirets: _traitTirets()
        });
        document.getElementById('info-bar').textContent = 'Rectangle trace ! Continuez ou Echap pour quitter';
        return;
    }

    // Fin deplacement trait
    if (modeDeplacerTrait && deplacerTraitObj) {
        _stopClignotement();
        editeur.sauvegarderEtat();
        var avaitZones = modeZones;
        toutDesactiver();
        // Reactiver le mode zones si on etait en train de deplacer depuis le panel
        if (avaitZones) {
            modeZones = true;
            document.getElementById('btn-zones').classList.add('actif');
            document.getElementById('btn-zones').style.borderColor = '#FF9800';
            document.getElementById('zones-panel').style.display = 'block';
            for (var ti = 0; ti < editeur.traits.length; ti++) {
                editeur.traits[ti].line.visible = true;
            }
            _afficherPiecesFermees();
            _mettreAJourPanelZones();
        }
    }
});

// Clic droit sur un trait → menu contextuel
sceneManager.renderer.domElement.addEventListener('contextmenu', function(ev) {
    if (editeur.traits.length === 0) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var pt = new THREE.Vector3();
    rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
    if (!pt) return;

    // Trouver le trait le plus proche (tester les 4 cotes)
    var bestDist = 0.5;
    var bestTrait = null;
    for (var i = 0; i < editeur.traits.length; i++) {
        var t = editeur.traits[i];
        var p = t.params;
        var coins = [
            { x: p.x1, z: p.z1 }, { x: p.x2, z: p.z1 },
            { x: p.x2, z: p.z2 }, { x: p.x1, z: p.z2 }
        ];
        for (var c = 0; c < 4; c++) {
            var c1 = coins[c], c2 = coins[(c + 1) % 4];
            var dx = c2.x - c1.x, dz = c2.z - c1.z;
            var len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) continue;
            var px = pt.x - c1.x, pz = pt.z - c1.z;
            var proj = Math.max(0, Math.min(1, (px * dx + pz * dz) / (len * len)));
            var cx = c1.x + dx * proj - pt.x;
            var cz = c1.z + dz * proj - pt.z;
            var dist = Math.sqrt(cx * cx + cz * cz);
            if (dist < bestDist) {
                bestDist = dist;
                bestTrait = t;
            }
        }
    }

    if (bestTrait) {
        ev.preventDefault();
        ev.stopPropagation();
        ctxTrait = bestTrait;
        var menu = document.getElementById('ctx-trait-menu');
        menu.style.display = 'block';
        menu.style.left = ev.clientX + 'px';
        menu.style.top = ev.clientY + 'px';
    }
}, true);

// Menu contextuel — Editer
document.getElementById('ctx-trait-editer').addEventListener('click', function() {
    if (!ctxTrait) return;
    document.getElementById('ctx-trait-menu').style.display = 'none';
    editTrait = ctxTrait;
    var p = editTrait.params;
    document.getElementById('et-couleur').value = p.couleur || '#4a9eff';
    document.getElementById('et-style').value = (p.tirets !== false) ? 'tirets' : 'plein';
    document.getElementById('edit-trait-popup').style.display = 'block';
});

// Menu contextuel — Deplacer
document.getElementById('ctx-trait-deplacer').addEventListener('click', function() {
    if (!ctxTrait) return;
    document.getElementById('ctx-trait-menu').style.display = 'none';
    var traitADeplacer = ctxTrait;
    toutDesactiver();
    traitADeplacer.line.visible = true;
    _startClignotement(traitADeplacer);
    modeTrait = true;
    modeDeplacerTrait = true;
    deplacerTraitObj = traitADeplacer;
    deplacerTraitOrig = { x1: traitADeplacer.params.x1, z1: traitADeplacer.params.z1, x2: traitADeplacer.params.x2, z2: traitADeplacer.params.z2 };
    document.getElementById('btn-trait').classList.add('actif');
    document.getElementById('info-bar').textContent = 'Cliquez pour poser le rectangle | Echap = annuler';
    container.style.cursor = 'move';
    sceneManager.controls.enabled = false;
});

// Menu contextuel — Supprimer
document.getElementById('ctx-trait-supprimer').addEventListener('click', function() {
    if (!ctxTrait) return;
    document.getElementById('ctx-trait-menu').style.display = 'none';
    editeur.sauvegarderEtat();
    editeur.supprimerTrait(ctxTrait.id);
    ctxTrait = null;
});

// Popup editer — Appliquer
document.getElementById('et-appliquer').addEventListener('click', function() {
    if (!editTrait) return;
    editeur.sauvegarderEtat();
    editTrait.params.couleur = document.getElementById('et-couleur').value;
    editTrait.params.tirets = document.getElementById('et-style').value === 'tirets';
    editeur.reconstruireTrait(editTrait);
    document.getElementById('edit-trait-popup').style.display = 'none';
    editTrait = null;
});

// Popup editer — Supprimer
document.getElementById('et-supprimer').addEventListener('click', function() {
    if (!editTrait) return;
    editeur.sauvegarderEtat();
    editeur.supprimerTrait(editTrait.id);
    document.getElementById('edit-trait-popup').style.display = 'none';
    editTrait = null;
});

// Mise a jour couleur en temps reel dans le popup editer
document.getElementById('et-couleur').addEventListener('input', function() {
    if (!editTrait) return;
    editTrait.params.couleur = this.value;
    editeur.reconstruireTrait(editTrait);
});

document.getElementById('et-style').addEventListener('change', function() {
    if (!editTrait) return;
    editTrait.params.tirets = this.value === 'tirets';
    editeur.reconstruireTrait(editTrait);
});

// Echap annule le deplacement de trait
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modeDeplacerTrait && deplacerTraitObj && deplacerTraitOrig) {
        _stopClignotement();
        deplacerTraitObj.params.x1 = deplacerTraitOrig.x1;
        deplacerTraitObj.params.z1 = deplacerTraitOrig.z1;
        deplacerTraitObj.params.x2 = deplacerTraitOrig.x2;
        deplacerTraitObj.params.z2 = deplacerTraitOrig.z2;
        editeur.reconstruireTrait(deplacerTraitObj);
        var avaitZones = modeZones;
        toutDesactiver();
        if (avaitZones) {
            modeZones = true;
            document.getElementById('btn-zones').classList.add('actif');
            document.getElementById('btn-zones').style.borderColor = '#FF9800';
            document.getElementById('zones-panel').style.display = 'block';
            for (var ti = 0; ti < editeur.traits.length; ti++) {
                editeur.traits[ti].line.visible = true;
            }
            _afficherPiecesFermees();
            _mettreAJourPanelZones();
        }
    }
});

// ========================================
// ZONES / PIECES FERMEES
// ========================================

var modeZones = false;

document.getElementById('btn-zones').addEventListener('click', function() {
    modeZones = !modeZones;
    var btn = document.getElementById('btn-zones');
    var panel = document.getElementById('zones-panel');

    if (modeZones) {
        btn.classList.add('actif');
        btn.style.borderColor = '#FF9800';
        // Afficher les traits
        for (var i = 0; i < editeur.traits.length; i++) {
            editeur.traits[i].line.visible = true;
        }
        _afficherPiecesFermees();
        _mettreAJourPanelZones();
        panel.style.display = 'block';
    } else {
        btn.classList.remove('actif');
        btn.style.borderColor = '';
        // Nettoyer les meshes
        for (var i = 0; i < piecesMeshes.length; i++) {
            sceneManager.scene.remove(piecesMeshes[i]);
        }
        piecesMeshes = [];
        // Masquer les traits
        for (var i = 0; i < editeur.traits.length; i++) {
            editeur.traits[i].line.visible = false;
        }
        panel.style.display = 'none';
        document.getElementById('zone-popup').style.display = 'none';
    }
});

var _traitSelectionneId = null;
var _clignotementInterval = null;
var _clignotementGhost = null;

function _startClignotement(traitObj) {
    _stopClignotement();
    // Creer un ghost clignotant a la position actuelle (fixe au sol)
    var p = traitObj.params;
    var coins = [
        new THREE.Vector3(p.x1, 0.06, p.z1),
        new THREE.Vector3(p.x2, 0.06, p.z1),
        new THREE.Vector3(p.x2, 0.06, p.z2),
        new THREE.Vector3(p.x1, 0.06, p.z2),
        new THREE.Vector3(p.x1, 0.06, p.z1)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(coins);
    var mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
    _clignotementGhost = new THREE.Line(geo, mat);
    sceneManager.scene.add(_clignotementGhost);

    var visible = true;
    _clignotementInterval = setInterval(function() {
        visible = !visible;
        if (_clignotementGhost) _clignotementGhost.visible = visible;
    }, 300);
}

function _stopClignotement() {
    if (_clignotementInterval) {
        clearInterval(_clignotementInterval);
        _clignotementInterval = null;
    }
    if (_clignotementGhost) {
        sceneManager.scene.remove(_clignotementGhost);
        _clignotementGhost.geometry.dispose();
        _clignotementGhost.material.dispose();
        _clignotementGhost = null;
    }
    // Remettre tous les traits dans le bon etat de visibilite
    for (var i = 0; i < editeur.traits.length; i++) {
        editeur.traits[i].line.visible = modeZones || modeTrait;
    }
}

function _mettreAJourPanelZones() {
    var pieces = editeur.detecterPiecesFermees();
    var panel = document.getElementById('zones-panel-liste');
    var count = document.getElementById('zones-panel-count');
    if (!panel) return;

    count.textContent = pieces.length + ' piece' + (pieces.length > 1 ? 's' : '');
    panel.innerHTML = '';

    // --- Section pieces ---
    for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        var zone = _trouverZonePourPiece(p);
        var div = document.createElement('div');
        div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:5px 6px; border-radius:4px; margin-bottom:3px; background:rgba(255,152,0,0.08); cursor:pointer;';

        var nom = zone ? zone.nom : 'Piece ' + (i + 1);
        var couleur = zone ? zone.couleur : '#888';
        var surface = p.aire.toFixed(2);
        var perimetre = 0;
        for (var j = 0; j < p.points.length; j++) {
            var curr = p.points[j];
            var next = p.points[(j + 1) % p.points.length];
            var ddx = next.x - curr.x, ddz = next.z - curr.z;
            perimetre += Math.sqrt(ddx * ddx + ddz * ddz);
        }

        div.innerHTML =
            '<span style="display:flex; align-items:center; gap:6px;">' +
            '<span style="width:10px; height:10px; border-radius:2px; background:' + couleur + '; flex-shrink:0;"></span>' +
            '<span>' + nom + '</span></span>' +
            '<span style="color:#888; font-size:10px; white-space:nowrap;">' + surface + ' m² | ' + perimetre.toFixed(1) + 'm</span>';

        div.onmouseover = function() { this.style.background = 'rgba(255,152,0,0.2)'; };
        div.onmouseout = function() { this.style.background = 'rgba(255,152,0,0.08)'; };

        (function(piece) {
            div.onclick = function(ev) {
                _afficherPopupZone(piece, ev.clientX, ev.clientY);
            };
        })(p);

        panel.appendChild(div);
    }

    if (pieces.length === 0) {
        panel.innerHTML = '<div style="color:#666; padding:8px; text-align:center;">Aucune piece fermee detectee.<br><span style="font-size:10px;">Formez un polygone ferme avec vos murs.</span></div>';
    }

    // --- Section traits ---
    if (editeur.traits.length > 0) {
        var sep = document.createElement('div');
        sep.style.cssText = 'margin:8px 0 4px; padding:4px 0; border-top:1px solid #333; color:#4a9eff; font-size:10px; font-weight:bold;';
        sep.textContent = 'TRAITS AU SOL (' + editeur.traits.length + ')';
        panel.appendChild(sep);

        for (var i = 0; i < editeur.traits.length; i++) {
            var t = editeur.traits[i];
            var tp = t.params;
            var tw = Math.abs(tp.x2 - tp.x1).toFixed(1);
            var th = Math.abs(tp.z2 - tp.z1).toFixed(1);
            var selected = (_traitSelectionneId === t.id);

            // Conteneur principal
            var wrapper = document.createElement('div');
            wrapper.style.cssText = 'margin-bottom:3px; border-radius:4px; border:1px solid ' + (selected ? (tp.couleur || '#4a9eff') : 'transparent') + '; background:' + (selected ? 'rgba(74,158,255,0.15)' : 'rgba(74,158,255,0.05)') + ';';

            // Ligne titre (cliquable pour selectionner)
            var tdiv = document.createElement('div');
            tdiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:5px 6px; cursor:pointer; border-radius:4px;';

            tdiv.innerHTML =
                '<span style="display:flex; align-items:center; gap:6px;">' +
                '<span style="width:12px; height:12px; border-radius:2px; background:' + (tp.couleur || '#4a9eff') + '; flex-shrink:0; opacity:' + (tp.rempli ? '1' : '0.4') + '; border:2px solid ' + (tp.couleur || '#4a9eff') + ';"></span>' +
                '<span style="color:#ccc; font-size:11px;">Rect ' + tw + ' x ' + th + 'm</span></span>' +
                '<span style="color:' + (selected ? '#fff' : '#666') + '; font-size:10px;">' + (selected ? '▼' : '▶') + '</span>';

            tdiv.onmouseover = function() { this.style.background = 'rgba(74,158,255,0.15)'; };
            tdiv.onmouseout = function() { this.style.background = 'transparent'; };

            // Clic = selectionner / deselectionner
            (function(traitObj, wrap) {
                tdiv.onclick = function(ev) {
                    ev.stopPropagation();
                    if (_traitSelectionneId === traitObj.id) {
                        _traitSelectionneId = null;
                        _stopClignotement();
                    } else {
                        _traitSelectionneId = traitObj.id;
                        _startClignotement(traitObj);
                    }
                    _mettreAJourPanelZones();
                };
            })(t, wrapper);

            wrapper.appendChild(tdiv);

            // Panel d'edition (visible seulement si selectionne)
            if (selected) {
                var editDiv = document.createElement('div');
                editDiv.style.cssText = 'padding:6px 8px; border-top:1px solid rgba(74,158,255,0.2);';

                editDiv.innerHTML =
                    '<div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">' +
                    '<label style="color:#888; font-size:10px; width:50px;">Couleur</label>' +
                    '<input type="color" class="sel-color" value="' + (tp.couleur || '#4a9eff') + '" style="width:30px; height:22px; padding:0; border:1px solid #444; border-radius:3px; cursor:pointer; background:transparent;">' +
                    '<label style="color:#888; font-size:10px; margin-left:8px;">Style</label>' +
                    '<select class="sel-style" style="padding:2px 4px; background:#16213e; color:#fff; border:1px solid #444; border-radius:3px; font-size:10px; font-family:monospace;">' +
                    '<option value="tirets"' + (tp.tirets !== false ? ' selected' : '') + '>Tirets</option>' +
                    '<option value="plein"' + (tp.tirets === false ? ' selected' : '') + '>Plein</option>' +
                    '</select>' +
                    '</div>' +
                    '<div style="display:flex; gap:4px;">' +
                    '<button class="sel-fill" style="flex:1; padding:4px; background:' + (tp.rempli ? tp.couleur || '#4a9eff' : '#16213e') + '; color:#fff; border:1px solid ' + (tp.couleur || '#4a9eff') + '; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">' + (tp.rempli ? 'Rempli ■' : 'Remplir □') + '</button>' +
                    '<button class="sel-move" style="flex:1; padding:4px; background:#16213e; color:#43B047; border:1px solid #43B047; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">Deplacer ✥</button>' +
                    '<button class="sel-del" style="padding:4px 8px; background:#16213e; color:#e94560; border:1px solid #e94560; border-radius:3px; cursor:pointer; font-family:monospace; font-size:10px;">×</button>' +
                    '</div>';

                (function(traitObj) {
                    // Couleur
                    editDiv.querySelector('.sel-color').addEventListener('input', function(ev) {
                        ev.stopPropagation();
                        traitObj.params.couleur = this.value;
                        editeur.reconstruireTrait(traitObj);
                        traitObj.line.visible = true;
                        _mettreAJourPanelZones();
                    });
                    // Style
                    editDiv.querySelector('.sel-style').addEventListener('change', function(ev) {
                        ev.stopPropagation();
                        traitObj.params.tirets = this.value === 'tirets';
                        editeur.reconstruireTrait(traitObj);
                        traitObj.line.visible = true;
                    });
                    // Remplir
                    editDiv.querySelector('.sel-fill').onclick = function(ev) {
                        ev.stopPropagation();
                        traitObj.params.rempli = !traitObj.params.rempli;
                        editeur.reconstruireTrait(traitObj);
                        traitObj.line.visible = true;
                        _mettreAJourPanelZones();
                    };
                    // Deplacer
                    editDiv.querySelector('.sel-move').onclick = function(ev) {
                        ev.stopPropagation();
                        _stopClignotement();
                        toutDesactiver();
                        traitObj.line.visible = true;
                        _startClignotement(traitObj);
                        modeTrait = true;
                        modeDeplacerTrait = true;
                        deplacerTraitObj = traitObj;
                        deplacerTraitOrig = { x1: traitObj.params.x1, z1: traitObj.params.z1, x2: traitObj.params.x2, z2: traitObj.params.z2 };
                        document.getElementById('btn-trait').classList.add('actif');
                        document.getElementById('info-bar').textContent = 'Cliquez pour poser le rectangle | Echap = annuler';
                        container.style.cursor = 'move';
                        sceneManager.controls.enabled = false;
                        modeZones = true;
                        document.getElementById('btn-zones').classList.add('actif');
                        document.getElementById('btn-zones').style.borderColor = '#FF9800';
                        document.getElementById('zones-panel').style.display = 'block';
                    };
                    // Supprimer
                    editDiv.querySelector('.sel-del').onclick = function(ev) {
                        ev.stopPropagation();
                        _stopClignotement();
                        _traitSelectionneId = null;
                        editeur.sauvegarderEtat();
                        editeur.supprimerTrait(traitObj.id);
                        if (modeZones) {
                            _afficherPiecesFermees();
                            _mettreAJourPanelZones();
                        }
                    };
                })(t);

                wrapper.appendChild(editDiv);
            }

            panel.appendChild(wrapper);
        }
    }
}

// Clic sur le sol pour assigner une zone (en mode zones)
sceneManager.renderer.domElement.addEventListener('pointerup', function(ev) {
    if (!modeZones) return;
    if (ev.button !== 0) return; // clic gauche seulement

    // Fermer le popup zone si clic ailleurs
    var popup = document.getElementById('zone-popup');
    if (popup.style.display === 'block') {
        // Verifier si le clic est dans le popup
        var rect = popup.getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX <= rect.right &&
            ev.clientY >= rect.top && ev.clientY <= rect.bottom) return;
        popup.style.display = 'none';
    }

    // Raycaster sur le sol
    var mouse = new THREE.Vector2(
        (ev.clientX / window.innerWidth) * 2 - 1,
        -(ev.clientY / window.innerHeight) * 2 + 1
    );
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, sceneManager.camera);
    var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    var pt = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, pt);
    if (!pt) return;

    // D'abord : verifier si le clic est sur un trait (pour supprimer)
    var traitTouche = _trouverTraitAuPoint(pt.x, pt.z);
    if (traitTouche) {
        // Afficher mini-menu : supprimer ce trait ?
        var ctxM = document.getElementById('ctx-trait-menu');
        ctxTrait = traitTouche;
        ctxM.style.display = 'block';
        ctxM.style.left = ev.clientX + 'px';
        ctxM.style.top = ev.clientY + 'px';
        return;
    }

    // Sinon : trouver la piece sous le clic
    var piece = _trouverPieceAuPoint(pt.x, pt.z);
    if (piece) {
        _afficherPopupZone(piece, ev.clientX, ev.clientY);
    }
});

// Fermer popup zone au clic sur Echap
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        var popup = document.getElementById('zone-popup');
        if (popup && popup.style.display === 'block') {
            popup.style.display = 'none';
        }
    }
});

// Bouton Appliquer zone (nom + couleur libres)
document.getElementById('zone-appliquer-btn').addEventListener('click', function() {
    if (!_popupZonePiece) return;
    var nom = document.getElementById('zone-nom-input').value.trim();
    var couleur = document.getElementById('zone-couleur-input').value;
    if (!nom) { document.getElementById('zone-nom-input').focus(); return; }
    _assignerZone(_popupZonePiece, nom, couleur);
});

// Bouton Retirer zone
document.getElementById('zone-retirer-btn').addEventListener('click', function() {
    if (!_popupZonePiece) return;
    _retirerZone(_popupZonePiece);
});

// Entree dans le champ nom = appliquer
document.getElementById('zone-nom-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('zone-appliquer-btn').click();
    }
    e.stopPropagation(); // ne pas propager les touches au reste de l'app
});

// Le color picker met a jour la piece en temps reel
document.getElementById('zone-couleur-input').addEventListener('input', function() {
    if (!_popupZonePiece) return;
    var couleur = this.value;
    _previewCouleurPiece(_popupZonePiece, couleur);
});

// Rafraichir les pieces fermees apres chaque sauvegarderEtat
var _origSauvegarder = editeur.sauvegarderEtat.bind(editeur);
editeur.sauvegarderEtat = function() {
    _origSauvegarder();
    // Toujours rafraichir si le mode zones est actif OU s'il y a des zones assignees
    if (modeZones || piecesZones.length > 0) {
        setTimeout(function() {
            _afficherPiecesFermees();
            if (modeZones) _mettreAJourPanelZones();
        }, 100);
    }
};

// ========================================
// PLATEAU
// ========================================

// Recentrer la camera sur le centre de la construction
// ========================================
// VISIBILITE DES ELEMENTS
// ========================================

document.getElementById('btn-visibilite').addEventListener('click', function() {
    var popup = document.getElementById('visibilite-popup');
    if (popup.style.display === 'block') { popup.style.display = 'none'; return; }
    _visGenererListe();
    popup.style.display = 'block';
});

function _visCollecterCategories() {
    var cats = [];

    // Murs
    var mursItems = [];
    for (var i = 0; i < editeur.elements.length; i++) {
        var el = editeur.elements[i];
        var grp = el.group || (el.brique ? el.brique.group : null);
        if (grp) mursItems.push({ nom: el.params.nom || ('Mur ' + (i + 1)), ref: grp, ref2: (el.brique2 && el.brique2.group) ? el.brique2.group : null });
    }
    cats.push({ id: 'murs', nom: 'Murs / Briques', couleur: '#8B4513', items: mursItems });

    // Portes
    var portesItems = [];
    var fenetresItems = [];
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var ex = editeur.exclusions[i];
        if (!ex.group3D) continue;
        var isPorte = ex._type === 'porte' || (ex.group3D.userData && ex.group3D.userData.porteCreation);
        if (isPorte) {
            var pc = ex.group3D.userData.porteCreation;
            portesItems.push({ nom: (pc ? pc.modeleId : 'Porte') + ' #' + (portesItems.length + 1), ref: ex.group3D });
        } else {
            var fc = ex.group3D.userData.fenetreCreation;
            fenetresItems.push({ nom: (fc ? fc.modeleId : 'Fenetre') + ' #' + (fenetresItems.length + 1), ref: ex.group3D });
        }
    }
    cats.push({ id: 'portes', nom: 'Portes', couleur: '#D2691E', items: portesItems });
    cats.push({ id: 'fenetres', nom: 'Fenetres', couleur: '#5bb8f0', items: fenetresItems });

    // Placos
    var placosItems = [];
    for (var i = 0; i < placoElements.length; i++) {
        var pi = placoElements[i].userData.placoInfo;
        placosItems.push({ nom: 'Placo #' + (i + 1) + (pi ? ' (' + pi.largeur.toFixed(1) + 'x' + pi.hauteur.toFixed(1) + ')' : ''), ref: placoElements[i] });
    }
    cats.push({ id: 'placos', nom: 'Placos', couleur: '#C8C0B8', items: placosItems });

    // Laines
    var lainesItems = [];
    for (var i = 0; i < laineElements.length; i++) lainesItems.push({ nom: 'Laine #' + (i + 1), ref: laineElements[i] });
    cats.push({ id: 'laines', nom: 'Laines', couleur: '#F2D544', items: lainesItems });

    // Plinthes
    var plinthesItems = [];
    for (var i = 0; i < plinthElements.length; i++) plinthesItems.push({ nom: 'Plinthe #' + (i + 1), ref: plinthElements[i] });
    cats.push({ id: 'plinthes', nom: 'Plinthes', couleur: '#A0764E', items: plinthesItems });

    // Carrelages
    var carrItems = [];
    for (var i = 0; i < carrelageElements.length; i++) carrItems.push({ nom: 'Carrelage #' + (i + 1), ref: carrelageElements[i] });
    cats.push({ id: 'carrelages', nom: 'Carrelages', couleur: '#C8C0B0', items: carrItems });

    // Papiers peints
    var ppItems = [];
    for (var i = 0; i < ppElements.length; i++) ppItems.push({ nom: 'Papier peint #' + (i + 1), ref: ppElements[i] });
    cats.push({ id: 'papiers-peints', nom: 'Papiers peints', couleur: '#D8C8B0', items: ppItems });

    // Carrelage sol
    var csItems = [];
    for (var i = 0; i < carrelageSolElements.length; i++) csItems.push({ nom: 'Sol #' + (i + 1), ref: carrelageSolElements[i] });
    cats.push({ id: 'carrelages-sol', nom: 'Carrelages sol', couleur: '#A09080', items: csItems });

    // Personnages
    var persItems = [];
    sceneManager.scene.traverse(function(c) {
        if (c.userData && c.userData.isPersonnage && c.parent === sceneManager.scene) {
            persItems.push({ nom: 'Personnage #' + (persItems.length + 1), ref: c });
        }
    });
    cats.push({ id: 'persos', nom: 'Personnages', couleur: '#2196F3', items: persItems });

    // Escaliers
    var escItems = [];
    for (var i = 0; i < escalierElements.length; i++) {
        var ec = escalierElements[i].userData.escalierCreation;
        escItems.push({ nom: (ec ? ec.modeleId : 'Escalier') + ' #' + (i + 1), ref: escalierElements[i] });
    }
    cats.push({ id: 'escaliers', nom: 'Escaliers', couleur: '#A0522D', items: escItems });

    // Plafonds
    var plafItems = [];
    for (var i = 0; i < plafondElements.length; i++) {
        var pc = plafondElements[i].userData.plafondCreation;
        plafItems.push({ nom: 'Plafond #' + (i + 1) + (pc ? ' (h' + pc.hauteur.toFixed(1) + 'm)' : ''), ref: plafondElements[i] });
    }
    cats.push({ id: 'plafonds', nom: 'Plafonds', couleur: '#B0A090', items: plafItems });

    return cats;
}

// ========================================
// FILTRAGE PAR ETAGE (base sur les plafonds)
// ========================================

// Recuperer la hauteur Y de base d'un element (a quel etage il appartient)
function _getElementY(ref, type) {
    // Murs : position Y du mur
    if (type === 'murs') {
        for (var i = 0; i < editeur.elements.length; i++) {
            var grp = editeur.elements[i].group || (editeur.elements[i].brique ? editeur.elements[i].brique.group : null);
            if (grp === ref) return editeur.elements[i].params.y || 0;
        }
        return 0;
    }
    // Portes/fenetres : position Y
    if (type === 'portes' || type === 'fenetres') return ref.position ? ref.position.y : 0;
    // Placos
    if (type === 'placos') { var pi = ref.userData && ref.userData.placoInfo; return pi ? pi.y : 0; }
    // Laines
    if (type === 'laines') { var li = ref.userData && ref.userData.laineInfo; return li ? li.y : 0; }
    // Plinthes, carrelages, papier peints : lies a un placo, meme Y
    if (type === 'plinthes') { var pk = ref.userData && ref.userData.plinthInfo; return pk ? (pk.y || 0) : 0; }
    if (type === 'carrelages') { var ck = ref.userData && ref.userData.carrelageInfo; return ck ? (ck.y || 0) : 0; }
    if (type === 'papiers-peints') { var ppk = ref.userData && ref.userData.papierPeintInfo; return ppk ? (ppk.y || 0) : 0; }
    // Carrelage sol : toujours au sol de l'etage
    if (type === 'carrelages-sol') return 0;
    // Personnages : au sol
    if (type === 'persos') return 0;
    // Escaliers : partent du sol
    if (type === 'escaliers') return 0;
    // Plafonds : valeur speciale, gere separement dans _visAppliquerEtages
    if (type === 'plafonds') return -2;
    return 0;
}

function _visGenererEtages() {
    var container = document.getElementById('vis-etages');

    // Collecter les hauteurs uniques des plafonds
    var hauteurs = [];
    for (var i = 0; i < plafondElements.length; i++) {
        var pc = plafondElements[i].userData.plafondCreation;
        if (pc) {
            var h = pc.hauteur;
            var existe = false;
            for (var j = 0; j < hauteurs.length; j++) {
                if (Math.abs(hauteurs[j] - h) < 0.05) { existe = true; break; }
            }
            if (!existe) hauteurs.push(h);
        }
    }

    if (hauteurs.length === 0) {
        container.style.display = 'none';
        return;
    }

    // Trier par hauteur
    hauteurs.sort(function(a, b) { return a - b; });

    // Creer les etages : RDC (0 -> h1), Etage 1 (h1 -> h2), etc.
    var etages = [];
    etages.push({ nom: 'RDC', min: 0, max: hauteurs[0], hauteur: hauteurs[0] });
    for (var i = 1; i < hauteurs.length; i++) {
        etages.push({ nom: 'Etage ' + i, min: hauteurs[i - 1], max: hauteurs[i], hauteur: hauteurs[i] });
    }
    // Etage au-dessus du dernier plafond
    etages.push({ nom: 'Etage ' + hauteurs.length, min: hauteurs[hauteurs.length - 1], max: 999, hauteur: 999 });

    // Stocker pour le filtrage
    window._visEtages = etages;

    var html = '<div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">';
    html += '<svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="1" width="14" height="5" rx="1" fill="#B0A090"/><rect x="1" y="8" width="14" height="5" rx="1" fill="#8B8070"/></svg>';
    html += '<span style="color:#B0A090; font-size:11px; font-weight:bold;">Etages</span>';
    html += '</div>';

    var couleurs = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4'];
    for (var i = 0; i < etages.length; i++) {
        var et = etages[i];
        var col = couleurs[i % couleurs.length];
        var hTxt = et.max < 999 ? '0 — ' + et.max.toFixed(2) + 'm' : '> ' + et.min.toFixed(2) + 'm';
        if (i > 0 && et.max < 999) hTxt = et.min.toFixed(2) + ' — ' + et.max.toFixed(2) + 'm';

        html += '<div style="display:flex; align-items:center; gap:6px; padding:2px 0;">';
        html += '<input type="checkbox" class="vis-etage-cb" data-idx="' + i + '" checked style="accent-color:' + col + '; width:14px; height:14px;">';
        html += '<span style="color:' + col + '; font-size:11px; font-weight:bold;">' + et.nom + '</span>';
        html += '<span style="color:#666; font-size:9px; flex:1; text-align:right;">' + hTxt + '</span>';
        html += '<button class="vis-etage-solo" data-idx="' + i + '" title="Voir uniquement cet etage" style="padding:1px 5px; background:' + col + '22; color:' + col + '; border:1px solid ' + col + '55; border-radius:3px; cursor:pointer; font-family:monospace; font-size:8px;">SOLO</button>';
        html += '</div>';
    }

    // Bouton tout voir
    html += '<div style="margin-top:3px;">';
    html += '<button class="vis-etage-tout" style="width:100%; padding:3px; background:#16213e; color:#43B047; border:1px solid #43B047; border-radius:3px; cursor:pointer; font-family:monospace; font-size:9px;">Tous les etages</button>';
    html += '</div>';

    container.innerHTML = html;
    container.style.display = 'block';
}

// Plans de coupe pour le filtrage par etage
var _clipPlaneHaut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 999);
var _clipPlaneBas = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var _clipPlanes = [_clipPlaneHaut, _clipPlaneBas];
var _clipActif = false;
var _clipMinY = -999;
var _clipMaxY = 999;

// Filtrer les resultats de raycasting pour ignorer les points hors zone visible
function _filtrerIntersections(intersects) {
    if (!_clipActif) return intersects;
    var result = [];
    for (var i = 0; i < intersects.length; i++) {
        var py = intersects[i].point.y;
        if (py >= _clipMinY && py <= _clipMaxY) {
            result.push(intersects[i]);
        }
    }
    return result;
}

function _appliquerClipSurScene(actif) {
    if (_clipActif === actif && actif === false) return;
    _clipActif = actif;
    var planes = actif ? _clipPlanes : [];
    sceneManager.scene.traverse(function(child) {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                for (var m = 0; m < child.material.length; m++) {
                    child.material[m].clippingPlanes = planes;
                    child.material[m].clipShadows = true;
                    child.material[m].needsUpdate = true;
                }
            } else {
                child.material.clippingPlanes = planes;
                child.material.clipShadows = true;
                child.material.needsUpdate = true;
            }
        }
    });
}

function _visAppliquerEtages() {
    var etages = window._visEtages;
    if (!etages) return;

    var cbs = document.querySelectorAll('.vis-etage-cb');
    var etagesVisibles = [];
    var tousCoches = true;
    var minH = 999, maxH = 0;

    for (var i = 0; i < cbs.length; i++) {
        var idx = parseInt(cbs[i].getAttribute('data-idx'));
        if (cbs[i].checked) {
            etagesVisibles.push(idx);
            if (etages[idx].min < minH) minH = etages[idx].min;
            if (etages[idx].max > maxH) maxH = etages[idx].max;
        } else {
            tousCoches = false;
        }
    }

    // Appliquer le clipping (coupe les murs aux bonnes hauteurs)
    if (tousCoches || etagesVisibles.length === 0) {
        _appliquerClipSurScene(false);
        _clipMinY = -999;
        _clipMaxY = 999;
    } else {
        // Haut : couper 10cm en-dessous du plafond pour ne pas voir la dalle
        var _clipTop = (maxH >= 999) ? 999 : maxH - 0.10;
        var _clipBot = (minH <= 0.01) ? -0.01 : minH;
        _clipPlaneHaut.constant = _clipTop;
        _clipPlaneBas.constant = (minH <= 0.01) ? 999 : -minH;
        _clipMinY = _clipBot;
        _clipMaxY = _clipTop;
        _appliquerClipSurScene(true);
    }

    // Visibilite des plafonds (logique speciale : visible si etage dessous OU dessus coche)
    var cats = window._visCats;
    if (!cats) return;
    for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        if (cat.id !== 'plafonds') continue;
        for (var j = 0; j < cat.items.length; j++) {
            var it = cat.items[j];
            var pc = it.ref.userData && it.ref.userData.plafondCreation;
            if (!pc) continue;
            var ph = pc.hauteur;
            var etageBas = -1, etageHaut = -1;
            for (var e = 0; e < etages.length; e++) {
                if (Math.abs(etages[e].max - ph) < 0.05) etageBas = e;
                if (Math.abs(etages[e].min - ph) < 0.05) etageHaut = e;
            }
            if (tousCoches) {
                it.ref.visible = true;
            } else {
                var vis = false;
                for (var v = 0; v < etagesVisibles.length; v++) {
                    if (etagesVisibles[v] === etageBas || etagesVisibles[v] === etageHaut) { vis = true; break; }
                }
                it.ref.visible = vis;
            }
        }
    }

    // Visibilite des elements au sol (personnages, carrelage sol, escaliers) — masquer si leur etage n'est pas coche
    for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        if (cat.id === 'plafonds') continue;
        for (var j = 0; j < cat.items.length; j++) {
            var it = cat.items[j];
            var y = _getElementY(it.ref, cat.id);
            if (y < 0) continue;
            var etageIdx = -1;
            for (var e = 0; e < etages.length; e++) {
                if (y >= etages[e].min && y < etages[e].max) { etageIdx = e; break; }
            }
            if (etageIdx === -1) continue;
            var visible = tousCoches;
            if (!tousCoches) {
                for (var v = 0; v < etagesVisibles.length; v++) {
                    if (etagesVisibles[v] === etageIdx) { visible = true; break; }
                }
            }
            it.ref.visible = visible;
            if (it.ref2) it.ref2.visible = visible;
        }
    }

    _visGenererListeSansEtages();
}

function _visGenererListeSansEtages() {
    var cats = _visCollecterCategories();
    var html = '';
    for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        var allVis = true;
        for (var j = 0; j < cat.items.length; j++) {
            if (!cat.items[j].ref.visible) allVis = false;
        }
        if (cat.items.length === 0) allVis = true;
        var catChecked = allVis ? ' checked' : '';
        html += '<div class="vis-cat" data-cat="' + cat.id + '">';
        html += '<div style="display:flex; align-items:center; gap:6px; padding:3px 0; cursor:pointer;" class="vis-cat-header">';
        html += '<input type="checkbox" class="vis-cat-cb" data-cat="' + cat.id + '"' + catChecked + ' style="accent-color:' + cat.couleur + '; width:14px; height:14px;">';
        html += '<span style="color:' + cat.couleur + '; font-size:11px; font-weight:bold; flex:1;">' + cat.nom + '</span>';
        html += '<span style="color:#888; font-size:9px; margin-right:2px;">' + cat.items.length + '</span>';
        if (cat.items.length > 0) html += '<span class="vis-cat-arrow" style="color:#666; font-size:9px;">&#9660;</span>';
        html += '</div>';
        if (cat.items.length > 0) {
            html += '<div class="vis-cat-list" data-cat="' + cat.id + '" style="display:none; padding-left:22px; border-left:2px solid ' + cat.couleur + '33; margin-left:7px;">';
            for (var j = 0; j < cat.items.length; j++) {
                var it = cat.items[j];
                var itChecked = it.ref.visible !== false ? ' checked' : '';
                html += '<label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:#aaa; font-size:10px; padding:2px 0;">';
                html += '<input type="checkbox" class="vis-item-cb" data-cat="' + cat.id + '" data-idx="' + j + '"' + itChecked + ' style="accent-color:' + cat.couleur + '; width:12px; height:12px;">';
                html += it.nom + '</label>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    document.getElementById('vis-liste').innerHTML = html;
    window._visCats = cats;
}

function _visGenererListe() {
    var cats = _visCollecterCategories();
    _visGenererEtages();
    var html = '';
    for (var c = 0; c < cats.length; c++) {
        var cat = cats[c];
        var allVis = true, anyVis = false;
        for (var j = 0; j < cat.items.length; j++) {
            if (cat.items[j].ref.visible) anyVis = true; else allVis = false;
        }
        if (cat.items.length === 0) { allVis = true; anyVis = true; }
        var catChecked = allVis ? ' checked' : '';

        // Categorie (checkbox + nom + fleche deplier)
        html += '<div class="vis-cat" data-cat="' + cat.id + '">';
        html += '<div style="display:flex; align-items:center; gap:6px; padding:3px 0; cursor:pointer;" class="vis-cat-header">';
        html += '<input type="checkbox" class="vis-cat-cb" data-cat="' + cat.id + '"' + catChecked + ' style="accent-color:' + cat.couleur + '; width:14px; height:14px;">';
        html += '<span style="color:' + cat.couleur + '; font-size:11px; font-weight:bold; flex:1;">' + cat.nom + '</span>';
        html += '<span style="color:#888; font-size:9px; margin-right:2px;">' + cat.items.length + '</span>';
        if (cat.items.length > 0) html += '<span class="vis-cat-arrow" style="color:#666; font-size:9px; transition:transform 0.15s;">&#9660;</span>';
        html += '</div>';

        // Sous-elements (caches par defaut)
        if (cat.items.length > 0) {
            html += '<div class="vis-cat-list" data-cat="' + cat.id + '" style="display:none; padding-left:22px; border-left:2px solid ' + cat.couleur + '33; margin-left:7px;">';
            for (var j = 0; j < cat.items.length; j++) {
                var it = cat.items[j];
                var itChecked = it.ref.visible !== false ? ' checked' : '';
                html += '<label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:#aaa; font-size:10px; padding:2px 0;">';
                html += '<input type="checkbox" class="vis-item-cb" data-cat="' + cat.id + '" data-idx="' + j + '"' + itChecked + ' style="accent-color:' + cat.couleur + '; width:12px; height:12px;">';
                html += it.nom;
                html += '</label>';
            }
            html += '</div>';
        }
        html += '</div>';
    }
    document.getElementById('vis-liste').innerHTML = html;

    // Stocker la ref pour retrouver les elements
    window._visCats = cats;
}

// Deleguer les clics sur la liste
document.getElementById('vis-liste').addEventListener('click', function(ev) {
    // Deplier/replier categorie
    var header = ev.target.closest('.vis-cat-header');
    if (header && !ev.target.classList.contains('vis-cat-cb')) {
        var catId = header.parentElement.getAttribute('data-cat');
        var list = document.querySelector('.vis-cat-list[data-cat="' + catId + '"]');
        if (list) {
            var visible = list.style.display !== 'none';
            list.style.display = visible ? 'none' : 'block';
            var arrow = header.querySelector('.vis-cat-arrow');
            if (arrow) arrow.style.transform = visible ? '' : 'rotate(-90deg)';
        }
        return;
    }
});

// Checkbox categorie : toggle tous les elements de la categorie
document.getElementById('vis-liste').addEventListener('change', function(ev) {
    var cats = window._visCats;
    if (!cats) return;

    // Checkbox categorie
    if (ev.target.classList.contains('vis-cat-cb')) {
        var catId = ev.target.getAttribute('data-cat');
        var checked = ev.target.checked;
        // Trouver la categorie
        for (var c = 0; c < cats.length; c++) {
            if (cats[c].id === catId) {
                for (var j = 0; j < cats[c].items.length; j++) {
                    cats[c].items[j].ref.visible = checked;
                    if (cats[c].items[j].ref2) cats[c].items[j].ref2.visible = checked;
                }
                break;
            }
        }
        // Mettre a jour les sous-checkboxes
        var subs = document.querySelectorAll('.vis-item-cb[data-cat="' + catId + '"]');
        for (var i = 0; i < subs.length; i++) subs[i].checked = checked;
        return;
    }

    // Checkbox element individuel
    if (ev.target.classList.contains('vis-item-cb')) {
        var catId = ev.target.getAttribute('data-cat');
        var idx = parseInt(ev.target.getAttribute('data-idx'));
        var checked = ev.target.checked;
        for (var c = 0; c < cats.length; c++) {
            if (cats[c].id === catId && cats[c].items[idx]) {
                cats[c].items[idx].ref.visible = checked;
                if (cats[c].items[idx].ref2) cats[c].items[idx].ref2.visible = checked;
                break;
            }
        }
        // Mettre a jour la checkbox categorie
        var allChecked = true;
        var subs = document.querySelectorAll('.vis-item-cb[data-cat="' + catId + '"]');
        for (var i = 0; i < subs.length; i++) { if (!subs[i].checked) { allChecked = false; break; } }
        var catCb = document.querySelector('.vis-cat-cb[data-cat="' + catId + '"]');
        if (catCb) catCb.checked = allChecked;
        return;
    }
});

document.getElementById('vis-tout').addEventListener('click', function() {
    var cats = window._visCats;
    if (!cats) return;
    for (var c = 0; c < cats.length; c++) {
        for (var j = 0; j < cats[c].items.length; j++) {
            cats[c].items[j].ref.visible = true;
            if (cats[c].items[j].ref2) cats[c].items[j].ref2.visible = true;
        }
    }
    _visGenererListe();
});

document.getElementById('vis-rien').addEventListener('click', function() {
    var cats = window._visCats;
    if (!cats) return;
    for (var c = 0; c < cats.length; c++) {
        for (var j = 0; j < cats[c].items.length; j++) {
            cats[c].items[j].ref.visible = false;
            if (cats[c].items[j].ref2) cats[c].items[j].ref2.visible = false;
        }
    }
    _visGenererListe();
});

// Deleguer les clics/change sur le panneau etages
document.getElementById('vis-etages').addEventListener('change', function(ev) {
    if (ev.target.classList.contains('vis-etage-cb')) {
        _visAppliquerEtages();
    }
});

document.getElementById('vis-etages').addEventListener('click', function(ev) {
    // Bouton "Tous etages"
    if (ev.target.classList.contains('vis-etage-tout')) {
        var cbs = document.querySelectorAll('.vis-etage-cb');
        for (var i = 0; i < cbs.length; i++) cbs[i].checked = true;
        _visAppliquerEtages();
        return;
    }
    // Bouton "SOLO" — voir uniquement cet etage
    if (ev.target.classList.contains('vis-etage-solo')) {
        var idx = parseInt(ev.target.getAttribute('data-idx'));
        var cbs = document.querySelectorAll('.vis-etage-cb');
        for (var i = 0; i < cbs.length; i++) cbs[i].checked = (i === idx);
        _visAppliquerEtages();
        return;
    }
});

// ========================================
// ========================================
// PLAN 2D DETAILLE
// ========================================

document.getElementById('btn-plan').addEventListener('click', function() {
    _dessinerPlan2D();
    document.getElementById('plan-overlay').style.display = 'block';
});

document.getElementById('plan-close').addEventListener('click', function() {
    document.getElementById('plan-overlay').style.display = 'none';
});

document.getElementById('plan-export-png').addEventListener('click', function() {
    var canvas = document.getElementById('plan-canvas');
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'plan-2d.png';
    a.click();
});

function _dessinerPlan2D() {
    var canvas = document.getElementById('plan-canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 40;
    var W = canvas.width, H = canvas.height;

    // Collecter tous les segments pour trouver les limites
    var allSegs = [];
    var allExcl = [];
    for (var i = 0; i < editeur.elements.length; i++) {
        var el = editeur.elements[i];
        var segs = editeur._segments(el.params);
        var bt = BRIQUES_TYPES[el.params.briqueType] || BRIQUES_TYPES.standard;
        for (var s = 0; s < segs.length; s++) {
            allSegs.push({ seg: segs[s], ep: bt.epaisseur, params: el.params });
        }
    }
    for (var i = 0; i < editeur.exclusions.length; i++) {
        allExcl.push(editeur.exclusions[i]);
    }

    // Limites
    var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (var i = 0; i < allSegs.length; i++) {
        var sg = allSegs[i].seg;
        minX = Math.min(minX, sg.x1, sg.x2);
        maxX = Math.max(maxX, sg.x1, sg.x2);
        minZ = Math.min(minZ, sg.z1, sg.z2);
        maxZ = Math.max(maxZ, sg.z1, sg.z2);
    }
    if (allSegs.length === 0) { minX = -5; maxX = 5; minZ = -5; maxZ = 5; }

    // Marge
    var marge = 2;
    minX -= marge; maxX += marge; minZ -= marge; maxZ += marge;

    // Echelle
    var scaleX = W / (maxX - minX);
    var scaleZ = H / (maxZ - minZ);
    var scale = Math.min(scaleX, scaleZ) * 0.85;
    var offX = W / 2 - (minX + maxX) / 2 * scale;
    var offZ = H / 2 - (minZ + maxZ) / 2 * scale;

    function toX(x) { return x * scale + offX; }
    function toZ(z) { return z * scale + offZ; }

    // Fond
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    // Grille legere
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    var gridStep = 1;
    for (var gx = Math.floor(minX); gx <= Math.ceil(maxX); gx += gridStep) {
        ctx.beginPath(); ctx.moveTo(toX(gx), 0); ctx.lineTo(toX(gx), H); ctx.stroke();
    }
    for (var gz = Math.floor(minZ); gz <= Math.ceil(maxZ); gz += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, toZ(gz)); ctx.lineTo(W, toZ(gz)); ctx.stroke();
    }

    // Zones colorees (pieces fermees)
    var pieces = editeur.detecterPiecesFermees();
    for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        var zone = null;
        for (var j = 0; j < piecesZones.length; j++) {
            var dx = piecesZones[j].centre.x - p.centre.x;
            var dz = piecesZones[j].centre.z - p.centre.z;
            if (Math.sqrt(dx * dx + dz * dz) < 0.5) { zone = piecesZones[j]; break; }
        }
        // Remplir la zone
        ctx.beginPath();
        ctx.moveTo(toX(p.points[0].x), toZ(p.points[0].z));
        for (var j = 1; j < p.points.length; j++) {
            ctx.lineTo(toX(p.points[j].x), toZ(p.points[j].z));
        }
        ctx.closePath();
        ctx.fillStyle = zone ? zone.couleur + '20' : '#f5f5f5';
        ctx.fill();

        // Label de zone
        var label = zone ? zone.nom : '';
        var surface = p.aire.toFixed(1) + ' m²';
        ctx.fillStyle = zone ? zone.couleur : '#999';
        ctx.font = 'bold ' + Math.max(10, Math.min(16, scale * 0.6)) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (label) ctx.fillText(label, toX(p.centre.x), toZ(p.centre.z) - scale * 0.3);
        ctx.font = Math.max(8, Math.min(12, scale * 0.4)) + 'px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText(surface, toX(p.centre.x), toZ(p.centre.z) + scale * 0.2);
    }

    // Murs (lignes epaisses avec epaisseur reelle)
    for (var i = 0; i < allSegs.length; i++) {
        var sg = allSegs[i].seg;
        var ep = allSegs[i].ep;
        var dx = sg.x2 - sg.x1, dz = sg.z2 - sg.z1;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.01) continue;
        var nx = -dz / len, nz = dx / len;
        var hw = ep / 2; // demi-epaisseur

        // Rectangle du mur
        ctx.beginPath();
        ctx.moveTo(toX(sg.x1 + nx * hw), toZ(sg.z1 + nz * hw));
        ctx.lineTo(toX(sg.x2 + nx * hw), toZ(sg.z2 + nz * hw));
        ctx.lineTo(toX(sg.x2 - nx * hw), toZ(sg.z2 - nz * hw));
        ctx.lineTo(toX(sg.x1 - nx * hw), toZ(sg.z1 - nz * hw));
        ctx.closePath();
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Cote (dimension) au dessus du mur
        var mx = (sg.x1 + sg.x2) / 2, mz = (sg.z1 + sg.z2) / 2;
        ctx.save();
        ctx.translate(toX(mx), toZ(mz));
        var angle = Math.atan2(dz, dx);
        ctx.rotate(angle);
        ctx.fillStyle = '#e94560';
        ctx.font = Math.max(8, Math.min(11, scale * 0.35)) + 'px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(len.toFixed(2) + 'm', 0, -ep * scale / 2 - 3);
        ctx.restore();
    }

    // Portes (interruption dans le mur + arc d'ouverture)
    for (var i = 0; i < allExcl.length; i++) {
        var ex = allExcl[i];
        var isPorte = ex._type === 'porte';
        var rad = (ex.angle || 0) * Math.PI / 180;
        var cosA = Math.cos(rad), sinA = Math.sin(rad);
        var hw = ex.largeur / 2;

        // Points extremes de l'ouverture
        var x1 = ex.x - cosA * hw, z1 = ex.z - sinA * hw;
        var x2 = ex.x + cosA * hw, z2 = ex.z + sinA * hw;

        // Effacer le mur a cet endroit (rectangle blanc)
        var nx = -sinA, nz = cosA;
        ctx.beginPath();
        ctx.moveTo(toX(x1 + nx * 0.15), toZ(z1 + nz * 0.15));
        ctx.lineTo(toX(x2 + nx * 0.15), toZ(z2 + nz * 0.15));
        ctx.lineTo(toX(x2 - nx * 0.15), toZ(z2 - nz * 0.15));
        ctx.lineTo(toX(x1 - nx * 0.15), toZ(z1 - nz * 0.15));
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();

        if (isPorte && ex.y < 0.01) {
            // Porte au sol : arc d'ouverture (quart de cercle)
            ctx.beginPath();
            ctx.moveTo(toX(x1), toZ(z1));
            var arcR = ex.largeur * scale;
            var startA = Math.atan2(toZ(z2) - toZ(z1), toX(x2) - toX(x1));
            ctx.arc(toX(x1), toZ(z1), arcR, startA, startA - Math.PI / 2, true);
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Ligne de la porte ouverte
            ctx.beginPath();
            ctx.moveTo(toX(x1), toZ(z1));
            var ouvX = x1 - sinA * ex.largeur, ouvZ = z1 + cosA * ex.largeur;
            ctx.lineTo(toX(ouvX), toZ(ouvZ));
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 2]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Traits de cadre
            ctx.beginPath();
            ctx.moveTo(toX(x1), toZ(z1));
            ctx.lineTo(toX(x2), toZ(z2));
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Fenetre : double trait
            ctx.beginPath();
            ctx.moveTo(toX(x1), toZ(z1));
            ctx.lineTo(toX(x2), toZ(z2));
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 3;
            ctx.stroke();
            // Croisillon
            var midX = (x1 + x2) / 2, midZ = (z1 + z2) / 2;
            ctx.beginPath();
            ctx.moveTo(toX(midX + nx * 0.06), toZ(midZ + nz * 0.06));
            ctx.lineTo(toX(midX - nx * 0.06), toZ(midZ - nz * 0.06));
            ctx.strokeStyle = '#4a9eff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // Echelle en bas a gauche
    var echLen = 1; // 1 metre
    var echPx = echLen * scale;
    var echX = 30, echY = H - 30;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(echX, echY); ctx.lineTo(echX + echPx, echY);
    ctx.moveTo(echX, echY - 5); ctx.lineTo(echX, echY + 5);
    ctx.moveTo(echX + echPx, echY - 5); ctx.lineTo(echX + echPx, echY + 5);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1m', echX + echPx / 2, echY - 8);

    // Nord en haut a droite
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', W - 30, 25);
    ctx.beginPath();
    ctx.moveTo(W - 30, 30); ctx.lineTo(W - 34, 42); ctx.lineTo(W - 26, 42);
    ctx.closePath();
    ctx.fillStyle = '#e94560';
    ctx.fill();

    // Titre
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PLAN - ELEEC APP', 20, 20);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(new Date().toLocaleDateString('fr-FR'), 20, 34);
    ctx.fillText(editeur.elements.length + ' murs | ' + allExcl.length + ' ouvertures | ' + pieces.length + ' pieces', 20, 46);
}

// VUE 2D / 3D
// ========================================
var _vue2D = false;
var _camera3D = null; // sauvegarde camera perspective
var _cameraOrtho = null;

document.getElementById('btn-vue2d').addEventListener('click', function() {
    _vue2D = !_vue2D;
    var btn = document.getElementById('btn-vue2d');

    if (_vue2D) {
        // Sauvegarder la position 3D
        _camera3D = {
            px: sceneManager.camera.position.x, py: sceneManager.camera.position.y, pz: sceneManager.camera.position.z,
            tx: sceneManager.controls.target.x, ty: sceneManager.controls.target.y, tz: sceneManager.controls.target.z
        };

        // Calculer le centre de la construction
        var cx = 0, cz = 0, nb = 0;
        for (var i = 0; i < editeur.elements.length; i++) {
            var segs = editeur._segments(editeur.elements[i].params);
            for (var s = 0; s < segs.length; s++) {
                cx += (segs[s].x1 + segs[s].x2) / 2;
                cz += (segs[s].z1 + segs[s].z2) / 2;
                nb++;
            }
        }
        if (nb > 0) { cx /= nb; cz /= nb; }

        // Creer camera orthographique
        var aspect = window.innerWidth / window.innerHeight;
        var size = 15; // taille de vue en metres
        _cameraOrtho = new THREE.OrthographicCamera(
            -size * aspect, size * aspect, size, -size, 0.1, 200
        );
        _cameraOrtho.position.set(cx, 50, cz);
        _cameraOrtho.lookAt(cx, 0, cz);
        _cameraOrtho.up.set(0, 0, -1); // Nord en haut

        // Switcher
        sceneManager.camera = _cameraOrtho;
        sceneManager.controls.object = _cameraOrtho;
        sceneManager.controls.target.set(cx, 0, cz);
        sceneManager.controls.enableRotate = false; // pas de rotation en 2D
        sceneManager.controls.enableZoom = true;
        sceneManager.controls.update();

        // Style bouton
        btn.style.borderColor = '#4a9eff';
        btn.classList.add('actif');
        btn.querySelector('text').textContent = '3D';
        btn.querySelector('text').setAttribute('fill', '#43B047');

        document.getElementById('info-bar').textContent = 'VUE 2D — Molette = zoom | Clic milieu = deplacer | Clic bouton = retour 3D';
    } else {
        // Revenir en 3D
        sceneManager.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        if (_camera3D) {
            sceneManager.camera.position.set(_camera3D.px, _camera3D.py, _camera3D.pz);
        } else {
            sceneManager.camera.position.set(8, 6, 12);
        }

        sceneManager.controls.object = sceneManager.camera;
        if (_camera3D) {
            sceneManager.controls.target.set(_camera3D.tx, _camera3D.ty, _camera3D.tz);
        }
        sceneManager.controls.enableRotate = true;
        sceneManager.controls.enableZoom = false; // on gere nous-memes
        sceneManager.controls.update();

        btn.style.borderColor = '';
        btn.classList.remove('actif');
        btn.querySelector('text').textContent = '2D';
        btn.querySelector('text').setAttribute('fill', '#4a9eff');

        document.getElementById('info-bar').textContent = 'Vue 3D';
    }
});

// Gerer le resize en mode 2D
window.addEventListener('resize', function() {
    if (_vue2D && _cameraOrtho) {
        var aspect = window.innerWidth / window.innerHeight;
        var size = 15;
        _cameraOrtho.left = -size * aspect;
        _cameraOrtho.right = size * aspect;
        _cameraOrtho.top = size;
        _cameraOrtho.bottom = -size;
        _cameraOrtho.updateProjectionMatrix();
    }
});

document.getElementById('btn-recentrer').addEventListener('click', function() {
    // Calculer le centre de tous les murs
    var cx = 0, cz = 0, nb = 0;
    for (var i = 0; i < editeur.elements.length; i++) {
        var segs = editeur._segments(editeur.elements[i].params);
        for (var s = 0; s < segs.length; s++) {
            cx += (segs[s].x1 + segs[s].x2) / 2;
            cz += (segs[s].z1 + segs[s].z2) / 2;
            nb++;
        }
    }
    if (nb > 0) { cx /= nb; cz /= nb; }

    // Placer la camera en vue 3/4 au dessus du centre
    sceneManager.controls.target.set(cx, 1, cz);
    sceneManager.camera.position.set(cx + 8, 6, cz + 12);
    sceneManager.controls.update();
    document.getElementById('info-bar').textContent = 'Camera recentree';
});

document.getElementById('btn-plateau').addEventListener('click', function() {
    var popup = document.getElementById('plateau-popup');
    if (popup.style.display === 'block') {
        popup.style.display = 'none';
    } else {
        toutDesactiver();
        popup.style.display = 'block';
    }
});

// Appliquer la taille du plateau
document.getElementById('btn-plat-appliquer').addEventListener('click', function() {
    var casesX = parseInt(document.getElementById('plat-x').value) || 40;
    var casesZ = parseInt(document.getElementById('plat-z').value) || 40;
    var taille = parseFloat(document.getElementById('plat-taille').value) || 1;
    sceneManager.setPlateau(casesX, casesZ, taille);
    document.getElementById('info-bar').textContent = 'Plateau : ' + casesX + ' x ' + casesZ + ' cases de ' + taille + 'm';
});

// Couleur sol (temps reel)
document.getElementById('plat-sol-couleur').addEventListener('input', function() {
    sceneManager.setCouleurSol(this.value);
});

// Couleur ciel (temps reel)
document.getElementById('plat-ciel-couleur').addEventListener('input', function() {
    sceneManager.scene.background = new THREE.Color(this.value);
});

// Soleil (temps reel)
document.getElementById('plat-soleil').addEventListener('input', function() {
    sceneManager.setSoleil(parseFloat(this.value) / 100);
});

// ========================================
// PLACO
// ========================================

// Bouton placo : generer les modeles et afficher le popup
document.getElementById('btn-placo').addEventListener('click', function() {
    toutDesactiver();
    var modeles = Placo.modeles();
    var categories = {
        'standard': { nom: 'Plaques standard', couleur: '#C8C0B8', ico: '<svg viewBox="0 0 18 24" width="18" height="24"><rect x="2" y="1" width="14" height="22" rx="1" fill="#F5F5F0" stroke="#C8C0B8" stroke-width="1"/><line x1="2" y1="8" x2="16" y2="8" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,1"/><line x1="2" y1="15" x2="16" y2="15" stroke="#E0DDD5" stroke-width="0.5" stroke-dasharray="2,1"/></svg>' },
        'speciale': { nom: 'Plaques speciales', couleur: '#66BB6A', ico: '<svg viewBox="0 0 18 24" width="18" height="24"><rect x="2" y="1" width="14" height="22" rx="1" fill="#C8E6C9" stroke="#66BB6A" stroke-width="1"/><line x1="2" y1="8" x2="16" y2="8" stroke="#A5D6A7" stroke-width="0.5" stroke-dasharray="2,1"/><line x1="2" y1="15" x2="16" y2="15" stroke="#A5D6A7" stroke-width="0.5" stroke-dasharray="2,1"/></svg>' }
    };
    var html = '';
    var catsDone = {};
    for (var i = 0; i < modeles.length; i++) {
        var cat = modeles[i].cat || 'autre';
        if (catsDone[cat]) continue;
        catsDone[cat] = true;
        var catInfo = categories[cat] || { nom: cat, couleur: '#aaa', ico: '' };
        html += '<button class="placo-cat-btn" data-cat="' + cat + '" style="width:100%; padding:8px; margin-bottom:2px; background:#1a1a2e; color:' + catInfo.couleur + '; border:1px solid ' + catInfo.couleur + '; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:8px;">';
        html += catInfo.ico;
        html += '<span style="flex:1; text-align:left;">' + catInfo.nom + '</span>';
        html += '<span class="placo-cat-arrow" style="font-size:10px;">&#9660;</span>';
        html += '</button>';
        html += '<div class="placo-cat-list" data-cat="' + cat + '" style="display:none; padding-left:4px;">';
        for (var j = 0; j < modeles.length; j++) {
            var m = modeles[j];
            if (m.cat !== cat) continue;
            html += '<button class="placo-modele-btn" data-modele="' + m.id + '" style="width:100%; padding:5px 8px; margin-bottom:3px; background:#16213e; color:#fff; border:1px solid ' + catInfo.couleur + '55; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:flex; align-items:center; gap:8px; text-align:left;">';
            html += '<span style="flex-shrink:0;">' + (m.ico || '') + '</span>';
            html += '<span>' + m.nom + ' <span style="color:#888; font-size:9px;">(' + m.largeur.toFixed(2) + 'x' + m.hauteur.toFixed(2) + ' ep=' + (m.ep * 1000).toFixed(0) + 'mm)</span></span>';
            html += '</button>';
        }
        html += '</div>';
    }
    document.getElementById('placo-modeles').innerHTML = html;
    document.getElementById('placo-popup').style.display = 'block';
    document.getElementById('info-bar').textContent = 'PLACO — Choisissez une categorie puis un modele';
});

// Deplier/replier les categories placo
document.getElementById('placo-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.placo-cat-btn');
    if (btn) {
        var cat = btn.getAttribute('data-cat');
        var list = document.querySelector('.placo-cat-list[data-cat="' + cat + '"]');
        if (list) {
            var visible = list.style.display !== 'none';
            var allLists = document.querySelectorAll('.placo-cat-list');
            for (var i = 0; i < allLists.length; i++) allLists[i].style.display = 'none';
            var allArrows = document.querySelectorAll('.placo-cat-arrow');
            for (var i = 0; i < allArrows.length; i++) allArrows[i].innerHTML = '&#9660;';
            if (!visible) {
                list.style.display = 'block';
                btn.querySelector('.placo-cat-arrow').innerHTML = '&#9650;';
            }
        }
        return;
    }
});

// Appliquer la couleur a tous les placos existants
document.getElementById('btn-npl-appliquer-tous').addEventListener('click', function() {
    var couleur = document.getElementById('npl-couleur').value;
    var opacite = parseFloat(document.getElementById('npl-opacite').value) / 100;
    for (var i = 0; i < placoElements.length; i++) {
        Placo.changerCouleur(placoElements[i], couleur, opacite);
    }
    document.getElementById('info-bar').textContent = 'Couleur appliquee a tous les placos !';
});

// Clic sur un modele de placo
document.getElementById('placo-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.placo-modele-btn');
    if (!btn) return;
    var modeleId = btn.getAttribute('data-modele');
    var modeles = Placo.modeles();
    var mod = null;
    for (var i = 0; i < modeles.length; i++) {
        if (modeles[i].id === modeleId) { mod = modeles[i]; break; }
    }
    if (!mod) return;

    // Surligner le bouton selectionne
    var btns = document.querySelectorAll('.placo-modele-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].style.background = '#16213e';
    }
    btn.style.background = '#C8C0B8';
    btn.style.color = '#000';

    // Appliquer les couleurs par defaut du modele
    var defCols = Placo.couleursParModele(modeleId);
    document.getElementById('npl-couleur').value = defCols.placo;

    placoModele = mod;
    modePlaco = true;
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';

    // Creer le ghost preview (placo realiste transparent)
    if (ghostPlaco) { sceneManager.scene.remove(ghostPlaco); ghostPlaco = null; }
    ghostPlaco = Placo.creerGhost(mod.largeur, mod.hauteur, mod.ep, defCols.placo);
    ghostPlaco.visible = false;
    sceneManager.scene.add(ghostPlaco);

    document.getElementById('info-bar').textContent = 'PLACO ' + mod.nom + ' — Cliquez sur un mur pour poser | Echap = annuler';
});

// Menu contextuel placo : Editer
document.getElementById('ctx-placo-editer').addEventListener('click', function() {
    document.getElementById('ctx-placo-menu').style.display = 'none';
    if (!window._ctxPlacoGroup) return;
    var cols = Placo.lireCouleurs(window._ctxPlacoGroup);
    document.getElementById('epl-couleur').value = cols.placo;
    document.getElementById('epl-opacite').value = cols.opacite;
    document.getElementById('edit-placo-popup').style.display = 'block';
});

// Appliquer edition placo
document.getElementById('btn-epl-appliquer').addEventListener('click', function() {
    if (!window._ctxPlacoGroup) return;
    var couleur = document.getElementById('epl-couleur').value;
    var opacite = parseFloat(document.getElementById('epl-opacite').value) / 100;
    Placo.changerCouleur(window._ctxPlacoGroup, couleur, opacite);
    document.getElementById('edit-placo-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Placo mis a jour !';
});

// Edition placo : couleur en temps reel
document.getElementById('epl-couleur').addEventListener('input', function() {
    if (!window._ctxPlacoGroup) return;
    var opacite = parseFloat(document.getElementById('epl-opacite').value) / 100;
    Placo.changerCouleur(window._ctxPlacoGroup, this.value, opacite);
});
document.getElementById('epl-opacite').addEventListener('input', function() {
    if (!window._ctxPlacoGroup) return;
    var couleur = document.getElementById('epl-couleur').value;
    Placo.changerCouleur(window._ctxPlacoGroup, couleur, parseFloat(this.value) / 100);
});

// Menu contextuel placo : Deplacer
document.getElementById('ctx-placo-deplacer').addEventListener('click', function() {
    document.getElementById('ctx-placo-menu').style.display = 'none';
    if (!window._ctxPlacoGroup) return;
    var group = window._ctxPlacoGroup;
    var info = group.userData.placoInfo;
    if (!info) return;

    toutDesactiver();
    modeDeplacerPlaco = true;
    deplacerPlacoGroup = group;
    deplacerPlacoOrigPos = { x: group.position.x, y: group.position.y, z: group.position.z };

    // Creer un ghost (placo realiste transparent)
    placoModele = { largeur: info.largeur, hauteur: info.hauteur, ep: info.ep };
    var cols = Placo.lireCouleurs(group);
    ghostPlaco = Placo.creerGhost(info.largeur, info.hauteur, info.ep, cols.placo);
    ghostPlaco.visible = false;
    sceneManager.scene.add(ghostPlaco);

    // Cacher l'original
    group.visible = false;

    container.style.cursor = 'crosshair';
    document.getElementById('info-bar').textContent = 'DEPLACER PLACO — Cliquez sur un mur pour poser | Echap = annuler';
});

document.getElementById('ctx-placo-supprimer').addEventListener('click', function() {
    document.getElementById('ctx-placo-menu').style.display = 'none';
    if (!window._ctxPlacoGroup) return;
    sceneManager.scene.remove(window._ctxPlacoGroup);
    var idx = placoElements.indexOf(window._ctxPlacoGroup);
    if (idx >= 0) placoElements.splice(idx, 1);
    window._ctxPlacoGroup = null;
    document.getElementById('info-bar').textContent = 'Placo supprime !';
});

// ========================================
// LAINE DE VERRE
// ========================================

// Bouton laine : generer les modeles et afficher le popup
document.getElementById('btn-laine').addEventListener('click', function() {
    toutDesactiver();
    var modeles = LaineDeVerre.modeles();
    var categories = {
        rouleau: { nom: 'Rouleaux', couleur: '#F2D544' },
        panneau: { nom: 'Panneaux', couleur: '#D4A017' }
    };
    var html = '';
    var catsDone = {};
    for (var i = 0; i < modeles.length; i++) {
        var m = modeles[i];
        var cat = m.cat || 'rouleau';
        var catInfo = categories[cat] || categories.rouleau;
        if (!catsDone[cat]) {
            if (catsDone._last) html += '</div>';
            html += '<button class="laine-cat-btn" data-cat="' + cat + '" style="width:100%; padding:8px; margin-bottom:2px; background:#1a1a2e; color:' + catInfo.couleur + '; border:1px solid ' + catInfo.couleur + '; border-radius:4px; cursor:pointer; font-family:monospace; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:8px;">';
            html += '<span style="flex:1; text-align:left;">' + catInfo.nom + '</span>';
            html += '<span class="laine-cat-arrow" style="font-size:10px;">&#9660;</span>';
            html += '</button>';
            html += '<div class="laine-cat-list" data-cat="' + cat + '" style="display:none; padding-left:4px;">';
            catsDone[cat] = true;
            catsDone._last = cat;
        }
        html += '<button class="laine-modele-btn" data-modele="' + m.id + '" style="width:100%; padding:5px 8px; margin-bottom:3px; background:#16213e; color:#fff; border:1px solid ' + catInfo.couleur + '55; border-radius:4px; cursor:pointer; font-family:monospace; font-size:11px; display:flex; align-items:center; gap:8px; text-align:left;">';
        html += '<span>' + m.ico + '</span><span>' + m.nom + ' (' + (m.ep * 1000).toFixed(0) + 'mm)</span>';
        html += '</button>';
    }
    if (catsDone._last) html += '</div>';
    document.getElementById('laine-modeles').innerHTML = html;
    document.getElementById('laine-popup').style.display = 'block';
});

// Deplier/replier les categories laine
document.getElementById('laine-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.laine-cat-btn');
    if (btn) {
        var cat = btn.getAttribute('data-cat');
        var list = document.querySelector('.laine-cat-list[data-cat="' + cat + '"]');
        if (list) {
            var wasOpen = list.style.display !== 'none';
            var allLists = document.querySelectorAll('.laine-cat-list');
            for (var i = 0; i < allLists.length; i++) allLists[i].style.display = 'none';
            var allArrows = document.querySelectorAll('.laine-cat-arrow');
            for (var i = 0; i < allArrows.length; i++) allArrows[i].innerHTML = '&#9660;';
            if (!wasOpen) {
                list.style.display = 'block';
                btn.querySelector('.laine-cat-arrow').innerHTML = '&#9650;';
            }
        }
    }
});

// Appliquer la couleur a toutes les laines existantes
document.getElementById('btn-nlv-appliquer-tous').addEventListener('click', function() {
    var couleur = document.getElementById('nlv-couleur').value;
    var opacite = parseFloat(document.getElementById('nlv-opacite').value) / 100;
    for (var i = 0; i < laineElements.length; i++) {
        LaineDeVerre.changerCouleur(laineElements[i], couleur, opacite);
    }
    document.getElementById('info-bar').textContent = 'Couleur appliquee a toutes les laines !';
});

// Clic sur un modele de laine
document.getElementById('laine-modeles').addEventListener('click', function(ev) {
    var btn = ev.target.closest('.laine-modele-btn');
    if (!btn) return;
    var modeleId = btn.getAttribute('data-modele');
    var modeles = LaineDeVerre.modeles();
    var mod = null;
    for (var i = 0; i < modeles.length; i++) {
        if (modeles[i].id === modeleId) { mod = modeles[i]; break; }
    }
    if (!mod) return;

    // Surligner le bouton
    var btns = document.querySelectorAll('.laine-modele-btn');
    for (var i = 0; i < btns.length; i++) btns[i].style.background = '#16213e';
    btn.style.background = '#2a4a7f';

    // Couleurs par defaut du modele
    var defCols = LaineDeVerre.couleursParModele(modeleId);
    document.getElementById('nlv-couleur').value = defCols.laine;

    laineModele = mod;
    modeLaine = true;
    sceneManager.controls.enabled = true;
    container.style.cursor = 'crosshair';

    // Creer le ghost preview (laine realiste transparent)
    if (ghostLaine) { sceneManager.scene.remove(ghostLaine); ghostLaine = null; }
    ghostLaine = LaineDeVerre.creerGhost(mod.largeur, mod.hauteur, mod.ep, defCols.laine);
    ghostLaine.visible = false;
    sceneManager.scene.add(ghostLaine);

    document.getElementById('info-bar').textContent = 'LAINE ' + mod.nom + ' — Cliquez sur un mur pour poser | Echap = annuler';
});

// Menu contextuel laine : Editer
document.getElementById('ctx-laine-editer').addEventListener('click', function() {
    document.getElementById('ctx-laine-menu').style.display = 'none';
    if (!window._ctxLaineGroup) return;
    var cols = LaineDeVerre.lireCouleurs(window._ctxLaineGroup);
    document.getElementById('elv-couleur').value = cols.laine;
    document.getElementById('elv-opacite').value = cols.opacite;
    document.getElementById('edit-laine-popup').style.display = 'block';
});

// Appliquer edition laine
document.getElementById('btn-elv-appliquer').addEventListener('click', function() {
    if (!window._ctxLaineGroup) return;
    var couleur = document.getElementById('elv-couleur').value;
    var opacite = parseFloat(document.getElementById('elv-opacite').value) / 100;
    LaineDeVerre.changerCouleur(window._ctxLaineGroup, couleur, opacite);
    document.getElementById('edit-laine-popup').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Laine mise a jour !';
});

// Edition laine : couleur en temps reel
document.getElementById('elv-couleur').addEventListener('input', function() {
    if (!window._ctxLaineGroup) return;
    var opacite = parseFloat(document.getElementById('elv-opacite').value) / 100;
    LaineDeVerre.changerCouleur(window._ctxLaineGroup, this.value, opacite);
});
document.getElementById('elv-opacite').addEventListener('input', function() {
    if (!window._ctxLaineGroup) return;
    var couleur = document.getElementById('elv-couleur').value;
    LaineDeVerre.changerCouleur(window._ctxLaineGroup, couleur, parseFloat(this.value) / 100);
});

// Menu contextuel laine : Deplacer
document.getElementById('ctx-laine-deplacer').addEventListener('click', function() {
    document.getElementById('ctx-laine-menu').style.display = 'none';
    if (!window._ctxLaineGroup) return;
    var group = window._ctxLaineGroup;
    var info = group.userData.laineInfo;
    if (!info) return;

    toutDesactiver();
    modeDeplacerLaine = true;
    deplacerLaineGroup = group;
    deplacerLaineOrigPos = { x: group.position.x, y: group.position.y, z: group.position.z };

    // Creer un ghost
    laineModele = { largeur: info.largeur, hauteur: info.hauteur, ep: info.ep };
    var cols = LaineDeVerre.lireCouleurs(group);
    ghostLaine = LaineDeVerre.creerGhost(info.largeur, info.hauteur, info.ep, cols.laine);
    ghostLaine.visible = false;
    sceneManager.scene.add(ghostLaine);

    // Cacher l'original
    group.visible = false;

    container.style.cursor = 'crosshair';
    document.getElementById('info-bar').textContent = 'DEPLACER LAINE — Cliquez sur un mur pour poser | Echap = annuler';
});

// Menu contextuel laine : Supprimer
// Reboucher trous vides depuis le menu laine

document.getElementById('ctx-laine-supprimer').addEventListener('click', function() {
    document.getElementById('ctx-laine-menu').style.display = 'none';
    if (!window._ctxLaineGroup) return;
    sceneManager.scene.remove(window._ctxLaineGroup);
    var idx = laineElements.indexOf(window._ctxLaineGroup);
    if (idx >= 0) laineElements.splice(idx, 1);
    window._ctxLaineGroup = null;
    document.getElementById('info-bar').textContent = 'Laine supprimee !';
});

// ========================================
// AGRANDIR PLACO / LAINE
// ========================================

function _demarrerAgrandirPlaque(group, type) {
    var tag = type === 'placo' ? 'placoInfo' : 'laineInfo';
    var info = group.userData[tag];
    if (!info) return;

    toutDesactiver();
    modeAgrandirPlaque = true;
    agrandirPlaqueGroup = group;
    agrandirPlaqueType = type;
    agrandirPlaqueInfo = info;
    agrandirPlaqueOrigL = info.largeur;
    agrandirPlaqueOrigWX = info.worldX;
    agrandirPlaqueOrigWZ = info.worldZ;

    // Utiliser directement l'angle du placo — plus besoin de chercher un mur
    var rad = info.angle * Math.PI / 180;
    var nx = Math.cos(rad);
    var nz = Math.sin(rad);
    // Origine = bord gauche du placo
    var originX = info.worldX - nx * info.largeur / 2;
    var originZ = info.worldZ - nz * info.largeur / 2;

    agrandirPlaqueSeg = {
        seg: { x1: originX, z1: originZ, x2: originX + nx * 50, z2: originZ + nz * 50 },
        nx: nx, nz: nz,
        dx: nx * 50, dz: nz * 50,
        len: 50 // pas de limite
    };

    // Creer un ghost transparent montrant la taille originale
    var ghostColor = type === 'placo' ? '#C8C0B8' : '#D4A017';
    var ghostGeo = new THREE.BoxGeometry(info.largeur, info.hauteur, info.ep + 0.005);
    var ghostMat = new THREE.MeshBasicMaterial({ color: ghostColor, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
    agrandirPlaqueGhost = new THREE.Mesh(ghostGeo, ghostMat);
    agrandirPlaqueGhost.position.copy(group.position);
    agrandirPlaqueGhost.position.y += info.hauteur / 2;
    agrandirPlaqueGhost.rotation.copy(group.rotation);
    sceneManager.scene.add(agrandirPlaqueGhost);

    container.style.cursor = 'ew-resize';
    document.getElementById('info-bar').textContent = 'AGRANDIR — Bougez la souris a gauche/droite | Cliquez pour valider | Echap = annuler';
}

// Menu contextuel placo : Agrandir
document.getElementById('ctx-placo-agrandir').addEventListener('click', function() {
    document.getElementById('ctx-placo-menu').style.display = 'none';
    if (!window._ctxPlacoGroup) return;
    _demarrerAgrandirPlaque(window._ctxPlacoGroup, 'placo');
    window._ctxPlacoGroup = null;
});

// Menu contextuel laine : Agrandir
document.getElementById('ctx-laine-agrandir').addEventListener('click', function() {
    document.getElementById('ctx-laine-menu').style.display = 'none';
    if (!window._ctxLaineGroup) return;
    _demarrerAgrandirPlaque(window._ctxLaineGroup, 'laine');
    window._ctxLaineGroup = null;
});

// ========================================
// MACRO — Enregistrement / Lecture d'actions
// ========================================

// Capturer un snapshot complet de la scene
function _macroSnapshot() {
    var snap = { murs: [], exclusions: [], placos: [], laines: [] };
    for (var i = 0; i < editeur.elements.length; i++) {
        snap.murs.push(JSON.parse(JSON.stringify(editeur.elements[i].params)));
    }
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var ex = editeur.exclusions[i];
        var creation = null;
        var exType = ex._type || 'fenetre';

        // 1. Lire depuis excl._creation (nouvelle methode directe)
        if (ex._creation) {
            creation = JSON.parse(JSON.stringify(ex._creation));
        }
        // 2. Fallback : lire depuis group3D.userData
        if (!creation && ex.group3D) {
            if (ex.group3D.userData.porteCreation) {
                exType = 'porte';
                creation = JSON.parse(JSON.stringify(ex.group3D.userData.porteCreation));
            } else if (ex.group3D.userData.fenetreCreation) {
                exType = 'fenetre';
                creation = JSON.parse(JSON.stringify(ex.group3D.userData.fenetreCreation));
            }
        }
        // 3. Dernier fallback : reconstruire
        if (!creation) {
            creation = {
                modeleId: exType === 'porte' ? 'simple' : 'rectangle',
                worldX: ex.x, worldZ: ex.z, y: ex.y || 0,
                largeur: ex.largeur, hauteur: ex.hauteur, angle: ex.angle
            };
            if (exType === 'porte') {
                creation.couleurCadre = '#8B4513'; creation.couleurPorte = '#D2691E';
            } else {
                creation.couleurCadre = '#4a90d9'; creation.couleurVitre = '#87CEEB'; creation.opaciteVitre = 0.3;
            }
        }

        // Mettre a jour la position dans creation (au cas ou l'exclusion a bouge)
        creation.worldX = ex.x;
        creation.worldZ = ex.z;

        snap.exclusions.push({
            x: ex.x, z: ex.z, y: ex.y,
            largeur: ex.largeur, hauteur: ex.hauteur,
            angle: ex.angle, type: exType, creation: creation
        });
    }
    for (var i = 0; i < placoElements.length; i++) {
        var pi = placoElements[i].userData.placoInfo;
        if (pi) {
            var cols = Placo.lireCouleurs(placoElements[i]);
            snap.placos.push({
                worldX: pi.worldX, worldZ: pi.worldZ, y: pi.y,
                largeur: pi.largeur, hauteur: pi.hauteur,
                angle: pi.angle, ep: pi.ep, side: pi.side,
                murEpFull: pi.murEpFull, extraBack: pi.extraBack || 0,
                couleur: cols.placo, opacite: cols.opacite
            });
        }
    }
    for (var i = 0; i < laineElements.length; i++) {
        var li = laineElements[i].userData.laineInfo;
        if (li) {
            var cols = LaineDeVerre.lireCouleurs(laineElements[i]);
            snap.laines.push({
                worldX: li.worldX, worldZ: li.worldZ, y: li.y,
                largeur: li.largeur, hauteur: li.hauteur,
                angle: li.angle, ep: li.ep, side: li.side,
                murEpFull: li.murEpFull,
                couleur: cols.laine, opacite: cols.opacite
            });
        }
    }
    // Plinthes
    snap.plinthes = [];
    for (var i = 0; i < plinthElements.length; i++) {
        var pk = plinthElements[i].userData.plinthInfo;
        if (pk) snap.plinthes.push(JSON.parse(JSON.stringify(pk)));
    }
    // Carrelages
    snap.carrelages = [];
    for (var i = 0; i < carrelageElements.length; i++) {
        var ck = carrelageElements[i].userData.carrelageInfo;
        if (ck) snap.carrelages.push(JSON.parse(JSON.stringify(ck)));
    }
    // Papiers peints
    snap.papiersPeints = [];
    for (var i = 0; i < ppElements.length; i++) {
        var ppk = ppElements[i].userData.papierPeintInfo;
        if (ppk) snap.papiersPeints.push(JSON.parse(JSON.stringify(ppk)));
    }
    // Carrelage sol
    snap.carrelagesSol = [];
    for (var i = 0; i < carrelageSolElements.length; i++) {
        var csk = carrelageSolElements[i].userData.csSol;
        if (csk) snap.carrelagesSol.push(JSON.parse(JSON.stringify(csk)));
    }
    // Personnages
    snap.personnages = [];
    sceneManager.scene.traverse(function(c) {
        if (c.userData && c.userData.isPersonnage && c.parent === sceneManager.scene) {
            var p = c.userData.persoInfo;
            if (p) snap.personnages.push(JSON.parse(JSON.stringify(p)));
        }
    });
    // Escaliers
    snap.escaliers = [];
    for (var i = 0; i < escalierElements.length; i++) {
        var ek = escalierElements[i].userData.escalierCreation;
        if (ek) snap.escaliers.push(JSON.parse(JSON.stringify(ek)));
    }
    // Plafonds
    snap.plafonds = [];
    for (var i = 0; i < plafondElements.length; i++) {
        var pk = plafondElements[i].userData.plafondCreation;
        if (pk) snap.plafonds.push(JSON.parse(JSON.stringify(pk)));
    }
    return snap;
}

// Restaurer la scene depuis un snapshot
function _macroRestore(snap) {
    // Nettoyer les exclusions d'abord (portes/fenetres 3D)
    for (var i = editeur.exclusions.length - 1; i >= 0; i--) {
        if (editeur.exclusions[i].group3D) sceneManager.scene.remove(editeur.exclusions[i].group3D);
    }
    editeur.exclusions.length = 0;

    // Nettoyer les murs
    for (var i = editeur.elements.length - 1; i >= 0; i--) {
        var el = editeur.elements[i];
        if (el.group) sceneManager.scene.remove(el.group);
        if (el.brique && el.brique.group) sceneManager.scene.remove(el.brique.group);
    }
    editeur.elements.length = 0;

    // Nettoyer les placos
    for (var i = placoElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(placoElements[i]);
    }
    placoElements.length = 0;

    // Nettoyer les laines
    for (var i = laineElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(laineElements[i]);
    }
    laineElements.length = 0;

    // Recreer les murs
    for (var i = 0; i < snap.murs.length; i++) {
        editeur.ajouterMur(JSON.parse(JSON.stringify(snap.murs[i])));
    }

    // Recreer les exclusions (portes/fenetres)
    if (snap.exclusions) {
        for (var i = 0; i < snap.exclusions.length; i++) {
            var ex = snap.exclusions[i];
            var c = ex.creation;
            if (!c) continue;
            try {
                if (ex.type === 'porte') {
                    porte.setCouleurs(c.couleurCadre || '#8B4513', c.couleurPorte || '#D2691E');
                    porte.creer(c.modeleId || 'simple', c.worldX, c.worldZ, c.y || 0, c.largeur, c.hauteur, c.angle);
                } else {
                    fenetre.setCouleurs(c.couleurCadre || '#4a90d9', c.couleurVitre || '#87CEEB', c.opaciteVitre || 0.3);
                    fenetre.creer(c.modeleId || 'rectangle', c.worldX, c.worldZ, c.y || 0, c.largeur, c.hauteur, c.angle);
                }
            } catch(err) {
                console.error('macroRestore: erreur exclusion ' + i, err);
            }
        }
    }

    // Recreer les placos
    for (var i = 0; i < snap.placos.length; i++) {
        var pi = snap.placos[i];
        placo.setCouleurs(pi.couleur, pi.opacite / 100);
        var g = placo.creer(null, pi.worldX, pi.worldZ, pi.y, pi.largeur, pi.hauteur, pi.angle, pi.ep, pi.side, pi.murEpFull, pi.extraBack);
        placoElements.push(g);
    }

    // Recreer les laines
    for (var i = 0; i < snap.laines.length; i++) {
        var li = snap.laines[i];
        laineDeVerre.setCouleurs(li.couleur, li.opacite / 100);
        var g = laineDeVerre.creer(null, li.worldX, li.worldZ, li.y, li.largeur, li.hauteur, li.angle, li.ep, li.side, li.murEpFull);
        laineElements.push(g);
    }

    // Nettoyer et recreer les plinthes
    for (var i = plinthElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(plinthElements[i]);
    }
    plinthElements.length = 0;
    if (snap.plinthes) {
        for (var i = 0; i < snap.plinthes.length; i++) {
            var pk = snap.plinthes[i];
            // Trouver le placoGroup correspondant
            var pg = null;
            for (var p = 0; p < placoElements.length; p++) {
                var pgi = placoElements[p].userData.placoInfo;
                if (pgi && Math.abs(pgi.worldX - pk.placoWorldX) < 0.05 && Math.abs(pgi.worldZ - pk.placoWorldZ) < 0.05 && pgi.side === pk.side) {
                    pg = placoElements[p]; break;
                }
            }
            if (pg) {
                plintheObj.setCouleur(pk.couleur);
                var g = plintheObj.creer(pk.modeleId, pg.userData.placoInfo, pg);
                plinthElements.push(g);
            }
        }
    }

    // Nettoyer et recreer les carrelages
    for (var i = carrelageElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(carrelageElements[i]);
    }
    carrelageElements.length = 0;
    if (snap.carrelages) {
        for (var i = 0; i < snap.carrelages.length; i++) {
            var ck = snap.carrelages[i];
            var pg = null;
            for (var p = 0; p < placoElements.length; p++) {
                var pgi = placoElements[p].userData.placoInfo;
                if (pgi && Math.abs(pgi.worldX - ck.placoWorldX) < 0.05 && Math.abs(pgi.worldZ - ck.placoWorldZ) < 0.05 && pgi.side === ck.side) {
                    pg = placoElements[p]; break;
                }
            }
            if (pg) {
                carrelageObj.setCouleurs(ck.couleurCarreau, ck.couleurJoint);
                var g = carrelageObj.creer(ck.modeleId, pg.userData.placoInfo, pg);
                carrelageElements.push(g);
            }
        }
    }

    // Nettoyer et recreer les papiers peints
    for (var i = ppElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(ppElements[i]);
    }
    ppElements.length = 0;
    if (snap.papiersPeints) {
        for (var i = 0; i < snap.papiersPeints.length; i++) {
            var ppk = snap.papiersPeints[i];
            var pg = null;
            for (var p = 0; p < placoElements.length; p++) {
                var pgi = placoElements[p].userData.placoInfo;
                if (pgi && Math.abs(pgi.worldX - ppk.placoWorldX) < 0.05 && Math.abs(pgi.worldZ - ppk.placoWorldZ) < 0.05 && pgi.side === ppk.side) {
                    pg = placoElements[p]; break;
                }
            }
            if (pg) {
                ppObj.setCouleurs(ppk.couleur1, ppk.couleur2);
                var g = ppObj.creer(ppk.modeleId, pg.userData.placoInfo, pg);
                ppElements.push(g);
            }
        }
    }

    // Nettoyer et recreer les carrelages sol
    for (var i = carrelageSolElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(carrelageSolElements[i]);
    }
    carrelageSolElements.length = 0;
    if (snap.carrelagesSol) {
        for (var i = 0; i < snap.carrelagesSol.length; i++) {
            var csk = snap.carrelagesSol[i];
            var mesh = _creerMeshSol(csk.points, csk.modeleId, csk.couleurCarreau, csk.couleurJoint, 0.002, 1.0, csk.tW, csk.tH, csk.contourCouleur || _csCouleurs[i % _csCouleurs.length], csk.jointEp, csk.angle, csk.showLabel);
            mesh.userData.csSol = JSON.parse(JSON.stringify(csk));
            mesh.userData.isCarrelageSol = true;
            sceneManager.scene.add(mesh);
            carrelageSolElements.push(mesh);
        }
    }

    // Nettoyer et recreer les personnages
    var _persToRemove = [];
    sceneManager.scene.traverse(function(c) {
        if (c.userData && c.userData.isPersonnage && c.parent === sceneManager.scene) _persToRemove.push(c);
    });
    for (var i = 0; i < _persToRemove.length; i++) sceneManager.scene.remove(_persToRemove[i]);
    personnagesListe = [];
    if (snap.personnages) {
        for (var i = 0; i < snap.personnages.length; i++) {
            var pi = snap.personnages[i];
            var perso = personnage.creer(pi.couleurs, pi.worldX, pi.worldZ);
            perso.scale.setScalar(pi.taille || 1);
            perso.userData.persoInfo = JSON.parse(JSON.stringify(pi));
            personnagesListe.push(perso);
        }
    }
    // Nettoyer et recreer les escaliers
    for (var i = escalierElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(escalierElements[i]);
    }
    escalierElements.length = 0;
    if (snap.escaliers) {
        for (var i = 0; i < snap.escaliers.length; i++) {
            var ek = snap.escaliers[i];
            escalierObj.setCouleurs(ek.couleurMarche || '#A0522D', ek.couleurRampe || '#666666');
            var g = escalierObj.creer(ek.modeleId, ek.worldX, ek.worldZ, ek.angle || 0, { largeur: ek.largeur, longueur: ek.longueur, hauteur: ek.hauteur, nbMarches: ek.nbMarches });
            escalierElements.push(g);
        }
    }
    // Nettoyer et recreer les plafonds
    for (var i = plafondElements.length - 1; i >= 0; i--) {
        sceneManager.scene.remove(plafondElements[i]);
    }
    plafondElements.length = 0;
    if (snap.plafonds) {
        for (var i = 0; i < snap.plafonds.length; i++) {
            var pk = snap.plafonds[i];
            var g = _creerPlafond(pk.points, pk.hauteur, pk.ep, pk.couleurDalle, pk.couleurPoteau, pk.avecPoteaux);
            plafondElements.push(g);
        }
    }
}

// Bouton camera : ouvrir/fermer le sous-menu macro
document.getElementById('btn-macro-menu').addEventListener('click', function(e) {
    e.stopPropagation();
    var sub = document.getElementById('macro-submenu');
    if (sub.style.display === 'none' || sub.style.display === '') {
        // Mettre a jour le texte selon l'etat
        var recBtn = document.getElementById('btn-macro-rec');
        if (macroRecording) {
            recBtn.querySelector('span').textContent = 'Arreter l\'enregistrement';
            recBtn.querySelector('svg circle').setAttribute('fill', '#888');
        } else {
            recBtn.querySelector('span').textContent = 'Enregistrer';
            recBtn.querySelector('svg circle').setAttribute('fill', '#e94560');
        }
        // Afficher le nombre d'etapes si enregistrees
        var playBtn = document.getElementById('btn-macro-play');
        if (macroFrames.length >= 2) {
            playBtn.querySelector('span').textContent = 'Lire (' + (macroFrames.length - 1) + ' actions)';
        } else {
            playBtn.querySelector('span').textContent = 'Lire';
        }
        // Positionner le sous-menu en dessous du bouton
        var btn = document.getElementById('btn-macro-menu');
        var rect = btn.getBoundingClientRect();
        sub.style.left = rect.left + 'px';
        sub.style.top = (rect.bottom + 4) + 'px';
        sub.style.bottom = 'auto';
        sub.style.display = 'block';
        // Si depasse en bas de l'ecran, remonter
        var subRect = sub.getBoundingClientRect();
        if (subRect.bottom > window.innerHeight) {
            sub.style.top = (window.innerHeight - subRect.height - 5) + 'px';
        }
        // Si depasse a droite
        if (subRect.right > window.innerWidth) {
            sub.style.left = (window.innerWidth - subRect.width - 5) + 'px';
        }
    } else {
        sub.style.display = 'none';
    }
});

// Fermer le sous-menu si clic ailleurs
document.addEventListener('click', function(e) {
    var sub = document.getElementById('macro-submenu');
    if (sub.style.display === 'block' && !sub.contains(e.target) && !document.getElementById('btn-macro-menu').contains(e.target)) {
        sub.style.display = 'none';
    }
});

// Bouton Record
document.getElementById('btn-macro-rec').addEventListener('click', function() {
    document.getElementById('macro-submenu').style.display = 'none';
    if (macroRecording) {
        // Arreter l'enregistrement
        macroRecording = false;
        // Capturer l'etat final
        macroFrames.push(_macroSnapshot());
        if (window._macroBlinkInterval) { clearInterval(window._macroBlinkInterval); window._macroBlinkInterval = null; }
        document.getElementById('btn-macro-menu').style.background = '';
        document.getElementById('macro-rec-badge').style.display = 'none';
        editeur._onSauvegarder = null;
        document.getElementById('info-bar').textContent = 'Enregistrement termine — ' + (macroFrames.length - 1) + ' action(s). Cliquez Play pour lire ou Export pour sauvegarder.';
    } else {
        // Demarrer l'enregistrement
        toutDesactiver();
        macroFrames = [];
        macroRecording = true;
        // Capturer l'etat initial (etape 0)
        macroFrames.push(_macroSnapshot());
        // Hooker sauvegarderEtat pour capturer chaque action
        editeur._onSauvegarder = function() {
            if (macroRecording) {
                // On capture APRES la modification (au prochain tick)
                setTimeout(function() {
                    if (macroRecording) {
                        macroFrames.push(_macroSnapshot());
                        document.getElementById('macro-rec-badge').textContent = macroFrames.length - 1;
                        document.getElementById('info-bar').textContent = 'REC — ' + (macroFrames.length - 1) + ' action(s) enregistree(s)';
                    }
                }, 50);
            }
        };
        document.getElementById('macro-rec-badge').style.display = 'block';
        document.getElementById('macro-rec-badge').textContent = '0';
        // Clignotement rouge sur le bouton camera
        window._macroBlinkInterval = setInterval(function() {
            var btn = document.getElementById('btn-macro-menu');
            btn.style.background = btn.style.background === 'rgb(233, 69, 96)' ? '' : '#e94560';
        }, 500);
        document.getElementById('info-bar').textContent = 'REC — Enregistrement en cours. Faites vos actions puis cliquez camera > Arreter';
    }
});

// Bouton Play
document.getElementById('btn-macro-play').addEventListener('click', function() {
    document.getElementById('macro-submenu').style.display = 'none';
    if (macroFrames.length < 2) {
        document.getElementById('info-bar').textContent = 'Rien a lire — enregistrez d\'abord des actions';
        return;
    }
    toutDesactiver();
    macroRecording = false;
    macroPlaying = true;
    macroPaused = false;
    macroCurrentStep = 0;
    document.getElementById('macro-bar').style.display = 'flex';
    document.getElementById('macro-step').textContent = '0 / ' + (macroFrames.length - 1);
    _macroRestore(macroFrames[0]);
    _macroPlayNext();
});

function _macroPlayNext() {
    if (!macroPlaying || macroPaused) return;
    if (macroCurrentStep >= macroFrames.length - 1) {
        document.getElementById('info-bar').textContent = 'Lecture terminee !';
        return;
    }
    var speed = parseInt(document.getElementById('macro-speed').value) || 5;
    var delay = Math.max(50, 2000 / speed);
    macroTimer = setTimeout(function() {
        macroCurrentStep++;
        _macroRestore(macroFrames[macroCurrentStep]);
        document.getElementById('macro-step').textContent = macroCurrentStep + ' / ' + (macroFrames.length - 1);
        document.getElementById('info-bar').textContent = 'Lecture — etape ' + macroCurrentStep + '/' + (macroFrames.length - 1);
        _macroPlayNext();
    }, delay);
}

// Pause / Reprendre
document.getElementById('macro-pause').addEventListener('click', function() {
    if (!macroPlaying) return;
    macroPaused = !macroPaused;
    document.getElementById('macro-pause').innerHTML = macroPaused ? '&#9654;' : '&#10074;&#10074;';
    if (!macroPaused) _macroPlayNext();
});

// Etape suivante
document.getElementById('macro-next').addEventListener('click', function() {
    if (!macroPlaying || macroCurrentStep >= macroFrames.length - 1) return;
    macroPaused = true;
    document.getElementById('macro-pause').innerHTML = '&#9654;';
    if (macroTimer) clearTimeout(macroTimer);
    macroCurrentStep++;
    _macroRestore(macroFrames[macroCurrentStep]);
    document.getElementById('macro-step').textContent = macroCurrentStep + ' / ' + (macroFrames.length - 1);
});

// Etape precedente
document.getElementById('macro-prev').addEventListener('click', function() {
    if (!macroPlaying || macroCurrentStep <= 0) return;
    macroPaused = true;
    document.getElementById('macro-pause').innerHTML = '&#9654;';
    if (macroTimer) clearTimeout(macroTimer);
    macroCurrentStep--;
    _macroRestore(macroFrames[macroCurrentStep]);
    document.getElementById('macro-step').textContent = macroCurrentStep + ' / ' + (macroFrames.length - 1);
});

// Stop
document.getElementById('macro-stop').addEventListener('click', function() {
    macroPlaying = false;
    macroPaused = false;
    if (macroTimer) clearTimeout(macroTimer);
    document.getElementById('macro-bar').style.display = 'none';
    document.getElementById('info-bar').textContent = 'Lecture arretee';
});

// Vitesse
document.getElementById('macro-speed').addEventListener('input', function() {
    document.getElementById('macro-speed-label').textContent = 'x' + this.value;
});

// Export macro
// Export depuis le sous-menu camera
document.getElementById('btn-macro-export-menu').addEventListener('click', function() {
    document.getElementById('macro-submenu').style.display = 'none';
    document.getElementById('macro-export').click();
});

// Import depuis le sous-menu camera
document.getElementById('btn-macro-import-menu').addEventListener('click', function() {
    document.getElementById('macro-submenu').style.display = 'none';
    document.getElementById('macro-import').click();
});

document.getElementById('macro-export').addEventListener('click', function() {
    if (macroFrames.length < 2) {
        document.getElementById('info-bar').textContent = 'Rien a exporter';
        return;
    }
    var json = JSON.stringify(macroFrames);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'macro_eleec_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('info-bar').textContent = 'Macro exportee (' + macroFrames.length + ' etapes)';
});

// Import macro
document.getElementById('macro-import').addEventListener('click', function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (Array.isArray(data) && data.length >= 2) {
                    macroFrames = data;
                    document.getElementById('info-bar').textContent = 'Macro importee — ' + macroFrames.length + ' etapes. Cliquez Play pour lire.';
                } else {
                    alert('Fichier macro invalide');
                }
            } catch (err) {
                alert('Erreur de lecture : ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// ========================================
// SUPER TIMELINE — historique global complet
// ========================================

var _timeline = [];        // tous les snapshots depuis le chargement
var _timelinePos = -1;     // position courante (-1 = etat live)
var _timelineActive = false;
var _timelinePlaying = false;
var _timelineTimer = null;

// Capture automatique a chaque sauvegarderEtat
var _origSauvegarder2 = editeur.sauvegarderEtat;
editeur.sauvegarderEtat = function() {
    _origSauvegarder2.call(editeur);
    // Capturer le snapshot pour la timeline
    _timelinePush();
};

function _timelinePush() {
    var snap = _macroSnapshot();
    // Ajouter les traits et zones
    snap.traits = [];
    for (var i = 0; i < editeur.traits.length; i++) {
        snap.traits.push(JSON.parse(JSON.stringify(editeur.traits[i].params)));
    }
    snap.piecesZones = JSON.parse(JSON.stringify(piecesZones));
    // Si on etait en train de naviguer, couper le futur
    if (_timelinePos >= 0 && _timelinePos < _timeline.length - 1) {
        _timeline.length = _timelinePos + 1;
    }
    _timeline.push(snap);
    _timelinePos = _timeline.length - 1;
    _timelineUpdateUI();
}

function _timelineRestore(idx) {
    if (idx < 0 || idx >= _timeline.length) return;
    _timelinePos = idx;
    var snap = _timeline[idx];

    // Restaurer via _macroRestore (murs, exclusions, placos, laines)
    _macroRestore(snap);

    // Restaurer les traits
    while (editeur.traits.length > 0) {
        editeur.supprimerTrait(editeur.traits[0].id);
    }
    if (snap.traits) {
        for (var i = 0; i < snap.traits.length; i++) {
            editeur.ajouterTrait(snap.traits[i]);
        }
    }
    // Visibilite des traits
    for (var i = 0; i < editeur.traits.length; i++) {
        editeur.traits[i].line.visible = modeZones;
    }

    // Restaurer les zones
    if (snap.piecesZones) {
        piecesZones = JSON.parse(JSON.stringify(snap.piecesZones));
    }

    // Rafraichir les pieces fermees si mode zones actif
    if (modeZones || piecesZones.length > 0) {
        _afficherPiecesFermees();
        if (modeZones) _mettreAJourPanelZones();
    }

    _timelineUpdateUI();
}

function _timelineUpdateUI() {
    var bar = document.getElementById('timeline-bar');
    if (!_timelineActive) return;
    var slider = document.getElementById('tl-slider');
    slider.max = Math.max(0, _timeline.length - 1);
    slider.value = _timelinePos;
    document.getElementById('tl-step').textContent = (_timelinePos + 1) + ' / ' + _timeline.length;

    // Info contextuelle
    var info = '';
    if (_timelinePos >= 0 && _timelinePos < _timeline.length) {
        var s = _timeline[_timelinePos];
        var nbMurs = s.murs ? s.murs.length : 0;
        var nbExcl = s.exclusions ? s.exclusions.length : 0;
        var nbPlac = s.placos ? s.placos.length : 0;
        var nbLain = s.laines ? s.laines.length : 0;
        var nbTrai = s.traits ? s.traits.length : 0;
        info = nbMurs + ' murs';
        if (nbExcl) info += ' | ' + nbExcl + ' ouv.';
        if (nbPlac) info += ' | ' + nbPlac + ' placos';
        if (nbLain) info += ' | ' + nbLain + ' laines';
        if (nbTrai) info += ' | ' + nbTrai + ' traits';
    }
    document.getElementById('tl-info').textContent = info;

    // Etat des boutons
    document.getElementById('tl-prev').style.opacity = _timelinePos > 0 ? '1' : '0.3';
    document.getElementById('tl-start').style.opacity = _timelinePos > 0 ? '1' : '0.3';
    document.getElementById('tl-next').style.opacity = _timelinePos < _timeline.length - 1 ? '1' : '0.3';
    document.getElementById('tl-end').style.opacity = _timelinePos < _timeline.length - 1 ? '1' : '0.3';
    document.getElementById('tl-play').textContent = _timelinePlaying ? '⏸' : '▶';
}

// Bouton timeline dans la toolbar
document.getElementById('btn-timeline').addEventListener('click', function() {
    _timelineActive = !_timelineActive;
    var bar = document.getElementById('timeline-bar');
    var btn = document.getElementById('btn-timeline');

    if (_timelineActive) {
        btn.classList.add('actif');
        btn.style.borderColor = '#9C27B0';
        bar.style.display = 'block';
        // Si la timeline est vide, capturer l'etat initial
        if (_timeline.length === 0) {
            _timelinePush();
        }
        _timelineUpdateUI();
    } else {
        btn.classList.remove('actif');
        btn.style.borderColor = '';
        bar.style.display = 'none';
        _timelineStopPlay();
    }
});

// Bouton precedent
document.getElementById('tl-prev').addEventListener('click', function() {
    if (_timelinePos > 0) {
        _timelineStopPlay();
        _timelineRestore(_timelinePos - 1);
    }
});

// Bouton suivant
document.getElementById('tl-next').addEventListener('click', function() {
    if (_timelinePos < _timeline.length - 1) {
        _timelineStopPlay();
        _timelineRestore(_timelinePos + 1);
    }
});

// Bouton debut
document.getElementById('tl-start').addEventListener('click', function() {
    _timelineStopPlay();
    _timelineRestore(0);
});

// Bouton fin
document.getElementById('tl-end').addEventListener('click', function() {
    _timelineStopPlay();
    _timelineRestore(_timeline.length - 1);
});

// Play auto
document.getElementById('tl-play').addEventListener('click', function() {
    if (_timelinePlaying) {
        _timelineStopPlay();
    } else {
        _timelinePlaying = true;
        _timelineUpdateUI();
        _timelinePlayStep();
    }
});

function _timelinePlayStep() {
    if (!_timelinePlaying) return;
    if (_timelinePos >= _timeline.length - 1) {
        _timelineStopPlay();
        return;
    }
    _timelineRestore(_timelinePos + 1);
    var speed = parseInt(document.getElementById('tl-speed').value) || 3;
    var delay = Math.max(50, 1500 / speed);
    _timelineTimer = setTimeout(_timelinePlayStep, delay);
}

function _timelineStopPlay() {
    _timelinePlaying = false;
    if (_timelineTimer) { clearTimeout(_timelineTimer); _timelineTimer = null; }
    _timelineUpdateUI();
}

// Slider
document.getElementById('tl-slider').addEventListener('input', function() {
    _timelineStopPlay();
    var idx = parseInt(this.value);
    _timelineRestore(idx);
});

// Speed label
document.getElementById('tl-speed').addEventListener('input', function() {
    document.getElementById('tl-speed-label').textContent = 'x' + this.value;
});

// Fermer
document.getElementById('tl-close').addEventListener('click', function() {
    _timelineActive = false;
    document.getElementById('timeline-bar').style.display = 'none';
    document.getElementById('btn-timeline').classList.remove('actif');
    document.getElementById('btn-timeline').style.borderColor = '';
    _timelineStopPlay();
});

// Exporter l'historique global en JSON
document.getElementById('tl-export').addEventListener('click', function() {
    if (_timeline.length === 0) { alert('Aucun historique a exporter.'); return; }
    var data = JSON.stringify(_timeline);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'historique-global.json';
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('info-bar').textContent = 'Historique global exporte (' + _timeline.length + ' etapes)';
});

// Importer un historique global
document.getElementById('tl-import').addEventListener('click', function() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(ev) {
        var file = ev.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (!Array.isArray(data) || data.length === 0) {
                    alert('Fichier invalide.');
                    return;
                }
                _timeline = data;
                _timelinePos = _timeline.length - 1;
                _timelineRestore(_timelinePos);
                _timelineUpdateUI();
                document.getElementById('info-bar').textContent = 'Historique global importe (' + _timeline.length + ' etapes)';
            } catch (err) {
                alert('Erreur : ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// Raccourcis clavier : fleches gauche/droite quand timeline est active
document.addEventListener('keydown', function(e) {
    if (!_timelineActive) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        _timelineStopPlay();
        if (_timelinePos > 0) _timelineRestore(_timelinePos - 1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        _timelineStopPlay();
        if (_timelinePos < _timeline.length - 1) _timelineRestore(_timelinePos + 1);
    } else if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('tl-play').click();
    }
});

// ========================================
// CACHE AUTO — sauvegarde dans localStorage
// ========================================

function _sauvegarderCache() {
    try {
        // Utiliser _macroSnapshot qui fonctionne deja pour timeline/macro
        var data = _macroSnapshot();
        // Ajouter les traits
        data.traits = [];
        for (var i = 0; i < editeur.traits.length; i++) {
            data.traits.push(JSON.parse(JSON.stringify(editeur.traits[i].params)));
        }
        // Ajouter les zones
        data.piecesZones = JSON.parse(JSON.stringify(piecesZones));
        // Ajouter les prix
        data.prix = { briques: PRIX_BRIQUES, placos: PRIX_PLACOS, laines: PRIX_LAINES, portes: PRIX_PORTES, fenetres: PRIX_FENETRES };
        // Mode toolbar
        data.toolbarTexte = document.getElementById('toolbar').classList.contains('mode-texte');
        // Camera
        data.camera = {
            px: sceneManager.camera.position.x, py: sceneManager.camera.position.y, pz: sceneManager.camera.position.z,
            tx: sceneManager.controls.target.x, ty: sceneManager.controls.target.y, tz: sceneManager.controls.target.z
        };

        localStorage.setItem('eleec_cache', JSON.stringify(data));
    } catch(e) {
        console.warn('Erreur sauvegarde cache:', e);
    }
}

// Sauvegarder a chaque sauvegarderEtat (deja override)
var _origSauvegarder3 = editeur.sauvegarderEtat;
editeur.sauvegarderEtat = function() {
    _origSauvegarder3.call(editeur);
    _sauvegarderCache();
};

// Appliquer le clipping aux nouveaux objets ajoutes a la scene
var _origSceneAdd = sceneManager.scene.add.bind(sceneManager.scene);
sceneManager.scene.add = function(obj) {
    _origSceneAdd(obj);
    if (_clipActif && obj) {
        obj.traverse(function(c) {
            if (c.isMesh && c.material && !Array.isArray(c.material)) {
                c.material.clippingPlanes = _clipPlanes;
                c.material.clipShadows = true;
            } else if (c.isMesh && Array.isArray(c.material)) {
                for (var m = 0; m < c.material.length; m++) {
                    c.material[m].clippingPlanes = _clipPlanes;
                    c.material[m].clipShadows = true;
                }
            }
        });
    }
};

// Sauvegarder aussi avant de quitter la page
window.addEventListener('beforeunload', function() {
    _sauvegarderCache();
});

// ========================================
// SAUVEGARDES EN BLOCS (style FF7)
// ========================================

var SAVES_MAX = 8; // 8 slots de sauvegarde

// Popup de confirmation avec corbeille (remplace confirm())
var _confirmCallback = null;
function _confirmerSuppression(message, imageUrl, onConfirm) {
    var popup = document.getElementById('confirm-delete-popup');
    var overlay = document.getElementById('confirm-delete-overlay');
    document.getElementById('confirm-delete-msg').textContent = message;
    var preview = document.getElementById('confirm-delete-preview');
    if (imageUrl) {
        preview.innerHTML = '<img src="' + imageUrl + '" style="width:180px; height:100px; object-fit:cover; border-radius:6px; border:1px solid #333;">';
    } else {
        preview.innerHTML = '';
    }
    _confirmCallback = onConfirm;
    popup.style.display = 'block';
    overlay.style.display = 'block';
}
function _fermerConfirmation() {
    document.getElementById('confirm-delete-popup').style.display = 'none';
    document.getElementById('confirm-delete-overlay').style.display = 'none';
    _confirmCallback = null;
}
document.getElementById('confirm-delete-yes').addEventListener('click', function() {
    if (_confirmCallback) _confirmCallback();
    _fermerConfirmation();
});
document.getElementById('confirm-delete-no').addEventListener('click', _fermerConfirmation);
document.getElementById('confirm-delete-overlay').addEventListener('click', _fermerConfirmation);

function _getCacheComplet() {
    // Generer le snapshot complet comme pour le cache
    var data = _exportGetJSON();
    data.exclusions = [];
    for (var i = 0; i < editeur.exclusions.length; i++) {
        var ex = editeur.exclusions[i];
        var creation = null, exType = 'fenetre';
        if (ex.group3D && ex.group3D.userData.porteCreation) { exType = 'porte'; creation = JSON.parse(JSON.stringify(ex.group3D.userData.porteCreation)); }
        else if (ex.group3D && ex.group3D.userData.fenetreCreation) { exType = 'fenetre'; creation = JSON.parse(JSON.stringify(ex.group3D.userData.fenetreCreation)); }
        data.exclusions.push({ _type: exType, _creation: creation });
    }
    data.placos = [];
    for (var i = 0; i < placoElements.length; i++) {
        var info = placoElements[i].userData.placoInfo;
        if (!info) continue;
        var cols = Placo.lireCouleurs(placoElements[i]);
        data.placos.push({ info: JSON.parse(JSON.stringify(info)), couleur: cols.placo, opacite: cols.opacite });
    }
    data.laines = [];
    for (var i = 0; i < laineElements.length; i++) {
        var info = laineElements[i].userData.laineInfo;
        if (!info) continue;
        var cols = LaineDeVerre.lireCouleurs(laineElements[i]);
        data.laines.push({ info: JSON.parse(JSON.stringify(info)), couleur: cols.laine, opacite: cols.opacite });
    }
    // Plinthes
    data.plinthes = [];
    for (var i = 0; i < plinthElements.length; i++) {
        var pk = plinthElements[i].userData.plinthInfo;
        if (pk) data.plinthes.push(JSON.parse(JSON.stringify(pk)));
    }
    // Carrelages
    data.carrelages = [];
    for (var i = 0; i < carrelageElements.length; i++) {
        var ck = carrelageElements[i].userData.carrelageInfo;
        if (ck) data.carrelages.push(JSON.parse(JSON.stringify(ck)));
    }
    // Papiers peints
    data.papiersPeints = [];
    for (var i = 0; i < ppElements.length; i++) {
        var ppk = ppElements[i].userData.papierPeintInfo;
        if (ppk) data.papiersPeints.push(JSON.parse(JSON.stringify(ppk)));
    }
    // Carrelage sol
    data.carrelagesSol = [];
    for (var i = 0; i < carrelageSolElements.length; i++) {
        var csk = carrelageSolElements[i].userData.csSol;
        if (csk) data.carrelagesSol.push(JSON.parse(JSON.stringify(csk)));
    }
    // Personnages
    data.personnages = [];
    sceneManager.scene.traverse(function(c) {
        if (c.userData && c.userData.isPersonnage && c.parent === sceneManager.scene && c.userData.persoInfo) {
            data.personnages.push(JSON.parse(JSON.stringify(c.userData.persoInfo)));
        }
    });
    data.camera = {
        px: sceneManager.camera.position.x, py: sceneManager.camera.position.y, pz: sceneManager.camera.position.z,
        tx: sceneManager.controls.target.x, ty: sceneManager.controls.target.y, tz: sceneManager.controls.target.z
    };
    data.toolbarTexte = document.getElementById('toolbar').classList.contains('mode-texte');
    return data;
}

function _chargerSlot(slotData) {
    // Nettoyer tout
    editeur.viderTout();
    while (editeur.exclusions.length > 0) editeur.supprimerExclusion(editeur.exclusions[0].id);
    while (editeur.traits.length > 0) editeur.supprimerTrait(editeur.traits[0].id);
    for (var i = 0; i < placoElements.length; i++) sceneManager.scene.remove(placoElements[i]);
    placoElements = [];
    for (var i = 0; i < laineElements.length; i++) sceneManager.scene.remove(laineElements[i]);
    laineElements = [];
    for (var i = 0; i < plinthElements.length; i++) sceneManager.scene.remove(plinthElements[i]);
    plinthElements = [];
    for (var i = 0; i < carrelageElements.length; i++) sceneManager.scene.remove(carrelageElements[i]);
    carrelageElements = [];
    for (var i = 0; i < ppElements.length; i++) sceneManager.scene.remove(ppElements[i]);
    ppElements = [];
    for (var i = 0; i < carrelageSolElements.length; i++) sceneManager.scene.remove(carrelageSolElements[i]);
    carrelageSolElements = [];
    var _persClean = [];
    sceneManager.scene.traverse(function(c) { if (c.userData && c.userData.isPersonnage && c.parent === sceneManager.scene) _persClean.push(c); });
    for (var i = 0; i < _persClean.length; i++) sceneManager.scene.remove(_persClean[i]);
    personnagesListe = [];
    for (var i = escalierElements.length - 1; i >= 0; i--) sceneManager.scene.remove(escalierElements[i]);
    escalierElements = [];
    for (var i = plafondElements.length - 1; i >= 0; i--) sceneManager.scene.remove(plafondElements[i]);
    plafondElements = [];

    // Murs
    if (slotData.murs) { for (var i = 0; i < slotData.murs.length; i++) editeur.ajouterMur(slotData.murs[i]); }
    // Traits
    if (slotData.traits) { for (var i = 0; i < slotData.traits.length; i++) { var t = editeur.ajouterTrait(slotData.traits[i]); t.line.visible = modeZones; } }
    // Zones
    if (slotData.piecesZones) piecesZones = JSON.parse(JSON.stringify(slotData.piecesZones));
    // Prix
    if (slotData.prix) {
        if (slotData.prix.briques) { for (var k in slotData.prix.briques) { if (PRIX_BRIQUES[k]) PRIX_BRIQUES[k].unite = slotData.prix.briques[k].unite; } }
        if (slotData.prix.placos) { for (var k in slotData.prix.placos) { if (PRIX_PLACOS[k]) PRIX_PLACOS[k].m2 = slotData.prix.placos[k].m2; } }
        if (slotData.prix.laines) { for (var k in slotData.prix.laines) { if (PRIX_LAINES[k]) PRIX_LAINES[k].m2 = slotData.prix.laines[k].m2; } }
        if (slotData.prix.portes) PRIX_PORTES = slotData.prix.portes;
        if (slotData.prix.fenetres) PRIX_FENETRES = slotData.prix.fenetres;
    }
    // Exclusions
    if (slotData.exclusions) {
        for (var i = 0; i < slotData.exclusions.length; i++) {
            var ex = slotData.exclusions[i];
            if (ex._creation) {
                var c = ex._creation;
                if (ex._type === 'porte') { porte.setCouleurs(c.couleurCadre, c.couleurPorte); porte.creer(c.modeleId, c.worldX, c.worldZ, c.y, c.largeur, c.hauteur, c.angle); }
                else { fenetre.setCouleurs(c.couleurCadre || '#4a90d9', c.couleurVitre || '#87CEEB', c.opaciteVitre || 0.3); fenetre.creer(c.modeleId, c.worldX, c.worldZ, c.y, c.largeur, c.hauteur, c.angle); }
            }
        }
    }
    // Placos
    if (slotData.placos) {
        for (var i = 0; i < slotData.placos.length; i++) {
            var p = slotData.placos[i];
            placo.setCouleurs(p.couleur, p.opacite / 100);
            var g = placo.creer(null, p.info.worldX, p.info.worldZ, p.info.y, p.info.largeur, p.info.hauteur, p.info.angle, p.info.ep, p.info.side, p.info.murEpFull, p.info.extraBack || 0);
            placoElements.push(g);
        }
    }
    // Laines
    if (slotData.laines) {
        for (var i = 0; i < slotData.laines.length; i++) {
            var l = slotData.laines[i];
            laineDeVerre.setCouleurs(l.couleur, l.opacite / 100);
            var g = laineDeVerre.creer(null, l.info.worldX, l.info.worldZ, l.info.y, l.info.largeur, l.info.hauteur, l.info.angle, l.info.ep, l.info.side, l.info.murEpFull);
            laineElements.push(g);
        }
    }
    // Plinthes
    if (slotData.plinthes) {
        for (var i = 0; i < slotData.plinthes.length; i++) {
            var pk = slotData.plinthes[i];
            var pg = null;
            for (var p = 0; p < placoElements.length; p++) {
                var pgi = placoElements[p].userData.placoInfo;
                if (pgi && Math.abs(pgi.worldX - pk.placoWorldX) < 0.05 && Math.abs(pgi.worldZ - pk.placoWorldZ) < 0.05 && pgi.side === pk.side) { pg = placoElements[p]; break; }
            }
            if (pg) { plintheObj.setCouleur(pk.couleur); plinthElements.push(plintheObj.creer(pk.modeleId, pg.userData.placoInfo, pg)); }
        }
    }
    // Carrelages
    if (slotData.carrelages) {
        for (var i = 0; i < slotData.carrelages.length; i++) {
            var ck = slotData.carrelages[i];
            var pg = null;
            for (var p = 0; p < placoElements.length; p++) {
                var pgi = placoElements[p].userData.placoInfo;
                if (pgi && Math.abs(pgi.worldX - ck.placoWorldX) < 0.05 && Math.abs(pgi.worldZ - ck.placoWorldZ) < 0.05 && pgi.side === ck.side) { pg = placoElements[p]; break; }
            }
            if (pg) { carrelageObj.setCouleurs(ck.couleurCarreau, ck.couleurJoint); carrelageElements.push(carrelageObj.creer(ck.modeleId, pg.userData.placoInfo, pg)); }
        }
    }
    // Papiers peints
    if (slotData.papiersPeints) {
        for (var i = 0; i < slotData.papiersPeints.length; i++) {
            var ppk = slotData.papiersPeints[i];
            var pg = null;
            for (var p = 0; p < placoElements.length; p++) {
                var pgi = placoElements[p].userData.placoInfo;
                if (pgi && Math.abs(pgi.worldX - ppk.placoWorldX) < 0.05 && Math.abs(pgi.worldZ - ppk.placoWorldZ) < 0.05 && pgi.side === ppk.side) { pg = placoElements[p]; break; }
            }
            if (pg) { ppObj.setCouleurs(ppk.couleur1, ppk.couleur2); ppElements.push(ppObj.creer(ppk.modeleId, pg.userData.placoInfo, pg)); }
        }
    }
    // Carrelage sol
    if (slotData.carrelagesSol) {
        for (var i = 0; i < slotData.carrelagesSol.length; i++) {
            var csk = slotData.carrelagesSol[i];
            var mesh = _creerMeshSol(csk.points, csk.modeleId, csk.couleurCarreau, csk.couleurJoint, 0.002, 1.0, csk.tW, csk.tH, csk.contourCouleur || _csCouleurs[i % _csCouleurs.length], csk.jointEp, csk.angle, csk.showLabel);
            mesh.userData.csSol = JSON.parse(JSON.stringify(csk));
            mesh.userData.isCarrelageSol = true;
            sceneManager.scene.add(mesh);
            carrelageSolElements.push(mesh);
        }
    }
    // Personnages
    if (slotData.personnages) {
        for (var i = 0; i < slotData.personnages.length; i++) {
            var pi = slotData.personnages[i];
            var perso = personnage.creer(pi.couleurs, pi.worldX, pi.worldZ);
            perso.scale.setScalar(pi.taille || 1);
            perso.userData.persoInfo = JSON.parse(JSON.stringify(pi));
            personnagesListe.push(perso);
        }
    }
    // Escaliers
    for (var i = escalierElements.length - 1; i >= 0; i--) sceneManager.scene.remove(escalierElements[i]);
    escalierElements = [];
    if (slotData.escaliers) {
        for (var i = 0; i < slotData.escaliers.length; i++) {
            var ek = slotData.escaliers[i];
            escalierObj.setCouleurs(ek.couleurMarche || '#A0522D', ek.couleurRampe || '#666666');
            var g = escalierObj.creer(ek.modeleId, ek.worldX, ek.worldZ, ek.angle || 0, { largeur: ek.largeur, longueur: ek.longueur, hauteur: ek.hauteur, nbMarches: ek.nbMarches });
            escalierElements.push(g);
        }
    }
    // Plafonds
    for (var i = plafondElements.length - 1; i >= 0; i--) sceneManager.scene.remove(plafondElements[i]);
    plafondElements = [];
    if (slotData.plafonds) {
        for (var i = 0; i < slotData.plafonds.length; i++) {
            var pk = slotData.plafonds[i];
            var g = _creerPlafond(pk.points, pk.hauteur, pk.ep, pk.couleurDalle, pk.couleurPoteau, pk.avecPoteaux);
            plafondElements.push(g);
        }
    }
    // Camera
    if (slotData.camera) {
        sceneManager.camera.position.set(slotData.camera.px, slotData.camera.py, slotData.camera.pz);
        sceneManager.controls.target.set(slotData.camera.tx, slotData.camera.ty, slotData.camera.tz);
        sceneManager.controls.update();
    }
    // Toolbar
    if (slotData.toolbarTexte) document.getElementById('toolbar').classList.add('mode-texte');
    else document.getElementById('toolbar').classList.remove('mode-texte');
    // Rafraichir
    if (modeZones || piecesZones.length > 0) {
        _afficherPiecesFermees();
        if (modeZones) _mettreAJourPanelZones();
    }
}

var _savesMode = 'save'; // 'save' ou 'load'

function _afficherSavesPanel(mode) {
    _savesMode = mode || 'save';
    var panel = document.getElementById('saves-panel');
    var overlay = document.getElementById('saves-overlay');
    var slotsDiv = document.getElementById('saves-slots');
    slotsDiv.innerHTML = '';

    // Style des onglets
    var tabSave = document.getElementById('saves-tab-save');
    var tabLoad = document.getElementById('saves-tab-load');
    if (_savesMode === 'save') {
        tabSave.style.background = '#FFD700'; tabSave.style.color = '#000'; tabSave.style.border = 'none';
        tabLoad.style.background = '#16213e'; tabLoad.style.color = '#43B047'; tabLoad.style.border = '1px solid #43B047';
    } else {
        tabLoad.style.background = '#43B047'; tabLoad.style.color = '#000'; tabLoad.style.border = 'none';
        tabSave.style.background = '#16213e'; tabSave.style.color = '#FFD700'; tabSave.style.border = '1px solid #FFD700';
    }

    if (_savesMode === 'save') {
        // MODE SAUVEGARDER
        sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
        var currentImg = sceneManager.renderer.domElement.toDataURL('image/jpeg', 0.5);

        var previewDiv = document.createElement('div');
        previewDiv.style.cssText = 'text-align:center; margin-bottom:14px; background:#111; border-radius:8px; padding:8px;';
        previewDiv.innerHTML = '<img src="' + currentImg + '" style="max-width:100%; max-height:150px; border-radius:6px;">';
        slotsDiv.appendChild(previewDiv);

        var nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'margin-bottom:12px;';
        nameDiv.innerHTML =
            '<label style="color:#888; font-size:10px; display:block; margin-bottom:4px;">Nom de la sauvegarde</label>' +
            '<input type="text" id="save-filename" value="construction-' + new Date().toISOString().slice(0,10) + '" style="width:100%; padding:8px; background:#16213e; color:#FFD700; border:1px solid #FFD700; border-radius:6px; font-family:monospace; font-size:12px; box-sizing:border-box;">';
        slotsDiv.appendChild(nameDiv);

        var statsDiv = document.createElement('div');
        statsDiv.style.cssText = 'color:#888; font-size:10px; margin-bottom:12px; padding:8px; background:rgba(255,215,0,0.05); border-radius:6px;';
        statsDiv.textContent = editeur.elements.length + ' murs | ' + editeur.exclusions.length + ' ouvertures | ' + placoElements.length + ' placos | ' + laineElements.length + ' laines | ' + editeur.traits.length + ' traits';
        slotsDiv.appendChild(statsDiv);

        var saveBtn = document.createElement('button');
        saveBtn.style.cssText = 'width:100%; padding:12px; background:#FFD700; color:#000; border:none; border-radius:8px; cursor:pointer; font-family:monospace; font-size:14px; font-weight:bold;';
        saveBtn.textContent = 'Sauvegarder dans le projet';
        saveBtn.addEventListener('click', function() {
            var data = _getCacheComplet();
            data._date = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
            data._image = currentImg;
            var name = document.getElementById('save-filename').value || 'construction';
            var formData = new FormData();
            formData.append('action', 'save');
            formData.append('name', name);
            formData.append('data', JSON.stringify(data));
            fetch('api/saves.php', { method: 'POST', body: formData })
                .then(function(r) { return r.json(); })
                .then(function(res) {
                    if (res.ok) {
                        document.getElementById('info-bar').textContent = 'Sauvegarde "' + name + '" enregistree dans constructions/';
                        _afficherSavesPanel('save');
                    } else {
                        document.getElementById('info-bar').textContent = 'Erreur : ' + (res.error || '?');
                    }
                })
                .catch(function(e) { document.getElementById('info-bar').textContent = 'Erreur serveur : ' + e.message; });
        });
        slotsDiv.appendChild(saveBtn);

        // Liste des fichiers existants en dessous
        var listTitle = document.createElement('div');
        listTitle.style.cssText = 'color:#888; font-size:10px; margin-top:14px; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;';
        listTitle.textContent = 'Fichiers existants';
        slotsDiv.appendChild(listTitle);

        var listDiv = document.createElement('div');
        listDiv.id = 'saves-file-list';
        listDiv.style.cssText = 'max-height:200px; overflow-y:auto;';
        listDiv.innerHTML = '<div style="color:#555; text-align:center; padding:8px;">Chargement...</div>';
        slotsDiv.appendChild(listDiv);

        // Charger la liste
        _chargerListeFichiers(listDiv, 'save', currentImg);

    } else {
        // MODE CHARGER — liste des fichiers du projet
        var listTitle = document.createElement('div');
        listTitle.style.cssText = 'color:#43B047; font-size:11px; margin-bottom:8px; font-weight:bold;';
        listTitle.textContent = 'Fichiers dans constructions/';
        slotsDiv.appendChild(listTitle);

        var listDiv = document.createElement('div');
        listDiv.id = 'saves-file-list';
        listDiv.style.cssText = 'max-height:400px; overflow-y:auto;';
        listDiv.innerHTML = '<div style="color:#555; text-align:center; padding:20px;">Chargement...</div>';
        slotsDiv.appendChild(listDiv);

        _chargerListeFichiers(listDiv, 'load', null);
    }

    panel.style.display = 'block';
    overlay.style.display = 'block';
}

function _chargerListeFichiers(container, mode, currentImg) {
    fetch('api/saves.php?action=list')
        .then(function(r) { return r.json(); })
        .then(function(res) {
            container.innerHTML = '';
            if (!res.ok || !res.files || res.files.length === 0) {
                container.innerHTML = '<div style="color:#555; text-align:center; padding:12px;">Aucun fichier sauvegarde</div>';
                return;
            }
            for (var i = 0; i < res.files.length; i++) {
                var f = res.files[i];
                var slot = document.createElement('div');
                var accentCol = mode === 'save' ? '#FFD700' : '#43B047';
                slot.style.cssText = 'display:flex; gap:10px; align-items:center; padding:8px; margin-bottom:4px; border:1px solid #333; border-radius:6px; background:rgba(' + (mode === 'save' ? '255,215,0' : '67,176,71') + ',0.04); transition:all 0.15s;';
                slot.onmouseover = function() { this.style.borderColor = accentCol; this.style.background = 'rgba(' + (mode === 'save' ? '255,215,0' : '67,176,71') + ',0.1)'; };
                slot.onmouseout = function() { this.style.borderColor = '#333'; this.style.background = 'rgba(' + (mode === 'save' ? '255,215,0' : '67,176,71') + ',0.04)'; };

                var imgHtml = f.image
                    ? '<img src="' + f.image + '" style="width:100%;height:100%;object-fit:cover;">'
                    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#555;font-size:10px;">?</div>';

                // Stats depuis la validation
                var st = f.stats || {};
                var statsLine = (st.murs || f.nbMurs || 0) + ' murs';
                if (st.exclusions || f.nbExcl) statsLine += ' | ' + (st.exclusions || f.nbExcl) + ' ouv.';
                if (st.placos || f.nbPlacos) statsLine += ' | ' + (st.placos || f.nbPlacos) + ' placos';
                if (st.laines || f.nbLaines) statsLine += ' | ' + (st.laines || f.nbLaines) + ' laines';
                if (st.traits || f.nbTraits) statsLine += ' | ' + (st.traits || f.nbTraits) + ' traits';

                // Indicateur de validite
                var validIcon, validColor, validTip;
                if (f.valide) {
                    validIcon = '✓';
                    validColor = '#43B047';
                    validTip = 'Format valide';
                    if (f.warnings && f.warnings.length > 0) {
                        validIcon = '⚠';
                        validColor = '#ffa500';
                        validTip = f.warnings.join(', ');
                    }
                } else {
                    validIcon = '✗';
                    validColor = '#e94560';
                    validTip = (f.erreurs || []).join(', ');
                    // Fichier invalide = bordure rouge
                    slot.style.borderColor = '#e94560';
                }

                slot.innerHTML =
                    '<div style="width:80px; height:48px; background:#111; border-radius:4px; overflow:hidden; flex-shrink:0; position:relative;">' + imgHtml +
                    '<span style="position:absolute; top:2px; right:3px; font-size:10px; color:' + validColor + ';" title="' + validTip + '">' + validIcon + '</span></div>' +
                    '<div style="flex:1; min-width:0;">' +
                    '<div style="color:' + accentCol + '; font-size:11px; font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + f.name + '</div>' +
                    '<div style="color:#888; font-size:9px; margin-top:2px;">' + f.date + ' | ' + (f.sizeHuman || '') + '</div>' +
                    '<div style="color:#666; font-size:9px; margin-top:1px;">' + statsLine + '</div>' +
                    (f.valide === false ? '<div style="color:#e94560; font-size:8px; margin-top:2px;">' + (f.erreurs || []).join(' | ') + '</div>' : '') +
                    '</div>' +
                    '<div style="display:flex; flex-direction:column; gap:3px; flex-shrink:0;" class="slot-actions"></div>';

                var actionsDiv = slot.querySelector('.slot-actions');
                var isValide = f.valide !== false;

                if (mode === 'load') {
                    // Charger
                    var loadBtn = document.createElement('button');
                    if (isValide) {
                        loadBtn.style.cssText = 'padding:4px 10px; background:#43B047; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:monospace; font-size:9px; font-weight:bold;';
                    } else {
                        loadBtn.style.cssText = 'padding:4px 10px; background:#333; color:#666; border:none; border-radius:4px; cursor:not-allowed; font-family:monospace; font-size:9px; font-weight:bold;';
                    }
                    loadBtn.textContent = isValide ? 'Charger' : 'Invalide';
                    loadBtn.setAttribute('data-name', f.name);
                    if (isValide) {
                        loadBtn.onclick = function() {
                            var name = this.getAttribute('data-name');
                            fetch('api/saves.php?action=load&name=' + encodeURIComponent(name))
                                .then(function(r) { return r.json(); })
                                .then(function(data) {
                                    if (data.ok === false) { document.getElementById('info-bar').textContent = 'Erreur : ' + (data.error || '?'); return; }
                                    _chargerSlot(data);
                                    document.getElementById('saves-panel').style.display = 'none';
                                    document.getElementById('saves-overlay').style.display = 'none';
                                    document.getElementById('info-bar').textContent = '"' + name + '" charge !';
                                });
                        };
                    }
                    actionsDiv.appendChild(loadBtn);

                    // Animation
                    var animBtn = document.createElement('button');
                    if (isValide) {
                        animBtn.style.cssText = 'padding:4px 10px; background:#16213e; color:#43B047; border:1px solid #43B047; border-radius:4px; cursor:pointer; font-family:monospace; font-size:8px;';
                    } else {
                        animBtn.style.cssText = 'padding:4px 10px; background:#16213e; color:#444; border:1px solid #333; border-radius:4px; cursor:not-allowed; font-family:monospace; font-size:8px;';
                    }
                    animBtn.textContent = '▶ Anim';
                    animBtn.setAttribute('data-name', f.name);
                    if (isValide) {
                        animBtn.onclick = function() {
                            var name = this.getAttribute('data-name');
                            fetch('api/saves.php?action=load&name=' + encodeURIComponent(name))
                                .then(function(r) { return r.json(); })
                                .then(function(data) {
                                    if (data.ok === false) return;
                                    _chargerSlot(data);
                                    document.getElementById('saves-panel').style.display = 'none';
                                    document.getElementById('saves-overlay').style.display = 'none';
                                    setTimeout(function() { simDemarrer(); }, 300);
                                });
                        };
                    }
                    actionsDiv.appendChild(animBtn);
                }

                // Supprimer (dans les 2 modes)
                var delBtn = document.createElement('button');
                delBtn.style.cssText = 'padding:4px 10px; background:transparent; color:#e94560; border:1px solid #e94560; border-radius:4px; cursor:pointer; font-family:monospace; font-size:8px;';
                delBtn.textContent = 'Suppr';
                delBtn.setAttribute('data-name', f.name);
                delBtn.setAttribute('data-img', f.image || '');
                delBtn.onclick = function() {
                    var name = this.getAttribute('data-name');
                    var img = this.getAttribute('data-img') || null;
                    _confirmerSuppression('Supprimer "' + name + '" ?', img, function() {
                        var fd = new FormData();
                        fd.append('action', 'delete');
                        fd.append('name', name);
                        fetch('api/saves.php', { method: 'POST', body: fd })
                            .then(function() { _afficherSavesPanel(_savesMode); });
                    });
                };
                actionsDiv.appendChild(delBtn);

                container.appendChild(slot);
            }
        })
        .catch(function(e) {
            container.innerHTML = '<div style="color:#e94560; text-align:center; padding:12px;">Erreur : ' + e.message + '</div>';
        });
}

document.getElementById('btn-saves').addEventListener('click', function() {
    _afficherSavesPanel('save');
});
document.getElementById('saves-tab-save').addEventListener('click', function() {
    _afficherSavesPanel('save');
});
document.getElementById('saves-tab-load').addEventListener('click', function() {
    _afficherSavesPanel('load');
});
// Vider la scene actuelle (cache auto) — ne touche PAS aux blocs sauvegardes
document.getElementById('saves-tab-clear-scene').addEventListener('click', function() {
    _confirmerSuppression('Vider la scene actuelle ?\nLes blocs sauvegardes ne seront pas touches.', null, function() {
        localStorage.removeItem('eleec_cache');
        editeur.viderTout();
        while (editeur.exclusions.length > 0) editeur.supprimerExclusion(editeur.exclusions[0].id);
        while (editeur.traits.length > 0) editeur.supprimerTrait(editeur.traits[0].id);
        for (var i = 0; i < placoElements.length; i++) sceneManager.scene.remove(placoElements[i]);
        placoElements = [];
        for (var i = 0; i < laineElements.length; i++) sceneManager.scene.remove(laineElements[i]);
        laineElements = [];
        piecesZones = [];
        editeur.ajouterMur({ couleur: '#8b6132', jointCouleur: '#000000', distance: 5, hauteur: 2.50, angle: 0, x: 0, y: 0, z: 0 });
        document.getElementById('saves-panel').style.display = 'none';
        document.getElementById('saves-overlay').style.display = 'none';
        if (modeZones) { _afficherPiecesFermees(); _mettreAJourPanelZones(); }
        document.getElementById('info-bar').textContent = 'Scene videe — les blocs sauvegardes sont intacts';
    });
});

// Vider TOUT (scene + tous les blocs)
document.getElementById('saves-tab-clear-all').addEventListener('click', function() {
    _confirmerSuppression('Vider la scene ET supprimer tous les blocs sauvegardes ?', null, function() {
        localStorage.removeItem('eleec_cache');
        for (var s = 0; s < SAVES_MAX; s++) localStorage.removeItem('eleec_slot_' + s);
        editeur.viderTout();
        while (editeur.exclusions.length > 0) editeur.supprimerExclusion(editeur.exclusions[0].id);
        while (editeur.traits.length > 0) editeur.supprimerTrait(editeur.traits[0].id);
        for (var i = 0; i < placoElements.length; i++) sceneManager.scene.remove(placoElements[i]);
        placoElements = [];
        for (var i = 0; i < laineElements.length; i++) sceneManager.scene.remove(laineElements[i]);
        laineElements = [];
        piecesZones = [];
        editeur.ajouterMur({ couleur: '#8b6132', jointCouleur: '#000000', distance: 5, hauteur: 2.50, angle: 0, x: 0, y: 0, z: 0 });
        document.getElementById('saves-panel').style.display = 'none';
        document.getElementById('saves-overlay').style.display = 'none';
        if (modeZones) { _afficherPiecesFermees(); _mettreAJourPanelZones(); }
        document.getElementById('info-bar').textContent = 'Tout vide — scene et blocs reinitialises';
    });
});
document.getElementById('saves-close').addEventListener('click', function() {
    document.getElementById('saves-panel').style.display = 'none';
    document.getElementById('saves-overlay').style.display = 'none';
});
document.getElementById('saves-overlay').addEventListener('click', function() {
    document.getElementById('saves-panel').style.display = 'none';
    document.getElementById('saves-overlay').style.display = 'none';
});

// ========================================
// BOUSSOLE 3D — orientation camera
// ========================================
(function() {
    var canvas = document.getElementById('boussole-canvas');
    var ctx = canvas.getContext('2d');
    var W = 120, H = 120, cx = W / 2, cy = H / 2, R = 45;

    // Les 6 directions + haut/bas
    var directions = [
        { label: 'N', color: '#e94560', angle: 0,   camX: 0, camY: 6, camZ: -15 },
        { label: 'S', color: '#43B047', angle: 180, camX: 0, camY: 6, camZ: 15 },
        { label: 'E', color: '#4a9eff', angle: 90,  camX: 15, camY: 6, camZ: 0 },
        { label: 'O', color: '#ffa500', angle: 270, camX: -15, camY: 6, camZ: 0 },
        { label: 'NE', color: '#CE93D8', angle: 45,  camX: 10, camY: 6, camZ: -10 },
        { label: 'NO', color: '#FFD700', angle: 315, camX: -10, camY: 6, camZ: -10 },
        { label: 'SE', color: '#00BCD4', angle: 135, camX: 10, camY: 6, camZ: 10 },
        { label: 'SO', color: '#FF5722', angle: 225, camX: -10, camY: 6, camZ: 10 },
        { label: '⬆', color: '#fff',    angle: -1,  camX: 0, camY: 18, camZ: 0.01, isTop: true },
    ];

    // Zones cliquables
    var zones = [];

    function dessinerBoussole() {
        ctx.clearRect(0, 0, W, H);

        // Calculer l'angle de la camera par rapport au target
        var dx = sceneManager.camera.position.x - sceneManager.controls.target.x;
        var dz = sceneManager.camera.position.z - sceneManager.controls.target.z;
        var camAngle = Math.atan2(dx, -dz); // angle en radians, 0 = Nord

        // Fond cercle
        ctx.beginPath();
        ctx.arc(cx, cy, R + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15,15,35,0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cercle interieur
        ctx.beginPath();
        ctx.arc(cx, cy, R - 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();

        // Indicateur direction camera (trait epais)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        var indX = cx + Math.sin(camAngle) * (R - 8);
        var indY = cy - Math.cos(camAngle) * (R - 8);
        ctx.lineTo(indX, indY);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Dessiner les directions
        zones = [];
        for (var i = 0; i < directions.length; i++) {
            var d = directions[i];
            var px, py, radius;

            if (d.isTop) {
                // Bouton haut au centre
                px = cx;
                py = cy;
                radius = 10;
            } else {
                // Position sur le cercle, tournee selon la camera
                var rad = (d.angle * Math.PI / 180) - camAngle;
                px = cx + Math.sin(rad) * R;
                py = cy - Math.cos(rad) * R;
                radius = d.label.length > 1 ? 11 : 13;
            }

            // Cercle du bouton
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fillStyle = d.isTop ? 'rgba(255,255,255,0.1)' : 'rgba(30,30,60,0.9)';
            ctx.fill();
            ctx.strokeStyle = d.color;
            ctx.lineWidth = d.label === 'N' ? 2.5 : 1.5;
            ctx.stroke();

            // Texte
            ctx.fillStyle = d.color;
            ctx.font = (d.label.length > 1 ? '8' : '10') + 'px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.label, px, py + 1);

            zones.push({ x: px, y: py, r: radius, dir: d });
        }

        requestAnimationFrame(dessinerBoussole);
    }

    // Clic sur la boussole
    canvas.addEventListener('click', function(ev) {
        var rect = canvas.getBoundingClientRect();
        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;

        for (var i = 0; i < zones.length; i++) {
            var z = zones[i];
            var dx = mx - z.x, dy = my - z.y;
            if (Math.sqrt(dx * dx + dy * dy) < z.r + 2) {
                // Placer la camera dans cette direction
                var d = z.dir;
                var t = sceneManager.controls.target;
                sceneManager.camera.position.set(t.x + d.camX, d.camY, t.z + d.camZ);
                sceneManager.controls.update();
                return;
            }
        }
    });

    dessinerBoussole();
})();

// ========================================
// BOUTON TESTS — Lance les tests pas a pas avec apercu visuel
// ========================================
document.getElementById('btn-run-tests').addEventListener('click', function() {
    toutDesactiver();

    // Panneau lateral (pas overlay plein ecran — on voit la scene 3D)
    var panel = document.createElement('div');
    panel.id = 'test-panel';
    panel.style.cssText = 'position:fixed;top:10px;left:10px;width:340px;max-height:90vh;overflow-y:auto;background:rgba(10,10,30,0.95);border:2px solid #43B047;border-radius:12px;padding:14px;font-family:monospace;font-size:11px;color:#fff;z-index:100;box-shadow:0 4px 30px rgba(0,0,0,0.6);';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<span style="font-size:14px;font-weight:bold;color:#43B047;">Tests en cours...</span>' +
        '<button id="test-close" style="background:#e94560;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-family:monospace;font-size:11px;">X</button></div>' +
        '<div id="test-progress" style="background:#222;border-radius:4px;height:6px;margin-bottom:10px;"><div id="test-bar" style="background:#43B047;height:100%;border-radius:4px;width:0%;transition:width 0.3s;"></div></div>' +
        '<div id="test-status" style="color:#aaa;margin-bottom:8px;font-size:10px;">Demarrage...</div>' +
        '<div id="test-live"></div>';
    document.body.appendChild(panel);

    document.getElementById('test-close').addEventListener('click', function() {
        if (document.getElementById('test-panel')) document.body.removeChild(panel);
    });

    // Executer les tests pas a pas avec delai pour voir la scene
    var api = new TestAPI();
    // Description visuelle de chaque etape
    var _desc = {
        T01: 'Verification des 18 modeles de portes (id, nom, largeur, hauteur, icone)',
        T02: 'Verification des 8 modeles de fenetres',
        T03: 'Verification des modeles de placo (epaisseurs)',
        T04: 'Verification des modeles de laine de verre',
        T05: 'Verification des 6 modeles de plinthe (hauteur, epaisseur)',
        T06: 'Verification des 7 modeles de carrelage (taille carreaux)',
        T07: 'Verification des 11 motifs de papier peint',
        T08: 'Construction de murs a 8 ANGLES (0, 45, 90, 135, 180, 225, 270, 315)',
        T09: 'Construction de murs DISTANCES : 0.5m, 1m, 2m, 3m, 5m, 8m, 12m',
        T10: 'Construction de murs HAUTEURS : 0.5m, 1m, 1.5m, 2m, 2.5m, 3m, 4m',
        T11: 'Test des 8 TYPES DE BRIQUES (standard, pleine, creuse, platriere, parpaing, beton, monomur, pierre)',
        T12: 'Placement de murs a 5 POSITIONS differentes X/Z',
        T13: 'SUPPRESSION murs : milieu, premier, dernier, tout',
        T14: 'MUR BICOLORE : 2 couches de briques differentes',
        T15: 'MUR CARRE polygone (nbCotes=4)',
        T16: 'MUR HEXAGONE polygone (nbCotes=6)',
        T17: 'MUR TRIANGLE polygone (nbCotes=3)',
        T18: 'DEPLACER un mur (x, z)',
        T19: 'PIVOTER un mur (+45 puis -45)',
        T20: 'REDIMENSIONNER un mur (debut/fin)',
        T21: 'TROU RECTANGULAIRE dans un mur + 2eme trou',
        T22: 'TROU ROND + TROU ARRONDI dans un mur',
        T23: 'GROUPER 2 murs ensemble',
        T24: 'DEGROUPER + DEPLACER + PIVOTER un groupe',
        T25: 'EXTREMITES d\'un mur (x1,z1,x2,z2)',
        T26: 'COMPTER les briques total',
        T27: 'TRAITS AU SOL : creer, supprimer',
        T28: 'DETECTER PIECES FERMEES (4 murs carres)',
        T29: 'UNDO : sauvegarder, annuler, verifier',
        T30: 'UNDO MULTIPLE : 3 actions, 3 undo, 2 redo',
        T31: 'Pose des 18 PORTES sur un grand mur',
        T32: 'COULEURS PORTE : cadre rouge, panneau vert',
        T33: 'Pose des 8 FENETRES',
        T34: 'COULEURS FENETRE : cadre + vitre',
        T35: 'LAINE sur 4 murs (0, 90, 180, 270)',
        T36: 'PLACO tous angles + cote DEVANT / DERRIERE',
        T37: 'Tous les 6 modeles de PLINTHE',
        T38: 'PLINTHE : position collee + COULEUR',
        T39: 'Tous les 7 modeles de CARRELAGE + performance',
        T40: 'Tous les 11 motifs de PAPIER PEINT + performance',
        T41: 'COULEUR carrelage : carreau + joint',
        T42: 'COULEUR papier peint : couleur1 + couleur2',
        T43: 'COULEUR placo : rouge, vert, opacite',
        T44: 'COULEUR laine',
        T45: 'PERSONNAGES : 3 positions differentes',
        T46: 'GHOSTS (previews) : placo, laine, plinthe, carrelage, papier peint',
        T47: 'SUPPRESSION un de chaque type',
        T48: 'VIDER TOUT : chaque type a zero',
        T49: 'SCENE MANAGER : ciel, sol, lumiere, camera, grille',
        T50: 'PLATEAU : redimensionner le sol',
        T51: 'PIECE FERMEE : pose LAINE sur les 4 murs + detection piece',
        T52: 'PIECE FERMEE : pose PLACO sur les 4 murs (par dessus laine)',
        T53: 'PIECE FERMEE : verification COINS (pas superposes, laine/placo separes)',
        T54: 'PIECE FERMEE : PLINTHE + CARRELAGE sur les 4 placos, verification collee',
        T55: 'PIECE COMPLETE : 4 murs + porte + fenetre + laine + placo + plinthe + carrelage + PP + perso',
        T56: 'SUPERPOSITION : tags uniques par type (mur/placo/laine/porte/plinthe/carrelage/PP/perso)',
        T57: 'EXPORT / IMPORT JSON editeur',
        T58: 'SNAPSHOT complet avec tous elements',
        T59: 'VIDER + RESTORE : tout revient identique',
        T60: 'SAVE/LOAD JSON complet : serialize + parse + charger',
        T61: 'NETTOYAGE FINAL : scene vide, 0 partout'
    };

    // Lister toutes les methodes Txx_ de l'API
    var steps = [];
    var allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(api));
    allMethods.sort();
    for (var i = 0; i < allMethods.length; i++) {
        var m = allMethods[i];
        if (m.charAt(0) === 'T' && m.charAt(3) === '_' && typeof api[m] === 'function') {
            var code = m.substring(0, 3);
            steps.push({ nom: m, desc: _desc[code] || m, fn: (function(meth) { return function() { api[meth](); }; })(m) });
        }
    }

    var stepIndex = 0;
    var lastResultIndex = 0;
    var delay = 800; // ms entre chaque etape — assez pour voir la scene

    function _runNextStep() {
        if (!document.getElementById('test-panel')) return; // panel ferme

        if (stepIndex >= steps.length) {
            // Termine — afficher resume
            var pct = api.results.length > 0 ? Math.round(api.passed / api.results.length * 100) : 0;
            document.getElementById('test-bar').style.width = '100%';
            document.getElementById('test-bar').style.background = api.failed === 0 ? '#43B047' : '#e94560';
            document.getElementById('test-status').innerHTML =
                '<span style="font-size:13px;font-weight:bold;color:' + (api.failed === 0 ? '#43B047' : '#e94560') + ';">' +
                (api.failed === 0 ? 'TOUS LES TESTS PASSES' : api.failed + ' ECHEC(S)') +
                '</span> — ' + api.passed + '/' + (api.passed + api.failed) + ' (' + pct + '%)';
            document.querySelector('#test-panel > div:first-child > span').textContent = api.failed === 0 ? 'Tests OK' : api.failed + ' echec(s)';
            document.querySelector('#test-panel > div:first-child > span').style.color = api.failed === 0 ? '#43B047' : '#e94560';
            window.testAPI = api;
            return;
        }

        var step = steps[stepIndex];

        // Mettre a jour le status + barre info
        document.getElementById('test-status').innerHTML =
            '<div style="color:#43B047;font-weight:bold;">Etape ' + (stepIndex + 1) + '/' + steps.length + ' : ' + step.nom + '</div>' +
            '<div style="color:#aaa;font-size:10px;margin-top:2px;">' + step.desc + '</div>';
        document.getElementById('test-bar').style.width = Math.round((stepIndex / steps.length) * 100) + '%';
        document.getElementById('info-bar').textContent = 'TEST ' + (stepIndex + 1) + '/' + steps.length + ' — ' + step.desc;

        // Executer l'etape (avec try/catch pour ne pas bloquer)
        try {
            step.fn();
        } catch(err) {
            api._log('ERREUR ' + step.nom, false, err.message || String(err));
            console.error('Test erreur:', step.nom, err);
        }

        // Afficher les nouveaux resultats dans le panneau live
        var liveDiv = document.getElementById('test-live');
        var newResults = api.results.slice(lastResultIndex);
        for (var i = 0; i < newResults.length; i++) {
            var r = newResults[i];
            var div = document.createElement('div');
            if (r.section) {
                div.style.cssText = 'color:#43B047;font-weight:bold;font-size:11px;margin-top:8px;margin-bottom:2px;padding:2px 0;border-bottom:1px solid #333;';
                div.textContent = r.nom;
            } else {
                div.style.cssText = 'padding:2px 4px;border-left:3px solid ' + (r.ok ? '#43B047' : '#e94560') + ';margin:1px 0;background:rgba(255,255,255,0.02);font-size:10px;';
                div.innerHTML = '<span style="color:' + (r.ok ? '#43B047' : '#e94560') + ';">' + (r.ok ? '✓' : '✗') + '</span> ' +
                    '<span style="color:#ccc;">' + r.nom + '</span>' +
                    (r.detail ? ' <span style="color:#666;">— ' + r.detail + '</span>' : '');
            }
            liveDiv.appendChild(div);
        }
        lastResultIndex = api.results.length;

        // Scroller en bas
        liveDiv.scrollTop = liveDiv.scrollHeight;
        panel.scrollTop = panel.scrollHeight;

        stepIndex++;
        setTimeout(_runNextStep, delay);
    }

    setTimeout(_runNextStep, 200);
});

// ========================================
// CLIC DROIT — Escaliers & Plafonds
// ========================================

sceneManager.renderer.domElement.addEventListener('contextmenu', function(ev) {
    if (modeEscalier || modePlafond4pts) return;

    var rect = sceneManager.renderer.domElement.getBoundingClientRect();
    var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(mx, my), sceneManager.camera);
    var hits = _filtrerIntersections(rc.intersectObjects(sceneManager.scene.children, true));

    for (var i = 0; i < hits.length; i++) {
        var ud = hits[i].object.userData;
        if (!ud) continue;

        // Escalier
        if (ud.isEscalier) {
            ev.preventDefault();
            var obj = hits[i].object;
            while (obj.parent && obj.parent !== sceneManager.scene) obj = obj.parent;
            window._ctxEscalierGroup = obj;
            var menu = document.getElementById('ctx-escalier-menu');
            menu.style.left = ev.clientX + 'px';
            menu.style.top = ev.clientY + 'px';
            menu.style.display = 'block';
            var mr = menu.getBoundingClientRect();
            if (mr.right > window.innerWidth) menu.style.left = (window.innerWidth - mr.width - 5) + 'px';
            if (mr.bottom > window.innerHeight) menu.style.top = (window.innerHeight - mr.height - 5) + 'px';
            return;
        }

        // Plafond
        if (ud.isPlafond) {
            ev.preventDefault();
            var obj = hits[i].object;
            while (obj.parent && obj.parent !== sceneManager.scene) obj = obj.parent;
            window._ctxPlafondGroup = obj;
            var menu = document.getElementById('ctx-plafond-menu');
            menu.style.left = ev.clientX + 'px';
            menu.style.top = ev.clientY + 'px';
            menu.style.display = 'block';
            var mr = menu.getBoundingClientRect();
            if (mr.right > window.innerWidth) menu.style.left = (window.innerWidth - mr.width - 5) + 'px';
            if (mr.bottom > window.innerHeight) menu.style.top = (window.innerHeight - mr.height - 5) + 'px';
            return;
        }
    }
});
