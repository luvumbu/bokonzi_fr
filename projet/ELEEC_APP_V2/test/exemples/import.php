<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Exemple 26 - Import JSON</title>
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
            background: #e94560;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #panneau button:hover { background: #ff6b81; }
        #panneau .info { margin-top: 10px; color: #aaa; font-size: 12px; }
    </style>
</head>
<body>

    <div id="panneau">
        <strong>Import JSON</strong><br><br>

        <button id="btn-palais">Charger Palais</button>
        <button id="btn-chateau">Charger Chateau Princesse</button>
        <button id="btn-maison">Charger Maison Simple</button>
        <button id="btn-maison80">Charger Maison 80m2</button>
        <button id="btn-fichier">Choisir un fichier...</button>
        <input type="file" id="file-input" accept=".json" style="display:none">
        <button id="btn-vider">Vider la scene</button>

        <div class="info" id="info-result"></div>
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

    var sceneManager = new SceneManager(document.getElementById('canvas-container'));
    sceneManager.setCielDegrade('#0044AA', '#87CEEB');
    sceneManager.setCamera(25, 15, 25);
    sceneManager.setCible(6, 2, 6);
    sceneManager.setPlateau(50, 50);

    var mursCharges = [];

    // Afficher les infos
    function afficherInfos(murs, data) {
        var total = 0;
        for (var i = 0; i < murs.length; i++) {
            total += murs[i].compter();
        }
        var nom = data.nom || 'Sans nom';
        document.getElementById('info-result').innerHTML =
            nom + '<br>' +
            murs.length + ' elements<br>' +
            total + ' briques';
    }

    // Vider tout
    function viderScene() {
        for (var i = 0; i < mursCharges.length; i++) {
            mursCharges[i].vider();
            sceneManager.scene.remove(mursCharges[i].group);
        }
        mursCharges = [];
        document.getElementById('info-result').innerHTML = '';
    }

    // Charger depuis une URL
    function chargerURL(url) {
        viderScene();
        Brique.importer(sceneManager.scene, url, function(murs, data) {
            mursCharges = murs;
            afficherInfos(murs, data);
        });
    }

    // Charger depuis un fichier local
    function chargerFichier(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            viderScene();
            var data = JSON.parse(e.target.result);

            // Meme logique que Brique.importer mais avec les donnees directes
            for (var m = 0; m < data.murs.length; m++) {
                var def = data.murs[m];
                var brique = new Brique(sceneManager.scene);

                if (def.couleur) brique.setCouleur(def.couleur);
                if (def.jointCouleur !== undefined) brique.setCouleurJoint(def.jointCouleur);
                if (def.dimensions) brique.setDimensions(def.dimensions[0], def.dimensions[1], def.dimensions[2]);
                if (def.joint) brique.setJoint(def.joint);
                if (def.vertical) brique.setVertical(def.vertical);
                if (def.ignorer) brique.setIgnorer(def.ignorer[0], def.ignorer[1]);
                if (def.priorite) brique.setPriorite(def.priorite);

                if (def.trous) {
                    for (var t = 0; t < def.trous.length; t++) {
                        var tr = def.trous[t];
                        brique.ajouterTrou(tr.x || 0, tr.y || 0, tr.largeur, tr.hauteur, tr.alignement || null, tr.decalage || 0, tr.mur || 0);
                    }
                }

                if (def.nbCotes && def.nbCotes > 1) {
                    brique.construireForme(def.x || 0, def.y || 0, def.z || 0, def.distance, def.hauteur, def.nbCotes, def.angleDepart || 0);
                } else {
                    brique.construire(def.x || 0, def.y || 0, def.z || 0, def.distance, def.hauteur, def.angle || 0);
                }

                mursCharges.push(brique);
            }

            afficherInfos(mursCharges, data);
        };
        reader.readAsText(file);
    }

    // --- Boutons ---

    // Charger le palais
    document.getElementById('btn-palais').addEventListener('click', function() {
        chargerURL('../../constructions/palais.json');
    });

    // Charger le chateau princesse
    document.getElementById('btn-chateau').addEventListener('click', function() {
        sceneManager.setCamera(35, 25, 35);
        sceneManager.setCible(7.5, 4, 7.5);
        chargerURL('../../constructions/chateau-princesse.json');
    });

    // Charger la maison simple
    document.getElementById('btn-maison').addEventListener('click', function() {
        sceneManager.setCamera(18, 10, 18);
        sceneManager.setCible(5, 2, 4);
        chargerURL('../../constructions/maison-simple.json');
    });

    // Charger la maison 80m2
    document.getElementById('btn-maison80').addEventListener('click', function() {
        sceneManager.setCamera(18, 12, 18);
        sceneManager.setCible(5, 2, 4);
        chargerURL('../../constructions/maison-80m2.json');
    });

    // Choisir un fichier
    document.getElementById('btn-fichier').addEventListener('click', function() {
        document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            chargerFichier(e.target.files[0]);
        }
    });

    // Vider
    document.getElementById('btn-vider').addEventListener('click', viderScene);

    </script>
</body>
</html>
