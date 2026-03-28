// ========================================
// SceneManager — Gere la scene 3D
// ========================================
//
// Utilisation :
//   var sceneManager = new SceneManager(container);
//
// Le constructeur initialise tout : scene, camera, renderer,
// controles, lumieres, sol et grille, redimensionnement, boucle de rendu.
//
// Methodes publiques :
//   add(objet)                        — ajouter un objet 3D a la scene
//   remove(objet)                     — supprimer un objet 3D de la scene
//   setCouleurCiel(couleur)           — couleur unie du ciel (ex: '#FF0000')
//   setCielDegrade(haut, bas)         — degrade du ciel (haut vers bas)
//   setCouleurSol(couleur)            — couleur du sol
//   setAmbiante(intensite)            — intensite lumiere ambiante (0 a 2)
//   setSoleil(intensite)              — intensite lumiere soleil (0 a 2)
//   setPositionSoleil(x, y, z)       — position du soleil dans la scene
//   setCamera(x, y, z)               — position de la camera
//   setCible(x, y, z)                — point que la camera regarde
//   setGrille(visible)               — montrer/cacher la grille (true/false)
//   setPlateau(casesX, casesZ, tailleCasse) — plateau rectangulaire
//                                       casesX = nb cases en largeur
//                                       casesZ = nb cases en profondeur
//                                       tailleCasse = taille d'une case en metres (defaut 1m)
//

class SceneManager {

    // ========================================
    // Constructeur — initialise toute la scene
    // ========================================
    constructor(container) {
        this.scene = null;       // THREE.Scene
        this.camera = null;      // THREE.PerspectiveCamera
        this.renderer = null;    // THREE.WebGLRenderer
        this.controls = null;    // THREE.OrbitControls
        this.ambiant = null;     // THREE.AmbientLight
        this.sol = null;         // THREE.Mesh (plan horizontal)
        this.grille = null;      // THREE.GridHelper ou THREE.Group (lignes)
        this.sun = null;         // Sun (classe separee)
        this.axes = null;        // Axes (classe separee)
        this.brouillard = null;  // Brouillard (classe separee)

        this._initScene();
        this._initCamera();
        this._initRenderer(container);
        this._initControls();
        this._initLumieres();
        this._initSol();
        this._initResize();
        this._animate();
    }

    // ========================================
    // Methodes privees — initialisation
    // ========================================

    // Cree la scene avec un ciel bleu par defaut
    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
    }

    // Camera perspective — FOV 60, position (8, 6, 12)
    _initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(8, 6, 12);
    }

    // Renderer WebGL avec antialiasing et ombres douces
    _initRenderer(container) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;
        container.appendChild(this.renderer.domElement);
    }

    // Controles orbite — clic droit tourne, molette zoom vers curseur, clic milieu deplace
    _initControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(5, 1, 0);
        this.controls.mouseButtons = {
            LEFT: null,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };
        // Zoom vers le curseur (pas vers le centre)
        this.controls.enableZoom = false;
        var self = this;

        // Double-clic = recentrer la camera sur le point clique
        this.renderer.domElement.addEventListener('dblclick', function(ev) {
            var rect = self.renderer.domElement.getBoundingClientRect();
            var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
            var rc = new THREE.Raycaster();
            rc.setFromCamera(new THREE.Vector2(mx, my), self.camera);

            // Toucher un objet ou le sol
            var hits = rc.intersectObjects(self.scene.children, true);
            var point = null;
            for (var i = 0; i < hits.length; i++) {
                if (hits[i].distance > 0.1) { point = hits[i].point.clone(); break; }
            }
            if (!point) {
                var pt = new THREE.Vector3();
                rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
                if (pt) point = pt;
            }
            if (!point) return;

            // Garder la meme distance mais recentrer
            var dist = self.camera.position.distanceTo(self.controls.target);
            var dir = self.camera.position.clone().sub(self.controls.target).normalize();
            self.controls.target.copy(point);
            self.camera.position.copy(point).add(dir.multiplyScalar(dist));
            self.controls.update();
        });

        this.renderer.domElement.addEventListener('wheel', function(ev) {
            ev.preventDefault();

            // Raycast sous le curseur pour trouver le point cible
            var rect = self.renderer.domElement.getBoundingClientRect();
            var mx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
            var my = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
            var rc = new THREE.Raycaster();
            rc.setFromCamera(new THREE.Vector2(mx, my), self.camera);

            // Point sous le curseur (objet ou sol)
            var target = null;
            var hits = rc.intersectObjects(self.scene.children, true);
            for (var i = 0; i < hits.length; i++) {
                if (hits[i].distance > 0.1) { target = hits[i].point.clone(); break; }
            }
            if (!target) {
                var pt = new THREE.Vector3();
                rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt);
                if (pt) target = pt;
            }
            if (!target) return;

            // Facteur de zoom : on rapproche camera ET cible du point sous le curseur
            var factor = ev.deltaY > 0 ? 0.15 : -0.15;
            // Limiter pour ne pas traverser le point
            if (factor < 0) {
                var distToTarget = self.camera.position.distanceTo(target);
                if (distToTarget < 0.3) return; // trop pres, stop
            }

            self.camera.position.lerp(target, -factor);
            self.controls.target.lerp(target, -factor);
            self.controls.update();
        }, { passive: false });
    }

    // Lumiere ambiante (0.4) + soleil via classe Sun
    _initLumieres() {
        this.ambiant = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambiant);

        this.sun = new Sun(this.scene);
        this.axes = new Axes(this.scene);
    }

    // Sol gris 50x50m + grille 50 divisions (1m par case)
    _initSol() {
        var solGeo = new THREE.PlaneGeometry(50, 50);
        var solMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
        this.sol = new THREE.Mesh(solGeo, solMat);
        this.sol.rotation.x = -Math.PI / 2;
        this.sol.receiveShadow = true;
        this.scene.add(this.sol);

        this.grille = new THREE.GridHelper(50, 50, 0x888888, 0x444444);
        this.grille.position.y = 0.001;
        this.scene.add(this.grille);
    }

    // Redimensionne le renderer quand la fenetre change de taille
    _initResize() {
        var self = this;
        window.addEventListener('resize', function() {
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Boucle de rendu — tourne a chaque frame
    _animate() {
        var self = this;
        requestAnimationFrame(function() { self._animate(); });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this._updateInfo();
    }

    // Affiche les coordonnees camera/cible en bas a droite (temps reel)
    _updateInfo() {
        if (!this._infoDiv) {
            this._infoDiv = document.createElement('div');
            this._infoDiv.style.cssText = 'position:fixed;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:10px;border-radius:6px;font-family:monospace;font-size:12px;z-index:10;';
            document.body.appendChild(this._infoDiv);
        }
        var c = this.camera.position;
        var t = this.controls.target;
        this._infoDiv.innerHTML =
            'Camera X: ' + c.x.toFixed(1) + ' Y: ' + c.y.toFixed(1) + ' Z: ' + c.z.toFixed(1) + '<br>' +
            'Cible  X: ' + t.x.toFixed(1) + ' Y: ' + t.y.toFixed(1) + ' Z: ' + t.z.toFixed(1);
    }

    // ========================================
    // Methodes publiques
    // ========================================

    // Ajouter un objet 3D a la scene
    add(objet) {
        this.scene.add(objet);
    }

    // Supprimer un objet 3D de la scene
    remove(objet) {
        this.scene.remove(objet);
    }

    // Couleur unie du ciel — ex: setCouleurCiel('#FF0000')
    setCouleurCiel(couleur) {
        this.scene.background = new THREE.Color(couleur);
    }

    // Degrade du ciel — couleurHaut en haut, couleurBas en bas
    // ex: setCielDegrade('#0044AA', '#87CEEB')
    setCielDegrade(couleurHaut, couleurBas) {
        var canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, couleurHaut);
        gradient.addColorStop(1, couleurBas);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 512);
        var texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
    }

    // Couleur du sol — ex: setCouleurSol('#333333')
    setCouleurSol(couleur) {
        this.sol.material.color.set(couleur);
    }

    // Intensite de la lumiere ambiante — 0 = noir, 1 = normal, 2 = fort
    setAmbiante(intensite) {
        this.ambiant.intensity = intensite;
    }

    // Intensite du soleil — 0 = eteint, 1 = normal, 2 = fort
    setSoleil(intensite) {
        this.sun.setIntensite(intensite);
    }

    // Position du soleil — change la direction des ombres + deplace la sphere
    setPositionSoleil(x, y, z) {
        this.sun.setPosition(x, y, z);
    }

    // Position de la camera — ex: setCamera(15, 10, 20)
    setCamera(x, y, z) {
        this.camera.position.set(x, y, z);
    }

    // Point que la camera regarde — ex: setCible(0, 0, 0)
    setCible(x, y, z) {
        this.controls.target.set(x, y, z);
    }

    // Montrer ou cacher la grille — setGrille(true) ou setGrille(false)
    setGrille(visible) {
        this.grille.visible = visible;
    }

    // Plateau rectangulaire avec cases de taille fixe
    // casesX    = nombre de cases en largeur
    // casesZ    = nombre de cases en profondeur
    // tailleCasse = taille d'une case en metres (defaut 1m)
    // ex: setPlateau(10, 8, 1) = 10m x 8m avec cases de 1m
    setPlateau(casesX, casesZ, tailleCasse) {
        tailleCasse = tailleCasse || 1;
        var largeur = casesX * tailleCasse;
        var profondeur = casesZ * tailleCasse;

        // Garder la couleur avant de supprimer
        var couleur = this.sol.material.color.getHex();

        // Supprimer l'ancien sol et grille
        this.sol.geometry.dispose();
        this.sol.material.dispose();
        this.scene.remove(this.sol);
        if (this.grille) {
            if (this.grille.geometry) this.grille.geometry.dispose();
            this.scene.remove(this.grille);
        }

        // Nouveau sol rectangulaire
        this.sol = new THREE.Mesh(
            new THREE.PlaneGeometry(largeur, profondeur),
            new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.9 })
        );
        this.sol.rotation.x = -Math.PI / 2;
        this.sol.receiveShadow = true;
        this.scene.add(this.sol);

        // Grille rectangulaire — lignes manuelles pour supporter les rectangles
        this.grille = new THREE.Group();
        var lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });

        // Lignes horizontales (le long de X)
        for (var i = 0; i <= casesZ; i++) {
            var z = -profondeur / 2 + i * tailleCasse;
            var points = [
                new THREE.Vector3(-largeur / 2, 0, z),
                new THREE.Vector3(largeur / 2, 0, z)
            ];
            var geo = new THREE.BufferGeometry().setFromPoints(points);
            this.grille.add(new THREE.Line(geo, lineMat));
        }

        // Lignes verticales (le long de Z)
        for (var j = 0; j <= casesX; j++) {
            var x = -largeur / 2 + j * tailleCasse;
            var points = [
                new THREE.Vector3(x, 0, -profondeur / 2),
                new THREE.Vector3(x, 0, profondeur / 2)
            ];
            var geo = new THREE.BufferGeometry().setFromPoints(points);
            this.grille.add(new THREE.Line(geo, lineMat));
        }

        this.grille.position.y = 0.001;
        this.scene.add(this.grille);

        console.log('Plateau : ' + casesX + 'x' + casesZ + ' cases de ' + tailleCasse + 'm = ' + largeur + 'm x ' + profondeur + 'm');
    }

}
