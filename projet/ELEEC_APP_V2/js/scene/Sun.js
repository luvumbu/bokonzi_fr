// ========================================
// Sun — Gere le soleil (lumiere + sphere visuelle)
// ========================================
//
// Utilisation :
//   var sun = new Sun(scene);
//
// Le constructeur cree la lumiere directionnelle + la sphere visuelle.
//
// Methodes publiques :
//   setPosition(x, y, z)      — deplacer le soleil (lumiere + sphere)
//   setIntensite(val)          — intensite de la lumiere (0 a 2)
//   setCouleur(couleur)        — couleur de la lumiere (ex: '#FFFFFF')
//   setTaille(rayon)           — taille de la sphere visible
//   setHalo(opacity)           — opacite du halo (0 = invisible, 1 = opaque)
//   setVisible(visible)        — montrer/cacher la sphere (true/false)
//   setOmbres(actif)           — activer/desactiver les ombres (true/false)
//

class Sun {

    // ========================================
    // Constructeur — cree lumiere + sphere visuelle
    // ========================================
    constructor(scene) {
        this.scene = scene;

        // Lumiere directionnelle
        this.light = new THREE.DirectionalLight(0xffffff, 0.8);
        this.light.position.set(20, 25, -15);
        this.light.castShadow = true;
        this.scene.add(this.light);

        // Sphere visuelle (groupe : sphere + halo)
        this.helper = new THREE.Group();

        // Sphere centrale — petite, jaune doux
        this.sphereGeo = new THREE.SphereGeometry(0.15, 12, 12);
        this.sphereMat = new THREE.MeshBasicMaterial({ color: 0xFFDD44 });
        this.sphere = new THREE.Mesh(this.sphereGeo, this.sphereMat);
        this.helper.add(this.sphere);

        // Halo — lueur subtile autour
        this.haloGeo = new THREE.SphereGeometry(0.4, 12, 12);
        this.haloMat = new THREE.MeshBasicMaterial({
            color: 0xFFEE88,
            transparent: true,
            opacity: 0.08
        });
        this.halo = new THREE.Mesh(this.haloGeo, this.haloMat);
        this.helper.add(this.halo);

        // Positionner la sphere au meme endroit que la lumiere
        this.helper.position.copy(this.light.position);
        this.scene.add(this.helper);
    }

    // ========================================
    // Methodes publiques
    // ========================================

    // Deplacer le soleil — lumiere + sphere suivent ensemble
    setPosition(x, y, z) {
        this.light.position.set(x, y, z);
        this.helper.position.set(x, y, z);
    }

    // Intensite de la lumiere — 0 = eteint, 1 = normal, 2 = fort
    setIntensite(val) {
        this.light.intensity = val;
    }

    // Couleur de la lumiere — ex: '#FFAA00' pour coucher de soleil
    setCouleur(couleur) {
        this.light.color.set(couleur);
        this.sphereMat.color.set(couleur);
    }

    // Taille de la sphere visible — rayon en metres
    setTaille(rayon) {
        this.helper.remove(this.sphere);
        this.sphereGeo.dispose();
        this.sphereGeo = new THREE.SphereGeometry(rayon, 12, 12);
        this.sphere = new THREE.Mesh(this.sphereGeo, this.sphereMat);
        this.helper.add(this.sphere);

        this.helper.remove(this.halo);
        this.haloGeo.dispose();
        this.haloGeo = new THREE.SphereGeometry(rayon * 2.5, 12, 12);
        this.halo = new THREE.Mesh(this.haloGeo, this.haloMat);
        this.helper.add(this.halo);
    }

    // Opacite du halo — 0 = invisible, 0.08 = subtil, 0.3 = visible
    setHalo(opacity) {
        this.haloMat.opacity = opacity;
    }

    // Montrer ou cacher la sphere visuelle
    setVisible(visible) {
        this.helper.visible = visible;
    }

    // Activer ou desactiver les ombres
    setOmbres(actif) {
        this.light.castShadow = actif;
    }
}
