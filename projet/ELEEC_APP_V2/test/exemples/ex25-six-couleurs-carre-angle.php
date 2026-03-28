<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Exemple 25 - Carre Mario angle (6 couleurs x 4 murs)</title>
    <link rel="stylesheet" href="../../css/style.css">
</head>
<body>
    <div id="titre" style="position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;padding:10px;border-radius:6px;font-family:monospace;font-size:14px;z-index:10;">Exemple 25 — Carre Mario angle (6 couleurs x 4 murs)</div>
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
    sceneManager.setCamera(12, 8, 12);
    sceneManager.setCible(2.5, 1, 2.5);

    // --- Couleur 1 : Rouge Mario (casquette) ---
    var mur_1 = new Brique(sceneManager.scene);
    mur_1.setCouleur('#E52521');
    mur_1.setCouleurJoint('#1A1A1A');
    mur_1.setIgnorer(6, 1);
    mur_1.setPriorite(1);
    mur_1.construireForme(0, 0, 0, 5, 2.50, 4, 45);

    // --- Couleur 2 : Bleu Mario (salopette) ---
    var mur_2 = new Brique(sceneManager.scene);
    mur_2.setCouleur('#049CD8');
    mur_2.setCouleurJoint(null);
    mur_2.setIgnorer(6, 2);
    mur_2.setPriorite(2);
    mur_2.construireForme(0, 0, 0, 5, 2.50, 4, 45);

    // --- Couleur 3 : Jaune (boutons/etoile) ---
    var mur_3 = new Brique(sceneManager.scene);
    mur_3.setCouleur('#FBD000');
    mur_3.setCouleurJoint(null);
    mur_3.setIgnorer(6, 3);
    mur_3.setPriorite(3);
    mur_3.construireForme(0, 0, 0, 5, 2.50, 4, 45);

    // --- Couleur 4 : Vert Luigi (tuyau) ---
    var mur_4 = new Brique(sceneManager.scene);
    mur_4.setCouleur('#43B047');
    mur_4.setCouleurJoint(null);
    mur_4.setIgnorer(6, 4);
    mur_4.setPriorite(4);
    mur_4.construireForme(0, 0, 0, 5, 2.50, 4, 45);

    // --- Couleur 5 : Marron (bloc ?) ---
    var mur_5 = new Brique(sceneManager.scene);
    mur_5.setCouleur('#A0522D');
    mur_5.setCouleurJoint(null);
    mur_5.setIgnorer(6, 5);
    mur_5.setPriorite(5);
    mur_5.construireForme(0, 0, 0, 5, 2.50, 4, 45);

    // --- Couleur 6 : Beige peau (visage) ---
    var mur_6 = new Brique(sceneManager.scene);
    mur_6.setCouleur('#FABB5A');
    mur_6.setCouleurJoint(null);
    mur_6.setIgnorer(6, 6);
    mur_6.setPriorite(6);
    mur_6.construireForme(0, 0, 0, 5, 2.50, 4, 45);

    </script>
</body>
</html>
