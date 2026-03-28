// ========================================
// Axes — Affiche les axes X Y Z en couleur
// ========================================
//
// Utilisation :
//   var axes = new Axes(scene);
//
// X = rouge (largeur)
// Y = vert (hauteur)
// Z = bleu (profondeur)
//
// Methodes publiques :
//   setVisible(visible)       — montrer/cacher les axes (true/false)
//   setTaille(longueur)       — longueur des axes en metres
//   setLabels(visible)        — montrer/cacher les lettres X Y Z
//

class Axes {

    // ========================================
    // Constructeur — cree les 3 axes + labels
    // ========================================
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.labels = [];
        this.longueur = 5;
        this.opacite = 1;

        this._creerAxes(this.longueur);
        this._creerLabels(this.longueur);

        this.scene.add(this.group);
    }

    // ========================================
    // Methodes privees
    // ========================================

    // Cree les 3 lignes colorees
    _creerAxes(longueur) {
        // X — rouge
        this._creerLigne(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(longueur, 0, 0),
            0xFF0000
        );

        // Y — vert
        this._creerLigne(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, longueur, 0),
            0x00FF00
        );

        // Z — bleu
        this._creerLigne(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, longueur),
            0x0000FF
        );
    }

    // Cree une ligne entre 2 points avec une couleur et opacite
    _creerLigne(debut, fin, couleur) {
        var geo = new THREE.BufferGeometry().setFromPoints([debut, fin]);
        var mat = new THREE.LineBasicMaterial({
            color: couleur,
            linewidth: 2,
            transparent: true,
            opacity: this.opacite
        });
        var ligne = new THREE.Line(geo, mat);
        ligne.userData.isAxeLine = true;
        this.group.add(ligne);
    }

    // Cree les lettres X Y Z au bout de chaque axe
    _creerLabels(longueur) {
        var labels = [
            { texte: 'X', couleur: '#FF0000', pos: new THREE.Vector3(longueur + 0.3, 0, 0) },
            { texte: 'Y', couleur: '#00FF00', pos: new THREE.Vector3(0, longueur + 0.3, 0) },
            { texte: 'Z', couleur: '#0000FF', pos: new THREE.Vector3(0, 0, longueur + 0.3) }
        ];

        for (var i = 0; i < labels.length; i++) {
            var sprite = this._creerTexteSprite(labels[i].texte, labels[i].couleur);
            sprite.position.copy(labels[i].pos);
            sprite.scale.set(0.5, 0.25, 1);
            this.group.add(sprite);
            this.labels.push(sprite);
        }
    }

    // Cree un sprite texte (toujours face a la camera)
    _creerTexteSprite(texte, couleur) {
        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        var ctx = canvas.getContext('2d');
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = couleur;
        ctx.textAlign = 'center';
        ctx.fillText(texte, 32, 24);

        var texture = new THREE.CanvasTexture(canvas);
        var mat = new THREE.SpriteMaterial({ map: texture });
        return new THREE.Sprite(mat);
    }

    // ========================================
    // Methodes publiques
    // ========================================

    // Montrer ou cacher les axes
    setVisible(visible) {
        this.group.visible = visible;
    }

    // Changer la longueur des axes
    setTaille(longueur) {
        this.scene.remove(this.group);
        this.group = new THREE.Group();
        this.labels = [];
        this.longueur = longueur;
        this._creerAxes(longueur);
        this._creerLabels(longueur);
        this.scene.add(this.group);
    }

    // Montrer ou cacher les lettres X Y Z
    setLabels(visible) {
        for (var i = 0; i < this.labels.length; i++) {
            this.labels[i].visible = visible;
        }
    }

    // Opacite des axes — 0 = invisible, 0.1 = subtil, 1 = plein
    setOpacite(val) {
        this.opacite = val;
        this.group.traverse(function(child) {
            if (child.material && child.userData.isAxeLine) {
                child.material.opacity = val;
                child.material.transparent = true;
            }
        });
    }
}
