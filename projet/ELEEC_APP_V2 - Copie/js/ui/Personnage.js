// ========================================
// Personnage — Classe de creation de personnages reperes
// ========================================

class Personnage {

    constructor(scene) {
        this.scene = scene;
        this.hauteur = 1.70;
    }

    // Creer un personnage 3D avec les couleurs specifiees
    creer(couleurs, worldX, worldZ) {
        couleurs = couleurs || Personnage.couleursDefaut();
        var perso = new THREE.Group();

        var matCorps = new THREE.MeshStandardMaterial({ color: couleurs.haut, roughness: 0.6 });
        var matPeau = new THREE.MeshStandardMaterial({ color: couleurs.peau, roughness: 0.5 });
        var matPantalon = new THREE.MeshStandardMaterial({ color: couleurs.bas, roughness: 0.6 });
        var matChaussure = new THREE.MeshStandardMaterial({ color: couleurs.chaussures, roughness: 0.7 });
        var matCheveux = new THREE.MeshStandardMaterial({ color: couleurs.cheveux, roughness: 0.6 });

        // Chaussures
        var chG = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.14), matChaussure);
        chG.position.set(-0.05, 0.02, 0.01); perso.add(chG);
        var chD = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.14), matChaussure);
        chD.position.set(0.05, 0.02, 0.01); perso.add(chD);

        // Jambes
        var jG = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), matPantalon);
        jG.position.set(-0.05, 0.265, 0); perso.add(jG);
        var jD = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), matPantalon);
        jD.position.set(0.05, 0.265, 0); perso.add(jD);

        // Bassin
        var bassin = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.12), matPantalon);
        bassin.position.set(0, 0.54, 0); perso.add(bassin);

        // Torse
        var torse = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.12), matCorps);
        torse.position.set(0, 0.82, 0); perso.add(torse);

        // Bras gauche + main (colles au corps)
        var bG = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.06), matCorps);
        bG.position.set(-0.14, 0.82, 0); perso.add(bG);
        var mG = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.05), matPeau);
        mG.position.set(-0.14, 0.59, 0); perso.add(mG);

        // Bras droit + main (colles au corps)
        var bD = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.06), matCorps);
        bD.position.set(0.14, 0.82, 0); perso.add(bD);
        var mD = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.05), matPeau);
        mD.position.set(0.14, 0.59, 0); perso.add(mD);

        // Cou
        var cou = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.07, 8), matPeau);
        cou.position.set(0, 1.05, 0); perso.add(cou);

        // Tete
        var tete = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), matPeau);
        tete.position.set(0, 1.16, 0); perso.add(tete);

        // Cheveux
        var cheveux = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matCheveux);
        cheveux.position.set(0, 1.17, 0); perso.add(cheveux);

        // Yeux
        var matYeux = new THREE.MeshBasicMaterial({ color: '#222' });
        var oG = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), matYeux);
        oG.position.set(-0.035, 1.19, 0.085); perso.add(oG);
        var oD = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), matYeux);
        oD.position.set(0.035, 1.19, 0.085); perso.add(oD);

        // Sourire
        var sc = new THREE.EllipseCurve(0, 0, 0.03, 0.015, Math.PI * 0.1, Math.PI * 0.9, false);
        var smile = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(sc.getPoints(10)),
            new THREE.LineBasicMaterial({ color: '#222' })
        );
        smile.position.set(0, 1.165, 0.095); perso.add(smile);

        // Etiquette 1.70m
        var canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 32;
        var ctx2d = canvas.getContext('2d');
        ctx2d.fillStyle = '#FF5722';
        ctx2d.font = 'bold 20px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.fillText('1.70m', 64, 22);
        var tex = new THREE.CanvasTexture(canvas);
        var etiq = new THREE.Mesh(
            new THREE.PlaneGeometry(0.30, 0.08),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
        );
        etiq.position.set(0, 1.76, 0); perso.add(etiq);

        // Ligne repere
        var ligneGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.20, 1.70, 0),
            new THREE.Vector3(0.20, 1.70, 0)
        ]);
        perso.add(new THREE.Line(ligneGeo, new THREE.LineBasicMaterial({ color: '#FF5722' })));

        // Ombres + tag
        perso.traverse(function(c) {
            if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
            c.userData.isPersonnage = true;
        });

        // Positionner
        perso.position.set(worldX || 0, 0, worldZ || 0);
        this.scene.add(perso);

        return perso;
    }

    // Creer un ghost transparent
    creerGhost(couleurs) {
        var ghost = this.creer(couleurs, 0, 0);
        this.scene.remove(ghost); // on le retire, il sera ajoute manuellement
        ghost.traverse(function(c) {
            if (c.isMesh && c.material) {
                c.material = c.material.clone();
                c.material.transparent = true;
                c.material.opacity = 0.4;
            }
        });
        ghost.visible = false;
        return ghost;
    }

    // Couleurs par defaut
    static couleursDefaut() {
        return {
            peau: '#8B5E3C',
            cheveux: '#1a1a1a',
            haut: '#F0F0F0',
            bas: '#CC2222',
            chaussures: '#1a1a1a'
        };
    }

    // Lire les couleurs d'un personnage existant
    static lireCouleurs(group) {
        var couleurs = Personnage.couleursDefaut();
        group.traverse(function(c) {
            if (!c.isMesh || !c.material || !c.material.color) return;
            var hex = '#' + c.material.color.getHexString();
            var r = c.material.roughness;
            if (r === 0.5) couleurs.peau = hex;
            else if (r === 0.6 && c.geometry && c.geometry.type === 'SphereGeometry') couleurs.cheveux = hex;
            else if (r === 0.6 && c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y > 0.6) couleurs.haut = hex;
            else if (r === 0.6 && c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y <= 0.6) couleurs.bas = hex;
            else if (r === 0.7) couleurs.chaussures = hex;
        });
        return couleurs;
    }

    // Appliquer des couleurs a un personnage existant
    static changerCouleurs(group, couleurs) {
        group.traverse(function(c) {
            if (!c.isMesh || !c.material || !c.material.color) return;
            var r = c.material.roughness;
            if (r === 0.5) c.material.color.set(couleurs.peau);
            else if (r === 0.6 && c.geometry && c.geometry.type === 'SphereGeometry') c.material.color.set(couleurs.cheveux);
            else if (r === 0.6 && c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y > 0.6) c.material.color.set(couleurs.haut);
            else if (r === 0.6 && c.geometry && c.geometry.type === 'BoxGeometry' && c.position.y <= 0.6) c.material.color.set(couleurs.bas);
            else if (r === 0.7) c.material.color.set(couleurs.chaussures);
        });
    }
}
