<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Exemple 26 - Ajouter / Detruire des briques</title>
    <link rel="stylesheet" href="../../css/style.css">
    <style>
        #panneau {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 15px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
            z-index: 10;
        }
        #panneau button {
            margin: 5px 2px;
            padding: 8px 12px;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #panneau button.actif { outline: 3px solid #fff; }
        .btn-ajouter { background: #43B047; }
        .btn-ajouter:hover { background: #5CD160; }
        .btn-detruire { background: #e94560; }
        .btn-detruire:hover { background: #ff6b81; }
        .btn-neutre { background: #555; }
        .btn-neutre:hover { background: #777; }
        #panneau .info { margin-top: 10px; color: #aaa; font-size: 12px; }
    </style>
</head>
<body>

    <div id="panneau">
        <strong>Ajouter / Detruire</strong><br><br>

        <button id="btn-ajouter" class="btn-ajouter">Ajouter</button>
        <button id="btn-detruire" class="btn-detruire">Detruire</button>
        <button id="btn-rien" class="btn-neutre">Orbiter</button>

        <div class="info" id="info">Mode : Orbiter (clic = tourner la camera)</div>
        <div class="info" id="compteur"></div>
    </div>

    <div id="canvas-container"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script src="../../js/scene/Sun.js"></script>
    <script src="../../js/scene/Axes.js"></script>
    <script src="../../js/scene/Brouillard.js"></script>
    <script src="../../js/scene/SceneManager.js"></script>
    <script src="../../js/engine/Brique.js"></script>
    <script>

    // --- Scene ---
    var sceneManager = new SceneManager(document.getElementById('canvas-container'));
    sceneManager.setCielDegrade('#0044AA', '#87CEEB');
    sceneManager.setCamera(8, 6, 8);
    sceneManager.setCible(2.5, 1, 2.5);
    sceneManager.setPlateau(20, 20);

    // --- Construire un mur de test ---
    var mur = new Brique(sceneManager.scene);
    mur.setCouleur('#8b6132');
    mur.setCouleurJoint('#000000');
    mur.ajouterTrou(0, 0, 0.90, 2.15, 'center', 0, 0);
    mur.ajouterTrou(0, 0.90, 1.00, 1.00, 'end', -0.3, 0);
    mur.construire(0, 0, 0, 5, 2.50, 0);

    // --- Mode ---
    var mode = 'orbiter'; // 'ajouter', 'detruire', 'orbiter'

    function setMode(m) {
        mode = m;
        document.getElementById('btn-ajouter').classList.remove('actif');
        document.getElementById('btn-detruire').classList.remove('actif');
        document.getElementById('btn-rien').classList.remove('actif');

        if (m === 'ajouter') {
            document.getElementById('btn-ajouter').classList.add('actif');
            document.getElementById('info').textContent = 'Mode : AJOUTER (clic sur une face = poser une brique)';
            sceneManager.controls.enabled = false;
        } else if (m === 'detruire') {
            document.getElementById('btn-detruire').classList.add('actif');
            document.getElementById('info').textContent = 'Mode : DETRUIRE (clic sur une brique = la supprimer)';
            sceneManager.controls.enabled = false;
        } else {
            document.getElementById('btn-rien').classList.add('actif');
            document.getElementById('info').textContent = 'Mode : Orbiter (clic = tourner la camera)';
            sceneManager.controls.enabled = true;
        }
        majCompteur();
    }

    function majCompteur() {
        document.getElementById('compteur').textContent = 'Briques : ' + mur.compter();
    }

    document.getElementById('btn-ajouter').addEventListener('click', function() { setMode('ajouter'); });
    document.getElementById('btn-detruire').addEventListener('click', function() { setMode('detruire'); });
    document.getElementById('btn-rien').addEventListener('click', function() { setMode('orbiter'); });

    // --- Raycaster ---
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();

    document.getElementById('canvas-container').addEventListener('click', function(e) {
        if (mode === 'orbiter') return;

        var rect = sceneManager.renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneManager.camera);
        var intersects = raycaster.intersectObjects(sceneManager.scene.children, true);

        if (intersects.length === 0) return;

        var hit = intersects[0];

        if (mode === 'detruire') {
            if (hit.object.isInstancedMesh) {
                mur.detruireBrique(hit.object, hit.instanceId);
            } else if (hit.object.userData && hit.object.userData.isManual) {
                hit.object.geometry.dispose();
                hit.object.parent.remove(hit.object);
                mur._nbBriques--;
            }
        } else if (mode === 'ajouter') {
            mur.ajouterBrique(hit);
        }

        majCompteur();
    });

    majCompteur();
    setMode('orbiter');

    </script>
</body>
</html>
